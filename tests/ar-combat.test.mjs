import test from 'node:test';
import assert from 'node:assert/strict';
import {engine,canvas} from './helpers/game-fixture.mjs';
const fresh=(difficulty='normal',mission='patrol')=>{const f=engine('ar','game_ar',{difficulty});f.game.init({id:mission});f.game.eyeY=1.8;return f;};
const aim=(g,e)=>{g.player.yaw=Math.atan2(e.x-g.player.x,e.z-g.player.z);g.player.pitch=Math.atan2(e.y-g.eyeY,Math.hypot(e.x-g.player.x,e.z-g.player.z));};
test('combat: opening a mission and aiming never fire or pay automatically',()=>{
 const {game:g,advance}=fresh();for(let i=0;i<100;i++){advance(16.67);g.update(canvas(),390,844);}assert.equal(g.stats.shots,0);assert.equal(g.career.wins,0);assert.equal(g.ammo,30);
});
test('combat: only the aligned virtual target receives damage; walls occlude shots',()=>{
 const {game:g}=fresh();g.spawnWave();const e=g.enemies[0];g.covers=[];aim(g,e);g.shoot();assert.equal(e.hp,66);assert.equal(g.stats.hits,1);
 g.shotCooldown=0;g.player.yaw+=.4;g.shoot();assert.equal(e.hp,66);assert.equal(g.stats.hits,1);
 g.shotCooldown=0;aim(g,e);g.covers=[{x:(g.player.x+e.x)/2,z:e.z/2,w:12,d:4,h:8}];g.shoot();assert.equal(e.hp,66);
});
test('combat: magazine, timed reload and reserve prevent infinite ammunition',()=>{
 const {game:g}=fresh();g.ammo=1;g.shoot();assert.equal(g.ammo,0);g.shotCooldown=0;assert.equal(g.shoot(),false);assert(g.reloadTime>0);
 g.step(.5);assert.equal(g.ammo,0);g.step(2);assert.equal(g.ammo,30);assert.equal(g.reserve,150);assert.equal(g.stats.reloads,1);assert.equal(g.reload(),false);
});
test('combat: attacks are telegraphed, physical walls block them and held cover reduces damage',()=>{
 const {game:g}=fresh();g.spawnWave();g.covers=[];for(const e of g.enemies)e.aim=99;const e=g.enemies[0];e.aim=.1;g.step(.05);assert.equal(g.player.hp,100);g.step(.06);assert.equal(g.player.hp,88);
 g.player.hp=100;e.aim=0;g.coverHeld=true;g.step(.01);assert.equal(g.player.hp,97);assert.equal(g.stats.blocks,1);
 g.player.hp=100;e.aim=0;g.coverHeld=false;g.covers=[{x:e.x/2,z:e.z/2,w:20,d:4,h:8}];g.step(.01);assert.equal(g.player.hp,100);
});
test('combat: analog diagonal movement is normalized and aim axes remain independent',()=>{
 const {game:g}=fresh();g.covers=[];g.manualStick={x:1,y:1,active:true};g.aimStick={x:0,y:0};g.step(1);assert(Math.abs(Math.hypot(g.player.x,g.player.z)-6.5)<1e-8);
 g.manualStick={x:0,y:0};g.aimStick={x:1,y:1,active:true};const p={...g.player};g.step(.1);assert(g.player.yaw>p.yaw&&g.player.pitch>p.pitch);assert.equal(g.player.x,p.x);g.release();assert(!g.aimStick.active&&!g.manualStick.active&&!g.fireHeld);
});
test('combat: scene swipes follow both axes, do not drift and respect pause and camera mode',()=>{
 const {game:g,window}=fresh();g.covers=[];g.waveDelay=999;
 g.lookBy(80,-35,390,844);assert(g.player.yaw>0&&g.player.pitch>0);const p={...g.player};g.step(.1);assert.equal(g.player.yaw,p.yaw);assert.equal(g.player.pitch,p.pitch);
 const {game:other}=fresh();for(let i=0;i<8;i++)other.lookBy(10,-35/8,390,844);assert(Math.abs(g.player.yaw-other.player.yaw)<1e-10);assert(Math.abs(g.player.pitch-other.player.pitch)<1e-10);
 window.System.paused=true;g.lookBy(100,100,390,844);assert.equal(g.player.yaw,p.yaw);window.System.paused=false;
 g.handSession={};g.lookBy(100,100,390,844);assert.equal(g.player.yaw,p.yaw);assert.equal(g.setAiming(true),false);
 g.handSession=null;assert.equal(g.setAiming(true),true);g.release();assert.equal(g.aiming,false);
});
test('combat: ADS enlarges the scene while preserving reticle and actual hit alignment',()=>{
 const {game:g}=fresh();g.covers=[];g.spawnWave();const e=g.enemies[0];aim(g,e);
 const normal=g.project(e.x+1,e.y,e.z,390,844);assert.equal(g.targetAtAim(),e);assert.equal(g.stats.shots,0);
 g.setAiming(true);const zoom=g.project(e.x+1,e.y,e.z,390,844);assert(Math.abs((zoom.x-195)/(normal.x-195)-1.65)<1e-10);assert.equal(g.targetAtAim(),e);g.shoot();assert.equal(g.stats.hits,1);
 const yaw=g.player.yaw;g.lookBy(30,0,390,844);const zoomDelta=g.player.yaw-yaw;g.player.yaw=yaw;g.setAiming(false);g.lookBy(30,0,390,844);assert(Math.abs((g.player.yaw-yaw)/zoomDelta-1.65)<1e-10);
});
test('combat: every operation and difficulty can finish through actual shots, and defeat never unlocks weapons',()=>{
 for(const difficulty of ['easy','normal','hard'])for(const mission of ['patrol','city','extraction']){
  const {game:g}=fresh(difficulty,mission);g.covers=[];g.waveDelay=0;
  let steps=0;
  while(g.state==='PLAYING'&&steps++<10000){
   const e=g.enemies.find(e=>e.active);if(e){for(const enemy of g.enemies)enemy.aim=999;aim(g,e);g.shotCooldown=0;g.shoot();if(g.ammo===0){g.reload();g.step(g.gun.reload+.01);}}
   else{const p=g.objectivePoint(),dx=p.x-g.player.x,dz=p.z-g.player.z,n=Math.hypot(dx,dz);g.player.yaw=0;g.manualStick={x:n>2?dx/n:0,y:n>2?dz/n:0,active:n>2};g.step(.1);}
  }
  assert.equal(g.state,'VICTORY',difficulty+'/'+mission);assert.equal(g.wave,g.mission.waves);assert.equal(g.career.wins,1);assert.equal(g.stats.missions,1);assert(g.stats.hits>0);
 }
 const {game:g}=fresh();g.player.hp=0;g.step(.1);assert.equal(g.state,'DEFEAT');assert.equal(g.career.wins,0);assert.equal(g.selectWeapon('smg'),false);
});
test('combat: the front camera is a sensor and never replaces the battlefield',()=>{
 const {game:g,window}=fresh();const ctx=canvas();window.System.video={readyState:4,videoWidth:640,videoHeight:480};g.drawVirtualScene(ctx,390,844);assert(!ctx.operations.some(o=>o[0]==='drawImage'));
 window.ArcadeControls.mode='camera';g.drawVirtualScene(ctx,390,844);assert.equal(ctx.operations.filter(o=>o[0]==='drawImage').length,0);
});

test('combat: held automatic fire has the same cadence on 30, 60 and 120 Hz screens',()=>{
 const counts=[];for(const hz of [30,60,120]){const {game:g}=fresh();g.waveDelay=1000;g.ammo=1000;g.fireHeld=true;for(let i=0;i<hz*6;i++)g.step(1/hz);counts.push(g.stats.shots);}
 assert(Math.max(...counts)-Math.min(...counts)<=1,'Frame rate changed the weapon cadence: '+counts.join('/'));
});
test('combat: the visible soldier head and legs acquire the target; pointing above the silhouette never does',()=>{
 const {game:g}=fresh();g.covers=[];g.spawnWave();const e=g.enemies[0];g.enemies=[e];g.player.yaw=Math.atan2(e.x,e.z);const d=Math.hypot(e.x,e.z);
 for(const height of [.18,1.15,2.12]){g.player.pitch=Math.atan2(height-g.eyeY,d);assert.equal(g.targetAtAim(),e,'The visible body must match aiming at height '+height);}
 g.player.pitch=Math.atan2(2.8-g.eyeY,d);assert.equal(g.targetAtAim(),null);
});

test('combat: slow rendered frames preserve real reload duration, movement and weapon cadence',()=>{
 const counts=[];
 for(const hz of [5,10,30,60]){
  const {game:g,advance}=fresh();g.covers=[];g.waveDelay=999;g.ammo=1000;g.fireHeld=true;
  for(let i=0;i<hz*6;i++){advance(1000/hz);g.update(canvas(),390,844);}
  counts.push(g.stats.shots);
  g.fireHeld=false;g.ammo=1;g.reserve=60;g.reload();
  const start=g.elapsed;
  for(let i=0;i<Math.ceil(hz*1.8);i++){advance(1000/hz);g.update(canvas(),390,844);}
  assert.equal(g.ammo,30,'Reload must complete within 1.8 real seconds at '+hz+' FPS');
  assert(g.elapsed-start>=1.79&&g.elapsed-start<2.01);
  const before={...g.player};g.manualStick={x:0,y:1,active:true};
  for(let i=0;i<hz;i++){advance(1000/hz);g.update(canvas(),390,844);}
  assert(Math.abs(Math.hypot(g.player.x-before.x,g.player.z-before.z)-6.5)<1e-6,'Rendered FPS changed movement distance');
 }
 assert(Math.max(...counts)-Math.min(...counts)<=1,'Rendered FPS changed weapon cadence: '+counts);
});

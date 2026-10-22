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
test('combat: every operation and difficulty can finish through actual shots, and defeat never unlocks weapons',()=>{
 for(const difficulty of ['easy','normal','hard'])for(const mission of ['patrol','city','extraction']){
  const {game:g}=fresh(difficulty,mission);g.covers=[];g.waveDelay=0;
  let steps=0;
  while(g.state==='PLAYING'&&steps++<10000){
   const e=g.enemies.find(e=>e.active);if(e){for(const enemy of g.enemies)enemy.aim=999;aim(g,e);g.shotCooldown=0;g.shoot();if(g.ammo===0){g.reload();g.step(g.gun.reload+.01);}}
   else g.step(2.6);
  }
  assert.equal(g.state,'VICTORY',difficulty+'/'+mission);assert.equal(g.wave,g.mission.waves);assert.equal(g.career.wins,1);assert.equal(g.stats.missions,1);assert(g.stats.hits>0);
 }
 const {game:g}=fresh();g.player.hp=0;g.step(.1);assert.equal(g.state,'DEFEAT');assert.equal(g.career.wins,0);assert.equal(g.selectWeapon('smg'),false);
});
test('combat: camera backdrop uses video pixels only when explicitly selected and available',()=>{
 const {game:g,window}=fresh();const ctx=canvas();window.System.video={readyState:4,videoWidth:640,videoHeight:480};g.drawVirtualScene(ctx,390,844);assert(!ctx.operations.some(o=>o[0]==='drawImage'));
 window.ArcadeControls.mode='camera';g.drawVirtualScene(ctx,390,844);assert.equal(ctx.operations.filter(o=>o[0]==='drawImage').length,1);
});

test('combat: held automatic fire has the same cadence on 30, 60 and 120 Hz screens',()=>{
 const counts=[];for(const hz of [30,60,120]){const {game:g}=fresh();g.waveDelay=1000;g.ammo=1000;g.fireHeld=true;for(let i=0;i<hz*6;i++)g.step(1/hz);counts.push(g.stats.shots);}
 assert(Math.max(...counts)-Math.min(...counts)<=1,'Frame rate changed the weapon cadence: '+counts.join('/'));
});

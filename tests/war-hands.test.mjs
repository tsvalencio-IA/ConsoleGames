import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {engine,canvas} from './helpers/game-fixture.mjs';
const window={};vm.runInNewContext(readFileSync('games/ar/hand-controls.js','utf8'),{window,document:{baseURI:'http://test/',currentScript:null},URL});
const {AimController}=window.WarHandControl;
function hand(x=.5,y=.5){const p=Array.from({length:21},()=>({x,y,z:0}));p[0]={x,y:y+.12};p[5]={x:x-.035,y};p[9]={x,y:y-.02};p[17]={x:x+.05,y};return p;}
const result=(points,label='Left')=>({landmarks:[points],handedness:[[{categoryName:label,score:.95}]]});
function calibrated(){const c=new AimController();for(let t=0;t<=1100;t+=100)c.consume(result(hand()),t);assert.equal(c.state,'ready');return c;}
test('WAR hand: calibration needs a single stable hand and binds the presented right hand independently of mirror labels',()=>{
 const c=new AimController(),two={landmarks:[hand(.3),hand(.7)],handedness:[[{categoryName:'Left',score:.95}],[{categoryName:'Right',score:.95}]]};for(let t=0;t<2000;t+=100)c.consume(two,t);assert.equal(c.state,'calibrating');assert.equal(c.samples.length,0);
 for(let t=2000;t<3200;t+=100)c.consume(result(hand()),t);assert.equal(c.state,'ready');assert.equal(c.label,'Left');
});
test('WAR hand: front mirror moves the sight right when the visible hand moves right; axes and knuckle rotation respond',()=>{
 const c=calibrated();for(let t=1200;t<1800;t+=80)c.consume(result(hand(.38,.43)),t);assert(c.aim.x>.68&&c.aim.y<.4);
 const before=c.aim.x,p=hand(.38,.43);p[5].x-=.04;for(let t=1800;t<2300;t+=80)c.consume(result(p),t);assert(c.aim.x>before);
});
test('WAR hand: an opposite hand or stale video never substitutes for the bound right hand',()=>{
 const c=calibrated();c.consume(result(hand()),1200);assert(c.aim.fresh);c.consume(result(hand(),'Right'),1280);assert(!c.aim.fresh);
 c.consume(result(hand()),1360);assert(c.read(1600).fresh);assert(!c.read(1661).fresh);
});
test('WAR hand: two-hand grip stabilizes the same weapon without changing unlocks; losing the supporting hand restores one-hand aim',()=>{
 const c=calibrated(),two={landmarks:[hand(.5),hand(.62)],handedness:[[{categoryName:'Left',score:.95}],[{categoryName:'Right',score:.95}]]};for(let t=1200;t<1700;t+=80)c.consume(two,t);assert(c.aim.twoHands);c.consume(result(hand()),1780);assert(c.aim.fresh&&!c.aim.twoHands);
});
test('WAR hand: only an actual visible aligned adversary enables automatic shots, and hand loss stops damage and ammunition immediately',()=>{
 const f=engine('ar','game_ar'),g=f.game;g.init({id:'patrol'});g.spawnWave();g.covers=[];for(const e of g.enemies)e.aim=999;const e=g.enemies[1];g.player.yaw=Math.atan2(e.x,e.z);g.player.pitch=Math.atan2(e.y-1.8,Math.hypot(e.x,e.z));g.viewSize={w:390,h:844};g.handSession={dispose(){}};g.handAim={x:.5,y:.48,fresh:true};
 for(let i=0;i<20;i++){g.handAim.timestamp=1000+i*100;g.step(.016);}assert(g.stats.shots>0&&g.stats.hits>0);const shots=g.stats.shots;g.handAim.fresh=false;for(let i=0;i<100;i++)g.step(.016);assert.equal(g.stats.shots,shots);
 g.handAim={x:.9,y:.2,fresh:true};for(let i=0;i<40;i++)g.step(.016);assert.equal(g.stats.shots,shots);
});
test('WAR hand: inverse sight projection selects the same world target in portrait and landscape',()=>{
 const {game:g}=engine('ar','game_ar');g.init({id:'patrol'});g.covers=[];g.spawnWave();Object.assign(g.player,{yaw:.07,pitch:.05});const e=g.enemies[1];
 for(const [w,h]of [[390,844],[844,390]]){const p=g.project(e.x,e.y,e.z,w,h);g.viewSize={w,h};g.handAim={x:p.x/w,y:p.y/h,fresh:true};assert.equal(g.targetAtAim(),e);}
});
test('WAR hand: calibration freezes the mission rather than counting as defeat or skipping an operation',()=>{
 const {game:g}=engine('ar','game_ar');g.init({id:'city'});g.state='HAND_CALIBRATION';const ammo=g.ammo;for(let i=0;i<200;i++)g.step(.05);assert.equal(g.state,'HAND_CALIBRATION');assert.equal(g.elapsed,0);assert.equal(g.wave,0);assert.equal(g.ammo,ammo);
});
test('WAR hand: two confirmed aligned observations acquire the target even when render frames are slow; an actual missing hand clears acquisition',()=>{
 const {game:g}=engine('ar','game_ar');g.init({id:'patrol'});g.spawnWave();g.covers=[];g.viewSize={w:390,h:844};g.handSession={dispose(){}};g.enemies=g.enemies.slice(0,1);Object.assign(g.enemies[0],{x:0,y:1.8,z:30,aim:999});g.handAim={x:.5,y:.48,fresh:true,present:true,timestamp:1000};g.step(.016);assert.equal(g.stats.shots,0);
 g.handAim.fresh=false;g.step(.05);assert(g.handLock);g.handAim.fresh=true;g.handAim.timestamp=1420;g.step(.016);assert.equal(g.stats.shots,1);
 g.handAim.fresh=false;g.handAim.present=false;g.step(.05);assert.equal(g.handLock,null);g.handAim.fresh=true;g.handAim.present=true;g.handAim.timestamp=1900;g.step(.016);assert.equal(g.stats.shots,1);
});
test('WAR hand: inference latency pauses actions without discarding the first aligned observation before the next valid frame',()=>{
 const c=calibrated(),{game:g}=engine('ar','game_ar');g.init({id:'patrol'});g.spawnWave();g.covers=[];g.viewSize={w:844,h:390};g.handSession={dispose(){}};g.enemies=g.enemies.slice(0,1);Object.assign(g.enemies[0],{x:0,y:1.8,z:28,aim:999,hp:1000});
 c.maxAge=430;c.consume(result(hand()),1300);g.handAim=c.read(1592);g.step(.016);assert(g.handLock);assert.equal(g.stats.shots,0);
 const position={x:g.player.x,z:g.player.z};g.handAim=c.read(1740);assert.equal(g.handAim.fresh,false);g.step(.1);assert.equal(g.stats.shots,0);assert.deepEqual({x:g.player.x,z:g.player.z},position);assert(g.handLock,'waiting for inference must retain the first aligned observation');
 c.consume(result(hand()),1700);g.handAim=c.read(1992);g.step(.016);assert.equal(g.stats.shots,1);assert.equal(g.stats.hits,1);
 c.consume({landmarks:[],handedness:[]},2100);g.handAim=c.read(2100);g.step(.1);assert.equal(g.handLock,null);assert.equal(g.stats.shots,1);
});
test('WAR hand: an interrupted stream expires pending target acquisition and needs two new aligned observations',()=>{
 const c=calibrated(),{game:g}=engine('ar','game_ar');g.init({id:'patrol'});g.spawnWave();g.covers=[];g.viewSize={w:844,h:390};g.handSession={dispose(){}};g.enemies=g.enemies.slice(0,1);Object.assign(g.enemies[0],{x:0,y:1.8,z:28,aim:999,hp:1000});
 c.maxAge=430;c.consume(result(hand()),1300);g.handAim=c.read(1592);g.step(.016);assert(g.handLock);g.handAim=c.read(2600);assert.equal(g.handAim.fresh,false);assert.equal(g.handAim.present,false);g.step(.1);assert.equal(g.handLock,null);
 c.consume(result(hand()),2700);g.handAim=c.read(2992);g.step(.016);assert.equal(g.stats.shots,0);c.consume(result(hand()),3100);g.handAim=c.read(3392);g.step(.016);assert.equal(g.stats.shots,1);
});
test('WAR hand: neutral camera stays still, fresh body steps move, cover collides, and lost tracking stops movement',()=>{
 const {game:g}=engine('ar','game_ar');g.init({id:'patrol'});g.handSession={dispose(){}};g.handAim={x:.5,y:.48,fresh:true,present:true};g.waveDelay=999;g.covers=[];const start={...g.player};g.step(.2);assert.deepEqual({...g.player},start);g.bodyPose={fresh:true,moveX:1,moveZ:0,crouched:false};g.manualStick={x:-1,y:-1,active:true};g.step(.2);assert(g.player.x>start.x);assert.equal(g.player.z,start.z);assert(g.autoWalking);g.bodyPose.crouched=true;g.bodyPose.moveX=0;g.step(.2);assert.equal(g.eyeY,1.05);g.bodyPose.fresh=false;const stopped={...g.player};g.step(.2);assert.deepEqual({...g.player},stopped);g.bodyPose.fresh=true;g.bodyPose.moveZ=1;g.handAim.fresh=false;g.step(.2);assert.deepEqual({...g.player},stopped);g.handAim.fresh=true;g.state='VICTORY';g.resultTimer=10;g.step(.2);assert.deepEqual({...g.player},stopped);g.state='PLAYING';g.bodyPose.crouched=false;g.covers=[{x:g.player.x,z:g.player.z+1.5,w:4,d:1}];for(let i=0;i<120;i++)g.step(.016);assert(!g.covers.some(c=>Math.abs(g.player.x-c.x)<c.w/2+.35&&Math.abs(g.player.z-c.z)<c.d/2+.35));
});
test('WAR hand: the camera follows the calibrated hand in both axes and the reticle remains on its real forward ray',()=>{
 const {game:g}=engine('ar','game_ar');g.init({id:'patrol'});g.handSession={dispose(){}};g.handAim={x:.75,y:.25,fresh:true,present:true};g.waveDelay=999;g.covers=[];g.manualStick={x:-1,y:-1,active:true};g.aimStick={x:-1,y:-1,active:true};
 g.step(.25);assert(g.player.yaw>0&&g.player.pitch>0);assert(!g.autoWalking);assert.equal(g.aimRay().yaw,g.player.yaw);assert.equal(g.aimRay().pitch,g.player.pitch);
 const facing={yaw:g.player.yaw,pitch:g.player.pitch};for(let i=0;i<60;i++)g.step(1/60);assert.equal(g.player.yaw,facing.yaw);assert.equal(g.player.pitch,facing.pitch);g.handAim.x=.5;g.handAim.y=.48;g.step(.2);assert(Math.abs(g.player.yaw)<.001);assert(Math.abs(g.player.pitch)<.001);
});
test('WAR hand: neutral hand aiming and manual mode stay stationary without movement input',()=>{
 const {game:g}=engine('ar','game_ar');g.init({id:'patrol'});g.waveDelay=999;g.step(.5);assert.equal(g.player.z,0);g.handSession={dispose(){}};g.handAim={x:.7,y:.3,fresh:true};g.enemies=[{active:true,x:3,z:9,y:1.15,kind:'soldier',aim:999,flash:0,phase:0}];g.step(.2);assert.equal(g.player.z,0);assert(!g.autoWalking);
});

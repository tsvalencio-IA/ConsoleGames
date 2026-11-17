import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function aircraft(){
 let logic;let clock=0;
 const window={
  System:{registerGame(id,title,icon,g){if(id==='usarmy_flight_sim')logic=g},
   video:{videoWidth:640,videoHeight:480},playerLock:{snapshot(){return {status:'locked',hands:{left:'unknown',right:'unknown'}}}}},
  ArcadeControls:{mode:'camera'},ArcadePlaySettings:{get(){return {sensitivity:1}}},
 };
 vm.runInNewContext(fs.readFileSync('games/voo/js/game_flight.js','utf8'),{
  window,performance:{now:()=>clock},console,setInterval(){throw Error('registration interval unexpectedly required')}
 });
 assert.ok(logic,'native flight must register');
 const g=Object.create(logic);
 g.state='CALIBRATION';g.timer=2.5;g.lastTime=0;
 g.ship={inputs:{},x:0,y:3000,z:0,vx:0,vy:0,vz:100,pitch:0,yaw:0,roll:0,afterburner:false};
 g.pilot={active:false,targetRoll:0,targetPitch:0,throttle:1,handControls:{left:'unknown',right:'unknown'}};
 g.keys={};g.upgrades={engine:1,armor:1};g.currentStats={thrust:10};g.session={kills:0};
 g._startMission=()=>{g.started=(g.started||0)+1;g.state='PLAYING'};
 const ctx={fillRect(){},strokeRect(){},fillText(){},save(){},restore(){}};
 function pose(score=.84){
  const p={keypoints:Array.from({length:17},(_,i)=>({x:320,y:240,score:.8,name:'kp'+i}))};
  for(const [i,name,x,y] of [[5,'left_shoulder',250,170],[6,'right_shoulder',390,170],[9,'left_wrist',230,285],[10,'right_wrist',410,285]]){
   p.keypoints[i]={name,x,y,score:i===9||i===10?score:.8};
  }
  p.consoleMotion={status:'locked',hands:{left:'unknown',right:'unknown'}};return p;
 }
 return {g,window,pose,frame(p,elapsed=100){clock+=elapsed;return g.update(ctx,640,480,p)}};
}
test('airplane starts with player and both wrists visible even when finger model never responds',()=>{
 const {g,pose,frame}=aircraft();
 for(let n=0;n<35&&g.state==='CALIBRATION';n++)frame(pose());
 assert.equal(g.state,'PLAYING','no permanent CALIBRATION waiting on hand-open classification');
 assert.equal(g.started,1,'mission should start once');
});
test('one or two missed wrist frames do not reset 2.5 seconds of valid registration',()=>{
 const {g,pose,frame}=aircraft();
 for(let n=0;n<18;n++)frame(pose());
 const t=g.timer;
 frame(pose(.04));frame(null);frame(pose(.05));
 assert.equal(g.state,'CALIBRATION');
 assert.equal(g.timer,t,'missing camera points must pause rather than erase valid progress');
 for(let n=0;n<15&&g.state==='CALIBRATION';n++)frame(pose());
 assert.equal(g.state,'PLAYING');
});
test('calibration requires both visible wrists, not only shoulders',()=>{
 const {g,pose,frame}=aircraft();
 for(let n=0;n<50;n++)frame(pose(.04));
 assert.equal(g.state,'CALIBRATION','do not pretend invisible wrists are calibrated');
 assert.equal(g.started,undefined);
});
test('body enrollment stays available with weak wrists but does not impersonate another tracked ID',()=>{
 let lockLib;const window={};
 vm.runInNewContext(fs.readFileSync('arcade/player-motion-lock.js','utf8'),{window,performance:{now:()=>0}});
 lockLib=window.ConsolePlayerMotionLock;
 const lock=new lockLib.PlayerLock();
 const body=(id,score)=>({id,keypoints:Array.from({length:17},(_,i)=>({
  name:({5:'left_shoulder',6:'right_shoulder',9:'left_wrist',10:'right_wrist'})[i]||'other',
  x:i===5?260:i===6?380:i===9?245:i===10?395:320,y:i===5||i===6?165:290,
  score:i===9||i===10?score:.9
 }))});
 lock.observe([body(10,.05)],0);
 const selected=lock.observe([body(11,.05)],800);
 assert.equal(selected?.id,11,'changing provider ID during initial acquisition must not restart indefinitely');
 assert.equal(lock.status,'locked');
 assert.equal(lock.observe([body(99,.8)],900),null,'a different tracked person must never take control');
});
test('hand detector is an optional enhancement, never an awaited mission-start gate',()=>{
 const core=fs.readFileSync('games/voo/js/core.js','utf8');
 assert.match(core,/Promise\.resolve\(\)\.then\(\(\)=>sys\.ensureHandDetector/);
 assert.doesNotMatch(core,/const handDetector=await sys\.ensureHandDetector/);
});

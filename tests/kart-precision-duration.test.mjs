import test from 'node:test';
import assert from 'node:assert/strict';
import {engine} from './helpers/game-fixture.mjs';
function race(track=0){const f=engine('kart','game_kart',{steeringAssist:'off'}),g=f.game;g.currentFase={id:'arcade',mode:'RACE',targetRank:3};g.setupUI();g.startRace(track);g.localBots=[];g.rivals=[];g.arcadeManual={throttle:true};return f;}
const hands=(tilt=60)=>({keypoints:[{name:'left_wrist',score:.95,x:450,y:300+tilt/2},{name:'right_wrist',score:.95,x:190,y:300-tilt/2}]});
test('the same real wrist angle gives the same direction and strength in portrait, landscape and desktop',()=>{
 for(const tilt of [-100,-60,0,60,100]){
  const values=[];
  for(const [w,h] of [[320,740],[390,844],[844,390],[1280,720]]){const f=race();f.window.ArcadeControls.mode='camera';f.game.updatePhysics(w,h,hands(tilt));values.push(f.game.targetSteer);}
  assert(values.every(value=>Math.abs(value-values[0])<1e-10),JSON.stringify({tilt,values}));
  assert.equal(Math.sign(values[0]),-Math.sign(tilt)||0);
 }
});
test('a frozen camera observation stops acceleration and boost until a new video frame arrives',()=>{
 const f=race(),g=f.game;f.window.ArcadeControls.mode='camera';f.window.System.video={videoWidth:640,videoHeight:480,currentTime:0};
 for(let i=0;i<120;i++){f.advance(1000/60);f.window.System.video.currentTime+=1/60;g.updatePhysics(844,390,hands(0));}
 assert(g.speed>120);assert(g.requestTurbo());const speed=g.speed;
 for(let i=0;i<180;i++){f.advance(1000/60);g.updatePhysics(844,390,hands(0));}
 assert(g.trackingLost);assert(!g.turboLock);assert(g.speed<speed*.02);
 f.advance(16);f.window.System.video.currentTime+=1/30;g.updatePhysics(844,390,hands(0));assert(!g.trackingLost);assert(g.inputActive);
});
test('each three-lap circuit has distinct sectors, lasts over 80 seconds at real racing speed, and records completed lap times',()=>{
 for(let track=0;track<3;track++){
  const {game:g}=race(track);let ticks=0;
  while(g.status==='RACING'&&ticks<14000){g.arcadeManual.left=g.playerX>.035;g.arcadeManual.right=g.playerX<-.035;g.updatePhysics(844,390,null);ticks++;}
  const seconds=ticks/60;assert.equal(g.status,'FINISHED');assert(seconds>80&&seconds<180,JSON.stringify({track,seconds}));
  assert.equal(g.trackSectors.length,4);assert.equal(g.lapTimes.length,3);assert(g.lapTimes.every(t=>t>20));assert(Math.abs(g.lapTimes.reduce((a,b)=>a+b,0)-g.raceElapsed)<1e-7);
 }
});

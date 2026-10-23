import test from 'node:test';
import assert from 'node:assert/strict';
import {engine} from './helpers/game-fixture.mjs';
function pose(cx,cy){return {keypoints:[{name:'left_wrist',x:cx-100,y:cy,score:.99},{name:'right_wrist',x:cx+100,y:cy,score:.99}]};}
function camera(heli=false){const f=engine('voo','game_flight');f.game.init({mode:'SINGLE'});if(heli)f.game.selectAirframe('kestrel');f.window.ArcadeControls.mode='camera';f.window.System.video={videoWidth:640,videoHeight:480};f.game.state='CALIBRATION';for(let i=0;i<60;i++)f.game._readPose(pose(320,240),844,390,1/60);f.game.state='PLAYING';return f;}
test('flight camera: calibrated mirrored hand translation steers right/left and raises/lowers pitch in both viewport orientations',()=>{
 for(const [w,h]of [[844,390],[390,844]])for(const [cx,cy,right,up]of [[250,190,true,true],[390,290,false,false]]){
  const {game:g}=camera();for(let i=0;i<30;i++)g._readPose(pose(cx,cy),w,h,1/60);
  assert.equal(g.pilot.targetRoll>0,right);assert.equal(g.pilot.targetPitch>0,up);
  const target={x:Math.sin(g.pilot.targetRoll*.2)*1000,y:Math.sin(g.pilot.targetPitch*.2)*1000,z:1000};
  g.view={x:0,y:0,z:0,yaw:0,pitch:0,roll:0};const before=g._projectView(target.x,target.y,target.z,w,h);
  g.view.yaw=g.pilot.targetRoll*.2;g.view.pitch=g.pilot.targetPitch*.2;const after=g._projectView(target.x,target.y,target.z,w,h);
  assert(Math.abs(after.x-w/2)<Math.abs(before.x-w/2));assert(Math.abs(after.y-h/2)<Math.abs(before.y-h/2));
 }
});
test('helicopter camera: raised hands climb, lowered hands descend and a missing pose returns to hover',()=>{
 for(const [y,climb]of [[190,true],[290,false]]){const {game:g}=camera(true);Object.assign(g.ship,{x:0,y:380,z:0,vx:0,vy:0,vz:0,yaw:0,pitch:0,roll:0});
  for(let i=0;i<90;i++){g._readPose(pose(320,y),844,390,1/60);g._updateHelicopter(1/60);}assert.equal(g.ship.y>380,climb);assert(g.ship.vz>0,'camera flight advances without a touchscreen stick');
  g._readPose(null,844,390,1/60);assert.equal(g.pilot.throttle,.5);
 }
});

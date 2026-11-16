import test from 'node:test';
import assert from 'node:assert/strict';
import {engine} from './helpers/game-fixture.mjs';

function landmarks(normalized=false,dx=0,dy=0){
  const raw=[
    {name:'nose',x:320,y:130,score:.99},
    {name:'left_shoulder',x:260,y:220,score:.99},
    {name:'right_shoulder',x:380,y:220,score:.99},
    {name:'left_elbow',x:235,y:285,score:.99},
    {name:'right_elbow',x:405,y:285,score:.99},
    {name:'left_wrist',x:220+dx,y:275+dy,score:.99},
    {name:'right_wrist',x:420+dx,y:275+dy,score:.99}
  ];
  return raw.map(k=>({...k,x:normalized?k.x/640:k.x,y:normalized?k.y/480:k.y}));
}
test('Avião: array [{keypoints}] e coordenadas normalizadas preservam pitch/roll e calibração',()=>{
  const setup=()=>{const f=engine('voo','game_flight');f.game.init({mode:'SINGLE'});f.window.ArcadeControls.mode='camera';f.window.System.video={videoWidth:640,videoHeight:480};f.game.state='CALIBRATION';return f;};
  const a=setup(),b=setup();
  for(let i=0;i<65;i++){a.game._readPose({keypoints:landmarks(false)},844,390,1/60);b.game._readPose([{keypoints:landmarks(true)}],844,390,1/60);}
  assert.equal(a.game.pilot.active,true);assert.equal(b.game.pilot.active,true);
  a.game.state='PLAYING';b.game.state='PLAYING';
  for(let i=0;i<40;i++){a.game._readPose({keypoints:landmarks(false,-55,-35)},844,390,1/60);b.game._readPose([{keypoints:landmarks(true,-55,-35)}],844,390,1/60);}
  assert(Math.abs(a.game.pilot.targetRoll-b.game.pilot.targetRoll)<.001);
  assert(Math.abs(a.game.pilot.targetPitch-b.game.pilot.targetPitch)<.001);
  assert(Math.abs(a.game.pilot.targetRoll)>.1);
});
test('Ping Pong: raquete segue pulso real nos formatos pixel e array normalizado',()=>{
  const setup=()=>{const f=engine('tenis','game_tennis');f.window.ArcadeControls.mode='camera';f.window.System.video={videoWidth:640,videoHeight:480};f.game.handedness='right';f.game.state='RALLY';return f;};
  const a=setup(),b=setup();
  a.game.processPose({keypoints:landmarks(false)},390,844);b.game.processPose([{keypoints:landmarks(true)}],390,844);
  assert(Math.abs(a.game.p1.rawX-b.game.p1.rawX)<.001);
  a.advance(17);b.advance(17);
  a.game.processPose({keypoints:landmarks(false,-50,0)},390,844);b.game.processPose([{keypoints:landmarks(true,-50,0)}],390,844);
  assert(Math.abs(a.game.p1.rawX-b.game.p1.rawX)<.001);
  assert(a.game.p1.vx>0&&b.game.p1.vx>0);
});
test('Boxe: landmarks normalizados e array de detecções não fazem golpes artificiais',()=>{
  const setup=()=>{const f=engine('boxe','game_box');f.game.p1=f.game.createPlayer('p1',0);f.game.p2=f.game.createPlayer('p2',1);f.game.state='CALIBRATION';return f;};
  const a=setup(),b=setup();
  a.game.processInput({keypoints:landmarks(false)},390,844,.016);b.game.processInput([{keypoints:landmarks(true)}],390,844,.016);
  assert(Math.abs(a.game.p1.pose.head.x-b.game.p1.pose.head.x)<.001);
  assert(Math.abs(a.game.p1.pose.wrists.r.y-b.game.p1.pose.wrists.r.y)<.001);
  assert.equal(a.game.p1.score,b.game.p1.score);
});
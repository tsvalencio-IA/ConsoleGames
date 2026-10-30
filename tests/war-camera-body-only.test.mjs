import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync('games/ar/hand-controls.js','utf8');
const page=readFileSync('games/ar/index.html','utf8');
const sw=readFileSync('games/ar/sw.js','utf8');
const window={};
const localStorage={
 getItem(key){return key==='ot_war_camera_source_v1'?'object':null;},
 setItem(){throw Error('Legacy object selection must never be restored')}
};
const sandbox={window,localStorage,document:{baseURI:'http://localhost/games/ar/',currentScript:null},URL,performance:{now:()=>12345}};
vm.runInNewContext(source.replace(/\}\)\(\);\s*$/, 'window.__WarCameraSessionForTest=CameraSession;})();'),sandbox);
const CameraSession=window.__WarCameraSessionForTest;

test('WAR: old saved object preference cannot reactivate the object recognizer',()=>{
 const oldUI=CameraSession.prototype.buildUI,oldStart=CameraSession.prototype.start;
 try{
  CameraSession.prototype.buildUI=function(){};
  CameraSession.prototype.start=function(){};
  const game={},session=new CameraSession(game,{});
  assert.equal(session.source,'hand');
  assert.equal(session.needCapture,false);
  assert.equal(session.requiresBody,false);
  session.setSource('object');
  assert.equal(session.source,'hand');
  assert.equal(session.needCapture,false);
 }finally{
  CameraSession.prototype.buildUI=oldUI;CameraSession.prototype.start=oldStart;
 }
});

test('WAR: a real fresh hand starts playing even when torso is not detected',()=>{
 const s=Object.create(CameraSession.prototype);
 const attrs={};
 s.game={state:'HAND_CALIBRATION',handAim:{fresh:true},bodyPose:null};
 s.controller={state:'ready'};
 s.root={classList:{remove(v){attrs.removed=v}},setAttribute(k,v){attrs[k]=v},removeAttribute(k){delete attrs[k]}};
 assert.equal(s.finishCalibration(),true);
 assert.equal(s.game.state,'PLAYING');
 assert.equal(s.game.lastTime,12345);
 assert.equal(attrs.removed,'calibrating');
});

test('WAR: no stale hand can bypass calibration, and object bundles stay unused',()=>{
 const s=Object.create(CameraSession.prototype);
 s.controller={state:'ready'};
 s.game={state:'HAND_CALIBRATION',handAim:{fresh:false},bodyPose:null};
 assert.equal(s.finishCalibration(),false);
 assert.equal(s.game.state,'HAND_CALIBRATION');
 assert(!/src="object-(aim|training|camera-registration)\.js/.test(page));
 assert(!/\.\/object-(flow|views|camera-registration|aim|training|tracker|tracker-worker)\.js/.test(sw));
 assert(/hand-controls\.js\?v=20261030-body-only1/.test(page));
});

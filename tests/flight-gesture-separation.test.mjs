import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {engine,canvas} from './helpers/game-fixture.mjs';

const source=['flight-operations','game_flight'].map(name=>fs.readFileSync(`games/voo/js/${name}.js`,'utf8')).join('\n');
const heldPose={leftX:220,rightX:420,leftY:245,rightY:245};

function pose({leftX,rightX,leftY,rightY}, {scale=1,offset=0,score=.99,unit=false,shape='object'}={}) {
 const points=[['left_shoulder',260,184],['right_shoulder',380,184],['left_wrist',leftX,leftY],['right_wrist',rightX,rightY]];
 const keypoints=points.map(([name,px,py])=>{
  const x=320+(px-320)*scale,y=224+(py-224)*scale+offset;
  return {name,x:unit?x/640:x,y:unit?y/480:y,score};
 });
 return shape==='list'?keypoints:shape==='people'?[{keypoints}]:{keypoints};
}

function pilot({operation='reporter',options={},period=1000/60,rotation=[393,852]}={}) {
 const f=engine('voo','game_flight',{}, {source});
 const {game:g,window,advance}=f,w=rotation[0],h=rotation[1],ops=window.FlightOperations;
 g.init({mode:operation?'FREE':'SINGLE',operation});
 window.ArcadeControls.mode='camera';window.System.video={videoWidth:640,videoHeight:480};
 const ctx=canvas();g._draw=()=>{};g._drawCalib=()=>{};
 const tick=(hands=heldPose,ms=period)=>{advance(ms);g.update(ctx,w,h,hands?pose(hands,options):null);};
 // Enter through the native HANGAR -> CALIBRATION -> PLAYING transition.
 g.keys[' ']=true;tick();g.keys[' ']=false;
 assert.equal(g.state,'CALIBRATION');
 for(let i=0;i<130&&g.state==='CALIBRATION';i++){
  // The old 5 s countdown uses physics time, which stays capped at 50 ms.
  tick(heldPose,50);
 }
 assert.equal(g.state,'PLAYING');
 const stay=(hands,n)=>{for(let i=0;i<n;i++)tick(hands);};
 const target=i=>{
  const wp=ops.routes.reporter[i];
  Object.assign(g.ship,{x:wp.x,y:wp.y,z:wp.z-220,roll:0,yaw:0,pitch:0,vx:0,vy:0,vz:135});
  g.onGround=false;
  stay(heldPose,Math.ceil(1100/period));
  assert(g.flightOperation.stable>=1);
 };
 return{...f,g,ops,tick,stay,target,period};
}

test('reporter: real flight update consumes lifted wrists as a shutter and keeps the calibrated stick steady',()=>{
 for(const parameters of [
  {options:{offset:42,score:.93},rotation:[393,852]},
  {options:{offset:-55,unit:true,shape:'people',score:.58},rotation:[852,393]},
  {options:{offset:35,scale:.35,score:.38,shape:'list'},period:200,rotation:[393,852]}
 ]){
  const {g,stay,tick,target,period}=pilot(parameters);
  target(0);
  const neutral={...g.pilot.handNeutral};
  // Natural lift through the intermediate positions, then sustained hold.
  const durations=[];
  for(let i=1;i<=16;i++){
   tick({...heldPose,leftY:245-i*8});
   durations.push(Math.max(Math.abs(g.ship.inputs.roll),Math.abs(g.ship.inputs.pitch)));
  }
  stay({...heldPose,leftY:117},Math.ceil(600/period));
  assert.equal(g.flightOperation.photos.length,1);
  assert(g.ship.inputs.roll<.025&&Math.abs(g.ship.inputs.pitch)<.025);
  assert(Math.max(...durations)<.05,'the raising transition must not add a steering impulse');
  assert.equal(g.pilot.headTilt,false);assert.equal(g.ship.afterburner,false);
  assert.equal(g.bullets.length+g.missiles.length,0);
  assert.deepEqual({...g.pilot.handNeutral},neutral,'an action must not recalibrate neutral');
 }
});

test('reporter: balanced banks, two-hand climbs and small wrist jitter retain their intended meaning',()=>{
 const {g,target,stay}=pilot();target(0);
 stay({...heldPose,leftY:198,rightY:292},24);
 assert(Math.abs(g.ship.inputs.roll)>.25,'balanced bank is flight input');
 assert.equal(g.flightOperation.photos.length,0);
 stay({...heldPose,leftY:195,rightY:195},24);
 assert(g.ship.inputs.pitch>.8,'two hands climbing together retain pitch authority');
 stay(heldPose,40);
 stay({...heldPose,leftX:221,rightX:421,leftY:246,rightY:246},30);
 assert(Math.abs(g.ship.inputs.roll)<.001&&Math.abs(g.ship.inputs.pitch)<.001);
 assert.equal(g.flightOperation.photos.length,0);
});

test('combat: joining and spreading wrists keep the previous stick while retaining fire, lock and boost',()=>{
 const {g,stay}=pilot({operation:null});
 stay({...heldPose,leftX:180,rightX:380},30);
 const roll=g.ship.inputs.roll,pitch=g.ship.inputs.pitch;
 assert(roll>.3);
 // Move the close gesture well away from center. Its average location must
 // not replace the last flight demand, even as missiles and cannon fire.
 g.entities=[{type:'jet_fighter',x:g.ship.x+Math.sin(g.ship.yaw)*2000,y:g.ship.y,z:g.ship.z+Math.cos(g.ship.yaw)*2000,hp:100,vx:0,vy:0,vz:g.ship.vz}];
 stay({leftX:365,rightX:425,leftY:297,rightY:297},2);
 assert(g.pilot.headTilt);assert(g.bullets.length>0);assert.equal(g.missiles.length,0);
 assert(Math.abs(g.ship.inputs.roll-roll)<.002);assert.equal(g.ship.inputs.pitch,pitch);
 stay({leftX:94,rightX:486,leftY:190,rightY:190},2);
 assert(g.ship.afterburner);assert.equal(g.pilot.headTilt,false);
 assert(Math.abs(g.ship.inputs.roll-roll)<.003);assert.equal(g.ship.inputs.pitch,pitch);
 stay(null,1);assert.equal(g.pilot.headTilt,false);assert.equal(g.ship.afterburner,false);
 assert.equal(g.pilot.active,false);
});

test('reporter: three real shutters and a real runway touchdown save completion exactly once',()=>{
 const {g,target,stay,tick,storage}=pilot({period:50});
 const leftUp={...heldPose,leftY:110},rightUp={...heldPose,rightY:110};
 for(let i=0;i<3;i++){
  target(i);
  stay(i===1?rightUp:leftUp,13);
  assert.equal(g.flightOperation.photos.length,i+1);
  assert.equal(g.flightOperation.photos[i].point,i+1);
  stay(i===1?rightUp:leftUp,8);
  assert.equal(g.flightOperation.photos.length,i+1);
  stay(heldPose,6);
 }
 assert.equal(g.flightOperation.stage,'return');
 assert.equal(g.flightCareer.missions.reporter,undefined);
 Object.assign(g.ship,{x:0,y:8.05,z:0,vx:0,vy:-2,vz:24,pitch:0,roll:0,yaw:0});
 g.pilot.throttle=0;g.onGround=false;
 tick();
 assert.equal(g.landingQuality,'smooth');assert.equal(g.state,'VICTORY');
 assert.equal(g.flightCareer.missions.reporter.completed,1);assert.equal(g.flightCareer.missions.reporter.photos,3);
 stay(leftUp,20);
 assert.equal(JSON.parse(storage.get(g.careerKey)).missions.reporter.completed,1);
});

test('reporter: low-confidence joints and a stale inference cannot complete the photo hold',()=>{
 const f=pilot({period:50}),{g,target,stay,advance,game,window}=f;
 target(0);
 const raised={...heldPose,leftY:110};stay(raised,3);
 const ctx=canvas();
 advance(1200);game.update(ctx,393,852,pose(raised));
 assert.equal(g.flightOperation.photos.length,0);
 for(let i=0;i<12;i++){advance(50);game.update(ctx,393,852,pose(raised,{score:.29}));}
 assert.equal(g.flightOperation.photos.length,0);
 assert.equal(g.pilot.active,false);
 assert.equal(window.FlightOperations.capturePhoto(g).ok,true,'the original independent touch shutter still uses the native mission check');
});

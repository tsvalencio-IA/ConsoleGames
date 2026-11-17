import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('games/voo/js/flight-operations.js','utf8');
function flightOps(){
 const window={System:{msg(){}},ArcadeControls:{mode:'camera'}};
 vm.runInNewContext(source,{window,performance:{now:()=>1000},navigator:{vibrate(){}},console});
 return {f:window.FlightOperations,window};
}
function g(){
 return {
  state:'PLAYING',mode:'FREE',onGround:false,
  ship:{x:0,y:650,z:-2200,vx:0,vy:0,vz:0,roll:0,yaw:0,pitch:0,hp:100,engineHealth:100,wingHealth:100,structuralIntegrity:100},
  pilot:{throttle:1,targetPitch:0},manualThrottle:1,session:{xp:0},
  flightCareer:{missions:{}},battleCities:[],entities:[],net:{players:{}},
  _saveCareer(){this.saves=(this.saves||0)+1},_endGame(state){this.state=state},isHelicopter(){return false}
 };
}
function cameraPose(up){
 return {keypoints:Array.from({length:17},(_,i)=>({
  name:({5:'left_shoulder',6:'right_shoulder',9:'left_wrist',10:'right_wrist'})[i]||'other',
  x:200+(i%2)*120,y:(i===5||i===6)?180:i===9?(up?65:248):i===10?240:300,
  score:.99
 }))};
}
test('camera photo: one raised hand triggers remote shutter without touching the phone',()=>{
 const {f}=flightOps(),game=g();f.start(game,{operation:'reporter'});f.onStart(game);
 Object.assign(game.ship,f.routes.reporter[0]);
 for(let i=0;i<12;i++)f.update(game,.1,{...game.ship});
 for(let i=0;i<6;i++)f.cameraPhotoGesture(game,cameraPose(true),.08);
 assert.equal(game.flightOperation.index,1);
 assert.equal(game.flightOperation.photos.length,1);
 for(let i=0;i<50;i++)f.cameraPhotoGesture(game,cameraPose(true),.08);
 assert.equal(game.flightOperation.index,1,'held arm is not interpreted as repeated shutters');
 for(let i=0;i<4;i++)f.cameraPhotoGesture(game,cameraPose(false),.08);
 Object.assign(game.ship,f.routes.reporter[1]);
 for(let i=0;i<12;i++)f.update(game,.1,{...game.ship});
 for(let i=0;i<6;i++)f.cameraPhotoGesture(game,cameraPose(true),.08);
 assert.equal(game.flightOperation.index,2,'lowering then lifting arms takes the next photo');
});
test('camera photo: far-away gesture, missing body points and partial gestures do not make fake photographs',()=>{
 const {f}=flightOps(),game=g();f.start(game,{operation:'reporter'});f.onStart(game);
 for(let i=0;i<10;i++)f.cameraPhotoGesture(game,cameraPose(true),.08);
 assert.equal(game.flightOperation.photos.length,0);
 assert.equal(f.cameraPhotoGesture(game,{keypoints:cameraPose(true).keypoints.slice(0,8)},.1),false);
 assert.equal(game.flightOperation.photos.length,0);
});
test('emergency: damaged aircraft can win only through a gentle controlled runway landing',()=>{
 const {f}=flightOps(),game=g();f.start(game,{operation:'emergency'});f.onStart(game);
 assert.equal(game.flightOperation.stage,'return');
 assert(game.ship.engineHealth<=32);
 game.onGround=true;game.landingQuality='smooth';
 Object.assign(game.ship,{x:0,y:8,z:0,vx:0,vy:0,vz:0});
 f.update(game,.15,{...game.ship});
 assert.equal(game.state,'VICTORY');
 assert.equal(game.flightCareer.missions.emergency.completed,1);
 assert.equal(game.saves,1);
});
test('patrol: no waypoint is skipped by glancing through; each requires a stable observation',()=>{
 const {f}=flightOps(),game=g();f.start(game,{operation:'patrol'});f.onStart(game);
 for(const [i,point]of f.routes.patrol.entries()){
  Object.assign(game.ship,point);
  f.update(game,.15,{...game.ship});
  assert.equal(game.flightOperation.index,i);
  for(let k=0;k<9;k++)f.update(game,.1,{...game.ship});
  assert.equal(game.flightOperation.index,i+1);
 }
 assert.equal(game.flightOperation.stage,'return');
});
test('rescue: no victory or passenger credit until extraction hold is complete',()=>{
 const {f}=flightOps(),game=g();f.start(game,{operation:'rescue'});f.onStart(game);
 const target=f.routes.rescue[0];Object.assign(game.ship,target);
 for(let i=0;i<34;i++)f.update(game,.1,{...game.ship});
 assert.equal(game.flightOperation.rescued,false);
 assert.equal(game.flightOperation.stage,'route');
 f.update(game,.2,{...game.ship});
 assert.equal(game.flightOperation.rescued,true);
 assert.equal(game.flightOperation.stage,'return');
 game.onGround=true;Object.assign(game.ship,{x:0,y:8,z:0,vx:0,vz:0});
 f.update(game,.2,{...game.ship});
 assert.equal(game.flightCareer.missions.rescue.rescued,true);
 assert.equal(game.state,'VICTORY');
});
test('carrier: cannot receive medal until catapult, waypoint and arrested landing are done',()=>{
 const {f}=flightOps(),game=g();f.start(game,{operation:'carrier'});f.onStart(game);
 assert.equal(game.flightOperation.stage,'catapult');
 for(let i=0;i<300&&game.onGround;i++)f.carrierGround(game,.05);
 assert.equal(game.flightOperation.stage,'route');
 Object.assign(game.ship,f.routes.carrier[0]);
 for(let i=0;i<11;i++)f.update(game,.1,{...game.ship});
 assert.equal(game.flightOperation.stage,'return');
 game.flightOperation.stage='landed';game.onGround=true;
 Object.assign(game.ship,{vx:0,vz:0});
 f.update(game,.1,{...game.ship});
 assert.equal(game.state,'VICTORY');
 assert.equal(game.flightCareer.missions.carrier.completed,1);
});

test('school: only actual passage through five arcs in the right order counts',()=>{
 let logic;const window={System:{registerGame(id,_title,_icon,g){if(id==='usarmy_flight_sim')logic=g;}}};
 vm.runInNewContext(fs.readFileSync('games/voo/js/game_flight.js','utf8'),
  {window,performance:{now:()=>1000},console,setInterval(){throw Error('register failure')}});
 const game=Object.create(logic),gates=game._schoolGates();
 game.flightSchool={stage:'gates',gate:0};game.ship={x:0,y:230,z:0};
 const attempt=(gate,before,after)=>{
  game.flightSchool.gate=gate;Object.assign(game.ship,after);
  return game._schoolGatePassed(before,gates[gate]);
 };
 assert.equal(attempt(0,{x:0,y:230,z:-20},{x:0,y:230,z:20}),true);
 assert.equal(attempt(0,{x:0,y:230,z:20},{x:0,y:230,z:-20}),false,'opposite direction is not a completed arc');
 assert.equal(attempt(0,{x:400,y:230,z:-20},{x:400,y:230,z:20}),false,'fly-by beside the arc is not progress');
 assert.equal(attempt(0,{x:0,y:230,z:-15},{x:0,y:230,z:-5}),false,'proximity without crossing is not progress');
 assert.equal(attempt(1,{x:1000,y:450,z:1890},{x:1000,y:450,z:1910}),true);
 assert.equal(attempt(2,{x:2300,y:480,z:10},{x:2300,y:480,z:-10}),true);
 assert.equal(attempt(3,{x:1200,y:300,z:-2590},{x:1200,y:300,z:-2610}),true);
 assert.equal(attempt(4,{x:0,y:120,z:-2310},{x:0,y:120,z:-2290}),true);
});

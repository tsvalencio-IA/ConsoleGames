import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function flightOperations(){
  const window={System:{msg(){}}};
  vm.runInNewContext(fs.readFileSync('games/voo/js/flight-operations.js','utf8'),{window,performance:{now:()=>1000},navigator:{vibrate(){}},console});
  return window.FlightOperations;
}
function operationGame(){
  return {
    mode:'FREE',state:'PLAYING',onGround:false,ship:{x:0,y:650,z:-2200,vx:0,vy:0,vz:0,roll:0,yaw:0,pitch:0,speed:0,hp:100,engineHealth:100,wingHealth:100,structuralIntegrity:100},
    pilot:{throttle:.5,targetPitch:0},manualThrottle:.5,session:{xp:0},
    flightCareer:{missions:{}},battleCities:[],entities:[],net:{players:{},uid:'pilot'},
    isHelicopter(){return false;},_saveCareer(){this.saves=(this.saves||0)+1;},
    _endGame(result){this.result=result;this.state=result;}
  };
}
test('Reporter: every node requires a real photo press; proximity alone never advances',()=>{
  const f=flightOperations(),g=operationGame();f.start(g,{operation:'reporter'});f.onStart(g);
  assert.equal(f.capturePhoto(g).ok,false,'cannot take a photo far from the first target');
  for(const [i,waypoint] of f.routes.reporter.entries()){
    Object.assign(g.ship,{...waypoint,vx:0,vy:0,vz:0,roll:0});
    f.update(g,.5,{...g.ship});
    assert.equal(f.capturePhoto(g).ok,false,'must first stabilize for a full second');
    f.update(g,.6,{...g.ship});
    assert.equal(g.flightOperation.index,i,'stable flight alone must not count as a photo');
    assert.equal(f.capturePhoto(g).ok,true,'the shutter advances the correct waypoint');
    assert.equal(g.flightOperation.index,i+1);
    assert.equal(g.flightPhotos.length,i+1);
  }
  assert.equal(g.flightOperation.stage,'return');
  assert.equal(g.flightOperation.photos.length,3);
  Object.assign(g.ship,{x:4200,y:8,z:5800,vx:0,vy:0,vz:0});g.onGround=true;
  f.update(g,.25,{...g.ship});
  assert.equal(g.state,'PLAYING','landing anywhere must not complete the mission');
  Object.assign(g.ship,{x:0,y:8,z:0,vx:0,vy:0,vz:0});
  f.update(g,.25,{...g.ship});
  assert.equal(g.state,'VICTORY');
  assert.equal(g.flightCareer.missions.reporter.photos,3);
  assert.equal(g.flightCareer.missions.reporter.completed,1);
  assert.equal(g.saves,1);
  assert.equal(f.capturePhoto(g).ok,false,'no photo after finishing');
});
test('Patrol: all three ordered nodes, then land at the base only',()=>{
  const f=flightOperations(),g=operationGame();f.start(g,{operation:'patrol'});f.onStart(g);
  for(const [i,p] of f.routes.patrol.entries()){
    Object.assign(g.ship,{...p,vx:20,vy:0,vz:0,roll:0});for(let k=0;k<11;k++)f.update(g,.1,{...g.ship});
    assert.equal(g.flightOperation.index,i+1);
  }
  assert.equal(g.flightOperation.stage,'return');
  g.onGround=true;Object.assign(g.ship,{x:1500,y:8,z:0,vx:0,vy:0,vz:0});
  f.update(g,.2,{...g.ship});assert.equal(g.state,'PLAYING');
  Object.assign(g.ship,{x:0,y:8,z:0});f.update(g,.2,{...g.ship});
  assert.equal(g.state,'VICTORY');
  assert.equal(g.flightCareer.missions.patrol.completed,1);
});
test('Emergency: an unsafe firm landing is not graded as a success',()=>{
  const f=flightOperations(),g=operationGame();f.start(g,{operation:'emergency'});f.onStart(g);
  assert.equal(g.flightOperation.stage,'return');
  g.onGround=true;g.landingQuality='firm';
  Object.assign(g.ship,{x:0,y:8,z:0,vx:0,vy:0,vz:0});
  f.update(g,.2,{...g.ship});
  assert.equal(g.state,'GAMEOVER');
  assert.equal(g.flightCareer.missions.emergency,undefined);
});
function nativeFlight(){
  let game=null;const window={System:{registerGame(id,_title,_icon,logic){if(id==='usarmy_flight_sim')game=logic;}},ArcadeControls:{mode:'controls'}};
  vm.runInNewContext(fs.readFileSync('games/voo/js/game_flight.js','utf8'),{window,performance:{now:()=>1000},console,setInterval(){throw Error('registration failure')}});
  assert(game);
  const g=Object.create(game);
  g.mode='FREE';g.airframe='falcon';g.ship={x:0,y:200,z:0,vx:0,vy:0,vz:200,pitch:0,yaw:0,roll:0};
  g.combat={target:null,locked:false,lockTimer:0,vulcanCd:0,missileCd:1};
  g.entities=[];g.bullets=[];g.missiles=[];g.keys={};g.manualFireHeld=false;
  g.net={playersRef:null};g.pilot={headTilt:false};g.groundTanks=[];
  return {g,window};
}
test('Cannon: controller fire works with no target and no lock',()=>{
  const {g,window}=nativeFlight();
  window.ArcadeControls.mode='controls';g.manualFireHeld=true;
  g._processCombat(.016,800,600);
  assert.equal(g.combat.locked,false);assert.equal(g.bullets.length,1);
  assert(g.bullets[0].vz>0,'gun projectile travels forward');
  assert.equal(g.missiles.length,0,'missiles still require target lock');
});
test('Cannon: camera on-screen fire trigger shoots without a locked target',()=>{
  const {g,window}=nativeFlight();
  window.ArcadeControls.mode='camera';g.manualFireHeld=true;
  g._processCombat(.016,800,600);
  assert.equal(g.bullets.length,1);
  assert.equal(g.missiles.length,0);
});
test('Cannon: the game does not fire by itself without a player trigger',()=>{
  const {g,window}=nativeFlight();
  window.ArcadeControls.mode='camera';g.pilot.headTilt=false;
  g._processCombat(.016,800,600);
  assert.equal(g.bullets.length,0);
});
test('Camera and manual controls expose the photographer shutter without changing calibration',()=>{
  const controls=fs.readFileSync('games/voo/control-modes.js','utf8');
  const game=fs.readFileSync('games/voo/js/game_flight.js','utf8');
  assert.match(controls,/flightCameraActions\(logic\)/);
  assert.match(controls,/id:['"]photo['"]/);
  assert.match(controls,/capturePhoto/);
  assert.match(game,/handNeutral/);
  assert.match(game,/this\._readPose\(pose, w, h, dt\)/);
  assert.match(game,/bossDefeated:false/);
});

test('left-open camera gesture launches a usable unguided missile without radar lock',()=>{
 const {g,window}=nativeFlight();
 g.mode='FREE';g.pilot.missileHeld=true;g.combat.missileCd=0;g.combat.target=null;g.combat.locked=false;
 window.ArcadeControls.mode='camera';
 g._processCombat(.016,800,600);
 assert.equal(g.missiles.length,1,'an explicit left-hand missile command must launch');
 assert.equal(g.missiles[0].target,null,'radar lock is optional for a forward rocket');
 assert(g.missiles[0].vz>g.ship.vz,'unguided missile must fly forward');
});
test('unguided missiles actually damage crossed enemy targets instead of just drawing smoke',()=>{
 const {g}=nativeFlight();
 g.mode='FREE';g.net.isHost=true;g.fx=[];g.upgrades={missiles:1};g.groundTanks=[];
 g.entities=[{x:0,y:0,z:400,hp:50,isBoss:false}];
 g.missiles=[{x:0,y:0,z:0,vx:0,vy:0,vz:1000,target:null,life:2,maxG:40,trackTime:0}];
 let kills=0;g._kill=(enemy)=>{kills++;enemy.hp=0};g._fx=()=>{};
 g._updateMissiles(.4);
 assert.equal(g.entities[0].hp,0);
 assert.equal(kills,1);
 assert.equal(g.missiles.length,0);
});

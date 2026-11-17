import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(p,'utf8');
const script=read('games/voo/js/flight-operations.js');
function flightOps(){
 const window={GameAudio:{effect(){}}},ctx=vm.createContext({window,performance:{now:()=>1000},navigator:{vibrate(){}},console});
 vm.runInContext(script,ctx);return window.FlightOperations;
}
function game(){
 return {mode:'FREE',state:'PLAYING',onGround:false,ship:{x:0,y:600,z:0,vx:0,vy:0,vz:120,speed:120,pitch:0,yaw:0,roll:0,hp:100,engineHealth:100,wingHealth:100,structuralIntegrity:100},
  pilot:{throttle:1,targetPitch:0},manualThrottle:1,flightCareer:{missions:{school:{completed:1}}},session:{xp:0},net:{players:{},uid:'user'},
  isHelicopter(){return false;},battleCities:[],entities:[],saveCount:0,_saveCareer(){this.saveCount++},_endGame(phase){this.state=phase}};
}
test('swept jet collision detects buildings between frames without false nearby hits',()=>{
 const f=flightOps(),box={minX:-10,maxX:10,minY:0,maxY:150,minZ:100,maxZ:200};
 assert(f.segmentBox({x:0,y:60,z:0},{x:0,y:60,z:300},box,3));
 assert(!f.segmentBox({x:45,y:60,z:0},{x:45,y:60,z:300},box,3));
 assert(!f.segmentBox({x:0,y:700,z:0},{x:0,y:700,z:300},box,3));
});
test('building impact and aircraft impact trigger defeat without wiping career',()=>{
 const f=flightOps(),g=game();g.battleCities=[{x:0,z:150,buildings:[{x:0,z:150,w:70,d:90,h:250}]}];
 Object.assign(g.ship,{x:0,y:100,z:280});f.update(g,.016,{x:0,y:100,z:0});
 assert.equal(g.state,'GAMEOVER');assert.equal(g.ship.hp,0);assert.equal(g.flightCareer.missions.school.completed,1);
 const h=game();h.entities=[{x:0,y:120,z:150,hp:100,type:'jet_enemy'}];Object.assign(h.ship,{x:0,y:120,z:250});
 assert.equal(f.detectImpact(h,{x:0,y:120,z:0}),'COLISÃO ENTRE AERONAVES');
});
test('carrier catapult and soft deck landing are functional, hard landing crashes',()=>{
 const f=flightOps(),g=game();f.start(g,{operation:'carrier'});f.onStart(g);
 assert.equal(g.onGround,true);assert.equal(g.flightOperation.stage,'catapult');
 for(let i=0;i<260&&g.onGround;i++)f.carrierGround(g,.06);
 assert.equal(g.onGround,false);assert.equal(g.flightOperation.stage,'route');
 const p=game();f.start(p,{operation:'carrier'});f.onStart(p);p.onGround=false;p.flightOperation.stage='return';p.flightOperation.index=f.routes.carrier.length; // Completed patrol waypoint before naval approach
 Object.assign(p.ship,{x:f.carrier.x,y:f.carrier.y+7,z:f.carrier.z,vx:30,vy:-5,vz:50,roll:0,yaw:0});
 f.update(p,.016,{x:p.ship.x,y:f.carrier.y+25,z:p.ship.z});
 assert.equal(p.flightOperation.stage,'landed');assert.equal(p.onGround,true);
 Object.assign(p.ship,{vx:0,vz:0});f.update(p,1,{...p.ship});assert.equal(p.state,'VICTORY');assert.equal(p.flightCareer.missions.carrier.completed,1);
 const q=game();f.start(q,{operation:'carrier'});f.onStart(q);q.onGround=false;q.flightOperation.stage='return';
 Object.assign(q.ship,{x:f.carrier.x,y:f.carrier.y+7,z:f.carrier.z,vx:240,vy:-22,vz:0,roll:.7});
 f.update(q,.016,{x:q.ship.x,y:f.carrier.y+26,z:q.ship.z});assert.equal(q.state,'GAMEOVER');
});
test('patrol, reporter and rescue have achievable objectives and recorded grades',()=>{
 const f=flightOps();
 for(const kind of ['patrol','reporter','rescue']){
  const g=game();f.start(g,{operation:kind});f.onStart(g);
  for(const wp of f.routes[kind]){
   Object.assign(g.ship,{...wp,vx:40,vy:0,vz:0,roll:0});
   const previous=g.flightOperation.index;
   for(let k=0;k<5;k++)f.update(g,1,{...g.ship});
   if(kind==='reporter'){
    assert.equal(g.flightOperation.index,previous,'reporter must not skip the shutter');
    assert.equal(f.capturePhoto(g).ok,true,'the photo button should record the valid site');
   }
  }
  assert.equal(g.flightOperation.stage,'return');
  g.onGround=true;Object.assign(g.ship,{x:0,y:8,z:0,vx:0,vy:0,vz:0});f.update(g,1,{...g.ship});
  assert.equal(g.state,'VICTORY');assert.equal(g.flightCareer.missions[kind].completed,1);assert.equal(g.flightCareer.missions.school.completed,1);assert.equal(g.saveCount,1);
 }
});
test('approved original camera calibration, existing arcade phases and OTTHI bridge are preserved',()=>{
 const f=read('games/voo/js/game_flight.js'),world=read('games/otthi/src/modules/42-ot-games-modes.js'),hangar=read('games/otthi/src/modules/43-world-campaign.js'),venue=read('games/otthi/src/modules/45-world-activity-venues.js'),trip=read('games/otthi/assets/js/world-venue-trip.js');
 assert.match(f,/this\._readPose\(pose, w, h, dt\)/);assert.match(f,/handNeutral/);
 for(const phase of ['flight-school','flight-patrol','flight-reporter','flight-rescue','flight-emergency','flight-carrier'])assert(f.includes(phase));
 assert.match(world,/g\.flightSession=window\.WarBodyControl\.start\(g\)/);
 assert.match(world,/g\.flightSession\?\.dispose\(\)/);
 assert.match(world,/otGamesPlaneCrash\('COLISÃO COM EDIFÍCIO'\)/);
 assert.match(hangar,/id:'ot-flight-academy'/);assert.match(venue,/aviation:Object\.freeze/);assert.match(trip,/aviation:'usarmy_flight_sim'/);
 const html=read('games/voo/index.html'),sw=read('games/voo/sw.js');
 assert.match(html,/flight-operations\.js\?v=/);assert.match(html,/flight-world-return\.js\?v=/);
 assert.match(sw,/flight-academy-v42-pilot-restored/);
});

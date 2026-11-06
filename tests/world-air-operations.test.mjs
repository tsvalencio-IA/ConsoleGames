import test from'node:test';import assert from'node:assert/strict';import vm from'node:vm';import fs from'node:fs';
const source=fs.readFileSync('games/otthi/src/modules/61-world-air-operations.js','utf8'),c=vm.createContext({});vm.runInContext(source.slice(source.indexOf(' class WorldAirFleet'),source.indexOf(' const airOperations='))+'\nglobalThis.Fleet=WorldAirFleet;',c);
const base={heli:{id:'heli',mode:'helicopter',x:96,z:-164,yaw:0},balloon:{id:'balloon',mode:'balloon',x:-66,z:89,yaw:0}},copy=x=>JSON.parse(JSON.stringify(x));
test('air operations: the three minutes begin at takeoff; a replacement is another independent unit',()=>{
 const fleet=new c.Fleet(base,{},1000);assert(fleet.claim('heli','pilot-a',2000));assert.equal(fleet.claim('heli','pilot-b',2001),false);assert.equal(fleet.tick(900000).length,0,'boarding alone does not start replenishment');
 assert(fleet.depart('heli','pilot-a',910000));assert.equal(fleet.depart('heli','pilot-a',920000),false);assert.equal(fleet.tick(1089999).length,0);assert.deepEqual(copy(fleet.tick(1090000)),['heli-r1']);assert.equal(fleet.tick(2000000).length,0);assert.equal(fleet.data.craft.heli.pilot,'pilot-a');assert(fleet.claim('heli-r1','pilot-b',1090001));assert.equal(fleet.data.craft.heli.pilot,'pilot-a');
 assert(fleet.park('heli','pilot-a',{x:7,z:12,yaw:1,hp:88},1090010));assert.equal(fleet.data.craft.heli.x,7);assert.equal(fleet.data.craft['heli-r1'].x,96);assert.equal(fleet.data.craft.heli.hp,88);
});
test('air operations: parked craft and pending base clocks survive restart and authority handoff',()=>{
 const a=new c.Fleet(base,{},1000);a.claim('heli','a',1500);a.depart('heli','a',2000);a.park('heli','a',{x:38,z:20,yaw:.5,hp:95},10000);
 const b=new c.Fleet(base,copy(a.data),180000);assert.equal(b.data.craft.heli.x,38);assert.equal(b.tick(181999).length,0);assert.equal(b.tick(182000)[0],'heli-r1');assert.equal(b.data.craft.heli.x,38);assert.equal(b.spec('heli-r1').mode,'helicopter');
});
test('air operations: a pilot who returned to the base does not get another craft placed on top',()=>{
 const a=new c.Fleet(base,{},1000);a.claim('heli','a',1500);a.depart('heli','a',2000);a.park('heli','a',{x:96,z:-164,yaw:0},10000);assert.equal(a.tick(182000).length,0);assert.equal(a.data.slots.heli.current,'heli');assert.equal(Object.keys(a.data.craft).length,2);
});
test('air operations: a guest cannot park another pilot’s unit or inject a nonfinite position',()=>{
 const a=new c.Fleet(base,{},1000);a.claim('heli','owner',1500);assert.equal(a.park('heli','guest',{x:96,z:-164,yaw:0},2000),false);assert.equal(a.park('heli','owner',{x:NaN,z:2,yaw:0},2000),false);assert.equal(a.data.craft.heli.pilot,'owner');
});
test('air operations: base replenishment waits for a low-hovering aircraft to clear the pad and resumes without resetting the timer',()=>{
 const f=new c.Fleet(base,{},1000);f.claim('heli','a',1500);f.depart('heli','a',2000);f.data.craft.heli.y=2;assert.equal(f.tick(182000).length,0);assert.equal(f.data.slots.heli.spawnAt,182000);f.data.craft.heli.y=20;assert.equal(f.tick(182001)[0],'heli-r1');
});
test('air operations: a returned aircraft can depart again and start a new replenishment cycle',()=>{
 const f=new c.Fleet(base,{},1000);f.claim('heli','a',1500);f.depart('heli','a',2000);f.park('heli','a',{x:96,z:-164,yaw:0},5000);f.tick(182000);f.claim('heli','b',183000);assert(f.depart('heli','b',184000));assert.equal(f.data.slots.heli.spawnAt,364000);
});
test('air operations: the V2 publisher actually carries fleet state without weakening existing database rules',()=>{
 const connector=fs.readFileSync('games/otthi/assets/js/multiplayer-rtdb.js','utf8');assert(connector.includes('a:snapshot?.a||null'));const rules=JSON.parse(fs.readFileSync('games/otthi/firebase-database.rules.json','utf8'));assert(rules.rules);
 assert(source.includes("window.addEventListener('otthi:event-v2',airReceiveCommand)"));assert(source.includes("c.pilot===uid"));assert(source.includes("e.kind!=='air-fleet'"));
});
test('air operations: touchdown is published immediately and includes the grounded state used by other pilots',()=>{
 const family=fs.readFileSync('games/otthi/src/modules/48-family-transport.js','utf8'),start=family.indexOf('  function familyCarryPresence()'),end=family.indexOf('\n',start);
 let ride={kind:'aircraft',id:'heli',mode:'helicopter',hostUid:'a',x:30,y:1.6,z:40,yaw:0,pitch:0,roll:0,onGround:false,vx:0,vy:0,vz:0};
 const scope={player:{vehicle:false,boating:false,car:{},boat:{}},sharedWorldOwnId:()=> 'a',familyVehicleSeatsUsed:()=>0,familyCarryParty:()=>({controller:'thiago',members:['thiago']}),familyRideForOwner:()=>ride};vm.createContext(scope);vm.runInContext(family.slice(start,end),scope);
 const airborne=scope.familyCarryPresence();assert.equal(airborne.familyRide.onGround,false);ride.onGround=true;const landed=scope.familyCarryPresence();assert.equal(landed.familyRide.onGround,true);assert.notEqual(landed.familyTravelSig,airborne.familyTravelSig);assert.equal(landed.familyRide.vy,0);
});
test('air operations: a guest can park after its walking presence arrives, then another player can board the same aircraft',()=>{
 const fleet=new c.Fleet(base,{},1000);fleet.claim('heli','pilot-a',2000);fleet.depart('heli','pilot-a',3000);
 const scope={airOperations:{fleet},airEnsure:()=>true,sharedWorldIsAuthority:()=>true,remotePresence:new Map([['pilot-a',{x:40,z:20,familyRide:null}]]),groundHeightAt:()=>0,campaignAircraftHeight:()=>1.6,airNow:()=>10000,airSyncObstacles(){},sharedWorldRuntime:{captureAt:1}};
 vm.createContext(scope);vm.runInContext(source.slice(source.indexOf(' function airParkPoseValid'),source.indexOf(" window.addEventListener('otthi:event-v2'")),scope);
 const pose={x:35,y:1.6,z:20,yaw:.4,hp:80,vx:0,vy:0,vz:0};scope.airReceiveCommand({detail:{kind:'air-fleet',actorUid:'pilot-a',payload:{action:'park',id:'heli',pose}}});
 assert.equal(fleet.data.craft.heli.status,'parked');assert.equal(fleet.data.craft.heli.pilot,'');assert.equal(fleet.data.craft.heli.x,35);assert(fleet.claim('heli','pilot-b',10001));assert.equal(fleet.data.craft.heli.pilot,'pilot-b');assert.equal(fleet.data.craft.heli.hp,80);
});
test('air operations: a stale pre-landing presence does not reject a valid stop, while airborne, moving, distant and wrong-pilot park requests are refused',()=>{
 const fleet=new c.Fleet(base,{},1000);fleet.claim('heli','pilot-a',2000);const ride={kind:'aircraft',id:'heli',x:35,y:3,z:20,onGround:false},presence={x:35,z:20,familyRide:ride};
 const scope={airOperations:{fleet},airEnsure:()=>true,sharedWorldIsAuthority:()=>true,remotePresence:new Map([['pilot-a',presence],['guest',presence]]),groundHeightAt:()=>0,campaignAircraftHeight:()=>1.6,airNow:()=>10000,airSyncObstacles(){},sharedWorldRuntime:{captureAt:1}};
 vm.createContext(scope);vm.runInContext(source.slice(source.indexOf(' function airParkPoseValid'),source.indexOf(" window.addEventListener('otthi:event-v2'")),scope);
 const pose={x:35,y:1.6,z:20,yaw:0,vx:0,vy:0,vz:0};assert(scope.airParkPoseValid(fleet.data.craft.heli,presence,pose));
 for(const invalid of [{...pose,y:50},{...pose,vx:12},{...pose,vy:-6},{...pose,x:200},{...pose,yaw:NaN}])assert.equal(scope.airParkPoseValid(fleet.data.craft.heli,presence,invalid),false);
 scope.airReceiveCommand({detail:{kind:'air-fleet',actorUid:'guest',payload:{action:'park',id:'heli',pose}}});assert.equal(fleet.data.craft.heli.pilot,'pilot-a');
});

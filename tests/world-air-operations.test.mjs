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
test('air operations: the V2 publisher actually carries fleet state without weakening existing database rules',()=>{
 const connector=fs.readFileSync('games/otthi/assets/js/multiplayer-rtdb.js','utf8');assert(connector.includes('a:snapshot?.a||null'));const rules=JSON.parse(fs.readFileSync('games/otthi/firebase-database.rules.json','utf8'));assert(rules.rules);
 assert(source.includes("window.addEventListener('otthi:event-v2',airReceiveCommand)"));assert(source.includes("c.pilot===uid"));assert(source.includes("e.kind!=='air-fleet'"));
});

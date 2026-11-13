import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function fixture({age=4500,road=true}={}){
 let now=10000;
 const c=vm.createContext({performance:{now:()=>now},world:{},player:{},Math,clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
 const source=fs.readFileSync('games/otthi/src/modules/07-navigation-traffic-routes.js','utf8');
 vm.runInContext(source.slice(0,source.indexOf('  function graphAdd(')),c);
 const make=(id,x,z,yaw,queued)=>({id,type:'bus',route:{number:id},speed:6,currentSpeed:0,trafficQueuedAt:queued,group:{position:{x,z},rotation:{y:yaw},userData:{}}});
 const yielding=make('a',0,0,0,age),priority=make('b',2.7,0,Math.PI,4000),rear=make('rear',0,-7,0,4700);
 const list=[yielding,priority,rear].map(ref=>({...ref,ref}));
 c.trafficActorList=()=>list;c.nearbyTrafficActors=()=>list;c.pointOnRoad=()=>road;c.nearbyWorldColliders=()=>[];
 const before=new Map(list.map(a=>[a.id,{x:a.group.position.x,z:a.group.position.z,heading:a.group.rotation.y}]));
 assert(!c.trafficBodiesOverlap(c.trafficBody(list[0]),c.trafficBody(list[1]),.24),'the prior frame is physically clear');
 yielding.group.rotation.y=.2;
 assert(c.trafficBodiesOverlap(c.trafficBody(list[0]),c.trafficBody(list[1]),.24),'the next native steering pose would conflict');
 return{c,yielding,priority,rear,list,before};
}

test('an aged speculative turn opens bounded safe clearance after rewinding instead of retrying forever from the same pose',()=>{
 const f=fixture();f.c.resolveTrafficOverlaps(f.before);
 assert(Math.hypot(f.yielding.group.position.x,f.yielding.group.position.z)>.01,'an old blocked turn must use the existing incremental clearance controller even when rollback removed overlap');
 assert(Math.hypot(f.yielding.group.position.x,f.yielding.group.position.z)<=.221);
 assert(!f.c.trafficBodiesOverlap(f.c.trafficBody(f.list[0]),f.c.trafficBody(f.list[1]),.24));
 assert(!f.c.trafficBodiesOverlap(f.c.trafficBody(f.list[0]),f.c.trafficBody(f.list[2]),.10));
 assert.equal(f.yielding.currentSpeed,0);
});

test('a fresh conflict only rewinds and a blocked roadside never invents a clearance move',()=>{
 for(const options of [{age:9900},{road:false}]){
  const f=fixture(options);f.c.resolveTrafficOverlaps(f.before);
  assert.equal(f.yielding.group.position.x,0);assert.equal(f.yielding.group.position.z,0);
  assert.equal(f.yielding.group.rotation.y,0);
 }
});

test('predicted free movement does not erase queue age until the actual vehicle has progressed',()=>{
 const f=fixture();f.yielding.group.rotation.y=0;
 f.c.nearbyTrafficActors=()=>[];f.c.trafficPedestrianFactor=()=>1;
 f.yielding.trafficQueuePose={x:0,z:0};
 for(let i=0;i<12;i++)assert.equal(f.c.trafficSpeedFactor(f.yielding,0,8),1);
 assert.equal(f.yielding.trafficQueuedAt,4500,'speculative permission alone cannot make an old stopped vehicle newly queued each tick');
 f.yielding.group.position.z=.81;
 assert.equal(f.c.trafficSpeedFactor(f.yielding,0,8),1);
 assert.equal(f.yielding.trafficQueuedAt,0,'actual forward progress releases aged priority');
});

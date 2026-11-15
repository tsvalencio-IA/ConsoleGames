import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function fixture(){
 const source=fs.readFileSync('games/otthi/src/modules/07-navigation-traffic-routes.js','utf8');
 const c=vm.createContext({performance:{now:()=>10000},world:{},player:{},Math});
 vm.runInContext(source.slice(0,source.indexOf('  function graphAdd(')),c);
 const actor=(id,at,yaw,x,z)=>({id,type:'car',trafficQueuedAt:at,group:{position:{x,z},rotation:{y:yaw},userData:{}},speed:7,currentSpeed:0});
 const cars=[actor('z',4000,0,0,-7),actor('m',4050,Math.PI/2,-7,0),actor('a',4100,Math.PI,0,7)];
 const yields=(a,b)=>c.trafficYields(a,{...b,ref:b},a.group.rotation.y);
 return{c,cars,yields};
}

test('three long-waiting approaches arriving within100ms cannot form an aged priority cycle',()=>{
 const {cars,yields}=fixture(),[oldest,middle,newest]=cars;
 assert.equal(yields(oldest,middle),false,'the oldest approach cannot yield to the next arrival');
 assert.equal(yields(middle,newest),false);
 assert.equal(yields(newest,oldest),true);
 for(const first of cars)for(const second of cars)for(const third of cars){
  if(new Set([first,second,third]).size!==3)continue;
  assert(!(yields(first,second)&&yields(second,third)&&yields(third,first)),'aged circular wait must be impossible for any iteration order');
 }
});

test('aged queue ordering remains transitive across close arrival times and exact simultaneous ties',()=>{
 const {cars,yields}=fixture();
 for(const ages of [[4000,4000,4000],[4000,4001,4080],[4000,4079,4081],[4000,4080,4160],[4000,4000,4000.1]]){
  cars.forEach((car,i)=>car.trafficQueuedAt=ages[i]);
  const expected=[...cars].sort((a,b)=>a.trafficQueuedAt-b.trafficQueuedAt||String(a.id).localeCompare(String(b.id)));
  for(let i=0;i<expected.length;i++)for(let j=i+1;j<expected.length;j++){
   assert.equal(yields(expected[i],expected[j]),false);
   assert.equal(yields(expected[j],expected[i]),true);
  }
 }
});

test('incident responders retain priority over older civilian queues',()=>{
 const {cars,yields}=fixture(),[oldest,middle,newest]=cars;
 newest.incidentTargetId='active-emergency';
 assert.equal(yields(oldest,newest),true);
 assert.equal(yields(middle,newest),true);
 assert.equal(yields(newest,oldest),false);
});

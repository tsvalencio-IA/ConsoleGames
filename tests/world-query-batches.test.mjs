import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const read=name=>fs.readFileSync('games/otthi/src/modules/'+name,'utf8');
test('synchronous family path batches match exhaustive moving-vehicle collisions, including trailers and missing model metadata',()=>{
  let trafficReads=0;const world={vehicles:[],colliders:[]},traffic=[],c=vm.createContext({window:{},world,Math,Set,currentHouse:null,waterAt:()=>false,groundHeightAt:()=>1,v704WorldBounds:()=>({minX:-5000,maxX:5000,minZ:-5000,maxZ:5000}),trafficActorList:()=>{trafficReads++;return traffic;},lerp:(a,b,t)=>a+(b-a)*t});
  vm.runInContext(read('70-world-query-budget.js'),c);
  const fleet=read('50-fleet-collection.js'),collision=read('25-render-init-resize-position-collision.js'),family=read('41-family-adventure.js');
  vm.runInContext(fleet.slice(fleet.indexOf('  function brazilSpecialFootprint('),fleet.indexOf('  function brazilDriveProbes(')),c);
  vm.runInContext(collision.slice(collision.indexOf('  function positionBlockedForPlayer('),collision.indexOf('  function safePointNear(')),c);
  vm.runInContext(family.slice(family.indexOf('  function familyClear('),family.indexOf('  function familyApplyCommand(')),c);
  let seed=177;const random=()=>{seed=Math.imul(seed,1664525)+1013904223|0;return(seed>>>0)/4294967296;};
  const specs=[null,{front:2.1,rear:-2.4,halfWidth:.8},{front:7,rear:-8,halfWidth:1.3,bus:true},{front:1.64,rear:-9.5,halfWidth:1.02,articulated:true},{front:30,rear:-25,halfWidth:2,articulated:true},{front:undefined,rear:undefined}];
  for(let i=0;i<150;i++){const data=specs[i%specs.length],angle=random()*2.2-1.1;world.vehicles.push({group:{visible:i%7!==0,position:{x:(random()-.5)*300,z:(random()-.5)*300},rotation:{y:random()*6.28},userData:{brazilRoot:data?{userData:data,getObjectByName:()=>({rotation:{y:angle}})}:null}}});traffic.push({group:{position:{x:(random()-.5)*300,z:(random()-.5)*300}},radius:i%5===0?3.05:1.45,ref:{}});}
  for(let ray=0;ray<90;ray++){
    const a={x:(random()-.5)*300,z:(random()-.5)*300},b={x:a.x+(random()-.5)*100,z:a.z+(random()-.5)*100},options=c.worldSegmentCollisionOptions(a,b,.25),steps=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.22));let clear=true;
    assert(options.parkedVehicleCandidates.length<world.vehicles.length);
    for(let i=0;i<=steps;i++){const x=a.x+(b.x-a.x)*i/steps,z=a.z+(b.z-a.z)*i/steps,full=c.positionBlockedForPlayer(x,z,.25);assert.equal(c.positionBlockedForPlayer(x,z,.25,options),full);if(full)clear=false;}
    assert.equal(c.familyClear(a,b),clear);
  }
  world.vehicles=[];traffic.length=0;assert(c.familyClear({x:0,z:0},{x:100,z:0}));assert.equal(trafficReads>0,true);
  traffic.push({group:{position:{x:50,z:0}},radius:1});assert.equal(c.familyClear({x:0,z:0},{x:100,z:0}),false);
  traffic[0].group.position.z=100;const before=trafficReads;assert(c.familyClear({x:0,z:0},{x:100,z:0}));assert.equal(trafficReads-before,1,'one traffic lookup for every sample of this clear path');
});
test('batched visual transforms equal native Three world positions and extents after parent motion and reparenting',()=>{
  const module={exports:{}};vm.runInNewContext(fs.readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),{module,exports:module.exports});const T=module.exports,c=vm.createContext({});
  const visual=read('00a-visual-foundation-avatar-v2.js');vm.runInContext(visual.slice(visual.indexOf('  function visualWorldMatrix('),visual.indexOf('  function updateManagedOutlineVisibility(')),c);
  const root=new T.Group(),parent=new T.Group(),children=Array.from({length:200},()=>new T.Object3D());root.add(parent);parent.add(...children);root.position.set(10,7,-50);parent.rotation.set(.5,.3,-.4);parent.scale.set(-2,3,.5);
  for(let round=0;round<3;round++){
    parent.position.x+=3;parent.rotation.y+=.2;if(round===2)root.add(children[0]);const expected=children.map((o,i)=>{o.position.set(i*.1,2,-i*.3);return{p:o.getWorldPosition(new T.Vector3()),s:o.getWorldScale(new T.Vector3())};});
    let rootUpdates=0;const original=root.updateWorldMatrix;root.updateWorldMatrix=function(...args){rootUpdates++;return original.apply(this,args);};const visited=new Set();
    children.forEach((o,i)=>{const matrix=c.visualWorldMatrix(o,visited),p=new T.Vector3().setFromMatrixPosition(matrix),s=new T.Vector3().setFromMatrixScale(matrix);assert(p.distanceTo(expected[i].p)<1e-10);assert(Math.abs(Math.max(...s.toArray().map(Math.abs))-Math.max(...expected[i].s.toArray().map(Math.abs)))<1e-10);});
    assert.equal(rootUpdates,1,'shared ancestors update once during a visibility pass');root.updateWorldMatrix=original;
  }
});

import test from'node:test';import assert from'node:assert/strict';import vm from'node:vm';import{readFileSync}from'node:fs';
const source=readFileSync('games/otthi/src/modules/16-emergency-services.js','utf8');
const body=source.slice(source.indexOf('  function returnServiceVehicleHome('),source.indexOf('  function createFireIncidentSite('));
test('idle service fleets never recalculate routes while already parked; a displaced vehicle still returns home',()=>{
 let routes=0;const car={home:{x:14,z:-30,heading:0},group:{position:{x:14,y:.02,z:-30,set(x,y,z){Object.assign(this,{x,y,z});}},rotation:{y:1.5}},serviceRoute:[],currentSpeed:0};
 const c=vm.createContext({moveServiceVehicle(v,target,dt){routes++;const p=v.group.position,d=Math.hypot(p.x-target.x,p.z-target.z),step=Math.min(d,dt*4);p.x+=(target.x-p.x)/d*step;p.z+=(target.z-p.z)/d*step;return Math.hypot(p.x-target.x,p.z-target.z);}});vm.runInContext(body,c);
 for(let i=0;i<1000;i++)c.returnServiceVehicleHome(car,.1);assert.equal(routes,0);assert.equal(car.group.rotation.y,0);
 car.group.position.x+=6;for(let i=0;i<100;i++)c.returnServiceVehicleHome(car,.1);assert(routes>0&&routes<20);assert.equal(car.group.position.x,14);assert.equal(car.group.position.z,-30);
 const done=routes;for(let i=0;i<1000;i++)c.returnServiceVehicleHome(car,.1);assert.equal(routes,done);car.occupied=true;car.group.position.x+=6;c.returnServiceVehicleHome(car,.1);assert.equal(car.group.position.x,20,'an occupied vehicle remains under driver control');
});
test('highway rail batching preserves every instance and shared cached geometry; dynamic nested objects remain independent',()=>{
 const module={exports:{}};vm.runInNewContext(readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),{module,exports:module.exports,console});const T=module.exports,root=new T.Group(),material=new T.MeshStandardMaterial({color:0x8899aa}),geometry=new T.BoxGeometry(.12,1,3);let disposed=0;geometry.addEventListener('dispose',()=>disposed++);const expected=[];
 for(let i=0;i<8;i++){const m=new T.Mesh(geometry,material);m.position.set(i*4,.5,-3);m.rotation.y=.3;m.updateMatrix();expected.push(m.matrix.clone().multiply(new T.Matrix4().makeScale(.12,1,3)));root.add(m);}const moving=new T.Group(),arm=new T.Mesh(geometry,material);moving.add(arm);root.add(moving);
 const source=readFileSync('games/otthi/src/modules/14a-ottovias-highway-v7054.js','utf8'),fn=source.slice(source.indexOf('  function batchHighwayRailBoxes('),source.indexOf('  function createOttoviasRoadSegment('));const c=vm.createContext({THREE:T,sharedBoxGeometry:()=>new T.BoxGeometry(1,1,1)});vm.runInContext(fn,c);c.batchHighwayRailBoxes(root);
 const batch=root.children.find(m=>m.isInstancedMesh);assert.equal(batch.count,8);assert.equal(root.children.length,2);assert.equal(moving.children[0],arm);assert.equal(disposed,0,'shared source geometry remains valid for other world objects');
 for(let i=0;i<8;i++){const matrix=new T.Matrix4();batch.getMatrixAt(i,matrix);for(let j=0;j<16;j++)assert(Math.abs(matrix.elements[j]-expected[i].elements[j])<1e-5);}
});

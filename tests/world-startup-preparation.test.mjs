import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('games/otthi/src/modules/29-game-loop-controls-gamepad.js','utf8');
const mod={exports:{}};vm.runInNewContext(fs.readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),{module:mod,exports:mod.exports});const T=mod.exports;
function cameraFixture(failAt=0){
 const camera=new T.PerspectiveCamera(67,1,.1,200),viewport=new T.Vector4(3,4,393,852),scissor=new T.Vector4(5,6,300,700),savedViewport=viewport.clone(),savedScissor=scissor.clone();camera.position.set(1,2,3);camera.quaternion.setFromAxisAngle(new T.Vector3(0,1,0),.7);
 const saved={position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),fov:camera.fov},draws=[];let finishes=0,restores=0,scissorTest=true;
 const c=vm.createContext({URLSearchParams,location:{search:"?cameraFull=1"},otthiBootMetrics:{views:[],events:[]},THREE:T,camera,cameraYaw:.8,cameraPitch:.5,cameraZoom:2,scene:{},perf:{},performance:{now:()=>0},showWorldLoading(){},nextPaint:async()=>{},updateCamera(){camera.position.set(9,9,9);camera.fov=32;},updateVisualLOD(){},lockStableSceneVisibility(){},prepareHomeRender:()=>()=>restores++,prepareWorldPointLights:()=>()=>restores++,renderer:{info:{memory:{geometries:7,textures:4},programs:[1,2]},getViewport:v=>v.copy(viewport),getScissor:v=>v.copy(scissor),getScissorTest:()=>scissorTest,setScissorTest:v=>scissorTest=v,setViewport(...args){args.length===1?viewport.copy(args[0]):viewport.set(...args);},setScissor:v=>scissor.copy(v),getContext:()=>({finish(){finishes++;}}),render(){draws.push([c.cameraYaw,c.cameraPitch]);if(draws.length===failAt)throw Error('test GPU failure');}}});
 vm.runInContext(source.slice(source.indexOf('  async function warmWorldCameraViews()'),source.indexOf('  async function prepareVehicleTemplates()')),c);
 return{c,camera,draws,check(){assert.deepEqual(viewport.toArray(),savedViewport.toArray());assert.deepEqual(scissor.toArray(),savedScissor.toArray());assert(scissorTest);assert.deepEqual(camera.position.toArray(),saved.position);assert.deepEqual(camera.quaternion.toArray(),saved.quaternion);assert.equal(camera.fov,saved.fov);assert.equal(c.cameraYaw,.8);assert.equal(c.cameraPitch,.5);assert.equal(c.cameraZoom,2);assert.equal(restores,draws.length*2);},finishes:()=>finishes};
}
test('camera preparation keeps every view and restores the actual camera, viewport and lights after the batched GPU queue completes',async()=>{
 const f=cameraFixture();const result=await f.c.warmWorldCameraViews();assert.equal(result.views,12);assert.equal(f.draws.length,12);assert.equal(new Set(f.draws.map(v=>v.join(','))).size,12);assert.equal(f.finishes(),3);f.check();
});
test('an interrupted camera preparation restores the playable view and temporary lights before surfacing failure',async()=>{
 const f=cameraFixture(3);await assert.rejects(f.c.warmWorldCameraViews(),/test GPU failure/);assert.equal(f.draws.length,3);f.check();
});
test('cached fleet preparation keeps all models without spending a separate frame on each, and yields for expensive models',async()=>{
 for(const cost of[0,9]){
  const prepared=[],catalog=Object.fromEntries(Array.from({length:44},(_,i)=>['model'+i,{}]));let time=0,paints=0,scenePreps=0;
  const c=vm.createContext({window:{OTBrazilVehicles:{catalog,prepare(T,key){prepared.push(key);time+=cost;}}},THREE:{},perf:{},performance:{now:()=>time},showWorldLoading(){},nextPaint:async()=>{paints++;},prepareWorldFirstFrame:async()=>{scenePreps++;}});
  vm.runInContext(source.slice(source.indexOf('  async function prepareVehicleTemplates()'),source.indexOf('  function showWorldLoading(')),c);
  await c.prepareVehicleTemplates();assert.deepEqual(prepared,Object.keys(catalog));assert.equal(scenePreps,1);assert(c.perf.vehicleTemplatesReady);assert.equal(c.perf.vehiclePreparation.models,44);assert.equal(paints,11);
  await c.prepareVehicleTemplates();assert.equal(prepared.length,44,'resuming an initialized world must reuse its prepared fleet');
 }
});

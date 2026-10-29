import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
test('vehicle shader preparation uses the cached materials and leaves no temporary model in the world, including on failure',()=>{
 const c=vm.createContext({window:{},console});vm.runInContext(fs.readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),c);
 for(const name of ['brazilian-details','brazilian-expansion','brazilian-precision','brazilian-coachwork','brazilian-models'])vm.runInContext(fs.readFileSync('games/otthi/assets/js/vehicles/'+name+'.js','utf8'),c);
 const T=c.THREE,f=c.window.OTBrazilVehicles,scene=new T.Scene(),existing=new T.Group(),camera=new T.PerspectiveCamera();scene.add(existing);
 for(const key of ['fusca','gol','kombi'])assert(f.prepare(T,key));const first=f.create(T,'fusca'),geometries=[],materials=[];first.traverse(o=>{if(o.isMesh){geometries.push(o.geometry);materials.push(o.material);}});
 let calls=0;const renderer={compile(s,cam){calls++;assert.equal(s,scene);assert.equal(cam,camera);const hidden=s.getObjectByName('OTTHI_VEHICLE_SHADER_PREPARATION');assert.equal(hidden.visible,false);assert.equal(hidden.children.length,3);assert(hidden.children.some(r=>r.getObjectByName('paint')));}};
 assert.equal(f.precompile(T,renderer,scene,camera),3);assert.equal(calls,1);assert.equal(scene.children.length,1);assert.equal(scene.children[0],existing);
 for(const geometry of geometries)assert(geometry.attributes.position.count>0);for(const material of materials)assert(material.isMaterial);
 assert.throws(()=>f.precompile(T,{compile(){throw Error('GPU unavailable');}},scene,camera),/GPU unavailable/);assert.equal(scene.children.length,1);assert.equal(scene.children[0],existing);assert(f.create(T,'fusca').children.length>0);
});

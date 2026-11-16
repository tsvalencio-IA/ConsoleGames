import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function fixture(){
  const module={exports:{}};vm.runInNewContext(fs.readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),{module,exports:module.exports});
  const THREE=module.exports,scene=new THREE.Scene(),world={glows:[]},camera=new THREE.PerspectiveCamera(60,1,.1,100);
  camera.position.set(0,2,8);camera.lookAt(0,1,0);camera.updateProjectionMatrix();
  const c=vm.createContext({window:{},THREE,scene,world,camera,renderer:{physicallyCorrectLights:false}});
  vm.runInContext(fs.readFileSync('games/otthi/src/modules/71-world-light-budget.js','utf8'),c);
  const add=(x,z,distance=3,decay=1)=>{const light=new THREE.PointLight(0xffaa55,.5,distance,decay);light.position.set(x,1,z);scene.add(light);world.glows.push(light);return light;};
  return{c,scene,world,camera,add};
}
test('visible light scan never mutates lamps',()=>{
  const f=fixture(),near=f.add(0,0),far=f.add(500,0),off=f.add(0,0);off.visible=false;
  assert.equal(f.c.countWorldPointLightsForView(f.camera),1);
  assert(near.visible&&far.visible&&!off.visible);
  assert(!f.scene.children.some(o=>o.name==='OTTHI_LIGHT_PADDING'));
});
test('8-light buckets have no fixed maximum and retain rare dense views',()=>{
  const f=fixture(),b=f.c.window.OTTHI_LIGHT_BUDGET;
  assert.equal(b.bucketFor(0),0);assert.equal(b.bucketFor(1),16);assert.equal(b.bucketFor(64),64);assert.equal(b.bucketFor(65),72);assert.equal(b.bucketFor(115),120);
});
test('prepared buckets are recorded independently',()=>{
  const f=fixture();f.c.markLightingBucketPrepared(64);f.c.markLightingBucketPrepared(72);
  assert.deepEqual([...f.c.window.OTTHI_LIGHT_BUDGET.preparedBuckets()],[64,72]);
});

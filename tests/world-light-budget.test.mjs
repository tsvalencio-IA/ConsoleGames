import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function fixture(){
  const module={exports:{}};vm.runInNewContext(fs.readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),{module,exports:module.exports});
  const THREE=module.exports,scene=new THREE.Scene(),world={glows:[]},camera=new THREE.PerspectiveCamera(60,1,.1,100);
  camera.position.set(0,2,8);camera.lookAt(0,1,0);camera.updateProjectionMatrix();
  const c=vm.createContext({window:{},THREE,scene,world,renderer:{physicallyCorrectLights:false}});vm.runInContext(fs.readFileSync('games/otthi/src/modules/71-world-light-budget.js','utf8'),c);
  const add=(x,z,distance=3,decay=1)=>{const light=new THREE.PointLight(0xffaa55,.5,distance,decay);light.position.set(x,1,z);scene.add(light);world.glows.push(light);return light;};
  return{c,THREE,scene,world,camera,add};
}
test('finite lights outside the image are excluded only during rendering; every intersecting light stays',()=>{
  const f=fixture(),near=f.add(0,0),far=f.add(500,0),behind=f.add(0,30),disabled=f.add(0,0);disabled.visible=false;
  const restore=f.c.prepareWorldPointLights(f.camera);assert(near.visible);assert(!far.visible&&!behind.visible);assert(!disabled.visible);
  const stats=f.c.window.OTTHI_LIGHT_BUDGET.diagnostics();assert.equal(stats.active,1);assert.equal(stats.culled,2);assert.equal(stats.padded,15);
  for(const o of f.scene.children.filter(o=>o.name==='OTTHI_LIGHT_PADDING'))assert.equal(o.intensity,0);
  restore();assert(near.visible&&far.visible&&behind.visible);assert(!disabled.visible);assert(!f.scene.children.some(o=>o.name==='OTTHI_LIGHT_PADDING'));
});
test('unlimited, zero-decay and shadow-casting lights are preserved; hidden parents are respected',()=>{
  const f=fixture(),unlimited=f.add(500,0,0),noDecay=f.add(500,0,2,0),shadow=f.add(500,0);shadow.castShadow=true;
  const group=new f.THREE.Group(),hidden=f.add(0,0);f.scene.add(group);group.add(hidden);group.visible=false;
  const restore=f.c.prepareWorldPointLights(f.camera);assert(unlimited.visible&&noDecay.visible&&shadow.visible);assert(hidden.visible,'parent visibility is never overwritten');assert.equal(f.c.window.OTTHI_LIGHT_BUDGET.diagnostics().active,3);restore();
  f.c.renderer.physicallyCorrectLights=true;const done=f.c.prepareWorldPointLights(f.camera);assert(!noDecay.visible,'physical lighting still has a finite cutoff at decay zero');assert(unlimited.visible&&shadow.visible);done();
});
test('lighting has no population cap and restores correctly as the camera turns',()=>{
  const f=fixture();for(let i=0;i<97;i++)f.add((i%7-3)*.05,-Math.floor(i/7)*.05);
  let restore=f.c.prepareWorldPointLights(f.camera);assert.equal(f.c.window.OTTHI_LIGHT_BUDGET.diagnostics().active,97);assert.equal(f.c.window.OTTHI_LIGHT_BUDGET.diagnostics().padded,7);restore();
  f.camera.lookAt(0,2,30);restore=f.c.prepareWorldPointLights(f.camera);assert.equal(f.c.window.OTTHI_LIGHT_BUDGET.diagnostics().active,0);restore();assert(f.world.glows.every(o=>o.visible));
});
test('a quality setting with all glow lights disabled creates no padding or point-light shaders',()=>{
  const f=fixture();f.add(0,0).visible=false;const restore=f.c.prepareWorldPointLights(f.camera);
  assert.equal(f.c.window.OTTHI_LIGHT_BUDGET.diagnostics().padded,0);assert(!f.scene.children.some(o=>o.name==='OTTHI_LIGHT_PADDING'));restore();
});
test('point-light BRDF guard is installed once and leaves spot/directional lighting unchanged',()=>{
  const f=fixture(),source=f.THREE.ShaderChunk.lights_fragment_begin;f.c.configureWorldPointLightEvaluation();const optimized=f.THREE.ShaderChunk.lights_fragment_begin;f.c.configureWorldPointLightEvaluation();assert.equal(f.THREE.ShaderChunk.lights_fragment_begin,optimized);
  assert.equal((optimized.match(/OTTHI_VISIBLE_POINT_LIGHT/g)||[]).length,1);
  assert.equal(optimized.slice(optimized.indexOf('#if ( NUM_SPOT_LIGHTS')),source.slice(source.indexOf('#if ( NUM_SPOT_LIGHTS')));
});

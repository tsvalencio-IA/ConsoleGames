import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import vm from'node:vm';
test('hidden branches skip repeated matrix visits and reappear with all accumulated parent and child transforms',()=>{
 const module={exports:{}};vm.runInNewContext(fs.readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),{module,exports:module.exports});const T=module.exports,s=fs.readFileSync('games/otthi/src/modules/09-responsive-ar-quality-diagnostics.js','utf8'),body=s.slice(s.indexOf('  function configureHiddenWorldTransforms(){'),s.indexOf('  function freezeWorldFrustumCulling(){'));
 const c=vm.createContext({THREE:T});vm.runInContext(body,c);c.configureHiddenWorldTransforms();
 const scene=new T.Scene(),parent=new T.Group(),child=new T.Group(),leaf=new T.Object3D();scene.add(parent);parent.add(child);child.add(leaf);leaf.position.set(1,2,3);scene.updateMatrixWorld();let visits=0;const update=leaf.updateMatrix;leaf.updateMatrix=function(){visits++;return update.call(this);};
 parent.visible=false;parent.position.set(12,0,-5);child.rotation.y=Math.PI/2;leaf.position.x=4;for(let i=0;i<100;i++)scene.updateMatrixWorld();assert.equal(visits,0);
 const demanded=leaf.getWorldPosition(new T.Vector3());assert(Math.abs(demanded.x-15)<1e-8&&Math.abs(demanded.z+9)<1e-8,'hidden positions remain available on demand');
 child.position.z=7;parent.visible=true;scene.updateMatrixWorld();assert(visits>0);const visible=new T.Vector3().setFromMatrixPosition(leaf.matrixWorld);assert(Math.abs(visible.x-15)<1e-8&&Math.abs(visible.z+2)<1e-8);
 parent.visible=false;scene.updateMatrixWorld();parent.position.x=24;parent.visible=true;scene.updateMatrixWorld();assert(Math.abs(new T.Vector3().setFromMatrixPosition(leaf.matrixWorld).x-27)<1e-8);
});

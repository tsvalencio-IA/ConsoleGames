import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=path=>fs.readFileSync(root+path,'utf8');
const hash=value=>createHash('sha256').update(value).digest('hex');

// Use the bundled Three r128 math, not a stand-in skeleton or GPU renderer.
function three(){
 const module={exports:{}};
 vm.runInNewContext(read('games/ar/vendor/three-r128.min.js'),{module,exports:module.exports,console});
 return module.exports;
}

function model(){
 const bytes=fs.readFileSync(root+'games/ar/assets/infantry/soldier.glb');
 assert.equal(bytes.toString('ascii',0,4),'glTF');
 const jsonLength=bytes.readUInt32LE(12);
 const gltf=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
 const binary=bytes.subarray(20+jsonLength+8),dimensions={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
 const accessor=index=>{
  const a=gltf.accessors[index],view=gltf.bufferViews[a.bufferView],width=dimensions[a.type];
  const stride=view.byteStride||width*4,offset=(view.byteOffset||0)+(a.byteOffset||0);
  assert.equal(a.componentType,5126,'animation fixture uses real FLOAT accessors');
  return Array.from({length:a.count},(_,i)=>Array.from({length:width},(_,j)=>binary.readFloatLE(offset+i*stride+j*4)));
 };
 const clips=gltf.animations.filter(a=>['Idle','Walk'].includes(a.name)).map(a=>({
  ...a,samplers:a.samplers.map(s=>{
   assert.equal(s.interpolation||'LINEAR','LINEAR');
   return{times:accessor(s.input).map(v=>v[0]),values:accessor(s.output)};
  })
 }));
 assert.equal(clips.length,2);
 return{gltf,clips};
}

// Hierarchy and animation channels come from the actual Mixamo GLB. Geometry,
// material/rifle creation and skinning on a GPU are deliberately not involved.
function pose(T,gltf,clip,time,mirror,yaw,crouched){
 const scene=new T.Group();scene.scale.z=mirror;scene.position.set(4,.3,-7);
 const actor=new T.Group();actor.position.set(2,0,3);actor.rotation.y=yaw;actor.scale.setScalar(1.2);scene.add(actor);
 const body=new T.Group();actor.add(body);
 const nodes=gltf.nodes.map(n=>{
  const o=new T.Object3D();o.name=n.name;
  if(n.translation)o.position.fromArray(n.translation);
  if(n.rotation)o.quaternion.fromArray(n.rotation);
  if(n.scale)o.scale.fromArray(n.scale);
  if(n.matrix)new T.Matrix4().fromArray(n.matrix).decompose(o.position,o.quaternion,o.scale);
  return o;
 });
 gltf.nodes.forEach((n,i)=>n.children?.forEach(j=>nodes[i].add(nodes[j])));
 gltf.scenes[0].nodes.forEach(i=>body.add(nodes[i]));
 for(const channel of clip.channels){
  const sample=clip.samplers[channel.sampler],duration=sample.times.at(-1),at=duration?time%duration:0;
  let i=0;while(i<sample.times.length-2&&sample.times[i+1]<=at)i++;
  const j=Math.min(i+1,sample.times.length-1);
  const fraction=sample.times[j]===sample.times[i]?0:(at-sample.times[i])/(sample.times[j]-sample.times[i]);
  const o=nodes[channel.target.node];
  if(channel.target.path==='rotation'){
   o.quaternion.slerpQuaternions(new T.Quaternion().fromArray(sample.values[i]),new T.Quaternion().fromArray(sample.values[j]),fraction);
  }else{
   const target=channel.target.path==='translation'?o.position:o.scale;
   target.fromArray(sample.values[i].map((v,k)=>v+(sample.values[j][k]-v)*fraction));
  }
 }
 body.position.y=crouched?-.32:0;
 const bones={};for(const node of nodes)bones[node.name.replace(/^mixamorig:?/,'')]=node;
 return{scene,actor,nodes,bones};
}

function compileAim(T,source){
 return new Function('vector','end','target','turn','return '+source)(new T.Vector3(),new T.Vector3(),new T.Vector3(),new T.Quaternion());
}

function applyAim(f,aim,crouched){
 const b=f.bones,duck=crouched?.32:0;
 const call=(bone,child,x,y,z)=>aim(f.actor,b[bone],b[child],x,y,z);
 call('RightArm','RightForeArm',.36,1.20-duck,.10);
 call('RightForeArm','RightHand',.12,1.34-duck,.16);
 call('LeftArm','LeftForeArm',-.32,1.28-duck,.26);
 call('LeftForeArm','LeftHand',-.01,1.40-duck,.58);
 if(crouched)for(const side of[-1,1]){
  const name=side<0?'Left':'Right';
  call(name+'UpLeg',name+'Leg',side*.13,.48,.29);
  call(name+'Leg',name+'Foot',side*.13,.12,.04);
 }
}

test('WAR imported infantry: ancestor-only aim preserves 72 real animation poses without repeatedly walking the whole actor',()=>{
 const T=three(),{gltf,clips}=model();
 const before=read('tests/fixtures/war-infantry-aim-before.txt');
 const source=read('games/ar/combat-infantry.js'),start=source.indexOf('function aim('),end=source.indexOf('function animate(',start);
 assert(start>=0&&end>start,'native aim function must be present');
 const after=source.slice(start,end),functions={before:compileAim(T,before),after:compileAim(T,after)};
 const counts={before:{updateMatrixWorld:0,updateWorldMatrix:0,updateMatrix:0},after:{updateMatrixWorld:0,updateWorldMatrix:0,updateMatrix:0}};
 let current=null;
 const originals=new Map();
 for(const name of Object.keys(counts.before)){
  const fn=T.Object3D.prototype[name];originals.set(name,fn);
  T.Object3D.prototype[name]=function(...args){if(current)counts[current][name]++;return fn.apply(this,args);};
 }
 let cases=0,maxMatrixError=0,maxQuaternionError=0;
 try{
  for(const clip of clips)for(const time of[0,.333,1.2])for(const mirror of[-1,1])for(const yaw of[0,.7,2.5])for(const crouched of[false,true]){
   const a=pose(T,gltf,clip,time,mirror,yaw,crouched),b=pose(T,gltf,clip,time,mirror,yaw,crouched);
   current='before';applyAim(a,functions.before,crouched);
   current='after';applyAim(b,functions.after,crouched);
   current=null;
   a.scene.updateMatrixWorld(true);b.scene.updateMatrixWorld(true);
   for(let i=0;i<a.nodes.length;i++){
    for(let j=0;j<16;j++)maxMatrixError=Math.max(maxMatrixError,Math.abs(a.nodes[i].matrixWorld.elements[j]-b.nodes[i].matrixWorld.elements[j]));
    for(const key of['x','y','z','w'])maxQuaternionError=Math.max(maxQuaternionError,Math.abs(a.nodes[i].quaternion[key]-b.nodes[i].quaternion[key]));
   }
   cases++;
  }
 }finally{
  current=null;for(const[name,fn]of originals)T.Object3D.prototype[name]=fn;
 }
 assert.equal(cases,72);
 assert(maxMatrixError<1e-10,'world poses must remain equivalent');
 assert(maxQuaternionError<1e-10,'local bone articulations must remain equivalent');
 assert.equal(counts.after.updateMatrixWorld,0,'aim should not force a full actor subtree update');
 assert.equal(counts.after.updateWorldMatrix,counts.before.updateWorldMatrix,'coordinate conversions still refresh their needed ancestors');
 assert(counts.after.updateMatrix<counts.before.updateMatrix*.2,'matrix composition work must drop materially for the real imported hierarchy');
 const report={
  passed:true,cases,hierarchyNodes:gltf.nodes.length,clips:clips.map(c=>c.name),
  source:{before:'tests/fixtures/war-infantry-aim-before.txt',after:'games/ar/combat-infantry.js aim()',beforeAimSha256:hash(before),afterAimSha256:hash(after)},
  mirroredParentAndYaw:true,crouchedAndStanding:true,counts,maxMatrixError,maxQuaternionError,
  limits:['Matrix-operation counts, not elapsed performance, native rendering or physical-device FPS.','The actual bundled GLB hierarchy and LINEAR Idle/Walk channels are decoded; geometry, rifle meshes, GPU skinning and pixels are not loaded. The count is conservative for the complete actor.']
 };
 fs.mkdirSync(root+'test-results/war-infantry-pose-budget',{recursive:true});
 fs.writeFileSync(root+'test-results/war-infantry-pose-budget/result.json',JSON.stringify(report,null,2)+'\n');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=name=>fs.readFileSync('games/otthi/src/modules/'+name,'utf8');
function fixture(){
 const module={exports:{}};vm.runInNewContext(fs.readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),{module,exports:module.exports});
 const T=module.exports,world={landmarks:[]},root=new T.Group();
 const material=color=>color?.isMaterial?color:new T.MeshStandardMaterial({color});
 const box=(w,h,d,m,x,y,z,parent)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material(m));mesh.position.set(x,y,z);parent.add(mesh);return mesh;};
 const c=vm.createContext({THREE:T,window:{},world,worldGroup:root,state:{profile:{playerId:'skyline-geometry'}},renderMat:material,box,shadeColor:c=>c,addVoxelOutline(){},createManagedLOD:(id,hi,lo)=>{const lod=new T.LOD();lod.name='LOD_'+id;lod.addLevel(hi,0);lod.addLevel(lo,68);return lod;}});
 vm.runInContext(source('05a-world-layout-v704.js'),c);
 vm.runInContext(source('14-world-district-decoration.js'),c);
 vm.runInContext('createFloatingIsland=()=>{};createStreetTree=()=>{};createCoinTrail=()=>{};createCommercialDistrict();',c);
 return{c,T,world,root};
}
test('snow skyline keeps every original building and clears the complete road and chalet footprints in both detail levels',()=>{
 const {c,T,world}=fixture(),buildings=world.landmarks.filter(g=>g.userData.backdropFootprint);
 assert.equal(buildings.length,13,'all thirteen skyline buildings remain');
 const rects=buildings.map(g=>{const b=new T.Box3().setFromObject(g),p=g.userData.backdropFootprint;
  assert(b.min.x>=g.position.x-p.w/2-1e-6&&b.max.x<=g.position.x+p.w/2+1e-6,'audit covers roof and windows');
  assert(b.min.z>=g.position.z-p.d/2-1e-6&&b.max.z<=g.position.z+p.d/2+1e-6,'audit covers facade and trim');
  return{id:g.name,x:(b.min.x+b.max.x)/2,z:(b.min.z+b.max.z)/2,w:b.max.x-b.min.x,d:b.max.z-b.min.z};});
 const homes=vm.runInContext('v704ProtectedRectangles()',c);
 assert.deepEqual(JSON.parse(JSON.stringify(c.v704BackdropAudit(rects,homes))),[]);
 const audit=c.v704StaticWorldAudit();assert(audit.passed,JSON.stringify(audit.problems));
 // The actual balloon basket and approach remain separated from the skyline.
 for(const p of rects)assert(!c.v704RectOverlap(p,{x:-83,z:208,w:10,d:10},.5));
});
test('the reported old snow road obstruction and chalet overlap cannot pass the new spatial audit',()=>{
 const {c}=fixture(),homes=vm.runInContext('v704ProtectedRectangles()',c);
 const failures=c.v704BackdropAudit([{id:'old-road-building',x:18,z:207,w:12.3,d:11},{id:'old-chalet-building',x:-36,z:207,w:12.3,d:10}],homes);
 assert(failures.some(p=>p.type==='backdrop-on-highway'&&p.a==='old-road-building'&&p.b==='ottovias-snow-pass'));
 assert(failures.some(p=>p.type==='backdrop-on-structure'&&p.a==='old-chalet-building'&&p.b==='civil-snow-home-1'));
});

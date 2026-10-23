/** Original OT vehicle assets. No external models, textures or trademarked designs. */
import fs from 'node:fs';import vm from 'node:vm';
const module={exports:{}};vm.runInNewContext(fs.readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),{module,exports:module.exports});const T=module.exports;
function model(coupe=false){
 const root=new T.Group(),paint=new T.Group(),fixed=new T.Group();paint.name='paint';fixed.name='details';root.add(paint,fixed);
 const material=c=>new T.MeshStandardMaterial({color:c});
 const add=(g,c,x,y,z,sx,sy,sz,parent=fixed)=>{const m=new T.Mesh(g,material(c));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;};
 const box=(c,x,y,z,w,h,d,p=fixed)=>add(new T.BoxGeometry(1,1,1),c,x,y,z,w,h,d,p);
 const ell=(c,x,y,z,w,h,d,p=fixed)=>add(new T.SphereGeometry(1,20,12),c,x,y,z,w,h,d,p);
 box(0x172c3b,0,.22,0,1.65,.16,2.7);ell(0xffffff,0,.46,.1,.82,.31,1.35,paint);
 ell(0xffffff,0,.45,1.12,.64,.22,.62,paint);ell(0x162e40,0,.56,-.2,.42,.25,.68);box(0xffffff,0,.58,1.3,.17,.03,.5,paint);
 for(const side of [-1,1]){
  ell(0xffffff,side*.69,.46,.52,.26,.3,.94,paint);ell(0xffffff,side*.7,.49,-.88,.28,.31,.42,paint);
  box(0xe6edf0,side*.62,.57,1.24,.24,.08,.08);box(0xc74f52,side*.6,.61,-1.05,.22,.07,.06);
  box(0x3e5766,side*.48,.35,-1.22,.09,.09,.48);box(0xdce4e4,side*.48,.38,-1.47,.14,.14,.12);
 }
 if(coupe){ell(0x193c52,0,.83,-.05,.66,.41,.87);ell(0xffffff,0,1.05,-.17,.62,.1,.69,paint);for(const x of [-.57,.57])box(0x253a47,x,.95,-.15,.06,.35,1);}
 else{
  box(0x142737,0,.64,-.36,.53,.42,.53);box(0x101c29,0,.78,-.53,.61,.6,.16);
  const wheel=add(new T.TorusGeometry(.18,.025,8,20),0x151e26,0,.87,.15,1,1,1);wheel.rotation.x=-.6;
  for(const x of [-.5,.5])box(0x718394,x,.9,-.52,.055,.5,.055);
  const roll=add(new T.TorusGeometry(.51,.045,8,20,Math.PI),0x8faaa9,0,1.07,-.52,1,1,1);roll.rotation.x=Math.PI/2;
 }
 box(0x273e4b,0,.68,-1.4,1.8,.1,.25);for(const x of [-.6,.6])box(0x283b48,x,.47,-1.32,.06,.38,.14);
 for(const [i,x,z] of [[0,-.88,.85],[1,.88,.85],[2,-.88,-.86],[3,.88,-.86]]){
  const wheel=new T.Group();wheel.name='wheel-'+i;wheel.position.set(x,.31,z);root.add(wheel);
  const tire=add(new T.CylinderGeometry(.33,.33,.27,20),0x172029,0,0,0,1,1,1,wheel);tire.rotation.z=Math.PI/2;
  const rim=add(new T.CylinderGeometry(.23,.23,.285,16),0xa8bbc3,0,0,0,1,1,1,wheel);rim.rotation.z=Math.PI/2;
  const hub=add(new T.CylinderGeometry(.09,.09,.30,12),0x2a3f50,0,0,0,1,1,1,wheel);hub.rotation.z=Math.PI/2;
  for(let n=0;n<5;n++){const a=n*Math.PI*2/5,spoke=box(0x263c4b,Math.sign(x)*.148,Math.cos(a)*.14,Math.sin(a)*.14,.018,.19,.05,wheel);spoke.rotation.x=a;}
 }
 // Merge rigid pieces by semantic part; preserve four wheel pivots.
 for(const group of [paint,fixed,...root.children.filter(x=>x.name.startsWith('wheel-'))]){
  const positions=[],normals=[],colors=[];
  for(const mesh of group.children.slice()){
   mesh.updateMatrix();const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();g.applyMatrix4(mesh.matrix);const p=g.attributes.position,n=g.attributes.normal,c=mesh.material.color.clone().convertSRGBToLinear();
   for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));colors.push(c.r,c.g,c.b);}group.remove(mesh);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));const mesh=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true}));mesh.name=group.name+'-mesh';group.add(mesh);
 }
 return root;
}
function glb(root,path){
 const doc={asset:{version:'2.0',generator:'OT World original vehicle builder'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:[{name:'OT paint',pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:.35,roughnessFactor:.34}},{name:'OT detail',pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:.19,roughnessFactor:.62}}],accessors:[],bufferViews:[],buffers:[{byteLength:0}]},parts=[];let offset=0;
 function attr(a,type,bounds=false){const data=Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength);const view=doc.bufferViews.length;doc.bufferViews.push({buffer:0,byteOffset:offset,byteLength:data.length,target:34962});parts.push(data);offset+=data.length;const acc={bufferView:view,componentType:5126,count:a.count,type};if(bounds){acc.min=[Infinity,Infinity,Infinity];acc.max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<a.count;i++)for(let j=0;j<3;j++){const v=a.array[i*3+j];acc.min[j]=Math.min(acc.min[j],v);acc.max[j]=Math.max(acc.max[j],v);}}doc.accessors.push(acc);return doc.accessors.length-1;}
 root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,parent=o.parent,name=parent.name;const mesh=doc.meshes.length;doc.meshes.push({name,primitives:[{attributes:{POSITION:attr(g.attributes.position,'VEC3',true),NORMAL:attr(g.attributes.normal,'VEC3'),COLOR_0:attr(g.attributes.color,'VEC3')},material:name==='paint'?0:1}]});doc.scenes[0].nodes.push(doc.nodes.length);doc.nodes.push({name,mesh,translation:parent.position.toArray()});});
 doc.buffers[0].byteLength=offset;let json=Buffer.from(JSON.stringify(doc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const bin=Buffer.concat(parts),header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);jh.writeUInt32LE(json.length);jh.writeUInt32LE(0x4e4f534a,4);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);fs.writeFileSync(path,Buffer.concat([header,jh,json,bh,bin]));console.log(path,fs.statSync(path).size);
}
glb(model(false),'games/otthi/assets/world/vehicles/ot-racer.glb');glb(model(true),'games/otthi/assets/world/vehicles/ot-coupe.glb');

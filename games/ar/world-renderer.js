/* WAR / Aero Strike scenery, Three r128 (local vendor). Rendering only: the
 * simulation remains the owner of positions, targets, cover and weapon state.
 * Cameras use the exact native projection, including focal length and roll.
 * No network, user storage, permissions or control listeners in this module. */
(()=>{
'use strict';
const T=window.THREE;if(!T)return;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const clock=()=>window.performance?.now?.()||Date.now();
const smooth=(a,b,n)=>{const t=clamp((n-a)/(b-a),0,1);return t*t*(3-2*t)};
const random=(seed=1977)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const cache=new WeakMap(),failed=new WeakSet();
const mat4=new T.Matrix4(),quat=new T.Quaternion(),pos=new T.Vector3(),scale=new T.Vector3(),euler=new T.Euler();
const geometries={box:new T.BoxGeometry(1,1,1),round:new T.SphereGeometry(1,10,7),cylinder:new T.CylinderGeometry(.5,.5,1,10),cone:new T.ConeGeometry(.5,1,10),plane:new T.PlaneGeometry(1,1),ring:new T.TorusGeometry(1,.09,6,40)};

function canvasTexture(paint,w=512,h=512){
 const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);
 const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=4;return t;
}
function textureSet(){
 const rnd=random(8181),set={};
 set.concrete=canvasTexture((c,w,h)=>{
  c.fillStyle='#a3a49b';c.fillRect(0,0,w,h);
  for(let i=0;i<13000;i++){const v=130+Math.floor(rnd()*70);c.fillStyle=`rgba(${v},${v},${v-6},.27)`;c.fillRect(rnd()*w,rnd()*h,1+rnd()*3,1+rnd()*3)}
  c.strokeStyle='rgba(47,54,51,.20)';c.lineWidth=2;
  for(let y=0;y<h;y+=128){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();for(let x=64*(y/128%2);x<w;x+=128){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+128);c.stroke()}}
  for(let i=0;i<55;i++){const x=rnd()*w,y=rnd()*h;c.fillStyle='rgba(37,48,43,.09)';c.fillRect(x,y,2,10+rnd()*85)}
 });
 set.asphalt=canvasTexture((c,w,h)=>{
  c.fillStyle='#424b4d';c.fillRect(0,0,w,h);
  for(let i=0;i<24000;i++){c.fillStyle=rnd()>.5?'rgba(180,189,186,.12)':'rgba(7,16,20,.16)';c.fillRect(rnd()*w,rnd()*h,1+rnd()*2,1+rnd()*2)}
  c.strokeStyle='#2c3739';c.lineWidth=1.2;for(let i=0;i<18;i++){let x=rnd()*w,y=rnd()*h;c.beginPath();c.moveTo(x,y);for(let j=0;j<8;j++){x+=(rnd()-.5)*35;y+=rnd()*15;c.lineTo(x,y)}c.stroke()}
 });
 set.ground=canvasTexture((c,w,h)=>{
  c.fillStyle='#76846a';c.fillRect(0,0,w,h);
  for(let i=0;i<18000;i++){const x=rnd()*w,y=rnd()*h,r=1+rnd()*13;c.fillStyle=['#5c7259','#9b9d73','#4b6754','#839568'][i%4];c.globalAlpha=.13;c.fillRect(x,y,r,r*.6)}c.globalAlpha=1;
 });
 set.roof=canvasTexture((c,w,h)=>{
  c.fillStyle='#8a5742';c.fillRect(0,0,w,h);for(let y=0;y<h;y+=20)for(let x=-(y%40?16:0);x<w;x+=32){c.fillStyle=['#9d6b51','#a57858','#805342'][Math.floor(rnd()*3)];c.fillRect(x+1,y+1,30,18);c.fillStyle='rgba(30,26,23,.3)';c.fillRect(x,y+18,32,2)}
 });
 set.metal=canvasTexture((c,w,h)=>{
  c.fillStyle='#7c8b85';c.fillRect(0,0,w,h);for(let x=0;x<w;x+=20){c.fillStyle='rgba(13,29,28,.23)';c.fillRect(x,0,3,h);c.fillStyle='rgba(232,226,198,.17)';c.fillRect(x+4,0,2,h)}for(let i=0;i<650;i++){c.fillStyle='rgba(91,64,36,.18)';c.fillRect(rnd()*w,rnd()*h,1+rnd()*4,1+rnd()*30)}
 });
 set.facades=[];
 for(let variant=0;variant<4;variant++)set.facades.push(canvasTexture((c,w,h)=>{
  c.fillStyle=['#aab3aa','#cfbaa0','#819da6','#c1c1b1'][variant];c.fillRect(0,0,w,h);
  for(let i=0;i<7000;i++){c.fillStyle=rnd()>.5?'rgba(239,235,211,.07)':'rgba(25,43,42,.07)';c.fillRect(rnd()*w,rnd()*h,rnd()*4,rnd()*5)}
  for(let y=12;y<h;y+=64){c.fillStyle='rgba(25,40,41,.22)';c.fillRect(0,y+47,w,3);c.fillStyle='rgba(248,233,204,.23)';c.fillRect(0,y+50,w,2);
   for(let x=14;x<w;x+=64){c.fillStyle='#3c5359';c.fillRect(x-3,y-3,42,43);const lit=rnd()>.78;c.fillStyle=lit?'#d8bd82':['#36596b','#426a7b','#547f87'][Math.floor(rnd()*3)];c.fillRect(x,y,34,34);
    const g=c.createLinearGradient(x,y,x+34,y+34);g.addColorStop(0,'rgba(168,214,221,.5)');g.addColorStop(.5,'rgba(28,56,65,.03)');g.addColorStop(1,'rgba(18,34,42,.3)');c.fillStyle=g;c.fillRect(x,y,34,34);c.fillStyle='#89978f';c.fillRect(x+16,y,2,34);c.fillRect(x,y+19,34,2);c.fillStyle='#e0cfb0';c.fillRect(x-4,y+36,44,3);
   }
  }
 }));
 set.uniform=canvasTexture((c,w,h)=>{
  c.fillStyle='#6b7760';c.fillRect(0,0,w,h);
  for(let i=0;i<440;i++){const x=rnd()*w,y=rnd()*h;c.fillStyle=['#3d5148','#919878','#53604f','#b0a389'][i%4];c.beginPath();c.moveTo(x,y);for(let j=0;j<7;j++){const a=j*Math.PI*2/7,r=8+rnd()*22;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r*.6)}c.closePath();c.fill();}
  for(let y=0;y<h;y+=4){c.fillStyle='rgba(22,35,31,.07)';c.fillRect(0,y,w,1)}
 },256,256);
 set.shadow=canvasTexture((c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(5,20,22,.48)');g.addColorStop(.55,'rgba(5,20,22,.25)');g.addColorStop(1,'rgba(5,20,22,0)');c.fillStyle=g;c.fillRect(0,0,w,h)},128,128);
 set.smoke=canvasTexture((c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,1,w/2,h/2,w/2);g.addColorStop(0,'rgba(46,52,55,.48)');g.addColorStop(.5,'rgba(61,69,72,.23)');g.addColorStop(1,'rgba(70,78,81,0)');c.fillStyle=g;c.fillRect(0,0,w,h)},128,128);
 return set;
}

// One instanced draw per geometry/material. The same recipes can be repopulated
// every frame without creating Object3D trees or allocating new GPU buffers.
class Batch{
 constructor(scene,dynamic=false){this.scene=scene;this.dynamic=dynamic;this.items=new Map()}
 add(kind,material,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){
  const key=kind+':'+material.id;let b=this.items.get(key);
  if(!b){b={geometry:geometries[kind],material,matrices:[],count:0,mesh:null};this.items.set(key,b)}
  const i=b.count++;euler.set(rx,ry,rz,'YXZ');quat.setFromEuler(euler);pos.set(x,y,z);scale.set(sx,sy,sz);mat4.compose(pos,quat,scale);
  if(b.mesh){if(i<b.mesh.instanceMatrix.count)b.mesh.setMatrixAt(i,mat4)}else b.matrices.push(mat4.clone());
 }
 box(m,x,y,z,w,h,d,yaw=0){this.add('box',m,x,y+h/2,z,w,h,d,0,yaw)}
 round(m,x,y,z,sx,sy,sz){this.add('round',m,x,y,z,sx,sy,sz)}
 reset(){for(const b of this.items.values())b.count=0}
 finish(){
  for(const b of this.items.values()){
   if(!b.mesh){const size=this.dynamic?Math.max(1024,b.count*2):b.count;if(!size)continue;b.mesh=new T.InstancedMesh(b.geometry,b.material,size);b.mesh.frustumCulled=false;
    b.mesh.castShadow=b.material.userData.cast!==false;b.mesh.receiveShadow=true;
    if(this.dynamic)b.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    b.matrices.forEach((m,i)=>b.mesh.setMatrixAt(i,m));b.matrices=[];this.scene.add(b.mesh);
   }
   b.mesh.count=Math.min(b.count,b.mesh.instanceMatrix.count);b.mesh.instanceMatrix.needsUpdate=true;
  }
 }
 dispose(){for(const b of this.items.values())if(b.mesh){this.scene.remove(b.mesh);b.mesh.dispose?.()}this.items.clear()}
}

function configureCamera(camera,v,w,h,focal,center=.5,near=.25,far=120000){
 const cy=Math.cos(v.yaw),sy=Math.sin(v.yaw),cp=Math.cos(v.pitch),sp=Math.sin(v.pitch),cr=Math.cos(v.roll||0),sr=Math.sin(v.roll||0);
 // Native engines use +Z forward. Reflect the world on Z so Three retains
 // a proper right-handed camera, without mirrored steering or reticles.
 const r=new T.Vector3(cy,0,sy),u=new T.Vector3(-sy*sp,cp,cy*sp),back=new T.Vector3(-sy*cp,-sp,cy*cp);
 const right=r.clone().multiplyScalar(cr).addScaledVector(u,-sr),up=r.multiplyScalar(sr).addScaledVector(u,cr);
 camera.position.set(v.x,v.y,-v.z);camera.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,back));
 camera.fov=2*Math.atan(h/(2*focal))*180/Math.PI;camera.aspect=w/h;camera.near=near;camera.far=far;camera.updateProjectionMatrix();camera.projectionMatrix.elements[9]=2*(center-.5);camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();camera.updateMatrixWorld(true);
}

class World{
 constructor(game,type){
  this.game=game;this.type=type;this.quality=window.ArcadePlaySettings?.get().quality||'auto';this.low=this.quality==='low';this.frames=0;this.lost=false;this.disposed=false;
  this.canvas=document.createElement('canvas');
  this.renderer=new T.WebGLRenderer({canvas:this.canvas,alpha:true,antialias:!this.low,powerPreference:'high-performance',preserveDrawingBuffer:false});
  this.renderer.setPixelRatio(1);this.renderer.outputEncoding=T.sRGBEncoding;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;
  const gl=this.renderer.getContext?.(),debug=gl?.getExtension('WEBGL_debug_renderer_info');
  this.software=!!debug&&/swiftshader|llvmpipe|lavapipe|software/i.test(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL));
  if(this.software){this.frameCanvas=document.createElement('canvas');this.frameContext=this.frameCanvas.getContext('2d')}
  // Contact shadows work on every preset. Full dynamic shadow maps are an
  // optional high-quality pass, never a tax on the default mobile simulation.
  this.shadows=this.quality==='high'&&!this.software;this.renderScale=this.low?.72:this.software?.7:1;
  this.renderer.shadowMap.enabled=this.shadows;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true});
  this.canvas.addEventListener('webglcontextrestored',()=>{this.dispose();cache.delete(game)});
  this.scene=new T.Scene();this.scene.scale.z=-1;this.camera=new T.PerspectiveCamera();this.textures=textureSet();this.materials=[];
  this.static=new Batch(this.scene);this.dynamic=new Batch(this.scene,true);this.smokes=[];this.aircraft=new Map();this.aircraftTemplates=new Map();
  this.createMaterials();this.lighting();
  if(type==='flight')this.buildFlight();else this.buildCombat();this.static.finish();
 }
 material(color,map=null,metal=.05,rough=.88){const m=new T.MeshStandardMaterial({color,map,metalness:metal,roughness:rough});m.color.convertSRGBToLinear();this.materials.push(m);return m}
 createMaterials(){
  const tx=this.textures,m=this.m={};
  for(const key of ['asphalt','concrete','metal','roof']){tx[key].wrapS=tx[key].wrapT=T.RepeatWrapping;tx[key].repeat.set(key==='asphalt'?8:2,key==='asphalt'?32:2)}
  m.stone=this.material('#d0c6ac',tx.concrete);m.concrete=this.material('#b7b9af',tx.concrete);m.darkConcrete=this.material('#677370',tx.concrete);
  m.asphalt=this.material('#959fa4',tx.asphalt);m.line=this.material('#ded9b7');m.yellow=this.material('#d4af54');m.olive=this.material('#748062',tx.metal,.28);m.sand=this.material('#baa582',tx.concrete);
  m.steel=this.material('#52646b',tx.metal,.5,.65);m.dark=this.material('#27363b',null,.3);m.rubber=this.material('#18242a');m.glass=this.material('#3b7289',null,.5,.27);m.light=this.material('#f7d5a0');m.light.emissive.set('#c7a26d');m.light.emissiveIntensity=.45;
  m.grass=this.material('#9aa680',tx.ground);m.bark=this.material('#685344',tx.concrete);m.leaf=this.material('#4e7459');m.leafLight=this.material('#7f9263');m.roof=this.material('#b69e80',tx.roof);m.rust=this.material('#a16f50',tx.metal,.3);
  m.skin=this.material('#bfaa8a');m.fabric=this.material('#d4dcc3',tx.uniform,0,.95);m.boot=this.material('#263938');m.visor=this.material('#edbb62',null,.55,.22);
  m.facade=tx.facades.map((t,i)=>this.material(['#b1bbb4','#e1d0b4','#a4bfca','#d5d7c8'][i],t,.14,.78));
  m.blue=this.material('#52798a',tx.metal,.3);m.red=this.material('#9a6354',tx.metal,.25);m.white=this.material('#d4d3c4',null,.3);m.cars=[m.white,m.blue,m.red,m.sand];
  m.shadow=new T.MeshBasicMaterial({map:tx.shadow,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});m.shadow.userData.cast=false;this.materials.push(m.shadow);
 }
 lighting(){
  this.scene.add(new T.HemisphereLight('#c4dfeb','#776750',.8));
  this.sun=new T.DirectionalLight('#ffdcaa',1.6);this.sun.castShadow=this.shadows;this.sun.shadow.mapSize.set(1024,1024);this.sun.shadow.bias=-.0003;this.sun.shadow.normalBias=this.type==='flight'?3:.035;
  const s=this.type==='flight'?4300:95;Object.assign(this.sun.shadow.camera,{left:-s,right:s,top:s,bottom:-s,near:1,far:s*9});this.sun.shadow.camera.updateProjectionMatrix();this.scene.add(this.sun,this.sun.target);
  this.sun.position.set(-s,s*1.7,-s*.8);this.sun.target.position.set(0,0,this.type==='flight'?2500:35);
  this.fog=this.scene.fog=new T.FogExp2('#94a9b1',this.type==='flight'?.000022:.004);this.fog.color.convertSRGBToLinear();
  const sky=new T.Mesh(new T.SphereGeometry(1,24,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#315c7b')},bottom:{value:new T.Color('#d4c9ae')},sunDir:{value:new T.Vector3(-.5,.3,.8).normalize()}},vertexShader:'varying vec3 dir; void main(){dir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 dir; uniform vec3 top; uniform vec3 bottom; uniform vec3 sunDir; void main(){vec3 d=normalize(dir);float h=max(0.0,d.y);vec3 c=mix(bottom,top,pow(h,.48));float s=max(0.0,dot(d,sunDir));c+=vec3(1.0,.72,.38)*pow(s,80.0)*.3+vec3(1.0,.85,.60)*pow(s,1800.0)*2.0;float cloud=sin(d.x*31.0+d.z*19.0)+sin(d.x*67.0-d.z*29.0)*.4;float band=smoothstep(.02,.18,h)*(1.0-smoothstep(.25,.5,h));c=mix(c,vec3(.91,.88,.79),max(0.0,cloud-.35)*band*.22);gl_FragColor=vec4(c,1.0);}'}));
  sky.scale.setScalar(this.type==='flight'?110000:1200);sky.frustumCulled=false;sky.renderOrder=-100;this.sky=sky;this.scene.add(sky);
 }
 shadow(b,x,z,w,d,y=this.type==='flight'?.6:.025){b.add('plane',this.m.shadow,x,y,z,w,d,1,-Math.PI/2)}
 tree(b,x,z,size=1){
  const m=this.m;b.add('cylinder',m.bark,x,2*size,z,.65*size,4*size,.65*size);
  b.round(m.leaf,x,5*size,z,2.5*size,3*size,2.4*size);b.round(m.leafLight,x+1.3*size,4.9*size,z-.5*size,1.7*size,1.9*size,1.8*size);this.shadow(b,x,z,size*6,size*6);
 }
 lamp(b,x,z,size=1,yaw=0){
  const m=this.m;b.add('cylinder',m.steel,x,3.7*size,z,.16*size,7.4*size,.16*size);b.box(m.steel,x,.1,z,.7*size,.4*size,.7*size);b.box(m.steel,x,7.1*size,z+size*.6,.14*size,.13*size,1.3*size,yaw);b.box(m.light,x,7.05*size,z+size*1.1,.5*size,.1*size,.85*size,yaw);
 }
 building(b,x,z,w,h,d,style=0){
  const m=this.m;b.box(m.facade[style%4],x,0,z,w,h,d);b.box(m.stone,x,h,z,w*1.035,.025*h+.15,d*1.035);b.box(m.darkConcrete,x,0,z,w*1.03,Math.min(h*.12,4),d*1.03);
  this.shadow(b,x+w*.15,z+d*.15,w*1.6,d*1.7);
  if(h>w*.9){
   b.box(m.concrete,x,h+.3,z,w*.44,h*.11,d*.5);b.box(m.steel,x+w*.2,h+.5,z-d*.23,w*.16,h*.09,d*.16);
   for(let i=-1;i<=1;i++)b.box(m.dark,x+i*w*.12,h+h*.12,z-d*.12,w*.06,h*.025,d*.19);
   b.add('cylinder',m.steel,x-w*.26,h*1.12,z+d*.22,w*.012,h*.25,w*.012);
  }else{
   // A closed gabled roof, with eaves, ridge, porch and chimney.
   const roofH=Math.min(w*.28,h*.38),a=Math.atan2(roofH,w*.54),s=Math.hypot(w*.54,roofH);
   b.add('box',m.roof,x-w*.27,h+roofH/2,z,s,.25,d*1.09,0,0,a);
   b.add('box',m.roof,x+w*.27,h+roofH/2,z,s,.25,d*1.09,0,0,-a);
   b.box(m.stone,x-w*.25,h,z+d*.15,w*.1,roofH*1.45,d*.09);
  }
  b.box(m.dark,x,0,z-d*.507,w*.14,Math.min(h*.25,w*.3),.15);b.box(m.stone,x,Math.min(h*.25,w*.3),z-d*.54,w*.25,.22,d*.13);
 }
 sign(text,x,y,z,width,height,yaw=0){
  const tx=canvasTexture((c,w,h)=>{c.fillStyle='#263e47';c.fillRect(0,0,w,h);c.strokeStyle='#d5b77e';c.lineWidth=8;c.strokeRect(8,8,w-16,h-16);c.fillStyle='#f4e7c9';c.font='bold 48px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2,w-40)},512,128);
  const m=new T.MeshStandardMaterial({map:tx,roughness:.7,side:T.DoubleSide});this.materials.push(m);const mesh=new T.Mesh(geometries.plane,m);mesh.position.set(x,y,z);mesh.scale.set(-width,height,1);mesh.rotation.y=yaw;this.scene.add(mesh);
 }
 smoke(x,z,height,size){
  const m=new T.SpriteMaterial({map:this.textures.smoke,transparent:true,opacity:.48,depthWrite:false,color:'#5e6869'});this.materials.push(m);
  for(let i=0;i<6;i++){const s=new T.Sprite(m);s.position.set(x+Math.sin(i*2)*size*.2,height+i*size*.8,z);s.scale.set(size*(1+i*.25),size*(1+i*.3),1);this.scene.add(s);this.smokes.push({sprite:s,x,z,y:s.position.y,size,phase:i*.8})}
 }
 buildCombat(){
  const b=this.static,m=this.m,mission=this.game.mission?.id||'patrol';this.mission=mission;
  b.box(m.grass,0,-.3,35,360,.25,400);b.box(m.asphalt,0,-.08,32,62,.08,125);
  for(const side of [-1,1]){
   b.box(m.stone,side*32,-.02,35,2.8,.16,130);b.box(m.darkConcrete,side*34,-.02,35,.25,.4,130);
   for(let z=-15;z<102;z+=13){this.lamp(b,side*31.2,z,1.15);b.box(m.line,side*19,.012,z,1.2,.014,3.6)}
   for(let z=-20,i=0;z<120;z+=20,i++){
    const x=side*(42+(i%2)*3),h=mission==='city'?14+(i%3)*7:mission==='extraction'?10+(i%3)*3:7+(i%3)*2;
    this.building(b,x,z,14,h,16,(i+(side===1?1:0))%4);
    if(mission==='patrol'){
     b.box(m.metal||m.steel,x,0,z+4,13,4,15);b.box(m.dark,x,0,z-8.15,7,4,.2);
     for(let j=-3;j<=3;j++)b.box(m.steel,x+j,.1,z-8.3,.15,3.8,.18);
    }
    if(i%2===0)this.tree(b,side*34.6,z+9,.8);
   }
  }
  for(let z=-10;z<98;z+=8)b.box(m.yellow,0,.012,z,.15,.015,3.8);
  // The play space stays clear; dressing is outside the original x/z bounds.
  for(const side of [-1,1])for(let i=0;i<7;i++){
   const x=side*(37+(i%2)*2),z=10+i*13;
   if(mission==='patrol'){b.box(i%2?m.blue:m.rust,x,0,z,4.3,3.1,9.2);b.box(m.steel,x,3.1,z,4.4,.16,9.3);for(let j=-2;j<=2;j++)b.box(m.dark,x+j*.7,.3,z-4.63,.04,2.6,.08)}
   else if(mission==='extraction'){b.box(m.sand,x,0,z,4,2.3,7);for(let j=0;j<4;j++)b.round(m.sand,x+side*.1,2.35+j*.04,z-2.5+j*1.5,2,.33,.65)}
   else{b.box(m.darkConcrete,x,0,z,4,.6,5);this.tree(b,x,z,1.1)}
  }
  for(let i=0;i<6;i++){const x=-49+i*19;this.building(b,x,130,15,17+i%3*8,22,i%4)}
  // Port cranes, fortress towers and a distant elevated roadway provide actual
  // silhouettes; they are geometry with perspective, never a flat backdrop.
  for(const side of [-1,1]){
   const x=side*57;b.box(m.steel,x,0,90,1.3,32,1.3);b.box(m.steel,x,30,90,22,.8,1);b.box(m.yellow,x,25,90,4,4,4);b.add('cylinder',m.dark,x-side*8,23,90,.08,16,.08);
   b.box(m.darkConcrete,x,8,-26,4,13,4);b.box(m.stone,x,20,-26,7,2,7);
  }
  b.box(m.concrete,0,16,156,170,2,12);for(let x=-70;x<80;x+=28)b.box(m.darkConcrete,x,0,156,3,16,5);
  this.sign(mission==='patrol'?'PORTO • SETOR 07':mission==='city'?'DISTRITO CENTRAL':'FORTALEZA LESTE',0,8.2,103,23,4,Math.PI);
  this.smoke(-68,87,12,11);this.smoke(54,136,16,13);
  this.buildWeapon();
 }
 buildWeapon(){
  this.weaponScene=new T.Scene();this.weaponScene.add(new T.HemisphereLight('#d4e6e7','#49443b',1.1));const key=new T.DirectionalLight('#ffd4a0',1.2);key.position.set(-2,4,3);this.weaponScene.add(key);
  this.weaponCamera=new T.PerspectiveCamera(45,1,.01,20);this.weapon=new T.Group();this.weaponScene.add(this.weapon);this.weaponCamera.add(this.weapon);this.weaponScene.add(this.weaponCamera);
  const b=new Batch(this.weapon),m=this.m;
  b.box(m.dark,.0,-.02,-.52,.15,.16,.61);b.box(m.steel,0,.05,-.72,.13,.1,.4);b.box(m.fabric,0,-.06,-.21,.13,.19,.35);b.box(m.rubber,.02,-.18,-.45,.11,.27,.14);
  b.add('cylinder',m.dark,0,.02,-1.04,.048,.49,.048,Math.PI/2);b.add('cylinder',m.steel,0,.02,-1.28,.062,.06,.062,Math.PI/2);
  b.box(m.dark,0,.15,-.66,.045,.1,.08);b.box(m.steel,0,.15,-.65,.105,.05,.13);b.box(m.glass,0,.166,-.72,.067,.042,.012);
  b.box(m.dark,0,-.22,-.64,.1,.22,.17);for(let i=0;i<8;i++)b.box(m.steel,.076,.01,-.87+i*.045,.007,.07,.012);
  b.round(m.fabric,-.095,-.2,-.87,.09,.1,.16);b.round(m.fabric,.08,-.25,-.38,.1,.13,.12);b.finish();this.weaponBatch=b;
  this.weapon.position.set(.23,-.25,-.18);this.weapon.rotation.set(.06,-.1,-.07);
  this.flash=new T.Mesh(new T.SphereGeometry(1,8,5),new T.MeshBasicMaterial({color:'#ffdb82',transparent:true,opacity:.9}));this.flash.position.set(0,.02,-1.34);this.flash.scale.set(.07,.07,.14);this.weapon.add(this.flash);this.materials.push(this.flash.material);
  if(window.OTCombatArt){this.weaponBatch.dispose();this.weapon.remove(this.flash);this.flash.material.dispose();const rifle=OTCombatArt.rifle(true);rifle.rotation.y=Math.PI;this.weapon.add(rifle);this.flash=rifle.userData.flash;this.combatWeaponV2=true;}
 }
 terrainHeight(x,z){
  let flatten=1;for(const c of this.game.battleCities||[])flatten=Math.min(flatten,smooth(2700,6200,Math.hypot(x-c.x,z-c.z)));
  // The original flight floor stays authoritative: valleys are below it.
  const valley=Math.pow((Math.sin(x*.00014)+Math.cos(z*.00012)+2)/4,2);
  return -flatten*(40+valley*520);
 }
 buildTerrain(){
  const geometry=new T.PlaneGeometry(180000,180000,128,128);geometry.rotateX(-Math.PI/2);const p=geometry.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=this.terrainHeight(x,z);p.setY(i,y);const n=(Math.sin(x*.00031)+Math.cos(z*.00042)+Math.sin((x+z)*.00012))/3;const c=new T.Color().setHSL(.23+n*.035,.17,.27+n*.06);colors.push(c.r,c.g,c.b)}
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const m=new T.MeshStandardMaterial({vertexColors:true,roughness:1,map:this.textures.ground});this.materials.push(m);this.textures.ground.wrapS=this.textures.ground.wrapT=T.RepeatWrapping;this.textures.ground.repeat.set(110,110);
  this.terrain=new T.Mesh(geometry,m);this.terrain.receiveShadow=true;this.scene.add(this.terrain);
  // A coastline with irregular banks and a continuous flowing river.
  const verts=[],uv=[];for(let i=0;i<=100;i++){
   const z=-65000+i*1400,x=-6500+Math.sin(z*.000082)*1300+Math.cos(z*.00019)*300,width=800+Math.sin(z*.00011)*180;
   verts.push(x-width,-25,z,x+width,-25,z);uv.push(0,i/10,1,i/10);
  }
  const indices=[];for(let i=0;i<100;i++){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3)}
  const river=new T.BufferGeometry();river.setAttribute('position',new T.Float32BufferAttribute(verts,3));river.setAttribute('uv',new T.Float32BufferAttribute(uv,2));river.setIndex(indices);river.computeVertexNormals();
  const water=new T.ShaderMaterial({side:T.DoubleSide,uniforms:{time:{value:0},fogColor:{value:new T.Color('#94a9b1')}},vertexShader:'varying vec2 vUv; varying float depth; void main(){vUv=uv;vec4 p=modelViewMatrix*vec4(position,1.0);depth=-p.z;gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec2 vUv;varying float depth;uniform float time;uniform vec3 fogColor;void main(){float wave=sin(vUv.y*180.0+time)*sin(vUv.x*70.0+time*.5);vec3 c=mix(vec3(.12,.25,.29),vec3(.29,.45,.48),wave*.18+.5);c+=vec3(.2,.20,.14)*pow(max(0.0,sin(vUv.y*80.0+time*.4)),18.0)*.18;float fog=1.0-exp(-depth*depth*.000000000484);gl_FragColor=vec4(mix(c,fogColor,min(.96,fog)),1.0);}'});this.materials.push(water);this.water=water;this.scene.add(new T.Mesh(river,water));
 }
 buildFlight(){
  this.buildTerrain();const b=this.static,m=this.m,rnd=random(71256);
  for(const [index,c]of (this.game.battleCities||[]).entries()){
   b.box(m.concrete,c.x,-1,c.z,3880,1,3880);
   for(let n=-5;n<=5;n++){
    const k=n*360;
    b.box(m.stone,c.x+k,-.3,c.z,70,.3,3780);b.box(m.asphalt,c.x+k,.05,c.z,48,.12,3780);
    b.box(m.stone,c.x,-.3,c.z+k,3780,.3,70);b.box(m.asphalt,c.x,.05,c.z+k,3780,.12,48);
    for(let zz=-1700;zz<1800;zz+=80){b.box(m.line,c.x+k,.19,c.z+zz,1,.02,35);b.box(m.line,c.x+zz,.19,c.z+k,35,.02,1)}
    for(let j=-4;j<=4;j++){
     const xx=c.x+k,zz=c.z+j*360;
     for(let stripe=0;stripe<6;stripe++){b.box(m.line,xx-19+stripe*7,.21,zz+36,4,.02,12);b.box(m.line,xx+36,.21,zz-19+stripe*7,12,.02,4)}
     if(n%2===0){this.lamp(b,xx+30,zz+48,4.5);this.tree(b,xx+43,zz+100,6)}
    }
   }
   for(const [i,h]of c.buildings.entries()){
    // Original, simulation-owned footprints; varied roofs and articulated
    // towers add detail without moving roads, traffic or mission targets.
    this.building(b,h.x,h.z,h.w,h.h,h.d,(i+index)%4);
    if(!h.house&&i%3===0){b.box(m.facade[(i+1)%4],h.x+h.w*.2,h.h,h.z,h.w*.62,h.h*.22,h.d*.65);b.box(m.stone,h.x+h.w*.2,h.h*1.22,h.z,h.w*.66,3,h.d*.69)}
    // A second smaller frontage, landscaped yard and parked cars fill the lots.
    if(i%2===0){this.building(b,h.x+150,h.z+35,58,30+i%3*12,72,(i+2)%4);this.tree(b,h.x+128,h.z-54,5.5);this.tree(b,h.x+170,h.z-75,4.5)}
    this.shadow(b,h.x,h.z,h.w*1.4,h.d*1.5);
   }
   // Civic plaza with fountain, trees, benches and a helipad.
   b.box(m.stone,c.x,-.1,c.z,240,.5,240);b.add('cylinder',m.stone,c.x,4,c.z,90,8,90);b.add('cylinder',m.glass,c.x,8.2,c.z,76,1,76);b.add('cylinder',m.concrete,c.x,18,c.z,8,22,8);
   for(let i=0;i<8;i++){const a=i*Math.PI/4,x=c.x+Math.cos(a)*105,z=c.z+Math.sin(a)*105;this.tree(b,x,z,5);b.box(m.bark,x,0,z+20,22,4,6,a)}
   this.sign(c.name,c.x,55,c.z+150,180,35,Math.PI);
   this.smoke(c.x+1300,c.z+1000,100,125);if(index%2===0)this.smoke(c.x-1350,c.z+1200,120,90);
  }
  // Highways and bridges connect the populated districts.
  const cities=this.game.battleCities||[];
  for(let i=1;i<cities.length;i++){
   const a=cities[0],c=cities[i],dx=c.x-a.x,dz=c.z-a.z,len=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz),x=(a.x+c.x)/2,z=(a.z+c.z)/2;
   b.box(m.concrete,x,-.2,z,92,5,len,yaw);b.box(m.asphalt,x,5,z,78,.4,len,yaw);
   for(let n=0;n<len;n+=320){const px=a.x+dx*n/len,pz=a.z+dz*n/len;b.box(m.line,px,5.5,pz,2,.2,100,yaw)}
  }
  // Airport outside the urban grid, with hangars and a control tower.
  const ax=3100,az=-500;b.box(m.concrete,ax,-.1,az,1800,.3,3200);b.box(m.asphalt,ax,.4,az,130,.4,2900);
  for(let z=az-1300;z<az+1300;z+=160)b.box(m.line,ax,.9,z,4,.1,75);
  for(const side of [-1,1])for(let z=az-1350;z<az+1400;z+=100)b.box(m.light,ax+side*67,1,z,3,2,3);
  for(let i=0;i<6;i++){b.box(m.steel,ax+350,0,az-1000+i*350,300,80,250);b.box(m.dark,ax+198,0,az-1000+i*350,2,65,200)}
  b.box(m.concrete,ax-350,0,az+800,35,190,35);b.box(m.glass,ax-350,190,az+800,80,35,80);b.box(m.stone,ax-350,225,az+800,90,8,90);
  // Flight school runway matches the native takeoff/landing coordinates.
  b.box(m.asphalt,0,.1,-500,120,.2,4200);for(let z=-2400;z<1500;z+=160)b.box(m.line,0,.4,z,4,.1,70);
  // Wooded valleys, agricultural fields and smaller villages replace the old
  // repeating checkerboard and enormous triangular trees.
  for(let cluster=0;cluster<(this.low?24:55);cluster++){
   const cx=(rnd()-.5)*62000,cz=(rnd()-.5)*62000;
   for(let i=0;i<(this.low?16:32);i++){
    const a=rnd()*Math.PI*2,r=Math.sqrt(rnd())*480,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;
    if(cities.some(c=>Math.hypot(x-c.x,z-c.z)<2900)||Math.abs(x)<150&&z>-2700&&z<1900||Math.abs(x-3100)<1000&&Math.abs(z+500)<1800)continue;
    const y=this.terrainHeight(x,z);if(y<-220)continue;const size=8+rnd()*11;
    b.add('cylinder',m.bark,x,y+2*size,z,.6*size,4*size,.6*size);b.round(m.leaf,x,y+5*size,z,2.5*size,3*size,2.4*size);b.round(m.leafLight,x+size,y+5*size,z,1.8*size,2*size,1.7*size);
   }
  }
  // Harbor district: raised quays, container stacks and gantry cranes follow
  // the river bend, with support columns descending to the terrain.
  b.box(m.concrete,-4660,-30,6500,1300,34,2000);b.box(m.asphalt,-4600,4.1,6500,1120,.3,1830);
  for(let i=0;i<7;i++){
   const z=5700+i*240;b.box(m.steel,-5220,4,z,24,290,24);b.box(m.steel,-4750,4,z,24,290,24);b.box(m.yellow,-5040,285,z,750,25,22);b.box(m.dark,-5410,140,z,6,145,6);b.box(m.yellow,-5410,127,z,60,20,60);
   for(let j=0;j<4;j++)for(let k=0;k<2;k++)b.box([m.blue,m.rust,m.olive][(i+j+k)%3],-4450+j*105,4+k*48,z,95,47,190);
  }
  // Distinct civic and military landmarks, rather than four identical grids.
  const civic=cities[1];if(civic){
   const x=civic.x+2550,z=civic.z+300;
   b.add('cylinder',m.concrete,x,14,z,930,28,1250);b.add('ring',m.stone,x,45,z,410,560,80,Math.PI/2);b.add('ring',m.steel,x,83,z,440,590,35,Math.PI/2);
   b.box(m.grass,x,29,z,420,1,650);b.box(m.line,x,31,z,2,1,650);b.box(m.line,x,31,z-325,420,1,2);b.box(m.line,x,31,z+325,420,1,2);
   for(const side of [-1,1]){this.lamp(b,x+side*440,z-480,22);this.lamp(b,x+side*440,z+480,22)}
  }
  const military=cities[3];if(military){
   const x=military.x+2500,z=military.z;b.box(m.asphalt,x,0,z,950,.5,1800);
   for(let i=0;i<5;i++){this.building(b,x+290,z-650+i*300,220,65,180,0);this.tank(b,x-200,z-650+i*300,0,8)}
   b.add('cylinder',m.darkConcrete,x-150,1,z+600,280,1,280);b.box(m.line,x-190,2,z+600,8,1,120);b.box(m.line,x-110,2,z+600,8,1,120);b.box(m.line,x-150,2,z+600,80,1,8);
  }
  for(let i=0;i<26;i++){
   const x=(rnd()-.5)*42000,z=(rnd()-.5)*42000;if(cities.some(c=>Math.hypot(x-c.x,z-c.z)<3400))continue;
   // Terraced fields are sunk below the flight floor with alternating crops.
   const y=this.terrainHeight(x,z);for(let j=0;j<5;j++)b.box(j%2?m.grass:m.sand,x+j*190,y-1,z,175,1,900,.22);
  }
 }
 cover(b,c){
  const m=this.m;b.box(m.darkConcrete,c.x,0,c.z,c.w,c.h,c.d);b.box(m.stone,c.x,c.h-.16,c.z,c.w+.09,.16,c.d+.08);
  for(let x=-c.w/2+.35;x<c.w/2;x+=.7){b.box(m.yellow,c.x+x,.18,c.z-c.d/2-.011,.28,.22,.02);b.box(m.steel,c.x+x,c.h-.34,c.z-c.d/2-.02,.04,.16,.05)}
  this.shadow(b,c.x,c.z,c.w*1.6,c.d*2);
 }
 soldier(b,e,time){
  if(window.OTCombatArt){this.infantryModels=this.infantryModels||new Map();let model=this.infantryModels.get(e.id);if(!model){model=OTCombatArt.infantry(this.infantryModels.size);this.infantryModels.set(e.id,model);this.scene.add(model);}model.visible=true;model.position.set(e.x,0,-e.z);model.rotation.y=Math.atan2(this.game.player.x-e.x,e.z-this.game.player.z);OTCombatArt.animate(model,{time:time+(e.phase||0),speed:e.moving?2.2:0,crouched:e.tactic==='cover',firing:!!e.shot,hit:e.flash});return;}
  const m=this.m,p=this.game.player,x=e.x,z=e.z,yaw=Math.atan2(x-p.x,z-p.z),cy=Math.cos(yaw),sy=Math.sin(yaw),phase=e.stride??(time*4+(e.phase||0)),breath=Math.sin(time*2.3+(e.phase||0))*.012,duck=e.aim<.65?.06:0,f=e.flash?m.light:m.fabric;
  // Local articulated parts are rotated as one body: armour, face and weapon
  // always face the player, while knees/ankles keep the gait grounded.
  const part=(kind,ma,lx,y,lz,w,h,d,rx=0,rz=0)=>b.add(kind,ma,x+lx*cy+lz*sy,y,z-lx*sy+lz*cy,w,h,d,rx,yaw,rz);
  const box=(ma,lx,y,lz,w,h,d)=>part('box',ma,lx,y,lz,w,h,d),round=(ma,lx,y,lz,w,h,d)=>part('round',ma,lx,y,lz,w,h,d);
  const limb=(ma,a,c,width,depth=width)=>{const dx=c[0]-a[0],dy=c[1]-a[1],dz=c[2]-a[2],length=Math.hypot(dx,dy,dz);part('cylinder',ma,(a[0]+c[0])/2,(a[1]+c[1])/2,(a[2]+c[2])/2,width,length,depth,Math.atan2(dz,dy),-Math.asin(dx/length));};
  for(const side of [-1,1]){
   const step=(e.moving===false?.12:1)*Math.sin(phase+side*Math.PI/2),lx=side*.18,knee=[lx,.54,step*.105],ankle=[lx,.19,-step*.12];
   limb(f,[lx,.97-duck,0],knee,.27,.30);limb(f,knee,ankle,.23,.25);round(m.boot,lx,.55,knee[2]-.12,.13,.15,.075);
   box(m.boot,lx,.13+Math.max(0,step)*.025,ankle[2]-.065,.26,.20,.43);box(m.rubber,lx,.045,ankle[2]-.07,.27,.06,.44);
   box(m.sand,lx+.07*side,.78,.03,.12,.19,.22);
  }
  const y=breath-duck;
  round(f,0,1.30+y,0,.34,.39,.23);box(m.dark,0,1.04+y,0,.61,.11,.41);round(m.olive,0,1.34+y,-.17,.32,.29,.14);box(m.olive,0,1.35+y,-.27,.55,.43,.09);
  for(const side of [-1,1]){box(m.sand,side*.22,1.48+y,-.25,.08,.39,.055);box(m.sand,side*.16,1.17+y,-.35,.15,.20,.09);box(m.boot,side*.24,1.03+y,-.2,.12,.13,.11);}
  box(m.fabric,0,1.35+y,.27,.48,.47,.24);box(m.olive,0,1.38+y,.4,.41,.34,.07);box(m.dark,-.23,1.58+y,.19,.09,.2,.08);part('cylinder',m.steel,-.23,1.82+y,.19,.015,.34,.015);
  round(m.boot,0,1.68+y,0,.16,.12,.16);round(m.skin,0,1.89+y,-.005,.205,.245,.195);round(m.fabric,0,1.78+y,-.11,.205,.13,.14);
  round(m.olive,0,2.055+y,.015,.25,.155,.245);box(m.dark,0,2.02+y,-.20,.41,.07,.12);box(m.dark,0,1.94+y,-.19,.37,.12,.065);box(m.visor,0,1.95+y,-.23,.31,.075,.035);
  for(const side of [-1,1]){round(m.boot,side*.225,1.94+y,.015,.065,.11,.085);box(m.sand,side*.15,2.11+y,0,.05,.04,.25);}
  part('cylinder',m.dark,.20,1.80+y,-.22,.025,.22,.025,-.45);round(m.dark,.20,1.71+y,-.27,.045,.04,.04);
  for(const side of [-1,1]){
   const shoulder=[side*.38,1.51+y,0],elbow=[side*.41,1.22+y,-.16],hand=[side<0?.05:.24,1.30+y,side<0?-.68:-.43];
   round(f,...shoulder,.15,.18,.17);limb(f,shoulder,elbow,.22,.25);round(m.boot,...elbow,.12,.12,.12);limb(f,elbow,hand,.19,.21);round(m.boot,...hand,.10,.09,.13);
  }
  const kick=e.shot?.05:0;
  box(m.dark,.18,1.33+y,-.43+kick,.12,.13,.54);box(m.steel,.18,1.39+y,-.45+kick,.08,.025,.44);box(m.boot,.18,1.25+y,-.39+kick,.085,.19,.09);box(m.dark,.18,1.33+y,-.09+kick,.14,.16,.23);
  part('cylinder',m.steel,.18,1.35+y,-.88+kick,.05,.41,.05,Math.PI/2);box(m.dark,.18,1.43+y,-.47+kick,.07,.07,.13);box(m.visor,.18,1.45+y,-.54+kick,.035,.025,.02);
  if(e.shot)round(m.light,.18,1.35+y,-1.13,.15,.13,.20);
  this.shadow(b,x,z,1.5,1.7);
 }
 drone(b,e,time){
  const m=this.m;b.round(e.flash?m.light:m.steel,e.x,e.y,e.z,.65,.28,.4);b.box(m.visor,e.x,e.y-.12,e.z-.4,.25,.15,.08);
  for(const x of [-1,1])for(const z of [-1,1]){b.box(m.dark,e.x+x*.6,e.y,e.z+z*.4,1,.08,.09,x*z*.4);b.add('cylinder',m.dark,e.x+x,e.y+.07,e.z+z*.64,.12,.16,.12);b.add('box',m.steel,e.x+x,e.y+.16,e.z+z*.64,1.1,.025,.11,0,time*31*x*z)}
 }
 tank(b,x,z,yaw=0,s=1,flash=false){
  const m=this.m,part=(material,lx,y,lz,w,h,d)=>b.box(material,x+(lx*Math.cos(yaw)+lz*Math.sin(yaw))*s,y*s,z+(-lx*Math.sin(yaw)+lz*Math.cos(yaw))*s,w*s,h*s,d*s,yaw);
  part(m.dark,0,.2,0,4.7,.65,5.3);part(m.olive,0,.65,0,4.2,1.05,4.5);part(m.olive,0,1.7,0,2.7,.7,2.7);part(m.steel,0,2,-2.3,.22,.22,3.7);
  for(const side of [-1,1]){part(m.rubber,side*2,.22,0,.65,.75,5.5);for(let i=0;i<6;i++){const lz=-2.1+i*.85;b.add('cylinder',m.steel,x+(side*2.25*Math.cos(yaw)+lz*Math.sin(yaw))*s,.56*s,z+(-side*2.25*Math.sin(yaw)+lz*Math.cos(yaw))*s,.65*s,.18*s,.65*s,0,0,Math.PI/2)}}
  part(m.sand,-.7,2.35,.2,.7,.16,.7);part(m.dark,.8,1.75,1,.5,.8,.8);
  if(flash)part(m.light,0,1.94,-4.3,.65,.6,.8);this.shadow(b,x,z,7*s,8*s);
 }
 car(b,x,z,yaw,s,material){
  const m=this.m,part=(ma,lx,y,lz,w,h,d)=>b.box(ma,x+(lx*Math.cos(yaw)+lz*Math.sin(yaw))*s,y*s,z+(-lx*Math.sin(yaw)+lz*Math.cos(yaw))*s,w*s,h*s,d*s,yaw);
  part(material,0,.25,0,1.8,.62,4.2);part(m.glass,0,.87,-.15,1.5,.64,2.15);part(material,0,1.5,-.15,1.55,.06,1.9);
  for(const side of [-1,1]){part(m.rubber,side*.9,.12,-1.3,.23,.56,.66);part(m.rubber,side*.9,.12,1.3,.23,.56,.66);part(m.light,side*.6,.56,2.12,.4,.18,.05)}
 }
 updateActors(){
  const g=this.game,b=this.dynamic,time=g.worldTime||g.elapsed||0,m=this.m;b.reset();
  if(this.type==='combat'){
   for(const c of g.covers||[])this.cover(b,c);
   for(const model of this.infantryModels?.values()||[])model.visible=false;
   for(const e of g.enemies||[])if(e.active){if(e.kind==='soldier')this.soldier(b,e,time);else if(e.kind==='drone')this.drone(b,e,time);else this.tank(b,e.x,e.z,0,1,e.shot)}
   this.flash.visible=g.muzzle>0;this.weapon.position.y=-.25+(g.muzzle>0?.012:0)-(g.reloadTime>0?.13:0);this.weapon.rotation.z=(g.aiming?0:-.07)+(g.reloadTime>0?-.25:0);this.weapon.rotation.y=(g.aiming?0:-.1)+(g.handAim&&!g.handSession?(g.handAim.x-.5)*-.65:0);this.weapon.rotation.x=(g.aiming?0:.06)-(g.handAim&&!g.handSession?(g.handAim.y-.48)*.45:0);
  }else{
   for(const [i,car]of (g.groundTraffic||[]).entries()){const p=g._groundPath(car);this.car(b,p.x,p.z,p.yaw+(car.crashed?.18:0),5,car.crashed?m.dark:m.cars[i%4])}
   for(const tank of g.groundTanks||[]){const p=g._groundPath(tank);if(tank.active!==false)this.tank(b,p.x,p.z,p.yaw+Math.PI,8,tank.flash);else{b.box(m.dark,p.x,3,p.z,35,8,46,p.yaw);b.box(m.steel,p.x,11,p.z,20,5,24,p.yaw+.4);b.box(m.rubber,p.x-16,1,p.z,7,8,48,p.yaw)}}
   for(const fx of g.groundExplosions||[]){
    const burst=Math.max(0,1-fx.age/.65),fade=Math.min(1,fx.life/4),size=30+fx.age*6;
    if(burst)b.round(m.light,fx.x,20+fx.age*25,fx.z,80*burst,65*burst,80*burst);
    for(let i=0;i<5;i++){const rise=fx.age*20+i*size*.7;b.round(m.dark,fx.x+Math.sin(i*2+fx.age*.2)*size*.35,20+rise,fx.z,size*fade,(size*1.3)*fade,size*fade);}
    for(let i=0;i<6&&fx.age<2;i++){const a=i*Math.PI/3,d=fx.age*65;b.box(m.steel,fx.x+Math.cos(a)*d,15+Math.max(0,fx.age*70-fx.age*fx.age*40),fx.z+Math.sin(a)*d,5,5,10,a+fx.age*3);}
   }
   if(!this.low)for(const [i,person]of (g.groundPeople||[]).entries()){
    const p=g._groundPath(person,true),step=Math.sin(time*4+i)*1.3;b.round(m.skin,p.x,7,p.z,1.1,1.2,1.1);b.round(i%2?m.blue:m.rust,p.x,4.6,p.z,1.5,2,1.1);b.box(m.dark,p.x-1,0,p.z+step,.9,3,1);b.box(m.dark,p.x+1,0,p.z-step,.9,3,1);
   }
   this.updateAircraft();if(this.water)this.water.uniforms.time.value=time;
  }
  b.finish();for(const s of this.smokes){s.sprite.position.x=s.x+Math.sin(time*.1+s.phase)*s.size*.4;s.sprite.position.y=s.y+Math.sin(time*.15+s.phase)*s.size*.15}
 }
 aircraftTemplate(model,enemy){
  const key=model+':'+enemy;if(this.aircraftTemplates.has(key))return this.aircraftTemplates.get(key);
  const root=new T.Group(),parts=new Map();
  for(const f of this.game._airframeMesh(model)){
   const kind=f.rotor?'mainRotor':f.tailRotor?'tailRotor':f.color[0]<80&&f.color[2]>f.color[0]*1.5?'glass':'hull';
   let part=parts.get(kind);if(!part){part={positions:[],colors:[]};parts.set(kind,part)}
   const color=new T.Color(...f.color.map((v,i)=>v/255*(enemy?[1,.72,.58][i]:1))).convertSRGBToLinear();
   for(let i=1;i<f.vertices.length-1;i++)for(const v of [f.vertices[0],f.vertices[i],f.vertices[i+1]]){
    part.positions.push(v[0],v[1]-(kind==='tailRotor'?6:0),v[2]+(kind==='tailRotor'?49:0));part.colors.push(color.r,color.g,color.b);
   }
  }
  for(const [kind,p]of parts){
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p.positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(p.colors,3));geometry.computeVertexNormals();
   const material=new T.MeshStandardMaterial({vertexColors:true,metalness:kind==='glass'?.65:.48,roughness:kind==='glass'?.2:.52,side:T.DoubleSide});this.materials.push(material);
   const mesh=new T.Mesh(geometry,material);mesh.name=kind;mesh.castShadow=true;mesh.receiveShadow=true;if(kind==='tailRotor')mesh.position.set(0,6,-49);root.add(mesh);
  }
  this.aircraftTemplates.set(key,root);return root;
 }
 updateAircraft(){
  const g=this.game,live=new Set(),bodies=[];
  if(window.ArcadePlaySettings?.get().camera!=='cockpit')bodies.push([g.ship,g.airframe,false]);
  for(const e of g.entities||[])if(e.active!==false&&e.hp>0)bodies.push([e,e.airframe||(e.isBoss?'sentinel':'falcon'),true]);
  if(g.mode==='PVP'||g.mode==='COOP')for(const [id,p]of Object.entries(g.net?.players||{}))if(id!==g.net.uid&&p.hp>0)bodies.push([p,p.airframe||'falcon',g.mode!=='COOP']);
  for(const [body,model,enemy]of bodies){
   live.add(body);let actor=this.aircraft.get(body);const key=model+':'+enemy;
   if(actor&&actor.key!==key){this.scene.remove(actor.root);this.aircraft.delete(body);actor=null}
   if(!actor){const root=this.aircraftTemplate(model,enemy).clone(true);actor={root,key};this.aircraft.set(body,actor);this.scene.add(root)}
   const root=actor.root;root.position.set(body.x,body.y,body.z);root.rotation.set(-(body.pitch||0),body.yaw||0,-(body.roll||0),'YXZ');
   root.scale.set(...(model==='interceptor'?[.87,1,1.12]:model==='sentinel'?[1.12,1.07,1]:model==='guardian'?[1.2,1.12,1.08]:[1,1,1]));
   const rotor=root.getObjectByName('mainRotor'),tail=root.getObjectByName('tailRotor');if(rotor)rotor.rotation.y=-g.worldTime*35;if(tail)tail.rotation.x=g.worldTime*65;
  }
  for(const [body,actor]of this.aircraft)if(!live.has(body)){this.scene.remove(actor.root);this.aircraft.delete(body)}
 }
 render(ctx,w,h,cameraBackground=false){
  if(this.lost||this.disposed||w<=0||h<=0)return false;
  const g=this.game,flight=this.type==='flight',q=window.ArcadePlaySettings?.get().quality;
  // A stale hand freezes simulation. Reuse that same battlefield image while
  // the worker catches up instead of spending its CPU budget redrawing it.
  if(g.handSession&&!g.handAim?.fresh&&this.frames){ctx.drawImage(this.frameCanvas||this.canvas,0,0,w,h);return true}
  const v=flight?(g.view||g.ship):{x:g.player.x,y:g.eyeY||1.8,z:g.player.z,yaw:g.player.yaw,pitch:g.player.pitch,roll:0};
  const focal=flight?800:(g.focalLength?.(w,h)||Math.min(w,h)*.88);
  const lv=this.lastView,jump=this.lastFocal!==focal||!lv||Math.hypot(v.x-lv.x,v.y-lv.y,v.z-lv.z)>(flight?75:1)||Math.abs(v.yaw-lv.yaw)>.12||Math.abs(v.pitch-lv.pitch)>.12;
  if(this.frames&&!jump&&clock()<this.nextRenderAt&&this.lastWidth===w&&this.lastHeight===h&&this.lastCamera===cameraBackground){ctx.drawImage(this.frameCanvas||this.canvas,0,0,w,h);return true}
  // Internal pixels are capped on phones, independently of the HUD canvas.
  const slowHands=!!g.handSession&&(this.software||g.handSession.lastComputeMs>180);
  const begin=clock(),cap=slowHands?(this.software?80000:200000):q==='high'?1400000:800000;
  const factor=Math.min(this.renderScale,Math.sqrt(cap/(w*h))),rw=Math.max(1,Math.round(w*factor)),rh=Math.max(1,Math.round(h*factor));
  if(this.canvas.width!==rw||this.canvas.height!==rh)this.renderer.setSize(rw,rh,false);
  configureCamera(this.camera,v,w,h,focal,flight?.5:.48,flight?10:.15,flight?120000:1800);
  this.sky.position.set(v.x,v.y,v.z);this.sky.visible=!cameraBackground;
  // Only rendered environment is hidden for the optional camera backdrop.
  for(const batch of this.static.items.values())if(batch.mesh)batch.mesh.visible=!cameraBackground;
  for(const s of this.smokes)s.sprite.visible=!cameraBackground;
  this.scene.fog=cameraBackground?null:this.fog;
  // Signs are scenery too (all non-light, non-actor meshes outside the batches).
  for(const o of this.scene.children)if(o.isMesh&&o!==this.sky&&!o.isInstancedMesh&&o!==this.terrain)o.visible=!cameraBackground;
  this.renderer.setClearColor('#8fa8b3',cameraBackground?0:1);this.updateActors();
  this.renderer.render(this.scene,this.camera);
  if(!flight){const edge=Math.min(w,h);this.weapon.position.x=g.aiming?0:.124*w/edge;this.weapon.position.z=this.combatWeaponV2?(g.aiming?-.49:-.55):(g.aiming?-.6:-.18);if(g.aiming)this.weapon.position.y=-.166+.022*h/edge+(g.muzzle>0?.012:0)-(g.reloadTime>0?.13:0);else this.weapon.position.y-=.193*(h/edge-1);this.weaponCamera.fov=2*Math.atan(h/(2*edge*1.2))*180/Math.PI;this.weaponCamera.aspect=w/h;this.weaponCamera.updateProjectionMatrix();this.renderer.autoClear=false;this.renderer.clearDepth();this.renderer.render(this.weaponScene,this.weaponCamera);this.renderer.autoClear=true}
  if(this.frameCanvas){
   if(this.frameCanvas.width!==rw||this.frameCanvas.height!==rh){this.frameCanvas.width=rw;this.frameCanvas.height=rh}
   this.frameContext.clearRect(0,0,rw,rh);this.frameContext.drawImage(this.canvas,0,0);
  }
  ctx.drawImage(this.frameCanvas||this.canvas,0,0,w,h);this.frames++;
  const duration=clock()-begin;this.lastWidth=w;this.lastHeight=h;this.lastCamera=cameraBackground;this.lastView={...v};this.lastFocal=focal;
  // Software GPUs share CPU time with input and physics. Leave several native
  // animation ticks between draws instead of stalling reloads and flight motion.
  this.nextRenderAt=clock()+(slowHands?85:this.software||g.handSession?33:0);
  if(q==='auto'&&this.frames%12===0&&duration>38)this.renderScale=Math.max(.55,this.renderScale-.08);
  g.worldVisual={renderer:'webgl',frames:this.frames,mission:this.mission||'flight',drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,width:rw,height:rh,low:this.low,software:this.software,frameMs:Math.round(duration),shadows:this.shadows};
  return true;
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;for(const model of this.infantryModels?.values()||[]){model.parent?.remove(model);model.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}this.infantryModels?.clear();this.static.dispose();this.dynamic.dispose();this.weaponBatch?.dispose();
  this.scene.traverse(o=>{if(o.geometry&&!Object.values(geometries).includes(o.geometry))o.geometry.dispose()});
  for(const template of this.aircraftTemplates.values())template.traverse(o=>o.geometry?.dispose());this.aircraft.clear();this.aircraftTemplates.clear();
  for(const m of this.materials){m.map?.dispose();m.dispose();}for(const tx of Object.values(this.textures).flat())tx.dispose();this.sky.material.dispose();this.renderer.dispose();
 }
}
function render(type,game,ctx,w,h,camera=false){
 if(failed.has(game))return false;
 try{
  let world=cache.get(game);if(world&&(world.disposed||world.type!==type||world.quality!==(window.ArcadePlaySettings?.get().quality||'auto')||type==='combat'&&world.mission!==game.mission?.id)){world.dispose();cache.delete(game);world=null}
  if(!world){world=new World(game,type);cache.set(game,world)}return world.render(ctx,w,h,camera);
 }catch(error){cache.get(game)?.dispose();cache.delete(game);failed.add(game);console.warn('Cenário 3D indisponível, usando renderização compatível.',error.message);return false}
}
window.ArcadeWorldRenderer={
 flight:(game,ctx,w,h)=>render('flight',game,ctx,w,h),combat:(game,ctx,w,h,camera)=>render('combat',game,ctx,w,h,camera),
 release(game){cache.get(game)?.dispose();cache.delete(game);failed.delete(game);delete game.worldVisual},
 hasAircraft(game,body){return !cache.get(game)?.lost&&cache.get(game)?.aircraft.has(body)||false},
 // Read-only projection inspection used by the browser regression checks.
 project(game,x,y,z,w,h){const world=cache.get(game);if(!world)return null;const p=new T.Vector3(x,y,-z).project(world.camera);return{x:(p.x+1)*w/2,y:(1-p.y)*h/2}},
 inspect(game){const world=cache.get(game);return world?{staticInstances:[...world.static.items.values()].reduce((n,b)=>n+b.count,0),dynamicInstances:[...world.dynamic.items.values()].reduce((n,b)=>n+b.count,0),materials:world.materials.length,renderer:game.worldVisual,mission:world.mission||'flight',aircraft:world.aircraft.size}:null}
};
})();

/* Original game meshes inspired by Brazilian classics. Geometry is authored
 * here; no third-party mesh or photograph is embedded. Forward is +Z. */
// @otthi-module-body
(()=>{'use strict';
const catalog=Object.freeze({fusca:{label:'Fusca',color:0x2788d2},gol:{label:'Gol quadrado',color:0xc82e32},uno:{label:'Uno clássico',color:0xe8e4d6},kombi:{label:'Kombi clássica',color:0x40a7ac}}),caches=new WeakMap();
function build(T,key){
 const root=new T.Group();root.name='BR_'+key.toUpperCase();root.userData.model=key;root.userData.label=catalog[key].label;
 const buckets=new Map(),white=0xffffff,chrome=0xc8d4d9,dark=0x19242b,rubber=0x182027,glass=0x294653,cream=0xe5dfcd;
 const materials={paint:new T.MeshStandardMaterial({color:white,vertexColors:true,metalness:.32,roughness:.29,side:T.DoubleSide}),fixed:new T.MeshStandardMaterial({color:white,vertexColors:true,metalness:.36,roughness:.38}),glass:new T.MeshStandardMaterial({color:white,vertexColors:true,transparent:true,opacity:.63,depthWrite:false,metalness:.13,roughness:.12,side:T.DoubleSide}),interior:new T.MeshStandardMaterial({color:white,vertexColors:true,roughness:.85,side:T.DoubleSide})};
 function add(geometry,color,x=0,y=0,z=0,sx=1,sy=1,sz=1,kind='fixed',parent=null){const m=new T.Mesh(geometry,new T.MeshBasicMaterial({color}));m.position.set(x,y,z);m.scale.set(sx,sy,sz);if(parent)parent.add(m);else{if(!buckets.has(kind))buckets.set(kind,[]);buckets.get(kind).push(m);}return m;}
 const box=(c,x,y,z,w,h,d,k='fixed',p=null)=>add(new T.BoxGeometry(1,1,1),c,x,y,z,w,h,d,k,p);
 const ell=(c,x,y,z,w,h,d,k='fixed',p=null)=>add(new T.SphereGeometry(1,20,12),c,x,y,z,w,h,d,k,p);
 function quad(points,color,kind='fixed'){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,1,2,0,2,3].flatMap(i=>points[i]),3));g.computeVertexNormals();return add(g,color,0,0,0,1,1,1,kind);}
 function tube(points,r,color,kind='fixed'){return add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(8,points.length*4),r,6,false),color,0,0,0,1,1,1,kind);}
 function ring(x,y,z,r,c,tilt=0){const m=add(new T.TorusGeometry(r,.016,8,24),c,x,y,z);m.rotation.x=tilt;return m;}
 function wheel(i,x,z,r=.285){const g=new T.Group();g.name='wheel-'+i;g.rotation.order='YXZ';g.position.set(x,r+.018,z);root.add(g);const tire=add(new T.CylinderGeometry(r,r,.19,24),rubber,0,0,0,1,1,1,'fixed',g);tire.rotation.z=Math.PI/2;
  const rim=add(new T.CylinderGeometry(r*.72,r*.72,.198,24),key==='fusca'||key==='kombi'?cream:0xadb8bb,0,0,0,1,1,1,'fixed',g);rim.rotation.z=Math.PI/2;
  const cap=ell(chrome,Math.sign(x)*.11,0,0,.035,r*.51,r*.51,'fixed',g);
  for(let n=0;n<5;n++){const a=n*Math.PI*2/5;ell(0x34424a,Math.sign(x)*.103,Math.sin(a)*r*.56,Math.cos(a)*r*.56,.007,.025,.025,'fixed',g);}return g;
 }
 function cabinSeats(bus=false){for(const side of[-1,1]){box(0x514d43,side*.255,.43,.02,.38,.14,.42,'interior');const back=box(0x514d43,side*.255,.65,-.19,.38,.43,.09,'interior');back.rotation.x=-.1;box(0x484b49,side*.255,.43,-.70,.38,.14,.39,'interior');box(0x484b49,side*.255,.64,-.89,.38,.39,.09,'interior');}
  box(key==='fusca'?white:dark,0,.73,.42,1,.12,.16,key==='fusca'?'paint':'interior');const sw=ring(-.255,.79,.23,.115,dark,-.45);tube([[-.255,.79,.23],[-.255,.70,.38]],.015,dark,'interior');
  ell(0xe7dfc7,-.255,.76,.334,.065,.062,.008,'interior');ell(0x313c42,-.255,.76,.342,.052,.050,.007,'interior');
 }
 if(key==='fusca'){
  const stations=[[-1.60,.16,.54],[-1.44,.37,.66],[-1.20,.48,.82],[-1.02,.515,1.01],[-.76,.54,1.24],[-.40,.55,1.36],[0,.55,1.37],[.32,.54,1.29],[.56,.52,1.12],[.74,.50,.91],[1.06,.44,.78],[1.40,.33,.64],[1.60,.12,.52]];
  function sample(z){let i=0;while(i<stations.length-2&&z>stations[i+1][0])i++;const a=stations[i],b=stations[i+1],t=(z-a[0])/(b[0]-a[0]),s=t*t*(3-2*t);return{w:a[1]+(b[1]-a[1])*s,h:a[2]+(b[2]-a[2])*s};}
  const groups={paint:[],glass:[]},N=96,A=40;
  function point(z,a){const p=sample(z),belt=Math.min(.70,p.h-.045);return[p.w*Math.sin(a),belt+(p.h-belt)*Math.cos(a),z];}
  for(let i=0;i<N;i++)for(let j=0;j<A;j++){const z=-1.6+3.2*i/N,nz=-1.6+3.2*(i+1)/N,a=-Math.PI/2+Math.PI*j/A,na=-Math.PI/2+Math.PI*(j+1)/A,mid=(z+nz)/2,angle=Math.abs((a+na)/2),side=mid>-.78&&mid<.51&&angle>.87&&angle<1.43&&Math.abs(mid+.20)>.028&&Math.abs(mid-.37)>.014,front=mid>.53&&mid<.73&&angle<.87,rear=mid>-.99&&mid<-.77&&angle<.77,kind=side||front||rear?'glass':'paint';groups[kind].push(...[point(z,a),point(nz,a),point(nz,na),point(z,a),point(nz,na),point(z,na)].flat());}
  for(const kind of['paint','glass']){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(groups[kind],3));g.computeVertexNormals();add(g,kind==='paint'?white:glass,0,0,0,1,1,1,kind);}
  // Lower sill is separate from the curved upper shell, leaving real windows.
  for(let i=0;i<stations.length-1;i++){const a=stations[i],b=stations[i+1];for(const side of[-1,1])quad([[side*a[1],.28,a[0]],[side*b[1],.28,b[0]],[side*b[1],Math.min(.70,b[2]-.045),b[0]],[side*a[1],Math.min(.70,a[2]-.045),a[0]]],white,'paint');}
  box(dark,0,.26,0,1,.10,2.7);
  for(const side of[-1,1]){
   box(rubber,side*.61,.29,0,.20,.06,1.26);tube([[side*.72,.32,-.63],[side*.72,.32,.63]],.014,chrome);
   for(const z of[-1.02,1.02]){const pos=[],idx=[];for(let a=0;a<=30;a++)for(let b=0;b<=12;b++){const t=a*Math.PI/30,s=-Math.PI/2+b*Math.PI/12;pos.push(side*(.585+Math.cos(s)*.175),.305+Math.sin(t)*(.38+Math.sin(s)*.095),z+Math.cos(t)*(.43+Math.sin(s)*.095));if(a<30&&b<12){const n=a*13+b;idx.push(n,n+13,n+14,n,n+14,n+1);}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();const f=add(geo,white,0,0,0,1,1,1,'paint');f.material.side=T.DoubleSide;}
   ring(side*.60,.66,1.31,.13,chrome,-.18);const lens=ell(0xf2eed8,side*.60,.66,1.357,.122,.122,.022);lens.rotation.x=-.18;
   ell(0xe0a14a,side*.61,.795,.995,.063,.033,.105);ell(0xb43132,side*.61,.55,-1.34,.078,.13,.038);
   box(chrome,side*.553,.68,.12,.055,.025,.13);ell(chrome,side*.65,.91,.44,.085,.055,.032);tube([[side*.54,.83,.43],[side*.63,.87,.44]],.010,chrome);
   tube([[side*.52,.74,.52],[side*.553,.72,.38],[side*.555,.40,.37],[side*.55,.36,-.58],[side*.544,.71,-.66]],.006,0x566772);
  }
  quad([[-.12,.28,1.60],[.12,.28,1.60],[.12,.515,1.60],[-.12,.515,1.60]],white,'paint');
  for(const end of[-1,1]){tube([[-.72,.405,end*1.48],[-.55,.41,end*1.63],[0,.41,end*1.69],[.55,.41,end*1.63],[.72,.405,end*1.48]],.034,chrome);for(const side of[-1,1])box(chrome,side*.43,.45,end*1.65,.045,.19,.045);box(dark,0,.42,end*1.70,.31,.13,.018);}
  for(const side of[-1,1])tube([[side*.12,.555,1.57],[side*.32,.705,1.24],[side*.39,.84,.87],[side*.35,.96,.71]],.006,0x6992ac);
  for(let i=0;i<8;i++){const z=-1.40+i*.032;const y=sample(z).h+.006;tube([[-.22,y,z],[.22,y,z]],.007,dark);}
  for(const[i,x,z]of[[0,-.665,1.01],[1,.665,1.01],[2,-.665,-1.02],[3,.665,-1.02]])wheel(i,x,z);
  cabinSeats();
 }else if(key==='kombi'){
  // Rounded lower bus body, split windscreen and two-tone roof, not a cube van.
  const footprint=new T.Shape();footprint.moveTo(-.54,-1.56);footprint.lineTo(.54,-1.56);footprint.quadraticCurveTo(.72,-1.56,.72,-1.38);footprint.lineTo(.72,1.38);footprint.quadraticCurveTo(.72,1.56,.54,1.56);footprint.lineTo(-.54,1.56);footprint.quadraticCurveTo(-.72,1.56,-.72,1.38);footprint.lineTo(-.72,-1.38);footprint.quadraticCurveTo(-.72,-1.56,-.54,-1.56);const busGeo=new T.ExtrudeGeometry(footprint,{depth:.67,bevelEnabled:false,curveSegments:8});busGeo.rotateX(-Math.PI/2);busGeo.translate(0,.30,0);add(busGeo,white,0,0,0,1,1,1,'paint');box(cream,0,.94,-.10,1.39,.10,2.81);for(const side of[-1,1]){box(cream,side*.69,1.42,-.12,.065,.085,2.81);for(const z of[1.40,.76,.07,-.66,-1.37])box(cream,side*.69,1.18,z,.065,.47,z===.07||z===-.66?.16:.085);}box(cream,0,1.44,1.39,1.40,.09,.10);for(const x of[-.64,.64])box(cream,x,1.18,-1.53,.11,.48,.055);box(cream,0,1.38,-1.53,1.37,.075,.055);box(cream,0,1.49,-.04,1.43,.12,2.96);ell(cream,0,1.55,-.04,.715,.06,1.48);
  for(const side of[-1,1]){quad([[side*.025,.99,1.565],[side*.62,.99,1.51],[side*.60,1.38,1.385],[side*.025,1.38,1.42]],glass,'glass');for(let i=0;i<3;i++)quad([[side*.704,.96,.72-i*.73],[side*.704,.96,.15-i*.73],[side*.704,1.36,.15-i*.73],[side*.704,1.36,.72-i*.73]],glass,'glass');ell(chrome,side*.51,.64,1.58,.13,.13,.045);ell(0xefebda,side*.51,.64,1.62,.108,.108,.018);box(0xd79c41,side*.56,.91,1.575,.13,.045,.035);box(0xbd3b3e,side*.58,.62,-1.58,.11,.28,.035);tube([[side*.71,.90,-1.38],[side*.71,.90,1.24]],.012,chrome);box(dark,side*.715,.85,.40,.022,.025,.12);}
  quad([[-.54,1.02,-1.53],[.54,1.02,-1.53],[.54,1.34,-1.53],[-.54,1.34,-1.53]],glass,'glass');for(const end of[-1,1])box(chrome,0,.40,end*1.65,1.47,.10,.11);
  for(const[i,x,z]of[[0,-.65,1.0],[1,.65,1.0],[2,-.65,-.99],[3,.65,-.99]])wheel(i,x,z,.28);cabinSeats(true);
 }else{
  const uno=key==='uno',roof=uno?1.32:1.20,width=.68;
  const points=[[-1.48,.55],[-1.34,.77],[-.94,.79],[.24,.79],[.67,.79],[1.43,.72],[1.49,.46],[-1.48,.35]];
  const shape=new T.Shape();points.forEach(([z,y],i)=>i?shape.lineTo(z,y):shape.moveTo(z,y));shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:width*2,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:2,steps:1});geo.rotateY(-Math.PI/2);geo.translate(width,0,0);add(geo,white,0,0,0,1,1,1,'paint');
  box(white,0,roof,-.35,1.27,.065,1.22,'paint');
  for(const side of[-1,1]){const x=side*(width+.015);tube([[x,.81,.65],[side*.61,roof,.24],[side*.61,roof,-.94],[x,.81,-1.34]],.035,white,'paint');box(white,x,(roof+.8)/2,-.105,.045,roof-.8,.05,'paint');box(white,x,.805,-.35,.035,.05,1.93,'paint');}
  // Real open cabin: glazing has no painted solid wall behind it.
  for(const side of[-1,1]){const x=side*(width+.038);quad([[x,.84,.55],[x,.84,-.08],[x,roof-.09,-.08],[x,roof-.09,.19]],glass,'glass');quad([[x,.84,-.13],[x,.84,-1.23],[x,roof-.09,-.89],[x,roof-.09,-.13]],glass,'glass');tube([[x,.77,1.27],[x,.77,-1.33]],.018,dark);box(dark,x,.79,-.03,.02,.035,.14);ell(dark,side*.77,.94,.39,.075,.05,.043);box(dark,side*.31,.95,.73,.30,.02,.02);}
  quad([[-.59,.88,.67],[.59,.88,.67],[.59,roof-.07,.25],[-.59,roof-.07,.25]],glass,'glass');quad([[-.56,.84,-1.38],[.56,.84,-1.38],[.56,roof-.08,-.96],[-.56,roof-.08,-.96]],glass,'glass');
  for(const side of[-1,1]){box(0xeae8d4,side*.46,.66,1.465,.32,uno?.125:.17,.028);box(0xdba65b,side*.645,.64,1.455,.09,.12,.028);box(0xb52d31,side*.55,uno?.71:.66,-1.515,uno?.13:.30,uno?.31:.15,.026);box(dark,side*.65,.36,0,.09,.10,1.45);}
  box(dark,0,.62,1.477,.50,.17,.025);for(let i=0;i<3;i++)box(0x849297,0,.58+i*.04,1.492,.46,.008,.005);for(const end of[-1,1])box(dark,0,.40,end*1.49,1.46,.13,.12);box(dark,0,.50,-1.53,.30,.13,.018);
  tube(uno?[[0,.87,.69],[-.21,1.12,.45]]:[[-.42,.87,.69],[-.19,1.10,.47]],.009,dark);if(!uno)tube([[.12,.87,.69],[.35,1.10,.47]],.009,dark);
  for(const[i,x,z]of[[0,-.65,.94],[1,.65,.94],[2,-.65,-.96],[3,.65,-.96]])wheel(i,x,z,.275);cabinSeats();
 }
 function merge(meshes,name,material,parent=root){if(!meshes.length)return;const p=[],n=[],c=[];for(const m of meshes){m.updateMatrix();const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrix);const a=g.attributes.position,b=g.attributes.normal,col=m.material.color.clone().convertSRGBToLinear();for(let i=0;i<a.count;i++){p.push(a.getX(i),a.getY(i),a.getZ(i));n.push(b.getX(i),b.getY(i),b.getZ(i));c.push(col.r,col.g,col.b);}g.dispose();m.geometry.dispose();m.material.dispose();m.parent?.remove(m);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeBoundingSphere();const m=new T.Mesh(g,material);m.name=name;m.castShadow=name!=='glass';m.receiveShadow=true;parent.add(m);return m;}
 for(const[k,list]of buckets)merge(list,k,materials[k]);for(const g of root.children.filter(x=>x.name.startsWith('wheel-')))merge([...g.children],g.name+'-mesh',materials.fixed,g);
 root.userData.seatScale=key==='gol'?.33:key==='kombi'?.40:.36;root.userData.seats=[{x:-.255,y:.32,z:.03},{x:.255,y:.32,z:.03},{x:-.255,y:.32,z:-.64},{x:.255,y:.32,z:-.64}];return root;
}
function create(T,key='fusca',color){if(!catalog[key])key='fusca';let cache=caches.get(T);if(!cache)caches.set(T,cache=new Map());if(!cache.has(key))cache.set(key,build(T,key));const root=cache.get(key).clone(true);root.traverse(m=>{if(m.isMesh&&m.name==='paint'){m.material=m.material.clone();m.material.color.set(color??catalog[key].color).convertSRGBToLinear();m.material.userData.ownedBrazilPaint=true;}});return root;}
(typeof window!=='undefined'?window:globalThis).OTBrazilVehicles={catalog,create};
})();

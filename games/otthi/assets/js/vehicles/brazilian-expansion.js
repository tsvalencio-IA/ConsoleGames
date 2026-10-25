/* Authored road vehicles sold in Brazil. The existing simulation owns motion,
 * accounts, workshop and online presence. Forward is +Z; dimensions are game units. */
// @otthi-module-body
(()=>{'use strict';
const catalog={
 veraneio:{label:'Chevrolet Veraneio clássica',color:0x3f817c,description:'SUV clássico grande, quatro portas, vidros amplos e cromados.'},
 blazer:{label:'Chevrolet Blazer',color:0x294a71,description:'Blazer de primeira geração, carroceria SUV, teto alto e traseira própria.'},
 pampa:{label:'Ford Pampa',color:0x9b3a32,description:'Picape de cabine simples, frente Ford e caçamba longa.'},
 escort:{label:'Ford Escort XR3',color:0xdddeda,description:'Hatch esportivo XR3 de duas portas, aerofólio e vidros próprios.'},
 tcross:{label:'Volkswagen T-Cross',color:0xdfe1df,description:'SUV compacto, grade horizontal, rack e lanternas conectadas.'},
 peugeot206:{label:'Peugeot 206',color:0x426b9d,description:'Hatch arredondado de cinco portas, faróis alongados e lanternas próprias.'},
 jetta:{label:'Volkswagen Jetta',color:0xb7bec3,description:'Sedã da sexta geração, três volumes e grade horizontal.'},
 corolla2007:{label:'Toyota Corolla 2007',color:0xc5c9c8,description:'Corolla E120 de linhas arredondadas e três volumes.'},
 corolla2021:{label:'Toyota Corolla 2021',color:0xe4e5e2,description:'Corolla E210, frente baixa, grade ampla e faróis estreitos.'},
 civic2011:{label:'Honda New Civic 2011',color:0x4c5861,description:'New Civic de oitava geração, para-brisa inclinado e silhueta em cunha.'},
 bmwx1:{label:'BMW X1 F48',color:0xd9dedc,description:'BMW X1, SUV de quatro portas com grade dupla e traseira alta.'},
 bmwm3:{label:'BMW M3 F80',color:0x3585b4,description:'M3 de quatro portas, para-lamas largos, grade dupla e quatro escapes.'},
 ferrari458:{label:'Ferrari 458 Italia',color:0xd8332d,description:'Esportivo de dois lugares, motor central e três saídas de escape.' ,twoSeats:true},
 porsche911:{label:'Porsche 911 Carrera',color:0xc5ced1,description:'Esportivo de faróis redondos, teto curvo e faixa de luz na traseira.'},

 golf7:{label:'Volkswagen Golf TSI 1.4 Turbo 2014',color:0xe5e6e3},palio:{label:'Fiat Palio Economy Celebration 2011',color:0xbec4c8},passat:{label:'Volkswagen Passat GTS Pointer',color:0x9b2f37},tempra:{label:'Fiat Tempra 2.0 16V',color:0x577080},maverick:{label:'Ford Maverick GT V8',color:0xe56b2f},landau:{label:'Ford Landau',color:0x4c343d},
 mobylette:{label:'Caloi Mobylette 50',color:0x439cb4,twoWheeler:true,singleSeat:true},factor:{label:'Yamaha Factor 125',color:0x205b9c,twoWheeler:true},titan:{label:'Honda CG Titan 150',color:0xbf3038,twoWheeler:true},hornet:{label:'Honda CB 600F Hornet',color:0xe8b422,twoWheeler:true},xre:{label:'Honda XRE 300',color:0xa52d37,twoWheeler:true},bmwgs:{label:'BMW R 1250 GS',color:0xc4d6de,twoWheeler:true},bicycle:{label:'Caloi 10 · bicicleta',color:0x3c8d57,twoWheeler:true,singleSeat:true,humanPowered:true},
 dinossauro:{label:'Ciferal Dinossauro',color:0x27588b,bus:true},attivi:{label:'Marcopolo Attivi · elétrico',color:0x3ba699,bus:true,electric:true},doubledeck:{label:'Marcopolo Paradiso G8 1800 DD',color:0x314d72,bus:true,doubleDeck:true},
 semi:{label:'Scania R450 · carreta',color:0x8e3439,articulated:true},fuel:{label:'Scania R450 · tanque de combustível',color:0xe6e7e1,articulated:true,fuel:true}
};
const legacy={'lego-moto':'factor','minecraft-moto':'xre','playmobil-moto':'titan','mario-moto':'hornet'};
const garage=Object.entries(catalog).filter(([key])=>!['factor','titan','hornet','xre'].includes(key)).map(([model,m],i)=>({id:'br-'+model,model,label:m.label,theme:'Brasil',category:m.twoWheeler?'moto':m.bus||m.articulated?'truck':['veraneio','blazer','tcross','bmwx1'].includes(model)?'utility':'small',icon:m.humanPowered?'🚲':m.twoWheeler?'🏍️':m.bus?'🚌':m.articulated?'🚛':'🚗',price:m.humanPowered?100:m.twoWheeler?180+i*25:m.bus?800+i*20:m.articulated?950:360+i*55,description:catalog[model].description||({golf7:'Golf VII 2014, cinco portas, faróis angulares e motor TSI.',palio:'Palio Fire Economy 2011, pacote Celebration, quatro portas e lanternas verticais.',passat:'Passat GTS Pointer de duas portas, quatro faróis retangulares e perfil fastback.',tempra:'Sedã italiano de quatro portas, linhas retas e traseira alta.',maverick:'Maverick GT brasileiro, V8, capô preto, cupê e faróis auxiliares.',landau:'Sedã grande, quatro faróis, teto de vinil e cromados.',mobylette:'Ciclomotor de quadro baixo, pedais, tanque pequeno e rodas raiadas.',bmwgs:'Big trail com motor boxer, para-brisa, bico e malas laterais.',bicycle:'Bicicleta de quadro tubular, rodas raiadas e pedais.',dinossauro:'Rodoviário clássico de alumínio frisado e janelas arredondadas.',attivi:'Ônibus urbano elétrico, piso baixo, portas duplas e baterias no teto.',doubledeck:'Rodoviário de dois andares, duas faixas de janelas e três eixos.',semi:'Cavalo mecânico Scania com semirreboque articulado de carga.',fuel:'Cavalo mecânico Scania com carreta tanque, escada e corrimão.'})[model]}));
const presets={};for(const e of garage)presets[e.id]={theme:'brasil',bodyType:e.category,kind:e.model==='bicycle'?'bicycle':catalog[e.model].bus?'bus':e.category==='truck'?'truck':e.category==='moto'?'moto':'car',body:'classic',hood:'flat',roof:catalog[e.model].twoWheeler?'open':'standard',wheels:catalog[e.model].twoWheeler?'sport':'city',rear:'none',lights:'warm',primary:'#'+catalog[e.model].color.toString(16).padStart(6,'0'),secondary:'#26343e',accent:'#c5cbd0'};
function build(T,key,H){
 const spec=catalog[key];if(!spec?.twoWheeler&&!spec?.bus&&!spec?.articulated)return false;
 const{root,add,box,ell,quad,tube,ring}=H,white=0xffffff,black=0x151e23,chrome=0xb8c3ca,glass=0x355b6b;
 function cylinder(c,x,y,z,r,len,axis='y',kind='fixed',r2=r){const m=add(new T.CylinderGeometry(r2,r,len,24),c,x,y,z,1,1,1,kind);if(axis==='x')m.rotation.z=Math.PI/2;if(axis==='z')m.rotation.x=Math.PI/2;return m;}
 function rounded(c,x,y,z,w,h,d,kind='fixed',radius=.07){const shape=new T.Shape(),r=Math.min(radius,w/3,h/3),l=-w/2,b=-h/2;shape.moveTo(l+r,b);shape.lineTo(l+w-r,b);shape.quadraticCurveTo(l+w,b,l+w,b+r);shape.lineTo(l+w,b+h-r);shape.quadraticCurveTo(l+w,b+h,l+w-r,b+h);shape.lineTo(l+r,b+h);shape.quadraticCurveTo(l,b+h,l,b+h-r);shape.lineTo(l,b+r);shape.quadraticCurveTo(l,b,l+r,b);const geo=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2,curveSegments:6});geo.translate(0,0,-d/2);return add(geo,c,x,y,z,1,1,1,kind);}
 function text(value,x,y,z,w,h,angle=0,color='#e6edf0'){
  if(typeof document==='undefined')return;const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d');ctx.font='bold 83px Arial';ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(value,512,65,1000);const tx=new T.CanvasTexture(c);tx.encoding=T.sRGBEncoding;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tx,transparent:true,alphaTest:.15,side:T.DoubleSide,roughness:.5,depthWrite:false}));m.name='badge-'+value;m.position.set(x,y,z);m.rotation.y=angle;root.add(m);return m;
 }
 function wireWheel(i,z,r,width=.065,spokes=28){const g=new T.Group();g.name='wheel-'+i;g.position.set(0,r+.018,z);g.userData.radius=r;g.userData.steering=i===0;root.add(g);
  const m=add(new T.TorusGeometry(r*.87,r*.13,10,36),black,0,0,0,1,1,width/(r*.26),'fixed',g);m.rotation.y=Math.PI/2;const rim=add(new T.TorusGeometry(r*.76,.012,6,36),chrome,0,0,0,1,1,1,'fixed',g);rim.rotation.y=Math.PI/2;
  const hub=add(new T.CylinderGeometry(r*.13,r*.13,width,16),chrome,0,0,0,1,1,1,'fixed',g);hub.rotation.z=Math.PI/2;
  for(let n=0;n<spokes;n++){const a=n*Math.PI*2/spokes,path=new T.LineCurve3(new T.Vector3((n%2?1:-1)*width*.35,0,0),new T.Vector3(0,Math.cos(a)*r*.76,Math.sin(a)*r*.76));add(new T.TubeGeometry(path,1,.0028,4,false),0x9daeb8,0,0,0,1,1,1,'fixed',g);}
  if(!['mobylette','bicycle'].includes(key)){const disc=add(new T.CylinderGeometry(r*.52,r*.52,.008,28),0x8397a3,.045,0,0,1,1,1,'fixed',g);disc.rotation.z=Math.PI/2;}
  return g;
 }
 if(spec.twoWheeler){
  const pedal=key==='mobylette'||key==='bicycle',cycle=key==='bicycle',trail=key==='xre'||key==='bmwgs',big=key==='bmwgs',sport=key==='hornet',moped=key==='mobylette',radius=cycle?.29:trail?.285:moped?.235:.25,front=cycle?.62:trail?.65:.58,rear=cycle?-.62:-.59,seatY=trail?.78:cycle?.77:moped?.60:.64;
  wireWheel(0,front,radius,cycle?.035:sport?.13:big?.12:.075);wireWheel(1,rear,trail?.27:radius,cycle?.035:sport?.145:big?.14:.085);
  tube([[0,.33,rear],[0,.42,-.10],[0,.74,.24],[0,.86,.39]],.018,black);tube([[0,.38,rear],[0,seatY-.10,-.36],[0,.74,.24]],.020,moped||cycle?white:black,moped||cycle?'paint':'fixed');
  for(const a of[-1,1]){tube([[a*.085,radius+.025,front],[a*.085,.83,front-.17]],trail?.024:.019,chrome,'chrome');tube([[a*.08,radius+.025,rear],[a*.12,.43,-.05],[a*.10,seatY-.13,-.42]],.018,black);}
  if(cycle){tube([[0,.35,-.06],[0,.79,-.27],[0,.78,.28],[0,.35,-.06],[0,.29,rear],[0,.79,-.27]],.019,white,'paint');tube([[0,.35,-.06],[0,.79,.28]],.019,white,'paint');rounded(black,0,seatY,-.28,.22,.055,.25);for(const a of[-1,1])tube([[a*.18,.90,.32],[a*.21,.90,.46],[a*.23,.83,.49],[a*.22,.77,.41]],.014,chrome,'chrome');text('CALOI 10',.022,.60,-.03,.34,.055,Math.PI/2);}
  else{
   rounded(black,0,seatY,-.31,moped?.22:big?.36:.29,.09,moped?.42:.69,'fixed',.055);
   if(moped){ell(white,0,.56,.11,.105,.115,.24,'paint');rounded(white,0,.43,-.02,.12,.17,.15,'paint');cylinder(0x71828b,0,.27,-.04,.064,.19,'x');tube([[.08,.23,-.03],[.15,.16,-.12],[.15,.16,-.46]],.024,chrome,'chrome');}
   else{ell(white,0,seatY+.045,.07,big?.24:sport?.22:.18,.145,.29,'paint');if(sport){rounded(0x303a40,0,.38,-.03,.38,.23,.28,'fixed',.045);for(const a of[-1,1])ell(0x7a8e99,a*.20,.32,-.03,.025,.10,.12,'chrome');}else if(big){ell(0x4e606b,0,.36,-.03,.15,.17,.17,'chrome');for(const a of[-1,1]){cylinder(0x7e919b,a*.24,.39,.04,.085,.18,'x','chrome');for(let j=0;j<5;j++)box(0x425660,a*(.19+j*.022),.39,.04,.007,.17,.16);}}else{ell(0x81939c,0,.30,-.08,.135,.12,.15,'chrome');rounded(0x5b6e78,0,.43,.05,.15,.22,.16,'fixed',.024);for(let j=0;j<6;j++)box(0x9babb0,0,.36+j*.031,.05,.177,.009,.17,'chrome');}if(sport)for(const x of[-.12,-.04,.04,.12])tube([[x,.38,.13],[x,.22,.20],[x,.17,.01],[.17,.18,-.31]],.013,chrome,'chrome');else tube([[.08,.38,.12],[.16,.22,.20],[.19,.21,-.49]],.018,chrome,'chrome');rounded(black,.19,.27,-.36,.09,.095,.37,'fixed',.04);}
   const handleY=trail?1.04:.91;for(const a of[-1,1]){tube([[0,.85,front-.18],[a*.12,handleY,front-.18],[a*.26,handleY+.02,front-.22]],.016,chrome,'chrome');cylinder(black,a*.24,handleY+.02,front-.22,.021,.12,'x');tube([[a*.18,handleY,front-.18],[a*.22,handleY+.17,front-.16]],.007,black);ell(black,a*.23,handleY+.19,front-.16,.052,.034,.022);}
   const lampY=trail?.95:.83;
   if(moped){const lamp=cylinder(chrome,0,lampY,front-.03,.075,.10,'z','chrome');ell(0xbad0d8,0,lampY,front+.028,.062,.062,.010,'lens');}
   else{const points=big?[[-.17,-.08],[.17,-.08],[.17,.08],[-.17,.08]]:sport?[[-.14,.025],[-.085,.12],[.085,.12],[.14,.025],[.075,-.13],[-.075,-.13]]:[[-.13,.085],[.13,.085],[.12,-.035],[0,-.12],[-.12,-.035]],shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:.075,bevelEnabled:true,bevelSize:.010,bevelThickness:.008,bevelSegments:3});add(geo,white,0,lampY,front-.085,1,1,1,'paint');add(geo.clone(),black,0,lampY,front-.073,.91,.91,1,'fixed');add(geo.clone(),0xa9c5d0,0,lampY,front-.058,.77,.77,.93,'lens');if(big){box(0x273e4c,0,lampY,front+.025,.015,.15,.009);}}

   if(trail){const beakShape=new T.Shape();beakShape.moveTo(-.15,-.16);beakShape.lineTo(.15,-.16);beakShape.lineTo(.095,.20);beakShape.quadraticCurveTo(0,.26,-.095,.20);beakShape.closePath();const beakGeo=new T.ExtrudeGeometry(beakShape,{depth:.045,bevelEnabled:true,bevelSize:.015,bevelThickness:.012,bevelSegments:3});beakGeo.rotateX(Math.PI/2);add(beakGeo,white,0,.83,front+.03,1,1,1,'paint');if(big){rounded(glass,0,1.15,front-.10,.35,.31,.025,'glass',.06);for(const a of[-1,1]){rounded(0xabb5ba,a*.35,.65,-.50,.22,.28,.42,'chrome',.03);rounded(black,a*.35,.81,-.50,.24,.03,.44);rounded(0x81939b,a*.25,.37,.04,.18,.14,.20,'chrome',.035);}tube([[-.34,.37,.16],[-.34,.58,.18],[.34,.58,.18],[.34,.37,.16]],.018,black);}}
   const fender=add(new T.TorusGeometry(radius+.026,.018,6,28,Math.PI),moped?chrome:white,0,radius+.018,front,1,1,1,moped?'chrome':'paint');fender.rotation.y=Math.PI/2;rounded(0xa52b32,0,seatY-.06,-.70,.13,.065,.022,'lens',.02);
   for(const a of[-1,1]){ell(0xcea047,a*.17,lampY-.08,front-.02,.027,.025,.035,'lens');ell(0xcea047,a*.15,seatY-.08,-.65,.027,.025,.035,'lens');}
   text(({factor:'YAMAHA',titan:'HONDA',hornet:'HORNET',xre:'XRE',bmwgs:'GS',mobylette:'MOBYLETTE'})[key],big?.246:.19,seatY+.05,.06,.24,.05,Math.PI/2);
  }
  if(pedal){const crank=new T.Group();crank.name='pedal-crank';crank.position.set(0,.34,-.06);root.add(crank);for(const a of[-1,1]){const bar=new T.Mesh(new T.BoxGeometry(.035,.22,.020),new T.MeshStandardMaterial({color:chrome,metalness:.7,roughness:.3}));bar.position.set(a*.09,a*.09,0);crank.add(bar);const foot=new T.Mesh(new T.BoxGeometry(.14,.035,.06),new T.MeshStandardMaterial({color:black}));foot.position.set(a*.14,a*.18,0);crank.add(foot);}tube([[.08,.32,rear],[.08,.24,-.06],[.08,.37,rear]],.005,chrome,'chrome');}
  Object.assign(root.userData,{twoWheeler:true,humanPowered:cycle,pedals:pedal,seats:[{x:0,y:seatY+.025,z:cycle?-.26:-.12},...(!spec.singleSeat?[{x:0,y:seatY+.035,z:-.51}]:[])],seatScale:cycle?.34:.32,roof:big?1.38:trail?1.27:cycle?1.02:1.13,hoodY:seatY+.1,wheelRadius:radius,front:front+radius,rear:rear-radius,coachwork:'brazil-two-wheel-v1'});return true;
 }
 if(spec.articulated){
  const trailer=new T.Group();trailer.name='articulated-trailer';trailer.position.z=-1.50;root.add(trailer);
  // Tractor: sleeper cab, high windscreen, horizontal Scania grille, tanks and three axles.
  rounded(white,0,1.20,.45,1.81,1.77,1.99,'paint',.15);rounded(white,0,2.10,.25,1.79,.29,1.82,'paint',.13);rounded(black,0,1.62,1.47,1.60,.65,.035,'fixed',.07);rounded(glass,0,1.64,1.496,1.47,.54,.016,'glass',.06);box(black,0,2.04,1.51,1.70,.085,.12);
  rounded(black,0,.75,1.49,1.51,.78,.044,'fixed',.06);for(let i=0;i<6;i++)rounded(0x5c6c76,0,.44+i*.11,1.52,1.29-i*.07,.036,.024,'fixed',.012);text('SCANIA',0,1.20,1.548,.85,.14);text('R450',.58,1.06,1.551,.25,.06);
  for(const a of[-1,1]){rounded(black,a*.70,.49,1.52,.27,.22,.035,'fixed',.03);for(const y of[.44,.54])rounded(0xbcd1da,a*.70,y,1.546,.22,.065,.009,'lens',.016);rounded(glass,a*.921,1.64,.50,.018,.55,.89,'glass',.014);rounded(black,a*.945,.81,.51,.025,.043,.17);for(const y of[.35,.50])box(0x7b8b94,a*.91,y,.56,.20,.05,.55,'chrome');cylinder(chrome,a*.72,.45,-.85,.20,.83,'z');tube([[a*.84,1.91,1.26],[a*1.08,1.84,1.45],[a*1.08,1.40,1.45]],.022,black);rounded(black,a*1.08,1.53,1.45,.12,.33,.10);}
  box(black,0,.34,-.43,1.54,.17,3.98);for(const z of[-.86,-1.75])box(0x26333a,0,.56,z,1.68,.10,.54);cylinder(black,0,.56,-1.5,.45,.09,'y');
  const trailerKind=k=>'trailer-'+k,wb=(c,x,y,z,w,h,d,k='fixed')=>box(c,x,y,z,w,h,d,trailerKind(k)),we=(c,x,y,z,w,h,d,k='fixed')=>ell(c,x,y,z,w,h,d,trailerKind(k));
  wb(black,0,.43,-3.55,1.58,.20,8.1);for(const a of[-1,1])wb(0x54636b,a*.80,.39,-3.55,.08,.18,8.12);
  if(spec.fuel){
   const tank=add(new T.CylinderGeometry(.78,.78,7.38,40,1,false),0xbcc7ce,0,1.30,-3.48,1,.95,1,'trailer-chrome');tank.rotation.x=Math.PI/2;for(const z of[.21,-7.17])we(0xbcc7ce,0,1.30,z,.78,.741,.22,'chrome');
   for(const z of[-.03,-2.27,-4.68,-7.0]){const ring=add(new T.TorusGeometry(.787,.012,6,40),0x7b8d99,0,1.30,z,1,.95,1,'trailer-chrome');}
   for(const a of[-1,1]){wb(0x8597a2,a*.48,2.05,-3.4,.025,.035,6.7,'chrome');for(const z of[-.3,-2.5,-4.7,-6.5])wb(chrome,a*.48,2.18,z,.025,.27,.025,'chrome');wb(chrome,a*.48,2.31,-3.4,.028,.028,6.70,'chrome');wb(0xdc812b,a*.798,1.29,-3.6,.014,.25,.39);}
   for(const z of[-1.3,-3.4,-5.5]){const valve=add(new T.CylinderGeometry(.105,.105,.07,16),0x71858e,0,2.04,z,1,1,1,'trailer-fixed');}
   for(const a of[-1,1])wb(chrome,a*.20,1.20,-7.43,.025,1.65,.025,'chrome');for(let n=0;n<8;n++)wb(chrome,0,.45+n*.20,-7.45,.42,.025,.025,'chrome');
  }else{
   wb(white,0,1.45,-3.55,1.90,1.96,8.16,'paint');for(const a of[-1,1]){for(let n=0;n<48;n++)wb(0x9ca5a9,a*.959,1.45,.39-n*.17,.012,1.83,.014);wb(0x1e4664,a*.973,1.55,-3.55,.012,.36,7.97);}
   for(const a of[-1,1]){wb(0xd1d7da,a*.47,1.44,-7.65,.91,1.82,.035,'chrome');for(const x of[a*.10,a*.69])wb(0x718690,x,1.43,-7.68,.027,1.54,.017,'chrome');}wb(0x344b59,0,2.43,-3.55,1.98,.06,8.23);
  }
  wb(0x657984,0,.30,-7.54,1.81,.07,.11);for(const a of[-1,1])wb(0x9e2a32,a*.70,.45,-7.60,.27,.11,.024,'lens');
  for(const z of[.94,-1.06,-1.77])for(const a of[-1,1])H.wheel(root.children.filter(o=>/^wheel-\d+$/.test(o.name)).length,a*.84,z,.34);
  let i=6;for(const z of[-5.62,-6.31,-7.0])for(const a of[-1,1]){const w=H.wheel(i++,a*.86,z,.34);trailer.add(w);w.userData.steering=false;}
  Object.assign(root.userData,{articulated:true,trailer:{hitch:-1.5,wheelbase:6.35,maxAngle:1.10},seats:[{x:-.43,y:.93,z:.87},{x:.43,y:.93,z:.87},{x:0,y:.92,z:.01}],seatScale:.39,roof:2.30,hoodY:1.28,wheelRadius:.34,front:1.64,rear:-9.23,coachwork:'brazil-articulated-v1'});return true;
 }
 if(spec.bus){
  const dd=!!spec.doubleDeck,classic=key==='dinossauro',L=dd?4.15:classic?3.45:3.65,W=1.0,height=dd?3.18:classic?2.45:2.60,belt=classic?1.30:1.12;
  // Rounded end caps and a formed roof, with empty window openings.
  rounded(white,0,.72,0,W*2,.84,L*2,'paint',.14);rounded(white,0,belt-.025,0,W*2,.13,L*2-.08,'paint',.04);
  const roofPts=[],roofIdx=[];for(let i=0;i<=16;i++)for(let j=0;j<=32;j++){const x=(i/16*2-1)*W,z=(j/32*2-1)*L;roofPts.push(x,height-.10*(x/W)**2-.045*(z/L)**8,z);}for(let i=0;i<16;i++)for(let j=0;j<32;j++){const n=i*33+j;roofIdx.push(n,n+1,n+34,n,n+34,n+33);}const roofGeo=new T.BufferGeometry();roofGeo.setAttribute('position',new T.Float32BufferAttribute(roofPts,3));roofGeo.setIndex(roofIdx);roofGeo.computeVertexNormals();add(roofGeo,white,0,0,0,1,1,1,'paint');
  function pane(a,y,z,ww,hh){const g=rounded(glass,a*(W+.007),y,z,ww,hh,.008,'glass',classic?.065:.025);g.rotation.y=a*Math.PI/2;const pts=[[a*(W+.015),y-hh/2,z-ww/2],[a*(W+.015),y+hh/2,z-ww/2],[a*(W+.015),y+hh/2,z+ww/2],[a*(W+.015),y-hh/2,z+ww/2],[a*(W+.015),y-hh/2,z-ww/2]];tube(pts,.019,black);}

  for(const a of[-1,1]){
   const low=dd?1.18:belt+.035,high=dd?1.94:height-.16,wy=(low+high)/2,wh=high-low;
   for(let i=0;i<(classic?9:8);i++){const step=(L*2-.55)/(classic?9:8),z=L-.30-step/2-i*step;pane(a,wy,z,step-.055,wh);box(white,a*(W+.018),wy,z-step/2,.035,wh+.06,.055,'paint');}box(white,a*W,height-.12,0,.045,.10,L*2-.08,'paint');
   if(dd){box(white,a*W,2.045,0,.05,.22,L*2-.10,'paint');for(let i=0;i<9;i++){const z=L-.40-i*(L*2-.55)/9;pane(a,2.53,z,.79,.78);box(white,a*(W+.018),2.53,z-.41,.035,.94,.048,'paint');}}
   if(classic){for(let i=0;i<9;i++)box(i%2?0xa5b2bc:0xd0d8db,a*(W+.015),.51+i*.074,0,.018,.018,L*2-.19,'chrome');box(0x1d5c95,a*(W+.027),1.22,0,.016,.17,L*2-.20);}
   else box(0x203b50,a*(W+.025),.51,0,.018,.18,L*2-.18);
   for(const z of[-2.0,-.7,.6,1.9])for(const x of[-.52,.52]){rounded(0x2c485b,x,.92,z,.49,.09,.50,'interior',.035);rounded(0x364d5c,x,1.15,z-.23,.47,.51,.09,'interior',.035);if(dd){rounded(0x2c485b,x,2.21,z,.49,.09,.50,'interior',.035);rounded(0x364d5c,x,2.43,z-.23,.47,.46,.09,'interior',.035);}}
  }
  rounded(white,0,height-.20,L-.025,1.94,.34,.10,'paint',.10);rounded(white,0,(height+1.12)/2,-L+.015,1.94,height-1.12,.10,'paint',.08);rounded(black,0,height-.58,-L-.049,1.55,.43,.018,'fixed',.07);
  rounded(black,0,1.66,L+.025,1.88,1.10,.035,'fixed',.15);rounded(glass,0,1.66,L+.047,1.73,.97,.014,'glass',.14);box(0xa6b1b8,0,1.66,L+.059,.025,1.02,.008,'chrome');
  if(dd){rounded(black,0,2.65,L+.022,1.92,.82,.04,'fixed',.15);rounded(glass,0,2.65,L+.046,1.78,.69,.012,'glass',.14);}
  for(const a of[-1,1]){tube([[a*.91,2.02,L-.12],[a*1.12,1.95,L+.18],[a*1.12,1.68,L+.18]],.025,black);rounded(black,a*1.12,1.72,L+.18,.14,.29,.09);if(classic)for(const dx of[.53,.78]){ell(chrome,a*dx,.86,L+.055,.095,.095,.025,'chrome');ell(0xb9ced5,a*dx,.86,L+.082,.077,.077,.009,'lens');}else{rounded(black,a*.74,.76,L+.047,.35,.29,.029,'fixed',.08);for(const yy of[.68,.82])rounded(0xaec7d3,a*.74,yy,L+.071,.25,.075,.012,'lens',.025);}rounded(0x9e2e36,a*.81,.88,-L-.06,.12,.33,.020,'lens',.03);}
  if(!classic){for(const z of[L-1.0,-.60]){const door=rounded(black,W+.032,1.03,z,.73,1.54,.035,'fixed',.035);door.rotation.y=Math.PI/2;for(const dz of[-.18,.18]){const glassDoor=rounded(glass,W+.055,1.21,z+dz,.32,1.08,.008,'glass',.02);glassDoor.rotation.y=Math.PI/2;}box(0x8eaa94,W+.066,.39,z,.025,.045,.66);box(white,W+.063,1.04,z,.022,1.46,.025,'paint');}if(spec.electric){rounded(white,0,height+.13,-.65,1.52,.27,3.0,'paint',.08);text('ELÉTRICO',0,2.24,L+.079,1.21,.15,0,'#8fe2cc');}else text('OTTHI · RODOVIÁRIO',0,2.14,L+.079,1.38,.13);}
  else{text('DINOSSAURO',0,2.21,L+.068,1.15,.11);rounded(0xb7c3cc,0,.54,L+.047,1.78,.14,.06,'chrome',.035);}
  for(const z of[1.72,-1.85,...(dd?[-2.65]:[])])for(const a of[-1,1])H.wheel(root.children.filter(o=>o.name.startsWith('wheel-')).length,a*.94,z,.36);
  text(classic?'CIFERAL':dd?'MARCOPOLO G8':'ATTIVI',0,.51,L+.095,.66,.10);text('OTTHI',0,1.88,-L-.065,.91,.14,Math.PI);
  Object.assign(root.userData,{bus:true,doubleDeck:dd,electric:!!spec.electric,seats:[{x:-.52,y:.88,z:L-.72},{x:.52,y:.88,z:L-1.28},...[-.8,-2.0].flatMap(z=>[-.52,.52].map(x=>({x,y:.93,z})))],seatScale:.38,roof:height+(spec.electric?.30:.03),hoodY:1.08,wheelRadius:.36,front:L+.13,rear:-L-.13,coachwork:'brazil-coach-v1'});return true;
 }
 return false;
}
(typeof window!=='undefined'?window:globalThis).OTBrazilExpansion={catalog:Object.freeze(catalog),garage:Object.freeze(garage),presets:Object.freeze(presets),legacy:Object.freeze(legacy),build};
})();

/* Authored automotive surfaces. +Z forward; the existing vehicle simulation,
 * wheel pivots and family seats remain the integration contract. */
// @otthi-module-body
(()=>{'use strict';
const specs={
 gol:{l:3.12,w:1.34,h:1.17,b:.70,r:.257,fa:.98,ra:-.99,front:.55,rf:.19,rr:-.81,rear:-1.34,bp:-.27,seat:.01,back:-.63,classic:true,doors:2,crown:.025,nose:.055},
 uno:{l:3.05,w:1.32,h:1.25,b:.74,r:.255,fa:.94,ra:-.98,front:.53,rf:.22,rr:-1.12,rear:-1.40,bp:-.30,seat:.01,back:-.64,doors:2,crown:.034,nose:.055},
 golf:{l:3.34,w:1.43,h:1.22,b:.78,r:.276,fa:1.03,ra:-1.02,front:.58,rf:.16,rr:-1.10,rear:-1.61,bp:-.28,seat:.01,back:-.65,doors:4,crown:.057,nose:.12},
 opala:{l:3.87,w:1.51,h:1.18,b:.73,r:.282,fa:1.15,ra:-1.15,front:.66,rf:.16,rr:-.66,rear:-1.30,bp:-.40,seat:.01,back:-.65,classic:true,doors:2,crown:.047,nose:.07},
 chevette:{l:3.26,w:1.33,h:1.15,b:.71,r:.258,fa:.98,ra:-.98,front:.54,rf:.13,rr:-.64,rear:-1.08,bp:-.31,seat:0,back:-.59,classic:true,doors:2,crown:.052,nose:.12},
 s10:{l:3.94,w:1.55,h:1.39,b:.90,r:.316,fa:1.22,ra:-1.21,front:.71,rf:.26,rr:-.62,rear:-.77,bp:-.25,seat:.16,back:-.43,doors:4,pickup:true,crown:.047,nose:.12},
 hilux:{l:3.94,w:1.59,h:1.45,b:.94,r:.329,fa:1.20,ra:-1.18,front:.74,rf:.28,rr:-.61,rear:-.79,bp:-.25,seat:.19,back:-.42,doors:4,pickup:true,crown:.074,nose:.15},
 amarok:{l:3.94,w:1.65,h:1.43,b:.96,r:.330,fa:1.19,ra:-1.19,front:.76,rf:.30,rr:-.62,rear:-.80,bp:-.26,seat:.20,back:-.43,doors:4,pickup:true,crown:.044,nose:.09},
 saveiro:{l:3.53,w:1.43,h:1.26,b:.78,r:.275,fa:1.08,ra:-1.08,front:.61,rf:.19,rr:-.61,rear:-.78,bp:-.25,seat:.06,back:-.43,doors:4,pickup:true,crown:.052,nose:.14},
 kombi:{l:3.46,w:1.42,h:1.60,b:.91,r:.269,fa:1.08,ra:-1.11,front:1.59,rf:1.36,rr:-1.43,rear:-1.63,bp:.77,seat:.82,back:-.35,classic:true,bus:true,doors:3,crown:.04,nose:.15}
};
function build(T,key,h){
 const p=specs[key];if(!p)return false;
 const {root,add,box,ell,tube,ring,wheel,quad}=h,W=p.w/2,L=p.l/2,white=0xffffff,black=0x11191e,chrome=0xbac5ce,cream=0xe9e6d9,glass=0x527b8a;
 const Y=p.b,roof=p.h,roofW=W*(p.bus?.96:key==='golf'?.83:p.pickup?.86:.87),low=p.pickup?.33:.24;
 // Shared indexed patches preserve averaged normals across the curved metal.
 function patch(n,m,point,c=white,k='paint'){
  const a=[],idx=[];for(let i=0;i<=n;i++)for(let j=0;j<=m;j++)a.push(...point(i/n,j/m));
  for(let i=0;i<n;i++)for(let j=0;j<m;j++){const q=i*(m+1)+j;idx.push(q,q+m+1,q+m+2,q,q+m+2,q+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(a,3));g.setIndex(idx);g.computeVertexNormals();return add(g,c,0,0,0,1,1,1,k);
 }
 function rb(c,x,y,z,w,hh,d,k='fixed',r=.025){
  r=Math.min(r,w*.23,hh*.40);const q=new T.Shape(),a=-w/2,b=-hh/2;
  q.moveTo(a+r,b);q.lineTo(a+w-r,b);q.quadraticCurveTo(a+w,b,a+w,b+r);q.lineTo(a+w,b+hh-r);q.quadraticCurveTo(a+w,b+hh,a+w-r,b+hh);q.lineTo(a+r,b+hh);q.quadraticCurveTo(a,b+hh,a,b+hh-r);q.lineTo(a,b+r);q.quadraticCurveTo(a,b,a+r,b);
  const bv=Math.min(r*.65,d*.24),g=new T.ExtrudeGeometry(q,{depth:Math.max(.001,d-bv*2),bevelEnabled:true,bevelThickness:bv,bevelSize:bv,bevelSegments:3,curveSegments:6});g.translate(0,0,-d/2+bv);return add(g,c,x,y,z,1,1,1,k);
 }
 const line=(pts,r,c=black,k='fixed')=>{const path=new T.CurvePath();for(let i=1;i<pts.length;i++)path.add(new T.LineCurve3(new T.Vector3(...pts[i-1]),new T.Vector3(...pts[i])));return add(new T.TubeGeometry(path,Math.max(pts.length*3,12),r,6,false),c,0,0,0,1,1,1,k);};
 const width=z=>{const q=Math.max(0,(Math.abs(z)/L-.77)/.23),corner=1-Math.sqrt(Math.max(0,1-q*q));return W*(1-p.nose*.40*corner)+(p.pickup&&!p.bus?.013*Math.exp(-(((z-p.ra)/.39)**2)):0);};
 const top=z=>Y-(z>p.front?(z-p.front)/(L-p.front||1)*(p.bus?0:key==='golf'?.10:p.pickup?.065:.075):z<p.rear&&!p.pickup?.025*(p.rear-z)/(L+p.rear):0);
 const bottom=z=>{let y=low;for(const az of[p.fa,p.ra]){const d=z-az,r=p.r+.038;if(Math.abs(d)<r)y=Math.max(y,p.r+.014+Math.sqrt(r*r-d*d));}return y;};
 const sidePoint=(a,z,t)=>{const bulge=(p.pickup?.021:.010)*(Math.exp(-(((z-p.fa)/.37)**2))+Math.exp(-(((z-p.ra)/.37)**2)));return[a*(width(z)-.035*(1-t)**2+bulge*Math.sin(Math.PI*t)),bottom(z)+(top(z)-bottom(z))*t,z];};
 for(const a of[-1,1])patch(112,8,(u,t)=>sidePoint(a,-L+p.l*u,t));
 // Bonnet and boot are bowed across their full width, with rounded noses.
 function deck(z0,z1){if(z1-z0<.02)return;patch(32,20,(u,v)=>{const z=z0+(z1-z0)*u,x=v*2-1;return[x*width(z),top(z)+p.crown*(1-x*x),z];});}
 deck(p.front,L);if(!p.pickup)deck(-L,p.rear);
 for(const e of[-1,1])patch(20,8,(u,v)=>{const x=u*2-1,z=e*L;return[x*width(z),low+(top(z)+p.crown*(1-x*x)-low)*v,z];});
 box(black,0,low-.035,0,p.w*.85,.07,p.l*.89);
 // Continuous rolled arch lips; no body panels run through a rotating tyre.
 for(const a of[-1,1])for(const az of[p.fa,p.ra]){
  const pts=[];for(let i=0;i<=28;i++){const t=i*Math.PI/28,z=az+Math.cos(t)*(p.r+.04);pts.push([a*(width(z)+.008),p.r+.014+Math.sin(t)*(p.r+.04),z]);}line(pts,p.pickup?.018:.010,p.pickup?0x293137:white,p.pickup?'fixed':'paint');
 }
 // A crowned roof joins the glazing through actual A/B/C pillars.
 patch(20,24,(u,v)=>{const z=p.rr+(p.rf-p.rr)*u,x=v*2-1;return[x*roofW,roof-.048*x*x+.018*Math.sin(u*Math.PI),z];},p.bus?cream:white,p.bus?'fixed':'paint');
 function glassEnd(front){const z=front?p.front:p.rear,tz=front?p.rf:p.rr,bw=width(z)*.94,tw=roofW*.97;
  const point=(u,t)=>{const x=u*2-1;return[x*(bw+(tw-bw)*t),Y+.035+(roof-.035-Y)*t-.028*x*x*t,z+(tz-z)*t+(front?1:-1)*.032*(1-x*x)*Math.sin(t*Math.PI)];};
  patch(20,10,point,glass,'glass');for(const u of[0,1])line(Array.from({length:11},(_,i)=>point(u,i/10)),p.bus?.022:.020,p.bus?cream:white,p.bus?'fixed':'paint');for(const t of[0,1])line(Array.from({length:21},(_,i)=>point(i/20,t)),.011,black);
  if(p.bus)line([point(.5,0),point(.5,1)],.018,cream);
 }
 glassEnd(true);glassEnd(false);
 const sideGlassPoint=(a,bz,tz,t)=>[a*(width(bz)*.962*(1-t)+roofW*t),Y+.035+(roof-.074-Y)*t,bz+(tz-bz)*t];
 for(const a of[-1,1]){
  const segments=p.bus?[[1.48,.81,1.30,.81],[.72,.10,.72,.10],[.01,-.67,.01,-.67],[-.76,-1.48,-.76,-1.35]]:[[p.front-.035,p.bp+.04,p.rf-.025,p.bp+.04],[p.bp-.04,p.rear+.045,p.bp-.04,p.rr+.045]];
  for(const [f,b,tf,tb]of segments){patch(14,8,(u,t)=>sideGlassPoint(a,f+(b-f)*u,tf+(tb-tf)*u,t),glass,'glass');for(const u of[0,1])line([sideGlassPoint(a,f+(b-f)*u,tf+(tb-tf)*u,0),sideGlassPoint(a,f+(b-f)*u,tf+(tb-tf)*u,1)],p.bus?.021:.013,p.bus?cream:black);}
  line([[a*width(p.front)*.963,Y+.025,p.front],[a*roofW,roof-.04,p.rf],[a*roofW,roof-.04,p.rr],[a*width(p.rear)*.963,Y+.025,p.rear]],p.bus?.028:.024,p.bus?cream:white,p.bus?'fixed':'paint');
  // Painted shoulder joins the metal body to the bottom of each window.
  patch(40,3,(u,v)=>{const z=p.rear+(p.front-p.rear)*u;return[a*width(z)*(1-.038*v),top(z)+.028*v,z];},p.bus?cream:white,p.bus?'fixed':'paint');
  if(p.bus){for(const z of[.77,.05,-.71])line([[a*W,Y+.01,z],[a*roofW,roof-.04,z]],.025,cream);line([[a*(W+.009),Y,-1.45],[a*(W+.009),Y,1.48]],.011,cream);}
  const sx=a*(W+.006),doorFront=p.front-.08,doorRear=p.doors===4?p.rear+.055:p.bp-.12;
  line([[sx,Y-.025,doorFront],[sx,low+.06,doorFront],[sx,low+.045,doorRear],[sx,Y-.025,doorRear]],.0035,0x35434a);
  if(p.doors===4)line([[sx,low+.05,p.bp],[sx,Y+.025,p.bp]],.0035,0x35434a);
  for(const z of p.doors===4?[p.bp+.14,p.rear+.16]:[doorRear+.12]){const handle=rb(p.classic?chrome:0x252e33,sx,Y-.072,z,.015,.026,.126,p.classic?'chrome':'fixed',.008);handle.rotation.y=0;}
  const mirrorZ=p.front-.15,mirrorY=Y+.13;
  line([[a*W,Y+.075,mirrorZ],[a*(W+.075),mirrorY,mirrorZ+.01]],.014,black);
  const m=rb(p.classic?chrome:white,a*(W+.093),mirrorY,mirrorZ,.16,.090,.098,p.classic?'chrome':'paint',.035);m.rotation.y=a*-.12;
  rb(0x9cb4bc,a*(W+.093),mirrorY,mirrorZ-.055,.122,.059,.005,'chrome',.020);
  // Character lines and protected lower sills follow the curved panels.
  const strip=[];for(let i=0;i<=32;i++){const z=-L+.15+(p.l-.30)*i/32;strip.push([a*(width(z)+.007),top(z)-.17,z]);}
  if(p.classic||['golf','uno','saveiro'].includes(key))line(strip,key==='golf'?.012:.008,key==='opala'||key==='chevette'?chrome:0x293337,key==='opala'||key==='chevette'?'chrome':'fixed');
 }
 const seatX=W*.43,seatY=p.pickup?.46:p.bus?.43:.34;
 for(const z of[p.seat,p.back])for(const a of[-1,1]){rb(0x272c30,a*seatX,seatY+.07,z,.36,.13,.37,'interior',.04);rb(0x343a3e,a*seatX,seatY+.29,z-.20,.35,.41,.10,'interior',.045);if(!p.classic)rb(0x20282e,a*seatX,seatY+.52,z-.22,.21,.12,.075,'interior',.025);}
 rb(0x202a2e,0,Y-.10,p.front-.08,p.w*.86,.15,.19,'interior',.025);ring(-seatX,Y-.005,p.front-.26,.100,black,-.45);
 for(const x of[-.31,.16])line([[x,Y+.044,p.front+.012],[x+.17,Y+.12,p.front-.08]],.006,black);
 if(p.pickup){const rear=-L+.04,front=p.rear-.035,d=front-rear;
  box(0x20282d,0,Y-.30,(rear+front)/2,p.w-.13,.07,d);for(let x=-W+.16;x<W-.08;x+=.12)box(0x353e44,x,Y-.254,(rear+front)/2,.018,.018,d-.07);
  for(const a of[-1,1]){rb(white,a*(W-.035),Y-.13,(rear+front)/2,.07,.28,d,'paint',.025);rb(black,a*(W-.035),Y+.018,(rear+front)/2,.088,.025,d+.025,'fixed',.01);rb(0x283137,a*(W-.18),Y-.19,p.ra,.22,.25,.67,'fixed',.065);}
  rb(white,0,Y-.13,-L+.025,p.w-.055,.28,.065,'paint',.02);rb(0x29343a,0,Y-.04,-L-.012,.23,.045,.016,'fixed',.012);
  if(key==='saveiro'){for(const a of[-1,1]){line([[a*(W-.09),Y+.02,p.rear-.12],[a*(W-.09),roof-.10,p.rear-.07],[a*(W-.09),roof-.10,p.rear-.28],[a*(W-.09),Y+.02,p.rear-.58]],.027,0x303a42);rb(0x263037,a*(W+.018),.29,-.02,.09,.085,1.63,'fixed',.02);}}
  if(['s10','hilux','amarok'].includes(key))for(const a of[-1,1])line([[a*(W+.047),.28,p.fa-.43],[a*(W+.047),.28,p.ra+.43]],.026,chrome,'chrome');
 }
 function badge(brand,y,z,r=.053){
  if(brand==='chevrolet'){const pts=[[-.093,-.019],[-.034,-.019],[-.034,-.04],[.034,-.04],[.034,-.019],[.093,-.019],[.093,.019],[.034,.019],[.034,.04],[-.034,.04],[-.034,.019],[-.093,.019]],q=new T.Shape();pts.forEach(([x,v],i)=>i?q.lineTo(x,y+v):q.moveTo(x,y+v));q.closePath();const g=new T.ExtrudeGeometry(q,{depth:.008,bevelEnabled:false});add(g,0xc5a04f,0,0,z,1,1,1,'chrome');return;}
  if(brand==='fiat'){rb(0x23588a,0,y,z,.135,.058,.012,'fixed',.006);for(let i=0;i<4;i++)line([[-.05+i*.031,y-.021,z+.009],[-.035+i*.031,y+.021,z+.009]],.004,chrome,'chrome');return;}
  const a=ring(0,y,z,r,chrome);a.scale.z=.50;
  if(brand==='toyota'){a.scale.set(1.40,.88,.50);const b=ring(0,y,z+.004,r*.65,chrome);b.scale.set(.51,1.12,.4);const c=ring(0,y+r*.21,z+.004,r*.60,chrome);c.scale.set(1.45,.47,.4);}
  else{line([[-r*.65,y+r*.46,z],[0,y-r*.08,z],[r*.65,y+r*.46,z]],.0055,chrome,'chrome');line([[-r*.65,y+r*.05,z],[-r*.37,y-r*.49,z],[0,y-r*.13,z],[r*.37,y-r*.49,z],[r*.65,y+r*.05,z]],.0055,chrome,'chrome');}
 }
 function plate(y,z,rear=false){rb(0xe2e5e3,0,y,z,.32,.108,.012,'fixed',.009);box(0x1c4d83,0,y+.040,z+(rear?-.008:.008),.30,.017,.003);for(let i=0;i<7;i++){const x=-.109+i*.035;box(0x223139,x,y-.010,z+(rear?-.009:.009),.014,.034,.002);}}
 const nose=L+.018,ly=Y-.087;
 // A curved bumper wraps into the fenders, rather than a rectangular block.
 function bumper(e,y,hh,c,k){const bw=W+.012,depth=.10;patch(36,12,(u,v)=>{const x=(u*2-1)*bw,angle=v*Math.PI*2,z=e*(L+.015+depth*.45*Math.cos(angle)-.10*(Math.abs(x)/bw)**6);return[x,y+hh/2*Math.sin(angle),z];},c,k);}
 for(const e of[-1,1]){
  if(p.classic){bumper(e,.35,.068,chrome,'chrome');for(const a of[-1,1])rb(black,a*W*.67,.35,e*(L+.069),.048,.083,.018,'fixed',.01);}
  else{bumper(e,p.pickup?.43:.34,p.pickup?.22:.20,white,'paint');bumper(e,p.pickup?.35:.255,.064,0x253038,'fixed');}
 }
 function roundLight(x,y,z,r){ell(black,x,y,z,r*1.12,r*1.12,.019);ell(chrome,x,y,z+.010,r*1.05,r*1.05,.015,'chrome');ell(0x90afbf,x,y,z+.027,r*.91,r*.91,.008,'lens');ring(x,y,z+.033,r*.96,chrome);for(const n of[-.45,0,.45])line([[x-r*.73,y+r*n,z+.040],[x+r*.73,y+r*n,z+.040]],.0025,0xa0bdc6,'chrome');}
 function cluster(a,wid,ht,kind){
  const x=a*(W-wid*.55-.045),y=ly,z=nose+.018;
  const outlines={golf:[[-.50,-.27],[-.28,-.49],[.28,-.48],[.50,-.20],[.49,.26],[.25,.49],[-.40,.44]],hilux:[[-.48,-.34],[.33,-.45],[.51,-.05],[.45,.52],[-.44,.29]],saveiro:[[-.50,-.20],[.30,-.44],[.52,-.04],[.46,.48],[-.46,.20]]},pts=outlines[kind]||[[-.50,-.43],[.48,-.43],[.50,.43],[-.50,.43]],shape=new T.Shape();pts.forEach(([u,v],i)=>i?shape.lineTo(a*u*wid,v*ht):shape.moveTo(a*u*wid,v*ht));shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:true,bevelSize:.007,bevelThickness:.007,bevelSegments:3,curveSegments:4});add(g,0x2e3d48,x,y,z,1,1,1,'fixed');
  if(kind==='s10'||kind==='gol'||kind==='uno'){rb(0xc1d4dd,x-a*.025,y+.010,z+.032,wid*.72,ht*.65,.012,'lens',.02);rb(0xc9a15d,x+a*wid*.41,y-.003,z+.035,wid*.13,ht*.76,.013,'lens',.009);for(let n=0;n<4;n++)box(0x8fa8b5,x-wid*.24+n*wid*.14,y+.009,z+.04,.006,ht*.54,.002);}
  else{for(let i=0;i<2;i++){const px=x+a*(i?-.085:.077),rr=ht*(i?.34:.28);ell(chrome,px,y,z+.029,rr*1.05,rr*1.05,.008,'chrome');ell(0x9abac7,px,y,z+.039,rr*.80,rr*.80,.006,'lens');ring(px,y,z+.043,rr*.94,chrome);}rb(0xc9a15d,x+a*wid*.40,y-.004,z+.036,.024,ht*.64,.008,'lens',.007);}
  add(g.clone(),0xc1d7e4,x,y,z+.044,1,1,1,'lampglass');
 }
 if(p.bus){
  // Classic split-screen Kombi: V front panel and round lamps.
  patch(28,12,(u,v)=>{const x=(u*2-1)*width(L),edge=.64+.27*(Math.abs(x)/W)**.85;return[x,edge+(Y-edge)*v,L+.006];},cream,'fixed');
  for(const a of[-1,1]){roundLight(a*.49,.62,L+.025,.111);rb(0xd7a24d,a*.56,.84,L+.027,.112,.047,.02,'lens',.013);rb(0xb53335,a*.59,.58,-L-.019,.09,.23,.017,'lens',.025);}
  badge('vw',.78,L+.045,.108);plate(.40,L+.081);plate(.41,-L-.081,true);
 }else if(key==='opala'||key==='chevette'){
  rb(black,0,ly,nose,p.w*.88,.21,.018,'fixed',.018);for(let j=0;j<6;j++)rb(chrome,0,ly-.079+j*.031,nose+.016,p.w*.84,.007,.009,'chrome',.002);
  for(const a of[-1,1]){roundLight(a*W*.73,ly,nose+.017,key==='opala'?.110:.101);rb(0xd9a261,a*W*.72,.45,nose+.02,.20,.055,.017,'lens',.015);}
  badge('chevrolet',ly,nose+.047);
  if(key==='opala'){
   for(const a of[-1,1])for(const x of[.32,.56]){ell(black,a*x,Y-.08,-L-.018,.094,.094,.014);ell(0x9a272a,a*x,Y-.08,-L-.033,.081,.081,.012,'lens');const bezel=ring(a*x,Y-.08,-L-.047,.089,chrome);bezel.rotation.y=Math.PI;}
   for(const x of[-.285,.285])patch(30,2,(u,v)=>{const z=p.front+.022+(L-p.front-.08)*u,xx=x-.08+v*.16;return[xx,top(z)+p.crown*(1-(xx/width(z))**2)+.003,z];},0x192126,'fixed');
   for(const a of[-1,1])line([[a*(W+.010),Y-.06,-L+.10],[a*(W+.010),Y-.06,p.front-.12]],.025,black);
  }else for(const a of[-1,1])rb(0xa8292b,a*W*.67,Y-.10,-L-.022,.23,.126,.018,'lens',.035);
  plate(.39,nose+.069);plate(.40,-L-.069,true);
 }else{
  const grilleW=key==='golf'?.43:key==='gol'||key==='uno'?.44:key==='saveiro'?.53:key==='s10'?.78:.69,grilleH=p.pickup?.22:.135;
  rb(black,0,ly,nose,grilleW,grilleH,.018,'fixed',.021);
  for(let i=0;i<(key==='hilux'?3:2);i++){const yy=ly-grilleH*.32+i*grilleH*.63/(key==='hilux'?2:1);rb(key==='uno'?0x53666c:chrome,0,yy,nose+.018,grilleW-.03,key==='hilux'?.024:.014,.010,'chrome',.005);}
  if(key==='s10')rb(chrome,0,ly,nose+.018,p.w*.94,.033,.013,'chrome',.008);
  const brand=key==='s10'?'chevrolet':key==='hilux'?'toyota':key==='uno'?'fiat':'vw';badge(brand,ly,nose+.036,key==='hilux'?.062:.051);
  for(const a of[-1,1])cluster(a,key==='golf'?.37:key==='uno'?.36:key==='gol'?.35:key==='saveiro'?.35:.38,key==='golf'?.18:key==='hilux'?.205:key==='gol'||key==='uno'?.14:.18,key);
  const intakeY=p.pickup?.40:.31,intakeW=key==='golf'?.82:key==='uno'?.65:.79;
  rb(black,0,intakeY,nose+.052,intakeW,p.pickup?.105:.083,.018,'fixed',.025);
  for(let j=0;j<2;j++)box(0x46525b,0,intakeY-.021+j*.043,nose+.064,intakeW-.04,.006,.003);
  if(p.pickup||key==='golf')for(const a of[-1,1]){rb(0x23313b,a*W*.73,intakeY,nose+.045,.17,.104,.019,'fixed',.032);if(p.pickup)roundLight(a*W*.73,intakeY,nose+.061,.034);}
  for(const a of[-1,1]){
   const ww=p.pickup?.108:key==='uno'?.115:key==='golf'?.17:key==='gol'?.27:.21,hh=p.pickup?.29:key==='uno'?.30:key==='golf'?.25:key==='gol'?.14:.19,y=p.pickup?Y-.13:key==='uno'||key==='golf'?Y-.04:Y-.10,z=-L-.019;
   rb(0x4d242c,a*(W-ww*.65-.018),y,z,ww,hh,.027,'fixed',.035);rb(0x9d2932,a*(W-ww*.65-.018),y+.012,z-.017,ww*.87,hh*.78,.010,'lens',.026);rb(0xc3beb6,a*(W-ww*.65-.018),y-.020,z-.025,ww*.86,hh*.17,.008,'lens',.005);if(key==='golf')rb(0x9d2932,a*(W-.013),y,-L+.075,.018,hh*.90,.14,'lens',.018);
  }
  plate(p.pickup?.47:.44,nose+.074);plate(p.pickup?.47:.42,-L-.069,true);
 }
 // Bonnet seams and a rear hatch line make each surface read as coachwork.
 for(const a of[-1,1]){const pts=[];for(let i=0;i<=24;i++){const z=p.front+.03+(L-p.front-.10)*i/24,x=a*width(z)*.77;pts.push([x,top(z)+p.crown*(1-.77**2)+.0015,z]);}line(pts,.0025,0x40515a);}
 for(const[i,x,z]of[[0,-W*.91,p.fa],[1,W*.91,p.fa],[2,-W*.91,p.ra],[3,W*.91,p.ra]])wheel(i,x,z,p.r);
 Object.assign(root.userData,{coachwork:'curved-panels-v2',seats:[{x:-seatX,y:seatY-.05,z:p.seat+.02},{x:seatX,y:seatY-.05,z:p.seat+.02},{x:-seatX,y:seatY-.05,z:p.back+.02},{x:seatX,y:seatY-.05,z:p.back+.02}],seatScale:p.bus?.38:p.pickup?.34:.32,roof:roof+.025,hoodY:Y+p.crown,wheelRadius:p.r,front:L+.09,rear:-L-.09,pickup:!!p.pickup});
 return true;
}
(typeof window!=='undefined'?window:globalThis).OTBrazilCoachwork={build,specs};
})();

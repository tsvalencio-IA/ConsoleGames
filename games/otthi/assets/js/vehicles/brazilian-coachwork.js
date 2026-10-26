/* Authored automotive surfaces. +Z forward; the existing vehicle simulation,
 * wheel pivots and family seats remain the integration contract. */
// @otthi-module-body
(()=>{'use strict';
const specs={
 veraneio:{l:4.55,w:1.68,h:1.57,b:.94,r:.316,fa:1.28,ra:-1.34,front:.91,rf:.57,rr:-1.77,rear:-2.14,bp:-.12,seat:.27,back:-.65,doors:4,crown:.048,nose:.09,classic:true,wagon:true},
 blazer:{l:3.70,w:1.50,h:1.42,b:.90,r:.303,fa:1.16,ra:-1.14,front:.67,rf:.26,rr:-1.40,rear:-1.73,bp:-.26,seat:.20,back:-.61,doors:4,crown:.055,nose:.11,wagon:true},
 pampa:{l:3.56,w:1.34,h:1.16,b:.75,r:.260,fa:1.08,ra:-1.09,front:.69,rf:.23,rr:-.40,rear:-.55,bp:-.30,seat:.06,back:-.32,doors:2,crown:.028,nose:.055,pickup:true,twoSeats:true},
 escort:{l:3.27,w:1.37,h:1.16,b:.74,r:.265,fa:1.01,ra:-1.01,front:.60,rf:.19,rr:-.79,rear:-1.45,bp:-.27,seat:.02,back:-.64,doors:2,crown:.024,nose:.08},
 tcross:{l:3.36,w:1.45,h:1.33,b:.89,r:.290,fa:1.09,ra:-1.08,front:.66,rf:.20,rr:-1.11,rear:-1.50,bp:-.27,seat:.18,back:-.61,doors:4,crown:.039,nose:.075,wagon:true},
 peugeot206:{l:3.08,w:1.34,h:1.18,b:.74,r:.258,fa:.99,ra:-1.00,front:.68,rf:.06,rr:-.91,rear:-1.29,bp:-.29,seat:.03,back:-.63,doors:4,crown:.074,nose:.22},
 jetta:{l:3.72,w:1.43,h:1.19,b:.77,r:.279,fa:1.10,ra:-1.11,front:.72,rf:.23,rr:-.79,rear:-1.26,bp:-.28,seat:.04,back:-.66,doors:4,crown:.029,nose:.065},
 corolla2007:{l:3.62,w:1.36,h:1.20,b:.77,r:.268,fa:1.06,ra:-1.06,front:.67,rf:.16,rr:-.73,rear:-1.22,bp:-.28,seat:.04,back:-.65,doors:4,crown:.063,nose:.15},
 corolla2021:{l:3.70,w:1.43,h:1.16,b:.74,r:.279,fa:1.11,ra:-1.11,front:.74,rf:.21,rr:-.81,rear:-1.31,bp:-.30,seat:.03,back:-.66,doors:4,crown:.038,nose:.12},
 civic2011:{l:3.64,w:1.42,h:1.15,b:.73,r:.277,fa:1.12,ra:-1.12,front:.89,rf:-.02,rr:-.76,rear:-1.20,bp:-.36,seat:.02,back:-.65,doors:4,crown:.056,nose:.18},
 bmwx1:{l:3.59,w:1.51,h:1.33,b:.87,r:.294,fa:1.12,ra:-1.12,front:.72,rf:.24,rr:-1.19,rear:-1.57,bp:-.27,seat:.16,back:-.61,doors:4,crown:.052,nose:.08,wagon:true},
 bmwm3:{l:3.74,w:1.52,h:1.15,b:.74,r:.289,fa:1.13,ra:-1.12,front:.73,rf:.22,rr:-.72,rear:-1.25,bp:-.28,seat:.03,back:-.65,doors:4,crown:.041,nose:.10},
 ferrari458:{l:3.62,w:1.59,h:1.00,b:.60,r:.296,fa:1.14,ra:-1.14,front:1.02,rf:.37,rr:-.48,rear:-.98,bp:-.37,seat:-.05,back:-.50,doors:2,crown:.069,nose:.18,midEngine:true,sports:true,twoSeats:true},
 porsche911:{l:3.61,w:1.48,h:1.04,b:.65,r:.288,fa:1.09,ra:-1.04,front:.91,rf:.27,rr:-.60,rear:-1.22,bp:-.30,seat:-.03,back:-.70,doors:2,crown:.081,nose:.23,sports:true},

 golf7:{l:3.49,w:1.475,h:1.19,b:.72,r:.284,fa:1.08,ra:-1.08,front:.63,rf:.16,rr:-1.08,rear:-1.55,bp:-.30,seat:.04,back:-.65,doors:4,crown:.032,nose:.09},
 palio:{l:3.14,w:1.34,h:1.18,b:.75,r:.258,fa:.98,ra:-.98,front:.55,rf:.13,rr:-.96,rear:-1.38,bp:-.30,seat:.03,back:-.63,doors:4,crown:.055,nose:.17},
 passat:{l:3.54,w:1.34,h:1.12,b:.70,r:.260,fa:1.04,ra:-1.04,front:.62,rf:.18,rr:-.69,rear:-1.60,bp:-.33,seat:.01,back:-.65,doors:2,crown:.015,nose:.045,classic:true},
 tempra:{l:3.49,w:1.36,h:1.16,b:.76,r:.267,fa:1.04,ra:-1.04,front:.66,rf:.18,rr:-.70,rear:-1.20,bp:-.28,seat:.04,back:-.65,doors:4,crown:.018,nose:.06},
 maverick:{l:3.68,w:1.44,h:1.13,b:.69,r:.282,fa:1.12,ra:-1.10,front:.65,rf:.16,rr:-.58,rear:-1.09,bp:-.36,seat:.01,back:-.65,doors:2,crown:.066,nose:.08,classic:true},
 landau:{l:4.33,w:1.59,h:1.16,b:.75,r:.291,fa:1.28,ra:-1.28,front:.91,rf:.36,rr:-.69,rear:-1.27,bp:-.20,seat:.15,back:-.64,doors:4,crown:.019,nose:.022,classic:true,vinyl:true},
 gol:{l:3.12,w:1.34,h:1.17,b:.68,r:.257,fa:.98,ra:-.99,front:.55,rf:.19,rr:-.81,rear:-1.34,bp:-.27,seat:.01,back:-.63,classic:true,doors:2,crown:.025,nose:.055},
 uno:{l:3.05,w:1.32,h:1.25,b:.74,r:.255,fa:.94,ra:-.98,front:.53,rf:.22,rr:-1.12,rear:-1.40,bp:-.30,seat:.01,back:-.64,doors:2,crown:.034,nose:.055},
 golf:{l:3.34,w:1.43,h:1.22,b:.73,r:.276,fa:1.03,ra:-1.02,front:.58,rf:.16,rr:-1.10,rear:-1.61,bp:-.28,seat:.01,back:-.65,doors:4,crown:.057,nose:.12},
 opala:{l:3.87,w:1.51,h:1.18,b:.71,r:.282,fa:1.15,ra:-1.15,front:.66,rf:.16,rr:-.66,rear:-1.30,bp:-.40,seat:.01,back:-.65,classic:true,doors:2,crown:.047,nose:.07},
 chevette:{l:3.26,w:1.33,h:1.15,b:.71,r:.258,fa:.98,ra:-.98,front:.54,rf:.13,rr:-.64,rear:-1.08,bp:-.31,seat:0,back:-.59,classic:true,doors:2,crown:.052,nose:.12},
 s10:{l:3.94,w:1.55,h:1.39,b:.90,r:.316,fa:1.22,ra:-1.21,front:.71,rf:.26,rr:-.62,rear:-.77,bp:-.25,seat:.16,back:-.43,doors:4,pickup:true,crown:.047,nose:.12},
 hilux:{l:3.94,w:1.59,h:1.45,b:.94,r:.329,fa:1.20,ra:-1.18,front:.74,rf:.28,rr:-.61,rear:-.79,bp:-.25,seat:.19,back:-.42,doors:4,pickup:true,crown:.074,nose:.15},
 amarok:{l:3.94,w:1.65,h:1.43,b:.96,r:.330,fa:1.19,ra:-1.19,front:.76,rf:.30,rr:-.62,rear:-.80,bp:-.26,seat:.20,back:-.43,doors:4,pickup:true,crown:.044,nose:.09},
 saveiro:{l:3.53,w:1.43,h:1.26,b:.78,r:.275,fa:1.08,ra:-1.08,front:.61,rf:.19,rr:-.61,rear:-.78,bp:-.25,seat:.06,back:-.43,doors:4,pickup:true,crown:.052,nose:.14},
 kombi:{l:3.46,w:1.42,h:1.60,b:.91,r:.269,fa:1.08,ra:-1.11,front:1.59,rf:1.36,rr:-1.43,rear:-1.63,bp:.77,seat:.82,back:-.35,classic:true,bus:true,doors:3,crown:.04,nose:.15}
};
function build(T,key,h){
 const p=specs[key];if(!p)return false;
 if(key==='porsche911')return build911(T,h);
 if((key==='palio'||key==='tcross')&&globalThis.OTBrazilPrecision)return globalThis.OTBrazilPrecision.build(T,key,h);
 const {root,add,box,ell,tube,ring,wheel,quad}=h,W=p.w/2,L=p.l/2,white=0xffffff,black=0x11191e,chrome=0xbac5ce,cream=0xe9e6d9,glass=0x527b8a;
 const Y=p.b,roof=p.h,roofW=W*(p.bus?.96:['palio','peugeot206','civic2011'].includes(key)?.79:['golf','golf7','corolla2007','corolla2021','bmwx1','bmwm3','porsche911','ferrari458'].includes(key)?.82:p.pickup?.86:.87),low=p.pickup?.33:.24;
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
 const sidePoint=(a,z,t)=>{const bulge=(p.pickup?.021:.010)*(Math.exp(-(((z-p.fa)/.37)**2))+Math.exp(-(((z-p.ra)/.37)**2)));return[a*(width(z)-(!p.classic?.070:.035)*(1-t)**2+(!p.classic?.035:0)*Math.sin(Math.PI*t)+bulge*Math.sin(Math.PI*t)),bottom(z)+(top(z)-bottom(z))*t,z];};
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
 patch(20,24,(u,v)=>{const z=p.rr+(p.rf-p.rr)*u,x=v*2-1;return[x*roofW,roof-(p.classic?.048:.090)*x*x-(p.classic?0:.025)*(u*2-1)**2+.023*Math.sin(u*Math.PI),z];},p.vinyl?0x202326:p.bus?cream:white,p.vinyl||p.bus?'fixed':'paint');
 function glassEnd(front){const z=front?p.front:p.rear,tz=front?p.rf:p.rr,bw=width(z)*.94,tw=roofW*.97;
  const point=(u,t)=>{const x=u*2-1;return[x*(bw+(tw-bw)*t),Y+.035+(roof-(p.classic?.035:.025)-Y)*t-(p.classic?.028:.090)*x*x*t,z+(tz-z)*t+(front?1:-1)*.032*(1-x*x)*Math.sin(t*Math.PI)];};
  patch(20,10,point,glass,'glass');for(const u of[0,1])line(Array.from({length:11},(_,i)=>point(u,i/10)),p.bus?.022:.020,p.bus?cream:white,p.bus?'fixed':'paint');for(const t of[0,1])line(Array.from({length:21},(_,i)=>point(i/20,t)),.011,black);
  if(p.bus)line([point(.5,0),point(.5,1)],.018,cream);
 }
 glassEnd(true);glassEnd(false);
 const sideGlassPoint=(a,bz,tz,t)=>[a*(width(bz)*.962*(1-t)+roofW*t),Y+.035+(roof-(p.classic?.074:.115)-Y)*t,bz+(tz-bz)*t];
 for(const a of[-1,1]){
  const segments=p.wagon?[[p.front-.035,p.bp+.04,p.rf-.025,p.bp+.04],[p.bp-.04,p.rr+.30,p.bp-.04,p.rr+.20],[p.rr+.20,p.rear+.045,p.rr+.12,p.rr+.045]]:p.bus?[[1.48,.81,1.30,.81],[.72,.10,.72,.10],[.01,-.67,.01,-.67],[-.76,-1.48,-.76,-1.35]]:[[p.front-.035,p.bp+.04,p.rf-.025,p.bp+.04],[p.bp-.04,p.rear+.045,p.bp-.04,p.rr+.045]];
  for(const [f,b,tf,tb]of segments){patch(14,8,(u,t)=>sideGlassPoint(a,f+(b-f)*u,tf+(tb-tf)*u,t),glass,'glass');for(const u of[0,1])line([sideGlassPoint(a,f+(b-f)*u,tf+(tb-tf)*u,0),sideGlassPoint(a,f+(b-f)*u,tf+(tb-tf)*u,1)],p.bus?.021:.013,p.bus?cream:black);}
  line([[a*width(p.front)*.963,Y+.025,p.front],[a*roofW,roof-(p.classic?.04:.115),p.rf],[a*roofW,roof-(p.classic?.04:.115),p.rr],[a*width(p.rear)*.963,Y+.025,p.rear]],p.bus?.028:.024,p.bus?cream:white,p.bus?'fixed':'paint');
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
 for(const z of(p.twoSeats?[p.seat]:[p.seat,p.back]))for(const a of[-1,1]){rb(0x272c30,a*seatX,seatY+.07,z,.36,.13,.37,'interior',.04);rb(0x343a3e,a*seatX,seatY+.29,z-.20,.35,.41,.10,'interior',.045);if(!p.classic)rb(0x20282e,a*seatX,seatY+.52,z-.22,.21,.12,.075,'interior',.025);}
 rb(0x202a2e,0,Y-.10,p.front-.08,p.w*.86,.15,.19,'interior',.025);ring(seatX,Y-.005,p.front-.26,.100,black,-.45);
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
 // Lamp centres follow the actual curved bonnet at the nose. The old Y-.087
 // placed lenses above the falling bonnet, making them float outside the body.
 const nose=L+.018,ly=top(L)+p.crown*.5-(key==='opala'||key==='chevette'||key==='maverick'?.105:.080);
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
 function lettering(text,x,y,z,w=.25,hh=.06,angle=0,color='#d6dbdd'){
  if(typeof document==='undefined')return;const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const c=canvas.getContext('2d');c.clearRect(0,0,512,96);c.font='700 70px Arial';c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(text,256,50,500);const texture=new T.CanvasTexture(canvas);texture.encoding=T.sRGBEncoding;const mesh=new T.Mesh(new T.PlaneGeometry(w,hh),new T.MeshStandardMaterial({map:texture,transparent:true,alphaTest:.15,side:T.DoubleSide,roughness:.35,metalness:.5,depthWrite:false}));mesh.name='badge-'+text;mesh.position.set(x,y,z);mesh.rotation.y=angle;root.add(mesh);
 }
 const additions=['golf7','palio','passat','tempra','maverick','landau'];
 const moreCars=['veraneio','blazer','pampa','escort','tcross','peugeot206','jetta','corolla2007','corolla2021','civic2011','bmwx1','bmwm3','ferrari458','porsche911'];
 if(moreCars.includes(key)){
  function polyLamp(a,x,y,z,ww,hh,points){const q=new T.Shape();points.forEach(([u,v],i)=>i?q.lineTo(a*u*ww,v*hh):q.moveTo(a*u*ww,v*hh));q.closePath();const geo=new T.ExtrudeGeometry(q,{depth:.014,bevelEnabled:true,bevelSize:.005,bevelThickness:.004,bevelSegments:2});add(geo,black,a*x,y,z,1,1,1,'fixed');add(geo.clone(),0xb5c9d5,a*x,y,z+.021,.91,.87,1,'lampglass');return{geo,x:a*x,y,z:z+.026};}
  function ford(y,z){const oval=ring(0,y,z,.058,chrome);oval.scale.set(1.7,.72,.35);ell(0x214a7a,0,y,z+.008,.088,.038,.006,'lens');lettering('Ford',0,y,z+.020,.12,.041);}
  function bmw(y,z){ell(chrome,0,y,z,.043,.043,.007,'chrome');ell(black,0,y,z+.010,.036,.036,.005);const points=[[-.020,.02],[0,.02],[0,0],[-.020,0]];for(const flip of[-1,1])quad(points.map(([x,v])=>[flip*x,y+flip*v,z+.018]),0x2c7cb4,'lens');}
  const rect=[[-.50,-.45],[.50,-.45],[.50,.45],[-.50,.45]],swept=[[-.50,-.29],[.30,-.48],[.50,-.18],[.42,.42],[-.36,.47]];
  const isBMW=key==='bmwx1'||key==='bmwm3',isToyota=key.startsWith('corolla');
  if(p.sports){
   if(key==='porsche911'){
    for(const a of[-1,1]){const x=a*W*.76,y=Y+.07,z=nose-.10;ell(black,x,y,z,.122,.143,.030);ell(chrome,x,y,z+.017,.109,.129,.019,'chrome');ell(0x93b1c0,x,y,z+.036,.094,.113,.009,'lens');ring(x,y,z+.044,.076,chrome);roundedNose(a);}
    function roundedNose(a){rb(black,a*.48,.33,nose+.036,.33,.10,.025,'fixed',.035);line([[a*.30,.52,nose+.045],[a*.61,.50,nose+.035]],.007,0xd5e0e0,'chrome');}
    rb(black,0,Y-.025,-L-.026,p.w*.91,.045,.016,'fixed',.009);line([[-W*.88,Y-.018,-L-.041],[W*.88,Y-.018,-L-.041]],.008,0xbf3340,'lens');for(let j=0;j<13;j++){const x=-.39+j*.065;line([[x,Y+.04,-L+.17],[x,Y+.085,-L+.48]],.007,black);}lettering('PORSCHE',0,Y-.11,-L-.04,.61,.05,Math.PI);for(const a of[-1,1])cylinderExit(a*.48,.25,-L-.05,.042);
   }else{
    for(const a of[-1,1]){patch(22,8,(u,v)=>{const z=L-.10-u*.52,x=a*(W*.81-u*.055+(v-.5)*.13);return[x,top(z)+p.crown*(1-(x/width(z))**2)+.013,z];},black,'fixed');for(let j=0;j<7;j++){const z=L-.16-j*.061,x=a*(W*.80-j*.006);ell(0xd3e2e5,x,top(z)+.022,z,.017,.009,.014,'lens');}rb(black,a*.50,.29,nose+.03,.40,.13,.018,'fixed',.035);ell(black,a*.58,Y+.03,-L-.03,.093,.093,.02);ell(0xb12e3a,a*.58,Y+.03,-L-.048,.075,.075,.012,'lens');quad([[a*(W+.01),.34,-.78],[a*(W+.01),.53,-.66],[a*(W+.01),.59,-.20],[a*(W+.01),.32,-.32]],black);}
    patch(18,14,(u,v)=>{const z=-L+.16+u*.62,x=(v*2-1)*.43;return[x,Y+.067,z];},0x2d4c58,'glass');for(const x of[-.23,0,.23])box(0x303d43,x,Y+.01,-L+.43,.045,.06,.49,'interior');rb(black,0,.34,-L-.04,p.w*.89,.16,.045,'fixed',.026);for(const x of[-.11,0,.11])cylinderExit(x,.27,-L-.075,.038);lettering('FERRARI',0,Y+.08,-L-.055,.40,.045,Math.PI);
   }
   function cylinderExit(x,y,z,r){const m=add(new T.CylinderGeometry(r,r,.10,20),chrome,x,y,z,1,1,1,'chrome');m.rotation.x=Math.PI/2;ell(black,x,y,z-.052,r*.75,r*.75,.004);}
   rb(black,0,.23,nose+.055,p.w*.94,.034,.12,'fixed',.02);plate(.36,nose+.078);plate(.44,-L-.074,true);
  }else{
   const head={veraneio:[.55,.26,.23,rect],blazer:[.53,.31,.20,rect],pampa:[.47,.30,.14,rect],escort:[.46,.32,.14,swept],tcross:[.50,.36,.14,rect],peugeot206:[.48,.35,.25,swept],jetta:[.49,.36,.14,swept],corolla2007:[.46,.36,.19,swept],corolla2021:[.51,.38,.105,swept],civic2011:[.49,.39,.13,swept],bmwx1:[.53,.35,.16,swept],bmwm3:[.54,.36,.14,swept]}[key];
   if(key==='veraneio'){rb(black,0,ly,nose,p.w*.94,.27,.028,'fixed',.035);for(const a of[-1,1])for(const xx of[.49,.70])roundLight(a*xx,ly,nose+.023,.092);for(let j=0;j<7;j++)box(chrome,0,ly-.10+j*.032,nose+.032,.73,.009,.013,'chrome');badge('chevrolet',ly,nose+.055);}
   else{
    const gx=isBMW?.16:0,gw=isBMW?(key==='bmwx1'?.25:.23):key==='corolla2021'?.36:key==='peugeot206'?.25:.48,gh=isBMW?.18:key==='tcross'?.15:.13;
    for(const a of(isBMW?[-1,1]:[0])){rb(chrome,a*gx,ly,nose+.021,gw+.02,gh+.02,.018,'chrome',isBMW?.04:.015);rb(black,a*gx,ly,nose+.037,gw,gh,.011,'fixed',isBMW?.03:.012);if(isBMW)for(let n=0;n<7;n++)box(0x56666d,a*gx-gw*.37+n*gw*.12,ly,nose+.048,.006,gh*.88,.005);else for(let n=0;n<2;n++)box(chrome,0,ly-.035+n*.065,nose+.048,gw*.95,.009,.006,'chrome');}
    if(key==='pampa'||key==='escort')ford(ly,nose+.068);else if(key==='blazer')badge('chevrolet',ly,nose+.065);else if(isBMW)bmw(Y+.04,nose-.04);else if(isToyota)badge('toyota',ly,nose+.062,.044);else if(key==='civic2011'){for(const a of[-1,1])line([[a*.033,ly+.038,nose+.063],[a*.025,ly-.038,nose+.063]],.006,chrome,'chrome');line([[-.029,ly,nose+.063],[.029,ly,nose+.063]],.006,chrome,'chrome');}else if(key==='peugeot206')lettering('PEUGEOT',0,Y+.031,nose+.052,.23,.035);else badge('vw',ly,nose+.065,.045);
    for(const a of[-1,1]){
     if(key==='peugeot206'){
      // The 206's cat-eye lamps run back into the front wings.
      for(const[kind,c,offset]of[['fixed',black,.008],['lens',0xa8c1cc,.015]])patch(24,8,(u,v)=>{const z=L-.035-u*.39,x=a*(.40+u*.18+(v-.5)*(.25-.11*u)),y=top(z)+p.crown*(1-(x/width(z))**2)+offset;return[x,y,z];},c,kind);
      line([[a*.42,.70,L-.10],[a*.57,.75,L-.36]],.010,0xc9d9df,'chrome');
     }else{const d=polyLamp(a,head[0],ly,nose+.031,head[1],head[2],head[3]);
      if(['corolla2021','civic2011','tcross','jetta'].includes(key)){rb(0x738e9a,d.x,d.y,d.z+.010,head[1]*.83,head[2]*.49,.006,'lens',.009);line([[a*.33,ly-.035,nose+.069],[a*.63,ly-.025,nose+.069]],.006,0xd1e0df,'chrome');}
      else for(const dx of[-.072,.068]){const rr=head[2]*(isBMW?.29:.27);ell(chrome,d.x+a*dx,d.y,d.z+.007,rr,rr,.006,'chrome');ell(0x829fae,d.x+a*dx,d.y,d.z+.014,rr*.73,rr*.73,.004,'lens');if(isBMW)ring(d.x+a*dx,d.y,d.z+.020,rr*.91,0xc5dae1);}
     }
    }
   }
   const lowerH=key==='corolla2021'?.24:key==='peugeot206'?.18:.10,lowerW=key==='corolla2021'?1.0:key==='civic2011'?.89:.71;rb(black,0,key==='corolla2021'?.36:.30,nose+.041,lowerW,lowerH,.026,'fixed',.030);for(let j=0;j<3;j++)box(0x40505a,0,.27+j*.034,nose+.061,lowerW*.92,.008,.005);
   for(const a of[-1,1]){if(key!=='pampa'){rb(black,a*W*.73,.31,nose+.049,.18,.11,.018,'fixed',.028);roundLight(a*W*.73,.31,nose+.069,key==='escort'?.037:.027);}
    const ww=p.wagon?.14:key==='peugeot206'?.17:key==='corolla2007'?.25:.29,hh=p.wagon?.32:key==='peugeot206'?.26:key==='civic2011'?.19:.17,x=a*(W-ww*.58-.03),y=p.wagon?Y+.02:Y-.06;
    rb(black,x,y,-L-.024,ww+.02,hh+.02,.025,'fixed',.035);rb(0xa72d39,x,y+.01,-L-.043,ww,hh*.83,.010,'lens',.028);rb(0xbcc9ca,x,y-.025,-L-.052,ww*.88,hh*.17,.009,'lens',.005);
    if(['jetta','corolla2021','bmwm3','civic2011'].includes(key)){const lx=x-a*(ww*.75);rb(0x9a2a35,lx,y+.01,-L-.04,ww*.54,hh*.51,.010,'lens',.01);}
   }
   if(key==='tcross'){rb(black,0,Y-.02,-L-.028,p.w*.92,.10,.020,'fixed',.012);line([[-W*.88,Y-.035,-L-.045],[W*.88,Y-.035,-L-.045]],.007,0xb83543,'lens');}
   if(p.wagon)for(const a of[-1,1]){line([[a*W*.72,roof+.045,p.rf-.10],[a*W*.72,roof+.045,p.rr+.07]],.013,0x3a4b55);for(const z of[p.rf-.15,p.rr+.10])line([[a*W*.72,roof-.005,z],[a*W*.72,roof+.045,z]],.013,0x3a4b55);}
   if(key==='escort'){rb(black,0,Y+.11,-L+.09,p.w*.95,.045,.20,'fixed',.018);for(const a of[-1,1])line([[a*(W+.01),.36,-L+.13],[a*(W+.01),.36,L-.13]],.035,black);}
   if(key==='bmwm3'){ell(white,0,Y+.027,1.06,.34,.035,.46,'paint');for(const a of[-1,1])for(const dx of[-.055,.055]){const tail=add(new T.CylinderGeometry(.031,.031,.09,16),chrome,a*.49+dx,.25,-L-.08,1,1,1,'chrome');tail.rotation.x=Math.PI/2;}}
   lettering(({veraneio:'VERANEIO',blazer:'BLAZER',pampa:'PAMPA',escort:'ESCORT XR3',tcross:'T-CROSS',peugeot206:'206',jetta:'JETTA',corolla2007:'COROLLA',corolla2021:'COROLLA',civic2011:'CIVIC',bmwx1:'X1',bmwm3:'M3'})[key],.34,Y+.10,-L-.044,.39,.050,Math.PI);
   plate(.40,nose+.076);plate(.41,-L-.076,true);
  }
 }else
 if(additions.includes(key)){
  const modern=key==='golf7'||key==='palio',fiat=key==='palio'||key==='tempra';
  const roundFiat=(y,z)=>{const b=ring(0,y,z,.050,chrome);ell(0x9a2834,0,y,z+.007,.043,.043,.007,'lens');lettering('FIAT',0,y,z+.019,.067,.025);};
  if(key==='maverick'){
   rb(black,0,ly,nose,p.w*.88,.205,.023,'fixed',.025);for(let j=0;j<5;j++)box(0x394149,0,ly-.075+j*.036,nose+.022,p.w*.86,.008,.012);
   for(const a of[-1,1]){roundLight(a*W*.74,ly,nose+.022,.116);roundLight(a*.205,ly,nose+.038,.071);rb(0xcb963b,a*W*.72,.45,nose+.034,.17,.05,.019,'lens',.015);}
   patch(28,18,(u,v)=>{const z=p.front+.02+(L-p.front-.06)*u,x=(v*2-1)*W*.74;return[x,top(z)+p.crown*(1-(x/width(z))**2)+.003,z];},black,'fixed');
   for(const a of[-1,1]){rb(black,a*W*.71,Y-.08,-L-.024,.31,.145,.019,'fixed',.035);rb(0xa52e32,a*W*.71,Y-.08,-L-.04,.275,.103,.012,'lens',.023);line([[a*(W+.012),Y-.105,-L+.12],[a*(W+.012),Y-.105,p.front-.10]],.031,black);lettering('GT',a*(W+.020),Y-.10,-.82,.14,.07,a*Math.PI/2);}
   lettering('MAVERICK',0,Y+.025,-L-.035,.43,.052,Math.PI);plate(.39,nose+.07);plate(.40,-L-.07,true);
  }else if(key==='landau'){
   rb(black,0,ly,nose,1.44,.23,.024,'fixed',.012);for(let i=0;i<17;i++)box(chrome,-.39+i*.048,ly,nose+.025,.010,.21,.018,'chrome');for(const a of[-1,1])for(const xx of[.53,.69]){rb(chrome,a*xx,ly,nose+.025,.149,.168,.024,'chrome',.010);rb(0xa5bdc6,a*xx,ly,nose+.043,.122,.138,.009,'lens',.005);for(let i=0;i<3;i++)box(0xd6e3e7,a*xx-.04+i*.04,ly,nose+.05,.004,.128,.004,'chrome');}
   for(const a of[-1,1]){rb(chrome,a*.57,Y-.09,-L-.025,.37,.15,.025,'chrome',.012);rb(0x982b32,a*.57,Y-.09,-L-.043,.33,.116,.014,'lens',.009);for(const z of[p.front,p.bp,p.rear])line([[a*(W+.012),Y-.13,z-.09],[a*(W+.012),Y-.13,z+.09]],.012,chrome,'chrome');line([[a*(W+.01),.45,-L+.03],[a*(W+.01),.45,L-.04]],.014,chrome,'chrome');line([[a*roofW,roof-.035,p.rf-.04],[a*roofW,roof-.035,p.rr+.04]],.008,0x414144);}
   line([[0,Y+.023,p.front],[0,Y+.025,L-.09]],.0035,chrome,'chrome');lettering('LANDAU',.42,Y+.055,-L-.032,.35,.06,Math.PI);plate(.38,nose+.075);plate(.38,-L-.075,true);
  }else if(key==='passat'){
   rb(black,0,ly,nose,p.w*.94,.20,.025,'fixed',.008);for(const a of[-1,1])for(const xx of[.29,.52]){rb(chrome,a*xx,ly,nose+.025,.205,.15,.018,'chrome',.005);rb(0xb2c4cd,a*xx,ly,nose+.04,.180,.122,.010,'lens',.005);}
   for(let i=0;i<5;i++)box(0x4b545b,0,ly-.076+i*.036,nose+.026,.27,.008,.009);badge('vw',ly,nose+.049,.039);line([[-.64,ly+.105,nose+.04],[.64,ly+.105,nose+.04]],.006,0x963237);
   for(const a of[-1,1]){rb(0xc79951,a*.51,.44,nose+.032,.23,.051,.025,'lens',.010);rb(black,a*.44,Y-.10,-L-.023,.39,.14,.018,'fixed',.009);rb(0xa52932,a*.44,Y-.095,-L-.037,.35,.104,.012,'lens',.007);rb(0xbebeba,a*.34,Y-.11,-L-.046,.09,.083,.008,'lens',.004);line([[a*(W+.012),Y-.14,-L+.12],[a*(W+.012),Y-.14,L-.13]],.013,black);}
   rb(black,0,Y+.06,-L+.055,p.w*.92,.045,.13,'fixed',.015);lettering('GTS POINTER',.35,Y+.045,-L-.032,.42,.048,Math.PI);plate(.40,nose+.075);plate(.39,-L-.075,true);
  }else if(key==='tempra'){
   rb(black,0,ly,nose,.43,.125,.022,'fixed',.009);for(let i=0;i<4;i++)box(0x5e6b73,0,ly-.045+i*.03,nose+.027,.40,.005,.008);badge('fiat',ly,nose+.039);
   for(const a of[-1,1]){rb(black,a*.45,ly,nose+.024,.35,.145,.025,'fixed',.014);rb(0xb5c8d2,a*.435,ly+.002,nose+.045,.275,.116,.012,'lens',.009);rb(0xceb383,a*.602,ly,nose+.045,.060,.11,.013,'lens',.007);rb(0x273139,a*.46,.32,nose+.038,.17,.075,.016,'fixed',.010);rb(black,a*.46,Y-.10,-L-.021,.39,.18,.023,'fixed',.012);rb(0xa42b35,a*.46,Y-.075,-L-.04,.36,.095,.012,'lens',.008);rb(0xb7bfc0,a*.46,Y-.15,-L-.047,.36,.045,.008,'lens',.004);}
   rb(black,0,.34,nose+.045,.56,.075,.018,'fixed',.008);lettering('TEMPRA 16V',.37,Y+.045,-L-.035,.44,.05,Math.PI);plate(.40,nose+.074);plate(.40,-L-.07,true);
  }else{
   rb(black,0,ly,nose,key==='palio'?.44:.48,key==='palio'?.145:.105,.022,'fixed',key==='palio'?.02:.007);
   box(chrome,0,ly,nose+.035,key==='palio'?.43:.49,.015,.011,'chrome');if(fiat)roundFiat(ly,nose+.052);else badge('vw',ly,nose+.046,.047);
   for(const a of[-1,1]){
    if(key==='palio'){const pts=[[-.50,-.42],[.48,-.32],[.48,.35],[-.31,.46]],q=new T.Shape();pts.forEach(([x,y],i)=>i?q.lineTo(a*x*.34,y*.19):q.moveTo(a*x*.34,y*.19));q.closePath();const geo=new T.ExtrudeGeometry(q,{depth:.014,bevelEnabled:true,bevelSize:.006,bevelThickness:.004,bevelSegments:2});add(geo,black,a*.46,ly,nose+.025,1,1,1,'fixed');add(geo.clone(),0xa7c0cc,a*.46,ly,nose+.041,.90,.86,1,'lampglass');rb(0x7f9fae,a*.45,ly,nose+.048,.25,.125,.008,'lens',.025);for(const x of[-.04,.04])line([[a*.45+x,ly-.050,nose+.059],[a*.45+x,ly+.050,nose+.059]],.003,chrome,'chrome');}
    else{
     const pts=[[-.50,-.37],[.31,-.41],[.50,-.17],[.49,.38],[-.36,.48]],shape=new T.Shape();pts.forEach(([x,y],i)=>i?shape.lineTo(a*x*.38,y*.17):shape.moveTo(a*x*.38,y*.17));shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:.016,bevelEnabled:true,bevelSize:.005,bevelThickness:.004,bevelSegments:2});add(geo,0x18252e,a*.49,ly,nose+.023,1,1,1,'fixed');for(const dx of[-.075,.070]){rb(chrome,a*(.49+dx),ly,nose+.048,.11,.10,.006,'chrome',.022);rb(0x8eaab9,a*(.49+dx),ly,nose+.054,.087,.079,.005,'lens',.020);}line([[a*.31,ly-.065,nose+.062],[a*.61,ly-.065,nose+.062],[a*.65,ly+.045,nose+.062]],.007,0xc9d5d7,'chrome');
    }
    rb(black,a*W*.75,.30,nose+.05,.19,.11,.023,'fixed',.027);roundLight(a*W*.75,.30,nose+.07,key==='palio'?.033:.029);
    if(key==='palio'){rb(black,a*.56,Y-.005,-L-.025,.16,.32,.023,'fixed',.047);rb(0xa62e37,a*.56,Y+.005,-L-.04,.13,.285,.013,'lens',.035);rb(0xbec9c9,a*.56,Y-.020,-L-.051,.11,.065,.009,'lens',.01);}
    else{rb(black,a*.48,Y-.06,-L-.02,.38,.17,.022,'fixed',.018);rb(0x9b2532,a*.48,Y-.045,-L-.04,.34,.12,.010,'lens',.010);line([[a*.31,Y-.076,-L-.051],[a*.61,Y-.076,-L-.051],[a*.64,Y+.012,-L-.051]],.008,0xc84949,'lens');}
   }
   rb(black,0,.30,nose+.053,key==='palio'?.73:.86,.11,.018,'fixed',.030);for(let i=0;i<3;i++)box(0x49535a,0,.27+i*.03,nose+.067,key==='palio'?.69:.80,.006,.004);plate(.44,nose+.07);plate(.42,-L-.065,true);
   lettering(key==='palio'?'FIRE ECONOMY':'TSI',.38,Y+.08,-L-.038,key==='palio'?.36:.16,.043,Math.PI);if(key==='palio')lettering('Celebration',-.39,Y+.08,-L-.038,.29,.043,Math.PI);else lettering('GOLF',-.43,Y+.08,-L-.038,.22,.043,Math.PI);
  }
 }else
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
 if(key==='gol'){
  for(const a of[-1,1]){patch(72,6,(u,t)=>{const z=-L+.08+(p.l-.16)*u;const lo=bottom(z),hi=Math.max(lo,Math.min(top(z)-.06,.50));return[a*(width(z)+.009),lo+(hi-lo)*t,z];},0x8b9298,'fixed');roundLight(a*.42,.38,nose+.092,.067);lettering('GTI',a*(W+.018),Y-.085,-.99,.19,.077,a*Math.PI/2);}
  rb(black,0,Y+.048,-L+.075,p.w*.94,.046,.17,'fixed',.014);lettering('GTI',.36,Y+.095,-L-.035,.19,.06,Math.PI);
 }
 if(key==='opala'){
  for(const a of[-1,1]){lettering('SS',a*(W+.018),Y-.09,-.94,.16,.09,a*Math.PI/2,'#dddddd');line([[a*W*.82,Y+.055,-1.22],[a*W*.72,roof-.10,-.65]],.010,chrome,'chrome');}
  lettering('SS',.40,Y+.045,-L-.058,.15,.085,Math.PI);lettering('OPALA',-.34,Y+.045,-L-.058,.31,.045,Math.PI);
 }
 // Bonnet seams and a rear hatch line make each surface read as coachwork.
 for(const a of[-1,1]){const pts=[];for(let i=0;i<=24;i++){const z=p.front+.03+(L-p.front-.10)*i/24,x=a*width(z)*.77;pts.push([x,top(z)+p.crown*(1-.77**2)+.0015,z]);}line(pts,.0025,0x40515a);}
 for(const[i,x,z]of[[0,-W*.91,p.fa],[1,W*.91,p.fa],[2,-W*.91,p.ra],[3,W*.91,p.ra]])wheel(i,x,z,p.r);
 if(!p.classic&&!p.bus){
  const roundness=['palio','peugeot206','corolla2007','porsche911'].includes(key)?.19:p.sports?.16:.095,nearWhite=0xffffff;
  root.userData.surfaceWarp={front:p.front,rear:p.rear,length:p.l,width:p.w,roundness};
 }
 Object.assign(root.userData,{coachwork:'bonnet-aligned-panels-v3',seats:[{x:-seatX,y:seatY-.05,z:p.seat+.02},{x:seatX,y:seatY-.05,z:p.seat+.02},...(!p.twoSeats?[{x:-seatX,y:seatY-.05,z:p.back+.02},{x:seatX,y:seatY-.05,z:p.back+.02}]:[])],seatScale:p.sports?.27:p.bus?.38:p.pickup?.34:.32,roof:roof+.025,hoodY:Y+p.crown,wheelRadius:p.r,front:L+.09,rear:-L-.09,pickup:!!p.pickup});
 return true;
}
// The 911 uses a continuous coupe shell rather than the sedan cabin template.
function build911(T,H){
 const{root,add,box,ell,tube,ring,wheel}=H,white=0xffffff,black=0x172127,chrome=0xb9c6cc,glass=0x365967;
 const stations=[[-1.80,.52,.53,.49],[-1.67,.72,.65,.58],[-1.42,.79,.79,.62],[-1.15,.79,.91,.64],[-.88,.74,1.045,.64],[-.55,.70,1.095,.64],[-.20,.68,1.10,.63],[.10,.66,1.08,.63],[.32,.65,1.00,.62],[.60,.68,.83,.60],[.86,.72,.63,.58],[1.14,.75,.55,.53],[1.48,.72,.48,.46],[1.72,.60,.44,.42],[1.80,.45,.38,.37]];
 function sample(z){let i=0;while(i<stations.length-2&&z>stations[i+1][0])i++;const a=stations[i],b=stations[i+1],u=(z-a[0])/(b[0]-a[0]),t=u*u*(3-2*u);return{w:a[1]+(b[1]-a[1])*t,h:a[2]+(b[2]-a[2])*t,b:a[3]+(b[3]-a[3])*t};}
 const point=(z,a)=>{const s=sample(z);return[s.w*Math.sin(a),s.b+(s.h-s.b)*Math.cos(a),z];};
 const parts={paint:[],glass:[]},N=132,A=56;
 for(let i=0;i<N;i++)for(let j=0;j<A;j++){const z=-1.80+3.60*i/N,nz=-1.80+3.60*(i+1)/N,a=-Math.PI/2+Math.PI*j/A,na=-Math.PI/2+Math.PI*(j+1)/A,mid=(z+nz)/2,angle=Math.abs((a+na)/2),side=mid>-.89&&mid<.48&&angle>.85&&angle<1.43&&Math.abs(mid+.30)>.018,wind=mid>.36&&mid<.80&&angle<.84,rear=mid>-1.39&&mid<-.91&&angle<.89,kind=side||wind||rear?'glass':'paint';parts[kind].push(...[point(z,a),point(nz,a),point(nz,na),point(z,a),point(nz,na),point(z,na)].flat());}
 for(const kind of['paint','glass']){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(parts[kind],3));g.computeVertexNormals();add(g,kind==='paint'?white:glass,0,0,0,1,1,1,kind);}
 const lower=z=>{let lo=.23;for(const az of[1.10,-1.06]){const d=z-az,r=.327;if(Math.abs(d)<r)lo=Math.max(lo,.30+Math.sqrt(r*r-d*d));}return lo;};
 for(const a of[-1,1]){const pos=[],idx=[];for(let i=0;i<=132;i++){const z=-1.80+i*3.6/132,s=sample(z),lo=lower(z),hi=Math.max(lo,s.b);for(let j=0;j<=5;j++){const t=j/5;pos.push(a*(s.w-.035*(1-t)**2),lo+(hi-lo)*t,z);if(i<132&&j<5){const q=i*6+j;idx.push(q,q+6,q+7,q,q+7,q+1);}}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();add(g,white,0,0,0,1,1,1,'paint');
  for(const az of[1.10,-1.06]){const pts=[];for(let i=0;i<=28;i++){const t=i*Math.PI/28,z=az+Math.cos(t)*.326;pts.push([a*(sample(z).w+.006),.30+Math.sin(t)*.326,z]);}tube(pts,.011,white,'paint');}
  const sill=[];for(let i=0;i<=26;i++){const z=-.68+i*1.42/26;sill.push([a*(sample(z).w+.010),.26,z]);}tube(sill,.024,white,'paint');
  const frontFender=ell(white,a*.565,.545,1.18,.19,.17,.39,'paint');frontFender.rotation.x=-.20;
  const housing=ell(black,a*.57,.615,1.43,.125,.030,.158);housing.rotation.x=.56;const lamp=ell(0xa5bec9,a*.57,.637,1.445,.111,.023,.141,'lens');lamp.rotation.x=.56;
  for(const d of[-1,1]){const led=ell(0xd7e7e8,a*.57+d*.043,.649,1.464,.019,.012,.027,'lens');led.rotation.x=.56;}
  box(black,a*.48,.335,1.735,.35,.095,.025);tube([[a*.31,.43,1.747],[a*.62,.43,1.70]],.009,0xc3d5d9,'chrome');
  tube([[a*.68,.60,.48],[a*.70,.29,.43],[a*.73,.28,-.62],[a*.74,.62,-.68]],.0038,0x35434b);box(chrome,a*.725,.58,-.46,.024,.025,.14,'chrome');
  tube([[a*.64,.66,.43],[a*.76,.70,.37]],.016,black);ell(white,a*.78,.72,.35,.095,.048,.082,'paint');ell(0x8eabb6,a*.78,.72,.285,.074,.032,.005,'chrome');
  tube([[a*.22,.28,-1.81],[a*.54,.28,-1.78]],.031,black);const exhaust=add(new T.CylinderGeometry(.038,.038,.10,20),chrome,a*.48,.26,-1.81,1,1,1,'chrome');exhaust.rotation.x=Math.PI/2;
 }
 // Rounded nose, rear valance and rear light bar close the shell.
 for(const end of[-1,1]){const z=end*1.80,s=sample(z),pos=[],idx=[];for(let i=0;i<=32;i++)for(let j=0;j<=8;j++){const x=-1+i/16,t=j/8;pos.push(x*s.w,.23+(s.b+(s.h-s.b)*Math.sqrt(1-x*x)-.23)*t,z);if(i<32&&j<8){const n=i*9+j;idx.push(n,n+9,n+10,n,n+10,n+1);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();add(g,white,0,0,0,1,1,1,'paint');}
 tube([[-.66,.56,-1.69],[-.43,.57,-1.80],[0,.57,-1.82],[.43,.57,-1.80],[.66,.56,-1.69]],.020,black);tube([[-.64,.568,-1.70],[-.42,.578,-1.814],[0,.578,-1.836],[.42,.578,-1.814],[.64,.568,-1.70]],.008,0xb52c3a,'lens');
 for(let i=0;i<14;i++){const x=-.39+i*.06,z=-1.48,y=sample(z).h+.011;tube([[x,y,z-.09],[x,y+.04,z+.15]],.008,black);}
 for(const a of[-1,1]){tube([[a*.34,.58,.81],[a*.36,.53,1.14],[a*.32,.48,1.60]],.003,0x46565e);}
 box(black,0,.22,0,1.30,.07,2.9);box(black,0,.30,1.81,.48,.09,.018);box(0xe4e8e3,0,.31,1.822,.32,.077,.008);box(0xe4e8e3,0,.40,-1.819,.32,.077,.008);
 for(const[i,x,z]of[[0,-.704,1.10],[1,.704,1.10],[2,-.737,-1.06],[3,.737,-1.06]])wheel(i,x,z,.291);
 for(const a of[-1,1]){box(0x252c30,a*.27,.34,-.10,.34,.12,.39,'interior');const back=box(0x293239,a*.27,.55,-.31,.32,.43,.11,'interior');back.rotation.x=-.14;ell(0x252c30,a*.27,.79,-.35,.10,.075,.04,'interior');box(0x2c3439,a*.25,.39,-.79,.30,.11,.28,'interior');}
 box(0x202b30,0,.61,.53,1.04,.12,.18,'interior');ring(.27,.65,.34,.105,black,-.45);
 Object.assign(root.userData,{coachwork:'911-continuous-coupe-v1',seats:[{x:-.27,y:.27,z:-.08},{x:.27,y:.27,z:-.08},{x:-.25,y:.30,z:-.78},{x:.25,y:.30,z:-.78}],seatScale:.27,roof:1.11,hoodY:.56,wheelRadius:.291,front:1.84,rear:-1.87});return true;
}
(typeof window!=='undefined'?window:globalThis).OTBrazilCoachwork={build,specs};
})();

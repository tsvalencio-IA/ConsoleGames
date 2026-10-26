/* Authored Palio Fire Economy MY2011 and original-generation T-Cross bodies.
 * Dimensions, glazing and lamp outlines are model-specific. +Z forward.
 * Reference photographs are documented, not embedded or redistributed. */
// @otthi-module-body
(()=>{'use strict';
function build(T,key,H){
 const{root,add,box,ell,tube,ring,wheel}=H,suv=key==='tcross',P=suv?{l:3.44,w:1.443,h:1.287,b:.845,rf:.29,rr:-1.27,front:.72,rear:-1.57,fa:1.073,ra:-1.073,r:.293}:{l:3.138,w:1.328,h:1.185,b:.727,rf:.13,rr:-1.04,front:.67,rear:-1.40,fa:.971,ra:-.971,r:.255},L=P.l/2,W=P.w/2,paint=0xffffff,black=0x192329,chrome=0xb6c1c7,glass=0x466977;
 function surface(n,m,fn,c=paint,k='paint'){const p=[],idx=[];for(let i=0;i<=n;i++)for(let j=0;j<=m;j++)p.push(...fn(i/n,j/m));for(let i=0;i<n;i++)for(let j=0;j<m;j++){const a=i*(m+1)+j;idx.push(a,a+m+1,a+m+2,a,a+m+2,a+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return add(g,c,0,0,0,1,1,1,k);}
 function line(p,r=.007,c=black,k='fixed'){return tube(p,r,c,k);}
 function rb(c,x,y,z,w,h,d,k='fixed',r=.02){const a=-w/2,b=-h/2,q=new T.Shape();r=Math.min(r,w*.25,h*.4);q.moveTo(a+r,b);q.lineTo(a+w-r,b);q.quadraticCurveTo(a+w,b,a+w,b+r);q.lineTo(a+w,b+h-r);q.quadraticCurveTo(a+w,b+h,a+w-r,b+h);q.lineTo(a+r,b+h);q.quadraticCurveTo(a,b+h,a,b+h-r);q.lineTo(a,b+r);q.quadraticCurveTo(a,b,a+r,b);const bevel=Math.min(.008,r*.3,d*.2),g=new T.ExtrudeGeometry(q,{depth:d-bevel*2,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments:8});g.translate(0,0,-d/2+bevel);return add(g,c,x,y,z,1,1,1,k);}
 const width=z=>W*(1-(suv?.045:.10)*Math.pow(Math.min(1,Math.abs(z)/L),7)),belt=z=>P.b+(suv?.022:.045)*Math.exp(-((z+.6)**2)/.8),hood=z=>P.b+(suv?.002:.003)-(suv?.061:.065)*Math.max(0,(z-P.front)/(L-P.front)),edgeBottom=z=>{let y=suv?.255:.225;for(const a of[P.fa,P.ra]){const d=z-a,r=P.r+.041;if(Math.abs(d)<r)y=Math.max(y,P.r+.008+Math.sqrt(r*r-d*d));}return y;};
 // Full curved side panels, with open wheel arches and soft shoulder sections.
 for(const a of[-1,1])surface(144,10,(u,t)=>{const z=-L+P.l*u,lo=edgeBottom(z),hi=z>P.front?hood(z):belt(z),x=width(z)-.045*(1-t)**2+.022*Math.sin(t*Math.PI);return[a*x,lo+(hi-lo)*t,z];});
 surface(42,28,(u,v)=>{const z=P.front+(L-P.front)*u,x=(v*2-1)*width(z);return[x,hood(z)+(suv?.025:.051)*(1-(x/width(z))**2),z];});
 for(const e of[-1,1])surface(32,10,(u,t)=>{const x=(u*2-1)*width(e*L),corner=.070*Math.pow(Math.abs(x)/W,5),top=e===1?hood(L):belt(-L);return[x,.23+(top-.23)*t,e*(L-corner+.06*Math.sin(t*Math.PI)-.045*Math.pow(Math.abs(x)/W,5))];});
 box(black,0,.213,0,P.w*.85,.07,P.l*.89);
 // A small hatch has a curved, lower roof; the SUV has an upright C pillar.
 const roofW=W*(suv?.85:.80),roofAt=(z,x)=>P.h-(suv?.037:.063)*(x/roofW)**2-(suv?.020:.040)*Math.pow((z-(P.rf+P.rr)/2)/((P.rf-P.rr)/2),2);
 surface(28,28,(u,v)=>{const z=P.rr+(P.rf-P.rr)*u,x=(v*2-1)*roofW;return[x,roofAt(z,x),z];},suv?0x202a2f:paint,suv?'fixed':'paint');
 function endGlass(front){const z=front?P.front:P.rear,tz=front?P.rf:P.rr,base=front?P.b+.022:belt(P.rear)+.022,bw=width(z)*.94,tw=roofW*.98;
  const p=(u,t)=>{const v=u*2-1,x=v*(bw+(tw-bw)*t);return[x,base+(roofAt(tz,v*roofW)-.012-base)*t,z+(tz-z)*t+(front?1:-1)*.025*(1-v*v)*Math.sin(t*Math.PI)];};
  surface(28,16,p,glass,'glass');for(const u of[0,1])line(Array.from({length:17},(_,j)=>p(u,j/16)),suv?.023:.029,paint,'paint');for(const t of[0,1])line(Array.from({length:29},(_,j)=>p(j/28,t)),.012,black);
 }
 endGlass(true);endGlass(false);
 const bp=suv?-.33:-.31;
 for(const a of[-1,1]){
  // These contours follow the curved glass perimeter; no block behind the window.
  const p=(z,t,topZ=z)=>[a*(width(z)*.954*(1-t)+roofW*t),belt(z)+.025+(roofAt(topZ,roofW)-.03-belt(z)-.025)*t,z+(topZ-z)*t];
  const panes=suv?[[P.front-.035,bp+.04,P.rf-.025,bp+.04],[bp-.04,-1.17,bp-.04,-1.12],[-1.22,P.rear+.07,-1.17,P.rr-.02]]:[[P.front-.04,bp+.035,P.rf-.035,bp+.035],[bp-.035,P.rear+.075,bp-.035,P.rr+.015]];
  for(const[f,b,tf,tb]of panes){surface(20,12,(u,t)=>p(f+(b-f)*u,t,tf+(tb-tf)*u),glass,'glass');for(const u of[0,1])line(Array.from({length:13},(_,j)=>p(f+(b-f)*u,j/12,tf+(tb-tf)*u)),.013,black);}
  const sill=[];for(let i=0;i<=36;i++){const z=P.rear+(P.front-P.rear)*i/36;sill.push(p(z,0));}line(sill,.013,black);
  line([[a*width(P.front)*.96,P.b+.025,P.front],[a*roofW,roofAt(P.rf,roofW),P.rf],[a*roofW,roofAt(P.rr,roofW),P.rr],[a*width(P.rear)*.955,belt(P.rear)+.025,P.rear]],suv?.026:.035,paint,'paint');
  // Curved C-pillar fills the corner behind the rear door, rather than a box.
  surface(14,10,(u,t)=>{const z=P.rear+.015+u*(suv?.07:.085);return p(z,t,P.rr+.015+u*.035);});
  for(const z of[P.front-.10,bp,P.rear+.14])line([[a*(width(z)+.004),belt(z)-.025,z],[a*(width(z)-.009),.29,z]],.0037,0x435158);
  const doorLine=[];for(let i=0;i<=24;i++){const z=P.rear+.14+(P.front-P.rear-.24)*i/24;doorLine.push([a*(width(z)-.007),.274,z]);}line(doorLine,.0037,0x435158);
  for(const z of[bp+.15,P.rear+.26])rb(suv?paint:black,a*(width(z)+.016),belt(z)-.090,z,.024,.032,.125,suv?'paint':'fixed',.011);
  const mirrorZ=P.front-.12;line([[a*W,P.b+.05,mirrorZ],[a*(W+.072),P.b+.123,mirrorZ]],.015,black);ell(suv?black:paint,a*(W+.09),P.b+.129,mirrorZ,.092,.052,.079,suv?'fixed':'paint');ell(0x94abb5,a*(W+.09),P.b+.129,mirrorZ-.071,.075,.035,.004,'chrome');
  for(const az of[P.fa,P.ra]){const pts=[];for(let i=0;i<=36;i++){const t=i*Math.PI/36,z=az+Math.cos(t)*(P.r+.039);pts.push([a*(width(z)+.008),P.r+.008+Math.sin(t)*(P.r+.039),z]);}line(pts,suv?.028:.012,suv?0x30393e:paint,suv?'fixed':'paint');}
  if(suv){line([[a*(W+.010),.257,P.ra+.34],[a*(W+.010),.257,P.fa-.34]],.035,0x30393e);line([[a*(W+.007),P.b-.13,P.rear+.15],[a*(W+.007),P.b-.11,P.front-.16]],.008,0x637078);line([[a*roofW*.9,P.h+.048,P.rr+.05],[a*roofW*.9,P.h+.048,P.rf-.08]],.014,chrome,'chrome');for(const z of[P.rr+.10,P.rf-.13])line([[a*roofW*.9,P.h-.015,z],[a*roofW*.9,P.h+.048,z]],.012,black);}
 }
 // Interior: actual driver on local +X (left when looking forward at +Z).
 const seatX=suv?.31:.28,seatY=suv?.40:.34;
 for(const z of[suv?.13:.05,-.65])for(const a of[-1,1]){rb(0x303a40,a*seatX,seatY,z,.37,.13,.38,'interior',.04);rb(0x354047,a*seatX,seatY+.24,z-.20,.35,.40,.10,'interior',.04);rb(0x263137,a*seatX,seatY+.48,z-.22,.20,.12,.07,'interior',.025);}
 rb(0x253139,0,P.b-.08,P.front-.13,P.w*.83,.14,.22,'interior',.025);ring(seatX,P.b+.015,P.front-.30,.105,black,-.48);line([[seatX,P.b+.015,P.front-.30],[seatX,P.b-.09,P.front-.12]],.014,black,'interior');
 for(const x of[-.28,.15])line([[x,P.b+.029,P.front+.013],[x+.14,P.b+.10,P.front-.09]],.006,black);
 function name(text,x,y,z,w,h,back=false){if(typeof document==='undefined')return;const c=document.createElement('canvas');c.width=512;c.height=96;const g=c.getContext('2d');g.fillStyle='#d6dcdf';g.font='bold 66px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(text,256,48,505);const texture=new T.CanvasTexture(c);texture.encoding=T.sRGBEncoding;const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:texture,transparent:true,alphaTest:.18,side:T.DoubleSide,roughness:.35,metalness:.4}));mesh.position.set(x,y,z);mesh.rotation.y=back?Math.PI:0;mesh.name='badge-'+text;root.add(mesh);}
 function plate(y,z,back=false){rb(0xe4e7e2,0,y,z,.32,.107,.014,'fixed',.009);box(0x22568e,0,y+.039,z+(back?-.010:.010),.30,.018,.003);for(let i=0;i<7;i++)box(0x26323c,-.107+i*.035,y-.012,z+(back?-.011:.011),.014,.033,.002);}
 function vw(y,z,back=false){const e=back?-1:1;ring(0,y,z,.058,chrome);line([[-.038,y+.029,z+e*.009],[0,y-.007,z+e*.009],[.038,y+.029,z+e*.009]],.005,chrome,'chrome');line([[-.04,y+.006,z+e*.009],[-.023,y-.031,z+e*.009],[0,y-.009,z+e*.009],[.023,y-.031,z+e*.009],[.04,y+.006,z+e*.009]],.005,chrome,'chrome');}
 if(suv){
  rb(black,0,.747,L+.012,1.27,.205,.025,'fixed',.025);for(let n=0;n<4;n++)box(chrome,0,.678+n*.046,L+.031,1.23,.010,.009,'chrome');vw(.75,L+.052);
  for(const a of[-1,1]){rb(black,a*.505,.779,L+.032,.357,.141,.030,'fixed',.021);rb(0x9ab5c2,a*.505,.784,L+.052,.325,.111,.012,'lens',.015);for(const dx of[-.09,.056])rb(chrome,a*(.505+dx),.789,L+.064,.095,.066,.006,'chrome',.012);line([[a*.36,.737,L+.072],[a*.655,.737,L+.072],[a*.661,.78,L+.061]],.006,0xd7e1df,'lens');
   rb(0x303b42,a*.51,.392,L+.038,.30,.26,.025,'fixed',.065);rb(chrome,a*.51,.398,L+.058,.237,.142,.012,'chrome',.045);rb(0x263840,a*.51,.398,L+.071,.203,.108,.010,'fixed',.033);rb(0xb5c7ce,a*.51,.402,L+.082,.119,.053,.006,'lens',.018);
   // Wide, horizontal original-generation lamps in one black rear panel.
   rb(black,a*.485,.807,-L-.015,.405,.186,.026,'fixed',.023);rb(0x9b2634,a*.485,.815,-L-.035,.357,.129,.013,'lens',.018);line([[a*.33,.854,-L-.049],[a*.63,.854,-L-.049],[a*.63,.778,-L-.049],[a*.42,.778,-L-.049]],.008,0xc6454b,'lens');rb(0xb6c4c9,a*.405,.808,-L-.048,.092,.030,.005,'lens',.006);
  }
  rb(black,0,.797,-L-.013,1.34,.15,.024,'fixed',.018);line([[-.66,.813,-L-.041],[.66,.813,-L-.041]],.007,0x9d2e39,'lens');vw(.797,-L-.055,true);name('T-CROSS',0,.639,-L-.04,.36,.043,true);
  rb(black,0,.273,L+.02,1.35,.12,.05,'fixed',.03);rb(black,0,.34,L+.04,.75,.17,.026,'fixed',.02);for(let i=0;i<3;i++)box(0x4b5d66,0,.29+i*.048,L+.059,.70,.010,.008);rb(chrome,0,.229,L+.053,.91,.040,.018,'chrome',.012);
  rb(black,0,.28,-L-.014,1.35,.16,.04,'fixed',.03);rb(0x7c8c94,0,.232,-L-.041,.92,.043,.018,'chrome',.012);for(const a of[-1,1])rb(0x9b2d35,a*.56,.35,-L-.035,.20,.037,.012,'lens',.012);
  plate(.495,L+.058);plate(.475,-L-.044,true);name('200 TSI',-.47,.64,-L-.04,.21,.035,true);
 }else{
  // The Fire's teardrop lens wraps back into the fender. Reflectors sit behind
  // one shaped lens, instead of three spheres protruding above the bonnet.
  for(const a of[-1,1]){
   const contour=new T.CatmullRomCurve3([[.270,.657,L+.040],[.333,.696,L+.028],[.503,.708,L-.028],[.596,.685,L-.123],[.602,.627,L-.082],[.551,.597,L+.018],[.405,.600,L+.057],[.293,.617,L+.060]].map(p=>new T.Vector3(...p)),true,'catmullrom',.20),center=new T.Vector3(.443,.649,L+.030);
   const lamp=(u,v,inset=0)=>{const edge=contour.getPoint(u),p=edge.lerp(center,v);return[a*p.x,p.y,p.z+inset+.010*Math.sin(v*Math.PI)];};
   surface(64,12,(u,v)=>lamp(u,v),0x263a44,'fixed');
   surface(64,12,(u,v)=>lamp(u,.055+v*.945,.009),0xb4c5ca,'lampglass');
   for(const[i,x]of[.356,.459,.558].entries()){const rr=i===2?.018:.038,y=i===2?.656:.645,z=L+(i===2?-.010:.041);ell(chrome,a*x,y,z,rr,rr,.004,'chrome');ell(i===2?0xc19b59:0x617f8e,a*x,y,z+.005,rr*.70,rr*.70,.003,'lens');}
   line(Array.from({length:65},(_,i)=>lamp(i/64,0,.010)),.005,black);
   rb(black,a*.52,.317,L+.017,.24,.144,.032,'fixed',.04);ell(chrome,a*.54,.316,L+.041,.039,.038,.008,'chrome');ell(0x96acb4,a*.54,.316,L+.052,.029,.028,.006,'lens');
   // Smoky vertical lamps sit beside the rounded hatch shoulders.
   const z=-L+.052;rb(black,a*.555,.842,z,.135,.362,.034,'fixed',.048);rb(0x6a323b,a*.555,.850,z-.023,.110,.327,.012,'lens',.037);rb(0xaf3341,a*.555,.940,z-.031,.091,.112,.007,'lens',.025);rb(0xb6c5c7,a*.555,.834,z-.033,.092,.051,.007,'lens',.010);rb(0xa2323b,a*.555,.748,z-.031,.090,.09,.007,'lens',.022);
  }
  rb(black,0,.670,L+.026,.473,.108,.026,'fixed',.02);for(const e of[-1,1])line([[-.221,.670+e*.032,L+.044],[.221,.670+e*.032,L+.044]],.007,chrome,'chrome');ring(0,.671,L+.058,.049,chrome);ell(0x982632,0,.671,L+.063,.042,.042,.008,'lens');name('FIAT',0,.671,L+.076,.067,.024);
  rb(black,0,.319,L+.018,.66,.142,.029,'fixed',.026);for(let i=0;i<3;i++)box(0x48565b,0,.274+i*.042,L+.037,.61,.008,.006);
  for(const e of[-1,1]){rb(paint,0,.241,e*(L-.010),1.25,.095,.11,'paint',.032);line([[-.54,.37,e*(L+.008)],[.54,.37,e*(L+.008)]],.004,0x55656c);}
  rb(paint,0,.601,-L+.005,1.02,.20,.049,'paint',.05);rb(black,0,.635,-L-.026,.14,.033,.018,'fixed',.012);plate(.466,L+.052);plate(.457,-L-.038,true);name('Palio',.39,.695,-L-.027,.20,.049,true);name('FIRE ECONOMY',-.36,.696,-L-.027,.26,.032,true);name('Celebration',-.36,.648,-L-.027,.24,.032,true);
 }
 for(const[i,x,z]of[[0,-W+.035,P.fa],[1,W-.035,P.fa],[2,-W+.035,P.ra],[3,W-.035,P.ra]])wheel(i,x,z,P.r);
 root.userData.precisionReference=suv?'T-Cross original generation MY2021':'Palio Fire Economy Celebration MY2011';Object.assign(root.userData,{coachwork:'model-specific-20261025',seats:[{x:-seatX,y:seatY-.08,z:suv?.14:.06},{x:seatX,y:seatY-.08,z:suv?.14:.06},{x:-seatX,y:seatY-.08,z:-.64},{x:seatX,y:seatY-.08,z:-.64}],seatScale:.32,roof:P.h+.065,hoodY:P.b+.03,wheelRadius:P.r,front:L+.09,rear:-L-.07});return true;
}
globalThis.OTBrazilPrecision={build};
})();

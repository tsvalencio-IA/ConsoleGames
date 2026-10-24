/* Original 3D representations of vehicles sold in Brazil. +Z is forward.
 * Generation references and validation are recorded with this release. */
// @otthi-module-body
(()=>{'use strict';
const catalog=Object.freeze({
 golf:{label:'Volkswagen Golf',color:0xaeb8bf,generation:'Golf IV',length:3.40,width:1.44,roof:1.22},
 opala:{label:'Chevrolet Opala SS',color:0x397d49,generation:'SS cupê 1979',length:3.72,width:1.51,roof:1.20},
 chevette:{label:'Chevrolet Chevette',color:0xe49a2f,generation:'1974',length:3.18,width:1.34,roof:1.15},
 s10:{label:'Chevrolet S10',color:0x36779b,generation:'Cabine dupla 2004',length:3.94,width:1.55,roof:1.42,pickup:true},
 hilux:{label:'Toyota Hilux',color:0xdfe1dd,generation:'Cabine dupla 2012',length:3.94,width:1.57,roof:1.46,pickup:true},
 amarok:{label:'Volkswagen Amarok',color:0x48565f,generation:'Cabine dupla 2013',length:3.94,width:1.63,roof:1.45,pickup:true},
 saveiro:{label:'Volkswagen Saveiro Cross',color:0xc4c7c6,generation:'Cabine dupla 2015',length:3.54,width:1.45,roof:1.27,pickup:true},
 constellation:{label:'Volkswagen Constellation',color:0xf0f0e8,generation:'Caminhão de carga',length:4.05,width:1.86,roof:1.98,truck:true}
});
const profiles={
 golf:{front:.61,rf:.20,rr:-.82,rear:-1.43,belt:.77,r:.285,fa:1.02,ra:-1.04,seat:.03,back:-.67,doors:4},
 opala:{front:.66,rf:.14,rr:-.70,rear:-1.23,belt:.73,r:.287,fa:1.12,ra:-1.13,seat:-.02,back:-.66,classic:true},
 chevette:{front:.52,rf:.12,rr:-.61,rear:-1.06,belt:.70,r:.267,fa:.95,ra:-.94,seat:-.02,back:-.59,classic:true},
 s10:{front:.71,rf:.25,rr:-.58,rear:-.76,belt:.89,r:.318,fa:1.22,ra:-1.19,seat:.19,back:-.43,doors:4},
 hilux:{front:.73,rf:.28,rr:-.57,rear:-.78,belt:.91,r:.330,fa:1.20,ra:-1.18,seat:.22,back:-.42,doors:4},
 amarok:{front:.76,rf:.28,rr:-.59,rear:-.79,belt:.92,r:.331,fa:1.18,ra:-1.19,seat:.23,back:-.43,doors:4},
 saveiro:{front:.61,rf:.17,rr:-.57,rear:-.76,belt:.77,r:.278,fa:1.06,ra:-1.10,seat:.07,back:-.45,doors:4}
};
function build(T,key,h){
 const s=catalog[key],p=profiles[key],{root,add,box,ell,quad,tube,ring,wheel}=h;
 const white=0xffffff,dark=0x172127,chrome=0xb9c5cd,glass=0x648996,black=0x171a1c,lens=0xe9eddf;
 function rounded(c,x,y,z,w,ht,d,k='fixed',r=.035){
  r=Math.min(r,w/3,ht/3);const bv=Math.min(r/2,d/4),a=-w/2,b=-ht/2,q=new T.Shape();
  q.moveTo(a+r,b);q.lineTo(a+w-r,b);q.quadraticCurveTo(a+w,b,a+w,b+r);q.lineTo(a+w,b+ht-r);q.quadraticCurveTo(a+w,b+ht,a+w-r,b+ht);q.lineTo(a+r,b+ht);q.quadraticCurveTo(a,b+ht,a,b+ht-r);q.lineTo(a,b+r);q.quadraticCurveTo(a,b,a+r,b);
  const g=new T.ExtrudeGeometry(q,{depth:Math.max(.001,d-2*bv),bevelEnabled:true,bevelSize:bv,bevelThickness:bv,bevelSegments:2,curveSegments:4});g.translate(0,0,-d/2+bv);return add(g,c,x,y,z,1,1,1,k);
 }
 function straight(points,r,c,k='fixed'){const path=new T.CurvePath();for(let i=1;i<points.length;i++)path.add(new T.LineCurve3(new T.Vector3(...points[i-1]),new T.Vector3(...points[i])));add(new T.TubeGeometry(path,points.length*4,r,6,false),c,0,0,0,1,1,1,k);}
 function logo(brand,y,z,r=.065){
  if(brand==='chevrolet'){const pts=[[-.10,-.022],[-.035,-.022],[-.035,-.045],[.035,-.045],[.035,-.022],[.10,-.022],[.10,.022],[.035,.022],[.035,.045],[-.035,.045],[-.035,.022],[-.10,.022]],q=new T.Shape();pts.forEach(([x,v],i)=>i?q.lineTo(x,y+v):q.moveTo(x,y+v));q.closePath();const g=new T.ExtrudeGeometry(q,{depth:.009,bevelEnabled:false});add(g,0xc5a34b,0,0,z,1,1,1,'chrome');}
  else if(brand==='toyota'){const a=ring(0,y,z,r,chrome);a.scale.set(1.35,.84,1);const b=ring(0,y,z+.004,r*.65,chrome);b.scale.set(.52,1.1,1);const c=ring(0,y+r*.24,z+.004,r*.62,chrome);c.scale.set(1.4,.48,1);}
  else{ring(0,y,z,r,chrome);straight([[-r*.64,y+r*.48,z],[0,y-r*.07,z],[r*.64,y+r*.48,z]],.006,chrome,'chrome');straight([[-r*.66,y+r*.05,z],[-r*.37,y-r*.50,z],[0,y-r*.14,z],[r*.37,y-r*.50,z],[r*.66,y+r*.05,z]],.006,chrome,'chrome');}
 }
 function plate(y,z,rear=false){rounded(0xe8e8df,0,y,z,.30,.105,.014,'fixed',.009);box(0x254a8a,0,y+.04,z+(rear?-.008:.008),.285,.014,.005);for(let i=0;i<7;i++)box(0x283239,-.106+i*.035,y-.006,z+(rear?-.009:.009),.012,.037,.004);}
 function roundLamp(x,y,z,r,c=lens){ell(black,x,y,z,r*1.17,r*1.17,.026);ell(chrome,x,y,z+.013,r*1.07,r*1.07,.022,'chrome');ell(c,x,y,z+.03,r,r,.022,'lens');ring(x,y,z+.049,r*.87,chrome);}
 if(s.truck){
  rounded(white,0,.80,.97,1.71,.92,1.33,'paint',.10);rounded(white,0,1.88,.97,1.68,.13,1.31,'paint',.07);rounded(white,0,1.57,.35,1.66,.64,.09,'paint',.04);
  quad([[-.70,1.28,1.67],[.70,1.28,1.67],[.66,1.80,1.60],[-.66,1.80,1.60]],glass,'glass');box(dark,0,.78,1.66,1.54,.40,.05);for(let j=0;j<5;j++)box(chrome,0,.63+j*.067,1.699,1.42,.015,.014,'chrome');logo('vw',.82,1.72,.09);
  rounded(0xc9d0cf,0,.43,1.73,1.79,.25,.17,'fixed',.045);
  for(const a of[-1,1]){rounded(lens,a*.64,.45,1.826,.31,.16,.025,'lens',.025);for(const z of[.41,1.57])straight([[a*.83,1.20,z],[a*.77,1.83,z]],.045,white,'paint');quad([[a*.86,1.25,.46],[a*.86,1.25,1.48],[a*.77,1.80,1.48],[a*.77,1.80,.46]],glass,'glass');straight([[a*.86,1.66,1.32],[a*1.02,1.66,1.36],[a*1.02,1.27,1.36]],.017,dark);rounded(dark,a*1.02,1.46,1.36,.075,.28,.16);for(let n=0;n<2;n++)box(chrome,a*.88,.32+n*.15,.71,.17,.045,.40,'chrome');}
  box(dark,0,.30,-.25,1.34,.16,3.7);box(0x67523e,0,.65,-.94,1.69,.12,1.88);for(const a of[-1,1]){box(0x81694b,a*.83,.95,-.94,.06,.50,1.90);for(let n=0;n<4;n++)box(chrome,a*.871,.95,-1.78+n*.55,.035,.55,.045,'chrome');box(0xb93234,a*.65,.45,-2.017,.20,.09,.025,'lens');}box(0x81694b,0,.94,-1.91,1.69,.50,.07);box(dark,0,.40,-2.00,1.77,.11,.09);
  for(const x of[-.29,.29]){rounded(dark,x,.97,1,.42,.14,.43,'interior',.05);rounded(dark,x,1.18,.75,.42,.43,.10,'interior',.04);}ring(-.29,1.25,1.35,.13,dark,-.50);
  for(const[i,x,z]of[[0,-.82,1.04],[1,.82,1.04],[2,-.82,-1.10],[3,.82,-1.10],[4,-.82,-1.62],[5,.82,-1.62]])wheel(i,x,z,.34);
  plate(.44,1.83);Object.assign(root.userData,{seats:[{x:-.29,y:.75,z:1},{x:.29,y:.75,z:1},{x:0,y:.75,z:.5}],seatScale:.38,roof:1.98,hoodY:.98,wheelRadius:.34,front:1.85,rear:-2.02});return;
 }
 const half=s.length/2,w=s.width/2,r=p.r,roofW=w*(p.classic?.83:.86),belt=p.belt,roof=s.roof;
 const edge=z=>{const n=Math.max(0,(Math.abs(z)/half-.72)/.28);return w*(1-(z>0&&!p.classic?.14:.075)*n*n);};
 const top=z=>z>p.front?belt-(z-p.front)/(half-p.front)*(p.classic?.075:.10):z<p.rear&&!s.pickup?belt-(p.rear-z)/(half+p.rear)*.025:belt;
 const bottom=z=>{let y=s.pickup?.34:.25;for(const a of[p.fa,p.ra]){const d=z-a,ar=r+.047;if(Math.abs(d)<ar)y=Math.max(y,r+.018+Math.sqrt(Math.max(0,ar*ar-d*d)));}return y;};
 const side=[],upper=[],push=(v,a,b,c,d)=>v.push(...a,...b,...c,...a,...c,...d),N=96;
 for(let i=0;i<N;i++){const z=-half+s.length*i/N,nz=-half+s.length*(i+1)/N;
  for(const sign of[-1,1])for(let j=0;j<5;j++){const a=j/5,b=(j+1)/5,pt=(zz,t)=>[sign*edge(zz)*(1-.045*(1-t)+.012*Math.sin(t*Math.PI)),bottom(zz)+(top(zz)-bottom(zz))*t,zz];push(side,pt(z,a),pt(nz,a),pt(nz,b),pt(z,b));}
  if(z>=p.front||(nz<=p.rear&&!s.pickup))for(let j=0;j<12;j++){const a=-1+j/6,b=-1+(j+1)/6;push(upper,[a*edge(z),top(z)+.048*(1-a*a),z],[a*edge(nz),top(nz)+.048*(1-a*a),nz],[b*edge(nz),top(nz)+.048*(1-b*b),nz],[b*edge(z),top(z)+.048*(1-b*b),z]);}
 }
 for(const v of[side,upper]){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.computeVertexNormals();add(g,white,0,0,0,1,1,1,'paint');}
 box(dark,0,.25,0,s.width*.86,.09,s.length*.88);for(const a of[-1,1]){const z=a*half,e=edge(z);quad([[-e,.28,z],[e,.28,z],[e,top(z),z],[-e,top(z),z]],white,'paint');}
 for(const sign of[-1,1])for(const a of[p.fa,p.ra]){const pts=[];for(let n=0;n<=20;n++){const t=Math.PI*n/20,z=a+Math.cos(t)*(r+.05);pts.push([sign*(edge(z)+.006),r+.018+Math.sin(t)*(r+.05),z]);}tube(pts,s.pickup?.023:.014,s.pickup?0x343c3f:white,s.pickup?'fixed':'paint');}
 rounded(white,0,roof-.018,(p.rf+p.rr)/2,roofW*2,.055,p.rf-p.rr,'paint',.025);
 const bz=p.classic?-.37:-.20;
 for(const a of[-1,1]){const sx=a*(w+.006),tx=a*roofW;
  straight([[sx,belt+.015,p.front],[tx,roof,p.rf],[tx,roof,p.rr],[sx,belt+.015,p.rear]],.026,white,'paint');straight([[sx,belt+.022,p.front],[sx,belt+.022,p.rear]],.014,black);
  quad([[sx,belt+.048,p.front-.04],[sx,belt+.048,bz+.025],[tx,roof-.04,bz+.025],[tx,roof-.04,p.rf-.016]],glass,'glass');quad([[sx,belt+.048,bz-.03],[sx,belt+.048,p.rear+.04],[tx,roof-.04,p.rr+.02],[tx,roof-.04,bz-.03]],glass,'glass');straight([[sx,belt+.03,bz],[tx,roof-.01,bz]],.023,black);
  straight([[sx,.31,p.front-.04],[sx,belt,p.front-.04]],.004,dark);straight([[sx,.31,p.front-.04],[sx,.31,p.doors?p.rear+.06:bz],[sx,belt,p.doors?p.rear+.06:bz]],.004,0x3c4c51);if(p.doors)straight([[sx,.32,bz],[sx,belt,bz]],.004,0x3c4c51);
  for(const z of p.doors?[bz+.12,p.rear+.18]:[bz+.12])rounded(p.classic?chrome:dark,sx,belt-.07,z,.02,.027,.13,p.classic?'chrome':'fixed',.008);
  rounded(p.classic?chrome:white,a*(w+.08),belt+.13,p.front-.11,.15,.09,.10,p.classic?'chrome':'paint',.026);straight([[sx,belt+.07,p.front-.08],[a*(w+.075),belt+.10,p.front-.09]],.015,black);box(chrome,a*(w+.078),belt+.13,p.front-.168,.11,.058,.005,'chrome');straight([[a*(w+.013),belt-.19,half-.17],[a*(w+.013),belt-.19,-half+.18]],.009,p.classic?chrome:0x414a4b,p.classic?'chrome':'fixed');
 }
 function windshield(front){const z=front?p.front:p.rear,tz=front?p.rf:p.rr,y=belt+.04,ty=roof-.02,fw=w*.91,tw=roofW-.035;
  for(let i=0;i<10;i++)for(let j=0;j<5;j++){const a=-1+i/5,b=-1+(i+1)/5,t=j/5,nt=(j+1)/5,pt=(x,v)=>[x*(fw+(tw-fw)*v),y+(ty-y)*v,z+(tz-z)*v+(front?1:-1)*.024*(1-x*x)*Math.sin(v*Math.PI)];quad([pt(a,t),pt(b,t),pt(b,nt),pt(a,nt)],glass,'glass');}
  straight([[-fw,y,z],[-tw,ty,tz],[tw,ty,tz],[fw,y,z]],.012,black);straight([[-fw,y,z],[fw,y,z]],.012,black);
 }
 windshield(true);windshield(false);for(const x of[-.34,.13])straight([[x,belt+.059,p.front+.01],[x+.20,belt+.13,p.front-.095]],.007,black);
 const seatX=w*.43,seatY=s.pickup?.52:.39;
 for(const z of[p.seat,p.back])for(const a of[-1,1]){rounded(0x363b3c,a*seatX,seatY+.10,z,.36,.13,.36,'interior',.04);const back=rounded(0x3e4343,a*seatX,seatY+.30,z-.20,.35,.41,.095,'interior',.035);back.rotation.x=-.08;rounded(0x252c2e,a*seatX,seatY+.56,z-.23,.21,.13,.075,'interior',.025);}
 rounded(dark,0,belt-.09,p.front-.09,s.width*.83,.13,.20,'interior',.025);ring(-seatX,belt+.01,p.front-.29,.105,dark,-.52);straight([[-seatX,belt+.01,p.front-.29],[-seatX,belt-.11,p.front-.08]],.014,dark,'interior');
 if(s.pickup){const back=-half+.055,front=p.rear-.055,d=front-back,cy=belt-.25;box(0x303637,0,cy-.10,(front+back)/2,s.width-.15,.07,d);for(let x=-w+.15;x<w-.08;x+=.13)box(0x454b4b,x,cy-.058,(front+back)/2,.025,.018,d-.09);
  for(const a of[-1,1]){box(white,a*(w-.042),belt-.16,(front+back)/2,.07,.30,d,'paint');rounded(black,a*(w-.042),belt+.012,(front+back)/2,.092,.035,d);rounded(0x2d3335,a*(w-.17),cy+.015,p.ra,.23,.25,.61,'fixed',.065);}rounded(white,0,belt-.15,-half+.035,s.width-.06,.32,.07,'paint',.025);rounded(dark,0,belt-.055,-half-.009,.24,.04,.016,'fixed',.009);
  if(key==='saveiro')for(const a of[-1,1]){straight([[a*(w-.1),belt+.02,p.rear-.12],[a*(w-.1),roof-.035,p.rear-.04],[a*(w-.1),roof-.035,p.rear-.31],[a*(w-.1),belt+.02,p.rear-.57]],.025,0x313b3d);rounded(0x353d3e,a*(w+.016),.30,-.04,.10,.08,1.73,'fixed',.018);}
 }
 const by=s.pickup?.43:.34,frontZ=half+.04,ly=belt-.10;
 for(const a of[-1,1]){const z=a*(half+.018);rounded(p.classic?chrome:white,0,by,z,s.width+.045,p.classic?.095:.20,.13,p.classic?'chrome':'paint',.03);if(!p.classic)rounded(dark,0,by-.045,z+a*.065,s.width*.84,.085,.025,'fixed',.018);}
 if(p.classic){rounded(dark,0,ly,frontZ,s.width*.83,.21,.028,'fixed',.024);for(let i=0;i<6;i++)box(chrome,0,ly-.087+i*.034,frontZ+.020,s.width*.79,.008,.012,'chrome');for(const a of[-1,1])roundLamp(a*w*.72,ly,frontZ+.022,key==='opala'?.112:.103);logo('chevrolet',ly,frontZ+.045);
  if(key==='opala'){for(const a of[-1,1])for(const x of[.32,.56]){ell(0xb33430,a*x,ly-.035,-half-.044,.09,.09,.022,'lens');ring(a*x,ly-.035,-half-.063,.094,chrome);}for(const x of[-.29,.29])quad([[x-.085,belt+.018,p.front+.03],[x+.085,belt+.018,p.front+.03],[x+.11,top(half-.05)+.016,half-.05],[x-.11,top(half-.05)+.016,half-.05]],black);}
  else for(const a of[-1,1]){rounded(0xb42b29,a*w*.71,belt-.12,-half-.034,.22,.135,.025,'lens',.025);quad([[a*(w+.009),belt-.04,p.front-.20],[a*(w+.009),belt-.04,-half+.10],[a*(w+.009),belt-.085,-half+.10],[a*(w+.009),belt-.085,p.front-.20]],black);}
 }else{
  const gw=key==='golf'?.45:key==='saveiro'?.56:key==='s10'?.77:.70,bars=key==='hilux'?3:key==='s10'?4:2;
  rounded(dark,0,ly,frontZ,gw,.19,.028,'fixed',.018);for(let i=0;i<bars;i++)box(chrome,0,ly-.066+i*.13/(bars-1),frontZ+.020,gw-.035,.015,.012,'chrome');if(key==='s10')box(chrome,0,ly,frontZ+.024,s.width*.92,.035,.015,'chrome');logo(key==='s10'?'chevrolet':key==='hilux'?'toyota':'vw',ly,frontZ+.037,key==='golf'?.059:.067);
  for(const a of[-1,1]){const x=a*w*.73,ww=key==='golf'?.33:key==='saveiro'?.34:.38,hh=key==='golf'?.16:key==='hilux'?.19:.17;rounded(0x5a686d,x,ly,frontZ+.012,ww+.035,hh+.025,.025,'chrome',key==='golf'?.065:.025);rounded(lens,x,ly,frontZ+.035,ww,hh,.019,'lens',key==='golf'?.060:.018);for(let j=0;j<2;j++){const px=x+a*(j?-.073:.066);ell(chrome,px,ly,frontZ+.047,j?.061:.053,j?.061:.053,.006,'chrome');ell(0xf9fcf1,px,ly,frontZ+.054,j?.039:.033,j?.039:.033,.004,'lens');}box(0xd3aa59,x+a*ww*.40,ly-.008,frontZ+.051,.032,hh*.70,.009,'lens');if(key!=='golf')roundLamp(a*w*.73,by-.026,frontZ+.052,.049);rounded(0xb92d30,a*(w-.07),belt-.12,-half-.038,s.pickup?.10:.20,s.pickup?.31:.23,.027,'lens',.018);if(s.pickup)rounded(0xe4ded0,a*(w-.07),belt-.11,-half-.057,.07,.055,.010,'lens',.008);}
  if(['hilux','amarok','s10'].includes(key))for(const a of[-1,1])straight([[a*(w+.05),.28,p.fa-.44],[a*(w+.05),.28,p.ra+.43]],.034,chrome,'chrome');
 }
 plate(by+.015,frontZ+.092);plate(by+.04,-half-.094,true);for(const[i,x,z]of[[0,-w*.96,p.fa],[1,w*.96,p.fa],[2,-w*.96,p.ra],[3,w*.96,p.ra]])wheel(i,x,z,r);
 Object.assign(root.userData,{seats:[{x:-seatX,y:seatY-.11,z:p.seat+.02},{x:seatX,y:seatY-.11,z:p.seat+.02},{x:-seatX,y:seatY-.11,z:p.back+.02},{x:seatX,y:seatY-.11,z:p.back+.02}],seatScale:s.pickup?.35:.33,roof:roof+.03,hoodY:belt+.04,wheelRadius:r,front:frontZ+.11,rear:-half-.11,pickup:!!s.pickup});
}
(typeof window!=='undefined'?window:globalThis).OTBrazilVehicleBodies={catalog,build};
})();

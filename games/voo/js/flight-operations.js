/* Aero Strike WAR operations — additive, preserves original gesture calibration. */
(()=>{'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),carrier=Object.freeze({x:2600,z:8800,y:72,w:240,l:1020});
const routes={patrol:[{x:1000,y:600,z:2500},{x:4300,y:700,z:6100},{x:-1100,y:600,z:3700}],reporter:[{x:0,y:500,z:2500,site:'PORTO AZUL'},{x:9500,y:600,z:14000,site:'NOVA AURORA'},{x:-14000,y:600,z:17000,site:'SERRA NORTE'}],rescue:[{x:1200,y:400,z:4800}],carrier:[{x:carrier.x,y:780,z:carrier.z+3000}]};
const labels={patrol:'PATRULHA AÉREA',reporter:'REPÓRTER AÉREO',rescue:'RESGATE AÉREO',emergency:'EMERGÊNCIA',carrier:'PORTA-AVIÕES'};
function segmentBox(a,b,box,r=0){
 let t0=0,t1=1;
 for(const k of ['x','y','z']){
  const lo=box['min'+k.toUpperCase()]-r,hi=box['max'+k.toUpperCase()]+r,v=b[k]-a[k];
  if(!Number.isFinite(v)||!Number.isFinite(a[k]))return false;
  if(Math.abs(v)<1e-8){if(a[k]<lo||a[k]>hi)return false;}
  else{let l=(lo-a[k])/v,h=(hi-a[k])/v;if(l>h)[l,h]=[h,l];t0=Math.max(t0,l);t1=Math.min(t1,h);if(t0>t1)return false;}
 }return true;
}
function segmentDistance(a,b,p){let dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,l=dx*dx+dy*dy+dz*dz,t=l?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy+(p.z-a.z)*dz)/l,0,1):0;return Math.hypot(a.x+dx*t-p.x,a.y+dy*t-p.y,a.z+dz*t-p.z);}
function start(g,phase){g.flightOperation=labels[phase?.operation]?{kind:phase.operation,stage:'ready',index:0,elapsed:0,stable:0,done:false,photos:[],lastPhoto:null,rescued:false,readyWindow:0,gesture:{armed:true,held:0,released:0}}:null;g.flightPhotos=[];}
function onStart(g){
 const op=g.flightOperation;if(!op)return;
 op.stage=op.kind==='carrier'?'catapult':op.kind==='emergency'?'return':'route';op.elapsed=0;op.index=0;op.stable=0;op.rescued=false;op.readyWindow=0;op.lastOpTime=null;op.gesture={armed:true,held:0,released:0};
 if(op.kind==='carrier'){Object.assign(g.ship,{x:carrier.x,y:carrier.y+9,z:carrier.z-carrier.l*.43,vx:0,vy:0,vz:0,speed:0,pitch:0,yaw:0,roll:0});g.onGround=true;g.pilot.throttle=1;g.manualThrottle=1;}
 else if(op.kind==='emergency'){Object.assign(g.ship,{x:240,y:680,z:-3400,yaw:0,pitch:0,roll:0});g.ship.engineHealth=Math.min(g.ship.engineHealth,32);}
 else Object.assign(g.ship,{x:0,y:650,z:-2200,yaw:0,pitch:0,roll:0});
 g.view=null;
}
function carrierGround(g,dt){
 const o=g.flightOperation,p=g.ship;if(o?.kind!=='carrier')return false;
 if(o.stage==='catapult'&&g.onGround){
  p.y=carrier.y+9;p.vy=p.vx=0;p.pitch=p.roll=p.yaw=0;
  p.speed=clamp(p.speed+(g.pilot.throttle>.65?135:30)*Math.max(0,g.pilot.throttle)*dt,0,205);p.vz=p.speed;
  o.deckTravel=(o.deckTravel||0)+p.speed*dt;p.z=carrier.z-carrier.l*.43+o.deckTravel;
  if(p.speed>=155&&o.deckTravel>carrier.l*.72){g.onGround=false;o.stage='route';p.vy=28;p.y+=2;g.pilot.targetPitch=Math.max(.12,g.pilot.targetPitch);}
  return true;
 }
 if(o.stage==='landed'&&g.onGround){
  p.y=carrier.y+9;p.vy=0;p.roll=p.pitch=0;p.vx*=Math.exp(-dt*1.7);p.vz*=Math.exp(-dt*1.7);p.speed=Math.hypot(p.vx,p.vz);p.x+=p.vx*dt;p.z+=p.vz*dt;return true;
 }
 return false;
}
function impact(g,text){
 if(g.state!=='PLAYING')return;
 const p=g.ship;g.flightImpact={text,at:performance.now(),x:p.x,y:p.y,z:p.z};
 p.hp=0;p.engineHealth=p.wingHealth=p.structuralIntegrity=0;
 try{navigator.vibrate?.([120,60,200]);window.GameAudio?.effect?.('hit');}catch{}
 g._endGame('GAMEOVER');
}
function detectImpact(g,b){
 if(!b||g.onGround||g.flightSchool?.stage==='takeoff'||g.flightSchool?.stage==='complete')return null;
 const p=g.ship,r=g.isHelicopter?.()?10:13;
 for(const city of g.battleCities||[]){
  if(Math.hypot(p.x-city.x,p.z-city.z)>2900&&Math.hypot(b.x-city.x,b.z-city.z)>2900)continue;
  for(const h of city.buildings||[])if(segmentBox(b,p,{minX:h.x-h.w/2,maxX:h.x+h.w/2,minY:0,maxY:h.h,minZ:h.z-h.d/2,maxZ:h.z+h.d/2},r))return 'COLISÃO COM EDIFÍCIO';
 }
 for(const e of g.entities||[])if(e.hp>0&&(e.type?.startsWith('jet')||e.isBoss)&&segmentDistance(b,p,e)<49)return 'COLISÃO ENTRE AERONAVES';
 if(['PVP','COOP'].includes(g.mode))for(const [id,e]of Object.entries(g.net?.players||{}))if(id!==g.net?.uid&&e.hp>0&&segmentDistance(b,p,e)<49)return 'COLISÃO COM OUTRO PILOTO';
 return null;
}
function finish(g){
 const o=g.flightOperation;if(!o||o.done||g.state!=='PLAYING')return false;
 const count=routes[o.kind]?.length||0;
 // A medal is a receipt for an entire mission, never for an interrupted node.
 if(o.kind==='reporter'&&(o.photos.length!==count||o.index!==count))return false;
 if(['patrol','rescue','carrier'].includes(o.kind)&&o.index!==count)return false;
 if(o.kind==='rescue'&&!o.rescued)return false;
 if(o.kind==='carrier'&&o.stage!=='landed')return false;
 if(o.kind==='emergency'&&g.landingQuality!=='smooth')return false;
 o.done=true;
 const old=g.flightCareer.missions||{},prev=old[o.kind]||{};
 g.flightCareer.missions={...old,[o.kind]:{
  completed:(Number(prev.completed)||0)+1,
  bestTime:Math.min(Number(prev.bestTime)||Infinity,Math.round(o.elapsed)),
  medal:o.elapsed<160?'OURO':o.elapsed<240?'PRATA':'BRONZE',
  ...(o.kind==='reporter'?{photos:o.photos.length}:{}),
  ...(o.kind==='rescue'?{rescued:true}:{})
 }};
 g.session.xp+=350;g._saveCareer();g._endGame('VICTORY');return true;
}
function update(g,dt,before){
 if(g.state!=='PLAYING')return;
 const hit=detectImpact(g,before);if(hit){impact(g,hit);return;}
 const o=g.flightOperation,p=g.ship;if(!o)return;
 const now=performance.now(),realDt=o.lastOpTime!=null&&now>o.lastOpTime?Math.min(.25,(now-o.lastOpTime)/1000):Math.max(0,dt);
 o.lastOpTime=now;o.elapsed+=realDt;o.readyWindow=Math.max(0,(o.readyWindow||0)-realDt);
 if(o.kind==='carrier'&&o.stage==='return'&&!g.onGround&&Math.abs(p.x-carrier.x)<carrier.w*.45&&Math.abs(p.z-carrier.z)<carrier.l*.46&&before?.y>carrier.y+9&&p.y<=carrier.y+9){
  if(Math.hypot(p.vx,p.vz)>=175||Math.abs(p.vy)>=13||Math.abs(p.roll)>=.36||Math.abs(Math.sin(p.yaw))>=.30){impact(g,'POUSO NAVAL INSEGURO');return;}
  p.y=carrier.y+9;p.vy=0;g.onGround=true;o.stage='landed';g.pilot.throttle=0;g.manualThrottle=0;
 }
 if(o.stage==='landed'){if(Math.hypot(p.vx,p.vz)<15)finish(g);return;}
 if(o.stage==='return'){
   const atBase=Math.abs(p.x)<105&&Math.abs(p.z)<3000&&Math.abs(p.y-8)<16;
   if(o.kind!=='carrier'&&atBase&&g.onGround&&Math.hypot(p.vx,p.vz)<30){
    if(o.kind==='emergency'&&g.landingQuality!=='smooth'){impact(g,'POUSO DE EMERGÊNCIA INSEGURO');return;}
    finish(g);
   }
   return;
  }
 if(o.stage!=='route')return;
 const target=routes[o.kind]?.[o.index];
 if(!target){if(o.kind!=='reporter'||o.photos.length===routes.reporter.length)o.stage='return';return;}
 if(Math.hypot(p.x-target.x,p.y-target.y,p.z-target.z)>(o.kind==='reporter'?700:650)){
  o.stable=0;o.readyWindow=0;return;
 }
 if(Math.abs(p.roll)>.48){o.stable=0;return;}
 o.stable+=realDt;
 if(o.kind==='reporter'){
  if(o.stable>=1)o.readyWindow=1.4;
  return;
 }
 const wait=o.kind==='rescue'?3.5:o.kind==='patrol'?1.0:o.kind==='carrier'?1.0:0;
 if(o.stable<wait)return;
 if(o.kind==='rescue'){o.rescued=true;window.System?.msg?.('VÍTIMA RESGATADA • VOLTE À BASE','#9cfac6');}
 o.index++;o.stable=0;
 if(o.index>=routes[o.kind].length)o.stage='return';
}
function capturePhoto(g){
  const o=g?.flightOperation,p=g?.ship;
  if(!o||o.kind!=='reporter'||g.state!=='PLAYING'||o.done||o.stage!=='route')return {ok:false,reason:'FOTO DISPONÍVEL APENAS NA MISSÃO REPÓRTER AÉREO'};
  const target=routes.reporter[o.index];
  if(!target)return {ok:false,reason:'TODAS AS FOTOS JÁ FORAM TIRADAS'};
  if(Math.hypot(p.x-target.x,p.y-target.y,p.z-target.z)>700)return {ok:false,reason:'APROXIME-SE DO PONTO FOTOGRÁFICO'};
  if(o.stable<1&&o.readyWindow<=0)return {ok:false,reason:'ESTABILIZE O AVIÃO POR 1 SEGUNDO'};
  // Snapshot of the rendered game only, not the player's webcam.
  let thumbnail=null;
  try{
   const source=window.System?.canvas;
   if(source?.width&&source?.height&&typeof document!=='undefined'){
    const canvas=document.createElement('canvas');canvas.width=320;canvas.height=Math.max(1,Math.round(320*source.height/source.width));
    canvas.getContext('2d')?.drawImage(source,0,0,canvas.width,canvas.height);
    thumbnail=canvas.toDataURL('image/jpeg',.67);
   }
  }catch{thumbnail=null;}
  const photo={point:o.index+1,site:target.site,at:Date.now(),x:p.x,y:p.y,z:p.z,thumbnail};
  o.photos.push(photo);g.flightPhotos=o.photos;o.index++;o.stable=0;o.readyWindow=0;
  o.lastPhoto={at:performance.now(),point:photo.point};
  if(o.index>=routes.reporter.length)o.stage='return';
  window.System?.msg?.('FOTO '+photo.point+'/'+routes.reporter.length+' · '+photo.site+' REGISTRADA'+(o.stage==='return'?' • RETORNE À BASE':''),'#89ffcb');
  return {ok:true,point:photo.point,complete:o.stage==='return',thumbnail:!!thumbnail};
}
function cameraPhotoGesture(g,pose,dt){
 const o=g?.flightOperation;
 if(o?.kind!=='reporter'||o.done||o.stage!=='route'||g.state!=='PLAYING')return false;
 const gesture=o.gesture||(o.gesture={armed:true,held:0,released:0});
 const now=performance.now(),step=gesture.lastAt!=null&&now>gesture.lastAt?Math.min(.25,(now-gesture.lastAt)/1000):Math.max(0,dt);
 gesture.lastAt=now;
 // Reuse the same pose the flight model already computed; no new video processing.
 const pts=Array.isArray(pose)?(Array.isArray(pose[0]?.keypoints)?pose[0].keypoints:pose):pose?.keypoints;
 if(!Array.isArray(pts)||!pts.length){gesture.held=0;return false;}
 const joint=(key,index)=>pts.find(p=>p&&(p.name===key||p.part===key))||pts[index];
 const lw=joint('left_wrist',9),rw=joint('right_wrist',10),ls=joint('left_shoulder',5),rs=joint('right_shoulder',6);
 const reliable=[lw,rw,ls,rs].every(p=>p&&Number(p.score??p.confidence??0)>.33&&Number.isFinite(p.y));
 if(!reliable){gesture.held=0;return false;}
 const unit=[lw,rw,ls,rs].every(p=>p.y>=0&&p.y<=1);
 const height=unit?1:(window.System?.video?.videoHeight||480);
 // Scale the gesture to apparent shoulder width: it must work at TV/camera distance.
 const shoulderWidth=Math.hypot(Number(ls.x)-Number(rs.x),ls.y-rs.y);
 const lift=Math.max(.015*height,Math.min(.085*height,shoulderWidth*.48));
 // Raising ONE arm above shoulder level leaves the other arm available for balance.
 const leftUp=ls.y-lw.y>lift,rightUp=rs.y-rw.y>lift;
 const leftDown=lw.y>=ls.y-.025*height,rightDown=rw.y>=rs.y-.025*height;
 const raised=(leftUp&&rightDown)||(rightUp&&leftDown);
 if(!raised){
  gesture.held=0;
  if(leftDown&&rightDown){gesture.released+=step;if(gesture.released>=.2)gesture.armed=true;}
  return false;
 }
 gesture.released=0;
 gesture.held+=step;
 if(!gesture.armed||gesture.held<.4)return false;
 const result=capturePhoto(g);
 if(result.ok){gesture.armed=false;gesture.held=0;return true;}
 // Do not repeatedly show an error while a distant player is holding up a hand.
 if(gesture.held>=.4&&gesture.held<.5)window.System?.msg?.(result.reason,'#ffcf68');
 return false;
}
function drawWorld(ctx,w,h,g){
 if(Math.hypot(g.ship.x-carrier.x,g.ship.z-carrier.z)>23000)return;
 const f=(pts,color)=>{const a=pts.map(v=>g._projectView(...v,w,h));if(a.some(v=>!v.visible))return;ctx.beginPath();a.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fillStyle=color;ctx.fill();};
 const {x,z,y,w:width,l:length}=carrier,W=width/2,L=length/2;
 f([[x-2600,0,z-3200],[x+2600,0,z-3200],[x+2600,0,z+3200],[x-2600,0,z+3200]],'#245b70');
 f([[x-W,y-35,z-L],[x+W,y-35,z-L],[x+W,y-35,z+L],[x-W,y-35,z+L]],'#354e62');
 f([[x-W,y,z-L],[x+W,y,z-L],[x+W,y,z+L],[x-W,y,z+L]],'#596770');
 for(let a=-L+35;a<L-35;a+=95)f([[x-3,y+.3,z+a],[x+3,y+.3,z+a],[x+3,y+.3,z+a+45],[x-3,y+.3,z+a+45]],'#ecde8b');
 f([[x+W-50,y,z-130],[x+W-12,y,z-130],[x+W-12,y+75,z-130],[x+W-50,y+75,z-130]],'#81979a');
 const op=g.flightOperation;
 if(op?.kind==='rescue'&&!op.rescued&&typeof g._projectView==='function'){
  const target=routes.rescue[0],marker=g._projectView(target.x,25,target.z,w,h);
  if(marker.visible&&marker.x>=0&&marker.x<=w&&marker.y>=0&&marker.y<=h){
   ctx.save();ctx.globalAlpha=.76+.18*Math.sin(performance.now()/280);ctx.strokeStyle='#ffd06e';ctx.fillStyle='#ffdf94';ctx.lineWidth=3;
   ctx.beginPath();ctx.arc(marker.x,marker.y,12,0,Math.PI*2);ctx.stroke();ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.fillText('SOS • RESGATE',marker.x,marker.y-23,w*.46);ctx.restore();
  }
 }
}
function drawHud(ctx,w,h,g){
 const o=g.flightOperation;if(!o&&!g.flightImpact)return;ctx.save();
 if(o&&!o.done){
  const t=o.stage==='return'?(o.kind==='carrier'?{x:carrier.x,y:carrier.y+140,z:carrier.z}:{x:0,y:120,z:0}):routes[o.kind]?.[o.index];
  const dist=t?Math.round(Math.hypot(g.ship.x-t.x,g.ship.z-t.z)):null;
  const bearing=t?Math.atan2(t.x-g.ship.x,t.z-g.ship.z):0;
  const delta=t?Math.atan2(Math.sin(bearing-g.ship.yaw),Math.cos(bearing-g.ship.yaw)):0;
  const arrow=!t?'':Math.abs(delta)<.25?'↑':Math.abs(delta)>2.85?'↓':delta>0?'→':'←';
  const alt=t?Math.round(t.y-g.ship.y):0;
  const altitudeCue=t&&o.stage==='route'&&Math.abs(alt)>130?(alt>0?' · SUBA '+alt+' m':' · DESÇA '+Math.abs(alt)+' m'):'';
  const ready=o.kind==='reporter'&&o.stage==='route'&&(o.stable>=1||o.readyWindow>0);
  const stage=o.stage==='catapult'?'DECOLE DO CONVÉS':o.stage==='return'?'RETORNE À BASE E POUSE':o.stage==='landed'?'PARE NO CONVÉS':'PONTO '+(o.index+1)+'/'+(routes[o.kind]?.length||1);
  const hint=o.kind==='reporter'&&o.stage==='route'?(ready?(window.ArcadeControls?.mode==='camera'?'ERGA UMA MÃO PARA FOTO':'APERTE FOTOGRAFAR'):o.stable>0?'ESTABILIZE PARA FOTO':'APROXIME-SE DO ALVO'):o.kind==='rescue'?(o.rescued?'VÍTIMA A BORDO':o.stage==='route'?'RESGATE '+o.stable.toFixed(1)+'/3.5 s':''):o.kind==='patrol'&&o.stage==='route'?'OBSERVAÇÃO '+o.stable.toFixed(1)+'/1 s':o.kind==='carrier'&&o.stage==='route'?'PATRULHA '+o.stable.toFixed(1)+'/1 s':'';
  const top=h<530?83:102;
  ctx.fillStyle='rgba(5,30,44,.84)';ctx.fillRect(w*.06,top,w*.88,46);
  ctx.textAlign='center';ctx.font='bold 12px Arial';ctx.fillStyle='#c9faf3';ctx.fillText(labels[o.kind]+' · '+stage,w/2,top+17,w*.83);
  ctx.font='bold 11px Arial';ctx.fillStyle=ready?'#a8ffd0':'#ffe1a3';
  ctx.fillText((arrow?arrow+' '+dist+' m':'')+altitudeCue+(hint?' · '+hint:'')+(o.kind==='reporter'?' · '+o.photos.length+'/3 FOTOS':''),w/2,top+36,w*.83);
  if(t&&typeof g._projectView==='function'){
   const marker=g._projectView(t.x,t.y,t.z,w,h);
   if(marker?.visible&&Number.isFinite(marker.x)&&Number.isFinite(marker.y)&&marker.x>30&&marker.x<w-30&&marker.y>top+65&&marker.y<h-65){
    ctx.strokeStyle=ready?'#a8ffd0':'#ffe1a3';ctx.lineWidth=2;ctx.beginPath();ctx.arc(marker.x,marker.y,19,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#fff';ctx.fillText(o.kind==='reporter'?(t.site||'FOTO '+(o.index+1)):o.stage==='return'?'BASE':'PONTO '+(o.index+1),marker.x,marker.y-26);
   }
  }
 }
 if(o?.lastPhoto&&performance.now()-o.lastPhoto.at<260){ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(0,0,w,h);}
  if(g.flightImpact&&performance.now()-g.flightImpact.at<1500){ctx.fillStyle='rgba(255,86,25,.27)';ctx.fillRect(0,0,w,h);ctx.fillStyle='#ffe6a9';ctx.textAlign='center';ctx.font='bold 19px Arial';ctx.fillText(g.flightImpact.text,w/2,h*.41,w-18);}
 ctx.restore();
}
window.FlightOperations=Object.freeze({carrier,routes,start,onStart,carrierGround,segmentBox,detectImpact,capturePhoto,cameraPhotoGesture,update,drawWorld,drawHud});
})();
/* Aero Strike WAR operations — additive, preserves original gesture calibration. */
(()=>{'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),carrier=Object.freeze({x:2600,z:8800,y:72,w:240,l:1020});
const routes={patrol:[{x:1000,y:600,z:2500},{x:4300,y:700,z:6100},{x:-1100,y:600,z:3700}],reporter:[{x:2500,y:500,z:1000},{x:9500,y:600,z:14000},{x:-12500,y:600,z:17000}],rescue:[{x:1200,y:400,z:4800}],carrier:[{x:carrier.x,y:780,z:carrier.z+3000}]};
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
function start(g,phase){g.flightOperation=labels[phase?.operation]?{kind:phase.operation,stage:'ready',index:0,elapsed:0,stable:0,done:false,photos:[],lastPhoto:null}:null;g.flightPhotos=[];}
function onStart(g){
 const op=g.flightOperation;if(!op)return;
 op.stage=op.kind==='carrier'?'catapult':op.kind==='emergency'?'return':'route';op.elapsed=0;op.index=0;op.stable=0;
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
 const o=g.flightOperation;if(!o||o.done||g.state!=='PLAYING')return;o.done=true;
 const old=g.flightCareer.missions||{},prev=old[o.kind]||{};
 g.flightCareer.missions={...old,[o.kind]:{completed:(Number(prev.completed)||0)+1,bestTime:Math.min(Number(prev.bestTime)||Infinity,Math.round(o.elapsed)),medal:o.elapsed<160?'OURO':o.elapsed<240?'PRATA':'BRONZE'}};
 if(o.kind==='reporter'&&o.photos.length!==routes.reporter.length){o.done=false;return;}
  if(o.kind==='reporter')g.flightCareer.missions.reporter.photos=o.photos.length;
  g.session.xp+=350;g._saveCareer();g._endGame('VICTORY');
}
function update(g,dt,before){
 if(g.state!=='PLAYING')return;
 const hit=detectImpact(g,before);if(hit){impact(g,hit);return;}
 const o=g.flightOperation,p=g.ship;if(!o)return;o.elapsed+=dt;
 if(o.kind==='carrier'&&o.stage==='return'&&!g.onGround&&Math.abs(p.x-carrier.x)<carrier.w*.45&&Math.abs(p.z-carrier.z)<carrier.l*.46&&before?.y>carrier.y+9&&p.y<=carrier.y+9){
  if(Math.hypot(p.vx,p.vz)>=175||Math.abs(p.vy)>=13||Math.abs(p.roll)>=.36||Math.abs(Math.sin(p.yaw))>=.30){impact(g,'POUSO NAVAL INSEGURO');return;}
  p.y=carrier.y+9;p.vy=0;g.onGround=true;o.stage='landed';g.pilot.throttle=0;g.manualThrottle=0;
 }
 if(o.stage==='landed'){if(Math.hypot(p.vx,p.vz)<15)finish(g);return;}
 if(o.stage==='return'){
   const atBase=Math.abs(p.x)<105&&Math.abs(p.z)<3000&&Math.abs(p.y-8)<16;
   if(o.kind!=='carrier'&&atBase&&g.onGround&&Math.hypot(p.vx,p.vz)<30){
    if(o.kind==='emergency'&&g.landingQuality==='firm'){impact(g,'POUSO DE EMERGÊNCIA INSEGURO');return;}
    finish(g);
   }
   return;
  }
 if(o.stage!=='route')return;
 const target=routes[o.kind]?.[o.index];if(!target){o.stage='return';return;}
 if(Math.hypot(p.x-target.x,p.y-target.y,p.z-target.z)> (o.kind==='reporter'?700:650)||Math.abs(p.roll)>.48){o.stable=0;return;}
 o.stable+=dt;
  // No automatic success for the aerial reporter: the player must press the shutter.
  if(o.kind==='reporter')return;
  if(o.kind==='rescue'&&o.stable<3.5)return;
 o.index++;o.stable=0;if(o.index>=routes[o.kind].length)o.stage='return';
}
function capturePhoto(g){
  const o=g?.flightOperation,p=g?.ship;
  if(!o||o.kind!=='reporter'||g.state!=='PLAYING'||o.done||o.stage!=='route')return {ok:false,reason:'FOTO DISPONÍVEL APENAS NA MISSÃO REPÓRTER AÉREO'};
  const target=routes.reporter[o.index];
  if(!target)return {ok:false,reason:'TODAS AS FOTOS JÁ FORAM TIRADAS'};
  if(Math.hypot(p.x-target.x,p.y-target.y,p.z-target.z)>700)return {ok:false,reason:'APROXIME-SE DO PONTO FOTOGRÁFICO'};
  if(Math.abs(p.roll)>.48||o.stable<1)return {ok:false,reason:'ESTABILIZE O AVIÃO POR 1 SEGUNDO'};
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
  const photo={point:o.index+1,at:Date.now(),x:p.x,y:p.y,z:p.z,thumbnail};
  o.photos.push(photo);g.flightPhotos=o.photos;o.index++;o.stable=0;
  o.lastPhoto={at:performance.now(),point:photo.point};
  if(o.index>=routes.reporter.length)o.stage='return';
  window.System?.msg?.('FOTO '+photo.point+'/'+routes.reporter.length+' REGISTRADA'+(o.stage==='return'?' • RETORNE À BASE':''),'#89ffcb');
  return {ok:true,point:photo.point,complete:o.stage==='return',thumbnail:!!thumbnail};
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
}
function drawHud(ctx,w,h,g){
 const o=g.flightOperation;if(!o&&!g.flightImpact)return;ctx.save();
 if(o&&!o.done){
  const t=routes[o.kind]?.[o.index],d=t?Math.round(Math.hypot(g.ship.x-t.x,g.ship.z-t.z))+' m':'';
  const ready=o.kind==='reporter'&&o.stage==='route'&&o.stable>=1;
   const hint=o.kind==='reporter'?'FOTOS '+o.photos.length+'/'+routes.reporter.length+' · '+(ready?'FOTOGRAFE AGORA':o.stable>0?'MANTENHA VOO ESTÁVEL':'APROXIME-SE DO ALVO'):'';
   const message=labels[o.kind]+' · '+(o.stage==='catapult'?'AUMENTE A POTÊNCIA':o.stage==='return'?'RETORNE À PISTA E POUSE':o.stage==='landed'?'PARE NO CONVÉS':'PONTO '+(o.index+1)+' · '+d)+(hint?' · '+hint:'');
  ctx.fillStyle='rgba(5,30,44,.8)';ctx.fillRect(w*.06,h<530?95:110,w*.88,30);
  ctx.textAlign='center';ctx.font='bold 12px Arial';ctx.fillStyle='#c9faf3';ctx.fillText(message,w/2,(h<530?95:110)+20,w*.83);
 }
 if(o?.lastPhoto&&performance.now()-o.lastPhoto.at<260){ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(0,0,w,h);}
  if(g.flightImpact&&performance.now()-g.flightImpact.at<1500){ctx.fillStyle='rgba(255,86,25,.27)';ctx.fillRect(0,0,w,h);ctx.fillStyle='#ffe6a9';ctx.textAlign='center';ctx.font='bold 19px Arial';ctx.fillText(g.flightImpact.text,w/2,h*.41,w-18);}
 ctx.restore();
}
window.FlightOperations=Object.freeze({carrier,routes,start,onStart,carrierGround,segmentBox,detectImpact,capturePhoto,update,drawWorld,drawHud});
})();
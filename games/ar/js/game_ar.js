/* WAR Combate — câmera opcional, arena virtual, alvos somente do jogo.
 * O identificador legado conserva as permissões originais. O progresso de
 * combate usa um novo namespace e nunca converte cargas antigas em vitórias. */
(function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
const MISSIONS=[
 {id:'patrol',name:'PATRULHA • PORTO',waves:2,count:3,desc:'Limpe dois setores. Aprenda a mirar, recarregar e usar cobertura.'},
 {id:'city',name:'CERCO • CIDADE',waves:3,count:4,desc:'Avance por três setores contra infantaria e drones.'},
 {id:'extraction',name:'EXTRAÇÃO • FORTALEZA',waves:4,count:4,desc:'Atravesse quatro setores e neutralize o blindado final.'}
];
const WEAPONS=[
 {id:'rifle',name:'Fuzil',mag:30,reserve:180,damage:34,interval:.15,reload:1.65,requires:0},
 {id:'smg',name:'Submetralhadora',mag:24,reserve:192,damage:24,interval:.085,reload:1.25,requires:1},
 {id:'marksman',name:'Precisão',mag:8,reserve:56,damage:85,interval:.48,reload:2,requires:2}
];
const LEVELS={easy:{aim:2.4,damage:8,count:0,health:.8},normal:{aim:1.8,damage:12,count:1,health:1},hard:{aim:1.2,damage:17,count:2,health:1.25}};
const Game={
 state:'INIT',lastTime:0,weapons:WEAPONS,manualStick:{x:0,y:0,active:false},keys:{},
 init(fase){
  this.cleanup();this.lastTime=performance.now();this.state='PLAYING';this.resultPaid=false;this.resultTimer=0;
  this.mission=MISSIONS.find(m=>m.id===fase?.id)||MISSIONS[0];
  this.difficulty=window.ArcadePlaySettings?.get().difficulty||'normal';this.level=LEVELS[this.difficulty]||LEVELS.normal;
  this.careerKey='thia:ar-combat:v1:'+(window.System?.playerId||'local');
  let saved={};try{saved=JSON.parse(localStorage.getItem(this.careerKey)||'{}')||{}}catch{}
  this.career={wins:Math.max(0,Math.floor(Number(saved.wins)||0)),kills:Math.max(0,Number(saved.kills)||0),completed:saved.completed&&typeof saved.completed==='object'?saved.completed:{},weapon:saved.weapon||'rifle'};
  this.eyeY=1.8;this.handAim=null;this.handLock=null;this.player={x:0,z:0,yaw:0,pitch:0,hp:100};this.keys={};this.manualStick={x:0,y:0,active:false};this.aimStick={x:0,y:0,active:false};
  this.fireHeld=false;this.coverHeld=false;this.aiming=false;this.lookPointerActive=false;this.autoWalkSide=0;this.autoWalking=false;this.reloadTime=0;this.shotCooldown=0;this.hitFlash=0;this.hurtFlash=0;this.muzzle=0;
  this.stats={kills:0,hits:0,shots:0,reloads:0,blocks:0,missions:0};this.score=0;this.lastStepSound=0;this.wave=0;this.waveDelay=2;this.bannerTime=3.5;
  this.enemies=[];this.particles=[];this.elapsed=0;this.gun=WEAPONS[0];this.selectWeapon(this.career.weapon,true);
  this.covers=[{x:-7,z:15,w:5,h:1.5,d:2},{x:8,z:27,w:6,h:2,d:2},{x:-12,z:43,w:5,h:2.3,d:3}];
  this.keyDown=e=>{if(e.target?.closest?.('input,select,textarea'))return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowleft','arrowright','arrowup','arrowdown',' ','r','c'].includes(k)){e.preventDefault();this.keys[k]=true;if(k==='r'&&!e.repeat)this.reload();}};
  this.keyUp=e=>{this.keys[e.key.toLowerCase()]=false};this.release=()=>{this.keys={};this.fireHeld=this.coverHeld=this.aiming=this.lookPointerActive=false;for(const s of [this.manualStick,this.aimStick])if(s){s.x=s.y=0;s.active=false;}};
  window.addEventListener('keydown',this.keyDown);window.addEventListener('keyup',this.keyUp);window.addEventListener('blur',this.release);window.addEventListener('arcade:release-inputs',this.release);
  if(window.ArcadeControls?.mode==='camera'&&window.WarHandControl){this.state='HAND_CALIBRATION';this.handSession=window.WarHandControl.start(this);}
 },
 selectWeapon(id,initial=false){
  const gun=WEAPONS.find(w=>w.id===id);if(!gun||this.career.wins<gun.requires)return false;
  if(!initial&&this.state==='PLAYING'&&(this.stats.shots>0||this.wave>0))return false;
  this.gun=gun;this.ammo=gun.mag;this.reserve=gun.reserve;this.reloadTime=0;this.career.weapon=gun.id;this.saveCareer();return true;
 },
 saveCareer(){try{localStorage.setItem(this.careerKey,JSON.stringify(this.career))}catch{}},
 reload(){if(this.state!=='PLAYING'||this.reloadTime>0||this.ammo>=this.gun.mag||this.reserve<=0)return false;this.reloadTime=this.gun.reload;window.GameAudio?.effect('reload');return true;},
 spawnWave(){
  this.wave++;this.bannerTime=2.4;this.enemies=[];
  const count=this.mission.count+this.level.count+this.wave-1;
  for(let i=0;i<count;i++){
   const kind=this.mission.id==='extraction'&&this.wave===this.mission.waves&&i===count-1?'tank':this.mission.id!=='patrol'&&i%3===2?'drone':'soldier';
   this.enemies.push({id:this.wave+':'+i,kind,x:(i-(count-1)/2)*6,z:34+(i%3)*8,y:kind==='drone'?5:1.15,hp:(kind==='tank'?260:kind==='drone'?70:100)*this.level.health,active:true,aim:this.level.aim+1.5+i*.35,flash:0,phase:i*.7,rewarded:false});
  }
 },
 // The same wall depth test is used by hits, enemy fire and rendered occlusion.
 blocked(x,z,y){
  const p=this.player,dx=x-p.x,dz=z-p.z;
  return this.covers.some(c=>{
   const tx=Math.abs(dx)<1e-8?[-Infinity,Infinity]:[(c.x-c.w/2-p.x)/dx,(c.x+c.w/2-p.x)/dx].sort((a,b)=>a-b);
   const tz=Math.abs(dz)<1e-8?[-Infinity,Infinity]:[(c.z-c.d/2-p.z)/dz,(c.z+c.d/2-p.z)/dz].sort((a,b)=>a-b);
   if(Math.abs(dx)<1e-8&&Math.abs(p.x-c.x)>c.w/2||Math.abs(dz)<1e-8&&Math.abs(p.z-c.z)>c.d/2)return false;
   const t=Math.max(0,tx[0],tz[0]),end=Math.min(1,tx[1],tz[1]);
   return t<=end&&t>0.001&&t<.99&&(this.eyeY+(y-this.eyeY)*t)<c.h;
  });
 },
 setAiming(value){this.aiming=!!value&&this.state==='PLAYING'&&!this.handSession&&!window.System?.paused;return this.aiming;},
 focalLength(w,h){return Math.min(w,h)*.88*(this.aiming?1.65:1);},
 lookBy(dx,dy,w,h){
  if(this.state!=='PLAYING'||this.handSession||window.System?.paused||w<=0||h<=0||!Number.isFinite(dx)||!Number.isFinite(dy))return;
  // A swipe is a distance, not a held axis: holding a finger still never turns.
  const scale=1.6*(window.ArcadePlaySettings?.get().sensitivity??1)/this.focalLength(w,h);
  this.player.yaw=angle(this.player.yaw+dx*scale);this.player.pitch=clamp(this.player.pitch-dy*scale,-.8,.8);
 },
 aimRay(){
  const p=this.player,a=this.handAim,view=this.viewSize;
  if(this.handSession)return {yaw:p.yaw,pitch:p.pitch};
  if(!a||!view)return {yaw:p.yaw,pitch:p.pitch};
  const f=this.focalLength(view.w,view.h),x=(a.x*view.w-view.w/2)/f,y=(view.h*.48-a.y*view.h)/f;
  const cp=Math.cos(p.pitch),sp=Math.sin(p.pitch),rz=cp-y*sp,dy=y*cp+sp;
  const dx=x*Math.cos(p.yaw)+rz*Math.sin(p.yaw),dz=-x*Math.sin(p.yaw)+rz*Math.cos(p.yaw);
  return {yaw:Math.atan2(dx,dz),pitch:Math.atan2(dy,Math.hypot(dx,dz))};
 },
 targetAtAim(){
  const p=this.player,ray=this.aimRay();let best=null,bestDistance=Infinity;
  for(const e of this.enemies){
   if(!e.active)continue;const dx=e.x-p.x,dz=e.z-p.z,distance=Math.hypot(dx,dz),dy=e.y-this.eyeY;
   const radius=e.kind==='tank'?2.6:e.kind==='drone'?.85:.72;
   const height=e.kind==='soldier'?1.08:radius,minPitch=Math.atan2(dy-height,distance),maxPitch=Math.atan2(dy+height,distance);
   if(Math.abs(angle(Math.atan2(dx,dz)-ray.yaw))<Math.atan2(radius,distance)&&ray.pitch>minPitch&&ray.pitch<maxPitch&&distance<bestDistance&&!this.blocked(e.x,e.z,e.y)){best=e;bestDistance=distance;}
  }
  return best;
 },
 shoot(){
  if(this.state!=='PLAYING'||this.reloadTime>0||this.shotCooldown>0)return false;
  if(this.ammo<=0){this.reload();return false;}
  window.GameAudio?.effect(this.gun.id);this.ammo--;this.stats.shots++;this.shotCooldown=this.gun.interval;this.muzzle=.075;
  const best=this.targetAtAim();
  if(best){best.hp-=this.gun.damage;best.flash=.12;this.stats.hits++;this.hitFlash=.13;if(best.hp<=0)this.defeat(best);}
  return true;
 },
 defeat(e){
  if(!e.active||e.rewarded)return false;e.active=false;e.rewarded=true;window.GameAudio?.effect(e.kind==='tank'?'explosion':'impact',e.kind==='tank'?1:.5,Math.sin(Math.atan2(e.x-this.player.x,e.z-this.player.z)-this.player.yaw));this.stats.kills++;this.score+=e.kind==='tank'?350:100;
  for(let i=0;i<9;i++)this.particles.push({x:e.x,y:e.y,z:e.z,life:.7,vx:(Math.random()-.5)*5,vy:Math.random()*3,vz:(Math.random()-.5)*5});return true;
 },
 finish(won){
  if(this.resultPaid||this.state!=='PLAYING')return false;this.resultPaid=true;this.state=won?'VICTORY':'DEFEAT';this.resultTimer=2.4;this.fireHeld=this.aiming=this.lookPointerActive=false;
  this.career.kills+=this.stats.kills;if(won){this.stats.missions=1;this.career.wins++;this.career.completed[this.mission.id]=true;}this.saveCareer();return true;
 },
 cameraWalk(dt){
  const p=this.player;this.autoWalking=false;
  // Leave room to aim: advance without a finger on the screen, then stop at
  // engagement distance. Holding cover pauses the advance; the stick overrides it.
  if(this.enemies.some(e=>e.active&&Math.hypot(e.x-p.x,e.z-p.z)<11)||this.targetAtAim())return;
  const free=(x,z)=>x>=-28.6&&x<=28.6&&z>=-8.6&&z<=71.6&&!this.covers.some(c=>Math.abs(x-c.x)<c.w/2+.55&&Math.abs(z-c.z)<c.d/2+.55);
  const fx=Math.sin(p.yaw),fz=Math.cos(p.yaw),rx=Math.cos(p.yaw),rz=-Math.sin(p.yaw),ahead=1.8;
  let side=this.autoWalkSide;
  if(free(p.x+fx*ahead,p.z+fz*ahead))side=0;
  else if(!side){
   const clearance=s=>[.5,1,2,3,4].filter(d=>free(p.x+rx*s*d+fx*ahead,p.z+rz*s*d+fz*ahead)).length;
   side=clearance(1)>=clearance(-1)?1:-1;
  }
  this.autoWalkSide=side;
  const dx=(side?rx*side:fx)*2.8*dt,dz=(side?rz*side:fz)*2.8*dt;
  if(free(p.x+dx,p.z+dz)){p.x+=dx;p.z+=dz;this.autoWalking=true;}
 },
 updateEnemyTactics(e,dt){
  if(e.kind!=='soldier')return;
  const p=this.player,dx=p.x-e.x,dz=p.z-e.z,distance=Math.hypot(dx,dz)||1;
  const free=(x,z)=>x>-27&&x<27&&z>-8&&z<71&&!this.covers.some(c=>Math.abs(x-c.x)<c.w/2+.6&&Math.abs(z-c.z)<c.d/2+.6);
  // Decisions have a duration. Infantry commits to a flank/cover destination
  // instead of vibrating sideways or following the player through a wall.
  e.decision=Math.max(0,(e.decision||0)-dt);
  if(!e.decision){
   e.decision=2.2+(e.phase||0)%1;const side=Math.sin((e.phase||0)*8)>=0?1:-1;
   const hurt=e.hp<100*this.level.health*.45,hidden=this.blocked(e.x,e.z,e.y);
   e.tactic=hurt?'cover':hidden?'flank':distance>23?'advance':'suppress';
   let target={x:e.x,z:e.z};
   if(e.tactic==='cover'){
    const c=this.covers.slice().sort((a,b)=>Math.hypot(a.x-e.x,a.z-e.z)-Math.hypot(b.x-e.x,b.z-e.z))[0];
    if(c)target={x:c.x+side*(c.w/2+.9),z:c.z+(c.z>p.z?1:-1)*(c.d/2+.9)};
   }else if(e.tactic==='flank'||e.tactic==='advance'){
    const forward=e.tactic==='advance'?4:1.5;
    target={x:clamp(e.x+dx/distance*forward-dz/distance*side*4.5,-26,26),z:clamp(e.z+dz/distance*forward+dx/distance*side*4.5,-7,70)};
   }else target={x:clamp(e.x-dz/distance*side*1.4,-26,26),z:clamp(e.z+dx/distance*side*1.4,-7,70)};
   e.destination=target;
  }
  const target=e.destination,tx=target.x-e.x,tz=target.z-e.z,n=Math.hypot(tx,tz);
  const step=Math.min(n,dt*(this.difficulty==='hard'?1.8:this.difficulty==='easy'?.9:1.3));
  let moved=0;
  if(n>.12){const x=e.x+tx/n*step,z=e.z+tz/n*step;
   if(free(x,z)){e.x=x;e.z=z;moved=step;}
   else if(free(x,e.z)){e.x=x;moved=Math.abs(tx/n*step);}
   else if(free(e.x,z)){e.z=z;moved=Math.abs(tz/n*step);}
   else e.decision=0;
  }
  e.stride=(e.stride||0)+moved*5;e.moving=moved>.001;
 },
 step(dt){
  this.autoWalking=false;
  if(this.state==='HAND_CALIBRATION')return;
  if(this.handSession&&!this.handAim?.fresh&&this.state==='PLAYING'){if(!this.handAim?.present)this.handLock=null;return;}
  this.elapsed+=dt;this.bannerTime=Math.max(0,this.bannerTime-dt);this.hitFlash=Math.max(0,this.hitFlash-dt);this.hurtFlash=Math.max(0,this.hurtFlash-dt);this.muzzle=Math.max(0,this.muzzle-dt);
  this.eyeY=(this.coverHeld||this.keys.c)?1.05:1.8;
  if(this.state!=='PLAYING'){
   this.resultTimer-=dt;if(this.resultTimer<=0&&!this.resultSent){this.resultSent=true;window.System?.gameOver?.(this.score,this.state==='VICTORY',0);}return;
  }
  const p=this.player,cameraInput=!!this.handSession,stick=cameraInput?null:this.manualStick,aim=cameraInput?null:this.aimStick,cover=this.coverHeld||this.keys.c;
  const sensitivity=window.ArcadePlaySettings?.get().sensitivity??1;
  if(cameraInput&&this.handAim?.fresh){
   const dx=this.handAim.x-.5,dy=.48-this.handAim.y;
   if(Math.abs(dx)>.045)p.yaw=angle(p.yaw+Math.sign(dx)*(Math.abs(dx)-.045)*2.6*dt*sensitivity);
   if(Math.abs(dy)>.05)p.pitch=clamp(p.pitch+Math.sign(dy)*(Math.abs(dy)-.05)*1.8*dt*sensitivity,-.8,.8);
  }
  p.yaw=angle(p.yaw+(Number(aim?.x)||0)*1.7*dt*sensitivity);p.pitch=clamp(p.pitch+(Number(aim?.y)||0)*1.1*dt*sensitivity,-.8,.8);
  let mx=cameraInput?0:(Number(stick?.x)||0)+Number(!!this.keys.d)-Number(!!this.keys.a),mz=cameraInput?0:(Number(stick?.y)||0)+Number(!!this.keys.w)-Number(!!this.keys.s);
  const length=Math.max(1,Math.hypot(mx,mz));mx/=length;mz/=length;
  if(!cameraInput){p.yaw=angle(p.yaw+(Number(!!this.keys.arrowright)-Number(!!this.keys.arrowleft))*1.5*dt*sensitivity);
  p.pitch=clamp(p.pitch+(Number(!!this.keys.arrowup)-Number(!!this.keys.arrowdown))*dt,-.8,.8);}
  const speed=cover?1.9:6.5,nx=clamp(p.x+(Math.cos(p.yaw)*mx+Math.sin(p.yaw)*mz)*speed*dt,-29,29),nz=clamp(p.z+(-Math.sin(p.yaw)*mx+Math.cos(p.yaw)*mz)*speed*dt,-9,72);
  if(this.handSession&&!stick?.active&&!mx&&!mz&&!cover)this.cameraWalk(dt);
  else if(!this.covers.some(c=>Math.abs(nx-c.x)<c.w/2+.35&&Math.abs(nz-c.z)<c.d/2+.35)){p.x=nx;p.z=nz;}
  this.shotCooldown=Math.max(-.05,this.shotCooldown-dt);
  if(this.reloadTime>0){this.reloadTime=Math.max(0,this.reloadTime-dt);if(this.reloadTime===0){const n=Math.min(this.gun.mag-this.ammo,this.reserve);this.ammo+=n;this.reserve-=n;this.stats.reloads++;}}
  let automatic=false;
  if(this.handSession){
   const target=this.handAim?.fresh?this.targetAtAim():null;
   if(!target)this.handLock=null;
   else if(this.handLock?.target===target){this.handLock.time=Math.max(this.handLock.time+dt,Math.max(0,((this.handAim.timestamp||0)-this.handLock.firstSample)/1000));automatic=this.handLock.time>=.12;}
   else this.handLock={target,time:0,firstSample:this.handAim.timestamp||0};
   // The camera follows the hand; the weapon and reticle share its centre.
  }
  if(automatic||(!this.handSession&&(this.fireHeld||this.keys[' ']))){const debt=this.shotCooldown;if(this.shoot())this.shotCooldown=Math.max(0,this.shotCooldown+Math.min(0,debt));}else this.shotCooldown=Math.max(0,this.shotCooldown);
  if(!this.enemies.some(e=>e.active)){
   this.waveDelay-=dt;
   if(this.waveDelay<=0){if(this.wave>=this.mission.waves)this.finish(true);else{this.spawnWave();this.waveDelay=2.5;this.reserve=Math.max(this.reserve,this.gun.mag*2);p.hp=Math.min(100,p.hp+18);}}
  }
  for(const e of this.enemies){
   if(!e.active)continue;e.flash=Math.max(0,e.flash-dt);e.aim-=dt;
   if(e.kind==='drone')e.y=5+Math.sin(this.elapsed*1.5+e.phase)*.8;
   this.updateEnemyTactics(e,dt);
   if(e.aim<=0){
    if(!this.blocked(e.x,e.z,e.y)){const damage=this.level.damage*(e.kind==='tank'?1.7:1)*(cover?.25:1);p.hp=Math.max(0,p.hp-damage);this.hurtFlash=.15;if(cover)this.stats.blocks++;}
    e.aim=this.level.aim+1.2;e.shot=.14;
   }
   e.shot=Math.max(0,(e.shot||0)-dt);
  }
  for(const f of this.particles){f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.z+=f.vz*dt;}this.particles=this.particles.filter(f=>f.life>0);
  const moving=this.autoWalking||(!cameraInput&&Math.hypot(mx,mz)>.15);
  if(moving&&this.elapsed-this.lastStepSound>(cover?.55:.36)){this.lastStepSound=this.elapsed;window.GameAudio?.effect('step',.55);}
  if(p.hp<=0)this.finish(false);
 },
 update(ctx,w,h){
  const now=performance.now(),dt=clamp((now-this.lastTime)/1000,0,.05);this.lastTime=now;if(!this.player)return 0;
  if(this.handSession?.controller)this.handAim=this.handSession.controller.read(now);
  if(this.state==='HAND_CALIBRATION'){this.viewSize={w,h};ctx.fillStyle='#102737';ctx.fillRect(0,0,w,h);return this.score;}
  this.viewSize={w,h};this.step(dt);this.drawVirtualScene(ctx,w,h);this.drawHUD(ctx,w,h);return this.score;
 },
 project(x,y,z,w,h){
  const p=this.player,dx=x-p.x,dz=z-p.z,cy=Math.cos(p.yaw),sy=Math.sin(p.yaw),rx=dx*cy-dz*sy,rz=dx*sy+dz*cy,dy=y-this.eyeY,cp=Math.cos(p.pitch),sp=Math.sin(p.pitch),depth=rz*cp+dy*sp;
  if(depth<.25)return null;const f=this.focalLength(w,h);return{x:w/2+rx*f/depth,y:h*.48-(dy*cp-rz*sp)*f/depth,s:f/depth,z:depth};
 },
 drawVirtualScene: function(ctx,w,h){
  this.viewSize={w,h};const camera=false; // Front camera is a hand sensor; the battlefield remains the game world.
  ctx.clearRect(0,0,w,h);
  const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#152d46');bg.addColorStop(.46,'#8aabad');bg.addColorStop(.48,'#6c7566');bg.addColorStop(1,'#263d3e');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  if(window.ArcadeWorldRenderer?.combat(this,ctx,w,h,camera)){this.drawCombatSignals(ctx,w,h);return;}
  const faces=[];
  const face=(vertices,color)=>{const points=vertices.map(v=>this.project(...v,w,h));if(points.some(p=>!p))return;faces.push({points,color,z:points.reduce((s,p)=>s+p.z,0)/points.length});};
  const box=(x,y,z,bw,bh,bd,color)=>{
   const v=[[-1,0,-1],[1,0,-1],[1,0,1],[-1,0,1],[-1,1,-1],[1,1,-1],[1,1,1],[-1,1,1]].map(([a,b,c])=>[x+a*bw/2,y+b*bh,z+c*bd/2]);
   for(const [indices,tint] of [[[0,1,5,4],color],[[1,2,6,5],color],[[2,3,7,6],color],[[3,0,4,7],color],[[4,5,6,7],color]])face(indices.map(i=>v[i]),tint);
  };
  if(!camera){
   for(let z=0;z<100;z+=10)face([[-32,0,z],[32,0,z],[32,0,z+1],[-32,0,z+1]],'rgba(177,194,171,.14)');
   for(let i=0;i<10;i++){const side=i%2?1:-1;box(side*(22+i%3*3),0,15+Math.floor(i/2)*18,7,5+i%4*3,9,i%2?'#607277':'#76858a');box(side*(22+i%3*3),5+i%4*3,15+Math.floor(i/2)*18,7.5,.3,9.5,'#a2aca6');}
  }
  for(const c of this.covers){box(c.x,0,c.z,c.w,c.h,c.d,'#5a6964');box(c.x,c.h,c.z,c.w+.12,.12,c.d+.12,'#b4b89a');}
  for(const e of this.enemies){
   if(!e.active)continue;const color=e.flash?'#f2ebca':e.kind==='tank'?'#66784e':'#586a61';
   if(e.kind==='soldier'){
    const walk=Math.sin(this.elapsed*4+e.phase)*.12;
    box(e.x-.21,0,e.z+walk,.3,.82,.32,'#273b3b');box(e.x+.21,0,e.z-walk,.3,.82,.32,'#314846');
    box(e.x,.75,e.z,.86,.84,.48,color);box(e.x,1.58,e.z,.48,.39,.43,'#a2a891');box(e.x,1.94,e.z,.58,.17,.5,'#354c46');
    box(e.x,1.74,e.z-.225,.36,.1,.03,'#61c6c2');box(e.x+.5,1.1,e.z-.32,.22,.23,.95,'#202f35');
   }else if(e.kind==='drone'){
    box(e.x,e.y-.25,e.z,1.1,.45,.8,color);for(const s of [-1,1]){box(e.x+s,e.y,e.z,1,.1,.13,'#a7b5b5');box(e.x+s,e.y+.12,e.z,1.5,.035,.18,'#293f49');}box(e.x,e.y-.13,e.z-.5,.25,.12,.04,'#f6a050');
   }else{
    box(e.x,0,e.z,4.8,.75,5.4,'#2c3e36');box(e.x,.7,e.z,4.3,1.1,4.5,color);box(e.x,1.8,e.z,2.8,.8,2.7,'#83916b');box(e.x,2.1,e.z-2.5,.26,.26,4,'#394f42');
   }
  }
  faces.sort((a,b)=>b.z-a.z);for(const f of faces){ctx.beginPath();f.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=f.color;ctx.fill();ctx.strokeStyle='rgba(10,26,32,.2)';ctx.lineWidth=.6;ctx.stroke();}
  // First-person weapon, below the reticle. All targets are rendered game objects.
  const bx=w*.62,by=h*.83,unit=Math.min(w,h)*.16;ctx.fillStyle='#293e44';ctx.fillRect(bx,by,unit*.48,unit*1.6);ctx.fillStyle='#5b7175';ctx.fillRect(bx+unit*.08,by-unit*.65,unit*.25,unit*1.5);ctx.fillStyle='#152b32';ctx.fillRect(bx+unit*.12,by-unit*.9,unit*.17,unit*.6);
  if(this.muzzle>0){ctx.fillStyle='#ffe4a0';ctx.beginPath();ctx.arc(bx+unit*.20,by-unit*.95,unit*.3,0,Math.PI*2);ctx.fill();}
  this.drawCombatSignals(ctx,w,h);
 },
 drawCombatSignals(ctx,w,h){
  for(const e of this.enemies){
   if(!e.active)continue;const p=this.project(e.x,e.kind==='soldier'?2.7:e.y+1.8,e.z,w,h);if(!p)continue;
   ctx.strokeStyle=e.aim<.8?'#ffba55':'#e58d77';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(6,Math.min(13,p.s*.5)),-Math.PI/2,-Math.PI/2+Math.PI*2*(1-clamp(e.aim/(this.level.aim+1.2),0,1)));ctx.stroke();
   if(this.handLock?.target===e||Math.hypot(e.x-this.player.x,e.z-this.player.z)<22){const width=clamp(p.s*1.1,22,46),maxHP=(e.kind==='tank'?260:e.kind==='drone'?70:100)*this.level.health;ctx.fillStyle='#142c35';ctx.fillRect(p.x-width/2,p.y-20,width,4);ctx.fillStyle=e.flash?'#fff0bf':'#e3b17b';ctx.fillRect(p.x-width/2,p.y-20,width*clamp(e.hp/maxHP,0,1),4);}
   if(e.shot>0){ctx.strokeStyle='rgba(255,187,87,.8)';ctx.beginPath();ctx.moveTo(p.x,p.y+20);ctx.lineTo(w*.5,h*.76);ctx.stroke();}
  }
  for(const f of this.particles){const p=this.project(f.x,f.y,f.z,w,h);if(p){ctx.fillStyle='rgba(255,194,94,'+f.life+')';ctx.fillRect(p.x,p.y,Math.max(2,p.s*.15),Math.max(2,p.s*.15));}}
  if(this.hurtFlash>0){ctx.fillStyle='rgba(175,54,33,.17)';ctx.fillRect(0,0,w,h);}
 },
 drawHUD(ctx,w,h){
  ctx.save();ctx.textAlign='left';const size=Math.min(16,Math.max(11,w*.032));ctx.font='bold '+size+'px Arial';
  const compact=h<500,shortPortrait=!compact&&h<700,hx=compact?87:12,hy=compact?9:Math.max(110,h*.13),hw=compact?Math.min(w-285,550):w-24,hh=compact?44:shortPortrait?108:65,textW=compact?hw-22:Math.min(hw-22,w*.51);
  ctx.fillStyle='rgba(5,20,29,.74)';ctx.fillRect(hx,hy,hw,hh);ctx.fillStyle='#e9f2ed';ctx.fillText(this.mission.name+' • '+this.difficulty.toUpperCase(),hx+11,hy+(compact?17:22),textW);
  ctx.fillStyle='#9ed9ce';ctx.fillText('SETOR '+Math.max(1,this.wave)+'/'+this.mission.waves+'   •   ALVOS '+this.enemies.filter(e=>e.active).length,hx+11,hy+(compact?35:46),textW);
  const y=shortPortrait?hy+62:h*.72,panelW=Math.min(w*.60,320),infoX=shortPortrait?hx+11:w/2;ctx.fillStyle='rgba(5,20,29,.74)';if(!shortPortrait)ctx.fillRect((w-panelW)/2,y,panelW,50);ctx.textAlign=shortPortrait?'left':'center';ctx.fillStyle=this.player.hp<30?'#ffb587':'#c4eddd';ctx.fillText('VIDA '+Math.ceil(this.player.hp)+'   •   '+this.gun.name,infoX,y+19,w*.55);ctx.fillStyle='#fff';ctx.fillText(this.reloadTime>0?'RECARREGANDO '+this.reloadTime.toFixed(1)+'s':this.ammo+' / '+this.reserve,infoX,y+40,w*.55);ctx.textAlign='center';
  const cx=this.handAim&&!this.handSession?this.handAim.x*w:w/2,cy=this.handAim&&!this.handSession?this.handAim.y*h:h*.48;ctx.strokeStyle=this.hitFlash>0?'#ffcc80':'#eaf9e4';ctx.lineWidth=2;
  for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(cx+s*5,cy);ctx.lineTo(cx+s*14,cy);ctx.moveTo(cx,cy+s*5);ctx.lineTo(cx,cy+s*14);ctx.stroke();}
  if(this.handLock){ctx.strokeStyle=this.handLock.time>=.12?'#9eebc4':'#e2c28a';ctx.beginPath();ctx.arc(cx,cy,20,-Math.PI/2,-Math.PI/2+Math.PI*2*clamp(this.handLock.time/.12,0,1));ctx.stroke();}
  const statusY=compact?h*.24:hy+hh+20;ctx.fillStyle='#e1eee8';ctx.font='10px Arial';ctx.fillText(window.ArcadeControls?.mode==='camera'?(this.handAim?.fresh?(this.autoWalking?'AVANÇO AUTOMÁTICO • MIRE COM A MÃO':'MÃO DIREITA • DISPARO AO ALINHAR NO ADVERSÁRIO'):'RASTREAMENTO PAUSADO • MOSTRE A MÃO DIREITA'):(this.aiming?'MIRA APROXIMADA • TOQUE EM MIRAR PARA SOLTAR':'ARRASTE NA CENA PARA OLHAR • ATIRAR PARA DISPARAR'),w/2,statusY,w-24);
  const nearest=this.enemies.filter(e=>e.active).sort((a,b)=>Math.hypot(a.x-this.player.x,a.z-this.player.z)-Math.hypot(b.x-this.player.x,b.z-this.player.z))[0];
  if(nearest){const bearing=angle(Math.atan2(nearest.x-this.player.x,nearest.z-this.player.z)-this.player.yaw);if(Math.abs(bearing)>.48){ctx.fillStyle='#f0c999';ctx.fillText(bearing>0?'ALVO À DIREITA →':'← ALVO À ESQUERDA',w/2,statusY+20,w-28);}}
  if(this.coverHeld){ctx.fillStyle='#9ce8d2';ctx.fillText('EM COBERTURA • DANO REDUZIDO',w/2,h*.64,w-30);}
  if(this.state==='VICTORY'||this.state==='DEFEAT'){ctx.fillStyle='rgba(6,18,27,.86)';ctx.fillRect(0,h*.34,w,h*.28);ctx.fillStyle=this.state==='VICTORY'?'#a3edbd':'#ffbe9c';ctx.font='bold 23px Arial';ctx.fillText(this.state==='VICTORY'?'OPERAÇÃO CONCLUÍDA':'TENTE OUTRA ESTRATÉGIA',w/2,h*.44,w-24);ctx.font='14px Arial';ctx.fillText(this.stats.kills+' alvos • '+this.stats.hits+'/'+this.stats.shots+' acertos',w/2,h*.50,w-24);}
  ctx.restore();
 },
 cleanup(){
  this.handSession?.dispose();this.handSession=null;this.handAim=null;
  window.ArcadeWorldRenderer?.release(this);
  this.release?.();if(this.keyDown)window.removeEventListener?.('keydown',this.keyDown);if(this.keyUp)window.removeEventListener?.('keyup',this.keyUp);if(this.release){window.removeEventListener?.('blur',this.release);window.removeEventListener?.('arcade:release-inputs',this.release);}this.resultSent=false;
 }
};
const register=()=>{if(!window.System?.registerGame)return false;window.System.registerGame('ar_truck_sim','WAR Combate','🎯',Game,{camera:'hand',camOpacity:0,phases:MISSIONS.map(m=>({id:m.id,name:m.name,desc:m.desc,reqLvl:1}))});return true;};
if(!register()){const timer=setInterval(()=>{if(register())clearInterval(timer)},100);}
})();

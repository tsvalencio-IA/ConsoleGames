/* WAR Combate — câmera opcional, arena virtual, alvos somente do jogo.
 * O identificador legado conserva as permissões originais. O progresso de
 * combate usa um novo namespace e nunca converte cargas antigas em vitórias. */
(function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
const MISSIONS=[
 {id:'patrol',name:'PATRULHA • PORTO',waves:2,count:3,desc:'Atravesse os corredores de contêineres, libere a carga e alcance o embarque.',route:[{x:-4,z:26},{x:12,z:62}],covers:[{x:-11,z:15,w:8,h:3,d:10,type:'container'},{x:10,z:17,w:7,h:3,d:9,type:'container'},{x:-14,z:38,w:10,h:3,d:9,type:'container'},{x:8,z:43,w:6,h:1.3,d:3,type:'crate'}]},
 {id:'city',name:'CERCO • CIDADE',waves:3,count:4,desc:'Recupere a praça e mantenha cada ponto de comunicação contra ataques pelos flancos.',route:[{x:-8,z:24},{x:10,z:40},{x:-10,z:60}],covers:[{x:-15,z:13,w:6,h:1.1,d:3,type:'planter'},{x:8,z:24,w:5,h:1.4,d:2,type:'barrier'},{x:-7,z:41,w:6,h:1.2,d:3,type:'planter'},{x:20,z:49,w:3,h:2.6,d:7,type:'car'}]},
 {id:'extraction',name:'EXTRAÇÃO • FORTALEZA',waves:4,count:4,desc:'Desative dois transmissores, atravesse a fortaleza e abra a zona de extração.',route:[{x:10,z:23},{x:-10,z:43},{x:0,z:55},{x:0,z:68}],covers:[{x:-10,z:14,w:11,h:2.7,d:3,type:'stone'},{x:13,z:33,w:12,h:2.5,d:3,type:'stone'},{x:-17,z:51,w:7,h:3,d:6,type:'stone'},{x:9,z:56,w:6,h:1.2,d:3,type:'stone'}]}
];
const TRAINING={id:'training',name:'TREINO • MIRA E CALIBRAÇÃO',waves:0,count:0,desc:'Teste mira, movimento e disparo com controles ou câmera, sem dano ou limite de tempo.',route:[{x:0,z:20}],covers:[]};
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
  window.ArcadeWorldRenderer?.release(this);document.body?.classList?.add('war-playing');
  this.weaponKick=0;this.bulletMarks=[];this.damageBearing=0;this.damageTime=0;this.weaponMotion=null;
  this.training=fase?.id==='training';this.practiceMovement=false;this.trainingTargets=0;this.trainingNext=0;this.mission=this.training?TRAINING:MISSIONS.find(m=>m.id===(fase?.missionId||fase?.id))||MISSIONS[0];
  this.difficulty=window.ArcadePlaySettings?.get().difficulty||'normal';this.level=LEVELS[this.difficulty]||LEVELS.normal;
  this.careerKey='thia:ar-combat:v1:'+(window.System?.playerId||'local');
  let saved={};try{saved=JSON.parse(localStorage.getItem(this.careerKey)||'{}')||{}}catch{}
  this.career={wins:Math.max(0,Math.floor(Number(saved.wins)||0)),kills:Math.max(0,Number(saved.kills)||0),completed:saved.completed&&typeof saved.completed==='object'?saved.completed:{},weapon:saved.weapon||'rifle'};
  this.eyeY=1.8;this.crouched=false;this.handViewAnchor=null;this.handAim=null;this.handLock=null;this.player={x:0,z:0,yaw:0,pitch:0,hp:100};this.keys={};this.manualStick={x:0,y:0,active:false};this.aimStick={x:0,y:0,active:false};
  this.fireHeld=false;this.firePressed=false;this.sprintHeld=false;this.sprinting=false;this.autoFireLock=null;this.coverHeld=false;this.aiming=false;this.lookPointerActive=false;this.autoWalkSide=0;this.autoWalking=false;this.reloadTime=0;this.shotCooldown=0;this.hitFlash=0;this.hurtFlash=0;this.muzzle=0;
  this.stats={kills:0,hits:0,shots:0,reloads:0,blocks:0,missions:0};this.score=0;this.lastStepSound=0;this.wave=0;this.waveDelay=2;this.bannerTime=3.5;
  this.enemies=[];this.particles=[];this.elapsed=0;this.lastDamageAt=0;this.gun=WEAPONS[0];this.selectWeapon(this.career.weapon,true);
  this.resetOperation();if(this.training)this.resetTraining();
  this.keyDown=e=>{if(e.target?.closest?.('input,select,textarea')||window.System?.paused)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowleft','arrowright','arrowup','arrowdown',' ','r','c','shift'].includes(k)){e.preventDefault();this.keys[k]=true;if(k===' '&&!e.repeat)this.requestFire(false);if(k==='r'&&!e.repeat)this.reload();if(k==='c'&&!e.repeat)this.toggleCrouch();}};
  this.keyUp=e=>{this.keys[e.key.toLowerCase()]=false};this.release=()=>{this.keys={};this.sprintHeld=this.sprinting=this.fireHeld=this.firePressed=this.coverHeld=this.aiming=this.lookPointerActive=false;this.autoFireLock=null;for(const s of [this.manualStick,this.aimStick])if(s){s.x=s.y=0;s.active=false;}};
  window.addEventListener('keydown',this.keyDown);window.addEventListener('keyup',this.keyUp);window.addEventListener('blur',this.release);window.addEventListener('arcade:release-inputs',this.release);
  if(window.ArcadeControls?.mode==='camera'&&window.WarHandControl){this.state='HAND_CALIBRATION';this.handSession=window.WarHandControl.start(this);}
  this.practiceUI=window.WarPracticeUI?.start(this);
  if(fase?.online&&!this.training){this.net=window.WarMultiplayer?.create(this);if(this.state!=='HAND_CALIBRATION')this.state='NET_LOBBY';if(!this.net)window.System?.msg('MULTIPLAYER INDISPONÍVEL • ATUALIZE O JOGO');}
 },
 selectWeapon(id,initial=false){
  const gun=WEAPONS.find(w=>w.id===id);if(!gun||this.career.wins<gun.requires)return false;
  if(!initial&&this.state==='PLAYING'&&(this.stats.shots>0||this.wave>0))return false;
  this.gun=gun;this.ammo=gun.mag;this.reserve=gun.reserve;this.reloadTime=0;this.career.weapon=gun.id;this.saveCareer();if(!initial)window.ArcadeWorldRenderer?.release(this);return true;
 },
 saveCareer(){if(this.training)return;try{localStorage.setItem(this.careerKey,JSON.stringify(this.career))}catch{}},
 resetOperation(){this.covers=this.mission.covers.map(c=>({...c}));if(!this.training){const extra={patrol:[{x:-22,z:26,w:5,h:1.4,d:4,type:'crate'},{x:21,z:45,w:5,h:1.2,d:3,type:'crate'},{x:0,z:54,w:5,h:1.1,d:2,type:'barrier'}],city:[{x:-20,z:34,w:5,h:1.3,d:2,type:'barrier'},{x:19,z:18,w:5,h:1.2,d:3,type:'planter'},{x:12,z:56,w:5,h:1.2,d:2,type:'barrier'}],extraction:[{x:21,z:18,w:5,h:1.2,d:2,type:'stone'},{x:-22,z:38,w:5,h:1.3,d:2,type:'stone'},{x:17,z:64,w:4,h:1.2,d:3,type:'crate'}]};this.covers.push(...(extra[this.mission.id]||[]).map(c=>({...c})));}this.objective={phase:'approach',progress:0,required:0,secured:0};},
 reload(){if(this.state!=='PLAYING'||this.reloadTime>0||this.ammo>=this.gun.mag||this.reserve<=0)return false;this.reloadTime=this.gun.reload;window.GameAudio?.effect('reload');return true;},
 spawnPosition(x,z,radius=.8){const free=(px,pz)=>px>=-26&&px<=26&&pz>=0&&pz<=69&&!this.covers.some(c=>Math.abs(px-c.x)<c.w/2+radius&&Math.abs(pz-c.z)<c.d/2+radius)&&!this.enemies.some(e=>e.active&&Math.hypot(px-e.x,pz-e.z)<1.7);if(free(x,z))return{x,z};for(let r=2;r<=24;r+=2)for(let i=0;i<12;i++){const px=x+Math.cos(i*Math.PI/6)*r,pz=z+Math.sin(i*Math.PI/6)*r;if(free(px,pz))return{x:px,z:pz};}throw Error('Não há posição livre neste setor.');},
 spawnWave(){
  if(this.training)return;
  this.wave++;this.bannerTime=2.4;this.enemies=[];
  const count=this.mission.count+this.level.count+this.wave-1;
  for(let i=0;i<count;i++){
   const kind=this.mission.id==='extraction'&&this.wave===this.mission.waves&&i===count-1?'tank':this.mission.id!=='patrol'&&i%3===2?'drone':'soldier';
   const point=this.mission.route[this.wave-1],side=i%2?1:-1;
   const x=this.mission.id==='city'?(i===0?point.x*.25:side*(15+i%2*5)):clamp(point.x+(i-(count-1)/2)*5,-24,24),z=this.mission.id==='city'?clamp(point.z+(i===0?10:(i%3-1)*10),14,68):clamp(point.z+8+(i%3)*4,16,68);
   const spawn=this.spawnPosition(x,z,kind==='tank'?3:kind==='drone'?1.2:.8);this.enemies.push({id:this.wave+':'+i,kind,...spawn,y:kind==='drone'?5:1.15,hp:(kind==='tank'?260:kind==='drone'?70:100)*this.level.health,active:true,aim:this.level.aim+1.5+i*.35,flash:0,phase:i*.7,role:['assault','flank','support'][i%3],rewarded:false});
  }
  if(this.mission.id==='extraction'&&this.wave<3){const p=this.mission.route[this.wave-1];this.enemies.push({id:this.wave+':relay',kind:'relay',x:p.x,y:1.6,z:p.z+5,hp:102,active:true,aim:999999,flash:0,phase:0,rewarded:false});}
  Object.assign(this.objective,{phase:'combat',progress:0,required:this.mission.id==='city'?4+this.wave*2:.8});
 },
 resetTraining(){this.trainingTargets=0;this.trainingNext=0;this.stats.shots=this.stats.hits=0;this.player={x:0,z:0,yaw:0,pitch:0,hp:100};this.handViewAnchor=null;this.ammo=this.gun.mag;this.reserve=9999;this.enemies=[];this.nextPracticeTarget();},
 nextPracticeTarget(){const poses=[[0,1.8,20],[-4,1.8,20],[4,1.8,20],[0,4.4,20],[0,.6,20]],[x,y,z]=poses[this.trainingTargets%poses.length];this.enemies=[{id:'practice:'+this.trainingTargets,kind:'practice',x,y,z,hp:1,active:true,aim:999999,flash:0,phase:0}];this.handLock=null;this.trainingNext=0;},
 objectivePoint(){return this.mission.route[Math.max(0,this.wave-1)];},
 objectiveHint(){if(this.training)return this.trainingTargets+' ALVOS · '+this.stats.hits+'/'+this.stats.shots+' ACERTOS · SEM DANO';const o=this.objective,targets=this.enemies.filter(e=>e.active&&!e.ally).length,p=this.objectivePoint(),distance=Math.ceil(Math.hypot(p.x-this.player.x,p.z-this.player.z));return targets?'SETOR '+this.wave+'/'+this.mission.waves+' · '+targets+' ALVOS'+(this.enemies.some(e=>e.kind==='relay'&&e.active)?' · DESATIVE O TRANSMISSOR':''):o.phase==='hold'?'MANTENHA A PRAÇA · '+Math.ceil(Math.max(0,o.required-o.progress))+'s · '+distance+'m':o.phase==='approach'?'PRÓXIMO SETOR · PREPARE A MIRA':(this.wave===this.mission.waves?'ALCANCE A EXTRAÇÃO':'ASSEGURE O SETOR')+' · '+distance+'m';},
 advanceOperation(dt,players=[this.player]){
  if(this.training)return false;
  const active=this.enemies.some(e=>e.active&&!e.ally),o=this.objective,point=this.objectivePoint(),reached=players.some(p=>p&&Math.hypot(p.x-point.x,p.z-point.z)<(this.mission.id==='city'?6:3));
  if(this.wave>0&&this.mission.id==='city'&&o.phase!=='approach'){const contested=this.enemies.some(e=>e.active&&!e.ally&&Math.hypot(e.x-point.x,e.z-point.z)<5);if(reached&&!contested)o.progress=Math.min(o.required,o.progress+dt);}
  if(active)return false;
  if(!this.wave||this.objective.phase==='approach'){
   this.waveDelay-=dt;if(this.waveDelay<=0){this.spawnWave();this.waveDelay=1.2;this.reserve=Math.max(this.reserve,this.gun.mag*2);for(const p of players)if(p.hp!==undefined)p.hp=Math.min(100,p.hp+18);}return false;
  }
  o.phase=this.mission.id==='city'?'hold':this.wave===this.mission.waves?'extract':'secure';
  if(reached&&this.mission.id!=='city')o.progress=Math.min(o.required,o.progress+dt);
  if(o.progress+1e-7<o.required)return false;
  o.secured=this.wave;if(this.wave===this.mission.waves){o.phase='complete';return true;}
  o.phase='approach';this.waveDelay=1.2;return false;
 },
 // The same wall depth test is used by hits, enemy fire and rendered occlusion.
 blocked(x,z,y,p=this.player,eye=this.eyeY){
  const dx=x-p.x,dz=z-p.z;
  return this.covers.some(c=>{
   const tx=Math.abs(dx)<1e-8?[-Infinity,Infinity]:[(c.x-c.w/2-p.x)/dx,(c.x+c.w/2-p.x)/dx].sort((a,b)=>a-b);
   const tz=Math.abs(dz)<1e-8?[-Infinity,Infinity]:[(c.z-c.d/2-p.z)/dz,(c.z+c.d/2-p.z)/dz].sort((a,b)=>a-b);
   if(Math.abs(dx)<1e-8&&Math.abs(p.x-c.x)>c.w/2||Math.abs(dz)<1e-8&&Math.abs(p.z-c.z)>c.d/2)return false;
   const t=Math.max(0,tx[0],tz[0]),end=Math.min(1,tx[1],tz[1]);
   return t<=end&&t>0.001&&t<.99&&(eye+(y-eye)*t)<c.h;
  });
 },
 toggleCrouch(){this.crouched=!this.crouched;this.eyeY=this.crouched?1.05:1.8;return this.crouched;},
 setAiming(value){this.aiming=!!value&&this.state==='PLAYING'&&!this.handSession&&!window.System?.paused;return this.aiming;},
 focalLength(w,h){return Math.min(w,h)*.88*(this.aiming?1.65:1);},
 lookBy(dx,dy,w,h){
  if(this.state!=='PLAYING'||this.handSession||window.System?.paused||w<=0||h<=0||!Number.isFinite(dx)||!Number.isFinite(dy))return;
  // A swipe is a distance, not a held axis: holding a finger still never turns.
  const settings=window.ArcadePlaySettings?.get()||{},steady=this.aiming&&settings.combatAimAssist===true&&this.targetAtAim()? .55:1,scale=1.6*(settings.sensitivity??1)*(this.aiming?(settings.adsSensitivity??1):1)*steady/this.focalLength(w,h);
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
   if(!e.active||e.ally)continue;const dx=e.x-p.x,dz=e.z-p.z,distance=Math.hypot(dx,dz),dy=e.y-this.eyeY;
   const radius=e.kind==='tank'?2.6:e.kind==='relay'?1:e.kind==='drone'?.85:.72;
   const height=e.kind==='soldier'?(e.crouched?.8:1.08):radius,minPitch=Math.atan2(dy-height,distance),maxPitch=Math.atan2(dy+height,distance);
   if(Math.abs(angle(Math.atan2(dx,dz)-ray.yaw))<Math.atan2(radius,distance)&&ray.pitch>minPitch&&ray.pitch<maxPitch&&distance<bestDistance&&!this.blocked(e.x,e.z,e.y)){best=e;bestDistance=distance;}
  }
  return best;
 },
 requestFire(hold=true){
  if(this.state!=='PLAYING'||window.System?.paused||this.handSession||this.net&&this.player.hp<=0)return false;
  // Preserve one press across a down/up pair between simulation ticks. The
  // simulation still owns ammunition, recoil, cooldown and network shots.
  if(hold)this.fireHeld=true;this.firePressed=true;return true;
 },
 releaseFire(cancel=false){this.fireHeld=false;if(cancel)this.firePressed=false;},
 shoot(){
  if(this.state!=='PLAYING'||this.reloadTime>0||this.shotCooldown>0)return false;
  if(this.ammo<=0){this.reload();return false;}
  window.GameAudio?.effect(this.gun.id);this.ammo--;this.stats.shots++;this.shotCooldown=this.gun.interval;this.muzzle=.075;this.weaponKick=1;
  const best=this.targetAtAim();this.recordImpact(best);
  if(this.net){this.net.fire(best);if(best){this.stats.hits++;this.hitFlash=.13;}return true;}
  if(best){best.hp-=this.gun.damage;best.flash=.12;best.suppressed=.65;this.stats.hits++;this.hitFlash=.13;if(best.hp<=0)this.defeat(best);}
  return true;
 },
 defeat(e,credit=true){
  if(!e.active||e.rewarded)return false;if(this.training&&e.kind==='practice'){e.active=false;this.trainingTargets++;this.trainingNext=.65;window.GameAudio?.effect('impact',.5);return true;}e.active=false;e.defeatedAt=this.elapsed;e.rewarded=true;window.GameAudio?.effect(e.kind==='tank'?'explosion':'impact',e.kind==='tank'?1:.5,Math.sin(Math.atan2(e.x-this.player.x,e.z-this.player.z)-this.player.yaw));if(credit){this.stats.kills++;this.score+=e.kind==='tank'?350:100;}
  for(let i=0;i<9;i++)this.particles.push({x:e.x,y:e.y,z:e.z,life:.7,vx:(Math.random()-.5)*5,vy:Math.random()*3,vz:(Math.random()-.5)*5});return true;
 },
 finish(won){
  if(this.training||this.resultPaid||this.state!=='PLAYING')return false;this.resultPaid=true;this.state=won?'VICTORY':'DEFEAT';this.resultTimer=2.4;this.sprintHeld=this.sprinting=this.fireHeld=this.firePressed=this.aiming=this.lookPointerActive=false;
  this.career.kills+=this.stats.kills;if(won){this.stats.missions=1;this.career.wins++;this.career.completed[this.mission.id]=true;}this.saveCareer();return true;
 },
 cameraWalk(dt){
  if(this.training&&!this.practiceMovement)return;
  const p=this.player;this.autoWalking=false;
  // Leave room to aim: advance without a finger on the screen, then stop at
  // engagement distance. Holding cover pauses the advance; the stick overrides it.
  if(this.enemies.some(e=>e.active&&!e.ally&&Math.hypot(e.x-p.x,e.z-p.z)<14)||this.targetAtAim())return;
  const free=(x,z)=>x>=-28.6&&x<=28.6&&z>=-8.6&&z<=71.6&&!this.covers.some(c=>Math.abs(x-c.x)<c.w/2+.55&&Math.abs(z-c.z)<c.d/2+.55);
  const objective=!this.enemies.some(e=>e.active&&!e.ally)&&this.wave>0?this.objectivePoint():null,dxGoal=objective?objective.x-p.x:0,dzGoal=objective?objective.z-p.z:0,distance=Math.hypot(dxGoal,dzGoal);
  if(objective&&distance<2.2)return;
  const fx=objective?dxGoal/distance:Math.sin(p.yaw),fz=objective?dzGoal/distance:Math.cos(p.yaw),rx=fz,rz=-fx,ahead=1.8;
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
 recordImpact(target){
  const ray=this.aimRay(),p=this.player,cp=Math.cos(ray.pitch),direction=[Math.sin(ray.yaw)*cp,Math.sin(ray.pitch),Math.cos(ray.yaw)*cp],origin=[p.x,this.eyeY,p.z];let hit=null,best=target?Math.hypot(target.x-p.x,target.z-p.z):85;
  for(const c of this.covers){let near=0,far=85,axis=-1,sign=0;const mins=[c.x-c.w/2,0,c.z-c.d/2],maxs=[c.x+c.w/2,c.h,c.z+c.d/2];for(let i=0;i<3;i++){if(Math.abs(direction[i])<1e-8){if(origin[i]<mins[i]||origin[i]>maxs[i]){far=-1;break;}continue;}const a=(mins[i]-origin[i])/direction[i],b=(maxs[i]-origin[i])/direction[i],lo=Math.min(a,b),hi=Math.max(a,b);if(lo>near){near=lo;axis=i;sign=direction[i]>0?-1:1;}far=Math.min(far,hi);}if(near<=far&&near>.1&&near<best){best=near;const point=origin.map((v,i)=>v+direction[i]*near);hit={x:point[0],y:point[1],z:point[2],axis,sign,at:this.elapsed};}}
  if(hit){this.bulletMarks.push(hit);if(this.bulletMarks.length>28)this.bulletMarks.shift();}this.lastShotHit=!!target;
 },
 updateEnemyAwareness(e,dt,p=this.player){
  e.suppressed=Math.max(0,(e.suppressed||0)-dt);
  const visible=Math.hypot(p.x-e.x,p.z-e.z)<(e.kind==='drone'?65:55)&&!this.blocked(e.x,e.z,e.y,p,Number(p.eyeY)||this.eyeY);
  e.sight=visible?Math.min(3,(e.sight||0)+dt):0;
  if(!visible)e.aim=Math.max(e.aim,this.level.aim*.55);
  if(e.suppressed>0)e.aim=Math.max(e.aim,.45);
  return visible;
 },
 updateEnemyTactics(e,dt,p=this.player){
  if(e.kind!=='soldier')return;
  const dx=p.x-e.x,dz=p.z-e.z,distance=Math.hypot(dx,dz)||1;
  const free=(x,z)=>x>-27&&x<27&&z>-8&&z<71&&!this.covers.some(c=>Math.abs(x-c.x)<c.w/2+.6&&Math.abs(z-c.z)<c.d/2+.6);
  // Decisions have a duration. Infantry commits to a flank/cover destination
  // instead of vibrating sideways or following the player through a wall.
  e.decision=Math.max(0,(e.decision||0)-dt);
  if(!e.decision){
   e.decision=2.2+(e.phase||0)%1;const side=Math.sin((e.phase||0)*8)>=0?1:-1;
   const hurt=e.hp<100*this.level.health*.45,hidden=this.blocked(e.x,e.z,e.y,p,Number(p.eyeY)||this.eyeY);
   e.tactic=hurt||e.suppressed>0?'cover':hidden||e.role==='flank'&&distance>9?'flank':distance>18?'advance':e.role==='support'?'brace':'suppress';
   let target={x:e.x,z:e.z};
   if(e.tactic==='cover'){
    const c=this.covers.slice().sort((a,b)=>Math.hypot(a.x-e.x,a.z-e.z)-Math.hypot(b.x-e.x,b.z-e.z))[0];
    if(c)target={x:c.x+side*(c.w/2+.9),z:c.z+(c.z>p.z?1:-1)*(c.d/2+.9)};
   }else if(e.tactic==='flank'||e.tactic==='advance'){
    const forward=e.tactic==='advance'?5:1.8;
    target={x:clamp(e.x+dx/distance*forward-dz/distance*side*4.5,-26,26),z:clamp(e.z+dz/distance*forward+dx/distance*side*4.5,-7,70)};
   }else if(e.tactic==='brace')target={x:e.x,z:e.z};else target={x:clamp(e.x-dz/distance*side*1.4,-26,26),z:clamp(e.z+dx/distance*side*1.4,-7,70)};
   e.destination=target;
  }
  e.crouched=e.tactic==='cover';e.y=e.crouched?.82:1.15;
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
  if(this.state==='HAND_CALIBRATION'||this.state==='NET_LOBBY')return;
  if(this.handSession?.requiresBody&&!this.bodyPose?.fresh&&this.state==='PLAYING'){this.handLock=null;return;}
  if(this.handSession&&!this.handSession.dualHands&&!this.handAim?.fresh&&this.state==='PLAYING'){if(!this.handAim?.present)this.handLock=null;return;}
  if(this.handSession?.dualHands&&!this.handAim?.fresh&&!this.handSession.controller.navigation.read(performance.now()).fresh&&this.state==='PLAYING'){this.handLock=null;return;}
  this.elapsed+=dt;this.bannerTime=Math.max(0,this.bannerTime-dt);this.hitFlash=Math.max(0,this.hitFlash-dt);this.hurtFlash=Math.max(0,this.hurtFlash-dt);this.muzzle=Math.max(0,this.muzzle-dt);this.weaponKick*=Math.exp(-18*dt);this.damageTime=Math.max(0,this.damageTime-dt);
  if(this.handSession&&!this.handSession.dualHands)this.crouched=!!(this.bodyPose?.fresh&&this.bodyPose.crouched);
  this.eyeY=(this.coverHeld||this.crouched)?1.05:1.8;
  if(this.state!=='PLAYING'){
   this.resultTimer-=dt;if(this.resultTimer<=0&&!this.resultSent){this.resultSent=true;window.System?.gameOver?.(this.score,this.state==='VICTORY',0);}return;
  }
  if(this.net&&this.player.hp<=0)return;
  const p=this.player,cameraInput=!!this.handSession,stick=cameraInput?null:this.manualStick,aim=cameraInput?null:this.aimStick,cover=this.coverHeld||this.crouched;
  const sensitivity=window.ArcadePlaySettings?.get().sensitivity??1;
  if(cameraInput&&this.handSession.dualHands){
   const a=this.handAim,calibration=a?.calibration||0,nav=this.handSession.controller.navigation.read(performance.now());
   if(!this.handViewAnchor||this.handViewAnchor.calibration!==calibration)this.handViewAnchor={yaw:p.yaw,pitch:p.pitch,calibration,aimYaw:0,aimPitch:0};
   const anchor=this.handViewAnchor;if(nav.fresh)anchor.yaw=angle(anchor.yaw+nav.turn*3*dt*sensitivity);
   if(a?.fresh){anchor.aimYaw=(a.x-.5)*1.4*sensitivity;anchor.aimPitch=(.48-a.y)*1.8*sensitivity;}
   p.yaw=angle(anchor.yaw+anchor.aimYaw);p.pitch=clamp(anchor.pitch+anchor.aimPitch,-1.05,1.05);
  }else if(cameraInput&&this.handAim?.fresh){
   const a=this.handAim,calibration=a.calibration||0;if(!this.handViewAnchor||this.handViewAnchor.calibration!==calibration)this.handViewAnchor={yaw:p.yaw,pitch:p.pitch,calibration};const offset=a.x-.5,body=this.bodyPose?.fresh?this.bodyPose:null;p.yaw=angle(this.handViewAnchor.yaw+(offset*1.7+Math.sign(offset)*Math.pow(Math.max(0,Math.abs(offset)-.30)/.20,2)*2.2)*sensitivity+(body?.turnYaw||0)*.65+(body?.lean||0)*.30);p.pitch=clamp(this.handViewAnchor.pitch+(.48-a.y)*2.2*sensitivity,-1.05,1.05);
  }
  if(!cameraInput){p.yaw=angle(p.yaw+(Number(aim?.x)||0)*1.7*dt*sensitivity);p.pitch=clamp(p.pitch+(Number(aim?.y)||0)*1.1*dt*sensitivity,-.8,.8);}
  let mx=cameraInput?(this.bodyPose?.fresh?this.bodyPose.moveX:0):(Number(stick?.x)||0)+Number(!!this.keys.d)-Number(!!this.keys.a),mz=cameraInput?(this.bodyPose?.fresh?this.bodyPose.moveZ:0):(Number(stick?.y)||0)+Number(!!this.keys.w)-Number(!!this.keys.s);
  if(cameraInput&&this.handSession.dualHands){const nav=this.handSession.controller.navigation.read(performance.now());mx=0;mz=nav.fresh?nav.move:0;}
  const length=Math.max(1,Math.hypot(mx,mz));mx/=length;mz/=length;
  if(!cameraInput){p.yaw=angle(p.yaw+(Number(!!this.keys.arrowright)-Number(!!this.keys.arrowleft))*1.5*dt*sensitivity);
  p.pitch=clamp(p.pitch+(Number(!!this.keys.arrowup)-Number(!!this.keys.arrowdown))*dt,-.8,.8);}
  this.sprinting=!cameraInput&&!cover&&!this.aiming&&!this.fireHeld&&!this.autoFireLock&&mz>.65&&!!(this.sprintHeld||this.keys.shift);const speed=cover?1.9:this.aiming?3.6:this.sprinting?9:6.5,nx=clamp(p.x+(Math.cos(p.yaw)*mx+Math.sin(p.yaw)*mz)*speed*dt,-29,29),nz=clamp(p.z+(-Math.sin(p.yaw)*mx+Math.cos(p.yaw)*mz)*speed*dt,-9,72);

  if(!this.covers.some(c=>Math.abs(nx-c.x)<c.w/2+.35&&Math.abs(nz-c.z)<c.d/2+.35)){this.autoWalking=Math.hypot(nx-p.x,nz-p.z)>.0001;p.x=nx;p.z=nz;}
  if(cameraInput&&!this.handSession.dualHands&&this.handSession.autoAdvance&&!cover&&Math.hypot(mx,mz)<.15)this.cameraWalk(dt);
  this.shotCooldown=Math.max(-.05,this.shotCooldown-dt);
  if(this.reloadTime>0){this.reloadTime=Math.max(0,this.reloadTime-dt);if(this.reloadTime===0){const n=Math.min(this.gun.mag-this.ammo,this.reserve);this.ammo+=n;this.reserve-=n;this.stats.reloads++;}}
  let automatic=false;
  if(this.handSession){
   const target=this.handAim?.fresh?this.targetAtAim():null;
   if(!target)this.handLock=null;
   else if(this.handLock?.target===target){this.handLock.time=Math.max(this.handLock.time+dt,Math.max(0,((this.handAim.timestamp||0)-this.handLock.firstSample)/1000));automatic=this.handLock.time>=.12&&(this.handAim.timestamp||0)>this.handLock.firstSample;}
   else this.handLock={target,time:0,firstSample:this.handAim.timestamp||0};
   if(this.handSession.dualHands)automatic=!!(this.handAim?.fresh&&this.handAim.fire);
   // The left hand turns the view; the right palm aims within that view.
  }
  if(!this.handSession&&(window.ArcadePlaySettings?.get().combatFireMode==='simple')){const target=this.targetAtAim();this.autoFireLock=target?{target}:null;automatic=!!target;}else this.autoFireLock=null;
  const firePressed=this.firePressed;this.firePressed=false;
  if(automatic||(!this.handSession&&(firePressed||this.fireHeld||this.keys[' ']))){const debt=this.shotCooldown;if(this.shoot())this.shotCooldown=Math.max(0,this.shotCooldown+Math.min(0,debt));}else this.shotCooldown=Math.max(0,this.shotCooldown);
  if(this.training&&this.trainingNext>0){this.trainingNext=Math.max(0,this.trainingNext-dt);if(!this.trainingNext)this.nextPracticeTarget();}
  if(!this.net){
  if(this.advanceOperation(dt))this.finish(true);
  for(const e of this.enemies){
   if(!e.active)continue;e.flash=Math.max(0,e.flash-dt);if(e.kind==='relay'||e.kind==='practice')continue;e.aim-=dt;
   if(e.kind==='drone')e.y=5+Math.sin(this.elapsed*1.5+e.phase)*.8;
   this.updateEnemyTactics(e,dt);this.updateEnemyAwareness(e,dt);
   if(e.aim<=0){
    if(!this.blocked(e.x,e.z,e.y)){
     const protection=!this.net?window.ArcadePlaySettings?.get()?.combatProtection:'normal';
     const multiplier=protection==='relaxed'?.4:protection==='resistant'?.65:1;
     const damage=this.level.damage*(e.kind==='tank'?1.7:1)*(cover?.25:1)*multiplier;
     p.hp=Math.max(0,p.hp-damage);this.lastDamageAt=this.elapsed;this.hurtFlash=.25;this.damageBearing=Math.atan2(e.x-p.x,e.z-p.z);this.damageTime=1;if(cover)this.stats.blocks++;
    }
    e.aim=this.level.aim+1.2;e.shot=.14;
   }
   e.shot=Math.max(0,(e.shot||0)-dt);
  }
  }
  // Healing only after five seconds without damage, only for living solo players.
  if(!this.net&&p.hp>0&&p.hp<100&&window.ArcadePlaySettings?.get()?.combatRecovery===true&&this.elapsed-this.lastDamageAt>=5)
   p.hp=Math.min(100,p.hp+5*dt);
  for(const f of this.particles){f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.z+=f.vz*dt;}this.particles=this.particles.filter(f=>f.life>0);
  const moving=this.autoWalking||(!cameraInput&&Math.hypot(mx,mz)>.15);
  if(moving&&this.elapsed-this.lastStepSound>(cover?.55:this.sprinting?.23:.36)){this.lastStepSound=this.elapsed;window.GameAudio?.effect('step',.55);}
  if(p.hp<=0&&!this.net)this.finish(false);
 },
 update(ctx,w,h){
  const now=performance.now(),dt=clamp((now-this.lastTime)/1000,0,.25);this.lastTime=now;if(!this.player)return 0;
  if(this.handSession?.controller)this.handAim=this.handSession.controller.read(now);
  this.net?.tick(now);
  if(this.state==='HAND_CALIBRATION'){if(this.net)this.net.step(dt);this.viewSize={w,h};ctx.fillStyle='#102737';ctx.fillRect(0,0,w,h);return this.score;}
  // Rendering may be slower than input/weapon timing on mobile GPUs. Advance
  // the actual elapsed interval in small collision-safe steps; dropping every
  // interval above 50ms made a 1.65s reload take several seconds at low FPS.
  this.viewSize={w,h};
  for(let remaining=dt;remaining>1e-8;){const step=Math.min(remaining,1/60);this.net?.step(step);this.step(step);remaining-=step;}
  this.drawVirtualScene(ctx,w,h);this.drawHUD(ctx,w,h);this.net?.draw(ctx,w,h);return this.score;
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
  const face=(vertices,color)=>{
   // Clip crossing faces at the actual near plane instead of deleting a
   // whole wall when a single corner passes behind the player.
   const p=this.player,depth=v=>(v[0]-p.x)*Math.sin(p.yaw)*Math.cos(p.pitch)+(v[2]-p.z)*Math.cos(p.yaw)*Math.cos(p.pitch)+(v[1]-this.eyeY)*Math.sin(p.pitch),clipped=[];
   for(let i=0;i<vertices.length;i++){const a=vertices[i],b=vertices[(i+1)%vertices.length],da=depth(a),db=depth(b),inside=da>=.251;if(inside)clipped.push(a);if(inside!==(db>=.251)){const t=(.251-da)/(db-da);clipped.push(a.map((v,j)=>v+(b[j]-v)*t));}}
   if(clipped.length<3)return;const points=clipped.map(v=>this.project(...v,w,h));faces.push({points,color,z:points.reduce((s,p)=>s+p.z,0)/points.length});
  };
  const shade=(hex,amount)=>'#'+hex.slice(1).match(/../g).map(v=>Math.round(clamp(parseInt(v,16)*amount,0,255)).toString(16).padStart(2,'0')).join('');
  const box=(x,y,z,bw,bh,bd,color)=>{
   const v=[[-1,0,-1],[1,0,-1],[1,0,1],[-1,0,1],[-1,1,-1],[1,1,-1],[1,1,1],[-1,1,1]].map(([a,b,c])=>[x+a*bw/2,y+b*bh,z+c*bd/2]);
   for(const [indices,light] of [[[0,1,5,4],.78],[[1,2,6,5],.66],[[2,3,7,6],.92],[[3,0,4,7],.84],[[4,5,6,7],1.13]])face(indices.map(i=>v[i]),shade(color,light));
  };
  if(!camera){
   for(let z=0;z<100;z+=10)face([[-32,0,z],[32,0,z],[32,0,z+1],[-32,0,z+1]],'rgba(177,194,171,.14)');
   const mission=this.mission.id;
   if(mission==='patrol'){
    face([[34,-.06,-20],[85,-.06,-20],[85,-.06,120],[34,-.06,120]],'#528b9a');
    for(const side of[-1,1])for(let i=0;i<5;i++){const x=side*26,z=i*22+4;box(x,0,z,8,3.3,15,i%2?'#647d7a':'#995f43');box(x,3.3,z,8.2,.16,15.2,'#c2c3af');for(let k=-3;k<=3;k++)box(x+k,.1,z-7.55,.09,3.1,.08,'#3b5356');}
    for(const z of[25,72]){for(const x of[35,55])box(x,0,z,.9,23,.9,'#c5a75b');box(45,22,z,24,1,1.2,'#425f68');box(44,12,z,.09,10,.09,'#3b5056');}
   }else if(mission==='extraction'){
    for(const side of[-1,1]){box(side*32,0,35,4,7,125,'#9d9982');for(let z=-15;z<100;z+=8)box(side*32,7,z,4.2,1.2,3,'#b8b29a');for(const z of[10,65]){box(side*31,0,z,8,13,8,'#798783');box(side*31,13,z,9,1,9,'#b7af91');}}
    box(-17,0,82,26,10,3,'#a7a18b');box(17,0,82,26,10,3,'#a7a18b');box(0,10,82,12,3,3,'#b2ac94');
   }else if(mission==='training'){
    box(0,0,48,42,6,1,'#788e89');for(const x of[-21,21])box(x,0,20,.3,3,60,'#617a7d');for(const x of[-12,-6,6,12])face([[x,0,0],[x+.08,0,0],[x+.08,0,45],[x,0,45]],'#d4c789');
   }else{
    face([[-10,.01,-15],[10,.01,-15],[10,.01,110],[-10,.01,110]],'#42545b');
    for(let i=0;i<10;i++){const side=i%2?1:-1,x=side*(25+i%3*3),z=15+Math.floor(i/2)*18,bh=8+i%4*4;box(x,0,z,9,bh,11,i%2?'#799699':'#b3ad9a');box(x,bh,z,9.5,.3,11.5,'#d1c7ad');for(let y=2;y<bh-1;y+=3)for(let dx=-3;dx<=3;dx+=3)face([[x+dx-.6,y,z-5.52],[x+dx+.6,y,z-5.52],[x+dx+.6,y+1.5,z-5.52],[x+dx-.6,y+1.5,z-5.52]],'#2e5669');}
   }
  }
  for(const c of this.covers){box(c.x,0,c.z,c.w,c.h,c.d,c.type==='container'?'#526f72':c.type==='stone'?'#a7a28b':'#6f7d6d');box(c.x,c.h,c.z,c.w+.12,.12,c.d+.12,'#c6c7aa');if(c.type==='container')for(let x=-c.w/2+.3;x<c.w/2;x+=.65)box(c.x+x,.1,c.z-c.d/2-.02,.08,c.h-.2,.04,'#8a9b8f');}
  for(const e of this.enemies){
   if(!e.active&&!(e.kind==='soldier'&&this.elapsed-e.defeatedAt<3))continue;const color=e.flash?'#f2ebca':e.kind==='tank'?'#66784e':'#586a61';
   if(e.kind==='practice'){
    box(e.x,e.y-.8,e.z,1.6,1.6,.12,e.flash?'#fff0bf':'#dbe9dd');box(e.x,e.y-.5,e.z-.08,1,1,.05,'#d07450');box(e.x,e.y-.2,e.z-.12,.4,.4,.05,'#f4d37c');
   }else if(e.kind==='soldier'&&window.WarPresentation){WarPresentation.soldierFaces(face,e,this);
   }else if(e.kind==='soldier'){
    const walk=Math.sin(this.elapsed*4+e.phase)*.12;
    box(e.x-.21,0,e.z+walk,.3,.82,.32,'#273b3b');box(e.x+.21,0,e.z-walk,.3,.82,.32,'#314846');
    box(e.x,.75,e.z,.86,.84,.48,color);box(e.x,1.58,e.z,.48,.39,.43,'#a2a891');box(e.x,1.94,e.z,.58,.17,.5,'#354c46');
    box(e.x,1.74,e.z-.225,.36,.1,.03,'#61c6c2');box(e.x+.5,1.1,e.z-.32,.22,.23,.95,'#202f35');
   }else if(e.kind==='relay'){
    box(e.x,0,e.z,1.2,2.35,1,'#487f93');box(e.x,1.2,e.z-.52,.85,.6,.05,e.flash?'#fff0bf':'#edbb62');box(e.x,2.35,e.z,.1,1.8,.1,'#52646b');
   }else if(e.kind==='drone'){
    box(e.x,e.y-.25,e.z,1.1,.45,.8,color);for(const s of [-1,1]){box(e.x+s,e.y,e.z,1,.1,.13,'#a7b5b5');box(e.x+s,e.y+.12,e.z,1.5,.035,.18,'#293f49');}box(e.x,e.y-.13,e.z-.5,.25,.12,.04,'#f6a050');
   }else{
    box(e.x,0,e.z,4.8,.75,5.4,'#2c3e36');box(e.x,.7,e.z,4.3,1.1,4.5,color);box(e.x,1.8,e.z,2.8,.8,2.7,'#83916b');box(e.x,2.1,e.z-2.5,.26,.26,4,'#394f42');
   }
  }
  faces.sort((a,b)=>b.z-a.z);for(const f of faces){ctx.beginPath();f.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=f.color;ctx.fill();ctx.strokeStyle='rgba(10,26,32,.2)';ctx.lineWidth=.6;ctx.stroke();}
  if(window.WarPresentation)WarPresentation.weapon2D(ctx,w,h,this);
  else{
  // First-person weapon, below the reticle. All targets are rendered game objects.
  const bx=this.aiming?w*.5:w*.62,by=h*.96,unit=Math.min(w,h)*.32,shape=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(bx+x*unit,by+y*unit):ctx.moveTo(bx+x*unit,by+y*unit));ctx.closePath();ctx.fill();};
  shape([[-.95,.15],[-.65,-.37],[-.31,-.46],[-.18,-.2],[-.37,.15]],'#637d69');
  shape([[.3,.15],[.07,-.23],[.14,-.48],[.42,-.34],[.87,.15]],'#516b5c');
  shape([[-.24,.1],[-.29,-.58],[-.18,-.79],[.1,-.77],[.27,-.19],[.44,.1]],'#203039');
  shape([[-.18,-.32],[-.22,-.7],[-.09,-.97],[.03,-.96],[.15,-.34]],'#657779');
  shape([[-.12,-.77],[-.15,-1.08],[-.065,-1.17],[.015,-1.08],[.06,-.77]],'#192d35');
  shape([[-.22,-.54],[-.27,-.68],[.09,-.71],[.16,-.55]],'#8d9a91');
  shape([[-.15,-.7],[-.15,-.85],[.03,-.85],[.06,-.7]],'#314b55');
  if(this.muzzle>0){shape([[-.065,-1.14],[-.25,-1.38],[-.07,-1.29],[0,-1.54],[.06,-1.25],[.24,-1.34],[.06,-1.12]],'#ffe1a1');}
  }
  this.drawCombatSignals(ctx,w,h);
 },
 drawCombatSignals(ctx,w,h){
  if(this.wave>0&&!this.enemies.some(e=>e.active&&!e.ally)&&this.state==='PLAYING'){const goal=this.objectivePoint(),point=this.project(goal.x,1.1,goal.z,w,h);if(point&&point.x>25&&point.x<w-25&&point.y>40&&point.y<h-60){ctx.fillStyle='#8df0cd';ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.fillText(this.objective.phase==='hold'?'MANTENHA A POSIÇÃO':'SIGA ATÉ O MARCADOR',point.x,point.y-24,w-30);ctx.strokeStyle='#8df0cd';ctx.strokeRect(point.x-12,point.y-12,24,24);}}
  for(const e of this.enemies){
   if(!e.active||e.ally)continue;const p=this.project(e.x,e.kind==='soldier'?2.7:e.y+1.8,e.z,w,h);if(!p)continue;
   if(e.flash>0||this.handLock?.target===e){const width=clamp(p.s*1.1,22,46),maxHP=(e.kind==='tank'?260:e.kind==='relay'?102:e.kind==='drone'?70:100)*this.level.health;ctx.fillStyle='#142027';ctx.fillRect(p.x-width/2,p.y-17,width,3);ctx.fillStyle='#d7bf8d';ctx.fillRect(p.x-width/2,p.y-17,width*clamp(e.hp/maxHP,0,1),3);}
   if(e.shot>0&&!this.blocked(e.x,e.z,e.y)){const from=this.project(e.x,e.y+.20,e.z,w,h),to=this.project(this.player.x+.45,this.eyeY-.15,this.player.z+1.5,w,h);if(from&&to){ctx.strokeStyle='rgba(245,211,153,.55)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke();}}
  }
  for(const f of this.particles){const p=this.project(f.x,f.y,f.z,w,h);if(p){ctx.fillStyle='rgba(255,194,94,'+f.life+')';ctx.fillRect(p.x,p.y,Math.max(2,p.s*.15),Math.max(2,p.s*.15));}}
  if(this.hurtFlash>0){const glow=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.2,w/2,h/2,Math.max(w,h)*.65);glow.addColorStop(0,'rgba(128,25,18,0)');glow.addColorStop(1,'rgba(151,36,22,.38)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);}
 },
 drawHUD(ctx,w,h){
  ctx.save();ctx.textAlign='left';
  const compact=w>=h,hx=12,hy=compact?9:86,hw=compact?Math.max(120,Math.min(w-292,440)):w-24,hh=compact?44:100;
  if(!this.training){ctx.fillStyle='rgba(5,20,29,.83)';ctx.fillRect(hx,hy,hw,hh);ctx.fillStyle='#83d6c5';ctx.fillRect(hx,hy,3,hh);ctx.font='bold 12px Arial';ctx.fillStyle='#edf7f2';ctx.fillText(this.mission.name+' · '+this.difficulty.toUpperCase(),hx+12,hy+17,hw-24);ctx.fillStyle='#b5dfd3';ctx.font='11px Arial';ctx.fillText(this.objectiveHint(),hx+12,hy+35,hw-24);}
  const panelW=compact?208:Math.min(w-24,270),panelX=compact?(w-panelW)/2:this.training?(w-panelW)/2:hx+12,panelY=compact?h-114:this.training?h-226:hy+55,health=this.player.hp<30?'#ffb383':'#9fe1c3';
  if(compact||this.training){ctx.fillStyle='rgba(5,20,29,.85)';ctx.fillRect(panelX,panelY,panelW,46);}
  const inset=compact||this.training?12:0;ctx.font='bold 11px Arial';ctx.fillStyle=health;ctx.fillText((this.crouched?'ABAIXADO · ':'VIDA ')+Math.ceil(this.player.hp),panelX+inset,panelY+17,panelW*.5-12);ctx.fillStyle='#294b50';ctx.fillRect(panelX+inset,panelY+26,76,4);ctx.fillStyle=health;ctx.fillRect(panelX+inset,panelY+26,76*clamp(this.player.hp/100,0,1),4);
  ctx.textAlign='right';ctx.font='bold 16px Arial';ctx.fillStyle='#fff';ctx.fillText(this.reloadTime>0?this.reloadTime.toFixed(1)+'s':String(this.ammo),panelX+panelW-inset,panelY+18,70);ctx.font='10px Arial';ctx.fillStyle='#bcd5d1';ctx.fillText(this.reloadTime>0?'RECARREGANDO':'/ '+this.reserve+' · '+this.gun.name,panelX+panelW-inset,panelY+34,panelW*.55);ctx.textAlign='center';
  const cx=this.handAim&&!this.handSession?this.handAim.x*w:w/2,cy=this.handAim&&!this.handSession?this.handAim.y*h:h*.48;ctx.strokeStyle=this.hitFlash>0?'#ffcc80':'#eaf9e4';ctx.lineWidth=2;
  for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(cx+s*5,cy);ctx.lineTo(cx+s*14,cy);ctx.moveTo(cx,cy+s*5);ctx.lineTo(cx,cy+s*14);ctx.stroke();}
  if(this.handLock&&!this.handSession?.dualHands){ctx.strokeStyle=this.handLock.time>=.12?'#9eebc4':'#e2c28a';ctx.beginPath();ctx.arc(cx,cy,20,-Math.PI/2,-Math.PI/2+Math.PI*2*clamp(this.handLock.time/.12,0,1));ctx.stroke();}
  const statusY=this.training&&this.practiceHudBottom?this.practiceHudBottom+15:hy+hh+19,dual=this.handSession?.dualHands,nav=dual?this.handSession.controller.navigation.read(performance.now()):null;
  let status='';
  if(this.handSession){if(dual)status=!this.handAim?.fresh&&!nav.fresh?'RASTREAMENTO PAUSADO · MOSTRE AS DUAS MÃOS':!this.handAim?.fresh?'MÃO DIREITA PAUSADA · TIRO INTERROMPIDO':!nav.fresh?'MÃO ESQUERDA PAUSADA · MOVIMENTO INTERROMPIDO':this.elapsed<8?'ESQUERDA ANDA E GIRA · DIREITA MIRA · PINÇA ATIRA':'';else status=!this.handAim?.fresh?'RASTREAMENTO PAUSADO · MOSTRE A MÃO DIREITA':this.elapsed<8?'MÃO DIREITA MIRA · CORPO OPCIONAL':'';}
  else if(this.elapsed<8)status=window.ArcadePlaySettings?.get().combatFireMode==='simple'?'DISPARO AUTOMÁTICO · PASSE A MIRA NO ALVO':'ARRASTE PARA MIRAR · SEGURE ATIRAR';
  if(status&&!this.training){ctx.font='bold 10px Arial';const width=Math.min(w-28,ctx.measureText(status).width+24);ctx.fillStyle='rgba(5,20,29,.8)';ctx.fillRect((w-width)/2,statusY-12,width,22);ctx.fillStyle='#e6f4ec';ctx.fillText(status,w/2,statusY+2,width-12);}
  if(this.damageTime>0){const bearing=angle(this.damageBearing-this.player.yaw),x=w/2+Math.sin(bearing)*Math.min(w,h)*.20,y=h*.48-Math.cos(bearing)*Math.min(w,h)*.20;ctx.save();ctx.translate(x,y);ctx.rotate(bearing);ctx.globalAlpha=Math.min(1,this.damageTime*1.5);ctx.fillStyle='#e2a08b';ctx.beginPath();ctx.moveTo(-12,3);ctx.lineTo(0,-5);ctx.lineTo(12,3);ctx.lineTo(0,0);ctx.closePath();ctx.fill();ctx.restore();}
  const nearest=this.enemies.filter(e=>e.active&&!e.ally).sort((a,b)=>Math.hypot(a.x-this.player.x,a.z-this.player.z)-Math.hypot(b.x-this.player.x,b.z-this.player.z))[0];
  const destination=nearest||this.objectivePoint();if(destination){const bearing=angle(Math.atan2(destination.x-this.player.x,destination.z-this.player.z)-this.player.yaw);if(Math.abs(bearing)>.48){ctx.fillStyle='#f0c999';ctx.fillText(bearing>0?(nearest?'ALVO À DIREITA →':'OBJETIVO À DIREITA →'):(nearest?'← ALVO À ESQUERDA':'← OBJETIVO À ESQUERDA'),w/2,statusY+20,w-28);}}
  if(this.coverHeld){ctx.fillStyle='#9ce8d2';ctx.fillText('EM COBERTURA • DANO REDUZIDO',w/2,h*.64,w-30);}
  if(this.state==='VICTORY'||this.state==='DEFEAT'){ctx.fillStyle='rgba(6,18,27,.86)';ctx.fillRect(0,h*.34,w,h*.28);ctx.fillStyle=this.state==='VICTORY'?'#a3edbd':'#ffbe9c';ctx.font='bold 23px Arial';ctx.fillText(this.state==='VICTORY'?'OPERAÇÃO CONCLUÍDA':'TENTE OUTRA ESTRATÉGIA',w/2,h*.44,w-24);ctx.font='14px Arial';ctx.fillText(this.stats.kills+' alvos • '+this.stats.hits+'/'+this.stats.shots+' acertos',w/2,h*.50,w-24);}
  ctx.restore();
 },
 cleanup(){
  document.body?.classList?.remove('war-playing');this.practiceUI?.dispose();this.practiceUI=null;
  this.net?.dispose();this.net=null;
  this.handSession?.dispose();this.handSession=null;this.handAim=null;
  window.ArcadeWorldRenderer?.release(this);
  this.release?.();if(this.keyDown)window.removeEventListener?.('keydown',this.keyDown);if(this.keyUp)window.removeEventListener?.('keyup',this.keyUp);if(this.release){window.removeEventListener?.('blur',this.release);window.removeEventListener?.('arcade:release-inputs',this.release);}this.resultSent=false;
 }
};
const register=()=>{if(!window.System?.registerGame)return false;window.System.registerGame('ar_truck_sim','WAR Combate','🎯',Game,{camera:'hand',camOpacity:0,phases:[{id:TRAINING.id,name:TRAINING.name,desc:TRAINING.desc,reqLvl:1},...MISSIONS.map(m=>({id:m.id,name:m.name,desc:m.desc,reqLvl:1})),...MISSIONS.map(m=>({id:m.id+'_coop',missionId:m.id,online:true,name:'ONLINE • '+m.name,desc:'Cooperativo para dois jogadores. Escolham esta missão e a mesma dificuldade nos dois aparelhos.',reqLvl:1}))]});return true;};
if(!register()){const timer=setInterval(()=>{if(register())clearInterval(timer)},100);}
})();

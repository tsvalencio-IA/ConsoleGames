/* WAR co-op networking. Account identity stays in System/Profile; room peers
 * have one ID per connection. NPCs, damage and mission outcome have one host. */
(()=>{'use strict';
const stamp=()=>firebase.database.ServerValue.TIMESTAMP;
const uid=()=>globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
class WarRoom{
 constructor(game){
  this.game=game;this.id=String(window.System?.playerId||'player')+'_'+uid();this.roster={};this.peers=new Map();this.processed=new Set();this.lastShot={};this.sequence=0;this.offset=0;this.lastSent=0;this.clockReady=false;this.phase='LOBBY';this.started='';this.lastFrame=performance.now();
  this.root=document.createElement('section');this.root.className='war-online-lobby';this.root.setAttribute('role','region');this.root.setAttribute('aria-label','Sala cooperativa do WAR');
  this.root.innerHTML='<div class="war-online-panel"><span>WAR COMBATE · COOPERATIVO ONLINE</span><h2>SALA DA OPERAÇÃO</h2><p data-war-room-status>Conectando à sala…</p><p data-war-room-players></p><button type="button" data-war-room-start disabled>AGUARDANDO ALIADO</button><small>Escolham a mesma missão e dificuldade nos dois aparelhos. Cada jogador pode usar câmera ou controles.</small></div>';
  document.body.appendChild(this.root);this.status=this.root.querySelector('[data-war-room-status]');this.names=this.root.querySelector('[data-war-room-players]');this.button=this.root.querySelector('[data-war-room-start]');this.button.onclick=()=>this.start();
  if(!window.DB){this.error='Entre na conta online para jogar com um aliado. Volte às fases para escolher uma missão solo.';this.renderLobby();return;}
  const ref=this.ref=window.DB.ref('rooms/thiaguinho_war_'+game.mission.id+'_'+game.difficulty);
  const watch=(path,fn)=>ref.child(path).on('value',snap=>{if(!this.disposed)fn(snap.val());},error=>this.fail(error));
  this.clock=window.DB.ref('.info/serverTimeOffset');this.clock.on('value',snap=>{this.offset=Number(snap.val())||0;this.clockReady=Number.isFinite(snap.val());this.reconcile();},()=>{});
  watch('host',id=>{this.host=id||'';this.hostKnown=true;this.reconcile();});
  watch('players',players=>{this.roster=players||{};this.rosterKnown=true;this.reconcile();});
  watch('snapshot',data=>{this.snapshot=data;if(data)this.apply(data);});
  watch('shots',shots=>{if(this.isHost)for(const[key,shot]of Object.entries(shots||{})){if(!this.processed.has(key)){this.processed.add(key);this.resolveShot(shot);this.write(()=>ref.child('shots/'+key).remove());}}});
  const own=ref.child('players/'+this.id);this.write(async()=>{await own.onDisconnect().remove();if(!this.disposed)await own.set(this.pose());});
  this.timer=setInterval(()=>{
   if(this.disposed)return;this.sendPose();this.prune();
   // Online simulation keeps advancing when the host opens a pause panel or
   // its render loop is throttled. Pausing still releases all local controls.
   const now=performance.now();if(this.isHost&&now-this.lastFrame>180&&this.phase==='PLAYING'){this.step(Math.min(.25,(now-this.lastFrame)/1000));this.lastFrame=now;this.publish();}
  },1000);
 }
 now(){return Date.now()+this.offset;}
 write(task){try{return Promise.resolve(task()).catch(e=>this.fail(e));}catch(e){this.fail(e);return Promise.resolve();}}
 fail(error){if(this.disposed)return;this.error='Não foi possível acessar a sala. Confira sua conta e conexão e tente novamente pelas fases.';console.warn('WAR room:',error?.code||'connection');window.System?.msg(this.error);this.renderLobby();}
 live(){return Object.keys(this.roster).filter(id=>!this.clockReady||id===this.id||this.now()-Number(this.roster[id]?.lastSeen||0)<15000).sort();}
 ready(){return !this.game.handSession||this.game.handSession.controller?.state==='ready';}
 pose(){const g=this.game,p=g.player;return {name:window.Profile?.username||'Jogador',x:p.x,z:p.z,yaw:p.yaw,pitch:p.pitch,eyeY:g.eyeY,cover:!!(g.coverHeld||g.crouched),ready:this.ready(),moving:!!g.autoWalking||!!g.manualStick?.active,shot:g.muzzle>0,lastSeen:stamp()};}
 sendPose(){if(this.ref&&!this.disposed)this.write(()=>this.ref.child('players/'+this.id).update(this.pose()));}
 prune(){if(!this.isHost||!this.clockReady)return;for(const[id,p]of Object.entries(this.roster))if(id!==this.id&&this.now()-Number(p.lastSeen||0)>15000)this.write(()=>this.ref.child('players/'+id).remove());}
 reconcile(){
  if(!this.ref||!this.hostKnown||!this.rosterKnown)return;
  const ids=this.live(),wasHost=this.isHost;this.isHost=this.host===this.id&&ids.includes(this.id);
  if(!ids.includes(this.host)&&ids[0]===this.id&&!this.claiming){this.claiming=true;this.write(()=>this.ref.child('host').transaction(old=>ids.includes(old)?old:this.id)).finally(()=>{this.claiming=false;});}
  if(this.isHost&&!wasHost&&this.snapshot?.phase==='PLAYING'){this.phase='LOBBY';this.started='';this.write(()=>this.ref.child('snapshot').remove());}
  if(this.phase==='PLAYING'&&this.participants?.some(id=>!ids.includes(id))){this.phase='LOBBY';this.started='';this.participants=null;if(this.game.state!=='HAND_CALIBRATION')this.game.state='NET_LOBBY';this.error='Aliado desconectou. Aguarde outro jogador para iniciar uma nova operação.';}
  if(!this.isHost&&this.snapshot)this.apply(this.snapshot);this.updatePeers();this.renderLobby();
 }
 start(){
  const ids=this.live(),other=ids.find(id=>id!==this.id&&this.roster[id]?.ready);
  if(!this.isHost||!this.ready()||!other||this.phase==='PLAYING')return false;
  const g=this.game;this.error='';this.started=this.id+'_'+uid();this.participants=[this.id,other];this.phase='PLAYING';
  this.ledger=Object.fromEntries(this.participants.map((id,i)=>[id,{hp:100,kills:0,score:0,spawnX:i?3:-3}]));this.lastShot={};this.processed.clear();g.enemies=[];g.wave=0;g.waveDelay=1;this.resetLocalRun(-3);g.state='PLAYING';this.write(()=>this.ref.child('shots').remove());this.publish();this.renderLobby();return true;
 }
 tick(now){
  this.lastFrame=now;
  if(!this.started&&this.game.state!=='HAND_CALIBRATION')this.game.state='NET_LOBBY';
  if(this.started&&this.phase==='PLAYING'&&this.ready()&&this.game.state==='NET_LOBBY')this.game.state='PLAYING';
  if(now-this.lastSent>80){this.lastSent=now;this.sendPose();this.publish();}this.renderLobby();
 }
 resetLocalRun(x){const g=this.game;Object.assign(g.player,{x,z:0,hp:100});g.stats={kills:0,hits:0,shots:0,reloads:0,blocks:0,missions:0};g.score=0;g.ammo=g.gun.mag;g.reserve=g.gun.reserve;g.reloadTime=g.shotCooldown=g.muzzle=g.hitFlash=g.hurtFlash=0;g.particles=[];g.elapsed=0;g.resultPaid=g.resultSent=false;g.release?.();}
 publish(){
  if(!this.isHost||!this.started||!this.ref)return;
  const g=this.game;this.write(()=>this.ref.child('snapshot').set({id:this.started,participants:this.participants,phase:this.phase,wave:g.wave,waveDelay:g.waveDelay,ledger:this.ledger,enemies:g.enemies.filter(e=>!e.peerId),at:stamp()}));
  this.applyLedger();
 }
 applyLedger(){const g=this.game,own=this.ledger?.[this.id];if(!own)return;g.player.hp=own.hp;g.stats.kills=own.kills;g.score=own.score;
  if((this.phase==='VICTORY'||this.phase==='DEFEAT')&&!g.resultPaid){g.handSession?.dispose();g.handSession=null;g.state='PLAYING';g.finish(this.phase==='VICTORY');}}
 apply(data){
  if(!data?.participants?.includes(this.id)||!data.participants.every(id=>this.live().includes(id)))return;
  if(this.isHost)return;
  const g=this.game,fresh=this.started!==data.id;this.started=data.id;this.participants=data.participants;this.phase=data.phase;this.ledger=data.ledger||{};this.error='';
  if(fresh){this.resetLocalRun(this.ledger[this.id]?.spawnX||0);if(g.state!=='HAND_CALIBRATION')g.state='PLAYING';}
  g.wave=data.wave;g.waveDelay=data.waveDelay;const previous=new Map(g.enemies.filter(e=>!e.peerId).map(e=>[e.id,e]));g.enemies=(data.enemies||[]).map(e=>Object.assign(previous.get(e.id)||{},e));this.updatePeers();this.applyLedger();this.renderLobby();
 }
 updatePeers(){
  const g=this.game,ids=this.participants||[];for(const id of ids){if(id===this.id)continue;const p=this.roster[id],life=this.ledger?.[id];if(!p||!life)continue;let actor=this.peers.get(id);if(!actor){actor={id:'peer:'+id,peerId:id,ally:true,kind:'soldier',phase:0,stride:0};this.peers.set(id,actor);}Object.assign(actor,{x:Number(p.x)||0,z:Number(p.z)||0,y:1.15,hp:life.hp,active:life.hp>0,aim:p.cover?.4:2,shot:p.shot?.13:0,flash:0,moving:!!p.moving,name:p.name});if(p.moving)actor.stride+=.3;}
  g.enemies=[...g.enemies.filter(e=>!e.peerId),...ids.filter(id=>id!==this.id&&this.peers.has(id)).map(id=>this.peers.get(id))];
 }
 fire(target){
  if(!this.started||this.phase!=='PLAYING'||!this.ledger?.[this.id]?.hp)return;
  const ray=this.game.aimRay(),key=this.id+'_'+(++this.sequence);this.write(()=>this.ref.child('shots/'+key).set({id:this.id,sequence:this.sequence,match:this.started,target:target?.id||'',gun:this.game.gun.id,yaw:ray.yaw,pitch:ray.pitch,pose:this.pose()}));
 }
 resolveShot(shot){
  const g=this.game;if(!shot||shot.match!==this.started||this.phase!=='PLAYING'||!this.participants?.includes(shot.id)||!this.ledger?.[shot.id]?.hp)return;
  const gun=g.weapons.find(w=>w.id===shot.gun);if(!gun||!Number.isFinite(shot.yaw)||!Number.isFinite(shot.pitch))return;
  const previous=this.lastShot[shot.id];if(previous&&(shot.sequence<=previous.sequence||this.now()-previous.at<gun.interval*650))return;
  this.lastShot[shot.id]={sequence:shot.sequence,at:this.now()};
  const p=shot.id===this.id?g.player:this.roster[shot.id];if(!p)return;const e=g.enemies.find(e=>e.id===shot.target&&!e.peerId&&e.active);if(!e)return;
  const dx=e.x-p.x,dz=e.z-p.z,distance=Math.hypot(dx,dz),eye=Number(p.eyeY)||g.eyeY,radius=e.kind==='tank'?2.6:e.kind==='drone'?.85:.72,height=e.kind==='soldier'?1.08:radius;
  if(Math.abs(angle(Math.atan2(dx,dz)-shot.yaw))>=Math.atan2(radius,distance)||shot.pitch<=Math.atan2(e.y-eye-height,distance)||shot.pitch>=Math.atan2(e.y-eye+height,distance)||g.blocked(e.x,e.z,e.y,p,eye))return;
  e.hp-=gun.damage;e.flash=.12;
  if(e.hp<=0){g.defeat(e,false);this.ledger[shot.id].kills++;this.ledger[shot.id].score+=e.kind==='tank'?350:100;}
  this.publish();
 }
 step(dt){
  if(!this.isHost||this.phase!=='PLAYING'||!this.started)return;
  const g=this.game,living=this.participants.filter(id=>this.ledger[id]?.hp>0&&this.roster[id]);
  if(!living.length){this.phase='DEFEAT';this.publish();return;}
  if(!g.enemies.some(e=>e.active&&!e.peerId)){g.waveDelay-=dt;if(g.waveDelay<=0){if(g.wave>=g.mission.waves){this.phase='VICTORY';this.publish();return;}g.spawnWave();g.waveDelay=2.5;for(const id of living)this.ledger[id].hp=Math.min(100,this.ledger[id].hp+18);g.reserve=Math.max(g.reserve,g.gun.mag*2);this.updatePeers();}}
  for(const e of g.enemies){if(!e.active||e.peerId)continue;e.flash=Math.max(0,(e.flash||0)-dt);e.aim-=dt;if(e.kind==='drone')e.y=5+Math.sin(g.elapsed*1.5+e.phase)*.8;
   const target=living.slice().sort((a,b)=>Math.hypot(this.roster[a].x-e.x,this.roster[a].z-e.z)-Math.hypot(this.roster[b].x-e.x,this.roster[b].z-e.z))[0];const p=target===this.id?g.player:this.roster[target],cover=target===this.id?(g.coverHeld||g.crouched):p.cover;
   g.updateEnemyTactics(e,dt,p);
   if(e.aim<=0){if(!g.blocked(e.x,e.z,e.y,p,Number(p.eyeY)||g.eyeY)){this.ledger[target].hp=Math.max(0,this.ledger[target].hp-g.level.damage*(e.kind==='tank'?1.7:1)*(cover?.25:1));if(target===this.id){g.hurtFlash=.15;if(cover)g.stats.blocks++;}}e.aim=g.level.aim+1.2;e.shot=.14;}e.shot=Math.max(0,(e.shot||0)-dt);
  }
  if(this.participants.every(id=>this.ledger[id].hp<=0)){this.phase='DEFEAT';this.publish();}this.applyLedger();
 }
 renderLobby(){
  const g=this.game,waiting=!this.started||this.phase==='LOBBY';this.root.hidden=!waiting||g.state==='HAND_CALIBRATION';if(!waiting)return;
  const ids=this.live(),allied=ids.filter(id=>this.roster[id]?.ready);this.status.textContent=this.error||(this.isHost?'Você é o anfitrião. Inicie quando o aliado estiver pronto.':'Aguardando o anfitrião iniciar a operação.');this.names.textContent=ids.map(id=>(this.roster[id]?.name||'Jogador')+(this.roster[id]?.ready?' · pronto':' · calibrando')).join(' / ');
  this.button.hidden=!this.isHost;this.button.disabled=!this.isHost||!this.ready()||allied.length<2;this.button.textContent=allied.length>=2?'INICIAR OPERAÇÃO COM ALIADO':'AGUARDANDO ALIADO';
 }
 draw(ctx,w,h){
  if(!this.started||this.phase!=='PLAYING')return;ctx.save();ctx.textAlign='center';ctx.font='bold 12px Arial';ctx.fillStyle='#a9efd3';ctx.fillText('COOPERATIVO ONLINE · '+this.participants.length+' JOGADORES',w/2,h*.30,w-24);
  for(const e of this.peers.values())if(e.active){const p=window.ArcadeWorldRenderer?.project(this.game,e.x,2.55,e.z,w,h)||this.game.project(e.x,2.55,e.z,w,h);const native=this.game.project(e.x,2.55,e.z,w,h);if(p&&native){ctx.fillStyle='#9df2ce';ctx.fillText('ALIADO · '+e.name+' · '+Math.ceil(e.hp),p.x,p.y,180);}}
  if(this.game.player.hp<=0){ctx.fillStyle='#ffdab4';ctx.fillText('VOCÊ CAIU · SEU ALIADO AINDA PODE CONCLUIR',w/2,h*.55,w-24);}ctx.restore();
 }
 dispose(){if(this.disposed)return;this.disposed=true;clearInterval(this.timer);this.root.remove();try{this.clock?.off();if(this.ref){for(const path of ['host','players','snapshot','shots'])this.ref.child(path).off();const own=this.ref.child('players/'+this.id);Promise.resolve(own.remove()).catch(()=>{});Promise.resolve(own.onDisconnect().cancel()).catch(()=>{});}}catch{}}
}
window.WarMultiplayer={create:game=>new WarRoom(game)};
})();

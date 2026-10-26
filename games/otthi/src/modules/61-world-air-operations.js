/** Individual aircraft, timed base replenishment and visible OTTOVIAS recovery.
 * The shared-world authority owns the fleet; guests request a reservation before boarding.
 */
// @otthi-module-body
 class WorldAirFleet {
  constructor(bases,saved={},now=Date.now()){
   this.bases=bases;this.data={v:1,revision:0,slots:{},craft:{},...saved};
   this.data.slots={...(saved.slots||{})};this.data.craft={...(saved.craft||{})};
   for(const [id,base]of Object.entries(bases)){
    this.data.slots[id]||={current:id,generation:0,spawnAt:0};
    this.data.craft[id]||={id,base:id,x:base.x,z:base.z,yaw:base.yaw,status:'parked',parkedAt:now,pilot:'',departedAt:0};
   }
  }
  spec(id){const c=this.data.craft[id],base=c&&this.bases[c.base];return base?{...base,id,baseId:c.base}:null;}
  claim(id,uid,now){const c=this.data.craft[id];if(!c||c.status!=='parked'||!uid)return false;c.status='piloted';c.pilot=uid;c.claimAt=now;c.seenAt=now;c.departedAt=0;delete c.job;this.data.revision++;return true;}
  depart(id,uid,now){const c=this.data.craft[id];if(!c||c.pilot!==uid||c.departedAt)return false;c.departedAt=now;const s=this.data.slots[c.base];if(s.current===id){s.current='';s.spawnAt=now+180000;}this.data.revision++;return true;}
  park(id,uid,pose,now){const c=this.data.craft[id];if(!c||c.pilot!==uid||![pose.x,pose.z,pose.yaw].every(Number.isFinite))return false;Object.assign(c,{x:pose.x,z:pose.z,yaw:pose.yaw,hp:Math.max(1,Math.min(100,Number(pose.hp)||100)),status:'parked',pilot:'',parkedAt:now});delete c.y;delete c.job;const slot=this.data.slots[c.base],base=this.bases[c.base];if(!slot.current&&Math.hypot(c.x-base.x,c.z-base.z)<3){slot.current=c.id;slot.spawnAt=0;}this.data.revision++;return true;}
  tick(now){const born=[];for(const [baseId,s]of Object.entries(this.data.slots)){
   if(s.current||!s.spawnAt||now<s.spawnAt)continue;
   // A returning pilot may have parked on the pad during the three minutes.
   const base=this.bases[baseId],present=Object.values(this.data.craft).find(c=>c.status==='parked'&&Math.hypot(c.x-base.x,c.z-base.z)<3);
   if(present){if(present.base===baseId){s.current=present.id;s.spawnAt=0;}continue;}
   if(Object.values(this.data.craft).some(c=>c.status==='piloted'&&Math.hypot(c.x-base.x,c.z-base.z)<8&&Number.isFinite(c.y)&&c.y<(base.groundY||0)+(base.height||1.6)+8))continue;
   const id=baseId+'-r'+(++s.generation);this.data.craft[id]={id,base:baseId,x:base.x,z:base.z,yaw:base.yaw,status:'parked',parkedAt:now,pilot:'',departedAt:0};s.current=id;s.spawnAt=0;born.push(id);this.data.revision++;
  }return born;}
 }
 const airOperations={ready:false,fleet:null,bases:null,lastAt:0,lastSave:0,revision:-1,meshes:new Map(),colliders:new Map(),recovery:new Map(),pending:new Map(),nonce:0,background:[]};
 function airNow(){return Number(window.OTTHOS_RTDB?.serverNowMs?.()||Date.now());}
 function airOnline(){return !!window.OTTHOS_RTDB?.connected?.()&&typeof multiplayerV2Enabled==='function'&&multiplayerV2Enabled();}
 function airEnsure(){
  if(airOperations.ready||!worldCampaign.aircraft)return airOperations.ready;
  airOperations.bases=Object.fromEntries(Object.entries(WORLD_CAMPAIGN_AIRCRAFT).map(([id,p])=>[id,{...p,mode:p.mode||id,height:p.height??(id==='plane'?1.3:1.6),groundY:groundHeightAt(p.x,p.z)}]));
  const saved=state.vehicles.airOperations||{},migrated={...saved,craft:{...(saved.craft||{})}};
  for(const [id,p]of Object.entries(state.vehicles.aircraft||{}))if(airOperations.bases[id]&&!migrated.craft[id])migrated.craft[id]={id,base:id,...p,status:'parked',pilot:'',departedAt:0};
  airOperations.fleet=new WorldAirFleet(airOperations.bases,migrated,airNow());state.vehicles.airOperations=airOperations.fleet.data;
  for(const child of worldCampaign.aircraft.children)airOperations.meshes.set(child.name,child);
  airOperations.ready=true;airMaterialize();return true;
 }
 function airAvailable(id){const c=airOperations.fleet?.data.craft[id];return !c||c.status==='parked';}
 function airMaterialize(){
  if(!airOperations.ready)return;const f=airOperations.fleet;
  for(const [id,c]of Object.entries(f.data.craft)){
   const spec=f.spec(id);if(!spec)continue;WORLD_CAMPAIGN_AIRCRAFT[id]=spec;
   if(!airOperations.meshes.has(id)){const m=campaignCreateAircraft(id);m.name=id;worldCampaign.aircraft.add(m);airOperations.meshes.set(id,m);registerInteractable({id:'board-aircraft-'+id,type:'vehicle',icon:spec.mode==='balloon'?'🎈':spec.mode==='plane'?'✈️':'🚁',label:'Embarcar: '+spec.label,radius:spec.radius,priority:185,getPos:()=>campaignAircraftPose(id),available:()=>!otGames.active&&!player.vehicle&&!player.boating&&!player.transit.mode&&airAvailable(id),action:()=>campaignBoardAircraft(id)});}
  }
  for(const a of world.interactables)if(a.id?.startsWith('board-aircraft-')&&!a.airFleetBound){const available=a.available,id=a.id.slice(15);a.available=()=>available()&&airAvailable(id);a.airFleetBound=true;}
 }
 const airOriginalPose=campaignAircraftPose;
 campaignAircraftPose=function(id){const c=airOperations.fleet?.data.craft[id],spec=airOperations.fleet?.spec(id);return c&&spec?{...spec,...c}:airOriginalPose(id);};
 function airObstacle(id,c){
  const spec=airOperations.fleet.spec(id),mode=spec.mode||spec.id,cargo=spec.model==='cargo',halfW=mode==='balloon'?1.2:mode==='plane'?(cargo?5.9:3):2,halfL=mode==='plane'?(cargo?5:2.8):mode==='balloon'?1.1:3.5,s=Math.sin(c.yaw),co=Math.cos(c.yaw);
  return{id,x:c.x,z:c.z,w:halfW,l:halfL,s,c:co,baseY:groundHeightAt(c.x,c.z)};
 }
 function airSyncObstacles(){
  if(!airOperations.ready)return;const blocked=new Set();
  for(const [id,c]of Object.entries(airOperations.fleet.data.craft)){
   const solid=c.status==='parked'||c.status==='recovering'&&c.job&&airRecoveryPose(c.job,airNow()).phase!=='carry'&&airRecoveryPose(c.job,airNow()).phase!=='lower';
   if(!solid)continue;blocked.add(id);const o=airObstacle(id,c);let collider=airOperations.colliders.get(id);
   if(!collider){collider={aircraftId:id,height:1.6};world.colliders.push(collider);airOperations.colliders.set(id,collider);}
   Object.assign(collider,{x:o.x,z:o.z,w:Math.abs(o.c)*o.w*2+Math.abs(o.s)*o.l*2,d:Math.abs(o.s)*o.w*2+Math.abs(o.c)*o.l*2});
  }
  for(const [id,c]of airOperations.colliders)if(!blocked.has(id)){world.colliders=world.colliders.filter(v=>v!==c);airOperations.colliders.delete(id);}
  if(otGames.active&&otGames.obstacles){const key=otGames.group?.uuid+'|'+[...airOperations.colliders].map(([id,c])=>[id,c.x,c.z,c.w,c.d].join(',')).join(';');if(key!==airOperations.obstacleSig){airOperations.obstacleSig=key;otGames.obstacles=otGames.obstacles.filter(b=>!b.aircraftId);for(const c of airOperations.colliders.values()){const y=professionalTerrainHeightAt(c.x,c.z),b=new THREE.Box3(new THREE.Vector3(c.x-c.w/2,y,c.z-c.d/2),new THREE.Vector3(c.x+c.w/2,y+c.height,c.z+c.d/2));b.aircraftId=c.aircraftId;otGames.obstacles.push(b);}}}
 }
 const airOriginalSync=campaignSyncAircraft;
 campaignSyncAircraft=function(){
  if(!airOperations.ready)return airOriginalSync();const focus=otGamesFocus();
  for(const [id,m]of airOperations.meshes){const c=airOperations.fleet.data.craft[id];if(!c){m.visible=false;continue;}const spec=airOperations.fleet.spec(id),pose=c.status==='recovering'&&c.job?airRecoveryPose(c.job,airNow()):null;
   const flown=c.status==='npc'&&c.npc?airNpcBalloonPose(c,airNow()):null,p=pose?.craft||flown||c;
   m.position.set(p.x,p.y??groundHeightAt(p.x,p.z)+campaignAircraftHeight(id),p.z);m.rotation.set(0,p.yaw??c.yaw,0);m.visible=c.status!=='piloted'&&Math.hypot(focus.x-p.x,focus.z-p.z)<(otGames.active?500:260);
   for(const r of m.userData.rotors||[])r.group.rotation[r.axis]=(airNow()/1000*r.speed)%(Math.PI*2);
   if(m.userData.flame)m.userData.flame.visible=c.status==='npc';
  }
 };
 function airClaimLocal(id,uid){return airOperations.fleet.claim(id,uid,airNow());}
 function airRequestClaim(id){
  if(!airOnline()||sharedWorldIsAuthority())return Promise.resolve(airClaimLocal(id,sharedWorldOwnId()));
  const token=sharedWorldOwnId()+':'+(++airOperations.nonce),start=performance.now();
  return new Promise(resolve=>{const finish=ok=>{clearInterval(timer);airOperations.pending.delete(token);resolve(ok);},timer=setInterval(()=>{const c=airOperations.fleet?.data.craft[id];if(c?.status==='piloted'&&c.pilot===sharedWorldOwnId())finish(true);else if(performance.now()-start>6500)finish(false);},80);airOperations.pending.set(token,{id,finish});window.OTTHOS_RTDB.sendEventV2('air-fleet',{action:'claim',id,token}).then(r=>{if(!r?.ok)finish(false);}).catch(()=>finish(false));});
 }
 const airOriginalBoard=campaignBoardAircraft;
 campaignBoardAircraft=async function(id){
  if(!airEnsure()||!airAvailable(id))return false;const c=campaignAircraftPose(id);
  if(!c||!running||paused||otGames.active||player.vehicle||player.boating||currentHouse||campaignDist(player,c)>c.radius)return false;
  if(!await airRequestClaim(id)){toast('Esta aeronave foi reservada por outro piloto. Há outras no aeroporto.','info',2800);return false;}
  airSyncObstacles();let result=false;try{result=await airOriginalBoard(id);}catch(error){toast('Não foi possível preparar esta aeronave. Tente embarcar novamente.','warn',2800);}if(!result){if(!airOnline()||sharedWorldIsAuthority())airOperations.fleet.park(id,sharedWorldOwnId(),c,airNow());else window.OTTHOS_RTDB.sendEventV2('air-fleet',{action:'release',id}).catch(()=>{});}else state.vehicles.airOperations=airOperations.fleet.data;return result;
 };
 const airOriginalPark=campaignParkAircraft;
 campaignParkAircraft=function(id,b){
  const result=airOriginalPark(id,b);if(!airEnsure())return result;
  if(!airOnline()||sharedWorldIsAuthority())airOperations.fleet.park(id,sharedWorldOwnId(),b,airNow());else window.OTTHOS_RTDB.sendEventV2('air-fleet',{action:'park',id,pose:{x:b.x,z:b.z,yaw:b.yaw,hp:b.hp}}).catch(()=>{});
  airSyncObstacles();campaignSyncAircraft();saveState(true);return result;
 };
 function airReceiveCommand(event){
  if(!airEnsure()||!sharedWorldIsAuthority())return;const e=event.detail||{},p=e.payload||{},uid=String(e.actorUid||''),c=airOperations.fleet.data.craft[p.id],presence=remotePresence.get(uid);if(e.kind!=='air-fleet'||!c||!presence)return;
  if(p.action==='release'&&c.pilot===uid&&!c.departedAt)airOperations.fleet.park(c.id,uid,c,airNow());
  if(p.action==='claim'&&Math.hypot(Number(presence.x)-c.x,Number(presence.z)-c.z)<Number(airOperations.fleet.spec(c.id).radius||6)+5)airClaimLocal(c.id,uid);
  if(p.action==='park'&&c.pilot===uid&&p.pose&&[p.pose.x,p.pose.z,p.pose.yaw].every(Number.isFinite)){
   const r=presence.familyRide;if(r?.id===c.id&&r.onGround&&Math.hypot(p.pose.x-r.x,p.pose.z-r.z)<12)airOperations.fleet.park(c.id,uid,p.pose,airNow());
  }
  airSyncObstacles();sharedWorldRuntime.captureAt=0;
 }
 window.addEventListener('otthi:event-v2',airReceiveCommand);
 function airRecoveryPose(job,now){
  const elapsed=Math.max(0,(now-job.at)/1000),a=job.from,b=job.to,h=job.ground+campaignAircraftHeight(job.id),approach=Math.max(8,Math.hypot(a.x-96,a.z+164)/22),travel=Math.max(7,Math.hypot(a.x-b.x,a.z-b.z)/22),smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  let heli,craft={...a,y:h},technician=null,phase='dispatch';
  if(elapsed<approach){const t=smooth(elapsed/approach);heli={x:lerp(96,a.x,t),z:lerp(-164,a.z,t),y:job.cruise+2};}
  else if(elapsed<approach+7){phase='technician';const t=smooth((elapsed-approach)/7);heli={...a,y:job.cruise};technician={x:a.x+3,z:a.z,y:lerp(job.cruise-2,job.ground,t)};}
  else if(elapsed<approach+12){phase='rigging';heli={...a,y:job.cruise};technician={x:a.x+3-Math.min(2,(elapsed-approach-7)*.5),z:a.z,y:job.ground};}
  else if(elapsed<approach+18){phase='carry';const t=smooth((elapsed-approach-12)/6);heli={...a,y:job.cruise+8};craft={...a,y:lerp(h,job.cruise-8,t)};}
  else if(elapsed<approach+18+travel){phase='carry';const t=smooth((elapsed-approach-18)/travel);heli={x:lerp(a.x,b.x,t),z:lerp(a.z,b.z,t),y:job.cruise+8};craft={...heli,y:job.cruise-8,yaw:job.from.yaw};}
  else {phase='lower';const t=smooth((elapsed-approach-18-travel)/6);heli={...b,y:job.cruise+8};craft={...b,y:lerp(job.cruise-8,job.targetGround+campaignAircraftHeight(job.id),t)};if(t>=1)phase='done';}
  return{phase,heli:{...heli,yaw:Math.atan2(b.x-a.x,b.z-a.z)},craft,technician};
 }
 function airRecoveryDestination(c){
  const base=airOperations.bases[c.base],occupied=Object.values(airOperations.fleet.data.craft).filter(p=>p.id!==c.id&&p.status!=='piloted');
  if(!occupied.some(p=>Math.hypot(p.x-base.x,p.z-base.z)<8))return {...base};
  if(base.mode==='balloon')for(const [dx,dz]of[[16,0],[0,22],[23,17],[-7,25]]){const x=base.x+dx,z=base.z+dz;if(!occupied.some(p=>Math.hypot(p.x-x,p.z-z)<10)&&!positionBlockedForPlayer(x,z,1.3,{ignoreTraffic:true})&&Math.abs(groundHeightAt(x+2,z)-groundHeightAt(x-2,z))<.4)return{x,z,yaw:0};}
  // Apron reserve rows keep returns away from occupied departure pads and runway.
  for(const z of[-244,-259,-274])for(const x of[25,46,67,88,109,130,151])if(!occupied.some(p=>Math.hypot(p.x-x,p.z-z)<13))return{x,z,yaw:Math.PI/2};
  return{x:178,z:-245,yaw:0};
 }
 function airSafeCruise(from,to,clearance=40){let h=clearance;for(let i=0;i<=32;i++){const t=i/32;h=Math.max(h,professionalTerrainHeightAt(lerp(from.x,to.x,t),lerp(from.z,to.z,t))+clearance);}return h;}
 function airStartRecovery(c,now){
  const to=airRecoveryDestination(c),from={x:c.x,z:c.z,yaw:c.yaw};c.job={id:c.id,at:now,from,to,ground:groundHeightAt(c.x,c.z),targetGround:groundHeightAt(to.x,to.z),cruise:Math.max(airSafeCruise(from,to),airSafeCruise({x:96,z:-164},from))};c.status='recovering';c.pilot='';airOperations.fleet.data.revision++;
 }
 function airRecoveryVisual(c,now){
  if(!c.job)return;let v=airOperations.recovery.get(c.id);if(!v){const heli=createCivilianAirframe('helicopter','ottovias');heli.name='OT_VIAS_AIR_RECOVERY_'+c.id;worldGroup.add(heli);const cable=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1,5),campaignMaterial(0x3b4549,.5));worldGroup.add(cable);const person=createRoadsidePoliceOfficer(null);person.group.name='OT_VIAS_AIR_TECHNICIAN';person.group.traverse(o=>{if(o.isMesh&&o.material?.color){o.material=o.material.clone();o.material.color.setHex(0xb6b54e);}});v={heli,cable,person};airOperations.recovery.set(c.id,v);}
  const p=airRecoveryPose(c.job,now),focus=otGamesFocus(),visible=Math.hypot(focus.x-p.heli.x,focus.z-p.heli.z)<500;v.heli.visible=visible;v.heli.position.set(p.heli.x,p.heli.y,p.heli.z);v.heli.rotation.y=p.heli.yaw;for(const r of v.heli.userData.rotors||[])r.group.rotation[r.axis]=now/1000*r.speed;
  v.person.group.visible=!!p.technician&&visible;if(p.technician){v.person.group.position.set(p.technician.x,p.technician.y,p.technician.z);v.person.rightArm.rotation.x=-.8+Math.sin(now*.01)*.15;v.person.leftArm.rotation.x=-.6;}
  const endpoint=p.technician||p.craft,length=Math.max(.1,p.heli.y-endpoint.y);v.cable.position.set(p.heli.x,p.heli.y-length/2,p.heli.z);v.cable.scale.y=length;v.cable.visible=visible&&p.phase!=='dispatch'&&p.phase!=='done';
 }
 function airNpcBalloonPose(c,now){const t=Math.max(0,(now-c.npc.at)/1000),from=c.npc.from,to=c.npc.to,d=Math.hypot(to.x-from.x,to.z-from.z),travel=Math.max(25,d/3.6),f=clamp((t-12)/travel,0,1),q=f*f*(3-2*f),cruise=c.npc.cruise||Math.max(c.npc.ground,c.npc.targetGround)+35,alt=t<12?lerp(c.npc.ground,cruise,t/12):t<12+travel?cruise:lerp(cruise,c.npc.targetGround,clamp((t-12-travel)/12,0,1));return{x:lerp(from.x,to.x,q),z:lerp(from.z,to.z,q),y:campaignAircraftHeight(c.id)+alt,yaw:Math.atan2(to.x-from.x,to.z-from.z),done:t>=travel+24};}
 function airNpcPilot(c){let p=airOperations.recovery.get(c.id);if(!p){const person=createRoadsidePoliceOfficer(null);person.group.name='OT_BALLOON_NPC_PILOT';person.group.scale.setScalar(.65);p={person};airOperations.recovery.set(c.id,p);}return p.person.group;}
 function airApplyReplica(){
  if(!airOnline()||sharedWorldIsAuthority())return;const host=remotePresence.get(sharedWorldAuthorityId()),snapshot=multiplayerV2WorldSnapshot()||host?.sharedScene,a=snapshot?.a;if(a?.v!==1||!a.craft||!a.slots)return;
  const snapshotKey=[snapshot.authorityUid,snapshot.epoch,snapshot.seq,snapshot.at,a.revision].join(':');if(airOperations.lastSnapshotKey===snapshotKey)return;const incoming=Object.values(a.craft).every(c=>c&&airOperations.bases[c.base]&&[c.x,c.z,c.yaw].every(Number.isFinite)&&Math.abs(c.x)<2000&&Math.abs(c.z)<2000);if(!incoming)return;airOperations.lastSnapshotKey=snapshotKey;
  airOperations.fleet.data=JSON.parse(JSON.stringify(a));state.vehicles.airOperations=airOperations.fleet.data;airMaterialize();
 }
 function updateWorldAirOperations(){
  if(!airEnsure())return;const now=airNow(),dt=Math.max(0,Math.min(.1,(now-(airOperations.lastAt||now))/1000));airOperations.lastAt=now;airApplyReplica();const f=airOperations.fleet,own=sharedWorldOwnId(),authority=!airOnline()||sharedWorldIsAuthority();
  if(authority){
   for(const c of Object.values(f.data.craft)){
    if(c.status==='piloted'){
     const local=c.pilot===own&&otGames.active&&otGames.aircraftId===c.id,remote=remotePresence.get(c.pilot),r=local?{...otGames.body,onGround:otGames.onGround}:remote?.familyRide;
     if(r&&(!r.id||r.id===c.id)){c.x=r.x;c.z=r.z;c.y=r.y;c.yaw=r.yaw;c.seenAt=now;if(!r.onGround)f.depart(c.id,c.pilot,now);}
     else if(now-Number(c.seenAt||c.claimAt)>15000){c.status='parked';c.pilot='';c.parkedAt=now-20000;if(Number(c.y)>10)airStartRecovery(c,now);f.data.revision++;}
    }else if(c.status==='parked'){
     const nearLocal=otGames.active&&otGames.aircraftId===c.id||!otGames.active&&Math.hypot(player.x-c.x,player.z-c.z)<8,nearRemote=[...remotePresence.values()].some(p=>Math.hypot(Number(p.x)-c.x,Number(p.z)-c.z)<8),spec=f.spec(c.id),base=f.bases[c.base],away=Math.hypot(c.x-base.x,c.z-base.z)>10;
     if(!nearLocal&&!nearRemote){if(spec.mode==='balloon'&&c.departedAt&&now-c.parkedAt>45000){const to=away?airRecoveryDestination(c):{x:base.x+35,z:base.z+23};c.npc={at:now+5000,cruise:airSafeCruise(c,to,30),from:{x:c.x,z:c.z},to,ground:groundHeightAt(c.x,c.z),targetGround:groundHeightAt(to.x,to.z)};c.status='npc';f.data.revision++;}
      else if(away&&spec.mode!=='balloon'&&v704RoadAt(c.x,c.z,4)&&now-c.parkedAt>15000)airStartRecovery(c,now);}
    }else if(c.status==='recovering'&&airRecoveryPose(c.job,now).phase==='done'){const pose=c.job.to;Object.assign(c,{...pose,status:'parked',parkedAt:now});delete c.job;f.data.revision++;}
    else if(c.status==='npc'){const pose=airNpcBalloonPose(c,now),slot=f.data.slots[c.base];if(!c.npc.spawnMarked&&now>c.npc.at){if(slot.current===c.id){slot.current='';slot.spawnAt=now+180000;}c.npc.spawnMarked=true;f.data.revision++;}c.x=pose.x;c.z=pose.z;if(pose.done){Object.assign(c,{x:pose.x,z:pose.z,yaw:pose.yaw,status:'parked',parkedAt:now});delete c.npc;if(!slot.current&&Math.hypot(c.x-f.bases[c.base].x,c.z-f.bases[c.base].z)<3){slot.current=c.id;slot.spawnAt=0;}f.data.revision++;}}
   }
   f.tick(now);airMaterialize();
  }
  for(const [id,v]of airOperations.recovery){const c=f.data.craft[id];if(c?.status!=='recovering'){v.heli&&(v.heli.visible=false);v.cable&&(v.cable.visible=false);}if(c?.status!=='npc'&&c?.status!=='recovering')v.person.group.visible=false;}
  for(const c of Object.values(f.data.craft))if(c.status==='recovering')airRecoveryVisual(c,now);else if(c.status==='npc'){const p=airNpcBalloonPose(c,now),npc=airNpcPilot(c);const approach=3*(1-clamp((now-(c.npc.at-5000))/5000,0,1));npc.position.set(p.x+approach,p.y-.7,p.z);npc.rotation.y=p.yaw;npc.visible=Math.hypot(otGamesFocus().x-p.x,otGamesFocus().z-p.z)<250;}
  airSyncObstacles();campaignSyncAircraft();state.vehicles.airOperations=f.data;
  if(f.data.revision!==airOperations.revision&&now-airOperations.lastSave>1200){airOperations.revision=f.data.revision;airOperations.lastSave=now;state.vehicles.airOperations=f.data;saveState();sharedWorldRuntime.captureAt=0;}
 }
 const airOldTrafficFactor=trafficSpeedFactor;
 trafficSpeedFactor=function(actor,heading,lookAhead=7){let factor=airOldTrafficFactor(actor,heading,lookAhead);if(!airOperations.ready||factor===0)return factor;const body=trafficBody(actor,heading);
  for(const c of Object.values(airOperations.fleet.data.craft)){
   if(c.status!=='parked'&&c.status!=='recovering')continue;if(c.job&&['carry','lower','done'].includes(airRecoveryPose(c.job,airNow()).phase))continue;const obstacle=airObstacle(c.id,c),dx=obstacle.x-body.x,dz=obstacle.z-body.z,forward=dx*body.s+dz*body.c,lateral=Math.abs(dx*body.c-dz*body.s),dot=body.s*obstacle.s+body.c*obstacle.c,side=body.w+Math.abs(dot)*obstacle.w+Math.sqrt(Math.max(0,1-dot*dot))*obstacle.l+.5;
   if(forward>-.2&&lateral<side){const length=Math.abs(dot)*obstacle.l+Math.sqrt(Math.max(0,1-dot*dot))*obstacle.w,clearance=forward-body.l-length-1;factor=Math.min(factor,clamp(clearance/Math.max(2,lookAhead*.7),0,1));}
  }return factor;
 };
 const airOldCapture=sharedWorldCaptureScene;sharedWorldCaptureScene=function(...args){const s=airOldCapture(...args);if(airOperations.ready)s.a=airOperations.fleet.data;return s;};
 const airOldExpansion=updateWorldExpansion;updateWorldExpansion=function(){airOldExpansion();updateWorldAirOperations();};
 const airOldDepartures=openAirportDepartures;openAirportDepartures=function(){if(!airEnsure())return airOldDepartures();const f=airOperations.fleet,now=airNow();openModal('Aeroporto OT · embarque',`<p>A base repõe cada aeronave três minutos após a decolagem. A aeronave usada continua no mundo. Aproxime-se do embarque disponível e use AÇÃO.</p><div class="choice-grid">${Object.entries(f.data.slots).filter(([id])=>f.bases[id].mode!=='balloon').map(([id,s])=>{const available=!!s.current&&airAvailable(s.current),seconds=Math.max(0,Math.ceil((s.spawnAt-now)/1000));return `<button class="choice" data-airport-craft="${escapeHtml(s.current||id)}" ${available?'':'disabled'}><b>${escapeHtml(f.bases[id].label)}</b><span>${available?'EMBARQUE DISPONÍVEL':seconds?'Reposição em '+seconds+' segundos':'Aeronave reservada'}</span></button>`;}).join('')}</div>`,root=>root.querySelectorAll('[data-airport-craft]').forEach(b=>b.onclick=()=>setWaypoint('campaign-'+b.dataset.airportCraft)));};
 window.OT_WORLD_AIR_OPERATIONS={diagnostics:()=>({ready:airOperations.ready,authority:sharedWorldIsAuthority(),fleet:airOperations.fleet?JSON.parse(JSON.stringify(airOperations.fleet.data)):null,recovery:[...airOperations.recovery].filter(([,v])=>v.heli?.visible).map(([id])=>({id,phase:airRecoveryPose(airOperations.fleet.data.craft[id].job,airNow()).phase})),obstructions:airOperations.colliders.size})};

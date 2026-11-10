/** The player's phone dispatches existing vehicles; ownership, damage and
 * multiplayer occupancy remain in their original records. */
// @otthi-module-body
 const worldPhone={job:null,lastTick:0,pending:false,loadedOwner:'',driver:null,walkAway:null,returning:[],uiAt:0};

 class PhoneDriveRoute {
  constructor(points,heading=0){
   this.points=points.filter(p=>p&&[p.x,p.z].every(Number.isFinite)).map(p=>({x:p.x,z:p.z}));
   this.index=1;this.x=this.points[0]?.x||0;this.z=this.points[0]?.z||0;this.yaw=heading;this.speed=0;this.arrived=this.points.length<2;this.blocked=false;
  }
  step(dt,canMove,maxSpeed=7){
   let time=Math.max(0,Math.min(.1,dt));this.blocked=false;
   while(time>0&&!this.arrived){
    const h=Math.min(time,.025);time-=h;const to=this.points[this.index],dx=to.x-this.x,dz=to.z-this.z,d=Math.hypot(dx,dz);
    if(d<.16){if(!canMove(to.x,to.z,this.yaw)){this.speed=0;this.blocked=true;break;}this.x=to.x;this.z=to.z;if(++this.index>=this.points.length){this.arrived=true;this.speed=0;break;}continue;}
    const last=this.index===this.points.length-1,limit=Math.min(maxSpeed,last?Math.sqrt(Math.max(.1,2*2.8*d)):d<5?3:maxSpeed);
    const speed=Math.min(limit,this.speed+2.4*h),distance=Math.min(d,speed*h),yaw=Math.atan2(dx,dz),x=this.x+dx/d*distance,z=this.z+dz/d*distance;
    if(!canMove(x,z,yaw)){this.speed=0;this.blocked=true;break;}
    this.x=x;this.z=z;this.yaw=yaw;this.speed=speed;
   }
   return this;
  }
 }

 // Bounded local A*: every edge is swept through the real vehicle footprint.
 // A failed search keeps the car stopped; it never moves through a blocker.
 function phoneFindDetour(from,goals,canTravel,{step=2,maxNodes=1100,radius=46}={}){
  if(!goals.length)return null;const nodes=[],open=[],best=new Map(),goalDistance=p=>Math.min(...goals.map(g=>Math.hypot(g.x-p.x,g.z-p.z)));
  const start={x:from.x,z:from.z,yaw:from.yaw||0,g:0,parent:null};start.f=goalDistance(start);nodes.push(start);open.push(start);best.set('0:0:start',0);
  for(let count=0;open.length&&count<maxNodes;count++){
   let at=0;for(let i=1;i<open.length;i++)if(open[i].f<open[at].f)at=i;const p=open.splice(at,1)[0];
   for(let i=0;i<goals.length;i++){const goal=goals[i],distance=Math.hypot(goal.x-p.x,goal.z-p.z);if(distance>step*1.6||!canTravel(p,goal))continue;const path=[{x:goal.x,z:goal.z}];for(let n=p;n;n=n.parent)path.push({x:n.x,z:n.z});return{points:path.reverse(),goalIndex:i,visited:count+1};}
   for(let dir=0;dir<8;dir++){
    const angle=dir*Math.PI/4,x=from.x+Math.round((p.x-from.x)/step+Math.sin(angle))*step,z=from.z+Math.round((p.z-from.z)/step+Math.cos(angle))*step;
    if(Math.hypot(x-from.x,z-from.z)>radius)continue;const turn=Math.abs(Math.atan2(Math.sin(angle-p.yaw),Math.cos(angle-p.yaw)));if(p.parent&&turn>Math.PI*.76)continue;
    const next={x,z,yaw:angle,parent:p},g=p.g+Math.hypot(x-p.x,z-p.z)+turn*.65,key=Math.round((x-from.x)/step)+':'+Math.round((z-from.z)/step)+':'+dir;
    if(g>=(best.get(key)??Infinity)||!canTravel(p,next))continue;best.set(key,g);next.g=g;next.f=g+goalDistance(next);open.push(next);
   }
  }return null;
 }
 function phoneGroundRoute(vehicle,from,target){
  const core=buildRoutePoints(from,target);if(core.length<2)return core;
  const route=offsetBrazilianTrafficPath(core,1.35,{closed:false,valid:(x,z)=>v704RoadAt(x,z,.1,false)&&!navBlocked(x,z)});
  route[0]={x:from.x,z:from.z};route[route.length-1]={x:target.x,z:target.z};return compactRoute(route);
 }
 function phoneTravelClear(vehicle,from,to,traffic=true){
  const dx=to.x-from.x,dz=to.z-from.z,distance=Math.hypot(dx,dz),yaw=distance>.01?Math.atan2(dx,dz):from.yaw||0;
  for(let i=1,n=Math.max(1,Math.ceil(distance/.55));i<=n;i++){const t=i/n,x=from.x+dx*t,z=from.z+dz*t;
   // A short driveway connector is permitted. Detours remain on the road.
   if(distance>1&&!v704RoadAt(x,z,.15,true)&&Math.hypot(x-vehicle.group.position.x,z-vehicle.group.position.z)>6)return false;
   if(!phoneVehiclePoseClear(vehicle,x,z,yaw,traffic))return false;
  }return true;
 }
 function phoneRecoverRoute(job,dt){
  job.blockedFor=job.route.blocked?(job.blockedFor||0)+dt:0;job.replanIn=Math.max(0,(job.replanIn||0)-dt);
  if(job.blockedFor<1.8||job.replanIn>0)return false;job.replanIn=3;
  const motion=job.route,from={x:motion.x,z:motion.z,yaw:motion.yaw},goals=[];let length=0,last=from;
  for(let i=motion.index;i<motion.points.length&&length<42;i++){
   const p=motion.points[i],d=Math.hypot(p.x-last.x,p.z-last.z),samples=Math.max(1,Math.ceil(d/6));
   for(let n=1;n<=samples;n++){const t=n/samples,x=last.x+(p.x-last.x)*t,z=last.z+(p.z-last.z)*t,travel=length+d*t;if(travel>=9&&travel<=42)goals.push({x,z,index:i});}length+=d;last=p;
  }
  if(!goals.length)goals.push({...job.target,index:motion.points.length-1});
  const detour=phoneFindDetour(from,goals,(a,b)=>phoneTravelClear(job.vehicle,a,b,true));
  if(!detour)return false;const rejoin=goals[detour.goalIndex],points=compactRoute([...detour.points,...motion.points.slice(rejoin.index)]);
  job.route=new PhoneDriveRoute(points,motion.yaw);job.reroutes=(job.reroutes||0)+1;job.blockedFor=0;job.waiting=false;return true;
 }

 function phoneVehicleProbes(vehicle,yaw){
  const special=brazilDriveProbes(vehicle,yaw);if(special)return special;
  const data=vehicle?.group?.userData?.brazilRoot?.userData||{},front=Number(data.front)||1.8,rear=Number(data.rear)||-1.9,width=Number(data.halfWidth)||.8,points=[];
  for(let z=rear;z<front;z+=.65)for(const x of[-width,0,width])points.push([x*Math.cos(yaw)+z*Math.sin(yaw),-x*Math.sin(yaw)+z*Math.cos(yaw),.22]);
  for(const x of[-width,0,width])points.push([x*Math.cos(yaw)+front*Math.sin(yaw),-x*Math.sin(yaw)+front*Math.cos(yaw),.22]);
  return points;
 }
 function phoneVehiclePoseClear(vehicle,x,z,yaw,includeTraffic=true){
  const base=groundHeightAt(x,z);
  const body=trafficBody(vehicle,yaw,{x,z});
  for(const v of world.vehicles||[]){if(v===vehicle||!v.group||v.garageStored||state.vehicles?.garage?.stored?.[v.id]||state.vehicles?.workshopComponents?.[v.id]?.npcCollectedAt)continue;if(trafficBodiesOverlap(body,trafficBody(v),.12))return false;}
  if(includeTraffic)for(const actor of nearbyTrafficActors(x,z,20))if(actor.ref!==vehicle&&trafficBodiesOverlap(body,trafficBody(actor),.22))return false;
  for(const[dx,dz,radius]of phoneVehicleProbes(vehicle,yaw)){
   const px=x+dx,pz=z+dz;
   if(Math.abs(groundHeightAt(px,pz)-base)>.65||positionBlockedForPlayer(px,pz,radius,{ignoreActor:vehicle,ignoreTraffic:true,ignoreParkedVehicles:true}))return false;
   if(Math.hypot(player.x-px,player.z-pz)<.8)return false;
   for(const p of remotePresence.values())if(!p.vehicle&&Math.hypot(Number(p.x)-px,Number(p.z)-pz)<.8)return false;
  }
  return true;
 }
 function phoneGroundDestination(vehicle,includeTraffic=false,avoid=null){
  const projection=nearestRoadProjection(player);if(!projection||projection.distance>90)return null;
  const a=NAV_BASE_NODES[projection.aId],b=NAV_BASE_NODES[projection.bId],length=Math.hypot(b.x-a.x,b.z-a.z)||1,fx=(b.x-a.x)/length,fz=(b.z-a.z)/length,yaw=Math.atan2(fx,fz);
  for(const along of[8,-8,14,-14,22,-22,32,-32])for(const side of[2.5,-2.5,0]){
   const x=projection.point.x+fx*along+fz*side,z=projection.point.z+fz*along-fx*side;
   if(Math.hypot(player.x-x,player.z-z)<5||avoid&&Math.hypot(avoid.x-x,avoid.z-z)<5||!v704RoadAt(x,z,1.5,true))continue;
   if(phoneVehiclePoseClear(vehicle,x,z,yaw,includeTraffic))return{x,z,yaw};
  }
  return null;
 }
 function phoneMakeDriver(){
  const driver=createRoadsidePoliceOfficer(null);driver.group.name='OT_PHONE_DRIVER';
  driver.group.traverse(o=>{if(o.isMesh&&o.material&&[1.25,1.28,1.49].some(y=>Math.abs(o.position.y-y)<.015)){o.material=o.material.clone();o.material.color.setHex(0x546d78);o.material.userData.phoneDriverOwned=true;}});
  return driver;
 }
 function phoneRemoveDriver(driver){
  if(!driver)return;driver.group.parent?.remove(driver.group);
  driver.group.traverse(o=>{if(o.material?.userData.phoneDriverOwned)o.material.dispose();});
 }
 function phoneDriverInVehicle(driver,vehicle){
  if(driver.group.parent!==vehicle.group)vehicle.group.add(driver.group);
  const seat=brazilSeatOffset(vehicle.brazilModel,-1),scale=brazilSeatScale(vehicle.brazilModel);
  driver.group.position.set(seat.x,seat.y,seat.z);driver.group.rotation.set(0,0,0);driver.group.scale.setScalar(scale*.8);driver.group.visible=true;
  driver.leftLeg.rotation.x=driver.rightLeg.rotation.x=-1.2;driver.leftArm.rotation.x=driver.rightArm.rotation.x=-1;
 }
 function phoneDispatchAllowed(){return running&&!paused&&!player.vehicle&&!player.boating&&!player.transit.mode&&!currentHouse&&!otGames.active&&!worldVenues.session;}
 async function phoneDispatchGround(id,options={}){
  if(worldPhone.pending||worldPhone.job||worldPhone.purchasePending&&!options.orderId||!phoneDispatchAllowed()||!state.vehicles.owned.includes(id))return false;
  const caller=sharedWorldOwnId();worldPhone.pending=true;
  try{
   const entry=playerVehicleCatalogEntry(id);if(!entry||!await requestBrazilModel(entry.model))return false;
   // Loading a model may outlive a menu or an account switch.
   if(caller!==sharedWorldOwnId()||!phoneDispatchAllowed()||!state.vehicles.owned.includes(id))return false;
   const vehicle=vehicleById(id)||ensureCatalogVehicle(id);
   if(!vehicle||vehicle.occupied||vehicle.phoneDelivery||vehicle.workshopYardStatus||vehicleBrokenV704(vehicle)){toast('Este veículo está ocupado, em atendimento ou precisa de reparo.','info',3000);return false;}
   const target=phoneGroundDestination(vehicle);if(!target){toast('Não há uma vaga segura próxima. Aproxime-se de uma rua livre e chame novamente.','info',3400);return false;}
   const garage=ensurePlayerGarageState(),stored=!!garage.stored[id]||!!vehicle.garageStored;
   let from={x:vehicle.group.position.x,z:vehicle.group.position.z,yaw:vehicle.group.rotation.y};
   if(options.from)from={...options.from};
   else if(stored){const gate=worldLayoutPoint('homeGarage'),exit=garageDriveOutPoint(vehicle,gate);if(!exit){toast('A saída da garagem está ocupada. Libere a passagem para o motorista.','info',3000);return false;}from={...exit,yaw:exit.heading};}
   const route=phoneGroundRoute(vehicle,from,target);if(route.length<2||!phoneVehiclePoseClear(vehicle,from.x,from.z,from.yaw,false)){toast('A saída do veículo está bloqueada. Libere a passagem para o motorista.','info',3000);return false;}
   if(options.payment>0&&state.profile.coins<options.payment)return false;
   for(const key of Object.keys(garage.slots))if(garage.slots[key]===id)garage.slots[key]='';
   garage.stored[id]=false;setGarageVehicleStored(vehicle,false);world.playerGarageDisplayFleet?.get(id)&&(world.playerGarageDisplayFleet.get(id).visible=false);
   vehicle.occupied=true;vehicle.phoneDelivery=true;vehicle.group.visible=true;vehicle.group.position.set(from.x,groundHeightAt(from.x,from.z),from.z);vehicle.group.rotation.y=from.yaw;
   const driver=phoneMakeDriver();phoneDriverInVehicle(driver,vehicle);
   worldPhone.job={id,vehicle,driver,target,route:new PhoneDriveRoute(route,from.yaw),owner:sharedWorldOwnId(),saveAt:0,waiting:false,caller:{x:player.x,z:player.z},orderId:options.orderId||''};
   if(options.payment>0)addCoins(-options.payment);
   state.vehicles.phoneDelivery={id,type:'ground',status:'en-route',at:Date.now(),target,orderId:options.orderId||''};persistParkedVehicle(vehicle);saveState(true);closeModal();
   toast('Motorista a caminho com '+entry.label+'. A entrega será na vaga marcada.','good',3200);phoneWaypoint(target,'Entrega do meu veículo');return true;
  }finally{worldPhone.pending=false;}
 }
 function phoneWaypoint(point,label){state.waypoint={id:'phone-delivery',name:label,x:point.x,z:point.z,navX:point.x,navZ:point.z,arrived:false};world.routePath=buildRoutePoints(player,state.waypoint);updateWaypointMarker();}
 function phoneFinishGround(cancelled=false){
  const job=worldPhone.job;if(!job)return;if(job.kind==='parcel'){if(cancelled)phoneCancelParcel(job);else phoneParcelArrived(job);return;}if(worldPhone.walkAway){phoneRemoveDriver(worldPhone.walkAway.driver);worldPhone.walkAway=null;}const v=job.vehicle;v.occupied=false;v.phoneDelivery=false;v.x=v.group.position.x;v.z=v.group.position.z;v.heading=v.group.rotation.y;v.manualIgnition=true;
  persistParkedVehicle(v);state.vehicles.phoneDelivery={id:job.id,type:'ground',status:cancelled?'cancelled':'delivered',at:Date.now(),target:job.target};saveState(true);
  const exit=safePointNear(v.x,v.z,{heading:v.heading,ignoreActor:v,radius:.32,distances:[2.5,3.5,5],ignoreTraffic:false});
  if(exit){worldGroup.add(job.driver.group);job.driver.group.position.set(exit.x,exit.y,exit.z);job.driver.group.scale.setScalar(.65);job.driver.group.rotation.y=v.heading+Math.PI/2;job.driver.leftLeg.rotation.x=job.driver.rightLeg.rotation.x=0;worldPhone.walkAway={driver:job.driver,at:performance.now(),yaw:v.heading+Math.PI/2};}
  else phoneRemoveDriver(job.driver);
  if(job.orderId){const order=phoneOrders().find(o=>o.id===job.orderId);if(order)order.status=cancelled?'parked':'delivered';saveState(true);}
  worldPhone.job=null;world.trafficSnapshot=null;toast(cancelled?'Entrega interrompida. O veículo ficou estacionado na última posição segura.':'Seu veículo chegou. O motorista desembarcou; você já pode entrar.','good',3200);
 }
 function phoneAirLandingClear(id,x,z){
  const spec=airOperations.fleet.spec(id),plane=spec?.mode==='plane',width=plane?6:4,length=plane?7:5,ground=groundHeightAt(x,z),bounds=v704WorldBounds();
  if(x-width<bounds.minX||x+width>bounds.maxX||z-length<bounds.minZ||z+length>bounds.maxZ||waterAt(x,z))return false;
  for(const c of world.colliders){if(c.disabled||c.aircraftId===id)continue;if(Math.abs(c.x-x)<c.w/2+width&&Math.abs(c.z-z)<c.d/2+length)return false;}
  for(const v of world.vehicles||[])if(v.group?.visible&&Math.abs(v.group.position.x-x)<width+2&&Math.abs(v.group.position.z-z)<length+3)return false;
  for(const c of Object.values(airOperations.fleet.data.craft))if(c.id!==id&&c.status!=='piloted'){const p=c.delivery?.to||c;if(Math.hypot(p.x-x,p.z-z)<width+7)return false;}
  if(Math.hypot(player.x-x,player.z-z)<Math.max(width,length)+1)return false;
  for(const p of remotePresence.values())if(Math.hypot(Number(p.x)-x,Number(p.z)-z)<Math.max(width,length)+1)return false;
  for(const dx of[-width,0,width])for(const dz of[-length,0,length])if(waterAt(x+dx,z+dz)||Math.abs(groundHeightAt(x+dx,z+dz)-ground)>.45)return false;
  return true;
 }
 function phoneAirDestination(id,position){
  const spec=airOperations.fleet.spec(id);if(!spec)return null;
  if(spec.mode==='plane'){
   for(const z of[-244,-259,-274])for(const x of[46,67,88,109,130,151])if(phoneAirLandingClear(id,x,z))return{x,z,yaw:Math.PI/2};
   return null;
  }
  for(const radius of[14,22,32,45,60])for(let n=0;n<16;n++){const a=n*Math.PI/8,x=position.x+Math.sin(a)*radius,z=position.z+Math.cos(a)*radius;if(phoneAirLandingClear(id,x,z))return{x,z,yaw:Math.atan2(position.x-x,position.z-z)};}
  return null;
 }
 function phoneAirCruise(from,to){
  let height=airSafeCruise(from,to,45);
  for(const c of world.colliders){
   if(c.disabled)continue;
   const reach=Math.hypot(Number(c.w)||0,Number(c.d)||0)/2+12;
   if(v704DistanceToSegment(c,from,to).distance<=reach)height=Math.max(height,groundHeightAt(c.x,c.z)+Number(c.height||8)+20);
  }
  return height;
 }
 function phoneStartAirDelivery(id,uid,to){
  if(!airEnsure()||!airAvailable(id)||!uid||!to||![to.x,to.z,to.yaw].every(Number.isFinite)||!phoneAirLandingClear(id,to.x,to.z))return false;
  const c=airOperations.fleet.data.craft[id],spec=airOperations.fleet.spec(id),from={x:c.x,z:c.z,yaw:c.yaw},plane=spec.mode==='plane';
  if(Object.values(airOperations.fleet.data.craft).some(v=>v.status==='delivery'&&v.delivery?.uid===uid))return false;
  const cruise=Math.max(phoneAirCruise(from,to),phoneAirCruise({x:96,z:-164},from),groundHeightAt(from.x,from.z)+35,groundHeightAt(to.x,to.z)+35);
  // Fixed-wing aircraft use the established helicopter recovery crew when
  // parked away from a runway. They never rise vertically under their own power.
  const job={id,uid,at:airNow(),from,to,cruise,ground:groundHeightAt(c.x,c.z),targetGround:groundHeightAt(to.x,to.z),transport:plane};
  c.status='delivery';c.pilot=uid;c.delivery=job;delete c.job;airOperations.fleet.depart(id,uid,airNow());airOperations.fleet.data.revision++;sharedWorldRuntime.captureAt=0;return true;
 }
 function phoneAirDeliveryPose(job,now){
  if(job.transport){const pose=airRecoveryPose(job,now);if(job.holdLanding&&['lower','done'].includes(pose.phase))pose.craft.y=Math.max(pose.craft.y,job.targetGround+campaignAircraftHeight(job.id)+12);return pose;}
  const elapsed=Math.max(0,(now-job.at)/1000),distance=Math.hypot(job.to.x-job.from.x,job.to.z-job.from.z),travel=Math.max(5,distance/20),ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);},height=campaignAircraftHeight(job.id);
  let craft,phase='takeoff';
  if(elapsed<6)craft={...job.from,y:lerp(job.ground+height,job.cruise,ease(elapsed/6))};
  else if(elapsed<6+travel){phase='flight';const t=ease((elapsed-6)/travel);craft={x:lerp(job.from.x,job.to.x,t),z:lerp(job.from.z,job.to.z,t),y:job.cruise,yaw:Math.atan2(job.to.x-job.from.x,job.to.z-job.from.z)};}
  else{phase=elapsed>=14+travel?'done':'landing';craft={...job.to,y:lerp(job.cruise,job.targetGround+height,ease((elapsed-6-travel)/8))};}
  if(job.holdLanding&&['landing','done'].includes(phase))craft.y=Math.max(craft.y,job.targetGround+height+12);
  return{phase,craft};
 }
 function phoneUpdateAirDelivery(c,now,authority){
  if(!c.delivery)return;const job=c.delivery;if(authority)job.holdLanding=!phoneAirLandingClear(c.id,job.to.x,job.to.z);const pose=phoneAirDeliveryPose(job,now);
  if((pose.phase==='done'||pose.phase==='landing'||pose.phase==='lower')&&!phoneAirLandingClear(c.id,job.to.x,job.to.z))pose.craft.y=Math.max(pose.craft.y,job.targetGround+campaignAircraftHeight(c.id)+12);
  if(job.transport){const prior=c.job;c.job=job;airRecoveryVisual(c,now);if(prior)c.job=prior;else delete c.job;}
  else{
   let visual=airOperations.recovery.get(c.id);if(!visual){visual={person:phoneMakeDriver()};airOperations.recovery.set(c.id,visual);}
   const seat=aircraftSeatOffset('helicopter',-1,c.id),p=pose.craft;visual.person.group.position.set(p.x+seat.x,p.y+seat.y,p.z+seat.z);visual.person.group.rotation.y=p.yaw;visual.person.group.scale.setScalar(.24);visual.person.group.visible=true;
  }
  if(!authority)return;Object.assign(c,{x:pose.craft.x,z:pose.craft.z,y:pose.craft.y,yaw:pose.craft.yaw,onGround:false});
  if(pose.phase==='done'&&phoneAirLandingClear(c.id,job.to.x,job.to.z)){
   airOperations.fleet.park(c.id,c.pilot,{...job.to,hp:c.hp},now);delete c.delivery;
   const visual=airOperations.recovery.get(c.id);if(visual){if(visual.heli)visual.heli.visible=false;if(visual.cable)visual.cable.visible=false;visual.person.group.position.set(job.to.x+4,groundHeightAt(job.to.x+4,job.to.z),job.to.z);visual.person.group.scale.setScalar(.65);visual.person.group.visible=true;visual.person.phoneLeaveAt=now+7000;}
   if(job.uid===sharedWorldOwnId()){state.vehicles.aircraft||={};state.vehicles.aircraft[c.id]={...job.to,hp:c.hp,parkedAt:now};state.vehicles.phoneDelivery={id:c.id,type:'air',status:'delivered',target:job.to,at:Date.now()};toast('A aeronave chegou e está livre para embarque.','good',3500);}
   airOperations.fleet.data.revision++;sharedWorldRuntime.captureAt=0;
  }
 }
 async function phoneDispatchAir(id){
  if(worldPhone.pending||worldPhone.job||!phoneDispatchAllowed()||!airEnsure()||!state.vehicles.aircraft?.[id])return false;
  const target=phoneAirDestination(id,player);if(!target){toast('Não há área de pouso livre. Aproxime-se de um local aberto.','info',3000);return false;}
  const caller=sharedWorldOwnId();worldPhone.pending=true;
  try{
   let ok=false;
   if(!airOnline()||sharedWorldIsAuthority())ok=phoneStartAirDelivery(id,sharedWorldOwnId(),target);
   else{
    const result=await window.OTTHOS_RTDB.sendEventV2('air-fleet',{action:'phone-delivery',id,pose:target});
    if(result?.ok)ok=await new Promise(resolve=>{const began=performance.now(),timer=setInterval(()=>{const c=airOperations.fleet.data.craft[id];if(c?.status==='delivery'&&c.delivery?.uid===sharedWorldOwnId()){clearInterval(timer);resolve(true);}else if(performance.now()-began>6500){clearInterval(timer);resolve(false);}},100);});
   }
   if(caller!==sharedWorldOwnId())return false;
   if(!ok){toast('A aeronave está ocupada ou o pedido não foi confirmado. Tente novamente.','info',3200);return false;}
   state.vehicles.phoneDelivery={id,type:'air',status:'en-route',target,at:Date.now()};saveState(true);closeModal();phoneWaypoint(target,'Entrega da aeronave');toast(airOperations.fleet.spec(id)?.mode==='plane'?'A equipe vai trazer o avião para uma vaga no aeroporto, marcada no GPS.':'Um piloto está trazendo o helicóptero para a área marcada.','good',3900);return true;
  }finally{worldPhone.pending=false;}
 }
 function openWorldPhone(){
  if(!running)return;const owned=garageOwnedEntries(),air=airEnsure()?Object.keys(state.vehicles.aircraft||{}).filter(id=>airOperations.fleet.spec(id)):[],record=state.vehicles.phoneDelivery;
  const groundBusy=!!worldPhone.job,airBusy=Object.values(airOperations.fleet?.data.craft||{}).some(c=>c.status==='delivery'&&c.delivery?.uid===sharedWorldOwnId()),busy=worldPhone.pending||groundBusy||airBusy,allowed=phoneDispatchAllowed();
  openModal('📱 Celular do personagem',`<section class="world-phone"><p class="world-phone-intro">Chame um motorista, acompanhe o trajeto e receba suas compras no mundo. Aviões são entregues no aeroporto.</p><div class="world-phone-actions"><button class="btn primary" data-phone-shop>COMPRAR E RECEBER</button><button class="btn" data-phone-store-all>GUARDAR TODOS OS VEÍCULOS DISPONÍVEIS</button><button class="btn" data-phone-track ${phoneDeliveryTracking()?'':'disabled'}>VER MOTORISTA E ROTA NO MAPA</button></div><p class="world-phone-status" data-phone-status role="status">${record?.status==='delivered'?'Última entrega concluída':'Escolha um veículo ou faça uma compra.'}</p>${worldPhone.job?.kind==='parcel'?'<button class="btn good" data-phone-parcel-receive>RECEBER ENCOMENDA</button>':''}${!allowed?'<p>Desembarque e fique em uma área externa para solicitar uma entrega.</p>':''}<h3>Meus veículos</h3><div class="world-phone-list">${owned.map(e=>`<div class="world-phone-vehicle"><button class="btn" type="button" data-phone-ground="${escapeHtml(e.id)}" ${busy||!allowed?'disabled':''}><span>${escapeHtml(e.icon||'🚗')} ${escapeHtml(e.label)}</span><small>Unidade ${e.unit} · chamar motorista</small></button><button class="btn" data-phone-store="${escapeHtml(e.id)}" ${state.vehicles.garage.stored[e.id]||garageStorageBlock(e.id)?'disabled':''}>${state.vehicles.garage.stored[e.id]?'GUARDADO':'GUARDAR'}</button></div>`).join('')}</div><h3>Aeronaves utilizadas</h3><p>As aeronaves que você já pilotou aparecem aqui quando estão disponíveis.</p><div class="world-phone-list">${air.map(id=>`<button class="btn" type="button" data-phone-air="${escapeHtml(id)}" ${busy||!allowed||!airAvailable(id)?'disabled':''}><span>${escapeHtml(airOperations.fleet.spec(id).label)}</span><small>${airAvailable(id)?'Chamar equipe':'Em uso ou em transporte'}</small></button>`).join('')||'<p>Nenhuma aeronave registrada neste perfil.</p>'}</div>${groundBusy?'<button class="btn" type="button" data-phone-cancel>Interromper entrega terrestre</button>':''}</section>`,root=>{
   root.querySelectorAll('[data-phone-ground]').forEach(b=>b.onclick=()=>phoneDispatchGround(b.dataset.phoneGround));root.querySelectorAll('[data-phone-air]').forEach(b=>b.onclick=()=>phoneDispatchAir(b.dataset.phoneAir));root.querySelector('[data-phone-cancel]')?.addEventListener('click',()=>{phoneFinishGround(true);openWorldPhone();});
   root.querySelector('[data-phone-track]').onclick=()=>{worldPhone.focusMap=true;openMap();};root.querySelector('[data-phone-shop]').onclick=()=>openPhoneShop();
   root.querySelector('[data-phone-store-all]').onclick=()=>{garageStoreAll();openWorldPhone();};root.querySelectorAll('[data-phone-store]').forEach(b=>b.onclick=()=>{if(storeOwnedVehicle(b.dataset.phoneStore))openWorldPhone();});root.querySelector('[data-phone-parcel-receive]')?.addEventListener('click',()=>{phoneReceiveParcel();openWorldPhone();});phoneUpdateTrackingUI();
  });
 }
 function phoneDeliveryTracking(){
  const job=worldPhone.job;if(job){const route=compactRoute([{x:job.route.x,z:job.route.z},...job.route.points.slice(job.route.index)]);return{id:job.id,kind:job.kind||'ground',x:job.route.x,z:job.route.z,yaw:job.route.yaw,target:{...job.target},route,distance:routeLength(route),waiting:!!job.waiting,ready:!!job.ready,reroutes:job.reroutes||0,label:job.kind==='parcel'?'Sua encomenda':'Seu motorista'};}
  const record=state.vehicles.phoneDelivery;if(record?.type==='air'&&record.status==='en-route'){const c=airOperations.fleet?.data.craft[record.id];if(c?.delivery){const from={x:c.x,z:c.z};return{id:c.id,kind:'air',...from,yaw:c.yaw,target:record.target,route:[from,record.target],distance:Math.hypot(from.x-record.target.x,from.z-record.target.z),label:'Seu piloto'};}}
  return null;
 }
 function phoneTrackingText(t=phoneDeliveryTracking()){return t?t.ready?'Encomenda chegou — aproxime-se para receber':`${t.label} · ${Math.round(t.distance)} m até a entrega${t.waiting?' · aguardando passagem / recalculando rota':''}`:state.vehicles.phoneDelivery?.status==='delivered'?'Última entrega concluída':'Escolha um veículo ou faça uma compra.';}
 function phoneUpdateTrackingUI(){
  const t=phoneDeliveryTracking(),root=els.modalBody,p=root?.querySelector('[data-phone-status]');if(p)p.textContent=phoneTrackingText(t);const track=root?.querySelector('[data-phone-track]');if(track)track.disabled=!t;
  const receive=root?.querySelector('[data-phone-parcel-receive]');if(receive){receive.disabled=!t?.ready||Math.hypot(player.x-t.x,player.z-t.z)>6;receive.textContent=receive.disabled?'APROXIME-SE DA ENCOMENDA':'RECEBER ENCOMENDA';}
 }
 function phoneDrawMiniTracking(){
  const t=phoneDeliveryTracking(),canvas=els.miniMapCanvas;if(!t||!canvas)return;const {w,h}=miniMapLogicalSize(canvas),ctx=canvas.getContext('2d'),scale=miniMapScale(w,h);
  ctx.save();ctx.strokeStyle='#ffbd45';ctx.lineWidth=4;ctx.setLineDash([5,3]);ctx.beginPath();for(const [i,p]of t.route.entries()){const q=miniPoint(p.x,p.z,scale,w,h);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);}ctx.stroke();ctx.setLineDash([]);
  const q=miniPoint(t.x,t.z,scale,w,h),x=clamp(q.x,12,w-12),y=clamp(q.y,36,h-12);ctx.translate(x,y);ctx.rotate(Math.atan2(q.x-x,-(q.y-y))||t.yaw);ctx.fillStyle='#ffbd45';ctx.strokeStyle='#102936';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(7,7);ctx.lineTo(-7,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
 }
 function phoneAdvanceJob(job,dt){
  if(job.ready)return;const motion=job.route.step(dt,(x,z,yaw)=>phoneVehiclePoseClear(job.vehicle,x,z,yaw,true),brazilDepotVehicle(job.id)?4:7),v=job.vehicle,oldX=v.group.position.x,oldZ=v.group.position.z;
  v.group.position.set(motion.x,groundHeightAt(motion.x,motion.z),motion.z);v.group.rotation.y=motion.yaw;v.x=motion.x;v.z=motion.z;v.heading=motion.yaw;v.currentSpeed=motion.speed;v.speed=7;
  const travel=Math.hypot(motion.x-oldX,motion.z-oldZ);for(const wheel of v.group.userData.wheels||[])wheel.rotation.x-=travel*3;animateBrazilTransport(v.group);world.trafficSnapshot=null;
  if(motion.blocked&&!job.waiting){job.waiting=true;toast('O motorista está buscando passagem para continuar a entrega.','info',2500);}else if(!motion.blocked)job.waiting=false;
  const recovered=phoneRecoverRoute(job,dt);
  if(!recovered&&job.blockedFor>12&&job.replanIn===3&&job.kind!=='return'){
   const target=phoneGroundDestination(v,true,job.target);if(target){job.target=target;job.route=new PhoneDriveRoute(phoneGroundRoute(v,{x:v.x,z:v.z,yaw:v.heading},target),v.heading);job.blockedFor=0;job.reroutes=(job.reroutes||0)+1;if(state.waypoint?.id==='phone-delivery')phoneWaypoint(target,'Entrega até você');}
  }
 }
 function updateWorldPhone(){
  const now=performance.now(),dt=Math.min(.1,Math.max(0,(now-(worldPhone.lastTick||now))/1000));worldPhone.lastTick=now;
  if(!running||paused||document.hidden)return;
  const airRecord=state.vehicles.phoneDelivery;if(airRecord?.type==='air'&&airRecord.status==='en-route'){const craft=airOperations.fleet?.data.craft[airRecord.id];if(craft?.status==='parked'&&Math.hypot(craft.x-airRecord.target.x,craft.z-airRecord.target.z)<3){airRecord.status='delivered';state.vehicles.aircraft||={};state.vehicles.aircraft[craft.id]={x:craft.x,z:craft.z,yaw:craft.yaw,hp:craft.hp,parkedAt:Date.now()};saveState(true);}}
  const owner=sharedWorldOwnId();if(worldPhone.loadedOwner!==owner){worldPhone.loadedOwner=owner;if(!worldPhone.job&&state.vehicles.phoneDelivery?.type==='ground'&&state.vehicles.phoneDelivery.status==='en-route'){state.vehicles.phoneDelivery.status='interrupted';const order=phoneOrders().find(o=>o.id===state.vehicles.phoneDelivery.orderId);if(order?.kind==='vehicle')order.status='parked';saveState(true);}}
  updatePhoneOrders(dt);
  const job=worldPhone.job;if(job){
   if(job.owner!==owner){if(job.kind==='parcel')phoneReleaseCourier(job);else{job.vehicle.occupied=false;job.vehicle.phoneDelivery=false;phoneRemoveDriver(job.driver);}worldPhone.job=null;return;}
   phoneAdvanceJob(job,dt);const v=job.vehicle;
   // Follow a walking caller, retaining a safe roadside stop rather than the
   // stale position where the request was originally made.
   job.targetCheck=(job.targetCheck||0)+dt;if(job.targetCheck>2){job.targetCheck=0;if(!job.ready&&!player.vehicle&&!currentHouse&&job.caller&&Math.hypot(player.x-job.caller.x,player.z-job.caller.z)>18){const target=phoneGroundDestination(v);if(target){job.target=target;job.caller={x:player.x,z:player.z};job.route=new PhoneDriveRoute(phoneGroundRoute(v,{x:v.x,z:v.z,yaw:v.heading},target),v.heading);if(state.waypoint?.id==='phone-delivery')phoneWaypoint(target,'Entrega até você');}}}
   if(now-job.saveAt>1000){job.saveAt=now;if(job.kind==='parcel')phoneSaveParcelPose(job);else persistParkedVehicle(v);saveState();}
   if(job.route.arrived&&!job.ready)phoneFinishGround();
  }
  const walk=worldPhone.walkAway;if(walk){const elapsed=(now-walk.at)/1000,p=walk.driver.group.position,x=p.x+Math.sin(walk.yaw)*dt,z=p.z+Math.cos(walk.yaw)*dt;if(!positionBlockedForPlayer(x,z,.25,{ignoreTraffic:false})){p.x=x;p.z=z;p.y=groundHeightAt(x,z);}const step=Math.sin(elapsed*8)*.35;walk.driver.leftLeg.rotation.x=step;walk.driver.rightLeg.rotation.x=-step;walk.driver.leftArm.rotation.x=-step;walk.driver.rightArm.rotation.x=step;if(elapsed>10){phoneRemoveDriver(walk.driver);worldPhone.walkAway=null;}}
  if(now-worldPhone.uiAt>350){worldPhone.uiAt=now;phoneUpdateTrackingUI();}
 }
 const phonePreviousExpansion=updateWorldExpansion;updateWorldExpansion=function(){phonePreviousExpansion();updateWorldPhone();};
 document.getElementById('worldPhoneBtn')?.addEventListener('click',openWorldPhone);
 const phonePreviousMiniMap=drawMiniMap;drawMiniMap=function(){phonePreviousMiniMap();phoneDrawMiniTracking();};
 window.OT_WORLD_PHONE={open:openWorldPhone,diagnostics:()=>({pending:worldPhone.pending,job:worldPhone.job?{id:worldPhone.job.id,target:worldPhone.job.target,x:worldPhone.job.route.x,z:worldPhone.job.route.z,waiting:worldPhone.job.waiting,driverVisible:worldPhone.job.driver.group.visible}:null,tracking:phoneDeliveryTracking(),orders:phoneOrders().map(o=>({...o})),last:state.vehicles.phoneDelivery||null})};

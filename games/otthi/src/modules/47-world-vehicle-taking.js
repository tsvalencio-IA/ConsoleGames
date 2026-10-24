/** Moving city and highway cars enter the same persistent vehicle engine. */
// @otthi-module-body
  const trafficClaims={lastAt:0,registered:new Set()};
  function trafficLocalClaims(){if(!state.vehicles.trafficTaken||typeof state.vehicles.trafficTaken!=='object')state.vehicles.trafficTaken={};return state.vehicles.trafficTaken;}
  function trafficClaimPresence(){return{trafficTaken:Object.entries(trafficLocalClaims()).slice(0,16).map(([id,p])=>({id,at:p.at,uid:p.uid}))};}
  function trafficClaimOwner(id){const candidates=[];const own=trafficLocalClaims()[id];if(own)candidates.push({uid:String(sharedWorldOwnId()),at:Number(own.at)||0});for(const[uid,p]of remotePresence)for(const c of Array.isArray(p.trafficTaken)?p.trafficTaken:[])if(c.id===id&&Number.isFinite(c.at))candidates.push({uid:String(uid),at:c.at});candidates.sort((a,b)=>a.at-b.at||a.uid.localeCompare(b.uid));return candidates[0]?.uid||'';}
  function trafficPlayableVehicle(actor){const id='traffic-'+actor.id;let v=vehicleById(id);if(v)return v;const saved=state.vehicles.parked?.[id],x=Number.isFinite(saved?.x)?saved.x:actor.group.position.x,z=Number.isFinite(saved?.z)?saved.z:actor.group.position.z;v=createToyCar(x,z,{id,label:actor.bodyType==='truck'?'Caminhão rodoviário':'Veículo do trânsito',bodyType:actor.bodyType==='truck'?'truck':'small',brazilModel:actor.brazilModel||'',primary:actor.color||0x2788d2,heading:Number(saved?.heading??actor.group.rotation.y)||0});v.trafficActorId=actor.id;return v;}
  function trafficTakeVehicle(actor){
    if(!actor||player.vehicle||player.boating||player.transit.mode||otGames.active||trafficClaimOwner(actor.id)||!actor.group.visible||Math.hypot(player.x-actor.group.position.x,player.z-actor.group.position.z)>5.4||!canEnterMobility(PLAYER_MODES.VEHICLE_DRIVER))return false;
    const claims=trafficLocalClaims(),speed=Number(actor.currentSpeed)||0,previousVisible=actor.group.visible,v=trafficPlayableVehicle(actor);if(!familyCanBoardVehicle(v))return false;
    v.group.position.copy(actor.group.position);v.x=actor.group.position.x;v.z=actor.group.position.z;v.heading=actor.group.rotation.y;actor.group.visible=false;actor.taken=true;world.trafficSnapshot=null;
    if(!enterVehicle(v)){actor.taken=false;actor.group.visible=previousVisible;v.group.visible=false;return false;}
    claims[actor.id]={uid:sharedWorldOwnId(),at:Date.now()};player.car.speed=clamp(speed,0,14);player.vx=Math.sin(player.car.heading)*player.car.speed;player.vz=Math.cos(player.car.heading)*player.car.speed;persistParkedVehicle(v);saveState(true);updateMultiplayer(0,true);toast('Você assumiu o veículo. Sua família embarcou junto.','good',2300);return true;
  }
  function updateTrafficVehicleTaking(){
    const now=performance.now();if(!worldExpansion.ready||now-trafficClaims.lastAt<100)return;trafficClaims.lastAt=now;
    for(const actor of world.ottoviasTraffic||[]){
      if(!trafficClaims.registered.has(actor.id)){trafficClaims.registered.add(actor.id);registerInteractable({id:'take-traffic-'+actor.id,type:'vehicle',icon:'🚙',label:'Entrar no veículo em movimento',radius:5.2,priority:195,getPos:()=>({x:actor.group.position.x,z:actor.group.position.z}),available:()=>!otGames.active&&!player.vehicle&&!player.boating&&!player.transit.mode&&actor.group.visible&&!trafficClaimOwner(actor.id),action:()=>trafficTakeVehicle(actor)});}
      const winner=trafficClaimOwner(actor.id),claim=trafficLocalClaims()[actor.id];actor.taken=!!winner;if(winner){actor.group.visible=false;world.trafficSnapshot=null;}
      if(claim&&winner===sharedWorldOwnId()){const v=trafficPlayableVehicle(actor);if(!v.occupied&&player.car.id!==v.id)v.group.visible=true;}
      else if(claim&&winner&&winner!==sharedWorldOwnId()){const v=vehicleById('traffic-'+actor.id);if(v){if(player.vehicle&&currentVehicleRef()===v)exitVehicle(true);v.group.visible=false;}delete trafficLocalClaims()[actor.id];saveState(true);}
    }
  }
  window.OTTHI_TRAFFIC_TAKING={diagnostics:()=>({claims:trafficClaimPresence().trafficTaken,actors:(world.ottoviasTraffic||[]).map(a=>({id:a.id,x:a.group.position.x,z:a.group.position.z,heading:a.group.rotation.y,speed:a.currentSpeed,visible:a.group.visible,taken:!!a.taken,bodyType:a.bodyType,untilTurn:Math.hypot(a.route[a.index].x-a.group.position.x,a.route[a.index].z-a.group.position.z)}))})};

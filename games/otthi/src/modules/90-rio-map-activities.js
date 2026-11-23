/** Activities of the separate Rio Preto map. Native movement and profiles remain authoritative. */
// @otthi-module-body
  const RIO_FUEL_PRICE=2;
  const RIO_GARAGE_BAY=Object.freeze({x:985,z:-37,heading:2.805});
  function rioOwnedRoadVehicle(vehicle){
    return !!vehicle&&state.vehicles.owned.includes(vehicle.id)&&!!playerVehicleCatalogEntry(vehicle.id);
  }
  function rioFuelCapacity(vehicle){
    if(!rioOwnedRoadVehicle(vehicle)||vehicle.brazilModel==='bicycle')return 0;
    return brazilDepotVehicle(vehicle.id)?130:vehicle.kind==='moto'?12:42;
  }
  function rioRoadVehicleSave(id){
    const vehicles=rioMapSave().roadVehicles;
    return vehicles[id]??={};
  }
  function rioFuelLevel(vehicle=currentVehicleRef()){
    const tank=rioFuelCapacity(vehicle);
    if(!tank)return 0;
    const fuel=rioMapSave().roadVehicles[vehicle.id]?.fuel;
    return Number.isFinite(fuel)?clamp(fuel,0,tank):Math.min(15,tank/2);
  }
  function rioRecordVehiclePose(vehicle,x,z,heading){
    if(!rioOwnedRoadVehicle(vehicle)||![x,z,heading].every(Number.isFinite))return;
    Object.assign(rioRoadVehicleSave(vehicle.id),{x:+x.toFixed(2),z:+z.toFixed(2),heading:+heading.toFixed(3)});
    vehicle.x=x;vehicle.z=z;vehicle.heading=heading;
  }
  function rioOpenFuel(site,room,pump){
    const vehicle=currentVehicleRef(),tank=rioFuelCapacity(vehicle);
    const parked=()=>player.vehicle&&currentVehicleRef()===vehicle&&tank&&Math.abs(player.car.speed)<.55&&
      room.root.visible&&Math.hypot(player.x-pump.x,player.z-pump.z)<2.65;
    if(!parked()){
      toast('Pare um veículo a motor na faixa ao lado da bomba.','warn',2000);return false;
    }
    const fuel=rioFuelLevel(vehicle),litres=Math.min(10,Math.floor(tank-fuel));
    if(litres<=0){toast('O tanque está cheio.','info',1800);return false;}
    const price=litres*RIO_FUEL_PRICE;
    openModal('Posto Chiesa Brasília','<p>'+escapeHtml(vehicle.label)+' parado na bomba. O tanque tem '+fuel.toFixed(1)+' de '+tank+
      ' litros.</p><button class="btn primary" data-rio-refuel>Abastecer '+litres+' l por '+price+' moedas</button>',root=>{
      const button=root.querySelector('[data-rio-refuel]');
      button.onclick=()=>{
        const current=rioFuelLevel(vehicle);
        if(button.disabled||!parked()||current+litres>tank+.001)return;
        if(Number(state.profile.coins)<price){toast('Moedas insuficientes.','warn',2000);return;}
        button.disabled=true;
        closeModal();rioRoadVehicleSave(vehicle.id).fuel=current+litres;addCoins(-price);
        rioCountVisit(site);toast(litres+' litros no tanque.','good',2100);
      };
    });
    return true;
  }

  function rioAtFleetCounter(){
    return !player.vehicle&&!player.boating&&!player.swimming&&rioMap.garage&&distance2D(player,rioMap.garage.counter)<2.65;
  }
  function rioFleetSavedPose(id){
    const record=rioMapSave().roadVehicles[id];
    const valid=record&&!record.stored&&[record.x,record.z,record.heading].every(Number.isFinite)&&
      !positionBlockedForPlayer(record.x,record.z,1.25,{ignoreTraffic:true,ignoreParkedVehicles:true});
    return valid?record:RIO_GARAGE_BAY;
  }
  function rioRemoveRoadVehicle(vehicle){
    clearThemedVehicleGeometry(vehicle.group);vehicle.group.parent?.remove(vehicle.group);
    world.vehicles=world.vehicles.filter(car=>car!==vehicle);
    world.interactables=world.interactables.filter(action=>action.id!=='vehicle-'+vehicle.id);
    if(world.vehicle===vehicle)world.vehicle=null;
    if(rioMap.vehicle===vehicle)rioMap.vehicle=null;
    world.trafficSnapshot=null;
  }
  function rioSyncFleetPresent(vehicle,pose){
    world.vehicle=vehicle;
    rioMap.vehicle=vehicle;
    rioMapSave().roadVehicleId=vehicle.id;
    rioRoadVehicleSave(vehicle.id).stored=false;
    setGarageVehicleStored(vehicle,false);
    vehicle.group.position.set(pose.x,rioTerrainY(pose.x,pose.z),pose.z);
    vehicle.group.rotation.y=pose.heading;
    vehicle.manualIgnition=!!state.vehicles.manualIgnition?.[vehicle.id];
    rioRecordVehiclePose(vehicle,pose.x,pose.z,pose.heading);
  }
  function rioRestoreOwnedFleet(){
    if(!rioMap.garage||player.vehicle||rioOwnedRoadVehicle(rioMap.vehicle))return;
    if(rioMap.vehicle)rioRemoveRoadVehicle(rioMap.vehicle);
    const entries=garageOwnedEntries(),saved=rioMapSave();
    const entry=entries.find(e=>e.id===saved.roadVehicleId)||entries.find(e=>e.id===state.vehicles.primaryId)||entries[0];
    if(!entry||saved.roadVehicles[entry.id]?.stored)return;
    const pose=rioFleetSavedPose(entry.id);
    const car=ensureCatalogVehicle(entry.id,1,pose);
    if(car)rioSyncFleetPresent(car,pose);
    // The pickup counter remains available if an imported car still needs to download.
  }
  function openRioFleetCounter(){
    if(!rioAtFleetCounter())return false;
    const entries=garageOwnedEntries();
    openModal('Minha garagem · Rio Preto','<p>Escolha um veículo da sua garagem para a vaga ao lado.</p><div class="choice-grid">'+
      entries.map(entry=>'<button class="choice" data-rio-owned="'+escapeHtml(entry.id)+'"><b>'+entry.icon+' '+escapeHtml(entry.label)+
        '</b><span>Unidade '+entry.unit+(rioMap.vehicle?.id===entry.id?' · em uso no mapa':'')+'</span></button>').join('')+
      '</div>',root=>{
      const choices=[...root.querySelectorAll('[data-rio-owned]')];
      for(const button of choices)button.onclick=async()=>{
        if(!rioAtFleetCounter()||button.disabled)return;
        const entry=entries.find(e=>e.id===button.dataset.rioOwned);
        const reason=garageStorageBlock(entry.id);
        if(reason){toast(reason,'warn',2400);return;}
        choices.forEach(choice=>{choice.disabled=true;});
        try{
          if(!await requestBrazilModel(entry.model)||!button.isConnected||!rioAtFleetCounter()||garageStorageBlock(entry.id))return;
          const parked=world.vehicles.find(v=>v.id!==entry.id&&v.group.visible&&distance2D(v.group.position,RIO_GARAGE_BAY)<4.5);
          if(parked&&(!rioOwnedRoadVehicle(parked)||!storeOwnedVehicle(parked.id,true))){toast('A vaga está ocupada. Libere a passagem para retirar o veículo.','warn',2500);return;}
          const car=ensureCatalogVehicle(entry.id,1,RIO_GARAGE_BAY);
          if(!car)return;
          rioSyncFleetPresent(car,RIO_GARAGE_BAY);closeModal();saveState(true);
          updateContext(true);toast(car.label+' está na sua vaga.','good',2000);
        }finally{choices.forEach(choice=>{choice.disabled=false;});}
      };
    });
    return true;
  }
  function rioBuildFleetParking(){
    ensurePlayerGarageState();
    const {x,z,heading}=RIO_GARAGE_BAY,s=Math.sin(heading),c=Math.cos(heading);
    const point=(side,forward)=>({x:x+c*side+s*forward,z:z-s*side+c*forward});
    const root=new THREE.Group();root.name='RIO_OWNED_FLEET';worldGroup.add(root);
    const batch=rioCreateBatch(root);
    const place=(side,y,forward,w,h,d,color)=>{
      const p=point(side,forward);batch.part('box',p.x,y,p.z,w,h,d,color,heading);
    };
    place(0,.032,3,5.25,.059,19,0x777d76);
    for(const side of [-2.47,2.47])place(side,.068,0,.13,.02,13,0xe6d99e);
    place(3.4,.065,-2,1.68,.12,2.4,0xa9a492);
    place(3.95,.81,-2,.14,1.6,.15,0x3c5261);
    batch.commit();
    const counter=point(3.1,-2),sign=point(4.15,-2);
    citySign(root,'MINHA GARAGEM',sign.x,1.85,sign.z,2.65,1,'#305466',.43);
    rioMap.garage={counter,pad:RIO_GARAGE_BAY};
    registerInteractable({id:'rio-fleet-counter',type:'garage',icon:'🔑',label:'Retirar veículo da garagem',
      ...counter,radius:2.35,priority:260,available:rioAtFleetCounter,action:openRioFleetCounter});
    rioRestoreOwnedFleet();
  }

  function rioBuildPractice(site,room){
    const {w,d}=site,z=-d*.17;
    room.box(0,.036,0,w,.069,d,0x599355);
    room.box(0,.08,0,.08,.022,d-.16,0xf5efdf);
    for(const x of [-2,2])room.box(x,1.09,z,.14,2.18,.13,0xf4f3e4);
    room.box(0,2.18,z,4.13,.15,.13,0xf4f3e4);
    const ball=v705Ball(0xf5ede0,.24),at=room.point(0,z+5.4),goal=room.point(0,z);
    worldGroup.remove(ball);room.root.add(ball);
    ball.position.set(at.x,.27,at.z);
    room.action('kick','Chutar ao gol',0,z+6.16,()=>{
      if(room.shot)return false;
      v705PlayerSportAnimation('kick',420);
      room.shot={ball,at,goal,start:performance.now()};beep(350,80,'triangle');
      return true;
    },{icon:'⚽',inside:true});
  }
  function updateRioPractice(now){
    for(const {rooms} of rioMap.tiles.values())for(const {site,room} of rooms){
      const shot=room.shot;
      if(!shot)continue;
      const t=Math.min(1,(now-shot.start)/750);
      shot.ball.position.set(lerp(shot.at.x,shot.goal.x,t),.26+Math.sin(t*Math.PI)*.63,lerp(shot.at.z,shot.goal.z,t));
      shot.ball.rotation.z+=.12;
      if(t<1)continue;
      rioCountVisit(site);toast('Gol no treino!','good',1500);
      shot.ball.position.set(shot.at.x,.27,shot.at.z);room.shot=null;
    }
  }

  function rioPrepareWaterfrontRun(nodes=null,id='represa_rio_preto_osm_300m'){
    if(!nodes){
      const way=rioMap.data.roads.find(road=>road[0]===281827416);
      if(!way)return;
      nodes=way[7].map(index=>rioMap.data.nodes[index]);
    }
    const route=[{x:nodes[0][0],z:nodes[0][1]}];
    let length=0;
    const gates=[];
    for(let i=1;i<nodes.length&&length<300;i++){
      const a=nodes[i-1],b=nodes[i],span=Math.hypot(b[0]-a[0],b[1]-a[1]);
      if(!span)continue;
      for(let next=(gates.length+1)*50;next<=Math.min(300,length+span);next=(gates.length+1)*50){
        const t=(next-length)/span;
        gates.push({x:lerp(a[0],b[0],t),z:lerp(a[1],b[1],t),label:next===300?'Chegada':'Orla da Represa'});
      }
      if(gates.length===6)route.push({...gates.at(-1)});
      else route.push({x:b[0],z:b[1]});
      length+=span;
    }
    if(gates.length!==6)return;
    const group=new THREE.Group();group.name='RIO_MAPPED_WALKING_COURSE';worldGroup.add(group);
    const geo=new THREE.RingGeometry(1.22,1.75,22),mat=new THREE.MeshBasicMaterial({color:0xffd850,side:THREE.DoubleSide});
    rioMap.courseMarkers=gates.map(p=>{
      const ring=new THREE.Mesh(geo,mat);
      ring.rotation.x=-Math.PI/2;ring.position.set(p.x,.12+(rioMap.compact?groundHeightAt(p.x,p.z):rioTerrainY(p.x,p.z)),p.z);ring.visible=false;group.add(ring);return ring;
    });
    const start=route[0];
    createSignpost(start.x+.3,start.z+.7,'CORRIDA A PÉ • REPRESA',0);
    registerInteractable({id:'rio-orla-largada',type:'race',icon:'🏃',label:'Largar na pista da Represa',x:start.x,z:start.z,radius:2.7,priority:279,
      available:()=>!player.vehicle&&!player.boating&&!activeRace&&!SPORTS_V705.active,action:openRioGeoRun});
    rioMap.course={id,name:'Corrida a pé · Represa',start,route,gates};
  }
  function openRioGeoRun(){
    const course=rioMap.course;
    if(!course)return false;
    if(Math.hypot(player.x-course.start.x,player.z-course.start.z)>3.2){
      setWaypoint('rio-orla-largada');
      toast('Siga até a largada junto à pista da orla.','info',2200);
      return true;
    }
    return openRioStreetRun();
  }

  const rioCityActors={
    traffic:new Map(),folks:new Map(),nextAt:0,trafficAcc:0,lifeAcc:0
  };
  function rioPedestrianRoute(site,variant=0){
    const p=nearestRioRoad({x:site.x,z:site.z},true);
    const candidates=[];
    for(const road of rioMap.geo.roads.query(site.x,site.z,115)){
      if(!road.pedestrian||road.restricted||road.kind==='steps'||road.length<9)continue;
      const anchor=rioSegmentProjection(site.x,site.z,road.a,road.b),d=Math.hypot(anchor.x-site.x,anchor.z-site.z);
      if(d<85)candidates.push({road,d});
    }
    candidates.sort((a,b)=>a.d-b.d);
    const chosen=(candidates[variant]||candidates[0])?.road||(p?.segment?.pedestrian&&p.segment.length>9?p.segment:null);
    return chosen?[chosen.a,chosen.b].map(([x,z])=>({x,z})):null;
  }
  function rioCreateResidentsNear(site,index){
    const actors=[];
    for(let i=0;i<2;i++){
      const route=rioPedestrianRoute(site,i+1);
      if(!route)continue;
      const [a,b]=route,t=i===0?.24:.73,key=index*2+i;
      const name=['Helena','Rafael','Ana','Gil','Lucas','Célia','Lívia','Breno'][key%8];
      const npc=createNPC('rio-rua-'+key,name,lerp(a.x,b.x,t),lerp(a.z,b.z,t),[0x993f57,0x3e7a70,0xc5905d,0x5f729e][key%4],0);
      npc.cityLifeManaged=true;
      actors.push({npc,route,index:i,runner:i===0&&(['trail','statue','practice'].includes(site.kind)||index%3===0)});
    }
    rioCityActors.folks.set(site.key,actors);
  }
  function rioPruneDistantActors(sites){
    const remainsNear=key=>{
      const site=sites.find(place=>place.key===key);
      return site&&Math.hypot(player.x-site.x,player.z-site.z)<315;
    };
    for(const [key,actors] of rioCityActors.folks)if(!remainsNear(key)){
      const removed=new Set(actors.map(a=>a.npc.id));
      for(const {npc} of actors){disposeDetachedVisual(npc.group);npc.group.parent?.remove(npc.group);}
      world.npcs=world.npcs.filter(npc=>!removed.has(npc.id));
      world.interactables=world.interactables.filter(action=>!action.id.startsWith('npc-')||!removed.has(action.id.slice(4)));
      rioCityActors.folks.delete(key);
    }
    for(const [key,actors] of rioCityActors.traffic)if(!remainsNear(key)&&!actors.some(actor=>actor.incidentLocked||actor.taken)){
      for(const actor of actors){
        brazilDetach(actor.group);disposeDetachedVisual(actor.group);actor.group.parent?.remove(actor.group);
        const index=OTTOVIAS_RUNTIME.traffic.indexOf(actor);
        if(index>=0)OTTOVIAS_RUNTIME.traffic.splice(index,1);
      }
      rioCityActors.traffic.delete(key);world.trafficSnapshot=null;
    }
  }
  function rioConnectTraffic(site,index){
    const start={x:site.road[0],z:site.road[1]};
    for(const [dx,dz] of [[85,-110],[-100,-65],[95,140],[-120,130]]){
      const middle={x:start.x+dx,z:start.z+dz},forward=rioGeoRoute(start,middle,false),back=rioGeoRoute(middle,start,false);
      if(forward.length<2||back.length<2)continue;
      const loop=compactRoute([...forward,...back.slice(1,-1)]);
      if(loop.length<5||routeLength(loop)>1100)continue;
      const lane=offsetBrazilianTrafficPath(loop,1.22,{closed:true,valid:(x,z)=>!!rioRoadAt(x,z,.1,r=>!r.pedestrian),factors:[1,.6,0]});
      const dense=sampleRoute([...lane,lane[0]],2.75);
      if(dense.length<22||dense.some(p=>!rioRoadAt(p.x,p.z,.65,r=>!r.pedestrian)))continue;
      const models=['gol','uno','palio','golf7','fusca','kombi','saveiro'];
      const actors=[],metrics=trafficRouteMetrics(lane);
      for(let i=0;i<3;i++){
        const key=models[(index+i)%models.length],spec=window.OTBrazilVehicles.catalog[key];
        const pose=trafficRoutePoint(lane,i/3,metrics);
        if(OTTOVIAS_RUNTIME.traffic.some(actor=>distance2D(actor.group.position,pose)<9))continue;
        const actor=createOttoviasTrafficVehicle('rio-viario-'+index+'-'+i,lane,pose.index,spec.color,6.7+i*.48,'car',key);
        if(!actor)continue;
        actor.group.position.set(pose.x,.03,pose.z);actor.group.rotation.y=pose.heading;
        addTrafficDriver(actor,index+i);actors.push(actor);
      }
      world.trafficSnapshot=null;
      return actors;
    }
    return [];
  }
  function rioMoveAmbient(actor,dt,speed){
    const object=actor.npc?.group||actor.root,p=object.position,target=actor.route[actor.index];
    const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz);
    if(d<.18){actor.index=(actor.index+1)%actor.route.length;return;}
    const step=Math.min(d,dt*speed),x=p.x+dx/d*step,z=p.z+dz/d*step;
    if(rioGeometryBlocked(x,z,.35)||rioWaterAt(x,z)){actor.index=(actor.index+1)%actor.route.length;return;}
    if(actor.npc&&Math.hypot(player.x-x,player.z-z)<1.18)return;
    p.set(x,rioTerrainY(x,z),z);object.rotation.y=lerpAngle(object.rotation.y,Math.atan2(dx,dz),dt*8);
  }
  function updateRioMapActors(dt){
    const now=performance.now(),sites=rioFunctionalSites();
    if(now>=rioCityActors.nextAt){
      rioCityActors.nextAt=now+280;
      rioPruneDistantActors(sites);
      for(const [i,site] of sites.entries()){
        if(Math.hypot(player.x-site.x,player.z-site.z)>145)continue;
        if(rioCityActors.folks.size<12&&!rioCityActors.folks.has(site.key))rioCreateResidentsNear(site,i);
        if(rioCityActors.traffic.size<5&&!rioCityActors.traffic.has(site.key)&&
          ['mercado_municipal','complexo_swift','canecao_represa','posto_brasilia','prefeitura_andalo'].includes(site.key)){
          rioCityActors.traffic.set(site.key,rioConnectTraffic(site,i));
        }
      }
      updateRioPractice(now);
    }
    rioCityActors.lifeAcc+=dt;
    if(rioCityActors.lifeAcc>=.08){
      const step=Math.min(.12,rioCityActors.lifeAcc);rioCityActors.lifeAcc=0;
      for(const actor of [...rioCityActors.folks.values()].flat()){
        const pose=actor.npc?.group||actor.root;
        pose.visible=Math.hypot(player.x-pose.position.x,player.z-pose.position.z)<116;
        if(!pose.visible)continue;
        const rate=actor.runner?3.05:actor.npc?1.23:.75;
        rioMoveAmbient(actor,step,rate);
        if(actor.npc)poseResident(actor.npc,actor.runner?'run':'walk',now/1000);
      }
    }
    rioCityActors.trafficAcc+=dt;
    if(rioCityActors.trafficAcc>=1/14){
      const step=Math.min(.12,rioCityActors.trafficAcc);rioCityActors.trafficAcc=0;
      const previous=captureTrafficPositions();updateOttoviasTraffic(step);resolveTrafficOverlaps(previous);rioStepCityServices(step);
    }
  }

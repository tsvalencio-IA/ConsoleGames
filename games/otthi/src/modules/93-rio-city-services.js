/** Playable service facilities on surveyed parcels of the Rio Preto game map. */
// @otthi-module-body
  const RIO_WORKSHOP={x:953,z:110.7};
  const RIO_WORKSHOP_SCRAP={x:984.6,z:94};
  const RIO_WORKSHOP_ENTRY={x:953,z:119.8};

  function rioBuildWorkshop(){
    const {x,z}=RIO_WORKSHOP;
    const yard=box(47,.055,40,0x626766,x+14,.0275,z,worldGroup);
    yard.name='RIO_WORKSHOP_PARCEL';yard.castShadow=false;
    const driveway=box(10.8,.064,17,0x626766,x,.032,z+23,worldGroup);
    driveway.name='RIO_WORKSHOP_DRIVEWAY';driveway.castShadow=false;
    const workshop=createWorkshopShed({id:'workshop',name:'SOS Valêncio · Rio Preto',x,z,color:0x242a30,roofColor:0x101419});
    addHouseInterior(workshop,'workshop');
    world.workshopHouse=workshop;
    world.tioThiago=createTioThiagoWorkshop(workshop);
    createWorkshopMechanic(workshop);
    registerInteractable({id:'rio-workshop-reception',type:'workshop',icon:'🛠️',label:'Oficina SOS Valêncio',
      x:x+4.8,z:z+5.3,radius:2.3,priority:390,action:openWorkshop});
    workshopEnsureYardVisual();
    createVehicleRepairStationV704();
  }

  function rioRestoreWorkshopVehicles(){
    const saved=rioMapSave(),bays=Object.values(saved.workshopBayState||{});
    let pending=false;
    const owned=state.vehicles.owned.filter(id=>saved.workshopComponents?.[id]?.yardStatus||bays.some(bay=>bay.vehicleId===id));
    for(const id of owned){
      if(vehicleById(id))continue;
      if(!ensureCatalogVehicle(id,1,rioFleetSavedPose(id)))pending=true;
    }
    if(!pending)ensureWorkshopBays();
    return !pending;
  }

  const RIO_SERVICE_DEPOT={police:{x:1006,z:140},paramedic:{x:992,z:141.5},firefighter:{x:978,z:143}};
  function rioServiceDepot(kind){
    const base=RIO_SERVICE_DEPOT[kind],road=groundServiceRoadProjection(base);
    const {a,b}=road,heading=Math.atan2(b.x-a.x,b.z-a.z);
    return {x:road.point.x,z:road.point.z,heading};
  }

  function rioBuildEmergencyServices(){
    createPoliceCar('rio-policia',[],0);
    createAmbulance('rio-resgate');
    createFireTruck('rio-bombeiros');
    world.nextTrafficIncidentAt=performance.now()+20000;
  }

  function rioTrainingIncidentPoint(){
    const roads=[...rioMap.geo.roads.query(player.x,player.z,140)]
      .filter(road=>!road.pedestrian&&!road.restricted&&road.length>=44&&road.width>=5.5&&!road.bridge);
    const projected=road=>rioSegmentProjection(player.x,player.z,road.a,road.b);
    roads.sort((a,b)=>distance2D(player,projected(a))-distance2D(player,projected(b)));
    for(const road of roads){
      const center=rioSegmentProjection(player.x,player.z,road.a,road.b),t=clamp(center.t,16/road.length,1-16/road.length);
      const p={x:lerp(road.a[0],road.b[0],t),z:lerp(road.a[1],road.b[1],t)};
      if(distance2D(player,p)>10&&distance2D(player,p)<145&&!trafficIncidentWorkshopProtected(p.x,p.z))return p;
    }
    return null;
  }

  function openRioEmergency(){
    const incident=world.activeIncident;
    if(incident)return rioSetWaypoint({id:'rio-active-incident',name:'Área da ocorrência',x:incident.navX,z:incident.navZ});
    openModal('Central de socorro','<p>Polícia, ambulância e bombeiros atendem as ocorrências do trânsito. Você também pode acompanhar um treinamento sinalizado.</p><button class="btn primary" data-rio-emergency-training>Iniciar treinamento</button>',root=>{
      root.querySelector('[data-rio-emergency-training]').onclick=()=>{
        if(player.vehicle||player.boating||player.swimming||currentHouse){toast('Desembarque e vá a uma calçada.','info',2200);return;}
        const point=rioTrainingIncidentPoint();
        if(!point){toast('Procure uma calçada próxima de uma rua acessível ao socorro.','info',2500);return;}
        const drill=createTrafficIncidentAt(point.x,point.z,'minor');
        if(drill)rioSetWaypoint({id:'rio-active-incident',name:'Treinamento de socorro',...point});
      };
    });
  }

  function rioStepCityServices(dt){
    if(workshopBays.restored||rioRestoreWorkshopVehicles())updateWorkshopMechanicActions(dt);
    for(const vehicle of serviceVehiclePools()){
      const responding=!!vehicle.incidentTargetId;
      const flash=Math.floor(performance.now()/225)%2===0;
      if(vehicle.red){vehicle.red.visible=!responding||flash;vehicle.cyan.visible=!responding||!flash;}
      if(vehicle.lightA){vehicle.lightA.visible=responding&&flash;vehicle.lightB.visible=responding&&!flash;}
      if(!world.activeIncident&&!vehicle.occupied&&vehicle.serviceType!=='paramedic')returnServiceVehicleHome(vehicle,dt);
    }
    updateTrafficIncidents(dt);
  }

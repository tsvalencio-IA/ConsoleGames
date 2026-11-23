/** Adapt Rio Preto's playable places to the original World scene and save. */
// @otthi-module-body
  const compactRio={sites:[],nextUpdate:0};
  const compactRioStreets=[
    ['bady','Avenida Bady Bassitt',-95,0],
    ['andalo','Avenida Alberto Andaló',0,-52],
    ['murchid','Avenida Murchid Homsi',205,28],
    ['godoy','Rua Antônio de Godoy',-137,0],
    ['sp310','SP-310 · Washington Luís',84,-147],
    ['br153','BR-153 · Transbrasiliana',158,-17]
  ];

  function compactRioSite(lot){
    const [key,x,z,w,d,facing,street]=lot;
    const [,id,name,kind,style,price]=RIO_COMPACT_SITES.find(record=>record[0]===key);
    const yaw=rioCompactYaw[facing],out={x:Math.sin(yaw),z:Math.cos(yaw)},threshold=d/2+1.35;
    const roadDistance=key==='posto_brasilia'?205-x:threshold+5;
    return {key,id,name,kind,style,price,street,x,z,w,d,yaw,
      // Never change legacy residential save keys; each new condominium gets its own property key.
      propertyId:kind==='residence'?id:undefined,
      entry:[x+out.x*threshold,z+out.z*threshold],
      road:[x+out.x*roadDistance,z+out.z*roadDistance]};
  }

  function compactRioWalk(root,a,b,width,material){
    const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
    if(length<.1)return;
    const geometry=new THREE.PlaneGeometry(width,length+.09);
    geometry.rotateX(-Math.PI/2);
    const uv=geometry.getAttribute('uv');
    for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*width*.4,uv.getY(i)*length*.4);
    const mesh=new THREE.Mesh(geometry,material);
    mesh.position.set((a.x+b.x)/2,.033,(a.z+b.z)/2);
    mesh.rotation.y=Math.atan2(dx,dz);
    root.add(mesh);
  }

  function compactRioPlacePaths(root,site){
    if(['fuel','oil-shop','practice'].includes(site.kind))return;
    const [x,z]=site.entry,outX=Math.sin(site.yaw),outZ=Math.cos(site.yaw);
    if(waterAt(x,z))return;
    for(let length=1;length<=25;length++){
      const p={x:x+outX*length,z:z+outZ*length};
      if(waterAt(p.x,p.z)||positionBlockedForPlayer(p.x,p.z,.66,{ignoreTraffic:true,ignoreParkedVehicles:true}))break;
      if(v704RoadAt(p.x,p.z,.22,true)){
        compactRioWalk(root,{x,z},p,2.2,materials.sidewalk);
        break;
      }
    }
  }

  function buildCompactRio(){
    if(!rioCompactWorld())return;
    const root=new THREE.Group();
    root.name='RIO_PRETO_CENTRO';
    worldGroup.add(root);
    rioMap.materials??=rioTerrainMaterials();
    Object.assign(CHARACTER_ACTIVITIES,{
      'rio-rest':['Descansando no banco',3.3],
      'rio-entry':['Entrando pela porta',0],
      'rio-boarding':['Caminhando até a embarcação',0],
      'rio-pool':['Nadando na piscina',4.0]
    });
    const lots=RIO_COMPACT_LAYOUT.lots.map(compactRioSite);
    const alias=(key,point)=>{
      const [,id,name,kind]=RIO_COMPACT_SITES.find(site=>site[0]===key);
      return {key,id,name,kind,x:point.x,z:point.z,entry:[point.x,point.z]};
    };
    compactRio.sites=[...lots,
      alias('estadio_teixeirao',worldLayoutPoint('footballEntrance')),
      alias('aeroporto-sbsr',{x:90,z:-175})
    ];
    for(const site of lots)rioMountPlace(site,root);
    for(const site of lots)compactRioPlacePaths(root,site);
    const hall=lots.find(site=>site.kind==='civic');
    registerInteractable({id:'castle-adventures',type:'adventure',icon:'🏅',label:'Desafios do Paço Municipal',
      x:hall.x-11,z:hall.entry[1],radius:3.5,priority:210,action:openAdventureHub});
    for(const [x,z,text,yaw] of [
      [-96,11,'AV. BADY BASSITT',0],[-145,7.1,'RUA ANTÔNIO DE GODOY',0],
      [11,-11,'AV. ALBERTO ANDALÓ',-Math.PI/2],[213,6,'AV. MURCHID HOMSI',-Math.PI/2],
      [-65,42,'PARQUE DA REPRESA',0],[152,-17,'BR-153 · TRANSBRASILIANA',Math.PI/2],
      [90,-154,'SP-310 · WASHINGTON LUÍS',0],
      [300,128,'RIOS D’ITALIA · CONDOMÍNIOS',0],
      [300,197,'RIO CANDELARO · FIORA · SALSO · FORTORE · LIRI · TANARO',0]
    ])createSignpost(x,z,text,yaw);
    createCastleChallengeTokens();
  }


  function buildRioPretoJulioZacarinBridge(){
    if(!rioCompactWorld())return;
    // Native lightweight bridge over Lago 3, never replaces existing OT bridges.
    const root=new THREE.Group();root.name='RIO_PRETO_PONTE_JULIO_ZACARIN';worldGroup.add(root);
    const steel=renderMat(0xd1d7d7,{roughness:.67,metalness:.22}),cable=renderMat(0xb6c1c4,{roughness:.48,metalness:.38});
    const bx=-104,bz=69,deckY=.65;
    stableBox(36,.22,4.8,0x788890,bx,deckY,bz,root,2);
    stableBox(36,.05,3.2,0x58626b,bx,deckY+.14,bz,root,3);
    registerPlatform(bx,bz,36,4.8,deckY+.15,{rioBridge:'julio-zacarin'});
    for(const side of[-1,1]){
      stableBox(36,.58,.12,steel,bx,deckY+.55,bz+side*2.35,root);
      for(let i=-8;i<=8;i++)stableBox(.085,.56,.10,steel,bx+i*2,deckY+.38,bz+side*2.35,root);
    }
    for(const z of[bz-1.45,bz+1.45]){
      stableBox(.64,13.4,.67,steel,bx,7.25,z,root);
      for(const dx of[-16,-12,-8,-4,4,8,12,16]){
        const start=new THREE.Vector3(bx,13.9,z),end=new THREE.Vector3(bx+dx,deckY+.82,z);
        const vec=end.clone().sub(start),length=vec.length();
        const line=new THREE.Mesh(new THREE.CylinderGeometry(.032,.032,length,6),cable);
        line.position.copy(start).add(end).multiplyScalar(.5);
        line.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vec.normalize());
        line.castShadow=false;root.add(line);
      }
    }
    createSignpost(-122,64.6,'PONTE ESTAIADA JÚLIO ZACARIN · LAGO 3',Math.PI/2);
    registerInteractable({id:'rio-ponte-julio-zacarin',type:'activity',icon:'🌉',
      label:'Ponte Estaiada Júlio Zacarin · Lago 3',x:-121,z:65.8,radius:4.5,priority:200,
      action:()=>toast('Ponte Júlio Zacarin · Lago 3 da Represa Municipal de Rio Preto.','info',2600)});
  }

  function buildCompactRioWaterfront(){
    rioBuildWaterfront();
    buildRioPretoJulioZacarinBridge();
    const shore=RIO_COMPACT_LAYOUT.sections.map(([x,z])=>({x,z}));
    const walk=new THREE.Group();
    walk.name='RIO_PRETO_PASSEIO_DA_REPRESA';
    worldGroup.add(walk);
    for(let i=1;i<shore.length;i++)compactRioWalk(walk,shore[i-1],shore[i],2.15,materials.sidewalk);
    // Two passes around the shore provide six checkpoints at the same 50 m spacing.
    rioPrepareWaterfrontRun([...RIO_COMPACT_LAYOUT.sections,...RIO_COMPACT_LAYOUT.sections.slice(1)],
      'represa_rio_preto_compacta_300m');
  }

  function updateCompactRio(dt,before){
    if(player.vehicle&&rioFuelCapacity(currentVehicleRef())){
      const vehicle=currentVehicleRef(),metres=distance2D(player,before),fuel=rioFuelLevel(vehicle);
      if(metres>0&&fuel>0)rioRoadVehicleSave(vehicle.id).fuel=Math.max(0,fuel-metres*.002);
    }
    if(player.boating)rioRecordBoatPose();
    updateRioWaterfront(dt);
    updateRioClimate(dt);
    if(performance.now()<compactRio.nextUpdate)return;
    compactRio.nextUpdate=performance.now()+80;
    rioMap.indoors=false;
    rioMap.indoorRoom=null;
    const focus=navigationFocus();
    for(const room of rioMap.sites.values()){
      const {site}=room;
      if(room.legacyResidence){
        // Historic homes retain the exact old exterior while the furnished
        // native room is visible only to the player who entered the door.
        const inside=!!room.legacyRecord?.inside;
        room.root.visible=inside;
        if(inside){
          if(room.roof)room.roof.visible=false;
          rioMap.indoors=true;rioMap.indoorRoom=room;
        }
        continue;
      }
      room.root.visible=distance2D(focus,site)<(qualityTier()==='low'?142:195);
      if(room.poolExterior)room.poolExterior.visible=room.root.visible;
      if(!room.root.visible)continue;
      if(room.roof){
        const inside=!currentHouse&&!player.vehicle&&room.forSite(player.x,player.z,-.22);
        room.roof.visible=!inside;
        if(inside){rioMap.indoors=true;rioMap.indoorRoom=room;}
      }
      if(room.server||room.door)rioUpdatePlaceService(site,room,.08);
      if(rioMap.order?.site===site.id&&distance2D(player,site)>Math.max(site.w,site.d)+8){
        rioMap.order=null;
        if(room.servedDish)room.servedDish.visible=false;
      }
    }
  }

  function compactRioDestination(site){
    const [x,z]=site.entry;
    const icon={market:'🛒',church:'⛪',civic:'🏛️',trail:'🌳',dining:'🍽️',bakery:'🥐',mall:'🛍️',
      'oil-shop':'🔧',fuel:'⛽',residence:'🏠',airport:'✈️',theater:'🎭',stadium:'⚽',practice:'⚽'};
    return {id:site.id,name:site.name,icon:icon[site.kind]||'📍',group:'Rio Preto',x,z,navX:x,navZ:z,
      description:[site.street,site.style==='rios-ditalia'?'Condomínio Rios D’Italia · apartamento mobiliado':rioSiteLabels[site.kind]].filter(Boolean).join(' · ')};
  }

  const beforeCompactRioLocations=expansionMapLocations;
  expansionMapLocations=function(){
    const existing=beforeCompactRioLocations();
    if(!rioCompactWorld())return existing;
    const places=compactRio.sites.map(compactRioDestination);
    const streets=compactRioStreets.map(([id,name,x,z])=>({id:'rio-via-'+id,name,x,z,icon:'🛣️',group:'Ruas e rodovias'}));
    const dock=rioMap.waterfront?.entry,course=rioMap.course;
    places.push({id:'rio-ponte-julio-zacarin',name:'Ponte Estaiada Júlio Zacarin · Lago 3',group:'Represa de Rio Preto',icon:'🌉',x:-121,z:65.8,navX:-121,navZ:65.8,description:'Ponte estaiada, orla e passeio do Lago 3'});
    if(dock)places.push({id:'rio-represa-cais',name:'Mirante da Represa Municipal',group:'Represa de Rio Preto',icon:'🌳',...dock});
    // All four native boats are moored at this same Represa, not the Guarujá beach.
    // GPS entry locations are derived from their actual native berths.
    for(const boat of rioMap.waterfront?.craft||[]){
      const boarding=boat.rioBerth?.step;
      if(!boarding)continue;
      places.push({id:'gps-'+boat.id,name:'Represa · '+boat.label,icon:boat.kind==='board'?'🏄':'🛶',group:'Represa de Rio Preto',x:boarding.x,z:boarding.z,navX:boarding.x,navZ:boarding.z,description:'Embarque no cais da Represa'});
    }
    if(course)places.push({id:'rio-orla-largada',name:'Corrida a pé na Represa',group:'Rio Preto',icon:'🏃',...course.start});
    const hall=places.find(place=>place.id==='regional-prefeitura_andalo');
    if(hall)places.push({...hall,id:'castle'});
    return [...existing,...places,...streets];
  };

  function compactRioArrive(){
    const url=new URL(location.href);
    const entrance=url.searchParams.get('entrada'),destination=url.searchParams.get('destino');
    url.searchParams.delete('entrada');
    url.searchParams.delete('destino');
    url.searchParams.set('map','rio-preto');
    if(url.href!==location.href)history.replaceState(history.state,'',url);
    const site=compactRio.sites.find(place=>place.key===entrance);
    const target=entrance==='represa-cais'?rioMap.waterfront?.entry:site?{
      x:site.entry[0]+2.2*Math.sin(site.yaw||0),z:site.entry[1]+2.2*Math.cos(site.yaw||0)
    }:null;
    if(target){
      const safe=safePointNear(target.x,target.z,{ignoreTraffic:true,allowWater:false,distances:[0,1,2,4,7]});
      rioMapSave().aboard=null;
      Object.assign(player,{x:safe.x,y:safe.y,z:safe.z,vx:0,vy:0,vz:0,grounded:true});
      cameraYaw=site?Math.atan2(Math.sin(site.yaw||0),Math.cos(site.yaw||0)):Math.PI/2;
      playerGroup.position.set(player.x,player.y,player.z);
      rememberSafePlayerPosition(true);
    }else if(!entrance)rioRestoreBoatRide();
    if(destination==='ottovias')setWaypoint('ottovias-entry');
  }

  function migrateCompactRioProgress(){
    const saved=rioMapSave();
    if(saved.compactMapVersion===1)return;
    // The two maps used different coordinates. Preserve the older positions for rollback.
    saved.previousMapPose={position:saved.position,waypoint:saved.waypoint,aboard:saved.aboard};
    for(const order of phoneOrders()){
      if(order.map!=='rio-preto')continue;
      if(order.kind==='vehicle'&&order.status==='en-route')order.status='interrupted';
      if(order.kind==='parcel'&&['en-route','ready'].includes(order.status)){
        order.status='queued';
        delete order.pose;
        delete order.origin;
        delete order.target;
      }
    }
    if(saved.phoneDelivery?.status==='en-route'&&!state.vehicles.phoneDelivery)
      state.vehicles.phoneDelivery={...saved.phoneDelivery,status:'interrupted'};
    saved.compactMapVersion=1;
  }

/** The Rio Preto scene and Vila OT share their profile and keep separate spatial state. */
// @otthi-module-body
  let rioSceneType=null;
  const OTTHI_NEXT_MAP='otthi-enter-map';
  function rioSceneMode(mode){
    rioSceneType=mode;
    rioMap.active=mode==='rio-preto';
    if(rioMap.active){
      rioMap.legacyWaypoint=state.waypoint;
      state.waypoint=rioMapSave().waypoint||null;
    }else delete document.body.dataset.otthiMap;
  }
  function rioResumeActivity(){
    const url=new URL(location.href);
    if(!url.searchParams.has('entrada'))return rioRestoreBoatRide();
    // A named entrance applies on arrival. Subsequent reloads use the saved position.
    rioMapSave().aboard=null;
    url.searchParams.delete('entrada');
    history.replaceState(history.state,'',url);
    return false;
  }
  function rioWorldDestination(mode){
    const url=new URL(OTTHI_GAME_LIVE_BASE);
    if(mode==='rio-preto')url.searchParams.set('map','rio-preto');
    if(mode==='ot')url.searchParams.set('map','ot');
    return url;
  }
  async function selectOtthiMap(mode){
    if(!worldInitializationReady||!rioSceneType||rioSceneType===mode)return false;
    if(running)stopGame();
    await saveState(true);
    try{sessionStorage.setItem(OTTHI_NEXT_MAP,mode);}catch{}
    location.assign(rioWorldDestination(mode).href);
    return true;
  }
  function rioSetWaypoint(destination){
    const goal={x:destination.x,z:destination.z};
    const route=rioGeoRoute(player,goal,!player.vehicle,{connect:true});
    if(!route.length){
      toast('A rota até esse ponto não está conectada. Confira o mapa e tente a pé.','warn',2600);return false;
    }
    state.waypoint={id:destination.id,name:destination.name,x:goal.x,z:goal.z,navX:goal.x,navZ:goal.z,arrived:false};
    if((!player.vehicle?Math.hypot(player.x-goal.x,player.z-goal.z)<3:false))state.waypoint.arrived=true;
    world.routePath=route;rioMapSave().waypoint=state.waypoint;
    closeModal();updateWaypointMarker();updateNavigation(0,true);saveState(true);
    toast('Siga as setas para '+destination.name+'.','good',2300);
    return true;
  }
  function rioMapLocation(site){return {id:site.id,name:site.name,x:site.entry[0],z:site.entry[1],site};}
  function rioMapSvg(){
    const data=rioMap.data,b=data.bounds,nums=point=>point.map(v=>Math.round(v)).join(' ');
    const polyline=path=>path.map((point,i)=>(i?'L':'M')+nums(point)).join(' ');
    const classNames=new Set(['primary','secondary','trunk','motorway','tertiary']);
    rioMap.svgPath??=data.roads.filter(r=>classNames.has(r[1])).map(r=>polyline(r[7].map(i=>data.nodes[i]))).join(' ');
    const bodies=data.water.map(([,rings])=>'<path class="rio-water-shape" d="'+rings.map(ring=>polyline(ring)+'Z').join(' ')+'"/>').join('');
    const active=world.routePath.length&&state.waypoint?'<path class="rio-active-route" d="'+polyline(world.routePath.map(p=>[p.x,p.z]))+'"/>':'';
    return '<svg class="rio-real-map" viewBox="'+b.minX+' '+b.minZ+' '+(b.maxX-b.minX)+' '+(b.maxZ-b.minZ)+
      '" aria-label="Malha viária mapeada de São José do Rio Preto" role="img">'+bodies+
      '<path class="rio-mapped-roads" d="'+rioMap.svgPath+'"/>'+active+
      rioFunctionalSites().map(p=>'<circle class="rio-map-point" cx="'+p.x+'" cy="'+p.z+'" r="52"><title>'+escapeHtml(p.name)+'</title></circle>').join('')+
      '<circle class="rio-map-player" cx="'+player.x+'" cy="'+player.z+'" r="78"/>'+
      '</svg>';
  }
  function openRioMapPanel(){
    const locations=rioFunctionalSites().map(rioMapLocation);
    if(rioMap.course)locations.push({id:'rio-orla-largada',name:'Largada da corrida na Represa',...rioMap.course.start});
    if(rioMap.garage)locations.push({id:'rio-fleet-counter',name:'Minha garagem · Rio Preto',
      ...rioMap.garage.counter,category:'Vaga para veículos da sua frota'});
    if(rioMap.waterfront)locations.push({id:'rio-represa-cais',name:'Cais da Represa',...rioMap.waterfront.entry,
      category:'Natação, prancha e embarcações'});
    locations.sort((a,b)=>distance2D(player,a)-distance2D(player,b));
    const markup=locations.map(place=>'<button class="choice" data-rio-destination="'+place.id+
      '"><b>'+escapeHtml(place.name)+'</b><span>'+escapeHtml(place.category||rioSiteLabels[place.site?.kind]||'300 m na pista da orla')+
      '</span><small>'+Math.round(distance2D(player,place))+' m em linha reta</small></button>').join('');
    openModal('Mapa de São José do Rio Preto','<div class="rio-map-panel"><figure>'+rioMapSvg()+
      '<figcaption><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a></figcaption>'+
      '</figure><div><div class="rio-map-actions">'+(state.waypoint?'<button class="btn" data-rio-clear>Cancelar rota</button>':'')+
      '<button class="btn" data-rio-menu>Menu do mapa</button></div><div class="choice-grid rio-real-places">'+markup+'</div></div></div>',root=>{
        for(const button of root.querySelectorAll('[data-rio-destination]'))button.onclick=()=>rioSetWaypoint(locations.find(p=>p.id===button.dataset.rioDestination));
        root.querySelector('[data-rio-clear]')?.addEventListener('click',()=>{rioMapSave().waypoint=null;clearWaypoint();});
        root.querySelector('[data-rio-menu]').onclick=()=>{closeModal();openRioMapMenu();};
      });
  }
  function openRioMapMenu(){
    if(!running)return;
    closeExplorationPanels();
    openModal('São José do Rio Preto','<div class="choice-grid">'+
      '<button class="choice" data-rio-panel-map><b>Mapa e locais</b><span>Escolher o destino e traçar a rota</span></button>'+
      '<button class="choice" data-rio-panel-fleet><b>Minha garagem</b><span>Traçar rota para retirar seus veículos</span></button>'+
      '<button class="choice" data-rio-panel-clothes><b>Meu personagem</b><span>Roupas e acessórios</span></button>'+
      '<button class="choice" data-rio-panel-settings><b>Configurações</b><span>Áudio, câmera e desempenho</span></button>'+
      '<button class="choice" data-rio-panel-safe><b>Último ponto seguro</b><span>Desprender o personagem</span></button>'+
      '<button class="choice" data-rio-panel-lobby><b>Menu inicial</b><span>Salvar a visita</span></button>'+
      '<button class="choice" data-rio-panel-ot><b>Vila OT</b><span>Voltar ao mapa original e à sua garagem</span></button>'+
      '<button class="choice" data-rio-panel-console><b>Console</b><span>Abrir a biblioteca de jogos</span></button></div>',root=>{
        root.querySelector('[data-rio-panel-map]').onclick=()=>{closeModal();openRioMapPanel();};
        root.querySelector('[data-rio-panel-fleet]').onclick=()=>rioAtFleetCounter()?openRioFleetCounter():
          rioSetWaypoint({id:'rio-fleet-counter',name:'Minha garagem · Rio Preto',...rioMap.garage.counter});
        root.querySelector('[data-rio-panel-clothes]').onclick=()=>{closeModal();openAvatarStudio();};
        root.querySelector('[data-rio-panel-settings]').onclick=()=>{closeModal();openSettings(true);};
        root.querySelector('[data-rio-panel-safe]').onclick=()=>{closeModal();recoverPlayerToLastSafe('retorno manual',true);};
        root.querySelector('[data-rio-panel-lobby]').onclick=()=>{closeModal();stopGame();};
        root.querySelector('[data-rio-panel-ot]').onclick=()=>selectOtthiMap('ot');
        root.querySelector('[data-rio-panel-console]').onclick=()=>window.OTTHI_NAVIGATION.toConsole();
      });
  }
  const rioOpenMapFallback=openMap;
  openMap=function(){if(inRioMap())return openRioMapPanel();return rioOpenMapFallback();};
  const rioPauseFallback=openPauseMenu;
  openPauseMenu=function(){if(inRioMap())return openRioMapMenu();return rioPauseFallback();};
  const rioQuickFallback=els.quickToggleBtn.onclick;
  els.quickToggleBtn.onclick=function(event){if(inRioMap()){clearMovementInputs();return openRioMapMenu();}return rioQuickFallback?.(event);};
  const rioSnapshotFallback=commitState;
  commitState=function(){
    if(!inRioMap())return rioSnapshotFallback();
    const waypoint=state.waypoint;
    if(player.boating)rioRecordBoatPose();
    rioMapSave().waypoint=waypoint;
    state.waypoint=rioMap.legacyWaypoint;
    try{return rioSnapshotFallback();}finally{state.waypoint=waypoint;}
  };
  window.OTTHI_RIO_MAP=Object.freeze({
    diagnostics:()=>({
      active:inRioMap(),places:rioFunctionalSites().length,
      bounds:rioMap.data?.bounds,source:rioMap.data?.reference,
      roads:rioMap.data?.roads.length,buildings:rioMap.data?.buildings.length,water:rioMap.data?.water.length,
      chunks:rioMap.tiles.size,loadedPlaces:[...rioMap.sites.keys()],
      actors:{residents:[...rioCityActors.folks.values()].flat().length,traffic:[...rioCityActors.traffic.values()].flat().length,animals:rioCityActors.animals.size},
      fleet:rioMap.vehicle?{id:rioMap.vehicle.id,model:rioMap.vehicle.brazilModel}:null,
      craft:[...(world.boats?.values()||[])].filter(boat=>boat.rioBerth).map(boat=>({id:boat.id,kind:boat.kind})),
      swimmers:rioMap.waterfront?.swimmers.length||0,
      course:rioMap.course?.id||null
    })
  });
  let rioSelectedNext='';
  try{rioSelectedNext=sessionStorage.getItem(OTTHI_NEXT_MAP);sessionStorage.removeItem(OTTHI_NEXT_MAP);}catch{}
  if(['rio-preto','ot'].includes(rioSelectedNext))setTimeout(()=>enterCurrentOtthiWorld(rioSelectedNext),0);

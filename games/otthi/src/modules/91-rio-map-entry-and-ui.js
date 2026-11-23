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
    }else document.body.dataset.otthiMap=legacyRegionalLayout?'roteiro-regional':'ot';
  }
  function rioResumeActivity(){
    const url=new URL(location.href);
    const namedEntrance=url.searchParams.has('entrada');
    const restored=namedEntrance?false:rioRestoreBoatRide();
    if(namedEntrance)rioMapSave().aboard=null;
    url.searchParams.delete('entrada');
    url.searchParams.set('map','rio-preto');
    history.replaceState(history.state,'',url);
    return restored;
  }
  function updateOtthiMapContinue(){
    setControlText(els.continueBtn,otthiContinueMap()==='rio-preto'?'CONTINUAR EM RIO PRETO':'CONTINUAR NA VILA OT');
  }
  function otthiContinueMap(){
    const selected=new URLSearchParams(location.search).get('map');
    if(selected==='rio-preto'||selected==='ot')return selected;
    return state.settings.lastWorldMap==='rio-preto'?'rio-preto':'ot';
  }
  function rioWorldDestination(mode,waypoint){
    const url=new URL(OTTHI_GAME_LIVE_BASE);
    if(mode==='rio-preto')url.searchParams.set('map','rio-preto');
    if(mode==='ot')url.searchParams.set('map','ot');
    if(mode==='ot'&&waypoint==='ottovias-entry')url.searchParams.set('destino','ottovias');
    return url;
  }
  async function selectOtthiMap(mode,waypoint){
    if(!worldInitializationReady||!rioSceneType||rioSceneType===mode)return false;
    if(running)stopGame();
    await saveState(true);
    try{sessionStorage.setItem(OTTHI_NEXT_MAP,mode);}catch{}
    location.assign(rioWorldDestination(mode,waypoint).href);
    return true;
  }
  function rioSetWaypoint(destination,plannedRoute){
    const goal={x:destination.x,z:destination.z};
    const route=plannedRoute??rioGeoRoute(player,goal,!player.vehicle,{connect:true});
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
  function rioMapLocations(){
    const locations=[...rioFunctionalSites().map(rioMapLocation),...rioCommunityLocations()];
    if(rioMap.course)locations.push({id:'rio-orla-largada',name:'Largada da corrida na Represa',...rioMap.course.start});
    if(rioMap.garage)locations.push({id:'rio-fleet-counter',name:'Minha garagem · Rio Preto',
      ...rioMap.garage.counter,category:'Vaga para veículos da sua frota'});
    if(rioMap.waterfront)locations.push({id:'rio-represa-cais',name:'Cais da Represa',...rioMap.waterfront.entry,
      category:'Natação, prancha e embarcações'});
    return locations;
  }
  function rioFindWaypoint(id){
    const aliases={shop:'regional-mercado_municipal','family-park':'regional-parque_da_represa','my-garage':'rio-fleet-counter'};
    const place=rioMapLocations().find(location=>location.id===(aliases[id]||id));
    return place?rioSetWaypoint(place):false;
  }
  function resumeVilaRoadDestination(){
    const url=new URL(location.href);
    if(url.searchParams.get('destino')!=='ottovias')return false;
    url.searchParams.delete('destino');
    history.replaceState(history.state,'',url);
    setWaypoint('ottovias-entry');
    return true;
  }
  function openRioMapMenu(){
    if(!running)return;
    closeExplorationPanels();
    openModal('São José do Rio Preto','<div class="choice-grid">'+
      '<button class="choice" data-rio-panel-map><b>Mapa e locais</b><span>Escolher o destino e traçar a rota</span></button>'+
      '<button class="choice" data-rio-panel-fleet><b>Minha garagem</b><span>Traçar rota para retirar seus veículos</span></button>'+
      '<button class="choice" data-rio-panel-workshop><b>Oficina</b><span>Traçar rota para a SOS Valêncio</span></button>'+
      '<button class="choice" data-rio-panel-emergency><b>Socorro</b><span>Acompanhar ocorrências e treinamentos</span></button>'+
      '<button class="choice" data-rio-panel-phone><b>Celular</b><span>Comprar, acompanhar encomendas e chamar motorista</span></button>'+
      '<button class="choice" data-rio-panel-journey><b>Meu caminho</b><span>Acompanhar os objetivos em Rio Preto</span></button>'+
      '<button class="choice" data-rio-panel-life><b>Vida e atividades</b><span>Família, escola, horta, inventário e ferramentas</span></button>'+
      '<button class="choice" data-rio-panel-clothes><b>Meu personagem</b><span>Roupas e acessórios</span></button>'+
      (equippedTool().id==='none'?'':'<button class="choice" data-rio-panel-hands><b>Mãos vazias</b><span>Guardar a ferramenta atual</span></button>')+
      '<button class="choice" data-rio-panel-settings><b>Configurações</b><span>Áudio, câmera e desempenho</span></button>'+
      '<button class="choice" data-rio-panel-safe><b>Último ponto seguro</b><span>Desprender o personagem</span></button>'+
      '<button class="choice" data-rio-panel-lobby><b>Menu inicial</b><span>Salvar a visita</span></button>'+
      '<button class="choice" data-rio-panel-ot><b>Vila OT</b><span>Voltar ao mapa original e à sua garagem</span></button>'+
      '<button class="choice" data-rio-panel-console><b>Console</b><span>Abrir a biblioteca de jogos</span></button></div>',root=>{
        root.querySelector('[data-rio-panel-map]').onclick=()=>{closeModal();openRioMapPanel();};
        root.querySelector('[data-rio-panel-fleet]').onclick=()=>rioAtFleetCounter()?openRioFleetCounter():
          rioSetWaypoint({id:'rio-fleet-counter',name:'Minha garagem · Rio Preto',...rioMap.garage.counter});
        root.querySelector('[data-rio-panel-workshop]').onclick=()=>rioSetWaypoint({id:'rio-workshop-reception',name:'Oficina SOS Valêncio',...RIO_WORKSHOP_ENTRY});
        root.querySelector('[data-rio-panel-emergency]').onclick=openRioEmergency;
        root.querySelector('[data-rio-panel-phone]').onclick=openWorldPhone;
        root.querySelector('[data-rio-panel-journey]').onclick=openRioJourney;
        root.querySelector('[data-rio-panel-life]').onclick=openRioActivities;
        root.querySelector('[data-rio-panel-clothes]').onclick=()=>{closeModal();openAvatarStudio();};
        root.querySelector('[data-rio-panel-hands]')?.addEventListener('click',()=>{equipTool('none');closeModal();updateContext(true);});
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
      actors:{residents:[...rioCityActors.folks.values()].flat().length,traffic:[...rioCityActors.traffic.values()].flat().length,animals:0},
      fleet:rioMap.vehicle?{id:rioMap.vehicle.id,model:rioMap.vehicle.brazilModel}:null,
      craft:[...(world.boats?.values()||[])].filter(boat=>boat.rioBerth).map(boat=>({id:boat.id,kind:boat.kind})),
      swimmers:rioMap.waterfront?.swimmers.length||0,
      course:rioMap.course?.id||null
    })
  });
  updateOtthiMapContinue();
  if(new URLSearchParams(location.search).get('map')==='ot'){
    els.playBtn.classList.add('primary');els.rioPretoPlayBtn?.classList.remove('primary');
  }
  let rioSelectedNext='';
  try{rioSelectedNext=sessionStorage.getItem(OTTHI_NEXT_MAP);sessionStorage.removeItem(OTTHI_NEXT_MAP);}catch{}
  if(['rio-preto','ot'].includes(rioSelectedNext))setTimeout(()=>enterCurrentOtthiWorld(rioSelectedNext),0);

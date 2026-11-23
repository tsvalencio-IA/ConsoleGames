/** Native family, school, farming and activities in the Rio Preto scene. */
// @otthi-module-body
  const RIO_FAMILY_HOME={x:976,z:-76.2};
  const RIO_FARM={x:2084.3,z:-67.3};
  const RIO_CLASSROOM={x:-197.6,z:288.2};
  const rioVenues=new Map();
  function rioFamilyVisualRange(){return qualityTier()==='low'?32:qualityTier()==='high'?62:46;}

  function rioBuildCommunity(){
    const school=createHouse({id:'rio-classroom',name:'Escola da comunidade',...RIO_CLASSROOM,
      color:0xe5ca92,roofColor:0x4d677a,publicBuilding:true});
    addHouseInterior(school,'school');
    createSignpost(school.x-2.5,school.z+5,'ESCOLA DA COMUNIDADE',0);
    ensureWorldEvolutionState();
    world.worldEvolution??={};
    createFarmingSystem();
    createDigSites();
    rioBuildVenueCourtyard();
  }

  function rioCommunityLocations(){
    return [
      {id:'family-home',name:'Casa da Família',x:RIO_FAMILY_HOME.x,z:RIO_FAMILY_HOME.z+6,category:'Passeio, brincadeiras e guarda-roupa'},
      {id:'school',name:'Escola da comunidade',x:RIO_CLASSROOM.x,z:RIO_CLASSROOM.z+4.3,category:'Aulas e desafios da Vila'},
      {id:'farm',name:'Horta comunitária',...RIO_FARM,category:'Plantio, colheita e escavação'},
      {id:'workshop',name:'Oficina SOS Valêncio',...RIO_WORKSHOP_ENTRY,category:'Reboque, diagnóstico, reparo e pátio'},
      ...[...rioVenues.values()].map(v=>({id:'venue-'+v.id,name:v.label,x:v.navX,z:v.navZ,category:v.activity}))
    ];
  }

  function rioBuildVenueCourtyard(){
    const x=-1608,z=2367;
    for(const [id,offset] of [['boxing',-12.5],['pingpong',0],['dance',12.5]]){
      const original=WORLD_ACTIVITY_VENUES[id];
      if(!original)continue;
      const v={...original,x:x+offset,z,navX:x+offset,navZ:z+7.5,w:11.6,d:13,face:1};
      rioVenues.set(id,v);venueDraw(v);
    }
    for(const [id,offset] of [['kart-mirassol',-10],['kart-cedral',0]]){
      const original=WORLD_ACTIVITY_VENUES[id];
      if(!original)continue;
      const v={...original,x:x+offset,z:z+12,navX:x+offset,navZ:z+12};
      rioVenues.set(id,v);
      createSignpost(v.x-.5,v.z+.5,id==='aviation'?'AERO STRIKE WAR':id==='kart-mirassol'?'KART · MIRASSOL':'KART · CEDRAL',0);
      registerInteractable({id:'activity-venue-'+id,type:'activity-venue',icon:v.icon,label:'Jogar · '+v.label,
        x:v.navX,z:v.navZ,radius:2.7,priority:205,action:()=>venueOpen(id)});
    }
  }

  function rioUpdateCommunity(dt){
    rioMap.communityAcc=(rioMap.communityAcc||0)+dt;
    if(rioMap.communityAcc<1/18)return;
    if(!familyWorld.ready&&Math.hypot(player.x-RIO_FAMILY_HOME.x,player.z-RIO_FAMILY_HOME.z-6)<rioFamilyVisualRange())initFamilyAdventure();
    updateFamilyAdventure(rioMap.communityAcc);
    rioMap.communityAcc=0;
    if(performance.now()>=Number(rioMap.nextFarmUpdate||0)){
      rioMap.nextFarmUpdate=performance.now()+1000;
      for(const plot of WORLD_V702.farmPlots.values())updateFarmPlotVisual(plot);
    }
  }

  function openRioActivities(){
    openModal('Vida e atividades',`<div class="choice-grid">
      <button class="choice" data-rio-activity="family"><b>Família</b><span>Passear ou brincar com Luna e Liz</span></button>
      <button class="choice" data-rio-activity="school"><b>Escola</b><span>Traçar rota para as aulas e desafios</span></button>
      <button class="choice" data-rio-activity="farm"><b>Horta comunitária</b><span>Cavar, plantar e colher</span></button>
      <button class="choice" data-rio-activity="items"><b>Inventário</b><span>Alimentos e materiais</span></button>
      <button class="choice" data-rio-activity="tools"><b>Ferramentas</b><span>Equipar os itens do personagem</span></button>
      <button class="choice" data-rio-activity="run"><b>Corrida a pé</b><span>Cronômetro e seis marcações na orla</span></button>
      <button class="choice" data-rio-activity="back"><b>Voltar ao menu</b></button>
    </div>`,root=>{
      const actions={family:openFamilyAdventure,school:()=>setWaypoint('school'),farm:()=>setWaypoint('farm'),
        items:openInventory,tools:openToolbelt,run:openRioGeoRun,back:openRioMapMenu};
      for(const button of root.querySelectorAll('[data-rio-activity]'))button.onclick=actions[button.dataset.rioActivity];
    });
  }

  function rioJourneySteps(){
    const saved=rioMapSave(),me=sharedWorldOwnId();
    return [
      {title:'Visite o Mercadão',description:'Entre no Mercado Municipal e fale com o comerciante.',
        done:!!saved.visits['regional-mercado_municipal'],action:()=>setWaypoint('shop')},
      {title:'Receba uma encomenda',description:'Compre pelo celular e encontre o entregador na rua indicada.',
        done:phoneOrders().some(order=>order.owner===me&&phoneOrderOnMap(order)&&order.kind==='parcel'&&order.status==='delivered'),action:openWorldPhone},
      {title:'Passeie no Parque da Represa',description:'Reúna Thiago, Thamis, Luna e Liz e vá com o grupo até o parque.',
        done:!!saved.familyPark,action:openFamilyAdventure},
      {title:'Complete a volta na orla',description:'Percorra seis marcações em 300 m de corrida a pé.',
        done:!!rioStreetRecord()?.best,action:openRioGeoRun},
      {title:'Acompanhe o socorro',description:'Observe as três equipes chegarem e liberarem uma ocorrência.',
        done:!!saved.physicalRescues,action:openRioEmergency}
    ];
  }

  function openRioJourney(){
    const steps=rioJourneySteps(),done=steps.filter(step=>step.done).length;
    openModal('Meu caminho em Rio Preto',`<p>${done} de ${steps.length} objetivos concluídos</p><div class="choice-grid">${steps.map((step,i)=>
      `<button class="choice" data-rio-journey="${i}"><b>${step.done?'✓ ':''}${step.title}</b><span>${step.description}</span></button>`).join('')}</div>`,root=>{
        for(const button of root.querySelectorAll('[data-rio-journey]'))button.onclick=steps[Number(button.dataset.rioJourney)].action;
    });
  }
  const beforeRioObjectives=openObjectivesPanel;
  openObjectivesPanel=function(){return inRioMap()?openRioJourney():beforeRioObjectives();};
  const beforeRioMissionHud=updateMissionHUD;
  updateMissionHUD=function(){
    if(!inRioMap())return beforeRioMissionHud();
    const steps=rioJourneySteps(),next=steps.find(step=>!step.done),total=steps.filter(step=>step.done).length;
    setControlText(els.missionChapter,'MEU CAMINHO');
    setControlText(els.missionTitle,next?.title||'Rio Preto explorada');
    setControlText(els.missionStep,next?.description||'Escolha uma atividade para repetir.');
    els.missionFill.style.width=(total/steps.length*100)+'%';
    els.missionCard.setAttribute('aria-label','Meu caminho em Rio Preto');
  };

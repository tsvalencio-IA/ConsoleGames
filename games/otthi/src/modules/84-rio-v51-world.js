/** Regional landmarks use the World scene, shops, activity controls and save. */
// @otthi-module-body
  const rioV51World={roots:new Map(),registered:false,markers:[],nextSectorAt:0};
  const rioV51Palette={
    swift:[0xa35541,0xe7b897],station:[0xad533a,0xe6cc9f],tower:[0xd7cdad,0x7c9da3],
    church:[0xe5cfac,0x98735b],mall:[0xc9cbbe,0x3c7e88],market:[0xc7a67e,0x446b58],
    commerce:[0xd1b797,0xb46545],hospital:[0xd5e1db,0x597d9d],hall:[0xaebec1,0x574b66],
    terminal:[0x98aab5,0x33566b],service:[0xd7d0a4,0x3b657a],gate:[0xb9ad9a,0x648265]
  };

  function rioV51Building(batch,p,draw){
    const {box,collider,part}=draw,{w,h,d,shape}=p;
    const [wall,accent]=rioV51Palette[shape],front=d/2-.37;
    if(shape==='gate'){
      for(const side of [-1,1]){
        box(side*w*.36,1.7,0,w*.25,3.4,d-1,wall);
        collider(side*w*.36,0,w*.25,d-1,3.4);
      }
      box(0,3.82,front, w,.5,2.6,accent);
      box(0,3.53,front+.96,w*.51,.44,.14,accent);
      return;
    }
    const pitched=['swift','station','church','market'].includes(shape);
    const shellH=h*(pitched?.68:.86),sideW=w*.92;
    box(0,shellH/2,0,sideW,shellH,d-1,wall);
    collider(0,0,sideW,d-1,shellH);
    if(pitched){
      part(shape==='station'?'roof':'hip',0,shellH+(h-shellH)*.48,0,w,h-shellH,d,accent);
    }else{
      box(0,shellH+.24,0,w,.47,d,accent);
      box(0,shellH+.69,front,w,.48,.35,wall);
    }
    const floors=Math.max(1,Math.min(5,Math.floor(shellH/3.4)));
    const columns=Math.max(3,Math.min(8,Math.floor(w/2.9)));
    for(let level=0;level<floors;level++){
      for(let i=0;i<columns;i++){
        const x=(i-(columns-1)/2)*(w-.9)/columns;
        if(!level&&Math.abs(x)<1.72)continue;
        rioWindowModule(draw,x,2.2+level*(shellH-1.1)/floors,front,Math.min(1.45,w/columns*.65),1.45,wall);
      }
    }
    box(0,1.65,front+.08,3.2,3.3,.16,0x34616f);
    box(0,3.45,front+.80,Math.min(8,w*.52),.28,1.85,accent);
    if(shape==='church'){
      for(const side of [-1,1]){
        box(side*w*.36,shellH*.68,-d*.30,w*.17,shellH*1.35,d*.21,wall);
        part('hip',side*w*.36,shellH*1.42,-d*.30,w*.20,2,d*.23,accent);
      }
      part('post',0,shellH*.66,front+.17,1.9,.19,1.9,0xded1b9,0,Math.PI/2);
      box(0,h*.74,-d*.32,w*.24,h*.52,d*.17,wall);
      box(0,h+.42,-d*.32,.22,1.8,.22,0xd5aa63);
      box(0,h+.61,-d*.32,1.3,.22,.22,0xd5aa63);
    }else if(shape==='swift'){
      for(const x of [-.43,-.24,.24,.43])box(x*w,shellH*.46,front+.17,.43,shellH*.92,.26,accent);
      box(0,shellH*.86,front+.18,w*.89,.31,.26,accent);
      part('post',-w*.36,h*.58,-d*.32,1.15,h*1.16,1.15,wall);
    }else if(shape==='tower'||shape==='terminal'){
      box(-w*.32,shellH+.6,-d*.17,w*.22,1.2,d*.22,accent);
    }
    if(shape==='hospital'){
      box(0,shellH-.9,front+.18,1.9,.38,.095,0xb1474d);
      box(0,shellH-.9,front+.2,.38,1.9,.095,0xb1474d);
    }
    if(shape==='mall'||shape==='hall'){
      for(const side of [-1,1])box(side*w*.30,2.6,front+.15,w*.27,3.8,.17,0x5f8f95);
    }
  }

  function rioV51Outdoors(p,draw){
    const {box,collider,tree,part,bench}=draw,{w,d,h,shape}=p;
    const cream=0xe5d1ac,stone=0xb7b6ac,steel=0x535e63;
    if(shape==='stadium'||shape==='arena'){
      box(0,.25,0,w*.67,.4,d*.70,shape==='stadium'?0x519353:cream);
      if(shape==='stadium')box(0,.464,0,.12,.035,d*.65,0xf7efd9);
      for(const side of [-1,1]){
        for(let row=0;row<3;row++)box(0,.48+row*.36,side*(d*.30+row*.55),w*.88,.85+row*.7,1.04,row===2?0x6d8387:cream);
        collider(0,side*d*.35,w*.88,2.05,1.95);
        const x=side*w*.37;
        part('post',x,4, -d*.37,.24,8,.24,steel);
        box(x,7.85,-d*.37,1.25,.54,.47,0xf0e0a0);
      }
      return;
    }
    if(shape==='bridge'){
      box(0,.50,0,w,.52,2.6,cream);
      const mast=w*.17;
      box(mast,4.5,0,.48,9,.48,stone);
      for(const offset of [-8,-6,-4,4,6,8]){
        const x=offset/18*w,dx=mast-x,dy=7.2;
        box(x+dx/2,4.3,0,.09,Math.hypot(dx,dy),.09,cream,0,-Math.atan2(dx,dy));
      }
      return;
    }
    if(shape==='capi'){
      box(0,.3,0,5,.6,4,stone);
      part('canopy',0,1.54,0,3,1.65,1.8,0x91623c);
      part('canopy',1.35,1.94,0,1.44,1.2,1.36,0xa37148);
      part('canopy',1.91,1.72,0,.88,.63,1.02,0x865532);
      for(const x of [-1,.75])for(const z of [-.43,.43])box(x,.89,z,.35,.59,.34,0x926644);
      collider(0,0,5,4,2.3);return;
    }
    if(shape==='obelisk'){
      box(0,.39,0,4.3,.78,4.3,stone);
      part('hip',0,4.1,0,2.8,7.1,2.8,0xd4c9af);collider(0,0,4,4,7.6);return;
    }
    box(0,.07,0,w,.12,d,shape==='beach'?0xcdb582:cream);
    if(shape==='pool'||shape==='beach'){
      box(0,.14,-d*.16,w*.72,.025,d*.54,0x4f96b5);
      for(const side of [-1,1]){
        tree(side*w*.35,d*.28,3.4,0x628959);
        bench(side*w*.25,d*.36);
      }
    }else if(shape==='lookout'){
      for(const [x,z,scale] of [[-5,-3,8],[0,-4,10],[6,-2,6]])part('canopy',x,scale*.36,z,scale,scale*.72,scale*.75,0x697b56);
      collider(0,-3,w*.75,8,h*.6);
    }else{
      tree(-w*.38,-d*.30,4.2,0x6a9553,0xe2ba53);
      tree(w*.38,-d*.30,4.5,0x619157,0xd5ab59);
      bench(0,d*.29);
      box(0,.22,-d*.18,w*.39,.38,d*.40,stone);
    }
  }

  function rioV51DrawPlace(batch,p){
    const draw=rioLocal(batch,{...p,yaw:p.face===1?0:Math.PI});
    if(rioV51Palette[p.shape])rioV51Building(batch,p,draw);
    else rioV51Outdoors(p,draw);
    draw.box(0,.08,p.d/2+1.65,Math.min(p.w,7.3),.13,3.45,0xd4c8ab);
    if(typeof decorateRioCitySite==='function')decorateRioCitySite(p,draw);
    const tall=!!rioV51Palette[p.shape]&&p.shape!=='gate',signY=tall?Math.min(p.h*.44,4.55):p.shape==='gate'?3.82:1.45;
    draw.sign(p.name,0,signY,p.d/2+.04+(p.shape==='gate'?.9:0),Math.min(p.w-.8,16),.86, p.fictional?'#775e39':'#284d54');
  }

  function rioV51DrawCourse(batch,root){
    const course=RIO_V51.course;
    for(let i=1;i<course.route.length;i++){
      const a=course.route[i-1],b=course.route[i],x=(a.x+b.x)/2,z=(a.z+b.z)/2;
      const height=groundHeightAt(x,z)+.066;
      const len=Math.hypot(a.x-b.x,a.z-b.z);
      batch.part('box',x,height,z,4.4,.13,len+4,0xcba897,Math.atan2(b.x-a.x,b.z-a.z));
    }
    for(const p of course.lakes){
      const y=groundHeightAt(p.x,p.z);
      batch.part('box',p.x,y+.08,p.z,p.w,.15,p.d,0x5195b1);
      for(const side of [-1,1]){
        batch.part('box',p.x+side*p.w/2,y+.32,p.z,.24,.64,p.d,0x859b9b);
        batch.part('box',p.x,y+.32,p.z+side*p.d/2,p.w,.64,.24,0x859b9b);
      }
      registerCollider(p.x,p.z,p.w,p.d,{height:.8,rioV51Lake:p.id});
    }
    const {x,z}=course.start,y=groundHeightAt(x,z);
    for(const side of [-1,1])batch.part('box',x,y+1.58,z+side*2.85,.35,3.16,.36,0x346b58);
    batch.part('box',x,y+3.35,z,.41,.47,6.1,0x346b58);
    const markerGeo=new THREE.RingGeometry(1.45,2.12,28);
    for(const [i,p] of course.gates.entries()){
      const marker=new THREE.Mesh(markerGeo,new THREE.MeshBasicMaterial({color:i===5?0x4cd2a5:0xffd66b,side:THREE.DoubleSide}));
      marker.rotation.x=-Math.PI/2;marker.position.set(p.x,groundHeightAt(p.x,p.z)+.145,p.z);
      marker.visible=false;root.add(marker);
      rioV51World.markers.push(marker);
    }
  }

  function rioV51Location(p){
    if(p.nativeVenue==='football')return{id:p.id,name:p.name,icon:'⚽',group:RIO_V51.sectors[p.sector].label,
      x:p.visitX,z:p.visitZ,navX:p.navX,navZ:p.navZ,
      description:'Estádio jogável inspirado no Benedito Teixeira, com partidas de futebol 4 × 4 e pista de atletismo.'};
    return{id:p.id,name:p.name,icon:p.fictional?'🌄':'📍',group:RIO_V51.sectors[p.sector].label,
      x:p.visitX,z:p.visitZ,navX:p.navX,navZ:p.navZ,
      description:p.fictional?'Local fictício criado para o jogo.':'Local de referência com fachada estilizada e posição adaptada ao mapa.'};
  }
  function rioV51Visit(p){
    if(p.nativeVenue==='football')return openFootballV705();
    if(p.key==='portaria_damha')return openRioStreetRun();
    if(p.shop==='tools'||p.shop==='materials')return openShop();
    if(p.shop)return openCityShop(p.id);
    if(p.key==='prefeitura_andalo')return openCivilMissions();
    if(p.key==='aeroporto_sjrp')return openFlightAcademy();
    if(typeof openRioCitySite==='function'&&openRioCitySite(p))return true;
    const label=p.fictional?'Área fictícia do OTTHI World.':'Fachada estilizada em posição adaptada dentro do jogo.';
    openModal(p.name,'<p>'+label+'</p>'+(p.fictional?'':'<p>Endereço de referência: '+escapeHtml(p.address)+'</p>')+
      '<button class="btn primary" data-rio-visit-close>Voltar ao passeio</button>',root=>{
        root.querySelector('[data-rio-visit-close]').onclick=closeModal;
      });
    return true;
  }
  function rioV51Register(){
    rioV51World.registered=true;
    for(const p of RIO_V51.places){
      if(p.nativeVenue)continue;
      if(['market','fastfood','cafe'].includes(p.shop))cityCoast.shops.set(p.id,{
        id:p.id,label:p.name,kind:p.shop,x:p.x,z:p.visitZ,navX:p.visitX,navZ:p.visitZ,
        face:p.face,description:'Itens do comércio do OTTHI World.'
      });
      const run=p.key==='portaria_damha';
      registerInteractable({id:p.id,type:run?'race':p.shop?'shop':'viewpoint',icon:run?'🏃':'📍',
        label:run?'Corrida de Rua · Represa e Damha':p.name,x:p.visitX,z:p.visitZ,radius:run?4:3.5,priority:run?250:215,
        available:()=>!activeRace&&!SPORTS_V705.active&&!player.vehicle&&!player.boating&&!otGames.active&&!currentHouse,
        action:()=>rioV51Visit(p)});
    }
  }
  function updateRioV51World(){
    if(!legacyRegionalLayout||!running||!worldGroup||!worldExpansion.ready)return;
    if(!rioV51World.registered)rioV51Register();
    const focus=otGamesFocus();
    let next=null,distance=Infinity;
    for(const sector of Object.values(RIO_V51.sectors)){
      const d=Math.hypot(focus.x-sector.x,focus.z-sector.z);
      const root=rioV51World.roots.get(sector.id);
      if(root){root.visible=d<195;continue;}
      if(d<210&&d<distance){next=sector;distance=d;}
    }
    if(!next||performance.now()<rioV51World.nextSectorAt)return;
    mountRioV51Sector(next).visible=distance<195;
    rioV51World.nextSectorAt=performance.now()+55;
  }
  function mountRioV51Sector(sector){
    const existing=rioV51World.roots.get(sector.id);
    if(existing)return existing;
    const root=new THREE.Group();root.name='RIO_V51_'+sector.id;root.visible=false;
    const batch=rioCreateBatch(root);batch.root=root;
    for(const p of sector.places){
      if(p.nativeVenue)continue;
      rioV51DrawPlace(batch,p);
      if(typeof addRioCityLights==='function')addRioCityLights(p,root);
    }
    if(sector.id==='represa_lagos_damha')rioV51DrawCourse(batch,root);
    batch.commit();
    worldGroup.add(root);rioV51World.roots.set(sector.id,root);
    world.navCache?.clear?.();
    return root;
  }
  function arriveAtRioV51(){
    const swift=RIO_V51.places.find(p=>p.key==='complexo_swift');
    const root=mountRioV51Sector(RIO_V51.sectors[swift.sector]);
    if(!rioV51World.registered)rioV51Register();
    const approach={x:swift.visitX-5,z:swift.visitZ+swift.face*24};
    const safe=safePointNear(approach.x,approach.z,{allowWater:false,distances:[0,.8,1.6,2.4]});
    if(Math.hypot(safe.x-approach.x,safe.z-approach.z)>3)return false;
    root.visible=true;
    player.x=safe.x;player.z=safe.z;player.y=safe.y;
    player.vx=player.vy=player.vz=0;player.grounded=true;
    cameraMode='openworld';cameraYaw=Math.atan2(swift.x-player.x,player.z-swift.z);cameraPitch=.30;cameraZoom=4;
    player.facing=Math.PI-cameraYaw;
    playerGroup.position.set(player.x,player.y,player.z);playerGroup.rotation.y=player.facing;
    rememberSafePlayerPosition(true);
    updateCamera(2);
    savePlayerPosition(true);
    return true;
  }

  function rioStreetRecord(){const course=typeof inRioMap==='function'&&inRioMap()?rioMap.course:RIO_V51.course;return state.races?.streetRuns?.[course?.id];}
  function openRioStreetRun(){
    const separateRio=typeof inRioMap==='function'&&inRioMap();const {name}=separateRio?rioMap.course:RIO_V51.course,record=rioStreetRecord();
    openModal(name,(separateRio?'<p>Percorra 300 metros na pista de caminhada da Represa e passe pelos seis pontos.</p>':'<p>Passe pelos seis pontos na ordem. Siga a calçada em volta dos lagos e termine no pórtico da Damha.</p>')+
      (record?'<p>Melhor tempo: '+Number(record.best).toFixed(2)+' s</p>':'')+
      '<button class="btn primary" data-rio-run-start>Largar a pé</button>',root=>{
        root.querySelector('[data-rio-run-start]').onclick=()=>{
          if(activeRace||SPORTS_V705.active||player.vehicle||player.boating||currentHouse||otGames.active)return;
          closeModal();startRioStreetRun();
        };
      });
  }
  function startRioStreetRun(){
    const separateRio=typeof inRioMap==='function'&&inRioMap();
    const course=separateRio?rioMap.course:RIO_V51.course;
    if(activeRace||(!separateRio&&!rioV51World.roots.has('represa_lagos_damha'))||!course||player.vehicle||player.boating||otGames.active)return false;
    const {x,z}=course.start;
    activeRace={type:'rio-street',courseId:course.id,nextGate:0,elapsed:0,countdown:3,outside:0};
    clearMovementInputs();
    player.x=x;player.z=z;player.y=groundHeightAt(x,z);player.vx=player.vz=player.vy=0;
    player.facing=separateRio?Math.atan2(course.route[1].x-x,course.route[1].z-z):-Math.PI/2;cameraYaw=separateRio?Math.PI-player.facing:Math.PI/2;
    v705Hud('🏃 '+course.name,'3 s');
    return true;
  }
  function finishRioStreetRun(completed){
    const race=activeRace;
    if(race?.type!=='rio-street')return false;
    activeRace=null;
    for(const marker of (typeof inRioMap==='function'&&inRioMap()?rioMap.courseMarkers:rioV51World.markers))marker.visible=false;
    v705HudOff();
    if(completed){
      const previous=rioStreetRecord()||{},best=Math.min(race.elapsed,Number(previous.best)||Infinity);
      (state.races.streetRuns||={})[race.courseId]={runs:(previous.runs||0)+1,best,last:race.elapsed};
      state.stats.races++;trackDaily('race',1);saveState(true);
      toast('Corrida concluída · '+race.elapsed.toFixed(2)+' s','good',2800);
    }else toast('Corrida encerrada. Volte ao pórtico para tentar novamente.','info',2400);
    return true;
  }
  function updateRioStreetRun(dt){
    const race=activeRace,separateRio=typeof inRioMap==='function'&&inRioMap(),course=separateRio?rioMap.course:RIO_V51.course;
    if(player.vehicle||player.boating||currentHouse||otGames.active)return finishRioStreetRun(false);
    if(race.countdown>0){
      race.countdown=Math.max(0,race.countdown-dt);
      els.raceStatus.textContent=String(Math.max(1,Math.ceil(race.countdown)));
      return;
    }
    const onRoute=course.route.slice(1).some((end,i)=>{
      const at=projectPointToSegment(player,course.route[i],end);
      return Math.hypot(player.x-at.x,player.z-at.z)<4.5;
    });
    race.outside=onRoute?0:race.outside+dt;
    race.elapsed+=dt;
    if(race.outside>2.5||race.elapsed>=360)return finishRioStreetRun(false);
    const target=course.gates[race.nextGate];
    if(Math.hypot(player.x-target.x,player.z-target.z)<2.45&&player.y-groundHeightAt(player.x,player.z)<2.3){
      race.nextGate++;
      if(race.nextGate===course.gates.length)return finishRioStreetRun(true);
      beep(970,45);
    }
    for(const [i,marker] of (separateRio?rioMap.courseMarkers:rioV51World.markers).entries())marker.visible=i===race.nextGate;
    const next=course.gates[race.nextGate];
    els.raceStatus.textContent=(race.nextGate+1)+'/6 · '+next.label+' · '+race.elapsed.toFixed(1)+' s';
  }

  const rioV51PreviousExpansion=updateWorldExpansion;
  updateWorldExpansion=function(){rioV51PreviousExpansion();updateRioV51World();};
  const rioV51PreviousLocations=expansionMapLocations;
  expansionMapLocations=function(){return legacyRegionalLayout?[...rioV51PreviousLocations(),...RIO_V51.places.map(rioV51Location)]:rioV51PreviousLocations();};
  const rioV51PreviousDirectory=worldExploreDirectoryHtml;
  worldExploreDirectoryHtml=function(...args){
    if(!legacyRegionalLayout)return rioV51PreviousDirectory(...args);
    const groups=Object.values(RIO_V51.sectors).map(sector=>
      '<details><summary>'+escapeHtml(sector.label)+' · '+sector.places.length+'</summary><div class="choice-grid">'+
      sector.places.map(p=>'<button class="choice" data-rio-v51-route="'+p.id+'"><b>'+escapeHtml(p.name)+'</b><span>'+
        (p.fictional?'Local fictício':'Fachada estilizada')+'</span></button>').join('')+'</div></details>').join('');
    return '<details data-rio-v51-directory><summary>Rio Preto e região · '+RIO_V51.places.length+' locais</summary>'+
      groups+'</details>'+rioV51PreviousDirectory(...args);
  };
  const rioV51PreviousBind=worldExploreBindDirectory;
  worldExploreBindDirectory=function(root,...args){
    rioV51PreviousBind(root,...args);
    for(const button of root.querySelectorAll('[data-rio-v51-route]'))button.onclick=()=>{
      closeModal();setWaypoint(button.dataset.rioV51Route);
    };
  };
  window.OTTHI_RIO_V51=Object.freeze({
    diagnostics:()=>({places:RIO_V51.places.length,sectors:Object.keys(RIO_V51.sectors).length,
      loaded:[...rioV51World.roots.keys()],visible:[...rioV51World.roots.values()].filter(root=>root.visible).length,
      course:{record:rioStreetRecord(),active:activeRace?.type==='rio-street'?{...activeRace}:null}}),
    locations:()=>RIO_V51.places.map(rioV51Location)
  });

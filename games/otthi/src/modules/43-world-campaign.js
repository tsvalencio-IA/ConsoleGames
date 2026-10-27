/**
 * OTThi World - geographic campaign layer. Loaded after OT Games in the modular build.
 * All existing game modes, permissions, Firebase namespaces and world layout remain intact.
 */
// @otthi-module-body
  const WORLD_CAMPAIGN_SITES=Object.freeze(typeof WORLD_LAYOUT_V704!=='undefined'?WORLD_LAYOUT_V704.campaignSites:{
    hq:{id:'hq',label:'Centro de Resgate',x:-120,z:-54,radius:22,navX:-120,navZ:-38},
    airbase:{id:'airbase',label:'Aeroporto OT',x:27,z:-169,radius:36,navX:27,navZ:-159},
    north:{id:'north',label:'Centro de Visitantes',x:85,z:115,radius:30,navX:85,navZ:109}
  });
  const worldCampaign={initialized:false,landmarks:[],mission:null,route:null,routeUi:null,time:0,recordKey:''};
  const WORLD_CAMPAIGN_AIRCRAFT={
    ...((typeof WORLD_LAYOUT_V704!=='undefined'&&WORLD_LAYOUT_V704.campaignAircraft)||{plane:{id:'plane',label:'Avião',x:-5,z:-165,yaw:Math.PI/2,radius:6},helicopter:{id:'helicopter',label:'Helicóptero',x:50,z:-165,yaw:0,radius:6}}),
    'heli-tour':{id:'heli-tour',mode:'helicopter',model:'helicopter',livery:'tour',label:'Helicóptero de passeio',x:75,z:-164,yaw:0,radius:6,height:1.0},
    'heli-ottovias':{id:'heli-ottovias',mode:'helicopter',model:'helicopter',livery:'ottovias',label:'Helicóptero OTTOVIAS',x:96,z:-164,yaw:0,radius:6,height:1.0},
    'heli-rescue':{id:'heli-rescue',mode:'helicopter',model:'helicopter',livery:'rescue',label:'Helicóptero de resgate',x:117,z:-164,yaw:0,radius:6,height:1.0},
    'plane-tour':{id:'plane-tour',mode:'plane',model:'light',livery:'tour',label:'Avião de passeio',x:80,z:-216,yaw:Math.PI/2,radius:6,height:.92},
    'plane-cargo':{id:'plane-cargo',mode:'plane',model:'cargo',livery:'cargo',label:'Avião de carga',x:120,z:-216,yaw:Math.PI/2,radius:7,height:1.6},
    'plane-ottovias':{id:'plane-ottovias',mode:'plane',model:'light',livery:'ottovias',label:'Avião OTTOVIAS',x:143,z:-216,yaw:Math.PI/2,radius:6,height:.92},
    balloon:{id:'balloon',mode:'balloon',model:'balloon',label:'Balão das montanhas',x:-66,z:89,yaw:Math.PI,radius:5,height:1.05}
  };
  function campaignAircraftPose(id){const base=WORLD_CAMPAIGN_AIRCRAFT[id];if(!base)return null;const p=state.vehicles?.aircraft?.[id],bounds=v704WorldBounds();return p&&[p.x,p.z,p.yaw].every(Number.isFinite)&&p.x>bounds.minX+2&&p.x<bounds.maxX-2&&p.z>bounds.minZ+2&&p.z<bounds.maxZ-2?{...base,...p}:{...base};}
  function campaignAircraftHeight(id){return WORLD_CAMPAIGN_AIRCRAFT[id]?.height??(id==='plane'?1.3:1.6);}
  function campaignCreateAircraft(id){const spec=WORLD_CAMPAIGN_AIRCRAFT[id];return spec?.model==='balloon'?createMountainBalloon():spec?.model?createCivilianAirframe(spec.model,spec.livery):otGamesAirframe(spec?.mode||id);}
  function campaignParkAircraft(id,b){if(!WORLD_CAMPAIGN_AIRCRAFT[id])return false;state.vehicles.aircraft=state.vehicles.aircraft||{};state.vehicles.aircraft[id]={x:b.x,z:b.z,yaw:b.yaw,hp:Math.max(1,Math.min(100,b.hp)),parkedAt:Date.now()};saveState(true);campaignSyncAircraft();return true;}
  function campaignSyncAircraft(){for(const mesh of worldCampaign.aircraft?.children||[]){const p=campaignAircraftPose(mesh.name);mesh.position.set(p.x,groundHeightAt(p.x,p.z)+campaignAircraftHeight(mesh.name),p.z);mesh.rotation.y=p.yaw;mesh.visible=!(otGames.active&&(otGames.aircraftId||otGames.mode)===mesh.name)&&campaignDist(otGamesFocus(),p)<(otGames.active?380:185);}}
  async function campaignBoardAircraft(id){const p=campaignAircraftPose(id);if(!p||!running||paused||otGames.active||player.vehicle||player.boating||player.transit.mode||campaignDist(player,p)>p.radius)return false;const mode=p.mode||id,pending=campaignPending();if(pending&&pending.mode===mode&&pending.onGround&&campaignDist(pending.body,p)<3)return campaignResume();return otGamesEnter(mode,{armed:false,difficulty:'normal',groundLaunch:true,boarding:p});}
  function campaignLandingZone(mode,b){
    const a=WORLD_CAMPAIGN_SITES.airbase;
    return mode==='plane'?((Math.abs(b.x-a.x)<39&&Math.abs(b.z-(a.z+4))<4.6)||(b.x>26&&b.x<156&&Math.abs(b.z+216)<5.5))&&Math.abs(Math.cos(b.yaw))<.3:campaignDist(b,WORLD_CAMPAIGN_AIRCRAFT.helicopter)<8;
  }
  function campaignDist(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
  function campaignHome(mode){return mode==='ground'?WORLD_CAMPAIGN_SITES.hq:WORLD_CAMPAIGN_SITES.airbase;}
  function campaignMaterial(color,metal=.08,pack){const m=pack&&typeof v702TextureMaterial==='function'?v702TextureMaterial(pack,color,{repeat:[4,2],roughness:.77}):new THREE.MeshStandardMaterial({color,metalness:metal,roughness:.67});m.metalness=metal;return m;}
  function campaignBox(root,mat,x,y,z,w,h,d){
    const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    o.position.set(x,y,z);o.castShadow=h>1;o.receiveShadow=true;root.add(o);return o;
  }
  function campaignCylinder(root,mat,x,y,z,r,h){
    const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,10),mat);
    o.position.set(x,y,z);o.castShadow=true;root.add(o);return o;
  }
  function campaignSign(root,title,subtitle,y){
    const c=document.createElement('canvas');c.width=512;c.height=160;
    const x=c.getContext('2d');x.fillStyle='#102d37';x.fillRect(0,0,512,160);
    x.strokeStyle='#b3ddc7';x.lineWidth=8;x.strokeRect(7,7,498,146);
    x.textAlign='center';x.fillStyle='#f1f6e8';x.font='bold 43px Arial';x.fillText(title,256,72);
    x.fillStyle='#a2d5c5';x.font='bold 24px Arial';x.fillText(subtitle,256,119);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(10,3),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));
    m.position.y=y;root.add(m);return m;
  }
  function campaignCollider(site,x,z,w,d,height){
    const c={x:site.x+x,z:site.z+z,w,d,height,campaignSite:site.id};
    (worldCampaign.colliders||(worldCampaign.colliders=[])).push(c);
    if(typeof world!=='undefined'){world.colliders.push(c);world.navCache?.clear?.();}
  }
  function campaignBatch(root){
    if(!THREE.InstancedMesh||!THREE.Matrix4)return;
    const batches=new Map();
    for(const o of root.children.slice())if(o.isMesh&&o.geometry.type==='BoxGeometry'){
      const p=o.geometry.parameters,key=o.material.uuid;
      if(!batches.has(key))batches.set(key,{material:o.material,items:[]});
      o.updateMatrix();const matrix=o.matrix.clone().multiply(new THREE.Matrix4().makeScale(p.width,p.height,p.depth));
      batches.get(key).items.push(matrix);root.remove(o);o.geometry.dispose();
    }
    for(const {material,items}of batches.values()){
      const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material,items.length);
      items.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;root.add(mesh);
    }
  }
  function campaignDrawSite(site){
    const root=new THREE.Group();root.name='CAMPAIGN_'+site.id;
    root.position.set(site.x,groundHeightAt(site.x,site.z),site.z);
    const road=campaignMaterial(0x647179,.05,'road'),stone=campaignMaterial(0xc2c8bc,.05,'concrete'),green=campaignMaterial(0x667b61,.08,'police-wall'),steel=campaignMaterial(0x273d49,.5),glass=campaignMaterial(0x74a9b8,.3,'city-glass'),line=campaignMaterial(0xf2e2af),red=campaignMaterial(0x9e5c43);
    const box=(m,x,y,z,w,h,d)=>campaignBox(root,m,x,y,z,w,h,d),wall=(m,x,y,z,w,h,d)=>{box(m,x,y,z,w,h,d);campaignCollider(site,x,z,w,d,h+y-h/2);};
    if(site.id==='hq'){
      box(road,0,.04,0,29,.08,23);
      wall(green,-4,2.8,-7.5,16,5.6,.45);wall(green,-11.8,2.8,-3,.45,5.6,9);wall(green,3.8,2.8,-3,.45,5.6,9);
      for(const x of [-9,1])wall(green,x,2.8,1.7,5.6,5.6,.45);
      box(steel,-4,5.8,-3,17,.45,11);box(stone,-4,4.6,2,16,.35,.5);
      for(const x of [-9,1]){box(steel,x,2.7,1.98,3.9,2,.18);box(glass,x,2.7,2.1,3.5,1.65,.1);box(stone,x,2.7,2.19,.08,1.7,.08);}
      box(stone,-4,.18,4.5,5,.3,5);box(steel,-4,4.2,3.6,5,.3,4.5);
      for(const x of [-6.2,-1.8])wall(stone,x,2,5.5,.25,4,.25);
      for(const x of [-13,12]){wall(stone,x,1.5,-6,3,3,5);box(steel,x,3.15,-6,3.5,.3,5.5);box(glass,x,2,-3.42,2.3,1,.15);}
      for(const x of [-12,12])for(let z=1;z<11;z+=3)box(line,x,.1,z,1.5,.04,.14);
      campaignCylinder(root,steel,8,7,-8,.14,14);box(line,9,11,-8,2,.9,.08);
      const sign=campaignSign(root,'CENTRO DE RESGATE','POLÍCIA · BOMBEIROS · APOIO',7);if(sign)sign.position.z=1;
    }else if(site.id==='airbase'){
      box(road,0,.04,-3,82,.08,29);box(steel,0,.1,4,80,.06,8);
      for(let i=-3;i<=3;i++)box(line,i*10,.15,4,4,.025,.22);
      for(const z of [.35,7.65])box(line,0,.15,z,79,.025,.12);
      for(const x of [-36,36])for(let z=1.2;z<7;z+=.8)box(line,x,.15,z,3,.025,.25);
      for(const x of [-25,25]){
        wall(stone,x,3.3,-17,18,6.6,.45);
        for(const dx of [-8.8,8.8])wall(stone,x+dx,3.3,-12.5,.45,6.6,9);
        box(steel,x,6.7,-12.5,19,.5,10);box(red,x,5.8,-7.7,17,1.2,.3);
        for(let dx=-7;dx<=7;dx+=3.5)box(glass,x+dx,5.8,-7.49,2.7,.55,.05);
      }
      wall(stone,1,5.3,-13,4,10.6,4);box(glass,1,10.8,-13,6,2.5,6);box(steel,1,12.3,-13,7,.4,7);
      campaignCylinder(root,steel,1,14,-13,.08,3.5);box(line,1,15.8,-13,3,.08,.12);
      box(line,23,.15,4,9,.025,9);box(road,23,.18,4,8.6,.025,8.6);
      for(const x of [21.5,24.5])box(line,x,.21,4,.35,.02,4);box(line,23,.21,4,3,.02,.35);
      for(let x=-39;x<40;x+=8)for(const z of [-.4,8.4])campaignCylinder(root,line,x,.25,z,.12,.35);
      const sign=campaignSign(root,'AEROPORTO OT','HANGARES · PISTA · HELIPONTO',8);if(sign)sign.position.z=-7;
    }else{
      box(road,0,.04,0,15.8,.08,9.8);
      for(const x of [-5,5]){wall(green,x,1.25,2.8,4,2.5,3);box(steel,x,2.65,2.8,4.4,.3,3.4);box(glass,x,1.6,1.2,2,1,.1);}
      for(const x of [-6.5,6.5]){wall(stone,x,.5,-2.7,2.2,1,1);box(line,x,.8,-3.24,1.6,.12,.08);}
      campaignCylinder(root,steel,0,4,3,.09,8);box(line,1,7,3,2,1,.08);
      const sign=campaignSign(root,'CENTRO DE VISITANTES','TRILHAS · NATUREZA · PASSEIOS',5);if(sign)sign.position.z=0;
    }
    campaignBatch(root);worldGroup.add(root);worldCampaign.landmarks.push({site,root});
  }
  async function campaignLoadAircraft(){
    if(worldCampaign.loadingAircraft||worldCampaign.aircraft)return;
    worldCampaign.loadingAircraft=true;
    try{
      if(OT_CHILD_WORLD)otGames.assets||={};
      if(!otGames.assets){const response=await fetch(new URL('assets/ot-games-airframes.json',OTTHI_GAME_LIVE_BASE));if(!response.ok)throw Error('airframes');otGames.assets=await response.json();}
      const root=new THREE.Group();root.name='CAMPAIGN_PARKED_AIRCRAFT';worldCampaign.aircraft=root;
      for(const mode of Object.keys(WORLD_CAMPAIGN_AIRCRAFT)){const p=campaignAircraftPose(mode),mesh=campaignCreateAircraft(mode);mesh.name=mode;mesh.position.set(p.x,groundHeightAt(p.x,p.z)+campaignAircraftHeight(mode),p.z);mesh.rotation.y=p.yaw;root.add(mesh);}
      worldGroup.add(root);
      for(const mode of Object.keys(WORLD_CAMPAIGN_AIRCRAFT))registerInteractable({id:'board-aircraft-'+mode,type:'vehicle',icon:mode==='balloon'?'🎈':(WORLD_CAMPAIGN_AIRCRAFT[mode].mode||mode)==='plane'?'✈️':'🚁',label:'Embarcar: '+WORLD_CAMPAIGN_AIRCRAFT[mode].label,radius:WORLD_CAMPAIGN_AIRCRAFT[mode].radius,priority:185,getPos:()=>campaignAircraftPose(mode),available:()=>!otGames.active&&!player.vehicle&&!player.boating&&!player.transit.mode,action:()=>campaignBoardAircraft(mode)});
    }catch(e){console.warn('Aeronaves estacionadas indisponíveis:',e.message);}
    finally{worldCampaign.loadingAircraft=false;}
  }
  function campaignStyle(){
    if(document.getElementById('ot-campaign-css'))return;
    const css=document.createElement('style');css.id='ot-campaign-css';
    css.textContent=[
      '#worldCampaignBtn{position:absolute;z-index:110;top:calc(130px + var(--safe-top,0px));right:calc(8px + var(--safe-right,0px));width:103px;min-height:44px;padding:5px 8px;border-radius:13px;border:2px solid #8fdbb4;background:linear-gradient(180deg,#317c69,#163d4c);color:#f4fff4;font:800 12px system-ui;line-height:1.15;box-shadow:0 4px 15px #0018;cursor:pointer;touch-action:manipulation;pointer-events:auto}',
      'body.ot-games-active #worldCampaignBtn{display:none!important}',
      'body.ui-landscape.otthi-v705-world #worldCampaignBtn{top:calc(96px + var(--safe-top,0px));right:calc(min(20vw,150px) + 17px + var(--safe-right,0px));min-height:42px}',
      '@media(max-width:550px) and (orientation:portrait){#worldCampaignBtn{top:calc(175px + var(--safe-top,0px));right:calc(10px + var(--safe-right,0px))}}',
      '#campaignRoute{position:fixed;z-index:590;top:max(5px,env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);width:min(350px,calc(100vw - 22px));box-sizing:border-box;text-align:center;border:1px solid #b1d7c08f;border-radius:10px;padding:6px 9px;background:#102c39e9;color:#f0ffea;font:700 12px/1.3 system-ui;pointer-events:none}',
      '#campaignRoute small{display:block;font:600 10px/1.3 system-ui;color:#c2ded1}',
      '#campaignRoute[hidden]{display:none!important}',
      '.ot-games-active #ot-games-hud header{top:max(53px,env(safe-area-inset-top,0px) + 44px)}',
      '.ot-games-active.campaign-operation-active #ot-games-hud .ot-games-mission{display:none!important}',
      '@media(max-height:460px){#campaignRoute{width:min(310px,calc(100vw - 155px));top:3px;padding:3px 5px;font-size:10px}#campaignRoute small{font-size:9px}.ot-games-active #ot-games-hud header{top:37px;padding:2px}}'
    ].join('\n');document.head.append(css);
  }
  function campaignEnsure(){
    if(!running||!worldGroup||!scene)return;
    if(worldCampaign.initialized){
      for(const item of worldCampaign.landmarks)if(item.root.parent!==worldGroup)worldGroup.add(item.root);
      if(worldCampaign.aircraft?.parent!==worldGroup&&worldCampaign.aircraft)worldGroup.add(worldCampaign.aircraft);
      if(typeof world!=='undefined')for(const c of worldCampaign.colliders||[])if(!world.colliders.includes(c))world.colliders.push(c);
      return;
    }
    campaignStyle();
    window.addEventListener?.('pagehide',campaignPersist);
    document.addEventListener?.('visibilitychange',()=>{if(document.hidden)campaignPersist()});
    for(const site of Object.values(WORLD_CAMPAIGN_SITES))campaignDrawSite(site);
    if(typeof fetch==='function')campaignLoadAircraft();
    worldCampaign.recordKey='thia:otthi:campaign:v1:'+(state.profile?.playerId||'local');
    const button=document.createElement('button');button.id='worldCampaignBtn';button.type='button';
    button.textContent='MISSÕES';button.setAttribute('aria-label','Abrir missões, Quartel-General, Base Aérea e Setor Norte');button.onclick=campaignOpen;
    // HUD button is independent of the collapsed Vida/quickBar.
    const gameScreen=document.getElementById('game');
    if(!gameScreen)return;
    gameScreen.append(button);
    const box=document.createElement('div');box.id='campaignRoute';box.hidden=true;box.innerHTML='<b></b><small></small>';
    document.body.append(box);worldCampaign.routeUi=box;
    document.body.classList.add('campaign-world');worldCampaign.initialized=true;
  }
  function campaignHistory(){
    try{return JSON.parse(safeLocalGet(worldCampaign.recordKey)||'{}')||{};}catch{return{};}
  }
  function campaignPending(){
    if(OT_CHILD_WORLD)return null;
    try{const p=JSON.parse(safeLocalGet(worldCampaign.recordKey+':session')||'null');return p?.v===1&&['ground','plane','helicopter'].includes(p.mode)&&['depart','travel','combat','return'].includes(p.phase)&&p.body&&['x','y','z','yaw','pitch','hp'].every(k=>Number.isFinite(p.body[k]))&&p.body.hp>0&&p.body.hp<=100&&p.body.y>=0&&p.body.y<=650&&Math.abs(p.body.pitch)<=.85?p:null;}catch{return null;}
  }
  function campaignPersist(){
    if(OT_CHILD_WORLD)return;
    const m=worldCampaign.mission,g=otGames;if(!m||m.recorded||!g.active||!g.body)return;
    if(g.state==='DEFEAT'||g.state==='SPAWN_BLOCKED'){safeLocalSet(worldCampaign.recordKey+':session','null');return;}
    safeLocalSet(worldCampaign.recordKey+':session',JSON.stringify({v:1,mode:m.mode,phase:m.phase,runId:m.runId,previousWaypoint:m.previousWaypoint,difficulty:g.difficulty,body:{...g.body},goal:g.goal,kills:g.kills,wave:g.wave,ammo:g.ammo,reserve:g.reserve,elapsed:g.elapsed,onGround:g.onGround,groundLaunch:g.groundLaunch,airspeed:g.airspeed,collective:g.collective,enemies:g.enemies.filter(e=>e.active).map(e=>({kind:e.kind,x:e.x,y:e.y,z:e.z,hp:e.hp}))}));
  }
  async function campaignResume(){
    if(OT_CHILD_WORLD)return false;
    const p=campaignPending();if(!p||otGames.active||!running||paused)return false;
    const b=typeof v704WorldBounds==='function'?v704WorldBounds():{minX:-190,maxX:190,minZ:-190,maxZ:190};
    if(p.body.x<b.minX||p.body.x>b.maxX||p.body.z<b.minZ||p.body.z>b.maxZ)return false;
    closeModal();if(!await otGamesEnter(p.mode,{armed:false,difficulty:p.difficulty,groundLaunch:p.mode!=='ground'&&!!p.groundLaunch}))return false;
    const g=otGames;Object.assign(g.body,p.body);g.goal=Math.max(1,Math.min(20,Number(p.goal)||8));g.kills=Math.max(0,Math.min(g.goal,Math.floor(Number(p.kills)||0)));g.wave=Math.max(0,Math.floor(Number(p.wave)||0));g.ammo=Math.max(0,Math.min(30,Math.floor(Number(p.ammo)||0)));g.reserve=Math.max(0,Math.min(500,Math.floor(Number(p.reserve)||0)));g.elapsed=Math.max(0,Number(p.elapsed)||0);g.onGround=!!p.onGround;g.groundLaunch=p.mode!=='ground'&&!!p.groundLaunch;g.flightPhase=g.onGround?'ready':'airborne';g.airspeed=Math.max(0,Math.min(45,Number(p.airspeed)||0));g.collective=Math.max(0,Math.min(1,Number(p.collective)||0));
    worldCampaign.mission={id:'norte-'+p.mode,mode:p.mode,base:campaignHome(p.mode),phase:p.phase,recorded:false,runId:p.runId||String(Date.now()),previousWaypoint:p.previousWaypoint||null};
    g.armed=p.phase==='combat';
    if(g.armed){for(const [i,e]of (p.enemies||[]).slice(0,6).entries())if(['soldier','tank','drone'].includes(e.kind)&&[e.x,e.y,e.z,e.hp].every(Number.isFinite)&&e.hp>0){const target=otGamesEnemy(e.kind,e.x,e.z,g.wave*10+i);target.hp=e.hp;if(e.kind==='drone'){target.y=target.baseY=e.y;target.group.position.y=e.y;}g.enemies.push(target);}if(!g.enemies.length&&g.kills<g.goal)otGamesSpawnWave();}
    if(g.kills>=g.goal){worldCampaign.mission.phase='return';g.armed=false;}
    worldCampaign.route=g.armed?null:worldCampaign.mission.phase==='return'?campaignHome(p.mode):WORLD_CAMPAIGN_SITES.north;
    if(worldCampaign.route)campaignNavigate(worldCampaign.route);otGamesCamera(.1);otGamesUpdateHUD();toast('Operação retomada. A câmera frontal pode ser calibrada novamente.','info',3500);return true;
  }
  function campaignRestoreRoute(m){
    if(!m)return;state.waypoint=m.previousWaypoint||null;
    if(typeof updateWaypointMarker==='function')updateWaypointMarker();if(typeof updateNavigation==='function')updateNavigation(0,true);if(typeof saveState==='function')saveState(true);
  }
  function campaignAbort({preserve=false}={}){
    const m=worldCampaign.mission;if(!m)return;
    if(preserve)campaignPersist();else safeLocalSet(worldCampaign.recordKey+':session','null');
    campaignRestoreRoute(m);worldCampaign.mission=null;worldCampaign.route=null;if(worldCampaign.routeUi)worldCampaign.routeUi.hidden=true;
  }
  async function campaignRetry(){const mode=worldCampaign.mission?.mode;if(!mode)return false;otGamesLeave();return campaignStart(mode);}
  function campaignMapLocations(){
    return [...Object.values(WORLD_CAMPAIGN_SITES),...['plane','helicopter'].map(campaignAircraftPose)].map(site=>({
      id:'campaign-'+site.id,name:site.label,
      icon:site.id==='hq'?'🏛️':site.id==='airbase'?'🛫':site.id==='plane'?'✈️':site.id==='helicopter'?'🚁':'🧭',
      group:'Aeroporto e serviços',x:site.x,z:site.z,navX:site.navX??site.x,navZ:site.navZ??site.z,
      missionTarget:!!worldCampaign.mission&&worldCampaign.route?.id===site.id,
      description:site.id==='hq'?'Apoio civil da polícia, dos bombeiros e do resgate.':site.id==='airbase'?'Visite os hangares, a pista e o heliponto. Os veículos estacionados podem ser pilotados livremente.':site.id==='plane'||site.id==='helicopter'?'Aproxime-se da aeronave e toque em AÇÃO para embarcar e pilotar. Pouse e pare para sair.':'Centro de visitantes, passeios e orientação sobre os destinos do mundo.',
      actions:['Marcar a rota azul no GPS','Viajar até o destino','Abrir MISSÕES ao chegar']
    }));
  }
  function campaignNavigate(site){
    if(!site)return false;
    worldCampaign.route=site;worldCampaign.time=1;
    // The same GPS follows the actual walking or flying body during a campaign.
    setWaypoint('campaign-'+site.id);
    return true;
  }
  function campaignOpen(){
    if(!running||!worldCampaign.initialized)return;
    const pos=otGames.active?otGames.body:player,history=campaignHistory();
    const cards=Object.values(WORLD_CAMPAIGN_SITES).map(site=>{
      const distance=Math.round(campaignDist(pos,site)),near=distance<site.radius;
      let actions='<button class="btn" data-campaign-nav="'+site.id+'">ROTA NO GPS</button>';
      if(near&&!otGames.active&&site.id==='hq')actions+='<button class="btn primary" data-campaign-start="ground">PATRULHA</button>';
      if(near&&!otGames.active&&site.id==='airbase')actions+='<button class="btn primary" data-campaign-start="helicopter">HELICOPTERO</button><button class="btn primary" data-campaign-start="plane">AVIAO</button>';
      return '<section style="padding:9px;margin:8px 0;border:1px solid #547f83;border-radius:12px"><b>'+site.label+'</b><p>'+distance+' m · '+(near?'no local':'siga a rota')+'</p><div class="modal-actions">'+actions+'</div></section>';
    }).join('');
    const completed=Object.values(history).reduce((a,b)=>a+Math.max(0,Number(b)||0),0);
    const pending=campaignPending();
    openModal('Mundo · destinos e missões',(typeof worldExploreDirectoryHtml==='function'?worldExploreDirectoryHtml():'')+'<p>Viaje até o quartel ou aeroporto para iniciar uma operação. Cumpra o objetivo no norte e volte à base. Os jogos originais continuam disponíveis no console.</p>'+(pending&&!otGames.active?'<button class="btn primary" data-campaign-resume>CONTINUAR OPERAÇÃO · '+otGameModes[pending.mode]+'</button>':'')+cards+(typeof venueDirectoryHtml==='function'?venueDirectoryHtml():'')+'<p>Operações concluídas: '+completed+'</p>',root=>{
      if(typeof venueBindDirectory==='function')venueBindDirectory(root);if(typeof worldExploreBindDirectory==='function')worldExploreBindDirectory(root);
      root.querySelector('[data-campaign-resume]')?.addEventListener('click',campaignResume);
      $$('[data-campaign-nav]',root).forEach(el=>el.onclick=()=>campaignNavigate(WORLD_CAMPAIGN_SITES[el.dataset.campaignNav]));
      $$('[data-campaign-start]',root).forEach(el=>el.onclick=()=>campaignStart(el.dataset.campaignStart));
    });
  }
  async function campaignStart(mode){
    if(OT_CHILD_WORLD){openCivilMissions();return false;}
    const site=campaignHome(mode);
    if(!running||paused||otGames.active||campaignDist(player,site)>site.radius){
      toast('Vá até a base correta e termine outras atividades primeiro.','warn',3000);return false;
    }
    const boarding=WORLD_CAMPAIGN_AIRCRAFT[mode]?campaignAircraftPose(mode):null;
    if(boarding&&campaignDist(player,boarding)>boarding.radius){campaignNavigate(boarding);toast('Aproxime-se da aeronave indicada para embarcar.','info',3300);return false;}
    const previousWaypoint=state.waypoint?{...state.waypoint}:null;
    closeModal();let ok=false;
    try{ok=await otGamesEnter(mode,{armed:false,difficulty:'normal',groundLaunch:mode!=='ground',boarding});}
    catch(e){toast(e?.message||'Não foi possível iniciar.','warn',3000);}
    if(!ok)return false;
    otGames.goal=mode==='ground'?6:8;
    worldCampaign.mission={id:'norte-'+mode,mode,base:site,phase:mode==='ground'?'travel':'depart',recorded:false,runId:Date.now()+'-'+Math.random().toString(36).slice(2),previousWaypoint};
    campaignNavigate(WORLD_CAMPAIGN_SITES.north);worldCampaign.time=1;campaignPersist();
    toast('Operação iniciada. Desloque-se até o Setor Norte.','info',3600);
    return true;
  }
  function campaignCombatDone(){
    const m=worldCampaign.mission,g=otGames;
    if(!m||m.phase!=='combat'||g.state!=='VICTORY')return;
    m.phase='return';g.state='PLAYING';g.armed=false;g.lock=null;
    g.enemies.forEach(e=>otGamesDisposeGroup(e.group));g.enemies=[];
    g.bullets.forEach(b=>otGamesDisposeGroup(b.mesh));g.bullets=[];
    g.effects.forEach(f=>otGamesDisposeGroup(f.mesh));g.effects=[];
    for(const a of ['fire','reload']){const b=g.ui?.querySelector('[data-ot="'+a+'"]');if(b)b.hidden=true;}
    worldCampaign.route=m.base;
    campaignNavigate(m.base);campaignPersist();
    toast('Setor protegido. Volte à base para concluir a operação.','success',3900);
  }
  function campaignComplete(){
    const m=worldCampaign.mission;if(!m||m.recorded)return;
    m.recorded=true;const history=campaignHistory();
    if(history.__lastReceipt!==m.runId){history[m.id]=(Number(history[m.id])||0)+1;history.__lastReceipt=m.runId;safeLocalSet(worldCampaign.recordKey,JSON.stringify(history));otGamesSaveResult(true);}
    safeLocalSet(worldCampaign.recordKey+':session','null');campaignRestoreRoute(m);
    worldCampaign.mission=null;worldCampaign.route=null;worldCampaign.routeUi.hidden=true;
    otGamesLeave();toast('Missão concluída e retorno registrado.','success',4200);
  }
  function updateWorldCampaign(dt){
    if(OT_CHILD_WORLD)worldCampaign.mission=null;
    campaignEnsure();document.body.classList.toggle('campaign-operation-active',!!worldCampaign.mission);if(!worldCampaign.initialized||paused)return;
    const focus=otGames.active?otGames.body:player;
    for(const item of worldCampaign.landmarks)item.root.visible=campaignDist(focus,item.site)<240;
    campaignSyncAircraft();
    const m=worldCampaign.mission,g=otGames;
    if(m){
      if(!g.active){campaignRestoreRoute(m);worldCampaign.mission=null;worldCampaign.route=null;worldCampaign.routeUi.hidden=true;return;}
      if(g.state==='DEFEAT'||g.state==='SPAWN_BLOCKED'){
        worldCampaign.routeUi.hidden=false;
        worldCampaign.routeUi.querySelector('b').textContent='OPERAÇÃO INTERROMPIDA';
        worldCampaign.routeUi.querySelector('small').textContent='Use o menu para sair ou tentar novamente.';
        return;
      }
      if(m.phase==='depart'&&!g.onGround)m.phase='travel';
      if(m.phase==='travel'&&campaignDist(g.body,WORLD_CAMPAIGN_SITES.north)<=WORLD_CAMPAIGN_SITES.north.radius){
        m.phase='combat';g.armed=true;otGamesSpawnWave();worldCampaign.route=null;
        const fire=g.ui?.querySelector('[data-ot="fire"]');if(fire)fire.hidden=false;
        const reload=g.ui?.querySelector('[data-ot="reload"]');if(reload&&m.mode==='ground')reload.hidden=false;
        toast('Setor Norte alcançado: objetivos de combate ativados.','info',3000);
      }
      campaignCombatDone();
      const landed=m.mode==='ground'||g.onGround&&Math.hypot(g.body.vx||0,g.body.vz||0)<1.5&&campaignLandingZone(m.mode,g.body);
      if(m.phase==='return'&&campaignDist(g.body,m.base)<m.base.radius&&landed){campaignComplete();return;}
      if(Date.now()-(worldCampaign.lastCheckpoint||0)>3000){worldCampaign.lastCheckpoint=Date.now();campaignPersist();}
    }
    worldCampaign.time+=dt;if(worldCampaign.time<.2)return;worldCampaign.time=0;
    const route=worldCampaign.route,view=worldCampaign.routeUi;
    if(m?.phase==='combat'){
      view.hidden=false;view.querySelector('b').textContent='SETOR NORTE · '+g.kills+'/'+g.goal+' ALVOS';
      view.querySelector('small').textContent='Proteja o setor e depois retorne à base.';
    }else if(route){
      const distance=Math.round(campaignDist(focus,route));
      const bearing=Math.atan2(route.x-focus.x,route.z-focus.z);
      const heading=g.active?g.body.yaw:Math.PI-cameraYaw;
      const diff=Math.atan2(Math.sin(bearing-heading),Math.cos(bearing-heading));
      const arrow=Math.abs(diff)<.4?'↑':Math.abs(diff)>2.7?'↓':diff>0?'→':'←';
      view.hidden=false;view.querySelector('b').textContent=arrow+' '+route.label+' · '+distance+' m';
      view.querySelector('small').textContent=m?.phase==='depart'?'DECOLE DA BASE · AJUSTE A POTÊNCIA':m?.phase==='return'?(m.mode==='ground'?'RETORNE À BASE':'POUSE NA BASE E PARE PARA CONCLUIR'):m?'SIGA ATÉ O SETOR NORTE':'SIGA O CAMINHO INDICADO';
    }else view.hidden=true;
  }
  window.OTTHI_CAMPAIGN={
    open:campaignOpen,start:campaignStart,resume:campaignResume,board:campaignBoardAircraft,parked:()=>Object.keys(WORLD_CAMPAIGN_AIRCRAFT).map(id=>({mode:WORLD_CAMPAIGN_AIRCRAFT[id].mode||id,...campaignAircraftPose(id)})),cancel:()=>otGamesLeave(),
    navigate:id=>WORLD_CAMPAIGN_SITES[id]?campaignNavigate(WORLD_CAMPAIGN_SITES[id]):false,
    sites:()=>Object.values(WORLD_CAMPAIGN_SITES).map(s=>({...s})),
    diagnostics:()=>({initialized:worldCampaign.initialized,phase:worldCampaign.mission?.phase||'idle',
      active:!!worldCampaign.mission,records:campaignHistory(),checkpoint:!!campaignPending(),route:worldCampaign.route?.id||null,
      landmarks:worldCampaign.landmarks.map(x=>({site:x.site.id,attached:x.root.parent===worldGroup,visible:x.root.visible}))})
  };

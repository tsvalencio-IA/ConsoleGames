/** Discoverable destinations and real, persistent sea craft in the native world. */
// @otthi-module-body
  const worldDestinations={ready:false,marina:null,flakes:null,lastAt:0,airSigns:new Map()};
  const MARINA_DOCK=Object.freeze({minX:-224,maxX:-216,minZ:506,maxZ:549,exitX:-220,touchDistance:5.8});
  const SEA_CRAFT=Object.freeze([
    {id:'sea-azul',label:'Lancha Azul · esportiva',x:-227,z:528,heading:-Math.PI/2,color:0x237db6,maxSpeed:22},
    {id:'sea-familia',label:'Lancha Família · passeio',x:-227,z:542,heading:-Math.PI/2,color:0x348c7c,maxSpeed:17},
    {id:'sea-coral',label:'Lancha Coral · esportiva',x:-213,z:535,heading:Math.PI/2,color:0xbf6549,maxSpeed:20}
  ]);
  function createSeaCraftModel(spec){
    const root=new THREE.Group();root.name='SPEEDBOAT_'+spec.id;
    const white=campaignMaterial(0xe4e6dc,.22),accent=campaignMaterial(spec.color,.32),dark=campaignMaterial(0x203b49,.22),seat=campaignMaterial(0xd7cfb8,.02),metal=campaignMaterial(0xa8bdc0,.7);
    // Continuous V hull, pointed bow and raised gunwales. +Z is forward.
    const stations=[[-2.5,.74,.12,.48],[-2.1,1.08,-.02,.54],[-.9,1.12,-.18,.57],[.6,1.02,-.18,.62],[1.65,.65,-.02,.75],[2.4,.04,.32,.85]];
    const positions=[],indices=[];
    for(const[z,w,keel,top]of stations)for(const[x,y]of[[0,keel],[-w*.79,keel+.19],[-w,top],[w,top],[w*.79,keel+.19]])positions.push(x,y,z);
    for(let i=0;i<stations.length-1;i++)for(let j=0;j<5;j++){if(j===2&&i<3)continue;const a=i*5+j,b=i*5+(j+1)%5,c=(i+1)*5+j,d=(i+1)*5+(j+1)%5;indices.push(a,d,b,a,c,d);}
    for(const e of[0,stations.length-1])for(let j=1;j<4;j++){if(e===0)indices.push(e*5,e*5+j,e*5+j+1);else indices.push(e*5,e*5+j+1,e*5+j);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();const hull=new THREE.Mesh(geo,white);hull.castShadow=true;root.add(hull);
    const rimPoints=side=>stations.map(([z,w,k,y])=>new THREE.Vector3(side*w,y+.025,z));
    for(const side of[-1,1]){root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPoints(side)),32,.052,7,false),accent));const stripe=stations.map(([z,w,k,y])=>new THREE.Vector3(side*(w+.008),y-.18,z));root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stripe),32,.038,6,false),accent));}
    campaignBox(root,dark,0,.16,-.15,1.76,.12,3.5);
    for(const z of[.72,-.65])for(const side of[-1,1]){campaignBox(root,seat,side*.4,.36,z,.66,.14,.61);campaignBox(root,seat,side*.4,.64,z-.25,.66,.45,.13);}
    campaignBox(root,white,0,.46,1.55,1.25,.15,1.1);
    const glass=new THREE.Mesh(new THREE.PlaneGeometry(1.62,.50),new THREE.MeshStandardMaterial({color:0x5a8795,transparent:true,opacity:.58,roughness:.13,metalness:.3,side:THREE.DoubleSide}));glass.position.set(0,.94,1.02);glass.rotation.x=-.30;root.add(glass);
    for(const side of[-1,1]){campaignCylinder(root,metal,side*.8,.89,1.02,.018,.58);campaignBox(root,dark,side*.40,.68,.87,.58,.20,.31);}
    const steering=new THREE.Mesh(new THREE.TorusGeometry(.13,.018,7,20),metal);steering.position.set(.4,.79,.67);steering.rotation.x=-.4;root.add(steering);
    campaignBox(root,accent,0,.35,-2.55,.54,.75,.46);campaignBox(root,dark,0,-.19,-2.55,.14,.48,.17);
    const propeller=new THREE.Mesh(new THREE.BoxGeometry(.50,.08,.05),metal);propeller.position.set(0,-.38,-2.63);propeller.name='sea-propeller';root.add(propeller);
    root.userData.seaPropeller=propeller;root.userData.seats=[{x:.4,y:.28,z:.72},{x:-.4,y:.28,z:.72},{x:.4,y:.28,z:-.65},{x:-.4,y:.28,z:-.65}];
    return root;
  }
  function createMarina(){
    const root=new THREE.Group();root.name='COSTA_VERDE_MARINA';worldGroup.add(root);worldDestinations.marina=root;
    const wood=campaignMaterial(0xa58c68,.02),steel=campaignMaterial(0x537077,.45),white=campaignMaterial(0xe5e7d9);
    campaignBox(root,wood,-220,.38,524,8,.20,50);
    for(let z=501;z<=548;z+=.7)campaignBox(root,steel,-220,.49,z,8,.012,.025);
    for(const x of[-223.5,-216.5])for(const z of[502,515,529,545])campaignCylinder(root,steel,x,.1,z,.15,1.4);
    for(const x of[-223.8,-216.2])for(const z of[501,511,548]){campaignCylinder(root,white,x,1.05,z,.055,1.1);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),new THREE.MeshBasicMaterial({color:0xf5e6b1}));lamp.position.set(x,1.62,z);root.add(lamp);}
    citySign(root,'MARINA · LANCHAS',-220,3,501,8,-1,'#1c525d',.75);
    mergeTrafficStatic(root);
    for(const spec of SEA_CRAFT){
      const group=createSeaCraftModel(spec),saved=state.boats.parked?.[spec.id],bounds=v704WorldBounds();
      const valid=saved&&[saved.x,saved.z,saved.heading].every(Number.isFinite)&&saved.x>bounds.minX+4&&saved.x<bounds.maxX-4&&saved.z<bounds.maxZ-4&&waterAt(saved.x,saved.z)?.ocean;
      const pose=valid?saved:spec,boat={...spec,heading:pose.heading,seaGoing:true,boardRadius:6.2,dock:MARINA_DOCK,group};
      group.position.set(pose.x,.1,pose.z);group.rotation.y=pose.heading;worldGroup.add(group);world.boats.set(spec.id,boat);
      registerInteractable({id:'board-'+spec.id,type:'boat',icon:'🚤',label:'Pilotar '+spec.label,radius:boat.boardRadius,priority:240,getPos:()=>({x:group.position.x,z:group.position.z}),available:()=>!player.boating&&!player.vehicle&&!otGames.active,action:()=>enterBoat(boat)});
    }
    world.navCache?.clear?.();
  }
  function seaNavigationBlocked(x,z,heading){
    const mine={x,z,w:1.08,l:2.68,s:Math.sin(heading),c:Math.cos(heading)},pier={x:-220,z:524,w:4,l:25,s:0,c:1};
    if(trafficBodiesOverlap(mine,pier,.06))return true;
    for(const b of world.boats?.values()||[]){if(b===world.boat||!b.seaGoing)continue;const host=[...remotePresence.values()].find(p=>p.boating&&p.boatId===b.id&&p.boatRole!=='passenger'),pose=host?{x:host.x,z:host.z,heading:host.r}:b.group.position,angle=host?Number(host.r||0):b.heading;
      if(trafficBodiesOverlap(mine,{x:pose.x,z:pose.z,w:1.08,l:2.68,s:Math.sin(angle),c:Math.cos(angle)},.08))return true;
    }return false;
  }
  function styleGhostBoat(ghost,target){
    const group=ghost?.userData.boatVisual;if(!group)return;
    const spec=SEA_CRAFT.find(b=>b.id===target.boatId),key=spec?.id||'lake-boat';if(group.userData.craftKey===key)return;
    group.userData.lakeParts??=group.children.slice();if(group.userData.seaModel){otGamesDisposeGroup(group.userData.seaModel);group.userData.seaModel=null;}
    for(const part of group.userData.lakeParts)part.visible=!spec;
    if(spec){const model=createSeaCraftModel(spec);group.add(model);group.userData.seaModel=model;}
    group.position.y=spec?-.08:-.68;group.userData.craftKey=key;
  }
  const marinaGroundHeight=groundHeightAt;
  groundHeightAt=function(x,z){if(x>=MARINA_DOCK.minX&&x<=MARINA_DOCK.maxX&&z>=499&&z<=549)return .48;return marinaGroundHeight(x,z);};
  const originalFamilyBoatSeat=familyBoatSeatOffset;
  familyBoatSeatOffset=function(i=-1){return world.boat?.seaGoing?world.boat.group.userData.seats[Math.max(0,Math.min(3,i+1))]:originalFamilyBoatSeat(i);};
  function createSnowDestination(){
    const root=new THREE.Group();root.name='SNOW_VISITOR_AREA';worldGroup.add(root);
    const wood=campaignMaterial(0x876749),snow=campaignMaterial(0xecf3f0),stone=campaignMaterial(0x778c8f),glass=campaignMaterial(0x547d90,.3);
    for(const[x,z]of[[-52,184],[46,184],[85,181]]){campaignBox(root,wood,x,1.55,z,7,3.1,5);world.colliders.push({x,z,w:7,d:5,height:3.8,snowCabin:true});const roof=new THREE.Mesh(new THREE.ConeGeometry(5,2.3,4),snow);roof.rotation.y=Math.PI/4;roof.position.set(x,4.15,z);root.add(roof);for(const side of[-1,1])campaignBox(root,glass,x+side*2,1.75,z-2.53,1.3,.95,.07);campaignBox(root,stone,x+1.6,4.1,z+1,.6,2.1,.6);}
    citySign(root,'NEVE · MIRANTE',20,3,183,8,-1,'#315968',.8);
    const snowman=new THREE.Group();snowman.position.set(16,.06,181);root.add(snowman);for(const[y,r]of[[.55,.55],[1.28,.40],[1.85,.29]]){const ball=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),snow);ball.position.y=y;snowman.add(ball);}campaignBox(snowman,wood,0,2.14,0,.45,.15,.43);
    mergeTrafficStatic(root);worldDestinations.snowRoot=root;
    const positions=new Float32Array(180*3);for(let i=0;i<180;i++){positions[i*3]=(Math.sin(i*93.17)*.5+.5)*36-18;positions[i*3+1]=(i*.173%1)*14;positions[i*3+2]=(Math.cos(i*67.21)*.5+.5)*36-18;}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(16,16,0,16,16,16);g.addColorStop(0,'#ffffffff');g.addColorStop(.35,'#ffffffe0');g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(0,0,32,32);
    const flakes=new THREE.Points(geometry,new THREE.PointsMaterial({color:0xffffff,size:.15,map:new THREE.CanvasTexture(canvas),transparent:true,opacity:.82,depthWrite:false}));flakes.name='LOCAL_SNOWFALL';flakes.frustumCulled=false;worldGroup.add(flakes);worldDestinations.flakes=flakes;
    registerInteractable({id:'snow-lookout',type:'viewpoint',icon:'❄️',label:'Mirante da Neve',x:20,z:180,radius:3,priority:120,action:()=>toast('Trecho de neve da OTTOVIAS. A pista continua liberada para viajar.','good',2600)});
  }
  function worldExploreLocations(){return[
    {id:'marina-costa',name:'Marina · embarque nas lanchas',label:'Marina · embarque nas lanchas',icon:'🚤',group:'Praias e navegação',x:-220,z:502,navX:-220,navZ:502,description:'Caminhe pelo píer, aproxime-se de uma lancha e toque em AÇÃO para pilotar. Pare ao lado do píer para desembarcar.',actions:['Seguir até a marina','Embarcar pelo botão AÇÃO','Pilotar, retornar e estacionar']},
    {id:'snow-lookout',name:'Neve · mirante e chalés',label:'Neve · mirante e chalés',icon:'❄️',group:'Natureza',x:20,z:180,navX:20,navZ:180,description:'Trecho de neve da OTTOVIAS, com acesso pela Ligação Norte. Neve no solo, pinheiros, chalés e precipitação local.',actions:['Seguir o GPS pela Ligação Norte','Chegar ao mirante']},
    ...Array.from(world.boats?.values()||[]).filter(b=>b.seaGoing).map(b=>({id:'marina-'+b.id,name:b.label,label:b.label,icon:'🚤',group:'Embarcações',x:b.group.position.x,z:b.group.position.z,navX:-220,navZ:clamp(b.group.position.z,513,548),description:'Lancha utilizável. O ponto de embarque fica no píer da marina. A embarcação permanece onde você a estacionar.',actions:['Caminhar pelo píer','Toque em AÇÃO ao lado da lancha']}))
  ];}
  function worldExploreDirectoryHtml(){
    const destinations=[
      ['airport-terminal','✈️','Aeroporto OT · terminal e helipontos','Aviões de passeio e carga; helicópteros de passeio, resgate e OTTOVIAS.'],
      ['mountain-balloon','🎈','Balão nas montanhas','Embarque na cesta, suba, explore a serra e pouse para sair.'],
      ['campaign-plane','✈️','Avião · embarcar e pilotar','Base Aérea. Aproxime-se da aeronave e toque em AÇÃO.'],
      ['campaign-helicopter','🚁','Helicóptero · embarcar e pilotar','Pouse, pare e use SAIR DA AERONAVE. Ela fica estacionada.'],
      ['marina-costa','🚤','Lanchas · Marina da Costa Verde','Três lanchas no píer da praia. Pilotagem livre no mar.'],
      ['coast-view','🏖️','Praia da Costa Verde','Orla, ondas, quiosques e acesso à marina.'],
      ['snow-lookout','❄️','Neve · mirante e chalés','Siga a OTTOVIAS pela Ligação Norte.']
    ];
    return '<h3>Explore o mundo</h3><div class="choice-grid world-explore-directory">'+destinations.map(([id,icon,title,description])=>'<button class="choice" data-explore-nav="'+id+'"><b>'+icon+' '+title+'</b><span>'+description+'</span><small>TRAÇAR ROTA NO GPS</small></button>').join('')+'<button class="choice" data-explore-war><b>🎯 WAR Combate · jogar aqui</b><span>Controle de toque ou câmera frontal com corpo + mãos / brinquedo.</span><small>ABRIR CONTROLES E DIFICULDADE</small></button></div><h3>Operações e missões</h3>';
  }
  function worldExploreBindDirectory(root){
    root.querySelectorAll('[data-explore-nav]').forEach(button=>button.onclick=()=>{const id=button.dataset.exploreNav;if(!currentMapLocations().some(x=>x.id===id)){toast('O destino está carregando. Tente novamente em instantes.','warn',2200);return;}setWaypoint(id);const loc=currentMapLocations().find(x=>x.id===id);worldCampaign.route={...loc,label:loc.name};worldCampaign.time=1;closeModal();toast('GPS: '+loc.name+'. Siga a rota até o local.','good',3000);});
    root.querySelector('[data-explore-war]')?.addEventListener('click',()=>{closeModal();otGamesChoose();document.querySelector('[data-ot-mode="ground"]')?.focus();});
  }
  function updateWorldDestinations(){
    if(!worldDestinations.ready){if(!cityCoast.ready||!world.boats)return;createMarina();createSnowDestination();worldDestinations.ready=true;}
    const focus=otGamesFocus(),now=performance.now(),dt=Math.min(.15,(now-worldDestinations.lastAt)/1000);worldDestinations.lastAt=now;
    const snow=focus.z>147&&focus.z<227&&focus.x>-160&&focus.x<180;worldDestinations.flakes.visible=snow;
    if(snow){const a=worldDestinations.flakes.geometry.attributes.position;worldDestinations.flakes.position.set(focus.x,Math.max(0,groundHeightAt(focus.x,focus.z)),focus.z);for(let i=0;i<a.count;i++){let y=a.getY(i)-dt*(.7+i%5*.11);if(y<0)y+=14;a.setY(i,y);}a.needsUpdate=true;}
    for(const boat of world.boats.values())if(boat.seaGoing){const remote=[...remotePresence.values()].some(p=>p.boating&&p.boatId===boat.id&&p.boatRole!=='passenger'),local=player.boating&&state.boats.activeBoatId===boat.id;boat.group.visible=!remote&&Math.hypot(focus.x-boat.group.position.x,focus.z-boat.group.position.z)<260;if(!local&&!remote){boat.group.position.y=.10+Math.sin(now*.0014+boat.group.position.x)*.025;boat.group.rotation.z=Math.sin(now*.0012+boat.group.position.z)*.008;}else if(local){boat.group.rotation.z=player.boat.steerVisual*clamp(Math.abs(player.boat.speed)/22,0,1)*.11;boat.group.userData.seaPropeller.rotation.z+=dt*player.boat.speed*8;}}
    const button=document.getElementById('worldCampaignBtn');if(button&&button.textContent!=='MUNDO / GPS'){button.textContent='MUNDO / GPS';button.setAttribute('aria-label','Abrir destinos, aviões, helicóptero, lanchas, praia, neve e WAR Combate');}
    if(now-Number(worldDestinations.signAt||0)>1000){worldDestinations.signAt=now;for(const p of window.OTTHI_CAMPAIGN.parked()){let sign=worldDestinations.airSigns.get(p.mode);if(!sign){const root=new THREE.Group();root.name='BOARDING_SIGN_'+p.mode;worldGroup.add(root);citySign(root,p.mode==='plane'?'AVIÃO · EMBARQUE':'HELICÓPTERO · EMBARQUE',0,3.1,0,6,-1,'#245060',.65);worldDestinations.airSigns.set(p.mode,root);sign=root;}sign.position.set(p.x,groundHeightAt(p.x,p.z),p.z+5.7);sign.visible=!otGames.active&&Math.hypot(focus.x-p.x,focus.z-p.z)<100;}}
  }
  const previousDestinationExpansion=updateWorldExpansion;updateWorldExpansion=function(){previousDestinationExpansion();updateWorldDestinations();};
  const previousDestinationLocations=expansionMapLocations;expansionMapLocations=function(){return[...previousDestinationLocations(),...worldExploreLocations()];};
  window.OTTHI_DESTINATIONS={open:campaignOpen,diagnostics:()=>({ready:worldDestinations.ready,locations:worldExploreLocations(),aircraft:window.OTTHI_CAMPAIGN.parked(),marina:{...MARINA_DOCK},snow:{groundVisible:OTTOVIAS_RUNTIME.biomeGroups.find(b=>b.id==='snow')?.group.children.some(m=>m.userData.ottoviasBiome&&m.position.y>.025)||false,falling:!!worldDestinations.flakes?.visible},boats:[...world.boats?.values()||[]].map(b=>({id:b.id,label:b.label||'Barco de pesca',seaGoing:!!b.seaGoing,x:b.group.position.x,z:b.group.position.z,heading:b.heading,maxSpeed:b.maxSpeed||8.8,visible:b.group.visible})),activeBoat:player.boating?state.boats.activeBoatId:null})};

/** Physical civil airport and mountain balloon; all craft use the shared flight/parking system. */
// @otthi-module-body
 const worldAirport={ready:false,root:null,balloonSite:null};
 function createMountainBalloon(){
  const root=new THREE.Group();root.name='MOUNTAIN_BALLOON';
  const wicker=campaignMaterial(0xa97a48,.02),rim=campaignMaterial(0x684a30,.03),steel=campaignMaterial(0x68737a,.55);
  // Open basket, rather than a solid box that hides its passengers.
  campaignBox(root,wicker,0,-.87,0,2.3,.22,1.8);
  for(const side of[-1,1]){campaignBox(root,wicker,side*1.08,-.43,0,.14,.78,1.8);campaignBox(root,rim,side*1.08,0,0,.18,.12,1.86);campaignBox(root,wicker,0,-.43,side*.83,2.3,.78,.14);campaignBox(root,rim,0,0,side*.83,2.3,.12,.18);}
  const link=(a,b,r,mat)=>{const dir=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,dir.length(),7),mat);m.position.fromArray(a).addScaledVector(dir,.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());root.add(m);};
  for(const x of[-.91,.91])for(const z of[-.69,.69]){link([x,0,z],[x,1.65,z],.035,steel);link([x,1.65,z],[x*1.8,3,z*1.8],.018,rim);}
  campaignBox(root,steel,0,1.62,0,1.9,.10,1.4);campaignCylinder(root,steel,0,1.76,0,.24,.25);
  const flame=new THREE.Mesh(new THREE.ConeGeometry(.17,.86,10),new THREE.MeshBasicMaterial({color:0xffbb4c,transparent:true,opacity:.9}));flame.position.y=2.18;flame.name='balloon-flame';root.add(flame);root.userData.flame=flame;
  const profile=[[.72,2.55],[1.15,3.10],[2.1,4],[3.05,5.2],[3.65,6.7],[3.70,7.7],[3.22,9.1],[2.22,10.15],[.82,10.70],[0,10.85]].map(([r,y])=>new THREE.Vector2(r,y)),segments=48,geometry=new THREE.LatheGeometry(profile,segments),colors=[];
  const p=geometry.getAttribute('position'),palette=[0xdb6a3c,0xeec66b,0x327f87,0x234f68];for(let i=0;i<p.count;i++){const a=(Math.atan2(p.getX(i),p.getZ(i))+Math.PI*2)%(Math.PI*2),c=new THREE.Color(palette[Math.floor(a/(Math.PI*2)*12)%4]);colors.push(c.r,c.g,c.b);}geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();const envelope=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.83,side:THREE.DoubleSide}));envelope.castShadow=true;root.add(envelope);
  for(let i=0;i<12;i++){const a=i*Math.PI/6,curve=new THREE.CatmullRomCurve3(profile.filter(v=>v.x>.1).map(v=>new THREE.Vector3(Math.sin(a)*(v.x+.012),v.y,Math.cos(a)*(v.x+.012))));root.add(new THREE.Mesh(new THREE.TubeGeometry(curve,24,.012,4,false),rim));}
  root.userData.civilian=true;root.userData.model='balloon';mergeTrafficStatic(root);return root;
 }
 function createCivilAirport(){
  const root=new THREE.Group();root.name='OT_CIVIL_AIRPORT';worldGroup.add(root);worldAirport.root=root;
  const pavement=campaignMaterial(0x5d6870,.03,'road'),concrete=campaignMaterial(0xc4c4b5,.03,'concrete'),white=campaignMaterial(0xf3e8cb),steel=campaignMaterial(0x2e4c5b,.35),glass=campaignMaterial(0x7faebb,.35,'city-glass'),accent=campaignMaterial(0x356b75);
  const box=(m,x,y,z,w,h,d)=>campaignBox(root,m,x,y,z,w,h,d),wall=(x,z,w,d,h,m=concrete)=>{box(m,x,h/2,z,w,h,d);world.colliders.push({x,z,w,d,height:h,airport:true});};
  box(pavement,91,.035,-191,120,.07,58);box(steel,91,.08,-216,130,.06,12);
  for(const z of[-221.7,-210.3])box(white,91,.12,z,129,.02,.14);for(let x=31;x<151;x+=10)box(white,x,.12,-216,5,.02,.24);
  for(const x of[31,150])for(let z=-220;z<-212;z+=1.2)box(white,x,.12,z,5,.02,.5);
  // Taxiway joins the apron and runway; the public entrance stays below the highway.
  box(pavement,75,.08,-197,9,.07,30);box(white,75,.13,-197,.12,.02,30);
  wall(90,-192,25,.4,4.6);wall(77.6,-185,.4,14,4.6);wall(102.4,-185,.4,14,4.6);
  for(const x of[81,99])wall(x,-178,7,.28,3.9,glass);box(steel,90,4.72,-185,26,.35,15);box(accent,90,4.05,-177.7,25,.8,.3);
  box(concrete,90,.12,-184,25,.18,14);box(steel,90,3.35,-175.7,10,.18,4);
  for(const x of[86,94])wall(x,-174,.15,.15,3.3,steel);
  campaignSign(root,'AEROPORTO OT','TERMINAL · EMBARQUE · HELIPONTOS',6.1).position.set(90,6.1,-177.45);
  box(steel,90,1.05,-189.8,10,.9,.8);for(const x of[83,87,93,97]){box(accent,x,.6,-183,2,.18,.75);box(accent,x,.92,-183.35,2,.6,.12);}
  citySign(root,'EMBARQUE',90,2.4,-188.9,6,1,'#285b68',.65);
  for(const [id,x]of[['heli-tour',75],['heli-ottovias',96],['heli-rescue',117]]){
   const z=-164;box(pavement,x,.14,z,13,.06,13);const ring=new THREE.Mesh(new THREE.RingGeometry(4.6,4.82,48),white);ring.rotation.x=-Math.PI/2;ring.position.set(x,.18,z);root.add(ring);for(const dx of[-1,1])box(white,x+dx,.20,z,.26,.02,3.5);box(white,x,.20,z,2,.02,.26);
   citySign(root,WORLD_CAMPAIGN_AIRCRAFT[id].label,x,1.65,-157.2,5,-1,'#234958',.47);
  }
  for(const [x1,z1,x2,z2,w]of[[27,-159,89,-156,2.6],[89,-156,89,-174,2.6],[62,-156,128,-156,2.1],[89,-174,89,-187,2.2]])airportWalkway(root,x1,z1,x2,z2,w,concrete);
  campaignBatch(root);registerInteractable({id:'airport-terminal',type:'airport',icon:'✈️',label:'Terminal · escolher embarque',x:90,z:-175,radius:4,priority:175,available:()=>!otGames.active&&!player.vehicle,action:openAirportDepartures});
  // Staff and waiting travellers have physical positions, gestures and paths.
  for(const [id,name,x,z,action]of[['airport-agent','Camila',90,-188.5,'serve'],['airport-traveller','Rafael',83,-182,'sit']]){
   addResident(id,name,[{x,z,action,duration:25,seat:action==='sit'?.55:undefined,yaw:0},{x:x+2,z:z+1,action:'look',duration:8}],id==='airport-agent'?0x337c87:0x95654f);
  }
 }
 function airportWalkway(root,x1,z1,x2,z2,width,material){const length=Math.hypot(x2-x1,z2-z1),m=campaignBox(root,material,(x1+x2)/2,.17,(z1+z2)/2,width,.12,length);m.rotation.y=Math.atan2(x2-x1,z2-z1);}
 function openAirportDepartures(){
  const fleet=Object.values(WORLD_CAMPAIGN_AIRCRAFT).filter(p=>p.mode!=='balloon');openModal('Aeroporto OT · embarque',`<p>Escolha uma aeronave para localizar o embarque. Caminhe até ela e toque em AÇÃO. A família selecionada embarca junto; amigos online usam os lugares livres.</p><div class="choice-grid">${fleet.map(p=>`<button class="choice" data-airport-craft="${p.id}"><b>${p.mode==='plane'?'✈️':'🚁'} ${escapeHtml(p.label)}</b><span>${p.model==='cargo'?'Avião de carga':p.mode==='plane'?'Avião de passeio / voo livre':'Helicóptero · manche e coletivo'}</span><small>LOCALIZAR EMBARQUE</small></button>`).join('')}</div>`,root=>root.querySelectorAll('[data-airport-craft]').forEach(b=>b.onclick=()=>setWaypoint('campaign-'+b.dataset.airportCraft)));
 }
 function createBalloonLaunch(){
  const root=new THREE.Group();root.name='MOUNTAIN_BALLOON_LAUNCH';worldGroup.add(root);worldAirport.balloonSite=root;const stone=campaignMaterial(0xc0bca7),wood=campaignMaterial(0x8a6547);
  const pad=new THREE.Mesh(new THREE.CylinderGeometry(5.8,6,.10,32),stone);pad.position.set(-66,.48,89);root.add(pad);airportWalkway(root,-62,84,-59,89,2.2,stone);airportWalkway(root,-59,89,-61,89,2.2,stone);
  for(const[x,z]of[[-71,85],[-71,93]]){campaignBox(root,wood,x,.72,z,2,.15,.65);campaignBox(root,wood,x,1,z+.28,2,.6,.10);}
  citySign(root,'BALÃO · MONTANHAS',-60,2.8,85,7,-1,'#3e655b',.65);campaignBatch(root);
  registerInteractable({id:'mountain-balloon-info',type:'airport',icon:'🎈',label:'Passeio de balão nas montanhas',x:-60,z:87,radius:2.5,priority:130,action:()=>{setWaypoint('mountain-balloon');toast('Aproxime-se da cesta. Use AÇÃO para embarcar; aquecer sobe, reduzir desce. Pouse e pare para sair.','info',5000);}});
 }
 function airportMapLocations(){return[
  {id:'airport-terminal',name:'Aeroporto OT · terminal de embarque',label:'Aeroporto OT',x:90,z:-175,navX:90,navZ:-175,icon:'✈️',group:'Aeroporto',description:'Terminal com aviões e vários helicópteros. Chegue pelo acesso da Base Aérea, escolha o embarque e caminhe até a aeronave.',actions:['Abrir painel do terminal','Localizar aeronave','Embarcar pelo botão AÇÃO']},
  {id:'mountain-balloon',name:'Balão · montanhas e trilhas',label:'Balão nas montanhas',x:campaignAircraftPose('balloon').x,z:campaignAircraftPose('balloon').z,navX:campaignAircraftPose('balloon').x+4,navZ:campaignAircraftPose('balloon').z,icon:'🎈',group:'Natureza',description:'Balão pilotável com cesta para a família. Controle o aquecimento para subir ou descer e use o manche para deslocamento suave. Pouse em terreno livre para desembarcar.',actions:['Seguir até o ponto de embarque','Ação junto à cesta','Subir, explorar, pousar e sair']},
  ...Object.values(WORLD_CAMPAIGN_AIRCRAFT).filter(p=>!['plane','helicopter','balloon'].includes(p.id)).map(p=>{const pose=campaignAircraftPose(p.id);return{id:'campaign-'+p.id,name:p.label,label:p.label,x:pose.x,z:pose.z,navX:pose.x,navZ:pose.z+4,icon:p.mode==='plane'?'✈️':'🚁',group:'Aeronaves',description:'Aeronave utilizável. Aproxime-se, embarque com AÇÃO e pouse para sair. Cada aeronave conserva sua própria posição ao estacionar.',actions:['Localizar embarque','Pilotar e pousar','Sair e embarcar novamente']};})
 ];}
 const airportOldExplore=worldExploreLocations;worldExploreLocations=function(){return[...airportOldExplore(),...airportMapLocations()];};
 const airportOldExpansion=updateWorldExpansion;updateWorldExpansion=function(){airportOldExpansion();if(!worldAirport.ready&&cityCoast.ready&&worldResidents.ready){createCivilAirport();createBalloonLaunch();worldAirport.ready=true;world.navCache?.clear?.();}if(worldAirport.ready){const p=otGamesFocus();worldAirport.root.visible=Math.hypot(p.x-90,p.z+186)<320;worldAirport.balloonSite.visible=Math.hypot(p.x+66,p.z-89)<230;}};
 window.OT_WORLD_AIRPORT={open:openAirportDepartures,diagnostics:()=>({ready:worldAirport.ready,terminal:{x:90,z:-175},balloonLaunch:{x:-66,z:89},fleet:Object.values(WORLD_CAMPAIGN_AIRCRAFT).map(spec=>({...campaignAircraftPose(spec.id),mode:spec.mode||spec.id,model:spec.model||spec.id,visible:!!worldCampaign.aircraft?.getObjectByName(spec.id)?.visible})),activeId:otGames.active?otGames.aircraftId||otGames.mode:null})};

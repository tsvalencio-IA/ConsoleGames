/** More usable homes, using the existing inventory, needs and avatar systems. */
// @otthi-module-body
  const neighborhoodHome={houses:new Map(),seat:null};
  const NEIGHBORHOOD_HOME_ACTIONS=Object.freeze([
    ['bed','Dormir','Recupera energia e salva'],['sofa','Descansar no sofá','Aumenta diversão'],['tv','Assistir TV','Aumenta diversão'],['fridge','Abrir geladeira','Comer usando seu estoque'],['stove','Cozinhar','Prepara uma refeição com 1 comida'],['sink','Beber água','Cuida da higiene'],['shower','Tomar banho','Recupera higiene'],['chest','Abrir baú','Guardar e retirar itens'],['wardrobe','Trocar roupa','Personalizar o personagem']
  ]);
  function addNeighborhoodHomeInterior(house){
    const objects={},g=new THREE.Group();g.name='HOME_DETAILS_'+house.id;worldGroup.add(g);house.interiorObjects.push(g);
    const add=(type,x,z,color,label,rotation=0)=>{const item=createFurniture(house,type,x,z,color,label);item.group.rotation.y=rotation;objects[type]=item;return item;};
    add('bed',-2.7,-2.4,0,'Dormir');add('sofa',.75,-2.45,0x507d89,'Sentar no sofá');add('tv',3.35,-1.3,0,'Assistir televisão',-Math.PI/2);
    add('fridge',-3.55,1.85,0,'Abrir geladeira',Math.PI/2);add('stove',-3.55,.6,0,'Cozinhar',Math.PI/2);add('sink',-3.55,-.75,0,'Beber água',Math.PI/2);
    add('shower',3.35,2.05,0,'Tomar banho');add('wardrobe',3.4,.5,0,'Trocar roupa',-Math.PI/2);add('chest',-.65,-.10,0,'Abrir baú');add('table',-1,1.55,0,'Mesa de refeições');add('plant',1.9,2.55,0,'Planta da casa');
    house.entryX=house.x+.8;house.entryZ=house.z+1.6;
    const dims={bed:[2.25,1.25],sofa:[2.55,.95],tv:[.62,1.75],fridge:[.82,.94],stove:[.86,1.12],sink:[.78,1.25],shower:[1.15,1.15],wardrobe:[.68,1.55],chest:[1.25,.82],table:[1.6,1.05]};
    for(const[type,item]of Object.entries(objects)){const d=dims[type];if(d)registerCollider(item.x,item.z,d[0],d[1],{homeFurniture:house.id,furniture:type,height:type==='bed'?.8:1.4});}
    const points={bed:[-1.08,-2.1],sofa:[.75,-1.45],tv:[2.3,-1.3],fridge:[-2.5,1.85],stove:[-2.5,.6],sink:[-2.5,-.75],shower:[2.2,2.05],wardrobe:[2.25,.5],chest:[.55,-.10]};
    for(const[type,label]of NEIGHBORHOOD_HOME_ACTIONS){const p=points[type];registerInteractable({id:type+'-'+house.id,type:'activity',activity:type,icon:activityIcon(type),label,x:house.x+p[0],z:house.z+p[1],radius:1.05,priority:150,houseId:house.id,action:()=>useActivity(type,house)});}
    const box=(w,h,d,c,x,y,z)=>premiumBox(w,h,d,c,house.x+x,y,house.z+z,g);
    box(3.6,.025,1.5,0xb1a28b,-2.4,.19,-2.4);box(3.4,.025,1.8,0x8caeb0,.75,.19,-2.05);box(2.4,.025,2.3,0xc4aa82,-1,.19,1.55);box(1.6,.025,1.6,0xc9dede,3.15,.19,2.05);
    box(.07,.7,4.5,0x8cb5af,-4.05,1.4,.65);for(let i=0;i<8;i++)box(.08,.018,4.5,0xdce8de,-4.0,1.10+i*.09,.65);
    box(.12,.70,1.8,0xe5e5da,2.6,.5,2.45);box(.12,.07,1.85,0x677e82,2.6,.87,2.45);
    for(const x of[-.05,1.5])box(.45,.42,.19,0xe4bf8c,x,1.08,-2.67);
    box(1.0,.05,.72,0xeee5d2,-1,1.02,1.55);box(.26,.18,.26,0x39816b,-1,1.13,1.55);
    for(const[x,z]of[[-1.3,-2.9],[2.1,-2.9]]){box(.12,1.3,.12,0x8c9da0,x,.85,z);const shade=new THREE.Mesh(new THREE.CylinderGeometry(.24,.34,.35,12),renderMat(0xffe5b0,{emissive:0x5b3715,emissiveIntensity:.22}));shade.position.set(house.x+x,1.65,house.z+z);g.add(shade);}
    const picture=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.85),new THREE.MeshStandardMaterial({map:signTexture('LAR · FAMÍLIA OT','#294a62','#ead9b4'),roughness:.75}));picture.position.set(house.x+.75,2.1,house.z-3.12);g.add(picture);
    const glow=addGlow(house.x,2.25,house.z,0xffd09b,5);house.interiorObjects.push(glow);
    registerInteractable({id:'home-actions-'+house.id,type:'activity',icon:'🏠',label:'Ações da casa',x:house.x+.8,z:house.z+1.6,radius:1.1,priority:175,houseId:house.id,action:()=>openNeighborhoodHome(house)});
    box(.48,.09,.52,0x8d795b,.12,.48,1.55);box(.07,.55,.52,0x8d795b,.38,.76,1.55);for(const dx of[-.16,.16])for(const dz of[-.18,.18])box(.05,.43,.05,0x5b625d,.12+dx,.25,1.55+dz);
    neighborhoodHome.houses.set(house.id,{house,objects,points});
  }
  // Track ownership for a true room cutaway. Merely clipping bounds leaves
  // slices of parked cars or nearby billboards protruding into the living room.
  const homeOriginalCreateHouse=createHouse;
  createHouse=function(...args){const before=new Set(worldGroup.children),house=homeOriginalCreateHouse(...args);house.renderObjects=new Set(worldGroup.children.filter(o=>!before.has(o)));return house;};
  const homeOriginalAddInterior=addHouseInterior;
  addHouseInterior=function(house,...args){const before=new Set(worldGroup.children),result=homeOriginalAddInterior(house,...args);house.renderObjects??=new Set();for(const o of worldGroup.children)if(!before.has(o))house.renderObjects.add(o);return result;};
  function updateHouseInteriorVisibility(){
    for(const house of world.houses||[]){const show=currentHouse===house||house.publicBuilding&&Math.hypot(player.x-house.x,player.z-house.z)<28;for(const item of house.interiorObjects||[]){if(item.isLight)item.visible=show&&visualQualityProfile(qualityTier()).glows;else item.visible=show;}}
  }
  const homeOriginalLOD=updateVisualLOD;updateVisualLOD=function(...args){homeOriginalLOD(...args);updateHouseInteriorVisibility();};
  function prepareHomeRender(){
    updateHouseInteriorVisibility();const h=currentHouse;if(!h||cameraMode!=='interior'||!h.renderObjects)return null;const keep=new Set(h.renderObjects),hidden=[];
    if(characterActivities.visual?.host)keep.add(characterActivities.visual.host);if(neighborhoodHome.seat?.host)keep.add(neighborhoodHome.seat.host);keep.add(playerGroup);if(contactShadow)keep.add(contactShadow);
    for(const a of Object.values(familyWorld.actors||{}))if(Math.abs(a.x-h.x)<h.w/2&&Math.abs(a.z-h.z)<h.d/2){keep.add(a.group);if(a.shadow)keep.add(a.shadow);if(a.label)keep.add(a.label);}
    for(const o of worldGroup.children)if(o.visible&&!keep.has(o)){hidden.push(o);o.visible=false;}
    return()=>{for(const o of hidden)o.visible=true;};
  }
  function openNeighborhoodHome(house){
    if(currentHouse!==house)return;
    openModal(house.name||'Minha casa',`<div class="resource-summary"><span>Energia ${Math.round(state.needs.energy)}%</span><span>Fome ${Math.round(state.needs.hunger)}%</span><span>Higiene ${Math.round(state.needs.hygiene)}%</span><span>Diversão ${Math.round(state.needs.fun)}%</span></div><div class="choice-grid">${NEIGHBORHOOD_HOME_ACTIONS.map(([id,title,description])=>`<button class="choice" data-home-action="${id}"><b>${activityIcon(id)} ${title}</b><small>${description}</small></button>`).join('')}</div><div class="modal-actions"><button class="btn" data-home-garage>Minha Garagem</button><button class="btn primary" data-home-console>Jogos do console</button><button class="btn" data-home-leave>Sair de casa</button></div>`,root=>{
      $$('[data-home-action]',root).forEach(b=>b.onclick=()=>{if(currentHouse!==house)return;const data=neighborhoodHome.houses.get(house.id),point=data?.points[b.dataset.homeAction];closeModal();useActivity(b.dataset.homeAction,house);});$('[data-home-garage]',root).onclick=openPlayerGarage;$('[data-home-console]',root).onclick=()=>window.OTTHI_NAVIGATION?.toConsole?.();$('[data-home-leave]',root).onclick=()=>{closeModal();exitHouse();};
    });
  }
  function clearHomeSeat(){const r=neighborhoodHome.seat;if(!r)return;disposeGhostAvatar(r.host.userData.avatar);r.host.parent?.remove(r.host);neighborhoodHome.seat=null;player.sitUntil=0;}
  const neighborhoodOriginalActivity=useActivity;
  useActivity=function(type,house){
    clearHomeSeat();const result=neighborhoodOriginalActivity(type,house);
    const data=neighborhoodHome.houses.get(house?.id);if(!data||currentHouse!==house||!['sofa','tv'].includes(type))return result;
    const descriptor=multiplayerAvatarDescriptor(),host=new THREE.Group(),body=new THREE.Group();host.name='OTTHI_HOME_SEATED_AVATAR';host.userData.avatar=body;host.add(body);worldGroup.add(host);buildRemoteAvatarVisual(host,descriptor);
    // The furniture and the approved family rigs use different world scales.
    // Keep family members at their normal walking size, pelvis on the cushion.
    const scale=clamp(1.65/neighborhoodAvatarHeight(body),.3,1.3);body.scale.setScalar(scale);host.position.set(data.objects.sofa.x,.81,data.objects.sofa.z+.08);body.position.y=-riderHipHeight(body,host)*scale;
    neighborhoodHome.seat={host,house,until:performance.now()+30000,x:player.x,z:player.z,signature:multiplayerAvatarSignature(descriptor)};player.sitUntil=performance.now()+30000;return result;
  };
  function updateNeighborhoodHomeSeat(){
    const r=neighborhoodHome.seat;if(!r)return;
    if(currentHouse!==r.house||performance.now()>r.until||Math.hypot(player.x-r.x,player.z-r.z)>.16||!player.grounded||player.vehicle||multiplayerAvatarSignature(multiplayerAvatarDescriptor())!==r.signature){clearHomeSeat();return;}
    const family=r.host.userData.familyAvatar,limbs=r.host.userData.limbs||{};if(family)familyAnimateAvatar(family,limbs,{sitting:true,time:animTime});else{for(const name of['leftLeg','rightLeg'])if(limbs[name])limbs[name].rotation.x=-Math.PI/2;for(const name of['leftArm','rightArm'])if(limbs[name])limbs[name].rotation.x=-.35;}
    playerModel.visible=false;if(avatarLayer)avatarLayer.visible=false;
  }
  const neighborhoodOriginalPlayableVisuals=updateFamilyPlayableVisuals;
  updateFamilyPlayableVisuals=function(){neighborhoodOriginalPlayableVisuals();updateNeighborhoodHomeSeat();};
  const neighborhoodOriginalExitHouse=exitHouse;
  exitHouse=function(){clearHomeSeat();return neighborhoodOriginalExitHouse();};
  window.OTTHI_HOME_LIFE={diagnostics:()=>({houses:[...neighborhoodHome.houses.values()].map(d=>({id:d.house.id,x:d.house.x,z:d.house.z,entry:{x:d.house.entryX,z:d.house.entryZ},actions:Object.entries(d.points).map(([type,p])=>({type,x:d.house.x+p[0],z:d.house.z+p[1]})),furniture:Object.entries(d.objects).map(([type,o])=>({type,x:o.x,z:o.z,rotation:o.group.rotation.y}))})),current:currentHouse?.id||'',needs:{...state.needs},inventory:{food:state.inventory.food,water:state.inventory.water},seated:!!neighborhoodHome.seat,seatVisible:!!neighborhoodHome.seat?.host.visible})};

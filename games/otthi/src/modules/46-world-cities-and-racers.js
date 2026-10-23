/** Expanded cities share native roads, traffic, physics, vehicles, saves and map. */
// @otthi-module-body
  const worldExpansion={ready:false,groups:[],assets:{},loading:false,cars:[],roads:[],lastLod:0};
  function expansionMapLocations(){return [...Object.values(WORLD_LAYOUT_V704.cities).map(c=>({id:'city-'+c.id,name:c.label,icon:'🏙️',group:'Cidades',x:c.x,z:c.z,navX:c.x,navZ:c.z,description:'Cidade ligada à vila pelas estradas OTTOVIAS. Ruas, moradores e veículos utilizáveis.'})),...Object.values(WORLD_LAYOUT_V704.circuits).map(c=>({id:'circuit-'+c.id,name:c.label,icon:'🏁',group:'Autódromos',x:c.x,z:c.z,navX:c.navX,navZ:c.navZ,missionTarget:true,description:'Corrida de kart em três voltas. Escolha dificuldade e direção assistida na entrada.'}))];}
  function worldRacerAttach(group,color=0xe5484d,type='racer'){
    const template=worldExpansion.assets[type];if(!template||!group)return false;
    const model=template.clone(true);model.name='OT_GLB_'+type.toUpperCase();
    model.traverse(o=>{if(o.isMesh){o.castShadow=qualityTier()==='high';o.receiveShadow=true;if(o.name==='paint'){o.material=o.material.clone();o.material.color.set(color);}}});
    group.children.slice().forEach(o=>{group.remove(o);if(!group.userData.racerAsset)o.traverse(m=>m.geometry?.dispose());else o.traverse(m=>{if(m.name==='paint')m.material?.dispose();});});group.scale.set(1,1,1);group.add(model);group.userData.racerAsset=type;group.userData.wheels=model.children.filter(o=>o.name.startsWith('wheel-'));group.userData.frontWheels=group.userData.wheels.slice(0,2);group.userData.serviceLayer=null;
    return true;
  }
  async function worldRacerLoad(){
    if(worldExpansion.loading||worldExpansion.assets.racer)return;worldExpansion.loading=true;
    try{
      const loader=new THREE.GLTFLoader();const [racer,coupe]=await Promise.all(['ot-racer','ot-coupe'].map(name=>new Promise((resolve,reject)=>loader.load(new URL('assets/world/vehicles/'+name+'.glb',OTTHI_GAME_LIVE_BASE).href,g=>resolve(g.scene),undefined,reject))));
      worldExpansion.assets={racer,coupe};for(const car of world.vehicles)if(car.kind==='kart'||car.racerAsset)worldRacerAttach(car.group,car.appearance?.primary,car.racerAsset||'racer');
      if(player.vehicle){const car=currentVehicleRef();if(car?.kind==='kart'||car?.racerAsset)worldRacerAttach(vehicleVisual,car.appearance?.primary,car.racerAsset||'racer');}
    }catch(e){console.warn('Veículos GLB indisponíveis; modelo nativo mantido:',e.message);}
    finally{worldExpansion.loading=false;}
  }
  function expansionDrawCity(city){
    const root=new THREE.Group();root.name='WORLD_CITY_'+city.id;root.position.set(city.x,0,city.z);
    const base=campaignMaterial(0xc5cfbe,.05,'sidewalk'),walls=[campaignMaterial(city.color,.08,'brick'),campaignMaterial(0xc8bca3,.05,'concrete')],glass=campaignMaterial(0x3f718c,.4,'city-glass'),roof=campaignMaterial(0x263b4c,.4),white=campaignMaterial(0xe1e5d6),garden=campaignMaterial(0x56885f);
    const box=(m,x,y,z,w,h,d)=>campaignBox(root,m,x,y,z,w,h,d);
    for(const [i,x,z]of [[0,-32,-25],[1,32,-25],[2,-32,25],[3,32,25]]){
      const h=city.id==='aurora'?8+i*3:5+(i%2)*3;box(base,x,.12,z,23,.24,22);box(walls[i%2],x,h/2,z,17,h,14);box(roof,x,h+.2,z,18,.4,15);
      world.colliders.push({x:city.x+x,z:city.z+z,w:17,d:14,height:h,city:city.id});
      for(let y=2;y<h-.5;y+=2.4)for(const dx of [-5.4,-1.8,1.8,5.4])for(const side of [-1,1])box(glass,x+dx,y,z+side*7.05,1.6,1.3,.08);
      box(roof,x,1.5,z+7.2,2.3,3,.15);box(white,x,3.5,z+7.4,5,.25,.5);
      for(const side of [-1,1]){box(garden,x+side*8.8,.5,z+8.6,2,.65,2);}
      if(city.id==='costa'){box(walls[0],x,h+.8,z,13,1.2,10);box(white,x,h+1.5,z,14,.2,11);}
    }
    const sign=campaignSign(root,city.label.toUpperCase(),'CENTRO · AUTÓDROMO · OT WORLD',7);sign.position.set(-53,7,0);sign.rotation.y=Math.PI/2;
    campaignBatch(root);worldGroup.add(root);worldExpansion.groups.push(root);
    const h=WORLD_LAYOUT_V704.highways.find(h=>h.id==='ottovias-'+city.id+'-city'),route=ottoviasLaneRoute(h.points,2.3,false);
    for(let i=0;i<3;i++)createOttoviasTrafficVehicle(city.id+'-'+i,route,i*2,[0xd07f56,0x64a3b8,0xdec36e][i],5+i*.6);
    for(const [i,x,z]of [[0,-11,-9],[1,11,9]]){
      const car=createToyCar(city.x+x,city.z+z,{id:'city-'+city.id+'-coupe-'+i,theme:'playmobil',bodyType:'small',label:city.label+' · cupê',primary:i?0xf2bd55:0x44aab0,heading:i?Math.PI/2:-Math.PI/2});car.racerAsset='coupe';worldExpansion.cars.push(car);if(worldExpansion.assets.coupe)worldRacerAttach(car.group,car.appearance.primary,'coupe');
      createNPC('citizen-'+city.id+'-'+i,i?'Moradora de '+city.label:'Morador de '+city.label,city.x+(i?17:-17),city.z+(i?-9:9),i?0x8981be:0xc0915b,2);
    }
    world.trafficSnapshot=null;
  }
  function expansionRepairParking(){
    const protectedRects=v704ProtectedRectangles(),roads=WORLD_LAYOUT_V704.roads.map(r=>v704RoadFootprint(r,true));
    for(const car of world.vehicles){
      if(car.occupied||car.kind==='kart')continue;
      const owned=state.vehicles?.owned?.includes(car.id),radius=car.radius||1.5;
      const valid=(x,z)=>!waterAt(x,z)&&!roads.some(r=>v704PointInRect({x,z},r,radius))&&!protectedRects.some(r=>!(r.kind==='garage'&&owned)&&v704PointInRect({x,z},r,1.3))&&!world.vehicles.some(o=>o!==car&&Math.hypot(x-o.group.position.x,z-o.group.position.z)<radius+(o.radius||1.4)+.35);
      const x=car.group.position.x,z=car.group.position.z;if(valid(x,z))continue;let point=null;
      for(let radius=2;radius<=30&&!point;radius+=2)for(let i=0;i<24;i++){const angle=i*Math.PI/12,px=x+Math.cos(angle)*radius,pz=z+Math.sin(angle)*radius;if(valid(px,pz)){point={x:px,z:pz};break;}}
      if(point){car.group.position.x=car.x=point.x;car.group.position.z=car.z=point.z;persistParkedVehicle(car);}
    }
  }
  function expansionEnsure(){
    if(!running||!worldGroup)return;
    if(worldExpansion.ready){for(const root of worldExpansion.groups)if(root.parent!==worldGroup)worldGroup.add(root);return;}
    Object.values(WORLD_LAYOUT_V704.cities).forEach(expansionDrawCity);
    createKartCircuitV704(WORLD_LAYOUT_V704.circuits.costa);
    for(const circuit of SPORTS_V705.circuits){
      const root=new THREE.Group();root.name='CIRCUIT_FACILITIES_'+circuit.id;const spec=WORLD_LAYOUT_V704.circuits[circuit.id];root.position.set(circuit.cx,0,circuit.cz);const concrete=campaignMaterial(0x879b9f,.05,'stadium-concrete'),seat=campaignMaterial(circuit.id==='aurora'?0xa76a58:0x458c87),roof=campaignMaterial(0xd0d9cf);
      for(const side of [-1,1])for(let row=0;row<4;row++)campaignBox(root,row%2?seat:concrete,side*(spec.w/2-3+row*.5),1+row*.65,0,3,.6,33-row*2);
      campaignBox(root,roof,0,4,spec.d/2-5,25,.45,6);for(const x of [-11,11])campaignBox(root,concrete,x,2,spec.d/2-5,.3,4,.3);
      campaignBatch(root);worldGroup.add(root);worldExpansion.groups.push(root);
    }
    expansionRepairParking();world.navCache?.clear?.();worldExpansion.ready=true;worldRacerLoad();
  }
  function updateWorldExpansion(){
    expansionEnsure();if(!worldExpansion.ready||performance.now()-worldExpansion.lastLod<250)return;worldExpansion.lastLod=performance.now();
    const focus=otGamesFocus();for(const root of worldExpansion.groups)root.visible=Math.hypot(focus.x-root.position.x,focus.z-root.position.z)<(otGames.active&&otGames.mode!=='ground'?420:220);
    for(const c of SPORTS_V705.circuits){const near=Math.hypot(focus.x-c.cx,focus.z-c.cz)<210;c.root.visible=near;for(const car of c.karts)if(!car.occupied)car.group.visible=near&&!car.garageStored;}
  }
  window.OTTHI_EXPANSION={locations:expansionMapLocations,diagnostics:()=>({ready:worldExpansion.ready,bounds:{...v704WorldBounds()},cities:Object.values(WORLD_LAYOUT_V704.cities).map(c=>({...c})),assets:Object.keys(worldExpansion.assets),models:worldExpansion.cars.map(c=>({id:c.id,asset:c.group.userData.racerAsset,drivable:!c.occupied})),circuits:SPORTS_V705.circuits.map(c=>({id:c.id,length:c.curve.getLength(),width:c.width,active:c.active}))})};

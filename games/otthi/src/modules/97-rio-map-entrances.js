/** On-demand rooms for mapped footprints outside the authored places. */
// @otthi-module-body
  const RIO_HOUSE_USE=new Set(['house','residential','detached','terrace','apartments','semidetached_house']);

  function rioAmbientWallHit(building,x,z,radius){
    const {door,rings}=building;
    for(const ring of rings)for(let i=0;i<ring.length;i++){
      const p=rioSegmentProjection(x,z,ring[(i+ring.length-1)%ring.length],ring[i]);
      if(Math.hypot(p.x-x,p.z-z)>radius+.075)continue;
      if(ring===rings[0]&&i===door.edge&&Math.hypot(door.x-p.x,door.z-p.z)<.73-radius)continue;
      return true;
    }
    return false;
  }

  function rioNearestBuildingDoor(){
    let best=null,distance=3.2;
    for(const building of rioMap.geo.doors.query(player.x,player.z,3.3)){
      const d=distance2D(player,building.door.outside);
      if(d<distance&&!positionBlockedForPlayer(building.door.outside.x,building.door.outside.z,.37,{ignoreTraffic:true})){best=building;distance=d;}
    }
    return best;
  }
  function rioOpenAmbientDoor(){
    const building=rioNearestBuildingDoor();
    if(!building)return false;
    const {door,kind}=building,available=()=>running&&!player.vehicle&&!player.boating&&!player.swimming&&
      distance2D(player,door.outside)<3.25&&!characterActivities.session;
    if(!available())return false;
    if(RIO_HOUSE_USE.has(kind))return rioPropertyDoor({id:door.id,name:'Residência · Rio Preto',price:290+building.id%120,available,
      enter:()=>rioEnterAmbientRoom(building)});
    return rioEnterAmbientRoom(building);
  }

  function rioEnterAmbientRoom(building){
    const {door,rings}=building;
    rioCloseAmbientRoom();
    const root=new THREE.Group();root.name='RIO_MAPPED_INTERIOR';worldGroup.add(root);
    const shell=rioSurfaceBatch();shell.polygon('pedestrian',rings,.035);shell.commit(root);
    const dummy={id:'mapped-'+door.id,x:door.x,z:door.z,yaw:door.yaw,w:1,d:1};
    const room=rioSiteLayout(dummy,root);
    const open={building,room,outside:door.outside};rioMap.activeBuilding=open;
    rioRefreshBuildingRoofs(building.tileKey);
    const spots=[[-1.62,-2.6],[1.62,-2.6],[0,-3.45],[-1.17,-1.7],[1.17,-1.7]];
    const furniture=spots.find(([x,z])=>{
      const p=room.point(x,z),step=room.point(x,z+.68);
      return rioWithinFootprint(p.x,p.z,rings,-.76)&&rioWithinFootprint(step.x,step.z,rings,-.53);
    });
    if(furniture){
      const [x,z]=furniture,w=RIO_HOUSE_USE.has(building.kind)?1.24:1.06;
      room.object(x,.27,z,w,.53,.64,0x897561);
      room.box(x,.59,z,w-.07,.12,.60,0x637b79);
      room.box(x,.83,z-.26,w,.42,.12,0x526b69);
      const seat=room.point(x,z),step=room.point(x,z+.68);
      room.action('seat','Sentar no interior',x,z+.68,()=>beginCharacterActivity('rio-rest',{
        target:step,pose:{...seat,y:.63,yaw:door.yaw,sitting:true}
      }),{radius:1.1,icon:'🪑'});
    }
    const text=RIO_HOUSE_USE.has(building.kind)?'RESIDÊNCIA':'RIO PRETO';
    room.sign(text,0,1.40,-.55,1.33,.25,'#355565');
    room.batch.commit();
    if(!rioEnterPlace(door.inside)){rioCloseAmbientRoom();return false;}
    return true;
  }

  function rioCloseAmbientRoom(){
    const open=rioMap.activeBuilding;if(!open)return;
    rioMap.activeBuilding=null;
    const {room,building}=open;
    const removed=new Set(room.colliders),actions=new Set(room.actions);
    world.colliders=world.colliders.filter(c=>!removed.has(c));
    world.interactables=world.interactables.filter(action=>!actions.has(action.id));
    room.root.parent?.remove(room.root);
    rioDisposeTileObjects(room.root);
    rioRefreshBuildingRoofs(building.tileKey);
  }

  function rioUpdateAmbientRoom(){
    const open=rioMap.activeBuilding;if(!open)return false;
    const inside=rioWithinFootprint(player.x,player.z,open.building.rings,-.08);
    if(!inside&&!characterActivities.session&&distance2D(player,open.outside)>1.8)rioCloseAmbientRoom();
    return inside;
  }

  function rioBuildAmbientAccess(){
    registerInteractable({id:'rio-building-door',type:'door',icon:'🚪',label:'Entrar no prédio',radius:3.2,priority:235,
      getPos:()=>rioNearestBuildingDoor()?.door.outside||{x:Infinity,z:Infinity},
      getLabel:()=>RIO_HOUSE_USE.has(rioNearestBuildingDoor()?.kind)?'Visitar ou comprar residência':'Entrar no prédio',
      available:()=>!rioMap.activeBuilding&&!player.vehicle&&!player.boating&&!player.swimming&&!characterActivities.session,
      action:rioOpenAmbientDoor});
  }

  function rioBindBuildingPointer(){
    const canvas=renderer.domElement,probe=new THREE.Vector3();
    let press=null;
    canvas.addEventListener('pointerdown',event=>{
      if(event.isPrimary&&event.button===0)press={x:event.clientX,y:event.clientY,id:event.pointerId};
    });
    canvas.addEventListener('pointercancel',()=>{press=null;});
    canvas.addEventListener('pointerup',event=>{
      const start=press;press=null;
      if(!start||start.id!==event.pointerId||Math.hypot(event.clientX-start.x,event.clientY-start.y)>6||
        !running||paused||!els.modal.hidden||player.vehicle||player.boating||otGames.active)return;
      const action=nearestInteractable();
      if(!action)return;
      const ambient=action.id==='rio-building-door',site=ambient?null:rioFunctionalSites().find(place=>place.id+'-entrance'===action.id);
      if(!ambient&&!site)return;
      const door=ambient?rioNearestBuildingDoor()?.door:null;
      if(ambient&&!door)return;
      const x=door?.x??(site.entry[0]-Math.sin(site.yaw)*1.35),z=door?.z??(site.entry[1]-Math.cos(site.yaw)*1.35);
      const rect=canvas.getBoundingClientRect();probe.set(x,1.05,z).project(camera);
      if(probe.z<-1||probe.z>1)return;
      const sx=rect.left+(probe.x+1)*rect.width/2,sy=rect.top+(1-probe.y)*rect.height/2;
      if(Math.abs(sx-event.clientX)<=32&&Math.abs(sy-event.clientY)<=46)action.action();
    });
  }

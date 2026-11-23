/** São José do Rio Preto scene assembled from cartographic tiles using the existing World renderer. */
// @otthi-module-body
  const rioMapEntranceKey='complexo_swift';
  const rioFunctionalSites=()=>rioMap.data?.sites||[];
  function rioSiteByKey(key){return rioFunctionalSites().find(site=>site.key===key);}
  function rioMapStartPoint(desired=new URLSearchParams(location.search).get('entrada')){
    if(desired==='represa-cais')return {...rioDockPoint(0,RIO_REPRESA_DOCK.start-2.4),yaw:Math.PI-RIO_REPRESA_DOCK.yaw};
    const site=rioSiteByKey(desired)||rioSiteByKey(rioMapEntranceKey);
    const s=Math.sin(site.yaw),c=Math.cos(site.yaw);
    return {x:site.entry[0]+s*5.2,z:site.entry[1]+c*5.2,yaw:Math.atan2(-s,c)};
  }
  function rioBoxCellCandidates(x,z,reach=0){
    return nearbyWorldColliders(x,z,reach);
  }
  function rioBoxContains(c,x,z,radius){
    if(c.rioRings)return rioWithinFootprint(x,z,c.rioRings,radius);
    return Math.abs(c.x-x)<c.w/2+radius&&Math.abs(c.z-z)<c.d/2+radius;
  }
  function rioGeometryBlocked(x,z,radius=.43){
    return rioFootprintBlock(x,z,radius)||
      rioBoxCellCandidates(x,z,radius).some(c=>!c.disabled&&rioBoxContains(c,x,z,radius));
  }
  function resolveRioCollisions(prevX,prevZ){
    if(player.vehicle){
      if(rioWaterAt(player.x,player.z)||vehicleHitsCollider(player.x,player.z)){
        player.x=prevX;player.z=prevZ;registerVehicleImpact();
      }
      return;
    }
    const r=.43*playerScaleValue()*(player.crouched?.82:1);
    const blocked=(x,z)=>positionBlockedForPlayer(x,z,r,{ignoreTraffic:true,allowWater:true});
    if(!blocked(player.x,player.z))return;
    const targetX=player.x,targetZ=player.z;
    player.x=prevX;player.z=prevZ;
    if(!blocked(targetX,prevZ))player.x=targetX;
    if(!blocked(player.x,targetZ))player.z=targetZ;
  }
  function rioRestorePlayer(){
    const start=rioMapStartPoint(),saved=rioMapSave().position;
    const valid=saved&&[saved.x,saved.z].every(Number.isFinite)&&
      !positionBlockedForPlayer(saved.x,saved.z,.41,{ignoreTraffic:true,allowWater:false});
    const position=valid&&!new URLSearchParams(location.search).has('entrada')?saved:start;
    rioStreamMap(position,true);
    const options={ignoreTraffic:true,allowWater:false,distances:[0,1,2,4,7,10]};
    let at=safePointNear(position.x,position.z,options);
    if(Math.hypot(at.x-position.x,at.z-position.z)>10.01){
      rioStreamMap(start,true);
      at=safePointNear(start.x,start.z,options);
    }
    player.x=at.x;player.z=at.z;player.y=at.y;player.facing=0;player.vx=player.vz=player.vy=0;player.grounded=true;
    cameraYaw=Number.isFinite(position.yaw)?position.yaw:start.yaw;cameraPitch=.24;cameraZoom=2.8;
    document.body.dataset.otthiMap='rio-preto';
    playerGroup.position.set(player.x,player.y,player.z);
    rememberSafePlayerPosition(true);
  }
  function rioSavePlayerPosition(){
    const saved=rioMapSave();
    if(player.vehicle)rioRecordVehiclePose(currentVehicleRef(),player.x,player.z,player.car.heading);
    if(player.boating)rioRecordBoatPose();
    const residence=[...rioMap.sites.values()].find(room=>room.door&&room.forSite(player.x,player.z,-.06));
    if(rioMap.activeBuilding||residence){
      const {x,z}=rioMap.activeBuilding?.outside||{x:residence.site.entry[0],z:residence.site.entry[1]};
      saved.position={x,z,yaw:cameraYaw};
    }else if(!player.vehicle&&!player.boating&&!player.swimming&&!characterActivities.session&&!currentHouse&&
      !positionBlockedForPlayer(player.x,player.z,.32,{ignoreTraffic:true,allowWater:false})){
      saved.position={x:+player.x.toFixed(2),z:+player.z.toFixed(2),yaw:+cameraYaw.toFixed(4)};
    }else if(!saved.position&&Number.isFinite(player.lastSafeX)&&Number.isFinite(player.lastSafeZ)){
      saved.position={x:player.lastSafeX,z:player.lastSafeZ,yaw:cameraYaw};
    }
    saved.waypoint=state.waypoint||null;
    return saveState(true);
  }
  function rioTerrainMaterials(){
    const waterMap=textures.water.clone();
    waterMap.repeat.set(1,1);waterMap.needsUpdate=true;
    return {
      building:new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.94,side:THREE.DoubleSide}),
      street:new THREE.MeshStandardMaterial({color:0x5a5d5c,roughness:.98,side:THREE.DoubleSide}),
      pedestrian:new THREE.MeshStandardMaterial({color:0xc0b9ab,roughness:1,side:THREE.DoubleSide}),
      paint:new THREE.MeshBasicMaterial({color:0xe9ded0,side:THREE.DoubleSide}),
      lane:new THREE.MeshBasicMaterial({color:0xcba96e,side:THREE.DoubleSide}),
      park:new THREE.MeshStandardMaterial({color:0x759361,roughness:1,side:THREE.DoubleSide}),
      field:new THREE.MeshStandardMaterial({color:0x598750,roughness:1,side:THREE.DoubleSide}),
      water:new THREE.MeshBasicMaterial({
        color:new THREE.Color(0x7ab2ac).convertSRGBToLinear(),map:waterMap,toneMapped:false,side:THREE.DoubleSide
      })
    };
  }
  function rioSurfaceBatch(){
    const layers=new Map(),shade=new THREE.Color();
    function layer(key){
      if(!layers.has(key))layers.set(key,{position:[],color:[]});
      return layers.get(key);
    }
    function triangle(key,a,b,c,color=null){
      const list=layer(key);
      list.position.push(...a,...b,...c);
      if(color!==null){
        shade.setHex(color).convertSRGBToLinear();
        for(let i=0;i<3;i++)list.color.push(shade.r,shade.g,shade.b);
      }
    }
    function quad(key,a,b,c,d,color=null){
      triangle(key,a,b,c,color);triangle(key,a,c,d,color);
    }
    function polygon(key,rings,height,color=null){
      const vectors=ring=>ring.map(([x,z])=>new THREE.Vector2(x,z));
      const faces=THREE.ShapeUtils.triangulateShape(vectors(rings[0]),rings.slice(1).map(vectors));
      const points=rings.flat();
      for(const face of faces)triangle(key,...face.map(i=>[points[i][0],height,points[i][1]]),color);
    }
    function commit(root){
      for(const [type,layer] of layers){
        const geometry=new THREE.BufferGeometry();
        geometry.setAttribute('position',new THREE.Float32BufferAttribute(layer.position,3));
        if(layer.color.length)geometry.setAttribute('color',new THREE.Float32BufferAttribute(layer.color,3));
        if(type==='water'){
          const uv=new Float32Array(layer.position.length*2/3);
          for(let i=0,k=0;i<layer.position.length;i+=3){
            uv[k++]=layer.position[i]/19;uv[k++]=layer.position[i+2]/19;
          }
          geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
        }
        geometry.computeVertexNormals();geometry.computeBoundingSphere();
        const mesh=new THREE.Mesh(geometry,rioMap.materials[type]);mesh.name='RIO_SURFACE_'+type;
        mesh.castShadow=false;mesh.receiveShadow=false;mesh.userData.rioOwnGeometry=true;root.add(mesh);
      }
    }
    return {triangle,quad,polygon,commit};
  }
  function rioDrawRoad(surface,road){
    const {a,b,length,width,kind,pedestrian,bridge}=road,normal=[(a[1]-b[1])/length,(b[0]-a[0])/length];
    const y=bridge?.265:pedestrian?.064:.039;
    const at=(t,offset,h)=>[a[0]+(b[0]-a[0])*t+normal[0]*offset,h,a[1]+(b[1]-a[1])*t+normal[1]*offset];
    const strip=(key,offset,span,start=0,end=1,h=y)=>{
      const l=offset-span/2,r=offset+span/2;
      surface.quad(key,at(start,l,h),at(end,l,h),at(end,r,h),at(start,r,h));
    };
    strip(pedestrian?'pedestrian':'street',0,width+.09);
    const type=pedestrian?'pedestrian':'street';
    for(const t of [0,1]){
      const center=at(t,0,y);
      for(let i=0;i<12;i++){
        const angle=i*Math.PI/6,next=(i+1)*Math.PI/6,r=width/2;
        surface.triangle(type,center,[center[0]+Math.cos(next)*r,y,center[2]+Math.sin(next)*r],
          [center[0]+Math.cos(angle)*r,y,center[2]+Math.sin(angle)*r]);
      }
    }
    if(pedestrian||width<5||kind==='service'||length<8)return;
    for(const side of [-1,1])strip('paint',side*(width/2-.21),.075,0,1,y+.003);
    if(!road.oneway)for(let d=3;d<length-3;d+=6)strip('lane',0,.10,d/length,Math.min(length-2,d+2.6)/length,y+.005);
  }
  function rioDrawBuilding(surface,batch,building){
    const {id,height:h,kind,rings,door}=building;
    const palate=[0xc7b8a6,0xa9ada3,0xd4c3a8,0xb6a59b,0xb3bfc0,0xbc9d86,0xc8c0b5];
    const color=palate[id%palate.length],house=['house','residential','detached','terrace'].includes(kind);
    const wallH=h;
    for(const ring of rings)for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const a=ring[j],b=ring[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
      const face=(start,end,bottom)=>{
        const at=(t,y)=>[lerp(a[0],b[0],t),y,lerp(a[1],b[1],t)];
        surface.quad('building',at(start,bottom),at(end,bottom),at(end,wallH),at(start,wallH),color);
      };
      if(door&&ring===rings[0]&&i===door.edge){
        const low=door.fraction-.76/length,high=door.fraction+.76/length;
        face(0,low,0);face(high,1,0);face(low,high,2.19);
        const {yaw}=door,s=Math.sin(yaw),c=Math.cos(yaw);
        for(const side of [-1,1])batch.part('box',door.x+c*.78*side,1.08,door.z-s*.78*side,.10,2.16,.15,0x455659,yaw);
        batch.part('box',door.x+s*.07,.036,door.z+c*.07,1.61,.071,.54,0x988b78,yaw);
      }else face(0,1,0);
      if(ring!==rings[0]||length<3.5||length>55)continue;
      const normalX=(a[1]-b[1])/length,normalZ=(b[0]-a[0])/length;
      const inside=rioInsideRing((a[0]+b[0])/2+normalX*.1,(a[1]+b[1])/2+normalZ*.1,ring),sign=inside?-1:1;
      const angle=Math.atan2(sign*normalX,sign*normalZ),levels=Math.min(5,Math.max(1,Math.floor(h/3.2)));
      const n=Math.floor(length/3.3);
      for(let level=0;level<levels;level++)for(let c=1;c<=n;c++){
        const t=c/(n+1),x=a[0]+(b[0]-a[0])*t+sign*normalX*.055,z=a[1]+(b[1]-a[1])*t+sign*normalZ*.055;
        if(door&&i===door.edge&&!level&&Math.abs(t-door.fraction)*length<1.5)continue;
        batch.part('box',x,1.68+level*3.05,z,1.10,.91,.07,house?0x65767a:0x536e75,angle);
      }
    }
  }
  function rioMakeBuildingRoofs(tile){
    const roof=new THREE.Group(),surface=rioSurfaceBatch();roof.name='RIO_MAPPED_ROOFS';
    for(const b of tile.buildings){
      if(b===rioMap.activeBuilding?.building)continue;
      surface.polygon('building',b.rings,b.height,RIO_HOUSE_USE.has(b.kind)?0x9b6655:0xa49b8b);
    }
    surface.commit(roof);return roof;
  }
  function rioRefreshBuildingRoofs(key){
    const mounted=rioMap.tiles.get(key);if(!mounted)return;
    mounted.roofs.parent?.remove(mounted.roofs);rioDisposeTileObjects(mounted.roofs);
    mounted.roofs=rioMakeBuildingRoofs(rioMap.geo.tiles.get(key));mounted.root.add(mounted.roofs);
  }
  function rioMountTile(tile){
    if(rioMap.tiles.has(tile.key))return;
    const root=new THREE.Group();root.name='RIO_TILE_'+tile.key;
    const surface=rioSurfaceBatch(),props=rioCreateBatch(root);
    for(const road of tile.roads)rioDrawRoad(surface,road);
    for(const p of tile.parks)surface.polygon(p.kind==='pitch'?'field':'park',p.rings,.014);
    for(const b of tile.buildings)rioDrawBuilding(surface,props,b);
    for(const [x,z] of tile.trees){
      if(rioFootprintBlock(x,z,.36)||rioRoadAt(x,z,.45)||rioWaterAt(x,z))continue;
      props.part('post',x,1.66,z,.29,3.25,.29,0x83684a);
      props.part('canopy',x,3.82,z,3.65,2.75,3.60,0x657f54);
    }
    const rooms=[];
    for(const site of tile.sites){
      const room=rioMountPlace(site,root);
      if(room)rooms.push({site,room});
    }
    const roofs=rioMakeBuildingRoofs(tile);root.add(roofs);
    surface.commit(root);props.commit();
    worldGroup.add(root);
    rioMap.tiles.set(tile.key,{root,rooms,roofs});
  }
  function rioUnloadTile(key){
    const mounted=rioMap.tiles.get(key);
    if(!mounted)return;
    const doomed=new Set(),actions=new Set();
    for(const {site,room} of mounted.rooms){
      for(const collider of room.colliders)doomed.add(collider);
      for(const id of room.actions)actions.add(id);
      rioMap.sites.delete(site.id);
      if(room.npcs?.length){const leaving=new Set(room.npcs);world.npcs=world.npcs.filter(npc=>!leaving.has(npc));}
      if(rioMap.order?.site===site.id)rioMap.order=null;
    }
    if(doomed.size)world.colliders=world.colliders.filter(candidate=>!doomed.has(candidate));
    if(actions.size)world.interactables=world.interactables.filter(action=>!actions.has(action.id));
    mounted.root.parent?.remove(mounted.root);
    rioDisposeTileObjects(mounted.root);
    rioMap.tiles.delete(key);
  }
  function rioDisposeTileObjects(root){
    root.traverse(object=>{
      if(object.isMesh)object.geometry?.dispose();
      // Instanced surfaces use shared materials. Signs and room lamps own their material.
      if(object.material?.isMeshBasicMaterial&&!Object.values(rioMap.materials).includes(object.material)){
        object.material.map?.dispose();object.material.dispose();
      }else if(object.material?.map?.isCanvasTexture&&object.geometry?.type==='PlaneGeometry'){
        object.material.map.dispose();object.material.dispose();
      }
    });
  }
  function rioStreamMap(position=player,immediate=false){
    const ix=Math.floor(position.x/rioCityTileSize),iz=Math.floor(position.z/rioCityTileSize);
    const loadRadius=qualityTier()==='low'?1:2,keep=loadRadius+1,queue=[];
    for(let i=-loadRadius;i<=loadRadius;i++)for(let j=-loadRadius;j<=loadRadius;j++){
      const tile=rioMap.geo.tiles.get((ix+i)+':'+(iz+j));
      if(tile&&!rioMap.tiles.has(tile.key))queue.push({tile,distance:Math.hypot(i,j)});
    }
    queue.sort((a,b)=>a.distance-b.distance);
    for(const {tile} of (immediate?queue:queue.slice(0,1)))rioMountTile(tile);
    for(const key of rioMap.tiles.keys()){
      const tile=rioMap.geo.tiles.get(key),distance=Math.max(Math.abs(ix-tile.ix),Math.abs(iz-tile.iz));
      if(distance>keep)rioUnloadTile(key);
    }
  }

  function buildRioMapWorld(){
    worldGroup=new THREE.Group();worldGroup.name='SAO_JOSE_DO_RIO_PRETO';scene.add(worldGroup);
    const b=rioMap.data.bounds,ground=box(b.maxX-b.minX+8,.19,b.maxZ-b.minZ+8,0x83996f,
      (b.minX+b.maxX)/2,-.102,(b.minZ+b.maxZ)/2,worldGroup);
    ground.name='RIO_CITY_TERRAIN';ground.castShadow=false;
    createSkyDome();scene.background=new THREE.Color(0x8ed0ef);scene.fog=new THREE.Fog(0xb8ddec,175,460);
    rioMap.materials=rioTerrainMaterials();
    const water=rioSurfaceBatch();
    for(const [,rings] of rioMap.data.water)water.polygon('water',rings,.019);
    water.commit(worldGroup);
    world.ottoviasTraffic=OTTOVIAS_RUNTIME.traffic;
    CHARACTER_ACTIVITIES['rio-rest']=['Descansando no banco',3.3];
    CHARACTER_ACTIVITIES['rio-entry']=['Entrando pela porta',0];
    CHARACTER_ACTIVITIES['rio-boarding']=['Caminhando até a embarcação',0];
    rioStreamMap(rioMapStartPoint(),true);
    createWaypointMarker();
    rioBuildFleetParking();
    rioBuildWorkshop();
    rioBuildEmergencyServices();
    rioBuildCommunity();
    rioBuildAirport();
    rioBuildAmbientAccess();
    rioBuildWaterfront();
    rioPrepareWaterfrontRun();
  }

  function rioMapStep(dt){
    if(paused)return;
    pollGamepad();
    if(otGames.active){rioStepFlight(dt);return;}
    const before={x:player.x,z:player.z};
    updatePlayer(dt);
    if(player.vehicle){
      const vehicle=currentVehicleRef();
      if(rioOwnedRoadVehicle(vehicle)){
        const distance=Math.hypot(before.x-player.x,before.z-player.z),fuel=rioFuelLevel(vehicle);
        if(distance>0&&fuel>0)rioRoadVehicleSave(vehicle.id).fuel=Math.max(0,fuel-distance*.002);
      }
    }
    if(player.boating&&world.boat?.kind==='board')stopEngineSound();
    else updateVehicleFX(dt);
    if(fxParticles.length)updateFX(dt);
    if(fishingVisual?.active)updateFishingVisual(dt);
    perf.cameraAcc=Number(perf.cameraAcc||0)+dt;
    if(activeRace)updateRace(dt);
    if(SPORTS_V705.active)updateWorldSportsV704(dt);
    const now=performance.now();
    if(now>=rioMap.lastStream){
      rioMap.lastStream=now+66;
      rioStreamMap();
      rioMap.indoors=rioUpdateAmbientRoom();rioMap.indoorRoom=null;
      for(const {rooms} of rioMap.tiles.values())for(const {site,room} of rooms){
        if(room.roof){
          room.roof.visible=!room.forSite(player.x,player.z,-.22);
          rioMap.indoors||=!room.roof.visible;
          if(!room.roof.visible)rioMap.indoorRoom=room;
        }
        if(rioMap.order?.site===site.id&&Math.hypot(player.x-site.x,player.z-site.z)>Math.max(site.w,site.d)+8){
          rioMap.order=null;if(room.servedDish)room.servedDish.visible=false;
        }
      }
    }
    for(const room of rioMap.sites.values())if(room.server||room.door)rioUpdatePlaceService(room.site,room,dt);
    updateRioMapActors(dt);
    updateRioWaterfront(dt);
    updateWorldPhone(dt);
    rioUpdateCommunity(dt);
    const waterMap=rioMap.materials.water.map;
    waterMap.offset.x=(waterMap.offset.x+dt*.013)%1;
    waterMap.offset.y=(waterMap.offset.y+dt*.007)%1;
    perf.uiAcc+=dt;
    if(perf.uiAcc>.13){
      const step=perf.uiAcc;perf.uiAcc=0;updateNeeds(step);updateNavigation(step);updateHUD();
      if(world.routeGuide)world.routeGuide.visible=!rioMap.indoors;
    }
  }

  function rioCameraObstacle(x,y,z){
    for(const b of rioMap.geo.buildings.query(x,z,.29))if(b!==rioMap.activeBuilding?.building&&y<=b.height+.15&&rioWithinFootprint(x,z,b.rings,.24))return true;
    return rioBoxCellCandidates(x,z,.31).some(c=>c.height>1.5&&y<c.height+.19&&rioBoxContains(c,x,z,.24));
  }
  function rioAdjustCamera(desired,look){
    if(SPORTS_V705.active)return;
    const pose=characterActivities.session?.phase==='perform'?characterActivities.session.pose:null;
    const x=pose?.x??player.x,z=pose?.z??player.z,originY=player.y+(player.vehicle?1.55:1.45);
    if(rioMap.indoors&&!player.vehicle&&!player.boating&&!world.workshopInspectionCamera?.active){
      const room=rioMap.indoorRoom,portrait=innerHeight>innerWidth;
      const cx=room?.site.x??x,cz=room?.site.z??z,focusX=x+clamp((cx-x)*.32,-2.8,2.8),focusZ=z+clamp((cz-z)*.32,-2.8,2.8);
      const distance=clamp((portrait?6.9:5.9)+cameraZoom*.58,4.8,10.2);
      const height=clamp((portrait?6.7:5.8)+cameraPitch*2.7+cameraZoom*.25,4.65,9.75);
      desired.set(focusX-Math.sin(cameraYaw)*distance,player.y+height,focusZ+Math.cos(cameraYaw)*distance);
      look.set(focusX,player.y+.74,focusZ);camera.fov=portrait?56:53;
      return;
    }
    const fuelSite=player.vehicle&&rioSiteByKey('posto_brasilia');
    if(fuelSite&&rioSiteContains(fuelSite,x,z,.8)){
      const distance=clamp(6.6+cameraZoom*.28,5.3,8.4),heading=player.car.heading;
      desired.set(x-Math.sin(heading)*distance,clamp(desired.y,2.55,3.12),z-Math.cos(heading)*distance);
      look.set(x,1.05,z);
    }
    if(pose?.sitting){
      const distance=clamp(4.4+cameraZoom*.34,3.1,6.5),height=clamp(3.5+cameraPitch*1.6,2.6,5.2);
      desired.set(x-Math.sin(cameraYaw)*distance,player.y+height,z+Math.cos(cameraYaw)*distance);
      look.set(x,player.y+.91,z);
    }
    const dx=desired.x-x,dz=desired.z-z,len=Math.hypot(dx,dz);
    if(!len)return;
    let distance=len;
    for(let d=.50;d<=len;d+=.48){
      const t=d/len;
      if(!rioCameraObstacle(x+dx*t,lerp(originY,desired.y,t),z+dz*t))continue;
      distance=Math.max(.45,d-.48);break;
    }
    if(distance===len)return;
    const t=distance/len;
    desired.set(x+dx*t,Math.max(player.y+3.30,lerp(originY,desired.y,t)),z+dz*t);
    look.set(x,player.y+(pose?.sitting?1.02:1.33),z);
    if(rioCameraObstacle(camera.position.x,camera.position.y,camera.position.z))camera.position.copy(desired);
  }

  function rioInteriorRender(){
    const room=rioMap.indoorRoom;
    if(!room||otGames.active||player.vehicle)return null;
    const {x,z,yaw,w,d}=room.site,s=Math.sin(yaw),c=Math.cos(yaw),p=camera.position;
    const lx=(p.x-x)*c-(p.z-z)*s,lz=(p.x-x)*s+(p.z-z)*c;
    const alongX=Math.abs(lx/w)>Math.abs(lz/d),side=Math.sign(alongX?lx:lz)||1,key=(alongX?'x':'z')+side;
    room.cameraPlanes??={};
    if(!room.cameraPlanes[key]){
      const normal=new THREE.Vector3(-(alongX?c:s)*side,0,-(alongX?-s:c)*side);
      const edge=room.point(alongX?side*(w/2-.45):0,alongX?0:side*(d/2-.45));
      room.cameraPlanes[key]=[new THREE.Plane().setFromNormalAndCoplanarPoint(normal,new THREE.Vector3(edge.x,0,edge.z))];
    }
    const before=renderer.clippingPlanes;renderer.clippingPlanes=room.cameraPlanes[key];
    return()=>{renderer.clippingPlanes=before;};
  }

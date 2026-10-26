/** OT Games: the original OT scene is shared by peace, ground and air modes.
 * Infantry keeps its own body, enemies and rewards. Aircraft travel publishes
 * its actual pose for passengers; explicit disembarking saves the parked craft. */
// @otthi-module-body
  const otGames={mode:'peace',active:false,armed:false,body:null,group:null,enemies:[],bullets:[],effects:[],keys:new Set(),move:{x:0,y:0},aim:{x:0,y:0},collective:.5,pedal:0,fire:false,cameraEpoch:0,handSession:null,handAim:null,state:'PLAYING',assets:null,elapsed:0,ui:null,entry:null,trafficHolds:new Map()};
  const otGameModes={peace:'Mundo de paz',ground:'WAR Combate',plane:'Avião',helicopter:'Helicóptero',balloon:'Balão nas montanhas'};
  function otGamesFocus(){return otGames.active&&otGames.body?otGames.body:player;}
  function otGamesClearInput(){for(const reset of otGames.inputResets||[])reset();otGames.keys.clear();otGames.move.x=otGames.move.y=otGames.aim.x=otGames.aim.y=0;otGames.fire=false;otGames.aiming=false;otGames.pedal=0;otGames.collective=otGames.groundLaunch&&otGames.mode==='plane'?0:.5;otGames.handAim&&(otGames.handAim.fresh=false);}
  function otGamesMesh(kind,color,x,y,z,w,h,d,parent){
    const geometry=kind==='round'?new THREE.SphereGeometry(1,12,8):kind==='cylinder'?new THREE.CylinderGeometry(.5,.5,1,12):new THREE.BoxGeometry(1,1,1);
    const material=new THREE.MeshStandardMaterial({color,roughness:.74,metalness:kind==='round'?.12:.25});
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function otGamesAirframe(mode){
    const model=mode==='helicopter'?'kestrel':'falcon',root=new THREE.Group(),parts=new Map();
    for(const face of otGames.assets[model]){
      const canopy=face.color.join(',')===(mode==='plane'?'34,91,124':'40,101,130'),kind=face.rotor?'rotor':face.tailRotor?'tail':canopy?'canopy':'hull';if(!parts.has(kind))parts.set(kind,{positions:[],colors:[]});const part=parts.get(kind),v=face.vertices;
      const color=new THREE.Color(...face.color.map(n=>n/255)).convertSRGBToLinear();
      for(let i=1;i<v.length-1;i++)for(const point of [v[0],v[i],v[i+1]]){part.positions.push(...point);part.colors.push(color.r,color.g,color.b);}
    }
    for(const [name,part]of parts){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(part.positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(part.colors,3));g.computeVertexNormals();let pivot=null;if(name==='rotor'||name==='tail'){g.computeBoundingBox();pivot=g.boundingBox.getCenter(new THREE.Vector3());g.translate(-pivot.x,-pivot.y,-pivot.z);}const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.32,side:THREE.DoubleSide,transparent:name==='canopy',opacity:name==='canopy'?.38:1,depthWrite:name!=='canopy'}));if(pivot)mesh.position.copy(pivot);mesh.name=name;mesh.castShadow=true;root.add(mesh);}
    root.scale.setScalar(mode==='helicopter'?.075:.10);return root;
  }
  function otGamesWeapon(){
    if(window.OTCombatArt){const root=new THREE.Group(),gun=OTCombatArt.rifle(true);gun.rotation.y=Math.PI;root.add(gun);root.userData.flash=gun.userData.flash;root.userData.modelVersion=OTCombatArt.version;root.traverse(o=>{if(o.isMesh){o.material.depthTest=false;o.material.depthWrite=false;o.renderOrder=990;}});return root;}
    const root=new THREE.Group(),parts=new THREE.Group();root.add(parts);
    const box=(color,x,y,z,w,h,d)=>otGamesMesh('box',color,x,y,z,w,h,d,parts);
    box('#304650',0,0,-.18,.13,.12,.6);box('#607b80',0,.075,-.2,.09,.03,.4);box('#19313c',0,-.10,-.02,.08,.2,.1);box('#354e56',0,-.13,-.23,.085,.20,.11);box('#47636c',0,0,.12,.14,.17,.25);box('#172c37',0,.10,-.28,.025,.06,.025);box('#203743',0,.04,-.56,.04,.04,.3);
    for(const side of [-1,1])otGamesMesh('round','#3f5b58',side*.1,-.08,-.12,.08,.08,.15,parts);
    const flash=otGamesMesh('round','#ffe4a5',0,.03,-.74,.09,.08,.13,parts);flash.visible=false;root.userData.flash=flash;
    root.traverse(o=>{if(o.material){o.material.depthTest=false;o.material.depthWrite=false;o.renderOrder=990;}});return root;
  }
  function otGamesMergeStatic(group){
    // Bake rigid equipment into one coloured mesh. Limbs and rotor groups stay
    // articulated; more model detail no longer adds a draw call for every pouch.
    const positions=[],normals=[],colors=[],meshes=group.children.filter(o=>o.isMesh);
    for(const mesh of meshes){
      mesh.updateMatrix();const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();geometry.applyMatrix4(mesh.matrix);
      const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal'),color=mesh.material.color;
      for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));colors.push(color.r,color.g,color.b);}
      geometry.dispose();mesh.geometry.dispose();mesh.material.dispose();group.remove(mesh);
    }
    if(!positions.length)return null;const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeBoundingSphere();
    const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.82,metalness:.15}));mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh;
  }
  function otGamesEnemy(kind,x,z,index){
    const group=new THREE.Group(),y=groundHeightAt(x,z)+(kind==='drone'?9:0),e={id:'ot-enemy-'+index,kind,x,y:y+(kind==='tank'?1.3:kind==='drone'?0:1.15),z,hp:kind==='tank'?300:kind==='drone'?80:100,radius:kind==='tank'?2.3:kind==='drone'?1:.72,group,active:true,aim:2.8+index*.4,phase:index,hit:0};
    const box=(color,a,b,c,w,h,d)=>otGamesMesh('box',color,a,b,c,w,h,d,group),round=(color,a,b,c,w,h,d)=>otGamesMesh('round',color,a,b,c,w,h,d,group);
    if(kind==='tank'){
      box('#2b3435',0,.4,0,3.7,.8,5);box('#63715d',0,1.05,0,3.4,1.05,4.3);box('#8d9676',0,1.8,-.3,2.2,.6,2.3);box('#3e504a',0,1.9,2,.2,.2,3.6);
      for(const side of [-1,1]){box('#202c2e',side*1.65,.38,0,.7,.82,4.9);for(let i=0;i<6;i++)round('#728078',side*1.98,.38,-1.9+i*.76,.11,.3,.31);box('#abb69b',side*.8,1.45,-1.8,.5,.2,.3);}
      box('#304c4b',0,2.2,-.3,.75,.2,.8);box('#43515a',.8,2.6,-.7,.04,1.1,.04);
    }else if(kind==='drone'){
      round('#637f89',0,0,0,.8,.35,.5);round('#fd995e',0,-.18,.5,.14,.12,.1);
      for(const side of [-1,1])for(const end of [-1,1]){box('#263e49',side*.8,0,end*.65,1.3,.1,.1);const rotor=new THREE.Group();rotor.position.set(side*1.1,.18,end*.65);group.add(rotor);otGamesMesh('box','#526c79',0,0,0,1.1,.03,.15,rotor);(e.rotors||(e.rotors=[])).push(rotor);}
    }else{
      if(window.OTCombatArt){const model=OTCombatArt.infantry(index);group.add(model);e.model=model;e.legs=model.userData.rig.legs;e.arms=model.userData.rig.arms;e.renderVersion=OTCombatArt.version;}else{box('#4c5d4a',0,1.1,0,.5,.7,.3);round('#ae9775',0,1.7,0,.15,.19,.15);}

    }
    e.rigid=otGamesMergeStatic(group);group.position.set(x,y,z);otGames.group.add(group);return e;
  }
  function otGamesBlocked(a,b){
    const start=new THREE.Vector3(a.x,a.y,a.z),end=new THREE.Vector3(b.x,b.y,b.z),direction=end.clone().sub(start),distance=direction.length();if(distance<.01)return false;
    const ray=new THREE.Ray(start,direction.normalize());
    for(const box of otGames.obstacles||[]){const hit=ray.intersectBox(box,new THREE.Vector3());if(hit&&hit.distanceTo(start)<distance-.65)return true;}return false;
  }
  function otGamesSpawnWave(){
    const g=otGames;g.wave++;g.lock=null;const remaining=g.goal-g.kills,count=Math.min(remaining,4),bounds=v704WorldBounds();let made=0;
    // A sector is staged around the actual combat body, in open sight. Selecting
    // arbitrary roads across the entire town left targets behind houses or 150m away.
    const free=(x,z,radius)=>!waterAt(x,z)&&!positionBlockedForPlayer(x,z,radius,{ignoreTraffic:true});
    for(let i=0;i<count;i++){
      const kind=g.mode==='ground'?(i===3?'drone':'soldier'):(i%2?'tank':'drone');let point;
      for(let trial=0;trial<180;trial++){
        const spread=trial<72?.85:Math.PI,j=trial%18,offset=(i-(count-1)/2)*.18+(j?Math.ceil(j/2)/9*(j%2?1:-1)*spread:0);
        const distance=(g.mode==='plane'?75+i*25:22)+(Math.floor(trial/18)%4)*(g.mode==='plane'?8:7)+(i%2)*3,heading=g.body.yaw+offset;
        const x=g.body.x+Math.sin(heading)*distance,z=g.body.z+Math.cos(heading)*distance;
        const y=kind==='drone'&&g.mode!=='ground'?Math.max(groundHeightAt(x,z)+9,g.body.y):groundHeightAt(x,z)+(kind==='drone'?9:kind==='tank'?1.3:1.15);
        if(x<bounds.minX+5||x>bounds.maxX-5||z<bounds.minZ+5||z>bounds.maxZ-5||!free(x,z,kind==='tank'?2.6:.9)||g.enemies.some(e=>e.active&&Math.hypot(e.x-x,e.z-z)<6))continue;
        if(!otGamesBlocked(g.body,{x,y,z})){point={x,y,z};break;}
      }
      if(!point)continue;const e=otGamesEnemy(kind,point.x,point.z,g.wave*10+i);if(kind==='drone'){e.y=e.baseY=point.y;e.group.position.y=point.y;}g.enemies.push(e);made++;
    }
    if(made&&g.wave>1){g.body.hp=Math.min(100,g.body.hp+20);g.reserve=Math.max(g.reserve,60);g.notice='NOVO SETOR · +20 VIDA';g.noticeUntil=g.elapsed+3;}
    if(!made){g.state='SPAWN_BLOCKED';g.notice='Área fechada para combate. Volte à paz e entre em uma rua ou praça.';}
  }
  function otGamesSegmentDistance(a,b,p){const d=new THREE.Vector3(b.x-a.x,b.y-a.y,b.z-a.z),r=new THREE.Vector3(p.x-a.x,p.y-a.y,p.z-a.z),t=clamp(r.dot(d)/Math.max(.001,d.lengthSq()),0,1);return new THREE.Vector3(a.x,a.y,a.z).addScaledVector(d,t).distanceTo(new THREE.Vector3(p.x,p.y,p.z));}
  function otGamesShot(origin,direction,enemy=false){
    const mesh=otGamesMesh('round',enemy?'#ff7a54':'#ffe5a0',origin.x,origin.y,origin.z,.07,.07,.24,otGames.group),speed=enemy?30:180;
    if(state.settings?.sound!==false)window.GameAudio?.effect(enemy?'smg':otGames.mode==='ground'?'rifle':'marksman',enemy?.18:.7);
    otGames.bullets.push({x:origin.x,y:origin.y,z:origin.z,vx:direction.x*speed,vy:direction.y*speed,vz:direction.z*speed,life:enemy?5:2,enemy,damage:otGames.mode==='plane'?110:otGames.mode==='helicopter'?65:50,mesh});
  }
  function otGamesExplosion(e){
    if(state.settings?.sound!==false)window.GameAudio?.effect(e.kind==='tank'?'explosion':'impact',.8);
    const g=otGames;for(let i=0;i<14;i++){const mesh=otGamesMesh('round',i<4?'#ffb357':'#38464a',e.x,e.y,e.z,.2,.2,.2,g.group);g.effects.push({mesh,x:e.x,y:e.y,z:e.z,vx:Math.cos(i*2)*4,vy:2+(i%4),vz:Math.sin(i*2)*4,age:0,life:i<4?.7:6,smoke:i>=4});}
    if(e.kind==='tank'){
      // Nearby original OT traffic brakes; its prior hold is restored on exit.
      for(const record of trafficActorList()){const ref=record.ref,position=record.group?.position;if(!ref||!position||Math.hypot(position.x-e.x,position.z-e.z)>15)continue;if(!g.trafficHolds.has(ref))g.trafficHolds.set(ref,Number(ref.trafficHoldUntil||0));ref.trafficHoldUntil=Math.max(Number(ref.trafficHoldUntil||0),performance.now()+6000);}
    }
  }
  function otGamesDamage(e,damage){
    if(!e.active)return;e.hp=Math.max(0,e.hp-damage);e.hit=.12;otGames.hitMarkerUntil=otGames.elapsed+.13;
    if(e.hp===0){e.active=false;otGames.kills++;otGamesExplosion(e);if(e.kind==='tank'){e.group.traverse(o=>{if(o.isMesh)o.material.color.multiplyScalar(.30);});e.group.rotation.z=.09;}else if(e.model){e.fallAt=otGames.elapsed;}else e.group.visible=false;
      // The frame resolves all projectiles before deciding the result. Trading
      // the last kill for zero health must not save a victory and show defeat.
    }
  }
  function otGamesSaveResult(won){
    // The geographic campaign is complete only after a return to its home base.
    if(won&&typeof worldCampaign!=='undefined'&&worldCampaign.mission&&!worldCampaign.mission.recorded)return;
    const g=otGames;if(g.resultSaved)return;g.resultSaved=true;
    if(won){let career={wins:0};try{career=JSON.parse(safeLocalGet(g.careerKey)||'{}')}catch{}career.wins=(Number(career.wins)||0)+1;career.lastMode=g.mode;career.lastDifficulty=g.difficulty;safeLocalSet(g.careerKey,JSON.stringify(career));}
  }
  async function otGamesEnter(mode,options={}){
    if(mode==='peace'){otGamesLeave();return true;}
    if(mode==='balloon'&&!options.boarding){setWaypoint('mountain-balloon');toast('Siga o GPS até o balão e use AÇÃO junto à cesta para embarcar.','info',3800);return false;}
    if(otGames.starting)return false;
    if(!otGameModes[mode]||!running||paused||currentHouse||player.vehicle||player.boating||player.transit.mode||buildMode||activeRace||window.OTTHI_COOP?.active?.()){
      toast('Para entrar, fique a pé ao ar livre e conclua ou saia da atividade atual.','warn',3000);return false;
    }
    if(otGames.active)otGamesLeave();
    if(!otGames.assets){otGames.starting=true;let response;try{response=await fetch(new URL('assets/ot-games-airframes.json',OTTHI_GAME_LIVE_BASE));}finally{otGames.starting=false;}if(!response.ok)throw Error('Não foi possível carregar os veículos.');otGames.assets=await response.json();}
    const g=otGames;g.engineVoice?.dispose();g.engineVoice=['ground','balloon'].includes(mode)?null:window.GameAudio?.vehicleVoice(mode,mode);g.mode=mode;g.aircraftId=options.boarding?.id||mode;g.armed=mode!=='balloon'&&options.armed!==false;g.difficulty=['easy','normal','hard'].includes(options.difficulty)?options.difficulty:'normal';g.level={easy:{label:'INICIANTE',goal:6,damage:7,enemyRate:3.8},normal:{label:'NORMAL',goal:8,damage:10,enemyRate:2.9},hard:{label:'VETERANO',goal:10,damage:15,enemyRate:2.1}}[g.difficulty];
    state.ui.quickOpen=false;syncMobilePanels();
    g.entry={camera:camera.position.clone(),rotation:camera.quaternion.clone(),fov:camera.fov,playerVisible:playerGroup.visible,shadowVisible:contactShadow?.visible,toolVisible:toolVisual?.visible,position:{x:player.x,y:player.y,z:player.z},cameraYaw,cameraPitch,cameraZoom};
    savePlayerPosition(true);clearMovementInputs();otGamesClearInput();g.active=true;g.state='PLAYING';g.handMode=false;g.kills=0;g.goal=g.level.goal;g.wave=0;g.ammo=30;g.reserve=180;g.reload=0;g.cooldown=0;g.elapsed=0;g.resultSaved=false;g.notice='';g.lock=null;g.enemies=[];g.bullets=[];g.effects=[];
    g.noticeUntil=0;g.autoWalkSide=0;g.autoWalking=false;g.careerKey='thia:ot-games:combat:v1:'+(state.profile?.playerId||'local');g.group=new THREE.Group();g.group.name='OT_GAMES_COMBAT_SESSION';scene.add(g.group);
    const safe=safePointNear(player.x,player.z,{ignoreTraffic:true,allowWater:false,radius:.5});
    g.groundLaunch=!!options.groundLaunch&&mode!=='ground';g.onGround=g.groundLaunch;g.airspeed=mode==='plane'&&!g.groundLaunch?27:0;g.collective=g.groundLaunch&&mode==='plane'?0:.5;g.landingAssist=false;g.crouched=false;g.handViewAnchor=null;g.flightPhase=g.groundLaunch?'ready':'airborne';
    const boarding=options.boarding;if(g.groundLaunch&&boarding){safe.x=boarding.x;safe.z=boarding.z;safe.y=groundHeightAt(safe.x,safe.z);}
    g.body={x:safe.x,y:safe.y+(mode==='ground'?1.8:g.groundLaunch?campaignAircraftHeight(g.aircraftId):mode==='helicopter'?18:32),z:safe.z,yaw:boarding?.yaw??Math.PI-cameraYaw,pitch:0,roll:0,vx:0,vy:0,vz:0,hp:100};
    g.obstacles=(world.colliders||[]).filter(c=>!c.disabled).map(c=>new THREE.Box3(new THREE.Vector3(c.x-c.w/2,professionalTerrainHeightAt?.(c.x,c.z)||0,c.z-c.d/2),new THREE.Vector3(c.x+c.w/2,(professionalTerrainHeightAt?.(c.x,c.z)||0)+Number(c.height||c.h||6),c.z+c.d/2)));
    for(const house of world.houses||[])if(house.group)g.obstacles.push(new THREE.Box3().setFromObject(house.group));
    if(mode!=='ground'){g.aircraft=options.boarding?campaignCreateAircraft(g.aircraftId):otGamesAirframe(mode);g.group.add(g.aircraft);g.weapon=null;}else{g.aircraft=null;g.weapon=otGamesWeapon();g.group.add(g.weapon);}
    playerGroup.visible=false;if(contactShadow)contactShadow.visible=false;if(toolVisual)toolVisual.visible=false;
    document.body.classList.add('ot-games-active');document.body.dataset.otGameMode=mode;otGamesBuildControls();if(g.armed)otGamesSpawnWave();otGamesCamera(.1);return true;
  }
  function otGamesDisposeGroup(group){if(!group)return;const geometries=new Set(),materials=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.parent?.remove(group);}
  function otGamesLeave(options={}){
    const g=otGames;if(!g.active)return;g.engineVoice?.dispose();g.engineVoice=null;if(g.coverColliders)world.colliders=world.colliders.filter(c=>!g.coverColliders.includes(c));g.coverColliders=[];if(typeof campaignAbort==='function')campaignAbort({preserve:options?.preserveCampaign===true});g.cameraEpoch++;g.handSession?.dispose();g.handSession=null;g.handAim=null;g.cameraVideo?.srcObject?.getTracks().forEach(t=>t.stop());g.cameraVideo?.remove();g.cameraVideo=null;otGamesClearInput();g.lookCleanup?.();g.lookCleanup=null;g.inputResets=[];g.ui?.remove();g.ui=null;otGamesDisposeGroup(g.group);g.group=null;
    for(const [actor,until]of g.trafficHolds)actor.trafficHoldUntil=until;g.trafficHolds.clear();
    playerGroup.visible=g.entry.playerVisible;if(contactShadow)contactShadow.visible=g.entry.shadowVisible;if(toolVisual)toolVisual.visible=g.entry.toolVisible;camera.position.copy(g.entry.camera);camera.quaternion.copy(g.entry.rotation);camera.fov=g.entry.fov;camera.updateProjectionMatrix();cameraYaw=g.entry.cameraYaw;cameraPitch=g.entry.cameraPitch;cameraZoom=g.entry.cameraZoom;
    if(options.exitPoint){player.x=options.exitPoint.x;player.y=options.exitPoint.y;player.z=options.exitPoint.z;player.facing=g.body.yaw;player.vx=player.vy=player.vz=0;player.grounded=true;rememberSafePlayerPosition(true);savePlayerPosition(true);saveState(true);}
    g.handMode=false;g.active=false;g.mode='peace';g.body=null;g.enemies=[];g.bullets=[];g.effects=[];document.body.classList.remove('ot-games-active');delete document.body.dataset.otGameMode;clearMovementInputs();updateVisualLOD();updateCamera(.1);updateContext(true);
  }
  function otGamesBindPress(el,fn){let pressedAt=-Infinity;el?.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(el.disabled)return;pressedAt=performance.now();fn(e);});el?.addEventListener('click',e=>{e.preventDefault();if(!el.disabled&&performance.now()-pressedAt>650)fn(e);});}
  function otGamesCanLand(mode,b){
    if(!b||waterAt(b.x,b.z))return false;const radius=mode==='plane'?2.4:mode==='balloon'?1.3:1.4,base=groundHeightAt(b.x,b.z);
    for(const [dx,dz]of[[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius]]){const x=b.x+dx,z=b.z+dz;if(waterAt(x,z)||Math.abs(groundHeightAt(x,z)-base)>.35||positionBlockedForPlayer(x,z,.3,{ignoreTraffic:true}))return false;}
    if(mode==='helicopter'||mode==='balloon')return true;if(typeof campaignLandingZone==='function'&&campaignLandingZone(mode,b))return true;
    const aligned=(dx,dz)=>Math.abs(Math.sin(b.yaw)*dx+Math.cos(b.yaw)*dz)/Math.hypot(dx,dz)>.98;
    if(WORLD_LAYOUT_V704.roads.some(r=>{const horizontal=r.w>r.d;return Math.max(r.w,r.d)>=60&&Math.min(r.w,r.d)>=8&&v704PointInRect(b,r,-2)&&aligned(horizontal?1:0,horizontal?0:1);}))return true;
    return v704HighwaySegments().some(seg=>{const dx=seg.b.x-seg.a.x,dz=seg.b.z-seg.a.z;return Math.hypot(dx,dz)>=60&&seg.width>=8&&aligned(dx,dz)&&v704DistanceToSegment(b,seg.a,seg.b).distance<seg.width/2-2;});
  }
  function otGamesLandingAction(){const g=otGames;if(!g.active||g.mode==='ground')return;g.landingAssist=!g.landingAssist;g.move.x=g.move.y=0;g.pedal=0;if(g.mode==='plane'){g.collective=g.onGround?0:.18;toast('Reduza, alinhe-se à pista e desça suavemente. Após tocar o solo, reduza a potência até parar.','info',4200);}else if(!g.landingAssist)g.collective=.5;}
  function otGamesCanDisembark(){const g=otGames;return g.active&&g.mode!=='ground'&&g.onGround&&Math.hypot(g.body.vx||0,g.body.vz||0)<1.5&&Math.abs(g.body.vy||0)<1&&otGamesCanLand(g.mode,g.body);}
  function otGamesDisembark(){
    const g=otGames;if(!otGamesCanDisembark()){toast('Pouse em um local livre e pare para sair da aeronave.','warn',2500);return false;}
    const b=g.body,bounds=v704WorldBounds(),distance=g.mode==='plane'?6.5:5;let point;
    exitSearch:for(const turn of[Math.PI/2,-Math.PI/2,Math.PI,0])for(const extra of[0,2,4]){const x=b.x+Math.sin(b.yaw+turn)*(distance+extra),z=b.z+Math.cos(b.yaw+turn)*(distance+extra);if(x<bounds.minX+1||x>bounds.maxX-1||z<bounds.minZ+1||z>bounds.maxZ-1||waterAt(x,z)||positionBlockedForPlayer(x,z,.45,{ignoreTraffic:true}))continue;point={x,z,y:groundHeightAt(x,z)};break exitSearch;}
    if(!point){toast('Não há espaço seguro para desembarcar aqui.','warn',2400);return false;}
    campaignParkAircraft(g.aircraftId||g.mode,b);campaignPersist();otGamesLeave({exitPoint:point,preserveCampaign:true});updateFamilyCarry();toast('Aeronave estacionada. Aproxime-se dela para entrar novamente.','good',3300);return true;
  }
  function otGamesToggleCrouch(){if(otGames.mode!=='ground')return;otGames.crouched=!otGames.crouched;otGames.autoWalking=false;otGamesCamera(.016);otGamesUpdateHUD();}
  function otGamesReload(){const g=otGames;if(g.state!=='PLAYING'||g.reload>0||g.ammo>=30||g.reserve<=0)return;g.reload=1.6;if(state.settings?.sound!==false)window.GameAudio?.effect('reload');}
  async function otGamesStartCamera(){
    const g=otGames;if(!g.active||g.mode!=='ground')return;if(g.handSession){g.handSession.recalibrate();return;}
    g.state='HAND_CALIBRATION';g.handMode=true;g.ui?.classList.add('ot-hands');otGamesClearInput();
    const epoch=++g.cameraEpoch,current=()=>g.active&&g.mode==='ground'&&g.cameraEpoch===epoch;let stream;
    try{
      if(!document.querySelector('[data-ot-hand-style]')){const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('../ar/combat-controls.css?v='+encodeURIComponent(OTTHI_GAME_WEB_BUILD),OTTHI_GAME_LIVE_BASE).href;link.dataset.otHandStyle='true';document.head.append(link);}
      if(!window.WarBodyControl)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('assets/js/controls/world-body-controls.js?v='+encodeURIComponent(OTTHI_GAME_WEB_BUILD),OTTHI_GAME_LIVE_BASE).href;script.onload=resolve;script.onerror=reject;document.head.append(script);});
      if(!window.WarHandControl)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('assets/js/controls/world-hand-controls.js?v='+encodeURIComponent(OTTHI_GAME_WEB_BUILD),OTTHI_GAME_LIVE_BASE).href;script.onload=resolve;script.onerror=reject;document.head.append(script);});
      if(!current())return;
      stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'user'},width:{ideal:640},height:{ideal:480}},audio:false});
      if(!current()){stream.getTracks().forEach(t=>t.stop());return;}
      const video=g.cameraVideo=document.createElement('video');video.muted=true;video.playsInline=true;video.autoplay=true;video.className='war-camera-source';document.body.append(video);video.srcObject=stream;
      await new Promise((resolve,reject)=>{
        let done=false;const events=['loadeddata','canplay','playing'],finish=error=>{if(done)return;done=true;clearTimeout(timer);for(const event of events)video.removeEventListener(event,frame);error?reject(error):resolve();},frame=()=>{if(video.readyState>=2)finish();};
        const timer=setTimeout(()=>finish(Error('A câmera não forneceu imagens.')),5000);for(const event of events)video.addEventListener(event,frame);Promise.resolve(video.play()).then(frame,error=>finish(error));
      });
      if(!current()){stream.getTracks().forEach(t=>t.stop());return;}
      g.handSession=window.WarHandControl.start(g,{host:{video},isPaused:()=>paused||!running,onManual:()=>{video.srcObject?.getTracks().forEach(t=>t.stop());video.remove();g.cameraVideo=null;g.handMode=false;g.ui?.classList.remove('ot-hands');otGamesClearInput();}});
    }catch(error){stream?.getTracks().forEach(t=>t.stop());if(current()){g.cameraVideo?.remove();g.cameraVideo=null;g.handMode=false;g.ui?.classList.remove('ot-hands');g.state='PLAYING';toast('Câmera: '+(error?.message||'não foi possível iniciar')+'. Os controles continuam ativos.','warn',3000);}}
  }
  function otGamesBuildControls(){
    const g=otGames,root=g.ui=document.createElement('section');g.inputResets=[];g.aiming=false;root.id='ot-games-hud';root.setAttribute('aria-label','Controles OT Games');
    root.innerHTML='<header><button data-ot="menu">OT GAMES</button><span data-ot-status></span><button data-ot="peace">VOLTAR À PAZ</button></header><div class="ot-games-reticle" aria-label="Mira"><i></i><i></i></div><div class="ot-games-mission" role="status"></div><div class="ot-games-stick" data-ot="move" role="group" aria-label="'+(g.mode==='ground'?'Joystick de movimento':'Manche de voo')+'"><i></i><small>'+(g.mode==='ground'?'MOVER':'MANCHE')+'</small></div><button data-ot="fire">ATIRAR</button><button data-ot="reload">RECARREGAR</button><button data-ot="camera">CÂMERA FRONTAL</button><div class="ot-games-collective" data-ot="collective" role="slider" tabindex="0" aria-label="Coletivo: centro paira, acima sobe, abaixo desce" aria-valuemin="0" aria-valuemax="100"><i></i><small>COLETIVO</small></div><button data-ot="pedal-left">↶ PEDAL</button><button data-ot="pedal-right">PEDAL ↷</button>';
    root.insertAdjacentHTML('beforeend','<div class="ot-games-targets" aria-hidden="true"></div><div class="ot-games-result" hidden><strong></strong><p></p><button data-ot="retry">JOGAR NOVAMENTE</button></div>');
    root.insertAdjacentHTML('beforeend','<button data-ot="crouch" aria-pressed="false">ABAIXAR</button><button data-ot="land">POUSAR</button><button data-ot="disembark">SAIR DA AERONAVE</button>');
    root.insertAdjacentHTML('beforeend','<button data-ot="ads" aria-pressed="false">MIRAR</button>');
    document.body.append(root);otGamesBindPress(root.querySelector('[data-ot="peace"]'),()=>otGamesLeave());otGamesBindPress(root.querySelector('[data-ot="menu"]'),otGamesChoose);otGamesBindPress(root.querySelector('[data-ot="retry"]'),()=>typeof worldCampaign!=='undefined'&&worldCampaign.mission?campaignRetry():otGamesEnter(g.mode,{armed:g.armed,difficulty:g.difficulty}));
    otGamesBindPress(root.querySelector('[data-ot="camera"]'),otGamesStartCamera);
    otGamesBindPress(root.querySelector('[data-ot="crouch"]'),otGamesToggleCrouch);otGamesBindPress(root.querySelector('[data-ot="land"]'),otGamesLandingAction);otGamesBindPress(root.querySelector('[data-ot="disembark"]'),otGamesDisembark);
    root.querySelector('[data-ot="crouch"]').hidden=g.mode!=='ground';for(const name of ['land','disembark'])root.querySelector('[data-ot="'+name+'"]').hidden=g.mode==='ground';
    for(const name of ['ads','reload','camera'])root.querySelector('[data-ot="'+name+'"]').hidden=g.mode!=='ground';
    for(const name of ['collective','pedal-left','pedal-right'])root.querySelector('[data-ot="'+name+'"]').hidden=!['helicopter','balloon'].includes(g.mode)&&!(name==='collective'&&g.mode==='plane');
    if(g.mode==='plane'){const lever=root.querySelector('[data-ot="collective"]');lever.setAttribute('aria-label','Potência do avião: deslize para acelerar ou reduzir');lever.querySelector('small').textContent='POTÊNCIA';}
    if(g.mode==='balloon'){root.querySelector('[data-ot="move"] small').textContent='DESLOCAR';const lever=root.querySelector('[data-ot="collective"]');lever.setAttribute('aria-label','Aquecimento: acima do centro sobe, abaixo desce');lever.querySelector('small').textContent='AQUECER';}
    root.querySelector('[data-ot="fire"]').hidden=!g.armed;root.querySelector('[data-ot="reload"]').hidden=!g.armed||g.mode!=='ground';
    for(const [name,axis]of [['move',g.move]]){
      const el=root.querySelector('[data-ot="'+name+'"]');let owner=null;const release=()=>{owner=null;axis.x=axis.y=0;el.querySelector('i').style.transform='translate(-50%,-50%)';};
      g.inputResets.push(release);
      const move=e=>{if(owner!==e.pointerId)return;e.preventDefault();const r=el.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,mag=Math.hypot(dx,dy),radius=r.width*.34,n=Math.min(1,mag/radius),strength=Math.max(0,(n-.08)/.92);axis.x=mag?dx/mag*strength:0;axis.y=mag?-dy/mag*strength:0;el.querySelector('i').style.transform=`translate(calc(-50% + ${axis.x*radius}px),calc(-50% + ${-axis.y*radius}px))`;};
      el.addEventListener('pointerdown',e=>{e.preventDefault();if(owner!==null)return;owner=e.pointerId;safePointerCapture(el,e.pointerId);move(e);});el.addEventListener('pointermove',move);for(const type of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(type,e=>{if(owner===e.pointerId)release();});
    }
    function hold(name,down,up){const el=root.querySelector('[data-ot="'+name+'"]'),ids=new Set();g.inputResets.push(()=>{ids.clear();up?.()});el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(ids.has(e.pointerId))return;const first=!ids.size;ids.add(e.pointerId);safePointerCapture(el,e.pointerId);if(first)down();});for(const type of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(type,e=>{if(ids.delete(e.pointerId)&&!ids.size)up?.();});}
    hold('fire',()=>g.fire=true,()=>g.fire=false);hold('reload',otGamesReload);hold('pedal-left',()=>g.pedal=-1,()=>g.pedal=0);hold('pedal-right',()=>g.pedal=1,()=>g.pedal=0);
    hold('ads',()=>{if(g.state==='PLAYING'&&!g.handMode)g.aiming=!g.aiming});
    const lever=root.querySelector('[data-ot="collective"]');let owner=null;const change=e=>{if(owner!==e.pointerId)return;e.preventDefault();const r=lever.getBoundingClientRect();let value=clamp(1-(e.clientY-r.top-14)/(r.height-28),0,1);if(Math.abs(value-.5)<.05)value=.5;g.collective=value;};lever.addEventListener('pointerdown',e=>{e.preventDefault();if(owner!==null)return;owner=e.pointerId;safePointerCapture(lever,e.pointerId);change(e);});lever.addEventListener('pointermove',change);for(const type of ['pointerup','pointercancel','lostpointercapture'])lever.addEventListener(type,e=>{if(owner===e.pointerId)owner=null;});lever.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','Home'].includes(e.key)){e.preventDefault();g.collective=e.key==='Home'?.5:clamp(g.collective+(e.key==='ArrowUp'?.05:-.05),0,1);}});
    g.inputResets.push(()=>{owner=null});
    const surface=typeof renderer!=='undefined'?renderer?.domElement:null;
    if(surface){
      let lookOwner=null,lastX=0,lastY=0;const end=()=>{lookOwner=null;g.looking=false};g.inputResets.push(end);
      const down=e=>{if(g.active)e.stopPropagation();if(g.mode!=='ground'||g.handMode||paused||g.state!=='PLAYING'||lookOwner!==null||(e.pointerType==='mouse'&&e.button!==0)||e.clientX<surface.getBoundingClientRect().left+surface.getBoundingClientRect().width*.45)return;e.preventDefault();lookOwner=e.pointerId;lastX=e.clientX;lastY=e.clientY;g.looking=true;safePointerCapture(surface,e.pointerId)};
      const move=e=>{if(lookOwner!==e.pointerId)return;if(!g.active||g.handMode||paused||g.state!=='PLAYING'){end();return;}e.preventDefault();e.stopPropagation();const r=surface.getBoundingClientRect(),scale=1.6/(Math.min(r.width,r.height)*.88*(g.aiming?1.65:1));g.body.yaw-=(e.clientX-lastX)*scale;g.body.pitch=clamp(g.body.pitch-(e.clientY-lastY)*scale,-.85,.85);lastX=e.clientX;lastY=e.clientY;otGamesCamera(.016)};
      const release=e=>{if(lookOwner===e.pointerId)end()};surface.addEventListener('pointerdown',down);surface.addEventListener('pointermove',move);for(const type of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(type,release);
      g.lookCleanup=()=>{end();surface.removeEventListener('pointerdown',down);surface.removeEventListener('pointermove',move);for(const type of ['pointerup','pointercancel','lostpointercapture'])surface.removeEventListener(type,release)};
    }
  }
  function otGamesCamera(dt){
    const g=otGames;if(!g.active)return false;const b=g.body,forward=new THREE.Vector3(Math.sin(b.yaw)*Math.cos(b.pitch),Math.sin(b.pitch),Math.cos(b.yaw)*Math.cos(b.pitch));
    if(g.mode==='ground'){camera.position.set(b.x,b.y,b.z);camera.up.set(0,1,0);camera.lookAt(new THREE.Vector3(b.x,b.y,b.z).add(forward));camera.fov=g.aiming?46:70;}
    else{const distance=g.mode==='balloon'?(innerHeight>innerWidth?27:22):g.aircraftId==='plane-cargo'?23:g.mode==='helicopter'?10:14,position=new THREE.Vector3(b.x,b.y,b.z).addScaledVector(forward,-distance);position.y+=g.mode==='balloon'?9:3.2;camera.position.lerp(position,1-Math.exp(-dt*9));camera.up.set(0,1,0);camera.lookAt(new THREE.Vector3(b.x,b.y+(g.mode==='balloon'?4.4:0),b.z).addScaledVector(forward,g.mode==='balloon'?3:28));camera.fov=66;}
    camera.updateProjectionMatrix();
    if(g.weapon){
      const kick=Math.max(0,g.cooldown/.15);const offset=new THREE.Vector3(g.aiming?0:.18,(g.aiming?-.105:-.17)-(g.reload>0?.16:0),g.aiming?-.49:-.55+kick*.025).applyQuaternion(camera.quaternion);g.weapon.position.copy(camera.position).add(offset);
      // In camera-hand mode the camera itself follows the fingers; gun and reticle
      // stay aligned with the camera centre. Never apply a second angular offset.
      g.weapon.quaternion.copy(camera.quaternion);
      g.weapon.userData.flash.visible=g.cooldown>.10&&g.state==='PLAYING';
    }
    return true;
  }
  function updateOtGames(dt){
    const g=otGames;if(!g.active)return;if(g.handSession?.controller)g.handAim=g.handSession.controller.read(performance.now());g.autoWalking=false;
    if(g.state!=='PLAYING'||(g.handSession&&!g.handAim?.fresh)){if(g.handSession&&!g.handAim?.present)g.lock=null;otGamesUpdateHUD();return;}
    const b=g.body,k=g.keys,handOnly=g.mode==='ground'&&g.handMode,x=handOnly?0:clamp(g.move.x+Number(k.has('KeyD')||k.has('ArrowRight'))-Number(k.has('KeyA')||k.has('ArrowLeft')),-1,1),y=handOnly?0:clamp(g.move.y+Number(k.has('KeyW')||k.has('ArrowUp'))-Number(k.has('KeyS')||k.has('ArrowDown')),-1,1),blend=1-Math.exp(-dt*4),bounds=v704WorldBounds();g.elapsed+=dt;g.cooldown=Math.max(0,g.cooldown-dt);
    if(g.reload>0){g.reload=Math.max(0,g.reload-dt);if(g.reload===0){const n=Math.min(30-g.ammo,g.reserve);g.ammo+=n;g.reserve-=n;}}
    const before={x:b.x,y:b.y,z:b.z};
    if(g.mode==='ground'){
      // Joystick only for manual mode. Hand mode is controlled exclusively
      // by the right-hand tracker used in WAR.
      if(!g.handMode){
        b.yaw-=g.aim.x*dt*1.8;
        b.pitch=clamp(b.pitch+g.aim.y*dt*1.2,-.85,.85);
      }
      if(g.handMode&&g.handSession&&g.handAim?.fresh){
        const a=g.handAim,calibration=a.calibration||0;if(!g.handViewAnchor||g.handViewAnchor.calibration!==calibration)g.handViewAnchor={yaw:b.yaw,pitch:b.pitch,calibration};
        const offset=a.x-.5,body=g.bodyPose?.fresh?g.bodyPose:null;b.yaw=g.handViewAnchor.yaw-(offset*1.7+Math.sign(offset)*Math.pow(Math.max(0,Math.abs(offset)-.30)/.20,2)*2.2)-(body?.turnYaw||0)*.65-(body?.lean||0)*.30;b.pitch=clamp(g.handViewAnchor.pitch+(.48-a.y)*2.2,-1.05,1.05);
      }
      let mx=x,my=y,speed=g.crouched?2.2:5;const free=(px,pz)=>!positionBlockedForPlayer(px,pz,.45,{ignoreTraffic:true});
      if(g.handMode&&g.handSession){const body=g.bodyPose?.fresh?g.bodyPose:null;mx=body?.moveX||0;my=body?.moveZ||0;g.crouched=!!body?.crouched;speed=g.crouched?2.2:5;}
      const n=Math.max(1,Math.hypot(mx,my)),nx=b.x+(-Math.cos(b.yaw)*mx+Math.sin(b.yaw)*my)/n*speed*dt,nz=b.z+(Math.sin(b.yaw)*mx+Math.cos(b.yaw)*my)/n*speed*dt;
      if(free(nx,nz)){b.x=nx;b.z=nz;g.autoWalking=!!g.handSession&&!!(mx||my);}b.y=groundHeightAt(b.x,b.z)+(g.crouched?1.05:1.8);
    }else if(g.mode==='balloon'){
      const heat=clamp(g.collective+(k.has('KeyE')?.2:0)-(k.has('KeyQ')?.2:0),0,1),wind=g.onGround||g.landingAssist?0:1;
      if(g.landingAssist){g.collective=.28;g.move.x=g.move.y=0;g.pedal=0;}
      b.yaw-=(g.pedal||0)*dt*.65;const mx=g.landingAssist?0:x,my=g.landingAssist?0:y;
      const dx=(Math.sin(b.yaw)*my-Math.cos(b.yaw)*mx)*3.4+wind*.32*Math.sin(g.elapsed*.12),dz=(Math.cos(b.yaw)*my+Math.sin(b.yaw)*mx)*3.4+wind*.28*Math.cos(g.elapsed*.10);
      b.vx+=(dx-b.vx)*blend;b.vz+=(dz-b.vz)*blend;b.vy+=((g.landingAssist?-1.5:(heat-.5)*6)-b.vy)*blend;
      b.x+=b.vx*dt;b.z+=b.vz*dt;b.y+=b.vy*dt;b.roll=Math.sin(g.elapsed*.6)*.018;b.pitch=Math.cos(g.elapsed*.5)*.012;
    }else if(g.mode==='helicopter'){
      b.yaw-=(g.pedal||x*.65)*dt;const dx=Math.sin(b.yaw)*y*13-Math.cos(b.yaw)*x*6,dz=Math.cos(b.yaw)*y*13+Math.sin(b.yaw)*x*6;b.vx+=(dx-b.vx)*blend;b.vz+=(dz-b.vz)*blend;
      if(g.landingAssist){g.collective=g.onGround?.5:.34;g.move.x=g.move.y=0;g.pedal=0;}
      const collective=clamp(g.collective+(k.has('KeyE')?.2:0)-(k.has('KeyQ')?.2:0),0,1);b.vy+=((collective-.5)*18-b.vy)*blend;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.roll+=(x*.34-b.roll)*blend;b.pitch+=(-y*.18-b.pitch)*blend;
    }else if(g.onGround){
      const desired=g.collective*35;g.airspeed+=clamp(desired-g.airspeed,-7*dt,6*dt);b.yaw-=x*dt*.7;b.roll=0;b.pitch*=Math.exp(-dt*5);b.vx=Math.sin(b.yaw)*g.airspeed;b.vz=Math.cos(b.yaw)*g.airspeed;b.vy=0;b.x+=b.vx*dt;b.z+=b.vz*dt;b.y=groundHeightAt(b.x,b.z)+1.3;
      g.flightPhase=g.airspeed>1?'runway':'ready';
      if(g.airspeed>=15&&y>.12){g.onGround=false;g.flightPhase='airborne';b.pitch=.10;}
    }else{
      b.roll+=(x*.65-b.roll)*blend;b.pitch=clamp(b.pitch+y*dt*.52,-.75,.75);b.yaw-=b.roll*dt*.8;
      g.airspeed+=clamp((12+g.collective*28)-g.airspeed,-6*dt,5*dt);
      const speed=g.airspeed;b.vx=Math.sin(b.yaw)*Math.cos(b.pitch)*speed;b.vz=Math.cos(b.yaw)*Math.cos(b.pitch)*speed;b.vy=Math.sin(b.pitch)*speed;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;
    }
    if(g.mode!=='ground'){
      const floor=groundHeightAt(b.x,b.z)+campaignAircraftHeight(g.aircraftId||g.mode),landable=otGamesCanLand(g.mode,b);
      if(g.mode==='helicopter'||g.mode==='balloon'){g.onGround=g.collective<=.52&&b.y<=floor+.12&&b.vy<=.8&&Math.hypot(b.vx,b.vz)<3&&landable;g.flightPhase=g.onGround?'landed':'airborne';if(g.onGround){b.y=floor;b.vy=0;if(g.landingAssist){g.collective=.5;g.landingAssist=false;}}}
      if(g.mode==='plane'&&!g.onGround&&b.y<=floor+.15&&b.vy<=0&&b.vy>-6&&g.airspeed<24&&Math.abs(b.roll)<.22&&Math.abs(b.pitch)<.22&&landable){g.onGround=true;g.flightPhase='landed';b.y=floor;b.vy=0;b.pitch=0;}
      if(b.y<floor){b.y=floor;b.vy=0;if(g.armed&&!g.onGround)b.hp=Math.max(0,b.hp-18*dt);}
      b.y=clamp(b.y,floor,100);
      if(g.obstacles.some(box=>box.containsPoint(new THREE.Vector3(b.x,b.y,b.z)))){b.x=before.x;b.z=before.z;b.vx=b.vz=0;if(g.armed)b.hp=Math.max(0,b.hp-28*dt);}
      if(b.x<bounds.minX+4||b.x>bounds.maxX-4||b.z<bounds.minZ+4||b.z>bounds.maxZ-4){g.notice='LIMITE DO MAPA · VIRE PARA O BAIRRO';b.yaw+=dt*1.4;}else g.notice='';
      if(g.aircraft){g.aircraft.position.set(b.x,b.y,b.z);g.aircraft.rotation.order='YXZ';g.aircraft.rotation.set(-b.pitch,b.yaw,b.roll);for(const r of g.aircraft.userData.rotors||[])r.group.rotation[r.axis]=g.elapsed*r.speed;const flame=g.aircraft.userData.flame;if(flame){flame.visible=g.collective>.52;flame.scale.y=.65+g.collective*.7;}const rotor=g.aircraft.getObjectByName('rotor'),tail=g.aircraft.getObjectByName('tail');if(rotor)rotor.rotation.y=g.elapsed*35;if(tail)tail.rotation.x=g.elapsed*65;}
    }
    g.engineVoice?.update(Math.hypot(b.vx,b.vz),g.collective,false,state.settings.sound&&!paused);
    b.x=clamp(b.x,bounds.minX+2,bounds.maxX-2);b.z=clamp(b.z,bounds.minZ+2,bounds.maxZ-2);otGamesCamera(dt);
    if(g.armed){
      for(const e of g.enemies)if(!e.active&&e.model&&e.fallAt!==undefined){const age=g.elapsed-e.fallAt;OTCombatArt.animate(e.model,{time:g.elapsed,fall:Math.min(1,age*2.4)});e.group.visible=age<8;}
      const ray=camera.getWorldDirection(new THREE.Vector3()),origin=g.mode==='ground'?camera.position.clone():new THREE.Vector3(b.x,b.y-.4,b.z);let target=null,best=Infinity;
      for(const e of g.enemies){
        if(!e.active)continue;e.aim-=dt;e.hit=Math.max(0,e.hit-dt);e.group.rotation.y=Math.atan2(b.x-e.x,b.z-e.z);
        if(e.kind==='drone'){e.y=(e.baseY??groundHeightAt(e.x,e.z)+9)+Math.sin(g.elapsed+e.phase);e.group.position.y=e.y;for(const [i,rotor]of e.rotors.entries())rotor.rotation.y=g.elapsed*35*(i%2?1:-1);}
        else if(e.legs){
          // Infantry advances in the physical map, stopping at cover and collision bounds.
          const distanceToPlayer=Math.hypot(b.x-e.x,b.z-e.z);
          const stride=distanceToPlayer>17&&distanceToPlayer<75?Math.min(dt*2.2,distanceToPlayer-17):0;
          let walking=false;
          if(stride>0){
            const angle=Math.atan2(b.x-e.x,b.z-e.z),nx=e.x+Math.sin(angle)*stride,nz=e.z+Math.cos(angle)*stride;
            if(!waterAt(nx,nz)&&!positionBlockedForPlayer(nx,nz,.58,{ignoreTraffic:true})){
              e.x=nx;e.z=nz;e.group.position.set(nx,groundHeightAt(nx,nz),nz);e.y=e.group.position.y+1.15;
              e.walkPhase=(e.walkPhase||e.phase)+dt*6;walking=true;
            }
          }
          const sway=walking?1:0;
          if(e.model)OTCombatArt.animate(e.model,{time:g.elapsed+e.phase,speed:walking?2.2:0,crouched:e.aim<.6||e.hp<40,firing:g.elapsed<(e.firedUntil||0),hit:e.hit});
          if(e.rigid)e.rigid.position.y=walking?Math.abs(Math.sin(e.walkPhase))*.028:0;
        }
        if(e.rigid)e.rigid.material.emissive.setHex(e.hit>0?0x4c2416:0x000000);
        const to=new THREE.Vector3(e.x-origin.x,e.y-origin.y,e.z-origin.z),distance=to.length(),angle=Math.acos(clamp(to.normalize().dot(ray),-1,1)),cone=g.handAim?Math.atan2(e.radius,distance)+.007:g.mode==='helicopter'?.49:g.mode==='plane'?.18:.035+Math.atan2(e.radius,distance);
        if(distance<170&&angle<cone&&angle<best&&!otGamesBlocked(origin,e)){target=e;best=angle;}
        if(e.aim<=0){e.firedUntil=g.elapsed+.09;e.aim=g.level.enemyRate+Math.sin(e.phase)*.3;if(distance<110&&!otGamesBlocked(e,b)){const start=new THREE.Vector3(e.x,e.y,e.z),direction=new THREE.Vector3(b.x,b.y,b.z).sub(start).normalize();otGamesShot(start,direction,true);}}
      }
      if(target&&g.lock?.target===target)g.lock.time=Math.max(g.lock.time+dt,g.handAim?Math.max(0,((g.handAim.timestamp||0)-g.lock.firstSample)/1000):0);else g.lock=target?{target,time:0,firstSample:g.handAim?.timestamp||0}:null;
      const locked=!!g.lock&&(!g.handSession||(g.handAim?.timestamp||0)>g.lock.firstSample)&&g.lock.time>=(g.mode==='ground'?.12:g.mode==='helicopter'?.3:.25),auto=!!g.handSession||g.mode!=='ground';
      if(((auto&&locked)||(!auto&&(g.fire||k.has('Space'))))&&g.cooldown===0&&g.reload===0){
        if(g.ammo===0)otGamesReload();else{
          g.ammo--;g.cooldown=.15;const lead=locked?new THREE.Vector3(target.x,target.y,target.z).sub(origin).normalize():ray.clone();otGamesShot(origin,lead);
        }
      }
      for(const bullet of g.bullets){
        const old={x:bullet.x,y:bullet.y,z:bullet.z};bullet.x+=bullet.vx*dt;bullet.y+=bullet.vy*dt;bullet.z+=bullet.vz*dt;bullet.life-=dt;bullet.mesh.position.set(bullet.x,bullet.y,bullet.z);
        if(otGamesBlocked(old,bullet)){bullet.life=0;continue;}
        if(bullet.enemy){if(otGamesSegmentDistance(old,bullet,b)<.8){b.hp=Math.max(0,b.hp-g.level.damage);bullet.life=0;}}
        else for(const e of g.enemies)if(e.active&&otGamesSegmentDistance(old,bullet,e)<e.radius){otGamesDamage(e,bullet.damage);bullet.life=0;break;}
      }
      for(const bullet of g.bullets.filter(b=>b.life<=0))otGamesDisposeGroup(bullet.mesh);g.bullets=g.bullets.filter(b=>b.life>0);
      if(b.hp<=0){g.state='DEFEAT';otGamesSaveResult(false);}
      else if(g.kills>=g.goal){g.state='VICTORY';otGamesSaveResult(true);}
      else if(!g.enemies.some(e=>e.active))otGamesSpawnWave();
    }
    for(const fx of g.effects){fx.age+=dt;fx.life-=dt;fx.x+=fx.vx*dt;fx.y+=fx.vy*dt;fx.z+=fx.vz*dt;fx.mesh.position.set(fx.x,fx.y,fx.z);fx.mesh.scale.setScalar((fx.smoke?.3+fx.age*.5:1-fx.age)*1.2);}
    for(const fx of g.effects.filter(f=>f.life<=0))otGamesDisposeGroup(fx.mesh);g.effects=g.effects.filter(f=>f.life>0);otGamesUpdateHUD();
  }
  function otGamesUpdateHUD(){
    const g=otGames;if(!g.ui)return;g.ui.querySelector('[data-ot-status]').textContent=otGameModes[g.mode]+' · '+(g.armed?'VIDA '+Math.ceil(g.body.hp)+' · '+(g.reload>0?'RECARREGANDO':g.ammo+'/'+g.reserve):'PASSEIO DE PAZ');
    g.ui.querySelector('.ot-games-mission').textContent=g.state==='VICTORY'?'MISSÃO CONCLUÍDA · '+g.kills+'/'+g.goal+' ALVOS':g.state==='DEFEAT'?'MISSÃO ENCERRADA · VOLTE AO MENU PARA TENTAR NOVAMENTE':g.notice||(g.armed?'MISSÃO SOLO · SETOR '+g.wave+' · '+g.kills+'/'+g.goal+' ALVOS · '+g.level.label:'Explore o mesmo bairro por cima. Voltar à paz retorna à sua família.');
    if(g.noticeUntil&&g.elapsed>g.noticeUntil){g.notice='';g.noticeUntil=0;}
    const live=g.enemies.filter(e=>e.active),next=live.slice().sort((a,b)=>Math.hypot(a.x-g.body.x,a.z-g.body.z)-Math.hypot(b.x-g.body.x,b.z-g.body.z))[0];
    if(next&&g.state==='PLAYING'){const bearing=Math.atan2(Math.sin(Math.atan2(next.x-g.body.x,next.z-g.body.z)-g.body.yaw),Math.cos(Math.atan2(next.x-g.body.x,next.z-g.body.z)-g.body.yaw)),pitch=Math.atan2(next.y-g.body.y,Math.hypot(next.x-g.body.x,next.z-g.body.z))-g.body.pitch;let hint=Math.abs(bearing)>.5?(bearing>0?'VIRE À DIREITA →':'← VIRE À ESQUERDA'):Math.abs(pitch)>.22?(pitch>0?'ALVO ACIMA ↑':'ALVO ABAIXO ↓'):'';if(g.handSession&&!g.handAim?.fresh)hint='MOSTRE A MÃO · MOVIMENTO E TIRO PAUSADOS';else if(g.autoWalking)hint='PASSOS DO CORPO · MIRA PELA MÃO';if(hint)g.ui.querySelector('.ot-games-mission').textContent+=' · '+hint;}
    const reticle=g.ui.querySelector('.ot-games-reticle');reticle.hidden=!g.armed;reticle.classList.toggle('hit-confirm',g.elapsed<(g.hitMarkerUntil||0));reticle.classList.toggle('locked',!!g.lock&&g.lock.time>.3);reticle.style.left='50%';reticle.style.top='50%';
    const targets=g.ui.querySelector('.ot-games-targets'),primary=g.lock?.target||next;
    for(const marker of targets.children)if(!live.some(e=>e.id===marker.dataset.target))marker.remove();
    for(const e of live){
      let marker=targets.querySelector('[data-target="'+e.id+'"]');if(!marker){marker=document.createElement('span');marker.dataset.target=e.id;targets.append(marker);}
      const p=new THREE.Vector3(e.x,e.y+(e.kind==='tank'?2:1.5),e.z).project(camera),top=(-p.y*.5+.5)*g.ui.clientHeight,visible=p.z>-1&&p.z<1&&Math.abs(p.x)<.94&&Math.abs(p.y)<.74&&top>100&&!otGamesBlocked(g.body,e);
      marker.hidden=!visible;marker.classList.toggle('secondary',e!==primary);marker.style.left=(p.x*.5+.5)*100+'%';marker.style.top=(-p.y*.5+.5)*100+'%';marker.textContent=e===primary?(e.kind==='tank'?'BLINDADO':e.kind==='drone'?'DRONE':'ALVO')+' · '+Math.round(Math.hypot(e.x-g.body.x,e.z-g.body.z))+' m':'';
    }
    const result=g.ui.querySelector('.ot-games-result');result.hidden=!['VICTORY','DEFEAT','SPAWN_BLOCKED'].includes(g.state);result.querySelector('strong').textContent=g.state==='VICTORY'?'MISSÃO CONCLUÍDA':g.state==='DEFEAT'?'TENTE NOVAMENTE':'ÁREA SEM SETOR LIVRE';result.querySelector('p').textContent=g.kills+'/'+g.goal+' alvos · '+(g.state==='VICTORY'?'Vitória salva. Escolha outra missão ou volte à família.':g.notice||'Use a cobertura das casas e alinhe a mira antes de disparar.');
    g.ui.classList.toggle('ot-hands',!!g.handMode);g.ui.querySelector('[data-ot="camera"]').textContent=g.handSession?'CALIBRAR MÃO':'CÂMERA FRONTAL';const lever=g.ui.querySelector('[data-ot="collective"]');lever.setAttribute('aria-valuenow',Math.round(g.collective*100));lever.querySelector('i').style.top=(14+(1-g.collective)*(lever.clientHeight-28))+'px';
    if(g.mode==='plane')g.ui.querySelector('[data-ot-status]').textContent='AVIÃO · '+Math.round(g.airspeed*3.6)+' km/h · '+(g.onGround?'NA PISTA':'EM VOO');
    const leave=g.ui.querySelector('[data-ot="disembark"]');leave.disabled=!otGamesCanDisembark();const crew=g.ui.querySelector('[data-ot="crew"]');if(crew){crew.hidden=typeof remotePresence==='undefined'||remotePresence.size===0;crew.disabled=!g.onGround;}const land=g.ui.querySelector('[data-ot="land"]');land.disabled=!!g.onGround;land.textContent=g.onGround?'NO SOLO':g.landingAssist?'CANCELAR POUSO':'POUSAR';land.setAttribute('aria-pressed',String(!!g.landingAssist));const crouch=g.ui.querySelector('[data-ot="crouch"]');crouch.textContent=g.crouched?'LEVANTAR':'ABAIXAR';crouch.setAttribute('aria-pressed',String(!!g.crouched));
    const ads=g.ui.querySelector('[data-ot="ads"]');ads.setAttribute('aria-pressed',String(!!g.aiming));ads.classList.toggle('selected',!!g.aiming);
  }
  function otGamesChoose(){
    if(!running||document.getElementById('ot-games-choose'))return;const previousPaused=paused;paused=true;otGamesClearInput();clearMovementInputs();const dialog=document.createElement('section');dialog.id='ot-games-choose';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Escolha seu modo OT Games');
    dialog.innerHTML='<div><small>UM MUNDO · VÁRIAS FORMAS DE JOGAR</small><h2>OT GAMES</h2><p>As mesmas ruas, casas e trânsito do seu mundo.</p><div class="ot-games-mode-grid">'+Object.entries(otGameModes).map(([id,name])=>'<button data-ot-mode="'+id+'">'+({peace:'🌳',ground:'🎯',plane:'✈️',helicopter:'🚁',balloon:'🎈'}[id])+'<strong>'+name+'</strong></button>').join('')+'</div><label><input type="checkbox" data-ot-armed checked> Missão de combate solo (desmarque para passeio de paz)</label><label>Dificuldade <select data-ot-difficulty><option value="easy">Iniciante</option><option value="normal" selected>Normal</option><option value="hard">Veterano</option></select></label><p class="ot-games-help">A pé: mover + mirar + atirar. Na câmera frontal, calibre corpo + mãos ou o brinquedo: vire o tronco e a mão para mirar, dê passos para andar e agache para abaixar. Sem movimento para a frente obrigatório. Complete todos os alvos marcados para vencer. Helicóptero: manche + coletivo + pedais. Avião: manche e curvas. A mira alinhada trava o alvo antes de disparar.</p><button data-ot-close>CONTINUAR JOGO ATUAL</button></div>';
    document.body.append(dialog);const close=()=>{dialog.remove();paused=previousPaused;};dialog.querySelector('[data-ot-close]').onclick=close;
    for(const button of dialog.querySelectorAll('[data-ot-mode]'))button.onclick=async()=>{const mode=button.dataset.otMode,armed=dialog.querySelector('[data-ot-armed]').checked,difficulty=dialog.querySelector('select').value;close();try{await otGamesEnter(mode,{armed,difficulty});}catch(error){toast(error.message||'Não foi possível iniciar este modo.','warn',3500);}};
    dialog.querySelector('[data-ot-mode="peace"]').focus();dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}if(e.key==='Tab'){const a=[...dialog.querySelectorAll('button,input,select')],first=a[0],last=a.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  }
  function otGamesInit(){
    const button=document.createElement('button');button.id='ot-games-button';button.innerHTML='<b aria-hidden="true">OT</b><span>Games</span>';button.type='button';button.setAttribute('aria-label','OT Games: combate, avião e helicóptero');button.onclick=()=>{state.ui.quickOpen=false;syncMobilePanels();otGamesChoose();};document.getElementById('quickBar').prepend(button);
    window.addEventListener('blur',otGamesClearInput);window.addEventListener('resize',otGamesClearInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)otGamesClearInput();});
    for(const type of ['keydown','keyup'])window.addEventListener(type,e=>{
      if(!otGames.active||e.target.closest?.('input,select,button')||document.getElementById('ot-games-choose'))return;
      if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyQ','KeyE','KeyR','KeyC','Escape','ShiftLeft'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();if(type==='keydown'){otGames.keys.add(e.code);if(e.code==='KeyR')otGamesReload();if(e.code==='KeyC'&&!e.repeat)otGamesToggleCrouch();if(e.code==='Escape')otGamesChoose();}else otGames.keys.delete(e.code);}
    },true);
  }
  window.OT_GAMES={open:otGamesChoose,enter:otGamesEnter,peace:otGamesLeave,disembark:otGamesDisembark,canDisembark:otGamesCanDisembark,land:otGamesLandingAction,diagnostics:()=>({active:otGames.active,mode:otGames.mode,armed:otGames.armed,state:otGames.state,elapsed:otGames.elapsed,onGround:!!otGames.onGround,crouched:!!otGames.crouched,canDisembark:otGamesCanDisembark(),landingAssist:!!otGames.landingAssist,flightPhase:otGames.flightPhase,aircraftId:otGames.aircraftId,airspeed:otGames.airspeed,collective:otGames.collective,aiming:!!otGames.aiming,looking:!!otGames.looking,handMode:!!otGames.handMode,handTracker:otGames.handSession?{inferenceMs:otGames.handSession.lastInferenceMs,hands:otGames.handSession.lastHandCount,state:otGames.handSession.controller?.state}:null,handAim:otGames.handAim?{x:otGames.handAim.x,y:otGames.handAim.y,fresh:otGames.handAim.fresh,present:otGames.handAim.present}:null,autoWalking:otGames.autoWalking,lock:otGames.lock?{id:otGames.lock.target.id,time:otGames.lock.time}:null,kills:otGames.kills,wave:otGames.wave,goal:otGames.goal,ammo:otGames.ammo,body:otGames.body?{...otGames.body}:null,peacePosition:{x:player.x,y:player.y,z:player.z},enemies:otGames.enemies.map(e=>({id:e.id,kind:e.kind,active:e.active,hp:e.hp,x:e.x,y:e.y,z:e.z,lineOfSight:otGames.active&&!otGamesBlocked(otGames.body,e)})),sameScene:!!otGames.group&&otGames.group.parent===scene,trafficActors:trafficActorList().length,weapon:!!otGames.weapon&&otGames.active&&otGames.mode==='ground',artVersion:window.OTCombatArt?.version,infantryVersions:otGames.enemies.filter(e=>e.kind==='soldier').map(e=>e.renderVersion),engine:otGames.engineVoice?.diagnostics()||null,renderCalls:renderer?.info?.render?.calls||0})};
  otGamesInit();

/** OT Games: the original OT scene is shared by peace, ground and air modes.
 * Combat has its own body, entities and local career. The family/world save and
 * online peaceful room never receive combat coordinates or combat rewards. */
// @otthi-module-body
  const otGames={mode:'peace',active:false,armed:false,body:null,group:null,enemies:[],bullets:[],effects:[],keys:new Set(),move:{x:0,y:0},aim:{x:0,y:0},collective:.5,pedal:0,fire:false,cameraEpoch:0,handSession:null,handAim:null,state:'PLAYING',assets:null,elapsed:0,ui:null,entry:null,trafficHolds:new Map()};
  const otGameModes={peace:'Mundo de paz',ground:'WAR · a pé',plane:'Avião',helicopter:'Helicóptero'};
  function otGamesFocus(){return otGames.active&&otGames.body?otGames.body:player;}
  function otGamesClearInput(){otGames.keys.clear();otGames.move.x=otGames.move.y=otGames.aim.x=otGames.aim.y=0;otGames.fire=false;otGames.pedal=0;otGames.collective=.5;otGames.handAim&&(otGames.handAim.fresh=false);}
  function otGamesMesh(kind,color,x,y,z,w,h,d,parent){
    const geometry=kind==='round'?new THREE.SphereGeometry(1,12,8):kind==='cylinder'?new THREE.CylinderGeometry(.5,.5,1,12):new THREE.BoxGeometry(1,1,1);
    const material=new THREE.MeshStandardMaterial({color,roughness:.74,metalness:kind==='round'?.12:.25});
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function otGamesAirframe(mode){
    const model=mode==='helicopter'?'kestrel':'falcon',root=new THREE.Group(),parts=new Map();
    for(const face of otGames.assets[model]){
      const kind=face.rotor?'rotor':face.tailRotor?'tail':'hull';if(!parts.has(kind))parts.set(kind,{positions:[],colors:[]});const part=parts.get(kind),v=face.vertices;
      const color=new THREE.Color(...face.color.map(n=>n/255)).convertSRGBToLinear();
      for(let i=1;i<v.length-1;i++)for(const point of [v[0],v[i],v[i+1]]){part.positions.push(...point);part.colors.push(color.r,color.g,color.b);}
    }
    for(const [name,part]of parts){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(part.positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(part.colors,3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.32,side:THREE.DoubleSide}));mesh.name=name;mesh.castShadow=true;root.add(mesh);}
    root.scale.setScalar(mode==='helicopter'?.075:.10);return root;
  }
  function otGamesWeapon(){
    const root=new THREE.Group(),parts=new THREE.Group();root.add(parts);
    const box=(color,x,y,z,w,h,d)=>otGamesMesh('box',color,x,y,z,w,h,d,parts);
    box('#304650',0,0,-.18,.13,.12,.6);box('#607b80',0,.075,-.2,.09,.03,.4);box('#19313c',0,-.10,-.02,.08,.2,.1);box('#354e56',0,-.13,-.23,.085,.20,.11);box('#47636c',0,0,.12,.14,.17,.25);box('#172c37',0,.10,-.28,.025,.06,.025);box('#203743',0,.04,-.56,.04,.04,.3);
    for(const side of [-1,1])otGamesMesh('round','#3f5b58',side*.1,-.08,-.12,.08,.08,.15,parts);
    const flash=otGamesMesh('round','#ffe4a5',0,.03,-.74,.09,.08,.13,parts);flash.visible=false;root.userData.flash=flash;
    root.traverse(o=>{if(o.material){o.material.depthTest=false;o.material.depthWrite=false;o.renderOrder=990;}});return root;
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
      for(const side of [-1,1])for(const end of [-1,1]){box('#263e49',side*.8,0,end*.65,1.3,.1,.1);box('#526c79',side*1.1,.18,end*.65,1.1,.03,.15);}
    }else{
      // Articulated infantry, closed volumes and visible equipment.
      for(const side of [-1,1]){
        const leg=new THREE.Group();leg.position.set(side*.2,.85,0);group.add(leg);otGamesMesh('cylinder','#374a51',0,-.4,0,.32,.8,.32,leg);otGamesMesh('round','#1e2d32',0,-.71,.09,.2,.17,.29,leg);(e.legs||(e.legs=[])).push(leg);
        round('#5b6f66',side*.47,1.45,0,.18,.2,.18);const arm=otGamesMesh('cylinder','#667767',side*.42,1.2,.14,.24,.55,.24,group);arm.rotation.x=-.65;round('#243944',side*.32,1.02,.35,.13,.12,.16);
      }
      round('#71816a',0,1.3,0,.44,.5,.28);box('#364d4c',0,1.26,.25,.65,.6,.16);for(const side of [-1,1])box('#849681',side*.18,1.15,.35,.21,.26,.11);
      round('#a9977a',0,1.95,0,.23,.28,.23);round('#3d5356',0,2.12,0,.29,.15,.28);box('#7fd2d2',0,2,.22,.36,.1,.07);box('#29404a',0,1.75,.1,.38,.17,.3);
      box('#24313b',.12,1.12,.52,.18,.2,.92);box('#788f8f',.12,1.26,.4,.09,.07,.38);box('#232f36',.12,1.04,.76,.10,.12,.36);
    }
    group.position.set(x,y,z);otGames.group.add(group);return e;
  }
  function otGamesBlocked(a,b){
    const start=new THREE.Vector3(a.x,a.y,a.z),end=new THREE.Vector3(b.x,b.y,b.z),direction=end.clone().sub(start),distance=direction.length();if(distance<.01)return false;
    const ray=new THREE.Ray(start,direction.normalize());
    for(const box of otGames.obstacles||[]){const hit=ray.intersectBox(box,new THREE.Vector3());if(hit&&hit.distanceTo(start)<distance-.65)return true;}return false;
  }
  function otGamesSpawnWave(){
    const g=otGames;g.wave++;const remaining=g.goal-g.kills,count=Math.min(remaining,4),bounds=v704WorldBounds();
    const roads=WORLD_LAYOUT_V704.roads.filter(r=>r.w>=7&&r.d>=7);let made=0;
    for(let i=0;i<count;i++){
      let point;
      for(let trial=0;trial<70;trial++){
        const r=roads[(i*3+trial+g.wave)%roads.length],t=((i*.23+trial*.071+g.wave*.12)%1)-.5;
        const x=clamp(r.x+(r.w>r.d?r.w*t:0),bounds.minX+8,bounds.maxX-8),z=clamp(r.z+(r.d>=r.w?r.d*t:0),bounds.minZ+8,bounds.maxZ-8),d=Math.hypot(x-g.body.x,z-g.body.z);
        if(d>14&&d<155&&!waterAt(x,z)&&!positionBlockedForPlayer(x,z,.9,{ignoreTraffic:true,ignoreParkedVehicles:true})){point={x,z};break;}
      }
      if(!point)continue;const kind=g.mode==='ground'?(i===3?'drone':'soldier'):(i%2?'tank':'drone');g.enemies.push(otGamesEnemy(kind,point.x,point.z,g.wave*10+i));made++;
    }
    if(!made){g.state='SPAWN_BLOCKED';g.notice='Não há setor livre para os alvos. Volte à paz e escolha outra área.';}
  }
  function otGamesSegmentDistance(a,b,p){const d=new THREE.Vector3(b.x-a.x,b.y-a.y,b.z-a.z),r=new THREE.Vector3(p.x-a.x,p.y-a.y,p.z-a.z),t=clamp(r.dot(d)/Math.max(.001,d.lengthSq()),0,1);return new THREE.Vector3(a.x,a.y,a.z).addScaledVector(d,t).distanceTo(new THREE.Vector3(p.x,p.y,p.z));}
  function otGamesShot(origin,direction,enemy=false){
    const mesh=otGamesMesh('round',enemy?'#ff7a54':'#ffe5a0',origin.x,origin.y,origin.z,.07,.07,.24,otGames.group),speed=enemy?30:180;
    otGames.bullets.push({x:origin.x,y:origin.y,z:origin.z,vx:direction.x*speed,vy:direction.y*speed,vz:direction.z*speed,life:enemy?5:2,enemy,mesh});
  }
  function otGamesExplosion(e){
    const g=otGames;for(let i=0;i<14;i++){const mesh=otGamesMesh('round',i<4?'#ffb357':'#38464a',e.x,e.y,e.z,.2,.2,.2,g.group);g.effects.push({mesh,x:e.x,y:e.y,z:e.z,vx:Math.cos(i*2)*4,vy:2+(i%4),vz:Math.sin(i*2)*4,age:0,life:i<4?.7:6,smoke:i>=4});}
    if(e.kind==='tank'){
      // Nearby original OT traffic brakes; its prior hold is restored on exit.
      for(const record of trafficActorList()){const ref=record.ref,position=record.group?.position;if(!ref||!position||Math.hypot(position.x-e.x,position.z-e.z)>15)continue;if(!g.trafficHolds.has(ref))g.trafficHolds.set(ref,Number(ref.trafficHoldUntil||0));ref.trafficHoldUntil=Math.max(Number(ref.trafficHoldUntil||0),performance.now()+6000);}
    }
  }
  function otGamesDamage(e,damage){
    if(!e.active)return;e.hp=Math.max(0,e.hp-damage);e.hit=.12;
    if(e.hp===0){e.active=false;otGames.kills++;otGamesExplosion(e);if(e.kind==='tank'){e.group.traverse(o=>{if(o.isMesh)o.material.color.multiplyScalar(.30);});e.group.rotation.z=.09;}else e.group.visible=false;
      if(otGames.kills>=otGames.goal){otGames.state='VICTORY';otGamesSaveResult(true);}
    }
  }
  function otGamesSaveResult(won){
    const g=otGames;if(g.resultSaved)return;g.resultSaved=true;
    if(won){let career={wins:0};try{career=JSON.parse(safeLocalGet(g.careerKey)||'{}')}catch{}career.wins=(Number(career.wins)||0)+1;career.lastMode=g.mode;career.lastDifficulty=g.difficulty;safeLocalSet(g.careerKey,JSON.stringify(career));}
  }
  async function otGamesEnter(mode,options={}){
    if(mode==='peace'){otGamesLeave();return true;}
    if(otGames.starting)return false;
    if(!otGameModes[mode]||!running||paused||currentHouse||player.vehicle||player.boating||player.transit.mode||buildMode||activeRace||window.OTTHI_COOP?.active?.()){
      toast('Para entrar, fique a pé ao ar livre e conclua ou saia da atividade atual.','warn',3000);return false;
    }
    if(otGames.active)otGamesLeave();
    if(!otGames.assets){otGames.starting=true;let response;try{response=await fetch(new URL('assets/ot-games-airframes.json',OTTHI_GAME_LIVE_BASE));}finally{otGames.starting=false;}if(!response.ok)throw Error('Não foi possível carregar os veículos.');otGames.assets=await response.json();}
    const g=otGames;g.mode=mode;g.armed=options.armed!==false;g.difficulty=['easy','normal','hard'].includes(options.difficulty)?options.difficulty:'normal';g.level={easy:{goal:6,damage:7,enemyRate:3.8},normal:{goal:8,damage:10,enemyRate:2.9},hard:{goal:10,damage:15,enemyRate:2.1}}[g.difficulty];
    g.entry={camera:camera.position.clone(),rotation:camera.quaternion.clone(),fov:camera.fov,playerVisible:playerGroup.visible,shadowVisible:contactShadow?.visible,toolVisible:toolVisual?.visible,position:{x:player.x,y:player.y,z:player.z},cameraYaw,cameraPitch,cameraZoom};
    savePlayerPosition(true);clearMovementInputs();otGamesClearInput();g.active=true;g.state='PLAYING';g.kills=0;g.goal=g.level.goal;g.wave=0;g.ammo=30;g.reserve=180;g.reload=0;g.cooldown=0;g.elapsed=0;g.resultSaved=false;g.notice='';g.lock=null;g.enemies=[];g.bullets=[];g.effects=[];
    g.careerKey='thia:ot-games:combat:v1:'+(state.profile?.playerId||'local');g.group=new THREE.Group();g.group.name='OT_GAMES_COMBAT_SESSION';scene.add(g.group);
    const safe=safePointNear(player.x,player.z,{ignoreTraffic:true,allowWater:false,radius:.5});
    g.body={x:safe.x,y:safe.y+(mode==='ground'?1.8:mode==='helicopter'?18:32),z:safe.z,yaw:Math.PI-cameraYaw,pitch:0,roll:0,vx:0,vy:0,vz:0,hp:100};
    g.obstacles=(world.colliders||[]).filter(c=>!c.disabled).map(c=>new THREE.Box3(new THREE.Vector3(c.x-c.w/2,professionalTerrainHeightAt?.(c.x,c.z)||0,c.z-c.d/2),new THREE.Vector3(c.x+c.w/2,(professionalTerrainHeightAt?.(c.x,c.z)||0)+Number(c.height||c.h||6),c.z+c.d/2)));
    for(const house of world.houses||[])if(house.group)g.obstacles.push(new THREE.Box3().setFromObject(house.group));
    if(mode!=='ground'){g.aircraft=otGamesAirframe(mode);g.group.add(g.aircraft);g.weapon=null;}else{g.aircraft=null;g.weapon=otGamesWeapon();g.group.add(g.weapon);}
    playerGroup.visible=false;if(contactShadow)contactShadow.visible=false;if(toolVisual)toolVisual.visible=false;
    document.body.classList.add('ot-games-active');document.body.dataset.otGameMode=mode;otGamesBuildControls();if(g.armed)otGamesSpawnWave();otGamesCamera(.1);return true;
  }
  function otGamesDisposeGroup(group){if(!group)return;const geometries=new Set(),materials=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.parent?.remove(group);}
  function otGamesLeave(){
    const g=otGames;if(!g.active)return;g.cameraEpoch++;g.handSession?.dispose();g.handSession=null;g.handAim=null;g.cameraVideo?.srcObject?.getTracks().forEach(t=>t.stop());g.cameraVideo=null;otGamesClearInput();g.ui?.remove();g.ui=null;otGamesDisposeGroup(g.group);g.group=null;
    for(const [actor,until]of g.trafficHolds)actor.trafficHoldUntil=until;g.trafficHolds.clear();
    playerGroup.visible=g.entry.playerVisible;if(contactShadow)contactShadow.visible=g.entry.shadowVisible;if(toolVisual)toolVisual.visible=g.entry.toolVisible;camera.position.copy(g.entry.camera);camera.quaternion.copy(g.entry.rotation);camera.fov=g.entry.fov;camera.updateProjectionMatrix();cameraYaw=g.entry.cameraYaw;cameraPitch=g.entry.cameraPitch;cameraZoom=g.entry.cameraZoom;
    g.active=false;g.mode='peace';g.body=null;g.enemies=[];g.bullets=[];g.effects=[];document.body.classList.remove('ot-games-active');delete document.body.dataset.otGameMode;clearMovementInputs();updateVisualLOD();updateCamera(.1);updateContext(true);
  }
  function otGamesReload(){const g=otGames;if(g.state!=='PLAYING'||g.reload>0||g.ammo>=30||g.reserve<=0)return;g.reload=1.6;}
  async function otGamesStartCamera(){
    const g=otGames;if(!g.active||g.mode!=='ground'||g.handSession)return;
    g.state='HAND_CALIBRATION';otGamesClearInput();const epoch=++g.cameraEpoch,current=()=>g.active&&g.mode==='ground'&&g.cameraEpoch===epoch;let stream;
    try{
      if(!document.querySelector('[data-ot-hand-style]')){const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('../ar/combat-controls.css',OTTHI_GAME_LIVE_BASE).href;link.dataset.otHandStyle='true';document.head.append(link);}
      if(!window.WarHandControl)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('../ar/hand-controls.js',OTTHI_GAME_LIVE_BASE).href;script.onload=resolve;script.onerror=reject;document.head.append(script);});
      if(!current())return;
      stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'user'},width:{ideal:640},height:{ideal:480}},audio:false});
      if(!current()){stream.getTracks().forEach(t=>t.stop());return;}
      const video=g.cameraVideo=document.createElement('video');video.muted=true;video.playsInline=true;video.srcObject=stream;
      await new Promise((resolve,reject)=>{
        let done=false;const events=['loadeddata','canplay','playing'],finish=error=>{if(done)return;done=true;clearTimeout(timer);for(const event of events)video.removeEventListener(event,frame);error?reject(error):resolve();},frame=()=>{if(video.readyState>=2)finish();};
        const timer=setTimeout(()=>finish(Error('A câmera não forneceu imagens.')),5000);for(const event of events)video.addEventListener(event,frame);Promise.resolve(video.play()).then(frame,error=>finish(error));
      });
      if(!current()){stream.getTracks().forEach(t=>t.stop());return;}
      g.handSession=window.WarHandControl.start(g,{host:{video},isPaused:()=>paused||!running,onManual:()=>{video.srcObject?.getTracks().forEach(t=>t.stop());g.cameraVideo=null;}});
    }catch(error){stream?.getTracks().forEach(t=>t.stop());if(current()){g.cameraVideo=null;g.state='PLAYING';toast('Câmera frontal indisponível. Os controles continuam ativos.','warn',3000);}}
  }
  function otGamesBuildControls(){
    const g=otGames,root=g.ui=document.createElement('section');root.id='ot-games-hud';root.setAttribute('aria-label','Controles OT Games');
    root.innerHTML='<header><button data-ot="menu">OT GAMES</button><span data-ot-status></span><button data-ot="peace">VOLTAR À PAZ</button></header><div class="ot-games-reticle" aria-label="Mira"><i></i><i></i></div><div class="ot-games-mission" role="status"></div><div class="ot-games-stick" data-ot="move" role="group" aria-label="'+(g.mode==='ground'?'Joystick de movimento':'Manche de voo')+'"><i></i><small>'+(g.mode==='ground'?'MOVER':'MANCHE')+'</small></div><div class="ot-games-stick ot-games-aim" data-ot="aim" role="group" aria-label="Joystick de mira"><i></i><small>MIRAR</small></div><button data-ot="fire">ATIRAR</button><button data-ot="reload">RECARREGAR</button><button data-ot="camera">CÂMERA FRONTAL</button><div class="ot-games-collective" data-ot="collective" role="slider" tabindex="0" aria-label="Coletivo: centro paira, acima sobe, abaixo desce" aria-valuemin="0" aria-valuemax="100"><i></i><small>COLETIVO</small></div><button data-ot="pedal-left">↶ PEDAL</button><button data-ot="pedal-right">PEDAL ↷</button>';
    document.body.append(root);root.querySelector('[data-ot="peace"]').onclick=otGamesLeave;root.querySelector('[data-ot="menu"]').onclick=otGamesChoose;
    root.querySelector('[data-ot="camera"]').onclick=otGamesStartCamera;
    for(const name of ['aim','reload','camera'])root.querySelector('[data-ot="'+name+'"]').hidden=g.mode!=='ground';
    for(const name of ['collective','pedal-left','pedal-right'])root.querySelector('[data-ot="'+name+'"]').hidden=g.mode!=='helicopter';
    root.querySelector('[data-ot="fire"]').hidden=!g.armed;root.querySelector('[data-ot="reload"]').hidden=!g.armed||g.mode!=='ground';
    for(const [name,axis]of [['move',g.move],['aim',g.aim]]){
      const el=root.querySelector('[data-ot="'+name+'"]');let owner=null;const release=()=>{owner=null;axis.x=axis.y=0;el.querySelector('i').style.transform='translate(-50%,-50%)';};
      const move=e=>{if(owner!==e.pointerId)return;e.preventDefault();const r=el.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,mag=Math.hypot(dx,dy),radius=r.width*.34,n=Math.min(1,mag/radius),strength=Math.max(0,(n-.08)/.92);axis.x=mag?dx/mag*strength:0;axis.y=mag?-dy/mag*strength:0;el.querySelector('i').style.transform=`translate(calc(-50% + ${axis.x*radius}px),calc(-50% + ${-axis.y*radius}px))`;};
      el.addEventListener('pointerdown',e=>{e.preventDefault();if(owner!==null)return;owner=e.pointerId;safePointerCapture(el,e.pointerId);move(e);});el.addEventListener('pointermove',move);for(const type of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(type,e=>{if(owner===e.pointerId)release();});
    }
    function hold(name,down,up){const el=root.querySelector('[data-ot="'+name+'"]'),ids=new Set();el.addEventListener('pointerdown',e=>{e.preventDefault();if(ids.has(e.pointerId))return;const first=!ids.size;ids.add(e.pointerId);safePointerCapture(el,e.pointerId);if(first)down();});for(const type of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(type,e=>{if(ids.delete(e.pointerId)&&!ids.size)up?.();});}
    hold('fire',()=>g.fire=true,()=>g.fire=false);hold('reload',otGamesReload);hold('pedal-left',()=>g.pedal=-1,()=>g.pedal=0);hold('pedal-right',()=>g.pedal=1,()=>g.pedal=0);
    const lever=root.querySelector('[data-ot="collective"]');let owner=null;const change=e=>{if(owner!==e.pointerId)return;e.preventDefault();const r=lever.getBoundingClientRect();let value=clamp(1-(e.clientY-r.top-14)/(r.height-28),0,1);if(Math.abs(value-.5)<.05)value=.5;g.collective=value;};lever.addEventListener('pointerdown',e=>{e.preventDefault();if(owner!==null)return;owner=e.pointerId;safePointerCapture(lever,e.pointerId);change(e);});lever.addEventListener('pointermove',change);for(const type of ['pointerup','pointercancel','lostpointercapture'])lever.addEventListener(type,e=>{if(owner===e.pointerId)owner=null;});lever.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','Home'].includes(e.key)){e.preventDefault();g.collective=e.key==='Home'?.5:clamp(g.collective+(e.key==='ArrowUp'?.05:-.05),0,1);}});
  }
  function otGamesCamera(dt){
    const g=otGames;if(!g.active)return false;const b=g.body,forward=new THREE.Vector3(Math.sin(b.yaw)*Math.cos(b.pitch),Math.sin(b.pitch),Math.cos(b.yaw)*Math.cos(b.pitch));
    if(g.mode==='ground'){camera.position.set(b.x,b.y,b.z);camera.up.set(0,1,0);camera.lookAt(new THREE.Vector3(b.x,b.y,b.z).add(forward));camera.fov=70;}
    else{const distance=g.mode==='helicopter'?10:14,position=new THREE.Vector3(b.x,b.y,b.z).addScaledVector(forward,-distance);position.y+=3.2;camera.position.lerp(position,1-Math.exp(-dt*9));camera.up.set(0,1,0);camera.lookAt(new THREE.Vector3(b.x,b.y,b.z).addScaledVector(forward,28));camera.fov=66;}
    camera.updateProjectionMatrix();
    if(g.weapon){
      const offset=new THREE.Vector3(.23,-.24-(g.reload>0?.2:0),-.4).applyQuaternion(camera.quaternion);g.weapon.position.copy(camera.position).add(offset);
      if(g.handAim){const direction=new THREE.Vector3(g.handAim.x*2-1,1-g.handAim.y*2,.5).unproject(camera).sub(camera.position).normalize();g.weapon.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),direction);}else g.weapon.quaternion.copy(camera.quaternion);
      g.weapon.userData.flash.visible=g.cooldown>.10&&g.state==='PLAYING';
    }
    return true;
  }
  function updateOtGames(dt){
    const g=otGames;if(!g.active)return;
    if(g.state!=='PLAYING'||(g.handSession&&!g.handAim?.fresh)){otGamesUpdateHUD();return;}
    const b=g.body,k=g.keys,x=clamp(g.move.x+Number(k.has('KeyD')||k.has('ArrowRight'))-Number(k.has('KeyA')||k.has('ArrowLeft')),-1,1),y=clamp(g.move.y+Number(k.has('KeyW')||k.has('ArrowUp'))-Number(k.has('KeyS')||k.has('ArrowDown')),-1,1),blend=1-Math.exp(-dt*4),bounds=v704WorldBounds();g.elapsed+=dt;g.cooldown=Math.max(0,g.cooldown-dt);
    if(g.reload>0){g.reload=Math.max(0,g.reload-dt);if(g.reload===0){const n=Math.min(30-g.ammo,g.reserve);g.ammo+=n;g.reserve-=n;}}
    const before={x:b.x,y:b.y,z:b.z};
    if(g.mode==='ground'){
      b.yaw+=g.aim.x*dt*1.8;b.pitch=clamp(b.pitch+g.aim.y*dt*1.2,-.85,.85);const n=Math.max(1,Math.hypot(x,y)),nx=b.x+(Math.cos(b.yaw)*x+Math.sin(b.yaw)*y)/n*5*dt,nz=b.z+(-Math.sin(b.yaw)*x+Math.cos(b.yaw)*y)/n*5*dt;
      if(!positionBlockedForPlayer(nx,nz,.4,{ignoreTraffic:true})){b.x=nx;b.z=nz;}b.y=groundHeightAt(b.x,b.z)+1.8;
    }else if(g.mode==='helicopter'){
      b.yaw+=(g.pedal||x*.65)*dt;const dx=Math.sin(b.yaw)*y*13+Math.cos(b.yaw)*x*6,dz=Math.cos(b.yaw)*y*13-Math.sin(b.yaw)*x*6;b.vx+=(dx-b.vx)*blend;b.vz+=(dz-b.vz)*blend;
      const collective=clamp(g.collective+(k.has('KeyE')?.2:0)-(k.has('KeyQ')?.2:0),0,1);b.vy+=((collective-.5)*18-b.vy)*blend;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.roll+=(x*.34-b.roll)*blend;b.pitch+=(-y*.18-b.pitch)*blend;
    }else{
      b.roll+=(x*.65-b.roll)*blend;b.pitch=clamp(b.pitch+y*dt*.52,-.75,.75);b.yaw+=b.roll*dt*.8;const speed=k.has('ShiftLeft')?42:27;b.vx=Math.sin(b.yaw)*Math.cos(b.pitch)*speed;b.vz=Math.cos(b.yaw)*Math.cos(b.pitch)*speed;b.vy=Math.sin(b.pitch)*speed;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;
    }
    if(g.mode!=='ground'){
      const floor=groundHeightAt(b.x,b.z)+2.7;if(b.y<floor){b.y=floor;b.vy=0;if(g.armed)b.hp=Math.max(0,b.hp-18*dt);}
      b.y=clamp(b.y,2,100);
      if(g.obstacles.some(box=>box.containsPoint(new THREE.Vector3(b.x,b.y,b.z)))){b.x=before.x;b.z=before.z;b.vx=b.vz=0;if(g.armed)b.hp=Math.max(0,b.hp-28*dt);}
      if(b.x<bounds.minX+4||b.x>bounds.maxX-4||b.z<bounds.minZ+4||b.z>bounds.maxZ-4){g.notice='LIMITE DO MAPA · VIRE PARA O BAIRRO';b.yaw+=dt*1.4;}else g.notice='';
      if(g.aircraft){g.aircraft.position.set(b.x,b.y,b.z);g.aircraft.rotation.order='YXZ';g.aircraft.rotation.set(-b.pitch,b.yaw,-b.roll);const rotor=g.aircraft.getObjectByName('rotor'),tail=g.aircraft.getObjectByName('tail');if(rotor)rotor.rotation.y=g.elapsed*35;if(tail)tail.rotation.x=g.elapsed*65;}
    }
    b.x=clamp(b.x,bounds.minX+2,bounds.maxX-2);b.z=clamp(b.z,bounds.minZ+2,bounds.maxZ-2);otGamesCamera(dt);
    if(g.armed){
      const ray=g.handAim?new THREE.Vector3(g.handAim.x*2-1,1-g.handAim.y*2,.5).unproject(camera).sub(camera.position).normalize():camera.getWorldDirection(new THREE.Vector3()),origin=g.mode==='ground'?camera.position.clone():new THREE.Vector3(b.x,b.y-.4,b.z);let target=null,best=Infinity;
      for(const e of g.enemies){
        if(!e.active)continue;e.aim-=dt;e.hit=Math.max(0,e.hit-dt);e.group.rotation.y=Math.atan2(b.x-e.x,b.z-e.z);
        if(e.kind==='drone'){e.y=groundHeightAt(e.x,e.z)+9+Math.sin(g.elapsed+e.phase);e.group.position.y=e.y;}else if(e.legs)for(const [i,leg]of e.legs.entries())leg.rotation.x=Math.sin(g.elapsed*3+e.phase+i*Math.PI)*.15;
        const to=new THREE.Vector3(e.x-origin.x,e.y-origin.y,e.z-origin.z),distance=to.length(),angle=Math.acos(clamp(to.normalize().dot(ray),-1,1)),cone=g.handAim?Math.atan2(e.radius,distance)+.007:g.mode==='helicopter'?.49:g.mode==='plane'?.14:.035+Math.atan2(e.radius,distance);
        if(distance<170&&angle<cone&&angle<best&&!otGamesBlocked(origin,e)){target=e;best=angle;}
        if(e.aim<=0){e.aim=g.level.enemyRate+Math.sin(e.phase)*.3;if(distance<110&&!otGamesBlocked(e,b)){const start=new THREE.Vector3(e.x,e.y,e.z),direction=new THREE.Vector3(b.x,b.y,b.z).sub(start).normalize();otGamesShot(start,direction,true);}}
      }
      if(target&&g.lock?.target===target)g.lock.time+=dt;else g.lock=target?{target,time:0}:null;
      const locked=!!g.lock&&g.lock.time>=(g.mode==='ground'?.12:g.mode==='helicopter'?.3:.45),auto=!!g.handSession||g.mode!=='ground';
      if(locked&&(auto||g.fire||k.has('Space'))&&g.cooldown===0&&g.reload===0){
        if(g.ammo===0)otGamesReload();else{
          g.ammo--;g.cooldown=.15;const lead=new THREE.Vector3(target.x,target.y,target.z).sub(origin).normalize();otGamesShot(origin,lead);
        }
      }
      for(const bullet of g.bullets){
        const old={x:bullet.x,y:bullet.y,z:bullet.z};bullet.x+=bullet.vx*dt;bullet.y+=bullet.vy*dt;bullet.z+=bullet.vz*dt;bullet.life-=dt;bullet.mesh.position.set(bullet.x,bullet.y,bullet.z);
        if(otGamesBlocked(old,bullet)){bullet.life=0;continue;}
        if(bullet.enemy){if(otGamesSegmentDistance(old,bullet,b)<.8){b.hp=Math.max(0,b.hp-g.level.damage);bullet.life=0;}}
        else for(const e of g.enemies)if(e.active&&otGamesSegmentDistance(old,bullet,e)<e.radius){otGamesDamage(e,50);bullet.life=0;break;}
      }
      for(const bullet of g.bullets.filter(b=>b.life<=0))otGamesDisposeGroup(bullet.mesh);g.bullets=g.bullets.filter(b=>b.life>0);
      if(g.state==='PLAYING'&&!g.enemies.some(e=>e.active))otGamesSpawnWave();
      if(b.hp<=0){g.state='DEFEAT';otGamesSaveResult(false);}
    }
    for(const fx of g.effects){fx.age+=dt;fx.life-=dt;fx.x+=fx.vx*dt;fx.y+=fx.vy*dt;fx.z+=fx.vz*dt;fx.mesh.position.set(fx.x,fx.y,fx.z);fx.mesh.scale.setScalar((fx.smoke?.3+fx.age*.5:1-fx.age)*1.2);}
    for(const fx of g.effects.filter(f=>f.life<=0))otGamesDisposeGroup(fx.mesh);g.effects=g.effects.filter(f=>f.life>0);otGamesUpdateHUD();
  }
  function otGamesUpdateHUD(){
    const g=otGames;if(!g.ui)return;g.ui.querySelector('[data-ot-status]').textContent=otGameModes[g.mode]+' · '+(g.armed?'VIDA '+Math.ceil(g.body.hp)+' · '+(g.reload>0?'RECARREGANDO':g.ammo+'/'+g.reserve):'PASSEIO DE PAZ');
    g.ui.querySelector('.ot-games-mission').textContent=g.state==='VICTORY'?'MISSÃO CONCLUÍDA · '+g.kills+'/'+g.goal+' ALVOS':g.state==='DEFEAT'?'MISSÃO ENCERRADA · VOLTE AO MENU PARA TENTAR NOVAMENTE':g.notice||(g.armed?'MISSÃO SOLO · SETOR '+g.wave+' · '+g.kills+'/'+g.goal+' ALVOS · '+g.difficulty.toUpperCase():'Explore o mesmo bairro por cima. Voltar à paz retorna à sua família.');
    const next=g.enemies.filter(e=>e.active).sort((a,b)=>Math.hypot(a.x-g.body.x,a.z-g.body.z)-Math.hypot(b.x-g.body.x,b.z-g.body.z))[0];
    if(next&&g.state==='PLAYING'){const bearing=Math.atan2(Math.sin(Math.atan2(next.x-g.body.x,next.z-g.body.z)-g.body.yaw),Math.cos(Math.atan2(next.x-g.body.x,next.z-g.body.z)-g.body.yaw));if(Math.abs(bearing)>.5)g.ui.querySelector('.ot-games-mission').textContent+=' · '+(bearing>0?'VIRE À DIREITA →':'← VIRE À ESQUERDA');}
    const reticle=g.ui.querySelector('.ot-games-reticle');reticle.hidden=!g.armed;reticle.classList.toggle('locked',!!g.lock&&g.lock.time>.3);reticle.style.left=(g.handAim?.x??.5)*100+'%';reticle.style.top=(g.handAim?.y??.5)*100+'%';
    g.ui.classList.toggle('ot-hands',!!g.handSession);const lever=g.ui.querySelector('[data-ot="collective"]');lever.setAttribute('aria-valuenow',Math.round(g.collective*100));lever.querySelector('i').style.top=(14+(1-g.collective)*(lever.clientHeight-28))+'px';
  }
  function otGamesChoose(){
    if(!running||document.getElementById('ot-games-choose'))return;const previousPaused=paused;paused=true;otGamesClearInput();clearMovementInputs();const dialog=document.createElement('section');dialog.id='ot-games-choose';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','Escolha seu modo OT Games');
    dialog.innerHTML='<div><small>UM MUNDO · VÁRIAS FORMAS DE JOGAR</small><h2>OT GAMES</h2><p>As mesmas ruas, casas e trânsito do seu mundo.</p><div class="ot-games-mode-grid">'+Object.entries(otGameModes).map(([id,name])=>'<button data-ot-mode="'+id+'">'+({peace:'🌳',ground:'🎯',plane:'✈️',helicopter:'🚁'}[id])+'<strong>'+name+'</strong></button>').join('')+'</div><label><input type="checkbox" data-ot-armed checked> Missão de combate solo (desmarque para passeio de paz)</label><label>Dificuldade <select data-ot-difficulty><option value="easy">Iniciante</option><option value="normal" selected>Normal</option><option value="hard">Veterano</option></select></label><p class="ot-games-help">A pé: mover + mirar + atirar, ou calibrar a mão na câmera frontal. Helicóptero: manche + coletivo + pedais. Avião: manche e curvas. A mira alinhada trava o alvo antes de disparar.</p><button data-ot-close>CONTINUAR JOGO ATUAL</button></div>';
    document.body.append(dialog);const close=()=>{dialog.remove();paused=previousPaused;};dialog.querySelector('[data-ot-close]').onclick=close;
    for(const button of dialog.querySelectorAll('[data-ot-mode]'))button.onclick=async()=>{const mode=button.dataset.otMode,armed=dialog.querySelector('[data-ot-armed]').checked,difficulty=dialog.querySelector('select').value;close();try{await otGamesEnter(mode,{armed,difficulty});}catch(error){toast(error.message||'Não foi possível iniciar este modo.','warn',3500);}};
    dialog.querySelector('[data-ot-mode="peace"]').focus();dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}if(e.key==='Tab'){const a=[...dialog.querySelectorAll('button,input,select')],first=a[0],last=a.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  }
  function otGamesInit(){
    const button=document.createElement('button');button.id='ot-games-button';button.textContent='OT GAMES';button.type='button';button.hidden=true;button.onclick=otGamesChoose;document.body.append(button);setInterval(()=>button.hidden=!running||otGames.active,350);
    window.addEventListener('blur',otGamesClearInput);window.addEventListener('resize',otGamesClearInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)otGamesClearInput();});
    for(const type of ['keydown','keyup'])window.addEventListener(type,e=>{
      if(!otGames.active||e.target.closest?.('input,select,button')||document.getElementById('ot-games-choose'))return;
      if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyQ','KeyE','KeyR','Escape','ShiftLeft'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();if(type==='keydown'){otGames.keys.add(e.code);if(e.code==='KeyR')otGamesReload();if(e.code==='Escape')otGamesChoose();}else otGames.keys.delete(e.code);}
    },true);
  }
  window.OT_GAMES={open:otGamesChoose,enter:otGamesEnter,peace:otGamesLeave,diagnostics:()=>({active:otGames.active,mode:otGames.mode,armed:otGames.armed,state:otGames.state,kills:otGames.kills,wave:otGames.wave,goal:otGames.goal,ammo:otGames.ammo,body:otGames.body?{...otGames.body}:null,peacePosition:{x:player.x,y:player.y,z:player.z},enemies:otGames.enemies.map(e=>({id:e.id,kind:e.kind,active:e.active,hp:e.hp,x:e.x,y:e.y,z:e.z})),sameScene:!!otGames.group&&otGames.group.parent===scene,trafficActors:trafficActorList().length,weapon:!!otGames.weapon&&otGames.active&&otGames.mode==='ground',renderCalls:renderer?.info?.render?.calls||0})};
  otGamesInit();

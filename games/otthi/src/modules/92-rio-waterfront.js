/** A playable dock, with native craft, on the mapped reservoir shoreline. */
// @otthi-module-body
  const RIO_REPRESA_DOCK=Object.freeze({x:1677.93,z:-454.032,yaw:-.26429,width:2.5,start:-3.5,end:29,deck:.38});
  function rioDockPoint(x,z){
    const d=RIO_REPRESA_DOCK,s=Math.sin(d.yaw),c=Math.cos(d.yaw);
    return {x:d.x+c*x+s*z,z:d.z-s*x+c*z};
  }
  function rioDockLocal(x,z){
    const d=RIO_REPRESA_DOCK,s=Math.sin(d.yaw),c=Math.cos(d.yaw),dx=x-d.x,dz=z-d.z;
    return {x:c*dx-s*dz,z:s*dx+c*dz};
  }
  function rioDockSurface(x,z){
    if(!rioMap.waterfront)return 0;
    const d=RIO_REPRESA_DOCK,p=rioDockLocal(x,z);
    if(Math.abs(p.x)>d.width/2||p.z<d.start||p.z>d.end)return 0;
    return d.deck*clamp((p.z-d.start)/2.5,0,1);
  }
  function rioBoatBody(boat,x,z,heading){
    return {x,z,w:boat.halfWidth,l:boat.halfLength,s:Math.sin(heading),c:Math.cos(heading)};
  }
  function rioMarineCanNavigate(boat,x,z,heading){
    const w=rioMap.waterfront;
    if(!w||!rioWaterAt(x,z))return false;
    const body=rioBoatBody(boat,x,z,heading);
    for(const a of [-1,0,1])for(const b of [-1,1]){
      const wx=x+body.c*a*body.w+body.s*b*body.l,wz=z-body.s*a*body.w+body.c*b*body.l;
      if(!rioWaterAt(wx,wz))return false;
    }
    if(trafficBodiesOverlap(body,w.obstacle,.09)||trafficBodiesOverlap(body,w.swimZone,.20))return false;
    for(const other of w.craft){
      if(other===boat)continue;
      const p=other.group.position;
      if(trafficBodiesOverlap(body,rioBoatBody(other,p.x,p.z,other.heading),.12))return false;
    }
    return true;
  }
  function rioAtBerth(boat,x=player.x,z=player.z){
    return distance2D({x,z},boat.rioBerth.moor);
  }
  function rioCanMoor(boat,x,z,heading){
    return rioAtBerth(boat,x,z)<=.96&&Math.cos(heading-boat.rioBerth.moor.heading)>.84;
  }
  function rioCanBoard(boat){
    if(player.vehicle||player.boating||player.swimming||player.transit.mode||otGames.active)return false;
    const p=boat.group.position;
    return distance2D(player,boat.rioBerth.step)<1.48&&rioDockSurface(player.x,player.z)>.25&&
      rioCanMoor(boat,p.x,p.z,boat.heading);
  }
  function rioRecordBoatPose(){
    const boat=world.boat;
    if(!player.boating||!boat?.rioBerth)return;
    rioMapSave().aboard={id:boat.id,x:+player.x.toFixed(2),z:+player.z.toFixed(2),heading:+player.boat.heading.toFixed(4)};
  }
  function rioSetBoatPose(boat,{x,z,heading}){
    boat.x=x;boat.z=z;boat.heading=heading;
    boat.group.position.set(x,.10,z);boat.group.rotation.y=heading;
  }
  function rioFinishMooring(boat){
    rioSetBoatPose(boat,boat.rioBerth.moor);
    rioMapSave().aboard=null;
  }
  function rioRestoreBoatRide(){
    const saved=rioMapSave().aboard,boat=world.boats?.get(saved?.id);
    if(!boat?.rioBerth||new URLSearchParams(location.search).has('entrada'))return false;
    if(![saved.x,saved.z,saved.heading].every(Number.isFinite)||!rioMarineCanNavigate(boat,saved.x,saved.z,saved.heading)){
      rioMapSave().aboard=null;
      return false;
    }
    rioSetBoatPose(boat,saved);
    rioStreamMap(saved,true);
    applyBoatDriver(boat);
    cameraYaw=Math.PI-saved.heading;
    return true;
  }

  function rioMakePaddle(){
    const blade=renderMat(0xe6b235,{roughness:.6}),shaft=renderMat(0x263f45,{roughness:.44});
    const root=new THREE.Group();
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.027,.031,1.76,8),shaft);
    pole.position.y=-.15;root.add(pole);
    const tip=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),blade);
    tip.scale.set(.155,.29,.037);tip.position.y=-1.08;root.add(tip);
    const grip=new THREE.Mesh(new THREE.CylinderGeometry(.032,.032,.19,8),shaft);
    grip.position.y=.73;grip.rotation.z=Math.PI/2;root.add(grip);
    return root;
  }
  function rioMakeBoard(color){
    const root=new THREE.Group();root.name='RIO_STAND_UP_PADDLE';
    const hull=new THREE.Mesh(new THREE.SphereGeometry(1,28,12),renderMat(color,{roughness:.46}));
    hull.scale.set(.48,.093,1.54);root.add(hull);
    const mat=new THREE.Mesh(new THREE.SphereGeometry(1,18,8),renderMat(0x2b4448,{roughness:.93}));
    mat.scale.set(.365,.022,.91);mat.position.set(0,.085,-.17);root.add(mat);
    campaignBox(root,renderMat(0x335257),0,-.15,-1.04,.06,.19,.31);
    for(const z of [.43,.60,.77])campaignBox(root,renderMat(0xe6ded0),0,.087,z,.56,.023,.024);
    return root;
  }

  function rioMakeTourShip(){
    const root=new THREE.Group();root.name='RIO_NAVIO_PASSEIO';
    const ivory=campaignMaterial(0xe9ece5,.30),teal=campaignMaterial(0x106c75,.36),metal=campaignMaterial(0x669097,.65);
    const wood=campaignMaterial(0xa9895f,.12),glass=campaignMaterial(0x365d65,.35);
    const stations=[[-4.36,.91,.22,.60],[-3.84,1.43,-.09,.73],[-2.10,1.52,-.14,.77],
      [.1,1.51,-.15,.78],[2.20,1.27,-.05,.84],[3.50,.68,.12,.85],[4.26,.04,.42,.89]];
    root.add(new THREE.Mesh(seaCraftHullGeometry(stations,false),teal));
    campaignBox(root,wood,0,.81,-.36,2.76,.12,6.3);
    campaignBox(root,ivory,0,.93,2.53,1.85,.22,1.75);
    campaignBox(root,glass,0,1.54,2.52,1.77,.64,.76);
    campaignBox(root,ivory,0,1.92,2.54,2.14,.13,1.18);
    campaignBox(root,teal,0,1.12,1.67,1.17,.27,.36);
    campaignBox(root,wood,0,1.05,.95,.62,.17,.60);
    campaignBox(root,wood,0,1.32,.67,.62,.42,.10);
    for(const side of [-1,1]){
      for(const z of [-2.9,-1.8,-.7])campaignBox(root,wood,side*.82,1.03,z,.74,.14,.49);
      for(const z of [-3.65,-2.6,-1.55,-.5,.55,2.5,3.3])campaignCylinder(root,metal,side*1.33,1.12,z,.032,.60);
      campaignBox(root,metal,side*1.33,1.42,-.95,.056,.055,5.55);
      campaignBox(root,ivory,side*1.34,.66,-1,.06,.13,5.55);
      const light=new THREE.Mesh(new THREE.SphereGeometry(.08,10,8),new THREE.MeshBasicMaterial({color:side<0?0xe1494d:0x58d18d}));
      light.position.set(side*1.13,1.89,2.63);root.add(light);
    }
    campaignBox(root,metal,0,1.39,-3.64,2.66,.05,.06);
    campaignCylinder(root,metal,0,2.17,2.49,.035,.50);
    return root;
  }

  function rioMakeBerth(spec,side,length){
    const d=RIO_REPRESA_DOCK,width=d.width/2,step=rioDockPoint(side*(width-.38),length);
    const moor={...rioDockPoint(side*(width+spec.halfLength+.38),length),heading:d.yaw+side*Math.PI/2};
    const boat={...spec,rioBerth:{step,moor}};
    rioSetBoatPose(boat,moor);worldGroup.add(boat.group);world.boats.set(boat.id,boat);
    const icon=boat.kind==='board'?'🏄':boat.kind==='ship'?'🛳️':'🛶';
    registerInteractable({id:'rio-board-'+boat.id,type:'boat',icon,label:boat.kind==='board'?'Subir na prancha':'Embarcar · '+boat.label,
      ...step,radius:1.48,priority:250,available:()=>rioCanBoard(boat),action:()=>enterBoat(boat)});
    return boat;
  }
  function openRioDock(){
    const dock=rioMap.waterfront;
    if(!dock||player.vehicle||player.boating||player.swimming||distance2D(player,dock.entry)>3.6)return false;
    const craft=[...world.boats.values()];
    openModal('Cais da Represa','<p>Escolha a embarcação. Seu personagem caminha pelo cais até a vaga.</p><div class="choice-grid">'+
      craft.map(boat=>'<button class="choice" data-rio-dock-boat="'+boat.id+'"><b>'+escapeHtml(boat.label)+'</b></button>').join('')+
      '</div>',root=>{
        for(const button of root.querySelectorAll('[data-rio-dock-boat]'))button.onclick=()=>{
          const boat=world.boats.get(button.dataset.rioDockBoat);
          if(!boat||distance2D(player,dock.entry)>3.6||
            !rioCanMoor(boat,boat.group.position.x,boat.group.position.z,boat.heading))return;
          closeModal();beginCharacterActivity('rio-boarding',{target:boat.rioBerth.step,walkSpeed:4.1,onArrival:()=>enterBoat(boat)});
        };
      });
    return true;
  }
  function rioBuildWaterfront(){
    const d=RIO_REPRESA_DOCK,center=rioDockPoint(0,(d.start+d.end)/2),entry=rioDockPoint(0,d.start-1.4);
    const swimming=rioDockPoint(43,13),s=Math.sin(d.yaw),c=Math.cos(d.yaw);
    const dock={...center,w:d.width/2,l:(d.end-d.start)/2,s,c};
    const group=new THREE.Group();group.name='RIO_REPRESA_CAIS';worldGroup.add(group);
    const batch=rioCreateBatch(group),wood=0xa08562,steel=0x436263;
    const part=(x,y,z,w,h,l,col)=>{
      const p=rioDockPoint(x,z);batch.part('box',p.x,y,p.z,w,h,l,col,d.yaw);
    };
    const access=rioDockPoint(0,d.start-9);
    const path=nearestRioRoad(access,true)?.point;
    if(path&&Math.hypot(path.x-access.x,path.z-access.z)<18){
      const span=distance2D(path,entry),yaw=Math.atan2(entry.x-path.x,entry.z-path.z);
      if(span>1)batch.part('box',(path.x+entry.x)/2,.034,(path.z+entry.z)/2,2.1,.053,span+1,0xc2b8a0,yaw);
    }
    for(let z=d.start+.21;z<d.end;z+=.42){
      const top=d.deck*clamp((z-d.start)/2.5,0,1);
      part(0,top-.069,z,d.width,.138,.407,Math.round(z*7)%3===0?0xb59773:wood);
    }
    for(const side of [-1,1])for(const z of [1,4,11.5,21.7,28.7]){
      part(side*1.17,.3,z,.15,1.05,.15,steel);
      part(side*1.17,.84,z,.25,.055,.23,0xc6c8b6);
    }
    for(const z of [7,16,26])for(const side of [-1,1])part(side,.44,z,.24,.12,.15,steel);
    for(const x of [33,38,43,48,53])for(const z of [7,20]){
      const p=rioDockPoint(x,z);batch.part('canopy',p.x,.13,p.z,.32,.31,.32,0xefc849);
    }
    batch.commit();
    const sign=rioDockPoint(-1.55,d.start-.6);
    citySign(group,'CAIS DA REPRESA',sign.x,1.7,sign.z,2.25,1,'#195460',.46);
    const swimSign=rioDockPoint(43,-4.9);
    citySign(group,'NATAÇÃO',swimSign.x,1.46,swimSign.z,1.6,1,'#195460',.39);
    rioMap.waterfront={entry,group,obstacle:dock,swimZone:{...swimming,w:11,l:8,s,c},craft:[],swimmers:[],patrol:[],acc:0};
    world.boats=new Map();
    const speedboat=SEA_CRAFT.find(spec=>spec.id==='sea-familia');
    const craft=rioMap.waterfront.craft;
    craft.push(rioMakeBerth({id:'rio-prancha',label:'Prancha de stand-up paddle',kind:'board',
      halfWidth:.53,halfLength:1.61,maxSpeed:4.3,acceleration:4.1,reverseSpeed:1.5,driver:{y:.20},group:rioMakeBoard(0x35b4ad)},1,7));
    craft.push(rioMakeBerth({id:'lake-boat',label:'Barco de pesca',kind:'lake',
      halfWidth:1.41,halfLength:2.27,maxSpeed:8.8,driver:{x:-.31,y:1.03,z:.72},group:createLakeBoatHull()},-1,7));
    craft.push(rioMakeBerth({...speedboat,kind:'launch',halfWidth:1.18,halfLength:2.74,acceleration:10,
      driver:{x:.40,y:.49,z:.66},group:createSeaCraftModel(speedboat)},1,16));
    craft.push(rioMakeBerth({id:'rio-navio-passeio',label:'Navio de passeio',kind:'ship',
      halfWidth:1.57,halfLength:4.42,maxSpeed:9.8,acceleration:5.6,reverseSpeed:2.3,driver:{y:1.16,z:.94},group:rioMakeTourShip()},1,26));
    registerInteractable({id:'rio-represa-cais',type:'activity',icon:'⚓',label:'Escolher embarcação no cais',...entry,
      radius:3.4,priority:255,available:()=>!player.vehicle&&!player.boating&&!player.swimming&&!characterActivities.session,action:openRioDock});
    rioMap.waterfront.paddle=rioMakePaddle();
    rioMap.waterfront.paddle.visible=false;playerGroup.add(rioMap.waterfront.paddle);
    rioCreateWaterfrontLife();
  }

  function rioCreateWaterfrontLife(){
    const water=rioMap.waterfront;
    for(const [i,x] of [40,46].entries()){
      const a=rioDockPoint(x,9),b=rioDockPoint(x,16.5);
      const npc=createNPC('rio-swimmer-'+i,i?'Júlia':'Vinícius',a.x,a.z,i?0xd4854b:0x5d8b91,0);
      npc.cityLifeManaged=true;
      water.swimmers.push({npc,route:[a,b],index:1});
    }
    const coral=SEA_CRAFT.find(spec=>spec.id==='sea-coral');
    const craft=[
      {...coral,npcName:'Sérgio',kind:'launch',halfWidth:1.18,halfLength:2.74,speed:4.1,
        driver:{x:.40,y:.49,z:.66},group:createSeaCraftModel(coral),loop:[[-25,35],[-25,74],[-46,74],[-46,35]]},
      {id:'rio-paddle-npc',npcName:'Cíntia',kind:'board',halfWidth:.53,halfLength:1.61,speed:1.12,
        driver:{y:.19},group:rioMakeBoard(0xe2bd52),loop:[[20,31],[33,29],[35,41],[21,44]]}
    ];
    for(const boat of craft){
      boat.route=boat.loop.map(p=>rioDockPoint(...p));boat.index=1;
      const from=boat.route[0],to=boat.route[1],heading=Math.atan2(to.x-from.x,to.z-from.z);
      rioSetBoatPose(boat,{...from,heading});worldGroup.add(boat.group);water.craft.push(boat);water.patrol.push(boat);
      const n=createNPC(boat.id+'-piloto',boat.npcName,from.x,from.z,0x357b7e,0);
      n.cityLifeManaged=true;n.group.scale.setScalar(boat.kind==='board'?.77:.42);
      boat.group.add(n.group);boat.rider=n;
      if(boat.kind==='board'){
        const paddle=rioMakePaddle();paddle.position.set(.34,1.06,.13);paddle.rotation.z=-.22;
        boat.group.add(paddle);boat.paddle=paddle;
      }
    }
  }
  function updateRioWaterfront(dt){
    const water=rioMap.waterfront;
    if(!water)return;
    if(Math.hypot(player.x-water.entry.x,player.z-water.entry.z)>208){
      water.group.visible=false;
      for(const boat of water.craft)boat.group.visible=player.boating&&boat===world.boat;
      for(const actor of water.swimmers)actor.npc.group.visible=false;
      return;
    }
    water.group.visible=true;
    for(const boat of water.craft)boat.group.visible=true;
    water.acc+=dt;if(water.acc<.06)return;
    dt=Math.min(.10,water.acc);water.acc=0;
    const time=performance.now()/1000;
    for(const actor of water.swimmers){
      const n=actor.npc,p=n.group.position,target=actor.route[actor.index],dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz);
      n.group.visible=true;
      if(d<.12)actor.index=1-actor.index;
      else{
        const step=Math.min(d,dt*.93);p.x+=dx/d*step;p.z+=dz/d*step;
        n.group.rotation.y=lerpAngle(n.group.rotation.y,Math.atan2(dx,dz),Math.min(1,dt*5));
      }
      poseResident(n,'swim',time);
    }
    for(const boat of water.patrol){
      const target=boat.route[boat.index],dx=target.x-boat.x,dz=target.z-boat.z,d=Math.hypot(dx,dz);
      if(d<2.4)boat.index=(boat.index+1)%boat.route.length;
      const desired=Math.atan2(dx,dz),heading=lerpAngle(boat.heading,desired,Math.min(1,dt*1.65));
      const p={x:boat.x+Math.sin(heading)*boat.speed*dt,z:boat.z+Math.cos(heading)*boat.speed*dt,heading};
      if(rioMarineCanNavigate(boat,p.x,p.z,heading))rioSetBoatPose(boat,p);
      const n=boat.rider,b=boat.driver,board=boat.kind==='board',stroke=Math.sin(time*4.1);
      poseResident(n,board?'paddle':'drive',time,board?undefined:b.y-.10);
      n.group.position.x=b.x||0;n.group.position.z=b.z||0;
      if(board){
        n.group.position.y=b.y-.10;n.limbs.rightArm.rotation.x=-.91+stroke*.32;n.limbs.leftArm.rotation.x=-1.36+stroke*.25;
        boat.paddle.rotation.x=stroke*.39;
      }else{n.limbs.rightArm.rotation.x=-1.24;n.limbs.leftArm.rotation.x=-1.24;}
    }
  }

  function rioBoatRiderPose(visual){
    const boat=player.boating&&world.boat?.rioBerth?world.boat:null,paddle=rioMap.waterfront?.paddle;
    if(!paddle)return;
    paddle.visible=boat?.kind==='board';
    if(!boat){playerModel.position.x=0;playerModel.position.z=0;return;}
    const p=boat.driver,board=boat.kind==='board';
    playerModel.position.set(p.x||0,(playerModel.userData.baseY||0)+(board?0:-.47),p.z||0);
    playerModel.rotation.x=0;
    if(!board)return;
    const stroke=Math.sin(animTime*(3.2+Math.abs(player.boat.speed)*.54))*clamp(Math.abs(player.boat.speed)/2,0,1);
    const rig=visual?.byName,parts=playerModel.userData.parts;
    if(rig){
      rig.shoulder1.rotation.set(-.95+stroke*.62,0,-.25);
      rig['shoulder-1'].rotation.set(-1.60+stroke*.30,0,.49);
      for(const side of [-1,1]){rig['hip'+side].rotation.x=-.17;rig['knee'+side].rotation.x=.26;}
    }else if(parts){
      parts.rightArm.rotation.set(-.91+stroke*.62,0,-.28);
      parts.leftArm.rotation.set(-1.58+stroke*.32,0,.44);
    }
    paddle.position.set(.39,.86,.16+stroke*.23);paddle.rotation.set(stroke*.44,0,-.25);
  }

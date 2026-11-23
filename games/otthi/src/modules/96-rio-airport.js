/** Native free flight at the mapped SBSR runway and terminal. */
// @otthi-module-body
  const rioFlightSpawns=new Map();
  function rioBuildAirport(){
    const airport=rioMap.data.airport,site=rioSiteByKey('aeroporto-sbsr');
    if(!airport?.runway?.length||!site)return;
    const surface=rioSurfaceBatch(),root=new THREE.Group();root.name='RIO_AIRPORT_SBSR';worldGroup.add(root);
    for(const apron of airport.aprons)surface.polygon('street',apron,.028);
    const a=airport.runway[0],b=airport.runway.at(-1),length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const dx=(b[0]-a[0])/length,dz=(b[1]-a[1])/length,yaw=Math.atan2(dx,dz);
    const point=(along,side,y)=>[a[0]+dx*along-dz*side,y,a[1]+dz*along+dx*side];
    const band=(kind,from,to,side,width,y)=>surface.quad(kind,point(from,side-width/2,y),point(to,side-width/2,y),
      point(to,side+width/2,y),point(from,side+width/2,y));
    band('street',0,length,0,35,.025);
    for(const side of [-17,17])band('paint',14,length-14,side,.24,.030);
    for(let offset=45;offset<length-45;offset+=28)band('paint',offset,offset+12,0,.53,.031);
    for(const offset of [18,length-23])for(const side of [-7.5,-4.5,-1.5,1.5,4.5,7.5])band('paint',offset,offset+4.8,side,1.25,.032);
    surface.commit(root);
    for(const [name,offset] of [['07',33],['25',length-33]]){
      const [x,,z]=point(offset,0,0);
      const number=new THREE.Mesh(new THREE.PlaneGeometry(8,4),new THREE.MeshBasicMaterial({map:signTexture(name,'#4d585c','#ffffff')}));
      number.position.set(x,.036,z);number.rotation.set(-Math.PI/2,0,-yaw+(name==='07'?Math.PI:0));root.add(number);
    }
    const [planeX,,planeZ]=point(length-78,0,0);
    const apron=airport.aprons[0][0],heli=apron.reduce((p,[x,z])=>({x:p.x+x/apron.length,z:p.z+z/apron.length}),{x:0,z:0});
    rioFlightSpawns.set('plane',{x:planeX,z:planeZ,yaw:yaw+Math.PI});
    rioFlightSpawns.set('helicopter',{...heli,yaw});
    const fleet=new THREE.Group();fleet.name='SBSR_AIRCRAFT';worldGroup.add(fleet);worldCampaign.aircraft=fleet;
    for(const [id] of rioFlightSpawns){
      const model=campaignCreateAircraft(id);model.name=id;fleet.add(model);
      registerInteractable({id:'rio-aircraft-'+id,type:'activity-venue',icon:id==='plane'?'✈️':'🚁',
        label:id==='plane'?'Embarcar no avião':'Embarcar no helicóptero',radius:6,
        getPos:()=>campaignAircraftPose(id),available:()=>!otGames.active&&!player.vehicle&&!player.boating&&!player.swimming,
        action:()=>campaignBoardAircraft(id)});
    }
    campaignSyncAircraft();
  }

  const beforeRioAirportPose=campaignAircraftPose;
  campaignAircraftPose=function(id){
    if(!inRioMap())return beforeRioAirportPose(id);
    const spawn=rioFlightSpawns.get(id);
    if(!spawn)return null;
    const record=rioMapSave().aircraft?.[id];
    return {...WORLD_CAMPAIGN_AIRCRAFT[id],...(record||spawn)};
  };
  const beforeRioAirportBoard=campaignBoardAircraft;
  campaignBoardAircraft=function(id){return inRioMap()?airOriginalBoard(id):beforeRioAirportBoard(id);};
  const beforeRioAirportPark=campaignParkAircraft;
  campaignParkAircraft=function(id,body){
    if(!inRioMap())return beforeRioAirportPark(id,body);
    if(!rioFlightSpawns.has(id))return false;
    (rioMapSave().aircraft??={})[id]={x:body.x,z:body.z,yaw:body.yaw,hp:body.hp};
    saveState(true);campaignSyncAircraft();return true;
  };

  function rioBuildAirportTerminal(site,room){
    const offset=Math.min(site.w*.21,4.3),z=-site.d*.22;
    rioCounter(room,-offset,z,Math.min(site.w*.32,4.3));
    room.sign('BALCÃO DE EMBARQUE',-offset,2.4,z-.32,Math.min(site.w*.39,5.1),.49);
    room.bench(offset,z-1.8);
    const point=room.point(-offset,z+1.02);
    room.action('terminal','Consultar voos e portões',-offset,z+1.02,()=>{
      if(!rioPlayerAt(point))return false;
      openModal(site.name,'<div class="choice-grid"><button class="choice" data-rio-airport="plane"><b>Avião</b><span>Marcar aeronave junto à pista 07/25</span></button><button class="choice" data-rio-airport="helicopter"><b>Helicóptero</b><span>Marcar o pátio de embarque</span></button><button class="choice" data-rio-airport="aviation"><b>Aero Strike WAR</b><span>Abrir a escola de voo do console</span></button></div>',root=>{
        for(const button of root.querySelectorAll('[data-rio-airport]'))button.onclick=()=>{
          const id=button.dataset.rioAirport;if(id==='aviation'){closeModal();return venueOpen(id);}
          const pose=campaignAircraftPose(id);
          if(pose)rioSetWaypoint({id:'rio-aircraft-'+id,name:id==='plane'?'Avião · SBSR':'Helicóptero · SBSR',x:pose.x,z:pose.z});
        };
      });
      return true;
    },{inside:true,icon:'✈️'});
    rioVenues.set('aviation',{...WORLD_ACTIVITY_VENUES.aviation,x:point.x,z:point.z,navX:point.x,navZ:point.z,label:site.name});
  }

  function rioStepFlight(dt){
    updateOtGames(dt);
    if(otGames.active&&performance.now()>=rioMap.lastStream){
      rioMap.lastStream=performance.now()+66;rioStreamMap(otGames.body);campaignSyncAircraft();
    }
  }

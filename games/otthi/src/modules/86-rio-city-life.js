/** Finite native city actors. Visitors reuse these objects on every return to a district. */
// @otthi-module-body
  const rioLife={people:new Map(),animals:new Map(),traffic:new Map(),lastAnimalAt:0,nextPeopleAt:0,animalGeo:null};
  const rioPeople=[
    ['catedral-guia','Clara',0xb16e68,'talk',[[-43,24],[-36,25],[-36,22.5],[-44,22.5]]],
    ['mercadao-feira','Sebastião',0x607867,'talk',[[49,27],[55,27],[56,25.6],[48,25.6]]],
    ['mercadao-cliente','Lívia',0xc99b5b,'walk',[[58,29],[58,26],[54,25],[54,27]]],
    ['calcadao-ambulante','Neide',0xaa6a58,'talk',[[-44,-81],[-38,-81],[-37,-85],[-44,-85]]],
    ['paco-agente','Davi',0x4e7396,'talk',[[111,-10],[116,-10],[116,-7],[111,-7]]],
    ['orla-central-1','Renata',0x3c8377,'run',[[-113,37],[-79,37],[-79,40],[-113,40]]],
    ['orla-central-2','Mateus',0xa75050,'run',[[-80,40],[-113,40],[-113,37],[-80,37]]],
    ['swift-tecnica','Ana',0x734667,'talk',[[472,-542],[479,-542],[479,-545],[471,-545]]],
    ['canecao-cliente','Carlos',0xb97655,'walk',[[500,-546],[510,-546],[510,-548],[500,-548]]],
    ['represa-corredora','Camila',0x276b99,'run',[[467,-573],[546,-573],[563,-573],[563,-635],[460,-635],[460,-573]]],
    ['represa-corredor','Rafael',0xac5d43,'run',[[542,-574],[481,-574],[461,-574],[461,-634],[562,-634],[562,-574]]],
    ['zona-norte-1','Júlia',0x698153,'talk',[[389,-342],[396,-341],[396,-339],[389,-339]]],
    ['zona-norte-2','Milton',0x6d799b,'walk',[[430,-320],[437,-320],[437,-323],[430,-323]]],
    ['murchid-1','Erica',0xa36586,'walk',[[506,-458],[515,-458],[515,-461],[506,-461]]],
    ['murchid-2','Ivan',0x5d817b,'talk',[[467,-460],[478,-460],[478,-463],[467,-463]]],
    ['bady-1','Olívia',0xb28655,'walk',[[-252,-496],[-243,-496],[-243,-493],[-252,-493]]]
  ];
  const rioFauna=[
    ['capivara-orla','Capivara','capy',1,[[-111,41],[-91,41],[-92,40],[-111,40]]],
    ['capivara-filhote','Filhote de capivara','capy',.63,[[-105,41],[-95,41],[-95,40],[-105,40]]],
    ['pato-orla','Pato','duck',.84,[[-103,53],[-89,55],[-85,57],[-98,56]]],
    ['pato-orla-2','Pato','duck',.76,[[-99,56],[-89,53],[-87,55],[-97,58]]],
    ['cachorro-catedral','Cachorro','dog',.75,[[-43,25],[-38,25],[-36,23],[-44,23]]],
    ['pombo-mercadao','Pombo','bird',.57,[[55,27],[58,28],[58,26],[54,26]]],
    ['capivara-represa','Capivara','capy',.93,[[478,-585],[488,-585],[488,-582],[478,-582]]],
    ['pato-represa','Pato','duck',.80,[[465,-607],[480,-608],[483,-616],[468,-617]]],
    ['pato-represa-2','Pato','duck',.72,[[494,-606],[510,-606],[513,-614],[500,-618]]]
  ];
  function rioLifeSpawnPerson(spec){
    const [id,name,color,activity,path]=spec;
    const stops=path.map(([x,z],index)=>({x,z,action:activity==='talk'&&index>0?'walk':activity,duration:activity==='talk'&&index===0?4:0}));
    const person=addResident('rio-city-'+id,name,stops,color);
    person.rioCityLocal=true;
    rioLife.people.set(id,person);
  }
  function rioLifeSpawnAnimal(spec){
    const [id,label,kind,scale,path]=spec;
    const root=new THREE.Group();root.name='RIO_FAUNA_'+id;root.scale.setScalar(scale);
    rioLife.animalGeo??=new THREE.SphereGeometry(1,10,8);
    const legs=[],brown=kind==='capy'?0x88613c:0x976e49,fur=kind==='duck'?0xf5eee2:kind==='bird'?0x718793:brown;
    const add=(color,x,y,z,w,h,d)=>{
      const mesh=new THREE.Mesh(rioLife.animalGeo,renderMat(color,{roughness:.88}));
      mesh.position.set(x,y,z);mesh.scale.set(w,h,d);root.add(mesh);return mesh;
    };
    const waterfowl=kind==='duck',small=kind==='bird'||waterfowl;
    if(small){
      add(fur,0,.24,-.13,.30,.26,.51);
      add(kind==='bird'?0x5c7892:0x437365,0,.44,.26,.21,.22,.21);
      add(0xd69a47,0,.39,.47,.137,.051,.17);
      for(const side of [-1,1])add(0x182b32,side*.18,.49,.32,.036,.039,.041);
    }else{
      add(fur,0,.65,-.19,.49,.42,.73);
      add(fur,0,.80,.46,.37,.36,.38);
      add(kind==='dog'?0x403840:0x684a34,0,.66,.73,.30,.22,.28);
      for(const side of [-1,1]){
        add(0x272028,side*.28,.91,.65,.057,.065,.046);
        add(brown,side*.27,1.08,.44,.119,kind==='dog'?.24:.13,.13);
        for(const z of [-.54,.29])legs.push(add(brown,side*.31,.28,z,.126,.28,.145));
      }
      if(kind==='dog')add(fur,0,.87,-.91,.10,.31,.24).rotation.x=-.75;
    }
    const [x,z]=path[0];root.position.set(x,groundHeightAt(x,z),z);worldGroup.add(root);
    const animal={id,label,root,legs,path,index:1,waterfowl,speed:waterfowl?.74:kind==='bird'?.55:1.17};
    rioLife.animals.set(id,animal);
    registerInteractable({id:'rio-fauna-'+id,type:'viewpoint',label:'Observar · '+label,icon:'🐾',priority:150,radius:2.8,
      getPos:()=>root.position,available:()=>root.visible&&!player.vehicle&&!player.boating&&!otGames.active&&!currentHouse,
      action:()=>{toast(label+' · observe sem assustar o animal.','info',2100);return true;}});
  }
  const rioTrafficPlans=[
    {id:'centro',focus:[30,-20],count:4,points:[[0,-65],[65,-65],[65,0],[0,0]]},
    {id:'bady',focus:[-86,-481],count:2,points:[[-137,-464],[-76,-464],[-76,-511],[-137,-511]]},
    {id:'represa',focus:[510,-550],count:4,points:RIO_V51.trafficLoop}
  ];
  function rioLifeTraffic(focus){
    if(!OTTOVIAS_RUNTIME.initialized)return;
    for(const plan of rioTrafficPlans){
      if(rioLife.traffic.has(plan.id)||Math.hypot(focus.x-plan.focus[0],focus.z-plan.focus[1])>138)continue;
      const route=plan.points.map(([x,z])=>({x,z}));
      const lanes=[route,[...route].reverse()].map(line=>offsetBrazilianTrafficPath(line,2.22,{
        closed:true,valid:(x,z)=>v704RoadAt(x,z,.1,false),factors:[1,.72,.4,0]}));
      if(lanes.some(lane=>lane.length<4))continue;
      const actors=[];
      for(let i=0;i<plan.count;i++){
        const lane=lanes[i%2],slot=Math.floor(lane.length/2)*(i>=2?1:0)+(i%2);
        const v=createOttoviasTrafficVehicle('rio-city-'+plan.id+'-'+i,lane,slot,[0x427f93,0xb97258,0xccb270,0x536e76][i],5.8+i*.47);
        actors.push(v);
      }
      rioLife.traffic.set(plan.id,actors);
      world.trafficSnapshot=null;world.trafficSnapshotAt=-Infinity;
      return;
    }
  }
  function updateRioCityLife(){
    if(!worldGroup||!running||!worldExpansion.ready||!worldResidents.ready||paused)return;
    const focus=otGamesFocus(),now=performance.now();
    if(now>=rioLife.nextPeopleAt){
      for(const spec of rioPeople){
        const [x,z]=spec[4][0];
        if(!rioLife.people.has(spec[0])&&Math.hypot(x-focus.x,z-focus.z)<115){rioLifeSpawnPerson(spec);break;}
      }
      for(const spec of rioFauna){
        const [x,z]=spec[4][0];
        if(!rioLife.animals.has(spec[0])&&Math.hypot(x-focus.x,z-focus.z)<100){rioLifeSpawnAnimal(spec);break;}
      }
      rioLifeTraffic(focus);
      rioLife.nextPeopleAt=now+170;
    }
    if(now-rioLife.lastAnimalAt<85)return;
    const dt=Math.min(.12,(now-(rioLife.lastAnimalAt||now))/1000);
    rioLife.lastAnimalAt=now;
    for(const animal of rioLife.animals.values()){
      const {root}=animal;
      root.visible=Math.hypot(root.position.x-focus.x,root.position.z-focus.z)<79;
      if(!root.visible)continue;
      const [tx,tz]=animal.path[animal.index],dx=tx-root.position.x,dz=tz-root.position.z,d=Math.hypot(dx,dz);
      if(d<.12){animal.index=(animal.index+1)%animal.path.length;continue;}
      const step=Math.min(d,dt*animal.speed);
      root.position.x+=dx/d*step;root.position.z+=dz/d*step;
      root.rotation.y=lerpAngle(root.rotation.y,Math.atan2(dx,dz),Math.min(1,dt*5));
      root.position.y=animal.waterfowl?(root.position.z<-500?.13:.026):groundHeightAt(root.position.x,root.position.z);
      for(const [i,leg] of animal.legs.entries())leg.rotation.x=Math.sin(now*.006+i*Math.PI)*.29;
    }
  }
  const rioCityPreviousUpdate=updateWorldExpansion;
  updateWorldExpansion=function(){
    rioCityPreviousUpdate();
    updateRioCityActivities();
    updateRioCityLife();
  };
  window.OTTHI_RIO_CITY=Object.freeze({diagnostics:()=>({
    activities:Object.keys(RIO_CITY_ACTIVITIES).length,active:rioCurrentActivity(),
    people:[...rioLife.people].map(([id,p])=>({id,x:p.group.position.x,z:p.group.position.z,action:p.lifeAction})),
    animals:[...rioLife.animals].map(([id,p])=>({id,x:p.root.position.x,z:p.root.position.z,visible:p.root.visible})),
    traffic:[...rioLife.traffic.values()].flat().map(v=>({id:v.id,x:v.group.position.x,z:v.group.position.z,speed:v.currentSpeed}))
  })});

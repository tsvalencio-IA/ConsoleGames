/** Regional paddocks and canonical trips to Kart Legends. */
// @otthi-module-body
  const RIO_REGIONAL_CIRCUITS=Object.freeze({
    mirassol:{
      id:'mirassol',label:'Autódromo de Mirassol',x:-590,z:-520,w:152,d:136,
      navX:-590,navZ:-443,
      description:'Paddock de Mirassol. A pista fictícia abre no Kart Legends.',
      accent:0xddb43c,curb:0x1d864d,grass:0x527844
    },
    cedral:{
      id:'cedral',label:'Parque de Velocidade de Cedral',x:650,z:-540,w:156,d:134,
      navX:650,navZ:-459,
      description:'Paddock de Cedral. A pista fictícia abre no Kart Legends.',
      accent:0xb4543c,curb:0xb14c37,grass:0x73804e
    }
  });

  const RIO_REGIONAL_ROADS=(()=>{
    const nodes={},edges=[],highways=[];
    function connect(id,label,anchor,coordinates){
      const points=coordinates.map(([x,z])=>({x,z,y:0}));
      let previous=anchor;
      points.slice(1).forEach((point,index)=>{
        const name='RIO_AUTODROMO_'+id.toUpperCase()+'_'+(index+1);
        nodes[name]={x:point.x,z:point.z};
        edges.push([previous,name]);
        previous=name;
      });
      highways.push({id:'rio-autodromo-'+id,name:label,regional:true,width:8.5,shoulder:1.3,closed:false,points});
    }
    connect('mirassol','Estrada do Autódromo de Mirassol','EXT_outer-link_6',[
      [-480,-320],[-500,-366],[-543,-404],[-590,-432],[-590,-443]
    ]);
    connect('cedral','Estrada do Parque de Velocidade de Cedral','EXT_outer-link_3',[
      [680,-400],[675,-429],[650,-450],[650,-459]
    ]);
    return{nodes,edges,highways};
  })();

  // A protected paddock does not become a residential/traffic placement lot.
  // Approach roads terminate outside these land envelopes.
  const RIO_REGIONAL_RESERVATIONS=Object.values(RIO_REGIONAL_CIRCUITS).map(({id,x,z,w,d})=>({
    id:'circuit-'+id,kind:'kart',x,z,w,d,margin:.35
  }));

  // Keep only one set of paint/material batches per venue. Each group can be
  // turned off at a distance without rebuilding structures or parking karts.
  function decorateRioRegionalCircuit(spec,root){
    const batches=new Map(),{x:cx,z:cz}=spec;
    const concrete=0xc6b89d,steel=0x333d42,glass=0x74a5a7,white=0xf2ecd9,brick=0xae6a4d,terra=0xaa4b35;
    function piece(color,x,y,z,w,h,d,ry=0){
      if(!batches.has(color))batches.set(color,[]);
      batches.get(color).push({x:cx+x,y,z:cz+z,w,h,d,ry});
    }
    function solid(color,x,z,w,d,h){
      piece(color,x,h/2,z,w,h,d);
      world.colliders.push({x:cx+x,z:cz+z,w,d,height:h,regionalCircuit:spec.id});
    }
    function sign(text,x,y,z,w,color=steel){
      const background='#'+color.toString(16).padStart(6,'0');
      return citySign(root,text,cx+x,y,cz+z,w,1,background,Math.max(.52,w*.12));
    }
    const gateZ=spec.navZ-cz-1;
    piece(steel,-6,2.12,gateZ,.52,4.24,.63);piece(steel,6,2.12,gateZ,.52,4.24,.63);
    piece(spec.accent,0,4.15,gateZ,12.6,.82,.6);
    sign(spec.id==='mirassol'?'AUTÓDROMO DE MIRASSOL':'PARQUE DE VELOCIDADE • CEDRAL',0,4.16,gateZ+.34,12.2);
    sign('PISTA FICTÍCIA · KART LEGENDS',0,3.42,gateZ+.2,8.4);
    // Link the physical end of the access road to the apron, not the racing line.
    const pavement=0x565858;piece(pavement,0,.08,(gateZ+56)/2,8.5,.12,gateZ-56+4);
    piece(white,0,.148,(gateZ+60)/2,.12,.014,gateZ-60);
    piece(pavement,0,.08,59,52,.12,9);

    if(spec.id==='mirassol'){
      // Small independent boxes, glazed timing loft and a west-facing terrace.
      piece(pavement,-4,.09,46,87,.14,9);
      for(let i=0;i<6;i++){
        const x=-42+i*14;solid(concrete,x,54,12,5,3.28);
        piece(steel,x,1.38,56.55,10.9,2.76,.13);
        for(let row=1;row<7;row++)piece(0x5d6262,x,row*.38,56.63,10.62,.045,.045);
        piece(spec.accent,x,3.08,56.59,11.5,.4,.2);
        piece(steel,x,3.46,53.1,12.65,.3,7.4);
        sign('BOX '+String(i+1).padStart(2,'0'),x,3.09,56.72,2.45);
        for(const side of[-1,1])piece(white,x+side*5.65,.17,47,.12,.014,7.3);
      }
      solid(steel,34,54,17,9,5.4);
      piece(glass,34,4.26,58.56,15,1.9,.19);
      for(const x of[29,34,39])piece(steel,x,4.26,58.69,.17,2.1,.13);
      piece(spec.accent,34,5.46,54,18,.32,10);
      sign('TORRE DE CRONOMETRAGEM',34,2.02,58.66,12.6);
      for(let row=0;row<5;row++){
        const x=67+row*1.16,h=.48+row*.46;
        piece(steel,x,h/2,-1,1.22,h,28.1);
        for(let i=0;i<14;i++)piece((i+row)%4?spec.accent:spec.curb,x,h+.15,-14+i*2,.71,.26,1.68);
      }
      piece(steel,70,4.75,-1,9.3,.26,30);
      for(const z of[-15,-1,13])for(const x of[66,74])piece(steel,x,2.32,z,.28,4.64,.28);
      world.colliders.push({x:cx+69.3,z:cz-1,w:6.2,d:28,height:2.7,regionalCircuit:spec.id});
      // Service canopies in the paddock leave a travel aisle through the center.
      for(const side of[-1,1]){
        const x=side*30;piece(spec.curb,x,3.04,66,10,.23,5.65);
        for(const cardinal of[-1,1])for(const end of[-1,1])piece(steel,x+cardinal*4.35,1.46,66+end*2.2,.23,2.92,.23);
      }
      sign('PADDOCK • VISTORIA',29,3.05,69.1,8,0x1c6948);
    }else{
      // Rail-station inspired brick pavilions and terracotta sawtooth roofs.
      piece(pavement,54,.09,-6,8,.14,54);
      for(let i=0;i<4;i++){
        const z=-25+i*13;
        solid(brick,64,z,8.4,11,3.75);
        piece(steel,59.75,1.5,z,.12,2.75,9.1);
        piece(white,59.67,3.38,z,.13,.42,10.3);
        const roof=new THREE.Mesh(new THREE.CylinderGeometry(6.65,6.65,11.9,3),renderMat(terra,{roughness:.94}));
        roof.rotation.set(Math.PI/2,0,Math.PI/2);
        roof.position.set(cx+64,3.58,cz+z);
        roof.scale.set(.76,1,.41);
        root.add(roof);
        for(const f of[-1,1])piece(glass,68.24,2.4,z+f*2.7,.16,1,2.05);
        const number=citySign(root,'BOX '+String(i+1).padStart(2,'0'),cx+59.6,3.38,cz+z,3.25);
        number.rotation.y=-Math.PI/2;
      }
      solid(concrete,-30,50,17,3.5,3.3);
      piece(terra,-30,3.44,50,18.3,.34,4.6);
      for(let row=0;row<4;row++){
        const z=48-row*1.12,h=.43+row*.42;
        piece(brick,-31,h/2+.02,z,22,h,1.15);
        for(let i=0;i<11;i++)piece(row%2?white:spec.accent,-41+i*2,h+.17,z,1.58,.24,.66);
      }
      piece(white,-31,4.75,47,23,.21,6);
      for(const x of[-42,-31,-20])for(const z of[44.6,49.3])piece(steel,x,2.3,z,.26,4.6,.26);
      world.colliders.push({x:cx-31,z:cz+46.2,w:22,d:4.7,height:1.95,regionalCircuit:spec.id});
      sign('ARQUIBANCADA DA ESTAÇÃO',-31,4.7,50.18,13,brick);
      for(let i=0;i<7;i++)piece(0xe4d9bb,-52+i*3.4,.28,62,1.6,.46,1.6);
      sign('PADDOCK • ESTAÇÃO',-24,2.48,65,8,brick);
    }
    // Marshal landmarks at the far end of each course, outside the racing lane.
    const boothX=spec.id==='mirassol'?-13:24,boothZ=spec.id==='mirassol'?-54:-57;
    solid(white,boothX,boothZ,3.4,3.6,2.85);
    piece(glass,boothX,1.85,boothZ+1.84,2.5,1,.14);
    piece(spec.accent,boothX,3.02,boothZ,4.1,.33,4.2);
    for(const [x,z]of[[-65,28],[73,34],[-67,-48],[55,-53]]){
      piece(steel,x,3.15,z,.16,6.3,.16);
      piece(steel,x,6.25,z,.82,.29,.42);
      piece(white,x,6.17,z,.72,.19,.27);
    }
    for(const [color,items]of batches)v705BatchBoxes(items,renderMat(color,{roughness:color===glass?.32:.82}),root,'RIO_PISTA_ACABAMENTO_'+color.toString(16));
  }

  const rioKartVenueRoots=new Map();
  function updateRioRegionalCircuits(){
    if(!running||!worldGroup)return;
    const focus=otGamesFocus();
    for(const site of Object.values(RIO_REGIONAL_CIRCUITS)){
      const distance=Math.hypot(focus.x-site.x,focus.z-site.z);
      let root=rioKartVenueRoots.get(site.id);
      if(!root&&distance<245){
        root=new THREE.Group();
        root.name='OTTHI_RIO_PADDOCK_'+site.id.toUpperCase();
        decorateRioRegionalCircuit(site,root);
        worldGroup.add(root);rioKartVenueRoots.set(site.id,root);
        registerInteractable({id:'kart-race-'+site.id,type:'activity-venue',icon:'🏁',
          label:'Kart Legends · '+site.label,x:site.navX,z:site.navZ,radius:4.5,priority:205,
          available:()=>!otGames.active&&!worldVenues.session&&!player.vehicle,
          action:()=>openRioKartVenue(site)});
      }
      if(root)root.visible=distance<305;
    }
  }
  function openRioKartVenue(site){
    const archived=state.races?.regionalCircuits?.[site.id];
    openModal(site.label,'<p>O circuito fictício abre a pista regional no Kart Legends.</p>'+
      (archived?.bestTime?'<p>Seu tempo anterior no Mundo Aberto: '+Number(archived.bestTime).toFixed(1)+' s.</p>':'')+
      '<button class="btn primary" data-rio-kart-enter>Entrar no Kart Legends</button>',root=>{
        root.querySelector('[data-rio-kart-enter]').onclick=()=>{
          closeModal();venueOpen('kart-'+site.id);
        };
      });
    return true;
  }
  window.OTTHI_RIO_CIRCUITS=Object.freeze({diagnostics:()=>({
    records:{...state.races?.regionalCircuits},
    circuits:Object.values(RIO_REGIONAL_CIRCUITS).map(site=>({
      id:site.id,label:site.label,x:site.x,z:site.z,navX:site.navX,navZ:site.navZ,
      kind:'kart-legends',loaded:rioKartVenueRoots.has(site.id),visible:!!rioKartVenueRoots.get(site.id)?.visible
    }))
  })});

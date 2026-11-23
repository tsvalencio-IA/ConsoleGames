/** Regional landmarks use the World scene, shops, activity controls and save. */
// @otthi-module-body
  const rioV51World={roots:new Map(),registered:false,markers:[],nextSectorAt:0};
  const rioV51Palette={
    swift:[0xa35541,0xe7b897],station:[0xad533a,0xe6cc9f],tower:[0xd7cdad,0x7c9da3],
    church:[0xe5cfac,0x98735b],mall:[0xc9cbbe,0x3c7e88],market:[0xc7a67e,0x446b58],
    commerce:[0xd1b797,0xb46545],hospital:[0xd5e1db,0x597d9d],hall:[0xaebec1,0x574b66],
    terminal:[0x98aab5,0x33566b],service:[0xd7d0a4,0x3b657a],gate:[0xb9ad9a,0x648265]
  };

  function rioV51Building(batch,p,draw){
    const {box,collider,part}=draw,{w,h,d,shape}=p;
    const [wall,accent]=rioV51Palette[shape],front=d/2-.37;
    if(shape==='gate'){
      for(const side of [-1,1]){
        box(side*w*.36,1.7,0,w*.25,3.4,d-1,wall);
        collider(side*w*.36,0,w*.25,d-1,3.4);
      }
      box(0,3.82,front, w,.5,2.6,accent);
      box(0,3.53,front+.96,w*.51,.44,.14,accent);
      return;
    }
    const pitched=['swift','station','church','market'].includes(shape);
    const shellH=h*(pitched?.68:.86),sideW=w*.92;
    box(0,shellH/2,0,sideW,shellH,d-1,wall);
    collider(0,0,sideW,d-1,shellH);
    if(pitched){
      part(shape==='station'?'roof':'hip',0,shellH+(h-shellH)*.48,0,w,h-shellH,d,accent);
    }else{
      box(0,shellH+.24,0,w,.47,d,accent);
      box(0,shellH+.69,front,w,.48,.35,wall);
    }
    const floors=Math.max(1,Math.min(5,Math.floor(shellH/3.4)));
    const columns=Math.max(3,Math.min(8,Math.floor(w/2.9)));
    for(let level=0;level<floors;level++){
      for(let i=0;i<columns;i++){
        const x=(i-(columns-1)/2)*(w-.9)/columns;
        if(!level&&Math.abs(x)<1.72)continue;
        rioWindowModule(draw,x,2.2+level*(shellH-1.1)/floors,front,Math.min(1.45,w/columns*.65),1.45,wall);
      }
    }
    box(0,1.65,front+.08,3.2,3.3,.16,0x34616f);
    box(0,3.45,front+.80,Math.min(8,w*.52),.28,1.85,accent);
    if(shape==='church'){
      for(const side of [-1,1]){
        box(side*w*.36,shellH*.68,-d*.30,w*.17,shellH*1.35,d*.21,wall);
        part('hip',side*w*.36,shellH*1.42,-d*.30,w*.20,2,d*.23,accent);
      }
      part('post',0,shellH*.66,front+.17,1.9,.19,1.9,0xded1b9,0,Math.PI/2);
      box(0,h*.74,-d*.32,w*.24,h*.52,d*.17,wall);
      box(0,h+.42,-d*.32,.22,1.8,.22,0xd5aa63);
      box(0,h+.61,-d*.32,1.3,.22,.22,0xd5aa63);
    }else if(shape==='swift'){
      for(const x of [-.43,-.24,.24,.43])box(x*w,shellH*.46,front+.17,.43,shellH*.92,.26,accent);
      box(0,shellH*.86,front+.18,w*.89,.31,.26,accent);
      part('post',-w*.36,h*.58,-d*.32,1.15,h*1.16,1.15,wall);
    }else if(shape==='tower'||shape==='terminal'){
      box(-w*.32,shellH+.6,-d*.17,w*.22,1.2,d*.22,accent);
    }
    if(shape==='hospital'){
      box(0,shellH-.9,front+.18,1.9,.38,.095,0xb1474d);
      box(0,shellH-.9,front+.2,.38,1.9,.095,0xb1474d);
    }
    if(shape==='mall'||shape==='hall'){
      for(const side of [-1,1])box(side*w*.30,2.6,front+.15,w*.27,3.8,.17,0x5f8f95);
    }
  }

  function rioV51Outdoors(p,draw){
    const {box,collider,tree,part,bench}=draw,{w,d,h,shape}=p;
    const cream=0xe5d1ac,stone=0xb7b6ac,steel=0x535e63;
    if(shape==='stadium'||shape==='arena'){
      box(0,.25,0,w*.67,.4,d*.70,shape==='stadium'?0x519353:cream);
      if(shape==='stadium')box(0,.464,0,.12,.035,d*.65,0xf7efd9);
      for(const side of [-1,1]){
        for(let row=0;row<3;row++)box(0,.48+row*.36,side*(d*.30+row*.55),w*.88,.85+row*.7,1.04,row===2?0x6d8387:cream);
        collider(0,side*d*.35,w*.88,2.05,1.95);
        const x=side*w*.37;
        part('post',x,4, -d*.37,.24,8,.24,steel);
        box(x,7.85,-d*.37,1.25,.54,.47,0xf0e0a0);
      }
      if(p.key==='parque_peao_barretos'){
        // Lightweight arena details share existing batched meshes, not a
        // second stadium scene or expensive individual shadow casters.
        box(0,.32,0,w*.50,.16,d*.46,0x996b47);
        for(let i=0;i<12;i++){
          const a=i*Math.PI/6,x=Math.cos(a)*w*.30,z=Math.sin(a)*d*.27;
          part('post',x,1.05,z,.13,2.10,.13,0xc5a36e);
        }
        for(const side of[-1,1]){
          box(side*w*.31,1.16,0,.12,1.72,d*.62,0xe8d7a7);
          box(0,1.16,side*d*.28,w*.62,1.72,.12,0xe8d7a7);
          box(0,4.95,side*d*.40,w*.77,.46,.70,0x9f633f);
        }
        box(0,2.50,-d*.36,6.1,4.5,.23,0x8a593a);
        box(0,4.35,-d*.35,7.3,.55,.45,0xd1a35a);
      }
      return;
    }
    if(shape==='bridge'){
      box(0,.50,0,w,.52,2.6,cream);
      const mast=w*.17;
      box(mast,4.5,0,.48,9,.48,stone);
      for(const offset of [-8,-6,-4,4,6,8]){
        const x=offset/18*w,dx=mast-x,dy=7.2;
        box(x+dx/2,4.3,0,.09,Math.hypot(dx,dy),.09,cream,0,-Math.atan2(dx,dy));
      }
      return;
    }
    if(shape==='capi'){
      box(0,.3,0,5,.6,4,stone);
      part('canopy',0,1.54,0,3,1.65,1.8,0x91623c);
      part('canopy',1.35,1.94,0,1.44,1.2,1.36,0xa37148);
      part('canopy',1.91,1.72,0,.88,.63,1.02,0x865532);
      for(const x of [-1,.75])for(const z of [-.43,.43])box(x,.89,z,.35,.59,.34,0x926644);
      collider(0,0,5,4,2.3);return;
    }
    if(shape==='obelisk'){
      box(0,.39,0,4.3,.78,4.3,stone);
      part('hip',0,4.1,0,2.8,7.1,2.8,0xd4c9af);collider(0,0,4,4,7.6);return;
    }
    box(0,.07,0,w,.12,d,shape==='beach'?0xcdb582:cream);
    if(shape==='pool'||shape==='beach'){
      box(0,.14,-d*.16,w*.72,.025,d*.54,0x4f96b5);
      for(const side of [-1,1]){
        tree(side*w*.35,d*.28,3.4,0x628959);
        bench(side*w*.25,d*.36);
      }
      if(p.key==='thermas_laranjais'){
        // Two distinct pools, raised slides and shaded viewing terraces.
        for(const side of[-1,1]){
          box(side*w*.24,.16,-d*.22,w*.23,.04,d*.36,0x48b6cc);
          box(side*w*.24,1.28,-d*.20,w*.09,2.35,.24,0xf2a54d);
          box(side*w*.20,2.45,-d*.21,w*.21,.20,1.15,0xf6b86b);
          box(side*w*.13,1.70,-d*.34,w*.19,.20,.29,0xea7b5e);
          for(let n=0;n<3;n++){
            box(side*w*.29,1.05+n*.50,-d*.45+n*.32,.62,.11,.55,0xede1bb);
          }
        }
        for(const x of[-w*.32,0,w*.32])box(x,2.55,d*.33,2.6,.28,2.1,0xdba76f);
      }else if(p.key==='termas_ibira'){
        // Thermal-water pavilion and bathing terraces.
        for(const x of[-w*.22,w*.22]){
          box(x,.20,-d*.18,w*.25,.06,d*.34,0x6cb3c0);
          for(const z of[-d*.36,d*.04])part('post',x,1.60,z,.18,3.2,.18,0xc9b7a2);
          box(x,3.28,-d*.16,w*.30,.35,d*.42,0xb2a394);
        }
        box(0,.18,d*.16,w*.61,.12,d*.15,0xd7c4ad);
      }
    }else if(shape==='lookout'){
      for(const [x,z,scale] of [[-5,-3,8],[0,-4,10],[6,-2,6]])part('canopy',x,scale*.36,z,scale,scale*.72,scale*.75,0x697b56);
      collider(0,-3,w*.75,8,h*.6);
    }else{
      tree(-w*.38,-d*.30,4.2,0x6a9553,0xe2ba53);
      tree(w*.38,-d*.30,4.5,0x619157,0xd5ab59);
      bench(0,d*.29);
      box(0,.22,-d*.18,w*.39,.38,d*.40,stone);
    }
  }


  // Landmark-specific, low-draw-call facades. The native interior/entrance
  // still owns interaction, while the exterior is streamed by district.
  function rioV51MallFacade(p,draw){
    if(p.shape!=='mall')return;
    const {box,part}=draw,front=p.d/2-.33,accent={
      riopreto_shopping:0x439c9f,shopping_iguatemi:0xaa906e,
      plaza_avenida:0x8a725c,shopping_cidade_norte:0x337c8b
    }[p.key]||0x608f91;
    // Open, slightly elevated forecourt with planters and tactile walkway.
    box(0,.077,front+2.32,p.w*.88,.14,3.9,0xd9d3c6);
    for(const side of[-1,1]){
      const planterX=side*p.w*.34;
      box(planterX,.27,front+2.0,p.w*.17,.52,1.1,0xc3b7a1);
      for(let i=0;i<3;i++)part('canopy',planterX+(i-1)*.66,.81,front+2.0,.52,.85,.46,0x567c54);
    }
    if(p.key==='riopreto_shopping'){
      // Official entrance reference: white facade, curved cyan-green
      // glass frontage and round shade fixtures on slim white supports.
      box(0,5.12,front+.19,p.w*.84,5.8,.17,0xeae8df);
      for(let i=-5;i<=5;i++){
        const t=i/5,x=t*p.w*.25,arch=3.95+2.55*Math.sqrt(Math.max(0,1-t*t));
        box(x,arch*.53,front+.33,p.w*.048,arch*.73,.13,0x458b90);
        box(x,arch+.12,front+.34,p.w*.052,.25,.16,0xd4ece5);
      }
      for(const side of[-1,1]){
        const x=side*p.w*.40;
        part('post',x,2.20,front+2.3,.20,4.4,.20,0xf0f0ec);
        part('canopy',x,4.4,front+2.3,1.72,.19,1.68,0x516568);
      }
    }else if(p.key==='shopping_iguatemi'){
      box(0,5.4,front+.20,p.w*.85,6.8,.22,0xd9c9b3);
      box(0,5.65,front+.32,p.w*.60,5.55,.15,0x4c8189);
      for(const x of[-p.w*.27,-p.w*.13,0,p.w*.13,p.w*.27])
        box(x,5.65,front+.44,.15,5.65,.20,0xe8e2d3);
      box(0,8.92,front+.52,p.w*.77,.42,.73,accent);
    }else if(p.key==='plaza_avenida'){
      for(let i=0;i<7;i++){
        const x=(i-3)*p.w*.11;
        box(x,5.1,front+.23,p.w*.092,5.6,.20,i%2?0xb49b79:0xe3d8c4);
      }
      box(0,7.9,front+.47,p.w*.76,.50,.60,accent);
      box(0,3.14,front+.41,p.w*.52,2.5,.11,0x648a96);
    }else if(p.key==='shopping_cidade_norte'){
      box(0,6.2,front+.20,p.w*.82,5.6,.18,0xd3e1dd);
      for(const side of[-1,1]){
        box(side*p.w*.28,5.6,front+.38,p.w*.25,4.2,.15,0x4c8596);
        box(side*p.w*.25,8.2,front+.45,p.w*.37,.38,.26,accent);
      }
      box(0,4.15,front+.50,p.w*.34,4.4,.11,0x76a9ae);
      box(0,8.54,front+.61,p.w*.69,.45,.52,0x466f81);
    }
  }

  function rioV51DrawPlace(batch,p){
    const draw=rioLocal(batch,{...p,yaw:p.face===1?0:Math.PI});
    if(rioV51Palette[p.shape])rioV51Building(batch,p,draw);
    else rioV51Outdoors(p,draw);
    rioV51MallFacade(p,draw);
    draw.box(0,.08,p.d/2+1.65,Math.min(p.w,7.3),.13,3.45,0xd4c8ab);
    if(typeof decorateRioCitySite==='function')decorateRioCitySite(p,draw);
    const tall=!!rioV51Palette[p.shape]&&p.shape!=='gate',signY=tall?Math.min(p.h*.44,4.55):p.shape==='gate'?3.82:1.45;
    draw.sign(p.name,0,signY,p.d/2+.04+(p.shape==='gate'?.9:0),Math.min(p.w-.8,16),.86, p.fictional?'#775e39':'#284d54');
  }

  function rioV51DrawCourse(batch,root){
    const course=RIO_V51.course;
    for(let i=1;i<course.route.length;i++){
      const a=course.route[i-1],b=course.route[i],x=(a.x+b.x)/2,z=(a.z+b.z)/2;
      const height=groundHeightAt(x,z)+.066;
      const len=Math.hypot(a.x-b.x,a.z-b.z);
      batch.part('box',x,height,z,4.4,.13,len+4,0xcba897,Math.atan2(b.x-a.x,b.z-a.z));
    }
    for(const p of course.lakes){
      const y=groundHeightAt(p.x,p.z);
      batch.part('box',p.x,y+.08,p.z,p.w,.15,p.d,0x5195b1);
      for(const side of [-1,1]){
        batch.part('box',p.x+side*p.w/2,y+.32,p.z,.24,.64,p.d,0x859b9b);
        batch.part('box',p.x,y+.32,p.z+side*p.d/2,p.w,.64,.24,0x859b9b);
      }
      registerCollider(p.x,p.z,p.w,p.d,{height:.8,rioV51Lake:p.id});
    }
    const {x,z}=course.start,y=groundHeightAt(x,z);
    for(const side of [-1,1])batch.part('box',x,y+1.58,z+side*2.85,.35,3.16,.36,0x346b58);
    batch.part('box',x,y+3.35,z,.41,.47,6.1,0x346b58);
    const markerGeo=new THREE.RingGeometry(1.45,2.12,28);
    for(const [i,p] of course.gates.entries()){
      const marker=new THREE.Mesh(markerGeo,new THREE.MeshBasicMaterial({color:i===5?0x4cd2a5:0xffd66b,side:THREE.DoubleSide}));
      marker.rotation.x=-Math.PI/2;marker.position.set(p.x,groundHeightAt(p.x,p.z)+.145,p.z);
      marker.visible=false;root.add(marker);
      rioV51World.markers.push(marker);
    }
  }

  function rioV51Location(p){
    if(p.nativeVenue==='football')return{id:p.id,name:p.name,icon:'⚽',group:RIO_V51.sectors[p.sector].label,
      x:p.visitX,z:p.visitZ,navX:p.navX,navZ:p.navZ,
      description:'Estádio jogável inspirado no Benedito Teixeira, com partidas de futebol 4 × 4 e pista de atletismo.'};
    return{id:p.id,name:p.name,icon:RIO_REGIONAL_ACTIVITIES[p.key]?.icon||(p.fictional?'🌄':'📍'),group:RIO_V51.sectors[p.sector].label,
      x:p.visitX,z:p.visitZ,navX:p.navX,navZ:p.navZ,
      description:RIO_REGIONAL_ACTIVITIES[p.key]?'Comprar ingresso e participar de atividades; o histórico é preservado no seu progresso.':p.fictional?'Local fictício criado para o jogo.':'Local de referência com fachada estilizada e posição adaptada ao mapa.'};
  }

  // Persistent delivery ledger for the regional construction and hardware stores.
  // Orders have a real game address, simulated travel time, receipt and pickup.
  // Never claim a courier delivered until the player receives the goods.
  const RIO_CONSTRUCTION_CATALOG=Object.freeze({
    materials:[
      {id:'cement',label:'Saco de cimento',price:42,unit:'saco'},
      {id:'brick',label:'Tijolos para construção',price:35,unit:'lote'},
      {id:'sand',label:'Areia para obra',price:58,unit:'carga'},
      {id:'tile',label:'Piso cerâmico',price:86,unit:'caixa'},
      {id:'paint',label:'Tinta para parede',price:73,unit:'lata'},
      {id:'roof',label:'Telhas',price:68,unit:'pacote'},
      {id:'door',label:'Porta de madeira',price:115,unit:'unidade'},
      {id:'window',label:'Janela de vidro',price:136,unit:'unidade'},
      {id:'wire',label:'Fiação elétrica',price:54,unit:'rolo'},
      {id:'pipe',label:'Tubulação hidráulica',price:61,unit:'kit'}
    ],
    tools:[
      {id:'hammer',label:'Martelo',price:45,unit:'unidade'},
      {id:'drill',label:'Furadeira',price:195,unit:'unidade'},
      {id:'saw',label:'Serrote',price:78,unit:'unidade'},
      {id:'tape',label:'Trena',price:26,unit:'unidade'},
      {id:'ladder',label:'Escada',price:98,unit:'unidade'},
      {id:'toolbox',label:'Caixa de ferramentas',price:120,unit:'unidade'}
    ]
  });
  const rioRegisteredDeliveries=new Set();
  let nextDeliveryAddressSync=0;
  function rioConstructionSave(){
    const save=rioMapSave();
    save.constructionOrders??=[];
    save.constructionInventory??={};
    return save;
  }
  function rioDeliveryHomes(){
    const compact=typeof compactRio!=='undefined'?(compactRio.sites||[]):[];
    const historic=typeof rioCompactWorld==='function'&&rioCompactWorld()&&typeof RIO_PRETO_LAYOUT!=='undefined'&&typeof rioHistoricHomeSite==='function'
      ?RIO_PRETO_LAYOUT.lots.filter(lot=>lot.style.startsWith('house-')).map(rioHistoricHomeSite):[];
    const available=[];
    for(const site of [...compact,...historic]){
      if(site.kind!=='residence'||!site.propertyId)continue;
      if(site.style==='rios-ditalia'){
        for(const num of ['101','102','201','202','301','302']){
          const id=num==='101'?site.propertyId:site.propertyId+'-unit-'+num;
          if(rioPropertyTitle(id)?.owned)available.push({...site,propertyId:id,name:site.name+' · Apartamento '+num});
        }
      }else if(rioPropertyTitle(site.propertyId)?.owned)available.push(site);
    }
    return available;
  }
  function rioDeliveryAddress(site){return {x:site.entry[0],z:site.entry[1]};}
  function rioRegisterHomeDelivery(site){
    const actionId='rio-construction-receive-'+site.propertyId;
    if(rioRegisteredDeliveries.has(site.propertyId)&&world.interactables.some(item=>item.id===actionId))return;
    rioRegisteredDeliveries.add(site.propertyId);
    const pos=rioDeliveryAddress(site);
    registerInteractable({
      id:actionId,
      type:'delivery',icon:'📦',label:'Receber materiais de construção',...pos,radius:3.5,priority:262,
      available:()=>running&&!paused&&!player.vehicle&&!player.boating&&
        rioPropertyTitle(site.propertyId)?.owned&&
        rioConstructionSave().constructionOrders.some(o=>o.destinationId===site.propertyId&&
          o.status==='en-route'&&Date.now()>=o.readyAt),
      action:()=>{
        const saved=rioConstructionSave();
        const pending=saved.constructionOrders.filter(o=>o.destinationId===site.propertyId&&o.status==='en-route'&&Date.now()>=o.readyAt);
        if(!pending.length){toast('Nenhuma entrega disponível neste endereço.','info',1700);return;}
        openModal('Entrega recebida · '+site.name,
          '<p>Confirme o recebimento dos materiais neste endereço.</p><div class="choice-grid">'+
          pending.map(o=>'<div class="choice"><b>'+escapeHtml(o.label)+'</b><span>'+o.quantity+' '+escapeHtml(o.unit)+' · Pedido #'+o.id+'</span></div>').join('')+
          '</div><div class="modal-actions"><button class="btn primary" data-rio-construction-receive>Receber itens</button></div>',
          root=>{root.querySelector('[data-rio-construction-receive]').onclick=()=>{
            const now=Date.now();
            for(const order of pending){
              if(order.status!=='en-route'||now<order.readyAt)continue;
              saved.constructionInventory[order.productId]=(saved.constructionInventory[order.productId]||0)+order.quantity;
              order.status='delivered';order.deliveredAt=now;
            }
            saveState(true);closeModal();toast('Materiais recebidos e registrados no estoque.','good',2600);
          };});
      }
    });
  }
  function rioConstructionDeliveryReport(){
    const orders=rioConstructionSave().constructionOrders;
    const homes=rioDeliveryHomes();
    openModal('Minhas entregas e materiais',
      '<p>Pedidos vinculados à sua propriedade; os materiais recebidos ficam no estoque para a futura etapa de reformas.</p>'+
      '<div class="choice-grid">'+orders.slice(-12).reverse().map(o=>{
        const site=homes.find(h=>h.propertyId===o.destinationId);
        const ready=o.status==='en-route'&&Date.now()>=o.readyAt;
        return '<div class="choice"><b>#'+o.id+' · '+escapeHtml(o.label)+'</b><span>'+
          escapeHtml(site?.name||o.destinationName)+' · '+o.quantity+' '+escapeHtml(o.unit)+' · '+
          (o.status==='delivered'?'Recebido':ready?'Aguardando recebimento no imóvel':'Em transporte')+'</span></div>';
      }).join('')+'</div>'+
      '<p><b>Estoque recebido:</b> '+(Object.entries(rioConstructionSave().constructionInventory)
        .map(([id,n])=>escapeHtml(id)+': '+n).join(' · ')||'Nenhum item')+'</p>'+
      '<div class="modal-actions"><button class="btn" data-rio-delivery-close>Fechar</button></div>',
      root=>{root.querySelector('[data-rio-delivery-close]').onclick=closeModal;});
  }
  function rioOpenRegionalConstructionStore(place){
    const stock=RIO_CONSTRUCTION_CATALOG[place.shop];
    if(!stock)return false;
    const homes=rioDeliveryHomes();
    const report=rioConstructionSave();
    openModal(place.name,
      '<p>Produtos desta loja: '+(place.shop==='materials'?'materiais para construção':'ferramentas')+
      '. Escolha o produto e o endereço de entrega. O frete é simulado dentro do jogo.</p>'+
      (homes.length?'':'<p>Para receber entregas, primeiro adquira uma casa ou apartamento em Rio Preto.</p>')+
      '<div class="choice-grid">'+stock.map(item=>
        '<button class="choice" data-rio-construction-buy="'+item.id+'" '+(!homes.length?'disabled':'')+'><b>'+
        escapeHtml(item.label)+'</b><span>'+item.price+' moedas · '+item.unit+'</span></button>').join('')+
      '</div><div class="modal-actions"><button class="btn" data-rio-delivery-orders>Meus pedidos ('+
      report.constructionOrders.length+')</button></div>',
      root=>{
        root.querySelector('[data-rio-delivery-orders]').onclick=rioConstructionDeliveryReport;
        for(const button of root.querySelectorAll('[data-rio-construction-buy]'))button.onclick=()=>{
          const item=stock.find(x=>x.id===button.dataset.rioConstructionBuy);
          if(!item)return;
          const available=rioDeliveryHomes();
          openModal('Entrega · '+item.label,
            '<p>Escolha qual imóvel receberá a compra.</p>'+
            '<div class="choice-grid">'+available.map(home=>
              '<button class="choice" data-rio-deliver-house="'+escapeHtml(home.propertyId)+'"><b>'+
              escapeHtml(home.name)+'</b><span>Entregar '+escapeHtml(item.unit)+' · '+item.price+' moedas</span></button>'
            ).join('')+'</div>',root=>{
              for(const choice of root.querySelectorAll('[data-rio-deliver-house]'))choice.onclick=()=>{
                const home=rioDeliveryHomes().find(x=>x.propertyId===choice.dataset.rioDeliverHouse);
                if(!home||Number(state.profile.coins)<item.price){
                  toast('Escolha uma propriedade própria e tenha moedas suficientes.','warn',2300);return;
                }
                choice.disabled=true;
                const save=rioConstructionSave();
                const nextId=(Math.max(0,...save.constructionOrders.map(x=>Number(x.id)||0))+1);
                save.constructionOrders.push({
                  id:nextId,productId:item.id,label:item.label,quantity:1,unit:item.unit,
                  shopId:place.id,destinationId:home.propertyId,destinationName:home.name,
                  paid:item.price,status:'en-route',purchasedAt:Date.now(),readyAt:Date.now()+45000
                });
                addCoins(-item.price);rioRegisterHomeDelivery(home);saveState(true);
                toast('Pedido #'+nextId+' confirmado. Entrega simulada no seu imóvel.','good',2800);
                rioConstructionDeliveryReport();
              };
            });
        };
      });
    return true;
  }


  // Existing regional attractions become paid, persistent player activities.
  // No replacement of the landmark, original world economy or legacy saves.
  const RIO_REGIONAL_ACTIVITIES=Object.freeze({
    termas_ibira:{label:'Banho nas águas termais',ticket:55,needs:{fun:18,hygiene:22,energy:12},icon:'♨️'},
    thermas_laranjais:{label:'Dia no parque aquático',ticket:95,needs:{fun:35,hygiene:12,energy:-7},icon:'🏊'},
    parque_peao_barretos:{label:'Participar do festival de Barretos',ticket:80,needs:{fun:28,energy:-10,hunger:-10},icon:'🎡'}
  });
  function rioRegionalExperience(p){
    const experience=RIO_REGIONAL_ACTIVITIES[p.key];
    if(!experience)return false;
    const save=rioMapSave();
    save.regionExperience??={visits:{},paidTotal:0};
    const visits=save.regionExperience.visits[p.id]||{count:0,spent:0};
    openModal(p.name,
      '<p>'+experience.label+' · atividade jogável e registrada no seu histórico de viagens.</p>'+
      '<p>Ingresso: <b>'+experience.ticket+' moedas</b> · Seu saldo: <b>'+state.profile.coins+' moedas</b></p>'+
      '<p>Visitas anteriores: '+visits.count+'.</p>'+
      '<div class="modal-actions"><button class="btn primary" data-regional-join>Comprar ingresso e participar</button>'+
      '<button class="btn" data-regional-cancel>Voltar</button></div>',root=>{
      let busy=false;
      root.querySelector('[data-regional-cancel]').onclick=closeModal;
      root.querySelector('[data-regional-join]').onclick=()=>{
        if(busy||!running||player.vehicle||player.boating||otGames.active)return;
        if(Number(state.profile.coins)<experience.ticket){toast('Moedas insuficientes para esta atividade.','warn',1900);return;}
        busy=true;
        const finish=()=>{
        if(Number(state.profile.coins)<experience.ticket)return false;
        addCoins(-experience.ticket);
        const record=save.regionExperience.visits[p.id]||{count:0,spent:0};
        record.count++;record.spent+=experience.ticket;record.lastVisit=Date.now();
        save.regionExperience.visits[p.id]=record;
        save.regionExperience.paidTotal+=experience.ticket;
        for(const [need,delta] of Object.entries(experience.needs)){
          if(!(need in state.needs))continue;
          state.needs[need]=clamp(Number(state.needs[need]||0)+delta,0,100);
        }
        saveState(true);updateHUD();closeModal();
        toast(experience.label+' concluído. Visita registrada em '+p.name+'.','good',2800);
        return true;
        };
        // Thermal-water activities require the player's avatar to walk into
        // the physical pool and complete the animation before spending coins.
        if(p.shape==='pool'&&typeof beginCharacterActivity==='function'&&
          typeof CHARACTER_ACTIVITIES!=='undefined'&&CHARACTER_ACTIVITIES['rio-pool']){
          const target={x:p.x,z:p.z+p.face*p.d*.19};
          const pose={x:p.x,z:p.z-p.face*p.d*.16,y:.32,
            yaw:p.face===1?0:Math.PI,lying:true};
          const started=beginCharacterActivity('rio-pool',{target,pose,walkSpeed:1.9,
            commit:finish});
          if(started){closeModal();return;}
          busy=false;return;
        }
        finish();
      };
    });
    return true;
  }

  function rioV51Visit(p){
    if(RIO_REGIONAL_ACTIVITIES[p.key])return rioRegionalExperience(p);
    if(rioV51InteriorKind(p)&&typeof rioCompactWorld==='function'&&rioCompactWorld()){
      // An action can be invoked before distance-streaming finishes this sector.
      // Mount its existing native store interior on demand instead of opening
      // the old facade-only modal while the player stands at the entrance.
      let indoorMall=rioV51IndoorMalls.get(p.id);
      if(!indoorMall){
        const sector=RIO_V51.sectors[p.sector];
        const root=rioV51World.roots.get(p.sector)||mountRioV51Sector(sector);
        root.visible=true;
        indoorMall=rioV51IndoorMalls.get(p.id);
      }
      if(indoorMall)return indoorMall.enter();
      toast('O interior deste estabelecimento não pôde ser carregado.','warn',2300);
      return false;
    }
    if(p.nativeVenue==='football')return openFootballV705();
    if(p.key==='portaria_damha')return openRioStreetRun();
    if(p.shop==='tools'||p.shop==='materials')return rioOpenRegionalConstructionStore(p);
    if(p.shop)return openCityShop(p.id);
    if(p.key==='prefeitura_andalo')return openCivilMissions();
    if(p.key==='aeroporto_sjrp')return openFlightAcademy();
    if(typeof openRioCitySite==='function'&&openRioCitySite(p))return true;
    const label=p.fictional?'Área fictícia do OTTHI World.':'Fachada estilizada em posição adaptada dentro do jogo.';
    openModal(p.name,'<p>'+label+'</p>'+(p.fictional?'':'<p>Endereço de referência: '+escapeHtml(p.address)+'</p>')+
      '<button class="btn primary" data-rio-visit-close>Voltar ao passeio</button>',root=>{
        root.querySelector('[data-rio-visit-close]').onclick=closeModal;
      });
    return true;
  }
  function rioV51Register(){
    rioV51World.registered=true;
    for(const home of rioDeliveryHomes())rioRegisterHomeDelivery(home);
    for(const p of RIO_V51.places){
      if(!legacyRegionalLayout&&!RIO_RECOVERED_SECTORS.includes(p.sector))continue;
      if(p.nativeVenue)continue;
      if(['market','fastfood','cafe'].includes(p.shop))cityCoast.shops.set(p.id,{
        id:p.id,label:p.name,kind:p.shop,x:p.x,z:p.visitZ,navX:p.visitX,navZ:p.visitZ,
        face:p.face,description:'Itens do comércio do OTTHI World.'
      });
      const run=p.key==='portaria_damha';
      registerInteractable({id:p.id,type:run?'race':p.shop?'shop':'viewpoint',icon:run?'🏃':'📍',
        label:run?'Corrida de Rua · Represa e Damha':p.name,x:p.visitX,z:p.visitZ,radius:run?4:3.5,priority:run?250:215,
        available:()=>!activeRace&&!SPORTS_V705.active&&!player.vehicle&&!player.boating&&!otGames.active&&!currentHouse&&!(rioV51InteriorKind(p)&&rioV51IndoorMalls.get(p.id)?.inside),
        action:()=>rioV51Visit(p)});
    }
  }
  function updateRioV51World(){
    if((!legacyRegionalLayout&&!rioCompactWorld())||!running||!worldGroup||!worldExpansion.ready)return;
    if(!rioV51World.registered)rioV51Register();
    if(performance.now()>=nextDeliveryAddressSync){
      nextDeliveryAddressSync=performance.now()+3000;
      for(const home of rioDeliveryHomes())rioRegisterHomeDelivery(home);
    }
    const focus=otGamesFocus();
    let next=null,distance=Infinity;
    for(const sector of Object.values(RIO_V51.sectors)){
      if(!legacyRegionalLayout&&!RIO_RECOVERED_SECTORS.includes(sector.id))continue;
      const d=Math.hypot(focus.x-sector.x,focus.z-sector.z);
      const root=rioV51World.roots.get(sector.id);
      if(root){root.visible=d<195;continue;}
      if(d<210&&d<distance){next=sector;distance=d;}
    }
    if(!next||performance.now()<rioV51World.nextSectorAt)return;
    mountRioV51Sector(next).visible=distance<195;
    rioV51World.nextSectorAt=performance.now()+55;
  }

  const RIO_V51_INTERIOR_TYPES=Object.freeze({
    mall:'mall',hospital:'reception',station:'station',hall:'exhibition',
    terminal:'airport',tower:'civic',market:'market',church:'church',
    swift:'theater',service:'reception',commerce:'bakery'
  });
  const rioV51InteriorKind=p=>{
    if(p.shop==='market')return 'market';
    if(p.shop==='fastfood')return 'dining';
    if(p.shop==='cafe')return 'bakery';
    return RIO_V51_INTERIOR_TYPES[p.shape]||null;
  };
  const rioV51IndoorMalls=new Map();
  function rioV51MountPlayableMall(p,sectorRoot){
    const outside=new THREE.Group();outside.name='RIO_MALL_FACADE_'+p.key;
    const batch=rioCreateBatch(outside),before=world.colliders.length;
    rioV51DrawPlace(batch,p);batch.commit();sectorRoot.add(outside);
    const outsideColliders=world.colliders.slice(before);
    const site={
      id:p.id,key:p.key,name:p.name,kind:rioV51InteriorKind(p),style:'urban',
      x:p.x,z:p.z,w:p.w,d:p.d,yaw:p.face===1?0:Math.PI,
      entry:[p.visitX,p.visitZ],street:p.address
    };
    // Native OT stores, not a static mall modal. Shelves, clothing, shoes and
    // food are built only when the player approaches this district.
    const room=rioMountPlace(site,sectorRoot);
    if(!room)return null;
    const record={site,room,outside,outsideColliders,inside:false};
    room.legacyResidence=true;room.legacyRecord=record;
    room.root.visible=false;
    for(const collider of room.colliders)collider.disabled=true;
    const doorway={x:p.visitX,z:p.visitZ};
    function enter(){
      if(record.inside||player.vehicle||player.boating||currentHouse)return false;
      record.inside=true;outside.visible=false;room.root.visible=true;
      for(const collider of outsideColliders)collider.disabled=true;
      for(const collider of room.colliders)collider.disabled=false;
      if(room.gate)room.gate.disabled=true;
      const point=room.point(0,site.d*.25);
      player.x=point.x;player.z=point.z;player.y=groundHeightAt(point.x,point.z);
      player.vx=player.vy=player.vz=0;player.grounded=true;
      player.facing=site.yaw;playerGroup.position.set(player.x,player.y,player.z);
      cameraMode='interior';cameraYaw=site.yaw;cameraPitch=.24;cameraZoom=2.8;
      rioMapSave().activeRegionalMall=site.id;
      rememberSafePlayerPosition(true);saveState(true);updateContext(true);
      return true;
    }
    function leave(){
      if(!record.inside)return false;
      record.inside=false;room.root.visible=false;outside.visible=true;
      for(const collider of room.colliders)collider.disabled=true;
      for(const collider of outsideColliders)collider.disabled=false;
      const point={x:doorway.x+Math.sin(site.yaw)*1.1,z:doorway.z+Math.cos(site.yaw)*1.1};
      player.x=point.x;player.z=point.z;player.y=groundHeightAt(point.x,point.z);
      player.vx=player.vy=player.vz=0;player.grounded=true;
      cameraMode='openworld';playerGroup.position.set(player.x,player.y,player.z);
      delete rioMapSave().activeRegionalMall;
      rememberSafePlayerPosition(true);saveState(true);updateContext(true);
      return true;
    }
    if(p.shop==='materials'||p.shop==='tools'){
      room.action('construction-counter','Comprar e solicitar entrega de materiais',0,-site.d*.16,
        ()=>rioOpenRegionalConstructionStore(p),{inside:true,icon:'🧱',radius:2.8});
    }
    room.action('exit-regional-mall','Sair do estabelecimento',0,site.d*.31,leave,{inside:true,icon:'🚪',radius:2.9});
    record.enter=enter;record.leave=leave;
    rioV51IndoorMalls.set(site.id,record);
    if(rioMapSave().activeRegionalMall===site.id)enter();
    return record;
  }

  function mountRioV51Sector(sector){
    const existing=rioV51World.roots.get(sector.id);
    if(existing)return existing;
    const root=new THREE.Group();root.name='RIO_V51_'+sector.id;root.visible=false;
    const batch=rioCreateBatch(root);batch.root=root;
    for(const p of sector.places){
      if(p.nativeVenue)continue;
      if(rioV51InteriorKind(p)&&typeof rioCompactWorld==='function'&&rioCompactWorld()){
        rioV51MountPlayableMall(p,root);
      }else rioV51DrawPlace(batch,p);
      if(typeof addRioCityLights==='function')addRioCityLights(p,root);
    }
    if(sector.id==='represa_lagos_damha')rioV51DrawCourse(batch,root);
    batch.commit();
    worldGroup.add(root);rioV51World.roots.set(sector.id,root);
    world.navCache?.clear?.();
    return root;
  }
  function arriveAtRioV51(){
    const swift=RIO_V51.places.find(p=>p.key==='complexo_swift');
    const root=mountRioV51Sector(RIO_V51.sectors[swift.sector]);
    if(!rioV51World.registered)rioV51Register();
    const approach={x:swift.visitX-5,z:swift.visitZ+swift.face*24};
    const safe=safePointNear(approach.x,approach.z,{allowWater:false,distances:[0,.8,1.6,2.4]});
    if(Math.hypot(safe.x-approach.x,safe.z-approach.z)>3)return false;
    root.visible=true;
    player.x=safe.x;player.z=safe.z;player.y=safe.y;
    player.vx=player.vy=player.vz=0;player.grounded=true;
    cameraMode='openworld';cameraYaw=Math.atan2(swift.x-player.x,player.z-swift.z);cameraPitch=.30;cameraZoom=4;
    player.facing=Math.PI-cameraYaw;
    playerGroup.position.set(player.x,player.y,player.z);playerGroup.rotation.y=player.facing;
    rememberSafePlayerPosition(true);
    updateCamera(2);
    savePlayerPosition(true);
    return true;
  }

  function rioUsesMappedCourse(){return typeof inRioMap==='function'&&inRioMap()||typeof rioCompactWorld==='function'&&rioCompactWorld();}
  function rioStreetRecord(){const course=rioUsesMappedCourse()?rioMap.course:RIO_V51.course;return state.races?.streetRuns?.[course?.id];}
  function openRioStreetRun(){
    const separateRio=rioUsesMappedCourse();const {name}=separateRio?rioMap.course:RIO_V51.course,record=rioStreetRecord();
    openModal(name,(separateRio?'<p>Percorra 300 metros na pista de caminhada da Represa e passe pelos seis pontos.</p>':'<p>Passe pelos seis pontos na ordem. Siga a calçada em volta dos lagos e termine no pórtico da Damha.</p>')+
      (record?'<p>Melhor tempo: '+Number(record.best).toFixed(2)+' s</p>':'')+
      '<button class="btn primary" data-rio-run-start>Largar a pé</button>',root=>{
        root.querySelector('[data-rio-run-start]').onclick=()=>{
          if(activeRace||SPORTS_V705.active||player.vehicle||player.boating||currentHouse||otGames.active)return;
          closeModal();startRioStreetRun();
        };
      });
  }
  function startRioStreetRun(){
    const separateRio=rioUsesMappedCourse();
    const course=separateRio?rioMap.course:RIO_V51.course;
    if(activeRace||(!separateRio&&!rioV51World.roots.has('represa_lagos_damha'))||!course||player.vehicle||player.boating||otGames.active)return false;
    const {x,z}=course.start;
    activeRace={type:'rio-street',courseId:course.id,nextGate:0,elapsed:0,countdown:3,outside:0};
    clearMovementInputs();
    player.x=x;player.z=z;player.y=groundHeightAt(x,z);player.vx=player.vz=player.vy=0;
    player.facing=separateRio?Math.atan2(course.route[1].x-x,course.route[1].z-z):-Math.PI/2;cameraYaw=separateRio?Math.PI-player.facing:Math.PI/2;
    v705Hud('🏃 '+course.name,'3 s');
    return true;
  }
  function finishRioStreetRun(completed){
    const race=activeRace;
    if(race?.type!=='rio-street')return false;
    activeRace=null;
    for(const marker of (rioUsesMappedCourse()?rioMap.courseMarkers:rioV51World.markers))marker.visible=false;
    v705HudOff();
    if(completed){
      const previous=rioStreetRecord()||{},best=Math.min(race.elapsed,Number(previous.best)||Infinity);
      (state.races.streetRuns||={})[race.courseId]={runs:(previous.runs||0)+1,best,last:race.elapsed};
      state.stats.races++;trackDaily('race',1);saveState(true);
      toast('Corrida concluída · '+race.elapsed.toFixed(2)+' s','good',2800);
    }else toast('Corrida encerrada. Volte ao pórtico para tentar novamente.','info',2400);
    return true;
  }
  function updateRioStreetRun(dt){
    const race=activeRace,separateRio=rioUsesMappedCourse(),course=separateRio?rioMap.course:RIO_V51.course;
    if(player.vehicle||player.boating||currentHouse||otGames.active)return finishRioStreetRun(false);
    if(race.countdown>0){
      race.countdown=Math.max(0,race.countdown-dt);
      els.raceStatus.textContent=String(Math.max(1,Math.ceil(race.countdown)));
      return;
    }
    const onRoute=course.route.slice(1).some((end,i)=>{
      const at=projectPointToSegment(player,course.route[i],end);
      return Math.hypot(player.x-at.x,player.z-at.z)<4.5;
    });
    race.outside=onRoute?0:race.outside+dt;
    race.elapsed+=dt;
    if(race.outside>2.5||race.elapsed>=360)return finishRioStreetRun(false);
    const target=course.gates[race.nextGate];
    if(Math.hypot(player.x-target.x,player.z-target.z)<2.45&&player.y-groundHeightAt(player.x,player.z)<2.3){
      race.nextGate++;
      if(race.nextGate===course.gates.length)return finishRioStreetRun(true);
      beep(970,45);
    }
    for(const [i,marker] of (separateRio?rioMap.courseMarkers:rioV51World.markers).entries())marker.visible=i===race.nextGate;
    const next=course.gates[race.nextGate];
    els.raceStatus.textContent=(race.nextGate+1)+'/6 · '+next.label+' · '+race.elapsed.toFixed(1)+' s';
  }

  const rioV51PreviousExpansion=updateWorldExpansion;
  updateWorldExpansion=function(){rioV51PreviousExpansion();updateRioV51World();};
  const rioV51PreviousLocations=expansionMapLocations;
  expansionMapLocations=function(){return [...rioV51PreviousLocations(),...RIO_V51.places.filter(p=>legacyRegionalLayout||rioCompactWorld()&&RIO_RECOVERED_SECTORS.includes(p.sector)).map(rioV51Location)];};
  const rioV51PreviousDirectory=worldExploreDirectoryHtml;
  worldExploreDirectoryHtml=function(...args){
    if(!legacyRegionalLayout&&!rioCompactWorld())return rioV51PreviousDirectory(...args);
    const groups=Object.values(RIO_V51.sectors).filter(sector=>legacyRegionalLayout||RIO_RECOVERED_SECTORS.includes(sector.id)).map(sector=>
      '<details><summary>'+escapeHtml(sector.label)+' · '+sector.places.length+'</summary><div class="choice-grid">'+
      sector.places.map(p=>'<button class="choice" data-rio-v51-route="'+p.id+'"><b>'+escapeHtml(p.name)+'</b><span>'+
        (p.fictional?'Local fictício':'Fachada estilizada')+'</span></button>').join('')+'</div></details>').join('');
    return '<details data-rio-v51-directory><summary>Rio Preto e região · '+RIO_V51.places.length+' locais</summary>'+
      groups+'</details>'+rioV51PreviousDirectory(...args);
  };
  const rioV51PreviousBind=worldExploreBindDirectory;
  worldExploreBindDirectory=function(root,...args){
    rioV51PreviousBind(root,...args);
    for(const button of root.querySelectorAll('[data-rio-v51-route]'))button.onclick=()=>{
      closeModal();setWaypoint(button.dataset.rioV51Route);
    };
  };
  window.OTTHI_RIO_V51=Object.freeze({
    diagnostics:()=>({places:RIO_V51.places.length,sectors:Object.keys(RIO_V51.sectors).length,
      loaded:[...rioV51World.roots.keys()],visible:[...rioV51World.roots.values()].filter(root=>root.visible).length,
      course:{record:rioStreetRecord(),active:activeRace?.type==='rio-street'?{...activeRace}:null},
      shoppingAction:(()=>{
        const id='regional-shopping_cidade_norte',target=world.interactables.find(a=>a.id===id);
        return {running,paused,modalHidden:els.modal.hidden,compact:rioCompactWorld(),
          map:document.body.dataset.otthiMap,lockedMs:Math.max(0,actionLockedUntil-performance.now()),
          previous:lastActionSource,current:currentContext?.id,available:!!target&&isInteractionAvailable(target),
          targetExists:!!target,near:!!target&&Math.hypot(player.x-target.x,player.z-target.z)};
      })(),
      malls:[...rioV51IndoorMalls.values()].map(m=>({id:m.site.id,inside:m.inside,visible:m.room.root.visible,facade:m.outside.visible,
        sectorVisible:!!rioV51World.roots.get(RIO_V51.places.find(p=>p.id===m.site.id)?.sector)?.visible,
        entry:m.site.entry,position:{x:player.x,z:player.z}}))}),
    locations:()=>RIO_V51.places.map(rioV51Location)
  });

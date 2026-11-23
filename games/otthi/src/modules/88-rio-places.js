/** Walkable lots. Doors, furnishings, service actions and their collision shapes share coordinates. */
// @otthi-module-body
  const rioPlaceStyles={
    market:{wall:0xe0c69a,trim:0x944638,roof:0xb05743,floor:0xcebca1,height:5.6,sign:'MERCADO MUNICIPAL'},
    dining:{wall:0xc18e62,trim:0x733f31,roof:0x8f5440,floor:0xc59772,height:3.8},
    bakery:{wall:0xcab391,trim:0x986039,roof:0x6e6457,floor:0xc6b8a2,height:3.7},
    church:{wall:0xe5d6ba,trim:0x9d8065,roof:0x83504b,floor:0xb5a08b,height:7.9,sign:'CATEDRAL SÃO JOSÉ'},
    civic:{wall:0xc3bdab,trim:0x54717b,roof:0x81847d,floor:0xb9b8ac,height:5.7,sign:'PAÇO MUNICIPAL'},
    theater:{wall:0xa4573d,trim:0x653e34,roof:0x795348,floor:0xa89380,height:6.5,sign:'SWIFT · PAULO MOURA'},
    exhibition:{wall:0xc0b9aa,trim:0x486267,roof:0x657e82,floor:0xa9ab9f,height:5.7},
    mall:{wall:0xd1c2a6,trim:0x498084,roof:0x777b73,floor:0xbebbae,height:5.4},
    reception:{wall:0xd4d9d2,trim:0x668887,roof:0x7e9190,floor:0xc5cec5,height:4.1},
    station:{wall:0xb0babe,trim:0x435c69,roof:0x627985,floor:0xafb8ba,height:5},
    airport:{wall:0xd1d8dd,trim:0x365e76,roof:0x6e8088,floor:0xa7adb3,height:5.7,sign:'AEROPORTO PROF. ERIBELTO MANOEL REINO'},
    residence:{wall:0xddc5a5,trim:0x6e6054,roof:0x995540,floor:0xc6ad8e,height:3.2},
  };
  const rioDiningStock=[
    {id:'meal',name:'Prato da casa',price:24,hunger:42},
    {id:'juice',name:'Suco gelado',price:10,hunger:10},
    {id:'parcel',name:'Lanche para levar',price:18,food:2}
  ];
  const rioSiteLabels={
    market:'Percorrer as bancas e comprar alimentos',dining:'Pedir no balcão e consumir à mesa',
    bakery:'Comprar pães ou consumir à mesa com atendimento',church:'Visitar a nave, as obras e os altares',
    civic:'Solicitar e retirar um protocolo do jogo',theater:'Retirar ingresso e acender o palco na cabine',
    exhibition:'Retirar ingresso e visitar a exposição',mall:'Percorrer as lojas de roupas e calçados',
    reception:'Retirar uma senha e usar a recepção',station:'Consultar o painel e alcançar a plataforma',
    fuel:'Entrar no pátio e abastecer o carro na bomba',stadium:'Jogar futebol 4 × 4',
    practice:'Entrar no gramado e treinar chutes',square:'Descansar em um banco da praça',
    garden:'Percorrer o caminho e cuidar dos vasos',trail:'Largar para os seis checkpoints da Represa',
    statue:'Aproximar-se da escultura e observar a orla',airport:'Terminal, pátio, pista 07/25 e aviação',
    residence:'Visitar, comprar e usar os cômodos', 'oil-shop':'Entrar com o carro para revisar o motor'
  };
  const rioPaint={
    window:0x426979,glass:0x7dafa9,metal:0x3f5055,white:0xf1e6cf,wood:0x8b5840,
    seat:0x9e6346,stone:0xb3a99a,paving:0xa6a99c,green:0x527b55,brick:0xa85d43
  };

  function rioSiteLayout(site,root){
    const batch=rioCreateBatch(root);batch.root=root;
    const draw=rioLocal(batch,site);
    const {point}=draw,colliders=[],actions=[],lights=[];
    const forSite=(x,z,r=0)=>rioSiteContains(site,x,z,r);
    function collider(x,z,w,d,height){
      const ring=[point(x-w/2,z-d/2),point(x+w/2,z-d/2),point(x+w/2,z+d/2),point(x-w/2,z+d/2)].map(p=>[p.x,p.z]);
      const [x0,z0,x1,z1]=rioCoordinateBounds(ring);
      const c={x:(x0+x1)/2,z:(z0+z1)/2,w:x1-x0,d:z1-z0,height,rioRings:[ring]};
      world.colliders.push(c);colliders.push(c);
    }
    function object(x,y,z,w,h,d,color){
      draw.box(x,y,z,w,h,d,color);collider(x,z,w,d,h);
    }
    function action(suffix,label,x,z,handler,options={}){
      const target={id:site.id+'-'+suffix,type:'activity',label,icon:'●',...point(x,z),radius:1.75,priority:248,
        ...options,
        available:()=>root.visible&&(!options.vehicleOnly?!player.vehicle:player.vehicle)&&!player.boating&&!SPORTS_V705.active&&!activeRace&&!characterActivities.session&&
          (!options.inside||forSite(player.x,player.z,-.44))&&(options.available?.()??true),
        action:handler};
      registerInteractable(target);actions.push(target.id);
    }
    function bench(x,z){
      draw.bench(x,z);collider(x,z,2.2,.58,1.03);
    }
    return {...draw,site,bench,batch,root,colliders,actions,lights,object,action,collider,forSite};
  }

  function rioSiteContains(site,x,z,pad=0){
    const dx=x-site.x,dz=z-site.z,s=Math.sin(site.yaw),c=Math.cos(site.yaw);
    return Math.abs(c*dx-s*dz)<site.w/2+pad&&Math.abs(s*dx+c*dz)<site.d/2+pad;
  }
  function rioPlayerAt(point,radius=1.85){
    return running&&!player.vehicle&&!player.boating&&!paused&&player.grounded&&Math.hypot(player.x-point.x,player.z-point.z)<=radius;
  }
  function rioCountVisit(site){
    const visits=rioMapSave().visits??={};
    if(!visits[site.id]){visits[site.id]=true;addXP(12);}
    saveState(true);
  }

  function rioBuildShell(site,room){
    const base=rioPlaceStyles[site.kind],p=site.style==='damha'?{...base,wall:0xe3e2d9,trim:0x586364,roof:0x4c585a}:base;
    const {w,d}=site,{box,object,sign}=room;
    const h=p.height,edge=.27,entry=site.kind==='market'?4.8:Math.min(3.1,w*.4);
    const front=d/2-edge,length=(w-entry)/2,center=(w+entry)/4;
    box(0,.028,0,w,.055,d,p.floor);
    object(0,h/2,-front,w,h,.39,p.wall);
    for(const side of [-1,1]){
      object(side*(w/2-edge),h/2,0,.39,h,d,p.wall);
      object(side*center,h/2,front,length,h,.42,p.wall);
      box(side*(entry/2+.13),1.48,front+.23,.19,2.96,.23,p.trim);
      for(let offset=entry/2+.82;offset<w/2-.70;offset+=2.38){
        const paneW=Math.min(1.68,2*(w/2-offset-.31));
        box(side*offset,2.02,front+.222,paneW,1.28,.10,rioPaint.window);
        box(side*offset,2.02,front+.29,.09,1.27,.05,rioPaint.white);
        box(side*offset,1.35,front+.30,paneW+.16,.12,.16,p.trim);
      }
    }
    box(0,(h+2.95)/2,front,entry+.14,h-2.95,.43,p.wall);
    box(0,2.91,front+.33,entry+.43,.18,.34,p.trim);
    box(0,.031,d/2+.63,entry+.88,.058,1.85,rioPaint.paving);
    // Address, threshold and doorway are in the same open wall.
    sign(p.sign||site.name,0,h-.69,d/2+.005,Math.min(w-.72,17),.56,
      site.kind==='market'?'#87352e':site.kind==='dining'?'#62422f':'#294b56');

    const roof=new THREE.Group();roof.name='RIO_ROOF_'+site.key;room.root.add(roof);
    const cap=rioCreateBatch(roof),top=rioLocal(cap,site);
    if(['market','church','theater','dining','bakery'].includes(site.kind)||site.kind==='residence'&&site.style!=='damha'){
      top.box(0,h+.06,0,w+.12,.17,d+.12,p.trim);
      top.part('hip',0,h+.66,0,w+.25,1.24,d+.20,p.roof);
    }else top.box(0,h+.16,0,w+.15,.34,d+.15,p.roof);
    if(site.kind==='market'){
      // Cream stucco, rounded end towers and red-brimmed canopy reference the Mercado Municipal.
      for(const side of [-1,1]){
        room.part('post',side*(w/2-1.04),h*.54,front-.56,1.85,h*1.11,1.85,p.wall);
        for(const y of [2.04,2.46,2.88,3.30])box(side*(w/2-1.04),y,front+.18,1.41,.16,.18,rioPaint.window);
      }
      box(0,3.09,front+.76,Math.min(7.9,w-.4),.23,1.66,p.trim);
    }
    if(site.kind==='church'){
      for(const side of [-1,1]){
        top.box(side*w*.34,h+1.75,d*.37,2.5,4.35,2.55,p.wall);
        top.part('hip',side*w*.34,h+4.05,d*.37,2.78,1.35,2.8,p.roof);
      }
      top.box(0,h+2.13,-d*.38,.17,1.75,.17,0xaf9360);
      top.box(0,h+2.37,-d*.38,1.2,.16,.17,0xaf9360);
    }
    if(site.key==='canecao_represa'){
      for(const x of [-w*.41,-w*.20,w*.20,w*.41])object(x,1.49,front+.55,.32,2.98,.32,rioPaint.brick);
      box(0,2.99,front+.62,w-.16,.22,1.24,p.trim);
    }
    cap.commit();
    room.roof=roof;
  }

  function rioTable(room,x,z,{seatOffset=.9,side=1,cloth=0xe7d3b7}={}){
    const {box,object,point}=room;
    object(x,.79,z,1.18,.12,1.06,rioPaint.wood);
    box(x,.871,z,1.03,.021,.95,cloth);
    for(const dx of [-.47,.47])for(const dz of[-.36,.36])box(x+dx,.37,z+dz,.085,.74,.085,rioPaint.wood);
    const sx=x+side*seatOffset;
    box(sx,.465,z,.52,.09,.53,rioPaint.seat);
    box(sx+side*.22,.735,z,.075,.51,.52,rioPaint.wood);
    for(const dz of[-.20,.20])box(sx,.22,z+dz,.37,.44,.077,rioPaint.wood);
    // The place to stand is alongside the chair. Sitting starts on the furniture itself.
    room.collider(sx,z,.54,.56,.96);
    const table=point(x,z),chair=point(sx,z),approach=point(sx,z+1.02);
    return {table,chair,approach,yaw:Math.atan2(table.x-chair.x,table.z-chair.z),seatTop:.51};
  }

  function rioCounter(room,x,z,width=3.05,accent=rioPaint.wood){
    room.object(x,.49,z,width,.98,.65,accent);
    room.box(x,1.014,z,width+.12,.068,.76,rioPaint.white);
    room.box(x+width*.24,1.18,z-.08,.47,.26,.32,rioPaint.window);
    return room.point(x,z+1.02);
  }

  function rioPurchaseItems(item){
    if(!Number.isSafeInteger(item.price)||item.price<1||Number(state.profile.coins)<item.price){
      toast('Moedas insuficientes.','warn',1800);return false;
    }
    addCoins(-item.price);
    for(const key of ['food','water'])if(item[key])state.inventory[key]=Math.min(999,Math.max(0,Number(state.inventory[key]||0))+item[key]);
    if(item.hunger)state.needs.hunger=clamp(Number(state.needs.hunger||0)+item.hunger,0,100);
    return true;
  }
  function rioOpenDining(site,room,counter){
    if(!rioPlayerAt(counter))return;
    const stock=site.kind==='bakery'?[{id:'bread-coffee',name:'Pão na chapa e café',price:12,hunger:22},
      {id:'juice',name:'Suco de laranja',price:10,hunger:10},{id:'bread-pack',name:'Pães para levar',price:16,food:3}]:site.key==='canecao_represa'?rioDiningStock:
      [{id:'burger',name:'Hambúrguer',price:14,hunger:38},{id:'juice',name:'Bebida sem álcool',price:10,hunger:10},{id:'parcel',name:'Lanche para levar',price:18,food:2}];
    const order=rioMap.order;
    if(order?.site===site.id){
      toast('Seu pedido está na mesa indicada. Você paga ao consumir.','info',2800);
      return;
    }
    openModal(site.name,'<p>Faça o pedido no balcão. Para consumir aqui, vá até a mesa indicada.</p><div class="choice-grid">'+
      stock.map(item=>'<button class="choice" data-rio-food="'+item.id+'"><b>'+item.name+'</b><span>'+item.price+' moedas</span></button>').join('')+
      '</div>',root=>{
      for(const button of root.querySelectorAll('[data-rio-food]'))button.onclick=()=>{
        if(button.disabled||Math.hypot(player.x-counter.x,player.z-counter.z)>1.85||!room.root.visible)return;
        const item=stock.find(record=>record.id===button.dataset.rioFood);
        if(!item)return;
        if(Number(state.profile.coins)<item.price){toast('Moedas insuficientes.','warn',1800);return;}
        button.disabled=true;
        closeModal();
        if(item.food){
          if(rioPurchaseItems(item)){rioCountVisit(site);toast('Lanche entregue no balcão.','good',2100);}
        }else{
          const seat=room.seats[0];
          rioMap.order={site:site.id,item,seat};
          if(room.server){
            room.server.index=0;room.server.serving=true;room.server.tray.visible=true;
            toast('A garçonete vai levar seu pedido à mesa 1.','good',2600);
          }else{
            room.servedDish.visible=true;
            toast('Pedido pronto na mesa 1. Use Ação junto à cadeira.','good',2900);
          }
        }
      };
    });
  }

  function rioEatAtTable(site,room,seat){
    const order=rioMap.order;
    if(order?.site!==site.id||order.seat!==seat||!room.root.visible||!room.servedDish.visible||!rioPlayerAt(seat.approach))return false;
    if(!rioSiteContains(site,seat.chair.x,seat.chair.z,-.35)||Math.hypot(seat.table.x-seat.chair.x,seat.table.z-seat.chair.z)>1.12)return false;
    const kind=order.item.id==='juice'?'drink':'meal';
    return beginCharacterActivity(kind,{
      target:{...seat.approach},pose:{...seat.chair,y:seat.seatTop,yaw:seat.yaw,sitting:true},
      commit:()=>{
        if(order!==rioMap.order||!room.root.visible||!rioPlayerAt(seat.approach,.26))return false;
        if(!rioPurchaseItems(order.item))return false;
        rioMap.order=null;room.servedDish.visible=false;
        setFlag('ateMeal');state.stats.restaurantMeals=(state.stats.restaurantMeals||0)+1;
        rioCountVisit(site);return true;
      }
    });
  }
  function rioBuildDining(site,room){
    const {w,d}=site, x=Math.min(4.2,w*.25),z=-Math.min(2.0,d*.13);
    room.seats=[rioTable(room,-x,z,{side:1,cloth:0xcf8251}),rioTable(room,x,z,{side:-1,cloth:0xf2e2ca})];
    const marked=room.seats[0], dish=new THREE.Mesh(new THREE.CylinderGeometry(.23,.22,.065,16),renderMat(0xffeaba));
    dish.position.set(marked.table.x,.917,marked.table.z);dish.visible=false;dish.name='RIO_ORDER_ON_TABLE';
    room.root.add(dish);room.servedDish=dish;
    const counterZ=-d/2+1.85;
    const counter=rioCounter(room,0,counterZ,Math.min(4.6,w*.53));
    room.sign('PEDIDOS',0,2.31,counterZ-.37,Math.min(3.4,w*.6),.32);
    if(site.kind==='bakery')rioBuildBakeryService(site,room,counterZ,x,z);
    room.action('counter','Fazer pedido no balcão',0,counterZ+1.02,()=>rioOpenDining(site,room,counter),{inside:true,icon:'🍽️'});
    const p=marked.approach,dx=p.x-site.x,dz=p.z-site.z,c=Math.cos(site.yaw),s=Math.sin(site.yaw);
    room.action('table','Mesa 1 · sentar e consumir',c*dx-s*dz,s*dx+c*dz,
      ()=>rioEatAtTable(site,room,marked),{inside:true,icon:'🍽️',available:()=>rioMap.order?.site===site.id&&room.servedDish.visible});
    room.sign('1',-x,1.05,z+.04,.18,.21,'#6b3f31');
  }

  function rioBuildMarket(site,room){
    const {w,d}=site,{box,object,sign}=room, counterZ=-d/2+2.45;
    const items=site.kind==='bakery'?CITY_SHOP_STOCK.cafe:CITY_SHOP_STOCK.market;
    const stallX=Math.min(4.6,w*.26);
    const stallD=Math.min(d*.3,5.2),stallW=Math.min(1.38,w*.12);
    if(site.kind!=='bakery')for(const side of [-1,1]){
      object(side*stallX,.45,0,stallW,.90,stallD,0xa37154);
      box(side*stallX,.936,0,stallW+.08,.072,stallD,0xbe8e62);
      for(let row=0;row<5;row++)for(let col=-1;col<=1;col++){
        room.part('canopy',side*stallX+col*.23,1.06,-stallD*.37+row*stallD*.18,.22,.21,.22,
          [0xc17435,0x9b5236,0x6d8755][(row+col+4)%3]);
      }
    }
    const counter=rioCounter(room,0,counterZ,Math.min(4.7,w*.54));
    sign(site.kind==='bakery'?'PÃES':'CAIXA',0,2.63,counterZ-.35,3.15,.46);
    room.action('counter',site.kind==='bakery'?'Comprar pães no balcão':'Comprar no caixa',0,counterZ+1.02,()=>{
      if(!rioPlayerAt(counter))return;
      openModal(site.name,'<p>Produtos do jogo disponíveis no balcão.</p><div class="choice-grid">'+items.map(item=>
        '<button class="choice" data-rio-checkout="'+item.id+'"><b>'+item.name+'</b><span>'+item.price+' moedas</span></button>').join('')+'</div>',root=>{
        let sold=false;
        for(const button of root.querySelectorAll('[data-rio-checkout]'))button.onclick=()=>{
          if(sold||Math.hypot(player.x-counter.x,player.z-counter.z)>1.85||!room.root.visible)return;
          const item=items.find(record=>record.id===button.dataset.rioCheckout);
          if(!item||!rioPurchaseItems(item))return;
          sold=true;closeModal();rioCountVisit(site);toast('Compra entregue no balcão.','good',2000);
        };
      });
    },{inside:true,icon:'🛒'});
  }

  function rioDeskModel(site,room){
    const {d,w,kind}=site;
    const configs={
      civic:['ATENDIMENTO','Retirar senha','Receber o protocolo do jogo','Protocolo entregue no balcão.'],
      theater:['BILHETERIA','Retirar ingresso','Acender o palco na cabine','Luzes do palco acesas.'],
      exhibition:['RECEPÇÃO','Retirar ingresso','Ver a peça exposta','Visita registrada na exposição.'],
      reception:['RECEPÇÃO','Retirar senha','Apresentar a senha no guichê','Senha registrada no atendimento do jogo.'],
      station:['PARTIDAS','Consultar partidas','Chegar à plataforma','Você chegou à plataforma.']
    };
    const [sign,title,next,success]=configs[kind], z=-d*.19,x=Math.min(w*.26,4.2),stationX=Math.min(w*.25,3.8),stationZ=-d/2+1.2;
    const counter=rioCounter(room,-x,z,Math.min(w*.33,3.3));
    room.sign(sign,-x,2.23,z-.28,Math.min(w*.4,3.6),.46);
    const badge=rioCounter(room,stationX,stationZ,Math.min(2.3,w*.25),0x738889);
    const light=new THREE.Mesh(new THREE.SphereGeometry(.15,8,6),new THREE.MeshBasicMaterial({color:0xf8bb5b}));
    light.position.set(badge.x,1.12,badge.z-1.02);light.visible=false;room.root.add(light);room.lights.push(light);
    const seatsZ=Math.min(d*.28,3.6);
    if(kind!=='theater')room.bench(x,seatsZ);
    if(kind==='theater'){
      room.box(0,.16,-d*.40,Math.min(9.5,w*.43),.31,Math.min(3,d*.15),0x735041);
      for(let i=0;i<5;i++){
        const p=room.point((i-2)*Math.min(w*.105,1.45),-d*.42);
        const strip=new THREE.Mesh(new THREE.BoxGeometry(.47,.27,.31),new THREE.MeshBasicMaterial({color:0xffcf82}));
        strip.position.set(p.x,2.69,p.z);strip.visible=false;room.root.add(strip);room.lights.push(strip);
      }
      for(let i=0;i<3;i++)for(const side of [-1,1])room.bench(side*x,.29+i*1.17);
    }else if(kind==='exhibition'){
      room.object(0,.5,-d*.29,1.25,1,1.25,rioPaint.stone);
      room.part('canopy',0,1.55,-d*.29,.82,.9,.74,0xab7344);
    }else if(kind==='station'){
      room.sign('PLATAFORMA',stationX,2,stationZ-.35,Math.min(w*.5,6),.5);
      for(let i=-3;i<=3;i++)room.box(i*.5,.035,stationZ+2.2,.36,.036,.15,0xceb35a);
    }
    room.action('desk',title,-x,z+1.02,()=>{
      if(!rioPlayerAt(counter))return;
      room.ticket=true;light.visible=true;
      toast(next+'.','info',2700);
    },{inside:true,icon:'📋'});
    room.action('service',next,stationX,stationZ+1.02,()=>{
      if(!room.ticket||!rioPlayerAt(badge))return;
      room.ticket=false;room.lights.forEach(item=>{item.visible=true;});
      rioCountVisit(site);toast(success,'good',2600);
    },{inside:true,available:()=>room.ticket});
  }

  function rioSitOnBench(site,room,x,z){
    const approach=room.point(x,z+.81),seat=room.point(x,z);
    if(!rioPlayerAt(approach))return;
    beginCharacterActivity('rio-rest',{target:approach,pose:{...seat,y:.535,yaw:site.yaw,sitting:true},
      commit:()=>{if(!room.root.visible||!rioPlayerAt(approach,.26))return false;state.needs.energy=clamp(state.needs.energy+4,0,100);rioCountVisit(site);return true;}});
  }
  function rioBuildChurch(site,room){
    const {w,d}=site;
    const lateral=Math.min(w*.24,4.7), pewZ=Math.min(d*.20,2.8);
    for(let i=0;i<4;i++)for(const side of [-1,1])room.bench(side*lateral,pewZ-i*1.35);
    const altarZ=-d/2+1.34;
    room.object(0,.53,altarZ,Math.min(3.55,w*.54),1.06,.78,rioPaint.stone);
    room.box(0,3.72,altarZ-.66,.16,2.11,.16,0xa47d61);
    room.box(0,4.13,altarZ-.66,1.33,.16,.16,0xa47d61);
    for(const side of [-1,1])for(let j=0;j<4;j++)room.box(side*(w/2-.49),3.14+j*.21,-d*.22,.115,.19,1.24,
      [0x5b8d9d,0xc59d62,0x926d89,0x799693][j]);
    room.action('pew','Sentar no banco da Catedral',lateral,pewZ+.81,()=>rioSitOnBench(site,room,lateral,pewZ),{inside:true});
    room.action('nave','Observar a nave e os vitrais',0,altarZ+1.47,()=>{rioCountVisit(site);toast('Visita à Catedral registrada.','good',2100);},{inside:true});
    for(const side of [-1,1]){
      const x=side*Math.min(w*.28,7.5),artZ=altarZ-.48;
      room.box(x,2.13,artZ,1.17,1.56,.11,0x8c6046);
      room.box(x,2.13,artZ+.065,.99,1.36,.04,side===1?0xa69759:0x568895);
      room.box(x,2.31,artZ+.10,.48,.51,.036,0xe5c5a5);
      room.object(x,.49,altarZ+.25,1.28,.98,.61,0x9e836b);
      const kneelerZ=altarZ+1.33;
      room.object(x,.19,kneelerZ,1.17,.38,.45,0xa95c54);
      room.action('altar-'+side,'Rezar no altar lateral',x,kneelerZ+.75,()=>{
        const approach=room.point(x,kneelerZ+.75),kneeler=room.point(x,kneelerZ);
        beginCharacterActivity('rio-rest',{target:approach,pose:{...kneeler,y:.40,yaw:site.yaw+Math.PI,sitting:true},commit:()=>{rioCountVisit(site);return true;}});
      },{inside:true,icon:'🕯️'});
    }
  }

  function rioBuildFuel(site,room){
    const {w,d}=site,{box,object,sign}=room;
    box(0,.024,0,w,.048,d,0x727777);
    const road=rioRoadAt(site.road[0],site.road[1],0,r=>!r.pedestrian);
    const driveway=Math.min(23,Math.hypot(site.x-site.road[0],site.z-site.road[1])-d/2-(road?.width||6)/2);
    const lane=5.15;
    if(driveway>0)box(lane,.026,d/2+driveway/2,3.5,.049,driveway,0x777d79);
    for(const side of [-1,1])box(lane+side*1.48,.053,.75,.08,.015,5.8,0xebe0c5);
    for(const side of [-1,1]){
      object(side*(w/2-1.1),2.15,-2.25,.31,4.3,.32,rioPaint.white);
      object(side*(w/2-1.1),2.15,1.55,.31,4.3,.32,rioPaint.white);
    }
    box(0,4.41,-.35,w, .38,d*.61,0x318375);
    box(0,4.64,-.35,w,.14,d*.61,0xbcb59a);
    sign('POSTO CHIESA BRASÍLIA',0,4.44,d*.31-.32,Math.min(w-.5,17),.42,'#196953');
    box(0,.09,-.40,10.45,.18,.99,0xb7b0a0);
    for(const x of [-2.45,2.45]){
      object(x,.85,-.42,.71,1.7,.62,0xe2e4dc);
      box(x,1.16,-.08,.48,.38,.06,0x395667);
      box(x-.37,.65,-.49,.06,.91,.13,0x2d383a);
      box(x,.49,1.09,.16,.98,.16,0xf1cf7a);
    }
    room.sign('PARE JUNTO À BOMBA',0,2.52,-.76,8.4,.38);
    const p=room.point(lane,-.42);
    room.action('pump','Pare ao lado da bomba',lane,-.42,()=>rioOpenFuel(site,room,p),
      {vehicleOnly:true,icon:'⛽',actionLabel:'Abastecer',radius:2.35});
  }

  function rioBuildOpenSite(site,room){
    const {kind,w,d}=site;
    if(kind==='statue'){
      room.box(0,.22,0,3,.40,3,rioPaint.stone);
      room.part('canopy',0,1.04,0,2.10,1.22,.89,0x846446);
      room.part('canopy',.92,1.27,0,.85,.83,.71,0x846446);
      for(const x of [-.54,.45])for(const z of[-.27,.27])room.box(x,.64,z,.18,.5,.18,0x8a6340);
      room.collider(0,0,2.7,2.45,1.3);
      room.action('observe','Observar Dona Capi',0,d/2+1.1,()=>{rioCountVisit(site);toast('Escultura Dona Capi · Parque da Represa','good',2400);},{icon:'🌿'});
      return;
    }
    if(kind==='practice'){
      rioBuildPractice(site,room);
      return;
    }
    if(kind==='trail'){
      for(const x of [-1.48,1.48])room.box(x,1.44,0,.20,2.88,.25,0x52756c);
      room.box(0,2.91,0,3.24,.30,.29,0x52756c);
      room.sign('CAMINHO DA REPRESA',0,2.92,.16,3.12,.33, '#345f56');
      room.action('run','Corrida a pé · seis pontos',0,1.48,openRioGeoRun,{icon:'🏃',radius:3});
      return;
    }
    room.box(0,.028,0,w,.055,d,rioPaint.paving);
    room.bench(0,-.62);
    const planter=kind==='garden'?1.85:Math.min(3.2,w*.35);
    for(const side of [-1,1]){
      room.object(side*planter,.28,-.84,.62,.56,.62,rioPaint.stone);
      room.part('canopy',side*planter,.86,-.84,.57,.62,.59,rioPaint.green);
    }
    room.action('bench',kind==='garden'?'Descansar no jardim':'Sentar na praça',0,.19,()=>rioSitOnBench(site,room,0,-.62),{icon:'🌿'});
    if(kind==='garden')room.action('care','Regar o vaso',planter,.07,()=>{
      if(!rioPlayerAt(room.point(planter,.07)))return;
      room.sign('JARDIM CUIDADO',0,1.21,-1.2,2.4,.36);
      rioCountVisit(site);toast('Vaso regado.','good',1900);
    },{available:()=>!rioMapSave().visits?.[site.id]});
  }

  function rioMountPlace(site,parent){
    if(site.kind==='stadium'){
      createSportsComplexV704(site);
      return null;
    }
    const root=new THREE.Group();root.name='RIO_PLACE_'+site.key;parent.add(root);
    const room=rioSiteLayout(site,root);
    if(rioPlaceStyles[site.kind]){
      rioBuildShell(site,room);
      const [x,z]=site.entry,inside=room.point(0,site.d*.30);
      const id=site.id+'-entrance';
      registerInteractable({id,type:'activity',icon:'🚪',label:'Entrar · '+site.name,x,z,radius:3.2,priority:238,
        available:()=>root.visible&&!player.vehicle&&!player.boating&&!player.swimming&&!characterActivities.session&&
          !room.forSite(player.x,player.z,-.45),
        action:()=>site.kind==='residence'?rioResidenceDoor(site,room,inside):rioEnterPlace(inside)});
      room.actions.push(id);
      if(site.kind==='market')rioBuildMarket(site,room);
      else if(site.kind==='mall')rioBuildShopping(site,room);
      else if(site.kind==='dining'||site.kind==='bakery')rioBuildDining(site,room);
      else if(site.kind==='church')rioBuildChurch(site,room);
      else if(site.kind==='residence')rioBuildResidence(site,room);
      else if(site.kind==='airport')rioBuildAirportTerminal(site,room);
      else rioDeskModel(site,room);
    }else if(site.kind==='fuel')rioBuildFuel(site,room);
    else if(site.kind==='oil-shop')rioBuildOilShop(site,room);
    else rioBuildOpenSite(site,room);
    room.batch.commit();rioMap.sites.set(site.id,room);
    return room;
  }

/** Editable expansion data. The playable plan is an interpretation of Rio Preto. */
// @otthi-module-body
  const RIO_PRETO_LAYOUT = (() => {
    const highways = [], nodes = {}, edges = [];
    const pointIds = new Map([
      ['-200,-400', 'EXT_outer-link_5'],
      ['360,-400', 'EXT_outer-link_4']
    ]);
    function addRoad(id, name, points, width, detail = {}) {
      const ids = points.map(([x, z], i) => {
        const key = x + ',' + z;
        if (!pointIds.has(key)) {
          const nodeId = 'RIO_' + id + '_' + i;
          pointIds.set(key, nodeId);
          nodes[nodeId] = Object.freeze({x, z});
        }
        return pointIds.get(key);
      });
      for (let i = 1; i < ids.length; i++) edges.push(Object.freeze([ids[i - 1], ids[i]]));
      highways.push(Object.freeze({
        id: 'rio-preto-' + id, name, width, shoulder: .65, closed: false,
        regional: true, points: Object.freeze(points.map(([x, z]) => Object.freeze({x, z}))),
        ...detail
      }));
    }
    addRoad('oeste', 'Acesso Oeste de Rio Preto', [[-200,-400],[-200,-464],[-200,-511]], 10);
    addRoad('bady', 'Avenida Bady Bassitt', [[-200,-464],[-137,-464],[-76,-464],[-15,-464],[46,-464],[100,-464]], 18,
      {district:'bady', boulevard:true});
    addRoad('bora', 'Alameda do Borá', [[-200,-511],[-137,-511],[-76,-511],[-15,-511],[46,-511],[100,-511]], 8,
      {district:'bady'});
    for (const x of [-137,-76,-15,46]) {
      addRoad('quadra-' + x, 'Rua de bairro · Borá', [[x,-464],[x,-511]], 7, {district:'bady'});
    }
    addRoad('andalo', 'Avenida Alberto Andaló', [[100,-464],[100,-511],[100,-560],[100,-612],[100,-648]], 18,
      {district:'andalo', boulevard:true});
    addRoad('canela', 'Rua do Canela', [[100,-612],[27,-612]], 9, {district:'andalo'});
    addRoad('murchid', 'Avenida Murchid Homsi', [[100,-560],[172,-560],[235,-552],[295,-540],[360,-532],[438,-532]], 16,
      {district:'murchid', boulevard:true});
    addRoad('leste', 'Acesso Leste de Rio Preto', [[360,-400],[360,-479],[360,-532]], 10);
    addRoad('jardim', 'Alameda do Aterradinho', [[172,-479],[229,-479],[288,-479],[360,-479]], 8,
      {district:'murchid'});
    addRoad('atelie', 'Rua dos Ateliês', [[172,-479],[172,-560]], 8, {district:'murchid'});

    // The visual identity of each sector has its own height, setbacks and palette.
    // Yaw is the direction from the building toward its pedestrian street frontage.
    const facing = {s:0,n:Math.PI,e:Math.PI/2,w:-Math.PI/2};
    const lots = [];
    function lot(id, district, style, x, z, w, d, front, variant, title = '', kind = '') {
      lots.push(Object.freeze({id,district,style,x,z,w,d,yaw:facing[front],variant,title,kind}));
    }
    lot('bady-galeria','bady','dealership',-173,-435,24,16,'n',0,'Galeria do Borá');
    lot('bady-oficinas','bady','workfront',-103,-435,24,14,'n',1,'Ofícios do Borá');
    lot('bady-padaria','bady','arcade',-70,-435,24,15,'n',2,'Padaria da Avenida','cafe');
    lot('bady-autopecas','bady','workfront',-37,-436,25,17,'n',3,'Autopeças do Borá');
    lot('bady-loja','bady','arcade',-2,-435,22,16,'n',4,'Galeria Vitrine');
    lot('bady-mercado','bady','arcade',28,-435,24,15,'n',5,'Mercado do Borá','market');
    lot('bady-lofts','bady','mixed',62,-435,23,17,'n',6,'Edifício das Palmeiras');
    lot('bady-prelio','bady','house-court',-170,-483,18,16,'s',7);
    lot('bady-vila','bady','house-hip',-107,-484,19,16,'s',2);
    lot('bady-atelier','bady','workfront',-45,-484,25,16,'s',7,'Ateliê da Esquina');
    lot('bady-jardim','bady','house-modern',15,-484,22,16,'s',4);
    lot('bady-sol','bady','house-veranda',71,-485,20,16,'s',8);
    const homePatterns = ['house-hip','house-modern','house-veranda','house-court','house-modern','house-veranda','house-hip','house-court','house-veranda'];
    [-178,-149,-120,-91,-62,-33,-4,25,54].forEach((x, i) => {
      lot('bora-casa-' + (i + 1),'bady',homePatterns[i],x,-535-(i%3)*1.4,14+(i%4)*1.8,15+(i%3)*1.2,'s',i+12);
    });
    lot('andalo-torre-norte','andalo','tower',132,-469,24,18,'w',1,'Torre Horizonte');
    lot('andalo-centro-servicos','andalo','civic',132,-503,27,19,'w',2,'Centro de Serviços');
    lot('andalo-galeria','andalo','mixed',70,-570,23,18,'e',4,'Galeria Canela');
    lot('andalo-cafe','andalo','civic',132,-589,26,18,'w',5,'Café do Canela','cafe');
    lot('andalo-torre-sul','andalo','tower',128,-625,19,18,'w',8,'Torre das Acácias');
    lot('andalo-hotel','andalo','tower',67,-634,24,19,'e',6,'Edifício do Viajante');
    lot('andalo-apartamentos','andalo','mixed',49,-588,16,16,'s',3,'Residencial Ipê');
    lot('murchid-loja-1','murchid','workfront',204,-525,24,15,'n',2,'Oficina do Vale');
    lot('murchid-cafe','murchid','cafe-pavilion',242,-520,17,15,'n',7,'Café do Aterradinho','cafe');
    lot('murchid-servicos','murchid','workfront',284,-514,27,16,'n',5,'Pátio da Linha');
    lot('murchid-conveniencia','murchid','arcade',326,-509,22,15,'n',1,'Mercadinho do Vale','market');
    lot('murchid-armazem','murchid','workfront',393,-507,24,16,'n',0,'Armazém Leste');
    lot('murchid-viveiro','murchid','cafe-pavilion',428,-506,18,15,'n',5,'Jardins do Vale');
    [191,217,244,271,299,326].forEach((x,i) => {
      lot('aterradinho-casa-' + (i + 1),'murchid',homePatterns[(i+3)%homePatterns.length],x,-456-(i%2)*1.5,14+(i%3),15,'n',i+24);
    });
    // This table can receive the user's chosen places without moving the road network.
    const landmarks = Object.freeze([
      Object.freeze({id:'rio-bady-praca',district:'bady',name:'Praça do Borá',label:'Praça do Borá · Bady Bassitt',icon:'🏙️',x:-137,z:-442,navX:-137,navZ:-464,centerX:-137,centerZ:-435,w:27,d:22,
        note:'Avenida inspirada no eixo comercial erguido sobre o córrego Borá. A praça do jogo liga vitrines, oficinas e ruas de bairro.'}),
      Object.freeze({id:'rio-andalo-praca',district:'andalo',name:'Praça do Canela',label:'Praça do Canela · Alberto Andaló',icon:'🏛️',x:113,z:-536,navX:100,navZ:-536,centerX:130,centerZ:-536,w:31,d:29,
        note:'Trecho de serviços inspirado no eixo do córrego Canela, com edifícios mais altos, calçadas amplas e canteiros.'}),
      Object.freeze({id:'rio-murchid-parque',district:'murchid',name:'Jardim do Aterradinho',label:'Jardim do Aterradinho · Murchid Homsi',icon:'🌿',x:283,z:-566,navX:283,navZ:-542.4,centerX:283,centerZ:-588,w:86,d:46,
        note:'Passeio fictício inspirado na paisagem do vale do Aterradinho, com arborização, passarelas e áreas para caminhar.'})
    ]);
    const locations = landmarks.map(p => Object.freeze({
      ...p, group:'São José do Rio Preto', description:p.note, missionTarget:true,
      actions:['Marcar no GPS','Visitar a pé e usar AÇÃO']
    }));
    const protectedRects = [
      ...lots.map(l => ({id:'rio-lot-' + l.id,x:l.x,z:l.z,
        w:Math.abs(Math.sin(l.yaw))>.5?l.d:l.w,d:Math.abs(Math.sin(l.yaw))>.5?l.w:l.d,margin:.5})),
      ...landmarks.map(p => ({id:p.id,x:p.centerX,z:p.centerZ,w:p.w,d:p.d,margin:.5}))
    ];
    const trafficLoops = [
      [[-200,-464],[100,-464],[100,-511],[-200,-511]],
      [[172,-479],[360,-479],[360,-532],[295,-540],[235,-552],[172,-560]]
    ].map(loop => Object.freeze(loop.map(([x,z])=>Object.freeze({x,z}))));
    return Object.freeze({
      highways:Object.freeze(highways),nodes:Object.freeze(nodes),edges:Object.freeze(edges),
      lots:Object.freeze(lots),landmarks, locations:Object.freeze(locations),
      protectedRects:Object.freeze(protectedRects.map(rect=>Object.freeze(rect))),trafficLoops:Object.freeze(trafficLoops)
    });
  })();

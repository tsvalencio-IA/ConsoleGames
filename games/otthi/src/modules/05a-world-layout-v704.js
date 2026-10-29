/**
 * OTTHI World V704 — autoridade única do layout mundial.
 * Todas as vias, zonas, estruturas, acessos, destinos e áreas protegidas são
 * definidos aqui para impedir que módulos independentes criem mundos incompatíveis.
 */
// @otthi-module-body
  // Civilian neighbourhoods and cross-region routes share the same road graph.
  const CIVIL_WORLD_LINKS=(()=>{
    const highways=[],nodes={},edges=[],at=new Map();
    const anchors={'24,220':'EXT_SNOW_GATE','240,220':'EXT_serra-access_2','-550,100':'EXT_forest-link_2','-360,475':'COAST_W','680,190':'EXT_serra-loop_5','360,10':'A_SE','171,-216':'EXT_airport-access_3','300,10':'A_S','-240,160':'CV_SE'};
    function node(x,z,id){const key=x+','+z;if(anchors[key])return anchors[key];if(at.has(key))return at.get(key);nodes[id]={x,z};at.set(key,id);return id;}
    function path(id,name,points,width=9){const ids=points.map(([x,z],i)=>node(x,z,'CIVIL_'+id+'_'+i));for(let i=1;i<ids.length;i++)edges.push([ids[i-1],ids[i]]);highways.push({id:'ottovias-civil-'+id,name,width,shoulder:1,closed:false,points:points.map(([x,z])=>({x,z,y:0}))});return ids;}
    path('snow-serra','Ligação Neve–Cordilheira',[[24,220],[120,210],[210,220],[240,220]],10);
    path('forest-coast','Estrada Mata Grande–Praia',[[-550,100],[-550,240],[-500,360],[-420,440],[-360,475]],10);
    path('serra-aurora','Estrada Cordilheira–Aurora',[[680,190],[680,60],[500,60],[360,10]],10);
    const airport=path('airport-south','Ligação Sul do Aeroporto',[[171,-216],[200,-260],[200,-400]],10);edges.push([airport.at(-1),'EXT_outer-link_4'],[airport.at(-1),'EXT_outer-link_5']);
    path('cable-access','Acesso ao Teleférico',[[210,220],[210,235]],8);
    path('snow-homes','Alameda dos Chalés',[[24,220],[-74,220]],7);
    // Actual intersections, rather than disconnected visual street segments.
    const aX=[240,254,304,354,360],aZ=[42,68];
    for(const z of aZ)path('aurora-row-'+z,'Bairro Jardim Aurora',aX.map(x=>[x,z]),7);
    for(const x of[254,304,354]){const ids=path('aurora-col-'+x,'Bairro Jardim Aurora',[[x,10],[x,42],[x,68]],7);edges.push([ids[0],'A_S']);}
    const cX=[-290,-240,-190];
    for(const z of[195,221])path('coast-row-'+z,'Bairro Jardim da Costa',cX.map(x=>[x,z]),7);
    path('coast-top','Acesso Jardim da Costa',[[-290,160],[-240,160],[-190,160]],7);
    for(const x of cX)path('coast-col-'+(-x),'Bairro Jardim da Costa',[[x,160],[x,195],[x,221]],7);
    return{highways,nodes,edges};
  })();
  const WORLD_LAYOUT_V704=Object.freeze({
    version:704,
    bounds:Object.freeze({minX:-850,maxX:850,minZ:-700,maxZ:1100}),
    mountainRanges:Object.freeze([{"id":"snow-west","x":-118,"z":300,"rx":64,"rz":66,"height":62,"snow":true},{"id":"snow-central","x":-53,"z":371,"rx":66,"rz":75,"height":93,"snow":true},{"id":"snow-east","x":84,"z":376,"rx":63,"rz":73,"height":108,"snow":true},{"id":"snow-ridge","x":147,"z":305,"rx":66,"rz":76,"height":76,"snow":true},{"id":"serra-one","x":287,"z":325,"rx":77,"rz":86,"height":70,"snow":false},{"id":"serra-two","x":369,"z":394,"rx":86,"rz":77,"height":112,"snow":true},{"id":"serra-three","x":491,"z":359,"rx":78,"rz":80,"height":98,"snow":true},{"id":"serra-four","x":581,"z":452,"rx":83,"rz":53,"height":90,"snow":true},{"id":"serra-five","x":692,"z":438,"rx":92,"rz":62,"height":124,"snow":true},{"id":"forest-hill","x":-630,"z":232,"rx":108,"rz":115,"height":55,"snow":false},{"id":"forest-peak","x":-746,"z":325,"rx":76,"rz":107,"height":85,"snow":false}]),
    coast:Object.freeze({id:'costa-beach',label:'Praia da Costa Verde',x:-310,z:493,navX:-300,navZ:484,shoreZ:513,minX:-425,maxX:-210,oceanMinZ:510,oceanMaxZ:900}),
    campaignSites:Object.freeze({
      hq:{id:'hq',label:'Centro de Resgate',x:-120,z:-54,radius:22,navX:-120,navZ:-38},
      airbase:{id:'airbase',label:'Aeroporto OT',x:27,z:-169,radius:36,navX:27,navZ:-159},
      north:{id:'north',label:'Centro de Visitantes',x:85,z:115,radius:30,navX:85,navZ:109}
    }),
    campaignAircraft:Object.freeze({
      plane:{id:'plane',mode:'plane',model:'light',livery:'tour',height:.92,label:'Embarque no avião',x:-5,z:-165,yaw:Math.PI/2,radius:6},
      helicopter:{id:'helicopter',mode:'helicopter',model:'helicopter',livery:'tour',height:1.0,label:'Embarque no helicóptero',x:50,z:-165,yaw:0,radius:6}
    }),
    cities:Object.freeze({
      aurora:{id:'aurora',label:'Nova Aurora',x:300,z:-40,color:0x638fa9},
      costa:{id:'costa',label:'Costa Verde',x:-300,z:110,color:0x58a38f}
    }),
    circuits:Object.freeze({
      aurora:{id:'aurora',label:'Autódromo Nova Aurora',x:300,z:-270,scale:2.4,w:114,d:100,navX:300,navZ:-212,shape:0},
      costa:{id:'costa',label:'Autódromo Costa Verde',x:-300,z:-210,scale:2.2,w:108,d:96,navX:-300,navZ:-156,shape:1}
    }),
    activityVenues:Object.freeze({
      boxing:{id:'boxing',label:'Academia de Luta',activity:'Boxe',icon:'🥊',x:46,z:-56,w:14,d:12,navX:46,navZ:-48,face:1,slug:'boxe'},
      dance:{id:'dance',label:'Academia de Dança',activity:'Dança',icon:'🎵',x:-38,z:-58,w:12,d:12,navX:-38,navZ:-50,face:1},
      pingpong:{id:'pingpong',label:'Ginásio de Pingue-pongue',activity:'Pingue-pongue',icon:'🏓',x:48,z:18,w:14,d:12,navX:48,navZ:10,face:-1,slug:'tenis'}
    }),
    roads:Object.freeze([
      {id:'ligacao-sul-centro',x:32.5,z:-72,w:65,d:9,kind:'street'},
      {id:'costa-orla-avenida',x:-310,z:475,w:180,d:10,kind:'street'},
      {id:'district-spine',x:-308,z:-25,w:9,d:130,kind:'street'},
      {id:'district-alameda',x:-266.5,z:-21,w:83,d:6,kind:'street'},
      {id:'district-collection-link',x:-225,z:-38,w:6,d:34,kind:'street'},
      {id:'district-motos-entry',x:-301,z:26,w:14,d:6,kind:'street'},
      {id:'acesso-colecao-ot',x:-194,z:-55,w:80,d:9,kind:'street'},
      {id:'aurora-centro-ew',x:300,z:-40,w:120,d:9,kind:'street'},
      {id:'aurora-centro-ns',x:300,z:-40,w:9,d:100,kind:'street'},
      {id:'costa-centro-ew',x:-300,z:110,w:120,d:9,kind:'street'},
      {id:'costa-centro-ns',x:-300,z:110,w:9,d:100,kind:'street'},
      {id:'avenida-central-ns',x:0,z:0,w:18,d:210,kind:'avenue'},
      {id:'avenida-central-ew',x:0,z:0,w:210,d:18,kind:'avenue'},
      {id:'via-floresta-sul',x:-55,z:-55,w:9,d:105,kind:'street'},
      {id:'via-floresta-norte',x:-55,z:28,w:9,d:56,kind:'street'},
      {id:'acesso-construcao-ns',x:-55,z:68,w:9,d:24,kind:'street'},
      {id:'acesso-construcao-ew',x:-35,z:78,w:40,d:7,kind:'street'},
      {id:'via-servicos-leste',x:65,z:-55,w:9,d:105,kind:'street'},
      {id:'via-escola-leste',x:68,z:29,w:9,d:58,kind:'street'},
      {id:'acesso-norte',x:34,z:58,w:68,d:9,kind:'street'},
      {id:'acesso-castelo-fazenda',x:84,z:38,w:32,d:7,kind:'street'},
      {id:'acesso-kart',x:80,z:-65,w:30,d:9,kind:'street'}
    ]),
    roadBridges:Object.freeze([{id:'costa-water-crossing',x:-187,z:25,length:30,deckLength:12,width:12.4,deckHeight:.65},{id:'collection-water-crossing',x:-187,z:-55,length:30,deckLength:12,width:9,deckHeight:.65}]),
    highways:Object.freeze([
      ...CIVIL_WORLD_LINKS.highways,
      {"id":"ottovias-serra-access","name":"Estrada da Cordilheira","width":10,"shoulder":1.2,"closed":false,"points":[{"x":112,"z":124,"y":0},{"x":210,"z":150,"y":0},{"x":240,"z":220,"y":0},{"x":320,"z":240,"y":0},{"x":460,"z":240,"y":0},{"x":610,"z":270,"y":8},{"x":680,"z":340,"y":24}]},
      {"id":"ottovias-serra-loop","name":"Circuito da Cordilheira","width":10,"shoulder":1.2,"closed":true,"points":[{"x":320,"z":240,"y":0},{"x":380,"z":340,"y":26},{"x":430,"z":410,"y":42},{"x":560,"z":430,"y":40},{"x":680,"z":340,"y":24},{"x":680,"z":190,"y":0},{"x":520,"z":180,"y":0}]},
      {"id":"ottovias-snow-pass","name":"Estrada dos Picos Nevados","width":10,"shoulder":1.2,"closed":false,"points":[{"x":24,"z":166,"y":0},{"x":24,"z":220,"y":0},{"x":0,"z":260,"y":10},{"x":50,"z":330,"y":28},{"x":10,"z":410,"y":36},{"x":-110,"z":410,"y":28},{"x":-180,"z":320,"y":20},{"x":-120,"z":240,"y":6},{"x":24,"z":220,"y":0}]},
      {"id":"ottovias-forest-link","name":"Estrada da Mata Grande","width":10,"shoulder":1.2,"closed":false,"points":[{"x":-360,"z":60,"y":0},{"x":-460,"z":60,"y":0},{"x":-550,"z":100,"y":0},{"x":-650,"z":40,"y":0},{"x":-700,"z":-100,"y":0},{"x":-610,"z":-220,"y":0},{"x":-480,"z":-170,"y":0},{"x":-400,"z":-150,"y":0}]},
      {"id":"ottovias-outer-link","name":"Rodovia dos Horizontes","width":10,"shoulder":1.2,"closed":false,"points":[{"x":360,"z":-40,"y":0},{"x":500,"z":-40,"y":0},{"x":620,"z":-160,"y":0},{"x":680,"z":-400,"y":0},{"x":360,"z":-400,"y":0},{"x":-200,"z":-400,"y":0},{"x":-480,"z":-320,"y":0},{"x":-610,"z":-220,"y":0}]},
      {"id":"ottovias-airport-access","name":"Acesso Viário do Aeroporto","width":10,"shoulder":1.2,"closed":false,"points":[{"x":132,"z":-130,"y":0},{"x":171,"z":-150,"y":0},{"x":171,"z":-193,"y":0},{"x":171,"z":-216,"y":0}]},
      {id:'ottovias-costa-orla-city',name:'Avenida da Orla',width:10,shoulder:1.4,closed:true,points:[{x:-300,z:160},{x:-300,z:475},{x:-360,z:475},{x:-360,z:160}]},
      {id:'ottovias-aurora-link',name:'Estrada Nova Aurora',width:10,shoulder:1.2,closed:false,points:[{x:158,z:-10},{x:205,z:-10},{x:240,z:-40}]},
      {id:'ottovias-aurora-city',name:'Avenida Circular de Aurora',width:10,shoulder:1.2,closed:true,points:[{x:240,z:-40},{x:240,z:-90},{x:300,z:-90},{x:360,z:-90},{x:360,z:-40},{x:360,z:10},{x:300,z:10},{x:240,z:10}]},
      {id:'ottovias-aurora-race',name:'Estrada do Autódromo Aurora',width:10,shoulder:1.2,closed:false,points:[{x:300,z:-90},{x:300,z:-208}]},
      {id:'ottovias-costa-link',name:'Estrada Costa Verde',width:10,shoulder:1.2,closed:false,points:[{x:-170,z:25},{x:-210,z:25},{x:-240,z:60}]},
      {id:'ottovias-costa-city',name:'Avenida Circular da Costa',width:10,shoulder:1.2,closed:true,points:[{x:-240,z:60},{x:-240,z:110},{x:-240,z:160},{x:-300,z:160},{x:-360,z:160},{x:-360,z:110},{x:-360,z:60},{x:-300,z:60}]},
      {id:'ottovias-costa-race',name:'Estrada do Autódromo Costa Verde',width:10,shoulder:1.2,closed:false,points:[{x:-360,z:60},{x:-400,z:20},{x:-400,z:-150},{x:-300,z:-150}]},
      Object.freeze({
        id:'ottovias',name:'Rodovia OTTOVIAS',width:12.4,shoulder:1.6,closed:true,
        points:Object.freeze([
          {x:0,z:-108,biome:'city'},{x:20,z:-128,biome:'city'},{x:55,z:-145,biome:'desert'},{x:95,z:-148,biome:'desert'},{x:132,z:-130,biome:'desert'},
          {x:153,z:-98,biome:'desert'},{x:158,z:-55,biome:'field'},{x:158,z:-10,biome:'field'},{x:154,z:38,biome:'field'},{x:142,z:82,biome:'field'},
          {x:112,z:124,biome:'snow'},{x:72,z:150,biome:'snow'},{x:24,z:166,biome:'snow'},{x:-28,z:166,biome:'snow'},{x:-78,z:164,biome:'snow'},
          {x:-126,z:156,biome:'snow'},{x:-156,z:126,biome:'beach'},{x:-168,z:80,biome:'beach'},{x:-170,z:25,biome:'beach'},{x:-168,z:-30,biome:'beach'},
          {x:-150,z:-72,biome:'beach'},{x:-124,z:-108,biome:'country'},{x:-88,z:-132,biome:'country'},{x:-48,z:-145,biome:'country'},{x:-15,z:-130,biome:'city'}
        ]),
        tolls:Object.freeze([
          {id:'ottovias-toll-sul',name:'Praça Sul',routeIndex:2,t:.72,cost:5},
          {id:'ottovias-toll-campo',name:'Praça Campo',routeIndex:7,t:.55,cost:5},
          {id:'ottovias-toll-praia',name:'Praça Praia',routeIndex:18,t:.55,cost:5}
        ])
      }),
      Object.freeze({
        id:'ottovias-urban',name:'OTTOVIAS — Travessia Urbana',width:12.0,shoulder:.9,closed:false,usesExistingRoad:true,
        points:Object.freeze([
          {x:0,z:-108,biome:'city'},{x:0,z:-65,biome:'city'},{x:0,z:-18,biome:'city'},{x:0,z:18,biome:'city'},{x:0,z:58,biome:'city'},{x:0,z:105,biome:'city'}
        ])
      }),
      Object.freeze({
        id:'ottovias-north-connector',name:'OTTOVIAS — Ligação Norte',width:12.4,shoulder:1.6,closed:false,
        points:Object.freeze([
          {x:0,z:105,biome:'city'},{x:0,z:132,biome:'snow'},{x:24,z:166,biome:'snow'}
        ])
      })
    ]),
    nodes:Object.freeze({
      ...CIVIL_WORLD_LINKS.nodes,
      "EXT_serra-access_1":{"x":210,"z":150},"EXT_serra-access_2":{"x":240,"z":220},"EXT_SERRA_GATE":{"x":320,"z":240},"EXT_serra-access_4":{"x":460,"z":240},"EXT_serra-access_5":{"x":610,"z":270},"EXT_SERRA_NE":{"x":680,"z":340},"EXT_serra-loop_1":{"x":380,"z":340},"EXT_serra-loop_2":{"x":430,"z":410},"EXT_serra-loop_3":{"x":560,"z":430},"EXT_serra-loop_5":{"x":680,"z":190},"EXT_serra-loop_6":{"x":520,"z":180},"EXT_SNOW_GATE":{"x":24,"z":220},"EXT_snow-pass_2":{"x":0,"z":260},"EXT_snow-pass_3":{"x":50,"z":330},"EXT_snow-pass_4":{"x":10,"z":410},"EXT_snow-pass_5":{"x":-110,"z":410},"EXT_snow-pass_6":{"x":-180,"z":320},"EXT_snow-pass_7":{"x":-120,"z":240},"EXT_forest-link_1":{"x":-460,"z":60},"EXT_forest-link_2":{"x":-550,"z":100},"EXT_forest-link_3":{"x":-650,"z":40},"EXT_forest-link_4":{"x":-700,"z":-100},"EXT_FOREST_OUT":{"x":-610,"z":-220},"EXT_forest-link_6":{"x":-480,"z":-170},"EXT_outer-link_1":{"x":500,"z":-40},"EXT_outer-link_2":{"x":620,"z":-160},"EXT_outer-link_3":{"x":680,"z":-400},"EXT_outer-link_4":{"x":360,"z":-400},"EXT_outer-link_5":{"x":-200,"z":-400},"EXT_outer-link_6":{"x":-480,"z":-320},"EXT_airport-access_1":{"x":171,"z":-150},"EXT_airport-access_2":{"x":171,"z":-193},"EXT_airport-access_3":{"x":171,"z":-216},
      CS0:{x:0,z:-72},CSE:{x:65,z:-72},COAST_E:{x:-300,z:475},COAST_W:{x:-360,z:475},COAST_E_END:{x:-220,z:475},COAST_W_END:{x:-400,z:475},COAST_GATE:{x:-300,z:484},
      DC_GATE:{x:-234,z:-55},DC_E:{x:-225,z:-55},DC_N:{x:-225,z:-21},DC_SPINE:{x:-308,z:-21},DC_CARS:{x:-308,z:11},DC_BIKES:{x:-308,z:26},DC_BIKE_DOOR:{x:-296,z:26},DC_TRUCKS:{x:-308,z:-54},DC_ROAD:{x:-168,z:-55},
      A_LINK:{x:205,z:-10},A_W:{x:240,z:-40},A_C:{x:300,z:-40},A_E:{x:360,z:-40},A_NW:{x:240,z:-90},A_N:{x:300,z:-90},A_NE:{x:360,z:-90},A_SW:{x:240,z:10},A_S:{x:300,z:10},A_SE:{x:360,z:10},A_RACE:{x:300,z:-212},
      CV_LINK:{x:-210,z:25},CV_NE:{x:-240,z:60},CV_E:{x:-240,z:110},CV_SE:{x:-240,z:160},CV_S:{x:-300,z:160},CV_SW:{x:-360,z:160},CV_W:{x:-360,z:110},CV_NW:{x:-360,z:60},CV_N:{x:-300,z:60},CV_C:{x:-300,z:110},CV_RW:{x:-400,z:20},CV_RB:{x:-400,z:-150},CV_RA:{x:-300,z:-150},CV_RACE:{x:-300,z:-156},
      VS:{x:0,z:-105},V65S:{x:0,z:-65},V18S:{x:0,z:-18},C:{x:0,z:0},V18N:{x:0,z:18},V58N:{x:0,z:58},VN:{x:0,z:105},
      HW:{x:-105,z:0},H55W:{x:-55,z:0},H25W:{x:-25,z:0},H25E:{x:25,z:0},H65E:{x:65,z:0},H88E:{x:88,z:0},HE:{x:105,z:0},
      W105S:{x:-55,z:-105},W55S:{x:-55,z:-55},W28N:{x:-55,z:28},W56N:{x:-55,z:56},W80N:{x:-55,z:80},BUILD78:{x:-15,z:78},
      E105S:{x:65,z:-105},E65S:{x:65,z:-65},E18S:{x:65,z:-18},E0:{x:65,z:0},E58N:{x:68,z:58},
      N34:{x:34,z:58},N68:{x:68,z:58},C38:{x:68,z:38},CASTLE38:{x:100,z:38},
      K65:{x:65,z:-65},K80:{x:80,z:-65},K94:{x:94,z:-65},
      OV0:{x:0,z:-108},
      OV1:{x:20,z:-128},
      OV2:{x:55,z:-145},
      OV3:{x:95,z:-148},
      OV4:{x:132,z:-130},
      OV5:{x:153,z:-98},
      OV6:{x:158,z:-55},
      OV7:{x:158,z:-10},
      OV8:{x:154,z:38},
      OV9:{x:142,z:82},
      OV10:{x:112,z:124},
      OV11:{x:72,z:150},
      OV12:{x:24,z:166},
      OV13:{x:-28,z:166},
      OV14:{x:-78,z:164},
      OV15:{x:-126,z:156},
      OV16:{x:-156,z:126},
      OV17:{x:-168,z:80},
      OV18:{x:-170,z:25},
      OV19:{x:-168,z:-30},
      OV20:{x:-150,z:-72},
      OV21:{x:-124,z:-108},
      OV22:{x:-88,z:-132},
      OV23:{x:-48,z:-145},
      OV24:{x:-15,z:-130},OVN1:{x:0,z:132},
      V_GYM_TURN:{x:46,z:0},VB_TURN:{x:65,z:-48},VB_GATE:{x:46,z:-48},VD_GATE:{x:-38,z:-50},VD_TURN:{x:-55,z:-50},VP_GATE:{x:48,z:10},
      CQ_TURN:{x:-145,z:-38},CQ_GATE:{x:-120,z:-38},CA_TURN:{x:20,z:-153},CA_GATE:{x:27,z:-159},CN_GATE:{x:85,z:109}
    }),
    edges:Object.freeze([
      ...CIVIL_WORLD_LINKS.edges,
      ["OV10","EXT_serra-access_1"],["EXT_serra-access_1","EXT_serra-access_2"],["EXT_serra-access_2","EXT_SERRA_GATE"],["EXT_SERRA_GATE","EXT_serra-access_4"],["EXT_serra-access_4","EXT_serra-access_5"],["EXT_serra-access_5","EXT_SERRA_NE"],["EXT_SERRA_GATE","EXT_serra-loop_1"],["EXT_serra-loop_1","EXT_serra-loop_2"],["EXT_serra-loop_2","EXT_serra-loop_3"],["EXT_serra-loop_3","EXT_SERRA_NE"],["EXT_SERRA_NE","EXT_serra-loop_5"],["EXT_serra-loop_5","EXT_serra-loop_6"],["EXT_serra-loop_6","EXT_SERRA_GATE"],["OV12","EXT_SNOW_GATE"],["EXT_SNOW_GATE","EXT_snow-pass_2"],["EXT_snow-pass_2","EXT_snow-pass_3"],["EXT_snow-pass_3","EXT_snow-pass_4"],["EXT_snow-pass_4","EXT_snow-pass_5"],["EXT_snow-pass_5","EXT_snow-pass_6"],["EXT_snow-pass_6","EXT_snow-pass_7"],["EXT_snow-pass_7","EXT_SNOW_GATE"],["CV_NW","EXT_forest-link_1"],["EXT_forest-link_1","EXT_forest-link_2"],["EXT_forest-link_2","EXT_forest-link_3"],["EXT_forest-link_3","EXT_forest-link_4"],["EXT_forest-link_4","EXT_FOREST_OUT"],["EXT_FOREST_OUT","EXT_forest-link_6"],["EXT_forest-link_6","CV_RB"],["A_E","EXT_outer-link_1"],["EXT_outer-link_1","EXT_outer-link_2"],["EXT_outer-link_2","EXT_outer-link_3"],["EXT_outer-link_3","EXT_outer-link_4"],["EXT_outer-link_4","EXT_outer-link_5"],["EXT_outer-link_5","EXT_outer-link_6"],["EXT_outer-link_6","EXT_FOREST_OUT"],["OV4","EXT_airport-access_1"],["EXT_airport-access_1","EXT_airport-access_2"],["EXT_airport-access_2","EXT_airport-access_3"],
      ['OV19','DC_ROAD'],['OV20','DC_ROAD'],['DC_ROAD','DC_GATE'],['DC_GATE','DC_E'],['DC_E','DC_N'],['DC_N','DC_SPINE'],['DC_SPINE','DC_TRUCKS'],['DC_SPINE','DC_CARS'],['DC_CARS','DC_BIKES'],['DC_BIKES','DC_BIKE_DOOR'],
      ['OV7','A_LINK'],['A_LINK','A_W'],['A_W','A_C'],['A_C','A_E'],['A_W','A_NW'],['A_NW','A_N'],['A_N','A_NE'],['A_NE','A_E'],['A_E','A_SE'],['A_SE','A_S'],['A_S','A_SW'],['A_SW','A_W'],['A_N','A_C'],['A_C','A_S'],['A_N','A_RACE'],
      ['OV18','CV_LINK'],['CV_LINK','CV_NE'],['CV_NE','CV_E'],['CV_E','CV_SE'],['CV_SE','CV_S'],['CV_S','CV_SW'],['CV_SW','CV_W'],['CV_W','CV_NW'],['CV_NW','CV_N'],['CV_N','CV_NE'],['CV_N','CV_C'],['CV_C','CV_S'],['CV_W','CV_C'],['CV_C','CV_E'],['CV_S','COAST_E'],['COAST_E','COAST_W'],['COAST_W','CV_SW'],['COAST_E','COAST_E_END'],['COAST_W','COAST_W_END'],['COAST_E','COAST_GATE'],['CV_NW','CV_RW'],['CV_RW','CV_RB'],['CV_RB','CV_RA'],['CV_RA','CV_RACE'],
      ['H25E','V_GYM_TURN'],['E65S','VB_TURN'],['VB_TURN','VB_GATE'],['V_GYM_TURN','VP_GATE'],['W55S','VD_TURN'],['VD_TURN','VD_GATE'],
      ['OV20','CQ_TURN'],['CQ_TURN','CQ_GATE'],['OV1','CA_TURN'],['CA_TURN','CA_GATE'],['OV10','CN_GATE'],
      ['VS','V65S'],['V65S','V18S'],['V18S','C'],['C','V18N'],['V18N','V58N'],['V58N','VN'],
      ['HW','H55W'],['H55W','H25W'],['H25W','C'],['C','H25E'],['H25E','H65E'],['H65E','H88E'],['H88E','HE'],
      ['W105S','W55S'],['W55S','H55W'],['H55W','W28N'],['W28N','W56N'],['W56N','W80N'],['W80N','BUILD78'],
      ['E105S','E65S'],['E65S','E18S'],['E18S','E0'],['E0','H65E'],['E0','C38'],['C38','E58N'],
      ['V58N','N34'],['N34','N68'],['N68','E58N'],['C38','CASTLE38'],
      ['V65S','CS0'],['CS0','CSE'],['CSE','E65S'],['E65S','K65'],['K65','K80'],['K80','K94'],
      ['VS','OV0'],['VN','OVN1'],['OVN1','OV12'],['OV0','OV1'],['OV1','OV2'],['OV2','OV3'],['OV3','OV4'],['OV4','OV5'],['OV5','OV6'],['OV6','OV7'],['OV7','OV8'],['OV8','OV9'],['OV9','OV10'],['OV10','OV11'],['OV11','OV12'],['OV12','OV13'],['OV13','OV14'],['OV14','OV15'],['OV15','OV16'],['OV16','OV17'],['OV17','OV18'],['OV18','OV19'],['OV19','OV20'],['OV20','OV21'],['OV21','OV22'],['OV22','OV23'],['OV23','OV24'],['OV24','OV0']
    ]),
    points:Object.freeze({
      familyHome:{x:-38,z:-24},
      spawn:{x:-18,z:39},home:{x:-18,z:34},homeGarage:{x:-31,z:46},fleetCollection:{x:-266,z:-55},blue:{x:-30,z:17},pink:{x:24,z:17},shop:{x:-22,z:-18},workshop:{x:22,z:-18},
      school:{x:-68,z:-18},schoolEast:{x:82,z:24},police:{x:78,z:-18},policeWest:{x:-68,z:22},fireStation:{x:96,z:-18},
      well:{x:38,z:10},foundry:{x:43,z:-35},mine:{x:-92,z:-92},cabin:{x:-88,z:-42},
      camp:{x:-78,z:-62},hunt:{x:-101,z:-78},lake:{x:-88,z:54},lakeNorth:{x:-104,z:69},pier:{x:-67,z:54},metroLake:{x:-45,z:56},
      farm:{x:101,z:22},farmEntrance:{x:91,z:34},garage:{x:84,z:30},jobBoard:{x:86,z:34},
      sports:{x:42,z:88},sportsEntrance:{x:42,z:66},footballEntrance:{x:50,z:69},volley:{x:82,z:95},volleyEntrance:{x:82,z:84},footvolley:{x:100,z:95},footvolleyEntrance:{x:100,z:84},
      kart:{x:300,z:-270},kartEntrance:{x:300,z:-212},kartBoxes:{x:300,z:-270},
      castle:{x:100,z:55},castleEntrance:{x:100,z:40},mountain:{x:-88,z:97},mountainEntrance:{x:-62,z:84},
      lava:{x:35,z:-104},giantGate:{x:18,z:-54},miniTunnel:{x:88,z:-91},crouchTunnel:{x:108,z:-91},
      learningMath:{x:22,z:-32},learningPortuguese:{x:22,z:-40},learningEnglish:{x:22,z:-48},learningEntrance:{x:14,z:-40},
      playground:{x:-28,z:-40},fountain:{x:-14,z:-8},portal:{x:82,z:53},
      construction:{x:-33,z:96},constructionEntrance:{x:-33,z:78},
      platformCircuit:{x:94,z:-52},platformEntrance:{x:76,z:-35},
      repairParking:{x:32,z:-18},
      ottoviasEntry:{x:0,z:-108},ottoviasOperations:{x:50,z:-120},ottoviasOperationsAccess:{x:50,z:-109.2},ottoviasMichelle:{x:50,z:-112},
      ottoviasTollSouth:{x:84,z:-147},ottoviasTollField:{x:156,z:16},ottoviasTollBeach:{x:-169,z:-5},
      ottoviasDesert:{x:111,z:-137},ottoviasField:{x:151,z:61},ottoviasSnow:{x:24,z:166},ottoviasBeach:{x:-168,z:80},ottoviasCityCenter:{x:0,z:18},ottoviasCityNorth:{x:0,z:105},
      ottoviasFootbridge:{x:0,z:43}
    }),
    zones:Object.freeze({
      fleetCollection:{id:'fleetCollection',name:'Centro da Coleção OT',x:-266,z:-55,w:68,d:74},
      urban:{id:'urban',name:'Centro urbano',x:0,z:0,w:118,d:104},
      residential:{id:'residential',name:'Bairros residenciais',x:-2,z:27,w:92,d:38},
      services:{id:'services',name:'Escolas e serviços',x:78,z:-18,w:70,d:106},
      stadium:{id:'stadium',name:'Estádio e atletismo',x:42,z:88,w:62,d:44},
      courts:{id:'courts',name:'Quadras de vôlei e futevôlei',x:91,z:95,w:34,d:24},
      kart:{id:'kart',name:'Autódromo Nova Aurora',x:300,z:-270,w:114,d:100},
      circuitCosta:{id:'circuitCosta',name:'Autódromo Costa Verde',x:-300,z:-210,w:108,d:96},
      aurora:{id:'aurora',name:'Nova Aurora',x:300,z:-40,w:132,d:112},
      costa:{id:'costa',name:'Costa Verde',x:-300,z:110,w:132,d:112},
      rural:{id:'rural',name:'Fazenda',x:101,z:22,w:26,d:22},
      lake:{id:'lake',name:'Represa principal',x:-88,z:54,w:50,d:22},
      lakeNorth:{id:'lakeNorth',name:'Enseada norte da represa',x:-104,z:69,w:24,d:14},
      forest:{id:'forest',name:'Floresta e acampamento',x:-86,z:-58,w:60,d:58},
      mine:{id:'mine',name:'Mina',x:-92,z:-92,w:28,d:24},
      castle:{id:'castle',name:'Castelo e aventura',x:100,z:55,w:32,d:28},
      mountain:{id:'mountain',name:'Montanhas e trilhas',x:-88,z:97,w:50,d:36},
      construction:{id:'construction',name:'Construção dos jogadores',x:-33,z:96,w:36,d:32},
      education:{id:'education',name:'Academia Kids',x:22,z:-40,w:18,d:24},
      platform:{id:'platform',name:'Circuito das plataformas',x:94,z:-52,w:38,d:42},
      ottoviasDesert:{id:'ottoviasDesert',name:'OTTOVIAS — trecho Deserto',x:112,z:-135,w:108,d:62},
      ottoviasField:{id:'ottoviasField',name:'OTTOVIAS — trecho Campo',x:151,z:40,w:54,d:142},
      ottoviasSnow:{id:'ottoviasSnow',name:'OTTOVIAS — trecho Neve',x:8,z:164,w:270,d:44},
      ottoviasBeach:{id:'ottoviasBeach',name:'OTTOVIAS — trecho Praia',x:-168,z:32,w:40,d:210}
    }),
    paths:Object.freeze([
      {id:'costa-autodromo-acesso',x1:-300,z1:-150,x2:-300,z2:-156,w:3.2,destination:'circuit-costa'},
      {id:'ginasios-acesso',x1:25,z1:0,x2:46,z2:0,w:2.6,destination:'venue-boxing'},
      {id:'academia-luta-acesso',x1:65,z1:-48,x2:46,z2:-48,w:2.6,destination:'venue-boxing'},
      {id:'academia-danca-acesso',x1:-55,z1:-50,x2:-38,z2:-50,w:2.6,destination:'venue-dance'},
      {id:'ginasio-pingpong-acesso',x1:46,z1:0,x2:48,z2:10,w:2.6,destination:'venue-pingpong'},
      {id:'quartel-acesso-a',x1:-150,z1:-72,x2:-145,z2:-38,w:3.2,destination:'campaign-hq'},
      {id:'quartel-acesso-b',x1:-145,z1:-38,x2:-120,z2:-38,w:3.2,destination:'campaign-hq'},
      {id:'base-aerea-acesso-a',x1:20,z1:-128,x2:20,z2:-153,w:4.2,destination:'campaign-airbase'},
      {id:'base-aerea-acesso-b',x1:20,z1:-153,x2:27,z2:-159,w:4.2,destination:'campaign-airbase'},
      {id:'setor-norte-acesso',x1:112,z1:124,x2:85,z2:109,w:3.2,destination:'campaign-north'},
      {id:'casa-inicial',x1:-18,z1:37.2,x2:-18,z2:45,w:2.2,destination:'home'},
      {id:'garagem-residencial',x1:-26,z1:46,x2:-10.8,z2:46,w:4.2,destination:'home-garage'},
      {id:'complexo-esportivo',x1:42,z1:62,x2:42,z2:67,w:3.2,destination:'stadium'},
      {id:'entrada-futebol',x1:42,z1:67,x2:50,z2:69,w:2.6,destination:'football-field'},
      {id:'quadras-leste-a',x1:68,z1:62,x2:76,z2:64,w:2.2},
      {id:'quadras-leste-b',x1:76,z1:64,x2:76,z2:82,w:2.2},
      {id:'quadras-leste-conector',x1:76,z1:82,x2:92,z2:82,w:2.2},
      {id:'quadra-volei',x1:76,z1:82,x2:82,z2:84,w:2.2,destination:'volley'},
      {id:'quadra-futevolei',x1:92,z1:82,x2:100,z2:84,w:2.2,destination:'footvolley'},
      {id:'fazenda',x1:91,z1:34,x2:96,z2:30,w:2.2,destination:'farm'},
      {id:'castelo',x1:100,z1:41,x2:100,z2:43,w:5.2,destination:'castle'},
      {id:'kart',x1:300,z1:-208,x2:300,z2:-212,w:3.2,destination:'kart-circuit'},
      {id:'montanha',x1:-55,z1:80,x2:-63,z2:84,w:2.2,destination:'mountain'},
      {id:'construcao',x1:-35,z1:81,x2:-33,z2:82,w:3.0,destination:'construction-zone'}
    ]),
    signs:Object.freeze([
      {id:'guide-vila',kind:'guide',text:'Vila do Sol',x:12,z:12,rotationY:0},
      {id:'guide-market',kind:'guide',text:'Mercadinho',x:-22,z:-12,rotationY:0},
      {id:'guide-workshop',kind:'guide',text:'Oficina',x:13.4,z:-11.2,rotationY:0},
      {id:'guide-forest',kind:'guide',text:'Floresta',x:-62,z:-25,rotationY:1.5708},
      {id:'guide-farm',kind:'guide',text:'Fazenda • Garagem',x:82,z:44,rotationY:0},
      {id:'guide-castle',kind:'guide',text:'Castelo',x:106,z:34,rotationY:0},
      {id:'guide-lake',kind:'guide',text:'Represa • Píer',x:-62,z:40,rotationY:1.5708},
      {id:'guide-sports',kind:'guide',text:'Complexo Esportivo',x:42,z:64.6,rotationY:0},
      {id:'guide-kart',kind:'guide',text:'Autódromo Nova Aurora',x:300,z:-216.6,rotationY:0},
      {id:'ov-urban-south',kind:'highway',highwayId:'ottovias-urban',segmentIndex:0,t:.52,side:1,offset:3.2,title:'OTTOVIAS',subtitle:'CENTRO • SAÍDA NORTE'},
      {id:'ov-urban-center',kind:'highway',highwayId:'ottovias-urban',segmentIndex:3,t:.48,side:1,offset:3.2,title:'OTTOVIAS',subtitle:'NEVE • PRAIA • PEDÁGIOS'},
      {id:'ov-north',kind:'highway',highwayId:'ottovias-north-connector',segmentIndex:0,t:.56,side:-1,offset:2.5,title:'OTTOVIAS',subtitle:'LIGAÇÃO NORTE • NEVE'},
      {id:'ov-desert',kind:'highway',highwayId:'ottovias',segmentIndex:2,t:.42,side:-1,offset:2.5,title:'DESERTO',subtitle:'PEDÁGIO PRAÇA SUL'},
      {id:'ov-field',kind:'highway',highwayId:'ottovias',segmentIndex:8,t:.55,side:1,offset:2.5,title:'CAMPO',subtitle:'ACESSOS RURAIS'},
      {id:'ov-snow',kind:'highway',highwayId:'ottovias',segmentIndex:12,t:.48,side:1,offset:2.5,title:'NEVE',subtitle:'REDUZA A VELOCIDADE'},
      {id:'ov-beach',kind:'highway',highwayId:'ottovias',segmentIndex:17,t:.52,side:-1,offset:2.5,title:'PRAIA',subtitle:'TRECHO COSTEIRO'}
    ]),
    structures:Object.freeze([
      {id:'costa-block-3',kind:'city',x:-268,z:135,w:23,d:22,margin:.5},
      {id:'costa-block-2',kind:'city',x:-332,z:135,w:23,d:22,margin:.5},
      {id:'costa-block-1',kind:'city',x:-268,z:85,w:23,d:22,margin:.5},
      {id:'costa-block-0',kind:'city',x:-332,z:85,w:23,d:22,margin:.5},
      {id:'aurora-block-3',kind:'city',x:332,z:-15,w:23,d:22,margin:.5},
      {id:'aurora-block-2',kind:'city',x:268,z:-15,w:23,d:22,margin:.5},
      {id:'aurora-block-1',kind:'city',x:332,z:-65,w:23,d:22,margin:.5},
      {id:'aurora-block-0',kind:'city',x:268,z:-65,w:23,d:22,margin:.5},
      {id:'circuit-costa',kind:'kart',x:-300,z:-210,w:108,d:96,margin:.4},
      {id:'venue-boxing',kind:'activity',x:46,z:-56,w:14,d:12,margin:.4},
      {id:'workshop-yard',kind:'workshop-yard',x:43.9,z:-18,w:23,d:18,margin:0,allowedRoads:['avenida-central-ew']},
      {id:'thia-family-home',kind:'family-home',point:'familyHome',w:12,d:16,margin:.4},
      {id:'venue-dance',kind:'activity',x:-38,z:-58,w:12,d:12,margin:.4},
      {id:'venue-pingpong',kind:'activity',x:48,z:18,w:14,d:12,margin:.4},
      {id:'campaign-hq',kind:'campaign',x:-120,z:-54,w:30,d:24,margin:.4},
      {id:'campaign-airbase',kind:'campaign',x:27,z:-172,w:83,d:30,margin:.2},
      {id:'campaign-north',kind:'campaign',x:85,z:115,w:16,d:10,margin:.2},
      {id:'home',kind:'house',point:'home',w:9,d:7,margin:1.2,access:'spawn'},
      {id:'dealer-cars',kind:'dealer',x:-345,z:11,w:60,d:36,margin:.3},
      {id:'dealer-bikes',kind:'dealer',x:-270,z:26,w:48,d:34,margin:.3,allowedRoads:['district-motos-entry']},
      {id:'dealer-trucks',kind:'dealer',x:-350,z:-54,w:70,d:64,margin:.3},
      {id:'fleet-collection',kind:'garage',point:'fleetCollection',w:68,d:74,margin:.5,allowedRoads:['acesso-colecao-ot','district-alameda']},
      {id:'home-garage',kind:'garage',point:'homeGarage',w:14.4,d:9.2,margin:.8,access:'garagem-residencial'},
      {id:'blue',kind:'house',point:'blue',w:9,d:7,margin:1.2},
      {id:'pink',kind:'house',point:'pink',w:9,d:7,margin:1.2},
      {id:'shop',kind:'house',point:'shop',w:9,d:7,margin:1.2},
      {id:'workshop',kind:'house',point:'workshop',w:15,d:12,margin:.8},
      {id:'school',kind:'house',point:'school',w:9,d:7,margin:1.4},
      {id:'school-east',kind:'house',point:'schoolEast',w:9,d:7,margin:1.4},
      {id:'police',kind:'house',point:'police',w:9,d:7,margin:1.4},
      {id:'police-west',kind:'house',point:'policeWest',w:9,d:7,margin:1.4},
      {id:'fire-station',kind:'house',point:'fireStation',w:9,d:7,margin:1.4},
      {id:'cabin',kind:'house',point:'cabin',w:9,d:7,margin:1.2},
      {id:'stadium',kind:'sport',point:'sports',w:62,d:43,margin:.5},
      {id:'football-field',kind:'sport-inner',point:'sports',w:42,d:18,margin:0,inside:'stadium'},
      {id:'volley',kind:'sport',point:'volley',w:14,d:22,margin:.6},
      {id:'footvolley',kind:'sport',point:'footvolley',w:14,d:22,margin:.6},
      {id:'kart-circuit',kind:'kart',point:'kart',w:114,d:100,margin:.35},
      {id:'kart-boxes',kind:'kart-inner',point:'kartBoxes',w:14,d:32,margin:0,inside:'kart-circuit'},
      {id:'farm',kind:'farm',point:'farm',w:22,d:18,margin:.8},
      {id:'castle',kind:'castle',point:'castle',w:31,d:27.6,margin:.4,allowedRoads:['acesso-castelo-fazenda']},
      {id:'mountain',kind:'terrain',point:'mountain',w:50,d:36,margin:.5},
      {id:'mine',kind:'resource',point:'mine',w:18,d:14,margin:1.0},
      {id:'learning',kind:'education',x:22,z:-40,w:8,d:22,margin:1.0},
      {id:'playground',kind:'playground',point:'playground',w:9,d:7,margin:1.0},
      {id:'giant-gate',kind:'challenge',point:'giantGate',w:10,d:2,margin:1.0},
      {id:'mini-tunnel',kind:'challenge',point:'miniTunnel',w:8,d:6,margin:1.0},
      {id:'crouch-tunnel',kind:'challenge',point:'crouchTunnel',w:8,d:5,margin:1.0},
      {id:'construction-zone',kind:'construction',point:'construction',w:36,d:32,margin:0,allowRoadOverlap:false},
      {id:'ottovias-operations',kind:'transport',point:'ottoviasOperations',w:15,d:9,margin:1.0},
      {id:'metro-lake',kind:'transport',point:'metroLake',w:4.6,d:4.6,margin:.4,allowedRoads:['via-floresta-norte']},
      {id:'ottovias-footbridge',kind:'transport',x:0,z:46,w:28,d:10,margin:.2,allowedRoads:['avenida-central-ns'],allowedHighways:['ottovias-urban']}
    ])
  });
  const OTTHI_PERSONAL_HOME_LOTS=Object.freeze([
    Object.freeze({x:-41,z:32}),Object.freeze({x:-30,z:32}),Object.freeze({x:-18,z:32}),Object.freeze({x:18,z:32}),Object.freeze({x:33,z:32}),
    Object.freeze({x:45,z:32}),Object.freeze({x:-41,z:44}),Object.freeze({x:-22,z:44}),Object.freeze({x:22,z:44}),Object.freeze({x:45,z:44})
  ]);
  function otthiHomeIdentity(){const cloudUid=typeof window!=='undefined'?window.OTTHOS_RTDB?.uid:'';const localState=typeof state!=='undefined'?state:null;return String(cloudUid||localState?.profile?.playerId||localState?.profile?.name||'local-home');}
  function otthiHomeLotIndex(){let hash=2166136261;for(const char of otthiHomeIdentity()){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return(hash>>>0)%OTTHI_PERSONAL_HOME_LOTS.length;}
  function otthiPersonalHomeLot(){const base=OTTHI_PERSONAL_HOME_LOTS[otthiHomeLotIndex()]||OTTHI_PERSONAL_HOME_LOTS[0],north=base.z<38;return{index:otthiHomeLotIndex(),home:{x:base.x,z:base.z},spawn:{x:base.x,z:base.z+5.2},garage:{x:Math.abs(base.x)<20?Math.sign(base.x)*23:Math.abs(base.x)===22?Math.sign(base.x)*25:base.x,z:base.z+(north?13:-13)}};}
  function v704PersonalHomeLotAt(x,z,margin=0){return OTTHI_PERSONAL_HOME_LOTS.some(lot=>Math.abs(Number(x)-lot.x)<=5.2+margin&&Math.abs(Number(z)-lot.z)<=4.3+margin);}
  function worldLayoutPoint(id,fallback={x:0,z:0}){const personal=otthiPersonalHomeLot();if(id==='home')return{...personal.home};if(id==='spawn')return{...personal.spawn};if(id==='homeGarage')return{...personal.garage};const p=WORLD_LAYOUT_V704.points[id];return p?{x:Number(p.x),z:Number(p.z)}:{x:Number(fallback.x||0),z:Number(fallback.z||0)};}
  function worldLayoutRect(id){const zone=WORLD_LAYOUT_V704.zones[id];return zone?{...zone}:null;}
  function worldLayoutStructure(id){const item=WORLD_LAYOUT_V704.structures.find(entry=>entry.id===id);if(!item)return null;const p=item.point?worldLayoutPoint(item.point):item;return{...item,x:Number(item.x??p.x),z:Number(item.z??p.z)};}
  function v704RectOverlap(a,b,margin=0){return Math.abs(Number(a.x)-Number(b.x))<(Number(a.w)+Number(b.w))/2+margin&&Math.abs(Number(a.z)-Number(b.z))<(Number(a.d)+Number(b.d))/2+margin;}
  function v704PointInRect(point,rect,margin=0){return Math.abs(Number(point.x)-Number(rect.x))<=Number(rect.w)/2+margin&&Math.abs(Number(point.z)-Number(rect.z))<=Number(rect.d)/2+margin;}
  function v704RoadFootprint(road,includeSidewalk=true){const side=includeSidewalk?2.7:0;return{...road,w:Number(road.w)+(Number(road.w)>=Number(road.d)?0:side),d:Number(road.d)+(Number(road.w)>=Number(road.d)?side:0)};}
  function v704WorldBounds(){return WORLD_LAYOUT_V704.bounds;}
  function v704WorldSize(){const b=v704WorldBounds();return{w:b.maxX-b.minX,d:b.maxZ-b.minZ};}
  function v704ClampWorldPoint(x,z,margin=1){const b=v704WorldBounds();return{x:Math.max(b.minX+margin,Math.min(b.maxX-margin,Number(x)||0)),z:Math.max(b.minZ+margin,Math.min(b.maxZ-margin,Number(z)||0))};}
  function worldRoadBridgeHeightAt(x,z){for(const b of WORLD_LAYOUT_V704.roadBridges||[]){const d=Math.abs(x-b.x);if(d<=b.length/2&&Math.abs(z-b.z)<=b.width/2)return b.deckHeight*Math.min(1,(b.length/2-d)/((b.length-b.deckLength)/2));}return null;}
  function v704DistanceToSegment(point,a,b){const dx=b.x-a.x,dz=b.z-a.z,len2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.z-a.z)*dz)/len2)),x=a.x+dx*t,z=a.z+dz*t;return{distance:Math.hypot(point.x-x,point.z-z),x,z,t};}
  function v704HighwayById(id){return (WORLD_LAYOUT_V704.highways||[]).find(highway=>highway.id===id)||null;}
  function v704HighwaySignPoint(spec){const highway=v704HighwayById(spec?.highwayId),points=highway?.points||[],index=Number(spec?.segmentIndex);if(!highway||!Number.isInteger(index)||index<0||index>=points.length-(highway.closed?0:1))return null;const a=points[index],b=points[(index+1)%points.length],t=Math.max(0,Math.min(1,Number(spec.t??.5))),dx=b.x-a.x,dz=b.z-a.z,heading=Math.atan2(dx,dz),rx=Math.cos(heading),rz=-Math.sin(heading),side=Number(spec.side||1)>=0?1:-1;
    /* O afastamento considera a meia largura física da placa, não apenas o poste. */
    const signHalfWidth=2.9,offset=Number(highway.width||10)/2+Number(highway.shoulder||0)+Number(spec.offset||2.2)+signHalfWidth;return{x:a.x+dx*t+rx*offset*side,z:a.z+dz*t+rz*offset*side,heading,highwayId:highway.id};}
  function v704HighwaySegments(){
    if(typeof cachedWorldHighwaySegments==='function')return cachedWorldHighwaySegments();
    // The layout is also consumed on its own by audits and map tools.
    const out=[];for(const highway of WORLD_LAYOUT_V704.highways||[]){const points=highway.points||[];for(let i=0;i<points.length-(highway.closed?0:1);i++)out.push({id:`${highway.id}-${i}`,highwayId:highway.id,index:i,a:points[i],b:points[(i+1)%points.length],width:Number(highway.width||10),shoulder:Number(highway.shoulder||0)});}return out;
  }
  function v704HighwayAt(x,z,margin=0,includeShoulder=true){
    const px=Number(x),pz=Number(z);if(!Number.isFinite(px)||!Number.isFinite(pz))return false;
    for(const seg of typeof nearbyWorldHighwaySegments==='function'?nearbyWorldHighwaySegments(px,pz,margin):v704HighwaySegments()){
      const limit=seg.width/2+(includeShoulder?seg.shoulder:0)+margin;if(limit<0)continue;
      const dx=seg.b.x-seg.a.x,dz=seg.b.z-seg.a.z,len2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((px-seg.a.x)*dx+(pz-seg.a.z)*dz)/len2)),ex=px-(seg.a.x+dx*t),ez=pz-(seg.a.z+dz*t);
      if(ex*ex+ez*ez<=limit*limit)return true;
    }
    return false;
  }
  function v704HighwayIntersectsRect(highwayId,rect,margin=0){for(const seg of v704HighwaySegments().filter(x=>x.highwayId===highwayId)){const width=seg.width/2+seg.shoulder+margin,len=Math.hypot(seg.b.x-seg.a.x,seg.b.z-seg.a.z),steps=Math.max(2,Math.ceil(len/1.25));for(let i=0;i<=steps;i++){const t=i/steps,p={x:seg.a.x+(seg.b.x-seg.a.x)*t,z:seg.a.z+(seg.b.z-seg.a.z)*t};if(v704PointInRect(p,rect,width))return true;}}return false;}
  function v704RoadAt(x,z,margin=0,includeSidewalk=false){
    const px=Number(x),pz=Number(z),side=includeSidewalk?2.7:0;
    // Same inclusive footprints, without allocating a point and spreading an
    // entire road object for every candidate at every traffic physics step.
    for(const road of WORLD_LAYOUT_V704.roads){const w=Number(road.w),d=Number(road.d);if(Math.abs(px-Number(road.x))<=(w+(w>=d?0:side))/2+margin&&Math.abs(pz-Number(road.z))<=(d+(w>=d?side:0))/2+margin)return true;}
    return v704HighwayAt(x,z,margin,includeSidewalk);
  }
  function v704SafeSignPoint(x,z,rotationY=0){
    const base={x:Number(x),z:Number(z)},half=1.08,alongX=Math.cos(rotationY)*half,alongZ=-Math.sin(rotationY)*half,normalX=Math.sin(rotationY),normalZ=Math.cos(rotationY);
    const clear=point=>![{x:point.x,z:point.z},{x:point.x+alongX,z:point.z+alongZ},{x:point.x-alongX,z:point.z-alongZ}].some(sample=>v704RoadAt(sample.x,sample.z,.38,true));
    if(clear(base))return base;
    for(const distance of [1.5,2.4,3.4,4.6,6,7.5,9,11,14])for(const side of [1,-1]){const candidate={x:base.x+normalX*distance*side,z:base.z+normalZ*distance*side};if(clear(candidate))return candidate;}
    /* Em cruzamentos, mover somente pela normal pode cair sobre a via transversal. */
    const tangentX=Math.cos(rotationY),tangentZ=-Math.sin(rotationY);for(const distance of [4.6,6,7.5,9,11,14])for(const side of [1,-1])for(const tangentSide of [1,-1]){const candidate={x:base.x+normalX*distance*side+tangentX*distance*tangentSide,z:base.z+normalZ*distance*side+tangentZ*distance*tangentSide};if(clear(candidate))return candidate;}
    return{x:base.x+normalX*14,z:base.z+normalZ*14};
  }
  function v704ZoneAt(x,z,margin=0){return Object.values(WORLD_LAYOUT_V704.zones).filter(zone=>v704PointInRect({x,z},zone,margin)).map(zone=>zone.id);}
  function v704ConstructionAt(x,z,margin=0){return v704PointInRect({x,z},WORLD_LAYOUT_V704.zones.construction,-Math.abs(margin));}
  function v704ProtectedRectangles(){return [{id:'civil-airport',x:91,z:-188,w:132,d:68,margin:.3},{id:'balloon-launch',x:-66,z:89,w:12,d:12,margin:.3},...WORLD_LAYOUT_V704.structures.filter(item=>item.kind!=='sport-inner'&&item.kind!=='construction').map(item=>worldLayoutStructure(item.id))];}
  function v704ReservedAt(x,z,margin=0){if(v704RoadAt(x,z,margin,true))return true;return v704ProtectedRectangles().some(rect=>v704PointInRect({x,z},rect,Number(rect.margin||0)+margin));}
  function v704BuildAllowedAt(x,z,w=1.5,d=1.5){const zone=WORLD_LAYOUT_V704.zones.construction,rect={x,z,w,d};if(x-w/2<zone.x-zone.w/2||x+w/2>zone.x+zone.w/2||z-d/2<zone.z-zone.d/2||z+d/2>zone.z+zone.d/2)return false;if(WORLD_LAYOUT_V704.roads.some(road=>v704RectOverlap(rect,v704RoadFootprint(road,true),.25)))return false;return !(WORLD_LAYOUT_V704.highways||[]).some(highway=>v704HighwayIntersectsRect(highway.id,rect,.25));}
  function v704NearestConstructionSlot(index=0){const zone=WORLD_LAYOUT_V704.zones.construction,columns=6,spacingX=5,spacingZ=5,row=Math.floor(index/columns),column=index%columns;return{x:zone.x-zone.w/2+3+column*spacingX,z:zone.z-zone.d/2+3+row*spacingZ};}
  function v704PathRect(path){const dx=Number(path.x2)-Number(path.x1),dz=Number(path.z2)-Number(path.z1),length=Math.hypot(dx,dz);return{id:path.id,x:(path.x1+path.x2)/2,z:(path.z1+path.z2)/2,w:Math.abs(dx)+Number(path.w||2),d:Math.abs(dz)+Number(path.w||2),rotation:Math.atan2(dx,dz),length};}
  function v704StaticWorldAudit(){
    const problems=[],roads=WORLD_LAYOUT_V704.roads.map(road=>v704RoadFootprint(road,true)),structures=WORLD_LAYOUT_V704.structures.map(item=>worldLayoutStructure(item.id)),bounds=WORLD_LAYOUT_V704.bounds;
    const compatible=new Set(['stadium|football-field','football-field|stadium']);
    for(const road of roads){if(road.x-road.w/2<bounds.minX||road.x+road.w/2>bounds.maxX||road.z-road.d/2<bounds.minZ||road.z+road.d/2>bounds.maxZ)problems.push({type:'road-out-of-bounds',a:road.id});}
    for(const highway of WORLD_LAYOUT_V704.highways||[])for(const point of highway.points||[]){const margin=Number(highway.width||10)/2+Number(highway.shoulder||0);if(point.x-margin<bounds.minX||point.x+margin>bounds.maxX||point.z-margin<bounds.minZ||point.z+margin>bounds.maxZ)problems.push({type:'highway-out-of-bounds',a:highway.id});}
    for(const item of structures){
      if(item.x-item.w/2<bounds.minX||item.x+item.w/2>bounds.maxX||item.z-item.d/2<bounds.minZ||item.z+item.d/2>bounds.maxZ)problems.push({type:'structure-out-of-bounds',a:item.id});
      if(item.kind==='construction')continue;
      for(const road of roads){if((item.allowedRoads||[]).includes(road.id))continue;if(v704RectOverlap(item,road,Number(item.margin||0)))problems.push({type:'structure-on-road',a:item.id,b:road.id});}
      for(const highway of WORLD_LAYOUT_V704.highways||[]){if((item.allowedHighways||[]).includes(highway.id))continue;if(v704HighwayIntersectsRect(highway.id,item,Number(item.margin||0)))problems.push({type:'structure-on-highway',a:item.id,b:highway.id});}
    }
    for(let i=0;i<structures.length;i++)for(let j=i+1;j<structures.length;j++){
      const a=structures[i],b=structures[j];if(a.kind==='construction'||b.kind==='construction'||compatible.has(`${a.id}|${b.id}`)||a.inside===b.id||b.inside===a.id)continue;
      if(v704RectOverlap(a,b,Math.max(Number(a.margin||0),Number(b.margin||0))))problems.push({type:'structure-overlap',a:a.id,b:b.id});
    }
    const water=[WORLD_LAYOUT_V704.zones.lake,WORLD_LAYOUT_V704.zones.lakeNorth];
    for(const hazard of water)for(const road of roads)if(v704RectOverlap(hazard,road,.15))problems.push({type:'water-on-road',a:hazard.id,b:road.id});
    for(const item of structures.filter(s=>!['terrain'].includes(s.kind)))for(const hazard of water)if(v704RectOverlap(item,hazard,.1))problems.push({type:'structure-in-water',a:item.id,b:hazard.id});
    for(const path of WORLD_LAYOUT_V704.paths){const rect=v704PathRect(path);for(const structure of structures){if(['construction-zone'].includes(structure.id)||path.destination===structure.id)continue;const startInside=v704PointInRect({x:path.x1,z:path.z1},structure,.1),endInside=v704PointInRect({x:path.x2,z:path.z2},structure,.1);if(!startInside&&!endInside&&v704RectOverlap(rect,structure,.2))problems.push({type:'path-through-structure',a:path.id,b:structure.id});}}
    for(const sign of WORLD_LAYOUT_V704.signs||[]){const point=sign.kind==='highway'?v704HighwaySignPoint(sign):{x:Number(sign.x),z:Number(sign.z)};if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.z)){problems.push({type:'sign-invalid',a:sign.id});continue;}if(point.x<bounds.minX||point.x>bounds.maxX||point.z<bounds.minZ||point.z>bounds.maxZ)problems.push({type:'sign-out-of-bounds',a:sign.id});if(sign.kind==='guide'){if(roads.some(road=>v704PointInRect(point,road,.18)))problems.push({type:'guide-sign-on-road',a:sign.id});for(const highway of WORLD_LAYOUT_V704.highways||[])if(v704HighwayIntersectsRect(highway.id,{x:point.x,z:point.z,w:.3,d:.3},.1))problems.push({type:'guide-sign-on-highway',a:sign.id,b:highway.id});for(const hazard of water)if(v704PointInRect(point,hazard,.2))problems.push({type:'guide-sign-in-water',a:sign.id,b:hazard.id});for(const structure of structures)if(structure.kind!=='construction'&&v704PointInRect(point,structure,.15))problems.push({type:'guide-sign-in-structure',a:sign.id,b:structure.id});}else if(sign.kind==='highway'){const highway=v704HighwayById(sign.highwayId);if(!highway)problems.push({type:'highway-sign-route-missing',a:sign.id,b:sign.highwayId});}}
    return{version:704,passed:problems.length===0,problems,roads:roads.length,highways:(WORLD_LAYOUT_V704.highways||[]).length,structures:structures.length,zones:Object.keys(WORLD_LAYOUT_V704.zones).length,paths:WORLD_LAYOUT_V704.paths.length,signs:(WORLD_LAYOUT_V704.signs||[]).length};
  }
  function v704ActualHouseRect(house){
    if(!house)return null;
    const source=worldLayoutStructure(house.id==='castle-hall'?'castle':house.id);
    return{id:String(source?.id||house.id||'house'),runtimeId:String(house.id||''),kind:source?.kind||'runtime-house',x:Number(house.x??source?.x),z:Number(house.z??source?.z),w:Number(source?.w||house.w||9),d:Number(source?.d||house.d||7),allowedRoads:[...(source?.allowedRoads||[])],allowedHighways:[...(source?.allowedHighways||[])]};
  }
  function v704PathConnectedToRoad(point){
    const paths=WORLD_LAYOUT_V704.paths||[],nodes=[];
    for(const path of paths){const a={x:Number(path.x1),z:Number(path.z1)},b={x:Number(path.x2),z:Number(path.z2)},ai=nodes.push(a)-1,bi=nodes.push(b)-1;a.peer=bi;b.peer=ai;}
    const queue=[],visited=new Set();nodes.forEach((node,index)=>{if(Math.hypot(node.x-point.x,node.z-point.z)<=3.6){queue.push(index);visited.add(index);}});
    while(queue.length){const index=queue.shift(),node=nodes[index];if(v704RoadAt(node.x,node.z,.85,true))return true;for(const next of [node.peer,...nodes.map((other,otherIndex)=>otherIndex!==index&&Math.hypot(other.x-node.x,other.z-node.z)<=1.15?otherIndex:-1).filter(otherIndex=>otherIndex>=0)])if(!visited.has(next)){visited.add(next);queue.push(next);}}
    return false;
  }
  function v704RuntimeWorldAudit(){
    const problems=[],roads=WORLD_LAYOUT_V704.roads.map(road=>v704RoadFootprint(road,true)),protectedRects=v704ProtectedRectangles(),houses=(world?.houses||[]).map(v704ActualHouseRect).filter(Boolean),vehicles=world?.vehicles||[],hazards=world?.hazards||[];
    const add=(type,a,b='',detail='')=>problems.push({type,a:String(a||''),b:String(b||''),detail:String(detail||'')});
    for(const house of houses)for(const road of roads)if(!(house.allowedRoads||[]).includes(road.id)&&v704RectOverlap(house,road,1.0))add('house-on-road',house.id,road.id);for(const house of houses)for(const highway of WORLD_LAYOUT_V704.highways||[])if(!(house.allowedHighways||[]).includes(highway.id)&&v704HighwayIntersectsRect(highway.id,house,1.0))add('house-on-highway',house.id,highway.id);
    for(let i=0;i<houses.length;i++)for(let j=i+1;j<houses.length;j++)if(v704RectOverlap(houses[i],houses[j],1.0))add('house-overlap',houses[i].id,houses[j].id);
    for(const house of houses)for(const hazard of hazards)if(Number.isFinite(hazard.w)&&v704RectOverlap(house,hazard,.25))add('house-in-hazard',house.id,hazard.type);
    const protectedGameplay=protectedRects.filter(rect=>['sport','kart','farm','castle'].includes(rect.kind));for(const collider of world?.colliders||[]){const rect={x:Number(collider.x),z:Number(collider.z),w:Number(collider.w),d:Number(collider.d)};if(!Number.isFinite(rect.x)||collider.sportsV704||collider.kartV704)continue;for(const protectedRect of protectedGameplay){if(protectedRect.kind==='castle'&&collider.castle)continue;if(v704RectOverlap(rect,protectedRect,.15))add('collider-in-protected-area',collider.houseId||collider.buildId||collider.landmark||'collider',protectedRect.id);}}
    for(const vehicle of vehicles){const x=Number(vehicle.group?.position?.x??vehicle.x),z=Number(vehicle.group?.position?.z??vehicle.z),id=String(vehicle.id||'vehicle');if(!Number.isFinite(x)||!Number.isFinite(z)){add('vehicle-invalid-position',id);continue;}const isKart=String(vehicle.kind||'')==='kart',owned=Array.isArray(state?.vehicles?.owned)&&state.vehicles.owned.includes(id);if(!isKart)for(const road of roads)if(v704PointInRect({x,z},road,Number(vehicle.radius||1.35)))add('vehicle-on-road',id,road.id);for(const structure of protectedRects){if(isKart&&(structure.kind==='kart'||structure.kind==='kart-inner'))continue;if(structure.kind==='garage'&&owned)continue;if(structure.id==='workshop'&&(world.workshopLifts||[]).some(l=>String(l.vehicleId)===id&&Math.hypot(x-l.x,z-l.z)<.65))continue;if(v704PointInRect({x,z},structure,1.2))add('vehicle-inside-structure',id,structure.id);}}
    const busStops=world?.busStops||[];for(const stop of busStops){const x=Number(stop.sign?.position?.x??stop.x),z=Number(stop.sign?.position?.z??stop.z),rotation=Number(stop.sign?.rotation?.y||0),samples=[{x,z},{x:x+Math.cos(rotation)*1.08,z:z-Math.sin(rotation)*1.08},{x:x-Math.cos(rotation)*1.08,z:z+Math.sin(rotation)*1.08}];if(samples.some(sample=>v704RoadAt(sample.x,sample.z,.38,true)))add('bus-stop-sign-on-road',stop.id,'road-or-sidewalk');}for(let i=0;i<busStops.length;i++)for(let j=i+1;j<busStops.length;j++)if(Math.hypot(busStops[i].x-busStops[j].x,busStops[i].z-busStops[j].z)<3.5)add('duplicate-bus-stop-sign',busStops[i].id,busStops[j].id);
    const spawn=worldLayoutPoint('spawn');if(typeof positionBlockedForPlayer==='function'&&positionBlockedForPlayer(spawn.x,spawn.z,.42,{ignoreTraffic:true,allowWater:false}))add('spawn-blocked','spawn');
    const important=['sportsEntrance','footballEntrance','volleyEntrance','footvolleyEntrance','kartEntrance','farmEntrance','castleEntrance','mountainEntrance','constructionEntrance','ottoviasEntry','ottoviasOperationsAccess','ottoviasTollSouth','ottoviasTollField','ottoviasTollBeach'];for(const id of important){const p=worldLayoutPoint(id);if(typeof nearestRoadProjection==='function'){const projection=nearestRoadProjection(p),pathConnected=v704PathConnectedToRoad(p);if((!projection||projection.distance>18||projection.clear===false)&&!pathConnected)add('destination-inaccessible',id,'road-or-path',projection?`distance=${projection.distance.toFixed(1)}`:'no-projection');}}
    const names={};worldGroup?.traverse?.(object=>{const name=String(object.name||'');if(name)names[name]=(names[name]||0)+1;});for(const name of['OTTHI_V702_FARM','OTTHI_V702_MOUNTAIN','OTTHI_V704_SPORTS','OTTHI_V704_KART'])if((names[name]||0)>1)add('duplicate-world-system',name,String(names[name]));
    const result={version:704,passed:problems.length===0,problems,houses:houses.length,vehicles:vehicles.length,colliders:world?.colliders?.length||0,hazards:hazards.length,interactables:world?.interactables?.length||0,at:Date.now()};world.layoutAuditRuntime=result;if(!result.passed)console.error('[OTTHI V704] auditoria geométrica do mundo real',problems);return result;
  }
  window.OTTHI_WORLD_LAYOUT_V704={layout:WORLD_LAYOUT_V704,point:worldLayoutPoint,zone:worldLayoutRect,structure:worldLayoutStructure,staticAudit:v704StaticWorldAudit,runtimeAudit:v704RuntimeWorldAudit,audit:v704StaticWorldAudit,roadAt:v704RoadAt,highwayAt:v704HighwayAt,highwayById:v704HighwayById,highwaySignPoint:v704HighwaySignPoint,highwaySegments:v704HighwaySegments,reservedAt:v704ReservedAt,buildAllowedAt:v704BuildAllowedAt,constructionSlot:v704NearestConstructionSlot,zonesAt:v704ZoneAt,bounds:v704WorldBounds,clamp:v704ClampWorldPoint};

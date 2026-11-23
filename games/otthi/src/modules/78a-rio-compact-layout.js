/** Rio Preto lots and connections adapted to the original World coordinates. */
// @otthi-module-body
  const RIO_COMPACT_LAYOUT={
    highways:[
      {id:'rio-compact-godoy',name:'Rua Antônio de Godoy',width:10,shoulder:1,closed:false,
        points:[{x:-105,z:0},{x:-140,z:0},{x:-170,z:0}]},
      {id:'rio-compact-murchid',name:'Avenida Murchid Homsi',width:12,shoulder:1.2,closed:false,
        points:[{x:205,z:-104},{x:205,z:-10},{x:205,z:56},{x:205,z:117}]},
      {id:'rio-condominios-link',name:'Acesso Rios D’Italia',width:9,shoulder:1,closed:false,
        points:[{x:205,z:118},{x:300,z:118},{x:300,z:230}]}
    ],
    nodes:{
      RIO_GODOY:{x:-140,z:0},RIO_GODOY_W:{x:-170,z:0},
      RIO_MURCHID_S:{x:205,z:-104},RIO_MURCHID_M:{x:205,z:56},RIO_MURCHID_N:{x:205,z:117},RIO_MURCHID_CONDOMINIOS:{x:300,z:230}
    },
    edges:[['HW','RIO_GODOY'],['RIO_GODOY','RIO_GODOY_W'],['RIO_GODOY_W','OV18'],['RIO_GODOY_W','OV19'],
      ['RIO_MURCHID_S','A_LINK'],['A_LINK','RIO_MURCHID_M'],['RIO_MURCHID_M','RIO_MURCHID_N'],['RIO_MURCHID_N','RIO_MURCHID_CONDOMINIOS']],
    avenueNames:{
      'avenida-central-ew':'Avenida Bady Bassitt',
      'avenida-central-ns':'Avenida Alberto Andaló',
      'acesso-norte':'Avenida da Represa',
      'via-floresta-norte':'Rua XV de Novembro',
      'via-escola-leste':'Rua General Glicério'
    },
    // Width and depth describe each playable interior. Facing points to the street or promenade.
    lots:[
      ['mercado_municipal',-137,18,34,19,'n','Rua Antônio de Godoy'],
      ['catedral_sao_jose',-136,-19,25,19,'s','Rua Antônio de Godoy'],
      ['prefeitura_andalo',100,55,27,16,'n','Avenida Alberto Andaló'],
      ['calcadao_centro',-43,15,10,6,'n','Avenida Bady Bassitt'],
      ['mcdonalds_andalo',18,-87,12,10,'w','Avenida Alberto Andaló'],
      ['complexo_swift',-128,52,12,14,'e','Orla da Represa'],
      ['dona_capi',-99,36,3,3,'s','Orla da Represa'],
      ['canecao_represa',-77,32,20,11,'s','Orla da Represa'],
      ['posto_brasilia',185,-40,24,17,'e','Avenida Murchid Homsi'],
      ['estadio_anisio_haddad',-208,-81,32,22,'s','Acesso à Coleção'],
      ['riopreto_shopping',225,24,28,16,'w','Avenida Murchid Homsi'],
      ['plaza_avenida',185,28,24,16,'e','Avenida Murchid Homsi'],
      ['centro_eventos',225,80,28,17,'w','Avenida Murchid Homsi'],
      ['austa_hospital',185,81,25,16,'e','Avenida Murchid Homsi'],
      ['cemiterio_sao_joao_batista',-130,86,12,9,'n','Orla da Represa'],
      ['parque-da-represa',-91.5,34,6,4,'s','Orla da Represa'],
      ['panificacao-zappas-centro',-87,17,11,10,'n','Avenida Bady Bassitt'],
      ['terminal-urbano',225,-61,25,14,'w','Avenida Murchid Homsi'],
      ['upa-jaguare',185,54,13,12,'e','Avenida Murchid Homsi'],
      ['cachoeira_troca_oleo',185,-68,13,9,'e','Avenida Murchid Homsi'],
      ['casa-jardim',225,0,11,9,'w','Avenida Murchid Homsi'],
      ['casa-cotegipe',225,51,11,9,'w','Avenida Murchid Homsi'],
      ['casa-vila-ercilia',185,4.5,11,10,'e','Avenida Murchid Homsi'],
      ['casa-damha',225,107,15,11,'w','Avenida Murchid Homsi'],
      ['casa-damha-varanda',185,107,15,12,'e','Avenida Murchid Homsi'],
      // The six condominium lots extend the existing street grid; no existing lot is replaced.
      ['rios_candelaro',280,147,22,20,'e','Rios D’Italia · Av. Murchid Homsi'],
      ['rios_fiora',320,147,22,20,'w','Rios D’Italia · Av. Murchid Homsi'],
      ['rios_salso',280,181,22,20,'e','Rios D’Italia · Av. Murchid Homsi'],
      ['rios_fortore',320,181,22,20,'w','Rios D’Italia · Av. Murchid Homsi'],
      ['rios_liri',280,215,22,20,'e','Rios D’Italia · Av. Murchid Homsi'],
      ['rios_tanaro',320,215,22,20,'w','Rios D’Italia · Av. Murchid Homsi']
    ],
    sections:[[-65,40],[-116.8,40],[-118.7,43],[-118.7,76.5],[-115.7,78.2],[-90.4,78.2],
      [-89.1,74.5],[-89.1,68.7],[-63,68.7],[-61.4,65],[-61.4,42],[-63,40],[-65,40]]
  };
  const rioCompactYaw={s:0,n:Math.PI,w:-Math.PI/2,e:Math.PI/2};
  function rioCompactWorld(){return typeof rioMap!=='undefined'&&!!rioMap?.compact;}
  function rioCompactLotRect([key,x,z,w,d,facing]){
    return {id:'rio-compact-'+key,x,z,w:facing==='e'||facing==='w'?d:w,
      d:facing==='e'||facing==='w'?w:d,margin:.45};
  }

  // Stable identifiers match the original Rio Preto saves.
  const RIO_COMPACT_SITES=[
    ["mercado_municipal","regional-mercado_municipal","Mercado Municipal · Mercadão","market"],
    ["catedral_sao_jose","regional-catedral_sao_jose","Catedral Metropolitana São José","church"],
    ["prefeitura_andalo","regional-prefeitura_andalo","Prefeitura Municipal (Paço)","civic"],
    ["calcadao_centro","regional-calcadao_centro","Calçadão · Praça Dom José Marcondes","square"],
    ["mcdonalds_andalo","regional-mcdonalds_andalo","McDonald's — Av. Alberto Andaló","dining"],
    ["complexo_swift","regional-complexo_swift","Complexo Swift & Teatro Paulo Moura","theater"],
    ["dona_capi","regional-dona_capi","Escultura Dona Capi (Capivara)","statue"],
    ["canecao_represa","regional-canecao_represa","Canecão Represa","dining"],
    ["posto_brasilia","regional-posto_brasilia","Posto Chiesa Brasília","fuel"],
    ["estadio_teixeirao","regional-estadio_teixeirao","Teixeirão · Estádio Benedito Teixeira","stadium"],
    ["estadio_anisio_haddad","regional-estadio_anisio_haddad","Estádio Anísio Haddad (Rio Preto EC)","practice"],
    ["riopreto_shopping","regional-riopreto_shopping","Riopreto Shopping Center","mall"],
    ["plaza_avenida","regional-plaza_avenida","Plaza Avenida Shopping","mall"],
    ["centro_eventos","regional-centro_eventos","Centro Regional de Eventos","exhibition"],
    ["austa_hospital","regional-austa_hospital","Austa Hospital","reception"],
    ["cemiterio_sao_joao_batista","regional-cemiterio_sao_joao_batista","Cemitério São João Batista","garden"],
    ["parque-da-represa","regional-parque_da_represa","Parque da Represa Municipal","trail"],
    ["panificacao-zappas-centro","regional-panificacao_zappas_centro","Zappa’s · unidade do Centro","bakery"],
    ["terminal-urbano","regional-terminal_urbano","Terminal Urbano","station"],
    ["upa-jaguare","regional-upa_jaguare","UPA Jaguaré","reception"],
    ["aeroporto-sbsr","regional-aeroporto_sbsr","Aeroporto Prof. Eribelto Manoel Reino","airport"],
    ["cachoeira_troca_oleo","regional-cachoeira_troca_oleo","Cachoeira Super Troca de Óleo","oil-shop"],
    ["casa-jardim","regional-casa-jardim","Casa do Jardim · Teixeira de Freitas","residence","popular",0],
    ["casa-cotegipe","regional-casa-cotegipe","Casa de varanda · Barão de Cotegipe","residence","popular",380],
    ["casa-vila-ercilia","regional-casa-vila-ercilia","Casa térrea · Vila Ercília","residence","popular",450],
    ["casa-damha","regional-casa-damha","Casa contemporânea · Damha","residence","damha",1250],
    ["casa-damha-varanda","regional-casa-damha-varanda","Casa com varanda · Damha","residence","damha",1490],
    ["rios_candelaro","regional-rios-italia-candelaro","Rios D’Italia · Rio Candelaro","residence","rios-ditalia",1280],
    ["rios_fiora","regional-rios-italia-fiora","Rios D’Italia · Rio Fiora","residence","rios-ditalia",1340],
    ["rios_salso","regional-rios-italia-salso","Rios D’Italia · Rio Salso","residence","rios-ditalia",1300],
    ["rios_fortore","regional-rios-italia-fortore","Rios D’Italia · Rio Fortore","residence","rios-ditalia",1360],
    ["rios_liri","regional-rios-italia-liri","Rios D’Italia · Rio Liri","residence","rios-ditalia",1380],
    ["rios_tanaro","regional-rios-italia-tanaro","Rios D’Italia · Rio Tanaro","residence","rios-ditalia",1420]
  ];

/** Dados do laboratório 5.1 adaptados ao terreno e à malha nativa do OTTHI. */
// @otthi-module-body
  const RIO_V51_PLACES = [
    ["complexo_swift", "Complexo Swift & Teatro Paulo Moura", "represa_lagos_damha", 475, -533, -1, 22, 18, 14, "swift", false, "Av. Duque de Caxias, 3900 - Jd. dos Seixas, SJRP", "https://www.riopreto.sp.gov.br/"],
    ["dona_capi", "Escultura Dona Capi (Capivara)", "represa_lagos_damha", 476, -595, 1, 8, 6, 8, "capi", false, "Parque da Represa Municipal - Vila Ercília, SJRP", "https://www.riopreto.sp.gov.br/"],
    ["ponte_julio_zacarin", "Ponte Estaiada Júlio Zacarin", "represa_lagos_damha", 508, -603, 1, 18, 16, 10, "bridge", false, "Jardim Yolanda, São José do Rio Preto - SP", "https://www.riopreto.sp.gov.br/"],
    ["canecao_represa", "Canecão Represa", "represa_lagos_damha", 505, -537, -1, 16, 6, 12, "commerce", false, "Av. Lino José de Seixas, 1287 - Vila Goyos, SJRP", "https://waymenu.com.br/menu/canecaorepresa/", "fastfood"],
    ["posto_brasilia", "Posto Chiesa Brasília", "represa_lagos_damha", 533, -537, -1, 16, 6, 12, "service", false, "Av. Dr. Fernando Costa, 1549 - Jd. Primavera, SJRP", "https://postochiesabrasilia.divulgaempresasmarketing.com.br/"],
    ["portaria_damha", "Condomínios Damha & Av. Nadima Damha", "represa_lagos_damha", 541, -588, 1, 18, 7, 10, "gate", false, "Av. Nadima Damha - São José do Rio Preto - SP", "https://www.riopreto.sp.gov.br/"],
    ["riopreto_shopping", "Riopreto Shopping Center", "eixo_sul_shoppings", 506, -342, -1, 26, 10.5, 18, "mall", false, "Av. Brigadeiro Faria Lima, 6363 - Jd. Morumbi, SJRP", "https://www.riopretoshopping.com.br/"],
    ["shopping_iguatemi", "Shopping Iguatemi São José do Rio Preto", "eixo_sul_shoppings", 555, -380, 1, 26, 11, 17, "mall", false, "Av. Pres. Juscelino K. de Oliveira, 5000 - Iguatemi, SJRP, 15093-340", "https://iguatemi.com.br/saojosedoriopreto/"],
    ["plaza_avenida", "Plaza Avenida Shopping", "eixo_sul_shoppings", 551, -342, -1, 24, 11, 16, "mall", false, "Av. José Munia, 4775 - Jardim Redentor, SJRP", "http://www.plazaavenida.com.br/"],
    ["obelisco_espanha", "Obelisco da Plaza de España", "eixo_sul_shoppings", 596, -342, -1, 9, 16, 9, "obelisk", false, "Av. José Munia - Jardim Redentor, SJRP", "https://www.riopreto.sp.gov.br/"],
    ["centro_eventos", "Centro Regional de Eventos", "eixo_sul_shoppings", 630, -380, 1, 22, 9.5, 16, "hall", false, "Av. José Munia, 5650 - Nova Redentora, SJRP", "https://www.riopreto.sp.gov.br/"],
    ["prefeitura_andalo", "Prefeitura Municipal (Paço)", "centro_calcadao_andalo", -34, -686, 1, 18, 21, 14, "tower", false, "Av. Dr. Alberto Andaló, 3030 - Centro, SJRP", "https://www.riopreto.sp.gov.br/"],
    ["mercado_municipal", "Mercado Municipal (\"Mercadão\")", "centro_calcadao_andalo", -3, -686, 1, 20, 9.5, 16, "market", false, "Rua Antônio de Godoy, 3048 - Centro, SJRP", "https://www.riopreto.sp.gov.br/", "market"],
    ["catedral_sao_jose", "Catedral Metropolitana São José", "centro_calcadao_andalo", 29, -686, 1, 19, 22, 22, "church", false, "Rua Siqueira Campos, 3033 - Centro, SJRP", "https://catedralriopreto.com.br/"],
    ["calcadao_centro", "Calçadão do Centro & Galerias", "centro_calcadao_andalo", 62, -686, 1, 22, 7, 14, "commerce", false, "Praça Dom José Marcondes e entorno do Calçadão, SJRP", "https://www.riopreto.sp.gov.br/"],
    ["mcdonalds_andalo", "McDonald's — Av. Alberto Andaló", "centro_calcadao_andalo", 137, -686, 1, 15, 6.5, 12, "commerce", false, "Av. Dr. Alberto Andaló, 4155 - Vila Redentora, SJRP", "https://www.mcdonalds.com.br/", "fastfood"],
    ["casa_nicoletti", "Casa Nicoletti — Ferragens", "bady_bassitt", -286, -505, 1, 16, 7, 12, "commerce", false, "Av. Bady Bassitt, 3050 - Boa Vista, SJRP", "https://casanicoletti.com.br/contato/", "tools"],
    ["zappas_bady", "Zappa's Pães e Tentações — Bady", "bady_bassitt", -248, -504, 1, 18, 6.5, 13, "commerce", false, "Av. Bady Bassitt, 3920 - Vila Imperial, SJRP", "https://www.zappas.com.br/nossas-lojas-e-horarios", "cafe"],
    ["austa_hospital", "Austa Hospital", "murchid_homsi", 472, -449, -1, 22, 15, 14, "hospital", false, "Av. Murchid Homsi, 1385 - Pq. Res. Mançor Daud, SJRP", "https://austahospital.com.br/unidades/austa-hospital/"],
    ["supermercado_economico", "Supermercado Econômico", "murchid_homsi", 511, -449, -1, 19, 6.5, 13, "commerce", false, "Av. Murchid Homsi, 1215 - Parque Celeste, SJRP", "https://www.google.com/maps/place//data=!4m2!3m1!19sChIJS9tG0qyyvZQRc5LXhBePF00", "market"],
    ["shopping_cidade_norte", "Shopping Cidade Norte", "zona_norte", 376, -310, -1, 24, 9.5, 16, "mall", false, "Av. Alfredo Antônio de Oliveira, 2077 - Jd. Planalto, SJRP", "http://www.shoppingcidadenorte.com.br/"],
    ["corredor_mirassolandia", "Corredor Comercial Av. Mirassolândia", "zona_norte", 462, -312, -1, 20, 7.5, 12, "plaza", false, "Av. Mirassolândia - Eldorado / Costa do Sol, SJRP", "https://www.riopreto.sp.gov.br/"],
    ["cachoeira_troca_oleo", "Cachoeira Super Troca de Óleo", "zona_norte", 389, -351, 1, 17, 6.5, 12, "service", false, "Av. Antoninho Marmo, 3950 - Solo Sagrado, SJRP, 15044-050", "http://cachoeirasupertorcadeoleo.com.br/"],
    ["upa_norte", "UPA Norte (Pronto Atendimento 24h)", "zona_norte", 420, -350, 1, 19, 6.5, 13, "hospital", false, "R. Manoel Moreno, 130 - Jardim Antunes, SJRP, 15047-050", "https://saude.riopreto.sp.gov.br/transparencia/modules/mastop_publish/?tac=USDSII_UPA_Regi_Nort"],
    ["planalto_materiais", "Planalto Materiais para Construção", "zona_norte", 432, -311, -1, 20, 7.5, 13, "commerce", false, "Av. Antônio Antunes Júnior, 6101 - Conj. Hab. Duas Vendas, SJRP, 15046-670", "https://www.google.com/maps/place//data=!4m2!3m1!19sChIJ7aJcYt2svZQRXRzjgKgl_us", "materials"],
    ["atacadao_falavina", "Atacadão — SJRP Falavina", "zona_norte", 457, -351, 1, 24, 8.5, 15, "market", false, "Av. Alfredo Antônio de Oliveira, 3355 - Res. Caetano, SJRP, 15046-840", "https://www.atacadao.com.br/", "market"],
    ["aeroporto_sjrp", "Aeroporto Prof. Eribelto Manoel Reino", "infra_aeroporto_rodovias", -380, -447, 1, 24, 12, 15, "terminal", false, "Av. dos Estudantes, 3505 - Vila Aeroporto, SJRP", "https://aeroportospaulistas.com.br/sao-jose-do-rio-preto/"],
    ["cemiterio_sao_joao_batista", "Cemitério São João Batista", "infra_aeroporto_rodovias", -344, -447, 1, 18, 7, 12, "plaza", false, "Av. dos Estudantes, s/n - Jd. Novo Aeroporto, SJRP", "https://www.riopreto.sp.gov.br/"],
    ["recinto_exposicoes", "Recinto de Exposições Alberto Bertelli Lucatto", "infra_aeroporto_rodovias", -307, -449, 1, 22, 9, 14, "hall", false, "R. Daniel Antônio de Freitas, 115 - Distrito Industrial, SJRP", "https://www.riopreto.sp.gov.br/"],
    ["posto_prf_br153", "Base Rodoviária BR-153 Km 69,7 (Ref. PRF)", "infra_aeroporto_rodovias", -268, -451, 1, 14, 6, 10, "service", false, "BR-153, Km 69,7 Sul - Jd. Vivendas, SJRP", "http://www.gov.br/prf/pt-br"],
    ["base_pmrv_sp310", "Base Rodoviária SP-310 Km 443 (Ref. PMRv)", "infra_aeroporto_rodovias", -239, -450, 1, 14, 6, 10, "service", false, "Rod. Washington Luís, Km 443 - SJRP", "http://www4.policiamilitar.sp.gov.br/unidades/cprv/"],
    ["estacao_schmitt", "Estação Ferroviária de Eng. Schmitt", "engenheiro_schmitt", 735, -448, 1, 20, 7.5, 12, "station", false, "R. Dr. Coutinho Cavalcanti, 34 - Eng. Schmitt, SJRP", "https://www.riopreto.sp.gov.br/"],
    ["doces_noemia", "Noêmia Doces Caseiros", "engenheiro_schmitt", 773, -450, 1, 16, 6.2, 11, "commerce", false, "R. Treze de Maio, 385 - Eng. Schmitt, SJRP, 15104-002", "http://www.docesnoemia.com.br/", "cafe"],
    ["montanhas_rios_italia", "Mirante & Montanhas Rios di Itália (Fictício)", "expansoes_ficticias", 773, -543, 1, 22, 16, 18, "lookout", true, "Área Criativa Fictícia do OTThi World — sem correspondência real", "https://otthi-world.local/expansao-ficticia"],
    ["praia_cedral", "Praia Recreativa de Cedral (Fictício)", "expansoes_ficticias", 812, -543, 1, 22, 7, 16, "beach", true, "Área Criativa Fictícia do OTThi World — Cedral não tem litoral real", "https://otthi-world.local/expansao-ficticia"],
    ["estadio_anisio_haddad", "Estádio Anísio Haddad (Rio Preto EC)", "rota_estadios", -769, -295, 1, 24, 11, 18, "stadium", false, "Av. Anísio Haddad, 6188 - Jardim Aclimação, SJRP, 15093-000", "https://www.facebook.com/riopretoecoficial/"],
    ["estadio_teixeirao", "Estádio Benedito Teixeira — Teixeirão (América FC)", "rota_estadios", -729, -295, 1, 25, 12, 19, "stadium", false, "Av. Antônio Tavares Pereira Lima, 904-1074 - Jd. Bela Vista, SJRP, 15061-220", "https://www.google.com/maps/place//data=!4m2!3m1!19sChIJK1w-yLZSvJQRBP1zx7nGDhM"],
    ["estadio_maiao", "Estádio José Maria de Campos Maia — Maião (Mirassol FC)", "rota_estadios", -686, -295, 1, 24, 11.5, 18, "stadium", false, "Av. Lauro Luchese, 2650 - Centro, Mirassol - SP, 15130-000", "http://mirassolfc.com.br/"],
    ["estadio_jorjao", "Estádio Dr. Jorge Ismael de Biasi — Jorjão (Novorizontino)", "rota_estadios", -644, -295, 1, 24, 11, 18, "stadium", false, "R. Francisco Alves do Vale, 197 - Novo Horizonte - SP, 14960-000", "https://www.google.com/maps/place//data=!4m2!3m1!19sChIJuxzFNW-OvpQRWogAC7l4WMo"],
    ["termas_ibira", "Termas de Ibirá (Balneário Águas Termais)", "circuito_turistico", -811, -576, 1, 22, 8, 16, "pool", false, "Termas de Ibirá, Ibirá - SP, 15860-000", "https://www.google.com/maps/place//data=!4m2!3m1!19sChIJxR9AA38lvJQRlYHWY1O8EG0"],
    ["thermas_laranjais", "Thermas dos Laranjais (Olímpia)", "circuito_turistico", -771, -576, 1, 26, 14, 18, "pool", false, "Av. do Folclore, 1543 - Jd. Santa Efigênia, Olímpia - SP, 15405-014", "http://www.termas.com.br/"],
    ["parque_peao_barretos", "Parque do Peão Os Independentes (Barretos)", "circuito_turistico", -726, -583, 1, 28, 15, 20, "arena", false, "Rod. Brg. Faria Lima, Km 428 - Zona Rural, Barretos - SP, 14780-970", "http://www.independentes.com.br/"],
  ];
  const RIO_V51_SECTORS = [
    ["centro_calcadao_andalo", "Centro & Andaló", "RIO_andalo_4", [-48, -34, -3, 29, 62, 100, 137, 154], -666, [[100, -648], [100, -666]]],
    ["bady_bassitt", "Av. Bady Bassitt", "RIO_oeste_1", [-302, -286, -248, -226], -481, [[-200, -464], [-226, -481]]],
    ["murchid_homsi", "Av. Murchid Homsi", "RIO_murchid_5", [449, 472, 511, 536], -472, [[438, -532], [448, -506], [449, -472]]],
    ["represa_lagos_damha", "Represa (Lagos 1-3) & Damha", "RIO_murchid_5", [467, 475, 476, 505, 508, 533, 541, 551], -554, [[438, -532], [459, -545], [467, -554]]],
    ["engenheiro_schmitt", "Eng. Schmitt (+ Noêmia)", "EXT_outer-link_3", [715, 735, 773, 794], -424, [[680, -400], [712, -414], [715, -424]]],
    ["zona_norte", "Zona Norte Completa", "EXT_outer-link_4", [360, 376, 389, 420, 432, 457, 462, 480], -332, [[360, -400], [360, -332]]],
    ["circuito_turistico", "Ibirá, Olímpia & Barretos", "RIO_AUTODROMO_MIRASSOL_3", [-830, -811, -771, -726, -700], -552, [[-590, -432], [-646, -433], [-694, -450], [-700, -504], [-700, -552]]],
    ["eixo_sul_shoppings", "Eixo Sul & Shoppings", "EXT_outer-link_3", [491, 506, 551, 555, 596, 630, 647], -360, [[680, -400], [669, -373], [647, -360]]],
    ["rota_estadios", "Rota dos Estádios Regionais", "EXT_FOREST_OUT", [-795, -769, -729, -686, -644, -624], -272, [[-610, -220], [-623, -245], [-624, -272]]],
    ["infra_aeroporto_rodovias", "Aeroporto, Recinto & Rodovias", "EXT_outer-link_5", [-413, -380, -344, -307, -268, -239, -220], -427, [[-200, -400], [-212, -414], [-220, -427]]],
    ["expansoes_ficticias", "Montanhas & Praia (Fictício)", "V51_engenheiro_schmitt_794", [752, 773, 812, 832], -516, [[794, -424], [806, -461], [806, -496], [806, -516]]],
  ];
  const RIO_V51 = (() => {
    const nodes={},highways=[],edges=[],sectors={},pointsByCoordinate=new Map();
    function chain(id,label,vertices,anchor,width,suffix="") {
      let previous=anchor;
      pointsByCoordinate.set(vertices[0].join(','),anchor);
      for(const [i,[x,z]] of vertices.entries()){
        if(i===0)continue;
        const key=x+','+z;
        const name='V51_'+id+'_'+x;
        const node=pointsByCoordinate.get(key)||(nodes[name]?name+'_'+z:name);
        if(!pointsByCoordinate.has(key)){nodes[node]={x,z};pointsByCoordinate.set(key,node);}
        if(node!==previous)edges.push([previous,node]);
        previous=node;
      }
      highways.push({id:'rio-v51-'+id+suffix,name:label,regional:true,width,shoulder:.8,closed:false,points:vertices.map(([x,z])=>({x,z}))});
    }
    for(const [id,label,anchor,positions,z,approach] of RIO_V51_SECTORS){
      const join=approach.at(-1),xs=[...new Set([...positions,join[0]])].sort((a,b)=>a-b);
      chain(id+'-access','Acesso · '+label,approach,anchor,8);
      const at=pointsByCoordinate.get(join.join(','));
      const line=xs.map(x=>[x,z]),index=xs.indexOf(join[0]);
      if(index>0)chain(id,label,line.slice(0,index+1).reverse(),at,9,'-oeste');
      if(index<line.length-1)chain(id,label,line.slice(index),at,9,'-leste');
      sectors[id]={id,label,z,x:(xs[0]+xs.at(-1))/2,places:[]};
    }
    const places=RIO_V51_PLACES.map(([key,name,sector,x,z,face,w,h,d,shape,fictional,address,source,shop])=>{
      const roadZ=sectors[sector].z;
      const point={id:'regional-'+key,key,name,sector,x,z,face,w,h,d,shape,fictional,address,source,shop,
        visitX:x,visitZ:z+face*(d/2+2),navX:x,navZ:roadZ};
      sectors[sector].places.push(point);
      return point;
    });
    const protectedRects=places.map(p=>({id:p.id,kind:'regional-landmark',x:p.x,z:p.z,w:p.w+1,d:p.d+1,margin:.55}));
    // Six gates. The pedestrian course curves around the lakes and stays on land.
    const start={x:549,z:-573};
    const route=[start,{x:460,z:-573},{x:460,z:-635},{x:563,z:-635},{x:563,z:-573},start];
    const gates=[
      {x:526,z:-573,label:'Avenida Nadima Damha'},
      {x:505,z:-573,label:'Posto Brasília'},
      {x:483,z:-573,label:'Orla do Canecão'},
      {x:460,z:-610,label:'Retorno Swift'},
      {x:511,z:-635,label:'Via do parque'},
      {...start,label:'Chegada · Damha'}
    ];
    for(let i=1;i<route.length;i++){
      const a=route[i-1],b=route[i];
      protectedRects.push({id:'represa-footpath-'+i,kind:'regional-footpath',x:(a.x+b.x)/2,z:(a.z+b.z)/2,w:Math.abs(a.x-b.x)+4,d:Math.abs(a.z-b.z)+4});
    }
    const lakes=[474,503,532].map((x,i)=>({id:'lake-'+(i+1),x,z:-611,w:24,d:27}));
    for(const lake of lakes)protectedRects.push({...lake,kind:'regional-lake'});
    return {places,sectors,nodes,edges,highways,protectedRects,
      course:{id:'corrida_rua_represa_damha',name:'Corrida de Rua · Represa e Damha',start,route,gates,lakes}};
  })();

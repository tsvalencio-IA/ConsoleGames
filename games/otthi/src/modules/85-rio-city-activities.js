/** Activities staged at the landmark itself. The current activity uses the normal action control. */
// @otthi-module-body
  const RIO_CITY_ACTIVITIES={
    complexo_swift:['theater','Preparar a sessão no Teatro Paulo Moura','Separar os programas na bilheteria','Ligar a luz do palco'],
    dona_capi:['nature','Observar a fauna da Represa','Consultar a placa das capivaras','Observar a margem em silêncio'],
    ponte_julio_zacarin:['walk','Vistoriar a travessia da Ponte Júlio Zacarin','Conferir o acesso dos pedestres','Checar a sinalização na outra ponta'],
    posto_brasilia:['service','Organizar a parada no Posto Brasília','Conferir a área de parada','Separar o material de limpeza dos vidros'],
    riopreto_shopping:['mall','Retirar uma encomenda no Riopreto Shopping','Confirmar a retirada no balcão','Receber o pacote no setor de entregas'],
    shopping_iguatemi:['theater','Sessão de cinema no Iguatemi','Retirar o bilhete na bilheteria','Conferir o painel de salas'],
    plaza_avenida:['mall','Ajudar na praça de alimentação','Separar as bandejas limpas','Levar as bandejas ao balcão'],
    obelisco_espanha:['heritage','Percorrer a Plaza de España','Observar a base do obelisco','Ler o painel da praça'],
    centro_eventos:['theater','Preparar a entrada de um evento','Organizar o balcão de credenciamento','Conferir o painel de recepção'],
    catedral_sao_jose:['heritage','Circuito da Catedral São José','Observar as torres da Catedral','Ler o painel da Praça Dom José Marcondes'],
    calcadao_centro:['mall','Organizar a banca do Calçadão','Abrir a banca de rua','Separar os pedidos no balcão'],
    austa_hospital:['service','Organizar a recepção do hospital','Conferir a entrada de atendimento','Preparar a mesa da recepção'],
    shopping_cidade_norte:['mall','Preparar a abertura do Cidade Norte','Conferir o balcão de informações','Arrumar a entrada da praça de alimentação'],
    corredor_mirassolandia:['walk','Conferir a travessia da Mirassolândia','Verificar a placa de travessia','Revisar a calçada do outro lado do acesso'],
    cachoeira_troca_oleo:['service','Organizar a baia de serviço','Preparar a bancada da revisão','Separar os recipientes de reciclagem'],
    upa_norte:['service','Preparar a recepção da UPA Norte','Organizar as fichas de atendimento','Conferir a entrada da ambulância'],
    cemiterio_sao_joao_batista:['heritage','Conservar a entrada do São João Batista','Consultar o painel histórico','Organizar os vasos do jardim'],
    recinto_exposicoes:['theater','Preparar uma feira no Recinto','Organizar a banca de exposições','Abrir o ponto de credenciamento'],
    posto_prf_br153:['service','Orientação na parada da BR-153','Conferir o painel da rodovia','Preparar o ponto de orientação'],
    base_pmrv_sp310:['service','Orientação na parada da SP-310','Conferir a placa da Washington Luís','Organizar os cones da área de apoio'],
    estacao_schmitt:['heritage','Memória ferroviária de Engenheiro Schmitt','Consultar o painel da estação','Conferir o relógio da plataforma'],
    montanhas_rios_italia:['nature','Trilha do mirante','Conferir o início da trilha','Observar o mirante'],
    praia_cedral:['nature','Cuidar da praia fictícia de Cedral','Conferir o acesso pela areia','Organizar a estação de coleta'],
    estadio_anisio_haddad:['sport','Aquecimento no Anísio Haddad','Posicionar a bola no ponto de treino','Chutar ao gol'],
    estadio_maiao:['sport','Aquecimento no Maião','Posicionar a bola no ponto de treino','Chutar ao gol'],
    estadio_jorjao:['sport','Aquecimento no Jorjão','Posicionar a bola no ponto de treino','Chutar ao gol'],
    termas_ibira:['nature','Circuito do Balneário de Ibirá','Conferir a entrada do balneário','Observar o jardim das termas'],
    thermas_laranjais:['nature','Preparar a área de descanso das Thermas','Verificar o acesso à área de lazer','Organizar os bancos e a sinalização'],
    parque_peao_barretos:['theater','Preparar o acesso à arena de Barretos','Conferir a entrada das arquibancadas','Preparar a iluminação da recepção']
  };
  const rioActivityRuntime={stations:new Map(),lights:new Map(),lampGeometry:null,cue:null,ball:null,shot:null};
  const rioActivityColors={theater:0xba805e,heritage:0xb6a88e,nature:0x587a5b,
    walk:0x528b88,service:0x647e8c,mall:0xaa7251,sport:0x42755b};
  function decorateRioCitySite(p,draw){
    const kind=RIO_CITY_ACTIVITIES[p.key]?.[0];
    if(!kind&&p.shape!=='market')return;
    const front=p.d/2+.93,accent=rioActivityColors[kind]||0x7c3835;
    for(const side of [-1,1]){
      const x=side*Math.min(p.w*.34,5.5);
      if(kind==='nature'||kind==='heritage'||kind==='walk'){
        draw.box(x,.28,front,.87,.56,.79,0xb5a38c);
        draw.part('canopy',x,.75,front,1.06,.69,.92,0x688551);
      }else{
        draw.box(x,1.26,front,.2,2.52,.21,0x5a6267);
        draw.box(x,2.61,front,2.28,.18,1.59,accent);
        draw.box(x,.62,front,1.92,1.24,.41,0xc0aa8b);
      }
    }
    if(p.key==='calcadao_centro'){
      for(let row=0;row<4;row++)for(let col=-5;col<=5;col++){
        const stripe=((col+row+6)%5===0||(col+row+5)%5===0);
        draw.box(col*.87,.119,front+.22+row*.54,.85,.055,.52,stripe?0x667474:0xe8dcca);
      }
    }
    if(kind==='sport'){
      const side=Math.min(5.4,Math.max(p.w*.27,3.1))*p.face;
      for(const x of [-1.12,1.12])draw.box(side+x,.6,p.d/2+7,.085,1.2,.085,0xe7eee7);
      draw.box(side,1.2,p.d/2+7,2.3,.085,.085,0xe7eee7);
    }
    if(p.shape==='market'){
      for(const side of [-1,1])for(let i=0;i<4;i++){
        const x=side*(1.8+i*.43);
        draw.box(x,2.72,front,.45,.14,1.22,i%2?0xffead7:0xaf6749);
        draw.part('canopy',x,1.29,front,.36,.29,.32,i%2?0xd3a040:0x6c9250);
      }
    }
  }
  function addRioCityLights(p,root){
    if(RIO_CITY_ACTIVITIES[p.key]?.[0]!=='theater')return;
    rioActivityRuntime.lampGeometry??=new THREE.SphereGeometry(.22,8,6);
    const lights=new THREE.Group();
    lights.name='RIO_CITY_SHOW_'+p.key;
    const ground=groundHeightAt(p.x,p.z);
    for(const side of [-1,1]){
      const bulb=new THREE.Mesh(rioActivityRuntime.lampGeometry,renderMat(0xffd09b,{emissive:0xff9e54,emissiveIntensity:1.3}));
      bulb.position.set(p.x+side*Math.min(p.w*.34,5.5),ground+2.43,p.z+p.face*(p.d/2+1.24));lights.add(bulb);
    }
    lights.visible=false;root.add(lights);
    rioActivityRuntime.lights.set(p.key,lights);
  }
  function rioActivityProfile(){return state.cityServices;}
  function rioCurrentActivity(){
    const active=rioActivityProfile().rioCityActivity;
    return active&&Object.hasOwn(RIO_CITY_ACTIVITIES,active.key)&&[0,1].includes(active.step)?active:null;
  }
  function registerRioCityActivities(){
    if(rioActivityRuntime.stations.size)return;
    CHARACTER_ACTIVITIES['rio-city-work']=['Executando atividade',.85];
    for(const p of RIO_V51.places){
      const spec=RIO_CITY_ACTIVITIES[p.key];
      if(!spec)continue;
      const separation=Math.min(5.4,Math.max(p.w*.27,3.1));
      const points=[-1,1].map(side=>({x:p.visitX+side*separation,z:p.visitZ}));
      rioActivityRuntime.stations.set(p.key,points);
      for(const [index,point] of points.entries()){
        registerInteractable({id:'rio-work-'+p.key+'-'+index,type:'activity',icon:'●',label:spec[index+2],
          ...point,radius:2,priority:265,
          available:()=>{const a=rioCurrentActivity();return a?.key===p.key&&a.step===index&&!player.vehicle&&!player.boating&&!currentHouse&&!otGames.active&&!activeRace;},
          action:()=>runRioCityStation(p,index)});
      }
    }
  }
  function openRioCitySite(p){
    const spec=RIO_CITY_ACTIVITIES[p.key];
    if(!spec)return false;
    const active=rioCurrentActivity(),current=active?.key===p.key,done=rioActivityProfile().rioCityCompleted?.[p.key];
    const intro=p.fictional?'Área fictícia do jogo.':'Atividade do jogo inspirada neste local.';
    const button=active&&!current?'<button class="btn" data-rio-work-stop>Encerrar atividade atual</button>':
      '<button class="btn primary" data-rio-work-start>'+(current?'Retomar na rua':done?'Repetir atividade':'Começar atividade')+'</button>';
    openModal(p.name,'<h3>'+escapeHtml(spec[1])+'</h3><p>'+intro+'</p><ol><li>'+escapeHtml(spec[2])+
      '</li><li>'+escapeHtml(spec[3])+'</li></ol>'+
      (current?'<p>Próxima ação: '+escapeHtml(spec[active.step+2])+'</p>':'')+
      (active&&!current?'<p>Você já começou uma atividade em outro local.</p>':'')+
      '<div class="modal-actions">'+button+'<button class="btn" data-rio-work-close>Voltar</button></div>',root=>{
        root.querySelector('[data-rio-work-close]').onclick=closeModal;
        const start=root.querySelector('[data-rio-work-start]');
        if(start)start.onclick=()=>{
          const current=rioCurrentActivity();
          if(current&&current.key!==p.key)return;
          if(!current){rioActivityProfile().rioCityActivity={key:p.key,step:0};saveState(true);}
          closeModal();toast('Siga o marcador: '+spec[rioCurrentActivity().step+2]+'.','info',2800);
        };
        const stop=root.querySelector('[data-rio-work-stop]');
        if(stop)stop.onclick=()=>{
          rioActivityProfile().rioCityActivity=null;saveState(true);openRioCitySite(p);
        };
      });
    return true;
  }
  function runRioCityStation(p,index){
    const current=rioCurrentActivity(),point=rioActivityRuntime.stations.get(p.key)?.[index];
    if(current?.key!==p.key||current.step!==index||!point||Math.hypot(player.x-point.x,player.z-point.z)>2.25)return false;
    const spec=RIO_CITY_ACTIVITIES[p.key];
    if(p.key==='dona_capi'&&index===1&&!rioLife.animals.get('capivara-represa')?.root.visible){
      toast('Aguarde a capivara aparecer na margem.','info',1900);
      return false;
    }
    const commit=()=>{
      const active=rioCurrentActivity();
      if(!active||active.key!==p.key||active.step!==index)return false;
      if(index===0){
        rioActivityProfile().rioCityActivity={key:p.key,step:1};
        toast(spec[3],'good',2700);
      }else{
        if(spec[0]==='sport')rioActivityRuntime.shot={x:point.x,z:point.z,face:p.face,at:performance.now()};
        const completed=rioActivityProfile().rioCityCompleted||={};
        if(!completed[p.key]){completed[p.key]=true;addXP(18);}
        if(spec[0]==='theater')beep(698,112,'triangle');
        rioActivityProfile().rioCityActivity=null;
        toast(spec[1]+' · concluído','good',3000);
      }
      saveState(true);
      return true;
    };
    if(spec[0]==='sport'&&index===1){beep(420,70,'triangle');return commit();}
    return beginCharacterActivity('rio-city-work',{target:{x:player.x,z:player.z},
      pose:{x:player.x,y:groundHeightAt(player.x,player.z),z:player.z,yaw:player.facing},commit});
  }
  function updateRioCityActivities(){
    if(!worldGroup||!running)return;
    registerRioCityActivities();
    for(const [key,lights] of rioActivityRuntime.lights)lights.visible=rioActivityProfile().rioCityCompleted?.[key]===true;
    const active=rioCurrentActivity(),point=active&&rioActivityRuntime.stations.get(active.key)?.[active.step];
    const nearby=point&&Math.hypot(player.x-point.x,player.z-point.z)<95;
    if(nearby&&!rioActivityRuntime.cue){
      const cue=new THREE.Mesh(new THREE.RingGeometry(.85,1.05,28),
        new THREE.MeshBasicMaterial({color:0xffda69,side:THREE.DoubleSide}));
      cue.name='RIO_CITY_ACTIVITY';cue.rotation.x=-Math.PI/2;worldGroup.add(cue);
      rioActivityRuntime.cue=cue;
    }
    if(rioActivityRuntime.cue){
      rioActivityRuntime.cue.visible=!!nearby;
      if(nearby)rioActivityRuntime.cue.position.set(point.x,groundHeightAt(point.x,point.z)+.16,point.z);
    }
    const shot=rioActivityRuntime.shot;
    const kickAt=nearby&&active.step===1&&RIO_CITY_ACTIVITIES[active.key][0]==='sport'?point:null;
    if((shot||kickAt)&&!rioActivityRuntime.ball){
      rioActivityRuntime.ball=new THREE.Mesh(new THREE.SphereGeometry(.27,12,9),renderMat(0xf8efde));
      worldGroup.add(rioActivityRuntime.ball);
    }
    if(rioActivityRuntime.ball){
      rioActivityRuntime.ball.visible=!!(shot||kickAt);
      if(kickAt)rioActivityRuntime.ball.position.set(kickAt.x,groundHeightAt(kickAt.x,kickAt.z)+.28,kickAt.z);
      if(shot){
        const t=Math.min(1,(performance.now()-shot.at)/850),z=shot.z+shot.face*t*5;
        rioActivityRuntime.ball.position.set(shot.x,groundHeightAt(shot.x,z)+.27+Math.sin(Math.PI*t)*.55,z);
        rioActivityRuntime.ball.rotation.x+=.10;
        if(t>=1)rioActivityRuntime.shot=null;
      }
    }
  }

/** A voluntary route through the existing civilian adventures, without another economy. */
// @otthi-module-body
 const PLAYER_JOURNEY_ROUTE=Object.freeze([
  {type:'neighbors',purpose:'Conheça os vizinhos e complete um circuito de entregas a pé.'},
  {type:'beach',purpose:'Viaje até a orla e ajude a cuidar da praia.'},
  {type:'snow',purpose:'Encontre os chalés e leve cobertores à comunidade da neve.'},
  {type:'cable',purpose:'Use o teleférico, ajude no mirante e faça a viagem de volta.'},
  {type:'fire',purpose:'Pratique o atendimento com a equipe dos bombeiros.'},
  {type:'police',purpose:'Organize a travessia e acompanhe o morador em segurança.'},
  {type:'balloon',purpose:'Prepare o balão, visite as paisagens e volte para pousar.'}
 ]);
 function playerJourneySnapshot(){
  if(!ensureCivilMissions())return{ready:false};
  const definitions=OTCivilMissionCore.definitions,completed=state.civilWorld.completedTypes||{},current=civilCurrent();
  const rows=PLAYER_JOURNEY_ROUTE.filter(item=>definitions[item.type]).map(item=>{const count=Number(completed[item.type]);return{...item,title:definitions[item.type].title,icon:definitions[item.type].icon,region:definitions[item.type].region,count:Number.isFinite(count)&&count>0?Math.floor(count):0};});
  const done=rows.filter(item=>item.count>0).length,difficulty=done===0?'easy':done<4?'normal':'hard',next=rows.find(item=>!item.count)||rows.reduce((best,item)=>!best||item.count<best.count?item:best,null),p=current&&current.book.progress(current.r.id,current.uid);
  const owned=[...new Set((state.vehicles?.owned||[]).map(String))],stored=owned.filter(id=>state.vehicles?.garage?.stored?.[id]);
  const owner=sharedWorldOwnId(),orders=(state.vehicles?.phoneOrders||[]).filter(order=>order.owner===owner&&order.kind==='parcel'),tracking=phoneDeliveryTracking();
  return{ready:true,profile:String(civilSoloUid()),rows,done,total:rows.length,difficulty,difficultyLabel:OTCivilMissionCore.difficulties[difficulty].label,next:next?{...next,reward:definitions[next.type].reward+(difficulty==='hard'?50:0)}:null,
   current:current?{id:current.r.id,type:current.r.type,status:current.r.status,mode:current.r.mode,title:p?.definition?.title||'',phase:current.r.phase,steps:p?.definition?.steps.length||0,step:p?.step?.title||'',count:p?.count||0,quota:p?.quota||0}:null,
   resources:{owned:owned.length,stored:stored.length,parcelPending:orders.filter(order=>['queued','en-route','ready'].includes(order.status)).length,parcelReady:!!tracking?.ready,familyPark:!!state.familyAdventure?.flags?.park}};
 }
 async function playerJourneyStart(type){
  const snapshot=playerJourneySnapshot();if(!snapshot.ready||!snapshot.rows.some(row=>row.type===type))return false;
  if(snapshot.current&&['active','lobby'].includes(snapshot.current.status)){openCivilMissionDetails();return false;}
  // Difficulty is changed only by this explicit, labelled player action.
  state.civilWorld.difficulty=snapshot.difficulty;
  await civilCreateMission(type,'solo');
  return civilCurrent()?.r.type===type&&civilCurrent()?.r.status==='active';
 }
 function openPlayerJourney(){
  if(!running)return false;const snapshot=playerJourneySnapshot();if(!snapshot.ready){toast('As aventuras estão sendo preparadas. Aguarde um instante.','info',2200);return false;}
  const active=snapshot.current&&['active','lobby'].includes(snapshot.current.status),next=snapshot.next,escape=escapeHtml;
  const current=active?`<section class="player-journey-current"><span class="player-journey-kicker">EM ANDAMENTO</span><h3>${escape(snapshot.current.title)}</h3><p>${escape(snapshot.current.status==='lobby'?'Prepare a dupla no painel da missão.':snapshot.current.step||'Conclua sua etapa para continuar.')}${snapshot.current.quota?' · '+snapshot.current.count+'/'+snapshot.current.quota:''}</p><button class="btn primary" data-journey-continue>CONTINUAR MISSÃO E GPS</button></section>`:'';
  const suggestion=!active&&next?`<section class="player-journey-current"><span class="player-journey-kicker">${snapshot.done===snapshot.total?'PRÓXIMO DESAFIO':'PRÓXIMO PASSO SUGERIDO'}</span><h3>${next.icon} ${escape(next.title)}</h3><p>${escape(next.purpose)}</p><p class="player-journey-reward">${escape(snapshot.difficultyLabel)} · ${next.reward} moedas ao concluir</p><button class="btn primary" data-journey-start="${next.type}">${snapshot.done===snapshot.total?'REPETIR':'COMEÇAR'} EM ${escape(snapshot.difficultyLabel.toUpperCase())}</button></section>`:'';
  const progress=snapshot.total?Math.round(snapshot.done/snapshot.total*100):0;
  openModal('Meu caminho no mundo',`<section class="player-journey"><p>Uma sugestão de percurso para conhecer o mundo. Você pode escolher outra aventura ou continuar explorando quando quiser.</p><div class="player-journey-progress"><b>${snapshot.done}/${snapshot.total} aventuras conhecidas</b><span>${snapshot.done===0?'Comece com uma tarefa curta.':snapshot.done===snapshot.total?'Todas as regiões visitadas em aventuras. Tente os desafios ou uma dupla.':'Seu progresso continua salvo entre as aventuras.'}</span><div class="player-journey-meter" role="progressbar" aria-label="Aventuras conhecidas" aria-valuemin="0" aria-valuemax="${snapshot.total}" aria-valuenow="${snapshot.done}"><i style="width:${progress}%"></i></div></div>${current}${suggestion}<h3>Seu percurso · escolha livre</h3><ol class="player-journey-list">${snapshot.rows.map((row,index)=>`<li class="${row.count?'is-done':''}"><span class="player-journey-number" aria-hidden="true">${row.count?'✓':index+1}</span><div><b>${row.icon} ${escape(row.title)}</b><small>${escape(row.region)}${row.count?' · concluída '+row.count+(row.count===1?' vez':' vezes'):''}</small><p>${escape(row.purpose)}</p><button class="btn compact" data-journey-start="${row.type}" ${active?'disabled':''}>${row.count?'REPETIR':'JOGAR'} · ${escape(snapshot.difficultyLabel.toUpperCase())}</button></div></li>`).join('')}</ol><h3>Prepare seu passeio</h3><div class="player-journey-resources"><button class="choice" data-journey-phone><b>📱 Celular e entregas</b><span>${snapshot.resources.parcelReady?'Encomenda chegou: aproxime-se para receber.':snapshot.resources.parcelPending?snapshot.resources.parcelPending+' encomenda(s) em andamento.':'Chame seu veículo ou compre e receba no mundo.'}</span></button><button class="choice" data-journey-garage><b>🚗 Minha garagem</b><span>${snapshot.resources.owned} veículo(s) próprio(s) · ${snapshot.resources.stored} guardado(s).</span></button><button class="choice" data-journey-family><b>🐾 Família</b><span>${snapshot.resources.familyPark?'Passeio até o parque concluído. Brinque e explore com a família.':'Reúna a família para passear até o parque.'}</span></button></div><div class="player-journey-actions"><button class="btn" data-journey-all>TODAS AS AVENTURAS E DUPLAS</button><button class="btn" data-journey-map>MAPA E GPS</button><button class="btn" data-journey-explore>CONTINUAR EXPLORANDO</button></div></section>`,root=>{
   root.querySelectorAll('[data-journey-start]').forEach(button=>button.onclick=()=>playerJourneyStart(button.dataset.journeyStart));
   root.querySelector('[data-journey-continue]')?.addEventListener('click',openCivilMissionDetails);
   root.querySelector('[data-journey-phone]').onclick=openWorldPhone;root.querySelector('[data-journey-garage]').onclick=openPlayerGarage;root.querySelector('[data-journey-family]').onclick=()=>{closeModal();window.OTTHI_FAMILY.open();};
   root.querySelector('[data-journey-all]').onclick=()=>openCivilMissions();root.querySelector('[data-journey-map]').onclick=()=>{closeModal();openMap();};root.querySelector('[data-journey-explore]').onclick=closeModal;
  });return true;
 }
 const playerJourneyDirectoryBefore=worldExploreDirectoryHtml;
 worldExploreDirectoryHtml=function(...args){const s=playerJourneySnapshot();return`<section class="player-journey-entry"><div><b>Meu caminho no mundo</b><span>${s.ready?s.done+'/'+s.total+' aventuras conhecidas':'Descubra aventuras e atividades no seu ritmo.'}</span></div><button class="btn primary" data-journey-open>VER PRÓXIMO PASSO</button></section>`+playerJourneyDirectoryBefore(...args);};
 const playerJourneyBindBefore=worldExploreBindDirectory;
 worldExploreBindDirectory=function(root,...args){playerJourneyBindBefore(root,...args);root.querySelector('[data-journey-open]')?.addEventListener('click',openPlayerJourney);};
 const playerJourneyHudBefore=updateCivilHUD;
 updateCivilHUD=function(){
  if(!civilMissions.ready)return;const current=civilCurrent();if(current&&['active','lobby'].includes(current.r.status)){playerJourneyHudBefore();return;}
  const snapshot=playerJourneySnapshot(),next=snapshot.next;if(!snapshot.ready||!next){playerJourneyHudBefore();return;}
  const values=[[els.missionChapter,'SEU PRÓXIMO PASSO'],[els.missionTitle,next.icon+' '+next.title],[els.missionStep,(snapshot.done===snapshot.total?'Repita em Desafio ou jogue em dupla.':snapshot.difficultyLabel+' · '+next.reward+' moedas ao concluir.')+' Toque para abrir Meu caminho.']];
  for(const[element,value]of values)if(element.textContent!==value)element.textContent=value;
  const width=Math.round(snapshot.done/Math.max(1,snapshot.total)*100)+'%';if(els.missionFill.style.width!==width)els.missionFill.style.width=width;
  els.missionCard.title='Meu caminho: aventuras, veículos e exploração';const label=els.missionTitle.textContent+'. '+els.missionStep.textContent;if(els.missionCard.getAttribute('aria-label')!==label)els.missionCard.setAttribute('aria-label',label);
 };
 updateMissionHUD=updateCivilHUD;
 openObjectivesPanel=function(){const c=civilCurrent();return c&&['active','lobby'].includes(c.r.status)?openCivilMissionDetails():openPlayerJourney();};
 window.OT_PLAYER_JOURNEY={open:openPlayerJourney,diagnostics:playerJourneySnapshot};

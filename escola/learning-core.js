/* OTTHI Educação — motor de demonstração local, SEM autenticação, SEM Firebase.
   Não usar com dados reais de estudantes. A segurança comercial exige backend. */
(function(root){
  'use strict';
  const STORAGE_KEY='thiaguinho:school-demo:v1';
  const GAMES=Object.freeze([
    {id:'otthi',name:'OTTHI World',url:'../games/otthi/'},
    {id:'kart',name:'Kart Legends',url:'../games/kart/'},
    {id:'tenis',name:'Ping Pong Wii',url:'../games/tenis/'},
    {id:'boxe',name:'Boxing Pro',url:'../games/boxe/'},
    {id:'ar',name:'WWAR Combatee',url:'../games/ar/'},
    {id:'voo',name:'Aero Strike WAR',url:'../games/voo/'},
    {id:'familia',name:'Aventuras em Família',url:'../games/familia/3d/'},
    {id:'danca',name:'Dança',url:'../games/danca/'}
  ]);
  const REWARDS=Object.freeze([
    {id:'badge',name:'Medalha do conhecimento',cost:15,icon:'🏅'},
    {id:'cap',name:'Boné da aventura',cost:25,icon:'🧢'},
    {id:'garden',name:'Jardim da minha casa',cost:40,icon:'🌳'},
    {id:'paint',name:'Pintura especial do kart',cost:60,icon:'🏎️'}
  ]);
  const DEFAULT_STUDENT='aluno-demo';
  function trimmed(x,n){return String(x===undefined||x===null?'':x).trim().slice(0,n);}
  function now(){return new Date().toISOString();}
  function uid(prefix){return prefix+'-'+(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():(Date.now()+'-'+Math.random().toString(36).slice(2)));}
  function seed(){
    const base=[
      ['otthi','Matemática no mercadinho','Um brinquedo custa 12 moedas e uma fruta custa 8. Qual é o total?',['14','20','24','28'],1],
      ['kart','Distância do campeonato','Uma pista possui 400 metros. Quantos metros são 3 voltas?',['800','1000','1200','1600'],2],
      ['tenis','Contagem de pontos','Se você tem 7 pontos e conquista mais 4, com quantos fica?',['10','11','12','13'],1],
      ['boxe','Respeito no esporte','Qual atitude demonstra respeito numa competição?',['Provocar o colega','Cumprimentar o adversário','Ignorar as regras','Empurrar'],1],
      ['ar','Segurança em equipe','Numa situação de perigo, qual deve ser a primeira atitude de uma criança?',['Buscar um adulto responsável','Ir sozinha investigar','Compartilhar dados pessoais','Agir sem ajuda'],0],
      ['voo','Geografia da viagem','Qual destes meios é usado para viajar pelo ar?',['Trem','Navio','Avião','Bicicleta'],2],
      ['familia','Colaboração familiar','Qual ação ajuda numa atividade em equipe?',['Escutar e dividir tarefas','Esconder as ferramentas','Interromper todos','Desistir sem tentar'],0],
      ['danca','Sequência e ritmo','A sequência é palma, passo, palma, passo. O que vem depois?',['Salto','Palma','Pausa','Giro'],1]
    ];
    return {schema:1,activities:base.map((x,i)=>({id:'demo-'+(i+1),game:x[0],title:x[1],question:x[2],options:x[3],correct:x[4],kind:'quiz',points:10,createdAt:now(),sample:true})),submissions:[],ledger:[],redeemed:[]};
  }
  function validData(value){
    return !!value&&value.schema===1&&Array.isArray(value.activities)&&Array.isArray(value.submissions)&&Array.isArray(value.ledger)&&Array.isArray(value.redeemed);
  }
  function copy(data){if(!validData(data))throw new Error('Dados de demonstração inválidos');return JSON.parse(JSON.stringify(data));}
  function makeActivity(data,fields){
    const next=copy(data),game=trimmed(fields.game,20),title=trimmed(fields.title,90),question=trimmed(fields.question,350),kind=fields.kind==='open'?'open':'quiz';
    if(!GAMES.some(item=>item.id===game))throw new Error('Escolha um jogo válido.');
    if(title.length<5||question.length<10)throw new Error('Informe título e desafio com detalhes suficientes.');
    let options=[],correct=-1;
    if(kind==='quiz'){
      options=Array.isArray(fields.options)?fields.options.map(x=>trimmed(x,100)):[];
      if(options.length!==4||options.some(x=>x.length<1))throw new Error('Preencha quatro alternativas.');
      correct=Number(fields.correct);
      if(!Number.isInteger(correct)||correct<0||correct>3)throw new Error('Selecione a resposta correta.');
    }
    const points=Math.max(1,Math.min(50,Math.round(Number(fields.points)||10)));
    const activity={id:uid('atividade'),game,title,question,kind,options,correct,points,createdAt:now(),sample:false};
    next.activities.unshift(activity);
    return {data:next,activity};
  }
  function score(data,studentId=DEFAULT_STUDENT){return data.ledger.filter(e=>e.studentId===studentId).reduce((sum,e)=>sum+e.delta,0);}
  function award(data,submission){if(data.ledger.some(e=>e.submissionId===submission.id))return;data.ledger.push({id:uid('pontos'),submissionId:submission.id,studentId:submission.studentId,delta:submission.points,reason:'atividade-validada',at:now()});}
  function submit(data,fields){
    const next=copy(data),studentId=trimmed(fields.studentId||DEFAULT_STUDENT,40),activity=next.activities.find(a=>a.id===fields.activityId);
    if(!activity)throw new Error('Atividade não encontrada.');
    if(!studentId||studentId!==DEFAULT_STUDENT)throw new Error('Demonstração disponível somente para perfil local fictício.');
    const same=next.submissions.filter(s=>s.activityId===activity.id&&s.studentId===studentId);
    if(same.some(s=>s.status==='approved'||s.status==='pending'))throw new Error('Esta atividade já foi enviada.');
    if(same.length>=3)throw new Error('Limite de três tentativas da demonstração.');
    const answer=activity.kind==='quiz'?Number(fields.answer):trimmed(fields.answer,700);
    if(activity.kind==='quiz'&&(!Number.isInteger(answer)||answer<0||answer>3))throw new Error('Escolha uma alternativa.');
    if(activity.kind==='open'&&String(answer).length<10)throw new Error('Escreva sua resposta antes de enviar.');
    const correct=activity.kind==='quiz'&&answer===activity.correct;
    const submission={id:uid('resposta'),studentId,activityId:activity.id,answer,points:activity.points,status:activity.kind==='open'?'pending':correct?'approved':'incorrect',attempt: same.length+1,submittedAt:now(),reviewedAt:null};
    next.submissions.push(submission);
    if(submission.status==='approved')award(next,submission);
    return {data:next,submission};
  }
  function review(data,submissionId,approved){
    const next=copy(data),submission=next.submissions.find(s=>s.id===submissionId),activity=submission&&next.activities.find(a=>a.id===submission.activityId);
    if(!submission||submission.status!=='pending'||activity?.kind!=='open')throw new Error('Resposta não está pendente de correção.');
    submission.status=approved?'approved':'rejected';submission.reviewedAt=now();
    if(approved)award(next,submission);
    return {data:next,submission};
  }
  function redeem(data,itemId,studentId=DEFAULT_STUDENT){
    const next=copy(data),item=REWARDS.find(r=>r.id===itemId);
    if(!item)throw new Error('Recompensa inválida.');
    if(studentId!==DEFAULT_STUDENT)throw new Error('Somente perfil fictício nesta demonstração.');
    if(next.redeemed.some(r=>r.itemId===itemId&&r.studentId===studentId))throw new Error('Recompensa já resgatada.');
    if(score(next,studentId)<item.cost)throw new Error('Pontos insuficientes.');
    const grant={id:uid('resgate'),studentId,itemId,at:now()};
    next.redeemed.push(grant);next.ledger.push({id:uid('pontos'),studentId,delta:-item.cost,reason:'recompensa-resgatada',rewardId:itemId,at:now()});
    return {data:next,grant};
  }
  const api=Object.freeze({STORAGE_KEY,GAMES,REWARDS,DEFAULT_STUDENT,seed,validData,copy,makeActivity,submit,review,redeem,score});
  root.TEduCore=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

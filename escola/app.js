/* OTTHI Educação: demonstração local e fictícia, sem Firebase. */
(()=>{
  'use strict';
  const core=window.TEduCore,app=document.getElementById('app'),feedback=document.getElementById('feedback');
  const KEY=core.STORAGE_KEY;
  let role='student',data;
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function load(){try{const parsed=JSON.parse(localStorage.getItem(KEY));if(core.validData(parsed))return parsed;}catch(e){}return core.seed();}
  function store(value){localStorage.setItem(KEY,JSON.stringify(value));data=value;}
  function info(message,error=false){feedback.textContent=message;feedback.classList.toggle('error',!!error);}
  function money(n){return Number(n).toLocaleString('pt-BR');}
  function game(id){return core.GAMES.find(g=>g.id===id)||core.GAMES[0];}
  function getAttempts(activityId){return data.submissions.filter(s=>s.activityId===activityId&&s.studentId===core.DEFAULT_STUDENT);}
  function resultState(task){const subs=getAttempts(task.id),last=subs.at(-1);return {last,tries:subs.length,done:subs.some(s=>s.status==='approved'||s.status==='pending'),blocked:subs.length>=3};}
  function studentCard(task){
    const g=game(task.game),res=resultState(task);
    let controls='';
    if(res.last?.status==='approved')controls='<p class="status done">✓ Atividade validada — '+task.points+' PA recebidos</p>';
    else if(res.last?.status==='pending')controls='<p class="status">Resposta aguardando revisão do professor.</p>';
    else if(res.blocked)controls='<p class="status fail">Três tentativas utilizadas. Reinicie a demonstração para tentar outra vez.</p>';
    else{
      controls='<form data-submit="'+esc(task.id)+'">';
      if(task.kind==='quiz')controls+='<fieldset class="answers"><legend class="muted" style="margin-bottom:8px">Escolha uma resposta</legend>'+task.options.map((option,i)=>'<label class="option"><input type="radio" name="answer" value="'+i+'" required><span>'+esc(option)+'</span></label>').join('')+'</fieldset>';
      else controls+='<label class="field"><span>Minha resposta</span><textarea name="answer" required minlength="10" maxlength="700" placeholder="Conte com suas palavras como resolveria esse desafio."></textarea></label>';
      if(res.last?.status==='incorrect')controls+='<p class="status fail">Não foi dessa vez. Você ainda pode tentar novamente ('+(3-res.tries)+' tentativas restantes).</p>';
      controls+='<div class="buttonrow"><button class="primary" type="submit">Responder atividade</button></div></form>';
    }
    return '<article class="card"><div class="card-top"><span class="tag">'+esc(g.name)+'</span><span class="points">+'+task.points+' PA</span></div><h3>'+esc(task.title)+'</h3><p>'+esc(task.question)+'</p>'+controls+'<div class="buttonrow"><a class="secondary" href="'+esc(g.url)+'" title="Abrir o jogo original '+esc(g.name)+'">Abrir jogo original</a></div><p class="muted">A recompensa é pela resposta validada, não por abrir o jogo. A atividade ainda não altera a economia do jogo original.</p></article>';
  }
  function student(){
    const completed=data.submissions.filter(s=>s.studentId===core.DEFAULT_STUDENT&&s.status==='approved').length;
    const pending=data.submissions.filter(s=>s.studentId===core.DEFAULT_STUDENT&&s.status==='pending').length;
    const total=data.activities.length;
    app.innerHTML='<section class="section"><div class="summary"><div class="stat"><strong>'+money(core.score(data))+'</strong><span>Pontos de Aprendizagem</span></div><div class="stat"><strong>'+completed+'/'+total+'</strong><span>Atividades validadas</span></div><div class="stat"><strong>'+pending+'</strong><span>Em revisão</span></div></div><h2>Minha jornada de aprendizagem</h2><p class="section-intro">Escolha um desafio. Você pode explorar os jogos originais, mas apenas a atividade corrigida concede pontos nesta demonstração.</p><div class="cards">'+data.activities.map(studentCard).join('')+'</div></section>'+
    '<section class="section"><h2>Recompensas educacionais</h2><p class="section-intro">Exemplos de itens cosméticos, apenas registrados nesta demonstração local. Ainda não alteram personagens, casas ou veículos do jogo.</p><div class="rewards">'+core.REWARDS.map(item=>{
      const owned=data.redeemed.some(r=>r.itemId===item.id&&r.studentId===core.DEFAULT_STUDENT);
      return '<article class="reward"><span class="reward-icon" aria-hidden="true">'+item.icon+'</span><h3>'+esc(item.name)+'</h3><span class="muted">'+item.cost+' PA</span><button type="button" class="'+(owned?'secondary':'primary')+'" data-redeem="'+item.id+'" '+(owned?'disabled':'')+'>'+(owned?'Resgatada':'Resgatar')+'</button></article>';
    }).join('')+'</div></section>';
  }
  function teacher(){
    const pending=data.submissions.filter(s=>s.status==='pending'),reviewed=data.submissions.filter(s=>s.status==='approved'||s.status==='rejected').length;
    app.innerHTML='<div class="summary"><div class="stat"><strong>'+data.activities.length+'</strong><span>Desafios disponíveis</span></div><div class="stat"><strong>'+pending.length+'</strong><span>Respostas aguardando revisão</span></div><div class="stat"><strong>'+reviewed+'</strong><span>Respostas validadas ou revisadas</span></div></div>'+
    '<div class="teacher-layout"><section class="panel"><h2>Criar atividade fictícia</h2><p class="section-intro">Experimente planejar uma atividade contextualizada em um dos oito jogos. Para uso real, será necessário cadastro seguro de professores e turmas.</p><form id="new-activity" class="form-grid">'+
    '<div class="field"><label for="game">Jogo</label><select id="game" name="game" required>'+core.GAMES.map(g=>'<option value="'+g.id+'">'+esc(g.name)+'</option>').join('')+'</select></div>'+
    '<div class="field"><label for="kind">Tipo</label><select id="kind" name="kind"><option value="quiz">Múltipla escolha (automática)</option><option value="open">Resposta aberta (revisão)</option></select></div>'+
    '<div class="field wide"><label for="title">Título</label><input id="title" name="title" minlength="5" maxlength="90" required placeholder="Ex.: Matemática no mercadinho"></div>'+
    '<div class="field wide"><label for="question">Enunciado</label><textarea id="question" name="question" minlength="10" maxlength="350" required placeholder="Descreva o desafio e o contexto no jogo."></textarea></div>'+
    '<div id="option-fields" class="field wide"><label>Quatro alternativas e a opção correta</label><div class="form-grid">'+[0,1,2,3].map(i=>'<div class="field"><label for="option'+i+'">Alternativa '+(i+1)+'</label><input id="option'+i+'" name="option'+i+'" maxlength="100" placeholder="Resposta '+(i+1)+'"></div>').join('')+'</div><div class="field" style="margin-top:10px"><label for="correct">Resposta correta</label><select id="correct" name="correct">'+[0,1,2,3].map(i=>'<option value="'+i+'">Alternativa '+(i+1)+'</option>').join('')+'</select></div></div>'+
    '<div class="field"><label for="points">PA pela resposta validada (1 a 50)</label><input type="number" id="points" name="points" min="1" max="50" value="10"></div>'+
    '<div class="field wide"><button class="primary" type="submit">Publicar somente na demonstração</button></div></form></section>'+
    '<section class="panel"><h2>Fila de correção</h2><p class="section-intro">Respostas abertas não concedem pontos antes da aprovação.</p><div class="submissions">'+(pending.length?pending.map(s=>{
      const activity=data.activities.find(a=>a.id===s.activityId);
      return '<div class="submission"><strong>'+esc(activity?.title||'Atividade')+'</strong><p>'+esc(s.answer)+'</p><span class="muted">Perfil fictício · tentativa '+s.attempt+'</span><div class="teacher-actions"><button class="primary" data-review="'+esc(s.id)+'" data-approved="yes" type="button">Validar resposta</button><button class="secondary" data-review="'+esc(s.id)+'" data-approved="no" type="button">Não aprovar</button></div></div>';
    }).join(''):'<div class="empty">Nenhuma resposta aberta pendente nesta demonstração.</div>')+'</div></section></div>';
    const kind=document.getElementById('kind'),opt=document.getElementById('option-fields');
    kind.addEventListener('change',()=>{opt.hidden=kind.value==='open';});
  }
  function render(){
    document.getElementById('student-tab').setAttribute('aria-pressed',String(role==='student'));
    document.getElementById('teacher-tab').setAttribute('aria-pressed',String(role==='teacher'));
    if(role==='teacher')teacher();else student();
  }
  document.querySelector('.toolbar').addEventListener('click',event=>{
    const roleButton=event.target.closest('[data-role]');
    if(roleButton){role=roleButton.dataset.role;info('');render();}
  });
  app.addEventListener('submit',event=>{
    const form=event.target;if(!(form instanceof HTMLFormElement))return;
    event.preventDefault();
    try{
      if(form.id==='new-activity'){
        const fields=new FormData(form);
        const made=core.makeActivity(data,{game:fields.get('game'),title:fields.get('title'),question:fields.get('question'),kind:fields.get('kind'),points:fields.get('points'),options:[0,1,2,3].map(i=>fields.get('option'+i)),correct:fields.get('correct')});
        store(made.data);info('Atividade criada na demonstração; aluno pode responder.');render();return;
      }
      if(form.dataset.submit){
        const fields=new FormData(form),submission=core.submit(data,{activityId:form.dataset.submit,answer:fields.get('answer')});
        store(submission.data);
        info(submission.submission.status==='approved'?'Resposta correta! Pontos de Aprendizagem concedidos.':submission.submission.status==='pending'?'Resposta enviada para revisão fictícia do professor.':'Resposta incorreta. Consulte o enunciado e tente novamente.');
        render();
      }
    }catch(error){info(error.message||'Não foi possível registrar a atividade.',true);}
  });
  app.addEventListener('click',event=>{
    const review=event.target.closest('[data-review]'),reward=event.target.closest('[data-redeem]');
    try{
      if(review){const result=core.review(data,review.dataset.review,review.dataset.approved==='yes');store(result.data);info('Revisão registrada na demonstração.');render();}
      else if(reward){const result=core.redeem(data,reward.dataset.redeem);store(result.data);info('Recompensa cosmética registrada na demonstração.');render();}
    }catch(error){info(error.message||'Não foi possível completar essa ação.',true);}
  });
  document.getElementById('reset-demo').addEventListener('click',()=>{
    if(!window.confirm('Reiniciar somente as atividades e pontos desta demonstração? Os jogos e as contas reais NÃO serão alterados.'))return;
    store(core.seed());info('Demonstração reiniciada sem alterar jogos ou contas.');render();
  });
  data=load();render();
})();

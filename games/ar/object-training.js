/* Object registration and a playable range. All camera work stays on-device. */
(()=>{'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
class ObjectTools{
 constructor(session){
  this.s=session;
  const root=this.root=document.createElement('div');root.className='war-object-tools';root.hidden=session.source!=='object';
  root.innerHTML='<p data-object-step role="status">1 · Selecione somente os detalhes do brinquedo. Capture e marque a ponta e o apoio.</p><div class="war-object-buttons"><button type="button" data-object="axis" disabled>MARCAR PONTA E APOIO</button><button type="button" data-object="five" disabled>AJUSTAR MIRA EM 5 PONTOS</button></div><label>Resposta da mira <input data-object="gain" type="range" min="0.5" max="1.8" step="0.05" value="1" aria-label="Sensibilidade do brinquedo"><output>1,00×</output></label><div class="war-object-wizard" hidden><div class="war-object-target" aria-hidden="true">＋</div><p role="status" data-object-direction></p><progress max="1" value="0" aria-label="Estabilidade da mira"></progress><button type="button" data-object="cancel">CANCELAR AJUSTE</button></div>';
  session.root.querySelector('.war-hand-actions').before(root);this.status=root.querySelector('[data-object-step]');this.wizardUI=root.querySelector('.war-object-wizard');
  const button=(id,fn)=>root.querySelector('[data-object="'+id+'"]').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn();});
  button('axis',()=>this.markAxis());button('five',()=>this.begin());button('cancel',()=>this.cancel());
  const gain=root.querySelector('[data-object="gain"]');gain.oninput=()=>{session.controller.objectGain=Number(gain.value);root.querySelector('output').textContent=Number(gain.value).toFixed(2).replace('.',',')+'×';};
  session.canvas.addEventListener('pointerdown',e=>{
   if(!this.frozen)return;e.preventDefault();e.stopImmediatePropagation();
   const r=session.canvas.getBoundingClientRect(),p={x:clamp(1-(e.clientX-r.left)/r.width,0,1)*320,y:clamp((e.clientY-r.top)/r.height,0,1)*240},roi=session.roi;
   if(p.x<roi.x*320||p.x>(roi.x+roi.w)*320||p.y<roi.y*240||p.y>(roi.y+roi.h)*240){this.status.textContent='Toque em uma parte do brinquedo dentro da caixa.';return;}
   if(!this.tip){this.tip=p;this.status.textContent='3 · Agora toque no apoio / parte traseira do brinquedo.';return;}
   if(Math.hypot(p.x-this.tip.x,p.y-this.tip.y)<12){this.status.textContent='Escolha um apoio mais distante da ponta.';return;}
   session.worker.postMessage({type:'axis',axis:{tip:this.tip,base:p}});this.frozen=false;session.controller.objectMapping=null;session.controller.reset();this.status.textContent='✓ Ponta e apoio marcados. Segure na posição central até calibrar corpo e objeto.';
  },true);
  this.sync();
 }
 sync(){const s=this.s,object=s.source==='object';if(object){s.root.querySelector('h2').textContent='CADASTRE SEU BRINQUEDO';s.root.querySelector('.war-hand-instruction').textContent='Mostre os ombros e segure o brinquedo na posição de mira. Selecione detalhes do próprio objeto, capture e marque sua ponta e apoio.';}else{s.root.querySelector('h2').textContent='CALIBRE CORPO E MÃO';s.root.querySelector('.war-hand-instruction').textContent='Mostre os ombros e a mão direita aberta na altura do peito. Segure para calibrar. Aponte para mirar e agache para se proteger.';}if(s.game.training)s.root.querySelector('small').textContent='Treino sem dano e sem limite de tempo. A câmera some após calibrar. No campo, use AJUSTAR MIRA para aprender seus cinco pontos. O avanço só começa se você pedir para testá-lo.';this.root.hidden=!object;s.root.querySelector('[data-hand="capture"]').hidden=!object;s.root.querySelector('[data-hand-object-options]').hidden=!object;for(const mode of['hand','object'])s.root.querySelector('[data-hand="source-'+mode+'"]').setAttribute('aria-pressed',String(mode===s.source));}
 sourceChanged(){this.cancel(false);this.frozen=false;this.still=null;this.template=null;this.s.controller.objectMapping=null;this.sync();}
 captured(frame){this.still=document.createElement('canvas');this.still.width=320;this.still.height=240;this.still.getContext('2d').putImageData(frame,0,0);}
 remember(template){
  this.template=template;this.s.lastTemplate=template;
  for(const id of['axis','five'])this.root.querySelector('[data-object="'+id+'"]').disabled=false;
  this.persist();
 }
 persist(){
  const s=this.s;if(!this.template||!s.root.querySelector('[data-hand-remember]').checked)return;
  try{const template={...this.template};if(window.WarObjectAim.valid(s.controller.objectMapping))template.aimCalibration=s.controller.objectMapping;localStorage.setItem('ot_war_toy_template_v1',JSON.stringify(template));s.savedToy=true;s.root.querySelector('[data-hand="reuse"]').hidden=false;}catch{this.status.textContent='Não foi possível lembrar o brinquedo neste aparelho.';}
 }
 load(template){this.template=template;this.s.lastTemplate=template;this.s.controller.objectMapping=window.WarObjectAim.valid(template.aimCalibration)?template.aimCalibration:null;for(const id of['axis','five'])this.root.querySelector('[data-object="'+id+'"]').disabled=false;}
 markAxis(){
  const s=this.s;if(!this.still){this.status.textContent='Capture uma imagem nova para marcar a ponta.';return;}
  this.cancel(false);this.tip=null;this.frozen=true;s.release();s.game.state='HAND_CALIBRATION';s.root.classList.add('calibrating');s.root.setAttribute('role','dialog');s.root.setAttribute('aria-modal','true');this.status.textContent='2 · Imagem congelada: toque na PONTA do brinquedo.';s.canvas.scrollIntoView({block:'center',behavior:'instant'});
 }
 begin(){
  const s=this.s;if(!s.lastObject?.object||!s.controller.neutral){this.status.textContent='Primeiro capture o brinquedo e mantenha-o visível para calibrar o centro.';return;}
  this.frozen=false;this.calibration=new window.WarObjectAim.Calibration();this.previousMap=s.controller.objectMapping;this.previousNeutral={...s.controller.neutral};this.previousAim={x:s.controller.aim.x,y:s.controller.aim.y};this.returning=null;this.wizardUI.hidden=false;s.release();s.game.state='HAND_CALIBRATION';s.root.classList.add('calibrating');s.root.setAttribute('role','dialog');s.root.setAttribute('aria-modal','true');this.updateWizard();
 }
 get blocking(){return this.frozen||!!this.calibration;}
 updateWizard(){
  const target=this.returning?{name:'CENTRO',x:.5,y:.48}:this.calibration?.target;if(!target)return;
  const dot=this.root.querySelector('.war-object-target');dot.style.left=target.x*100+'%';dot.style.top=target.y*100+'%';
  const i=this.calibration.points.length;this.root.querySelector('[data-object-direction]').textContent=(this.lost?'Objeto fora de vista. Mostre os mesmos detalhes à câmera.':this.calibration.error)|| (this.returning?'✓ Ajuste concluído. Volte ao CENTRO e segure para entrar.':(i+1)+'/5 · Aponte para '+target.name+' e segure. A captura é automática.');
  this.root.querySelector('progress').value=this.returning?.progress||this.calibration.progress;
 }
 object(object,at){
  if(!this.calibration)return;this.lost=!object;
  if(this.returning){
   const r=this.returning,near=object&&Math.hypot(object.x-r.center.x,object.y-r.center.y)<.018;
   if(!near){r.since=0;r.progress=0;}else{if(!r.since)r.since=at;r.progress=Math.min(1,(at-r.since)/400);if(r.progress===1){this.calibration=null;this.wizardUI.hidden=true;this.status.textContent='✓ Cinco pontos ajustados. Teste os alvos e a perda do objeto no treino.';this.persist();return;}}
  }else{
   const result=this.calibration.consume(object,at);if(result){const c=this.s.controller;c.objectMapping=result.map;Object.assign(c.neutral,result.center);c.calibration++;this.s.game.handViewAnchor=null;this.returning={center:result.center,since:0,progress:0};}
  }
  this.updateWizard();
 }
 cancel(resume=true){
  if(this.calibration){const c=this.s.controller;c.objectMapping=this.previousMap;if(c.neutral&&this.previousNeutral)Object.assign(c.neutral,this.previousNeutral);if(this.previousAim)Object.assign(c.aim,this.previousAim);c.calibration++;this.s.game.handViewAnchor=null;}
  this.calibration=null;this.returning=null;this.wizardUI.hidden=true;if(resume)this.s.finishCalibration();
 }
 draw(ctx){
  if(this.frozen&&this.still){ctx.drawImage(this.still,0,0);const r=this.s.roi;ctx.strokeStyle='#ffd887';ctx.lineWidth=2;ctx.strokeRect(r.x*320,r.y*240,r.w*320,r.h*240);if(this.tip){ctx.fillStyle='#70efc6';ctx.beginPath();ctx.arc(this.tip.x,this.tip.y,5,0,Math.PI*2);ctx.fill();}return;}
  const object=this.s.lastObject?.object;if(!object||!this.s.game.handAim?.fresh)return;
  ctx.strokeStyle='#75eacb';ctx.lineWidth=2;ctx.beginPath();object.corners?.forEach((p,i)=>i?ctx.lineTo(p.x*320,p.y*240):ctx.moveTo(p.x*320,p.y*240));ctx.closePath();ctx.stroke();
  if(object.axis){ctx.beginPath();ctx.moveTo(object.base.x*320,object.base.y*240);ctx.lineTo(object.tip.x*320,object.tip.y*240);ctx.stroke();ctx.fillStyle='#ffdc89';ctx.beginPath();ctx.arc(object.tip.x*320,object.tip.y*240,4,0,Math.PI*2);ctx.fill();}
 }
}
window.WarObjectTraining={attach:s=>new ObjectTools(s)};
window.WarPracticeUI={start(game){
 if(!game.training)return null;
 const root=document.createElement('section');root.className='war-practice';root.setAttribute('aria-label','Treino de mira');root.innerHTML='<div><strong>TREINO DE MIRA</strong><output role="status" aria-live="off"></output></div><div class="war-practice-actions"><button data-practice="calibrate">AJUSTAR MIRA</button><button data-practice="restart">RECOMEÇAR</button><button data-practice="walk" aria-pressed="false">TESTAR AVANÇO</button></div>';
 document.body.append(root);
 root.querySelector('[data-practice="calibrate"]').onclick=()=>{const s=game.handSession;if(!s){window.System?.msg('ESCOLHA CÂMERA AO ABRIR O TREINO');return;}if(s.source==='object'&&s.controller.state==='ready')s.objectTools?.begin();else s.recalibrate();};
 root.querySelector('[data-practice="restart"]').onclick=()=>{game.resetTraining();};
 root.querySelector('[data-practice="walk"]').onclick=e=>{game.practiceMovement=!game.practiceMovement;if(game.handSession)game.handSession.autoAdvance=game.practiceMovement;e.currentTarget.setAttribute('aria-pressed',String(game.practiceMovement));e.currentTarget.textContent=game.practiceMovement?'PARAR AVANÇO':'TESTAR AVANÇO';};
 const timer=setInterval(()=>{root.hidden=game.state!=='PLAYING'||!!window.System?.paused;const s=game.handSession,o=s?.lastObject,ready=game.handAim?.fresh&&game.bodyPose?.fresh;root.querySelector('output').textContent=game.trainingTargets+' alvos · '+game.stats.hits+'/'+game.stats.shots+' acertos'+(s?' · '+(ready?(s.source==='object'?'Objeto '+Math.round((o?.object?.confidence||0)*100)+'% · '+(o?.matches||0)+' pontos · '+Math.round(s.lastInferenceMs||0)+'ms':'Corpo + mão OK'):game.bodyPose?.fresh?'Objeto/mão fora de vista · pausado':'Mostre os ombros · pausado'):' · Controles');},200);
 return{dispose(){clearInterval(timer);root.remove();}};
}};
})();

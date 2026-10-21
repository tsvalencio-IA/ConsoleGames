/* Player preferences. Local per game; never writes accounts, rewards or rooms. */
(()=>{
 'use strict';
 const id=window.CONSOLE_GAME_ID;
 if(!id)return;
 const key='thia:play-settings:v1:'+id;
 const defaults={camera:'chase',distance:'far',difficulty:'normal',sensitivity:1,smoothing:.62,autoAccelerate:false,assist:true,controlSize:1,controlOpacity:.92,controlInset:8,effectsVolume:.7,engineVolume:.6,alertVolume:.7,quality:'auto'};
 let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
 const values={...defaults};
 const ranges={sensitivity:[.5,1.5],smoothing:[.35,.9],controlSize:[.9,1.15],controlOpacity:[.45,1],controlInset:[0,28],effectsVolume:[0,1],engineVolume:[0,1],alertVolume:[0,1]};
 function set(name,value){
  if(!(name in defaults))return;
  if(name in ranges){const n=Number(value);if(!Number.isFinite(n))return;value=Math.max(ranges[name][0],Math.min(ranges[name][1],n))}
  else if(typeof defaults[name]==='boolean')value=value===true||value==='true';
  else{const allowed={camera:['chase','cockpit'],distance:['near','medium','far'],difficulty:['easy','normal','hard'],quality:['auto','low','high']}[name];if(!allowed?.includes(value))return}
  values[name]=value;
 }
 Object.entries(saved).forEach(([k,v])=>set(k,v));
 let dialog=null,previousFocus=null,wasPaused=false;
 function apply(){
  const root=document.documentElement;
  root.style.setProperty('--play-control-size',values.controlSize);
  root.style.setProperty('--play-control-opacity',values.controlOpacity);
  root.style.setProperty('--play-control-inset',values.controlInset+'px');
  root.dataset.playQuality=values.quality;
  try{localStorage.setItem(key,JSON.stringify(values))}catch{}
  window.dispatchEvent(new CustomEvent('arcade:play-settings',{detail:{...values}}));
 }
 const select=(name,title,options)=>'<label class="play-option"><span>'+title+'</span><select data-setting="'+name+'">'+options.map(([v,t])=>'<option value="'+v+'"'+(values[name]===v?' selected':'')+'>'+t+'</option>').join('')+'</select></label>';
 const range=(name,title,min,max,step)=>'<label class="play-option"><span>'+title+' <output>'+values[name]+'</output></span><input data-setting="'+name+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+values[name]+'"></label>';
 const toggle=(name,title)=>'<label class="play-option play-check"><span>'+title+'</span><input data-setting="'+name+'" type="checkbox"'+(values[name]?' checked':'')+'></label>';
 function close(){if(!dialog)return;dialog.remove();dialog=null;if(window.System){window.System.paused=wasPaused;const g=window.System.activeGame?.logic;if(g){if('lastTime'in g)g.lastTime=performance.now();if('lastFrameTime'in g)g.lastFrameTime=performance.now()}}previousFocus?.isConnected&&previousFocus.focus({preventScroll:true})}
 function open(){
  if(dialog)return;
  previousFocus=document.activeElement;wasPaused=!!window.System?.paused;
  const online=!!(window.System?.activeGame?.logic?.isOnline||['PVP','COOP'].includes(window.System?.activeGame?.logic?.mode));
  if(window.System&&!online)window.System.paused=true;
  dialog=document.createElement('section');dialog.id='play-settings';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','play-settings-title');
  let content='';
  if(['drive','usarmy_flight_sim'].includes(id)){
   content+='<h3>Câmera</h3>';
   if(id==='usarmy_flight_sim')content+=select('camera','Visão',[['chase','Terceira pessoa'],['cockpit','Cabine']]);
   content+=select('distance','Distância',[['near','Próxima'],['medium','Média'],['far','Distante']]);
  }
  if(['drive','tennis','box_pro'].includes(id))content+=select('difficulty','Dificuldade solo',[['easy','Treino'],['normal','Normal'],['hard','Desafio']]);
  content+=range('sensitivity','Sensibilidade',.5,1.5,.05);
  if(id==='tennis')content+=range('smoothing','Suavização da raquete',.35,.9,.05);
  if(id==='drive')content+=toggle('autoAccelerate','Aceleração automática');
  if(id==='usarmy_flight_sim')content+=toggle('assist','Estabilizar ao soltar os comandos');
  content+='<h3>Controles na tela</h3>'+range('controlSize','Tamanho',.9,1.15,.05)+range('controlOpacity','Opacidade',.45,1,.05)+range('controlInset','Afastamento da borda',0,28,2);
  content+='<h3>Som e imagem</h3>'+range('effectsVolume','Efeitos',0,1,.05)+range('engineVolume','Motor',0,1,.05)+range('alertVolume','Alertas',0,1,.05)+select('quality','Qualidade',[['auto','Automática'],['low','Economia'],['high','Alta']]);
  dialog.innerHTML='<div class="play-panel"><header><div><small>SEU JEITO DE JOGAR</small><h2 id="play-settings-title">Ajustes do jogo</h2></div><button type="button" data-close aria-label="Fechar ajustes">✕</button></header><p>Preferências salvas neste dispositivo.'+(online?' A partida online continua em andamento.':'')+'</p>'+content+'<footer><button type="button" data-reset>Restaurar ajustes</button><button type="button" data-close>PRONTO</button></footer></div>';
  document.body.append(dialog);
  dialog.addEventListener('input',e=>{const el=e.target,k=el.dataset.setting;if(!k)return;set(k,el.type==='checkbox'?el.checked:el.value);const out=el.closest('label')?.querySelector('output');if(out)out.value=String(values[k]);apply()});
  dialog.addEventListener('click',e=>{if(e.target.closest('[data-close]'))close();if(e.target.closest('[data-reset]')){Object.assign(values,defaults);apply();close();open()}});
  dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close()}if(e.key==='Tab'){const focus=[...dialog.querySelectorAll('button,select,input')],a=focus[0],b=focus.at(-1);if(e.shiftKey&&document.activeElement===a){e.preventDefault();b.focus()}else if(!e.shiftKey&&document.activeElement===b){e.preventDefault();a.focus()}}});
  dialog.querySelector('[data-close]').focus();
 }
 window.ArcadePlaySettings={get:()=>({...values}),set:(k,v)=>{set(k,v);apply()},open,close};
 function init(){
  apply();
  const button=document.createElement('button');button.type='button';button.id='play-settings-button';button.textContent='⚙ AJUSTES';button.setAttribute('aria-label','Ajustar câmera, controles, dificuldade e som');button.onclick=open;document.body.append(button);
  const sync=()=>{window.System?.activeGame?.logic?.updateAudio?.();button.hidden=!window.System?.activeGame||document.getElementById('game-ui')?.classList.contains('hidden');document.documentElement.dataset.playing=String(!button.hidden);};
  sync();const watch=setInterval(sync,250);window.addEventListener('pagehide',()=>clearInterval(watch),{once:true});
  document.addEventListener('keydown',e=>{if(e.code==='KeyC'&&!e.repeat&&!e.target.closest?.('input,select,textarea')&&['drive','usarmy_flight_sim'].includes(id)&&window.System?.activeGame){const choices=['near','medium','far'];set('distance',choices[(choices.indexOf(values.distance)+1)%3]);apply()}});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

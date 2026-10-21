/* thIAguinho • Mastery & Gamepad — native gameplay extension.
 * Goal facts are derived from game states. Local badges NEVER credit Firebase.
 * Gamepad drives the same visible controls, preserving touch, keyboard and cameras.
 * No game APIs are called until a real match begins. */
(()=>{"use strict";
const gameId=window.CONSOLE_GAME_ID;
const names={drive:"KART LEGENDS",box_pro:"BOXE PRO",tennis:"TÊNIS ARENA",ar_truck_sim:"AR OPS",usarmy_flight_sim:"AERO STRIKE"};
if(!Object.prototype.hasOwnProperty.call(names,gameId))return;
const $=s=>document.querySelector(s);
const goalDefs={
 drive:[[["lap","COMPLETE UMA VOLTA",1],["fast","MANTENHA 150+ POR 3s",3],["nitro","USE O NITRO",1]],[["laps","COMPLETE 2 VOLTAS",2],["fast","MANTENHA 150+ POR 12s",12],["podium","TERMINE NO PÓDIO",1]],[["win","VENÇA UMA CORRIDA",1],["hardWin","VENÇA NO DESAFIO",1],["boosts","FAÇA 2 MINI-TURBOS",2]]],
 box_pro:[[["hits","ACERTE 3 GOLPES",3],["time","LUTE POR 30s",30],["blocks","BLOQUEIE 2 GOLPES",2]],[["dodges","FAÇA 2 ESQUIVAS",2],["counters","ACERTE UM CONTRAGOLPE",1],["win","VENÇA UMA LUTA",1]],[["counters","ACERTE 3 CONTRAGOLPES",3],["hardWin","VENÇA O CINTURÃO OU DESAFIO",1],["healthyWin","VENÇA COM 50% DE VIDA",1]]],
 tennis:[[["rally","RALLY DE 4 TOQUES",4],["points","MARQUE 2 PONTOS",2],["win","VENÇA UMA PARTIDA",1]],[["rally","RALLY DE 8 TOQUES",8],["points","MARQUE 8 PONTOS",8],["win","VENÇA UMA PARTIDA",1]],[["rally","RALLY DE 12 TOQUES",12],["hardWin","VENÇA NO DESAFIO",1],["marginWin","VENÇA COM 5 DE VANTAGEM",1]]],
 ar_truck_sim:[[["collect","COLETE 2 OBJETOS",2],["missions","CONCLUA UMA MISSÃO",1],["deliveries","ENTREGUE UMA CARGA NA BASE",1]],[["itemsDelivered","ENTREGUE 6 OBJETOS",6],["missions","CONCLUA 2 MISSÕES",2],["safeReturn","ENTREGUE COM 80% DE VIDA",1]],[["itemsDelivered","ENTREGUE 12 OBJETOS",12],["missions","CONCLUA 4 MISSÕES",4],["deliveries","FAÇA 4 ENTREGAS",4]]],
 usarmy_flight_sim:[[["time","VOE POR 35s",35],["locks","TRAVE A MIRA NUM INIMIGO",1],["kills","ABATA UM ADVERSÁRIO",1]],[["kills","ABATA 5 ADVERSÁRIOS",5],["wave","ALCANCE A SEGUNDA ONDA",2],["school","CONCLUA A ESCOLA DE VOO",1]],[["kills","ABATA 12 ADVERSÁRIOS",12],["boss","ABATA O CHEFÃO",1],["victory","CONCLUA A CAMPANHA",1]]]
};
const key="thia:mastery:v2:"+gameId;
let completed={},session=null,last=null,lastTick=performance.now(),ui=null,info=null,toggle=null,badge=null,tier=0;
try{const saved=JSON.parse(localStorage.getItem(key)||"{}");if(saved&&typeof saved.completed==='object')completed=saved.completed||{}}catch{}
const stages=['INICIAÇÃO','TÉCNICA','MAESTRIA'];
function firstUnfinished(){const next=goalDefs[gameId].findIndex((rows,i)=>rows.some(([id])=>!completed[i+':'+id]));return next<0?2:next;}
let goals=[];
function selectTier(){tier=firstUnfinished();goals=goalDefs[gameId][tier].map(([id,title,target])=>({id,title,target,progress:completed[tier+':'+id]?target:0}))}
selectTier();
function persist(){try{localStorage.setItem(key,JSON.stringify({completed,updatedAt:new Date().toISOString()}))}catch{}}
const clamp=(x,a,b)=>Math.min(b,Math.max(a,Number(x)||0));
const isPlaying=g=>!!g&&(gameId==='drive'?['RACE','SPECTATE_WAIT'].includes(g.state):gameId==='box_pro'?['FIGHT','GAMEOVER'].includes(g.state):gameId==='tennis'?['IDLE','RALLY','SERVE','STARTING','END_WAIT','END'].includes(g.state):gameId==='ar_truck_sim'?['PLAY_REAR_AR','WAITING_PICKUP','ENTER_BASE_TRANSITION','FRONT_AR_OFFICE'].includes(g.state):['PLAYING','VICTORY','GAMEOVER'].includes(g.state));
function make(){
 if(ui)return;ui=document.createElement('section');ui.id='studio-mastery';ui.setAttribute('aria-label','Carreira e desafios de domínio');
 toggle=document.createElement('button');toggle.type='button';toggle.id='studio-mastery-toggle';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Mostrar carreira e desafios');
 const symbol=document.createElement('span');symbol.textContent='◉';info=document.createElement('span');info.id='studio-mastery-summary';toggle.append(symbol,info);
 badge=document.createElement('div');badge.id='studio-mastery-list';badge.hidden=true;ui.append(toggle,badge);document.body.append(ui);ui.hidden=true;
 toggle.addEventListener('click',()=>{badge.hidden=!badge.hidden;toggle.setAttribute('aria-expanded',String(!badge.hidden));render()});render();
}
function render(){
 if(!ui)return;const done=goals.filter(g=>completed[tier+':'+g.id]).length;info.textContent=stages[tier]+' '+done+'/3';
 const heading=document.createElement('div');heading.className='studio-mastery-heading';heading.textContent='CARREIRA · ETAPA '+(tier+1)+'/3';
 badge.replaceChildren(heading,...goals.map(g=>{const earned=!!completed[tier+':'+g.id],el=document.createElement('div');el.className='studio-mastery-task'+(earned?' completed':'');const text=document.createElement('span');text.textContent=g.title;const fraction=document.createElement('strong');fraction.textContent=earned?'✓':Math.min(g.target,Math.floor(g.progress))+'/'+g.target;el.append(text,fraction);return el}));
 if(done===3){const note=document.createElement('small');note.textContent=tier<2?'Etapa concluída. A próxima começa na próxima partida.':'Carreira completa. Melhore seus recordes!';badge.append(note)}
 ui.classList.toggle('all-complete',done===3);
}
function reset(){selectTier();session={time:0,fast:0,nitro:0,locks:0,safeReturn:0};last=null;render()}
function updateGoals(g,dt){
 const p=last||{},v={state:g.state,nitro:!!g.turboLock,locked:!!g.combat?.locked,deliveries:Number(g.expedition?.deliveries)||0};
 const active=['RACE','FIGHT','RALLY','SERVE','PLAYING','PLAY_REAR_AR','WAITING_PICKUP'].includes(g.state);if(active)session.time+=dt;
 const chosen=window.ArcadePlaySettings?.get().difficulty;const campaign=g.currentFase?.id&&g.currentFase.id!=='arcade';const hard=gameId==='drive'&&campaign?g.currentFase.diff==='HARD':gameId==='box_pro'&&campaign?g.currentFase.id==='f3':gameId==='tennis'&&g.currentFase?.difficulty?g.currentFase.difficulty==='hard':chosen==='hard';let metrics={time:session.time};
 if(gameId==='drive'){
  if(g.speed>=150&&active)session.fast+=dt;if(v.nitro&&!p.nitro)session.nitro++;
  const finished=g.status==='FINISHED',won=finished&&g.finalRank===1;
  Object.assign(metrics,{lap:Math.max(0,g.lap-1),laps:Math.max(0,g.lap-1),fast:session.fast,nitro:session.nitro,podium:Number(finished&&g.finalRank<=3),win:Number(won),hardWin:Number(won&&hard),boosts:g.driftBoosts||0});
 }else if(gameId==='box_pro')Object.assign(metrics,g.boutStats||{},{win:Number(g.matchWon),hardWin:Number(g.matchWon&&(hard||g.currentFase?.id==='f3')),healthyWin:Number(g.matchWon&&g.p1?.hp>=50)});
 else if(gameId==='tennis'){
  const won=['END','END_WAIT'].includes(g.state)&&g.score.p1>g.score.p2;Object.assign(metrics,{rally:Math.max(g.matchBestRally||0,g.rallyCount||0),points:g.score.p1,win:Number(won),hardWin:Number(won&&hard),marginWin:Number(won&&g.score.p1-g.score.p2>=5)});
 }else if(gameId==='ar_truck_sim'){
  if(v.deliveries>(p.deliveries||0)&&g.health>=80)session.safeReturn=1;Object.assign(metrics,g.expedition||{},{collect:g.currentMission?.progress||0,safeReturn:session.safeReturn});
 }else{
  if(v.locked&&!p.locked)session.locks++;Object.assign(metrics,{locks:session.locks,kills:g.session?.kills||0,wave:g.session?.wave||0,school:Number(g.flightCareer?.school),boss:Number(g.bossDefeated),victory:Number(g.state==='VICTORY')});
 }
 let changed=false;for(const goal of goals){goal.progress=Math.max(goal.progress,Number(metrics[goal.id])||0);const stamp=tier+':'+goal.id;if(goal.progress>=goal.target&&!completed[stamp]){completed[stamp]=true;changed=true;ui?.classList.add('just-earned');window.setTimeout(()=>ui?.classList.remove('just-earned'),1300)}}
 if(changed)persist();last=v;
}
const current=()=> (window.Games||[]).find(x=>x.id===gameId&&window.System?.activeGame===x);
function cycle(){
 if(!ui)make();const logic=current()?.logic,playing=isPlaying(logic);ui.hidden=!playing;
 if(document.hidden||window.System?.paused||!playing){if(!playing&&session){session=null;last=null;selectTier();render()}lastTick=performance.now();return}
 if(!session)reset();const time=performance.now(),dt=clamp((time-lastTick)/1000,0,.25);lastTick=time;updateGoals(logic,dt);render();
}
function gamepadButtons(){
 const root=$(".input-game-controls:not([hidden])");
 const rootForBoxe=$("#arcade-boxing-controls:not([hidden])");
 const pad=Array.from(navigator.getGamepads?.()||[]).find(p=>p&&p.connected);
 return {pad,root,box:rootForBoxe};
}
let lastPad=null,pressed=new Set(),prevAxes=[0,0],tennisPoint={x:0,y:0},startHeld=false;
function synthetic(el,down){
 if(!el)return;
 try{
   el.dispatchEvent(new PointerEvent(down?"pointerdown":"pointerup",{bubbles:true,pointerId:72,pointerType:"gamepad",isPrimary:true}));
 }catch{el.dispatchEvent(new Event(down?"pointerdown":"pointerup",{bubbles:true}))}
}
function release(){
 for(const target of pressed){const btn=$(target);synthetic(btn,false)}
 pressed.clear();
 const logic=current()?.logic;
 if(logic?.keys){for(const k of ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Shift"," "])logic.keys[k]=false}
}
function act(selector,hold){
 const button=$(selector);
 const was=pressed.has(selector);
 if(hold&&!was&&button&&!button.disabled){synthetic(button,true);pressed.add(selector)}
 if(!hold&&was){synthetic(button,false);pressed.delete(selector)}
}
function moveGamepad(){
 const game=current(),logic=game?.logic;
 const {pad,root,box}=gamepadButtons();
 if(!pad || !logic || !isPlaying(logic) || document.hidden || window.System?.paused ||
    window.ArcadeControls?.mode!=="controls"){
   if(lastPad){release();lastPad=null}
   return;
 }
 lastPad=pad;
 const axis=i=>Math.abs(Number(pad.axes?.[i])||0)<.24?0:Number(pad.axes[i]);
 const btn=i=>!!(pad.buttons?.[i]?.pressed);
 const x=axis(0),y=axis(1);
 const left=x<-.35||btn(14),right=x>.35||btn(15);
 const up=y<-.35||btn(12),down=y>.35||btn(13);
 const a=btn(0),b=btn(1),xx=btn(2),lb=btn(4),rt=btn(7)||Number(pad.buttons?.[7]?.value)>0.20,lt=btn(6)||Number(pad.buttons?.[6]?.value)>0.2;
 if(gameId==="drive"){
   act('.kart-input [data-control="left"]',left);
   act('.kart-input [data-control="right"]',right);
   act('.kart-input [data-control="go"]',rt||up);
   act('.kart-input [data-control="brake"]',lt||down);
   act('.kart-input [data-control="item"]',a);
   act('.kart-input [data-control="nitro"]',b);
 }else if(gameId==="box_pro"){
   // Installed touch boxing handler is also the official no-camera handler.
   if(window.ArcadeControls?.mode==="controls")logic.touchMode=true;
   act('#arcade-boxing-controls [data-punch="l"]',a);
   act('#arcade-boxing-controls [data-punch="r"]',xx||b);
   act('#arcade-boxing-controls [data-guard]',lb||lt);
 }else if(gameId==="tennis"){
   if(logic.useMouse){
     const c=window.System?.canvas;
     if(c){
       const dt=.05;
       tennisPoint.x=clamp((Number(logic.mouseX)||c.width/2)+x*c.width*.9*dt,3,c.width-3);
       tennisPoint.y=clamp((Number(logic.mouseY)||c.height/2)+y*c.height*.9*dt,3,c.height-3);
       logic.mouseX=tennisPoint.x;logic.mouseY=tennisPoint.y;
       if(a&&!startHeld&&logic.state==="SERVE"){
         const rect=c.getBoundingClientRect();
         c.dispatchEvent(new MouseEvent("click",{bubbles:true,clientX:rect.left+rect.width*.5,clientY:rect.top+rect.height*.5}));
       }
     }
   }
 }else if(gameId==="ar_truck_sim"){
   act('.ar-input [data-control="left"]',left);
   act('.ar-input [data-control="right"]',right);
   act('.ar-input [data-control="go"]',rt||up);
   act('.ar-input [data-control="pick"]',a);
   act('.ar-input [data-control="base"]',b);
 }else if(gameId==="usarmy_flight_sim"){
   for(const [name,on] of [["left",left],["right",right],["up",up],["down",down],["boost",b],["missile",a],["fire",rt]]){
     act('.flight-input [data-control="'+name+'"]',on);
   }
 }
 startHeld=a;
}
// Snapshot only every 150ms; gamepad is sampled every 50ms.
// Both timers have strictly bounded, constant memory and no network traffic.
function boot(){
 make();reset();
 window.setInterval(cycle,160);window.setInterval(moveGamepad,50);
 window.addEventListener("pagehide",release,{once:true});
 window.addEventListener("gamepaddisconnected",release);
 window.addEventListener("blur",release);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
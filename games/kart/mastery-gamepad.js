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
 drive:[["lap","COMPLETE UMA VOLTA",1],["speed","VELOCIDADE 150+",3],["nitro","ATIVAR NITRO",1]],
 box_pro:[["hits","ACERTE 3 GOLPES",3],["time","SOBREVIVA 30s",30],["guard","DEFENDA POR 3s",3]],
 tennis:[["rally","RALLY DE 4 TOQUES",4],["points","MARQUE 2 PONTOS",2],["match","VENCER UMA PARTIDA",1]],
 ar_truck_sim:[["collect","COLETE 2 OBJETOS",2],["mission","CONCLUA UMA MISSÃO",1],["return","RETORNE À BASE",1]],
 usarmy_flight_sim:[["survive","VOE POR 35s",35],["missiles","DISPARE 2 MÍSSEIS",2],["wave","ENFRENTE A 2ª ONDA",2]]
};
const goals=goalDefs[gameId].map(([id,title,target])=>({id,title,target,progress:0}));
const key="thia:mastery:v1:"+gameId;
let completed={},session=null,last=null,lastTick=performance.now(),ui=null,info=null,toggle=null,badge=null;
try{const saved=JSON.parse(localStorage.getItem(key)||"{}");if(saved&&typeof saved==="object"&&saved.completed&&typeof saved.completed==="object")completed=saved.completed}catch{}
function persist(){
 try{localStorage.setItem(key,JSON.stringify({completed,updatedAt:new Date().toISOString()}))}catch{}
}
const clamp=(x,a,b)=>Math.min(b,Math.max(a,Number(x)||0));
const isPlaying=g=>!!g&&(gameId==="drive"?g.state==="RACE"&&g.status==="RACING":
 gameId==="box_pro"?g.state==="FIGHT":
 gameId==="tennis"?["RALLY","SERVE","STARTING"].includes(g.state):
 gameId==="ar_truck_sim"?["PLAY_REAR_AR","WAITING_PICKUP","ENTER_BASE_TRANSITION","FRONT_AR_OFFICE"].includes(g.state):
 g.state==="PLAYING");
function make(){
 if(ui)return;
 ui=document.createElement("section");ui.id="studio-mastery";ui.setAttribute("role","status");
 ui.setAttribute("aria-label","Missões de domínio nesta partida");
 toggle=document.createElement("button");toggle.type="button";toggle.id="studio-mastery-toggle";
 toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-label","Mostrar ou ocultar desafios da partida");
 const symbol=document.createElement("span");symbol.textContent="◉";
 info=document.createElement("span");info.id="studio-mastery-summary";info.textContent="DESAFIOS";
 toggle.append(symbol,info);
 badge=document.createElement("div");badge.id="studio-mastery-list";badge.hidden=true;
 ui.append(toggle,badge);document.body.append(ui);ui.hidden=true;
 toggle.addEventListener("click",()=>{badge.hidden=!badge.hidden;toggle.setAttribute("aria-expanded",String(!badge.hidden));render()});
 render();
}
function render(){
 if(!ui)return;
 const done=goals.filter(g=>g.progress>=g.target).length;
 info.textContent="MISSÕES "+done+"/"+goals.length;
 badge.replaceChildren(...goals.map(g=>{
   const el=document.createElement("div");el.className="studio-mastery-task"+(g.progress>=g.target?" completed":"");
   const text=document.createElement("span");text.textContent=g.title;
   const fraction=document.createElement("strong");
   const value=Math.min(g.target,Math.floor(g.progress));
   fraction.textContent=value+"/"+g.target;
   el.append(text,fraction);return el;
 }));
 ui.classList.toggle("all-complete",done===goals.length);
}
function reset(){
 goals.forEach(g=>g.progress=0);
 session={time:0,hits:0,guard:0,fast:0,missiles:0,nitro:0,points:0,missions:0,returns:0,win:0};
 last=null;render();
}
function snapshot(g){
 return {
  state:String(g.state||""),status:String(g.status||""),
  lap:Number(g.lap)||1,speed:Number(g.speed)||0,nitro:!!g.turboLock,
  hp:Number(g.p1?.hp)||0,enemyHp:Number(g.p2?.hp)||0,guard:!!g.p1?.guard,round:Number(g.round)||0,
  rally:Number(g.rallyCount)||0,p1score:Number(g.score?.p1)||0,tennisEnd:g.state==="END",
  collected:Number(g.currentMission?.progress)||0,cargo:Number(g.cargo?.length)||0,missionActive:!!g.currentMission?.active,
  missiles:Number(g.missiles?.length)||0,wave:Number(g.session?.wave)||0,
  shipHP:Number(g.ship?.hp)||0
 };
}
function updateGoals(g,dt){
 const v=snapshot(g),p=last||v;
 session.time+=dt;
 if(gameId==="drive"){
   if(v.speed>=150)session.fast+=dt;
   if(v.nitro&&!p.nitro)session.nitro++;
   goals[0].progress=Math.max(0,v.lap-1);
   goals[1].progress=session.fast;
   goals[2].progress=session.nitro;
 }else if(gameId==="box_pro"){
   if(v.enemyHp<p.enemyHp-0.1)session.hits++;
   if(v.guard)session.guard+=dt;
   goals[0].progress=session.hits;
   goals[1].progress=session.time;
   goals[2].progress=session.guard;
 }else if(gameId==="tennis"){
   if(v.p1score>p.p1score)session.points+=v.p1score-p.p1score;
   // A rally is confirmed by the native counter, not synthetic keypresses.
   goals[0].progress=Math.max(goals[0].progress,v.rally);
   goals[1].progress=session.points;
   goals[2].progress=session.win;
 }else if(gameId==="ar_truck_sim"){
   goals[0].progress=Math.max(goals[0].progress,v.collected,session.collectTotal||0);
   if(p.missionActive&&!v.missionActive)session.missions++;
   if(g.state==="FRONT_AR_OFFICE"&&p.state!=="FRONT_AR_OFFICE")session.returns++;
   session.collectTotal=Math.max(session.collectTotal||0,v.collected);
   goals[1].progress=session.missions;
   goals[2].progress=session.returns;
 }else if(gameId==="usarmy_flight_sim"){
   if(v.missiles>p.missiles)session.missiles+=v.missiles-p.missiles;
   goals[0].progress=session.time;
   goals[1].progress=session.missiles;
   goals[2].progress=v.wave;
 }
 let changed=false;
 for(const goal of goals){
   if(goal.progress>=goal.target&&!completed[goal.id]){
     completed[goal.id]=true;changed=true;
     ui?.classList.add("just-earned");
     window.setTimeout(()=>ui?.classList.remove("just-earned"),1300);
   }
 }
 if(changed)persist();
 last=v;
}
const current=()=> (window.Games||[]).find(x=>x.id===gameId && window.System?.activeGame===x);
function cycle(){
 if(!ui)make();
 const active=current(),logic=active?.logic,playing=isPlaying(logic);
 const locked=document.hidden||window.System?.paused||!playing;
 ui.hidden=!playing;
 if(locked){lastTick=performance.now();return}
 if(!session)reset();
 const time=performance.now(),dt=clamp((time-lastTick)/1000,0,.25);
 lastTick=time;
 updateGoals(logic,dt);
 render();
}
function gamepadButtons(){
 const root=$(".input-game-controls:not([hidden])");
 const rootForBoxe=$("#arcade-boxing-controls:not([hidden])");
 const pad=(navigator.getGamepads?.()||[]).find(p=>p&&p.connected);
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
   for(const [name,on] of [["left",left],["right",right],["up",up],["down",down],["boost",rt||b],["missile",a]]){
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
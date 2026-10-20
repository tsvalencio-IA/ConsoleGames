/* thIAguinho ARCADE — pausa segura do motor, offline.
   Sem interferir no multiplayer, Firebase ou salvamento original. */
(()=>{"use strict";
function init(){
  const sys=window.System,stage=document.getElementById("game-ui");
  if(!sys||!stage||document.getElementById("arcade-pause"))return;
  const pause=document.createElement("button");
  pause.id="arcade-pause";pause.type="button";pause.textContent="Ⅱ PAUSA";
  pause.setAttribute("aria-label","Pausar a partida");
  const modal=document.createElement("section");
  modal.id="arcade-pause-modal";modal.hidden=true;modal.setAttribute("role","dialog");
  modal.setAttribute("aria-modal","true");modal.setAttribute("aria-labelledby","arcade-pause-title");
  modal.innerHTML='<div class="arcade-pause-panel"><span class="arcade-pause-kicker">thIAguinho ARCADE</span><h2 id="arcade-pause-title">PARTIDA PAUSADA</h2><p>Descanse e volte para a aventura quando quiser.</p><div class="arcade-pause-actions"><button type="button" data-action="continue">▶ CONTINUAR</button><button type="button" data-action="phases">◈ ESCOLHER FASE</button><a href="../../" data-action="exit">⌂ VOLTAR AO CONSOLE</a></div><p class="arcade-pause-note">Seu progresso original permanece com o jogo.</p></div>';
  stage.appendChild(pause);document.body.appendChild(modal);
  let lastFocus=null;
  function recoverClock(){
    const g=sys.activeGame?.logic;
    if(g){if("lastTime" in g)g.lastTime=performance.now();if("lastFrameTime" in g)g.lastFrameTime=performance.now();}
  }
  function close(){
    modal.hidden=true;sys.paused=false;recoverClock();
    (lastFocus&&lastFocus.isConnected?lastFocus:pause).focus({preventScroll:true});
  }
  function open(){
    if(!sys.activeGame||sys.activeGame.logic?.isOnline)return;
    lastFocus=document.activeElement;sys.paused=true;modal.hidden=false;
    modal.querySelector('[data-action="continue"]').focus({preventScroll:true});
  }
  pause.addEventListener("click",open);
  modal.addEventListener("click",event=>{
    const action=event.target.closest("[data-action]")?.dataset.action;
    if(action==="continue")close();
    else if(action==="phases"){
      close();sys.menu();
      const id=window.CONSOLE_GAME_ID,g=(window.Games||[]).find(x=>x.id===id);
      const allow=g&&(window.Profile?.role==="admin"||window.Profile?.permissions?.[id]===true);
      if(allow)sys.openPhases(g);
    }
  });
  document.addEventListener("keydown",event=>{
    if(!modal.hidden&&event.key==="Escape"){event.preventDefault();close()}
    if(!modal.hidden&&event.key==="Tab"){
      const elements=[...modal.querySelectorAll("button,a[href]")];
      const current=elements.indexOf(document.activeElement);
      if(event.shiftKey && current<=0){event.preventDefault();elements.at(-1)?.focus()}
      else if(!event.shiftKey && current===elements.length-1){event.preventDefault();elements[0]?.focus()}
    }
  });
  const sync=()=>{
    const show=Boolean(sys.activeGame && !sys.activeGame.logic?.isOnline && !stage.classList.contains("hidden"));
    pause.hidden=!show;
    if(!show&&!modal.hidden){modal.hidden=true;sys.paused=false;}
  };
  sync();
  const watcher=setInterval(sync,220);
  window.addEventListener("pagehide",()=>clearInterval(watcher),{once:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
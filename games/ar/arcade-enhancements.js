/* ConsoleGames: safe game-specific arcade goals, compact HUD and direct launch.
   Original game IDs, permissions, screens and Firebase calls are preserved.
   This module writes ONLY local challenge statistics, never Firebase. */
(() => {
  "use strict";
  const id = window.CONSOLE_GAME_ID;
  const titles = {
    drive: "Kart Legends", box_pro: "Boxing Pro", tennis: "Ping Pong Wii",
    ar_truck_sim: "AR Ops Premium", usarmy_flight_sim: "Aero Strike WAR"
  };
  if (!id || !Object.prototype.hasOwnProperty.call(titles, id)) return;
  const $ = (selector) => document.querySelector(selector);
  const nowDay = () => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-");
  };
  const key = "console-games:v2:challenge:" + id;
  const read = () => {
    try {
      const v = JSON.parse(localStorage.getItem(key) || "{}");
      return v && typeof v === "object" ? v : {};
    } catch { return {}; }
  };
  let data = read();
  function store() { try { localStorage.setItem(key, JSON.stringify(data)); } catch {} }
  const day = nowDay();
  if (data.day !== day) {
    data = {...data, day, dailyWins:0, dailyGames:0, dailyBest:0};
    store();
  }
  const winTarget = id === "tennis" || id === "ar_truck_sim" ? 1 : 2;
  const missionText = () => id === "ar_truck_sim"
    ? "Complete " + winTarget + " missão AR"
    : id === "tennis" ? "Vença uma partida"
    : "Vença " + winTarget + " partidas hoje";
  let checkedTennis = false, lastArCompleted = false;
  let lastActive = null, gameStarted = false, applied = false, opened = false, timer=null;
  const UI = {};
  function elt(tag, idName, text) {
    const e=document.createElement(tag);
    if (idName) e.id=idName;
    if (text) e.textContent=text;
    return e;
  }
  function ensureUI() {
    if (UI.top || !document.body) return;
    UI.top=elt("div","arcade-topline");
    UI.top.setAttribute("role","status");
    UI.top.setAttribute("aria-live","off");
    UI.title=elt("strong","", titles[id]); UI.goal=elt("small");
    UI.top.append(UI.title,UI.goal);
    UI.target=elt("span","arcade-target");
    UI.menu=elt("section","arcade-menu-card");
    UI.menu.innerHTML='<div class="arcade-meta">DESAFIO DE HOJE</div>';
    UI.menuTitle=elt("strong");UI.menuDescription=elt("p");
    UI.menu.append(UI.menuTitle,UI.menuDescription);
    document.body.append(UI.top,UI.target);
    // Show real daily objectives in phase selection (where players actually decide what to play).
    const grid=$("#phase-grid");
    if (grid && grid.parentNode) grid.parentNode.insertBefore(UI.menu,grid);
    UI.locked=elt("p","arcade-locked");
    UI.locked.hidden=true;
    UI.locked.textContent="Este jogo ainda não está liberado para sua conta GAME. Um responsável pode autorizar pelo painel original.";
    $("#menu-screen")?.appendChild(UI.locked);
    UI.top.hidden=true;UI.target.hidden=true; UI.menu.hidden=true;
    const menu=$("#menu-screen");
    if(menu){
      const back=elt("a","","← Console");
      back.className="arcade-return";
      back.href="../../";
      back.setAttribute("aria-label","Voltar ao console de jogos");
      menu.appendChild(back);
    }
    const authScreen=$("#auth-screen");
    if(authScreen){
      const back=elt("a","","← Voltar ao console");
      back.className="arcade-return";
      back.href="../../";
      authScreen.appendChild(back);
    }
    renderProgress();
  }
  function renderProgress() {
    if(!UI.top)return;
    const wins=Math.min(winTarget,Number(data.dailyWins)||0);
    UI.goal.textContent=wins+"/"+winTarget+" vitória"+(winTarget===1?"":"s")+" hoje";
    UI.target.textContent="✦ "+missionText();
    UI.menuTitle.textContent=missionText();
    const total=Number(data.totalGames)||0;
    const best=Number(data.bestScore)||0;
    UI.menuDescription.textContent=
      "Hoje: "+(Number(data.dailyGames)||0)+" partida(s) • Melhor pontuação: "+best.toLocaleString("pt-BR")+
      " • Total de partidas: "+total+".";
    if(wins===winTarget){
      UI.goal.textContent="✓ Desafio de hoje concluído";
      UI.target.textContent="✓ Desafio de hoje concluído";
    }
  }
  function record(score, won) {
    if(!gameStarted) return;
    // Persist just observed match results; do not invent XP, money or victories.
    const val=Number.isFinite(Number(score)) ? Math.max(0,Math.floor(Number(score))) : 0;
    data.totalGames=(Number(data.totalGames)||0)+1;
    data.dailyGames=(Number(data.dailyGames)||0)+1;
    data.bestScore=Math.max(Number(data.bestScore)||0,val);
    data.dailyBest=Math.max(Number(data.dailyBest)||0,val);
    if(won){
      data.totalWins=(Number(data.totalWins)||0)+1;
      data.dailyWins=(Number(data.dailyWins)||0)+1;
    }
    gameStarted=false;store();renderProgress();
  }
  function patchCore() {
    if(applied || !window.System || !Array.isArray(window.Games))return;
    applied=true;
    const system=window.System;
    if(typeof system.gameOver==="function"){
      const original=system.gameOver;
      system.gameOver=function(score,won,...rest) {
        // The original method handles Firebase rewards and the original result UI.
        const result=original.call(this,score,won,...rest);
        if(id!=="tennis" && id!=="ar_truck_sim") record(score,Boolean(won));
        return result;
      };
    }
    if(typeof system.openPhases==="function"){
      const original=system.openPhases;
      system.openPhases=function(game,...args) {
        if(game.id!==id){
          // Protect the one-game folder without changing original Firebase permissions.
          return undefined;
        }
        return original.call(this,game,...args);
      };
    }
  }
  function enforceOneGameMenu() {
    const grid=$("#channel-grid");
    if(!grid)return;
    const target=window.Games.find(game=>game.id===id);
    if(!target)return;
    const granted=Boolean(window.Profile && (window.Profile.role==="admin" || window.Profile.permissions?.[id] === true));
    if (UI.menu) UI.menu.hidden=false;
    if(UI.locked)UI.locked.hidden=granted;
    if (!granted){
      for(const c of grid.children)c.hidden=true;
      return;
    }
    let count=0;
    for(const child of grid.children){
      const heading=child.querySelector(".channel-title");
      const isTarget=heading && heading.textContent.trim()===target.title;
      child.hidden=!isTarget;
      if(isTarget)count++;
    }
    if(!opened && count===1 && $("#menu-screen") && !$("#menu-screen").classList.contains("hidden")){
      opened=true;
      // Enter phase selection, not a camera-based match: the player actively starts.
      systemOpen(target);
    }
  }
  function systemOpen(game) {
    try { window.System.openPhases(game); }
    catch(e){ console.error("Não foi possível abrir as fases do jogo:",e); }
  }
  function watchGameState() {
    const g=window.System?.activeGame;
    if(g?.id!==id) {
      UI.top.hidden=true;UI.target.hidden=true;
      if(lastActive===id && !g) { checkedTennis=false; lastArCompleted=false; }
      lastActive=null;
      return;
    }
    if(lastActive!==id) {
      gameStarted=true;checkedTennis=false;lastArCompleted=false;
      renderProgress();
    }
    lastActive=id;
    UI.top.hidden=false;UI.target.hidden=false;
    // Native tennis doesn't call System.gameOver; end state + real score are trusted.
    if(id==="tennis"){
      const obj=g.logic;
      const finished=obj?.state==="END";
      if(!finished) checkedTennis=false;
      if(finished && !checkedTennis && gameStarted){
        checkedTennis=true;
        const a=Number(obj.score?.p1)||0,b=Number(obj.score?.p2)||0;
        record(a,a>b);
      }
    }
    // The AR game keeps its own missions/score and does not call System.gameOver.
    if(id==="ar_truck_sim"){
      const mission=g.logic?.currentMission;
      const completed=Boolean(mission && mission.goal>0 && mission.progress>=mission.goal && !mission.active);
      if(completed&&!lastArCompleted){
        record(g.logic?.score || 0,true);
        gameStarted=true; // missions may run consecutively in the same AR session
      }
      lastArCompleted=completed;
    }
  }
  function tick() {
    ensureUI();patchCore();
    if(!applied)return;
    const visible=$("#menu-screen")&&!$("#menu-screen").classList.contains("hidden");
    if(visible)enforceOneGameMenu();
    watchGameState();
  }
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden)return;
    if(nowDay()!==data.day){data={...data,day:nowDay(),dailyWins:0,dailyGames:0,dailyBest:0};store();renderProgress();}
    if(window.System?.canvas && window.System.resize)window.System.resize();
  });
  window.addEventListener("resize",()=>{
    if(window.System?.canvas && window.System.resize)window.System.resize();
  },{passive:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener("resize",()=>{
      if(window.System?.canvas && window.System.resize)window.System.resize();
    },{passive:true});
  }
  tick();
  timer=setInterval(tick,600); // menu/outcome polling, independent of the animation loop
})();
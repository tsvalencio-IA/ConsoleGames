/* thIAguinho ARCADE · Studio sound & presentation
 * Event-bound game feedback; no replacement of the native rendering, audio,
 * Firebase, accounts, rules, physics or controls. No remote audio downloads.
 */
(() => {
  "use strict";
  const gameId=window.CONSOLE_GAME_ID;
  const titles={drive:"KART",box_pro:"BOXE",tennis:"TÊNIS",ar_truck_sim:"AR COMBAT",usarmy_flight_sim:"VOO"};
  if(!Object.hasOwn(titles,gameId))return;
  const storageKey="thia:studio:audio:v1";
  const context={ctx:null,enabled:true,last:new Map(),voices:0,game:null,
    snapshot:null,lastFrame:0,flash:null,canvas:null,overlays:null,cache:null};
  try{context.enabled=localStorage.getItem(storageKey)!=="off"}catch{}
  const now=()=>performance.now();
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number(v)||0));
  function initAudio(){
    if(!context.enabled)return null;
    const A=window.AudioContext||window.webkitAudioContext;
    if(!A)return null;
    try{
      if(!context.ctx)context.ctx=new A();
      if(context.ctx.state==="suspended")context.ctx.resume().catch(()=>{});
      return context.ctx;
    }catch{return null}
  }
  function oscillator(t,frequency,final,type="sine",gain=.06,delay=0){
    const c=initAudio();if(!c||context.voices>=10)return;
    const start=c.currentTime+delay;
    const o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();
    o.type=type;o.frequency.setValueAtTime(Math.max(35,frequency),start);
    o.frequency.exponentialRampToValueAtTime(Math.max(35,final),start+t);
    f.type="lowpass";f.frequency.value=clamp(Math.max(frequency,final)*3,650,5600);
    g.gain.setValueAtTime(.00001,start);
    g.gain.exponentialRampToValueAtTime(Math.max(.00001,gain*(window.ArcadePlaySettings?.get()[["danger"].includes(context.currentCue)?"alertVolume":"effectsVolume"]??1)),start+.009);
    g.gain.exponentialRampToValueAtTime(.00001,start+t);
    o.connect(f);f.connect(g);g.connect(c.destination);
    context.voices++;
    o.onended=()=>{context.voices=Math.max(0,context.voices-1);o.disconnect();f.disconnect();g.disconnect()};
    o.start(start);o.stop(start+t+.025);
  }
  const patterns={
    menu:()=>oscillator(.065,390,560,"sine",.024),
    kartLap:()=>{oscillator(.12,523,659,"triangle",.065);oscillator(.15,784,988,"sine",.052,.115)},
    kartBoost:()=>{oscillator(.32,230,780,"sawtooth",.044);oscillator(.22,390,900,"triangle",.025,.08)},
    kartItem:()=>{oscillator(.09,740,1180,"triangle",.065);oscillator(.19,1150,500,"sine",.04,.085)},
    impact:()=>{oscillator(.09,100,44,"sawtooth",.10);oscillator(.16,88,48,"triangle",.035,.025)},
    jab:()=>{oscillator(.055,290,110,"triangle",.068);oscillator(.10,115,70,"sawtooth",.025)},
    score:()=>{oscillator(.08,660,880,"sine",.06);oscillator(.18,990,1210,"triangle",.035,.08)},
    rival:()=>oscillator(.24,340,150,"triangle",.06),
    collect:()=>{oscillator(.09,760,1050,"sine",.06);oscillator(.16,1140,1580,"triangle",.04,.07)},
    dock:()=>{oscillator(.16,280,490,"triangle",.04);oscillator(.18,470,720,"sine",.045,.12)},
    missile:()=>{oscillator(.22,490,130,"sawtooth",.05);oscillator(.10,820,440,"triangle",.021,.08)},
    danger:()=>{oscillator(.19,540,290,"triangle",.063);oscillator(.20,440,220,"triangle",.037,.23)},
    win:()=>[523,659,784,1047].forEach((n,i)=>oscillator(.18,n,n*1.005,"sine",.048,i*.105)),
    lose:()=>[330,275,220].forEach((n,i)=>oscillator(.22,n,n*.87,"triangle",.05,i*.15)),
  };
  function cue(name,cooldown=230){
    if(!context.enabled||!patterns[name]||document.hidden||window.System?.paused)return;
    const stamp=now();if(stamp-(context.last.get(name)||-1e6)<cooldown)return;
    context.last.set(name,stamp);
    try{context.currentCue=name;patterns[name]()}catch{}
  }
  function state(logic){
    const o={phase:String(logic.state||logic.status||""),elapsed:now()};
    if(gameId==="drive")Object.assign(o,{lap:Number(logic.lap)||0,boost:!!logic.turboLock,item:String(logic.item||""),speed:Number(logic.speed)||0,rank:Number(logic.finalRank)||0,done:String(logic.status||"")});
    if(gameId==="box_pro")Object.assign(o,{hp:Number(logic.p1?.hp)||0,rival:Number(logic.p2?.hp)||0,round:Number(logic.round)||0,done:!!logic.matchEnded});
    if(gameId==="tennis")Object.assign(o,{left:Number(logic.score?.p1)||0,right:Number(logic.score?.p2)||0,hit:Math.max(0,Number(logic.hitstop)||0)});
    if(gameId==="ar_truck_sim")Object.assign(o,{shots:Number(logic.stats?.shots)||0,kills:Number(logic.stats?.kills)||0,reloads:Number(logic.stats?.reloads)||0,hp:Number(logic.player?.hp)||0});
    if(gameId==="usarmy_flight_sim")Object.assign(o,{hp:Number(logic.ship?.hp)||0,missiles:Number(logic.missiles?.length)||0,score:Number(logic.session?.cash)||0});
    return o;
  }
  function track(logic){
    const current=state(logic),prev=context.snapshot;
    if(!prev){context.snapshot=current;return}
    if(current.phase!==prev.phase){
      if(/VICTORY|WIN|FINISH|GAMEOVER/i.test(current.phase) && !/DEFEAT|LOSE/i.test(current.phase))cue("win",1500);
      else if(/DEFEAT|LOSE|CRASH|KNOCKOUT/i.test(current.phase))cue("lose",1500);
      else if(gameId==="ar_truck_sim"&&/FRONT_AR_OFFICE|ENTER_BASE/.test(current.phase))cue("dock",1800);
      else if(gameId==="usarmy_flight_sim" && current.phase==="PLAYING")cue("missile",1500);
    }
    if(gameId==="drive"){
      if(current.lap>prev.lap&&current.lap>1)cue("kartLap",700);
      if(current.boost&&!prev.boost)cue("kartBoost",1100);
      if(prev.item&& !current.item)cue("kartItem",500);
      if(current.speed+13<prev.speed && current.speed>15)cue("impact",1500);
    }else if(gameId==="box_pro"){
      if(current.rival+2<prev.rival)cue("jab",100);
      if(current.hp+2<prev.hp)cue("impact",190);
      if(current.round>prev.round)cue("score",550);
      if(current.done&&!prev.done)cue(current.hp>current.rival?"win":"lose",1250);
    }else if(gameId==="tennis"){
      if(current.left>prev.left)cue("score",180);
      if(current.right>prev.right)cue("rival",180);
    }else if(gameId==="ar_truck_sim"){
      if(current.shots>prev.shots)cue("jab",90);
      if(current.kills>prev.kills)cue("collect",180);
      if(current.reloads>prev.reloads)cue("dock",300);
      if(current.hp+2<prev.hp)cue("impact",230);
    }else if(gameId==="usarmy_flight_sim"){
      if(current.hp+3<prev.hp)cue("impact",240);
      if(current.missiles>prev.missiles)cue("missile",350);
      if(prev.phase!=="VICTORY"&&current.phase==="VICTORY")cue("win",800);
    }
    context.snapshot=current;
  }
  function addStudioFrame(ctx,w,h,logic){
    if(!w||!h)return;
    const theme={
      drive:["rgba(75,176,245,.12)","rgba(7,18,40,.18)"],
      box_pro:["rgba(240,89,130,.12)","rgba(19,9,33,.16)"],
      tennis:["rgba(75,237,213,.08)","rgba(5,24,47,.16)"],
      ar_truck_sim:["rgba(111,185,246,.10)","rgba(4,19,37,.17)"],
      usarmy_flight_sim:["rgba(111,193,246,.10)","rgba(2,11,32,.16)"]
    }[gameId];
    // Premium vignette, not a full-screen opaque overlay or fake 3D render.
    if(!context.cache||context.cache.w!==w||context.cache.h!==h){
      const gradient=ctx.createRadialGradient(w*.5,h*.43,Math.min(w,h)*.17,w*.5,h*.45,Math.max(w,h)*.82);
      gradient.addColorStop(0,"rgba(0,0,0,0)");
      gradient.addColorStop(1,theme[1]);
      context.cache={w,h,gradient};
    }
    ctx.save();ctx.fillStyle=context.cache.gradient;ctx.fillRect(0,0,w,h);
    // A narrow ambient top glow gives depth but never covers players/controls.
    const g=ctx.createLinearGradient(0,0,w,0);
    g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(.5,theme[0]);g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=g;ctx.fillRect(0,0,w,Math.min(18,h*.025));
    if(gameId==="drive"&&logic.state==="RACE"&&logic.speed>50){
      // Motion marks along the outer edges, under 2% of width.
      const power=clamp((logic.speed-50)/170,0,.7);
      ctx.strokeStyle="rgba(198,243,255,"+(power*.23)+")";
      ctx.lineWidth=clamp(w*.002,1,2.5);
      for(let side of [0,1]){
        const x=side?w*.974:w*.026;
        for(let n=0;n<3;n++){
          const yy=(h*.35+n*h*.20+now()*.07)%h;
          ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x+(side?-1:1)*w*.012,yy+h*.045);ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
  const previous=new WeakMap();
  function mount(game){
    if(!game?.logic||previous.has(game.logic))return;
    const logic=game.logic,old=logic.update;
    if(typeof old!=="function")return;
    context.game=game;
    previous.set(logic,old);
    logic.update=function(ctx,w,h,...input){
      const output=old.call(this,ctx,w,h,...input);
      if(window.System?.activeGame===game){
        try{track(this);if(window.ArcadePlaySettings?.get().quality!=='low')addStudioFrame(ctx,w,h,this)}catch(error){
          if(!context.warned){console.warn("Studio visual/audio overlay indisponível:",error);context.warned=true}
        }
      }
      return output;
    };
  }
  const boot=()=>{
    const games=window.Games||[];
    const game=games.find(x=>x.id===gameId);
    if(game)mount(game);
    else if(!context.timer){
      let count=0;context.timer=setInterval(()=>{
        const found=(window.Games||[]).find(x=>x.id===gameId);
        if(found){clearInterval(context.timer);context.timer=null;mount(found)}
        else if(++count>=24){clearInterval(context.timer);context.timer=null}
      },250);
    }
    if(document.getElementById("studio-audio-switch"))return;
    const button=document.createElement("button");
    button.type="button";button.id="studio-audio-switch";
    button.setAttribute("aria-label","Ativar ou silenciar efeitos sonoros");
    button.setAttribute("aria-pressed",String(context.enabled));
    const redraw=()=>{button.textContent=context.enabled?"♪ SOM ON":"♪ SOM OFF";button.title=context.enabled?"Silenciar sons extras (não altera a direção)":"Ativar sons extras (não altera a direção)";button.setAttribute("aria-pressed",String(context.enabled))};
    redraw();
    button.addEventListener("click",()=>{
      context.enabled=!context.enabled;
      try{localStorage.setItem(storageKey,context.enabled?"on":"off")}catch{}
      redraw();if(context.enabled){initAudio();cue("menu",30)}
    });
    document.body.appendChild(button);
    // Deliberately create sound context only on a user gesture.
    document.addEventListener("pointerdown",initAudio,{once:true,passive:true});
    document.addEventListener("keydown",initAudio,{once:true});
    document.addEventListener("visibilitychange",()=>{if(document.hidden)context.ctx?.suspend?.().catch(()=>{});else if(context.ctx&&context.enabled)context.ctx.resume().catch(()=>{})});
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();
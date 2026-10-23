/* Local solo sessions use the original games. No Firebase user or permissions are changed. */
(() => {
  'use strict';
  const id=window.CONSOLE_GAME_ID;
  if(!['drive','box_pro','tennis','ar_truck_sim','usarmy_flight_sim'].includes(id))return;
  const key='thia:solo:v1:'+id,token=new URLSearchParams(location.search).get('otVenue');
  const venue=parent!==window&&!!token&&token.length<=100;
  window.ConsoleMotionRuntime={promise:null,load(){
    if(this.promise)return this.promise;
    this.promise=(async()=>{
      for(const tag of document.querySelectorAll('script[data-motion-src]'))await new Promise((resolve,reject)=>{
        const script=document.createElement('script'),timer=setTimeout(()=>{script.remove();reject(Error('Tempo esgotado preparando a câmera'));},12000);
        script.src=tag.dataset.motionSrc;script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);script.remove();reject(Error('Sensor de movimento indisponível'));};document.head.append(script);
      });return true;
    })().catch(error=>{this.promise=null;console.warn(error.message);return false;});return this.promise;
  }};
  let cloudDB=window.DB,entry=null,savedProfile=null,resultHooked=false;
  const $=s=>document.querySelector(s);
  const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{return {}}};
  const practice=window.ConsolePractice={active:false,
    save(){
      if(!this.active||!window.Profile)return;
      const p=window.Profile;
      try{localStorage.setItem(key,JSON.stringify({version:1,username:p.username,xp:p.xp,level:p.level,coins:p.coins,arSave:p.arSave}));}catch{}
      p.updateUI?.();
    },
    async enter(name){
      if(this.active)return;
      const p=window.Profile,s=window.System,game=window.Games?.find(g=>g.id===id);
      if(!p||!s||!game){show('O jogo ainda está carregando. Tente novamente em instantes.');return;}
      savedProfile=JSON.parse(JSON.stringify({username:p.username,role:p.role,xp:p.xp,level:p.level,coins:p.coins,permissions:p.permissions,arSave:p.arSave}));
      cloudDB=window.DB||cloudDB;this.active=true;window.DB=null;
      const data=read();
      Object.assign(p,{username:String(name||data.username||'Jogador local').slice(0,32),role:'player',xp:Math.max(0,Number(data.xp)||0),level:Math.max(1,Math.min(100,Number(data.level)||1)),coins:Math.max(0,Number(data.coins)||0),permissions:{[id]:true}});
      p.arSave=data.arSave&&typeof data.arSave==='object'?data.arSave:{upgrades:{engine:1,battery:1,radar:1,chassis:1,scout:false}};
      await window.onload?.(); // Original canvas, detector and resize setup; auth is skipped only for this local session.
      s.playerId='local-'+crypto.randomUUID();
      for(const name of ['loading','auth-screen','menu-screen','result-screen','game-ui'])$('#'+name)?.classList.add('hidden');
      entry?.remove();entry=null;
      hookResult();p.updateUI();s.openPhases(game);
      if(!$('#solo-indicator')){
        const label=document.createElement('span');label.id='solo-indicator';label.textContent='SOLO · PROGRESSO NESTE APARELHO';
        label.style.cssText='display:block;pointer-events:none;color:#c8ead7;margin:0 0 10px;font:700 11px system-ui;text-align:center';$('#phase-grid').before(label);
      }
      if(venue)parent.postMessage({type:'ot-venue-playing',token},location.origin);
    },
    leave(){
      if(!this.active)return;
      this.save();window.System?.stopGame();this.active=false;window.DB=cloudDB;
      if(savedProfile)Object.assign(window.Profile,savedProfile);
      $('#solo-indicator')?.remove();
      if(venue){parent.postMessage({type:'ot-venue-close',token},location.origin);return;}
      for(const name of ['phase-screen','menu-screen','game-ui','result-screen'])$('#'+name)?.classList.add('hidden');
      $('#auth-screen')?.classList.remove('hidden');
      window.onload?.();
    }
  };
  function hookResult(){
    if(resultHooked)return;resultHooked=true;
    const original=window.System.gameOver;
    window.System.gameOver=function(score,won=true,coins=0){
      const system=window.System,game=system.activeGame,valid=practice.active&&game?.id===id&&!system.resultLocked&&Number.isFinite(score);
      const result=original.call(system,score,won,coins);
      if(valid){practice.save();if(venue)parent.postMessage({type:'ot-venue-result',token,score:Math.floor(score),won:!!won},location.origin);}
      return result;
    };
    // Tennis keeps its own final scoreboard instead of calling System.gameOver.
    // Observe its native, once-only result; never award that match a second time.
    const tennis=window.Games?.find(game=>game.id==='tennis')?.logic;
    if(id==='tennis'&&typeof tennis?.recordResult==='function'){
      const record=tennis.recordResult;
      tennis.recordResult=function(...args){
        const valid=practice.active&&!this.resultRecorded&&!this.isOnline&&window.System.activeGame?.logic===this&&
          Number.isFinite(this.score?.p1)&&Number.isFinite(this.score?.p2)&&Math.max(this.score.p1,this.score.p2)>=11&&Math.abs(this.score.p1-this.score.p2)>=2;
        const result=record.apply(this,args);
        if(valid&&this.resultRecorded){practice.save();if(venue)parent.postMessage({type:'ot-venue-result',token,score:Math.floor(this.score.p1*100),won:this.score.p1>this.score.p2},location.origin);}
        return result;
      };
    }
  }
  function show(message){
    if(practice.active)return;
    if(!entry){
      entry=document.createElement('section');entry.id='solo-entry';entry.setAttribute('aria-label','Entrar no jogo');
      entry.style.cssText='position:fixed;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:8000;max-width:430px;margin:auto;padding:14px;box-sizing:border-box;border:1px solid #73c9c2;border-radius:16px;background:#102d3ef5;color:#f1fff6;box-shadow:0 6px 26px #0005;font:14px system-ui;text-align:center';
      entry.innerHTML='<p style="margin:0 0 10px;line-height:1.4" data-solo-text>Você pode jogar sozinho neste aparelho. A conta online continua disponível.</p><button type="button" data-solo-start style="min-height:46px;width:100%;border:0;border-radius:10px;background:#a8e9ba;color:#102b32;font:800 15px system-ui">JOGAR SOZINHO</button>';
      entry.querySelector('button').onclick=()=>practice.enter();document.body.append(entry);
    }
    if(message)entry.querySelector('[data-solo-text]').textContent=message;
  }
  window.addEventListener('console:backend-ready',()=>{cloudDB=window.DB;if(practice.active)window.DB=null;});
  if(venue){
    window.addEventListener('message',e=>{
      if(e.source!==parent||e.origin!==location.origin||e.data?.token!==token)return;
      if(e.data.type==='ot-venue-start')practice.enter(e.data.name);
    });
    parent.postMessage({type:'ot-venue-ready',token},location.origin);
  }else{
    show();
    // A real signed-in account keeps its original permissions and cloud progress.
    const watch=setInterval(()=>{if(practice.active){clearInterval(watch);return;}if(window.AuthApp?.currentUser&&!$('#menu-screen')?.classList.contains('hidden')){entry?.remove();entry=null;clearInterval(watch);}},200);
    window.addEventListener('pagehide',()=>clearInterval(watch),{once:true});
  }
  if('serviceWorker' in navigator){
    let previousController=navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      const controller=navigator.serviceWorker.controller;
      if(previousController&&controller!==previousController&&!window.System?.activeGame){practice.save();const next=new URL(location.href);next.searchParams.set('game_update','20261023-1');location.replace(next.href);}
      previousController=controller;
    });
    const activate=registration=>{if(!window.System?.activeGame&&registration.waiting){practice.save();registration.waiting.postMessage({type:'SKIP_WAITING'});}};
    const ready=async()=>{
      try{
        const registration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
        const watch=worker=>worker?.addEventListener('statechange',()=>{if(worker.state==='installed')activate(registration);});
        watch(registration.installing);registration.addEventListener('updatefound',()=>watch(registration.installing));activate(registration);
        const timer=setInterval(()=>activate(registration),1000);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
      }catch(error){console.warn('Atualização do jogo adiada:',error.message);}
    };
    if(document.readyState==='complete')ready();else window.addEventListener('load',ready,{once:true});
  }
})();

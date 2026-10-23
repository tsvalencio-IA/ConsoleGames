/* Local solo sessions use the original games. No Firebase user or permissions are changed. */
(() => {
  'use strict';
  const id=window.CONSOLE_GAME_ID;
  if(!['drive','box_pro','tennis','ar_truck_sim','usarmy_flight_sim'].includes(id))return;
  const key='thia:solo:v1:'+id,token=new URLSearchParams(location.search).get('otVenue');
  const progressField=({drive:'kartSave',usarmy_flight_sim:'flightSave'})[id];
  const embeddedVenue=parent!==window&&!!token&&token.length<=100;
  const trip=parent===window?window.WorldVenueTrip?.current(token,id):null,pageVenue=!!token&&!!trip;
  const venue=embeddedVenue||pageVenue;
  function venueMessage(type,data={}){
    if(embeddedVenue)parent.postMessage({type,token,...data},location.origin);
    else if(pageVenue&&type==='ot-venue-result')window.WorldVenueTrip.result(token,id,data.score,data.won);
  }
  function returnToWorld(){const url=window.WorldVenueTrip?.returnUrl(token)||new URL('../otthi/',location.href).href;location.replace(url);}
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
  const restoreAccount=()=>{
    if(!savedProfile)return;
    Object.assign(window.Profile,savedProfile);
    if(progressField&&!Object.prototype.hasOwnProperty.call(savedProfile,progressField))delete window.Profile[progressField];
  };
  const practice=window.ConsolePractice={active:false,
    save(){
      if(!this.active||!window.Profile)return;
      const p=window.Profile;
      const record={version:1,username:p.username,playerId:window.System?.playerId,xp:p.xp,level:p.level,coins:p.coins,arSave:p.arSave};
      if(progressField)record[progressField]=p[progressField];
      try{localStorage.setItem(key,JSON.stringify(record));}catch{}
      p.updateUI?.();
    },
    async enter(name){
      if(this.active)return;
      const p=window.Profile,s=window.System,game=window.Games?.find(g=>g.id===id);
      if(!p||!s||!game){show('O jogo ainda está carregando. Tente novamente em instantes.');return;}
      savedProfile=JSON.parse(JSON.stringify({username:p.username,role:p.role,xp:p.xp,level:p.level,coins:p.coins,permissions:p.permissions,arSave:p.arSave,...(progressField?{[progressField]:p[progressField]}:{})}));
      cloudDB=window.DB||cloudDB;this.active=true;window.DB=null;
      const data=read();
      Object.assign(p,{username:String(name||data.username||'Jogador local').slice(0,32),role:'player',xp:Math.max(0,Number(data.xp)||0),level:Math.max(1,Math.min(100,Number(data.level)||1)),coins:Math.max(0,Number(data.coins)||0),permissions:{[id]:true}});
      p.arSave=data.arSave&&typeof data.arSave==='object'?data.arSave:{upgrades:{engine:1,battery:1,radar:1,chassis:1,scout:false}};
      if(progressField)p[progressField]=data[progressField]&&typeof data[progressField]==='object'?JSON.parse(JSON.stringify(data[progressField])):null;
      await window.onload?.(); // Original canvas, detector and resize setup; auth is skipped only for this local session.
      s.playerId=/^local-[a-zA-Z0-9-]{16,80}$/.test(data.playerId||'')?data.playerId:'local-'+crypto.randomUUID();
      this.save();
      for(const name of ['loading','auth-screen','menu-screen','result-screen','game-ui'])$('#'+name)?.classList.add('hidden');
      entry?.remove();entry=null;
      hookResult();p.updateUI();s.openPhases(game);
      if(!$('#solo-indicator')){
        const label=document.createElement('span');label.id='solo-indicator';label.textContent='SOLO · PROGRESSO NESTE APARELHO';
        label.style.cssText='display:block;pointer-events:none;color:#c8ead7;margin:0 0 10px;font:700 11px system-ui;text-align:center';$('#phase-grid').before(label);
      }
      if(venue)venueMessage('ot-venue-playing');
    },
    account(){
      this.save();window.System?.stopGame();this.active=false;window.DB=cloudDB;
      restoreAccount();
      $('#solo-indicator')?.remove();
      for(const name of ['loading','phase-screen','menu-screen','game-ui','result-screen'])$('#'+name)?.classList.add('hidden');
      $('#auth-screen')?.classList.remove('hidden');window.onload?.();
    },
    leave(){
      if(!this.active)return;
      if(pageVenue){this.save();window.System?.stopGame();returnToWorld();return;}
      this.save();window.System?.stopGame();this.active=false;window.DB=cloudDB;
      restoreAccount();
      $('#solo-indicator')?.remove();
      if(venue){venueMessage('ot-venue-close');return;}
      for(const name of ['phase-screen','menu-screen','game-ui','result-screen'])$('#'+name)?.classList.add('hidden');
      $('#auth-screen')?.classList.remove('hidden');
      window.onload?.();
    }
  };
  function hookResult(){
    if(resultHooked)return;resultHooked=true;
    const original=window.System.gameOver;
    window.System.gameOver=function(score,won=true,coins=0){
      const system=window.System,game=system.activeGame,valid=(practice.active||venue)&&game?.id===id&&!system.resultLocked&&Number.isFinite(score);
      const result=original.call(system,score,won,coins);
      if(valid){practice.save();if(venue)venueMessage('ot-venue-result',{score:Math.floor(score),won:!!won});}
      return result;
    };
    // Tennis keeps its own final scoreboard instead of calling System.gameOver.
    // Observe its native, once-only result; never award that match a second time.
    const tennis=window.Games?.find(game=>game.id==='tennis')?.logic;
    if(id==='tennis'&&typeof tennis?.recordResult==='function'){
      const record=tennis.recordResult;
      tennis.recordResult=function(...args){
        const valid=(practice.active||venue)&&!this.resultRecorded&&window.System.activeGame?.logic===this&&
          Number.isFinite(this.score?.p1)&&Number.isFinite(this.score?.p2)&&Math.max(this.score.p1,this.score.p2)>=11&&Math.abs(this.score.p1-this.score.p2)>=2;
        const result=record.apply(this,args);
        if(valid&&this.resultRecorded){practice.save();if(venue)venueMessage('ot-venue-result',{score:Math.floor(this.score.p1*100),won:this.score.p1>this.score.p2});}
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
  if(pageVenue){
    const surface=document.createElement('main');surface.id='venue-game-surface';surface.style.cssText='position:fixed;inset:48px 0 0;transform:translateZ(0);overflow:hidden';
    for(const node of [...document.body.children])if(!['SCRIPT','STYLE','LINK'].includes(node.tagName))surface.append(node);
    document.body.prepend(surface);
    const header=document.createElement('header');header.id='venue-trip-header';header.style.cssText='position:fixed;inset:0 0 auto;min-height:48px;box-sizing:border-box;z-index:20000;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 10px;background:#213e51;color:#f1f6ee;font:700 12px system-ui';
    const title=document.createElement('span');title.textContent=trip.label;
    const back=document.createElement('button');back.type='button';back.dataset.venueReturn='';back.textContent='VOLTAR AO MUNDO';back.style.cssText='min-height:40px;border:1px solid #8dc6bc;border-radius:9px;padding:6px 10px;background:#305e6a;color:#fff;font:800 11px system-ui';
    back.onclick=()=>{practice.save();window.System?.stopGame();returnToWorld();};const account=document.createElement('button');account.type='button';account.dataset.venueAccount='';account.textContent='CONTA ONLINE';account.style.cssText=back.style.cssText;
    title.style.cssText='flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
    account.onclick=async()=>{if(practice.active){practice.account();account.textContent='JOGAR SOLO';}else{await practice.enter(trip.name);account.textContent='CONTA ONLINE';}};
    header.append(title,account,back);document.body.append(header);
    document.querySelectorAll('.arcade-return').forEach(el=>el.hidden=true);
    const resize=window.System.resize;window.System.resize=()=>{resize();const r=surface.getBoundingClientRect();if(window.System.canvas){window.System.canvas.width=Math.round(r.width);window.System.canvas.height=Math.round(r.height);}};
    practice.enter(trip.name).catch(error=>show('Não foi possível preparar a atividade. Volte ao mundo e tente novamente.'));
    window.addEventListener('pagehide',()=>{practice.save();window.System?.stopGame();});
    window.addEventListener('pageshow',event=>{if(event.persisted){if(window.WorldVenueTrip?.current(token,id))location.reload();else returnToWorld();}});
  }else if(embeddedVenue){
    window.addEventListener('message',e=>{
      if(e.source!==parent||e.origin!==location.origin||e.data?.token!==token)return;
      if(e.data.type==='ot-venue-start')practice.enter(e.data.name);
    });
    venueMessage('ot-venue-ready');
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

/**
 * OTTHI World Edu V643 — módulo-fonte
 * Arquivo: 03-ui-modal-install-pwa.js
 * Escopo: Economia, flags, telas, modais, feedback, instalação e PWA
 * Linhas de origem V642: 397-658
 *
 * Este arquivo é compilado em app.js por tools/build_project.py.
 * Não deve ser carregado diretamente por index.html.
 */
// @otthi-module-body
  function addXP(amount) {
    state.profile.xp += Math.max(0, Math.round(amount));
    const nextLevel = Math.floor(state.profile.xp / 1000) + 1;
    if (nextLevel > state.profile.level) {
      state.profile.level = nextLevel;
      toast(`Nível ${nextLevel}!`, 'good');
      awardMedal(`Nível ${nextLevel}`);
    }
    saveState();
    updateHUD();
  }
  function addCoins(amount) {
    state.profile.coins = Math.max(0, state.profile.coins + Math.round(amount));
    saveState(); updateHUD();
  }
  function addReputation(amount) {
    state.profile.reputation = Math.max(0, state.profile.reputation + Math.round(amount));
    saveState(); updateHUD();
  }
  function awardMedal(name) {
    if (state.medals.includes(name)) return;
    state.medals.push(name);
    toast(`🏅 ${name}`, 'good');
    saveState();
  }
  function setFlag(flag, value = true) {
    if (state.flags[flag] === value) return;
    state.flags[flag] = value;
    evaluateMissions();
    saveState();
  }

  function showScreen(name) {
    els.lobby.classList.toggle('active', name === 'lobby');
    els.game.classList.toggle('active', name === 'game');
    queueMicrotask(() => typeof updateInstallUI === 'function' && updateInstallUI());
  }
  function toast(text, type = 'good', ms = 1700) {
    els.toast.textContent = text;
    els.toast.className = `toast show ${type}`;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => els.toast.classList.remove('show'), ms);
  }
  function vibrate(pattern = 30) {
    if (state.settings.vibration && navigator.vibrate) navigator.vibrate(pattern);
  }
  function beep(freq = 500, duration = 70, type = 'square') {
    if (!state.settings.sound) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = beep.ctx?.state !== 'closed' && beep.ctx || (beep.ctx = window.GameAudio?.context() || new Ctx());
      if(ctx.state !== 'running')ctx.resume().catch(()=>{});
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t=ctx.currentTime,end=t+Math.max(.02,duration/1000);
      osc.type=type;osc.frequency.value=freq;gain.gain.value=0;
      osc.connect(gain);gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.025,t+.006);gain.gain.linearRampToValueAtTime(0,end);
      osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start(t);osc.stop(end+.005);
    } catch {}
  }

  // AÇÃO opens on pointerdown. Its release must not activate a showroom
  // card that appears beneath the same finger in the newly opened modal.
  let modalGestureStartedOutside=false;
  document.addEventListener('pointerdown',()=>{modalGestureStartedOutside=els.modal.hidden;},true);
  els.modal.addEventListener('click',event=>{if(modalGestureStartedOutside&&event.detail!==0){modalGestureStartedOutside=false;event.preventDefault();event.stopImmediatePropagation();}},true);
  function openModal(title, html, onReady) {
    els.modal.classList.remove('atlas-modal');
    state.ui.quickOpen = false;
    if (els.quickBar) els.quickBar.hidden = true;
    els.quickToggleBtn?.classList.remove('active');
    input.keys?.clear?.();
    input.targetX = input.targetZ = input.x = input.z = 0;
    if (typeof player !== 'undefined' && player.vehicle) player.car.speed *= .7;
    els.modalTitle.textContent = title;
    els.modalBody.innerHTML = html;
    els.modal.hidden = false;
    document.body.classList.add('modal-open');
    els.game?.setAttribute('aria-hidden', 'true');
    window.GameAccountAccess?.enhance(els.modalBody);
    if (onReady) onReady(els.modalBody);
    requestAnimationFrame(()=>{els.modalBody.scrollTop=0;scheduleStableResize(0,true);});
  }
  function closeModal() {
    clearExtensionPreview();
    if (typeof fishingSession !== 'undefined' && fishingSession) cancelFishingSession();
    else if (typeof fishingVisual !== 'undefined' && fishingVisual?.active) stopFishingVisual();
    const resumePausedGame = pauseMenuOpen;
    els.modal.hidden = true;
    els.modal.classList.remove('map-modal','atlas-modal','fishing-modal');
    els.modalBody.innerHTML = '';
    document.body.classList.remove('modal-open');
    els.game?.removeAttribute('aria-hidden');
    input.keys?.clear?.();
    input.targetX = input.targetZ = input.x = input.z = 0;
    if (resumePausedGame) {
      pauseMenuOpen = false;
      paused = false;
      if (running && player.vehicle) startEngineSound();
    }
  }
  function confirmModal(title, text, yesLabel = 'Sim', noLabel = 'Não') {
    return new Promise(resolve => {
      openModal(title, `<p>${text}</p><div class="modal-actions"><button class="btn primary" data-yes>${yesLabel}</button><button class="btn" data-no>${noLabel}</button></div>`, root => {
        $('[data-yes]', root).onclick = () => { closeModal(); resolve(true); };
        $('[data-no]', root).onclick = () => { closeModal(); resolve(false); };
      });
    });
  }
  els.modalClose.onclick = closeModal;
  els.modal.addEventListener('pointerdown', e => { if (e.target === els.modal) closeModal(); });

  /* PWA — instalação aparece somente no lobby e apenas quando realmente disponível */
  let deferredInstallPrompt = null;
  const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true || safeLocalGet('otthos_installed') === '1';
  function updateInstallUI() {
    const installed = isStandalone();
    const canInstall = !installed && !!deferredInstallPrompt;
    // O botão permanece visível enquanto o aplicativo não estiver instalado.
    // Quando o navegador não oferece o prompt automático, ele abre as instruções manuais.
    if (els.installBtn) {
      els.installBtn.hidden = installed;
      els.installBtn.classList.toggle('install-ready', canInstall);
      els.installBtn.setAttribute('aria-label', canInstall ? 'Instalar OTTHOS agora' : 'Ver como instalar OTTHOS');
    }
    if (els.installHint) {
      els.installHint.hidden = installed;
      els.installHint.textContent = canInstall ? 'Toque para instalar com o ícone OTTHOS.' : 'Toque em Instalar para adicionar o OTTHOS ao celular.';
    }
    document.documentElement.classList.toggle('app-installed', installed);
  }
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallUI();
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    safeLocalSet('otthos_installed', '1');
    updateInstallUI();
    toast('Aplicativo instalado!', 'good');
  });
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', updateInstallUI);
  async function installApp() {
    if (isStandalone()) { updateInstallUI(); return; }
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      updateInstallUI();
      return;
    }
    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    openModal('Instalar aplicativo', isiOS
      ? '<p>No iPhone/iPad, toque em <b>Compartilhar</b> e escolha <b>Adicionar à Tela de Início</b>.</p>'
      : '<p>No Chrome, abra o menu ⋮ e escolha <b>Instalar aplicativo</b> ou <b>Adicionar à tela inicial</b>.</p>');
  }
  if (els.installBtn) els.installBtn.onclick = installApp;
  const OTTHI_UPDATE_INTERVAL_MS = 60 * 1000;
  let otthiUpdateReloading = false;
  let otthiPendingUpdateToken = '';
  let otthiUpdateNoticeAt = 0;
  function safeOtthiUpdatePoint(){
    return !running || (!player.vehicle&&!player.boating&&!player.transit?.mode&&!(typeof otGames!=='undefined'&&otGames.active)&&!(typeof worldVenues!=='undefined'&&worldVenues.session)&&!(typeof characterActivities!=='undefined'&&characterActivities.session)&&!(typeof civilMissions!=='undefined'&&civilMissions.task)&&!(typeof fishingSession!=='undefined'&&fishingSession)&&!buildMode&&Math.hypot(player.vx||0,player.vz||0)<.1&&(paused||els.modal.hidden));
  }
  function queueOtthiUpdate(token){
    otthiPendingUpdateToken=String(token||Date.now());
    if(safeOtthiUpdatePoint())return reloadForOtthiUpdate(otthiPendingUpdateToken);
    if(Date.now()-otthiUpdateNoticeAt>15000){otthiUpdateNoticeAt=Date.now();toast('Atualização pronta. Será aplicada ao parar fora do veículo, preservando o progresso.','good',3500);}return false;
  }
  setInterval(()=>{if(otthiPendingUpdateToken&&!otthiUpdateReloading&&safeOtthiUpdatePoint())reloadForOtthiUpdate(otthiPendingUpdateToken);},1200);
  let otthiLastUpdateCheck = 0;
  let otthiServiceWorkerRegistration = null;
  let otthiWorkerRegistrationPromise = null;
  let otthiAvailableRelease = null;
  const OTTHI_REPAIR_KEY = 'otthi:startup-repair:'+location.pathname;
  // Listen before any worker can activate, including while other page scripts load.
  if ('serviceWorker' in navigator) {
    let previousController=navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      const next=navigator.serviceWorker.controller;
      if((previousController&&next!==previousController)||!window.OTTHI_RELEASE_COHERENT)queueOtthiUpdate('worker-'+OTTHI_GAME_WEB_BUILD);
      next?.postMessage({type:'OTTHI_CACHE_OPTIONAL'});
      previousController=next;
    });
  }

  function isOfficialOtthiGameAddress() {
    try {
      const live = new URL(OTTHI_GAME_LIVE_BASE);
      const current = new URL(location.href);
      return current.origin === live.origin
        && (current.pathname === live.pathname || current.pathname.startsWith(live.pathname));
    } catch {
      return false;
    }
  }

  async function persistBeforeOtthiReload() {
    await dbReady;
    try { await saveState(true); } catch {}
    try { await lastSavePromise; } catch {}
  }

  async function openOtthiUpdateRecovery(){
    if(otthiUpdateReloading)return true;
    if(!navigator.onLine){toast('Conecte-se à internet para atualizar. Seu jogo continua disponível.','warn',3000);return false;}
    otthiUpdateReloading=true;
    try{
      await dbReady;
      clearMovementInputs();
      if(typeof otGames!=='undefined'&&otGames.active)otGamesLeave({preserveCampaign:true});
      if(typeof worldVenues!=='undefined'&&worldVenues.session)venueClose();
      if(running)savePlayerPosition(true);await persistBeforeOtthiReload();
      location.replace(new URL('../atualizar/',OTTHI_GAME_LIVE_BASE).href);return true;
    }catch(error){otthiUpdateReloading=false;toast('Não foi possível guardar a atualização. Tente novamente.','warn',3000);return false;}
  }

  async function ensureCurrentOtthiBeforePlay(){
    if(!navigator.onLine||!isOfficialOtthiGameAddress())return false;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
    try{
      const url=new URL('release-manifest.json',OTTHI_GAME_LIVE_BASE);url.searchParams.set('otthi_probe',String(Date.now()));
      const response=await fetch(url,{cache:'no-store',credentials:'same-origin',signal:controller.signal});if(!response.ok)return false;
      const release=await response.json();if(release?.algorithm!=='SHA-256'||!release.build||!release.revision)return false;
      if(release.build!==OTTHI_GAME_WEB_BUILD||release.revision!==OTTHI_RELEASE_REVISION){otthiAvailableRelease=release;return openOtthiUpdateRecovery();}
    }catch{}finally{clearTimeout(timer);}return false;
  }

  async function reloadForOtthiUpdate(buildToken) {
    if (otthiUpdateReloading) return false;
    otthiUpdateReloading = true;
    await persistBeforeOtthiReload();
    const target = new URL(location.href);
    target.searchParams.set('otthi_update', buildToken || String(Date.now()));
    target.searchParams.set('otthi_probe', String(Date.now()));
    location.replace(target.href);
    return true;
  }

  async function probeOtthiGameUpdate(force = false) {
    if (!isOfficialOtthiGameAddress() || !navigator.onLine || otthiUpdateReloading) return false;
    const now = Date.now();
    if (!force && now - otthiLastUpdateCheck < OTTHI_UPDATE_INTERVAL_MS) return false;
    otthiLastUpdateCheck = now;
    try {
      const probe = new URL('release-manifest.json', OTTHI_GAME_LIVE_BASE);
      probe.searchParams.set('otthi_probe', String(now));
      const response = await fetch(probe.href, { cache:'no-store', credentials:'same-origin' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const release = await response.json();
      const remoteBuild = String(release?.build || '');
      const remoteRevision = String(release?.revision || '');
      if ((remoteBuild && remoteBuild !== OTTHI_GAME_WEB_BUILD)
        || (remoteRevision && remoteRevision !== OTTHI_RELEASE_REVISION)) {
        otthiAvailableRelease={build:remoteBuild,revision:remoteRevision};
        const label=document.getElementById('gameUpdateStatus');if(label)label.textContent='Nova versão disponível';
        if (!otthiServiceWorkerRegistration) {
          return queueOtthiUpdate(remoteRevision || remoteBuild);
        }
        await otthiServiceWorkerRegistration?.update?.().catch(() => {});
        if (otthiServiceWorkerRegistration?.waiting) {
          otthiServiceWorkerRegistration.waiting.postMessage({ type:'SKIP_WAITING' });
        }
        toast('Atualização encontrada. Ela será aplicada quando todos os arquivos forem validados.','good',3200);
        return true;
      }
    } catch (error) {
      console.warn('[OTTHI UPDATE] Verificação adiada:', error?.message || error);
    }
    return false;
  }

  async function registerOtthiGameUpdates() {
    if (!('serviceWorker' in navigator) || !isOfficialOtthiGameAddress()) return;
    if(otthiWorkerRegistrationPromise)return otthiWorkerRegistrationPromise;
    otthiWorkerRegistrationPromise=(async()=>{
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', {
        scope: './',
        updateViaCache: 'none'
      });
      otthiServiceWorkerRegistration = registration;
      registration.active?.postMessage({type:'OTTHI_CACHE_OPTIONAL'});
      const watched=new WeakSet(),watch=worker=>{
        if(!worker||watched.has(worker))return;watched.add(worker);
        const ready=()=>{if(worker.state==='installed')worker.postMessage({type:'SKIP_WAITING'});};
        worker.addEventListener('statechange', () => {
          ready();
        });
        ready();
      };
      if (registration.waiting) registration.waiting.postMessage({ type:'SKIP_WAITING' });
      watch(registration.installing);
      registration.addEventListener('updatefound',()=>watch(registration.installing));
      await registration.update().catch(() => {});
      setTimeout(() => probeOtthiGameUpdate(true), 1800);
      setInterval(() => {
        registration.update().catch(() => {});
        probeOtthiGameUpdate(false);
      }, OTTHI_UPDATE_INTERVAL_MS);
      return registration;
    } catch (error) {
      otthiWorkerRegistrationPromise=null;
      console.warn('[OTTHI UPDATE] Service Worker indisponível:', error?.message || error);
    }
    })();
    return otthiWorkerRegistrationPromise;
  }

  async function repairOtthiStartup(manual=false){
    const mark=OTTHI_GAME_WEB_BUILD+':'+OTTHI_RELEASE_REVISION;
    let attempts=0;try{const previous=JSON.parse(sessionStorage.getItem(OTTHI_REPAIR_KEY)||'null');if(previous?.mark===mark)attempts=previous.attempts||0;}catch{}
    if(manual)attempts=0;
    const failed=()=>openModal('Não foi possível atualizar',`<div class="parent-gate"><h3>O jogo não terminou de carregar</h3><p>Seu progresso continua neste aparelho. Confira a conexão e tente novamente.</p><button class="btn primary xl" data-coherence-reload>Tentar novamente</button></div>`,root=>{$('[data-coherence-reload]',root).onclick=()=>repairOtthiStartup(true);});
    if(attempts>=2||!navigator.onLine){failed();return;}
    try{sessionStorage.setItem(OTTHI_REPAIR_KEY,JSON.stringify({mark,attempts:attempts+1}));}catch{}
    openModal('Atualizando o jogo','<div class="parent-gate"><h3>Preparando a versão completa…</h3><p>Seu progresso está preservado. Aguarde alguns instantes.</p></div>');
    try{
      const registration=await registerOtthiGameUpdates();
      const worker=registration?.installing||registration?.waiting;
      if(worker&&worker.state!=='activated'&&worker.state!=='redundant')await new Promise(resolve=>{
        const done=()=>{clearTimeout(timer);worker.removeEventListener('statechange',change);resolve();};
        const change=()=>{if(worker.state==='activated'||worker.state==='redundant')done();};
        const timer=setTimeout(done,20000);worker.addEventListener('statechange',change);change();
      });
      await reloadForOtthiUpdate('repair-'+OTTHI_RELEASE_REVISION);
    }catch{failed();}
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', registerOtthiGameUpdates, { once:true });
  }
  window.addEventListener('offline', () => toast('Sem internet. O progresso continua salvo neste aparelho.','warn',3200), { passive:true });
  window.addEventListener('online', () => {
    toast('Conexão restabelecida. Sincronizando com segurança.','good',2600);
    probeOtthiGameUpdate(true);
  }, { passive:true });
  window.addEventListener('pageshow', () => probeOtthiGameUpdate(true), { passive:true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {otthiServiceWorkerRegistration?.update?.().catch(()=>{});probeOtthiGameUpdate(true);}
  });
  updateInstallUI();
  const updateButton=document.getElementById('updateGameBtn');if(updateButton)updateButton.onclick=openOtthiUpdateRecovery;
  const versionLabel=document.getElementById('gameUpdateStatus');if(versionLabel)versionLabel.textContent='Versão '+OTTHI_GAME_WEB_BUILD;
  window.OTTHI_UPDATES={check:()=>probeOtthiGameUpdate(true),repair:openOtthiUpdateRecovery,diagnostics:()=>({build:OTTHI_GAME_WEB_BUILD,revision:OTTHI_RELEASE_REVISION,available:otthiAvailableRelease,pending:!!otthiPendingUpdateToken,reloading:otthiUpdateReloading})};
  if (!window.OTTHI_RELEASE_COHERENT) {
    setTimeout(()=>repairOtthiStartup(),0);
  } else if (!navigator.onLine) {
    setTimeout(() => toast('Modo offline ativo. Seu progresso será sincronizado quando a internet voltar.','warn',3200), 400);
  }
  if(window.OTTHI_RELEASE_COHERENT){
    try{sessionStorage.removeItem(OTTHI_REPAIR_KEY);const clean=new URL(location.href);if(clean.searchParams.has('otthi_probe')){clean.searchParams.delete('otthi_probe');history.replaceState(null,'',clean.href);}}catch{}
  }


  const DAILY_QUEST_POOL=[
    {id:'walk',icon:'👟',title:'Explorador da Vila',target:180,reward:90,xp:50,label:n=>`${Math.floor(n)}/180 m caminhando`},
    {id:'drive',icon:'🚗',title:'Piloto da Vila',target:260,reward:120,xp:70,label:n=>`${Math.floor(n)}/260 m dirigindo`},
    {id:'jump',icon:'⬆',title:'Pula-pula',target:12,reward:70,xp:45,label:n=>`${Math.floor(n)}/12 pulos`},
    {id:'collect',icon:'💎',title:'Caçador de Tesouros',target:5,reward:95,xp:60,label:n=>`${Math.floor(n)}/5 itens coletados`},
    {id:'talk',icon:'💬',title:'Amigo da Vizinhança',target:3,reward:80,xp:50,label:n=>`${Math.floor(n)}/3 conversas`},
    {id:'cook',icon:'🍳',title:'Chef da Vila',target:1,reward:75,xp:45,label:n=>`${Math.floor(n)}/1 refeição`},
    {id:'race',icon:'🏁',title:'Competidor',target:1,reward:130,xp:80,label:n=>`${Math.floor(n)}/1 corrida concluída`},
    {id:'metro',icon:'Ⓜ️',title:'Rede Metropolitana',target:2,reward:110,xp:65,label:n=>`${Math.floor(n)}/2 viagens de metrô`},
    {id:'bus',icon:'🚌',title:'Passageiro da Cidade',target:3,reward:105,xp:60,label:n=>`${Math.floor(n)}/3 paradas de ônibus`},
    {id:'skill',icon:'✨',title:'Mestre das Skills',target:3,reward:120,xp:75,label:n=>`${Math.floor(n)}/3 skills avançadas`}
  ];

/* thIAguinho ARCADE CONSOLE — instalação independente
   Base isolada em /ConsoleGames/arcade/; mantém fontes e Firebase existentes.
   thIAguinho GAME CONSOLE
   Catálogo verificado em 2026-10-20 nos arquivos originais.
   Este arquivo nunca grava nos bancos dos jogos. */
(() => {
  "use strict";
  const BASE = "../games/";
  const REPO_BASE = "https://github.com/tsvalencio-IA/";
  const entries = Object.freeze([
    { id:"otthi", title:"OTThi World", category:"aventura", categoryLabel:"Mundo aberto", short:"Crie sua vida na Vila do Sol, explore bairros, aprenda e encontre amigos.", icon:"🏡", coverA:"#123c75", coverB:"#1f8ca3", source:"OTThi-World3", url:BASE+"otthi/", tint:"#6ee9fe", destination:"direct" },
    { id:"familia", title:"Aventuras em Família 3D", category:"aventura", categoryLabel:"Universo 3D", short:"Corra pelo parque, brinque com Luna e Liz e descubra estrelas e desafios.", icon:"🌳", coverA:"#17554b", coverB:"#367b96", source:"hq", url:BASE+"familia/3d/", tint:"#8af2bf", destination:"direct" },
    { id:"kart", title:"Kart Legends", category:"acao", categoryLabel:"Corrida", short:"Acelere, faça curvas, use o turbo e conquiste o primeiro lugar.", icon:"🏎️", coverA:"#67404b", coverB:"#c06b36", source:"GAME", url:BASE+"kart/", tint:"#ffd18d", destination:"direct" },
    { id:"boxe", title:"Boxing Pro", category:"acao", categoryLabel:"Esporte com câmera", short:"Lute usando a câmera ou os botões de toque. Defenda, ataque e vença o campeonato.", icon:"🥊", coverA:"#72364b", coverB:"#af435e", source:"GAME", url:BASE+"boxe/", tint:"#ffc1be", destination:"direct" },
    { id:"tenis", title:"Ping Pong Wii", category:"acao", categoryLabel:"Tênis de mesa", short:"Dispute rallies usando o dedo ou a câmera e vença partidas desafiadoras.", icon:"🏓", coverA:"#184c65", coverB:"#3b8ca0", source:"GAME", url:BASE+"tenis/", tint:"#7de7f6", destination:"direct" },
    { id:"ar", title:"AR Ops Premium", category:"acao", categoryLabel:"Realidade aumentada", short:"Missão em realidade aumentada com câmera e desafios interativos.", icon:"🚀", coverA:"#533d75", coverB:"#8464ab", source:"GAME", url:BASE+"ar/", tint:"#ddbefc", destination:"direct" },
    { id:"voo", title:"Aero Strike WAR", category:"acao", categoryLabel:"Simulador de voo", short:"Missões aéreas e campanha com aeronaves e objetivos.", icon:"✈️", coverA:"#21486b", coverB:"#3c5baa", source:"GAME", url:BASE+"voo/", tint:"#a7c9ff", destination:"direct" }
  ]);

  const FAVORITES_KEY = "thiaguinho-console:v1:favorites";
  const HISTORY_KEY = "thiaguinho-console:v1:recent";
  const store = {
    read(key, fallback) { try { const raw=localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } },
    write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* armazenamento indisponível: interface continua jogável */ } }
  };
  const valid = new Set(entries.map(game=>game.id));
  const initialFavorites=store.read(FAVORITES_KEY,[]);
  const state = {
    filter:"todos", query:"",
    favorites:new Set(Array.isArray(initialFavorites) ? initialFavorites.filter(id=>valid.has(id)) : []),
    cloudUser:null, cloudProfile:null, cloudProgress:null,
    cloudStatus:"visitor", firebaseReady:false, authBusy:false
  };
  const $ = id => document.getElementById(id);
  const grid=$("games-grid"), filters=[...document.querySelectorAll("[data-filter]")], sections=[...document.querySelectorAll("[data-section]")];
  let auth=null, db=null, deferredInstall=null, firebaseInit=null;

  function gameById(id) { return entries.find(game=>game.id===id); }
  function matches(game) {
    if(state.filter==="favoritos" && !state.favorites.has(game.id)) return false;
    if(state.filter!=="todos" && state.filter!=="favoritos" && game.category!==state.filter) return false;
    const term=state.query.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    if(!term) return true;
    return [game.title,game.categoryLabel,game.short,game.source].some(str=>str.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(term));
  }
  function el(tag, className, text) {
    const node=document.createElement(tag);
    if(className) node.className=className;
    if(text!==undefined) node.textContent=text;
    return node;
  }
  function renderCard(game) {
    const article=el("article","game-card");
    article.dataset.game=game.id;
    const cover=el("div","game-cover");
    cover.style.setProperty("--cover-a",game.coverA);
    cover.style.setProperty("--cover-b",game.coverB);
    const art=el("img","cover-art");
    art.src="../covers/"+game.id+".svg";
    art.alt="";
    art.loading="lazy";
    art.decoding="async";
    art.addEventListener("load",()=>{if(art.naturalWidth>0)cover.classList.add("has-art")},{once:true});
    art.addEventListener("error",()=>art.remove(),{once:true});
    cover.append(art,el("span","cover-circle"), el("span","cover-icon",game.icon));
    const sticker=el("span","cover-sticker",game.destination==="menu" ? "NO MENU GAME" : "JOGUE NO CONSOLE");
    const fav=el("button","favorite-btn"+(state.favorites.has(game.id)?" is-favorite":""));
    fav.type="button"; fav.dataset.favorite=game.id; fav.setAttribute("aria-pressed",String(state.favorites.has(game.id)));
    fav.setAttribute("aria-label", (state.favorites.has(game.id)?"Remover dos favoritos: ":"Adicionar aos favoritos: ")+game.title);
    fav.title=state.favorites.has(game.id)?"Remover dos favoritos":"Adicionar aos favoritos";
    fav.textContent=state.favorites.has(game.id)?"♥":"♡";
    cover.append(sticker,fav);

    const detail=el("div","game-detail");
    const cat=el("span","game-category",game.categoryLabel);
    cat.style.color=game.tint;
    const title=el("h3","",game.title);
    const description=el("p","",game.short);
    const footer=el("div","game-foot");
    const source=el("a","origin", "↗ "+game.source);
    source.href=REPO_BASE+encodeURIComponent(game.source); source.target="_blank"; source.rel="noopener noreferrer";
    source.title="Ver código do projeto "+game.source;
    const play=el("a","game-open",game.destination==="menu"?"Abrir menu GAME ↗":"Jogar agora ↗");
    play.href=game.url; play.target="_self"; play.rel="noopener noreferrer"; play.dataset.launch=game.id;
    play.setAttribute("aria-label",(game.destination==="menu"?"Abrir menu do GAME para escolher ":"Jogar ")+game.title+" no console");
    footer.append(source,play);
    // Outcomes from the real game engine, stored locally under the original game ID.
    const originalIds={kart:"drive",boxe:"box_pro",tenis:"tennis",ar:"ar_truck_sim",voo:"usarmy_flight_sim"};
    if(originalIds[game.id]){
      const stats=store.read("console-games:v2:challenge:"+originalIds[game.id],{});
      const today=new Date(),ymd=[today.getFullYear(),String(today.getMonth()+1).padStart(2,"0"),String(today.getDate()).padStart(2,"0")].join("-");
      const goal=(game.id==="tenis"||game.id==="ar")?1:2;
      const current=stats?.day===ymd ? Math.max(0,Number(stats.dailyWins)||0) : 0;
      const challenge=el("div","game-challenge",(current>=goal?"✓ Concluído hoje • ":"✦ Desafio de hoje • ")+Math.min(current,goal)+"/"+goal+(game.id==="ar"?" missões":" vitórias"));
      detail.append(cat,title,description,challenge,footer);
    }else detail.append(cat,title,description,footer);
    article.append(cover,detail);
    return article;
  }
  function render() {
    const filtered=entries.filter(matches);
    const fragment=document.createDocumentFragment();
    filtered.forEach(game=>fragment.append(renderCard(game)));
    grid.replaceChildren(fragment);
    $("filtered-count").textContent=String(filtered.length).padStart(2,"0");
    $("favorite-count").textContent=state.favorites.size+" "+(state.favorites.size===1?"favorito":"favoritos");
    $("empty-state").hidden=filtered.length!==0;
    filters.forEach(button=>{
      const active=button.dataset.filter===state.filter;
      button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));
    });
    sections.forEach(button=>{
      const active=button.dataset.section===state.filter;
      button.classList.toggle("active",active);
      if(active)button.setAttribute("aria-current","page");else button.removeAttribute("aria-current");
    });
  }
  function setFilter(filter,shouldScroll=false) {
    if(!["todos","aventura","acao","favoritos"].includes(filter))return;
    state.filter=filter;render();
    if(shouldScroll) $("biblioteca").scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"start"});
  }
  function launch(id) {
    if(!valid.has(id))return;
    const list=store.read(HISTORY_KEY,[]);
    const next=[id,...(Array.isArray(list)?list.filter(x=>valid.has(x)&&x!==id):[])].slice(0,7);
    store.write(HISTORY_KEY,next);
  }
  function toggleFavorite(id) {
    if(!valid.has(id))return;
    if(state.favorites.has(id))state.favorites.delete(id);else state.favorites.add(id);
    store.write(FAVORITES_KEY,[...state.favorites]);render();
    const btn=grid.querySelector('[data-favorite="'+id+'"]');
    if(btn)btn.focus({preventScroll:true});
  }
  // Eventos por delegação: os cartões podem ser recriados sem perda de controles.
  grid.addEventListener("click",event=>{
    const favorite=event.target.closest("[data-favorite]");
    if(favorite){toggleFavorite(favorite.dataset.favorite);return;}
    const link=event.target.closest("[data-launch]");
    if(link)launch(link.dataset.launch);
  });
  document.querySelectorAll("[data-section]").forEach(button=>button.addEventListener("click",()=>setFilter(button.dataset.section,true)));
  filters.forEach(button=>button.addEventListener("click",()=>setFilter(button.dataset.filter)));
  $("search").addEventListener("input",event=>{state.query=event.target.value;render()});
  $("browse-btn").addEventListener("click",()=>$("biblioteca").scrollIntoView({behavior:"smooth"}));
  const history=store.read(HISTORY_KEY,[]);
  const recent=Array.isArray(history)?gameById(history.find(gameId=>valid.has(gameId))):null;
  const mainPlay=document.querySelector(".hero-actions [data-launch]");
  if(mainPlay && recent){
    mainPlay.href=recent.url;
    mainPlay.dataset.launch=recent.id;
    mainPlay.textContent="▶ Continuar "+recent.title+" ↗";
    mainPlay.setAttribute("aria-label","Continuar "+recent.title);
  }
  document.querySelectorAll(".hero-actions [data-launch]").forEach(link=>
    link.addEventListener("click",()=>launch(link.dataset.launch))
  );
  $("year").textContent=String(new Date().getFullYear());

  function setFeedback(message,isError=false) {
    const feedback=$("login-feedback");feedback.textContent=message;feedback.classList.toggle("is-error",isError);
  }
  function safeString(value,max=60) {return typeof value==="string" ? value.trim().slice(0,max) : "";}
  function updateAccountUI() {
    const logged=Boolean(state.cloudUser);
    const profile=state.cloudProfile;
    const display=safeString(profile?.name)||safeString(profile?.displayName)||safeString(profile?.username)||safeString(state.cloudUser?.displayName)||"Jogador";
    $("profile-name").textContent=logged?display:"Jogador";
    $("avatar").textContent=(logged ? display : "Jogador").slice(0,1).toLocaleUpperCase("pt-BR");
    $("profile-status").textContent=logged?"Conta OTThi":"Perfil local";
    $("account-state").replaceChildren(el("span","status-dot"),el("span","",logged?"Conectado à conta Firebase OTThi":"Modo visitante • dados locais"));
    $("login-form").hidden=logged;
    $("account-details").hidden=!logged;
    if(logged){
      $("account-summary").textContent="Conta autenticada. "+(profile?"Perfil do OTThi consultado com sucesso.":"Nenhum perfil OTThi disponível para esta conta.");
      const progress=state.cloudProgress;
      const facts=[];
      if(progress && typeof progress==="object"){
        if(Number.isFinite(progress.level))facts.push("Nível: "+progress.level);
        if(Number.isFinite(progress.coins))facts.push("Moedas: "+progress.coins);
        if(Number.isFinite(progress.medals))facts.push("Medalhas: "+progress.medals);
      }
      $("progress-summary").textContent=facts.length?facts.join(" • "):"Os dados de progresso do OTThi permanecem no banco original. Este console não os modifica.";
    }
  }
  function loadScript(src) {
    return new Promise((resolve,reject)=>{
      const s=document.createElement("script");
      s.src=src;s.async=true;
      const timeout=setTimeout(()=>{s.remove();reject(new Error("Tempo limite ao carregar Firebase."))},15000);
      s.onload=()=>{clearTimeout(timeout);resolve()};
      s.onerror=()=>{clearTimeout(timeout);s.remove();reject(new Error("Não foi possível carregar Firebase."))};
      document.head.append(s);
    });
  }
  function ensureFirebase() {
    if(state.firebaseReady)return Promise.resolve();
    if(firebaseInit)return firebaseInit;
    firebaseInit=initializeFirebase().catch(error=>{firebaseInit=null;throw error});
    return firebaseInit;
  }
  async function initializeFirebase() {
    if(!window.OTTHOS_FIREBASE_CONFIG?.enabled)throw new Error("Configuração do Firebase OTThi indisponível.");
    const cdn="https://www.gstatic.com/firebasejs/10.14.1/";
    if(!window.firebase?.initializeApp)await loadScript(cdn+"firebase-app-compat.js");
    if(!window.firebase?.auth)await loadScript(cdn+"firebase-auth-compat.js");
    if(!window.firebase?.database)await loadScript(cdn+"firebase-database-compat.js");
    const config=window.OTTHOS_FIREBASE_CONFIG;
    const app=window.firebase.apps.find(x=>x.name==="[DEFAULT]")||window.firebase.initializeApp({
      apiKey:config.apiKey,authDomain:config.authDomain,databaseURL:config.databaseURL,projectId:config.projectId,appId:config.appId,
      storageBucket:config.storageBucket,messagingSenderId:config.messagingSenderId
    });
    if(app.options.projectId!==config.projectId)throw new Error("Projeto Firebase diferente do OTThi. Conexão cancelada.");
    auth=app.auth();db=app.database();
    state.firebaseReady=true;
    auth.onAuthStateChanged(async user=>{
      state.cloudUser=user;state.cloudProfile=null;state.cloudProgress=null;
      if(user)await readOtthiData(user.uid);
      updateAccountUI();
    },()=>setFeedback("Não foi possível restaurar a sessão Firebase.",true));
  }
  async function readOtthiData(uid) {
    // Regras originais do OTThi permitem leitura somente ao dono autenticado.
    if(!db||!auth||auth.currentUser?.uid!==uid)return;
    const base="otthosWorld/users/"+uid;
    const reads=await Promise.allSettled([
      db.ref(base+"/profile").once("value"),
      db.ref(base+"/progress").once("value")
    ]);
    if(auth.currentUser?.uid!==uid)return;
    if(reads[0].status==="fulfilled")state.cloudProfile=reads[0].value.val();
    if(reads[1].status==="fulfilled")state.cloudProgress=reads[1].value.val();
    if(reads.every(result=>result.status==="rejected"))setFeedback("Conta conectada, mas não foi possível consultar seu progresso agora.",true);
  }
  function busy(flag) {
    state.authBusy=flag;$("login-btn").disabled=flag;
    $("login-btn").textContent=flag?"Conectando...":"Entrar com Firebase OTThi";
  }
  $("profile-btn").addEventListener("click",()=>{
    const d=$("profile-dialog");d.showModal();setFeedback("");
    // Carrega a SDK apenas quando alguém abre o perfil, poupando rede no acesso aos jogos.
    ensureFirebase().catch(e=>setFeedback("Consulta à conta OTThi indisponível. Você pode continuar usando os jogos e os favoritos. "+e.message,true));
  });
  $("login-form").addEventListener("submit",async event=>{
    event.preventDefault();
    if(state.authBusy)return;
    const email=$("email").value.trim(),password=$("password").value;
    if(!email||!password)return;
    busy(true);setFeedback("");
    try {
      await ensureFirebase();
      await auth.signInWithEmailAndPassword(email,password);
      $("password").value="";
      setFeedback("Acesso autorizado. Verificando seus dados OTThi...");
    }catch(e){
      // Não mostrar mensagens sensíveis do SDK ou credenciais.
      const known=["auth/invalid-credential","auth/wrong-password","auth/user-not-found","auth/invalid-email","auth/too-many-requests","auth/network-request-failed"];
      const msg=known.includes(e.code)?"Não foi possível entrar. Confira sua conta OTThi, senha e conexão.":"Não foi possível entrar. Verifique sua conexão e tente novamente.";
      setFeedback(msg,true);
    }finally{busy(false)}
  });
  $("logout-btn").addEventListener("click",async()=>{
    if(!auth)return;
    try{await auth.signOut();state.cloudUser=null;state.cloudProfile=null;state.cloudProgress=null;updateAccountUI();setFeedback("Sessão OTThi encerrada.");}catch{setFeedback("Não foi possível sair. Tente novamente.",true)}
  });
  window.addEventListener("beforeinstallprompt",event=>{
    event.preventDefault();deferredInstall=event;$("install-btn").hidden=false;
  });
  $("install-btn").addEventListener("click",async()=>{
    if(!deferredInstall)return;
    const prompt=deferredInstall;deferredInstall=null;
    $("install-btn").hidden=true;
    try{await prompt.prompt()}catch{ /* navegador decide suporte */ }
  });
  window.addEventListener("appinstalled",()=>{$("install-btn").hidden=true;deferredInstall=null});
  if("serviceWorker" in navigator && location.protocol==="https:"){
    window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}),{once:true});
  }
  updateAccountUI();render();
  // Diagnóstico somente leitura para testes; não altera jogos nem dados.
  Object.defineProperty(window,"THIAGUINHO_CONSOLE",{value:Object.freeze({
    version:"1.0.0",catalog:entries.map(({id,title,source,url,destination})=>({id,title,source,url,destination})),
    count:entries.length
  }),configurable:false,writable:false});
})();
/* thIAguinho ARCADE — escolha explícita: CONTROLES ou CÂMERA.
   Sem autorização automática de sensores. Mantém os IDs e Firebase originais.
   O modo manual usa os mesmos motores de jogo e os mesmos objetivos. */
(()=>{
"use strict";
const id=window.CONSOLE_GAME_ID;
const supported=new Set(["drive","box_pro","tennis","ar_truck_sim","usarmy_flight_sim"]);
if(!supported.has(id))return;
const key="thia-arcade:input-mode:"+id;
const $=(sel)=>document.querySelector(sel);
const hub={
 mode:null,buttons:null,activeId:id,
 choose(game){
  if(!game || game.id!==id)return Promise.resolve("controls");
  return new Promise(resolve=>{
   const overlay=document.createElement("section");
   overlay.className="input-mode-dialog";
   overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");
   overlay.setAttribute("aria-label","Escolha como jogar");
   const previous=document.activeElement;
   overlay.innerHTML='<div class="input-mode-panel"><div class="input-mode-eyebrow">thIAguinho ARCADE</div><h2>COMO VOCÊ QUER JOGAR?</h2><p>Você pode jogar sem câmera. Escolha a opção que preferir para esta partida.</p><div class="input-mode-options"><button type="button" data-mode="controls"><strong>🎮 CONTROLES</strong><small>Toque na tela ou use o teclado. Sem acesso à câmera.</small></button><button type="button" data-mode="camera"><strong>📷 CÂMERA</strong><small>Use seus movimentos. A câmera só será solicitada após esta escolha.</small></button></div><button type="button" data-mode="cancel" class="input-mode-cancel">VOLTAR ÀS FASES</button><span class="input-mode-foot">A escolha pode ser alterada antes da próxima partida.</span></div>';
   if(id==="ar_truck_sim"){overlay.querySelector('[data-mode="camera"] small').textContent="Combate com alvos virtuais sobre a câmera traseira. Use os joysticks para mover e mirar.";overlay.querySelector('[data-mode="controls"] small').textContent="Arena virtual, sem câmera. Dois joysticks e botões independentes.";}
   document.body.appendChild(overlay);
   const stored=(()=>{try{return localStorage.getItem(key)}catch{return null}})();
   const first=overlay.querySelector(stored==="camera"?'[data-mode="camera"]':'[data-mode="controls"]');
   first?.focus();
   let settled=false;
   const close=choice=>{
    if(settled)return;settled=true;
    overlay.remove();
    if(choice!=="cancel"){hub.mode=choice;try{localStorage.setItem(key,choice)}catch{}}
    if(previous?.isConnected)previous.focus({preventScroll:true});
    resolve(choice==="cancel"?null:choice);
   };
   overlay.addEventListener("click",e=>{const choice=e.target.closest("[data-mode]")?.dataset.mode;if(choice)close(choice)});
   overlay.addEventListener("keydown",e=>{
     if(e.key==="Escape"){e.preventDefault();close("cancel")}
     if(e.key==="Tab"){const a=[...overlay.querySelectorAll("button")];const pos=a.indexOf(document.activeElement);if(!e.shiftKey&&pos===a.length-1){e.preventDefault();a[0].focus()}else if(e.shiftKey&&pos===0){e.preventDefault();a.at(-1).focus()}}
   });
  });
 },
 setMode(mode){
  hub.mode=mode;
  if(mode==="controls")window.CONSOLE_FORCE_TOUCH_BOXE=true;
 },
 activate(game){
  if(!game||game.id!==id)return;
  hub.removeControls();
  const logic=game.logic;
  if(id==="ar_truck_sim"){hub.arControls(logic);return;}
  if(hub.mode!=="controls"){
   if(id==="box_pro")logic.touchMode=false;
   return;
  }
  if(id==="drive"){hub.kartControls(logic);return;}
  if(id==="box_pro"){
   logic.touchMode=true;
   window.CONSOLE_FORCE_TOUCH_BOXE=true;
   return;
  }
  if(id==="tennis"){
   logic.isOnline=false;
   logic.useMouse=true;
   logic.handedness="right";
   if(typeof logic.startGame==="function")logic.startGame();
   hub.showTip("ARRASTE PARA MOVER A RAQUETE • TOQUE PARA SACAR");
   return;
  }
  if(id==="usarmy_flight_sim"){hub.flightControls(logic);return;}
  if(id==="ar_truck_sim"){hub.arControls(logic);return;}
 },
 showTip(message){
  const n=document.createElement("div");n.className="input-mode-tip";n.textContent=message;
  document.body.append(n);
  hub.tip=n;
  hub.tipTimer=setTimeout(()=>{n.remove();hub.tip=null},3800);
 },
 removeControls(){
  hub.buttons?.remove();hub.buttons=null;
  hub.tip?.remove();hub.tip=null;
  if(hub.tipTimer)clearTimeout(hub.tipTimer);
  for(const release of hub.releases.splice(0))release();
 },
 releases:[],
 createControls(kind,buttons){
   const root=document.createElement("div");root.className="input-game-controls "+kind;const cancellations=[];
   root.setAttribute("aria-label","Controles do jogo");
   for(const b of buttons){
    const btn=document.createElement("button");btn.type="button";btn.className="input-control "+(b.className||"");
    btn.textContent=b.text;btn.dataset.control=b.id;btn.setAttribute("aria-label",b.label||b.text);
    const pointers=new Set();
    const down=e=>{e.preventDefault();e.stopPropagation();if(btn.disabled||pointers.has(e.pointerId))return;const first=pointers.size===0;pointers.add(e.pointerId);btn.classList.add("held");try{if(e.isTrusted&&e.pointerId>=0)btn.setPointerCapture?.(e.pointerId)}catch{}if(first)b.down?.(e)};
    const up=e=>{e.preventDefault();e.stopPropagation();if(!pointers.delete(e.pointerId)||pointers.size)return;btn.classList.remove("held");b.up?.(e)};
    const cancel=()=>{if(!pointers.size)return;pointers.clear();btn.classList.remove("held");b.up?.()};cancellations.push(cancel);
    btn.addEventListener("pointerdown",down,{passive:false});
    for(const n of ["pointerup","pointercancel","lostpointercapture"])btn.addEventListener(n,up,{passive:false});
    btn.addEventListener("touchstart",e=>{e.stopPropagation();e.preventDefault()},{passive:false});
    root.append(btn);
   }
   document.body.append(root);hub.buttons=root;
   const watch=setInterval(()=>{
     const s=window.System;
     const visible=s?.activeGame?.id===id && !$("#game-ui")?.classList.contains("hidden") && hub.mode==="controls" && (kind!=="kart-input" || (s.activeGame.logic?.state==="RACE" && s.activeGame.logic?.status==="RACING" && !s.paused));
     root.hidden=!visible;
     if(!s?.activeGame){clearInterval(watch);root.remove();hub.buttons=null;}
   },200);
   hub.releases.push(()=>clearInterval(watch));
   const blur=()=>cancellations.forEach(cancel=>cancel());
   const visibility=()=>{if(document.hidden)blur()};document.addEventListener("visibilitychange",visibility);
   window.addEventListener("blur",blur);window.addEventListener("arcade:release-inputs",blur);
   hub.releases.push(()=>{blur();document.removeEventListener("visibilitychange",visibility);window.removeEventListener("blur",blur);window.removeEventListener("arcade:release-inputs",blur)});
   return root;
 },
 kartControls(logic){
  // Dedicated on-screen controls. The physics engine reads these states each frame.
  const manual={left:false,right:false,throttle:false,brake:false,drift:false,rear:false,itemQueued:false};
  logic.arcadeManual=manual;
  const active=()=>logic.state==="RACE"&&logic.status==="RACING";
  const buttons=[
    {id:"left",text:"◀",label:"Virar à esquerda",down:()=>manual.left=true,up:()=>manual.left=false},
    {id:"right",text:"▶",label:"Virar à direita",down:()=>manual.right=true,up:()=>manual.right=false},
    {id:"go",text:"ACELERAR",label:"Segurar para acelerar",down:()=>manual.throttle=true,up:()=>manual.throttle=false},
    {id:"brake",text:"FREIO",label:"Segurar para frear",down:()=>manual.brake=true,up:()=>manual.brake=false},
    {id:"nitro",text:"⚡ NITRO",label:"Usar nitro disponível",down:()=>{
      if(active())logic.requestTurbo();
    }},
    {id:"item",text:"◈ ITEM",label:"Usar item recolhido",down:()=>{if(active())manual.itemQueued=true}}
  ];
  buttons.push({id:'drift',text:'DRIFT',label:'Segurar para derrapar',down:()=>manual.drift=true,up:()=>manual.drift=false},{id:'rear',text:'ATRÁS',label:'Segurar para olhar para trás',down:()=>manual.rear=true,up:()=>manual.rear=false});
  const root=hub.createControls("kart-input",buttons);
  // Console layout: two comfortable thumb areas, empty center for the track.
  const makeGroup=(name,title,ids)=>{
    const group=document.createElement("div");
    group.className="kart-control-pod "+name;
    const caption=document.createElement("span");
    caption.className="kart-control-caption";caption.textContent=title;
    const body=document.createElement("div");body.className="kart-control-buttons";
    for(const controlId of ids){
      const btn=root.querySelector('[data-control="'+controlId+'"]');
      if(!btn)continue;
      const symbol=btn.textContent;
      const glyph=document.createElement("span");glyph.className="kart-control-glyph";
      const label=document.createElement("span");label.className="kart-control-name";
      const parts={
        left:["◀",""],right:["▶",""],
        go:["▲","ACELERAR"],brake:["▾","FREIO"],
        nitro:["⚡","NITRO"],item:["◈","ITEM"]
      }[controlId]||[symbol,""];
      glyph.textContent=parts[0];label.textContent=parts[1];
      btn.replaceChildren(glyph,label);
      btn.classList.add("kart-control-"+controlId);
      body.append(btn);
    }
    group.append(caption,body);root.append(group);
    return group;
  };
  makeGroup("kart-steering","DIREÇÃO",["left","right"]);
  makeGroup("kart-actions","PEDAIS & EXTRAS",["nitro","item","brake","go"]);
  root.setAttribute("aria-label","Comandos de corrida: direção à esquerda, pedais à direita");
  const update=()=>{
    const visible=Boolean(window.System?.activeGame?.id==="drive" && active() && hub.mode==="controls" && !window.System.paused);
    root.hidden=!visible;
    if(visible){
      const item=root.querySelector('[data-control="item"]');
      const nitro=root.querySelector('[data-control="nitro"]');
      if(item){item.disabled=!logic.item;item.setAttribute("aria-label",logic.item?"Usar item: "+logic.item:"Nenhum item disponível")}
      if(nitro){
        const n=Math.max(0,Math.min(100,Number(logic.nitro)||0));
        nitro.style.setProperty("--nitro-fill",n+"%");
        nitro.disabled=n<20 || !!logic.turboLock;
        nitro.setAttribute("aria-label","Nitro: "+Math.round(n)+" por cento");
      }
      root.classList.toggle("kart-moving",!!logic.arcadeManual?.throttle);
    }
  };
  const timer=setInterval(update,110);
  hub.releases.push(()=>clearInterval(timer));
  const keys=new Set();
  const down=e=>{
    if(e.target?.closest?.("input,textarea,select,[contenteditable=true]"))return;
    if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","a","d","w","s"," ","Shift","e"].includes(e.key))e.preventDefault();
    keys.add(e.key);
    if(e.key==="Shift"&&active())logic.requestTurbo();
    if(e.key==="e"&&active())manual.itemQueued=true;
    sync();
  };
  const up=e=>{keys.delete(e.key);sync()};
  const sync=()=>{
    manual.left=keys.has("ArrowLeft")||keys.has("a")||root.querySelector('[data-control="left"].held')!==null;
    manual.right=keys.has("ArrowRight")||keys.has("d")||root.querySelector('[data-control="right"].held')!==null;
    manual.throttle=keys.has("ArrowUp")||keys.has("w")||root.querySelector('[data-control="go"].held')!==null;
    manual.drift=keys.has("z")||root.querySelector('[data-control="drift"].held')!==null;
    manual.rear=keys.has("r")||root.querySelector('[data-control="rear"].held')!==null;
    manual.brake=keys.has("ArrowDown")||keys.has("s")||keys.has(" ")||root.querySelector('[data-control="brake"].held')!==null;
  };
  const refresh=setInterval(sync,35);
  window.addEventListener("keydown",down);
  window.addEventListener("keyup",up);
  const clear=()=>{keys.clear();for(const k of ["left","right","throttle","brake","drift","rear"])manual[k]=false};
  window.addEventListener("blur",clear);window.addEventListener("arcade:release-inputs",clear);
  hub.releases.push(()=>{
    clearInterval(refresh);
    window.removeEventListener("keydown",down);
    window.removeEventListener("keyup",up);
    window.removeEventListener("blur",clear);window.removeEventListener("arcade:release-inputs",clear);
    clear();
    manual.itemQueued=false;
    logic.arcadeManual=null;
  });
  update();
  hub.showTip("POLEGAR ESQUERDO: VIRAR  •  DIREITO: ACELERAR E FREAR");
 },
 flightJoystick(logic,root){
   const stick=document.createElement('div'),knob=document.createElement('span'),caption=document.createElement('small');
   stick.className='flight-stick';stick.dataset.control='joystick';stick.setAttribute('role','group');stick.setAttribute('aria-label','Joystick analógico de voo: arraste para virar e subir ou descer');
   knob.className='flight-stick-knob';caption.textContent='JOYSTICK';stick.append(knob,caption);root.append(stick);
   const axis=logic.manualStick={x:0,y:0,active:false};let owner=null;
   const reset=()=>{owner=null;axis.x=axis.y=0;axis.active=false;stick.classList.remove('held');knob.style.transform='translate(-50%,-50%)';};
   const move=e=>{if(owner!==e.pointerId)return;e.preventDefault();e.stopPropagation();const r=stick.getBoundingClientRect(),radius=r.width*.34,dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,mag=Math.hypot(dx,dy),length=Math.min(radius,mag),strength=Math.max(0,(length/radius-.10)/.90);axis.x=mag?dx/mag*strength:0;axis.y=mag?-dy/mag*strength:0;axis.active=true;knob.style.transform=`translate(calc(-50% + ${mag?dx/mag*length:0}px),calc(-50% + ${mag?dy/mag*length:0}px))`;};
   stick.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(owner!==null)return;owner=e.pointerId;stick.classList.add('held');try{if(e.isTrusted)stick.setPointerCapture(e.pointerId)}catch{}move(e);},{passive:false});
   stick.addEventListener('pointermove',move,{passive:false});
   const end=e=>{if(owner===e.pointerId)reset()};for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,end);
   const hide=()=>{if(document.hidden)reset()};window.addEventListener('blur',reset);window.addEventListener('arcade:release-inputs',reset);window.addEventListener('resize',reset);document.addEventListener('visibilitychange',hide);
   hub.releases.push(()=>{reset();window.removeEventListener('blur',reset);window.removeEventListener('arcade:release-inputs',reset);window.removeEventListener('resize',reset);document.removeEventListener('visibilitychange',hide)});
 },
 flightControls(logic){
   const tapStart=()=>{
     // Do not hold Space for 350ms: that crosses two engine phases
     // (HANGAR->CALIBRATION->PLAYING), skipping the actual calibration UI.
     if(logic.state==="HANGAR" && (logic.mode==="SINGLE"||logic.mode==="FREE")){
       logic.state="CALIBRATION";logic.timer=5;
     }else if(logic.state==="CALIBRATION"){
       logic.keys[" "]=true;
       window.setTimeout(()=>{logic.keys[" "]=false},110);
     }else if(logic.state==="LOBBY"||logic.state==="HANGAR"){
       // Network modes retain the original host/ready rules.
       logic.keys[" "]=true;
       window.setTimeout(()=>{logic.keys[" "]=false},110);
     }
   };
   const key=(id,text,name)=>{
     const map={up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight",boost:"Shift",missile:" "};
     const k=map[id];return {id,text,label:name||text,down:()=>{logic.keys[k]=true},up:()=>{logic.keys[k]=false}};
   };
   hub.createControls("flight-input",[
     key("left","◀","Virar à esquerda"),key("up","▲","Subir"),
     key("down","▼","Descer"),key("right","▶","Virar à direita"),
     key("boost","⚡ TURBO","Acelerar com turbo"),key("missile","◎ MÍSSIL","Disparar míssil após travar a mira"),
     {id:"fire",text:"ATIRAR",label:"Segurar para atirar após travar a mira",down:()=>logic.manualFireHeld=true,up:()=>logic.manualFireHeld=false},
     {id:"start",text:"▶ INICIAR",label:"Iniciar ou continuar voo",down:tapStart}
   ]);
   hub.showTip("JOYSTICK PARA GUIAR • SEGURE ATIRAR COM A MIRA TRAVADA • TOQUES SIMULTÂNEOS");
 },
 arControls(logic){
  const root=hub.createControls('ar-input combat-input',[
   {id:'fire',text:'ATIRAR',label:'Segurar para atirar',down:()=>logic.fireHeld=true,up:()=>logic.fireHeld=false},
   {id:'reload',text:'RECARREGAR',label:'Recarregar arma',down:()=>logic.reload()},
   {id:'cover',text:'COBERTURA',label:'Segurar para se proteger e reduzir dano',down:()=>logic.coverHeld=true,up:()=>logic.coverHeld=false}
  ]);
  for(const aim of [false,true]){
   const stick=document.createElement('div'),knob=document.createElement('span'),caption=document.createElement('small');
   stick.className='combat-stick '+(aim?'aim-stick':'move-stick');stick.dataset.control=aim?'aim':'joystick';stick.setAttribute('role','group');stick.setAttribute('aria-label',aim?'Joystick de mira: horizontal e vertical':'Joystick de movimento: andar e deslocar de lado');
   knob.className='combat-stick-knob';caption.textContent=aim?'MIRAR':'MOVER';stick.append(knob,caption);root.append(stick);
   const axis=logic[aim?'aimStick':'manualStick']={x:0,y:0,active:false};let owner=null;
   const reset=()=>{owner=null;axis.x=axis.y=0;axis.active=false;stick.classList.remove('held');knob.style.transform='translate(-50%,-50%)'};
   const move=e=>{if(owner!==e.pointerId)return;e.preventDefault();e.stopPropagation();const r=stick.getBoundingClientRect(),radius=r.width*.34,dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,mag=Math.hypot(dx,dy),length=Math.min(radius,mag),strength=Math.max(0,(length/radius-.08)/.92);axis.x=mag?dx/mag*strength:0;axis.y=mag?-dy/mag*strength:0;axis.active=true;knob.style.transform=`translate(calc(-50% + ${mag?dx/mag*length:0}px),calc(-50% + ${mag?dy/mag*length:0}px))`};
   stick.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(owner!==null)return;owner=e.pointerId;stick.classList.add('held');try{if(e.isTrusted)stick.setPointerCapture(e.pointerId)}catch{}move(e)},{passive:false});
   stick.addEventListener('pointermove',move,{passive:false});for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,e=>{if(owner===e.pointerId)reset()});
   const hidden=()=>{if(document.hidden)reset()};window.addEventListener('blur',reset);window.addEventListener('arcade:release-inputs',reset);window.addEventListener('resize',reset);document.addEventListener('visibilitychange',hidden);
   hub.releases.push(()=>{reset();window.removeEventListener('blur',reset);window.removeEventListener('arcade:release-inputs',reset);window.removeEventListener('resize',reset);document.removeEventListener('visibilitychange',hidden)});
  }
  hub.showTip('MOVER + MIRAR + ATIRAR • 3 TOQUES SIMULTÂNEOS • R RECARREGA • C PROTEGE');
 }

};
window.ArcadeControls=hub;
})();
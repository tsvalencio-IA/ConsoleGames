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
   if(id==="ar_truck_sim"){overlay.querySelector('[data-mode="camera"] small').textContent="A câmera frontal acompanha a mão direita e reconhece o corpo quando estiver enquadrado. A calibração não exige mostrar os ombros. Mire com a mão; agache para se proteger quando o corpo estiver visível.";overlay.querySelector('[data-mode="controls"] small').textContent="Arraste na cena para olhar. Joystick para andar, botões para atirar e aproximar a mira.";}
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
  if(id==="drive")return;
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
     const visible=s?.activeGame?.id===id && !$("#game-ui")?.classList.contains("hidden") && (hub.mode==="controls"||id==="ar_truck_sim");
     root.hidden=!visible;
     if(!s?.activeGame){clearInterval(watch);root.remove();hub.buttons=null;}
   },200);
   hub.releases.push(()=>clearInterval(watch));
   const blur=()=>cancellations.forEach(cancel=>cancel());
   const visibility=()=>{if(document.hidden)blur()};document.addEventListener("visibilitychange",visibility);
   window.addEventListener("blur",blur);window.addEventListener("resize",blur);window.addEventListener("arcade:release-inputs",blur);
   hub.releases.push(()=>{blur();document.removeEventListener("visibilitychange",visibility);window.removeEventListener("blur",blur);window.removeEventListener("resize",blur);window.removeEventListener("arcade:release-inputs",blur)});
   return root;
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
   const flightRoot=hub.createControls("flight-input",[
     key("left","◀","Virar à esquerda"),key("up","▲","Subir"),
     key("down","▼","Descer"),key("right","▶","Virar à direita"),
     key("boost","⚡ TURBO","Acelerar com turbo"),key("missile","◎ MÍSSIL","Disparar míssil após travar a mira"),
     {id:"fire",text:"ATIRAR",label:"Segurar para atirar após travar a mira",down:()=>logic.manualFireHeld=true,up:()=>logic.manualFireHeld=false},
     {id:"start",text:"▶ INICIAR",label:"Iniciar ou continuar voo",down:tapStart}
   ]);
   for(const name of ["left","right","up","down"])flightRoot.querySelector('[data-control="'+name+'"]').hidden=true;
   hub.flightJoystick(logic,flightRoot);
   const clearFlight=()=>{logic.manualFireHeld=false;for(const key of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Shift',' ','f'])logic.keys[key]=false};
   window.addEventListener('blur',clearFlight);window.addEventListener('arcade:release-inputs',clearFlight);hub.releases.push(()=>{clearFlight();window.removeEventListener('blur',clearFlight);window.removeEventListener('arcade:release-inputs',clearFlight)});
   const refreshFlight=()=>{const start=flightRoot.querySelector('[data-control="start"]');if(start)start.hidden=!["HANGAR","LOBBY","CALIBRATION"].includes(logic.state)};
   refreshFlight();
   const interval=setInterval(refreshFlight,160);
   hub.releases.push(()=>clearInterval(interval));
   hub.showTip("JOYSTICK PARA GUIAR • SEGURE ATIRAR COM A MIRA TRAVADA • TOQUES SIMULTÂNEOS");
 },
 combatLook(logic,root){
  const surface=window.System?.canvas;if(!surface)return;
  const previousControl=surface.dataset.control;surface.dataset.control='look';surface.classList.add('combat-look-surface');
  let owner=null,lastX=0,lastY=0;
  const enabled=()=>hub.mode==='controls'&&window.System?.activeGame?.logic===logic&&!window.System.paused&&logic.state==='PLAYING'&&!root.hidden&&!$('#game-ui')?.classList.contains('hidden');
  const reset=()=>{const pointer=owner;owner=null;logic.lookPointerActive=false;try{if(pointer!==null&&surface.hasPointerCapture?.(pointer))surface.releasePointerCapture(pointer)}catch{}};
  const down=e=>{
   if(owner!==null||!enabled()||(e.pointerType==='mouse'&&e.button!==0)||e.clientX<surface.getBoundingClientRect().left+surface.getBoundingClientRect().width*.45)return;
   e.preventDefault();e.stopPropagation();owner=e.pointerId;lastX=e.clientX;lastY=e.clientY;logic.lookPointerActive=true;
   try{if(e.isTrusted)surface.setPointerCapture(e.pointerId)}catch{}
  };
  const move=e=>{
   if(owner!==e.pointerId)return;if(!enabled()){reset();return;}e.preventDefault();e.stopPropagation();
   const r=surface.getBoundingClientRect();logic.lookBy(e.clientX-lastX,e.clientY-lastY,r.width,r.height);lastX=e.clientX;lastY=e.clientY;
  };
  const end=e=>{if(owner===e.pointerId)reset()};
  const hide=()=>{if(document.hidden)reset()};
  surface.addEventListener('pointerdown',down,{passive:false});surface.addEventListener('pointermove',move,{passive:false});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])surface.addEventListener(type,end);
  for(const type of ['blur','resize','arcade:release-inputs'])window.addEventListener(type,reset);document.addEventListener('visibilitychange',hide);
  hub.releases.push(()=>{reset();surface.removeEventListener('pointerdown',down);surface.removeEventListener('pointermove',move);for(const type of ['pointerup','pointercancel','lostpointercapture'])surface.removeEventListener(type,end);for(const type of ['blur','resize','arcade:release-inputs'])window.removeEventListener(type,reset);document.removeEventListener('visibilitychange',hide);surface.classList.remove('combat-look-surface');if(previousControl===undefined)delete surface.dataset.control;else surface.dataset.control=previousControl;});
 },
 arControls(logic){
  const root=hub.createControls('ar-input combat-input',[
   {id:'fire',text:'ATIRAR',label:'Segurar para atirar',down:()=>logic.fireHeld=true,up:()=>logic.fireHeld=false},
   {id:'ads',text:'MIRAR',label:'Ligar ou desligar a mira aproximada',down:()=>{logic.setAiming(!logic.aiming);refreshAim()}},
   {id:'reload',text:'RECARREGAR',label:'Recarregar arma',down:()=>logic.reload()},
   {id:'sprint',text:'CORRER',label:'Segurar para correr com o joystick',down:()=>logic.sprintHeld=true,up:()=>logic.sprintHeld=false},
   {id:'cover',text:'ABAIXAR',label:'Abaixar ou levantar',down:()=>{logic.toggleCrouch();const el=root.querySelector('[data-control="cover"]');el.textContent=logic.crouched?'LEVANTAR':'ABAIXAR';el.setAttribute('aria-pressed',String(logic.crouched));}},
   {id:'hand',text:'CORPO + MÃO',label:'Calibrar novamente o corpo e a mão ou trocar para controles',down:()=>logic.handSession?.recalibrate()}
  ]);
  root.querySelector('[data-control="hand"]').hidden=hub.mode!=='camera';
  if(hub.mode==='camera')root.classList.add('hand-input');
  if(hub.mode!=='camera'){
   const stick=document.createElement('div'),knob=document.createElement('span'),caption=document.createElement('small');
   stick.className='combat-stick move-stick';stick.dataset.control='joystick';stick.setAttribute('role','group');stick.setAttribute('aria-label','Joystick de movimento: andar e deslocar de lado');
   knob.className='combat-stick-knob';caption.textContent='MOVER';stick.append(knob,caption);root.append(stick);
   const axis=logic.manualStick={x:0,y:0,active:false};let owner=null;
   const reset=()=>{owner=null;axis.x=axis.y=0;axis.active=false;stick.classList.remove('held');knob.style.transform='translate(-50%,-50%)'};
   const move=e=>{if(owner!==e.pointerId)return;e.preventDefault();e.stopPropagation();const r=stick.getBoundingClientRect(),radius=r.width*.34,dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,mag=Math.hypot(dx,dy),length=Math.min(radius,mag),strength=Math.max(0,(length/radius-.08)/.92);axis.x=mag?dx/mag*strength:0;axis.y=mag?-dy/mag*strength:0;axis.active=true;knob.style.transform=`translate(calc(-50% + ${mag?dx/mag*length:0}px),calc(-50% + ${mag?dy/mag*length:0}px))`};
   stick.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(owner!==null)return;owner=e.pointerId;stick.classList.add('held');try{if(e.isTrusted)stick.setPointerCapture(e.pointerId)}catch{}move(e)},{passive:false});
   stick.addEventListener('pointermove',move,{passive:false});for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,e=>{if(owner===e.pointerId)reset()});
   const hidden=()=>{if(document.hidden)reset()};window.addEventListener('blur',reset);window.addEventListener('arcade:release-inputs',reset);window.addEventListener('resize',reset);document.addEventListener('visibilitychange',hidden);
   hub.releases.push(()=>{reset();window.removeEventListener('blur',reset);window.removeEventListener('arcade:release-inputs',reset);window.removeEventListener('resize',reset);document.removeEventListener('visibilitychange',hidden)});
  }
  hub.combatLook(logic,root);
  const aimButton=root.querySelector('[data-control="ads"]');
  const refreshAim=()=>{aimButton.setAttribute('aria-pressed',String(!!logic.aiming));aimButton.classList.toggle('selected',!!logic.aiming);};refreshAim();
  const watchAim=setInterval(refreshAim,160);hub.releases.push(()=>{clearInterval(watchAim);logic.setAiming(false)});
  hub.showTip(hub.mode==='camera'?'CORPO: AGACHE, GIRE E DÊ PASSOS • MÃO: APONTE PARA MIRAR':'ARRASTE NA CENA PARA OLHAR • MIRAR APROXIMA • ANDE E ATIRE AO MESMO TEMPO');
 }

};
window.ArcadeControls=hub;
})();

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
   window.addEventListener("blur",blur);window.addEventListener("arcade:release-inputs",blur);
   hub.releases.push(()=>{blur();window.removeEventListener("blur",blur);window.removeEventListener("arcade:release-inputs",blur)});
   return root;
 },
 kartControls(logic){
  // Dedicated on-screen controls. The physics engine reads these states each frame.
  const manual={left:false,right:false,throttle:false,brake:false,itemQueued:false};
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
  const root=hub.createControls("kart-input",buttons);
  const update=()=>{
    const visible=Boolean(window.System?.activeGame?.id==="drive" && active() && hub.mode==="controls" && !window.System.paused);
    root.hidden=!visible;
    if(visible){const item=root.querySelector('[data-control="item"]');if(item)item.disabled=!logic.item}
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
    manual.brake=keys.has("ArrowDown")||keys.has("s")||keys.has(" ")||root.querySelector('[data-control="brake"].held')!==null;
  };
  const refresh=setInterval(sync,35);
  window.addEventListener("keydown",down);
  window.addEventListener("keyup",up);
  const clear=()=>{keys.clear();for(const k of ["left","right","throttle","brake"])manual[k]=false};
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
  hub.showTip("◀ ▶ DIREÇÃO  •  SEGURE ACELERAR  •  FREIO  •  NITRO  •  ITEM");
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
   const refreshFlight=()=>{for(const name of ["fire","missile","boost"])flightRoot.querySelector('[data-control="'+name+'"]').hidden=logic.state!=="PLAYING";const start=flightRoot.querySelector('[data-control="start"]');if(start)start.hidden=!["HANGAR","LOBBY","CALIBRATION"].includes(logic.state)};
   refreshFlight();
   const interval=setInterval(refreshFlight,160);
   hub.releases.push(()=>clearInterval(interval));
   hub.showTip("JOYSTICK PARA GUIAR • SEGURE ATIRAR COM A MIRA TRAVADA • TOQUES SIMULTÂNEOS");
 },
 arControls(logic){
  logic.arcadeManual=true;
  logic.baseHeading=0;
  logic.currentHeading=0;
  logic.manualPickupHeld=false;logic.manualPickupRequested=false;logic.manualAccelerate=false;
  if(logic.state==="CALIBRATION" || logic.state==="INIT" || logic.state==="BOOT"){
    logic.changeState("PLAY_REAR_AR");
  }
  const drive=()=>logic.state==="PLAY_REAR_AR"||logic.state==="WAITING_PICKUP";
  const turnHeld={left:false,right:false};
  const left={id:"left",text:"◀",label:"Virar caminhão para a esquerda",down:()=>{turnHeld.left=true},up:()=>{turnHeld.left=false}};
  const right={id:"right",text:"▶",label:"Virar caminhão para a direita",down:()=>{turnHeld.right=true},up:()=>{turnHeld.right=false}};
  const arRoot=hub.createControls("ar-input",[
   left,{id:"go",text:"ACELERAR",label:"Acelerar caminhão",down:()=>{if(drive())logic.manualAccelerate=true},up:()=>logic.manualAccelerate=false},
   right,{id:"pick",text:"◈ COLETAR",label:"Segurar para coletar brinquedo",down:()=>{
     if(drive()){logic.manualPickupRequested=true;logic.manualPickupHeld=true;logic.manualAccelerate=false}
   },up:()=>{logic.manualPickupHeld=false;logic.manualPickupRequested=false}},
   {id:"base",text:"⌂ OFICINA",label:"Entrar na oficina quando estiver perto da base",down:()=>{
     if(drive()&&Math.hypot(logic.vPos.x,logic.vPos.y)<30)logic.changeState("ENTER_BASE_TRANSITION");
     else window.System.msg("VOLTE À BASE PARA ABRIR A OFICINA");
   }},
   {id:"out",text:"↩ VOLTAR",label:"Retomar exploração após a oficina",down:()=>{
     if(logic.state==="FRONT_AR_OFFICE")logic.changeState("EXIT_BASE_TRANSITION");
   }}
  ]);
  // Only contextual actions are shown: never cover the scene with inactive commands.
  const refreshAR=()=>{
    const base=arRoot.querySelector('[data-control="base"]');
    const out=arRoot.querySelector('[data-control="out"]');
    const distance=Math.hypot(Number(logic.vPos?.x)||0,Number(logic.vPos?.y)||0);
    if(base)base.hidden=!(drive()&&distance<30);
    if(out)out.hidden=logic.state!=="FRONT_AR_OFFICE";
  };
  refreshAR();
  const refreshTimer=setInterval(refreshAR,170);
  hub.releases.push(()=>clearInterval(refreshTimer));
  const pressed=new Set();
  const validKeys=new Set(["ArrowLeft","ArrowRight","ArrowUp","a","d","w"," ","e"]);
  const onKey=e=>{if(!validKeys.has(e.key))return;if(e.target instanceof HTMLInputElement)return;pressed.add(e.key);if(e.key===" "){logic.manualPickupRequested=true;logic.manualPickupHeld=true}else if(e.key==="e"&&Math.hypot(logic.vPos.x,logic.vPos.y)<30)logic.changeState("ENTER_BASE_TRANSITION");};
  const onKeyUp=e=>{pressed.delete(e.key);if(e.key===" ")logic.manualPickupHeld=false};
  window.addEventListener("keydown",onKey);window.addEventListener("keyup",onKeyUp);
  hub.releases.push(()=>{window.removeEventListener("keydown",onKey);window.removeEventListener("keyup",onKeyUp)});
  const clearAR=()=>{pressed.clear();turnHeld.left=turnHeld.right=false;logic.manualAccelerate=false;logic.manualPickupHeld=false;logic.manualPickupRequested=false;};
  window.addEventListener('blur',clearAR);window.addEventListener('arcade:release-inputs',clearAR);hub.releases.push(()=>{clearAR();window.removeEventListener('blur',clearAR);window.removeEventListener('arcade:release-inputs',clearAR)});
  let prev=performance.now();
  const cycle=()=>{
   const now=performance.now(),dt=Math.min(.05,(now-prev)/1000);prev=now;
   if(window.System?.activeGame?.id!==id){logic.manualAccelerate=false;logic.manualPickupHeld=false;return}
   if(!window.System.paused && drive()){
     let steer=Number(turnHeld.right)-Number(turnHeld.left)+(pressed.has("ArrowRight")||pressed.has("d")?1:0)-(pressed.has("ArrowLeft")||pressed.has("a")?1:0);
     logic.currentHeading=(logic.currentHeading+steer*110*dt+360)%360;
     logic.manualAccelerate=!logic.manualPickupHeld&&(pressed.has("ArrowUp")||pressed.has("w")||!!hub.buttons?.querySelector('[data-control="go"].held'));
   }
   hub.raf=requestAnimationFrame(cycle);
  };
  hub.raf=requestAnimationFrame(cycle);
  hub.releases.push(()=>cancelAnimationFrame(hub.raf));
  hub.showTip("◀ ▶ DIREÇÃO • ACELERE ATÉ O ALVO • SEGURE COLETAR • VOLTE À OFICINA");
 }
};
window.ArcadeControls=hub;
})();
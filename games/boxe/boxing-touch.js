/* thIAguinho ARCADE | Boxe: controle por toque quando não há sensor.
   Preserva motor de golpes, defesa, dano, fases e Firebase do box_pro. */
(()=>{"use strict";
function install(){
 const game=(window.Games||[]).find(g=>g.id==="box_pro");
 if(!game||!game.logic||game.logic.__arcadeTouchInstalled)return;
 const logic=game.logic;
 logic.__arcadeTouchInstalled=true;
 const coarse=()=>window.matchMedia?.("(pointer: coarse)").matches||navigator.maxTouchPoints>0;
 const gameUi=document.getElementById("game-ui");
 if(!gameUi)return;
 const controls=document.createElement("div");
 controls.id="arcade-boxing-controls";controls.setAttribute("aria-label","Controles de boxe por toque");
 controls.innerHTML='<button type="button" class="boxing-action jab" data-punch="l" aria-label="Soco esquerdo">👊 <span>ESQUERDO</span></button><button type="button" class="boxing-action guard" data-guard="1" aria-label="Segurar para defender">🛡 <span>DEFESA</span></button><button type="button" class="boxing-action cross" data-punch="r" aria-label="Soco direito">🥊 <span>DIREITO</span></button>';
 for(const [side,label] of [[-1,'◁'],[1,'▷']]){const b=document.createElement('button');b.type='button';b.className='boxing-action dodge';b.dataset.dodge=String(side);b.setAttribute('aria-label','Esquivar para '+(side<0?'esquerda':'direita'));b.innerHTML=label+'<span>ESQUIVAR</span>';b.addEventListener('pointerdown',e=>{e.preventDefault();if(logic.state!=='FIGHT'||window.System?.paused||logic.p1?.stamina<12||performance.now()<(logic.touchDodgeUntil||0)+350)return;logic.touchDodgeDir=side;logic.touchDodgeUntil=performance.now()+280;logic.p1.stamina-=12;});side<0?controls.prepend(b):controls.append(b);}
 controls.hidden=true;gameUi.appendChild(controls);
 const freshPose=(w,h)=>{
   if(!logic.p1?.pose)return;
   const dodge=performance.now()<(logic.touchDodgeUntil||0);logic.p1.isDodging=dodge;
   const p=logic.p1.pose,x=w*.5+(dodge?(logic.touchDodgeDir||0)*w*.16:0),y=h*.70,reach=Math.max(42,Math.min(70,w*.12));
   const put=(v,a,b)=>{v.x=a;v.y=b};
   put(p.head,x,y-70);put(p.shoulders.l,x-reach,y);put(p.shoulders.r,x+reach,y);
   put(p.elbows.l,x-reach*1.3,y+44);put(p.elbows.r,x+reach*1.3,y+44);
   if(p.wrists.l.state==="IDLE")put(p.wrists.l,x-reach*.8,y+24);
   if(p.wrists.r.state==="IDLE")put(p.wrists.r,x+reach*.8,y+24);
 };
 const nativeInit=logic.init.bind(logic);
 logic.init=function(...args){
   const result=nativeInit(...args);
   this.touchMode=coarse() || Boolean(window.CONSOLE_FORCE_TOUCH_BOXE);
   this.touchPunchAt=0;this.touchGuard=false;
   // Native character selection remains intact; skip only camera calibration
   // when entering a match in the touch mode.
   const canvas=window.System?.canvas;
   if(canvas && canvas.onclick){
     const originalClick=canvas.onclick;
     canvas.onclick=event=>{
       if(this.touchMode && this.state==="CHAR_SELECT" && !this.matchEnded){
         const rect=canvas.getBoundingClientRect();
         const x=event.clientX-rect.left,y=event.clientY-rect.top;
         if(y>rect.height*.75){
           this.selChar=Math.min(3,Math.max(0,Math.floor(x/(rect.width/4))));
           this.startGame();
           return;
         }
       }
       originalClick(event);
     };
   }
   return result;
 };
 const nativeUpdate=logic.update.bind(logic);
 logic.update=function(ctx,w,h,pose){
   if(this.touchMode && this.state==="FIGHT"){
     freshPose(w,h);
     this.p1.stamina=Math.min(100,this.p1.stamina+0.11);
     this.p1.guard=Boolean(this.touchGuard);
   }
   return nativeUpdate(ctx,w,h,pose);
 };
 function punch(side){
   if(window.System?.paused||!logic.touchMode||logic.state!=="FIGHT"||logic.matchEnded||!logic.p1||!logic.p2)return;
   if(logic.touchGuard || logic.p1.stamina<20)return;
   const stamp=performance.now();
   if(stamp-(logic.touchPunchAt||0)<290)return;
   logic.touchPunchAt=stamp;
   const hand=logic.p1.pose.wrists[side];
   if(!hand)return;
   const head=logic.p2.pose.head;
   if(!Number.isFinite(head?.x)||head.x<=0)return;
   hand.x=head.x+(side==="l"?-20:20);
   hand.y=head.y+11;
   hand.z=80;hand.state="PUNCH";hand.hasHit=false;hand.punchForce=.75;
   logic.p1.stamina=Math.max(0,logic.p1.stamina-19);
   logic.checkHit(hand,logic.p1,logic.p2);
   if(window.navigator.vibrate && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)navigator.vibrate(15);
   setTimeout(()=>{if(hand.state==="PUNCH")hand.state="RETRACT"},90);
 }
 for(const button of controls.querySelectorAll("[data-punch]")){
   button.addEventListener("pointerdown",e=>{e.preventDefault();punch(button.dataset.punch)},{passive:false});
 }
 const guard=controls.querySelector("[data-guard]");
 guard.addEventListener("pointerdown",e=>{e.preventDefault();logic.touchGuard=true;guard.classList.add("pressed");guard.setPointerCapture?.(e.pointerId)},{passive:false});
 for(const type of ["pointerup","pointercancel","lostpointercapture"]){
   guard.addEventListener(type,()=>{logic.touchGuard=false;guard.classList.remove("pressed")});
 }
 const nativeCleanup=logic.cleanup.bind(logic);
 logic.cleanup=function(...args){controls.hidden=true;this.touchGuard=false;return nativeCleanup(...args)};
 const refresh=()=>{
   const visible=Boolean(window.System?.activeGame?.id==="box_pro" && logic.touchMode && logic.state==="FIGHT" && !window.System?.paused);
   controls.hidden=!visible;
 };
 const observer=setInterval(refresh,180);
 window.addEventListener("pagehide",()=>clearInterval(observer),{once:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
else install();
})();
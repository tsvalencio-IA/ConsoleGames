/* HQ 3D • Standard controller support. Native keyboard physics, camera,
 * collisions, quests and saves remain unchanged. OTThi keeps its own native
 * world gamepad engine: this adapter runs only in the HQ standalone world. */
(()=>{
 "use strict";
 if(window.CONSOLE_WORLD!=="familia")return;
 const down=new Set(),map=new Map(),keys=[
   ["KeyA",0],["KeyD",1],["KeyW",2],["KeyS",3],
   ["ShiftLeft",4],["Space",5],["KeyE",6],["KeyF",7],["KeyT",8],["Escape",9]
 ];
 let badge=null,connected=false,disposed=false;
 function send(code,pressed){
   if(!!pressed===down.has(code))return;
   if(pressed)down.add(code);else down.delete(code);
   const key=code.startsWith("Key")?code.slice(3).toLowerCase():code;
   window.dispatchEvent(new KeyboardEvent(pressed?"keydown":"keyup",{bubbles:true,cancelable:true,key,code,repeat:false}));
 }
 function release(){for(const code of Array.from(down))send(code,false)}
 function active(){
   return !!document.querySelector("#overlay.hidden") && !document.hidden;
 }
 function getPad(){try{return Array.from(navigator.getGamepads?.()||[]).find(p=>p&&p.connected)}catch{return null}}
 function update(){
   if(disposed)return;
   const pad=getPad();
   const canMove=pad&&active();
   if(!canMove){if(connected){release();connected=false}if(badge)badge.hidden=true}
   else{
     connected=true;
     if(!badge){
       badge=document.createElement("span");badge.id="hq-native-gamepad";
       badge.textContent="🎮 CONTROLE";badge.setAttribute("aria-label","Controle físico conectado");
       badge.style.cssText="display:inline-flex;align-items:center;min-height:29px;max-width:100%;padding:5px 7px;border:1px solid #b9f6ffc0;border-radius:9px;background:#03233ed9;color:#e2fbff;font:800 9px system-ui;white-space:nowrap";
       (document.querySelector("#bar .topRight")||document.body).append(badge);
     }
     badge.hidden=false;
     const axis=i=>Math.abs(Number(pad.axes?.[i])||0)<.3?0:Number(pad.axes[i]);
     const a=axis(0),b=axis(1);
     const btn=i=>!!pad.buttons?.[i]?.pressed;
     send("KeyA",a<-.32||btn(14));
     send("KeyD",a>.32||btn(15));
     send("KeyW",b<-.32||btn(12));
     send("KeyS",b>.32||btn(13));
     send("ShiftLeft",btn(7)||Number(pad.buttons?.[7]?.value)>0.22);
     send("Space",btn(0));
     send("KeyE",btn(1));
     send("KeyF",btn(2));
     send("KeyT",btn(3));
     send("Escape",btn(9));
   }
   requestAnimationFrame(update);
 }
 const clean=()=>{release();connected=false;if(badge)badge.hidden=true};
 window.addEventListener("blur",clean);
 window.addEventListener("gamepaddisconnected",clean);
 window.addEventListener("visibilitychange",()=>{if(document.hidden)clean()});
 window.addEventListener("pagehide",()=>{disposed=true;clean()},{once:true});
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>requestAnimationFrame(update),{once:true});
 else requestAnimationFrame(update);
})();
/* thIAguinho Studio · grounded world feedback.
 * Reads progress counters and player movement; never modifies game/Firebase data.
 * Sound is entirely local WebAudio and opt-in through first input interaction. */
(()=>{
"use strict";
const mode=window.CONSOLE_WORLD;
if(mode!=="otthi"&&mode!=="familia")return;
const key="thia:studio:audio:v1";
const ctx={enabled:true,ac:null,last:{},old:null,position:null,lastFoot:0,timer:null,stopped:false};
try{ctx.enabled=localStorage.getItem(key)!=="off"}catch{}
function init(){
  if(!ctx.enabled)return;
  const A=window.AudioContext||window.webkitAudioContext;
  if(!A)return;
  try{if(!ctx.ac)ctx.ac=new A();if(ctx.ac.state==="suspended")ctx.ac.resume().catch(()=>{})}catch{}
}
function tone(f,fEnd,length,volume=.04,kind="sine",delay=0){
  if(!ctx.enabled||document.hidden)return;
  init();const c=ctx.ac;if(!c)return;
  const t=c.currentTime+delay;
  try{
    const o=c.createOscillator(),g=c.createGain();o.type=kind;
    o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(fEnd,t+length);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.001,volume),t+.012);
    g.gain.exponentialRampToValueAtTime(.0001,t+length);
    o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+length+.01);
    o.onended=()=>{o.disconnect();g.disconnect()}
  }catch{}
}
function cue(name){
  const now=performance.now();if(now-(ctx.last[name]||-1e6)<(name==="step"?440:900))return;
  ctx.last[name]=now;
  switch(name){
    case "step":tone(125,92,.068,.014,"triangle");break;
    case "star":tone(720,940,.105,.055);tone(1020,1290,.20,.05,"sine",.11);break;
    case "medal":tone(523,650,.16,.05);tone(784,900,.16,.05,"sine",.16);tone(1050,1160,.29,.045,"triangle",.32);break;
    case "level":tone(440,590,.15,.045);tone(660,880,.19,.04,"sine",.14);break;
    case "quest":tone(440,620,.21,.032,"triangle");tone(780,1020,.18,.035,"sine",.11);break;
    default:break;
  }
}
const configs=mode==="familia"?[
  {selector:"#stars",type:"star"},
  {selector:"#medals",type:"medal"}
]:[
  {selector:"#lobbyRep",type:"star"},
  {selector:"#lobbyMedals",type:"medal"},
  {selector:"#lobbyLevel",type:"level"}
];
const values=new Map();
function value(selector){
 const node=document.querySelector(selector);
 if(!node)return null;
 const match=String(node.textContent||"").replace(/\s/g,"").match(/-?\d+/);
 return match?Math.max(0,Number(match[0])):null;
}
function active(){
 if(mode==="familia")return !!window.__THIA_TEST && document.getElementById("overlay")?.classList.contains("hidden");
 return document.getElementById("world")?.classList.contains("active")||document.getElementById("game")?.classList.contains("active")||!document.getElementById("lobby")?.classList.contains("active");
}
function tick(){
 if(document.hidden)return;
 for(const x of configs){
   const count=value(x.selector);if(count===null||!Number.isFinite(count))continue;
   const old=values.get(x.selector);values.set(x.selector,count);
   if(old!==undefined && count>old)cue(x.type);
 }
 if(mode==="familia"&&active()){
   const p=window.__THIA_TEST?.player;
   if(p&&Number.isFinite(p.x)&&Number.isFinite(p.z)){
     const prev=ctx.position;ctx.position={x:p.x,z:p.z};
     if(prev){
       const moved=Math.hypot(p.x-prev.x,p.z-prev.z);
       if(moved>.018 && moved<4)cue("step");
     }
   }
 }
}
function start(){
 if(document.getElementById("studio-world-sound"))return;
 const button=document.createElement("button");
 button.id="studio-world-sound";button.type="button";
 button.setAttribute("aria-label","Ligar ou desligar sons de aventura");
 const update=()=>{
   button.textContent=ctx.enabled?"♪ SONS":"♪ MUDO";
   button.setAttribute("aria-pressed",String(ctx.enabled));
 };
 update();
 button.addEventListener("click",()=>{
   ctx.enabled=!ctx.enabled;
   try{localStorage.setItem(key,ctx.enabled?"on":"off")}catch{}
   update();if(ctx.enabled){init();cue("quest")}
 });
 document.body.appendChild(button);
 document.addEventListener("pointerdown",init,{passive:true,once:true});
 document.addEventListener("keydown",init,{once:true});
 document.addEventListener("visibilitychange",()=>{
   if(document.hidden)ctx.ac?.suspend?.().catch(()=>{});
   else if(ctx.enabled)ctx.ac?.resume?.().catch(()=>{});
 });
 tick();
 ctx.timer=setInterval(tick,500);
 window.addEventListener("pagehide",()=>{clearInterval(ctx.timer);ctx.ac?.close?.().catch(()=>{})},{once:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
else start();
})();
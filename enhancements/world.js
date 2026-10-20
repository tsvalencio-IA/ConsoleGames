/* ConsoleGames: native world HUD support. Does not fabricate progress or write Firebase.
   OTThi profile data and HQ in-game counters are only read from existing DOM. */
(() => {
"use strict";
const mode=window.CONSOLE_WORLD;
if(mode!=="familia"&&mode!=="otthi")return;
const $=s=>document.querySelector(s);
function create(tag,className,text){
 const x=document.createElement(tag);
 if(className)x.className=className;
 if(text)x.textContent=text;
 return x;
}
function init(){
 if(!document.body||$("#world-console-toolbar"))return;
 const bar=create("div");
 bar.id="world-console-toolbar";
 const back=create("a","console-world-link","← Console");
 back.href=mode==="familia"?"../../":"../../";
 back.title="Voltar ao console thIAguinho";
 back.setAttribute("aria-label","Voltar ao console de jogos");
 const summary=create("div","console-world-status");
 summary.hidden=true;
 summary.setAttribute("role","status");
 bar.append(back,summary);
 document.body.appendChild(bar);
 if(mode==="familia"){
   const parent=$("#bar .topRight");
   if(parent){
     const link=create("a","console-world-link","Console");
     link.href="../../";
     link.style.cssText="min-height:34px;padding:6px 8px;font-size:10px";
     parent.appendChild(link);
   }
 }
 if(mode==="otthi"){
   const hero=$("#lobby .hero-actions");
   if(hero){
     const link=create("a","console-world-link","← Todos os jogos");
     link.href="../../";
     hero.appendChild(link);
   }
 }
 function refresh(){
   if(mode==="familia"){
      const star=parseInt($("#stars")?.textContent||"",10);
      const medal=parseInt($("#medals")?.textContent||"",10);
      if(Number.isFinite(star)&&Number.isFinite(medal)){
        summary.textContent="Estrelas "+star+"/15 • Conquistas "+medal+"/5";
        summary.hidden=false;
      }
   }else{
      const lobby=$("#lobby");
      const visible=lobby&&!lobby.hidden&&lobby.classList.contains("active");
      if(visible){
        const level=$("#lobbyLevel")?.textContent?.trim();
        const medals=$("#lobbyMedals")?.textContent?.trim();
        summary.textContent=(level?"Nível "+level:"")+(medals?" • Medalhas "+medals:"");
        summary.hidden=!level&&!medals;
      }else summary.hidden=true;
   }
 }
 refresh();
 // Only a low-frequency UI check. No game loop, camera or database work.
 const timer=setInterval(refresh,1600);
 window.addEventListener("pagehide",()=>clearInterval(timer),{once:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();
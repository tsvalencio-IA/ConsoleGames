/* ConsoleGames · Jornada diária dos mundos.
   Observa somente contadores reais da interface. Não escreve no Firebase
   nem altera estrelas, conquistas, moedas ou progresso nativo. */
(() => {
"use strict";
const world=window.CONSOLE_WORLD;
if(world!=="familia"&&world!=="otthi")return;
const $=selector=>document.querySelector(selector);
const key="console-games:v2:worldquest:"+world;
const date=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")};
const parse=selector=>{const txt=$(selector)?.textContent||"";const m=txt.replace(/[.\s]/g,"").match(/-?\d+/);return m?Math.max(0,Number(m[0])):NaN};
const selectors=world==="familia"?["#stars","#medals"]:["#lobbyRep","#lobbyMedals","#lobbyLevel"];
const labels=world==="familia"
 ? [{metric:0,delta:1,name:"Encontre uma estrela",symbol:"✦"},{metric:0,delta:3,name:"Colete três estrelas novas",symbol:"★"},{metric:1,delta:1,name:"Conquiste uma nova medalha",symbol:"🏆"}]
 : [{metric:0,delta:5,name:"Ganhe 5 de reputação",symbol:"✦"},{metric:1,delta:1,name:"Consiga uma medalha",symbol:"🏆"},{metric:2,delta:1,name:"Avance um nível",symbol:"★"}];
const load=()=>{try{const a=JSON.parse(localStorage.getItem(key)||"null");return a&&typeof a==="object"&&a.date===date()?a:null}catch{return null}};
let saved=load(),panel=null,status=null,toastTimer=null,ticker=null;
function store(){try{localStorage.setItem(key,JSON.stringify(saved))}catch{}}
function readMetrics(){
 const values=selectors.map(parse);
 return values.every(Number.isFinite)?values:null;
}
function make(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e}
function ensurePanel(){
 if(panel||!document.body)return;
 panel=make("section","console-daily-quest");
 panel.id="console-daily-quest";
 const head=make("div","quest-head");
 head.append(make("strong","","JORNADA DE HOJE"),make("span","","DESAFIOS REAIS"));
 status=make("div","quest-track");
 status.setAttribute("aria-live","polite");
 const note=make("p","quest-note","Progresso extra apenas neste dispositivo • seus pontos originais continuam intactos.");
 panel.append(head,status,note);
 if(world==="familia"){
   // Mission board inside the existing title/selection screen; it won't hide controls.
   const p=$("#overlay .panel");
   const start=$("#start");
   if(p&&start)p.insertBefore(panel,start);
   else document.body.appendChild(panel);
 }else{
   const area=$("#lobby .menu-panel .profile-strip");
   if(area?.parentElement)area.insertAdjacentElement("afterend",panel);
   else $("#lobby")?.appendChild(panel);
 }
}
function celebration(name){
 if(!document.body||!panel)return;
 let toast=$("#console-world-medal-toast");
 if(!toast){toast=make("div","console-world-medal-toast");toast.id="console-world-medal-toast";toast.setAttribute("role","status");document.body.append(toast)}
 toast.textContent="★ JORNADA CONCLUÍDA: "+name;
 toast.hidden=false;
 if(toastTimer)clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>toast.hidden=true,2800);
}
function render(){
 if(!status)return;
 const fragment=document.createDocumentFragment();
 const current=saved;
 if(!current){status.textContent="Preparando objetivos…";return}
 const unlocked=labels.map((item,i)=>({
   ...item,done:(current.peak[item.metric]-current.start[item.metric])>=item.delta,
   progress:Math.max(0,Math.min(item.delta,current.peak[item.metric]-current.start[item.metric]))
 }));
 for(const entry of unlocked){
   const chip=make("div","quest-entry"+(entry.done?" completed":""));
   const name=make("span","quest-entry-name",(entry.done?"✓ ":entry.symbol+" ")+entry.name);
   const right=make("strong","",entry.progress+"/"+entry.delta);
   chip.append(name,right);fragment.appendChild(chip);
 }
 status.replaceChildren(fragment);
}
function cycle(){
 const metrics=readMetrics();
 if(!metrics)return;
 if(!saved){
   // After lobby/level load, this is a reference point, not a copied award.
   saved={date:date(),start:metrics,peak:[...metrics],completed:[]};
   store();render();return;
 }
 if(saved.date!==date()){saved={date:date(),start:metrics,peak:[...metrics],completed:[]};store();render();return;}
 let changed=false;
 metrics.forEach((v,i)=>{if(v>saved.peak[i]){saved.peak[i]=v;changed=true}});
 const completed=new Set(Array.isArray(saved.completed)?saved.completed:[]);
 let trophy=null;
 labels.forEach((item,i)=>{
   if(saved.peak[item.metric]-saved.start[item.metric]>=item.delta&&!completed.has(i)){
     completed.add(i);trophy=item.name;changed=true;
   }
 });
 if(changed){saved.completed=[...completed];store();render();if(trophy)celebration(trophy)}
}
function init(){
 ensurePanel();
 // Allow native Firebase/local progress to initialize before taking first baseline.
 render();
 setTimeout(()=>{cycle();ticker=setInterval(cycle,2400)},4000);
 window.addEventListener("pagehide",()=>{if(ticker)clearInterval(ticker);if(toastTimer)clearTimeout(toastTimer)},{once:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();
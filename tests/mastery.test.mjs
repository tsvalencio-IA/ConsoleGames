import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
const read=p=>readFileSync(p,"utf8");
const entries=[["kart","drive"],["boxe","box_pro"],["tenis","tennis"],["ar","ar_truck_sim"],["voo","usarmy_flight_sim"]];
test("cada jogo possui desafios nativos, gamepad e PWA atualizado",()=>{
 for(const [slug,id] of entries){
   const base="games/"+slug+"/";
   const html=read(base+"index.html");
   const code=read(base+"mastery-gamepad.js");
   const css=read(base+"mastery-gamepad.css");
   const sw=read(base+"sw.js");
   assert(html.includes('window.CONSOLE_GAME_ID="'+id+'"'),slug+" perdeu identidade");
   assert(html.includes('src="./mastery-gamepad.js"'),slug+" sem missões/gamepad");
   assert(html.includes('href="./mastery-gamepad.css"'),slug+" sem CSS de missões");
   assert(sw.includes('mastery-v6')&&sw.includes('mastery-gamepad.js')&&sw.includes('mastery-gamepad.css'),slug+" offline desatualizado");
   assert(code.includes("const goalDefs"),slug+" sem desafios verificáveis");
   assert(code.includes("window.System?.activeGame"),slug+" sem isolamento de jogo");
   assert(code.includes("navigator.getGamepads"),slug+" sem gamepad físico");
   assert(code.includes("localStorage.setItem"),slug+" sem persistência local");
   assert(!code.includes("firebase.database(")&&!code.includes("window.Profile.save"),slug+" não pode afetar Firebase");
   assert(css.includes("prefers-reduced-motion")&&css.includes("safe-area-inset"),slug+" layout inseguro");
   execFileSync(process.execPath,["--check",base+"mastery-gamepad.js"]);
 }
});
test("objetivos só avançam com métricas de jogabilidade",()=>{
 const module=read("enhancements/mastery-gamepad.js");
 for(const id of ["drive","box_pro","tennis","ar_truck_sim","usarmy_flight_sim"]){
   assert(module.includes(id+":"));
 }
 assert(module.includes("goal.progress>=goal.target"),"Sem conclusão baseada em progresso real");
 assert(module.includes("v.lap-1"),"Volta real não medida");
 assert(module.includes("v.enemyHp<p.enemyHp"),"Golpes não medidos");
 assert(module.includes("v.p1score>p.p1score"),"Pontos reais não medidos");
 assert(module.includes("v.collected"),"Coleta não medida");
 assert(module.includes("v.missiles>p.missiles"),"Mísseis reais não medidos");
});

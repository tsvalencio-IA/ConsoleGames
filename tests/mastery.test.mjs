import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
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
   assert(/const CACHE=PREFIX\+\"pro-control-v\d+\"/.test(sw)&&sw.includes('mastery-gamepad.js')&&sw.includes('mastery-gamepad.css'),slug+" offline desatualizado");
   assert(code.includes("const goalDefs"),slug+" sem desafios verificáveis");
   assert(code.includes("window.System?.activeGame"),slug+" sem isolamento de jogo");
   assert(code.includes("navigator.getGamepads"),slug+" sem gamepad físico");
   assert(code.includes("localStorage.setItem"),slug+" sem persistência local");
   assert(!code.includes("firebase.database(")&&!code.includes("window.Profile.save"),slug+" não pode afetar Firebase");
   assert(html.includes('href="./pro-controls.css"'),slug+" missing ergonomic controllers");
   assert(css.includes("prefers-reduced-motion")&&css.includes("safe-area-inset"),slug+" layout inseguro");
   execFileSync(process.execPath,["--check",base+"mastery-gamepad.js"]);
 }
});
test("carreira só avança com ações reais e mantém etapas concluídas após recarregar",()=>{
 const source=read('enhancements/mastery-gamepad.js'),storage=new Map();
 function load(id){const window={CONSOLE_GAME_ID:id,ArcadePlaySettings:{get:()=>({difficulty:'normal'})},setTimeout(){}};const context={window,document:{querySelector(){}},performance:{now:()=>0},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}};vm.runInNewContext(source.slice(0,source.indexOf('function gamepadButtons()'))+"window.inspect={reset,updateGoals,selectTier,get:()=>({tier,goals,completed})};})();",context);return window.inspect;}
 const kart=load('drive');kart.reset();kart.updateGoals({state:'RACE',lap:1,speed:0,status:'RACING',keys:{ArrowUp:true}},.2);assert.equal(Object.keys(kart.get().completed).length,0);
 kart.updateGoals({state:'RACE',lap:2,speed:180,turboLock:true,status:'RACING'},3.2);assert.equal(Object.keys(kart.get().completed).length,3);const restored=load('drive');assert.equal(restored.get().tier,1);
 const boxing=load('box_pro');boxing.reset();boxing.updateGoals({state:'FIGHT',p1:{guard:true},boutStats:{hits:0,blocks:0}},31);assert.equal(Object.keys(boxing.get().completed).length,1,'Holding guard without blocking an attack cannot count as defense');boxing.updateGoals({state:'FIGHT',boutStats:{hits:3,blocks:2}},.1);assert.equal(Object.keys(boxing.get().completed).length,3);
 const ar=load('ar_truck_sim');ar.reset();ar.updateGoals({state:'FRONT_AR_OFFICE',cargo:[],health:100,currentMission:{progress:0},expedition:{missions:0,deliveries:0}},1);assert.equal(Object.keys(ar.get().completed).length,0,'Opening an empty garage cannot count as a delivery');
 const flight=load('usarmy_flight_sim');flight.reset();flight.updateGoals({state:'PLAYING',combat:{locked:false},session:{kills:0,wave:1},missiles:[{},{}]},1);assert.equal(Object.keys(flight.get().completed).length,0,'A fire button or a missile is not a successful acquisition');
});

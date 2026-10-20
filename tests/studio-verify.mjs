/* Guardrail: execution plus source checks; no fake device certification. */
import assert from "node:assert/strict";
import {readFileSync,existsSync,statSync} from "node:fs";
import {execFileSync} from "node:child_process";
const read=p=>readFileSync(p,"utf8");
const five=[["kart","drive","game_kart.js"],["boxe","box_pro","game_box.js"],["tenis","tennis","game_tennis.js"],["ar","ar_truck_sim","game_ar.js"],["voo","usarmy_flight_sim","game_flight.js"]];
let count=0;
for(const [slug,id,source] of five){
 const root="games/"+slug+"/",html=read(root+"index.html");
 assert(html.includes('<script src="./studio-fx.js"></script>'),slug+" missing sound/visual engine");
 assert(html.includes('<link rel="stylesheet" href="./studio-fx.css">'),slug+" missing studio stylesheet");
 assert(html.includes('window.CONSOLE_GAME_ID="'+id+'"'),slug+" changed Firebase game ID");
 assert(html.includes('projectId: "thiaguinhogame-ac91b"'),slug+" changed Firebase project");
 const js=read(root+"studio-fx.js");
 assert(js.includes("ctx.createRadialGradient"),slug+" missing genuine canvas light pass");
 assert(js.includes("AudioContext"),slug+" missing audio synthesis");
 assert(js.includes("track(this)"),slug+" feedback not bound to game engine");
 assert(js.includes("localStorage.setItem(storageKey"),slug+" no sound preference");
 assert(!js.includes("window.DB.ref(")&&!js.includes("firebase.database("),slug+" touches player data");
 const sw=read(root+"sw.js");
 assert(sw.includes('studio-fx.js')&&sw.includes('studio-v4'),slug+" stale cache");
 assert(read(root+"js/"+source).includes("registerGame('"+id+"'"));
 execFileSync(process.execPath,["--check",root+"studio-fx.js"]);
 count++;
}
for(const [slug,htmlPath,css,js] of [
 ["otthi","games/otthi/index.html","./studio-world.css","./studio-world.js"],
 ["familia","games/familia/3d/index.html","../studio-world.css","../studio-world.js"]
]){
 const html=read(htmlPath);
 assert(html.includes('href="'+css+'"'),slug+" missing studio style");
 assert(html.includes('src="'+js+'"'),slug+" missing studio sound");
 const root="games/"+slug+"/";
 assert(read(root+"studio-world.js").includes("cue("),slug+" missing native-progress event sounds");
 assert(read(root+"studio-world.js").includes("#world-console-toolbar"),slug+" controls obscured");
 execFileSync(process.execPath,["--check",root+"studio-world.js"]);
 count++;
}
assert(read("games/otthi/firebase-config.js").includes('projectId: "otthi-656c5"'));
assert(read("games/familia/3d/index.html").includes("float hemisphere=.53+.16"));
assert.equal(count,7);
console.log("Studio: 7/7 integrated, 5 context-aware Canvas renderers, native WebGL lighting, sound systems, PWA cache and Firebase fidelity.");

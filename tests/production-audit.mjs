/* Public GitHub Pages deployment audit: actual HTTP content vs committed source.
   No Firebase login, no camera and no writes to user data. */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const root=new URL("../",import.meta.url);
const base="https://tsvalencio-ia.github.io/ConsoleGames/";
const paths=[
  "arcade/index.html","arcade/app.js","arcade/styles.css",
  "arcade/manifest.webmanifest","arcade/sw.js",
  "games/otthi/index.html","games/familia/3d/index.html",
  ...["kart","boxe","tenis","ar","voo"].flatMap(name=>[
    "games/"+name+"/index.html",
    "games/"+name+"/js/core.js",
    "games/"+name+"/control-modes.js",
    "games/"+name+"/control-modes.css",
    "games/"+name+"/sw.js"
  ]),
  "games/boxe/boxing-touch.js",
  "games/boxe/js/game_box.js",
  "games/ar/js/game_ar.js","games/ar/combat-controls.css","games/ar/icon.svg","games/ar/icon-192.png","games/ar/icon-512.png","games/ar/manifest.json","covers/ar.svg",
  ...["ar","voo"].flatMap(name=>["games/"+name+"/world-renderer.js","games/"+name+"/vendor/three-r128.min.js"]),
  "games/voo/js/game_flight.js","games/voo/helicopter-controls.css",
  "games/ar/hand-controls.js","games/ar/hand-tracker-worker.js",
  ...["vision_bundle.mjs","vision_wasm_internal.js","vision_wasm_internal.wasm","vision_wasm_nosimd_internal.js","vision_wasm_nosimd_internal.wasm","hand_landmarker.task","sources.json","LICENSE"].map(file=>"games/ar/vendor/hand-tracker/"+file),
  "games/otthi/style.css","games/otthi/release-manifest.json","games/otthi/assets/ot-games-airframes.json",
  "games/kart/js/game_kart.js","games/tenis/js/game_tennis.js",
  "games/otthi/app.js","games/otthi/family-mascots.js","games/familia/3d/sw.js",
  ...["kart","boxe","tenis","ar","voo"].flatMap(name=>["games/"+name+"/mastery-gamepad.js","games/"+name+"/control-modes.css","games/"+name+"/arcade-enhancements.js"]),
  ...["kart","boxe","tenis","ar","voo"].flatMap(name=>["games/"+name+"/play-settings.js","games/"+name+"/play-settings.css"])
];
const sha=buf=>createHash("sha256").update(buf).digest("hex");
const errors=[],verified=[];
const unique=[...new Set(paths)];
async function inspect(path){
 const expected=readFileSync(new URL(path,root));
 let actual,code,reason="";
 for(let attempt=0;attempt<4;attempt++){
   const controller=new AbortController();
   const timeout=setTimeout(()=>controller.abort(),11000);
   try{
     const response=await fetch(base+path+"?arcade-qa="+Date.now()+"-"+attempt,{cache:"no-store",signal:controller.signal});
     code=response.status;
     const type=response.headers.get("content-type")||"";
     actual=Buffer.from(await response.arrayBuffer());
     if(response.ok && actual.equals(expected)){clearTimeout(timeout);break;}
     reason=response.ok?"Publicação diferente da versão main":("HTTP "+code);
     if(type.includes("text/html")&&path.endsWith(".js"))reason="Arquivo de script retornou HTML";
   }catch(error){reason=String(error)}
   finally{clearTimeout(timeout)}
   if(attempt<3)await new Promise(res=>setTimeout(res,3500));
 }
 if(actual?.equals(expected)){
   verified.push({file:path,bytes:actual.byteLength,sha256:sha(actual).slice(0,16)});
 }else{
   errors.push({file:path,status:code,reason,expected:sha(expected).slice(0,16),received:actual?sha(actual).slice(0,16):null});
 }
}
let next=0;
await Promise.all(Array.from({length:5},async()=>{
 while(next<unique.length){const path=unique[next++];await inspect(path)}
}));
console.log(JSON.stringify({publishedBase:base,verifiedFiles:verified.length,expected:unique.length,failures:errors,results:verified},null,2));
assert.equal(errors.length,0,"O site público não corresponde aos arquivos atuais do repositório.");

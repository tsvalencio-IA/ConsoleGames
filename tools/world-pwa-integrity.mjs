/* Reconcile real OTThi SHA-256 PWA shell and keep HQ 3D offline assets in scope.
 * Never remove content, relax integrity checks, change accounts or Firebase.
 */
import {readFileSync,writeFileSync,copyFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {join} from "node:path";
const read=p=>readFileSync(p,"utf8");
const write=(p,s)=>writeFileSync(p,s,"utf8");
const root="games/otthi/";
const jsonPath=root+"release-manifest.json";
const manifest=JSON.parse(read(jsonPath));
const swPath=root+"sw.js";
let sw=read(swPath);
if(manifest.algorithm!=="SHA-256"||!sw.includes("await verifyResponse(response, resource, manifest)"))throw Error("OTThi integrity verification missing");
if(!sw.includes("const REVISION = '"+manifest.revision+"'"))throw Error("Release revision differs from SW");
let updated=0;
for(const [path,oldHash] of Object.entries(manifest.files)){
 const local=root+path;
 if(!existsSync(local))throw Error("Manifest file absent: "+path);
 const hash=createHash("sha256").update(readFileSync(local)).digest("hex");
 if(path==="index.html"){
   if(oldHash!==hash){manifest.files[path]=hash;updated++;}
 }else if(path==="sw.js"){
   // SW code receives new optional Studio assets below; hash is reconciled after edit.
 }else if(hash!==oldHash) {
   throw Error("Unrequested upstream asset drift: "+path+" expected "+oldHash+" got "+hash);
 }
}
if(updated!==1)throw Error("Expected exactly one altered OTThi shell HTML; found "+updated);
write(jsonPath,JSON.stringify(manifest,null,2)+"\n");
const otthiResources=[
  "'./console-world.css'","'./console-world.js'","'./quest-chapter.js'",
  "'./studio-world.css'","'./studio-world.js'"
];
const addTo="'./404.html',";
if(!sw.includes(addTo))throw Error("OTThi optional cache changed");
sw=sw.replace(addTo,addTo+"\n  "+otthiResources.join(",\n  ")+",");
write(swPath,sw);
manifest.files["sw.js"]=createHash("sha256").update(readFileSync(swPath)).digest("hex");
write(jsonPath,JSON.stringify(manifest,null,2)+"\n");
const dir="games/familia/",world="games/familia/3d/";
const modules=["console-world.css","console-world.js","quest-chapter.js","studio-world.css","studio-world.js"];
for(const file of modules){
  if(!existsSync(dir+file))throw Error("Missing world asset "+dir+file);
  copyFileSync(dir+file,world+file);
}
const htmlPath=world+"index.html";
let html=read(htmlPath);
for(const asset of modules){
  const reference="../"+asset;
  if(!html.includes(reference))throw Error("HQ 3D asset reference unexpected: "+reference);
  html=html.replace(reference,"./"+asset);
}
write(htmlPath,html);
const hqSWPath=world+"sw.js";
let hqSW=read(hqSWPath);
if(!hqSW.includes("universo-thiaguinho-3d-pwa-v4"))throw Error("HQ offline cache changed");
hqSW=hqSW.replace("universo-thiaguinho-3d-pwa-v4","universo-thiaguinho-3d-pwa-v5");
const oldAssets="'./mascotes-3d.js', './acoes-visuais.js', './acoes-visuais.css',";
if(!hqSW.includes(oldAssets))throw Error("HQ asset list changed");
hqSW=hqSW.replace(oldAssets,oldAssets+"\n  "+modules.map(x=>"'./"+x+"'").join(", ")+",");
write(hqSWPath,hqSW);
const testsPath="tests/games.test.mjs";
let test=read(testsPath);
if(!test.includes("assert(source.includes('src=\"../console-world.js\"'));"))throw Error("HQ test changed");
test=test.replace("assert(source.includes('src=\"../console-world.js\"'));","assert(source.includes('src=\"./console-world.js\"'));");
write(testsPath,test);
const verification="tests/studio-verify.mjs";
let v=read(verification);
if(!v.includes('["familia","games/familia/3d/index.html","../studio-world.css","../studio-world.js"]'))throw Error("Studio test changed");
v=v.replace('["familia","games/familia/3d/index.html","../studio-world.css","../studio-world.js"]',
            '["familia","games/familia/3d/index.html","./studio-world.css","./studio-world.js"]');
write(verification,v);
console.log("OTThi integrity hash reconciled and unchanged SHA-256 validation preserved.");
console.log("HQ offline scope corrected for",modules.length,"scripts/styles, cache v5.");

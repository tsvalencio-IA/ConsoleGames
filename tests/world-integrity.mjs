/* PWA integrity self-check must run after World PWA fix. */
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
const root="games/otthi/",manifest=JSON.parse(readFileSync(root+"release-manifest.json","utf8"));
let verified=0;
for(const [file,expected] of Object.entries(manifest.files)){
 assert(existsSync(root+file),"Missing OTThi release file: "+file);
 const actual=createHash("sha256").update(readFileSync(root+file)).digest("hex");
 assert.equal(actual,expected,"OTThi PWA integrity SHA mismatch: "+file);
 verified++;
}
const sw=readFileSync(root+"sw.js","utf8");
assert(sw.includes("const REVISION = '"+manifest.revision+"'"),"SW revision mismatch");
assert(sw.includes("await verifyResponse(response, resource, manifest)"),"Integrity check disabled");
for(const name of ["studio-world.js","studio-world.css","quest-chapter.js","console-world.js","console-world.css"]){
 assert(sw.includes("'./"+name+"'"),"Asset absent from offline cache: "+name);
 const world="games/familia/3d/";
 assert(existsSync(world+name),"HQ world file not inside game scope: "+name);
 const html=readFileSync(world+"index.html","utf8");
 assert(html.includes("./"+name),"HQ HTML missing local "+name);
 const hqSw=readFileSync(world+"sw.js","utf8");
 assert(hqSw.includes("'./"+name+"'"),"HQ PWA lacks "+name);
}
assert(readFileSync("games/familia/3d/sw.js","utf8").includes("universo-thiaguinho-3d-pwa-v5"));
console.log("PWA SHA-256 verified:",verified,"OTThi release assets. HQ 3D local offline resources: 5.");

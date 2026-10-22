/* PWA integrity self-check must run after World PWA fix. */
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
const root="games/otthi/",manifest=JSON.parse(readFileSync(root+"release-manifest.json","utf8"));
const build=JSON.parse(readFileSync(root+'VERSION.json','utf8')).build;
assert.equal(manifest.build,build,'Release build mismatch');
for(const [file,pattern]of [
 ['index.html',/data-otthi-build="([^"]+)"/],
 ['assets/js/core/runtime-config.js',/build:\s*'([^']+)'/],
 ['src/modules/00-runtime-foundation.js',/OTTHI_GAME_WEB_BUILD = '([^']+)'/],
 ['sw.js',/const BUILD = '([^']+)'/]
])assert.equal(readFileSync(root+file,'utf8').match(pattern)?.[1],build,'Startup build mismatch: '+file);
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
assert(/universo-thiaguinho-3d-pwa-v\d+/.test(readFileSync("games/familia/3d/sw.js","utf8")));
console.log("PWA SHA-256 verified:",verified,"OTThi release assets. HQ 3D local offline resources: 5.");

assert(readFileSync("games/familia/3d/index.html","utf8").includes('src="./gamepad-support.js"'));
assert(readFileSync("games/familia/3d/sw.js","utf8").includes("'./gamepad-support.js'"));

assert(readFileSync('games/familia/3d/index.html','utf8').includes('__HQ_RENDER_SCALE'));
assert(readFileSync('games/familia/3d/sw.js','utf8').includes("'./adaptive-quality.js'"));

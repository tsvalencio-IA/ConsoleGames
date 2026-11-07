/* Read-only HTTPS audit of the release manifest and changed console runtimes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const receipt=JSON.parse(fs.readFileSync('docs/evidence/world-current-release.json'));
const origin=process.env.WORLD_RELEASE_ORIGIN||receipt.productionUrl;
const url=new URL(origin);assert.equal(url.protocol,'https:');assert(!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname==='/');
const manifest=JSON.parse(fs.readFileSync('games/otthi/release-manifest.json'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const expected=new Map(Object.entries(manifest.files).map(([path,hash])=>['games/otthi/'+path,hash]));
const extra=['arcade/index.html','arcade/app.js','arcade/sw.js','arcade/manifest.webmanifest','games/otthi/release-manifest.json','games/otthi/sw.js','games/otthi/VERSION.json',
 'games/ar/index.html','games/ar/hand-controls.js','games/ar/js/game_ar.js','games/ar/control-modes.js','games/ar/mastery-gamepad.js','games/ar/combat-controls.css','games/ar/sw.js',
 'games/voo/index.html','games/voo/js/game_flight.js','games/voo/sw.js','games/tenis/index.html','games/tenis/js/game_tennis.js','games/tenis/sw.js'];
for(const path of extra)expected.set(path,sha(fs.readFileSync(path)));
const paths=[...expected],report={origin,build:manifest.build,revision:manifest.revision,expected:paths.length,verified:[],failures:[],limits:['Read-only HTTP content verification. No user login, camera, saved account, live room or database mutation.']};let next=0;
await Promise.all(Array.from({length:4},async()=>{
 while(next<paths.length){const [path,hash]=paths[next++];let failure;
  for(let attempt=0;attempt<3;attempt++)try{
   const response=await fetch(new URL(path+'?verify='+manifest.revision,url),{cache:'no-store',signal:AbortSignal.timeout(25000)});
   assert.equal(response.status,200);const bytes=Buffer.from(await response.arrayBuffer());const actual=sha(bytes);assert.equal(actual,hash,'SHA-256 mismatch');
   report.verified.push({path,bytes:bytes.length,sha256:actual});failure=null;break;
  }catch(error){failure={path,error:String(error)};}
  if(failure)report.failures.push(failure);
 }
}));
report.passed=report.failures.length===0;report.checkedAt=new Date().toISOString();
fs.mkdirSync('test-results/console-http-integrity',{recursive:true});fs.writeFileSync('test-results/console-http-integrity/result.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({origin,build:report.build,revision:report.revision,verified:report.verified.length,expected:report.expected,failures:report.failures}));
assert(report.passed,'Published console bytes differ from the reviewed source');

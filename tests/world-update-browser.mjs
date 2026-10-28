/* A real old service worker, saved profile, waiting update, reload and offline boot. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),prefix='games/otthi/',oldSha=process.env.WORLD_OLD_SHA||'8554d2a9204abc5e8be2244d61a533281155de8f';
const oldFile=p=>execFileSync('git',['show',oldSha+':'+prefix+p],{maxBuffer:90000000});
const oldManifest=JSON.parse(oldFile('release-manifest.json')),current=JSON.parse(readFileSync(prefix+'release-manifest.json'));
const oldFiles=new Map([['release-manifest.json',oldFile('release-manifest.json')]]);
for(const p of Object.keys(oldManifest.files))oldFiles.set(p,oldFile(p));
let release='current';const errors=[],results=[];
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
const server=createServer((req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'').replace(/\/$/,'/index.html'),file=resolve(root,path);
  if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}
  const local=path.startsWith(prefix)?path.slice(prefix.length):null,body=release==='old'&&oldFiles.has(local)?oldFiles.get(local):existsSync(file)?readFileSync(file):null;
  if(!body){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
 }catch{res.writeHead(500).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,base=origin+'/games/otthi/';
const browser=await chromium.launch({executablePath:process.env.OT_BROWSER_BINARY||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});mkdirSync('test-results/world-update',{recursive:true});
async function context(options={}){
 const c=await browser.newContext({viewport:{width:393,height:780},isMobile:true,hasTouch:true,...options});
 await c.addInitScript(()=>{
  const key='otthos_life_world_roleplay_v700';if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:705,profile:{name:'Progresso preservado',nameConfirmed:true,playerId:'update-qa',coins:4321,xp:1234,level:2},position:{x:-18,y:0,z:39,yaw:0},flags:{accountPromptedV635:true},guardian:{sessionLimitMinutes:0},familyAdventure:{party:{controller:'thiago',members:['thiago','luna','liz']},deliveries:{luna:2,liz:1},flags:{}}}));
  localStorage.setItem('qa-other-app-session','preserved');sessionStorage.setItem('qa-loads',String(Number(sessionStorage.getItem('qa-loads')||0)+1));
 });
 await c.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===origin?r.continue():r.abort('blockedbyclient'));
 return c;
}
async function verifySave(p){const state=await p.evaluate(()=>window.OTTHOS_TEST_API.getState());assert.equal(state.profile.coins,4321);assert.equal(state.profile.xp,1234);assert.deepEqual(state.familyAdventure.party,{controller:'thiago',members:['thiago','luna','liz']});assert.equal(state.familyAdventure.deliveries.luna,2);assert.equal(state.position.x,-18);}
let debugPage=null,debugContext=null;const log=[];
try{
 // A stale configuration produces the exact failed-startup condition in the photo.
 const c=await context({serviceWorkers:'block'}),p=await c.newPage();let stale=true;
 await p.route('**/assets/js/core/runtime-config.js?*',r=>{if(stale){stale=false;return r.fulfill({status:200,contentType:'text/javascript',body:oldFiles.get('assets/js/core/runtime-config.js')});}return r.continue();});
 p.on('pageerror',e=>errors.push(e.message));await p.goto(base,{waitUntil:'domcontentloaded'});
 await p.waitForFunction(build=>window.OTTHI_RELEASE_COHERENT&&window.OTTHI_GAME_BUILD===build&&Number(sessionStorage.getItem('qa-loads'))>=2,current.build,{timeout:40000});
 await verifySave(p);assert(!await p.locator('#modal').isVisible());assert(!new URL(p.url()).searchParams.has('otthi_probe'));
 await p.screenshot({path:'test-results/world-update/recovered-startup.png'});results.push({scenario:'stale-config',automaticRecovery:true,preserved:true});await c.close();

 release='old';const upgraded=await context();
 await upgraded.addInitScript(()=>{window.__holdWorker=true;const send=ServiceWorker.prototype.postMessage;ServiceWorker.prototype.postMessage=function(message,...args){if(message?.type==='SKIP_WAITING'&&window.__holdWorker)return;return send.call(this,message,...args);};});
 const page=debugPage=await upgraded.newPage();debugContext=upgraded;page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')log.push(m.text());});await page.goto(base,{waitUntil:'load'});
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:45000});assert.equal(await page.evaluate(()=>window.OTTHI_GAME_BUILD),oldManifest.build);await verifySave(page);
 // Reopen the installed old version, as on a returning user's phone.
 await page.reload({waitUntil:'load'});await verifySave(page);
 release='current';await page.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration()).update();});
 const deadline=Date.now()+45000;let waiting=false;while(Date.now()<deadline){waiting=await page.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration())?.waiting);if(waiting)break;await page.waitForTimeout(100);}assert(waiting,'the complete new release must wait for the ready page');
 console.log('NEW WORKER WAITING',await page.evaluate(async()=>({build:OTTHI_GAME_BUILD,reg:((r)=>({waiting:r?.waiting?.state,installing:r?.installing?.state,active:r?.active?.state}))(await navigator.serviceWorker.getRegistration())})));
 assert.equal(await page.evaluate(()=>window.OTTHI_GAME_BUILD),oldManifest.build,'new worker cannot change the files of a document still loading the old release');assert(await page.evaluate(()=>window.OTTHI_RELEASE_COHERENT));
 await page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration(),worker=registration.waiting;window.__holdWorker=false;worker?.postMessage({type:'SKIP_WAITING'});});
 await page.waitForFunction(build=>window.OTTHI_RELEASE_COHERENT&&window.OTTHI_GAME_BUILD===build,current.build,{timeout:45000});await verifySave(page);assert.equal(await page.evaluate(()=>localStorage.getItem('qa-other-app-session')),'preserved');
 await page.screenshot({path:'test-results/world-update/upgraded-existing-profile.png'});results.push({scenario:'real-worker-upgrade',waitedForPageReady:true,preserved:true});
 await upgraded.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.OTTHI_RELEASE_COHERENT);await verifySave(page);assert(await page.locator('#playBtn').isVisible());
 results.push({scenario:'offline-after-upgrade',coherent:true,preserved:true});await upgraded.close();assert.deepEqual(errors,[]);
 writeFileSync('test-results/world-update/result.json',JSON.stringify({passed:true,build:current.build,revision:current.revision,results,errors},null,2));console.log('WORLD UPDATE PASS',JSON.stringify(results));
}catch(error){
 if(debugPage){console.error('UPDATE STATE',await debugPage.evaluate(async()=>({url:location.href,build:window.OTTHI_GAME_BUILD,coherent:window.OTTHI_RELEASE_COHERENT,modal:document.querySelector('#modal')?.innerText,caches:await caches.keys(),registration:((r)=>({waiting:r?.waiting?.state,installing:r?.installing?.state,active:r?.active?.state}))(await navigator.serviceWorker.getRegistration())})).catch(e=>e.message));await debugPage.screenshot({path:'test-results/world-update/failure.png'}).catch(()=>{});}
 console.error('UPDATE LOG',JSON.stringify(log));if(debugContext)for(const worker of debugContext.serviceWorkers())console.error('WORKER STATE',await worker.evaluate(()=>({build:typeof BUILD==='string'?BUILD:null,revision:typeof REVISION==='string'?REVISION:null})).catch(e=>e.message));throw error;
}finally{await browser.close();await new Promise(r=>server.close(r));}

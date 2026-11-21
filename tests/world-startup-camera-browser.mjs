/* Native startup and fixed camera draws. Run cases sequentially, in isolation.
 * Inspection adds counters only; no render cap, clock changes or live accounts. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
const revision=process.env.OT_START_REVISION||'current',quality=process.env.OT_START_QUALITY||'low';
const out=process.env.OT_START_OUT||'test-results/startup-camera-'+revision.slice(0,8)+'-'+quality;
const read=p=>revision==='current'?fs.readFileSync(p):execFileSync('git',['show',revision+':'+p],{maxBuffer:8e6});
const source=read('games/otthi/app.js').toString(),end=source.lastIndexOf('})();');
assert(end>0);fs.mkdirSync(out,{recursive:true});
const hook=`
const startupQa={loadingCalls:0,modalBuilds:0,finishCalls:0,compileCalls:0};
const startupQaLoading=showWorldLoading,startupQaModal=openModal,startupQaInit=initThree;
showWorldLoading=function(...args){startupQa.loadingCalls++;return startupQaLoading(...args);};
openModal=function(...args){if(args[0]==='Preparando o mundo')startupQa.modalBuilds++;return startupQaModal(...args);};
initThree=function(...args){const result=startupQaInit(...args);if(renderer){const gl=renderer.getContext(),finish=gl.finish.bind(gl),compile=renderer.compile.bind(renderer);gl.finish=function(...a){startupQa.finishCalls++;return finish(...a);};renderer.compile=function(...a){startupQa.compileCalls++;return compile(...a);};}return result;};
window.__START_QA={
 freeze:()=>cancelAnimationFrame(raf),
 state:()=>({counters:{...startupQa},vehiclePreparation:perf.vehiclePreparation,scenePreparation:perf.scenePreparation,lightPreparation:worldLightBudget.preparation,quality:qualityTier(),npcs:world.npcs.length,traffic:completeTraffic.created.size,programs:renderer.info.programs.length,memory:{...renderer.info.memory},buffer:{width:renderer.domElement.width,height:renderer.domElement.height,dpr:renderer.getPixelRatio()}}),
 draw:(yaw,pitch)=>{cameraYaw=yaw;cameraPitch=pitch;updateCamera(1);updateVisualLOD();const restoreHome=prepareHomeRender(),restoreLights=prepareWorldPointLights(camera),before=renderer.info.programs.length,start=performance.now();try{renderer.render(scene,camera);renderer.getContext().finish();return{ms:performance.now()-start,newPrograms:renderer.info.programs.length-before,programs:renderer.info.programs.length,lights:{...worldLightBudget.stats},memory:{...renderer.info.memory}};}finally{restoreLights?.();restoreHome?.();}}
};`;
const server=await multiplayerServer(),browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={revision,quality,sourceSha256:createHash('sha256').update(source).digest('hex'),browser:browser.version(),viewport:{width:393,height:852,dpr:1},samples:[],limits:['Native startup and WebGL with read-only counters; no renderer cap or accelerated clock.','Camera draws after startup freeze simulation at the initial position to isolate first-use rendering.','Disposable local profile; external network/database requests blocked.','Linux Chromium/SwiftShader samples, not physical phone FPS or a prolonged session.']},errors=[];
try{
 const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.abort());
 await context.addInitScript(quality=>{let seed=921;Math.random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,profile:{name:'Startup camera QA',nameConfirmed:true,playerId:'startup-camera-local',coins:2345},flags:{accountPromptedV635:true},settings:{quality,sound:false,worldHud:'clean'},guardian:{sessionLimitMinutes:0},familyAdventure:{party:{controller:'thiago',members:['thiago','thamis','luna','liz']}}}));},quality);
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.stack));
 for(const path of ['index.html','VERSION.json','release-manifest.json','style.css','assets/js/core/runtime-config.js','assets/js/core/viewport-manager.js']){
  const body=read('games/otthi/'+path),contentType=path.endsWith('.html')?'text/html':path.endsWith('.json')?'application/json':path.endsWith('.css')?'text/css':'application/javascript';
  await page.route(path==='index.html'?/\/games\/otthi\/(?:index\.html)?(?:\?.*)?$/:new RegExp('/games/otthi/'+path.replaceAll('.','\\.')+'(?:\\?.*)?$'),r=>r.fulfill({body,contentType}));
 }
 await page.route('**/app.js*',r=>r.fulfill({contentType:'application/javascript',body:source.slice(0,end)+hook+source.slice(end)}));
 const start=Date.now();await page.goto(server.origin+'/games/otthi/');const clickAt=Date.now();await page.locator('#playBtn').click();
 await page.waitForFunction(()=>window.__START_QA&&OTTHOS_TEST_API.getGame().running&&!OTTHOS_TEST_API.getGame().paused&&document.getElementById('modal').hidden,null,{timeout:240000});
 report.bootMs=Date.now()-start;report.playToReadyMs=Date.now()-clickAt;
 // Family members join on the first native simulation frames. Keep the
 // complete population for both cases instead of freezing that work early.
 await page.waitForFunction(()=>OTTHOS_TEST_API.getGame().objects.npcs===138&&OTTHI_WORLD_TRAFFIC.diagnostics().created===44,null,{timeout:120000});
 report.fullPopulationReadyMs=Date.now()-start;
 await page.evaluate(()=>__START_QA.freeze());report.initial=await page.evaluate(()=>__START_QA.state());
 for(const pitch of[-.55,.28,1.35])for(const yaw of[0,Math.PI/2,Math.PI,Math.PI*1.5]){
  const first=await page.evaluate(p=>__START_QA.draw(...p),[yaw,pitch]),repeat=await page.evaluate(p=>__START_QA.draw(...p),[yaw,pitch]);report.samples.push({yaw,pitch,first,repeat});
 }
 report.final=await page.evaluate(()=>__START_QA.state());report.errors=errors;assert.deepEqual(errors,[]);assert.equal(report.initial.traffic,44);assert.equal(report.initial.npcs,138);
 report.passed=true;report.checkedAt=new Date().toISOString();fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({passed:true,revision,quality,bootMs:report.bootMs,playToReadyMs:report.playToReadyMs,initial:report.initial,maxFirstDrawMs:Math.max(...report.samples.map(r=>r.first.ms)),newPrograms:report.samples.reduce((n,r)=>n+r.first.newPrograms,0)}));
}catch(e){report.passed=false;report.errors=errors;report.failure=e.stack;fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));throw e;}finally{await browser.close();await server.close();}

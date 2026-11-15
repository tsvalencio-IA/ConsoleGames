/* Native renderer diagnosis at fixed poses. The scan keeps all scene content;
 * it freezes simulation only to compare camera angles without traffic drift.
 * Software WebGL timings are renderer samples, not physical-phone FPS. */
import {chromium} from 'playwright';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {installWorldRtdbFixture} from './helpers/world-rtdb-browser-fixture.mjs';
import {installCityInspection} from './helpers/world-city-inspection.mjs';

const revision=process.env.OT_CAMERA_REVISION||'2e3f1be286e74c0f998b81d7ba2a01147afc82a1';
const current=revision==='current',label=process.env.OT_CAMERA_LABEL||(current?'after':'before');
const out=process.env.OT_CAMERA_OUT||'test-results/world-camera-angle-'+label;
const quality=process.env.OT_CAMERA_QUALITY||'balanced';
const mode=process.env.OT_CAMERA_MODE||'scan';
fs.mkdirSync(out,{recursive:true});
const source=current?fs.readFileSync('games/otthi/app.js','utf8'):execFileSync('git',['show',revision+':games/otthi/app.js'],{encoding:'utf8',maxBuffer:6e6}),end=source.lastIndexOf('})();');
const hook=`
const angleQaNow=performance.now.bind(performance),angleQaGL={compileShader:0,linkProgram:0,bufferData:0,texImage2D:0};
window.__ANGLE_QA={
 stop:tier=>{cancelAnimationFrame(raf);state.settings.quality=tier==='balanced'?'auto':tier;perf.sessionTier=tier;perf.renderScale=1;applyAdaptiveRenderSettings(true);lockStableSceneVisibility();const gl=renderer.getContext();for(const name of['compileShader','linkProgram','bufferData','texImage2D']){const prior=gl[name].bind(gl);gl[name]=function(...a){angleQaGL[name]++;return prior(...a)};}},
 pose:(x,z,yaw,pitch)=>{OTTHOS_TEST_API.teleport(x,z);cameraYaw=yaw;cameraPitch=pitch;cameraZoom=0;updateCamera(1);const start=angleQaNow();updateVisualLOD();const lodMs=angleQaNow()-start;updateCamera(1);applyPendingRenderBuffer();return{lodMs,position:camera.position.toArray(),cameraYaw,cameraPitch};},
 scan:()=>{const restoreHome=prepareHomeRender(),restoreLights=prepareWorldPointLights(camera);try{let pointLights=0;scene.traverseVisible(o=>{if(o.isPointLight&&o.layers.test(camera.layers))pointLights++;});return{lights:{...worldLightBudget.stats},pointLights,programs:renderer.info.programs.length};}finally{restoreLights?.();restoreHome?.();}},
 draw:()=>{const beforePrograms=renderer.info.programs.length,compileBefore={...angleQaGL},restoreHome=prepareHomeRender(),restoreLights=prepareWorldPointLights(camera),draw=cityQaBootRenders.get(renderer)||renderer.render.bind(renderer),start=angleQaNow();try{draw(scene,camera);return{ms:angleQaNow()-start,beforePrograms,programs:renderer.info.programs.length,newPrograms:renderer.info.programs.length-beforePrograms,compileShader:angleQaGL.compileShader-compileBefore.compileShader,linkProgram:angleQaGL.linkProgram-compileBefore.linkProgram,bufferData:angleQaGL.bufferData-compileBefore.bufferData,texImage2D:angleQaGL.texImage2D-compileBefore.texImage2D,lights:{...worldLightBudget.stats},calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures};}finally{restoreLights?.();restoreHome?.();}},
 state:()=>({quality:qualityTier(),glows:world.glows.length,visibleGlows:world.glows.filter(l=>l.visible).length,programs:renderer.info.programs.length,catalog:Object.keys(OTBrazilVehicles.catalog).length,npcs:world.npcs.length,buffer:{width:renderer.domElement.width,height:renderer.domElement.height,dpr:renderer.getPixelRatio()},shaderCalls:{...angleQaGL},scenePreparation:perf.scenePreparation,vehiclePreparation:perf.vehiclePreparation})
};`;
const server=await multiplayerServer(),browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],report={revision,label,mode,quality,browser:browser.version(),samples:[],limits:['Local disposable account and RTDB. No production account or database mutation.','Native renderer, frozen simulation and fixed camera poses. This isolates angle-dependent rendering; it is not whole-game RAF, sustained FPS or phone performance.','Scan time may run alongside diagnostics and is not a before/after performance comparison. Only separately scheduled comparison runs may be compared.']};let page;
try{
 const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.abort());await installWorldRtdbFixture(context);
 await context.addInitScript(quality=>{let seed=921;Math.random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,profile:{name:'Camera angle QA',nameConfirmed:true,playerId:'angle-profile-local',coins:2345},avatar:{bodyStyle:'family-thiago'},flags:{accountPromptedV635:true},settings:{quality,sound:false},guardian:{sessionLimitMinutes:0},familyAdventure:{party:{controller:'thiago',members:['thiago','thamis','luna','liz']}}}));},quality);
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.stack));await installCityInspection(page,{revision:current?null:revision,appSource:source.slice(0,end)+hook+source.slice(end),capDuringBoot:false});
 await page.goto(server.origin+'/games/otthi/');await page.locator('#playBtn').click();await page.waitForFunction(()=>window.__CITY_QA&&OTTHOS_TEST_API.getGame().running&&!OTTHOS_TEST_API.getGame().paused&&document.getElementById('modal').hidden,null,{timeout:180000});
 await page.waitForFunction(()=>OTTHOS_TEST_API.getGame().objects.npcs===138&&OTTHI_WORLD_TRAFFIC.diagnostics().created===44,null,{timeout:180000});await page.evaluate(tier=>__ANGLE_QA.stop(tier),quality);report.initial=await page.evaluate(()=>__ANGLE_QA.state());
 const places=[['home',-18,39],['crossing',8,0],['downtown',-22,-12.7],['coast',-340,509]],seen=new Set();
 for(const[name,x,z]of places)for(const pitch of[-.55,.28,1.35])for(let step=0;step<8;step++){
  const yaw=step*Math.PI/4,pose=await page.evaluate(p=>__ANGLE_QA.pose(...p),[x,z,yaw,pitch]),scan=await page.evaluate(()=>__ANGLE_QA.scan());const row={name,x,z,yaw,pitch,...pose,...scan};
  const key=scan.pointLights;
  if(mode==='draw'||!seen.has(key)){seen.add(key);row.firstDraw=await page.evaluate(()=>__ANGLE_QA.draw());row.repeatDraw=await page.evaluate(()=>__ANGLE_QA.draw());console.log('ANGLE',name,pitch,yaw,JSON.stringify({pointLights:scan.pointLights,first:row.firstDraw,repeat:row.repeatDraw}));}
  report.samples.push(row);
 }
 report.final=await page.evaluate(()=>__ANGLE_QA.state());report.pointLightBuckets=[...new Set(report.samples.map(s=>s.pointLights))].sort((a,b)=>a-b);report.errors=errors;assert.deepEqual(errors,[]);assert.equal(report.initial.catalog,44);assert.equal(report.initial.npcs,138);report.passed=true;fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));console.log('PASS camera angle scan',JSON.stringify({buckets:report.pointLightBuckets,initial:report.initial,final:report.final}));
}catch(e){report.passed=false;report.failure=e.stack;report.errors=errors;fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));throw e;}finally{await browser.close();await server.close();}

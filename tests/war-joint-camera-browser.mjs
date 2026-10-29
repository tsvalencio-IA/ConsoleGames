/* Two production ML workers read the same official photo replayed as video.
 * No worker or landmarks are mocked. A physical phone remains untested. */
import{chromium}from'playwright';import assert from'node:assert/strict';import fs from'node:fs';
import{multiplayerServer}from'./helpers/multiplayer-browser-fixture.mjs';
import{browserNetwork,browserContextNetwork}from'./helpers/browser-network.mjs';
const server=await multiplayerServer(),origin=process.env.CONSOLE_QA_ORIGIN||server.origin;
const browser=await chromium.launch({...browserNetwork(origin),executablePath:process.env.OT_BROWSER_BINARY,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
fs.mkdirSync('test-results/war-joint-camera',{recursive:true});
try{
 const context=await browser.newContext({...browserContextNetwork(origin),viewport:{width:844,height:390},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===origin?r.continue():r.request().resourceType()==='script'?r.fulfill({contentType:'application/javascript',body:'/* isolated external services */'}):r.abort('blockedbyclient'));
 await context.route('**/tests/fixtures/pose/male_full_height_hands.jpg',r=>r.fulfill({contentType:'image/jpeg',body:fs.readFileSync('tests/fixtures/pose/male_full_height_hands.jpg')}));
 await context.addInitScript(()=>{
  window.__blankWarBody=false;window.__warCameraRequests=[];
  Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async constraints=>{
   __warCameraRequests.push(constraints);const image=new Image();image.src='/tests/fixtures/pose/male_full_height_hands.jpg';await image.decode();const c=document.createElement('canvas');c.width=640;c.height=480;const x=c.getContext('2d');let tick=0;
   const paint=()=>{x.fillStyle='#334455';x.fillRect(0,0,640,480);if(!__blankWarBody)x.drawImage(image,167,0,306,480);x.fillStyle=++tick%2?'#334456':'#334455';x.fillRect(0,0,4,4);};paint();setInterval(paint,65);return c.captureStream(15);
  }}});
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/games/ar/',{waitUntil:'domcontentloaded'});await page.locator('[data-solo-start]').click();await page.waitForFunction(()=>window.ConsolePractice.active&&System.canvas);await page.locator('#phase-grid .mission-card').first().click();await page.locator('[data-mode="camera"]').click();await page.locator('.war-hand-camera.calibrating').waitFor();
 try{
  await page.waitForFunction(()=>{const g=System.activeGame?.logic;return g?.state==='PLAYING'&&g.handAim?.fresh&&g.bodyPose?.fresh},null,{timeout:60000});
  const calibrated=await page.evaluate(()=>{const g=System.activeGame.logic,s=g.handSession;return{state:g.state,body:structuredClone(g.bodyPose),hand:structuredClone(g.handAim),bodySamples:s.bodySession.controller.samples.length,handSamples:s.controller.samples.length,crop:s.inflightCrop,bodyMs:s.bodySession.computeMs,handMs:s.lastInferenceMs};});
  assert(calibrated.body.calibrated);assert(calibrated.handSamples>=9);assert(calibrated.bodySamples>=6);assert(calibrated.crop.w<1);assert(!await page.locator('.war-hand-camera canvas').isVisible());assert.equal(await page.locator('.combat-input [data-control="joystick"]').count(),0);assert.equal(await page.evaluate(()=>__warCameraRequests[0].video.facingMode.ideal),'user');
  await page.evaluate(()=>{const g=System.activeGame.logic;g.covers=[];g.spawnWave();g.enemies=g.enemies.slice(0,1);Object.assign(g.enemies[0],{x:0,z:24,y:1.8,hp:1000,aim:999});g.player.x=g.player.z=g.player.yaw=g.player.pitch=0;g.handViewAnchor=null;g.waveDelay=999;});
  await page.waitForFunction(()=>System.activeGame.logic.stats.hits>0&&System.activeGame.logic.worldVisual?.frames>2,null,{timeout:15000});
  const combat=await page.evaluate(()=>{const g=System.activeGame.logic;return{shots:g.stats.shots,hits:g.stats.hits,renderer:g.worldVisual,infantry:ArcadeWorldRenderer.inspect(g).infantry};});assert(combat.infantry.length===1);await page.screenshot({path:'test-results/war-joint-camera/real-body-hand-hit.png'});
  const start=await page.evaluate(()=>{const g=System.activeGame.logic;g.enemies=[];g.wave=0;g.waveDelay=999;g.covers=[];g.player.x=g.player.z=g.player.yaw=g.player.pitch=0;g.handViewAnchor=null;return g.player.z;});
  await page.waitForFunction(z=>System.activeGame.logic.player.z>z+.4,start,{timeout:15000});await page.screenshot({path:'test-results/war-joint-camera/real-body-and-hand.png'});
  await page.evaluate(()=>__blankWarBody=true);await page.waitForFunction(()=>!System.activeGame.logic.bodyPose?.fresh&&!System.activeGame.logic.handAim?.fresh,null,{timeout:6000});
  const snapshot=()=>{const g=System.activeGame.logic;return{x:g.player.x,z:g.player.z,shots:g.stats.shots,elapsed:g.elapsed};};const stopped=await page.evaluate(snapshot);await page.waitForTimeout(500);assert.deepEqual(await page.evaluate(snapshot),stopped);
  await page.evaluate(()=>__blankWarBody=false);await page.waitForFunction(()=>System.activeGame.logic.bodyPose?.fresh&&System.activeGame.logic.handAim?.fresh,null,{timeout:20000});assert.equal(errors.length,0,errors.join('\n'));
  fs.writeFileSync('test-results/war-joint-camera/result.json',JSON.stringify({passed:true,origin,checkedAt:new Date().toISOString(),calibrated,combat,sameUnmodifiedSample:true,bothProductionModels:true,noWorkerInterception:true,frontCamera:true,hiddenPreview:true,assistedAdvance:true,lossStopsActions:true,reacquired:true,errors,limits:['Official static photo replayed as camera video; physical Android tracking and player accuracy not certified.']},null,2));console.log('PASS WAR both real models on same stream, calibration, crop, assisted walking, loss and reacquisition');
 }catch(error){console.log(JSON.stringify(await page.evaluate(()=>{const g=System.activeGame?.logic,s=g?.handSession;return{player:g?.player,stats:g?.stats,handLock:g?.handLock,aimed:g?.targetAtAim?.()?.id,enemies:g?.enemies?.map(e=>({id:e.id,x:e.x,z:e.z,hp:e.hp,kind:e.kind,alive:e.alive})),state:g?.state,body:g?.bodyPose,hand:g?.handAim,status:document.querySelector('.war-hand-status')?.textContent,bodyStatus:document.querySelector('[data-war-body-status]')?.textContent,bodyReason:s?.bodySession.controller.reason,bodySamples:s?.bodySession.controller.samples.length,handSamples:s?.controller.samples.length,bodyMs:s?.bodySession.computeMs,handMs:s?.lastInferenceMs,crop:s?.inflightCrop,bodyBusy:s?.bodySession.busy,handBusy:s?.busy};}),null,2));await page.screenshot({path:'test-results/war-joint-camera/failure.png'});throw error;}
 await context.close();
}finally{await browser.close();await server.close();}

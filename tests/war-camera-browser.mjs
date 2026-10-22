/* Real local MediaPipe CPU/WASM inference, then front-camera gameplay.
 * Camera video is an official test image painted to a local captureStream. */
import {chromium} from 'playwright';import assert from 'node:assert/strict';import {mkdirSync,writeFileSync} from 'node:fs';import {installConsoleStubs} from './helpers/console-context.mjs';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--no-sandbox','--disable-dev-shm-usage']});mkdirSync('test-results/hand-camera',{recursive:true});
try{
 const probe=await browser.newPage();await probe.goto('http://127.0.0.1:4173/tests/fixtures/hand/');
 const real=await probe.evaluate(async()=>{
  const worker=new Worker('/games/ar/hand-tracker-worker.js');
  return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Real model initialization timeout')),30000);worker.onmessage=async({data})=>{
   if(data.type==='ready'){const frame=await createImageBitmap(await(await fetch('woman_hands.jpg')).blob());worker.postMessage({type:'frame',frame,timestamp:performance.now()},[frame]);}
   if(data.type==='error'){clearTimeout(timer);reject(Error(data.message));worker.terminate();}
   if(data.type==='result'){clearTimeout(timer);worker.terminate();const index=Math.max(0,data.handedness.findIndex(h=>h[0].categoryName==='Right'));const points=data.landmarks[index];if(!points){reject(Error('No actual hand detected'));return;}const xs=points.map(p=>p.x),ys=points.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;resolve({hands:data.landmarks.length,labels:data.handedness.map(h=>h[0].categoryName),crop:{x:Math.max(0,x-w*.22),y:Math.max(0,y-h*.20),w:Math.min(1,w*1.44),h:Math.min(1,h*1.40)}});}
  };worker.postMessage({type:'init'});});
 });assert(real.hands>=1);await probe.close();
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});await installConsoleStubs(context);
 await context.addInitScript(crop=>{
  window.__blankHand=false;window.__cameraConstraints=[];
  Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async constraints=>{
   window.__cameraConstraints.push(constraints);const image=new Image();image.src='/tests/fixtures/hand/woman_hands.jpg';await image.decode();const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const ctx=canvas.getContext('2d');
   let tick=0;const render=()=>{ctx.fillStyle='#dcdddd';ctx.fillRect(0,0,640,480);if(!window.__blankHand){const sw=image.naturalWidth*crop.w,sh=image.naturalHeight*crop.h,scale=Math.min(460/sw,400/sh);ctx.drawImage(image,image.naturalWidth*crop.x,image.naturalHeight*crop.y,sw,sh,(640-sw*scale)/2,(480-sh*scale)/2,sw*scale,sh*scale);}ctx.fillStyle=++tick%2?'#eeeeee':'#dddddd';ctx.fillRect(0,0,12,12);};render();setInterval(render,65);window.__handCanvas=canvas;return canvas.captureStream(15);
  }}});
 },real.crop);
 await context.route(/^https?:\/\//,route=>new URL(route.request().url()).origin==='http://127.0.0.1:4173'?route.continue():route.request().resourceType()==='script'?route.fulfill({status:200,contentType:'application/javascript',body:'/* isolated service stub */'}):route.abort('blockedbyclient'));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4173/games/ar/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.Games?.some(g=>g.id==='ar_truck_sim')&&window.System?.canvas);await page.waitForFunction(()=>!document.getElementById('phase-screen')?.classList.contains('hidden'),null,{timeout:5000}).catch(async()=>{await page.locator('#channel-grid .channel').first().click();});
  await page.locator('#phase-grid .mission-card:not(.locked)').first().click();await page.locator('[data-mode="camera"]').click();await page.locator('.war-hand-camera.calibrating').waitFor();await page.screenshot({path:'test-results/hand-camera/calibration.png'});
  await page.waitForFunction(()=>window.System.activeGame?.logic.state==='PLAYING'&&window.System.activeGame.logic.handAim?.fresh,null,{timeout:35000});
  assert.equal(await page.evaluate(()=>window.__cameraConstraints[0].video.facingMode.ideal),'user');assert.equal(await page.evaluate(()=>window.System.currentCameraMode),'user');assert(!await page.locator('.combat-input [data-control="fire"]').isVisible());
  await page.evaluate(()=>{const g=window.System.activeGame.logic;g.spawnWave();g.covers=[];g.enemies=g.enemies.slice(0,1);Object.assign(g.enemies[0],{x:0,y:1.8,z:28,aim:999,hp:1000});g.player.yaw=g.player.pitch=0;g.waveDelay=999;});
  await page.waitForFunction(()=>window.System.activeGame.logic.stats.hits>0,null,{timeout:12000});
  await page.screenshot({path:'test-results/hand-camera/right-hand-aim.png'});
  await page.evaluate(()=>window.__blankHand=true);await page.waitForFunction(()=>{const g=window.System.activeGame.logic;return !g.handAim.fresh&&!g.handAim.present&&g.handSession.lastHandCount===0},null,{timeout:7000});const shots=await page.evaluate(()=>window.System.activeGame.logic.stats.shots);await page.waitForTimeout(800);assert.equal(await page.evaluate(()=>window.System.activeGame.logic.stats.shots),shots);
  await page.screenshot({path:'test-results/hand-camera/lost-hand-no-fire.png'});
  await page.locator('[data-hand="manual"]').click();assert.equal(await page.evaluate(()=>window.ArcadeControls.mode),'controls');assert(await page.locator('.combat-input [data-control="fire"]').isVisible());assert.equal(await page.evaluate(()=>window.System.video.srcObject),null);assert.equal(errors.length,0,errors.join('\n'));
  writeFileSync('test-results/hand-camera/result.json',JSON.stringify({passed:true,realModelHands:real.hands,labels:real.labels,frontCamera:true,actualAlignedHits:true,lossStopsFire:true,manualFallback:true,errors},null,2));console.log('WAR FRONT HAND PASS: real CPU/WASM detector, calibrated pointing, aligned auto-fire, lost-hand stop, manual fallback.');
 }catch(e){await page.screenshot({path:'test-results/hand-camera/failure.png'});console.error(await page.evaluate(()=>({state:window.System?.activeGame?.logic.state,status:document.querySelector('.war-hand-status')?.textContent,hand:window.System?.activeGame?.logic.handAim,model:window.System?.activeGame?.logic.handSession?.controller.state,session:(()=>{const s=window.System?.activeGame?.logic.handSession;return s?{focused:s.focused,ready:s.ready,busy:s.busy,serial:s.serial,inflight:s.inflightSerial,lastVideo:s.lastVideo,video:s.host?.video?.currentTime,videoPaused:s.host?.video?.paused,since:performance.now()-s.controller.lastSeen,lag:s.lastInferenceMs,compute:s.lastComputeMs,count:s.lastHandCount}:null})(),paused:window.System?.paused,stats:window.System?.activeGame?.logic.stats,errors:window.__errors})));throw e;}
 await context.close();
}finally{await browser.close();}

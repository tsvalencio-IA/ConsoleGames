/* Native multi-touch input, without a synthetic right aiming joystick. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {installConsoleStubs} from './helpers/console-context.mjs';
import {touchSession} from './helpers/touch-session.mjs';
const origin='http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--enable-features=SyntheticPointerActions','--use-gl=angle','--use-angle=swiftshader','--no-sandbox']});
mkdirSync('test-results/war-touch',{recursive:true});const results=[];
try{
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:320,height:568}]){
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1});await installConsoleStubs(context);
  await context.route(/^https?:\/\//,route=>new URL(route.request().url()).origin===origin?route.continue():route.request().resourceType()==='script'?route.fulfill({status:200,contentType:'application/javascript',body:'/* isolated remote service */'}):route.abort('blockedbyclient'));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const fingers=await touchSession(context,page);
  const read=()=>page.evaluate(()=>{const g=window.System.activeGame.logic;return {yaw:g.player.yaw,pitch:g.player.pitch,x:g.player.x,z:g.player.z,move:g.manualStick.active,look:g.lookPointerActive,fire:g.fireHeld,aiming:g.aiming,paused:window.System.paused,shots:g.stats.shots,focal:g.focalLength(innerWidth,innerHeight)}});
  try{
   await page.goto(origin+'/games/ar/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.Games?.some(g=>g.id==='ar_truck_sim')&&window.System?.canvas);
   await page.waitForFunction(()=>!document.getElementById('phase-screen')?.classList.contains('hidden'),null,{timeout:5000}).catch(async()=>{await page.locator('#channel-grid .channel').first().click()});
   await page.locator('#phase-grid .mission-card:not(.locked)').first().click();await page.locator('[data-mode="controls"]').click();await page.waitForFunction(()=>window.System.activeGame?.logic.state==='PLAYING');
   // Isolate input from incoming attacks; the full mission engine has separate tests.
   await page.evaluate(()=>{const g=window.System.activeGame.logic;g.enemies=[];g.waveDelay=999;g.covers=[]});
   assert.equal(await page.evaluate(()=>window.__cameraRequests),0);assert.equal(await page.locator('.aim-stick').count(),0);
   const scene=page.locator('#game-canvas'),move=page.locator('.combat-input [data-control="joystick"]'),fire=page.locator('.combat-input [data-control="fire"]'),ads=page.locator('.combat-input [data-control="ads"]');
   const controls=await page.locator('.combat-input .input-control:not([hidden]),.combat-input .move-stick').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {name:n.dataset.control,x:r.x,y:r.y,w:r.width,h:r.height,visible:getComputedStyle(n).display!=='none'}}).filter(r=>r.visible));
   for(const r of controls){assert(r.x>=0&&r.y>=0&&r.x+r.w<=viewport.width&&r.y+r.h<=viewport.height,JSON.stringify(r));assert(r.w>=44&&r.h>=44)}
   for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){const a=controls[i],b=controls[j];assert(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),'Overlapping controls: '+a.name+'/'+b.name)}
   const moving=await fingers.start(move,.78,.22),before=await read(),looking=await fingers.start(scene,.54,.46);
   assert.equal((await read()).yaw,before.yaw,'Touching the view must not jump the camera');await fingers.move(looking,scene,.68,.40);
   let state=await read();assert(state.yaw>before.yaw+.1&&state.pitch>before.pitch+.1);assert(state.move&&state.look);
   const held=state.yaw;await page.waitForTimeout(160);assert.equal((await read()).yaw,held,'A stationary finger must not keep turning');
   const firing=await fingers.start(fire);await page.waitForFunction(()=>window.System.activeGame.logic.stats.shots>0);state=await read();assert(state.move&&state.look&&state.fire);
   const aiming=await fingers.start(ads);await fingers.end(aiming);state=await read();assert(state.aiming&&state.move&&state.look&&state.fire,'A fourth touch must not cancel movement, looking or firing');assert(Math.abs(state.focal/(Math.min(viewport.width,viewport.height)*.88)-1.65)<1e-10);
   await fingers.move(looking,scene,.74,.43);const aimed=await read();assert(aimed.yaw>state.yaw&&aimed.pitch<state.pitch,'ADS must keep both swipe axes responsive');
   await page.screenshot({path:`test-results/war-touch/${viewport.width}x${viewport.height}-simultaneous.png`});
   await fingers.end(firing);state=await read();assert(!state.fire&&state.move&&state.look);await fingers.end(looking);state=await read();assert(!state.look&&state.move);await fingers.end(moving);
   const quiet=await read();await page.waitForTimeout(180);assert.equal((await read()).yaw,quiet.yaw);assert.equal((await read()).shots,quiet.shots);
   await ads.tap();assert.equal((await read()).aiming,false);assert.equal((await read()).yaw,quiet.yaw,'Action buttons must not turn the view');
   // Capture keeps a swipe owned even when it passes over another control.
   const captured=await fingers.start(scene,.6,.45);await fingers.move(captured,fire,.5,.5);assert.equal((await read()).fire,false);await fingers.cancel();assert.equal((await read()).look,false);
   await fingers.start(move,.75,.25);await fingers.start(scene,.6,.45);await fingers.start(fire);const pause=await fingers.start(page.locator('#arcade-pause'));await fingers.end(pause);await page.locator('#arcade-pause-modal').waitFor({state:'visible'});
   state=await read();assert(!state.move&&!state.look&&!state.fire&&!state.aiming,'Pause must release every independent input');const pausedYaw=state.yaw;await fingers.cancel();await page.locator('[data-action="continue"]').tap();await page.waitForFunction(()=>!window.System.paused,null,{timeout:3000});assert.equal((await read()).yaw,pausedYaw);
   await fingers.start(move,.75,.25);await fingers.start(scene,.6,.45);await fingers.start(fire);await page.setViewportSize({width:viewport.height,height:viewport.width});await page.waitForTimeout(120);state=await read();assert(!state.move&&!state.look&&!state.fire,'Orientation changes must release active touches');await fingers.cancel();
   await page.setViewportSize(viewport);await page.waitForTimeout(120);
   assert.deepEqual(errors,[]);results.push({viewport,passed:true,simultaneousPointers:4,dragLook:true,ads:true,noDrift:true,pauseReleases:true,resizeReleases:true});console.log('WAR touch layout passed:',viewport.width+'x'+viewport.height);
  }catch(e){await page.screenshot({path:`test-results/war-touch/${viewport.width}x${viewport.height}-failure.png`});console.error(await read());throw e}finally{await context.close()}
 }
 const desktop=await browser.newContext({viewport:{width:885,height:770}});await installConsoleStubs(desktop);
 await desktop.route(/^https?:\/\//,route=>new URL(route.request().url()).origin===origin?route.continue():route.request().resourceType()==='script'?route.fulfill({status:200,contentType:'application/javascript',body:'/* isolated remote service */'}):route.abort('blockedbyclient'));
 const page=await desktop.newPage();await page.goto(origin+'/games/ar/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.Games?.some(g=>g.id==='ar_truck_sim')&&window.System?.canvas);
 await page.waitForFunction(()=>!document.getElementById('phase-screen')?.classList.contains('hidden'),null,{timeout:5000}).catch(async()=>{await page.locator('#channel-grid .channel').first().click()});
 await page.locator('#phase-grid .mission-card:not(.locked)').first().click();await page.locator('[data-mode="controls"]').click();await page.waitForFunction(()=>window.System.activeGame?.logic.state==='PLAYING');
 await page.evaluate(()=>{const g=window.System.activeGame.logic;g.enemies=[];g.waveDelay=999;g.covers=[]});
 await page.keyboard.down('w');await page.keyboard.down('Space');await page.mouse.move(500,340);await page.mouse.down();await page.mouse.move(650,290);await page.mouse.up();
 await page.waitForFunction(()=>{const g=window.System.activeGame.logic;return g.player.yaw>.1&&g.player.pitch>.1&&!g.lookPointerActive&&g.stats.shots>0&&g.player.z>0});await page.keyboard.up('Space');await page.keyboard.up('w');
 await page.screenshot({path:'test-results/war-touch/885x770-mouse.png'});await desktop.close();results.push({desktop:true,mouseDrag:true,keyboardMoveAndFire:true,passed:true});
 writeFileSync('test-results/war-touch/result.json',JSON.stringify(results,null,2));console.log('WAR TOUCH PASS: scene drag, zoom, four simultaneous touches, no drift, independent release, pause and rotation in three mobile layouts; mouse and keyboard on desktop.');
}finally{await browser.close()}

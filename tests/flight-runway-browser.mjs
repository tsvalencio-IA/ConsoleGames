/* Native free-flight update and touch controls. Only the approach position is
 * prepared; landing, braking and the second takeoff use unmodified physics. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
const out='test-results/flight-runway';fs.mkdirSync(out,{recursive:true});
const server=await multiplayerServer(),browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const errors=[],report={limits:['A disposable solo Chromium profile. The approach position is prepared; native frame updates and touch controls are preserved. No physical motion sensor or phone camera is exercised.']};let page;
try{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.request().resourceType()==='script'?r.fulfill({contentType:'application/javascript',body:'/* isolated external services */'}):r.abort());
 page=await context.newPage();page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.stack));await page.goto(server.origin+'/games/voo/');await page.locator('[data-solo-start]').click();
 await page.locator('#phase-grid .mission-card[data-mission="free"]').click();await page.locator('[data-mode="controls"]').click();
 await page.waitForFunction(()=>System.activeGame?.logic.state==='HANGAR');const start=page.locator('.flight-input [data-control="start"]');await start.click();await page.waitForFunction(()=>System.activeGame.logic.state==='CALIBRATION');await start.click();await page.waitForFunction(()=>System.activeGame.logic.state==='PLAYING');
 assert.equal(await page.evaluate(()=>System.activeGame.logic.mode),'FREE');
 await page.evaluate(()=>{const g=System.activeGame.logic;g.entities=[];g.manualThrottle=0;g.pilot.targetPitch=g.pilot.targetRoll=0;g.view=null;Object.assign(g.ship,{x:0,z:-900,y:8.04,yaw:0,pitch:-.025,roll:0,vx:0,vy:-1.5,vz:75,speed:75});});
 await page.waitForFunction(()=>System.activeGame.logic.onGround);report.landed=await page.evaluate(()=>{const g=System.activeGame.logic;return{ship:structuredClone(g.ship),quality:g.landingQuality,guide:g._landingGuidance()};});assert.equal(report.landed.ship.y,8);assert.equal(report.landed.ship.vy,0);assert.equal(report.landed.quality,'smooth');
 await page.waitForFunction(()=>Math.hypot(System.activeGame.logic.ship.vx,System.activeGame.logic.ship.vz)<25);report.braked=await page.evaluate(()=>structuredClone(System.activeGame.logic.ship));assert.equal(report.braked.y,8);await page.screenshot({path:out+'/landed-and-braked.png'});
 for(let i=0;i<7;i++)await page.locator('[data-control="powerUp"]').click();
 const stick=page.locator('[data-control="joystick"]');await stick.evaluate(el=>{const r=el.getBoundingClientRect();el.dispatchEvent(new PointerEvent('pointerdown',{pointerId:71,bubbles:true,clientX:r.x+r.width*.5,clientY:r.y+r.height*.1}));});
 await page.waitForFunction(()=>!System.activeGame.logic.onGround&&System.activeGame.logic.ship.y>10,null,{timeout:15000});await stick.dispatchEvent('pointerup',{pointerId:71});report.secondTakeoff=await page.evaluate(()=>structuredClone(System.activeGame.logic.ship));await page.screenshot({path:out+'/second-takeoff.png'});
 assert.deepEqual(errors,[]);report.passed=true;report.errors=errors;fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));console.log('PASS native free-flight runway landing, braking and a second touch-controlled takeoff');
}catch(error){report.failure=error.stack;report.errors=errors;if(page){report.state=await page.evaluate(()=>{const g=System.activeGame?.logic;return{state:g?.state,mode:g?.mode,ship:g?.ship,onGround:g?.onGround,throttle:g?.pilot.throttle,controls:[...document.querySelectorAll('[data-control]')].map(x=>x.dataset.control)};}).catch(()=>null);await page.screenshot({path:out+'/failure.png'}).catch(()=>{});}fs.writeFileSync(out+'/failure.json',JSON.stringify(report,null,2));throw error;}finally{await browser.close();await server.close();}

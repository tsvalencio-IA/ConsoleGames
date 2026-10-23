/* Native HQ controls, fetch and save/reload. Diagnostic hooks are read-only. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {touchSession} from './helpers/touch-session.mjs';
import {browserNetwork,browserContextNetwork} from './helpers/browser-network.mjs';
const base=process.env.HQ_QA_URL||'http://127.0.0.1:4173/games/familia/3d/';
const browser=await chromium.launch({...browserNetwork(base),headless:true,args:['--enable-features=SyntheticPointerActions','--use-gl=angle','--use-angle=swiftshader','--no-sandbox','--disable-dev-shm-usage']});
mkdirSync('test-results/hq-play',{recursive:true});
try{
 const context=await browser.newContext({...browserContextNetwork(base),viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('#start').click();
 const before=await page.evaluate(()=>({player:{...window.__THIA_TEST.player},yaw:window.__THIA_TEST.camera.yaw}));
 const touch=await touchSession(context,page),move=await touch.start(page.locator('#stick'),.8,.5),run=await touch.start(page.locator('#run')),look=await touch.start(page.locator('#gl'),.68,.5);
 await touch.move(look,page.locator('#gl'),.78,.48);
 await page.waitForFunction(b=>Math.hypot(window.__THIA_TEST.player.x-b.x,window.__THIA_TEST.player.z-b.z)>.5,before.player);
 assert.notEqual(await page.evaluate(()=>window.__THIA_TEST.camera.yaw),before.yaw);
 await touch.end(look);assert(await page.locator('#run').evaluate(el=>el.classList.contains('active')));
 await touch.end(run);assert(await page.locator('#nub').evaluate(el=>el.style.transform!=='translate(-50%,-50%)'));await touch.end(move);
 for(const dog of ['luna','liz']){
  const count=await page.evaluate(d=>window.__THIA_TEST.state.byDog[d]||0,dog);
  await page.locator(dog==='luna'?'#chooseLuna':'#chooseLiz').click();await page.locator('#throw').click();
  await page.waitForFunction(({dog,count})=>window.__THIA_TEST.state.byDog[dog]>count,{dog,count},{timeout:60000});
 }
 const progress=await page.evaluate(()=>({...window.__THIA_TEST.state.byDog}));
 await page.screenshot({path:'test-results/hq-play/native-controls-fetch.png'});
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('#start').click();
 assert.deepEqual(await page.evaluate(()=>({...window.__THIA_TEST.state.byDog})),progress);assert.deepEqual(errors,[]);
 writeFileSync('test-results/hq-play/result.json',JSON.stringify({passed:true,simultaneousTouches:3,fetch:progress,preservedAfterReload:true,errors},null,2));
 console.log('HQ NATIVE PLAY PASS: three touches, movement, camera, Luna/Liz fetch and saved progress.');
 await context.close();
}finally{await browser.close();}

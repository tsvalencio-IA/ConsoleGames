import {chromium} from 'playwright';import assert from 'node:assert/strict';import {mkdirSync,writeFileSync} from 'node:fs';import {touchSession} from './helpers/touch-session.mjs';
const browser=await chromium.launch({headless:true,args:['--enable-features=SyntheticPointerActions','--use-gl=angle','--use-angle=swiftshader','--no-sandbox','--disable-dev-shm-usage']});mkdirSync('test-results/ot-games',{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 await context.addInitScript(()=>localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,profile:{name:'Teste OT Games',nameConfirmed:true,playerId:'ot-games-test'},flags:{accountPromptedV635:true},settings:{quality:'low'},guardian:{sessionLimitMinutes:0},familyAdventure:{party:{controller:'thiago',members:['thiago','luna','liz']},deliveries:{luna:0,liz:0},flags:{}}})));
 await context.route(/^https?:\/\//,route=>new URL(route.request().url()).origin==='http://127.0.0.1:4173'?route.continue():route.abort('blockedbyclient'));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const fingers=await touchSession(context,page);
 try{
 await page.goto('http://127.0.0.1:4173/games/otthi/',{waitUntil:'domcontentloaded'});await page.locator('#playBtn').click();await page.waitForFunction(()=>window.OTTHI_FAMILY?.diagnostics().ready,null,{timeout:120000});
 const before=await page.evaluate(()=>({position:window.OT_GAMES.diagnostics().peacePosition,family:window.OTTHI_FAMILY.diagnostics(),save:window.OTTHOS_TEST_API.getState()}));
 await page.locator('#ot-games-button').click();await page.screenshot({path:'test-results/ot-games/modes.png'});await page.locator('[data-ot-armed]').uncheck();await page.locator('[data-ot-mode="helicopter"]').click();await page.waitForFunction(()=>window.OT_GAMES.diagnostics().mode==='helicopter',null,{timeout:15000});
 assert(await page.evaluate(()=>window.OT_GAMES.diagnostics().sameScene));assert(!await page.evaluate(()=>window.OT_GAMES.diagnostics().armed));assert.equal(await page.evaluate(()=>window.OT_GAMES.diagnostics().enemies.length),0);
 const a=await page.evaluate(()=>window.OT_GAMES.diagnostics());const loc=name=>page.locator('#ot-games-hud [data-ot="'+name+'"]');
 const cyclic=await fingers.start(loc('move'));await fingers.move(cyclic,loc('move'),.67,.22);const collective=await fingers.start(loc('collective'),.5,.22);const pedal=await fingers.start(loc('pedal-right'));await page.waitForFunction(before=>{const b=window.OT_GAMES.diagnostics().body;return b.y>before.y+1&&Math.hypot(b.x-before.x,b.z-before.z)>.7&&b.yaw>before.yaw},a.body,{timeout:15000});
 const moved=await page.evaluate(()=>window.OT_GAMES.diagnostics());assert(moved.body.y>a.body.y+1);assert(Math.hypot(moved.body.x-a.body.x,moved.body.z-a.body.z)>.7);assert(moved.body.yaw>a.body.yaw);
 await fingers.end(cyclic);await fingers.end(collective);await fingers.end(pedal);await page.screenshot({path:'test-results/ot-games/helicopter-original-world.png'});
 assert.deepEqual(moved.peacePosition,before.position,'Flying must not move the saved walking character');
 await page.locator('[data-ot="peace"]').click();assert.equal(await page.evaluate(()=>window.OT_GAMES.diagnostics().active),false);assert.deepEqual(await page.evaluate(()=>window.OT_GAMES.diagnostics().peacePosition),before.position);
 for(const mode of ['plane','ground']){
  await page.locator('#ot-games-button').click();await page.locator('[data-ot-mode="'+mode+'"]').click();await page.waitForFunction(mode=>window.OT_GAMES.diagnostics().mode===mode,mode);
  await page.waitForTimeout(1200);const d=await page.evaluate(()=>window.OT_GAMES.diagnostics());assert(d.sameScene&&d.armed&&d.enemies.length>0);assert(d.body.hp>0);await page.screenshot({path:'test-results/ot-games/'+mode+'-original-world.png'});await page.locator('[data-ot="peace"]').click();
 }
 await page.evaluate(()=>window.OTTHOS_TEST_API.getState());const after=await page.evaluate(()=>({family:window.OTTHI_FAMILY.diagnostics(),save:window.OTTHOS_TEST_API.getState(),position:window.OT_GAMES.diagnostics().peacePosition}));
 assert.deepEqual(after.save.familyAdventure.party,before.save.familyAdventure.party);assert.equal(after.family.actors.length,4);assert.deepEqual(after.position,before.position);assert.equal(errors.length,0,errors.join('\n'));
 writeFileSync('test-results/ot-games/result.json',JSON.stringify({passed:true,sameScene:true,simultaneousTouches:3,before:before.position,after:after.position,familyPreserved:true,errors},null,2));console.log('OT GAMES PASS: original scene, 4 modes, peaceful flight, 3-touch helicopter, preserved walking position/family.');
 }catch(e){await page.screenshot({path:'test-results/ot-games/failure.png'});console.error(await page.evaluate(()=>({diag:window.OT_GAMES?.diagnostics(),modal:document.querySelector('#modal')?.innerText?.slice(0,300)})));throw e;}
 await context.close();
}finally{await browser.close();}

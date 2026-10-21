/* Full world flow with real bundled Three/WebGL, isolated local progress and no remote services. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const base='http://127.0.0.1:4173/';
mkdirSync('test-results/playable',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--no-sandbox','--disable-dev-shm-usage']});
try{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 await context.addInitScript(()=>localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,profile:{name:'Teste Família',nameConfirmed:true,playerId:'family-test-player'},flags:{accountPromptedV635:true},settings:{quality:'low'},guardian:{sessionLimitMinutes:0},familyAdventure:{deliveries:{luna:0,liz:0},flags:{}}})));
 await context.route(/^https?:\/\//,route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort('blockedbyclient'));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.goto(base+'games/otthi/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('#playBtn').click();
 await page.waitForFunction(()=>window.OTTHI_FAMILY?.diagnostics().ready,null,{timeout:120000});
 const info=await page.evaluate(()=>window.OTTHI_FAMILY.diagnostics());assert.equal(info.actors.length,4);assert(info.actors.every(a=>a.bones>12&&a.vertices>1000));
 await page.evaluate(()=>{const p=window.OTTHI_FAMILY.diagnostics().home;window.OTTHOS_TEST_API.teleport(p.x,p.z+6);window.OTTHI_FAMILY.open();});
 await page.locator('[data-family-throw="luna"]').click();
 await page.waitForFunction(()=>window.OTTHI_FAMILY.diagnostics().ball==='seek'||window.OTTHI_FAMILY.diagnostics().ball==='return',null,{timeout:20000});
 await page.waitForFunction(()=>window.OTTHI_FAMILY.diagnostics().progress.deliveries.luna===1,null,{timeout:60000});
 await page.screenshot({path:'test-results/playable/family-integrated-world.png'});
 const progress=await page.evaluate(()=>window.OTTHI_FAMILY.diagnostics().progress.deliveries.luna);assert.equal(progress,1);
 await page.evaluate(()=>window.OTTHI_FAMILY.open());
 assert.equal(await page.locator('[data-family-task]').count(),2);
 await page.locator('[data-family-walk]').click();
 const walking=await page.evaluate(()=>window.OTTHI_FAMILY.snapshot().walkOwner);assert(walking,'Family must actually follow a participant');
 const layout=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,drawCalls:window.OTTHOS_TEST_API.performance().drawCalls}));assert(layout.width<=layout.viewport+2);
 // The original HQ keeps its native buttons and original fetch activity.
 await page.goto(base+'games/familia/3d/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('#start').click();
 await page.locator('#menuBtn').click();
 await page.locator('#menuChoices a[href*="otthi"]').waitFor();
 assert.equal(await page.locator('#controls #throw').count(),1);
 await page.screenshot({path:'test-results/playable/family-original-menu.png'});
 assert.deepEqual(errors,[]);
 writeFileSync('test-results/playable/family-world-report.json',JSON.stringify({actors:info.actors,progress,layout,errors},null,2));
 console.log('Family world: approved rig skinning, real throw/return, walking, original HQ controls and no page errors.');
 }catch(error){await page.screenshot({path:'test-results/playable/family-failure.png'}).catch(()=>{});console.error('Family diagnostics',await page.evaluate(()=>({modal:document.getElementById('modal')?.innerText,ready:window.OTTHI_FAMILY?.diagnostics(),game:window.OTTHOS_TEST_API?.getGame()})).catch(()=>null));throw error;}
 await context.close();
}finally{await browser.close()}

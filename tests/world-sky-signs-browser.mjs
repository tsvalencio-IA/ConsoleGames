import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
const directory='test-results/world-gpu-sky-signs';
fs.mkdirSync(directory,{recursive:true});
const server=await multiplayerServer();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
try{
 for(const quality of ['low','high']){
  const context=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route(/^https?:\/\//,route=>new URL(route.request().url()).origin===server.origin?route.continue():route.abort());
  await context.addInitScript(q=>localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({
   version:705,profile:{name:'Visual QA',nameConfirmed:true,playerId:'gpu-review-'+q,coins:1234},
   flags:{accountPromptedV635:true},settings:{quality:q,sound:false,worldHud:'clean'},
   tools:{equipped:'none',owned:[],harvested:{}},guardian:{sessionLimitMinutes:0}
  })),quality);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(server.origin+'/games/otthi/',{waitUntil:'domcontentloaded',timeout:60000});
   await page.locator('#playBtn').click();
   await page.waitForFunction(()=>window.OTTHOS_TEST_API?.getGame().running&&!window.OTTHOS_TEST_API.getGame().paused&&document.getElementById('modal')?.hidden,null,{timeout:240000});
   const initial=await page.evaluate(()=>window.OTTHOS_TEST_API.getGame());
   assert(initial.objects.npcs>20,'world must retain inhabitants');
   await page.evaluate(()=>window.OTTHOS_TEST_API.teleport(48,10));
   await page.waitForTimeout(1300);
   await page.screenshot({path:directory+'/'+quality+'-pingpong.png',timeout:60000});
   const result=await page.evaluate(()=>({
    running:window.OTTHOS_TEST_API.getGame().running,
    player:window.OTTHOS_TEST_API.getGame().player,
    boot:window.OTTHI_BOOT_METRICS?.snapshot()?.events?.filter(e=>e.event==='camera-precompile'||e.event==='camera-views'),
    revision:document.documentElement.dataset.otthiRevision,
    canvasPresent:!!document.querySelector('#game canvas')
   }));
   assert.equal(result.running,true);
   assert.deepEqual(errors,[]);
   results.push({quality,...result,errors});
   console.log('GPU SKY SIGNS',quality,JSON.stringify({revision:result.revision,boot:result.boot,position:[result.player.x,result.player.z]}));
  }catch(e){await page.screenshot({path:directory+'/'+quality+'-failure.png'}).catch(()=>{});throw e;}
  finally{await context.close();}
 }
 fs.writeFileSync(directory+'/results.json',JSON.stringify(results,null,2));
 console.log('GPU COMPATIBILITY SMOKE PASSED: low and high, sky / ping-pong location');
}finally{await browser.close();await server.close();}

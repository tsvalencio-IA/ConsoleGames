/* Native visual regression for the real World <-> OT Games HUD switch. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';

const server=await multiplayerServer();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']});
const out='test-results/world-hud-modes';fs.mkdirSync(out,{recursive:true});
const ids=['.game-hud','#missionCard','#quickToggleBtn','#quickBar','#miniNav','#cameraControls','#contextPrompt','#joystick','#skillsToggleBtn','.secondary-actions','.primary-actions','#raceBadge','#buildBadge','#vehicleBadge','#safetyPanel'];
try{
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.abort('blockedbyclient'));
  await context.addInitScript(()=>localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,profile:{name:'HUD QA',nameConfirmed:true,playerId:'hud-qa'},flags:{accountPromptedV635:true},settings:{quality:'low',sound:false},guardian:{sessionLimitMinutes:0}})));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(server.origin+'/games/otthi/',{waitUntil:'domcontentloaded'});
   await page.locator('#playBtn').click();
   await page.waitForFunction(()=>window.OTTHI_EXPANSION?.diagnostics().ready&&window.OT_GAMES?.enter,null,{timeout:100000});
   assert(await page.locator('.game-hud').isVisible(),'world HUD must work normally');
   assert(await page.locator('#miniNav').isVisible(),'world minimap must work normally');
   const worldControls=await page.locator('#quickToggleBtn, #worldCampaignBtn, #miniNav').evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return{id:el.id,x:r.x,y:r.y,w:r.width,h:r.height}}));
   for(let i=0;i<worldControls.length;i++)for(let j=i+1;j<worldControls.length;j++){
    const a=worldControls[i],b=worldControls[j];
    assert(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),a.id+' overlaps '+b.id+' at '+viewport.width+'x'+viewport.height);
   }
   await page.locator('#quickToggleBtn').click();
   assert(await page.locator('#quickBar').isVisible(),'world shortcuts must remain available');
   const nav=await page.locator('#quickBar').boundingBox(),map=await page.locator('#miniNav').boundingBox();
   assert(nav&&map&&!(nav.x<map.x+map.width&&nav.x+nav.width>map.x&&nav.y<map.y+map.height&&nav.y+nav.height>map.y),'expanded shortcuts must not obscure the minimap');
   assert(await page.locator('#quickBar #mapBtn').isVisible(),'map shortcut remains accessible');
   const entered=await page.evaluate(()=>OT_GAMES.enter('ground',{armed:false}));
   assert.equal(entered,true,'OT Games must still start normally');
   await page.waitForFunction(()=>document.body.classList.contains('ot-games-active')&&!!document.querySelector('#ot-games-hud'));
   const hidden=await page.evaluate(selectors=>selectors.map(selector=>({selector,display:[...document.querySelectorAll('#game > '+selector)].map(el=>getComputedStyle(el).display)})),ids);
   for(const check of hidden)for(const display of check.display)assert.equal(display,'none',viewport.width+'x'+viewport.height+' duplicate original HUD: '+check.selector);
   assert(await page.locator('#ot-games-hud [data-ot="map"]').isVisible(),'GPS retained in OT Games');
   assert(await page.locator('#ot-games-hud [data-ot="move"]').isVisible(),'game movement retained');
   await page.screenshot({path:out+'/active-'+viewport.width+'x'+viewport.height+'.png'});
   await page.locator('#ot-games-hud [data-ot="peace"]').click();
   await page.waitForFunction(()=>!document.body.classList.contains('ot-games-active'));
   assert(await page.locator('.game-hud').isVisible(),'world HUD must return after leaving OT Games');
   assert(await page.locator('#miniNav').isVisible(),'world minimap must return');
   assert(await page.locator('#quickToggleBtn').isVisible(),'world menu button must return');
   await page.screenshot({path:out+'/returned-'+viewport.width+'x'+viewport.height+'.png'});
   console.log('PASS original HUD isolated and restored:',viewport.width+'x'+viewport.height);
   assert.deepEqual(errors,[]);
  }catch(error){await page.screenshot({path:out+'/failure-'+viewport.width+'x'+viewport.height+'.png'}).catch(()=>{});throw error;}
  finally{await context.close();}
 }
}finally{await browser.close();await server.close();}

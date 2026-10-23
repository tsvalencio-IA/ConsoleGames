/* Real solo entry and installed-shell offline reopening, without fake authentication. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {browserNetwork,browserContextNetwork} from './helpers/browser-network.mjs';
const base=process.env.ARCADE_QA_URL||'http://127.0.0.1:4173/games/';
const browser=await chromium.launch({...browserNetwork(base),headless:true,args:[...(browserNetwork(base).proxy?['--ignore-certificate-errors']:[]),'--use-gl=angle','--use-angle=swiftshader','--no-sandbox','--disable-dev-shm-usage']});
const results=[];mkdirSync('test-results/arcade-entry',{recursive:true});
try{
 for(const [slug,id] of [['kart','drive'],['boxe','box_pro'],['tenis','tennis'],['ar','ar_truck_sim'],['voo','usarmy_flight_sim']]){
  const context=await browser.newContext({...browserContextNetwork(base),viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  // First-party code is real. Local runs isolate unavailable external services;
  // public runs load the deployed SDK normally in a fresh, unsigned-in context.
  if(new URL(base).hostname==='127.0.0.1')await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort('blockedbyclient'));
  async function enter(){
   await page.locator('[data-solo-start]').click();await page.locator('#phase-screen:not(.hidden)').waitFor();
   await page.locator('#phase-grid .mission-card:not(.locked)').first().click();await page.locator('[data-mode="controls"]').click();
   await page.waitForFunction(id=>window.System?.activeGame?.id===id,id);
   assert(await page.locator('#game-canvas').evaluate(c=>c.width>0&&c.height>0));
   assert.equal(await page.evaluate(()=>window.ConsolePractice.active),true);
  }
  await page.goto(new URL(slug+'/',base).href,{waitUntil:'commit'});await enter();
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:45000});
  const state=await page.evaluate(()=>({game:window.System.activeGame.id,state:window.System.activeGame.logic.state}));
  await page.screenshot({path:`test-results/arcade-entry/${slug}-online.png`});
  await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await enter();
  assert.deepEqual(errors,[],slug);await page.screenshot({path:`test-results/arcade-entry/${slug}-offline.png`});
  results.push({slug,...state,online:true,offline:true,realSolo:true,errors});console.log('ARCADE ENTRY/OFFLINE PASS',slug);await context.close();
 }
 writeFileSync('test-results/arcade-entry/result.json',JSON.stringify({passed:true,results},null,2));
}finally{await browser.close();}

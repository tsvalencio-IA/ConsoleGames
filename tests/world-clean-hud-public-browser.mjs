/* Published native world, real UI and WebGL. Disposable local profile only. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {browserNetwork,browserContextNetwork} from './helpers/browser-network.mjs';

const base=process.env.WORLD_PUBLIC_BASE||'https://otthi-world-campanha-teste.vercel.app/games/otthi/';
const origin=new URL(base).origin,out=process.env.WORLD_PUBLIC_OUT||'test-results/world-clean-hud-public';
const expected=JSON.parse(fs.readFileSync('games/otthi/VERSION.json'));
const release=JSON.parse(fs.readFileSync('games/otthi/release-manifest.json'));
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserNetwork(base),headless:true,executablePath:process.env.OT_BROWSER_BINARY||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={base,build:expected.build,revision:release.revision,browser:browser.version(),limits:['Published native app and WebGL, no source interception, renderer cap, simulation clock changes or position changes.','Disposable local profile; external account, analytics and database requests blocked.','Chromium software WebGL and emulated mobile viewport; no physical-phone FPS, heat, battery, camera or installed-cache claim.']};
const errors=[];let page;
try{
 const context=await browser.newContext({...browserContextNetwork(base),viewport:{width:393,height:852},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.route(/^https?:\/\//,route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 await context.addInitScript(()=>{const key='otthos_life_world_roleplay_v700';if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:705,lastSaved:Date.now(),profile:{name:'Publicação mãos livres QA',nameConfirmed:true,playerId:'public-clean-hud-local',coins:1789},avatar:{bodyStyle:'family-thiago'},flags:{accountPromptedV635:true},tools:{owned:['axe','pickaxe','bucket','hoe','shovel'],equipped:'axe',harvested:{wood:7}},settings:{quality:'low',sound:false},guardian:{sessionLimitMinutes:0},familyAdventure:{party:{controller:'thiago',members:['thiago','thamis','luna','liz']}}}));});
 page=await context.newPage();page.setDefaultTimeout(60000);page.on('pageerror',error=>errors.push(error.stack));
 async function boot(reload=false){
  const response=reload?await page.reload({waitUntil:'domcontentloaded'}):await page.goto(base+'?v='+expected.assetVersion,{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200);assert.equal(await page.locator('html').getAttribute('data-otthi-build'),expected.build);assert.equal(await page.locator('html').getAttribute('data-otthi-revision'),release.revision);
  await page.locator('#playBtn').tap();
  await page.waitForFunction(()=>window.OTTHI_FAMILY?.diagnostics().ready&&window.OT_EXPLORATION_HUD&&window.OTTHOS_TEST_API?.getGame().running&&!OTTHOS_TEST_API.getGame().paused&&document.getElementById('modal').hidden,null,{timeout:120000});
 }
 const snapshot=()=>page.evaluate(()=>({tools:OTTHOS_TEST_API.tools(),hud:OT_EXPLORATION_HUD.diagnostics(),avatar:OTTHI_FAMILY.playerAvatar(),coherent:OTTHI_RELEASE_COHERENT}));
 async function emptyHands(){
  await page.locator('#quickToggleBtn').tap();await page.locator('#emptyHandsBtn').tap();
  await page.waitForFunction(()=>OTTHOS_TEST_API.tools().equipped==='none'&&OTTHI_FAMILY.playerAvatar()?.toolInHand===false&&!OT_EXPLORATION_HUD.diagnostics().menuOpen);
 }
 await boot();await page.waitForFunction(()=>OTTHI_FAMILY.playerAvatar()?.toolInHand===true);
 report.initial=await snapshot();assert.equal(report.initial.tools.equipped,'axe');assert(report.initial.coherent);assert.equal(report.initial.hud.mode,'clean');
 await page.screenshot({path:out+'/before-held-axe.png'});console.log('PASS public saved axe preserved in clean HUD');
 await emptyHands();report.empty=await snapshot();assert.deepEqual(report.empty.tools.owned,report.initial.tools.owned);assert.deepEqual(report.empty.tools.harvested,report.initial.tools.harvested);
 await page.screenshot({path:out+'/empty-hands-native.png'});console.log('PASS public menu stows actual held model');
 await boot(true);report.reloaded=await snapshot();assert.equal(report.reloaded.tools.equipped,'none');assert.equal(report.reloaded.avatar.toolInHand,false);assert.deepEqual(report.reloaded.tools.owned,report.initial.tools.owned);
 await page.locator('#quickToggleBtn').tap();await page.locator('#toolsBtn').tap();await page.locator('[data-equip-tool="axe"]').tap();
 await page.waitForFunction(()=>OTTHOS_TEST_API.tools().equipped==='axe'&&OTTHI_FAMILY.playerAvatar()?.toolInHand===true&&document.getElementById('modal').hidden);
 report.reequipped=await snapshot();assert.deepEqual(report.reequipped.tools.owned,report.initial.tools.owned);
 await emptyHands();report.final=await snapshot();assert.deepEqual(report.final.tools.owned,report.initial.tools.owned);assert.deepEqual(report.final.tools.harvested,report.initial.tools.harvested);assert.deepEqual(errors,[]);
 report.passed=true;report.errors=errors;report.checkedAt=new Date().toISOString();fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));console.log('PASS public reload, native toolbelt re-equip and stow without inventory loss');
}catch(error){report.passed=false;report.failure=error.stack;report.errors=errors;report.last=await page?.evaluate(()=>({game:window.OTTHOS_TEST_API?.getGame(),tools:window.OTTHOS_TEST_API?.tools(),hud:window.OT_EXPLORATION_HUD?.diagnostics(),avatar:window.OTTHI_FAMILY?.playerAvatar()})).catch(()=>null);fs.writeFileSync(out+'/failure.json',JSON.stringify(report,null,2));throw error;}finally{await browser.close();}

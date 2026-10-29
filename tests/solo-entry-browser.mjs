/* Actual five game entry screens. The account/database fixture is isolated;
 * no production user, permission or cloud save is changed. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {installConsoleStubs} from './helpers/console-context.mjs';
const server=await multiplayerServer(),browser=await chromium.launch({executablePath:process.env.OT_BROWSER_BINARY||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={cases:[],limits:['Isolated account/database fixture; not a physical Android test.']};
try{
 for(const slug of ['kart','boxe','tenis','ar','voo']){
  const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});await installConsoleStubs(c);
  await c.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.abort());
  await c.addInitScript(()=>{const auth=firebase.auth();auth.currentUser=null;auth.onAuthStateChanged=cb=>{window.__notifyAccount=cb;queueMicrotask(()=>cb(null));return()=>{};};firebase.auth=()=>auth;});
  const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(server.origin+'/games/'+slug+'/',{waitUntil:'domcontentloaded'});
  await p.locator('#auth-screen:not(.hidden)').waitFor();await p.locator('[data-solo-start]').waitFor();
  assert.equal(await p.locator('#solo-entry').evaluate(e=>getComputedStyle(e).position),'relative');
  assert(await p.locator('#auth-screen #solo-entry').count(),'solo choice must be inside the entry screen');
  // Open phases in the same authentication transition, before the old 200ms
  // menu-only poll could see that menu. This reproduces the persistent overlay.
  await p.evaluate(()=>{const menu=document.getElementById('menu-screen'),observer=new MutationObserver(()=>{if(!menu.classList.contains('hidden')){observer.disconnect();System.openPhases(Games.find(g=>g.id===CONSOLE_GAME_ID));}});observer.observe(menu,{attributes:true,attributeFilter:['class']});AuthApp.currentUser={uid:'browser-test-user-123456789012345'};window.__notifyAccount(AuthApp.currentUser);});
  await p.locator('#phase-screen:not(.hidden)').waitFor();assert(!await p.locator('#solo-entry').isVisible(),slug+' phase entry overlay');
  await p.locator('#phase-grid .mission-card:not(.locked)').first().click();await p.locator('[data-mode="controls"]').click();
  await p.waitForFunction(()=>!!System.activeGame);assert(!await p.locator('#solo-entry').isVisible(),slug+' gameplay entry overlay');
  await p.evaluate(()=>{System.menu();AuthApp.currentUser=null;window.__notifyAccount(null);});await p.locator('#auth-screen:not(.hidden)').waitFor();await p.locator('[data-solo-start]').waitFor();
  await p.locator('[data-solo-start]').click();await p.waitForFunction(()=>ConsolePractice.active);assert.equal(await p.locator('#solo-entry').count(),0);
  assert.deepEqual(errors,[]);report.cases.push({slug,inlineEntry:true,directAccountPhases:true,controls:true,signOut:true,solo:true,errors});console.log('PASS solo entry',slug);await c.close();
 }
 report.passed=true;fs.mkdirSync('test-results/solo-entry',{recursive:true});fs.writeFileSync('test-results/solo-entry/result.json',JSON.stringify(report,null,2));
}finally{await browser.close();await server.close();}

/* Public production bytes, native WebGL and touch. Disposable local save;
 * remote account/analytics SDKs blocked. Only travel setup uses the public QA API. */
import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';
import {browserNetwork,browserContextNetwork} from './helpers/browser-network.mjs';
const base='https://otthi-world-campanha-teste.vercel.app/games/otthi/',origin=new URL(base).origin,out='test-results/transport-public-browser';fs.mkdirSync(out,{recursive:true});
const expected=JSON.parse(fs.readFileSync('games/otthi/VERSION.json'));
const browser=await chromium.launch({...browserNetwork(base),executablePath:process.env.OT_BROWSER_BINARY||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
let page;const errors=[],report={browser:browser.version(),base};
try{
 const context=await browser.newContext({...browserContextNetwork(base),viewport:{width:393,height:852},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
 await context.addInitScript(()=>localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,lastSaved:Date.now(),profile:{name:'Thiago Teste',nameConfirmed:true,playerId:'public-transport-local'},avatar:{bodyStyle:'family-thiago'},flags:{accountPromptedV635:true},settings:{quality:'low',sound:true},guardian:{sessionLimitMinutes:0},familyAdventure:{party:{controller:'thiago',members:['thiago','thamis','luna','liz']}}})));
 page=await context.newPage();page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.stack));
 assert.equal((await page.goto(base+'?v='+expected.assetVersion,{waitUntil:'domcontentloaded'})).status(),200);
 assert.equal(await page.locator('html').getAttribute('data-otthi-build'),expected.build);
 await page.locator('#playBtn').click();await page.waitForFunction(()=>window.OTTHI_FAMILY?.diagnostics().ready&&window.OTTHI_CAMPAIGN?.parked().length>1,null,{timeout:120000});console.log('PASS public native world boot');
 const craft=await page.evaluate(()=>OTTHI_CAMPAIGN.parked().find(p=>p.mode==='helicopter'));await page.evaluate(p=>OTTHOS_TEST_API.teleport(p.x+4,p.z),craft);
 await page.waitForFunction(()=>OTTHOS_TEST_API.getContext()?.id==='board-aircraft-helicopter');await page.locator('#actionBtn').tap({force:true});
 await page.waitForFunction(()=>OT_GAMES.diagnostics().mode==='helicopter'&&OTTHI_FAMILY.diagnostics().seated.length===4);console.log('PASS public helicopter boarding');
 await page.locator('[data-ot="collective"]').tap({position:{x:15,y:8}});await page.waitForFunction(()=>!OT_GAMES.diagnostics().onGround&&OT_GAMES.diagnostics().body.y>5);
 report.flight=await page.evaluate(()=>({version:OTTHI_GAME_BUILD,coherent:OTTHI_RELEASE_COHERENT,flight:OT_GAMES.diagnostics(),family:OTTHI_FAMILY.diagnostics(),audio:GameAudio.diagnostics()}));assert(report.flight.coherent);assert.equal(report.flight.audio.engineVersion,'20261028-recorded3');assert(report.flight.family.seated.every(p=>p.visible));
 await page.screenshot({path:out+'/public-helicopter.png'});console.log('PASS public native collective takeoff');
 await page.locator('[data-ot="map"]').tap();await page.waitForFunction(()=>!document.getElementById('modal').hidden&&document.getElementById('modalTitle').textContent==='Mapa e GPS');await page.locator('#modalClose').tap();
 await page.locator('[data-ot="peace"]').tap();await page.waitForFunction(()=>!OT_GAMES.diagnostics().active);assert.deepEqual(errors,[]);report.passed=true;report.errors=errors;report.checkedAt=new Date().toISOString();report.limits=['Software WebGL; no physical Android, real accounts or live multiplayer. Public QA teleport only positions the character beside the aircraft; no source interception or renderer cap.'];fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));console.log('PASS public map and return to world');
}catch(error){report.failure=error.stack;report.errors=errors;if(page)report.last=await page.evaluate(()=>({game:window.OTTHOS_TEST_API?.getGame(),flight:window.OT_GAMES?.diagnostics(),family:window.OTTHI_FAMILY?.diagnostics()})).catch(()=>null);fs.writeFileSync(out+'/failure.json',JSON.stringify(report,null,2));throw error;}finally{await browser.close();}

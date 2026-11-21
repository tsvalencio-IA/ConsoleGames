/* Real mission UI and flight controls. Travel setup and finite action stepping
 * are explicit diagnostics, not a native performance or full-route benchmark. */
import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {installCityInspection} from './helpers/world-city-inspection.mjs';
const out=process.env.OT_BALLOON_OUT||'test-results/balloon-photo';
fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync('games/otthi/app.js','utf8');
assert(source.includes('function civilSyncTaskButton'),'Build current modules before running the integrated balloon test');
const end=source.lastIndexOf('})();');
const hook=`
 window.__BALLOON_QA={
  target:()=>civilAvailableTarget(),forceSave:()=>saveState(true),
  finishWork:()=>{for(let i=0;i<900&&characterActivities.session;i++){cityQaMs+=1000/60;stepWorldSimulation(1/60);}},
  advance:frames=>{for(let i=0;i<frames;i++){cityQaMs+=1000/60;stepWorldSimulation(1/60);}},
  panorama:id=>{const t=civilSubject(id);Object.assign(otGames.body,{x:t.x,z:t.z,y:groundHeightAt(t.x,t.z)+20,vx:0,vy:0,vz:0});otGames.onGround=false;otGames.collective=.5;updateCivilMissions();otGamesCamera(1);otGamesUpdateHUD();return t;},
  landingSetup:()=>{const b=airOperations.bases['balloon-serra'];Object.assign(otGames.body,{x:b.x,z:b.z,y:groundHeightAt(b.x,b.z)+campaignAircraftHeight(otGames.aircraftId)+2,vx:0,vy:0,vz:0});otGames.onGround=false;otGames.collective=.5;},
  taskButton:()=>{civilSyncTaskButton();return document.getElementById('civil-mission-task')?.outerHTML;}
 };
`;
const server=await multiplayerServer();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={viewports:[],errors:[],limits:['Disposable local profile. External accounts/database requests blocked.','Actual compiled mission code, DOM/CSS, touch/keyboard events and flight controls. Renderer capped during functional setup; single native frames captured.','Travel setup moves the test player/aircraft to objectives and finite simulation steps complete timed actions. This does not prove physical travel, sustained FPS or a mobile-device performance improvement.']};
let page;
try{
 const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.abort());
 await context.addInitScript(()=>{const key='otthos_life_world_roleplay_v700';if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:705,profile:{name:'Balão QA',nameConfirmed:true,playerId:'balloon-photo-local',coins:5000},flags:{accountPromptedV635:true},settings:{quality:'low',sound:false,worldHud:'clean'},tools:{equipped:'none',owned:['axe','pickaxe','bucket','hoe','shovel'],harvested:{}},guardian:{sessionLimitMinutes:0},familyAdventure:{party:{controller:'thiago',members:['thiago','thamis','luna','liz']}}}));});
 page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>report.errors.push(e.stack));
 await installCityInspection(page,{appSource:source.slice(0,end)+hook+source.slice(end),capDuringBoot:true});
 const boot=async()=>{await page.goto(server.origin+'/games/otthi/');await page.locator('#playBtn').click();await page.waitForFunction(()=>window.__CITY_QA?.cap()&&window.OT_CIVIL_MISSIONS?.diagnostics().ready&&OT_WORLD_AIRPORT?.diagnostics().ready&&!OTTHOS_TEST_API.getGame().paused&&document.getElementById('modal').hidden,null,{timeout:180000});};
 await boot();console.log('BOOT ready');report.build=await page.evaluate(()=>OTTHI_GAME_BUILD);report.revision=await page.evaluate(()=>OTTHI_RELEASE_REVISION);
 await page.locator('#quickToggleBtn').tap();await page.locator('#worldCampaignBtn').tap();await page.locator('[data-civil-missions]').tap();await page.locator('[data-civil-difficulty]').selectOption('normal');await page.locator('[data-civil-create="balloon"]').tap();
 const foot=async()=>{const t=await page.evaluate(()=>__BALLOON_QA.target());await page.evaluate(t=>OTTHOS_TEST_API.teleport(t.x,t.z),t);await page.waitForFunction(()=>!document.getElementById('civil-mission-task').hidden);await page.locator('#civil-mission-task').tap();await page.waitForFunction(()=>!!OT_CHARACTER_ACTIVITIES.diagnostics().session);await page.evaluate(()=>__BALLOON_QA.finishWork());};
 await foot();await page.waitForFunction(()=>OT_CIVIL_MISSIONS.diagnostics().current.phase===1);console.log('BRIEF completed');
 const craft=await page.evaluate(()=>OT_WORLD_AIRPORT.diagnostics().fleet.find(c=>c.id==='balloon-serra'));
 assert(craft,'festival balloon exists');await page.evaluate(c=>OTTHOS_TEST_API.teleport(c.x,c.z-2),craft);await page.waitForFunction(()=>OTTHOS_TEST_API.getContext()?.id==='board-aircraft-balloon-serra');const boarding=await page.locator('#actionBtn').boundingBox();assert(boarding);await page.touchscreen.tap(boarding.x+boarding.width/2,boarding.y+boarding.height/2);await page.waitForFunction(()=>OT_GAMES.diagnostics().active&&OT_GAMES.diagnostics().mode==='balloon');console.log('BOARDED festival balloon');
 await page.evaluate(()=>__BALLOON_QA.panorama('balloon-view-2'));
 for(const [width,height]of[[393,852],[852,393],[568,320],[1280,720]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(100);await page.evaluate(()=>__BALLOON_QA.taskButton());
  const layout=await page.evaluate(()=>{const b=document.getElementById('civil-mission-task'),r=b.getBoundingClientRect(),s=getComputedStyle(b),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2),overlaps=[];for(const other of document.querySelectorAll('#ot-games-hud [data-ot]')){const o=other.getBoundingClientRect(),style=getComputedStyle(other);if(other.hidden||style.display==='none'||style.visibility!=='visible')continue;if(Math.min(r.right,o.right)-Math.max(r.left,o.left)>1&&Math.min(r.bottom,o.bottom)-Math.max(r.top,o.top)>1)overlaps.push(other.dataset.ot);}return {viewport:{width:innerWidth,height:innerHeight},parent:b.parentElement.id,hidden:b.hidden,disabled:b.disabled,visibility:s.visibility,pointerEvents:s.pointerEvents,rect:{x:r.x,y:r.y,w:r.width,h:r.height},centerHit:hit===b||b.contains(hit),overlaps};});
  assert.equal(layout.parent,'ot-games-hud');assert.equal(layout.hidden,false);assert.equal(layout.disabled,false);assert.equal(layout.visibility,'visible');assert.equal(layout.centerHit,true,JSON.stringify(layout));assert.deepEqual(layout.overlaps,[],JSON.stringify(layout));assert(layout.rect.w>=44&&layout.rect.h>=44);assert(layout.rect.x>=0&&layout.rect.y>=0&&layout.rect.x+layout.rect.w<=width&&layout.rect.y+layout.rect.h<=height);report.viewports.push(layout);console.log('LAYOUT',width,height);
 }
 await page.setViewportSize({width:393,height:852});await page.locator('#civil-mission-task').tap();await page.waitForFunction(()=>!!OT_CIVIL_MISSIONS.diagnostics().task?.air);report.captureInFlight=await page.evaluate(()=>({flight:OT_GAMES.diagnostics(),mission:OT_CIVIL_MISSIONS.diagnostics()}));
 await page.evaluate(()=>__CITY_QA.renderNative());await page.screenshot({path:out+'/photo-in-flight.png',timeout:60000});
 await page.evaluate(()=>__BALLOON_QA.advance(160));await page.waitForFunction(()=>!OT_CIVIL_MISSIONS.diagnostics().task);console.log('PHOTO touch captured');assert.equal(Object.values((await page.evaluate(()=>OT_CIVIL_MISSIONS.diagnostics().current)).counts).reduce((a,b)=>a+b,0),2,'briefing plus exactly one photo');
 await page.evaluate(()=>__BALLOON_QA.panorama('balloon-view-0'));await page.setViewportSize({width:1280,height:720});await page.keyboard.down('f');await page.keyboard.down('f');await page.keyboard.up('f');await page.waitForFunction(()=>!!OT_CIVIL_MISSIONS.diagnostics().task?.air);await page.evaluate(()=>__BALLOON_QA.advance(160));await page.waitForFunction(()=>OT_CIVIL_MISSIONS.diagnostics().current.phase===2&&!OT_CIVIL_MISSIONS.diagnostics().task);assert.equal(await page.locator('#civil-mission-task').isVisible(),false);console.log('PHOTO F captured');
 await page.evaluate(()=>__BALLOON_QA.landingSetup());await page.locator('[data-ot="land"]').click();await page.evaluate(()=>__BALLOON_QA.advance(360));await page.waitForFunction(()=>OT_GAMES.diagnostics().canDisembark);await page.locator('[data-ot="disembark"]').click();await page.waitForFunction(()=>!OT_GAMES.diagnostics().active);console.log('LANDED and disembarked');
 await foot();await page.waitForFunction(()=>OT_CIVIL_MISSIONS.diagnostics().current.status==='completed');await page.evaluate(()=>__BALLOON_QA.advance(5));
 report.completed=await page.evaluate(()=>({mission:OT_CIVIL_MISSIONS.diagnostics().current,coins:OTTHOS_TEST_API.getState().profile.coins,receipts:OTTHOS_TEST_API.getState().civilWorld.rewardReceipts,tools:OTTHOS_TEST_API.tools()}));assert.equal(report.completed.coins,5200);assert.equal(Object.keys(report.completed.receipts).length,1);assert.equal(report.completed.tools.equipped,'none');await page.evaluate(()=>__BALLOON_QA.forceSave());await boot();report.reloaded=await page.evaluate(()=>({mission:OT_CIVIL_MISSIONS.diagnostics().current,coins:OTTHOS_TEST_API.getState().profile.coins,receipts:OTTHOS_TEST_API.getState().civilWorld.rewardReceipts}));assert.equal(report.reloaded.mission.status,'completed');assert.equal(report.reloaded.coins,5200);assert.deepEqual(report.reloaded.receipts,report.completed.receipts);assert.deepEqual(report.errors,[]);report.passed=true;fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));console.log('PASS flight photo button/touch/F, four unobstructed viewports, landing, complete mission and single reward after reload');
}catch(error){report.passed=false;report.failure=error.stack;report.last=await page?.evaluate(()=>({flight:window.OT_GAMES?.diagnostics(),mission:window.OT_CIVIL_MISSIONS?.diagnostics(),modal:document.getElementById('modalTitle')?.textContent,button:document.getElementById('civil-mission-task')?.outerHTML})).catch(()=>null);await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));throw error;}finally{await browser.close();await server.close();}

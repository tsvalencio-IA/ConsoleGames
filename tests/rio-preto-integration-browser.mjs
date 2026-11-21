/* Runs the actual local world, missions and wardrobe UI. Test placement/clock
 * only shorten travel. This does not measure FPS, temperatures or hardware. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {installCityInspection} from './helpers/world-city-inspection.mjs';

const out=process.env.OT_RIO_OUT||'test-results/rio-preto-integration';
fs.mkdirSync(out,{recursive:true});
const release=JSON.parse(fs.readFileSync('games/otthi/release-manifest.json'));
const code=fs.readFileSync('games/otthi/app.js','utf8'),end=code.lastIndexOf('})();');
const hook=`
 const rioQaGifts={coins:0,food:0},rioQaSociety=updateNpcSociety;
 updateNpcSociety=function(...args){
  const {coins}=state.profile,food=Number(state.inventory.food||0);
  rioQaSociety(...args);
  rioQaGifts.coins+=state.profile.coins-coins;
  rioQaGifts.food+=Number(state.inventory.food||0)-food;
 };
 window.__RIO_QA={
  points:()=>Object.values(RIO_PRETO_LAYOUT.landmarks),
  shop:()=>cityCoast.shops.get('rio-shop-bady-mercado'),
  survey:()=>({objects:scene.children.length,placed:world.interactables.length,
   layouts:worldGroup.children.filter(o=>o.name.startsWith('RIO_')).map(o=>o.name),
   city:OTTHI_RIO_PRETO.diagnostics(),ground:groundHeightAt(player.x,player.z),position:{x:player.x,z:player.z}}),
  view:yaw=>{cameraYaw=yaw;cameraPitch=.48;cameraZoom=2.2;updateCamera(2);updateVisualLOD();},
  preview:()=>({id:rioWardrobePreview?.visual?.id,calls:rioWardrobePreview?.renderer?.info.render.calls||0}),
  installAt:(x,z)=>{OTTHOS_TEST_API.teleport(x,z);for(let n=0;n<32;n++){cityQaMs+=35;updateWorldExpansion();}},
  advanceTask:()=>{for(let i=0;i<700&&characterActivities.session;i++){cityQaMs+=1000/60;stepWorldSimulation(1/60);}},
  gifts:()=>({...rioQaGifts}),save:()=>{saveState(true);return {...rioQaGifts};}
 };
`;
const server=await multiplayerServer(),browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={build:release.build,revision:release.revision,browser:browser.version(),places:[],wardrobes:[],viewports:[],errors:[],
 limits:['Chromium/SwiftShader, local disposable profile. External authentication and database calls blocked.','Activity durations use the real simulation and controlled test time. Travel positions are arranged by the fixture. Rendering is limited to individual native captures; no measured device FPS or thermal claim.']};
let page;
try{
 const c=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await c.route(/^https?:\/\//,route=>new URL(route.request().url()).origin===server.origin?route.continue():route.abort());
 await c.addInitScript(()=>{
  const key='otthos_life_world_roleplay_v700';if(localStorage.getItem(key))return;
  let random=9871;Math.random=()=>{random=random*16807%2147483647;return (random-1)/2147483646;};
  localStorage.setItem(key,JSON.stringify({version:705,
    profile:{name:'Passeio de teste',nameConfirmed:true,playerId:'rio-qa-disposable',coins:4300,xp:240},
    flags:{accountPromptedV635:true},settings:{quality:'low',sound:false,worldHud:'clean'},
    guardian:{sessionLimitMinutes:0},tools:{equipped:'none',owned:['axe','pickaxe','hoe','shovel','bucket'],harvested:{wood:7}},
    familyAdventure:{party:{controller:'thiago',members:['thiago','luna','liz']}}
  }));
 });
 page=await c.newPage();page.setDefaultTimeout(45000);page.on('pageerror',err=>report.errors.push(err.stack));
 await installCityInspection(page,{appSource:code.slice(0,end)+hook+code.slice(end),capDuringBoot:true});
 const boot=async()=>{
  await page.goto(server.origin+'/games/otthi/');
  await page.locator('#playBtn').tap();
  await page.waitForFunction(()=>window.__RIO_QA&&window.OT_CIVIL_MISSIONS?.diagnostics().ready&&window.__CITY_QA?.cap()&&!OTTHOS_TEST_API.getGame().paused&&document.getElementById('modal').hidden,null,{timeout:150000});
  assert.equal(await page.locator('html').getAttribute('data-otthi-revision'),release.revision);
 };
 await boot();
 const profile=()=>page.evaluate(()=>{const s=OTTHOS_TEST_API.getState();return{profile:s.profile,party:s.familyAdventure.party,tools:s.tools,vehicles:s.vehicles.owned,food:Number(s.inventory.food||0),gifts:__RIO_QA.gifts(),journey:window.OT_PLAYER_JOURNEY.diagnostics()};});
 report.before=await profile();
 assert.equal(report.before.profile.coins,4300);
 assert.equal(report.before.tools.equipped,'none');
 const directory=async()=>{await page.locator('#quickToggleBtn').tap();await page.locator('#worldCampaignBtn').tap();};
 await directory();
 assert.equal(await page.locator('[data-rio-route]').count(),5);
 await page.locator('[data-rio-route="rio-bady-praca"]').tap();
 await page.waitForFunction(()=>OTTHOS_TEST_API.getState().waypoint?.id==='rio-bady-praca');
 report.gps=await page.evaluate(()=>OTTHOS_TEST_API.navigation());
 assert(report.gps.route.length>2);
 await directory();await page.locator('[data-rio-tour]').tap();
 await page.waitForFunction(()=>OT_CIVIL_MISSIONS.diagnostics().current?.type==='rio-avenidas'&&document.getElementById('modal').hidden);
 const targets=await page.evaluate(()=>__RIO_QA.points());
 assert.equal(targets.length,3);
 for(const [i,point] of targets.entries()){
  await page.evaluate(p=>__RIO_QA.installAt(p.x,p.z),point);
  await page.waitForFunction(id=>OTTHOS_TEST_API.getContext()?.id==='civil-target-'+id,point.id);
  await page.locator('#civil-mission-task').tap();
  await page.waitForFunction(()=>!!OT_CHARACTER_ACTIVITIES.diagnostics().session);
  await page.evaluate(()=>__RIO_QA.advanceTask());
  await page.waitForFunction(n=>OT_CIVIL_MISSIONS.diagnostics().current?.phase===n,i+1);
  await page.evaluate(yaw=>{__RIO_QA.view(yaw);__CITY_QA.renderNative();},i===1?-Math.PI/2:0);
  await page.screenshot({path:out+'/'+point.id+'.png',timeout:60000});
  report.places.push({point,survey:await page.evaluate(()=>__RIO_QA.survey()),mission:await page.evaluate(()=>OT_CIVIL_MISSIONS.diagnostics().current)});
  assert(report.places.at(-1).survey.city.visible>0,'The district must render near its landmark');
 }
 report.afterTour=await profile();
 assert.equal(report.afterTour.profile.coins,4460+report.afterTour.gifts.coins);
 assert.equal(report.places.at(-1).mission.status,'completed');
 assert.deepEqual(report.afterTour.party,report.before.party);
 assert.deepEqual(report.afterTour.tools,report.before.tools);
 assert.deepEqual(report.afterTour.vehicles,report.before.vehicles);
 const shop=await page.evaluate(()=>__RIO_QA.shop());
 await page.evaluate(p=>__RIO_QA.installAt(p.navX,p.navZ),shop);
 await page.waitForFunction(id=>OTTHOS_TEST_API.getContext()?.id===id,shop.id);
 await page.locator('#actionBtn').tap({force:true});
 await page.locator('[data-city-order="groceries"]').tap();
 await page.evaluate(()=>__RIO_QA.advanceTask());
 report.shop=await page.evaluate(()=>__CITY_QA.transactions());
 assert.equal(report.shop.length,1);
 const [receipt]=report.shop;
 assert.deepEqual(receipt,{id:shop.id,item:'groceries',ok:true,before:receipt.before,
  after:{coins:receipt.before.coins-20,food:receipt.before.food+5}});

 // Open the original avatar studio, then the new visual wardrobe.
 const openWardrobe=async()=>{
  await page.locator('#quickToggleBtn').tap();
  await page.locator('#avatarGameBtn').tap();
  await page.locator('[data-life-avatar]').tap();
  await page.locator('[data-rio-wardrobe-open]').tap();
 };
 for(const [name,slot] of [['thiago','top'],['thamis','bag']]){
  await openWardrobe();
  await page.locator('[data-rio-wardrobe-character="'+name+'"]').tap();
  const select=page.locator('[data-rio-wardrobe-slot="'+slot+'"]');
  const value=await select.locator('option').evaluateAll(options=>options.find(o=>o.value&&!o.selected)?.value);
  assert(value,'A opção do guarda-roupa precisa existir');
  await select.selectOption(value);
  await page.locator('[data-rio-wardrobe-preview][data-preview-ready="true"]').waitFor();
  const preview=await page.evaluate(()=>__RIO_QA.preview());
  assert(preview.calls>0&&preview.id===name,JSON.stringify(preview));
  await page.locator('[data-rio-wardrobe-save]').tap();
  const selected=await page.evaluate(()=>OTTHOS_TEST_API.getState().avatar.rioWardrobe);
  assert.equal(selected[name][slot],value);
  report.wardrobes.push({name,slot,value,preview});
  if(await page.locator('#modalClose').isVisible())await page.locator('#modalClose').tap();
 }
 await openWardrobe();
 for(const [width,height] of [[320,568],[393,852],[667,375],[1280,800]]){
  await page.setViewportSize({width,height});
  const layout=await page.evaluate(()=>{
   const body=document.getElementById('modalBody'),canvas=document.querySelector('[data-rio-wardrobe-preview]'),save=document.querySelector('[data-rio-wardrobe-save]');
   return{overflow:body.scrollWidth-body.clientWidth,canvasWidth:canvas.getBoundingClientRect().width,saveHeight:save.getBoundingClientRect().height,screen:innerWidth};
  });
  assert(layout.overflow<=2&&layout.canvasWidth<=layout.screen+1&&layout.saveHeight>=36,JSON.stringify(layout));
  report.viewports.push({width,height,...layout});
 }
 await page.screenshot({path:out+'/guarda-roupa.png'});
 await page.locator('#modalClose').tap();
 report.beforeReloadGifts=await page.evaluate(()=>__RIO_QA.save());await boot();
 for(const setting of report.wardrobes){
  const actual=await page.evaluate(({name,slot})=>OTTHOS_TEST_API.getState().avatar.rioWardrobe[name]?.[slot],setting);
  assert.equal(actual,setting.value);
 }
 report.reloaded=await profile();
 assert.equal(report.reloaded.profile.coins,4440+report.beforeReloadGifts.coins+report.reloaded.gifts.coins,'One mission credit and one purchase debit must persist, in addition to NPC gifts');
 assert.equal(report.reloaded.food,7+report.beforeReloadGifts.food+report.reloaded.gifts.food);
 assert.equal(await page.evaluate(()=>OT_CIVIL_MISSIONS.diagnostics().current.status),'completed');
 assert.deepEqual(report.reloaded.party,report.before.party);
 assert.deepEqual(report.reloaded.tools,report.before.tools);
 assert.deepEqual(report.reloaded.vehicles,report.before.vehicles);
 assert.deepEqual(report.errors,[]);
 report.passed=true;
 console.log('PASS passeio em três avenidas e guarda-roupa de Thiago/Thamis após recarga');
}catch(err){
 report.passed=false;report.failure=err.stack;
 report.last=await page?.evaluate(()=>({context:window.OTTHOS_TEST_API?.getContext(),mission:window.OT_CIVIL_MISSIONS?.diagnostics(),title:document.getElementById('modalTitle')?.textContent})).catch(()=>null);
 await page?.screenshot({path:out+'/failure.png',timeout:12000}).catch(()=>{});
 throw err;
}finally{
 fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2)+'\n');
 await browser.close();await server.close();
}

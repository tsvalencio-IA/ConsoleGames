/* Two native purchases, a physical obstruction at the return curb, caller
 * movement, reload and exactly-once receipts in a disposable local profile. */
import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {installWorldRtdbFixture} from './helpers/world-rtdb-browser-fixture.mjs';
import {installCityInspection} from './helpers/world-city-inspection.mjs';

const mode = process.env.OT_PHONE_RETURN_MODE || 'after';
const out = 'test-results/phone-return-' + mode;
fs.mkdirSync(out, {recursive: true});
const baseline = 'fed801c';
let source = execFileSync('git', ['show', baseline + ':games/otthi/app.js'], {encoding: 'utf8', maxBuffer: 8e6});
if (mode !== 'before') {
  for (const name of ['73-world-phone-dispatch.js', '75-phone-orders.js']) {
    const marker = '  // ===== MODULE: ' + name + ' =====\n';
    const start = source.indexOf(marker) + marker.length;
    assert(start >= marker.length, 'module in compiled baseline: ' + name);
    let end = source.indexOf('\n  // ===== MODULE:', start);
    if (end < 0) end = source.lastIndexOf('\n})();');
    const body = fs.readFileSync('games/otthi/src/modules/' + name, 'utf8').split('// @otthi-module-body')[1].replace(/^[\r\n]+/, '');
    source = source.slice(0, start) + body + source.slice(end);
  }
}
const report = {mode, baseline, appSha256: createHash('sha256').update(source).digest('hex'), limits: [
  'Native engine, geometry, buying, payments, receiving, driver movement and save/reload; disposable local realtime fixture. No production account.',
  'Clock is advanced at 60 simulation steps per second. Rendering is capped during the inspection; this is not a frame-rate or physical-device measurement.',
  'Before uses the compiled version26. After substitutes only modules73 and75 from the working tree in that same compiled baseline.'
]};
const hook = `
 const returnQaGifts=JSON.parse(sessionStorage.getItem('return-qa-gifts')||'[]'),returnQaSociety=updateNpcSociety;
 updateNpcSociety=function(...args){const c=state.profile.coins,f=state.inventory.food,result=returnQaSociety(...args),coins=state.profile.coins-c,food=state.inventory.food-f;if(coins||food){if(coins&&coins!==8||food&&food!==1)throw Error('Unexpected native society grant');returnQaGifts.push({coins,food});sessionStorage.setItem('return-qa-gifts',JSON.stringify(returnQaGifts));}return result;};
 let returnQaJump=0;
 const returnQaAdvance=phoneAdvanceJob;phoneAdvanceJob=function(job,dt){const x=job.route.x,z=job.route.z;returnQaAdvance(job,dt);returnQaJump=Math.max(returnQaJump,Math.hypot(job.route.x-x,job.route.z-z));};
 window.__RETURN_QA={
  prepare:()=>{
   const v=phoneCourierVehicle();v.garageStored=true;v.group.visible=false;
   const shop=MAP_LOCATIONS.find(l=>l.id==='shop'),origin={x:Number(shop.navX??shop.x),z:Number(shop.navZ??shop.z)},r=nearestRoadProjection(origin),a=NAV_BASE_NODES[r.aId],b=NAV_BASE_NODES[r.bId],len=Math.hypot(b.x-a.x,b.z-a.z),fx=(b.x-a.x)/len,fz=(b.z-a.z)/len;
   for(const along of[25,-25,40,-40])for(const side of[7,-7,10,-10]){const p={x:r.point.x+fx*along+fz*side,z:r.point.z+fz*along-fx*side};if(positionBlockedForPlayer(p.x,p.z,.45,{ignoreTraffic:true,ignoreActor:v}))continue;OTTHOS_TEST_API.teleport(p.x,p.z);if(phoneGroundDestination(v))return{origin,caller:p};}
   throw Error('No native caller position near the shop');
  },
  advance:n=>__CITY_QA.simulate(n),
  snapshot:()=>({phone:OT_WORLD_PHONE.diagnostics(),returning:worldPhone.returning.map(j=>({kind:j.kind,target:{...j.target},origin:{...j.origin},x:j.route.x,z:j.route.z,arrived:j.route.arrived,blocked:j.route.blocked,blockedFor:j.blockedFor||0,reroutes:j.reroutes||0,searchSlices:j.searchSlices||0})),coins:state.profile.coins,food:state.inventory.food,gifts:returnQaGifts.slice(),maxStep:returnQaJump,foodItem:{price:worldShopItems().find(i=>i.key==='food').price,amount:worldShopItems().find(i=>i.key==='food').amount},owner:sharedWorldOwnId(),job:worldPhone.job?{kind:worldPhone.job.kind,caller:worldPhone.job.caller,target:{...worldPhone.job.target},ready:!!worldPhone.job.ready}:null}),
  blockOrigin:()=>{const j=worldPhone.job;if(!j?.ready)throw Error('First parcel is not ready');const p={...j.origin},v=createToyCar(p.x,p.z,{id:'return-curb-blocker',label:'Vaga ocupada',brazilModel:'gol',heading:p.yaw});v.group.position.set(p.x,groundHeightAt(p.x,p.z),p.z);v.group.rotation.y=p.yaw;v.garageStored=false;v.group.visible=true;return{position:p,occupied:!phoneVehiclePoseClear(j.vehicle,p.x,p.z,p.yaw,true),alternative:phonePickupPoint(j.vehicle,p)};},
  approach:()=>{const v=worldPhone.job?.vehicle;if(!v)throw Error('Missing courier');for(let n=0;n<16;n++){const a=n*Math.PI/8,x=v.group.position.x+Math.sin(a)*4.5,z=v.group.position.z+Math.cos(a)*4.5;if(!positionBlockedForPlayer(x,z,.45,{ignoreTraffic:false})){OTTHOS_TEST_API.teleport(x,z);return;}}throw Error('No safe parcel access');},
  moveCaller:()=>{const j=worldPhone.job,p={x:player.x,z:player.z};if(!j||j.ready)throw Error('No moving second delivery');for(const node of Object.values(NAV_BASE_NODES)){const d=Math.hypot(node.x-p.x,node.z-p.z);if(d<65||d>100)continue;for(const dx of[8,-8,12,-12])for(const dz of[8,-8]){const x=node.x+dx,z=node.z+dz;if(positionBlockedForPlayer(x,z,.45,{ignoreTraffic:true}))continue;OTTHOS_TEST_API.teleport(x,z);if(phoneGroundDestination(j.vehicle))return{x,z,distance:Math.hypot(x-p.x,z-p.z)};}}throw Error('No safe new caller position');},
  receiveAgain:()=>phoneReceiveParcel(),
  save:()=>saveState(true)
 };`;

const server = await multiplayerServer();
const browser = await chromium.launch({headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
let page;
const errors = [];
try {
  const context = await browser.newContext({viewport: {width: 844, height: 390}, isMobile: true, hasTouch: true, serviceWorkers: 'block'});
  await context.route(/^https?:\/\//, r => new URL(r.request().url()).origin === server.origin ? r.continue() : r.abort());
  await installWorldRtdbFixture(context);
  await context.addInitScript(() => {
    const key='otthos_life_world_roleplay_v700',real=Date.now.bind(Date),saved=JSON.parse(localStorage.getItem(key)||'null'),lead=Math.max(0,Number(saved?.lastSaved||0)-real()+100);
    Date.now=()=>real()+lead;
    if(!saved)localStorage.setItem(key,JSON.stringify({version:705,lastSaved:Date.now(),profile:{name:'Fila de encomendas QA',nameConfirmed:true,playerId:'return-qa',coins:8000},flags:{accountPromptedV635:true},settings:{quality:'low',sound:false},guardian:{sessionLimitMinutes:0}}));
  });
  page = await context.newPage();
  page.setDefaultTimeout(60000);
  page.on('pageerror', e => errors.push(e.stack));
  const end = source.lastIndexOf('})();');
  await installCityInspection(page, {appSource: source.slice(0, end) + hook + source.slice(end), capDuringBoot: true, revision: baseline});
  const boot=async()=>{await page.goto(server.origin+'/games/otthi/');await page.locator('#playBtn').click();await page.waitForFunction(()=>window.__CITY_QA?.cap()&&OTTHOS_TEST_API.getGame().running&&document.getElementById('modal').hidden,null,{timeout:120000});await page.evaluate(()=>__RETURN_QA.advance(4));};
  const buy=async()=>{await page.locator('#quickToggleBtn').click();await page.locator('#worldPhoneBtn').click();await page.locator('[data-phone-shop]').click();await page.locator('[data-phone-buy-item="food"]').click();await page.locator('[data-yes]').click();await page.waitForFunction(()=>OT_WORLD_PHONE.diagnostics().orders.length>0);};
  const receive=async()=>{await page.evaluate(()=>__RETURN_QA.approach());await page.locator('#quickToggleBtn').click();await page.locator('#worldPhoneBtn').click();await page.locator('[data-phone-parcel-receive]').click();await page.locator('#modalClose').click();};
  await boot();report.fixture=await page.evaluate(()=>__RETURN_QA.prepare());report.initial=await page.evaluate(()=>__RETURN_QA.snapshot());
  await buy();
  for(let i=0;i<120;i++){if(await page.evaluate(()=>OT_WORLD_PHONE.diagnostics().tracking?.ready))break;await page.evaluate(()=>__RETURN_QA.advance(120));}
  report.firstReady=await page.evaluate(()=>__RETURN_QA.snapshot());assert(report.firstReady.phone.tracking?.ready,'first native purchase must arrive');
  report.blocker=await page.evaluate(()=>__RETURN_QA.blockOrigin());assert(report.blocker.occupied);assert(report.blocker.alternative,'there is an available safe curb beside the blocked original stop');
  await receive();assert.equal(await page.evaluate(()=>__RETURN_QA.receiveAgain()),false);
  report.firstReceived=await page.evaluate(()=>__RETURN_QA.snapshot());assert.equal(report.firstReceived.phone.orders[0].status,'delivered');
  await buy();await page.waitForFunction(()=>OT_WORLD_PHONE.diagnostics().orders.length===2);
  report.secondPaid=await page.evaluate(()=>__RETURN_QA.snapshot());assert.equal(report.secondPaid.phone.orders[1].status,'queued');
  for(let i=0;i<150;i++){if(await page.evaluate(()=>OT_WORLD_PHONE.diagnostics().job?.id))break;await page.evaluate(()=>__RETURN_QA.advance(120));}
  report.afterReturn=await page.evaluate(()=>__RETURN_QA.snapshot());
  if(mode==='before'){
    assert.equal(report.afterReturn.phone.orders[1].status,'queued','reproduce the blocked paid order');
    assert.equal(report.afterReturn.returning.length,1);
    assert(report.afterReturn.returning[0].blocked);
    assert(report.afterReturn.returning[0].blockedFor>100);
    console.log('REPRODUCED native return blocked for',report.afterReturn.returning[0].blockedFor,'seconds; second paid purchase stays queued');
  }else{
    assert.equal(report.afterReturn.returning.length,0,'returning driver reaches a safe alternate curb and releases the courier');
    assert.equal(report.afterReturn.phone.orders[1].status,'en-route');
    assert(report.afterReturn.job&&!report.afterReturn.job.ready);
    const oldTarget=report.afterReturn.job.target;report.movedCaller=await page.evaluate(()=>__RETURN_QA.moveCaller());
    await page.evaluate(()=>__RETURN_QA.advance(180));
    report.followed=await page.evaluate(()=>__RETURN_QA.snapshot());
    assert(Math.hypot(report.followed.job.target.x-oldTarget.x,report.followed.job.target.z-oldTarget.z)>18,'native driver follows the new caller destination');
    assert(!report.followed.job.ready);await page.evaluate(()=>__RETURN_QA.save());
    const secondId=report.followed.phone.orders[1].id;await boot();report.reloaded=await page.evaluate(()=>__RETURN_QA.snapshot());
    assert.equal(report.reloaded.phone.orders[1].id,secondId,'same paid order survives reload');
    for(let i=0;i<180;i++){if(await page.evaluate(()=>OT_WORLD_PHONE.diagnostics().tracking?.ready))break;await page.evaluate(()=>__RETURN_QA.advance(120));}
    report.secondReady=await page.evaluate(()=>__RETURN_QA.snapshot());assert(report.secondReady.phone.tracking?.ready);
    await receive();assert.equal(await page.evaluate(()=>__RETURN_QA.receiveAgain()),false);
    report.final=await page.evaluate(()=>__RETURN_QA.snapshot());
    assert.equal(report.final.phone.orders.length,2);assert(report.final.phone.orders.every(o=>o.status==='delivered'));
    const gifts=(s,key)=>s.gifts.reduce((n,g)=>n+g[key],0);
    assert.equal(report.final.food-report.initial.food-gifts(report.final,'food')+gifts(report.initial,'food'),2*report.initial.foodItem.amount,'two receipts grant exactly the two purchased quantities');
    assert.equal(report.final.coins-report.initial.coins-gifts(report.final,'coins')+gifts(report.initial,'coins'),-2*report.initial.foodItem.price,'two orders debit once each, apart from observed native gifts');
    const receiptTimes=report.final.phone.orders.map(o=>o.receivedAt);await boot();
    report.finalReload=await page.evaluate(()=>__RETURN_QA.snapshot());
    assert.deepEqual(report.finalReload.phone.orders.map(o=>o.receivedAt),receiptTimes);
    assert.equal(await page.evaluate(()=>__RETURN_QA.receiveAgain()),false);
    assert(report.final.maxStep<.8,'driver always moves continuously through native collision checks');
    console.log('PASS native safe return, second purchase, caller following, reload and exactly-once receipts');
  }
  assert.deepEqual(errors,[]);report.passed=true;report.errors=errors;fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));
}catch(error){report.failure=error.stack;report.errors=errors;if(page)report.state=await page.evaluate(()=>window.__RETURN_QA?.snapshot()).catch(()=>null);fs.writeFileSync(out+'/failure.json',JSON.stringify(report,null,2));throw error;}
finally{await browser.close();await server.close();}

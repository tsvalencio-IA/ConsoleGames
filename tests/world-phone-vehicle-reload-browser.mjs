/* Paid vehicle delivery, interrupted reload and retry over disposable local RTDB. */
import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {installWorldRtdbFixture} from './helpers/world-rtdb-browser-fixture.mjs';
import {installCityInspection} from './helpers/world-city-inspection.mjs';

const out = 'test-results/world-phone-vehicle-reload';
fs.mkdirSync(out, {recursive: true});
const server = await multiplayerServer();
const browser = await chromium.launch({headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const source = fs.readFileSync('games/otthi/app.js', 'utf8'), end = source.lastIndexOf('})();');
const hook = `
 const reloadQaGifts=[],reloadQaSociety=updateNpcSociety;
 updateNpcSociety=function(...args){const before=state.profile.coins,result=reloadQaSociety(...args),amount=state.profile.coins-before;if(amount){if(amount!==8)throw Error('Unexpected passive credit');reloadQaGifts.push(amount);}return result;};
 window.__PHONE_RELOAD_QA={
  prepare:()=>{
   const v=vehicleById('playmobil-utility')||ensureCatalogVehicle('playmobil-utility');
   for(const[aId,bId]of NAV_BASE_EDGES){const a=NAV_BASE_NODES[aId],b=NAV_BASE_NODES[bId],len=Math.hypot(b.x-a.x,b.z-a.z);if(len<45)continue;const fx=(b.x-a.x)/len,fz=(b.z-a.z)/len;
    for(const side of[7,-7,10,-10]){const p={x:a.x+fx*len*.70+fz*side,z:a.z+fz*len*.70-fx*side};if(positionBlockedForPlayer(p.x,p.z,.5,{ignoreActor:v,ignoreTraffic:true}))continue;OTTHOS_TEST_API.teleport(p.x,p.z);if(phoneGroundDestination(v))return p;}
   }throw Error('No safe native road position');
  },
  advance:n=>__CITY_QA.simulate(n),
  snapshot:()=>({phone:OT_WORLD_PHONE.diagnostics(),coins:state.profile.coins,gifts:reloadQaGifts.slice(),owned:[...state.vehicles.owned],instances:structuredClone(state.vehicles.instances||{}),parked:structuredClone(state.vehicles.parked||{}),price:garageOldCatalogEntry('br-palio').price,text:phoneTrackingText()}),
  retry:id=>phoneDispatchGround(id),
  vehicle:id=>{const v=vehicleById(id);return v?{id:v.id,visible:v.group.visible,occupied:v.occupied,phoneDelivery:!!v.phoneDelivery,x:v.group.position.x,z:v.group.position.z}:null;}
 };`;
const report = {limits: [
  'Chromium with local realtime fixture and disposable save; no live account or database writes.',
  'Clock and player positioning are test fixtures; native purchase, delivery, save, reload and retry code run unchanged.',
  'Ground vehicles stop safely on reload and need a new driver call. Paid parcels have a separate automatic resume flow.',
  'Software WebGL does not certify physical mobile performance.'
]};
let page;
const errors = [];
try {
  const context = await browser.newContext({viewport: {width: 844, height: 390}, isMobile: true, hasTouch: true, serviceWorkers: 'block'});
  await context.route(/^https?:\/\//, r => new URL(r.request().url()).origin === server.origin ? r.continue() : r.abort());
  await installWorldRtdbFixture(context);
  await context.addInitScript(() => {
    const key = 'otthos_life_world_roleplay_v700', real = Date.now.bind(Date), saved = JSON.parse(localStorage.getItem(key) || 'null');
    const lead = Math.max(0, Number(saved?.lastSaved || 0) - real() + 100);
    Date.now = () => real() + lead;
    if (!saved) localStorage.setItem(key, JSON.stringify({version: 705, lastSaved: Date.now(),
      profile: {name: 'Recarga veículo QA', nameConfirmed: true, playerId: 'phone-reload-qa', coins: 8000},
      flags: {accountPromptedV635: true}, settings: {quality: 'low', sound: false}, guardian: {sessionLimitMinutes: 0}}));
  });
  page = await context.newPage();
  page.on('pageerror', e => errors.push(e.stack));
  page.setDefaultTimeout(60000);
  await installCityInspection(page, {appSource: source.slice(0, end) + hook + source.slice(end), capDuringBoot: true});
  const boot = async () => {
    await page.goto(server.origin + '/games/otthi/');
    await page.locator('#playBtn').click();
    await page.waitForFunction(() => window.__CITY_QA?.cap() && OTTHOS_TEST_API.getGame().running && document.getElementById('modal').hidden, null, {timeout: 120000});
  };
  await boot();
  await page.evaluate(() => __PHONE_RELOAD_QA.prepare());
  const before = await page.evaluate(() => __PHONE_RELOAD_QA.snapshot());
  await page.locator('#quickToggleBtn').click();
  await page.locator('#worldPhoneBtn').click();
  await page.locator('[data-phone-shop]').click();
  await page.locator('[data-phone-shop-tab="vehicles"]').click();
  await page.locator('[data-phone-buy-vehicle="br-palio"]').click();
  await page.locator('[data-yes]').click();
  await page.waitForFunction(() => OT_WORLD_PHONE.diagnostics().job);
  const paid = await page.evaluate(() => __PHONE_RELOAD_QA.snapshot()), order = paid.phone.orders.at(-1), id = order.vehicleId;
  assert.equal(order.kind, 'vehicle');
  assert.equal(order.status, 'en-route');
  assert.equal(paid.coins - before.coins, -before.price + paid.gifts.slice(before.gifts.length).reduce((a, b) => a + b, 0));
  assert.equal(paid.owned.filter(v => v === id).length, 1);
  assert.equal(paid.owned.length, before.owned.length + 1);
  await page.evaluate(() => __PHONE_RELOAD_QA.advance(120));
  const travelling = await page.evaluate(() => __PHONE_RELOAD_QA.snapshot());
  assert(travelling.phone.job, 'reload must occur during the actual delivery');
  await boot();
  const reloaded = await page.evaluate(() => __PHONE_RELOAD_QA.snapshot());
  assert.equal(reloaded.phone.job, null);
  assert.equal(reloaded.phone.last.status, 'interrupted');
  assert.equal(reloaded.phone.orders.at(-1).status, 'parked');
  assert.equal(reloaded.coins, travelling.coins, 'reload cannot debit the purchase again');
  assert.deepEqual(reloaded.owned, paid.owned);
  assert.deepEqual(reloaded.instances[id], paid.instances[id]);
  assert.match(reloaded.text, /interrompida ao recarregar/);
  assert.match(reloaded.text, /chame o motorista novamente/);
  const parked = await page.evaluate(id => __PHONE_RELOAD_QA.vehicle(id), id);
  assert(parked?.visible);
  assert(!parked.occupied && !parked.phoneDelivery);
  assert(Math.hypot(parked.x - travelling.parked[id].x, parked.z - travelling.parked[id].z) < .05, 'reload restores the last saved safe pose');
  await page.evaluate(() => __PHONE_RELOAD_QA.prepare());
  await page.locator('#quickToggleBtn').click();
  await page.locator('#worldPhoneBtn').click();
  await page.screenshot({path: out + '/interrupted-phone.png'});
  await page.locator('[data-phone-ground="' + id + '"]').click();
  await page.waitForFunction(() => OT_WORLD_PHONE.diagnostics().job);
  for (let i = 0; i < 200; i++) {
    if (!await page.evaluate(() => OT_WORLD_PHONE.diagnostics().job)) break;
    await page.evaluate(() => __PHONE_RELOAD_QA.advance(120));
  }
  const arrived = await page.evaluate(() => __PHONE_RELOAD_QA.snapshot());
  assert.equal(arrived.phone.job, null);
  assert.equal(arrived.phone.last.status, 'delivered');
  assert.deepEqual(arrived.owned, paid.owned);
  assert.equal(arrived.coins - reloaded.coins, arrived.gifts.reduce((a, b) => a + b, 0), 'retry has no extra purchase debit or refund');
  const delivered = await page.evaluate(id => __PHONE_RELOAD_QA.vehicle(id), id);
  assert(delivered.visible && !delivered.occupied && !delivered.phoneDelivery);
  assert.deepEqual(errors, []);
  Object.assign(report, {passed: true, before, paid, travelling, reloaded, parked, arrived, delivered, errors});
  fs.writeFileSync(out + '/result.json', JSON.stringify(report, null, 2));
  console.log('PASS purchased vehicle survives mid-delivery reload, explains interruption, accepts another driver call and arrives with one purchase debit');
} catch (error) {
  Object.assign(report, {failure: error.stack, errors, state: await page?.evaluate(() => window.__PHONE_RELOAD_QA?.snapshot()).catch(() => null)});
  if (page) await page.screenshot({path: out + '/failure.png'}).catch(() => {});
  fs.writeFileSync(out + '/failure.json', JSON.stringify(report, null, 2));
  throw error;
} finally {
  await browser.close();
  await server.close();
}

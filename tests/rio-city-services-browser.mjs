/* Native Rio menus, models and simulation on a disposable profile. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {installCityInspection} from './helpers/world-city-inspection.mjs';

const out='test-results/rio-city-services';
fs.mkdirSync(out,{recursive:true});
const server=await multiplayerServer();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const release=JSON.parse(fs.readFileSync('games/otthi/release-manifest.json','utf8'));
const report={build:release.build,revision:release.revision,browser:browser.version(),errors:[],
  limits:['Chromium com WebGL por software e viewport Android 393 × 852.','Posições de largada controladas e relógio de simulação acelerado. As ações e os serviços usam os controladores do jogo.']};
const source=fs.readFileSync('games/otthi/app.js','utf8'),end=source.lastIndexOf('})();');
const hook=`
 let maxJump=0,trip=0;const priorAdvance=phoneAdvanceJob;
 phoneAdvanceJob=function(job,dt){const before={x:job.route.x,z:job.route.z};priorAdvance(job,dt);const step=distance2D(before,job.route);trip+=step;maxJump=Math.max(maxJump,step);};
 window.__RIO_SERVICES_QA={
  snapshot:()=>({coins:state.profile.coins,food:Number(state.inventory.food||0),phone:OT_WORLD_PHONE.diagnostics(),
    worldGarage:structuredClone(state.vehicles.garage),rio:structuredClone(rioMapSave()),trip,maxJump,
    emergency:OT_EMERGENCY_SERVICE.diagnostics(),responders:serviceVehiclePools().map(v=>({id:v.id,home:v.home,x:v.group.position.x,z:v.group.position.z,route:v.responseJob?.route,blockedFor:v.responseJob?.blockedFor})),
    workshop:OT_WORKSHOP_BAYS.diagnostics(),traffic:world.ottoviasTraffic.length,
    models:world.vehicles.filter(v=>v.group.visible).map(v=>({id:v.id,model:v.brazilModel,x:v.x,z:v.z,yard:v.workshopYardStatus}))}),
  prepareParcel:()=>{
    const site=rioFunctionalSites().find(s=>s.kind==='market'),van=phoneCourierVehicle(),origin=phonePickupPoint(van,site);
    if(!origin)throw Error('Mercado sem saída física');
    for(const x of [-38,38,-54,54,-70,70])for(const z of [-8,8,-16,16]){
      const p={x:origin.x+x,z:origin.z+z};if(positionBlockedForPlayer(p.x,p.z,.55,{ignoreTraffic:true})||pointOnRoad(p.x,p.z,.3))continue;
      OTTHOS_TEST_API.teleport(p.x,p.z);
      const dest=phoneGroundDestination(van),route=dest&&phoneGroundRoute(van,origin,dest);
      if(route?.length>1&&routeLength(route)>25&&routeLength(route)<160)return {origin,p,dest};
    }
    throw Error('Nenhum destino próximo no grafo viário');
  },
  approach:()=>{
    const job=worldPhone.job,p=job.vehicle.group.position;
    for(let i=0;i<16;i++){
      const a=i*Math.PI/8,x=p.x+Math.sin(a)*3.8,z=p.z+Math.cos(a)*3.8;
      if(!positionBlockedForPlayer(x,z,.5,{ignoreTraffic:true})){OTTHOS_TEST_API.teleport(x,z);updateContext(true);return;}
    }
    throw Error('Encomenda sem acesso a pé');
  },
  prepareRescue:()=>{OTTHOS_TEST_API.teleport(RIO_WORKSHOP_ENTRY.x,RIO_WORKSHOP_ENTRY.z+8);return rioTrainingIncidentPoint();},
  prepareTow:()=>{
    const v=vehicleById('garage-orange')||ensureCatalogVehicle('garage-orange',1,RIO_GARAGE_BAY);
    rioSyncFleetPresent(v,RIO_GARAGE_BAY);setVehicleDurabilityV704(v,3,'qa-native-tow');openBrokenVehicleOptionsV704(v);
  },
  moveToWorkshop:()=>OTTHOS_TEST_API.teleport(RIO_WORKSHOP.x+4.8,RIO_WORKSHOP.z+5.3),
  receiveAgain:phoneReceiveParcel
 };`;
try{
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.abort());
  await context.addInitScript(()=>{
    const key='otthos_life_world_roleplay_v700';
    const existing=JSON.parse(localStorage.getItem(key)||'null'),clock=Date.now.bind(Date),lead=Math.max(0,(existing?.lastSaved||0)-clock()+200);
    Date.now=()=>clock()+lead;
    if(!existing)localStorage.setItem(key,JSON.stringify({version:705,profile:{name:'QA Rio Preto',playerId:'qa-rio-services',nameConfirmed:true,coins:6000},
      settings:{quality:'low',sound:false,worldHud:'clean'},flags:{accountPromptedV635:true},guardian:{sessionLimitMinutes:0},
      vehicles:{owned:['garage-orange'],garage:{stored:{'garage-orange':false},slots:{'1':'garage-orange'}}}}));
  });
  const page=await context.newPage();page.setDefaultTimeout(25000);
  page.on('pageerror',e=>report.errors.push(e.stack));
  await installCityInspection(page,{appSource:source.slice(0,end)+hook+source.slice(end),capDuringBoot:true});
  const touch=selector=>page.locator(selector).tap();
  async function enter(){
    await page.goto(server.origin+'/games/otthi/?map=rio-preto',{waitUntil:'domcontentloaded'});
    await touch('#rioPretoPlayBtn');
    await page.waitForFunction(()=>window.__CITY_QA?.cap()&&OTTHOS_TEST_API.getGame().running&&document.getElementById('modal').hidden);
    assert.equal(await page.locator('body').getAttribute('data-otthi-map'),'rio-preto');
  }
  const snapshot=()=>page.evaluate(()=>__RIO_SERVICES_QA.snapshot());
  const advance=frames=>page.evaluate(n=>__CITY_QA.simulate(n),frames);
  async function phone(){await touch('#quickToggleBtn');await touch('[data-rio-panel-phone]');}
  await enter();
  const before=await snapshot();
  await phone();await touch('[data-phone-store="garage-orange"]');
  const stored=await snapshot();
  assert.equal(stored.rio.roadVehicles['garage-orange'].stored,true);
  assert.deepEqual(stored.worldGarage,before.worldGarage);
  await touch('#modalClose');
  report.parcelStart=await page.evaluate(()=>__RIO_SERVICES_QA.prepareParcel());
  await phone();await touch('[data-phone-shop]');await touch('[data-phone-buy-item="food"]');await touch('[data-yes]');
  await page.waitForFunction(()=>OT_WORLD_PHONE.diagnostics().tracking?.kind==='parcel');
  const sent=await snapshot();report.parcelSent=sent.phone.tracking;
  assert(sent.models.some(v=>v.model==='kombi'&&v.id==='phone-parcel-courier'));
  assert.equal(sent.phone.orders[0].map,'rio-preto');
  assert.equal(before.coins-sent.coins,sent.phone.orders[0].price);
  await phone();await touch('[data-phone-track]');
  assert.equal(await page.locator('.rio-real-map circle[style*="ffbd45"]').count(),1);
  await touch('#modalClose');
  for(let i=0;i<48;i++){
    await advance(120);if((await snapshot()).phone.tracking?.ready)break;
  }
  const parked=await snapshot();report.parcelParked={tracking:parked.phone.tracking,metres:parked.trip,maxJump:parked.maxJump};
  assert(parked.phone.tracking?.ready,JSON.stringify(report.parcelParked));
  assert(parked.trip>25&&parked.maxJump<.30);
  await page.evaluate(()=>__RIO_SERVICES_QA.approach());
  await phone();await touch('[data-phone-parcel-receive]');
  const received=await snapshot();assert.equal(received.phone.orders[0].status,'delivered');
  assert.equal(received.coins,sent.coins);assert(received.food>before.food);
  assert.equal(await page.evaluate(()=>__RIO_SERVICES_QA.receiveAgain()),false);
  report.purchase={price:sent.phone.orders[0].price,foodAdded:received.food-before.food,repeatedPickup:false};
  await touch('#modalClose');
  await page.evaluate(()=>__RIO_SERVICES_QA.prepareTow());
  await touch('[data-v704-tow]');
  const tow=await snapshot();const ownerCar=tow.models.find(v=>v.id==='garage-orange');
  assert.equal(ownerCar?.yard,'pending');assert.equal(received.coins-tow.coins,20);
  assert(tow.workshop.bays.length===2&&Math.hypot(ownerCar.x-953,ownerCar.z-110.7)<36);
  assert.deepEqual(tow.worldGarage,before.worldGarage);report.tow={ownerCar,bays:tow.workshop.bays};
  await page.evaluate(()=>__RIO_SERVICES_QA.moveToWorkshop());
  await page.evaluate(()=>__CITY_QA.renderNative());await page.screenshot({path:out+'/oficina.png'});
  await enter();await advance(140);
  const recovered=await snapshot();assert.equal(recovered.phone.orders[0].status,'delivered');
  assert.equal(recovered.food,received.food);assert.equal(recovered.coins,tow.coins);
  assert.equal(recovered.models.find(v=>v.id==='garage-orange')?.yard,'pending');
  report.reload={food:recovered.food,coins:recovered.coins,workshop:recovered.models.find(v=>v.id==='garage-orange')};

  report.drillPoint=await page.evaluate(()=>__RIO_SERVICES_QA.prepareRescue());
  assert(report.drillPoint,'No mapped training point');
  await touch('#quickToggleBtn');await touch('[data-rio-panel-emergency]');await touch('[data-rio-emergency-training]');
  await page.waitForFunction(()=>OT_EMERGENCY_SERVICE.diagnostics().active);
  for(let i=0;i<64;i++){
    await advance(120);if((await snapshot()).emergency.history.length)break;
  }
  const rescue=await snapshot();report.rescue=rescue.emergency;report.lastResponders=rescue.responders;
  assert.equal(rescue.emergency.history.at(-1)?.mode,'physical',JSON.stringify(rescue.emergency));
  assert.deepEqual(Object.keys(rescue.emergency.history.at(-1).physicalArrivals).sort(),['firefighter','paramedic','police']);
  assert.deepEqual(rescue.emergency.history.at(-1).contingencyEvents,[]);
  assert.deepEqual(report.errors,[]);report.passed=true;
  console.log('PASS live Rio delivery, native garage separation, workshop reload and physical responders');
}catch(error){report.failure=error.stack;throw error;}
finally{
  fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));
  await browser.close();await server.close();
}

/* Visit actual Rio buildings in Chromium using their regular controls. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {installCityInspection} from './helpers/world-city-inspection.mjs';

const out='test-results/rio-walkable-buildings';
fs.mkdirSync(out,{recursive:true});
const server=await multiplayerServer(),browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const release=JSON.parse(fs.readFileSync('games/otthi/release-manifest.json','utf8'));
const report={build:release.build,revision:release.revision,browser:browser.version(),errors:[],
  limits:['Chromium local com viewport e toque simulados.', 'Posições iniciais próximas das entradas para testar os prédios ao longo da cidade.']};
const source=fs.readFileSync('games/otthi/app.js','utf8'),end=source.lastIndexOf('})();');
const hook=`
 const buildingsQaCounters=()=>({coins:state.profile.coins,city:structuredClone(rioMapSave()),legacy:structuredClone(state.houses),outfits:state.avatar.rioWardrobe});
 window.__RIO_BUILDINGS_QA={
  counters:buildingsQaCounters,
  prepare:key=>{
   const site=rioSiteByKey(key);const [x,z]=site.entry;rioCloseAmbientRoom();rioStreamMap({x,z},true);OTTHOS_TEST_API.teleport(x,z);
   cameraYaw=-site.yaw;cameraPitch=.34;cameraZoom=2.1;updateContext(true);
   return {context:currentContext?.id,site};
  },
  walkTo:(key,action)=>{
   const site=rioSiteByKey(key),target=world.interactables.find(a=>a.id===site.id+'-'+action);
   if(!target)throw Error('Missing action '+key+'/'+action);
   return rioEnterPlace({x:target.x,z:target.z});
  },
  aisle:()=>{const site=rioSiteByKey('catedral_sao_jose'),room=rioMap.sites.get(site.id);return rioEnterPlace(room.point(0,-site.d/2+6.5));},
  inBuilding:key=>{
   const site=rioSiteByKey(key),room=rioMap.sites.get(site.id);
   return {inside:room.forSite(player.x,player.z,-.42),position:{x:player.x,z:player.z},context:currentContext?.id,
     roof:room.roof?.visible,server:room.server?{visible:room.server.npc.group.visible,tray:room.server.tray.visible,served:room.servedDish.visible,position:room.server.npc.group.position.toArray()}:null};
  },
  ambient:()=>{
   const site=rioSiteByKey('prefeitura_andalo'),buildings=[...rioMap.geo.doors.query(site.x,site.z,125)];
   for(const b of buildings){
    const {x,z}=b.door.outside;
    rioStreamMap({x,z},true);
    if(positionBlockedForPlayer(x,z,.5,{ignoreTraffic:true}))continue;
    OTTHOS_TEST_API.teleport(x,z);updateContext(true);
    if(currentContext?.id==='rio-building-door')return {door:b.door,kind:b.kind};
   }
   throw Error('No accessible mapped entrance fixture');
  },
  ambientInside:()=>{const b=rioMap.activeBuilding?.building;return !!b&&rioWithinFootprint(player.x,player.z,b.rings,-.1);},
  mealPose:()=>characterActivities.session?.pose||null,
  oilBay:()=>{
   const site=rioSiteByKey('cachoeira_troca_oleo');rioStreamMap(site,true);
   const room=rioMap.sites.get(site.id),bay=room.point(0,-.55),standing=room.point(1.84,-.55),car=vehicleById('garage-orange');
   setVehicleDurabilityV704(car,65,'qa-oil');rioSyncFleetPresent(car,{...bay,heading:site.yaw+Math.PI});
   OTTHOS_TEST_API.teleport(standing.x,standing.z);updateContext(true);
   return {context:currentContext?.id};
  },
  oilResult:()=>({coins:state.profile.coins,engine:workshopComponentRecord(vehicleById('garage-orange')).parts.engine,car:player.car.id}),
  plane:()=>{
   const p=campaignAircraftPose('plane');rioStreamMap(p,true);OTTHOS_TEST_API.teleport(p.x+4,p.z);updateContext(true);
   return {p,context:currentContext?.id,length:routeLength(rioMap.data.airport.runway.map(([x,z])=>({x,z})))};
  },
  flight:()=>({active:otGames.active,mode:otGames.mode,onGround:otGames.onGround,body:otGames.body}),
  render:()=>{playerGroup.position.set(player.x,player.y,player.z);updateCamera(2);__CITY_QA.renderNative();}
 };`;
try{
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route(/^https?:\/\//,route=>new URL(route.request().url()).origin===server.origin?route.continue():route.abort());
  await context.addInitScript(()=>{
    const key='otthos_life_world_roleplay_v700',prior=JSON.parse(localStorage.getItem(key)||'null');
    const clock=Date.now.bind(Date),lead=Math.max(0,(prior?.lastSaved||0)-clock()+200);
    Date.now=()=>clock()+lead;
    if(!prior)localStorage.setItem(key,JSON.stringify({version:705,
      profile:{name:'Rio Visitas QA',playerId:'rio-buildings-qa',coins:5000,nameConfirmed:true},
      settings:{quality:'low',sound:false,worldHud:'clean'},flags:{accountPromptedV635:true},guardian:{sessionLimitMinutes:0},
      avatar:{bodyStyle:'family-thiago'},vehicles:{owned:['garage-orange']}}));
  });
  const page=await context.newPage();page.setDefaultTimeout(30000);
  page.on('pageerror',e=>report.errors.push(e.stack));
  await installCityInspection(page,{appSource:source.slice(0,end)+hook+source.slice(end),capDuringBoot:true});
  const tap=selector=>page.locator(selector).tap();
  const evalQA=(method,...args)=>page.evaluate(({method,args})=>window.__RIO_BUILDINGS_QA[method](...args),{method,args});
  async function start(){
    await page.goto(server.origin+'/games/otthi/?map=rio-preto',{waitUntil:'domcontentloaded'});
    await tap('#rioPretoPlayBtn');
    await page.waitForFunction(()=>window.__CITY_QA?.cap()&&OTTHOS_TEST_API.getGame().running&&document.getElementById('modal').hidden);
    assert.equal(await page.locator('body').getAttribute('data-otthi-map'),'rio-preto');
  }
  const advance=(n=260)=>page.evaluate(n=>__CITY_QA.simulate(n),n);
  async function enter(key,house=false){
    const outside=await evalQA('prepare',key);assert.equal(outside.context,outside.site.id+'-entrance');
    await tap('#actionBtn');if(house)await tap('[data-rio-property-enter]');
    await advance(260);
    const inside=await evalQA('inBuilding',key);assert(inside.inside,JSON.stringify({key,...inside}));assert.equal(inside.roof,false);
    return outside.site;
  }
  async function approach(site,suffix){
    assert(await evalQA('walkTo',site.key,suffix),'Unreachable '+site.key+'/'+suffix);
    await advance(520);
    const state=await evalQA('inBuilding',site.key);assert.equal(state.context,site.id+'-'+suffix,JSON.stringify(state));
  }
  const picture=async name=>{await evalQA('render');await page.screenshot({path:out+'/'+name+'.png'});};
  await start();
  const initial=await evalQA('counters');
  const preview=await evalQA('prepare','casa-damha');
  await tap('#actionBtn');await tap('[data-rio-property-buy]');
  const purchased=await evalQA('counters');
  assert.equal(purchased.city.properties.cabin.paid,preview.site.price);
  assert.equal(initial.coins-purchased.coins,preview.site.price);
  assert.deepEqual(purchased.legacy,initial.legacy);
  await tap('[data-rio-property-enter]');await advance();
  assert.equal((await evalQA('inBuilding','casa-damha')).inside,true);
  report.dwelling={price:preview.site.price,owner:purchased.city.properties.cabin};
  await picture('casa-damha');

  const church=await enter('catedral_sao_jose');
  assert(await evalQA('aisle'));await advance(990);
  await approach(church,'altar-1');await tap('#actionBtn');
  assert.equal(await page.evaluate(()=>OT_CHARACTER_ACTIVITIES.diagnostics().session?.kind),'rio-rest');
  await advance(310);report.church=(await evalQA('inBuilding',church.key)).inside;
  await picture('catedral-altar');

  const bakery=await enter('panificacao-zappas-centro');
  await approach(bakery,'counter');await tap('#actionBtn');await tap('[data-rio-food="bread-coffee"]');
  const startingService=(await evalQA('inBuilding',bakery.key)).server;
  assert(startingService.tray&&!startingService.served);
  await advance(490);
  const served=(await evalQA('inBuilding',bakery.key)).server;
  assert(served.visible&&served.served&&!served.tray);
  await approach(bakery,'table');await tap('#actionBtn');await advance(140);
  const seated=await evalQA('mealPose');
  assert(seated?.sitting);
  await picture('padaria-mesa');await advance(390);
  assert.equal(purchased.coins-(await evalQA('counters')).coins,12);
  report.bakery={startingService,served,sitting:seated};

  const mall=await enter('riopreto_shopping');
  await approach(mall,'store-top');await tap('#actionBtn');await tap('[data-rio-clothing-buy="rio-polo"]');
  assert(await page.locator('[data-rio-clothing-buy="rio-polo"]').isDisabled());await tap('#modalClose');
  await approach(mall,'store-shoes');await tap('#actionBtn');await tap('[data-rio-clothing-buy="rio-tenis"]');
  await tap('[data-rio-clothing-try]');await tap('[data-rio-wardrobe-character="thamis"]');
  await page.locator('[data-rio-wardrobe-slot="top"]').selectOption('rio-polo');
  await page.locator('[data-rio-wardrobe-slot="shoes"]').selectOption('rio-tenis');
  await page.screenshot({path:out+'/provador-thamis.png'});
  await tap('[data-rio-wardrobe-save]');
  const dressed=await evalQA('counters');
  assert.equal(dressed.outfits.thamis.top,'rio-polo');assert.equal(dressed.outfits.thamis.shoes,'rio-tenis');
  assert.equal(purchased.coins-dressed.coins,12+65+49);
  report.shopping={owned:dressed.city.wardrobePurchases,thamis:dressed.outfits.thamis};
  await start();
  const reloaded=await evalQA('counters');
  assert.deepEqual(reloaded.outfits,dressed.outfits);assert.equal(reloaded.coins,dressed.coins);
  assert.deepEqual(reloaded.city.properties,dressed.city.properties);

  const generic=await evalQA('ambient');await tap('#actionBtn');
  if(await page.locator('[data-rio-property-enter]').count())await tap('[data-rio-property-enter]');
  await advance(220);assert(await evalQA('ambientInside'),JSON.stringify(generic));
  report.mappedBuilding=generic;
  await picture('predio-cartografico');
  assert.equal((await evalQA('oilBay')).context,'vehicle-garage-orange');
  await tap('#actionBtn');const priorOil=await evalQA('oilResult');
  assert.equal(priorOil.car,'garage-orange');await tap('#vehicleActionBtn');await tap('[data-rio-oil-confirm]');
  report.oilShop=await evalQA('oilResult');assert.equal(priorOil.coins-report.oilShop.coins,12);assert(report.oilShop.engine>priorOil.engine);
  await tap('#actionBtn');
  await enter('aeroporto-sbsr');
  const plane=await evalQA('plane');assert(plane.length>1500&&plane.context==='rio-aircraft-plane',JSON.stringify(plane));
  await tap('#actionBtn');await page.waitForFunction(()=>OT_GAMES.diagnostics().active);
  const boarded=await evalQA('flight');assert(boarded.active&&boarded.mode==='plane'&&boarded.onGround);
  const lever=page.locator('[data-ot="collective"]'),rect=await lever.boundingBox();
  await lever.tap({position:{x:rect.width/2,y:9}});
  await advance(215);
  await page.keyboard.down('ArrowUp');await advance(275);await page.keyboard.up('ArrowUp');
  const flying=await evalQA('flight');
  assert(!flying.onGround&&flying.body.y>3&&Math.hypot(flying.body.x-boarded.body.x,flying.body.z-boarded.body.z)>35,JSON.stringify(flying));
  report.airport={runwayMetres:plane.length,boarded,flying};
  await page.setViewportSize({width:844,height:390});await picture('aeroporto-pista');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(report.errors,[]);report.passed=true;
  console.log('PASS authentic door routes, owned house, church, served pastry, wardrobe purchases, mapped room and SBSR flight');
}catch(error){report.failure=error.stack;throw error;}
finally{
  fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));
  await browser.close();await server.close();
}

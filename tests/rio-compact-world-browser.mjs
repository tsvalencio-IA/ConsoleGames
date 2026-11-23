import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {browserContextNetwork,browserNetwork} from './helpers/browser-network.mjs';
import {touchSession} from './helpers/touch-session.mjs';

const hosted=process.env.OT_COMPACT_RIO_BASE;
const server=hosted?null:await multiplayerServer();
const base=new URL('/games/otthi/',hosted||server.origin);
const out=process.env.OT_COMPACT_RIO_OUT||'test-results/rio-compact-world';
const release=JSON.parse(readFileSync('games/otthi/release-manifest.json','utf8'));
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserNetwork(base.href),headless:true,args:['--no-sandbox',
  '--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={build:release.build,revision:release.revision,browser:browser.version(),origin:base.origin,errors:[],screens:[]};
let page;
try{
  const context=await browser.newContext({...browserContextNetwork(base.href),serviceWorkers:'block',
    viewport:{width:393,height:852},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await context.route(/^https?:\/\//,route=>new URL(route.request().url()).origin===base.origin?route.continue():route.abort());
  await context.addInitScript(()=>{
    const key='otthos_life_world_roleplay_v700';
    if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:705,
      profile:{name:'Rio Preto Passeio',playerId:'compact-rio-browser',nameConfirmed:true,coins:4312,xp:240},
      position:{x:-98,y:0,z:11,yaw:0},avatar:{bodyStyle:'family-thiago'},
      settings:{quality:'low',sound:false,worldHud:'clean',lastWorldMap:'rio-preto'},flags:{accountPromptedV635:true},
      cityServices:{rioMap:{version:2,position:{x:2093,z:-80},properties:{'regional-casa-damha':{owned:true,paid:1250}},
        visits:{'regional-mercado_municipal':true}}},
      vehicles:{owned:['garage-orange','home-green']},guardian:{sessionLimitMinutes:0}}));
  });
  page=await context.newPage();
  page.setDefaultTimeout(45000);
  page.on('pageerror',error=>report.errors.push(error.stack));
  const touch=await touchSession(context,page);
  const boot=async query=>{
    await page.goto(new URL(query,base).href,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(rev=>window.OTTHI_RELEASE_COHERENT&&window.OTTHI_RELEASE_REVISION===rev,release.revision);
    assert.equal(await page.locator('.hero-actions button').count(),1);
    await page.locator('#playBtn').tap();
    await page.waitForFunction(()=>window.OTTHOS_TEST_API?.getGame().running&&
      document.getElementById('modal').hidden&&OTTHI_ROAD_CONTINUITY.diagnostics().ready,null,{timeout:95000});
    assert.equal(new URL(page.url()).searchParams.get('map'),'rio-preto');
    assert.equal(await page.locator('body').getAttribute('data-otthi-map'),'rio-preto-compacto');
  };
  const shot=async name=>{await page.screenshot({path:out+'/'+name+'.png',timeout:60000});report.screens.push(name);};
  const menu=async()=>{await page.locator('#quickToggleBtn').tap();await page.locator('#worldHomeBtn').waitFor();};
  const close=async()=>{await page.locator('#modalClose').tap();await page.locator('#modal').waitFor({state:'hidden'});};
  const look=()=>page.evaluate(()=>({player:OTTHOS_TEST_API.getGame().player,context:OTTHOS_TEST_API.getContext(),camera:OTTHOS_TEST_API.camera()}));
  const state=()=>page.evaluate(()=>OTTHOS_TEST_API.getState());
  const resumeAt=async entrance=>{
    await menu();
    await page.locator('#worldLobbyBtn').tap();
    await page.locator('#playBtn').waitFor();
    await page.evaluate(name=>{
      const url=new URL(location.href);
      url.searchParams.set('entrada',name);history.replaceState(history.state,'',url);
    },entrance);
    await page.locator('#playBtn').tap();
    await page.waitForFunction(()=>OTTHOS_TEST_API.getGame().running&&document.getElementById('modal').hidden);
    assert(!new URL(page.url()).searchParams.has('entrada'));
  };

  await boot('?map=ot');
  const world=await page.evaluate(()=>({
    bounds:OTTHI_WORLD_LAYOUT_V704.bounds(),roads:OTTHI_ROAD_CONTINUITY.diagnostics(),world:OTTHOS_TEST_API.getGame().objects,
    grass:OTTHOS_TEST_API.performance().textures.grass
  }));
  assert.deepEqual(world.bounds,{minX:-850,maxX:850,minZ:-700,maxZ:1100});
  assert(world.roads.textured&&world.roads.geometry.asphalt>100);
  assert(world.world.houses>8&&world.world.npcs>10);
  report.world=world;
  await shot('av-bady-bassitt');

  await menu();
  await shot('menu-retrato');
  for(const id of ['worldPhoneBtn','worldHomeBtn','worldLobbyBtn']){
    const box=await page.locator('#'+id).boundingBox();
    assert(box&&box.width>=44&&box.height>=44,id);
  }
  await page.locator('#worldPhoneBtn').tap();
  await page.locator('[data-phone-shop]').waitFor();
  await close();

  await page.locator('#miniNav').tap();
  await page.locator('[data-atlas-tab-button="places"]').tap();
  const find=page.locator('[data-atlas-search]');
  await find.fill('Antonio de Godoy');
  await page.locator('[data-map-list="rio-via-godoy"]').tap();
  await page.locator('[data-route-selected="rio-via-godoy"]').tap();
  const road=await page.evaluate(()=>OTTHOS_TEST_API.navigation());
  assert.equal(road.waypoint?.name,'Rua Antônio de Godoy');
  assert(road.route.length>1);
  await page.locator('#miniNav').tap();
  await page.locator('[data-atlas-tab-button="places"]').tap();
  await find.fill('Ottovias');
  await page.locator('[data-map-list="ottovias-entry"]').tap();
  await page.locator('[data-route-selected="ottovias-entry"]').tap();
  assert.equal(await page.evaluate(()=>OTTHOS_TEST_API.navigation().waypoint?.id),'ottovias-entry');
  assert.equal(new URL(page.url()).searchParams.get('map'),'rio-preto');

  await menu();
  await page.locator('#worldHomeBtn').tap();
  const home=await page.evaluate(()=>OTTHI_WORLD_LAYOUT_V704.point('spawn'));
  const returned=(await look()).player;
  assert(Math.hypot(returned.x-home.x,returned.z-home.z)<3.5);
  report.home={x:returned.x,z:returned.z};
  await menu();
  await page.locator('#worldClimateBtn').tap();
  await page.locator('[data-rio-weather="rain"]').tap();
  await page.waitForFunction(()=>document.body.dataset.rioClima==='rain');
  await shot('chuva');
  await menu();
  await page.locator('#worldLobbyBtn').tap();
  await page.locator('#playBtn').waitFor();
  await page.locator('#playBtn').tap();
  await page.waitForFunction(()=>OTTHOS_TEST_API.getGame().running);
  assert.equal((await state()).settings.rioWeather,'rain');
  report.returnToMenu=true;

  await boot('?entrada=represa-cais');
  assert.equal((await look()).context?.id,'rio-represa-mirante');
  await page.locator('#actionBtn').tap();
  assert.equal(await page.locator('[data-rio-dock-boat]').count(),0);
  assert.equal((await page.evaluate(()=>OTTHI_RIO_MAP.diagnostics())).craft.length,0);
  await shot('represa-mirante-sem-barcos');
  await page.locator('[data-rio-praia-route]').tap();
  assert.equal((await state()).waypoint.id,'coast-view');
  report.represa={mirante:true,boats:0,guarujaGps:true};

  await resumeAt('canecao_represa');
  const start=await look();
  const canecao=await page.evaluate(()=>OTTHI_RIO_MAP.diagnostics().entrances.find(place=>place.key==='canecao_represa'));
  const [x,z]=canecao.entry,dx=x-start.player.x,dz=z-start.player.z,yaw=start.camera.yaw,distance=Math.hypot(dx,dz);
  const right=(dx*Math.cos(yaw)+dz*Math.sin(yaw))/distance,forward=(dx*Math.sin(yaw)-dz*Math.cos(yaw))/distance;
  const step=await touch.start(page.locator('#joystick'),.5+right*.18,.5-forward*.18);
  await page.waitForFunction(()=>OTTHOS_TEST_API.getContext()?.id==='regional-canecao_represa-entrance',null,{timeout:18000});
  await touch.end(step);
  await page.locator('#actionBtn').tap();
  await page.waitForFunction(()=>OT_CHARACTER_ACTIVITIES.diagnostics().session?.kind==='rio-entry');
  await page.waitForFunction(()=>!OT_CHARACTER_ACTIVITIES.diagnostics().session,null,{timeout:24000});
  const inside=(await look()).player;
  assert(inside.z<canecao.entry[1]-1.5&&Math.abs(inside.x-canecao.x)<canecao.w/2);
  await shot('canecao-interior');

  for(const [name,width,height] of [['paisagem',852,393],['desktop',1280,800]]){
    await page.setViewportSize({width,height});
    await menu();
    const sizes=await page.locator('#quickBar').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth,clientHeight:el.clientHeight}));
    assert(sizes.width>=200&&sizes.scroll-sizes.width<=1,JSON.stringify(sizes));
    await shot('menu-'+name);
    await page.locator('#worldMenuClose').tap();
  }
  const saved=await state();
  assert.equal(saved.profile.coins,4312);
  assert(saved.vehicles.owned.includes('garage-orange')&&saved.vehicles.owned.includes('home-green'));
  assert.equal(saved.cityServices.rioMap.properties['regional-casa-damha'].owned,true);
  assert.equal(saved.cityServices.rioMap.previousMapPose.position.x,2093);

  // Own a new home, pay for an item, rearrange it and verify persistence.
  // Existing Damha ownership and the legacy house snapshot must survive.
  await resumeAt('casa-cotegipe');
  await page.waitForFunction(()=>OTTHOS_TEST_API.getContext()?.id==='regional-casa-cotegipe-entrance');
  await page.locator('#actionBtn').tap();
  await page.locator('[data-rio-property-buy]').waitFor();
  await page.locator('[data-rio-property-buy]').tap();
  await page.locator('[data-rio-property-decor]').waitFor();
  await page.locator('[data-rio-property-decor]').tap();
  await page.locator('[data-rio-decor-item="sofa-modular"]').tap();
  await page.locator('[data-rio-decor-edit="right"]').tap();
  await page.locator('[data-rio-decor-edit="rotate"]').tap();
  let interior=await state();
  const record=interior.cityServices.rioMap.properties['regional-casa-cotegipe'];
  assert(record?.owned&&record.paid===380);
  assert(record.furniture.includes('sofa-modular'));
  assert.equal(record.decorLayout['sofa-modular'].rotation,1);
  assert.equal(interior.profile.coins,4312-380-180);
  assert.equal(interior.cityServices.rioMap.properties['regional-casa-damha']?.owned,true);
  report.housing={bought:true,decorated:true,coins:interior.profile.coins,placement:record.decorLayout['sofa-modular']};
  await shot('casa-com-sofa-editavel');
  await boot('?entrada=casa-cotegipe');
  await page.waitForFunction(()=>OTTHOS_TEST_API.getContext()?.id==='regional-casa-cotegipe-entrance');
  await page.locator('#actionBtn').tap();
  await page.locator('[data-rio-property-decor]').waitFor();
  assert.equal(await page.locator('[data-rio-property-buy]').count(),0);
  const reloaded=(await state()).cityServices.rioMap.properties['regional-casa-cotegipe'];
  assert.deepEqual(reloaded.furniture,record.furniture);
  assert.deepEqual(reloaded.decorLayout['sofa-modular'],record.decorLayout['sofa-modular']);
  await close();
  await page.evaluate(()=>OTTHOS_TEST_API.teleport(50,330));
  await page.waitForFunction(()=>document.body.dataset.rioClima==='snow');
  assert((await look()).player.y>15);
  await shot('neve-na-serra');
  assert.deepEqual(report.errors,[]);
  report.passed=true;
  console.log('PASS Rio Preto: map, owner purchase, persistent furniture placement, Guarujá waterfront, Canecão and snow');
}catch(error){
  report.failure=error.stack;
  if(page)await page.screenshot({path:out+'/failure.png',timeout:15000}).catch(()=>{});
  throw error;
}finally{
  writeFileSync(out+'/result.json',JSON.stringify(report,null,2));
  await browser.close();await server?.close();
}

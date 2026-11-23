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

  // Diagnose the "everything turned blue" rendering report from real pixels
  // rather than guessing at materials: measure the central 3D viewport only.
  const image=await page.screenshot({timeout:60000});
  const visual=await page.evaluate(async encoded=>{
    const bitmap=await createImageBitmap(await(await fetch('data:image/png;base64,'+encoded)).blob());
    const sample=document.createElement('canvas');
    sample.width=bitmap.width;sample.height=bitmap.height;
    const g=sample.getContext('2d',{willReadFrequently:true});g.drawImage(bitmap,0,0);
    const x0=Math.floor(bitmap.width*.19),x1=Math.floor(bitmap.width*.82),
      y0=Math.floor(bitmap.height*.31),y1=Math.floor(bitmap.height*.67);
    const {data}=g.getImageData(0,0,sample.width,sample.height);
    let count=0,blue=0,opaque=0,veryDark=0;
    const quantized=new Set();
    for(let y=y0;y<y1;y+=4)for(let x=x0;x<x1;x+=4){
      const k=(y*bitmap.width+x)*4,r=data[k],gr=data[k+1],b=data[k+2],a=data[k+3];
      count++;if(a>=240)opaque++;if(r+gr+b<55)veryDark++;
      if(b>r*1.4&&b>gr*1.17&&b>68)blue++;
      quantized.add((r>>5)+'-'+(gr>>5)+'-'+(b>>5));
    }
    bitmap.close();
    return {samples:count,blueFraction:blue/count,opaqueFraction:opaque/count,
      darkFraction:veryDark/count,paletteCells:quantized.size};
  },image.toString('base64'));
  report.visual=visual;
  assert(visual.paletteCells>5,'3D view became a uniform colour: '+JSON.stringify(visual));
  assert(visual.blueFraction<.91,'3D scene rendered as almost entirely blue: '+JSON.stringify(visual));


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
  assert(saved.profile.coins>=4312,'existing progress lost coins during scene restoration');
  const beforeHomePurchaseCoins=saved.profile.coins;
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
  await page.locator('[data-rio-decor-item="sofa-modular"]').waitFor({timeout:25000});
  await page.locator('[data-rio-decor-item="sofa-modular"]').tap();
  await page.locator('#rio-decor-live').waitFor();
  assert.equal(await page.locator('#modal').isHidden(),true,'editor cannot hide the entire scene behind a modal');
  assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('modal-open')),false);
  assert(await page.evaluate(()=>!!window.__OTTHI_DECOR_PREVIEW),'3D item camera target must be active');
  const placementRect=await page.locator('#rio-decor-live').boundingBox();
  assert(placementRect.width<page.viewportSize().width*.53,'editor must use less than half phone viewport');
  const beforeDrag=await page.evaluate(()=>({...window.__OTTHI_DECOR_PREVIEW}));
  const canvasRect=await page.evaluate(()=>{
    const candidates=[...document.querySelectorAll('canvas')]
      .map(c=>c.getBoundingClientRect()).filter(r=>r.width>250&&r.height>220)
      .sort((a,b)=>b.width*b.height-a.width*a.height);
    const r=candidates[0];
    return r?{x:r.x,y:r.y,width:r.width,height:r.height}:null;
  });
  assert(canvasRect,'game WebGL canvas must be visible behind the editor');
  const x1=canvasRect.x+canvasRect.width*.22,y1=canvasRect.y+canvasRect.height*.46;
  const x2=canvasRect.x+canvasRect.width*.36,y2=canvasRect.y+canvasRect.height*.57;
  await page.mouse.move(x1,y1);
  await page.mouse.down();
  await page.mouse.move(x2,y2,{steps:6});
  await page.mouse.up();
  const afterDrag=await page.evaluate(()=>({...window.__OTTHI_DECOR_PREVIEW}));
  assert(Math.hypot(afterDrag.x-beforeDrag.x,afterDrag.z-beforeDrag.z)>.08,
    'dragging on the real 3D floor must move the preview furniture');
  await page.locator('[data-rio-live="right"]').tap();
  await page.locator('[data-rio-live="rotate"]').tap();
  await shot('decoracao-ao-vivo-sem-modal');
  await page.locator('[data-rio-live="save"]').tap();
  assert.equal(await page.locator('#rio-decor-live').count(),0);
  assert.equal(await page.evaluate(()=>!!window.__OTTHI_DECOR_PREVIEW),false);
  let interior=await state();
  const record=interior.cityServices.rioMap.properties['regional-casa-cotegipe'];
  assert(record?.owned&&record.paid===380);
  assert(record.furniture.includes('sofa-modular'));
  assert.equal(record.decorLayout['sofa-modular'].rotation,1);
  // The world can award passive activity coins while the character shops.
  // Verify the exact contractual prices via receipts, without assuming time
  // stands still between the menu snapshots.
  assert.equal(record.paid,380);
  assert.equal(record.furniture.filter(id=>id==='sofa-modular').length,1,'no duplicate sofa purchases');
  const netGainDuringPurchase=interior.profile.coins-(beforeHomePurchaseCoins-380-180);
  assert(netGainDuringPurchase>=0&&netGainDuringPurchase<=40,
    'home and sofa spending must be preserved; only small legitimate background earnings are allowed: '+netGainDuringPurchase);
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
  // Shopping Cidade Norte: enter a real interior, browse clothes, leave again.
  await page.evaluate(()=>OTTHOS_TEST_API.teleport(376,-320));
  await page.waitForFunction(()=>OTTHOS_TEST_API.getContext()?.id==='regional-shopping_cidade_norte',null,{timeout:35000});
  await page.locator('#actionBtn').tap();
  try{
    await page.waitForFunction(()=>{
      const p=OTTHOS_TEST_API.getGame().player;
      const mall=OTTHI_RIO_V51.diagnostics().malls.find(m=>m.id==='regional-shopping_cidade_norte');
      return mall?.inside&&mall.visible&&Math.abs(p.x-376)<3&&p.z>-319&&p.z< -307;
    },null,{timeout:12000});
  }catch(error){
    const detail=await page.evaluate(()=>({malls:OTTHI_RIO_V51.diagnostics().malls,shoppingAction:OTTHI_RIO_V51.diagnostics().shoppingAction,lastVisit:OTTHI_RIO_V51.diagnostics().lastVisit,
      player:OTTHOS_TEST_API.getGame().player,context:OTTHOS_TEST_API.getContext(),
      modal:document.getElementById('modal')?.textContent,errors:window.__OTTHI_ERRORS||[]}));
    throw new Error('Shopping real-world entry failed: '+JSON.stringify(detail)+'; '+error.message);
  }
  await shot('shopping-cidade-norte-interior');
  await page.evaluate(()=>OTTHOS_TEST_API.teleport(383,-313));
  await page.waitForFunction(()=>OTTHOS_TEST_API.getContext()?.id==='regional-shopping_cidade_norte-store-top',null,{timeout:9000});
  await page.locator('#actionBtn').tap();
  await page.locator('[data-rio-clothing-buy]').first().waitFor({timeout:10000});
  await shot('shopping-cidade-norte-loja-roupas');
  await close();
  await page.evaluate(()=>OTTHOS_TEST_API.teleport(376,-315));
  await page.waitForFunction(()=>OTTHOS_TEST_API.getContext()?.id==='regional-shopping_cidade_norte-exit-regional-mall',null,{timeout:9000});
  await page.locator('#actionBtn').tap();
  await page.waitForFunction(()=>OTTHOS_TEST_API.getContext()?.id==='regional-shopping_cidade_norte',null,{timeout:10000});
  report.shopping={realInterior:true,clothesShop:true,exit:true};

  // Outdoor water cannot be in the apartment: verify the actual 3D pool
  // interactable from the exterior leisure court of Rio Candelaro.
  await page.evaluate(()=>OTTHOS_TEST_API.teleport(286.8,143.3));
  await page.waitForFunction(()=>OTTHOS_TEST_API.getContext()?.id==='regional-rios-italia-candelaro-outdoor-pool',
    null,{timeout:16000});
  await shot('rio-candelaro-piscina-externa');
  await page.locator('#actionBtn').tap();
  await page.waitForFunction(()=>OTTHOS_TEST_API.getLastAction()==='regional-rios-italia-candelaro-outdoor-pool',
    null,{timeout:9000});
  report.pool={exterior:true,interactive:true};
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

import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {browserContextNetwork,browserNetwork} from './helpers/browser-network.mjs';

const hosted=process.env.OT_RIO_STREET_BASE;
const server=hosted?null:await multiplayerServer();
const base=new URL('games/otthi/',hosted||server.origin);
const out=process.env.OT_RIO_STREET_OUT||'test-results/rio-street-map';
const release=JSON.parse(readFileSync('games/otthi/release-manifest.json','utf8'));
const report={origin:base.origin,build:release.build,revision:release.revision,layouts:[],errors:[]};
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserNetwork(base.href),headless:true,args:['--no-sandbox',
  '--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
report.browser=browser.version();

try{
  const context=await browser.newContext({...browserContextNetwork(base.href),serviceWorkers:'block',
    viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  await context.route(/^https?:\/\//,request=>new URL(request.request().url()).origin===base.origin?request.continue():request.abort());
  await context.addInitScript(()=>{
    const key='otthos_life_world_roleplay_v700';
    if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:705,
      profile:{name:'Passeio em Rio Preto',playerId:'rio-street-map',nameConfirmed:true,coins:4300},
      settings:{quality:'low',sound:false,worldHud:'clean'},avatar:{bodyStyle:'family-thiago'},
      flags:{accountPromptedV635:true},guardian:{sessionLimitMinutes:0},vehicles:{owned:['garage-orange']}}));
  });
  const page=await context.newPage();
  page.setDefaultTimeout(40000);
  page.on('pageerror',error=>report.errors.push(error.stack));
  const waitVersion=async()=>page.waitForFunction(expected=>window.OTTHI_RELEASE_COHERENT&&
    window.OTTHI_RELEASE_REVISION===expected,release.revision);
  const waitRunning=async map=>page.waitForFunction(map=>document.body.dataset.otthiMap===map&&
    window.OTTHOS_TEST_API?.getGame().running&&document.getElementById('modal').hidden,map,{timeout:65000});
  const openMap=async()=>{
    await page.locator('#miniNav').tap();
    await page.locator('.rio-real-map').waitFor();
  };
  const search=page.getByRole('searchbox',{name:'Buscar no mapa'});

  await page.goto(new URL('?entrada=mercado_municipal',base).href,{waitUntil:'domcontentloaded'});
  await waitVersion();
  await page.locator('#rioPretoPlayBtn').tap();
  await waitRunning('rio-preto');
  await openMap();
  const mainLabels=await page.locator('.rio-atlas-label-street text,.rio-atlas-label-highway text').allTextContents();
  assert.deepEqual(mainLabels,['Av. Bady Bassitt','Av. Alberto Andaló','Av. Murchid Homsi','SP-310','BR-153']);
  assert.equal(await page.locator('[data-rio-directory]').evaluate(el=>el.open),false);
  assert.equal(await page.locator('[data-rio-reference] button').count(),6);
  assert(await page.locator('[data-rio-destination]').count()>=35);

  for(const [name,width,height] of [['retrato',393,852],['paisagem',852,393],['desktop',1280,800]]){
    await page.setViewportSize({width,height});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const layout=await page.locator('.rio-map-panel').evaluate(panel=>{
      const body=panel.closest('.modal-body');
      body.scrollTop=0;
      const svg=panel.querySelector('.rio-real-map');
      const box=svg.getBoundingClientRect();
      const labels=[...svg.querySelectorAll('.rio-atlas-label text')].map(text=>text.getBoundingClientRect());
      const clipped=labels.filter(label=>label.left<box.left||label.right>box.right||label.top<box.top||label.bottom>box.bottom).length;
      const bodyBox=body.getBoundingClientRect();
      return {width:box.width,height:box.height,clipped,overflow:body.scrollWidth-body.clientWidth,
        visible:box.top>=bodyBox.top-1&&box.bottom<=bodyBox.bottom+1};
    });
    assert(layout.width>=245&&layout.height>=200,JSON.stringify(layout));
    assert.equal(layout.clipped,0);
    assert(layout.overflow<=1,JSON.stringify(layout));
    assert(layout.visible,JSON.stringify(layout));
    report.layouts.push({name,width,height,...layout});
    await page.screenshot({path:out+'/mapa-'+name+'.png'});
  }
  await page.setViewportSize({width:393,height:852});

  await page.locator('[data-rio-local]').tap();
  await page.getByRole('heading',{name:'Ruas próximas'}).waitFor();
  assert.equal(await page.locator('.rio-map-scale text').textContent(),'250 m');
  const localLabels=await page.locator('.rio-atlas-label text').allTextContents();
  assert(localLabels.some(name=>name.includes('Godoy')),JSON.stringify(localLabels));
  await page.screenshot({path:out+'/ruas-proximas.png'});
  await page.locator('[data-rio-local]').tap();

  await search.fill('sp 310');
  await page.locator('[data-rio-results]').getByRole('button',{name:/Washington Luís/}).tap();
  await page.getByText('Entre em um veículo para traçar uma rota na rodovia.').waitFor();
  assert(await page.locator('[data-rio-go]').isDisabled());
  assert.equal(await page.locator('.rio-map-line-selection').count(),1);

  await search.fill('rua antonio de godoy');
  await page.locator('[data-rio-results]').getByRole('button',{name:'Rua Antônio de Godoy',exact:true}).tap();
  await page.getByRole('button',{name:'Traçar rota',exact:true}).tap();
  const route=await page.evaluate(()=>OTTHOS_TEST_API.navigation());
  assert.equal(route.waypoint.name,'Rua Antônio de Godoy');
  assert(route.route.length>1);
  report.street={waypoint:route.waypoint,points:route.route.length,metres:route.progress.remaining};

  await page.reload({waitUntil:'domcontentloaded'});
  await waitVersion();
  await page.locator('#continueBtn').tap();
  await waitRunning('rio-preto');
  assert.equal(await page.evaluate(()=>OTTHOS_TEST_API.navigation().waypoint?.name),route.waypoint.name);
  await openMap();
  assert.equal(await page.locator('.rio-map-line-route').count(),1);
  await page.locator('[data-rio-reference]').getByRole('button',{name:/Ottovias/}).tap();
  await page.screenshot({path:out+'/ottovias.png'});
  await page.getByRole('button',{name:'Abrir rota na Vila OT'}).tap();
  await page.waitForURL(url=>url.origin===base.origin&&url.searchParams.get('map')==='ot');
  await waitVersion();
  await waitRunning('ot');
  const vila=await page.evaluate(()=>OTTHOS_TEST_API.navigation());
  assert.equal(vila.waypoint?.id,'ottovias-entry');
  assert(vila.route.length>1);
  assert(!new URL(page.url()).searchParams.has('destino'));
  report.ottovias={waypoint:vila.waypoint.id,points:vila.route.length,url:page.url()};
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('otthos_life_world_roleplay_v700')));
  assert.equal(saved.profile.coins,4300);
  assert(saved.vehicles.owned.includes('garage-orange'));
  assert.deepEqual(report.errors,[]);
  report.passed=true;
  console.log('PASS Rio street names, mobile and desktop map, street GPS after reload and same-preview Ottovias route');
}catch(error){report.failure=error.stack;throw error;}
finally{
  writeFileSync(out+'/result.json',JSON.stringify(report,null,2));
  await browser.close();await server?.close();
}

/* The ordinary Rio entry, pointer input, doorway and dock. No game-engine hooks,
   teleportation, forced clicks, accelerated clocks or production accounts. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {browserContextNetwork,browserNetwork} from './helpers/browser-network.mjs';
import {touchSession} from './helpers/touch-session.mjs';

const out=process.env.OT_RIO_INPUT_OUT||'test-results/rio-map-input';
const configured=process.env.OT_RIO_INPUT_BASE;
const server=configured?null:await multiplayerServer();
const base=new URL(configured||server.origin);
const release=JSON.parse(fs.readFileSync('games/otthi/release-manifest.json','utf8'));
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...browserNetwork(base.href),headless:true,args:['--no-sandbox',
  '--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={build:release.build,revision:release.revision,origin:base.origin,browser:browser.version(),errors:[]};
try{
  const context=await browser.newContext({...browserContextNetwork(base.href),serviceWorkers:'block',
    viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===base.origin?r.continue():r.abort());
  await context.addInitScript(()=>{
    const key='otthos_life_world_roleplay_v700';
    if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:705,
      profile:{name:'Passeio na Represa',playerId:'rio-native-input',nameConfirmed:true,coins:4000},
      settings:{quality:'low',sound:false,worldHud:'clean'},avatar:{bodyStyle:'family-thiago'},
      flags:{accountPromptedV635:true},guardian:{sessionLimitMinutes:0},vehicles:{owned:['garage-orange']}}));
  });
  const page=await context.newPage();page.setDefaultTimeout(35000);
  page.on('pageerror',error=>report.errors.push(error.stack));
  const fingers=await touchSession(context,page);
  const look=()=>page.evaluate(()=>({player:OTTHOS_TEST_API.getGame().player,context:OTTHOS_TEST_API.getContext(),
    camera:OTTHOS_TEST_API.camera(),map:document.body.dataset.otthiMap}));
  const goto=async entrance=>{
    await page.goto(new URL('games/otthi/?entrada='+entrance,base).href,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(expected=>window.OTTHI_RELEASE_COHERENT&&window.OTTHI_RELEASE_REVISION===expected,release.revision);
    await page.locator('#rioPretoPlayBtn').tap();
    await page.waitForFunction(()=>OTTHOS_TEST_API.getGame().running&&document.getElementById('modal').hidden,null,{timeout:55000});
    const state=await look();
    assert.equal(state.map,'rio-preto');
    assert.equal(new URL(page.url()).searchParams.get('map'),'rio-preto');
    return state;
  };

  const land=await goto('represa-cais');
  assert.equal(land.context?.id,'rio-represa-cais');
  await page.locator('#actionBtn').tap();
  assert.equal(await page.locator('[data-rio-dock-boat]').count(),4);
  await page.screenshot({path:out+'/cais-escolha.png'});
  await page.locator('[data-rio-dock-boat="rio-prancha"]').tap();
  await page.waitForFunction(()=>OTTHOS_TEST_API.getGame().player.boating,null,{timeout:36000});
  const aboard=await look();
  assert(Math.hypot(land.player.x-aboard.player.x,land.player.z-aboard.player.z)>9.5);
  assert.equal(await page.locator('#runBtn span').textContent(),'Remar');
  const run=await fingers.start(page.locator('#runBtn'));
  await page.waitForFunction(({x,z})=>{const q=OTTHOS_TEST_API.getGame().player;return Math.hypot(q.x-x,q.z-z)>4;},aboard.player,{timeout:18000});
  await fingers.end(run);
  const moving=await look();
  assert(moving.player.boating);
  report.dock={position:{x:land.player.x,z:land.player.z},aboard:{x:aboard.player.x,z:aboard.player.z},
    paddled:Math.hypot(moving.player.x-aboard.player.x,moving.player.z-aboard.player.z)};
  await page.screenshot({path:out+'/prancha-controle.png'});

  const restaurant=await goto('canecao_represa');
  const visit=await page.evaluate(async()=>{
    const response=await fetch('./assets/world/rio-preto-map.json');
    return (await response.json()).sites.find(place=>place.key==='canecao_represa');
  });
  const pad=page.locator('#joystick');
  const dx=visit.entry[0]-restaurant.player.x,dz=visit.entry[1]-restaurant.player.z,yaw=restaurant.camera.yaw;
  const distance=Math.hypot(dx,dz),right=(dx*Math.cos(yaw)+dz*Math.sin(yaw))/distance,
    forward=(dx*Math.sin(yaw)-dz*Math.cos(yaw))/distance;
  const walk=await fingers.start(pad,.5+right*.19,.5-forward*.19);
  await page.waitForFunction(()=>OTTHOS_TEST_API.getContext()?.id==='regional-canecao_represa-entrance',null,{timeout:14000});
  await fingers.end(walk);
  await page.locator('#actionBtn').tap();
  await page.waitForFunction(()=>OT_CHARACTER_ACTIVITIES.diagnostics().session?.kind==='rio-entry');
  await page.waitForFunction(()=>!OT_CHARACTER_ACTIVITIES.diagnostics().session,null,{timeout:18000});
  const inside=await look(),c=Math.cos(visit.yaw),s=Math.sin(visit.yaw);
  const localX=(inside.player.x-visit.x)*c-(inside.player.z-visit.z)*s;
  const localZ=(inside.player.x-visit.x)*s+(inside.player.z-visit.z)*c;
  assert(Math.abs(localX)<visit.w/2-.5&&Math.abs(localZ)<visit.d/2-.5);
  report.door={initial:{x:restaurant.player.x,z:restaurant.player.z},localX,localZ};
  await page.screenshot({path:out+'/canecao-entrada.png'});
  await page.locator('#quickToggleBtn').tap();
  await page.locator('[data-rio-panel-console]').tap();
  await page.waitForURL('**/arcade/');
  assert.equal(new URL(page.url()).origin,base.origin);
  report.console=page.url();assert.deepEqual(report.errors,[]);report.passed=true;
  console.log('PASS native touch, dock boarding and paddling, real Canecão doorway, same-origin console');
}catch(error){report.failure=error.stack;throw error;}
finally{
  fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));
  await browser.close();await server?.close();
}

import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';

const out='test-results/rio-regional-interiors';
mkdirSync(out,{recursive:true});
const server=await multiplayerServer();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
let page;
const report={cases:[],errors:[]};
try{
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.abort());
  await context.addInitScript(()=>localStorage.setItem('otthos_life_world_roleplay_v700',
    JSON.stringify({version:705,profile:{name:'Auditoria prédios',nameConfirmed:true,coins:6000,playerId:'rio-mall-smoke'},
      settings:{quality:'low',sound:false,lastWorldMap:'rio-preto'},flags:{accountPromptedV635:true},guardian:{sessionLimitMinutes:0}})));
  page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.stack));
  await page.goto(server.origin+'/games/otthi/?map=rio-preto');
  await page.locator('#playBtn').click();
  await page.waitForFunction(()=>OTTHOS_TEST_API?.getGame().running&&
    document.getElementById('modal').hidden&&OTTHI_RIO_V51?.diagnostics(),null,{timeout:90000});
  for(const [id,x,z] of [
    ['regional-shopping_cidade_norte',376,-320],
    ['regional-planalto_materiais',432,-321],
    ['regional-upa_norte',420,-341],
    ['regional-estacao_schmitt',735,-440]
  ]){
    await page.evaluate(([x,z])=>OTTHOS_TEST_API.teleport(x,z),[x,z]);
    await page.waitForFunction(id=>OTTHOS_TEST_API.getContext()?.id===id,id,{timeout:18000});
    await page.locator('#actionBtn').click();
    let entry;
    try{
      await page.waitForFunction(id=>OTTHI_RIO_V51.diagnostics().malls.some(m=>m.id===id&&m.inside),id,{timeout:8500});
      entry={id,entered:true};
    }catch(e){
      entry={id,entered:false,trace:await page.evaluate(()=>OTTHI_RIO_V51.diagnostics())};
      report.cases.push(entry);throw new Error('Real interior failed: '+JSON.stringify(entry));
    }
    const detail=await page.evaluate(()=>({player:OTTHOS_TEST_API.getGame().player,context:OTTHOS_TEST_API.getContext()}));
    entry.position={x:detail.player.x,z:detail.player.z};
    report.cases.push(entry);
    await page.screenshot({path:out+'/'+id+'.png'});
    // Clear the active room without manipulating code or disabling collisions.
    const exit=id+'-exit-regional-mall';
    const exitPos=await page.evaluate(id=>OTTHI_RIO_V51.diagnostics().malls.find(m=>m.id===id)?.exit,id);
    assert(exitPos,'real interior must have an exit door');
    await page.evaluate(p=>OTTHOS_TEST_API.teleport(p.x,p.z),exitPos);
    await page.waitForFunction(id=>OTTHOS_TEST_API.getContext()?.id===id,exit,{timeout:9000});
    await page.locator('#actionBtn').click();
    await page.waitForFunction(id=>!OTTHI_RIO_V51.diagnostics().malls.find(m=>m.id===id)?.inside,id,{timeout:9000});
  }
  assert.deepEqual(report.errors,[]);
  report.passed=true;
}finally{
  writeFileSync(out+'/result.json',JSON.stringify(report,null,2));
  await browser.close();await server.close();
}

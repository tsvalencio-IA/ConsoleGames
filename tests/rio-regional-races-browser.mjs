/* Kart Legends' real phase cards and controls, with explicit physics ticks. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';

const out=process.env.OT_RIO_RACES_OUT||'test-results/rio-kart-legends';
fs.mkdirSync(out,{recursive:true});
const release=JSON.parse(fs.readFileSync('games/otthi/release-manifest.json'));
const server=await multiplayerServer(),browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const report={build:release.build,revision:release.revision,browser:browser.version(),races:[],errors:[],
 limits:['Local Chromium, native Kart controls and game physics at fixed time steps. Rendering is paused during races. No physical Android or live account.']};
try{
 const c=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await c.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.abort());
 await c.addInitScript(()=>{Math.random=()=>.5;});
 const page=await c.newPage();page.on('pageerror',e=>report.errors.push(e.stack));
 const boot=async()=>{
  await page.goto(server.origin+'/games/kart/');
  await page.locator('[data-solo-start]').click();
  assert.equal(await page.locator('#phase-grid .mission-card').count(),6);
 };
 for(const [name,label] of [['mirassol','AUTÓDROMO DE MIRASSOL'],['cedral','CIRCUITO TÉCNICO DE CEDRAL']]){
  await boot();
  await page.locator('#phase-grid .mission-card').filter({hasText:label}).click();
  await page.locator('[data-mode="controls"]').click();
  await page.waitForFunction(()=>System.activeGame?.logic.state==='MODE_SELECT');
  const canvas=page.locator('#game-canvas');
  const tap=async pct=>{const r=await canvas.boundingBox();await page.touchscreen.tap(r.x+r.width*.5,r.y+r.height*pct);};
  await tap(.49);
  await page.waitForFunction(()=>System.activeGame?.logic.state==='LOBBY');
  await page.evaluate(()=>{
   const g=System.activeGame.logic,orig=g.startRace;
   g.startRace=function(...args){
    const result=orig.apply(this,args);
    cancelAnimationFrame(System.loopId);System.loopId=null;System.loopEpoch++;
    return result;
   };
   window.__KART_REGIONAL_QA={ticks:0,held:{},sectors:new Set(),maxOffset:0};
  });
  await tap(.92);
  await page.waitForFunction(()=>System.activeGame?.logic.state==='RACE');
  const before=await page.evaluate(()=>({coins:Profile.coins,garage:structuredClone(Profile.kartSave.garage),
   sectors:System.activeGame.logic.trackSectors,rivals:System.activeGame.logic.localBots.length}));
  assert.equal(before.sectors.length,4);assert.equal(before.rivals,4);
  await page.locator('.kart-input [data-control="go"]').dispatchEvent('pointerdown',{pointerId:71});
  let finish;
  for(let batch=0;batch<140;batch++){
   finish=await page.evaluate(()=>{
    const g=System.activeGame.logic,q=__KART_REGIONAL_QA;
    function set(name,on){
     if(q.held[name]===on)return;q.held[name]=on;
     document.querySelector('.kart-input [data-control="'+name+'"]').dispatchEvent(new PointerEvent(on?'pointerdown':'pointerup',{pointerId:name==='left'?72:73,bubbles:true}));
    }
    for(let i=0;i<150&&g.status==='RACING';i++){
     // Use the public buttons to hold a line near the middle of the asphalt.
     const target=.19*Math.sin(q.ticks/150);
     set('left',g.playerX>target+.035);set('right',g.playerX<target-.035);
     g.updatePhysics(System.canvas.width,System.canvas.height,null);
     q.sectors.add(g.lap+':'+g.trackSectors.findLastIndex(s=>s.start<=g.pos));q.ticks++;
     q.maxOffset=Math.max(q.maxOffset,Math.abs(g.playerX));
    }
    g.checkRaceStatus();
    return {status:g.status,phase:g.currentFase.id,laps:g.lapTimes,elapsed:g.raceElapsed,
     ticks:q.ticks,sectors:[...q.sectors],finished:g.player.finished,rank:g.finalRank,
     maxOffset:q.maxOffset,track:g.selectedTrack};
   });
   if(finish.status==='FINISHED')break;
  }
  assert.equal(finish.phase,'regional-'+name);
  assert(finish.finished,JSON.stringify(finish));
  assert.equal(finish.laps.length,3);
  assert(finish.ticks>1400&&finish.sectors.length>=12);
  await page.waitForFunction(()=>!document.getElementById('screen-over').classList.contains('hidden'));
  const result=await page.evaluate(()=>({coins:Profile.coins,xp:Profile.xp,save:structuredClone(Profile.kartSave)}));
  assert.equal(result.save.regionalRecords[name].runs,1);
  assert.deepEqual(result.save.garage,before.garage);
  for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1280,height:760}]){
   await page.setViewportSize(viewport);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  await page.screenshot({path:out+'/'+name+'.png'});
  report.races.push({name,before,finish,result});
 }
 await boot();
 report.reloaded=await page.evaluate(()=>structuredClone(Profile.kartSave));
 assert.equal(report.reloaded.regionalRecords.mirassol.runs,1);
 assert.equal(report.reloaded.regionalRecords.cedral.runs,1);
 assert.deepEqual(report.errors,[]);
 report.passed=true;console.log('PASS native Kart Legends, six full laps across two tracks, four rivals each, records after reload');
}catch(error){report.failure=error.stack;throw error;}
finally{fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));await browser.close();await server.close();}

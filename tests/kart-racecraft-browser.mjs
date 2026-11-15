/* Complete native Kart race and native input/result flow over disposable local
 * practice state. Physics time is advanced explicitly; this is not phone FPS. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
const out='test-results/kart-racecraft';fs.mkdirSync(out,{recursive:true});
const server=await multiplayerServer(),browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const report={cases:[],limits:['Chromium native menus, controls, physics, four AI rivals, items and result/reward flow. Fresh local practice; no live account or database writes.','The renderer is stopped between explicit native physics batches. Simulated race time is accelerated; this is not native RAF performance or physical camera/gameplay approval.']};let page;
try{
 const c=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await c.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.abort());
 await c.addInitScript(()=>{Math.random=()=>.5;window.__cameraRequests=0;Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>{window.__cameraRequests++;throw Error('No camera in local functional race');}}});});
 page=await c.newPage();page.setDefaultTimeout(45000);const errors=[];page.on('pageerror',e=>errors.push(e.stack));
 await page.goto(server.origin+'/games/kart/?kart_eval=disputa');await page.locator('[data-solo-start]').click();
 await page.locator('#phase-grid .mission-card:not(.locked)').first().click();await page.locator('[data-mode="controls"]').click();
 await page.waitForFunction(()=>System.activeGame?.id==='drive'&&System.activeGame.logic.state==='MODE_SELECT');
 const canvas=page.locator('#game-canvas'),box=await canvas.boundingBox();
 await page.mouse.click(box.x+box.width*.5,box.y+box.height*.48);await page.waitForFunction(()=>System.activeGame.logic.state==='LOBBY');
 await page.mouse.click(box.x+box.width*.5,box.y+box.height*.92);await page.waitForFunction(()=>System.activeGame.logic.state==='RACE');
 const initial=await page.evaluate(()=>{
  const g=System.activeGame.logic;cancelAnimationFrame(System.loopId);System.loopId=null;System.loopEpoch++;
  window.__RACE_QA={g,ticks:0,maxOffset:0,side:1,held:{},itemUses:0,rewardCalls:0,heldRelease:null};
  const reward=Profile.addReward;Profile.addReward=function(...args){__RACE_QA.rewardCalls++;return reward.apply(this,args);};
  return{practice:ConsolePractice.active,trial:KartRacecraftEvaluation.snapshot(g),rivals:g.localBots.map(r=>({id:r.id,pos:r.pos})),phase:g.currentFase.id,coins:Profile.coins,xp:Profile.xp};
 });
 assert(initial.practice);assert(initial.trial);assert.equal(initial.rivals.length,4);assert(initial.rivals.every(r=>r.pos>0));assert.equal(initial.phase,'f1');
 // Start with the actual held accelerator. Each correction below dispatches
 // the same native pointer events used by a player; no movement fields change.
 await page.locator('.kart-input [data-control="go"]').dispatchEvent('pointerdown',{pointerId:71});
 for(let batch=0;batch<100;batch++){
  const sample=await page.evaluate(()=>{
   const q=__RACE_QA,g=q.g,button=id=>document.querySelector('.kart-input [data-control="'+id+'"]');
   const set=(id,on)=>{if(q.held[id]===on)return;q.held[id]=on;button(id).dispatchEvent(new PointerEvent(on?'pointerdown':'pointerup',{pointerId:{left:72,right:73,drift:74,item:75}[id],bubbles:true}));};
   for(let i=0;i<200&&g.status==='RACING';i++){
    const drift=q.ticks>=600&&q.ticks<680;
    if(drift){if(g.playerX>.5)q.side=-1;if(g.playerX<-.5)q.side=1;set('left',q.side<0);set('right',q.side>0);}
    else{const target=.22*Math.sin(q.ticks/110);set('left',g.playerX>target+.035);set('right',g.playerX<target-.035);}
    set('drift',drift);
    if(g.item){set('item',true);set('item',false);}
    const itemBefore=g.item;g.updatePhysics(System.canvas.width,System.canvas.height,null);if(itemBefore&&g.item===null&&g.itemCooldown>0)q.itemUses++;q.ticks++;q.maxOffset=Math.max(q.maxOffset,Math.abs(g.playerX));
   }
   g.checkRaceStatus();return{status:g.status,ticks:q.ticks,lap:g.lap,trial:KartRacecraftEvaluation.snapshot(g)};
  });
  if(sample.status==='FINISHED')break;
 }
 const finish=await page.evaluate(()=>{const q=__RACE_QA,g=q.g;return{status:g.status,physicalFinish:g.player.finished,ticks:q.ticks,maxOffset:q.maxOffset,lapTimes:g.lapTimes,rank:g.finalRank,trial:KartRacecraftEvaluation.snapshot(g),itemUses:q.itemUses,rivals:g.localBots.map(r=>({id:r.id,pos:r.pos,lap:r.lap,status:r.status})),cameraRequests:__cameraRequests};});
 assert.equal(finish.status,'FINISHED');assert(finish.physicalFinish);assert.equal(finish.lapTimes.length,3);assert(finish.ticks>5000);assert(finish.maxOffset<1.3);assert(finish.trial.completed,JSON.stringify(finish.trial));assert(finish.itemUses>0);assert.equal(finish.trial.contacts,0);assert.equal(finish.cameraRequests,0);
 await page.waitForFunction(()=>!document.getElementById('screen-over').classList.contains('hidden'));
 assert(await page.locator('#kart-racecraft-result').isVisible());assert(await page.locator('#kart-racecraft-result').innerText().then(t=>t.includes('DESAFIO DE DISPUTA CONCLUÍDO')));
 const result=await page.evaluate(()=>({rewardCalls:__RACE_QA.rewardCalls,coins:Profile.coins,xp:Profile.xp,save:JSON.parse(localStorage.getItem('thia:solo:v1:drive')),resultText:document.getElementById('kart-racecraft-result').innerText,width:document.documentElement.scrollWidth,viewport:innerWidth}));
 assert.equal(result.rewardCalls,1,'native race awards its original reward once; evaluation goals have no extra payout');assert.equal(result.save.coins,result.coins);assert.equal(result.save.xp,result.xp);assert(result.width<=result.viewport+1);
 await page.screenshot({path:out+'/complete-native-race.png',timeout:60000});
 for(const viewport of[{width:390,height:844},{width:360,height:740}]){await page.setViewportSize(viewport);assert(await page.locator('#kart-racecraft-result').isVisible());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 await page.reload();await page.locator('[data-solo-start]').click();const saved=await page.evaluate(()=>({coins:Profile.coins,xp:Profile.xp}));assert.equal(saved.coins,result.coins);assert.equal(saved.xp,result.xp);
 assert.deepEqual(errors,[]);report.cases.push({initial,finish,result,saved,errors});report.passed=true;fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));console.log('PASS native chase race:3laps,2cleanpasses,drift,item,one native reward and saved local progress');
}catch(error){report.error=error.stack;report.state=await page?.evaluate(()=>({trial:window.KartRacecraftEvaluation?.snapshot(window.__RACE_QA?.g),game:window.__RACE_QA?.g?{state:__RACE_QA.g.state,status:__RACE_QA.g.status,lap:__RACE_QA.g.lap,pos:__RACE_QA.g.pos,speed:__RACE_QA.g.speed,ticks:__RACE_QA.ticks,held:__RACE_QA.held}:null})).catch(()=>null);fs.writeFileSync(out+'/failure.json',JSON.stringify(report,null,2));throw error;}finally{await browser.close();await server.close();}

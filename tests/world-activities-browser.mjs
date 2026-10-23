import {browserNetwork,browserContextNetwork} from './helpers/browser-network.mjs';
/* Local saved-position fixtures select a scenario. Play and scoring use real UI inputs. */
import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';import {touchSession} from './helpers/touch-session.mjs';
const BASE=process.env.WORLD_QA_URL||'http://127.0.0.1:4173/games/otthi/';const ORIGIN=new URL(BASE).origin;fs.mkdirSync('test-results/world-activities',{recursive:true});
const browser=await chromium.launch({...browserNetwork(BASE),headless:true,args:[...(browserNetwork(BASE).proxy?['--ignore-certificate-errors']:[]),'--enable-features=SyntheticPointerActions','--use-gl=angle','--use-angle=swiftshader','--no-sandbox','--disable-dev-shm-usage']});const errors=[];
async function scenario(position,portrait=false,desktop=false){
 const c=await browser.newContext({...browserContextNetwork(BASE),viewport:portrait?{width:390,height:844}:{width:844,height:390},isMobile:!desktop,hasTouch:!desktop});
 await c.addInitScript(p=>localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,position:{...p,y:0,yaw:0},profile:{name:'QA Atividades',nameConfirmed:true,playerId:'world-activities'},flags:{accountPromptedV635:true},settings:{quality:'low'},guardian:{sessionLimitMinutes:0},multiplayer:{room:'bairro-central'},familyAdventure:{party:{controller:'thiago',members:['thiago','luna','liz']},deliveries:{luna:0,liz:0},flags:{}}})),position);
 await c.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===ORIGIN?r.continue():r.request().resourceType()==='script'?r.fulfill({status:200,contentType:'application/javascript',body:'/* local isolated external service */'}):r.abort('blockedbyclient'));
 const p=await c.newPage();p.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.stack)});await p.goto(BASE,{waitUntil:'domcontentloaded'});
 // Observe real draw calls; physics, input and visibility stay under game control.
 await p.evaluate(()=>{window.__worldQaAsphaltDraws=0;const before=THREE.InstancedMesh.prototype.onBeforeRender;THREE.InstancedMesh.prototype.onBeforeRender=function(...args){if(this.name==='OTTHI_KART_ASPHALT')window.__worldQaAsphaltDraws++;before?.apply(this,args);};});
 await p.locator('#playBtn').click();await p.waitForFunction(()=>window.OTTHI_EXPANSION?.diagnostics().assets.length===2,null,{timeout:90000});assert(Math.hypot((await p.evaluate(()=>window.OTTHOS_TEST_API.getGame().player.x))-position.x,(await p.evaluate(()=>window.OTTHOS_TEST_API.getGame().player.z))-position.z)<2,'saved scenario position must be restored');return {c,p};
}
try{
 if(!process.env.WORLD_ONLY_RACE){console.log('STARTING DANCE');
  if(!process.env.WORLD_SKIP_DANCE){const {c,p}=await scenario({x:-38,z:-50},true);await p.waitForFunction(()=>window.OTTHOS_TEST_API.getContext()?.id==='activity-venue-dance');{const t=await touchSession(c,p),finger=await t.start(p.locator('#actionBtn'));await t.end(finger);}await p.locator('[data-dance-level="0"]').waitFor();assert(await p.locator('[data-dance-level="1"]').isDisabled());await p.locator('[data-dance-level="0"]').click();
  await p.screenshot({path:'test-results/world-activities/dance-portrait.png'});let pressed=0,paused=false;const keys=['ArrowLeft','ArrowUp','ArrowDown','ArrowRight'];
  for(let step=0;step<4000;step++){
   const d=await p.evaluate(()=>window.OTTHI_VENUES.diagnostics().dance);if(d?.done)break;assert(d);const note=d.notes.find(n=>n.at>=d.time-.12);
   if(note&&d.time>=note.at-.035){await p.keyboard.press(keys[note.lane]);pressed++;}
   else await p.waitForTimeout(20);
   if(pressed===8&&!paused){await p.locator('[data-dance-pause]').click();const t=await p.evaluate(()=>window.OTTHI_VENUES.diagnostics().dance.time);await p.waitForTimeout(400);assert(Math.abs((await p.evaluate(()=>window.OTTHI_VENUES.diagnostics().dance.time))-t)<.03);await p.locator('[data-dance-pause]').click();paused=true;}
  }
  const d=await p.evaluate(()=>window.OTTHI_VENUES.diagnostics().dance);assert(d.done&&d.passed,JSON.stringify(d));assert(d.hits>=25);await p.screenshot({path:'test-results/world-activities/dance-result.png'});await p.locator('[data-dance-again]').click();assert(!await p.locator('[data-dance-level="1"]').isDisabled());await p.locator('[data-venue-close]').click();assert.equal(await p.evaluate(()=>window.OTTHOS_TEST_API.getGame().paused),false);assert(Math.hypot((await p.evaluate(()=>window.OTTHI_VENUES.diagnostics().position.x))+38,(await p.evaluate(()=>window.OTTHI_VENUES.diagnostics().position.z))+50)<1);console.log('DANCE UI PASS',JSON.stringify({hits:d.hits,total:d.total,accuracy:d.accuracy,pressed,pause:true}));await c.close();}
  for(const [id,pos,slug]of [['boxing',{x:46,z:-48},'boxe'],['pingpong',{x:48,z:10},'tenis']]){
   const {c,p}=await scenario(pos,false,true);await p.waitForFunction(id=>window.OTTHOS_TEST_API.getContext()?.id==='activity-venue-'+id,id);await p.screenshot({path:'test-results/world-activities/'+id+'-building.png'});{const t=await touchSession(c,p),finger=await t.start(p.locator('#actionBtn'));await t.end(finger);}const frame=p.frameLocator('#worldVenueDialog iframe');await frame.locator('#phase-screen:not(.hidden)').waitFor({timeout:10000}).catch(async()=>{await frame.locator('#channel-grid .channel').first().click();});await frame.locator('.mission-card:not(.locked)').first().click();await frame.locator('[data-mode="controls"]').click();await frame.locator('#game-ui .hud-score-box').waitFor();await p.screenshot({path:'test-results/world-activities/'+id+'-original-game.png'});
   if(slug==='tenis'&&process.env.WORLD_VENUE_RESULT){
    const before=await p.evaluate(()=>({coins:window.OTTHOS_TEST_API.getState().profile.coins,records:window.OTTHI_VENUES.diagnostics().records}));
    const t=await touchSession(c,p),held=await t.start(frame.locator('#game-canvas'),.02,.8),child=p.frames().find(f=>new URL(f.url()).pathname==='/games/tenis/');
    await child.waitForFunction(()=>window.System.activeGame.logic.state==='END',null,{timeout:180000});await t.end(held);
    const score=await child.evaluate(()=>window.System.activeGame.logic.score);
    await p.waitForFunction(count=>window.OTTHI_VENUES.diagnostics().records.pingpong?.played===count+1,before.records.pingpong?.played||0);
    assert.equal(await p.evaluate(()=>window.OTTHOS_TEST_API.getState().profile.coins),before.coins,'Venue results must not duplicate coins in the world');
    await p.screenshot({path:'test-results/world-activities/tennis-native-result.png'});console.log('NATIVE TENNIS RESULT PASS',JSON.stringify(score));
   }
   await p.locator('[data-venue-close]').click();const v=await p.evaluate(()=>window.OTTHI_VENUES.diagnostics());assert.equal(v.active,null);assert(Math.hypot(v.position.x-pos.x,v.position.z-pos.z)<1);console.log('ORIGINAL GAME VENUE PASS',slug);await c.close();
  }
 }
 if(!process.env.WORLD_SKIP_RACE){console.log('STARTING ORIGINAL KART AUTODROME');
  const {c,p}=await scenario({x:300,z:-212});
  await p.waitForFunction(()=>window.OTTHOS_TEST_API.getContext()?.id==='kart-race-aurora');
  const entry=await p.evaluate(()=>window.OTTHOS_TEST_API.getGame().player);
  {const t=await touchSession(c,p),finger=await t.start(p.locator('#actionBtn'));await t.end(finger);}
  await p.waitForURL(url=>url.pathname.endsWith('/games/kart/')&&url.searchParams.get('venuePage')==='1');
  await p.locator('#phase-screen:not(.hidden)').waitFor();await p.locator('#phase-grid .mission-card:not(.locked)').first().click();await p.locator('[data-mode="controls"]').click();
  await p.waitForFunction(()=>window.System?.activeGame?.id==='drive');
  const t=await touchSession(c,p);
  let phase=await p.evaluate(()=>window.System.activeGame.logic.state);
  if(phase==='MODE_SELECT'){const f=await t.start(p.locator('#game-canvas'),.5,.48);await t.end(f);}
  await p.waitForFunction(()=>window.System.activeGame.logic.state==='LOBBY');
  {const f=await t.start(p.locator('#game-canvas'),.5,.92);await t.end(f);}
  await p.waitForFunction(()=>window.System.activeGame.logic.state==='RACE',null,{timeout:40000});
  const before=await p.evaluate(()=>({pos:window.System.activeGame.logic.pos,speed:window.System.activeGame.logic.speed}));
  assert(before.speed<.1,'Kart must wait for acceleration');
  const f=await t.start(p.locator('.kart-input [data-control="go"]'));
  await p.waitForFunction(pos=>window.System.activeGame.logic.pos>pos+3,before.pos);await t.end(f);
  assert(await p.locator('.kart-input').isVisible());assert(await p.locator('#arcade-topline').isHidden());
  await p.screenshot({path:'test-results/world-activities/autodrome-original-kart.png'});
  await p.locator('[data-venue-return]').click();await p.waitForURL(url=>url.pathname.endsWith('/games/otthi/'));
  await p.waitForFunction(()=>window.OTTHOS_TEST_API.getGame().running&&!window.WorldVenueTrip.current(),null,{timeout:90000});
  const after=await p.evaluate(()=>window.OTTHOS_TEST_API.getGame().player);
  assert(Math.hypot(after.x-entry.x,after.z-entry.z)<1);
  console.log('ORIGINAL KART AUTODROME PASS: original engine, real touch accelerator, clean HUD and preserved return');await c.close();
 }
 assert.equal(errors.length,0,errors.join('\n'));fs.writeFileSync('test-results/world-activities/result.json',JSON.stringify({passed:true,errors},null,2));
}finally{await browser.close();}

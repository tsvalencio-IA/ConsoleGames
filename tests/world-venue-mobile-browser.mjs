/* Original activity engines, native touch, full-page mobile return and failed-frame recovery. */
import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';
import {touchSession} from './helpers/touch-session.mjs';import {browserNetwork,browserContextNetwork} from './helpers/browser-network.mjs';
const base=process.env.WORLD_QA_URL||'http://127.0.0.1:4173/games/otthi/',origin=new URL(base).origin;
const browser=await chromium.launch({...browserNetwork(base),headless:true,args:[...(browserNetwork(base).proxy?['--ignore-certificate-errors']:[]),'--enable-features=SyntheticPointerActions','--use-gl=angle','--use-angle=swiftshader','--no-sandbox','--disable-dev-shm-usage']});
fs.mkdirSync('test-results/venue-mobile',{recursive:true});const results=[];
try{
 for(const scenario of [{id:'pingpong',slug:'tenis',game:'tennis',position:{x:48,z:10},portrait:true},{id:'boxing',slug:'boxe',game:'box_pro',position:{x:46,z:-12},portrait:false},{id:'pingpong',slug:'tenis',game:'tennis',position:{x:48,z:10},desktop:true,failFrame:true}]){
  const label=scenario.desktop?'desktop-failed-frame':scenario.slug+'-'+(scenario.portrait?'portrait':'landscape');
  const context=await browser.newContext({...browserContextNetwork(base),serviceWorkers:scenario.failFrame?'block':'allow',viewport:scenario.desktop?{width:1024,height:768}:scenario.portrait?{width:393,height:852}:{width:852,height:393},deviceScaleFactor:scenario.desktop?1:3,isMobile:!scenario.desktop,hasTouch:!scenario.desktop});
  await context.addInitScript(({origin,position})=>{if(location.origin!==origin||sessionStorage.getItem('venue-qa-seeded'))return;sessionStorage.setItem('venue-qa-seeded','1');localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,position:{...position,y:0,yaw:0},profile:{name:'Thiago QA',nameConfirmed:true,playerId:'venue-mobile-qa',coins:4321,xp:1234},flags:{accountPromptedV635:true},settings:{quality:'low'},guardian:{sessionLimitMinutes:0},multiplayer:{room:'bairro-central'},familyAdventure:{party:{controller:'thiago',members:['thiago','luna','liz']},deliveries:{luna:0,liz:0},flags:{}}}));},{origin,position:scenario.position});
  let failedFrame=false;
  await context.route(/^https?:\/\//,r=>{const u=new URL(r.request().url());if(scenario.failFrame&&u.pathname.endsWith('/games/tenis/')&&u.searchParams.has('otVenue')&&r.request().isNavigationRequest()&&r.request().frame().parentFrame()){failedFrame=true;return r.abort('connectionfailed');}return u.origin===origin?r.continue():r.abort('blockedbyclient');});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const fingers=await touchSession(context,page);
  try{
   await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('#playBtn').click();await page.waitForFunction(id=>window.OTTHOS_TEST_API.getContext()?.id==='activity-venue-'+id,scenario.id,{timeout:90000});
   const before=await page.evaluate(()=>({profile:window.OTTHOS_TEST_API.getState().profile,party:window.OTTHOS_TEST_API.getState().familyAdventure.party,records:window.OTTHI_VENUES.diagnostics().records}));assert.equal(before.profile.coins,4321);
   const action=await fingers.start(page.locator('#actionBtn'));await fingers.end(action);
   await page.waitForURL(url=>url.pathname.endsWith('/games/'+scenario.slug+'/')&&url.searchParams.get('venuePage')==='1',{timeout:30000});
   await page.locator('#phase-screen:not(.hidden)').waitFor();assert.equal(await page.locator('iframe').count(),0);assert.equal(await page.evaluate(()=>typeof window.OTTHOS_TEST_API),'undefined');
   await page.locator('#phase-grid .mission-card:not(.locked)').first().click();await page.locator('[data-mode="controls"]').click();await page.waitForFunction(id=>window.System?.activeGame?.id===id,scenario.game);
   assert(!await page.locator('#auth-screen').isVisible());
   const header=await page.locator('#venue-trip-header').boundingBox(),canvas=await page.locator('#game-canvas').boundingBox();assert(canvas.y>=header.y+header.height-1,'return bar cannot cover the native game');
   if(scenario.game==='tennis'){
    const racket=await fingers.start(page.locator('#game-canvas'),.05,.8);await fingers.move(racket,page.locator('#game-canvas'),.2,.7);await fingers.end(racket);
    if(process.env.VENUE_COMPLETE_MATCH&&scenario.portrait){const held=await fingers.start(page.locator('#game-canvas'),.01,.8);await page.waitForFunction(()=>window.System.activeGame.logic.state==='END',null,{timeout:180000});await fingers.end(held);assert(await page.evaluate(()=>!!window.WorldVenueTrip.current().result));}
   }else{
    const c=await page.locator('#game-canvas').boundingBox();await page.mouse.click(c.x+c.width*.2,c.y+c.height*.9);await page.waitForFunction(()=>window.System.activeGame.logic.state==='FIGHT');
    await page.locator('[data-punch="l"]').waitFor({state:'visible'});const hp=await page.evaluate(()=>window.System.activeGame.logic.p2.hp),punch=await fingers.start(page.locator('[data-punch="l"]'));await page.waitForFunction(hp=>window.System.activeGame.logic.p2.hp<hp,hp);await fingers.end(punch);
   }
   await page.screenshot({path:'test-results/venue-mobile/'+label+'-playing.png'});
   if(scenario.game==='tennis'&&!scenario.desktop)await page.goBack({waitUntil:'domcontentloaded'});else await page.locator('[data-venue-return]').click();
   await page.waitForURL(url=>url.pathname.includes('/games/otthi/'));await page.waitForFunction(()=>window.OTTHI_VENUES?.diagnostics().ready&&window.OTTHOS_TEST_API.getGame().running,null,{timeout:90000});
   const after=await page.evaluate(()=>({profile:window.OTTHOS_TEST_API.getState().profile,party:window.OTTHOS_TEST_API.getState().familyAdventure.party,venue:window.OTTHI_VENUES.diagnostics(),trip:window.WorldVenueTrip.current()}));
   assert.equal(after.profile.coins,before.profile.coins);assert.equal(after.profile.xp,before.profile.xp);assert.deepEqual(after.party,before.party);assert.equal(after.venue.active,null);assert.equal(after.trip,null);assert(Math.hypot(after.venue.position.x-scenario.position.x,after.venue.position.z-scenario.position.z)<1);
   if(process.env.VENUE_COMPLETE_MATCH&&scenario.portrait)assert.equal(after.venue.records.pingpong.played,(before.records.pingpong?.played||0)+1);
   if(scenario.failFrame)assert(failedFrame);assert.deepEqual(errors,[]);await page.screenshot({path:'test-results/venue-mobile/'+label+'-returned.png'});
   results.push({label,passed:true,originalGame:scenario.game,failedFrameRecovered:!!scenario.failFrame,partyPreserved:true,balancePreserved:true,positionPreserved:true,errors});console.log('VENUE MOBILE PASS',label);await context.close();
  }catch(error){await page.screenshot({path:'test-results/venue-mobile/'+label+'-failure.png'}).catch(()=>{});console.error('VENUE DIAGNOSTIC',label,page.url(),await page.evaluate(()=>({body:document.body.innerText.slice(0,600),trip:window.WorldVenueTrip?.current(),game:window.System?.activeGame?.logic.state,diag:window.OTTHI_VENUES?.diagnostics()})).catch(()=>null));throw error;}
 }
 fs.writeFileSync('test-results/venue-mobile/result.json',JSON.stringify({passed:true,results},null,2));
}finally{await browser.close();}

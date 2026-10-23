/* Real navigation, original game entry, audio graph and world return. Remote
 * account services are isolated; no authentication or scores are fabricated. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {browserNetwork,browserContextNetwork} from './helpers/browser-network.mjs';
import {touchSession} from './helpers/touch-session.mjs';
const base=process.env.WORLD_QA_URL||'http://127.0.0.1:4173/games/otthi/';
const origin=new URL(base).origin,dir='test-results/gameplay-recovery';fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({...browserNetwork(base),headless:true,args:[...(browserNetwork(base).proxy?['--ignore-certificate-errors']:[]),'--enable-features=SyntheticPointerActions','--use-gl=angle','--use-angle=swiftshader','--no-sandbox','--disable-dev-shm-usage']});
const results=[];
async function context(position={x:-18,z:39}){
 const c=await browser.newContext({...browserContextNetwork(base),viewport:{width:852,height:393},isMobile:true,hasTouch:true});
 await c.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===origin?r.continue():r.abort('blockedbyclient'));
 await c.addInitScript(({origin,position})=>{
  if(location.origin!==origin)return;
  if(!localStorage.getItem('otthos_life_world_roleplay_v700'))localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,position:{...position,y:0,yaw:0},profile:{name:'Thiago QA',nameConfirmed:true,playerId:'recovery-world',coins:4321,xp:1234},flags:{accountPromptedV635:true},settings:{quality:'low'},guardian:{sessionLimitMinutes:0},familyAdventure:{party:{controller:'thiago',members:['thiago','luna','liz']}}}));
  // Observe actual native output nodes. This adds a monitor branch, without
  // generating a test tone or replacing the game's AudioContext/engines.
  const connect=AudioNode.prototype.connect,monitors=new Map();
  AudioNode.prototype.connect=function(destination,...args){
   const result=connect.call(this,destination,...args);
   if(destination===this.context.destination){let analyser=monitors.get(this.context);if(!analyser){analyser=this.context.createAnalyser();analyser.fftSize=256;monitors.set(this.context,analyser);}connect.call(this,analyser);}
   return result;
  };
  window.__audioRMS=()=>Math.max(0,...[...monitors.values()].map(a=>{const data=new Float32Array(a.fftSize);a.getFloatTimeDomainData(data);return Math.sqrt(data.reduce((s,n)=>s+n*n,0)/data.length);}));
 },{origin,position});
 return c;
}
async function enterOriginal(p,id){
 await p.locator('[data-solo-start]').click();await p.locator('#phase-screen:not(.hidden)').waitFor();
 await p.locator('#phase-grid .mission-card:not(.locked)').first().click();await p.locator('[data-mode="controls"]').click();
 await p.waitForFunction(id=>window.System?.activeGame?.id===id,id);
}
try{
 if(!process.env.RECOVERY_ONLY_TRIPS){const c=await context(),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.OTTHI_RELEASE_COHERENT);await p.locator('#playBtn').click();
  await p.waitForFunction(()=>window.OTTHI_EXPANSION?.diagnostics().ready,null,{timeout:90000});
  await p.locator('#quickToggleBtn').click();await p.locator('#worldConsoleLink').click();await p.waitForURL('**/arcade/');
  assert.equal(await p.locator('.game-card').count(),7);results.push({flow:'world-to-console',sevenOriginalGames:true});console.log('PASS world to console');
  for(const [slug,id]of [['kart','drive'],['boxe','box_pro'],['tenis','tennis'],['ar','ar_truck_sim'],['voo','usarmy_flight_sim']]){
   await p.locator('[data-game="'+slug+'"] [data-launch]').click();await enterOriginal(p,id);
   assert.equal(await p.evaluate(()=>window.GameAudio.diagnostics().state),'running');
   // The native Sfx API emits through the output graph that the game uses.
   const audio=await p.evaluate(async()=>{window.Sfx.click();let peak=0;for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,8));peak=Math.max(peak,window.__audioRMS());}return {peak,state:window.Sfx.ctx?.state,sameContext:window.Sfx.ctx===window.GameAudio.context()};});assert(audio.peak>.00005,JSON.stringify({slug,audio}));assert(audio.sameContext);
   const playerId=await p.evaluate(()=>window.System.playerId);
   await p.evaluate(()=>window.GameAudio.context().suspend());await p.locator('#play-settings-button').click();
   await p.waitForFunction(()=>window.GameAudio.diagnostics().state==='running');await p.locator('#play-settings [data-close]').first().click();
   if(slug==='ar'){
    const touch=await touchSession(c,p),shots=await p.evaluate(()=>window.System.activeGame.logic.stats.shots),finger=await touch.start(p.locator('[data-control="fire"]'));
    await p.waitForFunction(n=>window.System.activeGame.logic.stats.shots>n,shots);await touch.end(finger);
    assert.equal(await p.locator('[data-control="aim"]').count(),0);
    await p.screenshot({path:dir+'/war-original.png',scale:'css'});
    await p.reload({waitUntil:'domcontentloaded'});await enterOriginal(p,id);assert.equal(await p.evaluate(()=>window.System.playerId),playerId,'solo identity must survive reopening');
   }
   assert((await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=1);
   results.push({flow:'console-'+slug,originalEngine:id,audibleGraph:true,resumeAfterInterruption:true,stableSoloIdentity:slug==='ar'?true:undefined});
   console.log('PASS native entry/audio',slug);await p.locator('#arcade-pause').click();await p.locator('#arcade-pause-modal [data-action="career"]').click();assert(await p.locator('#arcade-pause-modal [data-career-panel]').isVisible());await p.locator('#arcade-pause-modal [data-action="exit"]').click();await p.waitForURL('**/arcade/');
  }
  await p.locator('[data-game="familia"] [data-launch]').click();await p.locator('#start').click();
  assert(await p.evaluate(()=>!!window.__THIA_TEST?.player));await p.locator('#menuBtn').click();await p.locator('.family-console-return').click();await p.waitForURL('**/arcade/');
  results.push({flow:'console-family',originalWorld:true});
  assert.deepEqual(errors,[]);await c.close();
 }catch(error){await p.screenshot({path:dir+'/failure.png',scale:'css'});throw error;}
 }
 for(const spec of [{id:'aurora',x:300,z:-212},{id:'costa',x:-300,z:-156}]){
  const c=await context(spec),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{
   await p.goto(base,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.OTTHI_RELEASE_COHERENT);await p.locator('#playBtn').click();
   await p.waitForFunction(id=>window.OTTHOS_TEST_API.getContext()?.id==='kart-race-'+id,spec.id,{timeout:90000});
   const entry=await p.evaluate(()=>window.OTTHOS_TEST_API.getGame().player);const touch=await touchSession(c,p),finger=await touch.start(p.locator('#actionBtn'));await touch.end(finger);
   await p.waitForURL(url=>url.pathname.endsWith('/games/kart/')&&url.searchParams.get('venuePage')==='1',{timeout:30000});
   await p.locator('#phase-screen:not(.hidden)').waitFor();await p.locator('#phase-grid .mission-card:not(.locked)').first().click();await p.locator('[data-mode="controls"]').click();
   await p.waitForFunction(()=>window.System?.activeGame?.id==='drive');assert.equal(await p.locator('iframe').count(),0);
   assert.equal(await p.evaluate(()=>window.WorldVenueTrip.current().id),'kart-'+spec.id);if(spec.id==='aurora'){await p.locator('[data-venue-account]').click();await p.locator('#auth-screen:not(.hidden)').waitFor();assert.equal(await p.evaluate(()=>window.ConsolePractice.active),false);await p.locator('[data-venue-account]').click();await p.locator('#phase-screen:not(.hidden)').waitFor();}
   await p.screenshot({path:dir+'/autodrome-'+spec.id+'.png',scale:'css'});
   await p.locator('[data-venue-return]').click();await p.waitForURL(url=>url.pathname.endsWith('/games/otthi/'));
   await p.waitForFunction(()=>window.OTTHOS_TEST_API.getGame().running&&!window.WorldVenueTrip.current(),null,{timeout:90000});
   const saved=await p.evaluate(()=>({state:window.OTTHOS_TEST_API.getState(),player:window.OTTHOS_TEST_API.getGame().player}));
   assert.equal(saved.state.profile.coins,4321);assert.equal(saved.state.profile.xp,1234);assert.deepEqual(saved.state.familyAdventure.party.members,['thiago','luna','liz']);
   assert(Math.hypot(saved.player.x-entry.x,saved.player.z-entry.z)<1,JSON.stringify({spec,entry,after:saved.player}));assert.deepEqual(errors,[]);
   results.push({flow:'autodrome-'+spec.id,originalKart:true,worldPositionAndFamilyPreserved:true});await c.close();
  }catch(error){await p.screenshot({path:dir+'/failure-'+spec.id+'.png',scale:'css'});console.error(await p.evaluate(()=>({context:window.OTTHOS_TEST_API?.getContext(),trip:window.WorldVenueTrip?.current(),url:location.href})));throw error;}
 }
 fs.writeFileSync(dir+'/result.json',JSON.stringify({passed:true,results},null,2));console.log('RECOVERY PASS',JSON.stringify(results));
}finally{await browser.close();}

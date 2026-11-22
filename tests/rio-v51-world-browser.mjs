/* Compiled World, native collision checks and movement; the harness places the initial approach. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {installCityInspection} from './helpers/world-city-inspection.mjs';
const out=process.env.OT_RIO_V51_OUT||'test-results/rio-v51-world';
fs.mkdirSync(out,{recursive:true});
const release=JSON.parse(fs.readFileSync('games/otthi/release-manifest.json'));
const source=fs.readFileSync('games/otthi/app.js','utf8'),end=source.lastIndexOf('})();');
const hook=`
 let rioRunWaypoint=1,rioRunDistance=0,rioRunPath=[];
 window.__RIO_V51_QA={
   places:()=>RIO_V51.places,
   course:()=>RIO_V51.course,
   at:(x,z)=>{OTTHOS_TEST_API.teleport(x,z);for(let n=0;n<15;n++){cityQaMs+=56;updateWorldExpansion();}updateContext(true);},
   bounds:()=>[...rioV51World.roots.values()].reduce((n,root)=>n+root.children.length,0),
   drive:(ticks)=>{
     cancelAnimationFrame(raf);
     for(let i=0;i<ticks&&activeRace?.type==='rio-street';i++){
       cityQaMs+=1000/60;
       const a=RIO_V51.course.route[rioRunWaypoint];
       const dx=a.x-player.x,dz=a.z-player.z,len=Math.hypot(dx,dz),before=activeRace.nextGate;
       if(len<.47&&rioRunWaypoint<RIO_V51.course.route.length-1)rioRunWaypoint++;
       const right=cameraRelativeVector(1,0,cameraYaw),forward=cameraRelativeVector(0,1,cameraYaw);
       input.virtualActive=true;input.virtualX=len>.04?(dx*right.x+dz*right.z)/len:0;
       input.virtualZ=len>.04?(dx*forward.x+dz*forward.z)/len:0;input.touchSprint=true;
       const x=player.x,z=player.z;
       beginWorldQueryFrame();try{updatePlayer(1/60);updateRace(1/60);}finally{endWorldQueryFrame();}
       rioRunDistance+=Math.hypot(player.x-x,player.z-z);
       if(activeRace?.nextGate!==before)rioRunPath.push(activeRace?.nextGate??6);
     }
     return {run:activeRace?{...activeRace}:null,x:player.x,z:player.z,waypoint:rioRunWaypoint,
       distance:rioRunDistance,passed:rioRunPath,record:rioStreetRecord(),onFoot:!player.vehicle&&!player.boating};
   },
   snapshot:()=>({stats:OTTHI_RIO_V51.diagnostics(),profile:state.profile,races:state.races,
     wardrobe:state.avatar.rioWardrobe,position:state.position}),
   save:()=>saveState(true)
 };
`;
const server=await multiplayerServer();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={build:release.build,revision:release.revision,browser:browser.version(),points:[],errors:[],
 limits:['Control batches walk with native input and collisions at fixed 60 Hz. The fixture places the initial approaches.','Software Chromium, disposable local saves. Frame rate and physical Android were not measured.']};
try{
 const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.abort());
 await context.addInitScript(()=>{
   const key='otthos_life_world_roleplay_v700';if(localStorage.getItem(key))return;
   localStorage.setItem(key,JSON.stringify({version:705,profile:{playerId:'rio-v51-qa',name:'Rio Preto QA',nameConfirmed:true,coins:1200,xp:240},
    settings:{quality:'low',sound:false,worldHud:'clean'},flags:{accountPromptedV635:true},guardian:{sessionLimitMinutes:0},
    races:{wins:4,regionalCircuits:{mirassol:{bestTime:92,runs:1}}},
    avatar:{bodyStyle:'family-thiago',rioWardrobe:{thiago:{top:'hoodie',hat:'headphones'}}}}));
 });
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.stack));
 await installCityInspection(page,{appSource:source.slice(0,end)+hook+source.slice(end),capDuringBoot:true});
 const boot=async()=>{
   await page.goto(server.origin+'/games/otthi/');
   await page.locator('#playBtn').tap();
   await page.waitForFunction(()=>window.__CITY_QA?.cap()&&OTTHI_RIO_V51.diagnostics().places===42&&OTTHI_VENUES.diagnostics().ready&&document.getElementById('modal').hidden,null,{timeout:170000});
   assert.equal(await page.locator('html').getAttribute('data-otthi-revision'),release.revision);
 };
 await boot();
 const places=await page.evaluate(()=>__RIO_V51_QA.places());
 assert.equal(places.length,42);
 await page.locator('#quickToggleBtn').tap();await page.locator('#worldCampaignBtn').tap();
 assert.equal(await page.locator('[data-rio-v51-route]').count(),42);
 const swift=page.locator('[data-rio-v51-route="regional-complexo_swift"]');
 await page.locator('[data-rio-v51-directory]>summary').tap();
 await swift.locator('xpath=ancestor::details[1]').locator('summary').tap();
 await swift.tap();
 await page.waitForFunction(()=>OTTHOS_TEST_API.getState().waypoint?.id==='regional-complexo_swift');
 report.gps=await page.evaluate(()=>OTTHOS_TEST_API.navigation());
 assert(report.gps.route.length>2);
 for(const p of places){
   await page.evaluate(({visitX,visitZ})=>__RIO_V51_QA.at(visitX,visitZ),p);
   const result=await page.evaluate(()=>({context:OTTHOS_TEST_API.getContext()?.id,ground:__CITY_QA.state().position,diag:OTTHI_RIO_V51.diagnostics()}));
   assert.equal(result.context,p.id,p.id);assert(result.diag.loaded.includes(p.sector));
   report.points.push({id:p.id,sector:p.sector,loaded:result.diag.loaded.length});
 }
 report.warmMeshes=await page.evaluate(()=>__RIO_V51_QA.bounds());
 for(const p of places.filter((_,i)=>i%4===0))await page.evaluate(({visitX,visitZ})=>__RIO_V51_QA.at(visitX,visitZ),p);
 assert.equal(await page.evaluate(()=>__RIO_V51_QA.bounds()),report.warmMeshes,'Repeated travel must reuse the same sector objects');
 const p=places.find(p=>p.key==='portaria_damha');
 await page.evaluate(({visitX,visitZ})=>__RIO_V51_QA.at(visitX,visitZ),p);
 await page.locator('#actionBtn').tap({force:true});
 await page.locator('[data-rio-run-start]').tap();
 await page.waitForFunction(()=>OTTHI_RIO_V51.diagnostics().course.active?.type==='rio-street');
 for(let n=0;n<40;n++){
   report.run=await page.evaluate(()=>__RIO_V51_QA.drive(110));
   if(!report.run.run)break;
 }
 assert.equal(report.run.run,null);
 assert.deepEqual(report.run.passed,[1,2,3,4,5,6],JSON.stringify(report.run));
 assert(report.run.distance>270&&report.run.onFoot);
 assert.equal(report.run.record.runs,1);
 await page.evaluate(()=>{__CITY_QA.view();__CITY_QA.renderNative();});
 await page.screenshot({path:out+'/represa.png'});
 await page.evaluate(()=>__RIO_V51_QA.save());await boot();
 report.reloaded=await page.evaluate(()=>__RIO_V51_QA.snapshot());
 assert.deepEqual(report.reloaded.stats.course.record,report.run.record);
 assert.equal(report.reloaded.races.wins,4);assert.equal(report.reloaded.races.regionalCircuits.mirassol.bestTime,92);
 assert.equal(report.reloaded.wardrobe.thiago.hat,'headphones');assert.equal(report.reloaded.wardrobe.thiago.top,'hoodie');
 assert.deepEqual(report.errors,[]);
 report.passed=true;console.log('PASS 42 native places, 11 streamed sectors, actual movement through six street checkpoints and saved record');
}catch(error){report.failure=error.stack;throw error;}
finally{fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));await browser.close();await server.close();}

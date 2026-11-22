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
   stations:key=>rioActivityRuntime.stations.get(key),
   advanceActivity:()=>{
     for(let n=0;n<80&&characterActivities.session;n++){
       cityQaMs+=1000/60;updateCharacterActivityMotion(1/60);
     }
     updateRioCityActivities();
     return {active:rioCurrentActivity(),completed:state.cityServices.rioCityCompleted,
       swiftLights:rioActivityRuntime.lights.get('complexo_swift')?.visible};
   },
   captureLife:()=>({
     ...OTTHI_RIO_CITY.diagnostics(),
     routes:[...rioLife.traffic.values()].flat().map(car=>car.route.every(({x,z})=>v704RoadAt(x,z,.3,false)))
   }),
   advanceLife:()=>{
     for(let n=0;n<75;n++){
       cityQaMs+=100;updateWorldResidents();updateRioCityLife();
       const old=captureTrafficPositions();updateOttoviasTraffic(.1);resolveTrafficOverlaps(old);
     }
     return window.__RIO_V51_QA.captureLife();
   },
   nativeFootball:()=>{
     const s=world.sportsV704,f=SPORTS_V705.football;
     return {pitch:[s.centerX,s.centerZ,s.fieldW,s.fieldD],scoreboard:s.scoreboard.userData.score,
       entranceClear:!positionBlockedForPlayer(50,69,.45,{ignoreTraffic:true}),
       stands:Object.entries(s.root.children.reduce((parts,mesh)=>({...parts,[mesh.name]:(parts[mesh.name]||0)+1}),{})).filter(([name])=>name.startsWith('TEIXEIRAO')),
       solo:f?.mode,teams:f&&[f.home.length+1,f.away.length],score:f?.score,finished:f?.finished,time:f?.time,
       boardTexture:s.scoreboard.material.map.uuid};
   },
   advanceFootball:(frames)=>{
     for(let n=0;n<frames&&!SPORTS_V705.football?.finished;n++){cityQaMs+=1000/60;updateFootballV704(1/60);}
     return window.__RIO_V51_QA.nativeFootball();
   },
   setFootballShot:()=>{
     const f=SPORTS_V705.football,x=f.cx+f.w/2-.35,z=f.cz+2.45;
     f.ball.position.set(x,.52,z);player.x=x-.65;player.z=z;player.facing=Math.PI/2;player.vx=player.vz=0;
   },
   showTeixeirao:()=>{
     camera.position.set(39,30,52);camera.lookAt(42,0,91);camera.fov=53;
     camera.updateProjectionMatrix();camera.updateMatrixWorld(true);__CITY_QA.renderNative();
   },
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
   arrival:()=>{
     const swift=RIO_V51.places.find(p=>p.key==='complexo_swift');
     const root=rioV51World.roots.get(swift.sector);
     camera.updateMatrixWorld(true);
     const sight=new THREE.Vector3(swift.x,groundHeightAt(swift.x,swift.z)+4,swift.z-swift.d/2).project(camera);
     return {x:player.x,z:player.z,secured:!!root?.visible,
       inView:Math.abs(sight.x)<1&&Math.abs(sight.y)<1&&Math.abs(sight.z)<1,
       feetClear:!positionBlockedForPlayer(player.x,player.z,.45,{ignoreTraffic:true,allowWater:false})};
   },
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
    position:{x:0,y:0,z:8,yaw:0},
    settings:{quality:'low',sound:false,worldHud:'clean'},flags:{accountPromptedV635:true},guardian:{sessionLimitMinutes:0},
    races:{wins:4,regionalCircuits:{mirassol:{bestTime:92,runs:1}}},
    avatar:{bodyStyle:'family-thiago',rioWardrobe:{thiago:{top:'hoodie',hat:'headphones'}}}}));
 });
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.stack));
 await installCityInspection(page,{appSource:source.slice(0,end)+hook+source.slice(end),capDuringBoot:true});
 const boot=async(button='#playBtn')=>{
   await page.goto(server.origin+'/games/otthi/');
   report.entryLayouts||=[];
   if(button==='#rioPretoPlayBtn'){
     for(const viewport of [{width:320,height:568},{width:393,height:852},{width:852,height:393},{width:1280,height:800}]){
       await page.setViewportSize(viewport);
       const layout=await page.locator(button).evaluate(el=>{
         const r=el.getBoundingClientRect(),at=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
         return {touchable:el===at||el.contains(at),overflow:document.documentElement.scrollWidth-innerWidth,
           rect:[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)],hit:at?.id||at?.className};
       });
       assert(layout.touchable&&layout.overflow<=1,JSON.stringify({viewport,layout}));
       report.entryLayouts.push({viewport,...layout});
     }
     await page.setViewportSize({width:393,height:852});
   }
   await page.locator(button).tap();
   await page.waitForFunction(()=>window.__CITY_QA?.cap()&&OTTHI_RIO_V51.diagnostics().places===42&&OTTHI_VENUES.diagnostics().ready&&document.getElementById('modal').hidden,null,{timeout:170000});
   assert.equal(await page.locator('html').getAttribute('data-otthi-revision'),release.revision);
 };
 await boot();
 const standard=await page.evaluate(()=>OTTHOS_TEST_API.getGame().player);
 assert(Math.hypot(standard.x,standard.z-8)<3,'The ordinary entry keeps the saved position');
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
   assert.equal(result.context,p.nativeVenue==='football'?'football-v705':p.id,p.id);
   if(!p.nativeVenue)assert(result.diag.loaded.includes(p.sector));
   report.points.push({id:p.id,sector:p.sector,loaded:result.diag.loaded.length});
 }
 report.warmMeshes=await page.evaluate(()=>__RIO_V51_QA.bounds());
 for(const p of places.filter((_,i)=>i%4===0))await page.evaluate(({visitX,visitZ})=>__RIO_V51_QA.at(visitX,visitZ),p);
 assert.equal(await page.evaluate(()=>__RIO_V51_QA.bounds()),report.warmMeshes,'Repeated travel must reuse the same sector objects');
 const swiftPlace=places.find(p=>p.key==='complexo_swift');
 const stage=await page.evaluate(()=>__RIO_V51_QA.stations('complexo_swift'));
 const goToSite=async (x,z)=>page.evaluate(({x,z})=>__RIO_V51_QA.at(x,z),{x,z});
 const xpBeforeSwift=await page.evaluate(()=>OTTHOS_TEST_API.getState().profile.xp);
 for(let round=0;round<2;round++){
   await goToSite(swiftPlace.visitX,swiftPlace.visitZ);
   await page.locator('#actionBtn').tap({force:true});
   await page.locator('[data-rio-work-start]').tap();
   for(const [i,point] of stage.entries()){
     await goToSite(point.x,point.z);
     assert.equal(await page.evaluate(()=>OTTHOS_TEST_API.getContext().id),'rio-work-complexo_swift-'+i);
     await page.locator('#actionBtn').tap({force:true});
     report.swift=await page.evaluate(()=>__RIO_V51_QA.advanceActivity());
     if(i===0)assert.equal(report.swift.active?.step,1);
   }
   assert(report.swift.swiftLights&&report.swift.completed.complexo_swift);
 }
 assert.equal(await page.evaluate(()=>OTTHOS_TEST_API.getState().profile.xp),xpBeforeSwift+18);
 for(const [x,z] of [[-86,-480],[415,-332],[0,8],[470,-565]]){
   await goToSite(x,z);await page.evaluate(()=>__RIO_V51_QA.advanceLife());
 }
 const movingBefore=await page.evaluate(()=>__RIO_V51_QA.captureLife());
 report.cityLife=await page.evaluate(()=>__RIO_V51_QA.advanceLife());
 const movement=(category,filter)=>report.cityLife[category].filter(filter).map(actor=>{
   const before=movingBefore[category].find(peer=>peer.id===actor.id);
   return before?Math.hypot(actor.x-before.x,actor.z-before.z):0;
 });
 assert(report.cityLife.people.length<=16&&report.cityLife.people.length>=13);
 assert.equal(report.cityLife.animals.length,9);
 assert.equal(report.cityLife.traffic.length,10);
 assert(report.cityLife.routes.every(Boolean));
 assert(movement('people',actor=>actor.action==='run').some(distance=>distance>2));
 assert(movement('animals',actor=>actor.visible).some(distance=>distance>1));
 assert(movement('traffic',actor=>actor.id.includes('represa')).some(distance=>distance>3));
 assert.equal(report.cityLife.people.length,movingBefore.people.length);
 assert.equal(report.cityLife.animals.length,movingBefore.animals.length);
 assert.equal(report.cityLife.traffic.length,movingBefore.traffic.length);
 const stadium=places.find(p=>p.nativeVenue==='football');
 await page.evaluate(({visitX,visitZ})=>__RIO_V51_QA.at(visitX,visitZ),stadium);
 await page.setViewportSize({width:852,height:480});
 await page.evaluate(()=>__RIO_V51_QA.showTeixeirao());
 await page.screenshot({path:out+'/teixeirao.png'});
 await page.setViewportSize({width:393,height:852});
 await page.locator('#actionBtn').tap({force:true});
 assert(await page.locator('#footballOnlineV705').isVisible());
 await page.locator('#footballSoloV705').tap();
 report.football=await page.evaluate(()=>__RIO_V51_QA.advanceFootball(200));
 assert(report.football.entranceClear&&report.football.stands.length>=2);
 assert.deepEqual(report.football.pitch,[42,88,42,18]);
 assert.deepEqual(report.football.teams,[4,4]);
 assert.equal(report.football.solo,'solo');
 await page.evaluate(()=>__RIO_V51_QA.setFootballShot());
 await page.locator('#actionBtn').tap({force:true});
 report.footballGoal=await page.evaluate(()=>__RIO_V51_QA.advanceFootball(15));
 assert.equal(report.footballGoal.score[0],1);
 assert.equal(report.footballGoal.scoreboard,'1 × 0');
 assert.equal(report.footballGoal.boardTexture,report.football.boardTexture);
 report.footballEnd=await page.evaluate(()=>__RIO_V51_QA.advanceFootball(9000));
 assert(report.footballEnd.finished);
 await page.locator('[data-sport-exit]').tap();
 assert.equal(await page.evaluate(()=>__RIO_V51_QA.nativeFootball().solo),undefined);
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
 await page.evaluate(()=>__RIO_V51_QA.save());await boot('#rioPretoPlayBtn');
 report.directArrival=await page.evaluate(()=>__RIO_V51_QA.arrival());
 assert(Math.hypot(report.directArrival.x-470,report.directArrival.z+566)<3,JSON.stringify(report.directArrival));
 assert(report.directArrival.secured&&report.directArrival.inView&&report.directArrival.feetClear,JSON.stringify(report.directArrival));
 await page.evaluate(()=>__CITY_QA.renderNative());
 await page.screenshot({path:out+'/chegada-swift.png'});
 report.reloaded=await page.evaluate(()=>__RIO_V51_QA.snapshot());
 assert.deepEqual(report.reloaded.stats.course.record,report.run.record);
 assert.equal(report.reloaded.races.wins,4);assert.equal(report.reloaded.races.regionalCircuits.mirassol.bestTime,92);
 assert.equal(report.reloaded.wardrobe.thiago.hat,'headphones');assert.equal(report.reloaded.wardrobe.thiago.top,'hoodie');
 assert(await page.evaluate(()=>OTTHOS_TEST_API.getState().cityServices.rioCityCompleted.complexo_swift));
 assert.deepEqual(report.errors,[]);
 report.passed=true;console.log('PASS Rio entry, 42 stops, native Teixeirão match, six street checkpoints and saved progress');
}catch(error){report.failure=error.stack;throw error;}
finally{fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));await browser.close();await server.close();}

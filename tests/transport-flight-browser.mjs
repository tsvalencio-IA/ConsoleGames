/* Native world controllers with inspection travel setup. Rendering is capped
 * during simulation on software WebGL; selected frames still use the real GPU API. */
import {chromium} from 'playwright';import fs from 'node:fs';import assert from 'node:assert/strict';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {installCityInspection} from './helpers/world-city-inspection.mjs';
const server=await multiplayerServer(),browser=await chromium.launch({executablePath:process.env.OT_BROWSER_BINARY||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const out='test-results/transport-flight';fs.mkdirSync(out,{recursive:true});const report={browser:browser.version(),flights:[],cable:[],errors:[]};let page;
const original=fs.readFileSync('games/otthi/app.js','utf8'),end=original.lastIndexOf('})();');
const hook=`
window.__TRANSPORT_QA={
 snapshot:()=>({near:camera.near,body:otGames.body&&{...otGames.body},ground:{x:player.x,z:player.z},riders:Object.values(familyWorld.actors).filter(a=>a.ridePose).map(a=>({id:a.id,visible:a.group.visible,position:a.group.position.toArray(),expected:[a.ridePose.x,a.ridePose.y,a.ridePose.z],error:a.group.position.distanceTo(new THREE.Vector3(a.ridePose.x,a.ridePose.y,a.ridePose.z))}))}),
 // Travel setup places the already boarded vehicle far beyond its launch point.
 // Both carry and visual transforms then run through the original world step.
 distant:()=>{const b=otGames.body;b.x=player.x+260;b.z=player.z+180;b.y=Math.max(130,groundHeightAt(b.x,b.z)+100);b.pitch=.10;b.roll=.12;b.vx=b.vy=b.vz=0;otGames.onGround=false;otGamesCamera(2);},
 watchBuffer:()=>{const events=[];const size=renderer.setDrawingBufferSize.bind(renderer),draw=renderer.render.bind(renderer);renderer.setDrawingBufferSize=(...args)=>{events.push({type:'buffer',args,frame:perf.renderedFrames});return size(...args)};renderer.render=(...args)=>{events.push({type:'render',frame:perf.renderedFrames});return draw(...args)};window.__transportBufferEvents=events;},
 buffers:()=>__transportBufferEvents.slice(),forceResize:()=>{for(let i=0;i<30;i++)resize(true);},
 location:id=>currentMapLocations().find(p=>p.id===id),
 cableClock:(index,station)=>{const now=airNow()/1000,p=((now+index*56)%112+112)%112,target=station==='top'?57:1;cityQaMs+=((target-p+112)%112)*1000;stepWorldSimulation(1/60);},
 advance:ms=>{cityQaMs+=ms;stepWorldSimulation(1/60)},
 pixels:()=>{__CITY_QA.renderNative();const gl=renderer.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,p=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,p);let min=765,max=0,light=0,hash=2166136261;for(let i=0;i<p.length;i+=4){const v=p[i]+p[i+1]+p[i+2];min=Math.min(min,v);max=Math.max(max,v);light+=v;hash=Math.imul(hash^p[i],16777619)>>>0;}return{w,h,min,max,mean:light/(w*h),hash,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}
};
`;
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
 await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.abort());
 await context.addInitScript(()=>localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,lastSaved:Date.now(),profile:{name:'Thiago Teste',nameConfirmed:true,playerId:'transport-native-local',coins:5000},avatar:{bodyStyle:'family-thiago'},flags:{accountPromptedV635:true},settings:{quality:'low',sound:true},guardian:{sessionLimitMinutes:0},familyAdventure:{party:{controller:'thiago',members:['thiago','thamis','luna','liz']}}})));
 page=await context.newPage();page.setDefaultTimeout(60000);page.on('pageerror',e=>{report.errors.push(e.stack);console.error('PAGE',e.stack)});
 await installCityInspection(page,{appSource:original.slice(0,end)+hook+original.slice(end),capDuringBoot:true});
 await page.goto(server.origin+'/games/otthi/');await page.locator('#playBtn').click();await page.waitForFunction(()=>window.__CITY_QA?.cap()&&window.OT_CIVIL_COMMUNITY?.diagnostics().ready&&window.OTTHI_FAMILY?.diagnostics().ready,null,{timeout:120000});
 await page.waitForFunction(()=>OTTHI_FAMILY.diagnostics().party.members.length===4);console.log('BOOT native world ready');
 const groundNear=await page.evaluate(()=>__TRANSPORT_QA.snapshot().near);
 for(const mode of (process.env.TRANSPORT_QA_ONLY_CABLE?[]:['helicopter','plane','balloon'])){
  const craft=await page.evaluate(mode=>OTTHI_CAMPAIGN.parked().find(p=>p.mode===mode),mode);assert(craft,mode+' physical boarding point');
  await page.evaluate(p=>OTTHOS_TEST_API.teleport(p.x+4,p.z),craft);
  await page.waitForFunction(()=>OTTHOS_TEST_API.getContext()?.id?.startsWith('board-aircraft-'));
  await page.locator('#actionBtn').tap({force:true});await page.waitForFunction(mode=>OT_GAMES.diagnostics().active&&OT_GAMES.diagnostics().mode===mode,mode);await page.waitForFunction(()=>OTTHI_FAMILY.diagnostics().seated.length===4);
  // The native power slider must lift a grounded helicopter before the travel setup.
  let takeoff=null;if(mode==='helicopter'){
   await page.locator('[data-ot="collective"]').tap({position:{x:15,y:8}});
   console.log('COLLECTIVE native lift');await page.evaluate(()=>__CITY_QA.simulate(240));
   takeoff=await page.evaluate(()=>OT_GAMES.diagnostics());assert(!takeoff.onGround&&takeoff.body.y>2,'native collective takeoff');
  }
  await page.evaluate(()=>__TRANSPORT_QA.distant());await page.evaluate(()=>__CITY_QA.simulate(18));
  const first=await page.evaluate(()=>__TRANSPORT_QA.snapshot());assert.equal(first.riders.length,4);assert(first.near>=1);
  for(const rider of first.riders){assert(rider.visible,mode+' hidden '+rider.id);assert(rider.error<1e-6,mode+' detached '+rider.id);assert(rider.position[1]>50,mode+' fell '+rider.id);}
  await page.evaluate(()=>__CITY_QA.simulate(18));const second=await page.evaluate(()=>__TRANSPORT_QA.snapshot());for(const rider of second.riders)assert(rider.error<1e-6&&rider.visible);
  if(mode==='helicopter'){
   await page.evaluate(()=>__TRANSPORT_QA.watchBuffer());await page.evaluate(()=>__TRANSPORT_QA.forceResize());await page.waitForTimeout(350);
   const repeated=await page.evaluate(()=>__TRANSPORT_QA.buffers());assert.equal(repeated.filter(e=>e.type==='buffer').length,0,'unchanged viewport cleared canvas');
   await page.setViewportSize({width:393,height:852});await page.waitForTimeout(450);
   await page.setViewportSize({width:844,height:390});await page.waitForTimeout(450);
   report.buffer=await page.evaluate(()=>__TRANSPORT_QA.buffers());const changes=report.buffer.filter(e=>e.type==='buffer');assert(changes.length>=2);
   for(let i=0;i<report.buffer.length;i++)if(report.buffer[i].type==='buffer'){const next=report.buffer[i+1];assert(next?.type==='render'&&next.frame===report.buffer[i].frame,'buffer cleared outside replacement frame');}
   const pixels=[];for(let i=0;i<3;i++){await page.evaluate(()=>__CITY_QA.simulate(4));pixels.push(await page.evaluate(()=>__TRANSPORT_QA.pixels()));}
   assert(pixels.every(p=>p.max-p.min>40&&p.calls>10&&p.triangles>100),'blank rendered flight');report.flightPixels=pixels;
   await page.screenshot({path:out+'/helicopter-flight.png'});await page.setViewportSize({width:390,height:844});
  }
  report.flights.push({mode,craft,first,second,takeoff});console.log('PASS native '+mode+' boarding and distant family transforms');
  await page.locator('[data-ot="peace"]').click();await page.waitForFunction(()=>!OT_GAMES.diagnostics().active);assert.equal(await page.evaluate(()=>__TRANSPORT_QA.snapshot().near),groundNear);
 }
 // Start at the exact coordinate advertised by the map, not a hidden trigger.
 for(const [from,to] of [['base','top'],['top','base']]){
  await page.evaluate(from=>__TRANSPORT_QA.cableClock(0,from),from);
  console.log('CABLE checking GPS',from);const point=await page.evaluate(from=>__TRANSPORT_QA.location('cable-'+from),from);assert(point);await page.evaluate(p=>OTTHOS_TEST_API.teleport(p.navX,p.navZ),point);
  await page.waitForFunction(from=>OTTHOS_TEST_API.getContext()?.id==='cable-board-'+from,from);
  console.log('CABLE embark context',from);await page.locator('#actionBtn').tap({force:true});await page.locator('[data-cable-wait]').click();await page.waitForFunction(()=>!!OT_CIVIL_COMMUNITY.diagnostics().cable.ride);
  console.log('CABLE boarded',from);assert.equal(await page.evaluate(()=>OT_CIVIL_COMMUNITY.diagnostics().cable.ride.count),4);
  await page.evaluate(()=>__TRANSPORT_QA.advance(21000));const middle=await page.evaluate(()=>({game:OTTHOS_TEST_API.getGame(),family:OTTHI_FAMILY.diagnostics(),cable:OT_CIVIL_COMMUNITY.diagnostics().cable}));assert(middle.game.player.y>1);assert.equal(middle.family.seated.length,4);assert(middle.family.seated.every(p=>p.visible&&p.position[1]>1));
  await page.evaluate(to=>__TRANSPORT_QA.cableClock(0,to),to);await page.locator('[data-cable-exit]').click();await page.waitForFunction(()=>!OT_CIVIL_COMMUNITY.diagnostics().cable.ride);
  report.cable.push({from,to,point,middle});console.log('PASS GPS cable boarding '+from+' to '+to+' with family');
 }
 assert.deepEqual(report.errors,[]);report.passed=true;report.limits=['Chromium with software WebGL and capped rendering during functional simulation. Distant aircraft placement and accelerated cable clock are inspection setup; boarding, power control, seats, ride controllers and captured frames are native. No physical Android testing.'];fs.writeFileSync(out+(process.env.TRANSPORT_QA_ONLY_CABLE?'/cable-result.json':'/result.json'),JSON.stringify(report,null,2));
}catch(error){report.failure=error.stack;if(page)report.last=await page.evaluate(()=>({game:window.OTTHOS_TEST_API?.getGame(),family:window.OTTHI_FAMILY?.diagnostics(),cable:window.OT_CIVIL_COMMUNITY?.diagnostics(),context:window.OTTHOS_TEST_API?.getContext(),flight:window.OT_GAMES?.diagnostics()})).catch(()=>null);fs.writeFileSync(out+'/failure.json',JSON.stringify(report,null,2));throw error;}finally{await browser.close();await server.close();}

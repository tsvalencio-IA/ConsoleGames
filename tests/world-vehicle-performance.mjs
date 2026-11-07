/* Vehicle entry and driving, with real recorded audio and isolated presence.
 * CPU simulation and native software WebGL are reported separately. */
import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {installWorldRtdbFixture} from './helpers/world-rtdb-browser-fixture.mjs';
import {installCityInspection} from './helpers/world-city-inspection.mjs';

const out='test-results/world-vehicle-performance';fs.mkdirSync(out,{recursive:true});
const server=await multiplayerServer(),browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const report={cases:[],limits:['Disposable synthetic profile and isolated HTTP realtime fixture.','CPU profiles cap software rendering; the native sample uses unchanged WebGL. Neither is a physical Android FPS or temperature measurement.']};
const names=['enterVehicle','applyVehicleAppearance','buildThemedVehicleGeometry','applyWorldVehiclePartsToGroup','brazilAttach','brazilAccessories','stepWorldSimulation','updatePlayer','updateVehiclePhysics','constrainVehicle','positionBlockedForPlayer','updateVehicleFX','updateEngineSound','updateMobilityControlLabels','updateRunUI','updateFamilyCarry','updateWorldExpansion','animateBrazilTransport','updateVisualLOD','updateContext','updateSharedWorldReplica','updateHUD'];
try{
 for(const [label,revision] of process.env.OT_VEHICLE_BASELINE?[['before',process.env.OT_VEHICLE_BASELINE],['after',null]]:[['after',null]]){
  const source=revision?execFileSync('git',['show',revision+':games/otthi/app.js'],{encoding:'utf8',maxBuffer:5e6}):fs.readFileSync('games/otthi/app.js','utf8'),end=source.lastIndexOf('})();');
  const hook=`
let vehicleQaStats={},vehicleQaWrites={},vehicleQaEntry=null;
const vehicleQaNow=()=>cityQaRealNow();
for(const name of ${JSON.stringify(names)}){try{const original=eval(name),wrapped=function(...args){const t=vehicleQaNow();try{return original.apply(this,args)}finally{const s=vehicleQaStats[name]??={calls:0,ms:0};s.calls++;s.ms+=vehicleQaNow()-t;if(name==='enterVehicle')vehicleQaEntry={ms:vehicleQaNow()-t};}};eval(name+'=wrapped');}catch{}}
const vehicleQaText=Object.getOwnPropertyDescriptor(Node.prototype,'textContent');
Object.defineProperty(Node.prototype,'textContent',{...vehicleQaText,set(value){const id=this.id||this.parentElement?.id;if(['runBtn','jumpBtn','actionBtn','vehicleBadge'].includes(id))vehicleQaWrites[id]=(vehicleQaWrites[id]||0)+1;vehicleQaText.set.call(this,value);}});
window.__VEHICLE_QA={
 prepare:()=>{const v=createToyCar(-12,64,{id:'qa-vehicle-saveiro',brazilModel:'saveiro',label:'Saveiro QA',theme:'lego',bodyType:'small',kind:'car'});OTTHOS_TEST_API.teleport(v.group.position.x+2.1,v.group.position.z);return{id:v.id,model:v.brazilModel};},
 profile:(frames=120)=>{vehicleQaStats={};vehicleQaWrites={};const t=vehicleQaNow();for(let i=0;i<frames;i++){cityQaMs+=1000/60;beginWorldQueryFrame();try{stepWorldSimulation(1/60);}finally{endWorldQueryFrame();}}return{frames,ms:vehicleQaNow()-t,stats:Object.entries(vehicleQaStats).sort((a,b)=>b[1].ms-a[1].ms),textWrites:{...vehicleQaWrites},vehicle:player.car.id,speed:player.car.speed,audio:GameAudio.diagnostics(),badge:els.vehicleBadge.textContent};},
 cap:()=>{renderer.render=()=>{};},
 live:()=>{vehicleQaStats={};vehicleQaWrites={};renderer.render=(...args)=>cityQaRender(...args);return vehicleQaNow();},
 read:()=>({entry:vehicleQaEntry,stats:Object.entries(vehicleQaStats).sort((a,b)=>b[1].ms-a[1].ms),textWrites:{...vehicleQaWrites},performance:OTTHOS_TEST_API.performance(),vehicle:player.car.id,speed:player.car.speed,audio:GameAudio.diagnostics(),badge:els.vehicleBadge.textContent,party:OTTHI_FAMILY.diagnostics().party}),
 gas:active=>{input.mobilityAccelerate=active;},
};
`;
  const context=await browser.newContext({viewport:{width:852,height:393},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.abort());await installWorldRtdbFixture(context);
  await context.addInitScript(()=>localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,profile:{name:'Veiculo QA',nameConfirmed:true,playerId:'vehicle-performance-local',coins:8000},avatar:{bodyStyle:'family-thiago'},flags:{accountPromptedV635:true},settings:{quality:'auto',sound:true},guardian:{sessionLimitMinutes:0},multiplayer:{enabled:true,room:'bairro-central'},familyAdventure:{party:{controller:'thiago',members:['thiago','luna','liz']}}})));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack));page.setDefaultTimeout(90000);await installCityInspection(page,{revision,appSource:source.slice(0,end)+hook+source.slice(end),capDuringBoot:true});await page.goto(server.origin+'/games/otthi/');await page.locator('#playBtn').click();await page.waitForFunction(()=>window.OTTHOS_TEST_API?.getGame().running&&!OTTHOS_TEST_API.getGame().paused&&document.getElementById('modal').hidden&&__CITY_QA.cap(),null,{timeout:120000});
  await page.evaluate(()=>OTTHOS_MULTIPLAYER.connect());await page.waitForFunction(()=>OTTHOS_RTDB.status().connected);
  const cdp=await context.newCDPSession(page);await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
  const target=await page.evaluate(()=>__VEHICLE_QA.prepare());await page.waitForFunction(id=>OTTHOS_TEST_API.getContext()?.id==='vehicle-'+id,target.id);
  const foot=await page.evaluate(()=>__VEHICLE_QA.profile());
  await page.evaluate(()=>__VEHICLE_QA.live());await page.waitForTimeout(5000);const footView=await page.evaluate(()=>({performance:OTTHOS_TEST_API.performance(),roots:__CITY_QA.drawProfile()}));await page.evaluate(()=>__VEHICLE_QA.cap());
  await page.locator('#actionBtn').tap();await page.waitForFunction(()=>OTTHOS_TEST_API.getGame().player.vehicle);await page.waitForFunction(()=>GameAudio.diagnostics().activeEngines===1&&GameAudio.diagnostics().decodedEngineFiles.length>0);
  const standing=await page.evaluate(()=>__VEHICLE_QA.profile());await page.evaluate(()=>__VEHICLE_QA.gas(true));const driving=await page.evaluate(()=>__VEHICLE_QA.profile());await page.evaluate(()=>__VEHICLE_QA.gas(false));
  const cpu=(await cdp.send('Profiler.stop')).profile;fs.writeFileSync(out+'/'+label+'.cpuprofile',JSON.stringify(cpu));
  const nodes=new Map(cpu.nodes.map(n=>[n.id,n])),times=new Map();cpu.samples.forEach((id,i)=>times.set(id,(times.get(id)||0)+(cpu.timeDeltas?.[i]||0)));const hotspots=[...times].sort((a,b)=>b[1]-a[1]).slice(0,30).map(([id,us])=>({us,...nodes.get(id).callFrame}));
  await page.evaluate(()=>__VEHICLE_QA.live());
  await page.evaluate(()=>__VEHICLE_QA.gas(true));await page.waitForTimeout(10000);await page.evaluate(()=>__VEHICLE_QA.gas(false));const live=await page.evaluate(()=>({...__VEHICLE_QA.read(),roots:__CITY_QA.drawProfile()}));
  assert.deepEqual(errors,[]);assert.equal(live.vehicle,target.id);assert.equal(live.audio.activeEngines,1);assert(live.audio.decodedEngineFiles.length>0);assert(live.performance.renderedFrames>0);await page.screenshot({path:out+'/'+label+'.png'});
  if(label==='after')for(const id of['runBtn','jumpBtn','actionBtn','vehicleBadge'])assert((standing.textWrites[id]||0)<6,'Stationary vehicle must not rewrite '+id+' every frame');
  const result={label,revision,target,foot,footView,standing,driving,live,hotspots,errors};report.cases.push(result);fs.writeFileSync(out+'/'+label+'.json',JSON.stringify(result,null,2));console.log('VEHICLE RESULT',label,JSON.stringify({entry:live.entry,footView,roots:live.roots,footMs:foot.ms,standingMs:standing.ms,drivingMs:driving.ms,standingWrites:standing.textWrites,drivingWrites:driving.textWrites,liveWrites:live.textWrites,hotspots:hotspots.slice(0,12),performance:live.performance}));await context.close();
 }
 report.passed=true;fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));
}catch(error){report.failure=error.stack;fs.writeFileSync(out+'/failure.json',JSON.stringify(report,null,2));throw error;}finally{await browser.close();await server.close();}

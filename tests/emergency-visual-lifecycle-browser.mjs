/* Repeated real emergency lifecycles with native Three.js/WebGL resources.
 * No production account or database; this is not a physical-device FPS test. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {installWorldRtdbFixture} from './helpers/world-rtdb-browser-fixture.mjs';
import {installCityInspection} from './helpers/world-city-inspection.mjs';

const out='docs/evidence/continuidade-20261111/emergency-lifecycle';
fs.mkdirSync(out,{recursive:true});
const revision='6258e611f8a426e9779299d900455079d03c6279';
const baseline=execFileSync('git',['show',revision+':games/otthi/app.js'],{encoding:'utf8',maxBuffer:6e6});
const module=fs.readFileSync('games/otthi/src/modules/16-emergency-services.js','utf8');
function functionSource(source,name){const start=source.indexOf('  function '+name+'(');assert(start>=0,name);const end=source.indexOf('\n  function ',start+3);return source.slice(start,end<0?undefined:end);}
let changed=baseline;
for(const name of ['resolveTrafficIncident','removeRoadsidePoliceOfficer'])changed=changed.replace(functionSource(changed,name),functionSource(module,name));
const hook=`
 window.__EMERGENCY_LIFECYCLE_QA=()=>{
  const wasPaused=paused;paused=true;
  const gpu=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});gpu.setSize(256,192);
  const draw=cityQaBootRenders.get(gpu)||gpu.render.bind(gpu),inspection=new THREE.Scene(),view=new THREE.PerspectiveCamera(50,256/192,.1,100);
  view.position.set(8,8,12);view.lookAt(0,.5,0);inspection.add(new THREE.AmbientLight(0xffffff,1));
  if(world.activeIncident)resolveTrafficIncident(world.activeIncident);
  const initial={outlines:world.outlines.length,actions:world.interactables.length,incidents:world.trafficIncidents.length};
  const originalSetTimeout=window.setTimeout,samples=[];let uniqueCreated=0,uniqueDisposed=0;
  try{
   for(let i=0;i<12;i++){
    const incident=createTrafficIncidentAt(0,0,'fire',[]),group=incident.group;
    group.traverse(o=>{if(['TorusGeometry','ConeGeometry'].includes(o.geometry?.type)){uniqueCreated++;o.geometry.addEventListener('dispose',()=>uniqueDisposed++);}});
    inspection.add(group);draw(inspection,view);worldGroup.add(group);
    const allocated=gpu.info.memory.geometries,timers=[];
    window.setTimeout=(fn,ms,...args)=>ms===1200?(timers.push(()=>fn(...args)),0):originalSetTimeout(fn,ms,...args);
    try{resolveTrafficIncident(incident);}finally{window.setTimeout=originalSetTimeout;}
    for(const fn of timers)fn();
    samples.push({cycle:i+1,outlines:world.outlines.length-initial.outlines,actions:world.interactables.length-initial.actions,incidents:world.trafficIncidents.length-initial.incidents,allocatedGeometries:allocated,remainingGeometries:gpu.info.memory.geometries});
   }
   const officerInitial=world.outlines.length;
   for(let i=0;i<12;i++){
    const car=world.policeCars[0];if(!car)throw Error('Native police patrol unavailable');
    const alert={carId:car.id,officer:createRoadsidePoliceOfficer(car)};
    removeRoadsidePoliceOfficer(alert);
   }
   return{initial,samples,officerRetainedOutlines:world.outlines.length-officerInitial,uniqueCreated,uniqueDisposed,renderer:gpu.getContext().getParameter(gpu.getContext().RENDERER)};
  }finally{window.setTimeout=originalSetTimeout;gpu.dispose();paused=wasPaused;}
 };
`;
const server=await multiplayerServer();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={baseline:revision,comparison:'Same baseline application, replacing only the two native emergency cleanup functions from the edited module.',limits:['Disposable local Firebase fixture, native Chromium WebGL with software rendering. Repeated emergency lifecycle stress, not elapsed gameplay or physical-phone performance.'],cases:[]};
try{
 for(const [label,source] of [['before',baseline],['after',changed]]){
  const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.abort());
  await installWorldRtdbFixture(context);
  await context.addInitScript(()=>{
   let seed=177;Math.random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
   localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,lastSaved:Date.now(),profile:{name:'Ciclo emergência QA',nameConfirmed:true,playerId:'emergency-local',coins:8000},avatar:{bodyStyle:'family-thiago'},flags:{accountPromptedV635:true},settings:{quality:'low',sound:false},guardian:{sessionLimitMinutes:0}}));
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack));
  const end=source.lastIndexOf('})();');
  await installCityInspection(page,{appSource:source.slice(0,end)+hook+source.slice(end),revision,capDuringBoot:true});
  await page.goto(server.origin+'/games/otthi/');await page.locator('#playBtn').click();
  await page.waitForFunction(()=>window.__CITY_QA?.cap()&&OTTHOS_TEST_API.getGame().running&&document.getElementById('modal').hidden,null,{timeout:180000});
  const result={label,...await page.evaluate(()=>__EMERGENCY_LIFECYCLE_QA()),errors};report.cases.push(result);
  fs.writeFileSync(out+'/'+label+'.json',JSON.stringify(result,null,2));console.log(label,JSON.stringify(result));
  assert.deepEqual(errors,[]);
  if(label==='after'){
   assert(result.samples.every(s=>s.outlines===0&&s.actions===0&&s.incidents===0));
   assert.equal(result.officerRetainedOutlines,0);
   assert.equal(result.uniqueCreated,result.uniqueDisposed);
   assert.equal(result.samples[0].remainingGeometries,result.samples.at(-1).remainingGeometries,'GPU geometry stays bounded across repeated accidents');
  }
  await context.close();
 }
 report.passed=true;
 fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));
}finally{await browser.close();await server.close();}

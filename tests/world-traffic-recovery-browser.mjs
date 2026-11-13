/* Native city simulation with a deterministic clock. Rendering is capped during
 * logic stress; this test does not measure real FPS or physical-phone latency. */
import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {installWorldRtdbFixture} from './helpers/world-rtdb-browser-fixture.mjs';
import {installCityInspection} from './helpers/world-city-inspection.mjs';

const out='docs/evidence/evolucao-20261112/transito';fs.mkdirSync(out,{recursive:true});
const revision='fed801c',baseline=execFileSync('git',['show',revision+':games/otthi/app.js'],{encoding:'utf8',maxBuffer:6e6});
function functionSource(source,name){const start=source.indexOf('  function '+name+'(');assert(start>=0,name);const next=source.indexOf('\n  function ',start+3);return source.slice(start,next<0?undefined:next);}
let after=baseline;
for(const name of ['trafficYields','trafficSpeedFactor','trafficOverlapBackOff','resolveTrafficOverlaps'])after=after.replace(functionSource(after,name),functionSource(fs.readFileSync('games/otthi/src/modules/07-navigation-traffic-routes.js','utf8'),name));
const hook=`
 const recoveryPositions=new Map(),recoveryHistory=[];
 function recoveryTarget(a){const r=a.ref;return r.mobility?.route?.[r.mobility.index]||r.route?.points?.[r.pointIndex]||(Array.isArray(r.route)?r.route[r.index??r.routeIndex]:null);}
 window.__TRAFFIC_RECOVERY_QA={
  start:()=>{cancelAnimationFrame(raf);return{models:completeTraffic.created.size,npcs:world.npcs.length,actors:trafficActorList().length};},
  advance:(frames=120)=>__CITY_QA.simulate(frames),
  sample:()=>{world.trafficSnapshot=null;const actors=trafficActorList(),now=performance.now();let contacts=0;
   for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++)if(!actors[i].ref.incidentLocked&&!actors[j].ref.incidentLocked&&trafficBodiesOverlap(trafficBody(actors[i]),trafficBody(actors[j]),-.05))contacts++;
   const moved=[];for(const a of actors){const old=recoveryPositions.get(a.id);if(old)moved.push({id:a.id,distance:Math.hypot(a.group.position.x-old.x,a.group.position.z-old.z)});recoveryPositions.set(a.id,{x:a.group.position.x,z:a.group.position.z});}
   const aged=actors.filter(a=>a.ref.trafficQueuedAt&&now-a.ref.trafficQueuedAt>2200),cycles=[];
   for(let i=0;i<aged.length;i++)for(let j=i+1;j<aged.length;j++)for(let k=j+1;k<aged.length;k++){
    const [a,b,c]=[aged[i],aged[j],aged[k]];
    if(trafficPriority(a.ref)!==trafficPriority(b.ref)||trafficPriority(a.ref)!==trafficPriority(c.ref))continue;
    if([a,b,c].some(p=>[a,b,c].some(q=>Math.hypot(p.group.position.x-q.group.position.x,p.group.position.z-q.group.position.z)>24)))continue;
    const y=(p,q)=>trafficYields(p.ref,q,p.group.rotation.y);
    if(y(a,b)&&y(b,c)&&y(c,a)||y(b,a)&&y(c,b)&&y(a,c))cycles.push([a,b,c].map(p=>({id:p.id,at:p.ref.trafficQueuedAt})));
   }
   const s={seconds:cityQaMs/1000,actors:actors.length,models:completeTraffic.created.size,npcs:world.npcs.length,stopped:actors.filter(a=>a.speed<.1).length,queued:actors.filter(a=>a.ref.trafficQueuedAt&&now-a.ref.trafficQueuedAt>30000&&a.speed<.2).length,contacts,moved,cycles,incidents:state.cityServices.emergencyCalls||0,resolved:state.cityServices.accidentsResolved||0};recoveryHistory.push(s);return s;},
  jams:()=>trafficActorList().filter(a=>a.speed<.1).map(a=>{const body=trafficBody(a),target=recoveryTarget(a),heading=target?Math.atan2(target.x-a.group.position.x,target.z-a.group.position.z):a.group.rotation.y;return{id:a.id,type:a.type,pose:{x:a.group.position.x,z:a.group.position.z,yaw:a.group.rotation.y},body,target,desiredHeading:heading,queue:performance.now()-Number(a.ref.trafficQueuedAt||performance.now()),holdUntil:a.ref.trafficHoldUntil||0,state:a.ref.state,signal:cityTrafficSignalFactor(a.ref,heading,8),factor:trafficSpeedFactor(a.ref,heading,8),blockers:nearbyTrafficActors(body.x,body.z,15).filter(b=>b.ref!==a.ref).map(b=>{const ob=trafficBody(b),dx=ob.x-body.x,dz=ob.z-body.z;return{id:b.id,type:b.type,pose:{x:b.group.position.x,z:b.group.position.z,yaw:b.group.rotation.y},body:ob,speed:b.speed,forward:dx*body.s+dz*body.c,side:dx*body.c-dz*body.s,dot:body.s*ob.s+body.c*ob.c,overlap:trafficBodiesOverlap(body,ob,.12),desiredOverlap:trafficBodiesOverlap(trafficBody(a,heading),ob,.12)}}).filter(b=>Math.hypot(b.forward,b.side)<12)};}),
  capture:()=>({samples:recoveryHistory,jams:__TRAFFIC_RECOVERY_QA.jams(),models:completeTraffic.created.size,npcs:world.npcs.length}),
  inspect:(id)=>{const a=trafficActorList().find(a=>a.id===id);return a?{id:a.id,refKeys:Object.keys(a.ref),route:a.ref.route,pose:a.group.position.toArray(),heading:a.group.rotation.y}:null;}
 };
`;
const server=await multiplayerServer(),browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 for(const [label,source] of [['before',baseline],['after',after]].filter(([label])=>!process.env.OT_TRAFFIC_CASE||process.env.OT_TRAFFIC_CASE===label)){
  const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.abort());await installWorldRtdbFixture(context);
  await context.addInitScript(()=>{Object.defineProperty(performance,'now',{configurable:true,value:()=>1000});Date.now=()=>1794423600000;let seed=177;Math.random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,lastSaved:Date.now(),profile:{name:'Fluxo prolongado QA',nameConfirmed:true,playerId:'traffic-recovery-local',coins:8000},avatar:{bodyStyle:'family-thiago'},flags:{accountPromptedV635:true},settings:{quality:'low',sound:false},guardian:{sessionLimitMinutes:0}}));});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack));const end=source.lastIndexOf('})();');
  await installCityInspection(page,{revision,appSource:source.slice(0,end)+hook+source.slice(end),capDuringBoot:true});await page.goto(server.origin+'/games/otthi/');await page.locator('#playBtn').click();
  await page.waitForFunction(()=>window.__CITY_QA?.cap()&&OTTHOS_TEST_API.getGame().running&&document.getElementById('modal').hidden,null,{timeout:180000});
  console.log('START',label,JSON.stringify(await page.evaluate(()=>__TRAFFIC_RECOVERY_QA.start())));
  for(let i=0;i<Number(process.env.OT_TRAFFIC_SECONDS||180)/2;i++){
   await page.evaluate(()=>__TRAFFIC_RECOVERY_QA.advance(120));
   if(i%5===4){const s=await page.evaluate(()=>__TRAFFIC_RECOVERY_QA.sample());console.log('SAMPLE',label,JSON.stringify({...s,moved:undefined}));fs.writeFileSync(out+'/'+label+'-progress.json',JSON.stringify(s,null,2));}
  }
  const result={label,baseline:revision,clock:'Native simulation at60Hz with fixed performance and wall clocks; no automatic RAF steps between samples.',...await page.evaluate(()=>__TRAFFIC_RECOVERY_QA.capture()),errors};
  fs.writeFileSync(out+'/'+label+'.json',JSON.stringify(result,null,2));console.log('DONE',label,JSON.stringify({models:result.models,npcs:result.npcs,jams:result.jams.length,errors}));
  assert.deepEqual(errors,[]);assert.equal(result.models,44);assert.equal(result.npcs,138);
  await context.close();
 }
}finally{await browser.close();await server.close();}

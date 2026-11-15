import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const source=fs.readFileSync('games/otthi/src/modules/16-emergency-services.js','utf8');
const traffic=fs.readFileSync('games/otthi/src/modules/07-navigation-traffic-routes.js','utf8');
const section=(text,from,to)=>text.slice(text.indexOf(from),text.indexOf(to));
function fixture(){
 const world={vehicles:[],policeCars:[],ambulances:[],fireTrucks:[],trafficIncidents:[],interactables:[],emergencyServiceHistory:[]};
 const state={vehicles:{garage:{stored:{}}},career:{activeJob:null},cityServices:{}};
 const context={world,state,player:{x:100,z:100,vehicle:false,boating:false,transit:{mode:''}},currentHouse:null,remotePresence:new Map(),structuredClone,
  groundHeightAt:()=>0,pointOnRoad:(x,z)=>Math.abs(z)<=4.5,nearbyWorldColliders:()=>[],nearbyTrafficActors:()=>[],trafficBody:o=>o.body,
  nearestRoadProjection:p=>({point:{x:p.x,z:0},distance:Math.abs(p.z)}),performance:{now:()=>100000},
  incidentResponderActive:()=>true,releaseIncidentActorStates:()=>{},serviceKindForJob:()=>'',worldGroup:{remove(){}},disposeDetachedVisual(){},
  setTimeout:callback=>callback(),toast(){},saveState(){},completeActiveJob(){},setMissionState(){},MISSION_STATES:{ACCEPTED:'accepted'}};
 vm.createContext(context);
 vm.runInContext(section(traffic,'  function trafficBodiesOverlap(','  function trafficYields('),context);
 vm.runInContext(section(source,'  function incidentResponderBody(','  function incidentResponderRoute('),context);
 vm.runInContext(section(source,'  function recordIncidentContingency(','  function assistTrafficIncident('),context);
 vm.runInContext(section(source,'  function resolveTrafficIncident(','  function updateTrafficIncidents('),context);
 return{world,state,context,run:code=>vm.runInContext(code,context)};
}
function incident(id='test'){
 return{id,startedAt:0,serviceElapsedMs:5000,serviceBudgetMs:30000,backupAt:10000,group:{visible:true},required:{police:true,paramedic:true,firefighter:true},arrived:{},tasks:{},playerAssigned:{},responders:{police:'police1',paramedic:'rescue1',firefighter:'fire1'},physicalArrivals:{},contingencyEvents:[],actorStates:[]};
}

test('a long responder exits a curb along the road instead of rotating its rear outside it',()=>{
 const f=fixture();f.context.vehicle={serviceType:'firefighter',group:{rotation:{y:Math.PI/2}}};f.context.from={x:0,z:3.05};
 assert.equal(f.run('incidentResponderTravelClear(vehicle,from,{x:0,z:1.35},false)'),false,'the old perpendicular connector does not fit');
 const departure=f.run('incidentResponderDeparture(vehicle,from)');assert(departure);assert(departure.x>=8);assert(Math.abs(departure.z-1.35)<1e-8);
 f.context.departure=departure;assert.equal(f.run('incidentResponderTravelClear(vehicle,from,departure,false)'),true);
});

test('hidden parked instances do not become phantom blockers, and visible bodies still block',()=>{
 const f=fixture();f.context.vehicle={serviceType:'firefighter'};
 const other={id:'parked',group:{visible:false},body:{x:0,z:0,w:1,l:2,s:0,c:1}};f.world.vehicles.push(other);
 assert.equal(f.run('incidentResponderPoseClear(vehicle,0,0,0,false)'),true);
 other.group.visible=true;assert.equal(f.run('incidentResponderPoseClear(vehicle,0,0,0,false)'),false);
});

test('a slow render clock cannot consume the simulated service budget, and real wall safety remains bounded',()=>{
 const f=fixture();f.context.i=incident();
 f.run('autonomousIncidentBackup(i,60000)');assert(!f.context.i.forcedClear);assert.deepEqual(f.context.i.contingencyEvents,[]);
 f.run('autonomousIncidentBackup(i,170000)');assert.equal(f.context.i.forcedClear,true);assert.equal(f.context.i.contingencyEvents.length,3);
 assert(f.context.i.contingencyEvents.every(e=>e.reason==='wall-safety'));assert.equal(Object.keys(f.context.i.physicalArrivals).length,0);
});

test('service-budget fallback is separate from physical arrival and is recorded only once per role',()=>{
 const f=fixture();f.context.i=incident();f.context.i.serviceElapsedMs=31000;
 f.run('autonomousIncidentBackup(i,40000);autonomousIncidentBackup(i,40100)');
 assert.equal(f.context.i.contingencyEvents.length,3);assert(f.context.i.contingencyEvents.every(e=>e.reason==='travel-budget'));
 f.run("recordPhysicalIncidentArrival(i,'police',{id:'police1',group:{position:{x:7,z:0}}},1,40200)");
 assert.equal(f.context.i.physicalArrivals.police.afterContingency,true);
});

test('fallback never increments the physical completion counter, even if every vehicle subsequently arrives',()=>{
 const f=fixture();const p=incident('physical');p.physicalArrivals={police:{},paramedic:{},firefighter:{}};f.context.i=p;f.run('resolveTrafficIncident(i)');
 assert.equal(f.state.cityServices.physicalRescuesCompleted,1);assert.equal(f.world.emergencyServiceHistory.at(-1).mode,'physical');
 const fallback=incident('fallback');fallback.physicalArrivals={police:{},paramedic:{},firefighter:{}};fallback.forcedClear=true;fallback.contingencyEvents=[{kind:'firefighter',reason:'travel-budget'}];f.context.i=fallback;f.run('resolveTrafficIncident(i)');
 assert.equal(f.state.cityServices.physicalRescuesCompleted,1);assert.equal(f.state.cityServices.contingencyRescuesCompleted,1);assert.equal(f.world.emergencyServiceHistory.at(-1).mode,'contingency');
 for(let n=0;n<70;n++){f.context.i=incident('bounded-'+n);f.run('resolveTrafficIncident(i)');}assert.equal(f.world.emergencyServiceHistory.length,64);
});

test('a player-driven response records the player position and its assigned vehicle, not the parked depot pose',()=>{
 const f=fixture();f.context.i=incident();f.context.player.x=7;f.context.player.z=8;f.state.career.activeJob={serviceVehicleId:'my-ambulance'};
 f.run("recordPhysicalIncidentArrival(i,'paramedic',null,2,10000)");const arrival=f.context.i.physicalArrivals.paramedic;
 assert.equal(arrival.source,'player');assert.equal(arrival.vehicleId,'my-ambulance');assert.equal(arrival.x,7);assert.equal(arrival.z,8);assert.equal(arrival.afterContingency,false);
});

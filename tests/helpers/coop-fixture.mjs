import vm from 'node:vm';
import {readFileSync} from 'node:fs';
export function cooperativeFixture(difficulty='normal'){
 let clock=100000;const timers=[],messages=[];
 const context=vm.createContext({console,URLSearchParams,performance:{now:()=>clock},Date:class extends Date{static now(){return clock}},setTimeout(fn,ms){timers.push({fn,ms});},addEventListener(){}});
 context.window={addEventListener(){},location:{search:''},OTTHOS_RTDB:{uid:'host',connected:()=>true,getPresence:()=>({host:{x:0,z:0,updatedAt:clock},guest:{x:0,z:0,updatedAt:clock}}),getRoom:()=> 'bairro-central',serverNowMs:()=>clock}};
 context.messages=messages;context.difficulty=difficulty;
 vm.runInContext(readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),context);
 vm.runInContext(`
 const state={profile:{playerId:'host'},cooperative:{preferredDifficulty:difficulty},career:{},avatar:{uniform:'none'},multiplayer:{room:'bairro-central'},inventory:{rawFish:0,cookedFish:0,bait:0,fishingRod:0}};
 const player={x:0,z:0,vehicle:false,facing:0};const worldGroup=new THREE.Group();
 const vehicle={id:'test-vehicle',label:'Veículo reservado',group:new THREE.Group()};
 const world={fireTrucks:[vehicle],ambulances:[vehicle],policeCars:[vehicle],fires:[],campfires:[],schools:[{id:'school',name:'Escola',x:20,z:0}],hospital:{id:'hospital',name:'Hospital',x:30,z:0},gym:{centerX:50,centerZ:50,radiusX:26,radiusZ:14},npcs:Array.from({length:12},(_,i)=>({id:'npc-'+i,name:'Pessoa '+i,group:new THREE.Group()}))};
 const FIRE_SITES=[{id:'fire-site'}],TRAINING_INCIDENT_SITES=[{x:10,z:0}];
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t;
 const publicPlayerName=()=>window.OTTHOS_RTDB.uid,waterAt=(x,z)=>x===-72&&z===54,positionBlockedForPlayer=()=>false,pointOnRoad=()=>true;
 const worldLayoutPoint=()=>({x:-70,z:-62}),saveState=()=>{},toast=(...args)=>messages.push(args[0]),beep=()=>{},closeModal=()=>{},updateMissionHUD=()=>{},applyAvatarCustomization=()=>{},updateWaypointMarker=()=>{},updateNavigation=()=>{},buildRoutePoints=(a,b)=>[b],equipJobUniform=id=>state.avatar.uniform=id;
 const $=()=>null,$$=()=>[],openModal=(title,html)=>{window.modal={title,html}},confirmModal=async()=>true;
 const reserveMissionServiceVehicle=job=>{job.serviceVehicleId=vehicle.id;return vehicle},serviceMissionVehicle=()=>vehicle,releaseMissionServiceVehicle=()=>{},isDrivingServiceVehicle=()=>player.vehicle;
 const nearestRoadProjection=point=>({point}),serviceVehiclePools=()=>[vehicle],resolveTrafficIncident=incident=>incident.resolved=true,releaseIncidentActorStates=()=>{};
 const activateFireIncident=()=>{const f={id:'fire-site',name:'Incêndio',x:10,z:0,navX:10,navZ:0,active:true,group:new THREE.Group()};world.fires.push(f);return f},ensureActiveFire=activateFireIncident,extinguishFireIncident=f=>f.active=false;
 const createTrafficIncidentAt=(x,z)=>world.activeIncident={id:'incident',x,z,navX:x,navZ:z,group:new THREE.Group()};
 const safePointNear=(x,z)=>({x,z}),spawnCampfire=data=>world.campfires.push({data,group:new THREE.Group()}),startFishing=()=>{};
 const renderMat=color=>new THREE.MeshBasicMaterial({color}),box=()=>new THREE.Group(),premiumBox=box,cylinder=box;
 let coins=0,reputation=0;const addCoins=n=>coins+=n,addReputation=n=>reputation+=n,addXP=()=>{},awardMedal=()=>{};
 function enterServiceVehicle(){player.vehicle=true;onCoopServiceVehicleBoarded(vehicle,activeCoopMission().serviceJob);return true;}
 `,context);
 vm.runInContext(readFileSync('games/otthi/src/modules/32-cooperative-missions.js','utf8'),context);
 function run(source){clock+=1301;return vm.runInContext(source,context)}
 async function flush(){for(let i=0;i<20;i++){await Promise.resolve();const timer=timers.shift();if(timer){clock+=timer.ms;await timer.fn();}else if(!timers.length){await Promise.resolve();if(!timers.length)break;}}}
 async function action(source='performCoopMissionAction()'){const promise=run(source);await flush();return await promise;}
 function target(){run('{const __target=coopCurrentTarget();if(__target){player.x=__target.navX??__target.x;player.z=__target.navZ??__target.z;}}');}
 async function start(type,mode='solo'){
  if(mode==='solo')return action(`createCooperativeMission('${type}','solo')`);
  run(`ensureCooperativeState();const record=coopLocalRecord(coopMissionTemplate('${type}'),'coop','driver');record.minPlayers=2;record.maxPlayers=2;record.participants.guest={uid:'guest',name:'Parceiro',role:'${type==='firefighter'?'hose':type==='paramedic'?'medic':type==='police'?'officer':'helper'}',ready:true};state.cooperative.active=coopActiveState(record,false);`);
  return action('startActiveCoopMission()');
 }
 return{context,run,action,flush,target,start,messages};
}

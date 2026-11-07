import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {engine} from './helpers/game-fixture.mjs';
import {dancePose} from './helpers/dance-pose-fixture.mjs';

const read=p=>fs.readFileSync(p,'utf8');
const handsWindow={};
vm.runInNewContext(read('games/ar/hand-controls.js'),{window:handsWindow,document:{baseURI:'http://qa/'},URL});
const {AimController}=handsWindow.WarHandControl;
function hand(x,y=.5,pinch=false){
 const points=Array.from({length:21},()=>({x,y,z:0}));
 points[0]={x,y:y+.12};points[5]={x:x-.035,y};points[9]={x,y:y-.02};points[17]={x:x+.05,y};
 points[4]={x:x-.06,y:y-.07};points[8]=pinch?{x:x-.052,y:y-.078}:{x:x+.07,y:y-.18};return points;
}
const pair=(leftX=.73,leftY=.5,rightX=.28,pinch=false)=>({landmarks:[hand(rightX,.5,pinch),hand(leftX,leftY)],handedness:[[{categoryName:'Left',score:.98}],[{categoryName:'Right',score:.98}]]});
function dual(){const c=new AimController({dualHands:true});for(let at=100;at<=2700;at+=100)c.consume(pair(),at);assert(c.neutral);assert(c.navigation.neutral);return c;}

test('two hands: calibrate both without the torso, left hand turns and walks while the right palm stays centred',()=>{
 const c=dual();assert.equal(c.label,'Left','bind the presented hand independently of selfie category names');
 for(let at=2800;at<=3400;at+=100)c.consume(pair(.61,.40),at);
 const nav=c.navigation.read(3400);assert(nav.fresh&&nav.turn>.5&&nav.move>.35);assert(Math.abs(c.aim.x-.5)<.001);assert.equal(c.aim.fire,false);
 c.consume(pair(),3500);assert.equal(c.navigation.read(3500).turn,0);assert.equal(c.navigation.read(3500).move,0);
 for(let at=3600;at<=4000;at+=100)c.consume(pair(.731,.501),at);assert.equal(c.navigation.read(4000).turn,0);assert.equal(c.navigation.read(4000).move,0);
});
test('two hands: only a right-hand pinch fires; each missing hand releases only its own commands',()=>{
 const c=dual();c.consume(pair(.73,.5,.28,true),2800);assert(c.aim.fire);
 c.consume(pair(.73,.5,.28,false),2900);assert.equal(c.aim.fire,false);
 const onlyLeft={landmarks:[hand(.6,.40)],handedness:[[{categoryName:'Right',score:.98}]]};c.consume(onlyLeft,3000);
 assert(!c.aim.fresh&&!c.aim.fire);assert(c.navigation.read(3000).fresh);
 const onlyRight={landmarks:[hand(.28,.5,true)],handedness:[[{categoryName:'Left',score:.98}]]};c.consume(onlyRight,3100);assert(c.aim.fresh&&c.aim.fire);assert(!c.navigation.read(3100).fresh);
 assert(!c.read(3701).fresh&&!c.aim.fire);assert.equal(c.navigation.read(3701).move,0);
});
test('two hands: accumulated turns exceed 180 degrees with no physical turn or aim drift; neutral left hand stops immediately',()=>{
 const {game:g,advance}=engine('ar','game_ar'),c=dual();g.init({id:'patrol'});g.covers=[];g.waveDelay=999;g.enemies=[];
 g.handSession={dualHands:true,controller:c,dispose(){}};advance(2700);let total=0,last=0;
 for(let i=0;i<140;i++){const at=2800+i*16;advance(16);c.consume(pair(.60),at);g.handAim=c.read(at);g.step(.016);const angle=g.player.yaw;total+=Math.atan2(Math.sin(angle-last),Math.cos(angle-last));last=angle;}
 assert(total>Math.PI);assert(Math.abs(g.player.pitch)<.001);assert.equal(g.stats.shots,0);
 c.consume(pair(),5100);advance(100);g.handAim=c.aim;const yaw=g.player.yaw;g.step(.016);assert.equal(g.player.yaw,yaw);
});

const phoneSource=read('games/otthi/src/modules/73-world-phone-dispatch.js');
const fleetSource=read('games/otthi/src/modules/61-world-air-operations.js');
function phoneFixture(){
 const c=vm.createContext({Math,Date,Number,lerp:(a,b,t)=>a+(b-a)*t,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),window:{},world:{colliders:[],vehicles:[]},remotePresence:new Map(),player:{x:180,z:200},sharedWorldRuntime:{},groundHeightAt:()=>0,waterAt:()=>false,v704WorldBounds:()=>({minX:-1000,maxX:1000,minZ:-1000,maxZ:1000}),campaignAircraftHeight:()=>1.6,airSafeCruise:()=>45,airNow:()=>1000,airEnsure:()=>true});
 vm.runInContext(fleetSource.slice(fleetSource.indexOf(' class WorldAirFleet'),fleetSource.indexOf(' const airOperations='))+'\nglobalThis.Fleet=WorldAirFleet;',c);
 c.airOperations={fleet:new c.Fleet({heli:{id:'heli',mode:'helicopter',x:96,z:-164,yaw:0},plane:{id:'plane',mode:'plane',x:30,z:-216,yaw:Math.PI/2}}, {},1000)};
 c.airAvailable=id=>c.airOperations.fleet.data.craft[id]?.status==='parked';
 vm.runInContext(phoneSource.slice(phoneSource.indexOf(' const worldPhone='),phoneSource.indexOf(' const phonePreviousExpansion='))+'\nglobalThis.Route=PhoneDriveRoute;',c);
 return c;
}
test('phone driver: stops before a real blocker, resumes when it clears, and reaches the same position at 30/60/120Hz',()=>{
 const c=phoneFixture();for(const hz of[30,60,120]){const route=new c.Route([{x:0,z:0},{x:0,z:15},{x:12,z:15}]);let blocked=true;
  for(let i=0;i<hz*6;i++)route.step(1/hz,(x,z)=>!blocked||z<5);assert(route.z<5);assert(route.blocked);assert(!route.arrived);
  blocked=false;for(let i=0;i<hz*15;i++)route.step(1/hz,()=>true);assert(route.arrived);assert.equal(route.x,12);assert.equal(route.z,15);assert.equal(route.speed,0);
 }
});
test('phone aircraft: an occupied unit cannot be recalled, unsafe landing sites do not alter it, and a real helicopter has takeoff, travel and landing phases',()=>{
 const c=phoneFixture(),fleet=c.airOperations.fleet,craft=fleet.data.craft.heli;
 assert(fleet.claim('heli','pilot-a',1000));assert.equal(c.phoneStartAirDelivery('heli','caller',{x:200,z:200,yaw:0}),false);assert.equal(craft.pilot,'pilot-a');
 fleet.park('heli','pilot-a',{x:96,z:-164,yaw:0},1000);c.world.colliders.push({x:200,z:200,w:10,d:10});assert.equal(c.phoneStartAirDelivery('heli','caller',{x:200,z:200,yaw:0}),false);assert.equal(craft.status,'parked');
 c.world.colliders=[];assert(c.phoneStartAirDelivery('heli','caller',{x:200,z:200,yaw:0}));assert.equal(craft.status,'delivery');assert.equal(c.phoneStartAirDelivery('heli','other',{x:230,z:200,yaw:0}),false);
 const job=craft.delivery,start=c.phoneAirDeliveryPose(job,1000),up=c.phoneAirDeliveryPose(job,7000),flying=c.phoneAirDeliveryPose(job,12000),end=c.phoneAirDeliveryPose(job,100000);
 assert.equal(start.craft.x,96);assert.equal(start.craft.z,-164);assert.equal(start.craft.y,1.6);assert(up.craft.y>30);assert.equal(flying.phase,'flight');assert(flying.craft.x>96&&flying.craft.x<200);assert.equal(end.phase,'done');assert.equal(end.craft.x,200);assert(Math.abs(end.craft.y-1.6)<1e-9);
 job.holdLanding=true;assert(c.phoneAirDeliveryPose(job,100000).craft.y>=13.6,'a blocked destination holds above the landing area');
});
test('aircraft release: a disembark command is accepted after presence cleared the ride, while a different pilot or an airborne old position is rejected',()=>{
 const c=phoneFixture();vm.runInContext(fleetSource.slice(fleetSource.indexOf(' function airParkPoseValid('),fleetSource.indexOf(' function airReceiveCommand(')),c);
 const craft={id:'heli',status:'piloted',pilot:'guest',x:96,z:-164,y:1.6,onGround:true},pose={x:96,y:1.6,z:-164,yaw:.2,vx:0,vy:0,vz:0},presence={x:99,z:-164};
 assert(c.airCanParkFromPresence(craft,'guest',pose,presence));assert.equal(c.airCanParkFromPresence(craft,'intruder',pose,presence),false);
 assert.equal(c.airCanParkFromPresence({...craft,onGround:false,y:100},'guest',{...pose,y:100},presence),false);
 assert.equal(c.airCanParkFromPresence({...craft,status:'delivery'},'guest',pose,presence),false,'a delayed old exit must not cancel a new delivery');
 const f=c.airOperations.fleet;f.claim('heli','guest',1000);assert(f.park('heli','guest',pose,2000));assert(f.claim('heli','next-player',2001));assert.equal(f.park('heli','guest',pose,2002),false);
});

test('aircraft recovery: a helicopter delivered by a phone pilot can later gain recovery equipment without replacing its character',()=>{
 const node=()=>({position:{set(x,y,z){Object.assign(this,{x,y,z});}},rotation:{},scale:{setScalar(n){this.value=n;}},userData:{},traverse(){}}),person={group:node(),rightArm:{rotation:{}},leftArm:{rotation:{}}},visual={person},added=[];
 const c=phoneFixture();Object.assign(c,{createCivilianAirframe:node,createRoadsidePoliceOfficer:()=>{throw Error('The existing pilot must be reused');},worldGroup:{add:o=>added.push(o)},THREE:{Mesh:function(){return node();},CylinderGeometry:function(){}},campaignMaterial:()=>({}),otGamesFocus:()=>({x:96,z:-164})});c.airOperations.recovery=new Map([['heli',visual]]);
 vm.runInContext(fleetSource.slice(fleetSource.indexOf(' function airRecoveryPose('),fleetSource.indexOf(' function airRecoveryDestination('))+fleetSource.slice(fleetSource.indexOf(' function airRecoveryVisual('),fleetSource.indexOf(' function airNpcBalloonPose(')),c);
 const craft={id:'heli',status:'recovering',job:{id:'heli',at:1000,from:{x:96,z:-164,yaw:0},to:{x:100,z:-240,yaw:0},ground:0,targetGround:0,cruise:45}};
 c.airRecoveryVisual(craft,1000);assert(visual.heli&&visual.cable);assert.equal(visual.person,person);assert.equal(person.group.scale.value,1);assert.equal(added.length,2);
 c.airRecoveryVisual(craft,2000);assert.equal(added.length,2,'equipment is created once, not every animation frame');assert(visual.heli.visible);
});

test('runway landing: free flight reaches the runway, settles and brakes; off-runway clearance and takeoff remain available',()=>{
 const {game:g}=engine('voo','game_flight');g.init({mode:'FREE'});g.flightSchool=null;g.mode='FREE';g.pilot.throttle=0;
 Object.assign(g.ship,{x:0,z:0,y:7.8,yaw:0,pitch:-.02,roll:0,vx:0,vy:-2,vz:65});g._updateRunwayLanding(1/60);assert(g.onGround);assert.equal(g.ship.y,8);assert.equal(g.landingQuality,'smooth');
 const before=g.ship.vz;for(let i=0;i<180;i++)g._updateRunwayLanding(1/60);assert(g.ship.vz<before*.12);
 g.ship.vz=80;g.ship.pitch=.1;g.pilot.throttle=.9;g._updateRunwayLanding(1/60);assert(!g.onGround);
 g.ship.x=1000;g.ship.y=4;g._updateRunwayLanding(1/60);assert.equal(g.ship.y,50);
 g.onGround=true;g._startMission();assert.equal(g.onGround,false,'a new flight cannot inherit the previous landing state');
});
test('landing assist limits sink only in a valid approach and respects the manual assist setting',()=>{
 const {game:g,settings}=engine('voo','game_flight');g.init({mode:'FREE'});g.mode='FREE';g.flightSchool=null;g.pilot.throttle=.3;
 Object.assign(g.ship,{x:0,z:0,y:15,yaw:0,roll:0,vy:-20,vx:0,vz:75});g._softenLandingApproach();assert(g.ship.vy>=-1.2);
 settings.assist=false;g.ship.vy=-20;g._softenLandingApproach();assert.equal(g.ship.vy,-20);settings.assist=true;g.ship.yaw=Math.PI/2;g._softenLandingApproach();assert.equal(g.ship.vy,-20);
});
test('tennis: settling a filtered racket never creates another wrist stroke, and weak detection cannot calibrate a corner',()=>{
 const {game:g,window,advance}=engine('tenis','game_tennis');window.ArcadeControls.mode='camera';g.state='RALLY';g.handedness='right';
 const pose=x=>({keypoints:[{name:'right_wrist',score:1,x,y:200},{name:'right_elbow',score:1,x:x+40,y:310}]});
 g.processPose(pose(320),390,844);advance(20);g.processPose(pose(220),390,844);assert(g.p1.vx>0);advance(20);g.processPose(pose(220),390,844);assert.equal(g.p1.vx,0);assert.equal(g.p1.vy,0);
 g.state='CALIB_TL';g.processPose({keypoints:[{name:'right_wrist',score:.1,x:0,y:0}]},390,844);for(let i=0;i<100;i++)g.updateAutoCalibration(20);assert.equal(g.state,'CALIB_TL');assert.equal(g.calibTimer,0);
});
test('dance: valid step-touch keeps the hands in frame, and a clipped wrist cannot earn credit',()=>{
 const c=vm.createContext({});vm.runInContext(read('games/otthi/src/modules/44-world-rhythm.js')+'\nglobalThis.Dance=WorldDanceBody;',c);
 for(const move of['stepTouchLeft','stepTouchRight'])assert(c.Dance.body(dancePose(move)));
 const clipped=dancePose('open');clipped[15].x=1.03;assert.equal(c.Dance.body(clipped),null);assert.match(c.Dance.framingHint(clipped),/mãos/);
});

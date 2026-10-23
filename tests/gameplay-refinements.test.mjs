import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(p,'utf8');
import {engine,canvas} from './helpers/game-fixture.mjs';
test('kart: zoom moves road and actual competitors with the same camera; rear view reverses direction',()=>{
 const {game:g,settings}=engine('kart','game_kart');g.currentFase={mode:'RACE'};g.buildTrack(0);g.state='RACE';g.rivals=[{lap:1,pos:1500,x:.25,charId:1,name:'Rival real',kartId:0}];
 const c=canvas();g.renderWorld(c,390,844);const far={...g.playerScreen};assert(Number.isFinite(far.x)&&far.y>200&&far.y<844);
 settings.distance='near';for(let i=0;i<90;i++)g.renderWorld(c,390,844);assert(g.playerScreen.scale>far.scale*1.5,'Near view must change physical projection');
 g.arcadeManual={rear:true};assert.equal(g.cameraView(390,844).direction,-1);
 assert(c.operations.some(x=>x[0]==='fillText'&&x[1]==='Rival real'),'Real opponent label must be projected');
});
test('flight: chase projection is finite in turns and cockpit returns to aircraft origin',()=>{
 const {game:g,settings}=engine('voo','game_flight');const c=canvas();
 for(const roll of [-1,0,1]){g.ship.roll=roll;g.ship.yaw+=.2;g._updateView(390,844);const p=g._projectView(g.ship.x,g.ship.y,g.ship.z,390,844);assert(p.visible&&Number.isFinite(p.x)&&Number.isFinite(p.y));g._drawOwnPlane(c,390,844);}
 const far=Math.hypot(g.view.x-g.ship.x,g.view.y-g.ship.y,g.view.z-g.ship.z);settings.distance='near';g._updateView(390,844);assert(Math.hypot(g.view.x-g.ship.x,g.view.y-g.ship.y,g.view.z-g.ship.z)<far);
 settings.camera='cockpit';g._updateView(390,844);assert.equal(g.view.x,g.ship.x);assert.equal(g.view.z,g.ship.z);
});
test('tennis: loss holds racket without synthetic velocity; recovery and real wrist motion preserve direction',()=>{
 const {game:g,window,advance}=engine('tenis','game_tennis');window.ArcadeControls.mode='camera';g.state='RALLY';g.handedness='right';
 const pose=x=>({keypoints:[{name:'right_wrist',score:.95,x,y:200},{name:'right_elbow',score:.95,x:x+30,y:280}]});
 g.processPose(pose(320),390,844);advance(17);const before=g.p1.x;g.processPose(pose(280),390,844);assert(g.p1.x>before,'Mirrored wrist moving right must move paddle right');
 g.processPose(null,390,844);assert.equal(g.trackingLost,true);assert.equal(g.p1.vx,0);const frozen=g.p1.x;
 advance(100);g.processPose(pose(500),390,844);assert.equal(g.trackingLost,false);assert.equal(g.p1.vx,0,'Reacquiring a distant wrist cannot invent a smash');assert.notEqual(g.p1.x,frozen);
});
test('boxing: a preparation interval precedes a real attack and difficulty changes its pace',()=>{
 const {game:g,settings}=engine('boxe','game_box');g.p1=g.createPlayer('p1',0);g.p2=g.createPlayer('p2',1);g.timer=180;g.p1.pose.head={x:195,y:500};
 for(let i=0;i<25;i++)g.updateAI(390,844,.016);assert(Object.values(g.p2.pose.wrists).every(h=>h.state==='IDLE'),'Idle repositioning cannot invent an unannounced punch');
 let seen=false,attacks=0;g.updateHandLogic=(hand,target,shoulder,owner)=>{if(hand.state==='PUNCH')attacks++;};
 for(let i=0;i<150;i++){g.updateAI(390,844,.016);if(g.telegraph)seen=true;}
 assert(seen,'Opponent must signal preparation');assert(attacks>0,'Preparation must lead to real native PUNCH state');
});
test('approved family rigs deform with actual Three.js bones and complete fetch once',()=>{
 const context=vm.createContext({console,performance:{now:()=>100},URLSearchParams,Float32Array,setTimeout(){}});context.window={addEventListener(){},location:{search:''}};context.document={hidden:false};
 vm.runInContext(read('games/otthi/assets/vendor/three-r128.min.js'),context);context.window.THREE=context.THREE;
 const setup=`const state={};const player={x:0,z:0,facing:0};const world={colliders:[]};const worldGroup=new THREE.Group();const remotePresence=new Map();const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));const lerp=(a,b,t)=>a+(b-a)*t;const lerpAngle=lerp;const waterAt=()=>false;const v704RoadAt=()=>false,v704ProtectedRectangles=()=>[];const positionBlockedForPlayer=()=>false;const segmentClear=()=>true;const groundHeightAt=()=>0;const worldLayoutPoint=()=>({x:0,z:0});const createHouse=()=>{};const registerInteractable=()=>{};const sharedWorldIsAuthority=()=>true;const sharedWorldOwnId=()=> 'unit-player';const saveState=()=>{};const toast=()=>{};const beep=()=>{};const buildRoutePoints=(a,b)=>[b];`;
 vm.runInContext(setup,context);vm.runInContext(read('games/otthi/family-mascots.js'),context);vm.runInContext(read('games/otthi/src/modules/41-family-adventure.js'),context);
 vm.runInContext('initFamilyAdventure();player.x=familyWorld.location.x;player.z=familyWorld.location.z+6;',context);
 const info=vm.runInContext('window.OTTHI_FAMILY.diagnostics()',context);assert.equal(info.actors.length,4);assert(info.actors.every(x=>x.bones>12&&x.vertices>1000));
 const before=vm.runInContext(`familyWorld.actors.thiago.group.updateMatrixWorld(true);familyWorld.actors.thiago.bones[10].matrixWorld.elements.slice()`,context);
 vm.runInContext('familyWorld.walkOwner="unit-player";player.x+=4;updateFamilyAdventure(.033);familyWorld.actors.thiago.group.updateMatrixWorld(true)',context);
 const after=vm.runInContext('familyWorld.actors.thiago.bones[10].matrixWorld.elements.slice()',context);assert.notDeepEqual(Array.from(before),Array.from(after),'Animation must update native bones');
 assert.equal(vm.runInContext('window.OTTHI_FAMILY.throwToy("luna")',context),true);
 vm.runInContext('for(let i=0;i<1100;i++)updateFamilyAdventure(.016);',context);
 const progress=vm.runInContext('familyProgress().deliveries.luna',context);assert.equal(progress,1,'Exactly one actual return must count');
 vm.runInContext('for(let i=0;i<120;i++)updateFamilyAdventure(.016);',context);assert.equal(vm.runInContext('familyProgress().deliveries.luna',context),1,'Repeated frames cannot duplicate completed fetch');
 vm.runInContext('familyWorld.lastAck="";familyCollectAck(familyWorld.ack);',context);assert.equal(vm.runInContext('familyProgress().deliveries.luna',context),1,'Reconnecting cannot credit the same delivery twice');
 let wall=100;context.performance.now=()=>wall;vm.runInContext('window.OTTHI_FAMILY.throwToy("luna")',context);for(let i=0;i<25;i++){wall+=500;vm.runInContext('updateFamilyAdventure(.016)',context);}assert.equal(vm.runInContext('familyProgress().deliveries.luna',context),2,'Slow rendering must not turn a short fetch into a minute of slow motion');
});

test('flight school: real throttle accelerates on runway and climb advances to the maneuver lesson',()=>{
 const {game:g,advance}=engine('voo','game_flight');const c=canvas();g.init({mode:'FREE',school:true});g._startMission();assert.equal(g.ship.y,8);assert.equal(g.flightSchool.stage,'takeoff');
 g.manualThrottle=1;for(let i=0;i<600;i++){advance(17);if(g.ship.speed>70)g.keys.ArrowUp=true;g.update(c,390,844,null);}
 assert(g.ship.speed>65,'Engine power must accelerate the aircraft');assert(g.ship.y>95,'Climb command must lift the aircraft from the runway');assert.equal(g.flightSchool.stage,'gates');
});

test('player settings load after the game identity and all local assets are cached',()=>{
 for(const slug of ['kart','voo','tenis','boxe','ar']){const html=read('games/'+slug+'/index.html'),worker=read('games/'+slug+'/sw.js');assert(html.indexOf('src="./play-settings.js"')>html.indexOf('window.CONSOLE_GAME_ID='),slug+' settings must load after its identity');assert(worker.includes('play-settings.js')&&worker.includes('play-settings.css'));}
});

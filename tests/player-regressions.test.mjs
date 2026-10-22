import test from 'node:test';
import assert from 'node:assert/strict';
import {engine,canvas} from './helpers/game-fixture.mjs';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('kart: centered and edge-lane karts stay on the drawn asphalt throughout every track, zoom and rear view',()=>{
 const {game:g,settings}=engine('kart','game_kart'),c=canvas();g.currentFase={mode:'RACE'};g.state='RACE';
 for(let track=0;track<3;track++){g.selectedTrack=track;g.buildTrack(track);
  for(const distance of ['near','medium','far'])for(const rear of [false,true]){
   settings.distance=distance;g.cameraDepth=NaN;g.arcadeManual={rear};
   for(const pos of [0,10199,15080,26030,34070,45020,53075,64066,73000,83990])for(const x of [0,-.85,.85]){
    g.pos=pos;g.playerX=x;g.cameraX=x;g.renderWorld(c,390,844);const p=g.playerScreen;
    assert(Math.abs(p.x-195)<1.3,JSON.stringify({track,distance,rear,pos,x,p}));
    assert(Math.abs(p.x-p.roadX)<=p.roadHalfWidth,'On-road physics must draw wheels on asphalt');assert(p.y>250&&p.y<844);
    c.operations.length=0;
   }
  }
 }
});
test('flight: left and right input bank, turn and accelerate toward the same side',()=>{
 for(const [key,sign] of [['ArrowLeft',-1],['ArrowRight',1]]){
  const {game:g,advance}=engine('voo','game_flight');g.init({mode:'FREE'});g._startMission();g._draw=()=>{};g.keys[key]=true;
  for(let i=0;i<120;i++){advance(1000/60);g.update(canvas(),390,844,null);}
  assert(g.ship.roll*sign>.3);assert(g.ship.yaw*sign>0);assert(g.ship.x*sign>0,JSON.stringify({key,ship:g.ship}));
  const rightWing=g._airframePoint([20,0,0]);assert((rightWing.y-g.ship.y)*sign<0,'Right bank must lower the right wing');
 }
});
test('flight: level mirrored wrists are neutral, lowering the screen-right wrist banks right',()=>{
 const {game:g,window}=engine('voo','game_flight');g.init({mode:'FREE'});window.ArcadeControls.mode='camera';g.pilot.baseY=844*200/480;
 const pose=(leftY,rightY)=>({keypoints:[{name:'right_wrist',score:1,x:450,y:leftY},{name:'left_wrist',score:1,x:190,y:rightY}]});
 for(let i=0;i<25;i++)g._readPose(pose(200,200),390,844,1/60);assert(Math.abs(g.pilot.targetRoll)<.001,'Level hands cannot command a permanent turn');
 for(let i=0;i<25;i++)g._readPose(pose(170,230),390,844,1/60);assert(g.pilot.targetRoll>.2);
});
test('flight: only continuous sight acquisition of one enemy permits fire; losing or switching targets stops it',()=>{
 const {game:g,advance,window}=engine('voo','game_flight');g.init({mode:'SINGLE'});window.ArcadeControls.mode='camera';g.entities=[{type:'jet',x:1800,y:3000,z:4000,hp:150,vx:0,vy:0,vz:0}];
 const step=()=>{advance(1000/60);g._processCombat(1/60,390,844)};
 for(let i=0;i<100;i++)step();assert.equal(g.bullets.length,0,'Enemies away from the sight cannot trigger automatic fire');
 g.entities[0].x=0;for(let i=0;i<38;i++)step();assert.equal(g.bullets.length,0,'Acquisition must last 650ms');
 step();step();assert(g.combat.locked&&g.bullets.length>0);
 const before=g.bullets.length;g.entities=[{...g.entities[0]}];step();assert(!g.combat.locked);assert.equal(g.bullets.length,before,'Switching enemies resets acquisition');
 g.entities[0].x=4000;for(let i=0;i<15;i++)step();assert(!g.combat.locked);assert.equal(g.bullets.length,before);
 g.entities=[];g.mode='COOP';g.net.players={ally:{x:0,y:3000,z:4000,hp:100}};for(let i=0;i<60;i++)step();assert.equal(g.bullets.length,before,'An ally is never a fire target');
});
test('flight: airframes and paid upgrades persist; bank and XP are numeric and one kill cannot pay twice',()=>{
 const {game:g,window,timers,storage}=engine('voo','game_flight');window.Profile.coins='12000';window.Profile.xp='500';g.init({mode:'SINGLE'});
 g._processHangarClick(195,844*.37,390,844);assert.equal(g.upgrades.engine,2);g._processHangarClick(195,844*.37,390,844);assert.equal(g.upgrades.engine,3);assert(g.selectAirframe('interceptor'));
 const saved=JSON.parse(storage.get(g.careerKey));assert.equal(saved.airframe,'interceptor');assert.equal(saved.upgrades.engine,3);
 let xpDelta;window.DB={ref:()=>({set(){},transaction:fn=>xpDelta=fn(1000)})};
 const enemy={x:0,y:3000,z:4000,hp:0};g._kill(enemy,150);const balance=g.session.cash;g._kill(enemy,150);
 assert.equal(typeof balance,'number');assert.equal(g.session.cash,balance);assert.equal(g.session.kills,1);assert.equal(xpDelta,1150);
 let result;window.System.gameOver=(...args)=>result=args;g._endGame('VICTORY');timers.at(-1)();assert.equal(result[2],0,'Historical wallet must not be added again as a match reward');
 g.cleanup();g.init({mode:'FREE'});assert.equal(g.airframe,'interceptor');assert.equal(g.upgrades.engine,3);
});
test('tennis: real ball simulation is identical at 30, 60 and 120Hz, with two-serve rotation and single serves at deuce',()=>{
 const simulations=[30,60,120].map(fps=>{const {game:g}=engine('tenis','game_tennis');g.startGame();g.state='RALLY';Object.assign(g.ball,{active:true,x:0,y:-500,z:0,vx:2,vy:-5,vz:12,lastHitBy:'p1',spinX:0,spinY:0});g.lastHitter='p1';for(let n=0;n<fps;n++)g.stepSimulation(1000/fps);return {ball:JSON.parse(JSON.stringify(g.ball)),score:JSON.parse(JSON.stringify(g.score)),state:g.state};});
 assert.deepEqual(simulations[0],simulations[1]);assert.deepEqual(simulations[1],simulations[2]);
 const {game:g}=engine('tenis','game_tennis');g.startGame();g.state='RALLY';g.scorePoint('p2','');assert.equal(g.server,'p1');g.state='RALLY';g.scorePoint('p2','');assert.equal(g.server,'p2');
 g.score={p1:10,p2:10};g.state='RALLY';g.scorePoint('p1','');assert.equal(g.server,'p2');assert.notEqual(g.state,'END_WAIT');g.state='RALLY';g.scorePoint('p2','');assert.equal(g.server,'p1');g.state='RALLY';g.scorePoint('p1','');g.state='RALLY';g.scorePoint('p1','');assert.equal(g.state,'END_WAIT');
});
test('boxing: a points lead can win a full bout; the first-round challenge fails immediately at its deadline',()=>{
 const {game:g}=engine('boxe','game_box');g.p1=g.createPlayer('p1',0);g.p2=g.createPlayer('p2',1);g.currentFase={id:'arcade'};g.p1.score=300;g.p2.score=100;g.p1.hp=65;g.p2.hp=80;g.round=3;g.endRound();assert(g.matchWon);assert.equal(g.endReason,'DECISÃO');
 g.matchEnded=false;g.matchWon=false;g.currentFase={id:'f2'};g.round=1;g.endRound();assert(g.matchEnded&&!g.matchWon);assert.equal(g.round,1,'No extra rounds after failing the challenge');
});
test('OTThi: pending and failed world textures have neutral images rather than black uninitialized maps',()=>{
 const context=vm.createContext({console});context.window={};context.document={createElement:()=>({width:0,height:0,getContext:()=>({fillStyle:'',fillRect(){}})})};
 vm.runInContext(readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),context);
 vm.runInContext(`let pending=[];THREE.ImageLoader=class{load(url,ok,progress,fail){pending.push({ok,fail})}};let renderer=null;const registerVisualAsset=()=>{},updateVisualAsset=()=>{};`,context);
 vm.runInContext(readFileSync('games/otthi/src/modules/33-otthi-world-professional-core.js','utf8'),context);
 const info=vm.runInContext(`const grass=loadWorldTexture('grass','basecolor',{color:true});const normal=loadWorldTexture('grass','normal');pending[0].fail(new Error('offline'));({grass:!!grass.image,normal:!!normal.image,w:grass.image.width,errors:otthiWorldRuntime.errors.length})`,context);
 assert(info.grass&&info.normal&&info.w===1);assert.equal(info.errors,1);
});
test('kart: a real second of acceleration covers the same distance on 30, 60 and 120Hz displays',()=>{
 const results=[30,60,120].map(fps=>{const {game:g,advance}=engine('kart','game_kart');g.currentFase={id:'arcade',mode:'RACE',targetRank:3};g.setupUI();g.resetPhysics();g.startRace(0);g.localBots=[];g.rivals=[];g.arcadeManual={throttle:true,brake:false,left:false,right:false,rear:false};g.renderWorld=()=>{};g.renderUI=()=>{};const c=canvas();for(let i=0;i<fps;i++){advance(1000/fps);g.update(c,390,844,null);}return {pos:g.pos,speed:g.speed,x:g.playerX};});
 assert.deepEqual(results[0],results[1]);assert.deepEqual(results[1],results[2]);assert(results[0].pos>100);
});
test('AR Combat: rewards and progression require a real completed operation and remain idempotent',()=>{
 const {game:g,window}=engine('ar','game_ar');g.init({id:'patrol'});let results=0;window.System.gameOver=()=>results++;
 assert.equal(g.career.wins,0);assert.equal(g.selectWeapon('smg'),false);
 g.stats.kills=9;assert.equal(g.finish(true),true);const wins=g.career.wins;assert.equal(g.finish(true),false);assert.equal(g.career.wins,wins);
 g.step(3);g.step(3);assert.equal(results,1);assert.equal(g.selectWeapon('smg'),true);
});
test('kart and flight: profile persistence reloads actual owned vehicles and writes only their saved fields',async()=>{
 for(const [slug,field,data]of [['kart','kartSave',{garage:[{modelId:0},{modelId:3}],activeKartIdx:1,upgrades:{engine:3,tires:2,suspension:1},useCustomKart:true}],['voo','flightSave',{upgrades:{engine:3,missiles:2,armor:1},airframe:'interceptor',kills:7,school:true}]]){
  const noop=()=>{},element=()=>({style:{},classList:{add:noop,remove:noop},innerText:''});const window={},document={getElementById:element,createElement:element,head:{appendChild:noop}};
  vm.runInNewContext(readFileSync('games/'+slug+'/js/core.js','utf8'),{window,document,console,setTimeout:noop,clearTimeout:noop,performance:{now:()=>0}});
  let written;window.Profile.updateUI=noop;window.System.renderChannels=noop;window.System.playerId='profile-test-user-123456789012345';window.DB={ref:()=>({on:(event,fn)=>fn({val:()=>({coins:1200,xp:100,level:2,[field]:data})}),update:payload=>written=payload})};
  await window.Profile.loadFromFirebase(window.System.playerId);assert.deepEqual(JSON.parse(JSON.stringify(window.Profile[field])),data);window.Profile.save();assert.deepEqual(JSON.parse(JSON.stringify(written[field])),data);
 }
});
test('flight: PvP credits only one confirmed defeat, including when gun and missile hits share a frame',()=>{
 const {game:g,window}=engine('voo','game_flight');window.Profile.coins=1000;window.Profile.xp=200;g.init({mode:'FREE'});g._startMission();g._pvpKill('rival');g._pvpKill('rival');assert.equal(g.session.kills,1);assert.equal(window.Profile.coins,1500);assert.equal(window.Profile.xp,300);
});
test('tennis: pointer and calibrated camera edge positions keep the racket inside the portrait viewport',()=>{
 const {game:g,window,advance}=engine('tenis','game_tennis');g.updateCameraAdapter(390,844);g.useMouse=true;g.handedness='right';g.mouseY=422;
 for(const x of [0,390]){g.mouseX=x;for(let i=0;i<30;i++){advance(17);g.processPose(null,390,844);}const scale=390*1.8/((2400-200)*Math.sin(.35)+(5000-1620)*Math.cos(.35));const screenX=195+g.p1.x*scale;assert(screenX>=28&&screenX<=362,'Racket must not disappear beyond a screen edge');}
 window.ArcadeControls.mode='camera';g.useMouse=false;g.calib={tlX:0,tlY:0,brX:640,brY:480};const pose={keypoints:[{name:'right_wrist',score:1,x:0,y:200},{name:'right_elbow',score:1,x:10,y:300}]};for(let i=0;i<30;i++){advance(17);g.processPose(pose,390,844);}assert(g.p1.x<1200,'Calibrated hand must use the same visible physical range');
});
test('camera: mirrored steering stays neutral with level hands and uses actual camera dimensions',()=>{
 const {game:g,window}=engine('kart','game_kart');g.currentFase={id:'arcade',mode:'RACE'};g.buildTrack(0);g.resetPhysics();window.ArcadeControls.mode='camera';window.System.video={videoWidth:1280,videoHeight:960};
 const pose=(a,b)=>({keypoints:[{name:'left_wrist',score:1,x:900,y:a},{name:'right_wrist',score:1,x:380,y:b}]});
 g.updatePhysics(390,844,pose(400,400));assert.equal(g.targetSteer,0);g.updatePhysics(390,844,pose(320,480));assert(g.targetSteer>0,'Lowering the screen-right hand must steer right');
 const {game:f,window:fw}=engine('voo','game_flight');f.init({mode:'FREE'});fw.ArcadeControls.mode='camera';fw.System.video={videoWidth:1280,videoHeight:960};f.pilot.baseY=400/960*844;for(let i=0;i<30;i++)f._readPose(pose(400,400),390,844,1/60);assert(Math.abs(f.pilot.targetRoll)<.001);assert(Math.abs(f.pilot.targetPitch)<.001,'A larger video resolution cannot invent a climb command');
});
test('OTThi: the family portrait fits all four at different depths after fetching and while following',()=>{
 const context=vm.createContext({console,window:{addEventListener(){}},performance:{now:()=>100}});
 vm.runInContext(readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),context);
 vm.runInContext(`const input={cameraDrag:false},player={x:0,z:6,vx:0,vz:0,vehicle:false,boating:false};let currentHouse=null,innerWidth=390,innerHeight=844;const groundHeightAt=(x,z)=>0;`,context);
 vm.runInContext(readFileSync('games/otthi/src/modules/41-family-adventure.js','utf8'),context);
 const result=vm.runInContext(`
  familyWorld.ready=true;familyWorld.location={x:0,z:0};familyWorld.portraitUntil=Infinity;
  const failures=[];
  const formations=[[[0,0],[1.6,0],[0,1.4],[1.6,1.4]],[[0,0],[1.6,0],[-1.5,4.5],[1.6,1.4]],[[0,0],[1.6,0],[4.5,3.5],[-1,1]],[[0,0],[1.6,2],[-4.5,-3],[5,4]]];
  for(const [w,h] of [[390,844],[844,390],[360,800],[1365,768]])for(const formation of formations){
   innerWidth=w;innerHeight=h;familyWorld.actors=Object.fromEntries(['thiago','thamis','luna','liz'].map((id,i)=>[id,{id,x:formation[i][0],z:formation[i][1]}]));
   const frame=familyCameraFrame(),camera=new THREE.PerspectiveCamera(frame.fov,w/h,.05,1200);camera.position.copy(frame.position);camera.lookAt(frame.look);camera.updateMatrixWorld(true);
   for(const a of Object.values(familyWorld.actors))for(const dx of[-.5,.5])for(const dy of[0,a.id==='luna'||a.id==='liz'?1:2.3])for(const dz of[-.5,.5]){
    const p=new THREE.Vector3(a.x+dx,dy,a.z+dz).project(camera);
    if(Math.abs(p.x)>.9||Math.abs(p.y)>.8||p.z>=1)failures.push({w,h,id:a.id,point:p.toArray()});
   }
  }failures;
 `,context);
 assert.equal(result.length,0,JSON.stringify(result));
});

test('flight: analog diagonal strength and manual trigger remain independent; bullets still require a lock',()=>{
 const {game:g,advance}=engine('voo','game_flight');g.init({mode:'SINGLE'});g.manualStick={active:true,x:.45,y:.25};
 for(let i=0;i<30;i++)g._readPose(null,390,844,1/60);
 assert(g.pilot.targetRoll>.4&&g.pilot.targetRoll<.5);assert(g.pilot.targetPitch>.2&&g.pilot.targetPitch<.3);
 g.entities=[{type:'jet',x:0,y:3000,z:4000,hp:150,vx:0,vy:0,vz:0}];g.ship.roll=g.ship.pitch=0;
 const step=()=>{advance(1000/60);g._processCombat(1/60,390,844)};
 for(let i=0;i<45;i++)step();assert(g.combat.locked);assert.equal(g.bullets.length,0,'Manual mode must wait for the trigger');
 g.manualFireHeld=true;step();assert(g.bullets.length>0);const count=g.bullets.length;
 g.manualFireHeld=false;for(let i=0;i<10;i++)step();assert.equal(g.bullets.length,count);
 g.manualFireHeld=true;g.entities[0].x=4000;for(let i=0;i<10;i++)step();assert.equal(g.bullets.length,count,'A trigger cannot bypass target lock');
});

import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
function fixture(){
 const module={exports:{}};vm.runInNewContext(readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),{module,exports:module.exports,console});const T=module.exports,storage=new Map();
 const element=()=>{const children=new Map();return {style:{},dataset:{},getContext:()=>({fillRect(){},beginPath(){},lineTo(){},closePath(){},fill(){}}),children:[],clientHeight:156,hidden:false,innerHTML:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},append(){},prepend(){},insertAdjacentHTML(){},remove(){},focus(){},querySelector:s=>{if(!children.has(s))children.set(s,element());return children.get(s)},querySelectorAll:()=>[],getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})};};
 const player={x:-18,y:0,z:39,vehicle:false,boating:false,transit:{mode:''}},scene=new T.Scene(),camera=new T.PerspectiveCamera(55,844/390,.1,1500),state={ui:{quickOpen:false},profile:{playerId:'test'},position:{x:-18,y:0,z:39},familyAdventure:{party:{controller:'thiago',members:['thiago','luna','liz']}}};
 const context=vm.createContext({URL,URLSearchParams,THREE:T,window:{addEventListener(){},OTTHI_COOP:{active:()=>null}},document:{createElement:element,body:{...element(),dataset:{}},head:element(),addEventListener(){},getElementById:id=>id==='quickBar'?element():null,querySelector:()=>null},console,performance:{now:()=>100},setInterval(){},setTimeout(){},clearTimeout(){},requestAnimationFrame(){},location:{search:''},innerWidth:844,innerHeight:390,OT_CHILD_WORLD:true,createCivilianAirframe:()=>new T.Group(),running:true,paused:false,currentHouse:null,buildMode:null,activeRace:null,player,playerGroup:new T.Group(),contactShadow:new T.Group(),toolVisual:new T.Group(),camera,scene,renderer:{info:{render:{calls:42}}},cameraYaw:0,cameraPitch:0,cameraZoom:0,state,world:{colliders:[],houses:[]},WORLD_LAYOUT_V704:{roads:[{x:0,z:0,w:18,d:210},{x:0,z:0,w:210,d:18}]},v704PointInRect:(p,r,m=0)=>Math.abs(p.x-r.x)<=r.w/2+m&&Math.abs(p.z-r.z)<=r.d/2+m,v704HighwaySegments:()=>[],v704WorldBounds:()=>({minX:-190,maxX:190,minZ:-190,maxZ:190}),groundHeightAt:()=>0,professionalTerrainHeightAt:()=>0,safePointNear:(x,z)=>({x,y:0,z}),waterAt:()=>false,positionBlockedForPlayer:()=>false,trafficActorList:()=>[],savePlayerPosition(){},syncMobilePanels(){},clearMovementInputs(){},safePointerCapture(){},updateVisualLOD(){},updateCamera(){},updateContext(){},toast(){},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),safeLocalGet:k=>storage.get(k),safeLocalSet:(k,v)=>storage.set(k,v),OTTHI_GAME_WEB_BUILD:'test-build',OTTHI_GAME_LIVE_BASE:'http://test/games/otthi/'});
 context.window.THREE=T;vm.runInContext(readFileSync('enhancements/combat-visuals.js','utf8'),context);context.OTCombatArt=context.window.OTCombatArt;context.campaignAircraftHeight=id=>id==='plane'?1.3:id==='balloon'?1.05:1.6;context.campaignCreateAircraft=id=>context.otGamesAirframe(id);
 vm.runInContext(readFileSync('games/otthi/src/modules/42-ot-games-modes.js','utf8'),context);const g=vm.runInContext('otGames',context);g.assets=JSON.parse(readFileSync('games/otthi/assets/ot-games-airframes.json','utf8'));return {context,g,api:context.window.OT_GAMES,T,player,state,storage,scene,camera,step:dt=>context.updateOtGames(dt)};
}
test('OT Games: every mode uses the original scene while aerial bodies, family selection and peaceful saved coordinates remain separate',async()=>{
 const f=fixture(),snapshot=JSON.stringify(f.state),position={...f.player};
 for(const mode of ['helicopter','plane','balloon']){
  assert(await f.api.enter(mode,{armed:false,...(mode==='balloon'?{boarding:{id:'balloon',x:0,z:0,yaw:0}}:{})}));assert(f.g.group.parent===f.scene);assert.equal(f.api.diagnostics().enemies.length,0);f.g.move={x:.2,y:.7};f.g.collective=.8;for(let i=0;i<120;i++)f.step(1/60);assert.deepEqual(f.player,position);assert.equal(JSON.stringify(f.state),snapshot);assert(f.g.body.z!==position.z||f.g.body.y!==position.y);f.api.peace();assert(!f.api.diagnostics().active);assert.equal(f.scene.children.length,0);assert.equal(JSON.stringify(f.state),snapshot);
 }
});
test('campaign aircraft: a plane remains parked without throttle, rolls on the runway, and only lifts after sufficient speed and a pull on the stick',async()=>{
 const f=fixture();await f.api.enter('plane',{armed:false,groundLaunch:true,boarding:{x:-5,z:-165,yaw:Math.PI/2}});const g=f.g,p={...g.body};
 g.move.y=1;for(let i=0;i<240;i++)f.step(1/60);assert.equal(g.onGround,true);assert.equal(g.body.x,p.x);assert.equal(g.body.y,1.3);assert.equal(g.airspeed,0);
 g.move.y=0;g.collective=1;for(let i=0;i<165;i++)f.step(1/60);assert(g.body.x>p.x+15);assert(g.onGround,'a fast plane with a neutral stick remains on its wheels');
 g.move.y=.7;for(let i=0;i<70;i++)f.step(1/60);assert.equal(g.onGround,false);assert(g.body.y>2);assert.equal(g.flightPhase,'airborne');
 f.context.otGamesClearInput();assert.equal(g.collective,0,'releasing/pause cannot start a parked campaign plane');
});
test('campaign aircraft: landing a plane requires a real runway and matching attitude; a helicopter settles on the actual ground',async()=>{
 const f=fixture();f.context.campaignLandingZone=(mode,b)=>Math.abs(b.z+165)<4.6&&Math.abs(b.x-27)<39&&Math.abs(Math.cos(b.yaw))<.3;
 await f.api.enter('plane',{armed:false,groundLaunch:true,boarding:{x:-5,z:-165,yaw:Math.PI/2}});const g=f.g;g.onGround=false;g.airspeed=18;Object.assign(g.body,{x:0,y:1.35,z:-165,yaw:Math.PI/2,pitch:-.06,roll:0});f.step(.033);assert(g.onGround);g.collective=0;for(let i=0;i<180;i++)f.step(1/60);assert(g.airspeed<.01);assert(g.body.y===1.3);
 f.api.peace();await f.api.enter('helicopter',{armed:false,groundLaunch:true,boarding:{x:50,z:-165,yaw:0}});g.collective=.8;for(let i=0;i<100;i++)f.step(1/60);assert(!g.onGround);assert(g.body.y>4);g.collective=.1;for(let i=0;i<350;i++)f.step(1/60);assert(g.onGround);assert.equal(g.body.y,1.6);
});
test('OT real camera: right-hand aim and right helicopter pedal turn toward a target visibly on the right of the screen',async()=>{
 const f=fixture();let g;await f.api.enter('helicopter',{armed:false});g=f.g;g.body.yaw=0;for(let i=0;i<30;i++)f.context.otGamesCamera(.1);const t=new f.T.Vector3(g.body.x-12,g.body.y,g.body.z+50),p=t.clone().project(f.camera).x;g.pedal=1;for(let i=0;i<15;i++)f.step(.016);assert(Math.abs(t.clone().project(f.camera).x)<Math.abs(p));
});
test('open-world flight: a helicopter can climb above the new snowy mountain peaks',async()=>{
 const f=fixture();f.context.groundHeightAt=()=>124;f.context.professionalTerrainHeightAt=()=>124;await f.api.enter('helicopter',{armed:false});f.g.body.y=126;f.g.collective=.9;for(let i=0;i<1800;i++)f.step(1/60);assert(f.g.body.y>200);assert(f.g.body.y<400);assert(!f.g.onGround);
});

test('civil world: ground combat cannot be started and an armed flight request stays unarmed',async()=>{
 const f=fixture();assert.equal(await f.api.enter('ground',{armed:true}),false);assert(!f.g.active);assert.equal(f.scene.children.length,0);assert(await f.api.enter('helicopter',{armed:true}));assert.equal(f.g.armed,false);assert.equal(f.g.enemies.length,0);assert.equal(f.g.bullets.length,0);assert.equal(f.storage.size,0);
});
test('civil world: modal and occupied vehicles prevent a conflicting entry, while the current cooperative world can use a balloon',async()=>{
 const f=fixture();f.context.paused=true;assert.equal(await f.api.enter('plane'),false);f.context.paused=false;f.player.vehicle=true;assert.equal(await f.api.enter('plane'),false);f.player.vehicle=false;f.context.window.OTTHI_COOP.active=()=>({id:'active'});assert(await f.api.enter('balloon',{boarding:{id:'balloon',x:0,z:0,yaw:0}}));assert.equal(f.g.armed,false);
});

test('aerial camera: improves distant depth precision and restores the walking clip plane',async()=>{
 for(const mode of ['plane','helicopter','balloon']){
  const f=fixture(),before=f.camera.near;await f.api.enter(mode,{armed:false,...(mode==='balloon'?{boarding:{id:'balloon',x:0,z:0,yaw:0}}:{})});
  f.context.otGamesCamera(.016);assert(f.camera.near>=1,'Flight camera depth precision must improve without shrinking the scene');f.api.peace();assert.equal(f.camera.near,before,'Walking close objects must retain the original camera');
 }
});

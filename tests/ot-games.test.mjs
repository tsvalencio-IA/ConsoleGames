import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
function fixture(){
 const module={exports:{}};vm.runInNewContext(readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),{module,exports:module.exports,console});const T=module.exports,storage=new Map();
 const element=()=>{const children=new Map();return {style:{},dataset:{},children:[],clientHeight:156,hidden:false,innerHTML:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},append(){},prepend(){},insertAdjacentHTML(){},remove(){},focus(){},querySelector:s=>{if(!children.has(s))children.set(s,element());return children.get(s)},querySelectorAll:()=>[],getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})};};
 const player={x:-18,y:0,z:39,vehicle:false,boating:false,transit:{mode:''}},scene=new T.Scene(),camera=new T.PerspectiveCamera(55,844/390,.1,1500),state={ui:{quickOpen:false},profile:{playerId:'test'},position:{x:-18,y:0,z:39},familyAdventure:{party:{controller:'thiago',members:['thiago','luna','liz']}}};
 const context=vm.createContext({URL,URLSearchParams,THREE:T,window:{addEventListener(){},OTTHI_COOP:{active:()=>null}},document:{createElement:element,body:{...element(),dataset:{}},head:element(),addEventListener(){},getElementById:id=>id==='quickBar'?element():null,querySelector:()=>null},console,performance:{now:()=>100},setInterval(){},setTimeout(){},clearTimeout(){},requestAnimationFrame(){},location:{search:''},running:true,paused:false,currentHouse:null,buildMode:null,activeRace:null,player,playerGroup:new T.Group(),contactShadow:new T.Group(),toolVisual:new T.Group(),camera,scene,renderer:{info:{render:{calls:42}}},cameraYaw:0,cameraPitch:0,cameraZoom:0,state,world:{colliders:[],houses:[]},WORLD_LAYOUT_V704:{roads:[{x:0,z:0,w:18,d:210},{x:0,z:0,w:210,d:18}]},v704WorldBounds:()=>({minX:-190,maxX:190,minZ:-190,maxZ:190}),groundHeightAt:()=>0,professionalTerrainHeightAt:()=>0,safePointNear:(x,z)=>({x,y:0,z}),waterAt:()=>false,positionBlockedForPlayer:()=>false,trafficActorList:()=>[],savePlayerPosition(){},syncMobilePanels(){},clearMovementInputs(){},safePointerCapture(){},updateVisualLOD(){},updateCamera(){},updateContext(){},toast(){},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),safeLocalGet:k=>storage.get(k),safeLocalSet:(k,v)=>storage.set(k,v),OTTHI_GAME_WEB_BUILD:'test-build',OTTHI_GAME_LIVE_BASE:'http://test/games/otthi/'});
 vm.runInContext(readFileSync('games/otthi/src/modules/42-ot-games-modes.js','utf8'),context);const g=vm.runInContext('otGames',context);g.assets=JSON.parse(readFileSync('games/otthi/assets/ot-games-airframes.json','utf8'));return {context,g,api:context.window.OT_GAMES,T,player,state,storage,scene,camera,step:dt=>context.updateOtGames(dt)};
}
test('OT Games: every mode uses the original scene while aerial bodies, family selection and peaceful saved coordinates remain separate',async()=>{
 const f=fixture(),snapshot=JSON.stringify(f.state),position={...f.player};
 for(const mode of ['helicopter','plane','ground']){
  assert(await f.api.enter(mode,{armed:false}));assert(f.g.group.parent===f.scene);assert.equal(f.api.diagnostics().enemies.length,0);f.g.move={x:.2,y:.7};f.g.collective=.8;for(let i=0;i<120;i++)f.step(1/60);assert.deepEqual(f.player,position);assert.equal(JSON.stringify(f.state),snapshot);assert(f.g.body.z!==position.z||f.g.body.y!==position.y);f.api.peace();assert(!f.api.diagnostics().active);assert.equal(f.scene.children.length,0);assert.equal(JSON.stringify(f.state),snapshot);
 }
});
test('OT Games: live projectiles complete both sectors; a confirmed win saves once only in the combat career',async()=>{
 const f=fixture();await f.api.enter('ground',{armed:true,difficulty:'easy'});const g=f.g;g.body.hp=1000;g.level.damage=0;g.obstacles=[];g.fire=true;let steps=0;
 while(g.state==='PLAYING'&&steps++<6000){const e=g.enemies.find(e=>e.active);if(e){const dx=e.x-g.body.x,dz=e.z-g.body.z;g.body.yaw=Math.atan2(dx,dz);g.body.pitch=Math.atan2(e.y-g.body.y,Math.hypot(dx,dz));}f.step(1/60);}
 assert.equal(g.state,'VICTORY');assert.equal(g.kills,6);assert.equal(g.wave,2);const career=JSON.parse(f.storage.get(g.careerKey));assert.equal(career.wins,1);assert.equal(career.lastDifficulty,'easy');const dead=g.enemies.find(e=>!e.active);f.context.otGamesDamage(dead,500);f.context.otGamesSaveResult(true);assert.equal(g.kills,6);assert.equal(JSON.parse(f.storage.get(g.careerKey)).wins,1);assert.equal(f.storage.size,1);assert.deepEqual(f.state.position,{x:-18,y:0,z:39});
});
test('OT Games: failed and blocked battles never count a victory; hand calibration and tracking loss freeze damage and movement',async()=>{
 const f=fixture();await f.api.enter('ground',{armed:true});const before={...f.g.body};f.g.state='HAND_CALIBRATION';f.g.move.y=1;for(let i=0;i<100;i++)f.step(.016);assert.deepEqual({...f.g.body},before);f.g.state='PLAYING';f.g.handSession={dispose(){}};f.g.handAim={fresh:false};f.step(1);assert.deepEqual({...f.g.body},before);f.g.handSession=null;f.g.body.hp=0;f.step(.016);assert.equal(f.g.state,'DEFEAT');assert.equal(f.storage.size,0);
});
test('OT Games: a modal, vehicle or active co-op mission prevents entering a second conflicting mode',async()=>{
 const f=fixture();f.context.paused=true;assert.equal(await f.api.enter('plane'),false);f.context.paused=false;f.player.vehicle=true;assert.equal(await f.api.enter('plane'),false);f.player.vehicle=false;f.context.window.OTTHI_COOP.active=()=>({id:'active'});assert.equal(await f.api.enter('ground'),false);assert(!f.g.active);assert.equal(f.scene.children.length,0);
});
test('OT Games: a late camera permission cannot attach a ground hand controller to a new aircraft session',async()=>{
 const f=fixture();let resolve,stopped=0,controllers=0;f.context.navigator={mediaDevices:{getUserMedia:()=>new Promise(r=>resolve=r)}};f.context.window.WarHandControl={start(){controllers++;return {dispose(){}}}};await f.api.enter('ground');const pending=f.context.otGamesStartCamera();await Promise.resolve();f.api.peace();await f.api.enter('helicopter',{armed:false});resolve({getTracks:()=>[{stop:()=>stopped++}]});await pending;assert.equal(controllers,0);assert.equal(stopped,1);assert.equal(f.g.mode,'helicopter');assert.equal(f.g.state,'PLAYING');assert.equal(f.g.handSession,null);
});
test('OT Games: each sector spawns nearby, separated targets with an unobstructed shot instead of scattering them behind houses across town',async()=>{
 const f=fixture();f.context.world.colliders=[{x:-18,z:18,w:12,d:6,h:8}];await f.api.enter('ground',{armed:true,difficulty:'easy'});const g=f.g;assert(g.enemies.length>0);assert.equal(g.state,'PLAYING');
 for(const e of g.enemies){assert(Math.hypot(e.x-g.body.x,e.z-g.body.z)<45);assert(!f.context.otGamesBlocked(g.body,e));for(const other of g.enemies)if(other!==e)assert(Math.hypot(e.x-other.x,e.z-other.z)>=6);}
});
test('OT Games: front-camera ground mode advances without a joystick and freezes on calibration, lost tracking and completed missions',async()=>{
 const f=fixture();await f.api.enter('ground',{armed:false});const g=f.g;g.handSession={dispose(){}};g.handAim={x:.5,y:.48,fresh:true,present:true};const p={...g.body};f.step(.5);assert(Math.hypot(g.body.x-p.x,g.body.z-p.z)>1);assert(g.autoWalking);
 for(const state of ['HAND_CALIBRATION','VICTORY']){g.state=state;const stopped={...g.body};f.step(.5);assert.deepEqual({...g.body},stopped);}
 g.state='PLAYING';g.handAim.fresh=false;const stopped={...g.body};f.step(.5);assert.deepEqual({...g.body},stopped);assert(!g.autoWalking);
});
test('OT Games: a lethal projectile in the final-kill frame resolves as defeat and cannot award a contradictory victory',async()=>{
 const f=fixture();await f.api.enter('ground',{armed:true,difficulty:'easy'});const g=f.g;for(const e of g.enemies)e.active=false;const e=g.enemies[0];e.active=true;e.hp=50;e.aim=999;g.goal=1;g.body.hp=g.level.damage;g.obstacles=[];
 f.context.otGamesShot(e,new f.T.Vector3());f.context.otGamesShot(g.body,new f.T.Vector3(),true);f.step(.016);assert.equal(g.kills,1);assert.equal(g.body.hp,0);assert.equal(g.state,'DEFEAT');assert.equal(f.storage.size,0);assert(g.resultSaved);
});
test('OT Games: detailed combat models keep articulated limbs and spinning rotors while batching rigid equipment',async()=>{
 const f=fixture();await f.api.enter('ground',{armed:true});const g=f.g,soldier=g.enemies.find(e=>e.kind==='soldier'),drone=g.enemies.find(e=>e.kind==='drone');let draws=0;soldier.group.traverse(o=>{if(o.isMesh)draws++;});assert.equal(draws,3);assert.equal(soldier.legs.length,2);assert(soldier.rigid.geometry.getAttribute('position').count>1000);const old=drone.rotors[0].rotation.y;f.step(.1);assert.notEqual(drone.rotors[0].rotation.y,old);
});

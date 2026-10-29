import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
import {engine} from './helpers/game-fixture.mjs';import {dancePose} from './helpers/dance-pose-fixture.mjs';import {RealtimeFixture,networkEngine} from './helpers/realtime-fixture.mjs';
const start=(id='patrol',difficulty='normal')=>{const f=engine('ar','game_ar',{difficulty});f.game.init({id});return f.game;};
test('WAR campaign: every sector spawns outside physical cover, objectives stay reachable, and the fortress retains four sectors',()=>{
 const layouts=[];
 for(const id of ['patrol','city','extraction'])for(const difficulty of ['easy','normal','hard']){
  const g=start(id,difficulty);if(difficulty==='normal')layouts.push(JSON.stringify(g.covers));assert.equal(g.mission.route.length,g.mission.waves);
  if(id==='extraction')assert.equal(g.mission.waves,4);
  for(let i=0;i<g.mission.waves;i++){
   g.spawnWave();for(const e of g.enemies){assert(e.x>=-29&&e.x<=29&&e.z>=0&&e.z<=72);assert(!g.covers.some(c=>Math.abs(e.x-c.x)<c.w/2+.7&&Math.abs(e.z-c.z)<c.d/2+.7),id+'/'+difficulty+' actor spawned inside cover');}
   const p=g.objectivePoint();assert(!g.covers.some(c=>Math.abs(p.x-c.x)<c.w/2+.55&&Math.abs(p.z-c.z)<c.d/2+.55));
  }
 }
 assert.equal(new Set(layouts).size,3);
});
test('WAR city: capture progresses under distant attack, stops outside or contested, and cannot skip surviving enemies',()=>{
 const g=start('city');g.spawnWave();const p=g.objectivePoint();Object.assign(g.player,p);g.enemies=[{id:'guard',kind:'soldier',x:25,z:65,y:1.15,hp:100,active:true,aim:999}];
 assert.equal(g.advanceOperation(2),false);assert.equal(g.objective.progress,2);g.player.x=25;g.advanceOperation(2);assert.equal(g.objective.progress,2);
 Object.assign(g.player,p);Object.assign(g.enemies[0],p);g.advanceOperation(2);assert.equal(g.objective.progress,2);g.enemies[0].x=25;g.advanceOperation(10);assert.equal(g.objective.progress,g.objective.required);assert.equal(g.wave,1);assert.equal(g.state,'PLAYING');
 g.enemies[0].active=false;g.advanceOperation(.1);assert.equal(g.objective.secured,1);assert.equal(g.objective.phase,'approach');
});
test('WAR fortress: actual aligned shots disable transmitters; a transmitter never attacks the user',()=>{
 const g=start('extraction');g.spawnWave();const relay=g.enemies.find(e=>e.kind==='relay');assert(relay);g.enemies=[relay];relay.aim=0;g.covers=[];
 g.step(2);assert.equal(g.player.hp,100);g.player.yaw=Math.atan2(relay.x,relay.z);g.player.pitch=Math.atan2(relay.y-g.eyeY,Math.hypot(relay.x,relay.z));
 for(let i=0;i<3;i++){g.shotCooldown=0;assert(g.shoot());}assert.equal(relay.active,false);assert.equal(g.stats.hits,3);g.advanceOperation(20);assert.equal(g.wave,1,'defeating the transmitter must not teleport to the next sector');
});
test('WAR camera: assisted traversal reaches every extraction without entering cover; body loss and crouch stop it',()=>{
 for(const id of ['patrol','city','extraction']){
  const g=start(id);g.handSession={autoAdvance:true,requiresBody:true,dispose(){}};g.bodyPose={fresh:true,calibrated:true,moveX:0,moveZ:0,crouched:false,lean:0,turnYaw:0};g.handAim={x:.5,y:.48,fresh:true,present:true,timestamp:1000};g.waveDelay=0;let frames=0,last=0;
  while(g.state==='PLAYING'&&frames++<2600){
   if(g.wave!==last){last=g.wave;for(const e of g.enemies)g.defeat(e);}
   g.handAim.timestamp+=50;g.step(.05);assert(!g.covers.some(c=>Math.abs(g.player.x-c.x)<c.w/2+.35&&Math.abs(g.player.z-c.z)<c.d/2+.35),id+' crossed physical cover');
   if(frames===5){const before={...g.player};g.bodyPose.crouched=true;g.step(.2);assert.equal(g.player.x,before.x);assert.equal(g.player.z,before.z);g.bodyPose.crouched=false;g.bodyPose.fresh=false;g.step(.2);assert.equal(g.player.x,before.x);assert.equal(g.player.z,before.z);g.bodyPose.fresh=true;}
  }
  assert.equal(g.state,'VICTORY',id+' assisted path got stuck at '+JSON.stringify(g.player));assert.equal(g.objective.secured,g.mission.waves);
 }
});
test('WAR upper body: missing feet/hips never block calibration or crouching, while missing shoulders releases all controls',()=>{
 const scope={window:{},document:{baseURI:'http://test/'},URL};vm.runInNewContext(fs.readFileSync('games/ar/body-controls.js','utf8'),scope);const c=new scope.window.WarBodyControl.BodyController(),pose=dancePose();for(let i=23;i<33;i++)pose[i].visibility=0;
 for(let t=100;t<=1500;t+=200)c.consume(pose,null,t);assert(c.read(1500).fresh&&c.neutral);assert.equal(c.output.fullBody,false);
 const crouch=pose.map(p=>({...p}));for(const i of [0,11,12,13,14,15,16])crouch[i].y+=.12;assert(c.consume(crouch,null,1700).crouched);pose[11].visibility=0;assert(!c.consume(pose,null,1900).fresh);assert.equal(c.output.turnYaw,0);
 const p=dancePose(),r=scope.window.WarBodyControl.handRegion(p,480,640);assert(r.x>=0&&r.y>=0&&r.x+r.w<=1&&r.y+r.h<=1);assert(Math.abs(r.w*480-r.h*640)<1e-8,'sensor crop must stay square in camera pixels');p[16].visibility=.1;assert.equal(scope.window.WarBodyControl.handRegion(p,480,640),null);
});
test('WAR co-op: all three operations share capture/extraction state and only the host can complete a stage',async()=>{
 for(const id of ['patrol','city','extraction']){
  const db=new RealtimeFixture(),players=[];
  for(const client of ['a','b']){const f=networkEngine('ar','game_ar',db,{client:id+client});f.load('games/ar/multiplayer.js');f.game.init({id:id+'_coop',missionId:id,online:true});players.push(f);await db.settle();}
  const h=players.find(f=>f.game.net.isHost).game,g=players.find(f=>!f.game.net.isHost).game;assert(h.net.start());await db.settle();h.net.step(1.1);
  for(const e of h.enemies)if(!e.ally)e.active=false;h.net.step(10);assert.equal(h.wave,1);const p=h.objectivePoint();Object.assign(g.player,p);g.net.sendPose();await db.settle();h.net.step(id==='city'?7:1);h.net.publish();await db.settle();assert.equal(h.objective.secured,1);assert.equal(JSON.stringify(h.objective),JSON.stringify(g.objective));
  g.objective.secured=999;g.net.sendPose();await db.settle();assert.equal(h.objective.secured,1);h.net.step(1.3);h.net.publish();await db.settle();assert.equal(h.wave,2);assert.equal(g.wave,2);for(const f of players)f.game.cleanup();await db.settle();assert.equal(db.listeners.size,0);
 }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {RealtimeFixture,networkEngine} from './helpers/realtime-fixture.mjs';
const kart=(db,client)=>{const f=networkEngine('kart','game_kart',db,{client});f.game.init({id:'arcade',mode:'RACE',targetRank:3,diff:'MEDIUM'});f.game.selectMode('ONLINE');return f;};
const tennis=(db,client)=>{const f=networkEngine('tenis','game_tennis',db,{client});f.game.init({id:'arcade'});f.game.useMouse=true;f.game.handedness='right';f.game.connectMultiplayer();return f;};
test('kart: two devices on one account remain distinct, ignore bots in election, share race seed and cleanly transfer host',async()=>{
 const db=new RealtimeFixture();await db.write('rooms/mario_arena_titanium_v8/players/bot_0',{lastSeen:db.clock,pos:500});
 const a=kart(db,'kart-a');await db.settle();const b=kart(db,'kart-b');await db.settle();const clients=[a,b],host=clients.find(f=>f.game.isHost),guest=clients.find(f=>!f.game.isHost);
 assert(host&&guest);assert.notEqual(a.game.networkId,b.game.networkId);assert.equal(a.game.liveHumans().length,2);assert.equal(db.read('rooms/mario_arena_titanium_v8/host'),host.game.networkId);
 for(let i=0;i<12;i++){db.clock+=2000;a.heartbeat();b.heartbeat();await db.settle();}assert.equal(a.game.liveHumans().length,2,'waiting in lobby must not expire presence');
 assert(host.game.beginOnlineRace(1));await db.settle();assert.equal(a.game.state,'RACE');assert.equal(b.game.state,'RACE');assert.equal(a.game.matchSeed,b.game.matchSeed);assert.equal(a.game.selectedTrack,b.game.selectedTrack);
 host.game.pos=1234;host.game.playerX=.3;host.game.syncMultiplayer();await db.settle();assert.equal(guest.game.rivals.find(r=>r.id===host.game.networkId).pos,1234);
 const previous=b.game.lastStartedMatch;assert(host.game.beginOnlineRace(2));await db.settle();assert.notEqual(b.game.lastStartedMatch,previous);assert.equal(b.game.selectedTrack,2);
 host.game.cleanup();await db.settle();assert(guest.game.isHost,'a real peer takes over after host leaves');assert.equal(db.read('rooms/mario_arena_titanium_v8/players/'+host.game.peerId),null);
 assert.equal(host.window.System.playerId,'same-account');assert.equal(host.window.Profile.coins,1234);guest.game.cleanup();await db.settle();assert.equal(db.listeners.size,0);
});
test('tennis: atomic match snapshot mirrors ball, score and serving side; guest serve and real paddle hit are authoritative',async()=>{
 const db=new RealtimeFixture(),a=tennis(db,'tennis-a');await db.settle();const b=tennis(db,'tennis-b');await db.settle();const clients=[a,b],host=clients.find(f=>f.game.isHost),guest=clients.find(f=>!f.game.isHost),h=host.game,g=guest.game;
 assert.notEqual(h.playerId,g.playerId);assert(h.startOnlineMatch());await db.settle();assert.equal(g.state,'IDLE');assert.equal(g.matchId,h.matchId);assert.equal(g.server,'p2');
 h.score={p1:3,p2:2};h.server='p2';h.state='SERVE';Object.assign(h.ball,{x:100,y:-220,z:1200,vx:8,vy:-5,vz:60,active:false});h.publishSnapshot();await db.settle();
 assert.equal(g.score.p1,2);assert.equal(g.score.p2,3);assert.equal(g.ball.x,-100);assert.equal(g.ball.z,-1200);assert.equal(g.server,'p1');assert.equal(g.state,'SERVE');
 g.executeAimAssistHit('p1',0,0,150);await db.settle();assert.equal(h.state,'RALLY');assert.equal(h.ball.lastHitBy,'p2');assert.equal(g.state,'RALLY');assert.equal(g.ball.lastHitBy,'p1');
 g.p1.x=150;g.p1.y=-210;g.p1.vx=35;g.p1.vy=-60;g.lastSync=0;g.syncMultiplayer();await db.settle();assert.equal(h.p2.x,-150);assert.equal(h.p2.vx,-35);
 Object.assign(h.ball,{x:h.p2.x,y:h.p2.y,z:h.p2.z-30,vz:90,lastHitBy:'p1'});h.checkPaddleHit();assert.equal(h.ball.lastHitBy,'p2');assert(h.ball.vz<0);
 h.state='RALLY';h.score={p1:10,p2:4};h.scorePoint('p1','PONTO');h.publishSnapshot();await db.settle();assert.equal(g.state,'END_WAIT');assert.equal(g.score.p2,11);
 host.game.cleanup();await db.settle();assert.equal(g.state,'LOBBY');assert(guest.game.isHost);guest.game.cleanup();await db.settle();assert.equal(db.listeners.size,0);assert.equal(guest.window.System.playerId,'same-account');assert.equal(guest.window.Profile.coins,1234);
});
const war=(db,client)=>{const f=networkEngine('ar','game_ar',db,{client});f.load('games/ar/multiplayer.js');f.game.init({id:'patrol_coop',missionId:'patrol',online:true});return f;};
test('WAR co-op: shared NPC waves, player poses, ally safety, authoritative damage/kill credit and one result per player',async()=>{
 const db=new RealtimeFixture(),a=war(db,'war-a');await db.settle();const b=war(db,'war-b');await db.settle();const host=[a,b].find(f=>f.game.net.isHost),guest=[a,b].find(f=>!f.game.net.isHost),h=host.game,g=guest.game;
 assert.notEqual(h.net.id,g.net.id);assert.equal(h.state,'NET_LOBBY');assert(h.net.start());await db.settle();assert.equal(g.state,'PLAYING');assert.equal(h.net.started,g.net.started);
 h.covers=[];g.covers=[];h.net.step(1.1);h.net.publish();await db.settle();assert.equal(h.wave,1);assert.equal(g.wave,1);assert.equal(g.enemies.filter(e=>!e.peerId).length,h.enemies.filter(e=>!e.peerId).length);
 g.player.x=10;g.player.z=3;g.player.yaw=.2;g.net.sendPose();await db.settle();assert.equal(h.enemies.find(e=>e.peerId===g.net.id).x,10);
 const enemy=h.enemies.find(e=>!e.peerId);Object.assign(enemy,{x:10,z:22,hp:68,aim:999});h.net.publish();await db.settle();g.player.yaw=0;g.player.pitch=0;g.net.sendPose();await db.settle();
 assert.equal(g.targetAtAim().id,enemy.id);assert(g.shoot());await db.settle();assert.equal(enemy.hp,34);assert.equal(g.enemies.find(e=>e.id===enemy.id).hp,34);
 db.clock+=200;g.shotCooldown=0;assert(g.shoot());await db.settle();assert.equal(enemy.active,false);assert.equal(g.stats.kills,1);assert.equal(h.stats.kills,0);assert.equal(g.score,100);
 for(const e of h.enemies)if(!e.peerId)e.active=false;h.net.step(3);h.net.publish();await db.settle();assert.equal(g.wave,2);
 const ally=g.enemies.find(e=>e.ally);g.enemies=[ally];Object.assign(g.player,{x:ally.x,z:ally.z-10,yaw:0,pitch:0});assert.equal(g.targetAtAim(),null,'an ally cannot trigger automatic fire');
 const threatening=h.enemies.find(e=>!e.peerId);Object.assign(g.player,{x:20,z:10});Object.assign(threatening,{x:20,z:20,aim:0});g.net.sendPose();await db.settle();h.net.step(.016);h.net.publish();await db.settle();assert(g.player.hp<100,'guest health must receive NPC damage from the host');
 for(const e of h.enemies)if(!e.peerId)e.active=false;h.net.step(3);await db.settle();assert.equal(h.state,'VICTORY');assert.equal(g.state,'VICTORY');assert.equal(h.career.wins,1);assert.equal(g.career.wins,1);h.net.publish();await db.settle();assert.equal(g.career.wins,1);
 const complete=h.state;g.cleanup();await db.settle();assert.equal(h.state,complete,'a partner leaving the result must not cancel the remaining result');h.cleanup();await db.settle();assert.equal(db.listeners.size,0);assert.equal(a.window.Profile.coins,1234);assert.equal(b.window.Profile.coins,1234);assert.equal(a.window.System.playerId,'same-account');
});
test('WAR co-op: camera calibration gates ready state and a disconnect returns the survivor to a real lobby',async()=>{
 const db=new RealtimeFixture(),a=war(db,'war-c');await db.settle();const b=war(db,'war-d');await db.settle();const h=[a,b].find(f=>f.game.net.isHost),g=[a,b].find(f=>!f.game.net.isHost);
 g.game.handSession={controller:{state:'calibrating'},dispose(){}};g.game.state='HAND_CALIBRATION';g.game.net.sendPose();await db.settle();assert.equal(h.game.net.start(),false);
 g.game.handSession.controller.state='ready';g.game.state='PLAYING';g.game.net.sendPose();await db.settle();assert(h.game.net.start());await db.settle();assert.equal(g.game.state,'PLAYING');
 const hostId=h.game.net.id;await db.disconnect(h.client);await db.settle();assert(g.game.net.isHost);assert.equal(g.game.state,'NET_LOBBY');assert.equal(db.read('rooms/thiaguinho_war_patrol_normal/players/'+hostId),null);const replacement=war(db,'war-replacement');await db.settle();g.game.ammo=1;g.game.stats.shots=12;assert(g.game.net.start());await db.settle();assert.equal(g.game.ammo,g.game.gun.mag);assert.equal(g.game.stats.shots,0);assert.equal(replacement.game.ammo,replacement.game.gun.mag);assert.equal(g.game.career.wins,0);g.game.cleanup();replacement.game.cleanup();h.game.cleanup();
});
test('kart: finish stays in the online cup, waits for other humans and accepts podium reward once',async()=>{
 const db=new RealtimeFixture(),a=kart(db,'cup-a');await db.settle();const b=kart(db,'cup-b');await db.settle();const host=[a,b].find(f=>f.game.isHost),guest=[a,b].find(f=>!f.game.isHost),h=host.game,g=guest.game;
 h.beginOnlineRace(0);await db.settle();h.status='FINISHED';h.finalRank=1;h.reward=1250;h.checkRaceStatus();h.syncMultiplayer();await db.settle();assert.equal(h.state,'RACE');assert.equal(h.raceState,'FINISHED');assert(!h.finishTimer,'online finish must not call home/gameOver after three seconds');
 const click={clientX:195,clientY:580};host.window.System.canvas.onpointerdown(click);await db.settle();const coins=host.window.Profile.coins,points=h.cupPoints;assert.equal(h.selectedTrack,0);host.window.System.canvas.onpointerdown(click);await db.settle();assert.equal(host.window.Profile.coins,coins);assert.equal(h.cupPoints,points);
 g.status='FINISHED';g.checkRaceStatus();g.syncMultiplayer();await db.settle();host.window.System.canvas.onpointerdown(click);await db.settle();assert.equal(h.selectedTrack,1);assert.equal(g.selectedTrack,1);assert.equal(host.window.Profile.coins,coins);a.game.cleanup();b.game.cleanup();
});
test('online entry never becomes a silent solo match or hides denied room writes',async()=>{
 for(const [slug,file,phase]of [['kart','game_kart',{id:'arcade',mode:'RACE'}],['tenis','game_tennis',{id:'arcade'}],['ar','game_ar',{id:'patrol_coop',missionId:'patrol',online:true}]]){
  const db=new RealtimeFixture();db.failWrites=true;const f=networkEngine(slug,file,db);if(slug==='ar')f.load('games/ar/multiplayer.js');f.game.init(phase);if(slug==='kart')f.game.selectMode('ONLINE');if(slug==='tenis')f.game.connectMultiplayer();await db.settle();assert(f.messages.some(m=>/SALA|sala|conectar/i.test(m)),slug+' must report room failure');assert.notEqual(f.game.state,'PLAYING');f.game.cleanup();
 }
});

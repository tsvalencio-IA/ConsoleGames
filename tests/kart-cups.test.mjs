import test from 'node:test';
import assert from 'node:assert/strict';
import {RealtimeFixture,networkEngine} from './helpers/realtime-fixture.mjs';
import {canvas} from './helpers/game-fixture.mjs';
function driver(db,phase,id){const f=networkEngine('kart','game_kart',db,{client:id});const data=f.window.gameOptions.phases.find(p=>p.id===phase);f.game.init(data);f.window.System.canvas.onpointerdown({clientX:195,clientY:844*.67});assert(f.game.isOnline,phase+' must offer online from its native mode selector');return f;}
async function pair(phase='f1'){const db=new RealtimeFixture(),a=driver(db,phase,'pilot-a');await db.settle();const b=driver(db,phase,'pilot-b');await db.settle();return {db,a,b,host:[a,b].find(f=>f.game.isHost),guest:[a,b].find(f=>!f.game.isHost)};}
async function physicalStage({db,a,b,host}){
 const id=host.game.lastStartedMatch;let ticks=0;
 for(const f of [a,b])f.game.arcadeManual={throttle:true,left:false,right:false};
 while([a,b].some(f=>f.game.status==='RACING')&&ticks<7000){
  for(const f of [a,b]){const g=f.game;if(g.status==='RACING'){
    const target=.23*Math.sin(ticks/110)+(f===a?-.08:.08);g.arcadeManual.right=g.playerX<target-.035;g.arcadeManual.left=g.playerX>target+.035;g.updatePhysics(390,844,null);if(g.status==='FINISHED')g.checkRaceStatus();
   }else if(g.isHost)g.updateBotDrivers();f.advance(1000/60);
  }
  if(++ticks%8===0){a.game.syncMultiplayer(true);b.game.syncMultiplayer(true);await db.settle();}
 }
 assert(ticks<7000,'actual steering/physics must finish this stage');a.game.syncMultiplayer(true);b.game.syncMultiplayer(true);await db.settle();
 assert.equal(a.game.onlineCup.state,'RESULTS');assert.equal(b.game.onlineCup.state,'RESULTS');assert.equal(a.game.onlineCup.matchId,id);assert(a.game.player.finished&&b.game.player.finished);
 assert.equal(JSON.stringify(a.game.onlineCup.results),JSON.stringify(b.game.onlineCup.results));return ticks;
}
test('kart: native selector connects every campaign, preserves phase/difficulty and isolates different cups',async()=>{
 for(const phase of ['f1','f2','f3','arcade']){const p=await pair(phase);assert(p.host.game.beginOnlineRace());await p.db.settle();for(const f of [p.a,p.b]){assert.equal(f.game.currentFase.id,phase);assert.equal(f.game.onlineCup.phaseId,phase);assert.equal(f.game.state,'RACE');assert.equal(f.game.selectedTrack,f.window.gameOptions.phases.find(x=>x.id===phase).trackId);}p.a.game.cleanup();p.b.game.cleanup();await p.db.settle();}
 const db=new RealtimeFixture(),a=driver(db,'f1','cup-one');await db.settle();const b=driver(db,'f2','coin-only');await db.settle();assert.notEqual(a.game.networkPath,b.game.networkPath);assert.equal(a.game.liveHumans().length,1);assert.equal(a.game.beginOnlineRace(),false);a.game.cleanup();b.game.cleanup();
});
test('kart: two actual drivers complete all three cup circuits, confirm together and see identical earned standings',async()=>{
 const p=await pair(),{db,a,b,host,guest}=p;host.game.beginOnlineRace();await db.settle();let ticks=0;const before={a:a.window.Profile.coins,b:b.window.Profile.coins};
 for(let stage=0;stage<3;stage++){
  assert.equal(a.game.onlineCup.stage,stage);assert.equal(b.game.onlineCup.stage,stage);ticks+=await physicalStage(p);
  const coins=a.window.Profile.coins,points=a.game.cupPoints;host.game.confirmOnlineStage();await db.settle();host.game.confirmOnlineStage();await db.settle();assert.equal(a.window.Profile.coins,coins);assert.equal(a.game.cupPoints,points);assert.equal(a.game.onlineCup.state,'RESULTS');
  guest.game.confirmOnlineStage();await db.settle();assert.equal(a.game.onlineCup.state,stage===2?'CUP_END':'RACING');
 }
 const cup=a.game.onlineCup;assert.equal(Object.keys(cup.results).length,3);assert.equal(cup.standings.length,6);assert.equal(JSON.stringify(cup.standings),JSON.stringify(b.game.onlineCup.standings));
 for(const f of [a,b]){const own=cup.standings.find(s=>s.id===f.game.networkId);assert.equal(own.points,Object.values(cup.results).reduce((n,r)=>n+r.ranking.find(x=>x.id===own.id).points,0));assert(own.points>0);assert(f.game.onlineCupOutcome.complete);f.game.renderOnlineCupEnd(canvas(),390,844);assert.equal(f.game.onlineCup.id,cup.id);}
 assert(a.window.Profile.coins>before.a&&b.window.Profile.coins>before.b);const score=JSON.stringify(cup.standings);a.game.applyOnlineCup(cup);b.game.applyOnlineCup(cup);assert.equal(JSON.stringify(a.game.onlineCup.standings),score);
 host.game.confirmOnlineStage();await db.settle();assert.equal(host.game.state,'LOBBY');assert.equal(guest.game.raceState,'CUP_END');guest.game.confirmOnlineStage();await db.settle();assert.equal(host.game.state,'LOBBY');assert.equal(guest.game.state,'LOBBY');assert.equal(host.game.cupPoints,0);
 host.game.beginOnlineRace();await db.settle();assert.notEqual(host.game.onlineCup.id,cup.id);assert.equal(host.game.onlineCup.stage,0);assert.deepEqual(Object.keys(host.game.onlineCup.results),[]);assert.equal(host.game.cupPoints,0);a.game.cleanup();b.game.cleanup();await db.settle();assert.equal(db.listeners.size,0);console.log('Native three-circuit multiplayer physics ticks:',ticks);
});
test('kart: partner loss freezes cup progress and same-tab reconnect restores the original race checkpoint',async()=>{
 const p=await pair(),{db,a,b,host,guest}=p;host.game.beginOnlineRace();await db.settle();guest.game.pos=1234;guest.game.playerX=.2;guest.game.matchCoins=4;guest.game.score=200;guest.game.syncMultiplayer(true);await db.settle();const id=guest.game.networkId,match=host.game.lastStartedMatch;
 guest.game.cleanup();await db.settle();assert(host.game.networkPaused);assert(host.game.onlineCup.pausedAt>0);const before=host.game.pos;host.advance(100);host.game.update(canvas(),390,844,null);assert.equal(host.game.pos,before);assert.equal(host.game.lastStartedMatch,match);assert.equal(host.game.onlineCup.stage,0);
 guest.game.init(guest.window.gameOptions.phases.find(p=>p.id==='f1'));guest.game.selectMode('ONLINE');await db.settle();assert.equal(guest.game.networkId,id);assert.equal(guest.game.pos,1234);assert.equal(guest.game.matchCoins,4);assert.equal(guest.game.score,200);assert(!host.game.networkPaused);assert.equal(host.game.lastStartedMatch,match);assert.equal(host.game.onlineCup.stage,0);a.game.cleanup();b.game.cleanup();
});
test('kart: real finish timestamps outrank unfinished lap-three distance, including on a guest view',async()=>{
 const {a,b,host,guest,db}=await pair();host.game.beginOnlineRace();await db.settle();host.game.lap=3;host.game.pos=1;host.game.status='FINISHED';host.game.finishTime=db.clock;host.game.syncMultiplayer(true);await db.settle();guest.game.lap=3;guest.game.pos=80000;const rankings=guest.game.getRankings();assert.equal(rankings[0].id,host.game.networkId);assert.equal(host.game.getRankings()[0].id,'player');a.game.cleanup();b.game.cleanup();
});
test('kart: coin hunt and grand prix finish through their actual physics and retain truthful phase objectives',async()=>{
 for(const phase of ['f2','f3']){const p=await pair(phase);p.host.game.beginOnlineRace();await p.db.settle();const planned=p.host.game.onlineCup.tracks.length;
  for(let i=0;i<planned;i++){await physicalStage(p);p.a.game.confirmOnlineStage();p.b.game.confirmOnlineStage();await p.db.settle();}
  for(const f of [p.a,p.b]){const cup=f.game.onlineCup,all=Object.values(cup.results),rank=cup.standings.findIndex(r=>r.id===f.game.networkId)+1,coins=all.reduce((n,r)=>n+r.ranking.find(s=>s.id===f.game.networkId).coins,0);
   assert.equal(cup.state,'CUP_END');assert.equal(all.length,planned);assert.equal(f.game.currentFase.mode,phase==='f2'?'COIN_HUNT':'RACE');assert.equal(f.game.onlineCupOutcome.won,phase==='f2'?coins>=20:rank===1);
  }p.a.game.cleanup();p.b.game.cleanup();
 }
});
test('kart: network shell hits once on the remote driver, armor blocks it, and old-stage attacks cannot replay',async()=>{
 const p=await pair(),{db,host,guest}=p,h=host.game,g=guest.game;h.beginOnlineRace();await db.settle();g.pos=500;g.playerX=0;g.speed=160;g.syncMultiplayer(true);await db.settle();
 h.spawnShell('player',g.networkId,200,0,200);await db.settle();assert(h.projectiles.some(p=>p.networkId));assert(g.projectiles.some(p=>p.networkId));h.updateProjectiles();await db.settle();assert.equal(g.spinTimer,40);assert.equal(g.speed,32);g.applyOnlineImpacts();assert.equal(g.speed,32,'duplicate snapshots cannot apply another impact');
 g.useCustomKart=true;g.garage=[{modelId:5}];g.activeKartIdx=0;g.spinTimer=0;g.speed=120;g.syncMultiplayer(true);await db.settle();h.spawnShell('player',g.networkId,200,0,200);await db.settle();h.updateProjectiles();await db.settle();assert.equal(g.spinTimer,0);assert.equal(g.speed,120,'armored vehicle retains its original protection');
 const stale=g.pendingImpacts;for(const f of [host,guest]){f.game.status='FINISHED';f.game.finishTime=db.clock;f.game.checkRaceStatus();}await db.settle();h.confirmOnlineStage();g.confirmOnlineStage();await db.settle();g.useCustomKart=false;g.speed=100;g.spinTimer=0;g.pendingImpacts=stale;g.applyOnlineImpacts();assert.equal(g.speed,100);assert.equal(g.spinTimer,0);p.a.game.cleanup();p.b.game.cleanup();
});
test('kart: a banana dropped in multiplayer is present on the other track and consumption removes it for both peers',async()=>{
 const p=await pair(),{db,host,guest}=p,h=host.game,g=guest.game;h.beginOnlineRace();await db.settle();h.pos=2000;h.item='banana';h.arcadeManual={throttle:true,itemQueued:true};h.updatePhysics(390,844,null);await db.settle();const entries=Object.entries(g.pendingHazards);assert.equal(entries.length,1);const[id,hazard]=entries[0];assert.equal(hazard.matchId,g.lastStartedMatch);
 g.pos=hazard.pos;g.playerX=hazard.x;g.arcadeManual={throttle:true};g.updatePhysics(390,844,null);await db.settle();assert(g.spinTimer>0);assert(!h.pendingHazards[id]);assert(!g.pendingHazards[id]);p.a.game.cleanup();p.b.game.cleanup();
});
test('kart: only a completed confirmed cup grants native career rewards, including when session storage is unavailable',async()=>{
 const {db,a,b,host,guest}=await pair('f3');let rewards=0;host.window.Profile.addReward=(score,won)=>{rewards++;return {score,won};};host.game.writeOnlineStorage=()=>{};host.game.readOnlineStorage=(kind,fallback)=>fallback;
 host.game.beginOnlineRace();await db.settle();assert.equal(rewards,0);for(const f of [host,guest]){f.game.status='FINISHED';f.game.finishTime=db.clock;f.game.checkRaceStatus();}await db.settle();assert.equal(rewards,0);const money=host.window.Profile.coins;
 host.game.confirmOnlineStage();guest.game.confirmOnlineStage();await db.settle();assert.equal(rewards,1);assert.equal(host.window.Profile.coins,money);host.game.applyOnlineCup(host.game.onlineCup);host.game.applyOnlineCup(host.game.onlineCup);assert.equal(rewards,1);assert.equal(host.window.Profile.coins,money);a.game.cleanup();b.game.cleanup();
});
test('kart: free-mode track preview and chosen AI difficulty are shared, including after host settings change',async()=>{
 const p=await pair('arcade'),{db,host,guest}=p;host.window.ArcadePlaySettings.get=()=>({difficulty:'hard',sensitivity:1});host.game.renderLobby(canvas(),390,844);host.window.System.canvas.onpointerdown({clientX:195,clientY:844*.42});await db.settle();assert.equal(guest.game.selectedTrack,host.game.selectedTrack);assert.equal(host.game.selectedTrack,1);
 host.game.beginOnlineRace();await db.settle();assert.equal(host.game.onlineCup.difficulty,'HARD');assert.equal(guest.game.difficultyName(),'HARD');assert(host.game.localBots.every(b=>b.ai_speedMult>=1.25));host.window.ArcadePlaySettings.get=()=>({difficulty:'easy'});assert.equal(host.game.difficultyName(),'HARD');p.a.game.cleanup();p.b.game.cleanup();
});

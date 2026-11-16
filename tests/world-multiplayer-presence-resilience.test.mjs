import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('games/otthi/assets/js/multiplayer-rtdb.js','utf8');
const presentation=fs.readFileSync('games/otthi/src/modules/28-multiplayer-social-online.js','utf8');
const start=source.indexOf('const PRESENCE_REJOIN_GRACE_MS='),end=source.indexOf('async function ensureRoomReservation(',start);
assert(start>0&&end>start,'isolated original presence recovery logic exists');

function peerSession(){
 let clock=100_000,events=[],callbacks=new Map(),timers=[],heartbeats=0,resumes=0;
 const window={addEventListener(name,fn){callbacks.set(name,fn)}};
 const document={hidden:false,addEventListener(name,fn){callbacks.set(name,fn)}};
 const state={window,document,performance:{now:()=>clock},user:{uid:'self'},
  presenceCache:{},presencePending:new Map(),presenceSweepTimer:0,presenceHeartbeatTimer:0,
  connected:true,api:{},refs:{presence:{}},lastPresence:{name:'My Player'},lastPresenceResume:0,
  multiplayerAllowed:()=>true,isBlocked:()=>false,serverNow:()=>clock,
  presenceIsFresh:(v,now)=>!!(v?.updatedAt&&v.updatedAt>=now-35000),
  dispatch:(type,detail)=>events.push({type,detail}),publish:()=>{heartbeats++;return Promise.resolve(true)},
  recoverOnlineSession:async()=>{resumes++;return true},listenerError:()=>()=>{},
  setInterval:(fn,ms)=>{const t={fn,ms,active:true};timers.push(t);return t},
  clearInterval:t=>{if(t)t.active=false},console
 };
 vm.createContext(state);
 vm.runInContext(source.slice(start,end)+'\nglobalThis.__logic={markPresenceInterrupted,restorePresence,sweepStalePresence,startPresenceSweep,stopPresenceSweep};',state);
 const api=state.__logic;
 return {state,api,window,document,callbacks,timers,events,now:(n=0)=>{clock+=n},get clock(){return clock},get heartbeats(){return heartbeats},get resumes(){return resumes}};
}
test('an interrupted user remains in reconnect grace without false leave and is not counted online',()=>{
 const c=peerSession();c.state.presenceCache.other={updatedAt:c.clock,name:'Another'};
 c.now(36000);c.api.sweepStalePresence();
 assert.equal(c.state.presenceCache.other,undefined);
 assert(c.state.presencePending.has('other'));
 assert(c.events.some(e=>e.type==='otthos:mp-interrupted'&&e.detail.uid==='other'));
 assert(!c.events.some(e=>e.type==='otthos:mp-leave'));
 c.now(15000);c.api.restorePresence('other');
 c.state.presenceCache.other={updatedAt:c.clock,name:'Another'};
 c.api.sweepStalePresence();
 assert.equal(c.state.presencePending.size,0);
 assert.equal(c.events.filter(e=>e.type==='otthos:mp-leave').length,0);
 assert(c.events.some(e=>e.type==='otthos:mp-restored'));
});
test('a player that really remains absent exits only after reconnect grace; repeat events are deduplicated',()=>{
 const c=peerSession();c.state.presenceCache.guest={updatedAt:c.clock,name:'Guest'};
 c.now(36000);c.api.markPresenceInterrupted('guest','connection');
 assert.equal(c.api.markPresenceInterrupted('guest','connection'),false);
 c.now(19000);c.api.sweepStalePresence();
 assert.equal(c.events.filter(e=>e.type==='otthos:mp-leave').length,0);
 c.now(1100);c.api.sweepStalePresence();
 assert.equal(c.events.filter(e=>e.type==='otthos:mp-leave').length,1);
 c.api.sweepStalePresence();
 assert.equal(c.events.filter(e=>e.type==='otthos:mp-leave').length,1);
});
test('separate simulated clients distinguish stale signals from actual exit',()=>{
 const a=peerSession(),b=peerSession();
 a.state.presenceCache.peerB={name:'B',updatedAt:a.clock};
 b.state.presenceCache.peerA={name:'A',updatedAt:b.clock};
 a.now(39000);a.api.sweepStalePresence();
 assert.equal(a.state.presencePending.size,1);
 assert.equal(b.state.presencePending.size,0,'second client has not lost its own connection');
 a.api.restorePresence('peerB');a.state.presenceCache.peerB={updatedAt:a.clock};
 assert.equal(a.state.presencePending.size,0);
 assert(!a.events.some(e=>e.type==='otthos:mp-leave'));
});
test('independent heartbeat and foreground recovery work even when rendering is paused',async()=>{
 const c=peerSession();
 c.api.startPresenceSweep();
 const heartbeat=c.timers.find(t=>t.ms===9000);
 assert(heartbeat,'heartbeat timer must not depend on rendering');
 heartbeat.fn();assert.equal(c.heartbeats,1);
 c.document.hidden=true;heartbeat.fn();assert.equal(c.heartbeats,1);
 c.document.hidden=false;c.now(8000);
 await c.callbacks.get('visibilitychange')();
 await Promise.resolve();
 assert.equal(c.resumes,1);
 c.now(1000);await c.callbacks.get('online')();
 assert.equal(c.resumes,1,'foreground reconnect is debounced');
 c.api.stopPresenceSweep();
 assert.equal(c.timers.filter(t=>t.active).length,0);
});
test('room slots, Firebase onDisconnect and multiplayer V2 remain in place',()=>{
 assert.match(source,/SLOT_TTL_MS=30000/);
 assert.match(source,/onDisconnect\(refs\.presence\)\.remove/);
 assert.match(source,/onDisconnect\(refs\.motionV2\)\.remove/);
 assert.match(source,/onDisconnect\(refs\.slot\)\.remove/);
 assert.match(source,/markPresenceInterrupted\(s\.key,'connection'\)/);
 assert.match(source,/presenceHeartbeatTimer=setInterval/);
 assert.match(presentation,/otthos:mp-interrupted/);
 assert.match(presentation,/otthos:mp-restored/);
 assert.match(presentation,/SINAL INSTÁVEL · RECONECTANDO/);
 assert.match(presentation,/data\.connectionUnstable/);
});

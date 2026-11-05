import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=name=>fs.readFileSync('games/otthi/src/modules/'+name,'utf8');
const loop=read('29-game-loop-controls-gamepad.js');
function scheduler({hz=60,mobile=true,requested='auto',paused=false}={}){
  const counts={draws:0,steps:0,seconds:0,queries:0},events={};
  const c=vm.createContext({
    console,Math,Date,window:{},performance:{now:()=>0},usageLastTickAt:0,running:true,paused,
    document:{hidden:false,addEventListener:(name,fn)=>events[name]=fn,body:{classList:{toggle(){}}}},
    requestAnimationFrame:()=>1,raf:0,clock:{getDelta:()=>1/hz},
    perf:{mobile,loopAcc:0,renderAcc:0,renderedFrames:0,rafSampleAcc:0,rafFrames:0,lastRenderW:390,lastRenderH:844},
    requestedQuality:()=>requested,qualityTier:()=>requested==='low'?'low':requested==='high'?'high':'balanced',
    beginWorldQueryFrame:()=>counts.queries++,endWorldQueryFrame(){},samplePerformance(){},applyPendingRenderBuffer(){},
    renderer:{setScissorTest(){},setViewport(){},render:()=>counts.draws++},scene:{},camera:{},
    world:{},state:{},otGames:{active:false},els:{},playerGroup:{visible:true},
    updateFamilyAdventure(){},updateFamilyPlayableVisuals(){},prepareHomeRender:()=>null,prepareWorldPointLights:()=>null
  });
  vm.runInContext(loop.slice(loop.indexOf('  function targetRenderFrameRate(){'),loop.indexOf('  function setupControls(){')),c);
  c.stepWorldSimulation=dt=>{counts.steps++;counts.seconds+=dt;};
  vm.runInContext(loop.split('\n').find(line=>line.includes("document.addEventListener('visibilitychange'")),c);
  return{c,counts,events,tick:()=>c.gameLoop(),run:seconds=>{for(let i=0;i<hz*seconds;i++)c.gameLoop();}};
}
test('automatic mobile drawing is bounded at 30 FPS across 60/90/120/144Hz displays while physics retains real time',()=>{
  for(const hz of[60,90,120,144]){const f=scheduler({hz});f.run(2);assert(f.counts.draws>=58&&f.counts.draws<=61,`${hz}Hz drew ${f.counts.draws} frames`);assert(Math.abs(f.counts.seconds-2)<.025);assert(f.counts.steps>=118);}
  const desktop=scheduler({mobile:false});desktop.run(2);assert(desktop.counts.draws>=118);
  const manual=scheduler({requested:'high'});manual.run(2);assert(manual.counts.draws>=118);
});
test('pause reduces drawing work and a hidden world neither draws nor simulates or replays background time',()=>{
  const paused=scheduler({paused:true});paused.run(2);assert(paused.counts.draws<=11);assert(paused.counts.steps<=31);
  const hidden=scheduler();hidden.c.document.hidden=true;hidden.c.clock.getDelta=()=>10;hidden.events.visibilitychange();hidden.run(2);
  assert.equal(hidden.counts.draws,0);assert.equal(hidden.counts.steps,0);assert.equal(hidden.c.perf.loopAcc,0);
  hidden.c.document.hidden=false;hidden.events.visibilitychange();hidden.c.clock.getDelta=()=>1/60;hidden.run(1);assert(Math.abs(hidden.counts.seconds-1)<.025);
});
test('flight HUD updates once per painted frame, rather than once for every catch-up physics step',()=>{
  const f=scheduler({hz:144});let updates=0;f.c.otGames.active=true;f.c.otGamesUpdateHUD=()=>updates++;
  f.c.stepWorldSimulation=()=>{f.c.otGames.hudDirty=true;};f.run(2);
  assert(updates>=58&&updates<=61);assert.equal(updates,f.counts.draws);
});
test('parked vehicle broad-phase matches the previous collision predicate for every tested footprint and trailer angle',()=>{
  const source=read('50-fleet-collection.js');
  const legacy=fs.readFileSync('tests/fixtures/parked-collision-v70515.js','utf8');
  const body=s=>s.slice(s.indexOf('  function brazilSpecialFootprint('),s.indexOf('  function brazilDriveProbes('));
  let lookups=0;const c=vm.createContext({Math}),reference=vm.createContext({Math});vm.runInContext(legacy,reference);vm.runInContext(body(source),c);
  let seed=177;const random=()=>{seed=Math.imul(seed,1664525)+1013904223|0;return(seed>>>0)/4294967296;};
  for(const spec of[{front:2.1,rear:-2.4,halfWidth:.8},{front:7,rear:-8,halfWidth:1.3,bus:true},{front:1.64,rear:-9.5,halfWidth:1.02,articulated:true},{front:21,rear:-25,halfWidth:1.5,articulated:true}])for(const angle of[0,.8,-1.1]){
    const root={userData:spec,getObjectByName:()=>{lookups++;return{rotation:{y:angle}};}},v={group:{userData:{brazilRoot:root},position:{x:14,z:-24},rotation:{y:1.32}}};
    for(let i=0;i<5000;i++){const x=v.group.position.x+(random()-.5)*120,z=v.group.position.z+(random()-.5)*120,margin=random()-.25;assert.equal(c.brazilParkedContains(v,x,z,margin),reference.brazilParkedContains(v,x,z,margin));}
    for(const [x,z]of[[0,0],[30,-12],[-14,99]]){v.group.position={x,z};assert.equal(c.brazilParkedContains(v,x,z,.25),reference.brazilParkedContains(v,x,z,.25));}
    lookups=0;for(let i=0;i<1000;i++)assert.equal(c.brazilParkedContains(v,1000+i,-1000,.25),false);assert.equal(lookups,0,'distant probes must not traverse an articulated rig');
    root.userData={...spec,front:2000};assert.equal(c.brazilParkedContains(v,1000,-1000,.25),reference.brazilParkedContains(v,1000,-1000,.25));
  }
  assert.equal(c.brazilParkedContains({group:{userData:{},position:{x:0,z:0},rotation:{y:0}}},0,0),null);
});
test('a manually selected economical profile survives migration on an older mobile device',()=>{
  const source=read('09-responsive-ar-quality-diagnostics.js'),body=source.slice(source.indexOf('  const OTTHI_VISUAL_GOVERNOR_MIGRATION='),source.indexOf('  function detectStableAutoTier('));
  for(const quality of['low','high','auto']){const state={settings:{quality,autoTier:'low'}},c=vm.createContext({state,localStorage:{getItem:()=>null,setItem(){}},matchMedia:()=>({matches:true}),saveState(){}});vm.runInContext(body,c);assert.equal(state.settings.quality,quality);assert.equal(state.settings.autoTier,quality==='auto'?'balanced':'low');}
});

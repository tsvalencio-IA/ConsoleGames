import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {engine} from './helpers/game-fixture.mjs';

test('workshop parking is protected and the boxing academy has its own reachable lot',()=>{
  const c=vm.createContext({window:{},state:{profile:{playerId:'recovery-qa'}},console});
  vm.runInContext(readFileSync('games/otthi/src/modules/05a-world-layout-v704.js','utf8'),c);
  const api=c.window.OTTHI_WORLD_LAYOUT_V704, l=api.layout, yard=l.structures.find(s=>s.id==='workshop-yard'), gym=l.activityVenues.boxing;
  assert(api.reservedAt(-38,-18),'family house and garden are reserved before venues are built');assert(Math.abs(l.activityVenues.dance.z-l.points.familyHome.z)>20);
  assert(yard);assert(api.reservedAt(46,-20),'the previous overlap must remain reserved for parked cars');
  assert(Math.abs(gym.z-yard.z)>(gym.d+yard.d)/2+2);
  assert(api.staticAudit().passed,JSON.stringify(api.staticAudit().problems));
  assert.equal(l.nodes.VB_GATE.x,gym.navX);assert.equal(l.nodes.VB_GATE.z,gym.navZ);
});

test('both autodromes use a validated trip into the original Kart and apply its real result once',()=>{
  const session=new Map(),local=new Map(),storage=m=>({getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}),window={};
  vm.runInNewContext(readFileSync('enhancements/world-venue-trip.js','utf8'),{window,sessionStorage:storage(session),localStorage:storage(local),location:{origin:'https://test.example'},Date,JSON,URL});
  const api=window.WorldVenueTrip;
  for(const id of ['kart-aurora','kart-costa']){
    const token=id+'-1234567890123456';
    assert(api.begin({id,gameId:'drive',token,playerId:'thiago',recordKey:'thia:otthi:venues:v1:thiago',returnUrl:'https://test.example/games/otthi/'}));
    assert.equal(api.current(token,'tennis'),null);assert(api.result(token,'drive',1300,true));assert(api.applyResult(token));assert(api.applyResult(token));
    assert.equal(JSON.parse(local.get('thia:otthi:venues:v1:thiago'))[id].played,1);api.finish(token);
  }
  assert.equal(readFileSync('games/kart/world-venue-trip.js','utf8'),readFileSync('enhancements/world-venue-trip.js','utf8'));
});

test('WAR infantry advances and flanks without entering physical cover or teleporting',()=>{
  const {game:g}=engine('ar','game_ar');g.init({id:'city'});g.spawnWave();
  const e=g.enemies.find(e=>e.kind==='soldier');e.x=-7;e.z=24;e.hp=100;
  let travel=0;
  for(let i=0;i<600;i++){
    const before={x:e.x,z:e.z};g.updateEnemyTactics(e,1/60);
    const moved=Math.hypot(e.x-before.x,e.z-before.z);travel+=moved;
    assert(moved<=1.8/60+.00001);
    assert(!g.covers.some(c=>Math.abs(e.x-c.x)<c.w/2+.35&&Math.abs(e.z-c.z)<c.d/2+.35));
  }
  assert(travel>2);assert(e.stride>0);assert(['advance','flank','cover','suppress'].includes(e.tactic));
});

test('all seven games ship the same audio unlock lifecycle',()=>{
  const source=readFileSync('enhancements/game-audio.js','utf8');
  for(const folder of ['kart','boxe','tenis','ar','voo','otthi','familia/3d'])
    assert.equal(readFileSync('games/'+folder+'/game-audio.js','utf8'),source,folder);
});

test('Vercel packaging gives the installed console a real root URL while preserving the Pages app identity',()=>{
  const original=readFileSync('arcade/manifest.webmanifest','utf8');
  const program="import runpy,json; m=runpy.run_path('tools/package-world-preview.py'); print(json.dumps(m['root_site_manifest'](json.load(open('arcade/manifest.webmanifest')))))";
  const manifest=JSON.parse(execFileSync('python3',['-c',program],{encoding:'utf8'}));
  assert.equal(manifest.id,'/arcade/');assert.equal(manifest.scope,'/');
  assert.equal(new URL(manifest.start_url,'https://test.example/arcade/').pathname,'/arcade/');
  assert.equal(readFileSync('arcade/manifest.webmanifest','utf8'),original);
  assert.equal(JSON.parse(original).id,'/ConsoleGames/arcade/');
  const consoleHtml=readFileSync('arcade/index.html','utf8');
  const consoleProgram="import runpy; m=runpy.run_path('tools/package-world-preview.py'); print(m['root_site_console'](open('arcade/index.html').read()))";
  const packagedHtml=execFileSync('python3',['-c',consoleProgram],{encoding:'utf8'});
  assert.equal(readFileSync('arcade/index.html','utf8'),consoleHtml);
  if(packagedHtml!==consoleHtml+'\n')assert(packagedHtml.includes('href=\"./instalar/\"'));

});

test('the build rejects inconsistent release metadata before producing a playable package',()=>{
  const program="import runpy; m=runpy.run_path('games/otthi/tools/build_project.py'); m['validate_release_identity'](); m['VERSION']['build']='invalid-test-build';\ntry: m['validate_release_identity']()\nexcept RuntimeError as e: print(str(e))\nelse: raise AssertionError('inconsistent metadata was accepted')";
  assert.match(execFileSync('python3',['-c',program],{encoding:'utf8'}),/Release identity mismatch/);
});

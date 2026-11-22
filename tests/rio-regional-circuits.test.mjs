import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function load(path, extras={}){
 const context=vm.createContext({window:{},...extras});
 vm.runInContext(fs.readFileSync(path,'utf8'),context);
 return context;
}

test('Kart Legends samples both supplied curves into finite native sectors and closed minimaps',()=>{
 const c=load('games/kart/js/regional-tracks.js');
 const geometry=vm.runInContext(`window.KartRegionalTracks.tracks.map(track=>{
   const {curves,map,meters}=window.KartRegionalTracks.build(track);
   return {id:track.id,key:track.key,corners:track.points.length,curves,map,meters,sectors:track.sectors};
 })`,c);
 assert.deepEqual(Array.from(geometry,p=>p.key),['mirassol','cedral']);
 for(const track of geometry){
  assert.equal(track.curves.length,720);
  assert.equal(track.map.length,720);
  assert.equal(track.sectors.length,4);
  assert(track.meters>140);
  assert(track.curves.every(v=>Number.isFinite(v)&&Math.abs(v)<=4.61));
  assert(Math.hypot(track.map[0].x-track.map.at(-1).x,track.map[0].z-track.map.at(-1).z)<.5);
 }
 assert(geometry[1].curves.some(curve=>curve>1));
 assert(geometry[1].curves.some(curve=>curve<-1));
 assert.notDeepEqual(geometry[0].curves,geometry[1].curves);
});

test('regional trips use only Kart Legends and retain both earlier gates',()=>{
 const files=['games/otthi/assets/js/world-venue-trip.js','games/kart/world-venue-trip.js'];
 assert.equal(fs.readFileSync(files[0],'utf8'),fs.readFileSync(files[1],'utf8'));
 for(const path of files){
  const context=load(path,{URL,location:{origin:'https://preview.test',pathname:'/games/otthi/'},sessionStorage:{
   setItem(){},getItem(){return null;}
  }});
  const ids=['kart-aurora','kart-costa','kart-mirassol','kart-cedral'];
  for(const id of ids){
   const trip={token:'regional-token-01234',id,gameId:'drive',playerId:'qa',recordKey:'thia:otthi:venues:v1:qa',returnUrl:'https://preview.test/games/otthi/'};
   assert(context.window.WorldVenueTrip.begin(trip));
   assert.equal(context.window.WorldVenueTrip.begin({...trip,gameId:'box_pro'}),null);
   assert.equal(context.window.WorldVenueTrip.begin({...trip,returnUrl:'https://production.test/games/otthi/'}),null);
  }
 }
});

test('World registers regional paddocks without creating another native kart circuit or discarding records',()=>{
 const path='games/otthi/src/modules/';
 const c=load(path+'80-rio-regional-circuits.js');
 vm.runInContext(fs.readFileSync(path+'05a-world-layout-v704.js','utf8'),c);
 assert.deepEqual(Array.from(vm.runInContext('Object.keys(WORLD_LAYOUT_V704.circuits)',c)),['aurora','costa']);
 vm.runInContext("const state={races:{regionalCircuits:{cedral:{bestTime:52.9}}}};",c);
 const {records,circuits}=c.window.OTTHI_RIO_CIRCUITS.diagnostics();
 assert.equal(records.cedral.bestTime,52.9);
 assert(circuits.every(c=>!c.loaded&&c.kind==='kart-legends'));
});

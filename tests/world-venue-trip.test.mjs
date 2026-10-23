import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync('enhancements/world-venue-trip.js','utf8');
function fixture(){
 const session=new Map(),local=new Map(),storage=map=>({getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}),window={};
 runInNewContext(source,{window,location:{origin:'https://example.test'},sessionStorage:storage(session),localStorage:storage(local),URL,Date,JSON});
 return {api:window.WorldVenueTrip,session,local};
}
const data={token:'test-trip-123456789',id:'pingpong',gameId:'tennis',playerId:'player-1',recordKey:'thia:otthi:venues:v1:player-1',returnUrl:'https://example.test/games/otthi/?existing=1',name:'Thiago',label:'Ginásio de Pingue-pongue'};
test('venue trips require the matching origin, game, player and unexpired token',()=>{
 const {api,session}=fixture();assert(api.begin(data));assert(api.current(data.token,'tennis'));assert.equal(api.current('wrong','tennis'),null);assert.equal(api.current(data.token,'box_pro'),null);
 assert.equal(api.begin({...data,returnUrl:'https://foreign.test/games/otthi/'}),null);assert.equal(api.begin({...data,gameId:'drive'}),null);assert.equal(api.begin({...data,recordKey:'users/real-account'}),null);
 const expired={...data,version:1,created:Date.now()-7*60*60*1000};session.set('thia:world-venue:trip:v1',JSON.stringify(expired));assert.equal(api.current(),null);
});
test('native result survives navigation, applies once, and never changes the world save or balance',()=>{
 const {api,local}=fixture();local.set('otthos_life_world_roleplay_v700','{"profile":{"coins":4321,"xp":1234}}');const save=local.get('otthos_life_world_roleplay_v700');assert(api.begin(data));
 assert.equal(api.result(data.token,'tennis',NaN,true),false);assert(api.result(data.token,'tennis',0,false));assert.equal(api.result(data.token,'tennis',1100,true),false);
 assert(api.applyResult(data.token));assert(api.applyResult(data.token));const record=JSON.parse(local.get(data.recordKey)).pingpong;assert.equal(record.played,1);assert.equal(record.wins,0);assert.equal(record.best,0);assert.equal(local.get('otthos_life_world_roleplay_v700'),save);
 const back=new URL(api.returnUrl(data.token));assert.equal(back.searchParams.get('existing'),'1');assert.equal(back.searchParams.get('otVenueReturn'),data.token);assert(api.finish(data.token));assert.equal(api.current(),null);
});
test('venue trip copies used by both activities and the world are identical',()=>{
 for(const path of ['games/otthi/assets/js/world-venue-trip.js','games/boxe/world-venue-trip.js','games/tenis/world-venue-trip.js'])assert.equal(readFileSync(path,'utf8'),source,path);
});

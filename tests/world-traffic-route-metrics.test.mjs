import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync('games/otthi/src/modules/55-world-traffic-and-air.js','utf8');
const begin=source.indexOf(' function trafficRouteMetrics('),end=source.indexOf(' function ensureCompleteBrazilTraffic(',begin);
assert(begin>0&&end>begin);
const math=Object.create(Math);let lengthsComputed=0;
math.hypot=(...args)=>{lengthsComputed++;return Math.hypot(...args)};
const ctx=vm.createContext({Math:math,lerp:(a,b,t)=>a+(b-a)*t});
vm.runInContext(source.slice(begin,end),ctx);
const route=[{x:-50,z:0},{x:3,z:27},{x:55,z:27},{x:41,z:-4},{x:0,z:-22},{x:-50,z:-12}];
test('traffic: route metrics are calculated once for 60 placement attempts',()=>{
 lengthsComputed=0;
 const metrics=ctx.trafficRouteMetrics(route);
 assert.equal(lengthsComputed,route.length);
 for(let i=0;i<60;i++)ctx.trafficRoutePoint(route,.61803398875+i*.027,metrics);
 assert.equal(lengthsComputed,route.length,'no redundant route-length scan inside spawn retry');
});
test('traffic: cached and legacy sampling have identical geometry, direction and segment indexes',()=>{
 const metrics=ctx.trafficRouteMetrics(route);
 for(const fraction of [-1.7,-.2,0,.000001,.125,.3,.5,.61803398875,.99999,1,1.4,4.8]){
  const ordinary=JSON.stringify(ctx.trafficRoutePoint(route,fraction));
  const cached=JSON.stringify(ctx.trafficRoutePoint(route,fraction,metrics));
  assert.equal(cached,ordinary,'fraction '+fraction);
 }
});
test('traffic: degenerate segments and empty-distance edges retain current semantics',()=>{
 const route2=[{x:0,z:0},{x:0,z:0},{x:4,z:0}];
 const metrics=ctx.trafficRouteMetrics(route2);
 for(const fraction of [0,.000001,.5,1,2.5])assert.equal(JSON.stringify(ctx.trafficRoutePoint(route2,fraction,metrics)),JSON.stringify(ctx.trafficRoutePoint(route2,fraction)));
});

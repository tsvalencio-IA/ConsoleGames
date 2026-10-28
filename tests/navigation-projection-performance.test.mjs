import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync('games/otthi/src/modules/07-navigation-traffic-routes.js','utf8'),body=source.slice(source.indexOf('  function nearestRoadProjection('),source.indexOf('  function pointOnRoad('));
// The former exhaustive selection is the behavioural reference, including ties.
function exhaustive(pos,nodes,edges,project,clear){let best=null;for(const[aId,bId]of edges){const p=project(pos,nodes[aId],nodes[bId]),distance=Math.hypot(pos.x-p.x,pos.z-p.z),visible=clear(pos,p),score=distance+(visible?0:120);if(!best||score<best.score)best={aId,bId,point:p,distance,clear:visible,score};}return best;}
const project=(p,a,b)=>{const x=b.x-a.x,z=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*x+(p.z-a.z)*z)/(x*x+z*z||1)));return{x:a.x+x*t,z:a.z+z*t,t};};
test('road projection preserves the exhaustive choice for occlusion, penalties and equal-distance roads',()=>{
 const nodes={},edges=[];for(let i=0;i<150;i++){nodes['a'+i]={x:i%15*17-110,z:Math.floor(i/15)*23-105};nodes['b'+i]={x:nodes['a'+i].x+13,z:nodes['a'+i].z+9};edges.push(['a'+i,'b'+i]);}edges.push(edges[0]);
 const clear=(p,q)=>!(q.x>p.x+4&&q.z<p.z+20),c=vm.createContext({NAV_BASE_NODES:nodes,NAV_BASE_EDGES:edges,projectPointToSegment:project,segmentClear:clear,Math});vm.runInContext(body,c);
 let seed=177;for(let i=0;i<400;i++){seed=Math.imul(seed,1664525)+1013904223|0;const x=(seed>>>0)%480-240;seed=Math.imul(seed,1664525)+1013904223|0;const p={x,z:(seed>>>0)%480-240};assert.deepEqual(JSON.parse(JSON.stringify(c.nearestRoadProjection(p))),exhaustive(p,nodes,edges,project,clear));}
});
test('an unobstructed nearest road needs one line-of-sight query, rather than every road',()=>{
 const nodes={},edges=[];for(let i=0;i<500;i++){nodes['a'+i]={x:i*4,z:0};nodes['b'+i]={x:i*4,z:20};edges.push(['a'+i,'b'+i]);}let calls=0;const c=vm.createContext({NAV_BASE_NODES:nodes,NAV_BASE_EDGES:edges,projectPointToSegment:project,segmentClear:()=>{calls++;return true;},Math});vm.runInContext(body,c);assert.equal(c.nearestRoadProjection({x:.1,z:5}).aId,'a0');assert.equal(calls,1);
});

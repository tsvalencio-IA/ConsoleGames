import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
function layout(id='world-qa'){const c=vm.createContext({window:{},state:{profile:{playerId:id}},console});vm.runInContext(fs.readFileSync('games/otthi/src/modules/05a-world-layout-v704.js','utf8'),c);return c.window.OTTHI_WORLD_LAYOUT_V704;}
test('expanded world: both cities, both circuits and all activity entrances belong to one reachable road graph without crossing protected structures',()=>{
 const api=layout(),l=api.layout;assert(api.staticAudit().passed);assert.equal((l.bounds.maxX-l.bounds.minX)*(l.bounds.maxZ-l.bounds.minZ),1251200);assert.equal(Object.keys(l.cities).length,2);assert.equal(Object.keys(l.circuits).length,2);
 const visited=new Set(['C']);for(let pass=0;pass<l.edges.length;pass++)for(const [a,b]of l.edges){if(visited.has(a))visited.add(b);if(visited.has(b))visited.add(a);}
 for(const id of ['A_C','CV_C','A_RACE','CV_RACE','VB_GATE','VD_GATE','VP_GATE','CQ_GATE','CA_GATE','CN_GATE','COAST_GATE'])assert(visited.has(id),id+' must connect to the original village');
 for(const v of Object.values(l.activityVenues))assert(!api.roadAt(v.x,v.z,0,true),'gym remains off the carriageway');
 assert(!api.reservedAt(94,-91),'the former kartodrome footprint is released');
});
test('expanded world: original vehicle assets are valid binary glTF with four independent wheels and no external dependencies',()=>{
 for(const name of ['ot-racer','ot-coupe']){const b=fs.readFileSync('games/otthi/assets/world/vehicles/'+name+'.glb');assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(8),b.length);const n=b.readUInt32LE(12),doc=JSON.parse(b.subarray(20,20+n).toString());assert.equal(doc.asset.version,'2.0');assert.equal(doc.nodes.filter(n=>n.name.startsWith('wheel-')).length,4);assert(doc.nodes.some(n=>n.name==='paint'));assert(doc.buffers.every(b=>!b.uri));}
});

test('expanded world: all ten personal home placements keep activity buildings, roads and challenge passages separated',()=>{
 const placements=new Set();for(let i=0;i<100&&placements.size<10;i++){const api=layout('layout-'+i),p=api.point('home');placements.add(p.x+':'+p.z);assert(api.staticAudit().passed,JSON.stringify(api.staticAudit().problems));}assert.equal(placements.size,10);
});

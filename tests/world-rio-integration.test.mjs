import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const moduleSource=name=>fs.readFileSync('games/otthi/src/modules/'+name+'.js','utf8');
function makeWorld(){
 const context=vm.createContext({window:{},console,updateWorldExpansion(){}});
 for(const name of ['78-rio-preto-layout','80-rio-regional-circuits','83-rio-v51-layout','05a-world-layout-v704','50-world-road-continuity']){
  vm.runInContext(moduleSource(name),context,{filename:name});
 }
 vm.runInContext('const projectPointToSegment=v704DistanceToSegment;',context);
 return context;
}

test('Rio Preto and both circuit entrances attach to the existing GPS graph and stay inside the live map',()=>{
 const c=makeWorld();
 const data=vm.runInContext(`(()=>{
  const {nodes,edges,highways,bounds}=WORLD_LAYOUT_V704,visited=new Set(['C']),queue=['C'];
  const links=new Map();
  for(const [a,b] of edges){
   if(!nodes[a]||!nodes[b])throw Error('A ligação '+a+' / '+b+' não tem um cruzamento identificado');
   if(!links.has(a))links.set(a,[]);
   if(!links.has(b))links.set(b,[]);
   links.get(a).push(b);links.get(b).push(a);
  }
  for(const id of queue)for(const n of links.get(id)||[])if(!visited.has(n)){visited.add(n);queue.push(n);}
  const newNodes=[...Object.keys(RIO_PRETO_LAYOUT.nodes),...Object.keys(RIO_REGIONAL_ROADS.nodes)];
  const locations=Object.values(RIO_PRETO_LAYOUT.landmarks);
  const circuits=Object.values(RIO_REGIONAL_CIRCUITS);
  const roads=[...RIO_PRETO_LAYOUT.highways,...RIO_REGIONAL_ROADS.highways];
  return {passed:v704StaticWorldAudit(), locations:locations.length,circuits:circuits.length,newNodes:newNodes.length,
   unreachable:newNodes.filter(id=>!visited.has(id)),
   unpavedApproaches:[...locations,...circuits].filter(p=>!v704RoadAt(p.navX,p.navZ,.7,true)).map(p=>p.id),
   regional:roads.every(r=>r.regional&&highways.some(h=>h.id===r.id)),
   circuitReservations:circuits.every(c=>v704ProtectedRectangles().some(p=>p.id==='circuit-'+c.id)),
   inside:roads.every(r=>r.points.every(p=>p.x>bounds.minX&&p.x<bounds.maxX&&p.z>bounds.minZ&&p.z<bounds.maxZ))};
 })()`,c);
 assert(data.passed.passed,JSON.stringify(data.passed.problems));
 assert.equal(data.locations,3);
 assert.equal(data.circuits,2);
 assert(data.newNodes>=18);
 assert.equal(data.unreachable.length,0,JSON.stringify(data.unreachable));
 assert.equal(data.unpavedApproaches.length,0,JSON.stringify(data.unpavedApproaches));
 assert(data.regional&&data.inside&&data.circuitReservations);
});

test('indexed junction markings match a full search including at cell boundaries and on new roads',t=>{
 const c=makeWorld();
 const result=vm.runInContext(`(()=>{
  const routes=worldRoadRoutes();
  worldRoadContinuity.junctions=indexWorldRoadJunctions(routes);
  let oldChecks=0,indexedCandidates=0,samples=0,matches=0;
  const exhaustive=(x,z,road,i)=>{
   const a=road.points[i],b=road.points[(i+1)%road.points.length],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;
   for(const other of routes){
    if(other.id===road.id)continue;
    for(let j=0;j<other.points.length-(other.closed?0:1);j++){
     oldChecks++;
     const c=other.points[j],d=other.points[(j+1)%other.points.length],ox=d.x-c.x,oz=d.z-c.z,ol=Math.hypot(ox,oz)||1;
     if(Math.abs((dx*ox+dz*oz)/(len*ol))>.985)continue;
     const q=projectPointToSegment({x,z},c,d);
     if(Math.hypot(x-q.x,z-q.z)<other.width/2+1.1)return true;
    }
   }
   return false;
  };
  for(const road of routes)for(let i=0;i<road.points.length-(road.closed?0:1);i++){
   const a=road.points[i],b=road.points[(i+1)%road.points.length],steps=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/2.5));
   for(let j=0;j<=steps;j++){
    const fraction=j/steps,x=a.x+(b.x-a.x)*fraction,z=a.z+(b.z-a.z)*fraction;
    const key=Math.floor(x/roadJunctionCellSize)+':'+Math.floor(z/roadJunctionCellSize);
    indexedCandidates+=worldRoadContinuity.junctions.get(key)?.length||0;
    const legacy=exhaustive(x,z,road,i),indexed=roadJunctionAt(x,z,road,i);
    matches+=Number(legacy===indexed);samples++;
   }
  }
  return{matches,samples,oldChecks,indexedCandidates};
 })()`,c);
 t.diagnostic(JSON.stringify(result));
 assert.equal(result.matches,result.samples);
 assert(result.samples>2000);
 assert(result.indexedCandidates<result.oldChecks/4);
});

test('the laboratory catalog routes all 42 places without blocking a road or the street run',t=>{
 const c=makeWorld();
 const result=vm.runInContext(`(()=>{
  const {nodes,edges,highways,bounds}=WORLD_LAYOUT_V704;
  const visited=new Set(['C']),queue=['C'],unjoined=[];
  for(const n of queue)for(const [a,b] of edges){
   const peer=a===n?b:b===n?a:null;
   if(peer&&!visited.has(peer)){visited.add(peer);queue.push(peer);}
  }
  for(const p of RIO_V51.places)if(!Object.entries(nodes).some(([id,at])=>visited.has(id)&&at.x===p.navX&&at.z===p.navZ))unjoined.push(p.id);
  const collisions=[],outOfBounds=[],overlap=[];
  const previous=v704ProtectedRectangles().filter(p=>!p.id?.startsWith('regional-')&&!p.id?.startsWith('represa-footpath-')&&!p.id?.startsWith('lake-'));
  for(const p of RIO_V51.places){
   if(p.nativeVenue)continue;
   const box={x:p.x,z:p.z,w:p.w,d:p.d};
   if(Math.min(p.x-p.w/2-bounds.minX,bounds.maxX-p.x-p.w/2,p.z-p.d/2-bounds.minZ,bounds.maxZ-p.z-p.d/2)<0)outOfBounds.push(p.id);
   for(const road of highways)if(v704HighwayIntersectsRect(road.id,box,0))collisions.push([p.id,road.id]);
   for(const old of previous)if(v704RectOverlap(box,old,0))overlap.push([p.id,old.id]);
  }
  const {route,lakes,gates}=RIO_V51.course,occupied=[...RIO_V51.places,...lakes];
  const runHits=[];
  for(const [i,b] of route.slice(1).entries()){
   const a=route[i],steps=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z));
   for(let j=0;j<=steps;j++){
    const p={x:a.x+(b.x-a.x)*j/steps,z:a.z+(b.z-a.z)*j/steps};
    const hit=occupied.find(box=>v704PointInRect(p,box,1.65));
    if(hit&&!runHits.includes(hit.id))runHits.push(hit.id);
   }
  }
  return{places:RIO_V51.places.length,sectors:Object.keys(RIO_V51.sectors).length,fictional:RIO_V51.places.filter(p=>p.fictional).length,
   collisions,overlap,outOfBounds,unjoined,runHits,gates:gates.length,brokenEdges:edges.filter(([a,b])=>!nodes[a]||!nodes[b])};
 })()`,c);
 t.diagnostic(JSON.stringify(result));
 assert.equal(result.places,42);
 assert.equal(result.sectors,11);
 assert.equal(result.fictional,2);
 assert.equal(result.gates,6);
 for(const key of ['collisions','overlap','outOfBounds','unjoined','runHits','brokenEdges'])assert.equal(result[key].length,0,key);
});

test('each Rio stop has a playable activity or a native system, including the sole Teixeirão field',()=>{
 const c=makeWorld();
 vm.runInContext(moduleSource('85-rio-city-activities'),c);
 const result=vm.runInContext(`(()=>{
  const venue=RIO_V51.places.find(p=>p.nativeVenue==='football');
  const {points}=WORLD_LAYOUT_V704;
  return {
   venue,
   pitch:points.sports,entrance:points.footballEntrance,
   catalog:RIO_V51.places.filter(p=>p.id===venue.id).length,
   duplicateReserve:v704ProtectedRectangles().some(p=>p.id===venue.id),
   unhandled:RIO_V51.places.filter(p=>!p.shop&&!p.nativeVenue&&!RIO_CITY_ACTIVITIES[p.key]&&
    !['prefeitura_andalo','aeroporto_sjrp','portaria_damha'].includes(p.key)).map(p=>p.key)
  };
 })()`,c);
 assert.equal(result.catalog,1);
 assert.equal(result.duplicateReserve,false);
 assert.equal(result.venue.x,result.pitch.x);
 assert.equal(result.venue.z,result.pitch.z);
 assert.equal(result.venue.visitX,result.entrance.x);
 assert.equal(result.venue.visitZ,result.entrance.z);
 assert.equal(result.unhandled.length,0,JSON.stringify(result.unhandled));
});

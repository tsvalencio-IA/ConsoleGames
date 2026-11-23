import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=file=>readFileSync('games/otthi/src/modules/'+file+'.js','utf8');
const catalog=JSON.parse(readFileSync('games/otthi/assets/world/rio-preto-map.json','utf8'));
function compactContext(extra={}){
  const ctx=vm.createContext({window:{},console,regionalRouteVisible:()=>false,...extra});
  for(const module of ['78a-rio-compact-layout','80-rio-regional-circuits','05a-world-layout-v704'])vm.runInContext(source(module),ctx);
  return ctx;
}

test('Rio Preto keeps the original world scale and connects the new streets to the established GPS',()=>{
  const ctx=compactContext();
  const info=vm.runInContext(`(()=>{
    const {highways,nodes,edges,bounds}=WORLD_LAYOUT_V704,links=new Map(),reached=new Set(['C']),queue=['C'];
    for(const [a,b] of edges){
      if(!nodes[a]||!nodes[b])throw Error('Unregistered intersection '+a+' / '+b);
      if(!links.has(a))links.set(a,[]);
      if(!links.has(b))links.set(b,[]);
      links.get(a).push(b);links.get(b).push(a);
    }
    for(const id of queue)for(const next of links.get(id)||[])if(!reached.has(next)){reached.add(next);queue.push(next);}
    return {bounds,checked:v704StaticWorldAudit(),roads:highways.filter(road=>road.id.startsWith('rio-compact-')).length,
      unreachable:Object.keys(RIO_COMPACT_LAYOUT.nodes).filter(id=>!reached.has(id))};
  })()`,ctx);
  assert.deepEqual({...info.bounds},{minX:-850,maxX:850,minZ:-700,maxZ:1100});
  assert.equal(info.roads,2);
  assert.equal(info.unreachable.length,0);
  assert(info.checked.passed,JSON.stringify(info.checked.problems));
});

test('Rio Preto lots preserve all saved identities and keep doors, streets and the Represa path clear',()=>{
  const ctx=compactContext();
  const info=vm.runInContext(`(()=>{
    const lots=RIO_COMPACT_LAYOUT.lots.map(rioCompactLotRect);
    const {roads,highways,zones}=WORLD_LAYOUT_V704,roadsWithSidewalks=roads.map(road=>v704RoadFootprint(road,true));
    const fixed=v704ProtectedRectangles().filter(place=>!place.id.startsWith('rio-compact-'));
    const homes=OTTHI_PERSONAL_HOME_LOTS.map((home,i)=>({...home,id:'home-'+i,w:10.4,d:8.6}));
    const water=[zones.lake,zones.lakeNorth],problems=[];
    for(const lot of lots){
      for(const protectedLot of [...fixed,...homes,...water,zones.construction]){
        if(lot.id.endsWith('prefeitura_andalo')&&protectedLot.id==='castle')continue;
        if(v704RectOverlap(lot,protectedLot,.25))problems.push([lot.id,protectedLot.id]);
      }
      for(const road of roadsWithSidewalks)if(v704RectOverlap(lot,road,.25))problems.push([lot.id,road.id]);
      for(const road of highways)if(v704HighwayIntersectsRect(road.id,lot,.25))problems.push([lot.id,road.id]);
      for(const other of lots)if(lot.id<other.id&&v704RectOverlap(lot,other,.30))problems.push([lot.id,other.id]);
    }
    const path=RIO_COMPACT_LAYOUT.sections;
    let length=0;
    for(let i=1;i<path.length;i++){
      const [x,z]=path[i-1],[a,b]=path[i],metres=Math.hypot(a-x,b-z);
      const steps=Math.ceil(metres/.3);
      for(let j=0;j<=steps;j++){
        const p={x:x+(a-x)*j/steps,z:z+(b-z)*j/steps};
        if([...water,...lots].some(rect=>v704PointInRect(p,rect,.5)))problems.push(['orla',p]);
      }
      length+=metres;
    }
    return {problems,length,ids:RIO_COMPACT_SITES.map(([,id])=>id),lots:lots.length};
  })()`,ctx);
  assert.equal(info.lots,31);
  for(const key of ['candelaro','fiora','salso','fortore','liri','tanaro'])assert(info.ids.includes('regional-rios-italia-'+key),'missing Rios D’Italia condominium '+key);
  assert.deepEqual([...info.ids.slice(0,catalog.sites.length)],catalog.sites.map(site=>site.id));
  assert.equal(info.ids.length,catalog.sites.length+6,'original catalog must survive with six additive residences');
  assert(info.length*2>300);
  assert.equal(info.problems.length,0,JSON.stringify(info.problems.slice(0,12)));
});

test('all existing residences and all six condominiums keep independent stable ownership keys',()=>{
  const ctx=compactContext({expansionMapLocations:()=>[],rioMap:{compact:true}});
  const output=vm.runInContext(source('99-rio-compact-world')+
    "\nJSON.stringify(RIO_COMPACT_LAYOUT.lots.map(compactRioSite).filter(site=>site.kind==='residence').map(site=>({key:site.key,id:site.id,propertyId:site.propertyId})))",ctx);
  const result=JSON.parse(output);
  assert.equal(result.length,11);
  assert.equal(new Set(result.map(site=>site.propertyId)).size,result.length);
  for(const site of result)assert.equal(site.propertyId,site.id,'property id cannot silently collapse ownership: '+site.key);
  assert.equal(result.find(site=>site.key==='casa-damha')?.propertyId,'regional-casa-damha');
  assert.equal(result.filter(site=>site.key.startsWith('rios_')).length,6);
});
test('moving to compact Rio keeps receipts, property and legacy coordinate snapshots',()=>{
  const older={position:{x:2700,z:120},waypoint:{id:'regional-casa-damha'},aboard:{id:'rio-prancha',x:1680,z:-430},
    properties:{'regional-casa-damha':{owned:true,paid:1250}},phoneDelivery:{status:'en-route',vehicleId:'home-green'}};
  const orders=[
    {id:'already-received',kind:'parcel',map:'rio-preto',status:'delivered'},
    {id:'parcel',kind:'parcel',map:'rio-preto',status:'ready',price:9,pose:{x:2500,z:91},target:{x:2500,z:92}},
    {id:'car',kind:'vehicle',map:'rio-preto',status:'en-route',vehicleId:'home-green'}
  ];
  const state={vehicles:{owned:['garage-orange','home-green']},profile:{coins:1100},settings:{}};
  const ctx=compactContext({rioMap:{compact:true},state,rioMapSave:()=>older,phoneOrders:()=>orders,expansionMapLocations:()=>[]});
  vm.runInContext(source('99-rio-compact-world')+'\nmigrateCompactRioProgress();',ctx);
  assert.equal(older.previousMapPose.position.x,2700);
  assert.equal(older.properties['regional-casa-damha'].paid,1250);
  assert.equal(orders[0].status,'delivered');
  assert.equal(orders[1].status,'queued');
  assert.equal(orders[1].pose,undefined);
  assert.equal(orders[1].price,9);
  assert.equal(orders[2].status,'interrupted');
  assert.equal(state.vehicles.phoneDelivery.status,'interrupted');
  assert.deepEqual(state.vehicles.owned,['garage-orange','home-green']);
  assert.equal(state.profile.coins,1100);
  orders[1].status='delivered';older.position={x:20,z:-50};
  vm.runInContext('migrateCompactRioProgress();',ctx);
  assert.equal(orders[1].status,'delivered');
  assert.equal(older.previousMapPose.position.x,2700);
});

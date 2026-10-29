import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=name=>fs.readFileSync('games/otthi/src/modules/'+name,'utf8');
function fixture(){
  const world={colliders:[],hazards:[],vehicles:[]};
  const context=vm.createContext({window:{},world,currentHouse:null,waterAt:()=>false,groundHeightAt:()=>1,trafficActorList:()=>[]});
  vm.runInContext(read('70-world-query-budget.js')+'\n'+read('05a-world-layout-v704.js'),context);
  const collision=read('25-render-init-resize-position-collision.js');
  vm.runInContext(collision.slice(collision.indexOf('  function positionBlockedForPlayer('),collision.indexOf('  function safePointNear(')),context);
  const navigation=read('07-navigation-traffic-routes.js');
  vm.runInContext(navigation.slice(navigation.indexOf('  function navBlocked('),navigation.indexOf('  function segmentClear(')),context);
  return context;
}
function random(){let seed=177;return()=>{seed=Math.imul(seed,1664525)+1013904223|0;return(seed>>>0)/4294967296;};}
function exhaustiveCollision(c,x,z,radius,options={}){
  const bounds=c.v704WorldBounds();
  if(!Number.isFinite(x)||!Number.isFinite(z)||x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ)return true;
  if(!options.allowWater&&c.waterAt(x,z)&&c.groundHeightAt(x,z)<=.24)return true;
  for(const o of c.world.colliders){
    if(o.disabled||options.ignoreHouseId&&o.houseId===options.ignoreHouseId||o.houseId&&c.currentHouse&&o.houseId===c.currentHouse.id)continue;
    if(Math.abs(x-o.x)<=o.w/2+radius&&Math.abs(z-o.z)<=o.d/2+radius)return true;
  }
  return false;
}
function exhaustiveRoad(c,x,z,margin=0,shoulder=true){
  const highways=c.window.OTTHI_WORLD_LAYOUT_V704.layout.highways;
  for(const h of highways){const points=h.points||[];
    for(let i=0;i<points.length-(h.closed?0:1);i++){
      const a=points[i],b=points[(i+1)%points.length];
      if(c.v704DistanceToSegment({x:Number(x),z:Number(z)},a,b).distance<=Number(h.width||10)/2+(shoulder?Number(h.shoulder||0):0)+margin)return true;
    }
  }
  return false;
}
test('spatial collision candidates preserve exhaustive results and inclusive edges across the whole map',()=>{
  const c=fixture(),rng=random(),bounds=c.v704WorldBounds();
  for(let i=0;i<1000;i++)c.world.colliders.push({x:bounds.minX+rng()*(bounds.maxX-bounds.minX),z:bounds.minZ+rng()*(bounds.maxZ-bounds.minZ),w:rng()*30,d:rng()*30,disabled:i%11===0,houseId:i%7===0?'home':null});
  c.world.colliders.push({x:0,z:0,w:5000,d:1},{x:15.52,z:15.52,w:0,d:0});
  c.currentHouse={id:'home'};c.beginWorldQueryFrame();
  try{
    for(let i=0;i<5000;i++){
      const x=bounds.minX-5+rng()*(bounds.maxX-bounds.minX+10),z=bounds.minZ-5+rng()*(bounds.maxZ-bounds.minZ+10),r=rng()*3,options=i%3?{}:{ignoreHouseId:'other'};
      assert.equal(c.positionBlockedForPlayer(x,z,r,options),exhaustiveCollision(c,x,z,r,options),`collision ${x},${z}`);
    }
    for(const collider of c.world.colliders)for(const [x,z]of[[collider.x+collider.w/2+.48,collider.z],[collider.x,collider.z-collider.d/2-.48]])assert.equal(c.positionBlockedForPlayer(x,z,.48),exhaustiveCollision(c,x,z,.48));
    assert(c.window.OTTHI_QUERY_BUDGET.diagnostics().colliderValidations<=1,'the map is validated once within a frame');
  }finally{c.endWorldQueryFrame();}
});
test('building edits, disabled walls, array replacements and moving aircraft never leave stale collision bounds',()=>{
  const c=fixture(),wall={x:100,z:100,w:2,d:2},air={x:120,z:100,w:4,d:4,aircraftId:'parked-heli'};
  c.world.colliders=[wall,air];assert(c.positionBlockedForPlayer(100,100));
  wall.x=200;assert.equal(c.positionBlockedForPlayer(100,100),false);assert(c.positionBlockedForPlayer(200,100));
  wall.disabled=true;assert.equal(c.positionBlockedForPlayer(200,100),false);wall.disabled=false;
  c.world.colliders[0]={x:300,z:100,w:2,d:2};assert.equal(c.positionBlockedForPlayer(200,100),false);assert(c.positionBlockedForPlayer(300,100));
  c.beginWorldQueryFrame();try{
    assert(c.positionBlockedForPlayer(120,100));air.x=400;assert.equal(c.positionBlockedForPlayer(120,100),false);assert(c.positionBlockedForPlayer(400,100));
    c.world.colliders.push({x:500,z:100,w:2,d:2});assert(c.positionBlockedForPlayer(500,100));
    c.world.colliders=c.world.colliders.filter(o=>o!==air);assert.equal(c.positionBlockedForPlayer(400,100),false);
  }finally{c.endWorldQueryFrame();}
  c.world.colliders[0].w=100;assert(c.positionBlockedForPlayer(345,100));
  // Navigation keeps its own hazard/house rules, including disabled colliders.
  c.world.hazards=[{x:40,z:50,w:2,d:2}];assert(c.navBlocked(40,50));
  c.world.colliders=[{x:10,z:10,w:2,d:2,disabled:true,houseId:'home'}];assert(c.navBlocked(10,10));c.currentHouse={id:'home'};assert.equal(c.navBlocked(10,10),false);
});
test('cached highway queries preserve all map roads, shoulders, endpoints and closed loops',()=>{
  const c=fixture(),rng=random(),bounds=c.v704WorldBounds();c.beginWorldQueryFrame();
  try{
    for(let i=0;i<5000;i++){
      const x=bounds.minX+rng()*(bounds.maxX-bounds.minX),z=bounds.minZ+rng()*(bounds.maxZ-bounds.minZ),margin=i%5-2,shoulder=i%2===0;
      assert.equal(c.v704HighwayAt(x,z,margin,shoulder),exhaustiveRoad(c,x,z,margin,shoulder));
    }
    for(const seg of c.v704HighwaySegments())for(const point of[seg.a,seg.b,{x:(seg.a.x+seg.b.x)/2,z:(seg.a.z+seg.b.z)/2}])assert.equal(c.v704HighwayAt(point.x,point.z),exhaustiveRoad(c,point.x,point.z));
    assert(c.window.OTTHI_QUERY_BUDGET.diagnostics().roadValidations<=1);
  }finally{c.endWorldQueryFrame();}
});
test('city road queries retain the exact sidewalk footprints and inclusive borders',()=>{
  const c=fixture(),layout=c.window.OTTHI_WORLD_LAYOUT_V704.layout,rng=random(),bounds=c.v704WorldBounds();
  const expected=(x,z,margin,sidewalk)=>layout.roads.some(r=>c.v704PointInRect({x,z},c.v704RoadFootprint(r,sidewalk),margin))||exhaustiveRoad(c,x,z,margin,sidewalk);
  c.beginWorldQueryFrame();try{
    for(let i=0;i<5000;i++){const x=bounds.minX+rng()*(bounds.maxX-bounds.minX),z=bounds.minZ+rng()*(bounds.maxZ-bounds.minZ),margin=i%5-2,sidewalk=i%2===0;assert.equal(c.v704RoadAt(x,z,margin,sidewalk),expected(x,z,margin,sidewalk));}
    for(const road of layout.roads)for(const sidewalk of[false,true]){const r=c.v704RoadFootprint(road,sidewalk);for(const [x,z]of[[r.x+r.w/2,r.z],[r.x,r.z-r.d/2]])assert.equal(c.v704RoadAt(x,z,0,sidewalk),expected(x,z,0,sidewalk));}
  }finally{c.endWorldQueryFrame();}
});
test('road point movement, replacement, width edits and newly connected roads invalidate correctly',()=>{
  const functions=fixture(),layout={highways:[]},c=vm.createContext({window:{OTTHI_WORLD_LAYOUT_V704:{layout}},WORLD_LAYOUT_V704:layout});
  vm.runInContext(read('70-world-query-budget.js')+'\n'+['v704HighwaySegments','v704HighwayAt','v704DistanceToSegment'].map(name=>functions[name].toString()).join('\n'),c);
  layout.highways=[{id:'test',width:10,shoulder:2,points:[{x:0,z:0},{x:50,z:0}]}];
  const check=()=>{for(const x of[0,25,50,90,100])for(const z of[-20,-7,-5,0,7,20,25])assert.equal(c.v704HighwayAt(x,z),exhaustiveRoad(c,x,z));};
  check();layout.highways[0].points[1].z=50;check();
  layout.highways[0].points[1]={x:100,z:20};check();
  layout.highways[0].width=30;check();layout.highways[0].closed=true;check();
  layout.highways.push({id:'added',width:8,points:[{x:90,z:20},{x:100,z:20}]});check();
  layout.highways=layout.highways.slice(1);check();
});

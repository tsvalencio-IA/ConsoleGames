import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import vm from 'node:vm';

const path='games/otthi/src/modules/';
function scenario(withMesh=false){
  const sandbox=vm.createContext({window:{},console});
  if(withMesh){
    vm.runInContext(fs.readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),sandbox);
    vm.runInContext(`
      let elapsed=0;const performance={now:()=>elapsed},worldGroup=new THREE.Group();
      const worldExpansion={ready:true},world={colliders:[],interactables:[]},player={x:0,z:0};
      const OTTOVIAS_RUNTIME={initialized:true},otGames={active:false},cityCoast={shops:new Map(),citizens:[]};
      let currentHouse=null,modal=null,order=null,visited=null,traffic=0;
      function groundHeightAt(){return 0;}
      function registerCollider(x,z,w,d,info){world.colliders.push({x,z,w,d,...info});}
      function registerInteractable(item){world.interactables.push(item);}
      function citySign(root,text,x,y,z,w,face,background,h){
        const sign=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial());
        sign.name=text;sign.position.set(x,y,z);root.add(sign);return sign;
      }
      function cityCommercialNPC(...args){cityCoast.citizens.push(args);}
      function ottoviasLaneRoute(loop){return loop;}
      function createOttoviasTrafficVehicle(){traffic++;return {};}
      function expansionMapLocations(){return [{id:'legacy-map-point'}];}
      function updateWorldExpansion(){}
      function openCityShop(id){order=cityCoast.shops.get(id);return true;}
      function openModal(title,html){modal={title,html};}
      function closeModal(){}
      function escapeHtml(str){return String(str);}
      function onRioPretoLandmarkVisit(id){visited=id;}
    `,sandbox);
  }
  for(const name of ['78-rio-preto-layout','05a-world-layout-v704',...(withMesh?['79-rio-preto-districts']:[])]){
    vm.runInContext(fs.readFileSync(path+name+'.js','utf8'),sandbox,{filename:name});
  }
  return expr=>JSON.parse(JSON.stringify(vm.runInContext(expr,sandbox)));
}

test('the authored districts offer diverse residences, traversable roads and walkable points',t=>{
  const run=scenario();
  const result=run(`(()=>{
    const {highways,lots,landmarks,protectedRects}=RIO_PRETO_LAYOUT;
    const intrusions=protectedRects.flatMap(lot=>highways.filter(r=>v704HighwayIntersectsRect(r.id,lot,.30)).map(r=>[lot.id,r.id]));
    const overlaps=protectedRects.flatMap((lot,i)=>protectedRects.slice(i+1).filter(b=>v704RectOverlap(lot,b,.20)).map(b=>[lot.id,b.id]));
    const badEntrances=landmarks.filter(p=>!v704RoadAt(p.navX,p.navZ,0,false)||v704RoadAt(p.x,p.z,0,true)
      ||protectedRects.some(lot=>lot.id!==p.id&&v704PointInRect(p,lot,1))).map(p=>p.id);
    const unreservedPlaces=landmarks.filter(p=>!v704ReservedAt(p.centerX,p.centerZ)).map(p=>p.id);
    const houses=lots.filter(l=>l.style.startsWith('house-'));
    return {intrusions,overlaps,badEntrances,unreservedPlaces,houses:houses.length,buildings:lots.length,
      shops:lots.filter(l=>l.kind).length,styleVariants:[...new Set(houses.map(l=>l.style))],orientations:[...new Set(lots.map(l=>l.yaw))],
      avenues:highways.filter(r=>r.boulevard).map(r=>r.name)};
  })()`);
  t.diagnostic(JSON.stringify(result));
  assert.deepEqual(result.intrusions,[]);
  assert.deepEqual(result.overlaps,[]);
  assert.deepEqual(result.badEntrances,[]);
  assert.deepEqual(result.unreservedPlaces,[]);
  assert(result.houses>=16&&result.buildings>=35&&result.shops>=4);
  assert.equal(result.styleVariants.length,4);
  assert(result.orientations.length>=3);
  assert.deepEqual(result.avenues,['Avenida Bady Bassitt','Avenida Alberto Andaló','Avenida Murchid Homsi']);
});

test('approaching the city streams finite, culled scenery and registers native actions only once',t=>{
  const run=scenario(true);
  const result=run(`(()=>{
    updateWorldExpansion();
    const start=window.OTTHI_RIO_PRETO.diagnostics();
    const turn=(x,z,count)=>{Object.assign(player,{x,z});for(let i=0;i<count;i++){elapsed+=40;updateWorldExpansion();}};
    turn(-137,-442,1);
    const approach=window.OTTHI_RIO_PRETO.diagnostics();
    for(const p of RIO_PRETO_LAYOUT.landmarks)turn(p.x,p.z,90);
    turn(403,-536,90);
    turn(100,-648,90);
    const loaded=window.OTTHI_RIO_PRETO.diagnostics(),checked=new Set();
    const colliders=world.colliders.length;
    const collisionOnRoad=world.colliders.filter(c=>{
      if(checked.has(c))return false;
      checked.add(c);
      return RIO_PRETO_LAYOUT.highways.some(r=>v704HighwayIntersectsRect(r.id,c,.40));
    }).map(c=>c.rioPreto);
    const factoryMeshes=worldGroup.children.flatMap(t=>t.children);
    const batches=factoryMeshes.filter(o=>o.isInstancedMesh);
    const bounded=batches.every(o=>o.frustumCulled&&o.userData.otthiBoundedInstances&&o.geometry.boundingSphere?.radius>0);
    const shop=world.interactables.find(i=>i.id==='rio-shop-bady-padaria');
    shop.action();
    const poi=world.interactables.find(i=>i.id==='rio-andalo-praca');
    poi.action();
    turn(0,0,100);
    const distant=window.OTTHI_RIO_PRETO.diagnostics();
    turn(-137,-442,100);
    const returned=window.OTTHI_RIO_PRETO.diagnostics();
    return {start,approach,loaded,distant,returned,collisionOnRoad,batches:batches.length,bounded,colliders,
      resumedColliders:world.colliders.length,unique:world.interactables.length===new Set(world.interactables.map(i=>i.id)).size,
      order,modal,visited,traffic,locations:expansionMapLocations().map(p=>p.id)};
  })()`);
  t.diagnostic(JSON.stringify({approach:result.approach,loaded:result.loaded,distant:result.distant,batches:result.batches,colliders:result.colliders}));
  assert.equal(result.start.built,0);
  assert.equal(result.approach.built,1);
  assert(result.loaded.built>=16&&result.loaded.built<=result.loaded.tiles);
  assert(result.loaded.sceneryInstances>2500&&result.batches<result.loaded.built*6);
  assert.equal(result.distant.visible,0);
  assert.deepEqual(result.collisionOnRoad,[]);
  assert(result.bounded&&result.unique);
  assert.equal(result.resumedColliders,result.colliders);
  assert.equal(result.returned.built,result.loaded.built);
  assert.equal(result.traffic,4);
  assert.equal(result.order.kind,'cafe');
  assert.equal(result.visited,'rio-andalo-praca');
  assert(result.modal.title.includes('Alberto Andaló'));
  assert.deepEqual(result.locations,['legacy-map-point','rio-bady-praca','rio-andalo-praca','rio-murchid-parque']);
});

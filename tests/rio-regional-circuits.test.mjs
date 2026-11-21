import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createContext,runInContext} from 'node:vm';

const module='games/otthi/src/modules/';
function fixture(){
 const c=createContext({window:{},Math,console});
 runInContext(fs.readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),c);
 runInContext(`
  const worldGroup=new THREE.Group(),world={vehicles:[],colliders:[],kartsV704:[],interactables:[]},els={};
  const player={x:0,z:0,y:0,vehicle:false,car:{}},state={races:{wins:7,bestTime:3},profile:{coins:630,xp:412}};
  const paused=false,running=true,otGames={active:false},document={body:{dataset:{},classList:{add(){},remove(){}}}};
  const WORLD_LAYOUT_V704={circuits:{aurora:{id:'aurora',x:300,z:-270,w:114,d:100,navX:300,navZ:-212,scale:2.4,shape:0,label:'Aurora'},costa:{id:'costa',x:-300,z:-210,w:108,d:96,navX:-300,navZ:-156,scale:2.2,shape:1,label:'Costa'}}};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),gr=new THREE.BoxGeometry(),paint=new Map(),scheduled=[];
  let clock=10000,saves=0,vehicle=null,menu=null,portal=null;
  const performance={now:()=>clock};
  function renderMat(color){if(!paint.has(color))paint.set(color,new THREE.MeshBasicMaterial({color}));return paint.get(color)}
  function box(w,h,d,color,x,y,z,group){const m=new THREE.Mesh(gr,color?.isMaterial?color:renderMat(color));m.scale.set(w,h,d);m.position.set(x,y,z);group.add(m);return m}
  const premiumBox=box,cylinder=(r,h,color,x,y,z,g)=>box(r,h,r,color,x,y,z,g);
  const citySign=()=>({rotation:{y:0}}),createSignpost=()=>{},registerInteractable=item=>world.interactables.push(item);
  function enterVehicle(v){if(!v||v.occupied)return false;vehicle=v;v.occupied=true;player.vehicle=true;player.car={speed:0,heading:0};return true;}
  const currentVehicleRef=()=>vehicle;
  const setControlText=()=>{},setControlAttribute=()=>{};
  const toast=()=>{},beep=()=>{},vibrate=()=>{},setWaypoint=()=>{};
  const addXP=xp=>state.profile.xp+=xp,addCoins=coins=>state.profile.coins+=coins,saveState=()=>saves++;
  function openModal(title,html,onReady){menu={title,html,onReady};}
  const closeModal=()=>{},venueOpen=id=>portal=id;
  const setTimeout=f=>scheduled.push(f);
 `,c);
 for(const file of ['80-rio-regional-circuits.js','13a-sports-kart-v705.js']){
  runInContext(fs.readFileSync(module+file,'utf8'),c);
 }
 return code=>runInContext(code,c);
}
const plain=value=>JSON.parse(JSON.stringify(value));

test('regional access connects to native road anchors, with no guard-rail routing across either paddock',()=>{
 const run=fixture(),info=plain(run('({roads:RIO_REGIONAL_ROADS,tracks:RIO_REGIONAL_CIRCUITS,reservations:RIO_REGIONAL_RESERVATIONS})'));
 const anchors={mirassol:['EXT_outer-link_6',-480,-320],cedral:['EXT_outer-link_3',680,-400]};
 for(const h of info.roads.highways){
  const id=h.id.replace('rio-autodromo-',''),[anchor,x,z]=anchors[id],track=info.tracks[id];
  assert(h.regional);assert.equal(h.closed,false);
  assert.deepEqual(h.points[0],{x,z,y:0});
  assert.deepEqual(h.points.at(-1),{x:track.navX,z:track.navZ,y:0});
  assert(info.roads.edges.some(e=>e[0]===anchor));
  assert(h.points.every(p=>p.z<0&&p.x>=-850&&p.x<=850&&p.z>=-700));
 }
 assert(info.reservations[0].x+info.reservations[0].w/2 < info.reservations[1].x-info.reservations[1].w/2);
});

test('regional geometry loads only near the player once and preserves old Kart Legends portals',()=>{
 const run=fixture();
 const result=plain(run(`(()=>{
  const aurora=createKartCircuitV704(),costa=createKartCircuitV704(WORLD_LAYOUT_V704.circuits.costa);
  SPORTS_V705.kart=aurora;player.x=aurora.entrance.x;player.z=aurora.entrance.z;
  openKartRaceV705();const originalPortal=portal;
  updateRioRegionalCircuits();const unloaded=window.OTTHI_RIO_CIRCUITS.diagnostics().circuits;
  const a=RIO_REGIONAL_CIRCUITS.mirassol;player.x=a.navX;player.z=a.navZ;
  updateRioRegionalCircuits();const first=SPORTS_V705.circuits.length,objects=worldGroup.children.length;
  updateRioRegionalCircuits();
  const duplicate=first!==SPORTS_V705.circuits.length||objects!==worldGroup.children.length;
  world.interactables.find(i=>i.id==='kart-race-mirassol').action();
  const menuLabel=menu.title,regional=SPORTS_V705.kart;
  const minimum=Math.min(...regional.samples.map(p=>Math.min(...world.colliders.filter(c=>c.regionalCircuit===regional.id).map(c=>Math.hypot(Math.max(0,Math.abs(p.x-c.x)-c.w/2),Math.max(0,Math.abs(p.z-c.z)-c.d/2))))));
  const b=RIO_REGIONAL_CIRCUITS.cedral;player.x=b.navX;player.z=b.navZ;
  updateRioRegionalCircuits();
  const second=SPORTS_V705.circuits.at(-1);
  const free=second.samples.every(p=>world.colliders.filter(c=>c.regionalCircuit===second.id).every(c=>Math.hypot(Math.max(0,Math.abs(p.x-c.x)-c.w/2),Math.max(0,Math.abs(p.z-c.z)-c.d/2))>second.width/2));
  const entries=window.OTTHI_RIO_CIRCUITS.diagnostics().circuits;
  return{originalPortal,unloaded,duplicate,menuLabel,minimum,free,entries,legacy:[aurora.id,costa.id]};
 })()`));
 assert.equal(result.originalPortal,'kart-aurora');assert.deepEqual(result.legacy,['aurora','costa']);
 assert(result.unloaded.every(c=>!c.loaded));assert.equal(result.duplicate,false);assert.match(result.menuLabel,/Mirassol/);
 assert(result.minimum>5.2,result.minimum);assert(result.free,'Cedral structures cannot occupy the asphalt');
 assert.deepEqual(result.entries.map(c=>[c.kind,c.laps,c.checkpoints,c.loaded,c.visible]),[['solo',3,20,true,false],['time',2,19,true,true]]);
 assert(result.entries.every(c=>c.length>=300&&c.length<=530),JSON.stringify(result.entries));
});

test('native ordered sectors finish both events and issue rewards only once per race',()=>{
 const run=fixture();
 const result=plain(run(`(()=>{
  const output=[];
  for(const spec of Object.values(RIO_REGIONAL_CIRCUITS)){
   const k=createKartCircuitV704(spec);SPORTS_V705.kart=k;
   player.vehicle=false;vehicle=null;k.regionalOptions={assist:'strong',difficulty:'normal'};
   startKartRaceV704(spec.mode);const rivals=k.ai.length,oldExpected=k.expected;
   clock+=3400;updateKartRaceV704(3.4);
   // Position fixtures at each timing gate to exercise original progression
   // and reward boundaries, independently of a browser movement driver.
   player.x=k.checkpoints[4].x;player.z=k.checkpoints[4].z;updateKartRaceV704(0);
   const skipped=k.expected!==oldExpected;
   for(let lap=0;lap<spec.laps;lap++)for(let i=1;i<=k.checkpoints.length;i++){
    const p=k.checkpoints[i%k.checkpoints.length];player.x=p.x;player.z=p.z;clock+=1800;
    updateKartRaceV704(0);
   }
   const coins=state.profile.coins,xp=state.profile.xp;updateKartRaceV704(1);
   output.push({id:k.id,lap:k.lap,rivals,skipped,active:k.active,coins,xp,unchanged:coins===state.profile.coins&&xp===state.profile.xp});
   SPORTS_V705.active=null;
  }
  return{output,records:state.races.regionalCircuits,old:{wins:state.races.wins,bestTime:state.races.bestTime},saves};
 })()`));
 assert.deepEqual(result.old,{wins:7,bestTime:3});
 assert.deepEqual(result.output.map(x=>[x.lap,x.rivals,x.skipped,x.active,x.unchanged]),[[3,3,false,false,true],[2,0,false,false,true]]);
 assert.equal(result.saves,2);assert.equal(result.output[0].coins,672);assert.equal(result.output[1].coins,672);
 assert.equal(result.output[1].xp,502);assert.equal(result.records.mirassol.runs,1);assert.equal(result.records.cedral.runs,1);
 assert(result.records.mirassol.bestTime>result.records.cedral.bestTime);
});

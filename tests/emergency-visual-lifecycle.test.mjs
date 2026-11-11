import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=name=>fs.readFileSync('games/otthi/src/modules/'+name,'utf8');
function functionSource(source,name){
  const start=source.indexOf('  function '+name+'(');
  assert(start>=0,name);
  const end=source.indexOf('\n  function ',start+3);
  return source.slice(start,end<0?undefined:end);
}
function fixture(){
  const module={exports:{}};
  vm.runInNewContext(fs.readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),{module,exports:module.exports});
  const THREE=module.exports,worldGroup=new THREE.Group(),timers=[];
  const world={outlines:[],interactables:[],trafficIncidents:[],policeCars:[],ambulances:[],fireTrucks:[],emergencySeq:0};
  const state={cityServices:{},career:{},stats:{}};
  const c=vm.createContext({THREE,world,worldGroup,state,Math,Number,Set,Map,currentHouse:null,player:{x:0,z:0,facing:0,car:{}},performance:{now:()=>10000},textures:{},materials:{},visualFoundation:{},groundHeightAt:()=>0,nearestRoadProjection:p=>({point:p}),dispatchIncidentResponders(){},releaseIncidentActorStates(){},serviceKindForJob:()=>'',saveState(){},toast(){},setPoliceRoadsideDoor(){},setTimeout:(fn,ms)=>{timers.push({fn,ms});}});
  const visual=read('11-render-materials-player-model.js');
  vm.runInContext(visual.slice(visual.indexOf('  function mat('),visual.indexOf('  function addSoftHighlight('))+visual.slice(visual.indexOf('  function box('),visual.indexOf('  function makeWindow('))+functionSource(visual,'registerInteractable'),c);
  const emergency=read('16-emergency-services.js');
  for(const name of ['createIncidentVisual','createTrafficIncidentAt','resolveTrafficIncident','policeRoadsideLocalPoint','createRoadsidePoliceOfficer','removeRoadsidePoliceOfficer'])vm.runInContext(functionSource(emergency,name),c);
  return{c,world,worldGroup,state,timers,THREE,flush(){for(const timer of timers.splice(0)){assert.equal(timer.ms,1200);timer.fn();}}};
}

test('twenty complete fire-incident cycles release temporary objects and retain shared scenery resources',()=>{
  const f=fixture(),persistent=f.c.premiumBox(.52,.1,.52,0xffffff,0,0,0),outlines=f.world.outlines.length;
  const otherAction={id:'keep-player-action',available:()=>true};f.world.interactables.push(otherAction);
  let sharedDisposals=0,uniqueCreated=0,uniqueDisposed=0;
  persistent.geometry.addEventListener('dispose',()=>sharedDisposals++);
  persistent.material.addEventListener('dispose',()=>sharedDisposals++);
  for(let i=0;i<20;i++){
    const incident=f.c.createTrafficIncidentAt(0,0,'fire');
    incident.group.traverse(o=>{if(o.geometry?.type==='ConeGeometry'||o.geometry?.type==='TorusGeometry'){uniqueCreated++;o.geometry.addEventListener('dispose',()=>uniqueDisposed++);}});
    assert.equal(f.world.outlines.length,outlines+9,'all cones and barriers remain visible until service ends');
    assert.equal(f.world.interactables.length,2,'the current emergency remains actionable');
    f.c.resolveTrafficIncident(incident);f.c.resolveTrafficIncident(incident);
    assert.equal(f.timers.length,1,'resolving twice cannot duplicate cleanup');
    f.flush();
    assert.equal(f.world.outlines.length,outlines,'closed emergency outlines must leave the per-frame visual registry');
    assert.equal(f.world.interactables.length,1,'closed emergency actions cannot retain completed incidents');
    assert.equal(f.world.interactables[0],otherAction);
    assert.equal(f.world.trafficIncidents.length,0);
    assert.equal(f.worldGroup.children.length,1);
    assert.equal(f.worldGroup.children[0],persistent);
  }
  assert.equal(uniqueCreated,60);
  assert.equal(uniqueDisposed,uniqueCreated,'all unique fire and beacon geometry is disposed');
  assert.equal(sharedDisposals,0,'geometry and material reused by the world remain alive');
  assert.equal(f.state.cityServices.accidentsResolved,20);
});

test('repeated roadside officer removal releases its outline registrations without affecting the player scenery',()=>{
  const f=fixture(),persistent=f.c.premiumBox(1,1,1,0x334455),outlines=f.world.outlines.length;
  for(let i=0;i<20;i++){
    const car={id:'patrol',group:new f.THREE.Group()};f.world.policeCars=[car];
    const alert={carId:car.id,officer:f.c.createRoadsidePoliceOfficer(car)};
    assert(f.world.outlines.length>outlines);
    f.c.removeRoadsidePoliceOfficer(alert);f.c.removeRoadsidePoliceOfficer(alert);
    assert.equal(alert.officer,null);
    assert.equal(f.world.outlines.length,outlines);
    assert.equal(f.worldGroup.children.length,1);
    assert.equal(f.worldGroup.children[0],persistent);
  }
});

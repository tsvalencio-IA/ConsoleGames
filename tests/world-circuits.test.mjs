import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
function fixture(){
 const module={exports:{}};vm.runInNewContext(fs.readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),{module,exports:module.exports});const T=module.exports,root=new T.Group(),world={vehicles:[]},player={x:0,z:0,vehicle:true,car:{speed:0,heading:0}};
 const mat=c=>typeof c==='object'?c:new T.MeshStandardMaterial({color:c});const box=(w,h,d,m,x,y,z,p=root)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),mat(m));o.position.set(x,y,z);p.add(o);return o;};
 const c=vm.createContext({THREE:T,window:{},console,worldGroup:root,world,player,state:{profile:{playerId:'test'}},renderMat:mat,box,premiumBox:box,registerInteractable(){},createSignpost(){},cylinder:(r,h,m,x,y,z,p=root,n=12)=>{const o=new T.Mesh(new T.CylinderGeometry(r,r,h,n),mat(m));o.position.set(x,y,z);p.add(o);return o;},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),Math,performance:{now:()=>0}});
 vm.runInContext(fs.readFileSync('games/otthi/src/modules/05a-world-layout-v704.js','utf8'),c);vm.runInContext(fs.readFileSync('games/otthi/src/modules/13a-sports-kart-v705.js','utf8'),c);return {c,T,player,world,create:id=>vm.runInContext('createKartCircuitV704(WORLD_LAYOUT_V704.circuits.'+id+')',c)};
}
test('world circuits: visible asphalt segments align with the actual drive curve and remain renderable far from the old origin',()=>{
 const f=fixture();for(const id of ['aurora','costa']){const k=f.create(id),road=k.root.getObjectByName('OTTHI_KART_ASPHALT');assert.equal(road.frustumCulled,false,'r128 cannot cull transformed instances using a unit-cube sphere at the original village');for(const i of [0,49,120,199]){const m=new f.T.Matrix4();road.getMatrixAt(i,m);const forward=new f.T.Vector3(m.elements[8],0,m.elements[10]).normalize(),tan=k.curve.getTangentAt((i+.5)/240);assert(forward.dot(tan)>.999,'asphalt length must follow local Z along the tangent');}}
});
test('world circuits: four parked vehicles occupy the pit lane and cannot duplicate the racing grid',()=>{
 const f=fixture();for(const id of ['aurora','costa']){const k=f.create(id);for(const grid of k.grid)for(const car of k.karts)assert(Math.hypot(grid.x-car.x,grid.z-car.z)>4,'a parked vehicle cannot block a starting slot');assert.equal(k.karts.length,4);for(let i=1;i<k.grid.length;i++)assert(Math.hypot(k.grid[i].x-k.grid[i-1].x,k.grid[i].z-k.grid[i-1].z)>3.4);}
});
test('world circuits: assist has an off switch, never accelerates or teleports, and yields steering authority to the player',()=>{
 const f=fixture(),k=f.create('aurora');k.active=true;k.countdown=-1;k.assist='strong';const p=k.curve.getPointAt(.2),t=k.curve.getTangentAt(.2);f.player.x=p.x;f.player.z=p.z;f.player.car.heading=Math.atan2(t.x,t.z)+.5;
 const initial={...f.player.car};f.c.v705KartAssist(.1,0);assert.equal(f.player.car.speed,0);assert.equal(f.player.car.heading,initial.heading);
 f.player.car.speed=12;k.assist='off';f.c.v705KartAssist(.1,0);assert.equal(f.player.car.heading,initial.heading);
 k.assist='strong';f.c.v705KartAssist(.1,0);const full=Math.abs(f.player.car.heading-initial.heading);assert(full>0);assert.equal(f.player.x,p.x);assert.equal(f.player.z,p.z);assert(f.player.car.speed<=12);
 f.player.car.heading=initial.heading;f.player.car.speed=12;f.c.v705KartAssist(.1,1);assert(Math.abs(f.player.car.heading-initial.heading)<full*.2,'full manual input overrules most of the centering assistance');
});
test('world circuits: native vehicle physics with strong assist drives complete laps without a lateral position snap or an off-track lock',()=>{
 const f=fixture();f.c.input={mobilityAccelerate:true,mobilityBrake:false,keys:new Set()};f.c.lerp=(a,b,t)=>a+(b-a)*t;f.c.approachNumber=(a,b,d)=>a<b?Math.min(b,a+d):Math.max(b,a-d);f.c.updateMobilityControlLabels=()=>{};f.c.els={raceBadge:null};f.c.toast=()=>{};f.c.addXP=()=>{};f.c.addCoins=()=>{};f.c.setTimeout=()=>{};
 vm.runInContext(fs.readFileSync('games/otthi/src/modules/26-input-player-physics.js','utf8'),f.c);
 for(const id of ['aurora','costa']){
  const k=f.create(id);vm.runInContext('SPORTS_V705.kart=SPORTS_V705.circuits.find(k=>k.id==="'+id+'")',f.c);k.active=true;k.countdown=-1;k.assist='strong';Object.assign(f.player,{x:k.grid[0].x,z:k.grid[0].z,vx:0,vz:0});Object.assign(f.player.car,{speed:0,heading:k.grid[0].heading,steerVisual:0,passengerOf:''});
  k.mode='solo';k.lap=0;k.expected=1;k.assistProgress=1-1.6/k.curve.getLength();let maxDistance=0,travel=0;
  for(let i=0;i<15000&&k.active;i++){
   const x=f.player.x,z=f.player.z;f.c.updateVehiclePhysics(1/60,0,1);f.player.x+=f.player.vx/60;f.player.z+=f.player.vz/60;travel+=Math.hypot(f.player.x-x,f.player.z-z);
   const track=f.c.v705TrackDistance(k,f.player.x,f.player.z);maxDistance=Math.max(maxDistance,track.distance);f.c.updateKartRaceV704(1/60);
  }
  assert.equal(k.lap,3,id+' must pass all ordered checkpoints and reach the native three-lap result');assert.equal(k.active,false);assert(maxDistance<k.width/2+.4,id+' must remain on the road under the native grip and steering model: '+maxDistance);assert(travel>k.curve.getLength()*2.9);
 }
});

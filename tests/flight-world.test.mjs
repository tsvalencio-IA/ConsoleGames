import test from 'node:test';
import assert from 'node:assert/strict';
import {engine,canvas} from './helpers/game-fixture.mjs';
const fresh=()=>{const f=engine('voo','game_flight');f.game.init({mode:'FREE'});return f;};
test('flight world: four populated cities, persistent traffic routes and independently moving people and tanks',()=>{
 const {game:g}=fresh();assert.equal(g.battleCities.length,4);assert(g.battleCities.every(c=>c.buildings.length>65));assert.equal(g.groundTraffic.length,48);assert.equal(g.groundPeople.length,72);assert.equal(g.groundTanks.length,12);
 const car=g.groundTraffic[0],person=g.groundPeople[0],tank=g.groundTanks[0],before=[car,person,tank].map(u=>g._groundPath(u));g._updateBattleWorld(1);
 for(const [i,u]of [car,person,tank].entries()){const after=g._groundPath(u);assert(Math.hypot(after.x-before[i].x,after.z-before[i].z)>1,'A ground unit must actually move');}
});
test('flight world: free flight and school never take hostile AA fire; solo campaign gets real projectiles',()=>{
 const {game:g}=fresh();const t=g.groundTanks[0],p=g._groundPath(t);Object.assign(g.ship,{x:p.x,y:380,z:p.z});t.fire=0;g._updateBattleWorld(.01);assert.equal(g.bullets.length,0);
 g.mode='SINGLE';t.fire=0;g._updateBattleWorld(.01);assert(g.bullets.some(b=>b.isEnemy&&b.vy>0&&b.life>0));
});
test('flight: selectable helicopters hover, turn, move forward and climb using collective',()=>{
 for(const model of ['kestrel','guardian']){
  const {game:g}=fresh();g.upgrades.armor=3;assert(g.selectAirframe(model));g._startMission();assert.equal(g.ship.speed,0);assert.equal(g.manualThrottle,.5);
  const y=g.ship.y;for(let i=0;i<120;i++)g._updateHelicopter(1/60);assert(Math.abs(g.ship.y-y)<1e-8);assert.equal(g.ship.isStalling,false);
  g.pilot.targetRoll=.8;g.pilot.targetPitch=.7;g.pilot.throttle=.8;
  for(let i=0;i<120;i++)g._updateHelicopter(1/60);assert(g.ship.y>y+8&&g.ship.yaw>0&&g.ship.vx>0&&(g.ship.vx*Math.sin(g.ship.yaw)+g.ship.vz*Math.cos(g.ship.yaw))>0);
  g.pilot.throttle=.2;for(let i=0;i<240;i++)g._updateHelicopter(1/60);assert(g.ship.vy<0);
 }
});
test('flight: helicopter upgrade gates and flight school keep their actual rules',()=>{
 const {game:g}=fresh();assert.equal(g.selectAirframe('guardian'),false);assert.equal(g.selectAirframe('kestrel'),true);g.flightSchool={stage:'takeoff'};assert.equal(g.selectAirframe('kestrel'),false);
});
test('flight: all aircraft use volumetric faces, rotor blades animate and city rendering stays finite',()=>{
 const {game:g}=fresh();g.airframe='kestrel';g._startMission();g._updateView(390,844);const ctx=canvas();g._draw(ctx,390,844);assert(g._airframeMesh('falcon').length>200);assert(g._airframeMesh('kestrel').some(f=>f.rotor));
 g._drawAirframe(ctx,390,844,{x:30,y:380,z:200,yaw:Math.PI,pitch:.1,roll:.2},'interceptor',true);
 assert(ctx.operations.filter(o=>o[0]==='fill').length>30);for(const op of ctx.operations)for(const n of op.slice(1))if(typeof n==='number')assert(Number.isFinite(n),'Non-finite rendering argument in '+op[0]);
});

test('flight: leaving school restores the selected helicopter, and changing to a jet resets rotorcraft collective',()=>{
 const {game:g}=fresh();g.selectAirframe('kestrel');g._startMission();g.init({mode:'FREE',school:true});assert.equal(g.airframe,'falcon');g.init({mode:'FREE'});assert.equal(g.airframe,'kestrel');
 g.state='HANGAR';g.selectAirframe('falcon');g._startMission();assert.equal(g.manualThrottle,1);
});
test('flight world: every car stays inside the drawn road at every segment of its route',()=>{
 const {game:g}=fresh();for(const car of g.groundTraffic)for(let i=0;i<80;i++){car.phase=i/80;const p=g._groundPath(car),c=g.battleCities[car.city];const dx=Math.abs((p.x-c.x)-Math.round((p.x-c.x)/360)*360),dz=Math.abs((p.z-c.z)-Math.round((p.z-c.z)/360)*360);assert(Math.min(dx,dz)<=10,'Car left its actual road');}
});

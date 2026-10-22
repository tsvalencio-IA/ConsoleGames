import test from 'node:test';import assert from 'node:assert/strict';import {engine} from './helpers/game-fixture.mjs';
function fresh(){const f=engine('voo','game_flight');f.game.init({mode:'SINGLE'});f.game.selectAirframe('kestrel');f.game._startMission();f.game.entities=[];f.game.groundTanks=[];f.game.battleCities=[];Object.assign(f.game.ship,{x:0,y:380,z:0,pitch:0,roll:0,yaw:0,vx:0,vy:0,vz:0});return f;}
test('helicopter assistance acquires a real forward target above the fuselage, fires on lock and stops immediately behind the player',()=>{
 const {game:g,advance}=fresh();const target={type:'jet_fighter',x:300,y:600,z:1400,hp:100,vx:20,vy:0,vz:0};g.entities=[target];
 for(let i=0;i<30;i++){advance(16.67);g._processCombat(1/60,844,390);}assert(g.combat.locked);assert(g.bullets.length>0);const n=g.bullets.length;
 target.z=-1400;for(let i=0;i<20;i++){advance(16.67);g._processCombat(1/60,844,390);}assert(!g.combat.locked);assert.equal(g.bullets.length,n);
});
test('disabling helicopter automatic fire keeps the assisted lock while requiring the independent fire button',()=>{
 const {game:g,settings,advance}=fresh();settings.heliAutoFire=false;g.entities=[{type:'jet_fighter',x:100,y:400,z:1000,hp:100}];for(let i=0;i<40;i++){advance(17);g._processCombat(1/60,844,390);}assert(g.combat.locked);assert.equal(g.bullets.length,0);g.manualFireHeld=true;advance(100);g._processCombat(.02,844,390);assert.equal(g.bullets.length,1);
});
test('tanks take swept projectile hits, leave a wreck, stop firing and pay once; nearby traffic actually brakes',()=>{
 const f=engine('voo','game_flight'),g=f.game;g.init({mode:'SINGLE'});g._startMission();g.entities=[];const tank=g.groundTanks[0];Object.assign(tank,{x:0,y:18,z:0});g.battleCities[0].buildings=[];g.groundTraffic[0].phase=tank.phase;g._groundPath=unit=>({x:unit===g.groundTraffic[0]?20:0,z:0,yaw:0});
 const before=g.session.cash;for(let i=0;i<5;i++){g.bullets.push({x:0,y:18,z:-100,vx:0,vy:0,vz:4000,life:1,isEnemy:false});g._updateBullets(.05);}assert.equal(tank.hp,0);assert.equal(tank.active,false);assert.equal(g.session.cash,before+250);assert.equal(g.groundExplosions.length,1);assert(g.groundTraffic[0].brakeTime>0&&g.groundTraffic[0].crashed);assert(!g._damageGroundTank(tank,900));assert.equal(g.session.cash,before+250);const phase=tank.phase;tank.fire=0;g.bullets=[];g._updateBattleWorld(.1);assert.equal(tank.phase,phase);assert.equal(g.bullets.length,0);
});
test('a building occludes acquisition and tank hits; peaceful free flight never damages ground units',()=>{
 const {game:g,advance}=fresh();g.battleCities=[{buildings:[{x:0,z:500,w:200,d:60,h:800}]}];g.entities=[{type:'jet_fighter',x:0,y:400,z:1000,hp:100}];for(let i=0;i<50;i++){advance(17);g._processCombat(1/60,844,390);}assert(!g.combat.target);assert.equal(g.bullets.length,0);
 g.mode='FREE';const tank={active:true,hp:250};assert(!g._damageGroundTank(tank,500));assert.equal(tank.hp,250);
});
test('collective remains independent while cyclic and pedals combine; release damping produces a stable hover',()=>{
 const {game:g,settings}=fresh();settings.assist=false;g.pilot.targetRoll=.8;g.pilot.targetPitch=.5;g.pilot.throttle=.5;for(let i=0;i<60;i++)g._updateHelicopter(1/60);assert(Math.abs(g.ship.y-380)<1e-8);assert.equal(g.ship.yaw,0);assert(g.ship.vx>0&&g.ship.vz>0);g.manualPedal=-1;g._updateHelicopter(.1);assert(g.ship.yaw<0);g.manualPedal=0;g.pilot.targetRoll=g.pilot.targetPitch=0;for(let i=0;i<240;i++)g._updateHelicopter(1/60);assert(Math.hypot(g.ship.vx,g.ship.vz)<.01);
});

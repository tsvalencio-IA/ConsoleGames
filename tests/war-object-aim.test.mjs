import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import{createRequire}from'node:module';import{engine}from'./helpers/game-fixture.mjs';
const require=createRequire(import.meta.url),{Calibration,targets,solve}=require('../games/ar/object-aim.js');
test('five-point aim learns mirror, cross-axis coupling and comfortable range; a stationary object cannot pass',()=>{
 const poses=targets.map(p=>({x:.6-(p.x-.5)*.5+(p.y-.48)*.12,y:.4+(p.y-.48)*.6+(p.x-.5)*.05})),map=solve(poses);
 for(let i=0;i<5;i++){const x=poses[i].x-poses[0].x,y=poses[i].y-poses[0].y;assert(Math.abs(.5+map.xx*x+map.xy*y-targets[i].x)<1e-8);assert(Math.abs(.48+map.yx*x+map.yy*y-targets[i].y)<1e-8);}
 assert.throws(()=>solve(targets.map(()=>({x:.5,y:.5}))),/insuficiente/);
 const c=new Calibration();for(let at=0;at<20000;at+=100)c.consume({x:.5,y:.5,confidence:1},at);assert.equal(c.points.length,1);assert(c.target.name==='ESQUERDA');
});
test('five-point capture requires separate stable observations, survives loss and accepts all real directions',()=>{
 const c=new Calibration();let result,at=100;
 for(let i=0;i<5;i++){at+=800;for(let j=0;j<12;j++,at+=100){const p=targets[i];result=c.consume({x:.6-(p.x-.5)*.5,y:.4+(p.y-.48)*.5,confidence:.96},at)||result;}}
 assert(result?.map&&result.center);const lost=new Calibration();lost.consume({x:.5,y:.5,confidence:1},0);lost.consume(null,1000);assert.equal(lost.progress,0);assert.equal(lost.points.length,0);
});
test('object roll no longer drives unrelated yaw/pitch; moving its registered tip does',()=>{
 const scope={window:{},document:{baseURI:'http://test/'},URL};vm.runInNewContext(fs.readFileSync('games/ar/hand-controls.js','utf8'),scope);const c=new scope.window.WarHandControl.AimController();
 for(let at=0;at<=1300;at+=100)c.consumeObject({x:.5,y:.5,dx:0,dy:1,confidence:1},at);
 for(let at=1400;at<2300;at+=100)c.consumeObject({x:.5,y:.5,dx:.5,dy:.7,angle:.5,confidence:1},at);
 assert(Math.abs(c.aim.x-.5)<1e-10);assert(Math.abs(c.aim.y-.48)<1e-10);assert.equal(c.aim.roll,.5);
 c.consumeObject({x:.4,y:.45,dx:.5,dy:.7,confidence:1},2400);assert(c.aim.x>.66&&c.aim.y<.4);
});
test('playable training targets are hit by actual aim/shoot logic, never attack or change career/coins',()=>{
 const f=engine('ar','game_ar'),g=f.game;g.init({id:'training'});assert(g.training);const before=[...f.storage];
 for(let i=0;i<10;i++){const target=g.enemies[0];assert.equal(target.kind,'practice');g.player.yaw=Math.atan2(target.x-g.player.x,target.z-g.player.z);g.player.pitch=Math.atan2(target.y-g.eyeY,Math.hypot(target.x-g.player.x,target.z-g.player.z));g.shotCooldown=0;assert.equal(g.targetAtAim(),target);assert(g.shoot());for(let frame=0;frame<50;frame++)g.step(.02);}
 assert.equal(g.trainingTargets,10);assert.equal(g.stats.hits,10);assert.equal(g.player.hp,100);assert.equal(g.career.wins,0);assert.equal(g.career.kills,0);assert.equal(g.stats.kills,0);assert.equal(g.finish(true),false);assert.deepEqual([...f.storage],before);assert.equal(g.state,'PLAYING');
});

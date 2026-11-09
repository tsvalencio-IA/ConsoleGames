import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {engine} from './helpers/game-fixture.mjs';
const start=()=>{const f=engine('ar','game_ar'),g=f.game;g.init({id:'patrol'});g.eyeY=1.8;return f;};
test('visible bullet impacts stop at the first physical wall and have a bounded lifetime buffer',()=>{
 const {game:g}=start();g.covers=[{x:0,z:10,w:4,d:2,h:3},{x:0,z:20,w:4,d:2,h:3}];
 for(let i=0;i<40;i++)g.recordImpact(null);
 assert.equal(g.bulletMarks.length,28);for(const p of g.bulletMarks){assert.equal(p.z,9);assert.equal(p.y,1.8);assert.equal(p.axis,2);assert.equal(p.sign,-1);}
});
test('a soldier must recover sight after physical cover and being hit interrupts its aim',()=>{
 const {game:g}=start();g.spawnWave();const e=g.enemies.find(e=>e.kind==='soldier');Object.assign(e,{x:0,z:20,y:1.15,aim:0});g.covers=[{x:0,z:10,w:6,d:2,h:4}];
 assert.equal(g.updateEnemyAwareness(e,.1),false);assert(e.aim>=g.level.aim*.55);assert.equal(e.sight,0);
 g.covers=[];e.suppressed=.65;e.aim=0;assert(g.updateEnemyAwareness(e,.1));assert(e.aim>=.45);
});
test('aiming at a visible head above low cover hits while a shot through the cover cannot',()=>{
 const {game:g}=start(),e={id:'visible-head',kind:'soldier',x:0,y:.92,z:12,crouched:true,active:true};g.enemies=[e];g.covers=[{x:0,z:6,w:4,h:1.2,d:2}];
 g.player.pitch=Math.atan2(1.76-g.eyeY,12);assert.equal(g.targetAtAim(),e);
 g.player.pitch=Math.atan2(.65-g.eyeY,12);assert.equal(g.targetAtAim(),null);
 g.player.pitch=Math.atan2(2.1-g.eyeY,12);assert.equal(g.targetAtAim(),null);
});
test('recoil, gait and reload move the weapon presentation while leaving the calibrated aim unchanged',()=>{
 const window={};vm.runInNewContext(fs.readFileSync('games/ar/combat-presentation.js','utf8'),{window});
 const {game:g}=start();const initial={...g.player};g.autoWalking=true;g.weaponKick=1;g.reloadTime=g.gun.reload*.55;
 for(let i=0;i<60;i++){g.elapsed+=1/60;const pose=window.WarPresentation.motion(g);assert(Object.values(pose).every(Number.isFinite));assert(pose.lower>=0&&pose.lower<=1);}
 assert.deepEqual({...g.player},initial);
 const faces=[];window.WarPresentation.soldierFaces((points)=>faces.push(points),{x:0,z:20,active:true,moving:true,stride:1},g);assert(faces.length>70);assert(faces.flat(2).every(Number.isFinite));
});
test('embedded infantry contains the documented skeleton, independent movement clips and local textures',()=>{
 const data=fs.readFileSync('games/ar/assets/infantry/soldier.glb'),source=JSON.parse(fs.readFileSync('games/ar/assets/infantry/sources.json'));
 assert.equal(data.toString('utf8',0,4),'glTF');assert.equal(createHash('sha256').update(data).digest('hex'),source.sha256);
 const gltf=JSON.parse(data.toString('utf8',20,20+data.readUInt32LE(12)));
 for(const clip of['Idle','Walk','Run'])assert(gltf.animations.some(a=>a.name===clip));
 assert.equal(gltf.skins[0].joints.length,49);assert(gltf.images.every(i=>i.bufferView!==undefined&&!i.uri));
 const sky=JSON.parse(fs.readFileSync('games/ar/assets/sky/sources.json')),hdr=fs.readFileSync('games/ar/assets/sky/daylight-1k.hdr');
 assert.equal(createHash('sha256').update(hdr).digest('hex'),sky.file.sha256);assert.equal(sky.license,'CC0-1.0');
});

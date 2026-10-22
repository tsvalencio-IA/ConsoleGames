import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {engine,canvas} from './helpers/game-fixture.mjs';
const read=p=>readFileSync(p,'utf8');
// Real bundled Three geometry and camera math. GPU pixels are checked separately
// by scenery-browser.mjs, including actual shader compilation in Chromium.
function renderer(f,unavailable=false){
 const module={exports:{}};vm.runInNewContext(read('games/ar/vendor/three-r128.min.js'),{module,exports:module.exports,console});
 class GPU{
  constructor({canvas}){if(unavailable)throw Error('GPU unavailable');this.domElement=canvas;this.shadowMap={};this.info={render:{calls:1,triangles:1000}}}
  setPixelRatio(){}setSize(w,h){this.domElement.width=w;this.domElement.height=h}setClearColor(){}render(scene){scene.updateMatrixWorld(true);f.sceneCapture=scene}clearDepth(){}dispose(){}
 }
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get(o,k){return o[k]||(()=>{})}});
 const document={createElement:()=>({width:1,height:1,getContext:()=>ctx,addEventListener(){}})};
 f.window.THREE={...module.exports,WebGLRenderer:GPU};
 vm.runInNewContext(read('enhancements/war-world-renderer.js'),{window:f.window,document,console:{warn(){}}});
 return f.window.ArcadeWorldRenderer;
}
test('WAR: GPU camera matches hit-test projection through pitch/yaw and both screen orientations',()=>{
 const f=engine('ar','game_ar');f.game.init({id:'city'});const api=renderer(f),g=f.game;g.eyeY=1.8;
 for(const [w,h]of [[390,844],[844,390]])for(const [yaw,pitch]of [[0,0],[.35,-.2],[-.4,.3]]){
  Object.assign(g.player,{x:-3,z:5,yaw,pitch});assert(api.combat(g,canvas(),w,h,false));
  for(const p of [[0,1,35],[10,3,50],[-8,8,60]]){const a=g.project(...p,w,h),b=api.project(g,...p,w,h);assert(Math.hypot(a.x-b.x,a.y-b.y)<1e-8)}
 }
 const info=api.inspect(g);assert(info.staticInstances>250);assert(info.materials>25);api.release(g);assert.equal(api.inspect(g),null);
});
test('flight: same chase/cockpit projection, original road positions and populated instanced scenery',()=>{
 const f=engine('voo','game_flight');f.game.init({mode:'FREE'});const api=renderer(f),g=f.game;
 const traffic=JSON.stringify(g.groundTraffic),ship=JSON.stringify(g.ship);
 for(const [w,h]of [[390,844],[844,390]])for(const camera of ['chase','cockpit']){
  f.settings.camera=camera;g._updateView(w,h);assert(api.flight(g,canvas(),w,h));
  for(const p of [[300,3200,5000],[-400,2500,8000],[1000,100,10000]]){const a=g._projectView(...p,w,h),b=api.project(g,...p,w,h);assert(Math.hypot(a.x-b.x,a.y-b.y)<1e-8)}
 }
 assert.equal(JSON.stringify(g.groundTraffic),traffic);assert.equal(JSON.stringify(g.ship),ship);
 const info=api.inspect(g);assert(info.staticInstances>8000);assert(info.dynamicInstances>300);api.release(g);
});
test('render: unsupported GPU falls back without changing controls, enemies, ammo or mission',()=>{
 const f=engine('ar','game_ar');f.game.init({id:'extraction'});f.game.step(0);f.game.spawnWave();const api=renderer(f,true),g=f.game;
 const before=JSON.stringify({player:g.player,enemies:g.enemies,ammo:g.ammo,mission:g.mission,stick:g.manualStick});
 assert.equal(api.combat(g,canvas(),390,844,false),false);assert.equal(api.combat(g,canvas(),390,844,false),false);
 g.drawVirtualScene(canvas(),390,844);
 assert.equal(JSON.stringify({player:g.player,enemies:g.enemies,ammo:g.ammo,mission:g.mission,stick:g.manualStick}),before);
});
test('flight: lit aircraft retain native yaw, pitch, roll, model scaling and cockpit visibility',()=>{
 const f=engine('voo','game_flight');f.game.init({mode:'FREE'});const api=renderer(f),g=f.game;
 for(const model of ['falcon','interceptor','sentinel','kestrel','guardian']){
  g.airframe=model;Object.assign(g.ship,{x:33,y:520,z:160,pitch:.3,yaw:-.7,roll:.4});g._updateView(390,844);assert(api.flight(g,canvas(),390,844));assert(api.hasAircraft(g,g.ship));
  const root=f.sceneCapture.getObjectByProperty('type','Group'),p=new f.window.THREE.Vector3(11,3,-12).applyMatrix4(root.matrixWorld),native=g._airframePoint([11,3,-12],g.ship,model);
  assert(Math.hypot(p.x-native.x,p.y-native.y,-p.z-native.z)<1e-8,model+' aircraft transform differs');
 }
 f.settings.camera='cockpit';g._updateView(390,844);api.flight(g,canvas(),390,844);assert.equal(api.hasAircraft(g,g.ship),false);api.release(g);
});
test('WAR branding: installable PNG icon, cover art and visible game name use the new artwork',()=>{
 const manifest=JSON.parse(read('games/ar/manifest.json'));assert.equal(manifest.short_name,'WAR Combate');
 for(const size of [192,512]){const b=readFileSync(`games/ar/icon-${size}.png`);assert.equal(b.subarray(1,4).toString(),'PNG');assert.equal(b.readUInt32BE(16),size);assert.equal(b.readUInt32BE(20),size);assert(manifest.icons.some(i=>i.src===`./icon-${size}.png`))}
 assert(read('covers/ar.svg').includes('data:image/png;base64,'));assert(read('games/ar/index.html').includes('<title>WAR Combate'));
 for(const slug of ['ar','voo']){
  assert.equal(read(`games/${slug}/world-renderer.js`),read('enhancements/war-world-renderer.js'));
  assert(read(`games/${slug}/sw.js`).includes('./vendor/three-r128.min.js'));
 }
});
test('WAR: the visible weapon follows hand aim on both axes without reversing vertical pointing',()=>{
 const f=engine('ar','game_ar');f.game.init({id:'patrol'});const api=renderer(f),g=f.game,T=f.window.THREE;
 const direction=(x,y)=>{g.handAim={x,y,fresh:true};g.player.yaw+=.15;assert(api.combat(g,canvas(),390,844,false));const weapon=f.sceneCapture.getObjectByProperty('type','Group');return new T.Vector3(0,0,-1).applyQuaternion(weapon.quaternion);};
 const left=direction(.25,.48),right=direction(.75,.48),up=direction(.5,.25),down=direction(.5,.7);assert(right.x>left.x);assert(up.y>down.y);api.release(g);
});

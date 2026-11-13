import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {engine,canvas} from './helpers/game-fixture.mjs';
const source=readFileSync('games/ar/front-controls.js','utf8');
function load(window={},search=''){
 vm.runInNewContext(source,{window,location:{search},URLSearchParams});return window.WarFrontControl;
}
const neutral={fresh:true,x:.5,y:.48,calibration:1};
const right={...neutral,x:.94};
function fresh(mode='continuous',fase={id:'training'}){
 const f=engine('ar','game_ar');f.window.ConsolePractice={active:true};const api=load(f.window,'?war-control='+mode);f.game.init(fase);return {...f,api};
}
test('WAR frontal evaluation is off by default, ignores old preferences, and only enters explicit local solo',()=>{
 const w={ConsolePractice:{active:true}},api=load(w);assert.equal(api.getMode(),'legacy');assert.equal(api.create({},{}),null);
 api.select('continuous');assert(api.create({},{}));assert.equal(api.create({},{online:true}),null);
 w.ConsolePractice.active=false;assert.equal(api.create({},{}),null);
 api.select('unknown');assert.equal(api.getMode(),'legacy');assert.equal(load({},'?war-control=unknown').getMode(),'legacy');
});
test('WAR frontal: the central aiming range never rotates the view; continuous turn excludes the 350ms confirmation interval',()=>{
 const {Controller}=load(),c=new Controller();
 for(const x of [.21,.4,.5,.7,.79])for(let i=0;i<120;i++)assert.equal(c.step({...neutral,x},1/60),0);
 let delta=0;for(let i=0;i<20;i++)delta+=c.step(right,1/60);assert.equal(delta,0);
 delta+=c.step(right,1/60);assert(Math.abs(delta)<1e-9);
 delta+=c.step(right,1/60);assert(Math.abs(delta-1.6/60)<1e-9);
 c.step(neutral,1/60);assert.equal(c.edge,0);assert.equal(c.dwell,0);
});
test('WAR frontal: continuous turn is identical at 30/60/120Hz and stepped turn requires recentering',()=>{
 const {Controller}=load();
 const turns=[30,60,120].map(hz=>{const c=new Controller();let turn=0;for(let i=0;i<hz;i++)turn+=c.step(right,1/hz);return turn;});
 for(const value of turns)assert(Math.abs(value-1.6*.65)<1e-8);
 const c=new Controller('step');let total=0;for(let i=0;i<180;i++)total+=c.step(right,1/60);assert(Math.abs(total-Math.PI/4)<1e-8);
 c.step(neutral,1/60);for(let i=0;i<30;i++)total+=c.step({...neutral,x:.06},1/60);assert(Math.abs(total)<1e-8);
});
test('WAR frontal: loss and new calibration clear confirmation rather than reusing a pending turn',()=>{
 const {Controller}=load(),c=new Controller('step');for(let i=0;i<18;i++)assert.equal(c.step(right,1/60),0);
 c.step({...right,fresh:false},1/60);assert.equal(c.edge,0);assert.equal(c.aim.x,.5);
 for(let i=0;i<18;i++)assert.equal(c.step(right,1/60),0);
 assert.equal(c.step({...right,calibration:2},1/60),0);assert(c.dwell<.02);
 c.release();assert.equal(c.dwell,0);assert.equal(c.turn,0);
});
test('WAR native frontal: a held pointer survives first calibration, rotates only the view, and release stops it',()=>{
 const {game:g}=fresh();const start={...g.player};g.frontControls.pointer(.94,.48);
 for(let i=0;i<60;i++)g.step(1/60);
 assert(g.player.yaw>1);assert.equal(g.player.x,start.x);assert.equal(g.player.z,start.z);assert.equal(g.player.pitch,start.pitch);
 g.release();const yaw=g.player.yaw;for(let i=0;i<90;i++)g.step(1/60);assert.equal(g.player.yaw,yaw);assert.equal(g.frontControls.aim.x,.5);
});
test('WAR native frontal stepped turns remain 45 degrees at every sensitivity',()=>{
 for(const sensitivity of [.5,1,2]){
  const {game:g,settings}=fresh('step');settings.sensitivity=sensitivity;g.frontControls.pointer(.94,.48);
  for(let i=0;i<60;i++)g.step(1/60);
  assert(Math.abs(g.player.yaw-Math.PI/4)<1e-8,'the selected fixed step must not scale with sensitivity '+sensitivity);
 }
});
test('WAR native frontal: sight projection and actual hit ray agree in portrait, landscape, ADS and camera mode',()=>{
 const {game:g}=fresh();g.handSession={dualHands:false,dispose(){}};
 for(const [w,h]of [[390,844],[844,390]])for(const ads of [false,true]){
  g.viewSize={w,h};g.aiming=ads;g.player.yaw=.07;g.player.pitch=.05;
  const target=g.enemies[0],point=g.project(target.x,target.y,target.z,w,h);
  g.handAim={...neutral,x:point.x/w,y:point.y/h};g.frontControls.tick(1/60);
  assert.equal(g.targetAtAim(),target);
  const ctx=canvas();g.drawHUD(ctx,w,h);
  assert(ctx.operations.some(([op,x,y])=>op==='moveTo'&&Math.abs(y-point.y)<1e-8&&Math.abs(Math.abs(x-point.x)-5)<1e-8));
 }
});
test('WAR native frontal camera: pointing alone never fires; pinching fires and hand loss freezes motion and clears turn',()=>{
 const {game:g}=fresh();g.handSession={dualHands:false,autoAdvance:false,dispose(){}};g.handAim={...neutral,present:true,fire:false};
 for(let i=0;i<20;i++)g.step(1/60);assert.equal(g.stats.shots,0);
 g.handAim.fire=true;g.step(1/60);assert.equal(g.stats.shots,1);assert.equal(g.trainingTargets,1);
 g.handAim={...right,fire:false,present:true};for(let i=0;i<18;i++)g.step(1/60);
 g.bodyPose={fresh:true,moveX:1,moveZ:1,turnYaw:1.4,lean:.7};g.handAim.fresh=false;const stopped={...g.player,elapsed:g.elapsed,shots:g.stats.shots};
 g.step(.2);assert.deepEqual({...g.player,elapsed:g.elapsed,shots:g.stats.shots},stopped);assert.equal(g.frontControls.dwell,0);
 g.handAim={...neutral,fire:false};g.bodyPose.moveX=g.bodyPose.moveZ=0;g.step(.2);assert.equal(g.player.yaw,stopped.yaw,'body rotation must not turn this mode');
 g.crouched=true;g.step(.016);assert.equal(g.eyeY,1.05,'native crouch button remains usable without a detected torso');
});
test('WAR frontal hand detector: explicit pinch keeps legacy single-hand automatic acquisition unchanged',()=>{
 const window={};vm.runInNewContext(readFileSync('games/ar/hand-controls.js','utf8'),{window,document:{baseURI:'http://test/',currentScript:null},URL});
 const {AimController}=window.WarHandControl;
 const hand=(pinch=false)=>{const p=Array.from({length:21},()=>({x:.5,y:.5,z:0}));p[0]={x:.5,y:.62};p[5]={x:.465,y:.5};p[9]={x:.5,y:.48};p[17]={x:.55,y:.5};p[4]={x:.4,y:.4};p[8]=pinch?{x:.405,y:.4}:{x:.6,y:.4};return p;};
 const result=pinch=>({landmarks:[hand(pinch)],handedness:[[{categoryName:'Left',score:.95}]]});
 const c=new AimController({explicitFire:true});for(let t=0;t<=1100;t+=100)c.consume(result(false),t);
 c.consume(result(false),1200);assert.equal(c.aim.fire,false);c.consume(result(true),1300);assert.equal(c.aim.fire,true);
 c.consume({landmarks:[],handedness:[]},1400);assert.equal(c.aim.fire,false);assert.equal(c.aim.fresh,false);
});

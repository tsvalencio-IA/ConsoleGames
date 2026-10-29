import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';import {dancePose} from './helpers/dance-pose-fixture.mjs';
const window={};vm.runInNewContext(fs.readFileSync('games/ar/body-controls.js','utf8'),{window,document:{baseURI:'http://local.test/'},URL});const{BodyController}=window.WarBodyControl;
function start(){const c=new BodyController();for(let t=100;t<=1300;t+=200)c.consume(dancePose(),null,t);assert(c.neutral);c.consume(dancePose(),null,1500);assert(c.read(1500).fresh);return c;}
test('WAR body: a neutral stance and arm pointing cannot march forward; lateral steps retain mirrored direction',()=>{const c=start();for(let t=1700;t<3000;t+=200){const o=c.consume(dancePose('up'),null,t);assert.equal(o.moveX,0);assert.equal(o.moveZ,0);}assert(c.consume(dancePose('right'),null,3200).moveX>.5);assert(c.consume(dancePose('left'),null,3400).moveX<-.5);assert.equal(c.consume(dancePose('leanRight'),null,3600).moveX,0);});
test('WAR body: crouch, anatomical right turn and two-hand support complement aiming; stale or hidden body releases movement',()=>{const c=start();assert(c.consume(dancePose('squat'),null,1700).crouched);assert(!c.consume(dancePose(),null,1900).crouched);const p=dancePose(),w=p.map(p=>({...p}));w[11].z=-.06;w[12].z=.06;c.neutral.yaw=0;assert(c.consume(p,w,2100).turnYaw>0);p[15].x=.48;p[16].x=.52;assert(c.consume(p,w,2300).twoHands);const o=c.read(3701);assert(!o.fresh&&!o.crouched&&!o.twoHands);assert.equal(o.moveX,0);assert.equal(o.moveZ,0);p[11].visibility=.1;assert(!c.consume(p,null,3900).fresh);});
test('WAR body: whole-body steps can move forward; leaning or duplicate frames cannot walk or calibrate',()=>{const c=start(),p=dancePose();for(const q of p)q.x=.5+(q.x-.5)*1.30;p[27].y+=.05;p[28].y+=.05;assert(c.consume(p,null,1700).moveZ>.4);const lean=dancePose();lean[0].y+=.08;lean[11].y+=.08;lean[12].y+=.08;assert.equal(c.consume(lean,null,1900).moveZ,0);const bad=new BodyController();for(let i=0;i<20;i++)bad.consume(dancePose(),null,100,200);assert.equal(bad.neutral,null);for(let t=300;t<3000;t+=200)bad.consume(dancePose(t%400===100?'right':'left'),null,t);assert.equal(bad.neutral,null);});

test('WAR body: low-priority posture frames every 950ms can calibrate without resetting stable samples',()=>{const c=new BodyController();for(let t=100;t<6800;t+=950)c.consume(dancePose(),null,t,t+120);assert(c.neutral);assert(c.read(6800).fresh);});

test('WAR body: a naturally offset torso is neutral after calibration and landmark jitter cannot turn the camera',()=>{
 const c=new BodyController(),pose=dancePose();for(const i of[0,11,12,13,14,15,16])pose[i].x+=.03;
 for(let t=100;t<=1500;t+=200)c.consume(pose,null,t);assert(c.neutral);assert.equal(c.read(1500).lean,0);
 const noisy=pose.map(p=>({...p})),world=pose.map(p=>({...p,z:0}));noisy[11].x+=.002;noisy[12].x+=.002;world[11].z=-.002;world[12].z=.002;
 const still=c.consume(noisy,world,1700);assert.equal(still.lean,0);assert.equal(still.turnYaw,0);
 const deliberate=pose.map(p=>({...p}));deliberate[11].x+=.07;deliberate[12].x+=.07;assert(Math.abs(c.consume(deliberate,null,1900).lean)>.1,'a deliberate lean must still turn');
});

test('WAR body session: recalibration and pause discard pending observations; disposal clears the body',async()=>{
 let clock=100;const workers=[],frames=[];class Worker{constructor(){workers.push(this);}postMessage(data){frames.push(data);}terminate(){}}
 const scope={window:{},document:{baseURI:'http://local.test/'},URL,Worker,performance:{now:()=>clock},setTimeout:()=>1,clearTimeout(){},createImageBitmap:async()=>({close(){}})};vm.runInNewContext(fs.readFileSync('games/ar/body-controls.js','utf8'),scope);const game={},session=scope.window.WarBodyControl.start(game),worker=workers[0],video={readyState:2,currentTime:1,videoWidth:640,videoHeight:480};worker.onmessage({data:{type:'ready'}});
 session.tick(video,clock,false);await Promise.resolve();assert.equal(frames.at(-1).type,'frame');session.reset();worker.onmessage({data:{type:'pose',timestamp:100,landmarks:dancePose(),worldLandmarks:[]}});assert.equal(session.controller.samples.length,0,'the pre-reset frame cannot become calibration evidence');
 clock=400;video.currentTime=2;session.tick(video,clock,false);await Promise.resolve();worker.onmessage({data:{type:'pose',timestamp:400,landmarks:dancePose(),worldLandmarks:[]}});assert.equal(session.controller.samples.length,1);
 clock=700;video.currentTime=3;session.tick(video,clock,false);await Promise.resolve();session.tick(video,clock,true);worker.onmessage({data:{type:'pose',timestamp:700,landmarks:dancePose(),worldLandmarks:[]}});assert.equal(session.controller.samples.length,1,'a frame captured before pause cannot reactivate the body');assert(!game.bodyPose.fresh);
 session.dispose();session.release();assert.equal(game.bodyPose,null);
});

test('WAR body session: a slow hand gets consecutive observations without starving posture or accepting stale frames',async()=>{
 let clock=2000;const messages=[];class Worker{postMessage(data){messages.push(data);}terminate(){}}
 const scope={window:{},document:{baseURI:'http://local.test/'},URL,Worker,performance:{now:()=>clock},setTimeout:()=>1,clearTimeout(){},createImageBitmap:async()=>({close(){}})};vm.runInNewContext(fs.readFileSync('games/ar/body-controls.js','utf8'),scope);
 const game={},session=scope.window.WarBodyControl.start(game),video={readyState:2,currentTime:1,videoWidth:640,videoHeight:480};session.worker.onmessage({data:{type:'ready'}});session.controller=start();session.nextAt=0;
 session.tick(video,clock,false,294,false,true);await Promise.resolve();assert.equal(messages.filter(m=>m.type==='frame').length,0,'recent posture yields to a due hand frame');assert(game.bodyPose.fresh);
 clock=2250;video.currentTime=2;session.tick(video,clock,false,294,false,true);await Promise.resolve();assert.equal(messages.filter(m=>m.type==='frame').length,1,'posture receives a turn within its freshness budget');
 session.worker.onmessage({data:{type:'pose',timestamp:clock,landmarks:dancePose(),worldLandmarks:[],inferenceMs:240}});clock=2800;video.currentTime=3;session.tick(video,clock,false,294,false,false);await Promise.resolve();assert.equal(messages.filter(m=>m.type==='frame').length,2,'idle hand never prevents posture refresh');
 session.dispose();
});

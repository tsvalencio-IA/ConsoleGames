import test from 'node:test';import assert from 'node:assert/strict';import {engine} from './helpers/game-fixture.mjs';
function fixture(){const f=engine('kart','game_kart');f.window.Gfx={shakeScreen(){}};f.game.init({id:'f1',mode:'RACE',trackId:0,diff:'EASY'});f.game.startRace(0);f.window.ArcadeControls.mode='camera';f.game.localBots=[];f.game.rivals=[];return f;}
const pose=(left=300,right=300,nose=130)=>({keypoints:[{name:'left_wrist',score:.95,x:450,y:left},{name:'right_wrist',score:.95,x:190,y:right},{name:'nose',score:.95,x:320,y:nose}]});
function frame(f,p,ms=1000/30){f.advance(ms);f.game.updatePhysics(390,844,p);}
function neutral(f){for(let i=0;i<8;i++)frame(f,pose());}
test('camera item: a deliberate held right hand consumes one item without touch and preserves wheel direction until return',()=>{
 const f=fixture(),g=f.game;g.item='mushroom';neutral(f);const steer=g.targetSteer;for(let i=0;i<10;i++)frame(f,pose(300,70));assert.equal(g.item,'mushroom','a brief steering/hand movement cannot spend an item');for(let i=0;i<12;i++)frame(f,pose(300,70));assert.equal(g.item,null);assert.equal(g.targetSteer,steer);assert.equal(g.itemCooldown>0,true);
 g.item='banana';for(let i=0;i<90;i++)frame(f,pose(300,70));assert.equal(g.item,'banana','holding the same gesture cannot spend another item');neutral(f);for(let i=0;i<20;i++)frame(f,pose(300,70));assert.equal(g.item,null);assert(!g.turboLock);
});
test('camera item: normal steering, wrong hand, both-hand turbo and tracking loss do not spend items',()=>{
 const f=fixture(),g=f.game;g.item='banana';neutral(f);for(let i=0;i<40;i++)frame(f,pose(300,260));assert.equal(g.item,'banana');for(let i=0;i<40;i++)frame(f,pose(70,300));assert.equal(g.item,'banana');neutral(f);for(let i=0;i<30;i++)frame(f,pose(70,70));assert.equal(g.item,'banana');assert(g.turboLock,'the original two-hand turbo must still work');
 neutral(f);for(let i=0;i<10;i++)frame(f,pose(300,70));frame(f,null);for(let i=0;i<30;i++)frame(f,pose(300,70));assert.equal(g.item,'banana','a missing hand resets gesture arming');
});
test('camera item: stale video and a pause gap cannot trigger a delayed item',()=>{
 const f=fixture(),g=f.game;g.item='mushroom';f.window.System.video={videoWidth:640,videoHeight:480,currentTime:0};for(let i=0;i<9;i++){f.window.System.video.currentTime+=1/30;frame(f,pose());}
 for(let i=0;i<60;i++)frame(f,pose(300,70));assert.equal(g.item,'mushroom','a frozen video frame is not a held gesture');f.advance(1000);f.window.System.video.currentTime+=1/30;frame(f,pose(300,70));assert.equal(g.item,'mushroom');
});
test('camera item: fresh low-rate video observations still confirm the hold, without trusting one delayed observation',()=>{
 const f=fixture(),g=f.game;g.item='mushroom';frame(f,pose(),400);frame(f,pose(),400);frame(f,pose(300,70),400);frame(f,pose(300,70),400);assert.equal(g.item,'mushroom');frame(f,pose(300,70),400);assert.equal(g.item,null);
});

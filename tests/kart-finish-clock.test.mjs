import test from'node:test';import assert from'node:assert/strict';import{engine,canvas}from'./helpers/game-fixture.mjs';
function fixture(){const f=engine('kart','game_kart',{steeringAssist:'high'});f.window.Gfx={shakeScreen(){}};f.game.init({id:'f1',mode:'RACE',trackId:0,targetRank:3,diff:'EASY'});f.game.startRace(0);f.game.localBots=[];f.game.rivals=[];f.game.arcadeManual={throttle:true};return f;}
test('kart progression uses elapsed time at 8 FPS as well as 60 FPS',()=>{
 const distances=[];
 for(const fps of[60,8]){const f=fixture(),ctx=canvas();for(let i=0;i<fps*5;i++){f.advance(1000/fps);f.game.update(ctx,390,844,null);ctx.operations.length=0;}distances.push(f.game.pos);}
 assert(Math.abs(distances[0]-distances[1])<1e-5,JSON.stringify(distances));
});
test('kart finishes through the native update loop and commits a solo result once; an old finish cannot terminate a new race',()=>{
 const f=fixture(),g=f.game,ctx=canvas(),results=[];f.window.System.gameOver=(...args)=>results.push(args);let frames=0;
 while(g.status!=='FINISHED'&&frames++<1800){g.arcadeManual.left=g.playerX>.07;g.arcadeManual.right=g.playerX<-.07;f.advance(125);g.update(ctx,390,844,null);ctx.operations.length=0;}
 assert.equal(g.status,'FINISHED');assert(g.player.finished);assert.equal(g.state,'SPECTATE_WAIT');const finish=f.timers.at(-1);for(let i=0;i<20;i++){f.advance(125);g.update(ctx,390,844,null);ctx.operations.length=0;}
 finish();finish();assert.equal(results.length,1);assert.equal(g.state,'GAMEOVER');g.startRace(0);finish();assert.equal(g.state,'RACE');assert.equal(g.status,'RACING');assert.equal(results.length,1);
});
test('hand-on-head item still fires when the same fresh pose exposes eyes/ears while the wrist hides the nose',()=>{
 const f=fixture(),g=f.game;f.window.ArcadeControls.mode='camera';g.item='banana';const neutral={keypoints:[{name:'left_wrist',x:450,y:300,score:.95},{name:'right_wrist',x:190,y:300,score:.95},{name:'nose',x:320,y:130,score:.95}]};
 for(let i=0;i<10;i++){f.advance(50);g.updatePhysics(390,844,neutral);}
 const head={keypoints:[{name:'left_wrist',x:450,y:300,score:.95},{name:'right_wrist',x:285,y:105,score:.23},{name:'nose',x:320,y:130,score:.05},{name:'left_eye',x:332,y:124,score:.9},{name:'right_eye',x:308,y:124,score:.9}]};
 for(let i=0;i<12;i++){f.advance(50);g.updatePhysics(390,844,head);}assert.equal(g.item,null);assert(g.itemCooldown>0);
});

/* Native cup UI + physics in two browsers over an isolated HTTP/SSE backend.
 * Camera input uses an explicit synthetic video/pose fixture, never real users. */
import {chromium} from 'playwright';import assert from 'node:assert/strict';import {mkdirSync,writeFileSync} from 'node:fs';
import {multiplayerServer,installMultiplayerFixture} from './helpers/multiplayer-browser-fixture.mjs';
const server=await multiplayerServer(),browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']}),results=[],out='test-results/kart-cups';mkdirSync(out,{recursive:true});
try{
 for(const phase of ['f1','f2','f3','arcade']){
  const contexts=[],pages=[],errors=[];console.log('CUP MENU',phase);
  try{
   for(let i=0;i<2;i++){
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});contexts.push(context);await installMultiplayerFixture(context);
    const camera=phase==='f1'&&i===0;
    if(camera)await context.addInitScript(()=>{
     window.__kartPose={keypoints:[{name:'left_wrist',score:.95,x:450,y:300},{name:'right_wrist',score:.95,x:190,y:300},{name:'nose',score:.95,x:320,y:130}]};
     Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async constraints=>{window.__cameraRequests++;window.__kartCameraConstraints=constraints;const feed=document.createElement('canvas');feed.width=640;feed.height=480;const ctx=feed.getContext('2d');let frame=0;const draw=()=>{ctx.fillStyle='#355d6b';ctx.fillRect(0,0,640,480);ctx.fillStyle='#b8d8bd';ctx.fillRect((frame++*7)%600,200,20,30);requestAnimationFrame(draw);};draw();return feed.captureStream(30);}}});
     window.poseDetection.createDetector=async()=>({estimatePoses:async()=>[{keypoints:window.__kartPose.keypoints.map(p=>({...p}))}]});
    });
    await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.request().resourceType()==='script'?r.fulfill({status:200,contentType:'application/javascript',body:'/* external services blocked in isolated cup test */'}):r.abort('blockedbyclient'));
    const p=await context.newPage();pages.push(p);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&/TypeError|ReferenceError|Crash Prevented/.test(m.text()))errors.push(m.text());});
    await p.goto(server.origin+'/games/kart/',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.Games?.some(g=>g.id==='drive')&&window.System?.canvas);
    await p.locator('#phase-screen:not(.hidden)').waitFor({timeout:6000}).catch(()=>p.locator('#channel-grid .channel').first().click());
    const idx=await p.evaluate(phase=>Games.find(g=>g.id==='drive').opts.phases.findIndex(p=>p.id===phase),phase);await p.locator('#phase-grid .mission-card').nth(idx).click();await p.locator('[data-mode="'+(camera?'camera':'controls')+'"]').click();await p.waitForFunction(()=>System.activeGame?.logic.state==='MODE_SELECT');
    const r=await p.locator('#game-canvas').boundingBox();await p.touchscreen.tap(r.x+r.width*.5,r.y+r.height*.67);await p.waitForFunction(()=>System.activeGame.logic.isOnline&&System.activeGame.logic.state==='LOBBY');
   }
   await Promise.all(pages.map(p=>p.waitForFunction(()=>System.activeGame.logic.liveHumans().length===2)));
   const hostIndex=await pages[0].evaluate(()=>System.activeGame.logic.isHost)?0:1,host=pages[hostIndex],guest=pages[1-hostIndex];
   const r=await host.locator('#game-canvas').boundingBox();await host.touchscreen.tap(r.x+r.width*.5,r.y+r.height*.91);await Promise.all(pages.map(p=>p.waitForFunction(()=>System.activeGame.logic.state==='RACE')));
   assert.equal(await host.evaluate(()=>System.activeGame.logic.onlineCup.phaseId),phase);assert.equal(await guest.evaluate(()=>System.activeGame.logic.onlineCup.phaseId),phase);
   if(phase==='f1'){
    const camera=pages[0];await camera.bringToFront();await camera.waitForFunction(()=>System.activeGame.logic.inputActive&&System.activeGame.logic.pos>50);assert.equal(await camera.locator('[aria-label="Usar item guardado somente ao tocar"]').count(),0);
    assert.equal(await camera.evaluate(()=>__kartCameraConstraints.video.facingMode.ideal),'user');
    await camera.evaluate(()=>{window.__fixtureItemUses=[];const g=System.activeGame.logic,original=g.updatePhysics;g.updatePhysics=function(...args){const item=this.item;const out=original.apply(this,args);if(item&&this.item===null&&this.itemCooldown>0)__fixtureItemUses.push(item);return out;};});
    await camera.waitForFunction(()=>System.activeGame.logic.cameraItemGesture?.armed);await camera.evaluate(()=>{System.activeGame.logic.item='mushroom';Object.assign(__kartPose.keypoints.find(p=>p.name==='right_wrist'),{x:285,y:105});});await camera.waitForFunction(()=>__fixtureItemUses.length===1);
    await camera.evaluate(()=>System.activeGame.logic.item='banana');await camera.waitForTimeout(1200);assert.equal(await camera.evaluate(()=>System.activeGame.logic.item),'banana','one hold must not spend a second item');assert.equal(await camera.evaluate(()=>__fixtureItemUses.length),1);
    await camera.evaluate(()=>Object.assign(__kartPose.keypoints.find(p=>p.name==='right_wrist'),{x:190,y:300}));await camera.waitForFunction(()=>System.activeGame.logic.cameraItemGesture?.armed);await camera.evaluate(()=>Object.assign(__kartPose.keypoints.find(p=>p.name==='right_wrist'),{x:285,y:105}));await camera.waitForFunction(()=>__fixtureItemUses.length===2);await camera.evaluate(()=>Object.assign(__kartPose.keypoints.find(p=>p.name==='right_wrist'),{x:190,y:300}));
    console.log('HAND ON HEAD ITEMS PASS');
    // Accelerate the clock of simulation by running the original 60 Hz physics
    // in batches. No finish flags, laps, position, scores or standings are set.
    // Profile persistence is disabled only inside this fixture; native coin
    // collection and in-memory balances still execute.
    await Promise.all(pages.map(p=>p.evaluate(()=>{System.paused=true;Profile.save=()=>{};Sfx.play=Sfx.coin=Sfx.error=()=>{};})));
    let totalTicks=0;
    for(let stage=0;stage<3;stage++){
     let finished=false,ticks=0;
     while(!finished&&ticks<7000){
      const states=await Promise.all(pages.map((p,i)=>p.evaluate(({batch,offset})=>{const g=System.activeGame.logic;for(let k=0;k<batch;k++){
       if(g.status==='RACING'){
        const target=.23*Math.sin((g.__testTick||0)/110)+offset,right=g.playerX<target-.035,left=g.playerX>target+.035;
        if(ArcadeControls.mode==='controls')Object.assign(g.arcadeManual,{throttle:true,left,right});
        else{const dy=Math.tan((right?.85:left?-.85:0)/1.8)*130;window.__kartPose={keypoints:[{name:'left_wrist',score:.95,x:450,y:300-dy},{name:'right_wrist',score:.95,x:190,y:300+dy},{name:'nose',score:.95,x:320,y:130}]};}
        g.updatePhysics(390,844,ArcadeControls.mode==='camera'?__kartPose:null);g.__testTick=(g.__testTick||0)+1;if(g.status==='FINISHED')g.checkRaceStatus();
       }else if(g.isHost&&g.onlineCup.state==='RACING'){g.updateBotDrivers();g.updateProjectiles();}
      }g.syncMultiplayer(true);return {finished:g.status==='FINISHED',physicalFinish:g.player.finished,stage:g.onlineCup.stage,pos:g.pos};},{batch:200,offset:i? .08:-.08})));
      ticks+=200;finished=states.every(s=>s.finished&&s.physicalFinish);
     }
     assert(finished,'both real physics engines must finish stage '+stage);totalTicks+=ticks;
     await Promise.all(pages.map(p=>p.waitForFunction(()=>System.activeGame.logic.onlineCup.state==='RESULTS')));
     const table=await host.evaluate(()=>System.activeGame.logic.onlineCup.results);assert.deepEqual(await guest.evaluate(()=>System.activeGame.logic.onlineCup.results),table);
     await Promise.all(pages.map(p=>p.evaluate(()=>{const g=System.activeGame.logic,c=System.canvas;g.renderOnlineStage(c.getContext('2d'),c.width,c.height);})));
     const tapContinue=async p=>{const box=await p.locator('#game-canvas').boundingBox(),b=await p.evaluate(()=>System.activeGame.logic.onlineActionHitbox),size=await p.evaluate(()=>({w:System.canvas.width,h:System.canvas.height}));await p.touchscreen.tap(box.x+(b.x+b.w/2)*box.width/size.w,box.y+(b.y+b.h/2)*box.height/size.h);};
     await tapContinue(host);await host.waitForFunction(()=>System.activeGame.logic.confirmedOnlineMatch.endsWith(':RESULTS'));assert.equal(await host.evaluate(()=>System.activeGame.logic.onlineCup.state),'RESULTS');await tapContinue(guest);
     await Promise.all(pages.map(p=>p.waitForFunction(expected=>System.activeGame.logic.onlineCup.state===expected,stage===2?'CUP_END':'RACING')));console.log('ACTUAL CUP STAGE PASS',stage+1);
    }
    await Promise.all(pages.map(p=>p.evaluate(()=>System.paused=false)));await Promise.all(pages.map(p=>p.waitForFunction(()=>System.activeGame.logic.onlineCupOutcome.complete)));
    const standings=await host.evaluate(()=>System.activeGame.logic.onlineCup.standings);assert.deepEqual(await guest.evaluate(()=>System.activeGame.logic.onlineCup.standings),standings);assert.equal(standings.length,6);
    for(let i=0;i<2;i++)await pages[i].screenshot({path:`${out}/podium-${i+1}.png`});results.push({phase,passed:true,fullCupStages:3,originalPhysicsAccelerated:true,physicsTicks:totalTicks,identicalStandings:true,cameraSyntheticInput:true,handsFreeItem:true,handOnHeadGesture:true,heldGestureDoesNotRepeat:true,realHardwareCamera:false});
   }else results.push({phase,passed:true,nativeOnlineSelector:true,twoClientsInSamePhase:true});
   assert.deepEqual(errors,[]);for(const p of pages)await p.evaluate(()=>System.activeGame.logic.cleanup());
  }catch(error){for(let i=0;i<pages.length;i++){console.error('CUP DEBUG',phase,i,await pages[i].evaluate(()=>{const g=System.activeGame?.logic;return {state:g?.state,cup:g?.onlineCup,host:g?.isHost,paused:g?.networkPaused,gesture:g?.cameraItemGesture,item:g?.item,cooldown:g?.itemCooldown,uses:window.__fixtureItemUses,pose:window.__kartPose,video:{time:System.video?.currentTime,ready:System.video?.readyState,h:System.video?.videoHeight}};}).catch(()=>null));await pages[i].screenshot({path:`${out}/${phase}-failure-${i}.png`}).catch(()=>{});}throw error;}finally{for(const c of contexts)await c.close();}
 }
 writeFileSync(out+'/result.json',JSON.stringify({passed:true,scope:'Independent Chromium clients, local HTTP/SSE RTDB fixture, synthetic camera poses/video. No live Firebase or physical phones.',results},null,2));
}finally{await browser.close();await server.close();}

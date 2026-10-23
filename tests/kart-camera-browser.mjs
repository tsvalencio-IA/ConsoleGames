/* Enter the real world autodromes and choose the real front-camera mode.
 * Only the video source is a fixture: MoveNet and its pose outputs are real. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {browserNetwork,browserContextNetwork} from './helpers/browser-network.mjs';
import {touchSession} from './helpers/touch-session.mjs';
const base=process.env.KART_QA_URL||'http://127.0.0.1:4173/games/otthi/';
const origin=new URL(base).origin,output='test-results/kart-camera';fs.mkdirSync(output,{recursive:true});
const fixture='data:image/jpeg;base64,'+fs.readFileSync('tests/fixtures/hand/woman_hands.jpg').toString('base64');
const browser=await chromium.launch({...browserNetwork(base),headless:true,args:[...(browserNetwork(base).proxy?['--ignore-certificate-errors']:[]),'--use-gl=angle','--use-angle=swiftshader','--no-sandbox','--disable-dev-shm-usage']});
const results=[];
try{
 for(const spec of [{id:'aurora',x:300,z:-212,width:852,height:393},{id:'costa',x:-300,z:-156,width:393,height:852}].filter(s=>!process.env.KART_QA_AUTODROMES||process.env.KART_QA_AUTODROMES.split(',').includes(s.id))){
  const context=await browser.newContext({...browserContextNetwork(base),viewport:{width:spec.width,height:spec.height},isMobile:true,hasTouch:true,serviceWorkers:process.env.KART_QA_CANDIDATE?'block':'allow'});
  await context.addInitScript(({origin,spec,fixture})=>{
   if(location.origin!==origin)return;
   if(!localStorage.getItem('otthos_life_world_roleplay_v700'))localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,position:{x:spec.x,y:0,z:spec.z,yaw:0},profile:{name:'Thiago QA',nameConfirmed:true,playerId:'kart-camera-qa',coins:4321,xp:1234},flags:{accountPromptedV635:true},settings:{quality:'low'},guardian:{sessionLimitMinutes:0},familyAdventure:{party:{controller:'thiago',members:['thiago','luna','liz']}}}));
   window.__cameraRequests=[];window.__wheelPaints=0;window.__handOffsetX=0;window.__handOffsetY=0;window.__blankHands=false;
   Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async constraints=>{
    window.__cameraRequests.push(constraints);const image=new Image();image.src=fixture;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const ctx=canvas.getContext('2d');let tick=0;
    const render=()=>{ctx.fillStyle='#dcdddd';ctx.fillRect(0,0,640,480);if(!window.__blankHands){ctx.save();ctx.translate(320+window.__handOffsetX,240+window.__handOffsetY);ctx.rotate(.15);ctx.drawImage(image,-160,-240,320,480);ctx.restore();}ctx.fillStyle=++tick%2?'#eee':'#ddd';ctx.fillRect(0,0,8,8);};
    render();const timer=setInterval(render,65),stream=canvas.captureStream(15);stream.getVideoTracks()[0].addEventListener('ended',()=>clearInterval(timer));return stream;
   }}});
   const fill=CanvasRenderingContext2D.prototype.fillText;
   CanvasRenderingContext2D.prototype.fillText=function(label,...args){
    const result=fill.call(this,label,...args);
    if(label==='GT'&&this.canvas.id==='game-canvas'&&window.System?.activeGame?.logic.state==='RACE'){
     const matrix=this.getTransform();window.__wheelPaints++;window.__lastWheelPaint={x:matrix.e,y:matrix.f,alpha:this.globalAlpha,width:this.canvas.width,height:this.canvas.height};
    }
    return result;
   };
  },{origin,spec,fixture});
  await context.route(/^https?:\/\//,route=>{
   const url=new URL(route.request().url());
   if(url.origin===origin){
    if(process.env.KART_QA_CANDIDATE){
     const file=url.pathname==='/games/kart/'?'games/kart/index.html':url.pathname.slice(1);
     if(['games/kart/index.html','games/kart/js/game_kart.js','games/kart/local-practice.js'].includes(file))return route.fulfill({status:200,contentType:file.endsWith('.html')?'text/html':'application/javascript',body:fs.readFileSync(file)});
    }
    return route.continue();
   }
   if(['cdn.jsdelivr.net','tfhub.dev','storage.googleapis.com','www.kaggle.com','kaggle.com'].includes(url.hostname))return route.continue();
   if(route.request().resourceType()==='script')return route.fulfill({status:200,contentType:'application/javascript',body:'/* unrelated remote services isolated for QA */'});
   return route.abort('blockedbyclient');
  });
  const page=await context.newPage(),errors=[],fingers=await touchSession(context,page);page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.OTTHI_RELEASE_COHERENT);await page.locator('#playBtn').tap();
   await page.waitForFunction(id=>window.OTTHOS_TEST_API?.getContext()?.id==='kart-race-'+id,spec.id,{timeout:90000});
   const finger=await fingers.start(page.locator('#actionBtn'));await fingers.end(finger);await page.waitForURL(url=>url.pathname.endsWith('/games/kart/')&&url.searchParams.get('venuePage')==='1');
   await page.locator('#phase-screen:not(.hidden)').waitFor();assert.equal(await page.evaluate(()=>window.__cameraRequests.length),0);
   await page.locator('#phase-grid .mission-card:not(.locked)').first().tap();await page.locator('[data-mode="camera"]').tap();
   await page.waitForFunction(()=>window.System?.activeGame?.id==='drive',null,{timeout:90000});
   assert.equal(await page.evaluate(()=>window.ArcadeControls.mode),'camera');assert.equal(await page.evaluate(()=>window.__cameraRequests[0].video.facingMode.ideal),'user');
   const canvas=page.locator('#game-canvas');let rect=await canvas.boundingBox();
   if(await page.evaluate(()=>window.System.activeGame.logic.state)==='MODE_SELECT')await canvas.tap({position:{x:rect.width*.5,y:rect.height*.3}});
   await page.waitForFunction(()=>window.System.activeGame.logic.state==='LOBBY');rect=await canvas.boundingBox();await canvas.tap({position:{x:rect.width*.5,y:rect.height*.92}});
   await page.waitForFunction(()=>window.System.activeGame.logic.state==='RACE'&&window.System.activeGame.logic.inputActive&&window.__wheelPaints>2,null,{timeout:45000});
   assert.equal(await page.locator('.kart-input:visible').count(),0,'Camera steering must not be replaced by manual buttons');
   const before=await page.evaluate(()=>({...window.__lastWheelPaint,paints:window.__wheelPaints,model:tf.version_core,backend:tf.getBackend(),wheel:window.System.activeGame.logic.virtualWheel,position:window.System.activeGame.logic.pos}));
   assert(before.alpha>.9);assert(before.wheel.r>20);assert(before.position>0);await page.screenshot({path:output+'/'+spec.id+'-hands-wheel.png'});
   await page.evaluate(()=>{window.__handOffsetX=45;window.__handOffsetY=-20;});
   await page.waitForFunction(b=>window.__lastWheelPaint.x<b.x-12&&window.__lastWheelPaint.y<b.y-5,before,{timeout:18000});
   const moved=await page.evaluate(()=>window.__lastWheelPaint);await page.screenshot({path:output+'/'+spec.id+'-moved-hands.png'});
   await page.evaluate(()=>window.__blankHands=true);await page.waitForFunction(()=>window.System.activeGame.logic.trackingLost&&!window.System.activeGame.logic.inputActive,null,{timeout:15000});
   await page.waitForFunction(()=>window.System.activeGame.logic.speed<1&&window.System.activeGame.logic.virtualWheel.opacity<.01,null,{timeout:15000});
   const stopped=await page.evaluate(()=>({speed:window.System.activeGame.logic.speed,mode:window.ArcadeControls.mode}));assert.equal(stopped.mode,'camera');
   await page.evaluate(()=>{window.__blankHands=false;window.__handOffsetX=window.__handOffsetY=0;});await page.waitForFunction(()=>window.System.activeGame.logic.inputActive&&window.System.activeGame.logic.virtualWheel.opacity===1,null,{timeout:15000});
   await page.locator('[data-venue-return]').tap();await page.waitForURL(url=>url.pathname.endsWith('/games/otthi/'));
   await page.waitForFunction(()=>window.OTTHOS_TEST_API?.getGame().running&&!window.WorldVenueTrip.current(),null,{timeout:90000});
   const state=await page.evaluate(()=>{const s=window.OTTHOS_TEST_API.getState();return {coins:s.profile.coins,xp:s.profile.xp,members:s.familyAdventure.party.members};});
   assert.equal(state.coins,4321);assert.equal(state.xp,1234);assert.deepEqual(state.members,['thiago','luna','liz']);assert.deepEqual(errors,[]);
   results.push({autodrome:spec.id,viewport:{width:spec.width,height:spec.height},realModel:before.model,backend:before.backend,frontCamera:true,manualButtonsAbsent:true,visibleWheelFollowsHands:true,before:{x:before.x,y:before.y},moved:{x:moved.x,y:moved.y},trackingLossStopsKart:true,handsCanReturn:true,worldAndFamilyPreserved:true,errors});console.log('PASS world → '+spec.id+' → real MoveNet camera/wheel → world');
  }catch(error){await page.screenshot({path:output+'/'+spec.id+'-failure.png'});console.error(await page.evaluate(()=>({url:location.href,game:window.System?.activeGame?.id,mode:window.ArcadeControls?.mode,state:window.System?.activeGame?.logic.state,wheel:window.System?.activeGame?.logic.virtualWheel,paint:window.__lastWheelPaint,requests:window.__cameraRequests?.length,model:window.tf?.version_core})));throw error;}
  finally{await context.close();}
 }
 fs.writeFileSync(output+'/result.json',JSON.stringify({passed:true,base,candidateAssets:!!process.env.KART_QA_CANDIDATE,results,limits:['Reference image used as a video source; no physical user camera, lighting or hand precision certified.']},null,2));
}finally{await browser.close();}

/* Native browser mission flow with a fake camera device and controlled pose
 * samples. Waypoint approaches are staged, flying and landing use the engine. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';

const out=process.env.OT_FLIGHT_REPORTER_OUT||'test-results/flight-reporter-gesture';
fs.mkdirSync(out,{recursive:true});
const server=await multiplayerServer();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
const errors=[],report={browser:browser.version(),photos:[],limits:['Local Chromium profile with external network and accounts blocked.','Browser camera device is synthetic. The detector supplies scripted keypoints at intervals of 20 or 180 ms, covering confidence and scale variation without claiming recognition under physical lighting.','The three approaches and the runway entry position are set by the harness. Calibration, native updates, shutters, stability checks, landing and save are run normally.']};
let page;
try{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,serviceWorkers:'block',permissions:['camera']});
 await context.route(/^https?:\/\//,route=>new URL(route.request().url()).origin===server.origin?route.continue():route.request().resourceType()==='script'?route.fulfill({contentType:'application/javascript',body:'/* isolated services */'}):route.abort());
 await context.addInitScript(()=>{
  window.__flightPose={hand:null,scale:1,offset:0,score:.97,interval:20};
  window.tf={ready:async()=>{}};
  window.poseDetection={SupportedModels:{MoveNet:'MoveNet'},movenet:{modelType:{SINGLEPOSE_LIGHTNING:'lightning'}},createDetector:async()=>({
   async estimatePoses(video){
    const {hand,scale,offset,score,interval}=window.__flightPose;
    if(interval>0)await new Promise(resolve=>setTimeout(resolve,interval));
    return[{keypoints:[['left_shoulder',260,184],['right_shoulder',380,184],['left_wrist',220,hand==='left'?112:245],['right_wrist',420,hand==='right'?112:245]].map(([name,x,y])=>({name,x:(320+(x-320)*scale)*video.videoWidth/640,y:(224+(y-224)*scale+offset)*video.videoHeight/480,score}))}];
   }
  })};
 });
 page=await context.newPage();page.setDefaultTimeout(30000);page.on('pageerror',error=>errors.push(error.stack));
 await page.goto(server.origin+'/games/voo/');
 await page.locator('[data-solo-start]').click();
 await page.locator('#phase-grid .mission-card').filter({hasText:'REPÓRTER AÉREO'}).click();
 await page.locator('[data-mode="camera"]').click();
 await page.waitForFunction(()=>System.activeGame?.logic.state==='HANGAR');
 assert.equal(await page.evaluate(()=>ArcadeControls.mode),'camera');
 const canvas=page.locator('#game-canvas');
 const bounds=await canvas.boundingBox();
 assert(bounds);await canvas.click({position:{x:bounds.width/2,y:bounds.height*.9}});
 await page.waitForFunction(()=>System.activeGame?.logic.state==='CALIBRATION');
 await page.waitForFunction(()=>System.activeGame?.logic.state==='PLAYING',null,{timeout:45000});
 const shutter=page.locator('.flight-camera-actions [data-control="photo"]');
 await shutter.waitFor({state:'visible'});
 for(let index=0;index<3;index++){
  if(index===1)await page.setViewportSize({width:390,height:844});
  await page.evaluate(({index})=>{
   const g=System.activeGame.logic,p=FlightOperations.routes.reporter[index];
   window.__flightPose.interval=index===1?180:20;
   window.__flightPose.score=index===1?.39:.97;
   Object.assign(g.ship,{x:p.x,y:p.y+38,z:p.z-290,vx:0,vy:0,vz:92,roll:0,yaw:0,pitch:0});
   g.view=null;
  },{index});
  await page.waitForFunction(()=>System.activeGame.logic.flightOperation.stable>=1);
  await page.evaluate(i=>{window.__flightPose.hand=i===1?'right':'left';},index);
  await page.waitForFunction(i=>System.activeGame.logic.flightOperation.photos.length===i+1,index);
  const photo=await page.evaluate(i=>{
   const g=System.activeGame.logic,p=g.flightOperation.photos[i];
   return {point:p.point,site:p.site,thumbnailBytes:p.thumbnail?.length||0,axes:g.ship.inputs,roll:g.ship.roll,pitch:g.ship.pitch,weapon:!!g.pilot.headTilt,boost:g.ship.afterburner};
  },index);
  assert.equal(photo.point,index+1);assert(photo.thumbnailBytes>100);assert.equal(photo.weapon,false);assert.equal(photo.boost,false);
  assert(Math.abs(photo.axes.roll)<.03&&Math.abs(photo.axes.pitch)<.03);
  assert(Math.abs(photo.roll)<.03&&Math.abs(photo.pitch)<.03);
  report.photos.push(photo);
  if(index===1)await page.screenshot({path:out+'/photo-portrait.png'});
  await page.evaluate(()=>{window.__flightPose.hand=null;});
  await page.waitForFunction(()=>System.activeGame.logic.flightOperation.stage==='return'||System.activeGame.logic.flightOperation.gesture.armed);
 }
 assert.equal(await page.evaluate(()=>System.activeGame.logic.flightOperation.stage),'return');
 await page.evaluate(()=>{
  const g=System.activeGame.logic;g.pilot.throttle=0;g.onGround=false;
  Object.assign(g.ship,{x:0,y:8.04,z:-900,vx:0,vy:-2.1,vz:25,roll:0,pitch:0,yaw:0});
 });
 await page.waitForFunction(()=>System.activeGame?.logic.state==='VICTORY');
 report.result=await page.evaluate(()=>{
  const g=System.activeGame.logic;
  return{state:g.state,landingQuality:g.landingQuality,career:g.flightCareer,saved:JSON.parse(localStorage.getItem(g.careerKey)),camera:ArcadeControls.mode};
 });
 assert.equal(report.result.landingQuality,'smooth');
 assert.equal(report.result.saved.missions.reporter.completed,1);assert.equal(report.result.saved.missions.reporter.photos,3);
 assert.deepEqual(errors,[]);report.passed=true;console.log('PASS browser: native calibration, three independent photo gestures, real runway touchdown and saved career');
}catch(error){
 report.passed=false;report.failure=error.stack;
 report.last=await page?.evaluate(()=>{const g=System.activeGame?.logic;return{state:g?.state,operation:g?.flightOperation?.kind,stage:g?.flightOperation?.stage,photos:g?.flightOperation?.photos?.length,stable:g?.flightOperation?.stable,action:g?.pilot.cameraAction,neutral:g?.pilot.handNeutral,ship:g?.ship};}).catch(()=>null);
 await page?.screenshot({path:out+'/failure.png',timeout:10000}).catch(()=>{});throw error;
}finally{
 report.errors=errors;fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2)+'\n');await browser.close();await server.close();
}

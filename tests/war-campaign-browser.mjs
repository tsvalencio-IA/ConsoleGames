/* Actual phase buttons, production WebGL, both phone layouts. No drawing cap or renderer mocks. */
import{chromium}from'playwright';import assert from'node:assert/strict';import fs from'node:fs';import crypto from'node:crypto';
import{multiplayerServer}from'./helpers/multiplayer-browser-fixture.mjs';import{browserNetwork,browserContextNetwork}from'./helpers/browser-network.mjs';
const server=await multiplayerServer(),origin=process.env.CONSOLE_QA_ORIGIN||server.origin,browser=await chromium.launch({...browserNetwork(origin),executablePath:process.env.OT_BROWSER_BINARY,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
fs.mkdirSync('test-results/war-campaign',{recursive:true});const results=[];
try{
 for(const[id,index]of[['patrol',0],['city',1],['extraction',2]]){
  const context=await browser.newContext({...browserContextNetwork(origin),viewport:{width:844,height:390},hasTouch:true,isMobile:true,serviceWorkers:'block'});
  await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===origin?r.continue():r.request().resourceType()==='script'?r.fulfill({contentType:'application/javascript',body:'/* isolate external account services */'}):r.abort('blockedbyclient'));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(origin+'/games/ar/',{waitUntil:'domcontentloaded'});await page.locator('[data-solo-start]').click();await page.waitForFunction(()=>window.ConsolePractice.active&&System.canvas);await page.locator('#phase-grid .mission-card').nth(index).click();await page.locator('[data-mode="controls"]').click();
   await page.waitForFunction(id=>System.activeGame?.logic.mission.id===id&&System.activeGame.logic.worldVisual?.frames>=2&&System.activeGame.logic.wave>=1,id,{timeout:15000});
   await page.locator('.input-mode-tip').waitFor({state:'detached',timeout:6000});const report={id,layouts:[],errors};
   for(const viewport of[{width:844,height:390},{width:390,height:844}]){
    await page.setViewportSize(viewport);await page.waitForFunction(({width,height})=>System.canvas.width===width&&System.canvas.height===height,viewport);await page.waitForTimeout(300);
    const result=await page.evaluate(()=>{
     const g=System.activeGame.logic,w=System.canvas.width,h=System.canvas.height;System.paused=true;g.drawVirtualScene(System.canvas.getContext('2d'),w,h);
     const pixels=System.canvas.getContext('2d').getImageData(Math.round(w*.12),Math.round(h*.30),Math.round(w*.76),Math.round(h*.28)).data;let brightness=0,colored=0;for(let i=0;i<pixels.length;i+=28){brightness+=pixels[i]+pixels[i+1]+pixels[i+2];colored+=pixels[i]>4||pixels[i+1]>4||pixels[i+2]>4;}
     const scene=Array.from(pixels.filter((_,i)=>i%97===0));g.drawHUD(System.canvas.getContext('2d'),w,h);return{mission:g.mission.id,metrics:ArcadeWorldRenderer.inspect(g),brightness,colored,scene,w,h,objective:g.objectiveHint()};
    });
    fs.writeFileSync(`test-results/war-campaign/${id}-${viewport.width}-inspection.json`,JSON.stringify(result,null,2));assert.equal(result.mission,id);assert(result.metrics.staticInstances>250,JSON.stringify({id,metrics:result.metrics}));assert(result.metrics.renderer.triangles>100);assert(result.colored>500);assert(result.metrics.infantry.length>0,'detailed infantry must actually be drawn');assert(result.metrics.infantry.some(e=>e.head.depth<1&&e.head.depth>0&&e.head.x>0&&e.head.x<1&&e.head.y>0&&e.head.y<1),'detailed opponents must project into the visible battlefield: '+JSON.stringify({id,infantry:result.metrics.infantry}));assert(!await page.locator('.combat-input [data-control="aim"]').count());
    result.sceneHash=crypto.createHash('sha256').update(Buffer.from(result.scene)).digest('hex');delete result.scene;await page.screenshot({path:`test-results/war-campaign/${id}-${viewport.width}x${viewport.height}.png`});report.layouts.push(result);
    await page.evaluate(()=>System.paused=false);
   }
   assert.equal(errors.length,0,errors.join('\n'));results.push(report);
  }finally{await context.close();}
 }
 assert.equal(new Set(results.map(r=>r.layouts[0].sceneHash)).size,3,'the actual battlefield pixels must differ');assert.equal(new Set(results.map(r=>r.layouts[0].metrics.staticInstances)).size,3,'the three maps need distinct geometry');
 fs.writeFileSync('test-results/war-campaign/result.json',JSON.stringify({passed:true,origin,checkedAt:new Date().toISOString(),results,limits:['Chromium/SwiftShader in automated environment; physical phone frame rate and player testing not certified.']},null,2));console.log('PASS WAR three different real WebGL battlefields via real phase buttons in both mobile layouts, without JS errors');
}finally{await browser.close();await server.close();}

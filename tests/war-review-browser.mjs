import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
const out='test-results/war-review';fs.mkdirSync(out,{recursive:true});
const server=await multiplayerServer(),browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={views:[],errors:[],limits:['Software GPU; no physical Android FPS, camera ergonomics or temperature measurement.']};let page;
try{
 for(const compatible of[false,true]){
  const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.request().resourceType()==='script'?r.fulfill({contentType:'application/javascript',body:'/* isolated remote services */'}):r.abort());
  if(compatible)await context.addInitScript(()=>{const native=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:native.call(this,type,...args);};});
  page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.stack));await page.goto(server.origin+'/games/ar/');await page.locator('[data-solo-start]').click();await page.waitForFunction(()=>window.ConsolePractice.active&&System.canvas);
  await page.locator('#phase-grid .mission-card[data-mission=patrol]').first().click();await page.locator('[data-mode=controls]').click();await page.waitForFunction(()=>System.activeGame?.logic?.state==='PLAYING');
  for(const viewport of[{width:844,height:390},{width:390,height:844}]){
   await page.setViewportSize(viewport);
   for(const mission of['patrol','city','extraction','training']){
    const info=await page.evaluate(({mission,compatible})=>{const s=System,g=s.activeGame.logic;g.init({id:mission});g.waveDelay=999;g.spawnWave();for(const e of g.enemies)e.aim=999;g.elapsed=10;s.paused=true;const w=s.canvas.width,h=s.canvas.height,ctx=s.canvas.getContext('2d');g.drawVirtualScene(ctx,w,h);g.drawHUD(ctx,w,h);return{mission,compatible,w,h,visual:g.worldVisual||null,ammo:g.ammo,hp:g.player.hp};},{mission,compatible});
    if(!compatible)assert(info.visual?.frames>0,'Actual WebGL frame missing');else assert.equal(info.visual,null);
    const controls=await page.locator('.combat-input button:not([hidden]), .combat-input .combat-stick:not([hidden])').evaluateAll(nodes=>nodes.filter(e=>getComputedStyle(e).display!=='none').map(e=>({id:e.dataset.control||'stick',x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));
    for(const b of controls){assert(b.x>=-1&&b.y>=-1&&b.x+b.w<=viewport.width+1&&b.y+b.h<=viewport.height+1,JSON.stringify({viewport,b}));assert(b.w>=44&&b.h>=44);}
    for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){const a=controls[i],b=controls[j];assert(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)<2||Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)<2,'Controls overlap: '+a.id+'/'+b.id);}
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:`${out}/${compatible?'compatible':'webgl'}-${mission}-${viewport.width}x${viewport.height}.png`});report.views.push({...info,controls});
   }
  }
  await context.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));console.log('PASS WAR 16 visual views: four missions, both orientations, WebGL and compatible renderer; controls stay inside the viewport without overlaps');
}catch(error){report.failure=error.stack;if(page)await page.screenshot({path:out+'/failure.png'}).catch(()=>{});fs.writeFileSync(out+'/failure.json',JSON.stringify(report,null,2));throw error;}finally{await browser.close();await server.close();}

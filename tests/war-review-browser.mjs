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
  page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.stack));await page.goto(server.origin+'/games/ar/');
  if(!compatible)await page.evaluate(()=>{const Native=THREE.WebGLRenderer;window.__warContexts=[];THREE.WebGLRenderer=new Proxy(Native,{construct(C,args){const renderer=new C(...args);__warContexts.push(renderer.getContext());return renderer;}});});
  await page.locator('[data-solo-start]').click();await page.waitForFunction(()=>window.ConsolePractice.active&&System.canvas);
  await page.locator('#phase-grid .mission-card[data-mission=patrol]').first().click();await page.locator('[data-mode=controls]').click();await page.waitForFunction(()=>System.activeGame?.logic?.state==='PLAYING');
  for(const viewport of[{width:844,height:390},{width:390,height:844}]){
   await page.setViewportSize(viewport);
   for(const mission of['patrol','city','extraction','training']){
    const info=await page.evaluate(({mission,compatible})=>{const s=System,g=s.activeGame.logic;g.init({id:mission});g.waveDelay=999;g.spawnWave();for(const e of g.enemies)e.aim=999;g.elapsed=10;s.paused=true;const w=s.canvas.width,h=s.canvas.height,ctx=s.canvas.getContext('2d');g.drawVirtualScene(ctx,w,h);g.drawHUD(ctx,w,h);return{mission,compatible,w,h,visual:g.worldVisual||null,ammo:g.ammo,hp:g.player.hp};},{mission,compatible});
    if(!compatible){
     assert(info.visual?.frames>0,'Actual WebGL frame missing');
     await page.waitForFunction(()=>{const s=System,g=s.activeGame.logic;g.drawVirtualScene(s.canvas.getContext('2d'),s.canvas.width,s.canvas.height);return g.worldVisual.groundMaps>=2&&g.worldVisual.photographicSky&&window.OTCombatActors?.ready;},null,{timeout:60000});
     info.visual=await page.evaluate(()=>System.activeGame.logic.worldVisual);
    }else assert.equal(info.visual,null);
    const controls=await page.locator('.combat-input button:not([hidden]), .combat-input .combat-stick:not([hidden])').evaluateAll(nodes=>nodes.filter(e=>getComputedStyle(e).display!=='none').map(e=>({id:e.dataset.control||'stick',x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));
    for(const b of controls){assert(b.x>=-1&&b.y>=-1&&b.x+b.w<=viewport.width+1&&b.y+b.h<=viewport.height+1,JSON.stringify({viewport,b}));assert(b.w>=44&&b.h>=44);}
    for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){const a=controls[i],b=controls[j];assert(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)<2||Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)<2,'Controls overlap: '+a.id+'/'+b.id);}
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:`${out}/${compatible?'compatible':'webgl'}-${mission}-${viewport.width}x${viewport.height}.png`});report.views.push({...info,controls});
   }
   for(const gun of['rifle','smg','marksman']){
    const pose=await page.evaluate(gun=>{const s=System,g=s.activeGame.logic;g.init({id:'city'});g.career.wins=3;g.selectWeapon(gun);g.spawnWave();g.waveDelay=999;g.enemies=g.enemies.filter(e=>e.kind==='soldier').slice(0,2);for(const [i,e]of g.enemies.entries())Object.assign(e,{x:i?2.2:-1.8,z:i?12:8,aim:999,moving:true,stride:1});g.elapsed=6;s.paused=true;g.drawVirtualScene(s.canvas.getContext('2d'),s.canvas.width,s.canvas.height);g.drawHUD(s.canvas.getContext('2d'),s.canvas.width,s.canvas.height);return{gun:g.gun.id,ray:g.aimRay(),player:{...g.player},model:window.OTCombatArt?.version,presentation:WarPresentation.version};},gun);
    assert.equal(pose.gun,gun);assert.equal(pose.ray.yaw,pose.player.yaw);assert.equal(pose.ray.pitch,pose.player.pitch);
    if(!compatible){
     await page.waitForFunction(()=>{const s=System,g=s.activeGame.logic;g.drawVirtualScene(s.canvas.getContext('2d'),s.canvas.width,s.canvas.height);return g.worldVisual.photographicSky&&g.worldVisual.infantry==='vanguard';},null,{timeout:60000});
     const skin=await page.evaluate(()=>{const actors=[];const original=OTCombatActors.animate;OTCombatActors.animate=(root,pose)=>{const a=root.userData.combatActor;actors.push({skeleton:a.body.getObjectByName('vanguard_Mesh').skeleton.uuid,body:a.body.uuid,bones:Object.keys(a.bones).length,version:root.userData.modelVersion});return original(root,pose);};const s=System,g=s.activeGame.logic;g.player.yaw+=.15;g.drawVirtualScene(s.canvas.getContext('2d'),s.canvas.width,s.canvas.height);g.player.yaw-=.15;OTCombatActors.animate=original;return actors;});
     assert.equal(skin.length,2);assert(skin.every(a=>a.bones>=49));assert.notEqual(skin[0].body,skin[1].body);assert.notEqual(skin[0].skeleton,skin[1].skeleton);
     pose.skin=skin;
    }
    await page.screenshot({path:`${out}/${compatible?'compatible':'webgl'}-${gun}-infantry-${viewport.width}x${viewport.height}.png`});
    report.views.push({compatible,viewport,weapon:pose});
    await page.evaluate(()=>{const s=System,g=s.activeGame.logic;g.aiming=true;g.drawVirtualScene(s.canvas.getContext('2d'),s.canvas.width,s.canvas.height);g.drawHUD(s.canvas.getContext('2d'),s.canvas.width,s.canvas.height);});
    await page.screenshot({path:`${out}/${compatible?'compatible':'webgl'}-${gun}-ads-${viewport.width}x${viewport.height}.png`});
    report.views.push({compatible,viewport,weapon:gun,aiming:true});
   }
  }
  if(!compatible){await page.waitForFunction(()=>__warContexts.length>10&&__warContexts.slice(0,-1).every(gl=>gl.isContextLost()),null,{timeout:10000});report.releasedBattlefields=await page.evaluate(()=>__warContexts.length-1);}
  await context.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));console.log('PASS WAR 40 visual views: four missions and three weapons with hip/ADS, near independently animated infantry, both orientations, WebGL and compatible renderer; local materials/sky load and controls stay inside the viewport without overlaps');
}catch(error){report.failure=error.stack;if(page)await page.screenshot({path:out+'/failure.png'}).catch(()=>{});fs.writeFileSync(out+'/failure.json',JSON.stringify(report,null,2));throw error;}finally{await browser.close();await server.close();}

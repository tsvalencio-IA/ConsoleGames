import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';
const BASE=process.env.WORLD_QA_URL||'http://127.0.0.1:4173/games/otthi/';fs.mkdirSync('test-results/world-expansion',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--no-sandbox','--disable-dev-shm-usage']});
try{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 await context.addInitScript(()=>localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,profile:{name:'QA World',nameConfirmed:true,playerId:'world-qa'},flags:{accountPromptedV635:true},settings:{quality:'low'},guardian:{sessionLimitMinutes:0},familyAdventure:{party:{controller:'thiago',members:['thiago','luna','liz']},deliveries:{luna:0,liz:0},flags:{}}})));
 await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===new URL(BASE).origin?r.continue():r.abort('blockedbyclient'));
 const page=await context.newPage(),errors=[],bad=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.stack)});page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).origin===new URL(BASE).origin)bad.push([r.status(),r.url()]);});
 await page.goto(BASE,{waitUntil:'domcontentloaded'});await page.locator('#playBtn').click();await page.waitForFunction(()=>window.OTTHI_EXPANSION?.diagnostics().assets.length===2,null,{timeout:60000}).catch(async e=>{console.error('FAILED LOAD',await page.evaluate(()=>({expansion:window.OTTHI_EXPANSION?.diagnostics(),campaign:window.OTTHI_CAMPAIGN?.diagnostics(),venues:window.OTTHI_VENUES?.diagnostics()})));await page.screenshot({path:'test-results/world-expansion/failure.png'});throw e;});
 const d=await page.evaluate(()=>({expansion:window.OTTHI_EXPANSION.diagnostics(),venues:window.OTTHI_VENUES.diagnostics(),layout:window.OTTHI_WORLD_LAYOUT_V704.staticAudit(),runtime:window.OTTHI_WORLD_LAYOUT_V704.runtimeAudit()}));
 console.log('WORLD DIAGNOSTICS',JSON.stringify(d));assert(d.layout.passed,JSON.stringify(d.layout));assert(d.runtime.passed,JSON.stringify(d.runtime));assert.equal(d.expansion.cities.length,2);assert.equal(d.expansion.circuits.length,2);assert(d.expansion.circuits.every(c=>c.length>250));assert.equal(d.venues.landmarks.length,3);assert(d.expansion.models.every(m=>m.asset==='coupe'));
 await page.screenshot({path:'test-results/world-expansion/village.png'});
 const before=await page.evaluate(()=>window.OTTHI_VENUES.diagnostics().position);assert.equal(await page.evaluate(()=>window.OTTHI_VENUES.enter('dance')),false);assert.deepEqual(await page.evaluate(()=>window.OTTHI_VENUES.diagnostics().position),before,'remote venue request must set GPS rather than teleport');
 console.log('WORLD LOADED',JSON.stringify(d));
 await page.locator('#miniNav').click();await page.screenshot({path:'test-results/world-expansion/map.png'});
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(bad.length,0,JSON.stringify(bad));fs.writeFileSync('test-results/world-expansion/result.json',JSON.stringify({passed:true,errors,bad,...d},null,2));
 await context.close();
}finally{await browser.close();}

import {chromium} from 'playwright';import assert from 'node:assert/strict';import {mkdirSync,writeFileSync} from 'node:fs';import {touchSession} from './helpers/touch-session.mjs';
const browser=await chromium.launch({headless:true,args:['--enable-features=SyntheticPointerActions','--use-gl=angle','--use-angle=swiftshader','--no-sandbox','--disable-dev-shm-usage']});mkdirSync('test-results/ot-games',{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 await context.addInitScript(()=>localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,profile:{name:'Teste OT Games',nameConfirmed:true,playerId:'ot-games-test'},flags:{accountPromptedV635:true},settings:{quality:'low'},guardian:{sessionLimitMinutes:0},familyAdventure:{party:{controller:'thiago',members:['thiago','luna','liz']},deliveries:{luna:0,liz:0},flags:{}}})));
 await context.route(/^https?:\/\//,route=>new URL(route.request().url()).origin==='http://127.0.0.1:4173'?route.continue():route.abort('blockedbyclient'));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const fingers=await touchSession(context,page);
 try{
 await page.goto('http://127.0.0.1:4173/games/otthi/',{waitUntil:'domcontentloaded'});await page.locator('#playBtn').click();await page.waitForFunction(()=>window.OTTHI_FAMILY?.diagnostics().ready,null,{timeout:120000});
 const before=await page.evaluate(()=>({position:window.OT_GAMES.diagnostics().peacePosition,family:window.OTTHI_FAMILY.diagnostics(),save:window.OTTHOS_TEST_API.getState()}));
 assert(!await page.locator('#ot-games-button').isVisible());assert.equal(await page.locator('#ot-games-button').evaluate(b=>b.parentElement.id),'quickBar');
 await page.locator('#quickToggleBtn').click();await page.screenshot({path:'test-results/ot-games/native-menu.png'});await page.locator('#ot-games-button').click();await page.screenshot({path:'test-results/ot-games/modes.png'});await page.locator('[data-ot-armed]').uncheck();await page.locator('[data-ot-mode="helicopter"]').click();await page.waitForFunction(()=>window.OT_GAMES.diagnostics().mode==='helicopter',null,{timeout:15000});
 assert(await page.evaluate(()=>window.OT_GAMES.diagnostics().sameScene));assert(!await page.evaluate(()=>window.OT_GAMES.diagnostics().armed));assert.equal(await page.evaluate(()=>window.OT_GAMES.diagnostics().enemies.length),0);
 const a=await page.evaluate(()=>window.OT_GAMES.diagnostics());const loc=name=>page.locator('#ot-games-hud [data-ot="'+name+'"]');
 const cyclic=await fingers.start(loc('move'));await fingers.move(cyclic,loc('move'),.67,.22);const collective=await fingers.start(loc('collective'),.5,.22);const pedal=await fingers.start(loc('pedal-right'));await page.waitForFunction(before=>{const b=window.OT_GAMES.diagnostics().body;return b.y>before.y+1&&Math.hypot(b.x-before.x,b.z-before.z)>.7&&b.yaw>before.yaw},a.body,{timeout:15000});
 const moved=await page.evaluate(()=>window.OT_GAMES.diagnostics());assert(moved.body.y>a.body.y+1);assert(Math.hypot(moved.body.x-a.body.x,moved.body.z-a.body.z)>.7);assert(moved.body.yaw>a.body.yaw);
 await fingers.end(cyclic);await fingers.end(collective);await fingers.end(pedal);await page.screenshot({path:'test-results/ot-games/helicopter-original-world.png'});
 assert.deepEqual(moved.peacePosition,before.position,'Flying must not move the saved walking character');
 await page.locator('[data-ot="peace"]').click();assert.equal(await page.evaluate(()=>window.OT_GAMES.diagnostics().active),false);assert.deepEqual(await page.evaluate(()=>window.OT_GAMES.diagnostics().peacePosition),before.position);
 for(const mode of ['plane','helicopter','ground']){
  await page.locator('#quickToggleBtn').click();await page.locator('#ot-games-button').click();await page.locator('[data-ot-difficulty]').selectOption('easy');await page.locator('[data-ot-mode="'+mode+'"]').click();await page.waitForFunction(mode=>window.OT_GAMES.diagnostics().mode===mode,mode);
  await page.waitForTimeout(1200);const d=await page.evaluate(()=>window.OT_GAMES.diagnostics());assert(d.sameScene&&d.armed&&d.enemies.length>0);assert(d.body.hp>0);await page.screenshot({path:'test-results/ot-games/'+mode+'-original-world.png'});if(mode==='ground')await playGroundMission(page,fingers);if(mode==='helicopter')await playHelicopterMission(page,fingers);await page.locator('[data-ot="peace"]').click();
 }
 await page.evaluate(()=>window.OTTHOS_TEST_API.getState());const after=await page.evaluate(()=>({family:window.OTTHI_FAMILY.diagnostics(),save:window.OTTHOS_TEST_API.getState(),position:window.OT_GAMES.diagnostics().peacePosition}));
 assert.deepEqual(after.save.familyAdventure.party,before.save.familyAdventure.party);assert.equal(after.family.actors.length,4);assert.deepEqual(after.position,before.position);assert.equal(errors.length,0,errors.join('\n'));
 writeFileSync('test-results/ot-games/result.json',JSON.stringify({passed:true,sameScene:true,simultaneousTouches:3,before:before.position,after:after.position,familyPreserved:true,groundMissionCompleted:true,helicopterMissionCompleted:true,errors},null,2));console.log('OT GAMES PASS: original scene, 4 modes, peaceful flight, 3-touch helicopter, preserved walking position/family.');
 }catch(e){await page.screenshot({path:'test-results/ot-games/failure.png'});console.error(await page.evaluate(()=>({diag:window.OT_GAMES?.diagnostics(),modal:document.querySelector('#modal')?.innerText?.slice(0,300)})));throw e;}
 await context.close();
}finally{await browser.close();}

async function playGroundMission(page,fingers){
 const aim=page.locator('#ot-games-hud [data-ot="aim"]'),fire=page.locator('#ot-games-hud [data-ot="fire"]');
 const a=await fingers.start(aim),f=await fingers.start(fire);let steps=0;
 try{
  while(steps++<1600){
   const d=await page.evaluate(()=>window.OT_GAMES.diagnostics());if(d.state!=='PLAYING'){assert.equal(d.state,'VICTORY',JSON.stringify(d));break;}
   const b=d.body,angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
   const enemies=d.enemies.filter(e=>e.active&&e.lineOfSight).sort((a,c)=>Math.abs(angle(Math.atan2(a.x-b.x,a.z-b.z)-b.yaw))-Math.abs(angle(Math.atan2(c.x-b.x,c.z-b.z)-b.yaw)));
   assert(enemies.length>0,'Every live sector must have a reachable target');const e=enemies[0];
   let x=Math.max(-1,Math.min(1,angle(Math.atan2(e.x-b.x,e.z-b.z)-b.yaw)*3)),y=Math.max(-1,Math.min(1,(Math.atan2(e.y-b.y,Math.hypot(e.x-b.x,e.z-b.z))-b.pitch)*4));
   const n=Math.max(1,Math.hypot(x,y));x/=n;y/=n;const mag=Math.hypot(x,y),dead=mag?(.08+.92*mag)/mag:0;
   await fingers.move(a,aim,.5+x*dead*.34,.5-y*dead*.34);
   await page.waitForFunction(elapsed=>{const d=window.OT_GAMES.diagnostics();return d.elapsed>elapsed+.015||d.state!=='PLAYING'},d.elapsed,{timeout:10000});
  }
 }finally{await fingers.end(a);await fingers.end(f);}
 const d=await page.evaluate(()=>window.OT_GAMES.diagnostics());assert.equal(d.state,'VICTORY');assert.equal(d.kills,6);assert.equal(d.wave,2);assert(d.ammo<30);assert(d.body.hp>0);
 const career=await page.evaluate(()=>JSON.parse(localStorage.getItem('thia:ot-games:combat:v1:ot-games-test')));assert.equal(career.wins,2);assert.equal(career.lastMode,'ground');
 await page.locator('.ot-games-result').waitFor();await page.screenshot({path:'test-results/ot-games/mission-complete.png'});console.log('OT GAMES MISSION PASS: actual original map, two-touch aim/fire, 6 real kills, 2 sectors and saved win.',JSON.stringify({steps,hp:d.body.hp,elapsed:d.elapsed}));
}

async function playHelicopterMission(page,fingers){
 const loc=name=>page.locator('#ot-games-hud [data-ot="'+name+'"]'),lever=await fingers.start(loc('collective'));let pedal=null,side=0,steps=0;
 const angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
 try{
  for(;steps<450;steps++){
   const d=await page.evaluate(()=>window.OT_GAMES.diagnostics());if(d.state!=='PLAYING'){assert.equal(d.state,'VICTORY',JSON.stringify(d));break;}
   const b=d.body,targets=d.enemies.filter(e=>e.active&&e.lineOfSight),error=e=>({yaw:angle(Math.atan2(e.x-b.x,e.z-b.z)-b.yaw),pitch:Math.atan2(e.y-b.y,Math.hypot(e.x-b.x,e.z-b.z))-b.pitch+.08});
   targets.sort((a,c)=>Math.hypot(error(a).yaw,error(a).pitch)-Math.hypot(error(c).yaw,error(c).pitch));assert(targets.length);const e=targets[0],turn=error(e).yaw,next=Math.abs(turn)>.055?Math.sign(turn):0;
   if(next!==side){if(pedal)await fingers.end(pedal);pedal=null;if(next)pedal=await fingers.start(loc(next>0?'pedal-right':'pedal-left'));side=next;}
   const distance=Math.hypot(e.x-b.x,e.z-b.z),height=e.kind==='tank'?e.y+Math.max(6,distance*.38):e.y,value=b.y>height+.6?.3:b.y<height-.6?.7:.5,box=await loc('collective').boundingBox();
   await fingers.move(lever,loc('collective'),.5,(14+(1-value)*(box.height-28))/box.height);
   await page.waitForFunction(elapsed=>{const d=window.OT_GAMES.diagnostics();return d.elapsed>elapsed+.015||d.state!=='PLAYING'},d.elapsed,{timeout:10000});
  }
 }finally{if(pedal)await fingers.end(pedal);await fingers.end(lever);}
 const d=await page.evaluate(()=>window.OT_GAMES.diagnostics());assert.equal(d.state,'VICTORY');assert.equal(d.kills,6);assert.equal(d.wave,2);assert(d.body.hp>0);const career=await page.evaluate(()=>JSON.parse(localStorage.getItem('thia:ot-games:combat:v1:ot-games-test')));assert.equal(career.wins,1);assert.equal(career.lastMode,'helicopter');await page.screenshot({path:'test-results/ot-games/helicopter-mission-complete.png'});console.log('OT HELICOPTER MISSION PASS: native collective/pedals, 6 actual kills and saved win.',JSON.stringify({steps,hp:d.body.hp,elapsed:d.elapsed}));
}

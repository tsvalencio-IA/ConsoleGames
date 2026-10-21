/* Full world flow with real bundled Three/WebGL, isolated local progress and no remote services. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const base='http://127.0.0.1:4173/';
mkdirSync('test-results/playable',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--no-sandbox','--disable-dev-shm-usage']});
try{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 await context.addInitScript(()=>!localStorage.getItem('otthos_life_world_roleplay_v700')&&localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,profile:{name:'Teste Família',nameConfirmed:true,playerId:'family-test-player'},flags:{accountPromptedV635:true},settings:{quality:'low'},guardian:{sessionLimitMinutes:0},familyAdventure:{deliveries:{luna:0,liz:0},flags:{}}})));
 await context.route(/^https?:\/\//,route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort('blockedbyclient'));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.goto(base+'games/otthi/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('#playBtn').click();
 await page.waitForFunction(()=>window.OTTHI_FAMILY?.diagnostics().ready,null,{timeout:120000});
 const info=await page.evaluate(()=>window.OTTHI_FAMILY.diagnostics());assert.equal(info.actors.length,4);assert(info.actors.every(a=>a.bones>12&&a.vertices>1000));
 async function chooseParty(controller,members){
  await page.evaluate(()=>window.OTTHI_FAMILY.open());
  await page.locator('[data-family-controller="'+controller+'"]').check();
  await page.locator('[data-family-alone]').click();
  for(const id of members.filter(id=>id!==controller))await page.locator('[data-family-member="'+id+'"]').check();
  await page.locator('[data-family-apply]').click();
  await page.waitForFunction(id=>window.OTTHI_FAMILY.playerAvatar()?.id===id,controller,{timeout:15000});
 }
 // Choose the real playable model through the player's own character menu.
 if(!await page.locator('#avatarGameBtn').isVisible())await page.locator('#quickToggleBtn').click();
 await page.locator('#avatarGameBtn').click();await page.locator('[data-life-avatar]').click();
 await page.screenshot({path:'test-results/playable/family-character-selector.png'});
 await page.locator('[data-world-avatar-value="family-thiago"]').click();
 assert(await page.locator('[data-world-avatar-custom]').isHidden());
 await page.locator('[data-world-avatar-save]').click();
 await page.waitForFunction(()=>window.OTTHI_FAMILY.playerAvatar()?.id==='thiago'&&window.OTTHI_FAMILY.playerAvatar().toolInHand,null,{timeout:15000});
 assert(await page.evaluate(()=>window.OTTHI_FAMILY.playerAvatar().baseHidden),'The original avatar overlaps the family model');
 async function moveCharacter(id){
  const before=await page.evaluate(()=>window.OTTHOS_TEST_API.getGame().player),joystick=page.locator('#joystick'),box=await joystick.boundingBox();
  await joystick.dispatchEvent('pointerdown',{pointerId:91,clientX:box.x+box.width*.8,clientY:box.y+box.height*.5});
  await page.waitForFunction(p=>{const q=window.OTTHOS_TEST_API.getGame().player;return Math.hypot(q.x-p.x,q.z-p.z)>.8&&Math.abs(window.OTTHI_FAMILY.playerAvatar()?.leg[0]||0)>.05;},before,{timeout:20000});
  await joystick.dispatchEvent('pointerup',{pointerId:91});
  const y=await page.evaluate(()=>window.OTTHOS_TEST_API.getGame().player.y);
  await page.locator('#jumpBtn').dispatchEvent('pointerdown',{pointerId:92});await page.locator('#jumpBtn').dispatchEvent('pointerup',{pointerId:92});
  await page.waitForFunction(y=>window.OTTHOS_TEST_API.getGame().player.y>y+.3,y,{timeout:12000});
  await page.waitForFunction(()=>window.OTTHOS_TEST_API.getGame().player.grounded,null,{timeout:60000});
  assert.equal(await page.evaluate(()=>window.OTTHI_FAMILY.playerAvatar().id),id);
  await page.screenshot({path:'test-results/playable/playing-as-'+id+'.png'});
 }
 await moveCharacter('thiago');
 // The family panel provides the same playable choice, with immediate save.
 await chooseParty('thamis',['thamis']);
 await page.waitForFunction(()=>window.OTTHI_FAMILY.playerAvatar()?.id==='thamis',null,{timeout:15000});
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('#playBtn').click();
 await page.waitForFunction(()=>window.OTTHI_FAMILY.playerAvatar()?.id==='thamis'&&window.OTTHI_FAMILY.playerAvatar().toolInHand,null,{timeout:120000});
 assert.deepEqual(await page.evaluate(()=>window.OTTHI_FAMILY.diagnostics().progress.party),{controller:'thamis',members:['thamis']});
 await page.waitForFunction(()=>window.OTTHI_FAMILY.diagnostics().party.members.join(',')==='thamis',null,{timeout:15000});
 await moveCharacter('thamis');
 // Receive the real multiplayer presence shape without connecting to production.
 await page.evaluate(()=>{const p=window.OTTHOS_TEST_API.getGame().player;window.dispatchEvent(new CustomEvent('otthos:mp-player',{detail:{uid:'family-remote-test',name:'Participante teste',x:p.x+2,y:p.y,z:p.z,r:0,avatar:{bodyStyle:'family-thamis'}}}));});
 await page.waitForFunction(()=>window.OTTHI_FAMILY.remoteAvatars().some(a=>a.uid==='family-remote-test'&&a.id==='thamis'&&a.bones>20&&a.visible),null,{timeout:15000});
 assert.equal(await page.evaluate(()=>window.OTTHI_FAMILY.playerAvatar().id),'thamis');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('otthos:mp-leave',{detail:{uid:'family-remote-test'}})));
 // Returning to a previous style restores its customization controls.
 if(!await page.locator('#avatarGameBtn').isVisible())await page.locator('#quickToggleBtn').click();
 await page.locator('#avatarGameBtn').click();await page.locator('[data-life-avatar]').click();await page.locator('[data-world-avatar-value="lego"]').click();
 assert(await page.locator('[data-world-avatar-custom]').isVisible());await page.locator('[data-world-avatar-save]').click();
 assert.equal(await page.evaluate(()=>window.OTTHI_FAMILY.playerAvatar()),null);
 await chooseParty('thamis',['thamis']);

 // Select the user's exact example through the multi-select UI.
 await page.evaluate(()=>{const p=window.OTTHI_FAMILY.diagnostics().home;window.OTTHOS_TEST_API.teleport(p.x,p.z+6);window.OTTHI_FAMILY.open();});
 await page.locator('[data-family-controller="thiago"]').check();
 await page.locator('[data-family-all]').click();
 assert.equal(await page.locator('[data-family-member]:checked').count(),4);
 await page.locator('[data-family-member="thamis"]').uncheck();
 assert.equal(await page.locator('[data-family-summary]').innerText(),'Thiago + Luna + Liz');
 await page.screenshot({path:'test-results/playable/family-party-selector.png'});
 await page.locator('[data-family-apply]').click();
 assert.deepEqual(await page.evaluate(()=>window.OTTHI_FAMILY.diagnostics().party.members),['thiago','luna','liz']);
 const groupBefore=await page.evaluate(()=>window.OTTHI_FAMILY.diagnostics().actors);
 const groupJoy=page.locator('#joystick'),groupBox=await groupJoy.boundingBox();
 await groupJoy.dispatchEvent('pointerdown',{pointerId:96,clientX:groupBox.x+groupBox.width*.8,clientY:groupBox.y+groupBox.height*.5});
 await page.waitForFunction(before=>window.OTTHI_FAMILY.diagnostics().actors.filter(a=>a.id==='luna'||a.id==='liz').every(a=>{const old=before.find(b=>b.id===a.id);return Math.hypot(a.x-old.x,a.z-old.z)>.3;}),groupBefore,{timeout:20000});
 await groupJoy.dispatchEvent('pointerup',{pointerId:96});
 await page.screenshot({path:'test-results/playable/family-party-walking.png'});
 await page.evaluate(()=>window.OTTHI_FAMILY.open());
 await page.locator('[data-family-throw="luna"]').click();
 await page.waitForFunction(()=>window.OTTHI_FAMILY.diagnostics().ball==='seek'||window.OTTHI_FAMILY.diagnostics().ball==='return',null,{timeout:20000});
 await page.waitForFunction(()=>window.OTTHI_FAMILY.diagnostics().progress.deliveries.luna===1,null,{timeout:60000});
 await page.evaluate(()=>window.OTTHI_FAMILY.open());
 await page.locator('[data-family-portrait]').click();
 await page.waitForFunction(()=>!!window.OTTHI_FAMILY.cameraFrame(),null,{timeout:6000});
 await page.waitForTimeout(1600);
 await page.screenshot({path:'test-results/playable/family-integrated-world.png'});
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>{const wanted=window.OTTHI_FAMILY.cameraFrame()?.position,actual=window.OTTHOS_TEST_API.camera().position;return wanted&&Math.hypot(wanted.x-actual.x,wanted.y-actual.y,wanted.z-actual.z)<.3;},null,{timeout:15000});
 const portraitBounds=await page.evaluate(()=>{const f=window.OTTHI_FAMILY.cameraFrame(),c=new THREE.PerspectiveCamera(f.fov,innerWidth/innerHeight,.05,1200);c.position.copy(f.position);c.lookAt(f.look);c.updateMatrixWorld(true);return window.OTTHI_FAMILY.diagnostics().actors.map(a=>{const pts=[];for(const x of[-.5,.5])for(const y of[0,a.id==='luna'||a.id==='liz'?1:2.3])for(const z of[-.5,.5]){const p=new THREE.Vector3(a.x+x,y,a.z+z).project(c);pts.push({x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2});}return{id:a.id,minX:Math.min(...pts.map(p=>p.x)),maxX:Math.max(...pts.map(p=>p.x)),minY:Math.min(...pts.map(p=>p.y)),maxY:Math.max(...pts.map(p=>p.y))};});});
 assert(portraitBounds.every(b=>b.minX>4&&b.maxX<386&&b.minY>50&&b.maxY<720),'Family portrait clips actors: '+JSON.stringify(portraitBounds));
 assert(await page.evaluate(()=>document.body.classList.contains('family-portrait')),'Portrait ended before the player left it');
 await page.screenshot({path:'test-results/playable/family-portrait-mobile.png'});
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(600);
 assert.equal(await page.locator('#family-world-entry').count(),1,'Direct family entry is missing');
 const joy=page.locator('#joystick'),joyBox=await joy.boundingBox();
 await joy.dispatchEvent('pointerdown',{pointerId:61,clientX:joyBox.x+joyBox.width*.8,clientY:joyBox.y+joyBox.height*.5});
 await page.waitForFunction(()=>!window.OTTHI_FAMILY.cameraFrame(),null,{timeout:15000});
 await joy.dispatchEvent('pointerup',{pointerId:61});

 const progress=await page.evaluate(()=>window.OTTHI_FAMILY.diagnostics().progress.deliveries.luna);assert.equal(progress,1);
 await page.evaluate(()=>window.OTTHI_FAMILY.open());
 assert.equal(await page.locator('[data-family-task]').count(),2);
 await page.locator('[data-family-walk]').click();
 const walking=await page.evaluate(()=>window.OTTHI_FAMILY.snapshot().walkOwner);assert(walking,'Family must actually follow a participant');
 const layout=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,drawCalls:window.OTTHOS_TEST_API.performance().drawCalls}));assert(layout.width<=layout.viewport+2);
 // Both dogs return real toys, then the native HQ activities remain playable.
 await page.evaluate(()=>{const p=window.OTTHI_FAMILY.diagnostics().home;window.OTTHOS_TEST_API.teleport(p.x,p.z+6);window.OTTHI_FAMILY.open();});
 await page.locator('[data-family-stop]').click();
 await page.evaluate(()=>window.OTTHI_FAMILY.open());await page.locator('[data-family-throw="liz"]').click();
 await page.waitForFunction(()=>window.OTTHI_FAMILY.diagnostics().progress.deliveries.liz===1,null,{timeout:60000});
 // A real native vehicle still responds to the visible accelerator and brake.
 const vehicle=await page.evaluate(()=>window.OTTHOS_TEST_API.prepareVehicleTest());assert(vehicle.active,'Open world has no usable test vehicle');assert.equal(await page.evaluate(()=>window.OTTHI_FAMILY.playerAvatar().meshVisible),false,'Selected character must use native in-car visibility');
 await page.locator('#runBtn').dispatchEvent('pointerdown',{pointerId:81});
 await page.waitForFunction(()=>window.OTTHOS_TEST_API.mobilityControls().speed>1,null,{timeout:15000});
 const speedBefore=await page.evaluate(()=>window.OTTHOS_TEST_API.mobilityControls().speed);
 await page.locator('#runBtn').dispatchEvent('pointerup',{pointerId:81});
 await page.locator('#jumpBtn').dispatchEvent('pointerdown',{pointerId:82});
 await page.waitForFunction(s=>Math.abs(window.OTTHOS_TEST_API.mobilityControls().speed)<s*.7,speedBefore,{timeout:15000});
 await page.locator('#jumpBtn').dispatchEvent('pointerup',{pointerId:82});
 await page.screenshot({path:'test-results/playable/otthi-driving-world.png'});
 await page.evaluate(()=>window.OTTHOS_TEST_API.exitVehicle());assert.equal(await page.evaluate(()=>window.OTTHI_FAMILY.playerAvatar().meshVisible),true);
 // The original HQ keeps its native buttons and original fetch activity.
 await page.goto(base+'games/familia/3d/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('#start').click();
 await page.evaluate(()=>window.__THIA_TEST.selectDog('luna'));await page.locator('#throw').click();
 await page.waitForFunction(()=>window.__THIA_TEST.state.byDog.luna>=1,null,{timeout:60000});
 await page.evaluate(()=>window.__THIA_TEST.selectDog('liz'));await page.locator('#throw').click();
 await page.waitForFunction(()=>window.__THIA_TEST.state.byDog.liz>=1,null,{timeout:60000});
 await page.evaluate(()=>{window.__THIA_TEST.camera.yaw=Math.PI;window.__THIA_TEST.camera.dist=8;});
 await page.waitForFunction(()=>!document.getElementById('toast').classList.contains('show'),null,{timeout:25000});
 await page.screenshot({path:'test-results/playable/family-original-game.png'});
 await page.evaluate(()=>window.__THIA_TEST.openLocation('park'));
 assert((await page.locator('#dialogBody').innerText()).includes('Ouro'),'Race lacks its visible time progression');
 await page.locator('#closeDialog').click();
 await page.evaluate(()=>window.__THIA_TEST.openLocation('code'));
 const question=await page.locator('#dialogKicker').innerText();await page.locator('#dialogActions button').nth(0).click();await page.waitForFunction(()=>{const b=document.getElementById('actionContinue');return b&&!b.disabled},null,{timeout:25000});await page.locator('#actionContinue').click();assert.equal(await page.locator('#dialogKicker').innerText(),question,'Wrong answers advance the challenge');
 for(const correct of [1,2,0,1]){await page.locator('#dialogActions button').nth(correct).click();await page.waitForFunction(()=>{const b=document.getElementById('actionContinue');return b&&!b.disabled},null,{timeout:25000});await page.locator('#actionContinue').click();}
 assert(await page.evaluate(()=>window.__THIA_TEST.state.medals.code),'Correct answers did not finish the native technology challenge');
 await page.locator('#closeDialog').click();
 await page.locator('#menuBtn').click();
 await page.locator('#menuChoices a[href*="otthi"]').waitFor();
 assert.equal(await page.locator('#controls #throw').count(),1);
 await page.screenshot({path:'test-results/playable/family-original-menu.png'});
 assert.deepEqual(errors,[]);
 writeFileSync('test-results/playable/family-world-report.json',JSON.stringify({actors:info.actors,progress,layout,errors},null,2));
 console.log('Family world: approved rig skinning, playable Thiago/Thamis, all/solo/subset parties with save/reload, real companions and received presence, real throw/return, walking, original HQ controls and no page errors.');
 }catch(error){await page.screenshot({path:'test-results/playable/family-failure.png'}).catch(()=>{});console.error('Family diagnostics',await page.evaluate(()=>({selected:window.OTTHI_FAMILY?.playerAvatar(),avatar:window.OTTHOS_TEST_API?.getState().avatar,modal:document.getElementById('modal')?.innerText,ready:window.OTTHI_FAMILY?.diagnostics(),familyState:window.OTTHI_FAMILY?.snapshot(),game:window.OTTHOS_TEST_API?.getGame()})).catch(()=>null));throw error;}
 await context.close();
}finally{await browser.close()}

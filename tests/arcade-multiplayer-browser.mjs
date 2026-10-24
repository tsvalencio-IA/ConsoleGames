import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {multiplayerServer,installMultiplayerFixture} from './helpers/multiplayer-browser-fixture.mjs';
const server=await multiplayerServer(),browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--no-sandbox']}),results=[];
mkdirSync('test-results/arcade-multiplayer',{recursive:true});
try{
 for(const [slug,id,phase]of [['kart','drive','arcade'],['tenis','tennis','arcade'],['ar','ar_truck_sim','patrol_coop']]){
  const contexts=[],pages=[],errors=[];console.log('TWO CLIENTS',slug);
  try{
   for(let n=0;n<2;n++){
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});contexts.push(context);await installMultiplayerFixture(context);
    await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.request().resourceType()==='script'?r.fulfill({status:200,contentType:'application/javascript',body:'/* external service disabled in isolated multiplayer test */'}):r.abort('blockedbyclient'));
    const page=await context.newPage();pages.push(page);page.on('pageerror',e=>errors.push(e.message));await page.goto(server.origin+'/games/'+slug+'/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(id=>window.Games?.some(g=>g.id===id)&&window.System?.canvas,id);
    await page.locator('#phase-screen:not(.hidden)').waitFor({timeout:6000}).catch(()=>page.locator('#channel-grid .channel').first().click());
    const index=await page.evaluate(({id,phase})=>Games.find(g=>g.id===id).opts.phases.findIndex(p=>p.id===phase),{id,phase});assert(index>=0);
    await page.locator('#phase-grid .mission-card').nth(index).click();await page.locator('[data-mode="controls"]').click();
    if(slug!=='ar'){
     await page.waitForFunction(()=>System.activeGame?.logic.state==='MODE_SELECT');
     const rect=await page.locator('#game-canvas').boundingBox();await page.touchscreen.tap(rect.x+rect.width*.5,rect.y+rect.height*(slug==='kart'?.67:.73));
    }
    await page.waitForFunction(slug=>slug==='ar'?!!System.activeGame?.logic.net?.id:System.activeGame?.logic.state==='LOBBY',slug);
   }
   await Promise.all(pages.map(p=>p.waitForFunction(slug=>{const g=System.activeGame.logic;return slug==='ar'?g.net.live().length===2:slug==='kart'?g.liveHumans().length===2:g.livePlayers().length===2;},slug)));
   const hostIndex=(await pages[0].evaluate(slug=>slug==='ar'?System.activeGame.logic.net.isHost:System.activeGame.logic.isHost,slug))?0:1,host=pages[hostIndex],guest=pages[1-hostIndex];
   console.log('LOBBY READY',slug,hostIndex);
   if(slug==='ar')await host.locator('[data-war-room-start]').click();else{const r=await host.locator('#game-canvas').boundingBox();await host.touchscreen.tap(r.x+r.width*.5,r.y+r.height*(slug==='kart'?.9:.74));}
   await Promise.all(pages.map(p=>p.waitForFunction(slug=>{const g=System.activeGame.logic;return slug==='kart'?g.state==='RACE':slug==='tenis'?['IDLE','SERVE','RALLY'].includes(g.state):g.state==='PLAYING';},slug)));
   if(slug==='kart'){
    const accelerate=host.locator('[data-control="go"]');await accelerate.dispatchEvent('pointerdown',{pointerId:11,pointerType:'touch',clientX:20,clientY:20});
    await host.waitForFunction(()=>System.activeGame.logic.pos>100);await accelerate.dispatchEvent('pointerup',{pointerId:11,pointerType:'touch'});
    const hostId=await host.evaluate(()=>System.activeGame.logic.networkId);await guest.waitForFunction(id=>System.activeGame.logic.rivals.some(r=>r.id===id&&r.pos>100),hostId);
   }else if(slug==='tenis'){
    await Promise.all(pages.map(p=>p.waitForFunction(()=>System.activeGame.logic.state==='SERVE')));const r=await host.locator('#game-canvas').boundingBox();await host.touchscreen.tap(r.x+r.width*.5,r.y+r.height*.6);
    await guest.waitForFunction(()=>System.activeGame.logic.state==='RALLY');const gr=await guest.locator('#game-canvas').boundingBox();await guest.touchscreen.tap(gr.x+gr.width*.97,gr.y+gr.height*.1);
    await host.waitForFunction(()=>System.activeGame.logic.score.p1+System.activeGame.logic.score.p2>0,null,{timeout:30000});
    const score=await host.evaluate(()=>({...System.activeGame.logic.score}));await guest.waitForFunction(s=>System.activeGame.logic.score.p1===s.p2&&System.activeGame.logic.score.p2===s.p1,score);
   }else{
    await Promise.all(pages.map(p=>p.waitForFunction(()=>System.activeGame.logic.enemies.some(e=>!e.peerId&&e.active))));
    // Actual keyboard movement goes through the original combat input and is
    // observed by the other browser through the local HTTP/SSE room transport.
    const start=await host.evaluate(()=>System.activeGame.logic.player.x);await host.keyboard.down('d');await host.waitForFunction(x=>System.activeGame.logic.player.x>x+.7,start);await host.keyboard.up('d');
    const peer=await host.evaluate(()=>System.activeGame.logic.net.id);await guest.waitForFunction(({peer,start})=>System.activeGame.logic.enemies.some(e=>e.peerId===peer&&e.x>start+.5),{peer,start});
    // Aim a virtual foe from the guest's real current position, then use the
    // native trigger. All damage and kill credit must return from the host.
    const victim=await host.evaluate(()=>{const g=System.activeGame.logic,e=g.enemies.find(e=>!e.peerId);Object.assign(e,{x:3,z:20,hp:34,aim:999,decision:999,destination:{x:3,z:20}});g.net.publish();return e.id;});
    await guest.waitForFunction(id=>System.activeGame.logic.enemies.some(e=>e.id===id&&e.hp===34&&e.z===20),victim);
    await guest.locator('[data-control="fire"]').dispatchEvent('pointerdown',{pointerId:12,pointerType:'touch'});await guest.waitForFunction(()=>System.activeGame.logic.stats.kills>=1,null,{timeout:15000});await guest.locator('[data-control="fire"]').dispatchEvent('pointerup',{pointerId:12,pointerType:'touch'});
    await host.waitForFunction(id=>System.activeGame.logic.enemies.some(e=>e.id===id&&!e.active),victim);assert.equal(await guest.locator('.aim-stick').count(),0);
   }
   const connectionIds=await Promise.all(pages.map(p=>p.evaluate(slug=>{const g=System.activeGame.logic;return slug==='ar'?g.net.id:slug==='kart'?g.networkId:g.playerId;},slug)));assert.notEqual(...connectionIds);
   for(let n=0;n<pages.length;n++)await pages[n].screenshot({path:`test-results/arcade-multiplayer/${slug}-client-${n+1}.png`});
   const cameraCalls=await Promise.all(pages.map(p=>p.evaluate(()=>__cameraRequests)));assert(cameraCalls.every(n=>n===0));assert.equal(errors.length,0,errors.join('\n'));
   await host.evaluate(()=>System.activeGame.logic.cleanup());await guest.waitForFunction(slug=>{const g=System.activeGame.logic;return slug==='ar'?g.net.isHost&&g.state==='NET_LOBBY':g.isHost;},slug);
   results.push({slug,passed:true,backend:'isolated local HTTP/SSE RTDB fixture',independentBrowserContexts:2,sameAccount:true,distinctConnectionIds:true,nativeMenuEntry:true,nativeInput:true,hostDeparture:true,cameraCalls,errors});console.log('TWO CLIENT PASS',slug);
  }catch(error){for(let n=0;n<pages.length;n++){console.error(slug,n,await pages[n].evaluate(()=>{const g=System.activeGame?.logic;return {state:g?.state,host:g?.isHost,net:g?.net?{phase:g.net.phase,error:g.net.error,host:g.net.isHost,started:g.net.started,roster:g.net.roster}:null,players:g?.remotePlayersData};}).catch(()=>null));await pages[n].screenshot({path:`test-results/arcade-multiplayer/${slug}-failure-${n}.png`}).catch(()=>{});}throw error;}finally{for(const c of contexts)await c.close();}
 }
 writeFileSync('test-results/arcade-multiplayer/result.json',JSON.stringify({passed:true,scope:'isolated browser clients, not production Firebase or physical phones',results},null,2));
}finally{await browser.close();await server.close();}

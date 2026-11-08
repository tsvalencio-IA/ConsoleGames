/* Native console/lesson UI; YouTube and pose events are explicit test fixtures.
 * Real YouTube loading is checked manually; model inference has its own test. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {dancePose} from './helpers/dance-pose-fixture.mjs';
const out='test-results/dance-console';fs.mkdirSync(out,{recursive:true});
const server=await multiplayerServer(),browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,permissions:['camera'],serviceWorkers:'block'});
 await context.route(/^https?:\/\//,route=>new URL(route.request().url()).origin===server.origin?route.continue():route.abort());
 await context.route('**/dance-pose-worker.js',route=>route.fulfill({contentType:'application/javascript',body:`self.onmessage=({data})=>{if(data.type==='init')self.postMessage({type:'ready'});if(data.type==='frame'){data.image.close();self.postMessage({type:'pose',landmarks:${JSON.stringify(dancePose())},at:data.at,frameId:data.frameId,inferenceMs:1});}};`}));
 await context.addInitScript(()=>{
  window.__youtubeFixture={created:0,destroyed:0,state:2,time:0};
  const Y=window.__youtubeFixture;
  window.YT={Player:class{
   constructor(target,options){Y.created++;this.options=options;this.frame=document.createElement('iframe');this.frame.src='about:blank';this.frame.title='YouTube contract fixture';target.replaceWith(this.frame);Y.player=this;setTimeout(()=>options.events.onReady({target:this}),0);}
   getIframe(){return this.frame;}getDuration(){return 180;}getVideoData(){return{title:'Música de teste'};}getCurrentTime(){return Y.time;}
   seekTo(time){Y.time=time;}playVideo(){this.emit(1);}pauseVideo(){this.emit(2);}mute(){Y.muted=true;}unMute(){Y.muted=false;}
   emit(state){Y.state=state;this.options.events.onStateChange({data:state});}destroy(){Y.destroyed++;this.frame.remove();}
  }};
  const media=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);window.__danceTracks=[];window.__cameraCalls=0;
  navigator.mediaDevices.getUserMedia=async options=>{window.__cameraCalls++;const stream=await media(options);window.__danceTracks.push(...stream.getTracks());return stream;};
  localStorage.setItem('dance-preservation-marker','existing-other-game');
  localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({profile:{playerId:'dance-existing-player'}}));
  localStorage.setItem('thia:otthi:venues:v1:dance-existing-player',JSON.stringify({dance:{0:{passed:true,bodyBest:900}},pingpong:{best:321}}));
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(server.origin+'/arcade/');assert.equal(await page.locator('.game-card').count(),8);
 await page.locator('[data-game="danca"] [data-launch="danca"]').click();
 await page.locator('[data-youtube-url]').waitFor();assert.equal(await page.evaluate(()=>__cameraCalls),0);
 assert(await page.locator('[data-dance-level="1"]').isEnabled(),'direct entry retains the existing world lesson unlock');
 await page.locator('[data-youtube-url]').fill('https://youtu.be/M7lc1UVf-VE');await page.locator('[data-youtube-load]').click();await page.locator('[data-youtube-options]').waitFor({state:'visible'});
 await page.locator('[data-youtube-bpm]').fill('120');await page.locator('[data-youtube-select]').click();
 assert.match(await page.locator('[data-dance-file-status]').textContent(),/Música de teste/);
 for(const size of [{width:320,height:740},{width:390,height:844},{width:844,height:390},{width:1280,height:800}]){
  await page.setViewportSize(size);const layout=await page.evaluate(()=>{const frame=document.querySelector('.dance-youtube-player iframe').getBoundingClientRect();return{width:innerWidth,scroll:document.documentElement.scrollWidth,frame:{width:frame.width,height:frame.height}};});
  assert(layout.scroll<=layout.width+1,JSON.stringify(layout));assert(layout.frame.width>=200&&layout.frame.height>=200,JSON.stringify(layout));await page.screenshot({path:out+'/menu-'+size.width+'.png'});
 }
 await page.setViewportSize({width:844,height:390});await page.locator('[data-dance-level="0"]').click();
 await page.waitForFunction(()=>window.THIAGUINHO_DANCE.diagnostics().dance?.phase==='playing',null,{timeout:60000});
 assert.equal(await page.evaluate(()=>__youtubeFixture.created),1,'the visible player must survive menu-to-lesson without iframe reload');
 assert.equal(await page.locator('.dance-youtube-player iframe').count(),1);assert.equal(await page.evaluate(()=>THIAGUINHO_DANCE.diagnostics().music.youtube),true);
 await page.evaluate(()=>__youtubeFixture.player.emit(3));const before=await page.evaluate(()=>THIAGUINHO_DANCE.diagnostics().dance.time);await page.waitForTimeout(800);assert.equal(await page.evaluate(()=>THIAGUINHO_DANCE.diagnostics().dance.time),before);
 await page.evaluate(()=>__youtubeFixture.player.emit(1));await page.waitForFunction(time=>THIAGUINHO_DANCE.diagnostics().dance.time>time,before);
 await page.locator('[data-dance-pause]').click();const paused=await page.evaluate(()=>THIAGUINHO_DANCE.diagnostics().dance.time);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>THIAGUINHO_DANCE.diagnostics().dance.time),paused);
 await page.screenshot({path:out+'/lesson-youtube.png'});await page.locator('[data-dance-home]').click();
 assert.equal(await page.evaluate(()=>__danceTracks.filter(t=>t.readyState!=='ended').length),0);assert.equal(await page.evaluate(()=>__youtubeFixture.created),1);
 await page.locator('[data-dance-original]').click();assert.equal(await page.evaluate(()=>__youtubeFixture.destroyed),1);
 assert.equal(await page.evaluate(()=>localStorage.getItem('dance-preservation-marker')),'existing-other-game');assert.deepEqual(errors,[]);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('thia:otthi:venues:v1:dance-existing-player')).pingpong.best),321);
 fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,eightCards:true,directEntry:true,viewports:4,youtubeFixture:true,playerRetained:true,bufferingFreezesClock:true,manualPause:true,cameraStopped:true,otherSavesPreserved:true,errors,limits:['Synthetic YouTube state and pose fixtures; does not certify physical device performance or live video availability.']},null,2));
 console.log('PASS dance console entry, four layouts, visible retained YouTube player, buffering pause, camera cleanup and save preservation');
}finally{await browser.close();await server.close();}

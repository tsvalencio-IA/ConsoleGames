/* Same viewport, quality and control sequence, real Chromium frame timing.
   Initial approach uses the direct Rio entry from each release. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import { chromium } from 'playwright';
import { multiplayerServer } from './helpers/multiplayer-browser-fixture.mjs';
import { installCityInspection } from './helpers/world-city-inspection.mjs';
import { touchSession } from './helpers/touch-session.mjs';

const viewport={width:393,height:852};
const periods=Number(process.env.OT_RIO_PERF_PERIODS||3);
const periodMs=Number(process.env.OT_RIO_PERF_PERIOD_MS||20_000);
const out=process.env.OT_RIO_PERF_OUT||'test-results/rio-map-performance';
assert(Number.isInteger(periods)&&periods>0&&periodMs>=5000);
fs.mkdirSync(out,{recursive:true});
const server=await multiplayerServer();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle',
  '--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-features=SyntheticPointerActions']});
const report={browser:browser.version(),environment:{os:os.platform(),cpu:os.cpus()[0].model,logicalCpus:os.availableParallelism(),
  graphics:'ANGLE SwiftShader software WebGL',viewport,dpr:1,quality:'low'},periods,periodMs,cases:[],
  limits:['Both versions enter Rio Preto near the Complexo Swift. Scene geometry and the simulated systems differ between versions.',
    'Startup paints are suppressed in both cases. Sampling uses the actual renderer and browser clock with a scripted drag and touch sequence. Firebase and physical devices are outside this measurement.']};
const stats=values=>{
  const sorted=[...values].sort((a,b)=>a-b);
  return {samples:sorted.length,p50:sorted[Math.floor(sorted.length*.50)]||0,p95:sorted[Math.floor(sorted.length*.95)]||0,
    max:sorted.at(-1)||0,over100:sorted.filter(x=>x>100).length,over250:sorted.filter(x=>x>250).length};
};
try{
  for(const [label,revision] of [['before',process.env.OT_RIO_PERF_BASE||'38aa21c'],['after',null]].filter(([label])=>!process.env.OT_RIO_PERF_CASE||process.env.OT_RIO_PERF_CASE===label)){
    const source=revision?execFileSync('git',['show',revision+':games/otthi/app.js'],{encoding:'utf8',maxBuffer:8e6}):
      fs.readFileSync('games/otthi/app.js','utf8');
    const pos=source.lastIndexOf('})();'), hook=`
      const rioPerf={started:0,last:0,frames:[],work:[],tasks:[],renders:0,visualize:null,snap:null,response:null};
      const rioPerfOriginal=gameLoop;
      gameLoop=function(){
        const time=performance.now(),before=perf.renderedFrames;
        if(rioPerf.started&&rioPerf.last)rioPerf.frames.push(time-rioPerf.last);
        rioPerf.last=time;
        try{return rioPerfOriginal();}finally{
          if(rioPerf.started){
            rioPerf.work.push(performance.now()-time);
            if(perf.renderedFrames>before)rioPerf.renders++;
            const p=rioPerf.snap;
            if(p&&rioPerf.response===null&&Math.hypot(p.x-player.x,p.z-player.z)>.03)rioPerf.response=performance.now()-p.at;
          }
        }
      };
      try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(rioPerf.started&&e.startTime>=rioPerf.started)
        rioPerf.tasks.push(e.duration);}).observe({type:'longtask'});}catch{}
      window.__RIO_PERF={
        resumeRenderer:()=>{const render=cityQaBootRenders.get(renderer);if(render)renderer.render=render;},
        start:()=>{rioPerf.started=performance.now();rioPerf.last=0;rioPerf.renders=0;
          rioPerf.frames.length=0;rioPerf.work.length=0;rioPerf.tasks.length=0;},
        observeTouch:()=>{rioPerf.snap={x:player.x,z:player.z,at:performance.now()};rioPerf.response=null;},
        read:()=>{const ms=performance.now()-rioPerf.started;rioPerf.started=0;
          return {ms,frames:rioPerf.frames.slice(),work:rioPerf.work.slice(),tasks:rioPerf.tasks.slice(),renders:rioPerf.renders,
            touchMovementMs:rioPerf.response,draw:__CITY_QA.metrics(),position:{x:player.x,z:player.z},
            renderSize:{w:renderer.domElement.width,h:renderer.domElement.height},quality:qualityTier()};}
      };
    `;
    const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
    await context.route(/^https?:\/\//,route=>new URL(route.request().url()).origin===server.origin?route.continue():route.abort());
    await context.addInitScript(()=>localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({
      version:705,profile:{name:'Rio desempenho',nameConfirmed:true,playerId:'rio-perf'},
      avatar:{bodyStyle:'family-thiago'},flags:{accountPromptedV635:true},settings:{quality:'low',sound:false,worldHud:'clean'},
      guardian:{sessionLimitMinutes:0}})));
    const page=await context.newPage(),errors=[],finger=await touchSession(context,page);
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.text().startsWith('[OTTHI START]'))console.error(message.text());});
    await installCityInspection(page,{revision,appSource:source.slice(0,pos)+hook+source.slice(pos),capDuringBoot:true});
    const boot=Date.now();
    await page.goto(server.origin+'/games/otthi/',{waitUntil:'domcontentloaded'});
    console.log('BOOT',label);
    await page.locator('#rioPretoPlayBtn').press('Enter');
    try{
      await page.waitForFunction(()=>window.OTTHOS_TEST_API?.getGame().running&&document.getElementById('modal').hidden||
        !!document.querySelector('[data-retry-world]'),null,{timeout:Number(process.env.OT_RIO_PERF_BOOT_TIMEOUT||180000)});
      assert.equal(await page.locator('[data-retry-world]').count(),0);
    }catch(error){
      console.error(await page.evaluate(()=>({body:document.querySelector('#modalBody')?.textContent?.slice(0,400),
        screen:document.body.className,build:window.OTTHI_GAME_BUILD,coherent:window.OTTHI_RELEASE_COHERENT,
        mode:window.OTTHOS_TEST_API?.getGame()?.running})).catch(()=>null),errors);
      await page.screenshot({path:out+'/boot-'+label+'.png',timeout:12000}).catch(()=>{});
      throw error;
    }
    await page.evaluate(()=>__RIO_PERF.resumeRenderer());
    const readyMs=Date.now()-boot,cdp=await context.newCDPSession(page);
    await page.waitForTimeout(5000);
    const snapshot=async()=>{
      await cdp.send('HeapProfiler.collectGarbage');
      return {heap:await cdp.send('Runtime.getHeapUsage'),webgl:await page.evaluate(()=>__CITY_QA.metrics())};
    };
    const result={label,revision:await page.locator('html').getAttribute('data-otthi-revision'),instrumentedReadyMs:readyMs,errors,before:await snapshot(),periods:[]};
    console.log('PLAY',label,readyMs);
    const canvas=page.locator('#stage canvas').first(),joy=page.locator('#joystick');
    for(let round=0;round<periods;round++){
      const begin=Date.now();
      await page.evaluate(()=>__RIO_PERF.start());
      await page.evaluate(()=>__RIO_PERF.observeTouch());
      const move=await finger.start(joy,.74,.40);
      await page.waitForTimeout(700);
      await finger.end(move);
      for(const side of [1,-1,1]){
        const drag=await finger.start(canvas,side>0?.24:.76,.52);
        await finger.move(drag,canvas,side>0?.76:.24,.57);
        await finger.end(drag);
        await page.waitForTimeout(660);
      }
      const remaining=periodMs-(Date.now()-begin);
      if(remaining>0)await page.waitForTimeout(remaining);
      const data=await page.evaluate(()=>__RIO_PERF.read());
      const {frames,work,tasks,...rest}=data;
      result.periods.push({...rest,frames:stats(frames),frameWork:stats(work),longTasks:stats(tasks),fps:data.renders*1000/data.ms});
      console.log('PERIOD',label,round+1,JSON.stringify(result.periods.at(-1)));
    }
    result.after=await snapshot();
    assert.deepEqual(errors,[]);
    assert(result.periods.every(x=>x.frames.samples>2&&x.renders>2));
    report.cases.push(result);
    fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));
    await context.close();
  }
}finally{await browser.close();await server.close();}

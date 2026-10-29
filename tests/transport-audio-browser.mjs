/* Native Web Audio rendering. The real audio clock pauses between control updates;
 * scheduling everything against a fake clock would invalidate ramp/cancel tests. */
import {chromium} from 'playwright';
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
const baseline=process.env.AUDIO_QA_BASELINE,folder=baseline?'recorded-audio-before':'recorded-audio';
const out='test-results/'+folder;fs.mkdirSync(out,{recursive:true});
const models=[['palio','car'],['golf7','car'],['fusca','car'],['kombi','car'],['opala','car'],['maverick','car'],['ferrari458','car'],['porsche911','car'],['hilux','car'],['amarok','car'],['s10','car'],['dinossauro','bus'],['doubledeck','bus'],['semi','truck'],['fuel','truck'],['attivi','bus'],['police','car'],['firefighter','truck'],['mobylette','moto'],['factor','moto'],['titan','moto'],['hornet','moto'],['xre','moto'],['bmwgs','moto'],['kart','kart'],['boat','boat'],['plane','plane'],['cargo','plane'],['falcon','jet'],['helicopter','helicopter'],['metro','electric'],['balloon','balloon'],['bicycle','bicycle'],['skate','skate']];
const scope={window:{}};for(const name of ['brazilian-expansion','brazilian-models'])vm.runInNewContext(fs.readFileSync('games/otthi/assets/js/vehicles/'+name+'.js','utf8'),scope);
for(const [model,spec] of Object.entries({...scope.window.OTBrazilExpansion.catalog,...scope.window.OTBrazilVehicles.catalog}))if(!models.some(([key])=>key===model))models.push([model,spec.humanPowered?'bicycle':spec.twoWheeler?'moto':spec.bus?'bus':spec.articulated?'truck':'car']);
const server=await multiplayerServer(),browser=await chromium.launch({executablePath:process.env.OT_BROWSER_BINARY||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const report={baseline:baseline||null,browser:browser.version(),models:models.length,results:[],failures:[],limits:['Native OfflineAudioContext at 48 kHz; no physical Android speaker or microphone testing.']};
try{
 for(const scope of ['world','console'])for(const [model,kind] of models){
  const page=await browser.newPage();try{
   await page.route('**/__audio-qa',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Native audio verification</title>'}));
   if(baseline)for(const path of [scope==='world'?'games/otthi/assets/js/vehicles/engine-sound.js':'games/kart/recorded-audio.js','games/kart/audio/engine-car.ogg'])await page.route('**/'+path+'*',r=>r.fulfill({contentType:path.endsWith('.js')?'application/javascript':'audio/ogg',body:execFileSync('git',['show',baseline+':'+path],{maxBuffer:2e6})}));
   await page.goto(server.origin+'/__audio-qa');
   await page.evaluate(()=>{
    const native=new OfflineAudioContext(2,48000*11,48000),q={native,hidden:false,volume:.7,sources:[]};window.__AUDIO_QA=q;
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>q.hidden});
    const a={get currentTime(){return native.currentTime},get state(){return 'running'},sampleRate:native.sampleRate,destination:native.destination};
    for(const method of ['createBuffer','createBiquadFilter','createGain','createDynamicsCompressor','createOscillator','createStereoPanner','decodeAudioData'])a[method]=native[method].bind(native);
    a.createBufferSource=()=>{const n=native.createBufferSource();q.sources.push(n);return n;};
    window.ArcadePlaySettings={get:()=>({engineVolume:q.volume})};window.GameAudio={context:()=>a,unlock:()=>Promise.resolve(true),effect:()=>false,diagnostics:()=>({})};
   });
   if(scope==='world')await page.evaluate(url=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.dataset.civilian='true';s.src=url;s.onload=resolve;s.onerror=reject;document.head.append(s);}),server.origin+'/games/otthi/recorded-audio.js');
   await page.addScriptTag({url:server.origin+'/'+(scope==='world'?'games/otthi/assets/js/vehicles/engine-sound.js':'games/kart/recorded-audio.js')});
   const result=await page.evaluate(async({model,kind,scope})=>{
    const q=__AUDIO_QA,a=q.native,voice=GameAudio.vehicleVoice(model,kind);await GameAudio.preload();await Promise.resolve();await Promise.resolve();
    const voiceInfo=voice.diagnostics(),profile=(GameAudio.engineProfile||GameAudio.vehicleProfile)?.(model,kind)||voiceInfo;
    const provenance=[];for(let i=0;i<(voiceInfo.samples||[]).length;i++){const response=await fetch('/games/'+(scope==='world'?'otthi':'kart')+'/audio/'+voiceInfo.samples[i]+'.ogg'),expected=await a.decodeAudioData(await response.arrayBuffer()),actual=q.sources[i]?.buffer;const edit=GameAudio.diagnostics().engineLoopEdits?.[voiceInfo.samples[i]];let correlation=0,seam=0,correctFrames=false;
    if(actual&&edit){correctFrames=actual.length===edit.frames&&edit.sourceFrames===expected.length;const x=actual.getChannelData(0),y=expected.getChannelData(0);let xy=0,xx=0,yy=0;for(let j=0;j<x.length-edit.crossfadeFrames;j++){const sample=y[edit.startFrame+edit.crossfadeFrames+j];xy+=x[j]*sample;xx+=x[j]*x[j];yy+=sample*sample;}correlation=xy/Math.max(1e-12,Math.sqrt(xx*yy));seam=Math.abs(x[0]-x.at(-1));}
    provenance.push({sample:voiceInfo.samples[i],correlation,correctFrames,seam,frames:actual?.length,edit});}
    function stats(buffer,start=0,end=buffer.length){let peak=0,step=0,energy=0,finite=true;for(let c=0;c<buffer.numberOfChannels;c++){const x=buffer.getChannelData(c);for(let i=start;i<end;i++){const v=x[i];finite&&=Number.isFinite(v);peak=Math.max(peak,Math.abs(v));energy+=v*v;if(i>start)step=Math.max(step,Math.abs(v-x[i-1]));}}return{peak,step,rms:Math.sqrt(energy/((end-start)*buffer.numberOfChannels)),finite};}
    const source=q.sources.find(n=>n.buffer),wave=source?.buffer?stats(source.buffer):null;
    function update(frame){const t=frame/20;let speed=t<1.5?0:t<4?(t-1.5)*12:t<5?-(30-(t-4)*4):t<6?26*(6-t):8,load=t<1.5?.15:t<4?1:t<5?.6:t<6?0:.6;q.volume=t>=7&&t<7.5?0:.7;voice.update(speed,load,t>=3.5&&t<4,!(t>=6&&t<7));}
    const pauses=[];for(let frame=1;frame<=180;frame++)pauses.push(a.suspend(frame/20));update(0);const rendering=a.startRendering();
    for(let frame=1;frame<=180;frame++){await pauses[frame-1];update(frame);if(frame===180)voice.dispose();await a.resume();}
    const rendered=await rendering,range=(from,to)=>stats(rendered,Math.round(from*48000),Math.round(to*48000));
    return{scope,model,kind,profile,voiceInfo,provenance,wave,signal:stats(rendered),motor:range(2,5),paused:range(6.4,6.8),zeroVolume:range(7.15,7.4),disposed:range(9.3,10.8),after:GameAudio.diagnostics()};
   },{model,kind,scope});
   report.results.push(result);const issues=[];
   if(!result.signal.finite||result.signal.peak>.95)issues.push('nonfinite/clipping');
   const silent=result.profile.id==='silent'||result.profile.silent;
   if(!silent&&result.motor.rms<.001)issues.push('inaudible motor');
   if(result.paused.rms>1e-6)issues.push('pause tail');if(result.zeroVolume.rms>1e-6)issues.push('volume zero tail');if(result.disposed.rms>1e-7)issues.push('dispose tail');
   if((result.after.activeEngines||0)!==0)issues.push('retained voice');
   if(!silent&&result.profile.id!=='electric'&&(!result.voiceInfo.recorded||!result.provenance.length||result.provenance.some(p=>p.correlation<.94||!p.correctFrames)))issues.push('motor is not the licensed recording');
   if(scope==='world'&&result.after.decodedEngineFiles.length>result.provenance.length)issues.push('unrelated engines were decoded');
   if(issues.length)report.failures.push({scope,model,issues});
  }catch(error){report.failures.push({scope,model,error:String(error.stack)});}finally{await page.close();}
  if(report.results.length%10===0)console.log('Rendered',report.results.length,'graphs; failures',report.failures.length);
 }
 report.passed=report.failures.length===0;report.checkedAt=new Date().toISOString();fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,models:report.models,graphs:report.results.length,failures:report.failures,browser:report.browser}));assert.equal(report.failures.length,0);
}finally{await browser.close();await server.close();}

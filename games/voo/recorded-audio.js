/* Real recording layers on the existing unlocked AudioContext.
 * Sources and edits: audio/engine-recordings.json. These category adaptations
 * are not factory recordings of every named in-game vehicle. */
(()=>{'use strict';
 const legacy=window.GameAudio,version='20261029-continuity5';if(!legacy||legacy.recordedVersion===version)return;
 const script=document.currentScript,base=new URL('audio/',script.src),civilian=script.dataset?.civilian==='true',buffers=new Map(),pending=new Map(),engines=new Set(),shots=new Set(),targets=new WeakMap();let output=null,ownerContext=null,index=0,played=0,lastError='';
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),weapons=['rifle-1','rifle-2','smg-1','smg-2','marksman'];
 function context(){const a=legacy.context();if(a&&a!==ownerContext){output?.disconnect();ownerContext=a;buffers.clear();pending.clear();loopEdits.clear();output=a.createDynamicsCompressor();output.threshold.value=-12;output.knee.value=10;output.ratio.value=2.5;output.attack.value=.008;output.release.value=.18;output.connect(a.destination);}return a;}
 const loopEdits=new Map(),steadyBounds={'engine-road-idle':[.55,2.25],'engine-road-load':[1.6,3.3],'engine-moto-idle':[0,1.7],'engine-moto-load':[.35,2.05],'engine-small-moto':[0,1.7],'engine-rotor-recorded':[2.45,5.45],'engine-sport-idle':[.1,3.1],'engine-sport-load':[0,3]};
 function continuous(buffer,name,a){
  if(!name.startsWith('engine-'))return buffer;
  const rate=buffer.sampleRate,bounds=steadyBounds[name]||[0,buffer.duration],start=Math.round(bounds[0]*rate),end=Math.min(buffer.length,Math.round(bounds[1]*rate)),length=end-start,join=Math.min(Math.round(rate*.12),Math.floor(length/8));
  if(length<rate*.5)return buffer;
  // The encoded recordings are retained. Remove repeated acceleration/clunk
  // passages, gently level slow envelope changes and join decoded samples in
  // memory, after Vorbis decoding (which can otherwise reopen a loop seam).
  const bins=Math.ceil(length/(rate*.02)),energy=new Float64Array(bins),counts=new Uint32Array(bins);
  for(let c=0;c<buffer.numberOfChannels;c++){const input=buffer.getChannelData(c);for(let i=0;i<length;i++){const b=Math.min(bins-1,Math.floor(i/(rate*.02)));energy[b]+=input[start+i]**2;counts[b]++;}}
  const rms=Array.from(energy,(v,i)=>Math.sqrt(v/Math.max(1,counts[i]))),mean=rms.reduce((s,v)=>s+v,0)/bins,cv=Math.sqrt(rms.reduce((s,v)=>s+(v-mean)**2,0)/bins)/Math.max(1e-8,mean),gains=rms.map((_,i)=>{let sum=0;for(let j=-5;j<=5;j++)sum+=rms[(i+j+bins)%bins]**2;return cv>.18?clamp(mean/Math.max(1e-6,Math.sqrt(sum/11)),.70,1.4):1;});
  const result=a.createBuffer(buffer.numberOfChannels,length-join,rate);
  for(let c=0;c<buffer.numberOfChannels;c++){
   const input=buffer.getChannelData(c),prepared=new Float32Array(length),out=result.getChannelData(c);
   for(let i=0;i<length;i++){const at=i/(rate*.02),b=Math.floor(at),f=at-b;prepared[i]=input[start+i]*(gains[Math.min(b,bins-1)]*(1-f)+gains[Math.min(b+1,bins-1)]*f);}
   out.set(prepared.subarray(join));
   for(let i=0;i<join;i++){const t=.5-.5*Math.cos(Math.PI*i/(join-1));out[out.length-join+i]=prepared[length-join+i]*(1-t)+prepared[i]*t;}
  }
  loopEdits.set(name,{sourceFrames:buffer.length,sourceRate:rate,startFrame:start,endFrame:end,crossfadeFrames:join,frames:result.length,slowLeveling:cv>.18,sourceRmsCV:cv});return result;
 }
 function load(name,a=context()){
  if(!a)return Promise.resolve(false);if(buffers.has(name))return Promise.resolve(true);if(pending.has(name))return pending.get(name);
  const job=fetch(new URL(name+'.ogg',base)).then(r=>{if(!r.ok)throw Error(name+': HTTP '+r.status);return r.arrayBuffer();}).then(b=>a.decodeAudioData(b)).then(b=>{if(ownerContext===a)buffers.set(name,continuous(b,name,a));return true;}).catch(error=>{lastError=String(error);pending.delete(name);return false;});pending.set(name,job);return job;
 }
 function preload(){const a=context();if(!a)return Promise.resolve(false);if(!civilian)for(const name of weapons)load(name,a);return Promise.all([...pending.values()]).then(results=>results.every(Boolean));}
 function effect(name,volume=1,pan=0){
  const keys={rifle:['rifle-1','rifle-2'],smg:['smg-1','smg-2'],marksman:['marksman']}[name],a=context(),buffer=keys&&buffers.get(keys[index++%keys.length]);if(!buffer||a?.state!=='running'||document.hidden){if(keys&&a)keys.forEach(key=>load(key,a));return legacy.effect(name,volume,pan);}
  const source=a.createBufferSource(),gain=a.createGain(),stereo=a.createStereoPanner?.();source.buffer=buffer;source.playbackRate.value=.985+Math.random()*.03;gain.gain.value=.40*clamp(volume,0,1)*(window.ArcadePlaySettings?.get().engineVolume??.7);source.connect(gain);if(stereo){stereo.pan.value=clamp(pan,-1,1);gain.connect(stereo);stereo.connect(output);}else gain.connect(output);const v={source,gain,stereo};shots.add(v);while(shots.size>12){const old=shots.values().next().value;old.source.stop();shots.delete(old);}source.onended=()=>{shots.delete(v);source.disconnect();gain.disconnect();stereo?.disconnect();};source.start();played++;return true;
 }
 const roadProfiles=Object.freeze({
  fusca:['classic','classic','air-cooled-flat4',800,4500,1],kombi:['classic','classic','air-cooled-flat4',850,4600,.98],
  gol:['road','road','ap-inline4',900,6200,1.00],uno:['road','fiat','fire-inline4',850,5700,.97],golf:['road','road','petrol-inline4',850,6500,1.03],
  opala:['sport','inline6','classic-inline6',700,5600,.98],chevette:['road','road','classic-inline4',800,5700,.95],
  s10:['heavy','heavy','pickup-diesel-inline4',750,3800,1.01],hilux:['heavy','heavy','pickup-diesel-inline4',750,3700,.98],amarok:['heavy','heavy','pickup-diesel-inline4',750,4000,1.03],saveiro:['road','road','petrol-inline4',850,6200,1.02],
  constellation:['heavy','coach','truck-diesel',600,2600,.94],veraneio:['sport','inline6','classic-inline6',700,5200,.93],blazer:['road','road','blazer-petrol-inline4',850,5700,.98],pampa:['road','road','classic-inline4',850,5400,.94],escort:['road','road','ap-inline4',900,6200,1.03],
  tcross:['road','triple','turbo-inline3',850,6000,1.08],peugeot206:['road','road','petrol-inline4',850,6000,1.02],jetta:['road','road','turbo-inline4',850,6500,1.04],corolla2007:['road','road','petrol-inline4',800,6400,.98],corolla2021:['road','road','petrol-inline4',800,6500,1.01],civic2011:['road','road','petrol-inline4',800,6800,1.06],bmwx1:['road','road','turbo-inline4',850,6500,1.02],
  bmwm3:['sport','turbo6','turbo-inline6',850,7600,1.00],ferrari458:['sport','flatplane8','flat-plane-v8',1000,8500,1.03],porsche911:['sport','flat6','flat6',900,7400,1.00],golf7:['road','road','turbo-inline4',800,6500,1.04],palio:['road','fiat','fire-inline4',850,6000,1.00],passat:['road','road','ap-inline4',900,6100,1.00],tempra:['road','fiat','petrol-inline4-16v',850,6500,1.02],
  maverick:['sport','sport','cross-plane-v8',680,5200,.96],landau:['sport','sport','cross-plane-v8',650,5000,.93],
  mobylette:['motorcycle',null,'two-stroke-single',1500,6500,1],factor:['motorcycle','moto','four-stroke-single',1400,8000,.97],titan:['motorcycle','moto','four-stroke-single',1400,8500,1.00],hornet:['motorcycle','hornet','inline4-600',1300,10500,1.00],xre:['motorcycle','moto','four-stroke-single',1400,8500,.94],bmwgs:['motorcycle','twin','boxer-twin',1150,7500,1.00],
  dinossauro:['heavy','coach','coach-diesel',600,2600,.94],doubledeck:['heavy','coach','coach-diesel',650,2600,1],semi:['heavy','coach','truck-diesel',600,2600,.97],fuel:['heavy','coach','truck-diesel',600,2600,.97]
 });
 function profile(model='',kind=''){
  const exact=String(model).toLowerCase().replace(/^br-/,''),k=(model+'|'+kind).toLowerCase(),pair=(id,stem,pitch=1)=>({id,samples:['engine-'+stem+'-idle','engine-'+stem+'-load'],pitch});
  if(/bicycle|\bbike\b|skate|balloon|bal[aã]o/.test(k))return{id:'silent',engineFamily:'unpowered',samples:[],pitch:1};
  if(/attivi|electric|el[eé]tric|metro|metr[oô]|cableway|telef[eé]rico/.test(k))return{id:'electric',engineFamily:'electric',samples:[],pitch:1};
  if(/helicopter|heli|kestrel|guardian/.test(k))return{id:'helicopter',engineFamily:'rotor',samples:['engine-rotor-recorded'],pitch:1,continuous:true};
  if(/falcon|interceptor|sentinel|jet|jato/.test(k))return{id:'jet',engineFamily:'jet',samples:['engine-jet-recorded'],pitch:1,continuous:true};
  if(/plane|aircraft|avi[aã]o|cessna|cargo|propeller/.test(k))return{id:'propeller',engineFamily:'propeller',samples:['engine-prop-recorded'],pitch:1,continuous:true};
  if(/boat|lancha|barco|yacht/.test(k))return{id:'boat',engineFamily:'marine',samples:['engine-boat-recorded'],pitch:1,continuous:true};
  if(/kart/.test(k))return{id:'kart',engineFamily:'kart-single',samples:['engine-small-moto'],pitch:1.08,idle:1800,max:8500};
  const d=roadProfiles[exact];if(d)return{...(d[1]?pair(d[0],d[1],d[5]):{id:d[0],samples:['engine-small-moto'],pitch:d[5]}),model:exact,engineFamily:d[2],idle:d[3],max:d[4],fidelity:['hornet','fusca','porsche911'].includes(exact)?'recorded-model-family':'related-engine-adaptation'};
  if(/moto|motorcycle/.test(k))return{...pair('motorcycle','moto'),engineFamily:'motorcycle-generic',idle:1400,max:8000};
  if(/truck|bus|scania|semi|fuel|firefighter/.test(k))return{...pair('heavy','coach'),engineFamily:'diesel-generic',idle:600,max:2600};
  return{...pair('road','road'),engineFamily:'petrol-generic',idle:850,max:5700};
 }
 function hold(param,t){if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(t);else{const value=param.value;param.cancelScheduledValues(t);param.setValueAtTime(value,t);}}
 function glide(param,value,t,seconds=.16){if(!param||targets.get(param)===value)return;targets.set(param,value);hold(param,t);param.setTargetAtTime(value,t,seconds);}
 function level(param,value,t){if(targets.get(param)===value)return;targets.set(param,value);hold(param,t);param.linearRampToValueAtTime(value,t+(value===0?.045:.085));}
 function vehicleVoice(model='',kind='',spec={}){
  const p=profile(model,kind),v={profile:p.id,samples:p.samples,disposed:false,a:null,layers:[],nodes:[],sources:[],loading:false,gear:1,rpm:spec.idle||850,speed:0,load:0,band:0,enabled:false,rate:1,rates:[1,1],mix:0,master:0};
  if(p.id==='silent')return{update(){},dispose(){},diagnostics:()=>({profile:p.id,silent:true,recorded:false,ready:false,samples:[]})};
  engines.add(v);
  function apply(){if(!v.a||v.disposed)return;const t=v.a.currentTime,audible=v.enabled&&!document.hidden&&v.a.state==='running';for(let i=0;i<v.layers.length;i++){const layer=v.layers[i],weight=v.layers.length===1?1:i===0?Math.cos(v.mix*Math.PI/2):Math.sin(v.mix*Math.PI/2);glide(layer.source.playbackRate,v.rates[i]??v.rate,t,.18);if(p.id==='electric')glide(layer.source.frequency,70+v.band*150,t,.2);glide(layer.filter.frequency,p.id==='electric'?600:p.id==='heavy'?1800+v.load*2300:p.id==='classic'?2600+v.load*2700:3500+v.load*4200,t,.20);level(layer.gain.gain,audible?v.master*weight:0,t);}}
  function initialize(){
   if(v.disposed||v.loading||v.sources.length)return;const a=context();if(!a)return;v.a=a;v.loading=true;
   const ready=p.id==='electric'?Promise.resolve(true):Promise.all(p.samples.map(name=>load(name,a))).then(r=>r.every(Boolean));
   ready.then(ok=>{v.loading=false;if(v.disposed||!ok)return;for(const name of p.id==='electric'?[null]:p.samples){const source=name?a.createBufferSource():a.createOscillator(),filter=a.createBiquadFilter(),gain=a.createGain();if(name){source.buffer=buffers.get(name);if(!source.buffer)continue;source.loop=true;}else{source.type='sine';source.frequency.value=70;}filter.type='lowpass';filter.Q.value=.55;gain.gain.value=0;source.connect(filter);filter.connect(gain);gain.connect(output);v.layers.push({source,filter,gain});v.nodes.push(filter,gain);v.sources.push(source);source.start(a.currentTime);}apply();});
  }
  initialize();
  return{
   update(speed=0,throttle=0,turbo=false,enabled=true){
    if(v.disposed)return;const s=Math.abs(Number(speed)||0),loadValue=clamp(Math.abs(Number(throttle)||0),0,1),ratios=spec.ratios||(p.id==='heavy'?[0,4,7,11,16,23,32]:p.id==='motorcycle'?[0,5,10,16,23,32,44]:[0,6,11,17,25,35]),continuous=!!p.continuous||p.id==='electric';v.speed=s;v.load=loadValue;v.enabled=!!enabled;
    if(!continuous){while(v.gear<ratios.length-1&&s>ratios[v.gear]+.7)v.gear++;while(v.gear>1&&s<ratios[v.gear-1]-.9)v.gear--;}
    const local=continuous?clamp(s/(p.id==='jet'?100:p.id==='propeller'?40:25),0,1):clamp((s-ratios[v.gear-1])/Math.max(1,ratios[v.gear]-ratios[v.gear-1]),0,1);
    v.band=clamp(local*.75+loadValue*.20+(turbo?.05:0),0,1);v.rpm=p.id==='helicopter'?Math.round(360+loadValue*45):Math.round((spec.idle||p.idle||850)+v.band*((spec.max||p.max||5700)-(spec.idle||p.idle||850)));
    v.rate=p.pitch*(p.id==='helicopter'?.98+loadValue*.04:p.id==='jet'?.94+loadValue*.10:p.id==='propeller'?.90+loadValue*.18:p.id==='boat'?.85+loadValue*.25+local*.08:.88+v.band*(p.id==='motorcycle'?.34:.28));
    if(continuous){v.rates=[v.rate,v.rate];v.mix=0;}
    else{v.rates=[p.pitch*(1+v.band*.62),p.pitch*(.72+v.band*.64)];v.mix=clamp((v.band-.04)/.64,0,1)*(.62+v.load*.38);v.rate=v.rates[1];}
    const master=clamp(Number(window.ArcadePlaySettings?.get().engineVolume??.7),0,1);v.master=(p.id==='electric'?.02+local*.04:.34+loadValue*.09)*master;
    initialize();apply();
   },
   dispose(){if(v.disposed)return;v.disposed=true;engines.delete(v);if(!v.sources.length)return;const t=v.a.currentTime;for(const layer of v.layers)level(layer.gain.gain,0,t);let remaining=v.sources.length;for(const source of v.sources){source.onended=()=>{source.disconnect();if(--remaining===0)for(const node of v.nodes)node.disconnect();};source.stop(t+.08);}},
   diagnostics:()=>({profile:v.profile,model:p.model||model,engineFamily:p.engineFamily,fidelity:p.fidelity||'category-adaptation',layerRates:[...v.rates],ready:v.sources.length>0,recorded:p.id!=='electric'&&v.sources.length>0,soundVersion:version,samples:[...v.samples],gear:v.gear,rpm:v.rpm,rate:v.rate,speed:v.speed,load:v.load,level:v.enabled&&!document.hidden?v.master:0})
  };
 }
 for(const name of ['pointerdown','pointerup','keydown','touchend'])document.addEventListener(name,()=>{legacy.unlock();preload();},{capture:true,passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){for(const v of engines)if(v.a)for(const layer of v.layers)level(layer.gain.gain,0,v.a.currentTime);for(const v of shots)v.source.stop();}});
 window.GameAudio=Object.freeze({...legacy,recordedVersion:version,effect,vehicleVoice,vehicleProfile:profile,preload,diagnostics:()=>({...legacy.diagnostics(),engineVersion:version,recordedVersion:version,recordings:buffers.size,decodedEngineFiles:[...buffers.keys()].filter(k=>k.startsWith('engine-')),engineLoopEdits:Object.fromEntries(loopEdits),playedSamples:played,activeEngines:engines.size,activeShots:shots.size,lastRecordingError:lastError})});
})();

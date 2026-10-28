/* Real recording layers on the existing unlocked AudioContext.
 * Sources and edits: audio/engine-recordings.json. These category adaptations
 * are not factory recordings of every named in-game vehicle. */
(()=>{'use strict';
 const legacy=window.GameAudio,version='20261028-recorded3';if(!legacy||legacy.recordedVersion===version)return;
 const script=document.currentScript,base=new URL('audio/',script.src),civilian=script.dataset?.civilian==='true',buffers=new Map(),pending=new Map(),engines=new Set(),shots=new Set(),targets=new WeakMap();let output=null,ownerContext=null,index=0,played=0,lastError='';
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),weapons=['rifle-1','rifle-2','smg-1','smg-2','marksman'];
 function context(){const a=legacy.context();if(a&&a!==ownerContext){output?.disconnect();ownerContext=a;buffers.clear();pending.clear();output=a.createDynamicsCompressor();output.threshold.value=-12;output.knee.value=10;output.ratio.value=2.5;output.attack.value=.008;output.release.value=.18;output.connect(a.destination);}return a;}
 function load(name,a=context()){
  if(!a)return Promise.resolve(false);if(buffers.has(name))return Promise.resolve(true);if(pending.has(name))return pending.get(name);
  const job=fetch(new URL(name+'.ogg',base)).then(r=>{if(!r.ok)throw Error(name+': HTTP '+r.status);return r.arrayBuffer();}).then(b=>a.decodeAudioData(b)).then(b=>{if(ownerContext===a)buffers.set(name,b);return true;}).catch(error=>{lastError=String(error);pending.delete(name);return false;});pending.set(name,job);return job;
 }
 function preload(){const a=context();if(!a)return Promise.resolve(false);if(!civilian)for(const name of weapons)load(name,a);return Promise.all([...pending.values()]).then(results=>results.every(Boolean));}
 function effect(name,volume=1,pan=0){
  const keys={rifle:['rifle-1','rifle-2'],smg:['smg-1','smg-2'],marksman:['marksman']}[name],a=context(),buffer=keys&&buffers.get(keys[index++%keys.length]);if(!buffer||a?.state!=='running'||document.hidden){if(keys&&a)keys.forEach(key=>load(key,a));return legacy.effect(name,volume,pan);}
  const source=a.createBufferSource(),gain=a.createGain(),stereo=a.createStereoPanner?.();source.buffer=buffer;source.playbackRate.value=.985+Math.random()*.03;gain.gain.value=.40*clamp(volume,0,1)*(window.ArcadePlaySettings?.get().engineVolume??.7);source.connect(gain);if(stereo){stereo.pan.value=clamp(pan,-1,1);gain.connect(stereo);stereo.connect(output);}else gain.connect(output);const v={source,gain,stereo};shots.add(v);while(shots.size>12){const old=shots.values().next().value;old.source.stop();shots.delete(old);}source.onended=()=>{shots.delete(v);source.disconnect();gain.disconnect();stereo?.disconnect();};source.start();played++;return true;
 }
 function profile(model='',kind=''){
  const k=(model+'|'+kind).toLowerCase(),pair=(id,stem,pitch=1)=>({id,samples:['engine-'+stem+'-idle','engine-'+stem+'-load'],pitch});
  if(/bicycle|\bbike\b|skate|balloon|bal[aã]o/.test(k))return{id:'silent',samples:[],pitch:1};
  if(/attivi|electric|el[eé]tric|metro|metr[oô]|cableway|telef[eé]rico/.test(k))return{id:'electric',samples:[],pitch:1};
  if(/helicopter|heli|kestrel|guardian/.test(k))return{id:'helicopter',samples:['engine-rotor-recorded'],pitch:1,continuous:true};
  if(/falcon|interceptor|sentinel|jet|jato/.test(k))return{id:'jet',samples:['engine-jet-recorded'],pitch:1,continuous:true};
  if(/plane|aircraft|avi[aã]o|cessna|cargo|propeller/.test(k))return{id:'propeller',samples:['engine-prop-recorded'],pitch:1,continuous:true};
  if(/boat|lancha|barco|yacht/.test(k))return{id:'boat',samples:['engine-boat-recorded'],pitch:1,continuous:true};
  if(/kart/.test(k))return{id:'kart',samples:['engine-small-moto'],pitch:1.08};
  if(/mobylette|mobilete|moped/.test(k))return{id:'motorcycle',samples:['engine-small-moto'],pitch:1};
  if(/bmwgs|bmw-gs/.test(k))return pair('motorcycle','twin');
  if(/hornet|factor|titan|xre|motorcycle|moto/.test(k))return pair('motorcycle','moto',/hornet/.test(k)?1.04:1);
  if(/opala|maverick|landau|ferrari|porsche|bmwm3/.test(k))return pair('sport','sport',/ferrari|porsche|bmwm3/.test(k)?1.05:1);
  if(/s10|hilux|amarok|truck|bus|constellation|scania|semi|fuel|dinossauro|doubledeck|firefighter/.test(k))return pair('heavy','heavy');
  if(/fusca|kombi/.test(k))return pair('classic','classic');
  return pair('road','road');
 }
 function hold(param,t){if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(t);else{const value=param.value;param.cancelScheduledValues(t);param.setValueAtTime(value,t);}}
 function glide(param,value,t,seconds=.16){if(!param||targets.get(param)===value)return;targets.set(param,value);hold(param,t);param.setTargetAtTime(value,t,seconds);}
 function level(param,value,t){if(targets.get(param)===value)return;targets.set(param,value);hold(param,t);param.linearRampToValueAtTime(value,t+(value===0?.045:.085));}
 function vehicleVoice(model='',kind='',spec={}){
  const p=profile(model,kind),v={profile:p.id,samples:p.samples,disposed:false,a:null,layers:[],nodes:[],sources:[],loading:false,gear:1,rpm:spec.idle||850,speed:0,load:0,band:0,enabled:false,rate:1,mix:0,master:0};
  if(p.id==='silent')return{update(){},dispose(){},diagnostics:()=>({profile:p.id,silent:true,recorded:false,ready:false,samples:[]})};
  engines.add(v);
  function apply(){if(!v.a||v.disposed)return;const t=v.a.currentTime,audible=v.enabled&&!document.hidden&&v.a.state==='running';for(let i=0;i<v.layers.length;i++){const layer=v.layers[i],weight=v.layers.length===1?1:i===0?Math.cos(v.mix*Math.PI/2):Math.sin(v.mix*Math.PI/2);glide(layer.source.playbackRate,v.rate,t,.18);if(p.id==='electric')glide(layer.source.frequency,70+v.band*150,t,.2);glide(layer.filter.frequency,p.id==='electric'?600:3200+v.load*4200,t,.20);level(layer.gain.gain,audible?v.master*weight:0,t);}}
  function initialize(){
   if(v.disposed||v.loading||v.sources.length)return;const a=context();if(!a)return;v.a=a;v.loading=true;
   const ready=p.id==='electric'?Promise.resolve(true):Promise.all(p.samples.map(name=>load(name,a))).then(r=>r.every(Boolean));
   ready.then(ok=>{v.loading=false;if(v.disposed||!ok)return;for(const name of p.id==='electric'?[null]:p.samples){const source=name?a.createBufferSource():a.createOscillator(),filter=a.createBiquadFilter(),gain=a.createGain();if(name){source.buffer=buffers.get(name);if(!source.buffer)continue;source.loop=true;}else{source.type='sine';source.frequency.value=70;}filter.type='lowpass';filter.Q.value=.55;gain.gain.value=0;source.connect(filter);filter.connect(gain);gain.connect(output);v.layers.push({source,filter,gain});v.nodes.push(filter,gain);v.sources.push(source);source.start(a.currentTime);}apply();});
  }
  initialize();
  return{
   update(speed=0,throttle=0,turbo=false,enabled=true){
    if(v.disposed)return;const s=Math.abs(Number(speed)||0),loadValue=clamp(Math.abs(Number(throttle)||0),0,1),ratios=spec.ratios||[0,4.4,8.5,13.3,18.4,26.5],continuous=!!p.continuous||p.id==='electric';v.speed=s;v.load=loadValue;v.enabled=!!enabled;
    if(!continuous){while(v.gear<ratios.length-1&&s>ratios[v.gear]+.7)v.gear++;while(v.gear>1&&s<ratios[v.gear-1]-.9)v.gear--;}
    const local=continuous?clamp(s/(p.id==='jet'?100:p.id==='propeller'?40:25),0,1):clamp((s-ratios[v.gear-1])/Math.max(1,ratios[v.gear]-ratios[v.gear-1]),0,1);
    v.band=clamp(local*.75+loadValue*.20+(turbo?.05:0),0,1);v.rpm=p.id==='helicopter'?Math.round(360+loadValue*45):Math.round((spec.idle||850)+v.band*((spec.max||5700)-(spec.idle||850)));
    v.rate=p.pitch*(p.id==='helicopter'?.98+loadValue*.04:p.id==='jet'?.94+loadValue*.10:p.id==='propeller'?.90+loadValue*.18:p.id==='boat'?.85+loadValue*.25+local*.08:.88+v.band*(p.id==='motorcycle'?.34:.28));
    v.mix=clamp(loadValue*.65+v.band*.35,0,1);const master=clamp(Number(window.ArcadePlaySettings?.get().engineVolume??.7),0,1);v.master=(p.id==='electric'?.02+local*.04:.35+loadValue*.08)*master;
    initialize();apply();
   },
   dispose(){if(v.disposed)return;v.disposed=true;engines.delete(v);if(!v.sources.length)return;const t=v.a.currentTime;for(const layer of v.layers)level(layer.gain.gain,0,t);let remaining=v.sources.length;for(const source of v.sources){source.onended=()=>{source.disconnect();if(--remaining===0)for(const node of v.nodes)node.disconnect();};source.stop(t+.08);}},
   diagnostics:()=>({profile:v.profile,ready:v.sources.length>0,recorded:p.id!=='electric'&&v.sources.length>0,soundVersion:version,samples:[...v.samples],gear:v.gear,rpm:v.rpm,rate:v.rate,speed:v.speed,load:v.load,level:v.enabled&&!document.hidden?v.master:0})
  };
 }
 for(const name of ['pointerdown','pointerup','keydown','touchend'])document.addEventListener(name,()=>{legacy.unlock();preload();},{capture:true,passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){for(const v of engines)if(v.a)for(const layer of v.layers)level(layer.gain.gain,0,v.a.currentTime);for(const v of shots)v.source.stop();}});
 window.GameAudio=Object.freeze({...legacy,recordedVersion:version,effect,vehicleVoice,vehicleProfile:profile,preload,diagnostics:()=>({...legacy.diagnostics(),engineVersion:version,recordedVersion:version,recordings:buffers.size,decodedEngineFiles:[...buffers.keys()].filter(k=>k.startsWith('engine-')),playedSamples:played,activeEngines:engines.size,activeShots:shots.size,lastRecordingError:lastError})});
})();

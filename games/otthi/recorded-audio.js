/* Recorded sound bank and RPM/load mixer on the existing unlocked AudioContext. */
(()=>{'use strict';
 const legacy=window.GameAudio;if(!legacy||legacy.vehicleVoice)return;const base=new URL('audio/',document.currentScript.src),buffers=new Map(),engines=new Set(),shots=new Set(),files=['rifle-1','rifle-2','smg-1','smg-2','marksman','engine-car','engine-moto','engine-heli'];let loading=null,output=null,ownerContext=null,index=0,played=0,lastError='';
 function context(){const a=legacy.context();if(a&&a!==ownerContext){output?.disconnect();ownerContext=a;output=a.createDynamicsCompressor();output.threshold.value=-14;output.knee.value=12;output.ratio.value=3;output.attack.value=.006;output.release.value=.18;output.connect(a.destination);}return a;}
 function preload(){if(loading)return loading;const a=context();if(!a)return Promise.resolve(false);loading=Promise.allSettled(files.map(async name=>{const r=await fetch(new URL(name+'.ogg',base));if(!r.ok)throw Error(name+': HTTP '+r.status);buffers.set(name,await a.decodeAudioData(await r.arrayBuffer()));})).then(results=>{const fail=results.find(r=>r.status==='rejected');if(fail)lastError=String(fail.reason);return !fail;});return loading;}
 function effect(name,volume=1,pan=0){
  const keys={rifle:['rifle-1','rifle-2'],smg:['smg-1','smg-2'],marksman:['marksman']}[name],a=context(),buffer=keys&&buffers.get(keys[index++%keys.length]);if(!buffer||a?.state!=='running'||document.hidden)return legacy.effect(name,volume,pan);
  const source=a.createBufferSource(),gain=a.createGain(),stereo=a.createStereoPanner?.();source.buffer=buffer;source.playbackRate.value=.985+Math.random()*.03;gain.gain.value=.40*Math.max(0,Math.min(1,volume))*(window.ArcadePlaySettings?.get().engineVolume??.7);source.connect(gain);if(stereo){stereo.pan.value=Math.max(-1,Math.min(1,pan));gain.connect(stereo);stereo.connect(output);}else gain.connect(output);const v={source,gain,stereo};shots.add(v);while(shots.size>12){const old=shots.values().next().value;old.source.stop();shots.delete(old);}source.onended=()=>{shots.delete(v);source.disconnect();gain.disconnect();stereo?.disconnect();};source.start();played++;return true;
 }
 // These are authored mixes, not factory recordings of individual models.
 function profile(model='',kind=''){
  const k=(model+'|'+kind).toLowerCase();
  if(/bicycle|\bbike\b|skate|balloon|bal[aã]o/.test(k))return{id:'silent',sample:null,pitch:1};
  if(/attivi|electric|el[eé]tric|metro|metr[oô]|cableway|telef[eé]rico/.test(k))return{id:'electric',synth:true,pitch:1};
  if(/helicopter|heli|kestrel|guardian/.test(k))return{id:'helicopter',sample:'engine-heli',pitch:1,continuous:true};
  if(/falcon|interceptor|sentinel|jet|jato/.test(k))return{id:'jet',synth:true,pitch:1,continuous:true};
  if(/plane|aircraft|avi[aã]o|cessna|cargo|propeller/.test(k))return{id:'propeller',sample:'engine-moto',pitch:.72,continuous:true};
  if(/boat|lancha|barco|yacht/.test(k))return{id:'boat',sample:'engine-car',pitch:.68,continuous:true};
  if(/kart/.test(k))return{id:'kart',sample:'engine-moto',pitch:1.06};
  if(/mobylette|mobilete|hornet|factor|titan|xre|bmwgs|motorcycle|moto/.test(k))return{id:'motorcycle',sample:'engine-moto',pitch:/mobylette|mobilete/.test(k)?.85:1};
  if(/opala|maverick|landau|ferrari|bmwm3/.test(k))return{id:'sport',sample:'engine-car',pitch:.74};
  if(/s10|hilux|amarok|truck|bus|constellation|scania|semi|fuel|dinossauro|doubledeck|firefighter/.test(k))return{id:'heavy',sample:'engine-car',pitch:.65};
  if(/fusca|kombi/.test(k))return{id:'classic',sample:'engine-car',pitch:.82};
  return{id:'road',sample:'engine-car',pitch:1};
 }
 const loops=new Map(),targets=new WeakMap();let engineNoise=null;
 function loopBuffer(name,a){
  if(loops.has(name))return loops.get(name);const b=buffers.get(name);if(!b)return null;
  const n=Math.min(Math.floor(b.sampleRate*.10),Math.floor(b.length/5)),loop=a.createBuffer(b.numberOfChannels,b.length-n,b.sampleRate);
  for(let c=0;c<b.numberOfChannels;c++){const x=b.getChannelData(c),y=loop.getChannelData(c);y.set(x.subarray(n));for(let i=0;i<n;i++){const m=.5-.5*Math.cos(i/(n-1)*Math.PI);y[y.length-n+i]=x[b.length-n+i]*(1-m)+x[i]*m;}}
  loops.set(name,loop);return loop;
 }
 function noiseBuffer(a){
  if(engineNoise?.sampleRate===a.sampleRate)return engineNoise;engineNoise=a.createBuffer(1,a.sampleRate*2,a.sampleRate);const x=engineNoise.getChannelData(0);let mean=0;
  for(let i=0;i<x.length;i++){x[i]=(Math.random()*2-1)*.45;mean+=x[i];}mean/=x.length;for(let i=0;i<x.length;i++)x[i]-=mean;return engineNoise;
 }
 function hold(param,t){if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(t);else{const v=param.value;param.cancelScheduledValues(t);param.setValueAtTime(v,t);}}
 function glide(param,value,t,seconds=.10){if(!param||targets.get(param)===value)return;targets.set(param,value);hold(param,t);param.setTargetAtTime(value,t,seconds);}
 function level(param,value,t){if(targets.get(param)===value)return;targets.set(param,value);hold(param,t);param.linearRampToValueAtTime(value,t+(value===0?.045:.065));}
 function vehicleVoice(model='',kind=''){
  const a=context(),p=profile(model,kind);
  if(!a||p.id==='silent')return{update(){},dispose(){},diagnostics:()=>({profile:p.id,silent:true,ready:false})};
  const v={profile:p.id,disposed:false,source:null,gain:null,filter:null,nodes:[],sources:[],gear:1,rpm:900,rate:1,speed:0,load:0,enabled:false,level:0};engines.add(v);
  function apply(){if(!v.gain||v.disposed)return;const t=a.currentTime;glide(v.source.playbackRate,v.rate,t,.12);glide(v.filter.frequency,v.cutoff,t,.12);if(v.tone)glide(v.tone.frequency,p.id==='electric'?65+v.speedRatio*160:80+v.load*90,t,.14);level(v.gain.gain,v.enabled&&!document.hidden?v.level:0,t);}
  function start(){
   if(v.disposed)return;const b=p.sample?loopBuffer(p.sample,a):p.id==='jet'?noiseBuffer(a):null;if(p.sample&&!b)return;
   v.filter=a.createBiquadFilter();v.filter.type='lowpass';v.filter.Q.value=.65;v.gain=a.createGain();v.gain.gain.value=0;v.filter.connect(v.gain);v.gain.connect(output);v.nodes.push(v.filter,v.gain);
   if(p.id==='electric'){v.source=a.createOscillator();v.source.type='sine';v.source.frequency.value=65;v.tone=v.source;v.source.connect(v.filter);v.sources.push(v.source);}
   else{v.source=a.createBufferSource();v.source.buffer=b;v.source.loop=true;v.source.connect(v.filter);v.sources.push(v.source);if(p.id==='jet'){v.tone=a.createOscillator();v.tone.type='sine';v.tone.frequency.value=80;const g=a.createGain();g.gain.value=.12;v.nodes.push(g);v.tone.connect(g);g.connect(v.filter);v.sources.push(v.tone);}}
   for(const n of v.sources)n.start(a.currentTime);if(v.hasUpdate)apply();
  }
  if(p.synth)start();else preload().then(start);
  return{
   update(speed=0,throttle=0,turbo=false,enabled=true){
    if(v.disposed)return;const s=Math.abs(Number(speed)||0),load=Math.max(0,Math.min(1,Math.abs(Number(throttle)||0))),heli=p.id==='helicopter',limits=[0,4.4,8.5,13.3,18.4,26.5];v.speed=s;v.load=load;v.enabled=!!enabled;
    if(!p.continuous&&p.id!=='electric'){while(v.gear<5&&s>limits[v.gear]+.6)v.gear++;while(v.gear>1&&s<limits[v.gear-1]-.9)v.gear--;}
    const local=p.continuous||p.id==='electric'?Math.min(1,s/(p.id==='jet'?100:p.id==='propeller'?40:25)):Math.max(0,Math.min(1,(s-limits[v.gear-1])/(limits[v.gear]-limits[v.gear-1])));v.speedRatio=local;
    v.rpm=heli?Math.round(360+load*45):Math.round(850+local*3200+load*700+(turbo?500:0));v.rate=p.pitch*(heli?.97+load*.09:.68+local*.72+load*.12+(turbo?.08:0));const master=window.ArcadePlaySettings?.get().engineVolume??.7;
    v.level=(p.id==='electric'?.018+Math.min(1,s/15)*.05:heli?.20:p.id==='jet'?.20+load*.10:.13+load*.09+Math.min(1,s/20)*.035)*master;v.cutoff=heli?2100:p.id==='electric'?650:p.id==='boat'?520+load*700:p.id==='jet'?450+load*1300:620+load*1300+local*650;v.hasUpdate=true;apply();
   },
   dispose(){if(v.disposed)return;v.disposed=true;engines.delete(v);if(!v.source)return;const t=a.currentTime;level(v.gain.gain,0,t);let remaining=v.sources.length;for(const n of v.sources){n.onended=()=>{n.disconnect();if(--remaining===0)for(const node of v.nodes)node.disconnect();};n.stop(t+.06);}},
   diagnostics:()=>({profile:v.profile,ready:!!v.source,gear:v.gear,rpm:v.rpm,rate:v.rate,speed:v.speed,load:v.load,level:v.enabled&&!document.hidden?v.level:0})
  };
 }
 for(const name of['pointerdown','pointerup','keydown','touchend'])document.addEventListener(name,()=>{legacy.unlock();preload();},{capture:true,passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){const t=context()?.currentTime||0;for(const v of engines)if(v.gain)level(v.gain.gain,0,t);for(const v of shots)v.source.stop();}});
 window.GameAudio=Object.freeze({...legacy,effect,vehicleVoice,vehicleProfile:profile,preload,diagnostics:()=>({...legacy.diagnostics(),recordings:buffers.size,playedSamples:played,activeEngines:engines.size,activeShots:shots.size,lastRecordingError:lastError})});
})();

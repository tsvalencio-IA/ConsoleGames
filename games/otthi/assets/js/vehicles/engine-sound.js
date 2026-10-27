/* Civilian engine sound: separate combustion, induction and road layers.
 * Original procedural synthesis; does not pitch the same recording for every car.
 * One crank cycle contains the real number of ignition events for each profile.
 */
(()=>{'use strict';
 const previous=window.GameAudio;if(!previous)return;
 const voices=new Set(),waves=new Map();let bus=null,noise=null;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function profile(model='',kind=''){
  const k=(model+' '+kind).toLowerCase();
  if(/bicycle|\bbike\b|skate/.test(k))return{id:'silent',variant:'bicicleta',cyl:0};
  if(/balloon|balão/.test(k))return{id:'balloon',variant:'queimador',cyl:0};
  if(/electric|eletrico|elétrico|attivi|attive/.test(k))return{id:'electric',variant:'elétrico',cyl:0,max:6500,idle:0};
  if(/helicopter|helicóptero/.test(k))return{id:'helicopter',variant:'rotor',cyl:4,idle:360,max:410,rotor:true};
  if(/boat|lancha/.test(k))return{id:'marine',variant:'motor-de-popa',cyl:3,idle:800,max:5600,ratios:[0,28],tone:1100};
  if(/plane|avião|cargo/.test(k))return{id:'airplane',variant:'hélice',cyl:6,idle:750,max:2700,ratios:[0,42],tone:950};
  if(/mobylette|mobilete|moped/.test(k))return{id:'motorcycle',variant:'mobilete-2t',cyl:1,twoStroke:true,idle:1500,max:6500,ratios:[0,13,25],tone:1500};
  if(/hornet/.test(k))return{id:'motorcycle',variant:'quatro-cilindros-600',cyl:4,idle:1300,max:10500,ratios:[0,7,12,18,25,34,44],tone:2100};
  if(/bmwgs|bmw-gs/.test(k))return{id:'motorcycle',variant:'boxer-duplo',cyl:2,idle:1150,max:7500,ratios:[0,6,11,17,24,33,43],tone:1350};
  if(/factor|titan|xre|motorcycle|moto/.test(k))return{id:'motorcycle',variant:'monocilíndrica-125-150',cyl:1,idle:1400,max:8000,ratios:[0,4.5,8.5,13,18,25],tone:1300};
  if(/kart/.test(k))return{id:'motorcycle',variant:'kart',cyl:1,idle:1800,max:8500,ratios:[0,32],tone:1700};
  if(/ferrari/.test(k))return{id:'sport',variant:'v8-esportivo',cyl:8,idle:1000,max:8500,ratios:[0,10,17,24,32,43,58],tone:2200};
  if(/landau|maverick/.test(k))return{id:'sport',variant:'v8-clássico',cyl:8,idle:680,max:5200,ratios:[0,8,15,24,36],tone:1250};
  if(/opala/.test(k))return{id:'sport',variant:'seis-em-linha',cyl:6,idle:700,max:5600,ratios:[0,8,15,24,36],tone:1200};
  if(/porsche/.test(k))return{id:'sport',variant:'boxer-seis',cyl:6,idle:900,max:7200,ratios:[0,10,18,27,38,52],tone:1700};
  if(/bmwm3/.test(k))return{id:'sport',variant:'seis-esportivo',cyl:6,idle:850,max:7600,ratios:[0,10,18,27,38,52],tone:1800};
  if(/fusca|kombi/.test(k))return{id:'classic',variant:'boxer-ar',cyl:4,idle:800,max:4500,ratios:[0,6,11,18,28],tone:1150};
  if(/truck|bus|scania|constellation|dinossauro|doubledecker/.test(k))return{id:'heavy',variant:'diesel-seis',cyl:6,idle:600,max:2600,ratios:[0,4,7,11,16,23,32],tone:850};
  if(/hilux|amarok|s10/.test(k))return{id:'heavy',variant:/v6/.test(k)?'diesel-v6':'diesel-quatro',cyl:/v6/.test(k)?6:4,idle:750,max:3800,ratios:[0,6,11,17,25,35],tone:1050};
  return{id:'road',variant:/golf|jetta|tcross/.test(k)?'quatro-turbo':'quatro-brasileiro',cyl:4,idle:850,max:/golf|jetta/.test(k)?6500:5700,ratios:[0,6,11,17,25,35],tone:1400};
 }
 function context(){const a=previous.context();if(a&&!bus){bus=a.createDynamicsCompressor();bus.threshold.value=-15;bus.knee.value=12;bus.ratio.value=2.6;bus.attack.value=.008;bus.release.value=.22;bus.connect(a.destination);}return a;}
 function wave(a,p){
  const key=p.variant;if(waves.has(key))return waves.get(key);
  const length=8192,b=a.createBuffer(2,length,a.sampleRate);let seed=177705;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296-.5;};
  for(let channel=0;channel<2;channel++){const out=b.getChannelData(channel);let sum=0;
   for(let i=0;i<length;i++){const t=i/length;let value=0;
    for(let n=0;n<p.cyl;n++){const start=n/p.cyl+(p.variant==='v8-clássico'?(n%2?.009:-.009):0),phase=(t-start+1)%1,width=p.rotor?.11:Math.min(.12,(p.variant.includes('diesel')?.27:p.variant.includes('boxer')?.38:.33)/p.cyl),hit=Math.exp(-phase/width);
     value+=hit*(Math.sin(phase/width*3.1)*.77+Math.sin(phase/width*7.8)*.17+random()*.20)*(channel&&n%2?.91:1);
    }
    value+=Math.sin(t*Math.PI*2)*.055;out[i]=value;sum+=value;
   }
   const mean=sum/length;let energy=0;for(let i=0;i<length;i++){out[i]-=mean;energy+=out[i]*out[i];}const gain=.27/Math.max(.03,Math.sqrt(energy/length));for(let i=0;i<length;i++)out[i]=Math.tanh(out[i]*gain*1.15);
  }waves.set(key,b);return b;
 }
 function noiseBuffer(a){if(noise)return noise;noise=a.createBuffer(1,a.sampleRate*2,a.sampleRate);const x=noise.getChannelData(0);let seed=177,low=0;for(let i=0;i<x.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;low=.89*low+.11*(seed/4294967296*2-1);x[i]=low*1.8;}return noise;}
 function vehicleVoice(model='',kind=''){
  const a=context(),p=profile(model,kind),v={profile:p.id,variant:p.variant,ready:false,gear:1,rpm:p.idle||0,rate:0,speed:0,load:0,disposed:false,nodes:[],shiftAt:-10,lastAt:0};
  if(!a||p.id==='silent')return{update(){},dispose(){},diagnostics:()=>({...v,silent:true,nodes:undefined})};
  const source=a.createBufferSource(),filter=a.createBiquadFilter(),gain=a.createGain(),road=a.createBufferSource(),roadFilter=a.createBiquadFilter(),roadGain=a.createGain();
  filter.type='lowpass';filter.Q.value=.55;gain.gain.value=0;source.loop=true;source.buffer=p.cyl?wave(a,p):noiseBuffer(a);source.connect(filter);filter.connect(gain);gain.connect(bus);
  road.loop=true;road.buffer=noiseBuffer(a);roadFilter.type='bandpass';roadFilter.frequency.value=520;roadFilter.Q.value=.45;roadGain.gain.value=0;road.connect(roadFilter);roadFilter.connect(roadGain);roadGain.connect(bus);source.start();road.start();v.ready=true;v.nodes=[source,filter,gain,road,roadFilter,roadGain];v.mute=()=>{gain.gain.setTargetAtTime(0,a.currentTime,.02);roadGain.gain.setTargetAtTime(0,a.currentTime,.02);};voices.add(v);
  function update(speed=0,throttle=0,turbo=false,enabled=true){
   if(v.disposed)return;const t=a.currentTime,dt=clamp(t-(v.lastAt||t-.016),.001,.12),s=Math.abs(Number(speed)||0),load=clamp(Math.abs(Number(throttle)||0),0,1),ratios=p.ratios||[0,10,18,27,38,52],old=v.gear;
   while(v.gear<ratios.length-1&&s>ratios[v.gear]+.8)v.gear++;while(v.gear>1&&s<ratios[v.gear-1]-1.4)v.gear--;
   if(old!==v.gear)v.shiftAt=t;const progress=clamp((s-ratios[v.gear-1])/Math.max(1,ratios[v.gear]-ratios[v.gear-1]),0,1),clutch=t-v.shiftAt<.17,freeRev=s<.8?load*.22:0;
   let target=p.rotor?p.idle+load*(p.max-p.idle):p.id==='balloon'?0:(p.idle||0)+(p.max-p.idle)*(progress*.81+load*.12+freeRev)+(turbo?260:0);
   target=clamp(target,0,p.max||0);v.rpm+=(target-v.rpm)*(1-Math.exp(-dt*(clutch?18:6)));v.rate=p.cyl?(v.rpm/(p.twoStroke||p.rotor?60:120))*source.buffer.duration:1;v.speed=s;v.load=load;v.lastAt=t;
   const settings=window.ArcadePlaySettings?.get?.()||{},volume=clamp(Number(settings.engineVolume??.7),0,1),audible=enabled&&!document.hidden&&a.state==='running',idle=.15,level=p.id==='balloon'?load*.16:p.id==='electric'?Math.min(.05,s*.003):p.rotor?.24:idle+load*.18;
   source.playbackRate.setTargetAtTime(Math.max(.03,v.rate),t,p.rotor?.25:.055);filter.frequency.setTargetAtTime(p.id==='electric'?180+Math.min(500,s*12):p.id==='balloon'?650:(p.tone||1300)*(.40+load*.60+progress*.17),t,.08);
   gain.gain.setTargetAtTime(audible?level*volume*(clutch?.62:1):0,t,.045);roadGain.gain.setTargetAtTime(audible&&p.id!=='balloon'?Math.min(.055,s/700)*volume:0,t,.12);roadFilter.frequency.setTargetAtTime(350+Math.min(650,s*15),t,.15);
  }
  return{update,dispose(){if(v.disposed)return;v.disposed=true;voices.delete(v);v.mute();for(const n of[source,road]){n.onended=()=>{for(const o of v.nodes)try{o.disconnect();}catch{}};n.stop(a.currentTime+.12);}},diagnostics:()=>({profile:v.profile,variant:v.variant,soundVersion:'combustion-20261027',ready:v.ready,gear:v.gear,rpm:Math.round(v.rpm),rate:v.rate,speed:v.speed,load:v.load})};
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)for(const v of voices)v.mute();});
 window.GameAudio=Object.freeze({...previous,vehicleVoice,preload:()=>Promise.resolve(true),effect:(name,...args)=>/rifle|smg|marksman|explosion|reload/.test(name)?false:previous.effect(name,...args),engineProfile:profile,diagnostics:()=>({...previous.diagnostics(),engineVersion:'combustion-20261027',activeEngines:voices.size,variants:[...voices].map(v=>v.variant)})});
})();

/* Civilian adapter for the shared real-recording mixer. Vehicle engine metadata
 * stays intact; the former per-ignition synthetic waveform is no longer used. */
(()=>{'use strict';
 const previous=window.GameAudio;if(!previous)return;const voices=new Map();
 function profile(model='',kind=''){
  const k=(model+' '+kind).toLowerCase();
  if(/bicycle|\bbike\b|skate/.test(k))return{id:'silent',variant:'bicicleta',cyl:0};
  if(/balloon|balão/.test(k))return{id:'balloon',variant:'queimador',cyl:0,silent:true};
  if(/electric|eletrico|elétrico|attivi|attive|metro|metrô|cableway|teleférico/.test(k))return{id:'electric',variant:'elétrico',cyl:0,max:6500,idle:0};
  if(/helicopter|helicóptero/.test(k))return{id:'helicopter',variant:'rotor',cyl:4,idle:360,max:410,rotor:true};
  if(/boat|lancha/.test(k))return{id:'marine',variant:'motor-de-popa',cyl:3,idle:800,max:5600,ratios:[0,28],tone:1100};
  if(/falcon|interceptor|sentinel|jet|jato/.test(k))return{id:'jet',variant:'turbina',cyl:0,idle:0,max:0,ratios:[0,120],tone:1800};
  if(/plane|avião|cargo/.test(k))return{id:'airplane',variant:'hélice',cyl:6,idle:750,max:2700,ratios:[0,42],tone:950};
  if(/mobylette|mobilete|moped/.test(k))return{id:'motorcycle',variant:'mobilete-2t',cyl:1,twoStroke:true,idle:1500,max:6500,ratios:[0,13,25],tone:1500};
  if(/hornet/.test(k))return{id:'motorcycle',variant:'quatro-cilindros-600',cyl:4,idle:1300,max:10500,ratios:[0,7,12,18,25,34,44],tone:2100};
  if(/bmwgs|bmw-gs/.test(k))return{id:'motorcycle',variant:'boxer-duplo',cyl:2,idle:1150,max:7500,ratios:[0,6,11,17,24,33,43],tone:1350};
  if(/factor|titan|xre|motorcycle|moto/.test(k))return{id:'motorcycle',variant:'monocilíndrica-125-150',cyl:1,idle:1400,max:8000,ratios:[0,4.5,8.5,13,18,25],tone:1300};
  if(/kart/.test(k))return{id:'motorcycle',variant:'kart',cyl:1,idle:1800,max:8500,ratios:[0,32],tone:1700};
  if(/ferrari/.test(k))return{id:'sport',variant:'v8-esportivo',cyl:8,idle:1000,max:8500,ratios:[0,10,17,24,32,43,58],tone:2200};
  if(/landau|maverick/.test(k))return{id:'sport',variant:'v8-clássico',cyl:8,idle:680,max:5200,ratios:[0,8,15,24,36],tone:1250};
  if(/opala|veraneio/.test(k))return{id:'sport',variant:'seis-em-linha',cyl:6,idle:700,max:5600,ratios:[0,8,15,24,36],tone:1200};
  if(/porsche/.test(k))return{id:'sport',variant:'boxer-seis',cyl:6,idle:900,max:7200,ratios:[0,10,18,27,38,52],tone:1700};
  if(/bmwm3/.test(k))return{id:'sport',variant:'seis-esportivo',cyl:6,idle:850,max:7600,ratios:[0,10,18,27,38,52],tone:1800};
  if(/fusca|kombi/.test(k))return{id:'classic',variant:'boxer-ar',cyl:4,idle:800,max:4500,ratios:[0,6,11,18,28],tone:1150};
  if(/truck|bus|scania|constellation|dinossauro|doubledeck|semi|fuel/.test(k))return{id:'heavy',variant:'diesel-seis',cyl:6,idle:600,max:2600,ratios:[0,4,7,11,16,23,32],tone:850};
  if(/hilux|amarok|s10/.test(k))return{id:'heavy',variant:/v6/.test(k)?'diesel-v6':'diesel-quatro',cyl:/v6/.test(k)?6:4,idle:750,max:3800,ratios:[0,6,11,17,25,35],tone:1050};
  if(/tcross/.test(k))return{id:'road',variant:'tres-turbo',cyl:3,idle:850,max:6000,ratios:[0,6,11,17,25,35]};
  return{id:'road',variant:/golf|jetta/.test(k)?'quatro-turbo':'quatro-brasileiro',cyl:4,idle:850,max:/golf|jetta/.test(k)?6500:5700,ratios:[0,6,11,17,25,35],tone:1400};
 }

 function vehicleVoice(model='',kind=''){
  const p=profile(model,kind),voice=previous.vehicleVoice?.(model,kind,p);
  if(!voice)return{update(){},dispose(){},diagnostics:()=>({profile:p.id,variant:p.variant,ready:false,silent:true,error:'Recorded engine bank unavailable'})};
  if(p.id!=='silent')voices.set(voice,p.variant);
  return{update:(...args)=>voice.update(...args),dispose:()=>{voices.delete(voice);voice.dispose();},diagnostics:()=>({...voice.diagnostics(),profile:p.id,variant:p.variant,soundVersion:'20261028-vehicle4'})};
 }
 window.GameAudio=Object.freeze({...previous,vehicleVoice,engineProfile:profile,effect:(name,...args)=>/rifle|smg|marksman|explosion|reload/.test(name)?false:previous.effect(name,...args),diagnostics:()=>({...previous.diagnostics(),engineVersion:previous.recordedVersion||'recorded-bank-unavailable',variants:[...voices.values()]})});
})();

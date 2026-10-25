/* Front-camera hand aiming. Explicit calibration binds the hand the player
 * shows, avoiding left/right ambiguity caused by mirrored camera images. */
(()=>{
'use strict';
const handRoot=new URL('./',document.currentScript?.src||document.baseURI);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const feature=points=>{
 if(!Array.isArray(points)||points.length!==21||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
 const wrist=points[0],index=points[5],middle=points[9],pinky=points[17],scale=Math.hypot(middle.x-wrist.x,middle.y-wrist.y);
 if(scale<.025||scale>.5)return null;
 return {x:(wrist.x+index.x+middle.x+pinky.x)/4,y:(wrist.y+index.y+middle.y+pinky.y)/4,
  dx:(index.x-wrist.x)/scale,dy:(index.y-wrist.y)/scale,scale,points};
};
class AimController{
 constructor(){this.calibration=0;this.reset();}
 reset(){this.calibration++;this.maxAge=300;this.state='calibrating';this.samples=[];this.neutral=null;this.label=null;this.last=null;this.lastSeen=-Infinity;this.aim={x:.5,y:.48,fresh:false,present:false,timestamp:0,twoHands:false,calibration:this.calibration,roll:0,source:'hand'};this.gripSince=0;}
 consume(result,now){const candidates=(result.landmarks||[]).map((p,i)=>({f:feature(p),label:result.handedness?.[i]?.[0]?.categoryName,score:result.handedness?.[i]?.[0]?.score??0})).filter(h=>h.f&&h.score>=.6);return this.consumeCandidates(candidates,now,'hand');}
 consumeObject(object,now){return this.consumeCandidates(object?[{f:object,label:'SelectedObject',score:object.confidence}]:[],now,'object');}
 consumeCandidates(candidates,now,source){
  this.aim.source=source;if(this.state==='calibrating'){
   if(candidates.length!==1){this.samples=[];this.aim.fresh=false;return this.aim;}const h=candidates[0],previous=this.samples.at(-1);
   if(previous&&(h.label!==previous.label||Math.hypot(h.f.x-previous.f.x,h.f.y-previous.f.y)>.055))this.samples=[];
   this.samples.push({f:h.f,label:h.label,time:now});if(this.samples.length>=9&&now-this.samples[0].time>=1000){const mean=k=>this.samples.reduce((s,h)=>s+h.f[k],0)/this.samples.length;this.neutral={x:mean('x'),y:mean('y'),dx:mean('dx'),dy:mean('dy')};this.label=h.label;this.last=h.f;this.lastSeen=now;this.state='ready';}return this.aim;
  }
  const matching=candidates.filter(h=>h.label===this.label&&(!this.last||Math.hypot(h.f.x-this.last.x,h.f.y-this.last.y)<.4)),hand=matching.sort((a,b)=>Math.hypot(a.f.x-this.last.x,a.f.y-this.last.y)-Math.hypot(b.f.x-this.last.x,b.f.y-this.last.y))[0];
  if(!hand){this.aim.present=false;this.aim.fresh=false;this.aim.twoHands=false;this.gripSince=0;return this.aim;}
  const f=hand.f,n=this.neutral,secondary=candidates.find(h=>h!==hand&&h.label!==this.label&&Math.hypot(h.f.x-f.x,h.f.y-f.y)<.42&&Math.abs(h.f.y-f.y)<.25);if(secondary){if(!this.gripSince)this.gripSince=now;}else this.gripSince=0;
  const twoHands=!!secondary&&now-this.gripSince>=200,smooth=1-Math.exp(-clamp(now-this.lastSeen,1,150)/(twoHands?100:65)),orientation=source==='object'?.6:.2;
  const tx=clamp(.5+(n.x-f.x)*1.85-(f.dx-n.dx)*orientation,.04,.96),ty=clamp(.48+(f.y-n.y)*1.8+(f.dy-n.dy)*orientation,.08,.88);
  this.aim.x+=(tx-this.aim.x)*smooth;this.aim.y+=(ty-this.aim.y)*smooth;this.last=f;this.lastSeen=now;Object.assign(this.aim,{fresh:true,present:true,timestamp:now,twoHands,roll:Number(f.angle)||0,calibration:this.calibration});return this.aim;
 }
 read(now){
  const age=now-this.lastSeen;
  if(age>this.maxAge)this.aim.fresh=false;
  // A delayed inference is not an observation that the hand disappeared.
  // Actions still stop as soon as fresh expires. Keep only the pending target
  // briefly, so two valid observations can acquire it on a slower device.
  // An actual empty result, blur or a longer stream interruption clears it.
  if(age>Math.max(900,this.maxAge*2))this.aim.present=false;
  return this.aim;
 }
}
const connections=[[0,1,2,3,4],[0,5,6,7,8],[5,9,10,11,12],[9,13,14,15,16],[13,17,18,19,20],[0,17]];
class CameraSession{
 constructor(game,options={}){this.game=game;this.options=options;this.source='hand';this.roi={x:.34,y:.27,w:.32,h:.43};this.host=options.host||window.System;this.paused=options.isPaused||(()=>this.host?.paused);this.controller=new AimController();this.disposed=false;this.busy=false;this.nextFrame=0;this.lastVideo=-1;this.serial=0;this.focused=true;this.buildUI();this.start();}
 buildUI(){
  const root=this.root=document.createElement('section');root.className='war-hand-camera calibrating';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Calibração da mão direita');
  root.innerHTML='<div class="war-hand-panel"><span class="war-hand-eyebrow">CÂMERA FRONTAL · MÃO DIREITA</span><h2>APONTE PARA MIRAR</h2><div class="war-hand-sources"><button type="button" data-hand="source-hand" aria-pressed="true">MÃO DIREITA</button><button type="button" data-hand="source-object" aria-pressed="false">OBJETO NA MÃO</button></div><canvas width="320" height="240" aria-label="Prévia espelhada da câmera frontal"></canvas><p class="war-hand-status" role="status">Carregando reconhecimento de mãos…</p><p class="war-hand-instruction">Mostre somente a mão direita, na posição em que vai jogar. Mantenha-a parada por um segundo. Depois, mova e vire a mão para mirar.</p><small>A câmera desaparece após calibrar. Você pode apoiar com a outra mão. Para um objeto, selecione seus detalhes na imagem e toque em CAPTURAR.</small><button type="button" data-hand="capture" hidden disabled>CAPTURAR OBJETO EM 3s</button><div class="war-hand-actions"><button type="button" data-hand="recalibrate">CALIBRAR NOVAMENTE</button><button type="button" data-hand="manual">USAR CONTROLES</button></div></div>';
  document.body.append(root);this.canvas=root.querySelector('canvas');this.status=root.querySelector('.war-hand-status');
  const press=(name,fn)=>{const el=root.querySelector('[data-hand="'+name+'"]');let at=-Infinity;el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(el.disabled)return;at=performance.now();fn();});el.addEventListener('click',()=>{if(!el.disabled&&performance.now()-at>650)fn();});};press('recalibrate',()=>this.recalibrate());press('manual',()=>this.manual());press('source-hand',()=>this.setSource('hand'));press('source-object',()=>this.setSource('object'));press('capture',()=>{this.captureAt=performance.now()+3000;this.needCapture=false;this.captureROI=true;this.release();this.controller.reset();});this.canvas.addEventListener('pointerdown',e=>{if(this.source!=='object'||this.controller.state!=='calibrating')return;e.preventDefault();const r=this.canvas.getBoundingClientRect(),x=1-(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;this.roi.x=clamp(x-this.roi.w/2,.03,.97-this.roi.w);this.roi.y=clamp(y-this.roi.h/2,.03,.97-this.roi.h);});
  this.release=()=>{this.game.handAim&&(this.game.handAim.fresh=false);this.controller.aim.fresh=false;this.controller.aim.present=false;this.controller.lastSeen=-Infinity;this.serial++;};
  this.blur=()=>{this.focused=false;this.release();};this.focus=()=>{this.focused=true;};
  window.addEventListener('blur',this.blur);window.addEventListener('focus',this.focus);window.addEventListener('arcade:release-inputs',this.release);
  this.orientation=()=>{if(['PLAYING','HAND_CALIBRATION'].includes(this.game.state))this.recalibrate();};window.addEventListener('orientationchange',this.orientation);
  this.visibility=()=>{if(document.hidden)this.release();};document.addEventListener('visibilitychange',this.visibility);
 }
 setSource(source){if(this.disposed||this.source===source)return;this.source=source;this.ready=false;this.busy=false;this.error=false;this.worker?.terminate();clearTimeout(this.loadTimer);cancelAnimationFrame(this.raf);this.captureAt=0;this.captureROI=false;this.needCapture=source==='object';this.recalibrate();this.root.querySelector('[data-hand="capture"]').hidden=source!=='object';for(const mode of ['hand','object'])this.root.querySelector('[data-hand="source-'+mode+'"]').setAttribute('aria-pressed',String(mode===source));this.start();}
 acceptAim(aim){this.game.handAim=aim;if(this.controller.state==='ready'&&this.game.state==='HAND_CALIBRATION'){this.game.state='PLAYING';this.game.lastTime=performance.now();this.root.classList.remove('calibrating');this.root.setAttribute('role','region');this.root.removeAttribute('aria-modal');}}
 async start(){
  try{
   if(!window.Worker)throw Error('Reconhecimento indisponível neste navegador.');
   const source=this.source;this.worker=new Worker(new URL(source==='object'?'object-tracker-worker.js':'hand-tracker-worker.js',handRoot));
   this.worker.onmessage=({data})=>{
    if(this.disposed||source!==this.source)return;
    if(data.type==='ready'){clearTimeout(this.loadTimer);this.ready=true;this.busy=false;this.delegate=data.delegate;this.status.textContent=source==='object'?'Toque nos detalhes do objeto e depois em CAPTURAR.':'Mostre somente a mão direita. Fique na posição de jogo.';this.root.querySelector('[data-hand="capture"]').disabled=false;}
    if(data.type==='recovering'){this.ready=false;this.busy=false;this.release();this.status.textContent=data.message;}
    if(data.type==='error')this.fail(data.message);
    if(data.type==='capture-error'){this.busy=false;this.frameSent=0;this.needCapture=true;this.captureROI=false;this.release();this.status.textContent=data.message;this.captureMessage=data.message;}
    if(data.type==='object'){
     this.busy=false;this.lastInferenceMs=performance.now()-data.timestamp;this.frameSent=0;this.lastObject={matches:data.matches,lost:!!data.lost,object:data.object};if(this.inflightSerial!==this.serial||document.hidden||this.paused()||!this.focused)return;
     this.controller.maxAge=Math.min(550,Math.max(300,this.lastInferenceMs*1.2+80));if(performance.now()-data.timestamp>this.controller.maxAge){this.release();return;}
     this.acceptAim(this.controller.consumeObject(data.object,data.timestamp));if(data.lost){this.recalibrate();this.captureMessage='Objeto perdido. Selecione e capture novamente.';}
    }
    if(data.type==='result'&&source==='hand'){
     this.busy=false;this.lastInferenceMs=performance.now()-data.timestamp;this.lastComputeMs=data.inferenceMs;this.frameSent=0;this.lastHandCount=data.landmarks?.length||0;if(this.inflightSerial!==this.serial||document.hidden||this.paused()||!this.focused)return;
     // Inference latency must not turn an old camera image into a valid shot.
     this.controller.maxAge=Math.min(550,Math.max(300,this.lastInferenceMs*1.2+80));
     if(performance.now()-data.timestamp>(this.controller.state==='calibrating'?1800:this.controller.maxAge)){this.release();return;}
     const aim=this.controller.consume(data,data.timestamp);this.landmarks=data.landmarks;this.acceptAim(aim);
     if(this.controller.state==='ready'&&this.game.state==='HAND_CALIBRATION'){
      this.game.state='PLAYING';this.game.lastTime=performance.now();this.root.classList.remove('calibrating');this.root.setAttribute('role','region');this.root.removeAttribute('aria-modal');
     }
    }
   };
   this.worker.onerror=()=>this.fail('Não foi possível iniciar o reconhecimento.');
   this.loadTimer=setTimeout(()=>this.fail('O reconhecimento demorou para carregar. Tente calibrar novamente.'),60000);
   this.worker.postMessage({type:'init',delegate:this.forceCPU?'CPU':undefined});this.tick();
  }catch(error){this.fail(error.message);}
 }
 tick(){
  if(this.disposed)return;this.raf=requestAnimationFrame(()=>this.tick());
  const now=performance.now(),video=this.host?.video;
  if(document.hasFocus?.())this.focused=true;
  const paused=document.hidden||this.paused()||!this.focused;
  if(this.busy&&this.frameSent&&now-this.frameSent>7000){this.fail('O reconhecimento parou de responder.');return;}
  if(video&&!video.classList.contains('war-camera-source')){video.classList.add('war-camera-source');if(!video.isConnected)document.body.append(video);}
  if(video?.paused&&!paused&&video.srcObject?.active&&!this.videoRestart){this.videoRestart=true;Promise.resolve(video.play()).catch(()=>this.fail('A câmera foi interrompida.')).finally(()=>this.videoRestart=false);}
  this.root.hidden=!['PLAYING','HAND_CALIBRATION'].includes(this.game.state);
  this.game.handAim=this.controller.read(now);
  if(video?.readyState>=2&&!paused){
   const ctx=this.canvas.getContext('2d',{willReadFrequently:true});ctx.save();
   const vw=video.videoWidth||320,vh=video.videoHeight||240,fit=Math.min(320/vw,240/vh),dw=vw*fit,dh=vh*fit;
   ctx.fillStyle='#102732';ctx.fillRect(0,0,320,240);ctx.drawImage(video,0,0,vw,vh,(320-dw)/2,(240-dh)/2,dw,dh);
   const due=this.ready&&!this.busy&&now>=this.nextFrame&&video.currentTime!==this.lastVideo&&(this.source!=='object'||!this.needCapture&&now>=(this.captureAt||0));
   const rawFrame=due?ctx.getImageData(0,0,320,240):null;
   if(this.source==='object'&&this.controller.state==='calibrating'){const r=this.roi;ctx.strokeStyle='#ffd887';ctx.lineWidth=3;ctx.strokeRect(r.x*320,r.y*240,r.w*320,r.h*240);}
   ctx.lineWidth=2;ctx.strokeStyle='#8bf4c2';for(const hand of this.source==='hand'?this.landmarks||[]:[])for(const line of connections){ctx.beginPath();line.forEach((i,j)=>j?ctx.lineTo(hand[i].x*320,hand[i].y*240):ctx.moveTo(hand[i].x*320,hand[i].y*240));ctx.stroke();}ctx.restore();
   if(due){
    this.busy=true;this.frameSent=now;this.lastVideo=video.currentTime;this.nextFrame=now+80;this.inflightSerial=this.serial;
    try{
     const pixels=rawFrame;const roi=this.source==='object'&&this.captureROI?{x:this.roi.x*320,y:this.roi.y*240,w:this.roi.w*320,h:this.roi.h*240}:undefined;this.captureROI=false;this.captureAt=0;this.worker.postMessage({type:'frame',pixels:pixels.data.buffer,width:320,height:240,timestamp:now,roi},[pixels.data.buffer]);
    }catch{this.busy=false;this.release();}
   }
  }
  if(this.ready&&!this.error){
   if(this.source==='object'&&this.controller.state==='calibrating')this.status.textContent=this.captureAt>now?'Captura em '+Math.ceil((this.captureAt-now)/1000)+'… segure o objeto.':this.needCapture?this.captureMessage||'Toque no objeto e depois em CAPTURAR.':this.controller.samples.length?'Mantenha o objeto parado para calibrar…':'Reconhecendo os detalhes selecionados…';
   else if(this.controller.state==='calibrating')this.status.textContent=this.controller.samples.length?'Segure a mão direita parada… '+Math.min(100,Math.round((now-(this.controller.samples[0]?.time||now))/10))+'%':'Mostre somente a mão direita para calibrar.';
   else this.status.textContent=this.game.handAim.fresh?(this.source==='object'?'OBJETO · TIRO AO MIRAR NO ALVO':this.game.handAim.twoHands?'DUAS MÃOS · MIRA ESTABILIZADA':'MÃO DIREITA · TIRO AO MIRAR NO ALVO'):this.game.handAim.present?'RASTREAMENTO PAUSADO · TIRO PAUSADO':'MÃO NÃO ENCONTRADA · TIRO PAUSADO';
   this.root.classList.toggle('hand-lost',!this.game.handAim.fresh);
  }
 }
 fail(message){this.error=true;this.ready=false;this.busy=false;this.status.textContent=message+' Toque em CALIBRAR NOVAMENTE ou USAR CONTROLES.';this.release();clearTimeout(this.loadTimer);this.worker?.terminate();if(['PLAYING','HAND_CALIBRATION'].includes(this.game.state)){this.game.state='HAND_CALIBRATION';this.root.classList.add('calibrating');this.root.setAttribute('role','dialog');this.root.setAttribute('aria-modal','true');}}
 recalibrate(){
  if(!['PLAYING','HAND_CALIBRATION'].includes(this.game.state))return;
  this.release();if(this.source==='object'){this.needCapture=true;this.captureAt=0;this.captureROI=false;this.captureMessage='';}this.controller.reset();this.game.handAim=this.controller.aim;this.game.handLock=null;this.game.state='HAND_CALIBRATION';this.root.classList.add('calibrating');this.root.setAttribute('role','dialog');this.root.setAttribute('aria-modal','true');
  if(this.error){this.error=false;this.forceCPU=true;this.worker?.terminate();cancelAnimationFrame(this.raf);this.start();}
 }
 manual(){
  const game=this.game;this.dispose();game.handSession=null;game.handAim=null;if(['PLAYING','HAND_CALIBRATION'].includes(game.state))game.state='PLAYING';game.lastTime=performance.now();
  if(this.options.onManual){this.options.onManual();return;}
  window.ArcadeControls?.setMode('controls');const video=this.host?.video;video?.srcObject?.getTracks?.().forEach(t=>t.stop());if(video)video.srcObject=null;
  if(window.System)window.System.currentCameraMode=null;window.ArcadeControls?.activate(window.System?.activeGame);
 }
 dispose(){if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.raf);clearTimeout(this.loadTimer);this.worker?.terminate();this.root.remove();this.release();window.removeEventListener('blur',this.blur);window.removeEventListener('focus',this.focus);window.removeEventListener('orientationchange',this.orientation);window.removeEventListener('arcade:release-inputs',this.release);document.removeEventListener('visibilitychange',this.visibility);}
}
window.WarHandControl={AimController,feature,start:(game,options)=>new CameraSession(game,options)};
})();

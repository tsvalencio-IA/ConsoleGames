/* Front-camera hand aiming. Explicit calibration binds the hand the player
 * shows, avoiding left/right ambiguity caused by mirrored camera images. */
(()=>{
'use strict';
const handRoot=new URL('./',document.currentScript?.src||document.baseURI);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const feature=points=>{
 if(!Array.isArray(points)||points.length!==21||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
 const wrist=points[0],index=points[5],middle=points[9],pinky=points[17],scale=Math.hypot(middle.x-wrist.x,middle.y-wrist.y);
 if(scale<.012||scale>.5)return null;
 return {x:(wrist.x+index.x+middle.x+pinky.x)/4,y:(wrist.y+index.y+middle.y+pinky.y)/4,
  dx:(index.x-wrist.x)/scale,dy:(index.y-wrist.y)/scale,scale,points};
};
class AimController{
 constructor(){this.calibration=0;this.reset();}
 setLatency(ms,postureMs=0){const latency=Number.isFinite(ms)?Math.max(0,ms):0,posture=Number.isFinite(postureMs)?Math.max(0,postureMs):0;
  // lastSeen is capture time. Keep one inference cycle plus the next result
  // continuous, while retaining the existing absolute 550 ms freshness cap.
  this.maxAge=Math.min(550,Math.max(300,latency*2+100));
  // Retain only acquisition memory across the two serial detectors. An old
  // frame still cannot move or fire, and an empty detection clears it at once.
  this.pendingAge=Math.max(900,this.maxAge*2,posture?Math.min(2000,latency*2+posture+150):0);return this.maxAge;
 }
 reset(){this.calibration++;this.maxAge=300;this.pendingAge=900;this.state='calibrating';this.samples=[];this.neutral=null;this.label=null;this.last=null;this.lastSeen=-Infinity;this.aim={x:.5,y:.48,fresh:false,present:false,timestamp:0,twoHands:false,calibration:this.calibration,roll:0,source:'hand'};this.gripSince=0;}
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
  const twoHands=!!secondary&&now-this.gripSince>=200,smooth=1-Math.exp(-clamp(now-this.lastSeen,1,150)/(source==='object'?35:twoHands?100:65)),orientation=source==='object'?0:.2;
  const mapping=source==='object'?this.objectMapping:null,gain=source==='object'?(this.objectGain||1):1,dx=f.x-n.x,dy=f.y-n.y;
  const tx=clamp(.5+(mapping?mapping.xx*dx+mapping.xy*dy:-dx*1.85-(f.dx-n.dx)*orientation)*gain,.04,.96),ty=clamp(.48+(mapping?mapping.yx*dx+mapping.yy*dy:dy*1.8+(f.dy-n.dy)*orientation)*gain,.08,.88);
  this.aim.x+=(tx-this.aim.x)*smooth;this.aim.y+=(ty-this.aim.y)*smooth;this.last=f;this.lastSeen=now;Object.assign(this.aim,{fresh:true,present:true,timestamp:now,twoHands,roll:Number(f.angle)||0,calibration:this.calibration});return this.aim;
 }
 read(now){
  const age=now-this.lastSeen;
  if(age>this.maxAge)this.aim.fresh=false;
  // A delayed inference is not an observation that the hand disappeared.
  // Actions still stop as soon as fresh expires. Keep only the pending target
  // briefly, so two valid observations can acquire it on a slower device.
  // An actual empty result, blur or a longer stream interruption clears it.
  if(age>Math.max(900,this.maxAge*2,this.pendingAge||0))this.aim.present=false;
  return this.aim;
 }
}
const connections=[[0,1,2,3,4],[0,5,6,7,8],[5,9,10,11,12],[9,13,14,15,16],[13,17,18,19,20],[0,17]];
class CameraSession{
 constructor(game,options={}){this.game=game;this.options=options;this.requiresBody=false;this.autoAdvance=true;try{this.autoAdvance=localStorage.getItem('ot_war_camera_advance_v1')!=='steps';}catch{}this.source='hand'; // Disregard any saved object mode; WAR now uses the person only.this.needCapture=this.source==='object';this.roi={x:.34,y:.27,w:.32,h:.43};this.host=options.host||window.System;this.paused=options.isPaused||(()=>this.host?.paused);this.controller=new AimController();this.disposed=false;this.busy=false;this.nextFrame=0;this.lastVideo=-1;this.serial=0;this.focused=true;this.buildUI();this.start();}
 buildUI(){
  const root=this.root=document.createElement('section');root.className='war-hand-camera calibrating';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Calibração do corpo e da mão direita');
  root.innerHTML='<div class="war-hand-panel"><span class="war-hand-eyebrow">CÂMERA FRONTAL · CORPO E MÃOS</span><h2>GIRE E APONTE PARA MIRAR</h2><div class="war-hand-sources" hidden><button type="button" data-hand="source-hand" aria-pressed="true">MÃO DIREITA</button><button type="button" data-hand="source-object" aria-pressed="false">BRINQUEDO / OBJETO</button></div><canvas width="320" height="240" aria-label="Prévia espelhada da câmera frontal"></canvas><p class="war-hand-status" role="status">Carregando reconhecimento de mãos…</p><p data-war-body-status role="status">Preparando o corpo…</p><p class="war-hand-instruction">Enquadre mão direita, ombros e quadril. Fique parado para calibrar. Corpo e mãos controlam postura e visão; inclua os pés para dar passos.</p><small>A câmera desaparece após calibrar. Você pode apoiar com a outra mão. Para um objeto, selecione seus detalhes na imagem e toque em CAPTURAR.</small><div data-hand-object-options hidden><p>Arraste uma caixa nos detalhes do brinquedo e segure-o na posição de mira.</p><label><input type="checkbox" data-hand-remember> Lembrar este brinquedo neste aparelho</label><button type="button" data-hand="reuse" hidden disabled>USAR BRINQUEDO CADASTRADO</button></div><button type="button" data-hand="capture" hidden disabled>CAPTURAR OBJETO EM 3s</button><div class="war-hand-actions"><button type="button" data-hand="recalibrate">CALIBRAR NOVAMENTE</button><button type="button" data-hand="manual">USAR CONTROLES</button></div></div>';
  document.body.append(root);this.canvas=root.querySelector('canvas');this.status=root.querySelector('.war-hand-status');
  root.querySelector('h2').textContent='CALIBRE SUA MÃO DIREITA';root.querySelector('.war-hand-sources').style.setProperty('display','none','important');root.querySelector('.war-hand-instruction').textContent='Apoie o celular e mostre a mão direita aberta na câmera frontal, na posição de jogo. Mantenha-a parada por um segundo e depois aponte. Você pode jogar sem enquadrar os ombros.';root.querySelector('small').textContent='Os movimentos do tronco, como agachar e girar, ficam disponíveis quando a câmera também consegue ver o corpo. A câmera de calibração desaparece ao iniciar; o disparo só acontece ao mirar num adversário.';
  const movement=document.createElement('button');movement.type='button';movement.className='war-camera-movement';const updateMovement=()=>{movement.textContent=this.autoAdvance?'AVANÇO ASSISTIDO · LIGADO':'MOVIMENTO POR PASSOS';movement.setAttribute('aria-pressed',String(this.autoAdvance));};updateMovement();movement.onclick=()=>{this.autoAdvance=!this.autoAdvance;try{localStorage.setItem('ot_war_camera_advance_v1',this.autoAdvance?'assisted':'steps');}catch{}updateMovement();};root.querySelector('.war-hand-actions').before(movement);
  const press=(name,fn)=>{const el=root.querySelector('[data-hand="'+name+'"]');let at=-Infinity;el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(el.disabled)return;at=performance.now();fn();});el.addEventListener('click',()=>{if(!el.disabled&&performance.now()-at>650)fn();});};press('recalibrate',()=>this.recalibrate());press('manual',()=>this.manual());press('source-hand',()=>this.setSource('hand'));press('source-object',()=>this.setSource('object'));press('capture',()=>{if(this.cameraRegistration?.switching)return;this.cameraRegistration?.captureStarted();this.objectTools?.resetCapture();this.captureMessage='';this.controller.objectMapping=null;this.captureAt=performance.now()+3000;this.needCapture=false;this.captureROI=true;this.release();this.controller.reset();});press('reuse',()=>{try{const template=JSON.parse(localStorage.getItem('ot_war_toy_template_v1'));if(!template)throw Error();this.roi={x:template.roi.x/320,y:template.roi.y/240,w:template.roi.w/320,h:template.roi.h/240};this.worker.postMessage({type:'load-template',template});this.objectTools?.load(template);this.controller.reset();this.captureAt=performance.now()+3000;this.needCapture=false;this.captureROI=false;}catch{this.captureMessage='Capture o brinquedo novamente.';}});
  const point=e=>this.canvasPoint(e.clientX,e.clientY);this.canvas.style.touchAction='none';this.canvas.addEventListener('pointerdown',e=>{if(this.source!=='object'||this.controller.state!=='calibrating'||this.cameraRegistration?.switching)return;e.preventDefault();this.roiStart={...point(e),id:e.pointerId};this.canvas.setPointerCapture(e.pointerId);});this.canvas.addEventListener('pointermove',e=>{if(this.roiStart?.id!==e.pointerId)return;e.preventDefault();const p=point(e),a=this.roiStart,w=Math.abs(p.x-a.x),h=Math.abs(p.y-a.y);if(w<.075||h<.10)return;this.roi={x:Math.min(p.x,a.x),y:Math.min(p.y,a.y),w:Math.min(.5,w),h:Math.min(2/3,h)};this.roi.w=Math.min(this.roi.w,.97-this.roi.x);this.roi.h=Math.min(this.roi.h,.96-this.roi.y);a.moved=true;});this.canvas.addEventListener('pointerup',e=>{if(this.roiStart?.id!==e.pointerId)return;const a=this.roiStart,p=point(e);if(!a.moved){this.roi.x=clamp(p.x-this.roi.w/2,.03,.97-this.roi.w);this.roi.y=clamp(p.y-this.roi.h/2,.04,.96-this.roi.h);}this.roiStart=null;this.canvas.releasePointerCapture(e.pointerId);});this.canvas.addEventListener('pointercancel',()=>{this.roiStart=null;});
  try{this.savedToy=!!JSON.parse(localStorage.getItem('ot_war_toy_template_v1'))?.version;}catch{}this.root.querySelector('[data-hand="reuse"]').hidden=!this.savedToy;this.root.querySelector('[data-hand-remember]').onchange=e=>{if(!e.target.checked){try{localStorage.removeItem('ot_war_toy_template_v1');}catch{}this.savedToy=false;this.root.querySelector('[data-hand="reuse"]').hidden=true;}};
  this.release=()=>{this.game.handAim&&(this.game.handAim.fresh=false);this.controller.aim.fresh=false;this.controller.aim.present=false;this.controller.lastSeen=-Infinity;this.game.handLock=null;this.bodySession?.release();this.serial++;};
  this.blur=()=>{this.focused=false;this.release();};this.focus=()=>{this.focused=true;};
  window.addEventListener('blur',this.blur);window.addEventListener('focus',this.focus);window.addEventListener('arcade:release-inputs',this.release);
  this.orientation=()=>{if(['PLAYING','HAND_CALIBRATION'].includes(this.game.state))this.recalibrate();};window.addEventListener('orientationchange',this.orientation);
  this.visibility=()=>{if(document.hidden)this.release();};document.addEventListener('visibilitychange',this.visibility);this.objectTools=window.WarObjectTraining?.attach(this);this.cameraRegistration=window.WarObjectCamera?.attach(this);
 }
 setSource(source){if(source!=='hand'||this.disposed||this.source===source)return;this.source=source;try{localStorage.setItem('ot_war_camera_source_v1',source);}catch{}this.ready=false;this.busy=false;this.error=false;this.worker?.terminate();clearTimeout(this.loadTimer);cancelAnimationFrame(this.raf);this.captureAt=0;this.captureROI=false;this.needCapture=source==='object';this.lastTemplate=null;this.objectTools?.sourceChanged();this.recalibrate();this.cameraRegistration?.sourceChanged();this.root.querySelector('[data-hand="capture"]').hidden=source!=='object';this.root.querySelector('[data-hand-object-options]').hidden=source!=='object';for(const mode of ['hand','object'])this.root.querySelector('[data-hand="source-'+mode+'"]').setAttribute('aria-pressed',String(mode===source));this.start();}
 restartObjectRecognition(){if(this.source!=='object')return;if(this.worker)this.worker.onmessage=null;this.worker?.terminate();this.ready=false;this.busy=false;this.frameSent=0;this.error=false;clearTimeout(this.loadTimer);cancelAnimationFrame(this.raf);this.start();}
 canvasPoint(x,y){if(window.WarObjectCamera)return window.WarObjectCamera.canvasPoint(this.canvas,x,y,this.cameraRegistration?.mirrored!==false);const r=this.canvas.getBoundingClientRect();return{x:clamp(1-(x-r.left)/r.width,0,1),y:clamp((y-r.top)/r.height,0,1)};}
 acceptAim(aim){this.game.handAim=aim;this.finishCalibration();}
 finishCalibration(){if(this.cameraRegistration?.blocksPlaying||this.objectTools?.blocking)return false;if(this.game.state!=='HAND_CALIBRATION'||this.controller.state!=='ready'||!this.game.handAim?.fresh)return false;this.game.state='PLAYING';this.game.lastTime=performance.now();this.root.classList.remove('calibrating');this.root.setAttribute('role','region');this.root.removeAttribute('aria-modal');return true;}
 async start(){
  try{
   if(!window.Worker)throw Error('Reconhecimento indisponível neste navegador.');
   if(!this.bodySession&&window.WarBodyControl)this.bodySession=window.WarBodyControl.start(this.game);
   const source='hand';this.worker=new Worker(new URL('hand-tracker-worker.js',handRoot));
   this.worker.onmessage=({data})=>{
    if(this.disposed||source!==this.source)return;
    if(data.type==='ready'){clearTimeout(this.loadTimer);this.ready=true;this.busy=false;this.delegate=data.delegate;this.status.textContent='Mostre a mão direita aberta e fique parado por um segundo. Os ombros não são obrigatórios.';this.root.querySelector('[data-hand="capture"]').disabled=false;this.root.querySelector('[data-hand="reuse"]').disabled=false;this.cameraRegistration?.sync();}
    if(data.type==='recovering'){this.ready=false;this.busy=false;this.release();this.status.textContent=data.message;}
    if(data.type==='error')this.fail(data.message);
    if(data.type==='capture-error'){this.busy=false;this.frameSent=0;this.objectTools?.resetCapture(data.message);this.needCapture=true;this.captureROI=false;this.release();this.status.textContent=data.message;this.captureMessage=data.message;}
    if(data.type==='template'){this.objectTools?.remember(data.template);this.objectTools?.axisAccepted();return;}
    if(data.type==='object'){
     this.busy=false;this.lastInferenceMs=performance.now()-data.timestamp;this.frameSent=0;this.lastObject={matches:data.matches,quality:data.quality,probe:data.probe,lost:!!data.lost,object:data.object};if(this.inflightSerial!==this.serial||document.hidden||this.paused()||!this.focused)return;
     this.controller.setLatency(this.lastInferenceMs,Number(this.bodySession?.computeMs||0));if(performance.now()-data.timestamp>(this.controller.state==='calibrating'?1800:this.controller.maxAge)){this.release();return;}
     if(data.template){this.objectTools?.remember(data.template);this.objectTools?.markAxis();return;}
     this.objectTools?.object(data.object,data.timestamp);this.acceptAim(this.controller.consumeObject(data.object,data.timestamp));
    }
    if(data.type==='result'&&source==='hand'){
     this.busy=false;this.lastInferenceMs=performance.now()-data.timestamp;this.lastComputeMs=data.inferenceMs;this.frameSent=0;this.lastHandCount=data.landmarks?.length||0;if(this.inflightSerial!==this.serial||document.hidden||this.paused()||!this.focused)return;
     // Inference latency must not turn an old camera image into a valid shot.
     this.controller.setLatency(this.lastInferenceMs,Number(this.bodySession?.computeMs||0));
     if(performance.now()-data.timestamp>(this.controller.state==='calibrating'?1800:this.controller.maxAge)){this.release();return;}
     const crop=this.inflightCrop;if(crop)data.landmarks=(data.landmarks||[]).map(hand=>hand.map(p=>({...p,x:crop.x+p.x*crop.w,y:crop.y+p.y*crop.h,z:(p.z||0)*crop.w})));const aim=this.controller.consume(data,data.timestamp);this.landmarks=data.landmarks;this.acceptAim(aim);
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
  const handDue=!this.cameraRegistration?.switching&&this.ready&&!this.busy&&!this.objectTools?.frozen&&video?.readyState>=2&&now>=this.nextFrame&&video.currentTime!==this.lastVideo&&(this.source!=='object'||!this.needCapture&&now>=(this.captureAt||0));
  this.bodySession?.tick(video,now,paused||!!this.cameraRegistration?.blocksBody,Number(this.lastInferenceMs||0),this.busy,handDue);this.game.handAim=this.controller.read(now);if(this.source==='object'&&this.game.bodyPose?.fresh)this.game.handAim.twoHands=!!this.game.bodyPose.twoHands;if(!paused)this.finishCalibration();
  // Unavailable body tracking never takes the player back to calibration.
  if(video?.readyState>=2&&!paused){
   const ctx=this.canvas.getContext('2d',{willReadFrequently:true});ctx.save();
   const vw=video.videoWidth||320,vh=video.videoHeight||240,fit=Math.min(320/vw,240/vh),dw=vw*fit,dh=vh*fit;
   const due=handDue&&!this.bodySession?.busy;
   const preview=this.root.classList.contains('calibrating');if(due||preview){ctx.fillStyle='#102732';ctx.fillRect(0,0,320,240);ctx.drawImage(video,0,0,vw,vh,(320-dw)/2,(240-dh)/2,dw,dh);}
   let rawFrame=null,crop=null;if(due){crop=this.source==='hand'&&this.game.bodyPose?.fresh?window.WarBodyControl.handRegion(this.bodySession.controller.landmarks,vw,vh):null;if(crop){this.sensorCanvas??=document.createElement('canvas');this.sensorCanvas.width=this.sensorCanvas.height=256;const sensor=this.sensorCanvas.getContext('2d',{willReadFrequently:true});sensor.drawImage(video,crop.x*vw,crop.y*vh,crop.w*vw,crop.h*vh,0,0,256,256);rawFrame=sensor.getImageData(0,0,256,256);}else rawFrame=ctx.getImageData(0,0,320,240);}
   if(preview&&!this.cameraRegistration?.blocksBody){const body=this.bodySession?.controller,points=body?.landmarks;if(points&&now-body.lastInput<=1200){const xy=p=>({x:(320-dw)/2+p.x*dw,y:(240-dh)/2+p.y*dh});ctx.strokeStyle='#6de2f0';ctx.lineWidth=2;for(const[a,b]of[[11,12],[11,23],[12,24],[23,24],[11,13],[13,15],[12,14],[14,16],[23,25],[25,27],[24,26],[26,28]]){if((points[a]?.visibility??0)<.55||(points[b]?.visibility??0)<.55)continue;const p=xy(points[a]),q=xy(points[b]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}}}
   if(this.source==='object'&&this.controller.state==='calibrating'){const r=this.roi;ctx.strokeStyle='#ffd887';ctx.lineWidth=3;ctx.strokeRect(r.x*320,r.y*240,r.w*320,r.h*240);}
   ctx.lineWidth=2;ctx.strokeStyle='#8bf4c2';for(const hand of this.source==='hand'?this.landmarks||[]:[])for(const line of connections){ctx.beginPath();line.forEach((i,j)=>j?ctx.lineTo(hand[i].x*320,hand[i].y*240):ctx.moveTo(hand[i].x*320,hand[i].y*240));ctx.stroke();}if(preview&&this.source==='object')this.objectTools?.draw(ctx);ctx.restore();
   if(due){
    this.busy=true;this.frameSent=now;this.lastVideo=video.currentTime;this.nextFrame=now+80;this.inflightSerial=this.serial;this.inflightCrop=crop||{x:-(320-dw)/(2*dw),y:-(240-dh)/(2*dh),w:320/dw,h:240/dh};
    try{
     const pixels=rawFrame;const roi=this.source==='object'&&this.captureROI?{x:this.roi.x*320,y:this.roi.y*240,w:this.roi.w*320,h:this.roi.h*240}:undefined;if(roi)this.objectTools?.captured(rawFrame);this.captureROI=false;this.captureAt=0;this.worker.postMessage({type:'frame',pixels:pixels.data.buffer,width:crop?256:320,height:crop?256:240,timestamp:now,roi,referenceTemplate:roi&&this.cameraRegistration?.facing==='user'?this.cameraRegistration.reference:undefined},[pixels.data.buffer]);
    }catch{this.busy=false;this.release();}
   }
  }
  const bodyStatus=this.root.querySelector('[data-war-body-status]');if(bodyStatus){const state=this.bodySession?.status;bodyStatus.dataset.ready=String(!!this.game.bodyPose?.fresh);const reason=this.bodySession?.controller.reason,progress=Math.min(100,Math.round((this.bodySession?.controller.samples.length||0)/6*100));bodyStatus.textContent=this.cameraRegistration?.blocksBody?'CADASTRO TRASEIRO · Corpo pausado até voltar à frontal.':state==='unavailable'?'CORPO INDISPONÍVEL · Toque em CALIBRAR NOVAMENTE para tentar de novo.':state==='loading'?'CORPO · Carregando reconhecimento…':this.game.bodyPose?.fresh?'✓ CORPO CALIBRADO · Agache e gire.':this.bodySession?.controller.neutral?'CORPO FORA DO QUADRO · MIRA COM A MÃO CONTINUA.':reason==='closer'?'CORPO · Aproxime-se um pouco.':reason==='farther'?'CORPO · Afaste-se um pouco.':reason==='hold-still'?'CORPO · Fique parado… '+progress+'%':'CORPO OPCIONAL · ENQUADRE O TRONCO PARA AGACHAR E GIRAR.';}
  if(this.ready&&!this.error){
   if(this.source==='object'&&this.controller.state==='calibrating')this.status.textContent=this.objectTools?.progress(now)||'Selecione os detalhes do brinquedo e toque em CAPTURAR.';
   else if(this.controller.state==='calibrating')this.status.textContent=this.controller.samples.length?'Segure a mão direita parada… '+Math.min(100,Math.round((now-(this.controller.samples[0]?.time||now))/10))+'%':'MÃO · Abra a mão direita na altura do peito, dentro da imagem.';
   else this.status.textContent=this.game.handAim.fresh?(this.game.state==='HAND_CALIBRATION'?'✓ MÃO DIREITA CALIBRADA · INICIANDO PARTIDA.':this.source==='object'?'OBJETO · TIRO AO MIRAR NO ALVO':this.game.handAim.twoHands?'DUAS MÃOS · MIRA ESTABILIZADA':'MÃO DIREITA · TIRO AO MIRAR NO ALVO'):this.game.handAim.present?'RASTREAMENTO PAUSADO · TIRO PAUSADO':this.source==='object'?'OBJETO FORA DE VISTA · VOLTE À POSIÇÃO CALIBRADA':'MÃO NÃO ENCONTRADA · TIRO PAUSADO';
   this.root.classList.toggle('hand-lost',!this.game.handAim.fresh);
  }
 }
 fail(message){this.error=true;this.ready=false;this.busy=false;this.status.textContent=message+' Toque em CALIBRAR NOVAMENTE ou USAR CONTROLES.';this.release();clearTimeout(this.loadTimer);this.worker?.terminate();if(['PLAYING','HAND_CALIBRATION'].includes(this.game.state)){this.game.state='HAND_CALIBRATION';this.root.classList.add('calibrating');this.root.setAttribute('role','dialog');this.root.setAttribute('aria-modal','true');}}
 recalibrate({reuseObject=false}={}){
  if(!['PLAYING','HAND_CALIBRATION'].includes(this.game.state))return;
  this.release();this.bodySession?.reset();if(this.source==='object'){if(reuseObject){this.objectTools?.cancel(false);if(this.objectTools)this.objectTools.frozen=false;}else this.objectTools?.resetCapture();this.needCapture=!this.lastTemplate;this.captureAt=0;this.captureROI=false;this.captureMessage='';}this.controller.reset();this.game.handAim=this.controller.aim;this.game.handLock=null;this.game.state='HAND_CALIBRATION';this.root.classList.add('calibrating');this.root.setAttribute('role','dialog');this.root.setAttribute('aria-modal','true');
  if(this.error){this.error=false;this.forceCPU=true;this.worker?.terminate();cancelAnimationFrame(this.raf);this.start();}
 }
 manual(){
  const game=this.game;this.dispose();game.handSession=null;game.handAim=null;if(['PLAYING','HAND_CALIBRATION'].includes(game.state))game.state='PLAYING';game.lastTime=performance.now();
  if(this.options.onManual){this.options.onManual();return;}
  window.ArcadeControls?.setMode('controls');const video=this.host?.video;video?.srcObject?.getTracks?.().forEach(t=>t.stop());if(video)video.srcObject=null;
  if(window.System)window.System.currentCameraMode=null;window.ArcadeControls?.activate(window.System?.activeGame);
 }
 dispose(){if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.raf);clearTimeout(this.loadTimer);this.cameraRegistration?.dispose();this.worker?.terminate();this.bodySession?.dispose();this.root.remove();this.release();window.removeEventListener('blur',this.blur);window.removeEventListener('focus',this.focus);window.removeEventListener('orientationchange',this.orientation);window.removeEventListener('arcade:release-inputs',this.release);document.removeEventListener('visibilitychange',this.visibility);}
}
window.WarHandControl={AimController,feature,start:(game,options)=>new CameraSession(game,options)};
})();

/* Rear camera is a registration aid. Body-controlled play stays on the front
 * camera and requires an explicit front-view registration at playing distance. */
(()=>{'use strict';
const stop=stream=>stream?.getTracks?.().forEach(track=>track.stop());
function canvasPoint(canvas,clientX,clientY,mirrored=true){
 const r=canvas.getBoundingClientRect(),scale=Math.min(r.width/canvas.width,r.height/canvas.height),w=canvas.width*scale,h=canvas.height*scale;
 const x=(clientX-r.left-(r.width-w)/2)/w,y=(clientY-r.top-(r.height-h)/2)/h,clamp=v=>Math.max(0,Math.min(1,v));
 return{x:clamp(mirrored?1-x:x),y:clamp(y)};
}
class Registration{
 constructor(session){
  this.s=session;this.facing='user';this.epoch=0;this.closed=false;this.switching=false;this.frontPending=false;this.reference=null;
  this.button=document.createElement('button');this.button.type='button';this.button.dataset.cameraRegistration='rear';this.button.textContent='CADASTRAR PELA TRASEIRA';
  this.hint=document.createElement('p');this.hint.dataset.cameraRegistration='hint';this.hint.setAttribute('role','status');
  const options=session.root.querySelector('[data-hand-object-options]');options.append(this.button,this.hint);
  this.button.onclick=()=>this.facing==='environment'?this.returnFront():this.frontPending?this.cancelConfirmation():this.startRear();this.sync();
 }
 get mirrored(){return this.facing!=='environment';}
 get blocksBody(){return this.switching||this.facing==='environment';}
 get blocksPlaying(){return this.blocksBody||this.frontPending;}
 sync(){
  const s=this.s,rear=this.facing==='environment';s.root.classList.toggle('war-rear-registration',rear);s.root.classList.toggle('war-registration-active',this.blocksPlaying);
  this.button.disabled=this.switching;this.button.textContent=rear?'VOLTAR À FRONTAL':this.frontPending?'CANCELAR CADASTRO TRASEIRO':'CADASTRAR PELA TRASEIRA';
  for(const name of['source-hand','source-object'])s.root.querySelector('[data-hand="'+name+'"]').disabled=this.switching;
  this.hint.textContent=this.message||(rear?'1/2 · Cadastre os detalhes na traseira. Depois confirme na frontal.':this.frontPending?'2/2 · Mostre o mesmo brinquedo à frontal, na distância de jogo, e confirme a captura.':'Opcional: cadastre detalhes pela traseira e confirme o brinquedo na frontal antes de jogar.');
  s.canvas.setAttribute('aria-label',rear?'Prévia da câmera traseira para cadastrar o brinquedo':'Prévia espelhada da câmera frontal');
  s.root.querySelector('[data-hand="capture"]').textContent=rear?'CAPTURAR NA TRASEIRA EM 3s':this.frontPending?'CONFIRMAR NA FRONTAL EM 3s':'CAPTURAR OBJETO EM 3s';
  s.root.querySelector('[data-hand="capture"]').disabled=this.switching||!s.ready||!s.host?.video?.srcObject?.active;
  s.root.querySelector('[data-hand="reuse"]').disabled=this.switching||rear||this.frontPending||!s.ready;
  if(s.source==='object'&&this.blocksPlaying)s.root.querySelector('.war-hand-instruction').textContent=rear?'Aponte a traseira para o brinquedo. Selecione seus detalhes, capture e marque ponta e apoio. Depois voltaremos à frontal.':'Apoie o celular. Mostre os ombros e o mesmo brinquedo na posição e distância de jogo. Selecione os detalhes e confirme a captura frontal.';
  else if(s.source==='object')s.root.querySelector('.war-hand-instruction').textContent='Mostre os ombros e segure o brinquedo na posição e distância de jogo. Selecione detalhes do próprio objeto, capture e marque sua ponta e apoio.';
 }
 prepare(){
  const s=this.s;s.release();s.objectTools.resetCapture();s.controller.reset();s.game.handAim=s.controller.aim;s.captureAt=0;s.captureROI=false;s.needCapture=true;s.lastVideo=-1;s.roiStart=null;s.bodySession?.reset();s.game.state='HAND_CALIBRATION';s.root.classList.add('calibrating');s.root.setAttribute('role','dialog');s.root.setAttribute('aria-modal','true');s.restartObjectRecognition?.();
 }
 async open(facing){
  const s=this.s,video=s.host?.video;if(this.closed||!video||!navigator.mediaDevices?.getUserMedia)throw Error('Troca de câmera indisponível.');
  const epoch=++this.epoch;this.switching=true;this.message=facing==='environment'?'Abrindo a câmera traseira…':'Voltando à câmera frontal…';this.prepare();this.sync();
  stop(video.srcObject);video.srcObject=null;if(s.host===window.System)window.System.currentCameraMode=null;
  let stream=null,timer,expired=false;
  const request=Promise.resolve().then(()=>navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:facing==='environment'?{exact:'environment'}:{ideal:'user'},width:{ideal:640},height:{ideal:480}}}));
  request.then(value=>{if(expired||this.closed||epoch!==this.epoch)stop(value);},()=>{});
  try{
   stream=await Promise.race([request,new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;reject(Error('A câmera não respondeu. Confira a permissão e tente novamente.'));},12000);})]);clearTimeout(timer);
   if(this.closed||epoch!==this.epoch){stop(stream);return false;}
   const actual=stream.getVideoTracks?.()[0]?.getSettings?.().facingMode;if((facing==='environment'&&actual!=='environment')||(actual&&actual!==facing))throw Error(facing==='environment'?'Não foi possível selecionar a câmera traseira.':'Não foi possível voltar à câmera frontal.');
   this.owned=stream;video.muted=true;video.playsInline=true;video.autoplay=true;
   await new Promise((resolve,reject)=>{const done=error=>{clearTimeout(timeout);video.removeEventListener('loadeddata',ready);video.removeEventListener('error',failed);error?reject(error):resolve();},ready=()=>{if(video.srcObject===stream&&video.readyState>=2)done();},failed=()=>done(Error('A câmera não forneceu imagem.')),timeout=setTimeout(failed,6000);video.addEventListener('loadeddata',ready);video.addEventListener('error',failed);video.srcObject=stream;Promise.resolve(video.play()).then(ready,done);});
   if(this.closed||epoch!==this.epoch){stop(stream);return false;}
   this.facing=facing;this.switching=false;this.message='';s.lastVideo=-1;s.controller.reset();s.game.handAim=s.controller.aim;s.bodySession?.reset();if(s.host===window.System)window.System.currentCameraMode=facing;this.sync();return true;
  }catch(error){clearTimeout(timer);expired=true;stop(stream);if(video.srcObject===stream)video.srcObject=null;if(this.closed||epoch!==this.epoch)return false;this.switching=false;this.message=error.message;this.sync();throw error;}
 }
 async startRear(){
  if(this.switching||this.closed||this.s.source!=='object')return;
  this.reference=null;this.frontPending=false;
  try{await this.open('environment');}catch(error){if(this.closed)return;try{await this.open('user');this.message='Traseira indisponível. Você pode cadastrar e jogar pela frontal.';this.sync();}catch{if(!this.closed)this.s.fail('Não foi possível restaurar a câmera frontal.');}}
 }
 async returnFront(template){
  if(this.closed||this.switching)return;
  if(template){this.reference=template;this.frontPending=true;}else{this.reference=null;this.frontPending=false;}
  try{await this.open('user');}catch{if(!this.closed)this.s.fail('Não foi possível voltar à frontal.');}
 }
 axisAccepted(template){
  if(this.facing==='environment'){this.returnFront(template);return true;}
  if(this.frontPending){this.frontPending=false;this.reference=null;this.message='✓ Duas vistas cadastradas. Mantenha o brinquedo na posição de jogo.';this.sync();}
  return false;
 }
 captureStarted(){if(!this.frontPending)this.reference=null;this.message='';this.sync();}
 cancelConfirmation(){this.reference=null;this.frontPending=false;this.message='Cadastro traseiro cancelado. Capture pela frontal para jogar.';this.prepare();this.sync();}
 sourceChanged(){this.reference=null;this.frontPending=false;if(this.facing==='environment'||this.switching){this.epoch++;this.switching=false;this.returnFront();}this.sync();}
 dispose(){this.closed=true;this.epoch++;stop(this.owned);this.owned=null;this.reference=null;}
}
window.WarObjectCamera={canvasPoint,Registration,attach:s=>new Registration(s)};
})();

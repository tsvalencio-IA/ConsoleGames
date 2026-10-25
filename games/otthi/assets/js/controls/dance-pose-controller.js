/** Front camera opt-in, bounded frame queue and complete session cleanup. */
export class DancePoseController {
 constructor(video,{onPose,onState,onError}={}){Object.assign(this,{video,onPose,onState,onError});this.closed=false;this.busy=false;this.frameId=0;this.lastSent=0;this.lastVideoTime=-1;this.raf=0;this.stream=null;this.worker=null;this.stats={frames:0,inferenceMs:0,latencyMs:0,facingMode:'user'};}
 async start(){
  try{
   if(!navigator.mediaDevices?.getUserMedia)throw Error('A câmera precisa de conexão HTTPS e de um navegador com acesso à câmera.');
   this.onState?.('Aguardando permissão da câmera frontal…');
   const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'user'},width:{ideal:640},height:{ideal:480},frameRate:{ideal:24,max:30}},audio:false});if(this.closed){stream.getTracks().forEach(t=>t.stop());return;}
   this.stream=stream;const track=stream.getVideoTracks()[0];this.stats.facingMode=track.getSettings?.().facingMode||'user';track.addEventListener('ended',()=>{if(!this.closed)this.fail(Error('A câmera foi desconectada. Ative-a novamente.'));});this.video.srcObject=stream;await this.video.play();if(this.closed)return;
   this.onState?.('Preparando o acompanhamento do corpo. Na primeira vez, o modelo será baixado…');
   await new Promise((resolve,reject)=>{this.initReject=reject;this.worker=new Worker(new URL('./dance-pose-worker.js',import.meta.url));const timeout=setTimeout(()=>reject(Error('O acompanhamento demorou para carregar. Verifique a conexão e tente novamente.')),45000);this.initTimer=timeout;this.worker.onmessage=({data})=>{if(this.closed)return;if(data.type==='ready'){clearTimeout(timeout);this.initReject=null;resolve();}else if(data.type==='pose'){this.busy=false;this.stats.frames++;this.stats.inferenceMs=data.inferenceMs;this.stats.latencyMs=performance.now()-data.at;if(this.stats.latencyMs<650)this.onPose?.(data.landmarks,data.at,performance.now(),data.frameId);}else if(data.type==='error'){clearTimeout(timeout);reject(Error(data.message));this.fail(Error(data.message));}};this.worker.onerror=()=>{clearTimeout(timeout);reject(Error('Não foi possível iniciar o acompanhamento do corpo.'));};this.worker.postMessage({type:'init'});});
   if(this.closed)return;this.onState?.('Mostre o corpo inteiro, da cabeça aos pés.');this.loop();
  }catch(error){if(!this.closed)this.fail(error);}
 }
 loop(){if(this.closed)return;const now=performance.now();if(this.busy&&now-this.lastSent>4500){this.fail(Error('O acompanhamento parou de responder. Ative a câmera novamente.'));return;}
  if(!this.busy&&this.video.readyState>=2&&this.video.currentTime!==this.lastVideoTime&&now-this.lastSent>=85){this.busy=true;this.lastSent=now;this.lastVideoTime=this.video.currentTime;const generation=this.frameId++,at=now;createImageBitmap(this.video,{resizeWidth:384,resizeHeight:288,resizeQuality:'low'}).then(image=>{if(this.closed){image.close();return;}this.worker.postMessage({type:'frame',image,at,frameId:generation},[image]);}).catch(error=>this.fail(error));}this.raf=requestAnimationFrame(()=>this.loop());
 }
 fail(error){const name=error?.name,message=name==='NotAllowedError'?'Permita o uso da câmera frontal para dançar.':name==='NotFoundError'?'Nenhuma câmera foi encontrada neste aparelho.':name==='NotReadableError'?'A câmera está em uso por outro aplicativo. Feche-o e tente novamente.':error?.message||'Não foi possível usar a câmera.';this.close();this.onError?.(message);}
 close(){if(this.closed)return;this.closed=true;cancelAnimationFrame(this.raf);clearTimeout(this.initTimer);this.initReject?.(Error('Sessão encerrada'));this.initReject=null;this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.video.pause();this.video.srcObject=null;this.worker?.terminate();this.worker=null;this.busy=false;}
}

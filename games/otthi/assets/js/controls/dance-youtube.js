/** YouTube stays in its visible, official player. No audio extraction or API key. */
export function youtubeVideo(value){
 const raw=String(value||'').trim();
 if(/^[\w-]{11}$/.test(raw))return raw;
 let url;try{url=new URL(/^https?:\/\//i.test(raw)?raw:'https://'+raw);}catch{return null;}
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return null;
 const host=url.hostname.toLowerCase(),parts=url.pathname.split('/').filter(Boolean);
 const id=['youtu.be','www.youtu.be'].includes(host)?parts[0]:['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)?(url.pathname==='/watch'?url.searchParams.get('v'):['embed','shorts','live'].includes(parts[0])?parts[1]:null):null;
 return /^[\w-]{11}$/.test(id||'')?id:null;
}
let apiPromise;
export function youtubeAPI(){
 if(globalThis.YT?.Player)return Promise.resolve(globalThis.YT);
 if(apiPromise)return apiPromise;
 apiPromise=new Promise((resolve,reject)=>{
  const previous=globalThis.onYouTubeIframeAPIReady,script=document.createElement('script');let done=false;
  const finish=error=>{if(done)return;done=true;clearTimeout(timer);globalThis.onYouTubeIframeAPIReady=previous;if(error){script.remove();apiPromise=null;reject(error);}else resolve(globalThis.YT);};
  globalThis.onYouTubeIframeAPIReady=()=>{try{previous?.();}finally{finish();}};
  const timer=setTimeout(()=>finish(Error('O YouTube demorou para carregar. Confira a internet e tente novamente.')),20000);
  script.src='https://www.youtube.com/iframe_api';script.async=true;script.onerror=()=>finish(Error('Não foi possível conectar ao YouTube. Confira a internet e tente novamente.'));document.head.append(script);
 });
 return apiPromise;
}
export class YouTubeDanceMusic{
 constructor({host,id,onStatus=()=>{}}){this.host=host;this.id=id;this.onStatus=onStatus;this.enabled=true;this.playing=false;this.closed=false;this.wanted=false;this.state=-1;this.ready=false;this.stats={resyncs:0};this.track={title:'Música do YouTube',style:'YouTube',bpm:120};}
 async load(){
  const YT=await youtubeAPI();if(this.closed)throw Error('Seleção encerrada.');
  const target=document.createElement('div');this.host.append(target);
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('O vídeo não respondeu. Tente outro link do YouTube.')),20000);this.cancelLoad=()=>{clearTimeout(timer);reject(Error('Seleção encerrada.'));};
   this.player=new YT.Player(target,{width:'100%',height:'100%',videoId:this.id,playerVars:{playsinline:1,controls:1,origin:location.origin,rel:0},events:{
    onReady:event=>{clearTimeout(timer);this.cancelLoad=null;if(this.closed){event.target.destroy();reject(Error('Seleção encerrada.'));return;}this.ready=true;const frame=event.target.getIframe();frame.title='Música da aula no YouTube';frame.referrerPolicy='strict-origin-when-cross-origin';resolve();},
    onStateChange:event=>{if(this.closed)return;this.state=event.data;this.playing=event.data===1;this.waiting(this.wanted&&!this.playing);this.onStatus(this.playing?'YouTube tocando':event.data===3?'YouTube carregando…':this.wanted?'Toque em ▶ no vídeo para continuar a música.':'Confira o vídeo e escolha sua aula.');},
    onError:event=>{clearTimeout(timer);const message=[101,150].includes(event.data)?'Este vídeo não permite reprodução no jogo. Escolha outro link.':event.data===100?'Vídeo indisponível. Escolha outro link.':event.data===153?'O YouTube não identificou esta página. Abra o jogo no navegador e tente novamente.':'O YouTube não conseguiu tocar este vídeo. Escolha outro link.';this.error=message;this.waiting(true);this.onStatus(message);if(!this.ready)reject(Error(message));},
    onAutoplayBlocked:()=>{this.waiting(true);this.onStatus('Toque em ▶ no vídeo para liberar a música.');}
   }});
  });return this;
 }
 waiting(value){this.onWaiting?.(!!value);}
 selection(bpm=120,offset=0){
  const duration=Number(this.player?.getDuration())||0,start=Math.max(0,Number(offset)||0);
  if(duration-start<30)throw Error('Toque no vídeo para carregar e escolha pelo menos 30 segundos de música.');
  this.track.bpm=Math.max(80,Math.min(150,Math.round(Number(bpm)||120)));this.track.title=this.player.getVideoData?.().title||'Música do YouTube';
  return {youtube:true,title:this.track.title,bpm:this.track.bpm,offset:start,duration:Math.min(360,duration-start)};
 }
 bind(snapshot,onWaiting){this.stop();this.snapshot=snapshot;this.onWaiting=onWaiting;this.error='';this.lastCheck=0;this.wanted=false;}
 setEnabled(on){this.enabled=!!on;if(this.enabled)this.player?.unMute();else this.player?.mute();}
 unlock(){if(!this.ready||this.closed)return;this.error='';this.player.playVideo();}
 stop(){this.wanted=false;this.playing=false;try{this.player?.pauseVideo();}catch{}this.waiting(false);}
 tick(){
  if(this.closed||!this.ready||!this.snapshot)return;
  const d=this.snapshot(),wanted=d.phase==='playing'&&!d.done;
  if(!wanted){if(this.wanted)this.stop();return;}
  if(!this.wanted){this.wanted=true;this.waiting(true);this.player.seekTo(Math.max(0,d.time+(this.offset||0)),true);this.player.playVideo();return;}
  this.waiting(this.state!==1||!!this.error);
  const now=performance.now();if(this.state!==1||now-(this.lastCheck||0)<500)return;this.lastCheck=now;
  const actual=Number(this.player.getCurrentTime());if(Number.isFinite(actual)&&Math.abs(actual-d.time-(this.offset||0))>.65){this.waiting(true);this.player.seekTo(Math.max(0,d.time+(this.offset||0)),true);this.stats.resyncs++;}
 }
 diagnostics(){return{youtube:true,title:this.track.title,bpm:this.track.bpm,enabled:this.enabled,playing:this.playing,state:this.state,ready:this.ready,position:this.player?.getCurrentTime?.()||0,error:this.error||'',...this.stats};}
 close(){if(this.closed)return;this.stop();this.closed=true;this.cancelLoad?.();this.player?.destroy();this.host.remove();this.onWaiting=null;}
}

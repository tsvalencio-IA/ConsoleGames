/** Original instrumental arrangements, synchronized to the pose chart clock. */
export const DANCE_TRACKS=Object.freeze([{title:'Passos ao Sol',bpm:108,style:'Pop brasileiro instrumental'},{title:'Balanço da Cidade',bpm:120,style:'Groove latino instrumental'},{title:'Festival em Movimento',bpm:132,style:'Dance instrumental'}]);
const noiseBuffers=new WeakMap(),midi=n=>440*2**((n-69)/12);
/** Estimate beat spacing from the local recording's onset envelope. The tempo
 * remains editable: recordings with a weak pulse can be ambiguous by a factor of two. */
export function danceBeat(buffer){
 const rate=100,hop=Math.max(1,Math.round(buffer.sampleRate/rate)),samples=Math.min(buffer.length,buffer.sampleRate*60),data=buffer.getChannelData(0),energy=[];
 for(let at=0;at+hop<samples;at+=hop){let sum=0;for(let j=0;j<hop;j++)sum+=data[at+j]**2;energy.push(Math.sqrt(sum/hop));}
 const onset=energy.map((v,i)=>Math.max(0,v-(energy[i-1]||0))),scores=[];
 for(let lag=40;lag<=75;lag++){let sum=0,a=0,b=0;for(let i=lag;i<onset.length;i++){sum+=onset[i]*onset[i-lag];a+=onset[i]**2;b+=onset[i-lag]**2;}scores.push({lag,score:sum/Math.sqrt(a*b||1)});}
 scores.sort((a,b)=>b.score-a.score);const best=scores[0]||{lag:50,score:0},bpm=best.score>.12?Math.round(6000/best.lag):120,period=6000/bpm;let offset=0,max=-1;
 for(let phase=0;phase<Math.ceil(period);phase++){let sum=0;for(let i=phase;i<Math.min(onset.length,1200);i+=period)sum+=onset[Math.round(i)]||0;if(sum>max){max=sum;offset=phase/rate;}}
 return{bpm,offset,confidence:best.score};
}
export async function prepareDanceTrack(file,{context=null}={}){
 if(!file||file.size>12*1024*1024)throw new Error('Escolha um áudio de até 12 MB.');
 const ctx=context||new(window.AudioContext||window.webkitAudioContext)();
 try{const buffer=await ctx.decodeAudioData(await file.arrayBuffer());if(buffer.duration<30||buffer.duration>360)throw new Error('Escolha uma música entre 30 segundos e 6 minutos.');return{buffer,title:file.name.replace(/\.[^.]+$/,''),...danceBeat(buffer)};}
 finally{if(!context)await ctx.close();}
}
function noise(ctx){let b=noiseBuffers.get(ctx);if(!b){b=ctx.createBuffer(1,ctx.sampleRate*.35,ctx.sampleRate);const a=b.getChannelData(0);let seed=7331;for(let i=0;i<a.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;a[i]=seed/2147483648-1;}noiseBuffers.set(ctx,b);}return b;}
export function scheduleDanceStep(ctx,bus,step,when,bpm,level=0,register=()=>{}){
 const beat=60/bpm,bar=Math.floor(step/8),slot=step%8,root=[45,41,48,43][bar%4],voices=[];
 const voice=(hz,type,at,duration,volume,cutoff=0,slide=0)=>{const source=hz===null?ctx.createBufferSource():ctx.createOscillator(),gain=ctx.createGain();if(hz===null)source.buffer=noise(ctx);else{source.type=type;source.frequency.setValueAtTime(hz,at);if(slide)source.frequency.exponentialRampToValueAtTime(slide,at+duration*.7);}let output=source,filter=null;if(cutoff){filter=ctx.createBiquadFilter();filter.type=hz===null?'highpass':'lowpass';filter.frequency.value=cutoff;source.connect(filter);output=filter;}output.connect(gain);gain.connect(bus);gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(volume,at+.005);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);source.onended=()=>{source.disconnect();gain.disconnect();filter?.disconnect();};source.start(at);source.stop(at+duration+.01);register(source);voices.push(source);};
 if(slot%2===0||level===2&&slot===7)voice(145,'sine',when,.20,.40,0,43);
 if(slot===2||slot===6){voice(null,'',when,.12,.17,1300);voice(180,'triangle',when,.065,.055);}
 voice(null,'',when,slot%2?.065:.035,slot%2?.04:.025,6700);if(level>0)voice(null,'',when+beat*.25,.028,.018,4200);
 const bass=[0,0,7,12,0,7,10,7][slot];if(slot!==3||level>0)voice(midi(root+bass),'triangle',when,beat*(slot%2?.32:.70),.15,700);
 if(slot===0||slot===5){const major=bar%4===1||bar%4===2;for(const n of[root+24,root+24+(major?4:3),root+31])voice(midi(n),'triangle',when,beat*(slot===0?1.1:.48),.038,2200);}
 const melody=[[12,15,19,22,19,15,14,19],[12,16,19,21,19,16,14,16],[12,16,19,24,23,19,16,19],[12,16,19,22,21,19,16,14]][bar%4];if((bar%4>=2||slot%2===0)&&!(bar%8===7&&slot>5))voice(midi(root+24+melody[(slot+Math.floor(bar/4)*2)%8]),'sine',when,beat*.43,.038,3200);return voices.length;
}
export class DanceMusic{
 constructor(snapshot,level=0,{enabled=true,context=null,custom=null}={}){this.snapshot=snapshot;this.level=level;this.custom=custom;this.track=custom?{title:custom.title,bpm:custom.bpm,style:'Música do aparelho'}:DANCE_TRACKS[level];this.enabled=enabled;this.ctx=context;this.nodes=new Set();this.closed=false;this.next=-1;this.playing=false;this.stats={steps:0,voices:0,resyncs:0};if(enabled)this.unlock();this.timer=setInterval(()=>this.tick(),25);}
 unlock(){if(this.closed)return;try{if(!this.ctx)this.ctx=new(window.AudioContext||window.webkitAudioContext)();if(!this.bus){this.bus=this.ctx.createGain();this.bus.gain.value=.52;this.compressor=this.ctx.createDynamicsCompressor();this.compressor.threshold.value=-15;this.compressor.ratio.value=3;this.bus.connect(this.compressor);this.compressor.connect(this.ctx.destination);}this.ctx.resume().catch(()=>{});}catch{this.error='Toque em MÚSICA para ativar o som.';}}
 setEnabled(on){this.enabled=!!on;if(on)this.unlock();else this.stop();this.tick();}
 stop(){for(const n of this.nodes){try{n.stop();}catch{}}this.nodes.clear();this.next=-1;this.playing=false;this.ctx?.suspend().catch(()=>{});}
 tick(){if(this.closed)return;const d=this.snapshot();if(!this.enabled||!d||d.phase!=='playing'||d.done){if(this.playing)this.stop();return;}if(!this.ctx||!this.bus)return;if(this.ctx.state==='suspended'){if(!this.resuming)this.resuming=this.ctx.resume().catch(()=>{}).finally(()=>{this.resuming=null;});return;}if(this.ctx.state!=='running')return;const song=d.time,now=this.ctx.currentTime,half=30/d.bpm;
 if(this.custom){if(!this.playing||Math.abs(now-this.anchor-song)>.14){for(const n of this.nodes){try{n.stop();}catch{}}this.nodes.clear();const source=this.ctx.createBufferSource();source.buffer=this.custom.buffer;source.connect(this.bus);const offset=Math.max(0,Math.min(source.buffer.duration-.01,song+this.custom.offset));source.start(now,offset);source.onended=()=>{this.nodes.delete(source);source.disconnect();};this.nodes.add(source);this.anchor=now-song;this.stats.resyncs++;}this.playing=true;this.position=song+this.custom.offset;return;}
 if(this.next<0||Math.abs(now-this.anchor-song)>.14){if(this.next>=0){for(const n of this.nodes){try{n.stop();}catch{}}this.nodes.clear();this.stats.resyncs++;}this.anchor=now-song;this.next=Math.ceil((song-.005)/half);}this.playing=true;while(this.next*half<song+.15&&this.next*half<d.end){const step=this.next++,when=this.anchor+step*half;if(when<now-.015)continue;this.stats.voices+=scheduleDanceStep(this.ctx,this.bus,step,Math.max(now+.003,when),d.bpm,this.level,n=>{this.nodes.add(n);n.addEventListener('ended',()=>this.nodes.delete(n),{once:true});});this.stats.steps++;}}
 diagnostics(){return{title:this.track.title,bpm:this.track.bpm,custom:!!this.custom,position:this.position||0,enabled:this.enabled,playing:this.playing,audioState:this.ctx?.state||'off',...this.stats,error:this.error||''};}
 close(){if(this.closed)return;this.closed=true;clearInterval(this.timer);this.stop();this.bus?.disconnect();this.compressor?.disconnect();this.ctx?.close().catch(()=>{});}
}

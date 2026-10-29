/* Calibrated upper-body posture and optional full-body steps, on the same front video. */
(()=>{'use strict';
const root=new URL('./',document.currentScript?.src||document.baseURI),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
const visible=(p,score=.55)=>p&&[p.x,p.y].every(Number.isFinite)&&(p.visibility??0)>=score&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1;
class BodyController{
 constructor(){this.reset();}
 reset(){this.samples=[];this.neutral=null;this.lastAt=-Infinity;this.lastInput=-Infinity;this.landmarks=null;this.reason='show-body';this.output={fresh:false,calibrated:false,moveX:0,moveZ:0,crouched:false,turnYaw:0,lean:0,twoHands:false,timestamp:0,fullBody:false};}
 release(reason='lost'){this.reason=reason;this.landmarks=null;Object.assign(this.output,{fresh:false,moveX:0,moveZ:0,crouched:false,twoHands:false,turnYaw:0,lean:0});return this.output;}
 consume(points,world,at,now=at){
  if(at<=this.lastInput||now-at>1200||at>now+20)return this.read(now);this.lastInput=at;
  if(!Array.isArray(points)||points.length!==33||![11,12].every(i=>visible(points[i]))){this.samples=[];return this.release('show-shoulders');}
  const mid=(a,b)=>({x:1-(points[a].x+points[b].x)/2,y:(points[a].y+points[b].y)/2});
  const shoulder=mid(11,12),width=Math.hypot(points[11].x-points[12].x,points[11].y-points[12].y);
  if(width<.065||width>.78){this.samples=[];return this.release(width<.065?'closer':'farther');}
  const hips=[23,24].every(i=>visible(points[i])),hip=hips?mid(23,24):null;
  const feet=hips&&[27,28].every(i=>visible(points[i],.6)),foot=feet?mid(27,28):null;
  const hasWorld=world?.length===33&&[11,12].every(i=>[world[i]?.x,world[i]?.z].every(Number.isFinite));
  const yaw=hasWorld?Math.atan2(world[11].z-world[12].z,world[11].x-world[12].x):0;
  this.landmarks=points;
  if(!this.neutral){
   const last=this.samples.at(-1),centre=hip||shoulder;
   if(last&&(at-last.at>1800||Math.hypot(centre.x-last.centre.x,centre.y-last.centre.y)>.035||!!hip!==!!last.hip))this.samples=[];
   this.samples.push({at,shoulder,hip,centre,width,foot,yaw});this.reason='hold-still';
   if(this.samples.length>=6&&at-this.samples[0].at>=900){
    const mean=fn=>this.samples.reduce((s,v)=>s+fn(v),0)/this.samples.length;
    this.neutral={shoulder:{x:mean(v=>v.shoulder.x),y:mean(v=>v.shoulder.y)},hip:hip?{x:mean(v=>v.hip.x),y:mean(v=>v.hip.y)}:null,width:mean(v=>v.width),foot:foot&&this.samples.every(v=>v.foot)?{x:mean(v=>v.foot.x),y:mean(v=>v.foot.y)}:null,yaw:mean(v=>v.yaw)};
   }else return this.output;
  }
  const b=this.neutral,hipReady=!!(hip&&b.hip),shift=hipReady?(hip.x-b.hip.x)/b.width:0,drop=hipReady?(hip.y-b.hip.y)/b.width:0;
  const shoulderDrop=(shoulder.y-b.shoulder.y)/b.width,footShift=foot&&b.foot?(foot.x-b.foot.x)/b.width:0,footDrop=foot&&b.foot?(foot.y-b.foot.y)/b.width:0;
  const scale=width/b.width-1,turn=hasWorld?-angle(yaw-b.yaw):0;
  let crouched=hipReady?drop>.34&&shoulderDrop>.28:shoulderDrop>.45&&Math.abs(scale)<.20;
  if(this.output.crouched)crouched=hipReady?drop>.22&&shoulderDrop>.17:shoulderDrop>.29&&Math.abs(scale)<.25;
  const intentionalSide=feet&&b.foot&&Math.sign(shift)===Math.sign(footShift)&&Math.abs(footShift)>.18;
  const moveX=intentionalSide?Math.sign(shift)*clamp((Math.abs(shift)-.24)/.55,0,1):0;
  const moveZ=feet&&b.foot&&Math.abs(turn)<.28&&Math.abs(shift)<.35&&Math.abs(footDrop)>.10&&Math.sign(scale)===Math.sign(footDrop)?Math.sign(scale)*clamp((Math.abs(scale)-.15)/.28,0,1):0;
  const twoHands=[15,16].every(i=>visible(points[i],.6))&&Math.hypot(points[15].x-points[16].x,points[15].y-points[16].y)/width<.9;
  this.reason='ready';this.lastAt=at;Object.assign(this.output,{fresh:true,calibrated:true,moveX:crouched?moveX*.5:moveX,moveZ:crouched?0:moveZ,crouched,turnYaw:clamp(turn,-.7,.7),lean:hipReady?clamp((shoulder.x-hip.x)/width,-.7,.7):clamp((shoulder.x-b.shoulder.x)/width,-.7,.7),twoHands,timestamp:at,fullBody:!!(feet&&b.foot)});return this.output;
 }
 read(now){return now-this.lastAt>1200?this.release(this.neutral?'lost':this.reason):this.output;}
}
// Magnify the anatomical right wrist. Hand coordinates are restored to the
// original camera frame before aiming, so a moving crop cannot move the aim.
function handRegion(points,w,h){
 if(!points||![12,16].every(i=>visible(points[i],.6)))return null;
 const wrist=points[16],elbow=visible(points[14],.5)?points[14]:points[12],shoulder=points[11];
 const span=visible(shoulder)?Math.hypot((shoulder.x-points[12].x)*w,(shoulder.y-points[12].y)*h):w*.22;
 const size=clamp(span*.95,Math.min(w,h)*.25,Math.min(w,h)*.72);
 const x=(wrist.x+(wrist.x-elbow.x)*.17)*w,y=(wrist.y+(wrist.y-elbow.y)*.17)*h;
 return {x:clamp(x-size/2,0,w-size)/w,y:clamp(y-size/2,0,h-size)/h,w:size/w,h:size/h};
}
class BodySession{
 constructor(game){this.game=game;this.controller=new BodyController();this.busy=false;this.ready=false;this.closed=false;this.nextAt=0;this.serial=0;this.status='loading';this.start();}
 unavailable(){this.status='unavailable';this.ready=this.busy=false;clearTimeout(this.initTimer);this.worker?.terminate();this.controller.release();}
 start(){if(this.closed)return;this.worker?.terminate();this.ready=this.busy=false;this.status='loading';try{this.worker=new Worker(new URL('./body-tracker-worker.js',root));this.initTimer=setTimeout(()=>this.unavailable(),45000);this.worker.onmessage=({data})=>{if(this.closed)return;if(data.type==='ready'){clearTimeout(this.initTimer);this.ready=true;this.status='calibrating';}else if(data.type==='pose'){this.busy=false;if(this.inflightSerial!==this.serial)return;this.computeMs=data.inferenceMs;this.controller.consume(data.landmarks,data.worldLandmarks,data.timestamp,performance.now());this.status=this.controller.neutral?'ready':'calibrating';}else if(data.type==='error')this.unavailable();};this.worker.onerror=()=>this.unavailable();this.worker.postMessage({type:'init'});}catch{this.unavailable();}}
 tick(video,now,paused,handLatency=0,defer=false){
  this.game.bodyPose=this.controller.read(now);if(paused){if(!this.wasPaused)this.release();this.wasPaused=true;return;}this.wasPaused=false;
  if(this.busy&&now-(this.sentAt||now)>6000){this.unavailable();return;}
  if(defer||!this.ready||this.busy||!video||video.readyState<2||now<this.nextAt||video.currentTime===this.lastVideo)return;
  this.busy=true;this.sentAt=now;this.inflightSerial=this.serial;const serial=this.serial;this.lastVideo=video.currentTime;
  this.nextAt=now+Math.max(330,Number(this.computeMs||0)*1.7,handLatency>200?500:330);
  const w=video.videoWidth||640,h=video.videoHeight||480,r=320/Math.max(w,h);
  createImageBitmap(video,{resizeWidth:Math.round(w*r),resizeHeight:Math.round(h*r),resizeQuality:'low'}).then(frame=>{if(this.closed||!this.ready||serial!==this.serial){frame.close();this.busy=false;return;}this.worker.postMessage({type:'frame',frame,timestamp:now},[frame]);}).catch(()=>{this.busy=false;});
 }
 release(){this.serial++;const pose=this.controller.release();if(!this.closed)this.game.bodyPose=pose;}
 reset(){this.release();this.controller.reset();this.game.bodyPose=null;this.nextAt=0;if(this.status==='unavailable')this.start();else if(this.ready)this.status='calibrating';}
 dispose(){this.closed=true;clearTimeout(this.initTimer);this.worker?.terminate();this.game.bodyPose=null;}
}
window.WarBodyControl={BodyController,handRegion,start:game=>new BodySession(game)};
})();

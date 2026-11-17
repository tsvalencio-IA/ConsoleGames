/* thIAguinho ARCADE — shared, opt-in, single-player motion lock.
   No biometric identity, face recognition, Firebase storage or camera upload.
   Track continuity is best-effort; uncertainty always suppresses commands. */
(()=>{'use strict';
 const now=()=>typeof performance!=='undefined'?performance.now():Date.now();
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const point=(pose,name,index)=>pose?.keypoints?.find(p=>p&&(p.name===name||p.part===name))||pose?.keypoints?.[index];
 const good=p=>p&&Number(p.score??p.confidence??0)>=.27&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 const wristGood=p=>p&&Number(p.score??p.confidence??0)>=.17&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 function profile(p){
  const ls=point(p,'left_shoulder',5),rs=point(p,'right_shoulder',6),lw=point(p,'left_wrist',9),rw=point(p,'right_wrist',10);
  // Shoulders establish ownership; weak wrist confidence must not make person registration impossible.
  if(![ls,rs].every(good))return null;
  const width=Math.hypot(ls.x-rs.x,ls.y-rs.y);
  if(width<5)return null;
  const x=(ls.x+rs.x)/2,y=(ls.y+rs.y)/2,scale=width;
  return {pose:p,x,y,scale,id:p.id??null,ls,rs,lw:wristGood(lw)?lw:null,rw:wristGood(rw)?rw:null};
 }
 function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
 function classifyHand(hand){
  const points=hand?.keypoints;
  if(!Array.isArray(points)||points.length<21)return 'unknown';
  const f=[[5,6,8],[9,10,12],[13,14,16],[17,18,20]];
  let extended=0,folded=0;
  for(const [m,p,t] of f){
   if(![points[m],points[p],points[t]].every(q=>q&&Number.isFinite(q.x)&&Number.isFinite(q.y)))return 'unknown';
   const base=distance(points[m],points[p]),tip=distance(points[m],points[t]);
   if(base<1e-4)return 'unknown';
   const ratio=tip/base;
   if(ratio>1.52)extended++;
   else if(ratio<1.19)folded++;
  }
  if(extended>=3)return 'open';
  if(folded>=3)return 'closed';
  return 'unknown';
 }
 function associateHands(pose,detectedHands){
  const p=profile(pose),assigned={left:null,right:null};
  if(!p||!p.lw||!p.rw||!Array.isArray(detectedHands))return assigned;
  const maxD=Math.max(18,p.scale*.68),candidates=[];
  for(const hand of detectedHands){
   if(!hand?.keypoints?.length)continue;
   const wrist=hand.keypoints[0];
   if(!wrist||!Number.isFinite(wrist.x)||!Number.isFinite(wrist.y))continue;
   for(const [side,bodyWrist] of [['left',p.lw],['right',p.rw]]){
    const d=distance(wrist,bodyWrist);
    if(d<=maxD)candidates.push({hand,side,d});
   }
  }
  candidates.sort((a,b)=>a.d-b.d);
  const used=new Set();
  for(const c of candidates)if(!assigned[c.side]&&!used.has(c.hand)){
   // A second hand at nearly the same wrist position makes attribution unsafe.
   const ambiguous=candidates.some(other=>other!==c&&other.side===c.side&&other.hand!==c.hand&&other.d<maxD&&Math.abs(other.d-c.d)<maxD*.19);
   if(ambiguous)continue;
   assigned[c.side]={state:classifyHand(c.hand),hand:c.hand,distance:c.d};used.add(c.hand);
  }
  return assigned;
 }
 class PlayerLock{
  constructor(){
   this.status='selecting';this.id=null;this.pose=null;this.anchor=null;
   this.candidate=null;this.candidateSince=0;this.lastSeen=0;this.reason='POSICIONE-SE SOZINHO NO CENTRO';this.recoverySince=0;
   this.recoveryCandidate=null;this.handStates={left:'unknown',right:'unknown'};this.handCandidates={left:null,right:null};this.lastHandsAt=0;
  }
  reset(){
   this.status='selecting';this.id=null;this.pose=null;this.anchor=null;this.candidate=null;
   this.candidateSince=0;this.lastSeen=0;this.recoverySince=0;this.recoveryCandidate=null;
   this.handStates={left:'unknown',right:'unknown'};this.handCandidates={left:null,right:null};this.lastHandsAt=0;
   this.reason='POSICIONE-SE SOZINHO NO CENTRO';
  }
  observe(poses,time=now()){
   const candidates=(Array.isArray(poses)?poses:poses?[poses]:[]).map(profile).filter(Boolean);
   if(this.status==='selecting'){
    if(candidates.length!==1){
     this.candidate=null;this.candidateSince=0;this.pose=null;
     this.reason=candidates.length?'UMA PESSOA POR VEZ PARA CALIBRAR':'MOSTRE OS OMBROS À CÂMERA';
     return null;
    }
    const p=candidates[0],same=this.candidate&&distance(this.candidate,p)<p.scale*.95&&p.scale/this.candidate.scale>.52&&p.scale/this.candidate.scale<1.85;
    // Registration uses torso continuity: provider-generated ids can change during acquisition.
    if(!same){this.candidate=p;this.candidateSince=time;}
    else this.candidate=p;
    this.pose=null;this.reason='CADASTRANDO JOGADOR • MANTENHA AS DUAS MÃOS VISÍVEIS';
    if(time-this.candidateSince>=650){
     this.status='locked';this.id=p.id;this.anchor=p;this.lastSeen=time;this.pose=p.pose;this.reason='JOGADOR TRAVADO';
    }
    return this.pose;
   }
   const prev=this.anchor,match=candidates.filter(p=>{
    if(this.id!=null && p.id!==this.id)return false;
    if(!prev)return false;
    const age=time-this.lastSeen;
    const allowed=prev.scale*(age<500?2.5:age<2500?3.6:5.0);
    return distance(prev,p)<=allowed&&p.scale/prev.scale>.36&&p.scale/prev.scale<2.8;
   }).sort((a,b)=>distance(a,prev)-distance(b,prev));
   // If the tracker loses its persistent id, do not silently migrate to another person.
   if(!match.length){
    this.status='lost';this.pose=null;
    this.handStates={left:'unknown',right:'unknown'};this.handCandidates={left:null,right:null};
    this.reason='JOGADOR FORA DO RASTREIO • NÃO TROCAR POR OUTRA PESSOA';
    return null;
   }
   const best=match[0];
   if(match.length>1&&distance(best,prev)>distance(match[1],prev)*.7){
    this.pose=null;this.status='lost';this.reason='RASTREAMENTO AMBÍGUO • AGUARDE';return null;
   }
   this.status='locked';this.pose=best.pose;this.anchor=best;this.lastSeen=time;this.reason='JOGADOR TRAVADO';
   return this.pose;
  }
  hands(hands,time=now(),framePose=this.pose){
   if(this.status!=='locked'||!this.pose||(this.id!=null&&framePose?.id!==this.id)){
    this.handStates={left:'unknown',right:'unknown'};return this.handStates;
   }
   const assigned=associateHands(framePose,hands);
   // Two consecutive consistent frames before a switch avoid accidental commands
   // from one bad classifier frame or a hand passing over another body.
   for(const side of ['left','right']){
    const raw=assigned[side]?.state||'unknown',previous=this.handStates[side];
    if(raw==='unknown'){this.handStates[side]='unknown';this.handCandidates[side]=null;continue;}
    if(raw===previous){this.handCandidates[side]=null;continue;}
    const pending=this.handCandidates[side];
    if(!pending||pending.state!==raw)this.handCandidates[side]={state:raw,count:1};
    else{pending.count++;if(pending.count>=2){this.handStates[side]=raw;this.handCandidates[side]=null;}}
   }
   this.lastHandsAt=time;
   return this.handStates;
  }
  snapshot(time=now()){
   const fresh=this.status==='locked'&&this.pose&&time-this.lastSeen<700;
   const handsFresh=fresh&&time-this.lastHandsAt<850;
   return {status:fresh?'locked':this.status==='selecting'?'selecting':'lost',
    pose:fresh?this.pose:null,reason:this.reason,
    hands:handsFresh?{...this.handStates}:{left:'unknown',right:'unknown'},
    hasBothHands:handsFresh&&this.handStates.left!=='unknown'&&this.handStates.right!=='unknown',
    id:this.id};
  }
 }
 let handsLoad=null,handDetector=null,poseRuntimeLoad=null;
 const script=src=>new Promise((resolve,reject)=>{
  if(typeof document==='undefined')return reject(Error('DOM unavailable'));
  const el=document.createElement('script');el.src=src;el.async=true;el.crossOrigin='anonymous';
  el.onload=()=>resolve();el.onerror=()=>reject(Error('Unable to load hand tracker'));
  document.head.appendChild(el);
 });
 async function loadPoseRuntime(){
  if(window.tf&&window.poseDetection)return;
  if(poseRuntimeLoad)return poseRuntimeLoad;
  poseRuntimeLoad=(async()=>{
   const queued=[...document.querySelectorAll('script[data-motion-src]')].map(el=>el.dataset.motionSrc).filter(Boolean);
   if(!queued.length)throw Error('No motion library sources');
   for(const src of queued){
    if(src.includes('tfjs-core')&&window.tf)continue;
    if(src.includes('pose-detection')&&window.poseDetection)continue;
    await script(src);
   }
   if(!window.tf||!window.poseDetection)throw Error('Body detector libraries unavailable');
  })().catch(e=>{poseRuntimeLoad=null;throw e;});
  return poseRuntimeLoad;
 }
 if(!window.ConsoleMotionRuntime)window.ConsoleMotionRuntime={load:loadPoseRuntime};
 async function loadHands(){
  if(handDetector)return handDetector;
  if(handsLoad)return handsLoad;
  handsLoad=(async()=>{
   await loadPoseRuntime();
   if(!window.handPoseDetection)await script('https://cdn.jsdelivr.net/npm/@tensorflow-models/hand-pose-detection@2.0.1/dist/hand-pose-detection.min.js');
   if(!window.handPoseDetection?.createDetector)throw Error('Hand model unavailable');
   if(window.tf?.ready)await window.tf.ready();
   handDetector=await window.handPoseDetection.createDetector(window.handPoseDetection.SupportedModels.MediaPipeHands,{runtime:'tfjs',modelType:'lite',maxHands:2});
   return handDetector;
  })().catch(e=>{handsLoad=null;throw e;});
  return handsLoad;
 }
 window.ConsolePlayerMotionLock=Object.freeze({PlayerLock,profile,classifyHand,associateHands,loadHands,loadPoseRuntime,getHandDetector:()=>handDetector});
})();
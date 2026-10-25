/** Deterministic rhythm rules; clock and input are supplied by the real venue. */
// @otthi-module-body
  class WorldRhythm {
    constructor(level=0){
      this.level=Math.max(0,Math.min(2,Math.floor(level)));this.bpm=[84,104,120][this.level];this.beat=60/this.bpm;
      this.window=[.20,.17,.145][this.level];this.notes=[];const count=[32,48,64][this.level];
      for(let i=0;i<count;i++){
        const at=(i+2)*this.beat,lane=[0,2,1,3,2,0,3,1][(i+this.level*3)%8];this.notes.push({at,lane,state:'pending'});
        if(this.level===2&&i%8===7)this.notes.push({at,lane:(lane+2)%4,state:'pending'});
      }
      this.end=this.notes.at(-1).at+this.window+.5;this.score=0;this.combo=0;this.bestCombo=0;this.hits=0;this.misses=0;this.strays=0;this.weight=0;this.time=-3;this.done=false;
    }
    update(time){
      if(this.done)return;this.time=Math.max(this.time,time);
      for(const n of this.notes)if(n.state==='pending'&&this.time>n.at+this.window){n.state='miss';this.misses++;this.combo=0;}
      this.done=this.time>=this.end;
    }
    hit(lane,time){
      this.update(time);if(this.done||time<0||!Number.isInteger(lane)||lane<0||lane>3)return null;
      const n=this.notes.filter(n=>n.state==='pending'&&n.lane===lane&&Math.abs(n.at-time)<=this.window).sort((a,b)=>Math.abs(a.at-time)-Math.abs(b.at-time))[0];
      if(!n){this.combo=0;this.strays++;this.score=Math.max(0,this.score-30);return 'FORA DO TEMPO';}
      const error=Math.abs(n.at-time),weight=error<=.055?1:error<=.11?.8:.5;
      n.state='hit';this.hits++;this.weight+=weight;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);this.score+=Math.round(100*weight)+Math.min(50,this.combo*2);
      return weight===1?'PERFEITO':weight===.8?'BOM':'CERTO';
    }
    snapshot(){return {level:this.level,bpm:this.bpm,time:this.time,end:this.end,score:this.score,combo:this.combo,bestCombo:this.bestCombo,hits:this.hits,misses:this.misses,strays:this.strays,total:this.notes.length,accuracy:Math.max(0,(this.weight-this.strays*.2)/this.notes.length),done:this.done,notes:this.notes.filter(n=>n.state==='pending').map(n=>({at:n.at,lane:n.lane}))};}
  }

  /** Whole-body dance rules. Only fresh pose observations can earn points. */
  class WorldDanceBody {
    static moves=Object.freeze({up:'OS DOIS BRAÇOS PARA CIMA',open:'ABRA OS BRAÇOS',left:'PASSO PARA A ESQUERDA',right:'PASSO PARA A DIREITA',leftUp:'BRAÇO ESQUERDO PARA CIMA',rightUp:'BRAÇO DIREITO PARA CIMA',cross:'CRUZE OS BRAÇOS',squat:'AGACHE E VOLTE',leanLeft:'INCLINE PARA A ESQUERDA',leanRight:'INCLINE PARA A DIREITA'});
    constructor(level=0){this.level=Math.max(0,Math.min(2,Math.floor(level)));this.bpm=[108,120,132][this.level];this.beat=60000/this.bpm;this.duration=this.beat*4;const lists=[['up','left','open','right','leftUp','rightUp','left','right'],['open','left','up','right','cross','squat','leftUp','rightUp','left','right','up','open'],['up','left','right','cross','squat','open','leanLeft','leanRight','leftUp','rightUp','left','right','squat','cross','up','open']];this.phrases=lists[this.level].flatMap((move,group)=>Array.from({length:4},(_,rep)=>({move,group,rep:rep+1,hit:false,miss:false,quality:0,moved:false})));this.phase='calibration';this.calibration=[];this.baseline=null;this.lastPoseAt=0;this.lastTick=0;this.activeMs=0;this.countdownUntil=0;this.score=0;this.hits=0;this.misses=0;this.combo=0;this.bestCombo=0;this.weight=0;this.hold=0;this.holdSamples=0;this.recovery=0;this.index=0;this.originFeatures=null;this.feedback='Afaste-se: cabeça, mãos e pés precisam aparecer.';this.stable=0;this.done=false;this.lastFrameId=-1;this.features=null;this.lastInputAt=0;this.manual=false;}
    static body(landmarks,worldLandmarks=null){
      if(!Array.isArray(landmarks)||landmarks.length<33)return null;
      const need=[0,11,12,15,16,23,24,25,26,27,28];if(need.some(i=>!landmarks[i]||!Number.isFinite(landmarks[i].x)||!Number.isFinite(landmarks[i].y)||(landmarks[i].visibility??1)<.50))return null;
      const p=i=>({x:1-landmarks[i].x,y:landmarks[i].y}),head=p(0),ls=p(11),rs=p(12),lw=p(15),rw=p(16),lh=p(23),rh=p(24),la=p(27),ra=p(28),lk=p(25),rk=p(26),hip={x:(lh.x+rh.x)/2,y:(lh.y+rh.y)/2},shoulder={x:(ls.x+rs.x)/2,y:(ls.y+rs.y)/2},foot={x:(la.x+ra.x)/2,y:Math.max(la.y,ra.y)},width=Math.hypot(ls.x-rs.x,ls.y-rs.y),height=foot.y-head.y;
      if(width<.085||width>.65||height<.42||height>.96||head.y<.015||foot.y>.99||[ls,rs,la,ra].some(p=>p.x<.025||p.x>.975))return null;
      const angle=(a,b,c)=>{const ax=a.x-b.x,ay=a.y-b.y,bx=c.x-b.x,by=c.y-b.y;return Math.acos(Math.max(-1,Math.min(1,(ax*bx+ay*by)/(Math.hypot(ax,ay)*Math.hypot(bx,by)||1))))*180/Math.PI;};
      const angle3=(ia,ib,ic)=>{const a=worldLandmarks[ia],b=worldLandmarks[ib],c=worldLandmarks[ic],v=[a.x-b.x,a.y-b.y,a.z-b.z],w=[c.x-b.x,c.y-b.y,c.z-b.z];return Math.acos(Math.max(-1,Math.min(1,v.reduce((s,n,i)=>s+n*w[i],0)/(Math.hypot(...v)*Math.hypot(...w)||1))))*180/Math.PI;},has3=worldLandmarks?.length===33&&[23,24,25,26,27,28].every(i=>['x','y','z'].every(k=>Number.isFinite(worldLandmarks[i]?.[k])));return{head,ls,rs,lw,rw,lh,rh,la,ra,lk,rk,hip,shoulder,foot,width,height,kneeL:has3?angle3(23,25,27):angle(lh,lk,la),kneeR:has3?angle3(24,26,28):angle(rh,rk,ra)};
    }
    extract(body){const b=this.baseline,w=b.width;return{leftUp:(body.shoulder.y-body.lw.y)/w,rightUp:(body.shoulder.y-body.rw.y)/w,leftOut:(body.shoulder.x-body.lw.x)/w,rightOut:(body.rw.x-body.shoulder.x)/w,step:(body.hip.x-b.hip.x)/w,footShift:((body.la.x+body.ra.x)/2-b.foot.x)/w,lean:(body.shoulder.x-body.hip.x)/w,drop:(body.hip.y-b.hip.y)/w,knee:Math.min(body.kneeL,body.kneeR),cross:(body.lw.x-body.rw.x)/w,handY:((body.lw.y+body.rw.y)/2-body.shoulder.y)/w,lwX:(body.lw.x-b.hip.x)/w,lwY:(body.lw.y-b.hip.y)/w,rwX:(body.rw.x-b.hip.x)/w,rwY:(body.rw.y-b.hip.y)/w};}
    match(move,f){const high=[.30,.40,.48][this.level],min=(...v)=>Math.max(0,Math.min(1,...v)),up=v=>(v-high+.3)/.4;
      switch(move){case'up':return min(up(f.leftUp),up(f.rightUp));case'leftUp':return min(up(f.leftUp),(.25-f.rightUp)/.55);case'rightUp':return min(up(f.rightUp),(.25-f.leftUp)/.55);case'open':return min((f.leftOut-.62)/.48,(f.rightOut-.62)/.48,(.55-Math.abs(f.leftUp))/.35,(.55-Math.abs(f.rightUp))/.35);case'left':return min((-f.step-.20)/.26,(-f.footShift-.15)/.22);case'right':return min((f.step-.20)/.26,(f.footShift-.15)/.22);case'cross':return min((f.cross+.03)/.22,(.70-Math.abs(f.handY-.25))/.40);case'squat':return min((f.drop-.09)/.20,(158-f.knee)/28);case'leanLeft':return min((-f.lean-.12)/.22,(.40-Math.abs(f.footShift))/.25);case'leanRight':return min((f.lean-.12)/.22,(.40-Math.abs(f.footShift))/.25);default:return 0;}
    }
    tick(now){
      if(this.done)return;const dt=Math.max(0,Math.min(100,now-(this.lastTick||now)));this.lastTick=now;
      if(this.phase==='playing'&&now-this.lastPoseAt>450){this.phase='lost';this.feedback='Corpo fora do enquadramento. A música está pausada.';this.recovery=0;this.hold=0;this.holdSamples=0;}
      if(this.phase==='countdown'&&now-this.lastPoseAt>450){this.phase='lost';this.recovery=0;return;}
      if(this.phase==='countdown'&&now>=this.countdownUntil){this.phase='playing';this.feedback='Siga a demonstração';this.originFeatures=this.features;}
      if(this.phase!=='playing')return;this.activeMs+=dt;
      const next=Math.min(this.phrases.length,Math.floor(this.activeMs/this.duration));while(this.index<next){const item=this.phrases[this.index];if(!item.hit){item.miss=true;this.misses++;this.combo=0;}this.index++;this.hold=0;this.holdSamples=0;this.originFeatures=this.features;}
      if(this.index>=this.phrases.length){this.done=true;this.phase='done';this.feedback='Música concluída';}
    }
    observe(landmarks,capturedAt,now=capturedAt,frameId=capturedAt,worldLandmarks=null){
      this.tick(now);if(this.done||capturedAt<=this.lastInputAt||frameId===this.lastFrameId||now-capturedAt>650||capturedAt>now+30)return false;this.lastInputAt=capturedAt;this.lastFrameId=frameId;
      const body=WorldDanceBody.body(landmarks,worldLandmarks);if(!body){this.hold=0;this.holdSamples=0;this.recovery=0;if(this.phase==='calibration'){this.calibration=[];this.stable=0;this.feedback='Mostre o corpo inteiro, da cabeça aos pés, de frente para a câmera.';}return false;}
      const previousAt=this.lastPoseAt;this.lastPoseAt=now;this.body=body;
      if(this.phase==='calibration'){
        if(body.kneeL<155||body.kneeR<155||body.lw.y<body.shoulder.y||body.rw.y<body.shoulder.y){this.calibration=[];this.stable=0;this.feedback='Fique em pé, braços relaxados, e olhe para a câmera.';return false;}
        if(previousAt&&now-previousAt>650)this.calibration=[];const first=this.calibration[0];if(first&&(Math.hypot(body.hip.x-first.body.hip.x,body.hip.y-first.body.hip.y)>.035||Math.abs(body.width-first.body.width)>.035))this.calibration=[];
        this.calibration.push({body,at:now});this.stable=Math.min(1,(now-this.calibration[0].at)/1800);this.feedback='Corpo reconhecido. Fique parado por um instante…';
        if(this.calibration.length>=12&&this.stable>=1){const list=this.calibration.map(x=>x.body),average=(fn)=>list.reduce((s,p)=>s+fn(p),0)/list.length;this.baseline={width:average(p=>p.width),height:average(p=>p.height),hip:{x:average(p=>p.hip.x),y:average(p=>p.hip.y)},foot:{x:average(p=>p.foot.x),y:average(p=>p.foot.y)}};this.features=this.extract(body);this.originFeatures=this.features;this.phase='countdown';this.countdownUntil=now+3000;this.feedback='Calibrado. Prepare-se!';}
        return true;
      }
      this.features=this.extract(body);if(this.manual||this.phase==='paused')return true;
      if(this.phase==='lost'){if(previousAt&&now-previousAt>550)this.recovery=0;if(++this.recovery>=4){this.phase='countdown';this.countdownUntil=now+1500;this.feedback='Corpo encontrado. Vamos continuar…';}return true;}
      if(this.phase!=='playing'||this.phrases[this.index]?.hit)return true;
      const offset=this.activeMs%this.duration,latency=Math.max(0,now-capturedAt),at=Math.max(0,offset-latency);const item=this.phrases[this.index],quality=this.match(item.move,this.features),origin=this.originFeatures||this.features,energy=Math.max(...['lwX','lwY','rwX','rwY','step','drop','lean'].map(k=>Math.abs(this.features[k]-origin[k])));
      item.moved ||= energy>.18;
      if(at<this.beat*.80||at>this.beat*3.25){this.hold=0;this.holdSamples=0;return true;}
      if(quality>=.72&&item.moved){this.hold+=Math.min(200,now-(previousAt||now));this.holdSamples++;if(this.hold>=240&&this.holdSamples>=2){item.hit=true;item.quality=quality;this.hits++;this.weight+=quality;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);this.score+=Math.round(quality*100)+Math.min(50,this.combo*5);this.feedback=quality>.92?'MOVIMENTO PERFEITO!':'BOM MOVIMENTO!';}}else{this.hold=0;this.holdSamples=0;}
      return true;
    }
    pause(now){this.tick(now);if(this.done)return;this.phase='paused';this.manual=true;this.hold=0;this.holdSamples=0;this.feedback='PAUSADO';}
    resume(now){if(this.done||!this.baseline)return;this.manual=false;this.phase='lost';this.recovery=0;this.lastTick=now;this.feedback='Volte ao enquadramento para continuar.';}
    snapshot(){const current=this.phrases[Math.min(this.index,this.phrases.length-1)],next=this.phrases[this.index+1];return{mode:'body-camera',phase:this.phase,level:this.level,bpm:this.bpm,time:this.activeMs/1000,end:this.phrases.length*this.duration/1000,score:this.score,hits:this.hits,misses:this.misses,combo:this.combo,bestCombo:this.bestCombo,total:this.phrases.length,accuracy:this.weight/this.phrases.length,done:this.done,calibrated:!!this.baseline,calibration:this.stable,index:this.index,group:current?.group,repetition:current?.rep,beatInBar:Math.floor(this.activeMs/this.beat)%4+1,move:current?.move,label:WorldDanceBody.moves[current?.move]||'',next:WorldDanceBody.moves[next?.move]||'',progress:this.activeMs%this.duration/this.duration,feedback:this.feedback,countdownUntil:this.countdownUntil,lastPoseAt:this.lastPoseAt};}
  }

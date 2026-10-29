/* Local similarity tracking for an object explicitly selected by the player.
 * No upload, background detection or automatic replacement of a lost object. */
(()=>{'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function gray(rgba,w,h){const out=new Float32Array(w*h);for(let i=0,j=0;i<out.length;i++,j+=4)out[i]=rgba[j]*.299+rgba[j+1]*.587+rgba[j+2]*.114;const temp=out.slice();for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;temp[i]=(out[i-1]+2*out[i]+out[i+1])*.25;}for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;out[i]=(temp[i-w]+2*temp[i]+temp[i+w])*.25;}return out;}
function value(im,w,h,x,y){if(x<1||y<1||x>=w-2||y>=h-2)return NaN;const a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b,i=b*w+a;return im[i]*(1-u)*(1-v)+im[i+1]*u*(1-v)+im[i+w]*(1-u)*v+im[i+w+1]*u*v;}
function descriptor(im,w,h,cx,cy,angle=0,scale=1,size=7,step=1){const out=[],r=(size-1)/2,c=Math.cos(angle)*scale,s=Math.sin(angle)*scale;let sum=0;for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){const v=value(im,w,h,cx+c*x*step-s*y*step,cy+s*x*step+c*y*step);if(!Number.isFinite(v))return null;out.push(v);sum+=v;}const mean=sum/out.length;let mag=0;for(let i=0;i<out.length;i++){out[i]-=mean;mag+=out[i]*out[i];}if(mag<out.length*16)return null;mag=Math.sqrt(mag);return out.map(v=>v/mag);}
function dot(a,b){if(!a||!b)return -1;let n=0;for(let i=0;i<a.length;i++)n+=a[i]*b[i];return n;}
class ObjectTracker{
 constructor(){this.ready=false;this.lost=false;this.bad=0;this.matches=0;}
 initialize(rgba,w,h,roi){this.ready=false;this.lost=false;this.bad=0;this.matches=0;this.w=w;this.h=h;const im=gray(rgba,w,h),r={x:clamp(roi.x,8,w-32),y:clamp(roi.y,8,h-32),w:clamp(roi.w,24,Math.min(160,w-16)),h:clamp(roi.h,24,Math.min(160,h-16))};r.w=Math.min(r.w,w-r.x-8);r.h=Math.min(r.h,h-r.y-8);this.roi=r;this.reference={x:r.x+r.w/2,y:r.y+r.h/2,angle:0,scale:1};this.pose={...this.reference};this.step=Math.max(2,Math.min(r.w,r.h)/13);this.template=descriptor(im,w,h,this.pose.x,this.pose.y,0,1,11,this.step);if(!this.template)throw Error('Escolha uma região com detalhes visíveis no objeto.');
  const candidates=[];for(let y=Math.ceil(r.y+5);y<r.y+r.h-5;y+=2)for(let x=Math.ceil(r.x+5);x<r.x+r.w-5;x+=2){let a=0,b=0,c=0;for(let yy=-2;yy<=2;yy++)for(let xx=-2;xx<=2;xx++){const i=(y+yy)*w+x+xx,gx=(im[i+1]-im[i-1])*.5,gy=(im[i+w]-im[i-w])*.5;a+=gx*gx;b+=gy*gy;c+=gx*gy;}const score=(a+b-Math.sqrt((a-b)*(a-b)+4*c*c))/2;if(score>130)candidates.push({x,y,score});}
  candidates.sort((a,b)=>b.score-a.score);this.features=[];for(const p of candidates){if(this.features.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<7))continue;const patch=descriptor(im,w,h,p.x,p.y);if(patch)this.features.push({x:p.x,y:p.y,patch});if(this.features.length===28)break;}if(this.features.length<7)throw Error('Objeto sem detalhes suficientes. Selecione botões, desenho ou cantos bem iluminados.');this.ready=true;this.matches=this.features.length;this.axis=null;this.previous=WarObjectFlow.pyramid(im,w,h);this.coarseLevel=this.previous.length-1;const level=this.previous[this.coarseLevel],div=2**this.coarseLevel;this.coarseTemplate=descriptor(level.data,level.w,level.h,this.pose.x/div,this.pose.y/div,0,1,11,this.step/div);this.recoveryIndex=0;this.recoveryConfirm=0;this.recoveryProbe=0;this.recoveryPose=null;return this.result(1);
 }
 setAxis(axis){
  if(!this.ready||!axis||!['tip','base'].every(k=>axis[k]&&Number.isFinite(axis[k].x+axis[k].y)&&axis[k].x>=this.roi.x&&axis[k].x<=this.roi.x+this.roi.w&&axis[k].y>=this.roi.y&&axis[k].y<=this.roi.y+this.roi.h)||Math.hypot(axis.tip.x-axis.base.x,axis.tip.y-axis.base.y)<12)throw Error('Marque a ponta e o apoio em dois pontos separados dentro da caixa.');
  this.axis={tip:{...axis.tip},base:{...axis.base}};
 }
 result(confidence){const p=this.pose,tip=this.axis?WarObjectFlow.transform(this.reference,p,this.axis.tip):p,base=this.axis?WarObjectFlow.transform(this.reference,p,this.axis.base):p,corners=[[0,0],[1,0],[1,1],[0,1]].map(([x,y])=>{const q=WarObjectFlow.transform(this.reference,p,{x:this.roi.x+x*this.roi.w,y:this.roi.y+y*this.roi.h});return{x:q.x/this.w,y:q.y/this.h};});return{x:tip.x/this.w,y:tip.y/this.h,centerX:p.x/this.w,centerY:p.y/this.h,tip:{x:tip.x/this.w,y:tip.y/this.h},base:{x:base.x/this.w,y:base.y/this.h},dx:0,dy:0,scale:Math.max(this.roi.w,this.roi.h)/this.w*p.scale,angle:p.angle,confidence,matches:this.matches,corners,axis:!!this.axis,recovered:!!this.recovered,roi:{...this.roi},source:'object'};}

 exportTemplate(){if(!this.ready)return null;return{version:2,w:this.w,h:this.h,roi:{...this.roi},axis:this.axis?JSON.parse(JSON.stringify(this.axis)):null,reference:{...this.reference},step:this.step,template:[...this.template],coarseTemplate:this.coarseTemplate?[...this.coarseTemplate]:null,coarseLevel:this.coarseLevel||2,features:this.features.map(p=>({x:p.x,y:p.y,patch:[...p.patch]}))};}
 importTemplate(t){const vec=(a,n)=>Array.isArray(a)&&a.length===n&&a.every(x=>Number.isFinite(x)&&Math.abs(x)<=1.001)&&Math.abs(a.reduce((s,x)=>s+x*x,0)-1)<.02;if(![1,2].includes(t?.version)||t.w!==320||t.h!==240||!t.roi||!['x','y','w','h'].every(k=>Number.isFinite(t.roi[k]))||t.roi.x<8||t.roi.y<8||t.roi.w<24||t.roi.h<24||t.roi.w>160||t.roi.h>160||t.roi.x+t.roi.w>312||t.roi.y+t.roi.h>232||!Number.isFinite(t.step)||t.step<2||t.step>13||!vec(t.template,121)||!Array.isArray(t.features)||t.features.length<7||t.features.length>28||t.features.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<t.roi.x||p.x>t.roi.x+t.roi.w||p.y<t.roi.y||p.y>t.roi.y+t.roi.h||!vec(p.patch,49)))throw Error('Cadastro do brinquedo inválido. Capture novamente.');this.w=t.w;this.h=t.h;this.roi={...t.roi};this.reference={x:t.roi.x+t.roi.w/2,y:t.roi.y+t.roi.h/2,angle:0,scale:1};this.pose={...this.reference};this.step=t.step;this.template=t.template.slice();this.coarseTemplate=vec(t.coarseTemplate,121)?t.coarseTemplate.slice():null;this.coarseLevel=t.coarseLevel===3?3:2;this.features=t.features.map(p=>({...p,patch:p.patch.slice()}));this.bad=this.matches=0;this.lost=false;this.ready=true;this.previous=null;this.axis=null;if(t.axis)this.setAxis(t.axis);this.recoveryIndex=0;this.recoveryConfirm=0;this.recoveryProbe=0;this.recoveryPose=null;}
 validate(im,pose,threshold=.72){
  const matches=[];
  for(const p of this.features){const q=WarObjectFlow.transform(this.reference,pose,p);if(dot(p.patch,descriptor(im,this.w,this.h,q.x,q.y,pose.angle,pose.scale))>=threshold)matches.push(p);}
  return matches.length>=Math.max(6,Math.ceil(this.features.length*.5))?matches:null;
 }
 search(im,old,recovering,pyramid){
  const fullScore=p=>dot(this.template,descriptor(im,this.w,this.h,p.x,p.y,p.angle,p.scale,11,this.step)),level=this.coarseLevel||2,coarse=pyramid[level],div=2**level,score=this.coarseTemplate?p=>dot(this.coarseTemplate,descriptor(coarse.data,coarse.w,coarse.h,p.x/div,p.y/div,p.angle,p.scale,11,this.step/div)):fullScore;
  let best={...old},quality=score(best);if(recovering&&fullScore(this.reference)>.94)return{pose:{...this.reference},quality:fullScore(this.reference)};
  if(recovering){
   // Align angle before the coarse position search: otherwise a rotated,
   // detailed toy can give a higher coarse score at unrelated background pixels.
   let exact=fullScore(best);for(let ia=-3;ia<=3;ia++)for(const dy of[-4,0,4])for(const dx of[-4,0,4]){const p={...old,x:old.x+dx,y:old.y+dy,angle:old.angle+ia*.05},q=fullScore(p);if(q>exact){best=p;exact=q;}}
   const aligned={...best};for(const da of[-.025,0,.025])for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const p={...aligned,x:aligned.x+dx,y:aligned.y+dy,angle:aligned.angle+da},q=fullScore(p);if(q>exact){best=p;exact=q;}}
   if(exact>=.70&&this.validate(im,best,.78))return{pose:best,quality:exact};
   quality=score(best);
  }
  if(quality<.90){
   // Coarse translation precedes small rotation/scale refinement. The former
   // Cartesian 5*3*16*16 search ran even for a little sensor noise.
   const stride=recovering?8:6,radius=recovering?96:48;
   for(let dy=-radius;dy<=radius;dy+=stride)for(let dx=-radius;dx<=radius;dx+=stride){const p={...old,x:old.x+dx,y:old.y+dy},q=score(p);if(q>quality){best=p;quality=q;}}
   if(recovering&&quality<.7){
    // Bounded slices scan for the SAME stored appearance; never recapture a
    // background or another arbitrary object after loss.
    const cols=Math.ceil((this.w-24)/8),rows=Math.ceil((this.h-24)/8);
    for(let n=0;n<240;n++){const i=this.recoveryIndex++%(cols*rows),p={...old,x:12+(i%cols)*8,y:12+Math.floor(i/cols)*8},q=score(p);if(q>quality){best=p;quality=q;}}
   }
   for(const [position,rotation,scale]of [[4,.14,.06],[2,.05,.02]]){
    const near={...best};for(const da of[-rotation,0,rotation])for(const ds of[1-scale,1,1+scale])for(const dy of[-position,0,position])for(const dx of[-position,0,position]){
     const p={x:near.x+dx,y:near.y+dy,angle:near.angle+da,scale:near.scale*ds};if(p.scale<.55||p.scale>1.8)continue;const q=score(p);if(q>quality){best=p;quality=q;}
    }
   }
  }
  if(this.coarseTemplate){
   const near={...best};quality=fullScore(best);
   for(const da of[-.035,0,.035])for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const p={...near,x:near.x+dx,y:near.y+dy,angle:near.angle+da},q=fullScore(p);if(q>quality){best=p;quality=q;}}
  }
  return{pose:best,quality};
 }
 recoverySeed(){
  // Reaching for the frozen preview can rotate or move a toy in depth. A
  // translation-only search around the original angle could never find it
  // again. Try one bounded pose hypothesis per frame, then require the same
  // feature identity twice before resuming input.
  const angles=[0,.2,-.2,.4,-.4,.6,-.6,.8,-.8,1,-1,1.2,-1.2],scales=[1,.75,1.3],probe=this.recoveryProbe++%(angles.length*scales.length);
  return {...this.pose,angle:this.pose.angle+angles[probe%angles.length],scale:this.pose.scale*scales[Math.floor(probe/angles.length)]};
 }
 track(rgba){
  if(!this.ready)return null;
  const im=gray(rgba,this.w,this.h),pyramid=WarObjectFlow.pyramid(im,this.w,this.h),old=this.lost?(this.recoveryPose||this.recoverySeed()):this.pose;
  let candidate=null,quality=dot(this.template,descriptor(im,this.w,this.h,old.x,old.y,old.angle,old.scale,11,this.step));
  if(quality>.985||this.lost&&this.recoveryPose&&quality>=.70&&this.validate(im,old,.78))candidate={...old};
  else if(this.previous&&!this.lost){
   const pairs=[];
   for(const p of this.features){const q=WarObjectFlow.transform(this.reference,this.pose,p),next=WarObjectFlow.flow(this.previous,pyramid,q);if(!next)continue;const back=WarObjectFlow.flow(pyramid,this.previous,next,q);if(!back||Math.hypot(back.x-q.x,back.y-q.y)>1.3)continue;pairs.push({x:p.x,y:p.y,u:next.x,v:next.y});}
   const fit=WarObjectFlow.fit(pairs,this.reference);if(fit?.pose&&fit.inliers.length>=Math.max(6,Math.ceil(this.features.length*.5))){candidate=fit.pose;quality=dot(this.template,descriptor(im,this.w,this.h,candidate.x,candidate.y,candidate.angle,candidate.scale,11,this.step));}
  }
  let matches=candidate&&quality>=.62?this.validate(im,candidate):null;
  if(!matches){const found=this.search(im,old,this.lost||!this.previous,pyramid);candidate=found.pose;quality=found.quality;matches=quality>=.70?this.validate(im,candidate,.78):null;}
  this.quality=quality;
  const plausible=candidate&&candidate.scale>=.55&&candidate.scale<=1.8&&(this.lost||Math.hypot(candidate.x-old.x,candidate.y-old.y)<=48&&Math.abs(candidate.angle-old.angle)<.5);
  if(!matches||!plausible){this.matches=0;this.bad++;this.recoveryConfirm=0;this.recoveryPose=null;if(this.bad>=3)this.lost=true;return null;}
  this.matches=matches.length;this.recovered=false;
  if(this.lost){
   const last=this.recoveryPose;this.recoveryConfirm=last&&Math.hypot(last.x-candidate.x,last.y-candidate.y)<12?this.recoveryConfirm+1:1;this.recoveryPose=candidate;
   if(this.recoveryConfirm<2){this.matches=0;return null;}this.recovered=true;
  }
  if(this.w===320&&this.coarseLevel!==3){const level=pyramid[3],div=8,template=descriptor(level.data,level.w,level.h,candidate.x/div,candidate.y/div,candidate.angle,candidate.scale,11,this.step/div);if(template){this.coarseTemplate=template;this.coarseLevel=3;}}
  this.pose=candidate;this.bad=0;this.lost=false;this.recoveryConfirm=0;this.previous=pyramid;this.recoveryProbe=0;this.recoveryPose=null;return this.result(quality);
 }

}
if(typeof module!=='undefined'&&module.exports)module.exports={ObjectTracker};else globalThis.WarObjectTracker=ObjectTracker;
})();

/* Sparse pyramidal Lucas–Kanade, confined to the registered object's corners.
 * Forward/backward validation + reference descriptors in ObjectTracker reject
 * drift. Frames live only in worker memory; no image is persisted or uploaded.
 * Algorithm reference: docs.opencv.org/4.10.0/db/d7f/tutorial_js_lucas_kanade.html
 */
(()=>{'use strict';
const sample=(im,x,y)=>{
 if(x<1||y<1||x>=im.w-2||y>=im.h-2)return NaN;
 const a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b,i=b*im.w+a,d=im.data;
 return d[i]*(1-u)*(1-v)+d[i+1]*u*(1-v)+d[i+im.w]*(1-u)*v+d[i+im.w+1]*u*v;
};
function pyramid(data,w,h){
 const levels=[{data,w,h}];
 while(levels.length<(w>=300&&h>=220?4:3)){const prev=levels.at(-1),w=Math.floor(prev.w/2),h=Math.floor(prev.h/2),data=new Float32Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*2*prev.w+x*2;data[y*w+x]=(prev.data[i]+prev.data[i+1]+prev.data[i+prev.w]+prev.data[i+prev.w+1])*.25;}
  levels.push({data,w,h});
 }return levels;
}
function flow(prev,next,point,guess=point){
 const top=Math.min(prev.length,next.length)-1;let q={x:guess.x/2**top,y:guess.y/2**top};
 for(let level=top;level>=0;level--){
  if(level<top){q.x*=2;q.y*=2;}const p={x:point.x/2**level,y:point.y/2**level},a=prev[level],b=next[level],patch=[];
  let gxx=0,gxy=0,gyy=0;
  for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++){
   const px=p.x+x,py=p.y+y,v=sample(a,px,py),gx=(sample(a,px+1,py)-sample(a,px-1,py))*.5,gy=(sample(a,px,py+1)-sample(a,px,py-1))*.5;
   if(!Number.isFinite(v+gx+gy))return null;patch.push({x,y,v,gx,gy});gxx+=gx*gx;gxy+=gx*gy;gyy+=gy*gy;
  }
  const det=gxx*gyy-gxy*gxy;if(det<1e-5||(gxx+gyy-Math.sqrt((gxx-gyy)**2+4*gxy*gxy))*.5<20)return null;
  for(let it=0;it<12;it++){
   let bx=0,by=0;for(const t of patch){const d=t.v-sample(b,q.x+t.x,q.y+t.y);if(!Number.isFinite(d))return null;bx+=t.gx*d;by+=t.gy*d;}
   const dx=(gyy*bx-gxy*by)/det,dy=(gxx*by-gxy*bx)/det;
   if(!Number.isFinite(dx+dy)||Math.hypot(dx,dy)>5)return null;q.x+=dx;q.y+=dy;if(dx*dx+dy*dy<.0009)break;
  }
 }return q;
}
function transform(ref,pose,p){const c=Math.cos(pose.angle)*pose.scale,s=Math.sin(pose.angle)*pose.scale;return{x:pose.x+c*(p.x-ref.x)-s*(p.y-ref.y),y:pose.y+s*(p.x-ref.x)+c*(p.y-ref.y)};}
function fit(pairs,reference){
 if(pairs.length<6)return null;
 const solve=items=>{
  const n=items.length,mean=k=>items.reduce((s,p)=>s+p[k],0)/n,rx=mean('x'),ry=mean('y'),tx=mean('u'),ty=mean('v');let a=0,b=0,d=0;
  for(const p of items){const x=p.x-rx,y=p.y-ry,u=p.u-tx,v=p.v-ty;a+=x*u+y*v;b+=x*v-y*u;d+=x*x+y*y;}
  if(d<30)return null;a/=d;b/=d;return{x:tx+a*(reference.x-rx)-b*(reference.y-ry),y:ty+b*(reference.x-rx)+a*(reference.y-ry),angle:Math.atan2(b,a),scale:Math.hypot(a,b)};
 };
 let best=[];
 // Deterministic hypotheses, no random per-frame motion or test-only paths.
 for(let i=0;i<pairs.length;i++)for(let j=i+1;j<Math.min(pairs.length,i+7);j++){
  const pose=solve([pairs[i],pairs[j]]);if(!pose)continue;
  const inliers=pairs.filter(p=>{const q=transform(reference,pose,p);return Math.hypot(q.x-p.u,q.y-p.v)<2.4;});if(inliers.length>best.length)best=inliers;
 }
 return best.length>=6?{pose:solve(best),inliers:best}:null;
}
const api={pyramid,flow,transform,fit};
globalThis.WarObjectFlow=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();

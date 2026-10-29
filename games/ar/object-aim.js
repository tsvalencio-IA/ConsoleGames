/* Five deliberately different pointing poses learn mirrored axes, cross-axis
 * coupling and the player's comfortable range. Never accepts a stationary
 * object as a successful five-point calibration. */
(()=>{'use strict';
const targets=[{name:'CENTRO',x:.5,y:.48},{name:'ESQUERDA',x:.27,y:.48},{name:'DIREITA',x:.73,y:.48},{name:'ACIMA',x:.5,y:.27},{name:'ABAIXO',x:.5,y:.69}];
function valid(map){return map&&map.version===1&&['xx','xy','yx','yy'].every(k=>Number.isFinite(map[k])&&Math.abs(map[k])<30)&&Number.isFinite(map.error)&&map.error<.06;}
function solve(points){
 if(points.length!==5)throw Error('Complete os cinco pontos.');
 const center=points[0],mean=k=>points.reduce((s,p)=>s+p[k],0)/5,mx=mean('x'),my=mean('y');let a=0,b=0,c=0,ux=0,uy=0,vx=0,vy=0;
 for(let i=0;i<5;i++){const x=points[i].x-mx,y=points[i].y-my,u=targets[i].x-.5,v=targets[i].y-.48;a+=x*x;b+=x*y;c+=y*y;ux+=x*u;uy+=y*u;vx+=x*v;vy+=y*v;}
 const det=a*c-b*b;
 if(det<1e-7||Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x))<.035||Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y))<.035)throw Error('Movimento insuficiente. Aponte para cada direção com mais distância entre elas.');
 const map={version:1,xx:(c*ux-b*uy)/det,xy:(a*uy-b*ux)/det,yx:(c*vx-b*vy)/det,yy:(a*vy-b*vx)/det,error:0};
 map.error=Math.max(...points.map((p,i)=>Math.hypot(.5+map.xx*(p.x-center.x)+map.xy*(p.y-center.y)-targets[i].x,.48+map.yx*(p.x-center.x)+map.yy*(p.y-center.y)-targets[i].y)));
 if(!valid(map))throw Error('Os pontos ficaram inconsistentes. Refaça mantendo o celular e o corpo na mesma posição.');return map;
}
class Calibration{
 constructor(){this.points=[];this.samples=[];this.lastAt=-Infinity;this.progress=0;this.waitUntil=0;this.error='';}
 get target(){return targets[this.points.length]||null;}
 consume(object,at){
  if(!object||!Number.isFinite(object.x+object.y)||object.confidence<.68){this.samples=[];this.progress=0;return null;}
  if(at<=this.lastAt||at<this.waitUntil)return null;this.lastAt=at;
  const previous=this.points.at(-1);if(previous&&Math.hypot(object.x-previous.x,object.y-previous.y)<.025){this.samples=[];this.progress=0;return null;}
  const last=this.samples.at(-1);if(last&&Math.hypot(last.x-object.x,last.y-object.y)>.018)this.samples=[];
  this.samples.push({x:object.x,y:object.y,at});while(this.samples.length>30)this.samples.shift();
  const elapsed=at-this.samples[0].at;this.progress=Math.min(1,elapsed/650);
  if(this.samples.length<5||elapsed<650)return null;
  const mean=k=>this.samples.reduce((s,p)=>s+p[k],0)/this.samples.length,point={x:mean('x'),y:mean('y')};
  if(this.samples.some(p=>Math.hypot(p.x-point.x,p.y-point.y)>.014)){this.samples=[];this.progress=0;return null;}
  this.points.push(point);this.samples=[];this.progress=0;this.waitUntil=at+500;
  if(this.target)return null;
  try{return{map:solve(this.points),center:this.points[0]};}catch(error){this.error=error.message;this.points=[];this.waitUntil=at+1400;return null;}
 }
}
const api={Calibration,targets,solve,valid};if(typeof module!=='undefined'&&module.exports)module.exports=api;else globalThis.WarObjectAim=api;
})();

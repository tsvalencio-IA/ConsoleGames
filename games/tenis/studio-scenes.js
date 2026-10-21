/* Studio Scenes v1 — native Canvas environment finish per game.
   Paints only background regions, before characters/HUD.
   No external assets, no gameplay collision changes, no Firebase writes.
   Designed to stay lightweight on mobile GPUs. */
(()=>{
"use strict";
const id=window.CONSOLE_GAME_ID;
const valid=new Set(["drive","box_pro","tennis","ar_truck_sim","usarmy_flight_sim"]);
if(!valid.has(id))return;
function circle(ctx,x,y,r,color,alpha=1){
 ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
}
function oval(ctx,x,y,rx,ry,color,alpha=1){
 ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
}
function cloud(ctx,x,y,size,alpha=.23){
 const grad=ctx.createRadialGradient(x,y,2,x,y,size*1.65);
 grad.addColorStop(0,"rgba(255,255,255,"+alpha+")");
 grad.addColorStop(1,"rgba(255,255,255,0)");
 ctx.fillStyle=grad;
 oval(ctx,x,y,size*1.65,size*.56,grad);
}
function kart(ctx,w,h,logic){
 if(logic.state!=="RACE")return;
 const horizon=h*.35;
 const shift=((Number(logic.pos)||0)*.001)%w;
 ctx.save();
 // Background environment is animated slowly, not a static wallpaper.
 for(let i=0;i<5;i++){
   const x=((i*249 + w*.11-shift*.06)%(w+300)+w+300)%(w+300)-140;
   cloud(ctx,x,horizon*(.18+.13*(i%2)),w*(.075+(i%3)*.015),.18);
 }
 const sunX=w*.78,sunY=horizon*.34,r=Math.min(w,h)*.085;
 const glow=ctx.createRadialGradient(sunX,sunY,0,sunX,sunY,r*2.6);
 glow.addColorStop(0,"rgba(255,241,180,.28)");
 glow.addColorStop(.35,"rgba(255,244,199,.13)");
 glow.addColorStop(1,"rgba(255,245,205,0)");
 ctx.fillStyle=glow;ctx.fillRect(sunX-r*2.6,0,r*5.2,horizon);
 // Peripheral vegetation silhouettes — the car and asphalt remain untouched.
 const grass=["#205c39","#236c41","#357e4b"];
 for(let i=0;i<10;i++){
   const depth=(i+1)/10;
   const treeH=depth*h*.19;
   const phase=(i*185 + (Number(logic.pos)||0)*.03);
   const x=(i%2===0?-1:1)*(w*.02+(phase%(w*.09)));
   const px=i%2===0?Math.min(w*.10,Math.abs(x)):w-Math.min(w*.10,Math.abs(x));
   const y=h*.50+depth*h*.52;
   ctx.fillStyle="#604631";ctx.fillRect(px-1,y-treeH*.43,Math.max(1,treeH*.075),treeH*.43);
   oval(ctx,px,y-treeH*.62,treeH*.35,treeH*.40,grass[i%grass.length],.80);
 }
 ctx.restore();
}
function boxing(ctx,w,h,logic){
 if(!["FIGHT","GAMEOVER","CALIBRATION"].includes(logic.state))return;
 const horizon=h*.60;
 ctx.save();
 const left=ctx.createRadialGradient(w*.2,h*.06,0,w*.2,h*.06,w*.5);
 left.addColorStop(0,"rgba(245,218,163,.20)");left.addColorStop(1,"rgba(245,218,163,0)");
 ctx.fillStyle=left;ctx.fillRect(0,0,w*.7,horizon);
 const right=ctx.createRadialGradient(w*.82,h*.04,0,w*.82,h*.04,w*.45);
 right.addColorStop(0,"rgba(121,206,255,.17)");right.addColorStop(1,"rgba(121,206,255,0)");
 ctx.fillStyle=right;ctx.fillRect(w*.25,0,w*.75,horizon);
 // Ring posts anchored at scene edges, behind fighters and hitboxes.
 for(const px of [w*.05,w*.95]){
   ctx.fillStyle="rgba(11,24,45,.88)";
   const pw=Math.max(7,w*.017);
   ctx.fillRect(px-pw/2,horizon-110,pw,112);
   oval(ctx,px,horizon-110,pw*.80,pw*.55,"#d9edfb",.85);
 }
 for(let i=0;i<11;i++){
   const x=(i+.5)*w/11;
   const y=horizon-15+(i%3)*2;
   oval(ctx,x,y,Math.max(8,w*.035),Math.max(8,h*.022),"#111a2d",.70);
 }
 ctx.restore();
}
function tennis(ctx,w,h,logic){
 if(!["RALLY","SERVE","POINT","END","GAME"].includes(logic.state))return;
 ctx.save();
 // Stadium soffit and distant silhouettes behind the native projection table.
 const gradient=ctx.createLinearGradient(0,0,0,h*.34);
 gradient.addColorStop(0,"rgba(10,26,48,.92)");
 gradient.addColorStop(1,"rgba(23,54,74,0)");
 ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h*.34);
 for(let i=0;i<7;i++){
   const x=(i+.5)*w/7,y=h*.10;
   const halo=ctx.createRadialGradient(x,y,0,x,y,Math.max(20,w*.10));
   halo.addColorStop(0,"rgba(175,239,255,.16)");
   halo.addColorStop(1,"rgba(175,239,255,0)");
   ctx.fillStyle=halo;ctx.fillRect(x-w*.10,0,w*.2,h*.22);
   oval(ctx,x,y,w*.018,Math.max(2,w*.007),"#d6f6fa",.72);
 }
 ctx.restore();
}
function ar(ctx,w,h,logic){
 if(window.ArcadeControls?.mode!=="controls")return;
 ctx.save();
 const horizon=h*.42;
 // Industrial skyline as recognizable mission world landmarks.
 for(let i=0;i<11;i++){
   const bw=w*.03*(1+i%3),baseX=(i*w/10)-(Number(logic.currentHeading)||0)*.38;
   const x=((baseX%(w+bw))+w+bw)%(w+bw)-bw;
   const bh=h*(.06+(i*13%7)*.008);
   ctx.fillStyle=i%2?"rgba(21,58,70,.55)":"rgba(23,68,79,.52)";
   ctx.fillRect(x,horizon-bh,bw,bh);
   if(i%3===0){ctx.fillStyle="rgba(255,209,142,.30)";ctx.fillRect(x+bw*.42,horizon-bh*.8,bw*.14,bh*.18)}
 }
 ctx.restore();
}
function flight(ctx,w,h,logic){
 if(!["PLAYING","CALIBRATION"].includes(logic.state))return;
 ctx.save();
 const x=w*.84,y=h*.14,r=Math.min(w,h)*.12;
 const g=ctx.createRadialGradient(x,y,0,x,y,r*2.4);
 g.addColorStop(0,"rgba(214,244,255,.20)");
 g.addColorStop(.36,"rgba(179,225,255,.10)");
 g.addColorStop(1,"rgba(179,225,255,0)");
 ctx.fillStyle=g;ctx.fillRect(x-r*2.4,0,r*4.8,r*3);
 for(let i=0;i<3;i++){
   const shift=(Number(logic.ship?.speed)||0)*.08;
   const yy=(h*.18+i*h*.11+shift)%Math.max(h,1);
   ctx.strokeStyle="rgba(185,231,255,.08)";ctx.lineWidth=Math.max(1,w*.0017);
   ctx.beginPath();ctx.moveTo(w*.01,yy);ctx.lineTo(w*.09,yy-h*.018);ctx.stroke();
   ctx.beginPath();ctx.moveTo(w*.99,yy);ctx.lineTo(w*.91,yy-h*.018);ctx.stroke();
 }
 ctx.restore();
}
const targets={
 drive:["renderWorld",kart],
 box_pro:["drawArena",boxing],
 tennis:["drawEnvironment",tennis],
 ar_truck_sim:["drawVirtualScene",ar],
 usarmy_flight_sim:["_drawWorld",flight]
};
let installed=false,tries=0;
function install(){
 if(installed)return true;
 const game=(window.Games||[]).find(x=>x.id===id);
 const logic=game?.logic;
 const [method,draw]=targets[id];
 if(!logic||typeof logic[method]!=="function")return false;
 const original=logic[method];
 if(original.__studioScenes)return true;
 logic[method]=function(...args){
   const result=original.apply(this,args);
   const ctx=args[0],w=args[1],h=args[2];
   try{if(ctx&&w>0&&h>0&&this===logic&&window.ArcadePlaySettings?.get().quality!=='low')draw(ctx,w,h,this)}catch(error){
     if(!installed)console.warn("Scene enhancement unavailable:",error);
   }
   return result;
 };
 logic[method].__studioScenes=true;
 installed=true;return true;
}
if(!install()){
 const timer=setInterval(()=>{if(install()||++tries>25)clearInterval(timer)},180);
}
})();
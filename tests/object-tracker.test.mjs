import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
const c={module:{exports:{}}};vm.runInNewContext(fs.readFileSync('games/ar/object-flow.js','utf8'),c);vm.runInNewContext(fs.readFileSync('games/ar/object-tracker.js','utf8'),c);const {ObjectTracker}=c.module.exports;
const w=160,h=120,roi={x:51,y:35,w:58,h:58};
function frame(dx=0,dy=0,angle=0,blank=false){const out=new Uint8ClampedArray(w*h*4);let seed=7241;const texture=new Float32Array(64*64);for(let i=0;i<texture.length;i++){seed=(seed*1664525+1013904223)>>>0;texture[i]=30+(seed%210);}for(let y=0;y<h;y++)for(let x=0;x<w;x++){const ox=x-80-dx,oy=y-64-dy,u=Math.round(ox*Math.cos(angle)+oy*Math.sin(angle)+32),v=Math.round(-ox*Math.sin(angle)+oy*Math.cos(angle)+32),inside=!blank&&u>0&&u<63&&v>0&&v<63;const val=inside?texture[v*64+u]:60+(x+y)%5,j=(y*w+x)*4;out[j]=val;out[j+1]=val;out[j+2]=val;out[j+3]=255;}return out;}
test('selected object tracks translation and rotation, then reacquires only the same registered appearance',()=>{const t=new ObjectTracker();assert(t.initialize(frame(),w,h,roi).matches>=7);let pose;for(let i=1;i<=4;i++){pose=t.track(frame(i*3,-i*2,i*.025));assert(pose,JSON.stringify({step:i,matches:t.matches,quality:t.quality,bad:t.bad}));}assert(Math.abs(pose.x*w-92)<2);assert(Math.abs(pose.y*h-56)<2);assert(pose.angle>.04);for(let i=0;i<3;i++)assert.equal(t.track(frame(0,0,0,true)),null);assert(t.lost);assert.equal(t.matches,0);assert.equal(t.track(frame()),null,'reappearance requires repeated identity matches');assert(t.track(frame()),'the registered object returns without touch recapture');});
test('object calibration rejects an untextured wall rather than following scenery',()=>{const t=new ObjectTracker();assert.throws(()=>t.initialize(new Uint8ClampedArray(w*h*4).fill(200),w,h,roi),/detalhes|Objeto/);assert(!t.ready);});

test('a remembered toy stores validated visual features and requires a new real pixel match',()=>{const pixels=frame(),big=new Uint8ClampedArray(320*240*4);for(let y=0;y<240;y++)for(let x=0;x<320;x++)for(let k=0;k<4;k++)big[(y*320+x)*4+k]=pixels[(Math.floor(y/2)*160+Math.floor(x/2))*4+k];const a=new ObjectTracker();a.initialize(big,320,240,{x:102,y:70,w:116,h:116});const saved=JSON.parse(JSON.stringify(a.exportTemplate())),b=new ObjectTracker();assert(!('image' in saved));b.importTemplate(saved);assert(b.track(big));assert.throws(()=>b.importTemplate({...saved,template:[1]}),/inválido/);for(let i=0;i<3;i++)b.track(new Uint8ClampedArray(big.length).fill(180));assert(b.lost);assert.equal(b.track(big),null);assert(b.track(big));const old={...saved,version:1};delete old.axis;new ObjectTracker().importTemplate(old);});

test('object can be recovered at a different angle after reaching for the calibration screen',()=>{
 const t=new ObjectTracker();t.initialize(frame(),w,h,roi);
 for(let i=0;i<3;i++)t.track(frame(0,0,0,true));assert(t.lost);
 let pose;for(let i=0;i<35&&!pose;i++)pose=t.track(frame(10,-3,.65));
 assert(pose,'same textured object rotated 37 degrees must be recovered without recapturing');
 assert(Math.abs(pose.angle-.65)<.08);assert(Math.abs(pose.x*w-90)<3);for(let i=0;i<15;i++)assert(t.track(frame(10,-3,.65)),'recovered object must remain trackable for neutral calibration, frame '+i);
});

function cameraFrame(dx=0,dy=0,textureSeed=1988){const out=new Uint8ClampedArray(320*240*4),texture=[];let seed=textureSeed;for(let y=0;y<128;y+=4)for(let x=0;x<128;x+=4){seed=(seed*1664525+1013904223)>>>0;texture.push(40+seed%170);}for(let y=0;y<240;y++)for(let x=0;x<320;x++){const u=x-(96+dx),v=y-(56+dy),inside=u>=0&&u<128&&v>=0&&v<128,i=(y*320+x)*4,value=inside?texture[Math.floor(v/4)*32+Math.floor(u/4)]:120;out[i]=out[i+1]=out[i+2]=value;out[i+3]=255;}return out;}
test('five-point camera movement reacquires large left/right and up/down jumps without a touch recapture',()=>{
 const t=new ObjectTracker();t.initialize(cameraFrame(),320,240,{x:108.8,y:64.8,w:102.4,h:103.2});
 for(const [x,y]of[[38,0],[-38,0],[0,-30],[0,30],[0,0]]){let p;for(let i=0;i<80&&!p;i++)p=t.track(cameraFrame(x,y));assert(p,'could not recover '+x+','+y);for(let i=0;i<12;i++)assert(t.track(cameraFrame(x,y)),'unstable after '+x+','+y);assert(Math.abs(p.centerX*320-(160+x))<3);assert(Math.abs(p.centerY*240-(116.4+y))<3);}
});

test('recovery cannot replace the registered toy with a different textured object',()=>{
 const t=new ObjectTracker();t.initialize(cameraFrame(),320,240,{x:108.8,y:64.8,w:102.4,h:103.2});
 for(let i=0;i<42;i++)assert.equal(t.track(cameraFrame(0,0,8117)),null,'unregistered texture must not resume the weapon');assert(t.lost);assert.equal(t.matches,0);
});

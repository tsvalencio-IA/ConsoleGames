import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const c=vm.createContext({});for(const name of ['object-flow','object-tracker','object-views'])vm.runInContext(fs.readFileSync('games/ar/'+name+'.js','utf8'),c);
function frame(seed){const image=new Uint8ClampedArray(320*240*4),texture=[];for(let i=0;i<1024;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;texture.push(40+seed%170);}for(let y=0;y<240;y++)for(let x=0;x<320;x++){const i=(y*320+x)*4,u=x-96,v=y-56,n=u>=0&&u<128&&v>=0&&v<128?texture[Math.floor(v/4)*32+Math.floor(u/4)]:120;image[i]=image[i+1]=image[i+2]=n;image[i+3]=255;}return image;}
const roi={x:108.8,y:64.8,w:102.4,h:103.2},axis={tip:{x:192,y:84},base:{x:128,y:156}};
test('a registered rear reference and front play view remain distinct; recovery needs two identity confirmations',()=>{
 const rear=new c.WarObjectTracker();rear.initialize(frame(7241),320,240,roi);rear.setAxis(axis);
 const bank=new c.WarObjectViews();bank.initialize(frame(1988),320,240,roi,rear.exportTemplate());bank.setAxis(axis);assert.equal(bank.track(frame(1988)).registeredView,'play');
 let first=null,observations=0;for(let i=0;i<35;i++){const p=bank.track(frame(7241));if(p){first=p;break;}observations++;}assert(first);assert(observations>=5,'a different registered view cannot be accepted on one observation');assert.equal(first.registeredView,'reference');assert(Math.abs(first.tip.x-.6)<.01);
 for(let i=0;i<15;i++)assert(bank.track(frame(7241)));const saved=bank.exportTemplate();assert.equal(saved.referenceViews.length,1);assert(saved.axis&&saved.referenceViews[0].axis);assert(!('image' in saved));
 const restored=new c.WarObjectViews();restored.importTemplate(JSON.parse(JSON.stringify(saved)));assert.equal(restored.track(frame(1988)).registeredView,'play');
 const legacy=new c.WarObjectViews();legacy.importTemplate(rear.exportTemplate());assert(legacy.track(frame(7241)),'existing one-view registrations remain supported');
});
test('multiple known views never authorize a third, unregistered object or an unbounded view list',()=>{
 const rear=new c.WarObjectTracker();rear.initialize(frame(7241),320,240,roi);const bank=new c.WarObjectViews();bank.initialize(frame(1988),320,240,roi,rear.exportTemplate());
 for(let i=0;i<90;i++)assert.equal(bank.track(frame(8117)),null);assert.equal(bank.matches,0);
 assert.throws(()=>bank.importTemplate({...bank.exportTemplate(),referenceViews:[rear.exportTemplate(),rear.exportTemplate()]}),/inválidas/);
});

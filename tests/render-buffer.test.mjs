import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
function fixture(){
 const source=fs.readFileSync('games/otthi/src/modules/25-render-init-resize-position-collision.js','utf8');
 const code=source.slice(source.indexOf('  function applyPendingRenderBuffer('),source.indexOf('  function resize('));
 const events=[],renderer={domElement:{width:390,height:844},ratio:1,getPixelRatio(){return this.ratio},setDrawingBufferSize(w,h,dpr){events.push([w,h,dpr]);this.ratio=dpr;this.domElement.width=Math.floor(w*dpr);this.domElement.height=Math.floor(h*dpr);}};
 const c=vm.createContext({renderer,running:true,perf:{lastRenderW:390,lastRenderH:844,appliedDpr:1},Math});vm.runInContext(code,c);
 return {events,renderer,run:code=>vm.runInContext(code,c)};
}
test('render: repeated viewport notifications never clear an unchanged canvas',()=>{
 const f=fixture();for(let i=0;i<30;i++)f.run('queueRenderBuffer(390,844,1);applyPendingRenderBuffer()');assert.deepEqual(f.events,[]);
});
test('render: drawing-buffer changes wait for the replacement frame and use the latest viewport',()=>{
 const f=fixture();f.run('queueRenderBuffer(844,390,.8);queueRenderBuffer(852,393,.7)');assert.deepEqual(f.events,[]);assert.equal(f.renderer.domElement.width,390);
 assert(f.run('applyPendingRenderBuffer()'));assert.deepEqual(f.events,[[852,393,.7]]);assert.equal(f.renderer.domElement.width,Math.floor(852*.7));assert(!f.run('applyPendingRenderBuffer()'));assert.equal(f.events.length,1);
});

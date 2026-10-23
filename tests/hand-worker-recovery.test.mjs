import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

test('a GPU that fails on camera frames retries CPU once and then returns usable results',async()=>{
  const messages=[],created=[];
  const runtime={FilesetResolver:{forVisionTasks:async()=>({})},HandLandmarker:{createFromOptions:async(_vision,options)=>{
    const delegate=options.baseOptions.delegate;created.push(delegate);
    return {close(){},detectForVideo(){if(delegate==='GPU')throw Error('GPU camera upload failed');return {landmarks:[[{x:.5,y:.5}]],handedness:[]};}};
  }}};
  const source=readFileSync('games/ar/hand-tracker-worker.js','utf8').replace("await import('./vendor/hand-tracker/vision_bundle.mjs')",'runtime');
  const gl={getExtension:n=>n==='WEBGL_debug_renderer_info'?{UNMASKED_RENDERER_WEBGL:1}:{loseContext(){}},getParameter:()=> 'Android GPU',RENDERER:1};
  const self={location:{href:'https://test.example/games/ar/hand-tracker-worker.js'},postMessage:m=>messages.push(m)};
  vm.runInNewContext(source,{self,runtime,URL,performance:{now:()=>10},OffscreenCanvas:class{getContext(){return gl;}}});
  await self.onmessage({data:{type:'init'}});assert.equal(messages.at(-1).delegate,'GPU');
  await self.onmessage({data:{type:'frame',frame:{close(){}},timestamp:1}});
  assert.deepEqual(created,['GPU','CPU']);assert(messages.some(m=>m.type==='recovering'));assert.equal(messages.at(-1).delegate,'CPU');
  await self.onmessage({data:{type:'frame',frame:{close(){}},timestamp:2}});
  assert.equal(messages.at(-1).type,'result');assert.equal(messages.at(-1).timestamp,2);
});

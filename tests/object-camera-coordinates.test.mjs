import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const c={window:{}};vm.runInNewContext(fs.readFileSync('games/ar/object-camera-registration.js','utf8'),c);const point=c.window.WarObjectCamera.canvasPoint;
test('rear selection is unmirrored; front selection remains mirrored, including a letterboxed landscape canvas',()=>{
 const canvas={width:320,height:240,getBoundingClientRect:()=>({left:20,top:30,width:180,height:130})},left=20+(180-130*4/3)/2,w=130*4/3;
 const rear=point(canvas,left+w*.6,30+130*.35,false),front=point(canvas,left+w*.4,30+130*.35,true);assert(Math.abs(rear.x-.6)<1e-10&&Math.abs(front.x-.6)<1e-10);assert(Math.abs(rear.y-.35)<1e-10&&Math.abs(front.y-.35)<1e-10);
 assert.equal(point(canvas,0,0,false).x,0);assert.equal(point(canvas,999,999,false).y,1);
});

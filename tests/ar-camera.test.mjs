import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code=readFileSync('games/ar/js/core.js','utf8'),start=code.indexOf('    switchCamera: async'),end=code.indexOf('    registerGame:',start);
function fixture({deny=false,frames=true}={}){
 let requests=0,stopped=0;const listeners=new Map(),track={stop:()=>stopped++};
 const video={readyState:0,muted:false,playsInline:false,style:{},srcObject:null,addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:type=>listeners.delete(type),play:async()=>{if(frames)video.readyState=2;}};
 const window={System:{video,currentCameraMode:null}},navigator={mediaDevices:{getUserMedia:async()=>{requests++;if(deny)throw Error('denied');return {active:true,getTracks:()=>[track]};}}};
 const methods=vm.runInNewContext('({'+code.slice(start,end)+'})',{window,navigator,Promise,console:{warn(){}},setTimeout:fn=>setTimeout(fn,20),clearTimeout});
 return{window,video,methods,requests:()=>requests,stopped:()=>stopped};
}
test('AR camera: explicit request waits for actual frames, sets inline muted playback and can reuse a live camera',async()=>{
 const f=fixture();assert.equal(f.requests(),0);assert.equal(await f.methods.switchCamera('environment'),true);assert.equal(f.video.readyState,2);assert(f.video.muted&&f.video.playsInline);assert.equal(f.requests(),1);assert.equal(f.video.style.transform,'none');
 assert.equal(await f.methods.switchCamera('environment'),true);assert.equal(f.requests(),1);
});
test('AR camera: denied or frame-less streams return controls fallback and release capture',async()=>{
 const denied=fixture({deny:true});assert.equal(await denied.methods.switchCamera('environment'),false);assert.equal(denied.window.System.currentCameraMode,null);
 const empty=fixture({frames:false});assert.equal(await empty.methods.switchCamera('environment'),false);assert.equal(empty.video.srcObject,null);assert.equal(empty.stopped(),1);
});

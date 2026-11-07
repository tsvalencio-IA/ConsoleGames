import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
function fixture(){
 let paints=0,strokes=0,frames=0;const pixels=new Uint8ClampedArray(320*240*4),ctx={save(){},restore(){},fillRect(){},drawImage(){paints++;},getImageData:()=>({data:pixels}),beginPath(){},moveTo(){},lineTo(){},stroke(){strokes++;}};
 const window={},scope={window,document:{baseURI:'http://test/',hidden:false,hasFocus:()=>true},URL,performance:{now:()=>2000},requestAnimationFrame:()=>1};
 vm.runInNewContext(fs.readFileSync('games/ar/hand-controls.js','utf8').replace(/\}\)\(\);\s*$/,'window.Session=CameraSession;})();'),scope);
 const s=Object.create(window.Session.prototype);Object.assign(s,{game:{state:'PLAYING'},host:{video:{readyState:2,currentTime:2,videoWidth:640,videoHeight:480,classList:{contains:()=>true}}},root:{hidden:false,classList:{contains:()=>false,toggle(){}},querySelector:()=>null},paused:()=>false,ready:true,focused:true,dualHands:true,busy:false,serial:1,nextFrame:0,lastVideo:1,source:'hand',canvas:{getContext:()=>ctx},worker:{postMessage(){frames++;}},controller:{state:'ready',navigation:{neutral:{},read:()=>({fresh:true})},read:()=>({fresh:true})},status:{},landmarks:[Array.from({length:21},()=>({x:.3,y:.5}))]});
 return{s,counts:()=>({paints,strokes,frames})};
}
test('WAR camera: a hidden preview does no canvas work while inference is busy',()=>{
 const f=fixture();f.s.busy=true;f.s.frameSent=1900;for(let i=0;i<60;i++)f.s.tick();assert.deepEqual(f.counts(),{paints:0,strokes:0,frames:0});
});
test('WAR camera: the next due sensor frame is still captured and transferred without drawing an invisible hand skeleton',()=>{
 const f=fixture();f.s.tick();assert.deepEqual(f.counts(),{paints:1,strokes:0,frames:1});assert(f.s.busy);assert.equal(f.s.lastVideo,2);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const source=fs.readFileSync('games/otthi/src/modules/29-game-loop-controls-gamepad.js','utf8');
const helper=source.slice(source.indexOf('  function advanceWorldFrameSimulation('),source.indexOf('  function sampleRafCadence('));
const phone=fs.readFileSync('games/otthi/src/modules/73-world-phone-dispatch.js','utf8');
function simulation(){
 const steps=[],c={running:true,perf:{loopAcc:0},targetSimulationFrameRate:()=>60,stepWorldSimulation:dt=>steps.push(dt)};
 vm.createContext(c);vm.runInContext(helper,c);return{steps,c,advance:elapsed=>{c.elapsed=elapsed;return vm.runInContext('advanceWorldFrameSimulation(elapsed)',c);}};
}
test('slow rendered frames retain real simulation time using bounded physical steps',()=>{
 const f=simulation();for(let frame=0;frame<20;frame++)f.advance(.5);
 assert(Math.abs(f.steps.reduce((a,b)=>a+b,0)-10)<1/30);assert(f.steps.every(dt=>dt<=1/30));assert(f.c.perf.catchUpStepsMax<=18);
});
test('ordinary60Hz frames keep their original cadence and long stalls cannot replay minutes of input',()=>{
 const f=simulation();for(let frame=0;frame<120;frame++)f.advance(1/60);
 assert.equal(f.steps.length,120);assert(Math.abs(f.steps.reduce((a,b)=>a+b,0)-2)<1e-8);
 const before=f.steps.length;f.advance(120);const recovered=f.steps.slice(before).reduce((a,b)=>a+b,0);
 assert(recovered<=.6+1e-8);assert(f.steps.length-before<=18);assert(f.c.perf.catchUpDroppedSeconds>=119.4-1e-8);
});
test('couriers consume simulation expansion time even when several updates share one rendered timestamp',()=>{
 let now=1000;const deltas=[];const context={perf:{expansionStep:1/30},performance:{now:()=>now},worldPhone:{lastTick:1000,loadedOwner:'me',job:null,walkAway:null,uiAt:1000},state:{vehicles:{}},running:true,paused:false,document:{hidden:false},sharedWorldOwnId:()=> 'me',updatePhoneOrders:dt=>deltas.push(dt),phoneUpdateTrackingUI(){}};
 vm.createContext(context);vm.runInContext(phone.slice(phone.indexOf(' function updateWorldPhone('),phone.indexOf(' const phonePreviousExpansion=')),context);
 for(let n=0;n<30;n++)vm.runInContext('updateWorldPhone()',context);
 assert(Math.abs(deltas.reduce((a,b)=>a+b,0)-1)<1e-8);
 context.perf.expansionStep=0;now=1050;vm.runInContext('updateWorldPhone()',context);assert(Math.abs(deltas.at(-1)-.05)<1e-8);
});

import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
function fixture({controlled=true}={}){
 const events=new Map(),docEvents=new Map(),swEvents=new Map(),timers=[],state={reloads:0,updates:0,modal:false,fail:false};
 const document={visibilityState:'visible',getElementById:()=>({get open(){return state.modal}}),addEventListener:(name,fn)=>docEvents.set(name,fn)};
 const navigator={onLine:true,serviceWorker:{controller:controlled?{}:null,addEventListener:(name,fn)=>swEvents.set(name,fn)}};
 const window={addEventListener:(name,fn)=>events.set(name,fn)};
 const registration={update:async()=>{state.updates++;if(state.fail)throw Error('offline')}};
 const context=vm.createContext({window,document,navigator,location:{reload:()=>state.reloads++},setInterval:fn=>timers.push(fn),Date,localStorage:{clear(){throw Error('must preserve saved accounts')}}});
 vm.runInContext(fs.readFileSync('arcade/update.js','utf8'),context);return{state,document,navigator,registration,events,docEvents,swEvents,timers,api:window.OT_ARCADE_UPDATES};
}
test('console checks for updates on attach, reconnect and foreground return',async()=>{
 const f=fixture();await f.api.attach(f.registration);assert.equal(f.state.updates,1);
 f.navigator.onLine=false;await f.api.check();assert.equal(f.state.updates,1);
 f.navigator.onLine=true;await f.events.get('online')();assert.equal(f.state.updates,2);
 f.document.visibilityState='hidden';await f.api.check();assert.equal(f.state.updates,2);
 f.document.visibilityState='visible';f.docEvents.get('visibilitychange')();await Promise.resolve();assert.equal(f.state.updates,3);
 assert.equal(f.timers.length,1);assert.equal(f.state.reloads,0);
});
test('an activated update waits for the account dialog and reloads exactly once after closing',async()=>{
 const f=fixture();await f.api.attach(f.registration);f.state.modal=true;f.swEvents.get('controllerchange')();assert(f.api.diagnostics().pending);assert.equal(f.state.reloads,0);
 f.state.modal=false;f.docEvents.get('close')();assert.equal(f.state.reloads,1);f.swEvents.get('controllerchange')();f.docEvents.get('close')();assert.equal(f.state.reloads,1);
});
test('first install does not reload the console; native resume retries a failed update',async()=>{
 const f=fixture({controlled:false});f.state.fail=true;await f.api.attach(f.registration);assert(f.api.diagnostics().error);f.swEvents.get('controllerchange')();assert.equal(f.state.reloads,0);
 f.state.fail=false;f.events.get('otthi:app-resume')();await new Promise(setImmediate);assert.equal(f.api.diagnostics().error,'');assert.equal(f.state.updates,2);f.swEvents.get('controllerchange')();assert.equal(f.state.reloads,1,'future updates still activate after a first installation');
});
test('an account request or a hidden page delays activation without clearing storage',async()=>{
 const f=fixture();let busy=true;await f.api.attach(f.registration,{canReload:()=>!busy});f.swEvents.get('controllerchange')();assert.equal(f.state.reloads,0);busy=false;
 f.document.visibilityState='hidden';f.docEvents.get('close')();assert.equal(f.state.reloads,0);f.document.visibilityState='visible';f.docEvents.get('visibilitychange')();assert.equal(f.state.reloads,1);
});

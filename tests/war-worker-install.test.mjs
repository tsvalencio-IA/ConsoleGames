import test from'node:test';import assert from'node:assert/strict';import vm from'node:vm';import fs from'node:fs';
function fixture(fail=false){
 const handlers={},old='thia-arcade-ar-pro-control-v34',store=new Map([[old,new Map([['saved-shell','working']])],['another-game',new Map([['keep','ok']])]]),waiting=[];let active=0,peak=0,count=0;
 const release=()=>{active--;const job=waiting.shift();if(job)job();};
 const fetch=()=>new Promise(resolve=>{const start=()=>{active++;peak=Math.max(peak,active);const n=++count;let consumed=false;resolve({ok:!fail||n!==13,status:fail&&n===13?503:200,async consume(){assert(!consumed);consumed=true;release();return'bytes-'+n;}});};if(active<6)start();else waiting.push(start);});
 const caches={async delete(k){return store.delete(k)},async keys(){return[...store.keys()]},async open(k){if(!store.has(k))store.set(k,new Map());const items=store.get(k);return{async put(path,response){items.set(path,await response.consume())}}}};
 const self={registration:{scope:'http://game.test/games/ar/'},clients:{claim:async()=>{}},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting(){throw Error('a running match must acknowledge activation first')}};
 const Request=class{constructor(path,options){this.url=new URL(path,self.registration.scope).href;this.options=options}};
 vm.runInNewContext(fs.readFileSync('games/ar/sw.js','utf8')+'\nself.files=FILES.slice();self.cacheName=CACHE;',{self,caches,fetch,Request,URL,Response:{error(){}}});
 let pending;handlers.install({waitUntil:p=>pending=p});return{self,store,pending,old,peak:()=>peak,count:()=>count};
}
test('WAR worker: a six-connection transport finishes installing every resource by draining response bodies as they arrive',async()=>{
 const f=fixture();let timer;try{await Promise.race([f.pending,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('install deadlocked with unread response bodies')),2000))]);}finally{clearTimeout(timer)}
 assert(f.peak()<=6);assert.equal(f.count(),f.self.files.length);assert.equal(f.store.get(f.self.cacheName).size,new Set(f.self.files).size);assert.equal(f.store.get(f.old).get('saved-shell'),'working');assert.equal(f.store.get('another-game').get('keep'),'ok');
});
test('WAR worker: an incomplete shell discards only the new cache and retains the working release and other games',async()=>{
 const f=fixture(true);await assert.rejects(f.pending,/Incomplete game shell/);assert(!f.store.has(f.self.cacheName));assert.equal(f.store.get(f.old).get('saved-shell'),'working');assert.equal(f.store.get('another-game').get('keep'),'ok');
});

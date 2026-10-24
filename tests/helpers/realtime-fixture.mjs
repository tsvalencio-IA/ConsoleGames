/* Deterministic RTDB contract fixture. No external requests or real player data. */
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
export const timestamp={'.sv':'timestamp'};
const clone=v=>v===undefined?null:JSON.parse(JSON.stringify(v));
export class RealtimeFixture{
 constructor(){this.data={};this.clock=1800000000000;this.listeners=new Set();this.disconnects=new Map();this.failWrites=false;}
 read(path){let v=this.data;for(const k of path.split('/').filter(Boolean))v=v?.[k];return clone(v);}
 resolve(v){if(v&&v['.sv']==='timestamp')return this.clock;if(Array.isArray(v))return v.map(x=>this.resolve(x));if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,this.resolve(x)]));return v;}
 write(path,value){if(this.failWrites)return Promise.reject(Object.assign(new Error('Denied'),{code:'PERMISSION_DENIED'}));const keys=path.split('/').filter(Boolean),old=new Map([...this.listeners].map(l=>[l,JSON.stringify(this.read(l.path))]));let obj=this.data;
  for(const k of keys.slice(0,-1)){if(!obj[k]||typeof obj[k]!=='object')obj[k]={};obj=obj[k];}if(!keys.length)this.data=this.resolve(clone(value))||{};else if(value===null)delete obj[keys.at(-1)];else obj[keys.at(-1)]=this.resolve(clone(value));
  for(const l of this.listeners)if(old.get(l)!==JSON.stringify(this.read(l.path)))this.emit(l);return Promise.resolve();}
 emit(l){const val=this.read(l.path);queueMicrotask(()=>{if(this.listeners.has(l))l.fn({val:()=>clone(val),exists:()=>val!==null});});}
 db(client){const root=this;function ref(path){path=path.replace(/^\/+|\/+$/g,'');return {path,child:p=>ref(path+'/'+p),set:v=>root.write(path,v),remove:()=>root.write(path,null),update:async values=>{let v=root.read(path)||{};for(const[k,x]of Object.entries(values)){const keys=k.split('/');let o=v;for(const part of keys.slice(0,-1))o=o[part]||(o[part]={});if(x===null)delete o[keys.at(-1)];else o[keys.at(-1)]=x;}return root.write(path,v);},
 on(event,fn){const l={client,path,fn};root.listeners.add(l);if(path==='.info/serverTimeOffset')queueMicrotask(()=>fn({val:()=>0,exists:()=>true}));else root.emit(l);return fn;},
 off(event,fn){for(const l of [...root.listeners])if(l.client===client&&l.path===path&&(!fn||l.fn===fn))root.listeners.delete(l);},
 once(event,fn){const val=root.read(path),snap={val:()=>val,exists:()=>val!==null};if(fn)queueMicrotask(()=>fn(snap));return Promise.resolve(snap);},
 transaction(fn){const old=root.read(path),next=fn(old);if(next===undefined)return Promise.resolve({committed:false,snapshot:{val:()=>old}});return root.write(path,next).then(()=>({committed:true,snapshot:{val:()=>root.read(path)}}));},
 onDisconnect(){const key=client+':'+path;return {remove:()=>{root.disconnects.set(key,{client,path});return Promise.resolve();},cancel:()=>{root.disconnects.delete(key);return Promise.resolve();}}}
 };}return {ref};}
 async settle(){for(let i=0;i<14;i++)await new Promise(resolve=>setImmediate(resolve));}
 async disconnect(client){for(const[key,d]of [...this.disconnects])if(d.client===client){this.disconnects.delete(key);await this.write(d.path,null);}for(const l of [...this.listeners])if(l.client===client)this.listeners.delete(l);await this.settle();}
}
export function networkEngine(slug,file,backend,{client=randomUUID(),account='same-account',mode='controls'}={}){
 let clock=100;const intervals=new Set(),timers=new Set(),storage=new Map(),messages=[];
 const element=()=>({style:{},dataset:{},setAttribute(){},querySelector(){return element();},classList:{add(){},remove(){},contains(){return false}},remove(){},appendChild(){},addEventListener(){},getBoundingClientRect(){return {width:390,height:844,left:0,top:0}}});
 const window={DB:backend.db(client),ArcadePlaySettings:{get:()=>({difficulty:'normal',sensitivity:1,assist:true,quality:'low'})},ArcadeControls:{mode},Profile:{coins:1234,xp:567,username:client},Sfx:{play(){},click(){},error(){},coin(){}},Gfx:{shakeScreen(){}},addEventListener(){},removeEventListener(){},System:{registerGame:(id,title,icon,logic,opts)=>{window.logic=logic;window.gameOptions=opts;},canvas:{...element(),width:390,height:844},msg:t=>messages.push(t),playerId:account,gameOver(){},player:{}}};
 const document={body:element(),getElementById:element,createElement:element};
 class FixtureDate extends Date{static now(){return backend.clock;}}
 const context=vm.createContext({window,document,performance:{now:()=>clock},console,Math,Date:FixtureDate,crypto:{randomUUID},navigator:{},setTimeout(fn){timers.add(fn);return fn;},clearTimeout(fn){timers.delete(fn);},setInterval(fn){intervals.add(fn);return fn;},clearInterval(fn){intervals.delete(fn);},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},firebase:{database:{ServerValue:{TIMESTAMP:timestamp}}}});
 vm.runInContext(readFileSync('games/'+slug+'/js/'+file+'.js','utf8'),context);
 return {client,window,game:window.logic,context,storage,messages,intervals,timers,advance(ms){clock+=ms;backend.clock+=ms;},heartbeat(){for(const fn of intervals)fn();},load(path){vm.runInContext(readFileSync(path,'utf8'),context);}};
}

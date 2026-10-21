import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(p,'utf8');
export function engine(slug,file,settings={}){
 let clock=100;const timers=[],intervals=[];const storage=new Map();
 const defaults={distance:'far',camera:'chase',sensitivity:1,smoothing:.62,difficulty:'normal',quality:'auto',assist:true,...settings};
 const element=()=>({style:{},classList:{add(){},remove(){},contains(){return false}},remove(){},appendChild(){},addEventListener(){},getBoundingClientRect(){return {width:390,height:844,left:0,top:0}}});
 const window={ArcadePlaySettings:{get:()=>defaults},ArcadeControls:{mode:'controls'},Sfx:{play(){},coin(){},epic(){},click(){},hover(){}},Profile:{coins:0},addEventListener(){},System:{registerGame:(id,name,e,logic)=>window.logic=logic,canvas:{...element(),width:390,height:844},msg(){},playerId:'unit-player',player:{}}};
 const document={getElementById:element,createElement:element};
 vm.runInNewContext(read('games/'+slug+'/js/'+file+'.js'),{window,document,performance:{now:()=>clock},console,Math:Object.assign(Object.create(Math),{random:()=>.5}),navigator:{},setTimeout(fn){timers.push(fn);},setInterval(fn){intervals.push(fn);return intervals.length;},clearInterval(){},clearTimeout(){},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},firebase:{database:{ServerValue:{TIMESTAMP:0}}}});
 for(const fn of intervals)fn();
 return {game:window.logic,window,settings:defaults,advance:n=>clock+=n,timers,storage};
}
export function canvas(){const operations=[];return new Proxy({operations,measureText:t=>({width:String(t).length*7}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get(o,k){if(k in o)return o[k];return (...args)=>operations.push([k,...args])}})}

/* Run the unmodified modular world RTDB adapter over the local SSE fixture.
 * Firebase SDK modules are intercepted before any external request is sent. */
import {installMultiplayerFixture} from './multiplayer-browser-fixture.mjs';
export async function installWorldRtdbFixture(context){
 await installMultiplayerFixture(context);
 const app=`const apps=[];export const getApps=()=>apps;export const initializeApp=(options,name)=>{const app={options,name};apps.push(app);return app};`;
 const auth=`const auth=window.firebase.auth();auth.currentUser.isAnonymous=true;auth.currentUser.getIdToken=async()=>\"fixture-local-token\";auth.authStateReady=async()=>{};export const getAuth=()=>auth;export const signInAnonymously=async()=>({user:auth.currentUser});export const onAuthStateChanged=(a,cb)=>a.onAuthStateChanged(cb);export const setPersistence=async()=>{};export const browserLocalPersistence={};export const browserSessionPersistence={};export const signOut=async()=>{};`;
 const database=`
 const local=window.firebase.database();
 const snap=(value,key)=>({key,val:()=>value,exists:()=>value!==null&&value!==undefined});
 function filtered(r,value){if(!value||typeof value!=='object'||!r.filters?.length)return value;let rows=Object.entries(value),order=r.filters.find(f=>f.kind==='order'),equal=r.filters.find(f=>f.kind==='equal'),limit=r.filters.find(f=>f.kind==='limit');if(order)rows.sort((a,b)=>{const x=a[1]?.[order.value],y=b[1]?.[order.value];return x===y?a[0].localeCompare(b[0]):x<y?-1:1});if(equal)rows=rows.filter(([key,v])=>(order?v?.[order.value]:key)===equal.value);if(limit)rows=rows.slice(-limit.value);return rows.length?Object.fromEntries(rows):null;}
 export const getDatabase=()=>local;
 export const ref=(db,path='')=>({path,inner:db.ref(path)});
 export const child=(r,path)=>ref(local,r.path+'/'+path);
 export const get=r=>r.inner.once('value').then(s=>snap(filtered(r,s.val())));
 export const set=(r,v)=>r.inner.set(v),update=(r,v)=>r.inner.update(v),remove=r=>r.inner.remove();
 export const runTransaction=(r,fn)=>r.inner.transaction(fn),onDisconnect=r=>r.inner.onDisconnect(),serverTimestamp=()=>({'.sv':'timestamp'});
 export const query=(r,...filters)=>({...r,filters}),orderByChild=value=>({kind:'order',value}),equalTo=value=>({kind:'equal',value}),limitToLast=value=>({kind:'limit',value});
 export const onValue=(r,cb,fail)=>{if(r.path==='.info/connected'){queueMicrotask(()=>cb(snap(true)));return()=>{}}if(r.path==='.info/serverTimeOffset'){queueMicrotask(()=>cb(snap(0)));return()=>{}}const fn=s=>cb(snap(filtered(r,s.val())));r.inner.on('value',fn,fail);return()=>r.inner.off('value',fn)};
 function childEvents(r,cb,fail,kind){let previous={};return onValue(r,s=>{const next=s.val()||{};if(kind==='removed'){for(const key of Object.keys(previous))if(!(key in next))cb(snap(previous[key],key));}else for(const[key,v]of Object.entries(next)){if(kind==='added'&&!(key in previous)||kind==='changed'&&key in previous&&JSON.stringify(previous[key])!==JSON.stringify(v))cb(snap(v,key));}previous=next;},fail);}
 export const onChildAdded=(r,cb,fail)=>childEvents(r,cb,fail,'added'),onChildChanged=(r,cb,fail)=>childEvents(r,cb,fail,'changed'),onChildRemoved=(r,cb,fail)=>childEvents(r,cb,fail,'removed');
 `;
 await context.route(/^https:\/\/www\.gstatic\.com\/firebasejs\/[^/]+\/firebase-(app|auth|database)\.js$/,route=>{const kind=/firebase-(app|auth|database)\.js/.exec(route.request().url())[1];return route.fulfill({contentType:'application/javascript',headers:{'access-control-allow-origin':'*'},body:{app,auth,database}[kind]});});
}

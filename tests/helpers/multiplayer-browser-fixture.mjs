/* Local HTTP/SSE transport implementing the Firebase compat API used by games.
 * No Firebase requests, credentials, accounts or production players are used. */
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {RealtimeFixture} from './realtime-fixture.mjs';
import {installConsoleStubs} from './console-context.mjs';
const mime={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.wasm':'application/wasm','.task':'application/octet-stream'};
export async function multiplayerServer(){
 const db=new RealtimeFixture(),connections=new Map(),subscriptions=new Map(),cancelled=new Set(),root=resolve('.');
 await db.write('users/browser-test-user-123456789012345',{username:'Cliente de teste',role:'player',level:10,coins:8000,xp:400,permissions:{drive:true,tennis:true,ar_truck_sim:true,usarmy_flight_sim:true,box_pro:true}});
 const server=http.createServer(async(req,res)=>{try{
  const u=new URL(req.url,'http://localhost');
  if(u.pathname==='/__mp/events'){const client=u.searchParams.get('client');res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.write(':ready\n\n');connections.set(client,res);req.on('close',()=>{connections.delete(client);db.disconnect(client);});return;}
  if(u.pathname==='/__mp/rpc'){
   let body='';for await(const chunk of req)body+=chunk;const q=JSON.parse(body),ref=db.db(q.client).ref(q.path||'');db.clock=Date.now();let result=null;
   if(q.op==='read')result=db.read(q.path);
   else if(q.op==='set')await ref.set(q.value);
   else if(q.op==='update')await ref.update(q.value);
   else if(q.op==='remove')await ref.remove();
   else if(q.op==='cas'){const same=JSON.stringify(db.read(q.path))===JSON.stringify(q.previous);if(same)await ref.set(q.value);result={committed:same,value:db.read(q.path)};}
   else if(q.op==='subscribe'){const key=q.client+':'+q.listener;if(!cancelled.has(key)){const fn=snap=>connections.get(q.client)?.write('data:'+JSON.stringify({listener:q.listener,value:snap.val()})+'\n\n');subscriptions.set(key,{ref,fn});ref.on('value',fn);}}
   else if(q.op==='unsubscribe'){const key=q.client+':'+q.listener;cancelled.add(key);const s=subscriptions.get(key);if(s)s.ref.off('value',s.fn);subscriptions.delete(key);}
   else if(q.op==='disconnect-remove')await ref.onDisconnect().remove();else if(q.op==='disconnect-cancel')await ref.onDisconnect().cancel();
   res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({value:result}));return;
  }
  let path=resolve(root,'.'+decodeURIComponent(u.pathname));if(!path.startsWith(root+'/')){res.writeHead(403);res.end();return;}const info=await stat(path);if(info.isDirectory())path=resolve(path,'index.html');res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(path));
 }catch(error){res.writeHead(error.code==='ENOENT'?404:500);res.end(error.message);}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return {db,origin:'http://127.0.0.1:'+server.address().port,async close(){for(const r of connections.values())r.end();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
export async function installMultiplayerFixture(context){
 await installConsoleStubs(context);
 await context.addInitScript(()=>{
  const client=crypto.randomUUID(),listeners=new Map();let count=0,chain=Promise.resolve();const events=new EventSource('/__mp/events?client='+client);const ready=new Promise(resolve=>events.onopen=resolve);
  events.onmessage=e=>{const d=JSON.parse(e.data),entry=listeners.get(d.listener);if(entry)entry.fn({val:()=>d.value,exists:()=>d.value!==null});};
  const rpc=(op,path,extra={})=>{const action=async()=>{await ready;const r=await fetch('/__mp/rpc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client,op,path,...extra})});if(!r.ok)throw Error('Fixture transport '+r.status);return (await r.json()).value;};const result=chain.then(action);chain=result.catch(()=>{});return result;};
  const ref=path=>({child:p=>ref(path+'/'+p),set:value=>rpc('set',path,{value}),update:value=>rpc('update',path,{value}),remove:()=>rpc('remove',path),once:(event,fn)=>rpc('read',path).then(value=>{const s={val:()=>value,exists:()=>value!==null};fn?.(s);return s;}),
   on(event,fn,fail){if(path==='.info/serverTimeOffset'){queueMicrotask(()=>fn({val:()=>0,exists:()=>true}));return fn;}const id=++count;listeners.set(id,{path,fn});rpc('subscribe',path,{listener:id}).catch(fail||console.warn);return fn;},
   off(event,fn){for(const[id,l]of [...listeners])if(l.path===path&&(!fn||fn===l.fn)){listeners.delete(id);rpc('unsubscribe',path,{listener:id});}},
   async transaction(fn){for(let i=0;i<12;i++){const previous=await rpc('read',path),value=fn(previous);if(value===undefined)return {committed:false,snapshot:{val:()=>previous}};const r=await rpc('cas',path,{previous,value});if(r.committed)return {committed:true,snapshot:{val:()=>r.value}};}throw Error('Fixture transaction contention');},
   onDisconnect(){return {remove:()=>rpc('disconnect-remove',path),cancel:()=>rpc('disconnect-cancel',path)}}
  });
  window.firebase.database=()=>({ref});window.firebase.database.ServerValue={TIMESTAMP:{'.sv':'timestamp'}};window.__fixtureClient=client;
 });
}

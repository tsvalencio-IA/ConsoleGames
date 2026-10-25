/* thIAguinho ARCADE: PWA autónomo. O service worker NÃO controla os sete jogos.
   Scope: /ConsoleGames/arcade/ - ID diferente do console anterior. */
"use strict";
const CACHE="thiaguinho-arcade-shell-v12";
const SHELL=["./account-access.js","./","./index.html","./app.js","./styles.css","./firebase-config.js","./manifest.webmanifest","./icon.svg","./icon-192.png","./icon-512.png"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{try{const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith("thiaguinho-arcade-shell-")&&key!==CACHE).map(key=>caches.delete(key)));}catch{}await self.clients.claim();})());
});
self.addEventListener('message',event=>{if(event.data?.type==='ARCADE_HEALTH')event.ports?.[0]?.postMessage({type:'ARCADE_HEALTH',version:12});});
async function cachedResponse(request,navigation){
  try{const cache=await caches.open(CACHE);return await cache.match(request)||await cache.match(request,{ignoreSearch:true})||(navigation?await cache.match('./index.html'):null)||null;}catch{return null;}
}
async function navigationResponse(response){
  if(!response.redirected)return response;
  // A cached response obtained through a redirect cannot be returned directly
  // to a navigation with redirect:"manual". Preserve its body without that flag.
  const headers=new Headers(response.headers);headers.delete('content-length');headers.delete('content-encoding');
  return new Response(await response.arrayBuffer(),{status:response.status,statusText:response.statusText,headers});
}
function offlinePage(){
  const entry=new URL('../console.html',self.registration.scope).href,world=new URL('../games/otthi/',self.registration.scope).href;
  return new Response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#101d30"><title>thIAguinho • Abrir jogos</title><style>*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:24px;background:#101d30;color:#eff8f7;font:16px system-ui}main{width:min(100%,460px);line-height:1.6}small{color:#84dacf}h1{font-size:29px;line-height:1.2}button,a{display:block;width:100%;padding:15px 18px;margin-top:12px;border-radius:12px;border:1px solid #77a9ab;background:#285263;color:#fff;font:700 15px system-ui;text-align:center;text-decoration:none}button{cursor:pointer}footer{font-size:12px;color:#b7c7d0;margin-top:32px}</style><main id="arcade-offline"><small>thIAguinho ARCADE</small><h1>Não foi possível abrir os jogos agora.</h1><p>A conexão pode ter sido interrompida. Toque para tentar novamente ou volte ao seu mundo.</p><button type="button" onclick="location.reload()">TENTAR NOVAMENTE</button><a href="${entry}">ABRIR CONSOLE</a><a href="${world}">VOLTAR AO MUNDO</a><footer>powered by thIAguinho Soluções Digitais</footer></main></html>`,{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
}
async function networkFirst(event,navigation){
  const request=event.request;
  try{
    const response=await fetch(request);
    if(response.type==='opaqueredirect')return response;
    if(!response.ok)throw Error('Console HTTP '+response.status);
    const url=new URL(request.url),shell=SHELL.some(path=>new URL(path,self.registration.scope).pathname===url.pathname);
    if(shell){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{}));}
    return navigation?await navigationResponse(response):response;
  }catch{
    const cached=await cachedResponse(request,navigation);
    if(cached)return navigation?await navigationResponse(cached):cached;
    return navigation?offlinePage():Response.error();
  }
}
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url),scopePath=new URL(self.registration.scope).pathname;
  if(url.origin!==self.location.origin||!url.pathname.startsWith(scopePath))return;
  // Leave installation and binary downloads to the browser. A failed APK request
  // must never become the cached console HTML via the navigation fallback below.
  if(url.pathname.startsWith(scopePath+"downloads/")||url.pathname.startsWith(scopePath+"instalar/"))return;
  if(request.mode==="navigate"){
    event.respondWith(networkFirst(event,true));
    return;
  }
  event.respondWith(networkFirst(event,false));
});

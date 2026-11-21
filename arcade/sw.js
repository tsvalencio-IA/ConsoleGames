/* The console worker owns its shell. Each game keeps its own cache. */
"use strict";
const SHELL_VERSION=21;
const PREFIX="thiaguinho-arcade-shell-v";
const SCOPE=new URL(self.registration.scope);
const MOUNT='@'+encodeURIComponent(SCOPE.pathname);
const CACHE=PREFIX+SHELL_VERSION+MOUNT;
const SHELL=["./canonical-navigation.js?v=20261120","./account-access.js","./account-access.js?v=20261024-head1","./update.js","./","./index.html","./app.js","./styles.css","./firebase-config.js","./manifest.webmanifest","./icon.svg","./icon-192.png","./icon-512.png","./icon-192-v2.png","./icon-512-v2.png","./icon-maskable-512-v2.png"];
async function fillShell(cache){
  const requests=SHELL.map(path=>new Request(new URL(path,self.registration.scope),{cache:'no-store',redirect:'error'}));
  await cache.addAll(requests);
}
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(fillShell).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    try{
      const keys=await caches.keys();
      await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(async key=>{
        const entries=key.includes('@')?null:await (await caches.open(key)).keys();
        if(entries?entries.length&&entries.every(request=>request.url.startsWith(SCOPE.href)):key.endsWith(MOUNT))await caches.delete(key);
      }));
    }catch{}
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{if(event.data?.type==='ARCADE_HEALTH')event.ports?.[0]?.postMessage({type:'ARCADE_HEALTH',version:SHELL_VERSION});});
async function cachedResponse(request,navigation){
  try{
    const cache=await caches.open(CACHE);
    return navigation ? await cache.match('./index.html') : await cache.match(request);
  }catch{return null;}
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
    const response=await fetch(request,{cache:"no-store"});
    if(response.type==='opaqueredirect')return response;
    if(!response.ok)return response;
    if(navigation)event.waitUntil(caches.open(CACHE).then(async cache=>{
      if(!await cache.match('./index.html'))await fillShell(cache);
    }).catch(()=>{}));
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
  const url=new URL(request.url),scope=SCOPE;
  if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  if(request.mode==="navigate"){
    // Preview pages, installers and downloads own their own responses. The
    // console shell can never impersonate them when the connection drops.
    if(url.pathname!==scope.pathname&&url.pathname!==new URL('index.html',scope).pathname)return;
    event.respondWith(networkFirst(event,true));
    return;
  }
  if(!SHELL.some(path=>new URL(path,scope).href===url.href))return;
  event.respondWith(networkFirst(event,false));
});

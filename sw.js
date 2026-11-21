/* The historical root PWA serves only its own entry and static files. */
"use strict";
const PREFIX="thiaguinho-console-static-";
const SCOPE=new URL(self.registration.scope);
const MOUNT='@'+encodeURIComponent(SCOPE.pathname);
const CACHE=PREFIX+"v10"+MOUNT;
const APP_SHELL=["./arcade/canonical-navigation.js?v=20261120","./account-access.js","./","./index.html","./styles.css","./app.js","./firebase-config.js","./manifest.webmanifest","./icons/icon.svg","./covers/otthi.svg","./covers/familia.svg","./covers/kart.svg","./covers/boxe.svg","./covers/tenis.svg","./covers/ar.svg","./covers/voo.svg","./covers/danca.svg"];
const SHELL_URLS=new Set(APP_SHELL.map(path=>new URL(path,SCOPE).href));
self.addEventListener("install",event=>{
  const requests=APP_SHELL.map(path=>new Request(new URL(path,self.registration.scope),{cache:'no-store',redirect:'error'}));
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(requests)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(async key=>{
      const entries=key.includes('@')?null:await (await caches.open(key)).keys();
      if(entries?entries.length&&entries.every(request=>SHELL_URLS.has(request.url)):key.endsWith(MOUNT))await caches.delete(key);
    }));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url),scope=SCOPE,index=new URL('index.html',scope);
  if(url.origin!==scope.origin)return;
  const navigation=request.mode==='navigate';
  if(navigation ? url.pathname!==scope.pathname&&url.pathname!==index.pathname
    : !SHELL_URLS.has(url.href))return;
  event.respondWith(fetch(request,{cache:'no-store'}).catch(async()=>{
    try{return await (await caches.open(CACHE)).match(navigation?index.href:request)||Response.error();}
    catch{return Response.error();}
  }));
});

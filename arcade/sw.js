/* thIAguinho ARCADE: PWA autónomo. O service worker NÃO controla os sete jogos.
   Scope: /ConsoleGames/arcade/ - ID diferente do console anterior. */
"use strict";
const CACHE="thiaguinho-arcade-shell-v7";
const SHELL=["./","./index.html","./app.js","./styles.css","./firebase-config.js","./manifest.webmanifest","./icon.svg","./icon-192.png","./icon-512.png"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("thiaguinho-arcade-shell-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url),scopePath=new URL(self.registration.scope).pathname;
  if(url.origin!==self.location.origin||!url.pathname.startsWith(scopePath))return;
  if(request.mode==="navigate"){
    event.respondWith(fetch(request).then(response=>response.ok?response:Promise.reject(new Error("offline"))).catch(()=>caches.match("./index.html")));
    return;
  }
  event.respondWith(fetch(request).then(response=>{
    if(response.ok && SHELL.some(path=>new URL(path,self.registration.scope).href===url.href)){
      const clone=response.clone();
      event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,clone)));
    }
    return response;
  }).catch(()=>caches.match(request)));
});

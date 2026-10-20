/* Offline apenas para a INTERFACE DO CONSOLE; jogos externos exigem sua rede original. */
"use strict";
const CACHE="thiaguinho-console-static-v1";
const APP_SHELL=["./","./index.html","./styles.css","./app.js","./firebase-config.js","./manifest.webmanifest","./icons/icon.svg"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("thiaguinho-console-static-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return; // Jamais interceptar jogos externos ou Firebase.
  if(!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
  if(request.mode==="navigate"){
    event.respondWith(fetch(request).catch(()=>caches.match("./index.html")));return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
});

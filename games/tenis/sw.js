/* thIAguinho ARCADE — tenis: cache privado, versão atual primeiro.
    Nunca apaga caches de outro jogo/PWA; nunca intercepta Firebase externo. */
"use strict";
const PREFIX="thia-arcade-tenis-";
const CACHE=PREFIX+"studio-v5";
const FILES=["./","./index.html","./manifest.json","./icon.svg",
"./js/core.js","./js/game_tennis.js","./arcade-enhancements.js",
"./arcade-enhancements.css","./arcade-pause.js","./arcade-pause.css",
"./control-modes.js","./control-modes.css",
"./studio-fx.js","./studio-fx.css","./studio-scenes.js"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(async cache=>{
    await Promise.all(FILES.map(async path=>{
      try{
        const response=await fetch(new Request(path,{cache:"reload"}));
        if(response.ok)await cache.put(path,response);
      }catch(error){ /* offline: next online load fills the cache */ }
    }));
    await self.skipWaiting();
  }));
});
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  const scope=new URL(self.registration.scope);
  if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const response=await fetch(req);
      if(response.ok && (url.pathname.endsWith(".js")||url.pathname.endsWith(".css")||url.pathname.endsWith(".html")||req.mode==="navigate")){
        event.waitUntil(cache.put(req,response.clone()));
      }
      return response;
    }catch(error){
      const hit=await cache.match(req);
      if(hit)return hit;
      if(req.mode==="navigate")return (await cache.match("./index.html"))||Response.error();
      return Response.error();
    }
  })());
});

/* thIAguinho ARCADE — ar: cache privado, versão atual primeiro.
    Nunca apaga caches de outro jogo/PWA; nunca intercepta Firebase externo. */
// Release 2026-10-22 war3: refresh touch look and ADS in the game shell while retaining cached local recognition models.
"use strict";
const PREFIX="thia-arcade-ar-";
const CACHE=PREFIX+"pro-control-v17";
const FILES=["./local-practice.js?v=20261023-1","./","./index.html","./manifest.json","./icon.svg","./world-renderer.js","./vendor/three-r128.min.js","./icon-192.png","./icon-512.png",
"./hand-controls.js","./hand-tracker-worker.js","./combat-controls.css","./js/core.js","./js/game_ar.js","./arcade-enhancements.js",
"./arcade-enhancements.css","./arcade-pause.js","./arcade-pause.css",
"./control-modes.js","./control-modes.css",
"./studio-fx.js","./studio-fx.css","./studio-scenes.js",
"./mastery-gamepad.js","./mastery-gamepad.css","./pro-controls.css","./play-settings.js","./play-settings.css"];
self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const responses=await Promise.all(FILES.map(async path=>{
      const response=await fetch(new Request(path,{cache:"no-store"}));
      if(!response.ok)throw Error('Incomplete game shell: '+path+' HTTP '+response.status);
      return {path,response};
    }));
    // Keep the working release until every local code file has downloaded.
    await caches.delete(CACHE);const cache=await caches.open(CACHE);
    await Promise.all(responses.map(({path,response})=>cache.put(path,response)));
    // The ready menu acknowledges activation. Never replace a game mid-match.
  })());
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
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
      if(response.ok && (/\.(?:js|mjs|wasm|task)$/.test(url.pathname)||url.pathname.endsWith(".css")||url.pathname.endsWith(".html")||req.mode==="navigate")){
        event.waitUntil(cache.put(req,response.clone()));
      }
      return response;
    }catch(error){
      const hit=await cache.match(req)||await cache.match(req,{ignoreSearch:true});
      if(hit)return hit;
      if(req.mode==="navigate")return (await cache.match("./index.html"))||Response.error();
      return Response.error();
    }
  })());
});

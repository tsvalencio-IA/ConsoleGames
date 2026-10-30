/* thIAguinho ARCADE — ar: cache privado, versão atual primeiro.
    Nunca apaga caches de outro jogo/PWA; nunca intercepta Firebase externo. */
// Release 2026-10-28: body-guided hand crop, hands-free advance, distinct operations.
"use strict";
const PREFIX="thia-arcade-ar-";
const CACHE=PREFIX+"pro-control-v43-body-only";
const FILES=[
"./audio/engine-fiat-idle.ogg",
"./audio/engine-fiat-load.ogg",
"./audio/engine-hornet-idle.ogg",
"./audio/engine-hornet-load.ogg",
"./audio/engine-inline6-idle.ogg",
"./audio/engine-inline6-load.ogg",
"./audio/engine-turbo6-idle.ogg",
"./audio/engine-turbo6-load.ogg",
"./audio/engine-flat6-idle.ogg",
"./audio/engine-flat6-load.ogg",
"./audio/engine-flatplane8-idle.ogg",
"./audio/engine-flatplane8-load.ogg",
"./audio/engine-coach-idle.ogg",
"./audio/engine-coach-load.ogg",
"./audio/engine-triple-idle.ogg",
"./audio/engine-triple-load.ogg",
"./recorded-audio.js?v=20261029-continuity5","./recorded-audio.js","./audio/rifle-1.ogg","./audio/rifle-2.ogg","./audio/smg-1.ogg","./audio/smg-2.ogg","./audio/marksman.ogg","./audio/engine-car.ogg","./audio/engine-moto.ogg","./audio/engine-heli.ogg","./audio/engine-recordings.json","./audio/engine-road-idle.ogg","./audio/engine-road-load.ogg","./audio/engine-classic-idle.ogg","./audio/engine-classic-load.ogg","./audio/engine-sport-idle.ogg","./audio/engine-sport-load.ogg","./audio/engine-heavy-idle.ogg","./audio/engine-heavy-load.ogg","./audio/engine-moto-idle.ogg","./audio/engine-moto-load.ogg","./audio/engine-twin-idle.ogg","./audio/engine-twin-load.ogg","./audio/engine-small-moto.ogg","./audio/engine-rotor-recorded.ogg","./audio/engine-prop-recorded.ogg","./audio/engine-jet-recorded.ogg","./audio/engine-boat-recorded.ogg","./audio/CREDITS.txt","./audio/sources.json","./combat-visuals.js?v=20261026-combat2","./combat-visuals.js","./account-access.js","./local-practice.js?v=20261029-entry5","./","./index.html","./game-audio.js","./game-audio.js?v=20261023-3","./manifest.json","./icon.svg","./world-renderer.js","./vendor/three-r128.min.js","./icon-192.png","./icon-512.png",
"./multiplayer.js","./multiplayer.css","./hand-controls.js","./body-controls.js","./body-tracker-worker.js","./hand-tracker-worker.js","./combat-controls.css","./js/core.js","./js/game_ar.js","./arcade-enhancements.js",
"./arcade-enhancements.css","./arcade-pause.js","./arcade-pause.css",
"./control-modes.js","./control-modes.css",
"./studio-fx.js","./studio-fx.css","./studio-scenes.js",
"./mastery-gamepad.js","./mastery-gamepad.css","./pro-controls.css","./play-settings.js","./play-settings.css"];
self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    // Drain each response into the new cache immediately. Holding every body
    // until Promise.all(fetch(...)) can exhaust HTTP/1 connection slots.
    await caches.delete(CACHE);const cache=await caches.open(CACHE);let next=0,failed=false;
    const results=await Promise.allSettled(Array.from({length:Math.min(4,FILES.length)},async()=>{
      while(!failed&&next<FILES.length){
        const path=FILES[next++];
        try{
          const response=await fetch(new Request(path,{cache:"no-store"}));
          if(!response.ok)throw Error('Incomplete game shell: '+path+' HTTP '+response.status);
          await cache.put(path,response);
        }catch(error){failed=true;throw error;}
      }
    }));
    const rejected=results.find(result=>result.status==='rejected');
    if(rejected){await caches.delete(CACHE);throw rejected.reason;}
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
      const response=await fetch(req,{cache:"no-store"});
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

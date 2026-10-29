/* thIAguinho ARCADE — kart: cache privado, versão atual primeiro.
    Nunca apaga caches de outro jogo/PWA; nunca intercepta Firebase externo. */
"use strict";
const PREFIX="thia-arcade-kart-";
const CACHE=PREFIX+"pro-control-v32";
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
"./recorded-audio.js?v=20261029-continuity5","./recorded-audio.js","./audio/rifle-1.ogg","./audio/rifle-2.ogg","./audio/smg-1.ogg","./audio/smg-2.ogg","./audio/marksman.ogg","./audio/engine-car.ogg","./audio/engine-moto.ogg","./audio/engine-heli.ogg","./audio/engine-recordings.json","./audio/engine-road-idle.ogg","./audio/engine-road-load.ogg","./audio/engine-classic-idle.ogg","./audio/engine-classic-load.ogg","./audio/engine-sport-idle.ogg","./audio/engine-sport-load.ogg","./audio/engine-heavy-idle.ogg","./audio/engine-heavy-load.ogg","./audio/engine-moto-idle.ogg","./audio/engine-moto-load.ogg","./audio/engine-twin-idle.ogg","./audio/engine-twin-load.ogg","./audio/engine-small-moto.ogg","./audio/engine-rotor-recorded.ogg","./audio/engine-prop-recorded.ogg","./audio/engine-jet-recorded.ogg","./audio/engine-boat-recorded.ogg","./audio/CREDITS.txt","./audio/sources.json","./account-access.js","./local-practice.js?v=20261029-entry5","./","./index.html","./world-venue-trip.js","./game-audio.js","./game-audio.js?v=20261023-3","./manifest.json","./icon.svg",
"./js/core.js","./js/game_kart.js","./arcade-enhancements.js",
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
      if(response.ok && (url.pathname.endsWith(".js")||url.pathname.endsWith(".css")||url.pathname.endsWith(".html")||req.mode==="navigate")){
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

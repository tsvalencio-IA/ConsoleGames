/* thIAguinho ARCADE: PWA autÃ³nomo. O service worker NÃƒO controla os sete jogos.
   Scope: /ConsoleGames/arcade/ - ID diferente do console anterior. */
"use strict";
const CACHE="thiaguinho-arcade-shell-v16";
const SHELL=["./canonical-navigation.js","./account-access.js","./update.js","./","./index.html","./app.js","./styles.css","./firebase-config.js","./manifest.webmanifest","./icon.svg","./icon-192.png","./icon-512.png","./icon-192-v2.png","./icon-512-v2.png","./icon-maskable-512-v2.png"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{try{const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith("thiaguinho-arcade-shell-")&&key!==CACHE).map(key=>caches.delete(key)));}catch{}await self.clients.claim();})());
});
self.addEventListener('message',event=>{if(event.data?.type==='ARCADE_HEALTH')event.ports?.[0]?.postMessage({type:'ARCADE_HEALTH',version:16});});
async function cachedResponse(request,navigation){
  try{const cache=await caches.open(CACHE);return await cache.match(request)||await cache.match(request,{ignoreSearch:true})||(navigation?await cache.match('./index.html'):null)||null;}catch{return null;}
}
async function navigationResponse(response){
  if(!response.redirected)return response;
  // A cached response obtained through a redirect cannot be returned directly
  // to ¶»§q«^
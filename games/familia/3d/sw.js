/* Instalação web do Universo thIAguinho 3D. Não altera estado nem jogabilidade. */
const CACHE = 'universo-thiaguinho-3d-pwa-v18';
const ASSETS = [
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
"./recorded-audio.js?v=20261028-vehicle4","./recorded-audio.js","./audio/rifle-1.ogg","./audio/rifle-2.ogg","./audio/smg-1.ogg","./audio/smg-2.ogg","./audio/marksman.ogg","./audio/engine-car.ogg","./audio/engine-moto.ogg","./audio/engine-heli.ogg","./audio/engine-recordings.json","./audio/engine-road-idle.ogg","./audio/engine-road-load.ogg","./audio/engine-classic-idle.ogg","./audio/engine-classic-load.ogg","./audio/engine-sport-idle.ogg","./audio/engine-sport-load.ogg","./audio/engine-heavy-idle.ogg","./audio/engine-heavy-load.ogg","./audio/engine-moto-idle.ogg","./audio/engine-moto-load.ogg","./audio/engine-twin-idle.ogg","./audio/engine-twin-load.ogg","./audio/engine-small-moto.ogg","./audio/engine-rotor-recorded.ogg","./audio/engine-prop-recorded.ogg","./audio/engine-jet-recorded.ogg","./audio/engine-boat-recorded.ogg","./audio/CREDITS.txt","./audio/sources.json",
  './', './index.html', './game-audio.js', './game-audio.js?v=20261023-3', './manifest.webmanifest',
  './mascotes-3d.js', './acoes-visuais.js', './acoes-visuais.css',
  './console-world.css', './console-world.js', './quest-chapter.js', './studio-world.css', './studio-world.js', './gamepad-support.js','./adaptive-quality.js',
  './troca-bateria.js', './troca-bateria.css', './mascotes_aprovados.webp',
  './icons/mascotes-reais-192.png', './icons/mascotes-reais-512.png', './icons/mascotes-reais-maskable-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => Promise.allSettled(
    ASSETS.map(url => cache.add(new Request(url, {cache:'reload'})))
  )).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('universo-thiaguinho-3d-pwa-') && key !== CACHE)
      .map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE);
        event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
      }
      return response;
    } catch (_) {
      const cached = await caches.match(request, {ignoreSearch:true});
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const shell = await caches.match('./index.html', {ignoreSearch:true});
        if (shell) return shell;
      }
      return Response.error();
    }
  })());
});

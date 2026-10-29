const REVISION = '07e6a02c08d06796';
const CACHE = `otthi-v70645-${REVISION}`;
const CACHE_PREFIXES = ['otthi-','otthi-game-web-','otthos-life-world-main-'];
const BUILD = '705.28.9-war-corpo-fases';
const VERSION = '705';
const RELEASE_MANIFEST = './release-manifest.json?v=70645';

const REQUIRED_SHELL = [
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
  "./recorded-audio.js?v=20261028-vehicle4",
  "./recorded-audio.js",
  "./audio/engine-recordings.json",
  "./audio/engine-road-idle.ogg",
  "./audio/engine-road-load.ogg",
  "./audio/engine-classic-idle.ogg",
  "./audio/engine-classic-load.ogg",
  "./audio/engine-sport-idle.ogg",
  "./audio/engine-sport-load.ogg",
  "./audio/engine-heavy-idle.ogg",
  "./audio/engine-heavy-load.ogg",
  "./audio/engine-moto-idle.ogg",
  "./audio/engine-moto-load.ogg",
  "./audio/engine-twin-idle.ogg",
  "./audio/engine-twin-load.ogg",
  "./audio/engine-small-moto.ogg",
  "./audio/engine-rotor-recorded.ogg",
  "./audio/engine-prop-recorded.ogg",
  "./audio/engine-jet-recorded.ogg",
  "./audio/engine-boat-recorded.ogg",
  "./audio/CREDITS.txt",
  "./assets/js/controls/dance-pose-controller.js?v=body1",
  "./assets/js/controls/dance-pose-worker.js",
  "./assets/js/controls/dance-stage.js?v=music2",
  "./assets/js/controls/dance-music.js?v=music3",
  "./assets/js/ui/account-access.js?v=20261024-head1",
  "./game-audio.js?v=20261023-3",
  "./console-world.js",
  "./console-world.css",
  "./assets/vendor/GLTFLoader-r128.js?v=world1",
  "./assets/vendor/DRACOLoader-r128.js?v=fleet1",
  "./assets/world/vehicles/ot-racer.glb",
  "./assets/world/vehicles/ot-coupe.glb",
  "./assets/js/controls/world-hand-controls.js",
  "./assets/js/controls/world-body-controls.js",
  "./assets/js/world-venue-bridge.js",
  "./assets/js/world-venue-trip.js",
  "./assets/ot-games-airframes.json",
  "./index.html?v=70645",
  "./style.css?v=70645",
  "./assets/vendor/three-r128.min.js?v=70645",
  "./assets/js/core/runtime-config.js?v=70645",
  "./assets/js/core/safe-pointer.js?v=70645",
  "./assets/js/core/viewport-manager.js?v=70645",
  "./assets/js/save-db.js?v=70645",
  "./firebase-config.js?v=70645",
  "./assets/js/game-account.js?v=70645",
  "./assets/js/multiplayer-rtdb.js?v=70645",
  "./app.js?v=70645",
  "./assets/js/ui/shared-modal.js?v=70645",
  "./assets/js/core/performance-guardian.js?v=70645",
  "./assets/js/multiplayer/room-manager.js?v=70645",
  "./assets/js/education/adaptive-learning.js?v=70645",
  "./assets/js/safety/child-safety.js?v=70645",
  "./manifest.webmanifest?v=70645",
];

const OPTIONAL_ASSETS = [
  "./audio/engine-car.ogg",
  "./audio/engine-moto.ogg",
  "./audio/engine-heli.ogg",
  "./audio/sources.json",

  './404.html',
  './family-mascots.js',
  './console-world.css',
  './console-world.js',
  './quest-chapter.js',
  './studio-world.css',
  './studio-world.js',
  './athos.glb',
  './assets/textures/asphalt-v628.png',
  './assets/textures/brick-v628.png',
  './assets/textures/bus-seat-v628.png',
  './assets/textures/gold-ore-v628.png',
  './assets/textures/grass-v628.png',
  './assets/textures/interior-floor-v628.png',
  './assets/textures/police-wall-v628.png',
  './assets/textures/roof-v628.png',
  './assets/textures/school-wall-v628.png',
  './assets/textures/stone-v628.png',
  './assets/textures/wood-v628.png',
  './assets/textures/sidewalk-v632.png',
  './assets/textures/interior-wall-v632.png',
  './assets/textures/home-floor-v632.png',
  './assets/textures/market-floor-v632.png',
  './assets/textures/market-wall-v632.png',
  './assets/textures/school-floor-v632.png',
  './assets/textures/fire-station-wall-v632.png',
  './assets/textures/concrete-v632.png',
  './assets/textures/city-glass-v632.png',
  './assets/textures/emergency-metal-v632.png',
  './assets/world/pbr-manifest.json',
  './assets/branding/thiaguinho-solucoes-digitais.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon.png'
];

function freshRequest(resource) {
  const source = typeof resource === 'string' ? resource : resource.url;
  const external = /^https?:/i.test(source) && new URL(source).origin !== self.location.origin;
  return new Request(source, {
    cache: 'no-store',
    mode: external ? 'cors' : 'same-origin',
    credentials: external ? 'omit' : 'same-origin'
  });
}

function releasePath(resource) {
  const source = typeof resource === 'string' ? resource : resource.url;
  const url = new URL(source, self.registration.scope);
  const scope = new URL(self.registration.scope);
  let path = decodeURIComponent(url.pathname);
  if (path.startsWith(scope.pathname)) path = path.slice(scope.pathname.length);
  path = path.replace(/^\.?\//, '');
  return !path || path.endsWith('/') ? 'index.html' : path;
}

async function sha256(response) {
  const bytes = await response.clone().arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

async function verifyResponse(response, resource, manifest) {
  if (!response || !response.ok) throw new Error(`HTTP ${response?.status || 0}`);
  const path = releasePath(resource);
  const expected = manifest?.files?.[path];
  if (!/^[a-f0-9]{64}$/.test(String(expected || ''))) {
    throw new Error(`Hash ausente para ${path}`);
  }
  const actual = await sha256(response);
  if (actual !== expected) throw new Error(`SHA-256 divergente em ${path}`);
  return response;
}

async function fetchReleaseManifest() {
  const response = await fetch(freshRequest(RELEASE_MANIFEST));
  if (!response?.ok) throw new Error(`Manifesto da release: HTTP ${response?.status || 0}`);
  const manifest = await response.clone().json();
  if (String(manifest?.version) !== VERSION || manifest?.build !== BUILD
    || manifest?.revision !== REVISION || manifest?.algorithm !== 'SHA-256') {
    throw new Error('Manifesto e service worker pertencem a versões diferentes');
  }
  if (!manifest.files || typeof manifest.files !== 'object') throw new Error('Manifesto sem hashes');
  return { manifest, response };
}

async function fetchAndCacheOptional(cache, resource) {
  try {
    if (await cache.match(resource)) return { resource, ok:true };
    const response = await fetch(freshRequest(resource));
    if (!response || (!response.ok && response.type !== 'opaque')) throw new Error(`HTTP ${response?.status || 0}`);
    await cache.put(resource, response.clone());
    return { resource, ok:true };
  } catch (error) {
    return { resource, ok:false, error:String(error?.message || error) };
  }
}

async function updateProgress(done, total, reused = 0, error = '') {
  const scope = new URL(self.registration.scope), repair = new URL('../atualizar/', scope);
  const clients = await self.clients.matchAll({ type:'window', includeUncontrolled:true });
  for (const client of clients) {
    if (client.url.startsWith(scope.href) || client.url.startsWith(repair.href)) {
      client.postMessage({type:'OTTHI_UPDATE_PROGRESS',build:BUILD,revision:REVISION,done,total,reused,error});
    }
  }
}

async function verifiedPreviousResponse(resource, manifest, previousCaches) {
  const path = new URL(resource, self.registration.scope).pathname;
  for (const previous of previousCaches) {
    const cached = await previous.match(path, { ignoreSearch:true });
    if (!cached) continue;
    try { await verifyResponse(cached, resource, manifest); return cached; } catch {}
  }
  return null;
}

async function cacheOptionalAssets() {
  const cache=await caches.open(CACHE),results=[];
  for(let i=0;i<OPTIONAL_ASSETS.length;i+=3)results.push(...await Promise.all(OPTIONAL_ASSETS.slice(i,i+3).map(resource=>fetchAndCacheOptional(cache,resource))));
  const failed=results.filter(item=>!item.ok);
  if(failed.length)console.warn('[OTTHI SW] Recursos opcionais não pré-cacheados:',failed);
}

async function cacheApplicationShell() {
  const { manifest, response:manifestResponse } = await fetchReleaseManifest();
  const verified = [];
  const names=(await caches.keys()).filter(name=>CACHE_PREFIXES.some(prefix=>name.startsWith(prefix))&&name!==CACHE).reverse();
  const previousCaches=await Promise.all(names.map(name=>caches.open(name)));
  let reused=0;
  await updateProgress(0,REQUIRED_SHELL.length);
  for (let i=0;i<REQUIRED_SHELL.length;i+=4) {
    const batch=await Promise.all(REQUIRED_SHELL.slice(i,i+4).map(async resource=>{
      let response=await verifiedPreviousResponse(resource,manifest,previousCaches);
      if(response)reused++;else{response=await fetch(freshRequest(resource));await verifyResponse(response, resource, manifest);}return {resource,response};
    }));verified.push(...batch);
    await updateProgress(verified.length,REQUIRED_SHELL.length,reused);
  }
  await caches.delete(CACHE);
  const cache = await caches.open(CACHE);
  await cache.put(RELEASE_MANIFEST, manifestResponse.clone());
  for (const { resource, response } of verified) {
    await cache.put(resource, response.clone());
    if (releasePath(resource) === 'index.html') await cache.put('./', response.clone());
  }
}

self.addEventListener('install', event => {
  // On upgrades the ready page acknowledges SKIP_WAITING. Activating while an
  // old document is still parsing can mix its config with the new app bundle.
  event.waitUntil(cacheApplicationShell()
    .catch(async error => {
      await caches.delete(CACHE);
      await updateProgress(0,REQUIRED_SHELL.length,0,String(error?.message||error));
      console.error('[OTTHI SW] Release incompleta; cache anterior preservado.', error);
      throw error;
    }));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => CACHE_PREFIXES.some(prefix => name.startsWith(prefix)) && name !== CACHE)
      .map(name => caches.delete(name)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type:'window', includeUncontrolled:true });
    clients.forEach(client => client.postMessage({ type:'OTTHI_GAME_UPDATE_READY', build:BUILD, version:VERSION }));
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'OTTHI_GET_RELEASE') event.ports?.[0]?.postMessage({type:'OTTHI_RELEASE',build:BUILD,revision:REVISION,version:VERSION});
  if (event.data?.type === 'OTTHI_CACHE_OPTIONAL') event.waitUntil(cacheOptionalAssets());
  if (event.data?.type === 'PURGE_OTTHI_GAME_CACHE') {
    event.waitUntil(caches.keys().then(names => Promise.all(
      names.filter(name => CACHE_PREFIXES.some(prefix => name.startsWith(prefix))).map(name => caches.delete(name))
    )));
  }
});

async function activeReleaseManifest(cache) {
  const response = await cache.match(RELEASE_MANIFEST);
  if (!response) throw new Error('Manifesto da release ativa ausente');
  const manifest = await response.json();
  if (String(manifest?.version) !== VERSION || manifest?.build !== BUILD || manifest?.revision !== REVISION) {
    throw new Error('Manifesto da release ativa inválido');
  }
  return manifest;
}

async function cachedFallback(cache, request, navigation) {
  if (navigation) {
    return await cache.match('./index.html?v=70645') || await cache.match('./') || null;
  }
  return await cache.match(request, { ignoreSearch:false })
    || await cache.match(new URL(request.url).pathname, { ignoreSearch:true })
    || null;
}

async function networkFirst(request, navigation = false) {
  const cache = await caches.open(CACHE);
  const url = new URL(request.url);
  const probe = url.searchParams.has('otthi_probe');
  if (probe) return fetch(request, { cache:'no-store' });
  if (releasePath(request) === 'release-manifest.json') {
    return await cache.match(RELEASE_MANIFEST) || fetch(request, { cache:'no-store' });
  }
  try {
    const response = await fetch(request, { cache:'no-store' });
    if (!response?.ok) {
      const cached = await cachedFallback(cache, request, navigation);
      return cached || response;
    }
    const manifest = await activeReleaseManifest(cache);
    const protectedFile = Object.prototype.hasOwnProperty.call(manifest.files || {}, releasePath(request));
    if (protectedFile) {
      try {
        await verifyResponse(response, request, manifest);
      } catch (error) {
        const cached = await cachedFallback(cache, request, navigation);
        if (cached) return cached;
        throw error;
      }
    }
    if (navigation) {
      await cache.put('./', response.clone());
    } else {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cachedFallback(cache, request, navigation);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch:false });
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const manifest = await activeReleaseManifest(cache);
    if (Object.prototype.hasOwnProperty.call(manifest.files || {}, releasePath(request))) await verifyResponse(response, request, manifest);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin) return;
  // The world worker also sees requests made by its embedded activities. Their
  // HTML and assets must never be replaced by the world's offline index.
  if (!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;

  const navigation = event.request.mode === 'navigate';
  const code = /\.(?:js|css|html|webmanifest|json)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (navigation || code || url.searchParams.has('otthi_probe')) {
    event.respondWith(networkFirst(event.request, navigation));
    return;
  }
  event.respondWith(cacheFirst(event.request));
});

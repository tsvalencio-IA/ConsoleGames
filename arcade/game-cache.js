/* Shared policy for the sibling games' isolated PWA caches. */
'use strict';
function installGameCache({prefix, versionedCache, files, activateImmediately=false, cacheAssets=false}) {
  const scope = new URL(self.registration.scope);
  const mount = '@'+encodeURIComponent(scope.pathname);
  const cacheName = versionedCache+mount;
  const index = new URL('index.html', scope);
  const shell = [...new Set(files)];
  const shellUrls = new Set(shell.map(path => new URL(path, scope).href));
  const owns = url => url.origin === scope.origin && url.pathname.startsWith(scope.pathname);
  const home = url => url.pathname === scope.pathname || url.pathname === index.pathname;
  async function isEarlierCache(name) {
    if (!name.startsWith(prefix) || name === cacheName) return false;
    if (name.includes('@')) return name.endsWith(mount);
    // Old workers shared names across mount points. Remove an old cache only
    // when its contents demonstrate that this game scope exclusively owned it.
    const entries = await (await caches.open(name)).keys();
    return entries.length>0 && entries.every(entry => owns(new URL(entry.url)));
  }

  self.addEventListener('install', event => {
    event.waitUntil((async () => {
      await caches.delete(cacheName);
      const cache = await caches.open(cacheName);
      let next = 0;
      let failed = false;
      // Store each response immediately. Holding all unread response bodies
      // can stall installation on a transport with limited connections.
      const results = await Promise.allSettled(Array.from({length: Math.min(4, shell.length)}, async () => {
        while (!failed && next < shell.length) {
          const path = shell[next++];
          try {
            const response = await fetch(new Request(path, {cache:'no-store'}));
            if (!response.ok) throw Error('Incomplete game shell: '+path+' HTTP '+response.status);
            if (response.redirected && response.url !== new URL(path, scope).href) {
              throw Error('Game shell redirected: '+path);
            }
            await cache.put(path, response);
          } catch (error) {
            failed = true;
            throw error;
          }
        }
      }));
      const error = results.find(result => result.status === 'rejected');
      if (error) {
        await caches.delete(cacheName);
        throw error.reason;
      }
      if (activateImmediately) await self.skipWaiting();
    })());
  });

  self.addEventListener('message', event => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  });
  self.addEventListener('activate', event => {
    event.waitUntil((async () => {
      const names = await caches.keys();
      await Promise.all(names.map(async name => {if(await isEarlierCache(name))await caches.delete(name);}));
      await self.clients.claim();
    })());
  });

  self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    const navigation = request.mode === 'navigate';
    // An installed game can request its exact, versioned shared scripts. It
    // cannot supply another game's HTML or assets to a sibling navigation.
    if (url.origin !== scope.origin || (!owns(url) && (navigation || !shellUrls.has(url.href)))) return;
    const code = navigation || /\.(?:m?js|css|html|json|webmanifest|wasm|task)$/.test(url.pathname);
    event.respondWith((async () => {
      try {
        const response = await fetch(request, code ? {cache:'no-store'} : undefined);
        if (response.ok && !response.redirected && !navigation && !shellUrls.has(url.href) && (code || cacheAssets)) {
          // Keep the installed shell coherent for offline use until a new
          // worker has installed the full replacement. Store runtime extras.
          const copy = response.clone();
          event.waitUntil(caches.open(cacheName).then(cache => cache.put(request, copy)).catch(() => {}));
        }
        return response;
      } catch {
        try {
          const cache = await caches.open(cacheName);
          const hit = navigation
            ? (home(url) ? await cache.match(index.href) : null)
            : await cache.match(request);
          return hit || Response.error();
        } catch {
          return Response.error();
        }
      }
    })());
  });
}

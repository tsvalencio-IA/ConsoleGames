/* Resolve game and launcher routes from the copy of the console being served. */
(() => {
  'use strict';
  const scriptUrl = new URL(document.currentScript.src, document.baseURI);
  const root = new URL('../', scriptUrl);
  const consoleUrl = new URL('arcade/',root);
  const routes = Object.freeze({
    otthi: 'games/otthi/', familia: 'games/familia/3d/', kart: 'games/kart/',
    boxe: 'games/boxe/', tenis: 'games/tenis/', ar: 'games/ar/',
    voo: 'games/voo/', danca: 'games/danca/'
  });
  const game = id => Object.hasOwn(routes, id) ? new URL(routes[id], root).href : null;
  const launch = id => id === 'otthi' && window.navigator?.onLine !== false
    ? new URL('games/atualizar/', root).href : game(id);

  function worldReturn(value) {
    try {
      const url = new URL(value);
      const path = new URL(routes.otthi, root).pathname;
      return url.origin === root.origin && !url.username && !url.password
        && (url.pathname === path || url.pathname === path + 'index.html') ? url : null;
    } catch { return null; }
  }

  function canonicalPath(raw) {
    const u = new URL(raw, document.baseURI || location.href);
    if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null;
    const legacyPages = u.host === 'tsvalencio-ia.github.io';
    const legacyVercel = /^otthi-world-campanha-teste(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(u.host);
    if (u.origin !== root.origin && !legacyPages && !legacyVercel) return null;

    let path = u.pathname;
    if (u.origin === root.origin && path.startsWith(root.pathname)) {
      path = '/' + path.slice(root.pathname.length);
    }
    const pagesPrefix = '/ConsoleGames';
    if (path === pagesPrefix || path.startsWith(pagesPrefix + '/')) path = path.slice(pagesPrefix.length) || '/';
    else if (legacyPages && u.origin !== root.origin) return null;
    let target;
    if (/^\/(?:index\.html|console(?:\.html|\/)?|arcade\/?(?:index\.html)?)?$/.test(path)) {
      target = consoleUrl;
    } else if (path === '/games/familia' || path === '/games/familia/' || path === '/games/familia/index.html') {
      target = new URL(routes.familia, root);
    } else if (path.startsWith('/arcade/') || /^\/escola(?:\/|$)/.test(path)
      || /^\/games\/atualizar(?:\/|$)/.test(path)
      || /^\/android\/thIAguinho-ARCADE-OT\.apk$/.test(path)
      || Object.hasOwn(routes, /^\/games\/([^/]+)(?:\/|$)/.exec(path)?.[1])) {
      target = new URL(path.slice(1), root);
    }
    if (!target) return null;
    const result = new URL(target);
    result.search = u.search;
    result.hash = u.hash;
    return result.href;
  }

  window.OTTHI_CANONICAL = Object.freeze({consoleUrl: consoleUrl.href, game, launch, worldReturn, resolve: canonicalPath});

  function normalize(anchor) {
    const raw = anchor.getAttribute('href');
    if (!raw || raw.startsWith('#') || anchor.hasAttribute?.('data-external-site')) return;
    try {
      const target = canonicalPath(anchor.href);
      if (target && target !== anchor.href) anchor.href = target;
    } catch { /* A malformed or unrelated link remains owned by its page. */ }
  }
  function scan(node) {
    if (node.nodeType === 1 && node.matches?.('a[href]')) normalize(node);
    node.querySelectorAll?.('a[href]').forEach(normalize);
  }
  scan(document);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') normalize(record.target);
      else record.addedNodes.forEach(scan);
    }
  }).observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['href']
  });
})();

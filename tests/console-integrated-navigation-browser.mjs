/* Integrated navigation through the real pages and controls. Local save and
 * account fixtures are disposable. Venue arrival uses the existing QA teleport. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import http from 'node:http';
import { extname, resolve } from 'node:path';
import { chromium } from 'playwright';
import { browserContextNetwork, browserNetwork } from './helpers/browser-network.mjs';
import { installConsoleStubs } from './helpers/console-context.mjs';

const out = process.env.OT_ROUTE_OUT || 'test-results/console-integrated-navigation';
const supplied = process.env.OT_ROUTE_BASE;
const mode = process.env.OT_ROUTE_CASE || 'all';
assert(['all', 'catalog', 'trips', 'embedded', 'pause'].includes(mode), 'Unknown route validation mode');
const selectedPortals = process.env.OT_ROUTE_PORTALS?.split(',');
const portalIds = ['pingpong', 'dance', 'boxing', 'aviation', 'kart-aurora', 'kart-costa', 'kart-mirassol', 'kart-cedral'];
assert(!selectedPortals || selectedPortals.every(id => portalIds.includes(id)), 'Unknown World portal');
const wantsPortal = id => !selectedPortals || selectedPortals.includes(id);
const world = JSON.parse(fs.readFileSync('games/otthi/release-manifest.json'));
const keys = { kart: 'drive', boxe: 'box_pro', tenis: 'tennis', ar: 'ar_truck_sim', voo: 'usarmy_flight_sim' };
const games = {
  otthi: ['games/otthi/', 'app.js'],
  familia: ['games/familia/3d/', 'console-world.js'],
  kart: ['games/kart/', 'js/game_kart.js'],
  boxe: ['games/boxe/', 'js/game_box.js'],
  tenis: ['games/tenis/', 'js/game_tennis.js'],
  ar: ['games/ar/', 'js/game_ar.js'],
  voo: ['games/voo/', 'js/game_flight.js'],
  danca: ['games/danca/', 'app.js']
};
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.wasm': 'application/wasm', '.ogg': 'audio/ogg' };
const roots = ['/preview-build/', '/'];
async function localServer() {
  const root = resolve(process.env.OT_ROUTE_SERVE || '.');
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const mount = roots.find(prefix => pathname.startsWith(prefix));
      let file = resolve(root, pathname.slice(mount.length));
      if (file !== root && !file.startsWith(root + '/')) throw Error('invalid path');
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
      const bytes = await readFile(file);
      res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(bytes);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { origin: 'http://127.0.0.1:' + server.address().port, close: () => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); } };
}

const server = supplied ? null : await localServer();
const paths = process.env.OT_ROUTE_MOUNT ? [process.env.OT_ROUTE_MOUNT] : roots.slice().reverse();
const mounts = supplied ? [new URL(supplied)] : paths.map(path => new URL(path, server.origin));
const network = browserNetwork(mounts[0].href);
const browser = await chromium.launch({ ...network, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', ...(network.proxy ? ['--ignore-certificate-errors'] : [])] });
const report = { build: world.build, revision: world.revision, browser: browser.version(), mode, selectedPortals, checks: [], limits: ['Chromium uses a portrait touch viewport or a desktop viewport with a mouse. No physical phone, APK or camera inference is exercised.', 'External network is blocked for the disposable contexts. The local account and saves are test profiles.', 'Portal travel uses the normal AÇÃO menu after placing the test avatar by the venue. Route checks do not certify complete matches or performance.', 'A single native source asset per game is byte-checked in this browser suite. The full manifest needs its own integrity audit.'] };
fs.mkdirSync(out, { recursive: true });
const saveReport = () => fs.writeFileSync(out + '/result.json', JSON.stringify(report, null, 2));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const expectedPath = (mount, relative) => new URL(relative, mount).pathname;
const pathIs = (url, mount, relative) => url.origin === mount.origin && [expectedPath(mount, relative), expectedPath(mount, relative + 'index.html')].includes(url.pathname);

async function runMount(mount) {
  const desktop = mode === 'embedded' || process.env.OT_ROUTE_DEVICE === 'desktop';
  const context = await browser.newContext({ ...browserContextNetwork(mount.href), viewport: desktop ? { width: 1280, height: 800 } : { width: 393, height: 852 }, isMobile: !desktop, hasTouch: !desktop });
  await installConsoleStubs(context);
  await context.addInitScript(({ origin, pathname }) => {
    if (location.origin !== origin || !location.pathname.startsWith(pathname)) return;
    if (/\/games\/(kart|boxe|tenis|ar|voo)\//.test(location.pathname)) {
      const auth = window.firebase?.auth();
      if (auth) { auth.currentUser = null; window.firebase.auth = () => auth; }
    }
    const save = 'otthos_life_world_roleplay_v700';
    if (!localStorage.getItem(save)) localStorage.setItem(save, JSON.stringify({ version: 705, profile: { name: 'Console QA', nameConfirmed: true, playerId: 'console-navigation-qa', coins: 4321, xp: 1234 }, settings: { quality: 'low', worldHud: 'clean', sound: false }, flags: { accountPromptedV635: true }, guardian: { sessionLimitMinutes: 0 }, tools: { equipped: 'none', owned: ['axe', 'pickaxe', 'hoe', 'shovel', 'bucket'], harvested: { wood: 7 } }, familyAdventure: { party: { controller: 'thiago', members: ['thiago', 'luna', 'liz'] } }, vehicles: { owned: ['garage-orange', 'br-fusca'] } }));
    if (!localStorage.getItem('console-navigation-qa')) localStorage.setItem('console-navigation-qa', 'retained');
  }, { origin: mount.origin, pathname: mount.pathname });
  const failures = [], errors = [], visited = [], verified = [], loaded = new Map();
  const record = step => {
    verified.push(step);
    report.inProgress = { mount: mount.href, desktop, verified, visits: visited };
    saveReport();
  };
  await context.route(/^https?:\/\//, route => {
    const url = new URL(route.request().url());
    if (url.origin === mount.origin && url.pathname.startsWith(mount.pathname)) return route.continue();
    if (route.request().isNavigationRequest()) failures.push(url.href);
    return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(35000);
  const activate = (selector, options) => {
    const target = page.locator(selector).first();
    return desktop ? target.click(options) : target.tap(options);
  };
  page.on('pageerror', e => errors.push(e.message));
  page.on('framenavigated', frame => { const url = frame.url(); if (/^https?:/.test(url)) visited.push(url); });
  page.on('response', response => {
    const { pathname } = new URL(response.url());
    if (Object.values(games).some(([path, file]) => pathname === expectedPath(mount, path + file))) loaded.set(response.url(), response);
  });
  const open = relative => page.goto(new URL(relative, mount).href, { waitUntil: 'domcontentloaded', timeout: 90000 });
  const landed = relative => page.waitForURL(url => pathIs(url, mount, relative), { timeout: 95000 });
  async function consoleReady() {
    await landed('arcade/');
    await page.waitForFunction(() => window.THIAGUINHO_CONSOLE?.count === 8);
    assert.equal(await page.locator('.game-card').count(), 8);
    assert.equal(await page.evaluate(() => OTTHI_CANONICAL.consoleUrl), new URL('arcade/', mount).href);
  }
  async function worldReady() {
    await landed('games/otthi/');
    await page.waitForFunction(revision => window.OTTHI_RELEASE_COHERENT && window.OTTHI_RELEASE_REVISION === revision, world.revision, { timeout: 90000 });
    assert.equal(await page.locator('html').getAttribute('data-otthi-build'), world.build);
  }
  const ready = async slug => {
    if (slug === 'otthi') { await worldReady(); return; }
    await landed(games[slug][0]);
    await page.waitForFunction(() => !!window.OTTHI_CANONICAL);
    if (keys[slug]) await page.waitForFunction(id => window.CONSOLE_GAME_ID === id && window.Games?.some(g => g.id === id), keys[slug]);
    if (slug === 'danca') await page.locator('[data-youtube-url]').waitFor();
    if (slug === 'familia') await page.locator('#start').waitFor();
    if (slug === 'ar' || slug === 'voo') {
      const worldLink = await page.locator('.ot-games-world-link').evaluate(a => a.href);
      assert(pathIs(new URL(worldLink), mount, 'games/otthi/'));
      assert.equal(new URL(worldLink).searchParams.get('ot-games'), slug === 'ar' ? 'ground' : 'plane');
    }
  };
  async function fromConsole(slug) {
    await activate(`[data-game="${slug}"] [data-launch="${slug}"]`);
    if (slug !== 'otthi') { await ready(slug); return; }
    await Promise.race([
      worldReady(),
      page.waitForFunction(() => window.OTTHI_UPDATE_STATE?.phase === 'error' && window.OTTHI_UPDATE_STATE.error, null, { timeout: 90000 })
        .then(async result => { throw Error('World recovery rejected the current release: ' + await result.jsonValue()); })
    ]);
  }
  async function fromGame(slug) {
    if (slug === 'familia') {
      await activate('#start');
      await activate('#menuBtn');
      const worldLink = await page.locator('#menuChoices a').first().evaluate(a => a.href);
      assert(pathIs(new URL(worldLink), mount, 'games/otthi/'));
      assert.equal(new URL(worldLink).searchParams.get('family'), '1');
      await activate('.family-console-return');
    } else if (slug === 'danca') {
      await activate('#worldVenueDialog header a');
    } else if (slug === 'otthi') {
      await activate('#lobby .console-world-link');
    } else {
      await activate('a.arcade-return:visible');
    }
    await consoleReady();
  }
  async function byteCheck(slug, surface = page) {
    const [path, file] = games[slug], from = path + file;
    const asset = await surface.locator('body').evaluate((_, file) => Array.from(document.scripts).find(s => s.src && new URL(s.src).pathname.endsWith('/' + file))?.src, file);
    assert(asset, 'Game does not reference its native script: ' + slug);
    assert.equal(new URL(asset).pathname, expectedPath(mount, from));
    const response = loaded.get(asset);
    assert(response, 'Browser did not load ' + asset);
    assert.equal(response.status(), 200, from);
    assert.equal(sha(await response.body()), sha(fs.readFileSync(from)), from + ' differs from workspace');
  }
  const worldSave = () => page.evaluate(() => {
    const s = OTTHOS_TEST_API.getState();
    // The generated scenery resource list can differ across page loads. The
    // save contains the owned/equipped tools and harvested stock, not that list.
    const { equipped, owned, harvested } = OTTHOS_TEST_API.tools();
    return { coins: s.profile.coins, xp: s.profile.xp, playerId: s.profile.playerId, owned: s.vehicles.owned, party: s.familyAdventure.party, tools: { equipped, owned, harvested }, marker: localStorage.getItem('console-navigation-qa') };
  });
  try {
    console.log('TEST MOUNT', mount.href, mode);
    await open('console.html'); await consoleReady();
    console.log('CONSOLE READY', page.url());
    if (mode === 'all' || mode === 'catalog') {
      await open(''); await consoleReady();
      const manifest = new URL(await page.locator('link[rel="manifest"]').getAttribute('href'), page.url());
      const data = await (await context.request.get(manifest.href)).json();
      assert.equal(new URL(data.start_url, manifest).pathname, expectedPath(mount, 'arcade/'));
      const start = new URL(data.start_url, manifest);
      const id = typeof data.id === 'string' && data.id ? new URL(data.id, start.origin) : start;
      assert.equal(id.href, new URL('arcade/', mount).href);
      assert.equal(new URL(data.scope, manifest).pathname, mount.pathname);
      await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.endsWith('/arcade/sw.js'));
      const cdp = await context.newCDPSession(page);
      const appManifest = await cdp.send('Page.getAppManifest');
      assert.equal(appManifest.errors.filter(e => e.critical).length, 0, 'valid PWA manifest');
      assert.equal(appManifest.url, manifest.href);
      await activate('[data-favorite="voo"]');
      await activate('button[data-filter="favoritos"]');
      assert.deepEqual(await page.locator('.game-card').evaluateAll(cards => cards.map(c => c.dataset.game)), ['voo']);
      await fromConsole('voo'); await fromGame('voo');
      for (const slug of Object.keys(games)) {
        await fromConsole(slug); await byteCheck(slug); await fromGame(slug);
        record('card:' + slug);
        console.log('CONSOLE ROUND TRIP', mount.pathname, slug);
      }
      for (const [slug, [path]] of Object.entries(games)) {
        await open(path + 'index.html'); await ready(slug); await fromGame(slug);
        record('direct:' + slug);
      }
      await activate('button[data-filter="favoritos"]');
      assert.equal(await page.locator('[data-game="voo"]').count(), 1, 'favorite survives navigation');
      await activate('button[data-filter="todos"]');
      await context.setOffline(true);
      try {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await consoleReady();
        const offlineWorld = await page.locator('[data-game="otthi"] [data-launch="otthi"]').evaluate(a => a.href);
        assert(pathIs(new URL(offlineWorld), mount, 'games/otthi/'));
        assert.equal(await page.evaluate(() => localStorage.getItem('console-navigation-qa')), 'retained');
        record('offline:arcade');
      } finally { await context.setOffline(false); }
    }
    if (mode === 'pause') {
      for (const slug of Object.keys(keys)) {
        await fromConsole(slug);
        await activate('[data-solo-start]');
        await activate('#phase-grid .mission-card:not(.locked)');
        await activate('[data-mode="controls"]');
        await activate('#arcade-pause');
        await activate('#arcade-pause-modal [data-action="career"]');
        await page.locator('#arcade-pause-modal [data-career-panel]').waitFor();
        await activate('#arcade-pause-modal [data-action="exit"]');
        await consoleReady();
        record('pause:' + slug);
        console.log('PAUSE RETURN', mount.pathname, slug);
      }
    }
    if (mode === 'all' || mode === 'trips' || mode === 'embedded') {
      await fromConsole('otthi');
      await activate('#playBtn');
      await page.waitForFunction(() => window.OTTHI_VENUES?.diagnostics().ready && !OTTHOS_TEST_API.getGame().paused, null, { timeout: 180000 });
      const before = await worldSave();
      assert.equal(before.coins, 4321);
      const portal = async id => {
        const venue = await page.evaluate(id => OTTHI_VENUES.locations().find(v => v.id === 'venue-' + id), id);
        assert(venue, 'Missing venue ' + id);
        await page.evaluate(v => OTTHOS_TEST_API.teleport(v.navX, v.navZ), venue);
        const contextId = id === 'aviation' ? 'ot-flight-academy'
          : (id.startsWith('kart-') ? id.replace('kart-', 'kart-race-') : 'activity-venue-' + id);
        await page.waitForFunction(contextId => OTTHOS_TEST_API.getContext()?.id === contextId, contextId);
        // The active button pulses indefinitely by design. It need not stop
        // animating for the actual pointer/touch path to accept a tap.
        await activate('#actionBtn:visible', { force: true });
        if (id === 'aviation') await activate('[data-flight-academy="sim"]');
        if (id === 'kart-mirassol' || id === 'kart-cedral') await activate('[data-rio-kart-enter]');
      };
      if (wantsPortal('pingpong')) {
        await portal('pingpong');
        const table = page.frameLocator('#worldVenueDialog iframe');
        await table.locator('#phase-screen:not(.hidden)').waitFor();
        const embedded = await table.locator('body').evaluate(() => ({ base: document.baseURI, console: window.OTTHI_CANONICAL?.consoleUrl, game: window.CONSOLE_GAME_ID }));
        assert.equal(embedded.base, new URL(games.tenis[0], mount).href);
        assert.equal(embedded.console, new URL('arcade/', mount).href);
        assert.equal(embedded.game, keys.tenis);
        await byteCheck('tenis', table);
        await activate('[data-venue-close]');
        await page.waitForFunction(() => !OTTHI_VENUES.diagnostics().active && !OTTHOS_TEST_API.getGame().paused);
        assert.deepEqual(await worldSave(), before);
        record('portal:pingpong');
      }
      if (wantsPortal('dance')) {
        await portal('dance');
        await page.locator('#worldVenueDialog [data-youtube-url]').waitFor();
        assert(pathIs(new URL(page.url()), mount, 'games/otthi/'));
        await activate('[data-venue-close]');
        await page.waitForFunction(() => !OTTHI_VENUES.diagnostics().active && !OTTHOS_TEST_API.getGame().paused);
        assert.deepEqual(await worldSave(), before);
        record('portal:dance');
      }
      const portalCases = { boxing: ['boxe', '[data-venue-return]'], aviation: ['voo', '.flight-return-world'], 'kart-aurora': ['kart', '[data-venue-return]'], 'kart-costa': ['kart', '[data-venue-return]'], 'kart-mirassol': ['kart', '[data-venue-return]'], 'kart-cedral': ['kart', '[data-venue-return]'] };
      for (const [id, [slug, button]] of Object.entries(portalCases)) {
        if (!wantsPortal(id) || (mode === 'embedded' && slug === 'kart')) continue;
        await portal(id);
        if (desktop && slug !== 'kart') {
          const frame = page.frameLocator('#worldVenueDialog iframe');
          await frame.locator('#phase-screen:not(.hidden)').waitFor();
          const embedded = await frame.locator('body').evaluate(() => ({
            href: location.href, game: window.CONSOLE_GAME_ID,
            launcher: window.OTTHI_CANONICAL?.consoleUrl
          }));
          assert(pathIs(new URL(embedded.href), mount, games[slug][0]));
          assert.equal(embedded.game, keys[slug]);
          assert.equal(embedded.launcher, new URL('arcade/', mount).href);
          await byteCheck(slug, frame);
          await activate('[data-venue-close]');
          await page.waitForFunction(() => !OTTHI_VENUES.diagnostics().active && !OTTHOS_TEST_API.getGame().paused);
        } else {
          await ready(slug);
          await byteCheck(slug);
          assert.equal(new URL(page.url()).searchParams.get('venuePage'), '1');
          if (id === 'kart-mirassol' || id === 'kart-cedral') {
            const title=id==='kart-mirassol'?'AUTÓDROMO DE MIRASSOL':'CIRCUITO TÉCNICO DE CEDRAL';
            await page.locator('#phase-grid .mission-card').filter({hasText:title}).waitFor();
            assert.equal(await page.locator('#phase-grid .mission-card').count(),1);
            assert.equal(await page.evaluate(()=>WorldVenueTrip.current()?.id),id);
          }
          await activate(button);
          await worldReady();
        }
        await page.waitForFunction(() => OTTHI_VENUES.diagnostics().ready && OTTHOS_TEST_API.getGame().running && !WorldVenueTrip.current(), null, { timeout: 180000 });
        assert.deepEqual(await worldSave(), before);
        record('portal:' + id);
        console.log('WORLD PORTAL ROUND TRIP', mount.pathname, id);
      }
      await activate('#quickToggleBtn');
      await activate('#worldConsoleLink'); await consoleReady();
      assert.equal(await page.evaluate(() => localStorage.getItem('console-navigation-qa')), 'retained');
      record('return:console');
    }
    assert.deepEqual(failures, [], 'navigation left its deployment');
    assert.deepEqual(errors, [], 'browser exceptions');
    report.checks.push({ mount: mount.href, desktop, verified, visits: visited, passed: true });
  } catch (error) {
    const visible = await page.locator('body').innerText({ timeout: 4000 }).catch(() => '');
    report.checks.push({ mount: mount.href, passed: false, url: page.url(), verified, visits: visited, failures, errors, visible: visible.slice(0, 500), failure: error.stack });
    await page.screenshot({ path: out + '/failure.png', timeout: 10000 }).catch(() => {});
    throw error;
  } finally {
    delete report.inProgress;
    saveReport();
    await context.close();
  }
}

try {
  const errors = [];
  for (const mount of mounts) {
    try { await runMount(mount); }
    catch (error) { errors.push(error); console.error('ROUTE FAILURE', mount.href, error.message); }
  }
  report.passed = errors.length === 0;
  if (errors.length) throw new AggregateError(errors, 'Integrated route validation failed');
  console.log('PASS integrated console routes', report.build, report.revision);
} finally {
  report.checkedAt = new Date().toISOString();
  saveReport();
  await browser.close();
  await server?.close();
}

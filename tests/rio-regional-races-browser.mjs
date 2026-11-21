import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { multiplayerServer } from './helpers/multiplayer-browser-fixture.mjs';
import { installCityInspection } from './helpers/world-city-inspection.mjs';

const output = process.env.OT_RIO_RACES_OUT || 'test-results/rio-regional-races';
fs.mkdirSync(output, { recursive: true });
const source = fs.readFileSync('games/otthi/app.js', 'utf8');
assert(source.includes('function openRioRegionalRace'), 'Compile the current World modules first.');
const end = source.lastIndexOf('})();');
const hook = `
 let rioRaceQaMap=null,rioRaceQaRAFStopped=false;
 window.__RIO_RACE_QA={
  snapshot:()=>{
   const k=SPORTS_V705.kart,track=v705TrackDistance(k,player.x,player.z);
   return {id:k.id,mode:k.mode,active:k.active,lap:k.lap,checkpoint:k.expected,checkpoints:k.checkpoints.length,
     length:k.curve.getLength(),countdown:k.countdown,rivals:k.ai.length,x:player.x,z:player.z,heading:player.car.heading,
     speed:player.car.speed,t:track.t,trackDistance:track.distance,vehicle:player.vehicle,car:player.car.id,
     result:document.querySelector('#raceStatus')?.textContent,record:state.races.regionalCircuits?.[k.id]};
  },
  profile:()=>({xp:state.profile.xp,coins:state.profile.coins,races:structuredClone(state.races),owned:structuredClone(state.vehicles.owned)}),
  advance:(frames)=>{
   if(!rioRaceQaRAFStopped){cancelAnimationFrame(raf);rioRaceQaRAFStopped=true;}
   const dt=1/60,k=SPORTS_V705.kart;
   if(rioRaceQaMap?.id!==k.id)rioRaceQaMap={id:k.id,distance:0,offTrackMax:0,checkpoints:[],turboFrames:0,frames:0};
   for(let i=0;i<frames&&k.active;i++){
    cityQaMs+=1000/60;
    const {x,z}=player,track=v705TrackDistance(k,x,z),length=k.curve.getLength(),speed=player.car.speed;
    const look=k.curve.getPointAt((track.t+(3.5+Math.abs(speed)*.19)/length)%1);
    const desired=Math.atan2(look.x-x,look.z-z),error=Math.atan2(Math.sin(desired-player.car.heading),Math.cos(desired-player.car.heading));
    const curvature=Math.max(v705KartCurvature(k,track.t),v705KartCurvature(k,(track.t+Math.abs(speed)*.55/length)%1));
    const safeSpeed=Math.max(7.5,21-curvature*42-Math.abs(error)*2);
    input.virtualActive=true;
    input.virtualX=k.countdown>0?0:clamp(-error*1.1,-.75,.75);
    input.virtualZ=k.countdown>0?0:clamp((safeSpeed-speed)*.32,0,1);
    const before=k.expected;
    beginWorldQueryFrame();
    try{updatePlayer(dt);updateWorldSportsV704(dt);}finally{endWorldQueryFrame();}
    if(k.expected!==before)rioRaceQaMap.checkpoints.push({lap:k.lap,checkpoint:before});
    rioRaceQaMap.distance+=Math.hypot(player.x-x,player.z-z);
    rioRaceQaMap.offTrackMax=Math.max(rioRaceQaMap.offTrackMax,track.distance);
    if(performance.now()<Number(player.car.kartBoostUntil||0))rioRaceQaMap.turboFrames++;
    rioRaceQaMap.frames++;
   }
   return {...window.__RIO_RACE_QA.snapshot(),telemetry:rioRaceQaMap};
  },
  resume:()=>{input.virtualActive=false;input.virtualX=input.virtualZ=0;if(rioRaceQaRAFStopped){rioRaceQaRAFStopped=false;clock.getDelta();raf=requestAnimationFrame(gameLoop);}},
  save:()=>saveState(true),
 };
 `;
const report = {
  passed: false,
  races: [],
  layouts: [],
  errors: [],
  environment: { browser: 'Chromium headless', renderer: 'ANGLE SwiftShader', viewport: { width: 1280, height: 720 }, quality: 'low' },
  limits: [
    'Disposable local profile. External accounts and Firebase requests are blocked.',
    'Native compiled UI starts each event. Travel to the gates is seeded, then a deterministic analog driver uses the native input, vehicle and race update functions through every sector.',
    'Simulation advances at 60 Hz without normal rendering. This does not measure native FPS, full-world load, live multiplayer or a physical device.',
  ],
};
const server = await multiplayerServer();
const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
let page;

try {
  const context = await browser.newContext({ viewport: report.environment.viewport, serviceWorkers: 'block' });
  await context.route(/^https?:\/\//, route => new URL(route.request().url()).origin === server.origin ? route.continue() : route.abort());
  await context.addInitScript(() => {
    const key = 'otthos_life_world_roleplay_v700';
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
      version: 705,
      profile: { name: 'Circuitos QA', nameConfirmed: true, playerId: 'rio-race-local', coins: 5000, xp: 400 },
      flags: { accountPromptedV635: true },
      settings: { quality: 'low', sound: false, worldHud: 'clean' },
      races: { wins: 5, coinWins: 2 },
      vehicles: { owned: ['br-fusca'] },
      guardian: { sessionLimitMinutes: 0 },
      familyAdventure: { party: { controller: 'thiago', members: ['thiago'] } },
    }));
  });
  page = await context.newPage();
  page.setDefaultTimeout(45000);
  page.on('pageerror', error => report.errors.push(error.stack));
  await installCityInspection(page, { appSource: source.slice(0, end) + hook + source.slice(end), capDuringBoot: true });

  const boot = async () => {
    await page.goto(server.origin + '/games/otthi/');
    await page.locator('#playBtn').click();
    await page.waitForFunction(() => window.__CITY_QA?.cap() && window.OTTHI_RIO_CIRCUITS &&
      !OTTHOS_TEST_API.getGame().paused && document.getElementById('modal').hidden, null, { timeout: 120000 });
  };
  const tapAutosized = async selector => {
    const el = page.locator(selector);
    await el.waitFor({ state: 'visible' });
    const rect = await el.boundingBox();
    assert(rect);
    await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2);
  };

  await boot();
  report.build = await page.evaluate(() => OTTHI_GAME_BUILD);
  report.revision = await page.evaluate(() => OTTHI_RELEASE_REVISION);
  report.before = await page.evaluate(() => __RIO_RACE_QA.profile());
  console.log('BOOT', report.build, report.revision);
  for (const [id, mode, rivals, laps] of [['mirassol', 'solo', 3, 3], ['cedral', 'time', 0, 2]]) {
    const venue = await page.evaluate(id => OTTHI_RIO_CIRCUITS.diagnostics().circuits.find(circuit => circuit.id === id), id);
    assert(venue);
    await page.evaluate(venue => OTTHOS_TEST_API.teleport(venue.navX, venue.navZ), venue);
    await page.waitForFunction(id => OTTHOS_TEST_API.getContext()?.id === 'kart-race-' + id, id);
    await tapAutosized('#actionBtn');
    for (const [width, height] of [[393, 852], [852, 393]]) {
      await page.setViewportSize({ width, height });
      const start = page.locator('#regionalKartStart');
      await start.scrollIntoViewIfNeeded();
      const layout = await page.evaluate(() => {
        const button = document.getElementById('regionalKartStart'), panel = document.getElementById('modalBody');
        const { x, y, width, height } = button.getBoundingClientRect();
        const front = document.elementFromPoint(x + width / 2, y + height / 2);
        return { width: innerWidth, height: innerHeight, button: { x, y, width, height },
          horizontalOverflow: Math.max(panel.scrollWidth - panel.clientWidth, document.documentElement.scrollWidth - innerWidth),
          hittable: button === front || button.contains(front) };
      });
      assert(layout.horizontalOverflow <= 1, JSON.stringify(layout));
      assert(layout.hittable, JSON.stringify(layout));
      report.layouts.push({ id, ...layout });
    }
    await page.setViewportSize(report.environment.viewport);
    await page.locator('#regionalKartAssist').selectOption('strong');
    if (rivals) await page.locator('#regionalKartDifficulty').selectOption('easy');
    await page.locator('#regionalKartStart').click();
    const started = await page.evaluate(() => __RIO_RACE_QA.snapshot());
    assert.equal(started.id, id);
    assert.equal(started.mode, mode);
    assert.equal(started.rivals, rivals);
    assert.equal(started.vehicle, true);
    assert.equal(started.active, true);
    console.log('START', id, started.length, started.checkpoints);
    let result;
    for (let batch = 0; batch < 80; batch++) {
      result = await page.evaluate(() => __RIO_RACE_QA.advance(150));
      report.last = result;
      if (batch % 10 === 0) console.log('DRIVE', id, result.lap, result.checkpoint, result.speed.toFixed(1), result.trackDistance.toFixed(2));
      if (!result.active) break;
    }
    let earlyExit=null;
    if(id==='mirassol'&&!result.active){
      await tapAutosized('[data-sport-exit]');
      earlyExit=await page.evaluate(()=>__RIO_RACE_QA.snapshot());
      assert(Math.hypot(earlyExit.x-venue.navX,earlyExit.z-venue.navZ)<4,'The results exit returns to Mirassol');
    }
    report.races.push({ venue, started, result, earlyExit });
    assert.equal(result.active, false, JSON.stringify(result));
    assert.equal(result.lap, laps);
    assert.equal(result.rivals, 0);
    assert.equal(result.telemetry.checkpoints.length, started.checkpoints * laps);
    assert(result.telemetry.distance / (started.length * laps) > .87);
    assert(result.telemetry.offTrackMax < 9, JSON.stringify(result));
    assert(result.telemetry.turboFrames > 0, JSON.stringify(result));
    assert.equal(result.record.runs, 1);
    assert(result.record.bestTime > result.record.bestLap);
    assert.match(result.result, mode === 'time' ? /Novo recorde/ : /1º lugar|Chegada/);
    const expectedSectors = Array.from({ length: laps }, (_, lap) => [
      ...Array.from({ length: started.checkpoints - 1 }, (_, index) => ({ lap, checkpoint: index + 1 })),
      { lap: lap + 1, checkpoint: 0 },
    ]).flat();
    assert.deepEqual(result.telemetry.checkpoints, expectedSectors);
    await page.evaluate(({ x, z }) => __CITY_QA.render(x, z, 154, 70), venue);
    await page.screenshot({ path: output + '/' + id + '.png', timeout: 60000 });
    await page.evaluate(() => __RIO_RACE_QA.resume());
    await page.waitForFunction(() => !document.body.classList.contains('world-race-active'));
    await tapAutosized('#actionBtn');
    assert.equal((await page.evaluate(() => __RIO_RACE_QA.snapshot())).vehicle, false);
    console.log('FINISH', id, result.record, result.telemetry.distance.toFixed(0));
  }
  report.after = await page.evaluate(() => __RIO_RACE_QA.profile());
  const wins = report.after.races.regionalCircuits.mirassol.wins;
  assert.equal(report.after.coins, report.before.coins + 42 * wins);
  assert.equal(report.after.xp, report.before.xp + (wins ? 65 : 30) + 25);
  assert.equal(report.after.races.wins, report.before.races.wins);
  assert.equal(report.after.races.coinWins, report.before.races.coinWins);
  assert.deepEqual(report.after.owned, report.before.owned);
  await page.evaluate(() => __RIO_RACE_QA.save());
  await boot();
  report.reloaded = await page.evaluate(() => __RIO_RACE_QA.profile());
  assert.deepEqual(report.reloaded, report.after);
  assert.deepEqual(report.errors, []);
  report.passed = true;
  console.log('PASS both full events, checkpoint order, single rewards and saved records');
} catch (error) {
  report.failure = error.stack;
  report.context = await page?.evaluate(() => ({
    name: document.getElementById('modalTitle')?.textContent,
    modalHidden: document.getElementById('modal')?.hidden,
    area: window.OTTHOS_TEST_API?.getContext(),
    regional: window.OTTHI_RIO_CIRCUITS?.diagnostics(),
  })).catch(() => null);
  throw error;
} finally {
  fs.writeFileSync(output + '/result.json', JSON.stringify(report, null, 2));
  await browser.close();
  await server.close();
}

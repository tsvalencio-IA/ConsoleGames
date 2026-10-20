/* Visual smoke: HTTP-served layout, NOT a gameplay/device certification.
   Remote services are intentionally blocked to test bundled HTML/CSS without
   connecting to production Firebase or requesting children's cameras. */
import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";
import {join} from "node:path";
const base="http://127.0.0.1:4173/";
const games=[
 ["kart","drive"],["boxe","box_pro"],["tenis","tennis"],
 ["ar","ar_truck_sim"],["voo","usarmy_flight_sim"],
 ["otthi","otthi"],["familia/3d","familia"]
];
const sizes=[
 {name:"mobile-360",width:360,height:740},
 {name:"mobile-390",width:390,height:844},
 {name:"landscape-667",width:667,height:375},
 {name:"desktop-1280",width:1280,height:800}
];
mkdirSync("test-results/mobile",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--use-gl=angle","--use-angle=swiftshader","--disable-dev-shm-usage","--no-sandbox"]});
let attempts=0;
try{
  for(const size of sizes){
    const context=await browser.newContext({viewport:{width:size.width,height:size.height},locale:"pt-BR",isMobile:size.width<768,hasTouch:size.width<768,deviceScaleFactor:1});
    // No real Firebase authentication or third-party requests in a test environment.
    await context.route(/^https?:\/\//,route=>{
      if(new URL(route.request().url()).origin===new URL(base).origin)route.continue();
      else route.abort("blockedbyclient");
    });
    const page=await context.newPage();
    await page.goto(base,{waitUntil:"domcontentloaded",timeout:45000});
    await page.waitForSelector(".game-card",{timeout:15000});
    assert.equal(await page.locator(".game-card").count(),7,"Biblioteca deve conter sete jogos");
    const firstWidth=await page.evaluate(()=>({window:window.innerWidth,scroll:document.documentElement.scrollWidth}));
    assert(firstWidth.scroll<=firstWidth.window+2,JSON.stringify({page:"console",size,firstWidth}));
    await page.screenshot({path:join("test-results/mobile","console-"+size.name+".png"),fullPage:true});
    attempts++;
    // A instalação nova utiliza um segundo endereço, ID e manifest independentes.
    await page.goto(base+"arcade/",{waitUntil:"domcontentloaded",timeout:45000});
    await page.waitForSelector(".game-card",{timeout:15000});
    assert.equal(await page.locator(".game-card").count(),7,"Arcade não mostra os sete jogos");
    const arcadeLinks=await page.locator("a.game-open").evaluateAll(nodes=>nodes.map(a=>new URL(a.href).pathname));
    assert(arcadeLinks.every(path=>path.startsWith("/games/") || path.startsWith("/ConsoleGames/games/")),JSON.stringify(arcadeLinks));
    const arcadeWidth=await page.evaluate(()=>({window:window.innerWidth,scroll:document.documentElement.scrollWidth}));
    assert(arcadeWidth.scroll<=arcadeWidth.window+2,JSON.stringify({page:"arcade",size,arcadeWidth}));
    const manifestHref=await page.locator('link[rel="manifest"]').getAttribute("href");
    assert.equal(manifestHref,"./manifest.webmanifest");
    await page.screenshot({path:join("test-results/mobile","arcade-"+size.name+".png"),fullPage:true});
    attempts++;
    for(const [slug,id] of games){
      await page.goto(base+"games/"+slug+"/",{waitUntil:"domcontentloaded",timeout:45000});
      const expected=slug==="familia/3d"?"familia":id;
      if(slug==="familia/3d")assert((await page.title()).includes("thIAguinho"),"HQ não carregou título");
      else if(slug==="otthi")assert((await page.title()).includes("OTTHI"),"OTThi não carregou título");
      else {
        const configured=await page.evaluate(()=>window.CONSOLE_GAME_ID||null);
        assert.equal(configured,id,"Jogo GAME com ID diferente: "+slug);
      }
      // Every game must load its own production sound/render layer.
      if(slug==="otthi"||slug==="familia/3d"){
        await page.waitForSelector("#studio-world-sound",{timeout:12000});
        const selector=slug==="otthi"?"#world-console-toolbar #studio-world-sound":"#bar .topRight #studio-world-sound";
        assert.equal(await page.locator(selector).count(),1,"World audio switch misplaced: "+slug);
      }else{
        await page.waitForSelector("#studio-audio-switch",{timeout:12000});
        const sceneMethod={kart:"renderWorld",boxe:"drawArena",tenis:"drawEnvironment",ar:"drawVirtualScene",voo:"_drawWorld"}[slug];
        await page.waitForFunction(([gameId,method])=>{
          const game=(window.Games||[]).find(g=>g.id===gameId);
          return typeof game?.logic?.[method]==="function" && game.logic[method].__studioScenes===true;
        },[id,sceneMethod],{timeout:12000});
        assert.equal(await page.locator("#studio-audio-switch").getAttribute("aria-pressed"),"true");
        await page.locator("#studio-audio-switch").click();
        assert.equal(await page.locator("#studio-audio-switch").getAttribute("aria-pressed"),"false");
        await page.locator("#studio-audio-switch").click();
        assert.equal(await page.locator("#studio-audio-switch").getAttribute("aria-pressed"),"true");
      }
      // Check visible app frames and horizontally scrollable root. Fixed HUD elements
      // are bounded by CSS, but actual matches/canvas scenes require separate tests.
      const box=await page.evaluate(()=>({
        innerWidth:window.innerWidth,
        scrollWidth:document.documentElement.scrollWidth,
        appHeight:document.body?.getBoundingClientRect()?.height
      }));
      assert(box.scrollWidth<=box.innerWidth+3,JSON.stringify({slug,size,box}));
      if(size.name==="mobile-360") await page.screenshot({path:join("test-results/mobile",slug.replace("/","-")+".png"),fullPage:false});
      attempts++;
    }
    await context.close();
  }
  console.log("Layout smoke OK: "+attempts+" checks, 7 games, 2 consoles, 4 viewports.");
}finally{
  await browser.close();
}

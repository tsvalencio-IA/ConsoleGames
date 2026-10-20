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
        const selector=slug==="otthi"?"#world-console-toolbar #studio-world-sound":"#overlay .panel #studio-world-sound";
        assert.equal(await page.locator(selector).count(),1,"World audio switch misplaced: "+slug);
        if(slug==="familia/3d"){
          assert.equal(await page.locator("#bar #studio-world-sound").count(),0,"Som cobre os controles do HUD");
          const hud=await page.evaluate(()=>{
            const b=document.querySelector("#bar");
            const stats=document.querySelector("#bar .topRight");
            const brand=document.querySelector("#bar .brand");
            const nav=document.querySelector("#world-console-toolbar");
            const toy=document.querySelector("#toybar");
            const rect=x=>{const r=x?.getBoundingClientRect();return r?{left:r.left,top:r.top,right:r.right,bottom:r.bottom}:null};
            return {width:innerWidth,bar:rect(b),stats:rect(stats),brand:rect(brand),nav:rect(nav),toy:rect(toy)}
          });
          assert(hud.brand.right<=hud.stats.left+3,"Marca e contadores sobrepostos: "+JSON.stringify(hud));
          if(size.width<=540 && hud.nav && hud.toy){
            const xOver=Math.max(0,Math.min(hud.nav.right,hud.toy.right)-Math.max(hud.nav.left,hud.toy.left));
            const yOver=Math.max(0,Math.min(hud.nav.bottom,hud.toy.bottom)-Math.max(hud.nav.top,hud.toy.top));
            assert(xOver*yOver<20,"Barra console sobrepõe brinquedos: "+JSON.stringify(hud));
          }
        }
      }else{
        await page.waitForSelector("#studio-audio-switch",{timeout:12000});
        const sceneMethod={kart:"renderWorld",boxe:"drawArena",tenis:"drawEnvironment",ar:"drawVirtualScene",voo:"_drawWorld"}[slug];
        await page.waitForFunction(([gameId,method])=>{
          const game=(window.Games||[]).find(g=>g.id===gameId);
          return typeof game?.logic?.[method]==="function" && game.logic[method].__studioScenes===true;
        },[id,sceneMethod],{timeout:12000});
        // Authentication may cover the page in this isolated smoke (remote Firebase
        // deliberately blocked). Verify the switch exists here; real clicks are
        // exercised in playable-smoke with a simulated authenticated session.
        assert.equal(await page.locator("#studio-audio-switch").getAttribute("aria-pressed"),"true");
        assert.equal(await page.locator("#studio-audio-switch").getAttribute("aria-label"),"Ativar ou silenciar efeitos sonoros");
      }
      // Check visible app frames and horizontally scrollable root. Fixed HUD elements
      // are bounded by CSS, but actual matches/canvas scenes require separate tests.
      const box=await page.evaluate(()=>({
        innerWidth:window.innerWidth,
        scrollWidth:document.documentElement.scrollWidth,
        appHeight:document.body?.getBoundingClientRect()?.height
      }));
      assert(box.scrollWidth<=box.innerWidth+3,JSON.stringify({slug,size,box}));
      if(slug==="familia/3d" && (size.width<=540||size.height<=480)){
        // Inspect the actual running world, not the splash screen.
        await page.locator("#start").click({timeout:5000});
        await page.waitForFunction(()=>document.querySelector("#overlay")?.classList.contains("hidden"),null,{timeout:7000});
        const gameGeometry=await page.evaluate(()=>{
          const sel=["#controls .joystick","#controls .buttons","#toybar","#world-console-toolbar","#mission","#minimap","#bar"];
          const boxes=Object.fromEntries(sel.map(key=>{
            const el=document.querySelector(key);
            const rect=el?.getBoundingClientRect();
            return [key,rect?{x:rect.x,y:rect.y,r:rect.right,b:rect.bottom,w:rect.width,h:rect.height}:null];
          }));
          return {w:innerWidth,h:innerHeight,boxes};
        });
        const b=gameGeometry.boxes;
        for(const key of ["#controls .joystick","#controls .buttons","#toybar","#world-console-toolbar"]){
          const e=b[key];
          assert(e&&e.x>=-2&&e.r<=gameGeometry.w+2&&e.b<=gameGeometry.h+2,"Controle fora da tela: "+key+" "+JSON.stringify(gameGeometry));
        }
        const overlap=(a,b)=>a&&b?Math.max(0,Math.min(a.r,b.r)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.b,b.b)-Math.max(a.y,b.y)):0;
        for(const [one,two] of [["#world-console-toolbar","#controls .joystick"],["#world-console-toolbar","#toybar"],["#mission","#minimap"]]){
          assert(overlap(b[one],b[two])<25,"Interface familiar sobreposta: "+one+" / "+two+" "+JSON.stringify(gameGeometry));
        }
        await page.screenshot({path:join("test-results/mobile","familia-world-"+size.name+".png"),fullPage:false});
      }
      if(size.name==="mobile-360") await page.screenshot({path:join("test-results/mobile",slug.replace("/","-")+".png"),fullPage:false});
      attempts++;
    }
    await context.close();
  }
  console.log("Layout smoke OK: "+attempts+" checks, 7 games, 2 consoles, 4 viewports.");
}finally{
  await browser.close();
}

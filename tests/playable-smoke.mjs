/* Smoke funcional dos cinco jogos GAME com Firebase e câmera simulados.
   Nenhum acesso remoto nem escrita em contas reais: somente navegador local. */
import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";
import {join} from "node:path";
const base="http://127.0.0.1:4173/games/";
const catalog=[["kart","drive"],["boxe","box_pro"],["tenis","tennis"],["ar","ar_truck_sim"],["voo","usarmy_flight_sim"]];
const browser=await chromium.launch({headless:true,args:["--use-gl=angle","--use-angle=swiftshader","--no-sandbox"]});
mkdirSync("test-results/playable",{recursive:true});
let completed=0,failures=[];
try{
 for(const [slug,id] of catalog){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await context.addInitScript(()=>{
   const permitted={drive:true,box_pro:true,tennis:true,ar_truck_sim:true,usarmy_flight_sim:true};
   const profile={username:"Jogador Teste",role:"player",xp:0,level:10,coins:8000,permissions:permitted,arSave:{upgrades:{engine:1,battery:1,radar:1,chassis:1,scout:false}}};
   const snapshot=(val)=>({val:()=>val,exists:()=>val!==null});
   const reference=(name="")=>({
     on(evt,cb){if(evt==="value"){queueMicrotask(()=>cb(snapshot(name.startsWith("users/")?profile:null)));}return ()=>{}},
     once:async()=>snapshot(name.startsWith("users/")?profile:null),
     child(part){return reference(name+"/"+part)},
     set:async()=>{},update:async()=>{},remove:async()=>{},off:()=>{},
     onDisconnect(){return {remove:()=>Promise.resolve()}},
     transaction:async()=>({committed:true,snapshot:snapshot(null)})
   });
   const auth={currentUser:{uid:"browser-test-user-123456789012345"},
     onAuthStateChanged(cb){setTimeout(()=>cb(this.currentUser),30);return()=>{}},
     signInWithEmailAndPassword:async()=>({user:this.currentUser}),
     signOut:async()=>{}};
   const db={ref:reference};
   window.firebase={
     apps:[],initializeApp(){},auth:()=>auth,database:()=>db
   };
   window.firebase.database.ServerValue={TIMESTAMP:Date.now()};
   window.tf={ready:async()=>{},setBackend:async()=>true};
   window.poseDetection={SupportedModels:{MoveNet:"MoveNet"},movenet:{modelType:{SINGLEPOSE_LIGHTNING:"lite"}},createDetector:async()=>({estimatePoses:async()=>[]})};
   window.__cameraRequests=0;
   try{Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{getUserMedia:async()=>{
      window.__cameraRequests++;
      throw new Error("Câmera indisponível no smoke isolado");
   }}})}catch{}
  });
  await context.route(/^https?:\/\//,route=>{
    if(new URL(route.request().url()).origin===new URL(base).origin)route.continue();
    else if(route.request().resourceType()==="script")route.fulfill({status:200,contentType:"application/javascript",body:"/* test remote stub */"});
    else route.abort("blockedbyclient");
  });
  const page=await context.newPage();
  const appErrors=[];
  page.on("pageerror",error=>appErrors.push(error.stack || error.message));
  try{
    await page.goto(base+slug+"/",{waitUntil:"domcontentloaded",timeout:35000});
    await page.waitForFunction(id=>window.Games?.some(game=>game.id===id)&&window.System?.canvas,id,{timeout:15000});
    await page.waitForFunction(()=>!document.getElementById("menu-screen")?.classList.contains("hidden"),{timeout:15000});
    await page.waitForFunction(()=>!document.getElementById("phase-screen")?.classList.contains("hidden"),{timeout:10000}).catch(async()=>{
      await page.locator("#channel-grid .channel").first().click({timeout:5000});
      await page.waitForFunction(()=>!document.getElementById("phase-screen")?.classList.contains("hidden"),{timeout:10000});
    });
    const phases=page.locator("#phase-grid .mission-card:not(.locked)");
    await phases.first().click({timeout:10000});
    // Real interaction: player explicitly chooses controls without granting camera.
    await page.locator(".input-mode-dialog [data-mode=controls]").waitFor({timeout:7000});
    await page.locator(".input-mode-dialog [data-mode=controls]").click();
    await page.waitForFunction(id=>window.System?.activeGame?.id===id,id,{timeout:11000});
    assert.equal(await page.evaluate(()=>window.ArcadeControls?.mode),"controls","Modo controle não ativo");
    assert.equal(await page.evaluate(()=>window.__cameraRequests),0,"Solicitou câmera sem escolha");
    await page.waitForTimeout(1100);
    const state=await page.evaluate(()=>({
      game:window.System?.activeGame?.id,
      epoch:window.System?.loopEpoch,
      loaded:!document.getElementById("game-ui")?.classList.contains("hidden"),
      paused:window.System?.paused,
      width:document.documentElement.scrollWidth,
      viewport:window.innerWidth
    }));
    if(slug==="ar"){
      const manual=await page.evaluate(()=>{
        const g=window.Games.find(x=>x.id==="ar_truck_sim").logic;
        return {state:g.state,model:!!g.objectModel,manual:g.arcadeManual};
      });
      assert(manual.manual && !manual.model,"Modo AR sem câmera não entrou no ambiente virtual");
      assert.equal(await page.locator('[data-control="pick"]').count(),1,"Falta comando de coleta");
    }else if(slug==="voo"){
      assert.equal(await page.locator('[data-control="boost"]').count(),1,"Falta botão turbo");
      assert.equal(await page.locator('[data-control="missile"]').count(),1,"Falta botão míssil");
    }else if(slug==="boxe"){
      assert.equal(await page.locator('[data-punch="l"]').count(),1,"Falta soco por toque");
      assert.equal(await page.locator('[data-guard]').count(),1,"Falta defesa por toque");
    }else if(slug==="tenis"){
      assert.equal(await page.evaluate(()=>window.Games.find(x=>x.id==="tennis").logic.useMouse),true,"Tênis sem toque");
    }
    if(slug==="ar"){
       await page.evaluate(()=>{
          const g=window.Games.find(x=>x.id==="ar_truck_sim").logic;
          g.vPos={x:0,y:0};g.anomalies=[{id:"test-item",x:0,y:0,type:"NORMAL",val:500,life:999}];
          g.cooldown=0;g.manualAccelerate=false;
       });
       await page.locator('[data-control="pick"]').dispatchEvent("pointerdown",{pointerId:4});
       await page.waitForFunction(()=>window.Games.find(x=>x.id==="ar_truck_sim").logic.cargo.length>=1,null,{timeout:4200});
       await page.locator('[data-control="pick"]').dispatchEvent("pointerup",{pointerId:4});
       const progress=await page.evaluate(()=>window.Games.find(x=>x.id==="ar_truck_sim").logic.currentMission.progress);
       assert(progress>=1,"Coleta não progrediu na missão AR");
    }else if(slug==="voo"){
       const control=page.locator('[data-control="left"]');
       await control.dispatchEvent("pointerdown",{pointerId:6});
       assert(await page.evaluate(()=>window.Games.find(x=>x.id==="usarmy_flight_sim").logic.keys.ArrowLeft),"Curva não acionou");
       await control.dispatchEvent("pointerup",{pointerId:6});
       assert.equal(await page.evaluate(()=>!!window.Games.find(x=>x.id==="usarmy_flight_sim").logic.keys.ArrowLeft),false,"Controle preso");
    }
    assert.equal(state.game,id,"Motor foi encerrado inesperadamente");
    assert.equal(state.loaded,true,"HUD de jogo não exibido");
    assert(state.width<=state.viewport+3,JSON.stringify({slug,state}));
    await page.screenshot({path:join("test-results/playable",slug+"-game.png")});
    await page.locator("#arcade-pause").click();
    assert.equal(await page.locator("#arcade-pause-modal").isVisible(),true,"Menu pausa não abriu");
    assert.equal(await page.evaluate(()=>window.System.paused),true,"Motor não pausou");
    await page.locator('#arcade-pause-modal [data-action="continue"]').click();
    assert.equal(await page.evaluate(()=>window.System.paused),false,"Motor não retomou");
    assert.equal(await page.evaluate(()=>window.System.activeGame?.id),id);
    // Explicit camera consent followed by a denied permission must fall back,
    // not deadlock, and must preserve the very same game/ID.
    await page.evaluate(id=>{
      const game=window.Games.find(g=>g.id===id);
      window.System.menu();window.System.openPhases(game);
    },id);
    await page.locator("#phase-grid .mission-card:not(.locked)").first().click({timeout:6000});
    await page.locator(".input-mode-dialog [data-mode=camera]").click({timeout:6000});
    await page.waitForFunction(id=>window.System?.activeGame?.id===id,id,{timeout:12000});
    assert.equal(await page.evaluate(()=>window.ArcadeControls?.mode),"controls",
       "Câmera negada não ativou controles no "+slug);
    assert(await page.evaluate(()=>window.__cameraRequests>0),
       "Câmera não foi solicitada após escolha explícita em "+slug);
    // Browser runtime pageerrors are checked selectively: blocked CDN errors do not
    // matter because the mocks bypass Firebase/pose SDK on purpose.
    const fatal=appErrors.filter(v=>/uncaught|cannot read properties|is not a function|referenceerror/i.test(v));
    assert.equal(fatal.length,0,"Erros fatais no motor: "+fatal.join(" | "));
    completed++;
  }catch(error){
    const diagnostic=await page.evaluate(()=>({stage:{loading:document.getElementById("loading")?.className,phase:document.getElementById("phase-screen")?.className,menu:document.getElementById("menu-screen")?.className},system:{active:window.System?.activeGame?.id,starting:window.System?.isStarting,epoch:window.System?.loopEpoch},arGame:(window.Games||[]).find(x=>x.id==="ar_truck_sim")?.logic?.state})).catch(()=>null);
    failures.push({slug,message:String(error),diagnostic,pageErrors:appErrors.slice(0,6)});
  }
  await context.close();
 }
}finally{await browser.close()}
console.log(JSON.stringify({completed,expected:catalog.length,failures},null,2));
assert.equal(failures.length,0,"Há motores que não iniciaram ou não sustentaram uma partida");

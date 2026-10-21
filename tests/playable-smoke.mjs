/* Smoke funcional dos cinco jogos GAME com Firebase e câmera simulados.
   Nenhum acesso remoto nem escrita em contas reais: somente navegador local. */
import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";
import {join} from "node:path";
const base="http://127.0.0.1:4173/games/";
const catalog=[["kart","drive"],["kart","drive","landscape-844"],["kart","drive","desktop-885"],["boxe","box_pro"],["tenis","tennis"],["ar","ar_truck_sim"],["voo","usarmy_flight_sim"]];
const browser=await chromium.launch({headless:true,args:["--use-gl=angle","--use-angle=swiftshader","--no-sandbox"]});
mkdirSync("test-results/playable",{recursive:true});
let completed=0,failures=[];
try{
 for(const [slug,id,device] of catalog){
  const viewport=device==="desktop-885"?{width:885,height:770}:device==="landscape-844"?{width:844,height:390}:{width:390,height:844};
  const mobile=device!=="desktop-885";
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
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
    if(slug==="kart"){
      // Critical regression: button layout MUST be tested during an actual race.
      const canvas=page.locator("#game-canvas");
      const race=()=>page.evaluate(()=>window.Games.find(g=>g.id==="drive").logic.state);
      let phase=await race();
      if(phase==="MODE_SELECT"){
        const box=await canvas.boundingBox();
        await page.mouse.click(box.x+box.width*.5,box.y+box.height*.48);
        await page.waitForFunction(()=>window.Games.find(g=>g.id==="drive").logic.state==="LOBBY",{},{timeout:6500});
      }
      phase=await race();
      if(phase==="LOBBY"){
        const box=await canvas.boundingBox();
        await page.mouse.click(box.x+box.width*.5,box.y+box.height*.92);
      }
      await page.waitForFunction(()=>window.Games.find(g=>g.id==="drive").logic.state==="RACE",{},{timeout:6500});
      for(const name of ["left","right","go","brake","nitro","item"]){
        const button=page.locator('.kart-input [data-control="'+name+'"]');
        await button.waitFor({state:"visible",timeout:5000});
        assert.equal(await button.isVisible(),true,"Botão ausente na corrida: "+name);
        const rect=await button.boundingBox();
        assert(rect && rect.x>=-2 && rect.x+rect.width<=viewport.width+2,"Botão saiu da tela: "+name);
      }
      const geometry=await page.locator('.kart-input .input-control').evaluateAll(buttons=>{
        const {innerWidth:w,innerHeight:h}=window;
        return buttons.map(btn=>{
          const r=btn.getBoundingClientRect();
          return {id:btn.dataset.control,x:r.x,y:r.y,width:r.width,height:r.height,
                  midX:r.left+r.width/2,visible:getComputedStyle(btn).display!=="none"};
        });
      });
      for(const b of geometry){
        assert(b.width>=44 && b.height>=44,"Área tátil pequena: "+JSON.stringify(b));
        assert(b.x>=-1 && b.x+b.width<=viewport.width+1,"Controle fora da tela: "+JSON.stringify(b));
        assert(b.y>=-1 && b.y+b.height<=viewport.height+1,"Controle cortado verticalmente: "+JSON.stringify(b));
        if(["left","right"].includes(b.id))assert(b.midX<viewport.width*.45,"Direção não está no polegar esquerdo");
        else assert(b.midX>viewport.width*.53,"Ação não está no polegar direito: "+b.id);
      }
      for(let i=0;i<geometry.length;i++)for(let j=i+1;j<geometry.length;j++){
        const a=geometry[i],b=geometry[j];
        const overlapX=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x));
        const overlapY=Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
        assert(overlapX*overlapY<12,"Botões sobrepostos: "+a.id+" e "+b.id);
      }
      const goArea=geometry.find(x=>x.id==="go"),brakeArea=geometry.find(x=>x.id==="brake");
      assert(goArea.width*goArea.height>brakeArea.width*brakeArea.height,"Acelerador deveria ser o pedal dominante");
      assert.equal(await page.locator('.kart-control-pod').count(),2,"Faltam conjuntos ergonômicos");
      // Render must actually draw an existing CPU rival, not merely count
      // simulated opponents that never appear on screen.
      const rivalFixture=await page.evaluate(()=>{
        const g=window.Games.find(x=>x.id==="drive").logic;
        if(!g.rivals?.length)return {count:0};
        const rival=g.rivals.find(r=>r.status==="RACING")||g.rivals[0];
        rival.lap=g.lap;
        rival.pos=g.pos+1800; // 9 existing track segments ahead
        rival.x=0;
        rival.speed=0;
        const original=g.drawKartSprite;
        g.__testRivalDraws=0;
        g.drawKartSprite=function(...args){
          if(args[8]!==g.selectedChar)g.__testRivalDraws++;
          return original.apply(this,args);
        };
        return {count:g.rivals.length,id:rival.id};
      });
      assert(rivalFixture.count>0,"Corrida iniciou sem adversários reais");
      await page.waitForTimeout(280);
      const rivalDraws=await page.evaluate(()=>window.Games.find(x=>x.id==="drive").logic.__testRivalDraws);
      assert(rivalDraws>0,"Adversário simulado não foi renderizado na pista: "+JSON.stringify(rivalFixture));
      const run=page.locator('.kart-input [data-control="go"]');
      await run.dispatchEvent("pointerdown",{pointerId:21});
      await page.waitForTimeout(1250);
      const driving=await page.evaluate(()=>{
        const g=window.Games.find(g=>g.id==="drive").logic;
        return {speed:g.speed,pos:g.pos,active:g.inputActive};
      });
      assert(driving.active && driving.speed>3 && driving.pos>3,
        "Acelerador não movimenta o kart: "+JSON.stringify(driving));
      const left=page.locator('.kart-input [data-control="left"]');
      await left.dispatchEvent("pointerdown",{pointerId:22});
      // SwiftShader can take >240 ms to produce a frame at 885x770 in CI.
      // Wait for the game's REAL updatePhysics frame, not an arbitrary timer.
      await page.waitForFunction(()=>{
        const g=window.Games.find(x=>x.id==="drive")?.logic;
        return g && g.targetSteer < -.3;
      },null,{timeout:5000,interval:80}).catch(()=>{});
      const steeringState=await page.evaluate(()=>{
        const g=window.Games.find(x=>x.id==="drive").logic;
        const b=document.querySelector('.kart-input [data-control="left"]');
        return {target:g.targetSteer,steer:g.steer,manual:g.arcadeManual?{...g.arcadeManual}:null,
          held:b?.classList.contains("held"),disabled:b?.disabled,gameState:g.state,status:g.status,
          controlMode:window.ArcadeControls?.mode,paused:window.System?.paused};
      });
      assert(steeringState.target<-.3,"Volante esquerdo não altera direção real: "+JSON.stringify(steeringState));
      await left.dispatchEvent("pointerup",{pointerId:22});
      await run.dispatchEvent("pointerup",{pointerId:21});
      // Simulated physical gamepad uses the real six-button touch input bridge.
      await page.evaluate(()=>{
        const buttons=Array.from({length:18},()=>({pressed:false,value:0}));
        buttons[7]={pressed:true,value:1};
        window.__testPad={connected:true,axes:[-1,0],buttons};
        Object.defineProperty(navigator,"getGamepads",{configurable:true,value:()=>[window.__testPad]});
      });
      await page.waitForTimeout(460);
      const viaPad=await page.evaluate(()=>{
        const g=window.Games.find(g=>g.id==="drive").logic;
        return {left:g.arcadeManual?.left,accelerator:g.arcadeManual?.throttle,target:g.targetSteer};
      });
      assert(viaPad.left&&viaPad.accelerator&&viaPad.target<-.25,
         "Controle físico não acionou aceleração e direção: "+JSON.stringify(viaPad));
      await page.evaluate(()=>window.__testPad.connected=false);
      await page.waitForTimeout(140);
      assert.equal(await page.locator('.kart-input [data-control="go"].held').count(),0,
        "Gamepad desconectado manteve acelerador pressionado");
      await page.screenshot({path:join("test-results/playable","kart-controls-visible"+(device?"-"+device:"")+".png")});
    }
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

    if(slug==="tenis"){
      const track=await page.evaluate(()=>{
        const g=window.Games.find(g=>g.id==="tennis").logic;
        const c=window.System.canvas,rect=c.getBoundingClientRect();
        // CSS pixels and canvas pixels must yield the same racket direction.
        g.useMouse=true;
        c.onmousemove?.({clientX:rect.left+rect.width*.80,clientY:rect.top+rect.height*.45});
        const touch={mouse:g.mouseX,expected:c.width*.80};
        g.useMouse=false;g.handedness="right";g.calib={tlX:0,tlY:0,brX:640,brY:480};
        const mk=x=>({keypoints:[{name:"right_wrist",x,y:240,score:.99},{name:"right_elbow",x:x-20,y:350,score:.99}]});
        g.processPose(mk(500),c.width,c.height);
        const left=g.p1.x;
        g.processPose(mk(150),c.width,c.height);
        const right=g.p1.x;
        g.useMouse=true;
        return {...touch,left,right};
      });
      assert(Math.abs(track.mouse-track.expected)<2,"Tênis não corrige escala CSS/Canvas: "+JSON.stringify(track));
      assert(track.right>track.left+30,"Movimento do pulso espelhado não acompanha direção: "+JSON.stringify(track));
    }
    if(slug==="boxe"){
      // The selection screen must lead to a REAL fight, not just a decorative menu.
      const game=page.locator("#game-canvas");
      await page.waitForFunction(()=>window.Games.find(g=>g.id==="box_pro").logic.state==="CHAR_SELECT",null,{timeout:4000});
      const box=await game.boundingBox();
      assert(box,"Canvas boxe ausente");
      await page.mouse.click(box.x+box.width*.2,box.y+box.height*.90);
      await page.waitForFunction(()=>window.Games.find(g=>g.id==="box_pro").logic.state==="FIGHT",null,{timeout:4000});
      await page.waitForFunction(()=>{
        const logic=window.Games.find(g=>g.id==="box_pro").logic;
        return logic.p2?.pose?.head?.x>0 && logic.p1?.pose?.wrists;
      },null,{timeout:5000});
      const hpBefore=await page.evaluate(()=>window.Games.find(g=>g.id==="box_pro").logic.p2.hp);
      await page.locator('[data-punch="l"]').dispatchEvent("pointerdown",{pointerId:11});
      await page.waitForTimeout(200);
      const hpAfter=await page.evaluate(()=>window.Games.find(g=>g.id==="box_pro").logic.p2.hp);
      assert(hpAfter<hpBefore,"Soco por toque não causou dano ao adversário: "+hpBefore+" -> "+hpAfter);
    } else if(slug==="voo"){
      // Single-player flight is already in HANGAR after initialization.
      // Real touch START must advance HANGAR -> CALIBRATION -> PLAYING.
      const start=page.locator('[data-control="start"]');
      assert.equal(await page.evaluate(()=>window.Games.find(g=>g.id==="usarmy_flight_sim").logic.state),"HANGAR");
      await start.click({timeout:5000});
      await page.waitForFunction(()=>window.Games.find(g=>g.id==="usarmy_flight_sim").logic.state==="CALIBRATION",null,{timeout:6500});
      const flightCanvas=page.locator("#game-canvas");
      await flightCanvas.dispatchEvent("pointerdown",{pointerId:53,clientX:120,clientY:140});
      const calibration=await page.evaluate(()=>{
        const g=window.Games.find(g=>g.id==="usarmy_flight_sim").logic;
        return {state:g.state,timer:g.timer};
      });
      assert.equal(calibration.state,"CALIBRATION","Tocar na tela pulou a calibragem");
      assert(calibration.timer>=4,"Tocar na tela zerou temporizador: "+JSON.stringify(calibration));
      await start.click({timeout:5000});
      await page.waitForFunction(()=>window.Games.find(g=>g.id==="usarmy_flight_sim").logic.state==="PLAYING",null,{timeout:6500});
      const physics=await page.evaluate(()=>{
        const g=window.Games.find(x=>x.id==="usarmy_flight_sim").logic;
        return {state:g.state,shipSpeed:g.ship.speed,shipHP:g.ship.hp};
      });
      assert.equal(physics.state,"PLAYING","Voo não iniciou missão real");
      assert(physics.shipHP>0,"Caça iniciou destruído");
    }
    // Change native preferences through the actual player settings UI.
    await page.locator('#play-settings-button').click();
    await page.locator('#play-settings').waitFor();
    assert.equal(await page.evaluate(()=>window.System.paused),true);
    if(slug==='kart'||slug==='voo'){
      await page.locator('#play-settings [data-setting="distance"]').selectOption('near');
      assert.equal(await page.evaluate(()=>window.ArcadePlaySettings.get().distance),'near');
    }
    await page.locator('#play-settings [data-close]').last().click();
    assert.equal(await page.evaluate(()=>window.System.paused),false);
    if(slug==='voo'){
      await page.waitForFunction(()=>{const g=window.System.activeGame.logic;return g.view&&g._projectView(g.ship.x,g.ship.y,g.ship.z,390,844).visible},null,{timeout:8000});
    }
    // Professional thumb UX: game controls stay within the game viewport
    // and do not overlap one another or the centre of the action.
    if(["ar","voo","boxe"].includes(slug)){
      const selector=slug==="ar"?".ar-input .input-control:not([hidden])":
         slug==="voo"?".flight-input .input-control:not([hidden])":
         "#arcade-boxing-controls .boxing-action";
      const rects=await page.locator(selector).evaluateAll(buttons=>{
        return buttons.filter(b=>!b.hidden&&getComputedStyle(b).display!=="none").map(b=>{
          const r=b.getBoundingClientRect();return {id:b.dataset.control||b.dataset.punch||b.dataset.guard||"",
            x:r.x,y:r.y,width:r.width,height:r.height}
        });
      });
      assert(rects.length>=3,slug+" has fewer than 3 reachable gameplay controls");
      for(const r of rects){
        assert(r.width>=44&&r.height>=44,"Touch target below 44px: "+JSON.stringify({slug,r}));
        assert(r.x>=-1&&r.y>=-1&&r.x+r.width<=viewport.width+1&&r.y+r.height<=viewport.height+1,
          "Control overflow: "+JSON.stringify({slug,r,viewport}));
      }
      for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
        const a=rects[i],b=rects[j];
        const ox=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x));
        const oy=Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
        assert(ox*oy<20,"Controls overlap: "+JSON.stringify({slug,a,b}));
      }
      if(slug==="voo"){
        await page.waitForFunction(()=>document.querySelector('.flight-input [data-control="start"]')?.hidden,{timeout:4000});
      }
    }
    const mastery=page.locator("#studio-mastery-toggle");
    await mastery.waitFor({state:"visible",timeout:5000});
    assert.equal(await page.locator("#studio-mastery-list").isVisible(),false,"Painel ocupa espaço sem solicitação");
    await mastery.click({timeout:4000});
    assert.equal(await mastery.getAttribute("aria-expanded"),"true","Missões não expandem");
    assert.equal(await page.locator("#studio-mastery-list .studio-mastery-task").count(),3,"Faltam 3 objetivos por jogo");
    await mastery.click({timeout:4000});
    assert.equal(await page.locator("#studio-mastery-list").isVisible(),false,"Painel não recolhe");
    // Authenticated actual gameplay: player can toggle contextual Studio effects.
    const audioControl=page.locator("#studio-audio-switch");
    await audioControl.waitFor({state:"visible",timeout:5000});
    await audioControl.click({timeout:4000});
    assert.equal(await audioControl.getAttribute("aria-pressed"),"false","Studio FX mute not applied");
    await audioControl.click({timeout:4000});
    assert.equal(await audioControl.getAttribute("aria-pressed"),"true","Studio FX enable not applied");
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
    failures.push({slug,device,message:String(error),diagnostic,pageErrors:appErrors.slice(0,6)});
  }
  await context.close();
 }
}finally{await browser.close()}
console.log(JSON.stringify({completed,expected:catalog.length,failures},null,2));
assert.equal(failures.length,0,"Há motores que não iniciaram ou não sustentaram uma partida");

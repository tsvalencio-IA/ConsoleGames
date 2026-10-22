import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const base='http://127.0.0.1:4173/games/';
const browser=await chromium.launch({executablePath:process.env.OT_BROWSER_BINARY||undefined,headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--no-sandbox','--disable-dev-shm-usage']});
mkdirSync('test-results/scenery',{recursive:true});
const results=[];
try{
 for(const [slug,id]of [['ar','ar_truck_sim'],['voo','usarmy_flight_sim']]){
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});
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

    if(slug==='voo'){
      await page.locator('.flight-input [data-control="start"]').click();
      await page.waitForFunction(()=>window.System.activeGame.logic.state==='CALIBRATION');
      await page.locator('.flight-input [data-control="start"]').click();
      await page.waitForFunction(()=>window.System.activeGame.logic.state==='PLAYING');
    }
    await page.waitForFunction(()=>window.System.activeGame.logic.worldVisual?.frames>2,null,{timeout:20000});
    const metrics=await page.evaluate(()=>window.ArcadeWorldRenderer.inspect(window.System.activeGame.logic));
    assert(metrics.staticInstances>(slug==='ar'?250:8000),JSON.stringify(metrics));assert(metrics.materials>25);
    assert(metrics.renderer.triangles>100,JSON.stringify(metrics));
    // Match the GPU projection against the simulation's own project() used by
    // hit detection, lock reticles and the native aircraft. Rotation + roll too.
    const errors=await page.evaluate(slug=>{
      const g=window.System.activeGame.logic,s=window.System,c=s.canvas,w=c.width,h=c.height;
      s.paused=true;
      if(slug==='ar'){Object.assign(g.player,{x:-3,z:5,yaw:.28,pitch:-.12});g.eyeY=1.8;g.drawVirtualScene(s.canvas.getContext('2d'),w,h)}
      else{Object.assign(g.ship,{x:-1100,y:700,z:-1600,yaw:.12,pitch:-.2,roll:.3});g.view=null;g._draw(s.canvas.getContext('2d'),w,h)}
      const points=slug==='ar'?[[0,1,35],[10,3,50],[-8,8,60]]:[[-900,200,100],[-400,500,1000],[0,140,3000]];
      return points.map(p=>{const a=slug==='ar'?g.project(...p,w,h):g._projectView(...p,w,h),b=window.ArcadeWorldRenderer.project(g,...p,w,h);return Math.hypot(a.x-b.x,a.y-b.y)});
    },slug);
    assert(errors.every(n=>Number.isFinite(n)&&n<.01),'Mira/cenário desalinhados: '+JSON.stringify(errors));
    const take=async(name,setup)=>{
      await page.evaluate(({slug,setup})=>{
        const s=window.System,g=s.activeGame.logic,w=s.canvas.width,h=s.canvas.height;
        if(slug==='ar'){
          if(setup.mission){g.init({id:setup.mission});g.step(0);g.spawnWave();for(const e of g.enemies)e.aim=99}
          Object.assign(g.player,setup.position||{});g.eyeY=1.8;g.drawVirtualScene(s.canvas.getContext('2d'),w,h);g.drawHUD(s.canvas.getContext('2d'),w,h);
        }else{
          Object.assign(g.ship,setup.position);g.view=null;g._draw(s.canvas.getContext('2d'),w,h);
        }
      },{slug,setup});
      await page.screenshot({path:'test-results/scenery/'+name+'.png'});
    };
    if(slug==='ar'){
      for(const mission of ['patrol','city','extraction'])await take('war-'+mission,{mission,position:{x:0,z:8,yaw:0,pitch:0}});
      await take('war-cover-close',{position:{x:-11,z:20,yaw:.36,pitch:-.02}});
      assert((await page.title()).includes('WAR Combate'));
    }else{
      await take('voo-porto',{position:{x:-1100,y:700,z:-1600,yaw:.12,pitch:-.15,roll:0}});
      await take('voo-centro',{position:{x:9200,y:1150,z:11000,yaw:.12,pitch:-.28,roll:0}});
      await take('voo-aeroporto',{position:{x:2800,y:620,z:-3000,yaw:.05,pitch:-.18,roll:0}});
      await take('voo-ponte-rio',{position:{x:-7900,y:1600,z:-2900,yaw:.38,pitch:-.3,roll:0}});
    }
    await page.setViewportSize({width:390,height:844});
    // Both window and visualViewport resize events resize (and clear) the native canvas.
    // Let those settle before drawing our paused inspection frame.
    await page.waitForTimeout(250);
    await page.waitForFunction(()=>window.System.canvas.width===390&&window.System.canvas.height===844);
    if(slug==='ar')await take('war-portrait',{mission:'city',position:{x:-12,z:8,yaw:.19,pitch:0}});
    else await take('voo-portrait',{position:{x:-1100,y:700,z:-1600,yaw:.12,pitch:-.15,roll:0}});
    const pixels=await page.evaluate(()=>{const s=window.System,c=s.canvas.getContext('2d'),img=c.getImageData(0,0,s.canvas.width,s.canvas.height).data;let nonempty=0;for(let i=3;i<img.length;i+=100)nonempty+=img[i]>0;return nonempty});
    assert(pixels>1000,'O canvas não contém cenário');assert.deepEqual(appErrors,[]);
    results.push({slug,metrics,projectionErrors:errors,pixels});
  }catch(error){await page.screenshot({path:'test-results/scenery/'+slug+'-failure.png'}).catch(()=>{});throw error}
  finally{await context.close()}
 }
 writeFileSync('test-results/scenery/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close()}

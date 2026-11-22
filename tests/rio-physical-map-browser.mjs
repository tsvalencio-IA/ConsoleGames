/* Playwright exercises native movement and economy against the rebuilt city.
 * The fixture places the initial approach for far-apart sites. All room and
 * chair approaches use the native player's inputs and collision checks.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { multiplayerServer } from './helpers/multiplayer-browser-fixture.mjs';
import { installCityInspection } from './helpers/world-city-inspection.mjs';

const out=process.env.OT_RIO_MAP_OUT||'test-results/rio-physical-map';
fs.mkdirSync(out,{recursive:true});
const release=JSON.parse(fs.readFileSync('games/otthi/release-manifest.json','utf8'));
const source=fs.readFileSync('games/otthi/app.js','utf8'),end=source.lastIndexOf('})();');
const hook=`
  const savedRioQA=()=>({
    map:inRioMap(),position:{x:player.x,y:player.y,z:player.z},coins:state.profile.coins,xp:state.profile.xp,food:state.inventory.food,
    legacy:state.position,owned:state.vehicles.owned,parked:state.vehicles.parked,lastUsed:state.vehicles.lastUsedId,
    garage:state.vehicles.garage,boats:state.boats,activeJob:state.career.activeJob?.id,rio:state.cityServices.rioMap,
    diag:OTTHI_RIO_MAP.diagnostics(),context:currentContext?.id,profile:state.profile.name,
    models:[...worldGroup.children].map(o=>o.name),
    camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z},
    hud:document.body.dataset.otthiMap||null,
    legacyGarage:!!world.houses.find(h=>h.id==='home')
  });
  const roomFor=key=>rioMap.sites.get(rioSiteByKey(key)?.id);
  window.__RIO_PHYSICAL_QA={
    snapshot:savedRioQA,
    sites:()=>rioFunctionalSites().map(site=>({...site})),
    setup:(key,part)=>{
      const site=rioSiteByKey(key);
      const [x,z]=site.entry;rioStreamMap({x,z},true);OTTHOS_TEST_API.teleport(x,z);
      cameraYaw=-site.yaw;cameraPitch=.28;cameraZoom=2.2;
      playerGroup.position.set(player.x,player.y,player.z);
      if(part==='outside'){updateContext(true);return savedRioQA();}
      const room=roomFor(key);
      return {room:!!room,entry:site.entry};
    },
    actions:key=>world.interactables.filter(a=>a.id.startsWith(rioSiteByKey(key).id+'-')).map(a=>({id:a.id,x:a.x,z:a.z,label:a.label,inside:!!a.inside,vehicleOnly:!!a.vehicleOnly})),
    clear:(x,z)=>!positionBlockedForPlayer(x,z,.43,{ignoreTraffic:true}),
    walk:(targets,limit=1400,race=false)=>{
      for(const goal of targets){
        let success=false;
        for(let i=0;i<limit;i++){
          cityQaMs+=1000/60;
          const dx=goal.x-player.x,dz=goal.z-player.z,len=Math.hypot(dx,dz);
          if(len<.12){success=true;break;}
          const right=cameraRelativeVector(1,0,cameraYaw),forward=cameraRelativeVector(0,1,cameraYaw);
          const factor=Math.min(.80,len*1.7);
          input.virtualActive=true;input.virtualX=factor*(dx*right.x+dz*right.z)/len;input.virtualZ=factor*(dx*forward.x+dz*forward.z)/len;
          beginWorldQueryFrame();try{updatePlayer(1/60);if(race&&activeRace)updateRace(1/60);}finally{endWorldQueryFrame();}
        }
        if(!success){clearMovementInputs();return {success,goal,x:player.x,z:player.z,context:currentContext?.id};}
      }
      clearMovementInputs();player.vx=player.vz=0;updateContext(true);
      return {success:true,x:player.x,z:player.z,context:currentContext?.id};
    },
    paths:(key,suffix)=>{
      const site=rioSiteByKey(key),room=roomFor(key),point=room?.point||((x,z)=>({x:site.x+x,z:site.z+z}));
      const target=world.interactables.find(i=>i.id===site.id+'-'+suffix);
      if(!target)return [];
      return characterActivityPath({x:target.x,z:target.z},null);
    },
    target:(key,suffix)=>{const room=roomFor(key),site=rioSiteByKey(key),target=world.interactables.find(i=>i.id===site.id+'-'+suffix);return target&&{x:target.x,z:target.z};},
    meal:()=>{const room=roomFor('canecao_represa'),seat=room.seats[0],session=characterActivities.session;
      const host=characterActivities.visual?.host;
      return {pose:session?.pose,phase:session?.phase,hunger:state.needs.hunger,coins:state.profile.coins,
        seat,actor:host?.visible?host.position.toArray():null,roof:room.roof.visible,served:room.servedDish.visible,
        inside:room.forSite(player.x,player.z,-.44),completed:characterActivities.completed};
    },
    advance:(steps)=>{for(let i=0;i<steps;i++){cityQaMs+=1000/60;stepWorldSimulation(1/60);}updateFamilyPlayableVisuals();updateContext(true);},
    insideCamera:(key,x=0,y=8,z=5)=>{
      const room=roomFor(key),point=room.point(x,z),view=room.point(0,-1.6);
      playerGroup.position.set(player.x,player.y,player.z);updateFamilyPlayableVisuals();
      if(room.roof)room.roof.visible=false;
      camera.position.set(point.x,y,point.z);camera.lookAt(view.x,.85,view.z);camera.updateMatrixWorld(true);__CITY_QA.renderNative();
    },
    renderCurrent:()=>{updateCamera(2);__CITY_QA.renderNative();},
    fuelPrep:()=>{
      const site=rioSiteByKey('posto_brasilia'),room=roomFor('posto_brasilia'),start=room.point(5.15,site.d/2+4);
      const car=rioMap.vehicle;
      car.group.position.set(start.x,0,start.z);car.group.rotation.y=site.yaw+Math.PI;
      car.x=start.x;car.z=start.z;car.heading=site.yaw+Math.PI;
      OTTHOS_TEST_API.teleport(start.x+1.85,start.z);
      updateContext(true);
      return {start,id:car.id,model:car.group.userData.brazilModel,access:room.point(5.15,-.42),clear:!rioGeometryBlocked(start.x,start.z,1.3)};
    },
    drivePump:()=>{
      const site=rioSiteByKey('posto_brasilia'),room=roomFor('posto_brasilia'),p=room.point(5.15,-.42);
      const from={x:player.x,z:player.z},start=rioFuelLevel(),impacts=vehicleImpactCount;
      let steps=0;
      input.virtualActive=true;input.virtualX=0;
      for(;steps<450;steps++){
        const distance=Math.hypot(p.x-player.x,p.z-player.z);
        const enter=(player.x-p.x)*Math.sin(site.yaw)+(player.z-p.z)*Math.cos(site.yaw);
        input.virtualZ=enter>1.75?Math.min(.36,enter*.10):player.car.speed>.4?-.75:0;
        if(distance<1.75&&Math.abs(player.car.speed)<.42)break;
        cityQaMs+=1000/60;beginWorldQueryFrame();try{rioMapStep(1/60);}finally{endWorldQueryFrame();}
      }
      clearMovementInputs();updateContext(true);
      return {distance:Math.hypot(p.x-player.x,p.z-player.z),movement:Math.hypot(from.x-player.x,from.z-player.z),spent:start-rioFuelLevel(),
        id:player.car.id,model:vehicleVisual.userData.brazilModel,speed:player.car.speed,fuel:rioFuelLevel(),impacts:vehicleImpactCount-impacts,vehicle:player.vehicle,context:currentVehicleContext?.id};
    },
    fleet:()=>{
      const bay=rioMap.garage;
      rioStreamMap(bay.counter,true);
      OTTHOS_TEST_API.teleport(bay.counter.x,bay.counter.z);updateContext(true);
      return {context:currentContext?.id,vehicles:world.vehicles.map(car=>({id:car.id,model:car.group.userData.brazilModel,visible:car.group.visible}))};
    },
    traffic:()=>OTTOVIAS_RUNTIME.traffic.map(actor=>({
      id:actor.id,model:actor.brazilModel,asset:actor.group.userData.brazilRoot?.name,
      driver:actor.driver?.name,x:actor.group.position.x,z:actor.group.position.z,
      road:!!rioRoadAt(actor.group.position.x,actor.group.position.z,.45,r=>!r.pedestrian)
    })),
    waterfront:(stage=null)=>{
      if(stage!==null){
        const start=stage==='swim'?rioDockPoint(43,-6):rioMap.waterfront.entry;
        rioStreamMap(start,true);OTTHOS_TEST_API.teleport(start.x,start.z);updateContext(true);
      }
      const w=rioMap.waterfront,c=world.boat,active=player.boating&&c?.rioBerth;
      return {entry:w.entry,beach:rioDockPoint(43,-6),water:rioDockPoint(43,13),swimming:player.swimming,
        current:active?{id:c.id,kind:c.kind,x:player.x,z:player.z,y:player.y,heading:player.boat.heading,speed:player.boat.speed,
          legal:rioMarineCanNavigate(c,player.x,player.z,player.boat.heading),canExit:validBoatExit(),paddle:w.paddle.visible}:null,
        ground:groundHeightAt(player.x,player.z),position:{x:player.x,z:player.z},
        context:currentContext?.id,
        craft:[...world.boats.values()].map(boat=>({id:boat.id,kind:boat.kind,x:boat.x,z:boat.z,step:boat.rioBerth.step,
          safe:rioMarineCanNavigate(boat,boat.x,boat.z,boat.heading)})),
        life:[...w.swimmers.map(({npc:n})=>({id:n.id,x:n.group.position.x,z:n.group.position.z,action:n.lifeAction})),
          ...w.patrol.map(boat=>({id:boat.id,x:boat.x,z:boat.z,action:boat.rider.lifeAction}))]};
    },
    boatLeg:(out)=>{
      const c=world.boat,p=c.rioBerth.moor;
      let steps=0,legal=true;
      const length=()=>Math.hypot(player.x-p.x,player.z-p.z);
      for(;steps<1100;steps++){
        const remaining=out?15-length():length()-.22;
        const speed=player.boat.speed;
        // Both acceleration and braking travel through the native control interpreter.
        const throttle=remaining>.48?Math.min(.62,.18+remaining*.10):0;
        input.virtualActive=true;input.virtualX=0;input.virtualZ=out?throttle:-throttle;
        if(remaining<=.48&&Math.abs(speed)<(out?.46:.56))break;
        cityQaMs+=1000/60;
        beginWorldQueryFrame();try{rioMapStep(1/60);}finally{endWorldQueryFrame();}
        legal&&=rioMarineCanNavigate(c,player.x,player.z,player.boat.heading);
      }
      clearMovementInputs();updateFamilyPlayableVisuals();updateContext(true);
      return {steps,legal,distance:length(),speed:player.boat.speed,canExit:validBoatExit(),y:player.y,paddle:rioMap.waterfront.paddle.visible};
    },
    stream:(keys)=>keys.map(key=>{
      const p=rioSiteByKey(key);rioStreamMap({x:p.x,z:p.z},true);
      return [key,rioMap.tiles.size,world.interactables.length,world.colliders.length];
    }),
    stagedRun:()=>{
      const course=rioMap.course;
      rioStreamMap(course.start,true);OTTHOS_TEST_API.teleport(course.start.x,course.start.z);
      updateContext(true);return course;
    },
    runStats:()=>({record:rioStreetRecord(),running:activeRace?.courseId||null,swimming:!!player.swimming}),
    stagedFootball:()=>{
      const site=rioSiteByKey('estadio_teixeirao');rioStreamMap({x:site.x,z:site.z},true);
      OTTHOS_TEST_API.teleport(...site.entry);updateContext(true);
      const main=world.sportsV704;
      return {position:[main.centerX,main.centerZ],site:[site.x,site.z],context:currentContext?.id};
    },
    auditVenues:()=>{
      const issues=[],details=[];
      for(const site of rioFunctionalSites()){
        const [x,z]=site.entry;rioStreamMap({x,z},true);
        OTTHOS_TEST_API.teleport(x,z);
        const room=roomFor(site.key);
        const prefix=site.id+'-';
        const actions=site.kind==='stadium'?world.interactables.filter(a=>a.id==='football-v705'):
          world.interactables.filter(a=>a.id.startsWith(prefix));
        const blocked=positionBlockedForPlayer(x,z,.43,{ignoreTraffic:true,ignoreParkedVehicles:true});
        if(blocked||!actions.length)issues.push([site.key,'entrance/actions',blocked,actions.length]);
        for(const action of actions){
          if(action.vehicleOnly)continue;
          const target={x:action.x,z:action.z};
          let result=characterActivityPath(target,null);
          if(!result&&room&&rioPlaceStyles[site.kind]){
            // From the public entry follow the central aisle before turning to the counter.
            const aisle=room.point(0,0);
            const leg=characterActivityPath(aisle,null);
            if(leg){
              OTTHOS_TEST_API.teleport(aisle.x,aisle.z);
              result=characterActivityPath(target,null);
              OTTHOS_TEST_API.teleport(x,z);
            }
          }
          if(!result)issues.push([site.key,action.id,'no walkable path from entry or aisle']);
        }
        details.push({key:site.key,enterable:!blocked,room:!!room,actions:actions.length});
      }
      return {issues,details};
    },
    save:()=>savePlayerPosition(true)
  };
`;
const server=await multiplayerServer();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={build:release.build,revision:release.revision,browser:browser.version(),errors:[],
  limits:['Chromium software rendering. Native player movement uses fixed 60 Hz steps in specified walking and driving portions.',
    'The fixture places the initial approach at each distant place. OpenUI, transaction actions, movement, seat animation and collisions run against the compiled game.']};
try{
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.abort());
  await context.addInitScript(()=>{
    if(localStorage.getItem('otthos_life_world_roleplay_v700'))return;
    localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,
      profile:{playerId:'rio-physical-qa',name:'Thiago QA',nameConfirmed:true,coins:64000,xp:240},
      position:{x:-18,y:0,z:39,yaw:0},flags:{accountPromptedV635:true},settings:{quality:'low',sound:false,worldHud:'clean'},
      avatar:{bodyStyle:'family-thiago',rioWardrobe:{thiago:{top:'hoodie',hat:'headphones'}}},
      guardian:{sessionLimitMinutes:0},inventory:{food:7},
      vehicles:{owned:['garage-orange','unit-home-green-2-existing'],instances:{'unit-home-green-2-existing':{catalogId:'home-green',unit:2,purchasedAt:1600000000000}},primaryId:'garage-orange',lastUsedId:'garage-orange',
        parked:{'garage-orange':{x:-30.5,z:43.2,heading:1.57}},
        garage:{layoutVersion:2,displaySlots:{'4':'unit-home-green-2-existing'},slots:{'1':'garage-orange','2':'','3':'','4':'','5':'','6':'',H1:'',H2:'',H3:''},stored:{'garage-orange':false}}},
      boats:{parked:{'lake-boat':{x:-70,z:54,heading:0}},lastPosition:{x:-70,z:54,heading:0}},
      civilWorld:{migratedAt:1700000000000},
      career:{activeJob:{id:'delivery',instanceId:'rio-legacy-test',missionState:'TRAVELLING',title:'Entregador',reward:60,startedAt:1700000000300}}}));
  });
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.stack));
  page.on('console',e=>{if(e.type()==='error'&&e.text().includes('OTTHI START'))console.error(e.text());});
  page.setDefaultTimeout(25000);
  await installCityInspection(page,{appSource:source.slice(0,end)+hook+source.slice(end),capDuringBoot:true});
  await page.goto(server.origin+'/games/otthi/?entrada=mercado_municipal');
  report.entryLayouts=[];
  for(const viewport of [{width:360,height:800},{width:852,height:393},{width:1280,height:800}]){
    await page.setViewportSize(viewport);
    await page.waitForFunction(()=>{
      const button=document.getElementById('rioPretoPlayBtn'),r=button.getBoundingClientRect();
      const hit=document.elementFromPoint(r.x+r.width*.5,r.y+r.height*.5);
      return hit===button||button.contains(hit);
    },null,{timeout:6500});
    const geometry=await page.locator('#rioPretoPlayBtn').evaluate(button=>{
      const r=button.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width*.5,r.y+r.height*.5);
      return {hit:hit===button||button.contains(hit),overflow:document.documentElement.scrollWidth-innerWidth,
        at:hit?.id||hit?.className,rect:[r.x,r.y,r.width,r.height]};
    });
    report.entryLayouts.push({viewport,...geometry});assert(geometry.hit&&geometry.overflow<=1,JSON.stringify(geometry));
  }
  await page.setViewportSize({width:393,height:852});
  await page.locator('#rioPretoPlayBtn').tap();
  await page.waitForFunction(()=>window.__CITY_QA?.cap()&&OTTHOS_TEST_API.getGame().running&&OTTHI_RIO_MAP.diagnostics().active&&document.getElementById('modal').hidden||!!document.querySelector('[data-retry-world]'),null,{timeout:60000});
  assert.equal(await page.locator('[data-retry-world]').count(),0);
  report.start=await page.evaluate(()=>__RIO_PHYSICAL_QA.snapshot());
  assert(report.start.map&&!report.start.legacyGarage);
  assert.equal(report.start.diag.places,20);
  assert.equal(report.start.activeJob,'delivery');
  assert(report.start.models.some(name=>name.startsWith('RIO_TILE_')));
  assert(!report.start.models.some(name=>/^(OTTHI_WORLD_GARAGE|V702|OTTHI_OTTOVIAS)/.test(name)));
  assert.deepEqual(report.start.legacy,{x:-18,y:0,z:39,yaw:0});
  await page.evaluate(()=>__RIO_PHYSICAL_QA.renderCurrent());
  await page.screenshot({path:out+'/mercadao-rua.png'});

  await page.locator('#miniNav').tap();
  assert.equal(await page.locator('[data-rio-destination]').count(),23);
  await page.locator('[data-rio-destination="regional-canecao_represa"]').tap();
  report.navigation=await page.evaluate(()=>OTTHOS_TEST_API.navigation());
  assert.equal(report.navigation.waypoint.id,'regional-canecao_represa');
  assert(report.navigation.route.length>6&&report.navigation.progress.remaining>1000);

  const approach=async (key,suffix,initial=true)=>{
    if(initial)await page.evaluate(key=>__RIO_PHYSICAL_QA.setup(key,'outside'),key);
    const path=await page.evaluate(({key,suffix})=>__RIO_PHYSICAL_QA.paths(key,suffix),{key,suffix});
    assert(path?.length,JSON.stringify({key,suffix,path}));
    const result=await page.evaluate(path=>__RIO_PHYSICAL_QA.walk(path),path);
    assert(result.success&&result.context?.endsWith('-'+suffix),JSON.stringify({key,suffix,result}));
    return result;
  };
  report.marketDoor=await approach('mercado_municipal','counter');
  await page.locator('#actionBtn').tap({force:true});
  await page.locator('[data-rio-checkout="groceries"]').tap();
  report.market=await page.evaluate(()=>__RIO_PHYSICAL_QA.snapshot());
  assert.equal(report.market.coins,report.start.coins-20);
  assert.equal(report.market.food,report.start.food+5);
  await page.evaluate(()=>__RIO_PHYSICAL_QA.insideCamera('mercado_municipal',0,8,8));
  await page.screenshot({path:out+'/mercadao-interno.png'});

  await page.evaluate(()=>__RIO_PHYSICAL_QA.setup('canecao_represa','outside'));
  assert.equal(await page.evaluate(()=>OTTHOS_TEST_API.getContext()?.id?.includes('canecao')),undefined);
  report.diningCounter=await approach('canecao_represa','counter',false);
  await page.locator('#actionBtn').tap({force:true});
  await page.locator('[data-rio-food="juice"]').tap();
  const pending=await page.evaluate(()=>__RIO_PHYSICAL_QA.meal());
  assert.equal(pending.coins,report.market.coins);assert.equal(pending.served,true);
  report.diningWalk=await approach('canecao_represa','table',false);
  await page.locator('#actionBtn').tap({force:true});
  await page.evaluate(()=>__RIO_PHYSICAL_QA.advance(35));
  const paused=await page.evaluate(()=>__RIO_PHYSICAL_QA.meal());
  assert.equal(paused.phase,'perform');assert.equal(paused.coins,report.market.coins);
  assert(paused.inside&&paused.pose.sitting);
  assert.equal(paused.actor[0],paused.seat.chair.x);assert.equal(paused.actor[2],paused.seat.chair.z);
  assert.equal(paused.actor[1],paused.seat.seatTop);
  await page.evaluate(()=>__RIO_PHYSICAL_QA.renderCurrent());
  await page.screenshot({path:out+'/canecao-mesa.png'});
  await page.getByRole('button',{name:'PARAR',exact:true}).tap();
  assert.equal(await page.evaluate(()=>__RIO_PHYSICAL_QA.meal().coins),report.market.coins);
  await page.waitForTimeout(140);
  await page.locator('#actionBtn').tap({force:true});
  await page.evaluate(()=>__RIO_PHYSICAL_QA.advance(300));
  report.dining={pending,seat:paused,receipt:await page.evaluate(()=>__RIO_PHYSICAL_QA.meal())};
  assert.equal(report.dining.receipt.coins,report.market.coins-10);
  assert.equal(report.dining.receipt.served,false);
  assert.equal(report.dining.receipt.completed,pending.completed+1);

  await approach('complexo_swift','desk');
  await page.locator('#actionBtn').tap({force:true});
  await approach('complexo_swift','service',false);
  await page.locator('#actionBtn').tap({force:true});
  report.swift=await page.evaluate(()=>__RIO_PHYSICAL_QA.snapshot().rio.visits['regional-complexo_swift']);
  assert.equal(report.swift,true);

  await page.evaluate(()=>__RIO_PHYSICAL_QA.setup('mercado_municipal','outside'));
  await page.evaluate(()=>__RIO_PHYSICAL_QA.advance(120));
  const trafficBefore=await page.evaluate(()=>__RIO_PHYSICAL_QA.traffic());
  await page.evaluate(()=>__RIO_PHYSICAL_QA.advance(360));
  report.traffic=await page.evaluate(()=>__RIO_PHYSICAL_QA.traffic());
  assert(report.traffic.length>=3);
  assert(report.traffic.every(actor=>actor.asset&&actor.driver==='BRAZIL_NPC_DRIVER'&&actor.road),JSON.stringify(report.traffic));
  assert(report.traffic.some(a=>trafficBefore.some(p=>p.id===a.id&&Math.hypot(a.x-p.x,a.z-p.z)>10)));

  const originalFleet=await page.evaluate(()=>__RIO_PHYSICAL_QA.fleet());
  assert.deepEqual(originalFleet,{context:'rio-fleet-counter',vehicles:[{id:'garage-orange',model:'gol',visible:true}]});
  await page.locator('#actionBtn').tap({force:true});
  await page.locator('[data-rio-owned="unit-home-green-2-existing"]').tap();
  assert.deepEqual((await page.evaluate(()=>__RIO_PHYSICAL_QA.fleet())).vehicles,[{id:'unit-home-green-2-existing',model:'kombi',visible:true}]);
  await page.locator('#actionBtn').tap({force:true});
  await page.locator('[data-rio-owned="garage-orange"]').tap();
  report.fleet=await page.evaluate(()=>__RIO_PHYSICAL_QA.fleet());
  assert.deepEqual(report.fleet,originalFleet);

  await page.evaluate(()=>__RIO_PHYSICAL_QA.setup('posto_brasilia','outside'));
  report.fuelApproach=await page.evaluate(()=>__RIO_PHYSICAL_QA.fuelPrep());
  assert(report.fuelApproach.clear&&report.fuelApproach.id==='garage-orange'&&report.fuelApproach.model==='gol');
  await page.locator('#actionBtn').tap({force:true});
  report.fuelTravel=await page.evaluate(()=>__RIO_PHYSICAL_QA.drivePump());
  assert(report.fuelTravel.vehicle&&report.fuelTravel.movement>8&&report.fuelTravel.spent>0,JSON.stringify(report.fuelTravel));
  assert.equal(report.fuelTravel.impacts,0);
  assert.equal(report.fuelTravel.model,'gol');
  assert.equal(report.fuelTravel.context,'regional-posto_brasilia-pump');
  await page.evaluate(()=>__RIO_PHYSICAL_QA.renderCurrent());
  await page.screenshot({path:out+'/posto-bomba.png'});
  await page.locator('#vehicleActionBtn').tap();
  await page.locator('[data-rio-refuel]').tap();
  report.refuel=await page.evaluate(()=>__RIO_PHYSICAL_QA.snapshot());
  assert.equal(report.refuel.coins,report.dining.receipt.coins-20);
  assert(Math.abs(report.refuel.rio.roadVehicles['garage-orange'].fuel-(report.fuelTravel.fuel+10))<.01);
  await page.locator('#actionBtn').tap({force:true});
  await page.evaluate(()=>__RIO_PHYSICAL_QA.save());
  let saved=await page.evaluate(()=>__RIO_PHYSICAL_QA.snapshot());
  assert.deepEqual(saved.legacy,report.start.legacy);
  assert.deepEqual(saved.owned,report.start.owned);
  assert.deepEqual(saved.parked,report.start.parked);
  assert.deepEqual(saved.garage,report.start.garage);
  assert.equal(saved.lastUsed,report.start.lastUsed);
  report.venues=await page.evaluate(()=>__RIO_PHYSICAL_QA.auditVenues());
  assert.deepEqual(report.venues.issues,[]);
  const run=await page.evaluate(()=>__RIO_PHYSICAL_QA.stagedRun());
  await page.locator('#actionBtn').tap({force:true});
  await page.locator('[data-rio-run-start]').tap();
  await page.evaluate(()=>__RIO_PHYSICAL_QA.advance(205));
  const trajectory=await page.evaluate(points=>__RIO_PHYSICAL_QA.walk(points,1400,true),run.route.slice(1));
  report.represaRun={trajectory,checkpoints:run.gates.length,...await page.evaluate(()=>__RIO_PHYSICAL_QA.runStats())};
  assert(trajectory.success&&report.represaRun.record?.runs===1&&!report.represaRun.swimming,JSON.stringify(report.represaRun));
  assert.equal(report.represaRun.checkpoints,6);
  report.stadium=await page.evaluate(()=>__RIO_PHYSICAL_QA.stagedFootball());
  assert.deepEqual(report.stadium.position,report.stadium.site);
  assert.equal(report.stadium.context,'sports-hub-v7051');
  await page.locator('#actionBtn').tap({force:true});
  await page.locator('#footballSoloV705').tap();
  assert.equal(await page.evaluate(()=>OTTHI_SPORTS_V705.state().active),'football');
  await page.locator('[data-sport-exit]').tap();

  const beach=await page.evaluate(()=>__RIO_PHYSICAL_QA.waterfront('swim'));
  assert(beach.craft.length===4&&beach.craft.every(boat=>boat.safe),JSON.stringify(beach.craft));
  const swims=await page.evaluate(({water})=>__RIO_PHYSICAL_QA.walk([water]),beach);
  assert(swims.success);
  const swimming=await page.evaluate(()=>__RIO_PHYSICAL_QA.waterfront());
  assert(swimming.swimming);
  assert((await page.evaluate(({beach})=>__RIO_PHYSICAL_QA.walk([beach]),beach)).success);
  assert(!(await page.evaluate(()=>__RIO_PHYSICAL_QA.waterfront())).swimming);
  await page.evaluate(()=>__RIO_PHYSICAL_QA.advance(250));
  const life=await page.evaluate(()=>__RIO_PHYSICAL_QA.waterfront());
  report.aquaticLife=life.life;
  for(const actor of life.life){
    const initial=beach.life.find(row=>row.id===actor.id);
    assert(initial&&Math.hypot(actor.x-initial.x,actor.z-initial.z)>.4,JSON.stringify({actor,initial}));
  }
  assert.equal(life.life.filter(a=>a.action==='swim').length,2);

  report.boats=[];
  for(const craft of beach.craft){
    const dock=await page.evaluate(()=>__RIO_PHYSICAL_QA.waterfront('dock'));
    const boarding=await page.evaluate(({entry,step})=>__RIO_PHYSICAL_QA.walk([entry,step]),{entry:dock.entry,step:craft.step});
    assert(boarding.success&&boarding.context==='rio-board-'+craft.id,JSON.stringify({boarding,craft}));
    await page.locator('#actionBtn').tap({force:true});
    const boarded=await page.evaluate(()=>__RIO_PHYSICAL_QA.waterfront());
    assert.equal(boarded.current?.id,craft.id);
    if(craft.kind==='launch'){
      report.boatLayouts=[];
      for(const viewport of [{width:393,height:852},{width:852,height:393},{width:1280,height:800}]){
        await page.setViewportSize(viewport);
        const usable=()=>['jumpBtn','runBtn','actionBtn'].every(id=>{
          const node=document.getElementById(id),r=node.getBoundingClientRect();
          const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
          return node===hit||node.contains(hit);
        });
        await page.waitForFunction(usable,null,{timeout:8000});
        const unobstructed=await page.evaluate(usable);
        assert(unobstructed);
        report.boatLayouts.push({viewport,unobstructed});
      }
      await page.setViewportSize({width:393,height:852});
    }
    const outward=await page.evaluate(()=>__RIO_PHYSICAL_QA.boatLeg(true));
    assert(outward.legal&&outward.distance>12&&!outward.canExit&&outward.paddle===(craft.kind==='board'),JSON.stringify({craft,outward}));
    await page.locator('#actionBtn').tap({force:true});
    assert.equal((await page.evaluate(()=>__RIO_PHYSICAL_QA.waterfront())).current?.id,craft.id);
    await page.evaluate(()=>__RIO_PHYSICAL_QA.renderCurrent());
    await page.screenshot({path:out+'/represa-'+craft.kind+'.png'});
    if(craft.kind==='ship'){
      const savedBefore=await page.evaluate(async()=>{await __RIO_PHYSICAL_QA.save();return __RIO_PHYSICAL_QA.waterfront();});
      await page.goto(server.origin+'/games/otthi/?map=rio-preto');
      await page.locator('#rioPretoPlayBtn').tap();
      await page.waitForFunction(()=>window.__CITY_QA?.cap()&&OTTHOS_TEST_API.getGame().running&&OTTHI_RIO_MAP.diagnostics().active,null,{timeout:60000});
      const restored=await page.evaluate(()=>__RIO_PHYSICAL_QA.waterfront());
      assert.equal(restored.current?.id,craft.id);
      assert(Math.hypot(savedBefore.current.x-restored.current.x,savedBefore.current.z-restored.current.z)<.08);
      report.reloadBoat={saved:savedBefore.current,restored:restored.current};
    }
    const back=await page.evaluate(()=>__RIO_PHYSICAL_QA.boatLeg(false));
    assert(back.legal&&back.canExit&&back.distance<1.0,JSON.stringify({craft,back}));
    await page.locator('#actionBtn').tap({force:true});
    const landing=await page.evaluate(()=>__RIO_PHYSICAL_QA.waterfront());
    assert(!landing.current&&!landing.swimming&&landing.ground>.25&&Math.hypot(landing.position.x-craft.step.x,landing.position.z-craft.step.z)<.15);
    report.boats.push({id:craft.id,kind:craft.kind,outward,back,landing:landing.position});
  }
  assert.deepEqual((await page.evaluate(()=>__RIO_PHYSICAL_QA.snapshot())).boats,report.start.boats);

  const sample=['mercado_municipal','canecao_represa','posto_brasilia','mercado_municipal','canecao_represa'];
  report.stream=await page.evaluate(keys=>__RIO_PHYSICAL_QA.stream(keys),sample);
  for(const [,chunks] of report.stream)assert(chunks<=25);
  assert.deepEqual(report.stream[0].slice(1),report.stream[3].slice(1));
  assert.deepEqual(report.stream[1].slice(1),report.stream[4].slice(1));
  await page.evaluate(({x,z})=>OTTHOS_TEST_API.teleport(x,z),saved.rio.position);
  await page.evaluate(()=>__RIO_PHYSICAL_QA.save());

  await page.locator('#quickToggleBtn').tap();
  await page.locator('[data-rio-panel-ot]').tap();
  await page.waitForURL('**/games/otthi/?map=ot');
  await page.waitForFunction(()=>window.__CITY_QA?.cap()&&OTTHOS_TEST_API.getGame().running&&!OTTHI_RIO_MAP.diagnostics().active&&document.getElementById('modal').hidden,null,{timeout:170000});
  report.original=await page.evaluate(()=>__RIO_PHYSICAL_QA.snapshot());
  assert(report.original.legacyGarage&&!report.original.hud);
  assert.equal(report.original.coins,report.refuel.coins);
  assert.equal(report.original.food,report.market.food);
  assert.deepEqual(report.original.owned,report.start.owned);
  assert.deepEqual(report.original.garage,report.start.garage);
  assert.equal(report.original.activeJob,'delivery');
  assert(report.original.rio.visits['regional-canecao_represa']);
  assert.deepEqual(report.errors,[]);
  report.passed=true;console.log('PASS real Rio map, physical room and furniture, native shopping, pump, distinct saves and OT return');
}catch(error){
  report.failure=error.stack;
  const page=browser.contexts()[0]?.pages()[0];
  report.screen=await page?.evaluate(()=>({title:document.getElementById('modalTitle')?.textContent,
    modal:document.getElementById('modalBody')?.textContent?.trim().slice(0,420),
    running:window.OTTHOS_TEST_API?.getGame(),rio:window.OTTHI_RIO_MAP?.diagnostics()})).catch(()=>null);
  throw error;
}
finally{
  fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));
  await browser.close();await server.close();
}

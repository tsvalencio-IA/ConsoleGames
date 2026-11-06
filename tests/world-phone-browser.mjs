/* Native phone UI and dispatch over disposable state and local realtime data. */
import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {installWorldRtdbFixture} from './helpers/world-rtdb-browser-fixture.mjs';
import {installCityInspection} from './helpers/world-city-inspection.mjs';

const out='test-results/world-phone';fs.mkdirSync(out,{recursive:true});
const server=await multiplayerServer(),browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const source=fs.readFileSync('games/otthi/app.js','utf8'),end=source.lastIndexOf('})();');
const hook=`
 window.__PHONE_QA={
  prepare:()=>{
   const id='playmobil-utility';if(!state.vehicles.owned.includes(id))state.vehicles.owned.push(id);const v=vehicleById(id)||ensureCatalogVehicle(id);if(!v)throw Error('Missing detailed owned vehicle');
   state.vehicles.garage.stored[id]=false;setGarageVehicleStored(v,false);
   for(const [aId,bId]of NAV_BASE_EDGES){const a=NAV_BASE_NODES[aId],b=NAV_BASE_NODES[bId],len=Math.hypot(b.x-a.x,b.z-a.z);if(len<45)continue;const fx=(b.x-a.x)/len,fz=(b.z-a.z)/len;
    for(const side of[7,-7,10,-10]){const from={x:a.x+fx*len*.25,z:a.z+fz*len*.25,yaw:Math.atan2(fx,fz)},p={x:a.x+fx*len*.70+fz*side,z:a.z+fz*len*.70-fx*side};
     if(positionBlockedForPlayer(p.x,p.z,.5,{ignoreActor:v,ignoreTraffic:true})||!phoneVehiclePoseClear(v,from.x,from.z,from.yaw,false))continue;
     v.group.position.set(from.x,groundHeightAt(from.x,from.z),from.z);v.group.rotation.y=from.yaw;OTTHOS_TEST_API.teleport(p.x,p.z);if(!phoneGroundDestination(v))continue;return{id,from,player:p};
    }
   }throw Error('No unoccupied road fixture for native phone delivery');
  },
  advance:frames=>__CITY_QA.simulate(frames),
  snapshot:()=>({phone:OT_WORLD_PHONE.diagnostics(),coins:state.profile.coins,owned:[...state.vehicles.owned],damage:{...state.vehicles.partDurability},vehicle:worldPhone.job?{id:worldPhone.job.id,x:worldPhone.job.vehicle.group.position.x,z:worldPhone.job.vehicle.group.position.z,occupied:worldPhone.job.vehicle.occupied}:null}),
  prepareAir:()=>{airEnsure();const id='heli-ottovias',c=airOperations.fleet.data.craft[id];if(!c)throw Error('No native helicopter');state.vehicles.aircraft||={};state.vehicles.aircraft[id]={x:c.x,z:c.z,yaw:c.yaw};return{id,from:{x:c.x,z:c.z}};},
  air:id=>({craft:structuredClone(airOperations.fleet.data.craft[id]),available:airAvailable(id)}),
  draw:()=>__CITY_QA.renderNative()
 };
`;
const errors=[],report={limits:['Disposable local profile and isolated RTDB fixture. Native geometry, controls and dispatch code; no live player data.','Software WebGL confirms rendering and behavior, not physical Android temperature or sustained FPS.']};
let page;
try{
 const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===server.origin?r.continue():r.abort());await installWorldRtdbFixture(context);
 await context.addInitScript(()=>localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,profile:{name:'Phone QA',nameConfirmed:true,playerId:'phone-local-fixture',coins:8000},flags:{accountPromptedV635:true},settings:{quality:'low',sound:false},guardian:{sessionLimitMinutes:0},familyAdventure:{party:{controller:'thiago',members:['thiago']}}})));
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.stack));page.setDefaultTimeout(60000);await installCityInspection(page,{appSource:source.slice(0,end)+hook+source.slice(end),capDuringBoot:true});
 await page.goto(server.origin+'/games/otthi/');await page.locator('#playBtn').click();await page.waitForFunction(()=>window.__CITY_QA?.cap()&&OTTHOS_TEST_API.getGame().running&&document.getElementById('modal').hidden,null,{timeout:120000});
 const target=await page.evaluate(()=>__PHONE_QA.prepare()),before=await page.evaluate(()=>__PHONE_QA.snapshot());report.before={target,...before};
 await page.locator('#quickToggleBtn').click();await page.locator('#worldPhoneBtn').click();await page.locator('[data-phone-ground="'+target.id+'"]').click();
 await page.waitForFunction(()=>OT_WORLD_PHONE.diagnostics().job);const dispatched=await page.evaluate(()=>__PHONE_QA.snapshot());assert(dispatched.phone.job.driverVisible);assert(dispatched.vehicle.occupied);
 for(let i=0;i<30;i++){if(!await page.evaluate(()=>OT_WORLD_PHONE.diagnostics().job))break;await page.evaluate(()=>__PHONE_QA.advance(120));}
 const arrived=await page.evaluate(()=>__PHONE_QA.snapshot());assert.equal(arrived.phone.job,null,JSON.stringify(arrived.phone));assert.equal(arrived.phone.last.status,'delivered');assert.equal(arrived.coins,before.coins);assert.deepEqual(arrived.owned,before.owned);assert.deepEqual(arrived.damage,before.damage);
 await page.evaluate(()=>__PHONE_QA.draw());await page.screenshot({path:out+'/ground-arrival.png'});report.ground={dispatched,arrived};
 const air=await page.evaluate(()=>__PHONE_QA.prepareAir());await page.locator('#quickToggleBtn').click();await page.locator('#worldPhoneBtn').click();await page.locator('[data-phone-air="'+air.id+'"]').click();
 await page.waitForFunction(id=>OT_WORLD_AIR_OPERATIONS.diagnostics().fleet.craft[id].status==='delivery',air.id);const airStart=await page.evaluate(id=>__PHONE_QA.air(id),air.id);
 for(let i=0;i<45;i++){if(await page.evaluate(id=>__PHONE_QA.air(id).craft.status==='parked',air.id))break;await page.evaluate(()=>__PHONE_QA.advance(120));}
 const airEnd=await page.evaluate(id=>__PHONE_QA.air(id),air.id);assert.equal(airEnd.craft.status,'parked',JSON.stringify(airEnd));assert(airEnd.available);assert.equal(airEnd.craft.pilot,'');assert(Math.hypot(airEnd.craft.x-air.from.x,airEnd.craft.z-air.from.z)>15);report.air={airStart,airEnd};
 await page.evaluate(()=>__PHONE_QA.draw());await page.screenshot({path:out+'/air-arrival.png'});
 report.layouts=[];
 for(const size of[{width:390,height:844},{width:844,height:390},{width:360,height:740}]){
  await page.setViewportSize(size);await page.locator('#quickToggleBtn').click();await page.locator('#worldPhoneBtn').click();
  const layout=await page.evaluate(()=>{const p=document.querySelector('.world-phone'),r=p.getBoundingClientRect();return{left:r.left,right:r.right,viewport:innerWidth,scrollWidth:p.scrollWidth,clientWidth:p.clientWidth,groundButtons:p.querySelectorAll('[data-phone-ground]').length};});
  assert(layout.left>=0&&layout.right<=size.width+1);assert(layout.scrollWidth<=layout.clientWidth+1);assert(layout.groundButtons>0);report.layouts.push({size,...layout});await page.screenshot({path:out+'/phone-'+size.width+'x'+size.height+'.png'});await page.locator('#modalClose').click();
 }
 assert.deepEqual(errors,[]);report.passed=true;report.errors=errors;fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));console.log('PASS native phone, road delivery, visible driver, helicopter delivery, release, layouts and preserved balance/ownership/damage');
}catch(error){report.failure=error.stack;report.errors=errors;if(page){report.state=await page.evaluate(()=>window.__PHONE_QA?.snapshot()).catch(()=>null);await page.screenshot({path:out+'/failure.png'}).catch(()=>{});}fs.writeFileSync(out+'/failure.json',JSON.stringify(report,null,2));throw error;}finally{await browser.close();await server.close();}

/* Native phone UI and dispatch over disposable state and local realtime data. */
import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {installWorldRtdbFixture} from './helpers/world-rtdb-browser-fixture.mjs';
import {installCityInspection} from './helpers/world-city-inspection.mjs';

const out='test-results/world-phone-orders';fs.mkdirSync(out,{recursive:true});
const server=await multiplayerServer(),browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const source=fs.readFileSync('games/otthi/app.js','utf8'),end=source.lastIndexOf('})();');
const hook=`
 const phoneQaGifts=[],phoneQaSociety=updateNpcSociety;updateNpcSociety=function(...args){const before=state.profile.coins,result=phoneQaSociety(...args),amount=state.profile.coins-before;if(amount){if(amount!==8)throw Error('Unexpected passive NPC credit: '+amount);phoneQaGifts.push({amount,source:'native NPC society gift',at:Date.now()});}return result;};
 let phoneQaReroutes=0,phoneQaDistance=0,phoneQaJump=0;const phoneQaAdvance=phoneAdvanceJob;phoneAdvanceJob=function(job,dt){const x=job.route.x,z=job.route.z;phoneQaAdvance(job,dt);const d=Math.hypot(job.route.x-x,job.route.z-z);phoneQaDistance+=d;phoneQaJump=Math.max(phoneQaJump,d);phoneQaReroutes=Math.max(phoneQaReroutes,job.reroutes||0);};
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
  snapshot:()=>({phone:OT_WORLD_PHONE.diagnostics(),coins:state.profile.coins,passiveGifts:phoneQaGifts.slice(),owned:[...state.vehicles.owned],damage:{...state.vehicles.partDurability},vehicle:worldPhone.job?{id:worldPhone.job.id,x:worldPhone.job.vehicle.group.position.x,z:worldPhone.job.vehicle.group.position.z,occupied:worldPhone.job.vehicle.occupied}:null}),
  block:()=>{const job=worldPhone.job,p=sampleRoute([{x:job.route.x,z:job.route.z},...job.route.points.slice(job.route.index)],1).find(p=>Math.hypot(p.x-job.route.x,p.z-job.route.z)>13);if(!p)throw Error('Delivery fixture too short');const v=createToyCar(p.x,p.z,{id:'phone-qa-blocker',label:'Carro parado',brazilModel:'gol',heading:p.angle});v.group.position.set(p.x,groundHeightAt(p.x,p.z),p.z);v.group.rotation.y=p.angle;v.group.visible=true;v.garageStored=false;return{x:p.x,z:p.z};},
  unblock:()=>{const v=vehicleById('phone-qa-blocker');if(v){v.garageStored=true;v.group.visible=false;}},
  metrics:()=>({reroutes:phoneQaReroutes,distance:phoneQaDistance,jump:phoneQaJump}),
  goods:()=>({coins:state.profile.coins,food:state.inventory.food,orders:phoneOrders().map(o=>({...o})),owned:[...state.vehicles.owned]}),
  storeFixtures:()=>{for(let n=1;n<=4;n++){const id='phone-qa-owned-'+n;state.vehicles.instances||={};state.vehicles.instances[id]={catalogId:'br-palio',unit:n,purchasedAt:Date.now()+n};if(!state.vehicles.owned.includes(id))state.vehicles.owned.push(id);const v=ensureCatalogVehicle(id);v.group.position.set(-20-n*8,0,100);v.group.visible=true;v.garageStored=false;state.vehicles.garage.stored[id]=false;}},
  garage:()=>({owned:[...state.vehicles.owned],stored:{...state.vehicles.garage.stored},visible:world.vehicles.filter(v=>state.vehicles.owned.includes(v.id)&&v.group.visible).map(v=>v.id)}),
  approach:()=>{const v=worldPhone.job?.vehicle;if(!v)throw Error('No parcel van');for(let n=0;n<16;n++){const a=n*Math.PI/8,x=v.group.position.x+Math.sin(a)*4.5,z=v.group.position.z+Math.cos(a)*4.5;if(!positionBlockedForPlayer(x,z,.45,{ignoreTraffic:false})){OTTHOS_TEST_API.teleport(x,z);return;}}throw Error('No parcel access');},
  receiveAgain:()=>phoneReceiveParcel(),
  prepareAir:(mode='helicopter')=>{airEnsure();const id=mode==='plane'?Object.values(airOperations.fleet.data.craft).find(c=>airOperations.fleet.spec(c.id)?.mode==='plane'&&c.status==='parked')?.id:'heli-ottovias',c=airOperations.fleet.data.craft[id];if(!c)throw Error('No native helicopter');state.vehicles.aircraft||={};state.vehicles.aircraft[id]={x:c.x,z:c.z,yaw:c.yaw};return{id,from:{x:c.x,z:c.z}};},
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
 const blocker=await page.evaluate(()=>__PHONE_QA.block());report.blocker=blocker;
 await page.locator('#quickToggleBtn').click();await page.locator('#worldPhoneBtn').click();await page.locator('[data-phone-track]').click();assert(await page.locator('[data-phone-map-tracking]').count());assert(await page.locator('[data-phone-map-route]').count());await page.screenshot({path:out+'/driver-route-map.png'});await page.locator('#modalClose').click();
 for(let i=0;i<75;i++){if(!await page.evaluate(()=>OT_WORLD_PHONE.diagnostics().job))break;await page.evaluate(()=>__PHONE_QA.advance(120));}
 const metric=await page.evaluate(()=>__PHONE_QA.metrics());assert(metric.reroutes>0,JSON.stringify(metric));assert(metric.jump<.8,'driver never teleports past traffic');report.detour=metric;
 const arrived=await page.evaluate(()=>__PHONE_QA.snapshot());assert.equal(arrived.phone.job,null,JSON.stringify(arrived.phone));assert.equal(arrived.phone.last.status,'delivered');assert.equal(arrived.coins-before.coins,arrived.passiveGifts.slice(before.passiveGifts.length).reduce((sum,gift)=>sum+gift.amount,0),'delivery must not change the balance apart from independently observed native NPC gifts');assert.deepEqual(arrived.owned,before.owned);for(const [id,value]of Object.entries(before.damage))assert.equal(arrived.damage[id],value,'existing damage is preserved: '+id);
 await page.evaluate(()=>__PHONE_QA.draw());await page.screenshot({path:out+'/ground-arrival.png'});report.ground={dispatched,arrived};
 await page.evaluate(()=>__PHONE_QA.unblock());
 await page.evaluate(()=>__PHONE_QA.storeFixtures());await page.locator('#quickToggleBtn').click();await page.locator('#worldPhoneBtn').click();await page.locator('[data-phone-store-all]').click();
 const stored=await page.evaluate(()=>__PHONE_QA.garage());assert(stored.owned.every(id=>stored.stored[id]),JSON.stringify(stored));assert.deepEqual(stored.visible,[]);report.storage=stored;await page.screenshot({path:out+'/all-vehicles-stored.png'});
 await page.locator('[data-phone-shop]').click();const goods=await page.evaluate(()=>__PHONE_QA.goods());await page.locator('[data-phone-buy-item="food"]').click();await page.locator('[data-yes]').click();
 await page.waitForFunction(()=>OT_WORLD_PHONE.diagnostics().orders.some(o=>o.kind==='parcel'&&['queued','en-route'].includes(o.status)));
 const paid=await page.evaluate(()=>__PHONE_QA.goods());assert.equal(paid.food,goods.food,'paid order is not granted before delivery');report.parcelPaid=paid;
 for(let i=0;i<8;i++)await page.evaluate(()=>__PHONE_QA.advance(120));
 await page.reload();await page.locator('#playBtn').click();await page.waitForFunction(()=>window.__CITY_QA?.cap()&&OTTHOS_TEST_API.getGame().running&&document.getElementById('modal').hidden,null,{timeout:120000});
 for(let i=0;i<120;i++){if(await page.evaluate(()=>OT_WORLD_PHONE.diagnostics().tracking?.ready))break;await page.evaluate(()=>__PHONE_QA.advance(120));}
 const ready=await page.evaluate(()=>OT_WORLD_PHONE.diagnostics());assert(ready.tracking?.ready,JSON.stringify(ready));assert.equal((await page.evaluate(()=>__PHONE_QA.goods())).food,goods.food);report.parcelReady=ready;
 await page.evaluate(()=>__PHONE_QA.approach());await page.locator('#quickToggleBtn').click();await page.locator('#worldPhoneBtn').click();await page.screenshot({path:out+'/parcel-ready.png'});await page.locator('[data-phone-parcel-receive]').click();
 const received=await page.evaluate(()=>__PHONE_QA.goods());assert.equal(received.food,goods.food+2);assert.equal(received.orders.at(-1).status,'delivered');assert.equal(await page.evaluate(()=>__PHONE_QA.receiveAgain()),false);assert.equal((await page.evaluate(()=>__PHONE_QA.goods())).food,goods.food+2);report.parcelReceived=received;
 await page.locator('#modalClose').click();
 report.layouts=[];
 for(const size of[{width:390,height:844},{width:844,height:390},{width:360,height:740}]){
  await page.setViewportSize(size);await page.locator('#quickToggleBtn').click();await page.locator('#worldPhoneBtn').click();
  const layout=await page.evaluate(()=>{const p=document.querySelector('.world-phone'),r=p.getBoundingClientRect();return{left:r.left,right:r.right,viewport:innerWidth,scrollWidth:p.scrollWidth,clientWidth:p.clientWidth,groundButtons:p.querySelectorAll('[data-phone-ground]').length};});
  assert(layout.left>=0&&layout.right<=size.width+1);assert(layout.scrollWidth<=layout.clientWidth+1);assert(layout.groundButtons>0);report.layouts.push({size,...layout});await page.screenshot({path:out+'/phone-'+size.width+'x'+size.height+'.png'});await page.locator('#modalClose').click();
 }
 assert.deepEqual(errors,[]);report.passed=true;report.errors=errors;fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));console.log('PASS stopped-car detour, live driver map, bulk storage, parcel purchase, reload and exactly-once receipt');
}catch(error){report.failure=error.stack;report.errors=errors;if(page){report.state=await page.evaluate(()=>window.__PHONE_QA?.snapshot()).catch(()=>null);await page.screenshot({path:out+'/failure.png'}).catch(()=>{});}fs.writeFileSync(out+'/failure.json',JSON.stringify(report,null,2));throw error;}finally{await browser.close();await server.close();}

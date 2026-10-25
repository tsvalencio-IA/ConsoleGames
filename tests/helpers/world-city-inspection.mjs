/* Local inspection only; no production exports or accounts are introduced. */
import fs from 'node:fs';
export async function installCityInspection(page){
 for(const[path,type]of[['index.html','text/html'],['VERSION.json','application/json'],['assets/js/core/runtime-config.js','application/javascript'],['style.css','text/css'],['release-manifest.json','application/json']]){const body=fs.readFileSync('games/otthi/'+path,'utf8');await page.route(path==='index.html'?/\/games\/otthi\/(?:index\.html)?(?:\?.*)?$/:new RegExp('/games/otthi/'+path.replaceAll('.','\\.')+'(?:\\?.*)?$'),r=>r.fulfill({contentType:type,body}));}
 const file=fs.readFileSync('games/otthi/app.js','utf8'),end=file.lastIndexOf('})();');
 const hook=`
 let cityQaRender=null,cityQaMs=0;const cityQaRealNow=performance.now.bind(performance),cityQaDateNow=Date.now.bind(Date);Object.defineProperty(performance,'now',{value:()=>cityQaRealNow()+cityQaMs});Date.now=()=>cityQaDateNow()+cityQaMs;
 const cityQaTransactions=[],cityQaPurchase=cityPurchase;cityPurchase=function(id,item){const before={coins:state.profile.coins,food:Number(state.inventory.food||0)},ok=cityQaPurchase(id,item),after={coins:state.profile.coins,food:Number(state.inventory.food||0)};cityQaTransactions.push({id,item,ok,before,after});return ok;};
 window.__CITY_QA={
 cap:()=>{if(cityQaRender)return true;if(!renderer)return false;cityQaRender=renderer.render.bind(renderer);renderer.render=()=>{};return true;},
 combat:()=>otGames,
 sample:()=>({incidents:state.cityServices.emergencyCalls||0,activeIncident:world.activeIncident?{id:world.activeIncident.id,x:world.activeIncident.x,z:world.activeIncident.z,actors:world.activeIncident.actorStates.map(s=>s.ref.id)}:null,traffic:trafficActorList().map(a=>({id:a.id,x:a.group.position.x,z:a.group.position.z,speed:a.speed,heading:a.group.rotation.y,road:pointOnRoad(a.group.position.x,a.group.position.z,.05)}))}),
 routes:()=>trafficActorList().map(a=>({id:a.id,closed:(world.ottoviasTraffic||[]).includes(a.ref)||(world.buses||[]).includes(a.ref)||(world.policeCars||[]).includes(a.ref)&&!a.ref.incidentTargetId&&!a.ref.npcTarget||(world.npcs||[]).some(n=>n.mobility===a.ref),path:a.group.userData.roadPath||a.ref.route?.points||a.ref.route||[]})),
 roadAt:(x,z)=>pointOnRoad(x,z,.05),
 trafficTick:(seconds=10)=>{const before=state.cityServices.emergencyCalls||0,events=[];for(let t=0;t<seconds;t+=.05){cityQaMs+=50;const old=captureTrafficPositions();updateTransitWorld(.05);updateOttoviasTraffic(.05);updatePoliceSystem(.05);updateFireService(.05);updateNPCs(.05);resolveTrafficOverlaps(old);updateTrafficIncidents(.05);updateCityCoastLife();if(world.activeIncident&&!events.some(e=>e.id===world.activeIncident.id))events.push({id:world.activeIncident.id,x:world.activeIncident.x,z:world.activeIncident.z,actors:world.activeIncident.actorStates.map(s=>s.ref.id)});}return{before,after:state.cityServices.emergencyCalls||0,events};},
 render:(x=0,z=0,span=170,tilt=0)=>{const a=renderer.domElement.width/renderer.domElement.height,c=new THREE.OrthographicCamera(-span*a/2,span*a/2,span/2,-span/2,.1,1800);c.position.set(x,230,z+tilt);c.lookAt(x,0,z);c.updateProjectionMatrix();(cityQaRender||renderer.render.bind(renderer))(scene,c);},
 transactions:()=>cityQaTransactions,purchase:(id,item)=>cityPurchase(id,item),state:()=>state
 };`;
 await page.route('**/app.js*',r=>r.fulfill({contentType:'application/javascript',body:file.slice(0,end)+hook+file.slice(end)}));
}

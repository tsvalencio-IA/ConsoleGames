import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const source=readFileSync('games/otthi/src/modules/36-modular-build-machines.js','utf8');
function garage(){
 const c=vm.createContext({console});vm.runInContext(`
 const window={};const PLAYER_GARAGE_HOME_SLOTS=['1','2','3','4','5','6'],PLAYER_GARAGE_HEAVY_SLOTS=['H1','H2','H3'],PLAYER_GARAGE_ALL_SLOTS=[...PLAYER_GARAGE_HOME_SLOTS,...PLAYER_GARAGE_HEAVY_SLOTS];function brazilDepotVehicle(){return false;}function brazilCollectionPoint(){return{};}
 const state={vehicles:{owned:['a','b','c','d'],garage:{slots:{'1':'a','2':'b','3':'c'},stored:{a:false,b:false,c:false,d:true}}}},player={vehicle:false,car:{id:''}};
 const cars=new Map(state.vehicles.owned.map(id=>[id,{id,garageStored:id==='d',group:{visible:id!=='d',position:{set(x,y,z){Object.assign(this,{x,y,z});}},rotation:{y:0}}}]));
 function ensurePlayerGarageState(){state.vehicles.garage=JSON.parse(JSON.stringify(state.vehicles.garage));return state.vehicles.garage;}
 const vehicleById=id=>cars.get(id),ensureCatalogVehicle=vehicleById,playerVehicleCatalogEntry=id=>({label:id}),playerGarageSlot=slot=>({x:10,z:Number(slot)*3,heading:1}),groundHeightAt=()=>0;
 function syncOwnedGarageDisplayFleet(){ensurePlayerGarageState();}function saveState(){}function toast(){}function updateContext(){}function persistParkedVehicle(){}
 `,c);
 for(const name of['garageVehicleSlot','setGarageVehicleStored','storeOwnedVehicle','placeOwnedVehicleInGarage']){const line=source.split('\n').find(x=>x.startsWith('  function '+name+'('));assert(line,name);vm.runInContext(line,c);}
 return code=>vm.runInContext(code,c);
}
test('garage: fourth withdrawal uses the fourth home bay without displacing an existing car',()=>{
 const run=garage(),r=run(`const accepted=placeOwnedVehicleInGarage('d');({accepted,slots:state.vehicles.garage.slots,stored:state.vehicles.garage.stored,newVisible:cars.get('d').group.visible,newStored:cars.get('d').garageStored,oldVisible:cars.get('a').group.visible});`);
 assert(r.accepted);assert.deepEqual(JSON.parse(JSON.stringify(r.slots)),{'1':'a','2':'b','3':'c','4':'d'});assert.equal(r.stored.a,false);assert.equal(r.stored.d,false);assert(r.newVisible);assert.equal(r.newStored,false);assert.equal(r.oldVisible,true);
});
test('garage: an occupied active car cannot be silently displaced by another withdrawal',()=>{
 const run=garage(),r=run(`state.vehicles.garage.slots={'1':'a','2':'b','3':'c','4':'b','5':'c','6':'b'};player.vehicle=true;player.car.id='a';const accepted=placeOwnedVehicleInGarage('d');({accepted,slots:state.vehicles.garage.slots,stored:state.vehicles.garage.stored});`);
 assert.equal(r.accepted,false);assert.equal(r.slots['1'],'a');assert.equal(r.stored.d,true);assert.equal(r.stored.a,false);
});
test('fleet: another owner of the same vehicle ID has independent paint and cannot alter the local save',()=>{
 const code=readFileSync('games/otthi/src/modules/49-brazilian-vehicles.js','utf8').split('\n').find(line=>line.startsWith('  function brazilColor(')),c=vm.createContext({console});
 vm.runInContext(`const state={vehicles:{brazilColors:{'garage-orange':'#245faa'}}},brazilFleet={seenColors:new Map([['garage-orange','#245faa']])},window={OTBrazilVehicles:{catalog:{gol:{color:0xc82e32}}}};function defaultWorldVehicleParts(){return{primary:'#f28a22'};}function brazilResolve(){return'gol';}`,c);vm.runInContext(code,c);
 const r=vm.runInContext(`const before=JSON.stringify(state),remote=brazilColor({id:'garage-orange',appearance:{primary:0x556677}},{primary:'#e75f35'},true),after=JSON.stringify(state),local=brazilColor({id:'garage-orange',appearance:{primary:0x556677}},{primary:'#245faa'});({before,after,remote,local,seen:brazilFleet.seenColors.get('garage-orange')});`,c);
 assert.equal(r.remote,0xe75f35);assert.equal(r.local,0x245faa);assert.equal(r.before,r.after);assert.equal(r.seen,'#245faa');
});

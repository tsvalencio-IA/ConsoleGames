import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function controls(){
 const writes={text:0,attributes:0};
 const node=()=>{let text='';const attrs=new Map();return{get textContent(){return text;},set textContent(value){writes.text++;text=value;},getAttribute:n=>attrs.get(n)??null,setAttribute(n,v){writes.attributes++;attrs.set(n,v);},classList:{toggle(){}},parts:{}};};
 const els={runBtn:node(),jumpBtn:node(),actionBtn:node(),vehicleBadge:node()};
 for(const b of [els.runBtn,els.jumpBtn,els.actionBtn])b.parts={b:node(),span:node()};
 const scope={els,player:{vehicle:true,boating:false,car:{speed:0,passengerOf:''},boat:{}},input:{},family:{count:3,title:'Thiago, Luna, Liz'},durability:100,sport:false};
 scope.$=(selector,b)=>b?.parts[selector];scope.mobilityDriverActive=()=>scope.player.vehicle&&!scope.player.car.passengerOf||scope.player.boating;scope.sprintRequested=()=>false;scope.familyVehicleBadgeDetails=()=>scope.family;scope.vehicleDurabilityV704=()=>scope.durability;scope.syncSportControlsV705=()=>scope.sport;
 const source=fs.readFileSync('games/otthi/src/modules/23-vehicle-effects-driving.js','utf8');vm.createContext(scope);vm.runInContext(source.slice(source.indexOf('  function setControlText'),source.indexOf('  function updateVehicleControlsUI')),scope);
 return{scope,els,writes,reset(){writes.text=0;writes.attributes=0;}};
}
test('vehicle HUD: unchanged controls and a complete family/damage badge do not rewrite DOM every tick',()=>{
 const {scope:s,els,writes,reset}=controls(),base='🚗 Saveiro • 0 km/h — SAIR sempre disponível';
 s.updateMobilityControlLabels();s.setVehicleBadgeText(base);
 assert.equal(els.vehicleBadge.textContent,'🚗 Saveiro • 0 km/h • FAMÍLIA 3 — SAIR sempre disponível • Integridade 100%');assert.equal(els.vehicleBadge.getAttribute('title'),'Thiago, Luna, Liz');
 reset();for(let i=0;i<600;i++){s.updateMobilityControlLabels();s.setVehicleBadgeText(base);}assert.deepEqual(writes,{text:0,attributes:0});
});
test('vehicle HUD: braking, turbo, health and companion changes update immediately without retaining old suffixes',()=>{
 const {scope:s,els}=controls();s.updateMobilityControlLabels();assert.equal(els.jumpBtn.parts.span.textContent,'Ré');s.player.car.speed=.05;s.updateMobilityControlLabels();assert.equal(els.jumpBtn.parts.span.textContent,'Freio');assert.equal(els.jumpBtn.getAttribute('aria-label'),'Frear');
 s.family={count:2,title:'Thiago, Luna'};s.durability=24;s.setVehicleBadgeText('🚗 Saveiro • 10 km/h • TURBO — SAIR sempre disponível');assert.equal(els.vehicleBadge.textContent,'🚗 Saveiro • 10 km/h • TURBO • FAMÍLIA 2 — SAIR sempre disponível • Integridade 24% • CRÍTICO');
 s.family=null;s.durability=0;s.setVehicleBadgeText('🚗 Gol — SAIR sempre disponível');assert.equal(els.vehicleBadge.textContent,'🚗 Gol — SAIR sempre disponível • Integridade 0% • QUEBRADO');assert.equal(els.vehicleBadge.getAttribute('title'),'');
 s.player.car.passengerOf='driver';s.setVehicleBadgeText('🚗 Passageiro — AÇÃO para sair');assert.equal(els.vehicleBadge.textContent,'🚗 Passageiro — AÇÃO para sair');
});
test('vehicle HUD: walking, boats and sport controls retain their own labels',()=>{
 const {scope:s,els,writes,reset}=controls();s.player.vehicle=false;s.updateMobilityControlLabels();assert.equal(els.runBtn.parts.span.textContent,'Correr');assert.equal(els.jumpBtn.parts.span.textContent,'Pular');
 s.player.boating=true;s.updateMobilityControlLabels();assert.equal(els.runBtn.parts.span.textContent,'Acelerar');assert.equal(els.actionBtn.parts.b.textContent,'🛶');assert.equal(els.runBtn.getAttribute('aria-label'),'Acelerar barco');
 s.sport=true;reset();s.updateMobilityControlLabels();assert.deepEqual(writes,{text:0,attributes:0});
});

/** NPC customers are serviced and collected even when the player leaves the workshop. */
// @otthi-module-body
 const workshopNpcService={lastAt:0,reorganizeAt:0,graceMs:120000,repairMs:30000,collectionMs:8000};
 function workshopNpcBusy(vehicle,lift){
  if(player.vehicle&&String(player.car?.id)===String(vehicle.id))return true;
  if(lift?.busy||lift?.mechanicAction?.active||world.workshopMechanicAction?.active&&String(world.workshopMechanicAction.vehicle?.id)===String(vehicle.id))return true;
  if(world.workshopInspectionCamera?.active&&String(world.workshopInspectionCamera.vehicleId)===String(vehicle.id))return true;
  return vehicle.occupied&&!lift;
 }
 function workshopNpcLog(vehicle,result,at){
  const log=state.vehicles.workshopServiceLog||(state.vehicles.workshopServiceLog=[]);
  log.push({id:String(vehicle.id),label:String(vehicle.label||vehicle.id),owner:workshopVehicleOwnerMeta(vehicle).name,at,result,operator:'Equipe da oficina'});
  state.vehicles.workshopServiceLog=log.slice(-30);
 }
 function workshopNpcRepair(vehicle,record,lift,now){
  const assemble=()=>{if(lift)workshopRestoreAssemblyVisuals(vehicle,true);else for(const wheel of workshopWheelHolders(vehicle))wheel.visible=true;};
  if(lift)workshopForBay(lift,assemble);else assemble();
  for(const def of WORKSHOP_PART_DEFS)record.parts[def.id]=100;
  setVehicleDurabilityV704(vehicle,100,'npc-workshop-repair');
  record.lastDurability=100;record.serviceCompletedAt=now;record.serviceStatus='ready';record.npcAutoPhase='collection';record.npcAutoCollectAt=now+workshopNpcService.collectionMs;
  state.vehicles.broken[String(vehicle.id)]=false;
  if(vehicle.workshopYardStatus){workshopClearYardLabel(vehicle);workshopApplyYardMeta(vehicle,'ready',null);}
  workshopNpcLog(vehicle,'npc-repaired',now);
 }
 function workshopNpcCollect(vehicle,record,lift,now){
  // Close and hide before synchronizing the lift: its recovery finder must
  // never reclaim the customer's finished car while the box is being freed.
  vehicle.group.visible=false;record.serviceStatus='delivered';record.operatorReleasedAt=now;record.npcCollectedAt=now;record.npcAutoPhase='delivered';
  if(lift){
   workshopForBay(lift,()=>{workshopRestoreAssemblyVisuals(vehicle,true);lift.height=0;lift.raised=false;lift.busy=false;lift.platform.position.y=0;lift.vehicleId='';lift.disassembly=null;workshopSyncLiftMarkers();});
  }
  workshopClearVehicleYardMeta(vehicle);vehicle.occupied=false;vehicle.group.visible=false;record.serviceStatus='delivered';record.operatorReleasedAt=now;record.npcCollectedAt=now;record.npcAutoPhase='delivered';
  const actor=(world.ottoviasTraffic||[]).find(a=>String(a.id)===String(vehicle.trafficActorId||''));
  if(actor){delete trafficLocalClaims()[actor.id];actor.taken=!!trafficClaimOwner(actor.id);actor.group.visible=!actor.taken;world.trafficSnapshot=null;}
  delete state.vehicles.parked?.[String(vehicle.id)];
  workshopNpcLog(vehicle,record.unrepairable?'npc-collected-towed':'npc-collected',now);
 }
 function updateWorkshopNpcService(){
  const now=Date.now();if(!workshopBays.restored||now-workshopNpcService.lastAt<1000)return;workshopNpcService.lastAt=now;
  let changed=false,active=(world.vehicles||[]).filter(v=>!workshopIsCurrentUserVehicle(v)&&state.vehicles?.workshopComponents?.[v.id]?.npcAutoPhase==='repairing').length;
  for(const vehicle of world.vehicles||[]){
   if(!vehicle?.group||workshopIsCurrentUserVehicle(vehicle))continue;
   const record=state.vehicles?.workshopComponents?.[String(vehicle.id)];if(!record)continue;
   const lift=(world.workshopLifts||[]).find(l=>String(l.vehicleId)===String(vehicle.id));
   const claim=vehicle.trafficActorId&&trafficClaimOwner(vehicle.trafficActorId);
   if(claim&&claim!==sharedWorldOwnId())continue;
   if(Number(record.npcCollectedAt||0)>=Number(record.serviceOpenedAt||1)&&record.serviceStatus==='delivered'){
    if(!claim&&!workshopNpcBusy(vehicle,lift))vehicle.group.visible=false;continue;
   }
   if(!workshopServiceIsOpen(vehicle)||workshopNpcBusy(vehicle,lift))continue;
   if(!record.serviceOpenedAt)record.serviceOpenedAt=now;
   if(record.npcAutoOpenedAt!==record.serviceOpenedAt){record.npcAutoOpenedAt=record.serviceOpenedAt;record.npcAutoDueAt=now+workshopNpcService.graceMs;record.npcAutoPhase='waiting';delete record.npcAutoRepairAt;delete record.npcAutoCollectAt;changed=true;}
   if(record.unrepairable||workshopVehicleServiceStatus(vehicle)==='ready'){
    if(record.npcAutoPhase!=='collection'){record.npcAutoPhase='collection';record.npcAutoCollectAt=now+workshopNpcService.collectionMs;changed=true;}
   }else if(record.npcAutoPhase==='waiting'&&now>=record.npcAutoDueAt&&active<2){
    record.npcAutoPhase='repairing';record.npcAutoRepairAt=now+workshopNpcService.repairMs;active++;changed=true;
   }else if(record.npcAutoPhase==='repairing'&&now>=record.npcAutoRepairAt){workshopNpcRepair(vehicle,record,lift,now);active=Math.max(0,active-1);changed=true;}
   if(record.npcAutoPhase==='collection'&&now>=record.npcAutoCollectAt){workshopNpcCollect(vehicle,record,lift,now);changed=true;}
  }
  if(now-workshopNpcService.reorganizeAt>=7000){workshopNpcService.reorganizeAt=now;workshopReorganizeLegacyYardVehicles();}
  if(changed){saveState(true);if(typeof updateMultiplayer==='function')updateMultiplayer(0,true);}
 }
 const workshopNpcUpdateBefore=updateWorkshopMechanicActions;
 updateWorkshopMechanicActions=function(dt){workshopNpcUpdateBefore(dt);updateWorkshopNpcService();};
 const workshopNpcActionBefore=workshopStartMechanicAction;
 workshopStartMechanicAction=function(vehicle,options={}){const result=workshopNpcActionBefore(vehicle,options);if(result&&vehicle&&!options.remote&&!workshopIsCurrentUserVehicle(vehicle)){const record=workshopComponentRecord(vehicle);record.npcAutoDueAt=Date.now()+workshopNpcService.graceMs;record.npcAutoPhase='waiting';saveState(true);}return result;};
 const workshopNpcHistoryBefore=workshopServiceHistoryLabel;
 workshopServiceHistoryLabel=function(result){return({'npc-repaired':'🔧 Reparado pela equipe','npc-collected':'🚗 Devolvido ao NPC','npc-collected-towed':'🚚 Retirado pelo NPC com reboque'})[result]||workshopNpcHistoryBefore(result);};
 function workshopNpcWasCollected(vehicle){const record=state.vehicles?.workshopComponents?.[vehicle.id];return!!record&&!workshopIsCurrentUserVehicle(vehicle)&&record.serviceStatus==='delivered'&&Number(record.npcCollectedAt||0)>=Number(record.serviceOpenedAt||1)&&!(vehicle.trafficActorId&&trafficLocalClaims()[vehicle.trafficActorId])&&!(player.vehicle&&String(player.car?.id)===String(vehicle.id));}
 const workshopNpcVisibilityBefore=updateParkedVehicleVisibility;
 updateParkedVehicleVisibility=function(...args){workshopNpcVisibilityBefore(...args);for(const v of world.vehicles||[]){v.npcServiceCollected=workshopNpcWasCollected(v);if(v.npcServiceCollected)v.group.visible=false;}};
 window.OT_WORKSHOP_NPC_SERVICE={diagnostics:()=>({graceMs:workshopNpcService.graceMs,repairMs:workshopNpcService.repairMs,collectionMs:workshopNpcService.collectionMs,vehicles:(world.vehicles||[]).filter(v=>!workshopIsCurrentUserVehicle(v)&&state.vehicles?.workshopComponents?.[v.id]?.npcAutoPhase).map(v=>{const r=state.vehicles.workshopComponents[v.id];return{id:v.id,phase:r.npcAutoPhase,visible:v.group.visible,durability:vehicleDurabilityV704(v),collectedAt:r.npcCollectedAt||0};})})};

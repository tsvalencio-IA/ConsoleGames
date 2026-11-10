/** Purchases share the physical shop catalog and arrive as real world orders.
 * Pending orders and receipts live with the existing player vehicle save. */
// @otthi-module-body
 function phoneOrders(){const v=state.vehicles;if(!Array.isArray(v.phoneOrders))v.phoneOrders=[];return v.phoneOrders;}
 function phoneOrderItem(order){return worldShopItems().find(i=>(i.tool||i.key)===order.itemKey)||null;}
 function phoneItemUnavailable(item){return !!(item.tool&&state.tools.owned.includes(item.tool)||item.unique&&(state.inventory[item.key]||0)>0||phoneOrders().some(o=>o.kind==='parcel'&&o.itemKey===(item.tool||item.key)&&['queued','en-route','ready'].includes(o.status)&&(item.tool||item.unique)));}
 function phonePickupPoint(vehicle,origin){
  const road=nearestRoadProjection(origin);if(!road)return null;const a=NAV_BASE_NODES[road.aId],b=NAV_BASE_NODES[road.bId],d=Math.hypot(b.x-a.x,b.z-a.z)||1,fx=(b.x-a.x)/d,fz=(b.z-a.z)/d,yaw=Math.atan2(fx,fz);
  for(const along of[0,6,-6,12,-12,20,-20,30,-30])for(const side of[1.35,-1.35,0]){const p={x:road.point.x+fx*along-fz*side,z:road.point.z+fz*along+fx*side,yaw};if(v704RoadAt(p.x,p.z,.1,false)&&phoneVehiclePoseClear(vehicle,p.x,p.z,yaw,true))return p;}return null;
 }
 function phoneNewOrder(kind,label,price){return{id:'order-'+crypto.randomUUID(),kind,label,price,status:'queued',at:Date.now(),owner:sharedWorldOwnId()};}
 function phoneCourierVehicle(){
  const v=vehicleById('phone-parcel-courier')||createToyCar(-30,-20,{id:'phone-parcel-courier',label:'Entrega do Mercadinho',brazilModel:'kombi',bodyType:'utility',primary:0xe3b344,secondary:0x28596a});v.phoneCourier=true;return v;
 }
 function phoneReleaseCourier(job){
  phoneRemoveDriver(job.driver);const v=job.vehicle;v.occupied=false;v.phoneDelivery=false;v.garageStored=true;v.group.visible=false;v.currentSpeed=0;delete state.vehicles.parked[v.id];world.trafficSnapshot=null;
 }
 function phoneStartParcel(order){
  if(worldPhone.job||worldPhone.pending||worldPhone.returning.length||!phoneDispatchAllowed()||order.owner!==sharedWorldOwnId())return false;
  const vehicle=phoneCourierVehicle();vehicle.garageStored=true;vehicle.group.visible=false;
  const shop=MAP_LOCATIONS.find(l=>l.id==='shop')||{x:-30,z:-20},origin={x:Number(shop.navX??shop.x),z:Number(shop.navZ??shop.z)};
  let from=order.pose&&[order.pose.x,order.pose.z,order.pose.yaw].every(Number.isFinite)?{...order.pose}:null;
  if(from&&!phoneVehiclePoseClear(vehicle,from.x,from.z,from.yaw,true))return false;
  from||=phonePickupPoint(vehicle,origin);const target=order.status==='ready'&&order.target?order.target:phoneGroundDestination(vehicle);if(!from||!target)return false;
  const points=order.status==='ready'?[from,{...from}]:phoneGroundRoute(vehicle,from,target);if(points.length<2)return false;
  const driver=phoneMakeDriver();vehicle.occupied=true;vehicle.phoneDelivery=true;vehicle.garageStored=false;vehicle.group.position.set(from.x,groundHeightAt(from.x,from.z),from.z);vehicle.group.rotation.y=from.yaw;vehicle.group.visible=true;phoneDriverInVehicle(driver,vehicle);
  const job={id:vehicle.id,kind:'parcel',orderId:order.id,vehicle,driver,target,origin:order.origin||from,route:new PhoneDriveRoute(points,from.yaw),owner:sharedWorldOwnId(),saveAt:0,waiting:false,caller:{x:player.x,z:player.z}};
  worldPhone.job=job;order.origin=job.origin;order.target=target;if(order.status!=='ready')order.status='en-route';phoneSaveParcelPose(job);saveState(true);world.trafficSnapshot=null;
  if(order.status==='ready')phoneParcelArrived(job);return true;
 }
 function phoneSaveParcelPose(job){const order=phoneOrders().find(o=>o.id===job.orderId);if(order){order.pose={x:job.vehicle.group.position.x,z:job.vehicle.group.position.z,yaw:job.vehicle.group.rotation.y};order.target={...job.target};}}
 function phoneParcelArrived(job){
  if(job.ready)return;const order=phoneOrders().find(o=>o.id===job.orderId);if(!order)return;job.ready=true;order.status='ready';phoneSaveParcelPose(job);
  const v=job.vehicle;let parcel=v.group.userData.phoneParcel;if(!parcel){parcel=campaignBox(v.group,campaignMaterial(0xae793f,.05),0,.5,-2.5,.8,.8,.8);v.group.userData.phoneParcel=parcel;}parcel.visible=true;
  const id='phone-parcel-pickup';let access=world.interactables.find(i=>i.id===id);if(!access){registerInteractable({id,type:'shop',icon:'📦',label:'Receber minha encomenda',actionLabel:'RECEBER ENCOMENDA',getPos:()=>{const j=worldPhone.job;return j?{x:j.vehicle.group.position.x,z:j.vehicle.group.position.z}:{x:0,z:0};},radius:6,priority:820,available:()=>!!worldPhone.job?.ready&&worldPhone.job.kind==='parcel',action:phoneReceiveParcel});}
  saveState(true);toast('Sua encomenda chegou. Aproxime-se da van e use RECEBER ENCOMENDA.','good',4000);
 }
 function phoneReceiveParcel(){
  const job=worldPhone.job;if(!job?.ready||job.kind!=='parcel'||Math.hypot(player.x-job.vehicle.group.position.x,player.z-job.vehicle.group.position.z)>6)return false;
  const order=phoneOrders().find(o=>o.id===job.orderId),item=order&&phoneOrderItem(order);if(!item||order.status!=='ready'||order.owner!==sharedWorldOwnId())return false;
  // Receipt and item grant are saved in one synchronous transaction. Repeating
  // the pickup, reopening a menu, or reloading cannot grant the order twice.
  order.status='delivered';order.receivedAt=Date.now();
  if(item.tool){state.tools.owned=[...new Set([...state.tools.owned,item.tool])];state.tools.equipped=item.tool;refreshEquippedToolVisual();}else state.inventory[item.key]=(state.inventory[item.key]||0)+item.amount;
  addXP(5);saveState(true);updateHUD();if(job.vehicle.group.userData.phoneParcel)job.vehicle.group.userData.phoneParcel.visible=false;
  job.ready=false;job.kind='return';job.target=job.origin;job.route=new PhoneDriveRoute(phoneGroundRoute(job.vehicle,{x:job.route.x,z:job.route.z,yaw:job.route.yaw},job.origin),job.route.yaw);worldPhone.returning.push(job);worldPhone.job=null;toast(item.name+' recebido!','good',2600);return true;
 }
 function phoneCancelParcel(job){
  const order=phoneOrders().find(o=>o.id===job.orderId);if(order&&['queued','en-route','ready'].includes(order.status)){order.status='cancelled';order.refundedAt=Date.now();addCoins(order.price);saveState(true);}phoneReleaseCourier(job);worldPhone.job=null;toast('Compra cancelada e moedas devolvidas.','good',2800);
 }
 async function phoneBuyParcel(key){
  const item=worldShopItems().find(i=>(i.tool||i.key)===key);if(!item||worldPhone.pending||worldPhone.purchasePending||worldPhone.job||!phoneDispatchAllowed()||phoneItemUnavailable(item)||state.profile.coins<item.price)return false;
  const owner=sharedWorldOwnId();worldPhone.purchasePending=true;
  try{
   if(!await confirmModal('Comprar com entrega',`${item.icon} ${item.name} · ${item.price} moedas. O entregador vem do Mercadinho; você recebe a encomenda no mundo.`,'COMPRAR','VOLTAR'))return false;
   if(owner!==sharedWorldOwnId()||worldPhone.job||!phoneDispatchAllowed()||phoneItemUnavailable(item)||state.profile.coins<item.price)return false;
   const order=phoneNewOrder('parcel',item.name,item.price);order.itemKey=key;phoneOrders().push(order);addCoins(-item.price);saveState(true);phoneStartParcel(order);closeModal();toast('Compra confirmada. Acompanhe a encomenda no celular e no mapa.','good',3300);return order.id;
  }finally{worldPhone.purchasePending=false;}
 }
 async function phoneBuyVehicle(catalogId){
  const base=garageOldCatalogEntry(catalogId);if(!base||worldPhone.purchasePending||worldPhone.pending||worldPhone.job||!phoneDispatchAllowed())return false;const owner=sharedWorldOwnId();worldPhone.purchasePending=true;
  try{
   const units=garageOwnedEntries().filter(e=>e.catalogId===catalogId);if(units.length>=10||state.profile.coins<base.price)return false;
   if(!await confirmModal('Comprar veículo com entrega',`${base.label} · ${base.price} moedas. O motorista traz esta nova unidade da concessionária até uma vaga perto de você.`,'COMPRAR','VOLTAR'))return false;
   if(!await requestBrazilModel(base.model||brazilModelKey(base.id,base.category)))return false;
   if(owner!==sharedWorldOwnId()||worldPhone.job||!phoneDispatchAllowed()||state.profile.coins<base.price||garageOwnedEntries().filter(e=>e.catalogId===catalogId).length>=10)return false;
   const unit=garageUnitId(catalogId),id=garageNewInstanceId(catalogId,unit.unit),g=ensurePlayerGarageState(),order=phoneNewOrder('vehicle',base.label,base.price);order.vehicleId=id;order.status='en-route';
   state.vehicles.instances||={};state.vehicles.instances[id]={catalogId,unit:unit.unit,purchasedAt:Date.now()};state.vehicles.owned.push(id);g.stored[id]=true;g.purchasedAt[id]=Date.now();
   const vehicle=ensureCatalogVehicle(id),dealer=OTTHI_DEALERS.find(d=>d.category===neighborhoodVehicleCategory(base)),from=vehicle&&dealer&&phonePickupPoint(vehicle,{x:dealer.entryX,z:dealer.entryZ});
   phoneOrders().push(order);const ok=from&&await phoneDispatchGround(id,{from,payment:base.price,orderId:order.id});
   if(!ok){state.vehicles.owned=state.vehicles.owned.filter(v=>v!==id);delete state.vehicles.instances[id];delete g.stored[id];delete g.purchasedAt[id];state.vehicles.phoneOrders=phoneOrders().filter(o=>o.id!==order.id);if(vehicle){vehicle.garageStored=true;vehicle.group.visible=false;}saveState(true);toast('Não há saída ou vaga segura para esta entrega. A compra não foi cobrada.','info',3300);return false;}
   addXP(30);saveState(true);return id;
  }finally{worldPhone.purchasePending=false;}
 }
 function openPhoneShop(tab='items'){
  const busy=!!worldPhone.job||worldPhone.pending||worldPhone.purchasePending,allowed=phoneDispatchAllowed(),orders=phoneOrders(),pending=orders.filter(o=>['queued','en-route','ready'].includes(o.status));
  const items=worldShopItems();openModal('📱 Compras com entrega',`<section class="world-phone"><p>Saldo: <b>${state.profile.coins} moedas</b>. Suas compras chegam com um entregador. Receba a encomenda para colocar os itens no inventário.</p><nav class="world-phone-actions"><button class="btn" data-phone-shop-tab="items">MERCADINHO</button><button class="btn" data-phone-shop-tab="vehicles">VEÍCULOS</button><button class="btn" data-phone-back>VOLTAR AO CELULAR</button></nav>${pending.map(o=>`<p class="world-phone-status">${escapeHtml(o.label)} · ${o.status==='ready'?'Chegou — receber no mundo':o.status==='queued'?'Aguardando entregador':'Em entrega'}</p>`).join('')}${busy?'<p>Aguarde a entrega atual antes de fazer outra compra.</p>':''}${!allowed?'<p>Desembarque e fique ao ar livre para solicitar uma entrega.</p>':''}<div class="world-phone-list">${tab==='vehicles'?OTTHI_PLAYER_VEHICLE_CATALOG.map(e=>`<button class="btn" data-phone-buy-vehicle="${escapeHtml(e.id)}" ${busy||!allowed||state.profile.coins<e.price||garageOwnedEntries().filter(u=>u.catalogId===e.id).length>=10?'disabled':''}><span>${e.icon} ${escapeHtml(e.label)}</span><small>${e.price} moedas · comprar nova unidade e receber</small></button>`).join(''):items.map(item=>`<button class="btn" data-phone-buy-item="${escapeHtml(item.tool||item.key)}" ${busy||!allowed||state.profile.coins<item.price||phoneItemUnavailable(item)?'disabled':''}><span>${item.icon} ${item.name}</span><small>${phoneItemUnavailable(item)?'Já possui / já encomendado':`${item.price} moedas · ${item.tool?'ferramenta':item.amount+' unidades'}`}</small></button>`).join('')}</div></section>`,root=>{
   root.querySelector('[data-phone-back]').onclick=openWorldPhone;root.querySelectorAll('[data-phone-shop-tab]').forEach(b=>b.onclick=()=>openPhoneShop(b.dataset.phoneShopTab));root.querySelectorAll('[data-phone-buy-item]').forEach(b=>b.onclick=()=>phoneBuyParcel(b.dataset.phoneBuyItem));root.querySelectorAll('[data-phone-buy-vehicle]').forEach(b=>b.onclick=()=>phoneBuyVehicle(b.dataset.phoneBuyVehicle));
  });
 }
 function updatePhoneOrders(dt){
  for(const job of [...worldPhone.returning]){if(job.owner!==sharedWorldOwnId()){phoneReleaseCourier(job);worldPhone.returning=worldPhone.returning.filter(j=>j!==job);continue;}phoneAdvanceJob(job,dt);if(job.route.arrived){phoneReleaseCourier(job);worldPhone.returning=worldPhone.returning.filter(j=>j!==job);}}
  if(worldPhone.job||worldPhone.pending||worldPhone.returning.length||!phoneDispatchAllowed())return;
  const order=phoneOrders().find(o=>o.kind==='parcel'&&['queued','en-route','ready'].includes(o.status)&&o.owner===sharedWorldOwnId());if(order){const now=performance.now();if(now-Number(worldPhone.restoreAt||0)<3000)return;worldPhone.restoreAt=now;phoneStartParcel(order);}
 }

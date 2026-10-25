/** Physical vehicle dealers share the original catalog, purchases and saves. */
// @otthi-module-body
  const OTTHI_DEALERS=Object.freeze([
    Object.freeze({id:'dealer-cars',title:'OT Carros',icon:'🚗',category:'cars',x:-345,z:11,w:60,d:36,entryX:-311,entryZ:11,color:0x226899}),
    Object.freeze({id:'dealer-bikes',title:'OT Motos',icon:'🏍️',category:'bikes',x:-270,z:26,w:48,d:34,entryX:-296,entryZ:26,color:0xb84e32}),
    Object.freeze({id:'dealer-trucks',title:'OT Caminhões',icon:'🚛',category:'trucks',x:-350,z:-54,w:70,d:64,entryX:-313,entryZ:-54,color:0x27846e})
  ]);
  const neighborhoodDealers={ready:false,stores:[],lastAt:0,purchasePending:false};
  function neighborhoodVehicleModel(entry){return entry.model||brazilModelKey(entry.id,entry.category);}
  function neighborhoodVehicleCategory(entry){const key=neighborhoodVehicleModel(entry);return motorcycleModel(key)?'bikes':key==='constellation'||brazilDepotVehicle(entry.id)?'trucks':'cars';}
  function neighborhoodDealerStock(dealer){const models=new Set();return OTTHI_PLAYER_VEHICLE_CATALOG.filter(e=>{const key=neighborhoodVehicleModel(e);if(neighborhoodVehicleCategory(e)!==dealer.category||models.has(key))return false;models.add(key);return true;});}
  function dealerDisplayPoint(dealer,index){
    if(dealer.category==='cars')return{x:-369+(index%6)*9,z:-1+Math.floor(index/6)*5,heading:Math.PI/2};
    if(dealer.category==='bikes')return{x:-284+(index%4)*7,z:18+Math.floor(index/4)*14,heading:0};
    return{x:-369+(index%2)*27,z:-74+Math.floor(index/2)*20,heading:Math.PI/2};
  }
  function dealerVehicleCard(entry){const owned=state.vehicles.owned.includes(entry.id);return `<button class="choice" data-dealer-vehicle="${entry.id}" data-stock-name="${escapeHtml(entry.label.toLocaleLowerCase('pt-BR'))}"><b>${entry.icon} ${escapeHtml(entry.label)}</b><span>${owned?'Na sua garagem':entry.price+' moedas'}</span><small>${escapeHtml(entry.description)}</small></button>`;}
  function openDealer(dealerId){
    const dealer=OTTHI_DEALERS.find(d=>d.id===dealerId);if(!dealer)return;
    openModal(dealer.title,`<div class="shop-wallet"><span>Saldo</span><b>${state.profile.coins} moedas</b></div><p>Aproxime-se dos veículos expostos para consultar cada modelo. A compra é entregue na sua garagem; ônibus e carretas ficam no pátio de pesados.</p><label class="field">Buscar modelo<input type="search" data-stock-query placeholder="Nome do veículo"></label><div class="choice-grid">${neighborhoodDealerStock(dealer).map(dealerVehicleCard).join('')}</div><div class="modal-actions"><button class="btn" data-dealer-garage>Minha Garagem</button></div>`,root=>{
      $('[data-stock-query]',root).oninput=e=>{const q=e.target.value.toLocaleLowerCase('pt-BR');$$('[data-stock-name]',root).forEach(b=>b.hidden=!b.dataset.stockName.includes(q));};$$('[data-dealer-vehicle]',root).forEach(b=>b.onclick=()=>openDealerVehicle(dealerId,b.dataset.dealerVehicle));$('[data-dealer-garage]',root).onclick=openPlayerGarage;
    });
  }
  function openDealerVehicle(dealerId,id){
    const entry=playerVehicleCatalogEntry(id);if(!entry)return;const owned=state.vehicles.owned.includes(id);
    openModal(entry.label,`<p>${escapeHtml(entry.description)}</p><div class="shop-wallet"><span>${owned?'Veículo próprio':'Preço'}</span><b>${owned?'Na sua coleção':entry.price+' moedas'}</b></div><p>Saldo: ${state.profile.coins} moedas</p><div class="modal-actions">${owned?'<button class="btn primary" data-dealer-own>Retirar pela garagem</button>':'<button class="btn good" data-dealer-purchase>Comprar este veículo</button>'}<button class="btn" data-dealer-back>Voltar à loja</button></div>`,root=>{
      $('[data-dealer-back]',root).onclick=()=>openDealer(dealerId);$('[data-dealer-own]',root)?.addEventListener('click',openPlayerGarage);$('[data-dealer-purchase]',root)?.addEventListener('click',async()=>{if(neighborhoodDealers.purchasePending)return;neighborhoodDealers.purchasePending=true;try{await buyPlayerVehicle(id);openDealerVehicle(dealerId,id);}finally{neighborhoodDealers.purchasePending=false;}});
    });
  }
  function createNeighborhoodDealers(){
    if(neighborhoodDealers.ready||!worldGroup||!worldExpansion.ready)return;
    for(const dealer of OTTHI_DEALERS){
      const root=new THREE.Group();root.name='OTTHI_'+dealer.id.toUpperCase();root.position.set(dealer.x,0,dealer.z);const concrete=campaignMaterial(0xd4d9d5,.05,'concrete'),trim=campaignMaterial(dealer.color,.25),metal=campaignMaterial(0x29434d,.3),glass=new THREE.MeshStandardMaterial({color:0x8ab9c6,transparent:true,opacity:.25,roughness:.15,metalness:.1});
      const box=(m,x,y,z,w,h,d)=>campaignBox(root,m,x,y,z,w,h,d);box(concrete,0,.09,0,dealer.w,.18,dealer.d);box(campaignMaterial(0xd7dcda,.12),0,.20,0,dealer.w-1,.05,dealer.d-1);for(const dz of[-dealer.d/2+.65,dealer.d/2-.65])box(trim,0,.23,dz,dealer.w-1,.025,.5);
      const entrySide=dealer.category==='bikes'?-1:1,backX=-entrySide*(dealer.w/2-.2);
      box(concrete,backX,1.25,0,.35,2.5,dealer.d);registerCollider(dealer.x+backX,dealer.z,.35,dealer.d,{dealer:dealer.id});
      for(const dz of[-dealer.d/2+.2,dealer.d/2-.2]){box(metal,0,2.9,dz,dealer.w,.22,.28);box(glass,0,1.45,dz,dealer.w,2.6,.08);registerCollider(dealer.x,dealer.z+dz,dealer.w,.12,{dealer:dealer.id});for(const dx of[-dealer.w/2+1,0,dealer.w/2-1])box(metal,dx,1.45,dz,.18,2.9,.18);}
      // Narrow canopies keep the vehicles visible from the normal game camera.
      for(const dz of[-dealer.d/2+1.5,dealer.d/2-1.5])box(concrete,0,3.1,dz,dealer.w,.24,3);
      const sign=campaignSign(root,dealer.title.toUpperCase(),dealer.category==='cars'?'CLÁSSICOS · ESPORTIVOS · PICAPES':dealer.category==='bikes'?'URBANAS · TRAIL · BICICLETAS':'CARGA · RODOVIÁRIOS · ÔNIBUS',4.5);sign.position.x=entrySide*(dealer.w/2-.3);sign.rotation.y=entrySide*Math.PI/2;sign.scale.set(.85,.7,1);
      const deskX=entrySide*(dealer.w/2-3);box(concrete,deskX,.55,0,1.2,1.1,3.6);box(trim,deskX,1.15,0,1.4,.14,3.9);registerCollider(dealer.x+deskX,dealer.z,1.4,3.9,{dealer:dealer.id});
      campaignBatch(root);worldGroup.add(root);
      const stock=neighborhoodDealerStock(dealer),displays=stock.map((entry,index)=>{const point=dealerDisplayPoint(dealer,index),host=new THREE.Group();host.name='SHOWROOM_'+entry.id;host.position.set(point.x,.23,point.z);host.rotation.y=point.heading;worldGroup.add(host);host.visible=false;
        const pad=new THREE.Mesh(sharedBoxGeometry(dealer.category==='trucks'?13:dealer.category==='bikes'?2.1:5.2,.10,dealer.category==='trucks'?4.2:dealer.category==='bikes'?2.5:2.8),campaignMaterial(0x697b80,.18));pad.position.set(point.x,.22,point.z);worldGroup.add(pad);
        const plate=new THREE.Mesh(new THREE.PlaneGeometry(dealer.category==='trucks'?4.2:3.0,.62),new THREE.MeshBasicMaterial({map:signTexture(entry.label+' · '+entry.price+' moedas','#133a4a','#ffffff'),side:THREE.DoubleSide}));plate.position.set(point.x,.9,point.z+(dealer.category==='trucks'?3.2:dealer.category==='bikes'?2.0:1.9));worldGroup.add(plate);
        const record={entry,point,host,pad,plate,ready:false};registerInteractable({id:'showroom-'+entry.id,type:'shop',icon:entry.icon,label:'Ver '+entry.label,x:plate.position.x,z:plate.position.z,radius:2.1,priority:310,available:()=>host.visible&&record.ready,action:()=>openDealerVehicle(dealer.id,entry.id)});
        return record;});
      registerInteractable({id:dealer.id,type:'shop',icon:dealer.icon,label:'Entrar em '+dealer.title,x:dealer.entryX,z:dealer.entryZ,radius:4,priority:345,action:()=>openDealer(dealer.id)});neighborhoodDealers.stores.push({dealer,root,displays});
    }
    neighborhoodDealers.ready=true;world.navCache?.clear?.();
  }
  function updateNeighborhoodDealers(){
    createNeighborhoodDealers();const now=performance.now();if(now-neighborhoodDealers.lastAt<120)return;neighborhoodDealers.lastAt=now;const focus=otGamesFocus();let budget=2;
    for(const store of neighborhoodDealers.stores){const near=Math.hypot(focus.x-store.dealer.x,focus.z-store.dealer.z)<100;store.root.visible=near;
      for(const display of store.displays){const visible=near&&Math.hypot(focus.x-display.point.x,focus.z-display.point.z)<(qualityTier()==='low'?48:72);display.pad.visible=display.plate.visible=visible;display.host.visible=visible;
        if(!visible||display.ready||budget<=0)continue;const model=neighborhoodVehicleModel(display.entry);if(window.OTBrazilImports.requires(model)&&!window.OTBrazilImports.ready(model)){requestBrazilModel(model);continue;}
        display.host.add(window.OTBrazilVehicles.create(THREE,model,window.OTBrazilVehicles.catalog[model].color));display.ready=true;display.host.updateWorldMatrix(true,true);const bounds=new THREE.Box3().setFromObject(display.host),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());registerCollider(center.x,center.z,size.x,size.z,{dealerExhibit:display.entry.id});budget--;
      }
    }
  }
  const neighborhoodPreviousExpansionUpdate=updateWorldExpansion;
  updateWorldExpansion=function(){neighborhoodPreviousExpansionUpdate();updateNeighborhoodDealers();};
  const neighborhoodPreviousLocations=expansionMapLocations;
  expansionMapLocations=function(){return [...neighborhoodPreviousLocations(),...OTTHI_DEALERS.map(d=>({id:d.id,name:d.title,icon:d.icon,group:'Concessionárias',x:d.x,z:d.z,navX:d.entryX,navZ:d.entryZ,description:'Veículos expostos com preços, compra e entrega na sua garagem.'}))];};
  window.OTTHI_NEIGHBORHOOD={diagnostics:()=>({ready:neighborhoodDealers.ready,garage:{homeSlots:PLAYER_GARAGE_HOME_SLOTS,heavySlots:PLAYER_GARAGE_HEAVY_SLOTS,slots:{...state.vehicles.garage?.slots},owned:[...state.vehicles.owned]},dealers:neighborhoodDealers.stores.map(s=>({...s.dealer,stock:s.displays.map(d=>({id:d.entry.id,model:neighborhoodVehicleModel(d.entry),price:d.entry.price,...d.point,ready:d.ready,visible:d.host.visible,meshes:d.ready?(()=>{let n=0;d.host.traverse(o=>{if(o.isMesh)n++;});return n;})():0}))}))})};

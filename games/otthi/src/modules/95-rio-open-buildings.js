/** Accounts, furniture and services for the walkable city buildings. */
// @otthi-module-body
  function rioEnterPlace(target,onArrival){
    return beginCharacterActivity('rio-entry',{target,walkSpeed:2.8,onArrival:()=>{onArrival?.();updateContext(true);}});
  }

  function rioPropertyTitle(id){
    const properties=rioMapSave().properties??={};
    const existing=state.houses[id];
    const imported=id==='home'||(existing?.owned&&(!existing.ownerUid||existing.ownerUid===window.OTTHOS_RTDB?.uid));
    if(imported&&!properties[id])properties[id]={owned:true,locked:!!existing?.locked,adopted:true};
    return properties[id]||null;
  }

  function rioPropertyDoor({id,name,price,available,enter}){
    if(!available())return false;
    const property=rioPropertyTitle(id);
    const purchase=property?.owned?'':'<button class="btn good" data-rio-property-buy>Comprar por '+price+' moedas</button>';
    const lock=property?.owned?'<button class="btn" data-rio-property-lock>'+(property.locked?'Destrancar':'Trancar')+'</button>':'';
    openModal(name,'<p>'+(property?.owned?'Sua residência em Rio Preto.':'Visite a casa ou compre com moedas do jogo.')+
      '</p><div class="modal-actions"><button class="btn primary" data-rio-property-enter>'+(property?.owned?'Entrar':'Visitar')+'</button>'+purchase+lock+'</div>',root=>{
      root.querySelector('[data-rio-property-enter]').onclick=()=>{if(available()){closeModal();enter();}};
      root.querySelector('[data-rio-property-buy]')?.addEventListener('click',event=>{
        if(event.currentTarget.disabled||!available()||rioPropertyTitle(id)?.owned)return;
        if(state.profile.coins<price){toast('Moedas insuficientes.','warn',1900);return;}
        event.currentTarget.disabled=true;
        rioMapSave().properties[id]={owned:true,locked:false,paid:price,at:Date.now()};
        addCoins(-price);setFlag('boughtHouse');awardMedal('Nova Propriedade');saveState(true);
        rioPropertyDoor({id,name,price,available,enter});
      });
      root.querySelector('[data-rio-property-lock]')?.addEventListener('click',()=>{
        const title=rioPropertyTitle(id);if(!title?.owned||!available())return;
        title.locked=!title.locked;if(title.locked)setFlag('lockedHouse');saveState(true);
        rioPropertyDoor({id,name,price,available,enter});
      });
    });
    return true;
  }

  function rioResidenceDoor(site,room,target){
    const point={x:site.entry[0],z:site.entry[1]},available=()=>room.root.visible&&rioPlayerAt(point,3.3);
    return rioPropertyDoor({id:site.propertyId,name:site.name,price:site.price,available,enter:()=>{
      room.gate.disabled=true;room.door.visible=false;
      if(!rioEnterPlace(target,()=>{if(site.propertyId==='home')setFlag('enteredHome');})){
        room.gate.disabled=false;room.door.visible=true;
      }
    }});
  }

  function rioBuildResidence(site,room){
    const {w,d,yaw}=site,condominium=site.style==='rios-ditalia',modern=site.style==='damha'||condominium,back=-d/2+1.04,front=d/2-.12;
    room.collider(0,front,Math.min(3.1,w*.4)-.13,.18,2.5);
    room.gate=room.colliders.at(-1);
    const doorPoint=room.point(0,front);
    room.door=new THREE.Mesh(new THREE.BoxGeometry(Math.min(3.1,w*.4)-.15,2.5,.17),renderMat(modern?0x4a5a5a:0x8d593c));
    room.door.position.set(doorPoint.x,1.25,doorPoint.z);room.door.rotation.y=yaw;room.root.add(room.door);
    const bx=-w*.29;
    room.object(bx,.30,back+.24,1.48,.56,2.03,0x8a6b50);
    room.box(bx,.62,back+.13,1.37,.12,1.90,modern?0x7b979c:0xd3b88e);
    room.box(bx,.73,back-.45,1.20,.14,.48,0xf4e2c8);
    room.object(-w*.37,.92,.8,.49,1.84,1.26,0x876a51);
    const sx=w*.29;
    room.bench(sx,back-.15);
    room.box(sx,1.32,-.42,1.15,.62,.12,0x29424d);
    room.object(sx,.49,-.45,1.60,.98,.48,0x706459);
    room.box(0,.059,.05,w*.22,.022,1.35,modern?0x708c8e:0xa87659);
    if(modern){
      room.box(w*.31,.045,d/2+.71,w*.34,.074,1.53,0xb2afa4);
      room.box(w*.34,2.71,d/2+.52,w*.36,.21,1.06,0x657374);
    }else for(const x of [-w*.38,w*.38]){
      room.box(x,.23,d/2+.65,.91,.45,.72,0x99674d);
      room.part('canopy',x,.61,d/2+.65,.63,.58,.58,0x617e50);
    }

    if(condominium){
      // Apartment towers share the existing batched building renderer.
      // Only the furnished ground-floor unit is physically navigable at this stage.
      const colors=[0xd6cabe,0xcdc6b9,0xd8d6cb,0xc4d0cc,0xcac6bd,0xd8cfc5];
      const order=['rios_candelaro','rios_fiora','rios_salso','rios_fortore','rios_liri','rios_tanaro'];
      const tint=colors[Math.max(0,order.indexOf(site.key))];
      room.box(0,10.5,-d*.1,w*.70,14.5,d*.64,tint);
      for(let floor=0;floor<5;floor++){
        const y=5.15+floor*2.65;
        room.box(0,y-.95,d*.224,w*.72,.18,1.1,0xa8aba9);
        for(const dx of[-w*.24,-w*.08,w*.08,w*.24]){
          room.box(dx,y,d*.224+.055,w*.105,1.1,.09,0x52727a);
          room.box(dx,y-.64,d*.224+.09,w*.114,.12,.18,0x526467);
        }
        for(const side of[-1,1])room.box(side*w*.354,y,-d*.15,.08,1.12,d*.27,0x66878a);
      }
      room.box(0,17.92,-d*.1,w*.75,.25,d*.71,0x66767c);
      room.box(0,3.35,d*.34,w*.41,.19,2.3,0x6f8284);
      const point=room.point(0,d*.18);
      const porteiro=createNPC('porteiro-'+site.key,'Porteiro',point.x,point.z,0x456779,0);
      porteiro.stationary=true;porteiro.cityLifeManaged=true;room.root.add(porteiro.group);
      world.interactables=world.interactables.filter(action=>action.id!=='npc-'+porteiro.id);
      room.npcs=[porteiro];
      room.action('portaria','Conversar com o porteiro',0,d*.18,()=>{
        openModal('Portaria · '+site.name,
          '<p>Você pode conhecer o apartamento mobiliado, comprar sua unidade com moedas do jogo e usar o guarda-roupa.</p>'+
          '<div class="modal-actions"><button class="btn primary" data-portaria-wardrobe>Trocar roupas</button></div>',
          root=>{root.querySelector('[data-portaria-wardrobe]').onclick=openRioWardrobe;});
      },{inside:true,icon:'🏢',radius:2.1});
    }
    room.action('rest','Descansar na sala',sx,back+.65,()=>rioSitOnBench(site,room,sx,back-.15),{inside:true,icon:'🛋️'});
    const bedApproach=room.point(bx,back+1.78),bed=room.point(bx,back+.24);
    room.action('bed','Dormir na cama',bx,back+1.78,()=>beginCharacterActivity('bed',{
      target:bedApproach,pose:{...bed,y:.72,yaw,lying:true},commit:()=>{
        state.needs.energy=100;setFlag('slept');rioCountVisit(site);return true;
      }
    }),{inside:true,icon:'🛏️'});
    room.action('wardrobe','Usar o guarda-roupa',-w*.37+.92,.8,openRioWardrobe,{inside:true,icon:'👕'});

    // Native inventory/needs/save; each action works on the existing profile.
    room.box(-w*.32,.59,.25,1.46,.12,.74,0xbaa38b);
    room.box(-w*.32,.94,.25,.60,.58,.45,0xe0dfd7);
    room.action('kitchen','Cozinhar no apartamento',-w*.19,.85,()=>{
      if(Number(state.inventory.food||0)<1){toast('Compre alimentos no Mercadão para cozinhar.','info',2300);return;}
      state.inventory.food--;state.needs.hunger=clamp(Number(state.needs.hunger||0)+30,0,100);
      rioCountVisit(site);saveState(true);toast('Refeição preparada. Fome recuperada.','good',2000);
    },{inside:true,icon:'🍳'});
    room.box(w*.39,.7,1.85,.73,1.4,1.14,0xb7cfcc);
    room.action('bathroom','Tomar banho',w*.20,1.85,()=>{
      state.needs.hygiene=clamp(Number(state.needs.hygiene||0)+42,0,100);
      rioCountVisit(site);saveState(true);toast('Banho concluído. Higiene recuperada.','good',2000);
    },{inside:true,icon:'🚿'});
    room.action('tv','Assistir televisão',sx,back+.75,()=>{
      state.needs.fun=clamp(Number(state.needs.fun||0)+18,0,100);
      rioCountVisit(site);saveState(true);toast('Você descansou assistindo à TV.','good',2000);
    },{inside:true,icon:'📺'});
    room.action('home-entry','Ver propriedade',0,d*.24,()=>{
      const title=rioPropertyTitle(site.propertyId);
      toast(title?.owned?'Esta casa é sua.':'Residência disponível para compra na porta.','info',2100);
    },{inside:true,icon:'🔑'});
  }

  function rioBuildBakeryService(site,room,counterZ,x,z){
    const side=-site.w*.39;
    const points=[room.point(side,counterZ-.85),room.point(side,counterZ+1.04),room.point(side,z-.95),room.point(-x-.58,z-.95)];
    const npc=createNPC('rio-bakery-server','Garçonete',points[0].x,points[0].z,0xe6d6c6,0);
    npc.stationary=true;npc.cityLifeManaged=true;npc.group.name='RIO_BAKERY_SERVER';room.root.add(npc.group);
    world.interactables=world.interactables.filter(action=>action.id!=='npc-'+npc.id);
    room.npcs=[npc];
    const tray=new THREE.Group();tray.position.set(0,1.16,.62);npc.group.add(tray);
    campaignBox(tray,campaignMaterial(0xac7950),0,0,0,.65,.06,.43);
    campaignCylinder(tray,campaignMaterial(0xf6e9c9),.04,.09,.01,.16,.056);
    campaignCylinder(tray,campaignMaterial(0xe9d9a8),-.19,.119,0,.08,.13);
    tray.visible=false;
    room.server={npc,points,tray,index:0,direction:1,serving:false};
  }

  function rioUpdatePlaceService(site,room,dt){
    if(room.door&&!room.door.visible&&!room.forSite(player.x,player.z,2.8)&&!characterActivities.session){
      room.door.visible=true;room.gate.disabled=false;
    }
    const server=room.server;
    if(!server?.serving)return;
    const {npc,points,tray}=server,target=points[server.index],p=npc.group.position,distance=distance2D(p,target);
    if(distance>.08){
      const step=Math.min(distance,dt*1.45),dx=target.x-p.x,dz=target.z-p.z;
      p.x+=dx/distance*step;p.z+=dz/distance*step;npc.group.rotation.y=Math.atan2(dx,dz);
      poseResident(npc,'walk',performance.now()/1000);return;
    }
    if(server.direction===1&&server.index===points.length-1){
      tray.visible=false;server.direction=-1;
      if(rioMap.order?.site===site.id){room.servedDish.visible=true;toast('Pedido servido na mesa 1.','good',2500);}
    }else if(server.direction===-1&&server.index===0){server.serving=false;server.direction=1;return;}
    server.index+=server.direction;
  }

  function rioWardrobeShop(site,room,counter,slot){
    if(!rioPlayerAt(counter))return false;
    const choices=Object.entries(RIO_WARDROBE_CATALOG).filter(([kind])=>slot===kind).flatMap(([,items])=>items).filter(([id])=>RIO_WARDROBE_STORE[id]);
    openModal(slot==='shoes'?'Loja de calçados':'Loja de roupas','<div class="choice-grid">'+choices.map(([id,label])=>
      '<button class="choice" data-rio-clothing-buy="'+id+'" '+(rioWardrobeHasItem(id)?'disabled':'')+'><b>'+label+'</b><span>'+
      (rioWardrobeHasItem(id)?'No guarda-roupa':RIO_WARDROBE_STORE[id]+' moedas')+'</span></button>').join('')+
      '</div><div class="modal-actions"><button class="btn" data-rio-clothing-try>Provar em Thiago ou Thamis</button><button class="btn" data-rio-custom-avatar>Criar meu personagem</button></div>',root=>{
        for(const button of root.querySelectorAll('[data-rio-clothing-buy]'))button.onclick=()=>{
          const id=button.dataset.rioClothingBuy,price=RIO_WARDROBE_STORE[id];
          if(!price||button.disabled||rioWardrobeHasItem(id)||!room.root.visible||!rioPlayerAt(counter))return;
          if(state.profile.coins<price){toast('Moedas insuficientes.','warn',2100);return;}
          button.disabled=true;(rioMapSave().wardrobePurchases??={})[id]=true;
          addCoins(-price);rioCountVisit(site);rioWardrobeShop(site,room,counter,slot);
        };
        root.querySelector('[data-rio-clothing-try]').onclick=()=>openRioWardrobe();
        root.querySelector('[data-rio-custom-avatar]').onclick=openAvatarStudio;
      });
    return true;
  }

  function rioBuildShopping(site,room){
    const x=site.w*.28,z=site.d*.15,w=Math.min(5.5,site.w*.24);
    for(const [index,title,slot] of [[-1,'MODA', 'top'],[1,'CALÇADOS','shoes']]){
      const counter=rioCounter(room,index*x,z,w,index<0?0x76516a:0x4d677f);
      room.sign(title,index*x,2.52,z-.38,w,.45,index<0?'#69445d':'#395569');
      for(let n=-1;n<=1;n++){
        room.object(index*x+n*1.49,.68,z-2.3,1.27,1.35,.66,0xb2a496);
        if(slot==='top'){
          room.box(index*x+n*1.49,1.63,z-2.3,.56,.60,.19,[0x557b78,0xb1879c,0x94724e][n+1]);
        }else for(const dx of [-.17,.17])room.box(index*x+n*1.49+dx,1.42,z-2.3,.25,.16,.43,0x394e67);
      }
      room.action('store-'+slot,slot==='top'?'Entrar na loja de roupas':'Entrar na sapataria',index*x,z+1.02,
        ()=>rioWardrobeShop(site,room,counter,slot),{inside:true,icon:slot==='top'?'👕':'👟'});
    }
    rioBuildMarket(site,room);
  }

  function rioBuildOilShop(site,room){
    const {w,d,yaw}=site,bay=room.point(0,-.55);
    room.box(0,.035,0,w,.07,d,0x636c6e);
    for(const side of [-1,1]){
      room.object(side*(w/2-.2),2.1,0,.35,4.2,d,0xc9c6b1);
      room.box(side*1.43,.08,.56,.1,.06,5.35,0xecc64d);
      room.object(side*w*.32,.54,-d*.29,1.5,1.08,.73,0x4e6773);
    }
    room.object(0,2.07,-d/2+.16,w,4.14,.32,0xa8b1a9);
    room.box(0,4.29,0,w+.18,.28,d,0x3d554f);
    room.sign('CACHOEIRA · SUPER TROCA DE ÓLEO',0,3.91,d/2+.1,w-.42,.45,'#315c4c');
    room.action('oil','Revisar motor e trocar óleo',0,-.55,()=>{
      const vehicle=currentVehicleRef();
      const valid=()=>player.vehicle&&rioOwnedRoadVehicle(vehicle)&&currentVehicleRef()===vehicle&&Math.abs(player.car.speed)<.4&&distance2D(player,bay)<2.3;
      if(!valid()){toast('Pare seu carro dentro da baia demarcada.','info',2100);return false;}
      const record=workshopComponentRecord(vehicle);
      if(record.parts.engine>=100){toast('O motor está revisado.','good',1900);return false;}
      openModal(site.name,'<p>Troca de óleo e revisão do motor por 12 moedas.</p><button class="btn primary" data-rio-oil-confirm>Confirmar revisão</button>',root=>{
        root.querySelector('[data-rio-oil-confirm]').onclick=event=>{
          if(event.currentTarget.disabled||!valid()||record.parts.engine>=100||state.profile.coins<12)return;
          event.currentTarget.disabled=true;record.parts.engine=Math.min(100,record.parts.engine+18);
          const durability=Math.max(vehicleDurabilityV704(vehicle),workshopPartsOverall(record.parts));
          setVehicleDurabilityV704(vehicle,durability,'revisao-de-oleo');record.lastDurability=durability;
          addCoins(-12);rioCountVisit(site);closeModal();toast('Revisão registrada no veículo.','good',2200);
        };
      });
    },{vehicleOnly:true,icon:'🛠️',radius:2.3});
  }

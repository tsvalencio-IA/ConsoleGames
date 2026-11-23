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

  function rioPropertyDoor({id,name,price,available,enter,decorate}){
    if(!available())return false;
    const property=rioPropertyTitle(id);
    const purchase=property?.owned?'':'<button class="btn good" data-rio-property-buy>Comprar por '+price+' moedas</button>';
    const lock=property?.owned?'<button class="btn" data-rio-property-lock>'+(property.locked?'Destrancar':'Trancar')+'</button>':'';
    const decoration=property?.owned&&decorate?'<button class="btn" data-rio-property-decor>Decorar minha casa</button>':'';
    openModal(name,'<p>'+(property?.owned?'Sua residência em Rio Preto.':'Visite a casa ou compre com moedas do jogo.')+
      '</p><div class="modal-actions"><button class="btn primary" data-rio-property-enter>'+(property?.owned?'Entrar e morar':'Visitar')+'</button>'+purchase+lock+decoration+'</div>',root=>{
      root.querySelector('[data-rio-property-enter]').onclick=()=>{if(available()){closeModal();enter();}};
      root.querySelector('[data-rio-property-buy]')?.addEventListener('click',event=>{
        if(event.currentTarget.disabled||!available()||rioPropertyTitle(id)?.owned)return;
        if(state.profile.coins<price){toast('Moedas insuficientes.','warn',1900);return;}
        event.currentTarget.disabled=true;
        rioMapSave().properties[id]={owned:true,locked:false,paid:price,at:Date.now()};
        addCoins(-price);setFlag('boughtHouse');awardMedal('Nova Propriedade');saveState(true);
        rioPropertyDoor({id,name,price,available,enter,decorate});
      });
      root.querySelector('[data-rio-property-decor]')?.addEventListener('click',()=>{
        if(!available()||!rioPropertyTitle(id)?.owned||typeof decorate!=='function')return;
        closeModal();decorate();
      });
      root.querySelector('[data-rio-property-lock]')?.addEventListener('click',()=>{
        const title=rioPropertyTitle(id);if(!title?.owned||!available())return;
        title.locked=!title.locked;if(title.locked)setFlag('lockedHouse');saveState(true);
        rioPropertyDoor({id,name,price,available,enter,decorate});
      });
    });
    return true;
  }

  function rioResidenceDoor(site,room,target){
    const point={x:site.entry[0],z:site.entry[1]},available=()=>room.root.visible&&rioPlayerAt(point,3.3);
    const enterUnit=(onArrival)=>{
      room.gate.disabled=true;room.door.visible=false;
      room.refreshDecor?.();
      if(!rioEnterPlace(target,()=>{if(site.propertyId==='home')setFlag('enteredHome');onArrival?.();})){
        room.gate.disabled=false;room.door.visible=true;
      }
    };
    if(site.style!=='rios-ditalia'){
      room.selectedUnitId=site.propertyId;
      return rioPropertyDoor({id:site.propertyId,name:site.name,price:site.price,available,
        decorate:()=>enterUnit(()=>room.manageFurniture?.()),enter:enterUnit});
    }
    // Unit 101 reuses the original property ID to preserve ownership saves.
    const unitId=number=>number==='101'?site.propertyId:site.propertyId+'-unit-'+number;
    const units=[];
    // The exterior already renders five levels with four window bays each.
    for(let floor=1;floor<=5;floor++)for(let door=1;door<=4;door++){
      const number=String(floor)+'0'+String(door);
      units.push({number,id:unitId(number),floor});
    }
    openModal('Apartamentos · '+site.name,
      '<p>Escolha a unidade para visitar, comprar ou decorar. Cada apartamento tem seus próprios móveis e progresso.</p>'+
      '<div class="choice-grid">'+units.map(u=>{
        const owned=rioPropertyTitle(u.id)?.owned;
        return '<button class="choice" data-rio-apartment="'+u.number+'"><b>Apartamento '+u.number+
          '</b><span>'+ (owned?'Sua propriedade':Math.round(site.price*(.80+u.floor*.10))+' moedas')+
          ' · '+u.floor+'º andar</span></button>';
      }).join('')+'</div>',root=>{
      for(const button of root.querySelectorAll('[data-rio-apartment]'))button.onclick=()=>{
        const unit=units.find(u=>u.number===button.dataset.rioApartment);
        if(!unit||!available())return;
        room.selectedUnitId=unit.id;room.refreshDecor?.();
        rioPropertyDoor({id:unit.id,name:site.name+' · Apartamento '+unit.number,
          price:Math.round(site.price*(.80+unit.floor*.10)),available,
          decorate:()=>enterUnit(()=>room.manageFurniture?.()),enter:enterUnit});
      };
    });
    return true;
  }

  function rioBuildResidence(site,room){
    const rioResidencePropertyId=()=>room.selectedUnitId||site.propertyId;
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


    if(modern){
      // Private leisure area on the original property lot; no global water or
      // house identity is replaced, and it allocates no animated reflection pass.
      const px=w*.30,pz=d*.38,pw=Math.min(4.6,w*.30),pd=Math.min(3.3,d*.24);
      room.box(px,.065,pz,pw+.38,.13,pd+.38,0xe8ddcc);
      room.box(px,.075,pz,pw,.04,pd,0x3993b6);
      room.box(px,.12,pz-pd*.48,pw,.045,.10,0xa3dde3);
      for(const side of[-1,1]){
        room.box(px+side*(pw/2+.14),.36,pz-pd*.34,.07,.72,.07,0xc5cacc);
      }
      const approach=room.point(px-pw*.44,pz-pd*.55),water=room.point(px,pz);
      room.action('swimming-pool','Entrar na piscina da residência',px-pw*.44,pz-pd*.55,()=>{
        return beginCharacterActivity('rio-pool',{
          target:approach,pose:{...water,y:.37,yaw:site.yaw,lying:true},walkSpeed:1.8,
          commit:()=>{
            state.needs.fun=clamp(Number(state.needs.fun||0)+27,0,100);
            state.needs.hygiene=clamp(Number(state.needs.hygiene||0)+6,0,100);
            rioCountVisit(site);saveState(true);updateHUD();return true;
          }
        });
      },{inside:true,icon:'🏊',radius:2.2});
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


    // OT Home Life: ownership, owned item library, positions, rotation and storage
    // are part of the existing unit or residence property record.
    // Keep the original six IDs and saved furniture arrays compatible.
    const furnishings=[
      {id:'tapete',name:'Tapete decorativo',price:35,type:'rug',color:0x73928c,x:-w*.06,z:-.68,w:1.56,d:1.24},
      {id:'luminaria',name:'Luminária de piso',price:65,type:'lamp',color:0xd9bb8e,x:w*.36,z:-d*.27,w:.35,d:.35},
      {id:'quadro',name:'Quadro moderno',price:48,type:'picture',color:0xb17c64,x:w*.25,z:-d*.38,w:1.45,d:.16},
      {id:'aparador',name:'Aparador de madeira',price:75,type:'cabinet',color:0x865b45,x:-w*.35,z:-d*.1,w:1.18,d:.40},
      {id:'estante',name:'Estante de livros',price:110,type:'bookshelf',color:0xbda27c,x:-w*.43,z:-d*.26,w:.52,d:1.35},
      {id:'planta',name:'Vaso decorativo',price:25,type:'plant',color:0x658c5f,x:w*.37,z:-d*.36,w:.44,d:.44},
      {id:'sofa-modular',name:'Sofá modular',price:180,type:'sofa',color:0x758d8c,x:-w*.1,z:-d*.1,w:2.3,d:1.04},
      {id:'poltrona',name:'Poltrona estofada',price:85,type:'armchair',color:0xb67b65,x:w*.2,z:-d*.15,w:.94,d:.91},
      {id:'mesa-jantar',name:'Mesa de jantar',price:155,type:'table',color:0x9d7952,x:-w*.08,z:d*.04,w:1.75,d:1.16},
      {id:'cadeira-madeira',name:'Cadeira para sala',price:45,type:'chair',color:0x9b7152,x:w*.12,z:d*.05,w:.58,d:.59},
      {id:'cama-casal',name:'Cama de casal',price:210,type:'bed',color:0x8d7a6c,x:-w*.12,z:-d*.22,w:2.1,d:2.03},
      {id:'guarda-roupa',name:'Guarda-roupa de casal',price:190,type:'wardrobe',color:0xac9477,x:-w*.34,z:-d*.24,w:1.7,d:.66},
      {id:'mesa-escritorio',name:'Mesa de escritório',price:110,type:'desk',color:0x97745b,x:w*.17,z:-d*.22,w:1.45,d:.68},
      {id:'computador',name:'Computador',price:220,type:'computer',color:0x3e5867,x:w*.22,z:-d*.30,w:.68,d:.40},
      {id:'tv-premium',name:'Televisão grande',price:260,type:'tv',color:0x324b5a,x:w*.21,z:-d*.39,w:1.7,d:.15},
      {id:'geladeira',name:'Geladeira inox',price:155,type:'fridge',color:0xc2cbd0,x:-w*.34,z:d*.12,w:.75,d:.72},
      {id:'bancada',name:'Bancada de cozinha',price:135,type:'counter',color:0xc4b3a0,x:-w*.28,z:d*.23,w:1.68,d:.66},
      {id:'churrasqueira',name:'Churrasqueira compacta',price:145,type:'grill',color:0x6b7276,x:w*.32,z:d*.31,w:1.06,d:.76},
      {id:'espreguicadeira',name:'Espreguiçadeira da piscina',price:90,type:'lounger',color:0xe2cfa5,x:w*.16,z:d*.24,w:.64,d:1.42},
      {id:'vaso-flores',name:'Flores para decoração',price:30,type:'flowers',color:0xd88b90,x:w*.32,z:-d*.22,w:.35,d:.35}
    ];
    const byId=new Map(furnishings.map(item=>[item.id,item])),decorMeshes=new Map();
    const addDecorModel=item=>{
      const group=new THREE.Group();
      group.name='CASA_MOVEIS_'+site.key+'_'+item.id;
      const part=(ww,hh,dd,color,xx=0,yy=0,zz=0)=>{
        const mesh=new THREE.Mesh(new THREE.BoxGeometry(ww,hh,dd),renderMat(color,{roughness:.78}));
        mesh.position.set(xx,yy,zz);mesh.castShadow=false;group.add(mesh);return mesh;
      };
      const W=item.w,D=item.d,C=item.color;
      if(item.type==='rug')part(W,.04,D,C,0,.08,0);
      else if(item.type==='lamp'){
        part(.13,1.55,.13,0x7e8580,0,.83,0);part(.62,.36,.62,C,0,1.64,0);part(.48,.08,.48,0x6f746d,0,.07,0);
      }else if(item.type==='picture'){
        part(W,.92,.06,0xb49a75,0,1.88,0);part(W-.17,.75,.075,C,0,1.88,.035);
      }else if(item.type==='cabinet'||item.type==='counter'){
        part(W,item.type==='counter'?.89:1.12,D,C,0,item.type==='counter'?.47:.59,0);
        part(W+.07,.08,D+.07,0xd4cbb8,0,item.type==='counter'?.95:1.16,0);
        for(const x of[-W*.22,W*.22])part(.085,.09,.05,0x404b50,x,.62,D/2+.03);
      }else if(item.type==='bookshelf'||item.type==='wardrobe'){
        part(W,2.18,D,C,0,1.10,0);
        for(const y of [.5,1.06,1.62])part(W-.14,.055,D+.08,0xe8cba1,0,y,0);
        if(item.type==='bookshelf')for(let i=0;i<12;i++){
          const x=-W*.39+(i%4)*W*.26,y=.69+Math.floor(i/4)*.57;
          part(.10,.25+.06*(i%3),.12,[0x587c86,0xb16e54,0x6a855d][i%3],x,y,D/2+.06);
        }
      }else if(['sofa','armchair','chair'].includes(item.type)){
        const seatY=item.type==='chair'?.48:.43;
        part(W,.30,D,C,0,seatY,0);part(W,.73,.22,C,0,seatY+.48,-D*.40);
        for(const side of[-1,1])if(item.type!=='chair')part(.18,.45,D,C,side*(W/2-.09),seatY+.18,0);
        for(const x of[-W*.32,W*.32])part(.09,.35,.10,0x554c43,x,.2,-D*.25);
      }else if(['table','desk'].includes(item.type)){
        part(W,.12,D,C,0,.83,0);
        for(const x of[-W*.4,W*.4])for(const z of[-D*.35,D*.35])part(.10,.79,.10,0x705a4a,x,.42,z);
      }else if(item.type==='bed'||item.type==='lounger'){
        const baseY=item.type==='bed'?.45:.30;
        part(W,.35,D,C,0,baseY,0);
        part(W-.14,.16,D-.14,item.type==='bed'?0xe8dfcf:0xc5d9ce,0,baseY+.25,0);
        part(W,.74,.18,0x8c6954,0,baseY+.25,-D/2+.08);
        if(item.type==='bed')for(const x of[-W*.23,W*.23])part(W*.4,.16,D*.18,0xffffff,x,baseY+.43,-D*.28);
      }else if(item.type==='tv'||item.type==='computer'){
        part(W,item.type==='computer'?.64:.95,.08,0x26363c,0,item.type==='computer'?1.19:1.75,0);
        part(W-.13,item.type==='computer'?.50:.80,.03,C,0,item.type==='computer'?1.19:1.75,.045);
        part(.11,.55,.09,0x56656a,0,item.type==='computer'?.72:1.22,0);
      }else if(item.type==='fridge'){
        part(W,1.92,D,C,0,.99,0);part(W,.06,.06,0x778b93,0,1.39,D/2+.025);
        part(.07,.32,.10,0x566773,-W*.34,1.22,D/2+.08);
      }else if(item.type==='grill'){
        part(W,.70,D,0x777a75,0,.56,0);part(W,.13,D,0x252c2b,0,.95,0);
        for(const x of[-W*.33,W*.33])part(.13,.68,.13,0x4e5555,x,.32,0);
      }else if(item.type==='plant'||item.type==='flowers'){
        part(.38,.49,.38,0xa78764,0,.25,0);
        part(.52,.59,.52,C,0,.76,0);
        if(item.type==='flowers')for(const x of[-.17,0,.17])part(.13,.16,.13,0xe5b0aa,x,1.05,.07);
      }else part(W,1,D,C,0,.55,0);
      room.root.add(group);decorMeshes.set(item.id,group);
      return group;
    };
    const layoutFor=(item,owner)=>{
      const p=owner?.decorLayout?.[item.id]||{};
      const limX=Math.max(.25,w/2-item.w/2-.53),limZ=Math.max(.25,d/2-item.d/2-1.10);
      return {
        x:clamp(Number.isFinite(p.x)?p.x:item.x,-limX,limX),
        z:clamp(Number.isFinite(p.z)?p.z:item.z,-limZ,limZ),
        rotation:Number.isInteger(p.rotation)?((p.rotation%4)+4)%4:0,
        stored:!!p.stored
      };
    };
    const updateDecor=()=>{
      const owner=rioPropertyTitle(rioResidencePropertyId());
      const owned=new Set(owner?.furniture||[]);
      for(const item of furnishings){
        const existing=decorMeshes.get(item.id);
        if(!owned.has(item.id)){if(existing)existing.visible=false;continue;}
        const pos=layoutFor(item,owner),group=existing||addDecorModel(item),point=room.point(pos.x,pos.z);
        group.visible=!pos.stored;group.position.set(point.x,0,point.z);
        group.rotation.y=yaw+pos.rotation*Math.PI/2;
      }
    };
    updateDecor();
    room.refreshDecor=updateDecor;
    const openDecorCatalog=()=>{
      const owner=rioPropertyTitle(rioResidencePropertyId());
      if(!owner?.owned){toast('Primeiro compre esta residência.','info',2300);return;}
      const owned=new Set(owner.furniture||[]);
      openModal('Minha casa · móveis e decoração',
        '<p>Compre móveis com moedas do jogo, escolha a posição, gire e guarde peças. Suas escolhas ficam salvas nesta residência.</p>'+
        '<p><b>'+owned.size+' de '+furnishings.length+' itens adquiridos</b></p><div class="choice-grid">'+
        furnishings.map(item=>'<button class="choice" data-rio-decor-item="'+item.id+'"><b>'+item.name+'</b><span>'+
          (owned.has(item.id)?'Editar posição e rotação':item.price+' moedas')+'</span></button>').join('')+'</div>',root=>{
        for(const button of root.querySelectorAll('[data-rio-decor-item]'))button.onclick=()=>{
          const item=byId.get(button.dataset.rioDecorItem);
          if(!item)return;
          const current=rioPropertyTitle(rioResidencePropertyId());
          if(!current?.owned)return;
          if(!(current.furniture||[]).includes(item.id)){
            if(Number(state.profile.coins)<item.price){toast('Moedas insuficientes.','warn',1800);return;}
            button.disabled=true;(current.furniture??=[]).push(item.id);
            addCoins(-item.price);saveState(true);updateDecor();
          }
          openDecorEditor(item);
        };
      });
    };

    // Real-time furniture preview lives over the scene, never in a full-screen modal.
    let activeDecor=null,decorOverlay=null,decorSelection=null;
    const endDecor=()=>{
      activeDecor=null;
      if(decorOverlay){decorOverlay.remove();decorOverlay=null;}
      if(decorSelection){decorSelection.parent?.remove(decorSelection);decorSelection.geometry.dispose();decorSelection.material.dispose();decorSelection=null;}
      delete window.__OTTHI_DECOR_PREVIEW;
      document.body.classList.remove('rio-decor-active');
    };
    const openDecorEditor=item=>{
      const owner=rioPropertyTitle(rioResidencePropertyId());
      if(!owner?.owned||!(owner.furniture||[]).includes(item.id))return;
      endDecor();
      if(!els.modal.hidden)closeModal();
      const original=layoutFor(item,owner);
      activeDecor={item,original,position:{...original}};
      const bound=pos=>{
        const wx=Math.max(.25,w/2-item.w/2-.53),wz=Math.max(.25,d/2-item.d/2-1.10);
        return {x:clamp(pos.x,-wx,wx),z:clamp(pos.z,-wz,wz),rotation:((pos.rotation%4)+4)%4,stored:!!pos.stored};
      };
      decorSelection=new THREE.Mesh(new THREE.RingGeometry(.71,1.01,32),
        new THREE.MeshBasicMaterial({color:0xffdc62,side:THREE.DoubleSide,transparent:true,opacity:.94,depthTest:false}));
      decorSelection.rotation.x=-Math.PI/2;decorSelection.renderOrder=999;room.root.add(decorSelection);
      const refresh=()=>{
        if(!activeDecor)return;
        activeDecor.position=bound(activeDecor.position);
        const p=activeDecor.position,worldPoint=room.point(p.x,p.z);
        const object=decorMeshes.get(item.id)||addDecorModel(item);
        object.visible=!p.stored;object.position.set(worldPoint.x,0,worldPoint.z);
        object.rotation.y=yaw+p.rotation*Math.PI/2;
        decorSelection.position.set(worldPoint.x,.12,worldPoint.z);
        decorSelection.visible=!p.stored;
        window.__OTTHI_DECOR_PREVIEW={siteId:site.id,propertyId:rioResidencePropertyId(),
          x:worldPoint.x,z:worldPoint.z,yaw,centerX:site.x,centerZ:site.z,roomWidth:w,roomDepth:d};
        const status=decorOverlay.querySelector('[data-rio-editor-status]');
        if(status)status.textContent='Posição '+p.x.toFixed(1)+' / '+p.z.toFixed(1)+
          ' · '+p.rotation*90+'°'+(p.stored?' · Guardado':'');
      };
      if(!document.getElementById('rio-decor-live-css')){
        const style=document.createElement('style');style.id='rio-decor-live-css';
        style.textContent=[
          '#rio-decor-live{position:fixed;z-index:1250;top:max(8px,env(safe-area-inset-top,0px));right:max(8px,env(safe-area-inset-right,0px));width:min(267px,39vw);max-height:calc(100dvh - 20px);box-sizing:border-box;overflow:auto;border-radius:13px;border:1px solid #a2c4bd;background:rgba(5,25,32,.88);color:#fff;padding:10px;box-shadow:0 7px 25px rgba(0,0,0,.35);font:600 12px system-ui,sans-serif;touch-action:pan-y;pointer-events:auto}',
          '#rio-decor-live strong{display:block;overflow-wrap:anywhere;font-size:13px;margin-bottom:4px}',
          '#rio-decor-live p{font-size:11px;font-weight:400;margin:4px 0;color:#d3e9eb}',
          '#rio-decor-live .rio-editor-buttons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}',
          '#rio-decor-live button{font:700 12px system-ui,sans-serif;min-height:38px;padding:4px;border:1px solid #73949c;border-radius:8px;color:#fff;background:#245062;cursor:pointer}',
          '#rio-decor-live button[data-rio-live=save]{background:#237451}',
          '#rio-decor-live button[data-rio-live=cancel]{background:#873e40}',
          '#rio-decor-live [data-rio-editor-status]{color:#c3ebed;font-size:11px;padding:5px 0}',
          '@media(max-width:650px){#rio-decor-live{width:min(202px,49vw);padding:6px;top:max(4px,env(safe-area-inset-top,0px));right:max(4px,env(safe-area-inset-right,0px))}#rio-decor-live strong{font-size:11px}#rio-decor-live p{display:none}#rio-decor-live button{font-size:11px;min-height:34px;padding:2px}}',
          '@media(orientation:landscape) and (max-height:480px){#rio-decor-live{width:min(265px,32vw);max-height:calc(100dvh - 8px);top:4px}#rio-decor-live .rio-editor-buttons{grid-template-columns:repeat(4,minmax(0,1fr))}#rio-decor-live button{min-height:31px}}'
        ].join('');
        document.head.appendChild(style);
      }
      decorOverlay=document.createElement('section');decorOverlay.id='rio-decor-live';
      decorOverlay.setAttribute('role','region');
      decorOverlay.setAttribute('aria-label','Decoração em tempo real com a casa visível');
      const title=document.createElement('strong');title.textContent='Decorar · '+item.name;
      const help=document.createElement('p');help.textContent='Mova e gire observando o ambiente 3D ao vivo.';
      const status=document.createElement('div');status.dataset.rioEditorStatus='';status.className='rio-editor-status';
      const controls=document.createElement('div');controls.className='rio-editor-buttons';
      for(const [id,label] of [['up','↑'],['rotate','↻ 90°'],['store','Guardar'],
        ['left','←'],['down','↓'],['right','→'],['save','✓ Salvar'],
        ['cancel','✕ Cancelar'],['catalog','Móveis']]){
        const button=document.createElement('button');button.type='button';button.dataset.rioLive=id;
        button.textContent=label;controls.appendChild(button);
      }
      decorOverlay.append(title,help,status,controls);document.body.appendChild(decorOverlay);
      document.body.classList.add('rio-decor-active');
      for(const type of ['pointerdown','pointerup','click','touchstart','touchend'])
        decorOverlay.addEventListener(type,e=>e.stopPropagation());
      controls.addEventListener('click',e=>{
        const type=e.target.closest('button')?.dataset.rioLive;
        if(!type||!activeDecor)return;
        if(type==='save'){
          const current=rioPropertyTitle(rioResidencePropertyId());
          if(!current?.owned||(current.furniture||[]).indexOf(item.id)<0){endDecor();updateDecor();return;}
          (current.decorLayout??={})[item.id]={...activeDecor.position};
          endDecor();updateDecor();saveState(true);
          toast(item.name+' posicionado e salvo.','good',2100);return;
        }
        if(type==='cancel'){endDecor();updateDecor();return;}
        if(type==='catalog'){endDecor();updateDecor();openDecorCatalog();return;}
        const p=activeDecor.position;
        if(type==='left')p.x-=.55;
        if(type==='right')p.x+=.55;
        if(type==='up')p.z-=.55;
        if(type==='down')p.z+=.55;
        if(type==='rotate')p.rotation=(p.rotation+1)%4;
        if(type==='store')p.stored=!p.stored;
        refresh();
      });
      refresh();
    };

    // Real use for construction purchases: one delivered paint can renovates the
    // wall finish; one box of flooring renovates the interior floor.
    // Upgrades are per-property, have no extra draw calls until purchased,
    // and are preserved in the same save as ownership and furniture.
    const renovationColors=Object.freeze({
      walls:[0xe9ddc9,0xb9d0ce,0xd9c8b4,0xd8d0df],
      floor:[0xc7a884,0xa0a7a5,0x8f795d,0xd7cfba]
    });
    const renovateMeshes={};
    const renovationFinish=(kind)=>{
      const owner=rioPropertyTitle(rioResidencePropertyId());
      const finish=owner?.renovation?.[kind];
      if(!Number.isInteger(finish))return;
      const palette=renovationColors[kind];
      const value=palette[((finish%palette.length)+palette.length)%palette.length];
      if(!renovateMeshes[kind]){
        const group=new THREE.Group(),makePanel=(xx,yy,zz,ww,hh,dd)=>{
          const mesh=new THREE.Mesh(new THREE.BoxGeometry(ww,hh,dd),
            new THREE.MeshStandardMaterial({color:value,roughness:.83,metalness:0}));
          mesh.position.set(xx,yy,zz);group.add(mesh);
        };
        if(kind==='floor')makePanel(0,.091,0,w-.69,.024,d-.68);
        else{
          makePanel(0,1.45,-d/2+.36,w-.82,2.76,.045);
          for(const x of[-w/2+.35,w/2-.35])makePanel(x,1.45,0,.045,2.76,d-.82);
        }
        group.position.set(site.x,0,site.z);group.rotation.y=yaw;
        group.name='CASA_REFORMA_'+site.key+'_'+kind;
        room.root.add(group);renovateMeshes[kind]=group;
      }
      for(const mesh of renovateMeshes[kind].children)mesh.material.color.setHex(value);
    };
    renovationFinish('walls');renovationFinish('floor');
    const openRenovation=()=>{
      const owner=rioPropertyTitle(rioResidencePropertyId());
      if(!owner?.owned){toast('Só o proprietário pode reformar esta casa.','warn',2200);return;}
      const inventory=rioConstructionSave().constructionInventory;
      openModal('Reformar imóvel · '+site.name,
        '<p>Os materiais precisam ser comprados nas lojas de Rio Preto e recebidos neste endereço.</p>'+
        '<p>Estoque: <b>'+Number(inventory.paint||0)+' lata(s) de tinta</b> · <b>'+
        Number(inventory.tile||0)+' caixa(s) de piso</b></p>'+
        '<div class="choice-grid">'+
        renovationColors.walls.map((color,index)=>'<button class="choice" data-rio-home-wall="'+index+'"><b>Cor das paredes '+(index+1)+'</b><span>1 tinta</span></button>').join('')+
        renovationColors.floor.map((color,index)=>'<button class="choice" data-rio-home-floor="'+index+'"><b>Piso '+(index+1)+'</b><span>1 caixa de piso</span></button>').join('')+
        '</div>',root=>{
          const apply=(kind,index)=>{
            const current=rioPropertyTitle(rioResidencePropertyId()),saved=rioConstructionSave().constructionInventory;
            const item=kind==='walls'?'paint':'tile';
            if(!current?.owned||!(saved[item]>0)){toast('Receba primeiro o material de construção.','warn',2400);return;}
            saved[item]--;
            (current.renovation??={})[kind]=index;
            renovationFinish(kind);saveState(true);
            toast('Reforma aplicada e salva nesta propriedade.','good',2000);
            openRenovation();
          };
          for(const button of root.querySelectorAll('[data-rio-home-wall]'))button.onclick=()=>{
            apply('walls',Number(button.dataset.rioHomeWall));};
          for(const button of root.querySelectorAll('[data-rio-home-floor]'))button.onclick=()=>{
            apply('floor',Number(button.dataset.rioHomeFloor));};
        });
    };
    room.manageRenovation=openRenovation;
    room.action('renovate','Reformar paredes e piso com materiais entregues',w*.04,d*.22,openRenovation,{inside:true,icon:'🧱'});
    room.manageFurniture=openDecorCatalog;
    room.action('decor','Comprar, posicionar e decorar a casa',0,.8,openDecorCatalog,{inside:true,icon:'🪑'});

    // Usable purchased furniture. Actions track moved items, so changing their
    // coordinates never leaves a phantom interaction at the old location.
    const furnitureAction={sofa:'sofa',armchair:'sofa',chair:'sofa',lounger:'sofa',
      bed:'bed',tv:'tv',computer:'tv',table:'eat',fridge:'eat',grill:'cook',
      desk:'sofa',bookshelf:'sofa'};
    for(const item of furnishings){
      const activity=furnitureAction[item.type];
      if(!activity)continue;
      const currentPlacement=()=>layoutFor(item,rioPropertyTitle(rioResidencePropertyId()));
      const position=()=>{const p=currentPlacement();return room.point(p.x,p.z);};
      registerInteractable({
        id:site.id+'-furniture-use-'+item.id,type:'activity',
        label:'Usar · '+item.name,icon:activity==='bed'?'🛏️':activity==='cook'?'🍳':
          activity==='eat'?'🍽️':activity==='tv'?'📺':'🛋️',
        radius:2.05,priority:246,getPos:position,
        available:()=>room.root.visible&&!player.vehicle&&!player.boating&&
          !player.swimming&&!characterActivities.session&&
          room.forSite(player.x,player.z,-.38)&&
          !!rioPropertyTitle(rioResidencePropertyId())?.furniture?.includes(item.id)&&
          !currentPlacement().stored,
        action:()=>{
          if((activity==='cook'||activity==='eat')&&Number(state.inventory.food||0)<1){
            toast('Você precisa comprar alimentos antes.','info',2000);return;
          }
          const p=currentPlacement(),center=room.point(p.x,p.z);
          const target=room.point(p.x,p.z+Math.min(item.d/2+.45,1.18));
          const sitting=['sofa','tv','eat'].includes(activity);
          beginCharacterActivity(activity,{target,pose:{...center,y:activity==='bed'?.74:.55,
            yaw:yaw+p.rotation*Math.PI/2,sitting,lying:activity==='bed'},
            commit:()=>{
              if((activity==='cook'||activity==='eat')&&Number(state.inventory.food||0)<1)return false;
              if(activity==='bed')state.needs.energy=100;
              if(activity==='sofa'){
                state.needs.energy=clamp(Number(state.needs.energy||0)+12,0,100);
                state.needs.fun=clamp(Number(state.needs.fun||0)+14,0,100);
              }
              if(activity==='tv')state.needs.fun=clamp(Number(state.needs.fun||0)+28,0,100);
              if(activity==='eat'||activity==='cook'){
                state.inventory.food--;
                state.needs.hunger=clamp(Number(state.needs.hunger||0)+(activity==='cook'?55:34),0,100);
              }
              rioCountVisit(site);saveState(true);updateHUD();return true;
            }});
        }
      });
    }
    room.action('home-entry','Ver propriedade',0,d*.24,()=>{
      const title=rioPropertyTitle(rioResidencePropertyId());
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
    const choices=Object.entries(RIO_WARDROBE_CATALOG).filter(([kind])=>slot==='top'?kind!=='shoes':kind==='shoes').flatMap(([kind,items])=>items.map(item=>[...item,kind])).filter(([id])=>RIO_WARDROBE_STORE[id]);
    openModal(slot==='shoes'?'Loja de calçados':'Loja de roupas','<div class="choice-grid">'+choices.map(([id,label,color,category])=>
      '<button class="choice" data-rio-clothing-buy="'+id+'" '+(rioWardrobeHasItem(id)?'disabled':'')+'><b>'+RIO_WARDROBE_LABELS[category]+' · '+label+'</b><span>'+
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

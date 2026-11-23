/** Optional clothing for the original articulated family models. */
// @otthi-module-body
  const RIO_WARDROBE_CHARACTERS = Object.freeze(['thiago', 'thamis']);
  const RIO_WARDROBE_CATALOG = Object.freeze({
    top: [
      ['original', 'Roupa original'],
      ['linen', 'Camiseta de linho', '#ebded0'],
      ['denim', 'Jaqueta jeans', '#385575'],
      ['sport', 'Camiseta esportiva', '#237e61'],
      ['festival', 'Vestido de festa e leggings', '#ae4c78'],
      ['rain', 'Jaqueta corta-vento', '#da954a'],
      ['hoodie', 'Moletom com capuz', '#66739c'],
      ['rio-polo', 'Polo vinho da cidade', '#862e4a'],
      ['rio-lavanda', 'Camiseta lavanda', '#9f86b2'],
      ['rio-social', 'Camisa social azul', '#446a8a']
    ],
    legs: [
      ['original', 'Roupa original'],
      ['jeans', 'Calça jeans', '#36577b'],
      ['chino', 'Calça de sarja', '#a28662'],
      ['bermuda', 'Bermuda', '#54695c'],
      ['track', 'Calça esportiva', '#5b3468'],
      ['rio-alfaiataria', 'Calça de alfaiataria', '#383b43'],
      ['rio-cargo', 'Calça cargo', '#6c7351'],
      ['rio-jeans-preto', 'Jeans preto', '#252a35'],
      ['rio-bermuda-jeans', 'Bermuda jeans', '#456786']
    ],
    shoes: [
      ['original', 'Calçado original'],
      ['runner', 'Tênis de corrida', '#45a7a3'],
      ['leather', 'Sapato de couro', '#634432'],
      ['boot', 'Bota de passeio', '#725543'],
      ['rio-tenis', 'Tênis branco da orla', '#e6dfd5'],
      ['rio-sapato', 'Sapato azul-marinho', '#263a58'],
      ['rio-sneaker', 'Tênis urbano', '#b6a088'],
      ['rio-bota', 'Bota preta', '#282b35'],
      ['rio-salto', 'Sapato de festa', '#b66d76']
    ],
    hat: [
      ['original', 'Sem chapéu novo'],
      ['cap', 'Boné bordado', '#3c526d'],
      ['panama', 'Chapéu de palha', '#dab87e'],
      ['beanie', 'Gorro de tricô', '#496b61'],
      ['headphones', 'Fones de ouvido', '#4b5970'],
      ['rio-bone-azul', 'Boné azul', '#375c96'],
      ['rio-panama-claro', 'Chapéu verão', '#e6cda3']
    ],
    glasses: [
      ['original', 'Óculos originais'],
      ['copper', 'Armação cobre', '#b87955'],
      ['sun', 'Óculos de sol', '#304255'],
      ['rio-armacao', 'Óculos pretos', '#25292e'],
      ['rio-sol', 'Óculos escuros', '#1a2435']
    ],
    jewel: [
      ['original', 'Acessórios originais'],
      ['necklace', 'Colar pingente', '#d8ae61'],
      ['earrings', 'Brincos pequenos', '#d8ae61'],
      ['rio-brinco-prata', 'Brincos de prata', '#b7c8d2'],
      ['rio-colar-prata', 'Colar de prata', '#b9cad2']
    ],
    wrist: [
      ['original', 'Acessório original'],
      ['watch', 'Relógio de aço', '#8f9fa9'],
      ['bracelet', 'Pulseira trançada', '#b96a55'],
      ['rio-smartwatch', 'Relógio digital', '#343c45'],
      ['rio-pulseira-prata', 'Pulseira de prata', '#b9c9d3']
    ],
    bag: [
      ['original', 'Sem mochila'],
      ['city', 'Mochila de lona', '#355a59'],
      ['hike', 'Mochila de trilha', '#9b6846'],
      ['rio-mochila-escola', 'Mochila escolar', '#6e579c'],
      ['rio-bolsa-cidade', 'Bolsa casual', '#926e55']
    ]
  });

  const RIO_WARDROBE_LABELS = Object.freeze({
    top: 'Roupas', legs: 'Calças e bermudas', shoes: 'Calçados', hat: 'Bonés e chapéus',
    glasses: 'Óculos', jewel: 'Colares e brincos', wrist: 'Relógios e pulseiras', bag: 'Mochilas'
  });
  const RIO_WARDROBE_STORE=Object.freeze({'rio-polo':65,'rio-lavanda':55,'rio-tenis':49,'rio-sapato':68,
    'rio-social':96,'rio-alfaiataria':88,'rio-cargo':70,'rio-jeans-preto':78,'rio-bermuda-jeans':52,
    'rio-sneaker':72,'rio-bota':98,'rio-salto':94,'rio-bone-azul':39,'rio-panama-claro':55,
    'rio-armacao':65,'rio-sol':69,'rio-brinco-prata':48,'rio-colar-prata':60,
    'rio-smartwatch':110,'rio-pulseira-prata':50,'rio-mochila-escola':72,'rio-bolsa-cidade':86});
  function rioWardrobeHasItem(id){return !RIO_WARDROBE_STORE[id]||!!state.cityServices?.rioMap?.wardrobePurchases?.[id];}
  const RIO_WARDROBE_PRESETS = Object.freeze({
    original: {label:'Visual original', outfit:{}},
    passeio: {label:'Passeio no bairro', outfit:{top:'linen',legs:'chino',shoes:'leather',hat:'panama',glasses:'copper',jewel:'necklace',wrist:'bracelet'}},
    esportivo: {label:'Dia de corrida', outfit:{top:'sport',legs:'track',shoes:'runner',hat:'cap',glasses:'sun',wrist:'watch',bag:'city'}},
    chuva: {label:'Chuva na cidade', outfit:{top:'rain',legs:'jeans',shoes:'boot',hat:'beanie',wrist:'bracelet',bag:'hike'}},
    rua: {label:'Passeio na Represa',outfit:{top:'hoodie',legs:'jeans',shoes:'runner',hat:'headphones',bag:'city'}},
    festa: {label:'Fim de tarde', outfit:{top:'festival',legs:'track',shoes:'leather',glasses:'copper',jewel:'earrings',wrist:'watch'}}
  });

  function normalizeRioWardrobeOutfit(value) {
    return Object.fromEntries(Object.entries(RIO_WARDROBE_CATALOG).map(([slot,choices])=>{
      const id = value?.[slot];
      return [slot,choices.some(choice=>choice[0]===id) ? id : 'original'];
    }));
  }
  function normalizeRioWardrobe(value) {
    return Object.fromEntries(RIO_WARDROBE_CHARACTERS.map(id=>[id,normalizeRioWardrobeOutfit(value?.[id])]));
  }
  function rioWardrobeToken(value) {
    const outfit=normalizeRioWardrobeOutfit(value);
    const slots=Object.entries(RIO_WARDROBE_CATALOG).map(([slot,choices])=>choices.findIndex(choice=>choice[0]===outfit[slot]));
    return slots.some(Boolean) ? 'rio1-'+slots.join('') : '';
  }
  function rioWardrobeFromToken(value) {
    const match=/^rio1-([0-9]{8})$/.exec(typeof value==='string'?value:'');
    if(!match)return normalizeRioWardrobeOutfit();
    return normalizeRioWardrobeOutfit(Object.fromEntries(Object.entries(RIO_WARDROBE_CATALOG).map(([slot,choices],i)=>[slot,choices[Number(match[1][i])]?.[0]])));
  }
  function rioWardrobeTint(slot,id) {
    return RIO_WARDROBE_CATALOG[slot].find(choice=>choice[0]===id)?.[2];
  }

  // Only players with matching cloth selections share a recolored skin. Bone
  // indices, weights, vertices and approved facial details stay untouched.
  const rioWardrobeSkinCache=new WeakMap();
  function acquireRioWardrobeSkin(base,bones,id,outfit){
    const slots=['top','legs','shoes','glasses'];
    if(slots.every(slot=>outfit[slot]==='original'))return null;
    const key=slots.map(slot=>outfit[slot]).join('/');
    let variants=rioWardrobeSkinCache.get(base);
    if(!variants){variants=new Map();rioWardrobeSkinCache.set(base,variants);}
    const existing=variants.get(key);
    if(existing){existing.refs++;return existing;}

    const geometry=new THREE.BufferGeometry();
    const cloneView=attribute=>new THREE.BufferAttribute(attribute.array,attribute.itemSize,attribute.normalized);
    for(const [name,attribute] of Object.entries(base.attributes))geometry.setAttribute(name,cloneView(attribute));
    geometry.setIndex(cloneView(base.index));
    geometry.boundingBox=base.boundingBox;
    geometry.boundingSphere=base.boundingSphere;

    const colors=base.attributes.color.clone();
    const {position,skinIndex}=base.attributes;
    const linear=color=>new THREE.Color(color).convertSRGBToLinear();
    const neck=linear(id==='thiago'?'#d99a72':'#e5a17b');
    const frame=linear('#17191e'),joggers=linear('#42253f');
    const tags=bones.map(bone=>bone.name.split(':')[1]);
    const tints=Object.fromEntries(slots.map(slot=>[slot,rioWardrobeTint(slot,outfit[slot])?linear(rioWardrobeTint(slot,outfit[slot])):null]));
    const matches=(i,c)=>Math.abs(colors.getX(i)-c.r)<.001&&Math.abs(colors.getY(i)-c.g)<.001&&Math.abs(colors.getZ(i)-c.b)<.001;
    for(let i=0;i<colors.count;i++){
      const tag=tags[skinIndex.getX(i)],y=position.getY(i);
      let tint=null,keepDetail=true;
      if(tints.top&&(tag===id&&y>1.22&&y<2.13||/^shoulder[+-]?\d/.test(tag))&&!matches(i,neck))tint=tints.top;
      if(tints.legs&&/^(hips|hip[+-]?\d|knee[+-]?\d)$/.test(tag)){
        tint=tints.legs;
        if(outfit.legs==='bermuda'&&y<.78){tint=neck;keepDetail=false;}
      }
      else if(outfit.top==='festival'&&outfit.legs==='original'&&/^(hips|hip[+-]?\d|knee[+-]?\d)$/.test(tag))tint=joggers;
      if(tints.shoes&&/^ankle[+-]?\d/.test(tag)&&y>.255&&colors.getX(i)<.73)tint=tints.shoes;
      if(tints.glasses&&tag==='head'&&matches(i,frame)){tint=tints.glasses;keepDetail=false;}
      if(!tint)continue;
      const luminosity=(colors.getX(i)+colors.getY(i)+colors.getZ(i))/3;
      const shade=keepDetail?Math.max(.68,Math.min(1.18,.79+luminosity*.46)):1;
      colors.setXYZ(i,tint.r*shade,tint.g*shade,tint.b*shade);
    }
    geometry.setAttribute('color',colors);
    const variant={geometry,refs:1,variants,key};
    variants.set(key,variant);
    return variant;
  }
  function releaseRioWardrobeSkin(variant){
    if(variant&&--variant.refs===0){
      variant.variants.delete(variant.key);
      variant.geometry.dispose();
    }
  }

  const rioWardrobePrimitives=new Map();
  const rioWardrobeMaterials=new Map();
  function rioWardrobePrimitive(kind){
    if(rioWardrobePrimitives.has(kind))return rioWardrobePrimitives.get(kind);
    const geometry=kind==='box'?new THREE.BoxGeometry(1,1,1):
      kind==='disc'?new THREE.CylinderGeometry(.5,.5,1,16):
      kind==='flare'?new THREE.CylinderGeometry(.37,.5,1,16):
      kind==='ring'?new THREE.TorusGeometry(.5,.07,7,18):
      new THREE.SphereGeometry(.5,14,10);
    rioWardrobePrimitives.set(kind,geometry);
    return geometry;
  }
  function rioWardrobeMaterial(color,finish='cloth'){
    const key=finish+':'+color;
    if(!rioWardrobeMaterials.has(key)){
      const material=new THREE.MeshStandardMaterial({
        color:new THREE.Color(color).convertSRGBToLinear(),
        roughness:finish==='metal'?.34:.72,metalness:finish==='metal'?.39:0,
        transparent:finish==='lens',opacity:finish==='lens'?.75:1,
        depthWrite:finish!=='lens'
      });
      rioWardrobeMaterials.set(key,material);
    }
    return rioWardrobeMaterials.get(key);
  }
  function rioWardrobePiece(parent,kind,color,size,at,finish){
    const mesh=new THREE.Mesh(rioWardrobePrimitive(kind),rioWardrobeMaterial(color,finish));
    mesh.scale.set(...size);mesh.position.set(...at);parent.add(mesh);
    return mesh;
  }

  const rioWardrobeGroupVisuals=new WeakMap();
  function clearRioWardrobeVisual(visual){
    const previous=visual?.rioWardrobe;
    if(!previous)return;
    previous.parts.forEach(part=>part.parent?.remove(part));
    if(previous.variant){visual.mesh.geometry=previous.base;releaseRioWardrobeSkin(previous.variant);}
    visual.rioWardrobe=null;
    rioWardrobeGroupVisuals.delete(visual.group);
  }
  function releaseRioWardrobeGroup(group){clearRioWardrobeVisual(rioWardrobeGroupVisuals.get(group));}
  function applyRioWardrobeVisual(visual,value){
    if(!visual||!RIO_WARDROBE_CHARACTERS.includes(visual.id))return;
    const outfit=normalizeRioWardrobeOutfit(value);
    const token=rioWardrobeToken(outfit);
    if((visual.rioWardrobe?.token||'')===token)return;
    clearRioWardrobeVisual(visual);
    if(!token)return;

    const base=visual.mesh.geometry;
    const variant=acquireRioWardrobeSkin(base,visual.bones,visual.id,outfit);
    if(variant)visual.mesh.geometry=variant.geometry;
    const state={token,outfit,base,variant,parts:[],sit:false,skirt:null,bag:null};
    visual.rioWardrobe=state;
    rioWardrobeGroupVisuals.set(visual.group,visual);
    const add=(slot,boneKey)=>{
      const bone=visual.byName[boneKey];
      if(!bone)return null;
      const part=new THREE.Group();
      part.name='OTTHI_RIO_WARDROBE_'+slot.toUpperCase();
      part.userData.rioWardrobePart=true;
      bone.add(part);state.parts.push(part);
      return part;
    };
    const tint=slot=>rioWardrobeTint(slot,outfit[slot]);
    const piece=rioWardrobePiece;
    const rootKey=visual.id;
    const top=tint('top');
    if(top){
      const torso=add('top',rootKey);
      if(['denim','rain','hoodie','rio-social'].includes(outfit.top)){
        // The sleeves pivot at the existing elbows and leave the tool hand clear.
        for(const side of [-1,1]){
          const sleeve=add('sleeve','elbow'+side);
          piece(sleeve,'flare',top,[.23,.30,.23],[0,-.12,0]).rotation.z=Math.PI;
          piece(sleeve,'disc',top,[.175,.035,.17],[0,-.277,0]);
          piece(torso,'box',outfit.top==='denim'?'#254665':outfit.top==='hoodie'?'#495676':'#9f632f',[.13,.11,.018],[side*.183,1.67,.232]);
        }
        piece(torso,'box','#baa180',[.018,.48,.019],[0,1.66,.24]);
        piece(torso,'box','#f4dfb8',[.04,.04,.016],[.026,1.883,.25]);
        if(outfit.top==='rain')piece(torso,'sphere','#cc823a',[.48,.27,.25],[0,1.95,-.18]);
        if(outfit.top==='hoodie'){
          piece(torso,'sphere',top,[.49,.31,.27],[0,1.95,-.18]);
          piece(torso,'box','#bac1d1',[.24,.10,.025],[0,1.46,.23]);
        }
      }else if(outfit.top==='sport'){
        for(const side of [-1,1]){
          piece(torso,'box','#e5ecce',[.075,.39,.012],[side*.20,1.66,.206]).rotation.z=side*.11;
        }
        piece(torso,'box','#e4eee9',[.14,.065,.018],[-.15,1.84,.23]);
      }else if(outfit.top==='linen'){
        piece(torso,'box','#c5b2a0',[.13,.105,.015],[-.16,1.775,.227]);
        piece(torso,'box','#ead8c0',[.46,.024,.026],[0,1.31,.19]);
      }else if(outfit.top==='festival'){
        state.skirt=add('skirt',rootKey);
        state.skirt.position.set(0,1.14,0);
        piece(state.skirt,'flare',top,[.84,.33,.57],[0,0,0]);
        piece(state.skirt,'disc','#c4819e',[.68,.048,.43],[0,.151,0]);
        for(const side of [-1,1])piece(state.skirt,'box','#ca7e9f',[.014,.202,.021],[side*.20,-.028,.254]);
      }
    }
    if(outfit.legs==='track')for(const side of [-1,1]){
      const stripe=add('track-stripe','hip'+side);
      piece(stripe,'box','#e0d7ee',[.022,.38,.036],[side*.159,-.252,.04]).rotation.z=-side*.075;
    }
    if(outfit.shoes==='boot')for(const side of [-1,1]){
      const boot=add('boot','ankle'+side);
      piece(boot,'disc',tint('shoes'),[.232,.25,.248],[0,.221,-.04]);
      piece(boot,'disc','#9e7a5b',[.242,.028,.255],[0,.338,-.04]);
    }
    const hat=tint('hat');
    if(hat){
      const head=add('hat','head');
      if(['cap','rio-bone-azul'].includes(outfit.hat)){
        piece(head,'sphere',hat,[.81,.28,.72],[0,.444,-.012]);
        piece(head,'sphere',hat,[.58,.06,.34],[0,.393,.38]);
        piece(head,'box','#ead9b3',[.102,.043,.018],[0,.49,.335]);
      }else if(['panama','rio-panama-claro'].includes(outfit.hat)){
        piece(head,'disc','#b89c74',[1.00,.045,.94],[0,.442,0]);
        piece(head,'flare',hat,[.75,.208,.66],[0,.519,-.016]);
        piece(head,'disc','#564537',[.734,.048,.65],[0,.468,-.016]);
      }else if(outfit.hat==='headphones'){
        piece(head,'ring',hat,[.93,.94,.21],[0,.14,-.018]);
        for(const side of [-1,1]){
          piece(head,'sphere','#273346',[.19,.29,.26],[side*.454,.087,-.018]);
          piece(head,'sphere',hat,[.109,.24,.21],[side*.51,.087,-.018]);
        }
      }else{
        piece(head,'sphere',hat,[.84,.28,.753],[0,.456,-.018]);
        piece(head,'disc','#3f5750',[.83,.08,.738],[0,.397,-.011]);
        piece(head,'sphere',hat,[.119,.124,.118],[0,.593,-.019]);
      }
    }
    if(['sun','rio-sol'].includes(outfit.glasses)){
      const glasses=add('glasses','head');
      for(const side of [-1,1]){
        piece(glasses,'sphere','#203744',[.242,.181,.035],[side*.176,.065,.414],'lens');
        piece(glasses,'box','#b79267',[.061,.025,.024],[side*.305,.113,.426],'metal');
      }
    }
    const jewel=tint('jewel');
    if(['earrings','rio-brinco-prata'].includes(outfit.jewel)){
      const ears=add('earrings','head');
      for(const side of [-1,1])piece(ears,'ring',jewel,[.075,.105,.048],[side*.424,-.127,.039],'metal');
    }else if(outfit.jewel==='necklace'){
      const neck=add('necklace',rootKey);
      const chain=piece(neck,'ring',jewel,[.356,.29,.10],[0,1.92,.188],'metal');
      chain.rotation.x=-.36;
      piece(neck,'sphere','#7db7ae',[.075,.091,.029],[0,1.771,.241],'metal');
    }
    if(['watch','rio-smartwatch'].includes(outfit.wrist)){
      const watch=add('watch','elbow-1');
      piece(watch,'disc',tint('wrist'),[.169,.069,.174],[0,-.283,.006],'metal');
      piece(watch,'box','#253845',[.087,.047,.039],[0,-.283,.101],'metal');
      piece(watch,'box','#98c5c4',[.013,.021,.005],[0,-.279,.124]);
    }else if(outfit.wrist==='bracelet'){
      const bracelet=add('bracelet','elbow1');
      piece(bracelet,'disc',tint('wrist'),[.155,.039,.16],[0,-.302,0]);
      piece(bracelet,'sphere','#efcf99',[.055,.052,.035],[0,-.30,.083]);
    }
    if(tint('bag')){
      const bag=state.bag=add('bag',rootKey);
      const hiking=outfit.bag==='hike';
      piece(bag,'sphere',tint('bag'),[.56,hiking?.59:.5,hiking?.32:.28],[0,1.66,-.286]);
      piece(bag,'sphere',hiking?'#5c4a3a':'#28484a',[.41,.23,.2],[0,1.53,-.43]);
      piece(bag,'box','#cabb95',[.245,.017,.017],[0,1.586,-.531],'metal');
      for(const side of [-1,1]){
        piece(bag,'box',tint('bag'),[.064,.56,.032],[side*.197,1.68,.208]).rotation.z=side*.10;
        piece(bag,'box','#627479',[.075,.055,.023],[side*.204,1.691,.234],'metal');
      }
      if(hiking)piece(bag,'disc','#80795b',[.12,.40,.145],[.293,1.642,-.31]);
    }
  }

  function rioWardrobeSeatFit(visual,sitting){
    const extras=visual?.rioWardrobe;
    const isSitting=!!sitting;
    if(!extras||extras.sit===isSitting)return;
    extras.sit=isSitting;
    if(extras.bag)extras.bag.visible=!isSitting; // rests off the back while in a seat
    if(extras.skirt){
      extras.skirt.scale.y=isSitting?.61:1;
      extras.skirt.position.y=isSitting?1.21:1.14;
      extras.skirt.rotation.x=isSitting?-.27:0;
    }
  }

  let rioWardrobePreview=null;
  function disposeRioWardrobePreview(){
    const preview=rioWardrobePreview;
    if(!preview)return;
    rioWardrobePreview=null;
    if(preview.visual)releaseFamilyAvatarVisual(preview.visual.group);
    preview.renderer?.dispose();
    preview.renderer?.forceContextLoss();
  }
  function drawRioWardrobePreview(canvas,character,outfit,angle){
    if(rioWardrobePreview?.canvas!==canvas){
      disposeRioWardrobePreview();
      try{
        const previewRenderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});
        previewRenderer.outputEncoding=THREE.sRGBEncoding;
        previewRenderer.setSize(280,312,false);
        const stage=new THREE.Scene();
        stage.background=new THREE.Color(0x233e49);
        stage.add(new THREE.HemisphereLight(0xf5ede5,0x7c8794,2.0));
        const key=new THREE.DirectionalLight(0xffebd4,2.25);
        key.position.set(-3,4,4);
        stage.add(key);
        const camera=new THREE.PerspectiveCamera(32,280/312,.1,30);
        camera.position.set(0,1.34,4.12);
        camera.lookAt(0,1.03,0);
        rioWardrobePreview={canvas,renderer:previewRenderer,stage,camera,visual:null};
      }catch{
        rioWardrobePreview={canvas,unavailable:true};
        canvas.dataset.previewReady='false';
        return false;
      }
    }
    const preview=rioWardrobePreview;
    if(preview.unavailable)return false;
    if(preview.visual?.id!==character){
      if(preview.visual)releaseFamilyAvatarVisual(preview.visual.group);
      preview.visual=familyCloneAvatar(character,preview.stage);
      // The turntable starts from the resting pose even when the world
      // actor used for cloning is currently walking or sitting.
      preview.visual?.bones.forEach(bone=>bone.rotation.set(0,0,0,'YXZ'));
    }
    if(!preview.visual)return false;
    applyRioWardrobeVisual(preview.visual,outfit);
    preview.visual.group.rotation.y=angle;
    preview.renderer.render(preview.stage,preview.camera);
    canvas.dataset.previewReady='true';
    return true;
  }
  function rioWardrobeVisualSnapshot(){
    const visual=typeof playerModel==='undefined'?null:playerModel?.userData?.familyAvatar;
    return {
      id:visual?.id||null,
      outfit:visual?.rioWardrobe?.outfit||null,
      seated:visual?.rioWardrobe?.sit||false,
      attachments:visual?.rioWardrobe?.parts.map(p=>({name:p.name,bone:p.parent?.name,visible:p.visible}))||[]
    };
  }
  function openRioWardrobe(character){
    if(inRioMap()&&running&&!familyWorld.studio)initFamilyAvatarTemplates();
    if(!(familyWorld.ready||inRioMap()&&running&&familyWorld.studio)){toast('Entre no Mundo Aberto para usar o guarda-roupa.','info',2300);return;}
    let selected=RIO_WARDROBE_CHARACTERS.includes(character)?character:familyCharacterId(state.avatar.bodyStyle)||'thiago';
    const draft=normalizeRioWardrobe(state.avatar.rioWardrobe);
    let angle=.12;
    openModal('Guarda-roupa de Thiago e Thamis',`
      <section class="rio-wardrobe" aria-label="Roupas e acessórios da família">
        <div class="rio-wardrobe-characters" aria-label="Personagem">
          <button class="btn" type="button" data-rio-wardrobe-character="thiago">Thiago</button>
          <button class="btn" type="button" data-rio-wardrobe-character="thamis">Thamis</button>
        </div>
        <div class="rio-wardrobe-columns">
          <section class="rio-wardrobe-preview">
            <canvas data-rio-wardrobe-preview width="280" height="312" aria-label="Prévia 3D das roupas"></canvas>
            <p data-rio-wardrobe-unavailable hidden>Prévia 3D indisponível neste navegador.</p>
            <div class="rio-wardrobe-rotate">
              <button type="button" class="btn" data-rio-wardrobe-turn="-1" aria-label="Girar para a esquerda">↶ Girar</button>
              <button type="button" class="btn" data-rio-wardrobe-turn="1" aria-label="Girar para a direita">Girar ↷</button>
            </div>
          </section>
          <div class="rio-wardrobe-fields">
            <label>Combinações<select data-rio-wardrobe-preset>
              <option value="">Personalizar</option>${Object.entries(RIO_WARDROBE_PRESETS).map(([key,preset])=>`<option value="${key}">${preset.label}</option>`).join('')}
            </select></label>
            <div class="rio-wardrobe-slots">${Object.entries(RIO_WARDROBE_CATALOG).map(([slot,choices])=>`
              <label>${RIO_WARDROBE_LABELS[slot]}<select data-rio-wardrobe-slot="${slot}">${choices.map(([id,label])=>`<option value="${id}" ${rioWardrobeHasItem(id)?'':'disabled'}>${label}${rioWardrobeHasItem(id)?'':' · à venda no shopping'}</option>`).join('')}</select></label>
            `).join('')}</div>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn" data-rio-wardrobe-back>Voltar ao personagem</button>
          <button type="button" class="btn primary" data-rio-wardrobe-save>Salvar roupas</button>
        </div>
      </section>`,root=>{
        const canvas=root.querySelector('[data-rio-wardrobe-preview]');
        const slots=[...root.querySelectorAll('[data-rio-wardrobe-slot]')];
        const buttons=[...root.querySelectorAll('[data-rio-wardrobe-character]')];
        const preset=root.querySelector('[data-rio-wardrobe-preset]');
        function refresh(){
          for(const button of buttons){
            const active=button.dataset.rioWardrobeCharacter===selected;
            button.setAttribute('aria-pressed',String(active));
            button.classList.toggle('primary',active);
          }
          for(const input of slots)input.value=draft[selected][input.dataset.rioWardrobeSlot];
          preset.value=Object.entries(RIO_WARDROBE_PRESETS).find(([,p])=>rioWardrobeToken(p.outfit)===rioWardrobeToken(draft[selected]))?.[0]||'';
          const ready=drawRioWardrobePreview(canvas,selected,draft[selected],angle);
          root.querySelector('[data-rio-wardrobe-unavailable]').hidden=ready;
          canvas.hidden=!ready;
        }
        for(const button of buttons)button.onclick=()=>{selected=button.dataset.rioWardrobeCharacter;refresh();};
        for(const input of slots)input.onchange=()=>{draft[selected][input.dataset.rioWardrobeSlot]=input.value;refresh();};
        preset.onchange=()=>{if(preset.value){draft[selected]=normalizeRioWardrobeOutfit(RIO_WARDROBE_PRESETS[preset.value].outfit);refresh();}};
        for(const button of root.querySelectorAll('[data-rio-wardrobe-turn]'))button.onclick=()=>{angle+=Number(button.dataset.rioWardrobeTurn)*Math.PI/4;refresh();};
        root.querySelector('[data-rio-wardrobe-back]').onclick=openAvatarStudio;
        root.querySelector('[data-rio-wardrobe-save]').onclick=()=>{
          state.avatar=normalizeAvatarV2({...state.avatar,rioWardrobe:draft});
          applyAvatarCustomization();
          saveState(true);
          if(running)updateMultiplayer(0,true);
          closeModal();
          toast('Roupas salvas no seu perfil.','good',2100);
        };
        refresh();
      });
  }

  window.OTTHI_RIO_WARDROBE=Object.freeze({
    open:openRioWardrobe,
    diagnostics:()=>({saved:normalizeRioWardrobe(state.avatar.rioWardrobe),visual:rioWardrobeVisualSnapshot(),preview:!!rioWardrobePreview?.visual})
  });

  // Add profiles to the existing modular toy characters separately. Family
  // customizations above always reuse their specific original human rigs.
  const RIO_AVATAR_COMPLEXION=Object.freeze({
    'rio-tone-claro':0xeec5a5,'rio-tone-oliva':0xc99467,'rio-tone-cobre':0xa86945,
    'rio-tone-moreno':0x8b5441,'rio-tone-escuro':0x5f3c31
  });
  function rioAvatarComplexion(id){
    return Object.hasOwn(RIO_AVATAR_COMPLEXION,id)?RIO_AVATAR_COMPLEXION[id]:undefined;
  }
  function addRioToyWardrobe(avatar,theme,parts,colors){
    if(theme==='mario-world'||theme==='luigi-world')return;
    const {head,body,arms,legs}=parts;
    const {primary,secondary,hair}=colors;
    const faceDepth=theme==='lego'?.41:theme==='minecraft'?.53:.61;
    const softened=theme==='lego'?.83:1;
    if(avatar.face==='rio-face-sardas'){
      const freckle=worldAvatarMaterial(0xad633f,{roughness:.75});
      for(const side of [-1,1])for(let i=0;i<3;i++){
        toySkinSphere(head,.027,freckle,side*(.23+i*.043),-.075+((i+1)%2)*.024,faceDepth-i*.024,1,.72,.48);
      }
    }else if(avatar.face==='rio-face-riso'){
      const smile=worldAvatarMaterial(0x96534b,{roughness:.72});
      const upper=worldAvatarMaterial(0xffebe2,{roughness:.76});
      toySkinSphere(head,.127,smile,0,-.161,faceDepth,.98*softened,.48,.17);
      toySkinSphere(head,.098,upper,0,-.142,faceDepth+.016,.98*softened,.24,.15);
    }
    const baseY=theme==='lego'?.42:.48;
    const depth=theme==='minecraft'?1.02:theme==='lego'?.86:1.14;
    if(avatar.hair==='rio-hair-bob'){
      toySkinSphere(head,.565,hair,0,baseY-.21,-.13,depth,.69,.87);
      for(const side of [-1,1])toySkinSphere(head,.265,hair,side*depth*.33,baseY-.58,-.19,.78,1.38,.92);
    }else if(avatar.hair==='rio-hair-puffs'){
      toySkinSphere(head,.51,hair,0,baseY-.064,-.12,depth,.52,.96);
      for(const side of [-1,1]){
        toySkinSphere(head,.228,hair,side*depth*.36,baseY+.15,-.15,1,1.1,.96);
        toySkinSphere(head,.129,primary,side*depth*.30,baseY+.005,-.15,.85,.48,1);
      }
    }else if(avatar.hair==='rio-hair-coils'){
      for(const side of [-1,0,1])for(let i=0;i<4;i++){
        toySkinSphere(head,.151,hair,side*depth*.27,baseY+Math.cos(i*.84)*.09-(side===0?0:.03),.29-i*.172,.91,.77,1.1);
      }
    }else if(avatar.hair==='rio-hair-ondas'){
      toySkinSphere(head,.49,hair,-.045,baseY+.012,-.13,depth,.56,.91);
      for(let i=0;i<4;i++){
        const lock=toySkinSphere(head,.19,hair,-.26+i*.137,baseY-.05+i*.035,faceDepth*.63,1.2,.72,1.05);
        lock.rotation.z=-.33;
      }
    }

    if(avatar.torso==='rio-torso-junior'){
      const panel=worldAvatarMaterial(0xf6d985,{roughness:.71});
      toySkinBox(body,.64,.50,.04,secondary,0,.02,.406);
      toySkinBox(body,.57,.082,.05,panel,0,.12,.439).rotation.z=-.16;
      for(const arm of arms)toySkinSphere(arm,.17,primary,0,-.11,0,1.2,1.1,1.19);
    }else if(avatar.torso==='rio-torso-rain'){
      const trim=worldAvatarMaterial(0xcbb48e,{roughness:.70});
      toySkinBox(body,.85,.94,.17,secondary,0,-.01,.34);
      toySkinBox(body,.028,.83,.03,trim,0,.01,.443);
      toySkinSphere(body,.44,primary,0,.45,-.245,1,.48,.54);
      for(const arm of arms)toySkinBox(arm,.35,.54,.35,secondary,0,-.32,0);
    }
    for(const leg of legs){
      const soleY=theme==='minecraft'?-.94:theme==='playmobil'?-.81:-.9;
      if(avatar.shoes==='rio-shoes-runner'){
        const sole=worldAvatarMaterial(0xf4e8ce,{roughness:.62});
        toySkinBox(leg,.407,.061,.565,sole,0,soleY-.04,.116);
        toySkinSphere(leg,.245,secondary,0,soleY+.041,.18,.87,.40,1.22);
        for(let i=0;i<3;i++)toySkinBox(leg,.159,.021,.024,sole,0,soleY+.141,.055+i*.064);
      }else if(avatar.shoes==='rio-shoes-boot'){
        const seam=worldAvatarMaterial(0xa16743,{roughness:.66});
        toySkinBox(leg,.405,.26,.467,secondary,0,soleY+.078,.078);
        toySkinBox(leg,.401,.043,.466,seam,0,soleY+.212,.077);
      }
    }
  }

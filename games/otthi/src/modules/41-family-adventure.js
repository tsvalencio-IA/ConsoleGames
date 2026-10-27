/** Family activities use the approved HQ rigs and OTThi's world, GPS and room authority. */
// @otthi-module-body
  const FAMILY_TASKS={"workshop": [{"q": "O cliente relata que a bateria descarrega mesmo com o motor funcionando. Escolha o primeiro procedimento.", "a": ["Trocar a bateria imediatamente", "Medir tensão na bateria e saída do alternador", "Trocar o módulo de injeção"], "ok": 1, "explain": "Antes de trocar peças, precisamos comparar as tensões."}, {"q": "Dados SIMULADOS: motor desligado 12,5 V; motor ligado na bateria 12,1 V; saída do alternador 14,0 V. Qual é a suspeita principal?", "a": ["Queda de tensão entre alternador e bateria", "Defeito no pneu dianteiro", "Bateria com carga perfeita e nenhum problema"], "ok": 0, "explain": "O alternador apresenta 14,0 V na saída, mas essa tensão não chega à bateria."}, {"q": "Qual teste confirma a suspeita sem trocar peças?", "a": ["Desconectar componentes aleatoriamente", "Medir queda de tensão no cabo positivo e nos aterramentos sob carga", "Trocar o alternador por tentativa"], "ok": 1, "explain": "O teste de queda de tensão sob carga permite localizar resistência excessiva."}, {"q": "Foi encontrada conexão oxidada com queda excessiva. O que fazer?", "a": ["Reparar e limpar a conexão, reapertar e retestar com carga", "Ignorar a conexão", "Apagar códigos e devolver o carro"], "ok": 0, "explain": "Reparo confirmado com reteste de tensão. A situação é fictícia e didática."}], "technology": [{"q": "A lista de peças traz um item excluído de volta. Qual regra evita o problema?", "a": ["Recriar todos os itens no carregamento", "Respeitar o ID e o estado de exclusão persistido", "Apagar o histórico"], "ok": 1, "explain": ""}, {"q": "Pedido total = preço × quantidade. Para 3 itens de R$ 20, qual expressão é correta?", "a": ["20 + 3 = 23", "20 / 3", "20 * 3 = 60"], "ok": 2, "explain": ""}, {"q": "Uma tela no celular apresenta rolagem horizontal indesejada. O que verificar?", "a": ["Larguras fixas e elementos fora da viewport", "Apagar o projeto", "Diminuir apenas a fonte"], "ok": 0, "explain": ""}, {"q": "Antes de lançar uma nova versão, qual procedimento?", "a": ["Publicar diretamente sem conferir", "Testar as interações e regressões no mobile e desktop", "Ocultar os erros"], "ok": 1, "explain": ""}]};
  const FAMILY_MEMBERS=['thiago','thamis','luna','liz'];
  const familyName=id=>({thiago:'Thiago',thamis:'Thamis',luna:'Luna',liz:'Liz'})[id];
  const familyWorld={ready:false,studio:null,actors:{},ball:null,selectedDog:'luna',toy:'ball',walkOwner:'',walkMembers:[],walkController:'',ack:null,lastAck:'',clock:0,frame:0,workUntil:0,location:null,sequence:0};
  function normalizeFamilyParty(value={}){
    const controller=value.controller==='thamis'?'thamis':'thiago';
    const members=Array.isArray(value.members)?value.members:FAMILY_MEMBERS;
    return{controller,members:FAMILY_MEMBERS.filter(id=>id===controller||members.includes(id))};
  }
  function familyProgress(){
    if(!state.familyAdventure||typeof state.familyAdventure!=='object')state.familyAdventure={deliveries:{luna:0,liz:0},flags:{}};
    const progress=state.familyAdventure;
    progress.toy=['ball','disk','bone'].includes(progress.toy)?progress.toy:'ball';progress.deliveries={luna:0,liz:0,...progress.deliveries};progress.flags={...progress.flags};return progress;
  }
  function familyMatrices(){
    const m={I:()=>new THREE.Matrix4().elements.slice(),mul:(a,b)=>new THREE.Matrix4().fromArray(a).multiply(new THREE.Matrix4().fromArray(b)).elements.slice(),t:(x,y,z)=>new THREE.Matrix4().makeTranslation(x,y,z).elements.slice(),s:(x,y,z)=>new THREE.Matrix4().makeScale(x,y,z).elements.slice(),rx:a=>new THREE.Matrix4().makeRotationX(a).elements.slice(),ry:a=>new THREE.Matrix4().makeRotationY(a).elements.slice(),rz:a=>new THREE.Matrix4().makeRotationZ(a).elements.slice(),transform:(a,p)=>new THREE.Vector3(...p).applyMatrix4(new THREE.Matrix4().fromArray(a)).toArray()};
    m.tr=(x,y,z,sx=1,sy=1,sz=1,yaw=0)=>m.mul(m.mul(m.t(x,y,z),m.ry(yaw)),m.s(sx,sy,sz));return m;
  }
  function familyCreateActor(id,x,z){
    const rig=familyWorld.studio.rigs[id],group=new THREE.Group(),bones=[],joints=[],buffers=[];
    function branch(joint,parent){
      const bone=new THREE.Bone();bone.name=id+':'+joint.name;bone.position.fromArray(joint.pos);bone.rotation.order='YXZ';parent.add(bone);const index=bones.length;bones.push(bone);joints.push(joint);
      if(joint.buffer)buffers.push({data:joint.buffer.data,index,bone});joint.children.forEach(child=>branch(child,bone));
    }
    branch(rig.root,group);group.updateMatrixWorld(true);
    // Three bones render this rig; avoid a second traversal through the HQ renderer.
    rig.root.render=()=>{};
    const pos=[],norm=[],colors=[],indices=[],weights=[],triangles=[];
    for(const {data,index,bone} of buffers){
      const normal=new THREE.Matrix3().getNormalMatrix(bone.matrixWorld),point=new THREE.Vector3(),n=new THREE.Vector3(),lookup=new Map();
      for(let k=0;k<data.length;k+=9){
        const key=Array.from(data.subarray(k,k+9)).join(',');let vertex=lookup.get(key);
        if(vertex===undefined){vertex=pos.length/3;lookup.set(key,vertex);point.set(data[k],data[k+1],data[k+2]).applyMatrix4(bone.matrixWorld);n.set(data[k+3],data[k+4],data[k+5]).applyMatrix3(normal).normalize();pos.push(point.x,point.y,point.z);norm.push(n.x,n.y,n.z);const color=new THREE.Color(data[k+6],data[k+7],data[k+8]).convertSRGBToLinear();colors.push(color.r,color.g,color.b);indices.push(index,0,0,0);weights.push(1,0,0,0);}
        triangles.push(vertex);
      }
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));geometry.setIndex(triangles);geometry.computeBoundingSphere();
    const mesh=new THREE.SkinnedMesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,skinning:true,side:THREE.DoubleSide,roughness:.83,metalness:.015}));group.add(mesh);mesh.bind(new THREE.Skeleton(bones));mesh.frustumCulled=false;
    const scale=(id==='thiago'||id==='thamis') ? .64*(rig.scale||1) : .7;group.scale.setScalar(scale);worldGroup.add(group);
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(id==='luna'||id==='liz'?.42:.40,20),new THREE.MeshBasicMaterial({color:0x10232a,transparent:true,opacity:.19,depthWrite:false}));shadow.rotation.x=-Math.PI/2;worldGroup.add(shadow);
    return {id,x,z,heading:0,moving:0,group,mesh,shadow,bones,joints,scale,path:[],routeAt:0,vertices:triangles.length,uniqueVertices:pos.length/3};
  }
  function familyHomeLocation(){
    // A new free lot is selected without moving a road, house or existing activity.
    for(const x of [-38,-40,-34,-44,-32])for(const z of [-24,-28,-32,-16]){
      if(waterAt(x,z)||v704RoadAt(x,z,1,false))continue;
      if(v704ProtectedRectangles().some(c=>c.id!=='thia-family-home'&&Math.abs(c.x-x)<c.w/2+6&&Math.abs(c.z-z)<c.d/2+8))continue;
      const overlap=(world.colliders||[]).some(c=>!c.disabled&&Math.abs(c.x-x)<c.w/2+6.0&&Math.abs(c.z-z)<c.d/2+5.0);
      if(!overlap&&!positionBlockedForPlayer(x,z+5,.5))return{x,z};
    }
    // If no building lot is free, keep the existing playground fully intact.
    const park=worldLayoutPoint('playground',{x:-28,z:-40});return{x:park.x+7,z:park.z+7,meetingOnly:true};
  }
  function initFamilyAdventure(){
    if(familyWorld.ready||!worldGroup||typeof window.createMascotStudio!=='function')return;
    const location=familyHomeLocation();familyWorld.location=location;
    familyWorld.studio=window.createMascotStudio({createBuffer:data=>({data:new Float32Array(data),count:data.length/9}),drawColored:()=>{},contactShadow:()=>{}},familyMatrices());
    if(!location.meetingOnly)createHouse({id:'thia-family-home',name:'Casa da Família',x:location.x,z:location.z,color:0xebe3c7,roofColor:0xb76642,publicBuilding:true});
    for(const [id,dx,dz] of [['thiago',-1,5.2],['thamis',1,5.3],['luna',-1.6,6.7],['liz',1.4,6.8]])familyWorld.actors[id]=familyCreateActor(id,location.x+dx,location.z+dz);
    registerInteractable({id:'thia-family',type:'family',icon:'🐾',label:'Aventuras com Thiago, Thamis, Luna e Liz',x:location.x,z:location.z+6,radius:4,priority:385,action:openFamilyAdventure});
    familyWorld.toyMesh=new THREE.Mesh(new THREE.SphereGeometry(.15,14,10),new THREE.MeshStandardMaterial({color:0xf7ba47,roughness:.45}));familyWorld.toyMesh.visible=false;worldGroup.add(familyWorld.toyMesh);
    familyWorld.ready=true;familyWorld.restoreParty=!!familyProgress().party;familyCreateEntry();
    if(familyCharacterId(state.avatar?.bodyStyle)&&typeof applyAvatarCustomization==='function')applyAvatarCustomization();
    for(const ghost of world.ghosts?.values?.()||[])if(familyCharacterId(ghost.userData.target?.avatar?.bodyStyle)){ghost.userData.avatarSignature='';applyRemoteAvatarIfChanged(ghost,ghost.userData.target.avatar);}
    if(new URLSearchParams(locationSearch()).get('family')==='1')familyRoute('family-home');
  }
  function familyCreateEntry(){
    if(typeof document.getElementById!=='function'||document.getElementById('family-world-entry'))return;
    const area=document.getElementById('quickBar')||document.getElementById('game');if(!area)return;
    const exit=document.createElement('button');exit.id='family-portrait-exit';exit.className='btn';exit.type='button';exit.textContent='← Voltar à exploração';exit.onclick=()=>{familyWorld.portraitUntil=0;document.body.classList.remove('family-portrait');};document.getElementById('game').appendChild(exit);
    const button=document.createElement('button');button.id='family-world-entry';button.className='btn';button.type='button';button.innerHTML='🐾<span>Família</span>';button.setAttribute('aria-label','Encontrar Thiago, Thamis, Luna e Liz');button.onclick=openFamilyAdventure;area.appendChild(button);
    if(typeof document.createElement==='function')for(const a of Object.values(familyWorld.actors)){
      const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const c=canvas.getContext('2d');c.fillStyle='rgba(8,29,43,.86)';c.fillRect(8,6,240,52);c.font='bold 32px system-ui';c.textAlign='center';c.fillStyle='#fff7db';c.fillText(a.id==='thiago'?'Thiago':a.id==='thamis'?'Thamis':a.id==='luna'?'Luna':'Liz',128,44);
      const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthTest:true}));label.scale.set(a.id==='thiago'||a.id==='thamis'?1:.65,.24,1);worldGroup.add(label);a.label=label;
    }
  }
  function familyCameraFrame(){
    if(input.cameraDrag||Math.hypot(player.vx,player.vz)>.3){familyWorld.portraitUntil=0;return null;}
    if(!familyWorld.ready||performance.now()>Number(familyWorld.portraitUntil||0)||!familyNear()||player.vehicle||player.boating||currentHouse)return null;
    // Fit all four volumes, including a dog returning closer to the camera.
    const boxes=Object.values(familyWorld.actors).map(a=>{const dog=a.id==='luna'||a.id==='liz',y=groundHeightAt(a.x,a.z);return{minX:a.x-.62,maxX:a.x+.62,minY:y-.05,maxY:y+(dog?1.15:2.55),minZ:a.z-(dog?.85:.55),maxZ:a.z+(dog?.85:.55)};});
    const center=axis=>(Math.min(...boxes.map(b=>b['min'+axis]))+Math.max(...boxes.map(b=>b['max'+axis])))/2;
    const look=new THREE.Vector3(center('X'),center('Y'),center('Z')),back=new THREE.Vector3(0,.18,1).normalize(),aspect=innerWidth/innerHeight,fov=45,tan=Math.tan(fov*Math.PI/360);
    let distance=5.9;
    for(const b of boxes)for(const x of[b.minX,b.maxX])for(const y of[b.minY,b.maxY])for(const z of[b.minZ,b.maxZ]){
      const dx=x-look.x,dy=y-look.y,dz=z-look.z,depth=dy*back.y+dz*back.z,up=dy*back.z-dz*back.y;
      distance=Math.max(distance,depth+Math.abs(dx)/(tan*aspect*.84),depth+Math.abs(up)/(tan*.68));
    }
    return{position:look.clone().addScaledVector(back,distance),look,fov};
  }
  function locationSearch(){return window.location?.search||'';}
  function familyCharacterId(style){return style==='family-thiago'?'thiago':style==='family-thamis'?'thamis':'';}
  function familyCloneAvatar(id,parent,baseY=0){
    const source=familyWorld.actors[id];if(!source||!parent)return null;
    const group=source.group.clone(true),byName={};let mesh;
    group.visible=true;group.position.set(0,0,0);group.rotation.set(0,0,0);group.scale.setScalar(source.scale);group.name='OTTHI_PLAYABLE_'+id.toUpperCase();group.userData.familyAvatarSharedResources=true;
    group.traverse(o=>{if(o.isBone)byName[o.name.split(':')[1]]=o;if(o.isSkinnedMesh)mesh=o;});
    const bones=source.bones.map(b=>byName[b.name.split(':')[1]]);
    mesh.bind(new THREE.Skeleton(bones,source.mesh.skeleton.boneInverses.map(m=>m.clone())),source.mesh.bindMatrix.clone());
    // Geometry and materials are shared; every controllable instance owns its bones.
    if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
    group.position.y=.006-mesh.geometry.boundingBox.min.y*source.scale-baseY;
    parent.add(group);return{id,group,mesh,bones,byName,source};
  }
  function releaseFamilyAvatarVisual(group){group?.parent?.remove(group);group?.traverse(o=>{if(o.isSkinnedMesh)o.skeleton?.dispose?.();});}
  function clearFamilyPlayerAvatar(){
    const visual=playerModel?.userData?.familyAvatar;if(!visual)return;
    if(toolVisual&&visual.group.getObjectById(toolVisual.id)){playerModel.userData.parts.rightArm.add(toolVisual);toolVisual.position.set(0,-1.12,.14);}
    releaseFamilyAvatarVisual(visual.group);playerModel.userData.familyAvatar=null;
  }
  function applyFamilyPlayerAvatar(id){
    if(!playerModel?.userData?.parts||!familyWorld.actors[id])return false;
    let visual=playerModel.userData.familyAvatar;
    if(visual?.id!==id){clearFamilyPlayerAvatar();visual=familyCloneAvatar(id,playerModel,Number(playerModel.userData.baseY||0));playerModel.userData.familyAvatar=visual;}
    playerModel.userData.parts.body.parent.visible=false;if(avatarLayer)avatarLayer.visible=false;
    playerModel.userData.toyTheme='family-'+id;return!!visual;
  }
  function applyFamilyRemoteAvatar(ghost,avatar){
    const id=familyCharacterId(avatar.bodyStyle),root=ghost.userData.avatar;if(!id)return false;
    const visual=familyCloneAvatar(id,root);if(!visual)return false;
    ghost.userData.familyAvatar=visual;ghost.userData.limbs=Object.fromEntries(['leftArm','rightArm','leftLeg','rightLeg'].map(key=>[key,new THREE.Group()]));
    root.userData.remoteAvatar=avatar;root.userData.toyTheme='family-'+id;ghost.userData.avatarSignature=multiplayerAvatarSignature(avatar);return true;
  }
  function familyAnimateAvatar(visual,parts,{speed=0,run=false,jump=false,emote='',special=false,sitting=false,time=0}={}){
    const walk=Math.min(1,speed/5);
    familyWorld.studio.drawHuman(visual.id,0,0,0,walk,run,jump?.3:0,time,0,emote==='wave'?1:0);
    visual.source.joints.forEach((joint,i)=>visual.bones[i].rotation.set(...joint.rot,'YXZ'));
    if(special&&emote!=='wave')for(const[part,bone]of[['leftArm','shoulder-1'],['rightArm','shoulder1'],['leftLeg','hip-1'],['rightLeg','hip1']]){
      if(parts?.[part]&&visual.byName[bone])visual.byName[bone].rotation.copy(parts[part].rotation);
    }
    if(sitting)for(const sign of[-1,1]){visual.byName['hip'+sign].rotation.x=-1.25;visual.byName['knee'+sign].rotation.x=1.25;visual.byName['ankle'+sign].rotation.x=0;}
  }
  function familyAttachTool(visual,tool){
    const hand=visual.byName.hand1;if(tool&&hand&&tool.parent!==hand){hand.add(tool);tool.position.set(0,-.13,.07);}
  }
  function updateFamilyPlayableVisuals(){
    const visual=playerModel?.userData?.familyAvatar;
    if(visual){
      if(avatarLayer)avatarLayer.visible=false;
      const active=performance.now()<player.emoteUntil;
      familyAnimateAvatar(visual,playerModel.userData.parts,{speed:player.vehicle||player.boating||player.swimming?0:Math.hypot(player.vx,player.vz),run:!!input.isSprinting,jump:!player.grounded,emote:active?player.emoteType:'',special:active||player.swimming||!!fishingVisual?.active,sitting:performance.now()<player.sitUntil,time:animTime});
      familyAttachTool(visual,toolVisual);
    }
    for(const ghost of world.ghosts.values()){
      const v=ghost.userData.familyAvatar;if(!v)continue;const target=ghost.userData.target||{},pose=ghost.userData.v2Pose||{},emote=performance.now()<Number(ghost.userData.emoteUntil||0)?ghost.userData.emoteType:String(target.actionMode||'');
      const moving=Math.hypot(Number(pose.vx||0),Number(pose.vz||0))>.2||Math.hypot(ghost.position.x-Number(v.lastX??ghost.position.x),ghost.position.z-Number(v.lastZ??ghost.position.z))>.001;
      v.lastX=ghost.position.x;v.lastZ=ghost.position.z;
      familyAnimateAvatar(v,ghost.userData.limbs,{speed:moving?5:0,emote,special:!!emote,sitting:!!target.vehicle,time:animTime+Number(ghost.userData.phase||0)});familyAttachTool(v,ghost.userData.remoteTool);
    }
  }
  function selectFamilyCharacter(id){
    if(!['thiago','thamis'].includes(id))return false;
    state.avatar=normalizeAvatarV2({...state.avatar,bodyStyle:'family-'+id,renderMode:'otthi-world-v3'});familyWorld.portraitUntil=0;
    applyAvatarCustomization();saveState(true);updateMultiplayer(0,true);closeModal();toast('Você está jogando como '+(id==='thiago'?'Thiago':'Thamis')+'.','good',2400);return true;
  }
  function selectFamilyParty(value){
    if(player.vehicle||player.boating){toast('Saia do veículo para reunir o grupo.','warn',1700);return false;}
    const party=normalizeFamilyParty(value);
    if(!familyCommand('party',party))return false;
    familyProgress().party=party;
    return selectFamilyCharacter(party.controller);
  }
  function familyMapLocations(){if(!familyWorld.location)return[];const p=familyWorld.location;return[{id:'family-home',name:p.meetingOnly?'Encontro da Família':'Casa da Família',icon:'🐾',group:'Aventuras em Família',x:p.x,z:p.z+6,description:'Thiago, Thamis, Luna e Liz. Passeio ao parque, brinquedos e desafios da oficina e tecnologia.',actions:['Encontrar a família','Brincar com as cachorrinhas','Começar um passeio']},...['park','workshop','tech'].map(kind=>{const point=worldLayoutPoint(kind==='park'?'playground':kind==='workshop'?'workshop':'learningEntrance');return{id:'family-'+kind,name:kind==='park'?'Passeio da Família no parque':kind==='workshop'?'Família na oficina':'Família no laboratório',icon:kind==='park'?'🐾':kind==='workshop'?'🔧':'💻',group:'Aventuras em Família',x:point.x,z:point.z,navX:point.x,navZ:point.z+(kind==='workshop'?6:0)};})];}
  function familyRoute(id){setWaypoint(id);}
  function familyNear(){return familyWorld.location&&((familyWorld.walkOwner&&familyWorld.walkOwner===sharedWorldOwnId())||Object.values(familyWorld.actors).some(a=>Math.hypot(player.x-a.x,player.z-a.z)<16));}
  function familyCommand(kind,payload={}){
    if(!familyWorld.ready)return false;
    if(kind!=='party'&&!familyNear()){familyRoute('family-home');toast('Encontre a família seguindo o GPS.','good',2000);return false;}
    if((kind==='party'||kind==='walk')&&familyWorld.walkOwner&&familyWorld.walkOwner!==sharedWorldOwnId()){toast('A família já está passeando com outro participante.','warn',2000);return false;}
    if(kind==='walk')payload={...normalizeFamilyParty(familyProgress().party),...payload};
    if(!sharedWorldIsAuthority()&&window.OTTHOS_RTDB?.connected?.()){
      window.OTTHOS_RTDB.sendEventV2('family-command',{kind,...payload}).then(r=>{if(!r?.ok)toast('Não foi possível enviar. Tente novamente perto da família.','warn',2000);});return true;
    }
    return familyApplyCommand(kind,payload,sharedWorldOwnId(),player);
  }
  function familyClear(a,b){const length=Math.hypot(b.x-a.x,b.z-a.z),steps=Math.max(1,Math.ceil(length/.22));for(let i=0;i<=steps;i++){const t=i/steps;if(positionBlockedForPlayer(lerp(a.x,b.x,t),lerp(a.z,b.z,t),.25))return false;}return true;}
  function familyApplyCommand(kind,payload,owner,origin){
    if(!origin||!Number.isFinite(Number(origin.x))||!Number.isFinite(Number(origin.z)))return false;
    if(kind==='party'){
      if(familyWorld.walkOwner&&familyWorld.walkOwner!==owner)return false;
      const party=normalizeFamilyParty(payload);familyWorld.walkOwner=owner;familyWorld.walkMembers=party.members;familyWorld.walkController=party.controller;
      for(const [index,id]of party.members.entries()){
        const actor=familyWorld.actors[id];if(!actor)continue;
        if(id===party.controller){actor.x=Number(origin.x);actor.z=Number(origin.z);continue;}
        // Reunite at a free nearby position; do not put a companion inside a wall.
        const facing=Number(origin.facing??origin.r??0);
        let placed=false;
        for(const radius of [2.4,3.5,4.8]){for(const offset of [(index-1)*.7,1.4,-1.4,2.2,-2.2]){
          const angle=facing+Math.PI+offset,x=Number(origin.x)+Math.sin(angle)*radius,z=Number(origin.z)+Math.cos(angle)*radius;
          if(!positionBlockedForPlayer(x,z,.3)&&!waterAt(x,z)&&familyClear(origin,{x,z})){actor.x=x;actor.z=z;placed=true;break;}
        }if(placed)break;}
        actor.path=[];actor.routeAt=0;
      }
      return true;
    }
    const nearby=Object.values(familyWorld.actors).some(a=>Math.hypot(origin.x-a.x,origin.z-a.z)<18);
    if(!nearby&&familyWorld.walkOwner!==owner)return false;
    if(kind==='work'){familyWorld.workUntil=familyWorld.clock+2.5;familyWorld.workKind=payload.activity==='workshop'?'garage:meter':'code:review';return true;}
    if(kind==='walk'){if(familyWorld.walkOwner&&familyWorld.walkOwner!==owner)return false;const party=normalizeFamilyParty(owner===sharedWorldOwnId()?familyProgress().party:payload);familyWorld.walkOwner=owner;familyWorld.walkMembers=party.members;familyWorld.walkController=familyCharacterId(origin.avatar?.bodyStyle||(owner===sharedWorldOwnId()?state.avatar?.bodyStyle:''));return true;}
    if(kind==='stop'){if(familyWorld.walkOwner&&familyWorld.walkOwner!==owner)return false;familyWorld.walkOwner='';familyWorld.walkMembers=[];familyWorld.walkController='';return true;}
    if(kind!=='throw'||familyWorld.ball)return false;
    const dog=payload.dog==='liz'?'liz':'luna',actor=familyWorld.actors[dog];
    if(Math.hypot(origin.x-actor.x,origin.z-actor.z)>18){if(owner===sharedWorldOwnId())toast(familyName(dog)+' está longe. Inclua-a no grupo ou encontre-a em casa.','warn',2200);return false;}
    let at=null;const heading=Number(origin.facing??origin.r??0);
    for(const angle of [0,.45,-.45,.9,-.9,Math.PI]){const x=Number(origin.x)+Math.sin(heading+angle)*7,z=Number(origin.z)+Math.cos(heading+angle)*7;if(!positionBlockedForPlayer(x,z,.3)&&!waterAt(x,z)&&!(world.houses||[]).some(h=>Math.abs(x-h.x)<(h.w||9)/2+1.2&&Math.abs(z-h.z)<(h.d||7)/2+1.2)&&familyClear(actor,{x,z})&&familyClear({x,z},origin)){at={x,z};break;}}
    if(!at){if(owner===sharedWorldOwnId())toast('Encontre um espaço livre para lançar o brinquedo.','warn',1700);return false;}
    familyWorld.sequence++;familyWorld.ball={id:sharedWorldOwnId()+':'+Date.now()+':'+familyWorld.sequence,owner,dog,kind:['ball','disk','bone'].includes(payload.toy)?payload.toy:'ball',stage:'flight',t:0,start:{x:Number(origin.x),z:Number(origin.z)},land:at,at:{x:Number(origin.x),y:1.5,z:Number(origin.z)}};return true;
  }
  function familyMove(actor,target,speed,dt){
    const dx=target.x-actor.x,dz=target.z-actor.z,distance=Math.hypot(dx,dz);actor.moving=0;if(distance<.30)return true;
    let dest=target;
    if(!familyClear(actor,target)&&distance>1.4){
      if(familyWorld.clock-actor.routeAt>1.2||!actor.path.length){actor.path=buildRoutePoints(actor,{x:target.x,z:target.z,navX:target.x,navZ:target.z});actor.routeAt=familyWorld.clock;}
      while(actor.path.length&&Math.hypot(actor.path[0].x-actor.x,actor.path[0].z-actor.z)<1.1)actor.path.shift();
      if(actor.path.length)dest=actor.path[0];
    }else actor.path=[];
    const heading=Math.atan2(dest.x-actor.x,dest.z-actor.z),step=Math.min(distance,speed*dt);
    for(const turn of [0,.45,-.45,.9,-.9,1.35,-1.35]){const x=actor.x+Math.sin(heading+turn)*step,z=actor.z+Math.cos(heading+turn)*step;if(!positionBlockedForPlayer(x,z,.18)&&familyClear(actor,{x,z})){actor.x=x;actor.z=z;actor.heading=heading+turn;actor.moving=1;return distance<=.45;}}
    return false;
  }
  function familyOwnerPosition(owner){return owner===sharedWorldOwnId()?player:remotePresence.get(String(owner));}
  function familyCollectAck(ack){
    if(!ack||ack.id===familyWorld.lastAck)return;familyWorld.lastAck=ack.id;
    if(ack.owner!==sharedWorldOwnId())return;
    const progress=familyProgress();if(progress.lastDeliveryId===ack.id)return;progress.lastDeliveryId=ack.id;progress.deliveries[ack.dog]=(Number(progress.deliveries[ack.dog])||0)+1;saveState();toast((ack.dog==='luna'?'Luna':'Liz')+' devolveu o brinquedo!','good',1800);beep(780,65);
  }
  function familySnapshot(){if(!familyWorld.ready)return null;return{actors:Object.values(familyWorld.actors).map(a=>({id:a.id,x:+a.x.toFixed(3),z:+a.z.toFixed(3),heading:+a.heading.toFixed(3),moving:a.moving})),ball:familyWorld.ball?JSON.parse(JSON.stringify(familyWorld.ball)):null,walkOwner:familyWorld.walkOwner,walkMembers:[...familyWorld.walkMembers],walkController:familyWorld.walkController,ack:familyWorld.ack,clock:familyWorld.clock,workUntil:familyWorld.workUntil,workKind:familyWorld.workKind||null};}
  function familyApplySnapshot(data,dt){
    if(!data||!Array.isArray(data.actors))return;
    for(const row of data.actors){const a=familyWorld.actors[row.id];if(!a||![row.x,row.z,row.heading].every(Number.isFinite))continue;a.x=lerp(a.x,row.x,Math.min(1,dt*10));a.z=lerp(a.z,row.z,Math.min(1,dt*10));a.heading=lerpAngle(a.heading,row.heading,Math.min(1,dt*12));a.moving=Number(row.moving)||0;}
    const previousBall=familyWorld.ball,nextBall=data.ball&&['luna','liz'].includes(data.ball.dog)?JSON.parse(JSON.stringify(data.ball)):null;if(nextBall?.at&&previousBall?.id===nextBall.id&&previousBall?.at){for(const axis of ['x','y','z'])nextBall.at[axis]=lerp(previousBall.at[axis],Number(nextBall.at[axis])||0,Math.min(1,dt*14));}familyWorld.ball=nextBall;familyWorld.walkOwner=String(data.walkOwner||'');familyWorld.walkMembers=Array.isArray(data.walkMembers)?FAMILY_MEMBERS.filter(id=>data.walkMembers.includes(id)):FAMILY_MEMBERS.slice();familyWorld.walkController=['thiago','thamis'].includes(data.walkController)?data.walkController:'';const remoteClock=Number(data.clock);if(Number.isFinite(remoteClock))familyWorld.clock=Math.abs(remoteClock-familyWorld.clock)>2?remoteClock:lerp(familyWorld.clock,remoteClock,.035);familyWorld.workUntil=Number(data.workUntil)||0;familyWorld.workKind=String(data.workKind||'');familyWorld.ack=data.ack;familyCollectAck(data.ack);
  }
  function updateFamilyAdventure(dt){
    if(!familyWorld.ready)return;const wall=performance.now();dt=wall>Number(familyWorld.lastWall)?Math.min(.6,(wall-familyWorld.lastWall)/1000):dt;familyWorld.lastWall=wall;if(document.hidden)return;familyWorld.clock+=dt;const authority=sharedWorldIsAuthority();
    if(!authority){const host=remotePresence.get(sharedWorldAuthorityId()),snapshot=(typeof multiplayerV2WorldSnapshot==='function'?multiplayerV2WorldSnapshot():null)||host?.sharedScene;familyApplySnapshot(snapshot?.f,dt);}
    else{
      if(familyWorld.restoreParty){familyWorld.restoreParty=false;if(!familyWorld.walkOwner)familyApplyCommand('party',familyProgress().party,sharedWorldOwnId(),player);}
      const owner=familyOwnerPosition(familyWorld.walkOwner),follow=owner&&!familyRideForOwner(familyWorld.walkOwner)?owner:null;
      if(familyWorld.walkOwner&&!owner){familyWorld.walkOwner='';familyWorld.walkMembers=[];familyWorld.walkController='';}
      if(follow){const actual=familyCharacterId(owner.avatar?.bodyStyle||(familyWorld.walkOwner===sharedWorldOwnId()?state.avatar?.bodyStyle:''));if(actual!==familyWorld.walkController){familyWorld.walkController=actual;if(actual&&!familyWorld.walkMembers.includes(actual))familyWorld.walkMembers.push(actual);}}
      const companions=familyWorld.walkMembers.filter(id=>id!==familyWorld.walkController);
      for(const [index,a] of Object.values(familyWorld.actors).entries()){
        if(familyRideForOwner(familyWorld.walkOwner)&&familyWorld.walkMembers.includes(a.id))continue;
        if(familyWorld.ball&&a.id===familyWorld.ball.dog)continue;
        if(follow&&a.id===familyWorld.walkController){a.x=follow.x;a.z=follow.z;a.heading=follow.facing??follow.r??0;a.moving=Math.hypot(follow.vx||0,follow.vz||0)>.2?1:0;continue;}
        const following=!!follow&&companions.includes(a.id),slot=companions.indexOf(a.id),heading=(follow?.facing??follow?.r??0),side=(slot-(companions.length-1)/2)*1.15;
        const home=familyWorld.location,target=following?{x:follow.x-Math.sin(heading)*2.6+Math.cos(heading)*side,z:follow.z-Math.cos(heading)*2.6-Math.sin(heading)*side}:{x:home.x+(index%2?.8:-.8),z:home.z+5.5+Math.floor(index/2)*1.4};
        const gap=Math.hypot(target.x-a.x,target.z-a.z);
        familyMove(a,target,following?(gap>5?7.2:4.6):2.1,dt);if(!following&&!a.moving&&familyNear())a.heading=performance.now()<Number(familyWorld.portraitUntil||0)?0:Math.atan2(player.x-a.x,player.z-a.z);
      }
      const b=familyWorld.ball;
      if(b){const dog=familyWorld.actors[b.dog],origin=familyOwnerPosition(b.owner);if(!origin){familyWorld.ball=null;}else if(b.stage==='flight'){b.t=Math.min(1,b.t+dt/0.85);b.at={x:lerp(b.start.x,b.land.x,b.t),z:lerp(b.start.z,b.land.z,b.t),y:lerp(1.5,.22,b.t)+Math.sin(b.t*Math.PI)*2.2};if(b.t>=1)b.stage='seek';}
        else if(b.stage==='seek'){if(familyMove(dog,b.land,5.8,dt))b.stage='return';}
        else if(b.stage==='return'){b.at={x:dog.x+Math.sin(dog.heading)*.4,y:groundHeightAt(dog.x,dog.z)+.55,z:dog.z+Math.cos(dog.heading)*.4};if(familyMove(dog,origin,5.1,dt)){familyWorld.ack={id:b.id,dog:b.dog,owner:b.owner};familyCollectAck(familyWorld.ack);familyWorld.ball=null;}}
      }
    }
    updateFamilyCarry();updateFamilyRemoteAircraft(dt);
    const progress=familyProgress(),park=worldLayoutPoint('playground',{x:-28,z:-40});
    if(familyWorld.walkOwner===sharedWorldOwnId()&&Math.hypot(player.x-park.x,player.z-park.z)<12&&familyWorld.walkMembers.every(id=>Math.hypot(familyWorld.actors[id].x-park.x,familyWorld.actors[id].z-park.z)<14)&&!progress.flags.park){progress.flags.park=true;saveState();toast('Passeio em família concluído no parque!','good',2300);}
    const visible=Object.values(familyWorld.actors).some(a=>Math.hypot(player.x-a.x,player.z-a.z)<90);
    for(const a of Object.values(familyWorld.actors)){
      const controlled=familyWorld.walkOwner&&a.id===familyWorld.walkController&&performance.now()>Number(familyWorld.portraitUntil||0);
      a.group.visible=(visible||!!a.ridePose)&&(!controlled||!!a.ridePose);a.shadow.visible=visible&&!controlled&&!a.ridePose;if(a.label){a.label.visible=visible&&!controlled&&!a.ridePose&&Math.hypot(player.x-a.x,player.z-a.z)<23;a.label.position.set(a.x,groundHeightAt(a.x,a.z)+(a.id==='thiago'||a.id==='thamis'?2.4:.98),a.z);}if(!visible&&!a.ridePose)continue;
      const dog=a.id==='luna'||a.id==='liz',work=!dog&&familyWorld.workUntil>familyWorld.clock;
      if(dog)familyWorld.studio.drawDog(a.id,0,0,0,a.moving,a.id==='luna'?0:1.5,familyWorld.clock,!!familyWorld.ball&&familyWorld.ball.dog===a.id&&familyWorld.ball.stage==='return');
      else familyWorld.studio.drawHuman(a.id,0,0,0,a.moving,false,0,familyWorld.clock,a.id==='thiago'&&familyWorld.ball?.stage==='flight'?1-familyWorld.ball.t:0,0,work?1:0,work?familyWorld.workKind:null);
      if(a.ridePose&&!dog)for(const joint of a.joints){if(/^hip-?1$/.test(joint.name))joint.rot[0]=-1.25;if(/^knee-?1$/.test(joint.name))joint.rot[0]=1.25;if(/^ankle-?1$/.test(joint.name))joint.rot[0]=0;}
      for(let i=0;i<a.bones.length;i++){const rot=a.joints[i].rot;a.bones[i].rotation.set(rot[0],rot[1],rot[2],'YXZ');}
      const y=groundHeightAt(a.x,a.z);if(a.ridePose){const p=a.ridePose;a.group.position.set(p.x,p.y,p.z);a.group.quaternion.copy(p.q);a.group.scale.setScalar(a.scale*p.scale);}else{a.group.position.set(a.x,y+(dog ? .012 : -.038),a.z);a.group.rotation.set(0,a.heading,0);a.group.scale.setScalar(a.scale);}a.shadow.position.set(a.x,y+.025,a.z);
    }
    const b=familyWorld.ball;familyWorld.toyMesh.visible=!!b&&visible;
    if(b){const mesh=familyWorld.toyMesh;mesh.position.set(b.at.x,b.stage==='flight'?b.at.y+groundHeightAt(b.at.x,b.at.z):b.at.y,b.at.z);mesh.scale.set(b.kind==='disk'?1.5:b.kind==='bone'?1.6:1,b.kind==='disk'?.3:b.kind==='bone'?.6:1,1);mesh.rotation.y+=dt*7;}
  }
  function familyTask(kind){
    const progress=familyProgress(),destination=kind==='workshop'?worldLayoutPoint('workshop',{x:22,z:-18}):worldLayoutPoint('learningEntrance',{x:14,z:-40});
    if(Math.hypot(player.x-destination.x,player.z-destination.z)>20){familyCommand('walk');familyRoute(kind==='workshop'?'family-workshop':'family-tech');toast('Siga o GPS e abra a tarefa ao chegar.','good',1900);return;}
    const tasks=FAMILY_TASKS[kind];
    let step=0;
    function show(){if(step===tasks.length){progress.flags[kind]=true;saveState();familyCommand('work',{activity:kind});openModal('Desafio concluído','<p>✓ '+(kind==='workshop'?'Conexão testada e resultado conferido sob carga.':'Alteração validada preservando os dados.')+'</p><button class="btn primary" data-family-back>Voltar à família</button>',root=>$('[data-family-back]',root).onclick=openFamilyAdventure);return;}
      const task=tasks[step];openModal((kind==='workshop'?'Oficina':'Tecnologia')+' • '+(step+1)+'/'+tasks.length,'<p>'+task.q+'</p><div class="choice-grid">'+task.a.map((a,i)=>'<button class="choice" data-family-answer="'+i+'">'+a+'</button>').join('')+'</div><p data-family-feedback role="status"></p>',root=>$$('[data-family-answer]',root).forEach(button=>button.onclick=()=>{if(Number(button.dataset.familyAnswer)!==task.ok){$('[data-family-feedback]',root).textContent='Confira a evidência antes de escolher.';return;}familyCommand('work',{activity:kind});step++;show();}));}
    show();
  }
  function familyPartyEditor(){
    const saved=familyProgress().party||{},controller=familyCharacterId(state.avatar?.bodyStyle)||saved.controller||'thiago',party=normalizeFamilyParty({...saved,controller});
    return '<section class="family-party" aria-labelledby="family-party-title"><h3 id="family-party-title">Monte seu grupo</h3><p>Você controla uma pessoa. Os familiares escolhidos acompanham você pelo mundo.</p><fieldset><legend>Quem você controla?</legend><div class="family-party-people">'+['thiago','thamis'].map(id=>'<label><input type="radio" name="family-controller" data-family-controller="'+id+'" '+(id===party.controller?'checked':'')+'>'+familyName(id)+'</label>').join('')+'</div></fieldset><div class="family-party-shortcuts"><button class="btn" data-family-all>Todos</button><button class="btn" data-family-alone>Só eu</button></div><fieldset><legend>Quem vai junto?</legend><div class="family-party-members">'+FAMILY_MEMBERS.map(id=>'<label><input type="checkbox" data-family-member="'+id+'" '+(party.members.includes(id)?'checked ':'')+(id===party.controller?'disabled':'')+'>'+familyName(id)+'</label>').join('')+'</div></fieldset><p class="family-party-summary" data-family-summary role="status" aria-live="polite"></p><button class="btn primary" data-family-apply>Jogar com este grupo</button></section>';
  }
  function bindFamilyPartyEditor(root){
    const controller=()=> $('[data-family-controller]:checked',root).dataset.familyController;
    const refresh=()=>{
      const id=controller();$$('[data-family-member]',root).forEach(b=>{b.disabled=b.dataset.familyMember===id;if(b.disabled)b.checked=true;});
      $('[data-family-summary]',root).textContent=FAMILY_MEMBERS.filter(id=>$('[data-family-member="'+id+'"]',root).checked).map(familyName).join(' + ');
    };
    $$('[data-family-controller],[data-family-member]',root).forEach(b=>b.onchange=refresh);
    $('[data-family-all]',root).onclick=()=>{$$('[data-family-member]',root).forEach(b=>b.checked=true);refresh();};
    $('[data-family-alone]',root).onclick=()=>{$$('[data-family-member]',root).forEach(b=>b.checked=b.dataset.familyMember===controller());refresh();};
    $('[data-family-apply]',root).onclick=()=>{const members=$$('[data-family-member]',root).filter(b=>b.checked).map(b=>b.dataset.familyMember);if(selectFamilyParty({controller:controller(),members}))toast('Seu grupo: '+members.map(familyName).join(' + ')+'.','good',3000);};
    refresh();
  }
  function openFamilyAdventure(){
    const p=familyProgress(),name=familyWorld.location?.meetingOnly?'Encontro da Família':'Casa da Família';
    openModal('🐾 '+name,familyPartyEditor()+'<label class="field"><span>Brinquedo para buscar</span><select data-family-toy>'+[['ball','⚽ Bolinha'],['disk','🥏 Disco'],['bone','🦴 Ossinho']].map(([id,label])=>'<option value="'+id+'" '+(p.toy===id?'selected':'')+'>'+label+'</option>').join('')+'</select></label><p>Thiago de óculos e polo azul, Thamis de óculos e cabelo cacheado preso, Luna de coleira rosa e Liz de laços vermelhos. Quem ficar fora do grupo espera no jardim da Casa da Família.</p><p>Escolha Encontrar a família para seguir o GPS. Perto deles, feche esta janela para vê-los de frente.</p><div class="family-chapters"><p>'+(p.flags.park?'✓':'○')+' Passear até o parque</p><p>'+(p.deliveries.luna>=2&&p.deliveries.liz>=2?'✓':'○')+' Brincar com as duas: Luna '+p.deliveries.luna+'/2 · Liz '+p.deliveries.liz+'/2</p><p>'+(p.flags.workshop?'✓':'○')+' Diagnóstico na oficina</p><p>'+(p.flags.technology?'✓':'○')+' Desafio de tecnologia</p></div><div class="choice-grid"><button class="choice" data-family-gps>📍 Encontrar a família</button><button class="choice" data-family-walk>🚶 Passeio até o parque</button><button class="choice" data-family-throw="luna">🤍 Lançar para Luna</button><button class="choice" data-family-throw="liz">🖤 Lançar para Liz</button><button class="choice" data-family-task="workshop">🔧 Oficina</button><button class="choice" data-family-task="technology">💻 Tecnologia</button><button class="choice" data-family-stop>🏡 Encerrar passeio</button><a class="choice" href="../familia/3d/">Abrir aventuras originais da Família</a></div>',root=>{
      $('[data-family-gps]',root).onclick=()=>familyRoute('family-home');
      bindFamilyPartyEditor(root);$('[data-family-toy]',root).onchange=e=>{p.toy=e.target.value;familyWorld.toy=p.toy;saveState(true);};
      const portrait=document.createElement('button');portrait.className='choice';portrait.dataset.familyPortrait='';portrait.textContent='📷 Ver os quatro personagens';portrait.onclick=()=>{if(!familyNear()){familyRoute('family-home');return;}familyWorld.portraitUntil=Infinity;closeModal();toast('Thiago, Thamis, Luna e Liz. Caminhe ou arraste a câmera para voltar.','good',4500);};root.querySelector('.choice-grid').prepend(portrait);
      $('[data-family-walk]',root).onclick=()=>{if(player.vehicle){toast('Saia do veículo para iniciar o passeio.','warn',1500);return;}if(familyCommand('walk')){familyRoute('family-park');closeModal();toast('Vamos juntos ao parque. Caminhe e espere a família.','good',2500);}};
      $$('[data-family-throw]',root).forEach(button=>button.onclick=()=>{if(familyCommand('throw',{dog:button.dataset.familyThrow,toy:p.toy})){closeModal();toast('Brinquedo lançado. Espere a devolução!','good',1600);}});
      $$('[data-family-task]',root).forEach(button=>button.onclick=()=>familyTask(button.dataset.familyTask));
      $('[data-family-stop]',root).onclick=()=>{familyCommand('stop');closeModal();};
    });
  }
  window.addEventListener('otthi:event-v2',event=>{const e=event.detail;if(e?.kind!=='family-command'||!sharedWorldIsAuthority()||!e.actorUid)return;familyApplyCommand(e.payload?.kind,e.payload||{},String(e.actorUid),remotePresence.get(String(e.actorUid)));});
  window.OTTHI_FAMILY={remoteAvatars:()=>[...world.ghosts.entries()].map(([uid,g])=>({uid,id:g.userData.familyAvatar?.id||'',bones:g.userData.familyAvatar?.bones.length||0,visible:!!g.userData.familyAvatar?.group.visible&&g.visible,signature:g.userData.avatarSignature})),playerAvatar:()=>{const v=playerModel?.userData?.familyAvatar;return v?{id:v.id,bones:v.bones.length,meshVisible:v.mesh.visible&&v.group.visible&&playerModel.visible,baseHidden:!playerModel.userData.parts.body.parent.visible,position:playerGroup.position.toArray(),arm:v.byName.shoulder1.rotation.toArray(),leg:v.byName['hip1'].rotation.toArray(),toolInHand:!!toolVisual&&toolVisual.parent===v.byName.hand1}:null;},open:openFamilyAdventure,cameraFrame:familyCameraFrame,throwToy:(dog='luna')=>familyCommand('throw',{dog}),startWalk:()=>familyCommand('walk'),snapshot:familySnapshot,diagnostics:()=>({ready:familyWorld.ready,home:familyWorld.location,actors:Object.values(familyWorld.actors).map(a=>({id:a.id,x:a.x,z:a.z,bones:a.bones.length,vertices:a.vertices,uniqueVertices:a.uniqueVertices,drawCalls:1})),progress:familyProgress(),party:{owner:familyWorld.walkOwner,controller:familyWorld.walkController,members:[...familyWorld.walkMembers]},ride:familyWorld.ride||null,seated:Object.values(familyWorld.actors).filter(a=>a.ridePose).map(a=>({id:a.id,visible:a.group.visible,position:a.group.position.toArray(),scale:a.group.scale.x,seat:a.ridePose.seat})),authority:sharedWorldIsAuthority(),ball:familyWorld.ball?.stage||null}),applySnapshot:familyApplySnapshot};

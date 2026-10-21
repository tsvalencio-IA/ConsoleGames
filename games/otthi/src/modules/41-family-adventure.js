/** Family activities use the approved HQ rigs and OTThi's world, GPS and room authority. */
// @otthi-module-body
  const FAMILY_TASKS={"workshop": [{"q": "O cliente relata que a bateria descarrega mesmo com o motor funcionando. Escolha o primeiro procedimento.", "a": ["Trocar a bateria imediatamente", "Medir tensão na bateria e saída do alternador", "Trocar o módulo de injeção"], "ok": 1, "explain": "Antes de trocar peças, precisamos comparar as tensões."}, {"q": "Dados SIMULADOS: motor desligado 12,5 V; motor ligado na bateria 12,1 V; saída do alternador 14,0 V. Qual é a suspeita principal?", "a": ["Queda de tensão entre alternador e bateria", "Defeito no pneu dianteiro", "Bateria com carga perfeita e nenhum problema"], "ok": 0, "explain": "O alternador apresenta 14,0 V na saída, mas essa tensão não chega à bateria."}, {"q": "Qual teste confirma a suspeita sem trocar peças?", "a": ["Desconectar componentes aleatoriamente", "Medir queda de tensão no cabo positivo e nos aterramentos sob carga", "Trocar o alternador por tentativa"], "ok": 1, "explain": "O teste de queda de tensão sob carga permite localizar resistência excessiva."}, {"q": "Foi encontrada conexão oxidada com queda excessiva. O que fazer?", "a": ["Reparar e limpar a conexão, reapertar e retestar com carga", "Ignorar a conexão", "Apagar códigos e devolver o carro"], "ok": 0, "explain": "Reparo confirmado com reteste de tensão. A situação é fictícia e didática."}], "technology": [{"q": "A lista de peças traz um item excluído de volta. Qual regra evita o problema?", "a": ["Recriar todos os itens no carregamento", "Respeitar o ID e o estado de exclusão persistido", "Apagar o histórico"], "ok": 1, "explain": ""}, {"q": "Pedido total = preço × quantidade. Para 3 itens de R$ 20, qual expressão é correta?", "a": ["20 + 3 = 23", "20 / 3", "20 * 3 = 60"], "ok": 2, "explain": ""}, {"q": "Uma tela no celular apresenta rolagem horizontal indesejada. O que verificar?", "a": ["Larguras fixas e elementos fora da viewport", "Apagar o projeto", "Diminuir apenas a fonte"], "ok": 0, "explain": ""}, {"q": "Antes de lançar uma nova versão, qual procedimento?", "a": ["Publicar diretamente sem conferir", "Testar as interações e regressões no mobile e desktop", "Ocultar os erros"], "ok": 1, "explain": ""}]};
  const familyWorld={ready:false,studio:null,actors:{},ball:null,selectedDog:'luna',toy:'ball',walkOwner:'',ack:null,lastAck:'',clock:0,frame:0,workUntil:0,location:null,sequence:0};
  function familyProgress(){
    if(!state.familyAdventure||typeof state.familyAdventure!=='object')state.familyAdventure={deliveries:{luna:0,liz:0},flags:{}};
    const progress=state.familyAdventure;
    progress.deliveries={luna:0,liz:0,...progress.deliveries};progress.flags={...progress.flags};return progress;
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
    const pos=[],norm=[],colors=[],indices=[],weights=[];
    for(const {data,index,bone} of buffers){const normal=new THREE.Matrix3().getNormalMatrix(bone.matrixWorld),point=new THREE.Vector3(),n=new THREE.Vector3();for(let k=0;k<data.length;k+=9){point.set(data[k],data[k+1],data[k+2]).applyMatrix4(bone.matrixWorld);n.set(data[k+3],data[k+4],data[k+5]).applyMatrix3(normal).normalize();pos.push(point.x,point.y,point.z);norm.push(n.x,n.y,n.z);colors.push(data[k+6],data[k+7],data[k+8]);indices.push(index,0,0,0);weights.push(1,0,0,0);}}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));geometry.computeBoundingSphere();
    const mesh=new THREE.SkinnedMesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,skinning:true,roughness:.83,metalness:.015}));group.add(mesh);mesh.bind(new THREE.Skeleton(bones));mesh.frustumCulled=false;
    const scale=(id==='thiago'||id==='thamis') ? .64*(rig.scale||1) : .7;group.scale.setScalar(scale);worldGroup.add(group);
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(id==='luna'||id==='liz'?.42:.40,20),new THREE.MeshBasicMaterial({color:0x10232a,transparent:true,opacity:.19,depthWrite:false}));shadow.rotation.x=-Math.PI/2;worldGroup.add(shadow);
    return {id,x,z,heading:0,moving:0,group,mesh,shadow,bones,joints,scale,path:[],routeAt:0,vertices:pos.length/3};
  }
  function familyHomeLocation(){
    // A new free lot is selected without moving a road, house or existing activity.
    for(const x of [-38,-40,-34,-44,-32])for(const z of [-24,-28,-32,-16]){
      if(waterAt(x,z)||v704RoadAt(x,z,1,false))continue;
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
    familyWorld.ready=true;familyProgress();
    if(new URLSearchParams(locationSearch()).get('family')==='1')familyRoute('family-home');
  }
  function locationSearch(){return window.location?.search||'';}
  function familyMapLocations(){if(!familyWorld.location)return[];const p=familyWorld.location;return[{id:'family-home',name:p.meetingOnly?'Encontro da Família':'Casa da Família',icon:'🐾',group:'Aventuras em Família',x:p.x,z:p.z+6,description:'Thiago, Thamis, Luna e Liz. Passeio ao parque, brinquedos e desafios da oficina e tecnologia.',actions:['Encontrar a família','Brincar com as cachorrinhas','Começar um passeio']},...['park','workshop','tech'].map(kind=>{const point=worldLayoutPoint(kind==='park'?'playground':kind==='workshop'?'workshop':'learningEntrance');return{id:'family-'+kind,name:kind==='park'?'Passeio da Família no parque':kind==='workshop'?'Família na oficina':'Família no laboratório',icon:kind==='park'?'🐾':kind==='workshop'?'🔧':'💻',group:'Aventuras em Família',x:point.x,z:point.z,navX:point.x,navZ:point.z+(kind==='workshop'?6:0)};})];}
  function familyRoute(id){setWaypoint(id);}
  function familyNear(){return familyWorld.location&&Math.hypot(player.x-familyWorld.actors.thiago.x,player.z-familyWorld.actors.thiago.z)<16;}
  function familyCommand(kind,payload={}){
    if(!familyWorld.ready)return false;
    if(!familyNear()){familyRoute('family-home');toast('Encontre a família seguindo o GPS.','good',2000);return false;}
    if(!sharedWorldIsAuthority()&&window.OTTHOS_RTDB?.connected?.()){
      window.OTTHOS_RTDB.sendEventV2('family-command',{kind,...payload}).then(r=>{if(!r?.ok)toast('Não foi possível enviar. Tente novamente perto da família.','warn',2000);});return true;
    }
    return familyApplyCommand(kind,payload,sharedWorldOwnId(),player);
  }
  function familyClear(a,b){const length=Math.hypot(b.x-a.x,b.z-a.z),steps=Math.max(1,Math.ceil(length/.22));for(let i=0;i<=steps;i++){const t=i/steps;if(positionBlockedForPlayer(lerp(a.x,b.x,t),lerp(a.z,b.z,t),.25))return false;}return true;}
  function familyApplyCommand(kind,payload,owner,origin){
    if(!origin||!Number.isFinite(Number(origin.x))||!Number.isFinite(Number(origin.z)))return false;
    const a=familyWorld.actors.thiago;if(!a||Math.hypot(origin.x-a.x,origin.z-a.z)>18)return false;
    if(kind==='work'){familyWorld.workUntil=familyWorld.clock+2.5;familyWorld.workKind=payload.activity==='workshop'?'garage:meter':'code:review';return true;}
    if(kind==='walk'){if(familyWorld.walkOwner&&familyWorld.walkOwner!==owner)return false;familyWorld.walkOwner=owner;return true;}
    if(kind==='stop'){if(familyWorld.walkOwner&&familyWorld.walkOwner!==owner)return false;familyWorld.walkOwner='';return true;}
    if(kind!=='throw'||familyWorld.ball)return false;
    const dog=payload.dog==='liz'?'liz':'luna',actor=familyWorld.actors[dog];
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
  function familySnapshot(){if(!familyWorld.ready)return null;return{actors:Object.values(familyWorld.actors).map(a=>({id:a.id,x:+a.x.toFixed(3),z:+a.z.toFixed(3),heading:+a.heading.toFixed(3),moving:a.moving})),ball:familyWorld.ball?JSON.parse(JSON.stringify(familyWorld.ball)):null,walkOwner:familyWorld.walkOwner,ack:familyWorld.ack,clock:familyWorld.clock,workUntil:familyWorld.workUntil,workKind:familyWorld.workKind||null};}
  function familyApplySnapshot(data,dt){
    if(!data||!Array.isArray(data.actors))return;
    for(const row of data.actors){const a=familyWorld.actors[row.id];if(!a||![row.x,row.z,row.heading].every(Number.isFinite))continue;a.x=lerp(a.x,row.x,Math.min(1,dt*10));a.z=lerp(a.z,row.z,Math.min(1,dt*10));a.heading=lerpAngle(a.heading,row.heading,Math.min(1,dt*12));a.moving=Number(row.moving)||0;}
    const previousBall=familyWorld.ball,nextBall=data.ball&&['luna','liz'].includes(data.ball.dog)?JSON.parse(JSON.stringify(data.ball)):null;if(nextBall?.at&&previousBall?.id===nextBall.id&&previousBall?.at){for(const axis of ['x','y','z'])nextBall.at[axis]=lerp(previousBall.at[axis],Number(nextBall.at[axis])||0,Math.min(1,dt*14));}familyWorld.ball=nextBall;familyWorld.walkOwner=String(data.walkOwner||'');const remoteClock=Number(data.clock);if(Number.isFinite(remoteClock))familyWorld.clock=Math.abs(remoteClock-familyWorld.clock)>2?remoteClock:lerp(familyWorld.clock,remoteClock,.035);familyWorld.workUntil=Number(data.workUntil)||0;familyWorld.workKind=String(data.workKind||'');familyWorld.ack=data.ack;familyCollectAck(data.ack);
  }
  function updateFamilyAdventure(dt){
    if(!familyWorld.ready)return;const wall=performance.now();dt=wall>Number(familyWorld.lastWall)?Math.min(.6,(wall-familyWorld.lastWall)/1000):dt;familyWorld.lastWall=wall;if(document.hidden)return;familyWorld.clock+=dt;const authority=sharedWorldIsAuthority();
    if(!authority){const host=remotePresence.get(sharedWorldAuthorityId()),snapshot=(typeof multiplayerV2WorldSnapshot==='function'?multiplayerV2WorldSnapshot():null)||host?.sharedScene;familyApplySnapshot(snapshot?.f,dt);}
    else{
      const owner=familyOwnerPosition(familyWorld.walkOwner),follow=owner&&!owner.vehicle?owner:null;
      if(familyWorld.walkOwner&&!owner)familyWorld.walkOwner='';
      const leader=familyWorld.actors.thiago;
      for(const [index,a] of Object.values(familyWorld.actors).entries()){
        if(familyWorld.ball&&a.id===familyWorld.ball.dog)continue;
        const home=familyWorld.location,target=follow?{x:follow.x+Math.sin((follow.facing??follow.r??0)+Math.PI)*2.6+(index-1.5)*.9,z:follow.z+Math.cos((follow.facing??follow.r??0)+Math.PI)*2.6+index*.55}:{x:home.x+(index%2?1.2:-1.2),z:home.z+5.5+Math.floor(index/2)*1.4};
        familyMove(a,target,follow?4.1:2.1,dt);
      }
      const b=familyWorld.ball;
      if(b){const dog=familyWorld.actors[b.dog],origin=familyOwnerPosition(b.owner);if(!origin){familyWorld.ball=null;}else if(b.stage==='flight'){b.t=Math.min(1,b.t+dt/0.85);b.at={x:lerp(b.start.x,b.land.x,b.t),z:lerp(b.start.z,b.land.z,b.t),y:lerp(1.5,.22,b.t)+Math.sin(b.t*Math.PI)*2.2};if(b.t>=1)b.stage='seek';}
        else if(b.stage==='seek'){if(familyMove(dog,b.land,5.8,dt))b.stage='return';}
        else if(b.stage==='return'){b.at={x:dog.x+Math.sin(dog.heading)*.4,y:groundHeightAt(dog.x,dog.z)+.55,z:dog.z+Math.cos(dog.heading)*.4};if(familyMove(dog,origin,5.1,dt)){familyWorld.ack={id:b.id,dog:b.dog,owner:b.owner};familyCollectAck(familyWorld.ack);familyWorld.ball=null;}}
      }
    }
    const progress=familyProgress(),park=worldLayoutPoint('playground',{x:-28,z:-40});
    if(familyWorld.walkOwner===sharedWorldOwnId()&&Math.hypot(player.x-park.x,player.z-park.z)<12&&Math.hypot(familyWorld.actors.thiago.x-park.x,familyWorld.actors.thiago.z-park.z)<14&&!progress.flags.park){progress.flags.park=true;saveState();toast('Passeio em família concluído no parque!','good',2300);}
    const visible=Math.hypot(player.x-familyWorld.actors.thiago.x,player.z-familyWorld.actors.thiago.z)<90;
    for(const a of Object.values(familyWorld.actors)){
      a.group.visible=visible;a.shadow.visible=visible;if(!visible)continue;
      const dog=a.id==='luna'||a.id==='liz',work=!dog&&familyWorld.workUntil>familyWorld.clock;
      if(dog)familyWorld.studio.drawDog(a.id,0,0,0,a.moving,a.id==='luna'?0:1.5,familyWorld.clock,!!familyWorld.ball&&familyWorld.ball.dog===a.id&&familyWorld.ball.stage==='return');
      else familyWorld.studio.drawHuman(a.id,0,0,0,a.moving,false,0,familyWorld.clock,a.id==='thiago'&&familyWorld.ball?.stage==='flight'?1-familyWorld.ball.t:0,0,work?1:0,work?familyWorld.workKind:null);
      for(let i=0;i<a.bones.length;i++){const rot=a.joints[i].rot;a.bones[i].rotation.set(rot[0],rot[1],rot[2],'YXZ');}
      const y=groundHeightAt(a.x,a.z);a.group.position.set(a.x,y+(dog ? .012 : -.038),a.z);a.group.rotation.y=a.heading;a.shadow.position.set(a.x,y+.025,a.z);
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
  function openFamilyAdventure(){
    const p=familyProgress(),name=familyWorld.location?.meetingOnly?'Encontro da Família':'Casa da Família';
    openModal('🐾 '+name,'<p>Thiago, Thamis, Luna e Liz agora passeiam neste mundo. AÇÃO abre as atividades ao se aproximar da família.</p><div class="family-chapters"><p>'+(p.flags.park?'✓':'○')+' Passear até o parque</p><p>'+(p.deliveries.luna>=2&&p.deliveries.liz>=2?'✓':'○')+' Brincar com as duas: Luna '+p.deliveries.luna+'/2 · Liz '+p.deliveries.liz+'/2</p><p>'+(p.flags.workshop?'✓':'○')+' Diagnóstico na oficina</p><p>'+(p.flags.technology?'✓':'○')+' Desafio de tecnologia</p></div><div class="choice-grid"><button class="choice" data-family-gps>📍 Encontrar a família</button><button class="choice" data-family-walk>🚶 Passeio até o parque</button><button class="choice" data-family-throw="luna">🤍 Lançar para Luna</button><button class="choice" data-family-throw="liz">🖤 Lançar para Liz</button><button class="choice" data-family-task="workshop">🔧 Oficina</button><button class="choice" data-family-task="technology">💻 Tecnologia</button><button class="choice" data-family-stop>🏡 Encerrar passeio</button><a class="choice" href="../familia/3d/">Abrir aventuras originais da Família</a></div>',root=>{
      $('[data-family-gps]',root).onclick=()=>familyRoute('family-home');
      $('[data-family-walk]',root).onclick=()=>{if(player.vehicle){toast('Saia do veículo para iniciar o passeio.','warn',1500);return;}if(familyCommand('walk')){familyRoute('family-park');closeModal();toast('Vamos juntos ao parque. Caminhe e espere a família.','good',2500);}};
      $$('[data-family-throw]',root).forEach(button=>button.onclick=()=>{if(familyCommand('throw',{dog:button.dataset.familyThrow,toy:familyWorld.toy})){closeModal();toast('Brinquedo lançado. Espere a devolução!','good',1600);}});
      $$('[data-family-task]',root).forEach(button=>button.onclick=()=>familyTask(button.dataset.familyTask));
      $('[data-family-stop]',root).onclick=()=>{familyCommand('stop');closeModal();};
    });
  }
  window.addEventListener('otthi:event-v2',event=>{const e=event.detail;if(e?.kind!=='family-command'||!sharedWorldIsAuthority()||!e.actorUid)return;familyApplyCommand(e.payload?.kind,e.payload||{},String(e.actorUid),remotePresence.get(String(e.actorUid)));});
  window.OTTHI_FAMILY={open:openFamilyAdventure,throwToy:(dog='luna')=>familyCommand('throw',{dog}),startWalk:()=>familyCommand('walk'),snapshot:familySnapshot,diagnostics:()=>({ready:familyWorld.ready,home:familyWorld.location,actors:Object.values(familyWorld.actors).map(a=>({id:a.id,x:a.x,z:a.z,bones:a.bones.length,vertices:a.vertices,drawCalls:1})),progress:familyProgress(),authority:sharedWorldIsAuthority(),ball:familyWorld.ball?.stage||null}),applySnapshot:familyApplySnapshot};

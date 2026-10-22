/**
 * OTThi World - geographic campaign layer. Loaded after OT Games in the modular build.
 * All existing game modes, permissions, Firebase namespaces and world layout remain intact.
 */
// @otthi-module-body
  const WORLD_CAMPAIGN_SITES=Object.freeze({
    hq:{id:'hq',label:'Quartel-General',x:-120,z:-54,radius:22},
    airbase:{id:'airbase',label:'Base Aérea',x:27,z:-169,radius:30},
    north:{id:'north',label:'Operação Norte',x:89,z:126,radius:36}
  });
  const worldCampaign={initialized:false,landmarks:[],mission:null,route:null,routeUi:null,time:0,recordKey:''};
  function campaignDist(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
  function campaignHome(mode){return mode==='ground'?WORLD_CAMPAIGN_SITES.hq:WORLD_CAMPAIGN_SITES.airbase;}
  function campaignMaterial(color,metal=.08){return new THREE.MeshStandardMaterial({color,metalness:metal,roughness:.67});}
  function campaignBox(root,mat,x,y,z,w,h,d){
    const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    o.position.set(x,y,z);o.castShadow=h>1;o.receiveShadow=true;root.add(o);return o;
  }
  function campaignCylinder(root,mat,x,y,z,r,h){
    const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,10),mat);
    o.position.set(x,y,z);o.castShadow=true;root.add(o);return o;
  }
  function campaignSign(root,title,subtitle,y){
    const c=document.createElement('canvas');c.width=512;c.height=160;
    const x=c.getContext('2d');x.fillStyle='#102d37';x.fillRect(0,0,512,160);
    x.strokeStyle='#b3ddc7';x.lineWidth=8;x.strokeRect(7,7,498,146);
    x.textAlign='center';x.fillStyle='#f1f6e8';x.font='bold 43px Arial';x.fillText(title,256,72);
    x.fillStyle='#a2d5c5';x.font='bold 24px Arial';x.fillText(subtitle,256,119);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(10,3),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));
    m.position.y=y;root.add(m);
  }
  function campaignDrawSite(site){
    const root=new THREE.Group();root.name='CAMPAIGN_'+site.id;
    root.position.set(site.x,groundHeightAt(site.x,site.z),site.z);
    const road=campaignMaterial(0x465259),stone=campaignMaterial(0xb0b9af),
      green=campaignMaterial(0x556c54),steel=campaignMaterial(0x243740,.4),
      glass=campaignMaterial(0x71a1a6,.2),line=campaignMaterial(0xd4c48d);
    if(site.id==='hq'){
      campaignBox(root,road,0,.1,0,29,.2,23);
      campaignBox(root,green,-4,3,-3,16,5.6,10);
      campaignBox(root,steel,-4,6,-3,17,.8,11);
      campaignBox(root,steel,-4,1.8,2.1,3.1,3.4,.3);
      for(const s of [-1,1]){
        campaignBox(root,stone,-4+s*5,3.4,2.15,3,1.3,.13);
        campaignBox(root,green,s*11,1.8,-6,6,3.2,6);
        campaignBox(root,steel,s*11,3.65,-6,6.7,.5,6.7);
      }
      campaignSign(root,'QUARTEL-GENERAL','PATRULHAS E MISSÕES',9);
    }else if(site.id==='airbase'){
      campaignBox(root,road,0,.1,0,61,.18,20);
      for(let i=-2;i<=2;i++)campaignBox(root,line,i*10,.22,0,4,.04,.2);
      for(const s of [-1,1]){
        campaignBox(root,stone,s*22,2.8,-13,14,5.5,10);
        campaignBox(root,steel,s*22,5.8,-13,15,.6,11);
        campaignBox(root,glass,s*22,2.8,-7.92,11,3,.15);
      }
      campaignBox(root,stone,-8,7,-16,4,14,4);
      campaignBox(root,glass,-8,13.5,-16,6,2.5,6);
      campaignBox(root,steel,-8,15,-16,7,.5,7);
      campaignSign(root,'BASE AEREA','AVIOES E HELICOPTEROS',10);
    }else{
      campaignBox(root,road,0,.12,0,19,.24,20);
      for(const s of [-1,1]){
        campaignBox(root,green,s*6,1.5,-6,6,2.8,5);
        campaignBox(root,steel,s*6,3.1,-6,6.6,.4,5.5);
      }
      campaignCylinder(root,steel,0,3,-6,.85,6);
      campaignBox(root,line,0,6.3,-6,4,.4,4);
      campaignSign(root,'SETOR NORTE','OPERACAO TATICA',10);
    }
    worldGroup.add(root);worldCampaign.landmarks.push({site,root});
  }
  function campaignStyle(){
    if(document.getElementById('ot-campaign-css'))return;
    const css=document.createElement('style');css.id='ot-campaign-css';
    css.textContent=[
      'body.campaign-world #ot-games-button{display:none!important}',
      '#worldCampaignBtn{font:800 11px system-ui;color:#e5fff2;background:#20505b;border:1px solid #88cdb4;border-radius:11px;min-height:44px;padding:4px 8px}',
      '#campaignRoute{position:fixed;z-index:590;top:max(5px,env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);width:min(350px,calc(100vw - 22px));box-sizing:border-box;text-align:center;border:1px solid #b1d7c08f;border-radius:10px;padding:6px 9px;background:#102c39e9;color:#f0ffea;font:700 12px/1.3 system-ui;pointer-events:none}',
      '#campaignRoute small{display:block;font:600 10px/1.3 system-ui;color:#c2ded1}',
      '#campaignRoute[hidden]{display:none!important}',
      '.ot-games-active #ot-games-hud header{top:max(53px,env(safe-area-inset-top,0px) + 44px)}',
      '.ot-games-active #ot-games-hud .ot-games-mission{display:none!important}',
      '@media(max-height:460px){#campaignRoute{width:min(310px,calc(100vw - 155px));top:3px;padding:3px 5px;font-size:10px}#campaignRoute small{font-size:9px}.ot-games-active #ot-games-hud header{top:37px;padding:2px}}'
    ].join('\n');document.head.append(css);
  }
  function campaignEnsure(){
    if(!running||!worldGroup||!scene)return;
    if(worldCampaign.initialized){
      for(const item of worldCampaign.landmarks)if(item.root.parent!==worldGroup)worldGroup.add(item.root);
      return;
    }
    campaignStyle();
    for(const site of Object.values(WORLD_CAMPAIGN_SITES))campaignDrawSite(site);
    worldCampaign.recordKey='thia:otthi:campaign:v1:'+(state.profile?.playerId||'local');
    const button=document.createElement('button');button.id='worldCampaignBtn';button.type='button';
    button.textContent='MISSÕES';button.setAttribute('aria-label','Bases e missões do mundo');button.onclick=campaignOpen;
    document.getElementById('quickBar')?.prepend(button);
    const box=document.createElement('div');box.id='campaignRoute';box.hidden=true;box.innerHTML='<b></b><small></small>';
    document.body.append(box);worldCampaign.routeUi=box;
    document.body.classList.add('campaign-world');worldCampaign.initialized=true;
  }
  function campaignHistory(){
    try{return JSON.parse(safeLocalGet(worldCampaign.recordKey)||'{}')||{};}catch{return{};}
  }
  function campaignNavigate(site){
    worldCampaign.route=site;worldCampaign.time=1;closeModal();
    toast('Rota definida: '+site.label+'.', 'info',2400);
  }
  function campaignOpen(){
    if(!running||!worldCampaign.initialized)return;
    const pos=otGames.active?otGames.body:player,history=campaignHistory();
    const cards=Object.values(WORLD_CAMPAIGN_SITES).map(site=>{
      const distance=Math.round(campaignDist(pos,site)),near=distance<site.radius;
      let actions='<button class="btn" data-campaign-nav="'+site.id+'">ROTA</button>';
      if(near&&!otGames.active&&site.id==='hq')actions+='<button class="btn primary" data-campaign-start="ground">PATRULHA</button>';
      if(near&&!otGames.active&&site.id==='airbase')actions+='<button class="btn primary" data-campaign-start="helicopter">HELICOPTERO</button><button class="btn primary" data-campaign-start="plane">AVIAO</button>';
      return '<section style="padding:9px;margin:8px 0;border:1px solid #547f83;border-radius:12px"><b>'+site.label+'</b><p>'+distance+' m · '+(near?'no local':'siga a rota')+'</p><div class="modal-actions">'+actions+'</div></section>';
    }).join('');
    const completed=Object.values(history).reduce((a,b)=>a+Math.max(0,Number(b)||0),0);
    openModal('WORLD · Bases e campanhas','<p>Viaje até o quartel ou aeroporto para iniciar uma operação. Cumpra o objetivo no norte e volte à base. Os jogos originais continuam disponíveis no console.</p>'+cards+'<p>Operações concluídas: '+completed+'</p>',root=>{
      $$('[data-campaign-nav]',root).forEach(el=>el.onclick=()=>campaignNavigate(WORLD_CAMPAIGN_SITES[el.dataset.campaignNav]));
      $$('[data-campaign-start]',root).forEach(el=>el.onclick=()=>campaignStart(el.dataset.campaignStart));
    });
  }
  async function campaignStart(mode){
    const site=campaignHome(mode);
    if(!running||paused||otGames.active||campaignDist(player,site)>site.radius){
      toast('Vá até a base correta e termine outras atividades primeiro.','warn',3000);return false;
    }
    closeModal();let ok=false;
    try{ok=await otGamesEnter(mode,{armed:false,difficulty:'normal'});}
    catch(e){toast(e?.message||'Não foi possível iniciar.','warn',3000);}
    if(!ok)return false;
    otGames.goal=mode==='ground'?6:8;
    worldCampaign.mission={id:'norte-'+mode,mode,base:site,phase:'travel',recorded:false};
    worldCampaign.route=WORLD_CAMPAIGN_SITES.north;worldCampaign.time=1;
    toast('Operação iniciada. Desloque-se até o Setor Norte.','info',3600);
    return true;
  }
  function campaignCombatDone(){
    const m=worldCampaign.mission,g=otGames;
    if(!m||m.phase!=='combat'||g.state!=='VICTORY')return;
    m.phase='return';g.state='PLAYING';g.armed=false;g.lock=null;
    g.enemies.forEach(e=>otGamesDisposeGroup(e.group));g.enemies=[];
    g.bullets.forEach(b=>otGamesDisposeGroup(b.mesh));g.bullets=[];
    g.effects.forEach(f=>otGamesDisposeGroup(f.mesh));g.effects=[];
    for(const a of ['fire','reload']){const b=g.ui?.querySelector('[data-ot="'+a+'"]');if(b)b.hidden=true;}
    worldCampaign.route=m.base;
    toast('Setor protegido. Volte à base para concluir a operação.','success',3900);
  }
  function campaignComplete(){
    const m=worldCampaign.mission;if(!m||m.recorded)return;
    m.recorded=true;const history=campaignHistory();
    history[m.id]=(Number(history[m.id])||0)+1;
    safeLocalSet(worldCampaign.recordKey,JSON.stringify(history));
    otGamesSaveResult(true);
    worldCampaign.mission=null;worldCampaign.route=null;worldCampaign.routeUi.hidden=true;
    otGamesLeave();toast('Missão concluída e retorno registrado.','success',4200);
  }
  function updateWorldCampaign(dt){
    campaignEnsure();if(!worldCampaign.initialized||paused)return;
    const focus=otGames.active?otGames.body:player;
    for(const item of worldCampaign.landmarks)item.root.visible=campaignDist(focus,item.site)<140;
    const m=worldCampaign.mission,g=otGames;
    if(m){
      if(!g.active){worldCampaign.mission=null;worldCampaign.route=null;worldCampaign.routeUi.hidden=true;return;}
      if(g.state==='DEFEAT'||g.state==='SPAWN_BLOCKED'){
        worldCampaign.routeUi.hidden=false;
        worldCampaign.routeUi.querySelector('b').textContent='OPERAÇÃO INTERROMPIDA';
        worldCampaign.routeUi.querySelector('small').textContent='Use o menu para sair ou tentar novamente.';
        return;
      }
      if(m.phase==='travel'&&campaignDist(g.body,WORLD_CAMPAIGN_SITES.north)<=WORLD_CAMPAIGN_SITES.north.radius){
        m.phase='combat';g.armed=true;otGamesSpawnWave();worldCampaign.route=null;
        const fire=g.ui?.querySelector('[data-ot="fire"]');if(fire)fire.hidden=false;
        const reload=g.ui?.querySelector('[data-ot="reload"]');if(reload&&m.mode==='ground')reload.hidden=false;
        toast('Setor Norte alcançado: objetivos de combate ativados.','info',3000);
      }
      campaignCombatDone();
      if(m.phase==='return'&&campaignDist(g.body,m.base)<m.base.radius){campaignComplete();return;}
    }
    worldCampaign.time+=dt;if(worldCampaign.time<.2)return;worldCampaign.time=0;
    const route=worldCampaign.route,view=worldCampaign.routeUi;
    if(m?.phase==='combat'){
      view.hidden=false;view.querySelector('b').textContent='SETOR NORTE · '+g.kills+'/'+g.goal+' ALVOS';
      view.querySelector('small').textContent='Proteja o setor e depois retorne à base.';
    }else if(route){
      const distance=Math.round(campaignDist(focus,route));
      const bearing=Math.atan2(route.x-focus.x,route.z-focus.z);
      const heading=g.active?g.body.yaw:Math.PI-cameraYaw;
      const diff=Math.atan2(Math.sin(bearing-heading),Math.cos(bearing-heading));
      const arrow=Math.abs(diff)<.4?'↑':Math.abs(diff)>2.7?'↓':diff>0?'→':'←';
      view.hidden=false;view.querySelector('b').textContent=arrow+' '+route.label+' · '+distance+' m';
      view.querySelector('small').textContent=m?.phase==='return'?'RETORNE À BASE':m?'SIGA ATÉ O SETOR NORTE':'SIGA O CAMINHO INDICADO';
    }else view.hidden=true;
  }
  window.OTTHI_CAMPAIGN={
    open:campaignOpen,start:campaignStart,
    navigate:id=>WORLD_CAMPAIGN_SITES[id]?campaignNavigate(WORLD_CAMPAIGN_SITES[id]):false,
    sites:()=>Object.values(WORLD_CAMPAIGN_SITES).map(s=>({...s})),
    diagnostics:()=>({initialized:worldCampaign.initialized,phase:worldCampaign.mission?.phase||'idle',
      active:!!worldCampaign.mission,records:campaignHistory(),
      landmarks:worldCampaign.landmarks.map(x=>({site:x.site.id,attached:x.root.parent===worldGroup,visible:x.root.visible}))})
  };

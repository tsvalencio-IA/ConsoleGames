/** Keep exploration controls close at hand without covering the world. */
// @otthi-module-body
 const explorationHud={slots:new Map(),nodes:{},ready:false};
 function explorationHudMove(node,parent,move){
  if(!node||!parent)return;
  let marker=explorationHud.slots.get(node);
  if(!marker){marker=document.createComment('exploration-hud-slot');node.before(marker);explorationHud.slots.set(node,marker);}
  if(move){if(node.parentNode!==parent)parent.append(node);}
  else if(marker.parentNode&&node.previousSibling!==marker)marker.parentNode.insertBefore(node,marker.nextSibling);
 }
 function closeExplorationPanels(){state.ui.quickOpen=false;state.ui.skillsOpen=false;syncMobilePanels();}
 function setExplorationHudMode(mode){
  clearMovementInputs();state.settings.worldHud=mode==='full'?'full':'clean';closeExplorationPanels();syncExplorationHud();saveState();
 }
 function ensureExplorationMenu(){
  if(explorationHud.ready)return;const bar=els.quickBar;if(!bar)return;
  const header=document.createElement('div');header.className='exploration-menu-header';header.innerHTML='<b>Menu do mundo</b><button type="button" id="worldMenuClose" aria-label="Fechar menu">✕<span>Fechar</span></button>';header.querySelector('button').onclick=closeExplorationPanels;bar.prepend(header);
  const empty=document.createElement('button');empty.id='emptyHandsBtn';empty.type='button';empty.innerHTML='👐<span>Mãos vazias</span>';empty.onclick=()=>{equipTool('none');closeExplorationPanels();updateContext(true);};bar.insertBefore(empty,els.toolsBtn);
  const layout=document.createElement('button');layout.id='worldHudModeBtn';layout.type='button';layout.onclick=()=>setExplorationHudMode(state.settings.worldHud==='full'?'clean':'full');bar.append(layout);
  const backdrop=document.createElement('button');backdrop.type='button';backdrop.id='worldMenuBackdrop';backdrop.tabIndex=-1;backdrop.setAttribute('aria-label','Fechar menu e voltar ao mundo');backdrop.onclick=closeExplorationPanels;els.game.append(backdrop);
  const closeSkills=document.createElement('button');closeSkills.id='worldSkillsClose';closeSkills.className='skill-btn';closeSkills.type='button';closeSkills.innerHTML='<b>✕</b><span>Fechar</span>';closeSkills.onclick=closeExplorationPanels;els.secondaryActions.prepend(closeSkills);
  els.quickToggleBtn.innerHTML='☰<span>Menu</span>';els.quickToggleBtn.setAttribute('aria-label','Abrir menu do mundo');els.quickToggleBtn.setAttribute('aria-controls','quickBar');els.skillsToggleBtn.setAttribute('aria-controls','secondaryActions');els.secondaryActions.id='secondaryActions';
  bar.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||button.closest('.camera-controls')||button===layout||button===els.skillsToggleBtn)return;state.ui.quickOpen=false;syncMobilePanels();});
  const before=els.quickToggleBtn.onclick;els.quickToggleBtn.onclick=event=>{clearMovementInputs();before?.(event);if(state.ui.quickOpen)bar.scrollTop=0;};
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&els.modal.hidden&&(state.ui.quickOpen||state.ui.skillsOpen)){event.preventDefault();event.stopImmediatePropagation();closeExplorationPanels();els.quickToggleBtn.focus();}},{capture:true});
  explorationHud.ready=true;explorationHud.nodes={layout,empty,backdrop};
 }
 function syncExplorationHud(){
  ensureExplorationMenu();if(!explorationHud.ready)return;
  const clean=state.settings.worldHud!=='full',body=document.body,activity=!!(player.vehicle||player.boating||player.transit.mode||buildMode||activeRace||(typeof otGames!=='undefined'&&otGames.active)||body.classList.contains('mode-fishing')||body.classList.contains('mode-sport-controls'));
  body.classList.toggle('world-hud-clean',clean);body.classList.toggle('world-hud-walking',clean&&!activity);
  const mission=typeof civilCurrent==='function'?civilCurrent():null,objective=!!(mission&&['active','lobby'].includes(mission.r.status)||state.career?.activeJob||state.waypoint||buildMode);body.classList.toggle('world-hud-objective',objective);
  for(const id of ['worldCampaignBtn','worldHeroBtn'])if(!explorationHud.nodes[id])explorationHud.nodes[id]=document.getElementById(id);
  const hero=explorationHud.nodes.worldHeroBtn,heroChallenge=!!world.worldProfessional?.heroAdventure?.active;
  explorationHudMove(explorationHud.nodes.worldCampaignBtn,els.quickBar,clean);
  explorationHudMove(els.multiplayerBadge,els.quickBar,clean);
  explorationHudMove(els.skillsToggleBtn,els.quickBar,clean);
  explorationHudMove(els.cameraResetBtn?.parentElement,els.quickBar,clean&&!activity);
  explorationHudMove(els.specialBtn,els.secondaryActions,clean&&!activity);
  explorationHudMove(hero,els.secondaryActions,clean&&!heroChallenge);
  if(hero&&!hero.querySelector('.exploration-hero-caption')){const caption=document.createElement('small');caption.className='exploration-hero-caption';caption.textContent='Herói';hero.append(caption);}
  const layout=explorationHud.nodes.layout,label=clean?'Mostrar todos os comandos':'Usar tela limpa';if(layout.dataset.mode!==(clean?'clean':'full')){layout.dataset.mode=clean?'clean':'full';layout.innerHTML='▦<span>'+label+'</span>';layout.setAttribute('aria-label',label);}
  const empty=state.tools?.equipped==='none';setControlAttribute(explorationHud.nodes.empty,'aria-pressed',String(empty));
  setControlText($('span',els.toolsBtn),clean?'Ferramentas':equippedTool().name);setControlAttribute(els.toolsBtn,'title','Ferramenta atual: '+equippedTool().name);
  setControlAttribute(els.quickToggleBtn,'aria-expanded',String(!!state.ui.quickOpen));setControlAttribute(els.skillsToggleBtn,'aria-expanded',String(!!state.ui.skillsOpen));
  // Keep melee available near an enemy; an empty street needs no attack button.
  const enemyNear=!activity&&(world.enemies||[]).some(enemy=>!enemy.dead&&Math.hypot(player.x-enemy.group.position.x,player.z-enemy.group.position.z)<=2.35);
  body.classList.toggle('world-hud-action-idle',clean&&!activity&&!currentContext&&!enemyNear);
  if(!activity&&!currentContext){setControlText($('span',els.actionBtn),empty?'Soco':'Atacar');setControlText($('b',els.actionBtn),empty?'👊':'✋');}
 }
 const explorationPanelsBefore=syncMobilePanels;
 syncMobilePanels=function(...args){explorationPanelsBefore(...args);syncExplorationHud();};
 const explorationContextBefore=updateContext;
 updateContext=function(...args){const result=explorationContextBefore(...args);syncExplorationHud();return result;};
 window.OT_EXPLORATION_HUD={setMode:setExplorationHudMode,diagnostics:()=>({mode:state.settings.worldHud==='full'?'full':'clean',walking:document.body.classList.contains('world-hud-walking'),menuOpen:!!state.ui.quickOpen,skillsOpen:!!state.ui.skillsOpen,emptyHands:state.tools?.equipped==='none'})};

/** Player-facing entry points for the Rio Preto expansion, built on the native world. */
// @otthi-module-body
  let rioTourRegistered=false;
  function registerRioTour(){
    if(rioTourRegistered||!civilCommunity.ready)return;
    const lands=Object.values(RIO_PRETO_LAYOUT.landmarks);
    const sequence=OTCivilMissionCore.definitions['rio-avenidas'].steps;
    for(const step of sequence){
      const id=step.targets[0],point=lands.find(landmark=>landmark.id===id);
      if(!point)throw Error('Ponto do roteiro ausente: '+id);
      civilTarget(id,point.name,point.x,point.z,{icon:'🧭',radius:3.8,activeOnly:true});
    }
    CHARACTER_ACTIVITIES['rio-landmark']=['Registrando a visita',2.7];
    rioTourRegistered=true;
  }
  const rioExpansionUpdate=updateWorldExpansion;
  updateWorldExpansion=function(){
    rioExpansionUpdate();
    if(!worldExpansion.ready)return;
    registerRioTour();
    updateRioRegionalCircuits();
  };
  const rioTracksPreviousLocations=expansionMapLocations;
  expansionMapLocations=function(){
    return [...rioTracksPreviousLocations(),...Object.values(RIO_REGIONAL_CIRCUITS).map(site=>({
      id:'circuit-'+site.id,name:site.label,icon:'🏁',group:'Autódromos',
      x:site.navX,z:site.navZ,navX:site.navX,navZ:site.navZ,description:site.description
    }))];
  };
  const rioPreviousDirectory=worldExploreDirectoryHtml;
  worldExploreDirectoryHtml=function(...args){
    const places=Object.values(RIO_PRETO_LAYOUT.landmarks);
    const tracks=Object.values(RIO_REGIONAL_CIRCUITS);
    const cards=[...places.map(p=>({id:p.id,title:p.name,tag:'MARCAR NO GPS'})),
      ...tracks.map(c=>({id:'circuit-'+c.id,title:c.label,tag:'KART LEGENDS'}))];
    return '<section aria-labelledby="rio-directory"><h3 id="rio-directory">Rio Preto e região</h3>'+
      '<p>Explore as três avenidas ou dirija até Mirassol e Cedral. Os traçados são do jogo.</p>'+
      '<div class="choice-grid">'+cards.map(card=>'<button class="choice" data-rio-route="'+escapeHtml(card.id)+'"><b>'+
        escapeHtml(card.title)+'</b><span>'+escapeHtml(card.tag)+'</span></button>').join('')+
      '<button class="choice" data-rio-tour><b>🧭 Roteiro das três avenidas</b><span>Registre os pontos a pé</span></button>'+
      '</div></section>'+rioPreviousDirectory(...args);
  };
  const rioPreviousBind=worldExploreBindDirectory;
  worldExploreBindDirectory=function(root,...args){
    rioPreviousBind(root,...args);
    for(const button of root.querySelectorAll('[data-rio-route]')){
      button.onclick=()=>{closeModal();setWaypoint(button.dataset.rioRoute);};
    }
    root.querySelector('[data-rio-tour]')?.addEventListener('click',()=>{
      const mission=civilCurrent();
      if(mission&&['active','lobby'].includes(mission.r.status)){openCivilMissionDetails();return;}
      civilCreateMission('rio-avenidas','solo');
    });
  };

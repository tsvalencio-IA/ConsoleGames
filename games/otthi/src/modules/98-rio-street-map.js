/** Street geography and route selection for the Rio Preto map panel. */
// @otthi-module-body
  const RIO_MAP_CORRIDORS=[
    {name:'Avenida Bady Bassitt',label:'Av. Bady Bassitt',near:[-1690,720],caption:[-2270,1090]},
    {name:'Avenida Doutor Alberto Andaló',label:'Av. Alberto Andaló',near:[-410,855],caption:[-1110,560]},
    {name:'Avenida Murchid Homsi',label:'Av. Murchid Homsi',near:[1200,860],caption:[230,1180]},
    {name:'Rodovia Washington Luís',label:'Washington Luís',ref:'SP-310',near:[-1110,1460],caption:[-530,1940]},
    {name:'Rodovia Transbrasiliana',label:'Transbrasiliana',ref:'BR-153',near:[2390,-2210],caption:[2280,-2700]}
  ];
  const RIO_MAP_PLACES=[
    ['aeroporto-sbsr','Aeroporto',[-3010,-440]],
    ['mercado_municipal','Mercadão',[-660,-580]],
    ['complexo_swift','Swift',[550,-30]],
    ['parque-da-represa','Represa',[1530,-1110]],
    ['estadio_teixeirao','Teixeirão',[1300,-1880]],
    ['riopreto_shopping','Riopreto Shopping',[-2330,3120]],
    ['casa-damha','Damha',[2590,490]]
  ];
  const RIO_OTTOVIAS_DESTINATION={id:'ottovias',name:'Ottovias',category:'Rodovia do jogo na Vila OT'};

  function rioMapSearchText(value){
    return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/\bav\b/g,'avenida').replace(/[^a-z0-9]+/g,' ').trim();
  }

  function rioMapLine(points){
    return points.map(([x,z],index)=>(index?'L':'M')+Math.round(x)+' '+Math.round(z)).join('');
  }

  function rioAtlasData(){
    if(rioMap.atlas)return rioMap.atlas;
    const {roads,nodes,water}=rioMap.data;
    const streets=new Map(),reference=new Map(RIO_MAP_CORRIDORS.map(road=>[road.name,road]));
    const context=[],avenues=[],highways=[];
    for(const way of roads){
      const [,kind,,name,,,restricted,ids]=way;
      const highlight=reference.get(name);
      const major=kind==='motorway'||kind==='trunk';
      if(highlight&&!major)avenues.push(rioMapLine(ids.map(id=>nodes[id])));
      else if(major)highways.push(rioMapLine(ids.map(id=>nodes[id])));
      else if(!restricted&&kind==='primary')context.push(rioMapLine(ids.map(id=>nodes[id])));
      if(!name||restricted||ids.length<2)continue;
      const key=rioMapSearchText(name);
      if(!key)continue;
      if(!streets.has(key))streets.set(key,{
        id:'rio-via-'+key.replaceAll(' ','-'),name,highlight,highway:false,ways:[],
        search:rioMapSearchText([name,highlight?.label,highlight?.ref,highlight?.ref?.replace('-','')].filter(Boolean).join(' '))
      });
      const street=streets.get(key);
      street.ways.push(way);
      street.highway||=major;
    }
    const featured=RIO_MAP_CORRIDORS.map(road=>streets.get(rioMapSearchText(road.name))).filter(Boolean);
    const waterPath=water.flatMap(([,rings])=>rings.map(ring=>rioMapLine(ring)+'Z')).join('');
    rioMap.atlas={streets,featured,waterPath,lines:{context:context.join(''),avenue:avenues.join(''),highway:highways.join('')}};
    return rioMap.atlas;
  }

  function rioStreetSpots(street,focus,walking){
    const spots=[],bounds=rioMap.data.bounds,nodes=rioMap.data.nodes;
    for(const way of street.ways){
      const [,kind,width,,,,,ids]=way,footway=rioPedestrianClasses.has(kind);
      if(!walking&&footway)continue;
      for(let i=1;i<ids.length;i++){
        const a=nodes[ids[i-1]],b=nodes[ids[i]],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
        if(length<.2)continue;
        const t=clamp(rioSegmentProjection(focus.x,focus.z,a,b).t,.12,.88);
        const x=lerp(a[0],b[0],t),z=lerp(a[1],b[1],t);
        if(x<bounds.minX+6||x>bounds.maxX-6||z<bounds.minZ+6||z>bounds.maxZ-6)continue;
        spots.push({x,z,width,footway,nx:-(b[1]-a[1])/length,nz:(b[0]-a[0])/length});
      }
    }
    return spots.sort((a,b)=>distance2D(focus,a)-distance2D(focus,b));
  }

  function rioStreetRoute(street){
    const walking=!player.vehicle;
    if(walking&&street.highway)return false;
    const tried=[];
    let best=null;
    for(const spot of rioStreetSpots(street,player,walking)){
      if(tried.some(p=>distance2D(p,spot)<16))continue;
      tried.push(spot);
      const offset=walking&&!spot.footway?spot.width*.5+1.15:0;
      for(const side of offset?[1,-1]:[0]){
        const target={x:spot.x+spot.nx*offset*side,z:spot.z+spot.nz*offset*side};
        if(rioWaterAt(target.x,target.z)||positionBlockedForPlayer(target.x,target.z,.45,{ignoreTraffic:true,ignoreParkedVehicles:true}))continue;
        if(offset&&rioRoadAt(target.x,target.z,.25,road=>!road.pedestrian))continue;
        const path=rioGeoRoute(player,target,walking,{connect:true});
        if(!path.length)continue;
        const metres=routeLength(path);
        if(!best||metres<best.metres)best={target,path,metres};
      }
      if((tried.length>=5&&best)||tried.length>=12)break;
    }
    if(!best){toast('Nenhum acesso livre a essa via. Confira o mapa e tente de outro ponto.','warn',2800);return false;}
    return rioSetWaypoint({id:street.id,name:street.name,...best.target},best.path);
  }

  function rioMapLocalBounds(focus){
    const limits=rioMap.data.bounds,width=1250,height=1480;
    const minX=clamp(focus.x-width*.5,limits.minX,limits.maxX-width);
    const minZ=clamp(focus.z-height*.5,limits.minZ,limits.maxZ-height);
    return {minX,minZ,maxX:minX+width,maxZ:minZ+height};
  }

  function rioMapLabel(id,point,caption,label,kind,scale=1){
    const [x,z]=caption;
    return `<g class="rio-atlas-label rio-atlas-label-${kind}" tabindex="0" role="button"
      aria-label="${escapeHtml(label)}" data-rio-select="${escapeHtml(id)}">
      <path d="M${point.x} ${point.z}L${x} ${z-38*scale}"/>
      <circle cx="${point.x}" cy="${point.z}" r="${47*scale}"/>
      <text x="${x}" y="${z}" font-size="${225*scale}" text-anchor="middle">${escapeHtml(label)}</text>
      </g>`;
  }

  function rioMapNearbyStreets(atlas,focus){
    const closest=new Map();
    for(const road of rioMap.geo.roads.query(focus.x,focus.z,380)){
      if(road.restricted||!road.name)continue;
      const point=rioSegmentProjection(focus.x,focus.z,road.a,road.b),distance=distance2D(focus,point);
      if(distance>380||distance>=(closest.get(road.name)?.distance??Infinity))continue;
      const street=atlas.streets.get(rioMapSearchText(road.name));
      if(street)closest.set(road.name,{street,point,distance});
    }
    return [...closest.values()].sort((a,b)=>a.distance-b.distance).slice(0,5);
  }

  function rioMapSvg(atlas,locations,selection,local,focus,nearby){
    const b=local?rioMapLocalBounds(focus):rioMap.data.bounds;
    const width=b.maxX-b.minX,height=b.maxZ-b.minZ,scale=width/7000;
    const base=local?[...rioMap.geo.roads.query((b.minX+b.maxX)*.5,(b.minZ+b.maxZ)*.5,Math.max(width,height)*.5)]
      .filter(road=>!road.restricted&&Math.max(road.a[0],road.b[0])>=b.minX&&Math.min(road.a[0],road.b[0])<=b.maxX&&
        Math.max(road.a[1],road.b[1])>=b.minZ&&Math.min(road.a[1],road.b[1])<=b.maxZ)
      .map(road=>rioMapLine([road.a,road.b])).join(''):atlas.lines.context;
    const selected=selection?.ways?selection.ways.map(way=>rioMapLine(way[7].map(id=>rioMap.data.nodes[id]))).join(''):'';
    const lines={...atlas.lines,context:base,selection:selected};
    const markers=local?'':RIO_MAP_PLACES.map(([key,label,caption])=>{
      const place=locations.find(item=>item.site?.key===key);
      return place?rioMapLabel(place.id,{x:place.site.x,z:place.site.z},caption,label,'place'):'';
    }).join('');
    const roads=local?nearby.slice(0,2).map(({street,point},index)=>{
      const label=street.highlight?.ref||street.highlight?.label||street.name.replace(/^Avenida /,'Av. ');
      const caption=[(b.minX+b.maxX)*.5,index?b.maxZ-height*.18:b.minZ+height*.26];
      return rioMapLabel(street.id,point,caption,label,street.highway?'highway':'street',scale);
    }).join(''):atlas.featured.map(street=>{
      const {near,caption,label,ref}=street.highlight;
      const point=rioStreetSpots(street,{x:near[0],z:near[1]},false)[0];
      return point?rioMapLabel(street.id,point,caption,ref||label,street.highway?'highway':'street'):'';
    }).join('');
    const tracking=phoneDeliveryTracking();
    const routePath=points=>rioMapLine(points.map(({x,z})=>[x,z]));
    const unit=local?250:1000,sx=b.minX+240*scale,sz=b.maxZ-210*scale;
    return `<svg class="rio-real-map" data-rio-view="${local?'local':'city'}" viewBox="${b.minX} ${b.minZ} ${width} ${height}"
      aria-label="${local?'Ruas no meu entorno':'Mapa de referência de São José do Rio Preto'}">
        <path class="rio-water-shape" d="${atlas.waterPath}"/>
        ${Object.entries(lines).map(([kind,path])=>path?`<path class="rio-map-line rio-map-line-${kind}" d="${path}"/>`:'').join('')}
        ${state.waypoint&&world.routePath.length?`<path class="rio-map-line rio-map-line-route" d="${routePath(world.routePath)}"/>`:''}
        ${tracking?`<path class="rio-map-line rio-map-line-delivery" d="${routePath(tracking.route)}"/>
          <circle class="rio-map-delivery" data-rio-delivery cx="${tracking.x}" cy="${tracking.z}" r="${74*scale}"><title>${escapeHtml(phoneTrackingText(tracking))}</title></circle>`:''}
        ${markers}${roads}
        ${selection&&Number.isFinite(selection.x)?`<circle class="rio-map-destination" cx="${selection.x}" cy="${selection.z}" r="${89*scale}"><title>${escapeHtml(selection.name)}</title></circle>`:''}
        <circle class="rio-map-player" cx="${focus.x}" cy="${focus.z}" r="${95*scale}"><title>Você</title></circle>
        <g class="rio-map-north" transform="translate(${b.maxX-345*scale} ${b.minZ+290*scale}) scale(${scale})">
          <path d="M0 -75L75 112L0 72L-75 112Z"/><text text-anchor="middle" y="-139">N</text>
        </g>
        <g class="rio-map-scale"><path d="M${sx} ${sz-65*scale}v${65*scale}h${unit}v-${65*scale}"/>
          <text x="${sx}" y="${sz-99*scale}" font-size="${160*scale}">${local?'250 m':'1 km'}</text>
        </g>
      </svg>`;
  }

  function openRioMapPanel(){
    const atlas=rioAtlasData(),focus=navigationFocus();
    const nearby=rioMapNearbyStreets(atlas,focus);
    const locations=rioMapLocations().sort((a,b)=>distance2D(focus,a)-distance2D(focus,b));
    const entries=[...atlas.featured,...locations,RIO_OTTOVIAS_DESTINATION,...[...atlas.streets.values()].filter(street=>!street.highlight)];
    const byId=new Map(entries.map(item=>[item.id,item]));
    const nameFor=item=>item.highlight?.label||item.name;
    const buttonFor=item=>{
      const ref=item.highlight?.ref;
      const subtitle=item===RIO_OTTOVIAS_DESTINATION?'Vila OT':ref||'';
      return `<button type="button" class="rio-map-choice" data-rio-select="${escapeHtml(item.id)}">
        <i class="${item.highway?'is-highway':item.ways?'is-street':item===RIO_OTTOVIAS_DESTINATION?'is-link':'is-place'}" aria-hidden="true"></i>
        <span>${escapeHtml(nameFor(item))}</span>${subtitle?`<small>${subtitle}</small>`:''}
      </button>`;
    };
    const data=entries.map(item=>({item,text:item.search||rioMapSearchText(item.name+' '+(item.site?.street||item.category||''))}));
    const direct=locations.map(place=>`<button type="button" class="rio-map-choice" data-rio-destination="${escapeHtml(place.id)}">
      <i class="is-place" aria-hidden="true"></i><span>${escapeHtml(place.name)}</span>
      <small>${Math.round(distance2D(focus,place))} m</small>
      </button>`).join('');
    const nearest=nearby[0]?.distance<55?nearby[0].street.name:'';
    clearMovementInputs();
    openModal('Mapa de Rio Preto',`<div class="rio-map-panel">
      <figure class="rio-map-figure">
        <div class="rio-map-canvas" data-rio-map-drawing></div>
        <div class="rio-map-toolbar">
          <button type="button" class="btn rio-map-view" data-rio-local aria-pressed="false">Meu entorno</button>
          <div class="rio-map-legend" aria-label="Legenda"><span><i class="is-highway"></i>Rodovia</span><span><i class="is-street"></i>Avenida</span><span><i class="is-you"></i>Você</span></div>
        </div>
        <figcaption><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a></figcaption>
      </figure>
      <section class="rio-map-side">
        <label class="rio-map-search" for="rioMapSearch">Buscar no mapa
          <input type="search" id="rioMapSearch" autocomplete="off" placeholder="Rua, rodovia ou local" />
        </label>
        ${nearest?`<div class="rio-map-near">Você está perto de <b>${escapeHtml(nearest)}</b></div>`:''}
        <div class="rio-map-selected" data-rio-selected aria-live="polite" hidden></div>
        <div data-rio-reference>
          <h3>Vias principais</h3>
          <div class="rio-map-choices">${[...atlas.featured,RIO_OTTOVIAS_DESTINATION].map(buttonFor).join('')}</div>
        </div>
        <div data-rio-nearby hidden>
          <h3>Ruas próximas</h3>
          ${nearby.length?`<div class="rio-map-choices">${nearby.map(({street})=>buttonFor(street)).join('')}</div>`:
            '<p>Nenhuma via nomeada neste trecho.</p>'}
        </div>
        <div data-rio-results hidden></div>
        <details class="rio-map-directory" data-rio-directory>
          <summary>Todos os locais</summary>
          <div class="rio-map-choices">${direct}</div>
        </details>
        ${state.waypoint?'<button type="button" class="btn" data-rio-clear>Cancelar rota atual</button>':''}
      </section>
    </div>`,root=>{
      const drawing=root.querySelector('[data-rio-map-drawing]'),localButton=root.querySelector('[data-rio-local]');
      const input=root.querySelector('#rioMapSearch'),results=root.querySelector('[data-rio-results]');
      const panel=root.querySelector('.rio-map-panel'),reference=root.querySelector('[data-rio-reference]');
      const localStreets=root.querySelector('[data-rio-nearby]'),directory=root.querySelector('[data-rio-directory]');
      const selected=root.querySelector('[data-rio-selected]');
      let selection=null,local=false;
      function showChoices(searching){
        results.hidden=!searching;
        reference.hidden=searching||local;
        localStreets.hidden=searching||!local;
        directory.hidden=searching;
      }
      function draw(){
        drawing.innerHTML=rioMapSvg(atlas,locations,selection,local,focus,nearby);
        localButton.setAttribute('aria-pressed',String(local));
        localButton.textContent=local?'Cidade toda':'Meu entorno';
        showChoices(!!rioMapSearchText(input.value));
        for(const button of root.querySelectorAll('button[data-rio-select]'))button.setAttribute('aria-pressed',String(button.dataset.rioSelect===selection?.id));
      }
      function select(item){
        if(!item)return;
        selection=item;
        local=local&&nearby.some(({street})=>street===item);
        selected.hidden=false;
        const external=item===RIO_OTTOVIAS_DESTINATION,needsCar=item.highway&&!player.vehicle;
        const description=external?'Abre a Vila OT com a rota para o acesso.':
          needsCar?'Entre em um veículo para traçar uma rota na rodovia.':
          item.site?.street||item.category||'';
        selected.innerHTML=`<b>${escapeHtml(item.name)}</b>${description?`<span>${escapeHtml(description)}</span>`:''}
          <button class="btn primary" type="button" data-rio-go ${needsCar?'disabled':''}>${external?'Abrir rota na Vila OT':'Traçar rota'}</button>`;
        draw();
        selected.scrollIntoView({block:'nearest'});
      }
      input.addEventListener('input',()=>{
        const query=rioMapSearchText(input.value);
        showChoices(!!query);
        if(!query)return;
        const terms=query.split(' ');
        const matches=data.filter(entry=>terms.every(term=>entry.text.includes(term))).slice(0,12);
        results.innerHTML=matches.length?`<div class="rio-map-choices">${matches.map(({item})=>buttonFor(item)).join('')}</div>`:
          '<div class="rio-map-near">Nenhuma rua, rodovia ou local encontrado.</div>';
      });
      panel.addEventListener('click',event=>{
        const pick=event.target.closest('[data-rio-select]');
        if(pick){select(byId.get(pick.dataset.rioSelect));return;}
        const direct=event.target.closest('[data-rio-destination]');
        if(direct){rioSetWaypoint(byId.get(direct.dataset.rioDestination));return;}
        if(event.target.closest('[data-rio-go]')&&selection){
          if(selection===RIO_OTTOVIAS_DESTINATION){selectOtthiMap('ot','ottovias-entry');return;}
          if(selection.ways)rioStreetRoute(selection);
          else rioSetWaypoint(selection);
        }
      });
      drawing.addEventListener('keydown',event=>{
        const pick=event.target.closest('[data-rio-select]');
        if(!pick||!['Enter',' '].includes(event.key))return;
        event.preventDefault();select(byId.get(pick.dataset.rioSelect));selected.querySelector('button:not(:disabled)')?.focus();
      });
      localButton.onclick=()=>{local=!local;draw();};
      root.querySelector('[data-rio-clear]')?.addEventListener('click',clearWaypoint);
      draw();
    });
  }

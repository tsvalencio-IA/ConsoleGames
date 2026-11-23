/** Rain in the city and snowfall in the existing snow-covered mountains. */
// @otthi-module-body
  const rioClimate={time:0,lastFrame:0,kind:'clear',effect:null};
  const rioWeatherLabels={auto:'Automático',clear:'Céu limpo',rain:'Chuva'};

  function rioWeatherPreference(){
    const selected=state.settings.rioWeather;
    return Object.hasOwn(rioWeatherLabels,selected)?selected:'auto';
  }

  function openRioClimate(){
    openModal('🌦️ Clima',`<div class="choice-grid">${Object.entries(rioWeatherLabels).map(([id,label])=>
      `<button type="button" class="choice" data-rio-weather="${id}" aria-pressed="${rioWeatherPreference()===id}"><b>${label}</b></button>`
    ).join('')}<button type="button" class="choice" data-rio-snow><b>❄️ Picos Nevados</b><span>Marcar a trilha no GPS</span></button></div>`,root=>{
      for(const button of root.querySelectorAll('[data-rio-weather]'))button.onclick=()=>{
        state.settings.rioWeather=button.dataset.rioWeather;
        saveState(true);
        closeModal();
        toast(rioWeatherLabels[state.settings.rioWeather],'info',1800);
      };
      root.querySelector('[data-rio-snow]').onclick=()=>setWaypoint('snow-trail-0');
    });
  }

  function rioWeatherAt(focus){
    const preference=rioWeatherPreference();
    if(preference==='clear')return 'clear';
    const mountains=WORLD_LAYOUT_V704.mountainRanges.some(p=>p.snow&&
      ((focus.x-p.x)/p.rx)**2+((focus.z-p.z)/p.rz)**2<1.55);
    if(mountains)return 'snow';
    return preference==='rain'||rioClimate.time%540>=420?'rain':'clear';
  }

  function createRioWeatherEffect(){
    const count=180,positions=new Float32Array(count*6);
    const rainBuffer=new THREE.BufferGeometry();
    rainBuffer.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
    const rain=new THREE.LineSegments(rainBuffer,new THREE.LineBasicMaterial({
      color:0xcfedff,transparent:true,opacity:.64,depthWrite:false
    }));
    const snowBuffer=new THREE.BufferGeometry();
    snowBuffer.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3).setUsage(THREE.DynamicDrawUsage));
    const snow=new THREE.Points(snowBuffer,new THREE.PointsMaterial({
      color:0xf4fbff,size:.145,transparent:true,opacity:.85,depthWrite:false,sizeAttenuation:true
    }));
    const group=new THREE.Group();group.name='RIO_PRETO_CLIMA';
    rain.frustumCulled=false;snow.frustumCulled=false;
    group.add(rain,snow);scene.add(group);
    const random=otthiSeededRandom(71109);
    return {group,rain,snow,particles:Array.from({length:count},()=>({
      x:random()*43-21.5,z:random()*43-21.5,y:random()*24,speed:.76+random()*.54
    }))};
  }

  function updateRioClimate(dt){
    rioClimate.time+=dt;
    if(rioClimate.time-rioClimate.lastFrame<1/20)return;
    rioClimate.lastFrame=rioClimate.time;
    const focus=navigationFocus(),kind=rioWeatherAt(focus);
    const indoors=currentHouse||rioMap.indoors;
    if(kind!==rioClimate.kind){
      document.body.dataset.rioClima=kind;
      rioClimate.kind=kind;
      if(scene.fog){scene.fog.near=kind==='clear'?210:92;scene.fog.far=kind==='clear'?520:315;}
      world.skyDome?.material.color.setHex(kind==='rain'?0x9daab6:kind==='snow'?0xc5d5df:0xffffff);
      const asphalt=worldRoadContinuity.root?.children.find(mesh=>mesh.name==='ROAD_NETWORK_ASPHALT');
      if(asphalt)asphalt.material.roughness=kind==='rain'?.56:.94;
    }
    if(kind==='clear'||indoors){if(rioClimate.effect)rioClimate.effect.group.visible=false;return;}
    const effect=rioClimate.effect??=createRioWeatherEffect();
    effect.group.visible=true;
    effect.group.position.set(focus.x,Math.max(groundHeightAt(focus.x,focus.z),Math.min(player.y,groundHeightAt(focus.x,focus.z)+24)),focus.z);
    const rain=kind==='rain',geometry=(rain?effect.rain:effect.snow).geometry;
    effect.rain.visible=rain;effect.snow.visible=!rain;
    const attribute=geometry.getAttribute('position'),count=qualityTier()==='low'?92:effect.particles.length;
    for(let i=0;i<count;i++){
      const p=effect.particles[i],h=((p.y+rioClimate.time*p.speed*(rain?13:1.7))%24),y=18-h;
      const x=p.x+(rain?h*.095:Math.sin(h*.54+i)*.66);
      if(rain){attribute.setXYZ(i*2,x,y,p.z);attribute.setXYZ(i*2+1,x-.12,y+1.18,p.z-.05);}
      else attribute.setXYZ(i,x,y,p.z);
    }
    geometry.setDrawRange(0,rain?count*2:count);
    attribute.needsUpdate=true;
  }

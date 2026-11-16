/** Keep every visible light contribution without evaluating distant lights. */
// @otthi-module-body
  const worldLightBudget={frustum:null,projection:null,sphere:null,padding:[],preparedBuckets:new Set(),onDemand:0,stats:{total:0,active:0,culled:0,padded:0}};
  function configureWorldPointLightEvaluation(){
    const chunks=THREE.ShaderChunk,source=chunks.lights_fragment_begin;
    if(source.includes('OTTHI_VISIBLE_POINT_LIGHT'))return;
    // r128 evaluates the full physical BRDF even after attenuation reached
    // zero. Zero irradiance contributes zero to diffuse, specular and coating.
    chunks.lights_fragment_begin=source.replace('RE_Direct( directLight, geometry, material, reflectedLight );','if ( directLight.visible ) { // OTTHI_VISIBLE_POINT_LIGHT\n\t\t\tRE_Direct( directLight, geometry, material, reflectedLight );\n\t\t}');
  }
  function worldLightingPreparationPlan(){
    // Interior lamps can become visible later, and camera culling temporarily
    // hides ordinary lamps. Count the installed population, not one frustum.
    const glowsEnabled=typeof visualQualityProfile==='function'&&typeof qualityTier==='function'?visualQualityProfile(qualityTier()).glows:(world.glows||[]).some(light=>light?.visible)||worldLightBudget.stats.total>0;
    let population=0;const seen=new Set();
    if(glowsEnabled)for(const light of world.glows||[]){
      if(!light?.isPointLight||seen.has(light)||!light.layers.test(camera.layers))continue;
      let parent=light.parent;while(parent&&parent!==scene)parent=parent.parent;
      if(parent===scene){seen.add(light);population++;}
    }
    const pointLightBuckets=[0];if(population){for(let count=16;count<=Math.max(16,Math.ceil(population/8)*8);count+=8)pointLightBuckets.push(count);}
    return{population,pointLightBuckets};
  }
  function precompileWorldLighting(options={}){
    const compile=()=>{
      const templates=window.OTBrazilVehicles?.precompile?.(THREE,renderer,scene,camera);
      if(!templates)renderer.compile(scene,camera);
      return Number(templates||0);
    };
    const lights=[],temporary=[];
    if(Number.isFinite(options.pointLights)){
      const states=[];scene.traverse(object=>{if(object.isPointLight){states.push([object,object.visible]);object.visible=false;}});
      // These zero-intensity lamps exist only while compiling. Actual frames
      // keep the original lights, visibility, culling and attenuation intact.
      const count=Math.max(0,Math.floor(options.pointLights));
      try{
        for(let i=0;i<count;i++){const light=new THREE.PointLight(0x000000,0,1,1);scene.add(light);temporary.push(light);}
        return{templates:compile(),lightingVariants:1,pointLightBuckets:[count]};
      }finally{for(const light of temporary)scene.remove(light);for(const[light,visible]of states)light.visible=visible;}
    }
    scene.traverseVisible(object=>{if(object.isPointLight&&object.layers.test(camera.layers))lights.push(object);});
    // An initial view with no contributing lamps still needs the normal lit
    // program when the camera turns. Prepare it only under the loading screen;
    // the zero-light view itself must never draw padding lamps.
    if(!lights.length&&worldLightBudget.stats.total>0){for(let i=0;i<16;i++){const light=new THREE.PointLight(0x000000,0,1,1);scene.add(light);lights.push(light);temporary.push(light);}}
    // The automatic quality profile can hide decorative lamps during play.
    // Three r128 keys every material program by its light count, even for a
    // basic material. Warm the unlit variant while the loading screen owns
    // the frame, including cached vehicles and currently hidden scenery.
    // This changes no material, quality setting or light in a painted frame.
    let templates;
    try{
      templates=compile();
      if(lights.length){try{for(const light of lights)light.visible=false;compile();}finally{for(const light of lights)light.visible=true;}}
    }finally{
      for(const light of temporary)scene.remove(light);
    }
    return{templates,lightingVariants:lights.length?2:1};
  }
  // Pure culling, with the same geometry rules as normal rendering.
  function collectWorldPointLights(view){
    const budget=worldLightBudget;
    budget.frustum??=new THREE.Frustum();budget.projection??=new THREE.Matrix4();budget.sphere??=new THREE.Sphere();
    view.updateMatrixWorld();budget.projection.multiplyMatrices(view.projectionMatrix,view.matrixWorldInverse);budget.frustum.setFromProjectionMatrix(budget.projection);
    const hidden=[],seen=new Set();let total=0,active=0;
    for(const light of world.glows){
      if(!light?.isPointLight||!light.visible||seen.has(light)||!light.layers.test(view.layers))continue;seen.add(light);
      let parent=light.parent;while(parent&&parent!==scene&&parent.visible)parent=parent.parent;if(parent!==scene)continue;
      total++;
      const range=Number(light.distance),finite=Number.isFinite(range)&&range>0&&(renderer.physicallyCorrectLights||light.decay>0);
      if(finite&&!light.castShadow){
        light.getWorldPosition(budget.sphere.center);budget.sphere.radius=range+Math.max(.05,range*.00001);
        if(!budget.frustum.intersectsSphere(budget.sphere)){hidden.push(light);continue;}
      }
      active++;
    }
    return{total,active,hidden};
  }
  function countWorldPointLightsForView(view){return !scene||!view||!world.glows?.length?0:collectWorldPointLights(view).active;}
  function lightingBucketFor(active){const count=Math.max(0,Math.floor(Number(active)||0));return count?Math.max(16,Math.ceil(count/8)*8):0;}
  function markLightingBucketPrepared(count){worldLightBudget.preparedBuckets.add(lightingBucketFor(count));}
  function prepareWorldPointLights(view){
    if(!scene||!view||!world.glows?.length)return null;
    const budget=worldLightBudget,{total,active,hidden}=collectWorldPointLights(view);
    for(const light of hidden)light.visible=false;
    // Only the preview defers uncommon variants. Preserve full scene lighting
    // and compile any previously unseen bucket before its first render.
    const bucket=lightingBucketFor(active);
    if(active&&!budget.preparedBuckets.has(bucket)&&budget.preparation?.criticalBuckets?.length){
      try{precompileWorldLighting({pointLights:bucket});markLightingBucketPrepared(bucket);budget.onDemand++;}
      catch(error){console.warn('[OTTHI CAMERA] Variante adicional:',error);}
    }
    const padded=active?Math.max(16,Math.ceil(active/8)*8)-active:0;
    for(let i=0;i<padded;i++){let light=budget.padding[i];if(!light){light=new THREE.PointLight(0x000000,0,1,1);light.name='OTTHI_LIGHT_PADDING';budget.padding.push(light);}scene.add(light);}
    budget.stats={total,active,culled:hidden.length,padded};
    return()=>{for(const light of hidden)light.visible=true;for(let i=0;i<padded;i++)scene.remove(budget.padding[i]);};
  }
  window.OTTHI_LIGHT_BUDGET={diagnostics:()=>({...worldLightBudget.stats,onDemand:worldLightBudget.onDemand}),preparation:()=>({...worldLightBudget.preparation,pointLightBuckets:[...(worldLightBudget.preparation?.pointLightBuckets||[])]}),preparedBuckets:()=>[...worldLightBudget.preparedBuckets].sort((a,b)=>a-b),countForView:countWorldPointLightsForView,bucketFor:lightingBucketFor};

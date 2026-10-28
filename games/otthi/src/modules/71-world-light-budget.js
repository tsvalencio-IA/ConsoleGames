/** Keep every visible light contribution without evaluating distant lights. */
// @otthi-module-body
  const worldLightBudget={frustum:null,projection:null,sphere:null,padding:[],stats:{total:0,active:0,culled:0,padded:0}};
  function configureWorldPointLightEvaluation(){
    const chunks=THREE.ShaderChunk,source=chunks.lights_fragment_begin;
    if(source.includes('OTTHI_VISIBLE_POINT_LIGHT'))return;
    // r128 evaluates the full physical BRDF even after attenuation reached
    // zero. Zero irradiance contributes zero to diffuse, specular and coating.
    chunks.lights_fragment_begin=source.replace('RE_Direct( directLight, geometry, material, reflectedLight );','if ( directLight.visible ) { // OTTHI_VISIBLE_POINT_LIGHT\n\t\t\tRE_Direct( directLight, geometry, material, reflectedLight );\n\t\t}');
  }
  function prepareWorldPointLights(view){
    if(!scene||!view||!world.glows?.length)return null;
    const budget=worldLightBudget;budget.frustum??=new THREE.Frustum();budget.projection??=new THREE.Matrix4();budget.sphere??=new THREE.Sphere();
    view.updateMatrixWorld();budget.projection.multiplyMatrices(view.projectionMatrix,view.matrixWorldInverse);budget.frustum.setFromProjectionMatrix(budget.projection);
    const hidden=[],seen=new Set();let total=0,active=0;
    for(const light of world.glows){
      if(!light?.isPointLight||!light.visible||seen.has(light)||!light.layers.test(view.layers))continue;seen.add(light);
      let parent=light.parent;while(parent&&parent!==scene&&parent.visible)parent=parent.parent;if(parent!==scene)continue;
      total++;
      // Infinite lights, no-decay lights and shadow casters stay untouched.
      const range=Number(light.distance),finite=Number.isFinite(range)&&range>0&&(renderer.physicallyCorrectLights||light.decay>0);
      if(finite&&!light.castShadow){
        light.getWorldPosition(budget.sphere.center);budget.sphere.radius=range+Math.max(.05,range*.00001);
        if(!budget.frustum.intersectsSphere(budget.sphere)){light.visible=false;hidden.push(light);continue;}
      }
      active++;
    }
    // Buckets avoid recompiling every material as one lamp enters/leaves the
    // camera frustum. There is no light cap: all intersecting lights are kept.
    const padded=total?Math.max(16,Math.ceil(active/8)*8)-active:0;
    for(let i=0;i<padded;i++){let light=budget.padding[i];if(!light){light=new THREE.PointLight(0x000000,0,1,1);light.name='OTTHI_LIGHT_PADDING';budget.padding.push(light);}scene.add(light);}
    budget.stats={total,active,culled:hidden.length,padded};
    return()=>{for(const light of hidden)light.visible=true;for(let i=0;i<padded;i++)scene.remove(budget.padding[i]);};
  }
  window.OTTHI_LIGHT_BUDGET={diagnostics:()=>({...worldLightBudget.stats})};

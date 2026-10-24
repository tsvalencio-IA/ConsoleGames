/** Brazilian car bodies reuse the existing driving, workshop, save and online engines. */
// @otthi-module-body
  const brazilFleet={ready:false,seenColors:new Map()};
  function brazilModelKey(id='',bodyType='small'){if(bodyType==='utility')return'kombi';if(/fusca|aurora-coupe-0|ottovias-azul|^aurora-0$/.test(id))return'fusca';if(/uno/.test(id))return'uno';if(/gol/.test(id))return'gol';let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))>>>0;return['fusca','gol','uno'][h%3];}
  function brazilEligible(v={}){return !/kart|moto|motorcycle|bicycle|bike|skate|truck|fire|police|patrol|paramedic|ambulance|rescue|tow/i.test([v.id,v.kind,v.serviceType,v.bodyType].join('|'))&&['small','car','utility',''].includes(String(v.bodyType||'small'));}
  function brazilSeatOffset(model,index=-1){return[{x:-.255,y:.32,z:.03},{x:.255,y:.32,z:.03},{x:-.255,y:.32,z:-.64},{x:.255,y:.32,z:-.64}][Math.max(0,Math.min(3,index+1))];}
  function brazilDetach(g){const model=g?.userData.brazilRoot;if(!model)return;g.remove(model);model.traverse(o=>{if(o.material?.userData?.ownedBrazilPaint)o.material.dispose();});for(const record of g.userData.brazilHidden||[])if(record.object.parent===g)record.object.visible=record.visible;g.userData.brazilRoot=null;g.userData.brazilHidden=[];}
  function brazilColor(v,parts={}){const id=String(v?.id||''),defaultColor=typeof defaultWorldVehicleParts==='function'?defaultWorldVehicleParts(id).primary:'#f28a22',saved=state.vehicles.brazilColors||(state.vehicles.brazilColors={});const raw=String(parts.primary||defaultColor),old=brazilFleet.seenColors.get(id);brazilFleet.seenColors.set(id,raw);if(old&&old!==raw)saved[id]=raw;const preferred=saved[id]??(raw!==defaultColor?raw:null)??v?.appearance?.primary??0x2788d2;return typeof preferred==='string'?parseInt(preferred.replace('#',''),16):preferred;}
  function brazilAccessories(g,parts={}){const model=g.userData.brazilRoot;if(!model)return;const signature=[parts.hood,parts.roof,parts.rear,parts.wheels,parts.secondary,parts.accent].join('|');if(model.userData.accessorySig===signature)return;model.userData.accessorySig=signature;const old=model.getObjectByName('brazil-accessories');if(old){model.remove(old);old.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}const root=new THREE.Group();root.name='brazil-accessories';model.add(root);const add=(w,h,d,x,y,z,c=0x263846)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c,roughness:.44,metalness:.28}));m.position.set(x,y,z);root.add(m);return m;},top=g.userData.brazilModel==='kombi'?1.64:g.userData.brazilModel==='uno'?1.34:g.userData.brazilModel==='gol'?1.23:1.38;
    if(parts.roof==='rack'){for(const x of[-.45,.45])add(.035,.13,1.04,x,top+.07,-.2);for(const z of[-.7,.3])add(.96,.035,.035,0,top+.14,z);}
    if(parts.roof==='beacon'){add(.80,.05,.16,0,top+.06,-.2);add(.24,.12,.13,-.22,top+.145,-.2,0x53c9eb);add(.24,.12,.13,.22,top+.145,-.2,0xeaba57);}
    if(parts.hood==='intake'||parts.hood==='power')add(.36,.09,.26,0,.84,1.02,parts.hood==='power'?0x54a2b5:0x263846);
    if(parts.rear==='spoiler'){add(1.08,.05,.18,0,.95,-1.39);for(const x of[-.36,.36])add(.03,.20,.03,x,.85,-1.36);}
    if(parts.rear==='box')add(.80,.27,.39,0,.90,-1.16,0x495862);
    for(const wheel of model.children.filter(o=>o.name.startsWith('wheel-'))){const s=parts.wheels==='offroad'?1.08:1;wheel.scale.setScalar(s);wheel.position.y=(g.userData.brazilModel==='kombi'?.28:g.userData.brazilModel==='fusca'?.285:.275)*s+.018;}
  }
  function brazilAttach(g,vehicle={},parts={}){
    if(!g||!brazilEligible(vehicle)||!window.OTBrazilVehicles)return false;const key=vehicle.brazilModel||brazilModelKey(vehicle.id,vehicle.bodyType),color=brazilColor(vehicle,parts);let model=g.userData.brazilRoot;
    if(!model||g.userData.brazilModel!==key){brazilDetach(g);model=window.OTBrazilVehicles.create(THREE,key,color);g.add(model);g.userData.brazilRoot=model;g.userData.brazilModel=key;g.userData.brazilHidden=[];}
    for(const child of g.children)if(child!==model){if(!(g.userData.brazilHidden||[]).some(x=>x.object===child))g.userData.brazilHidden.push({object:child,visible:child.visible});child.visible=false;}
    model.traverse(o=>{if(o.isMesh&&o.name==='paint')o.material.color.set(color).convertSRGBToLinear();});g.userData.wheels=model.children.filter(o=>o.name.startsWith('wheel-'));g.userData.frontWheels=g.userData.wheels.slice(0,2);g.userData.serviceLayer=null;g.scale.set(1,1,1);brazilAccessories(g,parts);return true;
  }
  const brazilOldClear=clearThemedVehicleGeometry;
  clearThemedVehicleGeometry=function(g){brazilDetach(g);return brazilOldClear(g);};
  const brazilOldParts=applyWorldVehiclePartsToGroup;
  applyWorldVehiclePartsToGroup=function(g,parts,durability,id){const result=brazilOldParts(g,parts,durability,id),v=vehicleById(id)||{id,kind:parts?.kind||'car',bodyType:parts?.bodyType||'small',appearance:{primary:parts?.primary}};if(brazilEligible(v)){v.brazilModel=v.brazilModel||brazilModelKey(id,v.bodyType);brazilAttach(g,v,parts);}return result;};
  const brazilOldApply=applyVehicleAppearance;
  applyVehicleAppearance=function(v){brazilOldApply(v);if(brazilEligible(v)){v.brazilModel=v.brazilModel||brazilModelKey(v.id,v.bodyType);brazilAttach(vehicleVisual,v,worldVehicleParts(v.id));}};
  const brazilOldCreate=createToyCar;
  createToyCar=function(x,z,options={}){const v=brazilOldCreate(x,z,options);if(brazilEligible(v)){v.brazilModel=v.brazilModel||brazilModelKey(v.id,v.bodyType);if(v.id==='city-aurora-coupe-0'&&!state.vehicles.owned?.includes(v.id)&&!state.vehicles.brazilColors?.[v.id])v.appearance.primary=0x2788d2;v.originalLabel=v.originalLabel||v.label;v.label=window.OTBrazilVehicles.catalog[v.brazilModel].label+(v.id==='city-aurora-coupe-0'?' azul':'');brazilAttach(v.group,v,worldVehicleParts(v.id));}return v;};
  const brazilOldRacer=worldRacerAttach;
  worldRacerAttach=function(g,color,type='racer'){if(type==='coupe'){const v=g===vehicleVisual?currentVehicleRef():vehicleById(g?.userData.vehicleId);if(v&&brazilEligible(v))return brazilAttach(g,v,worldVehicleParts(v.id));}brazilDetach(g);return brazilOldRacer(g,color,type);};
  const brazilOldRemote=applyRemoteVehicleVisual;
  applyRemoteVehicleVisual=function(g,raw,fallback){const d=brazilOldRemote(g,raw,fallback);if(d&&brazilEligible(d)){d.brazilModel=raw?.brazilModel||brazilModelKey(d.id,d.bodyType);brazilAttach(g,{...d,brazilModel:d.brazilModel},d.parts);}return d;};
  function updateBrazilFleet(){
    if(!worldExpansion.ready)return;
    for(const v of world.vehicles||[])if(brazilEligible(v)&&!v.group.userData.brazilRoot){v.brazilModel=v.brazilModel||brazilModelKey(v.id,v.bodyType);v.originalLabel=v.originalLabel||v.label;v.label=window.OTBrazilVehicles.catalog[v.brazilModel].label;brazilAttach(v.group,v,worldVehicleParts(v.id));}
    for(const actor of world.ottoviasTraffic||[])if(!actor.group.userData.brazilRoot&&actor.bodyType!=='truck'&&actor.type!=='truck'){
      actor.bodyType=actor.bodyType||'car';actor.brazilModel=brazilModelKey(actor.id,'small');if(actor.id==='ottovias-azul'||actor.id==='aurora-0')actor.color=0x2788d2;brazilAttach(actor.group,{id:actor.id,bodyType:'small',kind:'car',brazilModel:actor.brazilModel,appearance:{primary:actor.color||0x7a99b0}},{});actor.wheels=actor.group.userData.wheels;
    }brazilFleet.ready=true;
  }
  const brazilOldExpansion=updateWorldExpansion;
  updateWorldExpansion=function(){brazilOldExpansion();updateBrazilFleet();};
  const brazilOldLocations=expansionMapLocations;
  expansionMapLocations=function(){const all=brazilOldLocations(),v=vehicleById('city-aurora-coupe-0');if(v){const p=player.vehicle&&currentVehicleRef()===v?player:v.group.position;all.push({id:'fusca-azul',name:'Fusca azul',icon:'🚙',group:'Veículos',x:p.x,z:p.z,navX:p.x,navZ:p.z,description:'Encontre o Fusca azul e embarque com a família selecionada.'});}return all;};
  window.OTTHI_BRAZIL_FLEET={diagnostics:()=>({ready:brazilFleet.ready,cars:(world.vehicles||[]).filter(v=>v.brazilModel).map(v=>({id:v.id,model:v.brazilModel,label:v.label,occupied:v.occupied,visible:v.group.visible,rendered:!!v.group.userData.brazilRoot,wheels:v.group.userData.wheels.length})),traffic:(world.ottoviasTraffic||[]).filter(v=>v.brazilModel).map(v=>({id:v.id,model:v.brazilModel,color:v.color}))})};

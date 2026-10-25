/** The user's own avatar rides two-wheel vehicles without replacing the walking rig. */
// @otthi-module-body
  const neighborhoodRider={local:null,hip:new WeakMap()};
  function motorcycleModel(key){return !!window.OTBrazilExpansion.catalog[key]?.twoWheeler;}
  function riderHipHeight(avatar,ghost){
    if(neighborhoodRider.hip.has(avatar))return neighborhoodRider.hip.get(avatar);
    const visual=ghost.userData.familyAvatar;let y=.92;
    if(visual?.byName){const hips=['hip-1','hip1'].map(n=>visual.byName[n]).filter(Boolean);if(hips.length){avatar.updateWorldMatrix(true,true);y=hips.reduce((sum,b)=>sum+avatar.worldToLocal(b.getWorldPosition(new THREE.Vector3())).y,0)/hips.length;}}
    neighborhoodRider.hip.set(avatar,y);return y;
  }
  function poseMotorcycleAvatar(ghost,driver=true){
    const family=ghost.userData.familyAvatar,limbs=ghost.userData.limbs||{};
    if(family){
      familyAnimateAvatar(family,limbs,{sitting:true,time:familyWorld.clock});
      for(const side of[-1,1]){const shoulder=family.byName['shoulder'+side],elbow=family.byName['elbow'+side];if(shoulder){shoulder.rotation.x=driver?-1.04:-.28;shoulder.rotation.z=side*(driver?-.13:.05);}if(elbow)elbow.rotation.x=driver?-.28:-.12;}
    }else{
      for(const name of['leftArm','rightArm'])if(limbs[name]){limbs[name].rotation.x=driver?-1.12:-.28;limbs[name].rotation.z=(name==='leftArm'?1:-1)*(driver?.11:.035);}
      for(const name of['leftLeg','rightLeg'])if(limbs[name])limbs[name].rotation.x=-1.02;
    }
  }
  function clearMotorcycleRider(){const r=neighborhoodRider.local;if(!r)return;disposeGhostAvatar(r.avatar);r.host.remove(r.avatar);r.host.parent?.remove(r.host);neighborhoodRider.local=null;}
  function localMotorcycleRide(){
    if(!player.vehicle)return null;
    if(player.car.passengerOf){const ghost=world.ghosts.get(player.car.passengerOf),target=ghost?.userData.target,key=target?.vehicleAppearance?.brazilModel;if(!motorcycleModel(key))return null;return{model:key,parent:ghost.userData.carVisual?.userData.brazilRoot,seat:multiplayerVehiclePassengerSeatIndex(player.car.passengerOf,sharedWorldOwnId()),owner:player.car.passengerOf};}
    const model=currentVehicleRef()?.brazilModel;if(!motorcycleModel(model))return null;return{model,parent:vehicleVisual.userData.brazilRoot,seat:-1,owner:sharedWorldOwnId()};
  }
  function updateMotorcycleRiders(){
    const ride=localMotorcycleRide();
    if(!ride?.parent){clearMotorcycleRider();}
    else{
      const avatar=multiplayerAvatarDescriptor(),signature=[ride.owner,ride.model,ride.seat,multiplayerAvatarSignature(avatar),familyWorld.ready].join('|');let r=neighborhoodRider.local;
      if(!r||r.signature!==signature||r.host.parent!==ride.parent){
        clearMotorcycleRider();const host=new THREE.Group(),body=new THREE.Group();host.name='OTTHI_LOCAL_MOTORCYCLE_RIDER';host.userData.avatar=body;host.add(body);ride.parent.add(host);buildRemoteAvatarVisual(host,avatar);r=neighborhoodRider.local={host,avatar:body,signature,model:ride.model};
      }
      const seat=brazilSeatOffset(ride.model,ride.seat),scale=brazilSeatScale(ride.model);r.host.position.set(seat.x,seat.y,seat.z);r.host.visible=true;r.avatar.visible=true;r.avatar.scale.setScalar(scale);poseMotorcycleAvatar(r.host,ride.seat<0);r.avatar.position.y=-riderHipHeight(r.avatar,r.host)*scale;
      // The family controller already has a ride actor. Display the selected
      // avatar once, with its pelvis on the seat rather than floating above it.
      if(familyCarry.ride?.owner===sharedWorldOwnId()){const actor=familyWorld.actors[familyCarry.ride.controller];if(actor?.ridePose){actor.group.visible=false;if(actor.label)actor.label.visible=false;}}
    }
    for(const[uid,ghost]of world.ghosts){
      const target=ghost.userData.target||{},vehicle=target.vehicleRole==='passenger'?multiplayerVehicleHostPresence(target.vehiclePassengerOf):target,key=vehicle?.vehicleAppearance?.brazilModel;if(!target.vehicle||!motorcycleModel(key)||!ghost.userData.avatar)continue;
      const driver=target.vehicleRole!=='passenger',index=driver?-1:multiplayerVehiclePassengerSeatIndex(target.vehiclePassengerOf,uid),seat=brazilSeatOffset(key,index),avatar=ghost.userData.avatar,scale=brazilSeatScale(key);poseMotorcycleAvatar(ghost,driver);avatar.position.y=seat.y-riderHipHeight(avatar,ghost)*scale;
      if(familyCarry.ride?.owner===uid){const actor=familyWorld.actors[familyCarry.ride.controller];if(actor?.ridePose)actor.group.visible=false;}
    }
  }
  const neighborhoodPreviousFamilyVisuals=updateFamilyPlayableVisuals;
  updateFamilyPlayableVisuals=function(){neighborhoodPreviousFamilyVisuals();updateMotorcycleRiders();};
  window.OTTHI_MOTORCYCLE_RIDER={diagnostics:()=>{const r=neighborhoodRider.local;return{active:!!r,model:r?.model||'',visible:!!r?.host.visible&&!!r?.host.parent&&!!r?.avatar.visible,theme:r?.avatar.userData.toyTheme||'',meshes:r?(()=>{let n=0;r.avatar.traverse(o=>{if(o.isMesh)n++;});return n;})():0,position:r?.host.getWorldPosition(new THREE.Vector3()).toArray()||null,walkingAvatarVisible:playerModel?.visible!==false};}};

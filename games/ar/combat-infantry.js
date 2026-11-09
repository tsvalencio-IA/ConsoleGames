/* Mixamo Vanguard, embedded game use. Attribution and terms: assets/infantry/sources.json. */
(() => {
 'use strict';
 const T=window.THREE;
 if(!T?.GLTFLoader||!T.SkeletonUtils)return;
 let template=null,clips=[],loading=null;
 const version='20261109-infantry1';
 const vector=new T.Vector3(),end=new T.Vector3(),target=new T.Vector3(),turn=new T.Quaternion();
 function ensure(){
  if(loading)return loading;
  loading=new Promise(resolve=>new T.GLTFLoader().load(new URL('assets/infantry/soldier.glb',document.baseURI).href,gltf=>{
   template=gltf.scene;clips=gltf.animations;
   template.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=o.receiveShadow=true;o.geometry.userData.sharedCombat=true;for(const material of Array.isArray(o.material)?o.material:[o.material]){material.roughness=.79;material.envMapIntensity=.65;}}});
   resolve(true);
  },undefined,()=>resolve(false)));
  return loading;
 }
 function create(){
  if(!template)return null;
  const root=new T.Group(),body=T.SkeletonUtils.clone(template),box=new T.Box3().setFromObject(body),height=box.max.y-box.min.y,scale=2.12/height;
  body.scale.multiplyScalar(scale);body.position.set(-(box.min.x+box.max.x)*.5*scale,-box.min.y*scale,-(box.min.z+box.max.z)*.5*scale);root.add(body);
  root.name='WAR_VANGUARD';root.userData.importedCombat=true;root.userData.modelVersion=version;
  const bones={};body.traverse(o=>{if(o.isBone)bones[o.name.replace(/^mixamorig:?/,'')]=o;});
  const mixer=new T.AnimationMixer(body),actions={};
  for(const clip of clips)if(clip.name==='Idle'||clip.name==='Walk'){const action=mixer.clipAction(clip);action.setEffectiveWeight(clip.name==='Idle'?1:0).play();actions[clip.name]=action;}
  const gun=window.OTCombatArt.rifle(false);gun.scale.multiplyScalar(.83);gun.position.set(.10,1.45,.23);root.add(gun);
  root.userData.combatActor={body,bones,mixer,actions,gun,lastTime:null,walk:0,bodyY:body.position.y};
  return root;
 }
 // Aim each bone in its local coordinates, so the arena's mirrored Z axis
 // never changes the direction of the rifle or the elbow articulation.
 function aim(root,bone,child,x,y,z){
  if(!bone||!child)return;
  root.updateMatrixWorld(true);
  end.copy(child.getWorldPosition(vector));bone.worldToLocal(end);
  target.set(x,y,z);root.localToWorld(target);bone.worldToLocal(target);
  if(end.lengthSq()<1e-8||target.lengthSq()<1e-8)return;
  turn.setFromUnitVectors(end.normalize(),target.normalize());bone.quaternion.multiply(turn);
 }
 function animate(root,{time=0,speed=0,crouched=false,firing=false,hit=0,fall=0}={}){
  const a=root.userData.combatActor;if(!a)return;
  const dt=a.lastTime===null?1/60:Math.max(0,Math.min(.1,time-a.lastTime));a.lastTime=time;
  a.walk+=((speed>.1?1:0)-a.walk)*(1-Math.exp(-12*dt));
  a.actions.Idle?.setEffectiveWeight(1-a.walk);a.actions.Walk?.setEffectiveWeight(a.walk);a.mixer.update(dt);
  const duck=crouched?.32:0,b=a.bones;a.body.position.y=a.bodyY-duck;
  aim(root,b.RightArm,b.RightForeArm,.36,1.20-duck,.10);aim(root,b.RightForeArm,b.RightHand,.12,1.34-duck,.16);
  aim(root,b.LeftArm,b.LeftForeArm,-.32,1.28-duck,.26);aim(root,b.LeftForeArm,b.LeftHand,-.01,1.40-duck,.58);
  if(crouched)for(const side of[-1,1]){const name=side<0?'Left':'Right';aim(root,b[name+'UpLeg'],b[name+'Leg'],side*.13,.48,.29);aim(root,b[name+'Leg'],b[name+'Foot'],side*.13,.12,.04);}
  a.gun.position.set(.10,1.45-duck,.23-(firing?.025:0));a.gun.userData.flash.visible=!!firing;
  if(b.Spine2&&hit>0)b.Spine2.rotation.z+=Math.sin(time*60)*.035;
  root.rotation.z=fall?Math.min(1,fall)*1.52:0;
 }
 function dispose(root){
  const a=root.userData.combatActor;if(!a)return;
  a.mixer.stopAllAction();a.mixer.uncacheRoot(a.body);
  a.gun.traverse(o=>{o.geometry?.dispose();for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])m.dispose();});
 }
 window.OTCombatActors={ensure,create,animate,dispose,get ready(){return !!template;},version};
})();

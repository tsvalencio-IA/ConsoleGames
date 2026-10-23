import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
test('family selection reloads the newest saved profile when the database write is still pending',()=>{
 const source=read('games/otthi/src/modules/02-state-save-cloud-account.js');
 const helper=source.slice(source.indexOf('  function latestLocalProgress('),source.indexOf('  let dbReady ='));
 const choose=vm.runInNewContext(helper+';latestLocalProgress');
 const database={profile:{coins:500},lastSaved:100,avatar:{bodyStyle:'family-thiago'}};
 const local={profile:{coins:550},lastSaved:200,avatar:{bodyStyle:'family-thamis'}};
 assert.deepEqual(JSON.parse(JSON.stringify(choose(database,JSON.stringify(local)))),local);
 assert.equal(choose(database,JSON.stringify({...local,lastSaved:99})),database);
 for(const raw of [null,'corrupt','{}',JSON.stringify({...local,lastSaved:'bad'})])assert.equal(choose(database,raw),database);
 assert.equal(database.avatar.bodyStyle,'family-thiago');assert.equal(local.avatar.bodyStyle,'family-thamis');
});
test('family: playable instances keep the approved geometry and independent animated skeletons',()=>{
 const c=vm.createContext({console,performance:{now:()=>100},URLSearchParams,Float32Array,setTimeout(){}});
 c.window={addEventListener(){},location:{search:''}};c.document={hidden:false};
 vm.runInContext(read('games/otthi/assets/vendor/three-r128.min.js'),c);c.window.THREE=c.THREE;
 vm.runInContext(read('games/otthi/src/modules/00a-visual-foundation-avatar-v2.js'),c);
 vm.runInContext(`const state={avatar:defaultAvatarV2()},player={x:0,z:6,vx:0,vz:0,grounded:true},input={};const world={colliders:[],ghosts:new Map()},worldGroup=new THREE.Group(),remotePresence=new Map();let playerModel=null,playerGroup=new THREE.Group(),avatarLayer=new THREE.Group(),toolVisual=null,animTime=0,fishingVisual=null;const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,lerpAngle=lerp;const waterAt=()=>false,v704RoadAt=()=>false,v704ProtectedRectangles=()=>[],positionBlockedForPlayer=()=>false,groundHeightAt=()=>0,worldLayoutPoint=()=>({x:0,z:0}),createHouse=()=>{},registerInteractable=()=>{},sharedWorldIsAuthority=()=>true,sharedWorldOwnId=()=> 'family-unit',saveState=()=>{},toast=()=>{},beep=()=>{};`,c);
 vm.runInContext(read('games/otthi/family-mascots.js'),c);
 vm.runInContext(read('games/otthi/src/modules/41-family-adventure.js'),c);
 const data=vm.runInContext(`
  initFamilyAdventure();const checks=[];
  for(const id of ['thiago','thamis']){
   const source=familyWorld.actors[id];source.group.visible=false;const a=familyCloneAvatar(id,new THREE.Group()),b=familyCloneAvatar(id,new THREE.Group());
   const independent=a.bones.every((bone,i)=>bone!==source.bones[i]&&bone!==b.bones[i]);
   const shared=a.mesh.geometry===source.mesh.geometry&&a.mesh.material===source.mesh.material;
   const sourcePose=source.bones.map(b=>b.rotation.toArray().join(','));
   familyAnimateAvatar(a,{}, {speed:6,run:true,time:.13});const first=a.byName.hip1.rotation.x;
   familyAnimateAvatar(a,{}, {speed:6,run:true,time:.38});const second=a.byName.hip1.rotation.x;
   const npcUntouched=source.bones.every((b,i)=>b.rotation.toArray().join(',')===sourcePose[i]);
   let disposed=0;source.mesh.geometry.addEventListener('dispose',()=>disposed++);releaseFamilyAvatarVisual(a.group);
   checks.push({id,visible:a.group.visible&&b.group.visible,independent,shared,animated:Math.abs(first-second)>.01,npcUntouched,disposed,bones:b.bones.length});
  }
  playerModel=new THREE.Group();playerGroup.add(playerModel);const bodyRoot=new THREE.Group();playerModel.add(bodyRoot);
  const parts=Object.fromEntries(['body','leftArm','rightArm','leftLeg','rightLeg'].map(key=>[key,new THREE.Group()]));Object.values(parts).forEach(part=>bodyRoot.add(part));playerModel.userData.parts=parts;playerModel.userData.baseY=.24;
  toolVisual=new THREE.Group();parts.rightArm.add(toolVisual);applyFamilyPlayerAvatar('thiago');updateFamilyPlayableVisuals();
  const toolInHand=toolVisual.parent===playerModel.userData.familyAvatar.byName.hand1;
  clearFamilyPlayerAvatar();const toolRestored=toolVisual.parent===parts.rightArm;
  const saved=normalizeAvatarV2({...state.avatar,bodyStyle:'family-thamis',primaryColor:'#123456'});
  ({checks,toolInHand,toolRestored,savedStyle:saved.bodyStyle,savedColor:saved.primaryColor});
 `,c);
 for(const row of data.checks){assert(row.visible&&row.independent&&row.shared&&row.animated&&row.npcUntouched,JSON.stringify(row));assert.equal(row.disposed,0);assert(row.bones>20);}
 assert(data.toolInHand&&data.toolRestored,'Tool must follow the selected model and return to the original arm');
 assert.equal(data.savedStyle,'family-thamis');assert.equal(data.savedColor,'#123456');
});

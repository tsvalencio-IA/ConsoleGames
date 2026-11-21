import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');
const body=file=>read('games/otthi/src/modules/'+file+'.js').split('// @otthi-module-body')[1];
const foundation=body('00a-visual-foundation-avatar-v2');
const wardrobe=body('81-rio-wardrobe');
function wardrobeContext(){
 const context=vm.createContext({console,window:{addEventListener(){}},performance:{now:()=>1}});
 vm.runInContext(read('games/otthi/assets/vendor/three-r128.min.js'),context);
 vm.runInContext(foundation+wardrobe,context);
 return context;
}

test('family clothes round-trip separately inside the approved avatar payload and validate at the boundary',()=>{
 const context=wardrobeContext();
 const proof=vm.runInContext(`(()=>{
  const old={bodyStyle:'family-thiago',hat:'cap',outfit:'blue',primaryColor:'#123456',accessory:'glasses'};
  const cleanOld=normalizeAvatarV2(old);
  const clean=normalizeAvatarV2({...old,rioWardrobe:{
   thiago:{top:'denim',shoes:'boot',bag:'hike',hat:'<bad>',id:'unexpected'},
   thamis:{top:'festival',hat:'panama',jewel:'earrings'}
  }});
  const reloaded=normalizeAvatarV2(JSON.parse(JSON.stringify(clean)));
  return JSON.stringify({cleanOld,clean,reloaded});
 })()`,context);
 const {cleanOld,clean,reloaded}=JSON.parse(proof);
 assert(!Object.hasOwn(cleanOld,'rioWardrobe'));
 assert.deepEqual(clean,reloaded);
 assert.deepEqual({...clean,rioWardrobe:undefined},{...cleanOld,rioWardrobe:undefined});
 assert.equal(clean.rioWardrobe.thiago.top,'denim');
 assert.equal(clean.rioWardrobe.thiago.shoes,'boot');
 assert.equal(clean.rioWardrobe.thiago.hat,'original');
 assert(!Object.hasOwn(clean.rioWardrobe.thiago,'id'));
 assert.equal(clean.rioWardrobe.thamis.top,'festival');
 assert.equal(clean.rioWardrobe.thamis.hat,'panama');
 assert.equal(clean.rioWardrobe.thamis.jewel,'earrings');
});

test('the wardrobe token uses the same sanitized avatar fields and older clients can still use the original rig',()=>{
 const context=wardrobeContext();
 const network=body('28-multiplayer-social-online');
 vm.runInContext(network.slice(network.indexOf('  const MULTIPLAYER_AVATAR_FIELDS='),network.indexOf('  function avatarHex(')),context);
 const presence=read('games/otthi/assets/js/multiplayer-rtdb.js');
 vm.runInContext(presence.split('\n').filter(line=>line.startsWith('const PRESENCE_AVATAR_FIELDS')||line.startsWith('function sanitizePresenceAvatar')).join('\n'),context);
 const result=JSON.parse(vm.runInContext(`JSON.stringify(normalizeAvatarV2({bodyStyle:'family-thamis',rioWardrobe:{thamis:{
    top:'festival',legs:'track',shoes:'boot',hat:'panama',glasses:'copper',jewel:'earrings',wrist:'bracelet',bag:'hike'
  }}}))`,context));
 context.state={avatar:result};
 vm.runInContext("function familyCharacterId(style){return style?.startsWith('family-')?style.slice(7):'';}",context);
 const checked=JSON.parse(vm.runInContext(`(()=>{
  const remote=sanitizeMultiplayerAvatar(sanitizePresenceAvatar(multiplayerAvatarDescriptor()));
  const defaultRemote=sanitizeMultiplayerAvatar({bodyStyle:'family-thamis'});
  return JSON.stringify({remote,decoded:rioWardrobeFromToken(remote.torso),defaultRemote,
    defaultToken:rioWardrobeToken(rioWardrobeFromToken(defaultRemote.torso)),
    distinct:multiplayerAvatarSignature(remote)!==multiplayerAvatarSignature(defaultRemote)});
 })()`,context));
 assert.equal(checked.remote.bodyStyle,'family-thamis');
 assert(!Object.hasOwn(checked.remote,'rioWardrobe'));
 assert.match(checked.remote.torso,/^rio1-\d{8}$/);
 assert.deepEqual(checked.decoded,result.rioWardrobe.thamis);
 assert.equal(checked.defaultToken,'');
 assert(checked.distinct);
});

test('approved vertices, face and bones survive clothing; ankle, elbow and head parts follow walking and seats',()=>{
 const context=wardrobeContext();
 vm.runInContext(read('games/otthi/family-mascots.js'),context);
 vm.runInContext('const worldGroup=new THREE.Group(),animTime=0;',context);
 vm.runInContext(body('41-family-adventure'),context);
 const result=JSON.parse(vm.runInContext(`(()=>{
   familyWorld.studio=window.createMascotStudio({
    createBuffer:data=>({data:new Float32Array(data),count:data.length/9}),
    drawColored(){},contactShadow(){}
   },familyMatrices());
   for(const id of RIO_WARDROBE_CHARACTERS)familyWorld.actors[id]=familyCreateActor(id,0,0);
   return JSON.stringify(RIO_WARDROBE_CHARACTERS.map(id=>{
    const world=new THREE.Group(),local=familyCloneAvatar(id,world),other=familyCloneAvatar(id,world);
    const source=familyWorld.actors[id].mesh.geometry,sourceColors=source.attributes.color;
    applyRioWardrobeVisual(local,{});
    const exactDefault=local.mesh.geometry===source&&!local.rioWardrobe;
    const selected={top:id==='thiago'?'denim':'festival',legs:'jeans',shoes:'boot',hat:'cap',wrist:'watch',bag:'city'};
    applyRioWardrobeVisual(local,selected);applyRioWardrobeVisual(other,selected);
    const variant=local.mesh.geometry;
    const sharedOutfit=variant===other.mesh.geometry;
    const sameVertexStorage=variant.attributes.position.array===source.attributes.position.array;
    const exactIndex=variant.index.array===source.index.array;
    const compared=source.attributes.skinIndex,changed=variant.attributes.color;
    const headIndex=local.bones.indexOf(local.byName.head);
    let headSame=true,clothesColored=0;
    for(let i=0;i<sourceColors.count;i++){
      const different=changed.getX(i)!==sourceColors.getX(i)||changed.getY(i)!==sourceColors.getY(i)||changed.getZ(i)!==sourceColors.getZ(i);
      if(different&&compared.getX(i)===headIndex)headSame=false;
      if(different&&compared.getX(i)!==headIndex)clothesColored++;
    }
    const boot=local.rioWardrobe.parts.find(p=>p.name==='OTTHI_RIO_WARDROBE_BOOT');
    const watch=local.rioWardrobe.parts.find(p=>p.name==='OTTHI_RIO_WARDROBE_WATCH');
    const hat=local.rioWardrobe.parts.find(p=>p.name==='OTTHI_RIO_WARDROBE_HAT');
    const bag=local.rioWardrobe.bag;
    const tool=new THREE.Group();familyAttachTool(local,tool);
    world.updateMatrixWorld(true);
    const before=boot.getWorldPosition(new THREE.Vector3());
    for(let i=0;i<90;i++)familyAnimateAvatar(local,null,{speed:5,time:i*.039,run:true});
    world.updateMatrixWorld(true);
    const moved=boot.getWorldPosition(new THREE.Vector3()).distanceTo(before);
    familyAnimateAvatar(local,null,{sitting:true,time:4});
    const seatFits=!bag.visible&&local.byName['hip1'].rotation.x===-1.25&&
      (!local.rioWardrobe.skirt||local.rioWardrobe.skirt.scale.y<1);
    familyAnimateAvatar(local,null,{sitting:false,time:4.2});
    const unsits=bag.visible&&(!local.rioWardrobe.skirt||local.rioWardrobe.skirt.scale.y===1);
    const boundToRig=watch.parent===local.byName['elbow-1']&&hat.parent===local.byName.head&&tool.parent===local.byName.hand1;
    let disposed=0,sourceDisposed=0;
    variant.addEventListener('dispose',()=>disposed++);
    source.addEventListener('dispose',()=>sourceDisposed++);
    clearRioWardrobeVisual(local);
    const otherUnaffected=other.mesh.geometry===variant&&disposed===0;
    releaseFamilyAvatarVisual(other.group);
    return {id,exactDefault,sharedOutfit,sameVertexStorage,exactIndex,headSame,clothesColored,moved,seatFits,unsits,
     boundToRig,otherUnaffected,disposed,sourceDisposed,originalAfter:local.mesh.geometry===source,partsRemoved:!hat.parent};
   }));
 })()`,context));
 for(const item of result){
   assert(item.exactDefault&&item.sharedOutfit&&item.sameVertexStorage&&item.exactIndex&&item.headSame,item.id);
   assert(item.clothesColored>1000,item.id);
   assert(item.moved>.001,item.id);
   assert(item.seatFits&&item.unsits&&item.boundToRig&&item.otherUnaffected,item.id);
   assert.equal(item.disposed,1,item.id);
   assert.equal(item.sourceDisposed,0,item.id);
   assert(item.originalAfter&&item.partsRemoved,item.id);
 }
});

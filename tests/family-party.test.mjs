import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function family(){
 const c=vm.createContext({console,performance:{now:()=>100},URLSearchParams,Float32Array,setTimeout(){}});
 c.window={addEventListener(){},location:{search:''}};c.document={hidden:false};
 vm.runInContext(readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),c);
 vm.runInContext(`let authority=true;const state={avatar:{bodyStyle:'family-thiago'}},player={x:0,z:6,facing:0,vx:0,vz:0},input={};const world={colliders:[],ghosts:new Map()},worldGroup=new THREE.Group(),remotePresence=new Map();const lerp=(a,b,t)=>a+(b-a)*t,lerpAngle=lerp;const waterAt=()=>false,v704RoadAt=()=>false,v704ProtectedRectangles=()=>[],positionBlockedForPlayer=()=>false,groundHeightAt=()=>0,worldLayoutPoint=()=>({x:0,z:0}),createHouse=()=>{},registerInteractable=()=>{},sharedWorldIsAuthority=()=>authority,sharedWorldOwnId=()=> 'party-test',saveState=()=>{},toast=()=>{},beep=()=>{},buildRoutePoints=(a,b)=>[b];`,c);
 vm.runInContext(readFileSync('games/otthi/family-mascots.js','utf8'),c);
 vm.runInContext(readFileSync('games/otthi/src/modules/41-family-adventure.js','utf8'),c);
 vm.runInContext('initFamilyAdventure()',c);
 return code=>vm.runInContext(code,c);
}
test('family: Thiago + Luna + Liz follow as a real group; Thamis remains at home',()=>{
 const run=family();
 const result=run(`
 const homeBefore={x:familyWorld.actors.thamis.x,z:familyWorld.actors.thamis.z};
 const accepted=familyApplyCommand('party',{controller:'thiago',members:['thiago','luna','liz']},'party-test',player);
 const dogBefore={x:familyWorld.actors.luna.x,z:familyWorld.actors.luna.z};
 for(let i=0;i<240;i++){player.x+=.025;updateFamilyAdventure(1/60);}
 ({accepted,party:familySnapshot(),dogs:['luna','liz'].map(id=>Math.hypot(player.x-familyWorld.actors[id].x,player.z-familyWorld.actors[id].z)),homeDistance:Math.hypot(familyWorld.actors.thamis.x-homeBefore.x,familyWorld.actors.thamis.z-homeBefore.z),dogMoved:Math.hypot(familyWorld.actors.luna.x-dogBefore.x,familyWorld.actors.luna.z-dogBefore.z),controlledDuplicate:familyWorld.actors.thiago.group.visible});`);
 assert(result.accepted);assert.deepEqual(Array.from(result.party.walkMembers),['thiago','luna','liz']);assert.equal(result.party.walkController,'thiago');
 assert(result.dogs.every(d=>d<4),'Selected companions must keep up');assert(result.dogMoved>2);assert(result.homeDistance<1);assert.equal(result.controlledDuplicate,false);
});
test('family: all, solo and arbitrary subsets retain the controller and reject unknown names',()=>{
 const run=family();
 for(const [value,want]of [[{controller:'thamis',members:['thiago','thamis','luna','liz']},['thiago','thamis','luna','liz']],[{controller:'thamis',members:[]},['thamis']],[{controller:'thiago',members:['liz','invalid','liz']},['thiago','liz']]]){
  const party=run('normalizeFamilyParty('+JSON.stringify(value)+')');assert.deepEqual(Array.from(party.members),want);
 }
});
test('family: a shared party cannot be stolen, and its selected members survive snapshot transport',()=>{
 const run=family();
 const result=run(`familyApplyCommand('party',{controller:'thiago',members:['thiago','luna','liz']},'party-test',player);
 const saved=JSON.parse(JSON.stringify(familySnapshot()));
 const stolen=familyApplyCommand('party',{controller:'thamis',members:['thamis']},'another-player',player);
 const stopped=familyApplyCommand('stop',{},'another-player',player);
 familyWorld.walkMembers=[];familyApplySnapshot(saved,1);
 ({stolen,stopped,members:familyWorld.walkMembers,controller:familyWorld.walkController,owner:familyWorld.walkOwner});`);
 assert(!result.stolen&&!result.stopped);assert.deepEqual(Array.from(result.members),['thiago','luna','liz']);assert.equal(result.controller,'thiago');assert.equal(result.owner,'party-test');
});

test('family: a guest sends the chosen subset when starting a walk in a shared room',()=>{
 const run=family();
 const sent=run(`authority=false;let sent=null;window.OTTHOS_RTDB={connected:()=>true,sendEventV2:(event,payload)=>{sent={event,payload};return Promise.resolve({ok:true});}};
 familyProgress().party={controller:'thiago',members:['thiago','luna','liz']};familyWorld.walkOwner='party-test';familyCommand('walk');sent;`);
 assert.equal(sent.event,'family-command');assert.equal(sent.payload.kind,'walk');assert.deepEqual(Array.from(sent.payload.members),['thiago','luna','liz']);
});

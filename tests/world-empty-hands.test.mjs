import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=name=>fs.readFileSync('games/otthi/src/modules/'+name,'utf8');
const tools=read('06-missions-profile-hud-inventory-tools.js');
const toolsCode=tools.slice(tools.indexOf('  const TOOL_DEFS='),tools.indexOf('  function playToolAnimation('));
const shared=read('28a-shared-world-multiplayer.js');
const ghostCode=shared.slice(shared.indexOf('  function sharedWorldBuildGhostTool('),shared.indexOf('  function sharedWorldSkillAura('));

function fixture(){
 const c=vm.createContext({});
 vm.runInContext(`
  class Group {
   constructor(){this.children=[];this.position={set(){}};this.rotation={};this.userData={};}
   add(child){child.parent?.remove(child);this.children.push(child);child.parent=this;}
   remove(child){this.children=this.children.filter(item=>item!==child);child.parent=null;}
  }
  const THREE={Group},materials={},disposed=[],saved=[],messages=[],arm=new Group();
  let toolVisual=null;
  const state={tools:{owned:['axe','bucket'],equipped:'axe',harvested:{wood:7}},inventory:{wood:19},profile:{coins:2345},career:{activeJob:{id:'delivery-keep'}}};
  const playerModel={userData:{parts:{rightArm:arm}}},player={vehicle:false,boating:false,transit:{mode:''}};
  const els={toolsBtn:{firstChild:{textContent:''},label:{textContent:''}}};
  const $=(_selector,element)=>element.label;
  function saveState(){saved.push(JSON.stringify(state));}
  function disposeDetachedVisual(group){disposed.push(group);}
  function box(_w,_h,_d,_material,_x,_y,_z,parent){const child=new Group();parent.add(child);return child;}
  function renderMat(){return{};}
  function toast(message){messages.push(message);}
 `+toolsCode+ghostCode,c);
 return code=>vm.runInContext(code,c);
}

test('empty hands removes the held model, saves the explicit choice and keeps inventory/progress intact',()=>{
 const run=fixture();
 const before=run(`refreshEquippedToolVisual();JSON.stringify({owned:state.tools.owned,harvested:state.tools.harvested,inventory:state.inventory,profile:state.profile,career:state.career})`);
 const result=run(`const oldTool=toolVisual;const accepted=equipTool('none');({accepted,equipped:state.tools.equipped,toolVisual,armChildren:arm.children.length,disposed:disposed.includes(oldTool),saved:JSON.parse(saved.at(-1)),label:equippedTool().name,button:els.toolsBtn.label.textContent,preserved:JSON.stringify({owned:state.tools.owned,harvested:state.tools.harvested,inventory:state.inventory,profile:state.profile,career:state.career})})`);
 assert.equal(result.accepted,true);assert.equal(result.equipped,'none');assert.equal(result.toolVisual,null);assert.equal(result.armChildren,0);assert.equal(result.disposed,true);
 assert.equal(result.saved.tools.equipped,'none');assert.equal(result.label,'Mãos vazias');assert.equal(result.button,'Mãos vazias');assert.equal(result.preserved,before);
 const restored=run(`state.tools=JSON.parse(saved.at(-1)).tools;refreshEquippedToolVisual();({equipped:state.tools.equipped,visual:toolVisual,accepted:equipTool('axe'),visible:toolVisual?.visible,children:arm.children.length,invalid:equipTool('pickaxe')})`);
 assert.equal(restored.equipped,'none');assert.equal(restored.visual,null);assert.equal(restored.accepted,true);assert.equal(restored.visible,true);assert.equal(restored.children,1);assert.equal(restored.invalid,false,'empty-hands selection must not bypass ownership of real tools');
});

test('empty hands also clears remote avatars without allocating a replacement or falling back to an axe',()=>{
 const run=fixture();
 const r=run(`const hand=new THREE.Group(),ghost={userData:{familyAvatar:{byName:{hand1:hand}}}};const first=sharedWorldBuildGhostTool(ghost,'axe');const payload=JSON.parse(JSON.stringify({toolId:'none'}));const cleared=sharedWorldBuildGhostTool(ghost,payload.toolId);for(let i=0;i<120;i++)sharedWorldBuildGhostTool(ghost,payload.toolId);({first:!!first,cleared,model:ghost.userData.remoteTool,id:ghost.userData.remoteToolId,children:hand.children.length,disposed:disposed.includes(first),again:!!sharedWorldBuildGhostTool(ghost,'axe'),newChildren:hand.children.length})`);
 assert.equal(r.first,true);assert.equal(r.cleared,null);assert.equal(r.model,null);assert.equal(r.id,'none');assert.equal(r.children,0);assert.equal(r.disposed,true);assert.equal(r.again,true);assert.equal(r.newChildren,1);
});

test('hands-free characters cannot harvest resources as though a tool were still equipped',()=>{
 const run=fixture();
 const resources=read('20-world-build-cloud-houses.js'),start=resources.indexOf('  function collectResource('),end=resources.indexOf('\n  function ',start+4);
 assert(start>=0&&end>start);
 // The guard must return before any harvest, tool animation or reward path.
 run(`const notices=[],world={resources:[]};toast=message=>notices.push(message);`+resources.slice(start,end));
 const result=run(`state.tools.equipped='none';const resource={id:'tree-qa',type:'wood',collected:false,hits:0,hitsNeeded:3};world.resources.push(resource);collectResource(resource.id);({hits:resource.hits,wood:state.inventory.wood,equipped:state.tools.equipped,notice:notices.at(-1)})`);
 assert.equal(result.hits,0);assert.equal(result.wood,19);assert.equal(result.equipped,'none');assert.match(result.notice,/machado/i);
});

test('native save normalization keeps an existing tool choice and restores saved empty hands',()=>{
 const persistence=read('01-build-persistence.js'),save=read('02-state-save-cloud-account.js');
 const helpers=persistence.slice(persistence.indexOf('  function stableBuildId('),persistence.indexOf('  const els ='));
 const defaults=persistence.slice(persistence.indexOf('  const defaultState ='));
 const normalize=save.slice(save.indexOf('  function normalizeState('),save.indexOf('  function loadState('));
 const c=vm.createContext({APP_VERSION:705,uid:()=> 'tools-save-qa',window:{},defaultAvatarV2:()=>({}),normalizeAvatarV2:x=>x,normalizeRoomId:x=>x||'bairro-central'});
 vm.runInContext(helpers+defaults+normalize,c);
 const r=vm.runInContext(`const fresh=normalizeState(),prior=normalizeState({tools:{equipped:'axe',owned:['axe'],harvested:{wood:8}},profile:{coins:1789}});const empty=normalizeState(JSON.parse(JSON.stringify({...prior,tools:{...prior.tools,equipped:'none'}})));({fresh:fresh.tools,prior:prior.tools,empty:empty.tools,coins:empty.profile.coins})`,c);
 assert.equal(r.fresh.equipped,'none');assert.equal(r.fresh.owned.length,5);
 assert.equal(r.prior.equipped,'axe');assert.deepEqual(Array.from(r.prior.owned),['axe']);assert.equal(r.prior.harvested.wood,8);
 assert.equal(r.empty.equipped,'none');assert.deepEqual(Array.from(r.empty.owned),['axe']);assert.equal(r.empty.harvested.wood,8);assert.equal(r.coins,1789);
});

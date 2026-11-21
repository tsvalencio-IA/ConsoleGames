import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const core=fs.readFileSync('games/otthi/assets/js/world/civil-mission-core.js','utf8');
const source=fs.readFileSync('games/otthi/src/modules/66-civil-missions.js','utf8');
function fixture(saved=null){
 const nodes=new Map(),listeners=new Map();
 function node(id=''){
  const element={id,parentNode:null,hidden:false,disabled:false,textContent:'',style:{},attributes:{},children:[],setAttribute(k,v){this.attributes[k]=String(v);},removeAttribute(k){delete this.attributes[k];},append(child){child.parentNode?.children.splice(child.parentNode.children.indexOf(child),1);child.parentNode=this;this.children.push(child);if(child.id)nodes.set(child.id,child);},querySelector(){return this.message||null;},click(){if(!this.disabled)return this.onclick?.();}};
  if(id)nodes.set(id,element);return element;
 }
 const game=node('game'),hud=node('ot-games-hud');hud.message=node();
 const state=saved?JSON.parse(JSON.stringify(saved)):{profile:{playerId:'qa',coins:100},account:{},objectives:{},civilWorld:{migratedAt:1,difficulty:'normal'}};
 const context=vm.createContext({console,Map,Set,Number,Math,Date,Promise,JSON,crypto:{randomUUID:()=>'photo-qa'},state,player:{x:250,y:80,z:212,grounded:true,vehicle:false,boating:false},otGames:{active:false,mode:'balloon',body:{x:260,y:100,z:255},ui:hud},qaNow:10000,paused:false,running:true,currentHouse:null,
  window:{addEventListener(type,fn){listeners.set(type,fn);},OTTHI_COOP:{},OTTHI_CAMPAIGN:{},OT_GAMES:{},OTTHOS_TEST_API:{}},
  document:{getElementById:id=>nodes.get(id)||null,createElement:()=>node()},els:{missionChapter:node(),missionTitle:node(),missionStep:node(),missionFill:node(),missionCard:node(),modal:{hidden:true}},
  civilCommunity:{ready:true,targets:new Map(),props:new Map(),ride:null},characterActivities:{session:null},CHARACTER_ACTIVITIES:{},remotePresence:new Map(),sharedWorldRuntime:{},
  sharedWorldOwnId:()=>'qa',multiplayerV2Enabled:()=>false,airNow(){return context.qaNow;},groundHeightAt:()=>80,saveState(){},clearWaypoint(){},setWaypoint(id){state.waypoint={id};},worldExploreLocations:()=>[],otGamesFocus(){return context.otGames.active?context.otGames.body:context.player;},otGamesUpdateHUD(){hud.message.textContent='Passeio livre';},civilCheckRoom(){},civilPruneRecords(){},civilPruneTransit(){},sharedWorldCaptureScene:()=>({}),familyRideForOwner:()=>null,familyCarrySeats:()=>({}),updateFamilyCarry(){},mergeCloudProgress:()=>true,openModal(){},closeModal(){context.els.modal.hidden=true;},toast(message){context.lastToast=message;},addCoins(amount){state.profile.coins+=amount;},addXP(){},awardMedal(){},beginCharacterActivity(kind,options){context.characterActivities.session={kind,...options};return true;},stopCharacterActivity(){context.characterActivities.session=null;}
 });
 vm.runInContext(core,context);vm.runInContext(source,context);
 for(const [id,x,z,extra]of[['balloon-festival',250,212,{}],['balloon-view-0',260,255,{radius:18,minAltitude:14,vehicle:'balloon'}],['balloon-view-1',300,285,{radius:18,minAltitude:14,vehicle:'balloon'}],['balloon-view-2',355,315,{radius:18,minAltitude:14,vehicle:'balloon'}]])context.civilCommunity.targets.set(id,{id,x,z,radius:3.4,...extra});
 const missions=vm.runInContext('civilMissions',context);
 const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
 const update=()=>context.updateCivilMissions();
 const button=()=>nodes.get('civil-mission-task');
 async function foot(subject){await context.civilTaskAt(subject);assert(context.characterActivities.session,'real foot task begins');context.qaNow+=4000;context.characterActivities.session.commit();context.characterActivities.session=null;await flush();update();}
 async function start(){await context.civilCreateMission('balloon','solo');await foot('balloon-festival');}
 function fly(target='balloon-view-0',altitude=20){const p=context.civilCommunity.targets.get(target);Object.assign(context.otGames.body,{x:p.x,y:80+altitude,z:p.z});context.otGames.active=true;context.otGames.mode='balloon';update();}
 async function finishPhoto(){context.qaNow+=2500;update();await flush();update();}
 return {c:context,state,missions,nodes,game,hud,listeners,update,button,flush,start,foot,fly,finishPhoto,current:()=>context.civilCurrent().r};
}
test('balloon photo lives in the flight control layer and F captures once without changing lift controls',async()=>{
 const f=fixture();await f.start();f.fly();
 const button=f.button();assert.equal(button.parentNode,f.hud);assert.equal(button.hidden,false);assert.equal(button.disabled,false);assert.match(button.textContent,/Tirar foto/);assert.equal(button.attributes['aria-keyshortcuts'],'F');
 let prevented=0,stopped=0;
 const key=(code,repeat=false)=>({code,repeat,target:{closest:()=>false},preventDefault(){prevented++;},stopImmediatePropagation(){stopped++;}});
 f.listeners.get('keydown')(key('KeyE'));assert.equal(prevented,0,'E remains the balloon heating input');
 f.listeners.get('keydown')(key('KeyF'));await f.flush();const pendingAt=f.current().pending.qa.at;
 f.c.qaNow+=250;f.listeners.get('keydown')(key('KeyF',true));await f.flush();assert.equal(f.current().pending.qa.at,pendingAt);assert.equal(prevented,2);assert.equal(stopped,2);
 f.c.otGamesUpdateHUD();assert.match(f.hud.message.textContent,/panorâmicos/);
 f.c.otGames.active=false;f.update();assert.equal(f.button().parentNode,f.game,'walking action returns to its original layer');
});
test('balloon mission can photograph panoramas in either order, land and reward exactly once across reload',async()=>{
 const f=fixture();await f.start();assert.equal(f.current().phase,1);
 for(const target of['balloon-view-2','balloon-view-0']){f.fly(target);await f.button().click();assert(f.missions.task?.air);await f.finishPhoto();assert.match(f.c.lastToast,/registrada/);}
 assert.equal(f.current().phase,2);assert.equal(f.button().hidden,true,'landing stage cannot be completed from the balloon');assert.equal(f.state.profile.coins,100);
 f.c.otGames.active=false;Object.assign(f.c.player,{x:250,z:212});f.update();await f.foot('balloon-festival');assert.equal(f.current().status,'completed');assert.equal(f.state.profile.coins,300);assert.equal(Object.keys(f.state.civilWorld.rewardReceipts).length,1);
 for(let i=0;i<8;i++)f.update();assert.equal(f.state.profile.coins,300);
 const restored=fixture(f.state);restored.c.ensureCivilMissions();restored.update();assert.equal(restored.state.profile.coins,300);assert.equal(restored.current().status,'completed');
});
test('photo requires the real balloon, altitude and range; leaving the panorama cancels without credit',async()=>{
 const f=fixture();await f.start();f.fly('balloon-view-0',5);assert.equal(f.button().hidden,false);assert.equal(f.button().disabled,true);assert.match(f.button().textContent,/mínimo 14 m/);assert.equal(f.c.civilTriggerFlightPhoto(),false);
 f.c.otGames.mode='helicopter';f.update();assert.equal(f.button().hidden,true);assert.equal(f.c.civilTriggerFlightPhoto(),false);
 f.fly();assert.equal(f.c.civilTriggerFlightPhoto(),true);await f.flush();assert(f.missions.task);f.c.otGames.body.x+=100;f.c.qaNow+=3000;f.update();await f.flush();assert.equal(f.missions.task,null);assert.equal(Object.keys(f.current().tokens).length,1,'only briefing completed');assert.equal(f.current().counts['1:qa'],undefined);
 f.fly();await f.button().click();await f.finishPhoto();assert.equal(f.current().counts['1:qa'],1);
});
test('repeated photo presses cannot reset pending work or register one panorama twice',async()=>{
 const f=fixture();await f.start();f.fly();const button=f.button();const first=button.click(),second=button.click();await Promise.all([first,second]);const pendingAt=f.current().pending.qa.at;
 f.c.qaNow+=400;assert.equal(f.c.civilTriggerFlightPhoto(),false);await f.c.civilTaskAt('balloon-view-0');assert.equal(f.current().pending.qa.at,pendingAt);
 await f.finishPhoto();assert.equal(f.current().counts['1:qa'],1);await f.c.civilTaskAt('balloon-view-0');assert.equal(f.current().counts['1:qa'],1);assert.equal(f.state.profile.coins,100);
});
test('cooperative balloon photos credit each participant separately and pause on teammate disconnect',async()=>{
 const f=fixture();f.c.ensureCivilMissions();let online=true;
 f.c.window.OTTHOS_RTDB={uid:'qa',connected:()=>online,getRoom:()=>'qa-room'};f.c.multiplayerV2Enabled=()=>true;f.c.sharedWorldIsAuthority=()=>true;f.c.sharedWorldAuthorityId=()=>'qa';f.c.multiplayerV2WorldSnapshot=()=>null;
 const book=f.missions.shared,r=book.create('coop-photo','balloon','qa','coop','easy',1);assert(book.join(r.id,'partner'));book.ready(r.id,'qa',true);book.ready(r.id,'partner',true);assert(book.start(r.id,'qa'));
 for(const uid of['qa','partner']){assert(book.begin(r.id,uid,0,'balloon-festival',1000));assert(book.finish(r.id,uid,0,'balloon-festival',2000));}
 Object.assign(f.state.civilWorld,{mode:'coop',activeId:r.id});f.c.remotePresence.set('partner',{x:260,z:255,y:100,updatedAt:f.c.qaNow,familyRide:{kind:'aircraft',mode:'balloon',x:260,z:255,y:100,onGround:false}});f.fly();await f.button().click();await f.finishPhoto();assert.equal(r.phase,1,'a photo cannot finish the partner’s share');assert.equal(r.counts['1:qa'],1);assert.equal(r.counts['1:partner'],undefined);
 assert(book.begin(r.id,'partner',1,'balloon-view-0',f.c.qaNow));f.c.qaNow+=1200;assert.equal(f.c.civilHandle(book,'partner','finish',{id:r.id,phase:1,subject:'balloon-view-0'}).ok,true);assert.equal(r.phase,2);
 online=false;assert.equal(f.c.civilTeamReady(r),false);assert.equal(f.c.civilValidateTask(book,r.id,'qa',2,'balloon-festival'),false);
});

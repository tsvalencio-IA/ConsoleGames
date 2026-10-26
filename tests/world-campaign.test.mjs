import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../games/otthi/src/modules/43-world-campaign.js',import.meta.url),'utf8');
function fixture(){
  const saved=new Map(),toastCalls=[],spawnCalls=[],nativeResults=[],waypoints=[];
  class Object3D {
    constructor(){this.children=[];this.position={x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z}};this.rotation={};this.parent=null;this.visible=true;}
    add(o){o.parent=this;this.children.push(o);}
  }
  class Group extends Object3D{}
  class Mesh extends Object3D{constructor(geometry,material){super();this.geometry=geometry;this.material=material;}}
  class Geometry{constructor(...dimensions){this.dimensions=dimensions;}}
  class Material{constructor(config){this.config=config;}}
  const three={Group,Mesh,BoxGeometry:Geometry,CylinderGeometry:Geometry,PlaneGeometry:Geometry,
    MeshStandardMaterial:Material,MeshBasicMaterial:Material,CanvasTexture:class{constructor(c){this.canvas=c}},DoubleSide:2};
  const element=tag=>({
    tag,style:{},hidden:false,children:[],innerHTML:'',textContent:'',attrs:{},
    classList:{add(){},toggle(){}},addEventListener(){},setAttribute(k,v){this.attrs[k]=v;},
    append(o){this.children.push(o);},prepend(o){this.children.unshift(o);},
    querySelector(){return {textContent:'',hidden:false}},getContext(){return {
      fillRect(){},strokeRect(){},fillText(){},set font(v){},set fillStyle(v){},set strokeStyle(v){},set textAlign(v){},set lineWidth(v){}
    }}
  });
  const body=element('body'),head=element('head'),quickBar=element('quickBar'),game=element('game');
  const document={body,head,createElement:element,getElementById:id=>id==='quickBar'?quickBar:id==='game'?game:null};
  const player={x:-120,y:0,z:-54};
  const otGames={active:false,mode:'peace',state:'PLAYING',body:null,armed:false,enemies:[],bullets:[],effects:[],
    ui:{querySelector(){return {hidden:true}}},kills:0,goal:0};
  const context={
    window:{},document,THREE:three,worldGroup:new Group(),scene:new Group(),player,
    otGames,running:true,paused:false,state:{profile:{playerId:'test-player'}},cameraYaw:0,
    v704WorldBounds:()=>({minX:-290,maxX:290,minZ:-290,maxZ:290}),groundHeightAt:()=>0,
    safeLocalGet:key=>saved.get(key)||null,
    safeLocalSet:(key,value)=>saved.set(key,value),
    toast:(...args)=>toastCalls.push(args),closeModal(){},setWaypoint(id){waypoints.push(id);},
    openModal(){},$$(){return []},
    otGamesEnter:async(mode,opts)=>{
      otGames.active=true;otGames.mode=mode;otGames.armed=opts.armed;
      otGames.options=opts;otGames.onGround=!!opts.groundLaunch;otGames.groundLaunch=!!opts.groundLaunch;otGames.body={x:player.x,y:mode==='ground'?1.8:opts.groundLaunch?1.3:28,z:player.z,yaw:0,pitch:0,hp:100};
      otGames.kills=0;otGames.state='PLAYING';otGames.enemies=[];otGames.bullets=[];otGames.effects=[];
      return true;
    },
    otGamesCamera(){},otGamesUpdateHUD(){},
    otGamesSpawnWave(){spawnCalls.push('wave');},
    otGamesSaveResult(won){nativeResults.push(won);},
    otGamesDisposeGroup(){},
    otGamesLeave(){otGames.active=false;otGames.mode='peace';}
  };
  vm.createContext(context);
  vm.runInContext(source+'\n;globalThis.campaignTick=updateWorldCampaign;',context);
  return {context,player,otGames,saved,spawnCalls,toastCalls,nativeResults,waypoints,game,
    tick:()=>context.campaignTick(.25),api:context.window.OTTHI_CAMPAIGN};
}

test('campaign geography renders into same world scene, with three persistent local landmarks',()=>{
  const f=fixture();f.tick();
  assert.equal(f.api.diagnostics().initialized,true);
  assert.deepEqual(Array.from(f.api.diagnostics().landmarks).map(x=>x.site),['hq','airbase','north']);
  assert(f.api.diagnostics().landmarks.every(x=>x.attached));
});

test('a ground mission must start at HQ; north-sector victory only records after physical return',async()=>{
  const f=fixture();f.tick();
  assert.equal(await f.api.start('ground'),true);
  assert.equal(f.api.diagnostics().phase,'travel');
  f.otGames.body.x=89;f.otGames.body.z=126;f.tick();
  assert.equal(f.api.diagnostics().phase,'combat');
  assert.equal(f.otGames.armed,true);
  assert.equal(f.spawnCalls.length,1);
  f.otGames.kills=6;f.otGames.state='VICTORY';f.tick();
  assert.equal(f.api.diagnostics().phase,'return');
  assert.equal(f.otGames.armed,false);
  assert.equal(f.api.diagnostics().records['norte-ground'],undefined,'no reward before return');
  f.otGames.body.x=-120;f.otGames.body.z=-54;f.tick();
  assert.equal(f.otGames.active,false);
  assert.equal(f.api.diagnostics().phase,'idle');
  assert.equal(f.api.diagnostics().records['norte-ground'],1);
  assert.deepEqual(f.nativeResults,[true],'native progression is credited only after physical return');
  f.tick();assert.equal(f.api.diagnostics().records['norte-ground'],1,'reconnect and next ticks must not duplicate completion');
  assert.deepEqual(f.nativeResults,[true],'native progression is not duplicated on later frames');
});

test('no remote start is allowed, and abandoning combat awards no completion',async()=>{
  const f=fixture();f.tick();
  f.player.x=0;f.player.z=0;
  assert.equal(await f.api.start('helicopter'),false);
  f.player.x=27;f.player.z=-169;
  assert.equal(await f.api.start('helicopter'),false,'base access alone does not board a distant aircraft');
  assert.equal(f.waypoints.at(-1),'campaign-helicopter');
  f.player.x=50;f.player.z=-165;
  assert.equal(await f.api.start('helicopter'),true);
  f.otGames.active=false;f.tick();
  assert.equal(f.api.diagnostics().phase,'idle');
  assert.equal(f.api.diagnostics().records['norte-helicopter'],undefined);
});

test('campaign MISSÕES button exists outside collapsed quickBar; bases and both aircraft appear as official map markers',()=>{
  const f=fixture();f.tick();
  const button=f.game.children.find(x=>x.id==='worldCampaignBtn');
  assert(button,'MISSÕES must be visible in game HUD rather than the collapsed Vida menu');
  assert.equal(button.textContent,'MISSÕES');
  const all=Array.from(f.context.campaignMapLocations());
  assert.equal(all.length,5);
  assert.deepEqual(all.map(x=>x.id),['campaign-hq','campaign-airbase','campaign-north','campaign-plane','campaign-helicopter']);
  assert(all.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.z)),'all bases retain geographic map markers');assert(all.every(x=>!x.missionTarget),'idle bases must not look like simultaneous active mission targets');
  f.api.navigate('airbase');
  assert.deepEqual(f.waypoints,['campaign-airbase'],'route button must call existing blue-arrow GPS system');
});

test('campaign save/continue retains real ground-launch controls, requires explicit resume, and cancellation clears the checkpoint without a victory',async()=>{
 const f=fixture();f.tick();f.player.x=-5;f.player.z=-165;assert(await f.api.start('plane'));assert.equal(f.api.diagnostics().phase,'depart');assert(f.api.diagnostics().checkpoint);const key='thia:otthi:campaign:v1:test-player:session';
 f.context.campaignAbort({preserve:true});f.otGames.active=false;assert.equal(f.api.diagnostics().phase,'idle');assert.equal(f.api.diagnostics().checkpoint,true);assert.equal(f.otGames.active,false,'a saved checkpoint never launches or opens a camera by itself');
 assert(await f.api.resume());assert.equal(f.otGames.options.groundLaunch,true,'resumed plane must rebuild its visible throttle control');assert.equal(f.otGames.onGround,true);assert.equal(f.api.diagnostics().phase,'depart');assert.equal(f.otGames.body.y,1.3);
 f.context.campaignAbort({preserve:false});f.otGames.active=false;assert.equal(f.api.diagnostics().phase,'idle');assert.equal(f.api.diagnostics().checkpoint,false);assert.equal(JSON.parse(f.saved.get(key)),null);assert.deepEqual(f.nativeResults,[]);
});
test('campaign ignores malformed, dead or out-of-range checkpoint bodies',async()=>{
 const f=fixture();f.tick();const key='thia:otthi:campaign:v1:test-player:session';
 for(const body of [{x:1,y:1.8,z:1,yaw:0,pitch:0,hp:0},{x:1,y:999,z:1,yaw:0,pitch:0,hp:100},{x:1,y:1.8,z:1,yaw:0,pitch:2,hp:100}]){f.saved.set(key,JSON.stringify({v:1,mode:'ground',phase:'travel',body}));assert.equal(f.api.diagnostics().checkpoint,false);assert.equal(await f.api.resume(),false);}
 f.saved.set(key,JSON.stringify({v:1,mode:'ground',phase:'travel',body:{x:9999,y:1.8,z:1,yaw:0,pitch:0,hp:100}}));assert.equal(await f.api.resume(),false);assert.equal(f.otGames.active,false);
});

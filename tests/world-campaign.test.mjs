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
    window:{},document,THREE:three,OT_CHILD_WORLD:true,openCivilMissions(){context.civilOpened=(context.civilOpened||0)+1;},worldGroup:new Group(),scene:new Group(),player,
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

test('civil world retires ground operations and directs old mission entry to the current civilian stories',async()=>{
 const f=fixture();f.tick();assert.equal(await f.api.start('ground'),false);assert.equal(await f.api.start('plane'),false);assert.equal(f.context.civilOpened,2);assert.deepEqual(f.spawnCalls,[]);assert.deepEqual(f.nativeResults,[]);assert.equal(f.otGames.active,false);
});
test('old military checkpoints never resume or grant a reward in the civilian world',async()=>{
 const f=fixture();f.tick();for(const mode of['ground','plane','helicopter']){f.saved.set('thia:world-campaign:v1:test-player:session',JSON.stringify({v:1,mode,phase:'combat',body:{x:0,y:20,z:0,yaw:0,pitch:0,hp:100}}));assert.equal(await f.api.resume(),false);assert.equal(f.api.diagnostics().checkpoint,false);}assert.deepEqual(f.nativeResults,[]);assert.deepEqual(f.spawnCalls,[]);
});
test('civil geography keeps the same landmarks and parked flight bases',()=>{
 const f=fixture();f.tick();const sites=f.api.sites();assert.equal(sites.length,3);assert(sites.every(s=>!/quartel|militar|tático|combate/i.test(s.label)));assert(f.api.parked().length>=9);assert(f.api.diagnostics().landmarks.every(l=>l.attached));
});

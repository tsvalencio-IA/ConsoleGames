import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import vm from 'node:vm';
import {cooperativeFixture} from './helpers/coop-fixture.mjs';
const types=['firefighter','paramedic','police','fishing','school','streetRace','ovalRace'];
for(const difficulty of ['easy','normal','hard'])for(const mode of ['solo','duo'])test(`OTThi: all seven ${mode} missions have reachable ordered endings at ${difficulty} difficulty`,async()=>{
 for(const type of types){
  const f=cooperativeFixture(difficulty),{run,action,target,flush}=f;
  assert.equal(await f.start(type,mode),true,type+' cannot start');
  assert.equal(run('activeCoopRecord().difficulty'),difficulty);
  if(['firefighter','paramedic','police'].includes(type)){
   target();assert.equal(await action(),true,type+' boarding');
   run('player.x=activeCoopMission().sceneTarget.x;player.z=activeCoopMission().sceneTarget.z;updateCoopMissions(.016);player.vehicle=false;');await flush();
   assert.equal(run('coopProgress().phase'),2,type+' arrival');
   if(mode==='duo')run("window.OTTHOS_RTDB.uid='guest'");
   if(type==='firefighter'){
    const n=run('coopDifficulty().fire');for(let i=0;i<n;i++){target();assert.equal(await action(),true,'water '+i);}
    if(mode==='duo')run("window.OTTHOS_RTDB.uid='host'");
    assert.equal(await action(),true,'Two players must be able to release the site');
   }else if(type==='paramedic'){
    assert.equal(await action(),true,'first aid');if(mode==='duo'){assert.equal(await action(),false,'A far partner cannot carry the stretcher');run('window.OTTHOS_RTDB.getPresence=()=>({host:{x:player.x,z:player.z,updatedAt:Date.now()},guest:{x:player.x,z:player.z,updatedAt:Date.now()}})');}assert.equal(await action(),true,'stretcher');
    target();assert.equal(await action(),true,'patient loaded');
    if(mode==='duo')run("window.OTTHOS_RTDB.uid='host'");
    target();run('player.vehicle=true;updateCoopMissions(.016);');await flush();
   }else{
    target();assert.equal(await action(),true,'approach');assert.equal(await action(),true,'conversation');
    target();run('activeCoopMission().sceneTarget.ref.group.position.set(100,0,100)');assert.equal(await action(),false,'Cannot leave the escorted NPC behind');
    run('activeCoopMission().sceneTarget.ref.group.position.set(player.x,0,player.z)');assert.equal(await action(),true,'escort');
   }
  }else if(type==='fishing'){
   target();await action();run('state.inventory.rawFish+=coopDifficulty().fish;updateCoopFishingProgress(activeCoopMission(),activeCoopRecord())');await flush();
   assert.equal(run('coopProgress().phase'),2,'Catch target must lead to campfire');
   const n=run('coopDifficulty().cook');for(let i=0;i<n;i++){target();assert.equal(await action(),true,'cooking '+i);}
  }else if(type==='school'){
   const n=run('coopDifficulty().students');for(let i=0;i<n;i++){
    target();assert.equal(await action(),true,'invite '+i);target();
    run('world.npcs.find(n=>activeCoopMission().followingNpcIds.includes(n.id)).group.position.set(player.x,0,player.z)');
    assert.equal(await action(),true,'deliver '+i);
   }
   assert.equal(run('coopProgress().counter'),n);
  }else{
   const people=mode==='duo'?['host','guest']:['host'];
   for(const uid of people){
    run(`window.OTTHOS_RTDB.uid='${uid}';activeCoopMission().race={started:false,checkpoints:0,laps:0,expectedSector:1}`);target();await action();
    if(type==='streetRace'){
     run('player.x=COOP_STREET_ROUTE[4].x;player.z=COOP_STREET_ROUTE[4].z;updateCoopRaceProgress(activeCoopMission(),activeCoopRecord())');
     assert.equal(run('activeCoopMission().race.checkpoints'),0,'Skipped checkpoints must not count');
     for(let i=1;i<=4;i++)run(`player.x=COOP_STREET_ROUTE[${i}].x;player.z=COOP_STREET_ROUTE[${i}].z;updateCoopRaceProgress(activeCoopMission(),activeCoopRecord())`);
    }else{
     const laps=run('coopDifficulty().laps');
     for(let lap=0;lap<laps;lap++)for(const index of [1,2,3,0])run(`player.x=[76,50,24,50][${index}];player.z=[50,64,50,36][${index}];updateCoopRaceProgress(activeCoopMission(),activeCoopRecord())`);
     assert.equal(run('activeCoopMission().race.laps'),laps,'Every complete oval sector sequence must count');
    }
    if(mode==='duo'&&uid==='host')assert.equal(run('coopRaceTargetReached()'),false,'Coop cannot finish without the second runner');
   }
  }
  await action('maybeCompleteCoopMission()');assert.equal(run('activeCoopMission()'),null,type+' never completes');
  const coins=run('coins');await action('maybeCompleteCoopMission()');assert.equal(run('coins'),coins,type+' pays twice');assert(coins>0);
 }
});
test('OTThi: online selection never silently becomes solo, and an absent partner pauses progress',async()=>{
 const f=cooperativeFixture(),{run,action}=f;
 run('window.OTTHOS_RTDB.connected=()=>false');assert.equal(await action("createCooperativeMission('firefighter','coop',2)"),false);assert.equal(run('activeCoopMission()'),null);
 run('window.OTTHOS_RTDB.connected=()=>true');await f.start('firefighter','duo');
 run("window.OTTHOS_RTDB.getPresence=()=>({});");const before=run('JSON.stringify(coopProgress())');
 assert.equal(await action("coopAddCounter('water-pulse',1,4,3)"),false);assert.equal(run('JSON.stringify(coopProgress())'),before);assert.equal(run('activeCoopRecord().mode'),'coop');
});
test('OTThi: duo needs exactly two ready participants and the actual service roles',async()=>{
 const f=cooperativeFixture(),{run,action}=f;await f.start('firefighter','duo');
 run("activeCoopRecord().status='lobby';activeCoopRecord().participants.guest.ready=false");assert.equal(await action('startActiveCoopMission()'),false);
 run("activeCoopRecord().participants.guest.ready=true;activeCoopRecord().participants.guest.role='rescuer'");assert.equal(await action('startActiveCoopMission()'),false);
 run("activeCoopRecord().participants.guest.role='hose';activeCoopRecord().participants.third={uid:'third',ready:true,role:'rescuer'}");assert.equal(await action('startActiveCoopMission()'),false);
 run('delete activeCoopRecord().participants.third');assert.equal(await action('startActiveCoopMission()'),true);
});
test('OTThi: chapter milestones survive spending their materials and crystals',()=>{
 const source=readFileSync('games/otthi/src/modules/06-missions-profile-hud-inventory-tools.js','utf8'),start=source.indexOf('  function deriveMissionFlags()'),end=source.indexOf('  function evaluateMissions()',start);
 const state={flags:{},friendship:{nino:10,a:1,b:1},inventory:{wood:3,stone:2,crystals:5},builds:[{x:0,z:18},{},{},],defeated:3,profile:{reputation:50},career:{completed:1}};
 const derive=vm.runInNewContext(source.slice(start,end)+';deriveMissionFlags',{state});derive();state.inventory={wood:0,stone:0,crystals:0};state.builds=[];derive();
 for(const flag of ['hasMaterials','builtThree','fiveCrystals','decoratedHome'])assert.equal(state.flags[flag],true,flag);
});
test('OTThi: all chapter flags and eight career objectives have implementations',()=>{
 const dir='games/otthi/src/modules/',all=readdirSync(dir).filter(x=>x.endsWith('.js')).map(x=>readFileSync(dir+x,'utf8')).join('\n');
 const chapters=all.slice(all.indexOf('  const missionChapters = ['),all.indexOf('  let activeMission = null;'));
 const flags=[...chapters.matchAll(/\['([a-zA-Z0-9]+)',/g)].map(m=>m[1]);assert(flags.length>=29);
 for(const flag of flags)assert(all.includes("setFlag('"+flag+"')")||all.includes('state.flags.'+flag+' =')||all.includes('state.flags.'+flag+'=')||['wonRace','wonCoinRace'].includes(flag),'No producer for chapter '+flag);
 const careers=all.slice(all.indexOf('  const JOBS = ['),all.indexOf('  const MISSION_STATES='));assert.equal([...careers.matchAll(/\{id:'/g)].length,8);
});

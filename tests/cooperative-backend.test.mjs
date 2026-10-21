/* Real RTDB client functions against an isolated transactional in-memory API. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync('games/otthi/assets/js/multiplayer-rtdb.js','utf8');
const functions=source.slice(source.indexOf('const COOP_MISSION_TYPES='),source.indexOf('async function setRoom('));
test('OTThi RTDB: a third client cannot join a duo; readiness, difficulty, presence and progress agree on both clients',async()=>{
 let clock=100000,seq=0;const data={},clients=[];
 const clone=x=>x===undefined?null:structuredClone(x),snapshot=x=>({val:()=>clone(x)});
 const get=path=>path.split('/').reduce((v,k)=>v?.[k],data);
 const put=(path,value)=>{const keys=path.split('/'),last=keys.pop();let row=data;for(const k of keys)row=row[k]||(row[k]={});if(value===null)delete row[last];else row[last]=clone(value);};
 const sync=()=>{const missions=get('otthosWorld/rooms/bairro-central/coopMissions')||{};for(const c of clients){c.incoming=clone(missions);vm.runInContext('coopMissionCache=incoming',c);}};
 const api={ref:(_,path)=>path,push:parent=>({key:'mission-'+(++seq),path:parent+'/mission-'+seq}),serverTimestamp:()=>clock,
  async set(ref,value){put(ref.path||ref,value);sync();},async update(ref,patch){for(const [k,v]of Object.entries(patch))put(ref+'/'+k,v);sync();},async remove(ref){put(ref,null);sync();},
  onDisconnect:()=>({update:async()=>{}}),async runTransaction(ref,update){const next=update(clone(get(ref)));if(next===undefined)return{committed:false,snapshot:snapshot(get(ref))};put(ref,next);sync();return{committed:true,snapshot:snapshot(get(ref))};}};
 function client(uid){
  const c=vm.createContext({console,api,uid,Date:class extends Date{static now(){return clock}},window:{},incoming:{}});clients.push(c);
  vm.runInContext(`const ROOT='otthosWorld',WORLD='rooms/bairro-central',db={},user={uid};let connected=true,coopMissionCache={},presenceCache={host:{updatedAt:Date.now()},guest:{updatedAt:Date.now()}};const refs={coopMissions:ROOT+'/'+WORLD+'/coopMissions'};const communicationAllowed=()=>true,currentRoom=()=> 'bairro-central',neutralPublicName=id=>id,ownName=()=>uid,dispatch=()=>{},recordActivity=()=>{},listenerError=()=>()=>{},serverNow=()=>Date.now(),presenceIsFresh=(p={})=>Number(p.updatedAt)>Date.now()-35000;`,c);
  vm.runInContext(functions,c);return code=>vm.runInContext(code,c);
 }
 const host=client('host'),guest=client('guest'),third=client('third');
 const made=await host("createCoopMission('firefighter',{minPlayers:2,maxPlayers:2,role:'driver',mode:'coop',difficulty:'hard'})"),id=made.id;
 assert(made.ok);assert.equal((await guest(`joinCoopMission('${id}','hose')`)).ok,true);
 assert.equal((await third(`joinCoopMission('${id}','rescuer')`)).ok,false);
 assert.equal(guest(`getCoopMissions()['${id}'].difficulty`),'hard');
 assert.equal((await host(`setCoopMissionStatus('${id}','active')`)).ok,false,'Unready players must block atomic start');
 await host(`updateCoopParticipant('${id}',{ready:true})`);await guest(`updateCoopParticipant('${id}',{ready:true})`);
 assert.equal((await host(`setCoopMissionStatus('${id}','active')`)).ok,true);
 assert.equal(guest(`getCoopMissions()['${id}'].status`),'active');
 const event=`updateCoopMissionProgress('${id}',{eventId:'one-water-pulse',kind:'water-pulse',counterDelta:1,target:6,phase:3})`;
 assert.equal((await guest(event)).ok,true);await guest(event);
 assert.equal(host(`getCoopMissions()['${id}'].progress.counter`),1,'One confirmed event must count once on both clients');
 clock+=36000;
 assert.equal((await guest(`updateCoopMissionProgress('${id}',{eventId:'stale-pulse',kind:'water-pulse',counterDelta:1})`)).ok,false,'A missing partner must pause shared progress');
 assert.equal(host(`getCoopMissions()['${id}'].progress.counter`),1);
});

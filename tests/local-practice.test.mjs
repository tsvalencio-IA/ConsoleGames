import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('all original games ship the canonical solo persistence code',()=>{
 const source=readFileSync('enhancements/local-practice.js','utf8');
 for(const slug of ['kart','boxe','tenis','ar','voo'])assert.equal(readFileSync('games/'+slug+'/local-practice.js','utf8'),source,slug);
});

test('local solo ignores delayed cloud snapshots and never saves rewards to a real account',async()=>{
 for(const slug of ['ar','boxe','kart','tenis','voo']){
  let receive,cloudWrites=0,localSaves=0;
  const window={},noop=()=>{};
  const document={getElementById:()=>({style:{},classList:{add:noop,remove:noop},innerText:''}),createElement:()=>({innerHTML:''}),head:{appendChild:noop}};
  runInNewContext(readFileSync(`games/${slug}/js/core.js`,'utf8'),{window,document,console,setTimeout,clearTimeout,performance:{now:()=>0}});
  window.DB={ref:()=>({on:(_event,callback)=>{receive=callback;},update:()=>{cloudWrites++;}})};
  window.Profile.updateUI=noop;window.System.renderChannels=noop;
  const loading=window.Profile.loadFromFirebase('existing-real-account');
  window.ConsolePractice={active:true,save:()=>{localSaves++;}};
  window.Profile.username='Local';window.Profile.coins=7;
  receive({val:()=>({username:'Online',coins:900,xp:5,level:2,permissions:{}})});await loading;
  assert.equal(window.Profile.username,'Local',slug);assert.equal(window.Profile.coins,7,slug);
  window.Profile.addReward(100,true,0);
  assert.equal(cloudWrites,0,slug);assert.equal(localSaves,1,slug);
  window.ConsolePractice.active=false;
  receive({val:()=>({username:'Online',coins:900,xp:5,level:2,permissions:{}})});
  assert.equal(window.Profile.username,'Online',slug);assert.equal(window.Profile.coins,900,slug);
 }
});

test('solo retains the actual Kart garage and flight progression after reopening, without borrowing account progress',async()=>{
 for(const [id,field,owned]of [['drive','kartSave',{garage:[{modelId:0},{modelId:3}],activeKartIdx:1,upgrades:{engine:3,tires:2,suspension:1},useCustomKart:true}],['usarmy_flight_sim','flightSave',{upgrades:{engine:3,missiles:2,armor:1},airframe:'interceptor',kills:7,school:true}]]){
  const storage=new Map(),noop=()=>{},online={onlineOnly:true};
  const load=()=>{
   const element=()=>({style:{},classList:{add:noop,remove:noop,contains:()=>true},querySelector:element,setAttribute:noop,append:noop,appendChild:noop,remove:noop,before:noop});
   const window={CONSOLE_GAME_ID:id,addEventListener:noop,Profile:{username:'Online',permissions:{},coins:900,xp:1,level:2,[field]:online,updateUI:noop},System:{canvas:{},openPhases:noop,stopGame:noop,gameOver:noop},Games:[{id}],onload:async()=>{}};
   const document={readyState:'loading',createElement:element,querySelector:s=>s==='#solo-indicator'?null:element(),body:{append:noop}};
   runInNewContext(readFileSync('enhancements/local-practice.js','utf8'),{window,parent:window,document,location:{search:'',href:'https://test.example/games/kart/',origin:'https://test.example'},URL,URLSearchParams,crypto:{randomUUID:()=> '12345678-1234-1234-1234-123456789012'},navigator:{},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},console,setTimeout:noop,clearTimeout:noop,setInterval:noop,clearInterval:noop});
   return window;
  };
  const first=load();await first.ConsolePractice.enter();assert.notDeepEqual(first.Profile[field],online,'Local solo must not inherit a real account garage');
  first.Profile[field]=JSON.parse(JSON.stringify(owned));first.ConsolePractice.save();
  assert.deepEqual(JSON.parse(storage.get('thia:solo:v1:'+id))[field],owned,'Purchased vehicles/upgrades must be written to the solo record');
  first.ConsolePractice.account();assert.deepEqual(JSON.parse(JSON.stringify(first.Profile[field])),online,'Returning to the real account must restore its own progression');
  const reopened=load();await reopened.ConsolePractice.enter();assert.deepEqual(JSON.parse(JSON.stringify(reopened.Profile[field])),owned,'A new document must reload the same solo garage and upgrades');
 }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

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

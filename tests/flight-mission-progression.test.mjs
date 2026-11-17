import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function flightGame(){
  let game=null;
  const window={System:{registerGame(id,title,icon,logic){
    if(id==='usarmy_flight_sim')game=logic;
  }}};
  const sandbox=vm.createContext({window,console,setInterval:()=>{throw Error('Flight game did not register');},performance:{now:()=>1000}});
  vm.runInContext(fs.readFileSync('games/voo/js/game_flight.js','utf8'),sandbox,{filename:'game_flight.js'});
  assert(game,'native flight game should register');
  return {game,window};
}
function sessionGame(game,mode='SINGLE'){
  const g=Object.create(game);
  g.mode=mode;g.state='PLAYING';g.session={kills:31,wave:3,xp:0,cash:0};
  g.bossDefeated=false;
  g.ship={x:0,y:1000,z:0,yaw:0,pitch:0,roll:0};
  g.entities=[];g.net={isHost:false,sharedData:{teamKills:31,bossDefeated:false},sharedRef:null};
  g.result=null;g._endGame=function(result){this.result=result;this.state=result;};
  return g;
}
test('flight-school landing records completion and emits victory exactly once',()=>{
  const {game}=flightGame(),g=sessionGame(game,'FREE');
  g.flightSchool={stage:'landing',complete:false,gate:5};
  g.flightCareer={school:false,missions:{school:{completed:2}}};
  g.manualThrottle=.5;g.pilot={throttle:.5};g.saves=0;
  g._saveCareer=function(){this.saves++};
  assert.equal(g._completeFlightSchool(),true);
  assert.equal(g.flightSchool.stage,'complete');
  assert.equal(g.flightCareer.missions.school.completed,3);
  assert.equal(g.flightCareer.school,true);
  assert.equal(g.result,'VICTORY');
  assert.equal(g.saves,1);
  assert.equal(g._completeFlightSchool(),false);
  assert.equal(g.saves,1);
});
test('flight school cannot be marked completed before landing',()=>{
  const {game}=flightGame(),g=sessionGame(game,'FREE');
  g.flightSchool={stage:'gates',complete:false};g.flightCareer={school:false,missions:{}};
  g._saveCareer=()=>{throw Error('must not save early')};
  assert.equal(g._completeFlightSchool(),false);
  assert.equal(g.result,null);
});
test('solo campaign cannot win by killing 31 ordinary enemies before defeating the boss',()=>{
  const {game}=flightGame(),g=sessionGame(game);
  g._updateMissionSystem();
  assert.equal(g.result,null);
  assert.equal(g.session.xp,0);
  g.bossDefeated=true;g._updateMissionSystem();
  assert.equal(g.result,'VICTORY');
  assert.equal(g.session.xp,1000);
  g._updateMissionSystem();
  assert.equal(g.session.xp,1000);
});
test('co-op victory is driven by shared boss result, not a private local boss flag',()=>{
  const {game}=flightGame(),g=sessionGame(game,'COOP');
  g.net.sharedData={teamKills:35,bossDefeated:false};g._updateMissionSystem();
  assert.equal(g.result,null);
  g.net.sharedData.bossDefeated=true;g._updateMissionSystem();
  assert.equal(g.result,'VICTORY');
});
test('simultaneous co-op kills use RTDB transactions rather than overwriting a stale counter',()=>{
  const {game,window}=flightGame();
  let teamKills=0,updates=[],calls=0;
  const sharedRef={child(name){
    assert.equal(name,'teamKills');
    return {transaction(fn){calls++;teamKills=fn(teamKills);return Promise.resolve({committed:true});}};
  },update(obj){updates.push(obj);return Promise.resolve();}};
  function pilot(){
    const g=sessionGame(game,'COOP');
    g.net.sharedRef=sharedRef;g.net.sharedData={teamKills:0,bossDefeated:false};
    g.flightCareer={kills:0};g._saveCareer=()=>{};g._fx=()=>{};
    g.session.kills=0;return g;
  }
  const a=pilot(),b=pilot();
  window.Profile=null;window.DB=null;
  a._kill({x:0,y:0,z:0,isBoss:false,hp:0},50);
  b._kill({x:0,y:0,z:0,isBoss:true,hp:0},50);
  assert.equal(calls,2);
  assert.equal(teamKills,2);
  assert.equal(a.session.kills,1);
  assert.equal(b.session.kills,1);
  assert.equal(updates.some(x=>x.bossDefeated===true),true);
});

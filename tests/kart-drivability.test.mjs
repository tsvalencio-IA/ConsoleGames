import test from 'node:test';
import assert from 'node:assert/strict';
import {engine} from './helpers/game-fixture.mjs';
function race(track=0,char=0,bots=false){
 const {game:g}=engine('kart','game_kart');g.currentFase={id:'arcade',mode:'RACE',targetRank:3};g.setupUI();g.resetPhysics();g.selectedChar=char;g.startRace(track);
 if(!bots){g.localBots=[];g.rivals=[];}
 g.arcadeManual={throttle:true,brake:false,left:false,right:false,drift:false,rear:false};
 return g;
}
const step=(g,n)=>{for(let i=0;i<n;i++)g.updatePhysics(390,844,null)};
test('kart: a 100ms steering tap stops promptly when released, for all eight drivers',()=>{
 for(let char=0;char<8;char++)for(const side of ['left','right']){
  const g=race(0,char);g.speed=155;g.arcadeManual[side]=true;step(g,6);const held=g.playerX;
  g.arcadeManual[side]=false;step(g,90);
  assert(Math.abs(g.playerX-held)<.08,'Released steering drifts away: '+JSON.stringify({char,side,held,after:g.playerX}));
  assert(Math.abs(g.playerX)<.2,'A short tap cannot cross the road');
  assert.equal(g.lateralInertia,0);assert(g.playerX*(side==='left'?-1:1)>0);
 }
});
test('kart: ordinary repeated lane changes finish three full laps on all tracks without leaving the asphalt',()=>{
 for(let track=0;track<3;track++){
  const g=race(track);let ticks=0,maxOffset=0;
  while(g.status==='RACING'&&ticks<4000){
   const phase=ticks%240;
   g.arcadeManual.right=phase>=30&&phase<60;g.arcadeManual.left=phase>=150&&phase<180;
   step(g,1);ticks++;maxOffset=Math.max(maxOffset,Math.abs(g.playerX));
  }
  assert.equal(g.status,'FINISHED','Track '+track+' did not finish');assert.equal(g.player.finished,true);
  assert(maxOffset<.8,'Ordinary lane changes leave the track: '+JSON.stringify({track,maxOffset}));
 }
});
test('kart: a brush against one rival applies one bounded impact until they separate',()=>{
 const g=race();g.speed=155;g.playerX=.2;
 const r={id:'contact-test',lap:1,pos:0,x:0,charId:3,status:'RACING'};g.rivals=[r];
 for(let i=0;i<120;i++){r.pos=g.pos;r.lap=g.lap;step(g,1);}
 assert(Math.abs(g.playerX)<.4,'Persistent overlap must not push the player onto the grass');
 assert(Math.abs(g.lateralInertia)<.0001);
});
test('kart: grass can be escaped with the opposite direction, and braking cancels turbo',()=>{
 for(const side of [-1,1]){
  const g=race();g.playerX=side*1.75;g.speed=64;g.arcadeManual[side>0?'left':'right']=true;
  let ticks=0;while(Math.abs(g.playerX)>.25&&ticks++<240)step(g,1);
  assert(Math.abs(g.playerX)<.25,'Unable to steer back from grass');
  g.arcadeManual.left=false;g.arcadeManual.right=false;step(g,30);assert(Math.abs(g.playerX)<.35);
  g.turboLock=true;g.speed=200;g.arcadeManual.brake=true;step(g,20);assert(g.speed<25);assert(!g.turboLock);
 }
});
test('kart: opponents accelerate to racing speed instead of remaining near the starting grid',()=>{
 const g=race(0,0,true);step(g,180);
 assert(g.localBots.every(r=>r.speed>85),'Opponents never reach racing speed: '+JSON.stringify(g.localBots.map(r=>r.speed)));
 assert(g.localBots.every(r=>r.speed<250),'Standard opponents exceed the balanced speed range');
});

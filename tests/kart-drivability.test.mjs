import test from 'node:test';
import assert from 'node:assert/strict';
import {engine} from './helpers/game-fixture.mjs';
function race(track=0,char=0,bots=false,settings={}){
 const {game:g}=engine('kart','game_kart',settings);g.currentFase={id:'arcade',mode:'RACE',targetRank:3};g.setupUI();g.resetPhysics();g.selectedChar=char;g.startRace(track);
 if(!bots){g.localBots=[];g.rivals=[];}
 g.arcadeManual={throttle:true,brake:false,left:false,right:false,drift:false,rear:false};
 return g;
}
const step=(g,n)=>{for(let i=0;i<n;i++)g.updatePhysics(390,844,null)};
test('kart: a 100ms steering tap stops promptly when released, for all eight drivers',()=>{
 for(let char=0;char<8;char++)for(const side of ['left','right']){
  const g=race(1,char);g.speed=155;g.arcadeManual[side]=true;step(g,6);const held=g.playerX;
  g.arcadeManual[side]=false;step(g,40);
  assert(Math.abs(g.playerX-held)<.08,'Released steering drifts away: '+JSON.stringify({char,side,held,after:g.playerX}));
  assert(Math.abs(g.playerX)<.2,'A short tap cannot cross the road');
  assert.equal(g.lateralInertia,0);assert(g.playerX*(side==='left'?-1:1)>0);
 }
});
test('kart: curves require steering; help levels reduce drift without locking the centre',()=>{
 const peaks=[];
 for(const steeringAssist of ['off','light','medium','high']){
  const g=race(0,0,false,{steeringAssist});let max=0;
  step(g,65);
  for(let i=0;i<55;i++){step(g,1);max=Math.max(max,Math.abs(g.playerX));}
  peaks.push(max);
  assert(g.playerX<-.045,'A right bend must carry a neutral kart toward the outside, not hold its centre');
  g.arcadeManual.right=true;const before=g.playerX;step(g,25);
  assert(g.playerX>before+.15,'Help cannot lock the kart against manual steering');
 }
 assert(peaks[0]>.2,'Without help a curve must need active steering');
 assert(peaks.every((n,i)=>!i||n<peaks[i-1]-.04),'Help levels need different physical effects: '+peaks);
});
test('kart: active steering completes all three tracks for all eight drivers, with help off',()=>{
 for(let track=0;track<3;track++)for(let char=0;char<8;char++){
  const g=race(track,char,false,{steeringAssist:'off'});let ticks=0,maxOffset=0,turns=0;
  while(g.status==='RACING'&&ticks<5000){
   const target=.25*Math.sin(ticks/110);
   g.arcadeManual.right=g.playerX<target-.035;g.arcadeManual.left=g.playerX>target+.035;
   if(g.arcadeManual.left||g.arcadeManual.right)turns++;
   step(g,1);ticks++;maxOffset=Math.max(maxOffset,Math.abs(g.playerX));
  }
  assert.equal(g.status,'FINISHED','Track/driver '+[track,char]+' did not finish');assert.equal(g.player.finished,true);
  assert(turns>100,'A complete race must require real turns');
  assert(maxOffset<.8,'Following curves leaves asphalt: '+JSON.stringify({track,char,maxOffset}));
 }
});
test('kart: turbo alone never drives without a camera pilot; tracking loss cancels boost',()=>{
 const f=engine('kart','game_kart',{steeringAssist:'high',autoAccelerate:true}),g=f.game;
 g.currentFase={id:'arcade',mode:'RACE',targetRank:3};g.setupUI();g.resetPhysics();g.startRace(0);g.localBots=[];g.rivals=[];
 f.window.ArcadeControls.mode='camera';
 assert.equal(g.requestTurbo(),false);step(g,240);assert.equal(g.pos,0);assert.equal(g.speed,0);assert.equal(g.nitro,100);assert(g.trackingLost);
 const pose={keypoints:[{name:'left_wrist',score:.9,x:450,y:300},{name:'right_wrist',score:.9,x:190,y:300}]};
 for(let i=0;i<120;i++)g.updatePhysics(390,844,pose);
 assert(g.speed>120);assert.equal(g.requestTurbo(),true);g.updatePhysics(390,844,pose);assert(g.turboLock);
 const speed=g.speed;step(g,1);assert(!g.turboLock);assert(g.trackingLost);assert(g.speed<speed);
 step(g,180);assert(g.speed<1,'Lost camera input must coast to a stop');
});
test('kart: a brush against one rival applies one bounded impact until they separate',()=>{
 const g=race(1);g.speed=155;g.playerX=.2;g.arcadeManual.throttle=false;
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

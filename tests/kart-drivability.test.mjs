import test from 'node:test';
import assert from 'node:assert/strict';
import {engine,canvas} from './helpers/game-fixture.mjs';
function race(track=0,char=0,bots=false,settings={}){
 const {game:g}=engine('kart','game_kart',settings);g.currentFase={id:'arcade',mode:'RACE',targetRank:3};g.setupUI();g.resetPhysics();g.selectedChar=char;g.startRace(track);
 if(!bots){g.localBots=[];g.rivals=[];}
 g.arcadeManual={throttle:true,brake:false,left:false,right:false,drift:false,rear:false};
 return g;
}
const step=(g,n)=>{for(let i=0;i<n;i++)g.updatePhysics(390,844,null)};
test('kart: starting another offline race clears prior steering and drift without changing the selected driver',()=>{
 const g=race(0,2,false);g.playerX=.8;g.steer=1;g.lateralInertia=.07;g.speed=80;g.pos=1500;g.startRace(0);assert.equal(g.playerX,0);assert.equal(g.steer,0);assert.equal(g.lateralInertia,0);assert.equal(g.speed,0);assert.equal(g.selectedChar,2);
});
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
test('kart: the racing HUD draws the wheel at the detected wrists, including after the hands move',()=>{
 const f=engine('kart','game_kart'),g=f.game;
 g.currentFase={id:'arcade',mode:'RACE',targetRank:3};g.setupUI();g.resetPhysics();g.startRace(0);f.window.ArcadeControls.mode='camera';
 for(const points of [[450,300,190,300],[400,340,140,260]]){
  const pose={keypoints:[{name:'left_wrist',score:.9,x:points[0],y:points[1]},{name:'right_wrist',score:.9,x:points[2],y:points[3]}]};
  g.updatePhysics(390,844,pose);const ctx=canvas();g.renderUI(ctx,390,844);
  assert(g.inputActive);assert.equal(g.virtualWheel.opacity,1);
  assert(ctx.operations.some(([op,x,y])=>op==='translate'&&x===g.virtualWheel.x&&y===g.virtualWheel.y),'The visible race must draw the wheel at the detected hand midpoint');
  assert(ctx.operations.some(([op,x,y,r])=>op==='arc'&&x===0&&y===0&&r===g.virtualWheel.r),'The wheel must be drawn, not merely computed by physics');
 }
});
test('kart: a brush against one rival applies one bounded impact until they separate',()=>{
 const g=race(1);g.speed=155;g.playerX=.2;g.arcadeManual.throttle=false;
 const r={id:'contact-test',lap:1,pos:0,x:0,charId:3,status:'RACING'};g.rivals=[r];
 for(let i=0;i<120;i++){r.pos=g.pos;r.lap=g.lap;step(g,1);}
 assert(Math.abs(g.playerX)<.4,'Persistent overlap must not push the player onto the grass');
 assert(Math.abs(g.lateralInertia)<.0001);
});
test('kart: passing a visibly separate rival never causes a phantom collision',()=>{
 for(const side of [-1,1]){
  const g=race(1);g.speed=155;g.rivals=[{id:'other-lane',lap:1,pos:0,x:side*.5,charId:3,status:'RACING'}];
  const reference=race(1);reference.speed=155;
  step(g,1);step(reference,1);
  assert.equal(g.collisionContacts.size,0,'Separate lanes cannot collide');
  assert.equal(g.speed,reference.speed,'Passing in another lane must not brake the kart');
  assert.equal(g.lateralInertia,reference.lateralInertia,'Passing in another lane must not push the kart');
 }
});
test('kart: released steering remains stable across varied starting grids',()=>{
 for(const initialSeed of [193,405,430,478,557,561,805,844,936,964,978,1537])for(let char=0;char<8;char++)for(const side of ['left','right']){
  let seed=initialSeed;
  const {game:g}=engine('kart','game_kart',{}, {random:()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}});
  g.currentFase={id:'f1',mode:'RACE',targetRank:3};g.setupUI();g.selectedChar=char;g.startRace(1);
  g.arcadeManual={throttle:true,left:side==='left',right:side==='right'};
  step(g,6);const released=g.playerX;g.arcadeManual[side]=false;step(g,40);
  assert(Math.abs(g.playerX-released)<.14,'Starting traffic pushes a released kart across the lane: '+JSON.stringify({initialSeed,char,side,released,final:g.playerX}));
  assert.equal(g.targetSteer,0,'Released input must reach the native physics');
 }
});
test('kart: grazing one rival cannot replay an impact until the bodies separate',()=>{
 const g=race(1),r={id:'grazing',lap:1,pos:0,x:0,charId:0,status:'RACING'};g.rivals=[r];
 const frame=gap=>{g.playerX=0;g.steer=0;g.lateralInertia=0;g.speed=155;r.pos=g.pos;r.x=gap;step(g,1);return g.lateralInertia;};
 assert(frame(.26)<-.01,'An actual touch must still have an impact');
 for(const gap of [.29,.27,.30,.26])assert.equal(frame(gap),0,'Small separation jitter must not replay the same impact');
 assert.equal(frame(.36),0);assert.equal(g.collisionContacts.size,0);
 assert(frame(.26)<-.01,'A new touch after a clear separation must have an impact');
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

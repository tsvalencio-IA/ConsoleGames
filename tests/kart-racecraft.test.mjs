import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import{engine,canvas}from'./helpers/game-fixture.mjs';
const current=fs.readFileSync('games/kart/js/game_kart.js','utf8');
const renderStart=current.indexOf('        renderWorld: function(ctx, w, h) {'),renderEnd=current.indexOf('\n        drawKartSprite:',renderStart);
assert(renderStart>=0&&renderEnd>renderStart);
const baseline=current.slice(0,renderStart)+fs.readFileSync('tests/fixtures/kart-render-world-before.txt','utf8')+current.slice(renderEnd);
function trial(enabled=true){
 const f=engine('kart','game_kart',{steeringAssist:'light'});f.window.location={search:enabled?'?kart_eval=disputa':''};f.window.ConsolePractice={active:true};f.window.Gfx={shakeScreen(){}};f.window.Sfx.error=()=>{};
 const result=[],node=()=>({append(...children){result.push(...children)},setAttribute(){},remove(){}}),document={readyState:'loading',addEventListener(){},getElementById:()=>null,createElement:node,querySelector:()=>node()};
 vm.runInNewContext(fs.readFileSync('games/kart/racecraft-evaluation.js','utf8'),{window:f.window,document});
 const g=f.game;g.currentFase={id:'f1',mode:'RACE',targetRank:3,diff:'EASY'};g.setupUI();g.startRace(0);g.arcadeManual={throttle:true};return{...f,g,result,api:f.window.KartRacecraftEvaluation};
}
test('racecraft is opt-in, and never replaces the multiplayer grid or approved controls',()=>{
 const f=trial(false);assert.equal(f.g.racecraftTrial,null);assert(f.g.localBots.every(r=>r.pos===0));
 f.api.enabled=true;f.g.isOnline=true;f.api.start(f.g,100000);assert.equal(f.g.racecraftTrial,null);assert(f.g.localBots.every(r=>r.pos===0));
 const f2=trial();f2.window.ConsolePractice.active=false;f2.g.startRace(0);assert(f2.g.localBots.every(r=>r.pos===0));assert.equal(f2.g.racecraftTrial,null,'signed account rewards are outside the evaluation');
 const f3=trial();f3.g.currentFase.mode='COIN_HUNT';f3.g.startRace(0);assert(f3.g.localBots.every(r=>r.pos===0));assert.equal(f3.g.racecraftTrial,null,'coin collection phases keep their original objective');
});
test('clean passes require a real ahead-to-behind crossing; contact, offroad, starting ties and vanished rivals do not score',()=>{
 const {g,api}=trial();g.rivals=[];g.raceElapsed=3;g.lap=1;g.pos=5000;
 const rival={id:'rival',name:'Rival',lap:1,pos:5500,status:'RACING'};g.rivals=[rival];
 api.tick(g,100000);rival.pos=4500;api.tick(g,100000);assert.equal(g.racecraftTrial.passes,1);
 rival.pos=5500;api.tick(g,100000);rival.pos=4500;api.tick(g,100000);assert.equal(g.racecraftTrial.passes,1,'the same rival cannot be farmed twice in one lap');
 for(const kind of['contact','offroad','tie','vanish','finished']){
  api.start(g,100000);g.rivals=[rival];rival.pos=5500;rival.status='RACING';g.playerX=0;g.collisionContacts=new Set();g.raceElapsed=3;
  if(kind==='tie')g.raceElapsed=.5;api.tick(g,100000);
  if(kind==='contact')g.collisionContacts.add('rival');if(kind==='offroad')g.playerX=1.5;if(kind==='vanish')g.rivals=[];if(kind==='finished')rival.status='FINISHED';rival.pos=4500;api.tick(g,100000);
  assert.equal(g.racecraftTrial.passes,0,kind);
 }
});
test('a complete native three-lap chase race can finish its two-clean-pass and drift objectives without position, lap or reward writes',()=>{
 const {g,window,result}=trial();const before=JSON.stringify(window.Profile);let ticks=0,maxOffset=0,side=1;
 for(;ticks<20000&&g.status==='RACING';ticks++){
  const drifting=ticks>=600&&ticks<680;
  if(drifting){if(g.playerX>.5)side=-1;if(g.playerX<-.5)side=1;g.arcadeManual.left=side<0;g.arcadeManual.right=side>0;}else{const target=.22*Math.sin(ticks/110);g.arcadeManual.left=g.playerX>target+.035;g.arcadeManual.right=g.playerX<target-.035;}
  g.arcadeManual.drift=drifting;if(g.item)g.arcadeManual.itemQueued=true;g.updatePhysics(844,390,null);maxOffset=Math.max(maxOffset,Math.abs(g.playerX));
 }
 g.checkRaceStatus();assert.equal(g.status,'FINISHED');assert.equal(g.player.finished,true);assert.equal(g.lapTimes.length,3);assert(g.racecraftTrial.passes>=2);assert(g.racecraftTrial.drifts>=1);assert(g.racecraftTrial.completed);assert.equal(g.racecraftTrial.lastLap.number,3);assert.equal(g.racecraftTrial.lastLap.seconds,g.lapTimes.at(-1));assert.equal(g.racecraftTrial.lastLap.delta,g.lapTimes.at(-1)-Math.min(...g.lapTimes.slice(0,-1)));assert(g.racecraftTrial.items>0);assert.equal(g.racecraftTrial.contacts,0);assert(maxOffset<1.3);assert(ticks>5000);assert(result.length>0);assert.equal(JSON.stringify(window.Profile),before,'trial goals cannot write rewards or account state');
});
test('native rival projection keeps the exact drawing command order while evaluating each live rival once',()=>{
 for(const quality of['low','high'])for(const rear of[false,true])for(let track=0;track<3;track++){
  const recordings=[],reads=[];
  for(const source of[baseline,current]){
   const f=engine('kart','game_kart',{quality},{source:source.replaceAll('Date.now()', '1794508800000')}),g=f.game;g.currentFase={id:'f1',mode:'RACE',targetRank:3};g.setupUI();g.startRace(track);g.pos=27000;g.cameraX=.13;g.playerX=.25;g.arcadeManual={rear};g.rivals=[];let count=0;
   for(let i=0;i<24;i++){const r={id:'read-'+i,charId:i%8,kartId:i%7,name:'Piloto '+i,x:(i%3-1)*.6,spinAngle:0,status:'RACING'};Object.defineProperties(r,{lap:{get(){count++;return i===23?2:1}},pos:{get(){count++;return 27000+(rear?-1:1)*(i*500-600)}}});g.rivals.push(r);}
   const ctx=canvas();g.renderWorld(ctx,844,390);recordings.push(JSON.stringify(ctx.operations));reads.push(count);
  }
  assert.equal(recordings[1],recordings[0],[quality,rear,track].join(':'));assert.equal(reads[1],48);assert.equal(reads[0],48*(quality==='low'?180:300));
 }
});

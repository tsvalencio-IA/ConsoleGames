import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code=fs.readFileSync('arcade/player-motion-lock.js','utf8');
function motion(){const window={};vm.runInNewContext(code,{window,performance:{now:()=>1500},console});return window.ConsolePlayerMotionLock;}
function pose(id,x=260,y=160){
 const keypoints=Array.from({length:17},()=>({x,y,score:.94,name:'unused'}));
 for(const [i,name,dx,dy] of [[5,'left_shoulder',-50,0],[6,'right_shoulder',50,0],[9,'left_wrist',-65,90],[10,'right_wrist',65,90]]){
  keypoints[i]={x:x+dx,y:y+dy,score:.98,name};
 }
 return {id,keypoints};
}
function hand(x,y,open){
 const keypoints=Array.from({length:21},()=>({x,y}));
 keypoints[0]={x,y};
 for(const [m,p,t] of [[5,6,8],[9,10,12],[13,14,16],[17,18,20]]){
  keypoints[m]={x:x+m,y};
  keypoints[p]={x:x+m,y:y-10};
  keypoints[t]={x:x+m,y:y-(open?25:8)};
 }
 return {keypoints};
}
test('locks one registered player and never switches to a passerby',()=>{
 const {PlayerLock}=motion(),lock=new PlayerLock(),pilot=pose(31),bystander=pose(44,360);
 assert.equal(lock.observe([pilot],0),null,'registration is not instant');
 assert.equal(lock.observe([pilot],650),null);
 assert.equal(lock.observe([pilot],1200)?.id,31);
 assert.equal(lock.status,'locked');
 assert.equal(lock.observe([bystander,pilot],1350)?.id,31,'a second person cannot seize the player lock');
 assert.equal(lock.observe([bystander],1500),null,'other person cannot impersonate registered player');
 assert.equal(lock.snapshot(1500).status,'lost');
 assert.equal(lock.observe([pilot,bystander],1700)?.id,31,'same tracked player can recover');
});
test('no enrollment if two players compete for the initial camera',()=>{
 const {PlayerLock}=motion(),lock=new PlayerLock();
 lock.observe([pose(10),pose(11,390)],0);lock.observe([pose(10),pose(11,390)],2500);
 assert.equal(lock.status,'selecting');
 assert.equal(lock.id,null);
});
test('classifier distinguishes four extended fingers from closed fist and returns unknown on insufficient points',()=>{
 const {classifyHand}=motion();
 assert.equal(classifyHand(hand(150,230,true)),'open');
 assert.equal(classifyHand(hand(150,230,false)),'closed');
 assert.equal(classifyHand({keypoints:[{x:0,y:0}]}),'unknown');
});
test('associates both detected hands to the locked body wrists, not provider handedness',()=>{
 const {associateHands}=motion();
 const result=associateHands(pose(5),[hand(325,250,true),hand(195,250,false)]);
 assert.equal(result.left.state,'closed');
 assert.equal(result.right.state,'open');
 const stranger=associateHands(pose(5),[hand(525,250,true),hand(555,250,true)]);
 assert.equal(stranger.left,null);
 assert.equal(stranger.right,null);
});
test('gesture-state debouncing ignores a one-frame glitch',()=>{
 const {PlayerLock}=motion(),lock=new PlayerLock(),pilot=pose(5);
 lock.observe([pilot],0);lock.observe([pilot],1200);
 lock.hands([hand(195,250,false),hand(325,250,false)],1300);
 assert.equal(lock.snapshot(1300).hands.left,'unknown','first frame not yet stable');
 lock.hands([hand(195,250,false),hand(325,250,false)],1450);
 assert.equal(lock.snapshot(1450).hands.left,'closed');
 lock.hands([hand(195,250,true),hand(325,250,false)],1560);
 assert.equal(lock.snapshot(1560).hands.left,'closed','one accidental open frame cannot trigger');
 lock.hands([hand(195,250,true),hand(325,250,false)],1710);
 assert.equal(lock.snapshot(1710).hands.left,'open');
});
test('flight actions obey left/right priority while independent wrists still steer',()=>{
 let logic,photos=0;
 const window={
  System:{registerGame(id,title,icon,game){if(id==='usarmy_flight_sim')logic=game;},video:{videoWidth:640,videoHeight:480}},
  ArcadeControls:{mode:'camera'},
  ArcadePlaySettings:{get:()=>({sensitivity:1})},
  FlightOperations:{capturePhoto(){photos++;return {ok:true};}}
 };
 vm.runInNewContext(fs.readFileSync('games/voo/js/game_flight.js','utf8'),{window,performance:{now:()=>1600},console,setInterval(){throw Error('unexpected registration timer')}});
 const g=Object.create(logic),p=pose(31);
 g.keys={};g.manualThrottle=.6;g.state='PLAYING';g.airframe='falcon';g.ship={inputs:{},afterburner:false};
 g.pilot={targetRoll:0,targetPitch:0,throttle:.6,handNeutral:{x:.5,y:.52,bank:0},handMode:'unknown'};
 g.flightOperation={kind:'reporter'};g.isHelicopter=()=>false;
 const read=(left,right)=>{const body={...p,consoleMotion:{status:'locked',hands:{left,right}}};g._readPose(body,640,480,.016);return {roll:g.pilot.targetRoll,pitch:g.pilot.targetPitch};};
 const first=read('closed','closed');
 g.pilot.targetRoll=0;g.pilot.targetPitch=0;
 const second=read('closed','open');
 assert.equal(first.roll,second.roll,'right open hand must not interrupt bank controls');
 assert.equal(first.pitch,second.pitch,'right open hand must not interrupt climb controls');
 assert.equal(photos,1);
 read('closed','open');assert.equal(photos,1,'photo fires once per opening');
 read('unknown','unknown');read('closed','open');
 assert.equal(photos,1,'brief classification loss must not repeat the same photograph');
 read('closed','closed');read('closed','open');
 assert.equal(photos,2,'closing and reopening the right hand re-arms the shutter');
 read('open','closed');assert.equal(g.pilot.missileHeld,true,'left-open hand fires missile');
 const before=g.manualThrottle;
 read('open','open');assert.equal(g.pilot.missileHeld,false,'both open means brake, not missile');
 assert(g.manualThrottle<before,'both open hands lower throttle');
 const slow=g.manualThrottle;read('closed','closed');
 assert(g.manualThrottle>slow,'both fists increase throttle');
 const lost=()=>({status:'lost',hands:{left:'unknown',right:'unknown'}});
 window.System.playerLock={snapshot:lost};
 g._readPose(null,640,480,.016);
 assert.equal(g.pilot.active,false);
 assert.equal(g.pilot.missileHeld,false);
});
test('shared lock is wired into flight, kart, tennis and boxing, without changing WAR worker',()=>{
 for(const game of ['voo','kart','tenis','boxe']){
  const index=fs.readFileSync('games/'+game+'/index.html','utf8');
  const core=fs.readFileSync('games/'+game+'/js/core.js','utf8');
  assert.match(index,/arcade\/player-motion-lock\.js/);
  assert.match(core,/MULTIPOSE_LIGHTNING/);
  assert.match(core,/playerLock\.observe\(people/);
  const sw=fs.readFileSync('games/'+game+'/sw.js','utf8');
  assert.match(sw,/player-motion-lock\.js/);
 }
});

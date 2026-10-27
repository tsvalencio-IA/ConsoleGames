import{test}from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import vm from'node:vm';
const sandbox={};vm.createContext(sandbox);vm.runInContext(readFileSync('games/otthi/assets/js/world/civil-mission-core.js','utf8'),sandbox);const{CivilMissionBook,definitions,difficulties,quota,mergeProgress}=sandbox.OTCivilMissionCore;
function act(book,id,uid,subject,at){const phase=book.data.records[id].phase;assert(book.begin(id,uid,phase,subject,at));assert.equal(book.finish(id,uid,phase,subject,at+10),false);assert(book.finish(id,uid,phase,subject,at+difficulties[book.data.records[id].difficulty].holdMs));}
test('civil world: seven civilian stories complete in solo and co-op at every difficulty, with each player doing their work',()=>{
 for(const[type,def]of Object.entries(definitions))for(const difficulty of Object.keys(difficulties))for(const mode of['solo','coop']){
  const book=new CivilMissionBook(),id='run-'+type+'-'+difficulty+'-'+mode;assert(book.create(id,type,'player-a',mode,difficulty,0));const members=mode==='coop'?['player-a','player-b']:['player-a'];
  if(mode==='coop'){assert.equal(book.start(id,'player-a'),false);assert(book.join(id,'player-b'));assert.equal(book.join(id,'player-c'),false);for(const uid of members)book.ready(id,uid,true);assert(book.start(id,'player-a'));}
  let at=10000;for(let phase=0;phase<def.steps.length;phase++){
   const step=def.steps[phase],count=quota(step,difficulty);for(const[index,uid]of members.entries()){
    if(step.requiresRide){assert.equal(book.begin(id,uid,phase,step.targets[0],at),false);assert(book.ride(id,uid,step.requiresRide,at));}
    for(let n=0;n<count;n++){const subject=step.targets[n+(step.sharedSubjects?index*count:0)];act(book,id,uid,subject,at);at+=5000;}
    if(index===0&&mode==='coop')assert.equal(book.data.records[id].phase,phase,'one player cannot advance a shared stage alone');
   }
  }assert.equal(book.data.records[id].status,'completed');assert.equal(book.data.records[id].phase,def.steps.length);
 }
});
test('civil world: wrong stage, duplicate objects, readiness bypasses and early acknowledgements never advance objectives',()=>{
 const b=new CivilMissionBook();b.create('test','beach','a','coop','easy',1);b.join('test','b');assert.equal(b.start('test','b'),false);b.ready('test','a',true);assert.equal(b.start('test','a'),false);b.ready('test','b',true);b.start('test','a');assert.equal(b.begin('test','a',1,'beach-litter-0',1000),false);act(b,'test','a','beach-desk',1000);assert.equal(b.begin('test','a',0,'beach-desk',6000),false);act(b,'test','b','beach-desk',6000);act(b,'test','a','beach-litter-0',11000);assert.equal(b.begin('test','b',1,'beach-litter-0',16000),false);assert.equal(b.data.records.test.phase,1);
});
test('civil world: reload preserves actual pending work and completed objective tokens',()=>{
 const b=new CivilMissionBook();b.create('reload','neighbors','a','solo','normal',1);act(b,'reload','a','aurora-market',1000);b.begin('reload','a',1,'neighbor-home-0',5000);const restored=new CivilMissionBook(b.snapshot());assert.equal(restored.finish('reload','a',1,'neighbor-home-0',5100),false);assert(restored.finish('reload','a',1,'neighbor-home-0',7000));assert.equal(restored.begin('reload','a',1,'neighbor-home-0',9000),false);assert.equal(restored.data.records.reload.counts['1:a'],1);
});
test('civil world: cloud merge retains disjoint actions and receipts without counting one object twice',()=>{
 const b=new CivilMissionBook();b.create('merge','neighbors','a','solo','normal',1);act(b,'merge','a','aurora-market',1000);const a=new CivilMissionBook(b.snapshot()),c=new CivilMissionBook(b.snapshot());act(a,'merge','a','neighbor-home-0',6000);act(c,'merge','a','neighbor-home-1',6000);
 const merged=mergeProgress({mode:'solo',solo:a.snapshot(),rewardReceipts:{old:1}},{mode:'solo',solo:c.snapshot(),rewardReceipts:{new:2}});assert.equal(merged.solo.records.merge.phase,2);assert.equal(merged.solo.records.merge.counts['1:a'],2);assert.equal(Object.keys(merged.rewardReceipts).length,2);const twice=mergeProgress(merged,merged);assert.equal(twice.solo.records.merge.counts['1:a'],2);
});

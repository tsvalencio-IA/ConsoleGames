import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
const c=vm.createContext({});vm.runInContext(fs.readFileSync('games/otthi/src/modules/44-world-rhythm.js','utf8')+'\nglobalThis.Chart=WorldRhythm;',c);
test('dance: all three charts can be completed, chords resolve separately and held/repeated hits never score the same note twice',()=>{
 for(let level=0;level<3;level++){const g=new c.Chart(level);for(const n of g.notes){assert.equal(g.hit(n.lane,n.at),'PERFEITO');const hits=g.hits;g.hit(n.lane,n.at);assert.equal(g.hits,hits);}g.update(g.end);assert(g.done);assert.equal(g.hits,g.notes.length);assert.equal(g.misses,0);assert(g.snapshot().accuracy>.6);}
});
test('dance: unattended play misses every note and spamming every lane cannot unlock a song',()=>{
 const idle=new c.Chart(0);idle.update(idle.end);assert.equal(idle.hits,0);assert.equal(idle.misses,idle.notes.length);assert.equal(idle.snapshot().accuracy,0);
 const spam=new c.Chart(0);for(let t=0;t<spam.end;t+=.04)for(let lane=0;lane<4;lane++)spam.hit(lane,t);assert(spam.strays>500);assert.equal(spam.snapshot().accuracy,0);
});
test('dance: early, late and wrong-lane touches do not consume a future note; actual timing determines accuracy',()=>{
 const g=new c.Chart(0),first=g.notes[0];assert.equal(g.hit(first.lane,-1),null);assert.equal(g.hit((first.lane+1)%4,first.at),'FORA DO TEMPO');assert.equal(first.state,'pending');assert.equal(g.hit(first.lane,first.at+.13),'CERTO');assert.equal(first.state,'hit');assert.equal(g.hits,1);g.update(g.end);assert.equal(g.misses,g.notes.length-1);
});

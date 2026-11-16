import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const world=readFileSync(new URL('../games/otthi/src/modules/29-game-loop-controls-gamepad.js',import.meta.url),'utf8');
const lights=readFileSync(new URL('../games/otthi/src/modules/71-world-light-budget.js',import.meta.url),'utf8');
test('retain all 12 camera warmup views',()=>{assert.match(world,/\[-\.55,\.28,1\.35\]/);assert.match(world,/\[0,Math\.PI\/2,Math\.PI,Math\.PI\*1\.5\]/);});
test('batch GPU synchronization with final full drain',()=>{assert.match(world,/\(index\+1\)%4===0\|\|index===views\.length-1/);});
test('retain every point-light shader variant',()=>{assert.match(lights,/count<=Math\.max\(16,Math\.ceil\(population\/8\)\*8\)/);assert.match(world,/critical\.entries\(\)/);});
test('preserve preparation of each vehicle',()=>{assert.match(world,/if\(prepared%4===0\)/);assert.match(world,/fleet\.prepare\(THREE,key\)/);});

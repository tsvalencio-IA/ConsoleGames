import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';
const world=fs.readFileSync('games/otthi/src/modules/29-game-loop-controls-gamepad.js','utf8');
test('o mundo ainda define todas as 12 vistas de câmera como opção integral',()=>{
 assert.match(world,/for\(const pitch of\[-\.55,\.28,1\.35\]\)/);
 assert.match(world,/for\(const yaw of\[0,Math\.PI\/2,Math\.PI,Math\.PI\*1\.5\]\)/);
 assert.match(world,/get\('cameraFull'\)==='1'/);
});
test('a interrupção adaptativa não ocorre antes de sete renderizações sem uploads novos',()=>{
 assert.match(world,/!fullWarmup&&index>=6&&quietViews>=3/);
 assert.match(world,/added\.programs===0&&added\.geometries===0&&added\.textures===0/);
 assert.match(world,/gl\.finish\(\);skippedViews=views\.length-index-1/);
});
test('a instrumentação informa quantas vistas foram preparadas e descartadas',()=>{
 assert.match(world,/event:'camera-views',preparedViews:views\.length-skippedViews,skippedViews,fullWarmup/);
 assert.match(world,/return\{views:views\.length,preparedViews:views\.length-skippedViews,skippedViews/);
});

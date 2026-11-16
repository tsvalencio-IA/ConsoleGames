import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8');
const pages=['arcade/index.html','games/otthi/index.html','games/kart/index.html','games/tenis/index.html','games/boxe/index.html','games/ar/index.html','games/voo/index.html','games/danca/index.html','games/familia/3d/index.html'];
test('ID original do console é preservado nas instalações Pages e Vercel',()=>{
 const m=JSON.parse(read('arcade/manifest.webmanifest'));
 assert.equal(m.id,'/ConsoleGames/arcade/');
 const program="import runpy,json; m=runpy.run_path('tools/package-world-preview.py'); print(json.dumps(m['root_site_manifest'](json.load(open('arcade/manifest.webmanifest')))))";
 const packaged=JSON.parse(execFileSync('python3',['-c',program],{encoding:'utf8'}));
 assert.equal(packaged.id,'/ConsoleGames/arcade/');
 assert.equal(new URL(packaged.start_url,'https://test.example').pathname,'/arcade/');
 assert.equal(packaged.scope,'/');
 assert.match(m.name,/8 jogos/);
});
test('Os oito jogos anunciam exatamente o mesmo manifesto que o console',()=>{
 for(const p of pages){
  const s=read(p);
  assert.equal((s.match(/rel="manifest"/g)||[]).length,1,p);
  assert.match(s, /href="(?:\.\/|\.\.\/)+arcade\/manifest\.webmanifest"|href="\.\/manifest\.webmanifest"/,p);
  assert.match(s,/data-console-canonical="1"/,p);
 }
});
test('Link antigo volta ao único console na origem atual',()=>{
 const s=read('arcade/canonical-navigation.js');
 assert.match(s,/new URL\('arcade\/',root\)/);
 assert.match(s,/new MutationObserver/);
 assert.match(s,/u\.origin!==location\.origin/);
});
test('Atualização preserva armazenamento e não prende o usuário 150s',()=>{
 const s=read('games/atualizar/update.js');
 assert.match(s,/Date\.now\(\)\+25000/);
 assert.match(s,/back\.hidden=false/);
 assert(!/localStorage\.clear|indexedDB\.deleteDatabase|caches\.delete/.test(s));
});
test('Kart preserva turbo e o minimapa fica legível no celular',()=>{
 const s=read('games/kart/js/game_kart.js');
 assert.match(s,/this\.rearGestureFrames>=8/);
 assert.match(s,/d\.gestureTimer > 25/);
 assert.match(s,/Math\.min\(112,Math\.max\(94,w\*\.24\)\)/);
});
test('Vercel redireciona console legado e mantém /arcade/',()=>{
 const v=JSON.parse(read('vercel.json'));
 assert(v.redirects.some(r=>r.source==='/console.html'&&r.destination==='/arcade/'));
});

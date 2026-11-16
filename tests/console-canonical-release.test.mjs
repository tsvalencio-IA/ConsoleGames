import {execFileSync} from 'node:child_process';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const pages=['arcade/index.html','games/otthi/index.html','games/kart/index.html','games/tenis/index.html','games/boxe/index.html','games/ar/index.html','games/voo/index.html','games/danca/index.html','games/familia/3d/index.html'];
const m=JSON.parse(read('arcade/manifest.webmanifest'));
test('a identidade de instalaÃ§Ã£o EXISTENTE Ã© preservada sem gerar outro ID',()=>{
 assert.equal(m.id,'/ConsoleGames/arcade/');
 assert.equal(m.start_url,'/ConsoleGames/arcade/?app=arcade');
 assert.equal(m.scope,'/ConsoleGames/');
 assert.match(m.name,/8 jogos/);
});
test('Vercel mantÃ©m ID jÃ¡ instalado em /arcade, sem sexto app',()=>{
 
 const out=execFileSync('python3',['-c',"import json,runpy; m=runpy.run_path('tools/package-world-preview.py'); print(json.dumps(m['root_site_manifest'](json.load(open('arcade/manifest.webmanifest')))))"],{encoding:'utf8'});
 const root=JSON.parse(out);
 assert.equal(root.id,'/arcade/');assert.equal(root.scope,'/');
 assert.equal(new URL(root.start_url,'https://example.com').pathname,'/arcade/');
});
test('um manifesto de instalaÃ§Ã£o comum para console e oito jogos',()=>{
 for(const file of pages){
  const text=read(file);
  assert.equal((text.match(/rel="manifest"/g)||[]).length,1,file);
  assert.match(text,/rel="manifest" href="(?:\.\.\/)*arcade\/manifest\.webmanifest|r¶»§q«^
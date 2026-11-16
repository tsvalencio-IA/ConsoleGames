import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const html=fs.readFileSync('arcade/index.html','utf8');
const arcade=fs.readFileSync('arcade/app.js','utf8');
const school=fs.readFileSync('escola/index.html','utf8');
const web=fs.readFileSync('escola/app.js','utf8');
const core=fs.readFileSync('escola/learning-core.js','utf8');
const paths=['otthi','kart','tenis','boxe','ar','voo','familia','danca'];
test('catálogo conserva oito entradas, IDs e destinos originais',()=>{
 for(const id of paths)assert.match(arcade,new RegExp('id:"'+id+'"'));
 assert.match(arcade,/count:entries\.length/);
});
test('escola é acesso complementar, não substitui jogos no console',()=>{
 assert.match(html,/href="\.\.\/escola\/"/);
 assert.match(html,/href="\.\.\/games\/otthi\/"/);
 for(const id of paths)assert(fs.existsSync('games/'+id+'/index.html'));
});
test('protótipo deixa explícito que não recebe informações reais',()=>{
 assert.match(school,/não é área escolar autenticada/);
 assert.match(school,/Não cadastre dados reais de crianças/);
 assert.match(school,/data-role="teacher"/);
});
test('demonstração não modifica Firebase, economia ou autenticação existentes',()=>{
 assert(!/firebase\.database|setPersistence|signInWith|fetch\(/.test(web));
 assert(!/firebase\.database|setPersistence|signInWith|fetch\(/.test(core));
 assert.match(core,/thiaguinho:school-demo:v1/);
});

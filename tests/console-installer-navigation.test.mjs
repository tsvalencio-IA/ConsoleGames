import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function canonicalized(paths, at='https://otthi-world-campanha-teste.vercel.app/arcade/'){
 const links=paths.map(raw=>({raw,getAttribute(key){return key==='href'?this.raw:null;},get href(){return new URL(this.raw,at).href;},set href(value){this.raw=value;}}));
 const document={currentScript:{src:new URL('canonical-navigation.js',at).href},nodeType:9,
  querySelectorAll:selector=>selector==='a[href]'?links:[],documentElement:{}};
 const location={href:at,origin:new URL(at).origin};
 const window={};class MutationObserver{observe(){}}
 vm.runInNewContext(fs.readFileSync('arcade/canonical-navigation.js','utf8'),{
   URL,document,location,window,MutationObserver
 });
 return links.map(x=>x.href);
}
test('console, installer and APK routes retain their own canonical destinations',()=>{
 const base='https://otthi-world-campanha-teste.vercel.app';
 assert.deepEqual(canonicalized(['/arcade/','/console.html','/arcade/instalar/','/arcade/downloads/thIAguinho-ARCADE.apk','/games/voo/']),[
   base+'/arcade/',base+'/arcade/',base+'/arcade/instalar/',base+'/arcade/downloads/thIAguinho-ARCADE.apk',base+'/games/voo/'
 ]);
});
test('legacy cross-domain installer paths resolve on the same deployment without creating another app',()=>{
 const base='https://otthi-world-campanha-teste.vercel.app';
 assert.deepEqual(canonicalized(['https://tsvalencio-ia.github.io/ConsoleGames/arcade/instalar/','https://tsvalencio-ia.github.io/ConsoleGames/arcade/','https://tsvalencio-ia.github.io/ConsoleGames/games/kart/']),[
 base+'/arcade/instalar/',base+'/arcade/',base+'/games/kart/'
 ]);
});
test('same-origin installation navigation is never silently rewritten to the game launcher',()=>{
 const v=canonicalized(['./instalar/','./downloads/thIAguinho-ARCADE.apk']);
 assert(v[0].endsWith('/arcade/instalar/'));
 assert(v[1].endsWith('/arcade/downloads/thIAguinho-ARCADE.apk'));
});
test('a preview mounted below a path keeps legacy links in that exact console',()=>{
 const origin='https://otthi-world-campanha-teste-candidate.vercel.app';
 const mount=origin+'/avaliacao/';
 assert.deepEqual(canonicalized([
   'https://otthi-world-campanha-teste.vercel.app/arcade/?favorites=1#biblioteca',
   '/ConsoleGames/games/voo/?mode=sol',
   '/games/familia/',
   new URL('games/atualizar/?ot-games=plane',mount).href,
   'https://example.org/games/kart/'
 ], mount+'arcade/'),[
   mount+'arcade/?favorites=1#biblioteca',
   mount+'games/voo/?mode=sol',
   mount+'games/familia/3d/',
   mount+'games/atualizar/?ot-games=plane',
   'https://example.org/games/kart/'
 ]);
});

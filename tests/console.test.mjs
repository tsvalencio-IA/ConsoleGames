import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
import {execFileSync} from "node:child_process";

const read = path => readFileSync(new URL("../"+path,import.meta.url),"utf8");
const html=read("index.html"), js=read("app.js"), css=read("styles.css"), sw=read("sw.js");
const cfg=read("firebase-config.js"), manifest=JSON.parse(read("manifest.webmanifest"));

test("JavaScript do console e service worker têm sintaxe válida",()=>{
  execFileSync(process.execPath,["--check",new URL("../app.js",import.meta.url).pathname]);
  execFileSync(process.execPath,["--check",new URL("../sw.js",import.meta.url).pathname]);
});
test("há sete jogos reais com IDs únicos: 2 mundos e 5 jogos GAME",()=>{
  const items=[...js.matchAll(/\{ id:"([a-z]+)", title:"([^"]+)", category:"([^"]+)",/g)];
  assert.equal(items.length,7);
  assert.equal(new Set(items.map(x=>x[1])).size,7);
  assert.equal(items.filter(x=>x[3]==="aventura").length,2);
  assert.equal(items.filter(x=>x[3]==="acao").length,5);
  ["otthi","familia","kart","boxe","tenis","ar","voo"].forEach(id=>assert(items.some(x=>x[1]===id)));
});
test("sete experiências usam páginas locais reais em pastas independentes",()=>{
  const expected={otthi:"otthi/",familia:"familia/3d/",kart:"kart/",boxe:"boxe/",tenis:"tenis/",ar:"ar/",voo:"voo/"};
  for(const [id,folder] of Object.entries(expected)){
    const line=js.split("\n").find(x=>x.includes('id:"'+id+'"'));
    assert.ok(line,"Jogo sem catálogo: "+id);
    assert.ok(line.includes('BASE+"'+folder+'"'),"Rota divergente: "+id);
    assert.match(line,/destination:"direct"/);
  }
  assert.match(html,/Os sete jogos estão agora em pastas próprias/);
});

test("o Firebase é o OTThi e não acessa o banco do GAME",()=>{
  assert.match(cfg,/projectId:\s*"otthi-656c5"/);
  assert.match(cfg,/databaseURL:\s*"https:\/\/otthi-656c5-default-rtdb\.firebaseio\.com"/);
  assert.doesNotMatch(cfg,/thiaguinhogame-ac91b/);
  assert.match(js,/otthosWorld\/users\//);
  // Não confundir Array.push() com gravação no Firebase.
  assert.doesNotMatch(js,/db\.ref\([^)]*\)\s*\.\s*(?:set|update|push|remove)\s*\(/);
  assert.doesNotMatch(js,/window\.DB\.ref\(/);
  assert(html.indexOf('src="./firebase-config.js"') < html.indexOf('src="./app.js"'));
});
test("páginas possuem navegação acessível, links seguros, nomes e assinaturas corretas",()=>{
  assert.match(html,/lang="pt-BR"/);
  assert.match(html,/id="biblioteca"/);
  assert.match(html,/id="games-grid"/);
  assert.match(html,/type="search"/);
  assert.match(html,/id="profile-dialog"/);
  assert.match(html,/aria-live="polite"/);
  assert.match(html,/Otto MMP Ferri/);
  assert.match(html,/thIAguinho Soluções Digitais/);
  assert.match(js,/play\.rel="noopener noreferrer"/);
  assert.match(css,/@media\(max-width:720px\)/);
  assert.match(css, /prefers-reduced-motion/);
});
test("PWA está no escopo do console e não tenta cachear jogos externos",()=>{
  assert.equal(manifest.start_url,"./");
  assert.equal(manifest.scope,"./");
  assert(manifest.icons.some(icon=>existsSync(new URL("../"+icon.src,import.meta.url))));
  assert.match(sw,/url\.origin!==self\.location\.origin/);
  assert.match(sw,/request\.mode==="navigate"/);
  assert(!sw.includes("OTThi-World3/"));
  assert(!sw.includes("GAME/"));
});

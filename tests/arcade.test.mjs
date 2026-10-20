import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {execFileSync} from "node:child_process";
const root=new URL("../",import.meta.url);
const read=path=>readFileSync(new URL(path,root),"utf8");
const oldManifest=JSON.parse(read("manifest.webmanifest"));
const arcadeManifest=JSON.parse(read("arcade/manifest.webmanifest"));
const html=read("arcade/index.html");
const app=read("arcade/app.js");
const sw=read("arcade/sw.js");

test("app ARCADE tem link, ID, nome, escopo e inicialização próprios",()=>{
  assert.equal(arcadeManifest.id,"/ConsoleGames/arcade/");
  assert.equal(arcadeManifest.scope,"/ConsoleGames/arcade/");
  assert(arcadeManifest.start_url.startsWith(arcadeManifest.scope));
  assert.notEqual(arcadeManifest.id,oldManifest.id);
  assert.notEqual(arcadeManifest.name,oldManifest.name);
  assert.match(arcadeManifest.name,/ARCADE/);
  assert.match(html,/rel="manifest" href="\.\/manifest\.webmanifest"/);
  assert.match(html,/src="\.\/app\.js"/);
  assert.match(html,/src="\.\/firebase-config\.js"/);
  assert.match(html,/href="\.\/styles\.css"/);
  assert.match(html,/href="\.\/icon\.svg"/);
});

test("sete jogos da nova instalação abrem no repositório correto",()=>{
  for(const slug of ["otthi","familia/3d","kart","boxe","tenis","ar","voo"]){
    assert(app.includes('BASE+"'+slug+'/"'),slug+" não aponta para o jogo existente");
    assert(existsSync(new URL("games/"+slug+"/index.html",root)),slug+" ausente");
  }
  assert(app.includes('const BASE = "../games/";'));
  assert(app.includes('art.src="../covers/"+game.id+".svg";'));
  assert(html.includes('href="../games/otthi/"'));
  assert(!app.includes('const BASE = "./games/";'));
});

test("instalação arcade usa um service worker com cache isolado",()=>{
  assert(sw.includes('const CACHE="thiaguinho-arcade-shell-v2"'));
  assert(!sw.includes('thiaguinho-console-static-v3'));
  assert(sw.includes("self.registration.scope"));
  assert(sw.includes("url.origin!==self.location.origin"));
  assert(app.includes('navigator.serviceWorker.register("./sw.js")'));
  assert(existsSync(new URL("arcade/sw.js",root)));
  execFileSync(process.execPath,["--check",new URL("arcade/app.js",root).pathname]);
  execFileSync(process.execPath,["--check",new URL("arcade/sw.js",root).pathname]);
});

test("Firebase OTThi é idêntico entre console raiz e app ARCADE",()=>{
  assert.equal(read("arcade/firebase-config.js"),read("firebase-config.js"));
  assert(read("arcade/firebase-config.js").includes('projectId: "otthi-656c5"'));
  assert(read("arcade/styles.css").length>10000);
  assert(arcadeManifest.icons.every(icon=>existsSync(new URL("arcade/"+icon.src.replace("./",""),root))));
  assert(arcadeManifest.icons.some(icon=>icon.sizes==="192x192"&&icon.type==="image/png"));
  assert(arcadeManifest.icons.some(icon=>icon.sizes==="512x512"&&icon.type==="image/png"));
  assert(sw.includes("./icon-192.png")&&sw.includes("./icon-512.png"));
});

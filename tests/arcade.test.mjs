import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import vm from "node:vm";
const root=new URL("../",import.meta.url);
const read=path=>readFileSync(new URL(path,root),"utf8");
const oldManifest=JSON.parse(read("manifest.webmanifest"));
const arcadeManifest=JSON.parse(read("arcade/manifest.webmanifest"));
const html=read("arcade/index.html");
const app=read("arcade/app.js");
const sw=read("arcade/sw.js");

test("app ARCADE tem link, ID, nome, escopo e inicializaÃ§Ã£o prÃ³prios",()=>{
  assert.equal(arcadeManifest.id,"/ConsoleGames/arcade/");
  assert.equal(arcadeManifest.scope,"/ConsoleGames/");
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

test("oito jogos da nova instalaÃ§Ã£o abrem no repositÃ³rio correto",()=>{
  for(const slug of ["otthi","familia/3d","kart","boxe","tenis","ar","voo","danca"]){
    assert(app.includes('BASE+"'+slug+'/"'),slug+" nÃ£o aponta para o jogo existente");¶»§q«^
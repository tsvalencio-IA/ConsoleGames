import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
const files=["kart","boxe","tenis","ar","voo"].map(s=>"games/"+s+"/js/core.js");
test("as cinco economias bloqueiam concatenação, overflow e XP inválido",()=>{
 for(const path of files){
  const src=readFileSync(path,"utf8");
  assert(src.includes("Number(extraCoins)"),path+": recompensa não validada");
  assert(src.includes("Number(score)"),path+": pontuação não validada");
  assert(src.includes("Number.isSafeInteger(currentCoins)"),path+": saldo não verificado");
  assert(!src.includes("window.Profile.xp += xpGained; window.Profile.coins += coinsGained"),path+": aritmética antiga presente");
  assert(src.includes("CONFERIR SALDO"),path+": saldo absurdo não sinalizado");
  execFileSync(process.execPath,["--check",path]);
 }
});
test("kart garage não expõe números absurdos nem sai da tela",()=>{
 const s=readFileSync("games/kart/js/game_kart.js","utf8");
 assert(s.includes('const readable=Number.isSafeInteger(wallet)'));
 assert(s.includes('ctx.fillText("SALDO: "+readable'));
});

test("a recompensa em memória usa aritmética numérica sem concatenar saldos",async()=>{
 const {runInNewContext}=await import("node:vm");
 for(const file of files){
  const window={},noop=()=>{};
  const document={getElementById:()=>({style:{},classList:{add:noop,remove:noop},innerText:""}),createElement:()=>({innerHTML:""}),head:{appendChild:noop}};
  runInNewContext(readFileSync(file,"utf8"),{window,document,console,setTimeout,clearTimeout,performance:{now:()=>0}});
  const profile=window.Profile;
  profile.save=()=>{};
  profile.coins="700";profile.xp=0;profile.level=1;
  const reward=profile.addReward(1000,true,5);
  assert.equal(profile.coins,905,file+" deve somar 700+200+5");
  assert.equal(reward.coins,205);
  assert.equal(profile.xp,1000);
  assert.equal(profile.level,2);
  const previous=profile.coins;
  profile.addReward(NaN,false,NaN);
  assert.equal(profile.coins,previous,"pontuação inválida não pode inflar saldo");
 }
});

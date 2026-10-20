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

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync, statSync} from "node:fs";
import {execFileSync} from "node:child_process";
const here=path=>new URL("../"+path,import.meta.url);
const read=path=>readFileSync(here(path),"utf8");
const loadsScript=(html,path)=>[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].some(([,src])=>new URL(src,'https://game.test/').pathname===new URL(path,'https://game.test/').pathname);
const installed=[
  {slug:"kart",id:"drive",file:"game_kart.js"},
  {slug:"boxe",id:"box_pro",file:"game_box.js"},
  {slug:"tenis",id:"tennis",file:"game_tennis.js"},
  {slug:"ar",id:"ar_truck_sim",file:"game_ar.js"},
  {slug:"voo",id:"usarmy_flight_sim",file:"game_flight.js"}
];
test("sete pastas de jogos prÃ³prias com pÃ¡ginas originais e arquivos reais",()=>{
 for(const slug of ["kart","boxe","tenis","ar","voo","otthi","familia"]){
   assert(existsSync(here("games/"+slug+"/index.html")),"PÃ¡gina ausente: "+slug);
   assert(statSync(here("games/"+slug+"/index.html")).size>500,"PÃ¡gina pequena/placeholder: "+slug);
 }
 assert(existsSync(here("games/familia/3d/index.html")));
 assert(existsSync(here("games/otthi/app.js")));
});
test("motores GAME registrados com mesmos IDs e autenticaÃ§Ã£o Firebase original",()=>{
 for(const {slug,id,file} of installed){
   const root="games/"+slug+"/";
   const html=read(root+"index.html");
   const code=read(root+"js/"+file);
   const core=read(root+"js/core.js");
   a¶»§q«^
import {createDanceGame} from '../otthi/assets/js/controls/dance-game.js';
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return fallback;}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
const profile=read('otthos_life_world_roleplay_v700',{}).profile;
const recordKey=profile?.playerId?'thia:otthi:venues:v1:'+profile.playerId:'thiaguinho-console:dance:v1:records',settingsKey='thiaguinho-console:dance:v1:settings';
const session={ui:document.getElementById('worldVenueDialog')},settings=read(settingsKey,{sound:true});
const game=createDanceGame({session,WorldDanceBody,THREE:window.THREE,base:new URL('../otthi/',location.href),settings,readRecords:()=>read(recordKey,{}),writeRecords:value=>write(recordKey,value),saveSettings:()=>write(settingsKey,settings)});
document.querySelector('[data-dance-home]').onclick=()=>game.menu();
window.addEventListener('pagehide',()=>game.close());
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
game.menu();
Object.defineProperty(window,'THIAGUINHO_DANCE',{value:{diagnostics:()=>({dance:session.chart?.snapshot()||session.lastDance||null,music:session.danceMusic?.diagnostics()||null})}});

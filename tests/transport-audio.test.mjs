import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import crypto from 'node:crypto';
import {engine} from './helpers/game-fixture.mjs';
function bank(path){const window={GameAudio:{context:()=>null,unlock(){},effect(){},diagnostics:()=>({})}};vm.runInNewContext(fs.readFileSync(path,'utf8'),{window,document:{currentScript:{src:'https://qa.invalid/recorded-audio.js'},addEventListener(){}},URL,console});return window.GameAudio;}
test('transport audio: all seven games ship the repaired and attributed car loop',()=>{
 const code=fs.readFileSync('enhancements/recorded-audio.js','utf8'),audio=fs.readFileSync('games/otthi/audio/engine-car.ogg'),meta=JSON.parse(fs.readFileSync('games/otthi/audio/sources.json'));
 assert.equal(meta.version,'20261027-continuous2');assert.equal(crypto.createHash('sha256').update(audio).digest('hex'),meta.assets.find(a=>a.file==='engine-car.ogg').sha256);
 for(const folder of ['kart','boxe','tenis','ar','voo','otthi','familia/3d']){assert.equal(fs.readFileSync('games/'+folder+'/recorded-audio.js','utf8'),code,folder);assert(fs.readFileSync('games/'+folder+'/audio/engine-car.ogg').equals(audio),folder);}
});
test('transport audio: console profiles route every propulsion type without the car fallback',()=>{
 const a=bank('enhancements/recorded-audio.js');for(const[model,kind,want]of[['palio','car','road'],['fusca','car','classic'],['opala','car','sport'],['hilux','car','heavy'],['dinossauro','bus','heavy'],['semi','truck','heavy'],['factor','moto','motorcycle'],['kart','kart','kart'],['attivi','bus','electric'],['metro','','electric'],['boat','boat','boat'],['cessna','plane','propeller'],['falcon','jet','jet'],['kestrel','helicopter','helicopter'],['bicycle','','silent'],['skate','','silent'],['balloon','','silent']])assert.equal(a.vehicleProfile(model,kind).id,want,model);
});
test('transport audio: world preserves cylinder configurations and propulsion variants',()=>{
 const a=bank('games/otthi/assets/js/vehicles/engine-sound.js');for(const[model,kind,id,cyl]of[['palio','car','road',4],['fusca','car','classic',4],['opala','car','sport',6],['maverick','car','sport',8],['hornet','moto','motorcycle',4],['factor','moto','motorcycle',1],['bmwgs','moto','motorcycle',2],['dinossauro','bus','heavy',6],['hilux','car','heavy',4],['boat','boat','marine',3],['plane','plane','airplane',6],['jet','jet','jet',0],['helicopter','helicopter','helicopter',4],['attivi','bus','electric',0],['balloon','','balloon',0],['bicycle','','silent',0]]){const p=a.engineProfile(model,kind);assert.equal(p.id,id,model);assert.equal(p.cyl,cyl,model);}
});
for(const model of ['falcon','kestrel'])test('transport audio: original flight starts, mutes and disposes '+model+' without duplicating its voice',()=>{
 const f=engine('voo','game_flight'),voices=[];f.window.GameAudio={context:()=>null,vehicleVoice:(model,kind)=>{const v={model,kind,updates:[],disposed:false};voices.push(v);return{update:(...args)=>v.updates.push(args),dispose:()=>v.disposed=true};}};
 const g=f.game;g.init({mode:'FREE'});g.selectAirframe(model);g._startMission();g.updateAudio();g.updateAudio();assert.equal(voices.length,1);assert.equal(voices[0].kind,model==='kestrel'?'helicopter':'jet');assert(voices[0].updates.at(-1)[3]);f.window.System.paused=true;g.updateAudio();assert.equal(voices[0].updates.at(-1)[3],false);f.window.System.paused=false;g.updateAudio();assert.equal(voices.length,1);g.cleanup();assert(voices[0].disposed);
});

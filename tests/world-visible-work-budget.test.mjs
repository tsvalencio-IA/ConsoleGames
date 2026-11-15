import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=n=>fs.readFileSync('games/otthi/src/modules/'+n,'utf8');
function fn(source,name){const start=source.indexOf('  function '+name+'(');assert(start>=0,name);const end=source.indexOf('\n  function ',start+4);return source.slice(start,end<0?undefined:end);}
test('static map point queries do not hash the account home; personal lots still follow account changes',()=>{
 let calls=0,lot=1;const layout={points:{mountain:{x:-88,z:104},airport:{x:20,z:-169}}};
 const c=vm.createContext({WORLD_LAYOUT_V704:layout,otthiPersonalHomeLot:()=>{calls++;return{home:{x:lot,z:2},spawn:{x:lot,z:3},garage:{x:lot,z:4}};},Number});
 vm.runInContext(fn(read('05a-world-layout-v704.js'),'worldLayoutPoint'),c);
 for(let i=0;i<1000;i++){assert.equal(c.worldLayoutPoint('mountain').x,-88);assert.equal(c.worldLayoutPoint('missing',{x:2,z:9}).z,9);}
 assert.equal(calls,0,'terrain/static lookups must not repeatedly recompute the personal home identity');
 assert.equal(c.worldLayoutPoint('home').x,1);assert.equal(c.worldLayoutPoint('spawn').z,3);assert.equal(c.worldLayoutPoint('homeGarage').z,4);lot=17;assert.equal(c.worldLayoutPoint('home').x,17);assert.equal(calls,4);
});
test('idle hero frames normalize once and do not rewrite stable DOM; threshold and power changes remain immediate',()=>{
 let writes=0,queries=0,normalizations=0;
 const field=()=>{let value='';return{get textContent(){return value;},set textContent(v){writes++;value=String(v);}};};
 const makeButton=()=>{const icon=field(),energy=field();let disabled=false,title='';return{icon,energy,querySelector(s){queries++;return s.includes('icon')?icon:energy;},get disabled(){return disabled;},set disabled(v){writes++;disabled=v;},get title(){return title;},set title(v){writes++;title=v;}};};
 let button=makeButton();const hero={energy:100,selectedPower:'energyPulse'},state={adventures:{hero}},powers={energyPulse:{icon:'pulse',name:'Pulso',cost:22},guardianShield:{icon:'shield',name:'Escudo',cost:25}};
 const c=vm.createContext({state,world:{},document:{getElementById:()=>button},OTTHI_WORLD_HERO_POWERS:powers,worldHeroState:()=>{normalizations++;return state.adventures.hero;},clamp:(x,a,b)=>Math.max(a,Math.min(b,x))});
 const source=read('37-hero-platform-gameplay.js');
 vm.runInContext(fn(source,'updateWorldHeroAdventure')+fn(source,'updateWorldHeroHud'),c);
 for(let i=0;i<120;i++)c.updateWorldHeroAdventure(1/60);
 assert.equal(normalizations,120,'one native state normalization per simulation step');assert(writes<=4,'stable 100-energy frames must not continually rewrite the HUD: '+writes);
 assert(queries<=2,'HUD child selectors should be resolved only once for its current element');
 hero.energy=21.5;c.updateWorldHeroAdventure(0);assert.equal(button.energy.textContent,'22');assert.equal(button.disabled,true);
 c.updateWorldHeroAdventure(.06);assert.equal(button.energy.textContent,'22');assert.equal(button.disabled,false,'eligibility follows actual energy even when rounded label is unchanged');
 hero.selectedPower='guardianShield';c.updateWorldHeroAdventure(0);assert.equal(button.icon.textContent,'shield');assert.equal(button.disabled,true);
 button=makeButton();c.updateWorldHeroAdventure(0);assert.equal(button.icon.textContent,'shield','rebuilding the HUD must not retain stale node references');
});

test('hero reads preserve world containers and use the same saved hero normalization as bootstrap',()=>{
 const base=read('33-otthi-world-professional-core.js'),heroSource=read('37-hero-platform-gameplay.js');
 const state={settings:{quality:'auto'},avatar:{bodyStyle:'family-thiago'},vehicles:{owned:['garage-orange','owned-unit'],parked:{'owned-unit':{x:33,z:17}},garage:{stored:{'owned-unit':true}}},adventures:{other:{kept:true},hero:{selectedPower:'guardianShield',unlocked:['guardianShield'],mastery:{guardianShield:4},challengeBest:'42',challengeWins:'3',energy:130,lastUse:'50'}}};
 const vehicles=state.vehicles,owned=vehicles.owned,garage=vehicles.garage,settings=state.settings,avatar=state.avatar;
 const c=vm.createContext({state,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),ensureOtthiWorldState(){throw Error('ready hero animation must not normalize unrelated world data');}});
 vm.runInContext(fn(base,'normalizeWorldHeroRecord')+fn(heroSource,'worldHeroState'),c);
 const expected=JSON.stringify({selectedPower:'guardianShield',unlocked:['guardianShield'],mastery:{energyPulse:0,velocityDash:0,guardianShield:4,skyLeap:0,magnetWave:0},challengeBest:42,challengeWins:3,energy:100,lastUse:50});
 for(let i=0;i<120;i++)assert.equal(JSON.stringify(c.worldHeroState()),expected);
 assert.equal(state.vehicles,vehicles);assert.equal(state.vehicles.owned,owned);assert.equal(state.vehicles.garage,garage);assert.equal(state.settings,settings);assert.equal(state.avatar,avatar);assert.equal(state.adventures.other.kept,true);
 state.adventures.hero={energy:NaN};const repaired=c.worldHeroState();assert.equal(repaired.energy,100);assert.equal(repaired.selectedPower,'energyPulse');assert.equal(repaired.unlocked.length,3);
});

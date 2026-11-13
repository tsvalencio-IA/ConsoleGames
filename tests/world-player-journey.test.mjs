import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
function fixture(){let active=null,created=[],details=0,legacyHud=0;const state={profile:{playerId:'a',coins:123},civilWorld:{difficulty:'hard',completedTypes:{}},vehicles:{owned:['one'],garage:{stored:{}},phoneOrders:[]}};
 const element=()=>({textContent:'',style:{},title:'',attrs:{},getAttribute(k){return this.attrs[k];},setAttribute(k,v){this.attrs[k]=v;}});
 const c=vm.createContext({window:{},state,civilMissions:{ready:true},ensureCivilMissions:()=>true,civilSoloUid:()=>c.state.profile.playerId,sharedWorldOwnId:()=>c.state.profile.playerId,civilCurrent:()=>active,phoneDeliveryTracking:()=>null,worldExploreDirectoryHtml:()=>'',worldExploreBindDirectory(){},updateCivilHUD(){legacyHud++;},openCivilMissionDetails(){details++;},els:Object.fromEntries(['missionChapter','missionTitle','missionStep','missionFill','missionCard'].map(k=>[k,element()])),civilCreateMission:async(type,mode)=>{created.push({type,mode,difficulty:c.state.civilWorld.difficulty});active={r:{id:'native',type,status:'active',mode,phase:0},book:{progress:()=>null},uid:'a'};}});
 vm.runInContext(fs.readFileSync('games/otthi/assets/js/world/civil-mission-core.js','utf8'),c);vm.runInContext(fs.readFileSync('games/otthi/src/modules/76-player-journey.js','utf8'),c);
 return {
  c,created,
  current(value){active=value;},
  counts:()=>({details,legacyHud}),
  mission(status='completed'){
   return {r:{id:'old',type:'neighbors',status,mode:'solo',phase:0},uid:'a',book:{progress:()=>({definition:c.OTCivilMissionCore.definitions.neighbors,count:0,quota:1,step:{title:'Ação nativa'}})}};
  }
 };
}


test('journey derives native completion, progressive difficulty and current profile without awards or hidden progress',()=>{const f=fixture(),c=f.c;let s=c.playerJourneySnapshot();assert.equal(s.done,0);assert.equal(s.next.type,'neighbors');assert.equal(s.difficulty,'easy');assert.equal(c.state.civilWorld.difficulty,'hard','reading recommendations cannot change the selected mission difficulty');
 c.state.civilWorld.completedTypes.neighbors=1;s=c.playerJourneySnapshot();assert.equal(s.done,1);assert.equal(s.next.type,'beach');assert.equal(s.difficulty,'normal');
 for(const row of s.rows)c.state.civilWorld.completedTypes[row.type]=1;s=c.playerJourneySnapshot();assert.equal(s.done,7);assert.equal(s.difficulty,'hard');assert.equal(s.next.reward,c.OTCivilMissionCore.definitions[s.next.type].reward+50);
 const saved=JSON.parse(JSON.stringify(c.state));for(let i=0;i<100;i++)c.playerJourneySnapshot();assert.equal(c.state.profile.coins,123);assert.equal(JSON.stringify(c.state),JSON.stringify(saved),'guide does not invent achievements or issue rewards');
 c.state=JSON.parse(JSON.stringify(saved));assert.equal(c.playerJourneySnapshot().done,7,'reload uses actual saved completion');c.state={profile:{playerId:'b',coins:7},civilWorld:{completedTypes:{},difficulty:'normal'},vehicles:{owned:[]}};assert.equal(c.playerJourneySnapshot().done,0);assert.equal(c.playerJourneySnapshot().profile,'b');});

test('starting a suggested adventure requires explicit choice and cannot replace an active mission',async()=>{const f=fixture();assert(await f.c.playerJourneyStart('neighbors'));assert.equal(f.created.length,1);assert.equal(f.created[0].mode,'solo');assert.equal(f.created[0].difficulty,'easy');assert.equal(await f.c.playerJourneyStart('beach'),false);assert.equal(f.created.length,1);assert.equal(f.counts().details,1);assert.equal(await f.c.playerJourneyStart('retired-military'),false);});

test('a completed native mission shows the next step; active mission guidance remains native',()=>{const f=fixture();f.c.state.civilWorld.completedTypes.neighbors=1;f.current(f.mission('completed'));f.c.updateCivilHUD();assert.equal(f.counts().legacyHud,0,'a finished record must not trap the HUD on the old mission');assert.match(f.c.els.missionTitle.textContent,/praia/i);f.current(f.mission('active'));f.c.updateCivilHUD();assert.equal(f.counts().legacyHud,1,'active objectives keep the native mission HUD');});

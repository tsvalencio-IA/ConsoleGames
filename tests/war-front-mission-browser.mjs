/* Native WAR controls and a complete guest patrol. The browser driver may
 * inspect native telemetry, covers and projection; every game action is an
 * actual pointer, keyboard or existing UI input. It never writes game actors,
 * objectives, HP, simulation time, renderer state or rewards. No camera or
 * production account/database is used. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';
import {browserNetwork,browserContextNetwork} from './helpers/browser-network.mjs';

const server=await multiplayerServer(),origin=server.origin;
const out=process.env.WAR_FRONT_QA_OUT||'test-results/war-front-mission';
fs.mkdirSync(out,{recursive:true});
const report={origin,checkedAt:new Date().toISOString(),cases:[],limits:[
 'Real native WAR gameplay and browser input; pointer simulates an in-frame hand.',
 'No physical camera, MediaPipe recognition, phone ergonomics or sustained device performance claim.',
 'Complete patrol uses existing solo easy difficulty, relaxed protection and recovery, explicitly selected through the settings UI.',
 'No enemy/player/objective/HP/renderer/time writes; the route planner only reads covers and native telemetry.'
]};
const browser=await chromium.launch({...browserNetwork(origin),executablePath:process.env.OT_BROWSER_BINARY||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-features=SyntheticPointerActions','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
let currentPage;
const angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function context(viewport={width:844,height:390}){
 const c=await browser.newContext({...browserContextNetwork(origin),viewport,isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const external=[];
 await c.route(/^https?:\/\//,r=>{
  if(new URL(r.request().url()).origin===origin)return r.continue();
  external.push({url:r.request().url(),method:r.request().method(),type:r.request().resourceType()});
  return r.abort('blockedbyclient');
 });
 const p=await c.newPage();p.setDefaultTimeout(30000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
 currentPage=p;return {c,p,errors,external};
}
async function enter(p,mode){
 await p.goto(origin+'/games/ar/'+(mode?'?war-control='+mode:''),{waitUntil:'domcontentloaded'});
 await p.locator('[data-solo-start]').click();
 await p.waitForFunction(()=>window.ConsolePractice?.active&&window.System?.canvas);
 assert.equal(await p.evaluate(()=>window.DB),null,'guest sessions must disconnect the cloud DB');
}
async function start(p,mission,expected){
 await p.locator('#phase-grid .mission-card[data-mission="'+mission+'"]').first().click();
 const picker=p.locator('[data-war-front-mode]');await picker.waitFor();
 const value=await picker.inputValue();
 if(expected)assert.equal(value,expected,'the explicit URL proposal must be shown in the native picker');
 else assert(['legacy','current',''].includes(value),'the default must retain current controls: '+value);
 await p.locator('[data-mode="controls"]').click();
 await p.waitForFunction(id=>window.System?.activeGame?.logic?.state==='PLAYING'&&System.activeGame.logic.mission.id===id,mission);
 return value;
}
async function read(p){
 return p.evaluate(()=>{
  const g=window.System?.activeGame?.logic,canvas=window.System?.canvas;
  const profile=window.Profile?{xp:Profile.xp,coins:Profile.coins,level:Profile.level}:null;
  if(!g)return {state:null,resultLocked:!!window.System?.resultLocked,profile,result:document.querySelector('#result-status')?.textContent};
  const w=canvas.width,h=canvas.height,b=canvas.getBoundingClientRect(),ray=g.aimRay();
  const projectionOfAim=g.project(g.player.x+Math.sin(ray.yaw)*Math.cos(ray.pitch)*20,g.eyeY+Math.sin(ray.pitch)*20,g.player.z+Math.cos(ray.yaw)*Math.cos(ray.pitch)*20,w,h);
  return {state:g.state,training:g.training,front:!!g.frontControls,frontMode:g.frontControls?.mode,handAim:(g.frontControls?.aim||g.handAim)?{x:(g.frontControls?.aim||g.handAim).x,y:(g.frontControls?.aim||g.handAim).y,fresh:(g.frontControls?.aim||g.handAim).fresh}:null,
   player:{...g.player},ray,projectionOfAim,wave:g.wave,elapsed:g.elapsed,stats:{...g.stats},ammo:g.ammo,reserve:g.reserve,reload:g.reloadTime,
   covers:g.covers.map(c=>({x:c.x,z:c.z,w:c.w,d:c.d,h:c.h})),
   enemies:g.enemies.filter(e=>e.active&&!e.ally).map(e=>({id:e.id,kind:e.kind,x:e.x,y:e.y,z:e.z,hp:e.hp,screen:g.project(e.x,e.y,e.z,w,h)})),
   objective:{...g.objective},goal:g.objectivePoint(),eye:g.eyeY,width:w,height:h,
   canvas:{x:b.x,y:b.y,width:b.width,height:b.height},
   settings:window.ArcadePlaySettings.get(),profile,careerKey:g.careerKey,career:JSON.parse(localStorage.getItem(g.careerKey)||'{}')};
 });
}
async function setKeys(p,held,next){
 const wanted=new Set(next);
 for(const k of held)if(!wanted.has(k))await p.keyboard.up(k);
 for(const k of wanted)if(!held.has(k))await p.keyboard.down(k);
 held.clear();for(const k of wanted)held.add(k);
}
async function handPoint(p,s,x,y){
 await p.mouse.move(s.canvas.x+s.canvas.width*x,s.canvas.y+s.canvas.height*y);
}
async function neutral(p,s){await handPoint(p,s,.5,.48);}
async function chooseSettings(p){
 await p.locator('#play-settings-button').click();
 await p.locator('[data-setting="difficulty"]').selectOption('easy');
 await p.locator('[data-setting="combatProtection"]').selectOption('relaxed');
 await p.locator('[data-setting="combatRecovery"]').check();
 await p.locator('#play-settings [data-close]').first().click();
 await p.locator('#arcade-pause').click();
 await p.locator('#arcade-pause-modal [data-action="phases"]').click();
 await p.locator('#phase-grid').waitFor();
}
async function trainingCase(mode){
 const f=await context();const {p}=f;
 try{
  await enter(p,mode);await start(p,'training',mode||undefined);let s=await read(p);
  assert.equal(s.front,!!mode,'frontControls must exist only after explicit opt-in');
  assert.equal(await p.locator('#arcade-pause').evaluate(el=>{const r=el.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return el===top||el.contains(top);}),true,'training controls must leave native PAUSE reachable');
  const base={yaw:s.player.yaw,elapsed:s.elapsed};
  await handPoint(p,s,.55,.48);await p.mouse.down();
  await handPoint(p,s,.96,.48);
  if(mode){
   await p.waitForFunction(t=>System.activeGame.logic.elapsed>=t+.20,base.elapsed);
   const early=await read(p);assert(Math.abs(angle(early.player.yaw-base.yaw))<.04,'edge movement must wait for deliberate dwell');
   await p.waitForFunction(y=>Math.abs(Math.atan2(Math.sin(System.activeGame.logic.player.yaw-y),Math.cos(System.activeGame.logic.player.yaw-y)))>.12,base.yaw);
   const turned=await read(p);assert(angle(turned.player.yaw-base.yaw)>0,'right edge must turn the view to the right');
   assert(angle(turned.ray.yaw-turned.player.yaw)>0,'the right-hand reticle must point to the right in world space');
   assert(Math.abs(turned.projectionOfAim.x/turned.width-turned.handAim.x)<1e-6,'the native world ray must project back to the rendered reticle X');
   assert(Math.abs(turned.projectionOfAim.y/turned.height-turned.handAim.y)<1e-6,'the native world ray must project back to the rendered reticle Y');
   if(mode==='step'){
    assert(Math.abs(angle(turned.player.yaw-base.yaw)-Math.PI/4)<.04,'step gesture must turn exactly 45 degrees');
    await p.waitForFunction(t=>System.activeGame.logic.elapsed>=t+.65,turned.elapsed);
    assert(Math.abs(angle((await read(p)).player.yaw-turned.player.yaw))<.015,'holding one step gesture must not repeat');
   }
   await p.mouse.up();const released=await read(p);
   await p.waitForFunction(t=>System.activeGame.logic.elapsed>=t+.30,released.elapsed);
   const stopped=await read(p);assert(Math.abs(angle(stopped.player.yaw-released.player.yaw))<.02,'release must stop view rotation');
   if(stopped.handAim)assert(Math.abs(stopped.handAim.x-.5)<.02,'release must center the simulated hand');
  }else{
   await p.waitForFunction(y=>System.activeGame.logic.player.yaw>y+.1,base.yaw);
   await p.mouse.up();
  }
  report.cases.push({kind:'training-intent',mode:mode||'legacy',rightTurnsRight:true,dwell:!!mode,oneStep:mode==='step',releaseStops:true,errors:f.errors,externalBlocked:f.external});
  assert.deepEqual(f.errors,[]);
  await p.screenshot({path:out+'/training-'+(mode||'legacy')+'.png'});
  return {f,s:await read(p)};
 }catch(error){await f.c.close();throw error;}
}

function insideCover(x,z,c,pad=.65){return Math.abs(x-c.x)<c.w/2+pad&&Math.abs(z-c.z)<c.d/2+pad;}
function walkable(x,z,covers){return x>=-28&&x<=28&&z>=-8&&z<=71&&!covers.some(c=>insideCover(x,z,c));}
function rayClear(from,to,covers,eye){
 const delta=[to.x-from.x,to.y-eye,to.z-from.z],start=[from.x,eye,from.z];
 for(const c of covers){let near=.001,far=.999;
  const lo=[c.x-c.w/2,0,c.z-c.d/2],hi=[c.x+c.w/2,c.h,c.z+c.d/2];
  for(let k=0;k<3;k++){
   if(Math.abs(delta[k])<1e-9){if(start[k]<lo[k]||start[k]>hi[k]){near=2;break}}
   else {const a=(lo[k]-start[k])/delta[k],b=(hi[k]-start[k])/delta[k];near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));}
  }if(near<=far)return false;
 }return true;
}
function pathfind(from,goal,covers){
 const cell=1,encode=(x,z)=>x+','+z,point=n=>({x:n.x*cell-28,z:n.z*cell-8});
 const start={x:Math.round((from.x+28)/cell),z:Math.round((from.z+8)/cell)},end={x:Math.round((goal.x+28)/cell),z:Math.round((goal.z+8)/cell)};
 const score=n=>Math.hypot(n.x-end.x,n.z-end.z),open=[{...start,g:0,f:score(start)}],seen=new Map(),parent=new Map();seen.set(encode(start.x,start.z),0);
 let finish=null;
 for(let count=0;open.length&&count<12000;count++){
  open.sort((a,b)=>a.f-b.f);const n=open.shift(),key=encode(n.x,n.z);
  if(score(n)<=1){finish=n;break}
  for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
   const m={x:n.x+dx,z:n.z+dz},p=point(m),g=n.g+Math.hypot(dx,dz),key2=encode(m.x,m.z);
   if(!walkable(p.x,p.z,covers)||dx&&dz&&(!walkable(point({x:n.x+dx,z:n.z}).x,point({x:n.x+dx,z:n.z}).z,covers)||!walkable(point({x:n.x,z:n.z+dz}).x,point({x:n.x,z:n.z+dz}).z,covers)))continue;
   if((seen.get(key2)??Infinity)<=g)continue;seen.set(key2,g);parent.set(key2,key);open.push({...m,g,f:g+score(m)});
  }
 }
 if(!finish)throw Error('No walkable path to '+JSON.stringify(goal));
 const path=[];let key=encode(finish.x,finish.z);const first=encode(start.x,start.z);
 for(let i=0;key!==first&&i<12000;i++){const [x,z]=key.split(',').map(Number);path.push(point({x,z}));key=parent.get(key);if(!key)break}
 return path.reverse();
}
async function completeMission(f){
 const {p}=f;await chooseSettings(p);await start(p,'patrol','continuous');
 let s=await read(p);assert(s.front);assert.equal(s.settings.difficulty,'easy');assert.equal(s.settings.combatProtection,'relaxed');assert.equal(s.settings.combatRecovery,true);
 const initial={career:s.career,profile:s.profile,careerKey:s.careerKey,settings:s.settings};
 const held=new Set(),trace=[],started=Date.now(),limit=Number(process.env.WAR_FRONT_MISSION_TIMEOUT||240000);
 let reloadRequested=false,pointer=false,path=[],pathGoal='',lastMotion={at:Date.now(),x:s.player.x,z:s.player.z},victory=null,lastTrace=0;
 try{
  await neutral(p,s);await p.mouse.down();pointer=true;
  while(Date.now()-started<limit){
   s=await read(p);
   if(s.state==='VICTORY'){victory=s;break}
   if(s.state==='DEFEAT')throw Error('Native patrol ended in defeat: '+JSON.stringify({player:s.player,stats:s.stats,wave:s.wave}));
   if(s.state!=='PLAYING')throw Error('Native patrol stopped unexpectedly: '+JSON.stringify(s));
   assert(!s.covers.some(c=>insideCover(s.player.x,s.player.z,c,.34)),'the actual player must stay outside physical cover');
   if(Date.now()-lastTrace>600){lastTrace=Date.now();trace.push({ms:Date.now()-started,elapsed:s.elapsed,x:s.player.x,z:s.player.z,yaw:s.player.yaw,hp:s.player.hp,wave:s.wave,objective:s.objective,stats:s.stats,active:s.enemies.length});}
   const visible=s.enemies.filter(e=>rayClear(s.player,e,s.covers,s.eye)).sort((a,b)=>Math.hypot(a.x-s.player.x,a.z-s.player.z)-Math.hypot(b.x-s.player.x,b.z-s.player.z));
   if(visible.length){
    const target=visible[0],yaw=Math.atan2(target.x-s.player.x,target.z-s.player.z),difference=angle(yaw-s.player.yaw);
    if(Math.abs(difference)>.34){await neutral(p,s);await setKeys(p,held,[difference>0?'ArrowRight':'ArrowLeft']);}
    else if(target.screen){
     await setKeys(p,held,['Space']);
     await handPoint(p,s,Math.max(.22,Math.min(.78,target.screen.x/s.width)),Math.max(.15,Math.min(.76,target.screen.y/s.height)));
     if(s.ammo<=0&&!s.reload)await p.keyboard.press('r');
    }else await setKeys(p,held,[]);
   }else{
    await neutral(p,s);
    if(!s.enemies.length&&!reloadRequested&&s.stats.shots>0&&s.ammo<30&&!s.reload){await p.keyboard.press('r');reloadRequested=true;}
    const goal=s.enemies.length?s.enemies.reduce((a,b)=>Math.hypot(a.x-s.player.x,a.z-s.player.z)<Math.hypot(b.x-s.player.x,b.z-s.player.z)?a:b):s.goal;
    if(Math.hypot(goal.x-s.player.x,goal.z-s.player.z)<1.65)await setKeys(p,held,[]);
    else{
     const key=Math.round(goal.x)+','+Math.round(goal.z);
     if(pathGoal!==key||!path.length){path=pathfind(s.player,goal,s.covers);pathGoal=key;}
     while(path.length&&Math.hypot(path[0].x-s.player.x,path[0].z-s.player.z)<.8)path.shift();
     const target=path[0]||goal,dx=target.x-s.player.x,dz=target.z-s.player.z;
     const localX=Math.cos(s.player.yaw)*dx-Math.sin(s.player.yaw)*dz,localZ=Math.sin(s.player.yaw)*dx+Math.cos(s.player.yaw)*dz,next=[];
     if(Math.abs(localX)>.17)next.push(localX>0?'d':'a');if(Math.abs(localZ)>.17)next.push(localZ>0?'w':'s');await setKeys(p,held,next);
     if(Math.hypot(s.player.x-lastMotion.x,s.player.z-lastMotion.z)>.4)lastMotion={at:Date.now(),x:s.player.x,z:s.player.z};
     else if(Date.now()-lastMotion.at>3500){path=[];pathGoal='';lastMotion={at:Date.now(),x:s.player.x,z:s.player.z};}
    }
   }
   await delay(70);
  }
  assert(victory,'native patrol did not complete before the wall-clock limit');
  await setKeys(p,held,[]);if(pointer){await p.mouse.up();pointer=false}
  assert.equal(victory.objective.secured,2);assert.equal(victory.stats.kills,7);assert(victory.stats.hits>=21);assert(victory.stats.shots>=victory.stats.hits);assert.equal(victory.stats.missions,1);assert(victory.stats.reloads>=1,'the patrol must also complete one native reload');
  assert.equal(victory.career.wins,(Number(initial.career.wins)||0)+1);
  await p.locator('#screen-over:not(.hidden)').waitFor();assert.match(await p.locator('#result-header').innerText(),/MISSÃO CONCLUÍDA/);
  const after=await read(p);await p.screenshot({path:out+'/patrol-native-victory.png'});
  await p.waitForTimeout(600);assert.deepEqual((await read(p)).profile,after.profile,'completed result must not pay repeatedly');
  const saved=await p.evaluate(key=>({career:localStorage.getItem(key),solo:localStorage.getItem('thia:solo:v1:ar_truck_sim')}),initial.careerKey);
  await p.reload({waitUntil:'domcontentloaded'});await p.locator('[data-solo-start]').click();await p.waitForFunction(()=>window.ConsolePractice?.active);
  const restored=await p.evaluate(key=>({career:localStorage.getItem(key),profile:{xp:Profile.xp,coins:Profile.coins,level:Profile.level},solo:localStorage.getItem('thia:solo:v1:ar_truck_sim')}),initial.careerKey);
  assert.equal(restored.career,saved.career);assert.deepEqual(restored.profile,after.profile,'reloading a completed guest mission must preserve progress without paying it again');
  assert.deepEqual(f.errors,[]);
  const result={kind:'full-native-patrol',passed:true,wallMs:Date.now()-started,initial,victory,after,restored,trace,actualInput:['native solo/phase/settings UI','keyboard WASD and arrows','pointer position while held','Space and reload'],errors:f.errors,externalBlocked:f.external};
  fs.writeFileSync(out+'/mission.json',JSON.stringify(result,null,2));report.cases.push(result);
 }catch(error){
  fs.writeFileSync(out+'/mission-failure.json',JSON.stringify({error:error.stack,initial,last:await read(p).catch(()=>null),trace,errors:f.errors},null,2));throw error;
 }finally{await setKeys(p,held,[]).catch(()=>{});if(pointer)await p.mouse.up().catch(()=>{});}
}

try{
 const baseline=await trainingCase(null);await baseline.f.c.close();
 const step=await trainingCase('step');await step.f.c.close();
 const continuous=await trainingCase('continuous');
 await completeMission(continuous.f);await continuous.f.c.close();
 report.passed=true;fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));
 console.log('PASS native WAR default preservation, continuous and single 45° intent, complete guest patrol, native victory and one persisted reward');
}catch(error){
 report.failure=error.stack;report.passed=false;
 if(currentPage&&!currentPage.isClosed()){report.last=await read(currentPage).catch(()=>null);await currentPage.screenshot({path:out+'/failure.png'}).catch(()=>{});}
 fs.writeFileSync(out+'/failure.json',JSON.stringify(report,null,2));throw error;
}finally{await browser.close();await server.close();}

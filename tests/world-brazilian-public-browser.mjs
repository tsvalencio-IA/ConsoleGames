/* Public release canary: actual delivered bytes and mobile touch UI.
 * Uses a disposable local profile; third-party account/database requests stop
 * before leaving the browser. No real multiplayer or Android install claimed. */
import {chromium} from 'playwright';import fs from 'node:fs';import assert from 'node:assert/strict';
import {browserNetwork,browserContextNetwork} from './helpers/browser-network.mjs';
const BASE=process.env.WORLD_PUBLIC_QA_URL||'https://otthi-world-campanha-teste.vercel.app/games/otthi/',out='test-results/frota-public';fs.mkdirSync(out,{recursive:true});
const expected=JSON.parse(fs.readFileSync('games/otthi/release-manifest.json')),apk=JSON.parse(fs.readFileSync('arcade/downloads/release-ot.json'));
const browser=await chromium.launch({headless:true,...browserNetwork(BASE),args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--ignore-certificate-errors']});
try{
 const c=await browser.newContext({...browserContextNetwork(BASE),serviceWorkers:'block',viewport:{width:844,height:390},isMobile:true,hasTouch:true});await c.route(/^https?:\/\//,r=>new URL(r.request().url()).origin===new URL(BASE).origin?r.continue():r.abort());
 await c.addInitScript(()=>localStorage.setItem('otthos_life_world_roleplay_v700',JSON.stringify({version:705,profile:{name:'QA Frota Pública',nameConfirmed:true,playerId:'brazil-fleet-qa'},avatar:{bodyStyle:'family-thiago'},flags:{accountPromptedV635:true},settings:{quality:'low',sound:false},guardian:{sessionLimitMinutes:0},vehicles:{owned:['garage-orange','br-s10','adventure-black','br-fusca'],garage:{slots:{'1':'garage-orange'},stored:{'br-s10':true,'adventure-black':true,'br-fusca':true}}},familyAdventure:{party:{controller:'thiago',members:['thiago','thamis','luna','liz']},deliveries:{luna:2,liz:3}}})));
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.stack));p.setDefaultTimeout(45000);await p.goto(BASE,{waitUntil:'domcontentloaded'});
 const delivery=await p.evaluate(async({base,expected,apk})=>{
  const digest=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');
  const release=await(await fetch(new URL('release-manifest.json?verify='+expected.revision,base),{cache:'no-store'})).json();
  const files=await Promise.all(Object.entries(expected.files).map(async([path,sha256])=>{const u=new URL(path,base);u.searchParams.set('verify',expected.revision);const r=await fetch(u,{cache:'no-store'}),b=await r.arrayBuffer();return{path,status:r.status,bytes:b.byteLength,expected:sha256,actual:await digest(b)};}));
  const r=await fetch(new URL('/android/'+apk.file,base),{cache:'no-store'}),b=await r.arrayBuffer();return{release,files,apk:{status:r.status,bytes:b.byteLength,sha256:await digest(b),contentType:r.headers.get('content-type'),disposition:r.headers.get('content-disposition')}};
 },{base:BASE,expected,apk});
 assert.equal(delivery.release.build,expected.build);assert.equal(delivery.release.revision,expected.revision);for(const f of delivery.files){assert.equal(f.status,200,f.path);assert.equal(f.actual,f.expected,f.path);}assert.equal(delivery.apk.bytes,apk.bytes);assert.equal(delivery.apk.sha256,apk.sha256);assert.match(delivery.apk.disposition,/attachment/);
 await p.locator('#playBtn').tap();await p.waitForFunction(()=>window.OTTHI_BRAZIL_FLEET?.diagnostics().ready&&window.OTTHI_FAMILY?.diagnostics().ready,null,{timeout:90000});
 const initial=await p.evaluate(()=>window.OTTHI_BRAZIL_FLEET.diagnostics());assert.equal(initial.catalog.length,44);assert(initial.cars.every(v=>v.rendered&&v.legacyVisible===0));assert.equal(initial.cars.find(v=>v.id==='city-aurora-coupe-0').model,'fusca');
 const cases=[];
 for(const[id,model]of[['br-s10','s10'],['adventure-black','amarok'],['br-fusca','fusca']]){
  await p.evaluate(g=>window.OTTHOS_TEST_API.teleport(g.x+9,g.z),initial.garage);await p.waitForFunction(()=>window.OTTHOS_TEST_API.getContext()?.id==='player-home-garage');await p.locator('#actionBtn').tap();await p.locator('[data-garage-place="'+id+'"]').tap();await p.locator('#modalClose').tap();await p.waitForFunction(()=>document.getElementById('modal').hidden);
  const car=await p.evaluate(id=>window.OTTHI_BRAZIL_FLEET.diagnostics().cars.find(v=>v.id===id),id);await p.evaluate(({a,g})=>{const dx=a.x-g.x-5.4,dz=a.z-g.z,n=Math.hypot(dx,dz)||1;window.OTTHOS_TEST_API.teleport(a.x+dx/n*2.3,a.z+dz/n*2.3);},{a:car,g:initial.garage});await p.waitForFunction(id=>window.OTTHOS_TEST_API.getContext()?.id==='vehicle-'+id,id);await p.locator('#actionBtn').tap();await p.waitForFunction(()=>window.OTTHOS_TEST_API.vehicle().active&&window.OTTHI_FAMILY.diagnostics().seated.length===4);
  const d=await p.evaluate(()=>({active:window.OTTHI_BRAZIL_FLEET.diagnostics().active,seated:window.OTTHI_FAMILY.diagnostics().seated}));assert.equal(d.active.model,model);assert.equal(d.seated.length,4);assert(d.seated.every(a=>a.visible));cases.push({id,model,seated:4});await p.locator('#actionBtn').tap();await p.waitForFunction(()=>!window.OTTHOS_TEST_API.vehicle().active);
 }
 const road=await p.evaluate(()=>window.OTTHI_ROAD_CONTINUITY.driveAudit());assert(road.passed,JSON.stringify(road));assert.deepEqual(errors,[]);
 const result={passed:true,base:BASE,build:expected.build,revision:expected.revision,protectedFiles:delivery.files.length,apk:delivery.apk,cases,road,errors,limits:['Chromium mobile emulation; no physical Android installation or two-device online session.']};fs.writeFileSync(out+'/result.json',JSON.stringify(result,null,2));fs.writeFileSync(out+'/hashes.json',JSON.stringify(delivery.files,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}

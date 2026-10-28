import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import crypto from 'node:crypto';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('all active recording clips retain source, license, edit bounds and identical seven-game bytes',()=>{
 const manifest=JSON.parse(fs.readFileSync('games/otthi/audio/engine-recordings.json'));assert.equal(manifest.kind,'real-recordings');assert.equal(manifest.assets.length,33);
 for(const a of manifest.assets){assert(['CC0-1.0','CC-BY-4.0'].includes(a.license));assert.match(a.source,/^https:\/\/(bigsoundbank\.com|freesound\.org)\//);assert(a.author&&a.sourceEnd>a.sourceStart&&a.duration>1);assert.match(a.sourceSHA256,/^[a-f0-9]{64}$/);const bytes=fs.readFileSync('games/otthi/audio/'+a.file);assert.equal(hash(bytes),a.sha256);for(const game of ['kart','boxe','tenis','ar','voo','familia/3d'])assert(fs.readFileSync('games/'+game+'/audio/'+a.file).equals(bytes),game+' '+a.file);}
});
test('the world loads the recording bank before its civilian adapter and no longer synthesizes ignition pulses',()=>{
 const html=fs.readFileSync('games/otthi/index.html','utf8'),adapter=fs.readFileSync('games/otthi/assets/js/vehicles/engine-sound.js','utf8');assert(html.indexOf('./recorded-audio.js')<html.indexOf('./assets/js/vehicles/engine-sound.js'));assert.match(html,/recorded-audio\.js[^>]*data-civilian="true"/);assert(!adapter.includes('createBufferSource')&&!adapter.includes('Math.sin(')&&!adapter.includes('function wave('));assert.match(adapter,/previous\.vehicleVoice/);
});
test('template preparation reuses the complete original mesh without altering clones or their materials',()=>{
 const c=vm.createContext({window:{},console});vm.runInContext(fs.readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),c);c.window.THREE=c.THREE;
 for(const name of ['brazilian-body-details','brazilian-expansion','brazilian-models']){const path='games/otthi/assets/js/vehicles/'+name+'.js';if(fs.existsSync(path))vm.runInContext(fs.readFileSync(path,'utf8'),c);}
 const result=vm.runInContext(`const api=window.OTBrazilVehicles,a=api.create(THREE,'fusca',0x2788d2);let before=[];a.traverse(o=>{if(o.isMesh)before.push(o.geometry)});api.prepare(THREE,'fusca');const b=api.create(THREE,'fusca',0xff0000);let after=[];b.traverse(o=>{if(o.isMesh)after.push(o.geometry)});({same:before.length===after.length&&before.every((g,i)=>g===after[i]),vertices:before.reduce((n,g)=>n+g.attributes.position.count,0),independent:a!==b,paint:a.getObjectByName('paint').material!==b.getObjectByName('paint').material})`,c);assert(result.same&&result.independent&&result.paint);assert(result.vertices>1000);
});

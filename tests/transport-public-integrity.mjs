/* Check the bytes actually served by the canonical alias, including console
 * caches outside the world's release manifest. Read-only, no account requests. */
import {request} from 'playwright';import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {browserNetwork,browserContextNetwork} from './helpers/browser-network.mjs';
const base=process.env.TRANSPORT_QA_PUBLIC||'https://otthi-world-campanha-teste.vercel.app/';
const api=await request.newContext({...browserNetwork(base),...browserContextNetwork(base),timeout:30000});
const paths=['games/kart/js/game_kart.js','games/voo/js/game_flight.js'];for(const game of ['kart','boxe','tenis','ar','voo','otthi','familia/3d'])for(const file of ['index.html','sw.js','recorded-audio.js','audio/engine-car.ogg','audio/sources.json'])paths.push('games/'+game+'/'+file);
const results=[],hash=b=>crypto.createHash('sha256').update(b).digest('hex');
try{
 for(let i=0;i<paths.length;i+=5){const group=await Promise.all(paths.slice(i,i+5).map(async path=>{const response=await api.get(new URL(path,base).href);assert.equal(response.status(),200,path);const bytes=await response.body(),sha=hash(bytes);assert.equal(sha,hash(fs.readFileSync(path)),path+' differs from verified source');return{path,bytes:bytes.length,sha256:sha};}));results.push(...group);}
 const version=await (await api.get(new URL('games/otthi/VERSION.json',base).href)).json();assert.equal(version.build,JSON.parse(fs.readFileSync('games/otthi/VERSION.json')).build);
 const out={passed:true,base,build:version.build,checkedAt:new Date().toISOString(),resources:results};fs.mkdirSync('test-results/transport-public',{recursive:true});fs.writeFileSync('test-results/transport-public/result.json',JSON.stringify(out,null,2));console.log(JSON.stringify({passed:true,build:version.build,resources:results.length}));
}finally{await api.dispose();}

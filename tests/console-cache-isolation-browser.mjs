/* Real Chromium caches for a domain root and repository mount on one origin. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve, extname} from 'node:path';
import {chromium} from 'playwright';

const mounts=['', '/ConsoleGames'];
const root=resolve('.');
const types={'.js':'application/javascript','.html':'text/html','.webmanifest':'application/manifest+json','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
const scopes=['/','/arcade/','/games/voo/','/games/familia/3d/'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const routerVersion='20261120';
let networkAvailable=true;
const server=createServer((request,response)=>{
  if(!networkAvailable){request.socket.destroy();return;}
  const url=new URL(request.url,'http://localhost');
  let path=url.pathname.replace(/^\/ConsoleGames(?=\/)/,'');
  if(path.endsWith('/probe.html')){
    const prefix=url.pathname.startsWith('/ConsoleGames/')?'/ConsoleGames':'';
    response.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
    return response.end(`<link rel="manifest" href="${prefix}/arcade/manifest.webmanifest"><meta charset="utf-8"><p>Worker probe</p>`);
  }
  if(path.endsWith('/'))path+='index.html';
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/'))return response.writeHead(403).end();
  try{
    const body=readFileSync(file);
    response.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    response.end(body);
  }catch{response.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-gpu']});
const result={passed:false,origin,mounts:[],limits:['Actual local Chromium service workers and cache storage. Probe pages avoid loading game engines.','The browser reports each computed app ID. Physical Android installation was not run.']};
const out='test-results/console-cache-isolation';
mkdirSync(out,{recursive:true});
try{
  const context=await browser.newContext(),pages=[];
  for(const mount of mounts){
    const entries=[];
    for(const scope of scopes){
      const path=mount+scope;
      const page=await context.newPage();
      await page.goto(origin+path+'probe.html');
      await page.evaluate(()=>navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}));
      await page.waitForFunction(path=>navigator.serviceWorker.controller?.scriptURL.endsWith(path+'sw.js'),path);
      entries.push({page,path});
      pages.push({page,path,mount});
    }
    const cdp=await context.newCDPSession(entries[1].page);
    const parsed=await cdp.send('Page.getAppManifest');
    const id=await cdp.send('Page.getAppId');
    result.cdp={id,parsed:{url:parsed.url,manifest:parsed.manifest,parsed:parsed.parsed}};
    assert.deepEqual(parsed.errors,[]);
    const appId=id.appId||parsed.manifest.id;
    assert.equal(appId,origin+mount+'/arcade/');
    assert.equal(parsed.manifest.startUrl,origin+mount+'/arcade/');
    assert.equal(parsed.manifest.scope,origin+mount+'/');
    result.mounts.push({mount:mount||'/',appId,start:parsed.manifest.startUrl,scope:parsed.manifest.scope});
  }
  const keys=await pages[0].page.evaluate(()=>caches.keys());
  for(const {path} of pages)assert(keys.some(key=>key.endsWith('@'+encodeURIComponent(path))),path);
  result.cacheNames=keys;

  networkAvailable=false;
  await context.setOffline(true);
  for(const {page,path,mount} of pages){
    const router=mount+'/arcade/canonical-navigation.js';
    const requests=await page.evaluate(async ({router,version})=>{
      async function fetchResult(url) {
        try{const response=await fetch(url);return{status:response.status,body:await response.text()};}
        catch{return null;}
      }
      return {
        current:await fetchResult(router+'?v='+version),
        unknownVersion:await fetchResult(router+'?v=unknown'),
        unrelated:await fetchResult('/another-game/index.html')
      };
    },{router,version:routerVersion});
    assert.equal(requests.current?.status,200,path);
    assert.equal(sha(requests.current.body),sha(readFileSync('arcade/canonical-navigation.js')),path);
    assert.equal(requests.unknownVersion,null,path);
    assert.equal(requests.unrelated,null,path);
  }
  // With no worker for this destination, the old broad root fallback would
  // silently serve its cached console HTML instead of showing an offline error.
  result.unavailableNavigations=[];
  for(const destination of ['/games/uncached/','/arcade/instalar/','/games/voo/unknown/']){
    const page=await context.newPage();
    const response=await page.goto(origin+destination).then(value=>({status:value?.status()}),error=>({error:error.message.split('\n')[0]}));
    assert(response.error||!response.status||response.status>=400,JSON.stringify({destination,...response}));
    result.unavailableNavigations.push({destination,...response});
    await page.close();
  }
  result.passed=true;
  result.offline='Exact router available from both mounts and four worker scopes. Unknown versions, destinations and installer retain their own failures.';
  console.log('PASS scoped worker caches, exact offline router, preserved PWA IDs at both mounts');
}catch(error){result.error=error.stack;throw error;}
finally{
  writeFileSync(out+'/result.json',JSON.stringify(result,null,2));
  await browser.close();
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
}

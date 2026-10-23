/* Validate delivery with an actual user gesture and saved bytes, including a
 * previously installed Arcade worker. Does not simulate package installation. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {browserNetwork,browserContextNetwork} from './helpers/browser-network.mjs';

const root=path.resolve('dist-world');
const release=JSON.parse(fs.readFileSync('arcade/downloads/release-ot.json'));
const output='test-results/android-download';fs.mkdirSync(output,{recursive:true});
const config=JSON.parse(fs.readFileSync('vercel.json'));
let server;
let base=process.env.DOWNLOAD_QA_URL;
if(!base){
  // The previous worker had a navigation fallback for every /arcade/ URL,
  // including APKs. Retain that behavior to exercise already installed clients.
  const legacyWorker=`self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(u.origin!==self.location.origin||!u.pathname.startsWith('/arcade/'))return;event.respondWith(fetch(event.request).catch(()=>new Response('<!doctype html><title>Cached console</title>',{headers:{'Content-Type':'text/html'}})));});`;
  server=http.createServer((request,response)=>{
    const url=new URL(request.url,'http://localhost');
    if(url.pathname==='/arcade/qa-legacy-worker.js'){
      response.writeHead(200,{'Content-Type':'application/javascript'});response.end(legacyWorker);return;
    }
    const rewrite=config.rewrites.find(rule=>rule.source===url.pathname);
    let filename=path.resolve(root,'.'+(rewrite?.destination||url.pathname));
    if(!filename.startsWith(root+path.sep)){response.writeHead(403);response.end();return;}
    if(fs.existsSync(filename)&&fs.statSync(filename).isDirectory())filename=path.join(filename,'index.html');
    if(!fs.existsSync(filename)){response.writeHead(404);response.end();return;}
    const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.apk':'application/vnd.android.package-archive'};
    const headers={'Content-Type':types[path.extname(filename)]||'application/octet-stream'};
    for(const rule of config.headers)if(rule.source===url.pathname)for(const header of rule.headers)headers[header.key]=header.value;
    response.writeHead(200,headers);fs.createReadStream(filename).pipe(response);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base='http://127.0.0.1:'+server.address().port+'/arcade/instalar/';
}
const origin=new URL(base).origin;
const browser=await chromium.launch({...browserNetwork(base),headless:true,args:[...(browserNetwork(base).proxy?['--ignore-certificate-errors']:[]),'--no-sandbox','--disable-dev-shm-usage']});
const results=[];
try{
  for(const spec of [
    {name:'android-portrait',mobile:true,width:393,height:852},
    {name:'android-landscape',mobile:true,width:852,height:393},
    {name:'desktop',width:1280,height:800},
    {name:'without-javascript',mobile:true,width:393,height:852,noJS:true},
    {name:'current-worker',mobile:true,width:393,height:852,worker:true},
    ...(!process.env.DOWNLOAD_QA_URL?[{name:'previous-worker',mobile:true,width:393,height:852,legacy:true}]:[])
  ]){
    const context=await browser.newContext({...browserContextNetwork(base),viewport:{width:spec.width,height:spec.height},isMobile:!!spec.mobile,hasTouch:!!spec.mobile,javaScriptEnabled:!spec.noJS,acceptDownloads:true,...(spec.mobile?{userAgent:'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'}:{})});
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    try{
      const response=await page.goto(base,{waitUntil:'networkidle'});assert.equal(response.status(),200);
      if(spec.legacy||spec.worker){
        await page.evaluate(async legacy=>{await navigator.serviceWorker.register(legacy?'../qa-legacy-worker.js':'../sw.js',{scope:'/arcade/'});await navigator.serviceWorker.ready;},!!spec.legacy);
        await page.reload({waitUntil:'networkidle'});
        assert.match(await page.evaluate(()=>navigator.serviceWorker.controller?.scriptURL||''),spec.legacy?/qa-legacy-worker\.js$/:/\/arcade\/sw\.js$/);
      }
      assert.equal(await page.locator('#release-version').textContent(),release.version);
      assert.equal(new URL(await page.locator('#download-apk').getAttribute('href'),base).pathname,'/android/'+release.file);
      assert((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=1);
      if(!spec.noJS&&spec.mobile&&base.startsWith('https:')){
        assert(await page.locator('#open-chrome').isVisible());
        const intent=await page.locator('#open-chrome').getAttribute('href');
        assert(intent.includes('package=com.android.chrome;'));
        assert(intent.includes(encodeURIComponent(new URL('#ajuda-download',base).href)));
      }
      await page.screenshot({path:output+'/'+spec.name+'.png',fullPage:true,scale:'css'});
      const pending=page.waitForEvent('download');
      if(spec.mobile)await page.locator('#download-apk').tap();else await page.locator('#download-apk').click();
      const download=await pending;assert.equal(await download.failure(),null);assert.equal(download.suggestedFilename(),release.file);
      const filename=output+'/'+spec.name+'.apk';await download.saveAs(filename);
      const bytes=fs.readFileSync(filename);assert.equal(bytes.length,release.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),release.sha256);
      assert.equal(new URL(page.url()).pathname,'/arcade/instalar/','the installation page must remain available after downloading');
      assert.deepEqual(errors,[]);
      results.push({case:spec.name,gesture:spec.mobile?'touch':'click',bytes:bytes.length,sha256:release.sha256,passed:true});
      console.log('PASS download',spec.name);
    }finally{await context.close();}
  }
  // The console entry must navigate to HTML, rather than directly to a binary.
  const context=await browser.newContext({...browserContextNetwork(base)}),page=await context.newPage();
  await page.goto(origin+'/arcade/',{waitUntil:'domcontentloaded'});
  await page.locator('#android-apk-link').click();await page.waitForURL('**/arcade/instalar/');
  await page.locator('#download-apk').waitFor();await context.close();
  fs.writeFileSync(output+'/result.json',JSON.stringify({passed:true,base,consoleEntry:true,results,limits:['Mobile Chromium emulation; the user phone and its in-app browser were not directly inspected.']},null,2));
  console.log('PASS console installation entry');
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}

import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=process.env.CONSOLE_TEST_ORIGIN||'http://127.0.0.1:4173';
const expectedOrigin=new URL(origin).origin;
const paths=['/arcade/','/games/otthi/','/games/kart/','/games/tenis/','/games/boxe/','/games/ar/','/games/voo/','/games/danca/','/games/familia/3d/'];
const browser=await chromium.launch({headless:true,args:['--disable-gpu','--use-angle=swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:393,height:852},serviceWorkers:'block'});
 await context.route(/https?:\/\//,route=>{
  if(new URL(route.request().url()).origin===expectedOrigin)return route.continue();
  return route.abort();
 });
 for(const path of paths){
  const page=await context.newPage();
  try{
   const response=await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:45000});
   assert.equal(response.status(),200,path);
   await page.waitForFunction(()=>Boolean(window.OTTHI_CANONICAL?.consoleUrl),null,{timeout:30000});
   const state=await page.evaluate(()=>({
    manifest:document.querySelector('link[rel="manifest"]')?.href,
    consoleUrl:window.OTTHI_CANONICAL.consoleUrl
   }));
   assert.equal(new URL(state.manifest).pathname,'/arcade/manifest.webmanifest',path);
   assert.equal(state.consoleUrl,origin+'/arcade/',path);
   const corrected=await page.evaluate(async()=>{
    const a=document.createElement('a');
    a.href='https://otthi-world-campanha-teste.vercel.app/ConsoleGames/arcade/';
    document.body.appendChild(a);
    for(let i=0;i<50&&a.href!==location.origin+'/arcade/';i++)await new Promise(ok=>setTimeout(ok,20));
    return a.href;
   });
   assert.equal(corrected,origin+'/arcade/',path);
   console.log('CANONICAL OK',path);
  }finally{await page.close();}
 }
 await context.close();
}finally{await browser.close();}

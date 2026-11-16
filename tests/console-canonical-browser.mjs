import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const origin=process.env.CONSOLE_TEST_ORIGIN||'http://127.0.0.1:4173';
const paths=['/arcade/','/games/otthi/','/games/kart/','/games/tenis/','/games/boxe/','/games/ar/','/games/voo/','/games/danca/','/games/familia/3d/'];
const browser=await chromium.launch({headless:true,args:['--disable-gpu','--use-gl=angle','--use-angle=swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:393,height:852},serviceWorkers:'block',permissions:[]});
 await context.route(/https?:\/\//,route=>{
  const host=new URL(route.request().url).host;
  if(host==='127.0.0.1:4173')return route.continue();
  return route.abort();
 });
 for(const path of paths){
  const page=await context.newPage();
  try{
   const response=await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:45000});
   assert.equal(response.status(),200,path);
   await page.waitForFunction(()=>Boolean(window.OTTHI_CANONICAL?.consoleUrl),null,{timeout:30000});
   const initial=await page.evaluate(()=>{
    const manifest=document.querySelector('link[rel="manifest"]');
    return {href:manifest?.href,consoleUrl:window.OTTHI_CANONICAL.consoleUrl};
   });
   assert.equal(new URL(initial.href).pathname,'/arcade/manifest.webmanifest',path);
   assert.equal(initial.consoleUrl,origin+'/arcade/',path);
   const redirected=await page.evaluate(async()=>{
    const link=document.createElement('a');link.href='https://otthi-world-campanha¶»§q«^
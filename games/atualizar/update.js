/* Runs outside /games/otthi/: an old game worker cannot serve its own old index here. */
(()=>{'use strict';
 const world=new URL('../otthi/',location.href),status=document.getElementById('status'),progress=document.getElementById('progress'),version=document.getElementById('version'),retry=document.getElementById('retry'),back=document.getElementById('back');
 let running=false,expected=null,workerError='';
 const state=window.OTTHI_UPDATE_STATE={phase:'checking',build:'',revision:'',done:0,total:0,reused:0};
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 async function fresh(path){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);try{const url=new URL(path,world);url.searchParams.set('otthi_probe',String(Date.now()));const response=await fetch(url,{cache:'no-store',credentials:'same-origin',signal:controller.signal});if(!response.ok)throw Error('HTTP '+response.status);return response;}finally{clearTimeout(timer);}}
 async function release(){const data=await(await fresh('release-manifest.json')).json();if(!data.build||!data.revision||data.algorithm!=='SHA-256'||!/^[a-f0-9]{64}$/.test(data.files?.['index.html']||''))throw Error('Invalid release');return data;}
 async function workerRelease(worker){if(!worker)return null;return new Promise(resolve=>{const channel=new MessageChannel(),done=value=>{clearTimeout(timer);channel.port1.close();resolve(value);},timer=setTimeout(()=>done(null),700);channel.port1.onmessage=e=>done(¶»§q«^
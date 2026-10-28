/* Runs outside /games/otthi/: an old game worker cannot serve its own old index here. */
(()=>{'use strict';
 const world=new URL('../otthi/',location.href),status=document.getElementById('status'),progress=document.getElementById('progress'),version=document.getElementById('version'),retry=document.getElementById('retry'),back=document.getElementById('back');
 let running=false,expected=null,workerError='';
 const state=window.OTTHI_UPDATE_STATE={phase:'checking',build:'',revision:'',done:0,total:0,reused:0};
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 async function fresh(path){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);try{const url=new URL(path,world);url.searchParams.set('otthi_probe',String(Date.now()));const response=await fetch(url,{cache:'no-store',credentials:'same-origin',signal:controller.signal});if(!response.ok)throw Error('HTTP '+response.status);return response;}finally{clearTimeout(timer);}}
 async function release(){const data=await(await fresh('release-manifest.json')).json();if(!data.build||!data.revision||data.algorithm!=='SHA-256'||!/^[a-f0-9]{64}$/.test(data.files?.['index.html']||''))throw Error('Invalid release');return data;}
 async function workerRelease(worker){if(!worker)return null;return new Promise(resolve=>{const channel=new MessageChannel(),done=value=>{clearTimeout(timer);channel.port1.close();resolve(value);},timer=setTimeout(()=>done(null),700);channel.port1.onmessage=e=>done(e.data);try{worker.postMessage({type:'OTTHI_GET_RELEASE'},[channel.port2]);}catch{done(null);}});}
 navigator.serviceWorker?.addEventListener('message',event=>{const data=event.data;let trusted=false;try{trusted=new URL(event.source.scriptURL).pathname===new URL('sw.js',world).pathname;}catch{}if(!trusted||data?.type!=='OTTHI_UPDATE_PROGRESS'||data.revision!==expected?.revision||state.phase!=='installing'||workerError)return;Object.assign(state,{done:data.done,total:data.total,reused:data.reused});if(data.error){workerError=data.error;return;}progress.value=8+80*(data.done/Math.max(1,data.total));status.textContent='Preparando a versão atual… '+Math.round(data.done/Math.max(1,data.total)*100)+'%';});
 async function run(){
  if(running)return;running=true;workerError='';retry.hidden=back.hidden=true;document.getElementById('title').textContent='Atualizando seu mundo';status.textContent='Conferindo a versão disponível…';progress.value=4;state.phase='checking';state.error='';
  try{
   expected=await release();Object.assign(state,{build:expected.build,revision:expected.revision});version.textContent='Versão '+expected.build;state.phase='installing';
   if('serviceWorker' in navigator){
    const registration=await navigator.serviceWorker.register(new URL('sw.js',world),{scope:world.href,updateViaCache:'none'});await registration.update().catch(()=>{});
    const deadline=Date.now()+150000;let ready=false;
    while(Date.now()<deadline){
     if(workerError)throw Error(workerError);
     registration.waiting?.postMessage({type:'SKIP_WAITING'});
     if(registration.active?.state==='activated'){const active=await workerRelease(registration.active);if(active?.build===expected.build&&active?.revision===expected.revision){ready=true;break;}}
     await delay(200);
    }
    if(!ready)throw Error('Update timeout');
   }
   state.phase='verifying';status.textContent='Confirmando a abertura da versão atual…';progress.value=92;
   const index=await fresh('index.html'),bytes=await index.arrayBuffer(),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');if(hash!==expected.files['index.html'])throw Error('Page/release mismatch');
   try{sessionStorage.setItem('otthi:last-recovery',JSON.stringify({build:expected.build,revision:expected.revision,at:Date.now(),reused:state.reused,done:state.done,total:state.total}));}catch{}
   progress.value=100;state.phase='ready';status.textContent='Versão atual confirmada. Abrindo seu mundo…';const target=new URL(world);target.searchParams.set('otthi_update',expected.revision);target.searchParams.set('otthi_probe',String(Date.now()));location.replace(target.href);
  }catch(error){state.phase='error';progress.value=0;state.error=String(error?.message||error);document.getElementById('title').textContent='Vamos tentar novamente';status.textContent=navigator.onLine?'Não foi possível concluir a atualização. Seu jogo anterior e seus dados foram preservados.':'Conecte-se à internet para baixar a atualização. Seus dados continuam neste aparelho.';retry.hidden=back.hidden=false;console.warn('[OTTHI UPDATE]',error?.message||error);}
  finally{running=false;}
 }
 retry.onclick=run;window.addEventListener('online',()=>{if(state.phase==='error')run();});run();
})();

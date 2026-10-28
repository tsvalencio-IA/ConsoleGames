/* Refresh the console shell without touching game saves or account storage. */
(()=>{'use strict';
 const state={registration:null,pending:false,checking:false,reloading:false,lastCheck:0,lastError:''};
 let allowed=()=>!document.getElementById('profile-dialog')?.open;
 function apply(){
  if(!state.pending||state.reloading||document.visibilityState==='hidden'||!navigator.onLine||!allowed())return false;
  state.reloading=true;location.reload();return true;
 }
 async function check(force=false){
  if(!state.registration||state.checking||!navigator.onLine||document.visibilityState==='hidden')return false;
  if(!force&&Date.now()-state.lastCheck<15000)return false;
  state.checking=true;state.lastCheck=Date.now();
  try{await state.registration.update();state.lastError='';apply();return true;}
  catch{state.lastError='A atualização será conferida quando a conexão voltar.';return false;}
  finally{state.checking=false;}
 }
 let controlled=!!navigator.serviceWorker?.controller;
 navigator.serviceWorker?.addEventListener('controllerchange',()=>{if(!controlled){controlled=true;return;}state.pending=true;apply();});
 window.addEventListener('online',()=>check(true));
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){apply();check(true);}});
 window.addEventListener('otthi:app-resume',()=>{apply();check(true);});
 document.addEventListener('close',apply,true);
 setInterval(()=>{apply();check();},60000);
 window.OT_ARCADE_UPDATES=Object.freeze({
  attach(registration,options={}){state.registration=registration;if(options.canReload)allowed=options.canReload;return check(true);},
  check:()=>check(true),diagnostics:()=>({registered:!!state.registration,pending:state.pending,checking:state.checking,lastCheck:state.lastCheck,error:state.lastError})
 });
})();

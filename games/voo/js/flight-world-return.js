/* Preserve the same-origin Academy return without new app identities. */
(()=>{'use strict';
 const qs=new URLSearchParams(location.search),token=qs.get('otVenue');
 if(qs.get('venuePage')!=='1'||!token||token.length>100)return;
 const trip=window.WorldVenueTrip?.current(token,'usarmy_flight_sim');
 const href=trip&&window.WorldVenueTrip.returnUrl(token);if(!href)return;
 const style=document.createElement('style');
 style.textContent='.flight-return-world{position:fixed;z-index:100000;top:max(10px,env(safe-area-inset-top));right:max(10px,env(safe-area-inset-right));padding:10px 14px;background:#092633;color:#e4fbf3;border:1px solid #80e2d8;border-radius:12px;font:700 13px system-ui;text-decoration:none}.flight-return-world:focus-visible{outline:3px solid #fff}';
 document.head.append(style);
 const button=document.createElement('a');button.className='flight-return-world';button.textContent='↩ VOLTAR AO OTTHI';button.href=href;document.body.append(button);
 const original=window.System?.gameOver;
 if(typeof original==='function'&&!window.System.__academyBridge){
  window.System.__academyBridge=true;
  window.System.gameOver=function(score,won,coins){
   if(Number.isFinite(score)&&typeof won==='boolean')window.WorldVenueTrip?.result(token,'usarmy_flight_sim',score,won);
   return original.apply(this,arguments);
  };
 }
})();
/* thIAguinho HQ 3D: automatic pixel resolution scaling for sustained frame rate.
   Only adjusts DPR, never changes meshes, physics, movement or quests.
   Fast devices keep full 1.0; slower mobile hardware scales from 1.0 to 0.70. */
(()=>{
"use strict";
if(window.CONSOLE_WORLD!=="familia")return;
let scale=1,windowStart=0,frames=0,lastChange=0;
window.__HQ_RENDER_SCALE=1;
function frame(ts){
 if(document.hidden){windowStart=ts;frames=0;requestAnimationFrame(frame);return}
 if(!windowStart)windowStart=ts;
 frames++;
 const elapsed=ts-windowStart;
 if(elapsed>=3600){
   const fps=1000*frames/Math.max(1,elapsed);
   if(fps<39 && ts-lastChange>4000 && scale>.70){
     scale=Math.max(.70,Math.round((scale-.11)*100)/100);lastChange=ts;
   }else if(fps>55 && ts-lastChange>9500 && scale<1){
     scale=Math.min(1,Math.round((scale+.06)*100)/100);lastChange=ts;
   }
   // E.resize reads this value each frame; dimensions only reset when altered.
   window.__HQ_RENDER_SCALE=scale;
   frames=0;windowStart=ts;
 }
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
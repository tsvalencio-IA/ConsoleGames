/* WAR: follow device orientation without resetting a match. */
(()=>{
 'use strict';
 let pending=false;
 const layout=()=>{
  const canvas=window.System?.canvas;
  window.System?.resize?.();
  const box=canvas?.getBoundingClientRect?.(),width=Math.round(box?.width||window.innerWidth),height=Math.round(box?.height||window.innerHeight);
  if(width>0&&height>0)document.documentElement.dataset.warOrientation=width>height?'landscape':'portrait';
 };
 const refresh=()=>{
  if(pending)return;pending=true;
  window.requestAnimationFrame(()=>{pending=false;layout()});
 };
 const changed=()=>{refresh();window.setTimeout(refresh,220)};
 window.addEventListener('resize',refresh);
 window.addEventListener('orientationchange',changed);
 window.addEventListener('pageshow',refresh);
 window.visualViewport?.addEventListener?.('resize',refresh);
 window.screen?.orientation?.addEventListener?.('change',changed);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
 async function request(mode){
  const orientation=window.screen?.orientation;
  try{
   if(mode==='auto'){orientation?.unlock?.();changed();return {ok:true};}
   if(!['portrait','landscape'].includes(mode)||typeof orientation?.lock!=='function')return {ok:false};
   if(!document.fullscreenElement){
    if(typeof document.documentElement.requestFullscreen!=='function')return {ok:false};
    await document.documentElement.requestFullscreen();
   }
   await orientation.lock(mode);changed();return {ok:true};
  }catch{changed();return {ok:false};}
 }
 window.WarScreenOrientation={refresh,request};
})();
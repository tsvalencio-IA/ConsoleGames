(() => {
  'use strict';
  let last = '', timer = 0, current = null;
  function measure() {
    const vv=window.visualViewport,unzoomed=!vv||Math.abs(Number(vv.scale||1)-1)<.01;
    // Read the browser viewport, never a stage sized from our previous CSS
    // variables. A WebView may deliver orientation before its stage relayout.
    const width=Math.max(280,Math.round(unzoomed&&vv?.width||innerWidth||document.documentElement.clientWidth));
    const height=Math.max(220,Math.round(unzoomed&&vv?.height||innerHeight||document.documentElement.clientHeight));
    const keyboard=unzoomed&&Math.max(0,innerHeight-height)>120,landscape=keyboard?innerWidth>innerHeight:width>height,key=`${width}x${height}:${landscape}:${keyboard}`;
    current={width,height,landscape,keyboard};if(key===last)return current;last=key;
    const root=document.documentElement;
    root.style.setProperty('--otthi-width',`${width}px`);root.style.setProperty('--otthi-height',`${height}px`);root.style.setProperty('--otthi-aspect',String(width/height));
    document.body?.classList.toggle('otthi-portrait',!landscape);document.body?.classList.toggle('otthi-landscape',landscape);document.body?.classList.toggle('otthi-keyboard',keyboard);document.body?.setAttribute('data-otthi-orientation',landscape?'landscape':'portrait');
    window.dispatchEvent(new CustomEvent('otthi:viewport',{detail:current}));return current;
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(measure,40);}
  addEventListener('resize',schedule,{passive:true});addEventListener('orientationchange',schedule,{passive:true});window.visualViewport?.addEventListener('resize',schedule,{passive:true});screen.orientation?.addEventListener?.('change',schedule);
  document.addEventListener('DOMContentLoaded',measure,{once:true});if(document.readyState!=='loading')measure();
  window.OTTHI_VIEWPORT={measure,schedule,current:()=>current&&{...current}};
})();

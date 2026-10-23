/* Downloads remain ordinary links: no popup, automatic navigation or blob URL. */
"use strict";
(()=>{
  const download=document.getElementById("download-apk");
  const status=document.getElementById("download-status");
  download.addEventListener("click",()=>{
    status.textContent="Se o navegador pedir, confirme o download. Depois, abra o arquivo .apk na pasta Downloads para instalar.";
  });
  const chrome=document.getElementById("open-chrome");
  if(/Android/i.test(navigator.userAgent)&&location.protocol==="https:"){
    const page=new URL("./",location.href);
    const fallback=new URL("#ajuda-download",page);
    chrome.href="intent://"+page.host+page.pathname+"#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url="+encodeURIComponent(fallback.href)+";end";
    chrome.hidden=false;
  }
})();

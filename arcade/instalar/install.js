/* Downloads remain ordinary links: no popup, automatic navigation or blob URL. */
"use strict";
(()=>{
  const download=document.getElementById("download-apk");
  const status=document.getElementById("download-status");
  const consoleUrl = new URL('../', location.href);
  async function findCompatiblePackage() {
    for (const metadata of ['release-ot.json', 'release.json']) {
      try {
        const response = await fetch(new URL('downloads/' + metadata, consoleUrl), {cache:'no-store'});
        if (!response.ok) continue;
        const release = await response.json();
        const entry = new URL(release.consoleUrl);
        entry.search = '';
        entry.hash = '';
        if (entry.href !== consoleUrl.href) continue;
        if (!/^thIAguinho-ARCADE(?:-OT)?\.apk$/.test(release.file)) continue;
        const path = release.file === 'thIAguinho-ARCADE-OT.apk' ? '../android/' : 'downloads/';
        download.href = new URL(path + release.file, consoleUrl).href;
        document.getElementById('release-version').textContent = release.version;
        download.hidden = false;
        document.getElementById('apk-instructions').hidden = false;
        document.getElementById('apk-release').hidden = false;
        document.getElementById('apk-installed-info').hidden = false;
        status.textContent = 'O download começa quando você toca no botão.';
        return;
      } catch { /* A missing or incompatible package leaves the browser entry available. */ }
    }
    status.textContent = 'Abra o console no navegador para jogar nesta versão.';
  }
  findCompatiblePackage();
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

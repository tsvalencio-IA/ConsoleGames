/* One launcher per deployment. Preserve all game IDs and saved data. */
(()=>{
'use strict';
const script=document.currentScript;
const base=new URL('./',script?.src||location.href);
const root=new URL('../',base);
const consoleUrl=new URL('arcade/',root);
const names=new Set(['otthi','kart','tenis','boxe','ar','voo','danca','familia']);
const canonicalPath=url=>{
 const u=new URL(url,location.href),path=u.pathname.replace(/^\/ConsoleGames(?=\/)/,'');
 if(u.origin!==location.origin&&!/^(?:otthi-world-campanha-teste(?:-[a-z0-9-]+)?\.vercel\.app|tsvalencio-ia\.github\.io)$/i.test(u.hostname))return null;
 if(/^\/(?:arcade(?:\/|$)|console(?:\.html|\/|$))/.test(path))return consoleUrl.href;
 const match=/^\/games\/([^/]+)(?:\/|$)/.exec(path);
 if(match&&names.has(match[1]))return new URL(path.replace(/^\/+/,'')+u.search+u.hash,root).href;
 return null;
};
function normalize(a){
 const raw=a.getAttribute('href');if(!raw||raw.startsWith('#')||raw.startsWith('javascript:'))return;
 try{const target=canonicalPath(a.href);if(target&&target!==a.href)a.href=target;}catch{}
}
function scan(node){
 if(node.nodeType===1&&node.matches?.('a[href]'))normalize(node);
 node.querySelectorAll?.('a[href]').forEach(normalize);
}
scan(document);
new MutationObserver(records=>records.forEach(r=>{
 if(r.type==='attributes')normalize(r.target);
 else r.addedNodes.forEach(scan);
})).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});
window.OTTHI_CANONICAL=Object.freeze({consoleUrl:consoleUrl.href,game:id=>names.has(id)?new URL('games/'+id+'/',root).href:null});
})();

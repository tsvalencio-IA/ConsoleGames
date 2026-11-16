/* One origin, one launcher. Does not alter auth, saves, camera or existing game IDs. */
(()=>{
'use strict';
const script=document.currentScript;
const base=new URL('./',script?.src||location.href);
const root=new URL('../',base);
const consoleUrl=new URL('arcade/',root);
const names=new Set(['otthi','kart','tenis','boxe','ar','voo','danca','familia']);
const canonicalPath=url=>{
 const urlObj=new URL(url,location.href),pathname=urlObj.pathname.replace(/^\/ConsoleGames(?=\/)/,'');
 if(urlObj.origin!==location.origin && !/^(?:otthi-world-campanha-teste(?:-[a-z0-9-]+)?\.vercel\.app|tsvalencio-ia\.github\.io)$/i.test(urlObj.hostname))return null;
 const target=new URL(pathname.replace(/^\/+/,'')+urlObj.search+urlObj.hash,root);
 // Any link back to a console or launcher always uses THIS deployment.
 if(/^\/(?:arcade(?:\/|$)|console(?:\.html|\/|$))/.test(pathname))return consoleUrl.href;
 const match=/^\/games\/([^/]+)(?:\/|$)/.exec(pathname);
 if(match&&names.has(match[1]))return target.href;
 return null;
};
function normalize(node){
 const raw=node.getAttribute('href');if(!raw||raw.startsWith('#')||raw.startsWith('javascript:'))return;
 let normalized;try{normalized=canonicalPath(node.href);}catch{return;}
 if(normalized&&normalized!==node.href)node.href=normalized;
}
function scan(rootNode){
 if(rootNode.nodeType===1&&rootNode.matches?.('a[href]'))normalize(rootNode);
 rootNode.querySelectorAll?.('a[href]').forEach(normalize);
}
scan(document);
new MutationObserver(records=>¶»§q«^
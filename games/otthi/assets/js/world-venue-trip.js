/* Same-origin activity trips. No account, permissions or world balance is changed. */
(() => {
  'use strict';
  const key='thia:world-venue:trip:v1',games={pingpong:'tennis',boxing:'box_pro'},ttl=6*60*60*1000;
  function valid(t){
    if(!t||t.version!==1||games[t.id]!==t.gameId||typeof t.token!=='string'||t.token.length<16||t.token.length>100||!Number.isFinite(t.created)||Date.now()-t.created>ttl||t.created>Date.now()+60000)return false;
    try{const url=new URL(t.returnUrl);return url.origin===location.origin&&/\/games\/otthi\/(?:index\.html)?$/.test(url.pathname)&&t.recordKey==='thia:otthi:venues:v1:'+t.playerId;}catch{return false;}
  }
  function current(token,gameId){try{const t=JSON.parse(sessionStorage.getItem(key)||'null');return valid(t)&&(!token||t.token===token)&&(!gameId||t.gameId===gameId)?t:null;}catch{return null;}}
  function put(t){try{sessionStorage.setItem(key,JSON.stringify(t));return true;}catch{return false;}}
  window.WorldVenueTrip={
    current,
    begin(data){const t={...data,version:1,created:Date.now(),launched:true,result:null};return valid(t)&&put(t)?t:null;},
    result(token,gameId,score,won){
      const t=current(token,gameId);if(!t||t.result||!Number.isFinite(score)||typeof won!=='boolean')return false;
      t.result={score:Math.max(0,Math.min(1000000,Math.floor(score))),won};return put(t);
    },
    applyResult(token){
      const t=current(token);if(!t)return false;
      if(t.result){
        try{
          const records=JSON.parse(localStorage.getItem(t.recordKey)||'{}')||{},r=records[t.id]||{played:0,wins:0,best:0};
          if(r.lastTrip!==token){r.played=(Number(r.played)||0)+1;r.wins=(Number(r.wins)||0)+Number(t.result.won);r.best=Math.max(Number(r.best)||0,t.result.score);r.lastTrip=token;records[t.id]=r;localStorage.setItem(t.recordKey,JSON.stringify(records));}
        }catch{return false;}
      }
      return true;
    },
    returnUrl(token){const t=current(token);if(!t)return null;const u=new URL(t.returnUrl);u.searchParams.set('otVenueReturn',token);return u.href;},
    finish(token){if(!current(token))return false;try{sessionStorage.removeItem(key);return true;}catch{return false;}}
  };
})();

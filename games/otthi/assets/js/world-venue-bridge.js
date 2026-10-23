/* First-party venue result bridge. It never signs in, grants access, or starts a match. */
(function(){
  'use strict';
  const token=new URLSearchParams(location.search).get('otVenue');
  if(parent===window||!token||token.length>100||!window.System)return;
  const original=window.System.gameOver;
  window.System.gameOver=function(score,won=true,coins=0){
    const sys=window.System,game=sys.activeGame;
    const valid=!!game&&!sys.resultLocked&&game.id===window.CONSOLE_GAME_ID&&Number.isFinite(score);
    const result=original.call(sys,score,won,coins);
    if(valid)parent.postMessage({type:'ot-venue-result',token,score:Math.floor(score),won:!!won},location.origin);
    return result;
  };
  const stop=()=>window.System.stopGame();window.addEventListener('pagehide',stop);
  document.querySelectorAll('.arcade-return').forEach(a=>a.hidden=true);
})();

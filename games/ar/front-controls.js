/* Optional frontal-control evaluation on the native WAR engine. No storage,
 * accounts, sensor permission, enemies, rewards or renderer are owned here. */
(()=>{'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const modes=new Set(['legacy','continuous','step']);
let selected='legacy';
try{const value=new URLSearchParams(location.search).get('war-control');if(modes.has(value))selected=value;}catch{}
class FrontController{
 constructor(mode='continuous'){this.mode=mode==='step'?'step':'continuous';this.calibration=null;this.release();}
 release(){this.edge=0;this.dwell=0;this.snapped=false;this.turn=0;this.aim={x:.5,y:.48,fresh:false};return this;}
 step(sample,dt){
  if(!sample?.fresh||!Number.isFinite(sample.x)||!Number.isFinite(sample.y)||!Number.isFinite(dt)||dt<=0){this.release();return 0;}
  const calibration=sample.calibration??0;
  if(calibration!==this.calibration){FrontController.prototype.release.call(this);this.calibration=calibration;}
  this.aim={x:clamp(sample.x,.04,.96),y:clamp(sample.y,.08,.88),fresh:true};
  // Hysteresis avoids a small tracking tremor repeatedly arming a turn.
  const x=this.aim.x,edge=this.edge===1&&x>.76?1:this.edge===-1&&x<.24?-1:x>=.82?1:x<=.18?-1:0;
  if(edge!==this.edge){this.edge=edge;this.dwell=0;this.snapped=false;}
  this.turn=0;
  if(!edge){this.dwell=0;this.snapped=false;return 0;}
  const before=this.dwell;this.dwell+=Math.min(dt,.25);
  if(this.mode==='step'){
   if(this.dwell+1e-9>=.35&&!this.snapped){this.snapped=true;this.turn=edge*Math.PI/4;}
  }else this.turn=edge*1.6*(Math.max(0,this.dwell-.35)-Math.max(0,before-.35));
  return this.turn;
 }
}
class FrontSession extends FrontController{
 constructor(game,mode){super(mode);this.game=game;this.pointerAim=null;}
 pointer(x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return;this.pointerAim={x:clamp(x,0,1),y:clamp(y,0,1),fresh:true,calibration:0};}
 release(){super.release();this.pointerAim=null;return this;}
 tick(dt){return this.step(this.game.handSession?this.game.handAim:this.pointerAim,dt);}
 caption(){
  const mode=this.mode==='step'?'GIRO 45°':'GIRO CONTÍNUO';
  if(this.game.handSession&&!this.game.handAim?.fresh)return 'EXPERIMENTAL · '+mode+' · MÃO PAUSADA';
  if(this.edge)return 'EXPERIMENTAL · '+mode+' · '+(this.dwell<.35?'CONFIRME '+Math.round(this.dwell/.35*100)+'%':this.mode==='step'?'RECENTRE PARA OUTRO GIRO':'RECENTRE PARA PARAR');
  return 'EXPERIMENTAL · '+mode+' · MIRA NO CENTRO, BORDA GIRA';
 }
 dispose(){this.release();}
}
function choice(overlay){
 if(!window.ConsolePractice?.active)return;
 const label=document.createElement('label');label.className='war-front-choice';
 label.innerHTML='<span>CONTROLE DESTA OPERAÇÃO SOLO</span><select data-war-front-mode aria-label="Controle experimental frontal"><option value="legacy">Atual · controle existente</option><option value="continuous">Avaliar frontal · giro contínuo</option><option value="step">Avaliar frontal · passos de 45°</option></select><small data-war-front-description></small>';
 const select=label.querySelector('select'),cameraInfo=overlay.querySelector('[data-mode="camera"] small'),controlsInfo=overlay.querySelector('[data-mode="controls"] small'),legacyCamera=cameraInfo?.textContent,legacyControls=controlsInfo?.textContent;select.value=selected;
 const sync=()=>{label.querySelector('small').textContent=select.value==='legacy'?'Mantém a lógica atual de toque, teclado e câmera.':'Avaliação no WAR completo. Arraste a mira; segure a faixa lateral por 350 ms para girar. Solte para centralizar. Na câmera: mão direita mira e pinça atira; corpo só desloca/agacha, sem virar fisicamente. Somente solo local; online mantém controles atuais.';if(cameraInfo)cameraInfo.textContent=select.value==='legacy'?legacyCamera:'Mão direita mira; segurar a faixa lateral gira a visão; pinça dispara. O corpo só desloca e agacha, sem precisar virar.';if(controlsInfo)controlsInfo.textContent=select.value==='legacy'?legacyControls:'Arraste a mira e segure uma faixa lateral para girar. Solte para centralizar. Joystick anda; botão atira.';};
 select.addEventListener('change',sync);sync();overlay.querySelector('.input-mode-options').before(label);
}
window.WarFrontControl={Controller:FrontController,Session:FrontSession,getMode:()=>selected,select(value){selected=modes.has(value)?value:'legacy';},choice,
 create(game,fase){return selected!=='legacy'&&window.ConsolePractice?.active&&!fase?.online?new FrontSession(game,selected):null;}};
})();

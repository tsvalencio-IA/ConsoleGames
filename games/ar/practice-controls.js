/* Camera/body training is independent of the retired object-registration UI. */
(()=>{'use strict';
window.WarPracticeUI={start(game){
 if(!game.training)return null;
 const root=document.createElement('section');root.className='war-practice';root.setAttribute('aria-label','Treino de mira e movimentos');
 root.innerHTML='<div><strong>TREINO DE MIRA</strong><output role="status" aria-live="off"></output></div><div class="war-practice-actions"><button type="button" data-practice="calibrate" aria-label="Calibrar novamente o corpo e a mão">CALIBRAR</button><button type="button" data-practice="restart">RECOMEÇAR</button><button type="button" data-practice="walk" aria-pressed="false">TESTAR AVANÇO</button></div>';
 document.body.append(root);root.querySelector('strong').textContent='TREINO DE MIRA · '+String(game.difficulty||'normal').toUpperCase();
 const calibrate=root.querySelector('[data-practice="calibrate"]'),walk=root.querySelector('[data-practice="walk"]');
 const movement=value=>{game.practiceMovement=!!value;const s=game.handSession;if(s){s.autoAdvance=game.practiceMovement;s.syncMovement?.();}};
 const sync=()=>{const s=game.handSession;root.hidden=game.state!=='PLAYING'||!!window.System?.paused;calibrate.hidden=!s;walk.hidden=!s||s.dualHands;calibrate.setAttribute('aria-label',s?.dualHands?'Calibrar novamente as duas mãos':'Calibrar novamente a mão e o corpo');walk.textContent=game.practiceMovement?'PARAR AVANÇO':'TESTAR AVANÇO';walk.setAttribute('aria-pressed',String(!!game.practiceMovement));const nav=s?.dualHands&&s.controller.navigation.read(performance.now()),status=s?.dualHands?(game.handAim?.fresh?(nav.fresh?' · Duas mãos OK':' · Esquerda pausada'):(nav.fresh?' · Direita pausada':' · Rastreamento pausado')):s?(game.handAim?.fresh?(game.bodyPose?.fresh?' · Corpo e mão OK':' · Mão OK · Corpo opcional'):' · Mostre a mão direita · pausado'):' · Controles';const output=root.querySelector('output'),text=game.trainingTargets+' alvos · '+game.stats.hits+'/'+game.stats.shots+' acertos'+status;if(output.textContent!==text)output.textContent=text;if(!root.hidden)game.practiceHudBottom=root.getBoundingClientRect().bottom;};
 calibrate.onclick=()=>{game.handSession?.recalibrate();sync();};
 root.querySelector('[data-practice="restart"]').onclick=()=>{movement(false);game.resetTraining();sync();};
 walk.onclick=()=>{movement(!game.practiceMovement);sync();};
 sync();const timer=setInterval(sync,200);
 return{dispose(){clearInterval(timer);root.remove();delete game.practiceHudBottom;}};
}};
})();

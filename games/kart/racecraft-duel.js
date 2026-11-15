/* Optional local race preview. Uses native driving, items and result rewards. */
(()=>{
 'use strict';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const progress=(r,length)=>(Number(r.lap)-1)*length+Number(r.pos);
 const styles=[{name:'ATAQUE',pace:1.012,lane:-.55},{name:'TÉCNICA',pace:1.006,lane:.55},{name:'PRESSÃO',pace:1.018,lane:0},{name:'REGULAR',pace:1,lane:-.35}];
 const active=g=>!!(api.enabled&&g?.duelTrial&&!g.isOnline&&window.ConsolePractice?.active);
 const api=window.KartDuelEvaluation={
  enabled:/[?&]kart_eval=duelo(?:&|$)/.test(window.location?.search||''),
  select(on){this.enabled=!!on;this.refreshEntry?.();},
  start(g,length,stock){
   g.duelTrial=null;
   if(!this.enabled||g.isOnline||!window.ConsolePractice?.active||g.currentFase?.mode!=='RACE')return;
   const c=stock.character,cruise=stock.maxSpeed*c.speedInfo*c.accel*stock.friction/(1-(1-c.accel)*stock.friction);
   g.duelTrial={length,cruise,countdown:180,clock:0,battleSeconds:0,placeChanges:0,leadChanges:0,lastRank:5,lastLeader:null,lastLap:1,lastPickup:-Infinity,defences:0,incomingAlerts:0,lastAlert:-Infinity,closest:null,finished:false,bots:{}};
   g.localBots.forEach((r,i)=>{r.pos=1100+i*1000;r.x=i%2? .6:-.6;g.duelTrial.bots[r.id]={index:i,lastPickup:-Infinity,nextDecision:0,lane:r.x,plan:null};});
   g.pushMsg('DUELO DE PISTA · PREPARE A LARGADA','#d7edb7',20);
  },
  countdown(g){
   if(!active(g)||g.duelTrial.countdown<=0)return false;
   const t=g.duelTrial;t.countdown--;g.inputActive=false;
   if(t.countdown===0)g.pushMsg('VAI! ESCOLHA A FAIXA LIVRE','#b9efd4',22);
   return true;
  },
  canPickup(g,racer){
   if(!active(g))return true;const t=g.duelTrial,record=racer?t.bots[racer.id]:t;
   if(!record||t.clock-record.lastPickup<5.5)return false;record.lastPickup=t.clock;return true;
  },
  botPlan(g,r,length,{curve}){
   if(!active(g))return null;
   const t=g.duelTrial,b=t.bots[r.id];if(!b)return null;
   const profile=styles[b.index%styles.length],own=progress(r,length),player=progress(g,length),gap=player-own;
   const difficulty=g.difficultyName?.()||'MEDIUM',skill=difficulty==='HARD'?1.018:difficulty==='EASY'?.992:1;
   // Pace adjustments change the target gradually through native acceleration.
   // They never write position, lap, rank or a guaranteed result.
   const recovery=clamp(gap/18000,-1,1)*.022;
   const late=g.lap===3&&b.index===2?.008:0;
   const speed=t.cruise*profile.pace*skill*(1+recovery+late)*(1-Math.min(.022,Math.abs(curve)*.004));
   if(t.clock>=b.nextDecision){
    b.nextDecision=t.clock+.7+b.index*.12;
    const racers=[{id:'player',x:g.playerX,lap:g.lap,pos:g.pos,status:g.status},...g.localBots].filter(other=>other.id!==r.id&&other.status==='RACING');
    const options=[-.75,0,.75],desired=clamp(profile.lane+Math.sign(curve)*.2,-.75,.75);
    let best={lane:desired,cost:Infinity};
    for(const lane of options){
     let cost=Math.abs(lane-desired)*.35+Math.abs(lane-r.x)*.18;
     for(const other of racers){const ahead=progress(other,length)-own;if(ahead> -200&&ahead<1800&&Math.abs(other.x-lane)<.43)cost+=3*(1-Math.abs(ahead)/2200);}
     // A defender commits to one lane; no instant weaving into the player.
     if(b.index===2&&own-player>800&&own-player<2200)cost+=Math.abs(lane-g.playerX)*.6;
     if(cost<best.cost)best={lane,cost};
    }
    b.lane=best.lane;
   }
   const ratio=clamp(r.speed/235,0,1.35),correction=curve*ratio*ratio*.0065;
   return{speed,lane:b.lane,correction,maxLaneStep:.032,style:profile.name};
  },
  blockShell(g,shell,from,to,getSegment,segmentLength){
   if(!active(g)||!shell.active)return false;const t=g.duelTrial,length=t.length;
   const travel=(to-from+length)%length;
   for(let step=0;step<=Math.ceil(travel/segmentLength)+1;step++){
    const index=Math.floor(from/segmentLength)+step,segment=getSegment(index),at=((index+.5)*segmentLength)%length;
    const along=(at-from+length)%length;if(along>travel+segmentLength*.6)continue;
    const banana=segment.obs?.find(o=>o.type==='banana'&&!o.collected&&o.owner!==shell.owner&&Math.abs(o.x-shell.x)<.48);
    if(!banana)continue;banana.collected=true;shell.active=false;
    if(banana.owner===g.networkId||banana.owner==='player'){t.defences++;g.pushMsg('DEFESA! BANANA BLOQUEOU O CASCO','#c6e9a8',18);}
    return true;
   }
   return false;
  },
  tick(g,length){
   if(!active(g)||g.duelTrial.finished)return;const t=g.duelTrial;t.clock+=1/60;
   const own=progress(g,length),ranks=g.getRankings(),rank=ranks.findIndex(r=>r.id==='player')+1,leader=ranks[0]?.id;
   if(rank!==t.lastRank){if(t.clock>1)t.placeChanges++;t.lastRank=rank;}
   if(t.lastLeader&&leader!==t.lastLeader&&t.clock>1)t.leadChanges++;t.lastLeader=leader;
   const nearby=g.rivals.filter(r=>r.status==='RACING').map(r=>({id:r.id,name:r.name,gap:progress(r,length)-own})).sort((a,b)=>Math.abs(a.gap)-Math.abs(b.gap));
   t.closest=nearby[0]||null;if(t.closest&&Math.abs(t.closest.gap)<8000)t.battleSeconds+=1/60;
   if(g.lap!==t.lastLap){t.lastLap=g.lap;if(g.lap===3)g.pushMsg('ÚLTIMA VOLTA · A DISPUTA VALE ATÉ A LINHA','#f2d58e',22);}
   const incoming=g.projectiles.some(p=>p.active&&p.targetId==='player'&&((g.pos-p.pos+length)%length)<4200);
   if(incoming&&t.clock-t.lastAlert>3){t.lastAlert=t.clock;t.incomingAlerts++;g.pushMsg(g.item==='banana'?'CASCO ATRÁS · BANANA PODE DEFENDER':'CASCO ATRÁS · PREPARE SUA LINHA','#f0c58c',18);}
  },
  finish(g){
   if(!active(g)||g.duelTrial.finished)return;const t=g.duelTrial;t.finished=true;t.rank=g.finalRank;
   const panel=document.getElementById?.('kart-racecraft-result');
   if(panel){const heading=panel.querySelector('h2');if(heading)heading.textContent='DUELO DE PISTA · '+g.finalRank+'º LUGAR';
    const summary=document.createElement('p');summary.textContent=t.placeChanges+' trocas de posição · '+t.battleSeconds.toFixed(1)+' s perto de rivais · '+t.defences+' defesa(s) com banana. Próximo desafio: escolha onde atacar e guarde o item para a disputa.';panel.append(summary);}
  },
  draw(ctx,w,h,g){
   if(!active(g)||g.duelTrial.finished)return;const t=g.duelTrial;
   if(t.countdown>0){ctx.save();ctx.fillStyle='rgba(5,20,31,.7)';ctx.fillRect(w*.18,h*.35,w*.64,h*.23);ctx.fillStyle='#f5e9c8';ctx.textAlign='center';ctx.font='bold '+Math.round(Math.min(w,h)*.15)+'px Arial';ctx.fillText(String(Math.ceil(t.countdown/60)),w/2,h*.50);ctx.font='bold 12px Arial';ctx.fillText('SEGURE ACELERAR · PREPARE A FAIXA',w/2,h*.55,w*.6);ctx.restore();return;}
   const x=Math.max(12,w-238),y=h<500?128:151,width=Math.min(226,w-24),near=t.closest;
   ctx.save();ctx.fillStyle='rgba(7,26,34,.9)';ctx.fillRect(x,y,width,65);ctx.textAlign='left';ctx.fillStyle='#d8e9bd';ctx.font='bold 11px Arial';ctx.fillText('DUELO · '+(g.lap===3?'ÚLTIMA VOLTA':'VOLTA '+g.lap+'/3'),x+9,y+15,width-18);ctx.fillStyle='#d5e6e6';ctx.font='11px Arial';
   const seconds=near?Math.abs(near.gap)/Math.max(60,g.speed)/60:0;
   ctx.fillText(near?near.name+' · '+seconds.toFixed(1).replace('.',',')+' s '+(near.gap>=0?'à frente':'atrás'):'Busque a melhor linha até a chegada',x+9,y+32,width-18);
   const trial=g.racecraftTrial;ctx.fillText(trial?Math.min(2,trial.passes)+'/2 limpas · '+Math.min(1,trial.drifts)+'/1 drift · item '+(g.item?'pronto':'na próxima caixa'):'Escolha a faixa e o momento de atacar',x+9,y+49,width-18);ctx.restore();
  },
  snapshot(g){return g?.duelTrial?JSON.parse(JSON.stringify(g.duelTrial)):null;}
 };
 const init=()=>{
  const phase=document.getElementById('phase-screen');if(!phase)return;
  const style=document.createElement('style');style.textContent='.kart-duel-entry{margin:8px auto 14px;padding:12px 14px;max-width:650px;border:1px solid #8fb69e;border-radius:12px;background:#183b35;color:#e7f0df;text-align:left;font:13px/1.4 system-ui}.kart-duel-entry[hidden]{display:none!important}.kart-duel-entry p{margin:5px 0 9px}.kart-duel-entry button{min-height:44px;padding:8px 14px;border-radius:9px;border:1px solid #b2d89b;background:#c9e0af;color:#19352e;font:800 13px system-ui}.kart-racecraft-result{margin-top:12px;padding:10px;border-top:1px solid #739c8b;color:#d7ece0;text-align:left;font:12px/1.35 system-ui}.kart-racecraft-result h2{font:700 14px system-ui;margin:0 0 6px}.kart-racecraft-result p{margin:4px 0}body:has(.kart-racecraft-result) #screen-over .results-container{max-height:63vh;overflow-y:auto}';document.head.append(style);
  const entry=document.createElement('section');entry.className='kart-duel-entry';entry.id='kart-duel-entry';entry.innerHTML='<b>PRÉVIA SOLO · DUELO DE PISTA</b><p>Rivais disputam a faixa e mantêm o ritmo. Guarde um item para a hora certa: banana também bloqueia casco. Use drift e nitro para conquistar posições nas três voltas. Recompensa original; sem alterar sua conta.</p><button type="button" data-kart-duel-select></button>';phase.insertBefore(entry,document.getElementById('phase-grid'));
  const button=entry.querySelector('button');button.onclick=()=>api.select(!api.enabled);
  api.refreshEntry=()=>{entry.hidden=!window.ConsolePractice?.active;button.textContent=api.enabled?'DUELO ATIVO · VOLTAR À CORRIDA HABITUAL':'EXPERIMENTAR DUELO DE PISTA';button.setAttribute('aria-pressed',String(api.enabled));};
  api.refreshEntry();if(typeof MutationObserver!=='undefined')new MutationObserver(api.refreshEntry).observe(phase,{attributes:true,attributeFilter:['class','hidden']});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

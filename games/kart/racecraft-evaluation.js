/* Optional native racecraft trial. No account, reward or calibration writes. */
(()=>{
 'use strict';
 const enabled=/[?&]kart_eval=disputa(?:&|$)/.test(window.location?.search||'');
 const goals={passes:2,drift:1};
 const raceProgress=(r,length)=>(Number(r.lap)-1)*length+Number(r.pos);
 const api=window.KartRacecraftEvaluation={enabled,
  start(g,length){
   document.getElementById?.('kart-racecraft-result')?.remove();
   g.racecraftTrial=null;
   if(!enabled||g.isOnline||!window.ConsolePractice?.active||g.currentFase?.mode!=='RACE')return;
   // A visible chase start creates real passes instead of crediting tied grids.
   g.localBots.forEach((r,i)=>{r.pos=Math.min(length*.12,4500+i*2500);});
   g.racecraftTrial={trackLength:length,passes:0,drifts:0,items:0,contacts:0,offroadSeconds:0,eligible:{},passed:{},lastContactAt:-Infinity,lastOffroadAt:-Infinity,lastItem:null,finished:false,rank:0,lapTimes:[],nearest:null};
   g.pushMsg('PERSEGUIÇÃO: 2 ULTRAPASSAGENS LIMPAS + 1 DRIFT','#c7ead2',18);
  },
  tick(g,length){
   const t=g.racecraftTrial;if(!t||t.finished||g.isOnline)return;
   const now=Number(g.raceElapsed)||0;
   if(g.collisionContacts?.size){if(!t.contactHeld)t.contacts++;t.contactHeld=true;t.lastContactAt=now;}else t.contactHeld=false;
   if(Math.abs(g.playerX)>1.3){t.offroadSeconds+=1/60;t.lastOffroadAt=now;}
   if(t.lastItem&&g.item===null&&g.itemCooldown>0)t.items++;
   t.lastItem=g.item;t.drifts=Number(g.driftBoosts)||0;
   const progress=raceProgress(g,length),seen=new Set();let nearest=null;
   for(const r of g.rivals){
    if(!r.id||r.status!=='RACING'||!Number.isFinite(Number(r.lap))||!Number.isFinite(Number(r.pos)))continue;
    const gap=raceProgress(r,length)-progress,key=String(r.id),lapKey=key+':'+g.lap;seen.add(key);
    if(gap>0&&(!nearest||gap<nearest.gap))nearest={id:key,name:String(r.name||'Rival'),gap};
    const clean=now-t.lastContactAt>2&&now-t.lastOffroadAt>2;
    if(now>=2&&gap>=300&&gap<=14000&&clean&&!t.passed[lapKey])t.eligible[key]={lap:g.lap,at:now,gap};
    const candidate=t.eligible[key];
    if(candidate&&(candidate.lap!==g.lap||!clean||gap>16000||now-candidate.at>20)){delete t.eligible[key];continue;}
    if(candidate&&gap<=-300){
     if(gap>=-1500&&!t.passed[lapKey]){t.passes++;t.passed[lapKey]=true;g.pushMsg('ULTRAPASSAGEM LIMPA · '+t.passes+'/'+goals.passes,'#b9efd4',18);}
     delete t.eligible[key];
    }
   }
   for(const id of Object.keys(t.eligible))if(!seen.has(id))delete t.eligible[id];
   t.nearest=nearest;
   if((g.lapTimes||[]).length>t.lapTimes.length){
    const times=g.lapTimes.slice(),seconds=times.at(-1),previous=times.slice(0,-1),delta=previous.length?seconds-Math.min(...previous):null;
    t.lastLap={number:times.length,seconds,delta};t.lapTimes=times;
    const split=delta===null?'':` · ${delta<=0?'MELHOR ': '+'}${delta.toFixed(1)} s`;
    g.pushMsg('VOLTA '+times.length+' · '+seconds.toFixed(1)+' s'+split,delta===null||delta<=0?'#b9efd4':'#ecd1a4',120);
   }
  },
  finish(g){
   const t=g.racecraftTrial;if(!t||t.finished||g.isOnline)return;
   t.finished=true;t.rank=g.finalRank;t.lapTimes=(g.lapTimes||[]).slice();
   t.completed=t.rank<=Math.min(3,Number(g.currentFase?.targetRank)||3)&&t.passes>=goals.passes&&t.drifts>=goals.drift;
   const panel=document.createElement?.('section');if(!panel)return;
   panel.id='kart-racecraft-result';panel.className='kart-racecraft-result';panel.setAttribute('aria-label','Resultado do desafio de disputa');
   const heading=document.createElement('h2');heading.textContent=t.completed?'DESAFIO DE DISPUTA CONCLUÍDO':'SUA CORRIDA DE DISPUTA';panel.append(heading);
   const lines=[t.rank+'º lugar · '+t.passes+'/'+goals.passes+' ultrapassagens limpas · '+t.drifts+'/'+goals.drift+' impulso de drift',
    t.items+' itens usados · '+t.contacts+' contatos · '+t.offroadSeconds.toFixed(1)+' s fora do asfalto',
    'Voltas: '+t.lapTimes.map(n=>n.toFixed(1)+' s').join(' / '),
    t.completed?'Tente repetir com menos contatos ou uma volta melhor.':'Próxima tentativa: '+(t.passes<2?'busque uma ultrapassagem pela faixa livre.':t.drifts<1?'carregue o drift até azul e solte.':'busque o pódio.')];
   for(const line of lines){const p=document.createElement('p');p.textContent=line;panel.append(p);}
   document.querySelector?.('#screen-over .results-container')?.append(panel);
  },
  draw(ctx,w,h,g){
   const t=g.racecraftTrial;if(!t||t.finished||g.isOnline)return;
   const x=Math.max(12,w-230),y=h<500?88:151,width=Math.min(218,w-24);
   ctx.save();ctx.fillStyle='rgba(7,26,34,.88)';ctx.fillRect(x,y,width,66);ctx.textAlign='left';ctx.font='bold 10px Arial';ctx.fillStyle='#d5efdf';
   ctx.fillText('DISPUTA · '+Math.min(goals.passes,t.passes)+'/2 LIMPAS · '+Math.min(goals.drift,t.drifts)+'/1 DRIFT',x+9,y+15,width-18);
   ctx.font='10px Arial';ctx.fillStyle='#c8d6d6';
   const advice=g.driftSparks>70?'Solte o drift: impulso pronto':g.slipstreamTimer>0?'VÁCUO: prepare a faixa de ultrapassagem':t.nearest?'À frente: '+t.nearest.name+' · '+(t.nearest.gap/t.trackLength*100).toFixed(1).replace('.',',')+'% de volta':'Mantenha o ritmo para o pódio';
   ctx.fillText(advice,x+9,y+32,width-18);
   const split=t.lastLap,lapText=split?'Volta '+split.number+': '+split.seconds.toFixed(1).replace('.',',')+' s'+(split.delta===null?'':' · '+(split.delta>0?'+':'')+split.delta.toFixed(1).replace('.',',')+' s vs melhor'):'Prepare o drift e escolha a faixa livre';
   ctx.fillText(lapText,x+9,y+49,width-18);ctx.restore();
  },
  snapshot(g){const t=g?.racecraftTrial;return t?JSON.parse(JSON.stringify(t)):null;}
 };
 if(!enabled)return;
 const init=()=>{
  const style=document.createElement('style');style.textContent='.kart-racecraft-note{padding:10px 12px;margin:8px auto;max-width:620px;border:1px solid #8dbf9e;border-radius:10px;background:#17362c;color:#e8f5e9;font:13px/1.45 system-ui;text-align:center}.kart-racecraft-result{margin-top:12px;padding:10px;border-top:1px solid #739c8b;color:#d7ece0;text-align:left;font:12px/1.35 system-ui}.kart-racecraft-result h2{font:700 14px system-ui;margin:0 0 6px}.kart-racecraft-result p{margin:4px 0}body:has(.kart-racecraft-result) #screen-over .results-container{max-height:63vh;overflow-y:auto}';document.head.append(style);
  const phase=document.getElementById('phase-screen');if(phase){const note=document.createElement('p');note.className='kart-racecraft-note';note.id='kart-racecraft-note';note.textContent='AVALIAÇÃO SOLO · Escolha COPA COGUMELO para começar. Largada de perseguição: cumpra a meta da fase, faça 2 ultrapassagens limpas e solte 1 drift azul. Caça às moedas e online conservam as regras habituais.';phase.prepend(note);}
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

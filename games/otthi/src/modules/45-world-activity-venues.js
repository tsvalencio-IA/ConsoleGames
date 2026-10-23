/** Physical activity venues reuse original games without changing their access policy. */
// @otthi-module-body
  const worldVenues={ready:false,landmarks:[],session:null};
  const WORLD_ACTIVITY_VENUES=WORLD_LAYOUT_V704.activityVenues;
  function venueMapLocations(){return Object.values(WORLD_ACTIVITY_VENUES).map(v=>({id:'venue-'+v.id,name:v.label,icon:v.icon,group:'Esportes e dança',x:v.x,z:v.z,navX:v.navX,navZ:v.navZ,missionTarget:true,description:v.activity+' dentro do bairro. Vá até a entrada para jogar e depois continuar o passeio.',actions:['Marque a rota no GPS','Caminhe até a entrada','Use a ação Entrar']}));}
  function venueDirectoryHtml(){return '<h3>Academias e ginásios</h3>'+Object.values(WORLD_ACTIVITY_VENUES).map(v=>'<section class="venue-directory"><b>'+v.icon+' '+v.label+'</b><p>'+Math.round(Math.hypot(player.x-v.navX,player.z-v.navZ))+' m · '+v.activity+'</p><button class="btn" data-venue-route="'+v.id+'">ROTA NO GPS</button></section>').join('')+'<p>O kartódromo, o estádio e as quadras também continuam no mapa.</p>';}
  function venueBindDirectory(root){root.querySelectorAll('[data-venue-route]').forEach(b=>b.onclick=()=>setWaypoint('venue-'+b.dataset.venueRoute));}
  function venueCollider(v,x,z,w,d,height){const c={x:v.x+x,z:v.z+z*v.face,w,d,height,activityVenue:v.id};(worldVenues.colliders||(worldVenues.colliders=[])).push(c);world.colliders.push(c);}
  function venueDraw(v){
    const root=new THREE.Group();root.name='ACTIVITY_VENUE_'+v.id;root.position.set(v.x,groundHeightAt(v.x,v.z),v.z);root.rotation.y=v.face===-1?Math.PI:0;
    const wall=campaignMaterial(v.id==='boxing'?0x8b5150:v.id==='dance'?0x776497:0x527e92,.05,'concrete'),floor=campaignMaterial(0xd9ccae,.02,'wood'),steel=campaignMaterial(0x233948,.4),glass=campaignMaterial(0x87c4ce,.25,'city-glass'),white=campaignMaterial(0xf1e2c7),accent=campaignMaterial(v.id==='boxing'?0xd76e57:v.id==='dance'?0xcaa5eb:0x85c9cb);
    const box=(m,x,y,z,w,h,d)=>campaignBox(root,m,x,y,z,w,h,d);
    box(floor,0,.08,0,v.w,.16,v.d);box(wall,0,2.5,-v.d/2+.2,v.w,5,.4);venueCollider(v,0,-v.d/2+.2,v.w,.4,5);
    for(const x of [-v.w/2+.2,v.w/2-.2]){box(wall,x,2.5,0,.4,5,v.d);venueCollider(v,x,0,.4,v.d,5);}
    const front=v.d/2-.2;
    for(const side of [-1,1]){const x=side*(v.w/4+.8),w=v.w/2-1.6;box(steel,x,2.5,front,w,5,.2);box(glass,x,2.5,front+.13,w-.35,3.1,.08);venueCollider(v,x,front,w,.2,5);}
    box(accent,0,5.25,0,v.w+.3,.45,v.d+.3);box(white,0,4.5,front+.3,3.2,.8,.3);box(floor,0,.08,v.d/2+1.3,3,.16,2.6);
    if(v.id==='boxing'){
      box(steel,0,.35,0,6,.6,6);box(white,0,.69,0,5.8,.08,5.8);
      const rope=campaignMaterial(0xc15050),blue=campaignMaterial(0x4177a6);
      for(const x of [-2.8,2.8])for(const z of [-2.8,2.8])campaignCylinder(root,x<0?rope:blue,x,1.5,z,.13,2.3);
      for(const y of [1.1,1.55,2]){for(const z of [-2.8,2.8])box(rope,0,y,z,5.6,.07,.07);for(const x of [-2.8,2.8])box(blue,x,y,0,.07,.07,5.6);}
      for(const x of [-5,5]){campaignCylinder(root,steel,x,2.2,-2,.43,1.8);box(steel,x,3.8,-2,.07,1.5,.07);}
    }else if(v.id==='pingpong'){
      const top=campaignMaterial(0x327eac);box(top,0,1.1,0,3.05,.12,5.5);for(const x of [-1.25,1.25])for(const z of [-2.3,2.3])box(steel,x,.55,z,.14,1.1,.14);
      box(white,0,1.18,0,.035,.025,5.4);for(const z of [-2.65,2.65])box(white,0,1.18,z,2.95,.025,.035);
      box(steel,0,1.38,0,3.3,.5,.035);for(let x=-1.5;x<=1.5;x+=.15)box(white,x,1.39,.023,.016,.43,.01);
      for(const x of [-4.6,4.6]){box(steel,x,.45,-1,1,.8,5);box(floor,x,.9,-1,1.1,.12,5.1);}
    }else{
      for(let x=-3;x<=3;x+=2)for(let z=-3;z<=3;z+=2)box((x+z)%4?accent:steel,x,.19,z,1.85,.05,1.85);
      box(glass,0,2.2,-v.d/2+.43,v.w-1.2,3.5,.06);
      for(const x of [-4.7,4.7]){box(steel,x,1,-4,1.1,2,1);campaignCylinder(root,white,x,3.3,-4,.18,.3);}
    }
    const sign=campaignSign(root,v.activity.toUpperCase(),v.label.toUpperCase(),6.3);sign.position.z=v.d/2+.3;campaignBatch(root);worldGroup.add(root);worldVenues.landmarks.push({root,venue:v});
    registerInteractable({id:'activity-venue-'+v.id,type:'activity-venue',icon:v.icon,label:'Entrar · '+v.activity,x:v.navX,z:v.navZ,radius:4.5,priority:205,available:()=>!otGames.active&&!worldVenues.session,action:()=>venueOpen(v.id)});
  }
  function venueEnsure(){
    if(!running||!worldGroup)return;
    if(worldVenues.ready){for(const {root}of worldVenues.landmarks)if(root.parent!==worldGroup)worldGroup.add(root);for(const c of worldVenues.colliders||[])if(!world.colliders.includes(c))world.colliders.push(c);return;}
    Object.values(WORLD_ACTIVITY_VENUES).forEach(venueDraw);world.navCache?.clear?.();worldVenues.ready=true;
  }
  function updateWorldVenues(){venueEnsure();for(const {root,venue}of worldVenues.landmarks)root.visible=Math.hypot(otGamesFocus().x-venue.x,otGamesFocus().z-venue.z)<170;}
  function venueRecordKey(){return 'thia:otthi:venues:v1:'+(state.profile?.playerId||'local');}
  function venueRecords(){try{return JSON.parse(safeLocalGet(venueRecordKey())||'{}')||{};}catch{return {};}}
  function venueClose(){
    const s=worldVenues.session;if(!s)return;
    s.cleanup?.();try{s.frame?.contentWindow?.System?.stopGame();s.frame?.contentWindow?.Sfx?.ctx?.close?.();}catch{}
    s.ui.remove();worldVenues.session=null;paused=s.wasPaused;clearMovementInputs();document.body.classList.remove('world-venue-active');updateContext(true);
  }
  function venueOpen(id){
    const v=WORLD_ACTIVITY_VENUES[id];
    if(!v||!running||paused||worldVenues.session||otGames.active||currentHouse||player.vehicle||player.boating||player.transit.mode||activeRace||buildMode||SPORTS_V705.active||window.OTTHI_COOP?.active?.())return false;
    if(Math.hypot(player.x-v.navX,player.z-v.navZ)>4.5){setWaypoint('venue-'+id);toast('Siga o GPS até a entrada de '+v.label+'.','info',3000);return false;}
    closeModal();clearMovementInputs();savePlayerPosition(true);
    const ui=document.createElement('section');ui.id='worldVenueDialog';ui.setAttribute('role','dialog');ui.setAttribute('aria-modal','true');ui.setAttribute('aria-label',v.label);
    ui.innerHTML='<header><b>'+v.icon+' '+v.label+'</b><button type="button" data-venue-close>VOLTAR AO MUNDO</button></header><main><p data-venue-loading role="status">Preparando '+v.activity+'…</p></main>';
    const s={id,venue:v,ui,wasPaused:paused,entry:{x:player.x,y:player.y,z:player.z},token:crypto.randomUUID?.()||String(Math.random()),recorded:false};worldVenues.session=s;paused=true;document.body.append(ui);document.body.classList.add('world-venue-active');ui.querySelector('[data-venue-close]').onclick=venueClose;ui.querySelector('button').focus();
    if(id==='dance'){venueDanceMenu(s);return true;}
    const frame=s.frame=document.createElement('iframe');frame.title=v.activity+' · jogo original';frame.allow='camera; fullscreen; autoplay';frame.src=new URL('../'+v.slug+'/?otVenue='+encodeURIComponent(s.token),OTTHI_GAME_LIVE_BASE).href;frame.addEventListener('load',()=>{try{const script=frame.contentDocument.createElement('script');script.src=new URL('assets/js/world-venue-bridge.js',OTTHI_GAME_LIVE_BASE).href;frame.contentDocument.head.append(script);}catch(e){console.warn('Integração do resultado indisponível:',e.message);}});ui.querySelector('main').append(frame);
    const message=e=>{
      const d=e.data;if(worldVenues.session!==s||e.origin!==location.origin||e.source!==frame.contentWindow||d?.token!==s.token)return;
      if(d.type==='ot-venue-ready'){frame.contentWindow.postMessage({type:'ot-venue-start',token:s.token,name:state.profile.name},location.origin);return;}
      if(d.type==='ot-venue-playing'){clearTimeout(s.loadTimer);ui.querySelector('[data-venue-loading]')?.remove();return;}
      if(d.type==='ot-venue-close'){venueClose();return;}
      if(d.type!=='ot-venue-result'||s.recorded||!Number.isFinite(d.score)||typeof d.won!=='boolean')return;
      s.recorded=true;const records=venueRecords(),record=records[id]||{played:0,wins:0,best:0};record.played++;if(d.won)record.wins++;record.best=Math.max(record.best,Math.max(0,Math.min(1000000,Math.floor(d.score))));records[id]=record;safeLocalSet(venueRecordKey(),JSON.stringify(records));
    };
    const watchLoad=()=>{clearTimeout(s.loadTimer);s.loadTimer=setTimeout(()=>{const status=ui.querySelector('[data-venue-loading]');if(!status||worldVenues.session!==s)return;status.textContent='A atividade ainda não terminou de carregar. ';const retry=document.createElement('button');retry.textContent='TENTAR NOVAMENTE';retry.onclick=()=>{status.textContent='Preparando '+v.activity+'…';const url=new URL(frame.src);url.searchParams.set('retry',Date.now());frame.src=url.href;watchLoad();};status.append(retry);},20000);};watchLoad();
    window.addEventListener('message',message);s.cleanup=()=>{clearTimeout(s.loadTimer);window.removeEventListener('message',message);};return true;
  }
  function venueDanceMenu(s){
    const records=venueRecords(),dance=records.dance||{},names=['Primeiros passos','Ritmo da cidade','Festival OT'];s.ui.querySelector('main').innerHTML='<div class="venue-dance-menu"><h2>Dança · siga o ritmo</h2><p>Toque nas setas quando as notas chegarem à linha. No teclado: ← ↑ ↓ → ou D F J K. Duas notas juntas pedem dois toques.</p><p>Acerte pelo menos 60% para liberar a próxima música.</p>'+names.map((name,i)=>'<button data-dance-level="'+i+'" '+(i&&!(dance[i-1]?.passed)?'disabled':'')+'><b>'+name+'</b><small>'+[84,104,120][i]+' BPM · '+(dance[i]?.best||0)+' pontos</small></button>').join('')+'<p>As músicas são sintetizadas no jogo. O passeio fica pausado durante a atividade.</p></div>';
    s.ui.querySelectorAll('[data-dance-level]').forEach(b=>b.onclick=()=>venueDanceStart(s,Number(b.dataset.danceLevel)));
  }
  function venueDanceStart(s,level){
    const chart=s.chart=new WorldRhythm(level),main=s.ui.querySelector('main');let base=performance.now(),offset=-3,frozen=false,lastBeat=-100,rafId=0,feedback='PREPARE-SE',feedbackUntil=0,finished=false;
    main.innerHTML='<div class="venue-dance-game"><div class="dance-score"><b data-dance-score>0</b><span data-dance-combo>PREPARE-SE</span><button data-dance-pause>PAUSAR</button></div><canvas aria-label="Notas musicais nas quatro colunas"></canvas><div class="dance-pads">'+['←','↑','↓','→'].map((a,i)=>'<button data-dance-pad="'+i+'" aria-label="Passo '+a+'">'+a+'</button>').join('')+'</div><p data-dance-feedback>Espere as notas na linha</p></div>';
    const canvas=main.querySelector('canvas'),ctx=canvas.getContext('2d'),pads=main.querySelectorAll('[data-dance-pad]'),held=new Set();
    let audio=null;try{audio=new (window.AudioContext||window.webkitAudioContext)();audio.resume();}catch{}
    const time=()=>frozen?offset:offset+(performance.now()-base)/1000;
    const tone=(frequency,length=.09,volume=.025)=>{if(!audio||audio.state!=='running')return;const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=frequency;g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+length);o.connect(g);g.connect(audio.destination);o.onended=()=>{o.disconnect();g.disconnect()};o.start();o.stop(audio.currentTime+length);};
    const press=lane=>{if(frozen||finished)return;const result=chart.hit(lane,time());if(result){feedback=result;feedbackUntil=performance.now()+450;if(result!=='FORA DO TEMPO')tone([261.63,329.63,392,523.25][lane],.15,.06);}};
    pads.forEach((b,i)=>{b.addEventListener('pointerdown',e=>{e.preventDefault();if(held.has(e.pointerId))return;held.add(e.pointerId);safePointerCapture(b,e.pointerId);press(i);});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,e=>held.delete(e.pointerId));});
    const keys=['ArrowLeft','ArrowUp','ArrowDown','ArrowRight'],alt=['KeyD','KeyF','KeyJ','KeyK'];
    const key=e=>{const i=Math.max(keys.indexOf(e.code),alt.indexOf(e.code));if(i>=0){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)press(i);}if(e.code==='Escape'){e.preventDefault();pause();}};
    const pause=()=>{if(finished)return;offset=time();base=performance.now();frozen=!frozen;held.clear();main.querySelector('[data-dance-pause]').textContent=frozen?'CONTINUAR':'PAUSAR';if(frozen)audio?.suspend();else audio?.resume();};
    main.querySelector('[data-dance-pause]').onclick=pause;
    const blur=()=>{if(!frozen&&!finished)pause();};const visibility=()=>{if(document.hidden)blur();};window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);window.addEventListener('keydown',key,true);
    const cleanup=()=>{cancelAnimationFrame(rafId);window.removeEventListener('keydown',key,true);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);held.clear();audio?.close();s.chart=null;};s.cleanup=cleanup;
    const finish=()=>{
      if(finished)return;finished=true;const d=chart.snapshot(),passed=d.accuracy>=.6,records=venueRecords();records.dance=records.dance||{};const old=records.dance[level]||{};records.dance[level]={best:Math.max(old.best||0,d.score),passed:!!old.passed||passed,accuracy:Math.max(old.accuracy||0,d.accuracy)};safeLocalSet(venueRecordKey(),JSON.stringify(records));s.lastDance={...d,passed};cleanup();s.cleanup=null;
      main.innerHTML='<div class="venue-dance-menu"><h2>'+ (passed?'MÚSICA CONCLUÍDA':'VAMOS TREINAR MAIS')+'</h2><p>'+d.score+' pontos · '+Math.round(d.accuracy*100)+'% de precisão</p><p>'+d.hits+'/'+d.total+' notas · '+d.misses+' perdidas · melhor sequência '+d.bestCombo+'</p><button data-dance-again>ESCOLHER MÚSICA</button></div>';main.querySelector('[data-dance-again]').onclick=()=>venueDanceMenu(s);
    };
    function frame(){
      if(worldVenues.session!==s)return;const t=time();if(!frozen)chart.update(t);if(chart.done){finish();return;}
      const r=canvas.getBoundingClientRect(),ratio=Math.min(2,devicePixelRatio||1),w=Math.max(200,Math.round(r.width)),h=Math.max(100,Math.round(r.height));if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}ctx.setTransform(ratio,0,0,ratio,0,0);ctx.fillStyle='#101e36';ctx.fillRect(0,0,w,h);
      const colors=['#62cce7','#dc9fec','#f7c778','#91dfb6'],hitY=h*.82,travel=2;
      for(let i=0;i<4;i++){ctx.fillStyle=colors[i]+'16';ctx.fillRect(i*w/4+2,0,w/4-4,h);ctx.fillStyle=colors[i];ctx.fillRect(i*w/4+7,hitY-2,w/4-14,4);}
      for(const n of chart.notes)if(n.state==='pending'&&n.at-t< travel&&n.at-t>-.3){const y=hitY-(n.at-t)/travel*hitY;ctx.fillStyle=colors[n.lane];ctx.fillRect(n.lane*w/4+w/32,y-9,w/4-w/16,18);}
      if(t<0||frozen){ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='bold 30px system-ui';ctx.fillText(frozen?'PAUSADO':String(Math.ceil(-t)),w/2,h*.4);}
      const beat=Math.floor(t/chart.beat);if(!frozen&&t>=0&&beat>lastBeat){lastBeat=beat;tone(beat%4===0?110:220,.08,beat%4===0?.055:.025);}
      main.querySelector('[data-dance-score]').textContent=chart.score+' PONTOS';main.querySelector('[data-dance-combo]').textContent=chart.combo+' EM SEQUÊNCIA';main.querySelector('[data-dance-feedback]').textContent=performance.now()<feedbackUntil?feedback:'Acerte as notas na linha';
      rafId=requestAnimationFrame(frame);
    }rafId=requestAnimationFrame(frame);
    s.danceTime=time;
  }
  window.OTTHI_VENUES={enter:venueOpen,leave:venueClose,locations:()=>venueMapLocations(),diagnostics:()=>({ready:worldVenues.ready,active:worldVenues.session?.id||null,position:{x:player.x,y:player.y,z:player.z},records:venueRecords(),dance:worldVenues.session?.chart?{...worldVenues.session.chart.snapshot(),time:worldVenues.session.danceTime()}:worldVenues.session?.lastDance||null,landmarks:worldVenues.landmarks.map(x=>({id:x.venue.id,attached:x.root.parent===worldGroup,visible:x.root.visible}))})};

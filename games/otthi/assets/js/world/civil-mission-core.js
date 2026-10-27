/* Authoritative, serializable civilian missions. Used unchanged by solo and co-op.
 * Each participant must perform their own real objectives. A partner cannot
 * finish the mission for an idle player. Progress is ordered and idempotent.
 */
(()=>{'use strict';
 const definitions={
  beach:{title:'Uma praia para todos',icon:'🏖️',region:'Costa Verde',reward:150,
   description:'Converse com a equipe da orla, recolha resíduos e entregue tudo na reciclagem.',
   steps:[{id:'brief',title:'Retirar luvas e sacola no quiosque',action:'Retirar material',targets:['beach-desk'],quota:1},
    {id:'collect',title:'Recolher resíduos na areia',action:'Recolher',targets:Array.from({length:16},(_,i)=>'beach-litter-'+i),quota:{easy:2,normal:4,hard:6},sharedSubjects:true},
    {id:'return',title:'Separar o material no ecoponto',action:'Separar e entregar',targets:['beach-recycle'],quota:1}]},
  snow:{title:'Calor nos Picos Nevados',icon:'❄️',region:'Neve',reward:180,
   description:'Retire cobertores no chalé de apoio, visite os vizinhos e volte para avisar a equipe.',
   steps:[{id:'load',title:'Retirar cobertores no chalé de apoio',action:'Retirar cobertores',targets:['snow-depot'],quota:1},
    {id:'deliver',title:'Entregar cobertores nos chalés',action:'Entregar cobertor',targets:['snow-home-0','snow-home-1','snow-home-2'],quota:{easy:1,normal:2,hard:3}},
    {id:'return',title:'Voltar ao chalé de apoio',action:'Avisar que todos receberam',targets:['snow-depot'],quota:1}]},
  cable:{title:'Uma viagem até as nuvens',icon:'🚡',region:'Cordilheira',reward:170,
   description:'Pegue o teleférico, ajude um visitante no mirante e retorne pela linha da montanha.',
   steps:[{id:'ticket',title:'Converse com a equipe da estação',action:'Receber orientação',targets:['cable-base'],quota:1},
    {id:'up',title:'Embarque e desembarque no mirante',action:'Confirmar chegada pelo teleférico',targets:['cable-top'],quota:1,requiresRide:'cable-up'},
    {id:'help',title:'Ajudar o visitante no mirante',action:'Entregar água e orientar',targets:['mountain-visitor'],quota:1},
    {id:'down',title:'Retorne à estação pelo teleférico',action:'Concluir passeio',targets:['cable-base'],quota:1,requiresRide:'cable-down'}]},
  neighbors:{title:'Boas-vindas à vizinhança',icon:'🏘️',region:'Nova Aurora',reward:160,
   description:'Retire as sacolas do mercado e leve as encomendas às casas novas do bairro.',
   steps:[{id:'load',title:'Retirar sacolas no mercado de Aurora',action:'Retirar encomendas',targets:['aurora-market'],quota:1},
    {id:'deliver',title:'Visitar os vizinhos e entregar as sacolas',action:'Entregar e conversar',targets:['neighbor-home-0','neighbor-home-1','neighbor-home-2','neighbor-home-3'],quota:{easy:1,normal:2,hard:3}},
    {id:'return',title:'Voltar ao mercado',action:'Concluir entregas',targets:['aurora-market'],quota:1}]},
  fire:{title:'Bombeiros: cuidado com a orla',icon:'🚒',region:'Praia e cidade',reward:200,
   description:'Ajude os bombeiros com equipamentos, uma simulação de água e a vistoria final. Sem pessoas em perigo.',
   steps:[{id:'kit',title:'Retirar o equipamento com os bombeiros',action:'Conferir equipamento',targets:['civil-fire-desk'],quota:1},
    {id:'water',title:'Aplicar água nos alvos do treinamento da orla',action:'Usar mangueira',targets:['fire-training-0','fire-training-1','fire-training-2'],quota:{easy:1,normal:2,hard:3}},
    {id:'check',title:'Vistoriar o ponto de apoio',action:'Verificar área segura',targets:['beach-fire-post'],quota:1},
    {id:'return',title:'Voltar à equipe dos bombeiros',action:'Entregar equipamento',targets:['civil-fire-desk'],quota:1}]},
  police:{title:'Polícia: caminho seguro',icon:'🚓',region:'Nova Aurora',reward:190,
   description:'Prepare a travessia do bairro com cones e acompanhe os moradores até a outra calçada.',
   steps:[{id:'brief',title:'Receber orientação da policial',action:'Receber orientação',targets:['civil-police-desk'],quota:1},
    {id:'cones',title:'Preparar a travessia com cones',action:'Posicionar cone',targets:['crossing-cone-0','crossing-cone-1','crossing-cone-2'],quota:{easy:1,normal:2,hard:3}},
    {id:'escort',title:'Acompanhar o morador na travessia',action:'Acompanhar travessia',targets:['crossing-neighbor'],quota:1},
    {id:'return',title:'Voltar à policial',action:'Concluir atendimento',targets:['civil-police-desk'],quota:1}]},
  balloon:{title:'Festival de balões',icon:'🎈',region:'Montanhas',reward:200,
   description:'Prepare o passeio, visite os pontos panorâmicos num balão e pouse para encerrar.',
   steps:[{id:'brief',title:'Receber orientação no festival',action:'Preparar passeio',targets:['balloon-festival'],quota:1},
    {id:'views',title:'Visitar os pontos panorâmicos voando de balão',action:'Registrar paisagem',targets:['balloon-view-0','balloon-view-1','balloon-view-2'],quota:{easy:1,normal:2,hard:3},vehicle:'balloon'},
    {id:'land',title:'Pousar e voltar à equipe do festival',action:'Concluir passeio',targets:['balloon-festival'],quota:1,onFoot:true}]}
 };
 const difficulties={easy:{label:'Passeio',holdMs:900},normal:{label:'Aventura',holdMs:1700},hard:{label:'Desafio',holdMs:2600}};
 const safeId=s=>typeof s==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(s);
 const copy=v=>JSON.parse(JSON.stringify(v));
 const quota=(step,difficulty)=>typeof step.quota==='number'?step.quota:step.quota[difficulty]||1;
 class CivilMissionBook{
  constructor(saved={}){this.data={v:1,revision:0,records:{},...copy(saved||{})};this.data.records=this.data.records&&typeof this.data.records==='object'?this.data.records:{};}
  create(id,type,uid,mode='solo',difficulty='normal',now=Date.now()){
   if(!safeId(id)||!safeId(uid)||!definitions[type]||!difficulties[difficulty]||!['solo','coop'].includes(mode)||this.data.records[id])return null;
   const r={id,type,mode,difficulty,host:uid,status:mode==='solo'?'active':'lobby',phase:0,members:{[uid]:{ready:mode==='solo',joinedAt:now}},counts:{},tokens:{},pending:{},rides:{},createdAt:now,updatedAt:now,completedAt:0};this.data.records[id]=r;this.data.revision++;return r;
  }
  join(id,uid,now=Date.now()){const r=this.data.records[id];if(!r||r.mode!=='coop'||r.status!=='lobby'||!safeId(uid)||Object.keys(r.members).length>=2&&!r.members[uid])return false;r.members[uid]||={ready:false,joinedAt:now};r.updatedAt=now;this.data.revision++;return true;}
  ready(id,uid,value){const r=this.data.records[id];if(!r||r.status!=='lobby'||!r.members[uid])return false;r.members[uid].ready=!!value;this.data.revision++;return true;}
  start(id,uid){const r=this.data.records[id];if(!r||r.host!==uid||r.status!=='lobby'||Object.keys(r.members).length!==2||Object.values(r.members).some(m=>!m.ready))return false;r.status='active';this.data.revision++;return true;}
  leave(id,uid){const r=this.data.records[id];if(!r?.members[uid])return false;if(r.status==='lobby'){delete r.members[uid];if(!Object.keys(r.members).length)r.status='cancelled';else if(r.host===uid)r.host=Object.keys(r.members)[0];}else if(r.status==='active')r.status='cancelled';this.data.revision++;return true;}
  ride(id,uid,ride,now=Date.now()){const r=this.data.records[id];if(!r||r.status!=='active'||!r.members[uid]||!['cable-up','cable-down'].includes(ride))return false;r.rides[uid]||={};r.rides[uid][ride]=now;this.data.revision++;return true;}
  progress(id,uid){const r=this.data.records[id],def=r&&definitions[r.type],step=def?.steps[r.phase];return r?{record:r,definition:def,step,quota:step?quota(step,r.difficulty):0,count:Number(r.counts[`${r.phase}:${uid}`]||0),members:Object.keys(r.members)}:null;}
  eligible(id,uid,phase,subject){const p=this.progress(id,uid);if(!p||p.record.status!=='active'||!p.record.members[uid]||phase!==p.record.phase||!p.step||!p.step.targets.includes(subject)||p.count>=p.quota)return false;const token=`${phase}:${p.step.sharedSubjects?'team':uid}:${subject}`;if(p.record.tokens[token])return false;if(p.step.requiresRide&&!p.record.rides[uid]?.[p.step.requiresRide])return false;return true;}
  begin(id,uid,phase,subject,now=Date.now()){if(!this.eligible(id,uid,phase,subject))return false;const r=this.data.records[id];r.pending[uid]={phase,subject,at:now};this.data.revision++;return true;}
  finish(id,uid,phase,subject,now=Date.now()){
   const r=this.data.records[id],pending=r?.pending[uid];if(!pending||pending.phase!==phase||pending.subject!==subject||now-pending.at<difficulties[r.difficulty].holdMs||!this.eligible(id,uid,phase,subject))return false;
   const p=this.progress(id,uid),token=`${phase}:${p.step.sharedSubjects?'team':uid}:${subject}`;r.tokens[token]={uid,at:now};r.counts[`${phase}:${uid}`]=(r.counts[`${phase}:${uid}`]||0)+1;delete r.pending[uid];r.updatedAt=now;
   if(Object.keys(r.members).every(u=>Number(r.counts[`${phase}:${u}`]||0)>=p.quota)){r.phase++;r.pending={};if(r.phase>=p.definition.steps.length){r.status='completed';r.completedAt=now;}}
   this.data.revision++;return true;
  }
  cancelTask(id,uid){const r=this.data.records[id];if(r?.pending[uid]){delete r.pending[uid];this.data.revision++;}}
  snapshot(){return copy(this.data);}
 }
 function mergeProgress(local={},remote={}){
  const records={...(local.solo?.records||{})};for(const[id,r]of Object.entries(remote.solo?.records||{})){
   if(!r||r.mode!=='solo'||!definitions[r.type])continue;const l=records[id];if(!l){records[id]=copy(r);continue;}
   const latest=Number(r.updatedAt||0)>Number(l.updatedAt||0)?r:l,merged={...copy(latest),tokens:{...(l.tokens||{}),...(r.tokens||{})},counts:{},pending:{}};
   for(const[key,value]of Object.entries(merged.tokens)){const phase=Number(key.split(':')[0]);if(Number.isInteger(phase)&&safeId(value.uid)){const k=phase+':'+value.uid;merged.counts[k]=(merged.counts[k]||0)+1;}}
   merged.phase=Math.max(Number(l.phase)||0,Number(r.phase)||0);if(l.status==='completed'||r.status==='completed')merged.status='completed';
   const steps=definitions[merged.type].steps;while(merged.phase<steps.length&&Object.keys(merged.members).every(uid=>Number(merged.counts[merged.phase+':'+uid]||0)>=quota(steps[merged.phase],merged.difficulty)))merged.phase++;
   if(merged.phase>=steps.length)merged.status='completed';records[id]=merged;
  }
  const receipts={...(local.rewardReceipts||{}),...(remote.rewardReceipts||{})},completed={};for(const r of Object.values(records))if(r.status==='completed')completed[r.type]=(completed[r.type]||0)+1;
  return{...local,...remote,version:1,mode:local.mode==='coop'?'coop':remote.mode||local.mode||'solo',activeId:local.mode==='coop'?local.activeId:remote.activeId||local.activeId||'',solo:{v:1,revision:Math.max(Number(local.solo?.revision||0),Number(remote.solo?.revision||0)),records},shared:local.shared||{},sharedRoom:local.sharedRoom||'',rewardReceipts:receipts,completedTypes:completed};
 }
 const freeze=value=>{for(const v of Object.values(value))if(v&&typeof v==='object'&&!Object.isFrozen(v))freeze(v);return Object.freeze(value);};freeze(definitions);freeze(difficulties);
 globalThis.OTCivilMissionCore=Object.freeze({CivilMissionBook,definitions,difficulties,quota,mergeProgress});
})();

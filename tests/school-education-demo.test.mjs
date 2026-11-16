import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const Edu=require('../escola/learning-core.js');
test('oito jogos permanecem associados a atividades sem alterar URLs originais',()=>{
  assert.equal(Edu.GAMES.length,8);
  assert.deepEqual(Edu.GAMES.map(x=>x.id),['otthi','kart','tenis','boxe','ar','voo','familia','danca']);
  assert(Edu.GAMES.every(x=>x.url.startsWith('../games/')));
});
test('tarefas de demonstração abrangem os oito jogos',()=>{
  const state=Edu.seed();assert.equal(state.activities.length,8);
  assert(state.activities.every(a=>a.kind==='quiz'&&a.options.length===4));
});
test('a resposta correta concede PA uma única vez e não permite duplicação',()=>{
  const state=Edu.seed(),task=state.activities[0];
  const first=Edu.submit(state,{activityId:task.id,answer:task.correct});
  assert.equal(Edu.score(first.data),10);
  assert.throws(()=>Edu.submit(first.data,{activityId:task.id,answer:task.correct}),/já foi enviada/);
  assert.equal(Edu.score(state),0);
});
test('erro permite até três tentativas sem premiação indevida',()=>{
  let state=Edu.seed(),task=state.activities[0],wrong=(task.correct+1)%4;
  for(let i=0;i<3;i++)state=Edu.submit(state,{activityId:task.id,answer:wrong}).data;
  assert.equal(Edu.score(state),0);
  assert.throws(()=>Edu.submit(state,{activityId:task.id,answer:task.correct}),/três tentativas/);
});
test('respostas abertas dependem da correção do professor e livro-razão é único',()=>{
  let d=Edu.seed();d=Edu.makeActivity(d,{game:'familia',title:'Ajudar um colega',question:'Descreva como você ajudaria um colega na escola',kind:'open',points:15}).data;
  const task=d.activities[0];const submission=Edu.submit(d,{activityId:task.id,answer:'Eu iria escutar e ajudar o colega.'});
  assert.equal(Edu.score(submission.data),0);
  const approved=Edu.review(submission.data,submission.submission.id,true);
  assert.equal(Edu.score(approved.data),15);
  assert.throws(()=>Edu.review(approved.data,submission.submission.id,true),/pendente/);
});
test('recompensa troca PA sem permitir saldo negativo ou resgate duplicado',()=>{
  let d=Edu.seed();for(const a of d.activities)d=Edu.submit(d,{activityId:a.id,answer:a.correct}).data;
  assert.equal(Edu.score(d),80);
  const grant=Edu.redeem(d,'cap');
  assert.equal(Edu.score(grant.data),55);
  assert.throws(()=>Edu.redeem(grant.data,'cap'),/já resgatada/);
  assert.throws(()=>Edu.redeem(grant.data,'paint'),/insuficientes/);
});
test('campos e pontos são limitados e a correção só vale para tarefa aberta',()=>{
  let d=Edu.seed();assert.throws(()=>Edu.makeActivity(d,{game:'xxx',title:'teste válido',question:'uma pergunta com detalhes',kind:'quiz'}),/jogo válido/);
  d=Edu.makeActivity(d,{game:'kart',title:'Calcular distância',question:'Como calcular a distância percorrida na corrida?',kind:'quiz',options:['A','B','C','D'],correct:2,points:500}).data;
  assert.equal(d.activities[0].points,50);
  const s=Edu.submit(d,{activityId:d.activities[0].id,answer:2});
  assert.throws(()=>Edu.review(s.data,s.submission.id,true),/pendente/);
});

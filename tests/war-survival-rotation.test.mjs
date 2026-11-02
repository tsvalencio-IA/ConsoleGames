import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {engine} from './helpers/game-fixture.mjs';

function fresh(settings={}){
 const f=engine('ar','game_ar',settings);f.game.init({id:'patrol'});f.game.covers=[];f.game.waveDelay=999;return f;
}
function damage(settings={}){
 const {game:g}=fresh(settings);
 g.enemies=[{id:'qa',kind:'drone',x:0,z:18,y:5,hp:300,active:true,aim:0,phase:0}];
 g.step(.1);return g;
}
test('WAR solo: resistance scales incoming damage without altering enemies',()=>{
 const base=damage(),protectedGame=damage({combatProtection:'resistant'}),relaxed=damage({combatProtection:'relaxed'});
 const hit=100-base.player.hp;assert(hit>0);
 assert(Math.abs((100-protectedGame.player.hp)/hit-.65)<1e-8);
 assert(Math.abs((100-relaxed.player.hp)/hit-.4)<1e-8);
 assert.equal(base.enemies.length,relaxed.enemies.length);
});
test('WAR: recovery only after five seconds without taking damage, while alive',()=>{
 const g=damage({combatProtection:'resistant',combatRecovery:true}),injured=g.player.hp;
 g.enemies=[];g.step(4);assert.equal(g.player.hp,injured);
 g.step(.7);assert.equal(g.player.hp,injured);
 g.step(.5);assert(g.player.hp>injured&&g.player.hp<=100);
 g.player.hp=0;g.step(.1);assert.equal(g.player.hp,0);
});
test('WAR: multiplayer mode cannot receive the solo survival benefits',()=>{
 const {game:g}=fresh({combatProtection:'relaxed',combatRecovery:true});
 g.net={};g.player.hp=60;g.enemies=[];g.step(7);assert.equal(g.player.hp,60);
});
test('WAR rotation refresh adjusts visible canvas after portrait to landscape, without losing controls unnecessarily',async()=>{
 const callbacks=new Map(),window={innerWidth:390,innerHeight:844,events:[],visualViewport:{addEventListener(){}},screen:{orientation:{addEventListener(){},lock:async()=>{},unlock(){}}},requestAnimationFrame(fn){fn()},setTimeout(fn){fn()},addEventListener(k,fn){callbacks.set(k,fn)},dispatchEvent(evt){this.events.push(evt.type)}};
 const canvas={width:390,height:844,getBoundingClientRect:()=>({width:window.innerWidth,height:window.innerHeight})};
 window.System={canvas,resize(){const r=canvas.getBoundingClientRect();if(canvas.width===r.width&&canvas.height===r.height)return;canvas.width=r.width;canvas.height=r.height;window.dispatchEvent({type:'arcade:release-inputs'})}};
 const document={readyState:'complete',documentElement:{dataset:{},requestFullscreen:async()=>{}},fullscreenElement:null};
 vm.runInNewContext(readFileSync('games/ar/war-screen-orientation.js','utf8'),{window,document});
 assert.equal(document.documentElement.dataset.warOrientation,'portrait');assert.equal(window.events.length,0);
 window.innerWidth=844;window.innerHeight=390;callbacks.get('orientationchange')();
 assert.equal(document.documentElement.dataset.warOrientation,'landscape');assert.equal(canvas.width,844);assert.equal(canvas.height,390);assert.equal(window.events.length,1);
 callbacks.get('orientationchange')();assert.equal(window.events.length,1);
 assert((await window.WarScreenOrientation.request('landscape')).ok);
 assert((await window.WarScreenOrientation.request('auto')).ok);
});

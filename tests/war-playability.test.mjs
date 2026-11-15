import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {engine} from './helpers/game-fixture.mjs';

test('WAR: diagonal movement slides along solid cover instead of swallowing both axes',()=>{
 const {game:g}=engine('ar','game_ar');g.init({id:'patrol'});g.waveDelay=999;
 g.covers=[{x:2,z:0,w:2,d:8,h:3}];Object.assign(g.player,{x:.6,z:0});
 const distance=g.movePlayer(.7,.7);
 assert.equal(g.player.x,.6,'the inward component remains blocked');
 assert(Math.abs(g.player.z-.7)<1e-8,'the tangential component remains responsive');
 assert(Math.abs(distance-.7)<1e-8);
});
test('WAR: sliding cannot cross a solid corner or tunnel through a thin barrier',()=>{
 const {game:g}=engine('ar','game_ar');g.init({id:'patrol'});g.waveDelay=999;
 g.covers=[{x:2,z:2,w:2,d:2,h:3}];Object.assign(g.player,{x:.6,z:.6});
 for(let i=0;i<20;i++){
  g.movePlayer(.12,.12);
  assert(!g.covers.some(c=>Math.abs(g.player.x-c.x)<c.w/2+.35&&Math.abs(g.player.z-c.z)<c.d/2+.35));
 }
 g.covers=[{x:0,z:4,w:8,d:.2,h:3}];Object.assign(g.player,{x:0,z:0});
 g.movePlayer(0,9);assert(g.player.z<3.56,'large requested displacements still respect the barrier');
});
test('WAR: blocked movement no longer plays a false walking cadence',()=>{
 const {game:g}=engine('ar','game_ar');g.init({id:'patrol'});g.waveDelay=999;
 g.covers=[{x:0,z:2,w:8,d:2,h:3}];Object.assign(g.player,{x:0,z:.6});
 g.manualStick={x:0,y:1,active:true};g.lastStepSound=-10;g.step(.1);
 assert.equal(g.autoWalking,false);assert.equal(g.lastStepSound,-10);
});
test('WAR: a look drag can begin in the free left side and keeps one independent owner',()=>{
 const source=fs.readFileSync('games/ar/control-modes.js','utf8');
 const method=source.slice(source.indexOf(' combatLook(logic,root){'),source.indexOf(' arControls(logic){'));
 const listeners=new Map(),surface={dataset:{},classList:{add(){},remove(){}},addEventListener(n,fn){listeners.set(n,fn);},removeEventListener(){},getBoundingClientRect:()=>({left:0,top:0,width:844,height:390})};
 const logic={state:'PLAYING',looks:[],lookBy(...v){this.looks.push(v);}};
 const window={System:{canvas:surface,activeGame:{logic},paused:false},addEventListener(){},removeEventListener(){}};
 const document={hidden:false,addEventListener(){},removeEventListener(){}};
 const context={window,document,$:()=>({classList:{contains:()=>false}}),hub:{mode:'controls',releases:[]}};
 vm.runInNewContext('const api={'+method+'};api.combatLook(window.System.activeGame.logic,{hidden:false});',context);
 const pointer=(id,x,y=120)=>({pointerId:id,pointerType:'touch',clientX:x,clientY:y,button:0,preventDefault(){},stopPropagation(){}});
 listeners.get('pointerdown')(pointer(1,120));listeners.get('pointermove')(pointer(1,150));
 assert.equal(logic.looks.length,1);assert.equal(logic.looks[0][0],30);
 listeners.get('pointerdown')(pointer(2,600));listeners.get('pointermove')(pointer(2,650));assert.equal(logic.looks.length,1,'another finger cannot take over');
 listeners.get('pointerup')(pointer(1,150));assert.equal(logic.lookPointerActive,false);
});

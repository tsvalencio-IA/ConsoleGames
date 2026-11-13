/* Exact native Canvas2D renderer comparison. No physics, user account or game data.
 * The reference is the preserved former renderWorld method; the rest of the engine
 * is identical. Real canvases are drawn, and readPixels forces their output. */
import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const out='docs/evidence/evolucao-20261112/kart';fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync('games/kart/js/game_kart.js','utf8'),reference=fs.readFileSync('tests/fixtures/kart-render-world-before.txt','utf8');
const start=source.indexOf('        renderWorld: function(ctx, w, h) {'),end=source.indexOf('\n        drawKartSprite:',start);assert(start>=0&&end>start);
const former=source.slice(0,start)+reference+source.slice(end);
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const report={cases:[],timings:[],errors:[],limits:['Real Chromium Canvas2D pixels and render throughput only. Isolated renderer fixture; no native RAF cadence, full game performance, physical camera, mobile thermal or phone FPS claim.','Initialization/menu/audio are fixture stubs. Both renderers execute unchanged native drawing functions and identical authoritative rival snapshots. No road segments, sprites, effects or rivals are omitted.','Timing may share this three-CPU runner with independent functional checks; report the samples without asserting a universal speedup.']};
try{
 const page=await browser.newPage({viewport:{width:1240,height:480}});page.on('pageerror',e=>report.errors.push(e.stack));
 await page.setContent('<style>body{margin:8px;background:#10232d;color:#dce8e0;font:14px sans-serif}canvas{width:600px;height:277px;display:inline-block;border:1px solid #8caba1}#game-ui{display:none}</style><p>Renderização nativa · referência anterior e candidata</p><canvas id="before" width="844" height="390"></canvas><canvas id="after" width="844" height="390"></canvas><div id="game-ui"></div>');
 await page.evaluate(()=>{
  window.options={distance:'far',quality:'high',steeringAssist:'light',sensitivity:1};
  window.ArcadePlaySettings={get:()=>options};window.ArcadeControls={mode:'controls'};
  window.Sfx={play(){},coin(){},epic(){},click(){},hover(){},error(){}};window.Profile={coins:0};
  window.engines=[];window.System={registerGame:(id,name,emoji,logic)=>engines.push(logic),canvas:document.querySelector('canvas'),msg(){},playerId:'isolated-render',player:{}};
  Date.now=()=>1794508800000;Math.random=()=>.5;
 });
 await page.addScriptTag({content:former});await page.addScriptTag({content:source});
 await page.evaluate(()=>{
  for(const g of engines){g.currentFase={id:'f1',mode:'RACE',targetRank:3};g.setupUI();g.startRace(0);}
  window.renderCase=({quality,rear,track,lap,pos,rivalCount=4})=>{
   options.quality=quality;const outputs=[],metrics=[];
   for(let version=0;version<2;version++){
    const g=engines[version],canvas=document.getElementById(version?'after':'before'),ctx=canvas.getContext('2d',{willReadFrequently:true});
    g.startRace(track);g.lap=lap;g.pos=pos;g.cameraX=.13;g.playerX=.25;g.cameraDepth=7.5;g.arcadeManual={rear};g.rivals=[];let reads=0;
    for(let i=0;i<rivalCount;i++){
     const r={id:'rival-'+i,charId:i%8,kartId:i%7,name:'Piloto '+i,x:(i%3-1)*.6,spinAngle:i%4*.12,status:i===21?'FINISHED':'RACING',color:['#c84','#38b','#8b4'][i%3]};
     const rivalLap=i===23?lap+1:lap,rivalPos=pos+(rear?-1:1)*(i*500-600);
     Object.defineProperties(r,{lap:{get(){reads++;return rivalLap;}},pos:{get(){reads++;return rivalPos;}}});g.rivals.push(r);
    }
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);g.renderWorld(ctx,canvas.width,canvas.height);
    outputs.push(ctx.getImageData(0,0,canvas.width,canvas.height).data);
    metrics.push({rivalFieldReads:reads,rivals:g.rivals.length});
   }
   let changed=0,maxDifference=0;for(let i=0;i<outputs[0].length;i++){const d=Math.abs(outputs[0][i]-outputs[1][i]);if(d)changed++;if(d>maxDifference)maxDifference=d;}
   return{quality,rear,track,lap,pos,rivalCount,changedChannels:changed,maxDifference,channels:outputs[0].length,before:metrics[0],after:metrics[1]};
  };
 });
 for(const rivalCount of[4,24])for(const quality of['low','high'])for(const rear of[false,true])for(let track=0;track<3;track++)for(const [lap,pos]of[[1,27000],[3,680000]]){
  const result=await page.evaluate(v=>renderCase(v),{quality,rear,track,lap,pos,rivalCount});
  assert.equal(result.changedChannels,0,'every Canvas2D channel must match '+JSON.stringify(result));
  assert.equal(result.after.rivalFieldReads,rivalCount*2);assert.equal(result.before.rivalFieldReads,rivalCount*2*(quality==='low'?180:300));report.cases.push(result);
 }
 // Benchmark unchanged full drawing with an actual pixel readback; these are
 // render-method samples rather than measured gameplay frames or phone FPS.
 await page.evaluate(()=>renderCase({quality:'high',rear:false,track:0,lap:1,pos:27000}));
 report.timings=await page.evaluate(()=>{
  const samples=[[],[]];
  for(let round=0;round<12;round++)for(const version of(round%2?[1,0]:[0,1])){
   const g=engines[version],canvas=document.getElementById(version?'after':'before'),ctx=canvas.getContext('2d',{willReadFrequently:true}),t=performance.now();
   for(let i=0;i<10;i++){g.renderWorld(ctx,canvas.width,canvas.height);ctx.getImageData(0,0,canvas.width,canvas.height);}
   samples[version].push((performance.now()-t)/10);
  }
  return samples.map((values,index)=>{const sorted=[...values].sort((a,b)=>a-b);return{label:index?'after':'before',samples:values,meanMs:values.reduce((a,b)=>a+b,0)/values.length,medianMs:sorted[Math.floor(sorted.length/2)],p95Ms:sorted[Math.floor(sorted.length*.95)]};});
 });
 await page.evaluate(()=>renderCase({quality:'high',rear:false,track:2,lap:1,pos:27000}));
 await page.screenshot({path:out+'/render-native-comparison.png',timeout:45000});
 assert.deepEqual(report.errors,[]);report.passed=true;report.browser=browser.version();fs.writeFileSync(out+'/render-native-result.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({passed:true,cases:report.cases.length,changedChannels:0,fieldReadsDefaultHigh:[2400,8],fieldReadsStressHigh:[14400,48],timings:report.timings},null,2));
}catch(error){report.error=error.stack;fs.writeFileSync(out+'/render-native-failure.json',JSON.stringify(report,null,2));throw error;}finally{await browser.close();}

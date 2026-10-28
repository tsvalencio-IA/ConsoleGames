/* Compare the original and optimized physical lighting on the same geometry.
 * Native WebGL drawing, separate renderer caches, no screenshot substitution. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {multiplayerServer} from './helpers/multiplayer-browser-fixture.mjs';

const out='test-results/world-light-budget';fs.mkdirSync(out,{recursive:true});
const server=await multiplayerServer(),browser=await chromium.launch({executablePath:process.env.OT_BROWSER_BINARY||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={browser:browser.version(),cases:[],limits:['Offscreen Chromium software WebGL comparison; no physical Android test.']};
try{
  const page=await browser.newPage({viewport:{width:660,height:280}}),errors=[];page.on('pageerror',e=>errors.push(e.stack));
  await page.goto(server.origin+'/games/otthi/');
  await page.setContent('<style>body{margin:10px;background:#102032;color:#fff;font:14px sans-serif}canvas{display:inline-block!important;vertical-align:top;margin:4px;width:300px;height:225px}</style><div>Referência / otimização — mesma geometria e iluminação visível</div>');
  await page.addScriptTag({url:server.origin+'/games/otthi/assets/vendor/three-r128.min.js'});
  await page.evaluate(()=>{
    const T=THREE;window.world={glows:[]};window.scene=new T.Scene();scene.background=new T.Color(0x24394a);scene.fog=new T.Fog(0x24394a,35,70);
    window.camera=new T.PerspectiveCamera(55,4/3,.1,80);
    scene.add(new T.HemisphereLight(0xc7e5ff,0x304327,.65));const sun=new T.DirectionalLight(0xffe2b0,1.1);sun.position.set(5,12,3);scene.add(sun);
    const floor=new T.Mesh(new T.BoxGeometry(18,.15,18),new T.MeshStandardMaterial({color:0x889c79,roughness:.9}));floor.position.y=-.15;scene.add(floor);
    const sphere=new T.Mesh(new T.SphereGeometry(1,28,18),new T.MeshPhysicalMaterial({color:0x227abe,roughness:.3,metalness:.45,clearcoat:.65}));sphere.position.set(-1.4,1,-1);scene.add(sphere);
    const box=new T.Mesh(new T.BoxGeometry(1.8,2,1.8),new T.MeshStandardMaterial({color:0xcf602c,roughness:.55}));box.position.set(1.5,1,-1);scene.add(box);
    const glass=new T.Mesh(new T.BoxGeometry(1,1.8,.16),new T.MeshPhysicalMaterial({color:0x9ac7dd,roughness:.1,transparent:true,opacity:.32,depthWrite:false}));glass.position.set(.1,1,1);scene.add(glass);
    const add=(x,y,z,color,intensity,range,decay=1)=>{const l=new T.PointLight(color,intensity,range,decay);l.position.set(x,y,z);scene.add(l);world.glows.push(l);return l;};
    add(-3,2,1,0xff8355,1.2,7);add(3,2,-2,0x75bfff,.9,8);add(0,3,-3,0xffffff,.3,5);
    for(let i=0;i<24;i++)add((i%2?1:-1)*(90+i*5),1,i*8-70,0xffaa66,.5,5);
    add(-80,3,20,0x3366ff,.015,0);add(100,1,-30,0x99bb77,.01,3,0);
    const disabled=add(0,3,0,0xff00ff,10,8);disabled.visible=false;
    window.reference=new T.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});window.optimized=new T.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});
    for(const r of[reference,optimized]){r.setSize(300,225);r.setPixelRatio(1);r.outputEncoding=T.sRGBEncoding;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=.94;document.body.appendChild(r.domElement);}
    window.renderer=optimized;window.originalLighting=T.ShaderChunk.lights_fragment_begin;
  });
  await page.addScriptTag({content:fs.readFileSync('games/otthi/src/modules/71-world-light-budget.js','utf8')});
  for(const [name,position]of [['front',[6,4,9]],['side',[-8,4,3]],['above',[1,16,3]]]){
    const result=await page.evaluate(({name,position})=>{
      camera.position.fromArray(position);camera.lookAt(0,.5,0);camera.updateProjectionMatrix();
      const read=r=>{const gl=r.getContext(),pixels=new Uint8Array(300*225*4);gl.readPixels(0,0,300,225,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return pixels;};
      THREE.ShaderChunk.lights_fragment_begin=originalLighting;reference.render(scene,camera);const before=read(reference),originalCalls=reference.info.render.calls;
      configureWorldPointLightEvaluation();const restore=prepareWorldPointLights(camera);let after,stats;
      try{optimized.render(scene,camera);after=read(optimized);stats=OTTHI_LIGHT_BUDGET.diagnostics();}finally{restore?.();}
      let pixelsDifferent=0,maxDifference=0,sumDifference=0,min=255,max=0;for(let i=0;i<before.length;i++){const d=Math.abs(before[i]-after[i]);if(d)pixelsDifferent++;maxDifference=Math.max(maxDifference,d);sumDifference+=d;if(i%4!==3){min=Math.min(min,after[i]);max=Math.max(max,after[i]);}}
      return{name,stats,pixelsDifferent,maxDifference,meanDifference:sumDifference/before.length,range:max-min,callsBefore:originalCalls,callsAfter:optimized.info.render.calls,lightsRestored:world.glows.filter(l=>l.visible).length,paddingRemoved:!scene.children.some(o=>o.name==='OTTHI_LIGHT_PADDING')};
    },{name,position});
    assert(result.stats.culled>=20);assert.equal(result.maxDifference,0,'optimized visible illumination must match every channel');assert(result.range>60,'comparison must draw a real lit scene');assert.equal(result.callsAfter,result.callsBefore);assert.equal(result.lightsRestored,29);assert(result.paddingRemoved);report.cases.push(result);console.log('PASS',JSON.stringify(result));
  }
  await page.screenshot({path:out+'/comparison.png'});assert.deepEqual(errors,[]);report.errors=errors;report.passed=true;fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));
}catch(error){fs.writeFileSync(out+'/failure.json',JSON.stringify({...report,error:error.stack},null,2));throw error;}finally{await browser.close();await server.close();}

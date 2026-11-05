/* Every visible pixel must survive spatial culling of static instances. */
import{chromium}from'playwright';import fs from'node:fs';import assert from'node:assert/strict';import{multiplayerServer}from'./helpers/multiplayer-browser-fixture.mjs';
const out='test-results/world-instance-culling';fs.mkdirSync(out,{recursive:true});const s=await multiplayerServer(),b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),report={cases:[],errors:[]};
try{
 const p=await b.newPage({viewport:{width:660,height:280}});p.on('pageerror',e=>report.errors.push(e.stack));await p.route('**/__instance-qa',r=>r.fulfill({contentType:'text/html',body:'<style>body{background:#123;color:white;margin:4px}canvas{display:inline-block;margin:4px}</style>Referência e desenho com limites exatos<br>'}));await p.goto(s.origin+'/__instance-qa');await p.addScriptTag({url:s.origin+'/games/otthi/assets/vendor/three-r128.min.js'});await p.addScriptTag({content:fs.readFileSync('games/otthi/src/modules/72-static-instance-culling.js','utf8')});
 await p.evaluate(()=>{
  const T=THREE;window.referenceScene=new T.Scene();window.optimizedScene=new T.Scene();window.view=new T.PerspectiveCamera(58,4/3,.1,1200);window.renderers=[];
  const material=new T.MeshStandardMaterial({color:0x6894a5,metalness:.25,roughness:.48}),glass=new T.MeshStandardMaterial({color:0x85afb3,transparent:true,opacity:.25,depthWrite:false}),matrices=[];
  for(let i=0;i<280;i++)matrices.push(new T.Matrix4().compose(new T.Vector3((i%31-15)*16,1+(i%3)*.3,Math.floor(i/31)*16-60),new T.Quaternion().setFromEuler(new T.Euler(0,i*.13,0)),new T.Vector3(2+(i%4),2+(i%3)*.6,2.2)));
  for(const[scene,index]of[[referenceScene,0],[optimizedScene,1]]){
   scene.background=new T.Color(0x294451);scene.add(new T.HemisphereLight(0xbcd8e8,0x3b5137,.7));const sun=new T.DirectionalLight(0xffe3bc,1.1);sun.position.set(5,18,7);scene.add(sun);const root=new T.Group();root.rotation.y=.11;root.scale.set(-1,1.2,.95);scene.add(root);
   for(const[m,items]of[[material,matrices],[glass,matrices.slice(0,12).map(q=>new T.Matrix4().makeTranslation(.1,0,.1).multiply(q))]]){
    if(!index){const mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),m,items.length);items.forEach((a,i)=>mesh.setMatrixAt(i,a));mesh.frustumCulled=false;root.add(mesh);}else for(const mesh of createBoundedWorldBoxInstances(m,items))root.add(mesh);
   }
   const renderer=new T.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});renderer.setSize(300,225);renderer.setPixelRatio(1);renderer.outputEncoding=T.sRGBEncoding;document.body.append(renderer.domElement);renderers.push(renderer);
  }
 });
 for(const[position,target]of [[[0,6,14],[0,1,-10]],[[40,9,42],[10,1,-20]],[[-80,8,-5],[-70,1,-30]]]){
  const result=await p.evaluate(({position,target})=>{view.position.fromArray(position);view.lookAt(...target);view.updateProjectionMatrix();const pixels=renderers.map((r,i)=>{r.render(i?optimizedScene:referenceScene,view);const a=new Uint8Array(300*225*4),gl=r.getContext();gl.readPixels(0,0,300,225,gl.RGBA,gl.UNSIGNED_BYTE,a);return a;});let different=0,maxDifference=0;for(let i=0;i<pixels[0].length;i++){const d=Math.abs(pixels[0][i]-pixels[1][i]);if(d)different++;maxDifference=Math.max(maxDifference,d);}return{position,different,maxDifference,before:{...renderers[0].info.render},after:{...renderers[1].info.render}};},{position,target});
  assert.equal(result.different,0,'every output channel must match the uncullled reference');assert(result.after.triangles<result.before.triangles,'offscreen triangles should not reach the renderer');report.cases.push(result);console.log('PIXELS',JSON.stringify(result));
 }
 await p.screenshot({path:out+'/comparison.png'});assert.deepEqual(report.errors,[]);report.passed=true;fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));
}catch(e){fs.writeFileSync(out+'/failure.json',JSON.stringify({...report,failure:e.stack},null,2));throw e;}finally{await b.close();await s.close();}

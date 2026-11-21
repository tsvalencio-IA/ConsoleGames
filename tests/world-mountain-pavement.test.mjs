import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const modules=fs.realpathSync('games/otthi/src/modules');
const read=name=>fs.readFileSync(`${modules}/${name}.js`,'utf8');
const alpineRoute=/^ottovias-(snow-pass|serra-loop|serra-access)$/;

function loadGeometry(){
 const ctx=vm.createContext({window:{},state:{profile:{playerId:'pavement-geometry'}},console});
 vm.runInContext(fs.readFileSync('games/otthi/assets/vendor/three-r128.min.js','utf8'),ctx);
 vm.runInContext(read('05a-world-layout-v704'),ctx);
 vm.runInContext(`const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x)),lerp=(a,b,t)=>a+(b-a)*t;
  const worldGroup=new THREE.Group(),worldExpansion={ready:true},CITY_SIGNALS=[],cordillera={chunks:[]};
  let updateWorldExpansion=()=>{};
  const projectPointToSegment=v704DistanceToSegment,loadWorldTexture=()=>null;`,ctx);
 const terrain=read('40-world-evolution-v702');
 vm.runInContext(terrain.slice(terrain.indexOf('  const extendedTerrainRoads='),terrain.indexOf('  function v702TextureMaterial')),ctx);
 vm.runInContext(read('50-world-road-continuity'),ctx);
 const chunks=read('63-cordillera-forest');
 vm.runInContext(chunks.slice(chunks.indexOf(' function cordilleraChunk('),chunks.indexOf(' function createCordilleraForest(')),ctx);
 return vm.runInContext(`(()=>{
  const routePattern=${alpineRoute};
  const allRoutes=worldRoadRoutes();
  // Keep this test focused on the physical corridor and mountain meshes.
  worldRoadRoutes=()=>allRoutes.filter(route=>routePattern.test(route.id));
  createWorldRoadContinuity();
  const surfaces=worldRoadContinuity.root.children.filter(mesh=>mesh.name.startsWith('ROAD_NETWORK_ASPHALT'));
  const asphalt=surfaces.map(mesh=>mesh.geometry.attributes.position);
  return {height:professionalTerrainHeightAt,asphalt,segments:extendedTerrainRoads.filter(segment=>routePattern.test(segment.highwayId)),
   chunk:(x,z)=>{cordilleraChunk(x,z);return cordillera.chunks.at(-1).mesh.geometry.attributes.position;},counts:worldRoadContinuity.geometry,
   regions:surfaces.map(mesh=>({culled:mesh.frustumCulled,radius:mesh.geometry.boundingSphere.radius}))};
 })()`,ctx);
}

function roadSurfaceHeight(surfaces){
 const cells=new Map(),size=4;
 for(const positions of surfaces)for(let i=0;i<positions.count;i+=3){
  const points=[i,i+1,i+2].map(j=>({x:positions.getX(j),z:positions.getZ(j),y:positions.getY(j)}));
  const minX=Math.floor(Math.min(...points.map(p=>p.x))/size),maxX=Math.floor(Math.max(...points.map(p=>p.x))/size);
  const minZ=Math.floor(Math.min(...points.map(p=>p.z))/size),maxZ=Math.floor(Math.max(...points.map(p=>p.z))/size);
  for(let cx=minX;cx<=maxX;cx++)for(let cz=minZ;cz<=maxZ;cz++){
   const key=`${cx}:${cz}`;
   if(!cells.has(key))cells.set(key,[]);
   cells.get(key).push(points);
  }
 }
 return (x,z)=>{
  let y=-Infinity;
  for(const [a,b,c] of cells.get(`${Math.floor(x/size)}:${Math.floor(z/size)}`)||[]){
   const det=(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
   if(Math.abs(det)<1e-8)continue;
   const u=((x-a.x)*(c.z-a.z)-(z-a.z)*(c.x-a.x))/det;
   const v=((b.x-a.x)*(z-a.z)-(b.z-a.z)*(x-a.x))/det;
   if(u>=-1e-5&&v>=-1e-5&&u+v<=1.00001)y=Math.max(y,a.y+(b.y-a.y)*u+(c.y-a.y)*v);
  }
  return y;
 };
}

function terrainMeshHeight(chunk){
 const chunks=new Map(),size=92,step=size/40;
 return (x,z)=>{
  if(x< -230||x>=782||z<184||z>=460)return -Infinity;
  const west=Math.floor((x+230)/size)*size-230,north=Math.floor((z-184)/size)*size+184;
  const key=`${west}:${north}`;
  if(!chunks.has(key))chunks.set(key,chunk(west+size/2,north+size/2));
  const positions=chunks.get(key),gx=(x-west)/step,gz=(z-north)/step,i=Math.floor(gx),j=Math.floor(gz),u=gx-i,v=gz-j;
  const h=(dx,dz)=>positions.getY((j+dz)*41+i+dx);
  return u+v<=1?h(0,0)+(h(1,0)-h(0,0))*u+(h(0,1)-h(0,0))*v:h(1,1)+(h(0,1)-h(1,1))*(1-u)+(h(1,0)-h(1,1))*(1-v);
 };
}

test('all three graded mountain roads follow the physical slope with clear pavement at the joins',t=>{
 const {height,asphalt,segments,chunk,counts,regions}=loadGeometry();
 assert(regions.length>1&&regions.every(region=>region.culled&&region.radius<170),'refined meshes remain cullable by the world renderer');
 // The original nearest-road switch jumped 1.45 m at this 1 mm crossing.
 const priorSeam=Math.abs(height(6.25,259.751)-height(6.25,259.75));
 assert(priorSeam<.002,`the Passo da Neve seam moved ${priorSeam} m`);
 const roadY=roadSurfaceHeight(asphalt),terrainY=terrainMeshHeight(chunk);
 let points=0,maxError=0,maxCover=0,maxStep=0;
 const worst={};
 for(const segment of segments){
  const {a,b}=segment,dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),steps=Math.ceil(length/1.5);
  for(let i=0;i<=steps;i++)for(const offset of[-3.8,0,3.8]){
   const x=a.x+dx*i/steps-dz/length*offset,z=a.z+dz*i/steps+dx/length*offset;
   const road=roadY(x,z),physical=height(x,z);
   assert(Number.isFinite(road),`hole in ${segment.highwayId} at ${x}, ${z}`);
   const error=Math.abs(road-.105-physical),cover=terrainY(x,z)-road;
   if(error>maxError){maxError=error;worst.error={x,z,error};}
   if(cover>maxCover){maxCover=cover;worst.cover={x,z,cover};}
   maxStep=Math.max(maxStep,Math.abs(height(x+.001,z)-physical),Math.abs(height(x,z+.001)-physical));
   points++;
  }
 }
 t.diagnostic(JSON.stringify({points,priorSeam,maxError,maxCover,maxStep,counts,worst}));
 assert(points>3000);
 assert(maxStep<.004,`physical pavement has a sudden step of ${maxStep} m`);
 assert(maxError<.13,`visual pavement departs from physics by ${maxError} m`);
 assert(maxCover<.018,`terrain shows over the asphalt by ${maxCover} m`);
});

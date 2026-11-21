/** One textured, graded road network; connected junctions at every detail level. */
// @otthi-module-body
 const worldRoadContinuity={ready:false,root:null,geometry:null};
 function worldRoadRoutes(){return[...WORLD_LAYOUT_V704.roads.map(r=>({id:r.id,kind:r.kind||'street',width:Math.min(r.w,r.d),shoulder:0,closed:false,points:r.w>=r.d?[{x:r.x-r.w/2,z:r.z},{x:r.x+r.w/2,z:r.z}]:[{x:r.x,z:r.z-r.d/2},{x:r.x,z:r.z+r.d/2}]})),...WORLD_LAYOUT_V704.highways.filter(h=>!h.usesExistingRoad).map(h=>({...h,kind:'highway'}))];}
 function roadNormal(a,b){const dx=b.x-a.x,dz=b.z-a.z,n=Math.hypot(dx,dz)||1;return{x:-dz/n,z:dx/n};}
 function roadJoinedPoint(route,index,offset){const p=route.points,n=roadNormal(p[index],p[(index+1)%p.length]);if(!route.closed&&index===0)return{x:p[0].x+n.x*offset,z:p[0].z+n.z*offset};if(!route.closed&&index===p.length-1){const q=roadNormal(p[index-1],p[index]);return{x:p[index].x+q.x*offset,z:p[index].z+q.z*offset};}const prev=roadNormal(p[(index-1+p.length)%p.length],p[index]),len=Math.hypot(n.x+prev.x,n.z+prev.z)||1,m={x:(n.x+prev.x)/len,z:(n.z+prev.z)/len},dot=m.x*n.x+m.z*n.z,scale=offset*clamp(1/Math.max(.1,dot),1,1.8);return{x:p[index].x+m.x*scale,z:p[index].z+m.z*scale};}
 function roadJunctionAt(x,z,route,index,margin=1.1){const a=route.points[index],b=route.points[(index+1)%route.points.length],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;for(const other of(worldRoadContinuity.routes||worldRoadRoutes())){if(other.id===route.id)continue;for(let i=0;i<other.points.length-(other.closed?0:1);i++){const c=other.points[i],d=other.points[(i+1)%other.points.length],ox=d.x-c.x,oz=d.z-c.z,ol=Math.hypot(ox,oz)||1;if(Math.abs((dx*ox+dz*oz)/(len*ol))>.985)continue;const q=projectPointToSegment({x,z},c,d);if(Math.hypot(x-q.x,z-q.z)<other.width/2+margin)return true;}}return false;}
 function createWorldRoadContinuity(){
  if(worldRoadContinuity.ready||!worldExpansion.ready)return;
  const root=new THREE.Group();root.name='OTTHI_CONTINUOUS_ROAD_SURFACE';worldGroup.add(root);
  const routes=worldRoadRoutes();worldRoadContinuity.routes=routes;
  const layers=()=>({asphalt:[],shoulder:[],white:[],yellow:[]});
  const base={parts:layers(),uv:layers()},regions=new Map();
  let regional=false;
  function triangle(kind,a,b,c,h){
   let batch=base;
   if(regional){
    // Keep the finer mountain geometry out of the render budget from town.
    // A whole triangle belongs to one cell, so batching cannot open seams.
    const cellSize=128,key=Math.floor((a.x+b.x+c.x)/(3*cellSize))+'_'+Math.floor((a.z+b.z+c.z)/(3*cellSize));
    if(!regions.has(key))regions.set(key,{parts:layers(),uv:layers()});
    batch=regions.get(key);
   }
   for(const p of[a,b,c]){
    batch.parts[kind].push(p.x,(p.roadY??professionalTerrainHeightAt(p.x,p.z))+h,p.z);
    batch.uv[kind].push(p.x*.22,p.z*.22);
   }
  }
  const strip=(kind,a,b,c,d,h)=>{triangle(kind,a,b,c,h);triangle(kind,a,c,d,h);};
  const interpolate=(a,b,t)=>({x:lerp(a.x,b.x,t),z:lerp(a.z,b.z,t)});
  const gradedRoutes=new Set(routes.filter(r=>r.points.some(p=>Number(p.y)!==0&&Number.isFinite(p.y))));
  function gradedRow(left,right,bands){
   const points=Array.from({length:bands+1},(_,i)=>{
    const t=i/bands,p=interpolate(left,right,t);return {...p,t,roadY:professionalTerrainHeightAt(p.x,p.z)};
   });
   // Preserve a shared edge between strips and discard only samples which are
   // within tolerance of that edge's piecewise-linear height.
   const row=[points[0]];
   function appendSpan(start,end){
    let split=-1,error=.01;
    for(let i=start+1;i<end;i++){
     const deviation=Math.abs(points[i].roadY-lerp(points[start].roadY,points[end].roadY,(i-start)/(end-start)));
     if(deviation>error){error=deviation;split=i;}
    }
    if(split>=0){appendSpan(start,split);appendSpan(split,end);}else row.push(points[end]);
   }
   appendSpan(0,bands);return row;
  }
  const ribbon=(r,i,offset,width,kind,h,from=0,to=1)=>{
   const j=(i+1)%r.points.length,a=roadJoinedPoint(r,i,offset+width/2),b=roadJoinedPoint(r,j,offset+width/2),c=roadJoinedPoint(r,j,offset-width/2),d=roadJoinedPoint(r,i,offset-width/2);
   const length=Math.hypot(r.points[j].x-r.points[i].x,r.points[j].z-r.points[i].z),graded=gradedRoutes.has(r),steps=Math.max(1,Math.ceil(length*(to-from)/(graded?1:2)));
   // A two-triangle strip spanning the whole carriageway missed the cross
   // slope at merges. Sample the same terrain used by the wheels across it.
   const bands=graded?Math.max(1,Math.ceil(width/1.1)):1;
   const rowAt=t=>{const left=interpolate(a,b,t),right=interpolate(d,c,t);return graded?gradedRow(left,right,bands):[{...left,t:0},{...right,t:1}];};
   let prior=rowAt(from);
   for(let k=1;k<=steps;k++){
    const row=rowAt(lerp(from,to,k/steps));
    let p=0,q=0;
    while(p<prior.length-1||q<row.length-1){
     if(q<row.length-1&&(p===prior.length-1||row[q+1].t<=prior[p+1].t))triangle(kind,prior[p],row[q],row[++q],h);
     else triangle(kind,prior[p],row[q],prior[++p],h);
    }
    prior=row;
   }
  };
  const disc=(p,r,kind,h,graded)=>{
   const rings=graded?Math.ceil(r/1.1):1,sides=28;
   for(let k=0;k<sides;k++){
    const a=k*Math.PI*2/sides,b=(k+1)*Math.PI*2/sides,point=(angle,distance)=>({x:p.x+Math.cos(angle)*distance,z:p.z+Math.sin(angle)*distance});
    triangle(kind,p,point(b,r/rings),point(a,r/rings),h);
    for(let j=1;j<rings;j++)strip(kind,point(a,j*r/rings),point(b,j*r/rings),point(b,(j+1)*r/rings),point(a,(j+1)*r/rings),h);
   }
  };
  for(const r of routes){
   const graded=gradedRoutes.has(r);
   regional=graded;
   for(let i=0;i<r.points.length-(r.closed?0:1);i++){
    if(r.shoulder)ribbon(r,i,0,r.width+r.shoulder*2,'shoulder',.064);
    ribbon(r,i,0,r.width+.10,'asphalt',.105);
    const a=r.points[i],b=r.points[(i+1)%r.points.length],length=Math.hypot(b.x-a.x,b.z-a.z);
    const mark=(offset,width,kind,dash=false)=>{
     let start=null;const n=Math.max(1,Math.ceil(length/.8));
     for(let k=0;k<=n;k++){
      const t=k/n,x=lerp(a.x,b.x,t),z=lerp(a.z,b.z,t),valid=k<n&&!roadJunctionAt(x,z,r,i,1.1)&&(!dash||(t*length)%6.5<3.5);
      if(valid&&start===null)start=t;
      if(!valid&&start!==null){ribbon(r,i,offset,width,kind,graded?.132:.114,start,t);start=null;}
     }
    };
    mark(-.13,.095,'yellow',r.kind==='street');mark(.13,.095,'yellow',r.kind==='street');mark(-r.width/2+.38,.10,'white');mark(r.width/2-.38,.10,'white');
    if(r.width>=12.3){mark(-3.15,.08,'white',true);mark(3.15,.08,'white',true);}
   }
   for(const p of r.points){
    if(r.shoulder)disc(p,(r.width+r.shoulder*2)/2,'shoulder',.064,graded);
    disc(p,(r.width+.10)/2,'asphalt',.105,graded);
   }
  }
  regional=false;
  const paint=(x,z,w,d)=>strip('white',{x:x-w/2,z:z-d/2},{x:x+w/2,z:z-d/2},{x:x+w/2,z:z+d/2},{x:x-w/2,z:z+d/2},.117);
  for(const j of CITY_SIGNALS)for(const sign of[-1,1]){for(let u=-j.ns/2+.5;u<j.ns/2-.5;u+=.95)paint(j.x+u,j.z+sign*(j.ew/2+1.05),.5,1.5);for(let u=-j.ew/2+.5;u<j.ew/2-.5;u+=.95)paint(j.x+sign*(j.ns/2+1.05),j.z+u,1.5,.5);paint(j.x-sign*j.ns/4,j.z+sign*(j.ew/2+2.15),j.ns/2-.65,.18);paint(j.x+sign*(j.ns/2+2.15),j.z+sign*j.ew/4,.18,j.ew/2-.65);}
  const asphalt=new THREE.MeshStandardMaterial({color:0x747b80,roughness:.94,side:THREE.DoubleSide});try{asphalt.map=loadWorldTexture('road','basecolor',{repeat:[1,1],color:true});asphalt.normalMap=loadWorldTexture('road','normal',{repeat:[1,1]});asphalt.normalScale.set(.24,.24);asphalt.roughnessMap=loadWorldTexture('road','roughness',{repeat:[1,1]});}catch{}
  const mats={asphalt,shoulder:new THREE.MeshStandardMaterial({color:0x88918b,roughness:1,side:THREE.DoubleSide}),white:new THREE.MeshStandardMaterial({color:0xe4e6d9,roughness:.85,side:THREE.DoubleSide}),yellow:new THREE.MeshStandardMaterial({color:0xe8bd36,roughness:.86,side:THREE.DoubleSide})};
  const counts={asphalt:0,shoulder:0,white:0,yellow:0};
  for(const [key,{parts,uv}] of [['',base],...regions])for(const [kind,vertices] of Object.entries(parts)){
   if(!vertices.length)continue;
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv[kind],2));geo.computeVertexNormals();geo.computeBoundingSphere();
   const mesh=new THREE.Mesh(geo,mats[kind]);mesh.name='ROAD_NETWORK_'+kind.toUpperCase()+(key?'_'+key:'');mesh.frustumCulled=!!key;mesh.receiveShadow=true;mesh.userData.criticalSurface=!key;root.add(mesh);counts[kind]+=vertices.length/9;
  }
  for(const b of WORLD_LAYOUT_V704.roadBridges)for(const side of[-1,1]){const mat=new THREE.MeshStandardMaterial({color:0x92a4aa,roughness:.65,metalness:.25}),rail=new THREE.Mesh(new THREE.BoxGeometry(b.deckLength,.12,.12),mat);rail.position.set(b.x,b.deckHeight+.7,b.z+side*(b.width/2+.2));root.add(rail);for(const x of[-b.deckLength/2,b.deckLength/2]){const post=new THREE.Mesh(new THREE.BoxGeometry(.18,.8,.18),mat);post.position.set(b.x+x,b.deckHeight+.35,b.z+side*(b.width/2+.2));root.add(post);}}
  worldRoadContinuity.ready=true;worldRoadContinuity.root=root;worldRoadContinuity.geometry=counts;
 }
  function worldDrivableAudit(){const failures=[];let samples=0;const check=(x,z,id)=>{samples++;if(positionBlockedForPlayer(x,z,.45,{ignoreTraffic:true,ignoreParkedVehicles:true}))failures.push({id,x,z,water:!!waterAt(x,z),height:groundHeightAt(x,z)});};for(const seg of v704HighwaySegments()){const dx=seg.b.x-seg.a.x,dz=seg.b.z-seg.a.z,n=Math.ceil(Math.hypot(dx,dz)/4),len=Math.hypot(dx,dz)||1;for(let i=0;i<=n;i++)for(const side of[-1,1])check(seg.a.x+dx*i/n+dz/len*side*seg.width*.245,seg.a.z+dz*i/n-dx/len*side*seg.width*.245,seg.id);}for(const r of WORLD_LAYOUT_V704.roads){const horizontal=r.w>r.d,len=Math.max(r.w,r.d),width=Math.min(r.w,r.d),n=Math.ceil(len/4);for(let i=0;i<=n;i++)for(const side of[-1,1])check(r.x+(horizontal?-len/2+len*i/n:side*width*.245),r.z+(horizontal?side*width*.245:-len/2+len*i/n),r.id);}return{passed:failures.length===0,samples,failures};}
 const roadContinuityOldExpansion=updateWorldExpansion;updateWorldExpansion=function(){roadContinuityOldExpansion();createWorldRoadContinuity();};
 window.OTTHI_ROAD_CONTINUITY={diagnostics:()=>({ready:worldRoadContinuity.ready,textured:!!worldRoadContinuity.root?.getObjectByName('ROAD_NETWORK_ASPHALT')?.material.map,routes:worldRoadRoutes().length,geometry:worldRoadContinuity.geometry,bridges:WORLD_LAYOUT_V704.roadBridges.map(b=>({...b}))}),driveAudit:worldDrivableAudit};

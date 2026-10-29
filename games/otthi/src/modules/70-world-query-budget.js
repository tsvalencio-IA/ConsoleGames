/** Broad-phase queries preserve the existing precise collision predicates. */
// @otthi-module-body
  var worldQueryBudget={active:0,frame:0,colliders:null,roads:null,stats:{colliderQueries:0,colliderValidations:0,colliderRebuilds:0,roadQueries:0,roadValidations:0,roadRebuilds:0}};
  function beginWorldQueryFrame(){if(worldQueryBudget&&worldQueryBudget.active++===0)worldQueryBudget.frame++;}
  function endWorldQueryFrame(){if(worldQueryBudget)worldQueryBudget.active=Math.max(0,worldQueryBudget.active-1);}
  function worldQueryFrameChecked(record){return !!worldQueryBudget?.active&&record?.checkedFrame===worldQueryBudget.frame;}
  function markWorldQueryFrame(record){record.checkedFrame=worldQueryBudget?.active?worldQueryBudget.frame:-1;}
  function nearbyWorldColliders(x,z,radiusX=.48,radiusZ=radiusX){
    const source=world.colliders;if(!worldQueryBudget||!source||![x,z,radiusX,radiusZ].every(Number.isFinite))return source||[];
    const stats=worldQueryBudget.stats;stats.colliderQueries++;let cache=worldQueryBudget.colliders;
    let rebuild=!cache||cache.source!==source||cache.records.length!==source.length;
    if(!rebuild&&!worldQueryFrameChecked(cache)){
      stats.colliderValidations++;
      for(let i=0;i<source.length;i++){const c=source[i],r=cache.records[i];if(r.object!==c||r.dynamic!==!!c.aircraftId||!r.dynamic&&(r.x!==c.x||r.z!==c.z||r.w!==c.w||r.d!==c.d)){rebuild=true;break;}}
    }
    if(rebuild){
      cache={source,records:[],cells:new Map(),loose:[],scratch:[],stamp:0,checkedFrame:-1};stats.colliderRebuilds++;
      for(const c of source){const r={object:c,x:c.x,z:c.z,w:c.w,d:c.d,dynamic:!!c.aircraftId,stamp:0};cache.records.push(r);
        if(r.dynamic||![c.x,c.z,c.w,c.d].every(Number.isFinite)||c.w<0||c.d<0){cache.loose.push(r);continue;}
        const x0=Math.floor((c.x-c.w/2)/16),x1=Math.floor((c.x+c.w/2)/16),z0=Math.floor((c.z-c.d/2)/16),z1=Math.floor((c.z+c.d/2)/16);
        if((x1-x0+1)*(z1-z0+1)>64){cache.loose.push(r);continue;}
        for(let ix=x0;ix<=x1;ix++)for(let iz=z0;iz<=z1;iz++){const key=ix+':'+iz;let bucket=cache.cells.get(key);if(!bucket)cache.cells.set(key,bucket=[]);bucket.push(r);}
      }
      worldQueryBudget.colliders=cache;
    }
    markWorldQueryFrame(cache);
    const rx=Math.abs(radiusX),rz=Math.abs(radiusZ),x0=Math.floor((x-rx)/16),x1=Math.floor((x+rx)/16),z0=Math.floor((z-rz)/16),z1=Math.floor((z+rz)/16);
    if((x1-x0+1)*(z1-z0+1)>64)return source;
    const result=cache.scratch;result.length=0;const stamp=++cache.stamp;
    for(let ix=x0;ix<=x1;ix++)for(let iz=z0;iz<=z1;iz++){const bucket=cache.cells.get(ix+':'+iz);if(bucket)for(const r of bucket)if(r.stamp!==stamp){r.stamp=stamp;result.push(r.object);}}
    // Parked/recovering aircraft move during the frame: always inspect their
    // current bounds rather than storing a stale position in the grid.
    for(const r of cache.loose)result.push(r.object);
    return result;
  }
  function cachedWorldHighwaySegments(){
    const source=WORLD_LAYOUT_V704.highways||[];let cache=worldQueryBudget?.roads,rebuild=!cache||cache.source!==source||cache.records.length!==source.length;
    if(worldQueryBudget)worldQueryBudget.stats.roadQueries++;
    if(!rebuild&&!worldQueryFrameChecked(cache)){
      worldQueryBudget.stats.roadValidations++;
      for(let i=0;i<source.length;i++){const h=source[i],r=cache.records[i],points=h.points||[];if(r.object!==h||r.id!==h.id||r.points!==points||r.width!==Number(h.width||10)||r.shoulder!==Number(h.shoulder||0)||r.closed!==!!h.closed||r.vertices.length!==points.length){rebuild=true;break;}for(let j=0;j<points.length;j++)if(r.vertices[j]!==points[j]||r.coordinates[j*2]!==points[j].x||r.coordinates[j*2+1]!==points[j].z){rebuild=true;break;}if(rebuild)break;}
    }
    if(rebuild){
      cache={source,records:[],segments:[],checkedFrame:-1};if(worldQueryBudget)worldQueryBudget.stats.roadRebuilds++;
      for(const h of source){const points=h.points||[];cache.records.push({object:h,id:h.id,points,vertices:points.slice(),coordinates:points.flatMap(p=>[p.x,p.z]),width:Number(h.width||10),shoulder:Number(h.shoulder||0),closed:!!h.closed});for(let i=0;i<points.length-(h.closed?0:1);i++)cache.segments.push({id:`${h.id}-${i}`,highwayId:h.id,index:i,a:points[i],b:points[(i+1)%points.length],width:Number(h.width||10),shoulder:Number(h.shoulder||0)});}
      if(worldQueryBudget)worldQueryBudget.roads=cache;
    }
    markWorldQueryFrame(cache);return cache.segments;
  }
  function nearbyWorldHighwaySegments(x,z,margin=0){
    const segments=cachedWorldHighwaySegments(),cache=worldQueryBudget?.roads;
    if(!cache||typeof margin!=='number'||!Number.isFinite(margin))return segments;
    if(!cache.spatial){
      const cells=new Map(),loose=[];
      for(const seg of segments){const pad=seg.width/2+seg.shoulder+.000001,minX=Math.min(seg.a.x,seg.b.x)-pad,maxX=Math.max(seg.a.x,seg.b.x)+pad,minZ=Math.min(seg.a.z,seg.b.z)-pad,maxZ=Math.max(seg.a.z,seg.b.z)+pad;
        const record={seg,stamp:0},x0=Math.floor(minX/32),x1=Math.floor(maxX/32),z0=Math.floor(minZ/32),z1=Math.floor(maxZ/32);
        if(![minX,maxX,minZ,maxZ].every(Number.isFinite)||pad<0||(x1-x0+1)*(z1-z0+1)>512){loose.push(record);continue;}
        for(let ix=x0;ix<=x1;ix++)for(let iz=z0;iz<=z1;iz++){const key=ix+':'+iz;let bucket=cells.get(key);if(!bucket)cells.set(key,bucket=[]);bucket.push(record);}
      }
      cache.spatial={cells,loose,scratch:[],stamp:0};
    }
    const index=cache.spatial,r=Math.max(0,margin),x0=Math.floor((x-r)/32),x1=Math.floor((x+r)/32),z0=Math.floor((z-r)/32),z1=Math.floor((z+r)/32);
    if((x1-x0+1)*(z1-z0+1)>64)return segments;
    const result=index.scratch;result.length=0;const stamp=++index.stamp;
    for(let ix=x0;ix<=x1;ix++)for(let iz=z0;iz<=z1;iz++){const bucket=index.cells.get(ix+':'+iz);if(bucket)for(const record of bucket)if(record.stamp!==stamp){record.stamp=stamp;result.push(record.seg);}}
    for(const record of index.loose)result.push(record.seg);
    return result;
  }
  window.OTTHI_QUERY_BUDGET={diagnostics:()=>({...worldQueryBudget.stats,colliders:worldQueryBudget.colliders?.records.length||0,cells:worldQueryBudget.colliders?.cells.size||0,roadSegments:worldQueryBudget.roads?.segments.length||0})};

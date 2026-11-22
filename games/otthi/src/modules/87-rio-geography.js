/** Real street graph and footprint queries for the independently loaded Rio Preto map. */
// @otthi-module-body
  const rioMap={
    active:false,data:null,geo:null,tiles:new Map(),sites:new Map(),lastStream:0,
    order:null,legacyWaypoint:null,vehicle:null
  };
  function inRioMap(){return rioMap.active;}
  function rioMapSave(){
    const saved=state.cityServices.rioMap??={version:2,position:null,visits:{},waypoint:null};
    if(saved.version===1){delete saved.vehicle;saved.version=2;}
    saved.roadVehicles??={};
    saved.visits??={};
    return saved;
  }
  async function loadRioMap(){
    if(rioMap.data)return;
    const url=new URL('assets/world/rio-preto-map.json',OTTHI_GAME_LIVE_BASE);
    const response=await fetch(url,{cache:'no-cache'});
    if(!response.ok)throw Error('O mapa de Rio Preto não pôde ser carregado. Confira a atualização e tente novamente.');
    const data=await response.json();
    if(data.version!==1||!Array.isArray(data.sites)||!data.nodes?.length||!data.roads?.length)throw Error('O mapa de Rio Preto está incompleto.');
    rioMap.geo=indexRioGeography(data);
    rioMap.data=data;
  }

  function rioSpatialGrid(size){
    const cells=new Map();
    const axis=v=>Math.floor(v/size);
    function visit(x0,z0,x1,z1,callback){
      for(let ix=axis(x0);ix<=axis(x1);ix++)for(let iz=axis(z0);iz<=axis(z1);iz++)callback(ix+':'+iz);
    }
    return {
      insert(object,[x0,z0,x1,z1]){visit(x0,z0,x1,z1,key=>{
        if(!cells.has(key))cells.set(key,[]);
        cells.get(key).push(object);
      });},
      query(x,z,reach=0){
        const local=cells.get(axis(x)+':'+axis(z));
        if(!reach)return local||[];
        if(axis(x-reach)===axis(x+reach)&&axis(z-reach)===axis(z+reach))return local||[];
        const result=new Set();
        visit(x-reach,z-reach,x+reach,z+reach,key=>{for(const item of cells.get(key)||[])result.add(item);});
        return result;
      }
    };
  }
  function rioCoordinateBounds(points){
    let minX=Infinity,minZ=Infinity,maxX=-Infinity,maxZ=-Infinity;
    for(const [x,z] of points){
      minX=Math.min(x,minX);maxX=Math.max(x,maxX);minZ=Math.min(z,minZ);maxZ=Math.max(z,maxZ);
    }
    return [minX,minZ,maxX,maxZ];
  }
  function rioSegmentProjection(x,z,a,b){
    const dx=b[0]-a[0],dz=b[1]-a[1],length2=dx*dx+dz*dz;
    const t=length2?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/length2)):0;
    return {x:a[0]+dx*t,z:a[1]+dz*t,t};
  }
  function rioInsideRing(x,z,ring){
    let inside=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const [x1,z1]=ring[j],[x2,z2]=ring[i];
      if((z1>z)!==(z2>z)&&x<(x2-x1)*(z-z1)/(z2-z1)+x1)inside=!inside;
    }
    return inside;
  }
  function rioWithinFootprint(x,z,rings,radius=0){
    if(rioInsideRing(x,z,rings[0])&&!rings.slice(1).some(hole=>rioInsideRing(x,z,hole)))return true;
    if(radius<=0)return false;
    for(const ring of rings)for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const closest=rioSegmentProjection(x,z,ring[j],ring[i]);
      if((x-closest.x)**2+(z-closest.z)**2<radius*radius)return true;
    }
    return false;
  }

  const rioPedestrianClasses=new Set(['footway','path','pedestrian','cycleway','steps']);
  const rioCityTileSize=160;
  function indexRioGeography(data){
    const roads=rioSpatialGrid(50),buildings=rioSpatialGrid(32),water=rioSpatialGrid(95),tiles=new Map();
    const points=data.nodes,adjacency=points.map(()=>[]);
    const at=(x,z)=>{
      const ix=Math.floor(x/rioCityTileSize),iz=Math.floor(z/rioCityTileSize),key=ix+':'+iz;
      if(!tiles.has(key))tiles.set(key,{ix,iz,key,roads:[],buildings:[],parks:[],trees:[],sites:[]});
      return tiles.get(key);
    };
    const tileAtBounds=([x0,z0,x1,z1])=>at((x0+x1)/2,(z0+z1)/2);
    for(const [id,kind,width,name,oneway,bridge,restricted,ids] of data.roads){
      const pedestrian=rioPedestrianClasses.has(kind);
      for(let i=1;i<ids.length;i++){
        const a=points[ids[i-1]],b=points[ids[i]];
        const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
        if(length<.05)continue;
        const segment={id,a,b,width,kind,name,pedestrian,bridge:!!bridge,restricted:!!restricted,
          start:ids[i-1],end:ids[i],oneway:!!oneway,length};
        const [x0,z0,x1,z1]=rioCoordinateBounds([a,b]),pad=width/2+.1;
        roads.insert(segment,[x0-pad,z0-pad,x1+pad,z1+pad]);
        tileAtBounds([x0,z0,x1,z1]).roads.push(segment);
        if(!restricted){
          adjacency[segment.start].push({to:segment.end,segment});
          adjacency[segment.end].push({to:segment.start,segment,reverse:true});
        }
      }
    }
    for(const [id,height,kind,rings] of data.buildings){
      const bounds=rioCoordinateBounds(rings[0]),building={id,height,kind,rings};
      tileAtBounds(bounds).buildings.push(building);
      buildings.insert(building,bounds);
    }
    for(const [id,rings] of data.water)water.insert({id,rings},rioCoordinateBounds(rings[0]));
    for(const [id,kind,rings] of data.parks)tileAtBounds(rioCoordinateBounds(rings[0])).parks.push({id,kind,rings});
    for(const point of data.trees)at(...point).trees.push(point);
    for(const site of data.sites)at(site.x,site.z).sites.push(site);
    return {roads,buildings,water,tiles,adjacency};
  }
  function rioRoadAt(x,z,margin=0,predicate=()=>true){
    for(const segment of rioMap.geo.roads.query(x,z,Math.max(0,margin))){
      if(!predicate(segment))continue;
      const p=rioSegmentProjection(x,z,segment.a,segment.b);
      if((x-p.x)**2+(z-p.z)**2<=(segment.width/2+margin)**2)return segment;
    }
    return null;
  }
  function rioWaterAt(x,z){
    for(const water of rioMap.geo.water.query(x,z)){
      if(!rioWithinFootprint(x,z,water.rings))continue;
      if(rioRoadAt(x,z,.12,road=>road.bridge))return null;
      return water;
    }
    return null;
  }
  function rioTerrainY(x,z){
    return Math.max(rioDockSurface(x,z),rioRoadAt(x,z,.12,road=>road.bridge)?.bridge ? .27 : 0);
  }
  function rioFootprintBlock(x,z,radius){
    for(const building of rioMap.geo.buildings.query(x,z,radius))if(rioWithinFootprint(x,z,building.rings,radius))return true;
    return false;
  }
  function nearestRioRoad(pos,walking=false){
    const {x,z}=pos;
    let best=null,score=Infinity;
    for(const reach of [24,90,240]){
      for(const segment of rioMap.geo.roads.query(x,z,reach)){
        if(segment.restricted||!walking&&segment.pedestrian||walking&&['motorway','motorway_link'].includes(segment.kind))continue;
        const point=rioSegmentProjection(x,z,segment.a,segment.b),d=Math.hypot(point.x-x,point.z-z);
        if(d<score){best={segment,point};score=d;}
      }
      if(best&&score<reach)return best;
    }
    return best;
  }

  function rioQueueAdd(queue,entry){
    let i=queue.length;
    queue.push(entry);
    while(i){
      const parent=(i-1)>>1;
      if(queue[parent].priority<=entry.priority)break;
      queue[i]=queue[parent];i=parent;
    }
    queue[i]=entry;
  }
  function rioQueueTake(queue){
    const first=queue[0],last=queue.pop();
    if(queue.length){
      let i=0;
      while(i*2+1<queue.length){
        let child=i*2+1;
        if(child+1<queue.length&&queue[child+1].priority<queue[child].priority)child++;
        if(queue[child].priority>=last.priority)break;
        queue[i]=queue[child];i=child;
      }
      queue[i]=last;
    }
    return first;
  }
  function rioGeoRoute(from,to,walking=!player.vehicle,{connect=false}={}){
    const start=nearestRioRoad(from,walking),goal=nearestRioRoad(to,walking);
    if(!start||!goal)return [];
    const a=start.segment,b=goal.segment,src=start.point,dst=goal.point;
    if(a===b&&(walking||!a.oneway||src.t<=dst.t))return compactRoute(connect?[from,src,dst,to]:[src,dst]);
    const points=rioMap.data.nodes,adjacency=rioMap.geo.adjacency;
    const queue=[],costs=new Map(),previous=new Map();
    const heuristic=node=>Math.hypot(points[node][0]-dst.x,points[node][1]-dst.z);
    function offer(node,cost,parent){
      if(cost>=(costs.get(node)??Infinity))return;
      costs.set(node,cost);previous.set(node,parent);
      rioQueueAdd(queue,{node,cost,priority:cost+heuristic(node)});
    }
    if(walking||!a.oneway)offer(a.start,src.t*a.length,null);
    offer(a.end,(1-src.t)*a.length,null);
    let target=null,total=Infinity;
    while(queue.length){
      const {node,cost,priority}=rioQueueTake(queue);
      if(priority>=total)break;
      if(cost!==costs.get(node))continue;
      if(node===b.start||node===b.end&&(walking||!b.oneway)){
        const score=cost+(node===b.start?dst.t:1-dst.t)*b.length;
        if(score<total){total=score;target=node;}
      }
      for(const edge of adjacency[node]){
        const road=edge.segment;
        if(walking?['motorway','motorway_link'].includes(road.kind):road.pedestrian||edge.reverse&&road.oneway)continue;
        offer(edge.to,cost+road.length,node);
      }
    }
    if(target===null)return [];
    const route=[];
    for(let node=target;node!==null;node=previous.get(node))route.push({x:points[node][0],z:points[node][1]});
    route.reverse();
    return compactRoute(connect?[from,src,...route,dst,to]:[src,...route,dst]);
  }

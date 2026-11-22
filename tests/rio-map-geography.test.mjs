import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const source=readFileSync('games/otthi/src/modules/87-rio-geography.js','utf8');
const data=JSON.parse(readFileSync('games/otthi/assets/world/rio-preto-map.json','utf8'));
const context=vm.createContext({data,player:{vehicle:false},compactRoute:points=>points});
vm.runInContext(source+'\nrioMap.data=data;rioMap.geo=indexRioGeography(data);',context);
const evaluate=script=>JSON.parse(vm.runInContext('JSON.stringify('+script+')',context));

test('Rio Preto uses dated OpenStreetMap extracts with verified location anchors for the reported sites',()=>{
  assert.match(data.reference,/OpenStreetMap.*ODbL/);
  assert(data.coverage.length>=9&&data.roads.length>5000&&data.buildings.length>2000);
  assert.deepEqual(data.water.map(w=>w[0]),[2535587,5735704,5735705]);
  const byKey=new Map(data.sites.map(site=>[site.key,site]));
  assert.equal(byKey.size,data.sites.length);
  assert.equal(byKey.get('mercado_municipal').osm,'w364259959');
  assert.equal(byKey.get('mercado_municipal').street,'Rua Antônio de Godoy');
  assert.deepEqual(byKey.get('canecao_represa').location,[-20.8063058,-49.3618643]);
  assert.deepEqual(byKey.get('posto_brasilia').location,[-20.8027913,-49.3591136]);
  assert.equal(byKey.get('estadio_teixeirao').osm,'w161299822');
  for(const site of data.sites)assert.match(site.source,/^https:\/\//);
});

test('public venue entrances stand on dry, open ground and building footprints do not cover any named action lot',()=>{
  const invalid=evaluate(`data.sites.flatMap(p=>{
    const [x,z]=p.entry;
    const issues=[];
    for(const [name,check] of Object.entries({water:rioWaterAt(x,z),solid:rioFootprintBlock(x,z,.38)}))if(check)issues.push(p.key+':'+name);
    return issues;
  })`);
  assert.deepEqual(invalid,[]);
  const collisions=evaluate(`data.sites.flatMap(p=>{
    const c=Math.cos(p.yaw),s=Math.sin(p.yaw);
    const hits=[];
    for(let x=-p.w*.41;x<=p.w*.41;x+=1.3)for(let z=-p.d*.41;z<=p.d*.41;z+=1.3){
      const a=p.x+c*x+s*z,b=p.z-s*x+c*z;
      if(rioFootprintBlock(a,b,.25))hits.push([p.key,a,b]);
    }
    return hits;
  })`);
  assert.deepEqual(collisions,[]);
});

test('the São José do Rio Preto graph connects the centre and reservoir with actual streets',()=>{
  const count=evaluate(`(()=>{
    const loc=key=>data.sites.find(p=>p.key===key);
    const goals=['canecao_represa','posto_brasilia','estadio_teixeirao','complexo_swift'];
    const from={x:loc('mercado_municipal').road[0],z:loc('mercado_municipal').road[1]};
    return goals.map(key=>{
      const [x,z]=loc(key).road;
      const route=rioGeoRoute(from,{x,z},false);
      let checks=0;
      for(let i=1;i<route.length;i++){
        const a=route[i-1],b=route[i],len=Math.hypot(a.x-b.x,a.z-b.z);
        for(let j=0;j<len;j+=3){
          const t=j/len,q={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};
          if(!rioRoadAt(q.x,q.z,.15,r=>!r.pedestrian))return [key,'off-road',q];
          checks++;
        }
      }
      return [key,checks];
    });
  })()`);
  for(const [id,segments] of count)assert(Number.isInteger(segments)&&segments>120,JSON.stringify([id,segments]));
});

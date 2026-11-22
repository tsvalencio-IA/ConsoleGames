/* The studio's plan-view courses, sampled for Kart Legends' native road renderer. */
(() => {
  'use strict';
  const tracks=[
    {id:3,key:'mirassol',name:'AUTÓDROMO DE MIRASSOL',theme:'mirassol',sky:0,
      points:[[-26,-14],[18,-22],[32,-2],[22,20],[-8,24],[-28,10]],
      sectors:['RETA DOS BOXES','CURVA DO IPÊ','CURVA DA GROTA','RETA DA CHEGADA']},
    {id:4,key:'cedral',name:'CIRCUITO TÉCNICO DE CEDRAL',theme:'cedral',sky:0,
      points:[[-24,-18],[4,-26],[28,-12],[14,4],[28,22],[-10,24],[-28,6]],
      sectors:['RETA DA ESTAÇÃO','ENTRADA DA CHICANE','CURVAS DO CAMPO','RETA DA CHEGADA']}
  ];
  function catmull(a,b,c,d,t){
    const t2=t*t,t3=t2*t;
    return .5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);
  }
  function build(spec,count=720){
    const points=spec.points,divisions=72,dense=[],distances=[0];
    const at=i=>points[(i+points.length)%points.length];
    for(let i=0;i<points.length;i++){
      for(let j=0;j<divisions;j++){
        const a=at(i-1),b=at(i),c=at(i+1),d=at(i+2),t=j/divisions;
        dense.push({x:catmull(a[0],b[0],c[0],d[0],t),z:catmull(a[1],b[1],c[1],d[1],t)});
      }
    }
    dense.push(dense[0]);
    for(let i=1;i<dense.length;i++)distances.push(distances[i-1]+Math.hypot(dense[i].x-dense[i-1].x,dense[i].z-dense[i-1].z));
    const meters=distances.at(-1),map=[];
    let edge=1;
    for(let i=0;i<count;i++){
      const s=i/count*meters;
      while(distances[edge]<s)edge++;
      const a=dense[edge-1],b=dense[edge],t=(s-distances[edge-1])/(distances[edge]-distances[edge-1]);
      map.push({x:a.x+t*(b.x-a.x),z:a.z+t*(b.z-a.z)});
    }
    const angles=map.map((p,i)=>{
      const q=map[(i+1)%count];return Math.atan2(q.x-p.x,q.z-p.z);
    });
    const scaled=angles.map((angle,i)=>{
      const d=angles[(i+1)%count]-angle;
      return Math.max(-4.6,Math.min(4.6,-Math.atan2(Math.sin(d),Math.cos(d))*94));
    });
    const curves=scaled.map((_,i)=>{
      let sum=0;
      for(let j=-4;j<=4;j++)sum+=scaled[(i+j+count)%count];
      return sum/9;
    });
    return {map,curves,meters};
  }
  window.KartRegionalTracks=Object.freeze({tracks,build});
})();

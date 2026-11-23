/** Progressive urban scenery using the same terrain, GPS and commerce as the other districts. */
// @otthi-module-body
  const rioPreto = {tiles:null, material:null, traffic:false, actors:0, shops:0, visits:0, visible:0, nextTileAt:0,
    homes:new Map(),nextHomeAt:0,insideHome:null};
  const rioTileSize = 72;
  const rioDistrictStyles = {
    bady: {accent:0xad6744, facade:[0xe9dbba,0xbc7555,0xe5cba2,0xbc9e72,0x9aaf95], paving:0xc5b3a0, greenery:0x63875a},
    andalo: {accent:0x507f92, facade:[0xddd7c6,0xb6c9cb,0xe8e2d1,0x97b1bf,0xcbd3c9], paving:0xbbc3bd, greenery:0x548874},
    murchid: {accent:0x476b55, facade:[0xd9c9a5,0xc0a07a,0xda9467,0xb4c1a3,0xe1d8bd], paving:0xb9b69f, greenery:0x6c965f}
  };
  const rioWindow = 0x406777;
  const rioTrim = 0xefe5ce;
  const rioSteel = 0x394b4e;

  function rioRoof(hip) {
    const edge = hip ? .32 : .5;
    const points = [[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5],
      [0,.5,-edge],[0,.5,edge]];
    const triangles = [0,4,1,0,3,5,0,5,4,1,4,5,1,5,2,3,2,5];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(triangles.flatMap(i=>points[i]),3));
    geo.computeVertexNormals();
    return geo;
  }

  // A batch uses a single mesh per shape, with an exact aggregate bounding sphere.
  // Building primitives are temporary matrices, never individual scene objects.
  function rioCreateBatch(root) {
    const byShape = new Map();
    const transform = new THREE.Object3D();
    const color = new THREE.Color();
    function part(shape,x,y,z,w,h,d,tint,yaw=0,roll=0) {
      if (!byShape.has(shape)) byShape.set(shape,[]);
      transform.position.set(x,y,z);
      transform.rotation.set(0,yaw,roll,'YXZ');
      transform.scale.set(w,h,d);
      transform.updateMatrix();
      byShape.get(shape).push({matrix:transform.matrix.clone(),tint});
    }
    function commit() {
      rioPreto.material ??= new THREE.MeshStandardMaterial({color:0xffffff,roughness:.86,metalness:.04,side:THREE.DoubleSide});
      const shapes = {
        box:()=>new THREE.BoxGeometry(1,1,1), post:()=>new THREE.CylinderGeometry(.5,.5,1,7),
        canopy:()=>new THREE.IcosahedronGeometry(.5,1), roof:()=>rioRoof(false), hip:()=>rioRoof(true)
      };
      let primitives=0;
      for (const [shape,items] of byShape) {
        const geometry=shapes[shape]();
        geometry.computeBoundingBox();
        const unit=geometry.boundingBox.clone(), bounds=new THREE.Box3(), instanceBox=new THREE.Box3();
        const mesh=new THREE.InstancedMesh(geometry,rioPreto.material,items.length);
        for (const [index,item] of items.entries()) {
          mesh.setMatrixAt(index,item.matrix);
          mesh.setColorAt(index,color.setHex(item.tint).convertSRGBToLinear());
          bounds.union(instanceBox.copy(unit).applyMatrix4(item.matrix));
        }
        geometry.boundingSphere=bounds.getBoundingSphere(new THREE.Sphere());
        mesh.name='RIO_PRETO_'+shape.toUpperCase();
        mesh.userData.otthiBoundedInstances=true;
        mesh.frustumCulled=true;
        mesh.instanceMatrix.needsUpdate=true;
        if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
        mesh.receiveShadow=true;
        root.add(mesh);
        primitives+=items.length;
      }
      return primitives;
    }
    return {part,commit};
  }

  function rioLocal(batch,site) {
    const {x,z}=site, yaw=site.yaw||0, sin=Math.sin(yaw), cos=Math.cos(yaw), ground=groundHeightAt(x,z);
    function point(dx,dz) {return {x:x+cos*dx+sin*dz,z:z-sin*dx+cos*dz};}
    function part(shape,dx,y,dz,w,h,d,color,angle=0,roll=0) {
      const p=point(dx,dz);batch.part(shape,p.x,ground+y,p.z,w,h,d,color,yaw+angle,roll);
    }
    const box=(...args)=>part('box',...args);
    function collider(dx,dz,w,d,height,id=site.id) {
      const p=point(dx,dz), rotated=Math.abs(sin)>.5;
      registerCollider(p.x,p.z,rotated?d:w,rotated?w:d,{height,rioPreto:id});
    }
    function tree(dx,dz,height,tint=0x508258,flowers=0) {
      part('post',dx,height*.30,dz,height*.075,height*.62,height*.075,0x7d684e);
      part('canopy',dx,height*.79,dz,height*.73,height*.60,height*.68,tint);
      part('canopy',dx-height*.19,height*.92,dz+height*.10,height*.50,height*.49,height*.52,flowers||tint);
    }
    function bench(dx,dz) {
      box(dx,.47,dz,2.2,.13,.56,0x9c7352);
      box(dx,.78,dz-.25,2.2,.35,.13,0xa6805d);
      for(const side of [-1,1])box(dx+side*.79,.24,dz,.12,.48,.40,rioSteel);
    }
    function lamp(dx,dz) {
      part('post',dx,2.85,dz,.12,5.7,.12,rioSteel);
      box(dx,5.67,dz+.28,.14,.14,.65,rioSteel);
      box(dx,5.58,dz+.56,.34,.12,.34,0xffe5af);
    }
    function sign(text, dx,y,dz,w,h=.70,background='#214657') {
      const p=point(dx,dz);
      const mesh=citySign(batch.root,text,p.x,ground+y,p.z,w,1,background,h);
      mesh.rotation.y=yaw;
    }
    return {part,box,point,collider,tree,bench,lamp,sign};
  }

  function rioWindowModule(draw,x,y,z,w,h,trim=rioTrim) {
    const {box}=draw;
    box(x,y,z,w+.16,h+.15,.085,trim);
    box(x,y,z+.048,w,h,.055,rioWindow);
    box(x-w*.19,y,z+.081,.047,h,.025,trim);
    box(x,y+h*.20,z+.082,w,.044,.025,trim);
    box(x,y-h*.53,z+.14,w+.24,.09,.30,trim);
  }
  function rioBalcony(draw,x,y,z,w,accent) {
    const {box}=draw;
    box(x,y,z+.60,w,.19,1.42,rioTrim);
    box(x,y+.64,z+1.25,w,.105,.085,accent);
    for (let u=-w/2+.18;u<w/2;u+=.32)box(x+u,y+.36,z+1.25,.047,.64,.052,rioSteel);
  }

  function rioDrawHouse(batch,lot,colors) {
    const draw=rioLocal(batch,lot), {box,part,tree,collider}=draw;
    const {w,d,style,variant}=lot, trim=variant%2?0xf3e2ca:0xeee9d5;
    const wall=colors.facade[variant%colors.facade.length], accent=colors.accent;
    const shellW=w*.73, shellD=d*.60, bodyHeight=style==='house-court'?5.8:3.35, front=shellD/2-1.15;
    const garX=w*.30, doorX=-w*.25;
    const roofColor=[0xa05238,0xb7694b,0x935b48,0x60574d][variant%4];
    box(0,.07,0,w,.12,d,0xa0a383);
    box(garX,.145,d*.315,w*.30,.15,d*.40,0xbfc2b6);
    box(doorX,.16,d*.36,1.2,.15,d*.30,0xddd4b9);
    box(0,bodyHeight/2+.10,-1.15,shellW,bodyHeight,shellD,wall);
    collider(0,-1.15,shellW,shellD,bodyHeight);
    box(0,.28,front+.08,shellW,.38,.16,0xbcb29e);
    box(doorX,1.22,front+.08,1.18,2.16,.17,trim);
    box(doorX,1.18,front+.18,1.0,2.04,.12,style==='house-modern'?rioSteel:0x895f48);
    box(doorX+.34,1.12,front+.28,.07,.09,.055,0xbfa66d);
    box(0,1.43,front+.14,2.35,1.2,.14,trim);
    rioWindowModule(draw,0,1.44,front+.24,2.19,1.04,trim);
    box(garX-.39,1.19,front+.14,w*.26,2.28,.13,rioSteel);
    for (let k=0;k<7;k++)box(garX-.39,.22+k*.30,front+.23,w*.25,.073,.075,0x677775);
    if (style==='house-modern') {
      box(0,3.56,-.82,shellW+.16,.54,shellD+.58,trim);
      box(-shellW*.34,3.52,front+.7,w*.31,.22,1.5,0x3e4d4b);
      box(-shellW*.47,1.93,front+1.22,.15,3.28,.15,accent);
      for(let i=0;i<7;i++)box(-w*.16+i*.12,2.62,front+.24,.077,1.20,.08,0x977658);
    } else if (style==='house-court') {
      part('roof',0,bodyHeight+.56,-1.16,shellW+.67,1.34,shellD+.65,roofColor);
      rioWindowModule(draw,-w*.19,4.39,front+.07,1.6,1.24,trim);
      rioWindowModule(draw,w*.19,4.39,front+.07,1.9,1.12,trim);
      rioBalcony(draw,w*.12,3.57,front,.38*w,accent);
      box(0,3.60,front-.10,shellW+.32,.20,.42,accent);
    } else {
      part(style==='house-hip'?'hip':'roof',0,3.96,-1.12,shellW+.80,1.30,shellD+.75,roofColor);
      box(0,3.40,front,shellW+.73,.18,.35,trim);
      for(let i=0;i<4;i++)box(-1.35+i*.82,3.43,front+.23,.58,.13,.22,roofColor);
      if(style==='house-veranda'){
        box(-w*.12,3.01,front+1.26,w*.62,.17,2.48,roofColor);
        for(const a of [-1,1])box(-w*.12+a*w*.26,1.52,front+2.21,.17,2.89,.19,trim);
        box(-w*.09,.24,front+1.24,w*.63,.24,2.44,0xc5a48b);
      }
    }
    // Open pedestrian gate at the front, with driveway visually distinct.
    const fenceZ=d*.482;
    const sideW=w*.31;
    const fenceColor = [wall,0x9f8d75,0xd4bca0,0xb9b5a4][variant%4];
    const gateStyle = variant%3;
    for(const side of [-1,1]){
      const x=side*w*.34;
      box(x,gateStyle===1?.32:.51,fenceZ,sideW,gateStyle===1?.58:.96,.18,fenceColor);
      box(x,1.02,fenceZ,sideW+.20,.11,.30,gateStyle===1?rioSteel:trim);
      if(gateStyle===1)for(let u=-sideW/2+.23;u<sideW/2;u+=.40)box(x+u,.79,fenceZ,.055,.38,.055,rioSteel);
      if(gateStyle===2)for(let i=0;i<3;i++)box(x,.32+i*.21,fenceZ+.101,sideW-.22,.039,.055,trim);
      collider(x,fenceZ,sideW,.18,1.08);
      box(side*w*.49,.63,-.30,.20,1.16,d*.92,fenceColor);
      collider(side*w*.49,-.30,.20,d*.92,1.16);
    }
    // Leave a visible pedestrian opening next to the slatted vehicular gate.
    const gateWidth=w*.20, gateCenter=w*.076;
    box(gateCenter,.89,fenceZ+.024,gateWidth,.082,.103,rioSteel);
    box(gateCenter,.35,fenceZ+.024,gateWidth,.078,.103,rioSteel);
    for(let k=0;k<6;k++)box(gateCenter+(k-2.5)*gateWidth/6,.61,fenceZ+.029,.062,.52,.068,rioSteel);
    collider(gateCenter,fenceZ,gateWidth,.14,.94);
    box(-w*.34,.28,d*.36,w*.21,.32,d*.15,0x768956);
    tree(-w*.37,d*.17,2.46+(variant%3)*.46,colors.greenery,variant%4===1?0xc0985a:0);
    if(variant%3===0){box(w*.33,.34,-d*.31,w*.18,.55,d*.16,0x8b765a);tree(w*.32,-d*.29,2,colors.greenery);}
  }

  function rioDrawCommerce(batch,lot,colors) {
    const draw=rioLocal(batch,lot), {box,sign,tree,collider}=draw;
    const {w,d,style,variant}=lot, front=d*.29, accent=colors.accent;
    const wall=colors.facade[variant%colors.facade.length], green=colors.greenery;
    const high=style==='tower'?17+(variant%4)*4.4:style==='mixed'?9.4:style==='civic'?6.9:4.1;
    const frontage=w*.84, depth=d*.65;
    box(0,.09,0,w,.16,d+.2,colors.paving);
    box(0,high/2+.1,-.36,frontage,high,depth,wall);
    collider(0,-.36,frontage,depth,high);
    const z=front+.20;
    const baseColor=style==='workfront'||style==='dealership'?accent:rioTrim;
    box(0,.36,z,frontage+.05,.55,.16,baseColor);
    const divisions=style==='workfront'?3:4;
    const bay=frontage/divisions;
    for(let i=0;i<divisions;i++) {
      const x=(i+.5-divisions/2)*bay;
      if(style==='workfront'){
        box(x,1.68,z+.04,bay-.53,2.58,.16,0x627474);
        for(let h=.63;h<2.85;h+=.30)box(x,h,z+.145,bay-.7,.044,.06,0x84918b);
      }else{
        rioWindowModule(draw,x,1.83,z+.02,bay-.42,2.53,baseColor);
        if(i===2)box(x,.99,z+.16,.09,1.1,.12,0xc4d4cb);
      }
    }
    box(0,3.26,z+.65,frontage+.60,.18,1.72,baseColor);
    if (style==='arcade'||style==='cafe-pavilion') {
      for(const s of [-1,1])box(s*(frontage*.44),1.6,z+.95,.22,3.11,.27,baseColor);
      for(let i=0;i<9;i++)box((i-4)*frontage/9,3.34,z+.70,frontage/9,.17,1.77,i%2?accent:rioTrim);
    }
    if (style==='dealership') {
      box(0,4.21,z+.14,frontage+.9,.79,.43,0x3e6d88);
      for(let i=-2;i<=2;i++){
        const x=i*(w*.166);
        box(x,.183,d*.422,.06,.025,2.5,0xe5ddd1);
      }
    }else if(style==='workfront'){
      box(0,4.21,z+.09,frontage+.65,.8,.31,baseColor);
      box(0,4.65,-.43,frontage+.48,.22,depth+.39,wall);
      for(let i=-2;i<=2;i++)box(i*frontage/6,4.76,-1,.25,.13,depth*.72,0x839698);
    }
    if (high>6) {
      const floors=Math.floor((high-3)/2.62);
      for(let level=0;level<floors;level++){
        const y=4.52+level*2.60;
        box(0,y-1.02,z-.09,frontage+.18,.14,.26,baseColor);
        for(let i=0;i<divisions;i++){
          const x=(i+.5-divisions/2)*bay;
          rioWindowModule(draw,x,y,z-.01,bay*.70,1.58,baseColor);
          if(style==='mixed'&&i%2===0)rioBalcony(draw,x,y-.91,z,bay*.85,accent);
        }
        for(const side of [-1,1])for(const offset of [-depth*.28,depth*.11]){
          box(side*(frontage/2+.02),y,offset,.11,1.37,depth*.243,baseColor);
          box(side*(frontage/2+.086),y,offset,.028,1.22,depth*.211,rioWindow);
        }
      }
      box(0,high+.21,-.35,frontage+.31,.39,depth+.44,baseColor);
      box(-frontage*.29,high+.86,-1.12,frontage*.26,1.38,depth*.30,wall);
      if(style==='civic')for(let i=-3;i<=3;i++)box(i*frontage/8,high*.57,z+.48,.145,high*.71,.41,accent);
    }
    tree(-w*.43,d*.39,3.6,green,variant%3===0?0xd49b5c:0);
    if(lot.title)sign(lot.title.toUpperCase(),0,3.81,z+.28,Math.min(w*.78,17),.67,style==='workfront'?'#604938':'#254b54');
    if (lot.kind==='cafe') {
      for(const off of [-w*.26,w*.30]){
        draw.part('post',off,.43,d*.415,.10,.71,.10,rioSteel);
        box(off,.81,d*.415,1.31,.12,.92,0xa78261);
        for(const s of [-1,1])box(off+s*.82,.51,d*.414,.45,.12,.50,0xaa926f);
      }
    }
  }

  function rioDrawPlaza(batch,p) {
    const site={id:p.id,x:p.centerX,z:p.centerZ};
    const draw=rioLocal(batch,site), {box,part,tree,bench,lamp,sign}=draw;
    const colors=rioDistrictStyles[p.district];
    box(0,.09,0,p.w,.16,p.d,colors.paving);
    const halfW=p.w/2,halfD=p.d/2;
    for(const s of [-1,1]){
      box(s*(halfW-2.3),.17,0,3.32,.24,p.d-1.8,colors.greenery);
      for(const t of [-1,1])tree(s*(halfW-2.2),t*(halfD-2.4),4.8,colors.greenery,s===t?0xd1a85e:0);
      bench(s*(halfW-5),-halfD*.46);
      lamp(s*(halfW-4),halfD*.5);
    }
    if(p.district==='murchid'){
      // A planted drainage garden is a fictional park feature. Low planting
      // and a shallow dry rill are scenery; the walking crossing stays flat.
      for(const side of [-1,1]){
        box(side*(halfW*.52),.19,1,halfW-.9,.18,4.4,0x7c9f7b);
        box(side*(halfW*.52),.25,1,halfW-1.3,.11,1.82,0x527f7b);
        for(let k=1;k<=5;k++)tree(side*k*7,-halfD*.72,3.6+k%3,0x688c61,k%3===1?0xd1a85e:0);
      }
      box(0,.32,1,4.6,.32,6.7,0xc1aa86);
      for(const s of [-1,1]){
        box(s*2.32,.78,1,.095,.10,6.64,rioSteel);
        for(let n=-2;n<=2;n++)box(s*2.32,.54,1+n*1.3,.10,.54,.10,rioSteel);
      }
      for(const i of [-2,-1,1,2])bench(i*11,halfD*.54);
    }else {
      // Shaded civic pavilion, with the clear diagonal pedestrian passage kept open.
      const aw=p.w*.43,ad=6.4, roofColor=p.district==='andalo'?0x4d7880:0x99744f;
      for(const x of [-aw/2,aw/2])for(const z of [-ad/2,ad/2])box(x,1.52,z,.21,2.90,.21,roofColor);
      box(0,3.002,0,aw+.37,.19,ad+.37,roofColor);
      for(let i=-3;i<=3;i++)box(i*aw/7,3.11,0,.12,.18,ad+.59,rioTrim);
      for(const s of [-1,1])bench(s*aw*.28,.92);
      part('post',0,.31,-halfD*.78,.57,.49,.57,colors.accent);
      box(0,1.11,-halfD*.78,.36,1.39,.36,rioTrim);
    }
    const marker=rioLocal(batch,{id:p.id,x:p.x,z:p.z,yaw:p.district==='andalo'?Math.PI/2:0});
    const road=RIO_PRETO_LAYOUT.highways.find(item=>item.district===p.district&&item.boulevard);
    for(const s of[-1,1])marker.box(s*1.42,1.06,-1.07,.12,2.11,.12,rioSteel);
    marker.sign(p.name.toUpperCase(),0,1.77,-1.04,4.8,.57,'#20444d');
    marker.sign(road.name.toUpperCase(),0,2.27,-1.04,5.18,.41,'#315c50');
    const dx=p.x-p.centerX,dz=p.z-p.centerZ;
    if (p.district==='andalo')box(-17,.10,0,9,.12,4.1,colors.paving);
    else if (p.district==='bady')box(dx,.12,-p.d/2-4.8,3.4,.13,10.1,colors.paving);
    else box(dx,.12,dz+4.5,4.3,.13,15.2,colors.paving);
  }

  function rioDrawStreet(batch,spec) {
    const {x,z,yaw,length,width,district,boulevard,decorated,crossing}=spec;
    const draw=rioLocal(batch,{x,z,yaw});
    const {box,part,lamp,tree}=draw;
    const colors=rioDistrictStyles[district]||rioDistrictStyles.bady;
    for(const side of [-1,1]){
      const edge=side*(width/2+.52);
      box(edge+side*1.34,.115,0,2.62,.16,length,colors.paving);
      box(edge,.129,0,.18,.18,length,0xc6c2ac);
      if(!decorated)continue;
      lamp(edge+side*2.49,-length*.18);
      if(boulevard)tree(edge+side*2.58,length*.21,4.65,colors.greenery,side>0?0xc5a265:0);
    }
    if(boulevard&&length>6){
      const fill=Math.max(2,length-4);
      box(0,.125,0,1.03,.055,fill,colors.greenery);
      for(const s of [-1,1])box(s*.57,.130,0,.12,.063,fill,0xd0c4a7);
      if(decorated)for(let n=-1;n<=1;n++)part('canopy',0,.201,n*fill/4,.66,.23,1.4,0x7d9a59);
    }
    if(crossing)for(const s of [-1,1]){
      for(let dx=1.17;dx<width/2-.65;dx+=.93)box(s*dx,.115,-length*.50+1.18,.43,.012,1.95,0xece6d4);
    }
  }

  function rioTiles() {
    const tiles=new Map();
    function add(x,z,draw) {
      const tx=Math.floor(x/rioTileSize),tz=Math.floor(z/rioTileSize),key=tx+':'+tz;
      if(!tiles.has(key))tiles.set(key,{x:(tx+.5)*rioTileSize,z:(tz+.5)*rioTileSize,draw:[],root:null,primitives:0});
      tiles.get(key).draw.push(draw);
    }
    for(const lot of RIO_PRETO_LAYOUT.lots){
      // Keep the exact historic façade, but render legacy houses separately
      // in compact Rio so their roofs can be hidden without hiding the street.
      if(typeof rioCompactWorld==='function'&&rioCompactWorld()&&lot.style.startsWith('house-'))continue;
      add(lot.x,lot.z,batch=>{
      const colors=rioDistrictStyles[lot.district];
      if(lot.style.startsWith('house-'))rioDrawHouse(batch,lot,colors);
      else rioDrawCommerce(batch,lot,colors);
      });
    }
    for(const mark of RIO_PRETO_LAYOUT.landmarks)add(mark.centerX,mark.centerZ,batch=>rioDrawPlaza(batch,mark));
    for(const road of RIO_PRETO_LAYOUT.highways){
      for(let i=1;i<road.points.length;i++){
        const a=road.points[i-1],b=road.points[i];
        const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz);
        const trim=Math.min(road.boulevard?9:6,length*.33),sections=Math.max(1,Math.ceil((length-2*trim)/30));
        const size=(length-2*trim)/sections;
        for(let j=0;j<sections;j++){
          const frac=(trim+(j+.5)*size)/length,x=a.x+dx*frac,z=a.z+dz*frac;
          const spec={x,z,yaw,length:size,width:road.width,district:road.district,boulevard:road.boulevard,
            decorated:road.boulevard||j===0,crossing:road.boulevard&&j===0};
          add(x,z,batch=>rioDrawStreet(batch,spec));
        }
      }
    }
    return tiles;
  }


  // Property adapter for existing houses. The approved exterior mesh is drawn
  // with its original renderer, while the native Sims-style interior is kept
  // in a separate group. This avoids duplicate facades and preserves IDs.
  function rioHistoricHomeSite(lot){
    const forward={x:Math.sin(lot.yaw),z:Math.cos(lot.yaw)};
    const id='regional-home-'+lot.id;
    const district={bady:'Boa Vista / Bady Bassitt',andalo:'Alberto Andaló',
      murchid:'Murchid Homsi / Aterradinho'}[lot.district]||'São José do Rio Preto';
    const door={x:lot.x+forward.x*(lot.d*.49+1.35),
      z:lot.z+forward.z*(lot.d*.49+1.35)};
    return {key:lot.id,id,propertyId:id,kind:'residence',style:lot.style==='house-modern'?'damha':'classic',
      name:lot.title||'Casa · '+district+' · '+lot.id.replaceAll('-',' '),
      street:district,price:920+(lot.variant%10)*80,
      x:lot.x,z:lot.z,w:lot.w,d:lot.d,yaw:lot.yaw,
      entry:[door.x,door.z],road:[door.x+forward.x*2.1,door.z+forward.z*2.1]};
  }
  function rioMakeHistoricHome(lot){
    const site=rioHistoricHomeSite(lot);
    const root=new THREE.Group();root.name='RIO_HISTORIC_FACADE_'+lot.id;worldGroup.add(root);
    const batch=rioCreateBatch(root),before=world.colliders.length;
    rioDrawHouse(batch,lot,rioDistrictStyles[lot.district]);
    batch.commit();
    const outsideColliders=world.colliders.slice(before);
    const room=rioMountPlace(site,worldGroup);
    room.legacyResidence=true;
    room.root.visible=false;
    room.colliders.forEach(c=>c.disabled=true);
    const record={site,lot,root,room,outsideColliders,inside:false};
    room.legacyRecord=record;
    const entrance={x:site.entry[0],z:site.entry[1]};
    function enter(){
      // Single active historic interior; restore other facades if necessary.
      if(rioPreto.insideHome&&rioPreto.insideHome!==record)return false;
      record.inside=true;rioPreto.insideHome=record;
      root.visible=false;room.root.visible=true;
      for(const c of outsideColliders)c.disabled=true;
      for(const c of room.colliders)c.disabled=false;
      if(room.gate)room.gate.disabled=true;
      if(room.door)room.door.visible=false;
      const p=room.point(0,site.d*.22);
      player.x=p.x;player.z=p.z;player.y=groundHeightAt(p.x,p.z);
      player.vx=player.vy=player.vz=0;player.grounded=true;
      player.facing=site.yaw;playerGroup.position.set(player.x,player.y,player.z);
      cameraMode='interior';cameraYaw=site.yaw;cameraPitch=.20;cameraZoom=2.6;
      rioMapSave().activeHistoricHome=site.id;
      rememberSafePlayerPosition(true);saveState(true);
      return true;
    }
    function leave(){
      record.inside=false;if(rioPreto.insideHome===record)rioPreto.insideHome=null;
      room.root.visible=false;root.visible=true;
      for(const c of room.colliders)c.disabled=true;
      for(const c of outsideColliders)c.disabled=false;
      if(room.door)room.door.visible=true;
      const p={x:entrance.x+Math.sin(site.yaw)*1.1,
        z:entrance.z+Math.cos(site.yaw)*1.1};
      player.x=p.x;player.z=p.z;player.y=groundHeightAt(p.x,p.z);
      player.vx=player.vy=player.vz=0;player.grounded=true;
      cameraMode='openworld';playerGroup.position.set(player.x,player.y,player.z);
      delete rioMapSave().activeHistoricHome;rememberSafePlayerPosition(true);
      saveState(true);return true;
    }
    room.action('historic-exit','Sair da residência',0,site.d*.27,leave,{inside:true,icon:'🚪',radius:2.6});
    registerInteractable({
      id:site.id+'-historic-front-door',type:'door',icon:'🏠',
      label:'Visitar ou comprar · '+site.name,...entrance,radius:3.2,priority:258,
      available:()=>root.visible&&!record.inside&&!player.vehicle&&!player.boating&&
        !player.swimming&&!characterActivities.session,
      action:()=>rioPropertyDoor({id:site.propertyId,name:site.name,price:site.price,
        available:()=>root.visible&&!record.inside&&rioPlayerAt(entrance,3.6),
        decorate:()=>room.manageFurniture?.(),
        enter})
    });
    rioPreto.homes.set(lot.id,record);
    if(rioMapSave().activeHistoricHome===site.id)enter();
    return record;
  }

  function rioRegisterDestinations() {
    for(const mark of RIO_PRETO_LAYOUT.landmarks){
      registerInteractable({
        id:mark.id,type:'viewpoint',icon:mark.icon,label:'Visitar · '+mark.name,x:mark.x,z:mark.z,radius:3.8,priority:175,
        available:()=>!player.vehicle&&!otGames.active&&!currentHouse,
        action:()=>{
          rioPreto.visits++;
          if(typeof onRioPretoLandmarkVisit==='function')onRioPretoLandmarkVisit(mark.id);
          openModal(mark.label,'<p>'+escapeHtml(mark.note)+'</p><p>Área do jogo inspirada em São José do Rio Preto.</p><button class="btn primary" data-rio-close>Voltar ao passeio</button>',
            root=>{ root.querySelector('[data-rio-close]').onclick=closeModal; });
          return true;
        }
      });
    }
    for(const lot of RIO_PRETO_LAYOUT.lots.filter(l=>l.kind)){
      const extent=lot.d/2+.4,ns=Math.cos(lot.yaw),ew=Math.sin(lot.yaw),id='rio-shop-'+lot.id;
      const front={x:lot.x+ew*extent,z:lot.z+ns*extent};
      cityCoast.shops.set(id,{
        id,label:lot.title,kind:lot.kind,x:front.x,z:front.z,navX:front.x,navZ:front.z,face:ns<-.5?-1:1,
        description:lot.kind==='market'?'Água e alimentos para levar no passeio.':'Café da manhã e pães para levar.'
      });
      registerInteractable({
        id,type:'shop',icon:lot.kind==='market'?'🛒':'☕',label:'Comprar · '+lot.title,
        x:front.x,z:front.z,radius:3.1,priority:225,
        available:()=>!player.vehicle&&!otGames.active&&!currentHouse,action:()=>openCityShop(id)
      });
      rioPreto.shops++;
    }
  }

  function rioNativeTraffic(focus) {
    if(!OTTOVIAS_RUNTIME.initialized||rioPreto.actors>=4||!ottoviasLaneRoute)return;
    const actor=rioPreto.actors;
    const index=Math.floor(actor/2),loop=RIO_PRETO_LAYOUT.trafficLoops[index];
    if(Math.hypot(focus.x-loop[1].x,focus.z-loop[1].z)>330)return;
    const lane=ottoviasLaneRoute(loop,2.1,actor%2===1);
    if(lane.length<4)return;
    const t=createOttoviasTrafficVehicle('rio-preto-local-'+actor,lane,1+(actor%2)*(lane.length>>1),
      [0xb94b4d,0x5a8490,0xd7b576,0x8c9c79][actor],5.9+actor*.45,'car');
    t.rioPretoDistrict=index;
    rioPreto.actors++;
    world.trafficSnapshot=null;
    world.trafficSnapshotAt=-Infinity;
  }

  function rioCreateCommunityActors() {
    if(rioPreto.traffic)return;
    rioPreto.traffic=true;
    const walkers=[
      ['Lia','rio-bady-praca',-4,1,0xae624b],
      ['Miguel','rio-andalo-praca',3,4,0x47728c],
      ['Marta','rio-murchid-parque',-5,10,0x758746],
      ['Raul','rio-murchid-parque',6,7,0xab8a50]
    ];
    for(const [name,id,dx,dz,color] of walkers){
      const mark=RIO_PRETO_LAYOUT.landmarks.find(item=>item.id===id),x=mark.centerX+dx,z=mark.centerZ+dz;
      const route=[{x,z},{x:x+3.3,z},{x:x+3.3,z:z+2.5},{x,z:z+2.5}];
      cityCommercialNPC('rio-resident-'+name.toLowerCase(),name,x,z,color,route);
    }
  }

  function updateRioPretoDistricts() {
    if((!legacyRegionalLayout&&!rioCompactWorld())||!worldGroup||!worldExpansion.ready)return;
    if(!rioPreto.tiles){
      rioPreto.tiles=rioTiles();
      rioRegisterDestinations();
    }
    const focus=typeof otGamesFocus==='function'?otGamesFocus():player;
    const nearRegion=focus.x>-414&&focus.x<678&&focus.z<-200&&focus.z>-875;
    let closest=null,closestDistance=Infinity, visible=0;
    // Scenery streams on approach. Store a bounded set of simple tile meshes
    // to avoid reconstructing whole neighborhoods every time the player turns.
    const ranges=typeof performanceDistanceRanges==='function'?performanceDistanceRanges():{critical:95};
    const renderRange=Math.max(126,ranges.critical+49);
    for(const tile of rioPreto.tiles.values()){
      const d=nearRegion?Math.hypot(tile.x-focus.x,tile.z-focus.z):Infinity;
      if(tile.root){tile.root.visible=d<renderRange+42;if(tile.root.visible)visible++;continue;}
      if(d<renderRange+64&&d<closestDistance){closestDistance=d;closest=tile;}
    }
    if(closest&&performance.now()>=rioPreto.nextTileAt){
      const root=new THREE.Group();
      root.name='RIO_PRETO_BLOCK_'+closest.x+'_'+closest.z;
      const batch=rioCreateBatch(root);
      batch.root=root;
      for(const draw of closest.draw)draw(batch);
      closest.primitives=batch.commit();
      closest.root=root;
      root.visible=closestDistance<renderRange+42;
      if(root.visible)visible++;
      worldGroup.add(root);
      world.navCache?.clear?.();
      rioPreto.nextTileAt=performance.now()+34;
    }
    if(rioCompactWorld()){
      // House streaming uses the same one-object-per-frame budget as city tiles.
      const time=performance.now();
      let closestHouse=null,nearDistance=Infinity;
      for(const lot of RIO_PRETO_LAYOUT.lots){
        if(!lot.style.startsWith('house-'))continue;
        const distance=nearRegion?Math.hypot(lot.x-focus.x,lot.z-focus.z):Infinity;
        const house=rioPreto.homes.get(lot.id);
        if(house){
          house.root.visible=distance<renderRange+35&&!house.inside;
          for(const collider of house.outsideColliders)collider.disabled=house.inside;
          for(const collider of house.room.colliders)collider.disabled=!house.inside;
          continue;
        }
        if(distance<renderRange+20&&distance<nearDistance){
          closestHouse=lot;nearDistance=distance;
        }
      }
      if(closestHouse&&time>=rioPreto.nextHomeAt){
        rioMakeHistoricHome(closestHouse);
        rioPreto.nextHomeAt=time+145;
      }
    }
    rioPreto.visible=visible;
    if(nearRegion&&focus.z<-406&&focus.x>-219&&focus.x<465){
      rioCreateCommunityActors();
      rioNativeTraffic(focus);
    }
  }

  const rioPreviousExpansion=updateWorldExpansion;
  updateWorldExpansion=function(){rioPreviousExpansion();updateRioPretoDistricts();};
  const rioPreviousLocations=expansionMapLocations;
  expansionMapLocations=function(){return legacyRegionalLayout||rioCompactWorld()?[...rioPreviousLocations(),...RIO_PRETO_LAYOUT.locations,...(rioCompactWorld()?RIO_PRETO_LAYOUT.lots.filter(lot=>lot.style.startsWith('house-')).map(lot=>{const site=rioHistoricHomeSite(lot);return {id:site.id,name:site.name,group:'Casas e imóveis · Rio Preto',icon:'🏠',x:site.entry[0],z:site.entry[1],navX:site.entry[0],navZ:site.entry[1],description:'Casa com entrada, compra, móveis e atividades domésticas'};}):[])]:rioPreviousLocations();};
  window.OTTHI_RIO_PRETO=Object.freeze({
    locations:()=>RIO_PRETO_LAYOUT.locations.map(p=>({...p})),
    diagnostics:()=>{
      const tiles=[...rioPreto.tiles?.values()||[]],built=tiles.filter(t=>t.root);
      return {
        roads:RIO_PRETO_LAYOUT.highways.length,houses:RIO_PRETO_LAYOUT.lots.filter(l=>l.style.startsWith('house-')).length,
        buildings:RIO_PRETO_LAYOUT.lots.length,shops:rioPreto.shops,localTraffic:rioPreto.actors,visits:rioPreto.visits,
        tiles:tiles.length,built:built.length,visible:rioPreto.visible,homesMounted:rioPreto.homes.size,homeInteriors:[...rioPreto.homes.values()].filter(home=>home.inside).length,sceneryInstances:built.reduce((sum,t)=>sum+t.primitives,0)
      };
    }
  });

/** Exact bounds for static box instances; only offscreen geometry is culled. */
// @otthi-module-body
  function createBoundedWorldBoxInstances(material,items){
    let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;for(const matrix of items){const e=matrix.elements;minX=Math.min(minX,e[12]);maxX=Math.max(maxX,e[12]);minZ=Math.min(minZ,e[14]);maxZ=Math.max(maxZ,e[14]);}
    const chunks=new Map(),spatial=!material.transparent&&(maxX-minX>64||maxZ-minZ>64);
    for(const matrix of items){const e=matrix.elements,key=spatial?Math.floor(e[12]/32)+':'+Math.floor(e[14]/32):'transparent';let chunk=chunks.get(key);if(!chunk)chunks.set(key,chunk=[]);chunk.push(matrix);}
    const meshes=[],unit=new THREE.Box3(new THREE.Vector3(-.5,-.5,-.5),new THREE.Vector3(.5,.5,.5)),part=new THREE.Box3();
    for(const matrices of chunks.values()){
      // Each batch owns its tiny unit geometry, so its aggregate bounds never
      // overwrite the shared geometry used by other objects or instances.
      const geometry=new THREE.BoxGeometry(1,1,1),bounds=new THREE.Box3(),mesh=new THREE.InstancedMesh(geometry,material,matrices.length);
      matrices.forEach((matrix,i)=>{mesh.setMatrixAt(i,matrix);bounds.union(part.copy(unit).applyMatrix4(matrix));});
      geometry.boundingSphere=bounds.getBoundingSphere(new THREE.Sphere());mesh.instanceMatrix.needsUpdate=true;mesh.userData.otthiBoundedInstances=true;mesh.frustumCulled=true;meshes.push(mesh);
    }
    return meshes;
  }

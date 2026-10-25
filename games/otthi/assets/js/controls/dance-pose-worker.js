/* MediaPipe runs on this worker; images and landmarks stay on the device. */
let detector=null,lastAt=-1;
self.onmessage=async({data})=>{
 if(data.type==='init'){
  try{const{FilesetResolver,PoseLandmarker}=await import(new URL('../../pose/vision_bundle.mjs',self.location.href).href);const vision=await FilesetResolver.forVisionTasks(new URL('../../pose/',self.location.href).href);detector=await PoseLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:new URL('../../pose/pose_landmarker_lite.task',self.location.href).href,delegate:'CPU'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.55,minPosePresenceConfidence:.55,minTrackingConfidence:.55,outputSegmentationMasks:false});self.postMessage({type:'ready'});}catch(error){self.postMessage({type:'error',message:String(error.message||error)});}return;
 }
 if(data.type==='frame'){
  const image=data.image;try{if(!detector||data.at<=lastAt)return;lastAt=data.at;const start=performance.now(),result=detector.detectForVideo(image,data.at);self.postMessage({type:'pose',landmarks:result.landmarks?.[0]||[],at:data.at,frameId:data.frameId,inferenceMs:performance.now()-start});}catch(error){self.postMessage({type:'error',message:String(error.message||error)});}finally{image?.close?.();}
 }
 if(data.type==='close'){detector?.close();detector=null;self.close();}
};

/* MediaPipe runs off the game thread; no camera frame leaves this device. */
let detector, options, HandTracker, vision, cpuRetried=false;
self.onmessage=async({data})=>{
 if(data.type==='init'){
  try{
   const {FilesetResolver,HandLandmarker}=await import('./vendor/hand-tracker/vision_bundle.mjs');HandTracker=HandLandmarker;
   const root=new URL('./vendor/hand-tracker/',self.location.href).href;
   let delegate='CPU';
   // Use the phone GPU when available; software GPUs are slower than CPU ML.
   try{const canvas=new OffscreenCanvas(1,1),gl=canvas.getContext('webgl2')||canvas.getContext('webgl');if(gl){const ext=gl.getExtension('WEBGL_debug_renderer_info'),name=String(ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER));if(!/swiftshader|llvmpipe|software/i.test(name))delegate='GPU';gl.getExtension('WEBGL_lose_context')?.loseContext();}}catch{}
   vision=await FilesetResolver.forVisionTasks(root);options={baseOptions:{modelAssetPath:root+'hand_landmarker.task',delegate:data.delegate==='CPU'?'CPU':delegate},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.55,minHandPresenceConfidence:.55,minTrackingConfidence:.55};
   try{detector=await HandLandmarker.createFromOptions(vision,options);}catch(error){if(delegate==='CPU')throw error;options.baseOptions.delegate='CPU';detector=await HandLandmarker.createFromOptions(vision,options);}
   self.postMessage({type:'ready',delegate:options.baseOptions.delegate});
  }catch(error){self.postMessage({type:'error',phase:'init',message:error.message});}
 }else if(data.type==='frame'){
  try{
   const started=performance.now(),input=data.pixels?new ImageData(new Uint8ClampedArray(data.pixels),data.width,data.height):data.frame;
   const result=detector.detectForVideo(input,data.timestamp);
   self.postMessage({type:'result',timestamp:data.timestamp,inferenceMs:performance.now()-started,landmarks:result.landmarks,handedness:result.handedness});
  }catch(error){
   // Some Android GPUs initialize successfully but fail on their first actual
   // camera frame. Retry the same on-device model on CPU, once, visibly.
   if(options?.baseOptions.delegate==='GPU'&&!cpuRetried){
    cpuRetried=true;self.postMessage({type:'recovering',message:'Ajustando reconhecimento para este aparelho…'});
    try{detector?.close();options.baseOptions.delegate='CPU';detector=await HandTracker.createFromOptions(vision,options);self.postMessage({type:'ready',delegate:'CPU'});}
    catch(retry){self.postMessage({type:'error',phase:'frame',message:retry.message});}
   }else self.postMessage({type:'error',phase:'frame',message:error.message});
  }
  finally{data.frame?.close();}
 }
};

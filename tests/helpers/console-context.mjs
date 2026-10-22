export async function installConsoleStubs(context){
  return context.addInitScript(()=>{
   const permitted={drive:true,box_pro:true,tennis:true,ar_truck_sim:true,usarmy_flight_sim:true};
   const profile={username:"Jogador Teste",role:"player",xp:0,level:10,coins:8000,permissions:permitted,arSave:{upgrades:{engine:1,battery:1,radar:1,chassis:1,scout:false}}};
   const snapshot=(val)=>({val:()=>val,exists:()=>val!==null});
   const reference=(name="")=>({
     on(evt,cb){if(evt==="value"){queueMicrotask(()=>cb(snapshot(name.startsWith("users/")?profile:null)));}return ()=>{}},
     once:async()=>snapshot(name.startsWith("users/")?profile:null),
     child(part){return reference(name+"/"+part)},
     set:async()=>{},update:async()=>{},remove:async()=>{},off:()=>{},
     onDisconnect(){return {remove:()=>Promise.resolve()}},
     transaction:async()=>({committed:true,snapshot:snapshot(null)})
   });
   const auth={currentUser:{uid:"browser-test-user-123456789012345"},
     onAuthStateChanged(cb){setTimeout(()=>cb(this.currentUser),30);return()=>{}},
     signInWithEmailAndPassword:async()=>({user:this.currentUser}),
     signOut:async()=>{}};
   const db={ref:reference};
   window.firebase={
     apps:[],initializeApp(){},auth:()=>auth,database:()=>db
   };
   window.firebase.database.ServerValue={TIMESTAMP:Date.now()};
   window.tf={ready:async()=>{},setBackend:async()=>true};
   window.poseDetection={SupportedModels:{MoveNet:"MoveNet"},movenet:{modelType:{SINGLEPOSE_LIGHTNING:"lite"}},createDetector:async()=>({estimatePoses:async()=>[]})};
   window.__cameraRequests=0;
   try{Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{getUserMedia:async()=>{
      window.__cameraRequests++;
      throw new Error("Câmera indisponível no smoke isolado");
   }}})}catch{}
  });
}

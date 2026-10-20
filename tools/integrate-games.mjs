/**
 * Integrate seven faithful upstream snapshots already copied into games/.
 * Strict patches fail on upstream drift rather than silently replacing features.
 */
import {readFileSync,writeFileSync,copyFileSync,existsSync,statSync} from "node:fs";
import {join} from "node:path";
const root=process.cwd(), games=join(root,"games"), extras=join(root,"enhancements");
function read(path){if(!existsSync(path))throw new Error("Arquivo ausente: "+path);return readFileSync(path,"utf8")}
function write(path,body){writeFileSync(path,body,"utf8")}
function once(text,from,to,path){
 if(!text.includes(from))throw new Error("Trecho original divergente em "+path+": "+from.slice(0,90));
 return text.replace(from,to);
}
const specs=[
 ["kart","drive","Kart Legends","game_kart.js"],
 ["boxe","box_pro","Boxing Pro","game_box.js"],
 ["tenis","tennis","Ping Pong Wii","game_tennis.js"],
 ["ar","ar_truck_sim","AR Ops Premium","game_ar.js"],
 ["voo","usarmy_flight_sim","Aero Strike WAR","game_flight.js"]
];
const all=["game_kart.js","game_box.js","game_tennis.js","game_ar.js","game_flight.js"];
let count=0;
for(const [slug,id,title,filename] of specs){
 const dir=join(games,slug),path=join(dir,"index.html"),corePath=join(dir,"js/core.js");
 if(!statSync(dir).isDirectory())throw new Error("Pasta ausente: "+slug);
 if(!read(join(dir,"js",filename)).includes("registerGame"))throw new Error("ID de jogo de origem não encontrado em "+filename);
 let html=read(path),core=read(corePath);
 if(html.includes("arcade-enhancements.js"))throw new Error("Já importado: "+slug);
 for(const file of all){
    if(file===filename)continue;
    const line='    <script src="js/'+file+'"></script>';
    html=once(html,line,"",path);
 }
 // Fix a real original bug: final-score is not the ID of the rendered result field.
 core=once(core,"document.getElementById('final-score').innerText = finalScore;",
    "document.getElementById('result-score').innerText = finalScore;",corePath);

 const detector=[
  "    window.System.detectorPromise = null;",
  "    window.System.ensureDetector = async () => {",
  "      if (window.System.detector) return window.System.detector;",
  "      if (window.System.detectorPromise) return window.System.detectorPromise;",
  "      if (typeof tf === 'undefined' || typeof poseDetection === 'undefined') return null;",
  "      window.System.detectorPromise = (async () => {",
  "        await tf.ready();",
  "        const result = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {",
  "          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING",
  "        });",
  "        window.System.detector = result;",
  "        return result;",
  "      })().catch(error => { console.warn('Sensor de movimento indisponível:', error); return null; })",
  "      .finally(() => { window.System.detectorPromise = null; });",
  "      return window.System.detectorPromise;",
  "    };"
 ].join("\n");
 const originalDetector=[
  "    await window.System.switchCamera('user');",
  "",
  "    document.getElementById('loading-text').innerText = \"CARREGANDO MOTOR IA...\";",
  "    await tf.ready();",
  "    window.System.detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING });"
 ].join("\n");
 core=once(core,originalDetector,detector,corePath);
 core=once(core,"                    await window.System.switchCamera(targetCamera);",
    "                    await window.System.switchCamera(targetCamera);\n                    if (game.id !== 'ar_truck_sim' && window.System.ensureDetector) await window.System.ensureDetector();",corePath);
 core=once(core,"await new Promise((resolve) => { window.System.video.onloadedmetadata = () => resolve(); });",
    "await Promise.race([new Promise(resolve => { window.System.video.onloadedmetadata = resolve; }), new Promise(resolve => setTimeout(resolve,3500))]);",corePath);
 core=once(core,"        window.System.activeGame = null;\n    },\n\n    menu:",
    "        window.System.activeGame = null;\n        if (window.System.video && window.System.video.srcObject) {\n          try { window.System.video.srcObject.getTracks().forEach(t => t.stop()); } catch {}\n          window.System.video.srcObject = null;\n        }\n        window.System.currentCameraMode = null;\n    },\n    menu:",corePath);

 html=once(html,"</head>",'  <link rel="stylesheet" href="./arcade-enhancements.css">\n</head>',path);
 html=once(html,"<title>hIAguinho GAME</title>","<title>"+title+" • thIAguinho GAME CONSOLE</title>",path);
 html=once(html,"    <!-- CARREGANDO O CORE, ADMIN E OS JOGOS -->",
    '    <script>window.CONSOLE_GAME_ID='+JSON.stringify(id)+';</script>\n    <!-- CARREGANDO O CORE, ADMIN E OS JOGOS -->',path);
 html=once(html,"</body>",'  <script src="./arcade-enhancements.js"></script>\n</body>',path);
 write(path,html);write(corePath,core);
 copyFileSync(join(extras,"game-os.js"),join(dir,"arcade-enhancements.js"));
 copyFileSync(join(extras,"game-os.css"),join(dir,"arcade-enhancements.css"));
 if(!html.includes(JSON.stringify(id)))throw new Error("ID de registro divergente: "+id);
 count++;console.log("Integrado:",slug,id);
}
for(const [slug,world,page,style,script] of [
 ["otthi","otthi","index.html","./console-world.css","./console-world.js"],
 ["familia","familia","3d/index.html","../console-world.css","../console-world.js"]
]){
 const dir=join(games,slug),path=join(dir,page);
 let html=read(path);
 if(html.includes("console-world.js"))throw new Error("Já importado: "+slug);
 html=once(html,"</head>",'<link rel="stylesheet" href="'+style+'"></head>',path);
 html=once(html,"</body>",'<script>window.CONSOLE_WORLD="'+world+'";</script><script src="'+script+'"></script></body>',path);
 write(path,html);
 copyFileSync(join(extras,"world.css"),join(dir,"console-world.css"));
 copyFileSync(join(extras,"world.js"),join(dir,"console-world.js"));
 count++;console.log("Integrado:",slug,world);
}
if(count!==7)throw new Error("Sete jogos obrigatórios: importados "+count);
console.log("Sete pastas concluídas, projetos Firebase e arquivos originais preservados.");

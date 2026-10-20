/* Single coordinated Studio release. Abort on any unexpected source divergence.
 * Originals and Firebase IDs/accounts must not change.
 */
import {readFileSync,writeFileSync,copyFileSync,existsSync} from "node:fs";
import {execFileSync} from "node:child_process";
const read=path=>readFileSync(path,"utf8");
const write=(path,content)=>writeFileSync(path,content,"utf8");
function exact(path,from,to){
 const input=read(path);
 if(input.includes(to)){throw Error("Already integrated: "+path)}
 if(input.split(from).length!==2)throw Error("Unexpected source drift: "+path+" -> "+from.slice(0,80));
 write(path,input.replace(from,to));
}
function assertSize(path){if(!existsSync(path)||readFileSync(path).byteLength<200)throw Error("Missing or truncated file "+path)}
const expected=[
 ["kart","drive","game_kart.js"],
 ["boxe","box_pro","game_box.js"],
 ["tenis","tennis","game_tennis.js"],
 ["ar","ar_truck_sim","game_ar.js"],
 ["voo","usarmy_flight_sim","game_flight.js"]
];
for(const [slug,id,source] of expected){
 const dir="games/"+slug+"/";
 const html=dir+"index.html",game=dir+"js/"+source;
 const original=read(game);
 if(!original.includes("registerGame('"+id+"'"))throw Error("Original game ID drift: "+id);
 if(!read(html).includes("projectId: \"thiaguinhogame-ac91b\""))throw Error("Firebase project changed: "+slug);
 const cssSrc="enhancements/studio-fx.css",jsSrc="enhancements/studio-fx.js";
 assertSize(cssSrc);assertSize(jsSrc);assertSize(game);
 copyFileSync(cssSrc,dir+"studio-fx.css");
 copyFileSync(jsSrc,dir+"studio-fx.js");
 exact(html,'  <link rel="stylesheet" href="./control-modes.css">','  <link rel="stylesheet" href="./control-modes.css">\n  <link rel="stylesheet" href="./studio-fx.css">');
 exact(html,'  <script src="./arcade-pause.js"></script>','  <script src="./arcade-pause.js"></script>\n  <script src="./studio-fx.js"></script>');
 const sw=dir+"sw.js";let worker=read(sw);
 const from='const CACHE=PREFIX+"controls-v3";',to='const CACHE=PREFIX+"studio-v4";';
 if(!worker.includes(from))throw Error("SW version drift: "+slug);
 worker=worker.replace(from,to);
 const target='"./control-modes.js","./control-modes.css"';
 if(!worker.includes(target))throw Error("SW cache list drift: "+slug);
 worker=worker.replace(target,target+',\n"./studio-fx.js","./studio-fx.css"');
 write(sw,worker);
 execFileSync(process.execPath,["--check",dir+"studio-fx.js"]);
 execFileSync(process.execPath,["--check",dir+"js/core.js"]);
 execFileSync(process.execPath,["--check",game]);
 console.log("Studio integrated:",slug,id);
}
const worlds=[
 {slug:"otthi",src:"games/otthi/index.html",css:"./studio-world.css",js:"./studio-world.js"},
 {slug:"familia",src:"games/familia/3d/index.html",css:"../studio-world.css",js:"../studio-world.js"}
];
for(const w of worlds){
 const directory="games/"+w.slug+"/";
 copyFileSync("enhancements/studio-world.css",directory+"studio-world.css");
 copyFileSync("enhancements/studio-world.js",directory+"studio-world.js");
 const file=w.src;
 exact(file,w.slug==="otthi"?'<link rel="stylesheet" href="./console-world.css">':'<link rel="stylesheet" href="../console-world.css">',
 w.slug==="otthi"?'<link rel="stylesheet" href="./console-world.css"><link rel="stylesheet" href="./studio-world.css">':'<link rel="stylesheet" href="../console-world.css"><link rel="stylesheet" href="../studio-world.css">');
 exact(file,w.slug==="otthi"?'<script src="./quest-chapter.js"></script>':'<script src="../quest-chapter.js"></script>',
 w.slug==="otthi"?'<script src="./quest-chapter.js"></script><script src="./studio-world.js"></script>':'<script src="../quest-chapter.js"></script><script src="../studio-world.js"></script>');
 execFileSync(process.execPath,["--check",directory+"studio-world.js"]);
 console.log("Studio integrated:",w.slug);
}
const shader="games/familia/3d/index.html";
const oldFragment="float light=.73+.24*max(dot(n,sun),0.0)+.03*n.y;vec3 view=normalize(uEye-vW);float spec=pow(max(dot(n,normalize(sun+view)),0.0),35.0)*.045;vec3 col=vC*light+vec3(spec);float fog=smoothstep(48.0,135.0,distance(vW,uEye));col=mix(col,vec3(.72,.85,.88),fog*.78);";
const newFragment="float hemisphere=.53+.16*clamp(n.y,0.0,1.0);float diffuse=.23*max(dot(n,sun),0.0);float fill=.07*max(dot(n,normalize(vec3(.5,.5,-.3))),0.0);vec3 view=normalize(uEye-vW);float spec=pow(max(dot(n,normalize(sun+view)),0.0),29.0)*.058;float rim=pow(1.0-clamp(dot(n,view),0.0,1.0),3.0)*.02;vec3 col=vC*(hemisphere+diffuse+fill)+vec3(spec+rim);float fog=smoothstep(52.0,144.0,distance(vW,uEye));col=mix(col,vec3(.69,.81,.86),fog*.71);";
exact(shader,oldFragment,newFragment);
const verify=read(shader);
if(!verify.includes(newFragment)||!verify.includes("gl_FragColor=vec4(col,uFade)"))throw Error("WebGL fragment shader damaged");
console.log("HQ WebGL material lighting enhanced (shader retains geometry and pipeline).");
const firebase=read("games/otthi/firebase-config.js");
if(!firebase.includes('projectId: "otthi-656c5"'))throw Error("OTThi Firebase changed");
console.log("Fidelity verified: 7 installed games, original Firebase IDs, WebGL shader and PWA caches.");

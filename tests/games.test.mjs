import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync, statSync} from "node:fs";
import {execFileSync} from "node:child_process";
const here=path=>new URL("../"+path,import.meta.url);
const read=path=>readFileSync(here(path),"utf8");
const installed=[
  {slug:"kart",id:"drive",file:"game_kart.js"},
  {slug:"boxe",id:"box_pro",file:"game_box.js"},
  {slug:"tenis",id:"tennis",file:"game_tennis.js"},
  {slug:"ar",id:"ar_truck_sim",file:"game_ar.js"},
  {slug:"voo",id:"usarmy_flight_sim",file:"game_flight.js"}
];
test("sete pastas de jogos próprias com páginas originais e arquivos reais",()=>{
 for(const slug of ["kart","boxe","tenis","ar","voo","otthi","familia"]){
   assert(existsSync(here("games/"+slug+"/index.html")),"Página ausente: "+slug);
   assert(statSync(here("games/"+slug+"/index.html")).size>500,"Página pequena/placeholder: "+slug);
 }
 assert(existsSync(here("games/familia/3d/index.html")));
 assert(existsSync(here("games/otthi/app.js")));
});
test("motores GAME registrados com mesmos IDs e autenticação Firebase original",()=>{
 for(const {slug,id,file} of installed){
   const root="games/"+slug+"/";
   const html=read(root+"index.html");
   const code=read(root+"js/"+file);
   const core=read(root+"js/core.js");
   assert(code.includes("registerGame('"+id+"'"),"Game ID divergente: "+id);
   assert(html.includes('window.CONSOLE_GAME_ID="'+id+'"'),"Configuração de jogo divergente: "+id);
   assert(html.includes('projectId: "thiaguinhogame-ac91b"'),"Firebase GAME divergente: "+slug);
   assert(html.includes('src="js/'+file+'"'),"Motor não carregado: "+slug);
   assert(html.includes('src="./arcade-enhancements.js"'),"Melhoria não incluída: "+slug);
   assert(!core.includes("getElementById('final-score')"),"Crash conhecido na tela final: "+slug);
   assert(core.includes("getElementById('result-score')"),"Tela final correta ausente: "+slug);
   assert(core.includes("ensureDetector"),"Sensor não inicializado sob demanda: "+slug);
   assert(!core.includes("await window.System.switchCamera('user');"),"Não solicitar câmera antes do login: "+slug);
   assert(core.includes("const started=await sys.switchCamera(face);"),"Câmera sob demanda ausente: "+slug);
   execFileSync(process.execPath,["--check",here(root+"js/core.js").pathname]);
   execFileSync(process.execPath,["--check",here(root+"js/"+file).pathname]);
   execFileSync(process.execPath,["--check",here(root+"arcade-enhancements.js").pathname]);
 }
});
test("a leitura e as permissões do GAME permanecem no core original",()=>{
 const core=read("games/kart/js/core.js");
 assert(core.includes("window.Profile.permissions[g.id] === true"),"Permissões existentes não preservadas");
 assert(core.includes("window.DB.ref('users/'"),"Persistência original removida");
 assert(core.includes("window.AuthApp.onAuthStateChanged"),"Sessões Firebase originais removidas");
});
test("HQ preserva WebGL, personagens e armazenamento local",()=>{
 const source=read("games/familia/3d/index.html");
 assert(source.includes('id="gl"'));
 assert(source.includes("mascotes-3d.js"));
 assert(source.includes("localStorage"));
 assert(source.includes('src="./console-world.js"'));
});
test("OTThi mantém app e Firebase originais, mas com estilos adaptáveis adicionais",()=>{
 const original=read("games/otthi/index.html");
 const config=read("games/otthi/firebase-config.js");
 assert(original.includes("OTTHI World"));
 assert(original.includes('src="./app.js'));
 assert(original.includes('src="./console-world.js"'));
 assert(config.includes('projectId: "otthi-656c5"'));
 assert(read("games/otthi/console-world.css").includes("safe-area-inset"));
});
test("origem de cada snapshot documentada por commit SHA",()=>{
 const commits=JSON.parse(read("games/source-commits.json"));
 for(const name of ["GAME","OTThi-World3","hq"])assert.match(commits[name],/^[0-9a-f]{40}$/);
});
test("HUD do kart reduzido no celular sem eliminar rank/volta nem motor",()=>{
 const kart=read("games/kart/js/game_kart.js");
 assert(kart.includes("ConsoleGames: leitura instantânea"));
 assert(kart.includes("w <= 700 || h <= 490"));
 assert(kart.includes("d.finalRank"));
 assert(kart.includes("mapSize = w <= 520 ? 78 : 130"));
 assert(kart.includes("d.speed"));
});


test("progressão arcade é baseada em vitórias reais e não escreve no Firebase",()=>{
 for(const {slug} of installed){
   const js=read("games/"+slug+"/arcade-enhancements.js");
   assert(js.includes("data.totalWins"),slug+" sem vitórias observadas");
   assert(js.includes("medalCount()"),slug+" sem troféus de domínio");
   assert(js.includes("milestones"),slug+" sem trilha de conquistas");
   assert(js.includes("localStorage.setItem(key"),slug+" sem persistência própria");
   assert(!js.includes("window.DB.ref("),slug+" não pode alterar dados no Firebase");
 }
});
test("jornadas dos mundos leem contadores existentes sem inventar progressão",()=>{
 for(const [folder,page] of [["otthi","index.html"],["familia","3d/index.html"]]){
   const prefix="games/"+folder+"/";
   const html=read(prefix+page),quest=read(prefix+"quest-chapter.js");
   assert(html.includes("quest-chapter.js"),"Jornada não inserida: "+folder);
   assert(quest.includes("console-games:v2:worldquest:"),"Namespace de quests divergente");
   assert(quest.includes("localStorage.setItem(key"),"Quest sem persistência separada");
   assert(quest.includes("peak"),"Quest sem leitura de incremento verdadeiro");
   assert(!quest.includes("firebase."),"Jornada não deve modificar Firebase");
   execFileSync(process.execPath,["--check",here(prefix+"quest-chapter.js").pathname]);
 }
});
test("HUD Canvas responsivo nas modalidades 2D/3D sem desativar fases",()=>{
 const boxing=read("games/boxe/js/game_box.js");
 const tennis=read("games/tenis/js/game_tennis.js");
 const flight=read("games/voo/js/game_flight.js");
 assert(boxing.includes("HUD de luta estilo arcade"));
 assert(boxing.includes("this.currentFase"),"Fases do boxe não preservadas");
 assert(tennis.includes("Math.min(42,Math.max(22,w*.075))"),"Título tênis não adaptado");
 assert(tennis.includes("this.score.p1"),"Placar tênis ausente");
 assert(flight.includes("Instrumentos compactos"),"Cockpit responsivo ausente");
 assert(flight.includes("this.combat.target"),"Mira de voo ausente");
 assert(read("games/familia/3d/index.html").includes("w<760?1.35:1.6"),"HQ sem densidade adaptativa");
});


test("resultado oferece caminho direto às fases sem contornar autorização",()=>{
 for(const {slug} of installed){
   const core=read("games/"+slug+"/js/core.js"),html=read("games/"+slug+"/index.html");
   assert(core.includes("replay: () =>"),slug+" sem reentrada de fases");
   assert(core.includes("window.Profile.permissions?.[id]===true"),slug+" não verifica permissão no replay");
   assert(core.includes("if(permitted)window.System.openPhases(game)"),slug+" pode abrir fase sem autorização");
   assert(html.includes('onclick="window.System.replay()"'),slug+" botão de resultado não atualizado");
 }
});

test("motor completo: render assíncrono não vaza entre sessões e recompensa é única",()=>{
 for(const {slug} of installed){
  const core=read("games/"+slug+"/js/core.js");
  assert(core.includes("system.loopEpoch !== epoch"),slug+" tem frame atrasado");
  assert(core.includes("system.activeGame !== game"),slug+" mistura duas partidas");
  assert(core.includes("if(window.System.resultLocked) return;"),slug+" pode dar recompensa dupla");
  assert(core.includes("sys.isStarting=true"),slug+" permite abertura simultânea");
  assert(core.includes("window.ArcadeControls?.mode==='camera'"),slug+" pede câmera sem consentimento");
 }
});
test("boxe com controles táteis originais, sem alteração dos IDs no Firebase",()=>{
 const html=read("games/boxe/index.html");
 const touch=read("games/boxe/boxing-touch.js");
 const game=read("games/boxe/js/game_box.js");
 const core=read("games/boxe/js/core.js");
 assert(html.includes("boxing-touch.js")&&html.includes("boxing-touch.css"));
 assert(touch.includes('logic.checkHit(hand,logic.p1,logic.p2)'));
 assert(touch.includes('data-guard'));
 assert(game.includes("this.p2.attackMultiplier = buffDmg"));
 assert(game.includes("(attacker.attackMultiplier || 1)"));
 assert(core.includes("window.ArcadeControls?.mode==='camera'"));
 assert(game.includes("registerGame('box_pro'"));
});
test("tênis pede câmera somente ao selecionar modalidade por câmera",()=>{
 const game=read("games/tenis/js/game_tennis.js");
 const core=read("games/tenis/js/core.js");
 assert(game.includes("requestCameraMode: async function"));
 assert(game.includes("CÂMERA INDISPONÍVEL - USE O DEDO"));
 assert(core.includes("window.ArcadeControls?.mode==='camera'"));
 assert(game.includes("registerGame('tennis'"));
});
test("novas personagens próprias sem referências de franquias em títulos e modos",()=>{
 const kart=read("games/kart/js/game_kart.js");
 const box=read("games/boxe/js/game_box.js");
 for(const franchise of ["MARIO","LUIGI","PEACH","BOWSER","TOAD","YOSHI","WARIO","WALUIGI"]){
  // The original multiplayer room ID is retained for Firebase compatibility.
  const humanFacing=kart.replace(/roomId:\s*'[^']*'/g,"roomId: '[original Firebase room]' ");
  assert(!new RegExp(franchise,"i").test(humanFacing),franchise+" visível no kart");
  assert(!new RegExp(franchise,"i").test(box),franchise+" no boxe");
 }
 assert(kart.includes("CIRCUITO SOLAR"));
 assert(box.includes("VÉRTICE"));
});

test("menu é seguro quando Firebase autentica antes de registrar os jogos",()=>{
  for(const {slug} of installed){
    const core=read("games/"+slug+"/js/core.js");
    assert(core.includes("!Array.isArray(window.Games)"),slug+" não aguarda o registro");
    assert(core.includes("window.Games.forEach"),slug+" perdeu o catálogo original");
    assert(core.includes("window.Profile.loadFromFirebase"),slug+" perdeu o login Firebase");
  }
});

test("cadastros públicos não autoconcedem perfil administrativo",()=>{
 for(const {slug} of installed){
  const core=read("games/"+slug+"/js/core.js");
  assert(core.includes("const role = 'player'"),slug+" permite papel indefinido");
  assert(!core.includes("user.toLowerCase() === 'thiago'"),slug+" concede administração apenas pelo username");
  assert(core.includes("window.Profile.role = data.role || 'player'"),slug+" não respeita perfis de contas existentes");
 }
});

test("cinco jogos pedem permissão para câmera somente depois de escolha explícita",()=>{
 for(const {slug} of installed){
  const root="games/"+slug+"/";
  const html=read(root+"index.html"),core=read(root+"js/core.js");
  const input=read(root+"control-modes.js"),css=read(root+"control-modes.css");
  assert(html.includes('src="./control-modes.js"'));
  assert(html.includes('href="./control-modes.css"'));
  assert(core.includes("await window.ArcadeControls.choose(game)"));
  assert(core.includes("window.ArcadeControls?.mode==='camera'"));
  assert(input.includes('data-mode="controls"')&&input.includes('data-mode="camera"'));
  assert(css.includes("input-mode-dialog"));
  assert(input.includes('hub.mode=choice'));
  execFileSync(process.execPath,["--check",here(root+"control-modes.js").pathname]);
 }
});
test("AR controla cenário virtual e coleta no motor sem câmera",()=>{
 const ar=read("games/ar/js/game_ar.js"),input=read("games/ar/control-modes.js");
 assert(ar.includes("drawVirtualScene: function"));
 assert(ar.includes("this.manualPickupHeld"));
 assert(ar.includes("this.manualPickupRequested"));
 assert(ar.includes("this.changeState('WAITING_PICKUP')"));
 assert(input.includes("logic.currentHeading="));
 assert(input.includes("logic.manualAccelerate"));
 assert(input.includes('id:"pick"'));
 assert(ar.includes("this.completeMission()"));
});
test("voo usa teclado e joystick tátil que acionam comandos originais",()=>{
 const flight=read("games/voo/js/game_flight.js");
 const input=read("games/voo/control-modes.js");
 assert(input.includes('ArrowLeft')&&input.includes('ArrowUp'));
 assert(input.includes('id:"start"')&&input.includes('key("boost"'));
 assert(input.includes('key("missile"'));
 assert(flight.includes("this.keys['ArrowUp']"));
 assert(flight.includes("this.keys['Shift']"));
});

test("cinco jogos possuem favicon explícito sem erro 404",()=>{
 for(const {slug} of installed){
  const html=read("games/"+slug+"/index.html");
  assert(html.includes('<link rel="icon" type="image/svg+xml" href="./icon.svg">'));
  assert(existsSync(here("games/"+slug+"/icon.svg")));
 }
});

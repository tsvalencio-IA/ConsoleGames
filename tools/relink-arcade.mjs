import {readFileSync,writeFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");
const write=(path,s)=>writeFileSync(path,s,"utf8");
const changed=[];
function patch(path,fn){
 const before=read(path),after=fn(before,path);
 if(before===after)throw new Error("Nenhuma alteração realizada: "+path);
 write(path,after);changed.push(path);
}
function replace(s,find,replacement,path){
 if(!s.includes(find))throw new Error("Trecho original não encontrado em "+path+": "+find);
 return s.split(find).join(replacement);
}
for(const name of ["kart","boxe","tenis","ar","voo"]){
 patch("games/"+name+"/arcade-enhancements.js",(s,p)=>replace(s,'back.href="../../";','back.href="../../arcade/";',p));
 patch("games/"+name+"/arcade-pause.js",(s,p)=>replace(s,'href="../../" data-action="exit"','href="../../arcade/" data-action="exit"',p));
}
patch("enhancements/game-os.js",(s,p)=>replace(s,'back.href="../../";','back.href="../../arcade/";',p));
patch("enhancements/pause.js",(s,p)=>replace(s,'href="../../" data-action="exit"','href="../../arcade/" data-action="exit"',p));
for(const name of ["enhancements/world.js","games/otthi/console-world.js","games/familia/console-world.js"]){
 patch(name,(content,path)=>{
  let s=replace(content,'back.href=mode==="familia"?"../../../":"../../";','back.href=mode==="familia"?"../../../arcade/":"../../arcade/";',path);
  s=replace(s,'link.href="../../../";','link.href="../../../arcade/";',path);
  return replace(s,'link.href="../../";','link.href="../../arcade/";',path);
 });
}
patch("arcade/manifest.webmanifest",s=>{
 const m=JSON.parse(s);
 if(m.id!=="/ConsoleGames/arcade/"||m.scope!=="/ConsoleGames/arcade/")throw new Error("Identidade PWA inesperada");
 m.scope="/ConsoleGames/";return JSON.stringify(m,null,2)+"\n";
});
patch("tests/arcade.test.mjs",(s,p)=>{
 s=replace(s,'assert.equal(arcadeManifest.scope,"/ConsoleGames/arcade/");','assert.equal(arcadeManifest.scope,"/ConsoleGames/");',p);
 s+=`
test("instalação única mantém navegação pelos sete jogos no ARCADE",()=>{
 for(const name of ["kart","boxe","tenis","ar","voo"]){
  assert(read("games/"+name+"/arcade-enhancements.js").includes('back.href="../../arcade/"'));
  assert(read("games/"+name+"/arcade-pause.js").includes('href="../../arcade/" data-action="exit"'));
 }
 assert(read("games/otthi/console-world.js").includes('link.href="../../arcade/"'));
 assert(read("games/familia/console-world.js").includes('link.href="../../../arcade/"'));
 assert.equal(arcadeManifest.id,"/ConsoleGames/arcade/");
 assert.equal(arcadeManifest.scope,"/ConsoleGames/");
});
`;
 return s;
});
console.log("Navegação interna PWA adaptada:",changed.length,"arquivos.");

import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const civil=fs.readFileSync('games/otthi/src/modules/65-civil-community.js','utf8');
const sign=fs.readFileSync('games/otthi/src/modules/56-city-coast-life.js','utf8');
function canvasFixture(){
 const textures=[];
 const canvas={width:0,height:0,getContext(){return {
  createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),
  fillRect(){},beginPath(){},ellipse(){},fill(){},fillText(){},
  set fillStyle(_) {},set font(_) {},set textAlign(_) {},set textBaseline(_){}
 }}};
 const THREE={
  CanvasTexture:class{constructor(c){this.image=c;textures.push(this);}},
  Mesh:class{constructor(geo,mat){this.geometry=geo;this.material=mat;this.frustumCulled=true;}},
  SphereGeometry:class{constructor(...args){this.args=args;}},
  MeshBasicMaterial:class{constructor(o){Object.assign(this,o);}},
  UVMapping:'uv',EquirectangularReflectionMapping:'reflection',
  BackSide:1,DoubleSide:2,LinearFilter:'linear',ClampToEdgeWrapping:'clamp',sRGBEncoding:'srgb'
 };
 const scene={objects:[],background:{},add(m){this.objects.push(m);}};
 return {canvas,THREE,scene,textures};
}
test('world panorama uses UV sampling for sky and power-of-two canvas without mips',()=>{
 const f=canvasFixture(),c=vm.createContext({
  THREE:f.THREE,scene:f.scene,renderer:{},civilCommunity:{sky:null},
  qualityTier:()=> 'balanced',document:{createElement:()=>({...f.canvas})}
 });
 const code=civil.slice(civil.indexOf(' function civilSkyEnvironment(){'),civil.indexOf('\n function createCivilCommunity(){'));
 vm.runInContext(code+'\n globalThis.run=civilSkyEnvironment;',c);
 c.run();
 assert.equal(f.scene.objects.length,1);
 const sky=f.scene.objects[0],texture=sky.material.map;
 assert.equal(sky.name,'CIVIL_SKY_PANORAMA');
 assert.equal(texture.image.width,512);assert.equal(texture.image.height,256);
 assert.equal(texture.mapping,'uv');
 assert.equal(texture.generateMipmaps,false);
 assert.equal(texture.minFilter,'linear');assert.equal(texture.magFilter,'linear');
 assert.equal(texture.wrapS,'clamp');assert.equal(texture.wrapT,'clamp');
});
test('city sign names retain text and NPOT-safe sampling on WebGL',()=>{
 const start=sign.indexOf(' function citySign(');
 const line=sign.slice(start,sign.indexOf('\n',start));
 assert.match(line,/canvas.width=768;canvas.height=128/);
 assert.match(line,/texture.generateMipmaps=false/);
 assert.match(line,/texture.minFilter=THREE.LinearFilter/);
 assert.match(line,/texture.wrapS=THREE.ClampToEdgeWrapping/);
 assert.match(line,/c.fillText\(text,384,65,735\)/);
});
test('environment reflections for high quality remain present',()=>{
 assert.match(civil,/if\(qualityTier\(\)!=='high'\)return/);
 assert.match(civil,/generator.fromEquirectangular\(texture\)/);
 assert.match(civil,/scene.environment=civilCommunity.environment.texture/);
});
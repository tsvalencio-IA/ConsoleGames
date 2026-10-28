/* Rasterize the versioned vector artwork for PWA and Android resource sizes. */
import fs from 'node:fs';
import {chromium} from 'playwright';
const source=fs.readFileSync('arcade/icon.svg','utf8');
const browser=await chromium.launch({executablePath:process.env.OT_BROWSER_BINARY||undefined,headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage();
 async function render(svg,size,path){
  const data=await page.evaluate(async({svg,size})=>{const picture=new Image();picture.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));await picture.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=size;canvas.getContext('2d').drawImage(picture,0,0,size,size);return canvas.toDataURL('image/png').split(',')[1];},{svg,size});
  fs.mkdirSync(path.slice(0,path.lastIndexOf('/')),{recursive:true});fs.writeFileSync(path,Buffer.from(data,'base64'));
 }
 const normal=source.replace('<g id="background">','<clipPath id="corner"><rect width="512" height="512" rx="112"/></clipPath><g clip-path="url(#corner)"><g id="background">').replace('</svg>','</g></svg>');
 for(const size of[192,512]){
  for(const base of['arcade','games/otthi/icons']){
   await render(normal,size,`${base}/icon-${size}.png`);
   await render(normal,size,`${base}/icon-${size}-v2.png`);
  }
 }
 for(const base of['arcade','games/otthi/icons'])await render(source,512,`${base}/icon-maskable-512-v2.png`);
 await render(normal,64,'games/otthi/icons/favicon.png');
 await render(normal,512,'android/app/src/main/res/drawable/arcade_icon.png');
 const foreground=source.replace(/<g id="background">[\s\S]*?<\/g>/,'').replace('<g id="mark">','<g id="mark" transform="translate(64 64) scale(.75)">');
 await render(foreground,512,'android/app/src/main/res/drawable/arcade_icon_foreground.png');
 for(const [density,size]of[['mdpi',48],['hdpi',72],['xhdpi',96],['xxhdpi',144],['xxxhdpi',192]])await render(normal,size,`android/app/src/main/res/mipmap-${density}/ic_launcher.png`);
 console.log('PWA, maskable and Android icons rendered from the same vector master.');
}finally{await browser.close();}

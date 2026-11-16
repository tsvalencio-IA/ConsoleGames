#!/usr/bin/env python3
"""Recreate the canonical release from the pristine, approved base.
This runs only in an isolated branch. It never modifies Firebase or saves."""
from pathlib import Path
import re,json

def replace(path,old,new,number=1):
 p=Path(path);text=p.read_text()
 if text.count(old)!=number:raise AssertionError(f'{path}: expected {number} matches, got {text.count(old)}: {old[:60]}')
 p.write_text(text.replace(old,new))

manifest=Path('arcade/manifest.webmanifest')
m=json.loads(manifest.read_text())
m.update(name='thIAguinho ARCADE — Console de 8 jogos',
  short_name='thIAguinho ARCADE',
  description='Console unificado com oito jogos e o OTTHI World.')
# Do NOT change the original identity; the existing build maps this to /arcade/
# on the public Vercel host, just as previously-installed Vercel PWAs expect.
assert m['id']=='/ConsoleGames/arcade/'
manifest.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
p=Path('arcade/sw.js')
s=p.read_text()
assert 'thiaguinho-arcade-shell-v15' in s
s=s.replace('thiaguinho-arcade-shell-v15','thiaguinho-arcade-shell-v16')
s=s.replace('"./account-access.js","./update.js"','"./canonical-navigation.js","./account-access.js","./update.js"')
s=s.replace('version:15','version:16')
p.write_text(s)
Path('arcade/canonical-navigation.js').write_text(r"""/* One launcher per deployment. Preserve all game IDs and saved data. */
(()=>{
'use strict';
const script=document.currentScript;
const base=new URL('./',script?.src||location.href);
const root=new URL('../',base);
const consoleUrl=new URL('arcade/',root);
const names=new Set(['otthi','kart','tenis','boxe','ar','voo','danca','familia']);
const canonicalPath=url=>{
 const u=new URL(url,location.href),path=u.pathname.replace(/^\/ConsoleGames(?=\/)/,'');
 if(u.origin!==location.origin&&!/^(?:otthi-world-campanha-teste(?:-[a-z0-9-]+)?\.vercel\.app|tsvalencio-ia\.github\.io)$/i.test(u.hostname))return null;
 if(/^\/(?:arcade(?:\/|$)|console(?:\.html|\/|$))/.test(path))return consoleUrl.href;
 const match=/^\/games\/([^/]+)(?:\/|$)/.exec(path);
 if(match&&names.has(match[1]))return new URL(path.replace(/^\/+/,'')+u.search+u.hash,root).href;
 return null;
};
function normalize(a){
 const raw=a.getAttribute('href');if(!raw||raw.startsWith('#')||raw.startsWith('javascript:'))return;
 try{const target=canonicalPath(a.href);if(target&&target!==a.href)a.href=target;}catch{}
}
function scan(node){
 if(node.nodeType===1&&node.matches?.('a[href]'))normalize(node);
 node.querySelectorAll?.('a[href]').forEach(normalize);
}
scan(document);
new MutationObserver(records=>records.forEach(r=>{
 if(r.type==='attributes')normalize(r.target);
 else r.addedNodes.forEach(scan);
})).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});
window.OTTHI_CANONICAL=Object.freeze({consoleUrl:consoleUrl.href,game:id=>names.has(id)?new URL('games/'+id+'/',root).href:null});
})();
""")
targets={'arcade/index.html':('./manifest.webmanifest','./canonical-navigation.js'),
 'games/otthi/index.html':('../../arcade/manifest.webmanifest','../../arcade/canonical-navigation.js'),
 'games/familia/3d/index.html':('../../../arcade/manifest.webmanifest','../../../arcade/canonical-navigation.js'),
 'games/danca/index.html':('../../arcade/manifest.webmanifest','../../arcade/canonical-navigation.js')}
for game in ('kart','tenis','boxe','ar','voo'):
 targets[f'games/{game}/index.html']=('../../arcade/manifest.webmanifest','../../arcade/canonical-navigation.js')
for name,(manifest,script) in targets.items():
 p=Path(name);s=p.read_text()
 s,count=re.subn(r'(<link\s+rel="manifest"\s+href=")[^"]+(")',lambda m:m[1]+manifest+m[2],s,count=1)
 if count!=1:
  if name=='games/danca/index.html':s=s.replace('</head>',f'<link rel="manifest" href="{manifest}"></head>',1)
  else:raise AssertionError('Missing manifest: '+name)
 assert '</body>' in s,name
 s=s.replace('</body>',f'<script src="{script}" data-console-canonical="1"></script></body>',1)
 if name=='games/otthi/index.html':
  s=s.replace('<strong>Instalar aplicativo</strong><small>Ícone OTTHI World no celular','<strong>Instalar console</strong><small>Um aplicativo para todos os jogos')
 p.write_text(s)
p=Path('games/atualizar/update.js');s=p.read_text()
assert 'Date.now()+150000' in s
s=s.replace('Date.now()+150000','Date.now()+25000')
s=s.replace("if(!ready)throw Error('Update timeout');",
"if(!ready){console.warn('[OTTHI UPDATE] Worker pending: verify release HTML.');state.workerPending=true;}")
s=s.replace('retry.hidden=back.hidden=true;','retry.hidden=true;back.hidden=false;')
p.write_text(s)
p=Path('vercel.json');v=json.loads(p.read_text())
v['redirects']=[
 {'source':'/console.html','destination':'/arcade/','permanent':False},
 {'source':'/ConsoleGames/arcade','destination':'/arcade/','permanent':False},
 {'source':'/ConsoleGames/arcade/','destination':'/arcade/','permanent':False}]
p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
p=Path('games/kart/js/game_kart.js')
s=p.read_text()
needle="const freshSteering=!Number.isFinite(sample)||now-(this.steeringFrameAt??now)<550;"
assert s.count(needle)==1
s=s.replace(needle,needle+"""
                // Pose tracks wrists, not individual fingers; use a deliberate
                // two-arm spread at shoulder height, never call it palm tracking.
                // Raising both wrists above the nose still triggers legacy turbo.
                this.rearGestureFrames=this.rearGestureFrames||0;
                const points=pose?.keypoints||[],get=name=>points.find(p=>p.name===name);
                const l=get('left_wrist'),r=get('right_wrist'),ls=get('left_shoulder'),rs=get('right_shoulder'),nosePt=get('nose');
                const good=[l,r,ls,rs,nosePt].every(p=>p?.score>.30&&Number.isFinite(p.x)&&Number.isFinite(p.y));
                const span=good?Math.abs(ls.x-rs.x):0;
                const spread=good&&span>25&&Math.abs(l.x-r.x)>span*1.6
                  &&Math.abs(l.y-ls.y)<span*.8&&Math.abs(r.y-rs.y)<span*.8
                  &&l.y>nosePt.y&&r.y>nosePt.y;
                this.rearGestureFrames=spread&&freshSteering?Math.min(12,this.rearGestureFrames+1):Math.max(0,this.rearGestureFrames-3);
                this.cameraRearGesture=this.rearGestureFrames>=8;
""")
old="const direction=window.ArcadeControls?.mode==='controls'&&this.arcadeManual?.rear?-1:1,depth=this.cameraDepth;"
assert s.count(old)==1
s=s.replace(old,"const direction=(window.ArcadeControls?.mode==='controls'&&this.arcadeManual?.rear)||this.cameraRearGesture?-1:1,depth=this.cameraDepth;")
old="if(d.arcadeManual?.rear){ctx.save();ctx.font='bold 12px Arial';"
assert s.count(old)==1
s=s.replace(old,"if(d.arcadeManual?.rear||this.cameraRearGesture){ctx.save();ctx.font='bold 12px Arial';")
old="this.racecraftTrial=null;this.duelTrial=null;"
assert s.count(old)==1
s=s.replace(old,"this.racecraftTrial=null;this.duelTrial=null;this.cameraRearGesture=false;this.rearGestureFrames=0;")
old="const mapX = w <= 520 ? 10 : 25, mapY = w <= 520 ? 172 : 190, mapSize = w <= 520 ? 78 : 130;"
assert s.count(old)==1
s=s.replace(old,"const mapX=w<=520?10:25,mapSize=w<=520?Math.min(112,Math.max(94,w*.24)):130,mapY=Math.min(h-mapSize-18,w<=520?Math.max(106,h*.21):190);")
old="ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.beginPath(); minimapPath.forEach("
assert s.count(old)==1
s=s.replace(old,"ctx.strokeStyle = '#effbff'; ctx.lineWidth = 3/scale; ctx.beginPath(); minimapPath.forEach(")
old='ctx.arc(pt.x, pt.z, r, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.stroke();'
assert s.count(old)==1
s=s.replace(old,'ctx.arc(pt.x, pt.z, r/scale, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle="#fff"; ctx.lineWidth=1.2/scale; ctx.stroke();')
p.write_text(s)
p=Path('tests/games.test.mjs');s=p.read_text()
old='assert(kart.includes("mapSize = w <= 520 ? 78 : 130"))'
assert s.count(old)==1
p.write_text(s.replace(old,'assert(kart.includes("Math.min(112,Math.max(94,w*.24))"),"Minimapa legível no celular")'))
p=Path('tests/arcade.test.mjs');s=p.read_text().replace('pelos sete jogos','pelos oito jogos');p.write_text(s)
print('Rebuilt canonical launcher, 8 games, Kart and recovery without modifying saves')

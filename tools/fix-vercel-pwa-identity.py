#!/usr/bin/env python3
"""Vercel serves the source manifest directly. Preserve legacy installed ID /arcade/."""
from pathlib import Path
import json
p=Path('arcade/manifest.webmanifest')
m=json.loads(p.read_text())
assert m['id']=='/ConsoleGames/arcade/',m['id']
m['id']='/arcade/'
m['start_url']='/arcade/'
m['scope']='/'
p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
p=Path('arcade/sw.js');s=p.read_text()
assert 'thiaguinho-arcade-shell-v18' in s
p.write_text(s.replace('thiaguinho-arcade-shell-v18','thiaguinho-arcade-shell-v19').replace('version:18','version:19'))
p=Path('tests/arcade.test.mjs');s=p.read_text()
assert s.count('assert.equal(arcadeManifest.id,"/ConsoleGames/arcade/");')==2
assert s.count('assert.equal(arcadeManifest.scope,"/ConsoleGames/");')==2
s=s.replace('assert.equal(arcadeManifest.id,"/ConsoleGames/arcade/");','assert.equal(arcadeManifest.id,"/arcade/");')
s=s.replace('assert.equal(arcadeManifest.scope,"/ConsoleGames/");','assert.equal(arcadeManifest.scope,"/");')
p.write_text(s)
p=Path('tests/gameplay-recovery.test.mjs');s=p.read_text()
old="assert.equal(JSON.parse(original).id,'/ConsoleGames/arcade/')"
assert s.count(old)==1
p.write_text(s.replace(old,"assert.equal(JSON.parse(original).id,'/arcade/')"))
p=Path('tests/console-canonical-release.test.mjs');s=p.read_text()
old="assert.equal(m.id,'/ConsoleGames/arcade/')"
assert s.count(old)==1
p.write_text(s.replace(old,"assert.equal(m.id,'/arcade/')"))
print('Vercel PWA id /arcade/ equals PREVIOUS public version; no new installed app identity.')

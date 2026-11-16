#!/usr/bin/env python3
"""Restore both EXISTING install IDs: GitHub Pages and Vercel."""
from pathlib import Path
import json
p=Path('arcade/manifest.webmanifest')
m=json.loads(p.read_text())
assert m['id']=='/ConsoleGames/arcade/',m['id']
m['start_url']='/ConsoleGames/arcade/?app=arcade'
m['scope']='/ConsoleGames/'
p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
p=Path('tools/package-world-preview.py');s=p.read_text()
old="for key in ('start_url', 'scope')"
assert s.count(old)==1
p.write_text(s.replace(old,"for key in ('id', 'start_url', 'scope')"))
p=Path('arcade/sw.js');s=p.read_text()
assert 'thiaguinho-arcade-shell-v17' in s
p.write_text(s.replace('thiaguinho-arcade-shell-v17','thiaguinho-arcade-shell-v18').replace('version:17','version:18'))
p=Path('tests/arcade.test.mjs');s=p.read_text()
assert s.count('assert.equal(arcadeManifest.scope,"/");')==2
p.write_text(s.replace('assert.equal(arcadeManifest.scope,"/");','assert.equal(arcadeManifest.scope,"/ConsoleGames/");'))
p=Path('tests/gameplay-recovery.test.mjs');s=p.read_text()
old="assert.equal(manifest.id,'/ConsoleGames/arcade/')"
assert s.count(old)==1
p.write_text(s.replace(old,"assert.equal(manifest.id,'/arcade/')"))
p=Path('tests/console-canonical-release.test.mjs');s=p.read_text()
old="assert.equal(packaged.id,'/ConsoleGames/arcade/')"
assert s.count(old)==1
p.write_text(s.replace(old,"assert.equal(packaged.id,'/arcade/')"))
print('Source Pages id=/ConsoleGames/arcade/; hosted Vercel id=/arcade/ preserved.')

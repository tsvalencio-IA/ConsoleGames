#!/usr/bin/env python3
from pathlib import Path
import json
p=Path('arcade/manifest.webmanifest')
m=json.loads(p.read_text())
assert m['id']=='/ConsoleGames/arcade/'
m['start_url']='/arcade/'
m['scope']='/'
p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
p=Path('arcade/sw.js');s=p.read_text()
assert 'thiaguinho-arcade-shell-v16' in s
p.write_text(s.replace('thiaguinho-arcade-shell-v16','thiaguinho-arcade-shell-v17').replace('version:16','version:17'))
p=Path('tools/package-world-preview.py');s=p.read_text()
assert "for key in ('id', 'start_url', 'scope')" in s
p.write_text(s.replace("for key in ('id', 'start_url', 'scope')","for key in ('start_url', 'scope')"))
p=Path('tests/arcade.test.mjs');s=p.read_text()
assert s.count('assert.equal(arcadeManifest.scope,"/ConsoleGames/");')==2
p.write_text(s.replace('assert.equal(arcadeManifest.scope,"/ConsoleGames/");','assert.equal(arcadeManifest.scope,"/");'))
p=Path('tests/gameplay-recovery.test.mjs');s=p.read_text()
assert "assert.equal(manifest.id,'/arcade/')" in s
p.write_text(s.replace("assert.equal(manifest.id,'/arcade/')","assert.equal(manifest.id,'/ConsoleGames/arcade/')"))
p=Path('tests/console-canonical-release.test.mjs');s=p.read_text()
assert "assert.equal(packaged.id,'/arcade/')" in s
p.write_text(s.replace("assert.equal(packaged.id,'/arcade/')","assert.equal(packaged.id,'/ConsoleGames/arcade/')"))
print('One unchanged installed PWA ID, hosted start/scope, no data migration')

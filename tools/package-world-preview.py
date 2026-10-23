#!/usr/bin/env python3
"""Package the experimental World together with its real shared game assets.

No source is copied into another game's folder. Production Pages is untouched.
"""
from pathlib import Path
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'dist-world'
DIRECTORIES = ('games', 'arcade', 'covers', 'enhancements')


def root_site_manifest(document):
    """The Pages source keeps its established app identity under /ConsoleGames/.
    Vercel serves this package at the domain root, so its own app URLs must be
    rooted there. This never modifies the source manifest or another origin."""
    result = dict(document)
    for key in ('id', 'start_url', 'scope'):
        value = result.get(key)
        if isinstance(value, str) and value.startswith('/ConsoleGames/'):
            result[key] = value[len('/ConsoleGames'):]
    return result


def package(output=OUTPUT):
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    ignored = shutil.ignore_patterns('__pycache__', '*.pyc', 'node_modules', '.git', 'test-results')
    for name in DIRECTORIES:
        shutil.copytree(ROOT / name, output / name, ignore=ignored)
    for name in ('config.js', 'game-config.js'):
        if (ROOT / name).is_file():
            shutil.copy2(ROOT / name, output / name)
    manifest_path = output / 'arcade/manifest.webmanifest'
    manifest_path.write_text(json.dumps(root_site_manifest(json.loads(
        manifest_path.read_text('utf-8'))), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (output / 'index.html').write_text('''<!doctype html><html lang="pt-BR"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>OTThi World</title>
<meta http-equiv="refresh" content="0;url=games/otthi/">
<script>location.replace('./games/otthi/'+location.search+location.hash)</script>
<body><a href="games/otthi/">Entrar no OTThi World</a><p>Powered by thIAguinho Soluções Digitais</p></body></html>''', encoding='utf-8')
    required = ['games/otthi/app.js', 'games/otthi/release-manifest.json',
                'games/ar/hand-controls.js', 'games/ar/hand-tracker-worker.js',
                'games/ar/combat-controls.css', 'games/ar/vendor/hand-tracker/hand_landmarker.task',
                'games/ar/vendor/hand-tracker/vision_wasm_internal.wasm',
                'arcade/index.html', 'games/familia/3d/index.html']
    for path in required:
        if not (output / path).is_file():
            raise RuntimeError('Missing deployment resource: ' + path)
    print(json.dumps({'packaged': str(output), 'verifiedResources': len(required),
                      'games': ['otthi', 'familia', 'kart', 'boxe', 'tenis', 'ar', 'voo']}, ensure_ascii=False))


if __name__ == '__main__':
    package()

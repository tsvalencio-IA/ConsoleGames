#!/usr/bin/env python3
"""Package the experimental World together with its real shared game assets.

No source is copied into another game's folder. Production Pages is untouched.
"""
from pathlib import Path
import json
import shutil
import hashlib

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


def android_release():
    """Validate the signed package before exposing any installation entry."""
    metadata = ROOT / 'arcade/downloads/release-ot.json'
    if not metadata.is_file():
        return None
    release = json.loads(metadata.read_text('utf-8'))
    filename = release['file']
    if filename != 'thIAguinho-ARCADE-OT.apk' or release['package'] != 'br.com.thiaguinhosolucoes.arcade':
        raise RuntimeError('Unexpected Android package identity')
    apk = (metadata.parent / filename).read_bytes()
    if len(apk) != release['bytes'] or hashlib.sha256(apk).hexdigest() != release['sha256']:
        raise RuntimeError('Android release integrity mismatch')
    return release


def root_site_console(document):
    """Use a real HTML entry when a chat or an embedded browser opens the link."""
    if android_release() is None:
        return document
    original = 'href="./downloads/thIAguinho-ARCADE.apk" download'
    if document.count(original) != 1:
        raise RuntimeError('Android installation button was not found')
    return document.replace(original, 'href="./instalar/"')


def root_site_installer(document):
    """Keep Pages on its original release and this package on its own origin.

    The public APK route also stays outside the old Arcade worker's fetch filter.
    Existing installations need not clear their caches to download the update.
    """
    release = android_release()
    if release is None:
        return document
    original = json.loads((ROOT / 'arcade/downloads/release.json').read_text('utf-8'))
    replacements = {
        'href="../downloads/' + original['file'] + '" download':
            'href="../../android/' + release['file'] + '" download',
        '<span id="release-version">' + original['version'] + '</span>':
            '<span id="release-version">' + release['version'] + '</span>',
    }
    for before, after in replacements.items():
        if document.count(before) != 1:
            raise RuntimeError('Android installation page is inconsistent: ' + before)
        document = document.replace(before, after)
    return document


def package(output=OUTPUT):
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    ignored = shutil.ignore_patterns('__pycache__', '*.pyc', 'node_modules', '.git', 'test-results')
    for name in DIRECTORIES:
        shutil.copytree(ROOT / name, output / name, ignore=ignored)
    for name in ('config.js', 'game-config.js', 'console.html'):
        if (ROOT / name).is_file():
            shutil.copy2(ROOT / name, output / name)
    manifest_path = output / 'arcade/manifest.webmanifest'
    manifest_path.write_text(json.dumps(root_site_manifest(json.loads(
        manifest_path.read_text('utf-8'))), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    console_path = output / 'arcade/index.html'
    console_path.write_text(root_site_console(console_path.read_text('utf-8')), encoding='utf-8')
    installer_path = output / 'arcade/instalar/index.html'
    installer_path.write_text(root_site_installer(installer_path.read_text('utf-8')), encoding='utf-8')
    (output / 'index.html').write_text('''<!doctype html><html lang="pt-BR"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>OTThi World</title>
<meta http-equiv="refresh" content="0;url=games/otthi/">
<script>location.replace((navigator.onLine?'./games/atualizar/':'./games/otthi/')+location.search+location.hash)</script>
<body><a href="games/otthi/">Entrar no OTThi World</a><p>Powered by thIAguinho Soluções Digitais</p></body></html>''', encoding='utf-8')
    required = ['games/atualizar/index.html', 'games/atualizar/update.js', 'games/atualizar/style.css', 'games/otthi/app.js', 'games/otthi/release-manifest.json',
                'games/ar/hand-controls.js', 'games/ar/hand-tracker-worker.js',
                'games/ar/body-controls.js', 'games/ar/body-tracker-worker.js',
                'games/ar/vendor/body-tracker/pose_landmarker_lite.task',
                'games/ar/object-tracker.js', 'games/ar/object-tracker-worker.js',
                'games/ar/combat-controls.css', 'games/ar/vendor/hand-tracker/hand_landmarker.task',
                'games/ar/vendor/hand-tracker/vision_wasm_internal.wasm',
                'arcade/index.html', 'console.html', 'arcade/instalar/index.html',
                'arcade/instalar/install.js', 'games/familia/3d/index.html']
    for path in required:
        if not (output / path).is_file():
            raise RuntimeError('Missing deployment resource: ' + path)
    print(json.dumps({'packaged': str(output), 'verifiedResources': len(required),
                      'games': ['otthi', 'familia', 'kart', 'boxe', 'tenis', 'ar', 'voo']}, ensure_ascii=False))


if __name__ == '__main__':
    package()

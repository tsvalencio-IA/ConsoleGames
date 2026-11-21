/* Instalação web do Universo thIAguinho 3D. Não altera estado nem jogabilidade. */
const PREFIX = 'universo-thiaguinho-3d-pwa-';
const CACHE = PREFIX + 'v19-integracao';
const ASSETS = [
"./audio/engine-fiat-idle.ogg",
"./audio/engine-fiat-load.ogg",
"./audio/engine-hornet-idle.ogg",
"./audio/engine-hornet-load.ogg",
"./audio/engine-inline6-idle.ogg",
"./audio/engine-inline6-load.ogg",
"./audio/engine-turbo6-idle.ogg",
"./audio/engine-turbo6-load.ogg",
"./audio/engine-flat6-idle.ogg",
"./audio/engine-flat6-load.ogg",
"./audio/engine-flatplane8-idle.ogg",
"./audio/engine-flatplane8-load.ogg",
"./audio/engine-coach-idle.ogg",
"./audio/engine-coach-load.ogg",
"./audio/engine-triple-idle.ogg",
"./audio/engine-triple-load.ogg",
"./recorded-audio.js?v=20261029-continuity5","./recorded-audio.js","./audio/rifle-1.ogg","./audio/rifle-2.ogg","./audio/smg-1.ogg","./audio/smg-2.ogg","./audio/marksman.ogg","./audio/engine-car.ogg","./audio/engine-moto.ogg","./audio/engine-heli.ogg","./audio/engine-recordings.json","./audio/engine-road-idle.ogg","./audio/engine-road-load.ogg","./audio/engine-classic-idle.ogg","./audio/engine-classic-load.ogg","./audio/engine-sport-idle.ogg","./audio/engine-sport-load.ogg","./audio/engine-heavy-idle.ogg","./audio/engine-heavy-load.ogg","./audio/engine-moto-idle.ogg","./audio/engine-moto-load.ogg","./audio/engine-twin-idle.ogg","./audio/engine-twin-load.ogg","./audio/engine-small-moto.ogg","./audio/engine-rotor-recorded.ogg","./audio/engine-prop-recorded.ogg","./audio/engine-jet-recorded.ogg","./audio/engine-boat-recorded.ogg","./audio/CREDITS.txt","./audio/sources.json",
  './', './index.html', './game-audio.js', './game-audio.js?v=20261023-3', './manifest.webmanifest',
  './mascotes-3d.js', './acoes-visuais.js', './acoes-visuais.css',
  './console-world.css', './console-world.js', './quest-chapter.js', './studio-world.css', './studio-world.js', './gamepad-support.js','./adaptive-quality.js',
  './troca-bateria.js', './troca-bateria.css', './mascotes_aprovados.webp',
  './icons/mascotes-reais-192.png', './icons/mascotes-reais-512.png', './icons/mascotes-reais-maskable-512.png',
// Exact references from this game entry, including its shared console routes.
  '../../../arcade/manifest.webmanifest',
  './troca-bateria.css?v=1',
  './acoes-visuais.css?v=camera-360-20261016',
  './mascotes-3d.js?v=contato-fisico-20261017',
  './troca-bateria.js?v=contato-fisico-20261017',
  './acoes-visuais.js?v=contato-fisico-20261017',
  '../../../arcade/canonical-navigation.js?v=20261120'
];
importScripts('../../../arcade/game-cache.js?v=20261120');
installGameCache({prefix:PREFIX,versionedCache:CACHE,files:ASSETS, activateImmediately:true, cacheAssets:true});

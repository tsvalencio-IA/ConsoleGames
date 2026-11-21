/* thIAguinho ARCADE — kart: cache privado, versão atual primeiro.
    Nunca apaga caches de outro jogo/PWA; nunca intercepta Firebase externo. */
"use strict";
const PREFIX="thia-arcade-kart-";
const CACHE=PREFIX+"pro-control-v37-pilot-restored1-integracao20261120";
const FILES=[
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
"./recorded-audio.js?v=20261029-continuity5","./recorded-audio.js","./audio/rifle-1.ogg","./audio/rifle-2.ogg","./audio/smg-1.ogg","./audio/smg-2.ogg","./audio/marksman.ogg","./audio/engine-car.ogg","./audio/engine-moto.ogg","./audio/engine-heli.ogg","./audio/engine-recordings.json","./audio/engine-road-idle.ogg","./audio/engine-road-load.ogg","./audio/engine-classic-idle.ogg","./audio/engine-classic-load.ogg","./audio/engine-sport-idle.ogg","./audio/engine-sport-load.ogg","./audio/engine-heavy-idle.ogg","./audio/engine-heavy-load.ogg","./audio/engine-moto-idle.ogg","./audio/engine-moto-load.ogg","./audio/engine-twin-idle.ogg","./audio/engine-twin-load.ogg","./audio/engine-small-moto.ogg","./audio/engine-rotor-recorded.ogg","./audio/engine-prop-recorded.ogg","./audio/engine-jet-recorded.ogg","./audio/engine-boat-recorded.ogg","./audio/CREDITS.txt","./audio/sources.json","./account-access.js","./local-practice.js?v=20261120-route1","./","./index.html","./world-venue-trip.js","./game-audio.js","./game-audio.js?v=20261023-3","./manifest.json","./icon.svg",
"./js/core.js","./js/game_kart.js","./racecraft-evaluation.js",
"./racecraft-duel.js","./arcade-enhancements.js",
"./arcade-enhancements.css","./arcade-pause.js","./arcade-pause.css",
"./control-modes.js","./control-modes.css",
"./studio-fx.js","./studio-fx.css","./studio-scenes.js",
"./mastery-gamepad.js","./mastery-gamepad.css","./pro-controls.css","./play-settings.js","./play-settings.css",
// Exact references from this game entry, including its shared console routes.
  '../../arcade/manifest.webmanifest',
  './account-access.js?v=20261024-head1',
  './js/core.js?v=20261117-pilot-restored1',
  './js/admin.js',
  './racecraft-evaluation.js?v=20261113-duelo2',
  './racecraft-duel.js?v=20261113-duelo1',
  './js/game_kart.js?v=20261113-duelo37',
  './js/game_run.js',
  './control-modes.js?v=20261024-head1',
  './world-venue-trip.js?v=20261120-route1',
  '../../arcade/canonical-navigation.js?v=20261120'
];
importScripts('../../arcade/game-cache.js?v=20261120');
installGameCache({prefix:PREFIX,versionedCache:CACHE,files:FILES});

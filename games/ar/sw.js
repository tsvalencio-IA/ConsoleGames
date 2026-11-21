/* thIAguinho ARCADE — ar: cache privado, versão atual primeiro.
    Nunca apaga caches de outro jogo/PWA; nunca intercepta Firebase externo. */
// Release 2026-10-28: body-guided hand crop, hands-free advance, distinct operations.
"use strict";
const PREFIX="thia-arcade-ar-";
const CACHE=PREFIX+"pro-control-v56-integracao20261120";
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
"./recorded-audio.js?v=20261029-continuity5","./recorded-audio.js","./audio/rifle-1.ogg","./audio/rifle-2.ogg","./audio/smg-1.ogg","./audio/smg-2.ogg","./audio/marksman.ogg","./audio/engine-car.ogg","./audio/engine-moto.ogg","./audio/engine-heli.ogg","./audio/engine-recordings.json","./audio/engine-road-idle.ogg","./audio/engine-road-load.ogg","./audio/engine-classic-idle.ogg","./audio/engine-classic-load.ogg","./audio/engine-sport-idle.ogg","./audio/engine-sport-load.ogg","./audio/engine-heavy-idle.ogg","./audio/engine-heavy-load.ogg","./audio/engine-moto-idle.ogg","./audio/engine-moto-load.ogg","./audio/engine-twin-idle.ogg","./audio/engine-twin-load.ogg","./audio/engine-small-moto.ogg","./audio/engine-rotor-recorded.ogg","./audio/engine-prop-recorded.ogg","./audio/engine-jet-recorded.ogg","./audio/engine-boat-recorded.ogg","./audio/CREDITS.txt","./audio/sources.json","./combat-visuals.js?v=20261109-tactical4","./combat-visuals.js","./account-access.js","./local-practice.js?v=20261120-route1","./","./index.html","./game-audio.js","./game-audio.js?v=20261023-3","./manifest.json","./icon.svg","./world-renderer.js","./vendor/three-r128.min.js","./icon-192.png","./icon-512.png",
"./combat-infantry.js?v=20261109-infantry1","./combat-infantry.js","./vendor/GLTFLoader-r128.js","./vendor/SkeletonUtils-r128.js","./vendor/RGBELoader-r128.js","./vendor/THREE-LICENSE.txt","./assets/infantry/soldier.glb","./assets/infantry/sources.json","./assets/sky/daylight-1k.hdr","./assets/sky/sources.json",
"./combat-presentation.js?v=20261109-tactical4","./combat-presentation.js","./assets/ground/concrete-albedo.jpg","./assets/ground/concrete-normal.jpg","./assets/ground/concrete-arm.jpg","./assets/ground/sources.json",
"./multiplayer.js","./multiplayer.css","./practice-controls.js","./war-screen-orientation.js","./front-controls.js","./hand-controls.js","./body-controls.js","./body-tracker-worker.js","./hand-tracker-worker.js","./combat-controls.css","./js/core.js","./war-screen-orientation.js","./js/game_ar.js","./arcade-enhancements.js",
"./arcade-enhancements.css","./arcade-pause.js","./arcade-pause.css",
"./control-modes.js","./control-modes.css",
"./studio-fx.js","./studio-fx.css","./studio-scenes.js",
"./mastery-gamepad.js","./mastery-gamepad.css","./pro-controls.css","./play-settings.js","./play-settings.css",
// Exact references from this game entry, including its shared console routes.
  '../../arcade/manifest.webmanifest',
  './arcade-pause.css?v=20261024-war4',
  './combat-controls.css?v=20261114-jogabilidade1',
  './account-access.js?v=20261024-head1',
  './js/core.js?v=20261114-jogabilidade1',
  './war-screen-orientation.js?v=20261102-rotate1',
  './js/admin.js',
  './combat-infantry.js?v=20261114-jogabilidade1',
  './world-renderer.js?v=20261114-jogabilidade1',
  './body-controls.js?v=20261029-body7',
  './front-controls.js?v=20261114-jogabilidade1',
  './hand-controls.js?v=20261114-jogabilidade1',
  './practice-controls.js?v=20261114-jogabilidade1',
  './multiplayer.css?v=20261024-mp1',
  './multiplayer.js?v=20261028-mp2',
  './js/game_ar.js?v=20261114-jogabilidade1',
  './control-modes.js?v=20261114-jogabilidade1',
  './arcade-pause.js?v=20261024-war4',
  './play-settings.css?v=20261114-jogabilidade1',
  './play-settings.js?v=20261114-jogabilidade1',
  '../../arcade/canonical-navigation.js?v=20261120'
];
importScripts('../../arcade/game-cache.js?v=20261120');
installGameCache({prefix:PREFIX,versionedCache:CACHE,files:FILES});

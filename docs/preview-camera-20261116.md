# OTTHI — prévia conservadora de carregamento

Branch: preview/otthi-camera-evolucao-20261116
Base: continuation-20261111 / f2c2112

All 15 illumination variants, all 12 camera warmup views, all 44 vehicle models and all original systems are kept. GPU synchronization is batched once per four views; loading progress repaints once every four vehicles. This targets setup time without removing resources.

The Vercel preview-only build regenerates the app.js bundle, index.html, sw.js, release-manifest.json and module-order.json with the official build script. Production remains intact. No Android physical device has been benchmarked; this is a candidate, not a validated release.

The alternative Manus patch that precompiles only 8 light buckets was deliberately not integrated: another wider camera sweep found rare poses needing higher buckets, which could cause in-game stalling.

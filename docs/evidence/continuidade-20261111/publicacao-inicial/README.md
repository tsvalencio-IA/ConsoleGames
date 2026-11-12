# Referência da publicação — 11/11/2026

Inspeção somente leitura. Nenhuma publicação, promoção, conta ou base de dados alterada.

- Produção: `https://otthi-world-campanha-teste.vercel.app`.
- Projeto Vercel: `prj_wKaHtyk7Pb3vsb9KsnKerxS8bOKm`, equipe `team_W3UyY5ss3Shyv78KRMndjust`.
- Deployment associado ao domínio: `dpl_8u99crzy7sLwM2UkGtJiSwE7SLLa`, estado `READY`, ambiente `production`.
- Commit publicado: `cdc695f04f62dd67fe28ec94ea5edaca73474f95`.
- Preview posterior: `dpl_6MaksgFgE1Tf6ZrUZnGvSKYuP12x`, commit `6258e611f8a426e9779299d900455079d03c6279`. A diferença é registro documental, conforme inspeção Git realizada pelo agente principal.
- `/arcade/` e `/games/otthi/`: HTTP 200 com HTTPS verificado pelo urllib e CA fornecida pelo ambiente.
- HTML do mundo: build `705.28.25-transito-fluidez`; revisão `23767784d2d7a3aa`.
- 38/40 documentos e recursos iniciais do console/mundo possuem SHA-256 idêntico à cópia recuperada de `6258e61`. As duas diferenças são transformações previstas em `tools/package-world-preview.py`: link Android aponta a `./instalar/`, e manifesto do console remove o prefixo `/ConsoleGames` de `id/start_url/scope`.

## Evidências

`vercel-metadata.json`: registros retornados pelas ferramentas autenticadas Vercel.

`http.json`: cabeçalhos HTTP; `asset-hashes.json`: URLs e hashes. Os 404 em `/version.json` e `/manifest.webmanifest` são sondagens na raiz; os manifestos efetivos ficam em `/arcade/` e `/games/otthi/` e responderam 200.

`browser.json`: a primeira tentativa nativa do Chromium parou em `ERR_CERT_AUTHORITY_INVALID`. Não foi desativada validação TLS.

`browser-verified-fetch.json` e imagens `*-desktop-verified-fetch.png`: menus renderizados no Chromium, com requisições HTTP atendidas pelo urllib usando a CA do ambiente. Não constituem teste da pilha TLS nativa do Chrome nem de conexões WebSocket. Console mostrou oito cartões, incluindo Dança; mundo exibiu versão esperada. Sem erros JavaScript ou falhas HTTP nessa renderização inicial, sem rolagem lateral no viewport 1365×768.

## Limites

Não foram iniciadas partidas, autenticação, multiplayer ou entregas nesta inspeção. Não se mediu FPS e não se usou celular físico. Requisições encaminhadas para renderizar menus não comprovam reprodução YouTube, câmera, PWA instalado ou persistência de uma partida. Esses fluxos dependem dos testes funcionais separados conduzidos pela equipe principal.

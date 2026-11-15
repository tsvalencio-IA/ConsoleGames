# Conferência do preview publicado — 11/11/2026

Preview `dpl_5AhVkSqxgjC1hFsbDDUPfznR81Wu` confirmado `READY`, fonte Git, branch `continuation-20261111`, commit `1d7088cee900f5dfa4097f92fa9737e7897ccdc3`. O campo `target` retornado pela Vercel é `null`, correspondente ao preview. URL: https://otthi-world-campanha-teste-90nej7ddt-thiaguinho-s-projects.vercel.app

O domínio principal continua associado ao deployment de produção `dpl_8u99crzy7sLwM2UkGtJiSwE7SLLa`, commit `cdc695f04f62dd67fe28ec94ea5edaca73474f95`, `target: production`.

As três páginas `/arcade/`, `/games/otthi/` e `/arcade/previews/war-controls-20261111.html` responderam HTTP 200. O console exibiu os oito jogos, incluindo Dança. O menu do mundo exibiu `705.28.26-estabilidade-oficina`, revisão `becf18164ea4bdb9`. A prévia WAR exibiu o estudo de controles e o aviso de câmera simulada, sem usar conta ou progresso.

Renderização inicial no Chromium headless, viewport 960×640: nenhuma falha HTTP, nenhum erro JavaScript e nenhuma rolagem lateral nas três páginas. A captura `war-controls-menu.png` registra um quadro inicial da prévia, sem comandos de jogo enviados pelo teste.

**Limite de rede:** o Chromium nativo não confia na CA do proxy deste ambiente. Para esta conferência os requests foram interceptados pelo Playwright e atendidos pelo Python urllib com verificação TLS e CA do ambiente. Não se desativou validação de certificados. Isso verifica os documentos e sua renderização, mas não certifica a pilha TLS nativa do Chrome, conexões WebSocket, câmera, login, PWA instalado, partidas ou desempenho físico.

Todos os requests diferentes de GET/HEAD estavam bloqueados durante a inspeção; nenhum foi tentado. Não houve interação com contas, compras, entregas ou multiplayer. Evidências exatas: `deployment-metadata.json`, `menu-http.json`, `menu-browser.json` e a captura PNG.

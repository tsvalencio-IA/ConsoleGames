# Prévia da candidata

Candidata `705.28.26-estabilidade-oficina`, revisão `60705b1100cc8a14`, runtime `cbfcb1af2a29fc26f084a9e3f82dd63663f71f7a`.

Prévia READY: https://otthi-world-campanha-teste-r4f7ol3ct-thiaguinho-s-projects.vercel.app/arcade/

Mundo: https://otthi-world-campanha-teste-r4f7ol3ct-thiaguinho-s-projects.vercel.app/games/otthi/

Proposta separada do WAR: https://otthi-world-campanha-teste-r4f7ol3ct-thiaguinho-s-projects.vercel.app/arcade/previews/war-controls-20261111.html

Deployment `dpl_98AQw9GzdB2ULdyWzrG88MeqxcQU`, projeto e equipe existentes, target preview. Não foi promovido à produção.

`final-http-integrity.json` confere 164/164 arquivos por SHA-256, com zero divergências; `final-entry-check.json` confere as três entradas e os bytes exatos da prévia WAR. Não são testes de câmera ou partida.

O primeiro deployment de rascunho recebeu a injeção da barra de feedback da Vercel, alterando 12 respostas HTML. A falha está preservada em `initial-feedback-integrity-failure.json`. A configuração não sensível `VERCEL_PREVIEW_FEEDBACK_ENABLED=0` foi aplicada somente à branch `continuation-20261111` no ambiente Preview. Nenhuma configuração de produção foi alterada.

Os arquivos `deployment-metadata.json`, `menu-http.json`, `menu-browser.json` e a captura `war-controls-menu.png` são da primeira prévia, identificada em cada relatório. A versão móvel final foi testada localmente, e sua igualdade com o arquivo publicado foi verificada separadamente. A inspeção anterior de menus usou encaminhamento com TLS verificado pelo urllib porque o Chromium não confiava na CA do proxy; essa limitação permanece explícita em `menu-verification.md`.

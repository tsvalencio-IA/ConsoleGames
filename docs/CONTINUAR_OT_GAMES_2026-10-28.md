# Continuação — OT Games / ConsoleGames

Copie este texto para o próximo chat. Se o chat não tiver acesso ao código ou às ferramentas de desenvolvimento, ele deve dizer essa limitação e pedir acesso ao repositório; não deve afirmar que corrigiu ou publicou algo sem executar.

## Pedido do Thiago

Continue as correções do OT Games. O problema prioritário é o mundo aberto travar durante o jogo e o motor continuar fazendo “pá pá pá”. Quero motores gravados de verdade e jogabilidade fluida, preservando a qualidade gráfica, o mapa, os veículos, os NPCs e todas as funções. Não simplifique nem retire conteúdo. Entregue uma versão publicada e verificável, sem prometer notas 10/10 nem afirmar testes em Android físico que não aconteceram. Meu orçamento de tokens está acabando: seja rápido, preciso e não repita toda a investigação.

## Projeto e estado salvo

- Repositório: https://github.com/tsvalencio-IA/ConsoleGames
- Trabalho em andamento: branch `performance-gravacoes-20261027`.
- Ponto salvo anterior: `cd6064fa29cc9febaf3feb40a3edb7038055db9a`. A branch deve ser consultada para obter o checkpoint mais recente; contém as alterações e as provas.
- Produção antes desta correção: branch `world-revisao-20261022`, commit `ca77458f1c20f04de1daa5ab0f0786aeb11700bd`, build `705.27.2-audio-mobilidade`.
- Nova versão preparada: `705.27.3-desempenho-audio`, assetVersion 70636. Não considere publicada sem conferir o estado de publicação abaixo.
- Jogo: https://otthi-world-campanha-teste.vercel.app/games/otthi/
- Instalação: https://otthi-world-campanha-teste.vercel.app/arcade/instalar/
- APK: https://otthi-world-campanha-teste.vercel.app/android/thIAguinho-ARCADE-OT.apk

## Alterações implementadas

1. `07-navigation-traffic-routes.js`: projeções de ruas ordenadas por distância antes dos testes caros de obstáculos, mantendo a mesma escolha do algoritmo original.
2. `41-family-adventure.js`: reaproveitamento curto das sondagens de caminho e rejeição antecipada de obstáculos. As colisões de cada passo continuam sendo verificadas; nenhum ponto de colisão foi removido.
3. `brazilian-models.js` e módulo 29: preparo dos mesmos modelos completos antes de começar a jogar, para evitar construir a geometria dos carros no meio do trânsito. Não houve redução de polígonos.
4. Novo banco de 17 arquivos de motores reais CC0, com autoria, procedência, edição e hashes em `audio/engine-recordings.json`. Versão `20261028-recorded3`. Inclui carros, Fusca gravado, esportivos, diesel, motos, helicóptero, avião a hélice, jato e lancha. São adaptações por família de motor, não gravações de fábrica de cada modelo nomeado. Elétricos conservam zumbido sintetizado; bicicleta e balão não recebem motor a combustão.
5. Banco compartilhado `enhancements/recorded-audio.js`, copiado nos sete jogos. O adaptador do mundo `assets/js/vehicles/engine-sound.js` usa as gravações e remove o gerador de ignições/pulsos. Carregamento por demanda, transições de aceleração e volume, silêncio ao pausar/encerrar.
6. Cache, índices, manifesto e build atualizados. Não alterar contas, senhas, Firebase, regras, IDs ou saves.

## Evidências já obtidas

- `node --test tests/*.test.mjs`: 280 aprovados, zero falhas. Log em `test-results/world-performance-regressions/node-unit.log`.
- `tests/transport-audio-browser.mjs`: 102 grafos de áudio aprovados (51 tipos/modelos em dois sistemas). Compara as amostras realmente reproduzidas com os OGG licenciados, além de aceleração, pausa, volume zero e encerramento. Relatório `test-results/recorded-audio/result.json`.
- Comparação de CPU em 40 passos de simulação: cidade 2127,5 → 370,3 ms; praia com família 4917,4 → 374,3 ms. Perfis em `test-results/world-frame-before/` e `world-frame-after/`. O desenho foi limitado para isolar CPU: isto NÃO é FPS de celular.
- Chromium usa WebGL por software neste ambiente. Um teste sem limite de desenho teve compilação/desenho muito lento; não serve para alegar fluidez em GPU/Android reais.
- Teste nativo do Fusca: entrar com quatro familiares e carregar exatamente as duas gravações do Fusca passou.
- A espera inicial desse teste falhou porque a preparação de teste estava 0,13 m fora do raio da porta; corrigida somente a coordenada de aproximação no teste (2,0 m). Não era bloqueio do jogo.

## O que concluir

1. Terminar `tests/transport-flight-browser.mjs`: helicóptero/avião/balão, quatro assentos, teleférico, redimensionamento sem quadro branco e capturas reais. O relatório definitivo deve ter `passed:true`.
2. `python3 games/otthi/tools/build_project.py --check`, `python3 tools/package-world-preview.py`, `git diff --check`.
3. Salvar todas as alterações e provas na branch de trabalho; o checkpoint anterior já contém as gravações e as principais otimizações.
4. Publicar somente depois dos testes funcionais. Avançar produção por fast-forward e criar deployment Vercel fixado no SHA exato. Confirmar READY e alias canônico.
5. Rodar `tests/world-civil-public-integrity.mjs`, `tests/transport-public-integrity.mjs`, `tests/transport-public-browser.mjs`, `tests/android-download-browser.mjs`. O segundo foi estendido para validar os 17 motores e manifesto nos sete jogos.
6. Informar o que realmente passou e as limitações restantes. Não declarar teste físico de Android, câmera, alto-falante ou multiplayer remoto nesta revisão sem evidência.

## Publicação

Estado no momento desta primeira gravação do resumo: alterações em validação; nova versão ainda não confirmada em produção. Uma atualização ao final deste arquivo prevalece sobre esta frase.

## Dados técnicos de retomada

Vercel: projeto `prj_wKaHtyk7Pb3vsb9KsnKerxS8bOKm`, time `team_W3UyY5ss3Shyv78KRMndjust`, repoId 1427071731. Build: `python3 games/otthi/tools/build_project.py && python3 tools/package-world-preview.py`; output `dist-world`; install `true`; framework/rootDirectory nulos.

No ambiente atual: `/workspace/scratch/a10cbbfeaf34/ConsoleGames`. Chromium: `/workspace/scratch/a10cbbfeaf34/qa-browser/chromium`, versão 138.0.7204.0. Usar `OT_BROWSER_BINARY` e fixtures que executam servidor e navegador no mesmo processo. Testes de rede pública usam `tests/helpers/browser-network.mjs`.

Não criar agentes paralelos sem instrução explícita. Evitar repetir a suíte inteira se nenhuma mudança de produto invalidar os 280 testes aprovados. Resolver falhas específicas com evidência.

# Mundo unificado — entrega experimental de 23/10/2026

[**Abrir a versão publicada**](https://otthi-world-campanha-teste.vercel.app/games/otthi/)

Esta entrega amplia o mundo original e conecta atividades físicas ao mesmo personagem, mapa, veículos e progresso. Não substitui o projeto por uma demonstração separada. Os jogos independentes não foram editados nesta revisão.

## Identificação da entrega

| Item | Valor |
| --- | --- |
| Repositório | `tsvalencio-IA/ConsoleGames` |
| Branch de revisão | `world-revisao-20261022` |
| Base preservada | `529160af70e987361a429d9a53854626fdc9f576` |
| Implementação inicial | `c12114cce406f3eeb8f208c77efe7e9fc1cc279b` |
| Código final publicado | `8554d2a9204abc5e8be2244d61a533281155de8f` |
| Árvore do código final | `aa268349d01f0d62a11e8ca5555131b55482a8cf` |
| Build / revisão dos arquivos | `705.17.0-world-cities` / `817ba45eefdd3753` |
| Projeto experimental | `otthi-world-campanha-teste` |
| Deployment final | `dpl_DFhP3S7DouDudcSiqCkgfKqddLgp` |
| URL imutável | https://otthi-world-campanha-teste-n23sf2gkh-thiaguinho-s-projects.vercel.app/games/otthi/ |

A publicação foi feita somente no projeto experimental acima. Esta entrega não foi integrada à `main` nem aplicada ao endereço principal. O commit posterior de evidências acrescenta documentação e testes; o código servido está identificado na tabela.

## O que mudou e como jogar

### Mapa, cidades e carros

O limite passou de 380 × 380 para 920 × 920 unidades, cerca de 5,86 vezes a área anterior. A vila existente permanece. Nova Aurora fica a leste, em `(300, -40)`, e Costa Verde a oeste, em `(-300, 110)`. Ambas têm ruas conectadas à OTTOVIAS, prédios com colisões, moradores, trânsito e cupês utilizáveis. Cada cidade tem quatro edifícios principais, três carros de trânsito e dois moradores; essa densidade ainda é de uma cidade pequena.

Abra o mapa, escolha a cidade ou atividade e use a rota de GPS. A escolha de um destino distante não teleporta o personagem. Dois cupês por cidade podem ser conduzidos pela física original de veículos.

Foram criados dois modelos GLB 2.0 originais, um carro de corrida e um cupê, com materiais PBR, peças e quatro rodas independentes. O gerador está no repositório. Não são reproduções de marcas reais nem novos retratos da família.

### Autódromos e kart

O kartódromo pequeno foi retirado da vila. O mapa agora leva a dois autódromos com traçados diferentes, boxes e arquibancadas: Nova Aurora, aproximadamente 326 unidades de pista, e Costa Verde, aproximadamente 261. A interação da entrada abre a configuração da corrida; são três voltas, checkpoints em ordem e três adversários de computador.

Escolha dificuldade fácil, normal ou difícil e auxílio desligado, leve, normal ou forte. O auxílio ajuda a orientar e reduzir a velocidade antes das curvas; o acelerador continua sob controle do jogador. O joystick mantém autoridade para mudar a direção. Durante a prova ficam apenas o painel compacto da corrida, sair, joystick, acelerador, freio e turbo.

Foram corrigidos o bloqueio da largada por veículos estacionados, a orientação dos segmentos do asfalto, a seleção contínua do trecho nas curvas próximas e o passo de simulação. A inspeção visual também encontrou um segundo problema: a etapa posterior de materiais reativava o recorte incorreto dos lotes instanciados no Three r128 e ocultava o asfalto. O código final preserva a visibilidade escolhida ao criar essas superfícies. O teste de regressão executa a etapa real de materiais antes de verificar a pista.

O botão online continua usando o contrato original do backend e concentra a corrida compartilhada em Nova Aurora. Não foi certificado com duas pessoas conectadas nesta entrega.

### Academias e ginásio

Na vila, aproxime-se da entrada e toque na ação contextual:

| Local | Entrada | Atividade |
| --- | --- | --- |
| Academia de luta | `(46, -12)` | Boxe original |
| Academia de dança | `(-38, -10)` | Ritmo com quatro direções |
| Ginásio de ping pong | `(48, 10)` | Tênis de mesa original |

Boxe e tênis reutilizam os jogos existentes em uma janela incorporada; suas regras de acesso e autenticação continuam valendo. O mundo pausa durante a partida e retorna ao mesmo local. O resultado legítimo do jogo pode alimentar o registro da atividade, sem conceder moedas duplicadas.

A dança tem três músicas sintetizadas originais, andamento e dificuldades crescentes, notas simultâneas, precisão, combo, falhas, pausa e desbloqueio por desempenho. Funciona por toque ou teclado; não foi implementado reconhecimento corporal para a dança.

### Família, câmera e campanhas

A seleção original da família foi preservada. Os testes usaram Thiago como personagem controlado e Luna e Liz no grupo. Não foram criados rostos ou substituídos os modelos aprovados.

No combate a pé do mundo unificado, a câmera frontal calibra a mão direita e depois oculta a prévia. O rastreamento continua, orienta a mira e permite caminhar automaticamente; perder a mão interrompe o movimento e o disparo. O disparo automático depende de alvo alinhado e observações recentes da mão. O modo manual mantém movimento, arrastar para mirar e atirar com toques independentes. Os eixos visuais de virar à direita foram verificados por projeção na câmera real.

As campanhas têm locais físicos de quartel, setor norte e base aérea, checkpoint e retomada. A campanha aérea exige embarcar, decolar, combater, retornar, pousar e parar antes da recompensa. Os testes de lógica cobrem decolagem, pouso, cancelamento, retomada e prevenção de recompensa duplicada. A campanha geográfica inteira, do quartel à recompensa final, ainda não foi concluída em um teste contínuo de navegador nesta entrega.

## Validação e limites

| Verificação | Resultado / alcance |
| --- | --- |
| `node --test tests/*.test.mjs` | 169 aprovados, zero falhas, no código final; inclui física real, checkpoints dos dois circuitos, campanha, direção, GLB e ritmo |
| `node tests/studio-verify.mjs` | Verificação estrutural dos sete jogos integrada, sem alterar seus arquivos independentes |
| Mapa e integração | Mundo original carregado, dois modelos, duas cidades, dois circuitos, três atividades, auditorias geométrica e de execução sem problemas no cenário testado |
| Dança no navegador | 32/32 notas, precisão de 100%, pausa e próximo nível liberado; retorno ao local de entrada |
| Boxe e ping pong no navegador | Entrada física abre o jogo original, seleção de fase e modo manual, início da partida e retorno ao mesmo local; não inclui partidas completas dessas modalidades |
| Combate manual no navegador | Helicóptero e combate a pé: seis alvos reais e duas etapas concluídas em cada modo, vitória salva, família e posição de passeio preservadas; três toques simultâneos no helicóptero |
| Câmera publicada | Modelo real MediaPipe CPU/WASM, imagem de mão conhecida por `captureStream`, câmera frontal solicitada, calibração, prévia oculta, caminhar, virar à direita, parada sem mão e liberação dos streams; não substitui teste com uma pessoa em um celular |
| Integridade publicada | Os 27 arquivos do manifesto são comparados por SHA-256 com a árvore local testada; worker compartilhado da mão também responde corretamente |
| Corrida final no navegador | Três voltas e todos os checkpoints concluídos em 189,193 s, com chamadas reais de desenho do asfalto, auxílio forte, acelerador e turbo simultâneos; sem aceleração sozinha |
| Cidades e instalação na publicação final | Cupês dirigíveis nas duas cidades com dois toques simultâneos, auditorias finais sem problemas, família preservada, manifesto standalone, service worker ativo e nenhum erro de instalação apontado pelo Chromium |

Para instalar esta versão como aplicativo pelo navegador, abra o link experimental no Chrome do Android e use o menu **Instalar aplicativo** ou **Adicionar à tela inicial**. Isso instala a versão web; não é um novo APK nativo. O manifesto e o service worker passaram nos critérios de instalação do navegador automatizado, e a instalação em um Android físico permanece pendente.

A validação de câmera foi realizada no deployment anterior `c12114c`; a correção final altera somente a preservação de visibilidade durante o preparo de materiais, sem mudar o controlador da mão. As partidas manuais também foram concluídas antes dessa correção visual. As capturas finais de pista e cidades e a integridade HTTP verificam o código publicado `8554d2a`.

Os serviços externos foram isolados nos testes de interface; os jogos incorporados usaram uma sessão de testes. Esses resultados não certificam autenticação nem o backend online real.

Os cenários de navegador preparam posições salvas para testar uma atividade diretamente. Os comandos de jogar, acelerar, virar, atirar, pontuar e terminar a corrida usam entradas reais da interface. Isso não deve ser confundido com uma viagem completa entre todas as cidades ou com uma pessoa jogando sem automação.

Permanecem sem certificação: FPS e temperatura sustentados em Android físico, câmera em condições variadas, duas pessoas online, instalação física da PWA, APK nativo novo, partidas completas de boxe e ping pong e a campanha geográfica completa de ponta a ponta. O APK principal anterior não foi substituído. Esta é uma versão experimental verificável, não uma certificação de jogabilidade “10/10”.

## Evidências e reprodução

As imagens são capturas reais do jogo, sem montagem. Veja a pasta [de evidências](evidence/world-20261023/), a [largada no autódromo](evidence/world-20261023/autodromo-largada.png), o [mapa publicado](evidence/world-20261023/mapa-publicado.png) e a [conferência dos 27 arquivos](evidence/world-20261023/integridade-publicada.json). Os JSON distinguem testes aprovados, ambientes e escopo. A imagem usada para inferência da mão não é publicada como se fosse uma câmera de usuário.

Para repetir, instale Playwright no ambiente de QA, sirva o repositório por HTTP em `127.0.0.1:4173` e execute os arquivos `tests/world-*-browser.mjs` e `tests/ot-games-browser.mjs`. `WORLD_QA_URL` aponta os testes compatíveis ao deployment público. O teste de cidades verifica também manifesto, service worker e critérios de instalação do Chromium. A rota gerenciada deste ambiente intercepta TLS; somente o navegador descartável de QA recebe a exceção correspondente. As configurações TLS, autenticação e acesso do produto não são alteradas.

## Arquivos da implementação

O diff contra a base contém os arquivos abaixo. `app.js`, `style.css`, `index.html`, service worker, manifesto de release e hashes dos módulos são regenerados pela ferramenta original `games/otthi/tools/build_project.py`. O pacote experimental inclui os recursos compartilhados dos outros jogos para que as rotas relativas de câmera e atividades funcionem.

- `games/otthi/VERSION.json`
- `games/otthi/app.js`
- `games/otthi/assets/js/controls/world-hand-controls.js`
- `games/otthi/assets/js/core/runtime-config.js`
- `games/otthi/assets/js/world-venue-bridge.js`
- `games/otthi/assets/vendor/GLTFLoader-r128.js`
- `games/otthi/assets/vendor/THREE-LICENSE.txt`
- `games/otthi/assets/world/vehicles/NOTICE.txt`
- `games/otthi/assets/world/vehicles/ot-coupe.glb`
- `games/otthi/assets/world/vehicles/ot-racer.glb`
- `games/otthi/index.html`
- `games/otthi/release-manifest.json`
- `games/otthi/src/module-order.json`
- `games/otthi/src/modules/00-runtime-foundation.js`
- `games/otthi/src/modules/05a-world-layout-v704.js`
- `games/otthi/src/modules/07-navigation-traffic-routes.js`
- `games/otthi/src/modules/08-map-parent-settings.js`
- `games/otthi/src/modules/13-houses-npcs-vehicles-base.js`
- `games/otthi/src/modules/13a-sports-kart-v705.js`
- `games/otthi/src/modules/14a-ottovias-highway-v7054.js`
- `games/otthi/src/modules/23-vehicle-effects-driving.js`
- `games/otthi/src/modules/26-input-player-physics.js`
- `games/otthi/src/modules/29-game-loop-controls-gamepad.js`
- `games/otthi/src/modules/30-pause-tests-public-api-bootstrap.js`
- `games/otthi/src/modules/33-otthi-world-professional-core.js`
- `games/otthi/src/modules/36-modular-build-machines.js`
- `games/otthi/src/modules/42-ot-games-modes.js`
- `games/otthi/src/modules/43-world-campaign.js`
- `games/otthi/src/modules/44-world-rhythm.js`
- `games/otthi/src/modules/45-world-activity-venues.js`
- `games/otthi/src/modules/46-world-cities-and-racers.js`
- `games/otthi/src/styles/21-ot-games-modes.css`
- `games/otthi/src/styles/22-world-activity-venues.css`
- `games/otthi/src/styles/23-world-race-focus.css`
- `games/otthi/style.css`
- `games/otthi/sw.js`
- `games/otthi/tools/build_project.py`
- `tests/helpers/browser-network.mjs`
- `tests/ot-games-browser.mjs`
- `tests/ot-games.test.mjs`
- `tests/world-activities-browser.mjs`
- `tests/world-camera-browser.mjs`
- `tests/world-campaign.test.mjs`
- `tests/world-circuits.test.mjs`
- `tests/world-city-public-browser.mjs`
- `tests/world-expansion-browser.mjs`
- `tests/world-expansion.test.mjs`
- `tests/world-rhythm.test.mjs`
- `tools/build-world-racers.mjs`
- `tools/package-world-preview.py`

# 🎮 thIAguinho GAME CONSOLE

**by thIAguinho Soluções Digitais e Otto MMP Ferri**

**[INSTALAR / JOGAR NOVO thIAguinho ARCADE](https://tsvalencio-ia.github.io/ConsoleGames/arcade/)**

> O console original continua em `/ConsoleGames/`, mas o **novo Arcade** usa a URL `/ConsoleGames/arcade/`, seu próprio `manifest.webmanifest` com ID `/ConsoleGames/arcade/`, ícones PNG 192/512, service worker e cache próprios. O novo endereço deve ser aberto em uma aba do navegador (fora do aplicativo antigo) para que o navegador possa oferecê-lo como instalação separada. Nenhum jogo, ID de Firebase ou conta original foi alterado para criar essa instalação.

Sete experiências reunidas em um mesmo site e repositório. Cada jogo é **uma pasta local executável**, não apenas um link para outro GitHub Pages. O objetivo é melhorar usabilidade, ritmo, metas e responsividade sem substituir informações reais de jogadores.

## Aplicativo Android

O aplicativo do console reúne as sete entradas em tela cheia, com rotação e câmera opcional. O projeto e as instruções de compilação estão em [android/](android/README.md); a validação instala o aplicativo no Android 35. O [APK de instalação direta](https://tsvalencio-ia.github.io/ConsoleGames/arcade/downloads/thIAguinho-ARCADE.apk) usa Android 7.0 ou superior e internet para carregar os jogos. No Android, baixe e abra o arquivo; se o sistema solicitar, permita a instalação pelo aplicativo usado no download.

## 📁 Sete jogos instalados

| Jogo | Pasta jogável no ConsoleGames | ID original Firebase / motor | Projeto de origem |
| --- | --- | --- | --- |
| **OTThi World** | [games/otthi/](./games/otthi/) | projeto `otthi-656c5` | [OTThi-World3](https://github.com/tsvalencio-IA/OTThi-World3) |
| **Aventuras em Família 3D** | [games/familia/3d/](./games/familia/3d/) | progresso em `localStorage` | [hq](https://github.com/tsvalencio-IA/hq) |
| **Kart Legends** | [games/kart/](./games/kart/) | `drive` | [GAME](https://github.com/tsvalencio-IA/GAME) |
| **Boxing Pro** | [games/boxe/](./games/boxe/) | `box_pro` | [GAME](https://github.com/tsvalencio-IA/GAME) |
| **Ping Pong Wii** | [games/tenis/](./games/tenis/) | `tennis` | [GAME](https://github.com/tsvalencio-IA/GAME) |
| **WWAR Combatee** | [games/ar/](./games/ar/) | `ar_truck_sim` | [GAME](https://github.com/tsvalencio-IA/GAME) |
| **Aero Strike WAR** | [games/voo/](./games/voo/) | `usarmy_flight_sim` | [GAME](https://github.com/tsvalencio-IA/GAME) |

Os arquivos originais completos foram copiados para o novo repositório **sem alterar os três repositórios de origem**. A lista de hashes (40 caracteres) dos snapshots exatos está em [games/source-commits.json](games/source-commits.json). As cinco pastas GAME possuem motor, assets e Firebase originais, mas carregam somente o módulo do jogo escolhido. **O arquivo vazio `game_run.js` não foi anunciado como oitavo jogo**.

## Melhorias desta versão

**Interface geral**
- Um único console responsivo e instalável como PWA, com sete cartões que **abrem o próprio jogo na mesma aba**.
- Busca, filtros, favoritos locais e desafios do dia baseados em resultados registrados de partidas.
- Acesso às contas OTThi em modo de consulta de perfil e progresso, sem misturar Firebase com os outros jogos.

**Experiência GAME por pasta**
- Carregamento de um motor selecionado por página, preservando registro, fases, controles, permissões e ID Firebase originais.
- Inicialização tardia dos sensores de câmera/pose **somente após o jogador escolher uma missão**, evitando solicitação prematura no login.
- Correção do ID da tela de resultado (`final-score` inexistente → `result-score` correto).
- HUD e menus móveis mais compactos; respeito às áreas seguras, janelas baixas e rotação de tela.
- Desafio diário de 1 vitória/missão (tênis/AR) ou 2 vitórias (kart/boxe/voo), com recordes e metas salvos em `localStorage` e **sem inventar XP ou alterar Firebase**.
- As permissões preexistentes do GAME continuam sendo verificadas. Um jogador sem autorização enxerga uma mensagem orientadora, não um desbloqueio forçado.

**Melhorias específicas**
- Kart: HUD reduzido de posição, volta e velocidade, mapa menor no celular, menos texto durante a corrida e títulos ajustados em resultados.
- AR: 13 fontes `CanvasRenderingContext2D` corrigidas de `clamp()` inválido para pixels calculados; informações reposicionadas para não sair da tela.
- OTThi e HQ: estilos adicionais de proteção de largura/área segura e acesso de volta ao console. Os seus sistemas nativos de missões e progresso são mantidos.

## Firebase, progresso e isolamento

| Origem | Projeto/salvamento | Política do console |
| --- | --- | --- |
| OTThi World | Firebase `otthi-656c5` | Mantém configuração original e caminho de dados |
| GAME (cinco jogos) | Firebase `thiaguinhogame-ac91b` | Mantém IDs dos cinco jogos e estrutura de contas/permissões |
| HQ | `localStorage` do navegador | Mantém código e chaves originais |
| Metajogo do console | `localStorage` com prefixo `console-games:v2:` | Apenas desafios locais, não sincronizados no Firebase |

Não existe migração automática de contas entre Firebase distintos. Não executar substituição de Firebase nem publicar credenciais administrativas. Nenhuma regra Firebase foi alterada pelo importador.

## Verificação

```sh
# Na pasta raiz do ConsoleGames:
node --test tests/*.test.mjs
# Para validar o navegador com Chromium após instalar Playwright:
npm install --no-save playwright@1.56.1
npx playwright install chromium
python3 -m http.server 4173
# Em outro terminal:
node tests/browser-smoke.mjs
```

- [CI estático](https://github.com/tsvalencio-IA/ConsoleGames/actions/workflows/console-pages.yml): testa motor e IDs, interface, PWA e comportamento dos motores.
- [Smoke mobile com screenshots](https://github.com/tsvalencio-IA/ConsoleGames/actions/workflows/mobile-smoke.yml): mede overflow da página e abre as sete entradas em quatro viewports, **sem acessar servidores externos ou câmeras reais**.
- [GitHub Pages](https://github.com/tsvalencio-IA/ConsoleGames/actions): publicação nativa do branch `main`.

**Limite importante:** os testes de integridade e de layout **não substituem** ensaios reais de jogabilidade, permissões de câmera, FPS, consumo, partidas multiplayer, persistência online e telas de Android/iOS físicos. A meta de jogos “10/10” exige esses ensaios por jogo. Não tratar a conclusão do CI como prova de ausência de todos os bugs.

## Organização e atualizações futuras

```text
ConsoleGames/
├── index.html, app.js, styles.css       # console central
├── firebase-config.js                    # OTThi (somente consulta)
├── games/
│   ├── kart/                             # ID drive
│   ├── boxe/                             # ID box_pro
│   ├── tenis/                            # ID tennis
│   ├── ar/                               # ID ar_truck_sim
│   ├── voo/                              # ID usarmy_flight_sim
│   ├── otthi/                            # mundo aberto original
│   ├── familia/                          # universo 3D original
│   └── source-commits.json               # versões comprováveis
├── enhancements/                         # melhorias reutilizáveis
├── tools/integrate-games.mjs             # importação/patch com checagens estritas
├── tests/                                 # CI e teste visual de layout
└── docs/INTEGRACAO.md                    # contratos técnicos e próximas validações
```

As melhorias reutilizáveis ficam em `enhancements/`, e suas versões copiadas em cada jogo ficam na pasta correspondente. **O importador inicial é intencionalmente estrito e não sobrescreve pastas já instaladas**. Para atualizar um jogo a partir da origem, primeiro comparar os commits e aplicar alterações revisadas somente à pasta solicitada, com validação e possibilidade de rollback.

© thIAguinho Soluções Digitais & Otto MMP Ferri.

# Oficina, garagem, orla e controles móveis — 28/10/2026

Fonte publicada: `a0d467048900b4e39232bb7bd9e10f4aeb7a9408`.
Build `705.28.2-oficina-praia-controles`, assetVersion `70638`, revisão `c3c30da5bd462c6c`.
Vercel `dpl_Av81G517sF5NeJfsNZHiKm6N9ijg`, produção READY e alias canônico conferidos.

## Evidência executada

- `workshop-garage-touch.json`: dois carros dirigidos com eventos nativos de toque, alinhados em boxes separados; dois elevadores erguidos independentemente; seleção dos dois boxes e entrada física, menu e botão da casa na garagem. Somente o posicionamento inicial dos carros e da pessoa usa preparação de teste.
- `coast-rotation.json`: dez moradores, seis surfistas com movimento e prancha, três lanchas com dois ocupantes. Desenho respeita a distância de NPCs. Rotação com três contatos ativos solta direção, aceleração e câmera; layout muda nos dois sentidos. `coast-life.png` foi capturado diretamente do quadro desenhado e inspecionado.
- `war-touch.json`, `war-native.log` e `war-landscape-controls.png`: três tamanhos móveis, quatro contatos simultâneos, arrasto livre da cena, ADS, corrida, cancelamento da corrida ao atirar, configurações de mira/disparo, pausa e liberação ao rotacionar. Mouse e teclado também exercitados. Testes de combate conferem que obstáculo/aliado impedem disparo simples e que o auxílio não gira a câmera sozinho.
- `automatic-update.json`: configuração antiga recuperada, worker antigo substituído preservando perfil/progresso/armazenamento de outra aplicação, início offline após atualização.
- `unit-suite-original.log`: 293 verificações, 292 passaram; falha textual de ordenação de scripts por causa da URL com parâmetro de cache. `unit-settings-retest.log`: sete verificações aprovadas depois de permitir o parâmetro, sem remover a exigência de ordem. `war-controls-unit.log`: 15 verificações de combate aprovadas.

Os ensaios locais do mundo limitam o desenho durante a simulação de CPU e desenham quadros selecionados com WebGL por software. Não medem FPS de Android. A verificação pública do mundo usa o código servido sem interceptação de fonte ou limite artificial de desenho.

## Referência de interação do WAR

Foi consultado o guia oficial da Activision, [Getting a Grip on the Call of Duty: Mobile Controls](https://blog.activision.com/call-of-duty/2019-10/Getting-a-Grip-on-the-Call-of-Duty-Mobile-Controls), de 2019, para princípios de movimento, arrasto da vista, sensibilidade, corrida, mira e modos simples/avançado. O jogo mantém seu conteúdo e identidade; esta revisão não entrega equivalência gráfica, de animações ou de conteúdo com COD Mobile.

## Limites

Nenhuma instalação em aparelho físico, leitura de sensor Android, calibração de mão/corpo real, partida entre dois celulares ou medição de desempenho sustentado foi executada. O APK permanece o wrapper existente, com `fullUser`, e segue a configuração de rotação automática do Android. O código web deixa de bloquear paisagem e responde ao redimensionamento.

WAR permanece no console. O mundo aberto continua civil. Surf dos NPCs e lanchas de passeio não equivalem a surf jogável, navios ou missões marítimas concluídas. Veículos e sons continuam com as limitações registradas na continuação.

## Verificação pública

- `public-world-resources.json`: 95 recursos protegidos, todos com SHA-256 idêntico à fonte validada. Build e revisão corretos. APK público existente com 57.991 bytes e SHA-256 `8ea2f38c966ee3b938dab2362569ef0224488ab5748c6e9ba1accb0336c0fc49`.
- `public-war-controls.json`: auditoria incremental dos oito arquivos alterados do controle WAR e da camada compartilhada; bytes públicos idênticos à fonte. A auditoria completa anterior dos 275 recursos de transporte não foi repetida para recursos sem alteração.
- `public-native-browser.json`: início real do mundo público, quatro familiares embarcados, órbita, cabine, retorno ao acompanhamento, decolagem pelo coletivo, retrato/paisagem no voo, mapa, retorno ao mundo e seis surfistas/três lanchas verificados. Sem erros de JavaScript, sem interceptação da fonte nem limite artificial de desenho. `public-landscape-flight.png` foi inspecionado.
- `release.json`: SHA, build, revisão, implantação e alias conferidos.

# WAR nativo: avaliação de controle frontal

O estudo separado foi integrado ao jogo WAR existente como opção de avaliação. A página `arcade/previews/war-native-20261112.html` abre o motor, os personagens, cenários, armas, colisões e missões reais. Escolher **JOGAR SOZINHO** e então **CONTROLES** permite experimentar sem câmera. Os endereços `games/ar/?war-control=continuous` e `games/ar/?war-control=step` pré-selecionam a opção no seletor nativo; a escolha continua explícita antes da partida.

No modo experimental, a mão direita controla o retículo dentro da vista; uma faixa lateral sustentada por 350 ms gira a vista. O giro pode ser contínuo ou um único passo de 45°, que exige recentralizar antes de outro. A pinça dispara na câmera. Corpo e pés podem deslocar/agachar; não é necessário virar fisicamente para girar no jogo. No toque, arrastar no campo simula a mão e soltar centraliza. Joystick, WASD, botões e teclado seguem disponíveis.

A avaliação é restrita ao solo local. A escolha não é gravada como nova calibração, não muda o controle padrão e não entra em contas online ou multiplayer. Usa o fluxo nativo de resultados e progresso solo, sem inventar moedas ou vitórias. O ponto de entrada continua oferecendo o controle anterior para comparação.

## Verificação concluída

- **46 testes focados passaram**, incluindo os contratos anteriores de mão/corpo, controles manuais e novo controlador. A mira e o raio de acerto coincidem em retrato, paisagem, ADS e câmera. Perda de leitura interrompe comandos. Os passos continuam sendo exatamente 45° em sensibilidades 0,5, 1 e 2.
- O ensaio de navegador verificou o controle anterior, o giro contínuo e o passo único, confirmação intencional, centralização e interrupção ao soltar. Usou o WAR real e sua renderização nativa, sem limitar os desenhos.
- **Patrulha do Porto completa**: dois setores assegurados, sete inimigos nativos derrotados, 21 acertos em 27 disparos, uma recarga e extração/vitória. O ensaio durou 120,1 s de parede e 76,24 s de tempo nativo. Esses valores não são uma medição de FPS ou de celular.
- A operação foi iniciada pela interface em dificuldade fácil, proteção relaxada e recuperação, opções existentes. O condutor automatizado apenas lê a telemetria/obstáculos e usa pointer, WASD, setas, Espaço e R. Não escreve posições, inimigos, HP, objetivos, tempo de simulação ou estado do renderizador.
- A vitória usou o resultado nativo: 400 XP e 140 moedas locais. Esperar e recarregar conservaram exatamente o mesmo progresso, sem pagamento duplicado. As requisições externas foram bloqueadas; nenhuma conta ou base real foi usada.
- O navegador anterior de duas mãos com os modelos de produção também passou, preservando o caminho atual. Isso é um ensaio de modelo/entrada de teste e não comprova precisão corporal em aparelho.

A primeira tentativa encontrou uma falha real da interface existente em paisagem: o botão **RECOMEÇAR** do treino cobria **PAUSA** em 844×390. A captura e o relatório iniciais foram preservados. O painel de treino agora reserva o espaço da pausa em telas baixas; a repetição clicou normalmente na pausa e entrou na missão, sem clique forçado.

## Evidências

`native-mission.json` contém o trajeto, combate, objetivos, resultado e recarga do progresso. `native-training.json` registra a comparação de controles. `native-patrol-victory.png` e `native-training-*.png` são capturas do jogo real. `unit-final.log` contém os 46 testes. O teste reproduzível está em `tests/war-front-mission-browser.mjs`.

## Limites

Chromium com WebGL por software e perfis descartáveis. O pointer representa uma mão dentro do quadro; câmera física, reconhecimento MediaPipe no aparelho, cansaço, ergonomia, latência e desempenho sustentado ainda precisam de experimentação humana. A patrulha completa confirma um ciclo jogável e seus objetivos, não aprova diversão nem compara a produção a Call of Duty. O padrão e o multiplayer não foram substituídos.

# OT World — frota brasileira e mobilidade

Build `705.20.0-brasil-family`, 24/10/2026. Esta revisão mantém o motor dos jogos originais, a garagem, a oficina, as seleções da família e os saves existentes.

## Comportamento entregue

- Frota de carros originais em 3D inspirados em Fusca, Gol quadrado, Uno e Kombi. O Fusca azul aparece em Nova Aurora e no trânsito. Os modelos compartilham geometria e mantêm direção, giro das rodas, personalização e integridade das peças. Kart, motos e veículos de serviço conservam seus modelos específicos.
- Thiago, Thamis, Luna e Liz selecionados embarcam no veículo real. Os rigs aprovados sentam e acompanham posição, inclinação e rotação. A reserva dos assentos inclui acompanhantes e grupos de passageiros online; Luna e Liz compartilham um assento com posições distintas.
- Avião e helicóptero podem pousar, parar, permitir desembarque e permanecer estacionados na posição real. A interação, o marcador e o modelo estacionado usam o mesmo save. Caminhar, voltar, embarcar de novo e recarregar não devolve a aeronave à base.
- Passageiros online que aceitaram viajar usam a posição da aeronave do piloto. Há convite de embarque no solo, proteção contra saída no ar e liberação de assento ao sair. O grupo de viagem previamente aceito pode embarcar novamente quando próximo ao motorista, dentro da capacidade. A seleção não força outros jogadores distantes a entrar.
- Carros e caminhão do trânsito comum usam o motor de veículos existente ao serem assumidos. O ator anterior deixa de circular e o carro estacionado persiste. Há resolução determinística de disputa de propriedade no cliente.
- Vias mantêm uma superfície contínua durante a redução de detalhes; a travessia da Costa tem ponte e rampas sobre a água. Cancelas acompanham as duas faixas, e rótulos deslocados do mapa têm ligação visual à posição verdadeira.
- WAR permite abaixar e levantar. O modo de câmera frontal usa a mão calibrada ou um objeto selecionado por seus detalhes. A câmera some depois da calibração; a direção é ancorada à posição apontada, sem giro contínuo quando a mão para. O personagem avança sozinho e só dispara com alvo alinhado. A perda de rastreamento interrompe movimento e disparos; objeto perdido exige recaptura.

## Evidência de validação

- `node --test tests/*.test.mjs`: 191 testes de regras, física, saves, controles, família, progressão, jogos originais e integridade.
- `tests/world-mobility-family-browser.mjs`: toque real do Chromium, família no Fusca, decolagem e pouso do helicóptero, desembarque, caminhada, reembarque, avião parado e saída, tomada de tráfego em cidade e rodovia, recarga e persistência. Auditoria de 2.326 pontos das vias sem bloqueios estáticos. Veículos estacionados são excluídos da auditoria de infraestrutura.
- `tests/world-camera-browser.mjs` e `tests/war-camera-browser.mjs`: detector MediaPipe CPU/WASM real, imagem de referência como vídeo, câmera frontal, calibração, prévia oculta, caminhada, sentido da mira, disparos alinhados e parada ao perder a mão.
- `tests/war-object-browser.mjs`: worker real de rastreamento por pixels, vídeo determinístico de objeto, calibração, mira, posição estável, abaixar, parada e retorno aos controles em WAR e World.
- `tests/kart-camera-browser.mjs`: entrada pelo autódromo Aurora, MoveNet real, volante visível seguindo as mãos, parada ao perder rastreamento e retorno ao mundo preservando perfil e família.
- `tests/world-travel-party-browser.mjs`: reprodução do protocolo online no cliente real, família acompanhando altitude/inclinação, uma aeronave por piloto desembarque somente no solo e liberação dos assentos ao sair.
- `tests/war-touch-browser.mjs`: quatro dedos simultâneos, arrasto para olhar, mira aproximada, disparo, pausa e mudança de orientação em 390×844, 844×390 e 320×568; mouse e teclado no desktop.
- `tests/world-activities-browser.mjs`: dança com pontuação e pausa, entrada e volta dos jogos originais de boxe e ping-pong e autódromo com motor original do kart e acelerador por toque.
- `tests/arcade-entry-browser.mjs`: entrada solo real e reabertura offline de kart, boxe, ping-pong, WAR e avião.
- `tests/world-update-browser.mjs`: atualização a partir de `b3cdc7f`, recuperação de configuração antiga, troca real do service worker e reabertura offline preservando perfil e família.
- `tests/android-download-browser.mjs`: sete fluxos de download, incluindo cache antigo, orientações mobile, desktop e sem JavaScript. Bytes e hash do APK conferidos.

## Limites da evidência

Os testes de câmera usam vídeos controlados; não certificam iluminação, precisão ou desempenho de uma câmera física. O teste online reproduz mensagens e poses no cliente e não substitui uma partida entre dois celulares com Firebase. O APK existente é o invólucro assinado que recebe esta atualização web; foi testado o download, não uma nova instalação física. Esta revisão não atribui notas ou porcentagens de semelhança com jogos comerciais.

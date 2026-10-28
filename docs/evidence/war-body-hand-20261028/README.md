# WAR: corpo e mão na câmera — 28/10/2026

Fonte: `840459a6aa7b8d987bd3c2d8ddde520603ea0e6b`.
Build `705.28.3-war-corpo-mao`, assetVersion `70639`, revisão `5fe2fbcf4436ea87`.

## Falha corrigida

O reconhecimento da mão encerrava a calibração e escondia a prévia mesmo quando o corpo ainda carregava ou não estava enquadrado. Havia uma segunda transição direta para PLAYING no retorno do worker de mãos, que também precisava ser corrigida.

Agora a partida só começa com mão/objeto e corpo calibrados e com observações recentes dos dois. A prévia mostra o andamento de cada sensor e o esqueleto corporal durante a calibração. Depois, a imagem do usuário desaparece, e os sensores continuam locais. O corpo controla postura, giro e passos; a mão controla a mira. Não há joystick no modo câmera. Em pé e neutro, o personagem não avança sozinho.

Perda de corpo bloqueia movimento e disparo e limpa a aquisição pendente do alvo. A perda da mão continua interrompendo as ações. Um erro do detector corporal reabre a calibração com erro explícito e tentativa de recuperação. Recalibração, pausa e saída descartam observações pendentes; sair para controles encerra a câmera e os dois workers.

O painel em paisagem foi ajustado para manter os dois estados e os botões acessíveis. O processamento da imagem de prévia deixa de ocorrer em todos os quadros quando ela está escondida: continua somente quando há inferência de mão/objeto a enviar. O agendamento corporal existente permanece limitado.

## Validação local

- `unit-tests.log`: 39 verificações de corpo, mão, combate, câmera e recuperação aprovadas, incluindo bloqueio sem corpo e descarte de observação anterior à pausa/recalibração.
- `local-camera.json`: detector real de mãos CPU/WASM sobre imagem oficial e câmera de teste por captureStream. Com corpo ausente, mão pronta não inicia a partida. Replay corporal explícito confirma calibração conjunta, passos, agachamento, perda do corpo, pausa de movimento/munição/tempo, erro visível e recuperação. Mira, acertos alinhados, perda da mão, recuperação do worker e retorno ao toque também exercitados.
- `local-body-model.json`: worker corporal de produção, modelo real e imagem oficial; 33 pontos de imagem e 33 de mundo retornados.
- `object-camera.json`: rastreador real do objeto sobre pixels determinísticos, corpo por replay explícito, mira, passos, agachamento e encerramento de captura aprovados. A captura do brinquedo opcional foi preservada.
- `manual-multitouch.json`: três layouts móveis, quatro contatos simultâneos, mira, corrida, disparo, pausa/rotação e mouse/teclado aprovados.
- `joint-calibration.png` e `body-unavailable.png`: telas de calibração e falha corporal inspecionadas.

## Limites

O teste integrado usa imagem real de mão e poses corporais sintéticas controladas. O modelo corporal também foi executado separadamente sobre imagem real de teste. Isso não certifica reconhecimento simultâneo do corpo/mão do Thiago em câmera física, precisão no Android, latência do aparelho ou multiplayer entre celulares. Não declarar equivalência com COD Mobile nem nota 10/10.

WAR permanece no console; o mundo aberto infantil não recebe guerra ou tiros. Nenhum APK nativo novo foi compilado.

## Publicação

Implantação `dpl_ErzfEXFbsnSG4zx6dxZxD6Edaq6g` READY, SHA e alias conferidos. `public-world-resources.json`: 95 hashes e APK público aprovados. `public-controls.json`: oito arquivos alterados de controles com bytes idênticos. `public-camera.json`: o mesmo fluxo integrado foi aprovado no código público; imagem de mão e replay corporal controlados estão explicitamente identificados. `public-body-model.json`: modelo corporal público retornou os 33+33 pontos sobre imagem oficial. Nenhuma validação física de celular.

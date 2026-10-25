# WAR: aquisição de alvo entre inferências

O workflow de câmera falhou no commit 5c37c2e, execução 40163190590: calibração, avanço e eixos passaram, mas o disparo automático não confirmou um acerto. O log registrou inferência válida de cerca de 292 ms e perda de atualização entre amostras. Toque no WAR e modos aéreos passaram na mesma execução.

`AimController.read()` tratava a expiração de uma amostra como confirmação de que a mão desapareceu. Isso apagava a primeira observação de um alvo antes de chegar a segunda em aparelhos mais lentos. O motor já distinguia uma leitura atrasada de uma mão ausente, mas o controlador eliminava essa distinção.

A correção mantém `fresh=false` no mesmo prazo anterior: andar e atirar param durante o atraso. Apenas a aquisição pendente tem uma janela curta, limitada entre 900 e 1100 ms. Uma leitura real sem mão, troca de mão, perda de foco ou interrupção maior a limpa. A retomada depois de uma interrupção exige duas novas observações alinhadas. Não houve aumento do prazo do teste nem remoção de verificações.

Validação: o teste novo reproduziu a falha antes da alteração e passou depois. Dezesseis testes focados passaram, incluindo ausência de tiros e movimento com leitura vencida, perda real da mão, expiração de fluxo e recuperação da GPU para CPU. O navegador com MediaPipe CPU/WASM real passou com câmera frontal simulada, avanço automático, eixos, acerto alinhado, perda de mão, retrato, prévia oculta, recalibração e retorno aos controles.

Evidências em `docs/evidence/war-hand-latency-20261025/`. Nenhuma câmera física ou sessão Firebase real foi usada. Cache WAR incrementado de 25 para 26; estado e progresso preservados.

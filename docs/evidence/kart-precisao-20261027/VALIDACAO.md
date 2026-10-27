# Verificação do kart — 27/10/2026

- 260 testes Node aprovados, zero falhas. As regressões novas falharam antes da correção e passaram depois; 192 largadas variadas verificam a liberação de direção. O contato real e a separação continuam produzindo impactos.
- Três corridas completas pelo controle nativo em 390×844, 844×390 e 885×770. Sem atribuir posição, velocidade ou voltas. Tempo de 52 a 54 segundos, limite original de 90 segundos mantido. Deslocamento lateral máximo inferior a 0,45; limite original de 1 mantido.
- Dois clientes completam os três circuitos de f1, confirmam cada resultado e recebem a mesma classificação. Os seletores de f2, f3 e modo livre também conectam os dois clientes. Os testes Node cobrem a conclusão física e objetivos de f2/f3. A câmera sintética usa item por mão na cabeça sem repetição durante a mesma sustentação.
- MoveNet real, TensorFlow 4.22.0, backend WebGL, vídeo de referência: entrada nos dois autódromos, câmera frontal, volante seguindo as mãos, ausência dos pedais manuais, parada ao perder as mãos, retomada e retorno ao mundo com família e saldo preservados. `camera-native-uncapped.json` registra a execução com renderização normal; `camera-capped.json` registra a repetição com somente o WebGL do mundo limitado. O kart permanece renderizando normalmente nas duas.
- Build/pacote concluídos; revisão do mundo preservada em bdeccca31a011319. Apenas o kart recebe a correção física e o cache pro-control-v27.

As capturas vêm do jogo. Os saves são descartáveis. Multiplayer usa relay local, não uma sessão real entre dois celulares. Instalação física Android, precisão da câmera do usuário, FPS sustentado e alto-falante não são declarados homologados. A publicação é conferida separadamente após o deployment.

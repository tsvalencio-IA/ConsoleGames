# Kart, pingue-pongue e WAR — correções de multiplayer

## Escopo

Relato: multiplayer de kart, pingue-pongue e WAR não funciona; avião está funcionando bem. A pasta `games/voo/` e a versão do mundo `705.22.1-venues-coachwork` permanecem iguais à base publicada `44e04ce26ea02996f675b6f0abe269e38c4f16d0`.

## Correções

- **Kart:** identidade por conexão, separada da conta; eleição explícita de anfitrião que exclui bots; presença periódica também na sala; saída limpa e troca de anfitrião; identificador e semente de corrida compartilhados; leitura atômica da largada, inclusive nas etapas seguintes; obstáculos de rede aplicados só com pista pronta; pódio online não encerra a sessão após três segundos e não duplica recompensa enquanto aguarda os rivais.
- **Pingue-pongue:** CONTROLES deixa o modo livre mostrar a escolha online; fases de treino continuam iniciando solo. Identidade por conexão; estado, bola, placar, servidor do saque e rodada chegam em um snapshot; coordenadas e placar são invertidos para a perspectiva do convidado. O anfitrião usa a raquete e a intenção de saque do jogador remoto, sem sorteio de IA. Presença periódica, remoção de participantes e listeners na saída.
- **WAR:** três opções ONLINE cooperativas, uma por missão original, para dois participantes. Sala por missão/dificuldade, prontidão após calibração, início pelo anfitrião, poses dos aliados, NPCs/vida/abates/resultados compartilhados. Apenas o anfitrião resolve dano e ondas. Aliados não são alvos. Desconexão durante a operação volta à sala; saída do resultado não cancela o resultado do parceiro. Missões solo, mão/câmera frontal, caminhada automática, joystick esquerdo e arraste de mira continuam nos motores originais.
- **Entrega:** versões de cache kart v22, tênis v23, WAR v24; módulo e CSS do WAR incluídos no cache offline. Configuração Firebase, autenticação e permissões não foram alteradas.

## Como abrir

Entrar na conta online em ambos os aparelhos; modo de treino local não conecta salas.

1. Kart → **MODO LIVRE** → escolher controles/câmera → **ONLINE**. O anfitrião inicia com pelo menos dois jogadores.
2. Pingue-pongue → **JOGO LIVRE E ONLINE** → escolher entrada → **ONLINE (DEDO)** ou **ONLINE (CÂMERA)**. O anfitrião inicia a mesa.
3. WAR → **ONLINE • [missão]** nos dois aparelhos, com a mesma dificuldade. Cada jogador pode escolher sua própria entrada; na câmera é necessário terminar a calibração. O anfitrião toca em **INICIAR OPERAÇÃO COM ALIADO**.

Console com recuperação de acesso: https://otthi-world-campanha-teste.vercel.app/console.html

## Verificação e limites

- Suite Node completa: 202 testes, zero falhas; contratos de multiplayer também executados após os ajustes finais de resultado/rematch.
- `tests/arcade-multiplayer.test.mjs`: dois motores independentes por jogo; mesma conta com IDs de conexão diferentes; início, placar/saque, movimento, dano, ondas, crédito de abate, calibração, saída, pódio idempotente e erros de permissão explícitos.
- `tests/arcade-multiplayer-browser.mjs`: dois contextos Chromium mobile independentes em cada jogo, menus originais e entrada nativa, comunicando-se por HTTP/SSE local. Movimento do kart aparece no outro cliente; tênis transmite rally e ponto; WAR transmite aliado e abate do convidado. Saída do anfitrião testada. Zero erros JavaScript de página. Resultado em `docs/evidence/multiplayer-20261024/two-browser-clients.json`.
- Regressão de toque do WAR: arraste, mira aproximada, quatro toques simultâneos, soltura independente, pausa e rotação em 390×844, 844×390 e 320×568; mouse/teclado no desktop. Resultado em `docs/evidence/multiplayer-20261024/war-touch-regression.json`.
- Build modular e pacote de distribuição executados; revisão do mundo permanece `5e8f4018347fd162`.
- **Não validado em produção:** a revisão automática bloqueou a consulta às salas reais do Firebase por possível leitura de identificadores/estado de jogadores. Não houve contorno do bloqueio, consulta de salas por outra via, mudança de regras ou criação de usuários reais de teste. As regras e a conectividade do Firebase de produção não estão confirmadas por esses ensaios. Não se trata de teste em dois celulares físicos.
- Os testes de mão existentes verificam o controlador; a nova partida cooperativa no navegador usa controles manuais. Não afirmar que a câmera foi testada em dois aparelhos físicos.

## Recuperação do console, já entregue antes desta correção

Fonte `44e04ce26ea02996f675b6f0abe269e38c4f16d0`, deployment `dpl_8dxZB2UEFRVtxB6oXFQPYmFA9b2Z`. Teste reproduziu `ERR_FAILED` com worker v10 e cache vazio; a entrada `/console.html` ativou v11 e abriu os sete jogos. Perda de rede/cache agora retorna tela de recuperação. Perfil, favoritos e caches dos outros jogos preservados. Teste público confirmou os bytes, worker v11 e menu original. Evidências em `docs/evidence/console-access-20261024/`.

## Publicação verificada

Fonte `559b4260e1f08c0bc4586339a347034b2e19c25b`, árvore `beac6f08eb42867627fe1a27a2216e6799837e1a`, deployment `dpl_2VTLkEPX6CxH2Ky7fwSXKn52aMSi`, estado READY, domínio estável atribuído sem erro. O canário público confirmou SHA-256 de 13 arquivos, incluindo os três motores, o novo módulo/CSS do WAR e o motor do avião preservado. O console continuou abrindo sete jogos com worker v11. O canário bloqueou Firebase: confirma a entrega dos arquivos, não uma partida no servidor real. Metadados em `docs/evidence/multiplayer-20261024/release.json` e `public-static-delivery.json`.

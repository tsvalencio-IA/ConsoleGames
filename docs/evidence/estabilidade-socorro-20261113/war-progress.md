# WAR: jogabilidade e resposta — em andamento

Base preservada: jogo nativo da produção28, incluindo treino, três operações, armas, progressão, multiplayer e a avaliação frontal opcional. Nenhuma validação de diversão ou nota10/10 é presumida.

## Causas concretas de controle

1. `combatLook.down` recusava arrasto nos45% esquerdos do canvas mesmo fora de botões/joystick e até com mouse. O joystick já é dono dos próprios eventos. A guarda artificial foi retirada: toda área livre do cenário aceita olhar, conservando um dono de pointer e interrupção ao soltar/pausar.
2. Movimento do jogador recusava o vetor diagonal inteiro ao tocar a cobertura. Isso agarrava o personagem em contêineres; inimigos já tinham deslizamento por eixo. `movePlayer` mantém contato sólido, resolve os componentes livres e subdivide deslocamentos para não atravessar barreiras finas. Velocidade, colisões, dano, missões e recompensas não mudam. Sons de passo agora dependem de deslocamento real.

Testes novos em `tests/war-playability.test.mjs`, cobrindo arrasto livre, dono de toque, deslizamento, canto/barreira e passos quando bloqueado. Ainda sem aprovação de navegador nesta etapa.

## Preparação e ritmo

Hipótese de travamento encontrada na fonte: WebGL é criado no primeiro desenho após esconder a tela de carregamento; mapas de chão/HDR chegam depois e trocam programas durante a operação. A raiz autorizou preparar o ramo de combate no renderer canônico e sincronizar cópiasAR/voo, conservando o voo e exigindo sua regressão focada. Ganho ainda não medido.

A sessão prolongada do mundo tem prioridade de medição: não executar Chromium/renderizadores/benchmarks durante a janela reservada. Preparar código e regressões leves; pedir janela de navegador à raiz. Mudança grande de mecânica deverá ser prévia nativa opt-in, sem substituir padrão ou contas. Precisamos validar controles reais e partidas completas, e não apenas um bot em dificuldade reduzida.

Pendências reais: prova visual/nativa da correção, primeira operação em controles/touch e dificuldade normal, desempenho antes/depois sob as mesmas condições, câmera física/ergonomia em aparelho. Não escrever contas ou banco de produção; nenhum commit/publicação feito por esta frente.

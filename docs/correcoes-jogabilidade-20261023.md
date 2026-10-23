# Correção de jogabilidade e atualização — 23/10/2026

> A abertura dos ginásios recebeu a correção posterior `705.17.2`, descrita em [Ginásios no celular](correcao-ginasios-mobile-20261023.md).

[Abrir mundo unificado](https://otthi-world-campanha-teste.vercel.app/games/otthi/) · [Abrir console com os sete jogos](https://otthi-world-campanha-teste.vercel.app/arcade/)

Esta revisão corrige a entrada nos ginásios, os comandos de mão e voo e a passagem entre versões instaladas. Inclui os cinco jogos GAME separados, o mundo unificado e a verificação do HQ original da família. Testes automáticos não representam uma nota de jogabilidade: esta entrega não é declarada “10/10”.

| Publicação | Identificação |
| --- | --- |
| Repositório / branch | `tsvalencio-IA/ConsoleGames` / `world-revisao-20261022` |
| Código publicado | `708f267a92c2290ed5fe8a835a85c633607a7af3` |
| Árvore verificada | `2c0e739bbcce3fafbb7bf3244f45119a2f3ebfd3` |
| Build / arquivos | `705.17.1-gameplay-recovery` / `6963bbf28d00a0e3` |
| Deployment experimental | `dpl_7TnYGoZqwR3d4x1RcrhcHF5QvzfM` |
| Endereço imutável | https://otthi-world-campanha-teste-1dfydvenx-thiaguinho-s-projects.vercel.app/games/otthi/ |

O código acima está publicado no projeto experimental. A `main` e o endereço principal não receberam esta revisão. O commit posterior de documentação e evidências não muda o código servido.

## Comandos corrigidos

- **WAR com câmera:** câmera frontal, calibração da mão direita, imagem do usuário escondida após calibrar, avanço automático e nenhum joystick de movimento ou mira. A mão guia a visão; arma e retículo compartilham o centro. O disparo automático exige alvo visível e alinhado. Perder o rastreamento interrompe avanço e tiros.
- **WAR manual:** joystick de movimento apenas à esquerda, visão por arrasto na parte direita da cena e botões independentes. É possível andar, olhar e atirar com três dedos. O mundo unificado também deixa de construir um segundo joystick de mira.
- **Avião:** a calibração passou a usar proporções da imagem da câmera. Girar o aparelho entre retrato e paisagem não muda o centro calibrado. Deslocar as mãos para a direita/esquerda e cima/baixo produz o comando correspondente. A inclinação das mãos continua disponível para pilotar.
- **Helicóptero com câmera:** levantar/baixar as mãos controla subida/descida pelo coletivo, com avanço suave enquanto há rastreamento. Sem pose válida, retorna ao coletivo neutro. Os comandos manuais de manche, coletivo e pedais mantêm a física existente.

O render do WAR reduz o trabalho da GPU quando o reconhecimento da mão está lento. Uma imagem já desenhada é reutilizada enquanto o rastreamento está vencido; a validade de uma leitura antiga não foi ampliada para fazer o teste passar. Ao abrir uma atividade em tela cheia, a cidade que fica coberta para de renderizar e retoma ao sair.

## Ginásios e entrada nos jogos

Os ginásios abrem os motores originais de boxe e ping-pong em uma sessão solo local, com fases e controles próprios. A entrada não depende de fabricar um login Firebase nem de uma segunda autenticação dentro do ginásio. Existe indicação de carregamento, nova tentativa e saída para o mundo.

O ping-pong encerra a partida pelo próprio placar, sem chamar o encerramento genérico dos outros jogos. Essa conclusão agora também registra o resultado no ginásio. Uma partida real terminou em **0 × 11**, registrou uma participação e não duplicou moedas no mundo.

Nos cinco jogos separados há **JOGAR SOZINHO**. XP, moedas e melhorias dessa sessão ficam neste aparelho e separados da conta online. Respostas atrasadas da conta são ignoradas durante a sessão local. Os modelos de movimento são carregados somente quando a câmera é escolhida. O aviso de sessão solo aparece na seleção de fases, sem cobrir o HUD da partida.

## Atualização sem apagar progresso

O carregamento incoerente tenta recuperar a versão completa automaticamente. O worker verifica os 27 arquivos por SHA-256 antes de ativar o novo conjunto. Uma versão que ainda está sendo preparada não toma o lugar da versão funcionando. Os jogos separados também exigem todos os arquivos locais do seu conjunto antes da troca e aguardam o fim da partida para ativar.

O teste carregou o worker da publicação anterior, reabriu como um aplicativo já instalado e depois ofereceu esta versão. O novo worker ficou aguardando a página estar pronta, a atualização terminou e o jogo reabriu offline. Moedas, XP, grupo Thiago + Luna + Liz, entregas e posição foram preservados. Não foi necessário apagar armazenamento, conta ou progresso.

## O que foi verificado

| Verificação | Resultado e alcance |
| --- | --- |
| Regressões de código, física, integridade e regras | **173 testes passaram**, zero falhas. |
| Cinco GAME pela entrada solo real | Sete cenários de navegador, incluindo três tamanhos de tela no kart; sem login Firebase fabricado. Movimento, pausa, retorno, negação da câmera e controles simultâneos verificados. |
| Kart separado | Corrida de três voltas com eventos de direção e aceleração, sem pular o placar nem teletransportar a chegada. Desvio máximo registrado de 0,424 da meia largura da pista. Não equivale à avaliação humana da sensação de direção. |
| Boxe e tênis | Luta com dano e defesa/socos simultâneos; raquete com posse do dedo; ginásios abertos e retorno à posição de entrada. Partida de tênis concluída pelo placar nativo. |
| WAR com mão | MediaPipe CPU/WASM real sobre imagem de referência em fluxo de vídeo simulado: calibração, direção, avanço, tiros alinhados, perda da mão e retorno ao manual. Também executado no mundo unificado. |
| OT Games no mapa original | Quatro modos abertos; voo pacífico; helicóptero com três toques; missão de helicóptero e missão de soldado com seis alvos cada, vitória salva e posição/família preservadas. |
| HQ original da família | Três toques simultâneos, movimento, câmera, lançamento/devolução para Luna e Liz e progresso mantido ao reabrir. |
| Dança | 31/32 acertos, pausa, resultado e liberação da próxima música no navegador; regras das três músicas cobertas pelos testes de código. |
| Atualização de instalação existente | Configuração antiga isolada, worker anterior real, troca de versão e reabertura offline passaram preservando o progresso. |
| Cinco GAME sem internet | Entrada e início de partida após recarregar o conjunto instalado passaram nos cinco jogos. |
| Publicação HTTP | Os 27 arquivos principais e 29 arquivos dos jogos separados correspondem por SHA-256 à árvore testada. Console, módulo solo e worker compartilhado estão disponíveis. |
| Navegador no endereço publicado | Os cinco GAME abriram e reiniciaram offline sem login fabricado; boxe e ping-pong também abriram pelos ginásios e voltaram à posição de entrada no mundo. Zero erros de página. |

Os cenários de conta e serviços externos permanecem isolados nos testes locais. As imagens de câmera simulam o vídeo, mas a detecção e o movimento resultante usam o modelo e o código reais. O teste de atualização usa workers reais; o cenário de imagem da mão bloqueia workers apenas para que a imagem de referência roteada pelo navegador não seja interceptada por eles.

A sensibilidade, a latência e o desempenho sustentado ainda precisam de avaliação no celular físico do usuário. Duas pessoas em aparelhos distintos com contas reais e o APK nativo não foram homologados nesta revisão. O APK anterior continua apontando ao endereço principal; os links acima abrem a revisão web/PWA atual. Não foi gerado um APK novo nesta entrega.

[Evidências e registros](evidence/gameplay-recovery-20261023/)

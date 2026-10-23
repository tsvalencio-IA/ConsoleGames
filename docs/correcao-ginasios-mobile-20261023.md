# Ginásios no celular — correção de abertura

[Abrir o mundo atualizado](https://otthi-world-campanha-teste.vercel.app/games/otthi/)

A foto `318367.jpg` mostra o documento do ginásio sem carregar, com o ícone de erro do navegador. O teste anterior em computador não comprovava o funcionamento nesse celular. Os endpoints responderam HTTP 200, sem `X-Frame-Options` ou CSP de bloqueio nessa verificação. A causa específica no aparelho não foi identificada; foi reproduzida uma falha de navegação controlada no quadro, que chegava a `chrome-error://chromewebdata/`.

No celular, boxe e ping-pong agora abrem os jogos originais na própria página, com um botão **VOLTAR AO MUNDO**. A posição e o estado do mundo são salvos antes da saída. O retorno retoma o mundo, preserva Thiago + Luna + Liz e aplica o resultado da atividade uma vez, sem somar moedas ou XP ao mundo. O botão Voltar do navegador também foi verificado. No computador, o quadro permanece disponível e uma falha de abertura leva automaticamente à página da atividade.

A barra de retorno ocupa uma área própria acima do jogo. A mudança não substitui os motores, as fases, os golpes nem a física da raquete. Câmera e partida são encerradas ao sair da atividade. Os arquivos de entrada e seus caches foram atualizados juntos.

| Identificação | Valor |
| --- | --- |
| Branch experimental | `world-revisao-20261022` |
| Código publicado | `7d813d53fbb6d940b86bd552fe5b90608ec9d653` |
| Árvore do código | `e969c666edcf0c294fad345e50d9a6f558b86004` |
| Build / revisão | `705.17.2-venue-mobile` / `151cececd6b1e772` |
| Deployment | `dpl_4hyVrxPW9b7vVqKHsSMshpFXBREJ` |
| URL imutável | https://otthi-world-campanha-teste-li1sv6kgo-thiaguinho-s-projects.vercel.app/games/otthi/ |

Foram aprovados 176 testes de código, o fluxo móvel em retrato e paisagem, o soco por toque no boxe, o retorno à posição de entrada, a preservação de moedas/XP/família, a recuperação de um quadro com navegação bloqueada e os dois ginásios incorporados no computador. A primeira execução de ping-pong em retrato também concluiu uma partida nativa em 0 × 11 e verificou o registro no retorno. Uma espera pela apresentação dos controles de boxe foi acrescentada ao teste depois que o estado da luta apareceu antes dos botões.

A atualização com o worker real da versão `705.17.1` e a reabertura offline passaram preservando o progresso. Os 28 arquivos do mundo e oito arquivos de entrada dos ginásios publicados conferem por SHA-256 com o código testado. No endereço público, ping-pong em retrato e boxe em paisagem abriram, responderam aos comandos por toque e retornaram ao mundo preservando posição, família e saldo, sem erros de página.

Os testes de toque foram executados em navegador com emulação móvel, não no aparelho físico da foto. Os serviços externos de conta foram isolados nesses cenários; a entrada usa a sessão solo real, sem usuário Firebase fabricado. A publicação ficou restrita ao projeto experimental. A `main`, o endereço principal e o APK anterior não foram atualizados.

[Evidências](evidence/venue-mobile-20261023/)

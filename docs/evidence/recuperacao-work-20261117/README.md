# Recuperação após interrupção — 17/11/2026

Base: `9b457df18b65bed50905873c2beae40e679061db`.
Branch: `fix/console-recuperacao-20261117`.

## Correções reproduzidas

- Avião: o botão Iniciar enviava uma tecla de 110 ms. No navegador desta sessão, três tentativas ficaram na calibração; segurar Espaço permitiu avançar. O toque agora fica pendente para a fase que o recebeu, é consumido uma vez e é descartado ao liberar os controles. Reteste no navegador: hangar, calibração mantida e voo iniciado pelo botão. Não altera os cálculos de pitch/roll nem a calibração por câmera.
- Ping Pong: o SCORE genérico cobria o placar esquerdo e os botões cobriam o placar direito. Os dois placares nativos agora ocupam uma área de 116 × 60 px no canto esquerdo. O contador genérico continua disponível à acessibilidade. Reteste visual, saque e deslocamento da raquete pelo mouse realizados.
- Avião: o mesmo contador genérico cobria Sair no hangar. O botão voltou a ficar visível.
- Pacote de staging: a pasta escola, referenciada pelo console, estava ausente do empacotamento. Agora está incluída e seus quatro arquivos são verificados.
- Build oficial: manifesto e revisões regenerados; 155 recursos verificados, incluindo as dependências alteradas do avião e do Ping Pong.

## Validação executada

`node --test --test-concurrency=4 tests/*.test.mjs`: **562 aprovados, zero falhas**, log em `unit.log`.

A primeira execução nesta base teve 555/560 aprovações. As falhas antigas do Manus não se reproduziram. Foram encontrados testes textuais incompatíveis com URLs versionadas/cache de rollback e dois testes antigos que exigiam trava para o canhão, em conflito com o canhão livre preservado na base. Os testes agora distinguem canhão e míssil guiado; a proteção da trava de míssil e da calibração permanece testada. Há testes novos para o início em quadro lento e a área do placar em quatro resoluções.

Build oficial, sintaxe dos três scripts alterados e `git diff --check` executados. `build.log` e `package.log` registram os resultados.

## Sessões manuais no navegador

- Kart: entrada solo, Copa Cogumelo, controles, grid, aceleração por teclado, rivais desenhados, pausa e retorno ao console. Não foi completada uma corrida manual nesta sessão. O teste nativo de três voltas passou na suíte unitária.
- Boxe: entrada solo, Treino Amador, seleção, início, botões dos dois golpes e pausa. O placar chegou a 54. Não foi concluído um combate inteiro.
- Ping Pong: entrada solo, Iniciação, controles, saque e movimento da raquete. Sobreposição reproduzida e correção retestada.
- WAR: entrada solo, treino e arena compatível. Botão de tiro acionado; não se registrou confirmação suficiente para declarar uma missão ou alvo concluído.
- Avião: entrada solo, Voo Livre, hangar, calibração e início. Defeito do botão reproduzido e corrigido; voo iniciado no reteste.
- Família: tela de entrada abriu e informou WebGL indisponível neste navegador. Não houve sessão 3D.
- Dança: menu de aulas, progressão e opções de música abriram. Não houve teste corporal físico.
- OTTHI: menu abriu. O atualizador local recusou SHA-256 de index.html; a causa desse resultado no preview não foi confirmada. Não foi executada uma sessão de mundo 3D.

## Limites preservados

O Chromium deste ambiente não inicializou WebGL; WAR e avião usaram a renderização compatível existente. O runner automatizado de navegador não iniciou porque socket() do Chromium foi negado pelo ambiente. Não houve instalação ou contorno dessa restrição. O workflow integrado existente foi habilitado na branch isolada para executar esses testes em seu runner próprio.

Não há aprovação de câmera física, FPS de Android, latência corporal ou multiplayer com pessoas. Nenhum teste local equivale a essas validações. Não houve alteração de Firebase, credenciais ou produção.

Este registro permite retomar exatamente o trabalho; não certifica que os oito jogos estejam completos.

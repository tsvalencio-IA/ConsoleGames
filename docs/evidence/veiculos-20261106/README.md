# Veículos — revisão de 6 de novembro de 2026

Esta revisão corrige dois problemas concretos: atualizações repetidas da interface do veículo e o estacionamento de aeronaves entre jogadores.

## Alterações

- O aviso do veículo compõe velocidade, família e integridade antes de atualizar o texto. Os botões conservam os mesmos nós de texto quando o conteúdo não mudou.
- O estado enviado aos outros jogadores inclui solo e velocidades da aeronave. O estacionamento valida posição e velocidade do evento; pode ser recebido depois que a presença já mudou para caminhada.
- Um helicóptero ou avião estacionado fica disponível para o próximo piloto. Uma unidade que continua pilotada mantém sua ocupação.

## Verificação já concluída

- 380 testes de lógica passaram, incluindo a conservação dos controles de caminhada, barco e esportes e 600 atualizações sem reescrita de texto inalterado.
- Dois navegadores independentes executaram embarque, voo, estacionamento e reutilização do mesmo helicóptero e avião por outro jogador. O ensaio inclui a chegada da presença de caminhada antes do evento de estacionamento.
- Os 111 arquivos do manifesto estão íntegros. Os arquivos principais publicados na prévia correspondem byte a byte aos arquivos locais.

`aircraft-reuse.json` registra a troca entre os pilotos. O teste usa um retransmissor isolado; não escreve em contas ou salas reais.

## Desempenho

A primeira medição foi rejeitada porque o carro havia batido e a amostra final já não representava condução. A medição válida usa a Rodovia dos Horizontes, em um corredor de 250 metros previamente conferido. Colisões, dano, família, som gravado e simulação continuam ativos.

Nos dois casos, o carro acelerou durante os 120 passos manuais e continuou andando na amostra nativa de dez segundos. Terminou com 100% de integridade, motor ativo, sem pausa ou janela aberta. `before.json` e `after.json` registram posições, velocidade, chamadas, escritas e os limites da amostra.

| Escritas de texto em 120 passos dirigindo | Antes | Depois |
| --- | ---: | ---: |
| Acelerar | 480 | 0 |
| Freio/ré | 480 | 2 |
| Sair/ação | 662 | 0 |
| Aviso do veículo | 360 | 94 |

Parado, os textos não foram reescritos na versão corrigida. Em movimento, os avisos mudam quando a velocidade ou outra informação muda. A amostra não mostrou redução do tempo total de CPU nem melhoria de FPS. O objetivo comprovado desta alteração é eliminar trabalho redundante da interface, preservando funções e informação.

A redução de escritas da interface está comprovada. Não há comprovação de que a travada prolongada no Android relatada pelo usuário tenha sido eliminada. Tempos de WebGL por software não representam FPS ou temperatura de um celular físico.

## Propostas em discussão

- WAR: mão esquerda como manche relativo de avanço/recuo e giro contínuo; mão direita para mira e gatilho por pinça; pausa imediata da ação ao perder uma mão.
- Dança: refinar sincronização audiovisual, avaliação de movimento e tolerância por dificuldade.
- Avião: liberar pouso no voo livre do console, com aproximação guiada e auxílio opcional, conservando a pilotagem aprovada.
- Celular do personagem: selecionar um veículo e solicitar entrega física por motorista ou piloto NPC; helicóptero em área livre e avião em pista indicada no mapa.
- Pingue-pongue: refinar atraso, espelhamento e contato da raquete, conservando a sensação aprovada.

Essas propostas ainda não integram esta revisão.

## Publicação

Build `705.28.19-veiculo-fluidez`, revisão `0e335be2c9539a84`, publicado em `https://otthi-world-campanha-teste.vercel.app`. Os cinco arquivos principais correspondem aos arquivos conferidos na prévia. A instalação pública da prévia verificou os 71 recursos do shell e preservou o progresso de teste.

A verificação posterior da produção passou no run `42296394325`: atualização automática, 71/71 recursos do shell instalados e progresso de teste preservado. O relatório integral está em `production-verification.json`. A regressão completa de jogabilidade passou no run `42295259204`; controles, giro e condução passaram no run `42295258986`.

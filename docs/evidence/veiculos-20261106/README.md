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

A primeira medição foi rejeitada porque o carro havia batido e a amostra final já não representava condução. A medição corrigida deve comprovar deslocamento, carro operacional, motor ativo e ausência de pausa/modal, preservando colisões e dano.

A redução de escritas da interface está comprovada. Não há comprovação de que a travada prolongada no Android relatada pelo usuário tenha sido eliminada. Tempos de WebGL por software não representam FPS ou temperatura de um celular físico.

## Propostas em discussão

- WAR: mão esquerda como manche relativo de avanço/recuo e giro contínuo; mão direita para mira e gatilho por pinça; pausa imediata da ação ao perder uma mão.
- Dança: refinar sincronização audiovisual, avaliação de movimento e tolerância por dificuldade.
- Avião: liberar pouso no voo livre do console, com aproximação guiada e auxílio opcional, conservando a pilotagem aprovada.
- Celular do personagem: selecionar um veículo e solicitar entrega física por motorista ou piloto NPC; helicóptero em área livre e avião em pista indicada no mapa.
- Pingue-pongue: refinar atraso, espelhamento e contato da raquete, conservando a sensação aprovada.

Essas propostas ainda não integram esta revisão.

# OT Games — correção de travamentos, 28/10/2026

Pedido: reduzir os travamentos do mundo aberto preservando mapa, população, veículos e aparência.

## Alteração

- Consultas de colisão usam uma grade espacial conservadora; os testes exatos de parede, água, casa, veículos e trânsito permanecem. O índice é validado uma vez por quadro. Obras e troca de arrays invalidam o índice; aeronaves em movimento usam seus limites atuais.
- Segmentos de rodovias são reutilizados, com invalidação por edição do traçado/largura. A consulta de distância deixa de criar objetos temporários por segmento.
- Luzes pontuais com alcance finito e sem sombra só saem do cálculo durante o desenho quando sua esfera inteira está fora da câmera. Luzes sem limite, sem decaimento e com sombras são preservadas. Não há limite de população luminosa: todas as luzes que podem atingir a imagem continuam presentes. Slots de intensidade zero estabilizam as variantes dos shaders; o modo com brilhos desativados não cria slots.
- O BRDF físico deixa de executar o cálculo para luz cuja contribuição já é zero. Sol, luz ambiente, materiais, modelos, resolução e distâncias de desenho não foram reduzidos.
- A primeira cena e seus programas gráficos são preparados durante o carregamento, com a câmera já posicionada. A primeira tentativa de aquecer todos os veículos em uma cena separada piorou o ensaio e foi descartada.

## Comparação de execução nativa

Chromium 138, SwiftShader, viewport 393 × 852, qualidade equilibrada, quatro familiares e áudio desativado nos dois casos. RAF e WebGL reais, sem limitar o renderer ou acelerar a simulação. Mesma entrada de movimento, observação solicitada de 12 s. Os timers podem exceder esse período quando um quadro trava. Referência publicada: `6a0d480526fc1d6c26ee352a5115a9952d4b4461`.

| Medida | Antes | Depois |
| --- | ---: | ---: |
| Intervalo médio entre quadros | 1430,7 ms | 349,2 ms |
| Maior intervalo | 3683,5 ms | 875,8 ms |
| Trabalho médio da função do quadro | 836,7 ms | 152,8 ms |
| Tempo médio da chamada de render | 599,8 ms | 51,0 ms |
| NPCs | 138 | 138 |
| Catálogo de veículos | 44 | 44 |
| Membros da família | 4 | 4 |
| Modelos de trânsito já inseridos ao terminar | 14 | 36 |
| Erros JavaScript | 0 | 0 |

O intervalo médio caiu 75,6%; a maior pausa caiu 76,2% nesse ensaio. Isso **não mede FPS de Android**, nem comprova fluidez em aparelho físico. O software de desenho ainda produz intervalos altos. O benchmark inclui entrada em jogo, compilação inicial e inserção gradual de modelos; trajetórias/população móvel podem divergir porque a versão mais rápida executa mais passos no período.

A preparação de modelos/cena marcou 5645 → 6162 ms, incluindo a preparação inicial de cena de 1148 ms na versão corrigida. O carregamento passou a assumir parte do trabalho que ocorria durante a partida.

## Verificação visual e funcional

- 25 verificações de unidade: colisão exaustiva em milhares de pontos e bordas, mutações de obra, aeronave móvel dentro do quadro, estradas abertas/fechadas, luzes e restauração, continuidade da família, projeção de rotas, buffer e proteção da atualização.
- WebGL: três vistas de uma cena com materiais físicos, vidro, neblina, luzes locais e luzes ilimitadas. Todos os canais de todos os pixels permaneceram idênticos: diferença máxima zero. Mesma geometria e quatro chamadas de desenho nos dois renderers.
- Missões civis de praia, neve, vizinhos, bombeiros e polícia, dois elevadores ocupados e teleférico com família em ambos os sentidos aprovados em navegador, com render limitado para o ensaio de lógica.
- Carro/Fusca com áudio gravado, helicóptero, avião e balão com quatro familiares, decolagem, render de voo sem branco, buffer/rotação e teleférico nos dois sentidos aprovados. Duas vagas da oficina e suas peças independentes sobreviveram ao reload.
- Migração da versão publicada: cache antigo insistente, download crítico corrompido, retentativa, reaproveitamento de 67 recursos íntegros e preservação de perfil/progresso aprovados. Entrada online do console conferida e entrada offline preservada.
- O teste de transporte foi ajustado para aguardar o próximo quadro de pose da família após avançar o relógio de inspeção; a verificação de altura não foi removida. Execuções concorrentes podem acionar o governador de resolução; a conferência de buffer/voo deve rodar isolada.

Os JSONs, logs e imagens nesta pasta documentam os ensaios. Autenticação, progresso, conteúdo militar do console e modelos/som dos veículos não foram alterados nesta correção. Não houve compilação de APK novo nem teste em celular físico.

# Trânsito e fluidez — 10/11/2026

Publicação: **705.28.25-transito-fluidez**, revisão `23767784d2d7a3aa`, commit de runtime `cdc695f04f62dd67fe28ec94ea5edaca73474f95`.

A chamada do motorista podia ficar bloqueada por filas que não abriam espaço. O socorro seguia a rota da ocorrência, mas sua correção de posição ainda podia usar a patrulha antiga. Ambulâncias e caminhões dos bombeiros estacionavam no centro da pista. O desvio do celular também concentrava muitas consultas em uma atualização.

A correção mantém a frota de 44 modelos, os 138 NPCs, os cenários e a qualidade automática. Separa os pontos de atendimento do socorro, estaciona serviços junto ao meio-fio, distribui a busca de desvio em até oito verificações por atualização e permite abrir espaço gradualmente em curvas congestionadas. A percepção dos NPCs inclui o carro do jogador sem colocá-lo na própria lista de obstáculos ou na réplica da frota NPC. Entrada, física e controles continuam a 60 Hz; tarefas de expansão passam a 30 Hz.

| Medição no mesmo runner | Publicado anteriormente | Esta revisão |
|---|---:|---:|
| Média de veículos parados, amostras do percurso de 120 s | 33,82 | 19,45 |
| Máximo de consultas por chamada de desvio | 126 | 8 |
| Maior tempo observado na busca de desvio | 73,0 ms | 13,3 ms |
| Trabalho médio do quadro com renderização nativa | 31,81 ms | 27,75 ms |
| Modelos de trânsito preservados | 44 | 44 |

As amostras de tráfego são determinísticas, com relógio e semente controlados. A contagem lógica dos veículos agora independe de sua visibilidade. A medição de quadros usa RAF e WebGL sem limitar os desenhos, no mesmo perfil de qualidade e escala. Valores variam entre execuções; não representam FPS, temperatura ou consumo em Android físico. Semáforos e filas locais continuam fazendo parte do trânsito.

Passaram os 441 testes unitários, as oito tarefas de evolução do console, as três tarefas de controles/carga/direção e a comparação de quadros. O teste de entrega mantém a rua bloqueada por 24 segundos, libera a fila e confirma a chegada física do carro. Socorro e incidente encerram autonomamente. Compras, recibo único, retorno da encomenda após recarga, garagem, oficina, embarque, pouso, kart e atualização preservando progresso também passaram. O teste de direção confirma movimento, aceleração e resistência de 100 sem colisão com o próprio carro.

A publicação está READY no endereço público. A prévia e a produção tiveram 164 arquivos conferidos por SHA-256. Os relatórios brutos, conclusões dos jobs, identificação da publicação e imagem da chegada estão nesta pasta. `previous-release.json` preserva o registro anterior.

# Sistemas juntos e recursos

`native-12-cycles.json`: 17 etapas aprovadas, incluindo pausa/soltura, motorista de veículo próprio, encomenda paga com recarga/recibo único, seis NPCs na oficina, garagem/recarga e 12 incidentes com dois participantes reais cada. Duração 278,011s de parede, 288,57s de simulação nativa e 211 s adicionais adiantados explicitamente para a oficina.

Todos liberaram travas dos participantes e vínculos das equipes. Quatro usaram `forcedClear`, prazo de contingência nativo; outras tarefas podem usar `central-backup`, registrado por função em `tasks`. Comprova conclusão/liberação, **não chegada física de todas as viaturas**. Esse limite orienta futuras melhorias de despacho e trânsito.

Após aquecimento no ciclo 2 até ciclo 12: variação 0 em objetos, geometrias, materiais, ações e contornos. Heap retido após o mesmoGC do Chromium variou −160.608bytes. É observação finita, não garantia de memória constante. `initial-12-cycles.json` preserva o ensaio anterior sem os participantes bloqueados preparados.

Posições, danos e incidentes são preparação de cenário. Rotas, colisões, atendimento, reparo, coleta, guarda, compra, recebimento e save/reload usam as funções nativas. Desenho limitado e relógio controlado: não medeFPS. Nenhuma conta real, regra ou banco de produção foi escrito.

`multiplayer.json` usa dois clientes sobre relay RTDB local, sem certificar conectividade de uma sala real. `update-25-to-27.json` verifica atualização, configuração antiga e offline com perfil preservado. `mobile-layout.json` mede dez mudanças de viewport sem sensor físico. `unit-470.log` registra as regressões.

## Sessão ampliada final

`endurance-60-cycles.json`: 60 incidentes consecutivos e 65 etapas passaram. 359,202 s de parede; 1.366,57 s (22,78 min) de simulação nativa, mais 221 s explicitamente adiantados para oficina. Relógio controlado e desenho limitado: não equivale a 22 min de renderização em telefone.

Do ciclo 2 ao 60, variação zero nas contagens de objetos, contornos, ações, geometrias e materiais. Heap retido após GC variou +139.152 bytes. Dos 60 atendimentos, 59 usaram o prazo de contingência nativo. Os dois participantes e os vínculos das equipes foram liberados em todos os ciclos. Essa observação amplia a cobertura de acúmulo; não garante estabilidade indefinida.

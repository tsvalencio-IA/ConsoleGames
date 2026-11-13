# Sistemas juntos e recursos

`native-12-cycles.json`: 17 etapas aprovadas, incluindo pausa/soltura, motorista de veículo próprio, encomenda paga com recarga/recibo único, seis NPCs na oficina, garagem/recarga e 12 incidentes com dois participantes reais cada. Duração 278,011s de parede, 288,57s de simulação nativa e 211 s adicionais adiantados explicitamente para a oficina.

Todos liberaram travas dos participantes e vínculos das equipes. Quatro usaram `forcedClear`, prazo de contingência nativo; outras tarefas podem usar `central-backup`, registrado por função em `tasks`. Comprova conclusão/liberação, **não chegada física de todas as viaturas**. Esse limite orienta futuras melhorias de despacho e trânsito.

Após aquecimento no ciclo 2 até ciclo 12: variação 0 em objetos, geometrias, materiais, ações e contornos. Heap retido após o mesmoGC do Chromium variou −160.608bytes. É observação finita, não garantia de memória constante. `initial-12-cycles.json` preserva o ensaio anterior sem os participantes bloqueados preparados.

Posições, danos e incidentes são preparação de cenário. Rotas, colisões, atendimento, reparo, coleta, guarda, compra, recebimento e save/reload usam as funções nativas. Desenho limitado e relógio controlado: não medeFPS. Nenhuma conta real, regra ou banco de produção foi escrito.

`multiplayer.json` usa dois clientes sobre relay RTDB local, sem certificar conectividade de uma sala real. `update-25-to-27.json` verifica atualização, configuração antiga e offline com perfil preservado. `mobile-layout.json` mede dez mudanças de viewport sem sensor físico. `unit-470.log` registra as regressões.

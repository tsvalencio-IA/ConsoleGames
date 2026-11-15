# Socorro físico — checkpoint de implementação

Responsável: agente rescue_physical. Base publicada28 preservada, runtime2e3f1be. Alterações locais apenas no módulo16-emergency-services.js; não buildar/publicar como aprovada ainda.

## Reprodução

Probe `/workspace/work/evolution/rescue-native-probe.mjs`, resultados em `test-results/rescue-physical-before/result.json`. Usa app28 compilado, mundo nativo/densidade original, seed917, relógio de simulação60Hz e desenho limitado. Cria locais8,0 duas vezes;−28,0;68,24;0,−42 sem atores preparados, para isolar deslocamento das equipes.4/5 usaram contingência, só1 teve os três papéis fisicamente presentes. Instrumentação observa retorno geométrico de moveIncidentResponder, não os flags arrived/tasks alterados pelo backup. Não é medição FPS ou aparelho.

Causas confirmadas na fonte: rota GPS central em vez de faixa lateral; despacho do primeiro disponível; destino/rota não recuperam;22s reais vencem mesmo com pouco tempo de trânsito simulado em baixa cadência. Staging/depots usavam dimensões de carro para caminhão.

## Alterações em curso

Módulo16 recebeu rota lateral, movimento contínuo/collision-check real de veículo de serviço, busca incremental com orçamento, seleção por comprimento de rota, nova avaliação de vaga e relógio de serviço acumulado por dt de trânsito. Contingência mantém proteção separada: physicalArrivals, contingencyEvents, dispatches e histórico limitado64 entradas; stats físicos e de contingência distintos. Assinaturas moveIncidentResponder/autonomousIncidentBackup/resolveTrafficIncident preservadas para o ensaio integrado.

PRIMEIRA TENTATIVA AINDA FALHA: todos5 recorreram à contingência e apenas polícia chegou. Resultado `rescue-physical-after/result.json`. O footprint correto mostra problema real de partida: veículos de socorro ficam no limite do asfalto, mas a rota começa com giro90° lateral para a projeção central; o caminhão não cabe nessa pose. Estou corrigindo depots para margem compatível e conectores longitudinais de saída/entrada. Não aumentar só timeout nem tratar fallback como chegada.

## Próximos passos

1. Corrigir conector de faixa e dimensões de depot, verificar unitariamente poses/rotas e contadores sem Chromium durante a baseline isolada da raiz.
2. Novo probe nativo reservado após a janela exclusiva. Antes/depois final devem fixar também o relógio inicial de sinais para comparação determinística; o primeiro diagnóstico manteve relógio real e não serve como ganho quantitativo final.
3. Adaptar regressão antiga world-traffic-flow para dependências reais do novo controlador e acrescentar testes de distinção física/contingência.
4. Informar raiz quando fonte estiver pronta para build integrado, sem declarar aprovado antes do ensaio físico nativo.


## Continuação pela raiz após limite do agente

O agente atingiu limite; a raiz preservou a tentativa e assumiu a correção. Acrescentados conector longitudinal de saída, depot no lado inverso orientado no sentido da via, margem de staging para veículos grandes, parada na distância nativa de atendimento e descarte de bloqueadores invisíveis. Corrigida a separação dos contadores: chegada posterior à contingência não vira sucesso físico; atendimento do jogador registra a posição do jogador e seu veículo atribuído. Histórico permanece limitado a64 registros, com API read-only OT_EMERGENCY_SERVICE.

Seis regressões de comportamento passaram em tests/world-physical-rescue.test.mjs: curva antiga não cabe/saída longitudinal cabe, veículo invisível versus visível, relógio de serviço versus segurança real, eventos de contingência sem duplicação, nenhum crédito físico após fallback e posição do jogador. Ainda NÃO aprovado nativamente: browser aguarda a janela exclusiva15min da base28 terminar. O teste final deve ter44 modelos/138 NPCs, com física observada independentemente dos flags.

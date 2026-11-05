# Correção de carga do mundo — 05/11/2026

Escopo: ConsoleGames, continuação de world-revisao-20261022 em 043d82ab. O usuário informou travamentos severos e preocupação com celulares antigos e pediu “Arrume!”. Preservar mundo, população, frota, família, física, controles, progresso, assinatura Android e o HUD após a reversão. Nenhuma temperatura ou dano físico foi medido. Não prometer eliminação de aquecimento ou fluidez física Android sem evidência.

## Base e medições

A produção encontrada é 705.28.15-preparo-iluminacao, deployment dpl_FuRAqZZF3ycpaeHhvdSyjrSvhJKe, fonte de aplicação 14d29564. A base canônica inclui somente documentação adicional até 043d82ab.

A branch de trabalho world-fluidez-20261105 começou com 2761d90f, contendo apenas o workflow de medição. Run 42005804958, job 127172109210, passou na base sem alterações. O perfil mostrou buscas de ações de veículos repetidas e milhares de consultas de colisão da família. CPU em 40 passos: cidade 244,7 ms, praia 248,1 ms, helicóptero 244,2 ms. No teste nativo não limitado de 12 s, o WebGL por software apresentou CPU média 68,53 ms e p95 102 ms. Esses resultados não são FPS de telefone.

## Correção candidata

Build 705.28.16-carga-do-mundo, assetVersion 70652. A versão e a revisão finais são determinadas por VERSION.json e release-manifest.json após o build modular.

- Colisões de veículos rejeitam pontos comprovadamente distantes antes de percorrer carretas e calcular rotações. O predicado preciso original continua decidindo todos os contatos possíveis. O teste compara 60 mil sondas, posições dinâmicas e ângulos de articulação com a função original preservada como fixture.
- Acesso às ações das concessionárias usa índice por ID, mantendo a primeira ocorrência, alterações de array, inclusões e validação por quadro. Não há remoção de veículos ou ações.
- Em automático móvel, o render fica limitado a 30 FPS; a física continua a 60 passos por segundo. Alta manual e desktop continuam a 60 FPS. Pausa desenha no máximo 5 FPS; documento oculto não simula nem desenha e não acumula tempo para reproduzir na volta. Preferência manual Econômica não é convertida em Automática pela migração.
- Foi reproduzido um defeito no limitador: limiar de 92% seguido de módulo podia manter o acumulador sem consumi-lo e gerar dois desenhos consecutivos. O novo cálculo consome o intervalo completo com tolerância apenas numérica. O teste a 144 Hz reproduziu 83 desenhos em dois segundos com o erro e aceita cerca de 60 após a correção, sem reduzir o tempo da física.
- Uma vista sem nenhuma contribuição de luz pontual não desenha dezesseis lâmpadas artificiais. A variante iluminada permanece preparada durante o carregamento; câmera girando não perde a preparação nem a contribuição de luzes reais. Testes verificam a cena restaurada; o CI compara cada canal de pixels.

## Validação e publicação

Os testes direcionados passaram após corrigir a fixture de janela e o erro real de cadência. A primeira suíte completa, antes desse ajuste do limitador, registrou falha dos novos testes de cadência; não tratá-la como aprovação. A suíte completa será executada novamente e pelo CI. O workflow de medição compara CPU e render nativo antes/depois na mesma execução e preserva relatórios e imagens. Não publicar a candidata apenas porque testes funcionais passaram: avaliar a medição e a estabilidade visual também.

Checkout ativo desta correção: /workspace/scratch/a6a0069f9162/otgames-fix. O checkout antigo otgames-fluidez perdeu o diretório Git após a pausa da sessão. O clone novo reutilizou os arquivos, restaurou road-height.png ao blob canônico e mantém separadas as alterações antigas de ConsoleGames. Não usar esse checkout antigo nem misturar o SaaS ou outro projeto.

## Revisão depois da primeira comparação

Candidata 95c5dc07 passou nos testes de pixels (diferença zero em três vistas) e nos 360 testes locais, mas a medição completa 42009883591 não justificou publicar: CPU nativa média 69,91 → 68,23 ms, p95 101,5 → 107,2 ms, com resultados mistos nas três posições. Nenhuma afirmação de fluidez resolvida foi feita com essa medição.

A segunda revisão filtra os candidatos de veículos uma vez por consulta síncrona de uma rota da família, sem reter posições entre rotas ou passos; todos os pontos e predicados precisos continuam iguais. A atualização visual reutiliza matrizes de ancestrais somente dentro da mesma passagem de visibilidade, preservando posições e escalas após movimentos e troca de pai. Frota já carregada não refaz a classificação dos veículos. O painel de voo passa a atualizar no desenho, e lê as dimensões antes de escrever o DOM. Novos testes verificam equivalência contra consultas completas e os cálculos nativos do Three. As medições e testes da segunda revisão precisam ser conferidos antes da publicação.

## Medição da segunda revisão e proteção de pixels

A segunda revisão (b85b5989, run 42012106580) passou. CPU nativa média 44,69 → 38,61 ms (-13,6%), p95 74,6 → 58 ms (-22,3%), tarefas longas 21 → 12. O tempo de quadro por software ficou praticamente igual (171,99 → 173,16 ms); não transformar esse resultado em afirmação de FPS ou temperatura Android. Frota e população: 44 modelos, 44 modelos em trânsito, 138 NPCs. As três vistas de iluminação continuaram com zero diferenças de pixel.

A revisão seguinte amplia somente a faixa de resolução automática móvel até escala 0,55 (DPR 0,44) e reage proporcionalmente à área sob pressão severa, mantendo perfis manuais, física e HUD. 364 testes locais passaram. A montagem parcial inicial d0ed38b4 deixou index/sw com a revisão anterior, embora o build do Vercel os regenerasse e a atualização pública passasse. O CI de fonte reprovou corretamente essa árvore. d6d9216d sincroniza esses dois arquivos e adiciona a verificação de integridade antes do perfil. Nunca publicar d0ed38b4 como pacote de fonte isolado. Checkout remoto d6d9216d foi comparado ao local para os arquivos da entrega.

Validações finais da fonte d6d9216d: carga 42013933158, gameplay 42013933292, câmera/mundo 42013933369. Atualização HTTPS da revisão d4915ab5ed472447 já passou no run 42013578870 usando a preview do Vercel gerada a partir de d0ed38b4, que recompila a fonte. Aprovação de publicação exige conferir os novos runs e medir a faixa automática sem caps de render.

## Fonte aprovada para publicar

Todos os jobs finais passaram: medição 42013933158; gameplay 42013933292 (quatro jobs: mundo, frota/garagem/serra, embarque e cinco jogos/família); câmera/mundo 42013933369. Integridade de 111 arquivos e 364 testes locais passaram. O empacotamento foi repetido com sucesso sequencialmente após uma disputa entre duas gerações de dist-world; não tratar a falha transitória de cópia como falha aprovada.

As duas comparações nativas finais melhoraram o tempo médio de quadro por software em 17,7% e 9,7%, e a duração média de CPU em 16,2% e 14,2%. O buffer sob pressão passou de 226×490 a 172×374, preservando HUD em CSS nativo. População e catálogo continuaram 138/44, com 44 modelos no tráfego. Não houve certificação de FPS Android nem medição térmica. Evidência detalhada em docs/evidence/fluidez-20261105/final-comparison.json. A revisão d4915ab5ed472447 será publicada com a mesma fonte de runtime aprovada; somente evidência e hash modular foram acrescentados após os testes.

# Copas online e itens por gesto no kart — 24/10/2026

## Relatos atendidos

O online só era selecionável no modo livre: copas e missões forçavam o solo. Na câmera, o item exigia um toque no celular enquanto o usuário dirigia com as duas mãos.

## Comportamento entregue

- **Todas as fases do kart oferecem solo/online:** Copa Cogumelo, Caça às Moedas, Grande Prêmio e Modo Livre. Nomes, desbloqueios, objetivos, dificuldade, garagem, modelos, upgrades, direção e pistas continuam nos dados/motores existentes.
- **Copa completa compartilhada:** plano de pistas preservado a partir da primeira pista de cada fase; a Copa Cogumelo percorre as três pistas. Sala separada por fase/protocolo. A mesma turma, dificuldade compartilhada, bots, sementes, resultados de etapa e classificação acumulada são mantidos até o pódio.
- **Resultado confirmado:** classificação usa chegada real e distância; o anfitrião publica um resultado de etapa uma vez. Os dois humanos precisam terminar ou atingir o limite de tempo. Quem não terminou é explicitamente DNF e não recebe pontos de chegada. NPCs não recebem pontos sorteados. Cada jogador confirma para avançar; o anfitrião não consegue pular uma etapa em andamento. O pódio final fica visível até a saída.
- **Progressão:** bônus de chegada protegido contra repetição de snapshots/toques; copa completa usa o `Profile.addReward` nativo para XP/evolução e os objetivos reais da fase. Domínio/troféus só contam resultado online confirmado. As moedas recolhidas mantêm a economia anterior.
- **Reconexão:** perda de participante pausa o progresso da copa. O identificador da conexão e o checkpoint próprio persistem na mesma aba para retomar a mesma etapa. Não transforma a ausência de outro jogador em vitória/solo.
- **Itens online:** banana aparece/é consumida nos dois clientes; casco e impactos são compartilhados, com resolução de colisão pelo anfitrião; blindagem permanece; ataques de uma etapa antiga não são reaplicados na próxima. O anfitrião continua a simulação dos bots/projéteis após sua própria chegada.
- **Câmera sem toque durante a corrida:** manter as duas mãos na posição do volante prepara o gesto. Levantar só a **mão direita acima da cabeça** por aproximadamente **0,6 segundo**, com a esquerda na posição do volante, usa um item. Exige observações distintas do vídeo. Um gesto usa um item; é necessário baixar a mão para preparar o seguinte. Mantém a direção anterior durante o gesto. As **duas mãos altas** continuam acionando o turbo. Ausência de mão/rosto, vídeo parado, movimento breve e a outra mão não acionam item. O modo manual mantém seu botão de item.
- Cache do kart v23 e URLs de código atualizadas. Nenhum código de avião, WAR, pingue-pongue, boxe ou mundo aberto foi alterado nesta correção.

## Evidência

- Suíte completa Node: **215 testes aprovados**, zero falhas. Os testes de gesto foram repetidos após os ajustes de continuidade do vídeo.
- `tests/kart-cups.test.mjs`: duas instâncias reais do motor, direção ativa na física original e todas as três pistas completas, sem atribuir chegada/voltas/pontos artificialmente; as demais fases também concluem pela física, com seus próprios objetivos. Inclui reconexão, classificação, bônus idempotente, proteção e itens compartilhados.
- `tests/kart-camera-items.test.mjs`: gesto deliberado, repetição bloqueada, direção/turbo separados, mão errada, perda de rastreamento, vídeo congelado, pausa e observações frescas em baixa taxa de quadros.
- `tests/kart-cup-browser.mjs`: dois Chromium independentes usando menus e entrada nativos, transporte HTTP/SSE isolado, câmera/vídeo/poses **sintéticos** em um deles e controles no outro. As três etapas completam pela física original acelerada, ambos confirmam cada etapa e veem a mesma classificação. As quatro fases abrem online com dois clientes. Zero exceções de página. Resultado e imagem do pódio em `docs/evidence/kart-cups-20261024/`.
- A aceleração do teste executa mais passos da física por lote; não escreve posições, voltas, chegadas ou classificação para concluir as pistas. Um item é atribuído apenas na preparação específica do teste de gesto; não se apresenta isso como teste de coleta física nesse trecho.

## Limites explícitos

O backend desses ensaios é um fixture do contrato RTDB, não o Firebase real. A revisão automática anterior bloqueou a consulta às salas reais por possível acesso a identificadores/estado de jogadores; não houve contorno desse bloqueio ou alteração de regras de segurança. Portanto, essas evidências não confirmam regras/conectividade do Firebase de produção nem uma partida em dois celulares físicos. A detecção visual de mãos no aparelho real não foi ensaiada; os testes de câmera fornecem poses/vídeo sintéticos ao motor original.

Os recibos de bônus/checkpoint protegem repetição na execução/mesma aba. Não representam um backend antifraude ou uma garantia global de transação financeira entre aparelhos. Contas, permissões, configuração Firebase e históricos existentes foram preservados.

# Revisão dos sete jogos — 21/10/2026

Problemas reproduzidos a partir das três capturas fornecidas: pista fora do enquadramento, sentido de voo incoerente, aeronave plana, aquisição de alvo ampla demais e Família difícil de encontrar. A revisão também cobre os cinco motores, o mundo OTThi e o HQ original.

| Jogo | Correção e evolução |
|---|---|
| Kart | Pista, carrinho e rivais usam a referência da pista na posição do jogador. Curvas, três pistas, distâncias e câmera traseira cobertas. Física a 60 passos/s em telas de 30–120 Hz. Coleta exige a faixa correta. Garagem, equipamento e peças entram no salvamento original do perfil. |
| Avião | Inclinação, sustentação e trajetória com o mesmo sentido. Mãos niveladas não comandam curva. Kart, avião e boxe usam a resolução real da câmera. Aquisição contínua por 650 ms, dentro de 6°, reiniciada ao perder ou trocar o alvo; aliados do cooperativo excluídos. Fuselagem, cabine, asas, estabilizadores e motores volumétricos. Terreno colorido no lugar da grade e colunas. Melhorias até nível 5 e três modelos com respostas próprias; Interceptor exige motor 3, Sentinela exige blindagem 3. Hangar salvo por perfil. |
| Ping-pong | Física a 60 passos/s; raquete dentro da tela; saque alternado a cada dois pontos e a cada ponto no empate a partir de 10–10. Três fases solo com adversários progressivos, além do modo livre/online. Partida solo concluída registra recompensa uma vez, usando a economia original. |
| Boxe | Resultado por decisão considera pontuação e vida. Desafio do primeiro round termina no prazo. Dificuldade das fases respeitada; bloqueios, esquivas, golpes e contragolpes contabilizados pelo motor. |
| AR | Expedições aumentam de 3 a 6 objetos conforme as conclusões. Entregas e missões possuem contadores próprios; recompensa não duplica. Missões consecutivas não desaparecem do histórico entre duas leituras da interface. Um único conjunto de controles no modo manual. |
| OTThi | Texturas recebem uma imagem neutra antes do carregamento, conservada se ele falhar. Família acessível em Vida → Família e no mapa/pausa. Retrato opcional enquadra os quatro, com nomes e sem o avatar local cobrindo os rostos. Movimento, arrasto ou Voltar à exploração encerra o retrato. Geometria original preservada, cores convertidas corretamente e vértices idênticos compartilhados. |
| Família original | Mesmos personagens, controles, oficina, tecnologia, busca de brinquedos e exploração. Circuito com recorde persistente e tempos de bronze (45 s), prata (30 s) e ouro (22 s). Simulação com passos limitados e pausa quando a página fica oculta. |

Os cinco jogos de ação recebem três etapas de carreira: Iniciação, Técnica e Maestria. Os objetivos usam acontecimentos reais do motor; guardar defesa sem bloquear um golpe, abrir uma garagem vazia ou apertar um disparo não conclui um desafio. A conclusão fica salva neste dispositivo. A etapa seguinte começa na próxima partida.

No mundo aberto, Vida → Personagem → Meu personagem permite escolher Thiago ou Thamis como personagem controlado. O painel Família também oferece Jogar como Thiago / Jogar como Thamis. A seleção utiliza os modelos originais com esqueletos independentes e fica no campo de aparência já salvo e sincronizado pelo perfil. A física, as ações, os veículos e os outros estilos continuam disponíveis. Ferramentas seguem a mão do modelo escolhido; voltar a outro estilo restaura a personalização anterior.

## Validação

- `node --test tests/*.test.mjs`: comportamento, controles, projeção, frequência de tela, aquisição de alvo, economia, persistência e progressão.
- `node tests/playable-smoke.mjs`: partidas reais no Chromium, com contas/câmera isoladas; aceleração, direção, golpes, coleta, raquete, voo, ajustes, gamepad, pausa e retorno. Inclui curvas do kart e trajetórias à esquerda/direita do avião.
- `node tests/family-playable.mjs`: WebGL/Three.js reais; ambas as cachorrinhas devolvem brinquedos nos dois mundos; retrato em duas orientações; passeio; veículo nativo; respostas erradas/certas no laboratório original. O enquadramento inclui a profundidade e a posição dos quatro, inclusive durante o retorno do brinquedo; cenários de retorno e passeio também são verificados sem renderização.
- `node tests/studio-verify.mjs` e `node tests/world-integrity.mjs`: integração e integridade SHA-256 do PWA.
- `node tests/production-audit.mjs`: bytes publicados comparados com os arquivos aprovados, após a implantação.

A revisão usa os modelos volumétricos existentes de `mascotes-3d.js`, que foram construídos a partir da prancha aprovada. Não equivale a afirmar identidade visual perfeita com uma imagem de referência. Os testes de navegador isolam serviços externos; câmera física, multiplayer entre aparelhos e desempenho de um celular específico exigem validação nesses aparelhos.

## Correção após o relato de direção e escolha de grupo

O teste anterior de enquadramento não cobria a dirigibilidade: em velocidade normal, seis passos de direção (0,1 s) ainda faziam o kart deslizar até o limite antigo de 3,5 meias larguras da pista. A direção agora define velocidade lateral limitada, com retorno rápido ao soltar; colisões só aplicam impulso ao iniciar o contato. O gramado continua reduzindo a velocidade e permite recuperação. Os rivais passaram a acelerar pela mesma escala de velocidade do jogador, em vez de somar apenas 0,04 por passo.

A validação inclui toques de 0,1 s com os oito pilotos, três voltas completas nas três pistas alternando faixas, contato prolongado com rival, retorno do gramado e frenagem com turbo. O Chromium também verifica soltura após seis passos reais e uma corrida de três voltas pelos botões visíveis.

O painel Família permite escolher quem controla (Thiago ou Thamis), marcar Todos, Só eu ou qualquer conjunto de acompanhantes. Thiago + Luna + Liz mantém Thamis em casa. O grupo e o personagem são salvos; os acompanhantes usam seus modelos originais e caminham no mundo. O personagem controlado não aparece duplicado no grupo. A autoridade de sala impede que outro participante tome um passeio ativo.

O projeto `android/` abre o console dos sete jogos, separado do antigo aplicativo exclusivo do mundo aberto. Compilação, análise Android e instalação em emulador são verificadas no workflow próprio. A chave final de assinatura não passa pelo CI público. O aplicativo usa internet para carregar jogos e serviços; não promete todos os jogos offline.

Resultados de testes descrevem os fluxos cobertos. Não representam nota de jogabilidade 10/10 nem certificação em celulares físicos.


## Nova revisão: direção, missões e toques simultâneos

O relato de turbo sem piloto revelou duas lacunas nos testes anteriores: o turbo bastava para acelerar sem pose e a física não compensava a curvatura da estrada. Uma corrida neutra no centro não deve ser usada como prova de boa dirigibilidade. Agora as curvas produzem deslocamento para fora; o jogador as compensa com o volante. A ajuda de direção tem quatro posições explícitas (desligada, leve, média e forte), reduz o efeito das curvas e protege a borda sem fixar o kart no centro. O padrão é leve; os adversários têm dificuldade independente. Turbo exige aceleração válida; perder as mãos na câmera cancela o turbo e desacelera o kart, com aviso na tela.

O avião no modo Controles recebe joystick analógico com zona neutra e eixos independentes: direita e subida podem ser dosadas juntas. ATIRAR, MÍSSIL e TURBO aceitam outros dedos. No modo manual, o canhão exige gatilho e mira travada; no modo câmera continua disparando somente após aquisição válida. Os botões antigos de direção continuam como ponte interna para teclado/gamepad. Sons extras (antigo FX) não comandam direção ou assistência.

Os botões compartilhados mantêm seus próprios conjuntos de dedos: soltar um não encerra outro. O mesmo botão continua pressionado enquanto restar um dedo nele. Joysticks pertencem ao primeiro dedo até sua liberação. Pausa e ajustes liberam os comandos. No ping-pong, dedos adicionais não roubam a raquete e um segundo toque permite sacar. Boxe conserva a defesa enquanto outros dedos socam. OTThi e HQ preservam movimento, correr e ações simultâneas.

### Missões do OTThi

Inventário revisto: nove capítulos de conquistas, oito trabalhos individuais, sete modelos de missões compartilhadas, desafios diários, atividades locais e atividades da família. Trabalhos e capítulos conservam seus objetivos próprios e o progresso individual. O seletor de modalidade/dificuldade fica na central de missões solo e online; ele não transforma compras de casa, capítulos ou profissões individuais em objetivos compartilhados.

| Missão compartilhada | Treino | Normal | Desafio |
|---|---|---|---|
| Bombeiros | 3 aplicações + liberação | 4 + liberação | 6 + liberação |
| Resgate | etapas com 0,6 s no atendimento | 1,2 s | 2 s |
| Polícia | etapas com 0,6 s na abordagem | 1,2 s | 2 s |
| Pescaria | 4 peixes, 2 assados | 6, 3 | 8, 4 |
| Escola | 2 alunos entregues | 4 | 6 |
| Corrida de rua | 4 checkpoints, raio 5,4 m | raio 4,2 m | raio 3 m |
| Pista oval | 2 voltas | 3 | 4 |

Cada modelo oferece solo, dupla online com exatamente dois jogadores e equipe de até três. Corridas também preservam competição online. Todos devem estar prontos e conectados ao mesmo bairro para iniciar. Uma falha online não escolhe solo automaticamente: o progresso aguarda o parceiro; copiar para solo é uma ação explícita. A transação de entrada impede um terceiro usuário na dupla. A dificuldade é sincronizada no registro da missão.

Bombeiros em dupla permite ao motorista assumir a liberação da área depois que a mangueira controla o fogo. Resgate exige duas pessoas próximas para a maca no modo online. Polícia espera o personagem acompanhado chegar à viatura; escola espera o aluno chegar ao destino. As corridas cooperativas exigem o percurso de cada participante; não basta somar checkpoints de pessoas que cortam caminhos. Corrigido o setor zero da pista oval, que antes era descartado como valor ausente. Metas de capítulos já atingidas não desaparecem quando os materiais/cristais são consumidos.

Família: seleção de Thiago ou Thamis, todos/somente eu/subconjuntos, inclusive Thiago + Luna + Liz, e escolha explícita de bolinha, disco ou ossinho. A devolução real de cada brinquedo continua produzindo um único crédito.

### Evidências e limites desta revisão

Testes de motor cobrem direção ativa em três pistas com oito pilotos e ajuda desligada, resposta dos quatro níveis, turbo sem câmera, perda de tracking, joystick diagonal e gatilho com trava. Os sete modelos de missão têm seus estados exercitados em solo e dupla nos três níveis (42 combinações), usando mundo isolado e objetos Three; isso verifica lógica, ordem, metas e conclusão, sem afirmar que percorreu fisicamente cada trajeto em dois aparelhos. As funções reais do cliente RTDB são verificadas contra uma API transacional em memória com três clientes, incluindo capacidade, pronto, dificuldade, presença e idempotência.

O Chromium executa toques nativos com IDs distintos, além dos testes de botões, nos cinco jogos de ação, OTThi e HQ. Os serviços externos são isolados nesses testes. Câmera física, dois celulares reais na rede de produção e desempenho no aparelho do Thiago precisam ser distinguidos dessa evidência. Não há confirmação honesta de jogabilidade “10/10” a partir de testes automatizados.

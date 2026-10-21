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

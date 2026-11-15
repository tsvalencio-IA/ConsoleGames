# Revisão dos jogos — 11/11/2026

Base: `6258e611f8a426e9779299d900455079d03c6279`, na branch local `continuation-20261111`. Esta revisão conserva os jogos e os controles atuais. Propostas abaixo não foram incorporadas à publicação.

| Jogo | O que já existe e deve ser aproveitado | Próxima melhoria de experiência proposta |
|---|---|---|
| OTThi World | Vida, trabalho, entregas, frota, economia, família e mundo compartilhado. Verificação técnica prioritária registrada separadamente. | Um objetivo inicial curto: pedir um veículo, completar um trabalho, guardar o veículo e mostrar o resultado. Usar os sistemas existentes, após estabilizar os ciclos. |
| WAR Combate | Treino sem dano; operações Porto, Cidade e Fortaleza; cooperativo; fuzil, submetralhadora e arma de precisão; cobertura, recarga, flanqueadores e supressão. | Avaliar controle que mantenha rosto e tronco voltados à câmera. A prévia isolada compara opções; depende da decisão de Thiago e de ensaio corporal real antes de integrar. Depois, tornar o próximo objetivo legível e diferenciar pressão/inimigos entre as operações existentes. |
| Kart Legends | Três pistas ampliadas com setores, três voltas, pilotos e adversários; itens, vácuo, drift com impulso, garagem, campeonatos e online. | Uma corrida de referência deve exigir ultrapassagem, defesa e uso de item, com pelo menos duas disputas perceptíveis. Validar manualmente precisão ao soltar o volante e previsibilidade do drift. Aumentar pista sozinho não cumpre esse critério. |
| Dança | Cartão próprio; aulas e professor; acompanhamento corporal; músicas originais, arquivo local e player oficial YouTube. BPM do YouTube manual ou por toques. | Exibir ao terminar quais movimentos perderam leitura e permitir repetir o trecho/aula. Comparar recordes da mesma música, BPM e aula; não prometer detecção de batida do YouTube. |
| Aero Strike WAR | Caças/helicóptero, hangar, melhorias, combate, escola e voo livre; calibração, pouso, frenagem e nova decolagem. | Uma missão curta de navegação: decolar, atravessar pontos existentes, alinhar aproximação e pousar; pontuar suavidade e alinhamento, aproveitando as métricas de pouso. Preservar a escola/calibração aprovada. |
| Ping Pong Wii | Três níveis de adversário, partidas até 11 com diferença de dois, saque alternado, câmera calibrada, toque e online. Movimento espelhado normalizado à resolução real; velocidade do golpe calculada do pulso. | Treino de direção com zonas na mesa e feedback do impacto; medir atraso e fidelidade do pulso em aparelho, sem mudar a calibração salva por suposição. |
| Boxing Pro | Treino Amador, Rivalidade antes do segundo round, Cinturão e modo livre/online; guarda, esquiva, contragolpe e decisão por pontos. | Ensinar uma sequência curta “defender → reconhecer abertura → contragolpear” com o adversário existente; mostrar o motivo de golpes bloqueados e a próxima exigência da carreira. |
| Aventuras em Família 3D | Thiago/Thamis, Luna/Liz, brinquedos e devolução, oficina, laboratório, estrelas e circuito de seis checkpoints com bronze/prata/ouro e recorde salvo. | Encadear uma pequena aventura usando os destinos atuais: brincar com cada cachorrinha, encontrar uma estrela e tentar melhorar o circuito. Evitar transformar exploração livre em obrigação ou apagar progresso. |

O console também preserva a carreira de Iniciação/Técnica/Maestria dos cinco jogos de ação. Não é preciso criar outra economia ou reiniciar as fases para oferecer objetivos mais claros.

Juízo de design, ainda sujeito a uma partida presencial: o WAR atual atribui caminhada e giro à esquerda, além de mira e disparo à direita; isso exige aprender papéis simultâneos e não responde por si só à reclamação de permanecer enquadrado. No Kart, adversários, vácuo, itens e impulso de drift já existem: a próxima revisão deve organizar situações de disputa e comunicar essas oportunidades. A ampliação de setores não demonstra que a corrida ficou mais interessante. As capturas desta sessão mostram pista, rivais, posição e controles, mas não autorizam declarar diversão ou precisão corporal resolvidas.

## Critérios para aprovar diversão e controle

- **WAR:** concluir treino/combate sem sair do enquadramento, virar intencionalmente e distinguir mirar de girar. Perda de leitura deve interromper comandos. Aprovação de testes de duas mãos não equivale à aprovação ergonômica do usuário.
- **Kart:** corrida inteira com rivais e itens, retomada após erro, direção curta que cessa ao soltar, drift compreensível e disputa por posição. Medidas de duração sem rivais não provam esse conjunto.
- **Dança e pingue-pongue:** observar movimento real do corpo/pulso e resposta na tela; rastreamento sintético prova regras, não fidelidade física.
- **Todos:** uma partida completa, retorno ao menu e preservação de progresso; retrato e paisagem; ausência de botões sobrepostos; repetição voluntária por um jogador. Não atribuir uma nota de diversão a uma suíte automática.

## Evidências desta sessão

Resultados locais de navegador e respectivas limitações são consolidados em `jogos-verificacao.json`. Capturas e logs brutos permanecem no diretório de trabalho e em `test-results`; o registro consolidado só marca como aprovado o que terminou com sucesso. Não foi usado aparelho físico, conta real ou base de jogadores.

- Dança: entrada pelo cartão, quatro tamanhos de tela, conservação do iframe, pausa manual/carregamento, encerramento da câmera e preservação de registros passaram com player/poses explicitamente simulados. Música original passou renderização PCM, suspensão e retorno.
- Reprodução YouTube real: tentativa bloqueada antes do player por `ERR_CERT_AUTHORITY_INVALID` do Chromium ao acessar a origem pública pelo proxy. Não se concluiu disponibilidade/reprodução do vídeo nem se atribuiu falha ao jogo.
- Navegador dos cinco jogos de ação: Boxe, pingue-pongue e Avião completaram o roteiro existente de controles/configurações/retorno, com três cenários aprovados em sete. Não significa luta ou partida inteira nesses três jogos.
- Kart: retrato atingiu o prazo de 15 s aguardando 46 passos de física (o diagnóstico posterior registrou os 46 e apenas 0,0168 de deslocamento após soltar, dentro do limite 0,14); paisagem atingiu o prazo de captura de tela; desktop atingiu 180 s na segunda volta, com 3020 passos e desvio máximo 0,438, ainda no asfalto. Não foi comprovada uma corrida inteira no navegador desta sessão.
- WAR: movimento, mira e tiro com três toques e um abate passaram; a espera de quatro segundos pela recarga venceu o prazo. A captura posterior mostra o jogo ativo e munição cheia. A recarga dentro do prazo permanece sem aprovação neste runner; os diagnósticos não registraram erros JavaScript. Controle corporal continua sem aprovação ergonômica.
- Avião: o ciclo de pouso/frenagem/nova decolagem passou no único ensaio repetido após encerrar a suíte pesada, com física, renderização e controles nativos e zero erros JavaScript. A posição de aproximação é preparada pelo roteiro; o pouso foi suave e a nova decolagem ocorreu pelos controles de potência/joystick. A primeira tentativa concorrente venceu o prazo de frenagem e foi conservada no relatório; não se apagou a falha inicial para apresentar só o sucesso.
- Família 3D: nesta revisão foram conferidos o código dos objetivos, a persistência e os destinos; uma nova sessão completa de navegador não foi executada. Sua cobertura de lógica faz parte da suíte geral.

## Prévia de decisão

[`arcade/previews/war-controls-20261111.html`](../../../arcade/previews/war-controls-20261111.html) é uma experiência de controles separada: câmera representada por um quadro simulado, opções comparáveis, mira, giro e objetivo curto. Não substitui WAR, não usa a câmera real e não é prova de combate/gráficos finais. Serve para decidir a lógica antes de alterar o jogo existente.

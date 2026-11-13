# Evolução integrada 705.28.27

Continuação da candidata **705.28.26**, sem reiniciar o diagnóstico. Revisão `d4a223e1aa501f02`. O registro de publicação será acrescentado a `release.json`, com commit exato e opção de retorno.

## O que mudou no jogo

- **Trânsito:** filas antigas passam a ter prioridade estritamente ordenada. A tolerância anterior podia gerar decisões circulares. Tentativas devolvidas pela colisão conservam a idade na fila; depois de esperar, o veículo pode recuar 22 cm se a posição estiver livre e na via. Sem teleporte, retirada de carros ou redução do mundo.
- **Encomendas:** a van pode escolher outra vaga segura no comércio quando sua vaga de retorno ficou ocupada. Isso libera o motorista para a próxima encomenda paga. O acompanhamento continua buscando o jogador quando ele muda de lugar; pagamentos e recibos usam o sistema existente.
- **Objetivos:** cartão de missão e menu MUNDO oferecem **Meu caminho**, percurso opcional por sete aventuras existentes. A dificuldade sugerida cresce com o progresso; o painel mostra etapa, região e recompensa real. Atividades, exploração e duplas continuam livres. Não foi criada outra economia.
- **Trabalho por quadro:** consultas estáticas de terreno deixam de recalcular o lote pessoal; leituras do herói deixam de clonar todos os veículos/configurações; HUD atualiza somente os elementos alterados. Casa, conta, herói e elegibilidade de energia conservam os resultados.
- **Correções da candidata26 incluídas:** descarte de recursos dos incidentes, equipes e motoristas; colisão de NPC após reabertura da oficina; mensagem de entrega interrompida. Restauração nativa de veículos estacionados preservada.

WAR e Kart recebem experiências opcionais **dentro dos jogos reais**, mantendo o padrão e as calibrações online:

- [WAR frontal](war/README.md): giro contínuo ou em passos de 45°, mira e disparo intencional; treino e patrulha completos.
- [Kart disputa](kart/README.md): quatro rivais, três voltas, ultrapassagens limpas, drift e pódio. Renderização conserva os pixels com menos cálculos.

## Evidências e alcance

| Sistema | Resultado observado | Evidência |
| --- | --- | --- |
| Trânsito | Mesma cena de 180 s,44 modelos e 138 NPCs. Quatro ônibus antes praticamente parados voltaram a progredir. Ainda existem filas e contatos. | [Comparação](transito/README.md) |
| Entregas | Antes: retorno bloqueado por 341 s. Depois: retorno alternativo, segunda compra, jogador em movimento, recarga e recebimento único. | [Relatório](entregas/README.md) |
| Oficina/garagem | Seis NPCs reparados e retirados automaticamente; carro próprio elevado/desmontado preservado; propriedade/economia conservadas na recarga. | [Sessão](integracao/native-12-cycles.json) |
| Socorro/recursos | Doze incidentes com dois participantes reais cada, liberados ao final. Entre ciclos 2 e 12, crescimento zero nas contagens de objetos, geometrias, materiais, ações e contornos. Quatro ocorrências usaram contingência. | [Método e limites](integracao/README.md) |
| Jornada | Primeira aventura nativa concluída, próxima sugerida, recompensa única e recarga. Quatro tamanhos de tela. | [Dados](jornada/native.json), [captura](jornada/next-objective.png) |
| Multiplayer | Dois clientes nativos: aeronaves distintas, troca de autoridade e reutilização das aeronaves estacionadas. RTDB local descartável. | [Dados](integracao/multiplayer.json) |
| Atualização | Produção25→27: atualização segura, recuperação da configuração antiga, perfil preservado e abertura offline coerente. | [Dados](integracao/update-25-to-27.json) |
| Interface | Dez transições de tamanho/orientação passaram nos critérios medidos; não é rotação física. | [Dados](integracao/mobile-layout.json) |
| Regressões | 470 testes passaram nessa execução. Não significa ausência universal de defeitos ou diversão aprovada. | [Log](integracao/unit-470.log) |

Ambiente: **Linux, Chromium 141.0.7390.37, WebGL por software**, perfis descartáveis e RTDB local. Cenários usam posições iniciais preparadas. A jornada usa deslocamento de QA entre tarefas, executando ações/recompensas nativas. O ensaio integrado controla o relógio em passos de 60 Hz, limita desenho e adianta explicitamente o prazo da oficina. Não confundir simulação funcional com FPS.

## Desempenho e limites

Comparação sequencial de 20 s com RAF/desenho nativos, mesmas configurações: trabalho médio do loop **55,80→50,72ms**, p95 **92,9→84,3ms**. Intervalo médio entre quadros **281,49→283,13ms**: **não foi demonstrado ganho de FPS** no renderizador por software. Perfis de CPU em cidade, praia e helicóptero tiveram resultados mistos. [Dados completos](performance/README.md).

Aquém de uma homologação física: FPS sustentado, calor, bateria, câmera, latência percebida, APK instalado e multiplayer entre aparelhos reais não foram medidos. O [roteiro no celular](TESTE_NO_CELULAR.md) identifica essas pendências sem programação. Congestionamentos continuam existindo; algumas ocorrências usam socorro de contingência, sem chegada física universal das viaturas.

## Preservação e continuidade

[Preservação](preservation.json): os 143 arquivos anteriores do manifesto continuam presentes; a nova versão tem 147. Arquivos de Firebase/regras/calibração identificados na árvore não mudaram. Não houve migração ou escrita no banco real. Os oito jogos e atividades continuam incluídos no pacote. As versões anteriores e a candidata26 permanecem disponíveis para retorno.

Antes de continuar, consultar este registro, `release.json` e `PROGRESS.md`, confirmar a versão publicada e então editar. Não reintroduzir a correção baseada em mock incompleto: o construtor nativo já restaura `state.vehicles.parked`.

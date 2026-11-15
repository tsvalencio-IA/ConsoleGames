# Socorro físico, câmera e estabilidade — em andamento

Base preservada:705.28.28-maos-livres-tela-limpa, revisão6f64398fafb8a424, aplicação2e3f1be286e74c0f998b81d7ba2a01147afc82a1, HEAD inicial7d61e0f. Mesma branch continuation-20261111. Mãos vazias, tela limpa, Meu caminho, dados/Firebase e oito jogos ficam preservados.

Pedido atual: corrigir travadas ao mudar ângulo, concluir chegada física do socorro e medir sessões com trânsito/acidentes/entregas simultâneos. Contingência continua como proteção, mas NÃO comprova atendimento físico. A sessão anterior60ciclos/59timeouts era teste finito com relógio acelerado e desenho limitado; não equivale a partida física ou prolongada com RAF nativo.

Frentes: camera_stall investiga compilação de shaders quando muda o bucket de lâmpadas visíveis; rescue_physical corrige despacho/rota/recuperação e separa física/backup/timeout; integrated_endurance prepara ensaio nativo15min antes+15min depois, com dados por janela60s, relógios real/simulação/trânsito e GC em marcos separados. Raiz integra, agenda benchmarks sem concorrência, revisa preservação e publicação.

Achado confirmado na fonte: limite do backlog de simulação não acompanha performance.now em renderização lenta;22s reais podem incluir menos movimento. Hipótese a comprovar: bucket de luz não aquecido no ângulo inicial provoca shader novo durante giro. Não declarar melhora até comparar mesmos ângulos/posição/qualidade e fontes identificadas.

Baseline prolongada será compilação28 fixada no commit, independente de módulos locais em edição. Incidentes alternam quatro locais reais preparados, com atores reais; nenhuma viatura será teleportada para fabricar chegada. Registrar distância/deslocamento por quadro antes da contingência, todos os recibos/cobranças, propriedade e recursos. Manter44modelos/138NPCs/conteúdo.

Medidas de aparelho físico ainda não disponíveis: FPS sustentado, temperatura/bateria, driver GPU e latência sentida de toque/câmera. Preparar roteiro simples depois da implementação; nenhuma tarefa de programação para o usuário. Fonte de aplicação publicada ainda é28 até novos testes/produção serem registrados.


## Fechamento solicitado pelo usuário em15/11/2026

Produção28 preservada. Candidata29 compilada3227043b294bd89d,150 arquivos, abertura nativa/hands/HUD/Meu caminho passou e14 testes focados passaram. NÃO homologada: socorro isolado só3/5 físico; sessão longa da candidata e partidas novasWAR/Kart pendentes. A base nativa15min foi concluída e está em native-baseline-28.json. Detalhes finais e bloqueios em README.md. Não publicar esta candidata como entrega concluída. Conservar todo trabalho em commit/PR e prévia separada, com metadados em preview.json; não modificar o recibo global da produção28.

Prévia publicada separadamente: https://otthi-world-campanha-teste-32ymp5zkx-thiaguinho-s-projects.vercel.app/arcade/previews/estabilidade-20261115.html; aplicação 13715335884aea153479089b4d2c127539dfcd80, deployment dpl_AYFVYiiEAsHfx6yodnZdTVz8bo1u. Verificação HTTP 171/171 arquivos; páginas de entrada/mundo/WAR/Kart responderam 200. Isso verifica publicação da prévia, sem concluir aceitação. Alias habitual confirmado na produção28. Não há teste longo rodando em segundo plano.

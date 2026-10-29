# Continuação OT Games — entrada, calibração e fluidez, 29/10/2026

Projeto exclusivo: tsvalencio-IA/ConsoleGames. Preservar o SaaS da oficina, IDs Firebase, contas, salas, progresso e os sete jogos. Não reduzir o mapa, a frota, NPCs ou animações para declarar ganho de desempenho.

Base publicada anterior: 8c5ba8cee90d163dab5b1c114579490d3b9c29cf. Candidata atual: web 705.28.11-calibracao-entrada-fluidez, assetVersion 70647; WAR worker v40, kart v32. Estado de publicação e provas: docs/evidence/entrada-calibracao-fluidez-20261029/release.json. Até esse arquivo conter a conferência do alias, não declarar que o usuário já recebeu esta versão.

## Correções

- A opção JOGAR SOZINHO deixou de ser um painel fixo de z-index 8000. Fica dentro do formulário de entrada, ou dentro do carregamento após 6,5 segundos se o perfil demorar. Esconde em menu, fases, jogo, resultados e calibração, mesmo quando as fases abrem diretamente na transição da conta. Observa saída/entrada e preserva os dados solo. Cópia canônica em enhancements/local-practice.js e cinco jogos.
- O treino não assume mais que existe um brinquedo: usa mão direita inicialmente, ou a escolha explícita de mão/objeto lembrada localmente. Corpo e mãos continuam reais; seleção de objeto continua disponível.
- Cadastro: etapas e progresso explícitos; erro de recaptura limpa template/eixo em memória, sem apagar a carreira. Recalibrar exige captura/reuso explícito, impedindo o fechamento automático da tela enquanto o usuário tenta refazer a seleção. Rotação do aparelho preserva a opção de reaproveitar o objeto.
- A ponta só é confirmada após resposta do worker. A busca por identidade agora tenta rotação e escala e alinha o ângulo antes da busca de posição. O teste completo inclui objeto girado 37 graus após tocar na imagem, recaptura sem textura e nova tentativa. Dois resultados de identidade são exigidos para recuperar; a validade de imagens em jogo continua limitada a 550 ms. Corpo mantém 1200 ms. Nenhum frame sai do aparelho.
- A tela da calibração aceita rolagem por toque e mantém a escolha de fonte acessível. Um experimento de rodapé sobreposto foi descartado após o teste de toque detectar que cobria CAPTURAR. Não reintroduzir.
- Rodovias usam candidatos espaciais conservadores, depois o predicado geométrico original. Validação detecta alterações de coordenadas, largura e pontos. Ruas urbanas deixam de criar objetos temporários para cada teste. Altura do terreno evita calcular segmentos/montanhas cujo limite espacial está fora da consulta. Bordas, calçadas e relevos preservados.
- Materiais dos veículos preparados são compilados enquanto a tela de carregamento está aberta; os templates são removidos do grupo temporário sem descartar geometria/material compartilhado. Ainda existem compilações de variantes posteriores: não dizer que todas foram eliminadas.

## Provas e limites

335 testes unitários passaram. A entrada dos cinco jogos foi testada com conta isolada abrindo fases diretamente, controles, saída e solo. Cadastro do objeto, cinco pontos, sete acertos nativos, carreira intacta, rotação, captura inválida e recuperação passaram. O teste usa pixels determinísticos e postura explicitamente simulada; não equivale a câmera física de brinquedo/pessoa.

Worker antigo v34 → v40 instalado de verdade em HTTP/1: partida não interrompida, ativação após sair, 4321 moedas, arma/carreira e outra sessão/cache preservados. APK público original não substituído.

Comparação nativa de Chromium com software WebGL, 44 modelos de tráfego e 138 NPCs: CPU média 61,48 → 50,51 ms e p95 112,3 → 69 ms. Intervalo médio de quadros 133,11 → 138,67 ms; p95 255,4 → 278,6 ms. Portanto NÃO há prova de resolução dos travamentos no Android nem de melhora geral de FPS. A otimização de CPU é comprovada; a cadência de desenho permanece uma prioridade. Não usar o benchmark para dizer que está fluido no celular.

## Publicação e Android

Trabalho: performance-gravacoes-20261027. Produção: world-revisao-20261022. Vercel: projeto prj_wKaHtyk7Pb3vsb9KsnKerxS8bOKm, time team_W3UyY5ss3Shyv78KRMndjust. Alias https://otthi-world-campanha-teste.vercel.app. Build: python3 games/otthi/tools/build_project.py && python3 tools/package-world-preview.py; saída dist-world. Verificar os quatro workflows e o SHA exato do alias. Executar auditorias públicas de arquivos e testes de câmera sequencialmente para evitar disputa do proxy.

Assinatura Android original continua ausente. Não gerar outra chave, pacote, APK incompatível, desinstalação ou apagamento de dados. A atualização web/PWA do mesmo domínio funciona sem substituir APK. Detalhes do certificado e histórico de validações: docs/CONTINUAR_OT_GAMES_2026-10-29.md.

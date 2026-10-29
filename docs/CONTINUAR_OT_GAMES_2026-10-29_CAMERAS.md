# OT Games — cadastro pela traseira com confirmação frontal

Escopo: tsvalencio-IA/ConsoleGames, sem alterações no SaaS da oficina. Build 705.28.13-cadastro-duas-cameras, assetVersion 70649, WAR worker v42. Fonte, CI e publicação verificadas ficam registrados em docs/evidence/cadastro-duas-cameras-20261029/release.json. Histórico anterior: CONTINUAR_OT_GAMES_2026-10-29_CALIBRACAO.md.

## Comportamento

Em WAR > TREINO DE MIRA > CÂMERA > BRINQUEDO / OBJETO, CADASTRAR PELA TRASEIRA é opcional. Selecionar detalhes do próprio brinquedo, capturar, marcar ponta e apoio. O jogo retorna à frontal e exige nova captura do mesmo objeto na posição e distância de jogo, com ponta e apoio. Só inicia quando objeto e corpo frontal estiverem realmente calibrados. A câmera desaparece na partida. Não interpretar cadastro traseiro como rastreamento 3D nem como garantia de reconhecer um close-up distante na frontal.

A câmera anterior é encerrada antes da próxima; a traseira deve informar facingMode environment. Corpo fica pausado na traseira. Workers antigos são encerrados durante a troca para impedir resultados pendentes de outra câmera. Captura fica desabilitada sem stream ativo. Se a traseira estiver indisponível, restaura a frontal; sair durante permissão pendente encerra também qualquer stream que chegar depois.

Dois templates explícitos do mesmo objeto: vista frontal primária e uma referência traseira. Cadastro antigo de uma vista continua aceito. A referência só é tentada após perda confirmada, em intervalos limitados, com duas correspondências de identidade. Não há recaptura automática de fundo nem afrouxamento dos limites de imagem: até 550 ms para mira e 1200 ms para corpo. Cadastro parcial traseiro não substitui o brinquedo salvo. Persistem descritores locais, não fotografias nem vídeo enviado a servidor. As coordenadas de seleção respeitam espelhamento frontal, traseira sem espelho e margens do canvas.

## Validação e limites

340 testes unitários passaram, incluindo pixels reais de dois templates, recuperação, rejeição de terceira textura, compatibilidade de cadastro e coordenadas. O teste de navegador exercita cadastro traseiro, confirmação frontal obrigatória, corpo pausado na traseira, início em frontal, perda sem disparos, retorno da vista registrada, ausência de traseira e saída durante permissão pendente. Os pixels e a postura deste teste são fixtures declaradas; os workers de objeto, UI e restrições getUserMedia são reais. Não é validação de câmera física Android.

O treino frontal anterior passou com cinco pontos, alvos nativos, carreira preservada, rotação, recaptura inválida e nova tentativa. Atualização real do worker antigo 34 para 42 em HTTP/1 completou o cache, esperou sair da partida e preservou carreira, arma, 4321 moedas e outra sessão. O primeiro teste de perda foi corrigido para esperar um resultado explícito de objeto perdido, evitando medir o breve intervalo de validade antes de o frame novo ter sido observado; a exigência de não disparar após perda foi mantida.

## Publicação e continuidade

Branches: performance-gravacoes-20261027 (trabalho/evidências) e world-revisao-20261022 (produção). Alias https://otthi-world-campanha-teste.vercel.app. Build python3 games/otthi/tools/build_project.py && python3 tools/package-world-preview.py, saída dist-world. Conferir SHA exato e hashes publicados antes de declarar entregue. Executar navegadores e auditorias públicas sequencialmente.

Esta revisão não altera simulação/renderização civil, mapa, NPCs, veículos, áudio ou kart. Os travamentos Android permanecem pendentes de perfil físico conforme a continuação anterior. Não prometer fluidez ou padrão COD. O controle legado world-hand-controls dentro do mundo civil não é substituído por esta alteração; o WAR atualizado é o console.

A chave de assinatura Android original continua ausente. Não criar outra identidade/chave nem alegar um novo APK compatível. A entrega atualiza o conteúdo web/PWA no mesmo domínio. Não apagar conta, saves, família, histórico ou outra sessão do usuário.

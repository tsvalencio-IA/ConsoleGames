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

A primeira execução Android 40965558902 falhou antes do teste: Playwright 1.56.1 não suporta o runner ubuntu26.04-x64 que ubuntu-latest passou a selecionar. Correção focal: fixar esse workflow em ubuntu-24.04, como os demais testes de câmera e gameplay. Não é falha de download observada no produto nem motivo para trocar a versão do APK. O commit de compatibilidade não altera a árvore games.

## Entrega verificada em 30/10/2026

Fonte publicada 491e1415cb639a5dd0bd89f218d45fb766fab803, árvore games 3f0430c8c6c2be5a4e925daf35179bafa8786ba7, deployment dpl_FfJVQ941DWnhWaUo6V93DjxSkCjf READY no alias habitual. O código do jogo é idêntico ao 1f080b89, aprovado nos workflows de trabalho 40965558985 e 40965559027; a correção de runner passou em 40965716592. Os três workflows repetidos na produção passaram: câmera/mundo 40967050909, gameplay 40967050918 e download Android 40967050944. Inclui 340 unitários e calibração traseira/frontal, cinco pontos e alvos, modelos reais de corpo+mão na mesma câmera, worker 34→42 e os demais fluxos de regressão.

O cadastro pela traseira e a confirmação frontal passaram no HTTPS público em 28,5 s. Os 27 recursos WAR e o APK original conferiram por bytes. As observações públicas anteriores estão reconstituídas a partir dos resultados efetivamente recebidos, com essa origem explícita, em public-observations.json; não inventar relatório bruto perdido. A auditoria pública completa de 109 hashes do mundo não teve resultado retido e não é declarada aprovada. A atualização pública real foi concluída e seu relatório preservado: build/revisão atuais, worker real, no-store, 4321 moedas, Thiago+Luna+Liz e outra sessão preservados; entrada automática pelo console validada.

Para o usuário: /games/atualizar/; WAR > TREINO DE MIRA > CÂMERA > BRINQUEDO / OBJETO > CADASTRAR PELA TRASEIRA. Cadastrar detalhes e ponta/apoio, depois confirmar pela frontal na distância de jogo. Não prometer rastreamento 3D de qualquer brinquedo, precisão física Android, novo APK assinado, fluidez do mundo ou equivalência COD. Nenhuma nova alteração de jogo é necessária para registrar estas provas.

# Continuidade OT Games — 04/11/2026

Escopo exclusivo: tsvalencio-IA/ConsoleGames. Não confundir com o SaaS da oficina. O usuário continuou em outra conversa (6ae48565-0f18-83e9-930a-9f6b152f7e71) e pediu recuperação fiel dos avanços e correção das regressões. A íntegra dessa conversa não foi disponibilizada: recuperação de contexto indisponível e link direto inacessível. Não afirmar que leu tudo. Este trabalho usa código, histórico, testes e publicação comprovados.

## Estado recuperado

Produção encontrada ainda em 491e1415, build 705.28.13-cadastro-duas-cameras, enquanto main continua no histórico de 22/10. Avanços de 30/10 e 02/11 existiam em branches diferentes. A ponta WAR 8d6e253 contém corpo/mão sem objeto, disparo automático opcional, orientação, proteção/recuperação solo e controles compactos. A ponta mundo 32fa6ad contém a otimização de cálculo das rotas de spawn e reverte explicitamente o HUD não aprovado após regressão Android. Sua árvore é idêntica à ponta de tráfego 86f22bc. Não reintroduzir 13be1e9/7eae7cb/36ded96 nem o HUD retirado.

## Integração e reparos

A revisão preserva o WAR de 8d6e253, o mundo já revertido de 32fa6ad e as provas aceitas de d02fc130. Integra o cache local das métricas geométricas de spawn, mantendo posições, direções e frota. Não reduz mapa, veículos, NPCs ou animações. Sem mudanças em Firebase, credenciais, regras, contas ou identidade Android.

Falha reproduzida em navegador na ponta WAR: treino PLAYING, WarPracticeUI undefined, zero botões de treino. O módulo que criava o treino estava dentro de object-training.js, retirado do carregamento junto com o cadastro de brinquedos. Novo practice-controls.js independente restaura CALIBRAR, RECOMEÇAR e TESTAR/PARAR AVANÇO, sem reativar objetos. No toque manual, os botões exclusivos de câmera ficam ocultos. Treino começa parado, não modifica a preferência de movimento das missões e para ao reiniciar. A barra do treino ocupa o lugar do cabeçalho duplicado do próprio treino; retículo, munição, vida e controles continuam presentes. O HUD geral do mundo não é alterado.

CI da revisão de orientação 41514351004 falhava ao ler a mensagem anterior imediatamente depois de desativar o detector corporal. O teste agora espera a mensagem real do DOM e mantém as exigências de continuidade pela mão e diagnóstico corporal indisponível. Não relaxar validade de imagens nem inventar pose para passar no teste.

A entrada pela câmera permanece como foi definida na linha mais recente do outro trabalho: mão direita frontal inicia; tronco permite agachar/girar/passos quando visível, sem impor ombros como barreira. Objetos e câmera traseira não são carregados no WAR. Isso não equivale à implementação experimental de um único modelo que ficou sem publicar nesta conversa anterior: não restaurar código perdido sobre os avanços posteriores.

## Versão e validação

Build 705.28.14-continuacao-unificada, assetVersion 70650, WAR worker v47. Manifesto mundial 111 arquivos, revisão 86031f0cfb054f68. Novo módulo de treino e orientação entram na checagem de integridade e no pacote. Provas atuais: docs/evidence/continuidade-unificada-20261104/release.json.

Local: 351 unitários passaram. O treino nativo passou em controles e câmera, com acertos, reinício, calibração, avanço/parada e três telas. O teste usa sensores explicitamente simulados; não é prova de rastreamento físico Android. Um primeiro teste unitário foi executado antes da regeneração dos metadados e acusou dois artefatos inconsistentes; após a geração coerente, os 351 passaram, sem remover as verificações de integridade.

A origem pública antes da integração foi dpl_FfJVQ941DWnhWaUo6V93DjxSkCjf, READY em otthi-world-campanha-teste.vercel.app. Conferir SHA exato, CI e testes públicos da nova fonte antes de declarar publicado. Trabalho canônico: performance-gravacoes-20261027; produção: world-revisao-20261022. Build python3 games/otthi/tools/build_project.py && python3 tools/package-world-preview.py, saída dist-world. Não mesclar o PR antigo #1 em main para publicar esta revisão.

O arquivo de assinatura Android original continua ausente nos dados disponíveis. Não gerar outra chave/pacote nem alegar APK nativo novo. O conteúdo web/PWA atualiza pelo mesmo domínio, preservando dados. Travamentos no celular, precisão física e multiplayer em dois aparelhos continuam exigindo evidência própria. Não atribuir nota 10/10, equivalência COD ou fluidez Android com base em testes de navegador.

## Aceitação pública e ajuste da verificação final da dança

A fonte 957664b reuniu 8d6e253 + 32fa6ad + d02fc130 sem reintroduzir o HUD rejeitado e passou nos quatro workflows de trabalho: 41830918657 (download), 41830918618 (câmera/mundo), 41830918977 (gameplay) e 41830918764 (cenários). Publicação dpl_5Eqe4HThkpoQwvoR7BSCVb7MLtWB READY no alias habitual. Treino público passou em controles/câmera e três telas; 31 recursos WAR e APK original conferiram por bytes. Atualização pública real passou: revisão 86031f0cfb054f68, worker, no-store, 4321 moedas, Thiago+Luna+Liz e outra sessão preservados. Relatórios brutos estão nesta pasta de provas.

Na repetição em produção, 41832922890 acusou a verificação da dança: 28/28 movimentos, precisão 1.0 e done=true, porém passed ainda undefined. A chart termina no callback de pose; o próximo RAF da academia grava o resultado, fecha a câmera e monta a tela final. O teste lia o snapshot intermediário. Ajuste exclusivo do teste: esperar data-dance-again visível antes de exigir done+passed, >=85%, câmera encerrada e fase seguinte liberada. Nenhuma dessas exigências foi removida. O teste corrigido passou localmente com 28/28. Nenhum arquivo de aplicação é alterado por esse ajuste e não há novo build/worker.

Para a próxima continuação, usar a ponta atual de world-revisao-20261022 como base canônica. performance-gravacoes-20261027 guarda a integração inicial 957664b, anterior à correção exclusiva do teste da dança. Conferir release.json para o resultado final do CI. A fonte de runtime continua com árvore games 46442dcd3ab31fb2c0a57bec2b37a34fc55e6a23.

## Entrega concluída e conferida

O CI final 41835362112 passou na fonte 4d30e90af7261a0cf973bd48ce2cfd91e24b578f: 351 unitários, dança 28/28 com progressão/encerramento de câmera, sete rotas de jogabilidade, família/HQ, mundo, frota e embarque. A correção do teste não alterou nenhum arquivo de aplicação; árvore games permanece 46442dcd3ab31fb2c0a57bec2b37a34fc55e6a23. As verificações da mesma aplicação em produção também passaram em 41832923007 (câmera/mundo), 41832923038 (cenários) e 41832923032 (download). A falha histórica 41832922890 está preservada e explicada nas provas; não apagar nem tratar como aprovação.

O alias público continua READY no deployment dpl_5Eqe4HThkpoQwvoR7BSCVb7MLtWB, aplicação 957664b4912e69417d621af9ff2786193fad5658, build 705.28.14-continuacao-unificada, revisão 86031f0cfb054f68. Não é necessário republicar os arquivos de jogo por uma alteração exclusiva de teste ou de documentação. A ponta mais recente de world-revisao-20261022 inclui o teste corrigido e este registro e é a referência para continuar. Os relatórios públicos brutos comprovam treino em controles/câmera, 31 recursos WAR correspondentes e atualização real preservando 4321 moedas, família Thiago+Luna+Liz e outra sessão.

Próxima revisão deve respeitar os limites já registrados: fluidez e precisão física Android ainda não foram certificadas, o APK original não foi substituído e nenhum progresso real do usuário foi acessado/alterado pelos testes. Pedidos que ficaram somente no texto da conversa externa continuam sem conferência por falta de acesso à íntegra. Não recomeçar o projeto, não trazer o HUD rejeitado e não usar main antigo como base.

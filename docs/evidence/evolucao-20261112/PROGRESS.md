# Registro de continuidade — 705.28.27

Base 26 preservada: `fed801c71b0466ed6a8072ff9b79bd7ffaabc0a7`, runtime `cbfcb1a`, revisão `60705b1100cc8a14`. Branch `continuation-20261111`; `main` não reúne a evolução anterior. Tag de retorno `baseline-20261112-7052826`. O [relatório integrado](README.md) é a referência desta fase.

Implementado: ordem de filas e recuperação segura, retorno alternativo da van, redução de trabalho repetido de terreno/herói/HUD, Meu caminho com aventuras nativas, WAR frontal e Kart disputa opcionais. Revisão `d4a223e1aa501f02`, 147 arquivos, todos os 143 anteriores mantidos. Firebase e calibrações preservados.

Validação: 470 regressões passaram; sessão integrada com entregas, oficina, garagem, recarga e 12 incidentes com participantes bloqueados passou. Multiplayer local de dois clientes, atualização produção 25→27/offline, dez rotações de viewport, jornada com recompensa, patrulha WAR completa e corrida Kart completa passaram. Comparações preservam resultados mistos e contingências. Consultar os dados antes de repetir o diagnóstico.

Fechamento em curso: sessão ampliada de 60 incidentes, pacote, commit, prévia verificável e publicação no endereço habitual, autorizada pelo pedido final do usuário. Acrescentar identificadores a `release.json` após conferir arquivos públicos. Se o ensaio ampliado falhar, corrigir a causa antes de publicar. A antiga autorização de somente prévia foi ampliada pelo pedido mais recente de entrega publicada.

Pendências reais: medição sustentada em celular, calor/bateria, câmera/ergonomia, instalação/APK e multiplayer entre aparelhos reais. Roteiro em `TESTE_NO_CELULAR.md`. Não declarar fluidez mobile ou ganho uniforme de FPS. Quatro dos 12 incidentes usaram prazo de contingência: não afirmar chegada física universal do socorro.

Para continuar: conferir `release.json`, commit e versão ao vivo. Preservar progresso e evidências. O construtor nativo já restaura `state.vehicles.parked`; não reintroduzir a falsa correção baseada em mock incompleto. Alterações profundas de WAR/Kart continuam opcionais até decisão de produto.

# Registro de continuidade — 705.28.27

Atualização posterior de 13/11/2026: [mãos vazias e tela limpa 705.28.28](../tela-limpa-20261113/PROGRESS.md). Este registro conserva o histórico da 27 e as pendências de socorro; consultar a versão atual antes de editar.

Base 26 preservada: `fed801c71b0466ed6a8072ff9b79bd7ffaabc0a7`, runtime `cbfcb1a`, revisão `60705b1100cc8a14`. Branch `continuation-20261111`; `main` não reúne a evolução anterior. Tag de retorno `baseline-20261112-7052826`. O [relatório integrado](README.md) é a referência desta fase.

Implementado: ordem de filas e recuperação segura, retorno alternativo da van, redução de trabalho repetido de terreno/herói/HUD, Meu caminho com aventuras nativas, WAR frontal e Kart disputa opcionais. Revisão `d4a223e1aa501f02`, 147 arquivos, todos os 143 anteriores mantidos. Firebase e calibrações preservados.

Validação: 470 regressões passaram; sessão integrada com entregas, oficina, garagem, recarga e 12 incidentes com participantes bloqueados passou. Multiplayer local de dois clientes, atualização produção 25→27/offline, dez rotações de viewport, jornada com recompensa, patrulha WAR completa e corrida Kart completa passaram. Comparações preservam resultados mistos e contingências. Consultar os dados antes de repetir o diagnóstico.

Entrega publicada: build `705.28.27-evolucao-integrada`, revisão `d4a223e1aa501f02`, commit de aplicação `be11c3ac22f70c6ae726c9edb24d34049cad0a52`. Produção `dpl_Ef2T1Lh5EpgBSfL8aHG43njK3oeN` no endereço habitual. Conferidos 168 arquivos, dois atalhos, abertura nativa, voo, câmeras, rotação, mapa e retorno ao mundo. Identificadores, evidências, limitações e opção de rollback em `release.json`. Documentação/testes posteriores não mudam o runtime publicado.

Sessão ampliada: 60 incidentes/65 etapas passaram; 22,78 min de simulação nativa com desenho limitado, 359,202 s de parede; contagens de recursos estáveis, heap retido +139.152 bytes após GC. No estresse imediato, 59/60 atendimentos recorreram ao prazo de contingência: conclusão/liberação é comprovada; despacho físico universal continua pendente.

Pendências reais: medição sustentada em celular, calor/bateria, câmera/ergonomia, instalação/APK e multiplayer entre aparelhos reais. Roteiro em `TESTE_NO_CELULAR.md`. Não declarar fluidez mobile ou ganho uniforme de FPS. Quatro dos 12 incidentes e 59 dos 60 na sequência ampliada usaram prazo de contingência. Isso é uma limitação de atendimento físico, sem crescimento das contagens de recursos ou participantes permanentemente presos. Não considerar despacho físico universal concluído.

Para continuar: conferir `release.json`, commit e versão ao vivo. Preservar progresso e evidências. O construtor nativo já restaura `state.vehicles.parked`; não reintroduzir a falsa correção baseada em mock incompleto. Alterações profundas de WAR/Kart continuam opcionais até decisão de produto.

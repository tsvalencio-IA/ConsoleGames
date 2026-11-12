# Limpeza de ocorrências e abordagens — 11/11/2026

A versão 705.28.25 removia os grupos visuais das ocorrências encerradas, mas mantinha seus contornos no registro visual e não liberava as geometrias exclusivas de fogo e sinalização. As ações de ocorrências antigas também conservavam referências ao atendimento. Os policiais que terminavam uma abordagem deixavam contornos registrados.

A correção usa a rotina existente `disposeDetachedVisual`, que preserva geometrias e materiais compartilhados. A ação é retirada quando termina a limpeza da ocorrência; o atendimento, os veículos e as missões seguem o fluxo existente.

Comparação no mesmo navegador, com a aplicação da referência `6258e61` e alteração apenas das duas funções de limpeza do módulo de emergências:

| Após os mesmos ciclos | Antes | Depois |
|---|---:|---:|
| Contornos retidos por 12 ocorrências com fogo | 108 | 0 |
| Ações retidas de ocorrências encerradas | 12 | 0 |
| Geometrias exclusivas liberadas, de 36 criadas | 0 | 36 |
| Geometrias no renderizador isolado após a 12ª ocorrência | 42 | 6 compartilhadas |
| Contornos retidos por 12 abordagens encerradas | 96 | 0 |
| Erros de página | 0 | 0 |

Os testes de regressão com o Three.js nativo também executam 20 ciclos de ocorrência e 20 de abordagem, verificando a preservação de um objeto de cenário que compartilha geometria e material com a sinalização. Os 26 testes focados de emergência, trânsito e orçamento de quadros passaram.

Foi reproduzido ainda o mesmo acúmulo nos motoristas do celular, criados pelo modelo de policial: 20 ciclos nativos de `phoneMakeDriver`/`phoneRemoveDriver` deixavam 160 contornos registrados. A remoção agora usa a mesma rotina segura de limpeza. O teste estendido confirma **160 → 0** contornos retidos, os **80 materiais de roupa clonados liberados exatamente uma vez**, e nenhuma liberação da geometria ou do material compartilhado pelo cenário. Os três testes de ciclo de vida passaram; `phone-driver-before.txt` conserva a falha anterior e `phone-driver-after.txt` o resultado corrigido. Esta verificação adicional usa Three.js em Node, sem navegador ou renderização GPU.

Reprodução: `tests/emergency-visual-lifecycle.test.mjs` e `tests/emergency-visual-lifecycle-browser.mjs`. Os resultados completos estão em `before.json`, `after.json` e `result.json`.

Limites: Chromium com WebGL por software, perfil descartável e Firebase local isolado. O teste repete o ciclo de vida das ocorrências sem esperar intervalos reais entre acidentes. O renderizador isolado desenha os objetos nativos do atendimento e mede sua liberação; sua contagem não corresponde à memória total do mundo. Não mede FPS, consumo ou temperatura de celular físico, nem comprova diversão ou ergonomia de câmera.

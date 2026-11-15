# Câmera — investigação da travada de ângulo

Base preservada: runtime705.28.28 `2e3f1be286e74c0f998b81d7ba2a01147afc82a1`. Nenhum arquivo de produto alterado até este ponto. Teste novo `tests/world-camera-angle-profile.mjs` faz varredura estacionária com mundo completo/mesma qualidade, sem simulação concorrente para isolar desenho dependente do ângulo. Clock não acelerado; desenho nativo só nos ângulos amostrados. Não representa FPS de partida nem aparelho físico.

Hipótese confirmada em teste funcional pequeno: módulo71 usa buckets de lâmpadas0/16/24/32…, mas precompileWorldLighting prepara só o bucket inicial e zero. Duas populações de10 e20 lâmpadas produzem preparação[16,0] e giro para24 ainda frio. Falta correlacionar com população real do mundo e chamadas compileShader/linkProgram.

Sondagem real em andamento em `test-results/world-camera-angle-scan-before/result.json`, log `/workspace/work/camera-angle-scan-before.log`. Qualidade balanced fixa,393×852, posições casa/cruzamento/centro/orla e3 pitches×8 yaws. Captura count de lâmpadas, programas, calls/triangles e primeira/repetição de desenho. Os tempos desta sondagem não serão usados como comparação sob carga concorrente.

Alvos alternativos: matrizes de milhares de contornos no updateManagedOutlineVisibility e grande amplitude do desenho olhando o horizonte. Não reduzir mundo, quantidade de luzes ou funções para obter números. Só decidir correção após dados. A comparação temporal final precisa ser agendada pela raiz em janela isolada antes/depois.

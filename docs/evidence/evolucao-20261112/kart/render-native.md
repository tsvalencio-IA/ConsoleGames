# Renderizador do Kart: comparação de pixels e trabalho

A otimização projeta cada rival uma vez por desenho e o coloca na faixa de segmento correspondente. O método anterior repetia os mesmos cálculos em todos os 180 ou 300 segmentos. Nenhum rival, segmento, sprite ou efeito foi retirado; a ordem original de pintura de rivais dentro do segmento foi conservada.

`tests/fixtures/kart-render-world-before.txt` preserva o método anterior. O ensaio carrega duas cópias do motor nativo em um Chromium, substituindo somente esse método em uma delas. A preparação de menu/áudio é isolada; as funções de desenho executam Canvas2D real. O teste não depende da presença de um commit histórico em um checkout raso.

Passaram **48 comparações**, com quatro rivais nativos ou 24 rivais de estresse, três pistas, duas qualidades, vistas dianteira/traseira e duas posições/voltas. Nenhum canal RGBA diferiu. `render-native-comparison.png` mostra a referência e a candidata; `render-native-result.json` contém todas as contagens e os tempos.

Com quatro rivais, a qualidade alta passou de **2.400 leituras de posição/volta por desenho para oito**; na baixa, de 1.440 para oito. O estresse de 24 rivais passou de 14.400 para 48 na alta. Isso mede o trabalho eliminado, sem reduzir o conteúdo desenhado.

A amostra de throughput desenha o mundo completo e força uma leitura dos pixels a cada desenho, alternando a ordem da referência e da candidata. Na execução registrada com quatro rivais, a média foi 6,45 ms → 5,43 ms e a mediana 6,46 ms → 6,21 ms. O runner de três CPUs também executava verificações funcionais; esses valores são amostras do método, sujeitas a ruído. Não representam cadência RAF, uma partida completa, FPS de telefone, aquecimento ou ganho garantido em aparelho físico. O teste não exige um ganho de tempo para passar: exige pixels iguais e a eliminação determinística do trabalho repetido.

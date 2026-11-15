# Disputa no Kart nativo

Entrada `arcade/previews/kart-native-20261112.html` ou `games/kart/?kart_eval=disputa`. Escolha prática solo e corrida. Motor, quatro rivais, física, itens e três voltas existentes. Largada de perseguição e objetivos: duas ultrapassagens limpas, impulso de drift e pódio. Referência de voltas e resumo no resultado.

Posição inicial não dá crédito; contato recente/sair da pista invalidam passagem; mesmo rival não rende crédito repetido na mesma volta. Recompensas/progresso originais; padrão, online, multiplayer e calibração preservados.

`native-race.json`: corrida completa pela interface/controles nativos, sem forçar posição ou vitória. Três ultrapassagens limpas, um drift, 38 usos de itens, zero contatos, 1º lugar. Recompensa aplicada uma vez e conservada após recarga. `complete-native-race.png` mostra resultado real. Quatro testes focados verificam classificação, contato, modo e ciclo completo.

Passos de física acelerados e desenho interrompido entre lotes: comprova percurso/objetivos, **não FPS, câmera física, equilíbrio humano ou diversão aprovada**. A experiência concreta fica disponível para avaliação sem substituir o padrão.

Renderização agrupa rivais por segmento. [48 comparações](render-native.md) produziram canais RGBA idênticos sem retirar pista, rival ou efeito.

# Recuperação do trânsito

Mesma cena determinística de 180 s com 44 modelos e 138 NPCs. `before.json`/`after.json` contêm a simulação nativa; `*-progress.json` acumulam deslocamento entre amostras de 10 s, sem alegar comprimento exato do trajeto.

| Ônibus | Deslocamento entre 60–180s antes | Depois |
| --- | ---: | ---: |
| Verde1 | 0m | 45,08m |
| Escolar1 | 0,26m | 127,19m |
| Circular1 | 0,43m | 83,97m |
| Turismo1 | 0m | 139,96m |

Filas longas no fim 29→28; contatos 2→1. Alguns veículos progrediram menos: não se demonstra ganho agregado amplo ou eliminação de congestionamentos. O resultado concreto é recuperar os bloqueios acima sem remover/teleportar participantes.

`priority-before.txt` reproduz ordem circular na função nativa por causa do empate aproximado de 80 ms; `priority-after.txt` verifica ordem estrita. Uma cena física artificial de três carros não reproduziu paralisação; não é usada como prova. Regressões também verificam envelhecimento durante tentativas devolvidas pela colisão e recuo somente livre/na via.

Relógio controlado, desenho limitado, Chromium por software, RTDB local. Mede decisões de trânsito, não FPS.

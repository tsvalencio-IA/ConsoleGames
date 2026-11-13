# Desempenho: método e limites

Linux gerenciado, Chromium 141.0.7390.37 e WebGL por software. Base26 `fed801c` contra27. Ensaios finais de 20 s sequenciais, sem outros testes simultâneos na coleta; não é telefone.

## RAF/desenho nativos

Mesmos 44 modelos, 138 NPCs, quatro familiares, qualidade baixa/automática, buffer172×374, DPR0,44 e RTDB local. Sem limitar desenho ou avançar manualmente o relógio.

| Medida | Antes | Depois |
| --- | ---: | ---: |
| Trabalho médio do loop | 55,80ms | 50,72ms |
| p95 do trabalho | 92,9ms | 84,3ms |
| Desenho médio | 22,20ms | 22,08ms |
| Intervalo médio entre quadros | 281,49ms | 283,13ms |
| p95 entre quadros | 531,5ms | 744,6ms |

Menos trabalho no loop, **sem melhora comprovada na cadência de quadros**. O p95 dos intervalos piorou nesta amostra. `native-before.json`, `native-after.json` e `native-result.json` preservam amostras/configuração. Não extrapolar para FPS, calor, bateria ou toque no aparelho.

## CPU: 40 passos por cenário, desenhos limitados

| Cenário | Antes | Depois |
| --- | ---: | ---: |
| Cidade/família | 150,6ms | 189,8ms |
| Praia/família | 196,2ms | 142,5ms |
| Helicóptero/família | 173,8ms | 198,1ms |

Resultados mistos; sem melhoria uniforme. Dados em `cpu-before.json`/`cpu-after.json`. Regressões verificam trabalho removido diretamente:2000 consultas estáticas deixam de recalcular lote, HUD estável evita escritas, leituras prontas do herói conservam contêineres de veículos/configurações. Conteúdo e comportamento preservados.

No Kart, [48 casos de pixels](../kart/render-native.md) conservam o desenho com menos leituras de rivais. Tempos Canvas foram coletados sob carga concorrente, não certificam FPS de corrida.

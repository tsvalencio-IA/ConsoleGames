# Evidências da revisão experimental

Código final: `8554d2a9204abc5e8be2244d61a533281155de8f`. [Relatório completo](../../world-revisao-20261023.md).

- `autodromo-largada.png`, `autodromo-chegada.png` e `corrida-final.log`: execução local do código final, três voltas completas com asfalto realmente desenhado.
- `mapa-publicado.png`, `carro-nova-aurora.png` e os JSON das cidades: deployment final público.
- `combate-camera-oculta.png` e `camera-publicada.json`: deployment inicial `c12114c`, mesmo controlador da mão; inferência real sobre uma imagem conhecida, sem Android físico.
- `danca-resultado.png`: 32 notas e pausa na atividade local; registros anteriores à correção final de visibilidade do asfalto.
- `combate-manual.json` e log: partidas locais por toques reais; helicóptero e modo a pé com seis alvos cada.
- `testes-unitarios.log`: 169 testes aprovados no código final.
- `integridade-publicada.json`: 27 SHA-256 conferidos no deployment final e worker compartilhado HTTP 200.

As capturas preservam a renderização original, com qualidade baixa usada pelo cenário automatizado. Não são arte conceitual ou prova de FPS de um aparelho. A partida e o trânsito são reais, mas a preparação de posição e a conta usada pelo teste são fixtures locais. Os avisos de Firebase bloqueado nos JSON correspondem ao isolamento do serviço externo durante QA.

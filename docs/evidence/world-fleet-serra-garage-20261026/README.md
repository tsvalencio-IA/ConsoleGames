# Frota, cordilheira e garagem — validação de 26/10/2026

Build `705.26.5-frota-serra-garagem`, revisão `f786b7c40346846b`.
Mantém o esquema de progresso 705 e os sete jogos originais.

## Comportamentos implementados

- Cada aeronave possui identidade e estado próprios. A decolagem inicia uma reposição de 180 segundos; a unidade ocupada não é substituída. Uma base ainda fisicamente ocupada aguarda a liberação do ponto.
- O aeroporto oferece quatro helicópteros, quatro aviões (incluindo OT Vias) e um balão. Pousos em solo firme, livre e suficientemente plano são possíveis fora do aeroporto.
- Aeronaves estacionadas bloqueiam o trânsito. Após o piloto se afastar, a equipe OT Vias faz a retirada visível, com técnico, cabo, transporte e depósito num pátio livre.
- Um NPC embarca no balão abandonado e o pilota; há três outros balões cênicos em circulação.
- Mapa e cancelamento de rota acessíveis durante voo, com layouts separados para retrato e paisagem no celular.
- Área de 3.060.000 unidades quadradas, seis novas vias conectadas, terreno montanhoso físico e cordilheira com neve. As vias antigas permanecem.
- Compra com entrega na própria concessionária, entrada no veículo, ignição e saída pelo mundo. Unidades repetidas têm identidades independentes, inclusive após união de progresso entre aparelhos.
- Garagem física junto à casa, pisos para todos os veículos estacionados, circulação a pé, entrada nos veículos e saída dirigindo. Preserva família, personalização, danos e os modelos originais de Fusca e Ferrari.
- Dança por câmera com passos e braços combinados, sequências de oito tempos e música instrumental original. Sem pontuação por ficar parado.
- Carrocerias procedurais de Palio e T-Cross fechadas, corrigindo lacunas visíveis entre laterais, traseira e lanternas.
- Resposta policial mais rápida e reinício de corrida de kart limpando o estado anterior de direção.

## Evidências reproduzíveis

`node --test tests/*.test.mjs`: **258 aprovados, zero falhas**.

Os relatórios anexos resultam do jogo nativo em Chromium/WebGL, com progresso descartável e serviços externos bloqueados:

| Relatório | Verificação |
| --- | --- |
| `world-fleet-garage.json` | Reposição exata, mapa em três dimensões de tela, pouso na rua, obstrução e retirada OT Vias, piloto NPC de balão, compra, ignição, unidades repetidas, garagem e estradas/terreno |
| `air-fleet-multiplayer.json` | Dois clientes locais, aeronaves distintas, replicação de estacionamento e troca de autoridade preservando o prazo |
| `world-airport.json` | Nove aeronaves, embarque com família, estacionamento e recarga do progresso |
| `city-coast.json` | Continuidade das ruas, compras nativas, trânsito, movimento de cidadãos e preservação da família/Fusca |
| `world-body-dance.json` | Coreografia por corpo, 32/32 repetições, perda de rastreio pausando a música, pausa, câmera frontal e limpeza dos fluxos |

O fluxo dos sete jogos originais também foi exercitado em `tests/playable-smoke.mjs`, incluindo corrida real de três voltas.
O CI inclui o novo percurso de frota/garagem/serra e preserva os trabalhos anteriores de câmera, mundo e jogabilidade.

## Limites da certificação

- O teste com dois clientes usa o código nativo de frota e um retransmissor local isolado. Não certifica duas conexões físicas Android em salas Firebase de produção.
- Câmera física, desempenho e som nos aparelhos dos usuários ainda exigem avaliação em dispositivos reais. Não foi alterada a segurança do Firebase.
- Os veículos procedurais permanecem estilizados; esta entrega não significa fidelidade fotográfica de todos os modelos brasileiros.
- A música de dança é original. Não são gravações licenciadas do FitDance.
- O APK continua sendo o invólucro Android assinado já existente, que abre o jogo atualizado; não foi apresentado como um novo binário nativo.
- O relatório `public-validation.json` registra o teste público pós-publicação, associado ao SHA exato `228b9e98e988e90ddea88a30206ebf117d3b4337` e à revisão `f786b7c40346846b`. Passaram os 73 arquivos protegidos e oito arquivos de WAR, embarques, cinco rotas GPS, neve, compra nativa, família/Fusca, ondas, os modelos reais de corpo/mão em CPU, controle pelo service worker, instalabilidade e os bytes/SHA-256 do APK existente.

## Publicação verificada em 27/10/2026 UTC

- Produção: https://otthi-world-campanha-teste.vercel.app/games/otthi/
- Instalação: https://otthi-world-campanha-teste.vercel.app/arcade/instalar/
- Deployment `dpl_GNEb3ryZj2rFfAZHPSuWuozxVDEy`, estado `READY`, origem fixada no commit acima.
- `family-world-report.json` confirma também a seleção jogável Thiago/Thamis, grupos completos/individuais/subconjuntos, recarga do progresso, presença recebida, brinquedo e retorno dos cães, condução e o HQ original, sem erros de página.
- `validation-summary.json` reúne as referências de execução; os relatórios preservam as limitações de câmera física e rede móvel real.
- `ci-validation.json`: **três workflows e seis trabalhos concluídos com sucesso** no commit publicado. Incluem os 258 testes, jogos originais, dança por corpo/inferência real, família/HQ, tráfego/comércio, embarques, frota compartilhada/garagem/serra, câmera frontal e volante pelas mãos nos dois autódromos.

Execuções: [Gameplay](https://github.com/tsvalencio-IA/ConsoleGames/actions/runs/40423812366), [câmera frontal e modos](https://github.com/tsvalencio-IA/ConsoleGames/actions/runs/40423812554), [volante nos autódromos](https://github.com/tsvalencio-IA/ConsoleGames/actions/runs/40423812313).

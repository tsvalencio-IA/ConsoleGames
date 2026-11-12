# Continuidade do ConsoleGames — 11–12/11/2026

Candidata **705.28.26-estabilidade-oficina**, revisão `60705b1100cc8a14`, runtime `cbfcb1af2a29fc26f084a9e3f82dd63663f71f7a`. [Experimentar o console](https://otthi-world-campanha-teste-r4f7ol3ct-thiaguinho-s-projects.vercel.app/arcade/) · [Mundo aberto](https://otthi-world-campanha-teste-r4f7ol3ct-thiaguinho-s-projects.vercel.app/games/otthi/) · [Proposta de controles WAR](https://otthi-world-campanha-teste-r4f7ol3ct-thiaguinho-s-projects.vercel.app/arcade/previews/war-controls-20261111.html).

A prévia está READY no projeto existente; 164/164 arquivos foram conferidos por SHA-256, com zero divergências. A produção permanece em **705.28.25**, runtime `cdc695f`, deployment `dpl_8u99crzy7sLwM2UkGtJiSwE7SLLa`. A prévia tem outro endereço: o progresso local do endereço principal não é transferido automaticamente entre origens. Nenhuma conta ou regra Firebase foi modificada.

## Base e retorno

A branch `continuation-20261111` parte de `console-evolution-20261106` em `6258e61`, registro documental do mesmo runtime publicado `cdc695f`. `main` estava 270 commits atrás e não foi usada como base. A consulta remota de 12/11 confirmou que a referência indicada não havia avançado. A tag remota `baseline-20261111-6258e61` preserva o ponto de retorno. Não substituir esta árvore por `main` ao continuar.

## O que mudou

- Ocorrências encerradas, policiais e motoristas liberam seus recursos visuais usando a rotina existente, conservando materiais e geometrias compartilhados. Ações de ocorrências antigas também são retiradas do registro.
- O motorista volta a considerar como obstáculo um carro de NPC que retornou para novo serviço na oficina ou foi assumido pelo jogador; antes, um registro histórico de retirada podia fazê-lo ser ignorado para sempre.
- O celular explica que recarregar interrompe o transporte terrestre, conserva o carro e permite novo chamado. Encomendas pagas mantêm a retomada automática e o recebimento único existentes.
- A proposta do WAR é uma página separada, com giro contínuo ou em passos de 45°, mão simulada e objetivo curto. Não modifica os controles reais nem usa a câmera. A decisão de integrar continua com Thiago.

A lista de 143 arquivos do manifesto foi preservada, sem exclusão de arquivos rastreados. Configurações Firebase, contas, regras, multiplayer e motores de Kart, WAR, Avião, Tênis e Dança mantiveram os bytes originais conferidos. Consulte [preservation.json](verificacao/preservation.json).

## Evidência e limites

| Verificação | Resultado e alcance |
|---|---|
| Suíte final | 445 testes passaram, zero falhas; mais 26 testes focados passaram. |
| Compra de carro, recarga e novo chamado | Fluxo nativo passou na revisão final: débito único, unidade única, propriedade e origem preservadas, interrupção explicada, novo chamado e chegada. |
| Ocorrências, mesmos 12 ciclos no navegador | Contornos antigos 108→0; ações 12→0; 36/36 geometrias exclusivas liberadas. Outras 12 abordagens: contornos 96→0. |
| Motoristas, 20 ciclos com Three.js real | Contornos antigos 160→0; 80 materiais próprios liberados uma vez; recursos compartilhados preservados. |
| Celular/encomendas na referência inicial | Desvio físico, rota no mapa, garagem coletiva, compra, recarga, chegada e recebimento único passaram. |
| Layout da referência inicial | Dez mudanças de viewport/orientação, sem botões cobertos ou rolagem lateral. |
| Oficina automática, navegador sem capturas | Seis NPCs reparados e retirados; vaga e trânsito liberados; carro desmontado do jogador e economia preservados após recarga. |
| Atualização da candidata no navegador | Configuração antiga recuperada, service worker atualizado, progresso descartável preservado e reabertura offline coerente. |
| Multiplayer isolado | Dois clientes usaram helicópteros distintos, trocaram autoridade e reutilizaram helicóptero/avião estacionados. Relay local; não é Firebase real nem dois aparelhos físicos. |
| Outros jogos | Dança e música original passaram; Boxe, Tênis e Avião completaram o roteiro. O ensaio isolado de pouso, frenagem e nova decolagem passou. Kart e WAR tiveram timeouts no roteiro completo, registrados sem aprovação. |

A suíte final, os resultados de compra/recarga/novo chamado e a oficina automática estão nos relatórios de [verificacao](verificacao/) e [entregas-oficina](entregas-oficina/). Comparações brutas de recursos: [emergency-lifecycle](emergency-lifecycle/). Publicação e limitação da primeira prévia: [preview](preview/). Revisão de objetivos e diversão dos oito jogos: [jogos.md](jogos.md).

Os ensaios usam perfis descartáveis, simulação de tempo e/ou WebGL por software, conforme cada relatório. Não comprovam FPS sustentado, calor, câmera corporal, fidelidade da raquete, ergonomia ou diversão em celular físico. O player YouTube foi verificado com estados simulados; a tentativa de reprodução real ficou bloqueada pela confiança TLS do Chromium no proxy, portanto áudio real segue pendente. Nenhum APK foi homologado em aparelho nesta sessão.

## Continuação

Priorizar a experimentação desta candidata no aparelho de Thiago e registrar modelo do celular, navegador, cenário e ação que provocam travamento. Concluir partidas completas de Kart/WAR e avaliar rivais, drift, itens, objetivos e controles com um jogador; não tomar a duração das pistas ou testes de duas mãos como aprovação de diversão. Comparar os dois giros da prévia WAR antes de mudar sua mecânica real. Produção ainda não foi promovida; para um lançamento, conferir novamente a candidata e os resultados do aparelho, mantendo o retorno indicado acima.

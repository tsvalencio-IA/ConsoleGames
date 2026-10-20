# ConsoleGames — arquitetura, auditoria e objetivos 10/10

Data: 20/10/2026. Situação: **7 pastas de jogos importadas, com melhorias iniciais e CI**. Não equivale a sete jogos certificados 10/10.

## 1. Arquitetura entregue

```text
ConsoleGames/index.html           -> console único (mesma aba)
ConsoleGames/app.js               -> catálogo de 7 entradas locais
ConsoleGames/games/kart/          -> GAME original + seleção drive + mobile
ConsoleGames/games/boxe/          -> GAME original + seleção box_pro + mobile
ConsoleGames/games/tenis/         -> GAME original + seleção tennis + mobile
ConsoleGames/games/ar/            -> GAME original + seleção ar_truck_sim + mobile
ConsoleGames/games/voo/           -> GAME original + seleção usarmy_flight_sim + mobile
ConsoleGames/games/otthi/         -> OTThi-World3 original completo + mobile
ConsoleGames/games/familia/3d/    -> HQ original 3D completo + mobile
ConsoleGames/enhancements/        -> complementos versionados
ConsoleGames/tools/               -> regras estritas de importação e patch
ConsoleGames/tests/               -> integridade + layout Chromium
```

A cópia preserva os arquivos-base e recursos dos projetos, com as modificações pontuais documentadas. Os repos de origem não foram alterados. Cinco pastas GAME **duplicam recursos do mesmo motor** para ficarem autocontidas: vantagem de isolamento e redução de interdependência; desvantagem de tamanho de download/repo e necessidade de aplicar patches de segurança em todas as cópias. Essa duplicação pode ser consolidada no futuro com auditoria e testes de regressão, mas não foi simplificada sem provas.

**Commits de origem congelados:**
- GAME: `b18e140896fbec438524b47316a9d4f300b8b747`
- OTThi-World3: `d252e98d9de4c1b6d472117a81bf6a5b129d2537`
- hq: `af8803ad31401f82002d4c5d6f9f36a344eee0bb`

Esses hashes estão disponíveis em `games/source-commits.json` para diffs e rollback.

## 2. Dados, autenticação e autorização

| Jogos | Identificação preservada | Persistência |
| --- | --- | --- |
| Kart | `drive` | Firebase GAME, `thiaguinhogame-ac91b` |
| Boxe | `box_pro` | Firebase GAME |
| Tênis | `tennis` | Firebase GAME |
| AR | `ar_truck_sim` | Firebase GAME |
| Voo | `usarmy_flight_sim` | Firebase GAME |
| OTThi World | `otthi-656c5` | Configuração, regras e rotas próprias originais |
| HQ 3D | sem ID Firebase | `localStorage` original |

O console usa a configuração pública OTThi para **ler** `otthosWorld/users/$uid/profile` e `otthosWorld/users/$uid/progress` após autenticação válida; não grava nesse banco. Cada jogo GAME mantém o login e Firebase do próprio sistema original, inclusive permissões e painel original, quando disponível. Não usar uid do GAME como uid do OTThi, nem tentar copiar senhas/tokens.

A implantação das sete pastas **não** publica novas regras de Firebase. Uma auditoria de segurança real precisa avaliar regras, índices, privilégios de admin e autorização efetiva no servidor — **não presumir que a variável `Profile.role` do JavaScript imponha segurança**.

O metajogo mantém somente resultados observados pelo jogo no namespace local `console-games:v2:challenge:<ID>`. Vitórias e placares GAME são considerados quando o motor relata fim de partida; tênis e missões AR têm adaptadores separados. Visitas ao console e favoritos usam outras chaves locais. Esses números **não** são XP, moedas ou resultados oficiais do Firebase.

## 3. Melhorias aplicadas nos arquivos do ConsoleGames

- Core GAME: correção do ID da tela de resultado; sensor/câmera iniciados somente ao escolher uma fase; encerramento das trilhas de câmera ao deixar uma partida; timeout de metadata para evitar bloqueio indefinido.
- Console: sete URLs locais, mesma aba, botão de retorno, biblioteca responsiva, favoritos, progresso diário local.
- Metajogo: desafios diários progressivos na tela de seleção de fases, recorde e vitórias locais; acesso negado não é contornado, mas explicado.
- Kart: redução de textos no meio da corrida, rank/volta/velocidade consolidados em telas pequenas, minimapa em escala menor e resultados que respeitam a largura.
- AR: corrigidas 13 declarações `ctx.font = clamp(...)` inválidas para Canvas e reposicionados indicadores para telefone.
- Outros GAME: CSS móvel aditivo, áreas seguras, menus/controles mais compactos, motor escolhido por pasta.
- OTThi/HQ: CSS responsivo complementar, retorno ao console e consulta a contadores existentes sem escrever dados.

## 4. Verificação executada

- **13 testes Node.js estáticos** em `tests/console.test.mjs` e `tests/games.test.mjs`.
- **Smoke visual Chromium** em quatro viewports: 360×740, 390×844, 667×375 e 1280×800. Valida o console, todas as sete entradas e o overflow horizontal dos elementos da página, com capturas em `console-mobile-smoke` nos artefatos do GitHub Actions.
- No smoke visual, o acesso a **serviços de terceiros é deliberadamente bloqueado**; portanto o teste **não prova** login Firebase, câmera, jogos 3D ativos, partidas completas ou multiplayer.

## 5. Critérios de aceitação 10/10 ainda pendentes

| Jogo | Próxima validação de jogabilidade obrigatória |
| --- | --- |
| Kart | Pilotar no touch, drift/nitro, 3 voltas, colisões, final de corrida, ranking de chegada e mudanças de orientação |
| Boxing Pro | Calibração de mãos/câmera, reconhecimento de golpes, adversário, rounds, nocaute, CPU fraca/forte e vitória/derrota |
| Ping Pong Wii | Arrastar com dedo, física de raquete, 11 pontos e 2 de diferença, IA e modos online entre dois aparelhos |
| AR Ops | Permissão de câmera, sensor/objeto/carga real, missão completa, compras, indicadores e tela de oficinas |
| Aero Strike WAR | Aceleração, câmera, aeronave, fases, retorno do jogo, controles mobile e objetivos de campanha |
| OTThi World | Entrada/saída de bairros, casas, personagem, toque, multiplayer, salvamento offline/online e consumo em celular mediano |
| HQ 3D | 15 estrelas, cinco conquistas, cachorrinhas, corrida dos checkpoints, controles joystick, câmera 3D e saves |

Para cada um ainda são necessários vídeos/capturas em **Android real e iPhone real**, testes completos de missão, controles, FPS, uso de memória, consumo de rede, sessões Firebase, modo desconectado e regressão. O fato de um card abrir ou passar em teste Chromium **não** comprova que o jogo esteja 10/10.

## 6. Evolução sem regressões

1. Testar cada experiência em um aparelho-alvo e registrar bug real com passos reproduzíveis e screenshot.
2. Corrigir **a pasta do jogo afetado**; evitar CSS ou lógica global que comprometa outras experiências.
3. Verificar ID original, conta/controle de acesso, pontuação, salvamento, câmera, toque e telas pequenas.
4. Executar `node --test tests/*.test.mjs` e o smoke Chromium; testar cada missão em aparelho real.
5. Comparar os resultados com a cópia original usando hashes fixados e permitir rollback do commit específico.
6. Antes de unificar progresso entre os projetos, implementar contrato `gameId`, `playerId`, versão, dados e regras de autorização revisadas; **não** aplicar migração ou gravação sem revisão e backup.

**O importador é inicial e estrito:** ele se recusa a sobrescrever as sete pastas já instaladas. Atualizações futuras exigem comparação de código da fonte e modificação controlada — nunca `rsync --delete` sobre uma versão em produção.

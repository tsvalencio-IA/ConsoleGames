# Plano técnico — console e evolução dos sete jogos

Data do inventário: **20/10/2026**. Fonte: arquivos existentes nos repositórios do proprietário. Não substituir observações por suposições.

## 1. Contrato entre aplicações

O repositório `ConsoleGames` é um **lançador/orquestrador**, e não uma cópia ou reimplementação do motor dos jogos. Cada projeto continua responsável por renderização, sensores, sessão própria, gravação de dados e interfaces internas. O console não insere scripts nos mundos, não usa iframe para jogos que dependem de câmera/WebGL e não intercepta seus service workers.

| Projeto | Entrada | Dados atuais | Técnica |
| --- | --- | --- | --- |
| OTThi-World3 | Página raiz do mundo | Firebase `otthi-656c5` + persistência já existente | Mundo WebGL, PWA; controles/recursos próprios |
| hq | `3d/` | `localStorage` no navegador | Mundo 3D familiar com missões |
| GAME | Página raiz/menu | Firebase `thiaguinhogame-ac91b` | Menu de cinco motores registrados, incluindo câmera/pose e fases |

**GAME:** registros confirmados de `drive` (Kart Legends), `box_pro` (Boxing Pro), `tennis` (Ping Pong Wii), `ar_truck_sim` (AR Ops Premium), `usarmy_flight_sim` (Aero Strike WAR). `js/game_run.js` tem 1 byte; não anunciar corrida extra até implementar e validar. Não confundir com outro repositório chamado `GAME_`.

## 2. Dados e Firebase sem perda

O console usa **o Firebase do OTThi somente para autenticar usuários já existentes e consultar** `otthosWorld/users/$uid/profile` e `otthosWorld/users/$uid/progress`. Ambas as leituras dependem de `auth.uid === $uid` nas regras do projeto original. O console **não escreve** no Realtime Database e **não modifica** as regras de produção. O Login por e-mail/senha só funciona se esse método estiver habilitado para a conta; os dados locais do HQ e o banco separado do GAME não são migrados automaticamente.

Quando for solicitado progresso unificado real, planejar contrato por jogo: `playerId`, `gameId`, `schemaVersion`, `progressPayload`, `updatedAt`, `source`. Fazer mapeamento de identidade explícito com prova de propriedade antes de ler/escrever outras contas. Separar `console/v1/users/$uid` de `otthosWorld`, com regras por proprietário, limites de tamanho, schema validado, migração versionada, backup verificável e rollback. **Nunca reutilizar índices de outro produto nem aumentar as permissões globais do banco.**

A configuração de Firebase para cliente é pública por definição; tokens de serviço, credenciais administrativas e private keys **não** devem ser versionados.

## 3. Critérios de qualidade “10/10” — não confundir meta com validação

Para cada uma das sete experiências, registrar resultados no desktop Chrome e em pelo menos um Android real + um iPhone/iPad real quando o recurso exigir; exigir evidências para:

1. **Inicialização:** páginas publicadas, carregamento real e mensagens úteis quando offline.
2. **Jogabilidade:** todas as fases, missões, objetivos e estados de vitória/derrota testados.
3. **Controles:** teclado, mouse, toque, gestos, orientação e calibração da câmera.
4. **Performance:** FPS, memória, consumo de rede e aquecimento medidos em aparelhos-alvo.
5. **Persistência:** criar, salvar, relogar, reiniciar e continuar sem perda/duplicidade.
6. **Interface:** tamanho, legibilidade, toque, rolagem e várias resoluções sem regressão.
7. **Segurança:** Firebase rules, perfis, autorização, crianças, privilégios e dados privados.
8. **Acessibilidade:** foco, teclado onde aplicável, descrições, contraste e redução de movimento.
9. **Robustez:** recuperar de falha de rede, câmera negada, login inválido e interrupção.
10. **Regressão:** testes automatizados, alterações pequenas, comparação e rollback.

**Um jogo só recebe aprovação 10/10 após atender aos dez itens com provas**, nunca por aparência ou por nota subjetiva.

## 4. Sequência de execução preservando os originais

1. **Base do console (iniciada):** catálogo dos 7, design, favoritos, navegação, autenticação OTThi somente leitura, CI e implantação.
2. **Auditoria por jogo:** reproduzir falhas reais, capturas, desempenho, travamentos e divergências de controle/salvamento. Inventariar fase por fase. Testar em aparelho físico.
3. **Corrigir GAME:** por motor de jogo, garantir registro e acessibilidade a jogadores legítimos; auditar inicialização, câmera/pose, permissionamento e persistência no Firebase do GAME. Investigar `game_run.js` vazio sem inventar recurso.
4. **Corrigir OTThi World:** tratar gargalos 3D, online, sessões, sincronização, proteção infantil e controles móveis, sem alterar o banco silenciosamente.
5. **Corrigir HQ:** testar missões, geometria, checkpoints, saves e versões; preservar controles e personagens.
6. **Integração real opcional:** somente após definir e autorizar contratos de identidade/progresso, adicionar integração bilateral versionada de cada repo sem ruptura das contas anteriores.
7. **Validação final:** conferir cada jogo em produção e comparar funcionalidades antigas/nova versão. Manter histórico Git e rota de reversão.

**Mudanças de projeto de origem exigem acesso de escrita autorizado a cada um.** Publicar o console não altera os jogos nem concede automaticamente autorização de escrita nos repositórios `GAME` e `OTThi-World3`.

## 5. Regras de não regressão

- Não usar um CSS, DOM ou loop de renderização global entre jogos distintos.
- Não misturar bancos `otthi-656c5` e `thiaguinhogame-ac91b` sem migração explícita.
- Não transferir autenticação por senha, tokens ou `localStorage` por URL, iframe ou parâmetro.
- Não tratar favoritos locais como conquistas reais ou progresso sincronizado.
- Não sobrescrever dados ou lógica que não fazem parte da correção solicitada.
- Não declarar links GitHub Pages funcionais antes de verificar deploy e acesso real.
- Não declarar 10/10 sem testes e evidências em navegador/dispositivo.

# OTThi World — GitHub Pages de testes (23/11/2026)

## Regra de preservação
**NÃO PUBLICAR a branch experimental na `main` do repositório original `ConsoleGames`.**
A página principal do console já é utilizada para jogos e PWAs; trocar a fonte
do GitHub Pages ou sobrescrever `main` pode regredir os oito jogos.

A branch-fonte testável é:
`tsvalencio-IA/ConsoleGames:preview/otthi-rio-preto-github-pages-20261123`

Ela foi criada a partir de
`feat/otthi-canva-npcs-shops-20261123`, com as correções de Rio Preto e NPCs
que estavam presentes nessa revisão. Não confunda compilação com aceite visual.

## Publicação recomendada
Use um **repositório adicional e público** chamado:
`tsvalencio-IA/ConsoleGames-Preview`.

A `main` **do repositório de prévia** pode receber um snapshot da branch acima.
A `main` **do ConsoleGames original não muda**.

Os arquivos já preparados aqui para o repositório separado são:

- `tools/build-github-pages-preview.py` — monta o site estático completo,
  preserva os oito jogos, adapta o prefixo `/ConsoleGames/` para
  `/ConsoleGames-Preview/` somente na cópia para publicação.
- `.github/workflows/publish-isolated-pages-preview.yml` — compila, testa,
  prepara o site e faz o deploy por GitHub Actions. **Somente executa quando
  o repositório em execução for exatamente
  `tsvalencio-IA/ConsoleGames-Preview`.**
- `docs/GITHUB_PAGES_PREVIEW_RIO_PRETO_20261123.md` — este roteiro.

## Ativação (quando o novo repositório existir)
1. Criar `ConsoleGames-Preview` na mesma conta do GitHub, sem usar a `main`
   do repositório original como destino da publicação.
2. Copiar a árvore da branch de prévia, mantendo seus arquivos, para a
   `main` **do novo repositório**. Isso pode ser feito pelo Codex, confirmando
   repositório de origem e de destino. Não use `push --force` na origem.
3. No **novo repositório**: Settings → Pages → Build and deployment →
   Source: **GitHub Actions**.
4. Acessar **Actions → GitHub Pages - OTThi isolated preview** e conferir que
   build, verificações e deploy concluíram com sucesso.
5. Endereço esperado (somente após a ação publicar):
   `https://tsvalencio-ia.github.io/ConsoleGames-Preview/games/otthi/?map=rio-preto`
6. Testar também a rota do console:
   `https://tsvalencio-ia.github.io/ConsoleGames-Preview/arcade/`
   e os oito jogos listados abaixo.

## Oito jogos: caminhos que não podem regredir
- `games/otthi/` — OTThi World
- `games/familia/3d/` — Família 3D
- `games/kart/` — Kart
- `games/boxe/` — Boxe
- `games/tenis/` — Ping Pong
- `games/ar/` — WWAR
- `games/voo/` — Avião
- `games/danca/` — Dança

## Atenção aos salvamentos e à autenticação
Mesmo um repositório Pages separado na mesma conta geralmente utiliza a
mesma origem `tsvalencio-ia.github.io` para armazenamento local. O código
de origem também pode continuar apontando para os mesmos serviços Firebase.
**Separar as URLs não garante separar contas, moedas, progresso ou bancos.**

Não testar compras, exclusões, migrações ou qualquer operação destrutiva com
contas reais antes de verificar isolamento de dados. É preferível usar
ambiente ou conta de teste e, para homologação completa, banco Firebase
isolado com as mesmas regras. Não altere as credenciais do console original.

## Critérios para promover à produção
- Link exato, commit, build e screenshot confirmados.
- FPS, travamentos, NPCs, sobreposição de botões e interiores validados.
- Regressão de rotas dos oito jogos aprovada.
- Salvamentos e identidades verificados sem dano aos originais.
- Autorização explícita para promover; nunca fazer merge automático.

Não interpretar a existência deste documento ou da branch como site já
publicado. O endereço de prévia só é real depois de criado o repositório
separado e de a ação de Pages finalizar com sucesso.

# 🎮 thIAguinho GAME CONSOLE

**by thIAguinho Soluções Digitais e Otto MMP Ferri**

Console independente para reunir os jogos dos repositórios **[OTThi-World3](https://github.com/tsvalencio-IA/OTThi-World3)**, **[hq](https://github.com/tsvalencio-IA/hq)** e **[GAME](https://github.com/tsvalencio-IA/GAME)** sem copiar ou substituir os códigos originais.

## O que está implementado

- Biblioteca responsiva de **sete experiências** verificadas nos três repositórios, com busca, filtros e favoritos salvos localmente.
- Abertura dos jogos em novas abas para preservar o contexto original de cada aplicação (controles, câmera, permissões, autenticação e salvamento).
- Identidade visual própria, navegação para computador/celular, acessibilidade básica, ícone, manifesto e PWA do **console**.
- Consulta **somente leitura** do perfil/progresso existente em **Firebase OTThi** (projeto `otthi-656c5`) após autenticação por e-mail/senha **quando o provedor Firebase Authentication estiver habilitado**. A configuração pública foi espelhada do `OTThi-World3/firebase-config.js`.
- Testes estáticos automatizados em GitHub Actions; publicação existente via GitHub Pages a partir de main.

**O console não transfere contas ou progresso entre projetos diferentes, nem cria saldos, moedas, conquistas ou jogos fictícios.** A conta do `GAME` usa outro projeto Firebase (`thiaguinhogame-ac91b`). O `hq` usa armazenamento local. Favoritos do console também são locais.

## Os sete jogos

| Jogo | Projeto de origem | Como abrir |
| --- | --- | --- |
| OTThi World | OTThi-World3 | Página original do mundo |
| Aventuras em Família 3D | hq | Página original do universo 3D |
| Kart Legends | GAME | Pelo menu interno do thIAguinho GAME |
| Boxing Pro | GAME | Pelo menu interno do thIAguinho GAME |
| Ping Pong Wii | GAME | Pelo menu interno do thIAguinho GAME |
| AR Ops Premium | GAME | Pelo menu interno do thIAguinho GAME |
| Aero Strike WAR | GAME | Pelo menu interno do thIAguinho GAME |

Os cinco jogos do `GAME` foram verificados como registros em `js/game_kart.js`, `js/game_box.js`, `js/game_tennis.js`, `js/game_ar.js` e `js/game_flight.js`. Não há suporte confirmado a links diretos por jogo nessa aplicação, por isso os cinco cartões abrem seu menu original. O arquivo `js/game_run.js` tem apenas um byte, **não** foi contabilizado como jogo funcional.

> **Links GitHub Pages:** os endereços seguem o padrão `https://tsvalencio-ia.github.io/NOME-DO-REPOSITORIO/`. O `hq/3d/` está documentado no README de origem. A efetiva disponibilidade pública dos endereços de `GAME` e `OTThi-World3` deve ser confirmada após a ativação/publicação do GitHub Pages de cada projeto. O console oferece também links para os respectivos repositórios.

## Publicar

1. O repositório já utiliza publicação **GitHub Pages a partir do branch** e possui execuções bem-sucedidas de `pages build and deployment`. Não é necessário trocar esse método.
2. Confirme em **ConsoleGames → Settings → Pages** que a fonte é `Deploy from a branch`, branch `main` e pasta `/ (root)`.
3. Abra **Actions** e confira os fluxos independentes **Verificar console** (testes) e **pages build and deployment** (publicação).
4. A URL de publicação é **https://tsvalencio-ia.github.io/ConsoleGames/**. Confirme ambos os fluxos aprovados na revisão atual e teste o endereço num navegador; sucesso de deploy sozinho não prova os jogos internos.

Se ainda não estiverem publicados, habilite as páginas dos outros projetos, em seus respectivos repositórios, sem alterar seu código.

## Executar e testar localmente

O console não precisa de `npm install`. Basta servir o diretório por HTTP(S), por exemplo:

```bash
python3 -m http.server 8080
# http://localhost:8080
node --test tests/console.test.mjs
```

A autenticação Firebase e a instalação PWA dependem dos requisitos de navegador e domínio/HTTPS. O PWA armazena somente os arquivos do console; **não promete funcionamento offline dos jogos de origem**.

## Organização

- `index.html` — interface e navegação.
- `styles.css` — responsividade e identidade visual.
- `app.js` — catálogo, favoritos, abertura e consulta Firebase.
- `firebase-config.js` — configuração Web pública copiada do OTThi.
- `sw.js`, `manifest.webmanifest`, `icons/` — recursos PWA.
- `tests/` e `.github/workflows/` — verificações e publicação.
- `docs/INTEGRACAO.md` — arquitetura, compatibilidade, segurança e roteiro de qualidade.

## Limites verificáveis da versão 1.0

**Este marco entrega a fundação do console, não uma certificação “10/10” de todos os jogos.** A jogabilidade de cada mundo precisa de testes reais separados, incluindo dispositivos móveis, câmera, controles, partidas e persistência. Nada foi alterado nos códigos dos três jogos nesta entrega.

Ver [plano de integração e qualidade](./docs/INTEGRACAO.md).

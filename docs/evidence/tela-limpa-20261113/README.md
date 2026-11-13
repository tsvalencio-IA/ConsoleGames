# Mãos vazias e tela limpa — 705.28.28

Continuação da produção 705.28.27, preservando os 147 arquivos de release, ferramentas, inventário, progresso, contas e os oito jogos. Publicação e retorno serão registrados em `release.json`.

## Como usar

- **Menu → Mãos vazias:** guarda o objeto e permite passear com as mãos livres. Não vende, descarta ou cobra pelas ferramentas. A escolha continua após recarregar.
- **Menu → Ferramentas:** equipa novamente qualquer ferramenta que o jogador possui. Coletar madeira, minério ou água continua exigindo a ferramenta adequada.
- Câmera, habilidades, MUNDO/GPS e status online ficam no Menu. Os dois sistemas de poder continuam disponíveis nas habilidades. O Menu tem rolagem interna e botão Fechar.
- Durante o passeio ficam movimento, correr, pular, mapa, próximo objetivo e necessidades. Ação aparece quando existe interação ou inimigo próximo; mãos vazias usam o combate nativo como soco. Veículos, esportes e construção conservam seus comandos contextuais.
- **Menu → Mostrar todos os comandos** restaura a apresentação completa. A preferência também é salva. Nenhuma atividade foi retirada.

Perfis novos começam de mãos vazias. A ferramenta já escolhida num perfil antigo é preservada até o jogador guardá-la. Avatares remotos também deixam de exibir a ferramenta, sem reconstruir um machado por engano.

## Comparação na mesma preparação

| Viewport | Botões persistentes na 27 | Na tela limpa 28 |
| --- | ---: | ---: |
| 393×852 | 16 | 5 |
| 852×393 | 10 | 4 |
| 320×568 | 16 | 5 |
| 1280×720 | 11 | 5 |

Contagem de botões reais visíveis durante passeio livre, sem contar o cartão de objetivo e o joystick. Não representa todos os comandos contextuais ou o Menu aberto. A base foi fixada em `be11c3ac22f70c6ae726c9edb24d34049cad0a52`, com a mesma preparação local. [Dados anteriores](before/result.json).

## Validação

- **474 regressões passaram**, incluindo novas verificações de normalização do save, propriedade, coleta e modelo local/remoto sem ferramenta. [Log](unit-474.log).
- Dez mudanças de viewport/orientação sem sobreposição nos critérios medidos, mantendo identidade, família e saldo. O fluxo de teste agora abre MUNDO/GPS pelo Menu e usa o botão Fechar. [Relatório](mobile-layout.json).
- Atualização da produção 27 para28: worker espera a página segura, configuração antiga é recuperada, perfil preservado e abertura offline coerente. [Relatório](update-27-to-28.json).
- Ensaio nativo completo do novo Menu, ferramentas, poderes, GPS, recargas e controles contextuais em fechamento; dados finais serão acrescentados antes da publicação.

Os testes encontraram e corrigiram três problemas antes da publicação: cabeçalho do Menu encobrindo alvo de foco, linhas antigas fixas causando sobreposição na paisagem e distância do GPS ainda escondida pelo CSS legado. Relatórios iniciais são conservados; não foram tratados como versões aprovadas.

Ambiente: Linux/Chromium, WebGL por software, perfis descartáveis e RTDB local. O ensaio funcional limita desenho e usa posições/relógio de QA para preparar cenários; não mede FPS, aquecimento, latência física ou bateria. A verificação de mouse/teclado usa contexto separado sem emulação de toque. Não houve escrita em conta ou banco de produção. Esta mudança não conclui a pendência anterior de chegada física universal do socorro.

## Continuidade técnica

Fontes: módulos 01/06/28a para `none`,77 para composição e estilos29 para layout. `none` é um ID explícito, evitando o fallback de uma string vazia para machado. A apresentação reorganiza os mesmos elementos e handlers nativos; o modo completo restaura os locais originais. Menus são criados uma vez, e as escritas estáveis usam os helpers existentes.

[Preservação](preservation.json) compara Firebase, regras, conta, saveDB e RTDB com a produção 27. O registro anterior continua em `../evolucao-20261112/`, incluindo suas limitações reais. Consultar primeiro `PROGRESS.md` e `release.json` antes de retomar trabalho.

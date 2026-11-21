# Navegação integrada

A base e os arquivos efetivos dos oito jogos estão em [base.json](base.json). A biblioteca e os retornos devem ficar na origem e na pasta do ambiente em que a sessão começou. O host de teste pode usar a raiz ou uma subpasta.

| Entrada ou retorno | Comportamento verificado pelo roteiro |
| --- | --- |
| Raiz, `console.html` e `/arcade/` | Abrem a mesma biblioteca de oito jogos. |
| Cartões, favoritos e URLs diretas | Abrem as páginas do mesmo ambiente e expõem o retorno ao console. O roteiro registra o hash de um arquivo executado de cada jogo. |
| OTThi pelo catálogo | Abre a entrada de atualização, confere a revisão e segue para o mesmo mundo na mesma origem. |
| Família 3D, WAR e Aero Strike | Os links ao Mundo Aberto preservam os parâmetros de família, terra e voo. |
| Ping Pong no mundo | Abre o documento no quadro de atividade com a pasta do mesmo jogo e retorna pelo botão do mundo. |
| Dança no mundo | Usa o menu de dança dentro do mundo e retorna da mesma atividade. |
| Ginásio de Boxe, Academia de Aviação e os dois kartódromos | Abrem a atividade original em página inteira no perfil móvel e retornam ao mundo pelo botão de retorno. A sessão temporária é consumida no retorno. Boxe e Academia também têm o caminho de quadro no computador. |
| Menu do mundo | Retorna à biblioteca depois da gravação local. |
| Instalação PWA | O manifesto resolve o identificador e o início para o console desse endereço. A biblioteca, o favorito e os links locais permanecem acessíveis em uma recarga sem conexão após instalar o worker. |
| Pausa e carreira dos cinco jogos GAME | Modo separado do roteiro inicia a fase original, abre pausa e carreira e volta ao console. |

O teste preenche um perfil local descartável. As rotas de portal usam o botão AÇÃO da interface após posicionar o personagem na entrada pela ferramenta de teste. O retorno compara moedas, XP, família, veículos, ferramentas e uma chave de armazenamento independente. As fases e as partidas completas têm roteiros próprios. A instalação em Android real e a migração de APKs já instalados precisam de validação em aparelho.

O roteiro está em `tests/console-integrated-navigation-browser.mjs`. Ele pode usar o servidor local interno ou um endereço informado em `OT_ROUTE_BASE`. O modo padrão `all` verifica catálogo, PWA e portais em raiz e em subpasta. As opções `catalog`, `trips`, `embedded` e `pause` isolam cada grupo. `embedded` usa clique em uma janela de computador para testar os portais em quadro. `OT_ROUTE_PORTALS` permite selecionar os IDs dos portais no ensaio. Os resultados ficam em `test-results/console-integrated-navigation/` ou no destino indicado em `OT_ROUTE_OUT`.

O catálogo em subpasta completou as 16 idas e voltas, com oito cartões e oito acessos diretos. Também recarregou o console sem rede. [Resultado Chromium da subpasta](catalogo-subpasta.json)

O ensaio inicial de portais verificou Ping Pong, Dança e Boxe na raiz e na subpasta. O passo seguinte parou porque o roteiro procurou um identificador genérico para a Academia de Aviação. A escolha real da Academia passa pelo modal do hangar. O roteiro agora aciona esse modal e usa a entrada própria de cada kartódromo. [Registro da execução inicial](portais-pingpong-danca-boxe.json)

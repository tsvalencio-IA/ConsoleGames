# Recuperação de cache antigo no celular — 28/10/2026

Fonte: `6a0d480526fc1d6c26ee352a5115a9952d4b4461`.
Build `705.28.5-cache-celular`, assetVersion `70641`, revisão `e75a2ef5d73a4970`.

## O que foi corrigido

O worker mantém um conjunto de arquivos da mesma versão por SHA-256. Isso protege contra mistura de versões, mas uma página antiga podia continuar nesse conjunto enquanto aguardava baixar novamente arquivos inalterados e chegar a um ponto seguro de recarga. O fluxo anterior não oferecia uma entrada independente do worker antigo.

- Nova entrada `/games/atualizar/`, fora do escopo `/games/otthi/`. Lê o manifesto pela rede, instala/ativa o worker do mundo, confirma build e revisão por MessageChannel e verifica o SHA-256 do HTML antes de entrar. Mostra andamento e erro/retentativa, sem apagar armazenamento.
- O console envia a entrada do mundo pela conferência de atualização quando há internet. Sem internet, conserva a entrada direta no mundo em cache. O aplicativo Android entregue já aponta para esse console na mesma origem; nenhum APK novo foi compilado.
- Jogar/Continuar verifica a versão antes de iniciar. Uma versão divergente passa pela recuperação. O menu inicial mostra a build real e oferece “Salvar e atualizar jogo”; o menu de pausa também oferece a ação.
- O instalador do worker reaproveita bytes antigos somente após comparar seu SHA-256 com o manifesto novo. Arquivo modificado ou danificado é baixado novamente. O download de opcionais passou para depois da ativação; conteúdo, mapa e gráficos não foram removidos.
- As páginas de entrada, manifesto, worker, recuperação e entrada do console recebem `no-store` no navegador/CDN. Nenhum `Clear-Site-Data`, limpeza de cookies, `localStorage.clear`, exclusão de IndexedDB ou remoção de caches de outros aplicativos.

## Ensaios locais

`local-recovery.json` e `local-recovery.log` usam um worker antigo intencionalmente preso no cache, inclusive ignorando o parâmetro de consulta do manifesto. Antes da recuperação, o teste confirma que esse worker realmente continua devolvendo a release antiga.

1. Um download crítico novo é corrompido: a atualização falha, exibe retentativa e mantém o cache antigo e os dados.
2. A retentativa pela página externa ao worker abre a versão atual e rejeita uma biblioteca gráfica antiga adulterada. No cenário medido, 67 dos 71 itens obrigatórios foram reaproveitados com SHA-256 conferido.
3. Foram preservados moedas, XP, família selecionada, login local, cookie HttpOnly de teste, outro banco IndexedDB e o cache de outra aplicação.
4. O botão de atualização e a entrada do console completam o fluxo. O console muda para a rota direta do mundo quando fica offline, e o menu do mundo atual abre pelo cache. O worker do console é instalado explicitamente no servidor HTTP localhost do ensaio; em produção ele se registra no HTTPS normal.
5. A tela de falha foi verificada em retrato e paisagem; botões de pelo menos 44 px permanecem dentro da tela. Retornos tardios de progresso não substituem a mensagem de erro.

`worker-upgrade.log` mantém os três cenários anteriores: configuração antiga recuperada, atualização real de worker preservando progresso, início offline depois de atualizar. `unit-tests.log`: sete verificações de integridade, momento seguro, reutilização de SHA e conferência antes de jogar aprovadas.

## Publicação

Implantação `dpl_4p37LgqubbLrUNgaQ9zd5gqS16h6` READY; fonte e alias confirmados.

- `public-recovery.json`: os oito endpoints conferidos retornam `no-store`, sem `Clear-Site-Data`. Entrada de recuperação pública instalou o worker real e abriu a build/revisão esperadas; família, moedas e outra sessão local de teste preservadas. Entrada automática pelo console HTTPS também aprovada.
- `public-resources.json`: 98 recursos conferidos por SHA-256 e APK existente validado.
- `public-gameplay.json`: mundo público iniciado pelo botão após a conferência de versão; família de quatro no helicóptero, órbita/cabine/acompanhamento, decolagem, rotação, mapa, retorno e orla aprovados sem erros de JavaScript.
- `release.json`: identificação da publicação conferida. Nenhum certificado ou política TLS do aplicativo foi alterado.

O primeiro ensaio de instalação pública de worker foi bloqueado pelo certificado do proxy de testes; `public-test-proxy-certificate.json` registra esse limite de ambiente. Somente o navegador de QA com esse proxy recebeu a flag de certificado necessária para exercer o worker real. A verificação de bytes por SHA-256 permaneceu ativa e o teste foi repetido com sucesso. Isso não equivale a homologação no celular.

## Limites e continuidade

Ensaios reais de navegador, com cache antigo simulado e perfil descartável. O cache físico do celular do Thiago não foi inspecionado, e não houve reinstalação/homologação Android. Para sair de uma página já presa no cache antigo, usar a nova entrada de recuperação ou reabrir o mundo pelo console atualizado; as próximas entradas conectadas fazem a conferência.

A conferência pública inicial identificou que a regra genérica de headers não cobria a página de recuperação; `public-header-initial-failure.json` preserva essa falha. As quatro rotas da recuperação receberam regras explícitas. O salvamento para atualização aguarda a leitura do banco, e o botão no lobby preserva a posição salva, sem substituí-la pela posição inicial do personagem.

A correção anterior do WAR, com corpo e mão calibrados juntos, está preservada e documentada em `../war-body-hand-20261028/`. Não há guerra no mundo infantil. Modelagem, áudio e demais pedidos pendentes continuam registrados na continuação.

Referência de headers: [documentação oficial da Vercel](https://vercel.com/docs/caching/cache-control-headers).

# Integração do ConsoleGames em 20/11/2026

A branch de desenvolvimento parte de `4ce95d1`, que reúne a Academia de Aviação, as missões de voo e a recuperação mais recente. A versão servida no endereço habitual no início do trabalho foi 705.28.30, revisão `72c84d2063641ce2`. O [inventário da base](base.json) registra os oito motores e os seus commits. O checkpoint `6a5660a` guarda o trabalho local anterior à integração.

O catálogo, os retornos dos jogos e os portais resolvem a origem e o prefixo a partir da própria instalação. O console legado volta a `arcade/`. Links de atualizações, instalador, parâmetros de acesso e retornos dos portais têm caminhos próprios. O identificador de instalação web deriva da URL de entrada já usada pelo console. Os caches distinguem o jogo e o caminho da instalação. Os APKs distribuídos anteriormente conservam o endereço gravado no binário.

No Aero Strike, o manche usa a última posição válida durante a foto, o disparo e o turbo, com zona neutra para oscilações pequenas. A calibração de cinco segundos continua disponível. Em uma comparação controlada da pose erguendo uma mão, a base enviou inclinação de −0,85, arfagem de +1,00 e turbo. A correção enviou zero nos dois eixos e manteve o turbo desligado. O [ensaio de navegador](aero-reporter.json) registrou três fotos, miniaturas, pouso e um único registro de carreira. [Captura](aero-capture.png)

Na neve, cinco prédios foram reposicionados para liberar a estrada e os chalés. A auditoria manteve os 13 prédios decorativos. Nos três trechos de montanha, 4.905 amostras encontraram asfalto acima do terreno. A descontinuidade reproduzida de 1,45 m caiu para 0,00039 m no ponto medido.

O botão da foto acompanha o painel do balão e responde ao toque e à tecla F. O [ensaio de navegador](balloon.json) cumpriu a missão normal em perfil descartável, verificou quatro tamanhos de tela e recarregou com as 200 moedas da recompensa e um único recibo. [Captura](balloon-in-flight.png)

Os ensaios das duas missões usaram posições de aproximação preparadas e controle do tempo. O Aero Strike usou poses e vídeo simulados. Iluminação real, diferentes alturas com câmera física, resposta em celulares de entrada, multiplayer com aparelhos físicos e instalação de APK precisam de verificação em hardware. A comparação final de tempo de entrada em celular também continua pendente.

A produção fica na versão registrada no início deste trabalho. O resultado desta branch é destinado à prévia.

A prévia 705.28.31 está disponível. [Console](https://otthi-world-campanha-teste-eou0v4wsg-thiaguinho-s-projects.vercel.app/arcade/) · [Mundo Aberto](https://otthi-world-campanha-teste-eou0v4wsg-thiaguinho-s-projects.vercel.app/games/atualizar/) · [Aero Strike WAR](https://otthi-world-campanha-teste-eou0v4wsg-thiaguinho-s-projects.vercel.app/games/voo/).

A suíte local aprovou 579 testes. A auditoria HTTPS conferiu 180 arquivos, e oito rotas públicas responderam no endereço esperado, incluindo favoritos antigos com barra final e parâmetros. O manifesto do Mundo Aberto contém 175 recursos. [Registro da prévia](preview.json) · [Testes automatizados](unit.log) · [Hashes](preview-https.json) · [Rotas antigas](preview-aliases.json)

O Chromium verificou cache antigo do console, a migração do Mundo Aberto com recarga offline, a atualização do WAR após o fim da partida e os identificadores de instalação em duas pastas da mesma origem. O instalador oferece o APK somente no endereço esperado pelo binário. O ensaio de download confirmou os bytes do pacote em retrato, paisagem e computador. [Console](arcade-worker-migration.json) · [Mundo](world-worker-migration.json) · [WAR](war-worker-migration.json) · [Isolamento](cache-mount-isolation.json) · [Instalador](android-browser.json)


Na prévia hospedada, os oito cartões e os oito acessos diretos abriram o arquivo do jogo da revisão esperada e voltaram ao mesmo console. O navegador conferiu um favorito e a biblioteca offline. Nos cinco jogos com tela de fases, também abriu a pausa, a carreira e o retorno. O catálogo local passou novamente sob a subpasta `/preview-build/`. [Catálogo hospedado](preview-catalog.json) · [Catálogo em subpasta](catalogo-subpasta.json) · [Pausa e carreira](preview-pause.json)

A auditoria de links legados hospedados cobriu 12 endereços, preservando a consulta e a origem. O instalador hospedado ofereceu a entrada web da própria prévia. [Links](preview-aliases-full.json) · [Instalador hospedado](preview-installer.json)

A automação Android chegou a compilar e instalar os APKs no emulador API 35. A verificação de abertura antiga esperava sete cartões e foi ajustada para os oito atuais. Os ensaios Chromium de entrada solo, troca de conta e retorno passaram nas cinco campanhas após corrigir a espera pelo fim do carregamento. O teste de navegação antigo também passou após corrigir a leitura da URL do Playwright. A nova execução de instrumentação Android e os ensaios completos de toque do WAR e câmera do Kart ficam identificados pelos resultados do CI da branch. [Primeira homologação integrada](https://github.com/tsvalencio-IA/ConsoleGames/actions/runs/44886425310) · [Download Android em CI](https://github.com/tsvalencio-IA/ConsoleGames/actions/runs/44886515311) · [Entrada solo](solo-entry.json)

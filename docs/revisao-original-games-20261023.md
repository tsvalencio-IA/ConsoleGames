# Revisão dos jogos originais — 23/10/2026

Base: `5e5fb8e7083c2e41b8e3fa5972bd1a21d3f81aa2`, no repositório ConsoleGames. Código preparado na revisão experimental `world-revisao-20261022`; sem alterações em `main` ou nos repositórios de origem.

Esta revisão responde às regressões de jogabilidade e integração. Não representa uma nota 9,5/10 nem uma porcentagem de equivalência com COD, simuladores comerciais, The Sims, GTA ou Second Life.

## Mudanças

- Os dois autódromos abrem o Kart Legends original, com retorno à posição de entrada e preservação da família e do progresso do mundo. A página mantém a escolha entre solo local e a autenticação original para jogar online; nenhuma conta é simulada.
- A academia de dança passa para um lote próprio, ao sul da casa da família. A casa e o jardim ficam reservados no layout, protegendo as rotas de Luna e Liz.
- A academia de luta passa para um lote próprio ao sul da oficina. A área do pátio é uma área protegida do layout, e a reorganização de veículos respeita os carros em atendimento.
- Há acesso ao console pelo menu Vida dentro do mundo. A saída salva a posição; os sete jogos mantêm seus motores e seus bancos originais.
- O empacotamento da Vercel corrige `id`, `start_url` e `scope` da instalação do console. O manifesto de origem do GitHub Pages preserva a identidade existente.
- O áudio é iniciado no gesto real do jogador, antes das operações assíncronas de escolha e câmera. Os sete jogos usam um contexto compartilhado por documento; efeitos nativos, motores e preferências são preservados.
- No WAR, recarga, cadência de disparo e deslocamento preservam o tempo real mesmo com renderização a 5/10/30/60 quadros por segundo, com subdivisão física para respeitar colisões.
- O WAR recebe efeitos distintos de arma/recarga/impacto, passos e decisões de avanço, flanco, supressão e cobertura da infantaria, respeitando colisões. O identificador do jogador solo persiste entre entradas, preservando a carreira futura.
- O reconhecimento da mão mantém a proporção do vídeo de celulares em retrato. A GPU pode falhar durante a leitura mesmo após iniciar: há recuperação por CPU. Falhas depois da calibração ficam visíveis, com opção de recalibrar ou usar os controles. A imagem do jogador permanece escondida depois da calibração. Perder a mão interrompe avanço e disparo.
- O painel de corrida reúne posição, volta, velocidade, auxílio e nitro, com um mapa menor e um aviso de cada vez. A carreira e os desafios continuam disponíveis pela pausa.
- O voo recebe indicador de atitude e velocidade vertical, unidades nos instrumentos e indicação de pairar no helicóptero, além de modulação do som do rotor. Os eixos de câmera/joystick continuam cobertos pelos testes de direção.
- Os resultados dos cinco jogos mantêm título e botão de próxima fase acessíveis em retrato e paisagem; em telas baixas, os quatro indicadores ficam na mesma linha.
- A construção verifica a mesma identificação de versão em HTML, módulo principal, configuração e service worker antes de gerar a entrega.

## Evidência disponível

Veja `evidence/original-games-20261023/`.

- Fluxo completo mundo → console → cinco motores originais → família → dois autódromos, com saída e retorno. O áudio foi observado em um analisador do grafo real, inclusive após suspensão e novo toque; a carreira do WAR manteve a identificação solo após recarregar. A pausa continuou acessível e mostrou os três objetivos de carreira de cada jogo.
- 184 testes unitários aprovados na suíte completa; os testes focalizados de kart e interface também passaram após o novo painel.
- Sete cenários de jogabilidade dos cinco motores originais, com entrada solo real e serviços externos isolados: três tamanhos de tela para Kart, boxe, pingue-pongue, WAR e voo. Inclui corrida de três voltas, movimentos reais dos motores e toques simultâneos.
- Reconhecimento real MediaPipe CPU/WASM, com imagem de teste convertida em vídeo local: calibração, prévia escondida, avanço, alinhamento de disparo, parada ao perder a mão e recuperação após falha injetada. Coberto no WAR original e no modo soldado do mundo.
- Entrada de boxe em paisagem e tênis em retrato com toque real no navegador; recuperação de quadro de jogo com falha forçada de navegação; retorno ao mundo preservando os dados.
- Família original com três toques simultâneos, câmera livre, lançamento de brinquedos para Luna/Liz e salvamento após recarregar.
- Atualização com service worker real da versão 705.17.2 para a 705.18.0 e depois para a 705.18.1, preservação do perfil e abertura offline.
- Fluxo completo da família no mundo: Thiago/Thamis jogáveis, todos/sozinho/subconjuntos, salvamento, acompanhantes e presença recebida, lançamento e devolução por Luna e Liz, caminhada, direção e HQ original.
- A academia de dança concluiu 32/32 notas com entrada real e pausa; os ginásios abriram os motores originais. O autódromo entrou no Kart original, recebeu aceleração por toque e retornou à posição salva.
- Resultados nativos e próxima fase dos cinco jogos em três tamanhos móveis (640×360, 852×393 e 393×852), com cabeçalho visível, botão alcançável e sem rolagem lateral.
- Acesso aos dois autódromos e retorno do Kart original preservando posição, família, moedas e XP do mundo.

## Limites de verificação

Os ensaios de navegador usam emulação móvel. Eles não certificam o aparelho físico de Thiago, a precisão com sua mão/iluminação, a saída física de áudio nem partidas online entre dois dispositivos reais. Não houve uso de uma conta real ou alteração de regras Firebase. O reconhecimento funciona no dispositivo, sem envio de imagens para um serviço remoto.

O APK Android `recovery` 1.1.0 (código 2) abre o console desta revisão e requer internet para o carregamento inicial dos jogos. A compilação e o lint passaram; a instalação no Android 15/API 35 e a abertura dos cinco motores foram verificadas com eventos nativos de toque, áudio ativo, disparo no WAR, saída ao console e retrato/paisagem (execução 40005836055). O APK release sem assinatura dessa execução é byte a byte idêntico ao que recebeu a assinatura final; a assinatura V2/V3 foi verificada e mantém o certificado do aplicativo anterior.

Arquivo: `arcade/downloads/thIAguinho-ARCADE-OT.apk`, 57.991 bytes. SHA-256: `8ea2f38c966ee3b938dab2362569ef0224488ab5748c6e9ba1accb0336c0fc49`.

O empacotamento do site oferece esse APK e verifica seu tamanho e hash antes de publicar. A variante `production` e seu APK conservam o endereço anterior. Dados locais de origens ou aplicativos diferentes não são migrados automaticamente.

## Correção da entrega Android pelo link da conversa

A captura enviada pelo usuário mostra `ERR_FAILED` ao abrir diretamente o endereço do APK em uma janela de navegador dentro de outro aplicativo. Na investigação, esse endereço respondeu HTTP 200 com o APK correto, mas com `Content-Disposition: inline`. Isso não reproduz nem explica sozinho a falha no aparelho: o fluxo de abertura pela conversa não havia sido validado.

A entrada pública passa a ser `/arcade/instalar/`, uma página HTML com download por toque, instruções de instalação e uma opção explícita de abrir no Chrome no Android. O botão do console abre essa página. A hospedagem entrega o APK como anexo, tanto no endereço anterior quanto na nova rota `/android/thIAguinho-ARCADE-OT.apk`. Esta rota fica fora do filtro de requisições dos workers antigos do console. O worker v10 deixa a página de instalação e os downloads passarem diretamente ao navegador, evitando substituir uma falha de download pelo HTML do console em cache.

O APK e sua assinatura permanecem idênticos aos verificados anteriormente. O empacotamento preserva o APK e a identidade original do GitHub Pages. O teste de entrega salva o arquivo após o toque/clique e confere nome, tamanho e SHA-256 em retrato, paisagem, desktop, sem JavaScript e com o worker atual e o comportamento do worker anterior. Ele também percorre console → página de instalação. Esses testes usam Chromium com emulação móvel; não certificam a janela específica do ChatGPT no aparelho físico do usuário.

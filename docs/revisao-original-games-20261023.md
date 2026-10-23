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
- O WAR recebe efeitos distintos de arma/recarga/impacto, passos e decisões de avanço, flanco, supressão e cobertura da infantaria, respeitando colisões. O identificador do jogador solo persiste entre entradas, preservando a carreira futura.
- O reconhecimento da mão mantém a proporção do vídeo de celulares em retrato. A GPU pode falhar durante a leitura mesmo após iniciar: há recuperação por CPU. Falhas depois da calibração ficam visíveis, com opção de recalibrar ou usar os controles. A imagem do jogador permanece escondida depois da calibração. Perder a mão interrompe avanço e disparo.
- O painel de corrida reúne posição, volta, velocidade, auxílio e nitro, com um mapa menor e um aviso de cada vez. A carreira e os desafios continuam disponíveis pela pausa.
- O voo recebe indicador de atitude e velocidade vertical, unidades nos instrumentos e indicação de pairar no helicóptero, além de modulação do som do rotor. Os eixos de câmera/joystick continuam cobertos pelos testes de direção.
- Os resultados dos cinco jogos mantêm título e botão de próxima fase acessíveis em retrato e paisagem; em telas baixas, os quatro indicadores ficam na mesma linha.
- A construção verifica a mesma identificação de versão em HTML, módulo principal, configuração e service worker antes de gerar a entrega.

## Evidência disponível

Veja `evidence/original-games-20261023/`.

- Fluxo completo mundo → console → cinco motores originais → família → dois autódromos, com saída e retorno. O áudio foi observado em um analisador do grafo real, inclusive após suspensão e novo toque; a carreira do WAR manteve a identificação solo após recarregar. A pausa continuou acessível e mostrou os três objetivos de carreira de cada jogo.
- 183 testes unitários aprovados na suíte completa; os testes focalizados de kart e interface também passaram após o novo painel.
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

A variante Android `recovery` está preparada para abrir a mesma origem desta revisão; compilação, instalação e assinatura devem ser registradas antes de apresentar um novo APK como disponível. A variante `production` conserva o endereço anterior. Dados locais de origens ou aplicativos diferentes não são migrados automaticamente.

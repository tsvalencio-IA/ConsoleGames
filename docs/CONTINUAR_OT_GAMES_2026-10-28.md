# Continuação — OT Games / ConsoleGames

Copie este arquivo para o próximo chat. Se não houver acesso ao código ou ao repositório, o chat precisa dizer isso; não pode afirmar que corrigiu, testou ou publicou algo sem executar. Não recriar os jogos nem remover recursos para simplificar.

## Estado atual

- Repositório: https://github.com/tsvalencio-IA/ConsoleGames
- Código em produção: `6a0d480526fc1d6c26ee352a5115a9952d4b4461`, branch `world-revisao-20261022`.
- Trabalho e evidências: branch `performance-gravacoes-20261027`; consultar sua ponta mais recente. Os commits posteriores de evidência não alteram o jogo publicado.
- Build `705.28.5-cache-celular`, assetVersion `70641`, revisão `e75a2ef5d73a4970`.
- Vercel `dpl_4p37LgqubbLrUNgaQ9zd5gqS16h6`, READY; fonte, alias e conferência pública aprovados.
- Jogo: https://otthi-world-campanha-teste.vercel.app/games/otthi/
- Instalador: https://otthi-world-campanha-teste.vercel.app/arcade/instalar/
- APK: https://otthi-world-campanha-teste.vercel.app/android/thIAguinho-ARCADE-OT.apk
- APK de 57.991 bytes: mesmo wrapper Android, conteúdo web atualizado; SHA-256 `8ea2f38c966ee3b938dab2362569ef0224488ab5748c6e9ba1accb0336c0fc49`. Não houve instalação em aparelho físico.

## Correção atual — cache antigo no celular

- Pedido mais recente: o mundo aberto continuava carregando uma versão antiga no celular. A correção anterior de worker cooperante não bastava para essa situação; não repetir a alegação de que o celular foi homologado.
- Recuperação: https://otthi-world-campanha-teste.vercel.app/games/atualizar/ . Essa página fica fora de `/games/otthi/`, consulta o manifesto pela rede e exige que o worker ativo confirme a mesma build/revisão. Confere também o SHA-256 do HTML antes de entrar. Não exclui login, cookies, localStorage, IndexedDB nem caches de outros aplicativos.
- No aplicativo entregue, Console → OTThi World passa pela conferência quando conectado. Offline, o console continua abrindo diretamente o mundo em cache. Jogar/Continuar confere a release antes de iniciar; cliques repetidos são bloqueados durante a entrada, com mensagem de conferência. Há “Salvar e atualizar jogo” no menu inicial e “Salvar e atualizar” na pausa, além da build real visível.
- Arquivos antigos são reaproveitados apenas quando seu SHA-256 é igual ao do manifesto novo. Opcionais são armazenados após ativar a versão; mapa, conteúdo e gráficos não foram removidos. No ensaio, 67 de 71 itens obrigatórios foram reaproveitados. Um arquivo corrompido foi rejeitado e baixado novamente.
- Atualização espera a leitura do banco antes de salvar/recarregar. O botão no lobby preserva a posição salva e não a substitui pelas coordenadas iniciais do personagem. Falha no download mantém a versão anterior e oferece retentativa. Headers das entradas/worker/manifesto/recuperação são `no-store`; a regra genérica inicial da recuperação foi substituída por quatro rotas explícitas após conferência pública.
- Sete verificações focais de integridade/atualização aprovadas. Navegador com worker antigo que ignora o parâmetro do manifesto: falha crítica simulada, retentativa, versão atual, família, moedas/XP, posição, cookie HttpOnly, outro IndexedDB e outro cache preservados. Entrada online do console, entrada offline, botão manual e retrato/paisagem aprovados. Os três cenários de migração anteriores também passaram.
- Evidências: `docs/evidence/world-cache-recovery-20261028/`. Conferência pública aprovada: oito rotas com `no-store`, recuperação real, 98 hashes e fluxo completo do mundo/voo/mapa/rotação. O navegador de QA usou ajuste de certificado exclusivo para o proxy do ambiente; TLS do aplicativo não foi alterado. Nenhum cache físico do celular foi inspecionado, e nenhum APK novo foi compilado.

## Revisão anterior — corpo e mão juntos no WAR

- Pedido atual do Thiago: o WAR precisa reconhecer corpo e mão, usando a câmera frontal. Não responder como se controles de toque atendessem ao pedido de câmera.
- Corrigida a transição que iniciava a partida só pela mão e escondia a prévia antes de o corpo estar pronto. Agora exige corpo e mão/objeto calibrados e com observação recente dos dois. Mostra confirmação independente de cada sensor; a prévia some após a calibração conjunta. Corpo: agachar/girar/dar passos; mão: mira e disparo automático alinhado. Sem joystick no modo câmera. Postura neutra não provoca marcha constante.
- Perder o corpo ou a mão interrompe movimentos e disparos. Erro no detector corporal é mostrado com opção de calibrar novamente. Pausa/recalibração descartam retornos antigos; saída para controles encerra câmera e workers. Captura opcional de brinquedo foi preservada. Painel de calibração em paisagem ajustado para comportar estados e botões.
- 39 testes focais aprovados. Worker real de mãos foi executado com imagem oficial/captureStream, e o corporal real retornou 33 pontos de imagem e de mundo sobre imagem oficial. Fluxo integrado usa poses corporais sintéticas explícitas; confirma bloqueio quando só a mão está pronta, calibração conjunta, postura, mira, perdas e recuperação. Controles por toque continuam aprovados nos três layouts. Não confundir esses ensaios com teste de câmera física no celular.
- Evidências: `docs/evidence/war-body-hand-20261028/`. Publicação e conferência pública concluídas, incluindo modelos e fluxo de corpo/mão com os limites de teste acima.

## Revisão anterior — oficina, garagem, praia, rotação e controles WAR

- **Dois boxes:** uma interação de incêndio inativa capturava a ação perto do carro. Agora só aparece quando a ocorrência está ativa. O painel da oficina mostra os boxes 1 e 2 com ocupação e seleção independentes. Dois carros foram conduzidos por toque e alinhados nos dois boxes; os dois elevadores foram erguidos separadamente.
- **Garagem:** corrigido o bloqueio causado pelo estado de pausa do próprio menu. O botão “Minha garagem” dentro da casa do jogador agora abre a garagem física. Entrada externa, menu e botão da casa exercitados. Outros imóveis continuam indicando a garagem da própria casa.
- **Praia:** mais dez moradores com rotas/ações, seis NPCs surfando em pranchas e três lanchas circulando com dois ocupantes cada. Rotas analíticas e descarte de desenho por distância aproveitam os limites existentes; prancha e surfista somem juntos. Não foram criadas nesta revisão missões marítimas nem surf controlável pelo jogador.
- **Rotação:** removido o bloqueio web em paisagem. Ao virar a tela, interface e controles se reorganizam; direção, acelerador e gestos de câmera ativos são liberados para não ficarem presos. Teste nativo Chromium em retrato/paisagem e três contatos simultâneos aprovado. APK atual já usa `fullUser`, e manifests PWA usam `any`: no Android, a rotação automática do sistema precisa estar habilitada. Nenhum APK novo foi compilado nem sensor físico validado.
- **WAR apenas no console:** corrida por botão/Shift, cancelada ao mirar/atirar/abaixar; sensibilidade própria ao mirar; redução opcional da velocidade sobre alvo visível; modo avançado manual e modo simples que dispara após 0,14 s mantendo alvo visível alinhado. Preservados obstáculos, equipes, munição, recarga e controles por mão/corpo. Joystick à esquerda e arrasto livre da cena à direita, sem joystick direito. Quatro contatos simultâneos e três layouts aprovados. Isso melhora os controles; aparência, animações, mapas, progressão e áudio ainda não atingem o padrão COD Mobile pedido. Não afirmar equivalência nem nota 9,5/10.
- Evidências desta revisão: `docs/evidence/services-coast-rotation-20261028/`. Publicação e conferências públicas concluídas: 95 recursos do mundo por hash, oito arquivos alterados de controle WAR e fluxo real de voo/órbita/cabine/mapa/rotação/orla, sem erros de JavaScript.

## Recursos anteriores preservados

1. **Câmera e passageiros** — módulo `69-vehicle-camera-passengers.js`: arrastar para girar 360°, manter o ângulo após soltar, aproximar e ver ocupantes por dentro/pela frente, botão para voltar a acompanhar o veículo. Funciona em carros, motos, lanchas, helicóptero, avião e balão; os fluxos nativos cobrem carro e três aeronaves. Passageiros acenam, humanos movimentam a cabeça e cães reagem. Motorista só acena parado. Família mantém os assentos. A câmera automática do voo também foi integrada à órbita, eliminando a disputa entre os dois posicionamentos.
2. **Toque** — três contatos simultâneos de direção, aceleração e câmera aprovados; botão de ocupantes acessível em retrato e paisagem. Corrigido o toque que gerava `pointerdown` e um segundo `click` com `detail=0`, abrindo e fechando a cabine imediatamente. Teste dedicado exige uma ativação por toque, clique, Enter e espaço.
3. **Cabines** — aberturas envidraçadas reais no casco das aeronaves civis, bancos/painéis e assentos dos aviões ajustados à fuselagem. Vidros transparentes são preservados no agrupamento de geometria.
4. **Atualização automática** — 11 recursos obrigatórios sem hash impediam o worker de atualizar. O conjunto obrigatório agora só inclui recursos protegidos pelo manifesto; armas não são mais pré-carregadas no mundo infantil. Verificação a cada minuto e ao retornar ao app, sem apagar cookies, contas ou progresso. Reload aguarda parar fora dos veículos e das atividades para não interromper voo/jogo.
5. **Garagem** — sentido da direção corrigido; saída considera o comprimento inteiro, inclusive carreta; manobras e posição por unidade salvas, com correção de estacionamento abandonado ao revisitar. Compra entrega o carro na concessionária com ignição; duas unidades de Palio e saída física foram exercitadas. Base do balão da Serra saiu da estrada; migração só reposiciona o balão original ainda não usado.
6. **Motores** — banco `20261028-vehicle4`, 33 OGG licenciados, perfis explícitos para os 44 modelos. Separados Fusca, Opala I6, M3 turbo I6, Porsche boxer 6, Ferrari V8 plano, T-Cross 3 cilindros, Hornet I4, GS boxer duplo, motos de um cilindro e diesel. Algumas fontes são adaptações por família de motor, não gravações de fábrica de cada veículo. Elétricos mantêm zumbido sintetizado; bicicleta e balão não têm motor a combustão. Metadados, hashes, cortes e licenças em `audio/engine-recordings.json` e `CREDITS.txt`, copiados nos sete jogos.
7. **Carrocerias** — encontros curvos, colunas, capôs e rodas revistos. Lanternas traseiras do Palio acompanham a superfície; teste de encaixe aprovado. Fusca/Ferrari preservados. Os demais veículos continuam estilizados e vários ainda precisam de modelagem mais fiel. Não atribuir nota 10/10.
8. **Fit Dance** — seletor real de áudio do aparelho, BPM detectado e editável, coreografia em frases completas ajustada ao ritmo e duração; arquivo não é enviado. Limite 12 MB, 30 s a 6 min. Câmera frontal some após calibrar; perda do corpo pausa música e aula, com retomada na mesma posição.
9. **Desempenho preservado** — otimizações anteriores das rotas, planejamento da família e preparo dos 44 modelos completos antes de jogar. Comparação de CPU em 40 passos: cidade 2127,5 → 370,3 ms; praia 4917,4 → 374,3 ms. Desenho limitado nesses ensaios: não é FPS de Android.

## Validação e limites

- Suíte ampla da revisão anterior: 293 verificações de unidade; 292 passaram no conjunto completo e uma falhou porque o teste não aceitava o novo parâmetro de cache na URL de `play-settings.js`. A correspondência foi corrigida preservando a exigência de ordem dos scripts; as sete verificações desse arquivo passaram no reteste. Logs completos preservados. Os três novos testes de combate também passaram com os testes existentes de WAR.
- 102 grafos de áudio, 51 tipos/modelos em dois sistemas: amostras reproduzidas, aceleração, pausa, mute e descarte aprovados. Não certifica som do alto-falante do celular.
- 44 modelos, três vistas cada, geometria/assentos/imagens aprovados e seis pranchas inspecionadas. A inspeção não comprova fidelidade de fábrica.
- Câmera: eventos nativos, família de quatro, órbita persistente, interior, três toques e duas orientações aprovados.
- Dança: seletor de arquivo real, calibração, câmera oculta, pausa/perda de corpo e retorno, fim de aula (27/28 movimentos) e encerramento da câmera aprovados com poses sintéticas e dispositivo falso. Nenhuma homologação física de reconhecimento de corpo nesta revisão.
- Garagem/concessionária, reposição exata de aeronave em três minutos, pouso na rua, bloqueio real de trânsito, resgate OTTOVIAS, balão pilotado por NPC e auditoria das estradas aprovados.
- Migração de worker antigo, recuperação de configuração antiga, preservação do progresso/armazenamento de outro aplicativo e início offline aprovados.
- Instalador público: retrato, paisagem, desktop, sem JavaScript e worker instalado aprovados; download real do APK conferido.
- Evidências anteriores: `docs/evidence/vehicle-camera-audio-20261028/`, incluindo a auditoria dos 275 recursos compartilhados e o reteste incremental do hotfix anterior. Evidências atuais: `docs/evidence/services-coast-rotation-20261028/`: 95 recursos do mundo por hash e oito controles WAR alterados, todos idênticos ao código validado. No site público, sem interceptação/cap de desenho: início, quatro familiares no helicóptero, órbita, cabine, retorno à câmera de acompanhamento, decolagem, rotação nos dois sentidos, mapa, retorno ao mundo e novos surfistas/lanchas aprovados sem erros de JavaScript.
- Não afirmar FPS sustentado, ausência de travamentos/piscadas no Android, precisão da câmera física, áudio perfeito ou multiplayer real entre celulares. Não foram testados no aparelho do Thiago. O vídeo recebido tinha área do jogo preta; não dizer que foi possível observar a piscada nele.

## Pedidos que continuam pendentes

- Conferir no celular a entrada de recuperação e a build visível. Se o usuário continuar relatando cache antigo, verificar URL/origem e build carregada, sem pedir para apagar todo o histórico nem declarar o aparelho testado. A rota nova e os testes com worker antigo estão no bloco atual acima.
- Investigar travamentos e piscadas no Android real sem reduzir mapa, qualidade ou conteúdo.
- Maior fidelidade das carrocerias e dos sons de todos os transportes, sobretudo motos e carros brasileiros. Não trocar todos por um modelo genérico.
- Ampliar o mar com navios/barcos maiores, surf e prancha jogáveis e missões marítimas coerentes. Seis surfistas NPC e três lanchas tripuladas já foram adicionados; não apresentar isso como missão ou atividade jogável concluída. Interações do jogador para esquiar/brincar na neve e mais movimento nas regiões continuam pendentes. Já há moradores, banhistas, vôlei, castelos, patinadores, trenós e caminhantes.
- Alternar recolhimento de aeronaves/balões com equipe terrestre, viatura, piloto, bloqueio e decolagem, além do resgate aéreo já existente.
- Roupas para a família, mais personagens e criação ampliada de personagens.
- Melhorar sons/animações das ações e movimentos do Fit Dance com teste corporal real.
- Mundo aberto infantil/civil: manter polícia/bombeiros e remover tiros/guerra/operações militares do mundo. WAR continua no console; evoluir conteúdo, animações e visual após a revisão atual dos controles. Não apagar o jogo do console.
- Revisar regressões e multiplayer de cada jogo a partir de evidência concreta. Não garantir todos os jogos 10/10 nem alegar testes em dois celulares sem executá-los.

## Ambiente e publicação

Diretório `/workspace/scratch/a10cbbfeaf34/ConsoleGames`. Chromium `/workspace/scratch/a10cbbfeaf34/qa-browser/chromium`, versão 138.0.7204.0, via `OT_BROWSER_BINARY`. Servidor local e navegador precisam executar no mesmo processo. Rede pública usa `tests/helpers/browser-network.mjs`; não expor credenciais.

Build: `python3 games/otthi/tools/build_project.py && python3 tools/package-world-preview.py`. Publicar somente SHA validado; atualizar a branch de produção com `expected_sha`, sem force. Vercel: projeto `prj_wKaHtyk7Pb3vsb9KsnKerxS8bOKm`, time `team_W3UyY5ss3Shyv78KRMndjust`, repoId `1427071731`, saída `dist-world`, install `true`, framework/root nulos.

Preservar contas, Firebase/regras, senhas, IDs e saves. Não criar agentes paralelos sem instrução explícita. Não repetir toda a suíte se não houver mudança que invalide os resultados; investigar a primeira falha com observabilidade.

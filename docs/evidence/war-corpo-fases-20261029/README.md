# WAR: corpo, mão, fases e adversários

Pedido: as fases se repetiam, o corpo não era reconhecido e a experiência não era jogável. Revisão concentrada no WAR do console; o mundo aberto continua civil.

## Mudanças verificadas

- Calibração aceita tronco/ombros sem exigir quadril e pés. Os pés continuam disponíveis no modo de passos. Perder ombros, mão, foco ou observações recentes interrompe as ações.
- Os dois modelos de visão alternam inferências no mesmo vídeo frontal. A região do punho direito identificada pelo corpo é ampliada antes do detector de mão. Coordenadas voltam ao quadro original antes de controlar a mira; a câmera some após os dois sensores calibrarem.
- Avanço assistido é o padrão da câmera. Pode ser trocado por passos na calibração. Agachar, mirar num alvo próximo e perder o rastreamento interrompem o avanço. Sem joystick no modo câmera. Captura opcional de objeto, recarga automática ao esvaziar o carregador e retorno aos controles preservados.
- Porto: corredores de contêineres, carga e embarque. Cidade: praça, ruas cruzadas, comunicações com captura sob ataque e flancos. Fortaleza: muralhas, torres, montanhas, dois transmissores e extração em quatro setores. Os cenários são geometria real, com iluminação e silhuetas distintas.
- Corrigida a reflexão duplicada de Z dos soldados detalhados: os modelos ficavam atrás da câmera enquanto a lógica dos alvos estava à frente. Posição, orientação e altura agora acompanham a simulação. Teste com o modelo detalhado real verifica pés, cabeça, projeção e direção do rosto/arma.
- Spawns ficam fora das coberturas. A cidade apresenta um contato frontal e mantém os ataques pelos flancos. Matar todos os adversários não pula a captura ou a extração. Objetivos/progresso são calculados pelo anfitrião e sincronizados no cooperativo.
- Cache WAR v37 instala com quatro downloads e consumo imediato de cada corpo de resposta, evitando a trava do prefetech simultâneo. Falha descarta só o cache novo. URLs dos scripts alterados versionadas, rede sem cache HTTP no worker. Progresso, IDs de conta/jogo e gravações existentes preservados. Build web 705.28.9-war-corpo-fases, assetVersion 70645.

## Evidências

- `all-unit.log`: 319 verificações aprovadas; `focused-unit.log`: controles/objetivos/projeção e modelo detalhado, incluindo as alterações finais de spawn.
- `joint-models.json`: ambos os modelos MediaPipe reais sobre a MESMA imagem oficial, sem worker/landmarks simulados. Calibração conjunta, ampliação do punho, adversário detalhado visível, acerto real pelo disparo alinhado, avanço assistido, perda e retomada. `real-body-hand-hit.png` mostra essa cena.
- `hand-camera.json`: inferência real de mão, eixos e acerto, com postura corporal sintética explicitamente identificada. O punho da postura sintética não é usado como recorte da imagem independente. Este ensaio exercita o modo por passos.
- `campaign.json`: botões reais das três fases, WebGL de produção, retrato/paisagem, geometria e pixels distintos; soldados detalhados projetados no campo visível, sem erros JavaScript.
- `touch.json`: três layouts móveis, quatro contatos simultâneos e mouse/teclado. `object.json`: rastreador real de objeto sobre câmera de pixels determinísticos, postura sintética, gestos/eixos/perdas e retorno aos controles.
- `worker-unit.log`: transporte com seis conexões conclui todos os recursos; uma falha mantém a versão anterior. `update.json`: instalação real e completa do worker v37 em HTTP/1, ativação após sair da partida, carreira/arma/moedas e outros dados preservados. O estado legado já instalado é preparado pela fixture; a instalação antiga problemática não é apresentada como aprovada.
- Falhas do GitHub em bf4122f ocorreram antes de testar os jogos: Playwright 1.56.1 não instala Chromium em Ubuntu 26.04. Os três workflows foram fixados em ubuntu-24.04, mantendo todas as verificações e incluindo os novos ensaios conjuntos. Resultados públicos e da nova execução serão acrescentados após concluir.

## Limites

Não houve câmera de pessoa real em celular físico, medição de FPS de Android ou partida entre dois aparelhos na rede Firebase de produção. O ensaio cooperativo usa dois clientes isolados com a mesma API de transporte, sem acessar contas reais. Estes resultados não certificam equivalência com COD Mobile. O APK público e sua assinatura permanecem os mesmos; esta entrega é conteúdo web atualizado.

A referência visual criada no Canva é arte de direção, não captura do jogo:
https://www.canva.com/M/MAHZVzJMdsY?utm_source=OC-AaBlKrqBJJNF&utm_campaign=agent_connector_create_image_asset_opened

## Regressões do mundo encontradas pelo CI

Em e53967d, câmera/mundo passou (40846816583), incluindo ambos os modelos reais, três operações, toque, cache e ações civis. Embarque, frota, garagem e mapa móvel passaram. O mercado de Aurora voltou a comprar sem uma missão tomar o botão. A frota de 44 veículos e oito aeronaves passou; comércio e três minutos de trânsito passaram. O teste de renderização isolado revelou uma segunda falha: as janelas transparentes individuais excediam o orçamento de desenho nas aeronaves NPC. Elas foram agrupadas preservando todos os vértices, material, aberturas e hélices animadas; o limite original de 14 chamadas foi mantido e os quatro modelos passaram com 7/10/8/9 chamadas. Ver `airframe-budget.json` e `airframe-budget.log`. Aguardar nova execução da fonte final antes de declarar a suíte geral aprovada.

Prioridade dos reconhecedores: em processador lento, resultados de postura podem ocupar o intervalo entre todas as observações da mão. A sessão agora dá observações consecutivas à mão quando a postura ainda é recente, atualizando o corpo antes do prazo. Não aumenta o limite de 550 ms da mão nem o de 1200 ms do corpo. Teste de relógio/worker verifica prioridade e ausência de starvation; repetir a inferência real e atualização v37 na fonte final. Uma tentativa pública anterior teve pausa segura do rastreamento e não atingiu o alvo; não apresentar essa tentativa como aprovada.

Calibração neutra: o deslocamento natural entre ombros e quadril agora é subtraído da postura inicial. Pequeno ruído angular/lateral tem zona neutra, sem impedir inclinação deliberada. Regressão usa um tronco naturalmente deslocado; 29 testes de corpo/mão/campanha passaram. Ambos os modelos reais também passaram com adversário de treino estacionário e modelo/acerto reais. A imagem estática não pode acompanhar flanqueamento: o ensaio define destino/decisão do adversário para o próprio ponto, sem interceptar os modelos de visão ou alterar a lógica de disparo. Um ensaio adicional com CPU artificialmente limitada em 2x excedeu 550 ms e pausou os disparos; não certificar jogabilidade em hardware lento a partir desse ensaio.

Família local: fluxo inteiro aprovado após isolar o service worker do gancho de QA; Thamis gravada/recarregada, movimento, grupos, pets, retrato, carro e HQ original. Fonte b4750cc passou embarque, mundo, frota/garagem; câmera falhou no ensaio de foto estática com adversário em flanqueamento. Aguardar a fonte final, suas verificações e publicação exata; produção ainda não foi atualizada nesta anotação.

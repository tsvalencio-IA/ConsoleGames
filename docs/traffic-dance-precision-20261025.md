# Trânsito, dança e precisão visual — build705.25.2

Base de produção: bbf7b0db1dc8a08828ad5478f9ffc54a879bd009, revisão574855b20778cad8. Preservar contas, regras Firebase, saves, 47 entradas da garagem, seis vagas, lojas, casas e jogos originais já aprovados.

Pedido confirmado: todos os 44 modelos devem circular como NPCs, incluindo motos, bicicleta, ônibus e carretas, em cidades e rodovias; direção à direita no padrão brasileiro; volante e motorista à esquerda pela visão do condutor; dança pela câmera de corpo inteiro, com calibração e movimentos, substituindo notas/botões; melhorar fidelidade do Palio Fire Economy Celebration2011 e do T-Cross; acrescentar NPCs de avião de passeio, avião de carga, helicóptero de passeio e helicóptero de apoio Otto Vias.

Tráfego deve respeitar modelos, dimensões, capacidade, faixas e rotas adequadas. Preservar a possibilidade de assumir veículos móveis e a autoridade online existente. Não trocar posse, cor ou ID de veículo já salvo. Modelos e poses devem ser verificados também pela câmera do condutor para evitar uma inversão de coordenadas 3D.

A dança usará modelo real Pose Landmarker Lite no aparelho, sem envio de imagens. Precisa de enquadramento de corpo inteiro, calibração, pausa na perda do corpo, acompanhamento preciso, demonstração dos passos, fases e pontuação por movimento. Preservar progressão anterior; não simular detecção por botões. Verificar recuperação de câmera, orientação e retorno ao mundo. Testes simulados serão identificados; não declarar teste em Android físico sem executá-lo.

Referências de carroceria: Palio Fire Economy2011 solicitado anteriormente; T-Cross da geração original que o catálogo já representa (ano/versão ainda não especificado pelo usuário). Referências visuais e decisões serão registradas com fontes reais, sem afirmar fidelidade CAD ou uma nota subjetiva 10/10.

## Implementação

Build705.25.2-traffic-dance / assetVersion70627 / estado705. A coleção continua com47 entradas e44 modelos físicos. Todos os44 modelos têm ator de trânsito com ID estável, distribuição entre rotas urbanas e rodovia, dois sentidos pela direita e criação gradual. Carretas e ônibus longos usam a rodovia. Bicicleta e mobilete circulam em ritmo menor. A resolução geométrica usa comprimento e largura independentes, preserva a faixa ao ceder e mantém o mecanismo existente de assumir veículos móveis. A cena compartilhada continua sob a autoridade existente; a visibilidade da nova frota é calculada pela posição local do passageiro, não pela posição do anfitrião.

Sete aeronaves civis, quatro modelos: dois aviões de passeio, dois cargueiros, dois helicópteros de turismo e um de apoio OTTOVIAS. Hélices/rotores animados, pinturas distintas e rotas/altitudes separadas, visíveis no mesmo cenário de solo e voo. O relógio de servidor existente sincroniza as rotas sem novo canal de banco. As aeronaves de combate e as que o jogador estaciona não são substituídas. NPCs civis não disparam.

Volante e motorista passaram para o lado esquerdo real visto do banco do condutor (local+X quando o veículo aponta para+Z). As portas dos ônibus de linha ficam do lado direito. Não foi espelhada a carroceria inteira. O Palio e o T-Cross têm construtores próprios de carroceria, vidros, detalhes, frente e traseira. T-Cross representa a geração original, referênciaMY2021; o pedido não especificou ano. Permanecem modelos autorais de jogo, não CAD de fábrica.

A dança usa câmera frontal mediante toque na aula, MediaPipe Pose Landmarker Lite real em worker CPU e33 pontos do corpo. Modelo e SDK são servidos no próprio aplicativo, baixados somente ao ativar a câmera. A imagem é ocultada depois da calibração e pode ser mostrada para conferir o enquadramento. Movimentos incluem braços, passos laterais, braços cruzados, inclinações e agachamento. Não há setas/notas nem pontuação por teclado. Calibração exige corpo inteiro estável; observações antigas/duplicadas não pontuam; a música pausa na perda do corpo e ao interromper a página. Sair, recalibrar ou concluir encerra as trilhas da câmera, worker, áudio e renderizador. Recordes anteriores são preservados e os novos recordes por movimento são registrados separadamente. Boxe original preservado.

## Validação local executada

-233 testes Node passaram em conjunto; o caso adicional de articulação3D dos joelhos também passou.
-44 modelos renderizados em três vistas, máximo25 chamadas de desenho por modelo, geometria pintada do Fusca idêntica à base de produção.
-Mundo real local:44/44 modelos criados e movidos durante a janela de observação; sete aeronaves movimentando-se com rotores finitos e altitude mínima.
-Inferência real do modeloCPU no worker de produção:33 pontos em imagem de exemplo oficial do MediaPipe.319ms no Chromium com renderização de software deste ambiente, sem pretensão de representar um celular.
-Interface real da dança com vídeo de dispositivo simulado e replay explícito de marcos sintéticos:8/8 movimentos, calibração, preview oculto, pausa por perda de corpo, pausa manual, progressão e encerramento de todas as trilhas da câmera. Este replay não é teste de câmera física.
-Quatro modelos aéreos renderizados com6/9/7/8 chamadas de desenho, respectivamente.

Os testes de câmera física no Android, desempenho prolongado no aparelho e multiplayer entre aparelhos reais continuam separados. Nenhum dado de sala ou jogador de produção foi consultado e nenhuma regra Firebase foi alterada.

## Referências

- MediaPipe: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js
- Modelo fixado e hashes: games/otthi/assets/pose/sources.json. SDK e licença já usados no rastreamento WAR, copiados sem alteração de versão.
- Fiat linha2011: https://www.media.stellantis.com/br-pt/fiat/press/fiat-automoveis-traz-novidades-em-sua-linha-2011
- Palio legado: https://www.media.stellantis.com/br-pt/fiat/palio-1996-2013-my-legado
- VW T-Cross original/Sense: https://newsroom-br.itd.vw.com.br/news/1117
- Fotos de referência analisadas, não incorporadas no jogo: https://2.bp.blogspot.com/_joBSfovwfM0/TAAskkcx0vI/AAAAAAAABqs/kV6r0tDtGJA/s1600/palio%2Bfire%2Beconomy.jpg ; https://1.bp.blogspot.com/_aE4K_DXYxYI/TAGy9svHisI/AAAAAAAAFg8/QCH0OZJkoEg/s1600/palio_fire_economy_03_960_640.jpg ; https://www.webmotors.com.br/wp-content/uploads/2020/09/11125451/vw-t-cross4.jpeg

## Verificações finais de integração

-A aula também recuperou uma permissão negada e se adaptou a retrato/paisagem sem rolagem horizontal. Câmera preserva a proporção de captura, e os ângulos dos joelhos usam os marcos3D do modelo real quando disponíveis.
-O worker real iniciou novamente sem rede, usando o modelo e o SDK baixados sob o service worker de produção.33 marcos de imagem e33 marcos de mundo presentes.
-Garagens, três concessionárias, compra,44 veículos expostos, nove ações de casa, persistência e continuidade das vias passaram no fluxo de toque local. As verificações aguardam a alteração assíncrona real de estado após o toque.
-Família completa e três convidados no ônibus, rejeição do quarto convidado, capacidade da bicicleta e de carros de dois lugares, e passageiro na última posição do ônibus passaram no replay local.
-Atualização real do worker anterior, recuperação de configuração antiga e abertura offline preservaram perfil e save.
-Assumir bicicleta, Hornet, ônibus Attivi e carreta-tanque em movimento passou pelo botão de ação. Tipo, ID, controle e modelo permanecem os correspondentes à origem.
-A Ferrari licenciada já tem volante geométrico à esquerda: centro calculado nas transformações do GLB emX=+0.27619 após a conversão para frente+Z. Sua malha original foi mantida.

-A verificação de toque do WAR passou em390×844,844×390 e320×568, com quatro dedos simultâneos, câmera por arraste, mira, disparo, pausa e rotação; mouse e teclado também passaram. O teste aguarda a entrega do evento real de redimensionamento em vez de presumir que ele ocorreu após120ms. O código do WAR permanece igual ao da produção anterior.
-As duas carretas passaram com atualização real entre entrada, curva, frenagem e inspeção da articulação. O teste de animação agora aguarda os quadros efetivos do jogo, em vez de uma espera fixa de160ms.

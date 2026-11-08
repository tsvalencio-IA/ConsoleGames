# Dança no console e música do YouTube

Runtime publicado: `1506219af05a8dae04020dc7045c06eaf9409819`.
Produção: https://otthi-world-campanha-teste.vercel.app/arcade/
Entrada direta: https://otthi-world-campanha-teste.vercel.app/games/danca/
Deployment: `dpl_GcVLwTNWBLPTCzM3AUPiusTJSESq`, READY.
Revisão: `4d8e8395e38c85ce`.

O console passa a ter oito cartões, incluindo Dança. A entrada direta usa as mesmas regras, aulas, professor e acompanhamento do corpo da Academia de Dança, sem iniciar a cidade. Os recordes e aulas liberadas do perfil local existente continuam no mesmo registro de atividades do mundo; outros jogos não são alterados.

A música pode ser escolhida por link do YouTube. O player oficial permanece visível e conectado ao documento entre a escolha e a aula. A busca abre o YouTube; o jogador copia o link para o jogo. BPM é ajustado manualmente ou por toques na batida; não há extração do áudio nem reconhecimento automático da batida do vídeo. Áudios locais e músicas originais continuam disponíveis.

Pausa, perda do corpo e carregamento do player congelam o relógio da coreografia. A saída da aula encerra a câmera; a saída do jogo destrói o player. O vídeo respeita as restrições de incorporação do YouTube.

## Verificação

- 407 testes de lógica aprovados localmente; os testes de unidade também passaram no workflow final.
- Workflow `42434156049`, etapa `Run node tests/dance-console-browser.mjs`: sucesso. Quatro tamanhos de tela, player visível com pelo menos 200×200, entrada direta, aulas previamente liberadas, preservação do iframe, pausa no carregamento, câmera encerrada e registros de outros jogos preservados.
- Workflow `42434156033`, etapa `Validar dança por corpo e inferência real sem câmera de usuário`: sucesso. Modelo real de pose, música original e aula completa com áudio local continuam validados.
- `http-integrity.json`: 138 de 138 recursos públicos correspondem aos hashes locais; nenhuma divergência.
- Navegação manual no endereço principal confirmou o cartão Dança e a entrada direta com seleção do YouTube. `production.png` registra o menu publicado.

## Limites observados

O navegador remoto carregou o player real e os metadados de uma música (On & On, NCS), mas a transmissão permaneceu em carregamento; não foi confirmado áudio contínuo nesta sessão. O navegador remoto também não criou contexto WebGL, portanto a aula foi validada no Chromium do workflow com renderização por software e poses de teste. Não foi medido o funcionamento físico da câmera, áudio, temperatura ou FPS em Android/iPhone. A sincronização de carregamento do YouTube foi testada com eventos simulados, sem certificar anúncios ou disponibilidade de cada vídeo.

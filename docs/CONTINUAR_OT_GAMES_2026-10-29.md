# Continuação OT Games — 29/10/2026

Repositório: tsvalencio-IA/ConsoleGames. Projeto correto é OT Games, não o SaaS da oficina. Não simplificar nem reconstruir os jogos, não remover recursos e não afirmar teste em celular físico ou qualidade COD sem evidência.

Ler também `docs/CONTINUAR_OT_GAMES_2026-10-28.md` para todos os requisitos anteriores, mundo aberto civil, garagem/família, veículos, assinatura Android e trabalhos pendentes.

## Revisão WAR atual

Thiago relatou fases repetitivas, corpo não reconhecido e jogo impraticável. Implementação e evidências em `docs/evidence/war-corpo-fases-20261029/README.md`.

- Tronco calibra sem pés obrigatórios; alternância entre os modelos, recorte ampliado do punho direito e coordenadas restauradas ao vídeo original. Câmera frontal e prévia oculta depois da calibração conjunta. Perdas interrompem ações.
- Avanço assistido padrão, opção por passos, agachar para interromper/proteger. Sem joystick na câmera; toque continua com joystick esquerdo e arrasto livre à direita. Objeto/brinquedo preservado.
- Três mapas e objetivos diferentes, mantendo porto 2 setores, cidade 3 e fortaleza 4. Captura sob ataque, transmissores, marcadores de saída e progressão autoritativa no cooperativo. Spawns fora de coberturas; contato frontal na cidade e flancos mantidos.
- Bug real de render: soldados detalhados tinham Z invertido duas vezes, deixando os corpos fora da vista. Corrigidos posição, orientação e altura, com comparação do modelo real e da projeção de acertos.
- Suíte completa 319 aprovada e verificações focais de objetivos/câmera/render. Ambos os modelos reais sobre a mesma foto oficial calibraram e deram acerto real em um alvo detalhado; perda/retomada e avanço funcionaram. Isso não é teste de câmera física. Três mapas WebGL em duas orientações e controles simultâneos aprovados. Objeto preservado com prova de navegador.
- Cache: instalação passa a drenar respostas a cada download, com quatro conexões, sem deixar todos os corpos pendentes. Dois testes de regressão e atualização real do v35 com saída de partida/carreira/arma/moedas preservadas aprovados.
- GitHub: as três falhas exibidas em bf4122f eram instalação do Chromium incompatível com ubuntu-26.04. Workflows ot-games-smoke, scenery-smoke e gameplay-smoke fixados em ubuntu-24.04, sem retirar verificações. Aguardar suas execuções na fonte final antes de declarar aprovação.
- Web 705.28.9-war-corpo-fases, assetVersion 70645, revisão 4c6b22c7d94c5703. Worker WAR v35, scripts versionados; conta/IDs/progresso mantidos. Não alterar APK público ou criar chave de assinatura nova.
- Fonte de trabalho: branch `performance-gravacoes-20261027`; produção usa `world-revisao-20261022`. Conferir arquivos `deployment.json` e `public-*.json` desta pasta de evidências para identificar a publicação exata e os resultados públicos. Não tomar um commit WIP como versão já publicada.

## Publicação e recuperação

Vercel projeto prj_wKaHtyk7Pb3vsb9KsnKerxS8bOKm, time team_W3UyY5ss3Shyv78KRMndjust, repoId 1427071731. Build `python3 games/otthi/tools/build_project.py && python3 tools/package-world-preview.py`, saída dist-world. Publicar SHA testado, esperar READY e conferir alias. Não gravar segredos no código ou chat.

WAR: https://otthi-world-campanha-teste.vercel.app/games/ar/
Console: https://otthi-world-campanha-teste.vercel.app/arcade/
Recuperação do mundo: https://otthi-world-campanha-teste.vercel.app/games/atualizar/

Sem homologação física de Android, FPS, precisão corporal com pessoa real ou multiplayer entre celulares. WAR ainda não é COD. Não prometer todos os jogos 10/10. Pedidos de YouTube/coreografia automática e fidelidade total de veículos permanecem pendentes, conforme documento anterior.

## Rechecagem dos workflows

A fonte 2e58d9a passou em cenários (40844021737) e câmera/mundo (40844021615). Gameplay 40844021627 revelou problemas adicionais: frota/garagem/embarque passaram, mas o teste de família ainda usava o painel de missões aposentado e abria antes do fim do carregamento; o teste do tráfego encerrava a observação quando apenas os carros tinham se movido; e o mercado de Aurora tinha sua compra interceptada por um alvo civil sem missão ativa. A revisão seguinte atualiza o teste para as sete missões civis sem restaurar missões antigas, aguarda o jogo rodando, observa carros e todas as oito aeronaves e limita renderização de software somente no teste. A corrida completa continua exigindo três voltas pelos controles, com orçamento de tempo maior para GPU de software. O mercado só prioriza retirada/devolução de encomendas enquanto essa é a etapa ativa. Não retirar verificações para deixar o CI verde.

A verificação pública do HTML usa a entrada canônica /games/ar/ utilizada pelo jogador. No preview, /games/ar/index.html recebe uma inserção adicional da barra Vercel Live; os vinte arquivos continuam comparados byte a byte. Não ignorar diferenças de scripts, modelos ou executáveis.

Produção ainda é dcd5272 até a fonte final passar no CI e ser publicada com SHA fixado; registrar a publicação e os testes públicos em deployment.json e public-*.json. A aprovação física continua pendente.

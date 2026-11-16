# Correções integradas — ConsoleGames 16/11/2026
Base de trabalho: preview/console-educacao-integrado-20261116 (2a4c85a).
Produção não alterada.

## Corrigido
- Kart (modo experimental de disputa): ritmo individual de rivais calibrado pelo multiplicador de IA, sem conceder ultrapassagens, escrever posições, voltas ou recompensas. 20 corridas consecutivas do teste de 3 voltas aprovadas na sandbox.
- OTTHI-World: duas verificações seguras de ocorrência ativa impedem acesso a dados nulos durante deslocamento de resgate. O teste utiliza o mesmo PhoneDriveRoute real.
- Voo: pose em formato array de detecções e coordenadas normalizadas passa a ser aceita na calibração pitch/roll.
- Ping Pong: formato array e coordenadas normalizadas aceitos preservando o mapa de calibração legado.
- Boxe: deteção em array e coordenadas normalizadas suportadas antes do rastreamento de golpes.
- WAR: teste vinculado à versão específica antiga foi corrigido para exigir o script atual do controle manual uma única vez; não muda o jogo WAR.
- Trânsito/resgate: harness de teste carrega a geometria real da ambulância, a classe de rota e dependências necessárias sem eliminar as asserções de segurança.
- Console, Família, Dança, educação e IDs Firebase preservados como na base; não alegar que esses jogos foram homologados.

## Testes
- Kart 20/20 repetições da corrida nativa (20 cenários aleatórios, não Android).
- Testes das quatro falhas históricas: 18/18 aprovados.
- Testes existentes câmera/assistência: 25/25 aprovados.
- Testes novos de equivalência pose pixels vs normalizados: 3/3 aprovados.
- Suíte ampla e testes de navegador/Android são obrigatórios antes de merge; documentar status com resultados obtidos.

Esta é uma PRÉVIA EM HOMOLOGAÇÃO, não entrega comercial 10/10.

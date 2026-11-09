# Combate e Kart — 9 de novembro de 2026

Escopo solicitado: precisão e duração das corridas do Kart; combate com apresentação militar mais séria, tomando FPS atuais como referência.

## Kart

- Corrigido o ângulo dos punhos: calculado em pixels da câmera antes da projeção na tela. O mesmo gesto tem a mesma intensidade e direção em retrato, paisagem e desktop.
- Mantidos o setor original de cada pista, física de direção, estatísticas dos pilotos, três voltas, item por mão na cabeça e turbo por duas mãos levantadas.
- Acrescentados três setores por circuito, cronômetro de corrida e tempos de volta. Traçado e mapa são determinísticos em cada corrida online.
- Protocolo de salas passa a `cups_v3` para impedir partidas entre clientes com comprimentos de pista diferentes. Identidades, garagem, moedas, Firebase e salas antigas não são removidos.
- Vídeo congelado libera aceleração e turbo; o volante volta a responder quando chegam novos quadros.

Simulação controlada com o motor real em 60 Hz, direção manual corrigindo ao centro, sem adversários para isolar a duração: pistas 0/1/2 levam 108,23 / 114,02 / 103,73 segundos pelas três voltas. Não é promessa de tempo para todos os pilotos, itens, colisões e configurações.

Referência consultada: `tsvalencio-IA/GAME`, commit b18e140896fbec438524b47316a9d4f300b8b747. Na referência, as três voltas isoladas duravam aproximadamente 27,27 / 33,05 / 22,77 segundos.

## WAR

- Funções de assalto, flanco e apoio; supressão por impacto; nova aquisição de mira após perder visibilidade; cobertura com postura abaixada.
- A obstrução dos tiros passa a usar o caminho tridimensional do disparo. Partes expostas acima de uma barreira podem ser atingidas; trajetórias que atravessam a barreira são bloqueadas. Mesma validação para solo e cooperativo.
- Infantaria Vanguard/Mixamo com esqueleto e animações independentes, arma articulada e poses de tiro/cobertura. Detalhes originais permanecem no modo de qualidade baixa e na renderização compatível.
- Três armas com perfis visuais próprios, recuo e recarga na apresentação; a mira calibrada do jogador permanece na simulação.
- Concreto com mapas locais de cor, normal e rugosidade; céu fotográfico e iluminação de ambiente. O preset baixo dispensa normal e processamento de iluminação especular.
- Impactos limitados a 28 marcas; indicador da direção do dano; indicadores permanentes sobre os inimigos removidos.
- Modelos e bibliotecas com origem/licença em `games/ar/assets/**/sources.json` e `games/ar/vendor/THREE-LICENSE.txt`.

## Limites de verificação

Não foi medida a câmera física, temperatura, latência nem FPS de um Android real. Chromium com GPU por software verifica funcionamento, geometria, projeção, controles e atualização; não representa desempenho de aparelho. Este projeto web não é apresentado como equivalente técnico ou gráfico a Call of Duty 2026.

Resultados finais, revisão publicada e imagens são registrados nos arquivos de evidência após a aprovação dos testes.

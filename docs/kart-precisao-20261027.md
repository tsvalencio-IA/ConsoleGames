# Kart — contato e liberação de direção (27/10/2026)

Um rival em outra faixa podia frear e empurrar o kart sem contato visual. A área lateral de colisão era de 0,8 unidade de pista para todos os modelos. Em largadas aleatórias, o mesmo encontro também podia aplicar impactos sucessivos ao oscilar na borda dessa área, parecendo deriva após soltar a direção.

A colisão agora usa a largura das rodas/carroceria do modelo, na mesma escala da projeção do jogo. Um contato só pode aplicar outro impacto após uma separação clara. As batidas reais, peso dos pilotos, curvas, derrapagem, itens, turbo, copas e quatro níveis de auxílio permanecem ativos. A direção por câmera e o gesto de item não foram substituídos.

Dois testes novos reproduziram o problema antes da correção: uma passagem em faixa separada e uma largada com a semente 193. A varredura anterior encontrou 30 falhas em 4.000 largadas do piloto inicial. A regressão permanente cobre 12 dessas sementes, oito pilotos e os dois sentidos de direção, além de verificar contato real e separação.

O smoke de navegador agora exige três voltas completas em retrato, paisagem e desktop, através dos controles nativos. Os limites de tempo e deslocamento foram mantidos. Os contadores de voltas, posição e velocidade não são preenchidos pelo teste. O relatório final e as capturas ficam em `docs/evidence/kart-precisao-20261027/`.

Os testes usam saves descartáveis e serviços de rede isolados. Não certificam instalação física no Android, FPS sustentado, iluminação/câmera do usuário ou uma partida entre dois celulares reais.

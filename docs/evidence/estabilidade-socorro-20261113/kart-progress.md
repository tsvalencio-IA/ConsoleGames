# Kart — checkpoint da evolução

Base do jogo preservada na branch continuation-20261111, sem commit/publicação por este agente. Nenhum Chromium ou benchmark foi executado durante a janela isolada do mundo.

## Diagnóstico

1. O AI habitual subtraía curva×0,04 da posição lateral a cada passo. Na dificuldade fácil, a reação de faixa é0,05; curva4 desloca o equilíbrio em3,2 larguras de faixa, ultrapassando o limite1,8. Isso prende rivais na borda, reduz sua velocidade e deixa o jogador sozinho. A correção usa deriva proporcional à velocidade/curva nas mesmas unidades da física do jogador e limita a mudança de faixa. Velocidades, dificuldade, pistas e aceleração habituais são preservadas.
2. O bot local largava banana no próprio segmento, diferente do jogador e do bot online. No tick seguinte podia atingir o próprio item. A correção solta duas faixas atrás e conserva a imunidade curta do dono.
3. A avaliação anterior só dava metas e uma largada atrasada; não corrigia o ritmo dos rivais. Usar dezenas de itens em seguida também pouco exigia escolha.

## Implementação em preparação

- Correções matemáticas e de banana acima aplicadas ao Kart habitual e à prévia.
- Novo games/kart/racecraft-duel.js, dependência que a raiz incluirá no manifesto.
- Prévia opcional SOLO **Duelo de pista**, com botão explícito no phase-screen habitual e também query kart_eval=duelo. Não altera conta/calibração/online/recompensas.
- Rivais com perfis, faixa livre, ritmo próximo e ajustes pequenos de velocidade-alvo via aceleração física; não há escrita de posição depois da largada, teleportes, ranks forçados ou vitória garantida.
- Prévia tem contagem de largada, item com intervalo, defesa de casco por banana, aviso de aproximação e última volta. Física do jogador e pagamento original permanecem.
- Telemetria mede tempo perto de rivais, trocas de posição/liderança, defesa e resultado. Meta: disputa real, incluindo perder e recuperar posições; não apenas aprovação de metas.

Arquivos próprios: games/kart/js/game_kart.js, racecraft-evaluation.js, racecraft-duel.js, index.html, sw.js (cache37), novos testes e entrada de prévia. Não editar mundo, WAR ou manifestos compartilhados. Não considerar concluído antes de regressões e corridas nativas completas.

Próximo: fechar testes leves de curva/banana/guardas/defesa; receber janela de browser da raiz; comparar corridas completas nas mesmas configurações e registrar resultados desfavoráveis também. Não alegar10/10, diversão humana aprovada ou FPS de aparelho a partir do runner.

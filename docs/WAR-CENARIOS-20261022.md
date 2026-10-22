# WAR Combate e cenário aéreo — 22/10/2026

A apresentação pública do antigo caminhão passa a usar **WAR Combate** no catálogo, no jogo, na capa e no manifest Android/PWA. O identificador interno e a rota permanecem para conservar as permissões e o progresso reais das contas.

Os dois jogos recebem um renderizador WebGL com Three r128 empacotado localmente. Ele desenha no Canvas2D nativo, antes dos indicadores, sem substituir a simulação. A conversão explícita do eixo Z conserva a projeção original: a mira, os alvos, a câmera e os veículos continuam no mesmo espaço. Se o dispositivo não cria um contexto WebGL, o jogo usa seu renderizador compatível.

WAR tem ambientes de porto, centro urbano e fortaleza, com fachadas texturizadas, telhados, caixotes industriais, guindastes, sinalização, postes, vegetação, fumaça, sombras e arma em primeira pessoa. Soldados, drones e tanque são malhas arredondadas com peças distintas. A cobertura acompanha os volumes usados pela colisão e pelos disparos; decoração fica fora dos limites de movimento. A câmera opcional mantém apenas os alvos virtuais e a arma sobre o vídeo.

No voo, os quatro distritos mantêm suas ruas e trajetos reais. A cena acrescenta fachadas, coberturas, praças, fontes, árvores, aeroporto, galpões, torre de controle, pontes, rodovias, rio, campos e vales. Carros, pessoas e tanques seguem as posições da simulação, sem animação independente que abandone os percursos. A escola mantém a pista nas coordenadas originais. O relevo decorativo fica abaixo do piso original de voo.

As peças estáticas e móveis usam instâncias por geometria/material; o buffer interno tem limite de pixels e a qualidade baixa reduz vegetação e sombras. A opção baixa continua usando a cena 3D. A arte de ícone não é usada como substituta para o cenário jogável.

## Arte de ícone

Modo: **generate** (imagegen). Saídas integradas: `games/ar/icon-192.png`, `games/ar/icon-512.png`; derivados de empacotamento em `games/ar/icon.svg` e `covers/ar.svg`. Apenas redimensionamento para instalação; composição da imagem gerada preservada. Nenhuma imagem externa de terceiros.

Prompt final:

> Use case: stylized-concept. Asset type: final square mobile game app icon for WAR Combate, a tactical war combat game. Create one exceptionally polished, premium, cinematic 3D game icon, square composition filling the canvas. Main subject: a powerful, realistic dark olive tactical soldier's helmet with subtle wear and a faceted smoked amber visor, shown in a confident three-quarter view, occupying roughly 65% of the image; no face visible. Backdrop: a detailed war-torn urban skyline with warm golden backlight, smoky dark blue atmosphere and a small distant attack helicopter silhouette, subordinate to the helmet. Professional game key art, believable steel, fabric, glass, controlled highlights, crisp silhouette, rich material detail and cinematic lighting. The icon must remain recognizable at 48 pixels; keep important subject inside the central 75% so Android adaptive icon cropping is safe. No words, letters, AR lettering, typography, borders, logos or watermarks. No blood, gore, real military insignia or resemblance to a known game franchise. Visually finished production artwork, not a vector pictogram, not flat geometric placeholder art. Opaque full background; 1:1 square.

## Verificação

- Testes unitários exercitam a projeção original contra a câmera real do Three, incluindo giro, inclinação, rolagem, câmera interna e externa e as duas orientações de tela.
- A comparação de posições confirma que renderizar não altera o avião, o trânsito, os alvos, os controles ou a munição.
- `tests/scenery-browser.mjs` abre os jogos reais no Chromium, exige contexto WebGL funcional, verifica alinhamento e captura porto, cidade, fortaleza, aeroporto, rio e tela vertical.
- Os testes de jogabilidade continuam verificando disparos, recarga, cobertura, toque simultâneo, direção, travamento de mira, aeronaves e helicóptero.
- A auditoria de publicação inclui os PNGs do ícone, o manifest, o renderizador e o Three local. Testes isolam serviços e não escrevem no Firebase de produção.

A verificação em Chromium não representa uma medição de desempenho em todos os modelos Android nem um teste de câmera física.

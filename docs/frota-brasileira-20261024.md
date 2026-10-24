# Frota brasileira — OTThi World

Escopo: substituir as carrocerias dos automóveis do mundo unificado. Fusca, inclusive o azul, permanece. Entram Golf IV, Opala SS, Chevette, S10, Hilux, Amarok e Saveiro Cross. Kombi, Gol quadrado e Uno permanecem. Caminhões de carga e bombeiros usam uma carroceria Constellation; viaturas e resgate mantêm suas funções. Karts, motos, aeronaves e os jogos originais mantêm seus motores próprios.

Os modelos são representações 3D autorais, com escala adaptada ao mundo existente. Não são digitalizações nem CAD de fábrica e não representam uma certificação de fidelidade dimensional. As carrocerias possuem aberturas de rodas, vidros, interiores, portas desenhadas e, nas picapes, caçambas abertas. As gerações de referência estão no catálogo do código. Não foram incorporadas malhas ou fotografias de terceiros.

## Integração

- IDs antigos, posse, moedas, cores, oficinas, danos e veículos estacionados continuam no mesmo save.
- Novas entradas da concessionária: `br-fusca`, `br-opala`, `br-s10`; demais modelos aproveitam IDs existentes. Catálogo: 19 veículos, incluindo as quatro motos anteriores.
- Modelos chegam aos veículos estacionados, trânsito urbano e rodoviário, carros dos NPCs, garagem e aparências recebidas online.
- A família usa assentos e escala específicos do modelo. O protocolo de aparência aceita as novas chaves e conserva a identidade do modelo no embarque.
- A exposição da garagem mantém o piso existente: vagas giradas, três colunas e seis filas. Veículos retirados para vagas operacionais não consomem outra vaga de exposição.
- Geometria é compartilhada entre instâncias; pintura e acessórios são de cada veículo.

## Referências visuais consultadas

- General Motors, Chevrolet Vintage: https://news.gm.com/home.detail.html/Pages/topic/us/en/2025/oct/1003-GM-Brazil-brings-classics-back-life-Chevrolet-Vintage-program.html
- Volkswagen, história do Golf: https://newsroom-br.itd.vw.com.br/news/2025
- Toyota, histórico da operação na América Latina: https://www.toyota-global.com/company/history_of_toyota/75years/data/automotive_business/sales/activity/latin_america/

## Validação

A evidência final desta revisão será registrada após a execução do fluxo de garagem e a conferência da publicação. Os testes locais usam Chromium; reprodução do protocolo online não equivale a uma partida entre dois celulares. A instalação física no Android não foi executada nesta revisão.

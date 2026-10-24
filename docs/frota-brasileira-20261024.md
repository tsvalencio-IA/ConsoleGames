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

- 194 testes de regras e regressões passaram. Incluem a retirada do quarto carro quando as três vagas estão ocupadas e a preservação da pintura local quando outro jogador usa o mesmo ID de veículo.
- Galeria Three.js renderiza 12 carrocerias: os 11 automóveis e o caminhão. Conferidos limites geométricos, rodas, pintura independente e geometria compartilhada.
- O fluxo móvel nativo percorreu os 11 automóveis pela garagem, entrada e saída com quatro personagens, cor, salvamento, recarga e recebimento da aparência de outro jogador com cor diferente.
- A inspeção abrangeu veículos estacionados, serviços, trânsito e NPCs; nenhum corpo de carro antigo ficou visível sobre a carroceria brasileira.
- Mantidos os testes de Fusca com família, pouso/desembarque/reembarque, tomada de trânsito e 2.326 amostras das vias. Atualização a partir da versão 705.20 preservou progresso e reabertura offline.
- A exposição mantém o piso anterior; os veículos são posicionados com outra orientação para acomodar as picapes.

Testes usam Chromium com renderização por software. A reprodução do protocolo não equivale a uma partida entre dois celulares. Não houve certificação de câmera, desempenho ou instalação física no Android nesta revisão. Evidência compacta: `qa-release-70521.json`.

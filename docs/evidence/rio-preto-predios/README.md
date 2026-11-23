# Rio Preto jogável na 705.28.38

A revisão `2acd628e8945175e` está na branch `feat/rio-preto-mapa-proprio`. O link abre o acesso principal a Rio Preto. [Prévia para compartilhar](https://otthi-world-campanha-teste-git-fea-3a8a43-thiaguinho-s-projects.vercel.app/games/otthi/?map=rio-preto) · [Branch](https://github.com/tsvalencio-IA/ConsoleGames/tree/feat/rio-preto-mapa-proprio)

- A malha possui 6.691 traçados de vias e caminhos e 27 locais com ações próprias. Um teste espacial conferiu as 2.463 portas adicionais geradas para os volumes cartográficos. Há 50 volumes sem porta verificada. Os interiores e as cinco residências modeladas são interpretações para o jogo. [OpenStreetMap](https://www.openstreetmap.org/copyright)
- Casas populares e casas no Damha têm portas, mobiliário e ações. A compra usa moedas do perfil. A suíte confirma cobrança única, registro de propriedade depois da recarga e integridade dos registros da Vila OT.
- No shopping, a loja de roupas e a sapataria usam o guarda-roupa de Thiago e Thamis. A suíte comprou a polo e o tênis, vestiu Thamis e conferiu o visual após recarregar. As lojas também abrem o editor de personagem.
- A Catedral tem bancos, obras estilizadas e altares laterais com interação. Na Zappa’s, a garçonete transporta o pedido até a mesa. O personagem ocupa a cadeira e paga ao consumir. O teste verificou a transferência do pedido, a pose sentada e o saldo.
- O Posto Brasília usa o tanque e o Gol do jogo. Na Cachoeira, a revisão foi feita com o Gol do jogo posicionado na baia e melhorou o componente do motor. A SOS Valêncio usa os dois elevadores, scanner, pátio e reboque da Vila. [Referência da Cachoeira](https://www.waze.com/live-map/directions/brazil/state-of-sao-paulo/sao-jose-do-rio-preto/cachoeira-super-troca-de-oleo?to=place.ChIJwx_AehOtvZQRzirbDhrtkXE)
- O terminal do aeroporto tem balcão e embarque. O teste decolou da pista 07/25 com o avião e os controles originais do Mundo Aberto. [DECEA · SBSR](https://ais.decea.mil.br/?codigo=SBSR&i=aerodromos) · [Terminal mapeado](https://www.openstreetmap.org/way/424901184)
- Polícia, ambulância e bombeiros completaram a ocorrência controlada na Rua Regente Feijó em cerca de 15,8 segundos de simulação. O histórico registra as três chegadas físicas e zero eventos de contingência naquele percurso. A Kombi percorreu a rua da entrega e a encomenda entrou no inventário uma única vez.

O Chromium executou os percursos locais em WebGL por software. O teste de prédios usou toque em 393 × 852 e verificou o voo em 844 × 390. Os testes de serviços usaram posições iniciais controladas e o relógio de simulação acelerado. No endereço da prévia, o teste fez a volta ao console pelos oito jogos, remou com o controle de toque e entrou no Canecão pela porta. A auditoria HTTPS comparou 183 arquivos. As verificações em aparelho Android físico, o multiplayer em Rio Preto e a exclusividade online das novas casas estão pendentes.

## Medição perto do Swift

O primeiro ensaio da 705.28.38 caiu para 4,25 e 4,09 quadros por segundo. Os modelos completos da família estavam ativos longe da casa. A revisão passou a montar a família ao se aproximar ou abrir a atividade e reutiliza os modelos de Thiago e Thamis.

O teste repetiu duas janelas de 15 segundos no Chromium com ANGLE SwiftShader, qualidade baixa, viewport de 393 × 852 e a mesma sequência de toques e giros. Cada revisão usou os próprios arquivos do mapa.

| Medição | 705.28.37 | 705.28.38 após o ajuste |
| --- | ---: | ---: |
| Quadros por segundo nas duas janelas | 11,27 / 9,53 | 10,53 / 9,26 |
| Tempo de quadro p95 | 179 / 187 ms | 189 / 197 ms |
| Quadros acima de 100 ms | 56 / 76 | 59 / 74 |
| Primeiro movimento após toque | 756 / 34 ms | 362 / 193 ms |
| Heap JavaScript após o percurso | 26,1 MB | 32,4 MB |

Os resultados variam entre janelas. O ensaio curto verifica o custo da cena controlada e deixa em aberto o desempenho em sessões longas de Android físico.

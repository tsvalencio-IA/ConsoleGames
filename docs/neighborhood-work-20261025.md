# Garagens, concessionárias e casas — R25.1

A atualização atende ao pedido de garagens maiores, três lojas físicas com exposição, casas utilizáveis e personagem visível pilotando motos. Mantém os 47 veículos possuíveis, 44 modelos distintos, IDs antigos, Fusca azul, pinturas, família, saldo e progresso existentes.

## Comportamento

- Garagem da casa ampliada de 3 para 6 vagas, em duas fileiras com saídas opostas. Geometria 14,4×9,2; nenhum veículo pesado disputa uma vaga residencial. Ônibus, carretas e Constellation têm H1/H2/H3 no Centro da Coleção. A migração de posições ocorre uma vez e só move veículos que estavam dentro da garagem antiga; carros estacionados no mundo mantêm sua posição.
- Todos os veículos próprios do catálogo estão na lista, com busca e filtros. Retirar, guardar, escolher principal e personalizar usam o estado nativo. Vagas lotadas devolvem o carro anterior para a coleção sem perder posse. A circulação a pé usa a largura e comprimento reais dos modelos; a direção conserva os cálculos nativos. A exposição antiga ao lado da residência foi retirada para liberar a rua. No Centro da Coleção, AÇÃO sobre o veículo guardado entrega a mesma identidade e permite sair dirigindo, sem cópia simultânea.
- OT Carros: centro(-345,11), área60×36, 31 modelos. OT Motos: (-270,26),48×34, 7 modelos. OT Caminhões: (-350,-54),70×64, 6 modelos. Cada loja tem entrada, balcão, expositores, placas de modelo/preço, colisões, catálogo e GPS. Compras debitam uma única vez, pedem confirmação e voltam à garagem nativa; o saldo e a posse são verificados novamente após a confirmação. Os modelos são preparados progressivamente perto do jogador.
- As três lojas e suas ruas pertencem ao layout mestre, com conexões ao GPS e à ponte existente. A abertura da cerca no Centro da Coleção mantém as vagas livres da alameda. Garagens foram verificadas em todos os dez lotes pessoais, inclusive junto à passarela.
- Casas nativas têm cozinha junto à parede, sala, cama, banheiro, móveis separados e entrada/corredor livres; luzes, tapetes, almofadas e detalhes adicionais. O painel físico da casa reúne nove atividades e acesso ao console e garagem. Comida, água, energia, higiene, diversão, baú e roupas continuam usando os sistemas existentes. Sofá e TV mostram o avatar sentado; mover, pular ou sair encerra a pose.
- Motos e bicicleta mostram o avatar selecionado sobre o banco, com braços voltados ao guidão. A altura é ajustada por avatar; sair restaura a caminhada. O mesmo tratamento de pose é aplicado a pilotos remotos, preservando os assentos e a família.
- AÇÃO não seleciona um cartão de loja ao soltar o mesmo toque que abriu o catálogo. A placa de garagem tem alcance curto para não tomar o lugar de Entrar no veículo.

## Verificação

225 testes Node passaram; layout mestre sem conflitos nos dez lotes, 2.510 amostras de continuidade de vias sem falhas. Teste por toque no Chromium móvel: 44 modelos reais expostos, compra em cada loja (Palio, BMW GS, carreta tanque), débito exato, busca/filtros, seis vagas, pesados separados, retirada direta da coleção, nove ações da casa e preservação de posse/saldo/família ao recarregar. Zero exceções de página. Renders conferidos por imagem. Teste de oito combinações de piloto/moto passou antes do ajuste final de alcance da placa; repetição do conjunto final em andamento.

O teste de frota está sendo adaptado à nova entrada física da loja e aos novos lados de acesso das seis vagas. A matriz final de condução/estacionamento será registrada nas evidências sem declarar um conjunto completo antes de terminar.

As verificações por navegador usam saves locais e reprodução local do protocolo, com saídas externas bloqueadas. Limite de renderização existe somente nos testes funcionais e não mede FPS. Não houve câmera física, sessão Firebase real ou teste em dois aparelhos. Nenhum APK novo é declarado por esta revisão.

A correção de câmera WAR publicada anteriormente está preservada: commit0c5bcd1416074b9c5aed8243a3f96c54b2b42301; câmera #52 e gameplay #180 passaram. O checkpoint desta revisão71da20560039fcce593a8cd9e7cf778f77064ba4 também passou nos workflows40183135378 e40183135353. A versão final terá seus próprios hashes e verificações.

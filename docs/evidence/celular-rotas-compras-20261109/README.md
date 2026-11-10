# Celular, motorista e encomendas — 9 de novembro de 2026

Solicitação: motorista sem ficar preso no trânsito, posição e rota até o jogador, guardar todos os veículos próprios disponíveis e compras pelo celular com entrega no mundo.

Publicado em https://otthi-world-campanha-teste.vercel.app/games/otthi/ . Acesso: Vida → Celular. Build `705.28.24-celular-entregas-garagem`, revisão `b41039decb7d7b28`, runtime `175ba82b7bdd46637cca6854a32517971d85200a`, produção READY `dpl_8EQ1N1WrnuiNaADb5Hz75rvUfPCA`.

## Alterações

- O motorista usa a faixa da estrada, confere os volumes reais dos carros, fica visível para o restante do trânsito e procura desvios locais quando bloqueado. Uma vaga de entrega ocupada pode ser substituída por outra próxima e segura. O jogador a pé que se afastar recebe um novo destino próximo. Não atravessa obstáculos nem salta para concluir a entrega.
- Mapa e minimapa mostram em laranja a posição do motorista, o caminho restante e a distância até a entrega. A tela do mapa atualiza o acompanhamento durante o trajeto; o botão Motorista/encomenda enquadra o percurso.
- A revisão anterior da garagem tinha substituído a lista de gerenciamento por uma lista sem ações. Foram restaurados os comandos individual e coletivo, incluindo unidades repetidas do mesmo modelo e clones de exposição. Veículos em uso, em atendimento ou em entrega mantêm o motivo do bloqueio, sem alterar dano, posse ou peças desmontadas.
- Mercadinho do celular usa os mesmos itens, quantidades e preços da loja física. Pedidos pagos continuam salvos até a chegada; o item entra no inventário ao receber a encomenda junto à van. O recibo impede repetir o recebimento. O entregador retorna ao ponto de saída depois da coleta.
- Compras de veículos pelo celular criam uma unidade com identidade própria, respeitam o limite existente de dez por modelo e só cobram quando a saída e a entrega são aceitas. A compra física na concessionária continua com seu fluxo existente.

## Verificação

428 testes unitários passaram. As sete tarefas da execução 42740140370 passaram, incluindo o novo fluxo nativo de rotas/compras, o fluxo anterior de carros/helicóptero/avião, atualização instalada, oficina com recarga, Kart e controles do WAR.

`result.json` contém o teste de um carro bloqueando a rota (um desvio, chegada concluída, maior deslocamento por atualização de 0,309 m), seis veículos próprios guardados, pedido de comida pago e preservado após recarga, concessão de duas unidades uma única vez e Palio comprado por 1185 moedas e entregue. Os três formatos 390×844, 844×390 e 360×740 passaram sem rolagem horizontal.

O relógio de simulação do teste mantém continuidade na recarga; nenhuma conta ou base de jogadores real foi utilizada. `http-integrity.json` comprova os 164 arquivos públicos. As imagens são do Chromium com perfil descartável e renderização WebGL por software, além da tela de entrada publicada. Não certificam câmera, temperatura ou FPS de um celular físico. A visualização 3D do navegador remoto interativo não abriu um contexto WebGL; a execução nativa do Chromium em CI concluiu os fluxos e produziu as capturas.

# Coleção OT — expansão de veículos

Versão: `705.25.0-brazilian-collection`, cache `70625`. Estado do save continua em V705, com as chaves e IDs anteriores preservados.

A garagem passa de 19 para 47 opções e o registro visual passa de 12 para 44 modelos. Mantém o Fusca azul aprovado e o Golf IV; acrescenta o Golf VII solicitado. Os quatro IDs antigos de motos permanecem válidos e passam a representar Factor 125, Titan 150, Hornet e XRE 300.

| Grupo | Modelos acrescentados |
| --- | --- |
| Clássicos e compactos | Veraneio, Blazer, Pampa, Escort XR3, Passat GTS Pointer, Tempra 16V, Maverick GT, Landau, Palio Fire Economy Celebration 2011 |
| Contemporâneos | Golf TSI 1.4 Turbo 2014, T-Cross, Peugeot 206, Jetta, Corolla 2007, Corolla 2021, New Civic 2011, BMW X1 F48, BMW M3 F80 |
| Esportivos | Ferrari 458 Italia e Porsche 911 Carrera, referências iniciais adotadas após perguntas opcionais sem resposta |
| Duas rodas | Mobylette, Factor 125, Titan 150, Hornet, XRE 300 confirmada pelo usuário, BMW GS e bicicleta Caloi 10 |
| Pesados | Ciferal Dinossauro, Attivi elétrico, Paradiso G8 DD, Scania com semirreboque de carga e com tanque de combustível |

Gol GTI ganha rodas orbitais com cinco aberturas, acabamento inferior e detalhes GTI. Opala SS recebe identificação e rodas de estilo clássico. As carrocerias são interpretações visuais estilizadas para o jogo; não representam CAD de fábrica nem equivalência percentual. A Ferrari usa uma malha detalhada de vicent091036, CC BY 4.0, distribuída pelo exemplo oficial do Three.js. Crédito, licença e adaptação estão acessíveis na garagem em `assets/vehicles-credits.html`. Three.js/Draco também têm licenças incluídas.

## Integração

- Centro da Coleção em `(-266, -55)`, fora da casa e da oficina, com acesso à rodovia e ponte sobre o canal. Ônibus e carretas são retirados em vagas maiores nesse centro. O GPS da garagem aponta para ambos os pátios.
- Veículos guardados distantes são construídos sob demanda; a coleção prepara até dois modelos por atualização. IDs, pinturas, carros existentes, progresso familiar e posições estacionadas são preservados.
- Rodas e direção usam a simulação nativa. Bicicleta tem pedais animados e ausência de motor; ônibus elétrico não usa o som de combustão. Carretas têm articulação, colisão ao longo do conjunto e ângulo salvo ao estacionar.
- Bancos, capacidade, aparência e cores seguem o modelo no cliente e no protocolo online. O ônibus aceita a família completa e três convidados sem dobrar os últimos assentos sobre o mesmo lugar. Veículos sem espaço avisam e mantêm o grupo selecionado.
- Modelo detalhado e decodificador são locais, carregados sob demanda e recarregáveis offline após a primeira carga. O manifesto inclui seus hashes sem torná-los downloads obrigatórios na abertura.

## Verificação

Evidências: `docs/evidence/fleet-expansion-20261025/`.

- 42 veículos passaram pelos fluxos nativos de compra/retirada, entrada, direção, saída, pintura remota independente e estacionamento. O teste aguardava visibilidade de um pesado distante antes de chegar ao pátio; o culling o ocultava corretamente. Após ajustar essa espera no teste, os cinco pesados passaram na retomada focada. Cobertura distinta de 47 opções, sem alegar uma única execução ininterrupta de 47.
- Auditoria rodoviária passou com a ponte de acesso. Coleção de 47 veículos e progresso foram restaurados após recarregar.
- Galeria real WebGL de frente, perfil e traseira passou nos 44 modelos: rodas, bancos, geometria finita e máximo de 24 chamadas de desenho por veículo. Geometria de pintura do Fusca comparada byte a byte com a publicação anterior, sem alteração.
- Cliente nativo validou família de quatro no ônibus, três convidados aceitos e um quarto recusado, preservação do grupo ao tentar veículo pequeno e movimento de passageiro no último banco após família e convidados do motorista.
- Worker real recarregou Ferrari/Draco sem rede; quatro arquivos mantiveram SHA-256 idêntico. Suíte geral: 221 testes aprovados. Suíte focada de capacidade/descritor: quatro aprovados, sendo um novo além dos três já contidos na geral.
- Build modular e empacotamento dos sete jogos preservados passaram.

Limites: testes locais e reprodução do protocolo online; não constituem teste de duas conexões Firebase reais, câmera física, FPS sustentado no celular ou instalação Android. Nenhum novo APK foi gerado nesta expansão.

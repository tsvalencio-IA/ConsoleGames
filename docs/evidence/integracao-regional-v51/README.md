# Integração regional OTTHI World 5.1

## Rio Preto viva e Teixeirão na 705.28.35

A prévia `705.28.35-rio-preto-cidade-viva` está na revisão `c99308df40f88a4a`, commit `8e54835`. O build foi verificado em 182 arquivos hospedados. [Abrir o Mundo Aberto](https://otthi-world-campanha-teste-git-fea-522713-thiaguinho-s-projects.vercel.app/games/otthi/) · [Registro da prévia](previa-7052835.json)

- O campo já jogável da cidade recebeu o Teixeirão. A representação estilizada usa arquibancadas de concreto em vermelho, quatro torres e placar ligado à partida. O portal do futebol, a pista de atletismo e as coordenadas do campo conservaram os contratos existentes. O destino aparece em **Menu → Mundo/GPS → Rio Preto e região → Rota dos Estádios Regionais**. [América Futebol Clube](https://www.americasp.com/historia) · [Vistoria da Federação Paulista de Futebol](https://conteudo.fpf.org.br/laudosestadios/Laudo%20Engenharia-%20S%C3%A3o%20Jos%C3%A9%20Rio%20Preto-%20Est.%20Benedito%20Teixeira-%2020-01-24.pdf)
- Catedral São José, Mercadão, Calçadão, Paço e o restaurante da Andaló ocupam ruas da cidade existente. O cadastro preserva os 42 pontos e inclui 29 novas atividades de local, além dos acessos nativos para compras, futebol, corrida e serviços. A ambientação adapta os endereços e as fachadas ao mapa. Os trabalhos encenados nas entradas, como preparar a sessão do Swift, usam comandos a pé.
- O navegador confirmou 16 moradores, com quatro corredores, nove animais e dez carros adicionais nas rotas. Nos retornos do teste, o jogo reutilizou os 83 objetos agrupados dos setores e manteve as contagens dos novos atores. A atividade do Swift acendeu as luzes, concedeu XP uma vez e persistiu após recarregar. [Resultado do navegador](cidade-viva-7052835.json)
- A partida automatizada começou pelo botão Ação na entrada do Teixeirão. O cenário de chute foi preparado perto da área para exercitar o comando nativo, o gol, o placar físico e o encerramento dos 150 segundos simulados. A corrida a pé preservou os seis checkpoints e o recorde. O navegador também conferiu o acesso da Represa em quatro tamanhos de janela. [Resultado do navegador](cidade-viva-7052835.json)
- Na prévia hospedada, o botão Jogar em Rio Preto abriu na Represa. O GPS traçou 25 pontos de rota até o Teixeirão, e o modo solo abriu na entrada do estádio. A migração da 705.28.34 preservou moedas, XP e o grupo da família, incluindo a reabertura offline em Chromium. [Captura do estádio](teixeirao-7052835.jpg) · [Teste hospedado](previa-jogavel-7052835.json) · [Atualização](atualizacao-7052835.json)
- Os 591 testes Node passaram. A prévia abriu os oito jogos pelos cartões e pelos links diretos, voltou ao mesmo console e preservou o favorito cadastrado. [Navegação e console offline](console-7052835.json)

O exercício de futebol e as tarefas da cidade foram conferidos em Chromium com perfis descartáveis. Android físico e futebol online via Firebase entre dois aparelhos continuam pendentes.

O comparativo de 30 s partiu do mesmo ponto e aplicou o mesmo comando nas duas versões, em Chromium com SwiftShader no Linux e viewport de 393 × 852. A mediana passou de 267 para 295 ms entre quadros e o p95 de 598 para 745 ms. O heap JS no fim passou de 91,0 para 92,6 MiB. O teste mede uma janela por versão sob renderização por software. O resultado pede validação prolongada e em Android físico. [Medição antes e depois](fluidez-7052835.json)

## Acesso direto a partir da 705.28.34

O botão **Jogar em Rio Preto** aparece na tela inicial da prévia e abre na Represa, de frente para o Complexo Swift. **Jogar** e **Continuar** abrem na posição salva. O catálogo dos 42 pontos continua em **Menu → Mundo/GPS → Rio Preto e região**.

A revisão `13e1ff4b60de2ba5`, commit `48d42b5`, foi conferida no endereço hospedado em Chromium. O botão abriu o cenário 3D com moedas e XP preservados e foi acionável em quatro tamanhos de tela emulados. A atualização da 705.28.33 abriu offline após migrar o service worker. Os 182 recursos da prévia passaram na auditoria HTTPS. A produção permaneceu na 705.28.30. [Prévia atualizada](https://otthi-world-campanha-teste-git-fea-522713-thiaguinho-s-projects.vercel.app/games/otthi/) · [Captura do Complexo Swift](chegada-swift.png) · [Chegada hospedada](chegada-hospedada.json) · [Teste de navegação local](entrada-direta.json) · [Atualização](atualizacao-7052834.json)

## Base da integração 5.1

A versão de referência é a 705.28.31 de `fix/integracao-console-20261120`, commit `8ad9625`. A branch de trabalho partiu da 705.28.32, commit `11c13ff`, descendente da referência, para aproveitar os bairros, o guarda-roupa e o progresso da expansão anterior. O build integrado é `705.28.33-integracao-regional-v51`, revisão `1e6889e1f4e2d6fe`, commit `f43b39e`. A produção foi conferida na 705.28.30, revisão `72c84d2063641ce2`. [Código alterado](https://github.com/tsvalencio-IA/ConsoleGames/compare/11c13ffda71f6a0d0732a7e27f82ecdc3b9095e1...f43b39eb2df46c075d73c4d0ebc997865be00b97) · [Mundo Aberto de teste](https://otthi-world-campanha-teste-git-fea-522713-thiaguinho-s-projects.vercel.app/games/otthi/) · [Console de teste](https://otthi-world-campanha-teste-git-fea-522713-thiaguinho-s-projects.vercel.app/arcade/)

## O que entrou no jogo

- **42 locais em 11 setores.** O catálogo do laboratório alimenta a expansão do mapa em **Menu → Mundo/GPS → Rio Preto e região · 42 locais**. Os setores usam a malha viária e o GPS do jogo. A geometria aparece por proximidade e fica invisível à distância. Cada local se liga a um ponto de navegação. As coordenadas no jogo são adaptadas. Há 40 referências estilizadas e duas criações fictícias, as Montanhas Rios de Itália e a Praia de Cedral. A identidade e o endereço de referência vieram do anexo. As fachadas, as dimensões e a posição no jogo são interpretações. As fontes do anexo não equivalem a um levantamento arquitetônico.
- **Corrida a pé da Represa e Damha.** A Portaria Damha abre a largada. O caminho acompanha as margens em terra firme, com contagem regressiva, seis checkpoints na ordem, cronômetro e melhor tempo salvo. A atividade usa o personagem e a movimentação do Mundo Aberto.
- **Mirassol e Cedral no Kart Legends.** Os traçados do laboratório foram convertidos em curvas, setores e minimapas do motor do Kart Legends. Cada pista tem três voltas no modo solo e quatro rivais nativos. O circuito de Cedral tem uma chicane e curvas próprias. Os antigos paddocks no Mundo Aberto dão acesso à respectiva fase. Os tempos feitos na 705.28.32 permanecem no perfil do Mundo Aberto. Os tempos novos ficam no progresso do Kart Legends.
- **Moletom e fones de ouvido.** A prévia e os encaixes usam os modelos articulados de Thiago e Thamis. Jaquetas, bonés, óculos, mochilas e relógios já existentes continuam disponíveis. As novas opções são gravadas no mesmo perfil de visual.

O anexo de SHA-256 `cdc439dcc642f1b3b651412aa1b4c70a42621b6ece5aa9389f292443ac4c626c` é a fonte do cadastro, das proporções de referência e dos traçados regionais. O manifesto anexo orientou a separação entre jogos. O manifesto efetivo é `games/otthi/src/module-order.json`, com os hashes regenerados por `games/otthi/tools/build_project.py`.

## Interações e dependências

Os comércios de alimentos usam o balcão, a carteira e o estoque nativos. Casa Nicoletti e Planalto abrem o catálogo de materiais e ferramentas do jogo. Prefeitura e aeroporto abrem o catálogo de missões cívicas e a Academia de Aviação. A Portaria abre a corrida a pé. Os paddocks usam a viagem já existente do console.

Os demais pontos oferecem visita e informação de referência. Interiores próprios de shoppings, teatros, clínicas e estádios, programação de rodeios, parque aquático jogável, abastecimento específico e atendimento de agentes em bases fictícias dependem de conteúdo ou contratos próprios. Essas interações do protótipo seguem pendentes. O cadastro e a visita permanecem disponíveis. Configuração, regras e identificadores do Firebase continuam os mesmos.

## Verificações

- **590 testes automatizados aprovados.** A auditoria cobriu a topologia do GPS, as 42 chegadas, colisões estáticas das novas construções, áreas protegidas e amostras do trajeto a pé. As 7.249 verificações de sinalização mantiveram o resultado da busca anterior. A suíte inclui as copas existentes, autenticação local, preservação das roupas e foto de balão. [Saída da suíte](testes-node.txt)
- **Mundo Aberto no Chromium.** O teste chegou aos 42 pontos preparados e obteve a interação nativa de cada um. Os 11 setores chegaram a 75 objetos visuais agrupados e a contagem ficou igual ao retornar aos setores. O personagem percorreu 327,5 m pelos seis checkpoints em ordem. O cronômetro marcou 28,82 s e o resultado sobreviveu à recarga. O perfil guardou também os recordes anteriores, moletom e fones. O trajeto foi dirigido por entrada virtual no sistema nativo de movimento e colisões a 60 Hz controlados. [Resultado](mundo-e-corrida.json) · [Captura](represa.png)
- **Kart Legends no Chromium.** O teste abriu as novas fases pelo menu original, completou três voltas por pista com quatro rivais e recarregou os dois recordes e a garagem. O piloto automatizado terminou em quinto nas duas corridas. Foram 49,80 s em Mirassol e 48,93 s em Cedral na simulação de 60 Hz. A tela de resultado foi conferida em retrato, paisagem e desktop emulados. [Resultados](kart-legends.json)
- **Navegação e atualização.** Os oito jogos abriram e voltaram ao console da prévia hospedada. Os dois portais abriram apenas a fase correta no Kart Legends e voltaram ao Mundo Aberto com o perfil preservado. O navegador instalou o novo service worker sobre a 705.28.32 e abriu offline com progresso preservado. O build local conferiu 177 recursos do manifesto. No endereço hospedado, coincidiram os 182 arquivos da auditoria integrada. [Oito jogos](catalogo.json) · [Portais](portais.json) · [Atualização](atualizacao.json) · [Hashes HTTPS](https.json) · [Deploy de prévia](previa.json)

As corridas automatizadas usaram perfis descartáveis e renderização contida. Câmera real, rotação do Android, desempenho e temperatura sustentados, instalação física e multiplayer via Firebase entre aparelhos permanecem fora dessa homologação.


### Fluidez e memória no navegador

A comparação usou Chromium 141.0.7390.37 em Linux com WebGL via SwiftShader, dois núcleos de cota, área de 393 × 852 e qualidade baixa. Cada medição executou 45 s de renderização contínua com o mesmo controle, partindo das mesmas coordenadas na Represa. O ensaio passou pelas duas versões no mesmo ambiente.

| Medida | 705.28.32 | Prévia 705.28.33 |
| --- | ---: | ---: |
| Intervalo mediano entre quadros | 147,6 ms | 144,5 ms |
| Intervalo p95 entre quadros | 413,2 ms | 409,2 ms |
| Intervalos acima de 250 ms | 47 | 51 |
| Heap JS no início da janela | 88,7 MiB | 101,1 MiB |
| Heap JS no fim da janela | 103,8 MiB | 115,6 MiB |
| Geometrias WebGL no fim | 1.013 | 1.039 |
| Texturas WebGL no fim | 199 | 204 |

A distribuição dos quadros ficou próxima neste ensaio, com mais pausas acima de 250 ms e maior heap observado na prévia. Os números descrevem uma janela curta com renderização por software. A medição não estabelece FPS no Android nem exclui vazamentos em sessões longas. [Medição](fluidez-e-memoria.json) · [CI integrado concluído](https://github.com/tsvalencio-IA/ConsoleGames/actions/runs/44978468375)

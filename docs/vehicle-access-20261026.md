# OT World — destinos e embarque, 26/10/2026

Problema: a praia não podia ser selecionada pelo atalho devido ao identificador sobrescrito, a neve ficava sob o gramado, não havia lanchas no mar e o acesso às aeronaves e ao WAR não era claro.

## Implementação

- MUNDO / GPS usa o botão existente, com destinos para as duas aeronaves, praia, marina e neve. Os cartões definem o GPS nativo; não teleportam o jogador.
- Avião e helicóptero continuam físicos na Base Aérea, com embarque por AÇÃO, pouso, desembarque e estacionamento persistente. A sinalização acompanha a aeronave estacionada.
- Três lanchas com casco em V, cockpit aberto, propulsor, volante e quatro posições para a família. Navegação no oceano, frenagem, limite de margem/mapa, colisão com píer/outras lanchas, retorno ao píer e posição persistida por embarcação. O barco de pesca do lago continua separado.
- Neve acima do gramado, asfalto preservado, área ampliada, chalés, pinheiros, boneco de neve e precipitação local. A praia tem acesso pela orla e píer conectado ao terreno.
- WAR Combate tem entrada no diretório para abrir o seletor existente. Corpo, mãos, brinquedo, controle de toque, agachamento e trava antes do disparo da versão anterior foram preservados. Instrução antiga de avanço obrigatório foi corrigida.
- Carros: alinhamento das luzes com o capô curvo, proporções de Gol/Golf/Opala, lente única dos faróis do Palio e vidros menos transparentes. Catálogo, IDs, garagem e direção do lado esquerdo mantidos. Fusca aprovado preservado; Ferrari importada preservada.

Os carros continuam sendo modelos autorais aproximados: estas correções não os transformam em CAD de fábrica nem constituem aprovação de fidelidade de toda a frota. Referências consultadas: [Golf VII, Volkswagen Classic](https://www.volkswagen-newsroom.com/en/golf-7-20122019-20035), [linha Fiat 2011, acervo oficial](https://www.media.stellantis.com/br-pt/fiat/press/fiat-automoveis-traz-novidades-em-sua-linha-2011). Nenhuma fotografia de referência foi redistribuída.

## Verificação

- 240 testes de regras passaram.
- Galeria dos 44 modelos: geometrias válidas, contagem de rodas/assentos e até 25 chamadas de desenho; geometria de pintura do Fusca igual à publicada antes desta alteração.
- `world-destinations-browser.mjs`: cartões de GPS, embarque pelo AÇÃO, voo/pouso do helicóptero, avião estacionado, lancha conduzida por teclas, bloqueio de desembarque no mar, retorno ao píer, reembarque, família e recarga do save. Reprodução local do protocolo online verifica o modelo da lancha e o acompanhamento do passageiro.
- `public-destinations-browser.mjs`: compara hashes da versão publicada, opera a interface mobile, confere embarque e destinos, entrada do WAR, neve, ondas, PWA, modelos reais de mãos/corpo com imagens estáticas oficiais e integridade do instalador existente.

Os testes usam Chromium isolado. Não certificam câmera física, Android físico, alto-falantes ou dois aparelhos online. Não houve leitura de salas/jogadores reais, mudança de regras Firebase ou novo APK; o invólucro Android existente abre o aplicativo web atualizado.

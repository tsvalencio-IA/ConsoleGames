# Verificação R27.1

- 257 testes Node aprovados, zero falhas. Incluem a matriz das sete novas missões nas três dificuldades, individual/dupla, e cinco regressões de recuperação do teleférico e salvamento dos elevadores.
- `workshop-bays.json`: duas vagas restauradas com veículos diferentes e componentes separados; baixar somente a primeira e reabrir preserva a segunda erguida, incluindo o componente removido.
- `civil-multiplayer.json`: dois clientes nativos completam a missão da praia, sem um jogador concluir a parte do outro; dois usuários ocupam boxes diferentes; duas famílias ocupam oito assentos; troca de autoridade preserva os passageiros; uma família desconectada libera as vagas; o convidado recebe crédito da sua missão individual após desembarque confirmado; uma conexão recuperada consegue desembarcar após a reserva expirar.

Os navegadores usam saves descartáveis. O transporte de rede é um relay local com identidades isoladas; Firebase de produção, contas e regras não foram modificados. A renderização é limitada no cenário funcional, mas a captura visual chama o renderer nativo. Câmera física, áudio no Redmi Note 14, FPS sustentado e dois celulares online não são declarados homologados.

Na verificação anterior, as sete aeronaves civis/balão executaram embarque com família, pouso, desembarque e persistência ao recarregar. Cinco missões físicas e o teleférico executaram suas etapas; a primeira verificação integral descobriu o defeito de bootstrap dos boxes, corrigido e coberto pelo teste específico acima.

O smoke dos jogos originais encontrou timeout na corrida completa do kart e uma falha de deriva após soltar o toque. Os arquivos do kart original não foram alterados nesta revisão. Não há declaração de que todos os jogos estejam 9,5/10.

Atualização posterior: a revisão `docs/kart-precisao-20261027.md` trata a colisão indevida e repete as corridas completas. A evidência desta pasta continua sendo o registro histórico da R27.1.


## Publicação conferida

R27.1 publicada em https://otthi-world-campanha-teste.vercel.app/games/otthi/ pelo deployment `dpl_3t1FMWoDz416f89NsXgYEv5uNSBL`, com o código do commit `e68021597b7876229b6e8d68d8b0b62cb4b030df`. Build `705.27.1-mundo-familia`; revisão `bdeccca31a011319`.

- `native-world.json`: a execução integral, após a correção do bootstrap, concluiu as cinco missões físicas, ida/volta do teleférico com família, elevadores, áudio por perfil e recarga do save sem erros.
- `public-resources.json`: os 59 recursos publicados têm o SHA-256 esperado. O APK público retornou HTTP 200, 57.991 bytes e SHA-256 `8ea2f38c966ee3b938dab2362569ef0224488ab5748c6e9ba1accb0336c0fc49`.
- `public-ui.json`: o endereço público abre o mundo, apresenta as sete missões e cria uma missão; 19 casas novas, nove balões NPCs, auditorias geométricas aprovadas e nenhuma rolagem horizontal em 393×852. A imagem publicada usa um frame do renderer nativo.
- `android-download.json`: download confirmado por gesto real em retrato, paisagem, desktop, sem JavaScript e com service worker instalado, além do acesso pela entrada do console. Instalação física do pacote não é declarada. O binário do wrapper foi preservado; o mundo é atualizado pela web.

As imagens são capturas do próprio jogo; não são imagens geradas.

# Verificação R27.1

- 257 testes Node aprovados, zero falhas. Incluem a matriz das sete novas missões nas três dificuldades, individual/dupla, e cinco regressões de recuperação do teleférico e salvamento dos elevadores.
- `workshop-bays.json`: duas vagas restauradas com veículos diferentes e componentes separados; baixar somente a primeira e reabrir preserva a segunda erguida, incluindo o componente removido.
- `civil-multiplayer.json`: dois clientes nativos completam a missão da praia, sem um jogador concluir a parte do outro; dois usuários ocupam boxes diferentes; duas famílias ocupam oito assentos; troca de autoridade preserva os passageiros; uma família desconectada libera as vagas; o convidado recebe crédito da sua missão individual após desembarque confirmado; uma conexão recuperada consegue desembarcar após a reserva expirar.

Os navegadores usam saves descartáveis. O transporte de rede é um relay local com identidades isoladas; Firebase de produção, contas e regras não foram modificados. A renderização é limitada no cenário funcional, mas a captura visual chama o renderer nativo. Câmera física, áudio no Redmi Note 14, FPS sustentado e dois celulares online não são declarados homologados.

Na verificação anterior, as sete aeronaves civis/balão executaram embarque com família, pouso, desembarque e persistência ao recarregar. Cinco missões físicas e o teleférico executaram suas etapas; a primeira verificação integral descobriu o defeito de bootstrap dos boxes, corrigido e coberto pelo teste específico acima.

O smoke dos jogos originais encontrou timeout na corrida completa do kart e uma falha de deriva após soltar o toque. Os arquivos do kart original não foram alterados nesta revisão. Não há declaração de que todos os jogos estejam 9,5/10.

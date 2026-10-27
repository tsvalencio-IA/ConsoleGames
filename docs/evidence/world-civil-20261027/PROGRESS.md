# Revisão civil — trabalho em andamento

Pedido de Thiago: melhorar motores, NPCs em todas as regiões, estradas, gráficos e Palio; retirar operação militar e missões antigas; manter e melhorar polícia/bombeiros; retirar atividades digitais da oficina, colocar dois elevadores; novas casas, balões e teleférico; missões individuais e cooperativas coerentes.

Base pública preservada: `228b9e98e988e90ddea88a30206ebf117d3b4337`.
Este checkpoint **não é uma publicação** e não certifica todos os fluxos.

Implementação em revisão:

- Som procedural de combustão por perfil, câmbio/carga/rotação; substitui o mesmo sample repetido em todos os carros do mundo.
- Malha de conexões civis e bairros no layout/roteamento únicos.
- 19 casas visitáveis com os interiores nativos; moradores e novas atividades na praia, neve e serra.
- Três balões pilotáveis adicionais e seis balões NPC adicionais.
- Teleférico físico entre Vale e Mirante, duas cabines e reservas de lugares no canal compartilhado.
- Um único diretor de sete missões civis, solo e dupla, três dificuldades, etapas ordenadas, temporização, deduplicação, participação individual e merge de progresso.
- Dois elevadores usando a manutenção, desmontagem, mecânicos e sincronização existentes.
- Guardas de mundo civil bloqueiam o modo militar no unificado; aeronaves civis mantêm controles, família e estacionamento.

Evidência atual: abertura nativa do mundo confirmou 32 casas no total, 19 novas casas interativas, nove balões NPC e diretório de missões. Quatro testes de lógica passaram, incluindo 42 combinações de missão/modo/dificuldade, ordenação, trabalho de cada parceiro e merge de ações.

Pendências antes de publicar: animações e fluxos completos das novas tarefas; teleférico/família/dois clientes; dois elevadores/reload/multiplayer; auditoria geométrica real de vias; perfil de desempenho; Palio com comparação visual; escopo de retirada de entradas militares no console; regressão dos demais jogos e verificação pública. Câmera física e rede entre celulares reais não certificadas.

Os arquivos `world-civil-debug.mjs` e logs temporários não fazem parte do produto nem desta evidência.


## Checkpoint de validação R27.1

- 252 testes de regressão passaram, mais cinco testes de recuperação de teleférico/oficina.
- Cinco missões físicas (praia, neve, entregas, bombeiros, polícia) e as duas viagens de teleférico passaram. O teste integrado identificou a perda do estado dos boxes no bootstrap: corrigida com gravação adiada e cobertura específica de recarga em andamento.
- Dois clientes completaram a missão da praia, oito assentos distintos de duas famílias, troca de autoridade e crédito de viagem solo no cliente convidado. Cada participante teve de cumprir seus próprios objetivos.
- Sete aeronaves civis/balão passaram por embarque, família, pouso/desembarque e recarga das posições salvas.
- Dois boxes ocupados por usuários diferentes foram preservados no cenário compartilhado. Render dos modelos continua estilizado; não é réplica CAD.
- Sem publicação até completar as verificações finais. Android físico, câmera de usuário e rede entre dois celulares não foram homologados.

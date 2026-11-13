# Entregas e oficina — 11–12/11/2026

A correção de colisão troca a leitura isolada de `npcCollectedAt` pelo predicado existente que considera o serviço atual, a posse e a utilização do carro. Um NPC devolvido continua fora da malha física; se voltar para novo serviço ou for utilizado pelo jogador, volta a ser obstáculo para o motorista. A regressão de colisão falha na base e passa na candidata, incluindo posse, reivindicação local e carro conduzido pelo jogador. Os arquivos `collision-before.txt`, `collision-after.txt` e `collision-comparison.json` distinguem esse teste de VM dos testes de navegador.

O celular agora explica que recarregar interrompe o motorista terrestre, preserva o veículo e permite outro chamado. Isso não altera a regra de persistência. Encomendas pagas usam o fluxo existente de retomada automática e recebimento único.

A construção nativa de veículos já usa a posição salva. Nenhuma alteração de restauração de posição foi mantida; o teste de navegador verifica essa regra existente pelo fluxo real de compra, recarga e novo chamado.

Os resultados finais de navegador são registrados nesta pasta. Usam perfis descartáveis, relógio e deslocamentos de teste; compra, cobrança, propriedade, serviço, retirada, colisão, salvamento e recarga executam o código nativo. Não usam contas reais, não verificam permissões do Firebase de produção e não medem desempenho físico.

`vehicle-reload-final.json` registra a compra nativa do Palio, um único débito, identidade única, recarga durante o percurso, preservação de propriedade/posição, mensagem de interrupção, novo chamado e chegada. O teste não substitui o construtor real nem posiciona o carro para passar a verificação de origem. A posição do jogador e o relógio são fixtures declaradas.

A primeira tentativa da oficina excedeu 30 segundos na captura de imagem, antes das assertivas de devolução; esse resultado permanece em `initial-workshop-capture-timeout.json`. A repetição funcional usa `OT_WORKSHOP_CAPTURE=0`: omite renderização/capturas, mantendo as mesmas assertivas de reparo, retirada dos seis NPCs, liberação da vaga, tráfego, preservação do carro desmontado do jogador, economia e recarga. Seu resultado é identificado separadamente.

A primeira repetição funcional ainda saltava fases inteiras do relógio em apenas nove atualizações e terminou com clientes na fila; a falha fica em `coarse-clock-workshop-failure.json`. O teste passou a atualizar a fila a cada segundo, por uma sessão limitada a dez minutos de relógio simulado, mantendo todas as assertivas. `workshop-functional-final.json` e seu log registram os seis clientes devolvidos, vaga e reivindicações de trânsito liberadas e carro do jogador/economia preservados após recarga. Não houve mudança no código da oficina para obter esse resultado.

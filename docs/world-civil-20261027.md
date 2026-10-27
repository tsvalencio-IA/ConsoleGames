# Mundo OT — R27.1 (27/10/2026)

O mundo unificado passa a priorizar convivência, exploração e serviços civis. Polícia e bombeiros continuam ativos. As operações militares, seus checkpoints e a antiga sequência de capítulos não são iniciados neste mundo.

## Alterações

- Sete missões atuais: praia/reciclagem, cobertores na neve, teleférico, entregas aos vizinhos, treinamento dos bombeiros, travessia com a polícia e festival de balões. Três dificuldades e escolha individual ou dupla online. A dupla só avança quando cada participante executa sua parte.
- Teleférico com duas cabines, embarque, espera com cancelamento, oito assentos compartilhados, família acompanhando o usuário, desembarque em estação e recuperação após desconexão. Uma viagem individual do convidado só recebe crédito após confirmação da chegada.
- Dezenove casas/chalés visitáveis, novos moradores na praia, neve e montanhas; vôlei, castelos de areia, jardinagem, patinação e trenós. Mais seis balões NPCs e três balões pilotáveis, além dos anteriores.
- Ligações viárias entre neve/serra, mata/praia, serra/Aurora e aeroporto/rodovia sul, mais ruas de bairros e acesso ao teleférico. As vias usam o mesmo grafo do GPS e a mesma altura física do terreno.
- Dois boxes de oficina com elevadores, mecânicos, veículos e componentes independentes. O bootstrap preserva o estado salvo até os carros existirem. Uma interrupção durante movimento recupera uma posição de repouso; o fim do movimento grava o estado. Os veículos dos dois boxes entram no protocolo de visualização compartilhada existente. As ações comerciais da thIAguinho Soluções foram retiradas da oficina.
- Motores passam a usar perfis de combustão, cilindros, RPM, carga e trocas de marcha, em vez de transpor uma gravação para quase toda a frota. Há perfis próprios para monocilíndrica, Hornet, BMW GS, Fusca/Kombi, seis cilindros, V8, diesel, elétrico e aeronaves. São sons procedurais originais, não gravações reais de cada modelo.
- Palio Fire Economy 2011: fechamento e curvatura dos painéis, capô, colunas, lanternas, acabamento e calotas. Continua sendo um modelo estilizado criado por geometria, não um modelo CAD. O Fusca e a frota existente foram preservados.

## Validação e limites

A cobertura inclui 42 combinações da lógica das sete missões (três dificuldades, solo/dupla), prevenção de duplicação e etapas indevidas, preservação na nuvem, recuperação do teleférico, persistência dos boxes, física de voo e integridade do PWA. Os testes de navegador usam saves descartáveis e transporte local; não escrevem em contas ou salas reais.

Os relatórios finais ficam em `docs/evidence/world-civil-20261027/`. As inspeções alteram apenas deslocamento de teste, relógio e orçamento de renderização; as ações, missões, elevadores e aeronaves usam os controladores nativos. Não há certificação de FPS no Redmi, câmera física, áudio no alto-falante Android ou rede entre dois celulares.

Os jogos originais do console foram preservados. O teste completo do kart original apresentou falhas de corrida/deriva no navegador de software; esta entrega não declara todos os jogos aprovados nem atribui nota 9,5/10. O kart integrado do mundo mantém sua física e seus controles existentes.

# Evolução do console 705.28.20

Esta revisão conserva a publicação `d69afb6`, incluindo presença de pouso, velocidades, validação de desembarque e reutilização de helicópteros e aviões por outro jogador. As configurações e regras Firebase não foram alteradas.

| Área | Comportamento implementado | Evidência |
|---|---|---|
| WAR | A esquerda anda e gira; a direita mira e atira por pinça. Cada mão interrompe seu próprio comando ao desaparecer. | `dual-hands.json` |
| Câmera anterior | Corpo e mão, controles por toque, teclado e gamepad continuam disponíveis. | Testes de câmera e gameplay |
| Celular | Em Vida → Celular, veículos próprios chegam com motorista; helicópteros chegam com piloto e aviões com a equipe de transporte, em vaga do aeroporto. | `phone-and-delivery.json` |
| Frota | A mesma aeronave desocupada pode ser usada por outro jogador; pedidos atrasados não cancelam uma entrega nova. | `aircraft-reuse.json` |
| Voo livre | Pista acessível, orientação de aproximação, pouso, frenagem e nova decolagem. O avião permanece nivelado no solo. | `runway-cycle.json` |
| Dança | Instrução de enquadramento e correção por movimento; mãos fora do quadro não recebem crédito; suavização visual conserva a pontuação original. | Testes de dança por corpo e modelo real |
| Tênis | Filtragem adaptativa, velocidade real do pulso e calibração interrompida quando a detecção é insuficiente. | Testes de motor e gameplay |
| Saveiro | Construção de peças ocultas evitada; rótulos estáveis deixam de ser reescritos a cada quadro. | `vehicle-comparison.json` |

A medição com carro operacional manteve a mesma trajetória e 100% de integridade antes e depois. A entrada medida passou de 26,1 ms para 5,8 ms; as reescritas dos quatro controles durante 120 quadros parado passaram a zero. O comparativo usa a revisão histórica indicada no JSON. O FPS de renderização por software não apresentou ganho consistente e não comprova a fluidez em um celular físico.

As verificações usam perfis descartáveis, serviços isolados e os motores nativos. Não medem temperatura, FPS sustentado, ergonomia, latência ou sensores em Android/iPhone físicos; não certificam o cache já instalado no aparelho do usuário.

`verify-public.mjs` compara por SHA-256 os arquivos do manifesto e os componentes alterados do console no endereço HTTPS publicado. O resultado de aceitação pública será registrado após a publicação.

O teste da entrega registra os presentes de oito moedas concedidos pela rotina nativa dos NPCs. A variação do saldo deve corresponder exatamente a esses créditos observados, mantendo as verificações de propriedade e integridade.

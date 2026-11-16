# ConsoleGames — Prévia integrada 16/11/2026

Branch: preview/console-educacao-integrado-20261116

Base preservada: continuação V705.28.29 / f2c2112, incluindo os oito jogos do console e todos os IDs de Firebase. Alterações foram construídas SOBRE a prévia de carregamento 55d6fcd. Nenhuma mudança na produção, usuários, dados, autenticação ou regras do Firebase.

## Entrega de código

- OTTHI World: início com 8 buckets de shader e fallback completo de 15 via parâmetro cameraFull=1, 44 veículos preservados, 12 vistas possíveis e fim adaptativo das vistas de aquecimento somente após pelo menos 7 vistas e 3 sem novos programas, texturas ou geometrias. OTTHI_BOOT_METRICS registra as decisões. A segurança em movimentos raros requer testes em Android físico.
- Arcade: oito jogos intactos, com acesso complementar ao centro educacional.
- Escola: DEMONSTRAÇÃO LOCAL responsiva e em português, com papel de professor (criar tarefas objetivas/abertas, revisar respostas), papel de aluno fictício (responder atividades, pontuar, resgatar itens simbólicos) e tarefas relacionadas a cada jogo. Núcleo de regras testável em Node, concessão idempotente e limites de tentativa. Pontos são LOCAIS na demo e NÃO alteram o mundo aberto ou as moedas existentes.

## Aviso obrigatório

A demonstração escolar NÃO contém autenticação real, sincronização, permissões multi-escola, validação antifraude no servidor, LGPD homologada nem integração de itens com o jogo. Não coletar dados reais de estudantes nem apresentar a uma escola como serviço comercial pronto.

## Critérios para aprovação futura

1. Hardware real Android atual e antigo: medir boot, FPS, calor, pausar/retomar, carregamento de câmera e travamentos nas vistas com mais de 64 luzes.
2. Teste real de câmera corporal no Kart, WAR, Voo, Boxe, Tênis e Dança.
3. Testes de partida completa e multiplayer entre dois aparelhos.
4. Projeto escolar separado, regras deny-by-default, autenticação e backend idempotente para PA antes de piloto com crianças.
5. Homologação de direitos de dados pessoais, acessibilidade, requisitos pedagógicos e validação da BNCC por profissional.

Nunca fazer merge sem autorização do proprietário.

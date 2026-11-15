# Registro de continuidade — mãos vazias e tela limpa

Publicado 705.28.28-maos-livres-tela-limpa, revisão 6f64398fafb8a424, asset 70661. Commit de aplicação 2e3f1be286e74c0f998b81d7ba2a01147afc82a1 na branch continuation-20261111. Produção dpl_HUk8uTXxWwLLWWyouXGm2px4sU2x no endereço habitual; 168 arquivos conferidos. Fonte e geração estão congeladas. Metadados/retorno em release.json; produção 27 preservada.

Pedido atendido: Mãos vazias guarda ferramentas sem perder propriedade/inventário, conserva escolha na recarga e retira visual local/remoto. Novos perfis começam vazios; escolha salva antiga não é apagada. Menu reúne câmera, habilidades, MUNDO/GPS e online; mapa/objetivo compactos, Ação contextual, comandos nativos de atividades preservados. Layout completo opcional, preferência salva.

Validação: 474 regressões, 10 mudanças de orientação/viewport, atualização 27→28/offline e oito etapas nativas completas passaram. Contagens de botões persistentes 16→5(393×852), 10→4(852×393), 16→5(320×568), 11→5(1280×720). Há contexto adicional real de mouse/teclado sem emulação de toque. Todos os 24 controles do Menu alcançados nos quatro tamanhos. Evidências de falhas iniciais e correções de rolagem, grid e GPS preservadas. Prévia e produção habitual passaram também sem interceptar o runtime ou limitar a renderização: machado salvo→mãos vazias→recarga→reequipamento→mãos vazias, propriedade e recursos conservados. JSON/capturas em public-production.json e production-empty-hands.png. Entrega publicada e conferida; consultar release.json para origem exata e retorno.

Fontes 01/06/28a/77, estilo 29; não editar app.js/style.css manualmente. Acesso rápido Menu→Mãos vazias; reequipar em Menu→Ferramentas. O modo completo restaura os mesmos elementos/handlers originais. Consultar README, release.json e testes antes de recomeçar diagnóstico.

Firebase, contas, saveDB, RTDB, conteúdo, progresso e oito jogos preservados; nenhuma conta/banco real escrito. Não alegar FPS/latência/calor de celular. A pendência anterior de chegada física universal do socorro continua registrada em ../evolucao-20261112; não foi resolvida nesta mudança de interface.

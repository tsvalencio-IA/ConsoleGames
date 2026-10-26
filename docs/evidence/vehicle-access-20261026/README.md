# Destinos, marina e câmera — evidência da versão final

Fonte: f2469a15c61118333674572055a5701236608aad

Build: 705.26.2-cam-fluida. Revisão: c4126b3d705770c7. O código desta branch acompanha essa fonte; os relatórios ficam separados da branch publicada.

242 testes de regras passaram. O teste do pacote final passou com 58 hashes, cinco rotas, embarque físico em avião/helicóptero/lancha, WAR, neve, ondas, modelos CPU reais e integridade do APK existente. A navegação da lancha, retorno ao píer, reembarque, família e recarga do estacionamento passaram pela interface nativa. A reprodução de câmera usa pixels de teste e corpo sintético declarado, sem webcam. Os testes de objeto passaram no WAR independente e no mundo.

A rodada inicial no servidor revelou uma janela de validade insuficiente entre inferências de cerca de 185 ms. A correção considera o ciclo seguinte, com teto absoluto de 550 ms e interrupção imediata na perda real de mão/objeto. Há testes específicos para continuidade e limite. O reembarque das lanchas também foi alinhado à distância permitida no desembarque. O teste de recarga agora preserva o save, e aguarda a parada real da embarcação.

`package-check.json` usa a distribuição local. A publicação será registrada em `public-result.json` após a checagem do domínio. Carros continuam modelos autorais aproximados: não há aprovação de fidelidade fotográfica da frota. Sem certificação de Android físico, câmera física, alto-falantes ou dois aparelhos online. Não houve acesso a salas reais nem mudança de regras Firebase.

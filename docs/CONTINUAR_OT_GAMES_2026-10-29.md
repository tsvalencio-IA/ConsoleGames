# Continuação OT Games — 29/10/2026

Projeto correto: tsvalencio-IA/ConsoleGames, OT Games, não o SaaS da oficina. Não simplificar os jogos, retirar recursos ou prometer equivalência ao COD / nota 10 sem evidência. Ler docs/CONTINUAR_OT_GAMES_2026-10-28.md para pedidos anteriores, Android, garagem, família e veículos.

## Fonte e publicação

- Trabalho: performance-gravacoes-20261027. Produção: world-revisao-20261022.
- Web 705.28.9-war-corpo-fases, assetVersion 70645, revisão 07e6a02c08d06796; worker WAR v38.
- Produção ainda estava em dcd5272a2b1200205cb760e5820c1aa778c65a89 durante esta anotação. Não afirmar publicação: conferir docs/evidence/war-corpo-fases-20261029/deployment.json e resultados públicos, quando existirem.
- Vercel: projeto prj_wKaHtyk7Pb3vsb9KsnKerxS8bOKm, time team_W3UyY5ss3Shyv78KRMndjust, repoId 1427071731. Build: python3 games/otthi/tools/build_project.py && python3 tools/package-world-preview.py. Saída: dist-world. Publicar SHA testado, esperar READY e conferir origem/alias/recursos públicos. Não gravar segredos.

## Alterações WAR

- Tronco calibra sem exigir pés/quadril. Postura inicial compensa ombros naturalmente deslocados; zona neutra evita deriva. Passos, agachar e rotação deliberados preservados.
- Dois modelos reais alternam no vídeo frontal. Corpo localiza o punho direito, ampliado para a mão; coordenadas voltam ao vídeo original. Prévia some após calibração conjunta. Objeto/brinquedo e duas mãos preservados.
- Postura renova antes do prazo conforme o custo das duas inferências. Aquisição mantém somente memória do alvo entre inferências seriais; imagens antigas não movem/disparam (mão 550 ms, corpo 1200 ms). Observação vazia limpa ações e aquisição.
- Avanço assistido padrão; opção por passos; agachar interrompe/protege. Sem joystick na câmera. Toque: joystick esquerdo e arrasto livre à direita, contatos simultâneos, sprint/ADS/pausa.
- Porto (2 setores), cidade (3) e fortaleza (4) têm geometrias, iluminação, rotas e objetivos distintos. Captura sob ataque, transmissores e extração não são pulados ao eliminar adversários. Anfitrião sincroniza progresso no cooperativo.
- Soldados detalhados tinham Z refletido duas vezes. Posição, direção e altura corrigidas, comparando modelo real e projeção dos acertos. Spawns fora de coberturas; cidade com contato frontal e flancos.
- Worker instala shell com quatro downloads e consumo imediato de respostas. Falha descarta apenas cache novo. Ativação aguarda saída da partida; carreira, arma, moedas e outros dados preservados.

## Outras regressões corrigidas

- Mercado de Aurora: alvo de missão interceptava compras sem missão ativa. Prioridade agora somente na etapa relevante. Sete compras nativas e missões civis passaram.
- Aeronaves NPC: todos os vidros agrupados por material, sem retirar geometria. Hélices independentes; galeria real manteve limite de 14 chamadas e passou com 7/10/8/9.
- QA aguarda o mundo pronto e observa carros e todas as oito aeronaves. Família usa missões civis atuais e contexto sem worker para manter seu gancho de inspeção após recarga. Teste de cache separado usa worker real.
- Três workflows fixados em Ubuntu 24.04: Playwright 1.56.1 falhava na instalação em Ubuntu 26.04. Nenhuma verificação retirada.

## Evidências e conclusão

Pasta docs/evidence/war-corpo-fases-20261029/ contém relatórios e imagens reais do jogo. Fonte funcional b289025 passou integralmente no gameplay 40850792513: 323 unidades, 7 cenários dos cinco jogos, três corridas completas de kart, família/HQ, embarque, frota, garagem, mundo e comércio. Depois houve ajustes de agendamento da câmera, aquisição e diagnóstico; aguardar sua rodada final antes de afirmar aprovação global.

Ambos os modelos reais sobre a mesma foto oficial passaram também com o navegador artificialmente mais lento (1.25x); não é webcam de uma pessoa real. Adversário de treino estacionário mantém modelo e disparo reais: foto estática não acompanha flanqueamento. Observadores somente de leitura das respostas reais confirmam ausência dos dois sensores depois da ocultação. A posição, os tiros e o tempo devem ficar exatamente parados por 500 ms e depois retomar. Não usar o rótulo transitório show-shoulders como confirmação: é sobrescrito por lost. Não mockar workers/landmarks nem aumentar validade das imagens para passar testes. Limitação em 2x excedeu 550 ms e pausou: não certifica jogabilidade nesse hardware.

Fases WebGL e controles em retrato/paisagem passaram em preview. HTML de preview pode receber Vercel Live, inclusive créditos; produção deve passar na conferência byte a byte. Não ignorar diferenças de assets. Entrada canônica WAR: /games/ar/.

## Limites e links

Sem teste físico Android, FPS sustentado, precisão corporal com pessoa real ou Firebase entre celulares. WAR é jogo próprio, não COD. Mundo aberto civil; polícia e bombeiros preservados. YouTube/coreografia automática, assinatura Android original e fidelidade final dos veículos continuam pendentes conforme documento anterior. Não criar chave Android nova, substituir APK sem assinatura original ou pedir desinstalação/limpeza do histórico.

- WAR: https://otthi-world-campanha-teste.vercel.app/games/ar/
- Console: https://otthi-world-campanha-teste.vercel.app/arcade/
- Recuperação: https://otthi-world-campanha-teste.vercel.app/games/atualizar/
- Canva, referência original de cenários (não screenshot): https://www.canva.com/M/MAHZVzJMdsY?utm_source=OC-AaBlKrqBJJNF&utm_campaign=agent_connector_create_image_asset_opened

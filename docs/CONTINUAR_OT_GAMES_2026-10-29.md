# Continuação OT Games — 29/10/2026, objetos, kart e fluidez

Projeto correto: tsvalencio-IA/ConsoleGames. Não mexer no SaaS da oficina nem simplificar/remover os jogos. Esta revisão é web 705.28.10-objetos-kart-fluidez, assetVersion 70646. PUBLICADO: 8c5ba8cee90d163dab5b1c114579490d3b9c29cf, deployment dpl_6eRDHucKfgyhr1N77yzvaTJdda4s, production/READY. Revisão 2b546ef983249b4f; worker WAR v39 e kart v31. Prova: docs/evidence/objetos-kart-fluidez-20261029/release.json. O APK compatível continua dependente da chave original descrita abaixo.

## Escopo desta revisão

- WAR no console: primeiro cartão TREINO DE MIRA, alvos nativos sem dano/limite de tempo, carreira e moedas intactas; cadastro da ponta e apoio do brinquedo em imagem congelada; cinco posições reais para aprender eixos, espelhamento e alcance confortável; retorno ao centro; sensibilidade; rastreador piramidal com validação da aparência e recuperação do mesmo objeto sem tocar na tela. Inclinação do objeto não é mais somada artificialmente a yaw/pitch. Prévia desaparece depois de calibrar. Perda para ações; não aumenta a validade de imagens antigas. Objeto muito liso ou encoberto não é reconhecido com garantia.
- Kart: física em passos fixos recupera até 250 ms de intervalo de quadro, mantendo progresso equivalente a 8 e 60 FPS. Timer de chegada é cancelado/invalida seu token ao iniciar outra corrida. Opção original de continuar copa preservada, com hitbox do botão. Gesto usa olhos/orelhas quando a mão encobre o nariz; um gesto não consome dois itens. A leitura paralela experimental da câmera falhou na regressão de dois jogadores e foi descartada; o leitor original foi preservado.
- Michelle: a área legada de lava ficava no acesso civil da central (x 46, z -94 a -114) e chamava returnHome(). Reproduzido no SHA f60e002; não se cria esse desafio antigo no mundo civil. Central, noticiário, família e moedas preservados.
- Fluidez: Three não percorre matrizes dos ramos ocultos a cada pintura. Consultas explícitas continuam funcionando; ao reaparecer, atualiza ancestrais/filhos. Veículos comuns deixam de procurar pedais/carreta e calcular matrizes inúteis em toda atualização; bicicletas e carretas mantêm sua animação.
- Motores: mesmas gravações licenciadas e famílias de motores; trechos estáveis e correção lenta de amplitude, com junção de 120 ms feita APÓS decodificar Vorbis. Fonte .ogg e atribuições preservadas. Limites exatos no diagnóstico engineLoopEdits. Não afirmar gravação de fábrica de todos os modelos.
- WAR worker v39, kart v31, demais shells atualizados. Manifesto do mundo inclui 107 hashes SHA-256. Conservar IDs, contas, permissões, famílias, saves e salas. Não apagar caches de outros aplicativos.

## Verificação e limites

332 unitários e 102 grafos de áudio passaram. Os sete cenários nativos passaram, incluindo três corridas completas em retrato, paisagem e desktop. A copa multiplayer de três etapas e o gesto passaram no navegador com dois clientes isolados. O job de câmera do kart falhou antes de testar por incompatibilidade do Playwright fixado com ubuntu-latest/26.04; runner fixado em 24.04, sem enfraquecer os testes.

Provas em docs/evidence/objetos-kart-fluidez-20261029/. Há simulação/unitários, navegador WebGL, câmera de pixels determinísticos + postura simulada para brinquedo e dois modelos MediaPipe reais para corpo/mão. Não confundir isso com câmera física. O vídeo 324344.mp4 foi examinado por quadros e diferenças temporais; ausência de movimento nos pixels não mede sozinha o FPS do motor. Não copiá-lo para Git.

O teste público confirmou 25 hashes do WAR, 107 do mundo e 281 de transportes/controles dos sete jogos, treino de objeto/cinco pontos, recuperação com worker real, cabeçalhos no-store e preservação de moedas/família/outra sessão. Fonte de jogo idêntica nas duas revisões (árvore games 920530095d15b0863eef060539f74acb01fa2b97); o commit publicado acrescenta somente a correção do runner e provas ao código 332a685. Os quatro workflows da própria branch de produção passaram no SHA 8c5ba8c: câmera/mundo 40912288415, jogabilidade/família/frota 40912288334, cenários 40912288330 e volante 40912288343. O APK público original continua idêntico; não foi gerado APK com outra chave.

A comparação aquecida com todos os 44 veículos e 138 NPCs teve intervalo médio 147,16 → 144,10 ms, mediana 135,9 → 137,0 e máximo 419 → 517 ms no software WebGL. O custo CPU médio caiu 71,50 → 65,10 ms. Isto NÃO prova resolução geral dos travamentos. Próxima prioridade: perfil de CPU/GPU e redução de chamadas de desenho preservando a geometria, com regressões de animação. Não publicar o experimento zero-light do checkpoint: o ganho era inconclusivo.

A comparação fria de desempenho tem variação e frota em aquecimento; demonstra menos custo de matrizes (13,35 → 4,50 ms no ambiente), mas não certifica FPS no Android nem resolução completa dos travamentos. Não prometer 9,5/10, COD ou rastreamento 3D infalível. Próximo teste físico: brinquedo real, perfil do aparelho e condução prolongada com áudio.

## Publicar e retomar

Trabalho: performance-gravacoes-20261027. Produção: world-revisao-20261022. Usar commit e alias verificados, não comparar apenas nomes. Evitar auditoria pública de dezenas de arquivos simultânea com os modelos no navegador (503 por disputa). Chave Android original não encontrada; não gerar outra chave/pacote nem apagar dados do usuário.


## Histórico da base publicada anterior

# Continuação OT Games — 29/10/2026

Projeto correto: tsvalencio-IA/ConsoleGames, OT Games, não o SaaS da oficina. Não simplificar os jogos, retirar recursos ou prometer equivalência ao COD / nota 10 sem evidência. Ler docs/CONTINUAR_OT_GAMES_2026-10-28.md para pedidos anteriores, Android, garagem, família e veículos.

## Fonte e publicação

- Trabalho: performance-gravacoes-20261027. Produção: world-revisao-20261022.
- Web 705.28.9-war-corpo-fases, assetVersion 70645, revisão 07e6a02c08d06796; worker WAR v38.
- PUBLICADO: f60e00210a87246d5c7f67634b3549f827c5cb7d, deployment dpl_CrhsJKF1xmbRG19xtfLDfE2eVcVa (production/READY). Alias principal confirmado. Provas em docs/evidence/war-corpo-fases-20261029/deployment.json e public-*.json.
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

Pasta docs/evidence/war-corpo-fases-20261029/ contém relatórios e imagens reais do jogo. Fonte publicada f60e002 passou integralmente em gameplay 40854507129 e câmera/mundo 40854507253: 324 unidades, 7 cenários dos cinco jogos, três corridas completas de kart, família/HQ, embarque, frota, garagem, mundo e comércio. Cenários/projeção passaram também em 40855640343. Os ajustes de câmera e aquisição já integram essa fonte testada.

Ambos os modelos reais sobre a mesma foto oficial passaram também com o navegador artificialmente mais lento (1.25x); não é webcam de uma pessoa real. Adversário de treino estacionário mantém modelo e disparo reais: foto estática não acompanha flanqueamento. Observadores somente de leitura das respostas reais confirmam ausência dos dois sensores depois da ocultação. A posição, os tiros e o tempo devem ficar exatamente parados por 500 ms e depois retomar. Não usar o rótulo transitório show-shoulders como confirmação: é sobrescrito por lost. Não mockar workers/landmarks nem aumentar validade das imagens para passar testes. Limitação em 2x excedeu 550 ms e pausou: não certifica jogabilidade nesse hardware.

PRODUÇÃO VERIFICADA: ambos os modelos reais, acerto, avanço, perda/retomada e três operações WebGL em retrato/paisagem passaram no domínio principal. Conferência byte a byte: 20 recursos WAR e 104 do mundo; APK original preservado. Recuperação pública instalou a revisão correta, preservando progresso/dados e confirmando entrada automática pelo console e cabeçalhos no-store. HTML de preview pode receber Vercel Live; produção passou sem ignorar diferenças de assets. Entrada canônica WAR: /games/ar/.

## Limites e links

Sem teste físico Android, FPS sustentado, precisão corporal com pessoa real ou Firebase entre celulares. WAR é jogo próprio, não COD. Mundo aberto civil; polícia e bombeiros preservados. YouTube/coreografia automática, assinatura Android original e fidelidade final dos veículos continuam pendentes conforme documento anterior. Não criar chave Android nova, substituir APK sem assinatura original ou pedir desinstalação/limpeza do histórico.

- WAR: https://otthi-world-campanha-teste.vercel.app/games/ar/
- Console: https://otthi-world-campanha-teste.vercel.app/arcade/
- Recuperação: https://otthi-world-campanha-teste.vercel.app/games/atualizar/
- Canva, referência original de cenários (não screenshot): https://www.canva.com/M/MAHZVzJMdsY?utm_source=OC-AaBlKrqBJJNF&utm_campaign=agent_connector_create_image_asset_opened

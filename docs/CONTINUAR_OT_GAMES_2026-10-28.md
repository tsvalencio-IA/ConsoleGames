# Continuação — OT Games / ConsoleGames

Copie este arquivo para o próximo chat. Se não houver acesso ao código ou ao repositório, o chat precisa dizer isso; não pode afirmar que corrigiu, testou ou publicou algo sem executar. Não recriar os jogos nem remover recursos para simplificar.

## Estado atual

- Repositório: https://github.com/tsvalencio-IA/ConsoleGames
- Código em produção: `f917cc520eddc6774a5bae9152d5ea6ae332a29c`, branch `world-revisao-20261022`.
- Trabalho e evidências: branch `performance-gravacoes-20261027`; consultar sua ponta mais recente. Os commits posteriores de evidência não alteram o jogo publicado.
- Build `705.28.1-revisao-veiculos`, assetVersion `70637`, revisão `6729d7e56daa32b9`.
- Vercel `dpl_Ci3963WZiLMWWZvRYbXVMULcaPan`, READY; SHA e alias confirmados.
- Jogo: https://otthi-world-campanha-teste.vercel.app/games/otthi/
- Instalador: https://otthi-world-campanha-teste.vercel.app/arcade/instalar/
- APK: https://otthi-world-campanha-teste.vercel.app/android/thIAguinho-ARCADE-OT.apk
- APK de 57.991 bytes: mesmo wrapper Android, conteúdo web atualizado; SHA-256 `8ea2f38c966ee3b938dab2362569ef0224488ab5748c6e9ba1accb0336c0fc49`. Não houve instalação em aparelho físico.

## O que mudou nesta revisão

1. **Câmera e passageiros** — módulo `69-vehicle-camera-passengers.js`: arrastar para girar 360°, manter o ângulo após soltar, aproximar e ver ocupantes por dentro/pela frente, botão para voltar a acompanhar o veículo. Funciona em carros, motos, lanchas, helicóptero, avião e balão; os fluxos nativos cobrem carro e três aeronaves. Passageiros acenam, humanos movimentam a cabeça e cães reagem. Motorista só acena parado. Família mantém os assentos. A câmera automática do voo também foi integrada à órbita, eliminando a disputa entre os dois posicionamentos.
2. **Toque** — três contatos simultâneos de direção, aceleração e câmera aprovados; botão de ocupantes acessível em retrato e paisagem. Corrigido o toque que gerava `pointerdown` e um segundo `click` com `detail=0`, abrindo e fechando a cabine imediatamente. Teste dedicado exige uma ativação por toque, clique, Enter e espaço.
3. **Cabines** — aberturas envidraçadas reais no casco das aeronaves civis, bancos/painéis e assentos dos aviões ajustados à fuselagem. Vidros transparentes são preservados no agrupamento de geometria.
4. **Atualização automática** — 11 recursos obrigatórios sem hash impediam o worker de atualizar. O conjunto obrigatório agora só inclui recursos protegidos pelo manifesto; armas não são mais pré-carregadas no mundo infantil. Verificação a cada minuto e ao retornar ao app, sem apagar cookies, contas ou progresso. Reload aguarda parar fora dos veículos e das atividades para não interromper voo/jogo.
5. **Garagem** — sentido da direção corrigido; saída considera o comprimento inteiro, inclusive carreta; manobras e posição por unidade salvas, com correção de estacionamento abandonado ao revisitar. Compra entrega o carro na concessionária com ignição; duas unidades de Palio e saída física foram exercitadas. Base do balão da Serra saiu da estrada; migração só reposiciona o balão original ainda não usado.
6. **Motores** — banco `20261028-vehicle4`, 33 OGG licenciados, perfis explícitos para os 44 modelos. Separados Fusca, Opala I6, M3 turbo I6, Porsche boxer 6, Ferrari V8 plano, T-Cross 3 cilindros, Hornet I4, GS boxer duplo, motos de um cilindro e diesel. Algumas fontes são adaptações por família de motor, não gravações de fábrica de cada veículo. Elétricos mantêm zumbido sintetizado; bicicleta e balão não têm motor a combustão. Metadados, hashes, cortes e licenças em `audio/engine-recordings.json` e `CREDITS.txt`, copiados nos sete jogos.
7. **Carrocerias** — encontros curvos, colunas, capôs e rodas revistos. Lanternas traseiras do Palio acompanham a superfície; teste de encaixe aprovado. Fusca/Ferrari preservados. Os demais veículos continuam estilizados e vários ainda precisam de modelagem mais fiel. Não atribuir nota 10/10.
8. **Fit Dance** — seletor real de áudio do aparelho, BPM detectado e editável, coreografia em frases completas ajustada ao ritmo e duração; arquivo não é enviado. Limite 12 MB, 30 s a 6 min. Câmera frontal some após calibrar; perda do corpo pausa música e aula, com retomada na mesma posição.
9. **Desempenho preservado** — otimizações anteriores das rotas, planejamento da família e preparo dos 44 modelos completos antes de jogar. Comparação de CPU em 40 passos: cidade 2127,5 → 370,3 ms; praia 4917,4 → 374,3 ms. Desenho limitado nesses ensaios: não é FPS de Android.

## Validação e limites

- 290 verificações de unidade cobertas: 289 passaram no conjunto completo; uma falha era a correspondência textual da chamada `verifyResponse`. Formatação corrigida sem desativar SHA-256, e o teste mais dois de atualização passaram no reteste. Log original preservado.
- 102 grafos de áudio, 51 tipos/modelos em dois sistemas: amostras reproduzidas, aceleração, pausa, mute e descarte aprovados. Não certifica som do alto-falante do celular.
- 44 modelos, três vistas cada, geometria/assentos/imagens aprovados e seis pranchas inspecionadas. A inspeção não comprova fidelidade de fábrica.
- Câmera: eventos nativos, família de quatro, órbita persistente, interior, três toques e duas orientações aprovados.
- Dança: seletor de arquivo real, calibração, câmera oculta, pausa/perda de corpo e retorno, fim de aula (27/28 movimentos) e encerramento da câmera aprovados com poses sintéticas e dispositivo falso. Nenhuma homologação física de reconhecimento de corpo nesta revisão.
- Garagem/concessionária, reposição exata de aeronave em três minutos, pouso na rua, bloqueio real de trânsito, resgate OTTOVIAS, balão pilotado por NPC e auditoria das estradas aprovados.
- Migração de worker antigo, recuperação de configuração antiga, preservação do progresso/armazenamento de outro aplicativo e início offline aprovados.
- Instalador público: retrato, paisagem, desktop, sem JavaScript e worker instalado aprovados; download real do APK conferido.
- Evidências: `docs/evidence/vehicle-camera-audio-20261028/`. Conferência pública final: 95 recursos protegidos por hash; 275 recursos compartilhados auditados, com reteste incremental dos dois alterados no último hotfix. No site público, sem interceptação/cap de desenho: início, quatro familiares no helicóptero, órbita, cabine, retorno à câmera de acompanhamento, decolagem, mapa e retorno ao mundo aprovados sem erros de JavaScript.
- Não afirmar FPS sustentado, ausência de travamentos/piscadas no Android, precisão da câmera física, áudio perfeito ou multiplayer real entre celulares. Não foram testados no aparelho do Thiago. O vídeo recebido tinha área do jogo preta; não dizer que foi possível observar a piscada nele.

## Pedidos que continuam pendentes

- Investigar travamentos e piscadas no Android real sem reduzir mapa, qualidade ou conteúdo.
- Maior fidelidade das carrocerias e dos sons de todos os transportes, sobretudo motos e carros brasileiros. Não trocar todos por um modelo genérico.
- NPCs surfando, pilotando lanchas, navios/barcos, pranchas e missões no mar. Interações do jogador para esquiar/brincar na neve e mais movimento nas regiões. Já há moradores, banhistas, vôlei, castelos, patinadores, trenós e caminhantes; não confundir isso com os novos pedidos.
- Alternar recolhimento de aeronaves/balões com equipe terrestre, viatura, piloto, bloqueio e decolagem, além do resgate aéreo já existente.
- Roupas para a família, mais personagens e criação ampliada de personagens.
- Melhorar sons/animações das ações e movimentos do Fit Dance com teste corporal real.
- Mundo aberto infantil/civil: manter polícia/bombeiros e remover tiros/guerra/operações militares do mundo. WAR continua no console para trabalho futuro; não apagar o jogo do console.
- Revisar regressões e multiplayer de cada jogo a partir de evidência concreta. Não garantir todos os jogos 10/10 nem alegar testes em dois celulares sem executá-los.

## Ambiente e publicação

Diretório `/workspace/scratch/a10cbbfeaf34/ConsoleGames`. Chromium `/workspace/scratch/a10cbbfeaf34/qa-browser/chromium`, versão 138.0.7204.0, via `OT_BROWSER_BINARY`. Servidor local e navegador precisam executar no mesmo processo. Rede pública usa `tests/helpers/browser-network.mjs`; não expor credenciais.

Build: `python3 games/otthi/tools/build_project.py && python3 tools/package-world-preview.py`. Publicar somente SHA validado; atualizar a branch de produção com `expected_sha`, sem force. Vercel: projeto `prj_wKaHtyk7Pb3vsb9KsnKerxS8bOKm`, time `team_W3UyY5ss3Shyv78KRMndjust`, repoId `1427071731`, saída `dist-world`, install `true`, framework/root nulos.

Preservar contas, Firebase/regras, senhas, IDs e saves. Não criar agentes paralelos sem instrução explícita. Não repetir toda a suíte se não houver mudança que invalide os resultados; investigar a primeira falha com observabilidade.

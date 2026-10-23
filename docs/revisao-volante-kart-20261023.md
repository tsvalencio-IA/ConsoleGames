# Volante por câmera e evolução no modo solo — 23/10/2026

O relato foi a ausência do volante que acompanha as mãos ao entrar no Kart pelo mundo aberto. A retirada não foi solicitada. A revisão do código confirmou uma regressão no painel compacto introduzido em `35357f1`: `renderUI` retornava depois de `renderRaceHUD` durante a corrida, deixando o desenho original do volante fora do caminho executado. A leitura dos dois pulsos continuava no motor, mas seu retorno visual havia desaparecido. O teste anterior de ida ao autódromo escolhia controles por toque e não cobria essa apresentação por câmera.

O desenho original foi extraído para uma função reutilizada pelos painéis. Ele volta a ser executado durante a corrida, nas coordenadas calculadas dos pulsos, e continua separado dos controles manuais. Reiniciar a física também limpa a posição anterior do volante. A direção, o reconhecimento, as regras de aceleração, os níveis de auxílio, os itens, as pistas e os adversários não foram substituídos nesta correção.

Na auditoria também foi confirmada uma falha no salvamento solo: o registro guardava moedas, XP e `arSave`, mas omitia `kartSave` e `flightSave`. As compras e melhorias desses dois jogos podiam desaparecer ao reabrir o documento; a sessão solo também podia herdar a garagem carregada de uma conta anterior. O salvamento compartilhado agora inclui e recarrega o campo original correspondente ao jogo. Ao voltar à conta, restaura a cópia anterior daquele perfil, inclusive a ausência original do campo. Não há escrita em uma conta Firebase durante o teste solo.

A conferência da mudança do painel também identificou a reorganização visual de posição, volta, velocidade, nitro, minimapa e avisos. O saldo durante a corrida e o velocímetro circular antigo deixaram de ser desenhados no painel compacto; moedas e progressão não foram removidas do motor. O desenho do volante não poderia ter sido perdido junto com essa reorganização. A carreira continua disponível na pausa.

Não foi encontrada outra remoção de comando nos motores alterados por aquela revisão: os arquivos dos motores de pingue-pongue e boxe não mudaram em `35357f1`; no avião houve instrumentos/unidades/áudio, e no WAR áudio e táticas dos adversários. Essa comparação de código não certifica a qualidade ou a precisão física de todos os jogos.

## Verificação

- O teste que verifica o desenho do volante durante a corrida falhou antes da correção e passou depois. Ele também desloca as mãos entre dois quadros.
- O teste de salvamento reproduziu o uso indevido da evolução da conta no solo. Depois da correção, confere garagem/melhorias, recarga em outro documento e restauração do perfil da conta.
- Os 188 testes da suíte completa passaram.
- `tests/kart-camera-browser.mjs` entra pelo mundo e escolhe explicitamente câmera nos dois autódromos. Usa MoveNet real; somente a fonte de vídeo é uma imagem de referência transformada em vídeo local. Observa o desenho efetivo no canvas, desloca a imagem para verificar acompanhamento, retira as mãos, verifica parada e recuperação, e retorna preservando a família, moedas e XP do mundo.
- Um workflow específico guarda as telas e o resultado dessa navegação por câmera. O worker e as URLs de script foram atualizados para entregar os arquivos corrigidos sem apagar o progresso.

Os ensaios usam emulação móvel e vídeo de referência. Não certificam a câmera física, a iluminação ou a precisão da mão do usuário, nem equivalência com jogos comerciais.

## Entrega publicada

Fonte `900726dcd3230e63367228ca1ed998cd7453eb12`, publicada no mesmo projeto e endereço do mundo aberto. Os 19 arquivos públicos conferidos correspondem exatamente aos arquivos locais testados, incluindo o motor do Kart, as cinco cópias de salvamento e seus workers/HTML. O APK permanece byte a byte idêntico: a correção é entregue pelo carregamento dos jogos.

O workflow `40015900407` concluiu com sucesso os dois autódromos com MoveNet real, nos modos retrato e paisagem, e guardou o resultado no artefato `12529115320`. O workflow `40015900221` também passou, cobrindo câmera frontal do WAR, controles simultâneos e modos do mundo/voo. A conferência pública adicional do Aurora completou a navegação pela versão publicada; a execução adicional do Costa nesse ambiente foi interrompida pela ferramenta antes de produzir um resultado final. A cobertura completa dos dois permanece documentada no workflow e nos arquivos publicados conferidos por hash.

Evidências permanentes: `evidence/original-games-20261023/kart-camera-autodromes.json`, `kart-wheel-public-delivery.json` e `kart-wheel-unit-tests.txt`.

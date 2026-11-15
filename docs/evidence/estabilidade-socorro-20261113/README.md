# Fechamento solicitado — 15/11/2026

**Entrega integrada ainda incompleta. Candidata29 não homologada e não promovida à produção.**

A produção preservada é705.28.28, revisão6f64398fafb8a424, runtime2e3f1be286e74c0f998b81d7ba2a01147afc82a1. Mãos vazias, tela limpa, Meu caminho, dados/Firebase e os oito jogos continuam preservados. A candidata compilada é705.28.29-camera-socorro-jogabilidade, revisão3227043b294bd89d. A [prévia separada, não homologada](https://otthi-world-campanha-teste-32ymp5zkx-thiaguinho-s-projects.vercel.app/arcade/previews/estabilidade-20261115.html) está acessível. O [registro](preview.json) identifica o commit exato e a produção preservada; a [verificação HTTP](preview-http-integrity.json) confirmou 171/171 arquivos, sem aprovar jogabilidade ou desempenho.

## Resultados comprovados

- [Sessão nativa da28](native-baseline-28.json):15min reais, sem limitar renderização ou acelerar relógio, com44 modelos de tráfego/138 NPCs. Cinco ocorrências encerradas; nenhuma teve os três serviços fisicamente presentes, e as cinco usaram contingência. Pagamentos/propriedade/itens permaneceram corretos, mas menos de três recebimentos/retornos concluíram. Do marco5 ao15min, contagens de objetos, geometrias, materiais, texturas da cena, contornos e ações tiveram variação0; heap apósGC cresceu2.768.740bytes, com fases de motorista diferentes. Isso não aprova a experiência.
- [Câmera antes](camera-baseline-low.json): foram observadas compilações/primeiros usos ao mudar o ângulo; maior primeiro desenho nessa varredura5.711ms. Na sessão prolongada houve desenho de9.763ms durante um giro. As contagensGPU aumentam ao primeiro uso de objetos/texturas, mesmo com a contagem de programas estável em algumas janelas. Comparação equivalente da candidata ainda não concluída.
- [Socorro isolado mais recente](rescue-controller-latest.json):3/5 cenários com os três papéis fisicamente presentes sem fallback;2/5 ainda falharam. Não contar contingência como chegada. Esse experimento usa relógio controlado/desenho limitado e não substitui a sessão integrada.
- [Quatorze testes focados](focused-14.log) passaram: recuperação de tempo em passos limitados, relógio dos motoristas, guarda física/contingência, controle/deslizamento doWAR e equivalência da pose da infantaria. Não é a suíte completa da candidata nem partida humana aprovada.
- [Abertura nativa da candidata](candidate-native-smoke.json) passou com código/renderização locais sem cap ou aceleração:17,012s até entrada nesse ambiente; mãos vazias, tela limpa e Meu caminho acessíveis. [Captura](candidate-native-world.png). Não comprova melhoria deFPS ou estabilidade prolongada.

## Código preparado, sem homologação de entrega

Mundo: expansão e variantes de luz sob carregamento, preparo de vistas reais para o primeiro uso daGPU, recuperação limitada do atraso da simulação e relógio consistente para motoristas. Socorro: seleção/rota/saída de base e recuperação com footprint do veículo; histórico limitado separa chegada física e contingência. Há regressões e prova parcial, mas as duas rotas ainda falham e precisam ser corrigidas.

WAR: arrasto em área livre, deslizamento junto a coberturas, menor trabalho de ossos e preparo gráfico sob carregamento. A missão completa e a comparação de desempenho da nova integração ainda não foram concluídas. Renderer canônico/cópias AR/voo permanecem iguais.

Kart: correção da deriva lateral dos rivais e da banana que atingia o próprio bot; Duelo opcional com entrada no jogo, ritmo mais próximo, defesa e objetivos. Corridas completas e equilíbrio dessa mudança ainda não foram validados. O modo profundo continua prévia solo; não declarar diversão10/10.

## Bloqueios para promover

1. Corrigir as duas falhas físicas restantes e repetir cenários com atores/tempo inicial controlados.
2. Rodar15min nativos da candidata nas mesmas configurações/agenda da base, verificando socorro, trânsito, entregas, cobrança, recibo único e recursos. Corrigir falhas antes de aprovação.
3. Concluir comparação antes/depois da câmera nos mesmos ângulos/qualidade/posição, incluindo arrasto/botões e veículos; medir custo do carregamento e recursosGPU.
4. Rodar partidas completas doWAR e Kart, atualização/offline, regressões e preservação da28 na candidata final. Somente então promover e conferir bytes do endereço habitual, mantendo retorno.

Celular físico: FPS sustentado, aquecimento/bateria, driverGPU, câmera corporal e latência sentida continuam sem medição. Perfil utilizado aqui: Linux/Chromium/SwiftShader, dados descartáveis, serviços externos bloqueados. Nenhuma conta ou banco real foi escrito. Nenhuma publicação grande foi declarada aprovada.

## Como continuar sem recomeçar

Consultar PROGRESS.md e checkpoints camera-progress.md, rescue-progress.md, war-progress.md e kart-progress.md. A fonte está modular; não editar app.js manualmente. Fonte de produção é28; commit de candidata/prévia deve ser consultado em preview.json. O teste longo é tests/world-native-endurance-browser.mjs; o teste de câmera é tests/world-camera-angle-profile.mjs. A raiz assumiu as frentes após limites dos agentes; existem alterações ainda não validadas e isso deve continuar explícito.

## Ambiente e verificação em celular

A base longa usou Chromium 141.0.7390.37 em Linux x64, renderização SwiftShader, 3 CPUs disponíveis (AMD EPYC 9V74), aproximadamente 10,45 GB de RAM e viewport 393 × 852. Isso emula a tela e o toque, não o desempenho do aparelho. O [roteiro de celular](CELULAR.md) está preparado; não exige programação.

# Jogabilidade — 21/10/2026

Atualização posterior: [revisão dos sete jogos](REVISAO-SETE-JOGOS-20261021.md).

Esta atualização mantém os IDs dos jogos, projetos Firebase, contas, fases e economias existentes. As preferências novas são locais e separadas por jogo.

- Kart: câmera de acompanhamento com três distâncias, projeção comum da pista, obstáculos e competidores; olhar para trás; drift explícito com carga e impulso; aceleração automática opcional e dificuldade solo. Teclado: setas/WASD, Z para drift, R para olhar para trás, Shift para nitro, E para item, C para distância.
- Voo: câmera externa padrão e cabine opcional, três distâncias, mira na direção real dos disparos, potência separada e assistência opcional. A calibragem permanece antes da missão. A Escola de Voo acrescenta pista, decolagem, cinco arcos e aproximação/pouso ao modo livre.
- Ping pong: mantém calibragem, mão dominante e sentido espelhado da mão; sensibilidade e suavização ajustáveis; raquete fica estável quando a mão se perde, e a retomada não cria velocidade artificial. Som de contato curto e níveis solo.
- Boxe: preparação visível dos golpes e recuperação entre ataques; esquivas laterais por toque e dificuldade ajustável. A movimentação de guarda da IA não dispara socos involuntários.
- AR: foco no alvo mais próximo e indicação de destino, preservando coleta, oficina e missão nativas.
- OTThi + Família: a Casa da Família ocupa um lote livre. Personagens usam as malhas e articulações aprovadas do HQ, convertidas para quatro malhas com esqueleto Three.js. O menu de pausa e o mapa dão acesso à família. Passeio ao parque, busca/devolução de brinquedos e as quatro questões originais de cada desafio de oficina e tecnologia ficam no mesmo mundo.
- Família original: permanece acessível e conserva controles, ações, câmeras, personagens e progresso. Seu menu inclui uma entrada para o mundo integrado.

Os ajustes ficam no botão ⚙ AJUSTES durante a partida: câmera, dificuldade solo, comandos, som e detalhes visuais conforme a modalidade. Missões de domínio continuam acessíveis pelo botão da etapa da carreira. Efeitos adicionais podem ser ativados nos ajustes durante a partida.

A Família usa a autoridade da sala e o transporte de snapshots/eventos V2 já existentes. Não são criadas regras mais abertas. A devolução só é contabilizada quando concluída; o identificador é persistido para impedir repetição ao reconectar. A Família usa tempo decorrido com um limite por atualização, sem assumir que o navegador desenha 60 quadros por segundo.

## Verificação reproduzível

- `node --test tests/*.test.mjs`: código, projeções, movimento, IA, perda/retomada da mão, articulações reais, busca/devolução e duplicidade.
- `node tests/playable-smoke.mjs`: navegador Chromium com Firebase/câmera isolados; ações durante partidas, controles, ajustes, gamepad e pausa/retorno.
- `node tests/family-playable.mjs`: Three.js/WebGL reais; encontro, lançamento, devolução, passeio e preservação do HQ.
- `node tests/studio-verify.mjs` e `node tests/world-integrity.mjs`: integração e SHA-256 dos arquivos PWA.
- `node tests/production-audit.mjs`: comparação dos arquivos publicados com a versão do repositório.

As simulações não certificam câmera física, latência entre celulares reais nem desempenho de um modelo específico de aparelho.

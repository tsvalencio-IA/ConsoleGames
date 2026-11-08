# WAR — revisão publicada de 7 de novembro de 2026

Código publicado: `d3e7248e10e8e1e6bcc7b57d9c118fa0e28e34f6`.
Base da revisão de mãos e cenário: `64acd1c1bd500bf20ac313750531d9aa30bba2ab`.
Mundo preservado: `705.28.21-war-revisao`, revisão `defa5c4df1748e8e`.
WAR: cache privado `pro-control-v51`; entrada `20261107-war-revisao2`.
Produção: https://otthi-world-campanha-teste.vercel.app/games/ar/
Deployment: `dpl_56uzcMDgNEGZNU8zU4FZuXKMznkt`.

## Comportamento corrigido

- A calibração de duas mãos espera ambas antes de atribuir os papéis; apresentar só a esquerda não a transforma na mão de mira. O modo corpo + mão direita permanece disponível.
- Esquerda comanda caminhada e giro acumulado, direita aponta e dispara por pinça. Ambas usam a mesma janela de validade, com teto de 550 ms e liberação ao detectar ausência.
- Perder a direita interrompe o disparo e conserva a renderização do movimento da esquerda. Perder a esquerda interrompe movimento; perder ambas pausa a simulação solo, tempo, dano e tiros.
- Abaixar permanece ativo no modo de duas mãos; antes era desfeito pelo quadro seguinte.
- Um toque completo em ATIRAR ou Espaço entre dois quadros agora registra um disparo. Segurar conserva a rajada e o intervalo da arma. Cancelamento, pausa e fim de partida descartam o comando; recarga e intervalo não acumulam tiros atrasados. Teclado e toque continuam independentes.

## Apresentação e custo

HUD de vida e munição compacto, instruções do modo ativo e avisos de qual mão perdeu leitura. O renderizador compatível distingue porto, cidade e fortaleza e recorta paredes no plano próximo. O cenário WebGL aprovado foi preservado. Qualidade automática pode recuperar resolução após quadros consistentemente leves e reduzir sob custo sustentado.

A prévia escondida não desenha esqueletos nem acessa o canvas enquanto a inferência está ocupada. A captura necessária para inferência continua ativa. Textos de pontuação e leitura só são reescritos quando mudam. Isso comprova remoção de trabalho redundante, sem medir FPS físico.

## Evidências

- `unit-summary.json`: 404 testes de lógica aprovados.
- `touch-controls.json`: seis telas móveis com quatro toques simultâneos e um desktop; disparo, arraste, zoom, pausa e giro aprovados.
- `installed-update.json`: atualização real do worker para v51, 103 recursos no cache, carreira/arma/saldo e armazenamento de outros jogos preservados.
- `workflow-checks.json`: os quatro workflows do commit publicado terminaram aprovados.
- `two-hands.json`: modelo MediaPipe de produção em fotos oficiais reproduzidas por vídeo local; calibração com esquerda primeiro, navegação independente, perdas separadas e conjunta, abaixar e retorno aos controles.
- `joint-camera.json`: modo anterior de corpo e mão preservado.
- `visual-review.json`: 16 vistas (quatro fases, retrato e paisagem, WebGL e compatível), controles dentro da tela e sem sobreposição ou rolagem lateral.
- `preview-integrity.json` e `public-integrity.json`: 132 arquivos de cada publicação correspondem aos hashes esperados, usando a preparação existente do endereço Vercel.
- Workflow `42431707266`: testes de toque, câmera dupla, corpo + mão, 16 vistas, entregas, pouso e atualização HTTPS aprovados.
- Workflow `42431707221`, etapa “Atualização completa sem interromper a partida”: atualização do WAR instalado para v51 aprovada; carreira, arma, saldo e dados de outros jogos preservados.
- Conferência manual no endereço público: entrada identificada como `20261107-war-revisao2`; um toque no treino produziu 1 tiro e 1 acerto, com 29 munições restantes. O navegador desta sessão usou o renderizador compatível por não criar contexto WebGL; o WebGL foi validado no workflow.

`war-3d.png` e `war-compatible.png` são capturas do mesmo commit no teste gráfico.

## Limites

Fotos em vídeo e GPU por software não certificam ergonomia, precisão física da pinça, temperatura ou FPS sustentado em Android. Essas medições continuam pendentes no aparelho físico. Firebase, autenticação, dados e regras não foram alterados. Nenhuma alteração de gameplay dos outros jogos faz parte da correção de toque v51.

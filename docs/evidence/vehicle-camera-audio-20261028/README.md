# Revisão de veículos, câmera e atualização — 28/10/2026

Os relatórios registram controles e bytes realmente executados no Chromium. A câmera e os assentos do jogo foram exercitados por eventos nativos, com quatro familiares. A simulação local usa desenho limitado para o WebGL por software; as imagens selecionadas usam o renderizador real. O ensaio público separado não intercepta código nem limita o desenho.

O teste de dança reproduz poses sintéticas sobre um dispositivo de vídeo falso. O arquivo WAV é decodificado pelo navegador; a coreografia acompanha seu BPM e duração, pausa por perda do corpo e retorna sem avançar o relógio da aula. Não equivale a testar o reconhecimento de um usuário real.

O conjunto de unidade teve 289 aprovações e uma falha de correspondência textual na chamada de verificação de integridade. A formatação dessa chamada foi corrigida, preservando a validação SHA-256, e o teste reprovado mais os dois testes novos de atualização passaram no reteste. São 290 verificações cobertas; o log original foi mantido.

A última correção distingue cliques de compatibilidade de toque e cliques do teclado. A prova `vehicle-buttons.json` exige uma única ativação por toque, clique, Enter e espaço.

As 44 carrocerias continuam estilizadas; a galeria verifica composição, geometria, assentos e três vistas, sem atribuir nota de fidelidade. Motores usam gravações licenciadas e adaptações por família de motor, detalhadas nos metadados do banco. Não há certificação de FPS, câmera, som ou instalação em Android físico.

## Publicação final

Produção `f917cc520eddc6774a5bae9152d5ea6ae332a29c`, deployment `dpl_Ci3963WZiLMWWZvRYbXVMULcaPan`, revisão `6729d7e56daa32b9`. Todos os 95 arquivos do manifesto público foram conferidos por hash. A auditoria completa anterior validou 275 recursos dos sete jogos; depois da correção de toque, os dois recursos alterados foram novamente baixados e os outros 273 mantiveram os mesmos hashes locais. Os detalhes e a data da auditoria anterior estão no relatório compartilhado.

No link público, sem interceptar o código ou limitar o desenho: início, embarque dos quatro familiares no helicóptero, giro da câmera, visão interna, retorno ao acompanhamento, decolagem pelo coletivo, mapa e retorno ao mundo aprovados, sem erros de JavaScript. Cinco cenários do instalador público e bytes/assinatura ZIP/hash do APK foram conferidos; não é instalação em um Android físico.

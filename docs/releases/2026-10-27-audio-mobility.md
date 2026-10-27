# OT World 705.27.2 — áudio e mobilidade

A revisão corrige estalos dos motores, acompanhantes que ficavam para trás no voo, acesso ao teleférico e uso de itens no kart pela câmera. Mantém as atividades e seus motores originais.

## Causas e correções

- O mundo usava síntese própria, separada do banco gravado do console. O impulso aleatório a cada ignição foi substituído por uma entrada contínua; cilindros, marcha, carga e identidade dos motores permanecem. Ruído de rodagem e admissão fica em camada separada. Ganhos terminam em zero com transição e descarte seguro.
- A gravação do console continha descontinuidades internas repetidas a cada 0,864 s. A reparação reaproveita o trecho íntegro da mesma fonte CC0, preserva os créditos, registra a transformação e cria uma emenda contínua. As sete cópias do banco são idênticas.
- O simulador de avião original não iniciava sua voz de motor no caminho normal. Agora usa o banco desbloqueado existente, com perfis de turbina e rotor e descarte ao sair.
- Os familiares recebiam o assento correto, mas a distância ao personagem no solo impedia a atualização de seus objetos 3D. Assentos ativos atualizam mesmo fora do alcance da animação a pé.
- O kart desarmava o item durante a subida real da mão. Agora conserva a preparação por até 1,8 s, confirma a mão junto à cabeça por 0,35 s e exige retorno ao volante para repetir. Duas mãos altas continuam reservadas ao turbo.
- O GPS do teleférico apontava para o atendente. O destino agora fica na plataforma e o embarque tem prioridade dentro da estação, sem ser capturado pela conversa da operadora. A viagem continua com espera, cabine, assentos e desembarque reais.
- Notificações repetidas do viewport e da qualidade limpavam o buffer WebGL mesmo sem mudança. Mudanças necessárias são enfileiradas e aplicadas junto ao quadro substituto. O plano próximo aéreo passa a 1,5 m, melhorando a precisão de profundidade; ao sair, o plano anterior é restaurado.

## Verificação local

- 271 testes Node passaram; após o ajuste final do teleférico, os 11 testes de trânsito civil, missões e buffer passaram novamente.
- Chromium 138.0.7204.0 renderizou áudio real em OfflineAudioContext a 48 kHz para 51 modelos/classes em cada um dos dois sistemas: 102 combinações sem clipping, valores inválidos ou resíduos após pausa, volume zero e descarte. Na mesma auditoria, a fonte anterior apresentou falhas em 97 combinações.
- Palio no mundo: salto máximo da onda de combustão passou de 0,29338 para 0,00631, com RMS do motor de 0,08142 para 0,08200. No console: de 0,19793 para 0,01004, com RMS de 0,07963 para 0,09640. Não houve redução artificial do motor a silêncio.
- Copa F1 completa em dois clientes isolados: três etapas, física original, resultados iguais, item por movimento gradual da mão e por toque. F2, F3 e corrida livre entram no lobby compartilhado correto.
- Mundo nativo: embarque em helicóptero, avião e balão com quatro familiares; decolagem pelo coletivo; transporte distante com erro de assento inferior a 1e-6; plano próximo restaurado ao sair. Teleférico sobe e desce com quatro familiares a partir das coordenadas reais do GPS.
- Trinta notificações repetidas não recriam o buffer. Alterações de viewport/orientação e DPR são seguidas pela renderização no mesmo quadro. Três quadros reais de voo contêm cenário e geometria, sem imagem vazia.
- Simulador original: partida nativa no modo local, controles de avião e helicóptero, três toques simultâneos e renderização passaram no smoke de jogabilidade.
- Build modular, manifesto e empacotamento validados.

## Limites

Os testes usam Chromium, áudio offline nativo e WebGL por software; a simulação funcional limita a renderização e usa posicionamento/relógio de inspeção para reduzir deslocamentos. A câmera do kart usa vídeo e poses sintéticos declarados. Não representam instalação, câmera, alto-falante ou GPU de um Android físico, nem teste de rede móvel com duas pessoas reais.

Os resultados completos ficam em test-results/transport-audio, transport-audio-before, transport-flight, transport-regressions e kart-cups. Publicação: `ca77458f1c20f04de1daa5ab0f0786aeb11700bd`, deployment `dpl_9RGaP25fTFA7UZxkomdT44aD2sek`, READY no alias canônico, revisão `46a592e8f31296b5`.

Após publicar, 59 arquivos do manifesto público e 37 verificações adicionais do console/áudio conferem com os bytes locais testados. O instalador completou os downloads por toque/clique em retrato Android, paisagem Android, desktop, sem JavaScript e com service worker ativo; a entrada pelo console abriu a página correta. Todos os APKs tinham 57.991 bytes e SHA-256 `8ea2f38c966ee3b938dab2362569ef0224488ab5748c6e9ba1accb0336c0fc49`.

A evidência pública fica em test-results/civil-public/resources.json, test-results/transport-public/result.json e test-results/android-download/result.json.

O fluxo público também passou sem substituir o código ou limitar o renderizador: abrir o mundo, embarcar com a família, decolar pelo coletivo, abrir e fechar o mapa em voo e retornar ao mundo. Teste com WebGL real por software e save local descartável, sem login ou escrita em contas. Evidência em test-results/transport-public-browser/result.json.

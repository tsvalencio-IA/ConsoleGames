# Verificação da versão705.25.2

Fonte publicada: bafbd7dc074e6fefa8eeb6c5e66a5d8a7c56bd78; árvore08806be81c8974f782953579fb16a87366c773c2; revisão c0413aa13ad37ff0.

234 testes Node;47 fluxos de garagem/dirigir/sair/salvar;44 modelos renderizados;44 modelos em movimento no trânsito; sete aeronaves civis e quatro geometrias aéreas; três dificuldades de dança por movimento; interface de calibração, perda/recuperação, permissão negada e retrato/paisagem; modeloCPU real com33 marcos de imagem e33 de mundo, inclusive após ficar offline.

Os JSONs indicam o tipo de ensaio. O teste de interface da dança usa câmera simulada e marcos sintéticos identificados; o ensaio do modeloCPU usa uma imagem pública do MediaPipe. Não representam câmera física, FPS de Android nem partidas entre aparelhos reais. Não foram acessados jogadores ou salas de produção.

`public-canary.mjs` verifica os48 hashes publicados, fluxos de garagem/casa/lojas, presença dos44 modelos e sete aeronaves, menu de dança, instalabilidade e download do APK existente. Executar a partir da raiz do repositório. Publicado em https://otthi-world-campanha-teste.vercel.app/games/otthi/. Os48 hashes, entrada no mundo, retirada na garagem, ações da casa, lojas, frota de44 modelos, sete aeronaves, menu de dança, service worker, instalabilidade e download do APK existente passaram. A inferênciaCPU do worker publicado também retornou33 marcos de imagem e33 de mundo. Os dois fluxosCI concluíram com sucesso; os IDs estão em ci.json.

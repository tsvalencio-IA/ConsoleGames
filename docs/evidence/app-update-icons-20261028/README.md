# Atualização do aplicativo, ícone e estado dos modos — 28/10/2026

- Console confere o service worker ao abrir, voltar ao primeiro plano, reconectar e a cada minuto visível. Uma versão ativada recarrega o menu só fora de edição/autenticação. Não apaga contas, favoritos ou progresso. Testes de unidade e worker real v13 → v14 aprovados, com senha/e-mail ainda não enviados preservados enquanto a janela de conta está aberta.
- Ícone OT Games vetorial com texto em contornos, PNG 192/512, maskable opaco e recursos Android normais/adaptativos. Mantidos IDs dos aplicativos, escopos e origens. URLs versionadas permitem ao navegador identificar a nova arte; isso não substitui automaticamente o ícone embutido em um APK.
- Projeto Vercel conectado ao repositório; build modular e saída dist-world persistidos usando o conector já autenticado. Não são necessárias credenciais no front-end para conferir atualizações.
- Android recovery 1.2.0/código 3 preparado no código: ícone adaptativo, escolha de arquivos por WebChromeClient e sinal de retomada ao site. Não foi criada outra chave nem alterado o APK público, que continua 1.1.0/código 2. Falta a chave privada original para assinar uma atualização compatível. Nenhum keystore foi localizado no ambiente/repositório nem nas buscas dos arquivos salvos. Consulta ao contexto anterior estava indisponível. Não foi instalado em aparelho físico.
- Certificado esperado do APK público, SHA-256: 65:2E:41:D7:CE:6F:D5:3B:F7:51:50:C7:5B:B4:86:4D:80:7C:4A:B9:0F:B5:4A:18:F3:CE:D2:12:15:E0:FA:B1.
- WAR: reconhecimento conjunto de corpo/mão implementado e regras/testes preservados. Não equivale a COD Mobile em qualidade visual, mecânicas ou validação com um jogador físico.
- Dança: importação de áudio local, estimativa de BPM/fase, frases no ritmo e pausa/retomada com perda do corpo testados novamente em Chromium. Pesquisa de YouTube e reprodução da coreografia real de um vídeo não estão implementadas. Não foram simuladas como se estivessem prontas.
- 32 testes focais de aplicativo/atualização/layout/luzes e 31 de WAR/dança aprovados. Comparação de importação musical usa WAV de teste; não certifica todos os formatos da biblioteca Android.

A suíte completa de unidades passou: 312 testes, zero falhas. O layout continua auditável isoladamente: usa o cache no jogo e conserva a consulta independente quando carregado sem o módulo de orçamento.

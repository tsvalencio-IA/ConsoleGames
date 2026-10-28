# thIAguinho ARCADE para Android

Aplicativo próprio do ConsoleGames com os sete jogos. Abre o console HTTPS em WebView, com tela cheia, rotação, armazenamento de progresso e câmera opcional após a escolha do jogador. Precisa de internet para carregar os jogos e serviços online. Android 7.0 ou superior, com Android System WebView atualizado.

O aplicativo usa o pacote `br.com.thiaguinhosolucoes.arcade`, separado do OTTHI World. Não muda a configuração dos bancos nem inclui credenciais ou chaves de assinatura no repositório.

## Compilar e verificar

Java 17, SDK 35 e Gradle 8.7. Na pasta `android`, execute `gradle assembleProductionRelease assembleProductionDebug assembleProductionDebugAndroidTest lintProductionRelease`. O workflow instala a versão de validação no Android 35 e abre o console em retrato e paisagem, sem acessar contas ou partidas reais.

O APK release é alinhado durante a compilação e assinado fora do CI público. Use `apksigner sign --ks SUA_CHAVE --out thIAguinho-ARCADE.apk app-release-unsigned.apk` e `apksigner verify --verbose thIAguinho-ARCADE.apk`. Mantenha a mesma chave em futuras atualizações. Chaves e senhas nunca devem ser commitadas.

A variante `recovery` aponta para o mesmo servidor da revisão OT em `otthi-world-campanha-teste.vercel.app`. Compile com `gradle assembleRecoveryRelease assembleRecoveryDebug assembleRecoveryDebugAndroidTest lintRecoveryRelease`. O APK público desta variante é o 1.1.0 (código 2); a revisão fonte preparada é descrita abaixo. Mantém o pacote; uma atualização assinada exige a chave original. A variante `production` conserva o servidor GitHub Pages. O armazenamento do navegador é isolado por domínio; não há migração automática de dados entre esses dois servidores.

## Revisão preparada em 28/10/2026

O código da variante recovery passa a 1.2.0 (código 3), com ícone OT Games normal e adaptativo, seletor nativo de arquivos para a música da dança e aviso de retomada para conferir atualizações do console. Não exige permissão geral de armazenamento.

O APK público continua sendo o recovery 1.1.0 (código 2), SHA-256 `8ea2f38c966ee3b938dab2362569ef0224488ab5748c6e9ba1accb0336c0fc49`. Não é possível publicar uma atualização compatível do APK sem a chave privada original, não encontrada no ambiente/repositório ou nos arquivos salvos consultados. Certificado esperado, SHA-256: `65:2E:41:D7:CE:6F:D5:3B:F7:51:50:C7:5B:B4:86:4D:80:7C:4A:B9:0F:B5:4A:18:F3:CE:D2:12:15:E0:FA:B1`. Uma chave nova não substitui essa assinatura.

As atualizações dos jogos são conteúdo HTTPS, verificadas pelo manifesto/service worker; não dependem da chave Android. O console confere o worker ao abrir, a cada minuto visível, ao reconectar e ao voltar ao aplicativo, adiando recarga durante edição/autenticação. O mundo mantém sua atualização por release e ponto seguro. O projeto Vercel está conectado ao repositório e usa o build modular/empacotamento persistido, sem tokens no front-end.

A importação de música já funciona no navegador/PWA. No APK, o novo seletor exige instalar a versão Android assinada quando a chave original estiver disponível. Pesquisa e coreografia de vídeos do YouTube não estão implementadas nesta revisão.

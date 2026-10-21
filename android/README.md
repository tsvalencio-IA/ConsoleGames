# thIAguinho ARCADE para Android

Aplicativo próprio do ConsoleGames com os sete jogos. Abre o console HTTPS em WebView, com tela cheia, rotação, armazenamento de progresso e câmera opcional após a escolha do jogador. Precisa de internet para carregar os jogos e serviços online. Android 7.0 ou superior, com Android System WebView atualizado.

O aplicativo usa o pacote `br.com.thiaguinhosolucoes.arcade`, separado do OTTHI World. Não muda a configuração dos bancos nem inclui credenciais ou chaves de assinatura no repositório.

## Compilar e verificar

Java 17, SDK 35 e Gradle 8.7. Na pasta `android`, execute `gradle assembleRelease assembleDebug assembleDebugAndroidTest lintRelease`. O workflow instala a versão de validação no Android 35 e abre o console em retrato e paisagem, sem acessar contas ou partidas reais.

O APK release é alinhado durante a compilação e assinado fora do CI público. Use `apksigner sign --ks SUA_CHAVE --out thIAguinho-ARCADE.apk app-release-unsigned.apk` e `apksigner verify --verbose thIAguinho-ARCADE.apk`. Mantenha a mesma chave em futuras atualizações. Chaves e senhas nunca devem ser commitadas.

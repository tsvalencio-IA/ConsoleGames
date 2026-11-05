# Revisão dos controles, rotação e carga — 05/11/2026

Versão `705.28.18-revisao-mobile`, revisão `40ace149df68355d`, fonte `09c9b5718ca87978b3f7f612f94a1288a54b34fc`.

- 374 testes de unidade aprovados, zero falhas.
- Integridade SHA-256 dos 111 arquivos da release conferida.
- Dez mudanças de viewport no mesmo mundo, sem recarregar: botões dentro da tela, sem sobreposição, sem rótulos cortados ou quebrados; GPS e menu respondem.
- Player, família e progresso de teste preservados durante as mudanças de orientação.
- Três vistas da otimização de instâncias: zero diferenças de pixels em relação à referência.
- A prévia teve a barra da hospedagem desativada somente neste branch (`VERCEL_PREVIEW_FEEDBACK_ENABLED=0`), pois a injeção altera o HTML e impede a validação SHA-256 do instalador. A instalação voltou a abrir a versão correta sem alterar a verificação.

`performance.json` registra a comparação real do processo de teste. É Chromium com WebGL por software: seus tempos não representam FPS ou temperatura de um celular. Os registros não comprovam ausência de aquecimento, rotação por sensor físico, APK instalado ou multiplayer entre aparelhos reais. Não foram alterados a configuração ou as regras Firebase nem a identidade do aplicativo instalado.

A publicação e o ensaio do worker HTTPS ficam registrados em `../world-current-release.json`.

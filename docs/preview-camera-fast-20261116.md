# Prévia de câmera: carregamento rápido controlado
Branch: preview/otthi-fast-camera-20261116
Origem: preview/otthi-camera-evolucao-20261116

**Teste apenas; não mesclar em produção.**

A mudança anterior preservava 15 buckets. Esta nova versão (fast-preview) prepara inicialmente 8 deles com amostragem local, mantendo todas as luzes e o conjunto de buckets até 120 disponíveis. Uma variante faltante é compilada antes de ser usada na renderização e é preparada adicionalmente durante pausa. Isso **pode** produzir uma espera única numa vista densa (Claude observou que tais vistas são possíveis). Nunca omitir uma luz do quadro.

Para comparar as estratégias na mesma versão use:
- default: 1/8 (fast-preview)
- `?cameraFull=1`: 1/15 (preparação completa)

Ambas preservam as 12 vistas e todos os veículos. As medições por etapa ficam disponíveis em `window.OTTHI_BOOT_METRICS.snapshot()`.

**Pendente:** testes de FPS e aquecimento em Android real, câmera em curvas/voo, multiplayer, verificação de 10+ minutos, comparação antes/depois real. Nenhuma afirmação de 10/10.

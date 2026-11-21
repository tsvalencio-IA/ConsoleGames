# Integração do ConsoleGames em 20/11/2026

A branch de desenvolvimento parte de `4ce95d1`, que reúne a Academia de Aviação, as missões de voo e a recuperação mais recente. A versão servida no endereço habitual no início do trabalho foi 705.28.30, revisão `72c84d2063641ce2`. O [inventário da base](base.json) registra os oito motores e os seus commits. O checkpoint `6a5660a` guarda o trabalho local anterior à integração.

O catálogo, os retornos dos jogos e os portais resolvem a origem e o prefixo a partir da própria instalação. O console legado volta a `arcade/`. Links de atualizações, instalador, parâmetros de acesso e retornos dos portais têm caminhos próprios. O identificador de instalação web deriva da URL de entrada já usada pelo console. Os caches distinguem o jogo e o caminho da instalação. Os APKs distribuídos anteriormente conservam o endereço gravado no binário.

No Aero Strike, o manche usa a última posição válida durante a foto, o disparo e o turbo, com zona neutra para oscilações pequenas. A calibração de cinco segundos continua disponível. Em uma comparação controlada da pose erguendo uma mão, a base enviou inclinação de −0,85, arfagem de +1,00 e turbo. A correção enviou zero nos dois eixos e manteve o turbo desligado. O [ensaio de navegador](aero-reporter.json) registrou três fotos, miniaturas, pouso e um único registro de carreira. [Captura](aero-capture.png)

Na neve, cinco prédios foram reposicionados para liberar a estrada e os chalés. A auditoria manteve os 13 prédios decorativos. Nos três trechos de montanha, 4.905 amostras encontraram asfalto acima do terreno. A descontinuidade reproduzida de 1,45 m caiu para 0,00039 m no ponto medido.

O botão da foto acompanha o painel do balão e responde ao toque e à tecla F. O [ensaio de navegador](balloon.json) cumpriu a missão normal em perfil descartável, verificou quatro tamanhos de tela e recarregou com as 200 moedas da recompensa e um único recibo. [Captura](balloon-in-flight.png)

Os ensaios das duas missões usaram posições de aproximação preparadas e controle do tempo. O Aero Strike usou poses e vídeo simulados. Iluminação real, diferentes alturas com câmera física, resposta em celulares de entrada, multiplayer com aparelhos físicos e instalação de APK precisam de verificação em hardware. A comparação final de tempo de entrada em celular também continua pendente.

A produção fica na versão registrada no início deste trabalho. O resultado desta branch é destinado à prévia.

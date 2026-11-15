# Motorista e retorno bloqueado

Compra nativa no Mercadinho, recebimento, carro ocupando a vaga de retorno e segunda encomenda paga. Origem(−22;−12,7), jogador(3;−7), bloqueio(−22;1,35), vaga adjacente(−22;−1,35). Mesma preparação primária nas duas versões.

Antes: van bloqueada por 341,1 s e segunda encomenda esperando. Depois: vaga adjacente segura, retorno concluído e segunda compra atendida. Jogador muda de lugar na segunda entrega e motorista o acompanha. Recarga conserva pedido; recebimento aplica um recibo; outra recarga não duplica itens, moedas ou cobrança.

`before.json`/`after.json` registram pagamentos, posições, estados e inventários. Comparam módulos de entrega sobre a compilação26; a sessão integrada27 repete a cadeia com os demais sistemas. Movimento/colisão nativos, sem teleporte da van. Relógio controlado/desenho limitado: não compara velocidade de parede ouFPS.

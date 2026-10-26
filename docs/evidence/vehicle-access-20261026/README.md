# Destinos e embarque — evidência local

Fonte: bf57767cc199b5893684433bcc4d9b10771729aa

Build: 705.26.1-destinos-marina. Revisão: a5d8397ced44908a.

Os quatro relatórios passaram. A verificação do pacote usa a distribuição montada localmente, sem alterar recursos do jogo. O teste de percursos usa ganchos locais de inspeção para captura, nunca publicados no aplicativo. `fleet-models.json` verifica os 44 modelos e preservação da geometria do Fusca; não atesta fidelidade fotográfica. O teste nativo inclui navegação no mar e reprodução local do protocolo de passageiro. O pacote verifica 58 hashes, embarque de aeronaves e lancha, cinco rotas do GPS, WAR, neve, PWA, modelos reais de mãos/corpo com amostras estáticas oficiais e o APK existente.

240 testes de regras passaram. Os testes não abrem câmera física, não acessam salas ou jogadores reais e não certificam dois telefones online ou Android físico. A versão pública será registrada em relatório separado após a publicação.

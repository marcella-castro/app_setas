# Setas

Site que mostra figuras aleatórias para um jogo de reflexo com blocos.

**Jogar:** <https://marcella-castro.github.io/app_setas/>

## Como jogar

Escolha o jogo no menu lateral, aberto pelo botão no canto superior esquerdo. Cada jogo mostra só as suas próprias configurações e um link para o vídeo com as regras.

Nos jogos Direita-Esquerda-Pause e Cores, deite o celular na mesa e espalhe blocos à esquerda e à direita dele. Toque em **Iniciar** e, a cada figura, pegue o bloco certo. Quem pegar primeiro fica com o bloco, e no final cada jogador conta os seus.

| Figura | O que fazer |
|---|---|
| Seta | Pegar o bloco mais próximo do celular, do lado indicado |
| Cor na tela inteira (só no modo Cores) | Pegar um bloco daquela cor, de qualquer lado |
| Pause | Não pegar nada. A penalidade para quem pegar é combinada entre os jogadores |

Para encerrar, segure o dedo na tela por 1 segundo.

[Vídeo: como jogar os modos Direita-Esquerda-Pause e Cores](https://www.instagram.com/reel/DcWIYVIhAKV/?dlrf=MXUzZDNlbTRhZjBqZw==)

### Modo Copo

Neste modo, a criança joga sozinha, com blocos das cores do jogo e posições numeradas de 1 até o maior número configurado. Cada figura é um número com uma cor de fundo: a criança leva o bloco daquela cor até a posição daquele número. Se aparecer 1 em amarelo, ela leva o bloco amarelo até o 1. Se depois aparecer 1 em verde, ela troca e coloca o verde. Não há setas, pause nem pontos.

[Vídeo: como jogar o modo Copo](https://www.instagram.com/p/De80lpHvBaX/)

### Números nos dedos

Cada figura é um número de até 3 casas, de 1 a 999, em preto sobre a tela branca. Números de 1, 2 e 3 casas têm a mesma chance de aparecer. As regras estão no vídeo.

[Vídeo: como jogar Números nos dedos](https://www.instagram.com/reels/DfKvT2yszxC/)

### Arrume os lápis

A criança tem 4 lápis de cores diferentes. Cada figura é um arranjo de ☒ (linha, quadrado, X, M, L, T, escada ou +) com os lápis em posições sorteadas: ela arruma os lápis de verdade do mesmo jeito. Quando o arranjo tem mais de 4 posições, as que sobram ficam vazias, só com contorno. O mesmo arranjo não aparece duas vezes seguidas.

[Vídeo: como jogar Arrume os lápis](https://www.instagram.com/reel/DePhTpzNbrz/?utm_source=ig_web_copy_link&srtk=NTc4MTIwNjQ2YQ==)

## Configurações

- **Countdown:** de 0 a 10 segundos antes da primeira figura.
- **Tempo de cada figura:** de 0,5 a 10 segundos.
- **Maior número:** de 3 a 6, no modo Copo. Os números vão sempre de 1 até esse valor.
- **Cores:** quais das 9 cores entram nos modos Cores e Copo. A seleção é a mesma nos dois.
- **Cores dos lápis:** no modo Arrume os lápis, exatamente 4 das 9 cores, as dos lápis que você tem. A seleção é própria desse modo.
- **Som:** bipe no countdown e a cada figura. O bipe é igual para todas as figuras.

Os valores ficam salvos no celular.

## Desenvolvimento

O site usa HTML, CSS e JavaScript puros, sem dependências nem etapa de build.

```sh
npm test                 # testes do sorteio
python3 -m http.server   # site em http://localhost:8000
```

Os jogos do menu ficam em `GAMES` e as cores em `PALETTE`, ambos em [app.js](app.js). As chances de cada figura ficam em [draw.js](draw.js).

## Publicação

O site é publicado pelo GitHub Pages direto da raiz da branch `main`: em **Settings → Pages**, escolha **Deploy from a branch**, `main` e `/ (root)`.

# Setas

Site que mostra figuras aleatórias para um jogo de reflexo com blocos.

**Jogar:** <https://marcella-castro.github.io/app_setas/>

## Como jogar

Deite o celular na mesa e espalhe blocos à esquerda e à direita dele. Toque em **Iniciar** e, a cada figura, pegue o bloco certo. Quem pegar primeiro fica com o bloco, e no final cada jogador conta os seus.

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

## Configurações

- **Modo:** Direita-Esquerda-Pause, Cores ou Copo.
- **Countdown:** de 0 a 10 segundos antes da primeira figura.
- **Tempo de cada figura:** de 0,5 a 10 segundos.
- **Maior número:** de 3 a 6, no modo Copo. Os números vão sempre de 1 até esse valor.
- **Cores:** quais das 9 cores entram nos modos Cores e Copo. A seleção é a mesma nos dois.
- **Som:** bipe no countdown e a cada figura. O bipe é igual para todas as figuras.

Os valores ficam salvos no celular.

## Desenvolvimento

O site usa HTML, CSS e JavaScript puros, sem dependências nem etapa de build.

```sh
npm test                 # testes do sorteio
python3 -m http.server   # site em http://localhost:8000
```

A lista de cores fica em `PALETTE`, em [app.js](app.js), e as chances de cada figura ficam em [draw.js](draw.js).

## Publicação

O site é publicado pelo GitHub Pages direto da raiz da branch `main`: em **Settings → Pages**, escolha **Deploy from a branch**, `main` e `/ (root)`.

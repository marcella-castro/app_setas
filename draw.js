const PAUSE = { figure: { type: 'pause' }, weight: 0.1 };

function arrows(weightEach) {
  return [
    { figure: { type: 'left' }, weight: weightEach },
    { figure: { type: 'right' }, weight: weightEach },
  ];
}

function entriesFor(mode, colors) {
  if (mode === 'directions') return [...arrows(0.45), PAUSE];
  return [
    ...arrows(0.225),
    PAUSE,
    ...colors.map((color) => ({
      figure: { type: 'color', color },
      weight: 0.45 / colors.length,
    })),
  ];
}

export function pickFigure(mode, colors, random = Math.random) {
  const entries = entriesFor(mode, colors);
  let roll = random();
  for (const { figure, weight } of entries) {
    if (roll < weight) return figure;
    roll -= weight;
  }
  // Arredondamento de ponto flutuante pode deixar sobrar uma fração mínima.
  return entries.at(-1).figure;
}

// Sorteia primeiro a quantidade de casas: um sorteio direto de 1 a 999 daria
// três casas em 90% das vezes, e números como 2 ou 39 quase nunca apareceriam.
export function pickNumberFigure(random = Math.random) {
  const digits = Math.floor(random() * 3) + 1;
  const smallest = 10 ** (digits - 1);
  const count = 10 ** digits - smallest;
  return { type: 'number', number: smallest + Math.floor(random() * count) };
}

export function pickCupFigure(colors, maxNumber, random = Math.random) {
  return {
    type: 'cup',
    number: Math.floor(random() * maxNumber) + 1,
    color: colors[Math.floor(random() * colors.length)],
  };
}

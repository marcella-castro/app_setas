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

export function pickCupFigure(colors, maxNumber, random = Math.random) {
  return {
    type: 'cup',
    number: Math.floor(random() * maxNumber) + 1,
    color: colors[Math.floor(random() * colors.length)],
  };
}

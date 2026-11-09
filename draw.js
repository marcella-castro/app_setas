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

// Arranjos do jogo Arrume os lápis: cada # é uma posição (um ☒ na tela).
const PENCIL_LAYOUTS = [
  { id: 'line', rows: ['####'] },
  { id: 'square', rows: ['##', '##'] },
  { id: 'x', rows: ['#.#', '.#.', '#.#'] },
  { id: 'm', rows: ['#...#', '##.##', '#.#.#', '#...#'] },
  { id: 'l', rows: ['#..', '#..', '###'] },
  { id: 't', rows: ['###', '.#.', '.#.'] },
  { id: 'stairs', rows: ['#..', '##.', '###'] },
  { id: 'plus', rows: ['.#.', '###', '.#.'] },
].map(({ id, rows }) => ({
  id,
  cols: rows[0].length,
  rowCount: rows.length,
  slots: rows.flatMap((row, y) =>
    [...row].flatMap((char, x) => (char === '#' ? [{ x, y }] : [])),
  ),
}));

export const PENCIL_COUNT = 4;

// Os lápis (as cores) ocupam posições sorteadas do arranjo; as demais ficam vazias.
// O arranjo nunca repete o anterior.
export function pickPencilsFigure(colors, previousLayout, random = Math.random) {
  const options = PENCIL_LAYOUTS.filter(({ id }) => id !== previousLayout);
  const layout = options[Math.floor(random() * options.length)];
  const order = layout.slots.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const cells = layout.slots.map(({ x, y }) => ({ x, y, color: null }));
  colors.forEach((color, index) => {
    cells[order[index]].color = color;
  });
  return { type: 'pencils', layout: layout.id, cols: layout.cols, rows: layout.rowCount, cells };
}

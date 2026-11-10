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

// Arranjos do jogo Arrume os lápis, sempre com 4 lápis. Um arranjo pode vir de uma
// grade (# é uma posição; nela, só a linha deixa os lápis em pé e nos outros todos
// apontam para o centro) ou de posições e ângulos definidos à mão, em que o ângulo é
// o giro em graus de um lápis de ponta para cima e as posições podem ser fracionárias.
const PENCIL_LAYOUTS = [
  { id: 'line', rows: ['####'], upright: true },
  // X: quatro lápis em grade 2×2, todos apontando para o centro.
  { id: 'x', rows: ['##', '##'] },
  // Quadrado: cada lápis é um lado, em sentido horário.
  {
    id: 'square',
    cols: 2.12,
    rowCount: 2.12,
    slots: [
      { x: 0.56, y: 0, angle: 90 },
      { x: 1.12, y: 0.56, angle: 180 },
      { x: 0.56, y: 1.12, angle: 270 },
      { x: 0, y: 0.56, angle: 0 },
    ],
  },
  { id: 't', rows: ['###', '.#.'] },
  { id: 'zigzag', rows: ['##.', '.##'] },
  // L: 3 lápis em pé e 1 deitado no pé.
  {
    id: 'l',
    cols: 1.75,
    rowCount: 3,
    slots: [
      { x: 0, y: 0, angle: 0 },
      { x: 0, y: 1, angle: 0 },
      { x: 0, y: 2, angle: 0 },
      { x: 0.75, y: 2, angle: 90 },
    ],
  },
  // <>: duas pontas de lápis formam o "<" e as outras duas o ">".
  {
    id: 'angles',
    cols: 2,
    rowCount: 1.7,
    slots: [
      { x: 0, y: 0, angle: 225 },
      { x: 0, y: 0.7, angle: 315 },
      { x: 1, y: 0, angle: 135 },
      { x: 1, y: 0.7, angle: 45 },
    ],
  },
  // Y: dois lápis inclinados se encontram em cima de dois lápis em pé.
  {
    id: 'y',
    cols: 2,
    rowCount: 3,
    slots: [
      { x: 0, y: 0.25, angle: 135 },
      { x: 1, y: 0.25, angle: 225 },
      { x: 0.5, y: 1, angle: 0 },
      { x: 0.5, y: 2, angle: 0 },
    ],
  },
].map(({ id, rows, upright = false, cols, rowCount, slots }) => ({
  id,
  upright,
  cols: cols ?? rows[0].length,
  rowCount: rowCount ?? rows.length,
  slots:
    slots ??
    rows.flatMap((row, y) => [...row].flatMap((char, x) => (char === '#' ? [{ x, y }] : []))),
}));

export const PENCIL_COUNT = 4;

// Ângulo, em graus no sentido horário, que vira um lápis de ponta para cima
// em direção ao ponto (cx, cy).
function angleToward({ x, y }, cx, cy) {
  return Math.round((Math.atan2(cx - x, y - cy) * 180) / Math.PI);
}

// Os lápis ocupam as posições do arranjo em ordem sorteada. O arranjo nunca
// repete o anterior.
export function pickPencilsFigure(colors, previousLayout, random = Math.random) {
  const options = PENCIL_LAYOUTS.filter(({ id }) => id !== previousLayout);
  const layout = options[Math.floor(random() * options.length)];
  const shuffled = [...colors];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const cx = layout.slots.reduce((sum, { x }) => sum + x, 0) / layout.slots.length;
  const cy = layout.slots.reduce((sum, { y }) => sum + y, 0) / layout.slots.length;
  const cells = layout.slots.map((slot, index) => ({
    ...slot,
    color: shuffled[index],
    angle: slot.angle ?? (layout.upright ? 0 : angleToward(slot, cx, cy)),
  }));
  return { type: 'pencils', layout: layout.id, cols: layout.cols, rows: layout.rowCount, cells };
}

export const TOKEN_ROUND_SIZE = 5;
export const TOKEN_MAX_NUMBER = 10;

// Número e Fichas: sorteia 5 números diferentes de 1 a 10, cada um com uma cor
// (as cores podem repetir).
export function pickTokensRound(colors, random = Math.random) {
  const numbers = Array.from({ length: TOKEN_MAX_NUMBER }, (_, index) => index + 1);
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return numbers.slice(0, TOKEN_ROUND_SIZE).map((number) => ({
    type: 'token',
    number,
    color: colors[Math.floor(random() * colors.length)],
  }));
}

export const GRID_SIZE = 4;
export const GRID_NUMBERS = 3;
export const GRID_MAX_NUMBER = 6;

// Dadomente: sorteia 3 números diferentes de 1 a 6 e os põe em quadradinhos
// diferentes do quadriculado 4 por 4.
export function pickGridFigure(random = Math.random) {
  const shuffle = (items) => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };
  const numbers = shuffle(Array.from({ length: GRID_MAX_NUMBER }, (_, index) => index + 1));
  const squares = shuffle(Array.from({ length: GRID_SIZE ** 2 }, (_, index) => index));
  return {
    type: 'grid',
    size: GRID_SIZE,
    cells: numbers.slice(0, GRID_NUMBERS).map((number, index) => ({
      number,
      x: squares[index] % GRID_SIZE,
      y: Math.floor(squares[index] / GRID_SIZE),
    })),
  };
}

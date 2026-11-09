import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pickCupFigure, pickFigure, pickNumberFigure, pickPencilsFigure } from '../draw.js';

// Percorre todo o intervalo de Math.random em passos iguais, para que as
// frequências sejam exatas e o teste nunca falhe por azar.
function frequencies(mode, colors) {
  const steps = 10000;
  const counts = {};
  for (let i = 0; i < steps; i++) {
    const figure = pickFigure(mode, colors, () => (i + 0.5) / steps);
    const key = figure.type === 'color' ? figure.color : figure.type;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  for (const key in counts) counts[key] /= steps;
  return counts;
}

test('modo direções sorteia 45% esquerda, 45% direita e 10% pause', () => {
  assert.deepEqual(frequencies('directions', ['red', 'blue']), {
    left: 0.45,
    right: 0.45,
    pause: 0.1,
  });
});

test('modo cores divide 22,5% para cada seta, 10% pause e 45% entre as cores', () => {
  assert.deepEqual(frequencies('colors', ['red', 'blue', 'green']), {
    left: 0.225,
    right: 0.225,
    pause: 0.1,
    red: 0.15,
    blue: 0.15,
    green: 0.15,
  });
});

test('modo cores com uma única cor dá a ela os 45%', () => {
  assert.equal(frequencies('colors', ['pink']).pink, 0.45);
});

test('a figura de cor informa qual cor foi sorteada', () => {
  assert.deepEqual(pickFigure('colors', ['red'], () => 0.999), {
    type: 'color',
    color: 'red',
  });
});

test('sem gerador informado, usa Math.random e devolve uma figura válida', () => {
  assert.ok(['left', 'right', 'pause'].includes(pickFigure('directions', []).type));
});

// Percorre todas as combinações de dois sorteios em passos iguais.
function cupCounts(colors, maxNumber) {
  const steps = 60;
  const counts = {};
  for (let a = 0; a < steps; a++) {
    for (let b = 0; b < steps; b++) {
      const rolls = [(a + 0.5) / steps, (b + 0.5) / steps];
      const figure = pickCupFigure(colors, maxNumber, () => rolls.shift());
      const key = `${figure.number}-${figure.color}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return counts;
}

test('modo copo sorteia número e cor de forma independente e com chances iguais', () => {
  assert.deepEqual(cupCounts(['red', 'blue'], 3), {
    '1-red': 600,
    '1-blue': 600,
    '2-red': 600,
    '2-blue': 600,
    '3-red': 600,
    '3-blue': 600,
  });
});

test('modo copo vai de 1 até o maior número configurado', () => {
  const numbers = Object.keys(cupCounts(['red'], 6)).map((key) => key.split('-')[0]);
  assert.deepEqual(numbers.sort(), ['1', '2', '3', '4', '5', '6']);
});

test('números nos dedos dá a mesma chance a 1, 2 e 3 casas', () => {
  const steps = 60;
  const counts = { 1: 0, 2: 0, 3: 0 };
  for (let a = 0; a < steps; a++) {
    for (let b = 0; b < steps; b++) {
      const rolls = [(a + 0.5) / steps, (b + 0.5) / steps];
      counts[String(pickNumberFigure(() => rolls.shift()).number).length]++;
    }
  }
  assert.deepEqual(counts, { 1: 1200, 2: 1200, 3: 1200 });
});

for (const [rolls, number] of [
  [[0, 0], 1],
  [[0, 0.999], 9],
  [[0.5, 0], 10],
  [[0.5, 0.999], 99],
  [[0.999, 0], 100],
  [[0.999, 0.999], 999],
]) {
  test(`números nos dedos alcança o limite ${number}`, () => {
    const pending = [...rolls];
    assert.deepEqual(pickNumberFigure(() => pending.shift()), { type: 'number', number });
  });
}

test('a figura do modo copo informa tipo, número e cor', () => {
  assert.deepEqual(pickCupFigure(['pink'], 3, () => 0), {
    type: 'cup',
    number: 1,
    color: 'pink',
  });
});

const FOUR = ['red', 'blue', 'green', 'yellow'];

test('lápis: cada cor aparece uma vez, em posições diferentes', () => {
  for (let i = 0; i < 200; i++) {
    let n = i;
    const figure = pickPencilsFigure(FOUR, undefined, () => ((n += 37) % 200) / 200);
    assert.deepEqual(figure.cells.map((cell) => cell.color).sort(), [...FOUR].sort());
    const positions = new Set(figure.cells.map(({ x, y }) => `${x},${y}`));
    assert.equal(positions.size, 4);
  }
});

test('lápis: todos os arranjos podem sair e nenhum repete o anterior', () => {
  const layouts = (previous) =>
    new Set(
      Array.from(
        { length: 100 },
        (_, i) => pickPencilsFigure(FOUR, previous, () => (i + 0.5) / 100).layout,
      ),
    );
  assert.equal(layouts(undefined).size, 8);
  assert.equal(layouts('t').size, 7);
  assert.ok(!layouts('t').has('t'));
});

test('lápis: na linha todos ficam em pé', () => {
  for (let i = 0; i < 100; i++) {
    const figure = pickPencilsFigure(FOUR, undefined, () => (i + 0.5) / 100);
    if (figure.layout === 'line') assert.ok(figure.cells.every(({ angle }) => angle === 0));
  }
});

test('lápis: nos outros arranjos todos apontam para o centro', () => {
  const find = (layout) => {
    for (let i = 0; i < 100; i++) {
      const figure = pickPencilsFigure(FOUR, undefined, () => (i + 0.5) / 100);
      if (figure.layout === layout) return figure;
    }
  };
  const angles = (layout) => find(layout).cells.map(({ x, y, angle }) => `${x},${y}:${angle}`).sort();
  // O T tem 3 lápis em cima e 1 embaixo, todos apontando para o meio.
  assert.equal(find('t').cells.find(({ y }) => y === 1).angle, 0);
});

test('lápis: quadrado, L, <> e Y usam posições e ângulos fixos', () => {
  const find = (layout) => {
    for (let i = 0; i < 100; i++) {
      const figure = pickPencilsFigure(FOUR, undefined, () => (i + 0.5) / 100);
      if (figure.layout === layout) return figure;
    }
  };
  const angles = (layout) => find(layout).cells.map(({ angle }) => angle).sort((a, b) => a - b);
  assert.deepEqual(angles('square'), [0, 90, 180, 270]);
  assert.deepEqual(angles('l'), [0, 0, 0, 90]);
  assert.deepEqual(angles('angles'), [45, 135, 225, 315]);
  assert.deepEqual(angles('y'), [0, 0, 135, 225]);
});

test('lápis: o X aponta os 4 lápis na diagonal para o centro', () => {
  for (let i = 0; i < 100; i++) {
    const figure = pickPencilsFigure(FOUR, undefined, () => (i + 0.5) / 100);
    if (figure.layout === 'x') {
      assert.deepEqual(figure.cells.map(({ angle }) => angle).sort((a, b) => a - b), [-135, -45, 45, 135]);
    }
  }
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pickFigure } from '../draw.js';

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

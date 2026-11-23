import {
  PENCIL_COUNT,
  TOKEN_MAX_NUMBER,
  pickCupFigure,
  pickFigure,
  layoutPairEmojis,
  pickGridFigure,
  pickNumberFigure,
  pickPairRound,
  pickPencilsFigure,
  pickTokensRound,
} from './draw.js';

const STORAGE_KEY = 'setas-settings';
const FLASH_MS = 150;
const HOLD_TO_EXIT_MS = 1000;
const RELEASE_GRACE_MS = 100;

// ink é a cor do número no modo Copo, escolhida para contrastar com o fundo.
const PALETTE = [
  { id: 'red', name: 'Vermelho', hex: '#e53935', ink: '#ffffff' },
  { id: 'blue', name: 'Azul', hex: '#1e88e5', ink: '#ffffff' },
  { id: 'green', name: 'Verde', hex: '#43a047', ink: '#ffffff' },
  { id: 'yellow', name: 'Amarelo', hex: '#fdd835', ink: '#000000' },
  { id: 'orange', name: 'Laranja', hex: '#fb8c00', ink: '#000000' },
  { id: 'pink', name: 'Rosa', hex: '#f48fb1', ink: '#000000' },
  { id: 'brown', name: 'Marrom', hex: '#6d4c41', ink: '#ffffff' },
  // A borda branca diferencia o preto do flash entre as figuras.
  { id: 'black', name: 'Preto', hex: '#000000', ink: '#ffffff', outlined: true },
  { id: 'gray', name: 'Cinza', hex: '#9e9e9e', ink: '#000000' },
  { id: 'white', name: 'Branco', hex: '#ffffff', ink: '#000000' },
];

// Cor de cada número no Dadomente.
const GRID_COLORS = {
  1: '#43a047',
  2: '#8e24aa',
  3: '#fb8c00',
  4: '#e53935',
  5: '#1e88e5',
  6: '#f06292',
};

const ARROWS_TUTORIAL = 'https://www.instagram.com/reel/DcWIYVIhAKV/?dlrf=MXUzZDNlbTRhZjBqZw==';

// Cada jogo do menu lateral. Para adicionar um jogo, basta incluir uma entrada aqui.
const GAMES = [
  {
    id: 'directions',
    name: 'Direita-Esquerda-Pause',
    help: ARROWS_TUTORIAL,
    pick: ({ colors }) => pickFigure('directions', colors),
  },
  {
    id: 'colors',
    name: 'Cores',
    help: ARROWS_TUTORIAL,
    usesColors: true,
    pick: ({ colors }) => pickFigure('colors', colors),
  },
  {
    id: 'cup',
    name: 'Copo',
    help: 'https://www.instagram.com/p/De80lpHvBaX/',
    usesColors: true,
    usesMaxNumber: true,
    pick: ({ colors, maxNumber }) => pickCupFigure(colors, maxNumber),
  },
  {
    id: 'finger-numbers',
    name: 'Números nos dedos',
    help: 'https://www.instagram.com/reels/DfKvT2yszxC/',
    flashColor: '#ffffff',
    pick: () => pickNumberFigure(),
  },
  {
    id: 'pencils',
    name: 'Arrume os lápis',
    help: 'https://www.instagram.com/reel/DePhTpzNbrz/?utm_source=ig_web_copy_link&srtk=NTc4MTIwNjQ2YQ==',
    usesPencilColors: true,
    flashColor: '#ffffff',
    pick: ({ pencilColors }, previous) => pickPencilsFigure(pencilColors, previous?.layout),
  },
  {
    id: 'tokens',
    name: 'Número e Fichas',
    help: 'https://www.instagram.com/reel/DeFOSgGNvVG/',
    material: 'material/numero-e-fichas.pdf',
    usesTokenColors: true,
    flashColor: '#ffffff',
    // Uma rodada tem um número fixo de figuras e termina no gabarito.
    pickRound: ({ tokenColors }) => pickTokensRound(tokenColors),
  },
  {
    id: 'grid',
    name: 'Dadomente',
    help: 'https://www.instagram.com/p/Dez7gbRxUuO/',
    material: 'material/dadomente.pdf',
    flashColor: '#ffffff',
    // A figura fica na tela até a pessoa tocar em Próxima.
    manual: true,
    pick: () => pickGridFigure(),
  },
  {
    id: 'pair',
    name: 'Encontre o par',
    help: 'https://www.instagram.com/reels/Dfcl4KARuPh/',
    // Partida com jogo próprio (dois jogadores), que não passa pelo sorteio de figuras.
    pair: true,
  },
];

// Jogos com a própria seleção de cores. Nos lápis são exatamente 4; nas fichas,
// quantas a pessoa quiser (pelo menos 1).
const LIMITED_COLORS = [
  { setting: 'pencilColors', input: 'pencilColor', uses: 'usesPencilColors', id: 'pencil', exact: true },
  { setting: 'tokenColors', input: 'tokenColor', uses: 'usesTokenColors', id: 'token', exact: false },
];

const gameById = (id) => GAMES.find((game) => game.id === id);

const DEFAULTS = {
  mode: 'directions',
  countdown: 3,
  figureSeconds: 2,
  colors: ['red', 'blue', 'green', 'yellow'],
  pencilColors: ['red', 'blue', 'green', 'yellow'],
  tokenColors: ['blue', 'red', 'green', 'yellow'],
  maxNumber: 3,
  bestOf: 5,
  pairSeconds: 15,
  sound: true,
};

const form = document.querySelector('#settings-form');
const settingsScreen = document.querySelector('#settings');
const game = document.querySelector('#game');
const countdownNumber = document.querySelector('#countdown-number');
const bigNumber = document.querySelector('#big-number');
const menu = document.querySelector('#menu');
const gameList = document.querySelector('#game-list');

function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return DEFAULTS;
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Sem armazenamento disponível, os valores valem só até fechar a página.
  }
}

function readForm() {
  return {
    mode: form.elements.mode.value,
    countdown: Number(form.elements.countdown.value),
    figureSeconds: Number(form.elements.figureSeconds.value),
    colors: [...form.querySelectorAll('[name="color"]:checked')].map((input) => input.value),
    ...Object.fromEntries(
      LIMITED_COLORS.map(({ setting, input }) => [
        setting,
        [...form.querySelectorAll(`[name="${input}"]:checked`)].map((box) => box.value),
      ]),
    ),
    maxNumber: Number(form.elements.maxNumber.value),
    bestOf: Number(form.elements.bestOf.value),
    pairSeconds: Number(form.elements.pairSeconds.value),
    sound: form.elements.sound.checked,
  };
}

function formatSeconds(value) {
  return `${value.toLocaleString('pt-BR')} s`;
}

function renderColorOptions(list, field, selected) {
  document.querySelector(list).append(
    ...PALETTE.map(({ id, name, hex }) => {
      const label = document.createElement('label');
      label.className = 'color';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = field;
      input.value = id;
      input.checked = selected.includes(id);
      const content = document.createElement('span');
      const swatch = document.createElement('i');
      swatch.style.background = hex;
      content.append(swatch, name);
      label.append(input, content);
      return label;
    }),
  );
}

function renderMenu() {
  gameList.append(
    ...GAMES.map(({ id, name }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.game = id;
      button.textContent = name;
      button.addEventListener('click', () => {
        form.elements.mode.value = id;
        refreshForm();
        window.scrollTo(0, 0);
        menu.close();
      });
      return button;
    }),
  );
}

function refreshForm() {
  const settings = readForm();
  const selected = gameById(settings.mode);
  const missingColor = selected.usesColors && settings.colors.length === 0;
  let wrongColors = false;
  for (const { setting, input, uses, id, exact } of LIMITED_COLORS) {
    const count = settings[setting].length;
    const wrong = selected[uses] && (exact ? count !== PENCIL_COUNT : count === 0);
    wrongColors ||= wrong;
    if (exact) {
      for (const box of form.querySelectorAll(`[name="${input}"]`)) {
        box.disabled = count >= PENCIL_COUNT && !box.checked;
      }
    }
    document.querySelector(`#${id}-colors-field`).hidden = !selected[uses];
    document.querySelector(`#${id}-colors-error`).hidden = !wrong;
  }
  document.querySelector('#game-title').textContent = selected.name;
  document.querySelector('#help-link').href = selected.help;
  const materialLink = document.querySelector('#material-link');
  materialLink.hidden = !selected.material;
  if (selected.material) materialLink.href = selected.material;
  for (const button of gameList.children) {
    button.setAttribute('aria-current', String(button.dataset.game === selected.id));
  }
  document.querySelector('#countdown-value').value = formatSeconds(settings.countdown);
  document.querySelector('#figure-value').value = formatSeconds(settings.figureSeconds);
  document.querySelector('#figure-field').hidden = Boolean(selected.manual || selected.pair);
  document.querySelector('#best-of-value').value = settings.bestOf;
  document.querySelector('#best-of-field').hidden = !selected.pair;
  document.querySelector('#pair-seconds-value').value = formatSeconds(settings.pairSeconds);
  document.querySelector('#pair-seconds-field').hidden = !selected.pair;
  document.querySelector('#exit-hint').textContent = selected.pair
    ? 'Durante o jogo, segure o placar no centro por 1 segundo para encerrar.'
    : 'Durante o jogo, segure a tela por 1 segundo para encerrar.';
  document.querySelector('#max-number-value').value = settings.maxNumber;
  document.querySelector('#max-number-field').hidden = !selected.usesMaxNumber;
  document.querySelector('#colors-field').hidden = !selected.usesColors;
  document.querySelector('#colors-error').hidden = !missingColor;
  document.querySelector('#start').disabled = missingColor || wrongColors;
  saveSettings(settings);
}

function fillForm(settings) {
  form.elements.mode.value = settings.mode;
  form.elements.countdown.value = settings.countdown;
  form.elements.figureSeconds.value = settings.figureSeconds;
  form.elements.maxNumber.value = settings.maxNumber;
  form.elements.bestOf.value = settings.bestOf;
  form.elements.pairSeconds.value = settings.pairSeconds;
  form.elements.sound.checked = settings.sound;
  renderColorOptions('#color-list', 'color', settings.colors);
  for (const { setting, input, id } of LIMITED_COLORS) {
    renderColorOptions(`#${id}-color-list`, input, settings[setting]);
  }
}

// Som

let audio;
let soundOn = false;

function prepareSound(enabled) {
  soundOn = enabled;
  if (!enabled) return;
  // Os navegadores só liberam o áudio a partir de um toque, por isso nasce no Iniciar.
  audio ??= new AudioContext();
  audio.resume();
}

function beep(frequency, durationMs) {
  if (!soundOn) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const end = audio.currentTime + durationMs / 1000;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.3, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, end);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start();
  oscillator.stop(end);
}

const beepCountdown = () => beep(660, 120);
const beepStart = () => beep(1175, 300);
const beepFigure = () => beep(880, 70);
const beepRight = () => beep(1175, 200);
const beepWrong = () => beep(180, 250);

// Tela do jogo

function showFigure(state, background = '', outlined = false) {
  game.dataset.figure = state;
  game.style.backgroundColor = background;
  game.classList.toggle('outlined', outlined);
}

function writeBigNumber(number, ink) {
  const text = String(number);
  bigNumber.textContent = text;
  bigNumber.dataset.digits = text.length;
  bigNumber.style.color = ink;
}

const SVG = 'http://www.w3.org/2000/svg';

// Um lápis de pé, com a ponta para cima, que depois é girado para o ângulo sorteado.
function pencilCell(color, angle) {
  const { hex } = PALETTE.find(({ id }) => id === color);
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.style.transform = `rotate(${angle}deg)`;
  svg.innerHTML =
    `<path d="M38 28H62V86Q62 94 50 94Q38 94 38 86Z" fill="${hex}" stroke="#0004" stroke-width="1.5"/>` +
    '<path d="M38 28H44V90H42Q38 90 38 86Z" fill="#fff" opacity=".28"/>' +
    '<path d="M56 28H62V86Q62 90 58 90H56Z" fill="#000" opacity=".22"/>' +
    '<path d="M38 28L50 6L62 28Z" fill="#e9c08c"/>' +
    `<path d="M45.5 17L50 6L54.5 17Z" fill="${hex}"/>` +
    '<path d="M38 28L50 6L62 28" fill="none" stroke="#0003" stroke-width="1.5"/>';
  return svg;
}

function displayPencils({ cols, rows, cells }) {
  const board = document.querySelector('#pencils');
  board.style.setProperty('--cols', cols);
  board.style.setProperty('--rows', rows);
  board.replaceChildren(
    ...cells
      .filter(({ color }) => color)
      .map(({ x, y, color, angle }) => {
        const cell = pencilCell(color, angle);
        cell.style.left = `${(x / cols) * 100}%`;
        cell.style.top = `${(y / rows) * 100}%`;
        cell.style.width = `${100 / cols}%`;
        cell.style.height = `${100 / rows}%`;
        return cell;
      }),
  );
  showFigure('pencils', '#ffffff');
}

function displayToken({ number, color }) {
  document.querySelector('#token-number').textContent = number;
  document.querySelector('#token-dot').style.background = PALETTE.find(({ id }) => id === color).hex;
  showFigure('token', '#ffffff');
}

// Gabarito: as caixinhas de 1 a 10 em duas linhas, com a ficha de cada número sorteado.
function displayGrid({ size, cells }) {
  const board = document.querySelector('#grid');
  board.style.setProperty('--size', size);
  const squares = Array.from({ length: size * size }, () => document.createElement('div'));
  for (const { number, x, y } of cells) {
    squares[y * size + x].textContent = number;
    squares[y * size + x].style.color = GRID_COLORS[number];
  }
  board.replaceChildren(...squares);
  showFigure('grid', '#ffffff');
}

function displayAnswerKey(figures) {
  document.querySelector('#answer-grid').replaceChildren(
    ...Array.from({ length: TOKEN_MAX_NUMBER }, (_, index) => {
      const number = index + 1;
      const card = document.createElement('div');
      card.className = 'answer-card';
      const label = document.createElement('b');
      label.textContent = number;
      card.append(label);
      const figure = figures.find((item) => item.number === number);
      if (figure) {
        const dot = document.createElement('i');
        dot.style.background = PALETTE.find(({ id }) => id === figure.color).hex;
        card.append(dot);
      }
      return card;
    }),
  );
  showFigure('answer', '#ffffff');
}

function display(figure) {
  if (figure.type === 'grid') {
    displayGrid(figure);
    return;
  }
  if (figure.type === 'token') {
    displayToken(figure);
    return;
  }
  if (figure.type === 'pencils') {
    displayPencils(figure);
    return;
  }
  if (figure.type === 'number') {
    writeBigNumber(figure.number, '#000000');
    showFigure('number', '#ffffff');
    return;
  }
  if (!figure.color) {
    showFigure(figure.type);
    return;
  }
  const { hex, ink, outlined } = PALETTE.find(({ id }) => id === figure.color);
  if (figure.type === 'cup') writeBigNumber(figure.number, ink);
  showFigure(figure.type, hex, outlined);
}

// Rodada: os horários são absolutos para que atrasos dos timers não se acumulem.

let timer;

function at(time, action) {
  timer = setTimeout(action, Math.max(0, time - performance.now()));
}

function runCountdown(remaining, time, settings) {
  if (remaining === 0) {
    if (gameById(settings.mode).pair) {
      beepStart();
      startPairMatch(settings);
      return;
    }
    runFigure(time, settings, beepStart);
    return;
  }
  countdownNumber.textContent = remaining;
  showFigure('countdown');
  beepCountdown();
  at(time + 1000, () => runCountdown(remaining - 1, time + 1000, settings));
}

// Encontre o par: dois jogadores, um em cada ponta do aparelho deitado.

const PAIR_LOCK_MS = 1500;
const PAIR_FOUND_MS = 1500;
// Faixa no meio da tela, onde fica o placar, sem emojis.
const PAIR_CENTER_BAND = 36;

const pairSides = [document.querySelector('#pair-left'), document.querySelector('#pair-right')];
const pairFrames = pairSides.map((side) => side.querySelector('.pair-frame'));
const pairScoreBoxes = [document.querySelector('#score-left'), document.querySelector('#score-right')];
const pairAgain = document.querySelector('#pair-again');
const pair = { scores: [0, 0], target: 0, seconds: 0, active: false, lockedUntil: [0, 0], round: null, timers: [] };

function clearPair() {
  clearTimeout(timer);
  pair.timers.forEach(clearTimeout);
  pair.timers = [];
  pair.active = false;
}

function renderPairScore() {
  pairScoreBoxes.forEach((box, index) => {
    box.textContent = pair.scores[index];
  });
}

// Cada metade é um quadro girado para ficar de frente para o jogador da ponta.
function layoutPair() {
  const { clientWidth: width, clientHeight: height } = game;
  const frameHeight = Math.max(1, width / 2 - PAIR_CENTER_BAND);
  const aspect = height / frameHeight;
  pairFrames.forEach((frame, index) => {
    frame.style.width = `${height}px`;
    frame.style.height = `${frameHeight}px`;
    frame.style.top = `${height / 2}px`;
    frame.style.left = `${(index === 0 ? 0 : PAIR_CENTER_BAND) + frameHeight / 2}px`;
    const items = layoutPairEmojis(pair.round.sides[index], aspect);
    frame.replaceChildren(
      ...items.map(({ emoji, x, y, size, angle }) => {
        const element = document.createElement('div');
        element.className = 'pair-emoji';
        element.dataset.emoji = emoji;
        element.textContent = emoji;
        element.style.left = `${(x / aspect) * 100}%`;
        element.style.top = `${y * 100}%`;
        element.style.width = element.style.height = `${size * frameHeight}px`;
        element.style.fontSize = `${size * frameHeight * 0.8}px`;
        element.style.setProperty('--angle', `${angle}deg`);
        element.addEventListener('pointerdown', () => tapPairEmoji(index, emoji));
        return element;
      }),
    );
  });
}

function startPairRound() {
  clearPair();
  pair.round = pickPairRound();
  pair.lockedUntil = [0, 0];
  for (const side of pairSides) side.classList.remove('locked');
  pair.active = true;
  showFigure('pair', '#000000');
  layoutPair();
  // Se ninguém achar o par a tempo, a rodada é descartada e refeita.
  at(performance.now() + pair.seconds * 1000, startPairRound);
}

function startPairMatch(settings) {
  pair.scores = [0, 0];
  pair.target = (settings.bestOf + 1) / 2;
  pair.seconds = settings.pairSeconds;
  pairAgain.hidden = true;
  renderPairScore();
  startPairRound();
}

function tapPairEmoji(player, emoji) {
  const now = performance.now();
  if (!pair.active || now < pair.lockedUntil[player]) return;
  if (emoji !== pair.round.common) {
    pair.lockedUntil[player] = now + PAIR_LOCK_MS;
    pairSides[player].classList.add('locked');
    pair.timers.push(setTimeout(() => pairSides[player].classList.remove('locked'), PAIR_LOCK_MS));
    beepWrong();
    return;
  }
  clearPair();
  pair.scores[player]++;
  renderPairScore();
  beepRight();
  for (const frame of pairFrames) {
    for (const element of frame.children) {
      if (element.dataset.emoji === emoji) element.classList.add('found');
    }
  }
  at(now + PAIR_FOUND_MS, () => {
    if (pair.scores[player] >= pair.target) finishPairMatch(player);
    else startPairRound();
  });
}

function finishPairMatch(winner) {
  pairFrames.forEach((frame, index) => {
    const message = document.createElement('p');
    message.className = 'pair-message';
    message.textContent = index === winner ? 'Você ganhou! 🎉' : 'Você perdeu';
    frame.replaceChildren(message);
  });
  pairAgain.hidden = false;
  beepStart();
}

pairAgain.addEventListener('click', () => startRound(currentSettings));
window.addEventListener('resize', () => {
  if (game.dataset.figure === 'pair' && pair.active) layoutPair();
});

let lastFigure;
let round;
let roundIndex;

function runFigure(time, settings, playSound = beepFigure) {
  const definition = gameById(settings.mode);
  if (definition.pickRound) {
    round ??= definition.pickRound(settings);
    if (roundIndex === round.length) {
      displayAnswerKey(round);
      return;
    }
    lastFigure = round[roundIndex++];
  } else {
    lastFigure = definition.pick(settings, lastFigure);
  }
  display(lastFigure);
  playSound();
  if (definition.manual) return;
  const next = time + settings.figureSeconds * 1000;
  at(next - FLASH_MS, () => {
    showFigure('flash', definition.flashColor);
    at(next, () => runFigure(next, settings));
  });
}

// Tela ligada e tela cheia

let wakeLock;

async function keepScreenOn() {
  try {
    const lock = await navigator.wakeLock?.request('screen');
    if (game.hidden) lock?.release();
    else wakeLock = lock;
  } catch {
    // Sem suporte ou recusado: a tela segue o bloqueio automático do aparelho.
  }
}

function enterFullscreen() {
  document.documentElement.requestFullscreen?.().catch(() => {});
}

let currentSettings;

function startRound(settings) {
  clearPair();
  lastFigure = undefined;
  round = undefined;
  roundIndex = 0;
  runCountdown(settings.countdown, performance.now(), settings);
}

document.querySelector('#next-round').addEventListener('click', () => startRound(currentSettings));
document
  .querySelector('#next-figure')
  .addEventListener('click', () => runFigure(performance.now(), currentSettings));

function startGame(settings) {
  currentSettings = settings;
  settingsScreen.hidden = true;
  game.hidden = false;
  prepareSound(settings.sound);
  enterFullscreen();
  keepScreenOn();
  startRound(settings);
}

function stopGame() {
  if (game.hidden) return;
  clearPair();
  cancelHold();
  showFigure('flash');
  game.hidden = true;
  settingsScreen.hidden = false;
  wakeLock?.release();
  wakeLock = undefined;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

// Segurar para encerrar: um toque rápido ao pegar um bloco não interrompe o jogo.

const pressedPointers = new Set();
let holdTimer;
let holdCompleted = false;

function cancelHold() {
  clearTimeout(holdTimer);
  pressedPointers.clear();
  holdCompleted = false;
  game.classList.remove('holding');
}

function completeHold() {
  holdCompleted = true;
  clearPair();
  showFigure('flash');
}

function releasePointer(event) {
  if (!pressedPointers.delete(event.pointerId) || pressedPointers.size > 0) return;
  // A tela do jogo só sai depois de soltar o dedo: se saísse antes, o toque
  // cairia no controle que está embaixo dela, nas configurações.
  if (holdCompleted) setTimeout(stopGame, RELEASE_GRACE_MS);
  else cancelHold();
}

game.addEventListener('pointerdown', (event) => {
  // No Encontre o par os toques são dos jogadores; só o placar central encerra o jogo.
  if (game.dataset.figure === 'pair' && !event.target.closest('#pair-score')) return;
  pressedPointers.add(event.pointerId);
  if (pressedPointers.size > 1) return;
  game.classList.add('holding');
  holdTimer = setTimeout(completeHold, HOLD_TO_EXIT_MS);
});
window.addEventListener('pointerup', releasePointer);
window.addEventListener('pointercancel', releasePointer);
game.addEventListener('contextmenu', (event) => event.preventDefault());

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopGame();
});

document.querySelector('#menu-open').addEventListener('click', () => menu.showModal());
document.querySelector('#menu-close').addEventListener('click', () => menu.close());
// O conteúdo do menu cobre todo o painel, então um clique no próprio dialog veio do fundo.
menu.addEventListener('click', (event) => {
  if (event.target === menu) menu.close();
});

form.addEventListener('input', refreshForm);
form.addEventListener('submit', (event) => {
  event.preventDefault();
  startGame(readForm());
});

renderMenu();
fillForm(loadSettings());
refreshForm();

// navigator.standalone só existe no Safari do iOS, e é false fora da Tela de Início.
document.querySelector('#ios-hint').hidden = navigator.standalone !== false;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

import { pickCupFigure, pickFigure } from './draw.js';

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
];

const ARROWS_TUTORIAL = 'https://www.instagram.com/reel/DcWIYVIhAKV/?dlrf=MXUzZDNlbTRhZjBqZw==';
const HELP_VIDEOS = {
  directions: ARROWS_TUTORIAL,
  colors: ARROWS_TUTORIAL,
  cup: 'https://www.instagram.com/p/De80lpHvBaX/',
};

const DEFAULTS = {
  mode: 'directions',
  countdown: 3,
  figureSeconds: 2,
  colors: ['red', 'blue', 'green', 'yellow'],
  maxNumber: 3,
  sound: true,
};

const form = document.querySelector('#settings-form');
const settingsScreen = document.querySelector('#settings');
const game = document.querySelector('#game');
const countdownNumber = document.querySelector('#countdown-number');
const cupNumber = document.querySelector('#cup-number');

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
    maxNumber: Number(form.elements.maxNumber.value),
    sound: form.elements.sound.checked,
  };
}

function formatSeconds(value) {
  return `${value.toLocaleString('pt-BR')} s`;
}

function renderColorOptions(selected) {
  document.querySelector('#color-list').append(
    ...PALETTE.map(({ id, name, hex }) => {
      const label = document.createElement('label');
      label.className = 'color';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'color';
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

function refreshForm() {
  const settings = readForm();
  const usesColors = settings.mode !== 'directions';
  const missingColor = usesColors && settings.colors.length === 0;
  document.querySelector('#countdown-value').value = formatSeconds(settings.countdown);
  document.querySelector('#figure-value').value = formatSeconds(settings.figureSeconds);
  document.querySelector('#help-link').href = HELP_VIDEOS[settings.mode];
  document.querySelector('#max-number-value').value = settings.maxNumber;
  document.querySelector('#max-number-field').hidden = settings.mode !== 'cup';
  document.querySelector('#colors-field').hidden = !usesColors;
  document.querySelector('#colors-error').hidden = !missingColor;
  document.querySelector('#start').disabled = missingColor;
  saveSettings(settings);
}

function fillForm(settings) {
  form.elements.mode.value = settings.mode;
  form.elements.countdown.value = settings.countdown;
  form.elements.figureSeconds.value = settings.figureSeconds;
  form.elements.maxNumber.value = settings.maxNumber;
  form.elements.sound.checked = settings.sound;
  renderColorOptions(settings.colors);
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

// Tela do jogo

function showFigure(state, background = '', outlined = false) {
  game.dataset.figure = state;
  game.style.backgroundColor = background;
  game.classList.toggle('outlined', outlined);
}

function display(figure) {
  if (!figure.color) {
    showFigure(figure.type);
    return;
  }
  const { hex, ink, outlined } = PALETTE.find(({ id }) => id === figure.color);
  if (figure.type === 'cup') {
    cupNumber.textContent = figure.number;
    cupNumber.style.color = ink;
  }
  showFigure(figure.type, hex, outlined);
}

function nextFigure({ mode, colors, maxNumber }) {
  return mode === 'cup' ? pickCupFigure(colors, maxNumber) : pickFigure(mode, colors);
}

// Rodada: os horários são absolutos para que atrasos dos timers não se acumulem.

let timer;

function at(time, action) {
  timer = setTimeout(action, Math.max(0, time - performance.now()));
}

function runCountdown(remaining, time, settings) {
  if (remaining === 0) {
    runFigure(time, settings, beepStart);
    return;
  }
  countdownNumber.textContent = remaining;
  showFigure('countdown');
  beepCountdown();
  at(time + 1000, () => runCountdown(remaining - 1, time + 1000, settings));
}

function runFigure(time, settings, playSound = beepFigure) {
  display(nextFigure(settings));
  playSound();
  const next = time + settings.figureSeconds * 1000;
  at(next - FLASH_MS, () => {
    showFigure('flash');
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

function startGame(settings) {
  settingsScreen.hidden = true;
  game.hidden = false;
  prepareSound(settings.sound);
  enterFullscreen();
  keepScreenOn();
  runCountdown(settings.countdown, performance.now(), settings);
}

function stopGame() {
  if (game.hidden) return;
  clearTimeout(timer);
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
  clearTimeout(timer);
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

form.addEventListener('input', refreshForm);
form.addEventListener('submit', (event) => {
  event.preventDefault();
  startGame(readForm());
});

fillForm(loadSettings());
refreshForm();

// navigator.standalone só existe no Safari do iOS, e é false fora da Tela de Início.
document.querySelector('#ios-hint').hidden = navigator.standalone !== false;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

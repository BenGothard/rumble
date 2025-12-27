import { InMemoryAssetLoader } from './engine/assets.js';
import { ArenaSelector } from './engine/arena.js';
import { CpuBrain } from './engine/ai.js';
import { MatchController, MatchResult, MatchState } from './engine/match.js';
import { Action, InputDevice, InputFrame } from './engine/controls.js';

class LiveInput implements InputDevice {
  private held = new Set<Action>();
  private pauseToggle = false;

  constructor() {
    window.addEventListener('keydown', (event) => this.handleKeyDown(event));
    window.addEventListener('keyup', (event) => this.handleKeyUp(event));
    window.addEventListener('blur', () => this.held.clear());
  }

  poll(): InputFrame {
    const actions = new Set<Action>(this.held);
    if (this.pauseToggle) {
      actions.add('pause');
      this.pauseToggle = false;
    }
    return { actions };
  }

  consumePauseToggle(): boolean {
    if (this.pauseToggle) {
      this.pauseToggle = false;
      return true;
    }
    return false;
  }

  private handleKeyDown(event: KeyboardEvent) {
    const action = this.mapKey(event.key);
    if (!action) return;
    if (action === 'pause') {
      this.pauseToggle = true;
    } else {
      this.held.add(action);
    }
  }

  private handleKeyUp(event: KeyboardEvent) {
    const action = this.mapKey(event.key);
    if (!action || action === 'pause') return;
    this.held.delete(action);
  }

  private mapKey(key: string): Action | undefined {
    switch (key.toLowerCase()) {
      case 'a':
      case 'arrowleft':
        return 'moveLeft';
      case 'd':
      case 'arrowright':
        return 'moveRight';
      case 'w':
      case ' ':
      case 'arrowup':
        return 'jump';
      case 'j':
        return 'lightAttack';
      case 'k':
        return 'heavyAttack';
      case 's':
        return 'block';
      case 'p':
      case 'escape':
        return 'pause';
      default:
        return undefined;
    }
  }
}

const loader = new InMemoryAssetLoader(
  [
    { id: 'hero', displayName: 'Hero', prefabPath: 'Assets/Characters/Hero.prefab' },
    { id: 'cpu', displayName: 'CPU Brawler', prefabPath: 'Assets/Characters/Cpu.prefab' },
    { id: 'rogue', displayName: 'Rogue', prefabPath: 'Assets/Characters/Rogue.prefab' },
  ],
  [
    { id: 'dojo', displayName: 'Dojo', scenePath: 'Assets/Arenas/Dojo.scene', bounds: { width: 12, height: 6 } },
    { id: 'rooftop', displayName: 'Rooftop', scenePath: 'Assets/Arenas/Rooftop.scene', bounds: { width: 14, height: 7 } },
    { id: 'hangar', displayName: 'Hangar', scenePath: 'Assets/Arenas/Hangar.scene', bounds: { width: 16, height: 8 } },
  ]
);

const cpuBrain = new CpuBrain({ attackBias: 0.65, retreatHealthThreshold: 25 });
const liveInput = new LiveInput();
let controller: MatchController | null = null;
let arenaSelector: ArenaSelector | null = null;
let animationId: number | null = null;
let lastTimestamp = 0;
let previousState: MatchState = 'idle';
let logEntries: string[] = [];

const dom = {
  character: document.getElementById('character') as HTMLSelectElement,
  opponent: document.getElementById('opponent') as HTMLSelectElement,
  arena: document.getElementById('arena') as HTMLSelectElement,
  start: document.getElementById('start') as HTMLButtonElement,
  restart: document.getElementById('restart') as HTMLButtonElement,
  state: document.getElementById('state') as HTMLElement,
  round: document.getElementById('round') as HTMLElement,
  hud: document.getElementById('hud') as HTMLElement,
  pause: document.getElementById('pause') as HTMLElement,
  result: document.getElementById('result') as HTMLElement,
  log: document.getElementById('log') as HTMLElement,
};

async function setup() {
  const characters = await loader.loadCharacterAssets();
  const arenas = await loader.loadArenaAssets();
  arenaSelector = new ArenaSelector(arenas);

  fillSelect(dom.character, characters.map((c) => ({ id: c.id, label: c.displayName })));
  fillSelect(dom.opponent, characters.map((c) => ({ id: c.id, label: c.displayName })), 'cpu');
  fillSelect(dom.arena, arenas.map((a) => ({ id: a.id, label: a.displayName })));

  dom.start.addEventListener('click', () => startMatch());
  dom.restart.addEventListener('click', () => startMatch());

  renderStatus('idle');
}

function fillSelect(select: HTMLSelectElement, options: { id: string; label: string }[], defaultId?: string) {
  select.innerHTML = '';
  options.forEach((option) => {
    const node = document.createElement('option');
    node.value = option.id;
    node.textContent = option.label;
    if (defaultId && option.id === defaultId) {
      node.selected = true;
    }
    select.appendChild(node);
  });
}

async function startMatch() {
  if (!arenaSelector) return;
  stopLoop();
  controller = new MatchController(loader, arenaSelector, liveInput, cpuBrain);
  await controller.load(dom.character.value, dom.opponent.value, dom.arena.value);
  logEntries = [];
  previousState = controller.state;
  dom.result.textContent = '-';
  dom.restart.disabled = false;
  renderStatus(controller.state);
  startLoop();
  appendLog(`Match loaded in ${dom.arena.selectedOptions[0]?.textContent ?? dom.arena.value}`);
}

function startLoop() {
  lastTimestamp = performance.now();
  const tick = (timestamp: number) => {
    const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
    lastTimestamp = timestamp;
    if (controller) {
      const currentState = controller.state;
      if (currentState === 'paused') {
        if (liveInput.consumePauseToggle()) {
          controller.resume();
          appendLog('Resumed the match.');
        }
      } else if (currentState !== 'matchComplete') {
        const result = controller.update(dt);
        if (controller.state === 'paused') {
          appendLog(controller.renderPause());
        }
        if (result) {
          handleResult(result);
        }
      }
      renderStatus(controller.state);
    }
    animationId = requestAnimationFrame(tick);
  };
  animationId = requestAnimationFrame(tick);
}

function stopLoop() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function handleResult(result: MatchResult) {
  const winner = result.winner.config.displayName;
  const loser = result.loser.config.displayName;
  dom.result.textContent = `${winner} wins! ${winner} ${scoreFor(result, winner)} – ${loser} ${scoreFor(
    result,
    loser
  )}`;
  appendLog(dom.result.textContent);
}

function scoreFor(result: MatchResult, id: string): number {
  return result.roundsWon.get(id) ?? 0;
}

function renderStatus(state: MatchState) {
  if (!controller) return;
  dom.state.textContent = formatState(state);
  dom.round.textContent = state === 'idle' ? '-' : `${controller.currentRound} / ${controller.roundsToWin}`;
  dom.hud.textContent = controller.renderHud();
  dom.pause.textContent = controller.state === 'paused' ? controller.renderPause() : 'Press P/Escape to pause';
  if (previousState !== state) {
    appendLog(`State changed: ${formatState(previousState)} → ${formatState(state)}`);
    previousState = state;
  }
  renderLog();
}

function appendLog(entry: string) {
  logEntries.unshift(`[${new Date().toLocaleTimeString()}] ${entry}`);
  logEntries = logEntries.slice(0, 50);
  renderLog();
}

function renderLog() {
  dom.log.innerHTML = '';
  logEntries.forEach((entry) => {
    const div = document.createElement('div');
    div.className = 'entry';
    div.textContent = entry;
    dom.log.appendChild(div);
  });
}

function formatState(state: MatchState) {
  switch (state) {
    case 'idle':
      return 'Idle';
    case 'loading':
      return 'Loading';
    case 'roundActive':
      return 'Round Active';
    case 'roundOver':
      return 'Round Complete';
    case 'paused':
      return 'Paused';
    case 'matchComplete':
      return 'Match Complete';
    default:
      return state;
  }
}

setup().catch((err) => {
  console.error(err);
  appendLog(`Error: ${err.message}`);
});

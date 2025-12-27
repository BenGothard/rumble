import { InMemoryAssetLoader } from './engine/assets.js';
import { ArenaSelector } from './engine/arena.js';
import { CpuBrain } from './engine/ai.js';
import { MatchController } from './engine/match.js';
import { ScriptedInput, emptyFrame } from './engine/controls.js';

async function main() {
  const loader = new InMemoryAssetLoader(
    [
      { id: 'hero', displayName: 'Hero', prefabPath: 'Assets/Characters/Hero.prefab' },
      { id: 'cpu', displayName: 'CPU Brawler', prefabPath: 'Assets/Characters/Cpu.prefab' },
    ],
    [
      { id: 'dojo', displayName: 'Dojo', scenePath: 'Assets/Arenas/Dojo.scene', bounds: { width: 12, height: 6 } },
      { id: 'rooftop', displayName: 'Rooftop', scenePath: 'Assets/Arenas/Rooftop.scene', bounds: { width: 14, height: 7 } },
    ]
  );

  const arenaSelector = new ArenaSelector(await loader.loadArenaAssets());

  const scriptedInput = new ScriptedInput([
    { actions: new Set(['moveRight']) },
    { actions: new Set(['moveRight']) },
    { actions: new Set(['lightAttack']) },
    { actions: new Set(['moveLeft']) },
    { actions: new Set(['heavyAttack']) },
    { actions: new Set(['pause']) },
    emptyFrame(),
    { actions: new Set(['moveRight']) },
  ]);

  const cpuBrain = new CpuBrain({ attackBias: 0.7, retreatHealthThreshold: 20 });
  const match = new MatchController(loader, arenaSelector, scriptedInput, cpuBrain);
  await match.load('hero', 'cpu', 'dojo');

  console.log('Match loaded in arena', arenaSelector.byId('dojo').asset.displayName);

  let elapsed = 0;
  while (match.state !== 'matchComplete' && elapsed < 30) {
    const result = match.update(0.16);
    console.log(`HUD: ${match.renderHud()}`);
    if (match.state === 'paused') {
      console.log(match.renderPause());
      match.resume();
    }
    if (result) {
      console.log(`Winner: ${result.winner.config.displayName}`);
      break;
    }
    elapsed += 0.16;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

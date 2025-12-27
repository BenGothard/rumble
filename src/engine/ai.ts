import { Character } from './character.js';
import { Action, InputFrame } from './controls.js';

export interface AiIntent {
  attackBias: number;
  retreatHealthThreshold: number;
}

export class CpuBrain {
  constructor(private readonly intent: AiIntent) {}

  plan(self: Character, enemy: Character): InputFrame {
    const actions = new Set<Action>();
    const distance = Math.abs(self.position.x - enemy.position.x);

    if (self.health < this.intent.retreatHealthThreshold) {
      actions.add(self.position.x < enemy.position.x ? 'moveLeft' : 'moveRight');
    } else if (distance > self.config.attackRange * 0.8) {
      actions.add(self.position.x < enemy.position.x ? 'moveRight' : 'moveLeft');
    }

    if (distance < self.config.attackRange * 1.2 && Math.random() < this.intent.attackBias) {
      actions.add(distance < self.config.attackRange ? 'heavyAttack' : 'lightAttack');
    }

    if (Math.random() > 0.95) {
      actions.add('jump');
    }

    return { actions } as InputFrame;
  }
}

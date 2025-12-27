import { Character } from './character.js';

export interface MenuOption {
  label: string;
  action: () => void;
}

export class MainMenu {
  constructor(private readonly options: MenuOption[]) {}

  render(): string {
    return `Main Menu\n${this.options.map((o, i) => `${i + 1}. ${o.label}`).join('\n')}`;
  }
}

export class Hud {
  render(players: Character[]): string {
    return players
      .map((p) => `${p.config.displayName}: ${p.health}/${p.config.maxHealth} (${p.state})`)
      .join(' | ');
  }
}

export class PauseMenu {
  constructor(private readonly onResume: () => void) {}

  render(): string {
    return 'Paused - press resume';
  }

  resume() {
    this.onResume();
  }
}

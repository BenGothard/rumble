import { ArenaSelector, Arena } from './arena.js';
import { AssetLoader, CharacterAsset } from './assets.js';
import { Character, CharacterConfig } from './character.js';
import { InputDevice } from './controls.js';
import { Hud, PauseMenu } from './ui.js';
import { CpuBrain } from './ai.js';

export type MatchState = 'idle' | 'loading' | 'roundActive' | 'roundOver' | 'matchComplete' | 'paused';

export interface MatchResult {
  winner: Character;
  loser: Character;
  roundsWon: Map<string, number>;
}

export class MatchController {
  public state: MatchState = 'idle';
  public currentRound = 0;
  public readonly roundsToWin = 2;
  private arena?: Arena;
  private player?: Character;
  private opponent?: Character;
  private hud = new Hud();
  private pauseMenu = new PauseMenu(() => this.resume());
  private roundsWon = new Map<string, number>();

  constructor(
    private readonly loader: AssetLoader,
    private readonly arenaSelector: ArenaSelector,
    private readonly playerInput: InputDevice,
    private readonly cpuBrain: CpuBrain,
    private readonly cpuInput: InputDevice | null = null
  ) {}

  async load(characterId: string, opponentId: string, arenaId: string) {
    this.state = 'loading';
    const [chars, _arenas] = await Promise.all([
      this.loader.loadCharacterAssets(),
      this.loader.loadArenaAssets(),
    ]);
    const playerAsset = this.getCharacter(chars, characterId);
    const opponentAsset = this.getCharacter(chars, opponentId);
    this.arena = this.arenaSelector.byId(arenaId);
    this.player = this.toCharacter(playerAsset);
    this.opponent = this.toCharacter(opponentAsset);
    this.state = 'roundActive';
    this.currentRound = 1;
  }

  update(dt: number): MatchResult | undefined {
    if (!this.player || !this.opponent || !this.arena) return undefined;
    if (this.state === 'paused' || this.state === 'matchComplete') return undefined;

    if (this.state === 'roundOver') {
      this.startNextRound();
      return undefined;
    }

    const playerFrame = this.playerInput.poll();
    const cpuFrame = this.cpuInput?.poll() ?? this.cpuBrain.plan(this.opponent, this.player);

    if (playerFrame.actions.has('pause')) {
      this.state = 'paused';
      return undefined;
    }

    this.player.update(playerFrame, this.arena, this.opponent, dt);
    this.opponent.update(cpuFrame, this.arena, this.player, dt);

    const winner = this.checkRoundWinner();
    if (winner) {
      const loser = winner === this.player ? this.opponent : this.player;
      this.incrementScore(winner.config.id);
      if (this.roundsWon.get(winner.config.id)! >= this.roundsToWin) {
        this.state = 'matchComplete';
        return { winner, loser, roundsWon: this.roundsWon };
      }
      this.state = 'roundOver';
    }
    return undefined;
  }

  renderHud(): string {
    if (!this.player || !this.opponent) return '';
    return this.hud.render([this.player, this.opponent]);
  }

  renderPause(): string {
    return this.state === 'paused' ? this.pauseMenu.render() : '';
  }

  resume() {
    if (this.state === 'paused') {
      this.state = 'roundActive';
    }
  }

  private startNextRound() {
    if (!this.player || !this.opponent || !this.arena) return;
    this.currentRound += 1;
    this.player.position = { x: -2, y: 0 };
    this.opponent.position = { x: 2, y: 0 };
    this.player.health = this.player.config.maxHealth;
    this.opponent.health = this.opponent.config.maxHealth;
    this.state = 'roundActive';
  }

  private incrementScore(id: string) {
    this.roundsWon.set(id, (this.roundsWon.get(id) ?? 0) + 1);
  }

  private checkRoundWinner(): Character | undefined {
    if (!this.player || !this.opponent) return undefined;
    if (this.player.state === 'defeated') return this.opponent;
    if (this.opponent.state === 'defeated') return this.player;
    return undefined;
  }

  private toCharacter(asset: CharacterAsset): Character {
    const config: CharacterConfig = {
      id: asset.id,
      displayName: asset.displayName,
      maxHealth: 100,
      moveSpeed: 8,
      jumpStrength: 10,
      lightDamage: 10,
      heavyDamage: 20,
      attackRange: 1.5,
    };
    return new Character(config);
  }

  private getCharacter(characters: CharacterAsset[], id: string): CharacterAsset {
    const found = characters.find((c) => c.id === id);
    if (!found) {
      throw new Error(`Character ${id} not found`);
    }
    return found;
  }
}

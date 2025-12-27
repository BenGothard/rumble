import { clampVector, Vector2 } from '../types.js';
import { ArenaAsset } from './assets.js';

export class Arena {
  constructor(public readonly asset: ArenaAsset) {}

  clampPosition(position: Vector2): Vector2 {
    const halfWidth = this.asset.bounds.width / 2;
    const halfHeight = this.asset.bounds.height / 2;
    return clampVector(position, { x: -halfWidth, y: 0 }, { x: halfWidth, y: halfHeight });
  }
}

export class ArenaSelector {
  constructor(private readonly arenas: ArenaAsset[]) {}

  byId(id: string): Arena {
    const asset = this.arenas.find((a) => a.id === id) ?? this.arenas[0];
    if (!asset) {
      throw new Error('No arenas available');
    }
    return new Arena(asset);
  }
}

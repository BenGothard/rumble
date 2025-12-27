export interface CharacterAsset {
  id: string;
  displayName: string;
  prefabPath: string;
  animationSet?: string;
}

export interface ArenaAsset {
  id: string;
  displayName: string;
  scenePath: string;
  bounds: { width: number; height: number };
}

export interface AssetLoader {
  loadCharacterAssets(): Promise<CharacterAsset[]>;
  loadArenaAssets(): Promise<ArenaAsset[]>;
}

export class InMemoryAssetLoader implements AssetLoader {
  constructor(
    private readonly characters: CharacterAsset[],
    private readonly arenas: ArenaAsset[]
  ) {}

  async loadCharacterAssets(): Promise<CharacterAsset[]> {
    return this.characters;
  }

  async loadArenaAssets(): Promise<ArenaAsset[]> {
    return this.arenas;
  }
}

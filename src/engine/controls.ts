export type Action = 'moveLeft' | 'moveRight' | 'jump' | 'lightAttack' | 'heavyAttack' | 'block' | 'pause';

export interface InputFrame {
  actions: Set<Action>;
}

export function emptyFrame(): InputFrame {
  return { actions: new Set<Action>() };
}

export interface InputDevice {
  poll(): InputFrame;
}

export class ScriptedInput implements InputDevice {
  private index = 0;

  constructor(private readonly script: InputFrame[]) {}

  poll(): InputFrame {
    const frame = this.script[this.index] ?? emptyFrame();
    this.index = Math.min(this.index + 1, this.script.length);
    return frame;
  }
}

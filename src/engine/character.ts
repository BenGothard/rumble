import { Action, InputFrame } from './controls.js';
import { Vector2, add, clamp } from '../types.js';
import { Arena } from './arena.js';

export interface CharacterConfig {
  id: string;
  displayName: string;
  maxHealth: number;
  moveSpeed: number;
  jumpStrength: number;
  lightDamage: number;
  heavyDamage: number;
  attackRange: number;
}

export type CharacterState = 'idle' | 'running' | 'jumping' | 'attacking' | 'hitstun' | 'defeated';

export class Character {
  public position: Vector2 = { x: 0, y: 0 };
  public velocity: Vector2 = { x: 0, y: 0 };
  public health: number;
  public state: CharacterState = 'idle';
  public facing: 1 | -1 = 1;
  private attackCooldown = 0;
  private grounded = true;

  constructor(public readonly config: CharacterConfig) {
    this.health = config.maxHealth;
  }

  update(input: InputFrame, arena: Arena, enemy: Character, dt: number) {
    this.handleMovement(input, arena, dt);
    this.handleAttacks(input, enemy);
    this.applyPhysics(arena, dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
  }

  private handleMovement(input: InputFrame, arena: Arena, dt: number) {
    const speed = this.config.moveSpeed * dt;
    let newState: CharacterState = 'idle';
    if (input.actions.has('moveLeft')) {
      this.position.x -= speed;
      this.facing = -1;
      newState = 'running';
    } else if (input.actions.has('moveRight')) {
      this.position.x += speed;
      this.facing = 1;
      newState = 'running';
    }

    if (input.actions.has('jump') && this.grounded) {
      this.velocity.y = this.config.jumpStrength;
      this.grounded = false;
      newState = 'jumping';
    }

    this.position = arena.clampPosition(this.position);
    if (this.state !== 'attacking' && this.state !== 'hitstun') {
      this.state = newState;
    }
  }

  private handleAttacks(input: InputFrame, enemy: Character) {
    if (this.state === 'hitstun' || this.state === 'defeated') return;
    const wantsAttack = input.actions.has('lightAttack') || input.actions.has('heavyAttack');
    if (!wantsAttack || this.attackCooldown > 0) return;

    const damage = input.actions.has('heavyAttack') ? this.config.heavyDamage : this.config.lightDamage;
    const knockback = input.actions.has('heavyAttack') ? 2 : 1;
    this.state = 'attacking';
    this.attackCooldown = 0.8;
    const attackPosition: Vector2 = add(this.position, { x: this.facing * this.config.attackRange, y: 0 });
    const distanceToEnemy = Math.abs(enemy.position.x - attackPosition.x);
    if (distanceToEnemy <= this.config.attackRange && Math.abs(enemy.position.y - attackPosition.y) < 1.5) {
      enemy.takeHit(damage, knockback * this.facing);
    }
  }

  public takeHit(damage: number, knockback: number) {
    if (this.state === 'defeated') return;
    this.health = clamp(this.health - damage, 0, this.config.maxHealth);
    this.velocity.x = knockback;
    this.state = this.health === 0 ? 'defeated' : 'hitstun';
  }

  private applyPhysics(arena: Arena, dt: number) {
    if (!this.grounded) {
      this.velocity.y -= 9.81 * dt;
    }
    this.position = add(this.position, { x: this.velocity.x * dt, y: this.velocity.y * dt });
    const clamped = arena.clampPosition(this.position);
    if (clamped.y <= 0) {
      this.position.y = 0;
      this.velocity.y = 0;
      this.grounded = true;
      if (this.state === 'jumping') {
        this.state = 'idle';
      }
    } else {
      this.position = clamped;
    }
    this.velocity.x = this.velocity.x * 0.9;
    if (this.state === 'hitstun' && this.health > 0) {
      this.state = 'idle';
    }
  }
}

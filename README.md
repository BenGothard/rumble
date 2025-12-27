# Rumble

Prototype for a 2D arena fighting game. The project is set up as a TypeScript simulation that can be ported to engines such as Unity or Godot.

## Features
- Core systems for character control, CPU AI, and combat (movement, attacks, hit detection, health).
- Arena selection and round-based match flow with win/loss handling.
- Basic UI scaffolding for main menu, HUD, and pause menu rendering.
- Asset loading hooks for characters and arenas via the `AssetLoader` interface.

## Getting started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the scripted simulation demo:
   ```bash
   npm start
   ```
3. Type-check/build the project:
   ```bash
   npm run build
   ```

The demo uses in-memory assets and a scripted player input sequence to showcase the match loop. Integrate real input devices, renderers, and engine-specific asset pipelines by implementing `AssetLoader`, wiring `InputDevice` to your platform, and replacing the console logging in `src/index.ts` with your chosen UI layer.

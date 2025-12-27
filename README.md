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

4. Build the browser demo (outputs to `site/` for GitHub Pages):
   ```bash
   npm run build:web
   ```

   Open `site/index.html` locally to try the keyboard-controlled text HUD.

## GitHub Pages

A GitHub Actions workflow (`Deploy Pages`) builds the browser demo on pushes to `main` and publishes it to GitHub Pages. Keyboard controls:

- A / Left Arrow – Move Left
- D / Right Arrow – Move Right
- W / Space – Jump
- J – Light Attack
- K – Heavy Attack
- S – Block
- P or Escape – Pause/Resume

The demo uses in-memory assets and a scripted player input sequence to showcase the match loop. Integrate real input devices, renderers, and engine-specific asset pipelines by implementing `AssetLoader`, wiring `InputDevice` to your platform, and replacing the console logging in `src/index.ts` with your chosen UI layer.

# The Meridian Vault

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/eziebatozai/heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/eziebatozai/heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A top-down stealth heist game for make.fun's "Make the best heist game". One
diamond. Three guards. Two cameras. One way out.

## The job

Wren the thief slips into the Meridian Gallery after hours. The Meridian
Diamond sits on its pedestal in the central hall, just above guard Marlowe's
patrol line. Grab it, then slip out through the skylight vent in the west
gallery — and try not to be seen doing it.

- **Guards** patrol fixed beats with visible vision cones. Step into a cone
  and the guard gives chase; get caught and the heist is over.
- **Cameras** sweep the hall and the vault with red cones. They cannot chase,
  but they raise the alarm all the same.
- **The alarm meter** climbs while anyone has eyes on you and falls while you
  are hidden. At 100% the gallery doors slam shut.
- **Smoke bombs** (2 per run, press E) swallow every sight line through them —
  the way to take the diamond from under the ceiling camera.
- **Gold bars** in the east vault are worth a detour, if you dare.
- **Cover** is real: walls and crates block both movement and sight, so read
  the cones before you move.

## Controls

| Key | What it does |
| --- | --- |
| WASD / arrow keys | Move Wren |
| E | Drop a smoke bomb |
| R | Restart the heist |
| M | Mute the sounds |
| Enter / click | Start from the title screen |

## Playing it

Serve `game/` from any static server and open it in a desktop browser — no
build step, no network requests, vanilla JavaScript only:

```
cd game && python3 -m http.server 8080
```

then open http://localhost:8080. The screenshots in `screenshots/` are real
renders of the game's own code, staged through `?shot=start|play|alarm|win`
in `game/src/shots.js`: each scene plays the real rules forward from a fresh
world with a scripted run, so every frame is what a short game really looks
like.

## Layout

- `game/index.html` — the page shell and canvas.
- `game/src/config.js` — every tuning number and colour in one place.
- `game/src/level.js` — the museum floor plan: walls, cover, patrols,
  cameras, loot, exit and spawn.
- `game/src/world.js` — one fixed step of the heist: movement, guard AI,
  camera sweeps, vision and line of sight, the alarm, loot and smoke.
- `game/src/render.js` — everything the player sees, including the HUD and
  the title, win and busted screens.
- `game/src/input.js` — keyboard and mouse.
- `game/src/sound.js` — tiny WebAudio beeps; no audio files.
- `game/src/shots.js` — the staged screenshot scenes.
- `game/src/main.js` — boot and the game loop.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- Initial project structure with separate `engine` (Rust/WASM) and `frontend` (JavaScript) directories.
- Skeleton modules for engine: `math`, `simulation`, `wasm_bridge`.
- Skeleton modules for frontend: `renderer`, `input`, `ui`.
- i18n locale directory with English default (`locales/en.json`).
- `.gitignore` covering Rust build artifacts, WASM `pkg/` output, and frontend `dist/` and `node_modules`.
- First playable fullscreen browser frontend with a dark grid canvas, start screen, game-over screen, and semi-transparent HUD panels for lives, score, timer, wave, and boid count.
- WASM-facing `GameEngine` bridge that spawns boids, advances the flock, reports collisions, and returns flat position buffers to JavaScript.
- Player-seeking boid steering with unit coverage for the new target-seeking rule and flock update behaviour.
- Keyboard-driven player movement with acceleration, deceleration, and maximum speed.
- Post-update boid overlap resolution so the flock stays spread out instead of collapsing into a single stacked point.
- A local segmented life bar drawn directly beneath the player character.
- Wave progression that spawns additional, harder boid variants with colour tiers.
- Three-second start countdown with initial boids spawned away from the player.
- Boids are now drawn as small arrows that point along their flight direction, so the swarm's movement is readable at a glance.
- Target framerate selector (30, 60, or 120 FPS) in the start menu; the highest option renders as fast as the display allows. The choice is kept for the rest of the session, including restarts.
- Vitest as the frontend test runner (`npm test`, `npm run test:watch` in `frontend/`), configured to
  run in Node so the suite needs neither a browser nor a built WebAssembly package. First covered
  module is the frametime graph's `FrameMetrics`: simulation-time accumulation across undrawn frames,
  ring-buffer wraparound, the peak leaving the window, `summary()` on an empty buffer, and `reset()`.
- Optional frametime graph, switchable in the start menu and drawn in the top-left corner. Each bar is one rendered frame, stacking simulation time (including the WebAssembly boundary) below draw time, with the current frame total, the window's peak, and a dashed line marking the frame budget. The vertical axis follows the selected target framerate, and frames past the top of the scale are capped in red. It measures script work only, not GPU time.

- Start-menu option for the frametime graph's curves: "separate" keeps simulation and draw time as two curves, "combined" plots a single curve for the whole frame.
- A collapsed "Developer Settings" section in the start menu, holding the frametime-graph options.
- A player dash on the space bar. It fires in the direction currently held on the movement keys and
  gives the player a short burst of about three times their top speed, which then bleeds off as if
  slowed by friction — enough to cover roughly 180 pixels and slip out of a closing swarm. Pressing
  the space bar without a direction held does nothing and does not spend the cooldown, and a dash into
  the edge of the world stops there. A bar at the bottom centre of the screen shows the 1.4 second
  cooldown: it empties on use and refills from the left, cyan again once the dash is ready. The space
  bar is only claimed while a round is running, so it keeps activating the menu buttons everywhere
  else.
- A visible warning before a boid dashes: the boid pulses in both size and brightness, and the pulse
  speeds up and grows stronger the closer the lunge gets, so the swarm reads as "that one, in a
  moment" rather than as a sudden hit out of nowhere. A boid stays slightly enlarged and bright for
  the duration of its lunge.
- Boids from wave three onward can dash at the player. A dash runs in four phases: the boid first
  charges up for about three quarters of a second, then lunges at the position the player stood in
  at the moment of the launch, then flocks normally again, and finally waits out a cooldown before it
  may dash again. Cohesion and alignment are switched off for the duration of the lunge, so a dashing
  boid visibly breaks out of the swarm and is pulled back in by cohesion afterwards; separation stays
  on, so it curves around anything in its path instead of ploughing through it. Only a handful of
  boids may charge or dash at the same time, and the flock hands out a new dash slot only every 40
  simulation steps, so the swarm never turns into a wall of lunges. Later waves warn for a shorter
  time, dash faster and further, and recover quicker.

- Scaffold for the university project and architecture report under `documentation/report/`: one
  Markdown file per required chapter, each pre-filled with the headings the assignment asks for, the
  sources it is to be composed from, and what still blocks it. `00-index.md` tracks per-chapter status
  and holds the assembly recipe.
- `documentation/report/projekt-journal.md`, an append-only record of the facts that cannot be
  reconstructed later: hours actually spent per session, technical decisions with their rejected
  alternatives, and challenges. It is now a mandatory per-change step, so the report grows alongside
  the code instead of being written at the end.
- `documentation/muster-referenz.md`, a written-out reference of the professor's sample report: its
  chapter structure and the detail depth of each chapter, an analysis of the writing style and the
  argument patterns that earned it its grade, the mapping from its chapters onto ours, and the rules
  that follow for writing this report. The PDF's text layer is incomplete, so the Markdown file — not
  the PDF — is the working source; `CLAUDE.md` and `documentation/report/00-index.md` point to it.
- Prompt logs under `ai/` now carry a `topic` and a `use` field, classifying each prompt by subject
  area and by what became of the answer. All existing entries were classified.
- `npm run docs:ki-verzeichnis` generates the report's AI index from `ai/*.json`, grouped by subject
  area with the model mix.
- `npm run docs:check` reports, without failing, whether today's prompt log, journal entry and
  changelog edit are in place, and flags source files past the 400-line limit.
- Plan hours for the tooling and documentation measures the assignment requires (`T-01`…`T-06`,
  `D-01`) in `docs/specs-overview.md`, together with the resulting over-budget total and the
  deliberate cut that pays for it.
- Coverage reporting on both sides of the language boundary, reported separately rather than blended:
  `npm run test:coverage` in `frontend/` (`@vitest/coverage-v8`, text plus HTML plus a JSON summary)
  and `cargo llvm-cov --lib` in `engine/`. Untested frontend modules count against the percentage,
  and the two largest DOM modules are deliberately not excluded, so the number states how much of the
  frontend this Node-only suite cannot reach instead of hiding it.
- Unit tests for four frontend modules that had none: the fixed-timestep `FrameScheduler` (step
  accounting, leftover time carried between frames, the catch-up cap, and the clock reset that keeps a
  frozen countdown from becoming a burst), the `GameState` machine, `buildControls` (including that one
  space-bar press reaches exactly one simulation step of a multi-step frame), and the whole
  `PlayerController` (acceleration, braking to a complete stop, the dash and its decay, the wall clamp,
  and the delta-time cap that stops a backgrounded tab from teleporting the player).
- WASM boundary tests in `engine/tests/wasm_tests.rs`, which was previously an empty stub. They cover
  the four-buffer frame contract that plain `cargo test` cannot reach at all, because the buffer
  getters return `js_sys` typed arrays and need a JavaScript runtime: index alignment across all four
  buffers, `snapshot` not advancing the world, the wave spawner's safe distance from the player, the
  window-resize wrap, and the sign convention of the dash phase. Run with `wasm-pack test`.
- End-to-end tests (`npm run test:e2e`, Playwright) covering the paths that only exist in a real
  browser: that the WASM module loads, the menu and its option groups, the HUD, the round lifecycle
  from start through death to restart, and that the space bar belongs to the dash during a round and
  to the menu outside one. They run against the **production build** rather than the dev server,
  which is what surfaced the missing locale file. `npm run test:e2e:report` opens the HTML report.
- The four HUD panels now carry stable ids (`hud-timer`, `hud-wave`, `hud-score`, `hud-boids`)
  alongside their position classes, so the end-to-end tests assert on what a panel shows rather than
  on where it currently sits.

- Temporary obstacles in the world. Circles and bars appear for thirty seconds at a time, block the player, and cost a life on contact. Running into one does not stop the player dead: the part of their movement heading into the surface is removed and the part running along it is kept, so they slide along the obstacle the way they already do along the edge of the world, and a dash that hits one ends there. A life is spent through the same grace period as a boid hit, so leaning on an obstacle costs one life rather than all of them. Obstacles fade in when they appear and out before they go, so one never materialises on top of the player without warning.
- Obstacle density rises over a run: from one obstacle roughly every nine seconds with two in the world at once, up to one every three seconds with eight at once. The ramp runs about twice as far as the boid difficulty ramp, which is at its limit from wave five on.
- Obstacles can never trap the player. Every one keeps a corridor wider than the player between itself and every other obstacle, every world edge, and the player at the moment it appears — which makes each obstacle an island that can always be walked around, so a dead end cannot be built. The density is a target and the corridor rule is absolute: if no legal spot is found, no obstacle appears that round. Shrinking the window removes any obstacle that would break the rule against the new bounds.
- The flock steers around obstacles instead of pressing into them. The avoidance force mixes the direction away from the surface with the direction along it, picking whichever way a boid is already flying, so it curves past rather than stalling in front. A boid an obstacle appears on top of is pushed back out onto the surface; a dashing boid keeps its straight line and ignores obstacles entirely.

### Changed

- Rebalanced the opening difficulty: a round now starts with 12 boids instead of 36, each wave adds 6 instead of 12, and boids perceive their neighbours within 70 pixels instead of 85, so the early swarm is looser and the ramp is gentler.
- The frametime graph's vertical axis now follows the selected target framerate instead of the measured load. The dashed line always marks the frame budget of that framerate (16.67 ms at 60 FPS) and sits halfway up the plot, so the free half above it shows by how much a frame missed its budget. The axis therefore holds still for a whole round: the same curve height always means the same cost.
- The frametime graph now draws continuous curves instead of stacked bars, in the style of an external frametime monitor: a thin line over a tinted area, scrolling in from the left while the history fills up.
- The frametime graph's numbers are now averages over the visible window rather than the newest frame alone. Browsers deliberately round `performance.now()` (Firefox to a whole millisecond), so a single frame's cost can only ever be reported as an integer; averaging the window restores the decimal place. The peaks stay raw so spikes remain visible.
- The engine now stores movement and perception tuning as per-boid properties with named defaults, so different boid variants can coexist in the same flock.
- The Copilot instructions now explicitly require heterogeneous boid support instead of assuming one global parameter set for every boid.
- Frontend Vite scripts now build the Rust/WASM package into an ignored frontend import folder before dev/build runs.
- The game loop now runs on a fixed timestep: the simulation always advances 60 logical steps per second and only rendering follows the chosen framerate, so difficulty and player speed no longer depend on the display refresh rate.
- Start-menu settings are now built from a shared option-group module, so every setting renders and behaves identically instead of repeating the markup and selection logic per option.
- The player dash now carries about a third further. Only the decay of the raised speed limit changed (3000 to 2300 pixels per second squared), so the dash still starts with exactly the same kick and simply holds its extra speed a little longer — roughly a third of a second instead of a quarter. The dash cooldown is unchanged, which makes the ability noticeably stronger rather than merely different.
- Boids now lunge in groups rather than strictly one at a time. When the boid picked for a dash has neighbours of the same difficulty tier flying close beside it, up to four of them charge and launch together as one coordinated push; a boid flying alone still dashes by itself, so the group is an upgrade of the existing behaviour rather than a replacement.
- Boid dashes happen noticeably more often: a dash is offered every 24 simulation steps instead of every 40, and the flock may hold eight boids charging or dashing at once instead of three, with a further slot per 40 boids instead of per 60. The previous tuning made the ability so rare that most rounds barely showed it.
- The player dash now carries a further 50 % (decay 2300 to 1533 pixels per second squared), which keeps the dash a reliable answer to a group lunge rather than only to a single one. The kick at the start and the cooldown are unchanged.
- Hitting an obstacle now knocks the player back instead of pressing them against it. The engine places them a short distance clear of the obstacle on the side they came from, and a third of the speed they ran in with comes back the other way, so the collision reads as a bounce while the movement along the surface still survives and lets them slide past.
- Obstacles are now denser and stay longer: forty seconds instead of thirty, four in the world at once in the first wave instead of two, and up to twelve instead of eight. The corridor every obstacle keeps clear narrowed from 96 to 80 pixels, which is still well above the player's diameter and therefore keeps the no-dead-end guarantee intact.
- An obstacle flashes red for about a third of a second when the player runs into it, so a hit is visibly attributed to the thing that caused it rather than only showing up as a lost life. The flash travels in the obstacle buffer as one number per obstacle, the same way the fade already does.
- A swarm now drifts behind the start menu, with the grid and two obstacles, dimmed towards the text side so the menu stays readable and opening up towards the right. It is presentation only — no simulation, no engine, no WASM needed to draw it — and it runs only while the menu is open, so it never competes with a round for frames.
- The game now remembers your best run and your last one, in this browser and nowhere else. The start menu opens with a "Personal Best" panel showing the record score, the wave, time and swarm size it was set with, and the result of the most recent attempt; before the first run it says so instead of showing zeros. A tie does not count as a new record.
- Game over is a card over the arena instead of a full-screen overlay, and the arena behind it is the moment you died — the swarm and the obstacles that got you stay on screen, dimmed, rather than being replaced by an empty grid. The card shows the final score against the record next to it, the wave, time and boid count of the run, and two actions: restart, which the space bar triggers straight away, or back to the main menu.
- The start menu is now a full-screen "Command Deck" instead of a centred panel: a three-line title with the game's name, a one-line pitch, and a numbered menu list — `01 Play`, `02 Game Settings`, `03 Controls`, `04 Developer Settings`. The settings and the controls legend sit in a panel stack on the right; opening one of the entries moves that group into the left column and leaves the header, footer and the rest of the stack standing, so there is one screen rather than four. Adding a menu entry later is one more row.
- The menu can be operated entirely from the keyboard, the way its footer says: the arrow keys walk the list and wrap around at both ends, Space or Enter activates the focused row, and Escape leaves a submenu. The first row has the focus the moment the menu appears. The collapsed "Developer Settings" disclosure is gone — the diagnostics are the fourth menu entry now.
- Movement keys are only captured while a round is running. They used to be swallowed on the menu screen as well, which is what previously ruled out arrow-key navigation anywhere in the interface. A key still held when a round ends is dropped, so it cannot carry into the next one.
- The HUD lost its four framed panels. A value is now a small label above a large tabular number with nothing behind it, which gives four rectangles of arena back to the game: the time top centre, the wave top right, the score bottom left in cyan because it is your result, and the boid count bottom right in red because it is the threat. Under the timer sits a two-pixel rail that fills up once per wave, so how close the next wave is can be read without doing arithmetic. The dash bar moved from the canvas into the HUD, where it is a thin cyan pill that glows and reads "Dash Ready" when the ability is available — the glow is the information, so a recovering dash has none.
- Obstacles now look like hazard tape instead of plain slate capsules: a hatched body with a darkened centre, so the warning stripes read as a band along the rim and the swarm stays readable over the middle, and a sharp red danger edge. A new obstacle lands — a faint ring runs outwards as it appears — and an expiring one turns its edge amber, the same colour every other temporary state wears. Running into one still flashes it, but the flash edge is white now: the edge underneath is already red, so a red rim was invisible exactly where it mattered. All of it comes out of the lifetime value the obstacle buffer already carried; the engine is untouched.
- The arena reads deeper and has a sense of scale: the background dropped from `#111318` to `#0B0D12`, and the grid now has two levels — a fine 56 pixel lattice plus a brighter line every fifth one. The single-level grid sat between those two brightnesses and read flat. The player's invulnerability flash is now amber rather than yellow-green, the same colour an expiring obstacle wears, so a temporary state always looks the same wherever it appears. The fourth boid tier moved from amber to fuchsia for that same reason — a permanently amber boid would claim to be temporary.
- The interface now uses two typefaces with clearly separated jobs instead of the system sans-serif: Space Grotesk for titles, buttons and labels, and JetBrains Mono for every number — the HUD values, the timer, the dash label, keycaps and hints. The numbers are set with tabular figures, so the timer no longer shifts sideways once a second. Both fonts ship with the game (54 kB together) rather than being fetched from a font CDN, which keeps the game working offline and on the first start. The start countdown grew from 72 to 96 pixels, since it is the one moment the arena is empty.
- Every colour, font, radius, spacing step and duration in the interface now comes from one set of design tokens (`styles/tokens.css`) instead of being written into each rule. The palette is one step cooler and deeper than before, and each colour now has exactly one meaning: cyan is the player and their ability, red is the swarm and what it costs, amber is a temporary state change, green is life, slate is the inert world. Nothing moved yet — this is the groundwork the rest of the redesign builds on.

### Fixed

- The score and in-game timer no longer advance while the browser tab is in the background, which previously handed out score for time in which no boid moved.
- The production build now ships the locale file. `ui/i18n.js` fetches `./locales/en.json` at runtime,
  so Vite never saw it in the module graph and left it out of `dist/`; every label in a built copy of
  the game therefore rendered as its raw key (`menu.play` instead of "Play"). The locales moved to
  `frontend/public/locales/`, which Vite copies verbatim. Only the production build was affected — the
  dev server served the file either way, which is why it went unnoticed.
- The player can no longer get stuck in an obstacle. A blocked player used to be placed exactly on the
  obstacle's surface, and the next step read that distance as another collision — even for a move
  leading straight away from it, because the tested path still started on the surface. The player was
  therefore corrected back onto the obstacle every step and could only leave it by chance; dashing in,
  which ends the move deep inside, hit it almost every time. A blocked player is now placed a short
  distance clear of the obstacle, on the side they came from, so an outward move is never blocked.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- A third power-up lies around in the arena: **Mend**, the green one, which gives a life segment back. It restores exactly one, not all of them — healing to full would make everything up to that point mean nothing, whereas one segment is an extension of the run rather than a reset of it — and it hands out no invulnerability along with it, because that is Aegis's job and two power-ups with overlapping effects is one too many. Its marker is the same hexagon as the other two, with the life meter itself as the glyph: three stacked bars, the top one only hinted at, so the gap is the icon. Green is the colour the game already uses for life and is not being widened here, it is being used. Unlike the other two, Mend is an **event** rather than a state: it happens and it is over, so it gets no HUD row and no remaining-time arc — instead the segment it restored flashes white and settles, and a green arc runs once **counter-clockwise** around the player. Every other arc in the game drains clockwise; this one fills against them, which is the whole message. A heal you cannot use is never a dead find: at full lives Mend simply does not appear, and the spawn order skips over it. If your lives fill up while one is already lying there, it turns slate grey over a third of a second, stops turning and stops glowing rather than vanishing in front of you — a marker that disappears feels stolen, one that goes grey explains itself — and you walk straight through it until a life is lost, at which point it comes back the same way. Mend also sits between the other two in the spawn order, so it can never be offered twice in a row and two hits in a row can never both be free.

- The dash cooldown is now also shown directly under the player, as a thin bar right below the life segments. It carries nothing the bar at the bottom of the screen does not, and that is the point: during a fight the eyes are on the player, and a glance down at the HUD is a glance away from ninety boids. It is deliberately small — thinner than a life segment, because a spent dash comes back on its own and a lost life does not — and it uses the same two cyans as the HUD bar: dim while the cooldown recovers, the full player colour the moment the dash is available again. The labelled bar in the HUD stays where it is.

- The frametime graph has a third row, reporting what a frame costs the graphics card rather than the script: frames actually drawn per second, drawing operations per frame, and the number of pixels the canvas is made of. The first tells you whether the framerate setting is holding — a setting of 120 on a 144 Hz display does not, and now says so. The second is the number that falls when drawing is batched. The third is the one that grows with the square of your display's pixel density and usually explains why a simple-looking picture keeps a graphics card busy. None of the three is a measurement of graphics-card time, and the setting's description says so plainly; they explain the cost, the browser's own profiler measures it.

### Changed

- A power-up lying in the arena now says how much longer it will be there: a thin ring around the marker drains clockwise from twelve o'clock and blinks in its last two seconds. Markers have always been taken back after twelve seconds, but that deadline was invisible — the marker was there in one frame and gone in the next, which reads as a bug rather than as a rule, and it made the choice between running for a marker and running from the swarm one you could not actually make. It is deliberately the **same** ring that counts a collected power-up down around the player, in the same width, from the same starting point, in the same direction, with the same blink: one countdown motif in the game rather than two that look alike by accident. It carries the marker's colour, so a Mend marker nobody can currently use greys its ring out along with the rest of itself, and it sits closer in than the distance a marker is actually collected from — a ring that promised the pickup range would be promising something it cannot deliver.

- Power-up markers are half again as large — 27 pixels instead of 18 — and the distance they are collected from grew with them, from 26 to 39. A pickup that is fiddly to hit is a pickup that gets ignored, and at the old size a marker was smaller than the player and had to be run over almost exactly. The two numbers moved by the same factor on purpose: the collect distance stays a share more than the marker is drawn rather than a fixed margin around it, so a bigger hexagon is exactly as forgiving as the small one was and not more. Markers keep a little further clear of obstacles now as well, since the clearance has to hold the whole glyph plus the player's body outside the hazard.

- A new wave is now announced at the edge of the arena two seconds before it arrives, and it arrives from there. Three red glows appear on the border, each with a ring that closes in on the exact spot a boid will enter and a bright dot marking that spot; when the ring lands, the boids are there and fly inwards. Nothing is in the world while the warning runs — the boid count in the HUD deliberately still shows the old number, because that is how many boids are actually in the arena. Before this, a wave simply materialised anywhere far enough from where the player happened to be standing at that instant, which is no help to a player already moving towards that spot: boids could appear in front of them or effectively on top of them, with no way to see it coming. A gate keeps its distance from the player as well, and slides along the border if the player is pressed into the corner it would have opened in. The three gates sit a third of the border apart, so no corner of the arena is a safe place to sit out a wave. **The graphic is a placeholder** — a plain red glow, not yet a design-system component; the mechanic and its timing are final, the artwork is not.

- An obstacle no longer becomes solid the moment it appears. For the first one and a half seconds it is only drawn — the halo closes in, the body fades up — and during that window the player and the swarm pass straight through it. That animation was always meant to be the warning, but the obstacle was already there behind it, so one appearing in front of a player who was mid-flight could take a life away for a move that could no longer be changed. It can now be seen and steered around before it counts. The obstacle still holds its place while it appears, so nothing else is placed on top of it, and the window is short against the forty seconds it then stands: enough to react to, not enough to use as a shortcut.

- The game draws the arena far more cheaply, without looking any different. The floor, both grid lattices and the world edge never change while the window keeps its size, but they were being rebuilt from scratch on every frame — two full-screen fills and sixty-six grid lines — so they are now painted once and copied in. The canvas is also opaque rather than transparent, which spares the browser blending the whole picture against the page sixty times a second; the menu's swarm backdrop still shows through, because the game canvas steps out of the way there instead of being wiped. On a laptop with an integrated graphics chip and a high-density screen this is the difference between rewriting fourteen million pixels three times per frame and copying them once.
- A paused round and the game-over screen no longer redraw a picture that cannot change. The arena behind both cards is painted once when the card comes up and then left alone until something actually changes — resuming, restarting, or resizing the window. Before, a pause left running while you did something else kept the graphics chip fully occupied drawing the same still image, and the card's frosted-glass effect re-blurred it every time.
- The frametime graph's panel no longer blurs the game behind it. The blur was the only graphical effect running during a round, it sat over the one surface that is redrawn every single frame, and it therefore cost graphics-card time on every one of them — inside the very overlay whose job is to report what a frame costs. A plainer panel that does not disturb its own measurement is the better trade.

- A running round can be paused with Escape. The world stops where it stands — the swarm, the obstacles and the markers hold their positions, the clock, the score and every cooldown stop with them — and a card comes up over the frozen arena: the score, the wave, time and boid count of the run so far, and three actions, resume (which the space bar triggers straight away), restart, or back to the main menu. Escape resumes as well, so the key that holds the round is also the key that lets it go. The card is the game-over card in amber rather than red, and it dims the arena behind it less, because a pause is something you end yourself. Leaving to the main menu from here stores nothing: a run you walked away from is not a run you finished, and the personal best keeps whatever it held. Pausing during the opening countdown keeps the time it had left rather than swallowing it. The controls legend now lists the key alongside movement and the dash.
- The game also pauses itself when the window loses focus. This closes a real gap rather than adding a convenience: a round left running in a background tab used to hand the loop the entire absence as simulation debt on the first frame back, which was then spent as a burst of catch-up steps — moving the flock towards a player who was not there to react to it. Focus coming back does not resume; the swarm stands still until you say so.

- Two power-ups now lie around in the arena and are picked up by running over them. **Aegis**, the amber one, wraps a hexagonal shell around the player and eats the next hit outright — the shield shatters into six shards and the life stays. It is a single charge, not a second grace period: the hit right after it costs a life as usual, and if nothing ever touches you the shield simply runs out. **Overdrive**, the cyan one, raises the top speed for a few seconds; it leaves the dash alone and shows itself by keeping the Ion Streak trail running during ordinary movement instead of only during a lunge. Both are hexagons, the fourth and last shape in the game, and both count their remaining time down on a thin arc around the player that blinks in the final second — Aegis on the inner ring, Overdrive on the outer, so the two can run at once without touching. A marker turns slowly, which is what makes it findable among ninety boids without being brighter than them, and it keeps clear of the player, of the other marker and of any obstacle when it appears, so nothing ever spawns inside a hazard. One appears every nine seconds, at most two lie around at a time, and an untouched one is taken back after twelve. The HUD carries both as a draining bar above the dash bar, and a new round starts with nothing left over from the last.

- Dashes now leave a trail — the "Ion Streak" of the design system. A tapered ribbon in the owner's colour, widest at the object and running to a point behind it, with a short white core right behind the front and an expanding ring at the point the dash was launched from. The player's is cyan, a dashing boid's is its tier colour, so up to four lunges in one push stay tellable apart. The ribbon lies over the obstacles but under the boids and the player, since it is exhaust rather than something in the arena, and it ends by itself when the impulse has bled off instead of on a timer. A boid that wraps around the world edge mid-dash tears its trail there rather than drawing a line across the arena, and a new round starts with none.

- The edge of the world is now visible: the area outside it is drawn a shade darker than the arena floor, the grid stops at the boundary, and a hairline marks it. Boids wrap around that edge and always have, but it used to coincide with the screen edge and was therefore impossible to see.
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

- Escape means one more thing than it did: in a submenu it still goes back, and during a round it now holds the round. The two never overlap, because it only pauses while a round is actually running and only resumes while one is actually paused.
- Going back to the main menu now takes the in-game overlays with it. The HUD and the frametime graph used to be cleared by the end of a round, which was the only way back to the start screen; leaving a paused round would otherwise have dropped the score, the dash bar and the graph on top of the menu.

- The swarm is now a dense cloud rather than a spread-out field. Boids are drawn about a third smaller, the distance the engine holds between two of them is down from 20 to 12 world units, and separation only starts pushing back at a good third of a boid's perception radius instead of half of it, so neighbours at rest almost touch. Because the game is also a load test for the Rust simulation, the flock size grew with the density it now allows: a round opens with 24 boids instead of 12 and each wave adds 12 instead of 6, so the fifth wave holds 72 boids where it used to hold 36. Dash groups scale with it — up to 6 boids lunge together instead of 4, and up to 12 may be charging or dashing at once instead of 8. Density on its own is not what costs simulation time, though: the flock is O(n²) in the boid count, and the honest load lever is the larger flock. What the tighter packing adds is more neighbours inside each boid's perception radius and far more real overlaps for the relaxation passes to undo.
- A boid now has to come visibly closer before it counts as a hit: the catch distance was tied to the player's obstacle collision radius and stayed at 28 world units regardless of how large a boid was drawn. It is its own value now, 21 units — the player's drawn radius plus half a boid — and the obstacle radius keeps the 14 that the no-dead-end guarantee rests on.
- The target framerate is now offered only in "Game Settings", not a second time in the panel stack of the start screen. It is the same setting either way, and one home for it is enough.
- The framerate options are now measured against the display instead of being the same three everywhere: the game watches a dozen animation frames while it starts up and offers only rates that monitor can actually show, so a 60 Hz screen no longer advertises 120 FPS. The fastest offered rate is preselected, and the hint below the group names the detected refresh rate, so a missing option is explained rather than mysterious. When the rate cannot be established — a tab that starts in the background, for instance — all three options stay available.

- The game world is now a fixed 1920×1080 arena instead of being whatever the browser window happens to be. It is scaled to fit the window without distortion and centred, so the whole world stays visible on any screen and a window that is not 16:9 shows a darker margin on two sides. The consequence is the point of the change: how much arena a player gets, how far new boids spawn from them, and how dense the obstacles feel no longer depend on the monitor, so a 4K display fits exactly as many boids side by side as a Full HD one does and two scores are finally comparable. Resizing the window now only rescales the picture — it no longer moves boids, drops obstacles, or shoves the player.
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

- A lunging boid no longer flies straight through an obstacle. Obstacles were a wall for the player
  and a suggestion for the swarm: a boid steers around them while it flocks normally, but a dash
  freezes its line at launch and switches that steering off, so a dashing boid passed clean through
  a solid bar and came out the other side — the one moment the arena's cover was worth anything was
  the one moment it did nothing. A boid now hits an obstacle exactly the way the player does, is
  stopped on the side it came from and bounces off it with the same fraction of its speed. The dash
  is repelled rather than cancelled, so the boid spends what is left of it rebounding, and a lunge
  that only grazes a bar slides along it instead of sticking. Cover in the arena is now cover
  against the whole swarm, dashes included.

- A round no longer dies with a bare `RuntimeError` out of the engine somewhere in the middle of
  play. Starting a round waits for the WebAssembly module, and until that wait is over the card that
  started it is still on screen with its button still focused — so a second Enter, a held space bar
  repeating, or an impatient second click started a whole second round on top of the first. On the
  very first start that also asked for the engine module a second time, and the generated loader only
  guards against a load that has already _finished_: the second request therefore built a second
  WebAssembly instance with its own memory. From then on the two were mixed — addresses made against
  one instance used with the other, and the clean-up of the discarded instance freeing those
  addresses inside the surviving one. The game carried on for a while and then died at an unrelated
  moment, which is why the crash never pointed anywhere near the start button. Starting is now
  ignored while a start is already running, and the module load is shared by every caller instead of
  being restarted.
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

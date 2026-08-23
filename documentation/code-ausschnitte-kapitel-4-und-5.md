# Code-Ausschnitte für Kapitel 4 & 5

> **Hinweis für die Übernahme in die .docx**
>
> Dieses Dokument besteht aus zwei Teilen. **Teil A** listet die Sätze, die im laufenden
> Text der Kapitel 4 und 5 um einen Querverweis ergänzt werden — jeweils mit dem
> Ankersatz, wie er heute in der .docx steht, und der fertigen Einfügung. **Teil B**
> enthält die Ausschnitte selbst; sie gehören in den Anhang unter **11.2 Quellcode**, in
> der hier vorgegebenen Reihenfolge und mit den hier vorgegebenen Beschriftungen.
>
> Drei Punkte zur Nummerierung:
>
> 1. Unter 11.2 steht derzeit ein „Code-Ausschnitt 1: DOM der Reporting-Kachel"; im
>    selben Anhang liegen außerdem „Abbildung 4: Beispiel eines Fiori-Launchpads" und
>    eine Literaturzeile zu SAP-Regressionstests. Diese drei Inhalte gehören inhaltlich
>    nicht zu diesem Projekt und sehen nach Resten einer anderen Arbeit aus. **Die
>    Nummerierung unten geht davon aus, dass sie entfernt werden**, unsere Ausschnitte
>    also bei 1 beginnen. Bleibt der Fiori-Ausschnitt stehen, verschieben sich alle
>    Nummern unten um eins (aus 1 wird 2 usw.) — dann auch in den Querverweisen aus
>    Teil A.
> 2. Ein Abbildungs- oder Tabellenverzeichnis ist nicht betroffen; für Code-Ausschnitte
>    führt der Bericht kein eigenes Verzeichnis. Falls doch eines angelegt wird, ist die
>    Reihenfolge unten die Reihenfolge des Verzeichnisses.
> 3. Die Zeilenumbrüche in den Ausschnitten sind so gesetzt, dass sie in einer
>    Festbreitenschrift bei normalem Satzspiegel ohne Umbruch passen. Bitte nicht
>    neu umbrechen; sonst zerfällt die Einrückung.
>
> Alle Ausschnitte sind gekürzt: Wo Code oder Kommentar weggelassen wurde, steht eine
> Zeile `// ...`. Nichts ist umformuliert — der Wortlaut ist der des Repositorys zum
> Stand vom 23.08.2026.

---

## Teil A — Querverweise im Text

Die Spalte _Priorität_ ist als Kürzungshilfe gedacht, falls der Anhang zu lang wird:
**A** belegt eine Aussage, die im Text ohne Beleg nur behauptet ist; **B** illustriert
eine Aussage, die auch ohne Ausschnitt verständlich bleibt.

| Nr. | Kapitel | Ankersatz im bestehenden Text (Ende des Satzes)                                                                      | Einfügung                                                                                               | Prio |
| --- | ------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---- |
| 1   | 4.1     | „... liefert dash_steering nur die Separation."                                                                      | „(siehe Code-Ausschnitt 1: Gewichtung der Steuerungsregeln)"                                            | A    |
| 2   | 4.1.1   | „... kann aber über eine Dauer nicht erneut ausgewählt werden."                                                      | „(siehe Code-Ausschnitt 2: Die vier Dash-Phasen als Countdown)"                                         | A    |
| 3   | 4.1.1   | „... wie eine Auswahl getroffen wird, die für den Spieler zufällig wirken soll, ohne tatsächlich zufällig zu sein."  | „(siehe Code-Ausschnitt 3: Auswahl ohne Zufallszahlengenerator)"                                        | A    |
| 4   | 4.1.1   | Tabellenzeile `properties.rs`: „... die drei Dauern und den Geschwindigkeitsfaktor"                                  | „(siehe Code-Ausschnitt 4: Dash-Kennwerte je Schwierigkeitsstufe)"                                      | B    |
| 5   | 4.1.2   | „... Danach gibt der Tick fällige Wellen-Spawns frei und lässt die Hindernisse altern."                              | „Die vollständige Reihenfolge zeigt Code-Ausschnitt 5: Reihenfolge eines Engine-Ticks."                 | A    |
| 6   | 4.2     | „... jede andere Sichtbarkeit endet an der Crate-Grenze."                                                            | „(siehe Code-Ausschnitt 6: Kapselung an der Crate-Grenze)"                                              | A    |
| 7   | 4.2     | „... in welcher Reihenfolge die Liste durchlaufen wird."                                                             | „(siehe Code-Ausschnitt 7: Kopierbarer Boid und der Snapshot)"                                          | A    |
| 8   | 4.2     | „Die Schwierigkeit pro Welle steigt kontinuierlich und legt fest, wie stark ein Boid in welcher Welle ist."          | „(siehe Code-Ausschnitt 8: Schwierigkeitsstufe je Welle)"                                               | B    |
| 9   | 4.3     | „Der Vektor eines Boids oder Spielers hat dreizehn Operationen."                                                     | „(siehe Code-Ausschnitt 9: Die Operationen des Vektortyps)"                                             | B    |
| 10  | 4.3.1   | „... da die Geschwindigkeit im Absprungschritt einmal gesetzt und danach über den Dash hinweg nicht verändert wird." | „(siehe Code-Ausschnitt 10: Reichweite und Ziel eines Dashes)"                                          | A    |
| 11  | 5       | „... negativ der verbleibende Dash-Anteil."                                                                          | „(siehe Code-Ausschnitt 11: Der Puffer-Vertrag der Frame-Antwort)"                                      | A    |
| 12  | 5.1     | „... um unnötigen Speicher- und Kopieraufwand für inaktive Entitäten zu vermeiden."                                  | „(siehe Code-Ausschnitt 12: Packen der sieben Puffer)"                                                  | A    |
| 13  | 5.2     | „... in standardkonforme camelCase-Strukturen für das Frontend übersetzt."                                           | „(siehe Code-Ausschnitt 13: Die einzige Namenskonvertierung)"                                           | A    |
| 14  | 5.2     | „... rendert die Szene jedoch höchstens einmal."                                                                     | „(siehe Code-Ausschnitt 14: Schrittzahl und Renderdrosselung)"                                          | A    |
| 15  | 5.3     | „Einmalige Tastendrücke (wie der Spieler-Dash) werden gelatcht und exakt einmal verbraucht."                         | „(siehe Code-Ausschnitt 15: Ein Simulationsschritt im Frontend und Code-Ausschnitt 16: Der Dash-Latch)" | A    |

Zwei Verweise ohne eigenen Ausschnitt, die sich aus vorhandenen ergeben und den Anhang
nicht verlängern:

- **5.3**, nach „... nicht durch abweichende Frontend-Logik verfälscht werden darf.":
  „(siehe Code-Ausschnitt 10: Reichweite und Ziel eines Dashes)" — dieselbe Funktion,
  aus der die Vorwarnlinie gemessen wird.
- **5.3**, nach „Kollisionen und Treffer müssen für jeden Einzelschritt eines
  Mehrschritt-Frames verbucht werden.": „(siehe Code-Ausschnitt 15)".

---

## Teil B — Die Ausschnitte für Anhang 11.2

### Code-Ausschnitt 1: Gewichtung der Steuerungsregeln

_Datei: `engine/src/simulation/steering/weights.rs`_

```rust
/// The normal steering, used whenever a boid is not dashing.
pub fn flocking_steering(
    boid: &Boid,
    snapshot: &[Boid],
    player_position: Vec2,
    obstacles: &[Obstacle],
) -> Vec2 {
    let separation_force = separation(boid, snapshot).scale(boid.properties.separation_weight);
    let alignment_force = alignment(boid, snapshot).scale(boid.properties.alignment_weight);
    let cohesion_force = cohesion(boid, snapshot).scale(boid.properties.cohesion_weight);
    let target_force = seek_target(boid, player_position).scale(boid.properties.target_seek_weight);
    // Weighted well above the pull towards the player, or a boid would press into an
    // obstacle rather than going round it: the chase would simply win the tug of war.
    let obstacle_force =
        avoid_obstacles(boid, obstacles).scale(boid.properties.obstacle_avoid_weight);

    separation_force
        .add(alignment_force)
        .add(cohesion_force)
        .add(target_force)
        .add(obstacle_force)
}

/// Steering for a dashing boid: cohesion, alignment and seeking the player are all
/// switched off, leaving only separation.
pub fn dash_steering(boid: &Boid, snapshot: &[Boid]) -> Vec2 {
    separation(boid, snapshot).scale(boid.properties.separation_weight)
}
```

### Code-Ausschnitt 2: Die vier Dash-Phasen als Countdown

_Datei: `engine/src/simulation/dash/state.rs`_

```rust
/// The four values always follow each other in the same order:
/// `Idle` -> `Charging` -> `Dashing` -> `Cooling` -> `Idle`.
pub enum DashState {
    Idle,
    Charging,
    Dashing,
    Cooling,
}

/// Advances the dash cycle by exactly one simulation step.
pub fn advance_dash_state(boid: &mut Boid, player_position: Vec2) {
    if boid.dash_state == DashState::Idle {
        return;
    }

    // Every non-idle state is just a countdown. Counting down first and then
    // looking at the result keeps all three transitions in one place.
    boid.dash_state_steps_remaining = boid.dash_state_steps_remaining.saturating_sub(1);

    if boid.dash_state_steps_remaining > 0 {
        return;
    }

    match boid.dash_state {
        DashState::Charging => launch_dash(boid, player_position),
        DashState::Dashing => {
            boid.dash_state = DashState::Cooling;
            boid.dash_state_steps_remaining = boid.properties.dash.cooldown_steps;
        }
        DashState::Cooling => boid.dash_state = DashState::Idle,
        DashState::Idle => {}
    }
}
```

### Code-Ausschnitt 3: Auswahl ohne Zufallszahlengenerator

_Datei: `engine/src/simulation/dash/selection.rs`_

```rust
// Multipliers that turn the selection round into a spread-out boid index. This is
// the same integer-hash trick (and the same numbers) as `find_spawn_position`,
// which fakes randomness deterministically so the whole simulation stays
// reproducible and the engine needs no random number generator.
const SELECTION_ROUND_MULTIPLIER: u64 = 37;
const SELECTION_ATTEMPT_MULTIPLIER: u64 = 17;
const SELECTION_SPREAD_MULTIPLIER: u64 = 97;
const SELECTION_OFFSET: u64 = 31;

fn select_group_leader(boids: &[Boid], step_counter: u32, player_position: Vec2) -> Option<usize> {
    let selection_round = (step_counter / DASH_SELECTION_INTERVAL_STEPS) as u64;

    // The first guess is often a boid that is still on cooldown or badly placed,
    // so try a handful of different candidates before giving this round up.
    for attempt in 0..SELECTION_ATTEMPTS {
        let seed =
            selection_round * SELECTION_ROUND_MULTIPLIER + attempt * SELECTION_ATTEMPT_MULTIPLIER;
        let candidate_index =
            ((seed * SELECTION_SPREAD_MULTIPLIER + SELECTION_OFFSET) % boids.len() as u64) as usize;

        if is_eligible_to_dash(&boids[candidate_index], player_position) {
            return Some(candidate_index);
        }
    }

    None
}
```

### Code-Ausschnitt 4: Dash-Kennwerte je Schwierigkeitsstufe

_Datei: `engine/src/simulation/dash/properties.rs`_

```rust
pub fn dash_properties_for_difficulty_tier(difficulty_tier: u32) -> DashProperties {
    if difficulty_tier < DASH_UNLOCK_DIFFICULTY_TIER {
        return DashProperties::default();
    }

    let tier = difficulty_tier as f32;

    DashProperties {
        can_dash: true,
        // Higher tiers give a shorter warning, but never so short that the player
        // has no chance to read the pulse and step aside.
        charge_steps: DEFAULT_DASH_CHARGE_STEPS
            .saturating_sub(difficulty_tier * DASH_CHARGE_STEPS_PER_TIER_REDUCTION)
            .max(MINIMUM_DASH_CHARGE_STEPS),
        dash_steps: DEFAULT_DASH_STEPS + difficulty_tier * DASH_STEPS_PER_TIER_BONUS,
        cooldown_steps: DEFAULT_DASH_COOLDOWN_STEPS
            .saturating_sub(difficulty_tier * DASH_COOLDOWN_STEPS_PER_TIER_REDUCTION),
        speed_multiplier: DEFAULT_DASH_SPEED_MULTIPLIER
            + tier * DASH_SPEED_MULTIPLIER_PER_TIER_BONUS,
    }
}
```

### Code-Ausschnitt 5: Reihenfolge eines Engine-Ticks

_Datei: `engine/src/wasm_bridge/mod.rs`_

```rust
pub fn tick(
    &mut self,
    previous_x: f32,
    previous_y: f32,
    attempted_x: f32,
    attempted_y: f32,
) -> FrameResponse {
    let previous = Vec2::new(previous_x, previous_y);
    let attempted = Vec2::new(attempted_x, attempted_y);

    // Resolved before anything else moves, so the flock steers against and is
    // tested against the position the player really ends up in.
    let resolution = resolve_movement_against_obstacles(
        &self.obstacle_field.obstacles,
        previous,
        attempted,
        PLAYER_COLLISION_RADIUS,
    );
    let player_position = resolution.position;
    self.last_player_position = player_position;

    if let Some(index) = resolution.hit_obstacle {
        self.obstacle_field.obstacles[index].mark_player_hit();
    }

    // Before the flock steps, so a boid that arrives this step is part of the swarm
    // its neighbours steer against straight away rather than a step later.
    self.release_due_wave_spawns();

    // Obstacles age and spawn before the flock steps, so a boid never steers
    // against an obstacle that has already gone.
    self.obstacle_field.update(/* ... */);

    let hit_count = self.flock.update(
        player_position,
        &self.obstacle_field.obstacles,
        self.world_width,
        self.world_height,
    );

    let mut response = self.build_frame_response(hit_count);
    // ... the four values only a move can produce are patched on here
    response
}
```

### Code-Ausschnitt 6: Kapselung an der Crate-Grenze

_Datei: `engine/src/lib.rs` (vollständig)_

```rust
mod constants;
mod math;
mod simulation;
mod wasm_bridge;

pub use wasm_bridge::GameEngine;
```

### Code-Ausschnitt 7: Kopierbarer Boid und der Snapshot

_Dateien: `engine/src/simulation/boid.rs` und `engine/src/simulation/flock.rs`_

```rust
/// A single simulated entity in the swarm.
#[derive(Debug, Clone, Copy)]
pub struct Boid {
    pub position: Vec2,
    pub velocity: Vec2,
    pub acceleration: Vec2,
    pub properties: BoidProperties,
    pub difficulty_tier: u32,
    pub dash_state: DashState,
    pub dash_state_steps_remaining: u32,
}

// ... in Flock::update:
let snapshot = self.boids.clone();

for boid in &mut self.boids {
    advance_dash_state(boid, player_position);

    let steering = if is_dashing(boid) {
        dash_steering(boid, &snapshot)
    } else {
        flocking_steering(boid, &snapshot, player_position, obstacles)
    };
    // ...
}
```

### Code-Ausschnitt 8: Schwierigkeitsstufe je Welle

_Datei: `engine/src/wasm_bridge/boid_factory.rs`_

```rust
/// The tier a wave's boids are built at. Tier is one below the wave number, so wave 1 is the
/// baseline, and it stops climbing at `MAX_BOID_DIFFICULTY_TIER`.
pub fn difficulty_tier_for_wave(wave: u32) -> u32 {
    wave.saturating_sub(1).min(MAX_BOID_DIFFICULTY_TIER)
}

fn properties_for_difficulty_tier(difficulty_tier: u32) -> BoidProperties {
    let tier = difficulty_tier as f32;

    BoidProperties {
        max_speed: DEFAULT_MAX_SPEED + tier * 0.45,
        max_acceleration: DEFAULT_MAX_ACCELERATION + tier * 0.02,
        perception_radius: DEFAULT_PERCEPTION_RADIUS + tier * 8.0,
        separation_weight: DEFAULT_SEPARATION_WEIGHT + tier * 0.2,
        alignment_weight: DEFAULT_ALIGNMENT_WEIGHT,
        cohesion_weight: DEFAULT_COHESION_WEIGHT,
        target_seek_weight: DEFAULT_TARGET_SEEK_WEIGHT + tier * 0.045,
        // Flat across all tiers on purpose. Avoiding an obstacle is competence, not
        // difficulty. The difficulty ramp for obstacles sits in their density.
        obstacle_avoid_weight: DEFAULT_OBSTACLE_AVOID_WEIGHT,
        dash: dash_properties_for_difficulty_tier(difficulty_tier),
    }
}
```

### Code-Ausschnitt 9: Die Operationen des Vektortyps

_Datei: `engine/src/math/vector.rs` (nur die Signaturen)_

```rust
impl Vec2 {
    pub fn new(x: f32, y: f32) -> Self
    pub fn zero() -> Self
    pub fn length(self) -> f32
    pub fn length_squared(self) -> f32
    pub fn normalize(self) -> Self
    pub fn dot(self, other: Self) -> f32
    pub fn cross(self, other: Self) -> f32
    pub fn perp(self) -> Self
    pub fn scale(self, factor: f32) -> Self
    pub fn add(self, other: Self) -> Self
    pub fn sub(self, other: Self) -> Self
    pub fn limit(self, max: f32) -> Self
    pub fn distance_to(self, other: Self) -> f32
}
```

### Code-Ausschnitt 10: Reichweite und Ziel eines Dashes

_Datei: `engine/src/simulation/dash/aim.rs`_

```rust
/// Speed this boid travels at while dashing.
pub(crate) fn dash_speed(boid: &Boid) -> f32 {
    boid.properties.max_speed * boid.properties.dash.speed_multiplier
}

/// How far a dash carries this boid.
///
/// Every step of a dash runs at the raised speed cap and the velocity is written exactly
/// once, so the distance is a plain product rather than an integral: `dash_steps` steps at
/// `dash_speed` each.
pub fn dash_distance(boid: &Boid) -> f32 {
    dash_speed(boid) * boid.properties.dash.dash_steps as f32
}

/// Where this boid's dash would end if it launched in this very step.
///
/// The frontend draws its warning line from `boid.position` to exactly this point, so the
/// line is as long as the dash carries and points where the dash would go.
pub fn dash_aim_end(boid: &Boid, player_position: Vec2) -> Vec2 {
    let direction = launch_direction(boid, player_position);

    boid.position.add(direction.scale(dash_distance(boid)))
}
```

### Code-Ausschnitt 11: Der Puffer-Vertrag der Frame-Antwort

_Datei: `engine/src/wasm_bridge/response.rs`_

```rust
#[wasm_bindgen]
pub struct FrameResponse {
    pub(crate) entity_count: u32,
    pub(crate) hit_count: u32,
    pub(crate) positions: Vec<f32>,
    pub(crate) velocities: Vec<f32>,
    pub(crate) tiers: Vec<u32>,
    pub(crate) dash_phases: Vec<f32>,
    pub(crate) obstacle_count: u32,
    pub(crate) obstacles: Vec<f32>,
    pub(crate) spawn_marker_count: u32,
    pub(crate) spawn_markers: Vec<f32>,
    pub(crate) dash_aim_count: u32,
    pub(crate) dash_aims: Vec<f32>,
    // ... the resolved player position and the block normal
}

#[wasm_bindgen]
impl FrameResponse {
    /// Returns a flat positions buffer: [x0, y0, x1, y1, ...].
    pub fn positions(&self) -> Float32Array {
        Float32Array::from(self.positions.as_slice())
    }

    /// Returns one dash phase for each boid in the positions buffer, so the
    /// renderer can warn the player about a boid that is about to lunge.
    ///
    /// `0.0` means there is nothing to draw. A value between `0` and `1` means the
    /// boid is charging up and how far through that charge it is. A value between
    /// `-1` and `0` means the boid is dashing and how much of the dash is left.
    pub fn dash_phases(&self) -> Float32Array {
        Float32Array::from(self.dash_phases.as_slice())
    }
    // ... one getter per buffer, each documenting its own layout
}
```

### Code-Ausschnitt 12: Packen der sieben Puffer

_Datei: `engine/src/wasm_bridge/frame_buffers.rs`_

```rust
/// Values per obstacle in the obstacle buffer. Kept in step with the frontend's
/// OBSTACLE_STRIDE, and asserted on in the WASM boundary tests.
const OBSTACLE_STRIDE: usize = 7;
const SPAWN_MARKER_STRIDE: usize = 3;
const DASH_AIM_STRIDE: usize = 5;

impl GameEngine {
    pub(super) fn build_frame_response(&mut self, hit_count: u32) -> FrameResponse {
        self.positions_buffer.clear();
        // ... every buffer is cleared, which keeps its capacity, so a frame allocates nothing

        for boid in &self.flock.boids {
            self.positions_buffer.push(boid.position.x);
            self.positions_buffer.push(boid.position.y);
            self.velocities_buffer.push(boid.velocity.x);
            self.velocities_buffer.push(boid.velocity.y);
            self.tiers_buffer.push(boid.difficulty_tier);
            self.dash_phases_buffer.push(dash_render_phase(boid));
        }

        // ... obstacles and spawn markers, OBSTACLE_STRIDE and SPAWN_MARKER_STRIDE values each

        // A pass of its own rather than a branch inside the boid loop above, because this
        // buffer is deliberately *not* index-aligned with the four that loop fills: only a
        // handful of boids charge at once, so each entry carries its own position and its
        // own copy of the charge progress.
        for boid in &self.flock.boids {
            if !is_charging(boid) {
                continue;
            }

            let aim_end = dash_aim_end(boid, self.last_player_position);
            self.dash_aims_buffer.push(boid.position.x);
            self.dash_aims_buffer.push(boid.position.y);
            self.dash_aims_buffer.push(aim_end.x);
            self.dash_aims_buffer.push(aim_end.y);
            self.dash_aims_buffer.push(dash_render_phase(boid));
        }

        FrameResponse {
            entity_count: self.flock.len() as u32,
            // ...
            obstacle_count: self.obstacle_field.len() as u32,
            spawn_marker_count: self.wave_spawns.len() as u32,
            dash_aim_count: (self.dash_aims_buffer.len() / DASH_AIM_STRIDE) as u32,
            // ...
        }
    }
}
```

### Code-Ausschnitt 13: Die einzige Namenskonvertierung

_Datei: `frontend/src/engine-bridge.js`_

```javascript
function normalizeFrameResponse(response, attemptedPosition) {
  return {
    entityCount: response.entity_count,
    hitCount: response.hit_count,
    hit: response.hit,
    positions: response.positions(),
    velocities: response.velocities(),
    tiers: response.tiers(),
    dashPhases: response.dash_phases(),
    obstacleCount: response.obstacle_count,
    obstacles: response.obstacles(),
    spawnMarkerCount: response.spawn_marker_count,
    spawnMarkers: response.spawn_markers(),
    dashAimCount: response.dash_aim_count,
    dashAims: response.dash_aims(),
    obstacleHit: response.obstacle_hit,
    // Falls back to the attempted position for a snapshot, which resolves nothing, so
    // callers never have to check which kind of frame they are holding.
    playerPosition: attemptedPosition
      ? { x: response.player_x, y: response.player_y }
      : attemptedPosition,
    blockNormal: { x: response.block_normal_x, y: response.block_normal_y },
  };
}
```

### Code-Ausschnitt 14: Schrittzahl und Renderdrosselung

_Datei: `frontend/src/loop/frameScheduler.js`_

```javascript
/**
 * Accounts for the time since the previous frame and reports how many
 * simulation steps are now due.
 * @returns {number} Steps to run this frame, never above the catch-up limit.
 */
beginFrame(timestamp) {
  const elapsedMs =
    this._previousTimestamp === null ? 0 : Math.max(0, timestamp - this._previousTimestamp);
  this._previousTimestamp = timestamp;

  // Clamping the debt also bounds the loop below, so no separate counter is
  // needed. Time beyond the limit is dropped: under sustained overload the
  // world runs in slow motion instead of freezing to catch up.
  this._pendingMs = Math.min(this._pendingMs + elapsedMs, this._maxPendingMs);

  const steps = Math.floor(this._pendingMs / this._stepMs);
  this._pendingMs -= steps * this._stepMs;

  return steps;
}

shouldRenderNow(timestamp, targetFps) {
  // requestAnimationFrame is already capped by the display refresh rate, so
  // the highest option simply means "do not throttle".
  if (targetFps >= this._uncappedTargetFps) {
    return true;
  }

  const minimumIntervalMs = 1000 / targetFps - this._renderIntervalToleranceMs;

  return timestamp - this._lastRenderedAt >= minimumIntervalMs;
}
```

### Code-Ausschnitt 15: Ein Simulationsschritt im Frontend

_Datei: `frontend/src/loop/simulationStep.js`_

```javascript
export function runSimulationStep(roundData, input, player, powerups) {
  advanceClock(roundData);

  // Read once per step: the dash request is a latch, so consuming it here is what
  // keeps one key press from firing a dash in every step of a multi-step frame.
  const controls = buildControls(input);
  const dashing = controls.dashRequested && isPlayerDashReady(roundData);
  // ...

  // Captured before the player integrates: the engine tests the whole move against
  // the obstacles, not just where it ended.
  const previousPosition = player.getPosition();
  player.setSpeedMultiplier(powerups.speedMultiplier());

  // The player has to move inside the same fixed step as the flock: its
  // position is an input to tick() and to the engine's collision test, so
  // integrating it per rendered frame would desync the two.
  const attemptedPosition = player.update(
    { direction: controls.direction, dash: dashing },
    SIMULATION_STEP_SECONDS,
    WORLD_BOUNDS,
  );

  updateWaveProgression(roundData, attemptedPosition);

  const frame = tick(previousPosition, attemptedPosition);
  // ...

  // The engine may have pushed the player back out of an obstacle. Taking its answer
  // is what keeps the position the renderer draws and the one the flock steered
  // against from drifting apart over a run.
  if (frame.obstacleHit) {
    player.applyObstacleBlock(frame.playerPosition, frame.blockNormal);
  }

  // ... power-ups are collected and a heal is applied

  // Every step's hits are consumed here. Reading only the last frame of a
  // multi-step frame would silently drop a hit from an earlier step.
  if (frame.hitCount > 0 || frame.obstacleHit) {
    registerHit(roundData, () => powerups.absorbHit(roundData.simulationTimeMs));
  }
}
```

### Code-Ausschnitt 16: Der Dash-Latch

_Datei: `frontend/src/input/inputManager.js`_

```javascript
/**
 * Returns whether a dash was requested since the last call, and clears the
 * request.
 *
 * The request is latched rather than read as a held key, because a single
 * animation frame can run several simulation steps: asking "is space down"
 * once per step would trigger up to five dashes from one key press.
 * @returns {boolean} Whether a dash was requested.
 */
consumeDashRequest() {
  const requested = this._dashRequested;
  this._dashRequested = false;

  return requested;
}

_handleDashKeyDown(event) {
  if (!this._gameplayActive) return;

  // Without this the space bar would also scroll the page.
  event.preventDefault();

  // Holding the key down repeats the event; only the first press is a dash.
  if (!event.repeat) {
    this._dashRequested = true;
  }
}
```

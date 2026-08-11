# Einbau des Dash-Schweifs („Ion Streak")

Vier Stellen. Keine Engine-Änderung, keine Änderung an `playerController.js`, keine neue
WASM-Grenze. Regeln und Begründungen: `design-system.md` §10.

```
cp handoff/dashTrail.js       frontend/src/renderer/dashTrail.js
cp handoff/trailLayer.js      frontend/src/renderer/trailLayer.js
cp handoff/dashTrail.test.js  frontend/src/renderer/__tests__/dashTrail.test.js
```

---

## 1) `renderer/canvasRenderer.js` — Imports und Farbabbildung

```js
import { boidTrailStrength, dashTrails, PLAYER_TRAIL_TIER, trailStrength } from './dashTrail.js';
import { drawDashTrails } from './trailLayer.js';
import { PLAYER_DASH_SPEED, PLAYER_MAX_SPEED } from '../gameConfig.js'; // zu den bestehenden Imports
```

Die Farbzuordnung ist eine Funktion auf Modulebene, **nicht** ein pro Frame gebautes
Closure — `drawDashTrails` wird 60-mal pro Sekunde aufgerufen:

```js
/** Owner colour of a trail: the player's cyan, or the boid's tier colour. */
function trailColorForTier(tier) {
  if (tier === PLAYER_TRAIL_TIER) return PLAYER_COLOR;

  return BOID_COLORS[Math.min(tier, BOID_COLORS.length - 1)];
}
```

## 2) `renderer/canvasRenderer.js` — `drawFrame()`

Die Reihenfolge ist die Aussage: der Schweif liegt **über** den Hindernissen (er ist
Bewegung, nicht Terrain) und **unter** Boids und Spieler (er ist Auspuff, kein Objekt).

```js
  drawFrame(frame, playerPosition, renderState = {}) {
    const ctx = this._ctx;

    this._inScreenSpace((screenCtx, screenWidth, screenHeight) => {
      screenCtx.clearRect(0, 0, screenWidth, screenHeight);
      drawLetterboxMargins(screenCtx, screenWidth, screenHeight);
    });

    drawArena(ctx);
    drawWorldEdge(ctx, this._view.scale);
    drawObstacles(ctx, frame);

    // Trails first: sampling has to happen before anything is drawn, so the ribbon and the
    // object it belongs to are one frame apart nowhere.
    dashTrails.advance(renderState.deltaSeconds ?? SIMULATION_STEP_SECONDS);
    samplePlayerTrail(playerPosition, renderState.playerSpeed);
    sampleBoidTrails(frame);
    dashTrails.settle();
    drawDashTrails(ctx, dashTrails, trailColorForTier);

    drawBoids(ctx, frame);
    drawPlayer(ctx, playerPosition, renderState.playerInvulnerable === true);
    drawPlayerHealth(ctx, playerPosition, renderState);
    this._drawCountdown(renderState.countdownSeconds);
  }
```

Dazu die zwei Sampling-Helfer, neben `drawBoids`:

```js
/**
 * The player's trail. Its heading comes from the velocity direction, which is the same
 * direction the dash was launched in.
 *
 * `playerSpeed` is passed in from the loop rather than read from the controller: the renderer
 * has no business holding a reference to the simulation side, and the speed is a single
 * number the loop already has in hand.
 */
function samplePlayerTrail(playerPosition, playerSpeed) {
  if (!playerPosition || playerSpeed === undefined) return;

  const strength = trailStrength(playerSpeed, PLAYER_MAX_SPEED, PLAYER_DASH_SPEED);
  if (strength <= 0) return;

  const headingX = playerSpeed === 0 ? DEFAULT_HEADING_X : playerPosition.velocityX / playerSpeed;
  const headingY = playerSpeed === 0 ? DEFAULT_HEADING_Y : playerPosition.velocityY / playerSpeed;

  dashTrails.samplePlayer(playerPosition.x, playerPosition.y, headingX, headingY, strength);
}

/** One trail per boid the engine reports as dashing (`dashPhases[i] < 0`). */
function sampleBoidTrails(frame) {
  const positions = frame.positions;
  const dashPhases = frame.dashPhases;
  if (!positions || !dashPhases) return;

  const velocities = frame.velocities;
  const tiers = frame.tiers;

  for (let index = 0; index < positions.length; index += 2) {
    const boidIndex = index / 2;
    const strength = boidTrailStrength(dashPhases[boidIndex] ?? 0);
    if (strength <= 0) continue;

    const velocityX = velocities?.[index] ?? 0;
    const velocityY = velocities?.[index + 1] ?? 0;
    const speed = Math.hypot(velocityX, velocityY);
    const headingX = speed === 0 ? DEFAULT_HEADING_X : velocityX / speed;
    const headingY = speed === 0 ? DEFAULT_HEADING_Y : velocityY / speed;

    dashTrails.sampleBoid(
      boidIndex,
      Math.min(tiers?.[boidIndex] ?? 0, BOID_COLORS.length - 1),
      positions[index],
      positions[index + 1],
      headingX,
      headingY,
      strength,
    );
  }
}
```

`SIMULATION_STEP_SECONDS` mit zu den `gameConfig.js`-Imports nehmen — es ist der Fallback,
wenn der Loop kein Delta mitgibt.

## 3) Der Loop — zwei Zahlen mehr im `renderState`

Wo `renderer.drawFrame(...)` aufgerufen wird (`loop/`), das Objekt um zwei Felder
erweitern. Beides liegt dort schon vor:

```js
renderState.playerSpeed = Math.hypot(playerController.velocity.x, playerController.velocity.y);
renderState.deltaSeconds = frameDeltaSeconds; // Wall Time des gezeichneten Frames
```

`deltaSeconds` ist **Wall Time**, nicht Simulationszeit: der Absprung-Ring ist Präsentation
und läuft mit der Bildrate, nicht mit der Simulationsuhr. Der Schweif selbst braucht keine
Uhr — seine Form kommt allein aus der Historie.

Der Schweif braucht die Richtung: entweder `playerPosition` um `velocityX` / `velocityY`
erweitern (wie oben im Helfer gelesen), oder die zwei Werte flach in den `renderState` legen
und den Helfer entsprechend anpassen. Ersteres hält die Signatur von `drawFrame` unverändert.

## 4) Rundenstart — `dashTrails.reset()`

In `beginRound()`, direkt neben das Neuseeden von `lastDashAtSimulationMs`:

```js
dashTrails.reset();
```

Ohne das gehört die Historie der letzten Runde Boid-Indizes, die inzwischen andere Boids
sind. Die 200-px-Sprungprüfung würde das im nächsten Frame ohnehin abfangen — aber erst
**nach** einem falsch gezeichneten Frame.

---

## Manuell prüfen

- Spieler-Dash: Band in Cyan, breit am Spieler, spitz auslaufend; Absprung-Ring am
  Startpunkt. Nach ~0,5 s ist nichts mehr zu sehen, ohne Rest, der stehen bleibt.
- Dash in die Wand: der Schweif endet dort mit dem Dash und kriecht nicht weiter.
- Ab Welle 3: ein Boid-Verband stößt zu, jeder Dasher zieht ein Band in **seiner**
  Tier-Farbe. Bei bis zu 4 Dashern pro Stoß bleiben die Bänder unterscheidbar.
- Ein Boid, der während des Dashs am Weltrand wickelt, zieht **keine** Linie quer über die
  Arena — der Schweif reißt am Rand ab und beginnt auf der anderen Seite neu.
- Wellenwechsel und Neustart nach Game Over: keine Bänder, die aus dem Nichts stehen.
- Frametime-Graph in Welle 5 (8+ gleichzeitige Dasher): die Draw-Kurve steigt nicht
  auffällig.

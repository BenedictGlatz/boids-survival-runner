# Einbau der Power-ups („Aegis" und „Overdrive")

Anders als Dash-Schweif und Hazard Tape ist das **nicht** rein optisch: Spawn, Kollision und
Wirkung sind Gameplay. Optik und Konstanten: `design-system.md` §11.

```
cp handoff/powerupLayer.js   frontend/src/renderer/powerupLayer.js
cp handoff/powerups.js       frontend/src/powerups/powerups.js
cp handoff/powerups.test.js  frontend/src/powerups/powerups.test.js
```

`powerupLayer.js` zeichnet nur. `powerups.js` hält den Zustand und entscheidet nichts über
Pixel. Die Trennung ist dieselbe wie bei `dashTrail.js` / `trailLayer.js`.

---

## 1) Wo der Zustand hingehört

`PowerupField` (aus `powerups.js`) gehört neben den Rundenzustand, dort wo auch
`lastDashAtSimulationMs` lebt — es ist Rundenzustand, kein Renderer-Zustand.

```js
import { PowerupField } from '../powerups/powerups.js';

const powerups = new PowerupField();
```

In `beginRound()`, neben `dashTrails.reset()`:

```js
powerups.reset(worldWidth, worldHeight);
```

## 2) Im Simulationsschritt — nicht im Frame

Spawn und Einsammeln laufen mit der Simulationsuhr, nicht mit der Bildrate: sonst sammelt ein
Spieler mit 144 Hz anders ein als einer mit 60 Hz.

```js
// im selben Block wie der Aufruf der WASM-Simulation, pro Schritt
const collected = powerups.step(SIMULATION_STEP_SECONDS, playerPosition.x, playerPosition.y);

if (collected === 'aegis') {
  // Aegis ist derselbe Zustand wie die Unverwundbarkeit nach einem Treffer, nur früher
  // ausgelöst — nicht ein zweiter, paralleler Schutzmechanismus.
  playerInvulnerableUntilMs = simulationMs + AEGIS_DURATION_MS;
}
```

Für Overdrive genügt ein Faktor auf die Höchstgeschwindigkeit im `playerController`:

```js
const maxSpeed = PLAYER_MAX_SPEED * powerups.speedMultiplier();
```

`speedMultiplier()` gibt `1` oder `OVERDRIVE_FACTOR` (1.6). **Kein** Faktor auf
`PLAYER_DASH_SPEED` — der Dash ist mit 1100 px/s schon der schnellste Zustand im Spiel, und
ihn zusätzlich zu skalieren tunnelt durch Hindernisse.

## 3) Treffer — wer den Schild verbraucht

Dort, wo der Schaden am Spieler ausgewertet wird, **vor** dem Abzug:

```js
if (powerups.absorbHit(simulationMs)) {
  // Aegis hat den Treffer gefressen: kein Schaden, und der Schild ist verbraucht.
  return;
}
```

`absorbHit` gibt `true` genau einmal pro Aegis und beendet den Buff dabei — Restzeit und
Ladung sind derselbe Zustand, und der Treffer verbraucht beides.

## 4) Zeichnen — `renderer/canvasRenderer.js`

Reihenfolge: Marker **nach** den Hindernissen und **vor** dem Schweif (ein Marker liegt am
Boden), Schild und Ringe **nach** dem Spieler (sie liegen auf ihm).

```js
import {
  drawAegisShatter,
  drawAegisShell,
  drawCollectRing,
  drawHudBuff,
  drawOverdriveRing,
  drawPowerupMarker,
} from './powerupLayer.js';
```

```js
drawObstacles(ctx, frame);

for (const marker of renderState.powerupMarkers ?? []) {
  drawPowerupMarker(ctx, marker.kind, marker.x, marker.y, seconds, marker.spawnScale);
}
for (const pop of renderState.powerupCollects ?? []) {
  drawCollectRing(ctx, pop.x, pop.y, pop.age, pop.kind);
}

// … Schweif, Boids, Spieler wie gehabt …
drawPlayer(ctx, playerPosition, renderState.playerInvulnerable === true);

const buffs = renderState.powerupBuffs ?? {};
if (buffs.aegis !== undefined) {
  drawAegisShell(ctx, playerPosition.x, playerPosition.y, seconds, buffs.aegis);
}
if (buffs.overdrive !== undefined) {
  drawOverdriveRing(ctx, playerPosition.x, playerPosition.y, buffs.overdrive);
}
if (renderState.aegisShatterAge !== undefined) {
  drawAegisShatter(ctx, playerPosition.x, playerPosition.y, renderState.aegisShatterAge);
}
```

`seconds` ist Wall Time (`performance.now() / 1000`) — Rotation und Atmen sind Präsentation.

`renderState` bekommt die vier Felder aus `powerups.snapshot(simulationMs)`.

### Overdrive und der Schweif

Overdrive hat **keinen eigenen Effekt**. Im Schweif-Sampling die Basisgeschwindigkeit
mitskalieren, damit der Ion Streak während des Buffs durchläuft:

```js
const trailBase = PLAYER_MAX_SPEED * (buffs.overdrive !== undefined ? 0.55 : 1);
const strength = trailStrength(renderState.playerSpeed, trailBase, PLAYER_DASH_SPEED);
```

Das ist der ganze Effekt: die Schwelle sinkt, also zieht normale Bewegung plötzlich einen
Schweif. Tempo hat im Spiel schon eine Sprache — Overdrive schaltet sie nur an.

### HUD

Unter dem Zeichnen des restlichen HUD, in **Screen Space**:

```js
let row = 0;
for (const kind of ['aegis', 'overdrive']) {
  if (buffs[kind] === undefined) continue;
  drawHudBuff(screenCtx, screenWidth / 2 - 46, screenHeight - 92 - row * 18, kind, buffs[kind]);
  row += 1;
}
```

---

## Zahlen — Vorschläge, keine Designregel

In `powerups.js` oben gesammelt und einzeln überschreibbar. Die Optik hält jede Dauer aus.

| Konstante               | Wert  | Warum                                                                        |
| ----------------------- | ----- | ---------------------------------------------------------------------------- |
| `AEGIS_DURATION_MS`     | 6500  | Lang genug, um einen Verband zu überstehen, kurz genug, dass man ihn ausgibt |
| `OVERDRIVE_DURATION_MS` | 6000  | Etwa eine Arena-Durchquerung                                                 |
| `OVERDRIVE_FACTOR`      | 1.6   | Spürbar; unter der Dash-Geschwindigkeit, also kein neues Tunneling-Risiko    |
| `SPAWN_INTERVAL_MS`     | 9000  | Ein Marker etwa alle anderthalb Wellenabschnitte                             |
| `MAX_MARKERS`           | 2     | Mehr macht die Arena zum Sammelspiel                                         |
| `MARKER_LIFETIME_MS`    | 12000 | Ein Marker, der ewig liegt, ist keine Entscheidung mehr                      |

Marker spawnen mit Mindestabstand zu Hindernissen und zum Spieler (`MIN_SPAWN_DISTANCE`), sonst
sammelt man sie versehentlich ein oder gar nicht.

---

## Manuell prüfen

- Ein Marker ist in Welle 5 zwischen 90 Boids **findbar**. Wenn nicht: Rotation ist das
  Mittel, nicht Helligkeit — nicht am Glow drehen.
- Aegis aufsammeln: das Hex wandert sichtbar vom Boden auf den Spieler. Wer das nicht sieht,
  versteht den Buff nicht.
- Treffer mit Aegis: kein Schaden, weißer Blitz, Splitter. Health-Segmente bleiben stehen.
- Zweiter Treffer direkt danach: **zieht** ab. Der Schild ist einmalig.
- Aegis auslaufen lassen ohne Treffer: Bogen blinkt in der letzten Sekunde, Hex verschwindet.
- Beide Buffs gleichzeitig: zwei Bögen (36 px amber, 42 px cyan), zwei HUD-Zeilen, nichts
  überlappt.
- Overdrive: der Schweif läuft bei normaler Bewegung durch und endet mit dem Buff.
- Overdrive + Dash gleichzeitig: der Schweif wird nur dicker, es entsteht kein zweiter Effekt.
- Rundenneustart: keine Marker und keine Buffs aus der alten Runde.

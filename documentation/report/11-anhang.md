# 11 Anhang

`Seitenbudget: — | Status: Gerüst (akkretiv) | Quellen: die jeweiligen Kapitel`

Der Anhang ist die **Auffangstelle für Gekürztes**. Was beim Einhalten des
Seitenbudgets aus einem Kapitel fällt, wandert hierher statt gelöscht zu werden — der
Katalog verlangt ausdrücklich „Wesentliche Arbeitsergebnisse im Anhang".

Nummerierung und Beschriftung entstehen erst beim Word-Zusammenbau
(`Tabelle 1: …`, `Abbildung 1: …`, `Quellcode-Ausschnitt 1: …`) und werden im
Fließtext referenziert.

## 11.1 Tabellen

> TODO: Sammelstelle. Vorgesehen:
>
> - Verzeichnisstruktur und Schichtenzuordnung (Engine / Frontend / Bridge)
> - Modulübersicht Engine mit Aufgabe je Datei
> - Modulübersicht Frontend mit Aufgabe je Datei
> - Testübersicht je Verzeichnis
> - E2E-Flow-Tabelle in Langfassung, falls Kap. 8.2 gekürzt werden muss
> - Vollständige npm-Script-Tabelle, falls Kap. 7.1 gekürzt werden muss

### Dash-Tuning je Schwierigkeits-Tier

Langfassung der beiden Endpunkte aus Kapitel 4.8 Implementierung der Fachlogik. Alle Werte
sind aus `engine/src/constants.rs` und `engine/src/simulation/dash/properties.rs` abgeleitet,
nicht gemessen; Sekundenangaben gelten bei 60 Simulationsschritten je Sekunde. Die Stufen 0
und 1 (Wellen 1 und 2) fehlen, weil ihr `can_dash` fest `false` ist — die beiden ersten
Wellen bleiben ein reiner Schwarm zum Einlernen.

| Größe                             | Herleitung aus der Stufe  | Tier 2 (Welle 3) | Tier 3 (Welle 4) | Tier 4 (Welle 5+) |
| --------------------------------- | ------------------------- | ---------------: | ---------------: | ----------------: |
| Vorwarnung `charge_steps`         | `max(54 − 5 · Tier, 24)`  |    44 · (0,73 s) |    39 · (0,65 s) |     34 · (0,57 s) |
| Dash-Dauer `dash_steps`           | `18 + 1 · Tier`           |    20 · (0,33 s) |    21 · (0,35 s) |     22 · (0,37 s) |
| Cooldown `cooldown_steps`         | `300 − 30 · Tier`         |    240 · (4,0 s) |    210 · (3,5 s) |     180 · (3,0 s) |
| Höchstgeschwindigkeit `max_speed` | `3,7 + 0,45 · Tier`       |             4,60 |             5,05 |              5,50 |
| Dash-Faktor `speed_multiplier`    | `2,6 + 0,2 · Tier`        |              3,0 |              3,2 |               3,4 |
| Dash-Geschwindigkeit              | Produkt der beiden Zeilen |  13,8 px/Schritt |  16,2 px/Schritt |   18,7 px/Schritt |
| Reichweite                        | Geschwindigkeit × Dauer   |           276 px |           339 px |            411 px |

Zum Vergleich: Der Spieler bewegt sich mit 360 px/s, also 6 px/Schritt. Ein Dash ist damit
2,3- bis 3,1-mal so schnell wie der Spieler.

### Die sieben Puffer eines Frames

Langfassung des Puffer-Vertrags aus Kapitel 5.2.1 Der Puffer-Vertrag. Spalte _Anzahl_ nennt
den Zähler, aus dem die Länge des Puffers folgt; die oberen vier teilen sich einen einzigen
Zähler und sind untereinander index-aligniert, die unteren drei tragen je einen eigenen. Alle
Angaben stammen aus `engine/src/wasm_bridge/response.rs` und
`engine/src/wasm_bridge/frame_buffers.rs`.

| Puffer          | Typ            | Werte je Eintrag          | Anzahl               | Inhalt eines Eintrags                                                         |
| --------------- | -------------- | ------------------------- | -------------------- | ----------------------------------------------------------------------------- |
| `positions`     | `Float32Array` | 2                         | `entity_count`       | Position eines Boids                                                          |
| `velocities`    | `Float32Array` | 2                         | `entity_count`       | Geschwindigkeit, aus der der Renderer die Ausrichtung nimmt                   |
| `tiers`         | `Uint32Array`  | 1                         | `entity_count`       | Schwierigkeitsstufe, entscheidet über die Farbe                               |
| `dash_phases`   | `Float32Array` | 1                         | `entity_count`       | Dash-Renderzustand, vorzeichenkodiert (`0` = nichts, `+` = lädt, `−` = dasht) |
| `obstacles`     | `Float32Array` | 7 (`OBSTACLE_STRIDE`)     | `obstacle_count`     | Kapsel (2 × Spine, Radius), `render_phase` vorzeichenkodiert, `hit_flash`     |
| `spawn_markers` | `Float32Array` | 3 (`SPAWN_MARKER_STRIDE`) | `spawn_marker_count` | Eintrittspunkt eines angekündigten Boids und Fortschritt seiner Warnzeit      |
| `dash_aims`     | `Float32Array` | 5 (`DASH_AIM_STRIDE`)     | `dash_aim_count`     | Vorwarnlinie eines ladenden Boids: Start, Ende, Ladefortschritt               |

Dazu kommen fünf Skalare, die nur ein `tick()` erzeugen kann und die ein `snapshot()` auf null
lässt: `player_x` / `player_y` (die gegen die Hindernisse aufgelöste Spielerposition),
`obstacle_hit` und `block_normal_x` / `block_normal_y` (die Oberflächennormale des Kontakts).
`hit_count` und das daraus abgeleitete `hit` zählen die Boid-Treffer dieses Schritts.

### Tech Stack Canvas — Langfassung

Langfassung der Übersicht aus Kapitel 2.3 Tech Stack Canvas. Spalte _Deklariert_ ist der
in `engine/Cargo.toml` bzw. `frontend/package.json` festgeschriebene Versionsbereich,
Spalte _Aufgelöst_ die daraus gebaute Fassung aus den eingecheckten Lockfiles
(`engine/Cargo.lock`, `frontend/package-lock.json`). „—" bedeutet, dass die Position nicht
über einen Paketmanager verwaltet wird; „lokales CLI" bedeutet, dass sie auf dem
Entwicklungsrechner installiert und nirgends im Repository festgelegt ist.

| Schicht            | Position                    | Deklariert         | Aufgelöst           | Zweck                                    |
| ------------------ | --------------------------- | ------------------ | ------------------- | ---------------------------------------- |
| Simulation         | Rust                        | `edition = "2021"` | stable, lokales CLI | Sprache der Engine                       |
| Simulation         | Cargo                       | —                  | mit Rust            | Abhängigkeiten und Build der Engine      |
| Sprachgrenze       | `wasm-bindgen`              | `0.2`              | 0.2.122             | Rust-Typen als JavaScript-Gegenstück     |
| Sprachgrenze       | `js-sys`                    | `0.3`              | 0.3.99              | `Float32Array` / `Uint32Array` im Frame  |
| Sprachgrenze       | `wasm-pack`                 | —                  | lokales CLI         | Build nach `--target web`                |
| Präsentation       | JavaScript, ES-Module       | —                  | —                   | Rendering, Eingabe, Spielzustand         |
| Präsentation       | HTML5 Canvas 2D             | —                  | Browser-API         | Spielfeld, Boids, Hindernisse, Effekte   |
| Präsentation       | CSS                         | —                  | —                   | Menü, HUD, Overlays                      |
| Präsentation       | JSON                        | —                  | —                   | Sprachdateien unter `public/locales/`    |
| Build              | Vite                        | `^5.0.0`           | 5.4.21              | Dev-Server, Produktionsbündel            |
| Build              | npm                         | —                  | mit Node.js         | Paketverwaltung, Skripte                 |
| Qualitätssicherung | Vitest                      | `^4.1.10`          | 4.1.10              | Unit-Tests der Frontend-Logik            |
| Qualitätssicherung | `@vitest/coverage-v8`       | `^4.1.10`          | 4.1.10              | Coverage-Report Frontend                 |
| Qualitätssicherung | `@playwright/test`          | `^1.62.0`          | 1.62.0              | E2E-Tests gegen den Produktionsbuild     |
| Qualitätssicherung | `eslint` + `@eslint/js`     | `^9.9.0`           | 9.39.5              | Linter Frontend, Flat Config             |
| Qualitätssicherung | `eslint-plugin-jsdoc`       | `^50.2.0`          | 50.8.0              | JSDoc-Pflicht auf öffentlicher API       |
| Qualitätssicherung | `eslint-config-prettier`    | `^9.1.0`           | 9.1.2               | Trennung Formatierung / Semantik         |
| Qualitätssicherung | `globals`                   | `^15.9.0`          | 15.15.0             | Umgebungs-Globals für ESLint             |
| Qualitätssicherung | `prettier`                  | `^3.3.0`           | 3.9.6               | Formatter für JS, JSON, CSS, Markdown    |
| Qualitätssicherung | `wasm-bindgen-test`         | `0.3`              | 0.3.72              | Tests der WASM-Grenze im Browser         |
| Qualitätssicherung | `cargo test`/`clippy`/`fmt` | —                  | mit Rust            | Unit-Tests, Linter, Formatter der Engine |
| Qualitätssicherung | `cargo-llvm-cov`            | —                  | lokales CLI         | Coverage-Report Engine                   |
| _nicht vorhanden_  | TypeScript                  | —                  | —                   | offen als T-02, begründet in Kap. 7.6    |
| _nicht vorhanden_  | GitHub Actions              | —                  | —                   | offen als T-05, begründet in Kap. 8.3    |
| _nicht vorhanden_  | `vite.config.js`            | —                  | —                   | offen als T-06, begründet in Kap. 7.10   |

Die Spalte _Aufgelöst_ ist der Stand der eingecheckten Lockfiles und wird beim
Zusammenbau des Berichts noch einmal daraus erneuert, nicht aus dieser Tabelle
fortgeschrieben.

### Coverage je Modul — Engine

Langfassung zu 9.2b Coverage, erhoben mit `cargo llvm-cov --lib --summary-only`,
Stand 13.08.2026, absteigend nach _Lines_ sortiert. `constants.rs` und `lib.rs`
fehlen, weil sie keinen ausführbaren Code enthalten und der Report sie daher nicht
ausweist.

| Datei                              | Regions | Functions |   Lines |
| ---------------------------------- | ------: | --------: | ------: |
| `math/segment.rs`                  |   100 % |     100 % |   100 % |
| `math/vector.rs`                   |   100 % |     100 % |   100 % |
| `simulation/boid.rs`               |   100 % |     100 % |   100 % |
| `simulation/dash/aim.rs`           |   100 % |     100 % |   100 % |
| `simulation/dash/properties.rs`    |   100 % |     100 % |   100 % |
| `simulation/dash/selection.rs`     |   100 % |     100 % |   100 % |
| `simulation/flock.rs`              |   100 % |     100 % |   100 % |
| `simulation/obstacle/arming.rs`    |   100 % |     100 % |   100 % |
| `simulation/obstacle/collision.rs` |   100 % |     100 % |   100 % |
| `simulation/obstacle/density.rs`   |   100 % |     100 % |   100 % |
| `simulation/obstacle/pushout.rs`   |   100 % |     100 % |   100 % |
| `simulation/overlap.rs`            |   100 % |     100 % |   100 % |
| `simulation/physics.rs`            |   100 % |     100 % |   100 % |
| `simulation/steering/rules.rs`     |   100 % |     100 % |   100 % |
| `simulation/steering/weights.rs`   |   100 % |     100 % |   100 % |
| `simulation/obstacle/shape.rs`     | 99,67 % |     100 % | 99,45 % |
| `simulation/wave/queue.rs`         | 99,50 % |     100 % | 99,24 % |
| `simulation/wave/world_edge.rs`    | 99,45 % |     100 % | 99,06 % |
| `simulation/obstacle/spawn.rs`     | 99,34 % |     100 % | 98,99 % |
| `simulation/obstacle/bounce.rs`    | 98,91 % |     100 % | 98,57 % |
| `simulation/dash/state.rs`         | 98,34 % |   95,00 % | 97,44 % |
| `simulation/wave/placement.rs`     | 98,01 % |     100 % | 98,40 % |
| `simulation/obstacle/field.rs`     | 96,79 % |     100 % | 97,65 % |
| `simulation/obstacle/rules.rs`     | 90,74 % |     100 % | 92,16 % |
| `wasm_bridge/boid_factory.rs`      | 87,20 % |   92,31 % | 89,38 % |
| `wasm_bridge/frame_buffers.rs`     |  0,00 % |    0,00 % |  0,00 % |
| `wasm_bridge/mod.rs`               |  0,00 % |    0,00 % |  0,00 % |
| `wasm_bridge/response.rs`          |  0,00 % |    0,00 % |  0,00 % |
| **Gesamt**                         | 91,40 % |   92,49 % | 90,25 % |

Die drei Nullen am Ende sind ein Messartefakt und kein Testloch; die Begründung
steht in 9.2b Coverage.

### Coverage je Modul — Frontend

Langfassung zu 9.2b Coverage, erhoben mit `npm run test:coverage`
(`@vitest/coverage-v8`), Stand 13.08.2026, absteigend nach _Lines_ sortiert.
`gameConfig.js` ist per `exclude` ausgenommen — es enthält ausschließlich
Konstanten. Die Sortierung macht die zweigipfelige Verteilung sichtbar: 28 Module
bei 100 %, 23 bei 0 %, nur 9 dazwischen.

| Modul                            | Statements | Branches | Functions |   Lines |
| -------------------------------- | ---------: | -------: | --------: | ------: |
| `gameState.js`                   |      100 % |    100 % |     100 % |   100 % |
| `input/controls.js`              |      100 % |    100 % |     100 % |   100 % |
| `loop/frameMetrics.js`           |      100 % |    100 % |     100 % |   100 % |
| `loop/frameScheduler.js`         |      100 % |    100 % |     100 % |   100 % |
| `loop/renderState.js`            |      100 % |    100 % |     100 % |   100 % |
| `loop/staticFrameGate.js`        |      100 % |    100 % |     100 % |   100 % |
| `player/dashCooldown.js`         |      100 % |    100 % |     100 % |   100 % |
| `player/playerController.js`     |      100 % |    100 % |     100 % |   100 % |
| `powerups/markerClearance.js`    |      100 % |  88,88 % |     100 % |   100 % |
| `powerups/markerLifetime.js`     |      100 % |    100 % |     100 % |   100 % |
| `powerups/mend.js`               |      100 % |    100 % |     100 % |   100 % |
| `renderer/arenaLayer.js`         |      100 % |    100 % |     100 % |   100 % |
| `renderer/dashAimLayer.js`       |      100 % |    100 % |     100 % |   100 % |
| `renderer/dashPulse.js`          |      100 % |    100 % |     100 % |   100 % |
| `renderer/dashTrail.js`          |      100 % |    100 % |     100 % |   100 % |
| `renderer/dashTrailHistory.js`   |      100 % |    100 % |     100 % |   100 % |
| `renderer/drawCallCounter.js`    |      100 % |    100 % |     100 % |   100 % |
| `renderer/mendPulse.js`          |      100 % |    100 % |     100 % |   100 % |
| `renderer/obstacleFade.js`       |      100 % |    100 % |     100 % |   100 % |
| `renderer/spawnMarkerLayer.js`   |      100 % |    100 % |     100 % |   100 % |
| `renderer/spawnMarkerPulse.js`   |      100 % |    100 % |     100 % |   100 % |
| `renderer/trailSampling.js`      |      100 % |  71,05 % |     100 % |   100 % |
| `renderer/worldTransform.js`     |      100 % |    100 % |     100 % |   100 % |
| `round/roundData.js`             |      100 % |    100 % |     100 % |   100 % |
| `round/waveTier.js`              |      100 % |    100 % |     100 % |   100 % |
| `ui/drawnFrameRate.js`           |      100 % |    100 % |     100 % |   100 % |
| `ui/frameGraphScale.js`          |      100 % |    100 % |     100 % |   100 % |
| `ui/menuSettings.js`             |      100 % |    100 % |     100 % |   100 % |
| `powerups/powerups.js`           |    98,18 % |  95,65 % |     100 % | 98,96 % |
| `renderer/playerStatusBars.js`   |    90,74 % |  87,50 % |     100 % | 90,38 % |
| `round/roundRecords.js`          |    89,47 % |  89,28 % |   87,50 % | 89,47 % |
| `renderer/obstacleLayer.js`      |    85,34 % |  88,46 % |     100 % | 85,08 % |
| `renderer/entityPalette.js`      |    70,37 % |   0,00 % |   60,00 % | 72,00 % |
| `loop/refreshRate.js`            |    64,86 % |  75,00 % |   50,00 % | 63,88 % |
| `renderer/arenaBackground.js`    |    53,12 % |  47,05 % |     100 % | 53,12 % |
| `renderer/timeArc.js`            |    47,61 % |  66,66 % |   66,66 % | 50,00 % |
| `renderer/powerupMarkerLayer.js` |    21,15 % |   0,00 % |    0,00 % | 22,44 % |
| `engine-bridge.js`               |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `index.js`                       |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `input/inputManager.js`          |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `input/pauseControl.js`          |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `loop/simulationStep.js`         |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `loop/stateRenderer.js`          |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `renderer/canvasRenderer.js`     |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `renderer/powerupLayer.js`       |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `renderer/renderer.js`           |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `renderer/trailLayer.js`         |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `ui/frameGraphOverlay.js`        |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `ui/frameTimeGraph.js`           |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `ui/gameOverCard.js`             |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `ui/hud.js`                      |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `ui/i18n.js`                     |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `ui/menu.js`                     |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `ui/menuBackdrop.js`             |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `ui/menuDeck.js`                 |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `ui/menuNavigation.js`           |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `ui/menuPanels.js`               |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `ui/optionGroup.js`              |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| `ui/pauseCard.js`                |     0,00 % |    100 % |    0,00 % |  0,00 % |
| `ui/runStats.js`                 |     0,00 % |   0,00 % |    0,00 % |  0,00 % |
| **Gesamt**                       |    45,39 % |  48,13 % |   50,25 % | 45,42 % |

Jedes Modul der unteren Gruppe ist DOM- oder WASM-gebunden und damit in der
Node-Umgebung von Vitest strukturell nicht erreichbar; abgedeckt sind sie durch die
Playwright-Suite aus 8.2 E2E Tests.

### Kapazitätsplan je Maßnahme — Plan und Ist

Aufschlüsselung der Blocktabelle aus 10.1.3 Ist gegen Plan. _Plan_ stammt aus
`docs/specs-overview.md` §3, _Ist_ aus der Aufwandstabelle des Journals, aggregiert je
Maßnahmen-ID und auf halbe Stunden gerundet, Stand 20.08.2026. Die Journal-IDs `S-04b`
(Pause) und `S-05b` (Power-ups) sind in `S-04` bzw. `S-05` eingerechnet, weil die
Planung sie dort führt. Der in 10.1.2 Erfassung des Ist-Aufwands beschriebene
Dokumentationsanteil, der im Journal unter einer `S`- oder `T`-ID gebucht ist, ist
anteilig aus diesen Zeilen heraus- und in `D-01` hineingerechnet; die Zeilenwerte
liegen deshalb unter der reinen Journal-Aggregation. Die Ist-Spalte enthält nur die
dokumentierte Projektphase ab dem 29.07.2026 — die Gründe und die Folgen für die
Differenz stehen ebenfalls in 10.1.2.

| ID                     | Maßnahme                                    | Plan (h) |  Ist (h) | Stand                                     |
| ---------------------- | ------------------------------------------- | -------: | -------: | ----------------------------------------- |
| `S-01`                 | Boid-Schwarm-Simulation                     |      4,5 |      1,5 | umgesetzt, überwiegend vor dem Journal    |
| `S-02`                 | WASM-Bridge-API                             |      1,5 |      5,0 | umgesetzt                                 |
| `S-03`                 | Rendering & HUD                             |      3,0 |     11,5 | umgesetzt, Design-Handoff eingearbeitet   |
| `S-04` (inkl. `S-04b`) | Loop & Waves, Pause                         |      3,5 |      5,0 | umgesetzt, Kern vor dem Journal           |
| `S-05` (inkl. `S-05b`) | Steuerung, Dash, Power-ups                  |      5,5 |     13,0 | umgesetzt, _Slow-Time_ bewusst gestrichen |
| `S-06`                 | Querschnitt: i18n, Scoring, Build           |      3,0 |      1,5 | umgesetzt, überwiegend vor dem Journal    |
| `S-07`                 | Temporäre Hindernisse                       |      4,0 |     12,5 | umgesetzt                                 |
| —                      | Integrations- und Testzuschlag (~20 %)      |      ≈ 5 |        — | nicht separat erfasst, in den Zeilen      |
| **Summe Specs**        |                                             | **≈ 30** | **50,0** |                                           |
| `T-01`                 | ESLint, Prettier, JSDoc-Enforcement         |      2,5 |      3,0 | umgesetzt                                 |
| `T-02`                 | TypeScript-Prüfung über `allowJs`/`checkJs` |      1,5 |      0,0 | offen, begründet in 7.6 TypeScript        |
| `T-03`                 | Coverage beide Sprachen                     |      1,5 |      1,0 | umgesetzt                                 |
| `T-04`                 | E2E-Tests inkl. Report                      |      3,0 |      4,0 | umgesetzt                                 |
| `T-05`                 | CI/CD: GitHub-Actions-Pipeline              |      2,5 |      0,0 | offen, begründet in 8.3 CI/CD             |
| `T-06`                 | Deployment auf GitHub Pages                 |      1,5 |      0,0 | offen, begründet in 7.10 Deployment       |
| `T-07`                 | Unit-Test-Lücken schließen                  |      3,0 |      2,5 | teilweise umgesetzt                       |
| `T-08`                 | GPU-Last messen, dann senken                |      4,5 |      4,5 | Stufe 1 umgesetzt, Stufe 2 offen          |
| **Summe Tooling**      |                                             | **20,0** | **15,0** |                                           |
| `D-01`                 | Dokumentation, Diagramme, Layout            |     20,0 |     35,0 | Kapitel 01–10 im Entwurf, Anhang offen    |
| **Gesamt**             |                                             | **≈ 70** |  **100** |                                           |

Grundlage der Ist-Spalte sind 59 Journal-Zeilen über zehn Arbeitstage zwischen dem
29.07.2026 und dem 20.08.2026 mit zusammen 97,8 h, zuzüglich der noch nicht gebuchten
Arbeit an Anhang und Zusammenbau und abzüglich der nach `D-01` umgebuchten Anteile.

## 11.2 Abbildungen

> TODO: Die gerenderten SVGs aus `rendered/`. Vorgesehen:
>
> - Bausteinsicht Dash-Cluster (Kap. 4.2.1)
> - Bausteinsicht WASM-Grenze (Kap. 5.2.2 a)
> - Sequenzdiagramm eines Frames (Kap. 5.2.2 b)
> - Bausteinsicht Input-Kette (Kap. 3.2.2)
> - Optional: Dash-Zustandsmaschine als eigenes Diagramm, falls sie in 4.2.1 zu
>   dicht wird
>
> Erzeugen mit `npm run docs:diagrams`. **Als SVG in Word einfügen, nicht als PNG.**
>
> Dazu zwei Screenshots der erzeugten Test-Reports, weil der Katalog für Coverage und
> E2E je „report erzeugen" verlangt und die HTML-Ausgaben selbst gitignoriert sind:
> `frontend/coverage/index.html` (`npm run test:coverage`) und
> `frontend/playwright-report/` (`npm run test:e2e:report`).

## 11.3 Quellcode-Ausschnitte

> TODO: Kurze, aussagekräftige Ausschnitte — je 10–25 Zeilen, keine ganzen Dateien.
> Jeder Ausschnitt braucht eine Beschriftung und wird im Fließtext referenziert.
> Kandidaten, nach Aussagekraft geordnet:
>
> 1. `dash_selection.rs` — die deterministische Auswahl per Integer-Hash über
>    `step_counter`; der stärkste Beleg für das Fokus-Thema.
> 2. `wasm_bridge/response.rs` — der Puffer-Vertrag, exemplarisch an den vier
>    index-alignierten Gettern.
> 3. `Flock::update()` — Snapshot-Klon und Schrittreihenfolge.
> 4. `dash_render_phase` — das Sign-Packing in einer Funktion.
> 5. `loop/frameScheduler.js` — die Fixed-Timestep-Arithmetik mit Schuldenklemmung.
> 6. `input/inputManager.js` — der flankengetriggerte Latch.
> 7. `engine-bridge.js` — die snake_case→camelCase-Übersetzung.

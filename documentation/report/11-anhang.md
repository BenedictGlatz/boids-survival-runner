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
> - Coverage je Modul, getrennt nach Sprache (Zahlen aus Kap. 9.2b) — sortiert nach
>   Wert, damit die zweigipfelige Verteilung aus Kap. 8.1 sichtbar wird
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

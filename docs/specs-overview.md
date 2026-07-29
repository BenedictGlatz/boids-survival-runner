# Spezifikations-Übersicht — Boids Survival Runner

Blickwinkel: Anwendung (gesamt)

## 1) Architektur-Übersicht

**Fachlich:** Die **Engine** rechnet die komplette Schwarm-Simulation pro Frame
(Boid-Bewegung, Kollisionen). Das **Frontend** macht alles Sichtbare: Rendering,
Eingabe, Menüs, Spielzustände. Eine schmale **Bridge** überträgt Positionen und
Kollisionen zwischen beiden.

**Technisch:**

- **Rust → WebAssembly** (`wasm-pack`): rechenintensive Simulation, performant und deterministisch.
- **JavaScript + Vite**: Render-Loop, HTML5-Canvas, Input, Game-State.
- **JSON**: Locales (i18n) und Tuning-Config.

## 2) Feature-Liste (Specs)

| #    | Spec                                                          | Wo         |
|------|--------------------------------------------------------------|------------|
| S-01 | Boid-Schwarm-Simulation (Steering, Varianten, Kollision/Overlap) | Engine     |
| S-02 | WASM-Bridge-API (Buffer-Vertrag JS↔Rust)                     | Engine/FE  |
| S-03 | Rendering & HUD (Canvas, Leben/Score/Wave/Timer)             | Frontend   |
| S-04 | Spiel-Loop & Wave-Progression (Schwierigkeitskurve)          | Frontend   |
| S-05 | Steuerung & Power-Ups (Dash umgesetzt, *fiktiv: Schild, Slow-Time*) | Engine/FE |
| S-06 | Querschnitt: i18n, Scoring/Highscore, Build-Pipeline         | FE/E       |

Detail-Specs:

- [S-05a — Dash (Spieler und Boids)](spec-s05-dash.md)

## 3) Aufwandsschätzung (grob)

| Spec                         | Aufwand |
|------------------------------|--------:|
| S-01 Schwarm-Simulation      | 18 h    |
| S-02 Bridge-API              | 5 h     |
| S-03 Rendering & HUD         | 12 h    |
| S-04 Loop & Waves            | 10 h    |
| S-05 Steuerung & Power-Ups   | 14 h    |
| S-06 Querschnitt             | 12 h    |
| **Summe**                    | **71 h**|
| + Integration/Test (~20 %)   | ~14 h   |
| **Gesamt**                   | **≈ 85 h (≈ 11 PT)** |

**Schwerpunkt:** Die Engine (S-01/S-02, ~23 h) ist der teuerste Block. Das
Grundgerüst ist spielbar; offen sind v. a. die restlichen Power-Ups,
Highscore-Persistenz und Settings.

Der Dash aus S-05 ist umgesetzt (~12 h der dort geschätzten 14 h, siehe
[spec-s05-dash.md](spec-s05-dash.md)) und hat S-05 von *Frontend* auf *Engine/FE*
verschoben, weil der Boid-Dash in der Simulation liegt. Offen bleiben in S-05
Schild und Slow-Time.

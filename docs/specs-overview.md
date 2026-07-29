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

| #    | Spec                                                                | Wo        |
| ---- | ------------------------------------------------------------------- | --------- |
| S-01 | Boid-Schwarm-Simulation (Steering, Varianten, Kollision/Overlap)    | Engine    |
| S-02 | WASM-Bridge-API (Buffer-Vertrag JS↔Rust)                            | Engine/FE |
| S-03 | Rendering & HUD (Canvas, Leben/Score/Wave/Timer)                    | Frontend  |
| S-04 | Spiel-Loop & Wave-Progression (Schwierigkeitskurve)                 | Frontend  |
| S-05 | Steuerung & Power-Ups (Dash umgesetzt, _fiktiv: Schild, Slow-Time_) | Engine/FE |
| S-06 | Querschnitt: i18n, Scoring/Highscore, Build-Pipeline                | FE/E      |

Detail-Specs:

- [S-05a — Dash (Spieler und Boids)](spec-s05-dash.md)

## 3) Aufwandsschätzung (grob)

### 3.1) Fachliche Specs

| Spec                       |              Aufwand |
| -------------------------- | -------------------: |
| S-01 Schwarm-Simulation    |                 18 h |
| S-02 Bridge-API            |                  5 h |
| S-03 Rendering & HUD       |                 12 h |
| S-04 Loop & Waves          |                 10 h |
| S-05 Steuerung & Power-Ups |                 14 h |
| S-06 Querschnitt           |                 12 h |
| **Summe**                  |             **71 h** |
| + Integration/Test (~20 %) |                ~14 h |
| **Gesamt Specs**           | **≈ 85 h (≈ 11 PT)** |

**Schwerpunkt:** Die Engine (S-01/S-02, ~23 h) ist der teuerste Block. Das
Grundgerüst ist spielbar; offen sind v. a. die restlichen Power-Ups,
Highscore-Persistenz und Settings.

Der Dash aus S-05 ist umgesetzt (~12 h der dort geschätzten 14 h, siehe
[spec-s05-dash.md](spec-s05-dash.md)) und hat S-05 von _Frontend_ auf _Engine/FE_
verschoben, weil der Boid-Dash in der Simulation liegt. Offen bleiben in S-05
Schild und Slow-Time.

### 3.2) Tooling- und Qualitätsmaßnahmen

Diese Maßnahmen sind vom Anforderungskatalog der Prüfungsleistung gefordert
(Kapitel „Tooling" und „Qualität") und waren in der ursprünglichen Schätzung
nicht enthalten. Sie werden schrittweise nachgezogen und dabei dokumentiert.

| ID                | Maßnahme                                                     |    Aufwand |
| ----------------- | ------------------------------------------------------------ | ---------: |
| T-01              | ESLint + Prettier + `require-jsdoc`-Enforcement              |        5 h |
| T-02              | TypeScript-Prüfung über `allowJs` + `checkJs`                |        3 h |
| T-03              | Coverage-Report beide Sprachen (Vitest + `cargo llvm-cov`)   |      3,5 h |
| T-04              | E2E-Tests (Playwright) inkl. Report                          |        6 h |
| T-05              | CI/CD: GitHub-Actions-Pipeline (build, test, lint, fmt)      |        5 h |
| T-06              | Deployment auf GitHub Pages (inkl. `vite.config.js`)         |        3 h |
| T-07              | Unit-Test-Lücken schließen (FE-Module + WASM-Buffer-Vertrag) |        6 h |
| **Summe Tooling** |                                                              | **31,5 h** |

T-03 war ursprünglich mit 2 h nur als Vitest-Coverage geplant. Die Erweiterung auf
`cargo llvm-cov` kostet 1,5 h mehr und ist es wert: Die Engine ist das gewählte
Fokus-Thema und enthält den Großteil der Logik, eine Coverage-Aussage, die genau
diese Hälfte nicht misst, wäre die schwächere Aussage.

T-07 ist neu und war in der ursprünglichen Aufstellung nicht enthalten. Der Katalog
nennt „Unit Tests aufsetzen" eigenständig neben dem Coverage-Report, und „Hohe
Testabdeckung" ist zusätzlich ein eigenes Kriterium im Deliverable _Working Code_.
Ein Coverage-Werkzeug ohne die Tests, die es messen soll, erfüllt davon nur die
Hälfte.

### 3.3) Dokumentation

| ID   | Maßnahme                                               | Aufwand |
| ---- | ------------------------------------------------------ | ------: |
| D-01 | Projekt- & Architekturdokumentation, Diagramme, Layout |    22 h |

### 3.4) Gesamtbudget und bewusste Kürzung

| Block              |                 Aufwand |
| ------------------ | ----------------------: |
| Specs S-01…S-06    |                  ≈ 85 h |
| Tooling T-01…T-07  |                ≈ 31,5 h |
| Dokumentation D-01 |                  ≈ 22 h |
| **Gesamt**         | **≈ 138,5 h (≈ 18 PT)** |

Bis zur Abgabe am **03.09.2026** stehen realistisch ~5 Wochen zur Verfügung. Das
Gesamtbudget von ≈ 138,5 h liegt damit über der verfügbaren Kapazität, weshalb
bewusst gekürzt wird:

- **Schild und Slow-Time aus S-05 entfallen** (≈ 2 h Restbudget in S-05). Der
  Dash belegt das Power-Up-Thema bereits vollständig — inklusive Engine-Anteil,
  Vorwarnung und Barrierefreiheits-Trade-off. Zwei weitere Power-Ups würden
  fachlich wenig Neues zeigen.
- **Priorität bei Tooling über Feature-Breite**, weil „Linter & Formatter aktiv
  und grün, hohe Testabdeckung" ein eigenes Bewertungskriterium ist.
- **Code-Freeze am 24.08.2026**; die restlichen ~10 Tage sind für Prosa,
  Diagramme und Layout reserviert.

Die Überbuchung ist mit T-03 und T-07 um 7,5 h **gewachsen**, und sie wird hier
nicht durch eine Gegenkürzung wegdefiniert. Was sie trägt, ist die Reihenfolge: Die
Qualitätsmaßnahmen liegen vor T-02, T-05 und T-06, weil sie zwei Kriterien
gleichzeitig bedienen (_Qualität_ als Kapitel und „hohe Testabdeckung" als
Code-Kriterium), während TypeScript und Deployment je nur eines bedienen. Reicht die
Kapazität am Ende nicht für alle sieben, fällt die Entscheidung am hinteren Ende der
Liste und wird dort begründet — nicht am vorderen. Der bereits im Journal
festgehaltene Notausgang gilt weiter: ein Werkzeug weglassen und seine Absenz in drei
ehrlichen Sätzen begründen kostet 10 min statt 4 h Setup plus einer Seite Prosa.

Ist-Aufwände werden pro Arbeitssitzung in
[documentation/report/projekt-journal.md](../documentation/report/projekt-journal.md)
festgehalten und speisen den Kapazitätsplan des Projektberichts.

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

| #    | Spec                                                                      | Wo        |
| ---- | ------------------------------------------------------------------------- | --------- |
| S-01 | Boid-Schwarm-Simulation (Steering, Varianten, Kollision/Overlap)          | Engine    |
| S-02 | WASM-Bridge-API (Buffer-Vertrag JS↔Rust)                                  | Engine/FE |
| S-03 | Rendering & HUD (Canvas, Leben/Score/Wave/Timer)                          | Frontend  |
| S-04 | Spiel-Loop & Wave-Progression (Schwierigkeitskurve)                       | Frontend  |
| S-05 | Steuerung & Power-Ups (Dash und Power-ups umgesetzt, _fiktiv: Slow-Time_) | Engine/FE |
| S-06 | Querschnitt: i18n, Scoring/Highscore, Build-Pipeline                      | FE/E      |
| S-07 | Temporäre Hindernisse (Weltgeometrie, Kollision, Dichte-Rampe)            | Engine/FE |

Detail-Specs:

- [S-05a — Dash (Spieler und Boids)](spec-s05-dash.md)
- [S-05b — Power-ups (Aegis und Overdrive)](spec-s05b-powerups.md)
- [S-07 — Temporäre Hindernisse](spec-s07-hindernisse.md)

## 3) Aufwandsschätzung (grob)

### 3.1) Fachliche Specs

| Spec                       |               Aufwand |
| -------------------------- | --------------------: |
| S-01 Schwarm-Simulation    |                  18 h |
| S-02 Bridge-API            |                   5 h |
| S-03 Rendering & HUD       |                  12 h |
| S-04 Loop & Waves          |                  10 h |
| S-05 Steuerung & Power-Ups |                  20 h |
| S-06 Querschnitt           |                  12 h |
| S-07 Hindernisse           |                  16 h |
| **Summe**                  |              **93 h** |
| + Integration/Test (~20 %) |                 ~19 h |
| **Gesamt Specs**           | **≈ 112 h (≈ 14 PT)** |

**Schwerpunkt:** Die Engine (S-01/S-02, ~23 h) ist der teuerste Block. Das
Grundgerüst ist spielbar; offen sind v. a. Highscore-Persistenz und Settings.

Der Dash aus S-05 ist umgesetzt (~12 h der dort ursprünglich geschätzten 14 h, siehe
[spec-s05-dash.md](spec-s05-dash.md)) und hat S-05 von _Frontend_ auf _Engine/FE_
verschoben, weil der Boid-Dash in der Simulation liegt. Die beiden Power-ups Aegis und
Overdrive ([spec-s05b-powerups.md](spec-s05b-powerups.md)) kommen mit ~6 h dazu; S-05
steht damit bei 20 h. Offen bleibt in S-05 nur noch Slow-Time.

S-07 ist **nachträglich aufgenommen** und war in der ursprünglichen Aufstellung nicht
enthalten. Er ist kein Teil von S-01, weil er nicht das Schwarmmodell verfeinert,
sondern der Welt erstmals eine Geometrie gibt, gegen die Spieler und Boids
unterschiedlich reagieren; und kein Teil von S-05, weil er keine Spielerfähigkeit
ist. Details in [spec-s07-hindernisse.md](spec-s07-hindernisse.md).

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
| Specs S-01…S-07    |                 ≈ 112 h |
| Tooling T-01…T-07  |                ≈ 31,5 h |
| Dokumentation D-01 |                  ≈ 22 h |
| **Gesamt**         | **≈ 165,5 h (≈ 21 PT)** |

Bis zur Abgabe am **03.09.2026** stehen realistisch ~5 Wochen zur Verfügung. Das
Gesamtbudget von ≈ 165,5 h liegt damit über der verfügbaren Kapazität, weshalb
bewusst gekürzt wird:

- **Slow-Time aus S-05 entfällt.** Es wäre das einzige der drei angedachten
  Power-Ups, das den festen Zeitschritt anfassen müsste — und der ist eine der beiden
  tragenden Invarianten des Projekts. Ein Feature, dessen Kern darin besteht, eine
  Invariante aufzuweichen, ist kein guter Kandidat für die Restkapazität.
- **Priorität bei Tooling über Feature-Breite**, weil „Linter & Formatter aktiv
  und grün, hohe Testabdeckung" ein eigenes Bewertungskriterium ist.
- **S-07 wird trotz der Überbuchung aufgenommen.** Die Hindernisse bringen zwei
  fachlich neue Dinge in den Bericht — eine Geometrie-Invariante, die konstruktiv
  erzwungen statt zur Laufzeit geprüft wird, und eine Erweiterung des Buffer-Vertrags
  an der WASM-Grenze.
- **Schild und Overdrive werden wieder aufgenommen** (≈ 6 h, [S-05b](spec-s05b-powerups.md)),
  nachdem sie hier zuvor gestrichen waren. Die damalige Begründung — „zwei weitere
  Power-Ups würden fachlich wenig Neues zeigen" — hat sich als falsch herausgestellt,
  und zwar an einer Stelle, die vorher nicht sichtbar war: Der Dash ist eine Fähigkeit,
  die dem Spieler dauerhaft gehört, die beiden Power-ups sind Objekte in der Welt.
  Damit kommen Spawn-Platzierung gegen die Hindernis-Geometrie aus S-07, eine zweite
  Quelle von Unverwundbarkeit neben der Treffer-Gnadenfrist und die Frage, wo eine
  Fähigkeit mit Restlaufzeit angezeigt gehört, überhaupt erst auf. Ehrlich bleibt
  trotzdem: Die ursprüngliche Kürzung sollte Kapazität freimachen, und diese Aufnahme
  gibt sie vollständig wieder aus.
- **Code-Freeze am 24.08.2026**; die restlichen ~10 Tage sind für Prosa,
  Diagramme und Layout reserviert.

Die Überbuchung ist mit T-03 und T-07 um 7,5 h, mit S-07 um weitere 19 h und mit S-05b
um noch einmal ~7 h **gewachsen**, und sie wird hier nicht durch eine Gegenkürzung
wegdefiniert. Was sie
trägt, ist die Reihenfolge: Die Qualitätsmaßnahmen liegen vor T-02, T-05 und T-06,
weil sie zwei Kriterien gleichzeitig bedienen (_Qualität_ als Kapitel und „hohe
Testabdeckung" als Code-Kriterium), während TypeScript und Deployment je nur eines
bedienen. S-07 liegt aus demselben Grund vor diesen drei: ein spielbares Feature mit
einer beweisbaren Invariante und einer Erweiterung des Fokus-Themas trägt mehr zum
Bericht bei als eine Deployment-Pipeline. Reicht die Kapazität am Ende nicht für alle
sieben Maßnahmen, fällt die Entscheidung am hinteren Ende der Liste und wird dort
begründet — nicht am vorderen. Der bereits im Journal festgehaltene Notausgang gilt
weiter: ein Werkzeug weglassen und seine Absenz in drei ehrlichen Sätzen begründen
kostet 10 min statt 4 h Setup plus einer Seite Prosa.

Ist-Aufwände werden pro Arbeitssitzung in
[documentation/report/projekt-journal.md](../documentation/report/projekt-journal.md)
festgehalten und speisen den Kapazitätsplan des Projektberichts.

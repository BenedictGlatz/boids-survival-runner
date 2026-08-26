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
| S-04 | Spiel-Loop & Wave-Progression (Schwierigkeitskurve, Pause)                | Frontend  |
| S-05 | Steuerung & Power-Ups (Dash und Power-ups umgesetzt, _fiktiv: Slow-Time_) | Engine/FE |
| S-06 | Querschnitt: i18n, Scoring/Highscore, Build-Pipeline                      | FE/E      |
| S-07 | Temporäre Hindernisse (Weltgeometrie, Kollision, Dichte-Rampe)            | Engine/FE |

Detail-Specs:

- [S-01 — Boid-Schwarm-Simulation](spec-s01-schwarm-simulation.md)
- [S-02 — WASM-Bridge-API (Puffer-Vertrag JS ↔ Rust)](spec-s02-wasm-bridge.md)
- [S-03 — Rendering & HUD](spec-s03-rendering-hud.md)
- [S-04b — Pause (Escape und Fokusverlust)](spec-s04b-pause.md)
- [S-05a — Dash (Spieler und Boids)](spec-s05-dash.md)
- [S-05b — Power-ups (Aegis, Overdrive und Mend)](spec-s05b-powerups.md)
- [S-07 — Temporäre Hindernisse](spec-s07-hindernisse.md)

**S-04 und S-06 haben keinen eigenen Detail-Spec.** Bei S-04 tragen der feste
Zeitschritt und die Wellen-Progression ihre Festlegungen im Bericht (Kapitel 5) und in S-04b;
S-06 ist ein Querschnittsposten aus i18n, Scoring und Build-Pipeline, dessen drei Teile fachlich
nichts miteinander zu tun haben — ein gemeinsamer Spec wäre eine Sammelmappe, kein Dokument.

## 3) Aufwandsschätzung (grob)

### 3.1) Fachliche Specs

| Spec                       |             Aufwand |
| -------------------------- | ------------------: |
| S-01 Schwarm-Simulation    |               4,5 h |
| S-02 Bridge-API            |               1,5 h |
| S-03 Rendering & HUD       |                 3 h |
| S-04 Loop & Waves          |               3,5 h |
| S-05 Steuerung & Power-Ups |               5,5 h |
| S-06 Querschnitt           |                 3 h |
| S-07 Hindernisse           |                 4 h |
| **Summe**                  |            **25 h** |
| + Integration/Test (~20 %) |                ~5 h |
| **Gesamt Specs**           | **≈ 30 h (≈ 4 PT)** |

**Schwerpunkt:** Die Engine (S-01/S-02, ~6 h) ist der teuerste Block. Das
Grundgerüst ist spielbar; offen sind v. a. Highscore-Persistenz und Settings.

Der Dash aus S-05 ist umgesetzt (~3 h der dort ursprünglich geschätzten 3,5 h, siehe
[spec-s05-dash.md](spec-s05-dash.md)) und hat S-05 von _Frontend_ auf _Engine/FE_
verschoben, weil der Boid-Dash in der Simulation liegt. Die beiden Power-ups Aegis und
Overdrive ([spec-s05b-powerups.md](spec-s05b-powerups.md)) kommen mit ~1,5 h dazu, die
Vorwarnlinie des Boid-Dashs mit ~0,5 h; S-05 steht damit bei 5,5 h. Offen bleibt in S-05 nur
noch Slow-Time.

S-04 steht bei 3,5 h statt 2,5 h, weil die Pause ([spec-s04b-pause.md](spec-s04b-pause.md))
mit ~1 h dazukommt. Sie liegt in S-04 und nicht in S-03, obwohl das Sichtbarste an ihr eine
Karte ist: Die Karte ist eine Kopie der bestehenden Game-Over-Karte, der Aufwand steckt im
vierten Freeze-Fall des festen Zeitschritts und in der Wandzeit-Frist des Countdowns — also
in genau dem Mechanismus, den S-04 beschreibt.

S-07 ist **nachträglich aufgenommen** und war in der ursprünglichen Aufstellung nicht
enthalten. Er ist kein Teil von S-01, weil er nicht das Schwarmmodell verfeinert,
sondern der Welt erstmals eine Geometrie gibt, gegen die Spieler und Boids
unterschiedlich reagieren; und kein Teil von S-05, weil er keine Spielerfähigkeit
ist. Details in [spec-s07-hindernisse.md](spec-s07-hindernisse.md).

### 3.2) Tooling- und Qualitätsmaßnahmen

Diese Maßnahmen sind vom Anforderungskatalog der Prüfungsleistung gefordert
(Kapitel „Tooling" und „Qualität") und waren in der ursprünglichen Schätzung
nicht enthalten. Sie werden schrittweise nachgezogen und dabei dokumentiert.

| ID                | Maßnahme                                                     |  Aufwand |
| ----------------- | ------------------------------------------------------------ | -------: |
| T-01              | ESLint + Prettier + `require-jsdoc`-Enforcement              |    2,5 h |
| T-02              | TypeScript-Prüfung über `allowJs` + `checkJs`                |    1,5 h |
| T-03              | Coverage-Report beide Sprachen (Vitest + `cargo llvm-cov`)   |    1,5 h |
| T-04              | E2E-Tests (Playwright) inkl. Report                          |      3 h |
| T-05              | CI/CD: GitHub-Actions-Pipeline (build, test, lint, fmt)      |    2,5 h |
| T-06              | Deployment auf GitHub Pages (inkl. `vite.config.js`)         |    1,5 h |
| T-07              | Unit-Test-Lücken schließen (FE-Module + WASM-Buffer-Vertrag) |      3 h |
| T-08              | GPU-Last des Renderers: messen, dann senken                  |    4,5 h |
| **Summe Tooling** |                                                              | **20 h** |

T-03 war ursprünglich mit 1 h nur als Vitest-Coverage geplant. Die Erweiterung auf
`cargo llvm-cov` kostet 0,5 h mehr und ist es wert: Die Engine ist das gewählte
Fokus-Thema und enthält den Großteil der Logik, eine Coverage-Aussage, die genau
diese Hälfte nicht misst, wäre die schwächere Aussage.

T-08 ist ebenfalls neu und geht auf eine Beobachtung im Spielbetrieb zurück: Die
GPU-Auslastung während einer Runde ist hoch, obwohl das Bild einfach ist. Die Maßnahme
liegt in §3.2 und nicht als Spec, weil sie kein Verhalten hinzufügt — bei
pixelgleichem Bild soll dieselbe Runde weniger Rechenwerk kosten. Sie ist in zwei
Stufen geschnitten, und die erste ist ausdrücklich keine Optimierung: ~1,5 h für eine
Messgrundlage, weil der vorhandene Frametime-Graph Skriptzeit misst und über GPU-Zeit
strukturell nichts aussagen kann (Kap. 8.6). Die zweite Stufe (~3 h) wird erst nach
den Zahlen priorisiert. Der einzige Teil mit sichtbarer Wirkung für Spieler ist eine
Einstellung für die Render-Auflösung, deren Standardwert das heutige Bild ist.

T-07 ist neu und war in der ursprünglichen Aufstellung nicht enthalten. Der Katalog
nennt „Unit Tests aufsetzen" eigenständig neben dem Coverage-Report, und „Hohe
Testabdeckung" ist zusätzlich ein eigenes Kriterium im Deliverable _Working Code_.
Ein Coverage-Werkzeug ohne die Tests, die es messen soll, erfüllt davon nur die
Hälfte.

### 3.3) Dokumentation

| ID   | Maßnahme                                               | Aufwand |
| ---- | ------------------------------------------------------ | ------: |
| D-01 | Projekt- & Architekturdokumentation, Diagramme, Layout |    20 h |

### 3.4) Gesamtbudget und bewusste Kürzung

| Block              |             Aufwand |
| ------------------ | ------------------: |
| Specs S-01…S-07    |              ≈ 30 h |
| Tooling T-01…T-08  |              ≈ 20 h |
| Dokumentation D-01 |              ≈ 20 h |
| **Gesamt**         | **≈ 70 h (≈ 9 PT)** |

Bis zur Abgabe am **03.09.2026** stehen realistisch ~5 Wochen zur Verfügung, in denen
neben diesem Projekt weitere Verpflichtungen laufen. Das Gesamtbudget von ≈ 70 h
schöpft diese Kapazität praktisch vollständig aus und lässt keine Reserve für
Fehlschätzungen, weshalb bewusst gekürzt wird:

- **Slow-Time aus S-05 entfällt.** Es wäre das einzige der drei angedachten
  Power-Ups, das den festen Zeitschritt anfassen müsste — und der ist eine der beiden
  tragenden Invarianten des Projekts. Ein Feature, dessen Kern darin besteht, eine
  Invariante aufzuweichen, ist kein guter Kandidat für die Restkapazität.
- **Priorität bei Tooling über Feature-Breite**, weil „Linter & Formatter aktiv
  und grün, hohe Testabdeckung" ein eigenes Bewertungskriterium ist.
- **S-07 wird trotz der knappen Kapazität aufgenommen.** Die Hindernisse bringen zwei
  fachlich neue Dinge in den Bericht — eine Geometrie-Invariante, die konstruktiv
  erzwungen statt zur Laufzeit geprüft wird, und eine Erweiterung des Buffer-Vertrags
  an der WASM-Grenze.
- **Schild und Overdrive werden wieder aufgenommen** (≈ 1,5 h, [S-05b](spec-s05b-powerups.md)),
  nachdem sie hier zuvor gestrichen waren. Die damalige Begründung — „zwei weitere
  Power-Ups würden fachlich wenig Neues zeigen" — hat sich als falsch herausgestellt,
  und zwar an einer Stelle, die vorher nicht sichtbar war: Der Dash ist eine Fähigkeit,
  die dem Spieler dauerhaft gehört, die beiden Power-ups sind Objekte in der Welt.
  Damit kommen Spawn-Platzierung gegen die Hindernis-Geometrie aus S-07, eine zweite
  Quelle von Unverwundbarkeit neben der Treffer-Gnadenfrist und die Frage, wo eine
  Fähigkeit mit Restlaufzeit angezeigt gehört, überhaupt erst auf. Ehrlich bleibt
  trotzdem: Die ursprüngliche Kürzung sollte Kapazität freimachen, und diese Aufnahme
  gibt sie vollständig wieder aus.
- **Die Pause kommt trotz der knappen Kapazität dazu** (≈ 1 h, [S-04b](spec-s04b-pause.md)) und
  ist der einzige Posten in dieser Liste, der als Fehlerbehebung gerechtfertigt ist statt
  als Feature: Ein Fensterwechsel aus einer laufenden Runde lässt den Scheduler die ganze
  Abwesenheit als Simulationsschuld sehen und die Welt in einem Bild um bis zu ~83 ms
  springen — auf einen Spieler zu, den der Schwarm sucht. Eine automatische Pause bei
  Fokusverlust schließt das, und die Karte fällt dabei als das Billigste an, was das
  Feature enthält. Sie bringt zusätzlich den vierten Freeze-Fall des festen Zeitschritts
  in den Bericht, also einen weiteren belegbaren Fall zur tragenden Invariante.
- **T-08 kommt mit ~4,5 h dazu** und ist damit der teuerste Nachzügler nach S-07. Was
  ihn trägt, ist nicht der GPU-Gewinn, sondern der Umstand, dass das Projekt bis
  hierher **keine** Aussage über Laufzeitkosten machen konnte, die einer Prüfung
  standhält: Der Frametime-Graph misst Skriptzeit, und das Overlay, das ihn zeigt,
  verfälschte durch seinen eigenen `backdrop-filter` genau die Größe, um die es geht.
  Das ist ein Befund über das Werkzeug, nicht über das Spiel, und Kapitel 8 kann ihn
  belegen. Die zweite Stufe ist zusätzlich der einzige Ort im Projekt, an dem eine
  Optimierung gegen eine Vorher-Messung gestellt wird statt gegen ein Gefühl.
- **Code-Freeze am 24.08.2026**; die restlichen ~10 Tage sind für Prosa,
  Diagramme und Layout reserviert.

Das Budget ist mit T-03 und T-07 um 3,5 h, mit S-07 um weitere ~5 h, mit S-05b um
noch einmal ~2 h, mit S-04b um ~1 h und mit T-08 um ~4,5 h **gewachsen**, und die
Überschreitung der Kapazität wird hier nicht durch eine Gegenkürzung wegdefiniert. Was sie
trägt, ist die Reihenfolge: Die Qualitätsmaßnahmen liegen vor T-02, T-05 und T-06,
weil sie zwei Kriterien gleichzeitig bedienen (_Qualität_ als Kapitel und „hohe
Testabdeckung" als Code-Kriterium), während TypeScript und Deployment je nur eines
bedienen. S-07 liegt aus demselben Grund vor diesen drei: ein spielbares Feature mit
einer beweisbaren Invariante und einer Erweiterung des Fokus-Themas trägt mehr zum
Bericht bei als eine Deployment-Pipeline. T-08 liegt hinter S-07, aber vor T-02 und
T-06: Seine erste Stufe ist billig und macht Kapitel 8 belegbar, seine zweite hängt an
Zahlen, die es erst selbst erzeugt — reicht die Kapazität nicht, fällt genau diese
zweite Stufe, und die erste bleibt als Befund stehen. Reicht die Kapazität am Ende
nicht für alle acht Maßnahmen, fällt die Entscheidung am hinteren Ende der Liste und
wird dort begründet — nicht am vorderen. Der bereits im Journal festgehaltene Notausgang gilt
weiter: ein Werkzeug weglassen und seine Absenz in drei ehrlichen Sätzen begründen
kostet 10 min statt 4 h Setup plus einer Seite Prosa.

Ist-Aufwände werden pro Arbeitssitzung in
[documentation/report/projekt-journal.md](../documentation/report/projekt-journal.md)
festgehalten und speisen den Kapazitätsplan des Projektberichts.

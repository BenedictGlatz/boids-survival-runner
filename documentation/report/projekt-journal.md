# Projekt-Journal

Erfassungsstelle für alles, was **später nicht mehr rekonstruierbar** ist. Kein
Kapitel des Berichts, sondern dessen Rohmaterial — speist vor allem
[Kapitel 10 Projektbericht](10-projektbericht.md).

**Pflicht pro Änderung** (`CLAUDE.md` → _Mandatory per-change steps_, Schritt 5):

- **immer** eine Zeile in _Aufwand_;
- **wenn zutreffend** ein Block in _Entscheidungen_ — jede nicht offensichtliche
  technische Entscheidung, inklusive verworfener Alternativen;
- **wenn zutreffend** ein Punkt in _Herausforderungen_ — alles, was mehr als ~30 min
  ungeplante Arbeit gekostet hat.

**Nie hier festhalten**, was ein Befehl regenerieren kann: LOC, Testzahlen,
Script-Listen, Abhängigkeitsversionen, Chronologie. Das steht in
[Kapitel 09](09-quellcode-uebersicht.md) bzw. lässt sich aus `git log` und
`CHANGELOG.md` ableiten.

Sprache: **Deutsch**, weil es direkt in den Bericht wandert. Code, README und
CHANGELOG bleiben englisch.

Jeder Entscheidungs-Block trägt einen `→ Kap. n`-Tag. Damit ist die Schreibphase ein
`grep`, kein erneutes Durchlesen.

---

## Aufwand

Eine Zeile pro **Arbeitssitzung**, nicht pro Task. Bis zur Abgabe sind ~20–25 Zeilen
zu erwarten. Maßnahmen-IDs (`S-01`…`S-07`, `T-01`…`T-07`, `D-01`) kommen aus
[docs/specs-overview.md](../../docs/specs-overview.md) und sind das gemeinsame
Vokabular von Planung, Journal und Kapitel 10.

Warum explizit und nicht aus `git log` rekonstruiert: die bisherigen 27 Commits
fallen auf vier Kalendertage, Commit-Zeitstempel komprimieren also Arbeitsschübe und
sagen nichts über Lese-, Denk- und Debugging-Zeit. Mit einem Agenten, der tippt, ist
die Zeit zwischen Commits ein aktiv irreführender Aufwandsindikator. Verworfene
Ansätze hinterlassen überhaupt keinen Commit — und das sind genau die Stunden, nach
denen der Kapazitätsplan fragt. `git log` dient als Gegenprobe, nicht als Quelle.

| Datum      |   h | Spec/Maßnahme | Was                                                                                                                                                                                                                                                      |
| ---------- | --: | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-29 | 2,0 | D-01          | Anforderungskatalog und Musterdokumentation ausgewertet, Kapitelstruktur und begleitendes Doku-Ritual entworfen, Berichtsgerüst angelegt                                                                                                                 |
| 2026-07-29 | 3,5 | T-01          | ESLint-Flat-Config mit JSDoc-Enforcement und Prettier eingerichtet, JSDoc in acht Dateien nachgerüstet (Schwerpunkt `playerController.js`, `engine-bridge.js`), Kap. 7.1/7.3/7.4/7.5 und 8.4 geschrieben                                                 |
| 2026-07-29 | 1,5 | T-03          | Coverage für beide Sprachen eingerichtet (`@vitest/coverage-v8`, `cargo llvm-cov`), Ausgangsmessung genommen; T-07 als neue Maßnahme aufgenommen und Kapazitätsplan fortgeschrieben                                                                      |
| 2026-07-29 | 3,0 | T-07          | Unit-Tests für `frameScheduler`, `gameState`, `controls` und `playerController` geschrieben; `engine/tests/wasm_tests.rs` vom Stub zum Buffer-Vertragstest ausgebaut                                                                                     |
| 2026-07-29 | 4,0 | T-04          | Playwright gegen den Preview-Build eingerichtet, fünf Flows geschrieben, dabei den fehlenden Locale-Umzug gefunden und behoben; Kap. 8.1/8.2 ausgeschrieben, 7.1 und 9.2b nachgezogen                                                                    |
| 2026-07-30 | 1,5 | D-01          | Musterdokumentation Seite für Seite als `documentation/muster-referenz.md` erfasst — Kapitelaufbau, Stilanalyse, Kapitel-Mapping Muster → Bericht, Arbeitsregeln; aus `CLAUDE.md` und Kap. 00 verlinkt                                                   |
| 2026-07-30 | 1,0 | S-07          | Runden- und Leben-Buchführung aus `index.js` nach `round/roundData.js` ausgelagert, weil `index.js` an der 400-Zeilen-Grenze stand, und unter Vitest abgedeckt; jede Schadensquelle geht jetzt durch ein gemeinsames `registerHit`                       |
| 2026-07-30 | 1,5 | S-07          | Temporäre Hindernisse als neuen Spec S-07 spezifiziert (`docs/spec-s07-hindernisse.md`) — Kapselgeometrie, Sackgassen-Invariante mit Beweisskizze, Dichte-Rampe, Engine/Frontend-Grenze; Schätzung und Gesamtbudget in `specs-overview.md` neu gerechnet |
| 2026-07-30 | 0,5 | S-05          | Dash-Reichweite um ~30 % erhöht (`PLAYER_DASH_SPEED_DECAY` 3000 → 2300), Rechenweg im JSDoc korrigiert und einen Test ergänzt, der die Distanz statt nur die Spitzengeschwindigkeit festnagelt                                                           |

## Entscheidungen

### 2026-07-30 — Dash-Reichweite über den Abbau, nicht über die Antrittsgeschwindigkeit

**Gewählt:** Die geforderten +30 % Reichweite kommen aus `PLAYER_DASH_SPEED_DECAY`
(3000 → 2300); `PLAYER_DASH_SPEED` bleibt bei 1100. Die Überschussdistanz ist die Fläche
unter der abfallenden Rampe über der normalen Höchstgeschwindigkeit, also
`(1100 − 360)² / (2 · decay)` — ein um den Faktor 1,3 kleinerer Abbau ergibt exakt eine um
1,3 größere Distanz, bei unveränderter Spitzengeschwindigkeit und einer Rampe von 0,25 s auf
0,32 s.

**Verworfen:**

| Alternative                            | Grund der Ablehnung                                                                                                                                                                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PLAYER_DASH_SPEED` auf ≈ 1205 erhöhen | Die Distanz wächst nur mit dem Quadrat der Rampe, der Antritt also mit √1,3. Das erhöht die Spitzengeschwindigkeit und damit die Strecke, die der Spieler pro Simulationsschritt zurücklegt — und genau die entscheidet später, ob er durch ein dünnes Hindernis tunneln kann. |
| Beide Konstanten anteilig verschieben  | Zwei gleichzeitig geänderte Werte für eine Anforderung; die Wirkung wäre nicht mehr einer Ursache zuzuordnen und die Rechnung im JSDoc nicht mehr nachvollziehbar.                                                                                                             |

**Konsequenz:** Der Dash fühlt sich im Moment des Antritts identisch an und trägt trotzdem
gut drei Gitterzellen statt knapp zweieinhalb. Der Test in `playerController.test.js` nagelt
jetzt zusätzlich die _Distanz_ fest, nicht nur die Geschwindigkeit im Startschritt — er
rechnet die Rampenfläche aus den Konstanten nach und klammert sie, weil die
Schrittintegration die kontinuierliche Fläche systematisch um wenige Prozent unterschreitet.

→ Kap. 3, 4

### 2026-07-30 — Musterdokumentation als Markdown-Referenz statt als PDF-Quelle

**Gewählt:** Der Inhalt der Musterdokumentation liegt aufbereitet in
`documentation/muster-referenz.md` — Kapitelaufbau mit Detailtiefe, eine Stilanalyse
(Sprachebene, Fettdruck-/Kursiv-Konvention, Argumentationsmuster), das Kapitel-Mapping
Muster → eigener Bericht und elf Arbeitsregeln fürs Schreiben. `CLAUDE.md` und
[00-index.md](00-index.md) verweisen darauf; das PDF bleibt als Original daneben liegen.

**Verworfen:**

| Alternative                                     | Grund der Ablehnung                                                                                                                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Das PDF pro Sitzung neu auslesen                | Der Textlayer ist unvollständig; Tabellen, Formeln und das KI-Verzeichnis kamen nur teilweise durch. Die Auswertung wäre bei jeder Sitzung anders ausgefallen — genau die Instabilität, die ein Vorbild nicht haben darf. |
| Nur eine Stil-Checkliste ohne Inhaltstranskript | Ohne den konkreten Aufbau je Kapitel fehlt der Maßstab für die Detailtiefe. Dass Kap. 3 zehn Seiten hat und Kap. 2 eine einzige, ist die eigentliche Information.                                                         |
| Die Regeln direkt in `CLAUDE.md` schreiben      | `CLAUDE.md` steuert die Entwicklung und wird in jeder Sitzung geladen. Eine mehrseitige Stilanalyse gehört dorthin, wo der Bericht entsteht; in `CLAUDE.md` steht nur der Verweis.                                        |

**Konsequenz:** Der Bericht hat ab jetzt einen prüfbaren Maßstab statt einer
Erinnerung. Zwei Punkte aus der Analyse wirken unmittelbar auf die Kapitelplanung: Das
Muster lagert fast die Hälfte seines Umfangs (15 von 38 Inhaltsseiten) in den Anhang
aus — das Seitenbudget in Kap. 00 ist damit weniger eng als angenommen, sofern Tabellen
und Listings konsequent nach [11-anhang.md](11-anhang.md) wandern. Und das Muster
benennt seine Schwächen offen (fehlender Formatter, kein Production Build, 12,67 %
Gesamt-Coverage) und ordnet sie ein, statt sie zu verschweigen; das ist bei sehr guter
Bewertung erkennbar kein Versehen und rechtfertigt die hier ohnehin nötige Erklärung
der Coverage-Zahlen.

→ Kap. 8, 9, 10, 11

### 2026-07-29 — Dokumentation begleitend statt nachgelagert

**Gewählt:** Pro Änderung werden _Fakten_ in dieses Journal gesichert; die
Struktur-Kapitel (01–06) werden in wenigen zusammenhängenden Sitzungen geschrieben.
Nur Kapitel 07, 08 und 12 wachsen wirklich pro Commit.

**Verworfen:**

| Alternative                                     | Grund der Ablehnung                                                                                                                                                                                       |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alle Kapitel pro Commit fortschreiben           | Die Struktur-Kapitel beschreiben Aufbau. Bei laufendem Code-Churn — JSDoc-Pflicht und die 400-Zeilen-Regel erzwingen Datei-Splits — würde derselbe Absatz mehrfach neu geschrieben.                       |
| Dokumentation komplett am Ende                  | Genau der Fehler, den die Musterdokumentation in ihren _Lessons Learned_ selbst benennt. Verworfene Alternativen und Ist-Aufwände sind nach Wochen nicht mehr rekonstruierbar.                            |
| Fakten in die jeweiligen Kapiteldateien streuen | Eine Tatsache speist oft 2–3 Kapitel; die Ablage in genau einem Kapitel verliert sie für die anderen. Außerdem erzwingt das Schreiben deutscher Prosa mitten in der Implementierung einen Kontextwechsel. |

**Konsequenz:** Ein einziges Append-Ziel ohne Entscheidungsaufwand. Ein normaler
Commit kostet eine Tabellenzeile (~15 s), nur interessante Commits kosten einen
Absatz. Bekanntes Risiko: das Journal kann zur reinen Halde werden — dagegen der
`→ Kap. n`-Tag und `npm run docs:check`.

→ Kap. 6, 10

### 2026-07-29 — Tooling-Lücke nachziehen statt begründen

**Gewählt:** ESLint, Prettier, JSDoc-Enforcement, TypeScript-Prüfung über `checkJs`,
Coverage, E2E, CI/CD und GitHub-Pages-Deployment werden nachgezogen (T-01…T-06,
≈24 h) und dabei dokumentiert.

**Verworfen:** Den Ist-Zustand nur beschreiben. Der Anforderungskatalog verlangt
diese Werkzeuge namentlich in den Kapiteln _Tooling_ und _Qualität_, und „Linter &
Formatter aktiv und grün, hohe Testabdeckung" ist zusätzlich ein eigenes
Bewertungskriterium im Deliverable _Working Code_. Die Lücke kostet also zweifach.

**Konsequenz:** Gesamtbudget steigt auf ≈131 h und liegt über der verfügbaren
Kapazität. Gegenfinanzierung: Schild und Slow-Time aus S-05 entfallen bewusst.
Notausgang, falls die Kapazität dennoch nicht reicht: ein Werkzeug streichen und die
Absenz begründen — drei ehrliche Sätze kosten 10 min statt 4 h Setup plus einer Seite
Prosa.

→ Kap. 7, 8, 10

### 2026-07-29 — JSDoc-Pflicht über esquery-Kontexte statt `publicOnly`

**Gewählt:** `jsdoc/require-jsdoc` und alle Inhaltsregeln (`require-param`,
`require-param-type`, `require-returns` …) teilen **eine** Liste von
esquery-Selektoren (`JSDOC_REQUIRED_CONTEXTS` in `frontend/eslint.config.js`):
exportierte Funktionen und Klassen sowie öffentliche Methoden exportierter Klassen.
Ausgenommen bleiben einfache exportierte Konstanten, Unterstrich-Präfixe und
`*.test.js`.

**Verworfen:**

| Alternative                                                                 | Grund der Ablehnung                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `publicOnly: true`                                                          | Unterscheidet nur exportiert/nicht exportiert und kennt die `_methode`-Konvention des Projekts nicht. Hätte `_startDash`, `_drawCurves` usw. wie öffentliche API behandelt und damit genau die Grenze verwischt, die der Unterstrich zieht.                        |
| Nur die Vorhandensein-Regel einschränken, Inhaltsregeln auf Standard lassen | Die Inhaltsregeln greifen dann auf _jede_ Funktion zu, die zufällig schon einen einzeiligen Prosa-Kommentar trägt — auch private und modulprivate. `--fix` schrieb dort leere `@param`-Zeilen hinein (siehe Herausforderungen).                                    |
| Legacy `.eslintrc` statt Flat Config                                        | Bei ESLint 9 nur noch über eine Kompatibilitätsschicht. Für eine neu angelegte Konfiguration gibt es keinen Grund, diese Schicht einzuziehen; `"type": "module"` ist ohnehin gesetzt.                                                                              |
| Strengere Sammel-Plugins (`unicorn`, `sonarjs`)                             | Optimieren auf idiomatisch-dichtes JavaScript und arbeiten damit direkt gegen die oberste Projektregel („`for`-Schleifen statt Iterator-Ketten", „ausgeschriebene Namen"). Ein Linter, der die Lesbarkeitsentscheidung anmeckert, wird abgeschaltet statt befolgt. |

**Konsequenz:** Die Regel prüft genau die Schnittstellen und lässt die
_Warum_-Kommentare im Blockinneren unangetastet — die bleiben eine menschliche
Urteilsfrage. Endstand fehler- **und** warnungsfrei, was `lint` erst als
CI-Gate (T-05) brauchbar macht. Nebennutzen: Weil `require-param-type` mit
aktiviert ist, liefern dieselben Blöcke später die Typinformation für `checkJs`
(T-02).

→ Kap. 7, 8

### 2026-07-29 — Prettier-Konfiguration an der Repository-Wurzel

**Gewählt:** `.prettierrc.json` und `.prettierignore` liegen im Wurzelverzeichnis,
die devDependency in `frontend/package.json`. `proseWrap: preserve`.

**Verworfen:**

| Alternative                                                                                           | Grund der Ablehnung                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Konfiguration in `frontend/`                                                                          | Prettiers Zuständigkeit ist das ganze Repository — die Berichtskapitel, `README.md` und `CHANGELOG.md` liegen außerhalb von `frontend/`. Prettier löst die Konfiguration von der zu formatierenden Datei nach oben auf, eine Wurzeldatei deckt beide Seiten ohne Duplikat ab. |
| Eigenes `package.json` an der Wurzel                                                                  | Zweites Lockfile und zweiter `npm install` nur für eine devDependency — teurer als die kleine Asymmetrie zwischen Konfigurationsort und Abhängigkeitsort.                                                                                                                     |
| `proseWrap` auf Standard (`preserve` ist nicht Prettiers Default für alle Fälle) lassen bzw. `always` | Würde die deutsche Prosa in `documentation/report/**` bei jedem Lauf auf `printWidth` neu umbrechen. Ein geänderter Halbsatz hätte dann Diffs über zwanzig Zeilen.                                                                                                            |
| Markdown ganz aus Prettiers Zuständigkeit nehmen                                                      | Kap. 7.4 fordert Formatierung für JS/JSON/Markdown; mit `proseWrap: preserve` ist die Prosa geschützt, und die Normalisierung von Tabellen bleibt ein einmaliger Aufwand.                                                                                                     |

**Konsequenz:** Ein Formatierungslauf deckt Code und Dokumentation ab. Preis: Die
Scripts brauchen `--ignore-path ../.prettierignore`, weil Prettier die Ignore-Datei
relativ zum Arbeitsverzeichnis sucht, nicht relativ zum Zielpfad. Die einmalige
Normalisierung des Bestands (Tabellen-Pipes, `*kursiv*` → `_kursiv_`) liegt in einem
eigenen `style:`-Commit, damit der Tooling-Commit lesbar bleibt.

→ Kap. 7

### 2026-07-29 — Diagramme als Mermaid inline

**Gewählt:** Mermaid-Blöcke inline in den Kapiteldateien, gerendert per
`@mermaid-js/mermaid-cli` nach `rendered/*.svg`.

**Verworfen:**

| Alternative  | Grund der Ablehnung                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------ |
| PlantUML     | Bessere arc42-Ausgabe, braucht aber Java oder einen Server — zu schwer für vier Diagramme.       |
| draw.io      | Nicht diffbar, nicht versionierbar, und widerspricht dem Ziel, ohne Zeichenwerkzeug auszukommen. |
| ASCII-Kästen | Kostenlos und diffbar, liest sich in einem bewerteten Bericht aber amateurhaft.                  |

**Konsequenz:** Diagramme sind diffbar und überleben inkrementelle Änderungen (ein
neues Modul = eine neue Zeile). Bekannte Einschränkung: Mermaid lässt sich nicht
direkt in Word einfügen, der Render-Schritt ist zwingend, und `mmdc` zieht
Puppeteer/Chromium (~150 MB). Fallback bei Proxy-Problemen: mermaid.live → SVG
exportieren → in Word einfügen, bei vier Diagrammen akzeptabel.

→ Kap. 4, 7

### 2026-07-29 — Coverage getrennt je Sprache, ohne Schwellwert-Gate

**Gewählt:** Zwei Messungen, zwei Zahlen, nebeneinander berichtet:
`@vitest/coverage-v8` für das Frontend, `cargo llvm-cov --lib` für die Engine.
`all: true`, damit ungetestete Module mitzählen. Kein `exclude` für `index.js` und
`ui/frameTimeGraph.js`, die beiden Dateien, die die Zahl am stärksten drücken.
Zunächst keine `thresholds`.

**Verworfen:**

| Alternative                                    | Grund der Ablehnung                                                                                                                                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Nur Frontend-Coverage (die ursprünglichen 2 h) | Die Engine ist das gewählte Fokus-Thema und enthält den Großteil der Logik. Eine Coverage-Aussage, die ausgerechnet diese Hälfte nicht misst, ist die schwächere Aussage — 1,5 h Mehraufwand dagegen billig. |
| Eine gemeinsame Gesamtzahl                     | Sie würde die beiden Hälften verrechnen und damit genau die Information zerstören, die interessant ist: Welche Sprachseite ist getestet und welche nicht.                                                    |
| DOM-Module per `exclude` ausblenden            | Hebt die Zahl, ohne einen Test zu schreiben. Genau die Politur, gegen die die Musterdokumentation mit ihrer begründet niedrigen Zahl argumentiert.                                                           |
| Schwellwerte sofort setzen                     | Eine Untergrenze über dem Ist-Stand macht jeden CI-Lauf (T-05) rot, ohne etwas Neues zu sagen. Sinnvoll erst nach T-07, dann auf dem erreichten Niveau minus Reserve.                                        |

**Konsequenz:** Die Ausgangsmessung ist unangenehm und genau deshalb brauchbar —
Frontend 10,4 % Statements, Engine 86,7 % Lines. Vor allem lokalisiert sie die Lücke
präzise an der Sprachgrenze: Die reine Simulation liegt bei 96–100 %,
`wasm_bridge/mod.rs` bei 47 % und `wasm_bridge/response.rs` bei **0 %**. Das ist kein
Zufall, sondern strukturell: Die Getter in `response.rs` liefern
`js_sys::Float32Array`/`Uint32Array` und brauchen eine JS-Laufzeit, sind per
`cargo test` also prinzipiell unerreichbar. Damit hat die Messung die Begründung für
T-07b gleich mitgeliefert, statt sie behaupten zu müssen.

→ Kap. 8, 9

### 2026-07-29 — `wasm_tests.rs` füllen statt die Absenz begründen

**Gewählt:** Der seit dem 25.05. leere Stub wird mit 14 `#[wasm_bindgen_test]`-Fällen
gefüllt, die den Vier-Buffer-Vertrag aus S-02 prüfen: Index-Ausrichtung aller vier
Buffer, `snapshot` bewegt die Welt nicht, `set_wave` ist idempotent, neue Boids halten
den Sicherheitsabstand, `resize` holt jeden Boid in die neuen Grenzen zurück, und der
Vorzeichen-Vertrag der Dash-Phase.

**Verworfen:** Die von `08-qualitaet.md` ausdrücklich angebotene zweite Variante, die
Absenz zu begründen. Sie wäre vertretbar gewesen, aber das Argument dagegen ist
stärker als das dafür: Der Buffer-Vertrag ist die zweite tragende Invariante des
Projekts und liegt im gewählten Fokus-Thema. Vor allem ist er die einzige Stelle, die
`cargo test` **prinzipiell** nicht erreichen kann — die Getter liefern
`js_sys::Float32Array` und brauchen eine JS-Laufzeit. Eine begründete Absenz hätte
also genau dort keine Prüfung gelassen, wo es keine Alternative zu dieser Testart gibt.

**Konsequenz — und der eigentliche Fund:** Auf dem Host-Target expandiert
`#[wasm_bindgen_test]` zu nichts. `cargo test` meldet für die Datei **0 Tests** und
bleibt grün. Genau deshalb ist der leere Stub zwei Monate lang niemandem aufgefallen:
Es gab kein Signal, das hätte fehlschlagen können. Zweite Folge derselben
Target-Trennung: `cargo llvm-cov` instrumentiert das Host-Target, die 14 neuen Tests
heben die Rust-Coverage also **nicht** — `wasm_bridge/response.rs` steht weiter bei
0 %, obwohl es jetzt vollständig geprüft ist. Beide Zahlen sind richtig und
widersprechen sich nur scheinbar; Kap. 8.1 muss das ausschreiben, sonst liest es sich
wie ein Fehler im Bericht.

→ Kap. 8, 9

### 2026-07-29 — E2E gegen den Produktionsbuild statt gegen den Dev-Server

**Gewählt:** Playwright startet `npm run build && vite preview` selbst und testet
gegen das ausgelieferte Artefakt. Fester Viewport 1280×720, ein Worker, nur Chromium.

**Verworfen:**

| Alternative               | Grund der Ablehnung                                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gegen `vite dev` testen   | Schneller und ohne Vorarbeit, prüft aber nie den Build. Der Dev-Server liefert das ganze Projektverzeichnis aus und verdeckt damit jede vergessene Kopie — genau der Fehler, der dabei gefunden wurde.  |
| Mehrere Browser           | Die Engine ist WASM hinter einem Canvas; ein zweiter Browser prüft überwiegend dessen eigene WASM- und Canvas-Implementierung, nicht diesen Code. Doppelte Laufzeit für sehr wenig zusätzliche Aussage. |
| Parallele Worker          | Mehrere Instanzen rechnen gleichzeitig eine O(n²)-Schleife mit 60 Schritten/s und nehmen sich die CPU weg. Zeitbezogene Zusicherungen würden aus fremden Gründen fehlschlagen.                          |
| Pixelvergleich des Canvas | Der Schwarm bewegt sich in jedem Frame: Eine Ungleichheits-Zusicherung ist immer erfüllt, ein Golden Image immer instabil. Die Zeichen-Arithmetik ist stattdessen als Unit-Test isoliert.               |
| Variabler Viewport        | Die Weltgröße ist `window.innerWidth/Height`. Ein wechselnder Viewport verändert Spawn-Abstände und damit die Simulation — Reproduzierbarkeit wäre verloren.                                            |

**Konsequenz:** Ein E2E-Lauf kostet einen vollen WASM- und Vite-Build, das
`webServer`-Timeout liegt entsprechend bei fünf Minuten. Dafür prüft die Stufe das,
was unter _Working Code_ bewertet wird. Was E2E hier als Einziges prüfen kann, ist das
Eigentum an der Tastatur (Leertaste in der Runde beim Dash, außerhalb beim Menü) —
alles Übrige an der Eingabe ist Arithmetik und liegt in Unit-Tests. Der Determinismus
der Engine zahlt sich hier nochmals aus: „stehenbleiben bis der Schwarm drei Leben
genommen hat" ist ein reproduzierbarer Testfall, kein meistens funktionierender.

→ Kap. 8, 10

### 2026-07-29 — Stabile HUD-IDs statt Positionsselektoren

**Gewählt:** Die vier HUD-Panels bekommen IDs, die benennen _was_ sie zeigen
(`hud-timer`, `hud-score` …), neben den Klassen, die sagen _wo_ sie sitzen.

**Verworfen:** Im Test auf `.hud-panel.bottom-left` selektieren. Das hätte ohne
Quelländerung funktioniert, aber die Tests an das Layout gekoppelt: Ein Umsortieren
der Panels — eine rein visuelle Änderung — hätte die Testsuite gebrochen und den
Eindruck erzeugt, die Funktion sei kaputt.

**Konsequenz:** Eine Zeile Produktionscode für die Testbarkeit. Vertretbar, weil eine
ID am Anzeigeelement auch ohne Tests keine Fremdkörper ist. Die Grenze, die dabei
bewusst nicht überschritten wurde: Kein Test-Hook, der internen Spielzustand nach
`window` exportiert. Damit wäre die Prüfung der Spielerposition leicht geworden — um
den Preis von Produktionscode, der nur für Tests existiert.

→ Kap. 3, 8

## Herausforderungen & Lessons Learned

- **2026-07-29 — Das eigene Prompt-Logging war lückenhaft.** Für den 29.07. war
  _ein_ Prompt geloggt, obwohl der Tag drei Commits inklusive einer 365-zeiligen
  Spezifikation hervorbrachte; insgesamt 22 Prompts auf 27 Commits. Die Ursache ist
  strukturell: `CHANGELOG.md` verlangt einen Append an _eine_ Datei zur Commit-Zeit
  und wurde durchgehend gepflegt, das Prompt-Log verlangt einen Append _vor_ der
  Antwort und schlief ein. Konsequenz für das Journal-Ritual: an die funktionierende
  Gewohnheit andocken (Commit-Zeit, eine Datei, ein Append) und mit
  `npm run docs:check` beratend — nicht blockierend — prüfen. Blockierende Git-Hooks
  werden um 2 Uhr nachts mit `--no-verify` umgangen. Rückwirkend werden **keine**
  Prompts erfunden; die Lücke wird in Kapitel 12 offengelegt.
  → Kap. 6, 10, 12

- **2026-07-29 — `eslint --fix` verschlechterte die Kommentare, bevor es sie
  verbesserte.** Die Nachrüstung war mit ~1,5–2 h geplant und lag bei ~2,5 h. Ursache
  war nicht der Umfang, sondern eine falsche Regel-Reichweite: Nur
  `jsdoc/require-jsdoc` war auf die exportierte API eingeschränkt, die Inhaltsregeln
  des `flat/recommended`-Sets liefen auf Standard. Die prüfen aber **jede** Funktion,
  die schon irgendeinen JSDoc-Block trägt — und im Projekt tragen auch private
  Helfer einzeilige `/** … */`-Prosa-Kommentare. `--fix` hängte dort leere
  `@param color`-/`@param amount`-Zeilen an, also genau die inhaltsleere
  Tag-Wiederholung, die die Kommentar-Konvention verbietet. Rund 90 solcher
  Warnungen und ein Dutzend bereits geschriebene Zeilen mussten zurückgenommen
  werden. Lehre, die über diesen Fall hinausgeht: Bei `eslint-plugin-jsdoc` ist die
  Reichweite **pro Regel** einzustellen, nicht einmal fürs Plugin — die
  gemeinsame Kontext-Liste ist deshalb keine Eleganz, sondern die Korrektur eines
  echten Fehlers. Zweite Lehre: `--fix` auf einer frisch eingeführten Regel erst auf
  wenigen Dateien gegenprüfen, bevor man es über die Codebasis laufen lässt.
  → Kap. 7, 8, 10

- **2026-07-29 — Der Production-Build lieferte seit Monaten keine Übersetzungen
  aus.** Beim Vorbereiten der E2E-Tests fiel auf, dass `frontend/dist/` kein
  `locales/`-Verzeichnis enthält. `ui/i18n.js` holt `./locales/en.json` per `fetch`
  zur Laufzeit, die Datei taucht damit nie im Modulgraph auf — und Vite kopiert nur,
  was es entweder importiert sieht oder unter `public/` findet. Im gebauten Spiel
  schlug der `fetch` also fehl, `t()` fiel auf seinen Fallback zurück und **jedes**
  Label stand als Rohschlüssel auf dem Bildschirm (`menu.play` statt „Play"). Der
  Dev-Server lieferte die Datei dagegen aus, weil er das ganze Projektverzeichnis
  bedient — deshalb war der Fehler in monatelanger Entwicklung nie sichtbar. Behebung:
  `frontend/locales/` → `frontend/public/locales/`, zehn Minuten.
  Der eigentliche Punkt ist nicht der Fehler, sondern **wer ihn findet**: 51
  Rust-Tests und 92 Frontend-Tests konnten ihn strukturell nicht finden, weil keiner
  von ihnen ein Build-Artefakt anfasst. Die Entscheidung, E2E gegen `vite preview`
  statt gegen den Dev-Server laufen zu lassen, hat sich damit bezahlt, bevor der erste
  E2E-Test geschrieben war. Das ist zugleich das beste Argument für die Existenz der
  E2E-Stufe im Bericht — belegt statt behauptet.
  → Kap. 5, 8, 10

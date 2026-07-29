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
zu erwarten. Maßnahmen-IDs (`S-01`…`S-06`, `T-01`…`T-07`, `D-01`) kommen aus
[docs/specs-overview.md](../../docs/specs-overview.md) und sind das gemeinsame
Vokabular von Planung, Journal und Kapitel 10.

Warum explizit und nicht aus `git log` rekonstruiert: die bisherigen 27 Commits
fallen auf vier Kalendertage, Commit-Zeitstempel komprimieren also Arbeitsschübe und
sagen nichts über Lese-, Denk- und Debugging-Zeit. Mit einem Agenten, der tippt, ist
die Zeit zwischen Commits ein aktiv irreführender Aufwandsindikator. Verworfene
Ansätze hinterlassen überhaupt keinen Commit — und das sind genau die Stunden, nach
denen der Kapazitätsplan fragt. `git log` dient als Gegenprobe, nicht als Quelle.

| Datum      |   h | Spec/Maßnahme | Was                                                                                                                                                                                                      |
| ---------- | --: | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-29 | 2,0 | D-01          | Anforderungskatalog und Musterdokumentation ausgewertet, Kapitelstruktur und begleitendes Doku-Ritual entworfen, Berichtsgerüst angelegt                                                                 |
| 2026-07-29 | 3,5 | T-01          | ESLint-Flat-Config mit JSDoc-Enforcement und Prettier eingerichtet, JSDoc in acht Dateien nachgerüstet (Schwerpunkt `playerController.js`, `engine-bridge.js`), Kap. 7.1/7.3/7.4/7.5 und 8.4 geschrieben |
| 2026-07-29 | 1,5 | T-03          | Coverage für beide Sprachen eingerichtet (`@vitest/coverage-v8`, `cargo llvm-cov`), Ausgangsmessung genommen; T-07 als neue Maßnahme aufgenommen und Kapazitätsplan fortgeschrieben                      |

## Entscheidungen

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

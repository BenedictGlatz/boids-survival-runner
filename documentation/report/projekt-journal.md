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

| Datum      |   h | Spec/Maßnahme | Was                                                                                                                                                                                                                                                                                                                                          |
| ---------- | --: | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-29 | 2,0 | D-01          | Anforderungskatalog und Musterdokumentation ausgewertet, Kapitelstruktur und begleitendes Doku-Ritual entworfen, Berichtsgerüst angelegt                                                                                                                                                                                                     |
| 2026-07-29 | 3,5 | T-01          | ESLint-Flat-Config mit JSDoc-Enforcement und Prettier eingerichtet, JSDoc in acht Dateien nachgerüstet (Schwerpunkt `playerController.js`, `engine-bridge.js`), Kap. 7.1/7.3/7.4/7.5 und 8.4 geschrieben                                                                                                                                     |
| 2026-07-29 | 1,5 | T-03          | Coverage für beide Sprachen eingerichtet (`@vitest/coverage-v8`, `cargo llvm-cov`), Ausgangsmessung genommen; T-07 als neue Maßnahme aufgenommen und Kapazitätsplan fortgeschrieben                                                                                                                                                          |
| 2026-07-29 | 3,0 | T-07          | Unit-Tests für `frameScheduler`, `gameState`, `controls` und `playerController` geschrieben; `engine/tests/wasm_tests.rs` vom Stub zum Buffer-Vertragstest ausgebaut                                                                                                                                                                         |
| 2026-07-29 | 4,0 | T-04          | Playwright gegen den Preview-Build eingerichtet, fünf Flows geschrieben, dabei den fehlenden Locale-Umzug gefunden und behoben; Kap. 8.1/8.2 ausgeschrieben, 7.1 und 9.2b nachgezogen                                                                                                                                                        |
| 2026-07-30 | 1,5 | D-01          | Musterdokumentation Seite für Seite als `documentation/muster-referenz.md` erfasst — Kapitelaufbau, Stilanalyse, Kapitel-Mapping Muster → Bericht, Arbeitsregeln; aus `CLAUDE.md` und Kap. 00 verlinkt                                                                                                                                       |
| 2026-07-30 | 1,0 | S-07          | Runden- und Leben-Buchführung aus `index.js` nach `round/roundData.js` ausgelagert, weil `index.js` an der 400-Zeilen-Grenze stand, und unter Vitest abgedeckt; jede Schadensquelle geht jetzt durch ein gemeinsames `registerHit`                                                                                                           |
| 2026-07-30 | 1,5 | S-07          | Temporäre Hindernisse als neuen Spec S-07 spezifiziert (`docs/spec-s07-hindernisse.md`) — Kapselgeometrie, Sackgassen-Invariante mit Beweisskizze, Dichte-Rampe, Engine/Frontend-Grenze; Schätzung und Gesamtbudget in `specs-overview.md` neu gerechnet                                                                                     |
| 2026-07-30 | 6,5 | S-07          | Temporäre Hindernisse umgesetzt: Kapselgeometrie und Streckenabstände, deterministischer Spawn mit Korridor-Invariante, Dichte-Rampe, Boid-Ausweichen, Spielerkollision samt neuer `tick`-Signatur und fünftem Buffer, Rendering mit Ein-/Ausblenden; Spec nach zwei Korrekturen an der Umsetzung nachgezogen                                |
| 2026-07-30 | 0,5 | S-05          | Dash-Reichweite um ~30 % erhöht (`PLAYER_DASH_SPEED_DECAY` 3000 → 2300), Rechenweg im JSDoc korrigiert und einen Test ergänzt, der die Distanz statt nur die Spitzengeschwindigkeit festnagelt                                                                                                                                               |
| 2026-07-30 | 1,5 | S-05          | Gruppendash umgesetzt: `select_dash_candidate` → `select_dash_group`, Gruppenbildung um einen Anführer über Tier und Abstand, Dash-Frequenz und Slot-Grenzen neu getunt, Spieler-Dash-Reichweite ein zweites Mal um 50 % erhöht; sieben neue Zusicherungen, Spec S-05a nachgezogen                                                           |
| 2026-07-30 | 1,5 | S-07          | Feststecken in Hindernissen behoben: blockierter Spieler wird jetzt mit Abstand vor die Oberfläche gesetzt statt darauf, Rückstoß über die Normalkomponente, rotes Aufleuchten des getroffenen Hindernisses als siebter Buffer-Wert; `wasm_tests.rs` wegen der 400-Zeilen-Grenze entlang des Hindernis-Vertrags geteilt                      |
| 2026-07-30 | 1,5 | S-03          | Designsystem-Handoff (`docs/design_system/`) gegen den Code gelesen und in sieben Schritte geplant, dabei fünf Stellen gefunden, an denen das Handoff auf den Bestand nicht passt; Tokens eingebaut und `main.css` literalfrei gemacht                                                                                                       |
| 2026-07-30 | 0,5 | S-03          | Typo-Paar eingebaut: variable Latin-Subsets von Space Grotesk und JetBrains Mono lokal unter `public/fonts/` samt Lizenzen, Canvas-Schriften für Dash-Label und Countdown mitgezogen                                                                                                                                                         |
| 2026-07-30 | 0,5 | S-03          | Arena auf die neue Palette gezogen: tieferer Hintergrund, zweistufiges Grid über eine gemeinsame `strokeLattice`-Hilfsfunktion, Farbliterale im Renderer benannt, Amber-Kollision der vierten Boid-Stufe aufgelöst                                                                                                                           |
| 2026-07-30 | 1,0 | S-07          | Hindernis-Optik „Hazard Tape" eingebaut (Schraffur, Kern, Gefahrenkante, Spawn-Ring, Amber beim Ablaufen, weiße Trefferkante) und die Node-Untestbarkeit des Handoff-Moduls behoben; Unit-Tests von 13 auf 17 Zusicherungen umgeschrieben, Pixel-Sonde des E2E-Tests auf die neue Körperfarbe gezogen und gegen den laufenden Build gemessen |
| 2026-07-30 | 1,0 | S-03          | HUD von vier gerahmten Panels auf Kicker+Wert umgebaut, Wellen-Schiene unter dem Timer aus dem vorhandenen Timerwert, Dash-Bar vom Canvas ins DOM verlegt; zwei E2E-Zusicherungen auf die getrennten Label-/Wert-Elemente gezogen, gesamte Playwright-Suite gegen den Preview-Build grün                                                     |
| 2026-07-30 | 2,5 | S-03          | Hauptmenü als „Command Deck" neu gebaut: `menu.js` als Orchestrator plus `menuDeck.js`, `menuPanels.js` und `menuNavigation.js`, Untermenüs statt `<details>`, Tastaturnavigation mit Pfeilen/Escape und Bewegungstasten nur noch während einer Runde; vier E2E-Tests umgeschrieben, drei neue für die Tastatur                              |

## Entscheidungen

### 2026-07-30 — Eine Optionsgruppe existiert immer nur an einer Stelle

**Gewählt:** Das Command Deck hat eine Ansicht pro Menüpunkt, und jede Ansicht rendert das
gesamte Overlay neu. Ein Untermenü holt seine Optionsgruppe in die linke Spalte und
**nimmt sie dabei aus dem rechten Panel-Stack heraus** (`_renderAside` zeigt, was die linke
Spalte nicht zeigt). Damit steht jede Gruppen-`id` zu jedem Zeitpunkt genau einmal im
Dokument — `bindOptionGroup` findet seine Gruppe über `getElementById`, und zwei Kopien
hätten eine davon stumm gelassen. Eine E2E-Zusicherung nagelt das fest.

**Verworfen:**

| Alternative                                                        | Grund der Ablehnung                                                                                                                                                                                                 |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gruppe doppelt rendern und `bindOptionGroup` auf Klassen umstellen | Zwei sichtbare Kopien derselben Einstellung müssten synchron gehalten werden, inklusive `aria-pressed`. Der Zustand liegt in `index.js`, nicht im DOM — zwei Ansichten desselben Zustands wären zwei Fehlerquellen. |
| Ansichten vorrendern und per CSS ein-/ausblenden                   | Alle `id`s existierten gleichzeitig, und versteckte Bedienelemente bleiben ohne `inert` per Tab erreichbar. Das Neurendern kostet nichts: es passiert bei einem Tastendruck, nicht pro Frame.                       |
| Untermenüs als Modal über dem Deck                                 | Ein zweiter Screen-Typ mit eigener Fokusfalle, für dieselbe Information. Das Deck hat freie Fläche links, sobald der Titel weicht.                                                                                  |

**Konsequenz:** Nach jedem Rendern werden Zeilen und Gruppen neu gebunden; `_bindGroup`
prüft deshalb, ob die Gruppe in dieser Ansicht überhaupt existiert. Die Tastaturnavigation
hängt dagegen **am Fenster** und nicht am Overlay: Beim Ansichtswechsel verschwindet das
fokussierte Element, der Fokus fällt für einen Moment auf `<body>`, und ein Listener am
Overlay hätte danach kein Escape mehr gesehen. Genau dieser Fehler trat beim ersten
Durchlauf auf. Sichtbarkeit ist die Bedingung, unter der der Listener zugreift.

→ Kap. 5, 7

### 2026-07-30 — Bewegungstasten gehören nur einer laufenden Runde

**Gewählt:** `InputManager` schluckt WASD und die Pfeiltasten nur noch bei
`_gameplayActive`. Vorher tat er es unbedingt und auf Fensterebene — deshalb stand in
`optionGroup.js` der Kommentar, dass eine `radiogroup` im Menü kaputt wäre. Die Menüliste
verspricht im Footer „↑↓ navigate"; das Versprechen ist nur haltbar, wenn die Tasten dort
nicht abgefangen werden. `setGameplayActive(false)` leert zusätzlich die gedrückten Tasten.

**Verworfen:**

| Alternative                                          | Grund der Ablehnung                                                                                                                                                                                        |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Menü-Navigation vor dem InputManager registrieren    | Reihenfolge von Listenern als Architektur: Beide würden dieselbe Taste sehen, und wer zuerst registriert wurde, entscheidet. Beim nächsten Umbau der Bootstrap-Reihenfolge wäre es stillschweigend kaputt. |
| Nur die Pfeiltasten freigeben, WASD weiter schlucken | WASD im Menü zu schlucken hat keinen Nutzen, den die Freigabe nicht auch hätte, und die Asymmetrie müsste man erklären. Der Spielzustand ist die richtige Grenze, nicht die Tastenmenge.                   |
| `keyup` ebenfalls an die Runde binden                | Genau der Bug, der dabei entsteht: Eine beim Rundenende gehaltene Taste würde nie freigegeben und in der nächsten Runde als gedrückt gelten. `keyup` räumt deshalb immer auf.                              |

**Konsequenz:** Der `blur`-Pfad und `setGameplayActive(false)` machen jetzt dasselbe, und
das ist beabsichtigt: beides sind Momente, in denen niemand mehr steuert.

→ Kap. 5, 7

### 2026-07-30 — Die Dash-Bar wandert vom Canvas ins DOM

**Gewählt:** `drawDashCooldown` verlässt `canvasRenderer.js`; die Bar ist jetzt ein
`div.dash-bar` mit Füllung und Textzeile im HUD. Der Grund ist die Textzeile: Sie stand pro
gezeichnetem Frame neu im Canvas, also bis zu 120-mal pro Sekunde für einen String, der sich
zweimal pro Runde ändert. Im DOM rastert der Browser sie einmal und schreibt danach nur noch
`style.width` der Füllung. Der Zustand „bereit" trägt zusätzlich den Cyan-Glow — im Canvas
wäre das ein `shadowBlur` auf demselben heißen Pfad, im DOM ist es eine Klasse.

**Verworfen:**

| Alternative                                          | Grund der Ablehnung                                                                                                                                                                                                           |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Im Canvas lassen, nur die Farben tauschen            | Billigster Diff, behält aber die Neurasterung des Labels pro Frame und den Glow auf dem heißen Pfad. Das Designsystem nennt das DOM ausdrücklich als die vorzuziehende Variante, und der Grund ist messbar, nicht ästhetisch. |
| Nur das Label ins DOM, die Bar im Canvas             | Zwei Medien für ein Element, dessen Farbe und Text denselben Zustand ausdrücken. Sie würden bei einer Änderung auseinanderlaufen.                                                                                             |
| Den Dash-Zustand direkt aus `roundData` im HUD lesen | Das HUD hätte damit eine zweite Datenquelle neben dem Frame. `renderState` wird jetzt einmal pro Frame gebaut und an Renderer **und** HUD gegeben, damit beide innerhalb eines Frames dasselbe sagen.                         |

**Konsequenz:** `renderCurrentState` baut `renderState` einmal statt zweimal — die
Verzweigung „Runde läuft / Countdown" liegt jetzt in einem Ausdruck, und `hud.update`
bekommt denselben Wert wie `renderer.drawFrame`. Die Lebensanzeige bleibt im Canvas: Sie
klebt am Spieler, nicht am Bildschirmrand, und müsste im DOM pro Frame positioniert werden.

→ Kap. 5, 7

### 2026-07-30 — Die Schraffur fällt unter Node auf die Körperfarbe zurück

**Gewählt:** `hatch(ctx)` prüft `typeof document === 'undefined'` und ob der Kontext
`createPattern` überhaupt anbietet; fehlt eines von beidem, liefert die Funktion die
einfarbige Körperfarbe zurück. Das Handoff-Modul selbst hätte die Unit-Suite zerlegt: Sie
läuft im `node`-Environment und gibt einen aufzeichnenden Stub statt eines echten Kontexts
herein, es gibt dort also weder ein `document` für das Muster-Tile noch ein
`createPattern`. Der Rückfall macht die eine nicht prüfbare Eigenschaft (das Muster)
unsichtbar und lässt alles Prüfbare (Geometrie, Phasenfarben, Deckkraft) messbar.

**Verworfen:**

| Alternative                                     | Grund der Ablehnung                                                                                                                                                                                             |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vitest für diese Datei auf `jsdom` umstellen    | Ein Environment-Wechsel für eine Datei, und `jsdom` implementiert `canvas` ohnehin nicht ohne die native `canvas`-Abhängigkeit — es wäre eine neue Build-Abhängigkeit für ein Muster, das man nur ansehen kann. |
| `createPattern` im Stub nachbauen               | Der Stub müsste ein Objekt liefern, über das keine Zusicherung möglich ist. Der Test würde die Existenz einer Attrappe prüfen, nicht das Verhalten des Moduls.                                                  |
| Den Schraffur-Stroke in ein eigenes Modul lösen | Trennt zwei Striche derselben Kapsel auf zwei Dateien, obwohl sie dieselbe Geometrie und dieselbe Deckkraft teilen. Die Grenze läge dann an der Testbarkeit statt an der Zuständigkeit.                         |

**Konsequenz:** Der Stub zeichnet jetzt zusätzlich `globalAlpha` mit auf, weil die Deckkraft
des Körpers seit dem Muster nicht mehr im Farbstring steckt — ein Muster trägt keine
Deckkraft, also übernimmt `globalAlpha` das Ein- und Ausblenden für genau diesen Stroke.
Eine neue Zusicherung hält fest, dass er danach wieder auf 1 steht: Boids und Spieler
werden direkt nach dieser Schicht gezeichnet und wären sonst mitgedimmt. Die Pixel-Sonde
des E2E-Tests prüft weiter, ob überhaupt eine große Slate-Fläche existiert; ihre Zielfarbe
ist auf `#2A313F` gezogen und am laufenden Build gemessen (rund 1950 Pixel gegen eine
Schwelle von 400), damit die Schwelle nicht stillschweigend gerissen wird.

→ Kap. 5, 8

### 2026-07-30 — Die Schriften liegen im Repository, nicht auf einem Font-CDN

**Gewählt:** Space Grotesk und JetBrains Mono liegen als variable Latin-Subsets in
`frontend/public/fonts/` (zusammen 54 kB), eingebunden über zwei `@font-face`-Regeln am Kopf
von `tokens.css`. Ein variables File pro Familie deckt die Gewichte 400 bis 700 ab, es
braucht also keine sieben Einzeldateien. Die Lizenztexte (SIL OFL 1.1) liegen daneben.

**Verworfen:**

| Alternative                                        | Grund der Ablehnung                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<link>` auf `fonts.googleapis.com` (Handoff-Weg)  | Widerspricht der Anforderung „installationslos und serverlos": ohne Netz fällt die gesamte Typografie auf eine System-Serifenlose zurück, und das Menü ist das Erste, was gezeichnet wird. Zusätzlich hätte der Boot-E2E-Test, der fehlgeschlagene Requests sammelt, offline rot geleuchtet.                  |
| Alle sieben statischen Gewichte einzeln ausliefern | Sieben Requests und ~150 kB für dasselbe Ergebnis. Die variablen Dateien liefern jeden Wert zwischen 400 und 700, und das System nutzt genau vier davon.                                                                                                                                                      |
| Zusätzlich das Latin-Ext-Subset mitnehmen          | Die Oberfläche ist einsprachig englisch; kein Zeichen daraus kommt vor. Die im UI verwendeten Pfeile `↑↓` liegen im Latin-Subset, `→` und `←` in keinem der Google-Subsets — sie kommen deshalb aus der System-Schrift, was bei einem einzelnen Glyph als Marker nicht auffällt und keine Datei rechtfertigt. |

**Konsequenz:** Die Font-URLs sind wurzelabsolut (`/fonts/...`), weil so eine Datei unter
`public/` adressiert wird. Wird das Spiel je unter einem Unterpfad ausgeliefert (T-06,
GitHub Pages), müssen genau diese zwei URLs den Base-Präfix bekommen — Vite schreibt
absolute URLs innerhalb von CSS nicht um. Der Kommentar an der Regel sagt das.

→ Kap. 5, 7

### 2026-07-30 — Die Handoff-CSS wird in fünf Stylesheets nach Zuständigkeit geteilt

**Gewählt:** Die 793 Zeilen der `tokens.css` aus dem Designsystem-Handoff wandern nicht als
eine Datei ins Projekt, sondern als `tokens.css` (nur die Variablen), `components.css`
(wiederverwendbare Bausteine), `menu.css`, `hud.css` und das bestehende `main.css`
(Reset, Vollbildschichten, Positionsklassen). Die Reihenfolge im `<head>` ist tragend:
`tokens` zuerst, weil alles andere seine Variablen liest, `main` zuletzt, damit die
Positionsklassen über jeder Komponentenregel liegen. Die 400-Zeilen-Regel aus `CLAUDE.md`
nennt Rust, JS und Tests ausdrücklich, nicht CSS — sie wird hier trotzdem angewandt, weil
ihr Zweck (eine Datei, ein Thema) für ein Stylesheet genauso gilt.

**Verworfen:**

| Alternative                                | Grund der Ablehnung                                                                                                                                                                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Die Handoff-Datei unverändert übernehmen   | Sie behauptet in ihrem eigenen README, alle Dateien blieben unter 400 Zeilen, und ist mit 793 die längste Quelldatei des Projekts geworden. Eine Ausnahme genau dort, wo die Regel am leichtesten einzuhalten ist, hätte sie für alle anderen Dateien entwertet. |
| Alles in `main.css` einarbeiten            | Dann wäre der Bestand nicht mehr vom Neuen zu unterscheiden. Der Zwischenzustand ist explizit gewollt: Die alten `.menu-panel`-Regeln stehen bis zum Menü-Umbau weiter in `main.css`, sichtbar als Übergangsblock, und verschwinden in einem einzigen Commit.    |
| Ein `@import` in `main.css` statt `<link>` | Ein `@import` blockiert das Rendering, bis die importierte Datei geladen ist, und serialisiert damit fünf Requests, die der Browser über `<link>` parallel holt. Aus demselben Grund liegen später auch die `@font-face`-Regeln als Datei, nicht als Import.     |

**Konsequenz:** Wer eine Farbe ändert, ändert sie in `tokens.css` und nirgends sonst; ein
Literal in einer der anderen vier Dateien ist ab jetzt ein Fehler, den man beim Lesen sieht.
Zwei Werte bleiben bewusst doppelt: `--grid-line` und `--grid-line-major` stehen zusätzlich in
`canvasRenderer.js`, weil ein Canvas keine Custom Property lesen kann. Beide Stellen tragen
einen Kommentar, der auf die andere zeigt — dasselbe Muster wie bei `INITIAL_BOID_COUNT`.

→ Kap. 5, 7

### 2026-07-30 — Der Spieler wird vor die Oberfläche gesetzt, nicht auf sie

**Gewählt:** Ein blockierter Spieler landet `PLAYER_OBSTACLE_KNOCKBACK_DISTANCE` (8 px)
**außerhalb** der um seinen Radius aufgeblasenen Kapsel, und zwar auf der Seite, von der er
kam. Der Abstand ist damit kein Kosmetikwert, sondern die Invariante des Fixes: Solange der
Spieler nach einer Kollision echten Abstand hat, kann der Test des nächsten Schritts eine
Bewegung vom Hindernis weg nicht mehr als Berührung lesen. Derselbe Schub liefert
gleichzeitig den vom Gameplay gewünschten Rückstoß, das Frontend dreht dazu nur noch die
Normalkomponente der Geschwindigkeit zu 35 % um.

**Verworfen:**

| Alternative                                                                | Grund der Ablehnung                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Epsilon im Kollisionstest (`swept_distance >= radius + player_radius - ε`) | Behandelt das Symptom an der falschen Stelle: Der Test würde toleranter, der Spieler stünde weiter exakt auf der Oberfläche, und die richtige Größe von ε hinge von der Schrittweite ab. Ein sichtbarer Abstand ist prüfbar, eine Toleranz im Vergleich ist nur unauffälliger. |
| Erste Kontaktstelle entlang der Bewegung analytisch bestimmen (Ray/Kapsel) | Die exakte Lösung, und für dieses Spiel die falsche: quadratische Gleichung plus Fallunterscheidung für die beiden Endkappen, in einem Projekt, dessen erste Regel Lesbarkeit für Rust-Anfänger ist. Der Gewinn wäre ein um wenige Pixel genauerer Stopp-Punkt.                |
| Kollision nur über den Endpunkt prüfen, dafür ohne Sonderfall              | Genau der Punkttest, gegen den der Streckentest existiert: Ein Dash überspringt inzwischen deutlich mehr als die dünnsten Hindernisse breit sind und wäre wieder durchgetunnelt.                                                                                               |

**Konsequenz:** Die Fallunterscheidung „endete innen / hat durchtunnelt" in
`resolve_player_movement` entfällt — beide Fälle werden gleich behandelt, weil die Seite der
_Herkunft_ die Richtung bestimmt und nicht die Lage des Endpunkts. Die Funktion ist damit
kürzer als vor dem Fix. Der Wert muss deutlich unter `MINIMUM_CORRIDOR_WIDTH` (80 px)
bleiben, sonst könnte der Schub aus einem Hindernis in das nächste führen; bei 8 px gegen 80
ist der Abstand zu dieser Grenze so groß, dass er keine eigene Zusicherung braucht.

→ Kap. 4, 5

### 2026-07-30 — Das rote Aufleuchten reist als Zahl im Hindernis-Buffer

**Gewählt:** `Obstacle` bekommt ein `hit_flash_steps`, das bei einem Treffer auf
`OBSTACLE_HIT_FLASH_STEPS` gesetzt und im normalen Altern mit heruntergezählt wird; der
Buffer wächst von sechs auf sieben Werte je Hindernis. `resolve_player_movement` bleibt
lesend und meldet nur den **Index** des getroffenen Hindernisses zurück, markiert wird im
`wasm_bridge`.

**Verworfen:**

| Alternative                                                      | Grund der Ablehnung                                                                                                                                                                                                          |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flash-Zustand im Frontend halten (Trefferzeit + Position merken) | Das Frontend müsste Hindernisse über Frames hinweg identifizieren, obwohl der Buffer keine IDs trägt und die Reihenfolge sich beim Ablaufen verschiebt. Es wäre eine Zuordnung, die die Engine ohne Zusatzaufwand schon hat. |
| Eigener Buffer nur für den Flash                                 | Ein sechster Buffer für eine Zahl je Hindernis, gegen die Regel „Schnittstelle minimal halten". `life_fraction` und `dash_phases` zeigen das Muster: ein Renderzustand, eine Zahl, im vorhandenen Buffer.                    |
| `&mut [Obstacle]` an die Kollisionsauflösung übergeben           | Die Funktion ist ein Geometrietest und ihre Tests leben davon, dass sie nichts verändert. Ein `Option<usize>` im Rückgabewert kostet nichts und lässt das Markieren dort, wo die Feldverwaltung sowieso liegt.               |

**Konsequenz:** Die Markierung muss **vor** `ObstacleField::update` passieren, weil dort
abgelaufene Hindernisse aus dem `Vec` entfernt werden und der Index danach auf ein anderes
Hindernis zeigen würde. Ein wiederholter Treffer setzt den Zähler neu, damit ein am
Hindernis lehnender Spieler ein durchgehendes Leuchten sieht statt eines Flackerns.

→ Kap. 4, 5

### 2026-07-30 — Der Gruppendash entsteht aus einem Anführer, nicht aus einer eigenen Verbandslogik

**Gewählt:** Die Auswahl würfelt weiter genau **einen** Boid über die bestehende
Integer-Hash-Arithmetik. Dieser Boid ist der Anführer; ein zweiter, rein deterministischer
Durchlauf sammelt danach seine Nachbarn desselben Tiers innerhalb von
`DASH_GROUP_RADIUS` auf, bis `MAX_DASH_GROUP_SIZE` oder die freien Slots erschöpft sind.
Der Einzeldash ist damit der Randfall der Gruppe — die leere Nachbarschaft — und kein
zweiter Codepfad.

**Verworfen:**

| Alternative                                                        | Grund der Ablehnung                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clusteranalyse über den ganzen Schwarm, dann bestes Cluster wählen | O(n²) mit deutlich größerer Konstante pro Selektionsrunde, und die Determinismus-Zusicherung müsste für einen ganzen Algorithmus statt für eine Schleife gelten. Der Gewinn wäre eine Gruppenqualität, die der Spieler bei vier Boids nicht unterscheiden kann. |
| Gruppen-Zustand auf dem Boid (`dash_group_id`)                     | Ein vierter Dash-Zustand neben `dash_state`, `dash_state_steps_remaining` und den Properties, den niemand liest: nach `begin_dash_charge` verhält sich jedes Gruppenmitglied wieder für sich. Zustand, der nichts entscheidet, kann nur inkonsistent werden.    |
| Mehrere unabhängige Würfe pro Selektionsrunde statt einer Gruppe   | Ergibt gleichzeitige, aber räumlich verstreute Dashes — mehr Druck ohne den lesbaren Stoß, um den es geht. Es wäre nur die Frequenzerhöhung unter anderem Namen.                                                                                                |

**Konsequenz:** `select_dash_group` gibt einen `Vec<usize>` zurück statt eines
`Option<usize>`. Auf Schritten ohne Selektionsrunde ist das ein `Vec::new()`, das nicht
allokiert; allokiert wird höchstens alle 24 Schritte. Der Tier-Vergleich ist dabei nicht
nur Optik: Boids eines Tiers teilen ihre `charge_steps`, die Gruppe pulst also synchron
und startet im selben Simulationsschritt — mit gemischten Tiers wäre der „Stoß" ein
Nachtröpfeln. Zweite Konsequenz: Die Slot-Grenze musste von 3 auf 8 steigen, sonst hätte
eine einzige Gruppe jeden weiteren Dash für fünf Sekunden blockiert; die Frequenzerhöhung
(40 → 24 Schritte) fällt damit in dieselbe Entscheidung, weil beide Zahlen nur zusammen
ein sinnvolles Bild ergeben.

→ Kap. 4, 5

### 2026-07-30 — Ein Hindernis ist eine Kapsel, kein Aufzählungstyp mit zwei Formen

**Gewählt:** `Obstacle { spine_start, spine_end, radius }` — eine Mittellinie, überstrichen
von einem Kreis. Ein kreisförmiges Hindernis ist die entartete Kapsel, deren Mittellinie
die Länge null hat. Beide geforderten Formen entstehen damit beim Spawn, nicht im
Typsystem.

**Verworfen:**

| Alternative                               | Grund der Ablehnung                                                                                                                                                                                                         |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enum ObstacleKind { Circle, Segment }`   | Zwei Distanzfunktionen, zwei Kollisionstests und zwei Zeichenpfade, die auseinanderlaufen können. Genau die Sorte Duplikat, bei der ein Fehler nur in einer der beiden Formen auftritt und deshalb lange unentdeckt bleibt. |
| Nur Kreise, Striche als Kette von Kreisen | Vielfache Kollisionsprüfungen pro Strich, und die Overlap-Regel zwischen Hindernissen wäre nicht mehr formulierbar, weil ein „Hindernis" dann kein einzelnes Objekt mehr ist.                                               |

**Konsequenz:** `closest_point_on_segment` liefert für eine Nulllängen-Strecke ihren
Startpunkt, womit der Kreisfall ohne Verzweigung aus derselben Formel fällt. Im Frontend
zeichnet ein runder Linienabschluss auf einer Nulllängen-Linie exakt einen Kreis, also
kommt der Renderbuffer ohne Formkennzeichen aus und das Frontend ohne Fallunterscheidung.
Preis: Ein einzelner Punkt auf der Mittellinie hat keine definierte Normale und braucht
eine Ersatzrichtung — dieselbe Krücke, die die Overlap-Relaxation schon benutzt.

→ Kap. 4, 5

### 2026-07-30 — Sackgassenfreiheit konstruktiv erzwingen statt zur Laufzeit prüfen

**Gewählt:** Ein Spawn-Kandidat wird nur angenommen, wenn er zu jedem bestehenden
Hindernis, zu jeder der vier Weltkanten und zum Spieler mindestens
`MINIMUM_CORRIDOR_WIDTH` Oberflächenabstand hält. Aufgeblasen um den Spielerradius ist
damit jedes Hindernis eine konvexe Insel echt im Inneren der Arena, die keine andere und
keine Wand berührt — und um eine solche Insel kann man immer herumlaufen. Ein Einschluss
bräuchte zwei sich berührende Hindernisse oder eines an einer Wand; beides ist
ausgeschlossen. Die Ungleichung, auf der das ruht, wird zur Übersetzungszeit geprüft
(`const _: () = assert!(...)`), nicht in einem Test.

**Verworfen:**

| Alternative                                        | Grund der Ablehnung                                                                                                                                                                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Erreichbarkeitssuche (Flood Fill) nach jedem Spawn | Kosten pro Spawn im Gitterraster der ganzen Arena, und die Aussage wäre nur so gut wie die Gitterauflösung. Vor allem aber wäre sie nicht mehr _beweisbar_, sondern nur noch gemessen — für einen Bericht die deutlich schwächere Aussage. |
| Hindernisse nur an festen Rasterplätzen zulassen   | Löst das Problem, nimmt aber die freie Platzierung und damit den Reiz. Außerdem verschiebt es die Invariante in eine Tabelle, in der man sie nicht mehr nachlesen kann.                                                                    |
| Den Spieler bei Einschluss einfach durchlassen     | Behebt das Symptom, hebelt aber die Kollision auf und ist im Bericht nicht als Eigenschaft formulierbar.                                                                                                                                   |

**Konsequenz:** Die Dichte ist ein **Ziel**, die Invariante ist **hart**. Findet der
Spawn in seinen Versuchen keinen zulässigen Platz, erscheint in dieser Runde kein
Hindernis — bei kleinen Fenstern und hoher Welle begrenzt daher die Fläche die Zahl
gleichzeitig sichtbarer Hindernisse, nicht die Rampe. Der zugehörige Test prüft deshalb
nicht die exakte Sollzahl, sondern dass die Welt sich merklich füllt; die Sollzahl zu
verlangen hieße zu behaupten, der Platz gehe nie aus. Ein verkleinertes Fenster löscht
jedes Hindernis, das die Regel gegen die neuen Grenzen bricht.

→ Kap. 4

### 2026-07-30 — Hindernisse leben in der Engine, nicht im Frontend

**Gewählt:** `GameEngine` besitzt Geometrie, Spawn, Lebensdauer, Boid-Ausweichen und die
Auflösung der Spielerbewegung. Das Frontend zeichnet und zieht ein Leben ab. `tick`
bekommt dafür die vorige **und** die versuchte Spielerposition und liefert die korrigierte
Position, ein Trefferflag und die Oberflächennormale zurück; ein fünfter, flacher Buffer
transportiert die Hindernisse zum Zeichnen.

**Verworfen:** Die Hindernisse im Frontend zu halten und ihre Geometrie pro Tick in die
Engine zu schicken, damit die Boids ausweichen können. Das hätte dieselbe Geometrie auf
beiden Seiten der Sprachgrenze gebraucht — und damit zwei Kollisionstests, die sich
unterscheiden können, obwohl Spieler und Boids gegen dasselbe Hindernis prüfen müssen.
Zudem verbietet die Projektinvariante Simulationsmathematik im Frontend.

**Konsequenz:** Der Buffer-Vertrag wächst zum ersten Mal seit seiner Einführung, und
`tick` ist nicht mehr symmetrisch — der Aufrufer muss die zurückgegebene Position
benutzen statt der, die er angefragt hat. Weil die Bewegung als **Strecke** und nicht als
Endpunkt geprüft wird, kann auch ein Dash nicht mehr zwischen zwei Schritten durch ein
dünnes Hindernis tunneln. Im Frontend bleibt nur das Abziehen einer Vektorkomponente
(`applyObstacleBlock`), was das Abgleiten erzeugt.

→ Kap. 4, 5

### 2026-07-30 — Eigene Dichte-Stufe für Hindernisse bis 8 statt der Boid-Stufe bis 4

**Gewählt:** `MAX_OBSTACLE_DENSITY_TIER = 8`, unabhängig von
`MAX_BOID_DIFFICULTY_TIER = 4`. Das Ausweichgewicht der Boids bleibt dagegen über alle
Stufen konstant.

**Verworfen:** Die bestehende Boid-Stufe mitzubenutzen. Sie ist ab Welle 5 am Anschlag,
die Anforderung an die Hindernisse lautet aber „über das Spiel hinweg steigend" — die
Dichte hätte also nach knapp zweieinhalb Minuten aufgehört zu wachsen. Ebenfalls
verworfen: das Ausweichgewicht mit der Stufe zu erhöhen. Ausweichen ist Kompetenz, nicht
Schwierigkeit; ein späterer Boid, der schlechter ausweicht, sieht kaputt aus und nicht
schwerer. Die Schwierigkeit steckt in der Dichte.

**Konsequenz:** Zwei Rampen mit unterschiedlicher Länge im selben Projekt, was ohne
Begründung wie ein Versehen aussieht — daher dieser Block und der Kommentar an der
Konstante.

→ Kap. 4

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

- **2026-07-30 — 129 grüne Rust-Tests, und im Spiel war kein einziges Hindernis zu
  sehen.** Nach der Umsetzung von S-07 war alles grün: Geometrie, Ablauf,
  Korridor-Invariante, Buffer-Vertrag im Browser. Ein Blick auf das laufende Spiel
  zeigte eine leere Arena. Zwei unabhängige Ursachen, beide vom gleichen Typ — eine
  Zusicherung, die nur eine **Obergrenze** prüfte.
  Erstens die Streuung des Spawns: Der Seed wurde nach dem Muster der Dash-Auswahl
  gebildet, `(seed * 53 + 47) % 1000`. Bei kleinen Multiplikatoren bleibt das Produkt
  für die ersten Seeds unter dem Modulus, der Rest ist dann das Produkt selbst — alle
  frühen Spawn-Runden landeten am oberen Rand der Welt und wurden ausnahmslos wegen zu
  geringen Randabstands abgelehnt. Die Dash-Auswahl verträgt das, weil sie einen
  Boid-Index modulo Flockgröße zieht und dort auch eine schlechte Streuung immer
  _irgendeinen_ gültigen Boid trifft; die Hindernis-Platzierung hat eine
  Ablehnungsbedingung und fällt damit auf die Nase. Zweitens die
  Spieler-Abstandsregel: Sie war von der Boid-Regel übernommen und verlangte
  `safe_spawn_distance` (~340 px) — in einem 1600×900-Fenster eine Sperrscheibe von fast
  Arenabreite. Für ein Objekt, das sich nie bewegt, ist ein Korridor die richtige
  Größe; die Boid-Distanz existiert, weil ein Boid sofort zu jagen beginnt.
  Rund 70 min, davon der größte Teil auf die Diagnose.
  Die eigentliche Lehre betrifft nicht die Streuung, sondern die **Form der
  Zusicherung**: `field.len() <= allowed` war erfüllt, `keine zwei Hindernisse zu nah`
  war erfüllt, `keines am Rand` war erfüllt — eine leere Welt erfüllt jede
  Obergrenze und jede Ausschlussregel, die man formulieren kann. Was fehlte, war die
  Untergrenze: _füllt sich die Welt überhaupt_. Seitdem stehen neben jeder
  Obergrenzen-Zusicherung dieses Features auch eine Untergrenze und eine Streuungsprüfung
  (linke/rechte, obere/untere Hälfte). Zweite Lehre, unbequemer: Gefunden hat den Fehler
  keine der drei Teststufen, sondern ein Blick auf einen Screenshot. Bei einem sichtbaren
  Feature bleibt das ein Arbeitsschritt und keine Bequemlichkeit.
  → Kap. 4, 8, 10

- **2026-07-30 — Der Bug saß nicht in der Geometrie, sondern in einem Abstand von exakt
  null.** Im Spiel blieb der Spieler in Hindernissen hängen, am zuverlässigsten mit einem
  Dash hinein, aber auch beim längeren Hineinsteuern. Die Vermutung lag zuerst bei der
  Kapselgeometrie oder beim Streckenabstand — beides war korrekt und ist einzeln
  abgedeckt. Die Ursache war der Rückgabewert: `resolve_player_movement` setzte den
  blockierten Spieler auf `contact.surface_point`, also auf einen Punkt mit Abstand **genau
  null** zur aufgeblasenen Oberfläche. Im nächsten Schritt beginnt die geprüfte Strecke
  damit auf der Oberfläche, ihr Minimalabstand liegt bei `radius + player_radius` — und
  nach f32-Rundung eben auch knapp darunter. Der Schritt galt also wieder als Kollision,
  **auch wenn er vom Hindernis weg führte**, und der Zweig für „hat durchtunnelt" zog den
  Spieler auf die Oberfläche zurück. Position und Geschwindigkeit widersprachen sich
  daraufhin jeden Schritt: Die Geschwindigkeit zeigte nach außen, die Korrektur überschrieb
  die Position. Der Dash traf das am härtesten, weil er tief im Hindernis endet und dort
  garantiert korrigiert wird.
  Rund 45 min, davon der größte Teil auf die Diagnose; die Behebung sind zwei Zeilen plus
  eine entfallende Fallunterscheidung.
  Die Lehre betrifft die **Art** der Zusicherungen, nicht ihre Zahl: Jeder Test zu diesem
  Code prüfte einen **einzelnen** Aufruf — richtige Position, richtige Normale, kein
  Durchtunneln. Ein Zustand, aus dem man nicht mehr herauskommt, ist aber nur über **zwei
  aufeinanderfolgende** Aufrufe sichtbar. Die neuen Zusicherungen sind deshalb bewusst so
  gebaut: einmal blockieren und im Folgeschritt wegfahren, und 200 Schritte gegen ein
  Hindernis mit der Zusicherung, dass jeder einzelne davon außerhalb endet. Das ist
  dieselbe Lücke wie beim leeren Hindernisfeld, nur in der Zeit statt im Raum — dort fehlte
  die Untergrenze, hier die Folgebewegung.
  → Kap. 4, 8, 10

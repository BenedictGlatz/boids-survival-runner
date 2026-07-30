# 8 Qualität

`Seitenbudget: ~2 S. | Status: 8.1/8.2/8.4 geschrieben, 8.3/8.5 offen | Quellen: frontend/vitest.config.js, frontend/playwright.config.js, engine/tests/, CLAUDE.md §Commands`

**Dieses Kapitel wächst pro Commit** — wie Kap. 7, ein Absatz je Maßnahme am Tag
ihres Landens.

Die Teststrategie folgt einer einzigen Leitfrage: Welche Stufe kann eine Eigenschaft
überhaupt prüfen? Unit-Tests auf beiden Seiten der Sprachgrenze für Mathematik und
Logik; eine eigene Stufe im Browser für den Buffer-Vertrag, weil dessen Typen
außerhalb einer JavaScript-Laufzeit nicht existieren; E2E gegen den gebauten Stand für
alles, was erst im ausgelieferten Artefakt entsteht; statische Analyse für Stil und
Typen; und CI als die Instanz, die all das erzwingt statt es zu empfehlen. Die
Aufteilung ist damit nicht nach Aufwand gewählt, sondern nach Erreichbarkeit — und wo
eine Stufe strukturell nichts sehen kann, steht das hier ausdrücklich, statt von einer
grünen Ausgabe verdeckt zu werden.

## 8.1 Unit Tests und Coverage

Die Teststufen sind nicht nach Geschmack aufgeteilt, sondern nach der Frage, welche
Stufe eine Eigenschaft überhaupt prüfen _kann_. Daraus ergeben sich drei Ebenen mit
je eigenem Werkzeug und eigener Ausführungsumgebung:

| Ebene             | Werkzeug                             | Läuft in           | Deckt ab                                   |
| ----------------- | ------------------------------------ | ------------------ | ------------------------------------------ |
| Engine-Unit       | `cargo test`, `#[cfg(test)]` in-file | Host (native)      | Mathematik und Simulation                  |
| Sprachgrenze      | `wasm-pack test`, `engine/tests/`    | Browser (`wasm32`) | Der Vier-Buffer-Vertrag der Bridge         |
| Frontend-Unit     | Vitest                               | Node               | Importfreie Logikmodule                    |
| _(E2E, Kap. 8.2)_ | Playwright                           | Browser            | Alles, was nur im gebauten Spiel existiert |

**Rust.** Unit-Tests liegen als `#[cfg(test)]`-Modul direkt neben dem Code, den sie
abdecken, und sind für alle Mathematik- und Simulationsfunktionen verpflichtend
(`CLAUDE.md` § Hard rules). Die Simulation ist damit praktisch vollständig abgedeckt;
die Werte stehen in Kap. 9.

**Die Sprachgrenze braucht eine eigene Stufe.** `engine/tests/wasm_tests.rs` war bis
zu dieser Maßnahme ein leerer Stub. Von den beiden Möglichkeiten, die dieses Kapitel
sich selbst gestellt hatte — füllen oder die Absenz begründen — wurde gefüllt, weil
das Argument dafür ungewöhnlich stark ist: Die Getter von `FrameResponse` liefern
`js_sys::Float32Array` und `js_sys::Uint32Array`. Diese Typen existieren nur in einer
JavaScript-Laufzeit. `cargo test` kann den Buffer-Vertrag also nicht prüfen, in
keinem Umfang und mit keinem Aufwand. Eine begründete Absenz hätte damit genau die
Stelle ungeprüft gelassen, für die es keine Ersatzstufe gibt — und das ist gleichzeitig
die zweite tragende Invariante des Systems (Kap. 5) und das gewählte Fokus-Thema.
Geprüft werden dort die Index-Ausrichtung aller vier Buffer, dass `snapshot()` die Welt
nicht bewegt, die Idempotenz von `set_wave()`, der Sicherheitsabstand neu gespawnter
Boids, der Wrap nach `resize()` und der Vorzeichen-Vertrag der Dash-Phase. Der
Hindernis-Buffer und der daran hängende Kollisionsvertrag des Spielers liegen in
`engine/tests/wasm_obstacle_tests.rs`; geteilt wurde entlang der Naht, die ohnehin
bestand — dieser Buffer ist der einzige, der _nicht_ index-ausgerichtet zu den
Boid-Buffern ist — als die gemeinsame Datei die 400-Zeilen-Grenze überschritt.

**Zwei Beobachtungen aus dieser Stufe, die man kennen muss, um die Zahlen in Kap. 9
nicht als Widerspruch zu lesen.** Erstens: Auf dem Host-Target expandiert
`#[wasm_bindgen_test]` zu nichts. `cargo test` meldet für die Datei **null Tests** und
bleibt grün. Genau deshalb ist der leere Stub monatelang niemandem aufgefallen — es gab
kein Signal, das hätte fehlschlagen können. Ein grünes `cargo test` sagt über die
Sprachgrenze nichts aus. Zweitens, dieselbe Ursache: `cargo llvm-cov` instrumentiert
ebenfalls das Host-Target. Die neuen Tests heben die Rust-Coverage daher **nicht**;
`wasm_bridge/response.rs` steht weiter bei 0 %, obwohl es jetzt vollständig geprüft
ist. Beide Zahlen sind korrekt, die Coverage-Zahl untertreibt an dieser Stelle
lediglich, und Coverage misst hier sichtbar nicht Qualität, sondern nur, was ein
bestimmtes Werkzeug auf einem bestimmten Target sehen kann.

**Frontend.** Vitest im `node`-Environment (`frontend/vitest.config.js`). Die Suite
braucht weder Browser noch gebautes WASM-Paket — und genau daraus folgt ihre Grenze:
Nur importfreie Logikmodule sind so testbar. Ein Test, der `engine-bridge.js`, den
Canvas-Renderer oder ein DOM-Modul hereinzieht, läuft nicht. Testdateien liegen als
`<modul>.test.js` neben dem Modul und spiegeln damit die Rust-Konvention.

**Coverage wird je Sprache getrennt erhoben und getrennt berichtet**
(`@vitest/coverage-v8`, `cargo llvm-cov --lib`). Eine gemeinsame Kennzahl wäre die
schlechtere Aussage: Sie würde die beiden Hälften verrechnen und damit genau die
Information zerstören, um die es geht — welche Sprachseite geprüft ist und welche
nicht.

Die Frontend-Konfiguration enthält zwei Entscheidungen gegen eine schönere Zahl.
`all: true` lässt Module ohne Test mitzählen, statt sie unsichtbar zu machen; und
`index.js` sowie `ui/frameTimeGraph.js` — die beiden größten Dateien und die, die den
Wert am stärksten drücken — sind **nicht** ausgeschlossen. Ausgeschlossen sind nur
generiertes WASM-Glue, die Testdateien selbst und `gameConfig.js`, weil dort nichts
Ausführbares steht. Der Frontend-Gesamtwert liegt damit im unteren Fünftel.

Die Priorisierung dahinter ist ausdrücklich gewollt und lässt sich an der _Form_ der
Verteilung ablesen, nicht am Mittelwert: Sie ist **zweigipfelig**. Jedes Modul liegt
entweder bei 100 % oder bei 0 %, kein einziges dazwischen. Die Trennlinie ist keine
Bequemlichkeit, sondern exakt die Architekturgrenze aus Kap. 3 — Module ohne DOM-,
Canvas- oder WASM-Bezug sind vollständig abgedeckt, Module mit einem solchen Bezug
gar nicht, weil die node-Suite sie nicht laden kann. Der Gesamtwert ist niedrig, weil
die zweite Gruppe die größeren Dateien enthält, nicht weil dort nachlässig getestet
worden wäre. Abgedeckt ist sie durch die E2E-Stufe (Kap. 8.2), und der Beweis dafür,
dass diese Aufteilung trägt, ist der Befund in Kap. 8.2: Der Fehler, den die Suite als
erstes fand, lag genau in dieser zweiten Gruppe.

Schwellwerte (`thresholds`) sind bewusst noch **nicht** gesetzt. Eine Untergrenze
oberhalb des Ist-Stands hätte die Pipeline aus Kap. 8.3 dauerhaft rot gemacht, ohne
eine Information zu liefern; sie wird auf dem erreichten Niveau abzüglich einer
Reserve nachgezogen, sobald die Pipeline steht. Zahlen: Kap. 9.

## 8.2 E2E Tests

Playwright, weil alles, was in diesem Spiel bewertbar ist, entweder auf einem Canvas
liegt oder erst nach dem Laden eines WebAssembly-Moduls existiert. Beides ist von
außen nur in einem echten Browser sichtbar.

**Die wichtigste Konfigurationsentscheidung ist das Ziel, nicht das Werkzeug.** Die
Suite läuft gegen den **Production-Build** (`npm run build` + `vite preview`), nicht
gegen den Dev-Server. Der Dev-Server liefert das gesamte Projektverzeichnis aus und
verdeckt damit alles, was der Build zu kopieren vergisst. Das ist nicht theoretisch:
Beim Einrichten fiel auf, dass `frontend/dist/` kein `locales/`-Verzeichnis enthielt.
`ui/i18n.js` holt die Locale per `fetch` zur Laufzeit, die Datei erscheint deshalb nie
im Modulgraph, und Vite kopiert nur, was es importiert sieht oder unter `public/`
findet. Im gebauten Spiel schlug der `fetch` also fehl und **jedes** Label stand als
Rohschlüssel auf dem Bildschirm — `menu.play` statt „Play". Über Monate hinweg war das
unsichtbar, weil niemand den Build startet, um zu spielen.

Bemerkenswert ist daran nicht der Fehler, sondern wer ihn finden konnte: Die
Engine-Unit-Tests, die Grenz-Tests und die Frontend-Unit-Tests waren zu diesem
Zeitpunkt alle grün und hätten ihn strukturell nie finden können, weil keiner von
ihnen ein Build-Artefakt anfasst. Die Entscheidung für den Preview-Build hat sich
damit bezahlt, bevor der erste E2E-Test geschrieben war — und sie ist damit auch die
Antwort auf die Frage, was diese Stufe zusätzlich leistet, statt sie behaupten zu
müssen. Als Regressionswächter prüft `boot.spec.js` seitdem beides: dass kein Request
fehlschlägt und dass die Menütexte echte Wörter statt Schlüsseln sind.

| Flow                | Zweck                                                                                                             | Dauer |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- | ----: |
| `boot.spec.js`      | WASM-Modul lädt, Canvas füllt das Fenster, keine Konsolenfehler, keine fehlgeschlagenen Requests, Texte übersetzt | < 1 s |
| `round.spec.js`     | Menü → Runde; Welt bleibt im Countdown stehen, danach laufen Uhr und Score; Wave 1 vollständig                    | ~ 5 s |
| `input.spec.js`     | Tastatureigentum: Leertaste gehört in der Runde dem Dash, außerhalb dem Menü                                      | ~ 5 s |
| `settings.spec.js`  | Menü und Option-Gruppen inkl. `aria-pressed`; Frametime-Graph an/aus                                              | ~ 4 s |
| `gameover.spec.js`  | Tod nach drei Leben, Game-Over-Overlay, Neustart in eine frische Runde                                            | ~ 8 s |
| `obstacles.spec.js` | Hindernisse werden in der Runde gezeichnet, außerhalb nicht; Runde übersteht Erscheinen und Ablauf ohne Fehler    | ~ 8 s |

Drei bewusste Begrenzungen, jeweils mit ihrem Grund:

- **Nur Chromium.** Die Engine ist WebAssembly hinter einem Canvas; ein zweiter
  Browser würde überwiegend dessen eigene WASM- und Canvas-Implementierung
  nachprüfen, nicht den Code dieses Projekts. Der Nutzen wäre gering, die doppelte
  Laufzeit real.
- **Ein Worker, keine Parallelität.** Mehrere Browser, die gleichzeitig eine
  O(n²)-Schleife über hunderte Entitäten mit 60 Schritten pro Sekunde rechnen, nehmen
  sich gegenseitig die CPU weg. Zeitbezogene Zusicherungen würden dann aus Gründen
  fehlschlagen, die nichts mit dem geprüften Code zu tun haben.
- **Kein Pixelvergleich.** Naheliegend wäre, Spieler, Boids und Cooldown-Balken über
  Screenshots zu prüfen. Es wäre aber wertlos: Der Schwarm bewegt sich in jedem Frame,
  jedes Bild unterscheidet sich also von jedem anderen, und eine
  Ungleichheits-Zusicherung wäre unabhängig von der Eingabe immer erfüllt. Ein
  Golden Image umgekehrt wäre bei einer laufenden Simulation dauerhaft instabil. Die
  Zeichen-Arithmetik ist stattdessen als Unit-Test isoliert (`renderer/dashPulse.js`,
  `player/dashCooldown.js`, `ui/frameGraphScale.js`, `renderer/obstacleFade.js`) — das
  ist der Grund, aus dem diese Module überhaupt aus ihren Renderern herausgezogen
  wurden.

Die eine Ausnahme von der letzten Begrenzung ist `obstacles.spec.js`, und sie ist keine
Aufweichung der Regel, sondern deren Kehrseite. Der Spec vergleicht kein Bild, sondern
stellt eine einzige Inhaltsfrage: existiert irgendwo auf dem Canvas eine größere Fläche
in der Hindernisfarbe. Das ist gegen die laufende Simulation stabil, weil die Boids klein
und rot und der Spieler cyan ist, und es ist die einzige Möglichkeit, die Kette
Engine-Buffer → Bridge → Renderer als Ganzes zu prüfen. Die Alternative wäre eine
Debug-Schnittstelle nur für den Test gewesen — Produktionscode, dessen einziger Zweck es
ist, getestet zu werden.

Ein weiterer Nachtrag zur Zeichen-Arithmetik: `renderer/obstacleLayer.js` ist die erste
Zeichenroutine mit einem eigenen Unit-Test, obwohl sie das Canvas berührt. Sie
dekodiert einen flachen Buffer, und eine falsche Schrittweite darin würde jedes
Hindernis an der falschen Stelle zeichnen, ohne irgendetwas zum Fehlschlagen zu bringen.
Ein aufzeichnender Kontext-Stub genügt dafür und braucht keinen Browser.

Was E2E dagegen als Einziges prüfen kann und hier auch prüft, ist das **Eigentum an
der Tastatur** — die eine Eingabe-Eigenschaft, die eine Entwurfsentscheidung und keine
Arithmetik ist: Die Leertaste wird nur während einer laufenden Runde für den Dash
beansprucht, damit sie überall sonst die Menüschaltflächen und das native
`<details>` weiter bedient (Kap. 3.2.2). Beide Hälften dieser Aussage sind je ein
Testfall.

Ein fachlicher Nebeneffekt der Determinismus-Entscheidung aus Kap. 4: Weil die Engine
keine Zufallsquelle besitzt, ist „stehenbleiben, bis der Schwarm drei Leben genommen
hat" ein reproduzierbarer Testfall und nicht bloß meistens einer.

**Report.** `npm run test:e2e` erzeugt einen HTML-Report unter
`frontend/playwright-report/`, ansehbar mit `npm run test:e2e:report`; bei einem
Fehlschlag liegen Trace, Video und Screenshot daneben. Der Report ist ein generiertes
Artefakt und daher gitignoriert — im Repository liegt die Suite, im Anhang (Kap. 11)
die Zusammenfassung.

## 8.3 CI/CD: GitHub Actions Pipeline

> TODO: nach T-05 schreiben. `.github/workflows/ci.yml`, ausgelöst bei Push und Pull
> Request. Jobs beschreiben und begründen, in welcher Reihenfolge und was parallel
> läuft:
> Rust (`cargo fmt --check`, `cargo clippy`, `cargo test`) · Frontend (`lint`,
> `format:check`, `typecheck`, `test`, `test:coverage`) · Build (WASM + `vite build`)
> · Deploy nach GitHub Pages auf `main`.
> Erwähnen, dass die Pipeline die Toolchain-Kopplung erzwingt: Ohne
> `wasm-pack`-Schritt schlägt der Frontend-Build fehl.
> `docs:check` als **nicht blockierender** Job — Begründung: Ein blockierender Hook
> für Doku-Disziplin wird umgangen, eine sichtbare Warnung nicht.

## 8.4 Kommentare — Visuelle Strukturierung des Quellcodes

Die Kommentar-Konvention ist in diesem Projekt keine Stilempfehlung, sondern eine
ausdrückliche Regel in `CLAUDE.md` bzw. `.github/copilot-instructions.md`:

> Jeder nicht-triviale Block erhält einen Kommentar in Alltagssprache, der _was_
> und _warum_ erklärt, nicht _wie_.

Die Begründung ist die oberste Projektregel: Die Codebasis wird von Studierenden
gelesen, die Rust und WebAssembly neu lernen. Ein Kommentar, der das _Wie_
wiederholt, ist für diese Leser wertlos — der Code sagt es bereits. Wertvoll ist
das _Warum_, und zwar besonders dort, wo eine naheliegende Lösung absichtlich
**nicht** gewählt wurde. Beispiele aus dem Bestand: warum der Dash eine
Geschwindigkeitsobergrenze als Parameter übergibt statt `max_speed` zu erhöhen
(sonst skaliert auch die Lenkstärke mit), warum die Glow-Farben vorberechnet in
einer Tabelle liegen (keine String-Allokation pro Boid pro Frame), warum das
Entwickler-Menü ein natives `<details>` ist (Tastatur- und Screenreader-Bedienung
ohne eigenen Zustand).

Drei weitere Punkte sind als harte Regel formuliert:

- **Doc-Kommentar für jeden `#[wasm_bindgen]`-Export.** Die Bridge ist die
  schmalste und am leichtesten missverstandene Stelle des Systems (Kap. 5); dort
  ist Dokumentation am billigsten und am wirksamsten.
- **Begründungskommentar für jeden `unsafe`-Block.** Erwähnenswert ist hier vor
  allem der Ist-Stand: Es gibt derzeit **keinen einzigen** `unsafe`-Block in der
  Engine. Die gesamte Simulation kommt mit sicherem Rust aus — für ein Projekt,
  dessen Kern eine O(n²)-Schleife über mehrere hundert Entitäten pro Frame ist, ist
  das eine erwähnenswerte und keine selbstverständliche Eigenschaft.
- **Begründungspflicht für jede Mikrooptimierung.** Manuelle SIMD, Bit-Tricks oder
  Zeigerarithmetik sind nur erlaubt, wenn ein Profiler den Engpass belegt hat — und
  dann mit ausführlicher Erklärung der Technik.

**JSDoc ist die maschinengeprüfte Hälfte dieser Konvention.** Was für Rust die
Doc-Kommentar-Pflicht ist, leistet im Frontend `eslint-plugin-jsdoc`: Auf der
öffentlichen API erzwingt der Linter Vorhandensein, Typen und Beschreibungen —
Details in Kap. 7.5. Die Arbeitsteilung ist damit sauber: Die _Warum_-Kommentare im
Blockinneren bleiben eine menschliche Urteilsfrage und lassen sich nicht prüfen; die
_Schnittstellen_-Dokumentation ist strukturell und wird geprüft. Der Befund aus
T-01 stützt genau diese Trennung: Die Prosa-Kommentare waren durchgehend gepflegt,
die Schnittstellen-Dokumentation aber lückenhaft — inklusive der WASM-Bridge selbst.
Die Regel ohne Werkzeug hielt also gerade dort nicht, wo sie am wichtigsten war.

## 8.5 Lighthouse

> TODO: nach T-06 schreiben, wenn ein Pages-Deployment existiert. Anwendbar, weil es
> eine statisch ausgelieferte Web-Anwendung ist. Score für Performance,
> Accessibility, Best Practices, SEO angeben und **interpretieren**, nicht nur
> abbilden — insbesondere: Accessibility-Befunde einer Canvas-Anwendung sind
> strukturell begrenzt, und der Tastatur-Trade-off aus Kap. 3.2.2 ist hier
> anschlussfähig.

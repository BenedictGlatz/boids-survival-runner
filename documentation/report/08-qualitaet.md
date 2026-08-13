# 8 Qualität

`Seitenbudget: ~2 S. | Status: Entwurf, alle Abschnitte geschrieben; 8.3 und 8.5 als begründete Negativbefunde, 8.6 wartet auf die Messreihe | Quellen: frontend/vitest.config.js, frontend/playwright.config.js, engine/tests/, .github/, CLAUDE.md §Commands`

**Dieses Kapitel wächst pro Commit** — wie Kap. 7, ein Absatz je Maßnahme am Tag
ihres Landens.

Die Teststrategie folgt einer einzigen Leitfrage: Welche Stufe kann eine Eigenschaft
überhaupt prüfen? Unit-Tests auf beiden Seiten der Sprachgrenze für Mathematik und
Logik; eine eigene Stufe im Browser für den Buffer-Vertrag, weil dessen Typen
außerhalb einer JavaScript-Laufzeit nicht existieren; E2E gegen den gebauten Stand für
alles, was erst im ausgelieferten Artefakt entsteht; statische Analyse für Stil und
Schnittstellendokumentation — für Typen ist sie offen, siehe Kap. 7.6 TypeScript; und CI
als die Instanz, die all das erzwingen soll statt es zu empfehlen, und die als einziger
namentlich geforderter Punkt dieses Kapitels noch fehlt (8.3). Die
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
| Sprachgrenze      | `wasm-pack test`, `engine/tests/`    | Browser (`wasm32`) | Der Puffer-Vertrag der Bridge              |
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
`<modul>.test.js` in einem Ordner `__tests__/` innerhalb des Ordners, dessen Module sie
prüfen. Damit bleibt der Test wie in Rust bei seinem Code, aber ein Blick in `loop/`
oder `renderer/` zeigt die Module und nicht doppelt so viele Testdateien daneben.

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

| Flow                | Zweck                                                                                                                                              |  Dauer |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -----: |
| `boot.spec.js`      | WASM-Modul lädt, Canvas füllt das Fenster, keine Konsolenfehler, keine fehlgeschlagenen Requests, Texte übersetzt                                  |  < 1 s |
| `round.spec.js`     | Menü → Runde; Welt bleibt im Countdown stehen, danach laufen Uhr und Score; Wave 1 vollständig                                                     |  ~ 5 s |
| `input.spec.js`     | Tastatureigentum: Leertaste gehört in der Runde dem Dash, außerhalb dem Menü                                                                       |  ~ 5 s |
| `settings.spec.js`  | Menü und Option-Gruppen inkl. `aria-pressed`; Frametime-Graph an/aus                                                                               |  ~ 4 s |
| `gameover.spec.js`  | Tod nach drei Leben, Game-Over-Overlay, Neustart in eine frische Runde                                                                             |  ~ 8 s |
| `obstacles.spec.js` | Hindernisse werden in der Runde gezeichnet, außerhalb nicht; Runde übersteht Erscheinen und Ablauf ohne Fehler                                     |  ~ 8 s |
| `letterbox.spec.js` | Weltkante ist sichtbar; ein Resize verändert die Welt nicht; ein Fenster kleiner als die Welt übersteht eine Runde                                 |  ~ 5 s |
| `powerups.spec.js`  | Beide Buff-Zeilen im HUD vorhanden und verborgen; Runde übersteht zwei Spawn-Intervalle; Neustart lässt nichts stehen                              | ~ 48 s |
| `pause.spec.js`     | Escape friert Score und Uhr ein und setzt fort; Leertaste auf der Karte; Auto-Pause bei Fokusverlust; Countdown-Restzeit; kein Rekord beim Abbruch | ~ 70 s |

Fünf bewusste Begrenzungen, jeweils mit ihrem Grund:

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
- **Kein Einsammeln eines Power-ups.** Marker werden zufällig platziert, ein Test, der
  zu einer unbekannten Koordinate läuft, wäre ein Wettlauf. `powerups.spec.js` prüft
  deshalb nur die Verdrahtung, und ein Pixelvergleich hilft hier zusätzlich nicht
  weiter, weil Amber sowohl die Aegis-Farbe als auch `PLAYER_HIT_COLOR` ist — gezählte
  Amber-Pixel könnten einen Marker nicht von einem gerade getroffenen Spieler
  unterscheiden. Die Regeln selbst liegen zu 98 % unter Unit-Test, weil `PowerupField`
  seinen Zufallsgenerator im Konstruktor entgegennimmt; die Alternative wäre gewesen,
  die Platzierung wie in der Engine aus einem Integer-Hash abzuleiten und damit das
  Spiel für einen Test vorhersagbar zu machen.
- **Keine gehaltene Taste über eine Pause hinweg.** Pausieren löscht die gedrückten
  Tasten, damit keine über den Zustandswechsel hinweg als gehalten gilt; eine physisch
  noch gedrückte Taste registriert sich im echten Browser beim nächsten
  Auto-Repeat-Ereignis von selbst wieder. Genau dieses Ereignis schickt Playwright nicht:
  `keyboard.down` liefert ein einzelnes `keydown` und emuliert keine Wiederholung. Der
  Spec kann deshalb belegen, dass die **Runde** sauber weiterläuft, nicht aber, dass die
  **Bewegung** von selbst zurückkommt. Dieselbe Grenze betrifft zwei weitere Auslöser, die
  der Spec daher per `dispatchEvent` nachbildet statt sie zu erzeugen: das
  Auto-Repeat-`keydown` mit `repeat: true`, mit dem der Toggle-Guard geprüft wird, und der
  Fensterfokusverlust, der in einem Headless-Lauf nicht echt herbeigeführt werden kann.
  Geprüft ist damit jeweils der Listener samt Zustands-Guard, nicht die Buchführung des
  Browsers darüber.

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

**Eine Pipeline existiert nicht.** Unter `.github/` liegt allein
`copilot-instructions.md`, kein `workflows/`-Verzeichnis. Die Maßnahme T-05 ist mit 5 h
geplant und offen; damit fehlt der einzige Punkt des Anforderungskatalogs, der in diesem
Kapitel namentlich gefordert ist und den das Projekt nicht erfüllt. Der Befund wird
deshalb hier benannt, mit seiner Wirkung und mit dem Entwurf, der ihn schließt.

**Die Wirkung der Absenz ist präzise beschreibbar**, und sie ist kleiner, als sie
klingt, aber nicht null. Alle Prüfungen, die eine Pipeline ausführen würde, existieren
schon und sind jeweils ein einzelner Befehl — die Liste in Kap. 7.1 Scripts in
package.json ist vollständig. Was fehlt, ist nicht die Prüfung, sondern die **Instanz,
die sie erzwingt**: Derzeit hält die Disziplin, weil jede Änderung von Hand gegen `lint`,
`format:check`, `cargo clippy` und die Testbefehle gefahren wird. Eine übersprungene
Prüfung fällt damit erst beim nächsten bewussten Lauf auf, und ein Stand, der nur auf
diesem Entwicklungsrechner baut, fiele überhaupt nicht auf. Genau letzteres ist der
Punkt, den eine Pipeline über die reine Wiederholung hinaus leistet: Sie baut in einer
leeren Umgebung. Die Toolchain-Kopplung aus Kap. 7.8 Dev Build — ohne
`wasm-pack`-Schritt schlägt der Frontend-Build fehl — ist auf diesem Rechner
unsichtbar, weil das Paket dort längst liegt.

**Entworfen ist die Pipeline als vier Jobs** in `.github/workflows/ci.yml`, ausgelöst bei
Push und Pull Request:

| Job        | Inhalt                                                         | Abhängigkeit |
| ---------- | -------------------------------------------------------------- | ------------ |
| `rust`     | `cargo fmt --check`, `cargo clippy`, `cargo test`              | keine        |
| `frontend` | `lint`, `format:check`, `typecheck` (T-02), `test`, `coverage` | keine        |
| `build`    | `build:wasm` + `vite build`, danach `test:e2e`                 | `rust`       |
| `deploy`   | Veröffentlichung nach GitHub Pages, nur auf `main`             | `build`      |

Die Reihenfolge folgt den Laufzeiten und nicht der Kapitelreihenfolge: `rust` und
`frontend` laufen parallel, weil sie nichts voneinander brauchen und beide in unter einer
Minute fertig sind — ein Formatierungsfehler soll nicht hinter einem kalten Rust-Build
warten. `build` hängt an `rust`, weil ein WASM-Paket aus nicht kompilierendem Code
sinnlos ist, und trägt die E2E-Suite, weil die den gebauten Stand ohnehin selbst
herstellt (Kap. 8.2 E2E Tests). `deploy` ist an `main` gebunden und damit die eine
Stelle, an der die Branch-Rollen aus Kap. 7.7 Branch-Struktur eine technische
Konsequenz bekommen statt nur eine Verabredung zu sein.

**Ein Job ist bewusst als nicht blockierend vorgesehen:** `docs:check`, die Prüfung der
Dokumentationsdisziplin (Prompt-Log, Journal, Changelog). Die Begründung ist eine
Erfahrung aus dem Projekt selbst: Das Prompt-Logging war über Wochen lückenhaft, und die
Ursache war strukturell — es verlangt einen Eintrag _vor_ der Antwort, während der
Changelog-Eintrag an der funktionierenden Gewohnheit „Commit-Zeit" hängt. Ein
blockierender Hook gegen dieses Muster wird nachts um zwei mit `--no-verify` umgangen und
verliert damit jede Aussagekraft; eine sichtbare Warnung, die im Pull Request stehen
bleibt, nicht. Ein rotes Kreuz muss bedeuten, dass der Code kaputt ist, sonst wird die
Farbe bedeutungslos.

Das Aufsetzen selbst ist damit absehbar günstig — die Jobs rufen vorhandene, lokal grüne
Befehle auf, und Schwellwerte für die Coverage sind aus dem in 8.1 genannten Grund noch
nicht gesetzt, könnten also auch keinen Job rot machen. Teuer ist an T-05 nicht die
Pipeline, sondern das Deployment daran (Kap. 7.10 Deployment).

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

Der Katalog fordert diesen Punkt mit dem Zusatz „falls anwendbar", und die ehrliche
Antwort besteht aus zwei Teilen: **Ein Lighthouse-Lauf ist nicht durchgeführt**, und er
wäre auch bei durchgeführtem Lauf nur zur Hälfte aussagekräftig.

**Warum nicht durchgeführt.** Lighthouse bewertet eine ausgelieferte Seite. Ein
Deployment existiert nicht (Kap. 7.10 Deployment), und ein Lauf gegen `vite preview` auf
`localhost` liefert für die Hälfte der Kategorien andere Zahlen als ein Lauf gegen Pages —
ohne Netzwerklatenz, ohne Kompression durch den Server, ohne Cache-Header. Eine Messung
zu drucken, die unter der Zieladresse anders ausfällt, wäre schlechter als keine: Sie
sähe wie ein Befund aus. Der Lauf ist deshalb an T-06 gebunden und gehört mit dessen
Abschluss in dieses Kapitel.

**Warum die Anwendbarkeit von vorn herein begrenzt ist**, und zwar nicht wegen des
fehlenden Deployments, sondern strukturell — Lighthouse prüft vier Kategorien, und dieses
Projekt bietet nur zwei davon eine Angriffsfläche:

| Kategorie      | Aussagekraft hier                                                                                                                                                                                                                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Performance    | Teilweise aussagekräftig. Gemessen wird die **Ladezeit** bis zum ersten Bild, und dafür ist die Größe des `.wasm`-Moduls die interessante Größe. Die Laufzeitleistung des Spiels — 60 Simulationsschritte pro Sekunde über einer O(n²)-Schleife — sieht Lighthouse überhaupt nicht; die messen der Frametime-Graph und die Werkzeuge aus 8.6. |
| Accessibility  | Strukturell begrenzt. Der Prüfer inspiziert das DOM, und das DOM besteht aus einem `<canvas>` plus den Overlays für Menü und HUD. Das eigentliche Spiel ist für ihn eine leere Fläche.                                                                                                                                                        |
| Best Practices | Aussagekräftig. HTTPS, Konsolenfehler, veraltete APIs, korrekte Bildformate — alles Eigenschaften der Auslieferung, und alle prüfbar.                                                                                                                                                                                                         |
| SEO            | Nicht anwendbar. Ein Spiel mit einem einzigen Screen, ohne Routing (Kap. 3.5) und ohne Textinhalt hat nichts zu indexieren. Ein niedriger Wert hier wäre kein Mangel, sondern die korrekte Beschreibung eines Spiels.                                                                                                                         |

Die Accessibility-Zeile ist die aufschlussreichste, weil ihre Grenze in beide Richtungen
läuft. Was Lighthouse **prüfen** kann, ist im Projekt bewusst gebaut: Die Menü- und
Optionsgruppen sind echte Schaltflächen mit `aria-pressed`, das Entwicklermenü ist ein
natives `<details>` und keine Nachbildung, und die Tastaturbedienbarkeit ist als eigener
Testfall abgesichert (Kap. 8.2 E2E Tests). Was Lighthouse **nicht** prüfen kann, ist
gleichzeitig die eigentliche Zugänglichkeitsfrage dieser Anwendung: Ein Canvas-Spiel, das
seinen Zustand ausschließlich als Bild ausgibt, ist für einen Screenreader nicht
zugänglich, und keine ARIA-Auszeichnung ändert daran etwas. Ein guter Wert in dieser
Kategorie würde also die Rahmen-DOM-Struktur bewerten und über das Spiel nichts sagen.
Anschlussfähig ist hier der Trade-off aus Kap. 3.2.2: Die Leertaste wird nur während einer
laufenden Runde vom Dash beansprucht, damit sie überall sonst die nativen Bedienelemente
weiter auslöst — eine Entscheidung _für_ die Tastaturzugänglichkeit, die aus demselben
Grund kein Prüfwerkzeug bemerkt.

## 8.6 GPU-Last: Messgrundlage vor Optimierung (T-08)

Anlass war eine Beobachtung, kein Messwert: Die GPU-Auslastung während einer Runde ist
hoch, obwohl das Bild aus einem Gitter, einigen hundert kleinen Pfeilen und ein paar
Kapseln besteht. Der erste Schritt ist deshalb keine Optimierung, sondern die Frage, ob
überhaupt gemessen werden kann — und die Antwort war zunächst nein.

### 8.6.1 Warum der Frametime-Graph diese Frage nicht beantwortet

Der Frametime-Graph aus Kap. 3.2.1 (UI-)Komponenten — Aufbau misst **Skriptzeit**. Ein `fill()` kehrt fast sofort zurück; die
Rasterisierung, die es in die Warteschlange stellt, wird danach und außerhalb des
Hauptthreads bezahlt. Der Graph kann also einen komfortablen 2-ms-Frame anzeigen, während
die GPU ausgelastet ist, ohne sich dabei zu widersprechen — er hat nie etwas anderes
behauptet, und sein Hinweistext im Menü sagt das seit jeher.

Schlimmer: Das Overlay verfälschte die Messung, die es tragen soll. `.frame-time-graph`
trug `backdrop-filter: blur(6px)` und lag über der einzigen Fläche der Seite, die in
jedem Frame neu gezeichnet wird — der Compositor musste diesen Bereich also so oft neu
weichzeichnen, wie das Spiel zeichnete. Es war zugleich der **einzige** GPU-Effekt, der
während einer laufenden Runde aktiv war. Ein Diagnosewerkzeug, das die eigene Messgröße
verändert, ist der schwerere Mangel gegenüber einem, das schlichter aussieht; die Fläche
ist jetzt deckend.

### 8.6.2 Was hinzugekommen ist: die Lastzeile

Der Graph hat eine dritte Textzeile bekommen, mit den drei Größen, die das Frontend
ehrlich selbst zählen kann. Jede einzelne für sich lädt zur falschen Schlussfolgerung
ein, weshalb sie zusammen stehen:

| Größe                      | Beantwortet                                     |
| -------------------------- | ----------------------------------------------- |
| Gezeichnete Bilder/Sekunde | Hält die FPS-Einstellung, was sie verspricht?   |
| Zeichenoperationen/Bild    | Die Zahl, die Bündelung senkt (Boids, Schweife) |
| Backing-Store-Pixel        | Die Zahl, die `devicePixelRatio` quadriert      |

**Keine der drei ist GPU-Zeit**, und der Hinweistext im Menü sagt genau das. Sie erklären
GPU-Kosten, sie messen sie nicht. Die Zeichenoperationen zählt `renderer/drawCallCounter.js`,
indem es die zeichnenden Methoden des Kontexts einmalig durch weiterleitende Zähler
ersetzt — einmalig und beim ersten Lesen, sodass nur zahlt, wer das Overlay einschaltet.
Pfadaufbau (`beginPath`, `lineTo`, `arc`) wird bewusst _nicht_ gezählt: Er kostet CPU,
gibt aber nichts zum Zeichnen ab, und ihn mitzuzählen ließe einen gebündelten Pfad genauso
teuer aussehen wie einen ungebündelten — das Gegenteil dessen, wofür die Zahl da ist.

Die gezeichnete Bildrate wird gezählt, nicht aus einer Frame-Dauer abgeleitet
(`ui/drawnFrameRate.js`). Unter einem Gate, das Bilder ungleichmäßig durchlässt, sagen
diese beiden Wege Verschiedenes, und die Zählung ist die, die ein Spieler wiedererkennt.

### 8.6.3 Was von außen gemessen wird

| Werkzeug                                     | Liefert                                      |
| -------------------------------------------- | -------------------------------------------- |
| `chrome://gpu`                               | ob Canvas überhaupt hardwarebeschleunigt ist |
| DevTools → Performance, GPU-Track            | GPU-Zeit pro Bild — die eigentliche Kennzahl |
| DevTools → Rendering → Frame Rendering Stats | GPU-Speicher, live                           |
| Windows-Task-Manager, GPU-Spalte             | die Zahl, die den Anlass gegeben hat         |

`chrome://gpu` steht bewusst an erster Stelle: Fällt Canvas2D auf Software-Rendering
zurück — in virtuellen Maschinen und mit manchen Treiberversionen nicht selten —, dann
bedeutet jede weitere Zahl etwas anderes, und die Ursache liegt nicht im Code.

**Protokoll**, damit zwei Messungen vergleichbar sind: feste Fenstergröße, festes
Vollbild-Verhalten, feste FPS-Einstellung, Frametime-Overlay aus, je 20 s in Wave 1,
Wave 5 und Wave 10, drei Durchläufe je Konfiguration. Berichtet wird **GPU-Zeit in ms pro
Bild**, nie Prozent — Prozent hängt vom Taktzustand der GPU ab.

Die schnellste Vorab-Diagnose braucht überhaupt kein Werkzeug: das Fenster auf die halbe
Kantenlänge ziehen. Das ist ein Viertel der Pixel bei unveränderter Zahl an
Zeichenoperationen. Fällt die Last stark, ist sie füllratenbegrenzt; bleibt sie, ist sie
zeichenaufrufbegrenzt. Die Antwort entscheidet, welche der beiden Maßnahmengruppen aus
T-08 überhaupt lohnt.

**Gefahren ist die Messreihe nach diesem Protokoll noch nicht.** Was T-08 bisher
geliefert hat, ist die Voraussetzung dafür — ein Overlay, das die eigene Messgröße nicht
mehr verfälscht, drei ehrlich benannte Zählwerte und ein schriftliches Verfahren. Die
zweite Stufe, die Senkung der Last, ist damit bewusst noch nicht begonnen: Ohne Basiswert
wäre jede Maßnahme darunter eine Vermutung, und ein Performance-Gewinn ohne Zahl ist die
eine Behauptung, die dieses Kapitel nicht tragen kann. Der Reihenfolge-Entscheid steht
damit über dem Ergebnis, und das ist der berichtsfähige Teil des Befunds.

> TODO: Basis- und Nachher-Tabelle hier eintragen, sobald die Messungen vorliegen.

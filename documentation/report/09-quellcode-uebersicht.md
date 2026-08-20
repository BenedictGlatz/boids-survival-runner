# 9 Quellcode-Übersicht

`Seitenbudget: ~1 S. | Status: Fertig | Quellen: die Befehle unten`

**Dies ist die einzige Stelle im Bericht, an der Zahlen stehen.** LOC, Dateizahlen,
Testzahlen, Coverage-Prozente und Commit-Zahlen gehören ausschließlich hierher; alle
anderen Kapitel verweisen zurück. Sonst tauchen dieselben Zahlen in Kap. 3, 4 und 8
auf und laufen bis zur Abgabe auseinander.

Alle folgenden Werte sind an der abgabefertigen Fassung erhoben, **Stand
20.08.2026**; es ist die abschließende Erhebung, alle Befehle aus 9.1 Methodik der
Masszahlen sind dafür erneut ausgeführt worden. Ihr wichtigstes Ergebnis ist ein
Nullbefund: seit dem 13.08.2026 ist keine Zeile Produktiv-, Test- oder Asset-Code mehr
verändert worden — `git log --since=2026-08-13 -- engine/ frontend/src frontend/e2e`
liefert keinen Commit. Sämtliche Werte in 9.2 Größe und Verteilung und 9.2b Coverage
gelten damit unverändert; fortgeschrieben sind allein die beiden Kennzahlen, die sich
in der reinen Schreibphase noch bewegen, nämlich Repository-Historie und
KI-Protokollierung in 9.3 Weitere Masszahlen.

Damit ist auch der Vorbehalt beantwortet, unter dem die Erhebung vom 13.08.2026 stand:
Die JSDoc-Pflicht aus T-01 hätte die Zeilenzahlen erhöhen und über die 400-Zeilen-Regel
neue Datei-Splits auslösen können — sie war zu diesem Zeitpunkt jedoch bereits in Kraft
und ist in den Zahlen enthalten. T-02 (`checkJs`) ist nicht umgesetzt worden (siehe
10.1.3 Ist gegen Plan) und hätte als reine Konfigurationsdatei ohnehin keine
Quellzeile verändert.

Das Projekt läuft auf **einer** Plattform — einem Browser mit WebAssembly- und
Canvas-2D-Unterstützung, ohne Installation und ohne Server (siehe 1.3 Details zum
Softwareprojekt). Geschrieben ist es in **zwei Programmiersprachen**, Rust für
die Simulation und JavaScript für Darstellung, Eingabe und UI, ergänzt um CSS, HTML
und eine JSON-Sprachdatei. Persistiert wird genau eine Sache: Bestleistung und
letzter Lauf, in `localStorage`, gekapselt in `round/roundRecords.js` (siehe 3.6
Persistenz). Geprüft wird
auf drei Ebenen — Rust-Unit-Tests, Rust-Tests an der Sprachgrenze unter `wasm-pack`,
JavaScript-Unit-Tests unter Vitest sowie End-to-End-Flows unter Playwright.

## 9.1 Methodik der Masszahlen

Die Zahlen werden nicht geschätzt, sondern erhoben. Die Befehle sind Teil der
Antwort — sie machen die Angaben reproduzierbar und prüfbar.

```bash
# Engine: Dateien und Zeilen
find engine/src -name '*.rs' | wc -l
find engine/src -name '*.rs' -exec wc -l {} + | sort -n

# Engine: Testfunktionen
grep -rho '#\[test\]' engine/src --include='*.rs' | wc -l

# Frontend: handgeschriebene Dateien und Zeilen (Build-Artefakte ausgenommen)
find frontend/src -name '*.js' -not -path '*/wasm/*' -not -path '*__tests__*' | wc -l
find frontend/src -name '*.js' -not -path '*/wasm/*' -not -path '*__tests__*' -exec wc -l {} + | sort -n

# Frontend: Testfälle
grep -rhoE '\b(it|test)\(' frontend/src --include='*.test.js' | wc -l

# Engine: Tests an der Sprachgrenze (laufen nur unter wasm-pack, nicht unter cargo test)
grep -rho '#\[wasm_bindgen_test\]' engine/tests | wc -l

# E2E-Fälle
grep -rhoE '\btest\(' frontend/e2e --include='*.spec.js' | wc -l

# Coverage, je Sprache getrennt erhoben
cd frontend && npm run test:coverage    # Tabelle je Datei + coverage/coverage-summary.json
cd engine   && cargo llvm-cov --lib --summary-only

# Weitere Assets
find frontend/styles -name '*.css' -exec wc -l {} +
wc -l frontend/index.html frontend/public/locales/en.json

# Ausgeliefertes Bundle
npm run build && find dist -type f -exec ls -l {} +

# Repository-Historie
git log --oneline | wc -l
git log --format='%s' | sed 's/^@ //' | grep -oE '^[a-z]+' | sort | uniq -c | sort -rn
```

Zwei Abgrenzungen sind dabei bewusst getroffen und müssen genannt werden, weil sie
sonst wie eine Auslassung wirken. Erstens ist `frontend/src/wasm/engine/` ein
**gitignoriertes Build-Artefakt** — von `wasm-pack` erzeugte JavaScript-Glue und
`.wasm`-Binärdatei. Es zählt nicht als Quellcode und ist in allen `find`-Aufrufen
ausgeschlossen. Zweitens liegen die Rust-Unit-Tests nach Rust-Konvention als
`#[cfg(test)]`-Module **in** den Produktivdateien; die Trennung in Tabelle 8 ist
daher nicht dateiweise, sondern anhand der Position des ersten
`#[cfg(test)]`-Attributs erhoben.

## 9.2 Größe und Verteilung

Das Projekt umfasst **159 handgeschriebene Quelldateien mit 25.317 Zeilen**. Davon
entfallen 12.503 Zeilen (49,4 %) auf Produktivcode, 11.543 Zeilen (45,6 %) auf Tests
und 1.271 Zeilen (5,0 %) auf Stylesheets, Markup und die Sprachdatei.

| Schicht                                   | Dateien | Zeilen |  Anteil |
| ----------------------------------------- | ------: | -----: | ------: |
| Engine — Produktivcode (`engine/src`)     |      36 |  3.569 |  14,1 % |
| Engine — Unit-Tests (`#[cfg(test)]`)      |       — |  3.362 |  13,3 % |
| Engine — Grenztests (`engine/tests`)      |       5 |  1.187 |   4,7 % |
| Frontend — Produktivcode (`frontend/src`) |      61 |  8.934 |  35,3 % |
| Frontend — Unit-Tests (`__tests__/`)      |      38 |  5.845 |  23,1 % |
| Frontend — E2E-Flows (`frontend/e2e`)     |      11 |  1.149 |   4,5 % |
| Assets (CSS, HTML, `en.json`)             |       8 |  1.271 |   5,0 % |
| **Summe**                                 | **159** | 25.317 | 100,0 % |

_Tabelle 8: Codeverteilung nach Architektur-Schicht_

Drei Aussagen stecken in diesen Zahlen. Erstens ist der **Testanteil mit 45,6 %
annähernd so groß wie der Produktivcode selbst** — die in 8.1 Unit Tests und
Coverage beschriebene Testpflicht für Mathematik- und Simulationsfunktionen ist
keine Absichtserklärung geblieben. Zweitens ist die Engine mit 3.569 Zeilen nur
**28,5 % des Produktivcodes**, obwohl sie die gesamte Simulation trägt. Das
widerspricht dem Schwerpunkt „Systemnah/WASM" nicht, sondern belegt die
Zweischichtigkeit aus 2.2 Architektur-Entscheidungen: die Engine kennt weder DOM
noch Canvas, hat also keine Zeile Darstellungscode; umgekehrt enthält das Frontend
keine Simulationsmathematik. Drittens verteilt sich der Frontend-Anteil sehr
ungleich — allein `renderer/` (22 Dateien, 3.307 Zeilen) und `ui/` (16 Dateien,
2.273 Zeilen) machen 62,5 % des Frontends aus. Darstellung braucht für dieselbe
Funktion mehr Zeilen als ihre Berechnung.

Innerhalb der Engine entfallen 5.310 Zeilen (27 Dateien) auf `simulation/`, 858
Zeilen (4 Dateien) auf `wasm_bridge/`, 397 Zeilen (3 Dateien) auf `math/` und 366
Zeilen auf `constants.rs` und `lib.rs`. Die Verzeichnisaufstellung je Datei steht im
Anhang (siehe 11.1 Tabellen, _Modulübersicht Engine_ und _Modulübersicht Frontend_).

Keine einzige Quelldatei überschreitet die in 6.2 Komponenten & Struktur
beschriebene 400-Zeilen-Grenze. Die größten sind `frontend/src/ui/frameTimeGraph.js`
mit 394 und `engine/src/simulation/flock.rs` mit 380 Zeilen — beide dicht genug an
der Grenze, dass die in 3.3 Modularisierung: Strukturierung der fachlichen Logik
beschriebene Aufteilungswirkung der Regel plausibel bleibt.

## 9.2b Coverage

Coverage wird **getrennt nach Sprache** erhoben und berichtet. Eine gemeinsame Zahl
wäre nicht nur unpräzise, sondern irreführend, weil die beiden Suiten
unterschiedliche Dinge erreichen können — die Begründung steht in 8.1 Unit Tests und
Coverage.

| Suite                                        |   Lines | Functions | Branches / Regions |
| -------------------------------------------- | ------: | --------: | -----------------: |
| Engine, `cargo llvm-cov --lib` (28 Dateien)  | 90,25 % |   92,49 % |  91,40 % (Regions) |
| Frontend, `@vitest/coverage-v8` (60 Dateien) | 45,42 % |   50,25 % | 48,13 % (Branches) |

_Tabelle 9: Coverage je Sprache_

Beide Zahlen brauchen eine Einordnung, sonst liest sich die eine zu gut und die
andere wie ein Versäumnis.

**Engine.** 21 der 28 Dateien stehen bei 100 % Lines. Die 90,25 % entstehen fast
vollständig durch drei Dateien bei 0 %: `wasm_bridge/mod.rs`,
`wasm_bridge/frame_buffers.rs` und `wasm_bridge/response.rs`. Diese Null ist ein
**Messartefakt, kein Testloch**. `cargo llvm-cov` instrumentiert das Host-Target,
die zuständigen Tests laufen jedoch auf `wasm32` im Browser und werden nur von
`wasm-pack test` ausgeführt — 41 `#[wasm_bindgen_test]`-Fälle in `engine/tests`,
die genau diese drei Dateien vollständig ausüben (siehe 5.2.1 Der Puffer-Vertrag).
Rechnet man sie heraus, liegt die Simulation bei **98,73 % Lines**. Umgekehrt gilt:
ein grünes `cargo test` sagt über die Sprachgrenze nichts aus, weil
`#[wasm_bindgen_test]` auf dem Host zu nichts expandiert und die Dateien dort 0
Tests melden.

**Frontend.** Der Gesamtwert ist niedrig, weil `all: true` gesetzt ist und **jedes**
Modul mitzählt, auch die, die eine Node-Testumgebung strukturell nicht erreicht.
Aussagekräftig ist nicht der Mittelwert, sondern die Form der Verteilung: von 60
Dateien stehen **28 bei 100 %**, **23 bei 0 %** und nur 9 dazwischen. Die 0 %-Gruppe
ist ohne Ausnahme DOM- oder WASM-gebunden — `index.js`, `engine-bridge.js`,
`canvasRenderer.js`, `hud.js`, `menu*.js`, `inputManager.js`. Diese Hälfte deckt die
Playwright-Suite ab (54 E2E-Fälle in 10 Spec-Dateien, siehe 8.2 E2E Tests). Die
Zweigipfeligkeit ist damit kein Zufall, sondern das direkte Abbild der
Modularisierungsregel aus 3.3 Modularisierung: Strukturierung der fachlichen
Logik — rechenbare Arithmetik wird bewusst in
importfreie Module wie `dashPulse.js` oder `frameGraphScale.js` herausgezogen, und
genau diese Module stehen bei 100 %.

Die vollständigen Tabellen je Datei — nach Wert sortiert, damit die Zweiteilung
sichtbar wird — stehen im Anhang (siehe 11.1 Tabellen, _Coverage je Modul_).

## 9.3 Weitere Masszahlen

**Testumfang.** 206 Rust-Unit-Tests, 41 Rust-Grenztests unter `wasm-pack`, 475
Vitest-Fälle in 38 Dateien und 54 Playwright-Fälle in 10 Spec-Dateien — zusammen
**776 automatisierte Testfälle**. Auf die 3.569 Zeilen Engine-Produktivcode kommen
damit 247 Rust-Tests, rechnerisch einer je 14 Zeilen.

**Breite der Sprachgrenze.** Die WASM-Schnittstelle besteht aus **2 exportierten
Typen und 23 exportierten Funktionen**: `GameEngine` mit Konstruktor, `tick`,
`snapshot`, `set_wave` und `resize`, sowie `FrameResponse` mit 18 Gettern. Mehr
`#[wasm_bindgen]`-Symbole gibt es im gesamten Projekt nicht. Das belegt die Aussage
aus 5.1 Wesentliche Komponenten quantitativ: fünf Methoden tragen den gesamten
Spielablauf, die übrigen 18 Symbole sind reine Lesezugriffe auf die sieben Puffer
eines Frames (siehe 11.1 Tabellen, _Die sieben Puffer eines Frames_).

**Ausgeliefertes Bundle.** `npm run build` erzeugt 198,1 kB in `dist/`, davon 47,5 kB
WebAssembly-Binärdatei, 64,7 kB Anwendungs-JavaScript (20,9 kB gzip), 5,4 kB
`wasm-bindgen`-Glue, 14,5 kB CSS (3,6 kB gzip), 53,7 kB Schriftarten samt Lizenztexten
sowie 2,8 kB Sprachdatei. Für eine Anwendung mit Schwerpunkt „Systemnah/WASM" ist die
Größe des `.wasm`-Moduls die aussagekräftigste Einzelzahl: **47,5 kB** für die
komplette Simulation, erreicht ohne Zutun durch `wasm-opt` im Release-Profil (siehe
7.9 Production Build). Das gesamte Spiel lädt damit in einem einzigen
Netzwerk-Roundtrip-Fenster und erfüllt das Ziel „installationslos und serverfrei"
aus 1.2 Die Lösung nicht nur formal.

**Internationalisierung.** Eine Locale (`en`) mit 70 Schlüsseln in
`frontend/public/locales/en.json`. Die Zahl ist zugleich die Untergrenze für die
Regel „keine hartcodierten nutzersichtbaren Strings" aus 6.2 Komponenten & Struktur — jeder im UI sichtbare
Text hat dort einen Eintrag.

**Repository-Historie.** 108 Commits zwischen dem 03.05.2026 und dem 20.08.2026.
Ihre Verteilung nach Conventional-Commit-Typ belegt die in 6.3 Entwicklungsprozess &
Workflow beschriebene Commit-Disziplin mit Daten:

| Typ        | Anzahl | Anteil |
| ---------- | -----: | -----: |
| `feat`     |     41 | 38,0 % |
| `docs`     |     29 | 26,9 % |
| `refactor` |     12 | 11,1 % |
| `chore`    |      9 |  8,3 % |
| `fix`      |      8 |  7,4 % |
| `test`     |      5 |  4,6 % |
| übrige     |      4 |  3,7 % |

_Tabelle 10: Commits nach Conventional-Commit-Typ_

Bemerkenswert sind zwei Verhältnisse. Der `docs`-Anteil von 26,9 % ist die
messbare Folge der Entscheidung, den Bericht **begleitend** zu schreiben statt
nachgelagert (siehe 6.3 Entwicklungsprozess & Workflow) — ein Viertel aller
Commits verändert ausschließlich Dokumentation. Und `fix` liegt mit 8 Commits
**unter** `refactor` mit 12; die Umbauten waren häufiger als die Fehlerbehebungen,
was zu einem Projekt passt, dessen Architektur sich während der Entwicklung noch
verdichtet hat (die vier Ordner-Zusammenlegungen unter `simulation/` sind vier
dieser zwölf).

Ein negativer Befund gehört dazu: **fünf der 108 Commit-Titel tragen ein
versehentliches Präfix `@ `** und sind damit streng genommen nicht
Conventional-Commits-konform. Der Anteil formal korrekter Titel liegt bei 95,4 %.
Inhaltlich sind auch diese fünf regelkonform aufgebaut (`docs:` bzw.
`refactor(engine):`); korrigiert wurden sie nicht, weil ein History-Rewrite auf
einem bereits geteilten Branch teurer wäre als der Schönheitsfehler.

**KI-Nutzung.** 77 protokollierte Prompts in 13 Sitzungsdateien unter `ai/`,
thematisch verteilt auf `prozess-doku` (30), `frontend-ui` (22), `engine` (14),
`tooling-tests` (6), `loop-input` (3) und `wasm-bridge` (2). Die Verteilung ist der
Abdruck der Projektphasen: `prozess-doku` steht seit dem 13.08.2026 an der Spitze,
weil in dieser Phase ausschließlich der Bericht entsteht, während `engine` und
`wasm-bridge` mit zusammen 16 Prompts seit dem Code-Freeze der Simulation nicht mehr
gewachsen sind. Die vollständige Auflistung ist Kapitel 12 KI-Verzeichnis und wird aus
denselben Dateien generiert.

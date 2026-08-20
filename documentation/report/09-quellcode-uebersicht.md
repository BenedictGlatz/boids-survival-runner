# 9 Quellcode-Übersicht

`Seitenbudget: ~1 S. | Status: Fertig | Quellen: die Befehle in 11.3`

**Dies ist die einzige Stelle im Bericht, an der Zahlen stehen.** LOC, Dateizahlen,
Testzahlen, Coverage-Prozente und Commit-Zahlen gehören ausschließlich hierher; alle
anderen Kapitel verweisen zurück. Sonst tauchen dieselben Zahlen in mehreren Kapiteln
auf und laufen bis zur Abgabe auseinander. Sie sind nicht geschätzt, sondern mit den
im Anhang abgedruckten Befehlen erhoben (siehe 11.3 Quellcode-Ausschnitte,
_Erhebungsbefehle der Masszahlen_), Stand 20.08.2026. Diese Erhebung ist die
abschließende: seit dem 13.08.2026 ist keine Zeile Produktiv-, Test- oder Asset-Code
mehr verändert worden.

Das Projekt läuft auf **einer** Plattform — einem Browser mit WebAssembly- und
Canvas-2D-Unterstützung, ohne Installation und ohne Server (siehe 1.3 Details zum
Softwareprojekt). Geschrieben ist es in **zwei Programmiersprachen**, Rust für die
Simulation und JavaScript für Darstellung, Eingabe und UI, ergänzt um CSS, HTML und
eine JSON-Sprachdatei mit 70 Schlüsseln. Persistiert wird genau eine Sache:
Bestleistung und letzter Lauf, in `localStorage`, gekapselt in `round/roundRecords.js`
(siehe 3.6 Persistenz). Geprüft wird auf **vier Ebenen** — Rust-Unit-Tests, Rust-Tests
an der Sprachgrenze unter `wasm-pack`, JavaScript-Unit-Tests unter Vitest und
End-to-End-Flows unter Playwright.

## 9.1 Größe und Verteilung

Das Projekt umfasst **159 handgeschriebene Quelldateien mit 25.317 Zeilen**, davon
12.503 Zeilen (49,4 %) Produktivcode, 11.543 Zeilen (45,6 %) Tests und 1.271 Zeilen
(5,0 %) Stylesheets, Markup und Sprachdatei. Zwei Abgrenzungen sind dabei bewusst
getroffen: `frontend/src/wasm/engine/` ist ein gitignoriertes Build-Artefakt von
`wasm-pack` und zählt nicht als Quellcode, und die Rust-Unit-Tests liegen nach
Rust-Konvention als `#[cfg(test)]`-Module _in_ den Produktivdateien — ihre Trennung in
Tabelle 8 ist daher nicht dateiweise, sondern anhand der Position des ersten
`#[cfg(test)]`-Attributs erhoben.

| Schicht                                   | Dateien |     Zeilen |  Anteil |
| ----------------------------------------- | ------: | ---------: | ------: |
| Engine — Produktivcode (`engine/src`)     |      36 |      3.569 |  14,1 % |
| Engine — Unit-Tests (`#[cfg(test)]`)      |       — |      3.362 |  13,3 % |
| Engine — Grenztests (`engine/tests`)      |       5 |      1.187 |   4,7 % |
| Frontend — Produktivcode (`frontend/src`) |      61 |      8.934 |  35,3 % |
| Frontend — Unit-Tests (`__tests__/`)      |      38 |      5.845 |  23,1 % |
| Frontend — E2E-Flows (`frontend/e2e`)     |      11 |      1.149 |   4,5 % |
| Assets (CSS, HTML, Sprachdatei)           |       8 |      1.271 |   5,0 % |
| **Summe**                                 | **159** | **25.317** | 100,0 % |

_Tabelle 8: Codeverteilung nach Architektur-Schicht_

Drei Aussagen stecken in diesen Zahlen. Erstens ist der **Testanteil mit 45,6 %
annähernd so groß wie der Produktivcode selbst** — die in 8.1 Unit Tests und Coverage
beschriebene Testpflicht für Mathematik- und Simulationsfunktionen ist keine
Absichtserklärung geblieben. Zweitens trägt die Engine mit **28,5 % des
Produktivcodes** die gesamte Simulation, weil sie keine Zeile Darstellungscode
enthält; das widerspricht dem Schwerpunkt „Systemnah/WASM" nicht, sondern belegt die
Zweischichtigkeit aus 2.2 Architektur-Entscheidungen — umgekehrt enthält das Frontend
keine Simulationsmathematik. Drittens machen Renderer und Oberfläche mit zusammen
5.580 Zeilen **62,5 % des Frontends** aus: Darstellung braucht für dieselbe Funktion
mehr Zeilen als ihre Berechnung. Keine Datei überschreitet die in 6.2 Komponenten &
Struktur beschriebene 400-Zeilen-Grenze; die größten sind
`frontend/src/ui/frameTimeGraph.js` mit 394 und `engine/src/simulation/flock.rs` mit
380 Zeilen — beide dicht genug an der Grenze, dass ihre Aufteilungswirkung plausibel
bleibt.

## 9.2 Coverage

Coverage wird **getrennt je Sprache** erhoben, weil eine gemeinsame Zahl verdecken
würde, welche Hälfte tatsächlich geprüft ist (Begründung in 8.1 Unit Tests und
Coverage). Die Engine liegt bei **90,25 % der Zeilen**, das Frontend bei **45,42 %**.
Beide Werte brauchen eine Einordnung, sonst liest sich der eine zu gut und der andere
wie ein Versäumnis.

Die Lücke der Engine ist ein **Messartefakt, kein Testloch**: `cargo llvm-cov`
instrumentiert das Host-Target, die 41 Grenztests laufen jedoch im Browser unter
`wasm-pack`. Sie üben genau die drei Dateien der Bindungsschicht aus, die der Report
mit 0 % ausweist; ohne diese liegt die Simulation bei **98,73 %**. Im Frontend ist
nicht der Mittelwert aussagekräftig, sondern die Form der Verteilung — von 60 Modulen
stehen **28 bei 100 %, 23 bei 0 % und nur 9 dazwischen**. Die 23 sind ausnahmslos
DOM- oder WASM-gebunden und werden von der Playwright-Suite abgedeckt. Die
Zweigipfeligkeit ist damit kein Zufall, sondern das Abbild der Modularisierungsregel
aus 3.3 Modularisierung: Strukturierung der fachlichen Logik — rechenbare Arithmetik
wird bewusst in importfreie Module herausgezogen, und genau diese stehen bei 100 %.
Die Werte je Modul stehen im Anhang (siehe 11.1 Tabellen, _Coverage je Modul_).

## 9.3 Weitere Masszahlen

**Testumfang.** 206 Rust-Unit-Tests, 41 Grenztests unter `wasm-pack`, 475 Vitest- und
54 Playwright-Fälle ergeben zusammen **776 automatisierte Testfälle**. Auf die 3.569
Zeilen Engine-Produktivcode kommen 247 Rust-Tests, rechnerisch einer je 14 Zeilen.

**Breite der Sprachgrenze.** Die WASM-Schnittstelle besteht aus **2 exportierten Typen
und 23 exportierten Funktionen** — `GameEngine` mit fünf Methoden, `FrameResponse` mit
18 Gettern; mehr `#[wasm_bindgen]`-Symbole gibt es im Projekt nicht. Das belegt 5.1
Wesentliche Komponenten quantitativ: fünf Methoden tragen den gesamten Spielablauf,
die übrigen Symbole sind reine Lesezugriffe auf die sieben Puffer eines Frames (siehe
11.1 Tabellen, _Die sieben Puffer eines Frames_).

**Ausgeliefertes Bundle.** `npm run build` erzeugt **198,1 kB**, davon **47,5 kB
WebAssembly** und 64,7 kB Anwendungs-JavaScript (20,9 kB gzip). Für einen Schwerpunkt
„Systemnah/WASM" ist die Größe des `.wasm`-Moduls die aussagekräftigste Einzelzahl:
47,5 kB für die komplette Simulation, erreicht ohne Zutun durch `wasm-opt` im
Release-Profil (siehe 7.9 Production Build). Das Spiel lädt damit in einem einzigen
Netzwerk-Roundtrip-Fenster und erfüllt das Ziel „installationslos und serverfrei" aus
1.2 Die Lösung nicht nur formal.

**Repository-Historie.** Die Historie zählt **108 Commits** zwischen dem 03.05.2026
und dem 20.08.2026, davon **26,9 % Dokumentation** — gut ein Viertel aller Commits
verändert ausschließlich den Bericht und macht die Entscheidung aus 6.3
Entwicklungsprozess & Workflow, begleitend statt nachgelagert zu schreiben, messbar.
`fix` liegt mit 8 Commits zudem **unter** `refactor` mit 12, was zu einem Projekt
passt, dessen Architektur sich während der Entwicklung noch verdichtet hat; die
Verteilung je Typ steht im Anhang (siehe 11.1 Tabellen, _Commits nach
Conventional-Commit-Typ_). Ein negativer Befund gehört dazu: **fünf der 108
Commit-Titel tragen ein versehentliches Präfix `@ `** und sind formal nicht
Conventional-Commits-konform, der Anteil korrekter Titel liegt bei 95,4 %. Ein
History-Rewrite auf einem geteilten Branch wäre teurer als der Schönheitsfehler.

**KI-Nutzung.** Protokolliert sind **78 Prompts in 13 Sitzungsdateien** unter `ai/`;
ihre Aufschlüsselung steht in Kapitel 12 KI-Verzeichnis.

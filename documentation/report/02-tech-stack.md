# 2 Technik Stack

`Seitenbudget: ~2 S. | Status: Entwurf | Quellen: engine/Cargo.toml, engine/Cargo.lock, frontend/package.json, frontend/package-lock.json, .github/copilot-instructions.md §Tech Stack, CLAUDE.md §Architecture`

Dieses Kapitel nennt die eingesetzten Technologien und jeweils den Grund für ihre Wahl.
Es ist absichtlich knapp gehalten: Was aus den Entscheidungen technisch folgt, steht in
den Kapiteln 3 bis 5, was jedes einzelne Werkzeug tut, in Kapitel 7 Tooling. Die
vollständige Fassung des Tech Stack Canvas mit allen Versionsangaben liegt im Anhang
(siehe 11.1 Tabellen, „Tech Stack Canvas — Langfassung").

## 2.1 Rahmenbedingungen

**Zielplattform** ist der aktuelle Desktop-Browser, und zwar ohne Zusatz: Das Spiel muss
installationsfrei und serverlos laufen (siehe 1.3 Details zum Softwareprojekt). Technisch
verlangt es damit nur zwei Fähigkeiten, die jeder aktuelle Browser mitbringt —
WebAssembly und einen 2D-Canvas-Kontext. Alles, was ausgeliefert wird, ist eine Menge
statischer Dateien; zur Laufzeit gibt es keinen Prozess außerhalb des Browsertabs. Das ist
keine Sparmaßnahme, sondern die Rahmenbedingung, aus der die restliche Stack-Wahl folgt:
Was nicht in den Browser passt, kann nicht Teil der Lösung sein.

**Die Sprachwahl** ist damit zur Hälfte vorgegeben und zur Hälfte eine Entscheidung. Für
Darstellung und Eingabe gibt es im Browser keine Alternative zu **JavaScript**, hier in
Form von ES-Modulen ohne Transpilations-Schritt. Für die Simulation ist **Rust** gewählt,
und zwar aus drei strukturellen Gründen: Rust übersetzt vor der Ausführung nach
WebAssembly, statt zur Laufzeit optimiert zu werden; es hat keine automatische
Speicherbereinigung, kann also im Pfad, der 60-mal pro Sekunde durchlaufen wird, keine
Pause durch einen Garbage-Collector erzeugen; und es rechnet auf Werten fester Größe, ohne
dass Zahlen als Objekte im Speicher liegen. Der Aufwand der Schwarmsimulation wächst
quadratisch mit der Boid-Zahl (siehe 1.4 Entwicklungsfokus) — genau dort zahlen sich diese
drei Eigenschaften aus, und nur dort. Verwendet wird die stabile Toolchain in Edition 2021,
verwaltet über Cargo.

**Die Sprachgrenze** überbrückt `wasm-bindgen`: Es erzeugt aus den annotierten Rust-Typen
das JavaScript-Gegenstück, sodass die Engine als gewöhnliches ES-Modul importierbar ist.
`wasm-pack` ist das Build-Werkzeug darüber und wird mit `--target web` aufgerufen, weil das
Ergebnis dann ohne weiteren Bundler-Schritt lädt. Die Bibliothek `js-sys` steht nur an
einer einzigen Stelle im Quellcode (`wasm_bridge/response.rs`) und liefert dort die beiden
Typen `Float32Array` und `Uint32Array`, in denen ein Frame die Sprachgrenze überquert. Dass
diese Abhängigkeit an genau einer Stelle auftaucht, ist der Zustand, den die schmale
Schnittstelle aus 2.2 herbeiführen soll.

**Node.js** ist ausdrücklich **kein** Bestandteil des ausgelieferten Produkts, sondern nur
der Entwicklungsumgebung: Es baut, testet, prüft und formatiert. Der Endnutzer lädt eine
Seite, keinen Server. Diese Unterscheidung ist wichtig für die Lesart des Canvas in 2.3 —
die Hälfte der dort genannten Technologien läuft nie auf dem Rechner eines Spielers.

## 2.2 Architektur-Entscheidungen

Drei Entscheidungen tragen den Aufbau. Sie werden hier genannt und begründet; ihre
technische Umsetzung ist Gegenstand der Kapitel 4 und 5.

**Zwei Schichten mit absichtlich schmaler Grenze.** Die Engine besitzt die vollständige
Simulation und kennt weder DOM noch Canvas noch eine andere Browser-Schnittstelle; das
Frontend besitzt Darstellung, Eingabe und Spielzustand und enthält keine
Simulationsmathematik. Der Grund ist nicht Ordnungsliebe, sondern Prüfbarkeit: So laufen
die Engine-Tests ohne Browser und die Frontend-Tests ohne gebautes WASM-Paket, was beide
Testläufe schnell und unabhängig voneinander macht (siehe 8.1 Unit Tests und Coverage).
Eine geteilte Zuständigkeit — etwa Kollisionsprüfung auf beiden Seiten — würde diesen
Vorteil sofort aufheben.

**Fester Zeitschritt statt Skalierung mit der Bildzeit.** Ein Aufruf der Engine rechnet
genau einen Simulationsschritt und multipliziert nichts mit der vergangenen Zeit; das
Frontend ruft sie mit konstanter Rate auf und drosselt nur das Zeichnen. Der Grund ist,
dass in der Engine jede Dauer in **Schritten** zählt und nicht in Millisekunden — von den
Dash-Phasen über den Wellenfortschritt bis zur Auswahl, welcher Boid als Nächstes
losstürmt. Diese Auswahl wird deterministisch aus dem Schrittzähler abgeleitet; einen
Zufallszahlengenerator gibt es in der Engine bewusst nicht. Eine an die
Bildwiederholfrequenz gekoppelte Schrittzahl würde dieselbe Runde auf zwei Rechnern
unterschiedlich ablaufen lassen und jede schrittbasierte Konstante samt ihren Tests
umrechnungspflichtig machen (siehe 4.2.1 Eine wesentliche Komponente: Darstellung des
Aufbaus — Bausteinsicht).

**Flache typisierte Puffer statt Objekten pro Entität.** Ein Frame verlässt die Engine als
eine Handvoll Zahlenfelder mit festem Zeilenabstand, nicht als Liste von Objekten. Der
Grund ist die Kostenstruktur des Grenzübertritts: Ein Objekt pro Boid bedeutet eine
Konvertierung pro Boid und damit Kosten, die mit der Entitätszahl wachsen — also genau mit
der Größe, die das Spiel steigern will. Ein Puffer dagegen wird einmal übergeben, unabhängig
davon, wie viele Boids darin stehen (siehe 5.2.1 Der Puffer-Vertrag).

Aus den Rahmenbedingungen folgt ebenso deutlich, **was es nicht gibt**, und in allen fünf
Fällen ist das eine Entscheidung und kein Rückstand:

- **Kein Backend, keine Datenbank, keine externe API, kein Konto.** Das ist die
  Rahmenbedingung aus 1.3 selbst; jede dieser vier Komponenten würde sie brechen.
- **Kein UI-Framework.** Der DOM-Anteil besteht aus einem Startmenü, einem HUD und zwei
  Overlays; alles, was sich pro Bild ändert, liegt auf dem Canvas. Ein Framework würde also
  gerade dort nichts beitragen, wo die Arbeit anfällt, und im Gegenzug einen
  Abgleichmechanismus in den Bildpfad legen.
- **Keine Spiel- oder Physikbibliothek.** Die Simulation ist der Gegenstand des Projekts.
  Sie einzukaufen, hieße das Fokus-Thema auszulagern.
- **Kein `rand`-Crate in der Engine.** Alles, was zufällig aussieht — Spawnorte,
  Hindernisformen, Dash-Auswahl — wird per Ganzzahl-Streuung aus dem Schrittzähler
  abgeleitet, damit eine Runde reproduzierbar bleibt.
- **Keine Laufzeit-Abhängigkeit im Frontend.** Alle npm-Pakete des Projekts sind
  `devDependencies`; im Bundle landet ausschließlich eigener Code (siehe 7.2 Package
  Management).

**Die Daten** liegen entsprechend im Browser. Der persönliche Bestwert wird über
`localStorage` gehalten, und zwar bestmöglich: Fehlt der Speicher oder verweigert er den
Zugriff, spielt die Runde weiter und nur der Bestwert fehlt (siehe 3.6 Persistenz). Die
Sprachdateien sind statische JSON-Dateien, die zur Laufzeit nachgeladen werden, weshalb sie
unter `public/` liegen müssen und nicht im Modulgraph.

## 2.3 Tech Stack Canvas

Die folgende Tabelle fasst den Stack nach Schichten zusammen. Die Langfassung mit
Versionsangaben je Paket steht im Anhang (siehe 11.1 Tabellen, „Tech Stack Canvas —
Langfassung"), weil die Versionen dort nachgeführt werden können, ohne den Fließtext
anzufassen.

| Schicht            | Technologie                                                       | Zweck                                             |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------- |
| Simulation         | Rust (Edition 2021, Cargo)                                        | Schwarm, Hindernisse, Wellen, Kollisionen         |
| Sprachgrenze       | `wasm-bindgen`, `js-sys`, `wasm-pack`                             | Engine als ES-Modul, Frame-Puffer über die Grenze |
| Präsentation       | JavaScript (ES-Module), HTML5 Canvas 2D, CSS                      | Rendering, Eingabe, Menü und HUD                  |
| Build              | Vite, npm                                                         | Dev-Server, Produktionsbündel, Paketverwaltung    |
| Qualitätssicherung | Vitest, Playwright, ESLint, Prettier, `cargo test`/`clippy`/`fmt` | Unit-, E2E- und Statikprüfung beider Sprachen     |

**Versionen sind zweistufig festgelegt.** Deklariert sind in `Cargo.toml` und
`package.json` nur Bereiche (`"0.2"`, `"^5.0.0"`); die tatsächlich gebaute Fassung steht in
`Cargo.lock` und `package-lock.json`, und **beide Lockfiles sind eingecheckt**. Damit ist
der Paketstand reproduzierbar. Nicht festgelegt ist die Toolchain selbst: Es gibt keine
`rust-toolchain.toml`, und `wasm-pack` ist ein lokal installiertes Kommandozeilenwerkzeug.
Der Build hängt also am Entwicklungsrechner — ein offener Punkt, der genau dann geschlossen
wird, wenn eine Pipeline die Versionen benennen muss (siehe 8.3 CI/CD: GitHub Actions
Pipeline).

**Drei Positionen des Anforderungskatalogs fehlen im Canvas und werden hier benannt statt
übergangen.** **TypeScript** ist nicht eingerichtet: Es war als Typprüfung über `checkJs`
für vorhandenen JavaScript-Code geplant (T-02) und ist hinter die Testmaßnahmen einsortiert
worden, weil ein Testlauf Fehler in der Logik findet und `checkJs` in den Signaturen (siehe
7.6 TypeScript). **Eine `vite.config.js` existiert nicht**, weil die Vorgaben von Vite für
dieses Projekt genügen — die Datei war für den Basispfad des Deployments vorgesehen und
teilt daher dessen Status (siehe 7.10 Deployment). **Eine CI/CD-Pipeline** gibt es nicht;
`.github/` enthält bislang nur die Anweisungsdatei für die KI-Unterstützung. Alle drei
Lücken sind im Kapazitätsplan als Rangfolge und nicht als Versäumnis begründet (siehe 10.1
Kapazitätsplan).

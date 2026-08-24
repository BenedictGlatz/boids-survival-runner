# Nachträge zum Abgleich mit der neuen Vorlage

Handoff für Claude-for-Word. Grundlage: `BIN24_Fortg_Programmierung_Prüfungsleistung_Bolender_Glatz_v001.pdf`
(Stand der Word-Datei) gegen `Projekt-_und_Architekturdokumentation_Vorlage_Fortgeschrittene_Programmierung_v2.md`.

Ziel ist **nicht**, die Vorlage Feld für Feld nachzubauen, sondern die Themengebiete zu schließen, die
in der Doku bisher gar nicht vorkommen — mit einzelnen Sätzen bzw. sehr kurzen Absätzen an der
jeweils passenden Stelle. Alle unten genannten Werte, Pfade und Dateinamen sind am 24.08.2026 gegen
das Repository geprüft; nichts davon ist geschätzt.

---

## 0 Anweisung für Word

1. Jeden Nachtrag **an der genannten Ankerstelle** einfügen — in der Regel als neuer Satz am Ende
   eines bestehenden Absatzes oder als eigener kurzer Absatz direkt darunter. Bestehende Sätze
   nicht umschreiben, nicht kürzen, nicht umstellen.
2. **Markierung des Neuen:** jeden eingefügten Text mit **gelber Texthervorhebung** versehen
   (Zeichenformat „Hervorheben“, gelb). Ist das nicht möglich, den Nachtrag stattdessen in
   `⟦NEU⟧ … ⟦/NEU⟧` klammern. Falls in Word „Änderungen nachverfolgen“ aktiviert werden kann, ist
   das die bessere Variante — dann zusätzlich zur Hervorhebung nichts weiter nötig.
3. Formatierung: Fließtext im Stil der Dokumentation, keine neuen Überschriften außer bei
   Nachtrag 22 und 24, die ausdrücklich als eigener Abschnitt gedacht sind. Keine neuen Tabellen —
   wo die Vorlage eine Tabelle vorsieht, ist der Inhalt hier absichtlich zu Prosa verdichtet.
4. Nummerierungen, Abbildungs- und Tabellenverweise bleiben unverändert; keiner der Nachträge
   erzeugt eine neue Abbildung oder Tabelle.
5. Reihenfolge: von hinten nach vorn arbeiten (Nachtrag 24 zuerst), dann verschieben sich die
   Seitenzahlen der noch offenen Anker nicht.

---

## 1 Was die Vorlage verlangt und in der Doku fehlt (Überblick)

| Vorlagen-Bereich | Lücke in der Doku | Nachtrag |
|---|---|---|
| Deckblatt-Metadaten | Repository, Branch/Commit der Abgabe, Ausführungsumgebung | 1 |
| Anforderungen: Erfolgskriterium | nicht genannt | 2 |
| Anforderungen: nicht-funktionale Ziele mit Messkriterium | nur Bildrate implizit | 3 |
| Anforderungen: Annahmen, Nicht-Ziele, organisatorische Randbedingungen | teils, nicht als Abgrenzung | 4 |
| Tech Stack: Versionen + Nachweis (Manifeste, Lockfiles) | keine Versionen genannt | 5 |
| Tech Stack: Alternativen und Trade-off je Entscheidung | Alternativen fehlen | 6 |
| Tech Stack: KI-Engineering als Stack-Ebene | fehlt | 7 |
| Frontend: UI-Zustände inkl. „WASM noch nicht initialisiert“ | fehlt | 8 |
| Frontend: Styling-Strategie, Accessibility, Dateikonventionen | fehlt | 9 |
| Frontend: Persistenz-Format, Recovery, Datenschutz | nur „Highscore wird gespeichert“ | 10 |
| Frontend: Fehlerbehandlung, Nutzerfeedback | fehlt | 11 |
| Engine: Fehlerkonzept, kein `unsafe`, keine Nebenläufigkeit | fehlt | 12 |
| Engine: generierter vs. eigener Code | fehlt | 13 |
| Engine: Toolchain, WASM-Target, Build-Profile | fehlt | 14 |
| Engine: Persistenz „nicht anwendbar“ | fehlt | 15 |
| Integration: Speicher/Ownership, Kopien statt Views | fehlt | 16 |
| Integration: Initialisierung, Fehlerzustand, Browser-Anforderung | fehlt (negativer Befund) | 17 |
| Integration: Overhead gemessen statt vermutet | Behauptung ohne Messung | 18 |
| KI: Abgrenzung KI-Beitrag / menschliche Verantwortung | fehlt | 19 |
| KI: Kontextschichten und Kontextpflege | nur CLAUDE.md genannt | 20 |
| KI: Fehlannahme der KI als konkretes Beispiel | fehlt (Pflichtpunkt) | 21 |
| KI: Grenzen und bewusste Nicht-Automatisierung | fehlt | 22 |
| Tooling: Package Management, Lockfiles, Pinning | fehlt | 23 |
| Tooling: Dev-Build-Komfort, Sourcemaps, Panic-Verhalten | fehlt | 24 |
| Tooling: Produktionsbuild, Optimierung, Artefaktgrößen | fehlt | 25 |
| Qualität: Teststil, Ausschlüsse, Schwellenwerte | fehlt | 26 |
| Qualität: E2E-Reichweite, Browser, Flake-Umgang, Report | fehlt | 27 |
| Qualität: Lighthouse | fehlt (muss als n. a. begründet werden) | 28 |
| Qualität: Kommentar- und Namenskonventionen | fehlt | 29 |
| Quellcode-Übersicht: Abhängigkeiten, Artefaktgrößen, Messstand | fehlt | 30 |
| Projektbericht: Abschlussabgleich mit der Abgabe | fehlt | 31 |

---

## 2 Die Nachträge

### Nachtrag 1 — Deckblatt bzw. Fußzeile des Deckblatts

**Anker:** Deckblatt, direkt unter „Ende der Bearbeitungsfrist: 26.08.2026“.

**Einfügen:**

> Repository: `boids-survival-runner`, Branch `dev`; bewerteter Stand ist der zum Code-Freeze nach
> `main` überführte Commit. Ausführung lokal über `cd frontend && npm install && npm run dev`; ein
> öffentliches Deployment existiert nicht.

**Grund:** Die Vorlage fordert im Kopfdatenblock Repository, Branch/Tag/Commit der Abgabe und die
Ausführungsumgebung. Bitte den Commit-Hash beim finalen Merge nachtragen.

---

### Nachtrag 2 — Kapitel 1.1, Ende des Abschnitts

**Anker:** nach „… wenn die anfängliche Lebensanzeige von drei auf null sinkt.“

**Einfügen:**

> Als erfolgreich gilt die Lösung, wenn eine Runde ohne Installation und ohne Konto direkt im
> Browser startet, die Simulation auch bei mehreren hundert Boids mit konstanter
> Spielgeschwindigkeit läuft und derselbe Spielverlauf auf unterschiedlich schnellen Rechnern
> gleich abläuft.

**Grund:** Vorlage „Erfolgskriterium“ im Themensteckbrief.

---

### Nachtrag 3 — Kapitel 1.3, nach der Aufzählung der Spezifikationen

**Anker:** nach „… und temporäre Hindernisse (S-07).“

**Einfügen:**

> Neben dem Funktionsumfang stehen drei nicht-funktionale Ziele, jedes mit einem prüfbaren Maß:
> die Bildrate bleibt bei der Zielgröße des Menüs (Frametime-Overlay im Spiel), Linter, Formatter
> und beide Testsuiten laufen fehler- und warnungsfrei (`npm run lint`, `npm test`,
> `cargo clippy`, `cargo test`), und keine Quelldatei überschreitet 400 Zeilen als Maß für die
> Wartbarkeit.

**Grund:** Vorlage „Qualitätsziele und nicht-funktionale Anforderungen“ mit Messkriterium und
Nachweis. Bewusst kurz gehalten, da die Werte selbst in Kapitel 9 und 10 stehen.

---

### Nachtrag 4 — Kapitel 1.3, direkt vor dem Satz zur Abgabe

**Anker:** vor „Die Abgabe am 26.08.2026 begrenzt das Projekt …“

**Einfügen:**

> Organisatorisch begrenzen das Projekt ein Zweierteam und ein Zeitbudget im Rahmen der
> Veranstaltung. Angenommen ist ein aktueller Desktop-Browser mit WebAssembly-Unterstützung und
> Tastatur; ausdrücklich nicht Bestandteil sind Server, Datenbank, Benutzerkonten,
> Mehrspielerbetrieb, Touch- oder Mobilbedienung sowie eine räumliche Beschleunigungsstruktur für
> die Nachbarsuche.

**Grund:** Vorlage „Randbedingungen, Annahmen und Abgrenzung“ inkl. Nicht-Ziele.

---

### Nachtrag 5 — Kapitel 2.3, direkt unter Tabelle 1

**Anker:** nach der Beschriftung „Tabelle 1: Tech Stack Canvas“.

**Einfügen:**

> Die Versionen stehen in den Manifesten und sind über die mitversionierten Lockfiles
> reproduzierbar: die Engine auf Rust Edition 2021 mit `wasm-bindgen` 0.2 und `js-sys` 0.3
> (`engine/Cargo.toml`, `engine/Cargo.lock`), das Frontend auf Vite 5, Vitest 4, Playwright 1.62,
> ESLint 9 und Prettier 3 (`frontend/package.json`, `frontend/package-lock.json`).

**Grund:** Vorlage verlangt „Technologie + Version“ und „Konfiguration / Nachweis“ je Stack-Ebene
sowie den Konsistenzcheck gegen Lockfiles.

---

### Nachtrag 6 — Kapitel 2.2, nach der dreiteiligen Aufzählung

**Anker:** nach „… damit mehr Boids das Spiel nicht langsamer machen.“ (vor dem Absatz „Ebenfalls
läuft die Applikation komplett im Browser …“)

**Einfügen:**

> Jede der drei Entscheidungen hatte eine naheliegende Alternative: die Simulation vollständig in
> JavaScript zu schreiben, sie an die Bildrate zu koppeln oder je Boid ein Objekt über die Grenze
> zu geben. Alle drei wären einfacher zu bauen gewesen; sie hätten aber Speicherbereinigungspausen
> im Sekundentakt, ein von der Hardware abhängiges Spieltempo und einen mit der Boid-Zahl
> wachsenden Übergabeaufwand bedeutet. Der Preis der gewählten Variante ist der zusätzliche
> Build-Schritt für das WebAssembly-Paket.

**Grund:** Vorlage „Wesentliche Architekturentscheidungen“ mit Treiber, Alternative und
Konsequenz/Trade-off.

---

### Nachtrag 7 — Kapitel 2.1, Ende des Abschnitts

**Anker:** nach „Node.js ist kein Bestandteil des Produkts, sondern nur der Entwicklungsumgebung.“

**Einfügen:**

> Zur Entwicklungsumgebung gehört ebenso das KI-Werkzeug: Claude Code als agentischer Assistent
> im Repository, gesteuert über die versionierte Instruktionsdatei `CLAUDE.md` (siehe 6 KI-driven
> Engineering und Prozess).

**Grund:** Die Vorlage führt „KI-Engineering“ als eigene Ebene des Tech Stack Canvas mit Tool,
Modell und Nachweis; die Doku nennt das Werkzeug bisher erst in Kapitel 6.

---

### Nachtrag 8 — Kapitel 3.1, Ende des Abschnitts

**Anker:** nach „… weshalb sie im DOM statt auf dem Canvas liegen.“

**Einfügen:**

> Die Oberfläche kennt dabei vier Zustände: das Laden des WebAssembly-Pakets, in dem das Menü
> bereits sichtbar, der Start aber noch nicht möglich ist, die laufende Runde, die Pause und den
> Rundenabschluss. Weil `startGame()` das Modul abwartet, bevor es den Spielzustand wechselt, kann
> kein Bild gezeichnet werden, für das die Engine noch nicht existiert.

**Grund:** Vorlage „Wichtige UI-Zustände: Loading, Empty, Error, … WASM noch nicht initialisiert“.

---

### Nachtrag 9 — Kapitel 3.2, nach der dreiteiligen Regel-Aufzählung

**Anker:** nach „Dabei wurde sichergestellt, dass unter Punkt 3 nur entlang einer echten fachlichen
Grenze geteilt wird.“

**Einfügen:**

> Ergänzt wird das durch zwei Konventionen ohne Werkzeugzwang: JavaScript-Dateien heißen
> `camelCase.js`, Tests liegen als `<modul>.test.js` in einem `__tests__/`-Ordner neben dem Modul,
> und das Aussehen liegt vollständig in handgeschriebenem CSS mit zentralen Variablen für Farben
> und Abstände, ohne Komponentenbibliothek. Bedienbar ist die Oberfläche vollständig über die
> Tastatur, weil das Menü Pfeiltasten und Leertaste selbst auswertet; eine Prüfung gegen einen
> Barrierefreiheitsstandard hat nicht stattgefunden.

**Grund:** Vorlage „Styling / Design-System“, „Datei-/Namenskonventionen“,
„Accessibility-relevante Konventionen“. Der letzte Halbsatz ist der ehrliche negative Befund.

---

### Nachtrag 10 — Kapitel 3.3, nach dem ersten Absatz

**Anker:** nach „… wird nur das Ergebnis einer Runde in Form einer Highscore-Tabelle gespeichert.“

**Einfügen:**

> Gespeichert wird im `localStorage` des Browsers unter zwei Schlüsseln — der beste und der letzte
> Lauf — jeweils als JSON mit Punktestand, Welle, Zeit und Boid-Zahl. Der Zugriff ist bewusst
> bestenfalls-Semantik: ein blockierter oder voller Speicher, ein privates Fenster oder ein von
> Hand verändertes Eintragsformat führen dazu, dass kein Rekord angezeigt wird, aber nie zu einem
> Fehler in der Runde. Personenbezogene Daten entstehen dabei nicht, da kein Name und keine
> Kennung erhoben wird.

**Grund:** Vorlage „Persistenz“: Datenformat/Schema, Fehler-/Recovery-Verhalten, Datenschutz.
Belegt in `frontend/src/round/roundRecords.js`.

---

### Nachtrag 11 — Kapitel 3.4, Ende des Kapitels

**Anker:** nach „… wird der aufgelaufene Rückstand verworfen. So wird eine lange Pause beim
Fortsetzen nicht nachgeholt.“

**Einfügen:**

> Fehler werden im Frontend nach ihrer Tragweite getrennt behandelt. Was ohne die Simulation
> weitergehen kann, fällt still zurück: fehlt die Sprachdatei, zeigt die Oberfläche die
> Schlüsselnamen statt abzubrechen, und ein nicht lesbarer Rekord gilt als kein Rekord. Was die
> Simulation selbst betrifft, wird nicht abgefangen, weil ein weiterlaufendes Spiel ohne Engine
> keinen sinnvollen Zustand hätte.

**Grund:** Vorlage „Fehlerbehandlung: technische vs. fachliche Fehler; Nutzerfeedback“.

---

### Nachtrag 12 — Kapitel 4.2, Ende des Abschnitts (nach dem Absatz zum Snapshot)

**Anker:** nach „… und das Ergebnis hinge davon ab, in welcher Reihenfolge die Liste durchlaufen
wird (siehe Code-Ausschnitt 7: Kopierbarer Boid und der Snapshot).“

**Einfügen:**

> Ein eigenes Fehlerkonzept braucht die Engine nicht: die Schnittstelle nimmt ausschließlich
> Zahlen an und gibt ausschließlich Zahlen zurück, es gibt daher keinen ungültigen Aufruf, der
> gemeldet werden müsste, und kein `Result` an der Grenze. Die Engine enthält keinen einzigen
> `unsafe`-Block und keine Nebenläufigkeit — sie läuft in einer Instanz auf dem Haupt-Thread, ohne
> Worker und ohne geteilten Speicher, weshalb Datenrennen konstruktionsbedingt ausgeschlossen
> sind.

**Grund:** Vorlage „Fehlerkonzept“, „Unsafe / systemnahe Spezialfälle“, „Nebenläufigkeit / Worker /
Threads“. Geprüft: `unsafe` kommt in `engine/src` nicht vor, `Cargo.toml` hat keine
Thread-Abhängigkeit.

---

### Nachtrag 13 — Kapitel 4.2, direkt nach dem Absatz zur 400-Zeilen-Grenze

**Anker:** nach „… und verbessert die Lesbarkeit sowie die Wartbarkeit.“

**Einfügen:**

> Handgeschrieben ist dabei ausschließlich der Inhalt von `engine/src`. Das Bindeglied zum
> Frontend — die JavaScript-Glue-Datei, die Typdeklaration und das `.wasm`-Modul — erzeugt
> `wasm-pack` nach `frontend/src/wasm/engine/`; dieses Verzeichnis ist aus der Versionierung
> ausgenommen und wird nie von Hand bearbeitet.

**Grund:** Vorlage „Generierter vs. eigener Code“ und der Konsistenzcheck, der generierten
Binding-Code klar getrennt sehen will.

---

### Nachtrag 14 — Kapitel 4, neuer Absatz am Ende von 4.2

**Anker:** unmittelbar nach Nachtrag 12 einfügen (letzter Absatz von 4.2).

**Einfügen:**

> Konfiguriert ist der Bau der Engine bewusst minimal: Ziel ist `wasm32-unknown-unknown`, die
> Bindung erzeugt `wasm-pack` mit `--target web`, damit Vite das Modul ohne Plugin als Asset
> einbinden kann, und ein eigenes Release-Profil ist in `Cargo.toml` nicht gesetzt — es gilt der
> Standardpfad von Cargo und `wasm-pack`. Die Rust-Toolchain ist nicht über eine
> Toolchain-Datei festgeschrieben; reproduzierbar ist der Build damit über `Cargo.lock`, nicht
> über die Compilerversion.

**Grund:** Vorlage „Konfiguration – Wesentliche Einstellungen“ (Toolchain, WASM-Target,
Binding-Target, Dev-/Release-Profil). Der zweite Satz ist der ehrliche negative Befund; geprüft:
kein `rust-toolchain.toml`, kein `[profile.release]`.

---

### Nachtrag 15 — Kapitel 4.2, ein Satz im Absatz zum Zustand

**Anker:** an den Absatz „Der Zustand verteilt sich auf drei Ebenen …“ anhängen (vor Nachtrag 12).

**Einfügen:**

> Persistenz kennt die Engine nicht: sie liest und schreibt keine Datei, keine Datenbank und
> keinen Browser-Speicher, sondern lebt genau so lange wie die WebAssembly-Instanz. Alles, was
> eine Runde überdauert, liegt im Frontend (siehe 3.3 Persistenz und Konfiguration).

**Grund:** Vorlage verlangt für den systemnahen Teil einen Persistenzabschnitt und akzeptiert
„nicht anwendbar“ nur, wenn es ausdrücklich dasteht.

---

### Nachtrag 16 — Kapitel 5.1, Ende des Abschnitts

**Anker:** nach „… (siehe Code-Ausschnitt 12: Packen der sieben Puffer).“

**Einfügen:**

> Wem die Daten gehören, ist dabei eindeutig geregelt. Die Engine hält ihre Puffer über die ganze
> Sitzung und leert sie zu Beginn jedes Frames, ohne die Kapazität freizugeben, sodass ein Frame
> keinen neuen Speicher anfordert. Nach außen gibt jeder Getter eine **Kopie** in den
> JavaScript-Heap, keinen Blick in den linearen Speicher der Engine. Das kostet einen Kopiervorgang
> je Puffer und Frame, macht aber ungültige Zeiger unmöglich: das Frontend kann keine Sicht halten,
> die der nächste Schritt unter ihr verändert.

**Grund:** Vorlage „Speicher / Ownership: wer besitzt Daten/Handles; Kopien vs. Views; ungültige
Referenzen vermeiden“. Belegt durch `Float32Array::from(...)` in `wasm_bridge/response.rs`.

---

### Nachtrag 17 — Kapitel 5, nach dem Absatz zur Initialisierung

**Anker:** nach „… grundlegende Simulations- und Anzeigeparameter (wie Zielbildrate und Auflösung)
konfigurieren kann.“

**Einfügen:**

> Geladen wird das Modul genau einmal je Sitzung, und zwar über eine gemeinsam genutzte Zusage
> statt über ein Fertig-Kennzeichen: zwei Aufrufe während des noch laufenden Ladens hätten sonst
> zwei Instanzen mit getrenntem Speicher erzeugt, deren Zeiger sich später vermischen. Ein
> Browser ohne WebAssembly-Unterstützung wird nicht abgefangen — das Spiel bleibt dann im Menü,
> ohne eine erklärende Meldung. Für die Zielplattform aktueller Desktop-Browser ist das vertretbar,
> ein sauberer Hinweistext bleibt aber offen.

**Grund:** Vorlage „Initialisierung / Loading … Loading- und Fehlerzustand“ und
„Browser-/Runtime-Anforderungen: Fallback oder klare Nicht-Unterstützung“. Geprüft: `initEngine()`
in `engine-bridge.js` hat kein `try/catch`.

---

### Nachtrag 18 — Kapitel 5.2, Ende des Abschnitts

**Anker:** nach „… und sichert die deterministische Reproduzierbarkeit des Spielverlaufs über
unterschiedlich leistungsfähige Endgeräte hinweg.“

**Einfügen:**

> Belegt ist die Behauptung über die Grenzkosten allerdings nur strukturell, nicht durch eine
> Messreihe: die Zahl der Übergänge je Sekunde ist durch die feste Schrittzahl bekannt, ein
> Vergleich mit einer Übergabe je Boid wurde nie gemessen. Beobachtet wurde im Frametime-Overlay
> lediglich, dass die Simulation zu keinem Zeitpunkt der Engpass war.

**Grund:** Die Vorlage verlangt bei „Performance der Grenze“ ausdrücklich „Messung statt Vermutung“;
Kapitel 1.4 und 5.2 argumentieren bisher ohne Messwert. Der Nachtrag macht die Grenze der Aussage
sichtbar, statt sie zu behaupten.

---

### Nachtrag 19 — Kapitel 6, nach dem Einleitungsabsatz

**Anker:** nach „Diese wird zu Beginn jeder Sitzung in den Kontext des Modells geladen.“

**Einfügen:**

> Die Rollenverteilung war dabei über das ganze Projekt gleich: die KI hat Alternativen
> strukturiert, Code und Tests geschrieben, Fehler eingegrenzt und Dokumentationsentwürfe
> vorgelegt; beim Team lagen der Zuschnitt des Umfangs, jede Architekturentscheidung, die Prüfung
> jedes Diffs vor dem Commit und die Bewertung, ob ein Vorschlag zur Lesbarkeitsregel des Projekts
> passt. Nachvollziehbar ist diese Trennung an drei Stellen im Repository: den protokollierten
> Prompts unter `ai/`, den Entscheidungsblöcken im Entwicklungsjournal und der Commit-Historie.

**Grund:** Vorlage „Einsatzmodell & Zielsetzung“ mit klarer Abgrenzung zwischen KI-Beitrag und
menschlicher Verantwortung samt Nachweis.

---

### Nachtrag 20 — Kapitel 6.1, vor der Aufzählung der fünf Regeln

**Anker:** nach „Fünf Regeln haben den Quellcode dieses Projekts sichtbar geformt.“ — Nachtrag als
eigener Absatz **vor** die Liste setzen.

**Einfügen:**

> Der Kontext des Agenten ist dabei geschichtet: dauerhaft gelten die Regeln in `CLAUDE.md`,
> aufgabenbezogen kommen die Spezifikationen unter `docs/` und die Referenzen unter
> `documentation/` hinzu, und maßgeblich bleibt immer der aktuelle Quellcode. Damit die Regeln
> nicht veralten, steht jede Regel genau einmal — Messwerte etwa ausschließlich in der
> Quellcode-Übersicht, dort als Befehl, der sie erzeugt, statt als abgeschriebene Zahl.

**Grund:** Vorlage „Kontext- & Wissensarchitektur“ inkl. Kontextpflege und „aktueller Code bleibt
Source of Truth“.

---

### Nachtrag 21 — Kapitel 6.2, Ende des Kapitels

**Anker:** nach „Zeitgleich erfolgte die Dokumentation von Aufwänden, getroffenen
Architekturentscheidungen und aufgetretenen Herausforderungen im projektbegleitenden
Entwicklungsjournal.“

**Einfügen:**

> Dass dieser Zyklus nötig ist, zeigte sich an einer plausibel aussehenden Fehlannahme: Das Laden
> des WebAssembly-Moduls wurde zunächst über ein Kennzeichen abgesichert, das erst nach dem
> fertigen Laden gesetzt wird. Zwei Aufrufe während des Ladens erzeugten dadurch zwei Instanzen
> mit eigenem Speicher, was sich erst Minuten später als Laufzeitfehler mitten im Spiel zeigte.
> Gefunden wurde die Ursache nicht durch einen Test, sondern durch das Lesen des generierten
> Bindungscodes; die Korrektur ist die geteilte Lade-Zusage aus 5 Frontend/Systemnah-Integration –
> WASM.

**Grund:** Die Vorlage verlangt ausdrücklich „mindestens ein konkretes Beispiel: plausible, aber
falsche/unvollständige Ausgabe → Erkennung → Korrektur“. Das ist der bestbelegte Fall im Repository
(Kommentarblock am Kopf von `engine-bridge.js`).

---

### Nachtrag 22 — Kapitel 6, neuer kurzer Unterabschnitt am Ende

**Anker:** nach Nachtrag 21, als eigener Abschnitt **6.3 Grenzen des KI-Einsatzes** (Formatvorlage
der Überschriften 6.1/6.2 übernehmen).

**Einfügen:**

> **6.3 Grenzen des KI-Einsatzes**
>
> Zwei Grenzen sind über das Projekt hinweg gleich geblieben. Zum einen veraltet Kontext: in
> langen Sitzungen wurden Modulnamen und Konstanten aus dem Gedächtnis statt aus der Datei
> genannt, weshalb jede Angabe im Bericht vor dem Schreiben gegen den Quellcode geprüft wurde.
> Zum anderen stößt die Testerzeugung an der Oberfläche an ihre Grenze, was die niedrige
> Frontend-Coverage in 9 Qualität mit erklärt. Bewusst nicht automatisiert wurden zudem Git-Hooks
> und eine Pipeline: beide hätten nur Prüfungen wiederholt, die ohnehin vor jedem Commit laufen
> (siehe 8.2 CI/CD und Deployment).

**Grund:** Vorlage „Ergebnisse, Eigenleistung & Grenzen“ mit den Punkten Grenzen und „Bewusste
Nicht-Automatisierung“.

---

### Nachtrag 23 — Kapitel 7, nach dem Absatz zu den Laufzeit-Abhängigkeiten

**Anker:** nach „Die Brücke bildet wasm-pack, welches den kompilierten Rust-Code als
WebAssembly-Paket für Vite bereitstellt.“

**Einfügen:**

> Verwaltet werden die beiden Ökosysteme getrennt und beide reproduzierbar: npm über
> `frontend/package.json`, Cargo über `engine/Cargo.toml`, und beide Lockfiles —
> `package-lock.json` und `Cargo.lock` — liegen mit im Repository, sodass eine Installation
> dieselben Versionen auflöst. Direkte Abhängigkeiten sind als Bereich mit Mindestversion
> angegeben, weil das für ein Projekt dieser Laufzeit genügt; ein automatisiertes Update- oder
> Audit-Werkzeug ist nicht eingerichtet.

**Grund:** Vorlage-Abschnitt „Package Management“ (Manager, Manifeste, Lockfiles, SemVer/Pinning,
Updates/Security) fehlt in der Doku vollständig.

---

### Nachtrag 24 — Kapitel 7.2, nach dem Absatz zum Dev-Build

**Anker:** nach „Durch --target web bindet Vite die generierte .wasm-Datei ohne Plugins als
gehashtes Asset ein und lädt sie via WebAssembly.instantiateStreaming.“

**Einfügen:**

> Im Entwicklungsbetrieb tauscht Vite Änderungen an JavaScript und CSS ohne Neuladen aus;
> Änderungen am Rust-Code brauchen dagegen den Neustart des Dev-Servers, weil das
> WebAssembly-Paket vor Vite gebaut wird. Ein Panic in der Engine erreicht das Frontend als
> nackter Laufzeitfehler in der Konsole, da kein Panic-Hook eingebunden ist — vertretbar, solange
> die Grenze nur Zahlen annimmt und damit kein ungültiger Aufruf möglich ist.

**Grund:** Vorlage „Dev build“ (Hot Reload, WASM Rebuild, Logging / Panic Hooks). Geprüft: keine
Panic-Hook-Abhängigkeit in `Cargo.toml`.

---

### Nachtrag 25 — Kapitel 7.2, Ende des Kapitels

**Anker:** nach „… ist für das Deployment (Maßnahme T-06) ein statisches Hosting über GitHub Pages
via CI/CD vorgesehen.“

**Einfügen:**

> Der Produktionsbuild liefert vier relevante Artefakte: das WebAssembly-Modul mit rund 46 KB, den
> JavaScript-Bündel mit rund 63 KB, den generierten Bindungscode mit rund 5 KB und das Stylesheet
> mit rund 14 KB, jeweils unkomprimiert und mit Inhalts-Hash im Dateinamen. Eine eigene
> Optimierungsstufe ist nicht konfiguriert; es gilt, was Vite und `wasm-pack` im Release-Pfad
> ohnehin tun. Aufgeteilt wird der Code nicht, da eine einzelne Seite ohne Routen davon nichts
> gewinnt.

**Grund:** Vorlage „Production build“ (Optimierung, Code Splitting, Assets, Artefaktgrößen). Die
Werte stammen aus `frontend/dist/assets/` des letzten Produktionsbuilds — bitte nach einem
frischen `npm run build` vor der Abgabe kurz gegenprüfen.

---

### Nachtrag 26 — Kapitel 9, nach dem Absatz zur Coverage-Begründung

**Anker:** nach „… wurde der Fokus hier auf kritische Logikpfade und E2E-Kernabläufe statt auf eine
vollständige Zeilenabdeckung gelegt.“

**Einfügen:**

> Gemessen wird die Abdeckung getrennt je Sprache, weil eine gemeinsame Zahl verdecken würde,
> welche Hälfte geprüft ist. Auf der Frontend-Seite zählen dabei auch Module ohne Test gegen den
> Wert; ausgeschlossen sind nur der generierte Bindungscode, die Testdateien selbst und die
> Konstantendatei. Ein harter Schwellenwert ist nicht gesetzt, da er bei diesem Verhältnis von
> prüfbarer Logik zu Oberflächencode keine Aussage hätte. Eine Verzerrung ist zu nennen: die
> Grenztests laufen im Browser und erhöhen die Rust-Zahl nicht, weshalb die Bindungsschicht als
> ungetestet erscheint, obwohl jeder Puffer geprüft wird.

**Grund:** Vorlage „Coverage-Threshold“, „Ausschlüsse – nur begründet“, „WASM/Core-Testebene“.

---

### Nachtrag 27 — Kapitel 9, direkt unter Tabelle 8

**Anker:** nach der Beschriftung „Tabelle 8: Teststufen und ihre Reichweite“.

**Einfügen:**

> Die E2E-Stufe deckt in zehn Szenariodateien die Abläufe ab, die nur im gebauten Spiel existieren:
> Start und Laden des Moduls, Menü und Einstellungen, Rundenverlauf, Pause, Hindernisse, Power-ups
> und das Rundenende. Drei Einschränkungen sind bewusst gesetzt: nur Chromium, nur ein
> Arbeitsprozess — eine zweite Schwarmsimulation auf derselben CPU macht Zeitzusagen aus
> sachfremden Gründen wackelig — und kein Bildvergleich des Canvas, weil sich der Schwarm in jedem
> Bild bewegt. Erwartete Beschriftungen liest jeder Test aus der Sprachdatei, sodass ein fehlender
> Schlüssel als Testfehler auffällt; zur Diagnose erzeugt Playwright einen HTML-Report des letzten
> Laufs.

**Grund:** Vorlage „E2E Tests“ (Scope, Status, Browser, Flaky-Handling, Reporter).

---

### Nachtrag 28 — Kapitel 9, Ende des Kapitels

**Anker:** als letzter Absatz von Kapitel 9, nach Tabelle 8 bzw. nach Nachtrag 27.

**Einfügen:**

> Eine Lighthouse-Messung ist für diese Anwendung nicht aussagekräftig und wurde nicht
> durchgeführt: bewertet würden eine einzige Seite ohne Inhalte, ohne Netzwerkanfragen und ohne
> Suchmaschinenbezug, während die eigentliche Leistungsfrage — hält die Simulation ihre Schrittzahl
> bei vielen Boids — dort nicht vorkommt. An ihre Stelle tritt das eingebaute Frametime-Overlay,
> das Bildzeit und Schrittzahl je Bild im laufenden Spiel anzeigt.

**Grund:** Die Vorlage fordert bei Lighthouse ausdrücklich entweder Werte oder ein begründetes
„nicht anwendbar“ mit der stattdessen verwendeten Messung.

---

### Nachtrag 29 — Kapitel 10, vor der Zahlenangabe (Einleitungssatz)

**Anker:** als erster Satz von Kapitel 10, vor „Das Projekt umfasst 159 handgeschriebene
Quelldateien …“.

**Einfügen:**

> Wie der Quellcode aussieht, entscheiden dabei Werkzeuge und zwei Konventionen: Kommentare
> erklären das Warum und nicht das Wie, öffentliche Schnittstellen tragen JSDoc beziehungsweise
> `///`-Doc-Kommentare, und Namen folgen je Sprache ihrem Standard — `camelCase` in JavaScript,
> `snake_case` und `PascalCase` in Rust —, umgesetzt in Namen an der Sprachgrenze genau einmal.
> Offene `TODO`-Marken enthält der abgegebene Stand nicht.

**Grund:** Vorlage-Abschnitt „Kommentare – Visuelle Strukturierung des Quellcodes“ (Kommentare,
API-Doku, TODO/FIXME, Namenskonventionen). Vor der Abgabe kurz `grep -r "TODO" ` über `engine/src`
und `frontend/src` laufen lassen, damit der letzte Satz stimmt.

---

### Nachtrag 30 — Kapitel 10, Ende des Kapitels

**Anker:** nach „… wohingegen Rendering und Oberfläche 62,5% des Frontends ausmachen.“

**Einfügen:**

> Zu diesem Umfang kommen zwei direkte Rust-Abhängigkeiten und zehn Entwicklungswerkzeuge im
> Frontend, dem kein einziges Laufzeitpaket gegenübersteht. Ausgeliefert wird daraus ein Artefakt
> von rund 129 KB, gut ein Drittel davon das WebAssembly-Modul. Nicht mitgezählt sind in allen
> Angaben dieses Kapitels der generierte Bindungscode, `node_modules`, `target` und `dist`; Stand
> der Messung ist der Abgabe-Commit auf `dev`.

**Grund:** Vorlage „Größe“ (direkte Abhängigkeiten) und „Masszahlen“ (Bundle-/WASM-Größe, Stand der
Messung mit Commit und Datum). Datum bzw. Commit beim Merge einsetzen.

---

### Nachtrag 31 — Kapitel 11, neuer kurzer Unterabschnitt am Ende

**Anker:** nach 11.3.3, als eigener Abschnitt **11.4 Abschlussabgleich** (Formatvorlage der
Überschrift 11.3 übernehmen).

**Einfügen:**

> **11.4 Abschlussabgleich**
>
> Zum Abschluss wurde der Abgabestand gegen die Dokumentation geprüft. Das Projekt startet mit den
> in Kapitel 7 genannten Befehlen, alle sieben Muss-Spezifikationen S-01 bis S-07 sind umgesetzt,
> Linter, Formatprüfung und beide Testsuiten laufen fehler- und warnungsfrei, und die
> WebAssembly-Integration ist nicht nur gegen ein Abbild, sondern über die Grenztests und die
> E2E-Suite gegen das echte gebaute Modul geprüft. Offen und im Text benannt bleiben drei Punkte:
> die statische Typprüfung (T-02), Pipeline und Deployment (T-06 sowie 8.2) und die fehlende
> Rückmeldung in einem Browser ohne WebAssembly-Unterstützung.

**Grund:** Vorlage „Abschlussabgleich mit der Abgabe“ — sieben Prüffragen, hier zu einem Absatz
verdichtet. Vor der Abgabe einmal wirklich durchlaufen, damit der Absatz belegt ist.

---

## 3 Bewusst nicht nachgetragen

- **Routing-Tabelle, Server-/Backend-Abschnitte, Worker-Nachrichten, Datenbank-Entitäten:** In der
  Vorlage als „falls vorhanden“ markiert und hier nicht vorhanden. Kapitel 3.2 und 5 sagen bereits,
  dass es kein Routing und keinen Server gibt.
- **Vollständige F-ID-Anforderungstabelle mit Nachweisspalte:** Das wäre eine neue Tabelle über
  mehrere Zeilen und damit mehr als eine kleine Ergänzung. Die Spec-IDs S-01 bis S-07 erfüllen die
  Verfolgbarkeit in verdichteter Form; Nachtrag 3 und 31 stellen den Bezug zu Zielen und Status her.
- **Systemübersichts-Abbildung (Nutzer → Frontend → WASM):** Sinnvoll, aber eine Abbildung, keine
  Textergänzung. Die vorhandenen Bausteinsichten in 3.1.1 und 4.1.1 decken die Vorlage an dieser
  Stelle teilweise ab.
- **Testanzahl und Pass-Rate als Zahl:** Bewusst offen gelassen, weil Kapitel 10 die Regel hat,
  Messwerte nur an einer Stelle zu führen; die Zahl müsste zum Abgabestand frisch erzeugt werden.
- **Sicherheits- und Secret-Behandlung beim KI-Einsatz:** Es gibt in diesem Projekt keine Secrets,
  keine externen Dienste und keine personenbezogenen Daten; Nachtrag 10 sagt das für die Daten,
  eine eigene Passage dazu wäre eine Aussage über nichts.

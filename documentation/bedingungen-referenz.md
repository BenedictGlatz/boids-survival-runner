# Referenz: Prüfungsbedingungen (Prüfungsleistung - Bedingungen v002.pdf)

Aufbereitung der Foliensätze, mit denen der Professor (Prof. Dr. Olaf Grebner, Stand 16.04.2026)
die Prüfungsleistung definiert. Die Folien tragen den Vermerk **„ENTWURF – Änderungen erwartbar"**;
was hier steht, ist also der bekannte, aber nicht endgültige Stand.

Gegenstück zu [muster-referenz.md](muster-referenz.md): dort steht, _wie_ ein gut bewerteter
Bericht aussieht, hier steht, _was_ verlangt ist. Bei Konflikten gilt diese Datei — das Muster ist
eine Umsetzung der Bedingungen, nicht ihre Definition.

**Erfassungsstand: Folien 6 und 7.** Weitere Folien werden ergänzt, sobald sie vorliegen.

---

## 1 Deliverables und Notengewichtung (Folie 6)

Titel der Folie: „Die Ergebnisse werden in Abschlusspräsentation gezeigt & im Projektbericht
detailliert erläutert — Ablauf, Deliverables & Gewichtung zur Gesamtnote".

Bewerter ist durchgehend der Dozent.

| Abgabe                                | Typ          | Gewicht |
| ------------------------------------- | ------------ | ------: |
| „Projekt- & Architekturdokumentation" | Ausarbeitung |         |
| „Quellcode: Working Code"             | Ausarbeitung |         |
| _zusammen_                            |              |  **70** |
| „Abschlusspräsentation"               | Präsentation |  **30** |
| Summe                                 |              | **100** |

Dokumentation und Quellcode bilden **ein** Kriterium mit 70 %; die Folie weist die 70 als eine Zahl
über beiden Zeilen aus.

### Abgabe „Projekt- & Architekturdokumentation"

- **5–12 Seiten** (5–22 Seiten möglich).
- _Projektdokumentation_ — wesentliche **Entscheidungen** im Projekt.
- _Architekturdokumentation_ — Aufbau **Komponenten** & wesentliche Eigenschaften.
- Format: konsistent und komplett, Diskussion wesentlicher für den Praxisfall notwendiger Aspekte.
- Details zu Struktur & Umfang — **wesentliche Arbeitsergebnisse im Anhang**.

### Abgabe „Quellcode: Working Code"

- Running Code — **lauffähig mit dokumentierten Befehlen**.
- Umfang / Umsetzung der geplanten Anforderungen.
- Code-Qualität hoch, **Linter & Formatter aktiv und grün**, hohe Testabdeckung.
- **Fokus-Thema umgesetzt** — je nach gewähltem Fokus-Thema.
- Bonus: Optik / Usability / …
- Wörtlich: „Wenn nicht abgegeben, offensichtlich leer oder irgendwie sinnlos: 0 Punkte im
  **gesamten** Kriterium." Ein fehlender Working Code kostet also auch die Dokumentationspunkte.

### Abschlusspräsentation

- **03.09.2026, 14:00 bis 15:30**, anstelle der im HVS noch eingetragenen Klausur.
- Konkrete Termine an dem Tag oder wenige Tage davor/danach werden noch geplant und bekanntgegeben.
- Der Termin der beiden Ausarbeitungen steht auf der Folie als **TBD**.

---

## 2 Geforderte Struktur der Dokumentation (Folie 7)

Titel: „Deliverable: „Ausarbeitung: Projekt- & Architekturdokumentation" – Struktur & Umfang".
Die Folie listet die Kapitel mit Seitenrichtwerten und je Kapitel die abzudeckenden Punkte.

| Kapitel                                | Richtwert |
| -------------------------------------- | --------- |
| Anforderungen & Ziele                  | ca. 2 S.  |
| Technik Stack – Übersicht              | ca. 2 S.  |
| Frontend: Struktur / Bausteine         | ca. 5 S.  |
| Systemnah / WASM: Struktur / Bausteine | ca. 5 S.  |
| Frontend/Systemnah-Integration – WASM  | ca. 2 S.  |
| KI-driven Engineering & Prozess        | ca. 2 S.  |
| Tooling                                | ca. 3 S.  |
| Qualität                               | ca. 2 S.  |
| Quellcode Übersicht                    | ca. 1 S.  |
| Projektbericht                         | ca. 2 S.  |

Summe der Richtwerte: **26 Seiten** — genau das Budget in
[report/00-index.md](report/00-index.md), und deutlich über den 5–12 Seiten aus Folie 6. Die Folie
löst den Widerspruch selbst auf (Kasten unten).

### Punkte je Kapitel

**Anforderungen & Ziele** — Themensteckbrief; Details.

**Technik Stack – Übersicht** — Tech Stack Canvas.

**Frontend: Struktur / Bausteine** — wesentliche Komponenten listen; Komponenten – Details &
Interaktion; (UI-)Komponenten – Aufbau; **eine** wesentliche Komponente: Darstellung des Aufbaus –
Bausteinsicht; Komponenten-Interaktion; Modularisierung (Strukturierung der fachlichen Logik,
Aufteilung auf Dateien); State Management; Routing; Persistenz; Implementierung der Fachlogik.

**Systemnah / WASM: Struktur / Bausteine** — dieselbe Liste, zusätzlich **Konfiguration –
wesentliche Einstellungen**; ohne den Punkt „(UI-)Komponenten – Aufbau".

**Frontend/Systemnah-Integration – WASM** — wesentliche Komponenten listen; Komponenten – Details &
Interaktion; **Integration / Schnittstellen**.

**KI-driven Engineering & Prozess** — modulare Konfiguration; Komponenten & Struktur;
Entwicklungsprozess & Workflow.

**Tooling** — ausdrücklich „Beispiel anhand Web-Stack, anpassen auf gewählten Stack":
Scripts in `package.json` — **alle hier genannten Aspekte abdecken**; Package Management; Linter;
Formatter; JSDoc – über ESLint enforced (die Folie verlinkt `eslint.org/docs/latest/rules/require-jsdoc`);
TypeScript; Dev build; Production build; Deployment.

**Qualität** — Unit Tests aufsetzen, Coverage-Report erzeugen; E2E-Tests aufsetzen, Report erzeugen;
**CI/CD: DevOps: GitHub Pipeline: bauen, testen, linten und formatieren, deployen**; Kommentare –
visuelle Strukturierung des Quellcodes; Lighthouse (falls anwendbar).

**Quellcode Übersicht** — Größe; Masszahlen.

**Projektbericht** — Kapazitätsplan (Plan & Ist): mit welcher Kapazität wurden welche Maßnahmen
geplant, welche Kapazität war schließlich auf welche Maßnahmen eingesetzt worden?; Herausforderungen
– welche Herausforderungen bestanden?; Lessons learned – was nehmt ihr aus der Projektarbeit in den
Betrieb mit?

### Der Kasten zum Umfang (wörtlich sinngemäß)

> Die Seitenangaben ([ca. # Seiten]) sind **Richtwerte**. Im Unterricht haben wir besprochen, wie
> diese Seiten **deutlich gekürzt** werden können. Es geht um pragmatisch gut nutzbare Berichte —
> keine akademisch (extra lange) Texte. **Konsistenz, Plausibilität und Vollständigkeit** sind
> wichtig.

Das ist die Auflösung des Widerspruchs 26 vs. 12 Seiten: **Vollständigkeit der Punkte** schlägt
Ausführlichkeit je Punkt. Jeder Punkt der Folie muss vorkommen, aber knapp. Das Muster erreicht das,
indem es rund die Hälfte seines Volumens in den Anhang auslagert — Folie 6 verlangt das sogar
explizit („wesentliche Arbeitsergebnisse im Anhang").

---

## 3 Was daraus für dieses Projekt folgt

**Die Kapitelstruktur unter `documentation/report/` ist bereits deckungsgleich** mit Folie 7,
inklusive Reihenfolge und Seitenrichtwerten. Anhang und KI-Verzeichnis (Kap. 11, 12) kommen aus dem
Muster bzw. aus `CLAUDE.md` hinzu, nicht aus dieser Folie.

**Offene Punkte, die die Folie fordert und die es hier noch nicht gibt:**

| Geforderter Punkt                                                 | Stand hier                                                                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| CI/CD-Pipeline (GitHub, bauen/testen/linten/formatieren/deployen) | existiert nicht — offener Posten, siehe `docs/specs-overview.md`                                                                                 |
| Deployment                                                        | existiert nicht; das Spiel ist installationslos, aber nicht deployt                                                                              |
| TypeScript                                                        | bewusst nicht verwendet — muss als **begründete Negativaussage** ins Tooling-Kapitel, so wie das Muster es tut                                   |
| Lighthouse                                                        | „falls anwendbar" — bei einem Canvas-Vollbildspiel ohne Routing kaum aussagekräftig; die Nichtanwendbarkeit ist zu begründen, nicht zu übergehen |
| Routing / Persistenz                                              | beides nicht vorhanden (ein Screen, keine gespeicherten Daten) — ebenfalls begründet zu verneinen statt wegzulassen                              |
| Kapazitätsplan Plan **und** Ist                                   | Plan in `docs/specs-overview.md`, Ist im Journal — beim Schreiben von Kap. 10 gegenüberzustellen                                                 |

**Regel daraus:** Ein Punkt der Folie, den dieses Projekt nicht erfüllt, wird **genannt und
begründet**, nie stillschweigend ausgelassen. Vollständigkeit ist ausdrückliches Bewertungskriterium,
und das Muster hat mit genau dieser Ehrlichkeit (kein Formatter, kein Production Build, kein
TypeScript) eine sehr gute Note erhalten.

**Zweite Regel:** „Linter & Formatter aktiv und grün" und „lauffähig mit dokumentierten Befehlen"
sind Kriterien am Quellcode selbst, nicht am Bericht. Vor der Abgabe müssen `npm run lint`,
`npm run format:check`, `cargo clippy`, `cargo fmt --check` und die vier Testbefehle nachweislich
grün sein, und die Befehlsliste aus `CLAUDE.md` gehört in die README bzw. Kapitel 07.

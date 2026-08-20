# Projekt- & Architekturdokumentation — Arbeitsindex

Arbeitsverzeichnis für die Ausarbeitung „Projekt- & Architekturdokumentation"
(Prüfungsleistung, 70 % der Gesamtnote, Abgabe **03.09.2026**).

Dieses Dokument ist **kein Kapitel des Berichts**, sondern die Steuerung dahinter.
Es wird nicht mit abgegeben.

## Warum diese Struktur

Der Bericht entsteht **begleitend zur Entwicklung**, nicht danach. Die
Musterdokumentation des Professors nennt in ihren eigenen _Lessons Learned_ die
nachgelagerte Erstellung als Hauptursache für Zeitdruck am Projektende. Der
Mechanismus dagegen steht in `CLAUDE.md` → _Mandatory per-change steps_, Schritt 5:
pro Änderung werden **Fakten** in [projekt-journal.md](projekt-journal.md) gesichert,
nicht Prosa in Kapitel geschrieben.

Ein Kapitel pro Datei, numerisches Präfix = Berichtsreihenfolge, ASCII-Slugs
(`qualitaet` statt `qualität`) gegen Encoding-Probleme unter Windows.

**Vor dem Schreiben eines Kapitels:** [../muster-referenz.md](../muster-referenz.md)
lesen. Dort steht die Musterdokumentation des Professors aufbereitet — Aufbau,
Detailtiefe und Schreibstil pro Kapitel, das Kapitel-Mapping Muster → hier, und die
Stilregeln, die dieser Bericht einhalten muss. Das PDF selbst ist als Bildvorlage nur
eingeschränkt lesbar; die Markdown-Fassung ist die Arbeitsgrundlage.

## Fortschritt

Status: `Gerüst` (nur Überschriften) → `Entwurf` (Inhalt steht, Sprache rau) →
`Fertig` (abgabereif).

| #   | Kapitel                                                                  | Budget | Status    | Blocker                                       |
| --- | ------------------------------------------------------------------------ | -----: | --------- | --------------------------------------------- |
| 01  | [Anforderungen und Ziele](01-anforderungen-und-ziele.md)                 |  ~2 S. | Entwurf   | —                                             |
| 02  | [Technik Stack](02-tech-stack.md)                                        |  ~2 S. | Entwurf   | wächst mit T-02, T-05, T-06                   |
| 03  | [Frontend: Struktur / Bausteine](03-frontend-bausteine.md)               |  ~5 S. | Entwurf   | Modulübersicht je Datei fehlt im Anhang       |
| 04  | [Systemnah / WASM: Struktur / Bausteine](04-systemnah-wasm-bausteine.md) |  ~5 S. | Entwurf   | Modulübersicht je Datei fehlt im Anhang       |
| 05  | [Frontend/Systemnah-Integration — WASM](05-integration-wasm.md)          |  ~2 S. | Entwurf   | —                                             |
| 06  | [KI-driven Engineering & Prozess](06-ki-engineering-und-prozess.md)      |  ~2 S. | Entwurf   | —                                             |
| 07  | [Tooling](07-tooling.md)                                                 |  ~3 S. | Entwurf   | 7.6/7.10 nachziehen, falls T-02/T-06          |
| 08  | [Qualität](08-qualitaet.md)                                              |  ~2 S. | Entwurf   | 8.3 falls T-05, 8.5 falls T-06, 8.6 Messreihe |
| 09  | [Quellcode-Übersicht](09-quellcode-uebersicht.md)                        |  ~1 S. | Fertig    | Zahlen final erhoben, Stand 20.08.2026        |
| 10  | [Projektbericht](10-projektbericht.md)                                   |  ~2 S. | Entwurf   | Ist-Zahlen nach Code-Freeze nachziehen        |
| 11  | [Anhang](11-anhang.md)                                                   |      — | Gerüst    | akkretiv                                      |
| 12  | [KI-Verzeichnis](12-ki-verzeichnis.md)                                   |      — | generiert | `npm run docs:ki-verzeichnis`                 |

Seitenbudget insgesamt: **~26 S.** Zulässig sind 5–12 Seiten, bis 22 möglich. Die
Summe liegt bewusst darüber — beim Trocken-Zusammenbau (siehe unten) wird gekürzt,
und Gekürztes wandert in [Kapitel 11 Anhang](11-anhang.md) statt gelöscht zu werden.

## Zwei Konventionen, die eingehalten werden müssen

**1. Alle Zahlen leben nur in Kapitel 09.** LOC, Dateizahlen, Testzahlen,
Coverage-Prozente, Commit-Zahlen stehen **ausschließlich** in
[09-quellcode-uebersicht.md](09-quellcode-uebersicht.md); alle anderen Kapitel
verweisen dorthin. Sonst tauchen LOC-Angaben in Kap. 3, 4, 8 und 9 auf und laufen
bis September auseinander. Kapitel 09 hält an Tag eins die **Befehle**, nicht die
Zahlen — die Befehle sind zugleich die geforderten „Masszahlen"-Methodik.

**2. Die 400-Zeilen-Regel gilt hier nicht.** `CLAUDE.md` verbietet Quelldateien über
400 Zeilen. Ein 5-Seiten-Kapitel überschreitet das zwangsläufig; unter
`documentation/` ist die Regel ausgesetzt (dort ebenfalls vermerkt).

## Diagramme

Mermaid-Blöcke stehen **inline im jeweiligen Kapitel** — eine Quelle, GitHub rendert
sie direkt. `npm run docs:diagrams` extrahiert sie nach `rendered/*.svg` für Word.

Drei Bausteinsichten sind gefordert:

| Kapitel | Komponente                                                               |
| ------- | ------------------------------------------------------------------------ |
| 04      | `simulation/dash/` + Integration in `Flock::update()`                    |
| 05      | `wasm_bridge/` ↔ `engine-bridge.js`, plus `sequenceDiagram` eines Frames |
| 03      | `input/inputManager.js` + `input/controls.js`                            |

In Word **SVG einfügen, nicht PNG** — SVG skaliert druckscharf.

## Word-Zusammenbau

1. `npm run docs:diagrams` → aktuelle SVGs in `rendered/`.
2. Kapitel 01…12 in Reihenfolge zusammenführen. Erst prüfen, ob
   `pandoc --reference-doc=vorlage.docx` die Dateien im Block konvertiert; sonst von
   Hand einfügen.
3. Inhaltsverzeichnis, Seitenzahlen, Kopfzeile erzeugen.
4. Tabellen und Abbildungen durchnummerieren und beschriften (`Tabelle 1: …`,
   `Abbildung 1: …`) — das Muster tut das konsequent und referenziert im Text darauf.
5. Querverweise auflösen („siehe Kapitel 3.5").

**Trocken-Zusammenbau bei ~60 % Inhalt, Mitte August, 2 h Budget.** Nur daraus lernt
man das Verhältnis Markdown-Seite → Word-Seite gegen das Seitenbudget und ob Pandoc
trägt. Wird das erst am 01.09. versucht, ist es zu spät.

## Termine

| Datum          | Meilenstein                                               |
| -------------- | --------------------------------------------------------- |
| ~15.08.2026    | Trocken-Zusammenbau, Seitenbudget prüfen                  |
| **24.08.2026** | **Code-Freeze** — danach nur Prosa, Diagramme, Layout     |
| 03.09.2026     | Abgabe Dokumentation, Working Code, Abschlusspräsentation |

# Referenz: Musterdokumentation „FitFuel Mobile" (Prüfungsleistung_Muster.pdf)

Transkript der Musterdokumentation eines früheren Projekts desselben Professors, das eine sehr
gute Note erhalten hat. Dieselben Studierenden, derselbe Schreibstil — fachlich ein anderes Projekt
(React-Native-Ernährungsplaner statt Rust/WASM-Spiel), aber formal und stilistisch das Vorbild für
den Report unter `documentation/report/`.

Diese Datei ist ein **Arbeitsauszug**, kein Faksimile: das KI-Verzeichnis (Kap. 10) ist nur
exemplarisch erfasst, von den Abbildungen und Quellcode-Ausschnitten ist nur festgehalten, was
strukturell relevant ist. Der Volltext liegt im PDF daneben.

Umfang des Musters: **43 Seiten** (i–iv römisch nummeriertes Vorspann, 1–43 Inhalt).

---

## 1 Formaler Aufbau

### Vorspann

- **Inhaltsverzeichnis** (Seiten i–ii) — dreistufig nummeriert (`3.1.3.1` kommt vor), mit
  Seitenzahlen und Füllpunkten.
- **Tabellenverzeichnis** (Seite iii) — 13 Tabellen, durchnummeriert „Tabelle n: Titel".
- **Abkürzungsverzeichnis** (Seite iv) — alphabetisch, Abkürzung links, ausgeschriebene Form
  rechtsbündig mit Füllpunkten. Im Muster: API, BMR, CI/CD, CRUD, EAS, E2E, iOS, MBaaS, MVP, PAL,
  Props, QR, src, SVG, TDEE, UI, UX.

### Kapitelstruktur (Ist-Zustand des Musters)

| Kap. | Titel                                                   | Seiten |
| ---- | ------------------------------------------------------- | ------ |
| 1    | Anforderungen und Ziele                                 | 1–2    |
| 2    | Technik Stack                                           | 3      |
| 3    | Frontend: Struktur / Bausteine                          | 3–12   |
| 4    | Tooling                                                 | 13–15  |
| 5    | Qualität                                                | 16–17  |
| 6    | Quellcode Übersicht                                     | 18     |
| 7    | Detaillierte Aspekte                                    | 18–19  |
| 8    | Projektbericht                                          | 20–22  |
| 9    | Anhang (Tabellen / Abbildungen / Quellcode-Ausschnitte) | 23–37  |
| 10   | KI-Verzeichnis (6 Unterkapitel)                         | 38–43  |

Kopfzeile jeder Inhaltsseite: kursiv der Projekttitel („Ernährungsplaner-Applikation ‚FitFuel
Mobile'"), rechts die Seitenzahl, darunter eine dünne Linie.

**Größenverhältnis, das man sich merken sollte:** der eigentliche Fließtext umfasst 23 Seiten,
der Anhang 15. Fast die Hälfte des Dokuments sind ausgelagerte Tabellen, Abbildungen und
Code-Ausschnitte. Der Fließtext bleibt dadurch schlank und verweist konsequent nach hinten.

---

## 2 Kapitelinhalte im Detail

### 1 Anforderungen und Ziele

Einleitungssatz nennt Zweck des Kapitels („Für eine zielgerichtete Entwicklung … werden im
folgenden Kapitel die Kernbedürfnisse der Zielgruppen sowie die daraus resultierenden Anforderungen
definiert.").

**1.1 Themensteckbrief: Nutzer, Prozess, Pain und Kontext** — vier fettgesetzte Begriffe strukturieren
je einen Absatz: Zielgruppe (junge Erwachsene 25–40, ambitionierte Hobby-/Profisportler),
**Kernprozess** (Workflow einer strukturierten Fitness-Ernährung), **Nutzer-Pain** (bestehende Apps
trennen Tracking von Planung und Vorratshaltung), **Nutzungskontext** (Dashboard morgens →
Wochenplanung → Einkaufs- und Bestandsliste).

**1.2 Die Lösung** — was das Produkt ist, dann eine nummerierte Liste der vier MVP-Kernfunktionen
(Cross-Platform-Entwicklung, Bedarfsermittlung, Planung, Logistik), danach eine Bulletliste
„Zukünftige Erweiterungen nach Abschluss des MVPs" (QR-Scanner, dynamische Kalorienanpassung).
Der Abgrenzungsschritt „das ist MVP, das ist später" steht explizit im Text.

**1.3 Details zum Softwareprojekt** — Vorgehensmodell (**Rapid Application Development**, agil,
Prototyping), Projektboard in GitHub, **Local-First-Ansatz**, zentrales State- und
Theme-Management. Enthält Vorwärtsverweise in Klammern: „(Die detaillierten konzeptionellen
Beweggründe hierfür werden in Kapitel 7.1 Offline-First erläutert, die technische Realisierung der
Datenpersistenz in Kapitel 3.5 Persistenz)."

**1.4 Entwicklungsfokus** — worauf die Entwicklung optimiert wurde: Reduzierung des manuellen
Planungsaufwands, Flexibilität nutzerspezifischer Strategien, UX und Fortschrittsvisualisierung,
Minimierung der Interaktionen (Presets).

### 2 Technik Stack

Nur **eine Seite**, bewusst knapp — der Detailinhalt liegt in Tabelle 10 (Tech Canvas) im Anhang.

**2.1 Rahmenbedingungen** — Zielplattformen, gewähltes UI-Framework (React Native + Expo),
Programmiersprache. Begründung jeweils in einem Halbsatz („ermöglicht es, aus einer einzigen,
gemeinsamen Codebasis heraus alle drei Zielplattformen zu bedienen").

**2.2 Architektur-Entscheidungen** — was es _nicht_ gibt (kein Backend, kein MBaaS, keine externen
APIs), wo die Daten liegen, Verweis auf Kapitel 3 für die technische Umsetzung.

### 3 Frontend: Struktur / Bausteine

Das mit Abstand längste Kapitel (10 Seiten). Beginnt mit der Verzeichnisaufteilung und der
**Drei-Schichten-Architektur** als Bulletliste (UI-Schicht / Fachlogik-Schicht / Datenbank-Schicht),
danach ein Absatz je Schicht mit fettgesetztem Schichtnamen als Satzanfang. Schließt mit der
Nutzenaussage: „Durch diese Trennung lassen sich einzelne Schichten unabhängig voneinander
austauschen, ohne Änderungen an den Screens zu erfordern (z.B. Theming)."

- **3.1 UI-Komponenten und technischer Aufbau**
  - 3.1.1 Übersicht der Screens und Komponenten — Tabelle 1 (Screen | Aufgabe), acht Screens.
  - 3.1.2 Styling-Konzept — `StyleSheet.create()`, Inline-SVG, programmatisch berechnete
    SVG-Geometrie, Verweis auf Quellcode-Ausschnitt 1.
  - 3.1.3 Komponenten-Interaktion — 15 Komponenten in **vier technische Gruppen** eingeteilt, je
    eine Unter-Unterüberschrift (3.1.3.1 Präsentationskomponenten (Stateless & Unidirectional),
    3.1.3.2 UI-Zustandskomponenten (Lokaler State), 3.1.3.3 Datenintegrierende Komponenten
    (Side Effects & Persistenz), 3.1.3.4 Screen-Komponenten). Innerhalb jeder Gruppe eine Bulletliste
    mit fettgesetztem Komponentennamen und einem Satz Funktion.
- **3.2 Detailbetrachtung der Kernkomponente _DietScreen.js_** — exemplarische Tiefenanalyse **einer**
  Datei („mit über 1300 Zeilen die komplexeste Ansicht"), Verweis auf Abbildung 1
  (Komponenten-Hierarchie als ASCII-Baum im Anhang). 3.2.1 Lokale Hilfskonstrukte begründet, warum
  Helfer bewusst _nicht_ ausgelagert wurden.
- **3.3 State Management** — Hooks + Context API, Datenbank als **Single Source of Truth**,
  Kategorien des lokalen States als Bulletliste (Datenzustand, UI-Zustand, Formularzustand), dann
  die Begründung, warum abgeleitete Werte _nicht_ im State liegen („Dies vermeidet inkonsistente
  Zustände, bei denen State-Variablen aus dem Takt geraten könnten.").
  - 3.3.1 Globaler State des Themings.
- **3.4 Routing und Navigation** — 3.4.1 Logik des bedingten Startbildschirms (Onboarding-Guard),
  3.4.2 Individualisierte Bottom-Nav (Eigenentwicklung statt Bibliothek, mit Begründung).
- **3.5 Persistenz** — 3.5.1 Relationales Datenbankschema (SQLite, WAL, zwölf Tabellen, sieben
  Indizes; Verweis auf Tabelle 12 und Quellcode-Ausschnitt 6), 3.5.2 Abstraktion und
  Migrationsstrategie.
- **3.6 Konfiguration** — `app.json`-Einträge einzeln erklärt, Bildschirmausrichtung begründet,
  3.6.1 Metro Bundler Konfiguration. Enthält eine ausdrückliche Klarstellung gegen eine naheliegende
  Fehlannahme: „Die plattformspezifische Dateiauflösung … ist kein benutzerdefiniertes Verhalten,
  sondern wird vom Standard-Metro-Resolver … behandelt."
- **3.7 Implementierung der Fachlogik** — der mathematische Teil. 3.7.1 Überblick, 3.7.2 Grundumsatz
  (Harris-Benedict-Formel, **gesetzte Formeln** mit Legende „wobei _m_ das Körpergewicht in kg …"),
  3.7.3 Gesamtenergiebedarf (TDEE = BMR × PAL, Tabelle 2, Summenformel), 3.7.4 Phasen-Logik und
  Kalorienziel (Tabelle 3 mit Gültigkeitsbereichen), 3.7.5 Makronährstoff-Verteilung (drei Formeln,
  Divisoren erklärt: „entsprechen den physiologischen Brennwerten der Makronährstoffe in kcal/g").
  Edge Cases stehen im Text: „Fehlen Pflichtparameter, gibt die Funktion 0 zurück.", „Die Summe
  aller Stunden muss exakt 24 ergeben; andernfalls wird 0 zurückgegeben, um unplausible Eingaben
  abzufangen."

### 4 Tooling

Einleitung nennt die Konfigurationsdateien (`package.json`, `app.json`, `eslintrc.json`).

- 4.1 Scripts in package.json — Tabelle 4 (Script | Nutzen), neun Skripte.
- 4.2 Package Management — npm, zentrale produktive Abhängigkeiten, i18n-Stack, Test-Werkzeuge.
- 4.3 Linter — ESLint, Konfigurationsort, eingebundene Plugins, welche Fehlerklassen früh erkannt
  werden.
- 4.4 Formatter — **negativer Befund, ehrlich benannt**: „Ein dedizierter Code-Formatter wie Prettier
  ist im aktuellen Projektstand nicht integriert. Stattdessen werden grundlegende
  Formatierungsregeln über ESLint abgebildet."
- 4.5 JSDoc — `jsdoc/recommended` + `jsdoc/require-jsdoc`, und wo JSDoc schwerpunktmäßig eingesetzt
  wird.
- 4.6 TypeScript — ebenfalls ein Verzicht **mit Begründung**: „Auf eine strikte Typisierung durch
  TypeScript wird hierbei verzichtet, um die Geschwindigkeit beim Prototyping und somit den Fokus
  auf das MVP zu erhöhen."
- 4.7 Branch-Struktur — main / dev / Feature-Branches, je ein Absatz.
- 4.8 Builds & Deployment — lokaler Prebuild, und offen benannt: „Ein fertiger Production Build …
  wurde im Rahmen dieses Projekts nicht generiert", gefolgt vom geplanten Weg (EAS Build).

### 5 Qualität

Einleitungssatz zählt die Stufen der Teststrategie auf: „Das Projekt verfolgt eine mehrstufige
Teststrategie aus **Unit Tests**, **End-to-End-Tests**, einer **CI/CD-Pipeline** sowie **statischer
Codeanalyse** mit verpflichtender **Dokumentation**."

- 5.1 Unit Tests und Coverage — Framework + Preset, Tabelle 5 (Verzeichnis | Inhalt | Testanzahl,
  81 Tests gesamt), Tabelle 6 (Coverage nach Verzeichnis, Statements/Branches/Functions/Lines).
  **Die Zahlen sind schlecht (Gesamt 12,67 %) und werden trotzdem gedruckt** — begleitet von der
  Einordnung: „Die Coverage-Statistik spiegelt die bewusste Priorisierung der Geschäftslogik wider.
  Die Datenschicht erreicht 100 % über alle Metriken, während UI-Screens im MVP durch E2E-Tests
  abgedeckt werden."
- 5.2 E2E Tests — Maestro, YAML, Tabelle 7 (Flow-Datei | Zweck | Dauer in Sek.), Ausführungsbefehl,
  Report-Pfad, Testgerät.
- 5.3 CI/CD: GitHub Actions Pipeline — Trigger, vier Jobs in ihrer Abhängigkeitsreihenfolge
  beschrieben (lint → test → coverage, parallel dazu build-web).
- 5.4 Statische Codeanalyse und Dokumentation — konkrete Regeln (vier Leerzeichen Einrückung,
  einfache Anführungszeichen, Semikolons, const/let statt var), JSDoc-Pflicht, Ausnahmen.

### 6 Quellcode Übersicht

Eine knappe Seite, rein quantitativ: unterstützte Plattformen und Sprachen, Persistenzumfang,
Testarten, dann die **Kennzahlen** („37 JavaScript-Quelldateien mit 11.691 Zeilen (ohne Tests),
ergänzt durch 10 Testdateien (659 Zeilen) und 4 Maestro-E2E-Flows (94 Zeilen YAML) — insgesamt 51
Dateien mit 12.444 Zeilen"), Tabelle 8 (Codeverteilung nach Architektur-Schicht mit Prozentanteil)
und **die Interpretation der Zahlen**: „Der dominierende UI-Anteil besteht zu 66,1 % aus Komponenten
und Screens. Er entspricht dem Charakter einer frontend-lastigen Anwendung ohne Backend. Die schlanke
Fachlogik-Schicht belegt die konsequente Trennung von Berechnung und Darstellung."

### 7 Detaillierte Aspekte

Überleitungsabsatz erklärt die Funktion des Kapitels: nach der Technik nun die **konzeptionellen
Beweggründe**. Nur zwei Themen, dafür in der Tiefe.

- 7.1 Offline-First — Nutzungskontext (schwankende Netzqualität), funktionale Vorteile (Ladezeiten,
  keine Netzwerklatenz), konzeptioneller Fokus (personalisierte Daten statt unübersichtlicher
  Fremddatenbank) und **Privacy by Design** als eigenes Argument.
- 7.2 Design- / UI- / UX-Entscheidungen: Hauptnavigation — Ziel, gewählte Lösung
  (Bottom-Nav, Einhandbedienung), **verworfene Alternative mit Begründung**: „Ursprünglich war in
  Betracht gezogen worden, die Vorlagenverwaltung (Presets) als sechsten Tab zu integrieren. Diese
  Idee wurde jedoch zugunsten der Ergonomie verworfen: Zu viele Touch-Ziele … erhöhen die
  Fehleranfälligkeit bei der Eingabe (das sogenannte ‚Fat-Finger-Problem')", danach die
  Default-Anordnung als Bulletliste mit räumlicher Begründung (Zentrum / linke Seite / rechte Seite)
  und zuletzt eine weitere bewusste Entscheidung (Einstellungen nicht in der Hauptnavigation).

### 8 Projektbericht

- 8.1 Kapazitätsplan — Zielsetzung der Planung, iteratives Vorgehen, dann die **Soll/Ist-Abweichung
  offen benannt**: „Die geplanten Soll-Zeiten der Arbeitspakete konnten weitgehend eingehalten
  werden. Abweichungen ergaben sich jedoch im Bereich der Projekt- und Architekturdokumentation. Für
  deren Erstellung wurde mehr Zeit benötigt als ursprünglich vorgesehen, wodurch der zeitliche
  Aufwand für die Erstellung der Präsentation reduziert werden musste." Fazit-Satz zur Realitätsnähe
  der Planung. Zahlenwerk in Tabelle 13 (Zeitplan Soll/Ist) im Anhang.
- 8.2 Herausforderungen — zwei ausformulierte Absätze mit fettgesetztem Kernbegriff
  (**plattformübergreifende Entwicklung**, **Modellierung** der Datenstruktur). Keine Bulletliste.
- 8.3 Lessons Learned — der reflektierteste Teil des Dokuments, fünf Absätze:
  1. Projektplan und GitHub-Pflege als Erfolgsfaktor,
  2. RAD/iteratives Vorgehen bewährt,
  3. Architektur und Modularisierung,
  4. **Integration der Dokumentation** — „Die nachgelagerte Erstellung der Dokumentation führte zu
     einem erhöhten Zeitdruck gegen Ende des Projekts. Für zukünftige Projekte empfiehlt sich daher,
     die Dokumentation parallel zur Implementierung … zu erstellen",
  5. Arbeitsorganisation — Pair Programming war fachlich essenziell, wurde aber zum Engpass;
     Empfehlung zur früheren **Parallelisierung**.
     Jede Lesson folgt dem Muster **Beobachtung → Bewertung → Empfehlung für zukünftige Projekte**.

### 9 Anhang

- **9.1 Tabellen** — Tabelle 9 (Verzeichnisstruktur und Schichtenzuordnung), Tabelle 10 (Tech Canvas:
  Schicht | Technologie | Version | Zweck, ~25 Zeilen inkl. exakter Versionsnummern), Tabelle 11
  (Übersicht der Komponenten: Komponente | Aufgabe, 15 Zeilen mit je 1–3 Sätzen), Tabelle 12
  (Tabellenübersicht der Datenbank: Tabelle | Inhalt/Fokus | Besonderheiten, mit FK-/Cascade-/
  UNIQUE-Angaben), Tabelle 13 (Zeitplan Soll/Ist: Schritt | Soll Start | Ist Start | Soll Ende |
  Ist Ende, 13 Arbeitspakete von Mock-Up bis Präsentation).
- **9.2 Abbildungen** — Abbildung 1: Diet-Screen Komponenten-Hierarchie, gezeichnet als reiner
  **ASCII-/Textbaum** mit `└─`-Kanten, keine Grafiksoftware.
- **9.3 Quellcode-Ausschnitte** — syntaxgehighlightete Listings auf dunklem Grund, jeweils mit
  Bildunterschrift „Quellcode-Ausschnitt n: Titel". Im Muster sechs bis acht Stück, jeder aus dem
  Fließtext heraus referenziert.

### 10 KI-Verzeichnis

Sechs Unterkapitel als thematische Gruppierung — **exakt die sechs `topic`-Werte, die
`CLAUDE.md` für `ai/*.json` vorschreibt**:

| Muster-Unterkapitel                                   | `topic` in diesem Projekt |
| ----------------------------------------------------- | ------------------------- |
| 10.1 Konzeption & Architektur-Entscheidungen          | (Architektur / Prozess)   |
| 10.2 Code-Generierung & Implementierung von Fachlogik | `engine`, `wasm-bridge`   |
| 10.3 UI/UX-Entwicklung & Komponenten-Styling          | `frontend-ui`             |
| 10.4 Debugging & Problembehebung                      | `loop-input`              |
| 10.5 Code-Qualität, Refactoring & Testing             | `tooling-tests`           |
| 10.6 Textredaktion & Dokumentationsstruktur           | `prozess-doku`            |

Tabellenform mit drei Spalten: **System | Prompt | Verwendung**.

- _System_ — konkretes Modell inkl. Version („Gemini 3 Pro", „Claude Opus 4.6", „Claude Sonnet 4.6").
- _Prompt_ — der Prompt im **Wortlaut**. Mehrteilige Dialoge werden mit „…" gerafft und nur die
  entscheidenden Nachfragen gezeigt. Anhänge werden in eckigen Klammern markiert:
  „[Bericht als .pdf-Datei]".
- _Verwendung_ — die Klassifikation: „Rein informativ", „Recherche, rein informativ",
  „Zur Implementierung verwendet", „Übernommen", „Passagen überarbeitet".

Auch triviale Prompts stehen drin („Definiere Blob in einem Satz", „How to add people to my private
Github repository?"). Vollständigkeit schlägt Eindruck.

---

## 3 Schreibstil — was den Report auszeichnet

**Sprache**

- Durchgängig **Deutsch**, sachlich-nüchtern, **unpersönlich** (Passiv oder „die Anwendung …" /
  „das System …"). Kein „ich", kein „man". Ausnahme: das seltene „wir" in
  Qualitäts-/Prozessaussagen („stellen wir sicher, dass JSDoc vollständig umgesetzt wurde").
- **Präsens** für den Ist-Zustand der Software, **Präteritum/Perfekt** für Projektverlauf und
  Entscheidungen („wurde verworfen", „konnten eingehalten werden").
- **Blocksatz**, Absätze durch Leerzeile getrennt, keine Einrückung.

**Fachbegriffe**

- Englische Fachbegriffe werden **nicht** eingedeutscht (Screen, Props, State, Hook, Slot, Flow),
  aber beim ersten Auftreten in Klammern erklärt oder ausgeschrieben: „Basal Metabolic Rate (BMR)",
  „Create-, Read-, Update-, Delete- (CRUD) Verwaltung", „Side Effects".
- Jede Abkürzung, die im Text vorkommt, steht auch im Abkürzungsverzeichnis.
- **Fettdruck** markiert die Schlüsselbegriffe eines Absatzes — sparsam, ein bis drei pro Absatz,
  nie ganze Sätze. _Kursiv_ ist Dateien, Funktionsnamen und Identifiern vorbehalten (_DietScreen.js_,
  _loadUserProfile()_, _storage.js_).

**Argumentationsmuster** — das eigentliche Qualitätsmerkmal

1. **Jede Entscheidung wird begründet.** Nie „X wird verwendet", sondern „X wird verwendet, weil Y".
   Häufigste Konnektoren: „Dieser Ansatz ermöglicht es …", „Dies verhindert, dass …",
   „Dadurch wird sichergestellt, dass …", „Aufgrund von …".
2. **Verworfene Alternativen werden genannt.** Nicht nur die gewählte Option, sondern was sonst zur
   Debatte stand und warum es ausschied (Presets als sechster Tab; TypeScript; Tab-Navigator der
   Bibliothek).
3. **Negative Befunde stehen im Text.** Fehlender Formatter, fehlender Production Build, 12 %
   Coverage, überzogene Doku-Zeiten — alles ausgeschrieben und eingeordnet, nichts geschönt. Das ist
   erkennbar ein Notengrund, kein Versehen.
4. **Zahlen werden interpretiert, nicht nur gedruckt.** Auf jede Kennzahltabelle folgt ein Satz,
   was die Zahl über das Projekt aussagt.
5. **Querverweise sind explizit und mit Nummer + Titel**: „(Siehe Tabelle 11: Übersicht der
   Komponenten)", „(Vgl. Quellcode-Ausschnitt 1: Implementierung des Kalorienrings)",
   „(Siehe 1.4 Entwicklungsfokus)". Nie ein nacktes „siehe oben".
6. **Kapitel beginnen mit einem Einleitungssatz**, der Zweck und Umfang ankündigt, und
   Übersichtskapitel enden mit einer Nutzenaussage.

**Listen vs. Fließtext**

- Bulletlisten für Aufzählungen gleichrangiger Dinge (Schichten, Komponenten, MVP-Funktionen);
  jeder Punkt beginnt mit einem fettgesetzten Namen, dann Doppelpunkt und ein bis zwei Sätze.
- Nummerierte Listen nur, wo eine Reihenfolge oder Vollständigkeit gemeint ist (die vier
  MVP-Kernfunktionen).
- **Herausforderungen und Lessons Learned sind bewusst Fließtext**, keine Stichpunkte — dort ist
  Reflexion gefragt, nicht Aufzählung.

**Formeln** — zentriert, mit Formelsatz, Variablen kursiv, mit anschließender Legende und einer
Erklärung, woher die Konstanten kommen.

---

## 4 Übertragung auf dieses Projekt (Boids Survival Runner)

**Gleich bleibt:** Aufbau, Nummerierungstiefe, Verzeichnisse, Tabellen- und Abbildungsbeschriftung,
Anhang-Auslagerung, KI-Verzeichnis in sechs Themengruppen, Schreibstil, Begründungspflicht.

**Anders ist:** die Zweisprachigkeit der Architektur. Das Muster hat eine Sprache und drei Schichten;
dieses Projekt hat zwei Sprachen (Rust/WASM und JavaScript) und eine Schnittstelle dazwischen. Die
Kapitelstruktur unter `documentation/report/` bildet das ab — wo das Muster ein Kapitel „Frontend"
hat, gibt es hier 03 (Frontend), 04 (systemnahe WASM-Bausteine) und 05 (Integration). Kapitel 05 hat
im Muster keine Entsprechung und ist genau die Stelle, an der dieses Projekt Punkte holen kann.

**Kapitel-Mapping**

| Muster                                    | hier                               |
| ----------------------------------------- | ---------------------------------- |
| 1 Anforderungen und Ziele                 | `01-anforderungen-und-ziele.md`    |
| 2 Technik Stack                           | `02-tech-stack.md`                 |
| 3 Frontend: Struktur / Bausteine          | `03-frontend-bausteine.md`         |
| —                                         | `04-systemnah-wasm-bausteine.md`   |
| —                                         | `05-integration-wasm.md`           |
| —                                         | `06-ki-engineering-und-prozess.md` |
| 4 Tooling                                 | `07-tooling.md`                    |
| 5 Qualität                                | `08-qualitaet.md`                  |
| 6 Quellcode Übersicht                     | `09-quellcode-uebersicht.md`       |
| 7 Detaillierte Aspekte + 8 Projektbericht | `10-projektbericht.md`             |
| 9 Anhang                                  | `11-anhang.md`                     |
| 10 KI-Verzeichnis                         | `12-ki-verzeichnis.md`             |

**Was aus dem Muster direkt übernommen werden sollte**

- Die **Detailbetrachtung einer Kernkomponente** (Muster: 3.2 _DietScreen.js_). Das Gegenstück hier
  ist `Flock::update()` bzw. der Schritt-Ablauf eines Simulationsschritts — inklusive
  ASCII-Hierarchie im Anhang.
- Die **Formel-Kapitel** (Muster: 3.7). Hier: die vier Steering-Regeln, `integrate`, die
  Dash-Zustandsmaschine, `dash_render_phase`, der Overlap-Relaxationsschritt. Mit gesetzten Formeln,
  Legende und den Edge Cases im Text.
- Die **Coverage-Tabelle mit Einordnung**. Hier zwingend, weil die Zahlen ohne Erklärung falsch
  gelesen würden: die niedrige Frontend-Coverage ist eine Aussage über die Node-Umgebung von Vitest,
  und `wasm_bridge/response.rs` steht bei 0 % obwohl 14 Browser-Tests darauf laufen. Genau die Art
  von Zahl, die das Muster nicht versteckt, sondern erklärt.
- Die **bewussten Verzichte**. Muster: kein Prettier, kein TypeScript, kein Production Build. Hier:
  keine `rand`-Abhängigkeit (Reproduzierbarkeit), kein WebGL-Renderer, gestrichene Features
  (Schild, Slow-Time) zugunsten des Tooling-Budgets. Alle drei gehören mit Begründung in den Text.
- Die **Soll/Ist-Tabelle** samt offener Benennung der Abweichung.

**Was besser gemacht werden kann als im Muster** — das Muster nennt in 8.3 selbst als größte
Schwäche, dass die Dokumentation nachgelagert entstand. Dieses Projekt schreibt sie laut `CLAUDE.md`
commit-begleitend mit (`projekt-journal.md`). Diese Umkehrung gehört ausdrücklich in Kapitel 10 als
Lesson Learned formuliert — sie ist ein direkter Vorteil gegenüber dem Vorbild und für den Professor
sichtbar.

---

## 5 Arbeitsanweisung für Claude in diesem Projekt

Diese Datei ist die **Stilreferenz**, nicht der Inhalt. Beim Schreiben von Reportkapiteln gilt:

1. **Vorher hierher schauen.** Vor jedem Kapitel unter `documentation/report/` das entsprechende
   Muster-Kapitel oben lesen und Aufbau sowie Detailtiefe übernehmen.
2. **Deutsch, sachlich, unpersönlich, Präsens** für den Ist-Zustand. Kein „ich", kein „man", keine
   Werbe- oder Marketingsprache, keine Superlative.
3. **Keine Behauptung ohne Begründung.** Wenn kein „weil" hinter einer Entscheidung steht, ist der
   Absatz nicht fertig.
4. **Nur belegbare Fakten.** Kennzahlen, Testanzahlen und Coverage-Werte kommen aus tatsächlich
   ausgeführten Befehlen — nie geschätzt, nie aus dem Gedächtnis. Der Befehl, der eine Zahl erzeugt,
   gehört nach `09-quellcode-uebersicht.md`.
5. **Negative Befunde bleiben stehen.** Nichts beschönigen. Ein ehrlich benannter und eingeordneter
   Mangel ist im Muster nachweislich besser bewertet worden als eine glatte Darstellung.
6. **Alternativen dokumentieren.** Was verworfen wurde, warum, und welche Konsequenz das hat — die
   `Entscheidung`-Blöcke in `projekt-journal.md` sind das Rohmaterial dafür.
7. **Auslagern statt aufblähen.** Tabellen ab ca. fünf Zeilen, alle Abbildungen und alle
   Code-Ausschnitte in `11-anhang.md`, aus dem Fließtext mit Nummer und Titel referenziert.
8. **Durchnummerieren und beschriften.** „Tabelle n: Titel", „Abbildung n: Titel",
   „Quellcode-Ausschnitt n: Titel" — jedes Element wird mindestens einmal im Text referenziert.
9. **Abkürzungen pflegen.** Jede neu eingeführte Abkürzung landet im Abkürzungsverzeichnis
   (WASM, WAT, FPS, AABB, RAF, DOM, ES, CI/CD, LOC, MVP, …).
10. **KI-Verzeichnis mitschreiben.** Jeder Prompt sofort nach `ai/YYYY-MM-DD-session.json` mit
    korrektem `topic`; `12-ki-verzeichnis.md` wird daraus generiert und nicht von Hand gepflegt.
11. **Die 400-Zeilen-Regel gilt nicht unter `documentation/`.** Ein Kapitel darf lang sein und wird
    nicht in Teildateien zersägt.

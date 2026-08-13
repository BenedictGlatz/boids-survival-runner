# 1 Anforderungen und Ziele

`Seitenbudget: ~2 S. | Status: Entwurf | Quellen: .github/copilot-instructions.md §Project Overview, docs/specs-overview.md §1–3, README.md, CLAUDE.md`

Damit die Entwicklung auf ein prüfbares Ziel zuläuft, definiert dieses Kapitel zuerst
die Zielgruppe und ihren Bedarf, danach den Funktionsumfang, mit dem das Projekt darauf
antwortet, die Rahmenbedingungen des Vorhabens und zuletzt das gewählte Fokus-Thema.
Alles Weitere im Bericht ist die technische Ausführung dieser vier Festlegungen.

## 1.1 Themensteckbrief: Nutzer, Prozess, Pain und Kontext

**Zielgruppe** sind Gelegenheitsspieler am Desktop-Browser, die eine Runde in einer
Pause spielen und dafür nichts einrichten wollen: keine Installation, kein Konto, kein
Server, keine Berechtigung. Ein zweites Publikum liest den Quellcode statt ihn
auszuführen — das Projekt entsteht im Hochschulkontext und der Code ist zugleich
Lernmaterial für Rust und WebAssembly (WASM). Diese zweite Gruppe ist kein Beiwerk,
sondern begrenzt die Mittel: Lesbarkeit steht in `CLAUDE.md` ausdrücklich über
Cleverness, was bestimmte Optimierungen ausschließt (siehe 1.4 Entwicklungsfokus).

**Kernprozess** ist eine einzelne Runde und deren Wiederholung. Der Spieler startet aus
dem Menü, ein Countdown friert die Welt für den Einstieg ein, danach weicht er einem
Schwarm aus, der ihn sucht. Alle 30 Sekunden beginnt eine neue Welle: der Schwarm
wächst um zwölf Boids und schickt bis zur fünften Welle je eine schnellere, weiter
sehende Variante, außerdem füllt sich die Arena zunehmend mit zeitlich begrenzten
Hindernissen. Gegen den Schwarm hat der Spieler drei Mittel — Ausweichen, einen Dash
mit Abklingzeit und drei aufsammelbare Power-ups. Nach drei verlorenen Leben endet die
Runde, das Ergebnis wird mit dem lokal gespeicherten persönlichen Bestwert verglichen,
und aus der Game-Over-Karte führt ein Weg direkt in die nächste Runde. Der Prozess ist
damit bewusst kurz und vollständig wiederholbar; er enthält keinen Schritt, der beim
zweiten Mal übersprungen werden möchte.

**Nutzer-Pain** ist die Lücke zwischen zwei Arten vorhandener Anwendungen.
Schwarmsimulationen im Browser sind überwiegend Demonstratoren: sie zeigen das
Boids-Modell mit Regelgewichten an Schiebereglern, haben aber kein Spielziel, keine
Niederlage und deshalb keinen Grund, sie ein zweites Mal zu öffnen. Browserspiele
umgekehrt haben ein Ziel, ihre Gegner folgen aber gescripteten Bahnen oder einer
einzelnen Verfolgungsregel — der Schwarm ist Kulisse, nicht Mechanik. Dazu kommt eine
technische Ursache für diese Trennung: eine Simulation, die jeden Boid gegen jeden
anderen prüft, wird in JavaScript bereits bei einigen hundert Entitäten zum
Bildratenproblem, weshalb spielbare Umsetzungen die Schwarmlogik gerade dort
vereinfachen, wo sie interessant wird. Das Projekt adressiert genau diese Lücke: echte
Schwarmregeln als Spielmechanik, und die Rechenlast dafür in einer Sprache, die sie
tragen kann.

**Nutzungskontext** ist eine Sitzung von wenigen Minuten am Desktop-Browser mit
Tastatur. Gesteuert wird mit **W A S D** oder den Pfeiltasten, der Dash liegt auf der
Leertaste, Escape pausiert; die Maus wird nicht benötigt, und auch das Menü bleibt
vollständig mit der Tastatur bedienbar. Die Spielwelt hat eine feste Größe von
1920 × 1080 Einheiten und wird an das Fenster nur skaliert, damit dieselbe Runde in
jedem Fenster dieselbe Simulation ist. Touch-Eingabe und mobile Bildschirme sind kein
Ziel: die Steuerung braucht zwei Achsen und eine Aktionstaste gleichzeitig, und ein
Daumen verdeckt genau den Bildbereich, in dem der Schwarm ankommt.

## 1.2 Die Lösung

Boids Survival Runner ist ein Ausweich-Spiel im Browser, dessen Gegner eine vollständige
Boids-Schwarmsimulation ist. Die Simulation läuft als Rust-Modul in WebAssembly, die
Darstellung und die Eingabe liegen in einem JavaScript-Frontend, und zwischen beiden
steht eine absichtlich schmale Schnittstelle aus flachen Zahlenpuffern. Das Spiel ist
installationsfrei und serverlos: es lädt als statisches Artefakt, hält seinen Bestwert
im Browser und stellt keine Netzwerkanfrage.

Der Funktionsumfang des MVP besteht aus sieben Spezifikationen, die zugleich das
Vokabular des Kapazitätsplans sind (siehe 10.1 Kapazitätsplan):

1. **Schwarm-Simulation** (S-01) — fünf Steering-Regeln, mehrere Boid-Varianten in
   einem Schwarm, Kollisions- und Überlappungsauflösung.
2. **WASM-Bridge-API** (S-02) — der Puffer-Vertrag zwischen Rust und JavaScript
   (siehe Kapitel 5 Frontend/Systemnah-Integration).
3. **Rendering und HUD** (S-03) — Canvas-Darstellung, Leben, Punkte, Welle, Timer.
4. **Spiel-Loop und Wellen-Progression** (S-04) — fester Zeitschritt,
   Schwierigkeitskurve, Pause bei Escape und bei Fokusverlust.
5. **Steuerung und Power-ups** (S-05) — Spieler-Dash, Boid-Dash samt Vorwarnung, sowie
   die drei Power-ups Aegis, Overdrive und Mend.
6. **Querschnitt** (S-06) — Internationalisierung, Punktestand mit lokalem Bestwert,
   Build-Pipeline.
7. **Temporäre Hindernisse** (S-07) — Weltgeometrie mit Kapselform, getrennte Reaktion
   von Spieler und Boids darauf, Dichte-Rampe über die Wellen.

Bewusst **nicht** umgesetzt sind drei Erweiterungen, jede aus einem eigenen Grund:

- **Slow-Time** als viertes Power-up entfällt. Es wäre das einzige, dessen Wirkung
  darin besteht, den festen Zeitschritt zu verbiegen — also genau die Invariante, auf
  der die Korrektheit des Spiel-Loops beruht (siehe 1.4 Entwicklungsfokus). Ein
  Feature, dessen Kern das Aufweichen einer tragenden Invariante ist, ist der schlechteste
  Kandidat für die letzte freie Kapazität.
- **Ein WebGL-Renderer** entfällt. Die Indirektion dafür existiert im Frontend, das
  Canvas-Backend ist hinter einer Schnittstelle austauschbar (siehe 3.1 Wesentliche
  Komponenten); die zweite Implementierung ist es nicht. Der Grund ist Kapazität und
  wird in 10.1 offengelegt, nicht technische Unmöglichkeit.
- **Ein serverseitiger Highscore** entfällt, hier aber nicht aus Kapazitätsgründen: er
  widerspräche der Rahmenbedingung, ohne Server auszukommen (siehe 1.3).

Zwei weitere Punkte des Anforderungskatalogs — CI/CD-Pipeline und Deployment — sind
offene Posten und werden dort begründet, wo sie hingehören (siehe 7.10 Deployment und
8.3 CI/CD: GitHub Actions Pipeline).

## 1.3 Details zum Softwareprojekt

Das Vorgehen ist **spezifikationsgetrieben**: vor der Implementierung wird das erwartete
mathematische Verhalten samt Randfällen festgeschrieben, erst danach entsteht Code.
Die Spezifikationen liegen als eigene Dokumente neben dem Repository-Code
(`docs/spec-s05-dash.md`, `docs/spec-s07-hindernisse.md` und weitere) und werden
nachgezogen, wenn die Umsetzung sie korrigiert — ein Fall, der zweimal eingetreten ist.
Dieser Ansatz ist hier nicht Formalismus, sondern die einzige praktikable Prüfmethode:
Ein Schwarm sieht auf dem Bildschirm auch dann plausibel aus, wenn eine Regel falsch
gewichtet ist, weshalb „sieht richtig aus" als Abnahmekriterium ausfällt und eine vorab
formulierte Erwartung an ihre Stelle treten muss.

Es ist ein **Ein-Personen-Projekt** mit KI-Unterstützung; die Konfiguration dieser
Unterstützung und der daraus folgende Arbeitsablauf sind selbst Gegenstand des Berichts
(siehe Kapitel 6 KI-driven Engineering & Prozess). Versioniert wird in einem
zweistufigen Branch-Modell aus `main` und `dev` (siehe 7.7 Branch-Struktur). Jede
abgeschlossene Änderung wird atomar nach dem Conventional-Commits-Schema committet und
trägt drei Pflichtanteile mit sich: den Eintrag in `CHANGELOG.md`, die Protokollierung
des verwendeten Prompts und eine Zeile im Projekt-Journal. Der Journaleintrag ist der
Mechanismus, mit dem dieser Bericht **begleitend** und nicht nachgelagert entsteht —
eine bewusste Umkehrung gegenüber der Musterdokumentation, die genau diese Nachlagerung
als ihre größte Schwäche benennt (siehe 10.3 Lessons Learned).

Als Rahmenbedingung gilt durchgehend, dass das Spiel für Endnutzer
**installationsfrei und serverlos** bleibt. Daraus folgt unmittelbar, was es nicht gibt:
kein Backend, keine Datenbank, kein Konto, keine externe API (siehe 2.2
Architektur-Entscheidungen). Der Bestwert liegt im Speicher des Browsers, die
Sprachdateien werden zur Laufzeit als statische JSON-Datei geladen. Zeitlich ist das
Projekt durch die Abgabe am 03.09.2026 begrenzt, mit einem selbst gesetzten Code-Freeze
am 24.08.2026, damit die verbleibenden Tage der Dokumentation gehören. Das geplante
Aufwandsbudget übersteigt die verfügbare Kapazität; das ist bekannt, dokumentiert und
über die Reihenfolge der Maßnahmen gesteuert statt weggerechnet (siehe 10.1
Kapazitätsplan).

## 1.4 Entwicklungsfokus

Als Fokus-Thema ist **Systemnah / WASM** gewählt. Der Grund liegt im Gegenstand selbst:
Die Schwarmsimulation prüft jeden Boid gegen jeden anderen, ihr Aufwand wächst also
quadratisch mit der Boid-Zahl, während der Anspruch bei durchgehend 60 Bildern pro
Sekunde und einigen hundert bis tausend Entitäten liegt. Das ist die einzige Stelle im
Projekt, an der die Wahl der Ausführungsumgebung über die Machbarkeit entscheidet, und
damit die einzige, an der eine systemnahe Sprache mehr ist als eine Vorliebe.

Optimiert wurde entlang zweier Invarianten, die im weiteren Bericht immer wieder
auftauchen und beide aus dem Fokus-Thema folgen. Die erste ist der **feste
Zeitschritt**: die Simulation rechnet einen Schritt pro Aufruf und skaliert nicht mit
der Bildzeit, das Frontend ruft sie mit konstanter Rate auf und begrenzt nur das
Zeichnen auf die gewählte Bildrate. Dadurch ist eine Runde von der Leistung des
Rechners entkoppelt und, in Verbindung mit dem vollständigen Verzicht auf einen
Zufallszahlengenerator in der Engine, reproduzierbar. Die zweite ist der **flache
Puffer-Vertrag** über die Sprachgrenze: Positionen, Geschwindigkeiten und Renderzustände
reisen als typisierte Zahlenfelder, nicht als Objekte pro Entität, weil die Kosten des
Grenzübertritts sonst mit der Entitätszahl mitwachsen (siehe 5.2.1 Der Puffer-Vertrag).

Die Grenze zwischen den Schichten ist scharf gezogen und in beide Richtungen
formuliert: Die Engine kennt weder DOM noch Canvas noch eine Browser-API, das Frontend
enthält keine Simulationsmathematik. Diese Trennung ist keine Stilfrage, sondern die
Voraussetzung für die Teststrategie — die Engine-Tests laufen ohne Browser, die
Frontend-Tests ohne gebautes WASM-Paket (siehe 8.1 Unit Tests und Coverage).

Dem Leistungsziel steht ein zweites, gleichrangiges Ziel gegenüber: **Lesbarkeit**. Der
Quellcode soll von jemandem verstanden werden, der Rust zum ersten Mal liest, was
`unsafe`, manuelles SIMD und dichte Iteratorketten ausschließt und die naive
quadratische Nachbarschaftssuche gegenüber einem räumlichen Index bevorzugt, solange die
Bildrate hält. Die beiden Ziele stehen in einem echten Konflikt, und er ist bewusst zu
Gunsten der Lesbarkeit entschieden — mit der Einschränkung, dass Optimierungen dort
erlaubt sind, wo eine Messung sie begründet und nicht ein Gefühl (siehe 8.6 GPU-Last:
Messgrundlage vor Optimierung).

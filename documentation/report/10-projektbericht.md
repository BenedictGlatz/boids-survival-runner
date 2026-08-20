# 10 Projektbericht

`Seitenbudget: ~2 S. | Status: Entwurf | Quellen: projekt-journal.md, docs/specs-overview.md §3, git log`

Dieses Kapitel berichtet über den **Projektverlauf** statt über das Produkt: mit
welcher Kapazität geplant wurde, welche Kapazität tatsächlich in welche Maßnahmen
geflossen ist, welche Herausforderungen dabei auftraten und was davon über dieses
Projekt hinaus verwendbar ist. Grundlage ist das mitlaufende
[Projekt-Journal](projekt-journal.md), nicht die Rückschau — jede Zahl und jeder Fall
unten war zum Zeitpunkt seines Auftretens festgehalten worden.

## 10.1 Kapazitätsplan

### 10.1.1 Planung

Geplant wurde in einem gemeinsamen Vokabular aus **Maßnahmen-IDs**, das Planung,
Journal und dieses Kapitel teilen: `S-01`…`S-07` für die fachlichen Spezifikationen,
`T-01`…`T-08` für Tooling- und Qualitätsmaßnahmen, `D-01` für die Dokumentation. Die
Schätzungen stehen in `docs/specs-overview.md` §3 und wurden **iterativ
fortgeschrieben**, nicht einmalig festgelegt: Jede nachträglich aufgenommene Maßnahme
trägt dort ihre Begründung und den Betrag, um den sie das Gesamtbudget erhöht hat.

| Block                                         | Specs         | Plan (h) |
| --------------------------------------------- | ------------- | -------: |
| Fachliche Spezifikationen und Implementierung | `S-01`…`S-07` |     ≈ 30 |
| Tooling und Qualität                          | `T-01`…`T-08` |     ≈ 20 |
| Dokumentation                                 | `D-01`        |     ≈ 20 |
| **Gesamt**                                    |               | **≈ 70** |

Der ursprünglich geschätzte Umfang des fachlichen Blocks lag bei ≈ 22 h und wuchs in
drei Schüben: `S-07` (temporäre Hindernisse, ~5 h) und `S-05b` (Power-ups, ~2 h) kamen
fachlich hinzu, `T-03`, `T-07` und `T-08` als Qualitätsmaßnahmen (9 h), und der
gesamte Tooling-Block war in der ersten Schätzung überhaupt nicht enthalten. Er ist
keine eigene Idee, sondern eine Forderung des Anforderungskatalogs, die beim ersten
Schätzen übersehen worden war. Am Ende trägt er mit 20 h zwei Drittel dessen, was für
die gesamte Fachlichkeit veranschlagt war.

Damit schöpfte das Budget die in realistisch fünf Wochen **verfügbare Kapazität von
Anfang an vollständig aus** und ließ keine Reserve für Fehlschätzungen — genau die
Reserve, die 10.1.3 Ist gegen Plan gebraucht hätte. Diese Enge wurde nicht durch eine
nachträgliche Gegenkürzung wegdefiniert, sondern durch zwei Mittel bearbeitet. Erstens
die bewusste Streichung von _Slow-Time_ aus `S-05` — das einzige der drei angedachten
Power-ups, das den festen Zeitschritt hätte aufweichen müssen, also ausgerechnet eine
der beiden tragenden Invarianten (siehe 5.3 Integration / Schnittstellen). Zweitens eine
**begründete Reihenfolge**: Maßnahmen, die zwei Bewertungskriterien gleichzeitig
bedienen — Tests und Coverage zahlen sowohl auf das Kapitel _Qualität_ als auch auf
das Kriterium „hohe Testabdeckung" im Working Code ein —, liegen vor solchen, die nur
eines bedienen. TypeScript (`T-02`), CI/CD (`T-05`) und Deployment (`T-06`) stehen
deshalb bewusst am Ende der Liste. Reicht die Kapazität nicht, fällt die Entscheidung
dort und wird dort begründet, nicht am vorderen Ende.

### 10.1.2 Erfassung des Ist-Aufwands

Ist-Aufwände wurden **pro Arbeitssitzung** im Journal erfasst und ausdrücklich
**nicht** aus `git log` rekonstruiert. Die Begründung ist messbar: Die Commits fallen
in Schübe auf wenige Kalendertage (siehe 9.3 Weitere Masszahlen), Commit-Zeitstempel
komprimieren also Arbeitsschübe und sagen nichts über Lese-, Denk- und Debugging-Zeit.
Bei KI-unterstützter Entwicklung ist der Abstand zwischen zwei Commits ein aktiv
irreführender Aufwandsindikator, und verworfene Ansätze hinterlassen überhaupt keinen
Commit — genau die Stunden, nach denen ein Kapazitätsplan fragt. `git log` diente als
Gegenprobe, nicht als Quelle.

Die Zeilen des Journals ergeben aggregiert 97,8 h über 59 Einträge und zehn
Arbeitstage, verteilt auf 59,0 h unter einer `S`-, 19,5 h unter einer `T`- und 19,3 h
unter der `D`-ID. Die Blocktabelle unten ist daraus **konsolidiert und auf halbe
Stunden gerundet** und weicht aus zwei benennbaren Gründen von der reinen Zeilensumme
ab. Erstens benennt die Journal-ID das _Artefakt_ der Sitzung, nicht die
_Tätigkeit_: Detail-Spezifikationen, Journalzeilen, Entscheidungsblöcke und
Changelog-Einträge entstehen innerhalb einer Umsetzungssitzung und stehen deshalb
unter deren `S`- oder `T`-ID, sind der Sache nach aber Dokumentation. Auf Blockebene
sind sie `D-01` zugeordnet, rund 13,5 h. Zweitens steht die laufende Arbeit an Anhang,
Diagrammen und dem Zusammenbau des Abgabedokuments zum Redaktionsschluss noch nicht als
Journalzeile und kommt mit rund 2 h hinzu. Beide Korrekturen verschieben Aufwand in
dieselbe Richtung, nämlich zu `D-01`.

Diese Erfassung hat darüber hinaus eine **Lücke, die benannt gehört**: Das Journal
beginnt am 29.07.2026, das Repository am 03.05.2026. Die 24 Commits davor — der
spielbare Prototyp aus Schwarmsimulation, Bridge, Renderer und Loop sowie der
Frametime-Graph — sind **nicht** in den Ist-Zahlen enthalten. Die unten ausgewiesenen
100 h sind daher der Aufwand der dokumentierten Projektphase, nicht der Gesamtaufwand.
Rückwirkend geschätzte Stunden wären eine Erfindung gewesen und hätten die
Aussagekraft der übrigen Zeilen mit beschädigt. Für die Auswertung heißt das: Jede
Überschreitung im fachlichen Block ist eine **Untergrenze**.

### 10.1.3 Ist gegen Plan

| Block                                         | Specs         | Plan (h) | Ist (h) | Differenz |
| --------------------------------------------- | ------------- | -------: | ------: | --------: |
| Fachliche Spezifikationen und Implementierung | `S-01`…`S-07` |     ≈ 30 |      50 |      + 20 |
| Tooling und Qualität                          | `T-01`…`T-08` |     ≈ 20 |      15 |       − 5 |
| Dokumentation                                 | `D-01`        |     ≈ 20 |      35 |      + 15 |
| **Gesamt**                                    |               | **≈ 70** | **100** |  **+ 30** |

_Die Aufschlüsselung je Maßnahme steht im Anhang (siehe 11.1 Tabellen,
Kapazitätsplan je Maßnahme — Plan und Ist)._

Das Projekt hat sein Budget um **30 h oder 43 %** überschritten. Die Überschreitung
verteilt sich nicht auf einen Ausreißer, sondern auf zwei Blöcke, die unabhängig
voneinander geschätzt wurden und beide um einen ähnlichen Faktor danebenliegen: die
Fachlichkeit um 67 %, die Dokumentation um 75 %. Wenn zwei getrennte Schätzungen um
nahezu denselben Faktor zu niedrig ausfallen, liegt die Ursache nicht in den einzelnen
Aufgaben, sondern in der Schätzmethode — hier in einer Schätzung, die den fertigen
Zustand veranschlagt und den Weg dorthin nicht: Diagnose, Nachbesserung und das
Schreiben dessen, was getan wurde. Wegen der Lücke aus 10.1.2 Erfassung des
Ist-Aufwands ist die fachliche Überschreitung zudem eine Untergrenze; die Stunden der
Prototyp-Phase vor dem 29.07.2026 fehlen darin vollständig.

Im fachlichen Block tragen drei Zeilen den Betrag. `S-03` (3 h geplant, 11,5 h
erfasst) hat einen Design-Handoff aufgenommen, der zum Schätzzeitpunkt nicht vorlag.
`S-07` (4 h geplant, 12,5 h erfasst) und `S-05` einschließlich `S-05b` (5,5 h geplant,
13,0 h erfasst) sind die beiden umfangreichsten Features des Projekts, beide
vollständig umgesetzt und beide erst nach der ersten Schätzung aufgenommen — sie
wurden also zu einem Zeitpunkt beziffert, zu dem ihr Umfang am wenigsten bekannt war.
Dazu kommt Aufwand, den keine Feature-Schätzung enthielt: allein die beiden in 10.2
Herausforderungen beschriebenen Befunde stehen für rund 6,5 h, überwiegend Diagnose.

Die einzige Zeile unter Plan ist der Tooling-Block, und sie ist **keine Einsparung**.
`T-02` (TypeScript-Prüfung), `T-05` (CI/CD-Pipeline) und `T-06` (Deployment) weisen je
0,0 h aus und stehen zusammen für 5,5 h Plan; die zweite Stufe von `T-08` für weitere
3 h, deren Priorisierung planmäßig von den Zahlen abhängt, die ihre erste Stufe erst
erzeugt hat (siehe 8.6 GPU-Last: Messgrundlage vor Optimierung). Alle vier sind als
begründete Negativbefunde ausgeschrieben statt verschwiegen (siehe 7.6 TypeScript, 8.3
CI/CD: GitHub Actions Pipeline und 7.10 Deployment). Was tatsächlich stattgefunden hat,
liegt mit 15,0 h gegen 11,5 h geplant um 3,5 h **über** Schätzung — der Block folgt
also demselben Muster wie die beiden anderen, und sein Minus entsteht ausschließlich
daraus, dass drei von acht Maßnahmen nicht begonnen wurden.

`D-01` ist die größte relative Überschreitung und zugleich die einzige, die noch
wächst: 35 h gegen 20 h Plan, und darin sind Anhang, Diagramme, der Zusammenbau des
Abgabedokuments und die Abschlusspräsentation noch nicht enthalten. Was hier
unterschätzt wurde, ist nicht das Mitschreiben während der Entwicklung — das hat
funktioniert und ist in 10.3 Lessons Learned als tragfähig ausgewiesen —, sondern der
davon unabhängige Aufwand, aus mitgeschriebenen Fakten Prosa zu machen.

Was die Planung trotz der Überschreitung trägt: Ihre **Reihenfolge** hat gehalten. Von
den acht Tooling-Maßnahmen sind genau die fünf umgesetzt, die vorn in der begründeten
Liste standen, und die drei offenen sind genau die, die dort ans Ende gestellt wurden.
Eine Planung, deren Betrag zu niedrig war, deren Ausfälle aber an der vorher benannten
Stelle eintreten, ist die stärkere Aussage als eine, die im Nachhinein aufgeht, weil
irgendwo still gekürzt wurde.

## 10.2 Herausforderungen

**Technisch** war die teuerste Herausforderung eine **Speicherverletzung an der
Sprachgrenze**. Ein Playtest endete mitten in der Runde mit
`RuntimeError: index out of bounds`, im Stack ausschließlich der heiße Pfad bis
`tick()`. Die naheliegende Lesart — ein Indexfehler in der Engine — war falsch, und
das ließ sich messen statt vermuten: Ein absichtlich provozierter Rust-Panic aus
demselben Build meldet sich als `RuntimeError: unreachable`, die Summe aller
Stapelrahmen des Moduls beträgt 1,5 kB gegen 1 MiB Stapel. Übrig blieb ein Zeiger auf
eine nicht mehr gültige Struktur. Rund 4 h kostete der Fall, davon etwa dreieinhalb
die Diagnose; zwei Millionen simulierte Schritte über vier parallele Browserläufe
reproduzierten nichts, weil die Ursache gar nicht in der Simulation lag. Sichtbar
wurde sie erst, als ein Testaufbau versehentlich zwei Modulinstanzen erzeugte:
_initEngine_ zweimal nebenläufig aufgerufen ergibt **zwei** WebAssembly-Instanzen,
weil der generierte Loader nur gegen ein abgeschlossenes Laden prüft. Beide Halden
mischen sich, und die `FinalizationRegistry` der verworfenen Instanz gibt Adressen in
der überlebenden frei. Erreichbar war das im Spiel über eine gehaltene Leertaste auf
dem Startknopf. Behoben wurde es, indem der Ladevorgang als geteiltes Promise statt
als Flag geprüft wird (siehe 5.2 Komponenten — Details & Interaktion).

Die zweite technische Herausforderung hat kein einzelnes Datum, weil sie viermal in
verschiedener Gestalt auftrat: **Zusicherungen, die weniger prüfen, als ihr Name
verspricht.** Nach der Umsetzung der temporären Hindernisse waren 129 Rust-Tests
grün, und die Arena im laufenden Spiel war leer — eine leere Welt erfüllt jede
Obergrenze und jede Ausschlussregel, die sich formulieren lässt, und eine Untergrenze
war nirgends formuliert. Der Test gegen das Durchtunneln einer Stange prüfte, dass
der Boid danach nicht _innerhalb_ liegt, was ein übersprungener Boid ebenfalls
erfüllt. Das Feststecken des Spielers in einem Hindernis war nur über **zwei
aufeinanderfolgende** Aufrufe sichtbar, während jeder vorhandene Test einen einzelnen
prüfte. Und die Überlappungsauflösung des Schwarms garantiert asymptotische
Annäherung statt Erreichen, weshalb eine naheliegende `>=`-Zusicherung ein Test
gewesen wäre, der niemals bestehen kann. Zusammen rund 2,5 h, überwiegend Diagnose.
Gefunden hat den ersten dieser Fälle keine der drei Teststufen, sondern ein Blick auf
einen Screenshot des laufenden Spiels.

**Organisatorisch** wiegt am schwersten, dass die **Tooling-Anforderungen zu spät
gegen den Anforderungskatalog geprüft** wurden. Die ursprüngliche Schätzung — ≈ 22 h
für den fachlichen Block — enthielt keine einzige Stunde für Linter, Formatter,
Coverage, E2E-Tests, CI/CD oder Deployment, obwohl der Katalog dafür zwei eigene
Kapitel und ein eigenes Bewertungskriterium vorsieht. Die nachgeholte Schätzung ergab
20 h, also fast noch einmal so viel wie die gesamte Fachlichkeit, und musste in die
Restlaufzeit gedrängt werden — und die drei zuletzt einsortierten Maßnahmen
sind genau die, die bis heute offen sind. Der Aufwand für das Nachziehen selbst blieb
dabei in einem Fall unter der Kontrolle der Planung und in einem nicht: Die
JSDoc-Nachrüstung war mit 1,5–2 h geplant und lag bei 2,5 h, weil `eslint --fix` auf
einer frisch eingeführten Regel rund 90 inhaltsleere `@param`-Zeilen an private
Helfer hängte, bevor die Regel-Reichweite pro Regel statt einmal fürs Plugin
eingestellt war.

Die zweite organisatorische Herausforderung betrifft das eigene Prozessritual. Das
**Prompt-Logging war lückenhaft**: Für den 29.07. war ein Prompt protokolliert,
obwohl der Tag drei Commits inklusive einer 365-zeiligen Spezifikation hervorbrachte.
Die Ursache ist strukturell und nicht Disziplin. `CHANGELOG.md` verlangt einen Append
an _eine_ Datei zur Commit-Zeit und wurde durchgehend gepflegt; das Prompt-Log
verlangt einen Append _vor_ der Antwort, also außerhalb jedes bestehenden Takts, und
schlief ein. Die Konsequenz war, das Journal-Ritual an die funktionierende Gewohnheit
anzudocken — Commit-Zeit, eine Datei, ein Append — und die Vollständigkeit mit
`npm run docs:check` beratend statt blockierend zu prüfen, weil blockierende
Git-Hooks nachts mit `--no-verify` umgangen werden. Rückwirkend wurden **keine**
Prompts erfunden; die Lücke ist in Kapitel 12 KI-Verzeichnis offengelegt.

## 10.3 Lessons Learned

**Ein Prozessritual hält nur in einem bereits vorhandenen Takt.** Changelog und
Prompt-Log stellten dieselbe Anforderung — eine Zeile pro Änderung — und nur eines von
beiden wurde durchgehend erfüllt. Der Unterschied ist nicht Sorgfalt, sondern der
Zeitpunkt: Der Append zur Commit-Zeit hängt an einer Handlung, die ohnehin stattfindet,
der Append vor der Antwort an keiner. Für den Betrieb folgt daraus, neue Prozessvorgaben
grundsätzlich an einen bestehenden Arbeitsschritt zu binden statt einen neuen zu
fordern, und Vollständigkeitsprüfungen beratend statt blockierend zu bauen.

**Eine schmale, explizit dokumentierte Schnittstelle zahlt sich doppelt aus.** Der
Puffer-Vertrag zwischen Engine und Frontend besteht aus flachen typisierten Arrays mit
Zählern und sonst nichts. Er machte beide Seiten unabhängig testbar — die Engine unter
`cargo test` ohne Browser, die Frontend-Logik unter Vitest ohne WASM-Build — und er
machte die Erweiterung um drei zusätzliche Puffer zu einer additiven Änderung ohne
Anpassung bestehender Aufrufer. Für zukünftige Projekte empfiehlt sich, die
Schnittstelle zwischen zwei Technologien nicht aus dem Bedarf wachsen zu lassen,
sondern sie vorab zu definieren und ihre Invarianten als eigene Teststufe abzusichern:
Der teuerste Fehler des Projekts saß genau dort, wo bis dahin keine solche Stufe lag,
nämlich im Lebenszyklus des Moduls statt in seinem Datenvertrag.

**Eine Zusicherung muss die Sache selbst prüfen, nicht ihre Folge.** Vier Befunde
dieses Projekts sind Varianten desselben Musters: Obergrenzen ohne Untergrenze, ein
Endzustand statt der Bewegung dorthin, ein einzelner Aufruf statt zweier
aufeinanderfolgender. Alle vier Testmengen waren grün, alle vier Verhaltensweisen
falsch. Die übertragbare Regel lautet, zu jeder Ausschlussbedingung („nichts liegt
falsch") die zugehörige Existenzbedingung („überhaupt liegt etwas") zu formulieren und
bei zustandsbehaftetem Code mindestens zwei Schritte zu prüfen. Ergänzend gilt: Bei
einem sichtbaren Feature bleibt der Blick auf das laufende Programm ein Arbeitsschritt
und keine Bequemlichkeit — er hat hier gefunden, was drei Teststufen nicht fanden.

**Spezifikation vor Implementierung zahlt auf das Ergebnis ein, nicht auf den
Aufwand.** Die beiden Maßnahmen mit einer eigenen, vorab geschriebenen
Detail-Spezifikation — der Dash (`docs/spec-s05-dash.md`) und die temporären
Hindernisse (`docs/spec-s07-hindernisse.md`) — sind die beiden umfangreichsten
Features des Projekts, beide vollständig umgesetzt und beide ohne nachträgliche
Korrektur ihres Umfangs. Bei den Hindernissen kam hinzu, dass die Sackgassenfreiheit
in der Spezifikation als Beweisskizze formuliert und dadurch konstruktiv erzwungen
werden konnte, statt sie zur Laufzeit zu prüfen (siehe 4.8 Implementierung der
Fachlogik). Billiger gemacht hat die Spezifikation sie dagegen nicht: `S-07` (4 h
geplant, 12,5 h erfasst) und `S-05` (5,5 h geplant, 13,0 h erfasst) stellen den
größten Teil der Überschreitung des fachlichen Blocks. Die Lehre ist deshalb enger zu
fassen, als sie zunächst aussieht — eine vorab geschriebene Spezifikation ist eine
Korrektheits- und keine Sparmaßnahme: Sie verhindert Nacharbeit an der falschen Sache,
nicht den Aufwand für die richtige. Entsprechend braucht nicht jede Änderung eine
Spezifikation, aber jede, deren erwartetes Verhalten sich mathematisch formulieren
lässt.

**Anforderungen an Werkzeuge und Prozess gehören in dieselbe erste Schätzung wie die
Fachlichkeit.** Der Tooling-Block war nicht unterschätzt, er war schlicht nicht
vorhanden — 20 h, also knapp drei Zehntel des Endbudgets, kamen erst nach dem
Projektstart hinzu. Für den Betrieb heißt das, den Abnahme- oder Anforderungskatalog
vor der ersten Schätzung Punkt für Punkt in Arbeitspakete zu übersetzen, auch dort, wo
er keine Fachlichkeit beschreibt. Der zweite Teil der Lehre ist der Notausgang, der
hier tatsächlich gezogen wurde: Ein Werkzeug wegzulassen und seine Abwesenheit in drei
belegten Sätzen zu begründen kostet Minuten statt Stunden — und ist, wie die
Musterdokumentation zeigt, keine Abwertung, sondern eine ehrliche Aussage.

**Determinismus ist eine Architekturentscheidung, keine Implementierungsdetail.** Die
Engine kommt ohne jede Zufallsquelle aus; Dash-Auswahl, Hindernis-Platzierung und
Spawn-Punkte werden deterministisch aus dem Schrittzähler abgeleitet. Das war
nachträglich nicht mehr einführbar gewesen, und es ist die Voraussetzung dafür, dass
ein Simulationsfehler überhaupt reproduzierbar ist — bei einem Fehler, der erst nach
zwei Millionen Schritten auftritt, ist Reproduzierbarkeit der Unterschied zwischen
Diagnose und Raten. Übertragbar ist die allgemeinere Form: Eigenschaften, die die
Testbarkeit eines Systems bestimmen, sind früh und global zu entscheiden, weil sie
sich nicht lokal nachrüsten lassen.

**Die begleitende Dokumentation hat den Zeitdruck am Projektende verringert, aber nicht
beseitigt.** Ein Viertel aller Commits verändert ausschließlich Dokumentation (siehe
9.3 Weitere Masszahlen), und die Entscheidungen der Kapitel 03 bis 05 mussten beim
Schreiben nicht rekonstruiert, sondern nur aus dem Journal geholt werden. Trotzdem
steht `D-01` mit 35 h gegen 20 h Plan bei 175 % seines Budgets, während Anhang, Layout
und Präsentation noch ausstehen. Die Lehre ist keine Korrektur des Vorgehens, sondern
seiner Dosierung: Das Mitschreiben von **Fakten** während der Entwicklung funktioniert
und ist beizubehalten; unterschätzt wurde der davon unabhängige Aufwand für
Zusammenbau, Nummerierung und Layout am Ende.

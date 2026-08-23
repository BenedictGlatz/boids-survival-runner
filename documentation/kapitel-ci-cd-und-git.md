# 8 CI/CD & Git

> **Hinweis für die Übernahme in die .docx:** Dieses Kapitel ist als neues **Kapitel 8**
> gedacht und steht damit direkt hinter „7 Tooling". Die bisherigen Kapitel 8 bis 12
> (Qualität, Quellcode-Übersicht, Projektbericht, Anhang, KI-Verzeichnis) verschieben sich
> jeweils um eins auf 9 bis 13. Die beiden Tabellen dieses Kapitels sind im
> Tabellenverzeichnis als „Tabelle 7" und „Tabelle 8" einzusortieren; die bisherigen
> Tabellen 7 bis 9 rutschen entsprechend auf 9 bis 11. Querverweise im Text sind mit den
> **neuen** Nummern geschrieben, also z. B. „Kapitel 9 Qualität" für das bisherige
> Kapitel 8.

Dieses Kapitel behandelt zwei Themen, die im Projekt sehr unterschiedlich weit gekommen
sind. Die Versionsverwaltung mit Git wird seit dem ersten Tag benutzt und hat den Ablauf
der Entwicklung deutlich geprägt. Eine automatisierte Pipeline, die bei jeder Änderung
Tests und Prüfungen ausführt, gibt es dagegen nicht. Beides wird im Folgenden mit seinem
tatsächlichen Stand beschrieben.

## 8.1 Versionsverwaltung mit Git

Das Repository arbeitet mit zwei Branches, deren Rollen die Namen schon ankündigen.
`main` soll nur lauffähige, stabile Stände tragen. `dev` ist der Zweig, auf dem
tatsächlich entwickelt wird, und auf ihn zeigt auch der Standard-Branch des Remotes.

**Feature-Branches gibt es nicht.** Das ist eine Entscheidung und kein Versäumnis: Ein
eigener Branch pro Feature dient dazu, parallele Arbeit voneinander zu trennen und eine
Code-Review aufzunehmen. Bei einem Entwickler, der mit einem KI-Assistenten arbeitet,
fällt beides nicht an. Ein solcher Branch hätte also keinen Konflikt zu lösen und keine
Review zu beherbergen, sondern nur einen zusätzlichen Arbeitsschritt eingeführt.
Entsprechend enthält die Historie keinen einzigen Merge-Commit; jede Änderung ist ein
eigener Commit direkt auf `dev`.

Die Aufgabe, die sonst die Isolation eines Branches übernimmt, übernimmt hier die
Commit-Disziplin: ein Commit entspricht einer abgeschlossenen Änderung, einer Zeile im
Changelog und einer Zeile im Entwicklungsjournal. Dadurch bleibt jede Änderung auch im
Nachhinein einzeln nachvollziehbar, obwohl sie nicht in einem eigenen Zweig lag.

**Der Ist-Stand von `main` ist gleichzeitig ein negativer Befund.** Der Branch steht bei
einem einzigen Commit und liegt damit über einhundert Commits hinter `dev`. Er erfüllt
die ihm zugewiesene Rolle derzeit also nicht: Er trägt keinen stabilen Stand, sondern
einen alten. Die Ursache ist, dass ein Merge nach `main` bislang keinen Anlass hatte. Ein
Deployment, das aus `main` bauen würde, existiert nicht (siehe 8.4 Deployment über GitHub
Pages), und ein `push` erfolgt in diesem Projekt nur bewusst und nicht automatisch.
Vorgesehen ist der Merge zum Code-Freeze, weil `main` dort genau die Bedeutung bekommt,
die für die Abgabe gebraucht wird: der Stand, gegen den bewertet wird.

Als Konvention für die Commit-Nachrichten wird **Conventional Commits** verwendet, also
das Schema `<typ>(<bereich>): <beschreibung>`. Der Typ sagt in einem Wort, um welche Art
von Änderung es sich handelt.

| Typ        | Bedeutung                                  |  Anzahl |
| ---------- | ------------------------------------------ | ------: |
| `feat`     | neue Funktionalität                        |      41 |
| `docs`     | Dokumentation, Bericht, Journal            |      30 |
| `chore`    | Werkzeuge und Projektpflege                |       9 |
| `refactor` | Umbau ohne Verhaltensänderung              |      12 |
| `fix`      | Fehlerbehebung                             |       8 |
| `test`     | Tests ohne Änderung am Produktivcode       |       5 |
| `perf`     | Änderung der Laufzeit ohne neues Verhalten |       2 |
| sonstige   | `style`, `revert`                          |       2 |
| **Summe**  |                                            | **109** |

_Tabelle 7: Verteilung der Commit-Typen auf `dev`_

Fünf dieser Commit-Titel tragen versehentlich ein zusätzliches Zeichen vor dem Typ und
sind damit formal nicht konform; sie sind in der Tabelle ihrem gemeinten Typ zugeordnet.

Diese Konvention ist keine Kosmetik. Sie ist die Voraussetzung dafür, dass sich der
Changelog und die Zahlen in den Kapiteln 10 Quellcode-Übersicht und 11 Projektbericht aus
der Historie heraus belegen lassen, statt aus der Erinnerung geschrieben werden zu müssen.
Die Verteilung selbst ist ebenfalls aussagekräftig: Dass nach den Features die
Dokumentation die zweitgrößte Gruppe bildet, entspricht dem Vorgehen, den Bericht
begleitend statt am Ende zu schreiben (siehe 6.2 Workflow).

## 8.2 CI/CD: Der Ist-Stand

**Eine Pipeline existiert nicht.** Im Verzeichnis `.github/` liegt allein die
Instruktionsdatei für das KI-Modell, aber kein `workflows/`-Verzeichnis. Die dafür
vorgesehene Maßnahme T-05 ist mit fünf Stunden geplant und offen geblieben. Damit ist
dies der Punkt des Anforderungskatalogs, den das Projekt nicht erfüllt, und er wird hier
benannt statt weggelassen.

Der Grund ist die Reihenfolge, in der die Werkzeug-Maßnahmen abgearbeitet wurden.
Priorisiert wurde danach, wie viel eine Maßnahme zum Ergebnis beiträgt: Linter, Coverage
und die Testsuiten bedienen gleich zwei Bewertungskriterien, nämlich die Qualität als
Kapitel und die Testabdeckung als Eigenschaft des Codes. Eine Pipeline bedient dagegen
nur eines, weil sie keine neue Prüfung hinzufügt, sondern vorhandene Prüfungen wiederholt.
Als die Kapazität knapp wurde, fiel die Entscheidung am hinteren Ende dieser Liste.

**Die Wirkung dieser Lücke lässt sich genau beschreiben,** und sie ist kleiner als sie
klingt, aber nicht null. Alle Prüfungen, die eine Pipeline ausführen würde, existieren
schon und sind jeweils ein einzelner Befehl; die vollständige Liste steht in Kapitel 7
Tooling. Was fehlt, ist nicht die Prüfung selbst, sondern die Instanz, die sie erzwingt.
Derzeit hält die Disziplin nur deshalb, weil jede Änderung von Hand gegen Linter,
Formatter und die Testbefehle gefahren wird. Eine übersprungene Prüfung fällt damit erst
beim nächsten bewussten Lauf auf.

Ein zweiter Punkt kommt hinzu, und er ist der eigentliche Verlust: Eine Pipeline baut das
Projekt in einer **leeren Umgebung**. Genau das kann der Entwicklungsrechner nicht
leisten. Das Frontend braucht zum Start das aus Rust erzeugte WebAssembly-Paket, und
dieses Paket liegt lokal längst im Verzeichnis. Ein Stand, der nur deshalb baut, weil
dort noch Reste eines früheren Builds liegen, würde also gar nicht auffallen.

## 8.3 Der geplante Aufbau

Entworfen ist die Pipeline als vier Jobs in einer Datei `.github/workflows/ci.yml`,
ausgelöst bei jedem Push und bei jedem Pull Request. Ein Job ist dabei ein Bündel von
Befehlen, das GitHub auf einem eigenen, frisch aufgesetzten Rechner ausführt.

| Job        | Inhalt                                                   | Läuft nach |
| ---------- | -------------------------------------------------------- | ---------- |
| `rust`     | Formatprüfung, Clippy und Unit-Tests der Engine          | –          |
| `frontend` | Linter, Formatprüfung, Vitest und Coverage-Report        | –          |
| `build`    | WASM-Build und Produktionsbuild, danach die E2E-Tests    | `rust`     |
| `deploy`   | Veröffentlichung auf GitHub Pages, nur vom Branch `main` | `build`    |

_Tabelle 8: Die vier Jobs der geplanten Pipeline_

Die Abhängigkeiten folgen den Laufzeiten und nicht der Kapitelreihenfolge. `rust` und
`frontend` laufen gleichzeitig, weil keiner der beiden ein Ergebnis des anderen braucht
und beide in weniger als einer Minute fertig sind. Ein Formatierungsfehler soll nicht
hinter einem langsamen Rust-Build warten müssen. `build` hängt dagegen an `rust`, weil ein
WebAssembly-Paket aus Code, der nicht kompiliert, sinnlos wäre. Die E2E-Tests hängen an
diesem Job, weil sie den gebauten Stand ohnehin selbst herstellen und ausliefern (siehe
9.2 E2E Tests). `deploy` ist an `main` gebunden und wäre damit die eine Stelle, an der die
Rollenverteilung der beiden Branches aus 8.1 eine technische Konsequenz bekommt statt nur
eine Verabredung zu bleiben.

**Ein Job ist bewusst als nicht blockierend vorgesehen:** die Prüfung der
Dokumentationsdisziplin, also ob Prompt-Log, Journal und Changelog zur Änderung passen.
Die Begründung ist eine Erfahrung aus dem Projekt selbst. Das Protokollieren der Prompts
war über Wochen lückenhaft, weil es einen Eintrag _vor_ der Antwort verlangt, während der
Changelog-Eintrag an der bereits funktionierenden Gewohnheit „Commit-Zeit" hängt. Eine
Prüfung, die den Build wegen einer fehlenden Journalzeile rot färbt, wird spätabends
umgangen und verliert damit jede Aussagekraft. Eine sichtbare Warnung, die stehen bleibt,
nicht. Ein rotes Kreuz soll bedeuten, dass der Code kaputt ist, sonst wird die Farbe
bedeutungslos.

Das Aufsetzen selbst wäre entsprechend günstig, denn die Jobs rufen nur vorhandene und
lokal grüne Befehle auf. Feste Schwellwerte für die Coverage sind bewusst nicht
vorgesehen und könnten daher auch keinen Job rot machen. Der teure Teil von T-05 ist
nicht die Pipeline, sondern das Deployment an ihrem Ende.

## 8.4 Deployment über GitHub Pages

**Ein Deployment existiert ebenfalls nicht.** Das Spiel läuft installationslos aus dem
gebauten `dist/`-Verzeichnis über jeden statischen Webserver, und für eine Vorführung
genügt der lokale Vorschau-Server. Öffentlich veröffentlicht ist es aber nicht; die
Maßnahme T-06 ist mit drei Stunden geplant und offen.

Vorgesehen ist **GitHub Pages**, ausgeliefert aus dem `deploy`-Job der Pipeline. Die
Begründung ergibt sich direkt aus der Rahmenbedingung aus Kapitel 1: Gefordert ist eine
Anwendung ohne Installation und ohne Server. Das gebaute Artefakt ist ein statisches
Bündel plus eine WebAssembly-Datei, es braucht keine Laufzeitumgebung, keine Datenbank
und keine Sitzungsverwaltung. Pages liefert statische Dateien aus demselben Repository
aus, das den Code ohnehin hält, kostet nichts und braucht keine zusätzliche
Zugangsverwaltung. Andere Anbieter wurden nicht verglichen, weil sie sich bei einem rein
statischen Bündel in nichts unterscheiden würden, das für dieses Projekt messbar wäre.

Ein technischer Punkt ist dabei kein Detail, sondern der erste Schritt der Maßnahme: Die
erzeugte `index.html` verweist derzeit **absolut** ab der Domainwurzel auf ihre Bündel.
Unter einer Pages-Adresse der Form `…github.io/<repository>/` zeigt dieser Pfad neben das
Bündel und liefert einen Fehler. Die Sprachdatei wird dagegen über einen relativen Pfad
geladen und würde weiter funktionieren. Beide Hälften derselben Seite würden sich also
unterschiedlich verhalten, was einen solchen Fehler unangenehm zu diagnostizieren macht.
Nötig ist dafür eine Vite-Konfigurationsdatei, die den Basispfad setzt — eine Datei, die
das Projekt bisher nicht braucht, weil alle Standardannahmen von Vite zutreffen.

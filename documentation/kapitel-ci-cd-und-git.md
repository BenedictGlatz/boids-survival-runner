# 8 CI/CD & Git

> **Hinweis für die Übernahme in die .docx:** Dieses Kapitel ist als neues **Kapitel 8**
> gedacht und steht direkt hinter „7 Tooling". Die bisherigen Kapitel 8 bis 12 verschieben
> sich jeweils um eins auf 9 bis 13. Die Tabelle dieses Kapitels ist im
> Tabellenverzeichnis als „Tabelle 7" einzusortieren; die bisherigen Tabellen 7 bis 9
> rutschen auf 8 bis 10. Querverweise im Text sind bereits mit den **neuen** Nummern
> geschrieben.

## 8.1 Versionsverwaltung mit Git

Das Repository arbeitet mit zwei Branches: `main` soll nur stabile Stände tragen, `dev`
ist der Zweig, auf dem entwickelt wird. Feature-Branches gibt es bewusst nicht. Ein
eigener Branch pro Feature dient dazu, parallele Arbeit zu isolieren und eine Code-Review
aufzunehmen — bei einem Entwickler, der mit einem KI-Assistenten arbeitet, fällt beides
nicht an. Stattdessen ist jede Änderung ein eigener, atomarer Commit direkt auf `dev`,
zusammen mit ihrer Zeile im Changelog und im Entwicklungsjournal.

Die Commit-Nachrichten folgen **Conventional Commits**, also dem Schema
`<typ>(<bereich>): <beschreibung>`. Von den 109 Commits auf `dev` sind 41 `feat` und 30
`docs`; der Rest verteilt sich auf `refactor`, `chore`, `fix`, `test` und `perf`. Dass
die Dokumentation die zweitgrößte Gruppe bildet, entspricht dem Vorgehen, den Bericht
begleitend statt am Ende zu schreiben (siehe 6.2 Workflow). Die Konvention ist dabei die
Voraussetzung dafür, dass sich Changelog und die Zahlen in Kapitel 10 aus der Historie
belegen lassen statt aus der Erinnerung.

Ein negativer Befund gehört dazu: `main` steht bei einem einzigen Commit und damit über
einhundert Commits hinter `dev`. Ein Merge hatte bislang keinen Anlass, weil kein
Deployment aus `main` baut. Vorgesehen ist er zum Code-Freeze, wo `main` die Bedeutung
bekommt, die die Abgabe braucht: der Stand, gegen den bewertet wird.

## 8.2 CI/CD und Deployment

**Eine Pipeline existiert nicht,** ebenso wenig ein öffentliches Deployment; die
Maßnahmen T-05 und T-06 sind geplant, aber offen geblieben. Priorisiert wurde nach
Beitrag zum Ergebnis: Linter, Coverage und Testsuiten bedienen zwei Bewertungskriterien
gleichzeitig, eine Pipeline wiederholt nur vorhandene Prüfungen. Als die Kapazität knapp
wurde, fiel die Entscheidung am hinteren Ende dieser Liste.

Die Wirkung der Lücke ist klein, aber nicht null: Alle Prüfungen existieren als einzelne
Befehle (Kapitel 7 Tooling) und werden vor jedem Commit von Hand gefahren — was fehlt,
ist die Instanz, die das erzwingt, und vor allem der Bau in einer **leeren Umgebung**.
Auf dem Entwicklungsrechner liegt das WebAssembly-Paket längst im Verzeichnis; ein Stand,
der nur wegen solcher Reste baut, würde lokal nie auffallen.

Entworfen ist die Pipeline als vier Jobs, ausgelöst bei jedem Push:

| Job        | Inhalt                                                   | Läuft nach |
| ---------- | -------------------------------------------------------- | ---------- |
| `rust`     | Formatprüfung, Clippy und Unit-Tests der Engine          | –          |
| `frontend` | Linter, Formatprüfung, Vitest und Coverage-Report        | –          |
| `build`    | WASM-Build und Produktionsbuild, danach die E2E-Tests    | `rust`     |
| `deploy`   | Veröffentlichung auf GitHub Pages, nur vom Branch `main` | `build`    |

_Tabelle 7: Die vier Jobs der geplanten Pipeline_

`rust` und `frontend` laufen parallel, weil keiner ein Ergebnis des anderen braucht;
`build` hängt an `rust`, weil ein WASM-Paket aus nicht kompilierendem Code sinnlos wäre.
`deploy` ist an `main` gebunden — die eine Stelle, an der die Branch-Rollen aus 8.1 eine
technische Konsequenz bekämen statt nur eine Verabredung zu sein. Als Ziel ist GitHub
Pages vorgesehen, weil das Spiel ein rein statisches Bündel ohne Server ist und Pages
direkt aus dem Repository ausliefert, das den Code ohnehin hält.

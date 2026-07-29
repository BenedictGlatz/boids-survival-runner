# 10 Projektbericht

`Seitenbudget: ~2 S. | Status: Gerüst | Quellen: projekt-journal.md, docs/specs-overview.md §3, git log`

**Wird am Ende komponiert, nicht fortgeschrieben.** Die pro Änderung anfallende Form
dieses Kapitels ist das [Projekt-Journal](projekt-journal.md) — hier steht nichts,
was nicht dort gesichert wurde. Das Schreiben ist ein `grep` nach `→ Kap. 10`.

## 10.1 Kapazitätsplan

> TODO: Tabelle `Maßnahme | Plan (h) | Ist (h) | Abweichung`.
> **Plan** aus [docs/specs-overview.md §3](../../docs/specs-overview.md) (S-01…S-06,
> T-01…T-06, D-01). **Ist** aus der Aufwandstabelle des Journals, aggregiert je
> Maßnahmen-ID.
>
> Der Katalog fragt zwei Dinge getrennt: _mit welcher Kapazität wurden welche
> Maßnahmen geplant_ und _welche Kapazität wurde schließlich auf welche Maßnahmen
> eingesetzt_. Beide Richtungen beantworten, nicht nur die Differenz.
>
> Was hier ehrlich stehen muss, weil es der Plan von Anfang an ausweist:
>
> - Das Gesamtbudget von ≈131 h lag **über** der verfügbaren Kapazität von ~5 Wochen.
> - Der Anforderungskatalog verlangte Tooling (≈24 h), das in der ursprünglichen
>   Schätzung von 85 h überhaupt nicht enthalten war.
> - Gegenfinanzierung war die bewusste Streichung von Schild und Slow-Time aus S-05.
>
> Eine Planung, die eine erkannte Überbuchung dokumentiert und gegensteuert, ist
> stärker als eine, die im Nachhinein aufgeht.
>
> Methodische Anmerkung, die hineingehört: Ist-Aufwände wurden pro Arbeitssitzung
> erfasst und **nicht** aus `git log` rekonstruiert. Begründung steht im Journal;
> Kurzform: Commits fallen in Schübe auf wenige Kalendertage, und bei
> KI-unterstützter Entwicklung ist die Zeit zwischen Commits kein Aufwandsmaß.
> `git log` diente als Gegenprobe.

## 10.2 Herausforderungen

> TODO: aus dem Journal-Abschnitt _Herausforderungen_ komponieren. Technische und
> organisatorische trennen, wie es die Musterdokumentation tut. Jeweils: Problem,
> was es gekostet hat, wie es gelöst wurde.
>
> Bereits gesichert:
>
> - Die Lückenhaftigkeit des eigenen Prompt-Logging-Rituals und die strukturelle
>   Ursache (Append zur Commit-Zeit hält, Append außerhalb des Takts nicht).
>
> Zu erwarten und beim Auftreten sofort zu notieren: Fixed-Timestep-Fehlerklassen
> (Treffer, die bei Mehrschritt-Frames verloren gehen; ein Tastendruck, der zu
> mehreren Dashes wird), die Abhängigkeit des Frontend-Builds vom WASM-Build,
> Determinismus ohne Zufallsquelle, Rust-Lernkurve, Toolchain unter Windows.

## 10.3 Lessons Learned

> TODO: aus dem Journal komponieren. Keine Allgemeinplätze — jede Lektion muss auf
> ein konkretes Ereignis in diesem Projekt zeigen.
>
> Kandidaten, schon belegbar:
>
> - **Ein Ritual hält nur im vorhandenen Takt.** Der Changelog wurde durchgehend
>   gepflegt, das Prompt-Log nicht — Unterschied ist nicht Disziplin, sondern ob der
>   Append zur Commit-Zeit an _einer_ Datei stattfindet. Übertragbar auf jede
>   Prozessvorgabe im Betrieb.
> - **Eine schmale, explizit dokumentierte Schnittstelle zahlt sich aus.** Der
>   Vier-Puffer-Vertrag machte Engine und Frontend unabhängig testbar.
> - **Spezifikation vor Implementierung** hat sich beim Dash messbar gelohnt
>   (12 h gegen 14 h geschätzt) — mit Verweis auf `docs/spec-s05-dash.md`.
> - **Anforderungen an das Tooling früher gegen den Katalog prüfen.** Die
>   Tooling-Lücke wurde erst spät erkannt und musste in die Restlaufzeit gedrängt
>   werden.
> - **Determinismus ist eine Architekturentscheidung, keine Implementierungsdetail.**
>   Der Verzicht auf `rand` musste von Anfang an durchgehalten werden; nachträglich
>   wäre er nicht mehr einführbar gewesen.

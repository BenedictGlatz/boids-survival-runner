# 6 KI-driven Engineering & Prozess

`Seitenbudget: ~2 S. | Status: Gerüst | Quellen: CLAUDE.md (vollständig), .github/copilot-instructions.md, ai/*.json, documentation/report/projekt-journal.md`

Dieses Kapitel kann früh geschrieben werden: Der Prozess ist stabil und liegt
**bereits schriftlich vor** — `CLAUDE.md` und `copilot-instructions.md` sind
maschinenlesbare Prozessdokumentation.

## 6.1 Modulare Konfiguration

> TODO: Zwei Instruktionsdateien, ein Regelwerk:
> `.github/copilot-instructions.md` (werkzeugübergreifend) und `CLAUDE.md`
> (Claude Code, mit konkreten Befehlen und Architektur-Walkthrough). Erklären, warum
> beide existieren und wie Redundanz vermieden wird — CLAUDE.md verweist explizit
> darauf, dass die Konventionen aus der Copilot-Datei stammen und gleichermaßen
> gelten.
> `.claude/settings.json` als committete Permission-Allowlist (nur schreibgeschützte
> Befehle) gegenüber `.claude/settings.local.json` als maschinenlokaler Ergänzung.

## 6.2 Komponenten & Struktur

> TODO: Welche Regeln aus dem Regelwerk die *Struktur* des Codes tatsächlich geformt
> haben — das ist der überprüfbare Teil:
> - „Human readability is the top priority", explizit begründet damit, dass hier
>   Studierende Rust und WebAssembly lernen: keine Trait-Akrobatik, keine
>   makrolastigen Muster, `for`-Schleifen statt dichter Iterator-Ketten.
> - 400 Zeilen Obergrenze pro Quelldatei → sichtbar am Zerfall des Dash in drei
>   Module (Kap. 4.3).
> - Keine Magic Numbers, keine hartcodierten nutzersichtbaren Strings.
> - Werte, die pro Boid abweichen können, gehören auf den Boid — nicht in eine neue
>   globale Konstante.
> - Doc-Kommentar für jeden `#[wasm_bindgen]`-Export.

## 6.3 Entwicklungsprozess & Workflow

> TODO:
> - **Spec-driven:** erwartetes mathematisches Verhalten und Edge Cases werden vor
>   der Implementierung definiert. `docs/spec-s05-dash.md` als ausgeführtes Beispiel
>   inklusive Testfall-Enumeration und Aufwand Soll/Ist.
> - **Verpflichtende Schritte pro Änderung** (CLAUDE.md): Prompt-Logging,
>   Changelog-Eintrag, atomarer Conventional Commit, Testabwägung, Journal-Eintrag.
> - **Modell-Mix:** aus `ai/*.json` ableiten, welche Modelle für welche Art von
>   Aufgabe eingesetzt wurden. Keine Zahlen doppeln — Kap. 12 hat die Tabelle.
> - **Begleitende Dokumentation** als bewusste Prozessentscheidung: Fakten pro
>   Änderung ins Journal, Struktur-Kapitel in zusammenhängenden Sitzungen.
>   Begründung und verworfene Alternativen stehen im Journal unter
>   *2026-07-29 — Dokumentation begleitend statt nachgelagert*.
> - **Ehrlich benennen:** Das Prompt-Logging war zunächst lückenhaft (22 Prompts auf
>   27 Commits). Ursachenanalyse und die daraus gezogene Konsequenz stehen im Journal
>   unter *Herausforderungen*; die Lücke selbst wird in Kap. 12 offengelegt. Die
>   Beobachtung ist berichtswürdig: Ein Ritual hält, wenn es zur Commit-Zeit an
>   *einer* Datei stattfindet, und schläft ein, wenn es außerhalb dieses Takts liegt.

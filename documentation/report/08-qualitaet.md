# 8 Qualität

`Seitenbudget: ~2 S. | Status: Gerüst | Quellen: frontend/vitest.config.js, engine/src/** (#[cfg(test)]), CLAUDE.md §Commands`

**Dieses Kapitel wächst pro Commit** — wie Kap. 7, ein Absatz je Maßnahme am Tag
ihres Landens.

> TODO Einleitung: Die Teststrategie in einem Absatz — Unit-Tests auf beiden Seiten
> der Sprachgrenze, E2E für die Pfade, die nur im Browser existieren, CI als
> erzwingende Instanz, statische Analyse für Stil und Typen.

## 8.1 Unit Tests und Coverage

> TODO: Die **zweigeteilte** Testlandschaft ist hier die eigentliche Aussage:
>
> - **Rust:** `#[cfg(test)]`-Module direkt neben dem Code, den sie abdecken;
>   Unit-Tests sind für alle Mathematik- und Simulationsfunktionen verpflichtend
>   (CLAUDE.md §Hard rules). Ausführung mit `cargo test`.
> - **Frontend:** Vitest im `node`-Environment, konfiguriert in
>   `frontend/vitest.config.js`. Die Suite braucht **weder Browser noch gebautes
>   WASM-Paket** — und genau daraus folgt ihre Grenze: Nur importfreie Logikmodule
>   sind so testbar. Ein Test, der `engine-bridge.js`, den Canvas-Renderer oder ein
>   DOM-Modul hereinzieht, läuft nicht. Testdateien liegen als `<modul>.test.js`
>   neben dem Modul und spiegeln damit die Rust-Konvention.
> - **`engine/tests/wasm_tests.rs`** ist derzeit ein Stub und prüft nichts. Entweder
>   füllen oder die Absenz begründen — nicht stillschweigend stehenlassen.
>
> Nach T-03: Coverage-Tabelle `Verzeichnis | Statements | Branches | Functions |
> Lines` und die **bewusste Priorisierung** erklären — Simulationsmathematik hoch,
> DOM-/Renderer-Module niedrig, weil letztere durch E2E abgedeckt werden. Die
> Musterdokumentation macht genau das und begründet ihre niedrige Gesamtzahl
> überzeugend; ein ehrlicher, begründeter Wert ist mehr wert als ein hoher.
> Zahlen aus Kap. 9 referenzieren, nicht hier duplizieren.

## 8.2 E2E Tests

> TODO: nach T-04 schreiben. Playwright, weil das Spiel eine Canvas-Anwendung ohne
> DOM-Struktur ist — die zu prüfenden Pfade sind Menü → Runde → Tod → Neustart,
> Tastatureingabe, und dass das WASM-Modul überhaupt lädt.
> Tabelle `Flow | Zweck | Dauer`. Report-Erzeugung und Ablageort nennen.
> Realistisch begrenzen: wenige Flows, die den kritischen Pfad abdecken. Wenn die
> Kapazität nicht reicht, die Absenz begründen statt eine leere Sektion zu lassen.

## 8.3 CI/CD: GitHub Actions Pipeline

> TODO: nach T-05 schreiben. `.github/workflows/ci.yml`, ausgelöst bei Push und Pull
> Request. Jobs beschreiben und begründen, in welcher Reihenfolge und was parallel
> läuft:
> Rust (`cargo fmt --check`, `cargo clippy`, `cargo test`) · Frontend (`lint`,
> `format:check`, `typecheck`, `test`, `test:coverage`) · Build (WASM + `vite build`)
> · Deploy nach GitHub Pages auf `main`.
> Erwähnen, dass die Pipeline die Toolchain-Kopplung erzwingt: Ohne
> `wasm-pack`-Schritt schlägt der Frontend-Build fehl.
> `docs:check` als **nicht blockierender** Job — Begründung: Ein blockierender Hook
> für Doku-Disziplin wird umgangen, eine sichtbare Warnung nicht.

## 8.4 Kommentare — Visuelle Strukturierung des Quellcodes

> TODO: Die Kommentar-Konvention ist im Projekt eine ausdrückliche Regel und gehört
> als solche beschrieben: „Jeder nicht-triviale Block erhält einen Kommentar in
> Alltagssprache, der *was* und *warum* erklärt, nicht *wie*." Dazu die Begründung —
> die Codebasis wird von Studierenden gelesen, die Rust neu lernen.
> Weitere erzwungene Punkte: Doc-Kommentar für jeden `#[wasm_bindgen]`-Export,
> Begründungskommentar für jeden `unsafe`-Block (es gibt derzeit keinen — das ist
> erwähnenswert), Begründungspflicht für jede Mikrooptimierung.
> JSDoc als maschinengeprüfte Variante davon → Verweis auf Kap. 7.5.

## 8.5 Lighthouse

> TODO: nach T-06 schreiben, wenn ein Pages-Deployment existiert. Anwendbar, weil es
> eine statisch ausgelieferte Web-Anwendung ist. Score für Performance,
> Accessibility, Best Practices, SEO angeben und **interpretieren**, nicht nur
> abbilden — insbesondere: Accessibility-Befunde einer Canvas-Anwendung sind
> strukturell begrenzt, und der Tastatur-Trade-off aus Kap. 3.2.2 ist hier
> anschlussfähig.

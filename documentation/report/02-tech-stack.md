# 2 Technik Stack

`Seitenbudget: ~2 S. | Status: Gerüst | Quellen: frontend/package.json, engine/Cargo.toml, CLAUDE.md §Commands, copilot-instructions.md §Tech Stack`

## 2.1 Rahmenbedingungen

> TODO: Browser-Anwendung ohne Installation und ohne Server als harte
> Rahmenbedingung (copilot-instructions.md). Daraus folgt: kein Backend, keine
> externe API, kein Account. Rechenintensive Simulation trotzdem in einer
> systemnahen Sprache → Rust nach WebAssembly.

## 2.2 Architektur-Entscheidungen

> TODO: Die drei tragenden Entscheidungen mit Begründung:
> (a) Zweischichtigkeit Engine/Frontend mit absichtlich schmaler Grenze;
> (b) Fixed Timestep statt Delta-Time-Skalierung;
> (c) flache typisierte Buffer statt Objektübergabe über die Sprachgrenze.
> Quelle für alle drei: CLAUDE.md §„The two load-bearing invariants". Details in
> Kap. 4 und 5, hier nur die Entscheidung und ihr Warum.

## 2.3 Tech Stack Canvas

> TODO: Tabelle `Schicht | Technologie | Version | Zweck` nach dem Vorbild der
> Musterdokumentation (Tabelle 10). Versionen aus frontend/package.json und
> engine/Cargo.toml ziehen, **nicht** aus dem Gedächtnis.
>
> Zeilen, die schon feststehen: Sprache Rust (Edition 2021) · Sprache JavaScript
> (ES-Module) · wasm-bindgen · js-sys · wasm-pack (Build) · Vite (Dev-Server und
> Bundler) · Vitest (Unit-Tests) · wasm-bindgen-test · HTML5 Canvas 2D (Rendering) ·
> JSON (Locales, Tuning).
>
> Wächst mit T-01…T-06: ESLint, Prettier, TypeScript (nur `checkJs`),
> Vitest-Coverage, Playwright, GitHub Actions, GitHub Pages. Jede Zeile in dem
> Commit ergänzen, der das Werkzeug einführt.

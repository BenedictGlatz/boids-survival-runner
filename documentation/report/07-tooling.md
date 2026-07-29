# 7 Tooling

`Seitenbudget: ~3 S. | Status: Gerüst | Quellen: frontend/package.json, engine/Cargo.toml, CLAUDE.md §Commands`

**Dieses Kapitel wächst pro Commit.** Jeder Werkzeug-Absatz wird in **demselben
Commit** geschrieben, der die Konfiguration einführt. Es gibt kein „dokumentiere ich
später" — später ist der 02.09.

Maßnahmen-IDs siehe [docs/specs-overview.md §3.2](../../docs/specs-overview.md).
Reihenfolge nach Dokumentationswert: T-01 → T-02 → T-03 → T-05 → T-06 → T-04.

## 7.1 Scripts in package.json

> TODO: Tabelle `Script | Nutzen` nach dem Vorbild der Musterdokumentation
> (Tabelle 4). **Muss am Ende alle in diesem Kapitel genannten Aspekte abdecken** —
> das ist eine ausdrückliche Anforderung des Katalogs.
>
> Bereits vorhanden: `dev` · `build` · `build:wasm` · `preview` · `test` ·
> `test:watch`.
> Kommt hinzu: `lint` · `lint:fix` (T-01) · `format` · `format:check` (T-01) ·
> `typecheck` (T-02) · `test:coverage` (T-03) · `test:e2e` · `test:e2e:report`
> (T-04) · `deploy` (T-06) · `docs:diagrams` · `docs:ki-verzeichnis` · `docs:check`.
>
> Erwähnen, dass die Rust-Seite **nicht** über npm läuft, sondern über Cargo
> (`cargo test`, `cargo clippy`, `cargo fmt`) — und warum das so bleibt.

## 7.2 Package Management

> TODO: npm für die Frontend-Seite, Cargo für die Engine — zwei Paketmanager, eine
> Verbindungsstelle (`wasm-pack`). Produktive Abhängigkeiten der Engine
> (`wasm-bindgen`, `js-sys`) und die bewusst leere `dependencies`-Sektion des
> Frontends erklären: Zur Laufzeit ist keine JS-Bibliothek beteiligt, alles
> Sichtbare ist handgeschrieben gegen Canvas 2D. Das ist eine begründbare
> Entscheidung, kein Versehen.

## 7.3 Linter

> TODO: nach T-01 schreiben. ESLint mit Flat Config (`eslint.config.js`),
> eingesetzte Regelsätze, und wie die projektspezifischen Hard Rules abgebildet
> werden (z. B. Verbot ungenutzter Variablen, `const`/`let` statt `var`).
> Für die Rust-Seite: `cargo clippy` als Gegenstück benennen.

## 7.4 Formatter

> TODO: nach T-01 schreiben. Prettier für JS/JSON/Markdown, `cargo fmt` für Rust.
> Zusammenspiel mit ESLint beschreiben (Formatierung beim Formatter, Semantik beim
> Linter — keine doppelten, widersprüchlichen Regeln).

## 7.5 JSDoc — über ESLint enforced

> TODO: nach T-01 schreiben. `eslint-plugin-jsdoc` mit `require-jsdoc`; verpflichtend
> für exportierte Funktionen, Testdateien ausgenommen. Beschreibungen für Parameter
> und Rückgabewerte werden geprüft.
> Die Kopplung zu 7.6 hervorheben: Diese JSDoc-Kommentare sind zugleich die
> Typinformation, aus der `checkJs` seine Prüfung zieht — die Regel zahlt doppelt.

## 7.6 TypeScript

> TODO: nach T-02 schreiben. **Keine Migration auf `.ts`**, sondern `tsconfig.json`
> mit `allowJs` + `checkJs` und ein `typecheck`-Script. Begründen: Der
> Typisierungsnutzen wird über die ohnehin verpflichtende JSDoc erreicht, ohne die
> Codebasis anzufassen und ohne einen Build-Schritt für die Typen einzuführen.
> Erwähnen, was das an der WASM-Grenze bringt — das generierte Glue-Modul liefert
> `.d.ts`-Dateien, `engine-bridge.js` wird damit typgeprüft.

## 7.7 Branch-Struktur

> TODO: `main` nur lauffähige, stabile Stände; `dev` als Integrationszweig. Aus
> `git log` verifizieren, bevor behauptet wird, es gebe Feature-Branches.
> Commit-Disziplin: Conventional Commits, atomar, kein `git push` ohne
> ausdrückliche Aufforderung (CLAUDE.md).

## 7.8 Dev Build

> TODO: `npm run dev` baut zuerst das WASM-Paket und startet dann Vite auf Port 5173.
> Die Kette erklären: `wasm-pack build ../engine --target web --out-dir
> ../frontend/src/wasm/engine`. Warum `--target web` und nicht `--target bundler`
> (die README-Variante ist veraltet), und warum das Ausgabeverzeichnis gitignoriert
> ist.

## 7.9 Production Build

> TODO: `npm run build` (WASM-Rebuild + `vite build`), `npm run preview` zur
> Kontrolle. Nach T-06 ergänzen: `vite.config.js` mit `base` für den
> GitHub-Pages-Unterpfad — ohne das laufen die Asset-Pfade ins Leere.

## 7.10 Deployment

> TODO: nach T-06 schreiben. GitHub Pages, deployt aus der CI-Pipeline.
> Begründung, die im Bericht stehen soll: erfüllt die Rahmenbedingung
> „installationsfrei und serverlos" unmittelbar, kostet nichts, und ein statisches
> Bundle plus `.wasm` braucht keine Server-Laufzeit. Alternativen wurden bewusst
> nicht evaluiert — das ist eine legitime, zu benennende Entscheidung.
> Auf den `base`-Pfad-Fallstrick hinweisen und auf die MIME-Type-Anforderung für
> `.wasm`.

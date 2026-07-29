# 7 Tooling

`Seitenbudget: ~3 S. | Status: Gerüst | Quellen: frontend/package.json, engine/Cargo.toml, CLAUDE.md §Commands`

**Dieses Kapitel wächst pro Commit.** Jeder Werkzeug-Absatz wird in **demselben
Commit** geschrieben, der die Konfiguration einführt. Es gibt kein „dokumentiere ich
später" — später ist der 02.09.

Maßnahmen-IDs siehe [docs/specs-overview.md §3.2](../../docs/specs-overview.md).
Reihenfolge nach Dokumentationswert: T-01 → T-02 → T-03 → T-05 → T-06 → T-04.

## 7.1 Scripts in package.json

Alle Frontend-Werkzeuge laufen über npm-Scripts in `frontend/package.json`. Der
Stand nach T-01:

| Script            | Nutzen                                                              |
|-------------------|---------------------------------------------------------------------|
| `dev`             | Baut das WASM-Paket und startet Vite auf Port 5173                  |
| `build`           | Produktionsbuild inkl. WASM-Rebuild                                 |
| `build:wasm`      | Baut nur das WASM-Paket (`--target web`)                            |
| `preview`         | Liefert den Produktionsbuild lokal aus                              |
| `test`            | Vitest-Suite einmalig                                               |
| `test:watch`      | Vitest im Watch-Modus                                               |
| `lint`            | ESLint über `frontend/` — muss fehler- und warnungsfrei sein        |
| `lint:fix`        | ESLint mit Autofix                                                  |
| `format`          | Prettier schreibend über das gesamte Repository                     |
| `format:check`    | Prettier prüfend — der Modus für die CI                             |
| `docs:ki-verzeichnis` | Erzeugt das KI-Verzeichnis (Kap. 12) aus `ai/*.json`            |
| `docs:check`      | Prüft die Doku-Disziplin (Prompt-Log, Journal, Changelog)           |

> TODO: bei den jeweiligen Maßnahmen ergänzen: `typecheck` (T-02) ·
> `test:coverage` (T-03) · `test:e2e`, `test:e2e:report` (T-04) · `deploy` (T-06) ·
> `docs:diagrams`.

Zwei Details, die die Tabelle nicht zeigt:

**Die Rust-Seite läuft bewusst nicht über npm.** `cargo test`, `cargo clippy` und
`cargo fmt` werden direkt aufgerufen, nicht in npm-Scripts eingewickelt. Ein
Wrapper würde nur einen zweiten Namen für denselben Befehl einführen und dabei
die Fehlerausgabe durch eine weitere Prozess-Ebene schieben; wer an der Engine
arbeitet, ist ohnehin in `engine/`. Die einzige Stelle, an der npm die
Rust-Toolchain wirklich anfasst, ist `build:wasm` — dort ist die Kopplung
erzwungen, weil das Frontend ohne das gebaute WASM-Paket nicht startet.

**`format` und `format:check` tragen `--ignore-path ../.prettierignore`.** Die
Scripts laufen aus `frontend/`, formatieren aber das ganze Repository (`..`).
Prettier sucht seine Ignore-Datei relativ zum *Arbeitsverzeichnis*, nicht relativ
zum Zielpfad — ohne den expliziten Pfad würde es `engine/target/` und `dist/`
mitformatieren. Der Fallstrick ist nicht offensichtlich und hat beim Einrichten
genau einmal zugeschlagen.

## 7.2 Package Management

> TODO: npm für die Frontend-Seite, Cargo für die Engine — zwei Paketmanager, eine
> Verbindungsstelle (`wasm-pack`). Produktive Abhängigkeiten der Engine
> (`wasm-bindgen`, `js-sys`) und die bewusst leere `dependencies`-Sektion des
> Frontends erklären: Zur Laufzeit ist keine JS-Bibliothek beteiligt, alles
> Sichtbare ist handgeschrieben gegen Canvas 2D. Das ist eine begründbare
> Entscheidung, kein Versehen.

## 7.3 Linter

Für das Frontend ESLint 9 in der **Flat Config** (`frontend/eslint.config.js`),
für die Engine `cargo clippy`.

Die Flat Config ist bei ESLint 9 der Standard; die alte `.eslintrc`-Form läuft dort
nur noch über eine Kompatibilitätsschicht. Da die Konfiguration neu angelegt wurde,
gab es keinen Grund, diese Schicht einzuziehen — zumal `frontend/package.json`
bereits `"type": "module"` setzt und `eslint.config.js` damit ohne weitere
Parser-Konfiguration als ES-Modul geladen wird.

Eingesetzte Regelsätze:

- **`@eslint/js` recommended** als Basis — die unstrittigen Fehlerklassen
  (unerreichbarer Code, doppelte Schlüssel, falsch verwendete Vergleiche).
- **`eslint-plugin-jsdoc`** (`flat/recommended`) für die JSDoc-Pflicht, siehe 7.5.
- **`eslint-config-prettier`** als letzter Eintrag, siehe 7.4.

Die projektspezifischen Hard Rules aus `CLAUDE.md` sind soweit möglich als Regel
abgebildet statt als Prosa-Konvention:

| Projektregel                            | Umsetzung                                              |
|-----------------------------------------|--------------------------------------------------------|
| Keine ungenutzten Variablen             | `no-unused-vars`, mit `^_` als Ausnahme-Präfix          |
| `const`/`let` statt `var`               | `no-var` und `prefer-const`                            |
| JSDoc auf öffentlicher API              | `jsdoc/require-jsdoc` und die Inhaltsregeln, siehe 7.5 |

Ebenso wichtig ist, was **bewusst nicht** aktiviert wurde. Strengere Sammel-Plugins
(`eslint-plugin-unicorn`, `eslint-plugin-sonarjs`) wurden geprüft und verworfen:
ihre Regelsätze optimieren auf idiomatisch-dichtes JavaScript und würden damit
direkt gegen die oberste Projektregel arbeiten — „`for`-Schleifen statt
Iterator-Ketten", „ausgeschriebene Namen statt Abkürzungen". Ein Linter, der die
Lesbarkeitsentscheidung des Projekts anmeckert, wird abgeschaltet statt befolgt.
Aus demselben Grund ist `no-underscore-dangle` aus: die `_feld`/`_methode`-Konvention
ist im Projekt die Kennzeichnung für „privat" und wird von der JSDoc-Regel sogar
ausgewertet.

Ausgenommen von der Prüfung ist `frontend/src/wasm/**` — generierter
`wasm-bindgen`-Glue-Code, gitignoriert und bei jedem Build neu erzeugt.

Auf der Rust-Seite übernimmt `cargo clippy` dieselbe Rolle und brauchte keine
zusätzliche Konfiguration. Ehrlicher Ist-Stand: Clippy meldet aktuell **eine**
Warnung — `Vec2::dot` in `engine/src/math/vector.rs` ist implementiert und
getestet, aber von keinem Aufrufer benutzt (`dead_code`). Die Methode gehört zur
Vollständigkeit des Vektortyps; die Warnung bleibt sichtbar, statt sie mit
`#[allow(dead_code)]` zuzudecken.

## 7.4 Formatter

Prettier für JavaScript, JSON, CSS und Markdown; `cargo fmt` für Rust.

Die Aufteilung gegenüber ESLint ist strikt: **Formatierung gehört dem Formatter,
Semantik dem Linter.** Erzwungen wird das durch `eslint-config-prettier` als
letzten Eintrag der Flat Config — es schaltet jede ESLint-Stilregel ab, die mit
Prettier kollidieren könnte. Ohne diesen Schritt melden beide Werkzeuge dieselbe
Stelle mit widersprüchlichen Forderungen, und `lint:fix` und `format` machen
abwechselnd die Änderung des anderen zunichte.

Die Konfiguration (`.prettierrc.json`) bleibt bewusst klein, weil Prettiers
Vorgaben dem vorhandenen Stil schon nahekamen:

| Option         | Wert       | Grund                                                     |
|----------------|------------|-----------------------------------------------------------|
| `singleQuote`  | `true`     | Entspricht dem durchgehenden Stil in `frontend/src`        |
| `trailingComma`| `all`      | Kleinere Diffs beim Anhängen von Argumenten                |
| `printWidth`   | `100`      | Entspricht der bereits gelebten Zeilenbreite               |
| `proseWrap`    | `preserve` | **Wichtig:** schützt die deutsche Prosa dieses Berichts    |

`proseWrap: preserve` ist der einzige Wert, der nicht Geschmackssache ist. Prettier
würde Absätze sonst auf `printWidth` umbrechen und damit jede handgesetzte
Zeilenstruktur in `documentation/report/**` bei jedem Formatierungslauf neu
verteilen — Diffs, in denen ein geänderter Halbsatz zwanzig Zeilen anfasst.

**Ort der Konfiguration.** `.prettierrc.json` und `.prettierignore` liegen im
Repository-Wurzelverzeichnis, nicht in `frontend/`, weil Prettiers Zuständigkeit
das ganze Repository ist: die Markdown-Kapitel dieses Berichts, `README.md` und
`CHANGELOG.md` liegen außerhalb von `frontend/`. Prettier löst seine Konfiguration
von der *zu formatierenden Datei* aus nach oben auf, eine Datei an der Wurzel deckt
damit beide Seiten ohne Duplikat ab. Die *Abhängigkeit* steht dennoch in
`frontend/package.json` — das ist der einzige Node-Paketwurzelpunkt im Repository,
und ein zweites `package.json` samt zweitem Lockfile nur für eine devDependency
anzulegen wäre teurer als die kleine Asymmetrie. Zur Konsequenz beim Aufruf
(`--ignore-path`) siehe 7.1.

Ignoriert werden Build-Artefakte (`engine/target/`, `dist/`, `src/wasm/`), die PDFs
unter `documentation/` und `package-lock.json` — letzteres, weil npm die Datei bei
jeder Installation selbst neu schreibt und eine Formatierung nur Churn erzeugt.

Auf der Rust-Seite ist `cargo fmt` das Gegenstück, ebenfalls ohne eigene
`rustfmt.toml`: die Standardkonfiguration ist im Rust-Ökosystem die Konvention, und
eine Abweichung müsste begründet werden statt umgekehrt. Der Code war beim
Einrichten bereits konform (`cargo fmt --check` läuft ohne Diff durch).

## 7.5 JSDoc — über ESLint enforced

JSDoc ist keine Bitte, sondern eine Lint-Regel. `eslint-plugin-jsdoc` prüft dabei
zwei Dinge getrennt:

1. **Vorhandensein** (`jsdoc/require-jsdoc`) — gibt es überhaupt einen Block?
2. **Inhalt** (`require-param`, `require-param-type`, `require-param-description`,
   `require-returns`, `require-returns-type`, `require-returns-description`) — hat
   jeder Parameter einen Typ *und* eine Beschreibung, und ist der Rückgabewert
   dokumentiert?

Verpflichtend ist beides für dieselbe Menge: **exportierte Funktionen und Klassen
sowie die öffentlichen Methoden einer exportierten Klasse.** Bewusst ausgenommen:

- **Einfache exportierte Konstanten.** `gameConfig.js` exportiert rund 30 Zahlen;
  eine `@returns`-Pflicht ergibt dort keinen Sinn. Wo ein Wert
  erklärungsbedürftig ist, steht ohnehin ein Kommentar — das ist eine
  Lesbarkeits-, keine API-Frage.
- **Unterstrich-Präfixe.** `_startDash`, `_drawCurves`, `_toPixels` sind interne
  Hilfsmethoden. Sie zu dokumentieren wie öffentliche API würde die Grenze
  verwischen, die der Unterstrich gerade zieht.
- **Testdateien.** In `*.test.js` ist der Testname die Dokumentation.
- **Modulprivate Funktionen.** `brighten()` in `canvasRenderer.js` hat einen
  einzeiligen Prosa-Kommentar und braucht keine Tag-Liste.

Technisch bemerkenswert ist, *wie* diese Menge definiert ist. Die naheliegende
Option `publicOnly: true` unterscheidet nur exportiert/nicht exportiert und kennt
die Unterstrich-Konvention des Projekts nicht. Stattdessen steht in der Config eine
Liste von esquery-Selektoren — `JSDOC_REQUIRED_CONTEXTS` —, die „exportierte
Klasse, Methode, kein Konstruktor, Name beginnt nicht mit `_`" ausdrückt. Diese
*eine* Liste wird von der Vorhandensein- **und** von allen Inhaltsregeln benutzt.
Das ist der Punkt: Ohne die gemeinsame Liste greifen die Inhaltsregeln auf jede
Funktion zu, die zufällig schon einen Kommentar trägt — auch auf private —, und
`--fix` schreibt dort leere `@param`-Zeilen hinein. Genau das passierte beim ersten
Lauf und musste zurückgenommen werden (siehe Journal).

Der Nutzen zeigte sich sofort, nicht erst in der Theorie. Zwei Module waren gar
nicht dokumentiert: `player/playerController.js` — die Spielerintegration inklusive
Dash — und `engine-bridge.js`, die einzige Stelle des Frontends, die das
WASM-Modul anfasst. Dass ausgerechnet die WASM-Grenze undokumentiert war, ist der
beste Beleg dafür, dass eine Konvention ohne Werkzeug nicht hält. Insgesamt
brauchten acht Dateien Nachrüstung; der Endstand ist **fehler- und warnungsfrei**.

Die Regel zahlt doppelt: Dieselben Blöcke sind die Typinformation, aus der die
TypeScript-Prüfung in 7.6 (`checkJs`) ihre Aussagen zieht. Deshalb ist
`require-param-type` mit aktiviert — ein `@param` ohne Typ wäre für `checkJs`
wertlos. Die inhaltliche Verbindung zur allgemeinen Kommentar-Konvention des
Projekts beschreibt Kap. 8.4.

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

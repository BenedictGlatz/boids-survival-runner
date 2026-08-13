# 7 Tooling

`Seitenbudget: ~3 S. | Status: Entwurf, alle Abschnitte geschrieben; 7.6 und 7.10 als begründete Negativbefunde | Quellen: frontend/package.json, frontend/index.html, frontend/dist/, engine/Cargo.toml, .gitignore, git log, CLAUDE.md §Commands`

**Dieses Kapitel wächst pro Commit.** Jeder Werkzeug-Absatz wird in **demselben
Commit** geschrieben, der die Konfiguration einführt. Es gibt kein „dokumentiere ich
später" — später ist der 02.09.

Maßnahmen-IDs siehe [docs/specs-overview.md §3.2](../../docs/specs-overview.md).
Reihenfolge nach Dokumentationswert, geplant als T-01 → T-02 → T-03 → T-05 → T-06 →
T-04. Tatsächlich gelandet ist T-01 → T-03 → T-07 → T-04; T-02, T-05 und T-06 stehen
noch aus. Die Abweichung ist begründet und nicht bloß Gelegenheit: Die
Qualitätsmaßnahmen bedienen zwei Bewertungskriterien gleichzeitig — _Qualität_ als
eigenes Kapitel und „hohe Testabdeckung" im Deliverable _Working Code_ — während
TypeScript und Deployment je nur eines bedienen. T-07 (Unit-Test-Lücken) war
ursprünglich überhaupt nicht geplant und kam hinzu, weil das Coverage-Werkzeug aus
T-03 ohne die Tests, die es messen soll, nur die Hälfte der Anforderung erfüllt.

## 7.1 Scripts in package.json

Alle Frontend-Werkzeuge laufen über npm-Scripts in `frontend/package.json`. Der
Stand nach T-01, T-03, T-07 und T-04:

| Script                | Nutzen                                                          |
| --------------------- | --------------------------------------------------------------- |
| `dev`                 | Baut das WASM-Paket und startet Vite auf Port 5173              |
| `build`               | Produktionsbuild inkl. WASM-Rebuild                             |
| `build:wasm`          | Baut nur das WASM-Paket (`--target web`)                        |
| `preview`             | Liefert den Produktionsbuild lokal aus                          |
| `test`                | Vitest-Suite einmalig                                           |
| `test:watch`          | Vitest im Watch-Modus                                           |
| `test:coverage`       | Vitest mit Coverage-Report (Text, HTML, JSON-Summary)           |
| `test:e2e`            | Playwright gegen den Produktionsbuild; baut und serviert selbst |
| `test:e2e:report`     | Öffnet den erzeugten HTML-Report der letzten E2E-Läufe          |
| `lint`                | ESLint über `frontend/` — muss fehler- und warnungsfrei sein    |
| `lint:fix`            | ESLint mit Autofix                                              |
| `format`              | Prettier schreibend über das gesamte Repository                 |
| `format:check`        | Prettier prüfend — der Modus für die CI                         |
| `docs:ki-verzeichnis` | Erzeugt das KI-Verzeichnis (Kap. 12) aus `ai/*.json`            |
| `docs:check`          | Prüft die Doku-Disziplin (Prompt-Log, Journal, Changelog)       |

Drei in der Planung vorgesehene Scripts fehlen in dieser Tabelle, und zwar nicht aus
Versehen: `typecheck` hängt an T-02 (siehe 7.6 TypeScript), `deploy` an T-06 (siehe 7.10
Deployment), und `docs:diagrams` — die Mermaid-Blöcke der Kapitel nach `rendered/*.svg`
extrahieren — ist ein Werkzeug für den Word-Zusammenbau und wird erst dort gebraucht.
Alle drei sind offene Posten, keine getroffenen Entscheidungen gegen sie.

Drei Details, die die Tabelle nicht zeigt:

**Die Rust-Seite läuft bewusst nicht über npm.** `cargo test`, `cargo clippy` und
`cargo fmt` werden direkt aufgerufen, nicht in npm-Scripts eingewickelt. Ein
Wrapper würde nur einen zweiten Namen für denselben Befehl einführen und dabei
die Fehlerausgabe durch eine weitere Prozess-Ebene schieben; wer an der Engine
arbeitet, ist ohnehin in `engine/`. Die einzige Stelle, an der npm die
Rust-Toolchain wirklich anfasst, ist `build:wasm` — dort ist die Kopplung
erzwungen, weil das Frontend ohne das gebaute WASM-Paket nicht startet.

**`format` und `format:check` tragen `--ignore-path ../.prettierignore`.** Die
Scripts laufen aus `frontend/`, formatieren aber das ganze Repository (`..`).
Prettier sucht seine Ignore-Datei relativ zum _Arbeitsverzeichnis_, nicht relativ
zum Zielpfad — ohne den expliziten Pfad würde es `engine/target/` und `dist/`
mitformatieren. Der Fallstrick ist nicht offensichtlich und hat beim Einrichten
genau einmal zugeschlagen.

**`test:coverage` hat kein Rust-Gegenstück in der Tabelle.** Die Engine-Coverage läuft
mit `cargo llvm-cov --lib` und bleibt damit derselben Linie treu wie `cargo test`. Das
`--lib` ist dabei nicht kosmetisch: Es beschränkt den Lauf auf die
`#[cfg(test)]`-Module und lässt `engine/tests/` aus, das nur unter `wasm-pack`
lauffähig ist. Ohne die Einschränkung würde der Coverage-Lauf abbrechen.

## 7.2 Package Management

Zwei Sprachen bedeuten zwei Paketmanager: **npm** für das Frontend
(`frontend/package.json`), **Cargo** für die Engine (`engine/Cargo.toml`). Beide
verwalten ihre Abhängigkeiten getrennt, beide Lockfiles (`package-lock.json`,
`Cargo.lock`) liegen im Repository, damit ein Build reproduzierbar ist.

**Die Engine hat genau zwei produktive Abhängigkeiten.** `wasm-bindgen` erzeugt die
Bindings, mit denen Rust-Typen über die Sprachgrenze sichtbar werden; `js-sys` liefert
die JavaScript-Standardtypen, die die Bridge dafür braucht — konkret
`js_sys::Float32Array` und `js_sys::Uint32Array`, die Rückgabetypen der sieben
Frame-Buffer (Kap. 5). Beide sind damit keine Bequemlichkeit, sondern die Schnittstelle
selbst. Als Entwicklungsabhängigkeit kommt `wasm-bindgen-test` hinzu, das Gegenstück für
die Grenztests unter `engine/tests/` (Kap. 8.1). Ein `rand`-Crate fehlt bewusst und
dauerhaft: Die Engine leitet jede „zufällige" Entscheidung aus einem Integer-Hash über
ihren Schrittzähler ab, weil Reproduzierbarkeit sowohl die Tests als auch die E2E-Stufe
trägt (Kap. 4).

**Das Frontend hat keine einzige produktive Abhängigkeit.** Die Sektion `dependencies`
ist in `frontend/package.json` nicht leer, sondern gar nicht vorhanden; alle elf Einträge
stehen unter `devDependencies` und sind Werkzeuge: Vite, ESLint samt Plugins, Prettier,
Vitest samt Coverage-Provider, Playwright, `globals`. Zur Laufzeit lädt das Spiel also
außer dem eigenen WASM-Modul nichts nach. Das ist eine Entscheidung und kein Versehen —
alles Sichtbare ist handgeschrieben gegen die Canvas-2D-API, und der Nutzen ist zweifach:
Das ausgelieferte Bundle bleibt klein genug, um in der Rahmenbedingung
„installationslos und serverlos" (Kap. 1) auch beim ersten Laden aufzugehen, und die
Frage „welche Bibliothek zeichnet das" hat im ganzen Projekt keine Antwort, weil sie
sich nicht stellt. Der Preis steht in Kap. 3: Was ein Framework mitbringen würde —
Layout, Zustandsbindung, Komponentenlebenszyklus — ist hier eigener Code.

**Die Verbindungsstelle der beiden Paketwelten ist `wasm-pack`,** und die gehört keinem
von beiden. Das Werkzeug wird über `cargo install wasm-pack` bereitgestellt und ist damit
weder in `package.json` noch in `Cargo.toml` versioniert. Praktische Konsequenz: Es ist
die einzige Toolchain-Anforderung, die ein Lockfile nicht abdeckt, und deshalb steht sie
ausdrücklich in der Befehlsliste (`CLAUDE.md`, README) statt nur implizit im Build zu
stecken. Berührt wird sie von npm-Seite an genau einer Stelle, dem Script `build:wasm`
(siehe 7.8 Dev Build).

Die exakten Versionsnummern beider Seiten stehen im Anhang (Kap. 11.1, Tech Stack Canvas —
Langfassung), nicht hier: Sie veralten schneller als die Begründungen und gehören deshalb
an eine Stelle statt an zwei.

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

| Projektregel                | Umsetzung                                              |
| --------------------------- | ------------------------------------------------------ |
| Keine ungenutzten Variablen | `no-unused-vars`, mit `^_` als Ausnahme-Präfix         |
| `const`/`let` statt `var`   | `no-var` und `prefer-const`                            |
| JSDoc auf öffentlicher API  | `jsdoc/require-jsdoc` und die Inhaltsregeln, siehe 7.5 |

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

| Option          | Wert       | Grund                                                   |
| --------------- | ---------- | ------------------------------------------------------- |
| `singleQuote`   | `true`     | Entspricht dem durchgehenden Stil in `frontend/src`     |
| `trailingComma` | `all`      | Kleinere Diffs beim Anhängen von Argumenten             |
| `printWidth`    | `100`      | Entspricht der bereits gelebten Zeilenbreite            |
| `proseWrap`     | `preserve` | **Wichtig:** schützt die deutsche Prosa dieses Berichts |

`proseWrap: preserve` ist der einzige Wert, der nicht Geschmackssache ist. Prettier
würde Absätze sonst auf `printWidth` umbrechen und damit jede handgesetzte
Zeilenstruktur in `documentation/report/**` bei jedem Formatierungslauf neu
verteilen — Diffs, in denen ein geänderter Halbsatz zwanzig Zeilen anfasst.

**Ort der Konfiguration.** `.prettierrc.json` und `.prettierignore` liegen im
Repository-Wurzelverzeichnis, nicht in `frontend/`, weil Prettiers Zuständigkeit
das ganze Repository ist: die Markdown-Kapitel dieses Berichts, `README.md` und
`CHANGELOG.md` liegen außerhalb von `frontend/`. Prettier löst seine Konfiguration
von der _zu formatierenden Datei_ aus nach oben auf, eine Datei an der Wurzel deckt
damit beide Seiten ohne Duplikat ab. Die _Abhängigkeit_ steht dennoch in
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
   jeder Parameter einen Typ _und_ eine Beschreibung, und ist der Rückgabewert
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

Technisch bemerkenswert ist, _wie_ diese Menge definiert ist. Die naheliegende
Option `publicOnly: true` unterscheidet nur exportiert/nicht exportiert und kennt
die Unterstrich-Konvention des Projekts nicht. Stattdessen steht in der Config eine
Liste von esquery-Selektoren — `JSDOC_REQUIRED_CONTEXTS` —, die „exportierte
Klasse, Methode, kein Konstruktor, Name beginnt nicht mit `_`" ausdrückt. Diese
_eine_ Liste wird von der Vorhandensein- **und** von allen Inhaltsregeln benutzt.
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

**TypeScript ist im Projekt nicht eingerichtet.** Es gibt keine `tsconfig.json`, kein
`typecheck`-Script und keine `.ts`-Datei; das Frontend ist durchgehend JavaScript mit
ES-Modulen. Die Maßnahme T-02 ist geplant und mit 3 h veranschlagt, aber nicht gelandet.
Da Vollständigkeit hier vor Ausführlichkeit geht, wird die Absenz benannt statt
übergangen — samt der Form, in der sie geschlossen werden soll, und dem Preis, den sie
in der Zwischenzeit hat.

**Geplant ist ausdrücklich keine Migration auf `.ts`,** sondern eine `tsconfig.json` mit
`allowJs` und `checkJs`: Der Compiler prüft die vorhandenen `.js`-Dateien und zieht seine
Typinformation aus den JSDoc-Blöcken, die 7.5 ohnehin erzwingt. Kein Dateiumbenennen,
kein zusätzlicher Build-Schritt, kein Transpilat — `tsc` liefe mit `noEmit` allein als
Prüfer. Der Grund für diesen Schnitt ist die oberste Projektregel: Eine Codebasis, die
Studierende beim ersten Kontakt mit Rust und WebAssembly lesen sollen, gewinnt nichts
davon, in einer zweiten neuen Sprache zu stehen. Die Typannotation liegt bereits im
Kommentar, wo sie erklärt statt nur zu deklarieren.

Der wertvollste Fund wäre an der Sprachgrenze zu erwarten. `wasm-pack` erzeugt zum
Glue-Modul eine `.d.ts`-Datei mit den Signaturen aller `#[wasm_bindgen]`-Exporte;
`engine-bridge.js` — die einzige Stelle des Frontends, die das WASM-Modul anfasst
(Kap. 5) — würde damit gegen die tatsächliche Engine-Schnittstelle geprüft, nicht gegen
die Annahme darüber. Eine in Rust umbenannte oder in ihrer Stelligkeit geänderte
Methode fiele dann beim Prüflauf auf und nicht erst als `undefined is not a function`
im Browser — bei einer Bridge, die `snake_case`-Getter in `camelCase`-Felder umschreibt,
ist ein Name auf jeder Seite einmal von Hand geschrieben.

Der Preis der Absenz ist damit auch benannt: Tippfehler in Feldnamen und falsche
Stelligkeiten fallen derzeit erst zur Laufzeit auf. Aufgefangen wird das teilweise von
zwei anderen Stufen — ESLint fängt undefinierte Bezeichner innerhalb eines Moduls, die
E2E-Suite fängt eine gebrochene Bridge, weil ohne sie kein Bild entsteht (Kap. 8.2) —
aber „teilweise" ist der ehrliche Umfang, nicht „ersetzt". Die Priorisierung dahinter
ist die aus der Kapitelvorrede: Die Qualitätsmaßnahmen bedienen zwei
Bewertungskriterien gleichzeitig, die Typprüfung nur eines.

## 7.7 Branch-Struktur

Zwei Branches, mit einer Rollenteilung, die die Namen bereits ankündigen: `main` soll
nur lauffähige, stabile Stände tragen, `dev` ist der Integrationszweig, auf dem
entwickelt wird. Der Remote-`HEAD` zeigt auf `dev`, weil dort die Arbeit liegt.

**Feature-Branches gibt es nicht,** und das ist eine Entscheidung und kein Versäumnis:
Die Historie enthält keinen einzigen Merge-Commit, jede Änderung ist ein eigener,
atomarer Commit direkt auf `dev`. Bei einem Entwickler im Zusammenspiel mit einem
KI-Assistenten hätte ein Branch je Feature keinen Konflikt zu lösen und keine Review zu
beherbergen; er würde eine Ritualform einführen, deren Nutzen — Parallelarbeit
isolieren — hier nicht anfällt. Was die Isolation stattdessen leistet, leistet die
Commit-Disziplin: ein Commit, eine Änderung, eine Zeile im Changelog, eine Zeile im
Journal.

**Der ehrliche Ist-Stand ist gleichzeitig ein negativer Befund:** `main` steht bei einem
einzigen Commit und ist gegenüber `dev` um über einhundert Commits zurück. Der Branch
erfüllt seine zugewiesene Rolle damit derzeit nicht — er trägt keinen stabilen Stand,
sondern einen alten. Ursache ist, dass ein Merge nach `main` bislang keinen Anlass hatte:
Ein Deployment, das aus `main` bauen würde, existiert nicht (siehe 7.10 Deployment), und
`git push` erfolgt in diesem Projekt nur auf ausdrückliche Aufforderung. Vorgesehen ist
der Merge zum Code-Freeze, wo `main` genau die Bedeutung bekommt, die die Abgabe
braucht: der Stand, gegen den bewertet wird.

Die Commit-Konvention ist [Conventional Commits](https://www.conventionalcommits.org/) —
`<type>(<scope>): <description>` mit den Typen `feat`, `fix`, `refactor`, `test`,
`chore`, `docs` und `perf`. Sie ist keine Kosmetik, sondern die Voraussetzung dafür, dass
`CHANGELOG.md` und die Kapitel 09 und 10 aus der Historie heraus belegbar sind statt aus
der Erinnerung.

## 7.8 Dev Build

`npm run dev` ist eine Kette aus zwei Schritten, und die Reihenfolge ist erzwungen:

```
npm run dev  →  npm run build:wasm  →  wasm-pack build ../engine --target web
                                         --out-dir ../frontend/src/wasm/engine
             →  vite   (Dev-Server auf Port 5173)
```

Der WASM-Build läuft **vor** Vite, weil das Frontend ohne das erzeugte Paket nicht
startet: `engine-bridge.js` lädt es per dynamischem `import` aus
`src/wasm/engine/`. Ein vergessener `build:wasm` würde also nicht in einer schlechteren
Version resultieren, sondern in einem Modulfehler beim ersten Bild — die Kopplung als
Script auszudrücken ist deshalb billiger, als sie zu dokumentieren.

**`--target web`, nicht `--target bundler`.** Mit `web` erzeugt `wasm-pack` ein
ES-Modul mit einer `init()`-Funktion, die die `.wasm`-Datei selbst über eine URL nachlädt
(`WebAssembly.instantiateStreaming`). Das ist genau die Form, die Vite ohne
zusätzliches Plugin verarbeitet: Die `.wasm` wird zu einem gewöhnlichen Asset mit
Hash im Namen. `--target bundler` erzeugt stattdessen einen nackten Import der
`.wasm`-Datei als Modul und setzt damit einen Bundler voraus, der WebAssembly-Module als
Modultyp versteht — Vite 5 tut das nicht von sich aus. Die Variante mit `--target
bundler` und Ausgabe nach `engine/pkg/`, die in älteren Fassungen der README stand, ist
damit veraltet; verbindlich ist das Script.

**Das Ausgabeverzeichnis `frontend/src/wasm/` ist gitignoriert.** Es enthält
ausschließlich generierten Code — Glue-Modul, `.d.ts`, `.wasm`-Binärdatei —, der bei
jedem Build neu entsteht. Ihn einzuchecken hätte drei Kosten und keinen Nutzen: eine
Binärdatei in jedem Diff, ein zweiter Wahrheitsort neben `engine/src/`, und die
Möglichkeit eines Stands, in dem eingecheckte Bindings und Rust-Quelle
auseinanderlaufen. Zwei Konsequenzen daraus stehen an anderer Stelle: ESLint nimmt das
Verzeichnis aus (7.3), und die Coverage-Messung ebenso (Kap. 8.1).

## 7.9 Production Build

`npm run build` ist dieselbe Kette mit `vite build` am Ende; `npm run preview` liefert
das Ergebnis lokal aus. Erzeugt wird `frontend/dist/` mit gehashten Bündeln unter
`assets/` — je eine JavaScript- und CSS-Datei für das Spiel, das Glue-Modul und die
`.wasm`-Binärdatei — sowie den unverändert kopierten Verzeichnissen `locales/` und
`fonts/` aus `public/`.

**Es gibt keine `vite.config.js`.** Die Standardannahmen treffen zu: `index.html` liegt
im Projektwurzelverzeichnis von Vite, die Module hängen von dort im Graph, Ausgabe geht
nach `dist/`. Eine Konfigurationsdatei ohne Inhalt anzulegen, nur damit eine existiert,
wäre eine Attrappe.

Für ein Deployment unter einem Unterpfad wird sie allerdings gebraucht, und der Grund
ist im gebauten Artefakt nachweisbar: Die erzeugte `index.html` verweist auf
`/assets/index-….js` — **absolut**, ab Domainwurzel. Unter der GitHub-Pages-Adresse
`…github.io/<repo>/` zeigt dieser Pfad neben das Bundle und liefert eine 404. Der Locale-
Abruf in `ui/i18n.js` benutzt dagegen `./locales/en.json` und würde weiter funktionieren
— beide Hälften derselben Seite verhalten sich also unterschiedlich, was einen solchen
Fehler unangenehm zu diagnostizieren macht. `base: '/<repo>/'` in einer
`vite.config.js` ist deshalb der erste Schritt von T-06 und nicht ein Detail daran.

`npm run preview` ist zusätzlich kein bloßes Kontrollinstrument, sondern eine
Teststufe: Die Playwright-Suite baut und serviert sich diesen Stand selbst und läuft
gegen ihn statt gegen den Dev-Server. Die Begründung und der Fehler, der sie erzwungen
hat, stehen in Kap. 8.2 E2E Tests.

## 7.10 Deployment

**Ein Deployment existiert nicht.** Das Spiel ist installationslos — es läuft aus dem
`dist/`-Verzeichnis über jeden statischen Webserver, und `vite preview` genügt zur
Vorführung —, aber es ist nirgends öffentlich veröffentlicht. T-06 ist mit 3 h geplant
und offen. Wie in 7.6 ist die Absenz hier benannt statt ausgelassen, und aus demselben
Grund: Die Reihenfolge der Tooling-Maßnahmen wurde nach Beitrag zu den
Bewertungskriterien gewählt, und ein Deployment bedient eines davon.

**Vorgesehen ist GitHub Pages,** deployt aus der Pipeline aus Kap. 8.3. Die Begründung
ist der Rahmenbedingung aus Kap. 1 direkt entnommen: Gefordert ist eine Anwendung ohne
Installation und ohne Server. Das gebaute Artefakt ist ein statisches Bündel plus eine
`.wasm`-Datei, es braucht keine Laufzeit, keine Datenbank und keine Sitzungsverwaltung —
Persistenz gibt es keine (Kap. 3.6). Pages liefert statische Dateien aus dem Repository,
das den Code ohnehin hält, kostet nichts und braucht keine zusätzliche Zugangsverwaltung.

**Alternativen wurden nicht evaluiert,** und das ist eine Entscheidung mit Grund und
nicht eine Lücke in der Recherche: Bei einem statischen Bündel unterscheiden sich
Netlify, Vercel, Cloudflare Pages und GitHub Pages in nichts, was für dieses Projekt
messbar wäre. Der einzige Unterschied, der zählen würde, ist die Nähe zum Repository, und
die spricht für Pages.

Zwei Fallstricke sind bekannt, bevor die Maßnahme beginnt:

- **Der `base`-Pfad.** Pages liefert unter `…github.io/<repo>/` aus, die gebauten
  Asset-Verweise sind absolut. Ohne `base` in einer `vite.config.js` lädt die Seite leer.
  Beleg und Wirkung stehen in 7.9 Production Build.
- **Der MIME-Type der `.wasm`-Datei.** `WebAssembly.instantiateStreaming` verlangt
  `application/wasm`. GitHub Pages setzt ihn korrekt; ein beliebiger anderer Server
  möglicherweise nicht. Bemerkenswert ist, wie dieser Fehler auftreten würde: Das
  generierte Glue-Modul fängt ihn ab, weicht auf das langsamere
  `WebAssembly.instantiate` über einen `arrayBuffer` aus und schreibt eine
  **Warnung** in die Konsole. Das Spiel läuft also — nur langsamer beim Start. Und weil
  `boot.spec.js` ausschließlich Konsolen-_Fehler_ sammelt, würde auch die E2E-Suite grün
  bleiben. Eine Fehlkonfiguration dieser Art fällt damit nur auf, wenn man in die
  Konsole sieht, und das ist der Grund, sie hier festzuhalten.
